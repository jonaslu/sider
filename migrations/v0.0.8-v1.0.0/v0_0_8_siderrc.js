const path = require('path');
const fsExtra = require('fs-extra');
const { exit } = require('process');
const untildify = require('untildify');

function ensureFolder(folder) {
  return folder.endsWith(path.sep) ? folder : path.join(folder, path.sep);
}

const siderPath = process.env.SIDERRC || '~/.siderrc';
const siderRcPath = untildify(siderPath);

let siderRcSettings = {
  basePath: '~/.sider',
  snapshotsFolder: 'snapshots/',
  dbsFolder: 'dbs/',
  engineFolder: 'engines/',
}

try {
  siderRcSettings = {
    ...siderRcSettings,
    ...fsExtra.readJSONSync(siderRcPath)
  }
} catch (e) {
  if (e.code !== 'ENOENT') {
    console.error(`Could not read rcfile ${siderRcPath}`, e);
    exit(1);
  }
}

const nconfBaseDir = siderRcSettings.basePath;
const baseDir = ensureFolder(nconfBaseDir);

const snapshotsFolder = ensureFolder(siderRcSettings.snapshotsFolder)
const snapshotsFullPath = `${baseDir}${snapshotsFolder}`;

const dbFolder = ensureFolder(siderRcSettings.dbsFolder);
const dbsFullPath = `${baseDir}${dbFolder}`;

const engineFolder = ensureFolder(siderRcSettings.engineFolder);
const enginesFullPath = `${baseDir}${engineFolder}`;

const snapshotsStoragePath = untildify(snapshotsFullPath);
const dbsStoragePath = untildify(dbsFullPath);
const engineStoragePath = untildify(enginesFullPath);

module.exports = {
  baseDir: untildify(baseDir),

  snapshotsFolder,
  snapshotsStoragePath,

  dbFolder,
  dbsStoragePath,

  engineFolder,
  engineStoragePath
};
