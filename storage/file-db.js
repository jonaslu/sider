/* Data structures
  snapshots = {
    'snapshot-name': {
      snapshotPath: '/home/jonasl/.sider/snapshots/default/redis/',
      engineName: 'redis,
      stats
    },
    ...
  }

  dbs = {
    'db-name': {
      dbPath,
      snapshotName,
      engineName,
      dbPort,
      stats: {
        https://nodejs.org/api/fs.html#fs_class_fs_stats
      }
    },
    ...
  }

  As array:
  Same as above except object has the db-name baked in as dbName
  [{
    dbName,
    dbPath,
    snapshotName,
    port,
    stats: {
      https://nodejs.org/api/fs.html#fs_class_fs_stats
    }
  },
  ...
  ]

  Naming conventions:
  /home/jonasl/.sider/snapshots <- snapshotsStoragePath
  /home/jonasl/.sider/snapshots/snapshot-name/ <- snapshotNamePath

  /home/jonasl/.sider/dbs/ <- dbsStoragePath
  /home/jonasl/.sider/dbs/db-name/ <- dbNamePath
  /home/jonasl/.sider/dbs/db-name/snapshot-name/ <- dbsnapshotPath
  /home/jonasl/.sider/dbs/db-name/snapshot-name/port/ <- dbPortPath
*/

const klaw = require('klaw-sync');
const fs = require('fs-extra');
const path = require('path');

const { ensureFolder } = require('../helpers');
const {
  snapshotsStoragePath,
  dbsStoragePath,
  engineStoragePath
} = require('../config');

function isDirAtDepth(dir, basePath, depth) {
  return dir.replace(basePath, '').split(path.sep).length === depth;
}

function getDirsAtDepth(dirToWalk, depthLimit) {
  let dirContent;

  try {
    dirContent = klaw(dirToWalk, {
      depthLimit
    });
  } catch (e) {
    if (e.code === 'ENOENT') {
      // Whatever directory we're traversing does not yet exist
      return [];
    }

    console.error(e);
    process.exit(1);
  }

  return dirContent
    .filter(
      file =>
        file.stats.isDirectory && isDirAtDepth(file.path, dirToWalk, depthLimit)
    )
    .map(file => ({ ...file, path: ensureFolder(file.path) }));
}

let snapshots = {};

function loadSnapshots() {
  const snapshotsStoragePathContents = getDirsAtDepth(snapshotsStoragePath, 2);

  if (!snapshotsStoragePathContents.length) return;

  snapshots = snapshotsStoragePathContents.reduce((acc, klawStruct) => {
    // !! TODO !! This might be sensitive to botched paths or messed up directories?
    const [snapshotName, engineName] = klawStruct.path
      .split(path.sep)
      .slice(-3);

    if (acc[snapshotName]) {
      console.error(
        `Duplicate snapshots with name ${snapshotName} found, using last found`
      );
    }

    acc[snapshotName] = {
      snapshotPath: klawStruct.path,
      stats: klawStruct.stats,
      engineName
    };

    return acc;
  }, {});
}

let dbs = {};

function loadDbs() {
  const dbStoragePathContents = getDirsAtDepth(dbsStoragePath, 3);

  if (!dbStoragePathContents.length) return;

  dbs = dbStoragePathContents.reduce((acc, klawStruct) => {
    const [dbName, snapshotName, port] = klawStruct.path
      .split(path.sep)
      .slice(-4);

    const { engineName } = snapshots[snapshotName];

    const returnObject = {
      dbPath: klawStruct.path,
      stats: klawStruct.stats,
      snapshotName,
      dbPort: port,
      engineName
    };

    if (acc[dbName]) {
      console.error(
        `Duplicate dbs with name ${dbName} found, using last found`
      );
    }

    acc[dbName] = returnObject;

    return acc;
  }, {});
}

function removeDb(dbName) {
  fs.removeSync(path.join(dbsStoragePath, dbName));

  loadDbs();
}

function getEngineConfigPath(engineName) {
  return path.join(engineStoragePath, engineName, 'config.json');
}

loadSnapshots();
loadDbs();

module.exports = {
  getSnapshot(snapshotName) {
    return snapshots[snapshotName];
  },

  getSnapshotsAsArray() {
    return Object.keys(snapshots).map(snapshotName =>
      Object.assign({}, { snapshotName }, snapshots[snapshotName])
    );
  },

  getSnapshotFolder(snapshotName, engineName) {
    return path.join(snapshotsStoragePath, snapshotName, engineName, path.sep);
  },

  removeSnapshot(snapshotName) {
    const internalSnapshotName = snapshotName;

    Object.keys(dbs)
      .filter(key => {
        const dbData = dbs[key];
        return dbData.snapshotName === internalSnapshotName;
      })
      .forEach(dbName => removeDb(dbName));

    loadDbs();

    fs.remove(path.join(snapshotsStoragePath, snapshotName));

    // Is this needed?
    loadSnapshots();
  },

  cloneSnapshotToDb(dbName, snapshotName, dbPort) {
    const { snapshotPath } = snapshots[snapshotName];

    // !! TODO !! This is crucial, put this in a function?
    const dbPath = path.join(dbsStoragePath, dbName, snapshotName, dbPort);

    fs.ensureDirSync(dbPath);
    fs.copySync(snapshotPath, dbPath, {
      errorOnExist: true
    });

    loadDbs();
  },

  getDb(dbName) {
    return dbs[dbName];
  },

  getDbsAsArray() {
    return Object.keys(dbs).map(dbName =>
      Object.assign({}, { dbName }, dbs[dbName])
    );
  },

  getEngineConfig(engineName) {
    const filePath = getEngineConfigPath(engineName);

    try {
      return fs.readJsonSync(filePath);
    } catch (e) {
      if (e.code === 'ENOENT') {
        return {};
      }

      throw e;
    }
  },

  setEngineConfig(engineName, config) {
    const filePath = getEngineConfigPath(engineName);
    fs.outputJsonSync(filePath, config, { spaces: 2 });
  },

  removeDb
};

