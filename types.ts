type GitModuleInfo = {
  name: string;
  path: string;
  [key: string]: any;
};

type GitModuleObjects = {
  [key: string]: GitModuleInfo;
};

type SimpleObject = {
  [key: string]: any;
};

type GitModuleStatus = GitModuleInfo & {
  commit: string;
  name: string;
  fullPath?: string;
  pointer: string;
};

type GitCommitResponse = {
  status: boolean;
  message?: string;
};

type RepoStatus = {
  fullPath?: string;
  shortPath?: string;
  current: string; // branch string
  detached: boolean; // detached status
  hasLocalChanges: string; // status of local change
  hasNewFiles: string; // status of new file
  latest: string; // up-to-date status
};
