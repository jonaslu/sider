const chalk = require('chalk');

const utils = require('../../utils');
const dbs = require('../../storage/db');

async function remove(dbName) {
  const allDbs = await dbs.getAllDbNames();

  const dbExists = allDbs.some(name => name === dbName);
  if (!dbExists) {
    utils.didYouMean(dbName, allDbs, 'Database');
  }

  await dbs.removeDb(dbName);

  console.log(`${chalk.green(`Successfully`)} removed db ${chalk.cyanBright(dbName)}`);
}

const usage = `
Usage: sider db remove [options] <name>

Removes a database

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName] = argv;
  return remove(dbName);
}

module.exports = {
  processArgv
};
