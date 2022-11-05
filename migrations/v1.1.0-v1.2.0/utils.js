const fsExtra = require('fs-extra');
const path = require('path');
const { snapshotsStoragePath } = require('./v1_0_0_siderrc');

const specsFileName = 'specs.json';

function getSnapshotSpecPath(snapshotDiskName) {
  return path.join(snapshotsStoragePath, snapshotDiskName, specsFileName);
}

function getSnapshotSpecsContent(snapshotDiskName) {
  const snapshotSpecPath = getSnapshotSpecPath(snapshotDiskName);

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

module.exports = {
  getSnapshotSpecPath,
  getSnapshotSpecsContent,
};
