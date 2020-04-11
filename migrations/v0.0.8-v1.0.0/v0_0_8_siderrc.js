const path = require('path');
const nconf = require('nconf');
const untildify = require('untildify');

function ensureFolder(folder) {
  return folder.endsWith(path.sep) ? folder : path.join(folder, path.sep);
}

const siderRcPath = untildify('~/.siderrc');

nconf.file({ file: siderRcPath }).defaults({
  basePath: '~/.sider',
  snapshotsFolder: 'snapshots/',
  dbsFolder: 'dbs/',
  engineFolder: 'engines/',
});

const nconfBaseDir = nconf.get('basePath');
const baseDir = ensureFolder(nconfBaseDir);

const snapshotsFullPath = `${baseDir}${ensureFolder(nconf.get('snapshotsFolder'))}`;

const dbsFullPath = `${baseDir}${ensureFolder(nconf.get('dbsFolder'))}`;
const enginesFullPath = `${baseDir}${ensureFolder(nconf.get('engineFolder'))}`;

const snapshotsStoragePath = untildify(snapshotsFullPath);
const dbsStoragePath = untildify(dbsFullPath);
const engineStoragePath = untildify(enginesFullPath);

module.exports = {
  baseDir: untildify(baseDir),
  snapshotsStoragePath,
  dbsStoragePath,
  engineStoragePath,
};
