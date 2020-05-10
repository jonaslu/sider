const chalk = require('chalk');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');

async function remconf(snapshotName, runtimeConfigKeys) {
  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    utils.didYouMean(snapshotName, await snapshots.getAllSnapshotNames(), 'Snapshot');
  }

  const { runtimeConfigSpec } = snapshot;
  const snapshotRuntimeConfigSpecKeys = Object.keys(runtimeConfigSpec);

  let someRemoved = false;

  runtimeConfigKeys.forEach(runtimeConfigKey => {
    const keyExists = snapshotRuntimeConfigSpecKeys.indexOf(runtimeConfigKey) > -1;
    if (!keyExists) {
      utils.printWarning(`Cannot remove parameter ${chalk.yellow(runtimeConfigKey)} - not found in settings`);
    } else {
      delete runtimeConfigSpec[runtimeConfigKey];
      someRemoved = true;
    }
  });


  if (someRemoved) {
    await snapshots.overwriteRuntimeConfigSpec(snapshot, runtimeConfigSpec);
    console.log(`${chalk.green(`Successfully`)} removed settings on snapshot ${chalk.cyanBright(snapshotName)}`);
  }
}

const usage = `
Usage: sider snapshot remconf [options] <name> <parameters...>

Removes runtime config for a snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [snapshotName, ...runtimeConfigKeys] = argv;

  if (!runtimeConfigKeys.length) {
    utils.printUserErrorAndDie('Need at least one config to remove');
  }

  return remconf(snapshotName, runtimeConfigKeys);
}

module.exports = {
  processArgv
};
