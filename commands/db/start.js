const chalk = require('chalk');
const moment = require('moment');

const {
  printInternalAndDie,
  internalErrorAndDie,
  didYouMean,
  printUsageAndExit,
  containsArguments,
  printWarning,
  printUserErrorAndDie
} = require('../../utils');

const dbs = require('../../storage/db');
const snapshots = require('../../storage/snapshots');
const { getEngineRuntimeConfig } = require('../../storage/engine');
const {
  mergeRuntimeConfig,
  parseRuntimeConfigKeyValues
} = require('../../runtime/config');
const engines = require('../../engines');

const usage = `
Usage: sider db start [options] <name> [parameters...]

Starts the previously cloned database

Options:
  -p, --persist  Persist the parameters
  -h, --help     output usage information
`;

async function start(dbName, cliRuntimeConfig, persist) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    didYouMean(dbName, await dbs.getAllDbs(), 'Database');
  }

  const { snapshotName, engineName, dbFileFolder } = db;

  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    printInternalAndDie(
      `Cannot find specs file for for snapshot: ${snapshotName}`
    );
  }

  const engineRuntimeConfig = await getEngineRuntimeConfig(engineName);

  const dbRuntimeConfig = mergeRuntimeConfig(
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
    internalErrorAndDie(`Could not start database ${dbName}`, e);
  }

  console.log(chalk.green(`Sucessfully shut down ddatabase ${chalk.blue(dbName)}`));

  if (persist) {
    await dbs.saveRuntimeConfig(db, cliRuntimeConfig);
  }

  await dbs.setLastUsed(db, dbStartTime);
}

async function processArgv(argv = []) {
  if (!argv.length) {
    printUsageAndExit(usage);
  }

  const { hasArgument: wantHelp } = containsArguments(argv, '-h', '--help');
  if (wantHelp) {
    printUsageAndExit(usage);
  }

  const { hasArgument: persist, rest } = containsArguments(argv, '-p', '--persist');

  const [dbName, ...runtimeConfig] = rest;
  if (!dbName) {
    printUserErrorAndDie(`Missing what database to start (parameter <name>)`)
  }

  if (persist && !runtimeConfig.length) {
    printWarning(`Persist flag set but no runtime parameters (e g -p but no port=666)`);
  }

  const cliRuntimeConfig = parseRuntimeConfigKeyValues(runtimeConfig);

  return start(dbName, cliRuntimeConfig, persist);
}

module.exports = {
  processArgv
};
