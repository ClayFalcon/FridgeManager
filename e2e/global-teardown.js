module.exports = async function globalTeardown() {
  const detox = require('detox/runners/jest');
  await detox.globalCleanup();
};
