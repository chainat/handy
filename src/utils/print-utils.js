const { stdout } = process;
const Table = require('cli-table');
const prettyjson = require('prettyjson');
const _ = require('lodash');
const moment = require('moment-timezone');
const c = require('ansi-colors');

const highlight = text => c.yellow(text);

const showLine = (char = '=', length = 80) => {
  stdout.write('\n');
  for (let i = 0; i < length; i += 1) {
    stdout.write(char);
  }
  stdout.write('\n');
};

// eslint-disable-next-line
const wrapAccentColour = (text, target = true) => (text.toString() === target.toString() ? c.red(text) : text);

const showText = (t, autoNewLine = '\n') => {
  stdout.write(`${t}${autoNewLine !== false ? autoNewLine : ''}`);
};

const getParams = (arr) => {
  if (arr.length > 1) {
    return arr.slice(1, arr.length);
  }
  return [];
};


const showHeader = (header) => {
  stdout.write(header);
  showLine();
};

const breakObjectIntoGroups = (obj, numGroups) => {
  const keys = Object.keys(obj);
  const count = keys.length;
  const numItemInAGroup = Math.ceil(count / numGroups);
  const resultArr = [];
  for (let i = 0; i < numGroups; i += 1) {
    const start = i * numItemInAGroup;
    const end = start + numItemInAGroup;
    const groupOfKeys = keys.slice(start, end);
    const items = _.pickBy(obj, (val, key) => groupOfKeys.indexOf(key) !== -1);
    resultArr.push(items);
  }
  return resultArr;
};

const prepareData = (obj) => {
  const keys = Object.keys(obj);
  // const DateProto = Object.getPrototypeOf(new Date());
  keys.forEach((k) => {
    if (obj[k]) {
      const isDateObj = Object.getPrototypeOf(obj[k]) === Object.getPrototypeOf(new Date());
      if (isDateObj) {
        // eslint-disable-next-line
        obj[k] = moment(obj[k]).format('DD/MM/YYYY h:mm a');
      }
    }
  });
  return obj;
};

const showTable = (data, sectionHeader = '', dataColumns = 3) => {
  if (data) {
    const columns = new Array(dataColumns).fill(0);
    const Others = columns.map((v, i) => `Data Col ${i + 1}`);
    const table = new Table({
      head: ['Item', ...Others],
    });

    data.forEach((r, i) => {
      const formattedData = prepareData(r);
      const resultArr = breakObjectIntoGroups(formattedData, dataColumns);
      table.push(
        [i + 1,
          ...(columns.map((v, index) => prettyjson.render(resultArr[index]))),
        ],
      );
    });
    showHeader(sectionHeader);
    stdout.write(`${table.toString()}\n`);
  }
  return null;
};

const showSimpleTable = (data, sectionHeader) => {
  if (data) {
    const columns = Object.keys(data[0]);
    const Others = columns.map(v => v); // v.replace(/^?/));
    const table = new Table({
      head: ['Item', ...Others],
    });

    data.forEach((r, i) => table.push(
      [i + 1,
        ...(Object.values(r)),
      ],
    ));
    showHeader(sectionHeader);
    process.stdout.write(`${table.toString()}\n`);
  }
  return null;
};

const warningMessage = (message, env = null) => {
  if (_.isNull(env)) stdout.write(`${c.red(message)}\n`);
  if (env === 'dev') stdout.write(`${c.bgGreen(message)}\n`);
  if (env === 'qa') stdout.write(`${c.bgYellow(message)}\n`);
  if (env === 'prod') stdout.write(`${c.bgRed(message)}\n`);
};


module.exports = {
  showLine,
  getParams,
  showTable,
  showText,
  showSimpleTable,
  highlight,
  warningMessage,
  wrapAccentColour,
};
