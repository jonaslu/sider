const fileDb = require('./storage/file-db');
const engines = require('./engines')

const emptyReturnValue = [];

function getEngines(words) {
  // If first word is set we're at the end...
  if (words.length > 0) {
    return emptyReturnValue;
  }

  return engines.listEngines()
}

function getDbNameWithSnapshotAndParameters(words) {
  switch (words.length) {
    case 0: {
      let returnValue = module.exports.db.start.options;
      returnValue = returnValue.concat(
        fileDb.getDbsAsArray().map(value => value.dbName)
      );
      return returnValue;
    }
    case 1: // if -p, --persist
      if (
        module.exports.db.start.options.find(
          value => value === words[words.length - 1]
        )
      ) {
        return fileDb.getDbsAsArray().map(value => value.dbName);
      }
      return fileDb.getSnapshotsAsArray().map(value => value.snapshotName);
    case 2:
      return fileDb.getSnapshotsAsArray().map(value => value.snapshotName);
    default:
      return emptyReturnValue;
  }
}

module.exports = {
  engine: {
    setconf: {
      commanderLine: 'setconf <engineName> [keyvalues...]',
      complete: getEngines
    },
    getconf: {
      commanderLine: 'getconf <engineName>',
      complete: getEngines
    },
    remconf: {
      commanderLine: 'remconf <engineName> [keys...]',
      complete: getEngines
    }
  },
  db: {
    start: {
      commanderLine: 'start <name> [snapshot] [parameters...]',
      options: ['-p', '--persist'],
      complete: getDbNameWithSnapshotAndParameters
    }
  }
};
