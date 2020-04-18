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
    throw new Error(`Could not read engine config.json in folder ${v0_0_8_engineConfigPath}: error ${e}`);
  }

  if (!Object.keys(engineConfig).length) {
    // Empty object, new version handles empty configs. Do nothing.
    return;
  }

  const v1_0_0_engineSpecPath = path.join(baseDir, 'engines', engineName, 'specs.json');

  const v1_0_0_engineSpec = {
    runtimeConfigSpec: engineConfig,
  };

  try {
    fsExtra.writeJSONSync(v1_0_0_engineSpecPath, v1_0_0_engineSpec, {spaces: 2});
  } catch (e) {
    throw new Error(`Could not write v1.0.0 engine spec to path ${v1_0_0_engineSpecPath}: error ${e}`);
  }
}

