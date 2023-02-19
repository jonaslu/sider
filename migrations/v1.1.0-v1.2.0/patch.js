const fsExtra = require('fs-extra');
const { getSnapshotSpecsContent, getSnapshotSpecPath } = require('./utils');
const { snapshotsStoragePath } = require('./v1_0_0_siderrc');

function patchSnapshotSpecsFile(snapshotDiskName) {
  const snapshotSpecJson = getSnapshotSpecsContent(snapshotDiskName);

  const { snapshotName, snapshotFileFolder, snapshotSpecsFile } = snapshotSpecJson;
  if (!snapshotName && !snapshotFileFolder && !snapshotSpecsFile) {
    return;
  }

  delete snapshotSpecJson.snapshotName;
  delete snapshotSpecJson.snapshotFileFolder;
  delete snapshotSpecJson.snapshotSpecsFile;

  console.log(`Patching snapshot ${snapshotDiskName}`);
  const snapshotSpecPath = getSnapshotSpecPath(snapshotDiskName);

  try {
    fsExtra.writeJSONSync(snapshotSpecPath, snapshotSpecJson, {
      spaces: 2,
    });
  } catch (e) {
    throw new Error(`Could not patch snapshot ${snapshotDiskName}. Error: ${e}. Manual removal needed.`);
  }
}

// For each on all snapshot folders
function patchSnapshots() {
  return fsExtra.readdirSync(snapshotsStoragePath).forEach(snapshotDiskName => patchSnapshotSpecsFile(snapshotDiskName));
}

module.exports = {
  patchSnapshots,
};

