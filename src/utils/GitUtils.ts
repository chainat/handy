import * as path from 'path';
import * as fs from 'fs';
import Git, { BranchSummary, SimpleGit, StatusResult } from 'simple-git';
import c from 'ansi-colors';
import { showText, wrapAccentColour } from './print-utils';
import { SubModuleUtils } from './SubModuleUtils';
import { wait, getCurrentBranchFromBranchSummary } from './generic';

import { allSubmodules } from './generic';

// Supply default path to avoid an issue coming from `git ls-remote repo`
const DEFAULT_PATH = '/';

/**
 * GitUtils class
 */
class GitUtils {
  static async listModules(
    gitPath: string,
    excludedRepos: string[] = []
  ): Promise<GitModuleStatus[]> {
    const git: SimpleGit = Git(gitPath);
    let modules: string;
    try {
      modules = await git.subModule(['status']);
    } catch (err) {
      showText(
        `Found error from 'git submodule status' - Err: ${err?.message}`
      );
      process.exit(1);
    }
    // Check status of all modules
    const out =
      (modules &&
        modules.split('\n').map((module) => {
          const [commit, name, pointer] = module.trim().split(' ');
          const fullPath = name ? path.join(gitPath, name) : '';
          return {
            commit,
            name,
            path: fullPath,
            fullPath,
            pointer,
          };
        })) ||
      [];
    const repos = out.filter((o) => o.name);

    // Exclude the specified repos
    const selected = repos.filter((m) => excludedRepos.indexOf(m.name) === -1);
    return selected;
  }

  static async safeToPull(fullPath: string) {
    const git: SimpleGit = Git(fullPath);
    let modified;
    let status: StatusResult = await git.status();

    // If there is a local change in all submodules, just reset it
    const submodules = await GitUtils.checkSubmodules(fullPath);
    modified = status?.modified ?? [];
    if (modified && submodules) {
      const matchedAll = allSubmodules(modified, submodules);
      if (matchedAll) {
        // Reset submodules
        await git.submoduleUpdate();
        status = await git.status();
      }
    }

    modified = (status && status.modified) || [];

    const { deleted, created } = status;
    const safe = !(deleted.length || modified.length);
    return {
      fullPath,
      safe,
      created,
      deleted,
      modified,
    };
  }

  /**
   * List submodule under the given path
   * @param parentRepoPath
   * @returns {Promise<string[]>}
   */
  static async checkSubmodules(parentRepoPath: string) {
    const git = Git(parentRepoPath);
    const list = await git.subModule(['status']);
    const arr = list.split('\n');
    const items = arr
      .map((m) => m.split(' ').map((i) => i.trim()))
      .filter((r) => r.length === 3);
    const out = items.map((m) => m[1]);
    return out;
  }

  /**
   * Show git status
   * @param modules
   * @returns
   */
  static async getStatus(modules: GitModuleStatus[]): Promise<RepoStatus[]> {
    const promises = modules.map(async (module) => {
      const { fullPath } = module;
      const git = Git(fullPath);

      // Get current branch info
      const branchInfo = await git.branch();
      const status: StatusResult = await git.status();
      const { current } = branchInfo;
      const currentBranch = status?.current ?? '';
      // recently, Simple-get start to add `origin/` on the remote branch
      const currentRemoteBranch =
        status?.tracking?.replace('origin/', '') ?? '';

      // console.log(module.fullPath, currentBranch.commit, currentRemoteBranch.commit);
      const matchedRemoteBranch = !!(
        currentBranch &&
        currentRemoteBranch &&
        currentBranch === currentRemoteBranch
      );

      const hasLocalChanges = !!(
        status.modified.length || status.deleted.length
      );
      const hasNewFiles = !!status.files.length;

      const latest = matchedRemoteBranch && !hasLocalChanges && !hasNewFiles;
      return {
        fullPath: module.fullPath,
        current,
        // matchedRemoteBranch: wrapAccentColour(matchedRemoteBranch, false),
        detached: branchInfo.detached,
        hasLocalChanges: wrapAccentColour(hasLocalChanges.toString(), 'true'),
        hasNewFiles: wrapAccentColour(hasNewFiles.toString(), 'true'),
        latest: wrapAccentColour(latest.toString(), 'false'),
      } as RepoStatus;
    });
    const allResponses = await Promise.all(promises);
    return allResponses;
  }

  /**
   * Initialise submodule if needed
   * @param gitPath
   * @returns
   */
  static async checkAndInitialiseSubmodules(gitPath: string) {
    try {
      const modules = await SubModuleUtils.readModuleFiles(gitPath);

      // Validate if the git part exists
      const promises = modules.filter((module) => {
        const fullPath = path.join(gitPath, module.path);
        if (fs.existsSync(fullPath)) {
          const dirInfo = fs.readdirSync(fullPath);
          // const exists = stats.isDirectory();
          const emptyFolder = dirInfo.length === 0;
          const exists = fs.existsSync(fullPath);
          return !exists || emptyFolder;
        }
        return true;
      });

      const newRepos = await Promise.all(promises);
      const names = newRepos.map((r) => r.name);
      if (newRepos.length) {
        showText(
          c.green(`Found new GIT submodule(s) - ${c.red(names.join(', '))}\n`)
        );
        showText(
          [
            'Please initialise new submodules.',
            'You can run "git submodule update --init --recursive"',
          ].join(' ')
        );
        process.exit(1);
      }
      return true;
    } catch (err) {
      showText(c.red(`Error initialising submodules: ${err.message}`));
      throw err;
    }
  }

  /**
   * Checkout all submodules and commit the main stack
   * @param modules
   * @param branch
   * @returns {Promise<*>}
   */
  static async checkoutLatestSubmodules(
    modules: GitModuleInfo[],
    branch: string
  ): Promise<any[]> {
    // Ensure all submodule have uncommitted works before proceeding next (except handy submodule)
    const safeToPullPromises = modules.map(async (module) =>
      GitUtils.safeToPull(module.fullPath)
    );
    const allResponses = await Promise.all(safeToPullPromises);
    const unsafe = allResponses.filter((r) => !r.safe);
    if (unsafe && unsafe.length) {
      const repos = unsafe.map((r) => r.fullPath).join(', ');
      const len = unsafe.length;
      return [
        {
          status: false,
          errorType: 'local-changes',
          message: [
            `There are some changes in ${len} repo(s) and it's not safe to go ahead.`,
            `You should commit files first, repos: ${repos}`,
          ].join(' '),
        },
      ];
    }

    // Each repo, checkout the given branch ('qa' or 'develop')
    const promises = modules.map(async (module) => {
      const { fullPath, name } = module;
      const res = {
        name,
        status: false,
        hasNewChanges: false,
        fullPath,
        message: '',
      };
      try {
        // 1) Open current repo
        const git = Git(fullPath);
        let branchInfo = await git.branch(['-v', '-a']);
        let { current } = branchInfo;
        const { commit } = getCurrentBranchFromBranchSummary(branchInfo) ?? {};

        // 2) skip

        // 3) Work out the current branch
        const onCurrentBranch = current === branch;
        // if (fullPath.indexOf('byb-api') !== -1) {
        //   console.log(fullPath, branchInfo, 'b', branch);
        // }

        const newBranch = branchInfo.all.indexOf(branch) === -1;
        if (!onCurrentBranch && newBranch) {
          // Create a local branch
          await GitUtils.createBranchAndCheckout(branch, git, fullPath);
        } else {
          // checkout branch
          await git.checkout(branch);
        }

        showText(
          [
            `Pulling commits on a ${c.red(branch)} branch of '${c.green(
              name
            )}' submodule`,
            !onCurrentBranch ? `It was previously on ${c.red(current)}` : '',
          ].join('. ')
        );

        // 4) Checkout the latest on the given branch
        branchInfo = await git.branch();
        current = branchInfo && branchInfo.current;
        if (current === branch) {
          // Merge the branch to ensure the local commit is at the latest
          try {
            await git.pull('origin', branch, { '--rebase': 'false' });
          } catch (err) {
            showText(
              `Unable to pull the repo ${fullPath} due to ${err.message}`
            );
            throw err;
          }

          // 4.3) Push the change
          const status = await git.status();
          const hasLocalCommits = GitUtils.hasSomeChangesToPush(status);
          if (hasLocalCommits) {
            await git.push('origin', branch);
          }

          // Capture if we detect a new change from this repo
          branchInfo = await git.branch();
          const newCurrentBranchObj =
            getCurrentBranchFromBranchSummary(branchInfo);
          const newCommit = newCurrentBranchObj && newCurrentBranchObj?.commit;

          if (newCommit !== commit) {
            res.hasNewChanges = true;
          }

          res.status = true;
        } else {
          res.message = `Unable to checkout ${branch}`;
        }
      } catch (err) {
        const knownIssue =
          err?.message.indexOf('Cannot rebase onto multiple branches') !== -1;
        if (knownIssue) {
          res.message = `Found a GIT rebasing issue in '${module.name}' module.`;
        } else {
          res.message = err.message;
        }
      }
      return res;
    });
    return Promise.all(promises);
  }

  /**
   * Checkout handy submodule
   * @param modulePath
   * @returns {Promise<void>}
   */
  static async checkoutLatestHandySubmodule(
    modulePath: string,
    branch: string
  ) {
    const fullPath = modulePath;
    const res = {
      status: false,
      fullPath,
      message: '',
    };
    try {
      const git = Git(fullPath);
      let branchInfo = await git.branch();
      let { current } = branchInfo;

      if (current !== branch && branchInfo.all.indexOf(branch) !== -1) {
        // checkout branch
        await git.checkout(branch);
      }

      // Checkout the latest
      branchInfo = await git.branch();
      current = branchInfo && branchInfo.current;
      if (current === branch) {
        // Rebase the branch to ensure the local commit is at the latest
        await git.pull('origin', branch, { '--rebase': 'true' });

        // Reset the submodule
        await git.submoduleUpdate();

        // Push the current branch to develop
        const status = await git.status();
        const hasLocalCommits = GitUtils.hasSomeChangesToPush(status);
        if (hasLocalCommits) {
          await git.push('origin', branch);
        }
        res.status = true;
      } else {
        res.message = `Unable to checkout ${branch}`;
      }
    } catch (err) {
      res.message = `Repo: ${fullPath}, ${err.message}`;
    }
    return res;
  }

  /**
   * At the `platform`, list for a file changes and commit them
   * @param repoPath
   * @returns {Promise<boolean>}
   */
  static async commitLatestSubModules(repoPath: string, branch = 'master') {
    const res: GitCommitResponse = {
      status: false,
    };
    const git = Git(repoPath);

    // 1) Confirm branch
    let branchInfo = await git.branch();
    let current = branchInfo && branchInfo.current;
    if (current !== branch) {
      // 1.1) Checkout master
      await git.checkout(branch);

      // 1.2) Confirm if we are on the branch
      branchInfo = await git.branch();
      current = branchInfo && branchInfo.current;
      if (current !== branch) {
        res.message = `Unable to checkout a ${branch} on the main stack`;
        return res;
      }
    }

    // 2) Check status
    let stackStatus: StatusResult = await git.status();
    const fileChanges = GitUtils.hasFileChanges(stackStatus);
    if (fileChanges.length) {
      res.message = [
        `You have some uncommitted changes - ${fileChanges.join(', ')}.`,
        'Please make a commit first.',
      ].join(' ');
      return res;
    }

    // 3) Pull the latest and rebase with the existing commits if available
    await git.pull('origin', branch, { '--rebase': 'true' });

    // Re-check status again so that we know what files are to be committed
    await wait(3000);
    stackStatus = await git.status();

    const { modified } = stackStatus;
    // 4) Make a commit
    if (modified) {
      // Add all module and files from the current change
      git.add(modified);

      const commitMessage = [
        'Captured the latest submodules/updated files: ',
        modified.join(', '),
      ].join('');
      // Commit changes
      const result = git.commit(commitMessage);

      // Push
      git.push('origin', branch);

      res.message = commitMessage;
      res.status = true;
    } else {
      res.message = 'Your change is latest. No new commits';
      res.status = true;
    }

    return res;
  }

  /**
   * Validate the existent of branch or tag
   * @param repo
   * @param branch
   * @param tag
   * @returns {Promise.<{status: boolean, sha: string}>}
   */
  static async validateBranchOrTag(repo: string, branch: string, tag: string) {
    const result = {
      status: false,
      sha: '',
      deployingType: branch !== '' ? 'branch' : 'tag',
      repo,
      branchOrTag: branch || tag,
    };
    try {
      // Use ls-remote to show remote branches and tags
      const branchesStr = await Git(DEFAULT_PATH).listRemote([repo]);
      // console.log(branchesStr);
      if (branchesStr) {
        const branchesAndTags = await GitUtils.parseBranchStr(branchesStr);
        const foundBranch = typeof branchesAndTags?.[branch] !== 'undefined';

        const tagKeyAnnotated = `tags/${tag}`; // Annotated tag SHA or actual commit SHA
        const tagKey = `${tagKeyAnnotated}^{}`; // Actual commit SHA if tag was created by `git tag -a tag-name`
        const foundAnnotatedTag =
          typeof branchesAndTags[tagKeyAnnotated] !== 'undefined';
        const foundActualCommitTag =
          typeof branchesAndTags[tagKey] !== 'undefined';
        result.status = foundBranch !== false || foundAnnotatedTag !== false;
        if (foundBranch) {
          result.sha = branchesAndTags[branch];
        } else if (foundAnnotatedTag && !foundActualCommitTag) {
          result.sha = branchesAndTags[tagKeyAnnotated];
        } else if (foundAnnotatedTag && foundActualCommitTag) {
          result.sha = branchesAndTags[tagKey];
        }
      }
    } catch (err) {
      const message = `Unable to parse list branches for ${repo}, err: ${err.message}`;
      global.logger.warn(message);
      throw new Error(message);
    }
    return result;
  }

  /**
   * Parse branch info into object with remoteBranchName
   * - Added support for parsing tags as well i.e. tags/rc74.0
   * @param branchesStr
   * @returns {Promise.<object>}
   */
  static async parseBranchStr(
    branchesStr: string,
    removeRemoteBranchName = true
  ): Promise<SimpleObject> {
    const tmpBranches = branchesStr.split(/\r|\r\n|\n/);
    const branches: SimpleObject = {};

    tmpBranches.forEach((line) => {
      const [sha, remoteBranchName] = line.split(/\t|[\s]{8}/); // i.e. 27a7ab120a875b21605b531173f9f1db6464ddb4 refs/remotes/origin/feature/test-branch
      if (typeof remoteBranchName !== 'undefined') {
        // Get branch or tag
        let branchName = '';
        if (remoteBranchName.indexOf('refs/heads') !== -1) {
          // Branch
          branchName = removeRemoteBranchName
            ? remoteBranchName.replace('refs/heads/', '')
            : remoteBranchName;
        } else {
          // Tag, want to leave `tags/` prefix in the key, avoid key collision issue
          branchName = removeRemoteBranchName
            ? remoteBranchName.replace('refs/tags/', 'tags/')
            : remoteBranchName;
        }
        branches[branchName] = sha;
      }
    });
    return branches;
  }

  /**
   * We could skip the push if the local change match the remote branch
   * Assume that you have pull the latest and your local are not behind the remote
   * @param status
   * @returns {Promise<boolean>}
   */
  static hasSomeChangesToPush(status: StatusResult) {
    const { ahead } = status;
    return ahead > 0;
  }

  static hasFileChanges(stackStatus: StatusResult) {
    const { modified } = stackStatus;
    if (modified.length) {
      // naive search for a `.` in the file name, don't need to compare with sub modules
      const files = modified.filter((r) => r.indexOf('.') !== -1);
      return files;
    }
    return [];
  }

  static async hasNewCommits(handyModulePath: string) {
    const git = Git(handyModulePath);
    const status = await git.status();
    const { modified, ahead } = status;
    return ahead > 0 || modified.length === 0;
  }

  /**
   * Return current folder
   * @returns {*}
   */
  static getCurrentFolder() {
    return '/Users/chainat/dev/platform';
    // return process.cwd();
  }

  static parseSubmodules(gitSubmodules: string) {
    const lines = gitSubmodules.split('\n').filter((r) => r !== '');
    if (lines.length) {
      const modules = lines.map((module) => {
        const [sha, name, branch] = module.trim().split(' ');
        return {
          sha,
          name,
          branch,
        };
      });
      return modules;
    }
    return [];
  }

  /**
   * Return if the repo has this branch locally
   * @param branchInfo
   * @param branch
   * @returns {*}
   */
  static hasLocalBranch(branchInfo: BranchSummary, branch: string) {
    const { all } = branchInfo;
    return all.some((r) => r === branch);
  }

  static async createBranchAndCheckout(
    branchName: string,
    git: SimpleGit,
    fullPath = ''
  ) {
    try {
      const startPoint = `origin/${branchName}`;
      await git.checkoutBranch(branchName, startPoint);
    } catch (err) {
      const customErr = new Error(
        `Unable to create "${branchName}" for ${fullPath} due to this error - ${err.message}`
      );
      throw customErr;
    }
  }
}

export { GitUtils };
