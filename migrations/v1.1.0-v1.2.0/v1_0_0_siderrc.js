const fsExtra = require('fs-extra');
const path = require('path');
const untildify = require('untildify');

const { internalErrorAndDie } = require('../../utils');

function ensureFolder(folder) {
  return folder.endsWith(path.sep) ? folder : path.join(folder, path.sep);
}

const siderRcPath = untildify('~/.siderrc');
let siderRcSettings = { basePath: '~/.sider' };

try {
  siderRcSettings = {
    ...siderRcSettings,
    ...fsExtra.readJSONSync(siderRcPath),
  };
} catch (e) {
  if (e.code !== 'ENOENT') {
    internalErrorAndDie(`Could not read rcfile ${siderRcPath}`, e);
  }
}

const siderBaseDir = untildify(siderRcSettings.basePath);
const baseDir = ensureFolder(siderBaseDir);

const snapshotsStoragePath = `${baseDir}snapshots/`;

module.exports = {
  baseDir,
  snapshotsStoragePath,
};