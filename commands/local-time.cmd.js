const moment = require('moment-timezone');
const DATE_FORMATS = require('../const');

const { stdout } = process;

module.exports = {
  command: 'local <local-time>',
  describe: 'Convert local to UTC \n i.e. handy local "2019-02-19 18:00"',
  builder: (yargs) => {
    yargs.positional('localTime', {
      describe: 'local time to convert to UTC',
      type: 'string',
      default: null,
    });
  },
  handler: (argv) => {
    const { localTime } = argv;
    const tz = moment.tz(localTime, 'Australia/Sydney');
    stdout.write(`AU: ${tz.format(DATE_FORMATS.AU)}\n`);
    stdout.write(`${new Array(50).join('=')}\n`);
    stdout.write(`UTC: ${tz.clone().utc().format(DATE_FORMATS.AU)}\n`);
  },
};
