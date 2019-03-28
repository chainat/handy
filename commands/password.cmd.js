const bcrypt = require('bcrypt-nodejs');
const passwordGenerator = require('generate-password');

const { stdout } = process;

// eslint-disable-next-line
const genPass = async (length) => passwordGenerator.generate({
  length: length || 10,
  excludeSimilarCharacters: true,
  numbers: true,
  uppercase: true,
  symbols: true,
  exclude: ',_-|"\'{}+()<>~.:/^;[]',
});

module.exports = {
  command: 'gen-pass',
  describe: 'Generate a new password and return hash hash.\nDefault is 10 characters\ni.e. handy gen-pass 15 ',
  handler: async (argv) => {
    const params = argv._;
    const length = (params.length === 2) ? parseInt(params[1], 0) : 10;
    const plainPassword = await genPass(length);
    const hashedPass = bcrypt.hashSync(plainPassword);
    stdout.write(`\nPassword: ${plainPassword}\nHash: ${hashedPass}\n\n`);
  },
};
