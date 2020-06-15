const path = require('path');
const fs = require('fs');

class SubModuleUtils {
  /**
   * Parse module from .gitmodules file, Git().submodules() doesn't return a newly created submodule
   * @param gitPath
   * @returns {Promise<Array>}
   */
  static async readModuleFiles(gitPath) {
    const res = [];
    if (fs.existsSync(gitPath)) {
      const moduleFile = path.join(gitPath, '.gitmodules');
      const content = fs.readFileSync(moduleFile, 'utf8');
      if (content) {
        const rows = content.split('\n');
        const modules = {};
        let current = '';
        rows.forEach((row) => {
          if (row.indexOf('[submodule') !== -1) {
            const name = row.replace(/\[submodule\s"|"]/ig, '');
            current = row;
            modules[current] = {
              name: name.trim(),
            };
          } else if (modules[current]) {
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
        const keys = Object.keys(modules);
        keys.forEach(key => res.push(modules[key]));
      }
    }
    return res;
  }
}

module.exports = SubModuleUtils;
