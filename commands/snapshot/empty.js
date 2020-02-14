const chalk = require('chalk');

const engines = require('../../engines');
const runtimeConfig = require('../../runtime/config');
const { getEngineRuntimeConfig } = require('../../storage/engine');
const { printUserErrorAndDie, didYouMean } = require('../../utils');
const snapshots = require('../../storage/snapshots');
const utils = require('../../utils');

async function addEmptySnapshot(engineName, snapshotName, cliRuntimeConfig, persist) {
  const snapshotExists = await snapshots.getSnapshot(snapshotName);
  if (snapshotExists) {
    printUserErrorAndDie(`Snapshot ${snapshotName} already exists`);
  }

  const allEngineNames = await engines.getAllEngineNames();
  const engineExists = allEngineNames.some(installedEngineName => installedEngineName === engineName);

  if (!engineExists) {
    didYouMean(engineName, await engines.getAllEngineNames(), `Engine`);
  }

  const engineRuntimeConfig = await getEngineRuntimeConfig(engineName);
  const snapshotRuntimeConfig = runtimeConfig.mergeRuntimeConfig(engineRuntimeConfig.runtimeConfigSpec, cliRuntimeConfig);

  const { port } = snapshotRuntimeConfig;

  console.log(chalk.green(`✨ Starting empty snapshot ${snapshotName} on port ${port} 🚀`));

  const newSnapshot = await snapshots.createEmptySnapshot(snapshotName, engineName, snapshotRuntimeConfig);

  console.log(chalk.green(`Successfully shut down empty snapshot ${chalk.blue(snapshotName)}`));

  if (persist) {
    await snapshots.appendRuntimeConfig(newSnapshot, cliRuntimeConfig);
  }
}

const usage = `
Usage: sider snapshot empty [options] <engine> <name> [parameters...]

Starts and then saves an empty snapshot

Options:
  -p, --persist  Persist the parameters
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const { hasArgument: persist, rest } = utils.containsArguments(argv, '-p', '--persist');
  const [engineName, snapshotName, ...runtimeConfigKeyValues] = rest;

  if (!snapshotName) {
    utils.printUserErrorAndDie(`Missing the name of the snapshot (parameter <name>)`);
  }

  if (persist && !runtimeConfigKeyValues.length) {
    utils.printWarning(`Persist flag set but no runtime parameters (e g -p but no port=666)`);
  }

  const cliRuntimeConfig = runtimeConfig.parseRuntimeConfigKeyValues(runtimeConfigKeyValues);

  return addEmptySnapshot(engineName, snapshotName, cliRuntimeConfig, persist);
}

module.exports = {
  processArgv
};
