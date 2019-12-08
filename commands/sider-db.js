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
const { mergeRuntimeConfig } = require('../runtime/config')
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
  const dbStartTime = moment().utc();

  console.log(chalk.green(`✨ Starting db ${dbName} on port ${port} 🚀`));
  await engine.start(engineName, dbName, dbFileFolder, dbRuntimeConfig);
  console.log(chalk.green(`Sucessfully shut down db ${chalk.blue(dbName)}`));

  await dbs.setLastUsed(db, dbStartTime);

  if (persist) {
    await dbs.saveRuntimeConfig(db, cliRuntimeConfig);
  }
}
