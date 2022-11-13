const { migrateAllEngines } = require('./engine');
const { migrateAllSnapshots } = require('./snapshots');
const { migrateAllDbs } = require('./dbs');

const { baseDir, engineStoragePath, dbsStoragePath, snapshotsStoragePath } = require('./v0_0_8_siderrc');

module.exports = {
  async main(readline) {
    console.log(`About to start migration of contents in path ${baseDir}.\n`);

    console.log(`You're advised to back up the contents in the ${baseDir} folder,`);
    console.log(`Example via git: cd ${baseDir} && git init && git add . && git commit -m "V1.0.0 migration backup"`);

    await new Promise(resolve => { 
      readline.question('Press any key to continue > ', resolve)
    });

    console.log(`\nMigrating any engines in folder ${engineStoragePath}`);
    migrateAllEngines();

    console.log(`\nMigrating any snapshots in folder ${snapshotsStoragePath}`);
    migrateAllSnapshots();

    console.log(`\nMigrating any dbs in folder ${dbsStoragePath}`);
    migrateAllDbs();

    console.log(`\nDone!`);
  },
};
