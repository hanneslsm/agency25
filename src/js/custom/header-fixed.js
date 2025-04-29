///
/// Header fixed
///


/**
 * Hide header on scroll, except while a “core/navigation” block is open.
 *
 * Relies on the classes WordPress adds when the responsive menu is active:
 *   – .wp-block-navigation.is-menu-open   (WP ≥ 6.5)
 *   – .wp-block-navigation__responsive-container-open (WP ≤ 6.4)
 * Adjust the selector if your theme uses a different class or adds one to <body>.
 */

document.addEventListener( 'DOMContentLoaded', () => {
	const header        = document.querySelector( '.is-style-header-fixed header' );
	if ( ! header ) {
		return;
	}

	let lastScroll      = 0;
	const headerHeight  = header.offsetHeight;

	const navSelector   = '.wp-block-navigation.is-menu-open, .wp-block-navigation__responsive-container-open';

	const navIsOpen = () => document.querySelector( navSelector ) !== null;

	window.addEventListener( 'scroll', () => {
		const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

		if ( navIsOpen() ) {
			// Keep the header in place and reset lastScroll to avoid a jump
			header.style.transform = 'translateY(0)';
			lastScroll = currentScroll;
			return;
		}

		if ( currentScroll > lastScroll && currentScroll > headerHeight ) {
			header.style.transform = 'translateY(-100%)';
		} else {
			header.style.transform = 'translateY(0)';
		}

		lastScroll = currentScroll;
	} );
} );
