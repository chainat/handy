const uuid = require('uuid');

const { stdout } = process;

module.exports = {
  command: 'uuid',
  describe: 'Generate new uuid',
  handler: () => {
    stdout.write(`\nUUID: ${uuid()}\n\n`);
  },
};
