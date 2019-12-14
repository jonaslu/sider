const chalk = require('chalk');
const moment = require('moment');

const {
  printInternalAndDie,
  didYouMean,
  printUserErrorAndDie
} = require('../utils');
const dbs = require('../storage/db');
const snapshots = require('../storage/snapshots');
const { getEngineRuntimeConfig } = require('../storage/engine');
const { mergeRuntimeConfig } = require('../runtime/config');
const engine = require('../engines');

async function startDb(dbName, cliRuntimeConfig, persist) {
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

  console.log(chalk.green(`✨ Starting db ${dbName} on port ${port} 🚀`));
  await engine.start(engineName, dbName, dbFileFolder, dbRuntimeConfig);
  console.log(chalk.green(`Sucessfully shut down db ${chalk.blue(dbName)}`));

  if (persist) {
    await dbs.saveRuntimeConfig(db, cliRuntimeConfig);
  }

  const dbStartTime = moment().utc();
  try {
    await mergeRuntimeConfigAndStart(db, snapshots, cliRuntimeConfig, persist);
  } catch (e) {
    printInternalAndDie(`Could not start db ${dbName}`, e);
  }

  await dbs.setLastUsed(db, dbStartTime);
}

async function clone(dbName, snapshotName) {
  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    didYouMean(snapshotName, await snapshots.getAllSnapshots(), 'Snapshot');
  }

  const dbExists = await dbs.getDb(dbName);
  if (dbExists) {
    printUserErrorAndDie(`Database ${chalk.green(dbName)} exists`);
  }

  await dbs.createDb(dbName, snapshot);
  console.log(chalk.green(`✨ Sucessfully cloned db ${dbName} from snapshot ${snapshotName} 🚀`));
}
