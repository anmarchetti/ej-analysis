const baseConfig = require('./jest.config.js');

module.exports = {
    ...baseConfig,
    collectCoverage: true,
    coverageReporters: ['lcov'],
    reporters: ['summary', ['github-actions', {silent: false}]]
};
