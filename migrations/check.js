/* eslint-disable camelcase, import/no-dynamic-require */
const chalk = require('chalk');
const readline = require('readline');
const { detectMigrationToV1_0_0 } = require('./v0.0.8-v1.0.0/check');
const { detectMigrationToV1_2_0 } = require('./v1.1.0-v1.2.0/check');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askToApplyMigration(pathToMigrationMainFile) {
  const answer = await new Promise(resolve => {
    rl.question('Apply migration [Y/n]? > ', resolve);
  });

  if (answer === 'n') {
    console.log('\nSkipping migration.\n');
    console.log('You can run any migration(s) manually later with');
    console.log('sider migrate');

    rl.close();
    process.exit(0);
  }

  console.log('');
  await require(pathToMigrationMainFile).main(rl);
}

const needMigrationToV1_0_0 = detectMigrationToV1_0_0() || true;
const needMigrationToV1_2_0 = detectMigrationToV1_2_0();

const heading = chalk.cyanBright;
const warning = chalk.yellow;

async function main() {
  if (needMigrationToV1_0_0 || needMigrationToV1_2_0) {
    console.log(heading("You're upgrading from an older version of sider!\n"));
  }

  if (needMigrationToV1_0_0) {
    console.log(warning('A migration to the v1.0.0 format needed.'));

    console.log('If skipped sider will ignore old databases, snapshots and engine settings.\n');

    await askToApplyMigration('./v0.0.8-v1.0.0/index');
  }

  if (needMigrationToV1_2_0) {
    console.log(warning('A migration to patch the snapshot(s) specs.json file needed.'));

    console.log('If skipped snapshot name after sider snapshot mv will be incorrect.');

    await askToApplyMigration('./v1.1.0-v1.2.0/index');
  }

  rl.close();
}

main();
