/* Hide .html extensions site-wide
	 - Convert all anchors linking to *.html to extensionless paths
	 - Intercept navigation to extensionless paths and load corresponding .html
		 so URLs remain without the extension while content is fetched from *.html files.
*/
(function(){
	'use strict';

	// Normalize anchors on the page (and on future mutations)
	function stripHtmlExtensionInAnchors(root){
		var anchors = (root||document).querySelectorAll('a[href$=".html"]');
		anchors.forEach(function(a){
			try{
				var u = new URL(a.href, location.href);
				// only process same-origin links
				if(u.origin !== location.origin) return;
				// remove .html extension but keep query/hash
				u.pathname = u.pathname.replace(/\.html$/,'');
				a.setAttribute('data-href-with-ext', a.getAttribute('href'));
				a.href = u.pathname + u.search + u.hash;
			}catch(e){}
		});
	}

	// Try to fetch path + .html; if found, replace document content while keeping URL extensionless
	function loadHtmlForPath(path){
		var tryUrl = path.replace(/\/$/,'') + '.html';
		return fetch(tryUrl, {method:'GET', credentials:'same-origin'})
			.then(function(res){
				if(!res.ok) throw new Error('not-found');
				return res.text();
			});
	}

	// When user navigates (click on anchor or back/forward), handle extensionless paths
	function handleNavigation(toPath){
		return loadHtmlForPath(toPath).then(function(html){
			// Replace document with fetched HTML while keeping extensionless URL
			document.open();
			document.write(html);
			document.close();
			// Re-run normalization on new content
			stripHtmlExtensionInAnchors(document);
		}).catch(function(){
			// nothing: let the browser handle (may be 404)
		});
	}

	// Intercept clicks on links to handle extensionless navigation client-side
	document.addEventListener('click', function(e){
		var a = e.target.closest('a');
		if(!a) return;
		try{
			var u = new URL(a.href, location.href);
			if(u.origin !== location.origin) return; // external
			// If the link's pathname does NOT end with an extension but a corresponding .html exists, load it
			if(!/\.[a-z0-9]+$/i.test(u.pathname)){
				e.preventDefault();
				history.pushState({}, '', u.pathname + u.search + u.hash);
				handleNavigation(u.pathname + u.search + u.hash);
			}
		}catch(e){}
	}, true);

	// Handle back/forward
	window.addEventListener('popstate', function(){
		handleNavigation(location.pathname + location.search + location.hash);
	});

	// Initial run
	stripHtmlExtensionInAnchors(document);

	// Observe DOM for dynamically added anchors
	var mo = new MutationObserver(function(muts){
		muts.forEach(function(m){ if(m.addedNodes.length) stripHtmlExtensionInAnchors(m.target); });
	});
	mo.observe(document.documentElement || document.body, {childList:true, subtree:true});

})();

