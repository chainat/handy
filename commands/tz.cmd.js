const moment = require('moment-timezone');
const DATE_FORMATS = require('../const');

const { stdout } = process;

module.exports = {
  command: 'tz <utc-time>',
  describe: 'Convert UTC time to local \n i.e. `handy tz 2019-02-19T16:00:00.000Z` or \n`handy tz "2018-10-24 23:05:16"`',
  builder: (yargs) => {
    yargs.positional('utcTime', {
      describe: 'UTC time to convert',
      type: 'string',
      default: null,
    });
  },
  handler: (argv) => {
    const tz = moment.utc(argv.utcTime);
    stdout.write(`UTC: ${tz.format(DATE_FORMATS.AU)}\n`);
    stdout.write(`${new Array(50).join('=')}\n`);
    stdout.write(`AU: ${tz.clone().tz('Australia/Sydney').format(DATE_FORMATS.AU)}\n`);
  },
};
