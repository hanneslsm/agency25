<?php
/**
 * Block Variations Setup
 *
 * @package withkit
 * @version 0.1.0
 * @since 0.1.0
 * @link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/
 */


function withkit_block_variation( $variations, $block_type ) {
    // Only target the core/spacer block.
    if ( 'core/spacer' !== $block_type->name ) {
        return $variations;
    }

    // Overwrite the default variation and use a spacing preset instead.
    $variations[] = array(
        'isDefault'  => true,
        'attributes' => array(
            'height' => 'var:preset|spacing|40', // Sets default height.
        ),
    );

    return $variations;
}
add_filter( 'get_block_type_variations', 'withkit_block_variation', 10, 2 );
