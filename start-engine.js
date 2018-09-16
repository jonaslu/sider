const chalk = require('chalk');
const os = require('os');
const { spawn } = require('child_process');

const config = require('./config');

function runDb(
  dbFolder,
  dbName,
  port,
  printStdout = true
) {
  let osSpecificArgs = [];

  const platform = os.platform();
  if (platform === 'linux') {
    const { uid, gid } = os.userInfo();
    osSpecificArgs = [
      '-v',
      '/etc/group:/etc/group:ro',
      '-v',
      '/etc/passwd:/etc/passwd:ro',
      '-u',
      `${uid}:${gid}`
    ];
  }

  const args = [
    'run',
    '--rm',
    ...osSpecificArgs,
    '-v',
    `${dbFolder}:/data`,
    '-p',
    `${port}:6379`,
    '--name',
    dbName,
    `redis:${config.redisVersion}`,
    'redis-server'
  ];

  const dbNameInBlue = chalk.blue(dbName);

  console.log(
    chalk.green(
      `✨ Starting db ${dbNameInBlue} on port ${port} 🚀`
    )
  );

  const childProcess = spawn('docker', args);

  if (printStdout) {
    childProcess.stdout.on('data', data =>
      process.stdout.write(`${data.toString('utf-8')}`)
    );
  }

  childProcess.on('close', () => {
    console.log(
      chalk.green(`Successfully shut down db ${dbNameInBlue}`)
    );
  });
}

module.exports = {
  runSingleDb(dbFolder, dbName, port) {
    runDb(dbFolder, dbName, port);
  },
  runBatchDb(dbFolder, dbName, port) {
    runDb(dbFolder, dbName, port, false);
  }
};
