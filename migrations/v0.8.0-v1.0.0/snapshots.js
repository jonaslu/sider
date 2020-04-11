/* eslint-disable camelcase */
const path = require('path');
const fsExtra = require('fs-extra');
const v0_0_8_siderrc = require('./v0_0_8_siderrc');

function snapshotError(snapshotName, errorMessage, e) {
  console.error(`Cannot migrate: ${snapshotName}`);
  console.error(errorMessage);
  if (e) {
    console.error('Error message:', e);
  }
  console.error(`Continuing migration but snapshot ${snapshotName} needs manual intervention`);
}

function getSnapshotEngineName(snapshotName, snapshotStoragePath) {
  let snapshotFolderContents;
  try {
    snapshotFolderContents = fsExtra.readdirSync(path.join(snapshotStoragePath, snapshotName));
  } catch (e) {
    snapshotError(snapshotName, `Could not read snapshotfolder ${snapshotName}`, e);
    return;
  }

  const supportedEngines = ['redis', 'mariadb', 'postgres'];

  const foundEngines = snapshotFolderContents.filter(
    (snapshotFolder) => supportedEngines.indexOf(snapshotFolder) !== -1
  );
  if (foundEngines.length === 0) {
    snapshotError(snapshotName, `Did not find any supported engines in folder ${snapshotStoragePath}`);
    return;
  }

  const [engineName] = foundEngines;
  if (foundEngines.length > 1) {
    console.warn(`When migrating ${snapshotName} found several engines inside snapshot folder ${snapshotStoragePath}.`);
    console.warn(`Will only migrate first found ${engineName}`);
  }

  return engineName;
}
    return;
  }

  return engineName;
}

getSnapshotEngineName()
