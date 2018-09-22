const chalk = require('chalk');
const fs = require('fs-extra');

const engines = require('./engines');
const fileDb = require('./storage/file-db');

function addSnapshot(snapshotName, engineName, importSnapshotDiskPath) {
  const importSnapshotPathExists = fs.pathExistsSync(importSnapshotDiskPath);

  if (!importSnapshotPathExists) {
    // !! TODO !! Factor these out to an error-file
    console.error(`File ${chalk.blue(importSnapshotDiskPath)} not found`);
    process.exit(1);
  }

  const existingSnapshot = fileDb.getSnapshot(snapshotName);

  if (existingSnapshot) {
    console.error(
      `Cannot import snapshot with name ${snapshotName} already exists at path ${
        existingSnapshot.path
      }`
    );
    process.exit(1);
  }

  const engineSnapshotFolder = fileDb.getSnapshotFolder(
    snapshotName,
    engineName,
  );

  engines.loadFiles(engineName, importSnapshotDiskPath, engineSnapshotFolder);
  // !! TODO !! Add after-check of permissons et al
}

module.exports = {
  addSnapshot
};
