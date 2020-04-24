const path = require('path');
const nconf = require('nconf');
const untildify = require('untildify');

function ensureFolder(folder) {
  return folder.endsWith(path.sep) ? folder : path.join(folder, path.sep);
}

const siderPath = process.env.SIDERRC || '~./siderrc';
const siderRcPath = untildify(siderPath);

nconf.file({ file: siderRcPath }).defaults({
  basePath: '~/.sider',
  snapshotsFolder: 'snapshots/',
  dbsFolder: 'dbs/',
  engineFolder: 'engines/',
});

const nconfBaseDir = nconf.get('basePath');
const baseDir = ensureFolder(nconfBaseDir);

const snapshotsFolder = nconf.get('snapshotsFolder')
const snapshotsFullPath = `${baseDir}${ensureFolder(snapshotsFolder)}`;

const dbFolder = nconf.get('dbsFolder');
const dbsFullPath = `${baseDir}${ensureFolder(dbFolder)}`;

const engineFolder = nconf.get('engineFolder');
const enginesFullPath = `${baseDir}${ensureFolder(engineFolder)}`;

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
