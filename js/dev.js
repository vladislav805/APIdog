var Dev = {

	cache: {},

	isInitialized: false,

	/**
	 * Include styles and scripts
	 */
	init: function() {
		getHead().appendChild($.e("link", {rel: "stylesheet", href: "css/external/vk-dev.css"}));
		getHead().appendChild($.e("script", {src: "css/external/vk-dev.js"}));
		Dev.isInitialized = true;
	},

	/**
	 * Route
	 * @param {string} url
	 */
	explain: function(url) {
		url = !url ? "methods" : url;

		if (Dev.cache[url]) {
			Dev.show(Dev.cache[url]);
			return;
		}

		if (!Dev.isInitialized) {
			Dev.init();
		}

		Site.Loader();

		APIdogRequest("vk.fetchDocumentation", {
			p: url
		}).then(function(data) {
			Dev.cache[data.page] = data;
			Dev.show(data);
		}).catch(function(error) {
			alert("Oops..\n\n" + JSON.stringify(error));
		});
	},

	/**
	 * Replace all links to VK in page content
	 * @param {string} html
	 * @returns {string}
	 */
	adaptive: function(html) {
		return html.replace(/<a([A-Za-z0-9"'_\s-]+)href="(https?:\/\/vk\.com)?\/dev\//img, "<a$1href=\"#dev/");
	},

	/**
	 * Show page
	 * @param {{title: string, html: string}} page
	 */
	show: function(page) {
		var e = $.e,
			w = e("div", {"class": "dev-wrap"});

		w.appendChild(Site.getPageHeader(page.title));
		w.appendChild(e("div", {html: Dev.adaptive(page.html)}));

		Site.append(w);
		Site.setHeader(page.title);
	}

};