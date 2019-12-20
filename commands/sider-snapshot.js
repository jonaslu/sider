const engines = require('../engines');
const fsExtra = require('fs-extra');
const snapshots = require('../storage/snapshots');
const { printUserErrorAndDie, didYouMean } = require('../utils');

async function addSnapshot(engineName, snapshotName, dumpBasePath) {
  const dumpBasePathExists = await fsExtra.pathExists(dumpBasePath);
  if (!dumpBasePathExists) {
    printUserErrorAndDie(`Cannot add snapshot. Path ${dumpBasePath} does not exist`);
  }

  const snapshotExists = await snapshots.getSnapshot(snapshotName);
  if (snapshotExists) {
    printUserErrorAndDie(`Snapshot ${snapshotName} already exists`);
  }

  const engine  = await engines.getEngine(engineName);
  if (!engine) {
    didYouMean(engineName, await engines.getAllEngineNames(), `Engine`)
  }

  await snapshots.createSnapshot(snapshotName, engine, engineName, dumpBasePath);
}
