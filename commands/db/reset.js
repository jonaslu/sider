const chalk = require('chalk');

const utils = require('../../utils');
const dbs = require('../../storage/db');

async function reset(dbName) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbNames(), 'Database');
  }

  await dbs.resetDb(db);

  console.log(`${chalk.green(`Successfully`)} reset ${chalk.cyanBright(dbName)}`);
}

const usage = `
Usage: sider db reset [options] <name>

Resets a database to it's initial cloned state

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName] = argv;
  return reset(dbName);
}

module.exports = {
  processArgv,
};
