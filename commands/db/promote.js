const chalk = require('chalk');

const engines = require('../../engines');
const dbs = require('../../storage/db');
const snapshots = require('../../storage/snapshots');
const utils = require('../../utils');

async function promote(dbName, snapshotName) {
  const db = await dbs.getDb(dbName);
  if (!db) {
    utils.didYouMean(dbName, await dbs.getAllDbs(), 'Database');
  }

  const allSnapshots = await snapshots.getAllSnapshots();
  const snapshotExists = allSnapshots.some(
    snapshotname => snapshotname === snapshotName
  );

  if (snapshotExists) {
    utils.printUserErrorAndDie(
      `Cannot promote ${chalk.red(dbName)}, snapshot ${chalk.green(
        snapshotName
      )} already exists`
    );
  }

  const { engineName, dbFileFolder } = db;
  const engine = await engines.getEngineOrDie(engineName);

  await snapshots.createImportSnapshot(
    snapshotName,
    engine,
    engineName,
    dbFileFolder
  );

  console.log(
    `Successfully promoted ${chalk.blue(dbName)} to snapshot ${chalk.green(
      snapshotName
    )}`
  );
}

const usage = `
Usage: sider db promote [options] <name> <snapshot-name>

Promotes a database to a new snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  if (!argv.length) {
    utils.printUsageAndExit(usage);
  }

  const { hasArgument: wantHelp } = utils.containsArguments(
    argv,
    '-h',
    '--help'
  );
  if (wantHelp) {
    utils.printUsageAndExit(usage);
  }

  const [dbName, snapshotName] = argv;
  if (!snapshotName) {
    utils.printUserErrorAndDie(
      `Missing the name of the new snapshot (parameter <snapshot-name>)`
    );
  }

  return promote(dbName, snapshotName);
}

module.exports = {
  processArgv
};
