const chalk = require('chalk');

const utils = require('../../utils');
const dbs = require('../../storage/db');

async function remconf(dbName, runtimeConfigKeys) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbNames(), 'Database');
  }

  const { runtimeConfigSpec } = db;
  const dbRuntimeConfigSpecKeys = Object.keys(runtimeConfigSpec);

  let someRemoved = false;

  runtimeConfigKeys.forEach(runtimeConfigKey => {
    const keyExists = dbRuntimeConfigSpecKeys.indexOf(runtimeConfigKey) > -1;
    if (!keyExists) {
      utils.printWarning(`Cannot remove parameter ${runtimeConfigKey} - not found in settings`);
    } else {
      delete runtimeConfigSpec[runtimeConfigKey];
      someRemoved = true;
    }
  });


  if (someRemoved) {
    await dbs.overwriteRuntimeConfigSpec(db, runtimeConfigSpec);
    console.log(chalk.green(`Successfully removed settings on snapshot ${chalk.blue(dbName)}`));
  }
}

const usage = `
Usage: sider db remconf [options] <name> <parameters...>

Removes runtime config for a database

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName, ...runtimeConfigKeys] = argv;

  if (!runtimeConfigKeys.length) {
    utils.printUserErrorAndDie('Need at least one config to remove');
  }

  return remconf(dbName, runtimeConfigKeys);
}

module.exports = {
  processArgv
};
