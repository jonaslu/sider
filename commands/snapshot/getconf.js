const chalk = require('chalk');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const config = require('../../runtime/config');

async function getConf(snapshotName) {
  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    utils.didYouMean(snapshotName, await snapshots.getAllSnapshotNames(), 'Snapshot');
  }

  const { runtimeConfigSpec } = snapshot;
  if (Object.keys(runtimeConfigSpec).length === 0) {
    console.log(`No config set on ${chalk.cyanBright(snapshotName)}`);
    return;
  }

  config.printRuntimeConfigValues(runtimeConfigSpec);
}

const usage = `
Usage: sider snapshot getconf [options] <name>

Displays runtime config for a snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [snapshotName] = argv;
  return getConf(snapshotName);
}

module.exports = {
  processArgv
};
