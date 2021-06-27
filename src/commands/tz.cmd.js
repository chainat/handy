const moment = require('moment-timezone');

const { DATE_FORMATS, ISO_DATETIME } = require('../../const');
const DateTime = require('../utils/DateTime');
const { showText, showLine, highlight } = require('../utils/print-utils');

module.exports = {
  command: 'tz [utc-time|now]',
  describe:
    'Convert a UTC time to local AU \n\ni.e.\nhandy tz 2019-02-19T16:00:00.000Z or \nhandy tz "2018-10-24 23:05:16"',
  builder: (yargs) => {
    yargs.positional('utcTime', {
      describe: 'UTC time to convert',
      type: 'string',
      default: 'now',
      optional: true,
    });
  },
  handler: (argv) => {
    const { utcTime } = argv;
    const time = utcTime === 'now' ? DateTime.now('GMT', true, ISO_DATETIME) : utcTime;
    const tz = moment.utc(time);
    showText(highlight(`UTC: ${tz.format(DATE_FORMATS.AU)}`), false);
    showLine();
    showText(
      highlight(
        `AU: ${tz.clone().tz('Australia/Sydney').format(DATE_FORMATS.AU)}\n`,
      ),
    );
  },
};
