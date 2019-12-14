const os = require('os');
const { spawn } = require('child_process');

function runDb(dbName, dockerArgs, dockerImageAndCommand) {
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
    ...dockerArgs,
    '--name',
    dbName,
    ...dockerImageAndCommand
  ];

  const childProcess = spawn('docker', args);

  childProcess.stdout.on('data', data =>
    process.stdout.write(`${data.toString('utf-8')}`)
  );

  childProcess.stderr.on('data', data => {
    process.stderr.write(`${data.toString('utf-8')}`);
  });

  return new Promise((resolve, reject) => {
    childProcess.on('close', code => {
      if (code != 0) {
        reject(code);
      } else {
        resolve(code);
      }
    });
  });
}

module.exports = {
  runDb
};
