const fsExtra = require('fs-extra');
const moment = require('moment');
const path = require('path');

const { internalErrorAndDie } = require('../utils');
const { snapshotsStoragePath } = require('../siderrc');

/**
 * {
 *  snapshotName: <- synthetic, not saved
 *  snapshotFileFolder: <- synthetic, not saved
 *  snapshotSpecsFile: <- synthetic, not saved

 *  engineName: 'redis',
 *  fstats: {
 *    created
 *  },
 *  runtimeConfig: {
 *  }
 * }
 */
const snapshotFilesFolder = 'files';
const specsFileName = 'specs.json';

module.exports = {
  async getSnapshot(snapshotName) {
    const snapshotsBasePath = path.join(snapshotsStoragePath, snapshotName);

    const snapshotExists = await fsExtra.pathExists(snapshotsBasePath);
    if (!snapshotExists) {
      return undefined;
    }

    const snapshotFileFolder = path.join(
      snapshotsBasePath,
      snapshotFilesFolder
    );

    const snapshotSpecsFile = path.join(snapshotsBasePath, specsFileName);

    try {
      const snapshotSpecsContents = await fsExtra.readJSON(
        snapshotSpecsFile,
        'utf-8'
      );

      if (snapshotSpecsContents) {
        return {
          snapshotName,
          snapshotFileFolder,
          snapshotSpecsFile,
          ...snapshotSpecsContents
        };
      }
    } catch (e) {
      internalErrorAndDie(
        `Could not read file ${snapshotSpecsFile}.
Has the contents been tampered with?`,
        e
      );
    }

    return undefined;
  },
  async getAllSnapshots() {
    const anySnapshotExists = await fsExtra.pathExists(snapshotsStoragePath);
    if (anySnapshotExists) {
      return fsExtra.readdir(snapshotsStoragePath);
    }

    return [];
  },

  // Expects it has been verified snapshot does not exist
  async createSnapshot(snapshotName, engine, engineName, dumpBasePath) {
    const snapshotBasePath = path.join(snapshotsStoragePath, snapshotName);
    const snapshotFileFolder = path.join(snapshotBasePath, snapshotFilesFolder);

    const cleanUpBeforeExit = async () => {
      try {
        await fsExtra.remove(snapshotBasePath);
      } catch (e) {
        internalErrorAndDie(`Could not remove snapshot at ${snapshotBasePath}`);
      }
    };

    await fsExtra.ensureDir(snapshotFileFolder);

    try {
      await engine.load(dumpBasePath, snapshotFileFolder);
    } catch (e) {
      await cleanUpBeforeExit();

      internalErrorAndDie(
        `Could not load snapshot files from folder ${dumpBasePath}`,
        e
      );
    }

    const snapshotSpecsFile = path.join(snapshotBasePath, specsFileName);

    const snapshotSaveValues = {
      engineName,
      fstats: moment().utc(),
      runtimeConfig: {}
    };

    try {
      await fsExtra.writeJSON(snapshotSpecsFile, snapshotSaveValues, {
        spaces: 2
      });
    } catch (e) {
      await cleanUpBeforeExit();

      internalErrorAndDie(`Could not write ${snapshotSpecsFile} contents`);
    }
  }
};

const engines = require('../engines');
engines.getEngineOrDie('mariadb').then(engine => {
  module.exports.createSnapshot(
    'snapshot2',
    engine,
    'mariadb',
    '/home/jonasl/.sider/snapshots/pfmegrnargs/postgres/'
    // '/home/jonasl/code/sider2/yaya/'
  );
});

/*
Test plan:
* Have some files that an engine
  cannot load (such as the files are
  not readable by this user). Verify
  error message and snapshot path
  is cleaned up properly.
* Make writing to the snapshot specs
  file fail (e g make the db-folder write
  only). Verify an error-message and
  the database cleaned up.
* Verify happy-path that
  a snapshot is created and
  the specfile-saved.
*/

// WASHERE
/*
Had moved onto snapshots now.

Adding snapshot add, because
I want to see that snapshot add -e
pans out well.

Test the createSnapshot with
all the different engines, then
commit and start adding snapshot add -e
*/
