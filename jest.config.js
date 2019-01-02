module.exports = {
 "jest": {
    "verbose": true,
    "testURL": "http://localhost/"
 },
  "scripts": {
    "jest": "jest --env=node --colors --coverage test",
    "test": "npm run jest"
  },
  "roots": [
    "<rootDir>/src"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
}
