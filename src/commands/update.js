const path = require('path');
const c = require('ansi-colors');
const { showText } = require('../utils/print-utils');
const GitUtils = require('../utils/GitUtils');

module.exports = {
  command: 'update',
  describe: 'Update handy repo',
  handler: async () => {
    const gitPath = GitUtils.getMainRepoPath();
    const start = +new Date();

    showText('Pulling the latest changes from handy module...');
    try {
      const handyRepo = path.join(gitPath, 'handy');
      await GitUtils.checkoutLatestHandySubmodule(handyRepo, 'develop');

      // @todo - support smart npm install
      const cmd = c.red('cd handy && npm install && cd ..');
      showText(`\nPlease run \n${cmd}\n`);
    } catch (err) {
      showText(`Error: ${err.message}`);
    }

    const stop = +new Date();
    const taken = (stop - start) / 1000;
    showText(`Time taken: ${c.green(taken)} seconds`);
  },
};
