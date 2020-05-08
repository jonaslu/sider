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
  console.log('is needed.\n');

  console.log('You should do this now, however');
  console.log('it is possible migrate manually later.\n');

  console.log('Note that sider will ignore old databases, snapshots')
  console.log('and engine settings if not migrated (i e you\'re asking for trouble).\n');

  console.log('Press n to skip the migration');
  console.log('or any other key run the migration.\n');

  rl.question('Apply migration [Y/n]? > ', answer => {
    rl.close();

    if (answer === 'n') {
      console.log('\nSkipping migration.\n');
      console.log('Instructions for migrating manually is in the wiki:');
      console.log('https://github.com/jonaslu/sider/wiki/Migrations')

      process.exit(0);
    }

    console.log('');
    require('./v0.0.8-v1.0.0/index');
  });
} else {
  rl.close();
}
