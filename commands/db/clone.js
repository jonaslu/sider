const chalk = require('chalk');

const {
  didYouMean,
  printUserErrorAndDie,
  printUsageAndExit,
  containsArguments
} = require('../../utils');

const dbs = require('../../storage/db');
const snapshots = require('../../storage/snapshots');

const usage = `
Usage: sider db clone [options] <name> <snapshot>

Clones a database from a snapshot

Options:
  -h, --help     output usage information
`;

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
      `✨ Sucessfully cloned database ${dbName} from snapshot ${snapshotName} 🚀`
    )
  );
}

async function processArgv(argv = []) {
  if (!argv.length) {
    printUsageAndExit(usage);
  }

  const { hasArgument: wantHelp } = containsArguments(argv, '-h', '--help');
  if (wantHelp) {
    printUsageAndExit(usage);
  }

  const [dbName, snapshotName] = argv;

  if (!snapshotName) {
    printUserErrorAndDie(`Missing the name of the snapshot to clone (parameter <snapshot>)`);
  }

  return clone(dbName, snapshotName);
}

module.exports = {
  processArgv
}
