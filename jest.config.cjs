module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: ['**/server/**/*.test.js'],
  verbose: true,
  setupFiles: ['dotenv/config'],
  transformIgnorePatterns: []
};