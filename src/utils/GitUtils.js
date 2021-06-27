const path = require('path');
const fs = require('fs');
const Git = require('simple-git/promise');
const c = require('ansi-colors');
const { showText, wrapAccentColour } = require('../utils/print-utils');
const RepoUtils = require('../utils/RepoUtils');
const SubModuleUtils = require('../utils/SubModuleUtils');
const { wait, getCurrentBranchFromBranchSummary } = require('../utils/generic');

const { allSubmodules } = require('../utils/generic');

// Supply default path to avoid an issue coming from `git ls-remote repo`
const DEFAULT_PATH = '/';

class GitUtils {
  static async listModules(gitPath, excludedRepos = []) {
    const git = Git(gitPath);
    git.silent(true);
    let modules = [];
    try {
      modules = await git.subModule(['status']);
    } catch (err) {
      showText(`Found error from 'git submodule status' - Err: ${err.message}`);
      process.exit(1);
    }
    const out = (modules
        && modules.split('\n').map((module) => {
          const [commit, name, pointer] = module.trim().split(' ');
          const fullPath = name ? path.join(gitPath, name) : '';
          return {
            commit,
            name,
            fullPath,
            pointer,
          };
        }))
      || [];
    const repos = out.filter(o => o.name);

    // return repos.filter(m => m.name.indexOf('quriosity_adminportal_light') === 0);

    // Exclude the specified repos
    const selected = repos.filter(m => excludedRepos.indexOf(m.name) === -1);
    return selected;
  }

  static async safeToPull(fullPath) {
    const git = Git(fullPath);
    let modified;
    let status = await git.status();

    // If there is a local change in all submodules, just reset it
    const submodules = await GitUtils.checkSubmodules(fullPath);
    modified = (status && status.modified) || [];
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
  static async checkSubmodules(parentRepoPath) {
    const git = Git(parentRepoPath);
    const list = await git.subModule(['status']);
    const arr = list.split('\n');
    const items = arr
      .map(m => m.split(' ').map(i => i.trim()))
      .filter(r => r.length === 3);
    const out = items.map(m => m[1]);
    return out;
  }

  static async getStatus(modules) {
    const promises = modules.map(async (module) => {
      const { fullPath } = module;
      const git = Git(fullPath);

      // Get current branch info
      const branchInfo = await git.branch();
      const status = await git.status();
      const { current } = branchInfo;
      const currentBranch = (status && status.current) || '';
      const currentRemoteBranch = (status && status.tracking) || '';

      // console.log(module.fullPath, currentBranch.commit, currentRemoteBranch.commit);
      const matchedRemoteBranch = !!(
        currentBranch
        && currentRemoteBranch
        && currentBranch.commit === currentRemoteBranch.commit
      );

      const hasLocalChanges = !!(
        status.modified.length || status.deleted.length
      );
      const hasNewFiles = !!status.files.length;

      const upToDated = matchedRemoteBranch && !hasLocalChanges && !hasNewFiles;
      return {
        fullPath: module.fullPath,
        current,
        // matchedRemoteBranch: wrapAccentColour(matchedRemoteBranch, false),
        detached: branchInfo.detached,
        hasLocalChanges: wrapAccentColour(hasLocalChanges, true),
        hasNewFiles: wrapAccentColour(hasNewFiles, true),
        upToDated,
      };
    });
    const allResponses = await Promise.all(promises);
    return allResponses;
  }

  static async checkAndInitialiseSubmodules(gitPath) {
    try {
      const modules = await SubModuleUtils.readModuleFiles(gitPath);
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
      const names = newRepos.map(r => r.name);
      if (newRepos.length) {
        showText(
          c.green(`Found new GIT submodule(s) - ${c.red(names.join(', '))}\n`),
        );
        showText(
          [
            'Please initialise new submodules.',
            'You can run "git submodule update --init --recursive"',
          ].join(' '),
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
  static async checkoutLatestSubmodules(modules, branch) {
    // Ensure all submodule have uncommitted works before proceeding next (except handy submodule)
    const safeToPullPromises = modules.map(async module => GitUtils.safeToPull(module.fullPath));
    const allResponses = await Promise.all(safeToPullPromises);
    const unsafe = allResponses.filter(r => !r.safe);
    if (unsafe && unsafe.length) {
      const repos = unsafe.map(r => r.fullPath).join(', ');
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

    // Each repo, checkout the given branch ('develop')
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
        git.silent(true); // suppress the error inside the module itself, treat it ourselves
        let branchInfo = await git.branchLocal();
        let { current } = branchInfo;
        const { commit } = getCurrentBranchFromBranchSummary(branchInfo);

        // 2) Checkout the latest `utils` submodule first
        // This applies for a few ML services
        if (RepoUtils.autoCommit(module.name)) {
          // Checkout the latest develop branch and commit if there is a new change
          await GitUtils.checkoutAndCommitSubmodules(fullPath, git, branch);
        }

        // 3) Work out the current branch
        const onCurrentBranch = current === branch;
        const newBranch = branchInfo.all.indexOf(branch) === -1;
        if (!onCurrentBranch && newBranch) {
          // Create a local branch
          await GitUtils.createBranchAndCheckout(branch, git);
        } else {
          // checkout branch
          await git.checkout(branch);
        }

        showText(
          [
            `Pulling commits on a ${c.red(branch)} branch of '${c.green(
              name,
            )}' submodule`,
            !onCurrentBranch ? `It was previously on ${c.red(current)}` : '',
          ].join('. '),
        );

        // 4) Checkout the latest on the given branch
        branchInfo = await git.branch();
        current = branchInfo && branchInfo.current;
        if (current === branch) {
          // Merge the branch to ensure the local commit is at the latest
          try {
            await git.pull('origin', branch, { '--rebase': 'false' });
          } catch (err) {
            throw err;
          }

          // 4.1) Capture latest utils module if there are some changes
          if (RepoUtils.autoCommit(module.name)) {
            await git.add('quriosity_utils');
            await git.commit('Updated Sha: quriosity_utils', [
              'quriosity_utils',
            ]);
            showText(
              `Commit submodule update on ${c.red(module.name)} submodule`,
            );
          }

          // 4.2) Leave any uncommitted works here

          // 4.3) Push the change
          const status = await git.status();
          const hasLocalCommits = GitUtils.hasSomeChangesToPush(status);
          if (hasLocalCommits) {
            await git.push('origin', branch);
          }

          // Capture if we detect a new change from this repo
          branchInfo = await git.branch();
          const newCurrentBranchObj = getCurrentBranchFromBranchSummary(
            branchInfo,
          );
          const newCommit = newCurrentBranchObj && newCurrentBranchObj.commit;

          if (newCommit !== commit) {
            res.hasNewChanges = true;
          }

          res.status = true;
        } else {
          res.message = `Unable to checkout ${branch}`;
        }
      } catch (err) {
        const knownIssue = err.message.indexOf('Cannot rebase onto multiple branches') !== -1;
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
  static async checkoutLatestHandySubmodule(modulePath, branch) {
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
  static async commitLatestSubModules(repoPath, branch = 'master') {
    const res = {
      status: false,
    };
    const git = new Git(repoPath);

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
    let stackStatus = await git.status();
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
      git.commit(commitMessage);

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
  static async validateBranchOrTag(repo, branch, tag) {
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
        const foundBranch = typeof branchesAndTags[branch] !== 'undefined';

        const tagKeyAnnotated = `tags/${tag}`; // Annotated tag SHA or actual commit SHA
        const tagKey = `${tagKeyAnnotated}^{}`; // Actual commit SHA if tag was created by `git tag -a tag-name`
        const foundAnnotatedTag = typeof branchesAndTags[tagKeyAnnotated] !== 'undefined';
        const foundActualCommitTag = typeof branchesAndTags[tagKey] !== 'undefined';
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
  static async parseBranchStr(branchesStr, removeRemoteBranchName = true) {
    const tmpBranches = branchesStr.split(/\r|\r\n|\n/);
    const branches = {};
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
  static hasSomeChangesToPush(status) {
    const { ahead } = status;
    return ahead > 0;
  }

  static hasFileChanges(stackStatus) {
    const { modified } = stackStatus;
    if (modified.length) {
      // naive search for a `.` in the file name, don't need to compare with sub modules
      const files = modified.filter(r => r.indexOf('.') !== -1);
      return files;
    }
    return [];
  }

  static async hasNewCommits(handyModulePath) {
    const git = new Git(handyModulePath);
    const status = await git.status();
    const { modified, ahead } = status;
    return ahead > 0 || modified.length === 0;
  }

  /**
   * Return current folder
   * @returns {*}
   */
  static getCurrentFolder() {
    return process.cwd();
  }

  /**
   * Check out submodule
   * @param fullPath
   * @param git
   * @param branchName
   * @returns {Promise<null>}
   */
  static async checkoutAndCommitSubmodules(fullPath, git, branchName) {
    try {
      const gitSubmodules = await git.subModule(['status']);
      const submodules = GitUtils.parseSubmodules(gitSubmodules);

      // Checkout latest quriosity utils
      const quriosityUtils = submodules.filter(r => r.isQuriosityUtils);
      if (submodules.length && quriosityUtils.length) {
        // Assume it's only one
        const module = quriosityUtils.pop();
        const submodulePath = path.join(fullPath, module.name);
        const utilGitRepo = new Git(submodulePath);

        // Create && checkout develop
        const branchInfo = await utilGitRepo.branchLocal();
        const isOnCurrentBranch = branchInfo.current === branchName;
        const hasLocalBranch = GitUtils.hasLocalBranch(branchInfo, branchName);

        // If not on develop branch but have local branch, checkout develop branch
        if (hasLocalBranch && !isOnCurrentBranch) {
          await utilGitRepo.checkout(branchName);
        }
        if (!hasLocalBranch) {
          await GitUtils.createBranchAndCheckout(branchName, utilGitRepo);
        }

        // Pull latest
        await utilGitRepo.pull('origin', branchName, { '--no-rebase': null });
      }
    } catch (err) {
      throw err;
    }
    return null;
  }

  static parseSubmodules(gitSubmodules) {
    const lines = gitSubmodules.split('\n').filter(r => r !== '');
    if (lines.length) {
      const modules = lines.map((module) => {
        const [sha, name, branch] = module.trim().split(' ');
        const isQuriosityUtils = name === 'quriosity_utils';
        return {
          sha,
          name,
          branch,
          isQuriosityUtils,
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
  static hasLocalBranch(branchInfo, branch) {
    const { all } = branchInfo;
    return all.some(r => r === branch);
  }

  static async createBranchAndCheckout(branchName, git) {
    try {
      const startPoint = `origin/${branchName}`;
      await git.checkoutBranch(branchName, startPoint);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = GitUtils;
