/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Gifts = {
	RequestPage: function() {
		var act = getAct(),
			userId = Site.get("userId"),
			toId = Site.get("toId"),
			giftId = Site.get("giftId");
		Site.Loader();
		switch (act) {
			case "send":
				if (!toId) {
					window.location.hash = "#gifts";
					return;
				}
				Site.APIv5("gifts.getCatalog", {
					user_id: toId,
					no_inapp: 0,
					force_payment: 1,
					v: 5.27
				}, function(data) {
					if (!(data = Site.isResponse(data)))
						return Site.Append(getEmptyField(Lang.get("gifts.error")));
					var i, j, items, item;
					Gifts.catalog = [];
					Gifts.items = {};
					for (i in data) {
						items = data[i].items;
						for (j in items) {
							item = new Gift(items[j]);
							Gifts.items[item.giftId] = item;
						}
						Gifts.catalog.push(new GiftCategory(data[i]));
					}
					if (giftId) {
						return Gifts.showSendForm(toId, giftId);
					} else {
						return Gifts.showCatalog(toId);
					};
				});

				break;
			default:
				Site.API("execute", {
					code: "var g=API.gifts.get({user_id:%u%,count:40,offset:%o%,v:5.27});return{gifts:g,users:API.users.get({user_ids:g.items@.from_id,fields:\"first_name_gen,last_name_gen,sex,online,photo_50,screen_name\"})};"
						.replace(/%o%/img, getOffset())
						.replace(/%u%/img, userId || API.userId)
				}, Gifts.showList);
				break;
		}
	},
	catalog: null,
	items: null,
	parse: function(items) {
		for (var i in items) {
			items[i] = new Gift(items[i]);
		}
		return items;
	},
	showList: function(data) {
		data = Site.isResponse(data);

		if (!data.gifts) {
			Site.append(getEmptyField(Lang.get("gifts.gifts_access_denied")));
			return;
		};

		var gifts, count, i, l, gift, wrap, list, e = $.e, userId = Site.get("userId") || API.userId;
		Local.add(data.users);
		count = data.gifts.count;
		gifts = Gifts.parse(data.gifts.items);
		i = 0;

		wrap = e("div");
		list = e("div", {"class": "gifts-list"});

		while (gift = gifts[i++]) {
			list.appendChild(gift.getNode(userId));
		};

		wrap.appendChild(Gifts.getDefaultTabs(userId));
		wrap.appendChild(Site.getPageHeader(
			count + " " + Lang.get("gifts", "gifts_", count),
			$.e("a", {"class": "fr", href: "#gifts?act=send&toId=" + userId, html: Lang.get("gifts.send_gift")}),
			{
				className: "gifts-head"
			}
		));
		wrap.appendChild(list);
		wrap.appendChild(Site.PagebarV2(getOffset(), count, 40));
		Site.Append(wrap);
	},
	getDefaultTabs: function(userId) {
		var tabs = [
			["gifts" + (userId ? "?userId=" + userId : ""), Lang.get("gifts.gifts")],
		];
		if (getAct())
			switch (getAct()) {
				case "send":
					tabs.push([!Site.get("giftId") ? "gifts?act=send&toId=" + userId : "gifts?act=send&toId=" + userId + "&giftId=" + Site.get("giftId") , Lang.get("gifts.gifts_send")]);
					break;
			}
		return Site.CreateTabPanel(tabs);
	},
	showCatalog: function(toId, categoryId) {
		var wrap, list, item, e = $.e;

		wrap = e("div", {"class": "gifts-wrap"});
		list = e("div", {"class": "gifts-list"});

		for (item in Gifts.catalog) {
			item = Gifts.catalog[item];
			list.appendChild(item.getExtendedBlock(list));
		}

		wrap.appendChild(Gifts.getDefaultTabs(toId));
		wrap.appendChild(Site.getPageHeader(Lang.get("gifts.send_gift"), null, {className: "gifts-head"}));
		wrap.appendChild(list);
		Site.Append(wrap);
		Gifts.onResizeSendCatalog(list.querySelectorAll("a.gifts-item"), $.getPosition(list).width);
		window.onResizeCallback = function(event) {
			var w = $.getPosition(list).width;
			Gifts.onResizeSendCatalog(list.querySelectorAll("a.gifts-item"), w);
		};
	},
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
			pfb = wfm / n,
			i;
		for (i in nodes)
			nodes[i].style.width = pfb + "px";
	},
	showSendForm: function(toId, giftId) {
		var wrap, form, gift, e = $.e, user;

		wrap = e("div");
		form = e("form", {"class": "sf-wrap", onsubmit: function(event) {
			var message, privacy;

			message = this.message && $.trim(this.message.value);
			privacy = this.privacy && +this.privacy.checked;
			Gifts.send({
				toId: toId,
				giftId: giftId,
				message: message,
				privacy: privacy
			}, this.sbm);
			event.preventDefault();
			return false;
		}});

		Site.APIv5("users.get", {user_ids: toId, fields: "photo_50,online,screen_name", v: 5.27}, function(data) {
			data = Site.isResponse(data);
			Local.add(data);
			var u = data[0];
			user.innerHTML = u.first_name + " " + u.last_name + Site.isOnline(u);
			user.href = "#" + u.screen_name;
		})

		gift = Gifts.items[Site.get("giftId")];

		form.appendChild(gift.getPreview());
		form.appendChild(e("div", {"class": "tip", html: Lang.get("gifts.send_getter")}));
		form.appendChild(user = e("a", {id: "giftGetter" + toId, html: "loading...", href: "#id" + toId}));
		form.appendChild(e("textarea", {"class": "gifts-message", name: "message"}));
		form.appendChild(e("label", {"class": "", append: [
			e("input", {type: "checkbox", name: "privacy", value: 1}),
			e("span", {"class": "tip", html: " " + Lang.get("gifts.send_privacy")})
		]}));
		form.appendChild(e("input", {type: "submit", value: Lang.get("gifts.send_send"), name: "sbm"}));

		wrap.appendChild(Gifts.getDefaultTabs(toId));
		wrap.appendChild(Site.getPageHeader(Lang.get("gifts.send_gift"), null, {className: "gifts-head"}));
		wrap.appendChild(form);

		Site.Append(wrap);
		Site.SetHeader(Lang.get("gifts.send_gift"), {link: "#gifts?act=send&toId=" + toId});
	},
	send: function(params, submitter) {
		submitter.disabled = true;
		submitter.value = Lang.get("gifts.send_sending");
		var api = {
			user_ids: params.toId,
			gift_id: params.giftId,
			message: params.message,
			privacy: params.privacy,
			v: 5.27,
			guid: parseInt(Math.random() * 10000000),
			force_payment: 1,
			no_inapp: 0
		}, fx = function(data) {
			if (data.error && data.error.error_code == 24 && data.error.confirmation_text) {
				VKConfirm(data.error.confirmation_text, function() {
					api.confirm = 1;
					Site.APIv5("gifts.send", api, fx);
				});
				return;
			};
			data = Site.isResponse(data);
			if (!data.success)
				return alert("Ошибка..\n\n" + JSON.stringify(data));

			if (API.balance && API.balance.votes)
				API.balance.votes -= data.withdrawn_votes;

			submitter.value = Lang.get("gifts.send_sent");
			setTimeout(function() {
				window.location.hash = "#gifts?userId=" + params.toId;
			}, 1000);
		};

		Site.API("gifts.send", api, fx)
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

function Gift (g) {
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
	s.sender = Local.Users[s.fromId] || {
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
};
function GiftCategory (c) {
	var s = this;
	s.title = c.title;
	s.name = c.name;
	s.items = c.items && c.items[0] && c.items[0].giftId != undefined ? items : Gifts.parse(c.items);
};
Gift.prototype.getNode = function(toId) {
	var e = $.e, ctx = this;

	return e("div", {"class": "gift-item", id: "gift" + this.id, append: [
		e("div", {id: "gift" + this.id + "-content", append: [
			e(this.fromId ? "a" : "div", {"class": "a gift-photo", append: e("img", {src: getURL(this.sender.photo_50)})}),
			e("div", {"class": "gift-right", append: [
				e("div", {"class": "gift-sender", append: [
					e(this.fromId ? "a" : "div", {"class": "a gift-sender", href: "#" + this.sender.screen_name, html: getName(this.sender)}),
					this.getType()
				]}),
				e("div", {"class": "tip", html: $.getDate(this.date)}),
				this.getPreview(),
				this.hash && toId == API.userId ? e("div", {"class": "gift-footer", append: [
					e("a", {href: "#gifts?act=send&toId=" + this.fromId, html: Lang.get("gifts.gift_action_reply")}),
					e("div", {"class": "a", html: Lang.get("gifts.gift_action_delete"), onclick: function(event) {
						ctx["delete"]();
					}})
				]}) : null
			]})
		]}),
		e("div", {id: "gift" + this.id + "-deleted", "class": "hidden", append: e("div", {"class": "gift-deleted", append: [
			e("span", {html: Lang.get("gifts.deleted")}),
			e("span", {"class": "a", html: Lang.get("gifts.restore"), onclick: function(event) {
				ctx.restore();
			}})
		]})})
	]});
};
Gift.prototype["delete"] = function() {
	var giftId = this.id;
	Site.API("gifts.delete", {
		id: giftId,
		gift_hash: this.hash
	}, function(data) {
		$.elements.addClass($.element("gift" + giftId + "-content"), "hidden");
		$.elements.removeClass($.element("gift" + giftId + "-deleted"), "hidden");
	});
};
Gift.prototype.restore = function() {
	var giftId = this.id;
	Site.API("gifts.restore", {
		id: this.id,
		gift_hash: this.hash
	}, function(data) {
		$.elements.removeClass($.element("gift" + giftId + "-content"), "hidden");
		$.elements.addClass($.element("gift" + giftId + "-deleted"), "hidden");
	});
};
Gift.prototype.getType = function() {
	return $.e("span", {"class": "tip", html: Lang.get("gifts.gift_type_" + ["normal", "only_getter", "only_sender"][this.privacy || 0])});
};
Gift.prototype.getPreviewImage = function(isEvent) {
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
Gift.prototype.getPreview = function() {
	return $.e("div", {"class": "gift-preview", append: [
		$.e("img", {"class": "gift-image", src: getURL(this.giftPhoto.big)}),
		this.message ? $.e("div", {"class": "gift-message", html: this.message.safe()}) : null // TODO FORMAT()
	]});
};
GiftCategory.prototype.getExtendedBlock = function(parent) {
	var e = $.e, wrap, header, preview, items, item, l = this.items, triggerFunction = function(event) {
		$.elements.toggleClass(wrap, "gifts-category-opened");
	};

	wrap = e("div", {"class": "gifts-category-item", id: "gifts-category-" + this.name});
	header = e("div", {"class": "gifts-category-title", html: this.title.safe(), onclick: triggerFunction});
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