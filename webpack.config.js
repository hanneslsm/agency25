/**
 * withkit Webpack configuration
 *
 * @package withkit
 * @version 2.4.1
 *
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

/** External dependencies */
const path = require('path');
const fs = require('fs');
const { merge } = require('webpack-merge');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const sharp = require('sharp');
const { optimize } = require('svgo');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

/** WordPress dependencies */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

/** Read version from package.json */
const packageJson = require('./package.json');

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Config: tweak here or via environment variables
 * ──────────────────────────────────────────────────────────────────────────────
 */
const CONFIG = {
	// Images
	IMG_MAX_WIDTH: Number(process.env.WITHKIT_IMG_MAX_WIDTH || 2560),
	QUALITY_JPEG: Number(process.env.WITHKIT_QUALITY_JPEG || 50),
	QUALITY_PNG: Number(process.env.WITHKIT_QUALITY_PNG || 50),
	QUALITY_AVIF: Number(process.env.WITHKIT_QUALITY_AVIF || 50),
	QUALITY_WEBP: Number(process.env.WITHKIT_QUALITY_WEBP || 70),
	// Qualität für die zusätzlich generierten WebP-Derivate (webp/[name].webp)
	QUALITY_WEBP_CONVERT: Number(process.env.WITHKIT_QUALITY_WEBP_CONVERT || 60),

	// BrowserSync (development only): enable if a proxy is provided
	BS_PROXY: process.env.WITHKIT_BS_PROXY || '',

	// Toggles
	COPY_IMAGES_IN_PROD: (process.env.WITHKIT_COPY_IMAGES_IN_PROD || 'true').toLowerCase() === 'true',

	// Paths
	PATHS: {
		imagesSrc: 'src/images',
		svgSrc: 'src/svg',
		blocksJs: 'src/blocks',
		blocksScss: 'src/scss/blocks',
		blockStylesScss: 'src/scss/block-styles',
		build: 'build',
	},
};

/** Utility: recursively get block entries (SCSS) */
function getRecursiveBlockEntries(rootDir, outputDir) {
	if (!fs.existsSync(rootDir)) return {};
	return fs
		.readdirSync(rootDir, { withFileTypes: true })
		.reduce((entries, dirent) => {
			const fullPath = path.join(rootDir, dirent.name);
			if (dirent.isDirectory()) {
				Object.assign(
					entries,
					getRecursiveBlockEntries(fullPath, `${outputDir}/${dirent.name}`),
				);
			} else if (dirent.isFile() && dirent.name.endsWith('.scss')) {
				const name = dirent.name.replace(/\.scss$/, '');
				entries[`${outputDir}/${name}`] = fullPath;
			}
			return entries;
		}, {});
}

/** Utility: get styled block variation entries */
function getStyleBlockEntries(rootDir, outputDir) {
	if (!fs.existsSync(rootDir)) return {};
	return fs
		.readdirSync(rootDir)
		.filter((d) => fs.statSync(path.join(rootDir, d)).isDirectory())
		.reduce((entries, styleName) => {
			const dir = path.join(rootDir, styleName);
			fs.readdirSync(dir)
				.filter((f) => f.endsWith('.scss'))
				.forEach((f) => {
					const name = f.replace(/\.scss$/, '');
					entries[`${outputDir}/${styleName}/${name}`] = path.resolve(dir, f);
				});
			return entries;
		}, {});
}

/** Utility: auto-detect block JS (index.js/view.js) */
function getBlockJsEntries(rootDir, outputDir = 'js/blocks') {
	if (!fs.existsSync(rootDir)) return {};
	return fs
		.readdirSync(rootDir)
		.filter((d) => fs.statSync(path.join(rootDir, d)).isDirectory())
		.reduce((entries, blockName) => {
			const dir = path.join(rootDir, blockName);
			['index', 'view'].forEach((file) => {
				const filePath = path.join(dir, `${file}.js`);
				if (fs.existsSync(filePath)) {
					entries[`${outputDir}/${blockName}/${file}`] = filePath;
				}
			});
			return entries;
		}, {});
}

/** Utility: auto-detect block style-index (style.scss) */
function getBlockStyleIndexEntries(rootDir, outputDir = 'css/blocks') {
	if (!fs.existsSync(rootDir)) return {};
	return fs
		.readdirSync(rootDir)
		.filter((d) => fs.statSync(path.join(rootDir, d)).isDirectory())
		.reduce((entries, blockName) => {
			const stylePath = path.join(rootDir, blockName, 'style.scss');
			if (fs.existsSync(stylePath)) {
				entries[`${outputDir}/${blockName}/style-index`] = stylePath;
			}
			return entries;
		}, {});
}

module.exports = () => {
	const isProd = process.env.NODE_ENV === 'production';
	const mode = isProd ? 'production' : 'development';

	// Base + auto-detected entries
	const entries = {
		'css/global': path.resolve(__dirname, 'src/scss/global.scss'),
		'css/screen': path.resolve(__dirname, 'src/scss/screen.scss'),
		'css/editor': path.resolve(__dirname, 'src/scss/editor.scss'),
		'js/global': path.resolve(__dirname, 'src/js/global.js'),
		...getBlockJsEntries(path.resolve(__dirname, CONFIG.PATHS.blocksJs)),
		...getBlockStyleIndexEntries(path.resolve(__dirname, CONFIG.PATHS.blocksJs)),
		...getRecursiveBlockEntries(
			path.resolve(__dirname, CONFIG.PATHS.blocksScss),
			'css/blocks',
		),
		...getStyleBlockEntries(
			path.resolve(__dirname, CONFIG.PATHS.blockStylesScss),
			'css/block-styles',
		),
	};

	const plugins = [
		...(defaultConfig.plugins || []),
		new RemoveEmptyScriptsPlugin({
			stage: RemoveEmptyScriptsPlugin.STAGE_AFTER_PROCESS_PLUGINS,
		}),
	];

	// Development: BrowserSync only if a proxy is provided
	if (!isProd && CONFIG.BS_PROXY) {
		plugins.push(
			new BrowserSyncPlugin(
				{
					host: 'localhost',
					port: 3000,
					proxy: CONFIG.BS_PROXY,
					files: ['**/*.php', 'build/css/**/*.css', 'build/js/**/*.js'],
					open: false,
					injectChanges: true,
				},
				{ reload: false },
			),
		);
	}

	// Production: image pipeline + SVG optimize/copy
	if (isProd && CONFIG.COPY_IMAGES_IN_PROD) {
		plugins.push(
			new CopyWebpackPlugin({
				patterns: [
					{
						from: '**/*.{jpg,jpeg,png,avif,webp}',
						context: path.resolve(__dirname, CONFIG.PATHS.imagesSrc),
						to: 'images/[path][name][ext]',
						noErrorOnMissing: true,
						transform: async (content, absoluteFrom) => {
							const ext = path.extname(absoluteFrom).toLowerCase();
							const img = sharp(content).resize({
								width: CONFIG.IMG_MAX_WIDTH,
								withoutEnlargement: true,
							});
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
						},
					},
					{
						from: '**/*.{jpg,jpeg,png,avif,webp}',
						context: path.resolve(__dirname, CONFIG.PATHS.imagesSrc),
						to: 'webp/[path][name].webp',
						noErrorOnMissing: true,
						transform: async (content) =>
							sharp(content)
								.resize({ width: CONFIG.IMG_MAX_WIDTH, withoutEnlargement: true })
								.webp({ quality: CONFIG.QUALITY_WEBP_CONVERT })
								.toBuffer(),
					},
					{
						from: '**/*.svg',
						context: path.resolve(__dirname, CONFIG.PATHS.svgSrc),
						to: 'svg/[path][name][ext]',
						noErrorOnMissing: true,
						transform: async (content) => {
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
						},
					},
				],
			}),
		);
	}

	// Sync style.css Theme header version to package.json version
	plugins.push({
		apply: (compiler) => {
			compiler.hooks.afterEmit.tap('UpdateThemeVersionPlugin', () => {
				const stylePath = path.resolve(__dirname, 'style.css');
				if (!fs.existsSync(stylePath)) return;
				let content = fs.readFileSync(stylePath, 'utf-8');
				content = content.replace(
					/(Version:\s*)([^\r\n]+)/,
					`$1${packageJson.version}`,
				);
				fs.writeFileSync(stylePath, content, 'utf-8');
			});
		},
	});

	return merge(defaultConfig, {
		mode,
		entry: entries,
		output: {
			path: path.resolve(__dirname, CONFIG.PATHS.build),
			filename: '[name].js',
			assetModuleFilename: 'images/[path][name][ext]',
		},
		module: {
			rules: [
				{
					test: /\.svg$/i,
					type: 'asset/resource',
					generator: {
						filename: 'images/[path][name][ext]',
					},
				},
			],
		},
		plugins,
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
	});
};
