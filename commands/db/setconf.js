const chalk = require('chalk');

const utils = require('../../utils');
const dbs = require('../../storage/db');
const runtimeConfig = require('../../runtime/config');

async function setconf(dbName, runtimeConfigValues) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbNames(), 'Database');
  }

  await dbs.appendRuntimeConfig(db, runtimeConfigValues);
  console.log(chalk.green(`Successfully stored settings on database ${chalk.blue(dbName)}`));
}

const usage = `
Usage: sider db setconf [options] <name> <parameters...>

Sets runtime config for a database

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName, ...runtimeConfigKeyValues] = argv;

  if (!runtimeConfigKeyValues.length) {
    utils.printUserErrorAndDie('Need at least one setting');
  }

  const cliRuntimeConfig = runtimeConfig.parseRuntimeConfigKeyValues(runtimeConfigKeyValues);

  return setconf(dbName, cliRuntimeConfig);
}

module.exports = {
  processArgv
};
