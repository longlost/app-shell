
// Defer non essential polyfills til after load.
window.addEventListener('load', async () => {

	// Remove when Safari and Edge support web animations api.
	// It's in Safari experimental features as of iOS 13.3 but its defaulted to be off.
	// Should come with Edge Chromium, set to release Jan 15th 2020.

	// NOTE: Some polymer elements depend on web-animations-next so be careful when removing.
	await import(
		/* webpackChunkName: 'web-animations' */ 
		'web-animations-js/web-animations-next.min.js'
	);

	// Scroll options polyfill for Safari, supports {behavior: 'smooth'}
	// for all scroll functions (ie. window.scrollTo, element.scrollIntoVeiw).
	if (!('scrollBehavior' in document.documentElement.style)) {
	  import(
	  	/* webpackChunkName: 'scroll-polyfill' */ 
	  	'scroll-behavior-polyfill'
	  );
	}
	
});
