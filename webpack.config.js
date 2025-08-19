/**
 * withkit Webpack configuration
 *
 * @package withkit
 * @version 2.5.1
 *
 * 2.5.1: Move converted WebP output to build/webp (separate from images)
 * 2.5.0: Standardize image output to build/images/svg; use *.asset.php for all CSS enqueues; clarify block.json responsibility for custom blocks
 * 2.4.2: Refactor for clarity & speed (helpers, resolved paths, plugin builders, filesystem cache)
 * 2.4.1: Remove sections SCSS pipeline; simplify BrowserSync config to proxy only; rename QUALITY_WEBP_SECONDARY → QUALITY_WEBP_CONVERT
 * 2.4.0: Add top-level config variables (image qualities/max width, BrowserSync proxy/port, toggles)
 * 2.3.0: Merge BrowserSync proxy (2.1.3) with auto-detect block JS & style-index (2.2.0)
 * 2.2.0: Auto-detect block JS (index/view) and style.scss (style-index); cleanup
 * 2.1.3: Add BrowserSync with proxy support for Local by Flywheel
 * 2.1.2: Clean & copy SVGs to build
 * 2.1.1: Disable performance hints
 * 2.1.0: Automatic block-style entries & recursive block SCSS
 * 2.0.0: Add webp images
 * 1.0.0: Initial version
 */

/* External */
const path = require('path');
const fs = require('fs');
const { merge } = require('webpack-merge');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const sharp = require('sharp');
const { optimize } = require('svgo');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

/* WordPress */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

/* Package */
const packageJson = require('./package.json');

/* ──────────────────────────────────────────────────────────────────────────
   Config (env-overridable)
   ────────────────────────────────────────────────────────────────────────── */
const CONFIG = {
  IMG_MAX_WIDTH: Number(process.env.WITHKIT_IMG_MAX_WIDTH || 2560),
  QUALITY_JPEG: Number(process.env.WITHKIT_QUALITY_JPEG || 50),
  QUALITY_PNG: Number(process.env.WITHKIT_QUALITY_PNG || 50),
  QUALITY_AVIF: Number(process.env.WITHKIT_QUALITY_AVIF || 50),
  QUALITY_WEBP: Number(process.env.WITHKIT_QUALITY_WEBP || 70),
  QUALITY_WEBP_CONVERT: Number(process.env.WITHKIT_QUALITY_WEBP_CONVERT || 60),
  BS_PROXY: process.env.WITHKIT_BS_PROXY || '',
  COPY_IMAGES_IN_PROD: (process.env.WITHKIT_COPY_IMAGES_IN_PROD || 'true').toLowerCase() === 'true',
};

/* Resolved paths once (avoid repeated resolve calls) */
const PATHS = {
  root: __dirname,
  build: path.resolve(__dirname, 'build'),
  imagesSrc: path.resolve(__dirname, 'src/images'),
  svgSrc: path.resolve(__dirname, 'src/svg'),
  blocksJs: path.resolve(__dirname, 'src/blocks'),
  blocksScss: path.resolve(__dirname, 'src/scss/blocks'),
  blockStylesScss: path.resolve(__dirname, 'src/scss/block-styles'),
  cssGlobal: path.resolve(__dirname, 'src/scss/global.scss'),
  cssScreen: path.resolve(__dirname, 'src/scss/screen.scss'),
  cssEditor: path.resolve(__dirname, 'src/scss/editor.scss'),
  jsGlobal: path.resolve(__dirname, 'src/js/global.js'),
  themeStyle: path.resolve(__dirname, 'style.css'),
};

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────────── */
const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();

/**
 * Keeps flat naming:
 * src/scss/blocks/core-cover.scss → build/css/blocks/core-cover.css
 */
function recursiveScssEntries(rootDir, outBase) {
  if (!isDir(rootDir)) return {};
  const stack = [{ dir: rootDir, out: outBase }];
  const out = {};
  while (stack.length) {
    const { dir, out: outPrefix } = stack.pop();
    fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) {
        stack.push({ dir: full, out: `${outPrefix}/${d.name}` });
      } else if (d.isFile() && d.name.endsWith('.scss')) {
        out[`${outPrefix}/${d.name.replace(/\.scss$/, '')}`] = full;
      }
    });
  }
  return out;
}

/**
 * Variations: src/scss/block-styles/{variation}/{block-slug}.scss
 * → build/css/block-styles/{variation}/{block-slug}.css
 */
function styleVariantEntries(rootDir, outBase) {
  if (!isDir(rootDir)) return {};
  return fs
    .readdirSync(rootDir)
    .filter((name) => isDir(path.join(rootDir, name)))
    .reduce((acc, styleName) => {
      const dir = path.join(rootDir, styleName);
      fs.readdirSync(dir)
        .filter((f) => f.endsWith('.scss'))
        .forEach((f) => {
          acc[`${outBase}/${styleName}/${f.replace(/\.scss$/, '')}`] = path.join(dir, f);
        });
      return acc;
    }, {});
}

/**
 * Block JS index/view under src/blocks/{block}/{index|view}.js
 */
function blockJsEntries(rootDir, outBase = 'js/blocks') {
  if (!isDir(rootDir)) return {};
  return fs
    .readdirSync(rootDir)
    .filter((name) => isDir(path.join(rootDir, name)))
    .reduce((acc, blockName) => {
      const dir = path.join(rootDir, blockName);
      ['index', 'view'].forEach((base) => {
        const fp = path.join(dir, `${base}.js`);
        if (fs.existsSync(fp)) acc[`${outBase}/${blockName}/${base}`] = fp;
      });
      return acc;
    }, {});
}

/**
 * style.scss → style-index.css for block.json
 * src/blocks/{block}/style.scss → build/css/blocks/{block}/style-index.css
 */
function blockStyleIndexEntries(rootDir, outBase = 'css/blocks') {
  if (!isDir(rootDir)) return {};
  return fs
    .readdirSync(rootDir)
    .filter((name) => isDir(path.join(rootDir, name)))
    .reduce((acc, blockName) => {
      const fp = path.join(rootDir, blockName, 'style.scss');
      if (fs.existsSync(fp)) acc[`${outBase}/${blockName}/style-index`] = fp;
      return acc;
    }, {});
}

/* Image transforms (Sharp) */
function transformRaster(content, absoluteFrom) {
  const ext = path.extname(absoluteFrom).toLowerCase();
  const img = sharp(content).resize({ width: CONFIG.IMG_MAX_WIDTH, withoutEnlargement: true });
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return img.jpeg({ quality: CONFIG.QUALITY_JPEG }).toBuffer();
    case '.png':
      return img.png({ quality: CONFIG.QUALITY_PNG }).toBuffer();
    case '.avif':
      return img.avif({ quality: CONFIG.QUALITY_AVIF }).toBuffer();
    case '.webp':
      return img.webp({ quality: CONFIG.QUALITY_WEBP }).toBuffer();
    default:
      return content;
  }
}

function toWebp(content) {
  return sharp(content)
    .resize({ width: CONFIG.IMG_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: CONFIG.QUALITY_WEBP_CONVERT })
    .toBuffer();
}

function optimizeSvg(content) {
  const result = optimize(content.toString(), {
    multipass: true,
    plugins: [
      'removeDimensions',
      { name: 'removeViewBox', active: true },
      'removeTitle',
      'removeDesc',
      'removeUselessDefs',
      'removeXMLNS',
    ],
  });
  return Buffer.from(result.data);
}

/* Plugin builders */
function commonPlugins() {
  return [
    ...(defaultConfig.plugins || []),
    new RemoveEmptyScriptsPlugin({
      stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
    }),
    // Sync style.css "Version:" with package.json.version
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('UpdateThemeVersionPlugin', () => {
          if (!fs.existsSync(PATHS.themeStyle)) return;
          let content = fs.readFileSync(PATHS.themeStyle, 'utf-8');
          content = content.replace(/(Version:\s*)([^\r\n]+)/, `$1${packageJson.version}`);
          fs.writeFileSync(PATHS.themeStyle, content, 'utf-8');
        });
      },
    },
  ];
}

function devPlugins({ proxy }) {
  if (!proxy) return [];
  return [
    new BrowserSyncPlugin(
      {
        host: 'localhost',
        port: 3000,
        proxy,
        files: ['**/*.php', 'build/css/**/*.css', 'build/js/**/*.js'],
        open: false,
        injectChanges: true,
      },
      { reload: false },
    ),
  ];
}

function prodPlugins() {
  if (!CONFIG.COPY_IMAGES_IN_PROD) return [];
  return [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: '**/*.{jpg,jpeg,png,avif,webp}',
          context: PATHS.imagesSrc,
          to: 'images/[path][name][ext]',
          noErrorOnMissing: true,
          transform: transformRaster,
        },
        {
          from: '**/*.{jpg,jpeg,png,avif,webp}',
          context: PATHS.imagesSrc,
          to: 'webp/[path][name].webp', // ← separate top-level folder
          noErrorOnMissing: true,
          transform: toWebp,
        },
        {
          from: '**/*.svg',
          context: PATHS.svgSrc,
          to: 'images/svg/[path][name][ext]',
          noErrorOnMissing: true,
          transform: optimizeSvg,
        },
      ],
    }),
  ];
}

/* Entries (centralized) */
function makeEntries() {
  return {
    'css/global': PATHS.cssGlobal,
    'css/screen': PATHS.cssScreen,
    'css/editor': PATHS.cssEditor,
    'js/global': PATHS.jsGlobal,
    ...blockJsEntries(PATHS.blocksJs),
    ...blockStyleIndexEntries(PATHS.blocksJs),
    ...recursiveScssEntries(PATHS.blocksScss, 'css/blocks'),
    ...styleVariantEntries(PATHS.blockStylesScss, 'css/block-styles'),
  };
}

/* Export */
module.exports = () => {
  const isProd = process.env.NODE_ENV === 'production';

  return merge(defaultConfig, {
    mode: isProd ? 'production' : 'development',
    entry: makeEntries(),
    output: {
      path: PATHS.build,
      filename: '[name].js',
      assetModuleFilename: 'images/[path][name][ext]',
      clean: false,
    },
    module: {
      rules: [
        {
          test: /\.svg$/i,
          type: 'asset/resource',
          generator: { filename: 'images/svg/[path][name][ext]' },
        },
      ],
    },
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(PATHS.root, '.webpack-cache'),
      buildDependencies: { config: [__filename] },
    },
    plugins: [
      ...commonPlugins(),
      ...(isProd ? prodPlugins() : devPlugins({ proxy: CONFIG.BS_PROXY })),
    ],
    performance: { hints: false },
    stats: {
      all: false,
      source: true,
      assets: true,
      errorsCount: true,
      errors: true,
      warningsCount: true,
      warnings: true,
      colors: true,
    },
    infrastructureLogging: { level: 'warn' },
  });
};
