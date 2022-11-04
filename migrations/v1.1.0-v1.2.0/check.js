/* eslint-disable camelcase */
const fsExtra = require('fs-extra');
const path = require('path');
const { snapshotsStoragePath } = require('./v1_0_0_siderrc');

const specsFileName = 'specs.json';

function getSnapshotSpecsContent(snapshotDiskName) {
  const snapshotSpecPath = path.join(snapshotsStoragePath, snapshotDiskName, specsFileName);

  if (!fsExtra.existsSync(snapshotSpecPath)) {
    return;
  }

  let snapshotSpecJson;
  try {
    snapshotSpecJson = fsExtra.readJSONSync(snapshotSpecPath);
  } catch (e) {
    console.error(`Error reading snapshot spec ${snapshotSpecPath} cannot patch ${snapshotDiskName}. Error: ${e}. Manual removal needed.`);
    return;
  }

  return snapshotSpecJson;
}

function snapshotSpecsFileHasSyntheticProperties(snapshotDiskName) {
  const snapshotSpecJson = getSnapshotSpecsContent(snapshotDiskName);
  if (!snapshotSpecJson) {
    return false;
  }

  const { snapshotName, snapshotFileFolder, snapshotSpecsFile } = snapshotSpecJson;
  if (!snapshotName && !snapshotFileFolder && !snapshotSpecsFile) {
    return false;
  }

  return true;
}

function detectMigrationToV1_2_0() {
  if (!fsExtra.pathExistsSync(snapshotsStoragePath)) {
    return false;
  }

  return fsExtra.readdirSync(snapshotsStoragePath).some(snapshotDiskName => snapshotSpecsFileHasSyntheticProperties(snapshotDiskName));
}

module.exports = {
  detectMigrationToV1_2_0,
};

