import { Config } from '../utils/Config';

module.exports = {
  command: 'config',
  describe: 'Set up a default GIT project',
  builder: (yargs: SimpleObject) => {
    yargs.option('path', {
      describe:
        'A default parent GIT folder, e.g. handy config --path ~/dev/platform',
      type: 'string',
      default: '',
    });
  },
  handler: async (argv: SimpleObject) => {
    const config = new Config();
    const { path } = argv;
    return config.setConfig(path);
  },
};
