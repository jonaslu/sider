#!/usr/bin/env node

/* eslint-disable camelcase */
const { detectMigrationToV1_0_0 } = require('./check');

if (detectMigrationToV1_0_0()) {
  require('./index');
} else {
  console.log(`No migration needed`);
}
