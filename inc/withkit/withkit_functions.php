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
require get_template_directory() . '/withkit_enqueuing.php';


/**
 * Remove default WordPress features
 */

// Remove WooCommerce patterns
require get_template_directory() . '/withkit_remove-woo-patterns.php';

// Remove emojis
require get_template_directory() . '/withkit_remove-emojis.php';


/**
 * Register WithKit block patterns, variations, and styles
 */

// Block  Patterns
require get_template_directory() . '/withkit_block-patterns.php';

// Block  Variations
require get_template_directory() . '/withkit_block-variations.php';

// Block Style Variations
require get_template_directory() . '/withkit_block-styles.php';



/**
 * Plugins
 */

// Dashboard Widget
require get_template_directory() . '/inc/dashboard-widget.php';

// Utilities
require get_template_directory() . '/inc/withkit-utils.php';


/**
 * Development tools
 */

// Remove default CSS variables
// require get_template_directory() . '/inc/dev-remove-defaults.php';

// Purge theme cache
require get_template_directory() . '/inc/dev-purge-themes-cache.php';
