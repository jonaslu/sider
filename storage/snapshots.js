const fsExtra = require('fs-extra');
const path = require('path');

const { internalErrorAndDie } = require('../utils');
const { snapshotsStoragePath } = require('../siderrc');

/**
 * {
 *  snapshotName: <- synthetic, not saved
 *  snapshotFileFolder: <- synthetic, not saved
 *  snapshotSoecsFile: <- synthetic, not saved

 *  engine: 'redis',
 *  fstats: {
 *    created
 *  },
 *  runtimeConfig: {
 *  }
 * }
 */
const snapshotFilesFolder = 'files';
const specsFileName = 'specs.json';

module.exports = {
  async getSnapshot(snapshotName) {
    const snapshotsBasePath = path.join(snapshotsStoragePath, snapshotName);

    const snapshotExists = await fsExtra.pathExists(snapshotsBasePath);
    if (!snapshotExists) {
      return undefined;
    }

    const snapshotsFileFolder = path.join(
      snapshotsBasePath,
      snapshotFilesFolder
    );

    const snapshotsSpecsFile = path.join(snapshotsBasePath, specsFileName);

    try {
      const snapshotSpecsContents = await fsExtra.readJSON(
        snapshotsSpecsFile,
        'utf-8'
      );

      if (snapshotSpecsContents) {
        return {
          snapshotName,
          snapshotsFileFolder,
          snapshotsSpecsFile,
          ...snapshotSpecsContents
        };
      }
    } catch (e) {
      internalErrorAndDie(
        `Could not read file ${snapshotsSpecsFile}.
Has the contents been tampered with?`,
        e
      );
    }

    return undefined;
  },
  async getAllSnapshots() {
    const anySnapshotExists = await fsExtra.pathExists(snapshotsStoragePath);
    if (anySnapshotExists) {
      return fsExtra.readdir(snapshotsStoragePath);
    }

    return [];
  }
};
