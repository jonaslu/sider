const chalk = require('chalk');

const engines = require('../../engines');
const dbs = require('../../storage/db');
const snapshots = require('../../storage/snapshots');
const utils = require('../../utils');

async function promote(dbName, snapshotName) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbNames(), 'Database');
  }

  const allSnapshots = await snapshots.getAllSnapshotNames();
  const snapshotExists = allSnapshots.some(name => name === snapshotName);

  if (snapshotExists) {
    utils.printUserErrorAndDie(`Cannot promote ${chalk.yellow(dbName)}, snapshot ${chalk.cyanBright(snapshotName)} already exists`);
  }

  const { engineName, dbFileFolder } = db;
  const engine = await engines.getEngineOrDie(engineName);

  await snapshots.createImportSnapshot(snapshotName, engine, engineName, dbFileFolder);

  console.log(`${chalk.green(`Successfully`)} promoted ${chalk.cyanBright(dbName)} to snapshot ${chalk.cyanBright(snapshotName)}`);
}

const usage = `
Usage: sider db promote [options] <name> <snapshot>

Promotes a database to a new snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName, snapshotName] = argv;
  if (!snapshotName) {
    utils.printUserErrorAndDie(`Missing the name of the new snapshot (parameter <snapshot-name>)`);
  }

  return promote(dbName, snapshotName);
}

module.exports = {
  processArgv,
};
