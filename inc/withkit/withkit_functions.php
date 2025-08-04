<?php

/**
 * WithKit functions and definitions
 *
 * @package withkit
 * @version 0.1.0
 * @since 0.1.0
 */

/**
 * Setup
 */

// Enqueue files
require get_template_directory() . '/inc/withkit/withkit_enqueuing.php';


/**
 * Remove default WordPress features
 */

// Remove WooCommerce patterns
require get_template_directory() . '/inc/withkit/withkit_remove-woo-patterns.php';

// Remove emojis
require get_template_directory() . '/inc/withkit/withkit_remove-emojis.php';


// Remove default CSS variables ! DEV TOOL ONLY !
// require get_template_directory() . '/inc/withkit/withkit_remove-default-css-variables.php';

/**
 * Register WithKit block patterns, variations, and styles
 */

// Block  Patterns
require get_template_directory() . '/inc/withkit/withkit_block-patterns.php';

// Block  Variations
require get_template_directory() . '/inc/withkit/withkit_block-variations.php';

// Block Style Variations
require get_template_directory() . '/inc/withkit/withkit_block-styles.php';



/**
 * Plugins
 */

// Dashboard Widget
require get_template_directory() . '/inc/withkit/withkit_plugin-dashboard-widget.php';

// Utility Classes
require get_template_directory() . '/inc/withkit/withkit_plugin-utils.php';

// Purge theme cache
require get_template_directory() . '/inc/withkit/withkit_plugin-purge-themes-cache.php';
