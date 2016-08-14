/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Templates = {
	getUser: function (user, options) {
		options = options || {};
		var wrap = document.createElement(options.fulllink ? "a" : "div"),
			photo = document.createElement("img"),
			right = document.createElement("div"),
			name = document.createElement(options.fulllink ? "strong" : "a");
		photo.src = getURL(user.photo_rec || user.photo_50 || user.photo);
		wrap .className = "friends-item";
		photo.className = "friends-left";
		right.className = "friends-right";
		var link = "#" + (user.screen_name || user.id && "id" + user.id || user.uid && "id" + user.uid);
		if (options.fulllink) {
			wrap.href = link;
			name.innerHTML = Site.Escape(user.name || user.first_name + " " + user.last_name) + Site.isOnline(user);
		} else {
			name.href = link;
			name.innerHTML = "<strong>" + Site.Escape(user.name || user.first_name + " " + user.last_name) + Site.isOnline(user) + "</strong>";
		}
		right.appendChild(name);
		if (options.actions)
			for (var i = 0, l = options.actions.length; i < l; ++i)
				if (options.actions[i])
					right.appendChild($.elements.create("div", {append: [options.actions[i]]}));
		if (options.close)
			wrap.appendChild($.elements.create("div", {"class": "feed-close", onclick: options.close}));
		wrap.appendChild(photo);
		wrap.appendChild(right);
		return wrap;
	},

	getMiniUser: function(user, options) {
		options = options || {};
		var e = $.e,
			a = options.action,
			link = "#" + (user.screen_name || "id" + (user.id || user.uid));

		return e(!a ? "a" : "div", {
			"class": "miniprofiles-item",
			href: link,
			append: [
				a ? a.node
					? a.node
					: e(a.link ? "a" : "span", {"class": "a", html: a.action, href: a.link, onclick: a.click})
				  : null,
				e(a ? "a" : "div", { append: e("img", {
					"class": "miniprofiles-left",
					src: getURL(user.photo_50 || user.photo_rec || user.photo)
				}) }),
				e(a ? "a" : "div", {
					"class": "miniprofiles-right",
					append: e(!a ? "div" : "a", {
						href: link,
						html: getName(user)
					})
				})
			]
		});
	},

	// added 09.01.2016
	getListItemUserRow: function(u, e) {
		e = $.e;
		return e("a", {
			"class": "listItem",
			href: "#" + (u.screen_name || (u.name ? "club" + u.id : "id" + u.id)),
			append: [
				e("img", {"class": "listItem-left", src: getURL(u.photo_100 || u.photo_50)}),
				e("div", {"class": "listItem-right", html: getName(u)})
			]
		});
	}
};