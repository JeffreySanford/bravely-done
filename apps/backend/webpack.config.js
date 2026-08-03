const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  // `ret` (a transitive dep) ships .js with sourceMappingURL comments
  // pointing at .ts files that aren't published — cosmetic only.
  ignoreWarnings: [/Failed to parse source map/],
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
      // argon2 ships a native N-API addon (prebuilt .node binary per
      // platform) that node-gyp-build resolves via real filesystem paths at
      // runtime. Webpack bundling it breaks that resolution; keep it a real
      // `require()` instead.
      externalDependencies: ['argon2'],
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
    // @nestjs/core lazily requires @nestjs/websockets and @nestjs/microservices
    // for optional gateway/transport features this HTTP-only API doesn't use.
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/(websockets|microservices)(\/.*)?$/,
    }),
  ],
};
