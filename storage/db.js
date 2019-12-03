const fsExtra = require('fs-extra');
const path = require('path');

const { internalErrorAndDie } = require('../utils');
const { dbsStoragePath } = require('../siderrc');
const settings = require('../settings');

/**
 * {
 *  dbName: <- synthetic, not saved
 *  dbFileFolder: <- synthetic, not saved
 *  dbConfigFile: <- synthetic, not saved
 *
 *  snapshotName:
 *  fstats: {
 *    created:
 *    lastUsed: <- set this on run
 *  },
 *  config: {
 *  },
 *  engineName: 'redis' <- won't change
 * }
 */

const dbFilesFolder = 'files';
const settingsFileName = 'settings.json';

module.exports = {
  async getDb(dbName) {
    const dbBasePath = path.join(dbsStoragePath, dbName);

    const dbExists = await fsExtra.pathExists(dbBasePath);
    if (!dbExists) {
      return undefined;
    }

    const dbFileFolder = path.join(dbBasePath, dbFilesFolder);
    const dbConfigFile = path.join(dbBasePath, settingsFileName);

    try {
      const dbConfigContents = await fsExtra.readJSON(dbConfigFile, 'utf-8');

      return {
        dbName,
        dbFileFolder,
        // !! TODO !! Should this go out or not?
        dbConfigFile,
        ...dbConfigContents
      };
    } catch (e) {
      internalErrorAndDie(
        `Could not read file ${dbConfigFile}.
Have you tampered with the contents in the ${dbBasePath} folder?`,
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

  async saveSettings(db, newCliSettings) {
    const { dbConfigFile } = db;

    try {
      // !! TODO !! I cannot use the db straight off,
      // first I need a deep copy, lest it goes elsewhere
      // Then i need to pop off the synthetic properties
      const storedSettintgs = await fsExtra.readJSON(dbConfigFile);
      const newSettings = settings.mergeSettings(
        storedSettintgs.config,
        newCliSettings
      );

      storedSettintgs.config = newSettings;

      return await fsExtra.writeJSON(dbConfigFile, storedSettintgs, {
        spaces: 2
      });
    } catch (e) {
      internalErrorAndDie(`Error persisting new settings to file ${dbConfigFile}`, e);
    }
  }
};
