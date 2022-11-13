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
const Config_1 = require("../utils/Config");
module.exports = {
    command: 'git-status [-v] [-a]',
    describe: 'List all status of all repos',
    builder: (yargs) => {
        yargs.option('verbose', {
            describe: 'Show all repos',
            type: 'boolean',
            default: false,
        });
        yargs.option('all', {
            describe: 'Show all repos',
            type: 'boolean',
            default: false,
        });
        yargs.alias('a', 'verbose');
    },
    handler: (argv) => __awaiter(void 0, void 0, void 0, function* () {
        const { v, verbose, a } = argv;
        const config = new Config_1.Config();
        const gitPath = config.getRepoPath();
        const excluded = a ? [] : [];
        const modules = yield GitUtils_1.GitUtils.listModules(gitPath, excluded);
        const status = yield GitUtils_1.GitUtils.getStatus(modules);
        const formatted = status.map((m) => {
            var _a;
            const shortPath = (_a = m === null || m === void 0 ? void 0 : m.fullPath) === null || _a === void 0 ? void 0 : _a.replace(gitPath, '').replace(/^\//g, '');
            const newObject = Object.assign({ shortPath }, m);
            delete newObject.fullPath;
            return newObject;
        });
        const total = formatted.length;
        const filltered = formatted.filter((m) => !m.latest);
        (0, print_utils_1.showText)(`\nThere are ${total} repos, ${filltered.length} repo(s) are not up-to-date`);
        (0, print_utils_1.showLine)();
        const report = v || verbose ? formatted : filltered;
        if (report.length) {
            (0, print_utils_1.showSimpleTable)(report, 'GIT SUBMODULES');
        }
        else {
            (0, print_utils_1.showText)(ansi_colors_1.default.green('You have the latest changes\n'));
        }
    }),
};
//# sourceMappingURL=git-status.cmd.js.map