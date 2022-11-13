import * as path from 'path';
import * as fs from 'fs';
import { BranchSummary, BranchSummaryBranch } from 'simple-git';

const allSubmodules = (modified: string[], submodules: string[]) => {
  if (modified && modified.length) {
    const out = modified.filter((m) => submodules.indexOf(m) !== 0);
    return out.length === 0;
  }
  return true;
};

/**
 * Delay
 * @param {*} delayInMs
 * @returns
 */
const wait = async (delayInMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayInMs);
  });

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

const getCurrentBranchFromBranchSummary = (
  branchSummary: BranchSummary
): BranchSummaryBranch | undefined => {
  const { branches } = branchSummary;
  if (branches) {
    const arr = Object.keys(branches);
    const [currentBranchKey] = arr.filter(
      (branchKey) => branches[branchKey].current === true
    );
    return branches[currentBranchKey];
  }
  return undefined;
};

const allPackageFiles = (dir: string) => {
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

export {
  allSubmodules,
  wait,
  // nextVersion,
  getCurrentBranchFromBranchSummary,
  allPackageFiles,
};
