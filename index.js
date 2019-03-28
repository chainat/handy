const yargs = require('yargs');

// eslint-disable-next-line no-unused-vars,prefer-destructuring
const argv = yargs
  .commandDir('./commands') // Load commands from this folder
  .demandCommand(1, 'Please supply a sub command')
  .help()
  .argv;
