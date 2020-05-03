/* eslint-disable */
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    riot: './src/riot.ts',
    options: './src/ui/options.ts',
  },
  devtool: false,
  mode: 'production',
  performance: {
    hints: false,
  },
  node: false,
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.svg$/,
        loader: 'file-loader',
      },
    ],
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: chunk => {
        return ['options', 'riot'].includes(chunk.name);
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build', 'firefox'),
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/ui/options.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
    new CopyPlugin([
      'LICENSE',
      'src/manifest.json',
      {from: 'src/vector-icons', to: 'vector-icons'},
      {from: 'riot-web/webapp', to: 'riot'},
    ]),
  ],
  devServer: {
    hot: false,
    inline: false,
    writeToDisk: true,
  }
};
