import os from 'os';
import path from 'path';
import fs from 'fs';
import {
  CONFIG_FOLDER_FROM_HOME_DIR,
  CONFIG_FILE_PATH,
  DEFAULT_REPO_PATH,
} from '../consts';
import { showText, wrapAccentColour } from './print-utils';

class Config {
  configPath: string;
  constructor(configPath = CONFIG_FILE_PATH) {
    this.configPath = path.join(os.homedir(), configPath);
  }

  /**
   * Write repo path to the config file
   * @param targetRepoPath
   */
  setConfig(targetRepoPath: string) {
    const targetFolder = path.join(os.homedir(), CONFIG_FOLDER_FROM_HOME_DIR);
    try {
      if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);
      const resolvedPath = Config.resolvePath(targetRepoPath);
      fs.writeFileSync(this.configPath, resolvedPath);

      showText(`Handy will load repos from ${resolvedPath}`);
      showText(`Done!`);
    } catch (err) {
      const message = `Unable to write config file, err: ${err.message}`;
      showText(wrapAccentColour(message, message));
    }
  }

  /**
   * Get repo path from the config file or load from default folder
   * @returns
   */
  getRepoPath() {
    const exists = fs.existsSync(this.configPath);
    const repoPath = path.resolve(os.homedir(), DEFAULT_REPO_PATH);
    if (!exists) {
      showText(`No config found, load default repo path from ${repoPath}`);
      return repoPath;
    }
    const content = fs.readFileSync(this.configPath, 'utf-8');
    return content;
  }

  /**
   * Prepare path
   * @param targetRepoPath
   * @returns
   */
  static resolvePath(targetRepoPath: string): string {
    if (!targetRepoPath.match(/^~|^\//)) {
      throw new Error(
        'path must be a relative path from home folder or absolute (e.g. ~/ or /Users/)'
      );
    }

    if (targetRepoPath.match(/^~/)) {
      return path.resolve(os.homedir(), targetRepoPath.replace('~', ''));
    }
    // Assume it's a full path
    return targetRepoPath;
  }
}

export { Config };
