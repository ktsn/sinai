module.exports = {
  context: __dirname,
  entry: './main.ts',
  output: {
    path: __dirname,
    filename: './__build__.js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/]
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          esModule: true
        }
      }
    ]
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: __dirname,
    noInfo: true
  }
}