/* eslint-disable camelcase */
const readline = require('readline');
const { detectMigrationToV1_0_0 } = require('./v0.0.8-v1.0.0/check');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (detectMigrationToV1_0_0()) {
  console.log("You're upgrading from an older version of sider!\n");
  console.log('A migration of the snapshots, engines and dbs');
  console.log('is needed for the new version to work.\n');
  console.log('You should really do this now, but');
  console.log('it is possible migrate manually later.\n');

  console.log('Note that sider will ignore old databases, snapshots')
  console.log('and engine configs if not migrated (and you\'re asking for trouble).\n');

  console.log('Press n to skip the migration');
  console.log('or any other key run the migration.\n');

  rl.question('Apply migration [Y/n]? > ', answer => {
    rl.close();

    if (answer === 'n') {
      console.log('\nAs you whish, skipping migration.\n');
      console.log('Check the README for how to migrate manually:');
      console.log('https://github.com/jonaslu/sider#migrating')

      process.exit(0);
    }

    console.log('');
    require('./v0.0.8-v1.0.0/index');
  });
} else {
  rl.close();
}
