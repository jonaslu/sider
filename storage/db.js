const fsExtra = require('fs-extra');
const moment = require('moment');
const path = require('path');

const { internalErrorAndDie } = require('../utils');
const { dbsStoragePath } = require('../siderrc');
const { mergeRuntimeConfig } = require('../runtime/config');
const snapshots = require('./snapshots');

/**
 * {
 *  dbName: <- synthetic, not saved
 *  dbFileFolder: <- synthetic, not saved
 *  dbSpecsFile: <- synthetic, not saved
 *
 *  snapshotName:
 *  fstats: {
 *    created:
 *    lastUsed: <- set this on run
 *  },
 *  runtimeConfig: {
 *  },
 *  engineName: 'redis' <- won't change
 * }
 */

const dbFilesFolder = 'files';
const specsFileName = 'specs.json';

module.exports = {
  async getDb(dbName) {
    const dbBasePath = path.join(dbsStoragePath, dbName);

    const dbExists = await fsExtra.pathExists(dbBasePath);
    if (!dbExists) {
      return undefined;
    }

    const dbFileFolder = path.join(dbBasePath, dbFilesFolder);
    const dbSpecsFile = path.join(dbBasePath, specsFileName);

    try {
      const dbSpecsContents = await fsExtra.readJSON(dbSpecsFile, 'utf-8');

      return {
        dbName,
        dbFileFolder,
        dbSpecsFile,
        ...dbSpecsContents
      };
    } catch (e) {
      internalErrorAndDie(
        `Could not read file ${dbSpecsFile}.
Have you tampered with the contents?`,
        e
      );
    }

    return undefined;
  },

  async getAllDbNames() {
    const anyDbExists = await fsExtra.pathExists(dbsStoragePath);
    if (anyDbExists) {
      return fsExtra.readdir(dbsStoragePath);
    }

    return [];
  },

  async getAllDbs() {
    const allDbNames = await this.getAllDbNames();
    return Promise.all(allDbNames.map(dbName => this.getDb(dbName)));
  },

  async saveRuntimeConfig(db, newCliRuntimeConfig) {
    const { dbSpecsFile } = db;

    try {
      const storedSpecs = await fsExtra.readJSON(dbSpecsFile);
      const newRuntimeConfig = mergeRuntimeConfig(storedSpecs.runtimeConfig, newCliRuntimeConfig);

      storedSpecs.runtimeConfig = newRuntimeConfig;

      return await fsExtra.writeJSON(dbSpecsFile, storedSpecs, {
        spaces: 2
      });
    } catch (e) {
      internalErrorAndDie(`Error persisting new runtime config to file ${dbSpecsFile}`, e);
    }
  },

  async setLastUsed(db, dbStartTime) {
    const { dbSpecsFile } = db;

    try {
      const storedSpecs = await fsExtra.readJSON(dbSpecsFile);
      storedSpecs.fstats.lastUsed = dbStartTime;

      return await fsExtra.writeJSON(dbSpecsFile, storedSpecs, {
        spaces: 2
      });
    } catch (e) {
      internalErrorAndDie(`Error persisting last used time to file ${dbSpecsFile}`, e);
    }
  },

  // Expects it has been verified db does not exist
  async createDb(dbName, snapshot) {
    const dbBasePath = path.join(dbsStoragePath, dbName);
    const dbFileFolder = path.join(dbBasePath, dbFilesFolder);

    const cleanUpBeforeExit = async () => {
      try {
        await fsExtra.remove(dbBasePath);
      } catch (e) {
        internalErrorAndDie(`Could not remove ${dbName} at ${dbBasePath}`, e);
      }
    };

    const { snapshotFileFolder } = snapshot;
    try {
      await fsExtra.copy(snapshotFileFolder, dbFileFolder);
    } catch (e) {
      await cleanUpBeforeExit();

      internalErrorAndDie(`Could not copy snapshot fileFolder: ${snapshotFileFolder} contents to ${dbFileFolder}`, e);
    }

    const dbSpecsFile = path.join(dbBasePath, specsFileName);
    const { engineName, snapshotName } = snapshot;

    const dbSaveValues = {
      snapshotName,
      fstats: {
        created: moment().utc()
      },
      runtimeConfig: {},
      engineName
    };

    try {
      await fsExtra.writeJSON(dbSpecsFile, dbSaveValues, {
        spaces: 2
      });
    } catch (e) {
      await cleanUpBeforeExit();

      internalErrorAndDie(`Could not write ${dbSpecsFile} contents`);
    }
  },

  // Expects it has been verified db exists
  async removeDb(dbName) {
    const dbBasePath = path.join(dbsStoragePath, dbName);

    try {
      await fsExtra.remove(dbBasePath);
    } catch (e) {
      internalErrorAndDie(
        `Could not remove some or all of ${dbName}:s files at ${dbBasePath}.
Try removing them manually.`,
        e
      );
    }
  },

  async removeDbsForSnapshot(snapshotName) {
    // !! TODO !! This is is in here somewhere, find all
    // references and put it into this
    const allDbs = await this.getAllDbNames();
    const dbs = await Promise.all(allDbs.map(dbName => this.getDb(dbName)));

    const removeThese = dbs
      .filter(({ snapshotName: dbSnapshotName }) => dbSnapshotName === snapshotName)
      .map(({ snapshotName }) => snapshotName);

      console.log(removeThese);

    await Promise.all(removeThese.map(dbName => this.removeDb(dbName)));

    return removeThese;
  },

  async resetDb(db) {
    const { dbFileFolder, snapshotName, dbName } = db;
    const snapshot = await snapshots.getSnapshot(snapshotName);

    const { snapshotFileFolder } = snapshot;

    try {
      await fsExtra.remove(dbFileFolder);
      await fsExtra.copy(snapshotFileFolder, dbFileFolder);
    } catch (e) {
      internalErrorAndDie(
        `Could not reset ${dbName} to it's snapshot ${snapshotName}.
The contents may have been corrupted. Try removing and cloning out the snapshot again.`,
        e
      );
    }
  },

  async ejectDb(db, ejectFolder) {
    const { dbFileFolder, dbName } = db;
    const ejectFullPath = path.join(ejectFolder, `${dbName}-eject`);

    try {
      await fsExtra.ensureDir(ejectFullPath);
      await fsExtra.copy(dbFileFolder, ejectFullPath);
    } catch (e) {
      internalErrorAndDie(`Could not eject ${dbName} to path ${ejectFullPath}`, e);
    }
  }
};
