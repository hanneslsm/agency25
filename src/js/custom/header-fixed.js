///
/// Header fixed
///


document.addEventListener( 'DOMContentLoaded', () => {
	const header       = document.querySelector( '.is-style-header-fixed header' );
	if ( ! header ) {
		return;
	}

	const headerHeight = header.offsetHeight;
	let lastScroll     = 0;

	/**
	 * Is a core/navigation block currently open?
	 *
	 * WordPress adds the class `is-menu-open` (and `has-modal-open`)
	 * to the responsive container when the hamburger toggle is active.
	 */
	const isNavOpen = () =>
		Boolean(
			document.querySelector(
				'.wp-block-navigation__responsive-container.is-menu-open,' +
					'.wp-block-navigation.is-menu-open'
			)
		);

	window.addEventListener( 'scroll', () => {
		const currentScroll =
			window.pageYOffset || document.documentElement.scrollTop;

		if ( isNavOpen() ) {
			// Keep the header visible while the menu is open.
			header.style.transform = 'translateY(0)';
		} else if ( currentScroll > lastScroll && currentScroll > headerHeight ) {
			header.style.transform = 'translateY(-100%)';
		} else {
			header.style.transform = 'translateY(0)';
		}

		lastScroll = currentScroll;
	} );
} );
