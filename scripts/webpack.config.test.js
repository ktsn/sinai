const path = require('path')
const glob = require('glob')

module.exports = {
  entry: [path.resolve(__dirname, '../test/setup.ts')]
    .concat(glob.sync(path.resolve(__dirname, '../test/specs/**/*.ts'))),
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: 'test.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'webpack-espower-loader!ts-loader' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  devtool: 'source-map'
}
