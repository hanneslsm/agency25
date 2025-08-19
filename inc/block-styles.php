<?php
/**
 * Block Styles Setup
 *
 * Register block-style variations and link them to the handles
 * created in enqueuing.php
 *
 * @package agency25
 * @version 0.1.0
 * @since 0.1.0

 */

add_action( 'init', 'agency25_register_block_style_variations', 10 );
function agency25_register_block_style_variations() {

	$block_styles = [
		'core/button' => [
			[ 'name' => 'ghost', 'label' => __( 'Ghost', 'agency25' ) ],
		]
	];

	foreach ( $block_styles as $block => $styles ) {
		foreach ( $styles as $style ) {
			register_block_style( $block, [
				'name'         => $style['name'],
				'label'        => $style['label'],
				'style_handle' => 'agency25-block-style-' . str_replace( '/', '-', $block ) . '-' . $style['name'],
			] );
		}
	}
}
