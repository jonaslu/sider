/* eslint-disable camelcase */
const fsExtra = require('fs-extra');
const path = require('path');

const { snapshotsStoragePath, engineStoragePath } = require('./v0_0_8_siderrc');
const v0_0_8_engines = ['redis', 'mariadb', 'postgres'];

function snapshotsHasEngineFolder() {
  if (!fsExtra.pathExistsSync(snapshotsStoragePath)) {
    return false;
  }

  const snapshots = fsExtra.readdirSync(snapshotsStoragePath);
  if (snapshots) {
    const hasSnapshots = snapshots.find(snapshot => {
      return v0_0_8_engines.find(engineName => {
        const snapshotEnginePath = path.join(snapshotsStoragePath, snapshot, engineName);
        if (fsExtra.pathExistsSync(snapshotEnginePath)) {
          return true;
        }
      });
    });

    if (hasSnapshots) {
      return true;
    }
  }
}

function engineHasConfigFile() {
  return !!v0_0_8_engines.find(engineName => {
    const engineConfigPath = path.join(engineStoragePath, engineName, 'config.json');
    if (fsExtra.pathExistsSync(engineConfigPath)) {
      return true;
    }
  });
}

function detectMigrationToV1_0_0() {
  if (snapshotsHasEngineFolder()) {
    return true;
  }

  return engineHasConfigFile();
}

module.exports = {
  detectMigrationToV1_0_0,
};

console.log(detectMigrationToV1_0_0());
