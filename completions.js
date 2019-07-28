const fileDb = require('./storage/file-db');

const emptyReturnValue = [];

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
  db: {
    start: {
      commanderLine: 'start <name> [snapshot] [parameters...]',
      options: ['-p', '--persist'],
      complete: getDbNameWithSnapshotAndParameters
    }
  }
};
