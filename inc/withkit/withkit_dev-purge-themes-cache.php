<?php

/**
 * Remove default css. Use only for development!
 *
 * @package withkit
 * @version 0.1.0
 * @since 0.1.0
 * @link https://github.com/WordPress/gutenberg/issues/64173#issuecomment-2551782271
 * @author https://github.com/margarita-boomCodes
 */


// Purge theme cache by making this GET request: /wp-admin/?purge-theme-cache

add_action( 'admin_init', 'withkit_purge_themes_cache' );

function withkit_purge_themes_cache() {
	if ( isset( $_GET['purge-theme-cache'] ) ) {
		$theme = wp_get_theme();
		$theme->delete_pattern_cache();
	}
}
