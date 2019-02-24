const fs = require('fs-extra');
const os = require('os');
const { spawn } = require('child_process');

function runDb(dbPath, dbName, config, echoOutput = true) {
  let osSpecificArgs = [];
  const { port } = config;

  const platform = os.platform();
  if (platform === 'linux') {
    const { uid, gid } = os.userInfo();
    osSpecificArgs = [
      '-v',
      '/etc/group:/etc/group:ro',
      '-v',
      '/etc/passwd:/etc/passwd:ro',
      '-u',
      `${uid}:${gid}`,
      '-e',
      `MYSQL_USER=${uid}`
    ];
  }

  const { password } = config;

  const dockerArgs = [
    'run',
    '--rm',
    ...osSpecificArgs,
    '-v',
    `${dbPath}:/var/lib/mysql`,
    '-p',
    `${port}:3306`,
    '--name',
    dbName,
  ];

  if (password) {
    dockerArgs.push('-e', `MYSQL_ROOT_PASSWORD=${password}`);
  } else {
    dockerArgs.push('-e', 'MYSQL_ALLOW_EMPTY_PASSWORD=yes')
  }

  dockerArgs.push('mariadb');

  const childProcess = spawn('docker', dockerArgs);

  if (echoOutput) {
    childProcess.stdout.on('data', data =>
      process.stdout.write(`${data.toString('utf-8')}`)
    );

    childProcess.stderr.on('data', data => {
      process.stdout.write(`${data.toString('utf-8')}`);
    });
  }

  return new Promise(resolve => {
    childProcess.on('close', () => resolve());
  });
}

module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(dumpBasePath, snapshotStoreFolder, config) {
    const dumpBasePathStats = fs.statSync(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      console.error(
        `Mariadb currently only loads entire data-dirs, cannot find directory at ${dumpBasePath}`
      );
      process.exit(1);
    }

    fs.copySync(dumpBasePath, snapshotStoreFolder);
  },
  getConfig(storedSettings) {
    return {
      port: 3306,
      ...storedSettings
    };
  },
  start(dbPath, dbName, config) {
    return runDb(dbPath, dbName, config);
  },
  stop(dbName, config) {
    const { password } = config;

    const dockerArgs = ['exec', dbName, '/usr/bin/mysqladmin', '-uroot'];

    if (password) {
      dockerArgs.push(`-p${password}`);
    }

    dockerArgs.push('shutdown');

    spawn('docker', dockerArgs);
  }
};
