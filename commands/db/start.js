const chalk = require('chalk');
const moment = require('moment');

const utils = require('../../utils');
const dbs = require('../../storage/db');
const snapshots = require('../../storage/snapshots');
const { getEngineRuntimeConfig } = require('../../storage/engine');
const runtimeConfig = require('../../runtime/config');
const engines = require('../../engines');

async function start(dbName, cliRuntimeConfig, persist) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbs(), 'Database');
  }

  const { snapshotName, engineName, dbFileFolder } = db;

  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    utils.printInternalAndDie(`Cannot find specs file for for snapshot: ${snapshotName}`);
  }

  const engineRuntimeConfig = await getEngineRuntimeConfig(engineName);

  const dbRuntimeConfig = runtimeConfig.mergeRuntimeConfig(
    engineRuntimeConfig.runtimeConfig,
    snapshot.runtimeConfig,
    db.runtimeConfig,
    cliRuntimeConfig
  );

  const { port } = dbRuntimeConfig;
  const dbStartTime = moment().utc();

  console.log(chalk.green(`✨ Starting database ${dbName} on port ${port} 🚀`));
  try {
    await engines.start(engineName, dbName, dbFileFolder, dbRuntimeConfig);
  } catch (e) {
    utils.internalErrorAndDie(`Could not start database ${dbName}`, e);
  }

  console.log(chalk.green(`Sucessfully shut down database ${chalk.blue(dbName)}`));

  if (persist) {
    await dbs.saveRuntimeConfig(db, cliRuntimeConfig);
  }

  await dbs.setLastUsed(db, dbStartTime);
}

const usage = `
Usage: sider db start [options] <name> [parameters...]

Starts the previously cloned database

Options:
  -p, --persist  Persist the parameters
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const { hasArgument: persist, rest } = utils.containsArguments(argv, '-p', '--persist');

  const [dbName, ...runtimeConfigKeyValues] = rest;
  if (!dbName) {
    utils.printUserErrorAndDie(`Missing what database to start (parameter <name>)`);
  }

  if (persist && !runtimeConfigKeyValues.length) {
    utils.printWarning(`Persist flag set but no runtime parameters (e g -p but no port=666)`);
  }

  const cliRuntimeConfig = runtimeConfig.parseRuntimeConfigKeyValues(runtimeConfigKeyValues);

  return start(dbName, cliRuntimeConfig, persist);
}

module.exports = {
  processArgv
};
