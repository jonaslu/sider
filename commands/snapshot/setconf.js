const chalk = require('chalk');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const runtimeConfig = require('../../runtime/config');

async function setconf(snapshotName, runtimeConfigValues) {
  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    utils.didYouMean(snapshotName, await snapshots.getAllSnapshotNames(), 'Snapshot');
  }

  await snapshots.appendRuntimeConfig(snapshot, runtimeConfigValues);
  console.log(chalk.green(`Successfully stored settings on snapshot ${chalk.blue(snapshotName)}`));
}

const usage = `
Usage: sider snapshot setconf [options] <name> <parameters...>

Sets runtime config for a snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [snapshotName, ...runtimeConfigKeyValues] = argv;

  if (!runtimeConfigKeyValues.length) {
    utils.printUserErrorAndDie('Need at least one setting');
  }

  const cliRuntimeConfig = runtimeConfig.parseRuntimeConfigKeyValues(runtimeConfigKeyValues);

  return setconf(snapshotName, cliRuntimeConfig);
}

module.exports = {
  processArgv
};
