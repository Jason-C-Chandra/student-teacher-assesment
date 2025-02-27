module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.ts$': 'ts-jest',  // This will handle .ts files
    },
    testPathIgnorePatterns: ['/node_modules/'],
  };
  