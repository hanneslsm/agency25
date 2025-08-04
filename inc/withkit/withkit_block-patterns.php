<?php

/**
 * Patterns Setup
 *
 * @package withkit
 * @version 0.1.0
 * @since 0.1.0

 */


/**
 * Remove core patterns.
 * @link https://developer.wordpress.org/themes/patterns/registering-patterns/#removing-core-patterns
 */
add_action('after_setup_theme', 'withkit_remove_core_patterns');

function withkit_remove_core_patterns()
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

add_action('init', 'withkit_register_pattern_categories', 1);
// add_action( 'after_setup_theme', 'withkit_register_pattern_categories', 5 );

function withkit_register_pattern_categories()
{
	register_block_pattern_category('withkit/layout-a', [
		'label'       => __('With: Layout A', 'withkit'),
		'description' => __('Layouts with wide heading and content', 'withkit'),
	]);
	register_block_pattern_category('withkit/layout-b', [
		'label'       => __('With: Layout B (Two Colums)', 'withkit'),
		'description' => __('Two Column Layouts with heading and content aligned on top', 'withkit'),
	]);
	register_block_pattern_category('withkit/layout-c', [
		'label'       => __('With: Layout C (Two Colums)', 'withkit'),
		'description' => __('Two Column Layouts with heading and content center aligned', 'withkit'),
	]);
	register_block_pattern_category('withkit/components', [
		'label'       => __('With: Components', 'withkit'),
		'description' => __('Single components for specific use.', 'withkit'),
	]);
	register_block_pattern_category('withkit/cards', [
		'label'       => __('With: Cards', 'withkit'),
		'description' => __('Generic card layouts.', 'withkit'),
	]);
	register_block_pattern_category('withkit/faq', [
		'label'       => __('With: FAQ', 'withkit'),
		'description' => __('Layout for the FAQ Section.', 'withkit'),
	]);
	register_block_pattern_category('withkit/heros', [
		'label'       => __('With: Heros', 'withkit'),
		'description' => __('Layouts for the homepage above the fold.', 'withkit'),
	]);
		register_block_pattern_category('withkit/sticky', [
		'label'       => __('With: Sticky', 'withkit'),
		'description' => __('Layouts with sticky parts.', 'withkit'),
	]);
}
