const moment = require('moment-timezone');

const format = {
  DB: 'YYYY-MM-DD HH:mm:ss',

  // UTC
  TIMEZONES: {
    utc: 'GMT',
    au: 'Australia/Sydney',
  },
};

class DateTime {
  /**
   * Return predefined datetime formats
   * @returns {{DB}}
   */
  static dateTimeFormats() {
    return format;
  }

  /**
   * Get current time from the given timezone and return in the specified format
   * @param localTZ
   * @param returnFormat
   * @returns {*}
   */
  static now(localTZ = 'GMT', convertToUTC = true, returnFormat = format.DB) {
    const localtime = moment().tz(localTZ);
    const utc = (convertToUTC) ? localtime.tz('GMT') : localtime;
    return utc.format(returnFormat);
  }

  /**
   * Parse local time in ISO format to a UTC time in a specified format
   * i.e 2019-02-05 (YYYY-MM-DDD in AU) => 2019-02-04 13:00:00 (YYYY-MM-DD HH:mm:ss)
   *
   * @param datetime
   * @param inputFormat
   * @param localTZ
   * @param returnFormat
   * @returns {*}
   */
  static parseLocalDateTimeToUTC(datetime, localTZ = 'Australia/Sydney', returnFormat = format.DB) {
    const localtime = moment.tz(datetime, localTZ);
    const utc = localtime.clone().utc();
    // console.log('here =====>', datetime, localTZ,
    // localtime.format(), utc.format(), utc.format(returnFormat));
    return utc.format(returnFormat);
  }

  /**
   * Parse date in DB format (UTC timezone) to a moment object in UTC timezone
   * @param datetime in UTC
   * @param inputFormat
   * @returns {*}
   */
  static parseDBDate(datetime, inputFormat = format.DB) {
    const utcTime = moment.utc(datetime, inputFormat);
    return utcTime;
  }


  /**
   *
   * @param expiryDays
   * @param from (date time in DB format, i.e. 2019-02-10 15:00:00 )
   * @returns {*}
   */
  static getExpiryDate(expiryDays, from = 'now') {
    const fromDate = (from === 'now')
      ? DateTime.parseDBDate(DateTime.now()) : DateTime.parseDBDate(from);
    const result = fromDate.add(expiryDays, 'days').add(-1, 'second').format(DateTime.dateTimeFormats().DB);
    return result;
  }

  /**
   * Turn mysql datetime to ISO YYYY-MM-DDTHH:MM:SS.000Z
   * @param mysqlDate
   */
  static fromMySQLtoISOFormat(mysqlDate) {
    if (mysqlDate && !mysqlDate.match(/T|Z/)) {
      return `${mysqlDate.replace(' ', 'T')}.000Z`;
    }
    return mysqlDate;
  }

  /**
   * Display DB field to AU Time
   * @param utcISOTime
   * @param format
   * @returns {*}
   */
  static toAUTime(utcISOTime = null, displayFormat = format.DB) {
    const now = utcISOTime || moment.utc();
    return moment(now).tz(format.TIMEZONES.au).format(displayFormat);
  }
}

module.exports = DateTime;
