const chalk = require('chalk');

const dbs = require('../../storage/db');
const utils = require('../../utils');

async function eject(dbName, ejectFolder) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbNames(), 'Database');
  }

  await dbs.ejectDb(db, ejectFolder);
  console.log(chalk.green(`Successfully ejected files for database ${dbName} to path ${ejectFolder}`));
}

const usage = `
Usage: sider db eject [options] <name> <ejectPath>

Ejects the files stored in the database.

Creates the path if it does not exists.
Overwrites if it does exist.

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName, ejectFolder] = argv;

  if (!ejectFolder) {
    utils.printUserErrorAndDie(`Missing path to ejected files (parameter <ejectPath>)`);
  }

  return eject(dbName, ejectFolder);
}

module.exports = {
  processArgv
};
