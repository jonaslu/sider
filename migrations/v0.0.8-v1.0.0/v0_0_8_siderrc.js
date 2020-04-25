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

const snapshotsFolder = ensureFolder(nconf.get('snapshotsFolder'))
const snapshotsFullPath = `${baseDir}${snapshotsFolder}`;

const dbFolder = ensureFolder(nconf.get('dbsFolder'));
const dbsFullPath = `${baseDir}${dbFolder}`;

const engineFolder = ensureFolder(nconf.get('engineFolder'));
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
