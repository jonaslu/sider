const fsExtra = require('fs-extra');
const path = require('path');

const { errorAndDie } = require('../utils');
const { snapshotsStoragePath } = require('../config');

/**
 * {
 *  snapshotName: <- synthetic, not saved
 *  snapshotFileFolder: <- synthetic, not saved
 *  snapshotConfigFile: <- synthetic, not saved

 *  engine: 'redis',
 *  fstats: {
 *    created
 *  },
 *  config: {
 *  }
 * }
 */
const snapshotFilesFolder = 'files';
const settingsFileName = 'settings.json';

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

    const snapshotsConfigFile = path.join(snapshotsBasePath, settingsFileName);

    try {
      const snapshotConfigContents = await fsExtra.readJSON(
        snapshotsConfigFile,
        'utf-8'
      );

      if (snapshotConfigContents) {
        return {
          snapshotName,
          snapshotsFileFolder,
          snapshotsConfigFile,
          ...snapshotConfigContents
        };
      }
    } catch (e) {
      errorAndDie(
        `Could not read file ${snapshotsConfigFile}.
Have you tampered with the contents in the ${snapshotsBasePath} folder?`,
        e
      );
    }

    return undefined;
  }
};
