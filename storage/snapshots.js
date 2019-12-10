const fsExtra = require('fs-extra');
const path = require('path');

const { internalErrorAndDie } = require('../utils');
const { snapshotsStoragePath } = require('../siderrc');

/**
 * {
 *  snapshotName: <- synthetic, not saved
 *  snapshotFileFolder: <- synthetic, not saved
 *  snapshotSpecsFile: <- synthetic, not saved

 *  engineName: 'redis',
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

    const snapshotFileFolder = path.join(
      snapshotsBasePath,
      snapshotFilesFolder
    );

    const snapshotSpecsFile = path.join(snapshotsBasePath, specsFileName);

    try {
      const snapshotSpecsContents = await fsExtra.readJSON(
        snapshotSpecsFile,
        'utf-8'
      );

      if (snapshotSpecsContents) {
        return {
          snapshotName,
          snapshotFileFolder,
          snapshotSpecsFile,
          ...snapshotSpecsContents
        };
      }
    } catch (e) {
      internalErrorAndDie(
        `Could not read file ${snapshotSpecsFile}.
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
