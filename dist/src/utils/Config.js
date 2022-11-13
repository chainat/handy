"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const consts_1 = require("../consts");
const print_utils_1 = require("./print-utils");
class Config {
    constructor(configPath = consts_1.CONFIG_FILE_PATH) {
        this.configPath = path_1.default.join(os_1.default.homedir(), configPath);
    }
    /**
     * Write repo path to the config file
     * @param targetRepoPath
     */
    setConfig(targetRepoPath) {
        const targetFolder = path_1.default.join(os_1.default.homedir(), consts_1.CONFIG_FOLDER_FROM_HOME_DIR);
        try {
            if (!fs_1.default.existsSync(targetFolder))
                fs_1.default.mkdirSync(targetFolder);
            const resolvedPath = Config.resolvePath(targetRepoPath);
            fs_1.default.writeFileSync(this.configPath, resolvedPath);
            (0, print_utils_1.showText)(`Handy will load repos from ${resolvedPath}`);
            (0, print_utils_1.showText)(`Done!`);
        }
        catch (err) {
            const message = `Unable to write config file, err: ${err.message}`;
            (0, print_utils_1.showText)((0, print_utils_1.wrapAccentColour)(message, message));
        }
    }
    /**
     * Get repo path from the config file or load from default folder
     * @returns
     */
    getRepoPath() {
        const exists = fs_1.default.existsSync(this.configPath);
        const repoPath = path_1.default.resolve(os_1.default.homedir(), consts_1.DEFAULT_REPO_PATH);
        if (!exists) {
            (0, print_utils_1.showText)(`No config found, load default repo path from ${repoPath}`);
            return repoPath;
        }
        const content = fs_1.default.readFileSync(this.configPath, 'utf-8');
        return content;
    }
    /**
     * Prepare path
     * @param targetRepoPath
     * @returns
     */
    static resolvePath(targetRepoPath) {
        if (!targetRepoPath.match(/^~|^\//)) {
            throw new Error('path must be a relative path from home folder or absolute (e.g. ~/ or /Users/)');
        }
        if (targetRepoPath.match(/^~/)) {
            return path_1.default.resolve(os_1.default.homedir(), targetRepoPath.replace('~', ''));
        }
        // Assume it's a full path
        return targetRepoPath;
    }
}
exports.Config = Config;
//# sourceMappingURL=Config.js.map