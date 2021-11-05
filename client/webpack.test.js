const path = require('path')

module.exports = {
  mode: 'development',
  entry: { test: './src/test.tsx' },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpg|PNG|gif)$/i,
        loader: 'file-loader',
        options: {
          name: 'images/[name].[ext]'
        },

      },
      {
        test: /\.mp3$/,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  watchOptions: {
    ignored: [path.resolve(__dirname, 'src/components')]
  }
}
