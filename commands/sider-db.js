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
const engines = require('../engines');

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
  try {
    await engines.start(engineName, dbName, dbFileFolder, dbRuntimeConfig);
  } catch (e) {
    printInternalAndDie(`Could not start db ${dbName}`, e);
  }

  console.log(chalk.green(`Sucessfully shut down db ${chalk.blue(dbName)}`));

  if (persist) {
    await dbs.saveRuntimeConfig(db, cliRuntimeConfig);
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
  console.log(
    chalk.green(
      `✨ Sucessfully cloned db ${dbName} from snapshot ${snapshotName} 🚀`
    )
  );
}

async function promote(dbName, snapshotName) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    didYouMean(dbName, await dbs.getAllDbs(), 'Database');
  }

  const allSnapshots = await snapshots.getAllSnapshots();
  const snapshotExists = allSnapshots.some(snapshotname => snapshotname === snapshotName);

  if (snapshotExists) {
    printUserErrorAndDie(`Cannot promote db ${chalk.red(dbName)}, snapshot ${chalk.green(snapshotName)} already exists`);
  }

  const { engineName, dbFileFolder } = db;
  const engine = await engines.getEngineOrDie(engineName);

  await snapshots.createImportSnapshot(snapshotName, engine, engineName, dbFileFolder);

  console.log(`Successfully promoted db ${chalk.blue(dbName)} to snapshot ${chalk.green(snapshotName)}`);
}

async function reset(dbName) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    didYouMean(dbName, await dbs.getAllDbs(), 'Database');
  }

  await dbs.resetDb(db);

  console.log(`Successfully reset db ${chalk.green(dbName)}`);
}

async function remove(dbName) {
  const allDbs = await dbs.getAllDbs();

  const dbExists = allDbs.some(name => name === dbName);
  if (!dbExists) {
    didYouMean(dbName, await dbs.getAllDbs(), 'Database');
  }

  await dbs.removeDb(dbName);

  console.log(`Successfully removed db ${chalk.green(dbName)}`);
}
