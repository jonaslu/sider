// eslint-disable-next-line camelcase
const { detectMigrationToV1_0_0 } = require('./check');

const { migrateAllEngines } = require('./engine');
const { migrateAllSnapshots } = require('./snapshots');
const { migrateAllDbs } = require('./dbs');

const { engineStoragePath, dbsStoragePath, snapshotsStoragePath } = require('./v0_0_8_siderrc');

module.exports = {
  migrateToV1_0_0() {
    if (detectMigrationToV1_0_0()) {
      console.log("Applying migration to v1.0.0 format");

      console.log(`\nMigrating any engines in folder ${engineStoragePath}`);
      migrateAllEngines();

      console.log(`\nMigrating any snapshots in folder ${snapshotsStoragePath}`);
      migrateAllSnapshots();

      console.log(`\nMigrating any dbs in folder ${dbsStoragePath}`);
      migrateAllDbs();
    }
  }
};
