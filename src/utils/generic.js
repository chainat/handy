const path = require('path');
const fs = require('fs');

const allSubmodules = (modified, submodules) => {
  if (modified && modified.length) {
    const out = modified.filter((m) => submodules.indexOf(m) !== 0);
    return out.length === 0;
  }
  return true;
};

const wait = async (delayInMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayInMs);
  });

const nextVersion = (current, versionType) => {
  const arr = current.split('.');
  switch (versionType) {
    case 'major':
      arr[0] = parseInt(arr[0], 10) + 1;
      arr[1] = 0;
      arr[2] = 0;
      break;
    case 'minor':
      arr[1] = parseInt(arr[1], 10) + 1;
      arr[2] = 0;
      break;
    case 'patch':
      arr[2] = parseInt(arr[2], 10) + 1;
      break;
    default:
      break;
  }
  return arr.join('.');
};

const getCurrentBranchFromBranchSummary = (branchSummary) => {
  const { branches } = branchSummary;
  if (branches) {
    const arr = Object.keys(branches);
    const [currentBranchKey] = arr.filter(
      (branchKey) => branches[branchKey].current === true
    );
    return branches[currentBranchKey] || {};
  }
  return {};
};

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

module.exports = {
  allSubmodules,
  wait,
  nextVersion,
  getCurrentBranchFromBranchSummary,
  allPackageFiles,
};
