const c = require('ansi-colors');
const { showSimpleTable, showText, showLine } = require('../utils/print-utils');
const GitUtils = require('../utils/GitUtils');

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
  handler: async (argv) => {
    const { v, verbose, a } = argv;
    const gitPath = GitUtils.getCurrentFolder();
    const excluded = a ? [] : [];
    const modules = await GitUtils.listModules(gitPath, excluded);

    const status = await GitUtils.getStatus(modules);
    const formatted = status.map((m) => {
      const shortPath = m.fullPath.replace(gitPath, '');
      const newObject = { shortPath, ...m };
      delete newObject.fullPath;
      return newObject;
    });
    const total = formatted.length;
    const filltered = formatted.filter(m => !m.upToDated);

    showText(
      `\nThere are ${total} repos, ${filltered.length} repo(s) are not up-to-date`,
    );
    showLine();
    const report = v || verbose ? formatted : filltered;
    if (report.length) {
      showSimpleTable(report, 'GIT SUBMODULES', 4);
    } else {
      showText(c.green('You have the latest changes\n'));
    }
  },
};
