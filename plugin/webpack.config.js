/* eslint-env node */
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env = {}) => ({
  mode: env.production ? 'production' : 'development',
  target: 'web',
  context: path.resolve(__dirname, 'src'),
  entry: { module: './module.ts' },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'amd',
    publicPath: 'public/plugins/alerts-cards-panel/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  externals: [
    'react',
    'react-dom',
    '@grafana/data',
    '@grafana/ui',
    '@grafana/runtime',
    '@emotion/css',
    'lodash',
    'jquery',
    'd3',
    'rxjs',
    'react-router-dom',
    function ({ request }, callback) {
      if (request && request.startsWith('@grafana/')) {
        return callback(null, request);
      }
      callback();
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true, decorators: false },
              transform: { react: { runtime: 'classic' } },
              target: 'es2019',
              loose: false,
            },
          },
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.svg$/, type: 'asset/resource', generator: { filename: 'img/[name][ext]' } },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'plugin.json', to: '.' },
        { from: 'img', to: 'img', noErrorOnMissing: true },
        { from: path.resolve(__dirname, '..', 'README.md'), to: '.', noErrorOnMissing: true },
      ],
    }),
  ],
  devtool: env.production ? false : 'source-map',
});
