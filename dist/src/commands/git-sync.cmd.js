"use strict";
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
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const print_utils_1 = require("../utils/print-utils");
const GitUtils_1 = require("../utils/GitUtils");
const consts_1 = require("../consts");
const Config_1 = require("../utils/Config");
module.exports = {
    command: 'git-sync [-a] [-p]',
    describe: 'Sync all git submodules',
    builder: (yargs) => {
        yargs.option('pull-only', {
            describe: 'Only pull down, do not push the `platform` up. only for development/test mode',
            type: 'boolean',
            default: false,
        });
        yargs.alias('p', 'pull-only');
    },
    handler: (argv) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { p } = argv;
        const gitPath = new Config_1.Config().getRepoPath();
        const excluded = [];
        const allSubmodules = yield GitUtils_1.GitUtils.listModules(gitPath, excluded);
        const start = +new Date();
        let hasErrors = false;
        let checkoutLatest;
        let errorRepos = [];
        let newChanges = [];
        // Initialise submodules if there are any new submodules found
        if (!hasErrors) {
            (0, print_utils_1.showText)('1) Check and initialise new submodules...');
            try {
                yield GitUtils_1.GitUtils.checkAndInitialiseSubmodules(gitPath);
                (0, print_utils_1.showText)(`${ansi_colors_1.default.green('Done!\n')}`);
            }
            catch (err) {
                (0, print_utils_1.showText)(err.message);
                hasErrors = true;
            }
        }
        // Check out all submodules
        if (!hasErrors) {
            (0, print_utils_1.showText)('2) Checking out all other submodules...');
            try {
                // Checkout the latest develop on all repos
                checkoutLatest = yield GitUtils_1.GitUtils.checkoutLatestSubmodules(allSubmodules, consts_1.DEFAULT_DEV_BRANCH);
                newChanges = checkoutLatest.filter((r) => (r === null || r === void 0 ? void 0 : r.status) && r.hasNewChanges);
                errorRepos = checkoutLatest.filter((r) => !(r === null || r === void 0 ? void 0 : r.status));
                hasErrors = errorRepos.length > 0;
                if (!hasErrors) {
                    (0, print_utils_1.showText)(`${ansi_colors_1.default.green('Done!\n')}`);
                }
                // Show new changed repos
                if (newChanges.length) {
                    const moduleNames = newChanges.map((m) => m.name);
                    (0, print_utils_1.showText)(ansi_colors_1.default.red(`\nNew updated modules: ${moduleNames.join(', ')}\n\n`));
                }
            }
            catch (err) {
                (0, print_utils_1.showText)(err.message);
                hasErrors = true;
            }
        }
        if (hasErrors) {
            (0, print_utils_1.showText)(ansi_colors_1.default.red('Unable to complete checking out the latest codes. See the errors below'));
            const str = errorRepos.map((r) => r === null || r === void 0 ? void 0 : r.message).join('\n');
            (0, print_utils_1.showText)(ansi_colors_1.default.red(`${str}\n`));
            const hasLocalChanges = errorRepos.some((r) => (r === null || r === void 0 ? void 0 : r.errorType) === 'local-changes');
            if (hasLocalChanges) {
                (0, print_utils_1.showText)(ansi_colors_1.default.red('Try to run "handy git-status" to see local changes.'));
            }
            else {
                (0, print_utils_1.showText)(ansi_colors_1.default.red('Try to run "handy git-sync" again.'));
            }
        }
        if (!hasErrors) {
            if (!p) {
                (0, print_utils_1.showText)('3) Check and commit the platform repo... ');
                try {
                    const res = yield GitUtils_1.GitUtils.commitLatestSubModules(gitPath);
                    if (res.status) {
                        (0, print_utils_1.showText)([`Response: ${res.message}, \n\n`, ansi_colors_1.default.green('Done!')].join(''));
                    }
                    else {
                        (0, print_utils_1.showText)(ansi_colors_1.default.red((_a = res === null || res === void 0 ? void 0 : res.message) !== null && _a !== void 0 ? _a : ''));
                    }
                }
                catch (err) {
                    (0, print_utils_1.showText)(`Error: ${(_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : ''}`);
                }
            }
            else {
                (0, print_utils_1.showText)('3) It is in a pull only mode. No new changes are committed and pushed.');
            }
        }
        const stop = +new Date();
        const taken = (stop - start) / 1000;
        (0, print_utils_1.showText)(`Time taken: ${ansi_colors_1.default.green(taken.toString())} seconds`);
    }),
};
//# sourceMappingURL=git-sync.cmd.js.map