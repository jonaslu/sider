const fsExtra = require('fs-extra');
const moment = require('moment');
const path = require('path');

const engines = require('../engines');

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
 *  runtimeConfigSpec: {
 *  }
 * }
 */
const snapshotFilesFolder = 'files';
const specsFileName = 'specs.json';

async function writeSnapshotToSpecFile(snapshot) {
  const shallowCopy = { ...snapshot };

  delete shallowCopy.snapshotName;
  delete shallowCopy.snapshotFileFolder;
  delete shallowCopy.snapshotSpecsFile;

  return fsExtra.writeJSON(snapshot.snapshotSpecsFile, shallowCopy, {
    spaces: 2,
  });
}

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
    runtimeConfigSpec: {},
  };

  try {
    await fsExtra.writeJSON(snapshotSpecsFile, snapshotSaveValues, {
      spaces: 2,
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
    ...snapshotSaveValues,
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

    const specFileExists = await fsExtra.pathExists(snapshotSpecsFile);
    if (!specFileExists) {
      return undefined;
    }

    try {
      const snapshotSpecsContents = await fsExtra.readJSON(snapshotSpecsFile, 'utf-8');

      if (snapshotSpecsContents) {
        return {
          snapshotName,
          snapshotFileFolder,
          snapshotSpecsFile,
          ...snapshotSpecsContents,
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
      const storageDirectories = await fsExtra.readdir(snapshotsStoragePath);

      const snapshotsWithSpecsFiles = [];

      const checkSpecsFileExistenceFn = async storageDirectory => {
        const specsFileLocation = path.join(snapshotsStoragePath, storageDirectory, specsFileName);
        const specsFileExists = await fsExtra.pathExists(specsFileLocation);

        if (specsFileExists) {
          snapshotsWithSpecsFiles.push(storageDirectory);
        }
      };

      await Promise.all(storageDirectories.map(storageDirectory => checkSpecsFileExistenceFn(storageDirectory)));

      return snapshotsWithSpecsFiles;
    }

    return [];
  },

  async getAllSnapshots() {
    const allSnapshotNames = await this.getAllSnapshotNames();
    return Promise.all(allSnapshotNames.map(snapshotName => this.getSnapshot(snapshotName)));
  },

  // Expects it has been verified snapshot does not exist
  async createImportSnapshot(snapshotName, engine, engineName, dumpBasePath) {
    const files = await fsExtra.readdir(dumpBasePath);
    if (!files.length) {
      printUserErrorAndDie(`Could not load snapshot files from folder ${dumpBasePath}. Folder is empty.`);
    }

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
        await engines.start(engineName, snapshotName, snapshotFileFolder, runtimeConfig);
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

  async appendRuntimeConfig(snapshot, newCliRuntimeConfig) {
    snapshot.runtimeConfigSpec = {
      ...snapshot.runtimeConfigSpec,
      ...newCliRuntimeConfig,
    };

    try {
      return await writeSnapshotToSpecFile(snapshot);
    } catch (e) {
      internalErrorAndDie(`Error persisting new runtime config to file ${snapshot.snapshotSpecsFile}`, e);
    }
  },

  async overwriteRuntimeConfigSpec(snapshot, newCliRuntimeConfig) {
    snapshot.runtimeConfigSpec = newCliRuntimeConfig;

    try {
      return await writeSnapshotToSpecFile(snapshot);
    } catch (e) {
      internalErrorAndDie(`Error persisting new runtime config to file ${snapshot.snapshotSpecsFile}`, e);
    }
  },

  // Expects snapshotName to exist and newName
  // to not exist (yet)
  async moveSnapshot(snapshotName, newName) {
    const oldSnapshotPath = path.join(snapshotsStoragePath, snapshotName);
    const newSnapshotPath = path.join(snapshotsStoragePath, newName);

    return fsExtra.rename(oldSnapshotPath, newSnapshotPath);
  },
};
