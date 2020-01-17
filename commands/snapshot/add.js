const fsExtra = require('fs-extra');

const engines = require('../../engines');
const snapshots = require('../../storage/snapshots');
const utils = require('../../utils');

async function addSnapshot(engineName, snapshotName, dumpBasePath) {
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

  await snapshots.createImportSnapshot(
    snapshotName,
    engine,
    engineName,
    dumpBasePath
  );
}

const usage = `
Usage: sider snapshot add [options] <engine> <name> <path>

Adds a snapshot from disk

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [engineName, snapshotName, dumpBasePath] = argv;
  if (!snapshotName) {
    utils.printUserErrorAndDie(`Missing the name of the snapshot (parameter <name>)`);
  }

  if (!dumpBasePath) {
    utils.printUserErrorAndDie('Missing the path of the dump (parameter <path>)');
  }

  return addSnapshot(engineName, snapshotName, dumpBasePath);
}

module.exports = {
  processArgv
};
