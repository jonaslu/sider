const nconf = require('nconf');
const untildify = require('untildify');
const { ensureFolder } = require('./helpers');

nconf.file('~/.siderrc').defaults({
  basePath: '~/.sider',
  snapshotsFolder: 'snapshots/',
  dbsFolder: 'dbs/',
  engineFolder: 'engines/'
});

const nconfBaseDir = nconf.get('basePath');
const baseDir = ensureFolder(nconfBaseDir);

const snapshotsFullPath = `${baseDir}${ensureFolder(
  nconf.get('snapshotsFolder')
)}`;

const dbsFullPath = `${baseDir}${ensureFolder(nconf.get('dbsFolder'))}`;
const enginesFullPath = `${baseDir}${ensureFolder(nconf.get('engineFolder'))}`;

const snapshotsStoragePath = untildify(snapshotsFullPath);
const dbsStoragePath = untildify(dbsFullPath);
const engineStoragePath = untildify(enginesFullPath)

module.exports = {
  redisVersion: '3.2.6',
  snapshotsStoragePath,
  dbsStoragePath,
  engineStoragePath
};
