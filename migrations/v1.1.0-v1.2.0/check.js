/* eslint-disable camelcase */
const fsExtra = require('fs-extra');
const { getSnapshotSpecsContent } = require('./utils');
const { snapshotsStoragePath } = require('./v1_0_0_siderrc');

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
