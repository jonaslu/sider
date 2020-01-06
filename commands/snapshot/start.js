const chalk = require('chalk');
const moment = require('moment');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const { getEngineRuntimeConfig } = require('../../storage/engine');
const runtimeConfig = require('../../runtime/config');
const engines = require('../../engines');

async function addEmptySnapshot(
  engineName,
  snapshotName,
  cliRuntimeConfig,
  persist
) {
  const snapshotExists = await snapshots.getSnapshot(snapshotName);
  if (snapshotExists) {
    utils.printUserErrorAndDie(`Snapshot ${snapshotName} already exists`);
  }

  const allEngineNames = await engines.getAllEngineNames();
  const engineExists = allEngineNames.some(
    installedEngineName => installedEngineName === engineName
  );

  if (!engineExists) {
    utils.didYouMean(engineName, await engines.getAllEngineNames(), `Engine`);
  }

  const engineRuntimeConfig = await getEngineRuntimeConfig(engineName);

  const snapshotRuntimeConfig = runtimeConfig.mergeRuntimeConfig(
    engineRuntimeConfig.runtimeConfig,
    cliRuntimeConfig
  );

  const { port } = snapshotRuntimeConfig;

  console.log(
    chalk.green(`✨ Starting empty snapshot ${snapshotName} on port ${port} 🚀`)
  );
  await snapshots.createEmptySnapshot(
    snapshotName,
    engineName,
    snapshotRuntimeConfig
  );
  console.log(
    chalk.green(
      `Successfully shut down empty snapshot ${chalk.blue(snapshotName)}`
    )
  );

  if (persist) {
    const newlyCreatedSnapshot = await snapshots.getSnapshot(snapshotName);
    await snapshots.saveRuntimeConfig(newlyCreatedSnapshot, cliRuntimeConfig);
  }
}

const usage = `
Usage: sider snapshot start [options] <engine> <name> [parameters...]

Starts an empty snapshot

Options:
  -p, --persist  Persist the parameters
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const { hasArgument: persist, rest } = utils.containsArguments(argv, '-p', '--persist');

  const [engineName, snapshotName, ...runtimeConfigKeyValues] = rest;
  if (!snapshotName) {
    utils.printUserErrorAndDie(`Missing name for snapshot (parameter <name>)`);
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
