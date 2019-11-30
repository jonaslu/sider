const chalk = require('chalk');

const { printInternalAndDie, didYouMean } = require('../utils');
const dbs = require('../storage/db');
const snapshots = require('../storage/snapshots');
const engineConf = require('../storage/engine');
const settings = require('../settings');
const engine = require('../engines');

async function startDb(dbName, cliConfig, persist) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    didYouMean(dbName, await dbs.getAllDbs(), 'Database');
  }

  const { snapshotName, engineName } = db;

  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    printInternalAndDie(
      `Cannot find settings file for for snapshot: ${snapshotName}`
    );
  }

  const engineConfig = await engineConf.getEngineConfig(engineName);

  const dbStartSettings = settings.mergeSettings(
    engineConfig.config,
    snapshot.config,
    db.config,
    cliConfig
  );

  const { port } = dbStartSettings;

  console.log(chalk.green(`✨ Starting db ${dbName} on port ${port} 🚀`));
  await engine.start(engineName, db, dbStartSettings);
  console.log(chalk.green(`Sucessfully shut down db ${chalk.blue(dbName)}`));

  if (persist) {
    await dbs.saveSettings(db, cliConfig);
  }
}
