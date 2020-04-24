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

  const dbFolders = dbFolderContents.filter(fileName => fsExtra.statSync(path.join(dbPath, fileName)).isDirectory());

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
  const v0_0_8_dbConfigFile = path.join(dbsStoragePath, dbName, "config.json");

  try {
    return fsExtra.readJSONSync(v0_0_8_dbConfigFile, 'utf-8');
  } catch(e) {
    if (e.code !== 'ENOENT') {
      throw new Error(`Could not read db old config at path ${v0_0_8_dbConfigFile}: error ${e}`);
    }

    return {};
  }
}
