const { DetoxCircusEnvironment, SpecReporter, WorkerAssignReporter } = require('detox/runners/jest');

const config = {
  testRunner: {
    args: {
      '$0': 'jest',
      'config': 'e2e/config.json'
    },
    jest: {
      setupFilesAfterEnv: ['<rootDir>/e2e/init.js']
    }
  }
};

module.exports = config;
