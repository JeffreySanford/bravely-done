const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
    // @nestjs/mapped-types tries `class-transformer/cjs/storage` then falls
    // back to `class-transformer/storage` in a try/catch; webpack statically
    // flags the unresolved fallback branch even though it's never reached at
    // runtime. Both class-transformer and class-validator are real deps here.
    new webpack.IgnorePlugin({
      checkResource(resource) {
        return resource === 'class-transformer/storage';
      },
    }),
    // `pg` lazily requires the optional `pg-native` accelerator; we use the
    // pure-JS driver, so this module is never actually loaded at runtime.
    new webpack.IgnorePlugin({
      resourceRegExp: /^pg-native$/,
    }),
  ],
};
