const fsExtra = require('fs-extra');
const path = require('path');

const { errorAndDie } = require('../utils');
const { dbsStoragePath } = require('../config');

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
      errorAndDie(
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
  }
};
