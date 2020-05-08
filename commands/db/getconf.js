const dbs = require('../../storage/db');
const utils = require('../../utils');
const config = require('../../runtime/config')

async function getConf(dbName) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbNames(), `Database`);
  }

  const { runtimeConfigSpec } = db;
  if (Object.keys(runtimeConfigSpec).length === 0) {
    console.log('No config set');
    return;
  }

  config.printRuntimeConfigValues(runtimeConfigSpec);
}

const usage = `
Usage: sider db getconf [options] <name>

Displays runtime config for a database

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName] = argv;
  return getConf(dbName);
}

module.exports = {
  processArgv
};
