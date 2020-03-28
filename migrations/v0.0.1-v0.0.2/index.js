const fs = require('fs');
const os = require('os');
const path = require('path');
const spawn = require('child_process').execSync;

function ensureFolder(folder) {
  return folder.endsWith(path.sep) ? folder : path.join(folder, path.sep);
}

function untildify(filePath) {
  const homedir = os.homedir();
  return filePath.replace('~', homedir);
}

const siderrc = '~/.siderrc';

let defaults;

try {
  defaults = fs.readFileSync(untildify(siderrc));
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}

const nconfDefaults = {
  basePath: '~/.sider',
  dbsFolder: 'dbs/'
};

const mergedDefaults = {
  ...defaults,
  ...nconfDefaults
};

const baseDir = ensureFolder(mergedDefaults.basePath);
const dbsFullPath = `${baseDir}${ensureFolder(mergedDefaults.dbsFolder)}`;
const dbsStoragePath = untildify(dbsFullPath);

const dbs = fs.readdirSync(dbsStoragePath);

dbs.forEach(db => {
  console.log(`Migrating ${db}`);

  const dbPath = path.join(dbsStoragePath, db);
  const [snapshot] = fs.readdirSync(dbPath);
  const snapshotPath = path.join(dbPath, snapshot);
  const [port] = fs.readdirSync(snapshotPath);

  if (Number.isNaN(parseInt(port, 10))) {
    console.error(
      `Error: could not find single folder with port in path ${snapshotPath}`
    );
  }

  const fileContentsPath = path.join(snapshotPath, port);

  spawn(`mv ${fileContentsPath}/* ${snapshotPath}/`);
  fs.rmdirSync(fileContentsPath);

  const portConfig = {
    port
  };

  const configPath = path.join(dbPath, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(portConfig, null, 2), 'utf8');
});

console.log('DONE')
