const { detectMigrationToV1_2_0 } = require('./check');
const { patchSnapshots } = require('./patch');

const { snapshotsStoragePath } = require('./v1_0_0_siderrc');

module.exports = {
  migrateToV1_2_0() {
    if (detectMigrationToV1_2_0()) {
      console.log(`About to start migration of contents in path ${snapshotsStoragePath}.\n`);

      console.log(`\nMigrating any snapshots in folder ${snapshotsStoragePath}`);
      patchSnapshots();
    }
  }
};
