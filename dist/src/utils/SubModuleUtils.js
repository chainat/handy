"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.SubModuleUtils = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class SubModuleUtils {
    /**
     * Parse module from .gitmodules file, Git().submodules() doesn't return a newly created submodule
     * @param gitPath
     * @returns {Promise<Array>}
     */
    static readModuleFiles(gitPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const gitSubmodules = [];
            if (fs.existsSync(gitPath)) {
                // Read .gitmodules file
                const moduleFile = path.join(gitPath, '.gitmodules');
                const content = fs.readFileSync(moduleFile, 'utf8');
                if (content) {
                    // Split each line
                    const rows = content.split('\n');
                    const modules = {};
                    let current = '';
                    // Loop through all rows and form the object from multiple rows
                    rows.forEach((row) => {
                        // Looking for submodule, below is one git submodule e.g
                        // [submodule "tests"]
                        //    path = tests
                        //    url = git@github.com:company-name/tests
                        if (row.indexOf('[submodule') !== -1) {
                            const name = row.replace(/\[submodule\s"|"]/gi, '');
                            current = name;
                            // Keep the module name
                            modules[current] = {
                                name: name.trim(),
                                path: '',
                            };
                        }
                        else if (modules[current]) {
                            // Keep path & url
                            const modulePath = row.replace(/\tpath = /, '');
                            const url = row.replace(/\turl = /, '');
                            if (row.indexOf('path') !== -1) {
                                modules[current].path = modulePath.trim();
                            }
                            if (row.indexOf('url') !== -1) {
                                modules[current].url = url.trim();
                            }
                        }
                    });
                    // Push this module to the result
                    const keys = Object.keys(modules);
                    keys.forEach((key) => gitSubmodules.push(modules[key]));
                }
            }
            return gitSubmodules;
        });
    }
}
exports.SubModuleUtils = SubModuleUtils;
//# sourceMappingURL=SubModuleUtils.js.map