const fsExtra = require('fs-extra');
const moment = require('moment');
const path = require('path');

const engine = require('../engines');
const { mergeRuntimeConfig } = require('../runtime/config');

const { internalErrorAndDie, isUserError, printUserErrorAndDie } = require('../utils');
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

// Expects it has been verified snapshot does not exist
async function createSnapshot(snapshotName, engineName, loadFilesCb) {
  const snapshotBasePath = path.join(snapshotsStoragePath, snapshotName);
  const snapshotFileFolder = path.join(snapshotBasePath, snapshotFilesFolder);

  const cleanUpBeforeExit = async () => {
    try {
      await fsExtra.remove(snapshotBasePath);
    } catch (e) {
      internalErrorAndDie(`Could not remove snapshot at ${snapshotBasePath}`, e);
    }
  };

  await fsExtra.ensureDir(snapshotFileFolder);

  await loadFilesCb(snapshotFileFolder, cleanUpBeforeExit);

  const snapshotSpecsFile = path.join(snapshotBasePath, specsFileName);

  const snapshotSaveValues = {
    engineName,
    fstats: { created: moment().format() },
    runtimeConfig: {}
  };

  try {
    await fsExtra.writeJSON(snapshotSpecsFile, snapshotSaveValues, {
      spaces: 2
    });
  } catch (e) {
    await cleanUpBeforeExit();

    internalErrorAndDie(`Could not write ${snapshotSpecsFile} contents`, e);
  }

  // !! TODO !! This is the same as in getSnapshot - marge them
  // if we copy paste a third time
  return {
    snapshotName,
    snapshotFileFolder,
    snapshotSpecsFile,
    ...snapshotSaveValues
  };
}

module.exports = {
  async getSnapshot(snapshotName) {
    const snapshotsBasePath = path.join(snapshotsStoragePath, snapshotName);

    const snapshotExists = await fsExtra.pathExists(snapshotsBasePath);
    if (!snapshotExists) {
      return undefined;
    }

    const snapshotFileFolder = path.join(snapshotsBasePath, snapshotFilesFolder);
    const snapshotSpecsFile = path.join(snapshotsBasePath, specsFileName);

    try {
      const snapshotSpecsContents = await fsExtra.readJSON(snapshotSpecsFile, 'utf-8');

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
  async getAllSnapshotNames() {
    const anySnapshotExists = await fsExtra.pathExists(snapshotsStoragePath);
    if (anySnapshotExists) {
      return fsExtra.readdir(snapshotsStoragePath);
    }

    return [];
  },

  // Expects it has been verified snapshot does not exist
  async createImportSnapshot(snapshotName, engine, engineName, dumpBasePath) {
    return createSnapshot(snapshotName, engineName, async (snapshotFileFolder, cleanUpBeforeExit) => {
      try {
        await engine.load(dumpBasePath, snapshotFileFolder);
      } catch (e) {
        await cleanUpBeforeExit();

        if (isUserError(e)) {
          printUserErrorAndDie(e.message);
        }

        internalErrorAndDie(`Could not load snapshot files from folder ${dumpBasePath}`, e);
      }
    });
  },

  async createEmptySnapshot(snapshotName, engineName, runtimeConfig) {
    return createSnapshot(snapshotName, engineName, async (snapshotFileFolder, cleanUpBeforeExit) => {
      try {
        await engine.start(engineName, snapshotName, snapshotFileFolder, runtimeConfig);
      } catch (e) {
        await cleanUpBeforeExit();

        if (isUserError(e)) {
          printUserErrorAndDie(e.message);
        }

        internalErrorAndDie(`Could not create empty snapshot ${snapshotName}`, e);
      }
    });
  },

  // Expects it has been verified snapshot exists
  async removeSnapshot(snapshotName) {
    const snapshotBasePath = path.join(snapshotsStoragePath, snapshotName);

    try {
      await fsExtra.remove(snapshotBasePath);
    } catch (e) {
      internalErrorAndDie(
        `Could not remove some or all of ${snapshotName}:s files at ${snapshotBasePath}.
  Try removing them manually.`,
        e
      );
    }
  },

  async saveRuntimeConfig(snapshot, newCliRuntimeConfig) {
    const { snapshotSpecsFile } = snapshot;

    try {
      const storedSpecs = await fsExtra.readJSON(snapshotSpecsFile);
      const newRuntimeConfig = mergeRuntimeConfig(storedSpecs.runtimeConfig, newCliRuntimeConfig);

      storedSpecs.runtimeConfig = newRuntimeConfig;

      return await fsExtra.writeJSON(snapshotSpecsFile, storedSpecs, {
        spaces: 2
      });
    } catch (e) {
      internalErrorAndDie(`Error persisting new runtime config to file ${snapshotSpecsFile}`, e);
    }
  }
};
