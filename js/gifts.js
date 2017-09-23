var Gifts = {

	RequestPage: function () {
		var act = Site.get("act"),
			userId = Site.get("userId"),
			toId = Site.get("toId"),
			giftId = Site.get("giftId");

		Site.Loader();
		switch (act) {

			case "send":
				Gifts.requestSend(toId, giftId);

				break;
			default:
				api("execute", {
					code: "var g=API.gifts.get({user_id:parseInt(Args.u),count:40,offset:parseInt(Args.o)});return{g:g,u:API.users.get({user_ids:g.items@.from_id,fields:Args.f})};",
					o: getOffset(),
					u: userId || API.userId,
					f: "first_name_gen,last_name_gen,sex,online,photo_50,screen_name",
					v: 5.56
				}).then(function(result) {
					Local.add(result.u);
					return result.g;
				}).then(Gifts.showList).catch(Gift.showError);
				break;
		}
	},
	catalog: null,
	items: null,

	showError: function(e) {
		console.error(e);
		// TODO: show error (was label, but lost :( )
	},

	/**
	 * Request catalog and show form for select gift and send
	 * @param {int} toId
	 * @param {int} giftId
	 */
	requestSend: function(toId, giftId) {
		if (!toId) {
			window.location.hash = "#gifts";
			return;
		}
		//noinspection SpellCheckingInspection
		api("gifts.getCatalog", {
			user_id: toId,
			no_inapp: 0,
			force_payment: 1,
			v: 5.27
		}).then(function(data) {
			Gifts.catalog = [];
			Gifts.items = {};
			for (var i in data) {
				if (!data.hasOwnProperty(i)) {
					continue;
				}

				data[i].items.forEach(function(item) {
					item = new Gift(item);
					Gifts.items[item.giftId] = item;
				});

				Gifts.catalog.push(new GiftCategory(data[i]));
			}

			return giftId
				? Gifts.showSendForm(toId, giftId)
				: Gifts.showCatalog(toId);
		}).catch(function(e) {
			console.error(e);
			Site.append(Site.getEmptyField(Lang.get("gifts.error")));
		});
	},

	/**
	 * Parse gifts to object
	 * @param {object} items
	 * @returns {Gift[]}
	 */
	parse: function(items) {
		return parse(items, Gift);
	},

	/**
	 * Show list of gifts
	 * @param data
	 */
	showList: function(data) {
		if (!data) {
			Site.append(Site.getEmptyField(Lang.get("gifts.gifts_access_denied")));
			return;
		}

		var gifts,
			count,
			i,
			gift,
			wrap,
			list,
			e = $.e,
			userId = Site.get("userId") || API.userId;

		count = data.count;
		gifts = Gifts.parse(data.items);
		i = 0;

		wrap = e("div");
		list = e("div", {"class": "gifts-list"});

		while (gift = gifts[i++]) {
			list.appendChild(gift.getNodeButton(userId));
		}

		wrap.appendChild(Gifts.getDefaultTabs(userId));
		wrap.appendChild(Site.getPageHeader(
			count + " " + Lang.get("gifts", "gifts_", count),
			$.e("a", {"class": "fr", href: "#gifts?act=send&toId=" + userId, html: Lang.get("gifts.send_gift")})
		));
		wrap.appendChild(list);
		wrap.appendChild(Site.getSmartPagebar(getOffset(), count, 40));
		Site.append(wrap);
		Site.setHeader("Подарки");
	},

	/**
	 * Returns tabs
	 * @param {int} userId
	 * @returns {HTMLElement}
	 */
	getDefaultTabs: function(userId) {
		var tabs = [
			["gifts" + (userId ? "?userId=" + userId : ""), Lang.get("gifts.gifts")],
		], act;

		if (act = Site.get("act")) {
			switch (act) {
				case "send":
					var giftId = Site.get("giftId");
					tabs.push([
						!giftId
							? "gifts?act=send&toId=" + userId
							: "gifts?act=send&toId=" + userId + "&giftId=" + giftId,
						Lang.get("gifts.gifts_send")
					]);
					break;
			}
		}
		return Site.getTabPanel(tabs);
	},

	showCatalog: function(toId) {
		var wrap, list, e = $.e;

		wrap = e("div", {"class": "gifts-wrap"});
		list = e("div", {"class": "gifts-list"});

		Gifts.catalog.forEach(function(item) {
			list.appendChild(item.getExtendedBlock(list));
		});

		wrap.appendChild(Gifts.getDefaultTabs(toId));
		wrap.appendChild(Site.getPageHeader(Lang.get("gifts.send_gift"), null, {className: "gifts-head"}));
		wrap.appendChild(list);
		Site.append(wrap);

		Gifts.onResizeSendCatalog(list.querySelectorAll("a.gifts-item"), $.getPosition(list).width);

		window.onResizeCallback = function() {
			var w = $.getPosition(list).width;
			Gifts.onResizeSendCatalog(list.querySelectorAll("a.gifts-item"), w);
		};
	},

	/**
	 *
	 * @param {NodeList} nodes
	 * @param {int} width
	 */
	onResizeSendCatalog: function(nodes, width) {
		var n = 6;
		if (width < 624)
			n = 5;
		if (width < 520)
			n = 4;
		if (width < 416)
			n = 3;
		if (width < 312)
			n = 2;
		var wfm = width - (4 * 2 * n),
			pfb = wfm / n;
		//noinspection JSUnresolvedFunction
		Array.prototype.forEach.call(nodes, function(node) {
			node.style.width = pfb + "px";
		});
	},


	showSendForm: function(toId, giftId) {
		var wrap, form, gift, e = $.e, user, submit;

		wrap = e("div");
		form = e("form", {"class": "sf-wrap", onsubmit: function (event) {
			var message, privacy;

			message = this.message && this.message.value.trim();
			privacy = this.privacy && +this.privacy.checked;
			Gifts.send({
				toId: toId,
				giftId: giftId,
				message: message,
				privacy: privacy
			}, submit);
			event.preventDefault();
			return false;
		}});

		api("users.get", {user_ids: toId, fields: "photo_50,online,screen_name", v: 5.27}).then(function(data) {
			Local.add(data);
			var u = data[0];
			user.innerHTML = getName(u);
			user.href = "#" + u.screen_name;
		});

		gift = Gifts.items[giftId];

		form.appendChild(gift.getPreview());
		form.appendChild(e("div", {"class": "tip", html: Lang.get("gifts.send_getter")}));
		form.appendChild(user = e("a", {id: "giftGetter" + toId, html: "loading...", href: "#id" + toId}));
		form.appendChild(e("textarea", {"class": "gifts-message", name: "message"}));
		form.appendChild(e("label", {"class": "", append: [
			e("input", {type: "checkbox", name: "privacy", value: 1}),
			e("span", {"class": "tip", html: " " + Lang.get("gifts.send_privacy")})
		]}));
		form.appendChild(submit = e("input", {type: "submit", value: Lang.get("gifts.send_send")}));

		wrap.appendChild(Gifts.getDefaultTabs(toId));
		wrap.appendChild(Site.getPageHeader(Lang.get("gifts.send_gift"), null, {className: "gifts-head"}));
		wrap.appendChild(form);

		Site.append(wrap);
		Site.setHeader(Lang.get("gifts.send_gift"), {link: "#gifts?act=send&toId=" + toId});
	},

	send: function (params, submitter) {
		submitter.disabled = true;
		submitter.value = Lang.get("gifts.send_sending");
		//noinspection SpellCheckingInspection
		var paramsRequest = {
			user_ids: params.toId,
			gift_id: params.giftId,
			message: params.message,
			privacy: params.privacy,
			v: 5.27,
			guid: parseInt(Math.random() * 10000000),
			force_payment: 1,
			no_inapp: 0
		}, fx = function (data) {

			if (!data.success) {
				return alert("Ошибка..\n\n" + JSON.stringify(data));
			}

			// TODO: balance
/*			if (API.balance && API.balance.votes) {
				API.balance.votes -= data.withdrawn_votes;
			}
*/
			submitter.value = Lang.get("gifts.send_sent");
			setTimeout(function () {
				window.location.hash = "#gifts?userId=" + params.toId;
			}, 1000);
		};

		api("gifts.send", paramsRequest).then(fx).catch(function(error) {
			if (data.error.error_code === 24 && data.error.confirmation_text) {
				VKConfirm(error.confirmation_text, function() {
					paramsRequest.confirm = 1;
					api("gifts.send", paramsRequest).then(fx);
				});
			}
		})
	},

	getAttachment: function(gift) {
		var e = $.e;
		gift = new Gift({gift: gift});
		return e("a", {"class": "attachments-gift", href: "#gifts", append: [
			gift.getPreview(),
			e("div", {html: Lang.get("gifts.gift")})
		]});
	}
};

/**
 *
 * @param {{id, from_id, date, gift_hash, message, privacy, gift: {thumb_48, thumb_96, thumb_256, stickers_product_id}, gifts_left, payment_type, price, price_str, real_price,real_price_str, description, disabled }} g
 * @constructor
 */
function Gift(g) {
	var s = this;

	s.id = g.id;
	s.fromId = g.from_id;
	s.date = g.date;
	s.hash = g.gift_hash;
	s.message = g.message;
	s.privacy = g.privacy;
	s.giftId = g.gift.id;
	s.giftPhoto = {
		small: g.gift.thumb_48,
		medium: g.gift.thumb_96,
		big: g.gift.thumb_256
	};
	s.left = g.gifts_left;
	//noinspection SpellCheckingInspection
	s.sender = Local.data[s.fromId] || {
		first_name: "Неизвестный",
		last_name: "пользователь",
		photo_50: "//vk.com/images/dquestion_c.gif",
		online: false
	};
	s.stickersId = -g.gift.stickers_product_id;

	s.payment = {
		type: g.payment_type,
		price: g.price,
		priceString: g.price_str,
		priceReal: g.real_price,
		priceRealString: g.real_price_str
	};
	s.description = g.description;
	s.disabled = g.disabled;
}
function GiftCategory (c) {
	var s = this;
	s.title = c.title;
	s.name = c.name;
	s.items = c.items && c.items[0] && c.items[0].giftId !== undefined ? items : Gifts.parse(c.items);
}
Gift.prototype.getNodeButton = function (toId) {
	var e = $.e, ctx = this;

	return e("div", {"class": "gift-item", id: "gift" + this.id, append: [
		e("div", {id: "gift" + this.id + "-content", append: [
			e(this.fromId ? "a" : "div", {"class": "a gift-photo", append: e("img", {src: getURL(this.sender.photo_50)})}),
			e("div", {"class": "gift-right", append: [
				e("div", {"class": "gift-sender", append: [
					e(this.fromId ? "a" : "div", {"class": "a gift-sender", href: "#" + this.sender.screen_name, html: this.sender.first_name + " " + this.sender.last_name + Site.isOnline(this.sender)}),
					this.getType()
				]}),
				e("div", {"class": "tip", html: $.getDate(this.date)}),
				this.getPreview(),
				this.hash && toId === API.userId ? e("div", {"class": "gift-footer", append: [
					e("a", {href: "#gifts?act=send&toId=" + this.fromId, html: Lang.get("gifts.gift_action_reply")}),
					e("div", {"class": "a", html: Lang.get("gifts.gift_action_delete"), onclick: function() {
						ctx["delete"]();
					}})
				]}) : null
			]})
		]}),
		e("div", {id: "gift" + this.id + "-deleted", "class": "hidden", append: e("div", {"class": "gift-deleted", append: [
			e("span", {html: Lang.get("gifts.deleted")}),
			e("span", {"class": "a", html: Lang.get("gifts.restore"), onclick: function() {
				ctx.restore();
			}})
		]})})
	]});
};
Gift.prototype["delete"] = function () {
	var giftId = this.id;
	api("gifts.delete", {
		id: giftId,
		gift_hash: this.hash
	}).then(function() {
		$.elements.addClass($.element("gift" + giftId + "-content"), "hidden");
		$.elements.removeClass($.element("gift" + giftId + "-deleted"), "hidden");
	});
};
Gift.prototype.restore = function () {
	var giftId = this.id;
	api("gifts.restore", {
		id: this.id,
		gift_hash: this.hash
	}).then(function() {
		$.elements.removeClass($.element("gift" + giftId + "-content"), "hidden");
		$.elements.addClass($.element("gift" + giftId + "-deleted"), "hidden");
	});
};
Gift.prototype.getType = function () {
	return $.e("span", {"class": "tip", html: Lang.get("gifts.gift_type_" + ["normal", "only_getter", "only_sender"][this.privacy || 0])});
};
Gift.prototype.getPreviewImage = function (isEvent) {
	return $.e(!isEvent || this.disabled ? "div" : "a", {
		"class": "gifts-item" + (this.disabled ? " gifts-disabled" : ""),
		href: "#gifts?act=send&toId=" + Site.get("toId") + "&giftId=" + this.giftId,
		append: [
			$.e("img", {
				"class": "gift-image",
				src: getURL(this.giftPhoto.medium)
			}),
			$.e("div", {
				"class": "gifts-price-wrap",
				append: $.e("div", {"class": "gifts-price", html: this.payment.priceString + (this.left ? " (" + this.left + ")" : "") || this.disabled && "Куплено"})
			})
		]
	});
};
Gift.prototype.getPreview = function () {
	return $.e("div", {"class": "gift-preview", append: [
		$.e("img", {"class": "gift-image", src: getURL(this.giftPhoto.big)}),
		this.message ? $.e("div", {"class": "gift-message", html: Site.toHTML(this.message)}) : null
	]});
};
GiftCategory.prototype.getExtendedBlock = function () {
	var e = $.e, wrap, header, preview, items, l = this.items, triggerFunction = function() {
		$.elements.toggleClass(wrap, "gifts-category-opened");
	};

	wrap = e("div", {"class": "gifts-category-item", id: "gifts-category-" + this.name});
	header = e("div", {"class": "gifts-category-title", html: this.title, onclick: triggerFunction});
	preview = e("div", {"class": "gifts-category-preview", append: (function(a, b, c, d, e) {
		while (b < c && (e = a[b++])) {
			d.push(e.getPreviewImage(false));
		}
		return d;
	})(l, 0, 6, [], null), onclick: triggerFunction});
	items = e("div",  {"class": "gifts-category-items", append: (function(a, b, c, d) {
		while (c = a[b++])
			d.push(c.getPreviewImage(true));
		return d;
	})(l, 0, null, [])});

	wrap.appendChild(header);
	wrap.appendChild(preview);
	wrap.appendChild(items);

	return wrap;
};
