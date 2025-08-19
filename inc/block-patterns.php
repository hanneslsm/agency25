<?php

/**
 * Patterns Setup
 *
 * @package agency25
 * @version 0.1.0
 * @since 0.1.0
 */

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
