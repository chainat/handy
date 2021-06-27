const moment = require('moment-timezone');

const { DATE_FORMATS } = require('../../const');
const DateTime = require('../utils/DateTime');
const { showText, showLine, highlight } = require('../utils/print-utils');

module.exports = {
  command: 'local [local-time]',
  describe: 'Convert local to UTC \n i.e. handy local "2019-02-19 18:00"',
  builder: (yargs) => {
    yargs.positional('localTime', {
      describe: 'local time to convert to UTC',
      type: 'string',
      default: undefined,
    });
  },
  handler: (argv) => {
    const { localTime = DateTime.now('Australia/Sydney', false) } = argv;
    const tz = moment.tz(localTime, 'Australia/Sydney');

    showText(highlight(`AU: ${tz.format(DATE_FORMATS.AU)}`), false);
    showLine();
    showText(highlight(`UTC: ${tz.clone().utc().format(DATE_FORMATS.AU)}\n`));
  },
};
