const chalk = require('chalk');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const config = require('../../runtime/config');

async function getconf(snapshotName) {
  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    utils.didYouMean(snapshotName, await snapshots.getAllSnapshotNames(), 'Snapshot');
  }

  const { runtimeConfigSpec } = snapshot;
  if (Object.keys(runtimeConfigSpec).length === 0) {
    // !! TODO !! Make coloring consistent
    console.log('No config set');
    return;
  }

  config.printRuntimeConfigValues(runtimeConfigSpec);
}

const usage = `
Usage: sider snapshot getconf [options] <name>

Displays runtime config for an engine

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [snapshotName] = argv;

  return getconf(snapshotName);
}

module.exports = {
  processArgv
};
