const chalk = require('chalk');
const fsExtra = require('fs-extra');

const engines = require('../../engines');
const runtimeConfig = require('../../runtime/config');
const snapshots = require('../../storage/snapshots');
const utils = require('../../utils');

async function addSnapshot(engineName, snapshotName, dumpBasePath, cliRuntimeConfig) {
  const dumpBasePathExists = await fsExtra.pathExists(dumpBasePath);
  if (!dumpBasePathExists) {
    utils.printUserErrorAndDie(
      `Cannot add snapshot. Path ${dumpBasePath} does not exist`
    );
  }

  const snapshotExists = await snapshots.getSnapshot(snapshotName);
  if (snapshotExists) {
    utils.printUserErrorAndDie(`Snapshot ${snapshotName} already exists`);
  }

  const engine = await engines.getEngine(engineName);
  if (!engine) {
    utils.didYouMean(engineName, await engines.getAllEngineNames(), `Engine`);
  }

  const snapshot = await snapshots.createImportSnapshot(
    snapshotName,
    engine,
    engineName,
    dumpBasePath
  );

  await snapshots.saveRuntimeConfig(snapshot, cliRuntimeConfig)

  console.log(`Successfully added snapshot ${chalk.green(snapshotName)}`);
}

const usage = `
Usage: sider snapshot add [options] <engine> <name> <path> [parameters...]

Adds a snapshot from disk

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [engineName, snapshotName, dumpBasePath, ...snapshotRuntimeConfigKeyValues] = argv;
  if (!snapshotName) {
    utils.printUserErrorAndDie(`Missing the name of the snapshot (parameter <name>)`);
  }

  if (!dumpBasePath) {
    utils.printUserErrorAndDie('Missing the path of the dump (parameter <path>)');
  }

  const cliRuntimeConfig = runtimeConfig.parseRuntimeConfigKeyValues(snapshotRuntimeConfigKeyValues);

  return addSnapshot(engineName, snapshotName, dumpBasePath, cliRuntimeConfig);
}

module.exports = {
  processArgv
};
