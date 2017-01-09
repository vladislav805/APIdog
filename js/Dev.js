/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Dev = {
	chate: {},
	inited: false,

	init: function() {
		getHead().appendChild($.e("link", {rel: "stylesheet", href: "/includes/dev.css"}));
		Dev.inited = true;
	},

	explain: function(url) {
		url = !url ? "methods" : url;

		if (Dev.chate[url]) {
			return Dev.show(Dev.chate[url]);
		};

		if (!Dev.inited) {
			Dev.init();
		};

		Site.Loader();

		APIdogRequest("apidog.getVKDevPage", {
			p: url
		}, function(data) {
			data = data.response;
			Dev.chate[data.page] = data;
			Dev.show(data);
		})
	},
	adaptive: function(html) {
		return html.replace(/<a([A-Za-z0-9"'_\s-]+)href="\/dev\//img, "<a$1href=\"#dev/");
	},
	show: function(page) {
		var e = $.e,
			w = e("div", {"class": "dev-wrap"});

		w.appendChild(Site.getPageHeader(page.title));
		w.appendChild(e("div", {html: Dev.adaptive(page.html)}));

		Site.append(w);
		Site.setHeader(page.title);
	}
};

var Analyzes = {
	open: function(name, ownerId) {
		includeScripts(["/utilites.js"], function(event) {
			Analyzes.open(name, ownerId);
		});
	}
};