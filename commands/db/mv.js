const chalk = require('chalk');

const dbs = require('../../storage/db');
const utils = require('../../utils');

async function move(dbName, newName) {
  if (dbName === newName) {
    utils.printUserErrorAndDie(`${chalk.yellow(dbName)} source and destination names are the same`);
  }

  const allDbs = await dbs.getAllDbNames();
  const oldDbExists = allDbs.some(name => name === dbName)
  if (!oldDbExists) {
    utils.didYouMean(dbName, allDbs ,'Database');
  }

  const newDbAlreadyExists = allDbs.some(name => name === newName)
  if (newDbAlreadyExists) {
    utils.printUserErrorAndDie(`${chalk.yellow(newName)} already exists`);
  }

  await dbs.renameDb(dbName, newName);
  console.log(`${chalk.green(`Successfully`)} renamed database ${chalk.cyanBright(dbName)} to ${chalk.cyanBright(newName)}`);
}

const usage = `
Usage: sider db mv <name> <new-name>

Renames a database

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName, newName] = argv;

  if (!newName) {
    utils.printUserErrorAndDie(`Missing the new name of the database (parameter <new-name>)`);
  }

  return move(dbName, newName);
}

module.exports = {
  processArgv
};
