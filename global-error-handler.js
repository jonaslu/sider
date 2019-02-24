function printErrorAndExit(error) {
  console.error(error);
  process.exit(1);
}

process.on('unhandledRejection', error => printErrorAndExit(error));
process.on('uncaughtException', error => printErrorAndExit(error));
