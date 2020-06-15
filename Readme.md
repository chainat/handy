# Handy Utillity Command Repo

### Overview

A `Handy` command is a CLI tool written in NodeJS for managing git repo & sub repos in the current directly. We can extend to support other commands in the future.

### Requirements

- Node version 8 or later
- Has been tested and daily usage with ZSH. It should still work with Bash but not recommended

### How to install

```
  npm install -g @chainat/handy
```

### How to use

- List all git repo status - `handy git-status` or `handy git-status -a` to show all git submodule repos & the status
- Checkout the latest platform code and push the latest platform changes - `handy git-sync`
  - It goes to all submodules and checkout `develop` branch
  - It captures the latest commits from all repos and push to platform repo if submodules have changed.
- Checkout only - `handy git-sync -p`
- See help - `handy --help`
