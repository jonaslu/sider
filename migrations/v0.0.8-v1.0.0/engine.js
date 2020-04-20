/* eslint-disable camelcase */
const fsExtra = require('fs-extra');
const path = require('path');
const v0_0_8_siderrc = require('./v0_0_8_siderrc');

const knownEngines = ['redis', 'mariadb', 'postgres'];

function migrateEngineSpec(engineName) {
  const { engineStoragePath, baseDir } = v0_0_8_siderrc;
  const v0_0_8_engineConfigPath = path.join(engineStoragePath, engineName, 'config.json');

  let engineConfig = {};
  try {
    engineConfig = fsExtra.readJSONSync(v0_0_8_engineConfigPath, 'utf-8');
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw new Error(`Could not read engine config.json in folder ${v0_0_8_engineConfigPath}: error ${e}`);
    }

    return false;
  }

  if (!Object.keys(engineConfig).length) {
    // Empty object, new version handles empty configs. Do nothing.
    return true;
  }

  const v1_0_0_enginePath = path.join(baseDir, 'engines', engineName);
  const v1_0_0_engineSpecPath = path.join(v1_0_0_enginePath, 'specs.json');

  const v1_0_0_engineSpec = {
    runtimeConfigSpec: engineConfig,
  };

  try {
    fsExtra.ensureDirSync(v1_0_0_enginePath);
    fsExtra.writeJSONSync(v1_0_0_engineSpecPath, v1_0_0_engineSpec, { spaces: 2 });
  } catch (e) {
    throw new Error(`Could not write v1.0.0 engine spec to path ${v1_0_0_engineSpecPath}: error ${e}`);
  }

  return true;
}

function removeEngineFilesPath(engineName) {
  const { engineFolder, engineStoragePath } = v0_0_8_siderrc;

  let removePath = path.join(engineStoragePath, engineName);
  if (engineFolder === 'engines/') {
    removePath = path.join(removePath, 'config.json');
  }

  try {
    fsExtra.removeSync(removePath);
  } catch (e) {
    throw new Error(`Could not remove engine files ${removePath}: error ${e}`);
  }
}

function deleteDebugEngineSpec() {
  const { engineStoragePath } = v0_0_8_siderrc;
  const debugEngineStoragePath = path.join(engineStoragePath, 'debug');

  const debugSettingsExist = fsExtra.existsSync(debugEngineStoragePath);
  if (debugSettingsExist) {
    console.log(`Removing debug engine settings - engine no longer supported in v1.0.0`);
    try {
      fsExtra.remove(debugEngineStoragePath);
    } catch (e) {
      throw new Error(`Could not remove debug engine settings in path ${debugEngineStoragePath}: error ${e}`);
    }
  }
}

function migrateSpec() {
  knownEngines.forEach((engineName) => {
    const removeFile = migrateEngineSpec(engineName);
    if (removeFile) {
      removeEngineFilesPath(engineName);
    }
  });

  deleteDebugEngineSpec();
}
