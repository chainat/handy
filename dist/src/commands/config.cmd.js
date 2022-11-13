"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Config_1 = require("../utils/Config");
module.exports = {
    command: 'config',
    describe: 'Set up a default GIT project',
    builder: (yargs) => {
        yargs.option('path', {
            describe: 'A default parent GIT folder, e.g. handy config --path ~/dev/platform',
            type: 'string',
            default: '',
        });
    },
    handler: (argv) => __awaiter(void 0, void 0, void 0, function* () {
        const config = new Config_1.Config();
        const { path } = argv;
        return config.setConfig(path);
    }),
};
//# sourceMappingURL=config.cmd.js.map