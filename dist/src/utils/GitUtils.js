"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitUtils = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const simple_git_1 = __importDefault(require("simple-git"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const print_utils_1 = require("./print-utils");
const SubModuleUtils_1 = require("./SubModuleUtils");
const generic_1 = require("./generic");
const generic_2 = require("./generic");
// Supply default path to avoid an issue coming from `git ls-remote repo`
const DEFAULT_PATH = '/';
/**
 * GitUtils class
 */
class GitUtils {
    static listModules(gitPath, excludedRepos = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const git = (0, simple_git_1.default)(gitPath);
            let modules;
            try {
                modules = yield git.subModule(['status']);
            }
            catch (err) {
                (0, print_utils_1.showText)(`Found error from 'git submodule status' - Err: ${err === null || err === void 0 ? void 0 : err.message}`);
                process.exit(1);
            }
            // Check status of all modules
            const out = (modules &&
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
        });
    }
    static safeToPull(fullPath) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const git = (0, simple_git_1.default)(fullPath);
            let modified;
            let status = yield git.status();
            // If there is a local change in all submodules, just reset it
            const submodules = yield GitUtils.checkSubmodules(fullPath);
            modified = (_a = status === null || status === void 0 ? void 0 : status.modified) !== null && _a !== void 0 ? _a : [];
            if (modified && submodules) {
                const matchedAll = (0, generic_2.allSubmodules)(modified, submodules);
                if (matchedAll) {
                    // Reset submodules
                    yield git.submoduleUpdate();
                    status = yield git.status();
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
        });
    }
    /**
     * List submodule under the given path
     * @param parentRepoPath
     * @returns {Promise<string[]>}
     */
    static checkSubmodules(parentRepoPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const git = (0, simple_git_1.default)(parentRepoPath);
            const list = yield git.subModule(['status']);
            const arr = list.split('\n');
            const items = arr
                .map((m) => m.split(' ').map((i) => i.trim()))
                .filter((r) => r.length === 3);
            const out = items.map((m) => m[1]);
            return out;
        });
    }
    /**
     * Show git status
     * @param modules
     * @returns
     */
    static getStatus(modules) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = modules.map((module) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                const { fullPath } = module;
                const git = (0, simple_git_1.default)(fullPath);
                // Get current branch info
                const branchInfo = yield git.branch();
                const status = yield git.status();
                const { current } = branchInfo;
                const currentBranch = (_a = status === null || status === void 0 ? void 0 : status.current) !== null && _a !== void 0 ? _a : '';
                // recently, Simple-get start to add `origin/` on the remote branch
                const currentRemoteBranch = (_c = (_b = status === null || status === void 0 ? void 0 : status.tracking) === null || _b === void 0 ? void 0 : _b.replace('origin/', '')) !== null && _c !== void 0 ? _c : '';
                // console.log(module.fullPath, currentBranch.commit, currentRemoteBranch.commit);
                const matchedRemoteBranch = !!(currentBranch &&
                    currentRemoteBranch &&
                    currentBranch === currentRemoteBranch);
                const hasLocalChanges = !!(status.modified.length || status.deleted.length);
                const hasNewFiles = !!status.files.length;
                const latest = matchedRemoteBranch && !hasLocalChanges && !hasNewFiles;
                return {
                    fullPath: module.fullPath,
                    current,
                    // matchedRemoteBranch: wrapAccentColour(matchedRemoteBranch, false),
                    detached: branchInfo.detached,
                    hasLocalChanges: (0, print_utils_1.wrapAccentColour)(hasLocalChanges.toString(), 'true'),
                    hasNewFiles: (0, print_utils_1.wrapAccentColour)(hasNewFiles.toString(), 'true'),
                    latest: (0, print_utils_1.wrapAccentColour)(latest.toString(), 'false'),
                };
            }));
            const allResponses = yield Promise.all(promises);
            return allResponses;
        });
    }
    /**
     * Initialise submodule if needed
     * @param gitPath
     * @returns
     */
    static checkAndInitialiseSubmodules(gitPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const modules = yield SubModuleUtils_1.SubModuleUtils.readModuleFiles(gitPath);
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
                const newRepos = yield Promise.all(promises);
                const names = newRepos.map((r) => r.name);
                if (newRepos.length) {
                    (0, print_utils_1.showText)(ansi_colors_1.default.green(`Found new GIT submodule(s) - ${ansi_colors_1.default.red(names.join(', '))}\n`));
                    (0, print_utils_1.showText)([
                        'Please initialise new submodules.',
                        'You can run "git submodule update --init --recursive"',
                    ].join(' '));
                    process.exit(1);
                }
                return true;
            }
            catch (err) {
                (0, print_utils_1.showText)(ansi_colors_1.default.red(`Error initialising submodules: ${err.message}`));
                throw err;
            }
        });
    }
    /**
     * Checkout all submodules and commit the main stack
     * @param modules
     * @param branch
     * @returns {Promise<*>}
     */
    static checkoutLatestSubmodules(modules, branch) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure all submodule have uncommitted works before proceeding next (except handy submodule)
            const safeToPullPromises = modules.map((module) => __awaiter(this, void 0, void 0, function* () { return GitUtils.safeToPull(module.fullPath); }));
            const allResponses = yield Promise.all(safeToPullPromises);
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
            const promises = modules.map((module) => __awaiter(this, void 0, void 0, function* () {
                var _a;
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
                    const git = (0, simple_git_1.default)(fullPath);
                    let branchInfo = yield git.branch(['-v', '-a']);
                    let { current } = branchInfo;
                    const { commit } = (_a = (0, generic_1.getCurrentBranchFromBranchSummary)(branchInfo)) !== null && _a !== void 0 ? _a : {};
                    // 2) skip
                    // 3) Work out the current branch
                    const onCurrentBranch = current === branch;
                    // if (fullPath.indexOf('byb-api') !== -1) {
                    //   console.log(fullPath, branchInfo, 'b', branch);
                    // }
                    const newBranch = branchInfo.all.indexOf(branch) === -1;
                    if (!onCurrentBranch && newBranch) {
                        // Create a local branch
                        yield GitUtils.createBranchAndCheckout(branch, git, fullPath);
                    }
                    else {
                        // checkout branch
                        yield git.checkout(branch);
                    }
                    (0, print_utils_1.showText)([
                        `Pulling commits on a ${ansi_colors_1.default.red(branch)} branch of '${ansi_colors_1.default.green(name)}' submodule`,
                        !onCurrentBranch ? `It was previously on ${ansi_colors_1.default.red(current)}` : '',
                    ].join('. '));
                    // 4) Checkout the latest on the given branch
                    branchInfo = yield git.branch();
                    current = branchInfo && branchInfo.current;
                    if (current === branch) {
                        // Merge the branch to ensure the local commit is at the latest
                        try {
                            yield git.pull('origin', branch, { '--rebase': 'false' });
                        }
                        catch (err) {
                            (0, print_utils_1.showText)(`Unable to pull the repo ${fullPath} due to ${err.message}`);
                            throw err;
                        }
                        // 4.3) Push the change
                        const status = yield git.status();
                        const hasLocalCommits = GitUtils.hasSomeChangesToPush(status);
                        if (hasLocalCommits) {
                            yield git.push('origin', branch);
                        }
                        // Capture if we detect a new change from this repo
                        branchInfo = yield git.branch();
                        const newCurrentBranchObj = (0, generic_1.getCurrentBranchFromBranchSummary)(branchInfo);
                        const newCommit = newCurrentBranchObj && (newCurrentBranchObj === null || newCurrentBranchObj === void 0 ? void 0 : newCurrentBranchObj.commit);
                        if (newCommit !== commit) {
                            res.hasNewChanges = true;
                        }
                        res.status = true;
                    }
                    else {
                        res.message = `Unable to checkout ${branch}`;
                    }
                }
                catch (err) {
                    const knownIssue = (err === null || err === void 0 ? void 0 : err.message.indexOf('Cannot rebase onto multiple branches')) !== -1;
                    if (knownIssue) {
                        res.message = `Found a GIT rebasing issue in '${module.name}' module.`;
                    }
                    else {
                        res.message = err.message;
                    }
                }
                return res;
            }));
            return Promise.all(promises);
        });
    }
    /**
     * Checkout handy submodule
     * @param modulePath
     * @returns {Promise<void>}
     */
    static checkoutLatestHandySubmodule(modulePath, branch) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullPath = modulePath;
            const res = {
                status: false,
                fullPath,
                message: '',
            };
            try {
                const git = (0, simple_git_1.default)(fullPath);
                let branchInfo = yield git.branch();
                let { current } = branchInfo;
                if (current !== branch && branchInfo.all.indexOf(branch) !== -1) {
                    // checkout branch
                    yield git.checkout(branch);
                }
                // Checkout the latest
                branchInfo = yield git.branch();
                current = branchInfo && branchInfo.current;
                if (current === branch) {
                    // Rebase the branch to ensure the local commit is at the latest
                    yield git.pull('origin', branch, { '--rebase': 'true' });
                    // Reset the submodule
                    yield git.submoduleUpdate();
                    // Push the current branch to develop
                    const status = yield git.status();
                    const hasLocalCommits = GitUtils.hasSomeChangesToPush(status);
                    if (hasLocalCommits) {
                        yield git.push('origin', branch);
                    }
                    res.status = true;
                }
                else {
                    res.message = `Unable to checkout ${branch}`;
                }
            }
            catch (err) {
                res.message = `Repo: ${fullPath}, ${err.message}`;
            }
            return res;
        });
    }
    /**
     * At the `platform`, list for a file changes and commit them
     * @param repoPath
     * @returns {Promise<boolean>}
     */
    static commitLatestSubModules(repoPath, branch = 'master') {
        return __awaiter(this, void 0, void 0, function* () {
            const res = {
                status: false,
            };
            const git = (0, simple_git_1.default)(repoPath);
            // 1) Confirm branch
            let branchInfo = yield git.branch();
            let current = branchInfo && branchInfo.current;
            if (current !== branch) {
                // 1.1) Checkout master
                yield git.checkout(branch);
                // 1.2) Confirm if we are on the branch
                branchInfo = yield git.branch();
                current = branchInfo && branchInfo.current;
                if (current !== branch) {
                    res.message = `Unable to checkout a ${branch} on the main stack`;
                    return res;
                }
            }
            // 2) Check status
            let stackStatus = yield git.status();
            const fileChanges = GitUtils.hasFileChanges(stackStatus);
            if (fileChanges.length) {
                res.message = [
                    `You have some uncommitted changes - ${fileChanges.join(', ')}.`,
                    'Please make a commit first.',
                ].join(' ');
                return res;
            }
            // 3) Pull the latest and rebase with the existing commits if available
            yield git.pull('origin', branch, { '--rebase': 'true' });
            // Re-check status again so that we know what files are to be committed
            yield (0, generic_1.wait)(3000);
            stackStatus = yield git.status();
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
            }
            else {
                res.message = 'Your change is latest. No new commits';
                res.status = true;
            }
            return res;
        });
    }
    /**
     * Validate the existent of branch or tag
     * @param repo
     * @param branch
     * @param tag
     * @returns {Promise.<{status: boolean, sha: string}>}
     */
    static validateBranchOrTag(repo, branch, tag) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {
                status: false,
                sha: '',
                deployingType: branch !== '' ? 'branch' : 'tag',
                repo,
                branchOrTag: branch || tag,
            };
            try {
                // Use ls-remote to show remote branches and tags
                const branchesStr = yield (0, simple_git_1.default)(DEFAULT_PATH).listRemote([repo]);
                // console.log(branchesStr);
                if (branchesStr) {
                    const branchesAndTags = yield GitUtils.parseBranchStr(branchesStr);
                    const foundBranch = typeof (branchesAndTags === null || branchesAndTags === void 0 ? void 0 : branchesAndTags[branch]) !== 'undefined';
                    const tagKeyAnnotated = `tags/${tag}`; // Annotated tag SHA or actual commit SHA
                    const tagKey = `${tagKeyAnnotated}^{}`; // Actual commit SHA if tag was created by `git tag -a tag-name`
                    const foundAnnotatedTag = typeof branchesAndTags[tagKeyAnnotated] !== 'undefined';
                    const foundActualCommitTag = typeof branchesAndTags[tagKey] !== 'undefined';
                    result.status = foundBranch !== false || foundAnnotatedTag !== false;
                    if (foundBranch) {
                        result.sha = branchesAndTags[branch];
                    }
                    else if (foundAnnotatedTag && !foundActualCommitTag) {
                        result.sha = branchesAndTags[tagKeyAnnotated];
                    }
                    else if (foundAnnotatedTag && foundActualCommitTag) {
                        result.sha = branchesAndTags[tagKey];
                    }
                }
            }
            catch (err) {
                const message = `Unable to parse list branches for ${repo}, err: ${err.message}`;
                global.logger.warn(message);
                throw new Error(message);
            }
            return result;
        });
    }
    /**
     * Parse branch info into object with remoteBranchName
     * - Added support for parsing tags as well i.e. tags/rc74.0
     * @param branchesStr
     * @returns {Promise.<object>}
     */
    static parseBranchStr(branchesStr, removeRemoteBranchName = true) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    }
                    else {
                        // Tag, want to leave `tags/` prefix in the key, avoid key collision issue
                        branchName = removeRemoteBranchName
                            ? remoteBranchName.replace('refs/tags/', 'tags/')
                            : remoteBranchName;
                    }
                    branches[branchName] = sha;
                }
            });
            return branches;
        });
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
            const files = modified.filter((r) => r.indexOf('.') !== -1);
            return files;
        }
        return [];
    }
    static hasNewCommits(handyModulePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const git = (0, simple_git_1.default)(handyModulePath);
            const status = yield git.status();
            const { modified, ahead } = status;
            return ahead > 0 || modified.length === 0;
        });
    }
    /**
     * Return current folder
     * @returns {*}
     */
    static getCurrentFolder() {
        return '/Users/chainat/dev/platform';
        // return process.cwd();
    }
    static parseSubmodules(gitSubmodules) {
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
    static hasLocalBranch(branchInfo, branch) {
        const { all } = branchInfo;
        return all.some((r) => r === branch);
    }
    static createBranchAndCheckout(branchName, git, fullPath = '') {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const startPoint = `origin/${branchName}`;
                yield git.checkoutBranch(branchName, startPoint);
            }
            catch (err) {
                const customErr = new Error(`Unable to create "${branchName}" for ${fullPath} due to this error - ${err.message}`);
                throw customErr;
            }
        });
    }
}
exports.GitUtils = GitUtils;
//# sourceMappingURL=GitUtils.js.map