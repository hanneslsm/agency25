<?php
/**
 * Asset enqueuing for theme.
 *
 * @package agency25
 * @version 0.2.0
 *
 * 0.2.0: Use *.asset.php for all CSS (uniform with @wordpress/scripts). Keep conditional block & variation loading on frontend. Preload all block CSS in editors. Keep add_editor_style for editor.css. Custom block assets are expected via block.json.
 * 0.1.0: Initial enqueue set (global, screen, editor, global.js) and conditional block CSS loading by usage.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Enqueue a built CSS entry using its generated asset file.
 *
 * @param string $handle Style handle.
 * @param string $rel    Relative path under /build without leading slash, e.g. 'css/blocks/core-cover.css'.
 */
function agency25_enqueue_css_entry( $handle, $rel ) {
	$base_dir   = trailingslashit( get_template_directory() ) . 'build/';
	$base_url   = trailingslashit( get_template_directory_uri() ) . 'build/';
	$css_path   = $base_dir . $rel;
	$asset_path = preg_replace( '/\.css$/', '.asset.php', $css_path );

	if ( file_exists( $css_path ) && file_exists( $asset_path ) ) {
		$asset = require $asset_path;

		wp_enqueue_style(
			$handle,
			$base_url . $rel,
			isset( $asset['dependencies'] ) ? (array) $asset['dependencies'] : array(),
			isset( $asset['version'] ) ? $asset['version'] : null
		);
	}
}

/**
 * Enqueue global CSS and JavaScript for both the frontend and editor.
 */
function agency25_enqueue_scripts() {
	// Global CSS.
	$global_style_asset = get_template_directory() . '/build/css/global.asset.php';
	if ( file_exists( $global_style_asset ) ) {
		$asset = require $global_style_asset;

		wp_enqueue_style(
			'agency25-global-style',
			get_template_directory_uri() . '/build/css/global.css',
			isset( $asset['dependencies'] ) ? (array) $asset['dependencies'] : array(),
			isset( $asset['version'] ) ? $asset['version'] : null
		);
	}

	// Global JS.
	$global_script_asset = get_template_directory() . '/build/js/global.asset.php';
	if ( file_exists( $global_script_asset ) ) {
		$asset = require $global_script_asset;

		wp_enqueue_script(
			'agency25-global-script',
			get_template_directory_uri() . '/build/js/global.js',
			isset( $asset['dependencies'] ) ? (array) $asset['dependencies'] : array(),
			isset( $asset['version'] ) ? $asset['version'] : null,
			true
		);
	}
}
add_action( 'enqueue_block_assets', 'agency25_enqueue_scripts' );

/**
 * Enqueue the screen CSS for the frontend.
 */
function agency25_enqueue_frontend_styles() {
	$screen_style_asset = get_template_directory() . '/build/css/screen.asset.php';
	if ( file_exists( $screen_style_asset ) ) {
		$asset = require $screen_style_asset;

		wp_enqueue_style(
			'agency25-screen-style',
			get_template_directory_uri() . '/build/css/screen.css',
			isset( $asset['dependencies'] ) ? (array) $asset['dependencies'] : array(),
			isset( $asset['version'] ) ? $asset['version'] : null
		);
	}
}
add_action( 'wp_enqueue_scripts', 'agency25_enqueue_frontend_styles' );

/**
 * Use add_editor_style() for block editor CSS.
 */
add_action(
	'after_setup_theme',
	function () {
		add_editor_style( 'build/css/editor.css' );
	}
);

/**
 * 1) Collect everything that is actually rendered on the frontend.
 */
add_filter( 'render_block', 'agency25_collect_used_blocks', 10, 2 );

/**
 * Collect used blocks and style variations.
 *
 * @param string $block_content Block content.
 * @param array  $block         Parsed block.
 * @return string
 */
function agency25_collect_used_blocks( $block_content, $block ) {
	static $collected = array(
		'blocks' => array(),
		'styles' => array(),
	);

	if ( empty( $block['blockName'] ) ) {
		return $block_content;
	}

	$block_name = (string) $block['blockName'];

	// Collect block names.
	if ( ! in_array( $block_name, $collected['blocks'], true ) ) {
		$collected['blocks'][] = $block_name;
	}

	// Collect style variations.
	if (
		! empty( $block['attrs']['className'] ) &&
		preg_match( '/\bis-style-([a-z0-9\-]+)\b/', $block['attrs']['className'], $m )
	) {
		$style_slug = $m[1];

		if ( ! isset( $collected['styles'][ $block_name ] ) ) {
			$collected['styles'][ $block_name ] = array();
		}

		if ( ! in_array( $style_slug, $collected['styles'][ $block_name ], true ) ) {
			$collected['styles'][ $block_name ][] = $style_slug;
		}
	}

	$GLOBALS['agency25_used_blocks'] = $collected;
	return $block_content;
}

/**
 * 2) Enqueue the collected block and style-variation CSS on the frontend.
 * Core block overrides live in: build/css/blocks/{core-block-slug}.css
 * Variations live in:         build/css/block-styles/{variation}/{core-block-slug}.css
 */
add_action( 'enqueue_block_assets', 'agency25_enqueue_block_styles', 20 );

/**
 * Enqueue block & variation CSS based on collected usage.
 */
function agency25_enqueue_block_styles() {
	$used = isset( $GLOBALS['agency25_used_blocks'] ) ? (array) $GLOBALS['agency25_used_blocks'] : array();

	if ( empty( $used['blocks'] ) ) {
		return;
	}

	// Base block styles.
	foreach ( (array) $used['blocks'] as $block_name ) {
		$slug = str_replace( '/', '-', (string) $block_name ); // e.g. core/cover → core-cover
		agency25_enqueue_css_entry(
			'agency25-block-style-' . $slug,
			'css/blocks/' . $slug . '.css'
		);
	}

	// Style variations.
	if ( ! empty( $used['styles'] ) && is_array( $used['styles'] ) ) {
		foreach ( $used['styles'] as $block_name => $variations ) {
			$block_slug = str_replace( '/', '-', (string) $block_name );

			foreach ( (array) $variations as $style_slug ) {
				agency25_enqueue_css_entry(
					'agency25-block-style-' . $block_slug . '-' . $style_slug,
					'css/block-styles/' . $style_slug . '/' . $block_slug . '.css'
				);
			}
		}
	}
}

/**
 * 3) Load ALL block & variation CSS in editors (post/page & Site Editor).
 * Skips public frontend.
 */
function agency25_enqueue_all_block_styles_in_editor() {
	// Only in admin/editor contexts.
	if ( ! is_admin() ) {
		return;
	}

	$dir_blocks = get_theme_file_path( 'build/css/blocks' );
	$dir_vars   = get_theme_file_path( 'build/css/block-styles' );

	// 1) Base block CSS.
	foreach ( glob( $dir_blocks . '/*.css' ) as $file ) {
		$slug = basename( $file, '.css' );

		agency25_enqueue_css_entry(
			'agency25-block-style-' . $slug,
			'css/blocks/' . $slug . '.css'
		);
	}

	// 2) Variation CSS.
	foreach ( glob( $dir_vars . '/*/*.css' ) as $file ) {
		$rel        = str_replace( trailingslashit( $dir_vars ), '', $file ); // e.g. "duotone/core-cover.css"
		list( $variation, $css_file ) = explode( '/', $rel, 2 );
		$block_slug = basename( $css_file, '.css' );

		agency25_enqueue_css_entry(
			'agency25-block-style-' . $block_slug . '-' . $variation,
			'css/block-styles/' . $variation . '/' . $block_slug . '.css'
		);
	}
}
// Page/post editors.
add_action( 'enqueue_block_editor_assets', 'agency25_enqueue_all_block_styles_in_editor', 5 );
// Site Editor (template & template-part editing).
add_action( 'enqueue_block_assets', 'agency25_enqueue_all_block_styles_in_editor', 5 );
