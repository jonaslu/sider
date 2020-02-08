const chalk = require('chalk');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const dbs = require('../../storage/db');

async function remove(snapshotName) {
  const allSnapshots = await snapshots.getAllSnapshotNames();
  const snapshotExists = allSnapshots.some(name => name === snapshotName);
  if (!snapshotExists) {
    utils.didYouMean(snapshotName, allSnapshots, 'Snapshot');
  }

  await snapshots.removeSnapshot(snapshotName);
  console.log(`Successfully removed snapshot ${chalk.green(snapshotName)}`);

  const removedDbNames = await dbs.removeDbsForSnapshot(snapshotName);
  if (removedDbNames.length) {
    console.log(`Removed cloned databases: ${chalk.green(removedDbNames.join(', '))}`);
  }
}

const usage = `
Usage: sider snapshot remove [options] <name>

Removes a snapshot and it's cloned databases

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [snapshotName] = argv;
  return remove(snapshotName);
}

module.exports = {
  processArgv
};
