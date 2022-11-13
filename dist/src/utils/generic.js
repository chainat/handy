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
exports.allPackageFiles = exports.getCurrentBranchFromBranchSummary = exports.wait = exports.allSubmodules = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const allSubmodules = (modified, submodules) => {
    if (modified && modified.length) {
        const out = modified.filter((m) => submodules.indexOf(m) !== 0);
        return out.length === 0;
    }
    return true;
};
exports.allSubmodules = allSubmodules;
/**
 * Delay
 * @param {*} delayInMs
 * @returns
 */
const wait = (delayInMs) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        setTimeout(resolve, delayInMs);
    });
});
exports.wait = wait;
// const nextVersion = (current, versionType) => {
//   const arr = current.split('.');
//   switch (versionType) {
//     case 'major':
//       arr[0] = parseInt(arr[0], 10) + 1;
//       arr[1] = 0;
//       arr[2] = 0;
//       break;
//     case 'minor':
//       arr[1] = parseInt(arr[1], 10) + 1;
//       arr[2] = 0;
//       break;
//     case 'patch':
//       arr[2] = parseInt(arr[2], 10) + 1;
//       break;
//     default:
//       break;
//   }
//   return arr.join('.');
// };
const getCurrentBranchFromBranchSummary = (branchSummary) => {
    const { branches } = branchSummary;
    if (branches) {
        const arr = Object.keys(branches);
        const [currentBranchKey] = arr.filter((branchKey) => branches[branchKey].current === true);
        return branches[currentBranchKey];
    }
    return undefined;
};
exports.getCurrentBranchFromBranchSummary = getCurrentBranchFromBranchSummary;
const allPackageFiles = (dir) => {
    const allFiles = fs.readdirSync(dir);
    const allFolders = allFiles.filter((f) => {
        const folderPath = path.join(dir, f);
        const stat = fs.statSync(folderPath);
        const isDir = stat.isDirectory();
        return isDir;
    });
    // Looking for package.json
    const packageFiles = allFolders.map((f) => {
        const folderPath = path.join(dir, f, 'package.json');
        return fs.existsSync(folderPath) ? folderPath : false;
    });
    return packageFiles.filter((f) => !!f);
};
exports.allPackageFiles = allPackageFiles;
//# sourceMappingURL=generic.js.map