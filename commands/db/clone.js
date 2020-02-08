const chalk = require('chalk');

const dbs = require('../../storage/db');
const snapshots = require('../../storage/snapshots');
const utils = require('../../utils');

async function clone(dbName, snapshotName) {
  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    utils.didYouMean(snapshotName, await snapshots.getAllSnapshotNames(), 'Snapshot');
  }

  const dbExists = await dbs.getDb(dbName);
  if (dbExists) {
    utils.printUserErrorAndDie(`Database ${chalk.green(dbName)} exists`);
  }

  await dbs.createDb(dbName, snapshot);
  console.log(chalk.green(`✨ Sucessfully cloned database ${dbName} from snapshot ${snapshotName} 🚀`));
}

const usage = `
Usage: sider db clone [options] <name> <snapshot>

Clones a database from a snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [dbName, snapshotName] = argv;

  if (!snapshotName) {
    utils.printUserErrorAndDie(`Missing the name of the snapshot to clone (parameter <snapshot>)`);
  }

  return clone(dbName, snapshotName);
}

module.exports = {
  processArgv
};
