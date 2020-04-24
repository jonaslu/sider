/* eslint-disable camelcase */
const path = require('path');
const fsExtra = require('fs-extra');

const v0_0_8_siderrc = require('./v0_0_8_siderrc');

function getDbSnapshotName(dbName) {
  const { dbsStoragePath } = v0_0_8_siderrc;
  const dbPath = path.join(dbsStoragePath, dbName);

  let dbFolderContents;
  try {
    dbFolderContents = fsExtra.readdirSync(dbPath);
  } catch (e) {
    throw new Error(`Could not read db files folder in ${dbPath}: error ${e}`);
  }

  const dbFolders = dbFolderContents.filter((fileName) => fsExtra.statSync(path.join(dbPath, fileName)).isDirectory());

  if (dbFolders.length === 0) {
    throw new Error(`Did not find any folders in db storage path ${dbPath}`);
  }

  const [snapshotName] = dbFolders;
  if (dbFolders.length > 1) {
    console.warn(`Found several db files folders in path ${dbPath}, only one subfolder supported. Will migrate first found: ${snapshotName}`);
  }

  return snapshotName;
}

function moveDbFiles(dbName, snapshotName) {
  const { dbsStoragePath, baseDir } = v0_0_8_siderrc;
  const v0_0_8_dbFilesPath = path.join(dbsStoragePath, dbName, snapshotName);

  const v1_0_0_dbFilesPath = path.join(baseDir, 'dbs', dbName, 'files');

  try {
    fsExtra.moveSync(v0_0_8_dbFilesPath, v1_0_0_dbFilesPath);
  } catch (e) {
    throw new Error(`Could not move files in folder ${v0_0_8_dbFilesPath} to ${v1_0_0_dbFilesPath}: error ${e}`);
  }
}

function getEngineNameForSnapshot(snapshotName) {
  const { baseDir } = v0_0_8_siderrc;
  const snapshotSpecsFile = path.join(baseDir, 'snapshots', snapshotName, 'spec.json');
  try {
    const { engineName } = fsExtra.readJSONSync(snapshotSpecsFile, 'utf-8');
    return engineName;
  } catch (e) {
    throw new Error(`Cannot find engine name for snapshot ${snapshotName} during migration: error ${e}`);
  }
}

function getRuntimeConfigSpec(dbName) {
  const { dbsStoragePath } = v0_0_8_siderrc;
  const v0_0_8_dbConfigFile = path.join(dbsStoragePath, dbName, 'config.json');

  try {
    return fsExtra.readJSONSync(v0_0_8_dbConfigFile, 'utf-8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw new Error(`Could not read db old config at path ${v0_0_8_dbConfigFile}: error ${e}`);
    }

    return {};
  }
}

function createNewDbSpec(dbName, snapshotName, engineName, runtimeConfigSpec) {
  const { dbsStoragePath, baseDir } = v0_0_8_siderrc;
  const { birthtime, atime } = fsExtra.lstatSync(path.join(dbsStoragePath, dbName));

  const dbSpec = {
    engineName,
    snapshotName,
    fstats: {
      created: birthtime,
      lastUsed: atime,
    },
    runtimeConfigSpec,
  };

  const v1_0_0_dbFolder = path.join(baseDir, 'dbs/', dbName);
  const v1_0_0_dbSpec = path.join(v1_0_0_dbFolder, 'spec.json');

  try {
    fsExtra.ensureDirSync(v1_0_0_dbFolder);
    fsExtra.writeJSONSync(v1_0_0_dbSpec, dbSpec, {
      spaces: 2,
    });
  } catch (e) {
    throw new Error(`Could not write db spec.json ${v1_0_0_dbSpec}: error ${e}`);
  }
}

function removeDbFilesPath(dbName, snapshotName) {
  const { dbsStoragePath, dbFolder } = v0_0_8_siderrc;

  if (dbFolder === 'dbs/') {
    const v0_0_8_dbFilesPath = path.join(dbsStoragePath, dbName, snapshotName);
    try {
      fsExtra.removeSync(v0_0_8_dbFilesPath);
    } catch (e) {
      throw new Error(`Could not remove old dbs folder ${v0_0_8_dbFilesPath}: error ${e}`);
    }

    const v0_0_8_dbConfigFile = path.join(dbsStoragePath, dbName, 'config.json');
    try {
      fsExtra.removeSync(v0_0_8_dbConfigFile);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw new Error(`Could not remove old dbs folder ${v0_0_8_dbFilesPath}: error ${e}`);
      }
    }
  }
}

function migrateDb(dbName) {
  const snapshotName = getDbSnapshotName(dbName);
  const engineName = getEngineNameForSnapshot(snapshotName);
  const runtimeConfigSpec = getRuntimeConfigSpec(dbName);

  createNewDbSpec(dbName, snapshotName, engineName, runtimeConfigSpec);
  moveDbFiles(dbName, snapshotName);
  removeDbFilesPath(dbName, snapshotName);
}

function migrateAllDbs() {
  const { dbsStoragePath, dbFolder, baseDir } = v0_0_8_siderrc;

  let dirContents;
  try {
    dirContents = fsExtra.readdirSync(dbsStoragePath, 'utf-8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(`Error occurred when trying to migrate db path ${dbsStoragePath}`);
      console.error('Not continuing migration');
      process.exit(1);
    }
  }

  dirContents.forEach((dbName) => {
    try {
      migrateDb(dbName);
    } catch (e) {
      console.error(`Cannot migrate: ${dbName}`);
      console.error(e);
      console.error(`Continuing migration but db ${dbName} needs manual intervention.`);
    }
  });

  if (dbFolder !== 'dbs/') {
    const [firstSubFolder] = dbFolder.split(path.sep);
    const removeFolder = path.join(baseDir, firstSubFolder);

    try {
      fsExtra.removeSync(removeFolder);
    } catch (e) {
      console.error(`Could not remove old dbs folder ${dbsStoragePath}: error ${e}`);
    }
  }
}

module.exports = {
  migrateAllDbs,
};

