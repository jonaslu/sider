const nconf = require('nconf');
const untildify = require('untildify');

nconf.file('~/.siderrc').defaults({
  basePath: '~/.sider',
  snapshotsFolder: 'snapshots',
  dbsFolder: 'dbs'
});

const nconfBaseDir = nconf.get('basePath');
const baseDir = nconfBaseDir ? `${nconfBaseDir}/` : undefined;

const snapshotsFullPath = `${baseDir}${nconf.get('snapshotsFolder')}`;
const dbsFullPath = `${baseDir}${nconf.get('dbsFolder')}`;

const snapshotsStoragePath = untildify(snapshotsFullPath);
const dbsStoragePath = untildify(dbsFullPath);

module.exports = {
  redisVersion: '3.2.6',
  snapshotsStoragePath,
  dbsStoragePath
};
