const { migrateAllEngines } = require('./engine');
const { migrateAllSnapshots } = require('./snapshots');
const { migrateAllDbs } = require('./dbs');

const { baseDir, engineStoragePath, dbsStoragePath, snapshotsStoragePath } = require('./v0_0_8_siderrc');

console.log(`About to start migration of contents in path ${baseDir}`);
console.log(`Just to be on the super-safe side of things:`);
console.log(`You're adivsed to back up the contents in this folder,`);
console.log(`or run git init && git add . && git commit -m "backup"`);
console.log(`in that folder just in case.`);

process.stdout.write(`\nPress any key once that's done and we'll continue > `);
process.stdin.setRawMode(true);

process.stdin.on('data', () => {
  process.stdin.resume();

  console.log(`\nMigrating any engines in folder ${engineStoragePath}`);
  migrateAllEngines();

  console.log(`\nMigrating any snapshots in folder ${snapshotsStoragePath}`);
  migrateAllSnapshots();

  console.log(`\nMigrating any dbs in folder ${dbsStoragePath}`);
  migrateAllDbs();

  console.log(`\n\nDone! If there were errors - act on them.`);
  console.log(`If not, give the new v1.0.0 a test-whirl and`);
  console.log(`then you can delete the backup.`);

  process.exit(0);
});
