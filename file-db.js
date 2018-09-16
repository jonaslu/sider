/* Data structures
  snapshots = {
    'snapshot-name': {
      path: '/home/jonasl/.sider/snapshots/default/dump.rdb',
      stats
    },
    ...
  }

  dbs = {
    'db-name': {
      path,
      snapshotName,
      port,
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
    path,
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
  /home/jonasl/.sider/snapshots/snapshot-name/dump.rdb <- snapshotRedisDumpPath

  /home/jonasl/.sider/dbs/ <- dbsStoragePath
  /home/jonasl/.sider/dbs/db-name/ <- dbNamePath
  /home/jonasl/.sider/dbs/db-name/snapshot-name/ <- dbsnapshotPath
  /home/jonasl/.sider/dbs/db-name/snapshot-name/port/ <- dbPortPath
  /home/jonasl/.sider/dbs/db-name/snapshot-name/port/dump.rdb <- dbRedisDumpPath
*/

const klaw = require('klaw-sync');
const fs = require('fs-extra');
const path = require('path');

const { snapshotsStoragePath, dbsStoragePath } = require('./config');

function regexifyPathString(pathString) {
  return pathString.replace('/', '\\/').replace('.', '\\.');
}

const snapshotRedisDumpRegExp = new RegExp(
  `${regexifyPathString(snapshotsStoragePath)}/([^/]+)/dump.rdb$`
);

let dbs = {};
let snapshots = {};

function loadSnapshots() {
  // paths = [{path: '/some/dir/dir1', stats: {}}, {path: '/some/dir/file1', stats: {}}]
  let snapshotsStoragePathContents;
  try {
    snapshotsStoragePathContents = klaw(snapshotsStoragePath, {
      nodir: true
    });
  } catch (e) {
    // TODO ENOENT is ok, others should be rethrown
    console.error(e);
    return;
  }

  // eslint-disable-next-line no-shadow
  const snapshotsWithARedisDumpPath = snapshotsStoragePathContents.filter(({ path }) =>
    snapshotRedisDumpRegExp.test(path)
  );

  snapshots = snapshotsWithARedisDumpPath.reduce((acc, klawStruct) => {
    const match = snapshotRedisDumpRegExp.exec(klawStruct.path);

    const snapshotName = match[1];

    if (acc[snapshotName]) {
      console.error(
        `Duplicate snapshots with name ${snapshotName} found, using last found`
      );
    }

    acc[snapshotName] = klawStruct;

    return acc;
  }, {});
}

// Add engine name here
const dbsRedisDumpRegExp = new RegExp(
  `${regexifyPathString(
    dbsStoragePath
  )}/([^/]+)/([^/]+)/(\\d+)/dump.rdb$`
);

function loadDbs() {
  let dbsStoragePathContent;

  try {
    dbsStoragePathContent = klaw(dbsStoragePath, {
      nodir: true
    });
  } catch (e) {
    // TODO ENOENT is ok, others should be rethrown
    return;
  }

  const dbsWithRedisDumpPath = dbsStoragePathContent.filter(
    // eslint-disable-next-line no-shadow
    ({ path }) => dbsRedisDumpRegExp.test(path)
  );

  dbs = dbsWithRedisDumpPath.reduce((acc, klawStruct) => {
    const match = dbsRedisDumpRegExp.exec(klawStruct.path);

    const [, dbName, snapshotName, port] = match;

    const returnObject = Object.assign({}, klawStruct, { snapshotName }, { port });

    if (acc[dbName]) {
      console.error(
        `Duplicate dbs with name ${dbName} found, using last found`
      );
    }

    acc[dbName] = returnObject;

    return acc;
  }, {});
}

function getSnapshotRedisDumpPath(snapshotName) {
  return path.join(snapshotsStoragePath, snapshotName, 'dump.rdb');
}

function getDbRedisDumpPath(dbName, snapshotName, port) {
  return path.join(
    dbsStoragePath,
    dbName,
    snapshotName,
    port,
    'dump.rdb'
  );
}

function removeDb(dbName) {
  fs.removeSync(path.join(dbsStoragePath, dbName));

  loadDbs();
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

  addSnapshot(snapshotName, importSnapshotDiskPath) {
    const snapshotRedisDumpPath = getSnapshotRedisDumpPath(snapshotName);
    const snapshotNamePath = path.join(path.dirname(snapshotRedisDumpPath), path.sep);

    fs.ensureDirSync(snapshotNamePath);
    fs.copySync(importSnapshotDiskPath, snapshotRedisDumpPath, {
      errorOnExist: true
    });

    loadSnapshots();
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
    loadSnapshots();
  },

  cloneSnapshotToDb(dbName, snapshotName, port) {
    const dbRedisDumpPath = getDbRedisDumpPath(
      dbName,
      snapshotName,
      port
    );

    const dbPortPath = path.join(
      path.dirname(dbRedisDumpPath),
      path.sep
    );

    const snapshotRedisDumpPath = snapshots[snapshotName].path;

    fs.ensureDirSync(dbPortPath);
    fs.copySync(snapshotRedisDumpPath, dbRedisDumpPath, {
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

  removeDb
};
