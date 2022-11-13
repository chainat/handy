import * as path from 'path';
import * as fs from 'fs';

class SubModuleUtils {
  /**
   * Parse module from .gitmodules file, Git().submodules() doesn't return a newly created submodule
   * @param gitPath
   * @returns {Promise<Array>}
   */
  static async readModuleFiles(gitPath: string): Promise<GitModuleInfo[]> {
    const gitSubmodules: GitModuleInfo[] = [];

    if (fs.existsSync(gitPath)) {
      // Read .gitmodules file
      const moduleFile = path.join(gitPath, '.gitmodules');
      const content = fs.readFileSync(moduleFile, 'utf8');

      if (content) {
        // Split each line
        const rows = content.split('\n');
        const modules: {
          [key: string]: GitModuleInfo;
        } = {};
        let current = '';

        // Loop through all rows and form the object from multiple rows
        rows.forEach((row) => {
          // Looking for submodule, below is one git submodule e.g
          // [submodule "tests"]
          //    path = tests
          //    url = git@github.com:company-name/tests

          if (row.indexOf('[submodule') !== -1) {
            const name = row.replace(/\[submodule\s"|"]/gi, '');
            current = name;
            // Keep the module name
            modules[current] = {
              name: name.trim(),
              path: '',
            };
          } else if (modules[current]) {
            // Keep path & url
            const modulePath = row.replace(/\tpath = /, '');
            const url = row.replace(/\turl = /, '');
            if (row.indexOf('path') !== -1) {
              modules[current].path = modulePath.trim();
            }
            if (row.indexOf('url') !== -1) {
              modules[current].url = url.trim();
            }
          }
        });

        // Push this module to the result
        const keys = Object.keys(modules);
        keys.forEach((key) =>
          gitSubmodules.push(modules[key] as GitModuleInfo)
        );
      }
    }
    return gitSubmodules;
  }
}

export { SubModuleUtils };
