"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapAccentColour = exports.warningMessage = exports.highlight = exports.showSimpleTable = exports.showText = exports.showTable = exports.getParams = exports.showLine = void 0;
const { stdout } = process;
const cli_table_1 = __importDefault(require("cli-table"));
const prettyjson_1 = __importDefault(require("prettyjson"));
const lodash_1 = __importDefault(require("lodash"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
/**
 * Show highlighted text
 * @param text
 * @returns
 */
const highlight = (text) => ansi_colors_1.default.yellow(text);
exports.highlight = highlight;
/**
 * Add new line to cli
 * @param char
 * @param length
 */
const showLine = (char = '=', length = 80) => {
    stdout.write('\n');
    for (let i = 0; i < length; i += 1) {
        stdout.write(char);
    }
    stdout.write('\n');
};
exports.showLine = showLine;
/**
 * To show the accent colour on the specific string
 * @param text
 * @param target
 * @returns
 */
const wrapAccentColour = (text, valueToMatch) => text === valueToMatch ? ansi_colors_1.default.red(text) : text;
exports.wrapAccentColour = wrapAccentColour;
const showText = (t, autoNewLine = '\n') => {
    stdout.write(`${t}${autoNewLine ? autoNewLine : ''}`);
};
exports.showText = showText;
const getParams = (arr) => {
    if (arr.length > 1) {
        return arr.slice(1, arr.length);
    }
    return [];
};
exports.getParams = getParams;
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
        const items = lodash_1.default.pickBy(obj, (val, key) => groupOfKeys.indexOf(key) !== -1);
        resultArr.push(items);
    }
    return resultArr;
};
/**
 * TBC
 * @param obj
 * @returns
 */
const prepareData = (obj) => {
    const keys = Object.keys(obj);
    keys.forEach((k) => {
        const val = obj[k];
        if (val) {
            const isDateObj = Object.getPrototypeOf(val) === Object.getPrototypeOf(new Date());
            if (isDateObj) {
                obj = Object.assign(Object.assign({}, Object), { k: (0, moment_timezone_1.default)(val).format('DD/MM/YYYY h:mm a') });
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
const showTable = (data, sectionHeader = '', dataColumns = 3) => {
    if (data) {
        const columns = new Array(dataColumns).fill(0);
        const Others = columns.map((v, i) => `Data Col ${i + 1}`);
        const table = new cli_table_1.default({
            head: ['Item', ...Others],
        });
        data.forEach((r, i) => {
            const formattedData = prepareData(r);
            const resultArr = breakObjectIntoGroups(formattedData, dataColumns);
            table.push([
                (i + 1).toString(),
                ...columns.map((v, index) => prettyjson_1.default.render(resultArr[index])),
            ]);
        });
        showHeader(sectionHeader);
        stdout.write(`${table.toString()}\n`);
    }
};
exports.showTable = showTable;
/**
 * Show simple table on cli
 * @param data
 * @param sectionHeader
 * @returns
 */
const showSimpleTable = (data, sectionHeader) => {
    if (data) {
        const columns = Object.keys(data[0]);
        const Others = columns.map((v) => v);
        const table = new cli_table_1.default({
            head: ['Item', ...Others],
        });
        data.forEach((r, i) => table.push([(i + 1).toString(), ...Object.values(r)]));
        showHeader(sectionHeader);
        process.stdout.write(`${table.toString()}\n`);
    }
};
exports.showSimpleTable = showSimpleTable;
/**
 * Show warning message
 * @param message
 * @param env
 */
const warningMessage = (message, env = null) => {
    if (lodash_1.default.isNull(env))
        stdout.write(`${ansi_colors_1.default.red(message)}\n`);
    if (env === 'dev')
        stdout.write(`${ansi_colors_1.default.bgGreen(message)}\n`);
    if (env === 'qa')
        stdout.write(`${ansi_colors_1.default.bgYellow(message)}\n`);
    if (env === 'prod')
        stdout.write(`${ansi_colors_1.default.bgRed(message)}\n`);
};
exports.warningMessage = warningMessage;
//# sourceMappingURL=print-utils.js.map