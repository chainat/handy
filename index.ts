import yargs from 'yargs';
import { showLine } from './src/utils/print-utils';

global.showLine = showLine;

// eslint-disable-next-line no-unused-vars,prefer-destructuring
yargs
  .commandDir('./src/commands') // Load commands from this folder
  .demandCommand(1, 'Please supply a sub command')
  .help().argv;
