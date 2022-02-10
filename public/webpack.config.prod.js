var path = require('path')
var TerserPlugin = require('terser-webpack-plugin');
var CompressionPlugin = require("compression-webpack-plugin");




// if issue with images go to "import-png.d.ts"
module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.tsx',
    admin: "./src/admin/admin.tsx",
    test: "./src/experiment.tsx"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpg|PNG|gif|GIF)$/i,
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
      }, {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-object-rest-spread'],
            cacheDirectory: true
          }
        }
      }
    ]
  },
  plugins: [new CompressionPlugin()],
  resolve: {
    extensions: [".webpack.js", '.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
}
