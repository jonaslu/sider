const chalk = require('chalk');

const utils = require('../../utils');
const dbs = require('../../storage/db');

async function remove(dbName) {
  const allDbs = await dbs.getAllDbs();

  const dbExists = allDbs.some(name => name === dbName);
  if (!dbExists) {
    utils.didYouMean(dbName, allDbs, 'Database');
  }

  await dbs.removeDb(dbName);

  console.log(`Successfully removed db ${chalk.green(dbName)}`);
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
