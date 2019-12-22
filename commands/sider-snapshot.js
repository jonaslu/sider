const chalk = require('chalk');
const fsExtra = require('fs-extra');

const engines = require('../engines');
const snapshots = require('../storage/snapshots');
const { printUserErrorAndDie, didYouMean } = require('../utils');
const { getEngineRuntimeConfig } = require('../storage/engine');
const { mergeRuntimeConfig } = require('../runtime/config');

async function addSnapshot(engineName, snapshotName, dumpBasePath) {
  const dumpBasePathExists = await fsExtra.pathExists(dumpBasePath);
  if (!dumpBasePathExists) {
    printUserErrorAndDie(
      `Cannot add snapshot. Path ${dumpBasePath} does not exist`
    );
  }

  const snapshotExists = await snapshots.getSnapshot(snapshotName);
  if (snapshotExists) {
    printUserErrorAndDie(`Snapshot ${snapshotName} already exists`);
  }

  const engine = await engines.getEngine(engineName);
  if (!engine) {
    didYouMean(engineName, await engines.getAllEngineNames(), `Engine`);
  }

  await snapshots.createImportSnapshot(
    snapshotName,
    engine,
    engineName,
    dumpBasePath
  );
}

async function addEmptySnapshot(
  engineName,
  snapshotName,
  cliRuntimeConfig,
  persist
) {
  const snapshotExists = await snapshots.getSnapshot(snapshotName);
  if (snapshotExists) {
    printUserErrorAndDie(`Snapshot ${snapshotName} already exists`);
  }

  const allEngineNames = await engines.getAllEngineNames();
  const engineExists = allEngineNames.some(
    installedEngineName => installedEngineName === engineName
  );

  if (!engineExists) {
    didYouMean(engineName, await engines.getAllEngineNames(), `Engine`);
  }

  const engineRuntimeConfig = await getEngineRuntimeConfig(engineName);

  const snapshotRuntimeConfig = mergeRuntimeConfig(
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
      `Sucessfully shut down empty snapshot ${chalk.blue(snapshotName)}`
    )
  );

  if (persist) {
    const newlyCreatedSnapshot = await snapshots.getSnapshot(snapshotName);
    await snapshots.saveRuntimeConfig(newlyCreatedSnapshot, cliRuntimeConfig);
  }
}

module.exports = {
  addSnapshot(engineName, snapshotName, importSnapshotDiskPath, options) {
    commandFound = true;

    const { empty } = options;
    if (empty && importSnapshotDiskPath) {
    }
  }
};
