<?php
/**
 * Block Styles Setup
 *
 * Register block-style variations and link them to the handles
 * created in enqueuing.php
 *
 * @package withkit
 * @version 0.1.0
 * @since 0.1.0

 */

add_action( 'init', 'withkit_register_block_style_variations', 10 );
function withkit_register_block_style_variations() {

	$block_styles = [
		'core/button' => [
			[ 'name' => 'ghost', 'label' => __( 'Ghost', 'withkit' ) ],
		],
		'core/details' => [
			[ 'name' => 'chevron', 'label' => __( 'Chevron', 'withkit' ) ],
		],
		'core/gallery' => [
			[ 'name' => 'scale-effect', 'label' => __( 'Scale Effect', 'withkit' ) ],
		],
		'core/cover' => [
			[ 'name' => 'blurred', 'label' => __( 'Blurred', 'withkit' ) ],
			[ 'name' => 'card--interactive',   'label' => __( 'Card (Interactive)',   'withkit' ) ],
		],
		'core/image' => [
			[ 'name' => 'picture-frame', 'label' => __( 'Picture Frame', 'withkit' ) ],
		],
		'core/list' => [
			[ 'name' => 'checkmark',   'label' => __( 'Checkmark',         'withkit' ) ],
			[ 'name' => 'crossmark',   'label' => __( 'Crossmark',         'withkit' ) ],
			[ 'name' => 'crossmark-2', 'label' => __( 'Crossmark 2 Red',   'withkit' ) ],
			[ 'name' => 'checkmark-2', 'label' => __( 'Checkmark 2 Green', 'withkit' ) ],
		],
		'core/paragraph' => [
			[ 'name' => 'indicator', 'label' => __( 'Indicator', 'withkit' ) ],
			[ 'name' => 'overline',  'label' => __( 'Overline',  'withkit' ) ],
			[ 'name' => 'checkmark', 'label' => __( 'Checkmark', 'withkit' ) ],
		],
	];

	foreach ( $block_styles as $block => $styles ) {
		foreach ( $styles as $style ) {
			register_block_style( $block, [
				'name'         => $style['name'],
				'label'        => $style['label'],
				'style_handle' => 'withkit-block-style-' . str_replace( '/', '-', $block ) . '-' . $style['name'],
			] );
		}
	}
}
