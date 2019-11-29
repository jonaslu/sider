const nconf = require('nconf');
const path = require('path');
const untildify = require('untildify');

const { internalErrorAndDie } = require('./utils');

function ensureFolder(folder) {
  return folder.endsWith(path.sep) ? folder : path.join(folder, path.sep);
}

const siderRcPath = untildify('~/.siderrc');

try {
  nconf.file({ file: siderRcPath }).defaults({
    basePath: '~/.sider'
  });
} catch (e) {
  internalErrorAndDie(
    `Error trying to read the .siderrc file at path ${siderRcPath}`,
    e
  );
}

const nconfBaseDir = untildify(nconf.get('basePath'));
const baseDir = ensureFolder(nconfBaseDir);

const snapshotsStoragePath = `${baseDir}${ensureFolder('snapshots/')}`;
const dbsStoragePath = `${baseDir}${ensureFolder('dbs/')}`;
const engineStoragePath = `${baseDir}${ensureFolder('engines/')}`;

module.exports = {
  snapshotsStoragePath,
  dbsStoragePath,
  engineStoragePath
};
