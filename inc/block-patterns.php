<?php

/**
 * Patterns Setup
 *
 * @package agency25
 * @since 0.7
 */


/**
 * Remove core patterns.
 * @link https://developer.wordpress.org/themes/patterns/registering-patterns/#removing-core-patterns
 */
add_action('after_setup_theme', 'agency25_remove_core_patterns');

function agency25_remove_core_patterns()
{
    remove_theme_support('core-block-patterns');
}

/**
 * Disable remote patterns
 * @link https://developer.wordpress.org/themes/patterns/registering-patterns/#disabling-remote-patterns
 */
add_filter('should_load_remote_block_patterns', '__return_false');


/**
 * Register custom pattern categories
 * @link https://developer.wordpress.org/themes/patterns/registering-patterns/#registering-a-pattern-category
 */

 function agency25_register_pattern_categories() {
    register_block_pattern_category(
        'Hero',
        array(
            'label'       => __( 'Hero', 'agency25' ),
            'description' => __( 'Large eye-catching sections for above-the-fold content.', 'agency25' ),
        )
    );
}
add_action( 'init', 'agency25_register_pattern_categories' );

