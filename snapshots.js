const chalk = require('chalk');
const fs = require('fs-extra');
const fileDb = require('./file-db');

function addSnapshot(snapshotName, importSnapshotDiskPath) {
  const importSnapshotPathExists = fs.pathExistsSync(importSnapshotDiskPath);

  if (!importSnapshotPathExists) {
    // !! TODO !! Factor these out to an error-file
    console.error(`File ${chalk.blue(importSnapshotDiskPath)} not found`);
    process.exit(1);
  }

  // TODO Check that it's name is *.rdb
  // TODO If a directory, scan its subfolders for any *.rdb and give option on which found to import

  const existingSnapshot = fileDb.getSnapshot(snapshotName);

  if (existingSnapshot) {
    console.error(
      `Cannot import snapshot with name ${snapshotName} already exists at path ${
        existingSnapshot.path
      }`
    );

    process.exit(1);
  }

  fileDb.addSnapshot(snapshotName, importSnapshotDiskPath);
}

module.exports = {
  addSnapshot
};
