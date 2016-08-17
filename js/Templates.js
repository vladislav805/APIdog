/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Templates = {
	getUser: function(user, options) {
		options = options || {};
		var e = $.e,
			name,
			photo = e("img", {"class": "friends-left", src: getURL(user.photo_100 || user.photo_50 || user.photo)}),
			right = e("div", {"class": "friends-right", append: (name = e(options.fulllink || !options ? "strong" : "a"))}),
			wrap = e(options.fulllink || !options ? "a" : "div", {"class": "friends-item", append: [photo, right]}),
			link = "#" + (user.screen_name || user.id && "id" + user.id || user.uid && "id" + user.uid);

		if (options.fulllink) {
			wrap.href = link;
			name.innerHTML = getName(user);
		} else {
			name.href = link;
			name.innerHTML = "<strong>" + getName(user) + "</strong>";
		};

		if (options.actions) {
			for (var i = 0, l = options.actions.length; i < l; ++i) {
				right.appendChild(e("div", {append: options.actions[i]}));
			};
		};

		return wrap;
	},

	/**
	 * Маленький однострочный элемент списка пользователей
	 * @param  {Object<String, Mixed>} user    Объект пользователя
	 * @param  {Object<String, Mixed>} options Объект с дополнительными опциями
	 * @return {DOMNode}                       Элемент списка
	 */
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
					src: getURL(user.photo_100 || user.photo_50 || user.photo_rec || user.photo)
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