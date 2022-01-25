var path = require('path')

var NodePolyfillPlugin = require("node-polyfill-webpack-plugin")


// if issue with images go to "import-png.d.ts"
module.exports = {
  mode: 'development',
  entry: {
    index: './src/index.tsx',
    admin: "./src/admin/admin.tsx",
    //test: "./src/test.tsx"
  },
  devtool: 'inline-source-map',
  devServer: {
    static: './dist'
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
        loader: 'url-loader',
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
      },
      {
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
  resolve: {
    extensions: [".webpack.js", '.tsx', '.ts', '.js']
  },
  output: {
    filename: '[name].bundle.js',
    //  filename: PROD ? '[name].bundle.min.js' : '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
}
