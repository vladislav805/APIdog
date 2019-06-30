var Templates = {
	getUser: function(user, options) {
		options = options || {};
		var e = $.e,
			name,
			photo = e("img", {
				"class": "friends-left",
				src: getURL(user.photo_100 || user.photo_50 || user.photo)
			}),
			right = e("div", {
				"class": "friends-right",
				append: (name = e(options.fulllink || !options ? "strong" : "a"))
			}),
			wrap = e(options.fulllink || !options ? "a" : "div", {
				"class": "friends-item",
				append: (
					options.actions
						? options.actionsRight
						? options.actions.concat([photo, right])
						: [photo, $.elements.append(right, options.actions)]
						: [photo, right]
				)
			}),
			link = "#" + (user.screen_name || user.id && "id" + user.id || user.uid && "id" + user.uid);

		if (options.fulllink) {
			wrap.href = link;
			name.innerHTML = getName(user);
		} else {
			name.href = link;
			name.innerHTML = "<strong>" + getName(user) + "</strong>";
		}

		return wrap;
	},

	/**
	 * Маленький однострочный элемент списка пользователей
	 * @param  {object} user    Объект пользователя
	 * @param  {object=} options Объект с дополнительными опциями
	 * @return {HTMLElement}                       Элемент списка
	 */
	getMiniUser: function(user, options) {
		options = options || {};
		var e = $.e,
			a = options.action,
			isFull = !a || options.full,
			link = "#" + (user.screen_name || "id" + user.id);
console.log(user);
		return e(isFull ? "a" : "div", {
			"class": "miniProfile-item",
			href: link,
			append: [
				a ? a.node
					? a.node
					: e(a.link ? "a" : "span", {"class": "a", html: a.action, href: a.link, onclick: a.click})
					: null,
				e(!isFull ? "a" : "div", { append: e("img", {
					"class": "miniProfile-left",
					src: getURL(user.photo_100 || user.photo_50)
				}) }),
				e(!isFull ? "a" : "div", {
					"class": "miniProfile-right",
					append: e(!a ? "div" : "a", {
						href: link,
						html: getName(user)
					})
				})
			]
		});
	},

	/**
	 *
	 * @param {User|{id: int, name: string, photo_50: string=}} u
	 * @param {{simpleBlock: boolean=, onClick: function=}} options
	 * @returns {HTMLElement|Node}
	 */
	getListItemUserRow: function(u, options) {
		options = options || {};
		var e = $.e;
		return e(options.simpleBlock ? "div" : "a", {
			"class": "listItem a",
			href: options.simpleBlock ? "" : "#" + (u.screen_name || (u.name ? "club" + u.id : "id" + u.id)),
			onclick: options.simpleBlock && options.onClick ? options.onClick : null,
			append: [
				e("img", {"class": "listItem-left", src: getURL(u.photo_100 || u.photo_50)}),
				e("div", {"class": "listItem-right", html: getName(u)})
			]
		});
	}
};