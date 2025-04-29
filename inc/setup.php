<?php

/**
 * Setup
 *
 * @package agency25
 * @since 0.1.0
 * @link https://developer.wordpress.org/themes/block-themes/block-theme-setup/
 */



if (!function_exists('agency25_setup')) :
	function agency25_setup()
	{
		// Make theme available for translation.
		load_theme_textdomain('agency25', get_template_directory() . '/languages');

		// Enqueue editor styles.
		add_editor_style('assets/css/editor-style.css');
	}
endif; // agency25_setup
add_action('after_setup_theme', 'agency25_setup');
