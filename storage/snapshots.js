const fsExtra = require('fs-extra');
const moment = require('moment');
const path = require('path');

const {
  internalErrorAndDie,
  isUserError,
  printUserErrorAndDie
} = require('../utils');
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
  },

  // Expects it has been verified snapshot does not exist
  async createSnapshot(snapshotName, engine, engineName, dumpBasePath) {
    const snapshotBasePath = path.join(snapshotsStoragePath, snapshotName);
    const snapshotFileFolder = path.join(snapshotBasePath, snapshotFilesFolder);

    const cleanUpBeforeExit = async () => {
      try {
        await fsExtra.remove(snapshotBasePath);
      } catch (e) {
        internalErrorAndDie(`Could not remove snapshot at ${snapshotBasePath}`);
      }
    };

    await fsExtra.ensureDir(snapshotFileFolder);

    try {
      await engine.load(dumpBasePath, snapshotFileFolder);
    } catch (e) {
      await cleanUpBeforeExit();

      if (isUserError(e)) {
        printUserErrorAndDie(e.message);
      }

      internalErrorAndDie(
        `Could not load snapshot files from folder ${dumpBasePath}`,
        e
      );
    }

    const snapshotSpecsFile = path.join(snapshotBasePath, specsFileName);

    const snapshotSaveValues = {
      engineName,
      fstats: { created: moment().utc() },
      runtimeConfig: {}
    };

    try {
      await fsExtra.writeJSON(snapshotSpecsFile, snapshotSaveValues, {
        spaces: 2
      });
    } catch (e) {
      await cleanUpBeforeExit();

      internalErrorAndDie(`Could not write ${snapshotSpecsFile} contents`);
    }
  }
};
