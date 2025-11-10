module.exports = async function globalSetup() {
  const detox = require('detox/runners/jest');
  await detox.globalInit();
};
