const chalk = require('chalk');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');

async function remove(snapshot) {
  const allSnapshots = await snapshots.getAllSnapshots();
  const snapshotExists = allSnapshots.some(name => name === snapshot);
  if (!snapshotExists) {
    utils.didYouMean(snapshot, allSnapshots, 'Snapshot');
  }

  await snapshots.removeSnapshot(snapshot);

  console.log(`Successfully removed snapshot ${chalk.green(snapshot)}`);
}

const usage = `
Usage: sider snapshot remove [options] <name>

Removes a snapshot

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
