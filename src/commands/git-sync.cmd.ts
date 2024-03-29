import c from 'ansi-colors';
import { showText } from '../utils/print-utils';
import { GitUtils } from '../utils/GitUtils';
import { DEFAULT_DEV_BRANCH } from '../consts';
import { Config } from '../utils/Config';

module.exports = {
  command: 'git-sync [-a] [-p]',
  describe: 'Sync all git submodules',
  builder: (yargs: SimpleObject) => {
    yargs.option('pull-only', {
      describe:
        'Only pull down, do not push the `platform` up. only for development/test mode',
      type: 'boolean',
      default: false,
    });
    yargs.alias('p', 'pull-only');
  },
  handler: async (argv: SimpleObject) => {
    const { p } = argv;
    const gitPath = new Config().getRepoPath();
    const excluded: string[] = [];
    const allSubmodules = await GitUtils.listModules(gitPath, excluded);
    const start = +new Date();
    let hasErrors = false;
    let checkoutLatest;
    let errorRepos: SimpleObject[] = [];
    let newChanges: SimpleObject[] = [];

    // Initialise submodules if there are any new submodules found
    if (!hasErrors) {
      showText('1) Check and initialise new submodules...');
      try {
        await GitUtils.checkAndInitialiseSubmodules(gitPath);
        showText(`${c.green('Done!\n')}`);
      } catch (err) {
        showText(err.message);
        hasErrors = true;
      }
    }

    // Check out all submodules
    if (!hasErrors) {
      showText('2) Checking out all other submodules...');
      try {
        // Checkout the latest develop on all repos
        checkoutLatest = await GitUtils.checkoutLatestSubmodules(
          allSubmodules,
          DEFAULT_DEV_BRANCH
        );
        newChanges = checkoutLatest.filter(
          (r: SimpleObject) => r?.status && r.hasNewChanges
        );
        errorRepos = checkoutLatest.filter((r: SimpleObject) => !r?.status);
        hasErrors = errorRepos.length > 0;
        if (!hasErrors) {
          showText(`${c.green('Done!\n')}`);
        }

        // Show new changed repos
        if (newChanges.length) {
          const moduleNames = newChanges.map((m) => m.name);
          showText(
            c.red(`\nNew updated modules: ${moduleNames.join(', ')}\n\n`)
          );
        }
      } catch (err) {
        showText(err.message);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      showText(
        c.red(
          'Unable to complete checking out the latest codes. See the errors below'
        )
      );
      const str = errorRepos.map((r: SimpleObject) => r?.message).join('\n');
      showText(c.red(`${str}\n`));

      const hasLocalChanges = errorRepos.some(
        (r: SimpleObject) => r?.errorType === 'local-changes'
      );
      if (hasLocalChanges) {
        showText(c.red('Try to run "handy git-status" to see local changes.'));
      } else {
        showText(c.red('Try to run "handy git-sync" again.'));
      }
    }

    if (!hasErrors) {
      if (!p) {
        showText('3) Check and commit the platform repo... ');

        try {
          const res = await GitUtils.commitLatestSubModules(gitPath);
          if (res.status) {
            showText(
              [`Response: ${res.message}, \n\n`, c.green('Done!')].join('')
            );
          } else {
            showText(c.red(res?.message ?? ''));
          }
        } catch (err) {
          showText(`Error: ${err?.message ?? ''}`);
        }
      } else {
        showText(
          '3) It is in a pull only mode. No new changes are committed and pushed.'
        );
      }
    }

    const stop = +new Date();
    const taken = (stop - start) / 1000;
    showText(`Time taken: ${c.green(taken.toString())} seconds`);
  },
};
