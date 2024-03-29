/* eslint-disable camelcase */
const path = require('path');
const fsExtra = require('fs-extra');

const v0_0_8_siderrc = require('./v0_0_8_siderrc');

function getSnapshotEngineName(snapshotName) {
  const { snapshotsStoragePath } = v0_0_8_siderrc;

  let snapshotFolderContents;
  try {
    snapshotFolderContents = fsExtra.readdirSync(path.join(snapshotsStoragePath, snapshotName));
  } catch (e) {
    throw new Error(`Could not read snapshot folder ${snapshotName}: error ${e}`);
  }

  const supportedEngines = ['redis', 'mariadb', 'postgres'];

  const foundEngines = snapshotFolderContents.filter((snapshotFolder) => supportedEngines.indexOf(snapshotFolder) !== -1);
  if (foundEngines.length === 0) {
    throw new Error(`Did not find any supported engines in folder ${snapshotsStoragePath}`);
  }

  const [engineName] = foundEngines;
  if (foundEngines.length > 1) {
    console.warn(`When migrating ${snapshotName} found several engines inside snapshot folder ${snapshotsStoragePath}.`);
    console.warn(`Will only migrate first found ${engineName}`);
  }

  return engineName;
}

function moveSnapshotFiles(snapshotName, engineName) {
  const { snapshotsStoragePath, baseDir } = v0_0_8_siderrc;
  const v0_0_8_snapshotFilesPath = path.join(snapshotsStoragePath, snapshotName, engineName);

  const v1_0_0_snapshotFilesPath = path.join(baseDir, 'snapshots', snapshotName, 'files');

  try {
    fsExtra.moveSync(v0_0_8_snapshotFilesPath, v1_0_0_snapshotFilesPath);
  } catch (e) {
    throw new Error(`Could not move files in folder ${v0_0_8_snapshotFilesPath} to ${v1_0_0_snapshotFilesPath}: error ${e}`);
  }
}

function createNewSnapshotSpec(snapshotName, engineName) {
  const { snapshotsStoragePath, baseDir } = v0_0_8_siderrc;
  const { birthtime } = fsExtra.lstatSync(path.join(snapshotsStoragePath, snapshotName));

  const snapshotSpec = {
    engineName,
    fstats: {
      created: birthtime,
    },
    runtimeConfigSpec: {},
  };

  const v1_0_0_snapshotDir = path.join(baseDir, 'snapshots/', snapshotName);
  const v1_0_0_snapshotSpec = path.join(v1_0_0_snapshotDir, 'specs.json');

  try {
    fsExtra.ensureDirSync(v1_0_0_snapshotDir);
    fsExtra.writeJSONSync(v1_0_0_snapshotSpec, snapshotSpec, {
      spaces: 2,
    });
  } catch (e) {
    throw new Error(`Could not write snapshot specs.json ${v1_0_0_snapshotSpec}: error ${e}`);
  }
}

function removeSnapshotFilesPath(snapshotName, engineName) {
  const { snapshotsStoragePath, snapshotsFolder } = v0_0_8_siderrc;

  if (snapshotsFolder === 'snapshots/') {
    const v0_0_8_removePath = path.join(snapshotsStoragePath, snapshotName, engineName);
    try {
      fsExtra.removeSync(v0_0_8_removePath);
    } catch (e) {
      throw new Error(`Could not remove old snapshot folder ${v0_0_8_removePath}: error ${e}`);
    }
  }
}

function migrateSnapshot(snapshotName) {
  const engineName = getSnapshotEngineName(snapshotName);
  createNewSnapshotSpec(snapshotName, engineName);
  moveSnapshotFiles(snapshotName, engineName);
  removeSnapshotFilesPath(snapshotName, engineName);
}

function migrateAllSnapshots() {
  const { snapshotsStoragePath, snapshotsFolder, baseDir } = v0_0_8_siderrc;

  let dirContents;
  try {
    dirContents = fsExtra.readdirSync(snapshotsStoragePath, 'utf-8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw new Error(`Error occurred when trying to migrate snapshot path ${snapshotsStoragePath}: error ${e}`);
    }
  }

  dirContents.forEach((snapshotName) => migrateSnapshot(snapshotName));

  if (snapshotsFolder !== 'snapshots/') {
    const [firstSubFolder] = snapshotsFolder.split(path.sep);
    const removeFolder = path.join(baseDir, firstSubFolder);

    try {
      fsExtra.removeSync(removeFolder);
    } catch (e) {
      throw new Error(`Could not remove old snapshots folder ${snapshotsStoragePath}: error ${e}`);
    }
  }
}

module.exports = {
  migrateAllSnapshots,
};
