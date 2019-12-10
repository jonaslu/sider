const fsExtra = require('fs-extra');
const moment = require('moment');
const path = require('path');

const { internalErrorAndDie } = require('../utils');
const { dbsStoragePath } = require('../siderrc');
const { mergeRuntimeConfig } = require('../runtime/config');

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
        // !! TODO !! Should this go out or not?
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

  async getAllDbs() {
    const anyDbExists = await fsExtra.pathExists(dbsStoragePath);
    if (anyDbExists) {
      return fsExtra.readdir(dbsStoragePath);
    }

    return [];
  },

  async saveRuntimeConfig(db, newCliRuntimeConfig) {
    const { dbSpecsFile } = db;

    try {
      // !! TODO !! I cannot use the db straight off,
      // first I need a deep copy, lest it goes elsewhere
      // Then i need to pop off the synthetic properties
      const storedSpecs = await fsExtra.readJSON(dbSpecsFile);
      const newRuntimeConfig = mergeRuntimeConfig(
        storedSpecs.runtimeConfig,
        newCliRuntimeConfig
      );

      storedSpecs.runtimeConfig = newRuntimeConfig;

      return await fsExtra.writeJSON(dbSpecsFile, storedSpecs, {
        spaces: 2
      });
    } catch (e) {
      internalErrorAndDie(
        `Error persisting new runtime config to file ${dbSpecsFile}`,
        e
      );
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
      internalErrorAndDie(
        `Error persisting last used time to file ${dbSpecsFile}`,
        e
      );
    }
  },

  // Expects is has been verified DB does not exist
  async createDb(dbName, snapshot) {
    const dbBasePath = path.join(dbsStoragePath, dbName);
    const dbFileFolder = path.join(dbBasePath, dbFilesFolder);

    const { snapshotFileFolder } = snapshot;
    try {
      await fsExtra.copy(snapshotFileFolder, dbFileFolder, { recursive: true });
    } catch (e) {
      internalErrorAndDie(
        `Could not copy snapshot fileFolder: ${snapshotFileFolder} contents to ${dbFileFolder}`,
        e
      );
    }

    const dbSpecsFile = path.join(dbBasePath, specsFileName);
    const { engineName, snapshotName } = snapshot;

    const creationTime = moment().utc();

    const dbSaveValues = {
      runtimeConfig: {},
      fstats: {
        created: creationTime,
        lastUsed: creationTime
      },
      engineName,
      snapshotName
    };

    try {
      await fsExtra.writeJSON(dbSpecsFile, dbSaveValues, {
        spaces: 2
      });
    } catch (e) {
      internalErrorAndDie(`Could not write ${dbSpecsFile} contents`);
    }

    const removeDb = async () => {
      try {
        await fsExtra.remove(dbBasePath);
      } catch (e) {
        internalErrorAndDie(`Could not remove db at ${dbBasePath}`);
      }
    };

    const db = {
      dbName,
      dbFileFolder,
      dbSpecsFile,
      ...dbSaveValues
    }

    return { db, removeDb };
  }
};
