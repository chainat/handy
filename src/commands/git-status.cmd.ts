import c from 'ansi-colors';
import { showSimpleTable, showText, showLine } from '../utils/print-utils';
import { GitUtils } from '../utils/GitUtils';
import { Config } from '../utils/Config';

module.exports = {
  command: 'git-status [-v] [-a]',
  describe: 'List all status of all repos',
  builder: (yargs: SimpleObject) => {
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
  handler: async (argv: SimpleObject) => {
    const { v, verbose, a } = argv;
    const config = new Config();
    const gitPath = config.getRepoPath();
    const excluded = a ? [] : [];
    const modules = await GitUtils.listModules(gitPath, excluded);

    const status = await GitUtils.getStatus(modules);
    const formatted: RepoStatus[] = status.map((m) => {
      const shortPath = m?.fullPath?.replace(gitPath, '').replace(/^\//g, '');
      const newObject: RepoStatus = { shortPath, ...m };
      delete newObject.fullPath;
      return newObject;
    });

    const total = formatted.length;
    const filltered = formatted.filter((m) => !m.latest);

    showText(
      `\nThere are ${total} repos, ${filltered.length} repo(s) are not up-to-date`
    );
    showLine();
    const report = v || verbose ? formatted : filltered;
    if (report.length) {
      showSimpleTable(report, 'GIT SUBMODULES');
    } else {
      showText(c.green('You have the latest changes\n'));
    }
  },
};
