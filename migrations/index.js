const fs = require('fs');
const { baseDir } = require('../siderrc');

const { migrateToV1_0_0 } = require('./v0.0.8-v1.0.0/index');
const { migrateToV1_2_0 } = require('./v1.1.0-v1.2.0/index');

try {
  migrateToV1_0_0();
  migrateToV1_2_0();
} catch (e) {
  console.error("Sider performed a migration when updating.\n");
  console.error("When the migration was applied an error occurred:");
  console.error(e.message);

  console.error("\nStack trace of where the error occurred:")
  console.error(e.stack);

  console.error("\nIf it wasn't obvious what caused the error ask for help here:");

  console.error("https://github.com/jonaslu/sider/discussions");
  console.error("https://github.com/jonaslu/sider/issues");

  console.error("\nMake sure to include the entire npm debug log.");

  process.exit(1);
}
