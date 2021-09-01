const chalk = require('chalk');

const dbs = require('../../storage/db');
const utils = require('../../utils');

async function move(dbName, newName) {
  if (dbName === newName) {
    utils.printUserErrorAndDie(`${chalk.yellow(dbName)} source and destination names are the same`);
  }

  const oldDb = await dbs.getDb(dbName);
  if (!oldDb) {
    utils.printUserErrorAndDie(`${chalk.yellow(dbName)} does not exist`);
  }

  const allExistingDbs = await dbs.getAllDbNames()
  const newDbAlreadyExists = allExistingDbs.some(name => name === newName)
  if (newDbAlreadyExists) {
    utils.printUserErrorAndDie(`${chalk.yellow(newName)} already exist`);
  }

  await dbs.renameDb(oldDb, newName);
  console.log(`${chalk.green(`Successfully`)} renamed database ${chalk.cyanBright(dbName)} to snapshot ${chalk.cyanBright(newName)}`);
}

const usage = `
Usage: sider db mv <name> <new-name>

Renames a database

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName, snapshotName] = argv;

  if (!snapshotName) {
    utils.printUserErrorAndDie(`Missing the name of the database to rename (parameter <name>)`);
  }

  return move(dbName, snapshotName);
}

module.exports = {
  processArgv
};
