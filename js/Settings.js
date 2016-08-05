/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Settings = {
	RequestPage: function () {
		switch (Site.Get("act")) {
			case "blacklist":
				Site.Loader();
				return Site.APIv5("account.getBanned",
				{
					count: 30,
					fields: "photo_50,online,screen_name",
					offset: Site.Get("offset"),
					v: 5.14
				}, Settings.blacklist.request);
				break;

			case "stickers":
				switch (Site.Get("action")) {
					case "store": Settings.store.getStore(); break;
					case "item": Site.Get("name") ? Settings.store.getItem(Site.Get("name")) : Settings.store.getItemById(Site.Get("id")); break;
					default: Settings.store.getPurchased();
				};
				break;

			case "login": return Settings.getLoginForm(); break;

			case "mobile": return Settings.mobile(); break;

			case "profile": return Settings.getProfileEditForm(); break;

			case "themes": return Settings.showSelectThemeCatalog(2, Site.Get("onlyMy"));  break;

			case "customCSS": return Settings.showCustomCSSForm(); break;

			case "smiles": return Settings.smiles.showSettings();

			default: return Settings.showSettings();
		}
	},
	getTabs: function () {
		return Site.CreateTabPanel([
			["settings",               Lang.get("settings.tabs_general")],
			["settings?act=profile",   Lang.get("settings.tabs_profile")],
			["settings?act=blacklist", Lang.get("settings.tabs_blacklist")],
			["settings?act=stickers",  Lang.get("settings.tabs_stickers")],
			["settings?act=smiles",    Lang.get("settings.tabs_smiles")],
			["settings?act=themes",    Lang.get("settings.tabs_themes")],
		])
	},
	languages: [
		{value: 0, code: "ru", label: "Русский / Russian"},
		{value: 1, code: "en", label: "English / English"},
		{value: 2, code: "ua", label: "Українська / Ukrainian"}
	],
	showSettings: function () {
		if (API.isExtension && !(API.SettingsBitmask & 8))
			API.SettingsBitmask += 8;
		var form = document.createElement("form"),
			data = [
				{
					type: "header",
					label: Lang.get("settings.param_h_messages"),
					right: $.e("span", {
						"class": "fr a",
						html: Lang.get("settings.relongpoll"),
						disabled: API.isExtension,
						onclick: function (event) {
							if (this.disabled)
								return;
							LongPoll.restart();
							$.elements.remove(this);
							Site.Alert({text : "LongPoll перезапущен."});
						}
					})
				},
				{
					bit: 8,
					label: Lang.get("settings.param_longpoll"),
					name: "longpoll",
					type: "checkbox",
					disabled: API.isExtension,
					onchange: function (event) {
						var form = this.form;
						form.__ps_soundnotify.disabled = !this.checked;
						if (!this.checked) {
							form.__ps_soundnotify.checked = false;
						}
					}
				},
				{
					bit: 64,
					label: Lang.get("settings.param_soundnotify"),
					name: "soundnotify",
					type: "checkbox"
				},
				{
					bit: 32768,
					label: Lang.get("settings.param_dialog_as_vk"),
					name: "dialogasvk",
					type: "checkbox"
				},
				{
					bit: 2,
					label: Lang.get("settings.param_autoread"),
					name: "autoread",
					type: "checkbox"
				},
				{
					bit: 2048,
					label: Lang.get("settings.param_send_typing"),
					name: "sendtypingevent",
					type: "checkbox"
				},
				{
					bit: 4096,
					label: Lang.get("settings.param_old_version_messages"),
					name: "oldversionmessages",
					type: "checkbox"
				},
				{
					bit: 8192,
					label: Lang.get("settings.param_send_by_ctrl_enter"),
					name: "sendbyctrlenter",
					type: "checkbox"
				},
				{
					type: "header",
					label: Lang.get("settings.param_h_site")
				},
				{
					bit: 1,
					label: Lang.get("settings.param_online"),
					name: "online",
					type: "checkbox"
				},
				{
					bit: 256,
					label: Lang.get("settings.param_fake_online"),
					type: "checkbox"
				},
				{
					bit: 4,
					label: Lang.get("settings.param_proxy"),
					name: "proxy",
					type: "checkbox",
					onchange: function (event) {
						if (!this.checked)
							return;

						alert("Включение этой функции может привести к некорректной работе сайта. Используйте эту настройку только если на Вашей Интернет-сети стоит запрет на подключение к домену vk.com (иначе говоря - фильтр на сети)");
					}
				},
				{
					bit: 1024,
					label: "уведомления",
					name: "notifications",
					type: "checkbox",
					onchange: function ()
					{
						ntf.style.display = this.checked ? "block" : "none";
					}
				},
				{
					bit: 16,
					label: Lang.get("settings.param_edit_links"),
					name: "editlinks",
					type: "checkbox"
				},
				{
					type: "header",
					label: Lang.get("settings.param_h_interface")
				},
				{
					bit: 32,
					label: Lang.get("settings.param_touch"),
					name: "touch",
					type: "checkbox"
				},
				{
					bit: 128,
					label: Lang.get("settings.param_fixed"),
					name: "fixedhead",
					type: "checkbox"
				},
				{
					bit: 512,
					label: Lang.get("settings.param_double_click"),
					name: "dblclickdisabled",
					type: "checkbox"
				},
				{
					bit: 16384,
					label: Lang.get("settings.param_disable_images"),
					name: "disabledimages",
					type: "checkbox"
				},
				{
					type: "select",
					label: Lang.get("settings.param_lang"),
					name: "language",
					options: Settings.languages,
					selectedIndex: (function(a,b,c,d){c.call(a,function(e){if(e.code===b)d=e.value});return d})(Settings.languages, Lang.lang, Array.prototype.forEach)
				},
				{
					type: "button",
					label: Lang.get("settings.save"),
					name: "saver",
					click: function (event) {
						this.form.onsubmit();
					}
				},
				{
					type: "button",
					label: Lang.get("settings.mark_offline"),
					name: "marker_offline",
					click: function (event) {
						Settings.SetMeAsOffline(this);
						this.disabled = true;
					}
				}
			],
			params = document.createElement("div");
		var tabs = Settings.getTabs();
		form.className = "settings-wrap settings";
		form.id = "settings";
		form.onsubmit = function (event)
		{
			var e = form.elements,
				saver = form.saver,
				languageId = form.language.options[form.language.selectedIndex].value,
				bitmask = 0;

			Array.prototype.forEach.call(e, function (i)
			{
				if (i.tagName.toLowerCase() == "input" && i.type == "checkbox" && i.checked)
				{
					bitmask += parseInt(i.value);
				};
			});
			saver.value = Lang.get("settings.saving");
			saver.disabled = true;

			if (!API.APIdogAuthUserId)
			{
				Settings.applySettings({
					response:
					{
						bitmask: bitmask,
						bitmaskNotifications: API.bitmaskNotifications,
						language:
						{
							languageCode: {"0": "ru", "1": "en", "2": "ua", "999": "gop"}[languageId]
						}
					}
				});
				return;
			};

			Support.Ajax("/api/v2/settings.set",
			{
				bitmask: bitmask,
				bitmaskNotifications: API.bitmaskNotifications,
				languageId: languageId,
				authKey: API.APIdogAuthKey
			},
			function (result)
			{
				Site.Alert({text: Lang.get("settings.saved"), time: 1500});
				Settings.applySettings(result);
			});
			return false;
		};

		var current, p, bit, e = $.elements.create, tasked = [], input;
		for (var i = 0, l = data.length; current = data[i]; ++i) {
			switch (current.type) {
				case "checkbox":
					bit = current.bit;
					p = {type: "checkbox", name: "__ps_" + current.name, value: bit, bit: bit};
					if (API.SettingsBitmask & bit)
						p.checked = true;
					if (current.onchange)
						p.onchange = current.onchange;
					if (current.disabled)
						p.disabled = true;
					params.appendChild(e("label", {append: [
						input = e("input", p),
						e("span", {html: " " + current.label})
					]}))
					if (current.onchange)
						tasked.push([input, current.onchange]);
					continue;
					break;
				case "select":
					var select = document.createElement("select");
					select.name = current.name;
					for (var k = 0, m = current.options.length; k < m; ++k)
						select.appendChild(e("option", {value: current.options[k].value, html: current.options[k].label}));

					select.selectedIndex = current.selectedIndex;

					params.appendChild(e("div", {"class": "sf-wrap", append: [
						e("div", {"class": "tip-form", html: Lang.get("settings.param_lang")}),
						select
					]}));
					continue;
					break;
				case "button":
					p = {type: "button", value: current.label, name: current.name, onclick: current.click};
					if (p.disabled)
						p.disabled = true;
					params.appendChild(e("input", p));
					continue;
					break;
				case "header":
					params.appendChild(Site.CreateHeader(current.label, current.right));
					continue;
					break;
			}
		}
		if (!API.APIdogAuthUserId)
		{
			form.appendChild(e("div", {"class": "photo-deleted", html: "Сбой на сервере. Настройки синхронизировать не удалось. Вы можете поставить настройки для текущей сессии (пока не перезагрузите страницу). Если ничего не помогает или такое происходит постоянно &mdash; переавторизуйтесь"}));
		};
		form.appendChild(params);
		var ntf = e("form", {id: "ntfst", "class": "settings-wrap settings"}),
			itemNotificationCheckbox = function (bitmask, title)
			{
				var p = {type: "checkbox", value: bitmask};
				if ((API.bitmaskNotifications & bitmask) > 0)
					p.checked = true;
				ntf.appendChild(e("label", {append: [
					input = e("input", p),
					e("span", {html: " " + title})
				]}));
			},
			wrap = e("div", {append: [
				tabs,
				form,
				ntf
			]}),
			ntfsaver = e("input", {type: "button", value: Lang.get("settings.save"), onclick: function (event)
			{
				ntf.onsubmit();
			}});
		ntf.appendChild(Site.CreateHeader("Настройка уведомлений"));
		itemNotificationCheckbox(1, "сообщения (только с LongPoll)");
		itemNotificationCheckbox(2, "оценки &laquo;Мне нравится&raquo;");
		itemNotificationCheckbox(4, "репосты");
		itemNotificationCheckbox(8, "новые комментарии");
		itemNotificationCheckbox(16, "ответы");
		itemNotificationCheckbox(32, "новые друзья");
		itemNotificationCheckbox(64, "активность друзей (online/offline)");
		ntf.appendChild(ntfsaver);
		ntf.onsubmit = function (event)
		{
			var e = ntf.elements,
				bitmask = 0;

			Array.prototype.forEach.call(e, function (i)
			{
				if (i.tagName.toLowerCase() == "input" && i.type == "checkbox" && i.checked)
				{
					bitmask += parseInt(i.value);
				};
			});
			ntfsaver.value = Lang.get("settings.saving");
			ntfsaver.disabled = true;

			if (!API.APIdogAuthUserId)
			{
				Settings.applySettings({
					response:
					{
						bitmask: API.SettingsBitmask,
						bitmaskNotifications: bitmask,
						language:
						{
							languageCode: {"0": "ru", "1": "en", "2": "ua", "999": "gop"}[languageId]
						}
					}
				});
				return;
			};

			Support.Ajax("/api/v2/settings.set",
			{
				bitmask: API.SettingsBitmask,
				bitmaskNotifications: bitmask,
				languageId: {ru:0,en:1,ua:2,gop:999}[Lang.lang],
				authKey: API.APIdogAuthKey
			},
			function (result)
			{
				Site.Alert({text: Lang.get("settings.saved"), time: 1500});
				Settings.applySettings(result);
			});
			return false;
		};

		if (!(API.SettingsBitmask & 1024))
			ntf.style.display = "none";

		Site.append(wrap);
		Site.SetHeader(Lang.get("settings.settings"));

		for (var i = 0, l = tasked.length; i < l; ++i)
			(function (n, f) {var q=n;q.f=f;q.f()})(tasked[i][0], tasked[i][1]);
	},
	applySettings: function (data, isAI) {
		data = data.response;
		var saved = data.bitmask,
			savedNotifications = data.bitmaskNotifications,
			lang = data.language.languageCode;
		API.SettingsBitmask = parseInt(saved);
		API.bitmaskNotifications = parseInt(savedNotifications);

		(lang != "gop") ? (Lang && (Lang.lang = lang)) : initGopnik();

		Mail.version = +!(API.SettingsBitmask & 4096);

		if (saved & 128) {
			$.elements.addClass($.element("hat"), "hat-fixed");
			$.elements.addClass($.element("wrap-content"), "content-fixed");
		} else {
			$.elements.removeClass($.element("hat"), "hat-fixed");
			$.elements.removeClass($.element("wrap-content"), "content-fixed");
		};
		if (!isAI)
			Settings.showSettings();
	},
	fastSaveSettings: function (bitmask) {
		var lang = {"ru": 0, "en": 1, "ua": 2, "gop": 999};
		Support.Ajax("/api/v2/settings.set", {
			bitmask: bitmask,
			languageId: lang[Lang.lang],
			authKey: API.APIdogAuthKey
		}, function (result) {});
	},
	SetMeAsOffline: function (button) {
		button.disabled = true;
		button.old_value = button.value;
		button.value = "Запрашиваю...";
		Site.API("account.setOffline", {}, function (data) {
			if (data && data.response){
				button.disabled = false;
				Site.Alert({
					text: Lang.get("settings.marked_as_offline")
				});
				button.value = button.old_value;
			}
		})
	},
	blacklist: {
		request: function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"), form;
			form = Site.CreateInlineForm({
				name: "userId",
				placeholder: Lang.get("settings.blacklist_field_placeholder"),
				title: Lang.get("settings.blacklist_button"),
				onsubmit: function (event) {
					event.preventDefault();
					var form = this,
						user = form.userId.value.trim();

					if (user.indexOf("apidog.ru/") || user.indexOf("vk.com")) {
						user = /(https?:\/\/)?((m\.)?vk\.com|apidog\.ru)\/#?([^?]+)\??/igm.exec(user)[4];
					};

					if (user) {
						Site.API("execute", {
							code:"var u=API.utils.resolveScreenName({screen_name:\"%s\"});return u.type!=\"user\"?{success:!1}:{success:!!API.account.banUser({user_id:u.object_id}),user:API.users.get({user_ids:u.object_id,fields:\"photo_50,online,screen_name\"})[0]};".replace(/%s/img, user)
						}, function (response) {
							data = Site.isResponse(response);
							if (data.success) {
								form.user.value = "";
								list.insertBefore(Settings.blacklist.item(data.user, true), list.firstChild);
							} else
								Site.Alert({
									text: "Ошибка!\n\n" + response.execute_errors[0].error_msg
								});
						});
					} else
						Site.Alert({
							text: Lang.get("settings.error_enter_id"),
							click: function (event) {
								form.user.focus();
							}
						});
					return false;
				}
			});
			list.id = "settings-banlist";
			for (var i = 0, l = data.items.length; i < l; ++i)
				list.appendChild(Settings.blacklist.item(data.items[i]));
			parent.appendChild(Settings.getTabs());
			parent.appendChild(Site.CreateHeader(data.count > 0 ? Lang.get("settings", "blacklist_header_blockeds", data.count) + " " + data.count + " " + Lang.get("settings", "blacklist_header_blocked_users", data.count) : Lang.get("settings.blacklist_header_none")));
			parent.appendChild(form);
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"),data.count,30))
			Site.Append(parent);
			Site.SetHeader(Lang.get("settings.blacklist"));
		},
		item: function (c, animation) {
			var field = document.createElement("div");
			field.id = "blacklist-user" + c.id;
			field.className = "friends-item" + (animation ? " docs-saved" : "");
			field.appendChild($.elements.create("div", {"class": "feed-delete", onclick: function (event) {
				event.preventDefault();
				$.event.cancel(event);
				Settings.blacklist.remove(c.id, this.parentNode);
			}}))
			field.appendChild($.elements.create("img", {src: getURL(c.photo_50), "class": "friends-left"}));
			field.appendChild($.elements.create("div", {"class": "friends-right", append: [
				$.elements.create("a", {href: "#" + c.screen_name || "id" + c.id, append: [
					$.elements.create("strong", {html: Site.Escape(c.first_name + " " + c.last_name) + Site.isOnline(c)})
				]})
			]}));
			return field;
		},
		remove: function (user_id, node) {
			Site.API("account.unbanUser", {user_id: user_id}, function (data) {
				node.style.height = ($.getPosition(node).height - 21) + "px";
				node.innerHTML="<span class=\"tip\">Пользователь удален из черного списка<\/span>";
			});
		}
	},
	store: {
		getTabs: function () {
			return Site.CreateTabPanel([
				["settings?act=stickers", Lang.get("settings.stickers_purchased")],
				["settings?act=stickers&action=store", Lang.get("settings.stickers_store")]
			]);
		},
		getPurchased: function () {
			return Site.APIv5("store.getProducts", {
				type: "stickers",
				filters: "purchased,active",
				extended: 1,
				v: 5.24,
				count: 100
			}, Settings.store.showStickersActiveList);
		},
		stickers: {},
		showStickersActiveList: function (data) {
			data = Site.isResponse(data);
			if (!data)
				return;
			var e = $.e,
				parent = e("div"),
				list = e("div"),
				count = data.count,
				data = data.items, item;

			parent.appendChild(Settings.getTabs());
			parent.appendChild(Site.CreateHeader(Lang.get("settings.stickers")));
			parent.appendChild(Settings.store.getTabs());
			list.style.position = "relative";
			for (var i = -1; item = data[++i];)
				list.appendChild(Settings.store.itemStickerBox(item, {switcher: true}));

			parent.appendChild(list);

			Site.Append(parent);
			Site.SetHeader(Lang.get("settings.stickers"), {link: "settings"});
		},
		itemStickerBox: function (s, o) {
			o = o || {};
			var e = $.e, item, img, pack, node;
			console.log(s);
			if (o.buy)
			{
				pack = s;
				s = s.product;
			};
			Settings.store.stickers[s.id] = s;
			node = (item = e("div", {"class": "friends-item sizefix", style: !s.active ? "opacity: .8" : "", "data-stickerid": s.id, append: [
				o.switcher ? e("div", {"class": "fr a", html: s.active ? Lang.get("settings.stickers_deactivate") : Lang.get("settings.stickers_activate"), onclick: function (event) {
					Site.API(s.active ? "store.deactivateProduct" : "store.activateProduct", {
						type: "stickers",
						product_id: s.id
					}, function (data) {
						if (!(data = Site.isResponse(data)))
							return;
						Settings.store.setActivationStickers(item, s);
					});
				}}) : null,
				o.buy && !s.purchased ? e("div", {"class": "fr a", html: Lang.get("settings.stickers_buy"), onclick: function (event) {
					if (this.disabled)
						return;
					this.disabled = true;
					this.innerHTML = Lang.get("settings.stickers_buying");
					Settings.store.buyProduct(s.id, function (data) {
						s.purchased = true;
						s.purchase_date = parseInt(new Date() / 1000);
						node.parentNode.insertBefore(Settings.store.itemStickerBox(s, {switcher: true}), node);
						$.elements.remove(node);
					});
				}}) : null,
				img = e("img", {
					"class": "friends-left",
					style: "width: 60px; height: 60px;",
					src: getURL(o.buy ? pack.photo_140 : IM.STICKERS_SCHEMA_IMAGE.replace(/%s/ig, s.stickers.sticker_ids[0]))
				}),
				e("div", {"class": "friends-right", style: "margin-left: 70px;",append: [
					e(s.name ? "a" : "span", {"class": "a", html: s.title, href: "#settings?act=stickers&action=item&name=" + s.name}),
					s.purchase_date ? e("div", {"class": "tip", html: Lang.get("settings.stickers_date_purchase") + Site.getDate(s.purchase_date)}) : null,
					pack ? e("div", {"class": "tip", html: pack.author}) : null
				]})
			]}));
//			if (pack) {
				item.style.backgroundImage = "url(" + (pack && pack.background || IM.STICKERS_SCHEMA_BACKGROUND.replace("%s", s.id)) + ")";
				$.elements.addClass(item, "stickerpack-item-store");
//			};
			item.style.height = "80px";
			var touch = Hammer(img),
				currentPosition,
				itemPositionY,
				itemPosition,
				itemHeight,
				listTop,
				listHeight,
				moved,
				list,
				helper,
				plus,
				listPosition;
			touch.get("pan").set({threshold: 0});
			touch.on("panstart", function (event) {
				list =  node.parentNode;
				listPosition = $.getPosition(list);
				listTop = listPosition.top;
				listHeight = listPosition.height;
				itemPosition = $.getPosition(node);
				itemPositionY = itemPosition.top - listTop;
				itemHeight = itemPosition.height;
				list.insertBefore(helper = $.e("div", {"class": "__stickers_helper", style: "height:" + itemHeight + "px;"}), node);

				plus = event.changedPointers[0].layerY;
				$.elements.addClass(node, "stickers-dragged");
			});
			touch.on("pan", function (event) {
				currentPosition = itemPositionY + event.deltaY - plus;
				currentPosition = (
					currentPosition <= 0
						? 0
						: currentPosition >= listHeight
							? listHeight
							: currentPosition
				);
				node.style.top = (currentPosition) + "px";
				if (!list || !helper) return;
				var index = Math.round(currentPosition / 80) + (event.deltaY > 0 ? 2 : 1);
				list.removeChild(helper);
				list.insertBefore(helper, list.children[index]);
			});
			touch.on("panend", function (event) {
				$.elements.removeClass(node, "stickers-dragged");
				list.removeChild(helper);
				helper && helper.remove && helper.remove();
				helper = null;

				var index = Math.round(currentPosition / 80) + (event.deltaY > 0 ? 2 : 1);

				list.removeChild(node);
				list.insertBefore(node, list.children[index]);

				var prev = node.previousSibling,
					next = node.nextSibling,
					current = node.getAttribute("data-stickerid");
				prev = prev ? prev.getAttribute("data-stickerid") : 0;
				next = next ? next.getAttribute("data-stickerid") : 0;
				Site.API("store.reorderProducts", {
					type: "stickers",
					product_id: current,
					before: prev,
					after: next
				}, function (data) {
					loadStickers();
				});
			});
			return node;
		},
		setActivationStickers: function (item, box) {
			box.active = !box.active;
			item.parentNode.insertBefore(Settings.store.itemStickerBox(box, {switcher: true}), item);
			$.elements.remove(item);
		},
		buyProduct: function (productId, callback) {
			Site.API("store.buyProduct", {
				type: "stickers",
				product_id: productId,
				force_inapp: 0,
				guid: parseInt(Math.random() * 1000000)
			}, function (data) {
				if (!(data = Site.isResponse(data)))
					return;
				Site.Alert({text: Lang.get("settings.stickers_bought_success")})
				callback && callback();
			});
		},
		getStore: function () {
			Site.API("store.getStockItems", {
				type: "stickers",
				filters: "free"
			}, function (data) {
				data.response ? Settings.store.showStore(data.response) : null;
			});
		},
		showStore: function (items) {
			var e = $.e,
				parent = e("div"),
				list = e("div"),
				count = items.shift(0);

			parent.appendChild(Settings.getTabs());
			parent.appendChild(Site.CreateHeader(Lang.get("settings.stickers")));
			parent.appendChild(Settings.store.getTabs());
			for (var i = -1; item = items[++i];)
				list.appendChild(Settings.store.itemStickerBox(item, {buy: true}));
			parent.appendChild(list);

			Site.Append(parent);
			Site.SetHeader(Lang.get("settings.stickers"), {link: "settings"});
		},
		getItemById: function (productId) {
			Site.API("execute",
			{
				code: "var n=API.store.getStockItems({type:\"stickers\",product_ids:" + productId + ",v:5.0,extended:1});return n;return API.store.getStockItemByName({type:\"stickers\",name:n,extended:1});"
			}, function () {
				data.response ? Settings.store.showItem(data.response) : Site.Alert({text: "Stickerpack not found"});
			});
		},
		getItem: function (name)
		{
			Site.API("store.getStockItemByName",
			{
				type: "stickers",
				name: name,
				extended: 1
			},
			function (data)
			{
				data.response ? Settings.store.showItem(data.response) : Site.Alert({text: "Stickerpack not found"});
			});
		},
		showItem: function (data) {
			var e = $.e,
				head,
				items = e("div", {
					"class": "stickerpack-items"
				}),
				wrap = e("div", {
					append: [
						head = e("div", {
							"class": "stickerpack-head",
							style: "background-image: url(" + data.background + ");",
							append: [
								e("img", {
									"class": "stickerpack-image",
									src: data.photo_140
								}),
								e("div", {
									"class": "stickerpack-info",
									append: [
										e("h1", {html: data.product.title}),
										e("div", {"class": "tip", html: data.author}),
										e("p", {html: data.description}),
										data.product.purchased
											? e("input", {type: "button", disabled: true, value: Lang.get("settings.stickers_has")})
											: data.free
												? e("input", {type: "button", value: Lang.get("settings.stickers_purchase"), onclick: function (event)
												{
													var self = this;
													Settings.store.buyProduct(data.product.id,
													function ()
													{
														self.value = Lang.get("settings.stickers_has");
														self.disabled = true;
													});
												}})
												: e("input", {type: "button", value: Lang.get("settings.stickers_unavailable"), disabled: true})
									]
								})
							]
						}),
						items
					]
				});
			data.product.stickers.sticker_ids.forEach(function (stickerId) {
				items.appendChild(e("div", {
					"class": "stickerpack-items-item",
					append: e("img", {
						src: getURL(IM.STICKERS_SCHEMA_IMAGE.replace(/%s/ig, stickerId))
					})
				}));
			});
			Site.Append(wrap);
			Site.SetHeader(data.product.title);
		}
	},
	getProfileEditForm: function (data, settings, balance) {
		if (!data) {
			var callee = arguments.callee;
			Site.API("execute", {
				code: "return{a:API.account.getProfileInfo(),s:API.account.getInfo(),b:API.account.getBalance(),u:API.users.get({v:5.27,fields:\"photo_200\"})};",
				v: 4.9
			}, function (data) {
				data = Site.isResponse(data);
				if (!data)
					return;
				Local.AddUsers(data.u);
				callee(data.a, data.s, data.b);
			});
			return;
		};

		var parent = document.createElement("div"),
			photo = Settings.getUploadProfilePhotoForm(),
			settings = Settings.getProfileSettings(settings),
			form = document.createElement("form"),
			e = $.e,
			getTip = function (text) {
				return e("div", {"class": "tip tip-form", html: text});
			},
			u = data,
			getSelect = function (name, from, to, opts) {
				opts = opts || {};
				var select = e("select", {name: name});
				for (var i = from, l = to; i <= l; ++i) {
					select.appendChild(e("option", {value: i, html: opts.data && opts.data[i] || i}));
				}
				return select;
			},
			sex, s = {},
			bdate = [
				s.d = getSelect("bdate_day", 1, 31, {}),
				s.m = getSelect("bdate_month", 1, 12, {data: Lang.get("settings.profile_months")}),
				s.y = getSelect("bdate_year", 1901, 2012)
			],
			birthday = u.bdate.split("."), bdate_visibility,
			relative;

		sex = getSelect("sex", 0, 2, {data: Lang.get("settings.profile_sex")});
		sex.selectedIndex = u.sex;
		bdate[0].selectedIndex = birthday[0] - 1;
		bdate[1].selectedIndex = birthday[1] - 1;
		bdate[2].selectedIndex = (function (options, year) {
			for (var i = 0, l = options.length; i < l; ++i)
				if (options[i].value == year)
					return i;
			return 0;
		})(bdate[2].options, birthday[2]);

		var validateDate = function () {
			s.d.options[s.d.options.length - 1].disabled = +!(
				(s.m.selectedIndex <= 6 && (s.m.selectedIndex + 1) % 2) ||
				(s.m.selectedIndex > 6 && !((s.m.selectedIndex + 1) % 2))
			);
			s.d.options[s.d.options.length - 2].disabled = +(s.m.selectedIndex == 1);
			s.d.options[s.d.options.length - 3].disabled = +(s.m.selectedIndex == 1 && (s.y.options[s.y.selectedIndex].value % 4) != 0);
		};

		s.d.onchange = validateDate;
		s.m.onchange = validateDate;
		s.y.onchange = validateDate;
		validateDate();
		for (var i = 0, l = bdate.length; i < l; ++i)
			bdate[i] = e("td", {append: bdate[i], style: "padding:" + (["0 8px 0 0", "0", "0 0 0 8px"][i])});

		bdate_visibility = getSelect("bdate_visibility", 0, 2, {data: Lang.get("settings.profile_birthday_visibility_options")});
		bdate_visibility.selectedIndex = u.bdate_visibility;

		relative = getSelect("relative", 0, 8, {data: [null, Lang.get("settings.profile_relative_female"), Lang.get("settings.profile_relative_male")][u.sex || 2]});

		// UI

		form.className = "sf-wrap";

		if (u.name_request) {
			var r = u.name_request;
			form.appendChild(e("div", {"class": "block-" + {processing: "warning", declined: "error"}[r.status], append: [
				e("span", {html: Lang.get("settings.profile_previous_request_change_name")
					.replace(/%i%/ig, r.id)
					.replace(/%f%/ig, r.first_name)
					.replace(/%l%/ig, r.last_name)
					.replace(/%s%/ig, {processing: Lang.get("settings.profile_request_waiting"), declined: Lang.get("settings.profile_request_cancelled")}[r.status])
				}),
				r.status == "processing" ? e("span", {"class": "a", html: Lang.get("settings.profile_cancel"), onclick: function (event) {
					Settings.cancelProfileEditName(r.id, this.parentNode);
				}}) : null
			]}))
		}

		form.appendChild(getTip(Lang.get("settings.profile_first_name")));
		form.appendChild(e("input", {type: "text", name: "first_name", required: true, value: u.first_name}));

		form.appendChild(getTip(Lang.get("settings.profile_last_name")));
		form.appendChild(e("input", {type: "text", name: "last_name", required: true, value: u.last_name}));

		if (u.sex == 1) {
			form.appendChild(getTip(Lang.get("settings.profile_maiden_name")));
			form.appendChild(e("input", {type: "text", name: "maiden_name", value: u.maiden_name}));
		}

		form.appendChild(getTip(Lang.get("settings.profile_sex_n")));
		form.appendChild(sex);

//      form.appendChild(getTip(Lang.get("settings.profile_relative")));
		form.appendChild(e("input", {type: "hidden", name: "relation", value: u.relation}));
		form.appendChild(e("input", {type: "hidden", name: "relation_partner_id", value: u.relation_partner_id || ""}));

		form.appendChild(getTip(Lang.get("settings.profile_birthday")));
		form.appendChild(e("table", {width: "100%", append: e("tr", {append: bdate})}));
		form.appendChild(getTip(Lang.get("settings.profile_birthday_visibility")));


		form.appendChild(bdate_visibility);
		form.appendChild(getTip(Lang.get("settings.profile_home_city")));
		form.appendChild(e("input", {type: "text", name: "home_town", value: u.home_town}));

		form.appendChild(e("input", {type: "hidden", name: "city_id", value: u.city && (u.city.id || u.city.cid) || 0}));
		form.appendChild(e("input", {type: "hidden", name: "country_id", value: u.country && (u.country.id || u.country.cid) || 0}));

		form.appendChild(e("input", {type: "submit", value: Lang.get("general.save")}))

		form.onsubmit = function (event) {
			$.event.cancel(event);

			var el = form.elements, params = {}, val;
			for (var i = 0, l = el.length; i < l; ++i) {
				name = el[i].name;

				switch (el[i].tagName.toLowerCase()) {
					case "select": val = el[i].options[el[i].selectedIndex].value; break;
					case "input":
					case "hidden": val = $.trim(el[i].value); break;
					default: val = "";
				};
// не трогать это говно, оно реально не пашет
				if (val == u[name])
					continue;
				params[name] = val;
			};
			params.bdate = [params.bdate_day, params.bdate_month, params.bdate_year].join(".");
			delete params.bdate_day, params.bdate_month, params.bdate_year;

			Site.API("account.saveProfileInfo", params, function (data) {
				if (data.response && data.response.changed)
					Site.Alert({text: Lang.get("settings.saved")});
				else
					Site.Alert({text: "Что-то пошло не так..\nОтвет от API:\n\n" + JSON.stringify(data)});
			})

			return false;
		};

		var changer = document.createElement("form");
		changer.className = "sf-wrap";
		changer.appendChild(e("div", {"class": "tip-form", html: Lang.get("settings.change_password_rules")}));
		changer.appendChild(getTip(Lang.get("settings.change_password_old")));
		changer.appendChild(e("input", {type: "password", name: "password_old", autocomplete: "off"}));
		changer.appendChild(getTip(Lang.get("settings.change_password_new")));
		changer.appendChild(e("input", {type: "password", name: "password_new", autocomplete: "off"}));
		changer.appendChild(getTip(Lang.get("settings.change_password_yet")));
		changer.appendChild(e("input", {type: "password", name: "password_yet", autocomplete: "off"}));
		changer.appendChild(e("input", {type: "submit", value: Lang.get("settings.change_password_set")}));
		changer.onsubmit = function (event) {
			$.event.cancel(event);

			var old = $.trim(this.password_old.value),
				setter = $.trim(this.password_new.value),
				check = $.trim(this.password_yet.value);

			if (old < 6 || setter.length < 6 || check < 6) {
				Site.Alert({text: Lang.get("settings.change_password_error_less_6_symbols")});
				return false;
			}
			if (setter != check) {
				Site.Alert({text: Lang.get("settings.change_password_error_not_equal_new")});
				return false;
			}

			Site.API("account.changePassword", {old_password: old, new_password: setter}, function (data) {
				data = Site.isResponse(data);

				if (data.token) {
					API.access_token = data.token;
					$.cookie("access_token", data.token, 90);
					$.cookie("PHPSESSID", "", -20);
					Site.Alert({text: "Пароль успешно изменен. Все сессии, кроме этой, были завершены."});
				}
			})

			return false;
		};

		var balanceNode = e("div");
		balanceNode.appendChild(Site.EmptyField("На Вашем счету %s %v".replace(/%s/g, balance.votes).replace(/%v/g, $.textCase(balance.votes, ["голос", "голоса", "голосов"]))));
		balanceNode.firstChild.style.padding = "30px 20px";

		parent.appendChild(Settings.getTabs());
		parent.appendChild(Site.CreateHeader(Lang.get("settings.photo_change")));
		parent.appendChild(photo);
		parent.appendChild(Site.CreateHeader(Lang.get("settings.profile_settings")));
		parent.appendChild(settings);
		parent.appendChild(Site.CreateHeader(Lang.get("settings.profile_header")));
		parent.appendChild(form);
		if (balance) {
			parent.appendChild(Site.CreateHeader("Баланс"));
			parent.appendChild(balanceNode);
		};
		parent.appendChild(Site.CreateHeader(Lang.get("settings.change_password")));
		parent.appendChild(changer);

		parent.appendChild(Settings.getAPIdogSessionList());

		Site.Append(parent);
		Site.SetHeader(Lang.get("settings.profile_header"));
	},
	getProfileSettings: function (data) {
		var e = $.e,
			postDefault,
			noWallReplies,
			form = e("form", {
				"class": "sf-wrap",
				append: [
					e("label", {append: [
						postDefault = e("input", {type: "checkbox"}),
						e("span", {html: " " + Lang.get("settings.settings_profile_default_wall_owner")})
					]}),
					e("label", {append: [
						noWallReplies = e("input", {type: "checkbox"}),
						e("span", {html: " " + Lang.get("settings.settings_profile_disable_wall_replies")})
					]}),
					e("input", {
						type: "submit",
						value: Lang.get("general.save")
					})
				],
				onsubmit: function (event) {
					event.preventDefault();

					Site.API("account.setInfo", {
						own_posts_default: postDefault.checked ? 1 : 0,
						no_wall_replies: noWallReplies.checked ? 1 : 0
					}, function (data) {
						data = Site.isResponse(data);
						if (data)
							Site.Alert({text: Lang.get("general.saved")});
					});

					return false;
				}
			});
		if (data.own_posts_default)
			postDefault.checked = true;
		if (data.no_wall_replies)
			noWallReplies.checked = true;
		return form;
	},
	getUploadProfilePhotoForm: function () {
		var user = Local.Users[API.uid],
			e = $.e,
			sbm,
			wrap = e("div", {"class": "settings-photo"}),
			resultCallback = function (data) {
				if (data.photo_604) {
					Site.Alert({
						text: Lang.get("profiles.profile_photo_uploaded")
					});
					sbm.disabled = false;
					sbm.value = Lang.get("settings.photo_change_upload");
					$.element("settings-photo-preview").src = data.photo_604;
				}
			},
			form = e("form", {
				method: "post",
				target: "fupp",
				enctype: "multipart/form-data",
				action: "/upload.php?act=photo_profile",
				onsubmit: function (event) {
					if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
						return true;
					}
					event.preventDefault();

					var file = this.photo.files[0],
						reader = new FileReader(),
						blob,
						submitter = this.sbm,
						url,
						xhr,
						progressline = $.element("pupp-loaded"),
						preview = $.element("settings-photo-preview");
					reader.addEventListener("load", function (event) {
						preview.src = reader.result;
						preview.style.opacity = 0.6;
					});
					reader.readAsDataURL(file);

					$.elements.removeClass($.element("pupp"), "hidden");
					submitter.disabled = true;

					xhr = new XMLHttpRequest();
					xhr.open("POST", this.action, true);
					if (xhr.upload) {
						xhr.upload.onprogress = function (event) {
							var total = event.total,
								loaded = event.loaded,
								percent = loaded * 100 / total;
							submitter.value = Lang.get("settings.photo_change_status").replace(/%p%/img, percent.toFixed(1));
							progressline.style.width = percent + "%";
						};
						xhr.upload.onloadend = function (event) {
							$.elements.addClass($.element("pupp"), "hidden");
							preview.style.opacity = 1;
							alert("Файл успешно загружен");
							resultCallback($.JSON(xhr.responseText))
						}
					}
					if (typeof FormData == "function") {
						var formData = new FormData();
						formData.append("photo", file);
						xhr.send(formData);
					} else if(xhr.sendAsBinary) {
						var reader = new FileReader();
						reader.addEventListener("load", function (event) {
							var boundaryString = "uploadingfile",
								boundary = "--" + boundaryString,
								requestbody = [];

							requestbody.push(boundary);
							requestbody.push("Content-Disposition: form-data; name=\"photo\"; filename=\"" + file.name + "\"");
							requestbody.push("Content-Type: application/octet-stream");
							requestbody.push(reader.result);
							requestbody.push(boundary);
							requestbody = requestbody.join("\r\n");
							xhr.setRequestHeader("Content-type", "multipart/form-data; boundary=\"" + boundaryString + "\"");
							xhr.setRequestHeader("Connection", "close");
							xhr.setRequestHeader("Content-length", requestbody.length);
							xhr.sendAsBinary(requestbody);
						}, false);
						reader.readAsBinaryString(file);
					}

					return false;
				}
			}),
			frame = e("iframe", {
				name: "fupp",
				id: "fupp",
				src: "about:blank",
				"class": "hidden",
				onload: function (event) {
					if (getFrameDocument(this).location.href == "about:blank")
						return;
					var data = $.JSON(getFrameDocument(this).getElementsByTagName("body")[0].innerHTML);
					resultCallback(data);
				}
			});

		form.appendChild(e("div", {
			"class": "settings-photo-left",
			append: e("img", {
				src: getURL(user.photo_200),
				alt: "Photo",
				id: "settings-photo-preview"
			})
		}));
		form.appendChild(e("div", {
			"class": "settings-photo-right",
			append: [
				e("div", {
					"class": "settings-photo-info",
					html: Lang.get("settings.photo_change_info")
				}),
				Site.CreateFileButton("photo", {
					fullwidth: true
				}),
				e("div", {
					"class": "settings-photo-line hidden",
					id: "pupp",
					append: e("div", {
						"class": "settings-photo-line-loaded",
						id: "pupp-loaded"
					})
				}),
				e("div", {
					"class": "settings-photo-warning",
					html: Lang.get("settings.photo_change_warning")
				}),
				sbm = e("input", {
					type: "submit",
					value: Lang.get("settings.photo_change_upload"),
					name: "sbm"
				})
			]
		}))

		wrap.appendChild(form);
		wrap.appendChild(frame);
		return wrap;
	},
	getAPIdogSessionList: function ()
	{
		var e = $.e,
			wrap = e("div"),
			table = e("table", {"class": "mail-ts sizefix", append: e("thead", {append: e("tr", {append: [
				e("th", {"class": "mail-tsrt", html: "AuthID"}),
				e("th", {"class": "mail-tsrt", html: "Дата захода"}),
				e("th", {"class": "mail-tsrt", html: "Действия"})
			]})})}),
			placeholder,
			loader,
			load = function ()
			{
				wrap.removeChild(placeholder);
				wrap.appendChild(loader = e("div", {style: "padding: 65.5px 0", append: Mail.getMaterialLoader()}));
				APIdogRequest("apidog.getSessions", {}, function (result)
				{
					var count = result.count,
						items = result.items;


					items.forEach(item);
					wrap.removeChild(loader);
					wrap.appendChild(table);
				});
			},
			item = function (a)
			{
				var row;
				table.appendChild(row = e("tr", {append: [
					e("td", {"class": "mail-tsrt", html: "#" + a.authId}),
					e("td", {"class": "mail-tsrt", html: $.getDate(a.date) + (a.authKey == API.APIdogAuthKey ? " (текущая)" : "")}),
					e("td", {"class": "mail-tsrt", append: e("span", {"class": "a", html: a.authKey == API.APIdogAuthKey ? "Выйти" : "Завершить", onclick: function (event)
					{
						if (this.disabled) return;
						kill(row, this, a);
					}})})
				]}));
			},
			kill = function (row, button, auth)
			{
				button.disabled = true;
				APIdogRequest("apidog.killSession", { authId: auth.authId }, function (result)
				{
					row.style.opacity = .5;
					button.className = "";
					button.innerHTML = "Завершена";
					if (auth.authKey == API.APIdogAuthKey)
						window.location.href = "\/login.php?act=logout";
				});
			};
		wrap.appendChild(Site.CreateHeader("Сессии на APIdog"));
		wrap.appendChild(placeholder = e("div", {"class": "msg-empty", append: [
			e("div", {html: "Вы можете закрыть открытые сессии Вашего аккаунта на других устройствах/браузерах.<br \/><strong>Внимание!<\/strong> Этот список не имеет отношения к странице завершения сеансов на vk.com!"}),
			e("br"),
			e("div", {"class": "btn", html: "Открыть список", onclick: function (event)
			{
				load();
			}})
		]}));
		return wrap;
	},
	mobile: function ()
	{
		if (typeof window.QRCode === "undefined")
		{
			includeScripts(["/qrcode.js"], function (event)
			{
				Settings.mobile();
			});
			return;
		};

		var e = $.e, wrap = e("div"), place;

		wrap.appendChild(Site.CreateHeader("Быстрая авторизация для мобильного", null, v65HeaderStyle));

		wrap.appendChild(e("p", {"class": "tip", html: "Вы можете быстро авторизоваться на APIdog на мобильном телефоне всего лишь считав этот QR-код."}));

		wrap.appendChild(place = e("div", {align: "center", id: "qrcodelogin"}));


		Site.append(wrap);

		var test = new QRCode(place, {
			text: "https://apidog.ru/authorize?act=m&t=" + API.access_token + "&k=" + API.APIdogAuthKey + "&c=" + md5(API.access_token + API.APIdogAuthKey),
			width: 256,
			height: 256
		});
	},

	showSelectThemeCatalog: function (sortBy, onlyMy) {
		Site.Loader();
		APIdogRequest("themes.get", { count: 50, offset: Site.Get("offset"), sort: sortBy, onlyMy: onlyMy }, function (result) {
			var count = result.count,
				canCreate = result.canCreate,
				items = result.items.map(function (q) {
					Site.queueUser(q.authorId);
					return new APIdogTheme(q).getNodeItem();
				}),

				e = $.e,

				wrap = e("div"),
				list = e("div", {append: items, id: "_stngsthms"}),

				sorter;

			wrap.appendChild(Settings.getTabs());
			wrap.appendChild(Site.getPageHeader("Темы для APIdog", canCreate ? $.e("span", {"class": "a", html: "Создать", style: "padding: 0", onclick: function (event) {
				new APIdogTheme().editForm();
			}}) : null));
			wrap.appendChild(Site.CreateTabPanel([
				["settings?act=themes", "Все"],
				["settings?act=themes&onlyMy=1", "Мои"]
			]));

			wrap.appendChild(e("div", {"class": "sf-wrap", append: sorter = e("select", {onchange: function (event) {
				Settings.showSelectThemeCatalog(this.options[this.selectedIndex].value, Site.Get("onlyMy"));
			}, append: [
				e("option", {value: 2, html: "по количеству установок"}),
				e("option", {value: 1, html: "по дате обновления"}),
				e("option", {value: 0, html: "по дате добавления"})
			]})}));
			sorter.selectedIndex = 2 - sortBy;

			wrap.appendChild(list);
			Site.loadQueueUsers();
			Site.Append(wrap);
		});
		Site.SetHeader("Темы APIdog");
	},

	showThemePage: function (themeId) {
		APIdogRequest("themes.getById", { themeIds: themeId }, function (result) {
			var count = result.count,
				theme = new APIdogTheme(result.items[0]),

				e = $.e,

				wrap = e("div");

			Site.queueUser(q.authorId);

			wrap.appendChild(Settings.getTabs());
			wrap.appendChild(Site.getPageHeader("Тема для APIdog"));
			//wrap.appendChild(list);
			Site.queueUser(q.authorId);
			Site.loadQueueUsers();
			Site.Append(wrap);
			Site.SetHeader("Тема APIdog #" + theme.themeId);
		});
	},

	setTheme: function (theme) {
		var old = Settings.removeAllThemes();
		Array.prototype.forEach.call(theme.node.parentNode.children, function (q) {
			q.querySelector("div:nth-child(1) > div.a").innerHTML = q == theme.node ? "Отключить" : "Установить";
		});
		if (theme.themeId != API.themeId) {
			var n = theme.getNodeStyle();
			getHead().appendChild(n);
			Settings.showConfirmInstallTheme(theme.themeId, {n: n, o: old});
		} else {
			API.themeId = 0;
			APIdogRequest("themes.set", { themeId: API.themeId }, function () {});

		};
	},
	showConfirmInstallTheme: function (themeId, listOfFilesThemesStyles) {
		var time,
			seconds = 15,

			anyway = function () {
				clearInterval(ticks);
				modal.close();
			}

			cancelInstall = function () {
				$.elements.remove(listOfFilesThemesStyles.n);
				if (listOfFilesThemesStyles.o)
					getHead().appendChild(listOfFilesThemesStyles.o);
				anyway();
			},

			confirmInstall = function () {
				API.themeId = themeId;
				APIdogRequest("themes.set", {
					themeId: API.themeId
				}, function () {});
				anyway();
			};


		var modal = new Modal({
				title: "Подтверждение",
				uncloseableByBlock: true,
				content: $.e("span", {append: [
					document.createTextNode("Тема установлена. Подтвердите её установку. До отката темы осталось "),
					time = $.e("span", {html: seconds}),
					document.createTextNode(" секунд(ы)")
				]}),
				footer: [
					{
						name: "confirm",
						title: "Сохранить",
						onclick: confirmInstall
					},
					{
						name: "cancel",
						title: "Отмена",
						onclick: cancelInstall
					}
				]
			}).show(),
			ticks = setInterval(function () {
				time.innerHTML = --seconds;
				if (seconds <= 0) {
					clearInterval(ticks);
					cancelInstall();
				}
			}, 1000);

	},
	removeAllThemes: function () {
		var n;
		Array.prototype.forEach.call(document.querySelectorAll("._ustl"), function (o) {
			$.elements.remove(o);
			n = o;
		});
		return n;
	},

/*	showCustomCSSForm: function ()
	{
		var e = $.e,
			form,
			code,
			saveButton,
			onKeyPress = function (event)
			{
				var n = this.selectionStart || 0, t = this.value;
				if (event.keyCode == 9) {
					t = t.substr(0, n) + "	" + t.substr(n);
					this.value = t;
					n++;
					this.setSelectionRange(n, n);
					event.preventDefault();
					return false;
				};
			},
			saveCSS = function (event)
			{
				event.preventDefault();
				Settings.setCustomCSS(code.value).apply();
				return false;
			},
			wrap = e("div", {append: [
				Site.getPageHeader("Пользовательская стилизация сайта"),
				form = e("form", {"class": "sf-wrap", onsubmit: saveCSS, append: [
					$.e("div", {style: "padding: 6px 8px; border-left: 2px solid rgb(95, 127, 186); margin: 4px 0 10px;", html: "Здесь Вы можете настроить стили сайта так, как Вам бы хотелось бы его видеть. Всё, что Вам нужно &mdash; знать формальный язык описания внешнего вида документа &ndash; CSS.<br>Если вдруг Вы что-то намудрите со стилями и страница пропадет (нельзя будет никак отредактировать код), то откройте консоль JavaScript в браузере и введите &laquo;Settings.setCustomCSS(\"\").apply()&raquo; (учтите, что в таком случае весь код будет утерян!)"}),
					code = e("textarea", {
						name: "code",
						style: "height: 350px; font-family: Consolas, monospace; font-size: 14px;",
						onkeypress: onKeyPress,
						html: Settings.getCustomCSS()
					}),
					saveButton = e("input", {
						type: "submit",
						value: "Сохранить"
					})
				]})
			]});
		Site.append(wrap);
	},

	getCustomCSS: function ()
	{
		return $.localStorage("_customCSS") || "";
	},



	setCustomCSS: function (newCode)
	{
		$.localStorage("_customCSS", Settings.safeCustomCSS(newCode));
		return { apply: Settings.applyCustomCSS };
	},*/

	safeCustomCSS: function (code) {
		var classes = [".avmn-wrap", ".apidog-a", "#_apidv", ".APIdog-ad-item", ".APIdog-ad-item", "ads.php", ".APIdog-ad-img", ".APIdog-ad-extend", ".APIdog-ad-description", ".APIdog-ad-button", ".teaser"];
		classes.forEach(function (cls) {
			code = code.replace(cls, ".fake");
		});
		return code;
	},

	applyCustomCSS: function ()
	{
		if (API.themeId && API.theme)
			getHead().appendChild(new APIdogTheme(API.theme).getNodeStyle());
	},

	smiles: {
		_key: "__usingSmiles",
		avaliable: "😊;😃;😉;😆;😜;😋;😍;😎;😒;😏;😔;😢;😭;😩;😨;😐;😌;😄;😇;😰;😲;😳;😷;😂;❤;😚;😕;😯;😦;😵;😠;😡;😝;😴;😘;😟;😬;😶;😪;😫;☺;😀;😥;😛;😖;😤;😣;😧;😑;😅;😮;😞;😙;😓;😁;😱;😈;👿;👽;👍;👎;☝;✌;👌;👏;👊;✋;🙏;👃;👆;👇;👈;💪;👂;💋;💩;❄;🍊;🍷;🍸;🎅;💦;👺;🐨;🔞;👹;⚽;⛅;🌟;🍌;🍺;🍻;🌹;🍅;🍒;🎁;🎂;🎄;🏁;🏆;🐎;🐏;🐜;🐫;🐮;🐃;🐻;🐼;🐅;🐓;🐘;💔;💭;🐶;🐱;🐷;🐑;⏳;⚾;⛄;☀;🌺;🌻;🌼;🌽;🍋;🍍;🍎;🍏;🍭;🌷;🌸;🍆;🍉;🍐;🍑;🍓;🍔;🍕;🍖;🍗;🍩;🎃;🎪;🎱;🎲;🎷;🎸;🎾;🏀;🏦;😸;😹;😼;😽;😾;😿;😻;🙀;😺;⏰;☁;☎;☕;♻;⚠;⚡;⛔;⛪;⛳;⛵;⛽;✂;✈;✉;✊;✏;✒;✨;🀄;🃏;🆘;🌂;🌍;🌛;🌝;🌞;🌰;🌱;🌲;🌳;🌴;🌵;🌾;🌿;🍀;🍁;🍂;🍃;🍄;🍇;🍈;🍚;🍛;🍜;🍝;🍞;🍟;🍠;🍡;🍢;🍣;🍤;🍥;🍦;🍧;🍨;🍪;🍫;🍬;🍮;🍯;🍰;🍱;🍲;🍳;🍴;🍵;🍶;🍹;🍼;🎀;🎈;🎉;🎊;🎋;🎌;🎍;🎎;🎏;🎐;🎒;🎓;🎣;🎤;🎧;🎨;🎩;🎫;🎬;🎭;🎯;🎰;🎳;🎴;🎹;🎺;🎻;🎽;🎿;🏂;🏃;🏄;🏇;🏈;🏉;??;🐀;🐁;🐂;🐄;🐆;🐇;🐈;🐉;🐊;🐋;🐌;🐍;🐐;🐒;🐔;🐕;🐖;🐗;🐙;🐚;🐛;🐝;🐞;🐟;🐠;🐡;🐢;🐣;🐤;🐥;🐦;🐧;🐩;🐪;🐬;🐭;🐯;🐰;🐲;🐳;🐴;🐵;🐸;🐹;🐺;🐽;🐾;👀;👄;👅;👋;👐;👑;👒;👓;👔;👕;👖;👗;👘;👙;👚;👛;👜;👝;👞;👟;👠;👡;👢;👣;👦;👧;👨;👩;👪;👫;👬;👭;👮;👯;👰;👱;👲;👳;👴;👵;👶;👷;👸;👻;👼;👾;💀;💁;💂;💃;💄;💅;💆;💇;💈;💉;💊;💌;💍;💎;💏;💐;💑;💒;💓;💕;💖;💗;💘;💙;💚;💛;💜;💝;💞;💟;💡;💣;💥;💧;💨;💬;💰;💳;💴;💵;💶;💷;💸;💺;💻;💼;💽;💾;💿;📄;📅;📇;📈;📉;📊;📋;📌;📍;📎;📐;📑;📒;📓;📔;📕;📖;📗;📘;📙;📚;📜;📝;📟;📠;📡;📢;📦;📭;📮;📯;📰;📱;📷;📹;📺;📻;📼;🔆;🔎;🔑;🔔;🔖;🔥;🔦;🔧;🔨;🔩;🔪;🔫;🔬;🔭;🔮;🔱;🗿;🙅;🙆;🙇;🙈;🙉;🙊;🙋;🙌;🙎;🚀;🚁;🚂;🚃;🚄;🚅;🚆;🚇;🚈;🚊;🚌;🚍;🚎;🚏;🚐;🚑;🚒;🚓;🚔;🚕;🚖;🚗;🚘;🚙;🚚;🚛;🚜;🚝;🚞;🚟;🚠;🚡;🚣;🚤;🚧;🚨;🚪;🚬;🚴;🚵;🚶;🚽;🚿;🛀;‼;⁉;ℹ;↔;↕;↖;↗;↘;↙;↩;↪;⌚;⌛;⏩;⏪;⏫;⏬;Ⓜ;▪;▫;▶;◀;◻;◼;◽;◾;☑;☔;♈;♉;♊;♋;♌;♍;♎;♏;♐;♑;♒;♓;♠;♣;♥;♦;♨;♿;⚓;⚪;⚫;⛎;⛲;⛺;✅;✔;✖;✳;✴;❇;❌;❎;❓;❔;❕;❗;➕;➖;➗;➡;➰;➿;⤴;⤵;⬅;⬆;⬇;⬛;⬜;⭐;⭕;〰;〽;🅰;🅱;🅾;🅿;🆎;🆑;🆒;🆓;🆔;🆕;🆖;🈁;🌀;🌁;🌃;🌄;🌅;🌆;🌇;🌈;🌉;🌊;🌋;🌌;🌎;🌏;🌐;🌑;🌒;🌓;🌔;🌕;🌖;🌗;🌘;🌙;🌚;🌜;🌠;🍘;🍙;🎆;🎇;🎑;🎠;🎡;🎢;🎥;🎦;🎮;🎵;🎶;🎼;🏠;🏡;🏢;🏣;🏤;🏥;🏧;🏨;🏩;🏪;🏫;🏬;🏭;🏮;🏯;🏰;👉;👥;💠;💢;💤;💫;💮;💯;💱;💲;💹;📀;📁;📂;📃;📆;📏;📛;📞;📣;📤;📥;📧;📨;📩;📪;📫;📬;📲;📳;📴;📵;📶;🔀;🔁;🔂;🔃;🔄;🔅;🔇;🔈;🔉;🔊;🔋;🔌;🔍;🔏;🔐;🔒;🔓;🔕;🔗;🔘;🔙;🔚;🔛;🔜;🔝;🔟;🔠;🔡;🔢;🔣;🔤;🔯;🔲;🔳;🔴;🔵;🔶;🔷;🔸;🔹;🔺;🔻;🔼;🔽;🗻;🗼;🗽;🗾;😗;🙍;🚉;🚋;🚢;🚥;🚦;🚩;🚫;🚭;🚮;🚯;🚰;🚱;🚲;🚳;🚷;🚸;🚹;🚺;🚻;🚼;🚾;🛁;🛂;🛃;🛄;🛅;⌨;⏭;⏮;⏯;⏱;⏲;⏸;⏹;⏺;☂;☃;☄;☘;☠;☢;☣;☦;☪;☮;☯;☸;☹;⚒;⚔;⚖;⚗;⚙;⚛;⚜;⚰;⚱;⛈;⛏;⛑;⛓;⛩;⛰;⛱;⛴;⛷;⛸;⛹;✍;✝;✡;❣;🌡;🌤;🌥;🌦;🌧;🌨;🌩;🌪;🌫;🌬;🌭;🌮;🌯;🌶;🍽;🍾;🍿;🎖;🎗;🎙;🎚;🎛;🎞;🎟;🏅;🏋;🏌;🏍;🏎;🏏;🏐;🏑;🏒;🏓;🏔;🏕;🏖;🏗;🏘;🏙;🏚;🏛;🏜;🏝;🏞;🏟;🏳;🏴;🏵;🏷;🏸;🏹;🏺;🐿;👁;📸;📽;📿;🕉;🕊;🕋;🕌;🕍;🕎;🕯;🕰;🕳;🕴;🕵;🕶;🕷;🕸;🕹;🖇;🖊;🖋;🖌;🖍;🖐;🖖;🖥;🖨;🖱;🖲;🖼;🗂;🗃;🗄;🗑;🗒;🗓;🗜;🗝;🗞;🗡;🗣;🗯;🗳;🗺;🙁;🙂;🙃;🙄;🛋;🛌;🛍;🛎;🛏;🛐;🛠;🛡;🛢;🛣;🛤;🛥;🛩;🛫;🛬;🛰;🛳;🤐;🤑;🤒;🤓;🤔;🤕;🤖;🤗;🤘;🦀;🦁;🦂;🦃;🦄;🧀;🗨".split(";"),
		defaultSet: "😊;😃;😉;😄;😆;😂;😎;❤;😚;😘;😙;😗;😍;☺;😏;😇;😌;😔;😒;😕;😩;😟;😣;😖;😥;😓;😢;😭;😫;😑;😠;😡;😨;😬;😝;😜;😋;😱;😳;😵;😯;😮;😶;😈;👿;😸;😹;😼;😽;😾;😿;😻;🙀;😺;👍;👎;☝;✌;👌;👏;👊;💪;✋;👋;🙏;🐓;🐶;🐠;🙈;🙉;🌹;🌲;💔;💌;👻;💂;🍊;🍷;🍸;🍌;🍅;🍎;🍏;🍆;🍔;🍞;🔊;🎂;🎃;🎈;🎉;🎊;⚽;🏁;🏆;⏳;💡;💻;📢;🔎;🔦;🔞;⚠;‼;✅;❎;✖;✉;💾;✨;🌚;🌝;🌞;🏦;❄;⛅;☁;💦;☀;⚡;🌂;🐘;♥;👀;🎁;🗿 ",
		used: $.localStorage("__usingSmiles") && $.localStorage("__usingSmiles").split(";") || null,

		isUsed: function (symbol) {
			return !!~Settings.smiles.used.indexOf(symbol);
		},

		getCode: function (s) {
			var i=0,b="",a="",n,y=[],c=[],d,l,j=!1,f=!1;while(n=s.charCodeAt(i++)){d=n.toString(16).toUpperCase();l=s.charAt(i-1);if(i==2&&n==8419){c.push("003"+s.charAt(0)+"20E3");y.push(s.charAt(0));b='';a='';continue};b+=d;a+=l;if(!l.match(Mail.emojiCharSeq)){c.push(b);y.push(a);b='';a=''}};if(b){c.push(b);y.push(a)};b="";a="";for(var i in c){d=c[i];l=y[i];if(l.match(/\uD83C[\uDFFB-\uDFFF]/)){b+=d;a+=l;continue};if(j){b+=d;a+=l;j=!1;continue};if(d=="200C"||d=="200D"){if(b){j=!0;continue}else o+=l};if(l.match(/\uD83C[\uDDE6-\uDDFF]/)){if(f){b+=d;a+=l;f=!1;continue};f=!0;}else if(f)f=!1;b=d;a=l};return b;
		},

		showSettings: function () {
			var e = $.e,
				wrap = e("div"),
				list = e("div"),
				c,
				item = function (s) {
					c = Settings.smiles.getCode(s);
					if (c == "FFFD")
						return;
					return e("div", {
						"class": "settings-smile" + (Settings.smiles.isUsed(s) ? " settings-smile-active" : ""),
						"data-symbol": s,
						onclick: function (event) {
							$.elements.toggleClass(this, "settings-smile-active");
							rewrite();
						},
						append: e("img", {src: "\/\/vk.com\/images\/emoji\/" + c + "_2x.png", alt: s})
					});
				},
				rewrite = function () {
					var d = Array.prototype.map.call(list.querySelectorAll(".settings-smile-active"), function (node) {
						return node.getAttribute("data-symbol");
					});
					Settings.smiles.used = d;
					$.localStorage("__usingSmiles", d.join(";"));
					IM.smilesNode = null;
				};

			list = e("div", {append: Settings.smiles.avaliable.map(item)});

			wrap.appendChild(Settings.getTabs());
			wrap.appendChild(Site.getPageHeader("Смайлы"));
			wrap.appendChild(list);
			Site.Append(wrap);
			Site.SetHeader("Смайлы");
		}
	}
};
if (!Settings.smiles.used) {
	$.localStorage("__usingSmiles", Settings.smiles.defaultSet);
	Settings.smiles.used = Settings.smiles.defaultSet.split(";");
};


function APIdogTheme (t) {
	if (!t) {
		this._isNew = true;
		this.isPrivate = true;
		return;
	}
	this.themeId = t.themeId;
	this.title = t.title;
	this.updated = t.updated;
	this.file = t.file;
	this.isAuthor = API.uid == t.authorId;
	this.authorId = t.authorId;
	this.installs = t.installs;
	this.isPrivate = t.isPrivate;
	this.version = t.version;
	this.changelog = t.changelog;
	this.node = null;
};
APIdogTheme.prototype = {
	getNodeStyle: function () {
		return $.e("link", {rel: "stylesheet", href: "/styles/" + this.file, type: "text/css", "class": "_ustl"});
	},
	getNodeItem: function () {
		var e = $.e, self = this;
		return this.node = e("div", {"class": "friends-item sizefix __theme", id: "__theme" + this.themeId, append: [
			e("div", {"class": "fr", append: [
				e("div", {"class": "a", html: API.themeId == this.themeId ? "Отключить" : "Установить", onclick: function (event) {
					var was = API.themeId == self.themeId;
					Settings.setTheme(self);
					this.innerHTML = was ? "Установить" : "Отключить";
				}}),
				this.isAuthor ? e("div", {"class": "a", html: "Редактировать", onclick: function (event) {
					self.editForm();
				}}) : null,
				this.isAuthor || API.isAdmin ? e("div", {"class": "a", html: "Удалить", onclick: function (event) {
					self.deleteConfirm();
				}}) : null,
			]}),
			e("div", {"class": "", append: [
				e("div", {append: e("strong", {html: (this.isPrivate ? "[private] " : "") + Site.Escape(this.title) + (this.version ? " v" + this.version : "")})}),
				e("div", {"class": "tip", append: [
					document.createTextNode("Обновлено: " + $.getDate(this.updated) + (this.changelog ? ", " : "")),
					this.changelog
						? e("span", {"class": "a", html: "лог изменений", onclick: function () {
							self.whatsNew()
						}})
						: null

				]}),
				e("div", {"class": "tip" + (this.isAuthor ? " a" : ""), html: "Установок: " + this.installs, onclick: this.isAuthor ? function () {
					self.showUsers()
				} : null}),
				e("div", {"class": "tip", append: [
					e("span", {html: "Автор: "}),
					e("a", {"class": "_im_link_" + this.authorId, html: "пользователь"})
				]})
			]})
		]});
	},
	editForm: function () {
		var vTitle,
			vContent,
			vPrivate,
			vVersion,
			vLog,
			self = this,
			modal = new Modal({
				title: this._isNew ? "Создание темы" : "Редактирование темы",
				content: $.e("div", {"class": "sf-wrap", append: [
					$.e("div", {"class": "tip tip-form", html: "Название темы:"}),
					vTitle = $.e("input", {type: "text", value: this.title || ""}),
					$.e("div", {"class": "tip tip-form", html: "Версия: "}),
					vVersion = $.e("input", {type: "text", value: this.version || "1.0"}),
					$.e("label", {append: [
						vPrivate = $.e("input", {type: "checkbox"}),
						$.e("span", {html: " приватная тема"})
					]}),
					$.e("div", {"class": "tip tip-form", html: "Код CSS:"}),
					vContent = $.e("textarea", {"class": "", style: "height: 260px;"}),
					$.e("div", {"class": "tip tip-form", append: [
						$.e("span", {"class": "a fr", html: "Разметка?", onclick: Support.showMarkUpHelpPage}),
						$.e("span", {html: "История изменений (необязательно) "})
					]}),
					vLog = $.e("textarea", {"class": ""})
				]}),
				footer: [
					{
						name: "save",
						title: "Сохранить",
						onclick: function () {
							save();
						}
					},
					{
						name: "cancel",
						title: "Закрыть",
						onclick: function () {
							modal.close();
						}
					}
				]
			}).show(),

			save = function () {
				APIdogRequest(self._isNew ? "themes.create" : "themes.edit", {
					themeId: parseInt(self.themeId) || 0,
					title: vTitle.value.trim(),
					content: Settings.safeCustomCSS(vContent.value.trim()),
					isPrivate: vPrivate.checked ? 1 : 0,
					version: vVersion.value.trim(),
					changelog: vLog.value.trim()
				}, function (result) {
					if (result) {
						modal.setTitle("Сохранено");
						setTimeout(function () {
							modal.setTitle("Редактирование темы");
						}, 3000);
						if (self._isNew) {
							self.themeId = result.themeId;
							self.title = result.title;
							self.updated = result.updated;
							self.authorId = result.authorId;
							self.file = result.file;
							self.version = result.version;
							self.changelog = result.changelog;
							self.installs = 0;
							self.isAuthor = true;
							self._isNew = false;
							var w = $.element("_stngsthms");
							w.insertBefore(self.getNodeItem(), w.firstChild);
						} else {
							self.title = vTitle.value.trim();
							self.isPrivate = vPrivate.checked;
							self.version = vVersion.value.trim();
							self.changelog = vLog.value.trim();
						}
					};
				}, function (error) {
					Site.Alert({
						text: error.message
					});
				});
			};

		if (this.isPrivate) {
			vPrivate.checked = true;
		};

		if (this.changelog) {
			vLog.value = this.changelog;
		};

		if (!this._isNew) {
			APIdogRequest("themes.getCode", {themeId: this.themeId}, function (result) {
				vContent.value = result;
			});
		};
	},
	deleteConfirm: function () {
		var themeId = this.themeId, node = this.node;
		VKConfirm("Вы уверены, что хотите удалить эту тему? Она перестанет работать у всех, кто поставил её у себя", function (ok) {
			APIdogRequest("themes.delete", { themeId: themeId }, function (result) {
				$.elements.remove(node);
			});
		});
	},
	whatsNew: function () {
		var modal = new Modal({
			title: "Обновления темы",
			content: $.e("div", {append: [
				$.e("span", {"class": "tip", html: "Версия " + Site.Escape(this.version) + " от " + this.getDateUpdate()}),
				$.e("div", {html: Support.formatText(Site.Escape(this.changelog))})
			]}),
			footer: [
				{
					name: "close",
					title: "Закрыть",
					onclick: function () {
						modal.close();
					}
				}
			]
		}).show();
	},
	showUsers: function () {
		var e = $.e,
			list = e("div"),
			modal = new Modal({
				title: "Пользователи темы",
				content: list,
				footer: [
					{
						name: "close",
						title: "Закрыть",
						onclick: function () {
							modal.close();
						}
					}
				]
			}).show();
		APIdogRequest("themes.getUsers", {themeId: this.themeId}, function (result) {

			result.items = result.items.slice(0, 500);

			result.items.forEach(function (userId) {
				var cls = "_im_link_" + userId;
				list.appendChild(e("a", {"class": "friends-item " + cls, append: [
					e("img", {"class": "friends-left " + cls}),
					e("div", {"class": "friends-right", append: [
						e("strong", {"class": cls})
					]})
				]}));
				Site.queueUser(userId);
			});
			Site.loadQueueUsers();
		}, function (error) {
			Site.Alert({
				text: error.message
			});
		});
	},
	getDateUpdate: function () {
		var d = new Date(this.updated * 1000);
		return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
	}
};
