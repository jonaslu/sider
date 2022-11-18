const { patchSnapshots } = require('./patch');
const { baseDir, snapshotsStoragePath } = require('./v1_0_0_siderrc');

console.log(`About to start migration of contents in path ${snapshotsStoragePath}.\n`);

console.log(`You're advised to back up the contents in the ${baseDir} folder,`);
console.log(`Example via git: cd ${baseDir} && git init && git add . && git commit -m "V1.2.0 migration backup"`);

module.exports = {
  async main(readline) {
    await new Promise(resolve => {
      readline.question('Press any key to continue > ', resolve);
    });

    console.log(`\nMigrating any snapshots in folder ${snapshotsStoragePath}`);
    patchSnapshots();

    console.log(`\nDone! If there were errors - act on them.`);
    console.log(`If not, give the new version a test-whirl and`);
    console.log(`then you can delete the backup.`);
  },
};
