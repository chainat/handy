const { stdout } = process;
import Table from 'cli-table';
import prettyjson from 'prettyjson';
import _ from 'lodash';
import moment from 'moment-timezone';
import c from 'ansi-colors';

/**
 * Show highlighted text
 * @param text
 * @returns
 */
const highlight = (text: string) => c.yellow(text);

/**
 * Add new line to cli
 * @param char
 * @param length
 */
const showLine = (char = '=', length = 80): void => {
  stdout.write('\n');
  for (let i = 0; i < length; i += 1) {
    stdout.write(char);
  }
  stdout.write('\n');
};

/**
 * To show the accent colour on the specific string
 * @param text
 * @param target
 * @returns
 */
const wrapAccentColour = (text: string, valueToMatch: string) =>
  text === valueToMatch ? c.red(text) : text;

const showText = (t: string, autoNewLine = '\n'): void => {
  stdout.write(`${t}${autoNewLine ? autoNewLine : ''}`);
};

const getParams = (arr: any[]) => {
  if (arr.length > 1) {
    return arr.slice(1, arr.length);
  }
  return [];
};

const showHeader = (header: string): void => {
  stdout.write(header);
  showLine();
};

const breakObjectIntoGroups = (obj: any, numGroups: number) => {
  const keys = Object.keys(obj);
  const count = keys.length;
  const numItemInAGroup = Math.ceil(count / numGroups);
  const resultArr: any[] = [];
  for (let i = 0; i < numGroups; i += 1) {
    const start = i * numItemInAGroup;
    const end = start + numItemInAGroup;
    const groupOfKeys = keys.slice(start, end);
    const items = _.pickBy(
      obj,
      (val: any, key: string) => groupOfKeys.indexOf(key) !== -1
    );
    resultArr.push(items);
  }
  return resultArr;
};

/**
 * TBC
 * @param obj
 * @returns
 */
const prepareData = (obj: any) => {
  const keys = Object.keys(obj);
  keys.forEach((k) => {
    const val = obj[k];
    if (val) {
      const isDateObj =
        Object.getPrototypeOf(val) === Object.getPrototypeOf(new Date());
      if (isDateObj) {
        obj = { ...Object, k: moment(val).format('DD/MM/YYYY h:mm a') };
      }
    }
  });
  return obj;
};

/**
 * Display table output with header
 * @param data
 * @param sectionHeader
 * @param dataColumns
 * @returns
 */
const showTable = (data: any[], sectionHeader = '', dataColumns = 3): void => {
  if (data) {
    const columns = new Array(dataColumns).fill(0);
    const Others = columns.map((v, i) => `Data Col ${i + 1}`);
    const table = new Table({
      head: ['Item', ...Others],
    });

    data.forEach((r, i) => {
      const formattedData = prepareData(r);
      const resultArr = breakObjectIntoGroups(formattedData, dataColumns);
      table.push([
        (i + 1).toString(),
        ...columns.map((v, index) => prettyjson.render(resultArr[index])),
      ]);
    });
    showHeader(sectionHeader);
    stdout.write(`${table.toString()}\n`);
  }
};

/**
 * Show simple table on cli
 * @param data
 * @param sectionHeader
 * @returns
 */
const showSimpleTable = (data: any[], sectionHeader: string): void => {
  if (data) {
    const columns = Object.keys(data[0]);
    const Others = columns.map((v) => v);
    const table = new Table({
      head: ['Item', ...Others],
    });

    data.forEach((r: string[], i) =>
      table.push([(i + 1).toString(), ...Object.values(r)])
    );
    showHeader(sectionHeader);
    process.stdout.write(`${table.toString()}\n`);
  }
};

/**
 * Show warning message
 * @param message
 * @param env
 */
const warningMessage = (message: string, env: string | null = null): void => {
  if (_.isNull(env)) stdout.write(`${c.red(message)}\n`);
  if (env === 'dev') stdout.write(`${c.bgGreen(message)}\n`);
  if (env === 'qa') stdout.write(`${c.bgYellow(message)}\n`);
  if (env === 'prod') stdout.write(`${c.bgRed(message)}\n`);
};

export {
  showLine,
  getParams,
  showTable,
  showText,
  showSimpleTable,
  highlight,
  warningMessage,
  wrapAccentColour,
};
