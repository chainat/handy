"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const print_utils_1 = require("./src/utils/print-utils");
global.showLine = print_utils_1.showLine;
// eslint-disable-next-line no-unused-vars,prefer-destructuring
yargs_1.default
    .commandDir('./src/commands') // Load commands from this folder
    .demandCommand(1, 'Please supply a sub command')
    .help().argv;
//# sourceMappingURL=index.js.map