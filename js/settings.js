var Setting = {
	ENABLED_LONGPOLL: 8,
	SOUND_ON_MESSAGE: 64,
	DIALOG_AS_VK: 32768,
	AUTO_READ_DIALOG: 2,
	SEND_TYPING: 2048,
	MESSAGES_INSTEAD_DIALOGS: 4096,
	SEND_ALTERNATIVE: 8192, // Ctrl+Enter
	ENABLED_ONLINE: 1,
	USING_PROXY: 4,
	ENABLED_NOTIFICATIONS: 1024,
	AVOID_VK_LINKS: 16,
	LEFT_NOTIFICATIONS_COUNTER: 256,
	IS_TOUCH: 32,
	FIXED_HEADER: 128,
	DOUBLE_CLICK_DISABLED: 512,
	DISABLE_IMAGES: 16384,
	WARNING_ONLINE: 65536,
	COMMENTS_IN_FEED: 131072
};


var Settings = {

	RequestPage: function() {
		switch (Site.get("act")) {
			case "blacklist":
				return Settings.blacklist.page().then(Settings.blacklist.load).then(Settings.blacklist.show);

			case "stickers":
				switch (Site.Get("action")) {
					case "store": Settings.store.getStore(); break;
					case "item": Site.Get("name") ? Settings.store.getItem(Site.Get("name")) : Settings.store.getItemById(Site.Get("id")); break;
					default: Settings.store.getPurchased();
				}
				break;


			case "themes":
				return Settings.themes.page().then(Settings.themes.request).then(Settings.themes.showList);

			case "smiles":
				return Settings.smiles.showSettings();

			case "profile":
				return Settings.getProfileEditForm();

			default:
				return Settings.showSettings();
		}
	},

	/**
	 * Returns tabs
	 * @returns {HTMLElement}
	 */
	getTabs: function () {
		return Site.getTabPanel([
			["settings",               Lang.get("settings.tabs_general")],
			["settings?act=profile",   Lang.get("settings.tabs_profile")],
			["settings?act=blacklist", Lang.get("settings.tabs_blacklist")],
			["settings?act=stickers",  Lang.get("settings.tabs_stickers")],
			["settings?act=smiles",    Lang.get("settings.tabs_smiles")],
			["settings?act=themes",    Lang.get("settings.tabs_themes")],
		])
	},

	/**
	 * Available languages
	 */
	languages: [
		{value: 0, code: 0, label: "Русский / Russian"},
		{value: 1, code: 1, label: "English / English"},
		{value: 2, code: 2, label: "Українська / Ukrainian"}
	],

	/**
	 * Show settings page
	 */
	showSettings: function() {

		if (API.isExtension && !isEnabled(Setting.ENABLED_LONGPOLL)) {
			API.bitmask += Setting.ENABLED_LONGPOLL;
		}

		var form = document.createElement("form"),
			data = [
				{
					type: "header",
					label: Lang.get("settings.param_h_messages"),
					right: $.e("span", {
						"class": "fr a",
						html: Lang.get("settings.relongpoll"),
						disabled: API.isExtension,
						onclick: function() {
							if (this.disabled) {
								return;
							}
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
					onchange: function() {
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
					bit: 4,
					label: Lang.get("settings.param_proxy"),
					name: "proxy",
					type: "checkbox",
					onchange: function(event) {
						if (!this.checked || !event)
							return;

						alert("Включение этой функции может привести к некорректной работе сайта. Используйте эту настройку только если на Вашей Интернет-сети стоит запрет на подключение к домену vk.com (иначе говоря - фильтр на сети)");
					}
				},
				/*{
					bit: 1024,
					label: "уведомления",
					name: "notifications",
					type: "checkbox",
					onchange: function ()
					{
						ntf.style.display = this.checked ? "block" : "none";
					}
				},*/
				{
					bit: 16,
					label: Lang.get("settings.param_edit_links"),
					name: "editlinks",
					type: "checkbox"
				},
				{
					bit: 256,
					label: "не сбрасывать счетчик ответов",
					name: "notificationcountdontreset",
					type: "checkbox"
				},
				{
					bit: Setting.COMMENTS_IN_FEED,
					label: "загружать комментарии в новостях",
					name: "commentsinfeed",
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
					bit: 65536,
					label: "выделять элементы сайта красной рамкой, которые выбивают онлайн",
					name: "carefulelements",
					type: "checkbox"
				},
				{
					type: "select",
					label: Lang.get("settings.param_lang"),
					name: "language",
					options: Settings.languages,
					selectedIndex: (function(a,b,c,d){c.call(a,function(e){if(e.code===b)d=e.value});return d})(Settings.languages, API.language, Array.prototype.forEach)
				},
				{
					type: "button",
					label: Lang.get("settings.save"),
					name: "saver",
					click: function() {
						form.onsubmit();
					}
				},
				// кто бы мог подумать, что закомментированный код когда-нибудь понадобится...
				{
					type: "button",
					label: Lang.get("settings.mark_offline"),
					name: "marker_offline",
					click: function() {
						var button = this, oldValue = button.value;
						button.disabled = true;
						button.value = "...";
						Settings.setAsOffline().then(function() {
							button.disabled = false;
							button.value = oldValue;
							Site.Alert({
								text: Lang.get("settings.marked_as_offline")
							});
						});
					}
				}
			],
			params = $.e("div");

		form.className = "settings-wrap settings";
		form.id = "settings";
		form.onsubmit = function() {

			var e = form.elements,
				saver = form.saver,
				languageId = parseInt(getValue(form.language)),
				bitmask = 0;

			Array.prototype.forEach.call(e, function(i) {
				if (i.tagName.toLowerCase() === "input" && i.type === "checkbox" && i.checked) {
					bitmask += parseInt(i.value);
				}
			});

			saver.value = Lang.get("settings.saving");
			saver.disabled = true;

			if (!API.userId) {
				Settings.applySettings(bitmask, languageId);
				return;
			}

			Settings.save(bitmask, languageId).then(function() {
				Site.Alert({text: Lang.get("settings.saved"), time: 1500});
				saver.value = Lang.get("settings.save");
				saver.disabled = false;
			});
			return false;
		};

		var current, p, bit, e = $.elements.create, tasked = [], input;

		for (var i = 0; current = data[i]; ++i) {
			switch (current.type) {
				case "checkbox":
					bit = current.bit;
					p = {type: "checkbox", name: "__ps_" + current.name, value: bit, bit: bit};

					if (current.onchange) {
						p.onchange = current.onchange;
					}

					params.appendChild(e("label", {append: [
						input = e("input", p),
						e("span", {html: " " + current.label})
					]}));

					input.checked = isEnabled(bit);
					input.disabled = current.disabled;

					if (current.onchange) {
						tasked.push([input, current.onchange]);
					}
					break;

				case "select":
					var select = $.e("select", {name: current.name});

					for (var k = 0, m; m = current.options[k]; ++k) {
						select.appendChild(e("option", { value: m.value, html: m.label }));
					}

					select.selectedIndex = current.selectedIndex;

					params.appendChild(e("div", {"class": "sf-wrap", append: [
						e("div", {"class": "tip-form", html: Lang.get("settings.param_lang")}),
						select
					]}));
					break;

				case "button":
					p = {type: "button", value: current.label, name: current.name, onclick: current.click};

					params.appendChild(input = e("input", p));
					input = current.disabled;
					break;

				case "header":
					params.appendChild(Site.getPageHeader(current.label, current.right));
					break;
			}
		}

		form.appendChild(params);

		Site.append($.e("div", {append: [Settings.getTabs(), form]} ));
		Site.setHeader(Lang.get("settings.settings"));


		tasked.forEach(function(i) { i[1].call(i[0]); });
	},

	/**
	 * Send new settings to server
	 * @param {int} bitmask
	 * @param {int} languageId
	 * @returns {Promise}
	 */
	save: function(bitmask, languageId) {
		return new Promise(function(resolve, reject) {
			APIdogRequest("user.saveSettings", {
				bitmask: bitmask,
				language: languageId
			}).then(function() {
				resolve();
				Settings.applySettings(bitmask, languageId);
			}).catch(function(error) {
				reject();
				console.error(error);
			});
		});
	},

	/**
	 * Applying new settings after saving
	 * @param {int} bitmask
	 * @param {int} languageId
	 */
	applySettings: function(bitmask, languageId) {
		var isLanguageChanged = API.language !== languageId;
		API.bitmask = bitmask;
		API.language = languageId;

		Mail.version = !isEnabled(Setting.MESSAGES_INSTEAD_DIALOGS);

		var c = isEnabled(Setting.FIXED_HEADER) ? "addClass" : "removeClass";
		$.elements[c]($.element("hat"), "hat-fixed");
		$.elements[c]($.element("wrap-content"), "content-fixed");

		Settings.redrawMBOClass();

		if (isLanguageChanged) {
			Settings.showPromoteReloadPage();
		}
	},

	/**
	 * Modal window after change language
	 */
	showPromoteReloadPage: function() {
		new Modal({
			title: Lang.get("settings.promoteReloadTitle"),
			content: Lang.get("settings.promoteReloadText"),
			footer: [
			],
			unclosableByBlock: true
		}).show();
	},

	/**
	 * Send request to set offline
	 */
	setAsOffline: function() {
		return new Promise(function(resolve) {
			api("account.setOffline", {}).then(function() {
				resolve();
			});
		});
	},

	blacklist: {

		/**
		 * Show wrapper for blacklist page
		 * @returns {Promise}
		 */
		page: function() {
			return new Promise(function(resolve) {

				var parent = $.e("div"),
					form = Site.createInlineForm({
						name: "userId",
						placeholder: Lang.get("settings.blacklist_field_placeholder"),
						title: Lang.get("settings.blacklist_button"),
						onsubmit: function(event) {
							event.preventDefault();
							var form = this,
								user = new URL(form.userId.value.trim());

							user = (user.hostname === location.hostname ? user.hash.split("?")[0] : user.pathname).substring(1);

							if (user) {
								Settings.blacklist.add(user).then(function(data) {
									if (data.success) {
										sl.add(data.user);
										form.userId.value = "";
									} else {
										Site.Alert({ text: "Ошибка..." });
									}
								}).catch(function(error) {

								});
							} else {
								new Snackbar({
									text: Lang.get("settings.error_enter_id")
								}).show();
							}
							return false;
						}
					}),

					sl = new SmartList({
						data: {count: 0, items: []},
						countPerPage: 50,
						needSearchPanel: true,

						filter: SmartList.getDefaultSearchFilter({ fields: ["first_name", "last_name"] }),

						getItemListNode: SmartList.getDefaultItemListNode,
						optionsItemListCreator: {
							textContentBold: true,
							remove: {
								onClick: function(user) {
									Settings.blacklist.remove(user.id).then(function() {
										sl.remove(user);
									});
								},
								label: {
									content: Lang.get("settings.blacklist_remove"),
									width: 190
								}

							}
						}
					});

				parent.appendChild(Settings.getTabs());
				parent.appendChild(Site.getPageHeader(Lang.get("settings.blacklist")));
				parent.appendChild(form);
				parent.appendChild(sl.getNode());
				Site.append(parent);
				Site.setHeader(Lang.get("settings.blacklist"));
				resolve({list: sl});
			});
		},

		/**
		 * Request to get banned users
		 * @param data
		 * @returns {Promise.<{count: int, items: User[]}>}
		 */
		load: function(data) {
			return api("account.getBanned", {
				count: 200,
				fields: "photo_50,online,screen_name,last_seen",
				offset: getOffset(),
				v: 5.56
			}).then(function(res) {
				return {list: data.list, data: res};
			});
		},

		/**
		 * Show list of banned in smart list
		 * @param {{list: SmartList, data: {count: int, items: User[]}}} data
		 */
		show: function(data) {
			data.list.setData(data.data);
		},

		/**
		 * Request to add user to ban
		 * @param {string} domain
		 * @returns {Promise}
		 */
		add: function(domain) {
			return api("execute", {
				code: "var u=API.utils.resolveScreenName({screen_name:Args.u});return u.type!=\"user\"?{success:!1}:{success:!!API.account.banUser({user_id:u.object_id}),user:API.users.get({user_ids:u.object_id,fields:Args.f})[0]};",
				u: domain,
				f: "photo_50,online,screen_name",
				v: 5.56
			});
		},

		/**
		 * Request to remove user from ban
		 * @param {int} userId
		 * @returns {Promise}
		 */
		remove: function(userId) {
			return api("account.unbanUser", { user_id: userId });
		}
	},






	store: {
		getTabs: function () {
			return Site.getTabPanel([
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
			parent.appendChild(Site.getPageHeader(Lang.get("settings.stickers")));
			parent.appendChild(Settings.store.getTabs());
			list.style.position = "relative";
			for (var i = -1; item = data[++i];)
				list.appendChild(Settings.store.itemStickerBox(item, {switcher: true}));

			parent.appendChild(list);

			Site.append(parent);
			Site.setHeader(Lang.get("settings.stickers"), {link: "settings"});
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
				helper && $.elements.remove(helper);
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
			parent.appendChild(Site.getPageHeader(Lang.get("settings.stickers")));
			parent.appendChild(Settings.store.getTabs());
			for (var i = -1; item = items[++i];)
				list.appendChild(Settings.store.itemStickerBox(item, {buy: true}));
			parent.appendChild(list);

			Site.append(parent);
			Site.setHeader(Lang.get("settings.stickers"), {link: "settings"});
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
			Site.append(wrap);
			Site.setHeader(data.product.title);
		}
	},

	getProfileEditForm: function(data, settings, balance) {
		if (!data) {
			var callee = Settings.getProfileEditForm;
			Site.API("execute", {
				code: "return{a:API.account.getProfileInfo(),s:API.account.getInfo(),b:API.account.getBalance(),u:API.users.get({v:5.27,fields:\"photo_200\"})};",
				v: 4.9
			}, function (data) {
				data = Site.isResponse(data);
				if (!data)
					return;
				Local.add(data.u);
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
				if (options[i].value === year)
					return i;
			return 0;
		})(bdate[2].options, birthday[2]);

		var validateDate = function () {
			s.d.options[s.d.options.length - 1].disabled = +!(
				(s.m.selectedIndex <= 6 && (s.m.selectedIndex + 1) % 2) ||
				(s.m.selectedIndex > 6 && !((s.m.selectedIndex + 1) % 2))
			);
			s.d.options[s.d.options.length - 2].disabled = +(s.m.selectedIndex === 1);
			s.d.options[s.d.options.length - 3].disabled = +(s.m.selectedIndex === 1 && (s.y.options[s.y.selectedIndex].value % 4) !== 0);
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
				r.status === "processing" ? e("span", {"class": "a", html: Lang.get("settings.profile_cancel"), onclick: function (event) {
					Settings.cancelProfileEditName(r.id, this.parentNode);
				}}) : null
			]}))
		}

		form.appendChild(getTip(Lang.get("settings.profile_first_name")));
		form.appendChild(e("input", {type: "text", name: "first_name", required: true, value: u.first_name}));

		form.appendChild(getTip(Lang.get("settings.profile_last_name")));
		form.appendChild(e("input", {type: "text", name: "last_name", required: true, value: u.last_name}));

		if (u.sex === 1) {
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

			var el = form.elements, params = {}, val, name;
			for (var i = 0, l = el.length; i < l; ++i) {
				name = el[i].name;

				switch (el[i].tagName.toLowerCase()) {
					case "select": val = el[i].options[el[i].selectedIndex].value; break;
					case "input":
					case "hidden": val = $.trim(el[i].value); break;
					default: val = "";
				}
// не трогать это говно, оно реально не пашет
				if (val === u[name])
					continue;
				params[name] = val;
			}
			params.bdate = [params.bdate_day, params.bdate_month, params.bdate_year].join(".");
			delete params.bdate_day;
			delete params.bdate_month;
			delete params.bdate_year;

			Site.API("account.saveProfileInfo", params, function (data) {
				if (data.response && data.response.changed) {
					data = data.response;
					if (!data.name_request) {
						Site.Alert({text: Lang.get("settings.saved")});
					} else {
						data = data.name_request;
						Site.Alert({text: "ВКонтакте вернул ошибку (status=" + data.status + "): " + data.lang, time: 15000, duration: 15000});
					}

				} else
					Site.Alert({text: "Что-то пошло не так..\nОтвет от API:\n\n" + JSON.stringify(data)});
			});

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
			if (setter !== check) {
				Site.Alert({text: Lang.get("settings.change_password_error_not_equal_new")});
				return false;
			}

			Site.API("account.changePassword", {old_password: old, new_password: setter}, function (data) {
				data = Site.isResponse(data);

				if (data.token) {
					API.accessToken = data.token;
					$.cookie("userAccessToken", data.token, 180);
					$.cookie("PHPSESSID", "", -20);
					Site.Alert({text: "Пароль успешно изменен. Все сессии, кроме этой, были завершены."});
				}
			});

			return false;
		};

		var balanceNode = e("div");
		balanceNode.appendChild(Site.getEmptyField("На Вашем счету %s %v".replace(/%s/g, balance.votes).replace(/%v/g, $.textCase(balance.votes, ["голос", "голоса", "голосов"]))));
		balanceNode.firstChild.style.padding = "30px 20px";

		parent.appendChild(Settings.getTabs());
		parent.appendChild(Site.getPageHeader(Lang.get("settings.photo_change")));
		parent.appendChild(photo);
		parent.appendChild(Site.getPageHeader(Lang.get("settings.profile_settings")));
		parent.appendChild(settings);
		parent.appendChild(Site.getPageHeader(Lang.get("settings.profile_header")));
		parent.appendChild(form);
		if (balance) {
			parent.appendChild(Site.getPageHeader("Баланс"));
			parent.appendChild(balanceNode);
		}
		parent.appendChild(Site.getPageHeader(Lang.get("settings.change_password")));
		parent.appendChild(changer);

		parent.appendChild(Settings.getAPIdogSessionList());

		Site.append(parent);
		Site.setHeader(Lang.get("settings.profile_header"));
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
		var user = Local.data[API.userId],
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
				onsubmit: function(event) {
					if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
						return true;
					}
					event.preventDefault();

					var file = this.photo.files[0],
						reader = new FileReader(),
						submitter = this.sbm,
						preview = $.element("settings-photo-preview");

					reader.addEventListener("load", function() {
						preview.src = reader.result;
						preview.style.opacity = 0.6;
					});

					reader.readAsDataURL(file);

					submitter.disabled = true;

					uploadFiles(this.photo, {
						method: "photos.getOwnerPhotoUploadServer",
						onFileUploaded: function(photo) {
							preview.style.opacity = 1;
							alert("Файл успешно загружен");
							resultCallback(photo);
						}
					});
					return false;
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
				Site.createFileChooserButton("photo", {
					fullWidth: true
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
		}));

		wrap.appendChild(form);
		return wrap;
	},

	getAPIdogSessionList: function() {
		var e = $.e,
			wrap = e("div"),
			table = e("table", {"class": "mail-ts sizefix", append: e("thead", {append: e("tr", {append: [
				e("th", {"class": "mail-tsrt", html: "AuthID"}),
				e("th", {"class": "mail-tsrt", html: "Дата захода"}),
				e("th", {"class": "mail-tsrt", html: "Действия"})
			]})})}),
			placeholder,
			loader,
			load = function() {
				wrap.removeChild(placeholder);
				wrap.appendChild(loader = e("div", {style: "padding: 65.5px 0", append: Site.Loader(true)}));
				// TODO
				APIdogRequest("user.getSessions", {}).then(function(result) {
					var items = result.items;

					items.forEach(item);
					wrap.removeChild(loader);
					wrap.appendChild(table);
				});
			},
			item = function(a) {
				var row;
				table.appendChild(row = e("tr", {append: [
					e("td", {"class": "mail-tsrt", html: "#" + a.authId}),
					e("td", {"class": "mail-tsrt", html: $.getDate(a.date) + (a.authKey === API.authKey ? " (текущая)" : "")}),
					e("td", {"class": "mail-tsrt", append: e("span", {"class": "a", html: a.authKey === API.authKey ? "Выйти" : "Завершить", onclick: function() {
						if (this.disabled) {
							return;
						}

						kill(row, this, a);
					}})})
				]}));
			},

			kill = function(row, button, auth) {
				button.disabled = true;
				APIdogRequest("user.killSession", { authId: auth.authId }).then(function() {
					row.style.opacity = .5;
					button.className = "";
					button.innerHTML = "Завершена";
					if (auth.authKey === API.authKey) {
						window.location.href = "\/login.php?act=logout";
					}
				});
			};

		wrap.appendChild(Site.getPageHeader("Сессии на APIdog"));
		wrap.appendChild(placeholder = e("div", {"class": "msg-empty", append: [
			e("div", {html: "Вы можете закрыть открытые сессии Вашего аккаунта на других устройствах/браузерах.<br \/><strong>Внимание!<\/strong> Этот список не имеет отношения к странице завершения сеансов на vk.com!"}),
			e("br"),
			e("div", {"class": "btn", html: "Открыть список", onclick: load})
		]}));
		return wrap;
	},


	themes: {
		page: function() {
			return new Promise(function(resolve) {
				var list,
					wrap = $.e("div", {append: [
						Settings.getTabs(),
						Site.getPageHeader("Темы для APIdog", $.e("a", {html: "Создать", target: "_blank", href: "?page=themeManager"})),
						list = $.e("div", {append: Site.Loader(true)})
					]});

				Site.append(wrap);
				Site.setHeader("Темы APIdog");
				resolve(list);
			});
		},

		/**
		 * Request for new themes
		 * @returns {Promise}
		 */
		request: function(list) {
			return APIdogRequest("themes.getList", { count: 250, offset: getOffset() }).then(function(data) {
				return {data: data, list: list}
			});
		},

		showList: function(data) {
			var list = data.list,
				result = data.data,

				items = result.items.map(function(theme) {
					Site.queueUser(theme.authorId);
					return theme;
				}),

				sl = new SmartList({
					data: {items: items},
					countPerPage: 20,
					getItemListNode: Settings.themes.getNodeItemList
				});

				e = $.e;

			$.elements.clearChild(list);

			list.appendChild(Site.getTabPanel([
				["settings?act=themes", "Все"],
				["settings?act=themes&onlyMy=1", "Мои"]
			]));

			list.appendChild(sl.getNode());

			/*list.appendChild(e("div", {"class": "sf-wrap", append: sorter = e("select", {onchange: function (event) {
				Settings.showSelectThemeCatalog(this.options[this.selectedIndex].value, Site.Get("onlyMy"));
			}, append: [
				e("option", {value: 2, html: "по количеству установок", selected: 1}),
				e("option", {value: 1, html: "по дате обновления"}),
				e("option", {value: 0, html: "по дате добавления"})
			]})}));*/


			Site.loadQueueUsers();
		},

		/**
		 *
		 * @param {APIdogTheme} theme
		 * @returns {HTMLElement}
		 */
		getNodeItemList: function(theme) {
			var e = $.e, isAuthor = API.userId === theme.authorId;
			return e("div", {"class": "sl-item theme-item", id: "__theme" + theme.themeId, append: [
				e("div", {"class": "sl-content-wrap", append: [
					e("div", {append: e("strong", {html: (theme.isPrivate ? "[private] " : "") + theme.title.safe() + (theme.version ? " v" + theme.version.safe() : "")}) }),
					e("div", {"class": "tip", append: [
						document.createTextNode("Обновлено: " + getDate(theme.date) + (this.changelog ? ", " : "")),
						this.changelog
							? e("span", {"class": "a", html: "лог изменений", onclick: function () {
								Settings.themes.showChangelog(theme, this);
							}})
							: null
					]}),

					e("div", {
						"class": "tip" + (isAuthor ? " a" : ""),
						html: "Установок: " + theme.installCount,
						onclick: isAuthor
							? function () {
								Settings.themes.showUserUses(theme.themeId, this);
							}
							: null
					}),

					e("div", {"class": "tip", append: [
						e("span", {html: "Автор: "}),
						e("a", {"class": "_im_link_" + this.authorId, html: "пользователь"})
					]})
				]}),

				e("div", {"class": "theme-actions", append: [
					e("div", {"class": "a", html: API.themeId === theme.themeId ? "Отключить" : "Установить", onclick: function() {
						var was = API.themeId === theme.themeId;
						Settings.themes.applyTheme(theme, this);
						this.textContent = was ? "Установить" : "Отключить";
					}}),

					isAuthor
						? e("a", {html: "Редактировать", target: "_blank", href: "?page=themeManager&id=" + theme.themeId})
						: null,

					isAuthor || API.isAdmin
						? e("div", {"class": "a", html: "Удалить", onclick: function() {
							Settings.themes.removeTheme(theme);
						}}) : null
				]})
			]})
		},

		/**
		 *
		 * @param {APIdogTheme} theme
		 * @param {*|HTMLElement} node
		 */
		showChangelog: function(theme, node) {

		},

		/**
		 *
		 * @param {int} themeId
		 * @param {*|HTMLElement} node
		 */
		showUserUses: function(themeId, node) {

		},

		/**
		 *
		 * @param {APIdogTheme} theme
		 * @param {*|HTMLElement|null} button
		 */
		applyTheme: function(theme, button) {
			Settings.themes.resetOldThemeStyle();

			if (!theme) {
				button.textContent = "Установить";
				APIdogRequest("themes.apply", { themeId: 0 }).then(Settings.themes.applied);
				return;
			}

			if (button) {
				button.textContent = "Отключить";
			}

			if (theme.themeId !== API.themeId) {
				getHead().appendChild($.e("style", {"class": Settings.themes.CLASS_USER_STYLE_THEME, rel: "stylesheet", href: theme.fileCSS}));
				API.themeId = theme.themeId;
			} else {
				API.themeId = 0;
			}

			APIdogRequest("themes.apply", { themeId: API.themeId }).then(Settings.themes.applied);
		},

		applied: function(result) {
			console.log("saved", result);
		},

		CLASS_USER_STYLE_THEME: "_ustl",

		resetOldThemeStyle: function() {
			Array.prototype.forEach.call(document.querySelectorAll("." + Settings.themes.CLASS_USER_STYLE_THEME), $.elements.remove);
			return true;
		},

		/**
		 *
		 * @param {APIdogTheme} theme
		 */
		removeTheme: function(theme) {

		}
	}
	,


/*
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
				}, function () {}, Support.showError);
				anyway();
			};


		var modal = new Modal({
				title: "Подтверждение",
				unclosableByBlock: true,
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


	safeCustomCSS: function (code) {
		var classes = [".avmn-wrap", ".apidog-a", "#_apidv", ".APIdog-ad-item", ".APIdog-ad-item", "ads.php", ".APIdog-ad-img", ".APIdog-ad-extend", ".APIdog-ad-description", ".APIdog-ad-button", ".teaser"];
		classes.forEach(function (cls) {
			code = code.replace(cls, ".fake");
		});
		return code;
	},

	applyCustomCSS: function ()
	{
		if (API.themeId && API.theme) {
			getHead().appendChild(new APIdogTheme(API.theme).getNodeStyle());
			if (API.theme && API.theme.fileJS) {
				getHead().appendChild($.e("script", {src: "/scripts/" + API.theme.fileJS, onload: function(e) {

				}}));
			}
		}

		Settings.redrawMBOClass();
	},
*/
	redrawMBOClass: function() {
		if (isEnabled(Setting.WARNING_ONLINE)) {
			getBody().classList.add("mbo-enabled");
		} else {
			getBody().classList.remove("mbo-enabled");
		}
	},

	smiles: {
		_key: "__usingSmiles",
		avaliable: "😊;😃;😉;😆;😜;😋;😍;😎;😒;😏;😔;😢;😭;😩;😨;😐;😌;😄;😇;😰;😲;😳;😷;😂;❤;😚;😕;😯;😦;😵;😠;😡;😝;😴;😘;😟;😬;😶;😪;😫;☺;😀;😥;😛;😖;😤;😣;😧;😑;😅;😮;😞;😙;😓;😁;😱;😈;👿;👽;👍;👎;☝;✌;👌;👏;👊;✋;🙏;👃;👆;👇;👈;💪;👂;💋;💩;❄;🍊;🍷;🍸;🎅;💦;👺;🐨;🔞;👹;⚽;⛅;🌟;🍌;🍺;🍻;🌹;🍅;🍒;🎁;🎂;🎄;🏁;🏆;🐎;🐏;🐜;🐫;🐮;🐃;🐻;🐼;🐅;🐓;🐘;💔;💭;🐶;🐱;🐷;🐑;⏳;⚾;⛄;☀;🌺;🌻;🌼;🌽;🍋;🍍;🍎;🍏;🍭;🌷;🌸;🍆;🍉;🍐;🍑;🍓;🍔;🍕;🍖;🍗;🍩;🎃;🎪;🎱;🎲;🎷;🎸;🎾;🏀;🏦;😸;😹;😼;😽;😾;😿;😻;🙀;😺;⏰;☁;☎;☕;♻;⚠;⚡;⛔;⛪;⛳;⛵;⛽;✂;✈;✉;✊;✏;✒;✨;🀄;🃏;🆘;🌂;🌍;🌛;🌝;🌞;🌰;🌱;🌲;🌳;🌴;🌵;🌾;🌿;🍀;🍁;🍂;🍃;🍄;🍇;🍈;🍚;🍛;🍜;🍝;🍞;🍟;🍠;🍡;🍢;🍣;🍤;🍥;🍦;🍧;🍨;🍪;🍫;🍬;🍮;🍯;🍰;🍱;🍲;🍳;🍴;🍵;🍶;🍹;🍼;🎀;🎈;🎉;🎊;🎋;🎌;🎍;🎎;🎏;🎐;🎒;🎓;🎣;🎤;🎧;🎨;🎩;🎫;🎬;🎭;🎯;🎰;🎳;🎴;🎹;🎺;🎻;🎽;🎿;🏂;🏃;🏄;🏇;🏈;🏉;??;🐀;🐁;🐂;🐄;🐆;🐇;🐈;🐉;🐊;🐋;🐌;🐍;🐐;🐒;🐔;🐕;🐖;🐗;🐙;🐚;🐛;🐝;🐞;🐟;🐠;🐡;🐢;🐣;🐤;🐥;🐦;🐧;🐩;🐪;🐬;🐭;🐯;🐰;🐲;🐳;🐴;🐵;🐸;🐹;🐺;🐽;🐾;👀;👄;👅;👋;👐;👑;👒;👓;👔;👕;👖;👗;👘;👙;👚;👛;👜;👝;👞;👟;👠;👡;👢;👣;👦;👧;👨;👩;👪;👫;👬;👭;👮;👯;👰;👱;👲;👳;👴;👵;👶;👷;👸;👻;👼;👾;💀;💁;💂;💃;💄;💅;💆;💇;💈;💉;💊;💌;💍;💎;💏;💐;💑;💒;💓;💕;💖;💗;💘;💙;💚;💛;💜;💝;💞;💟;💡;💣;💥;💧;💨;💬;💰;💳;💴;💵;💶;💷;💸;💺;💻;💼;💽;💾;💿;📄;📅;📇;📈;📉;📊;📋;📌;📍;📎;📐;📑;📒;📓;📔;📕;📖;📗;📘;📙;📚;📜;📝;📟;📠;📡;📢;📦;📭;📮;📯;📰;📱;📷;📹;📺;📻;📼;🔆;🔎;🔑;🔔;🔖;🔥;🔦;🔧;🔨;🔩;🔪;🔫;🔬;🔭;🔮;🔱;🗿;🙅;🙆;🙇;🙈;🙉;🙊;🙋;🙌;🙎;🚀;🚁;🚂;🚃;🚄;🚅;🚆;🚇;🚈;🚊;🚌;🚍;🚎;🚏;🚐;🚑;🚒;🚓;🚔;🚕;🚖;🚗;🚘;🚙;🚚;🚛;🚜;🚝;🚞;🚟;🚠;🚡;🚣;🚤;🚧;🚨;🚪;🚬;🚴;🚵;🚶;🚽;🚿;🛀;‼;⁉;ℹ;↔;↕;↖;↗;↘;↙;↩;↪;⌚;⌛;⏩;⏪;⏫;⏬;Ⓜ;▪;▫;▶;◀;◻;◼;◽;◾;☑;☔;♈;♉;♊;♋;♌;♍;♎;♏;♐;♑;♒;♓;♠;♣;♥;♦;♨;♿;⚓;⚪;⚫;⛎;⛲;⛺;✅;✔;✖;✳;✴;❇;❌;❎;❓;❔;❕;❗;➕;➖;➗;➡;➰;➿;⤴;⤵;⬅;⬆;⬇;⬛;⬜;⭐;⭕;〰;〽;🅰;🅱;🅾;🅿;🆎;🆑;🆒;🆓;🆔;🆕;🆖;🈁;🌀;🌁;🌃;🌄;🌅;🌆;🌇;🌈;🌉;🌊;🌋;🌌;🌎;🌏;🌐;🌑;🌒;🌓;🌔;🌕;🌖;🌗;🌘;🌙;🌚;🌜;🌠;🍘;🍙;🎆;🎇;🎑;🎠;🎡;🎢;🎥;🎦;🎮;🎵;🎶;🎼;🏠;🏡;🏢;🏣;🏤;🏥;🏧;🏨;🏩;🏪;🏫;🏬;🏭;🏮;🏯;🏰;👉;👥;💠;💢;💤;💫;💮;💯;💱;💲;💹;📀;📁;📂;📃;📆;📏;📛;📞;📣;📤;📥;📧;📨;📩;📪;📫;📬;📲;📳;📴;📵;📶;🔀;🔁;🔂;🔃;🔄;🔅;🔇;🔈;🔉;🔊;🔋;🔌;🔍;🔏;🔐;🔒;🔓;🔕;🔗;🔘;🔙;🔚;🔛;🔜;🔝;🔟;🔠;🔡;🔢;🔣;🔤;🔯;🔲;🔳;🔴;🔵;🔶;🔷;🔸;🔹;🔺;🔻;🔼;🔽;🗻;🗼;🗽;🗾;😗;🙍;🚉;🚋;🚢;🚥;🚦;🚩;🚫;🚭;🚮;🚯;🚰;🚱;🚲;🚳;🚷;🚸;🚹;🚺;🚻;🚼;🚾;🛁;🛂;🛃;🛄;🛅;⌨;⏭;⏮;⏯;⏱;⏲;⏸;⏹;⏺;☂;☃;☄;☘;☠;☢;☣;☦;☪;☮;☯;☸;☹;⚒;⚔;⚖;⚗;⚙;⚛;⚜;⚰;⚱;⛈;⛏;⛑;⛓;⛩;⛰;⛱;⛴;⛷;⛸;⛹;✍;✝;✡;❣;🌡;🌤;🌥;🌦;🌧;🌨;🌩;🌪;🌫;🌬;🌭;🌮;🌯;🌶;🍽;🍾;🍿;🎖;🎗;🎙;🎚;🎛;🎞;🎟;🏅;🏋;🏌;🏍;🏎;🏏;🏐;🏑;🏒;🏓;🏔;🏕;🏖;🏗;🏘;🏙;🏚;🏛;🏜;🏝;🏞;🏟;🏳;🏴;🏵;🏷;🏸;🏹;🏺;🐿;👁;📸;📽;📿;🕉;🕊;🕋;🕌;🕍;🕎;🕯;🕰;🕳;🕴;🕵;🕶;🕷;🕸;🕹;🖇;🖊;🖋;🖌;🖍;🖐;🖖;🖥;🖨;🖱;🖲;🖼;🗂;🗃;🗄;🗑;🗒;🗓;🗜;🗝;🗞;🗡;🗣;🗯;🗳;🗺;🙁;🙂;🙃;🙄;🛋;🛌;🛍;🛎;🛏;🛐;🛠;🛡;🛢;🛣;🛤;🛥;🛩;🛫;🛬;🛰;🛳;🤐;🤑;🤒;🤓;🤔;🤕;🤖;🤗;🤘;🦀;🦁;🦂;🦃;🦄;🧀;🗨".split(";"),
		defaultSet: "😊;😃;😉;😄;😆;😂;😎;❤;😚;😘;😙;😗;😍;☺;😏;😇;😌;😔;😒;😕;😩;😟;😣;😖;😥;😓;😢;😭;😫;😑;😠;😡;😨;😬;😝;😜;😋;😱;😳;😵;😯;😮;😶;😈;👿;😸;😹;😼;😽;😾;😿;😻;🙀;😺;👍;👎;☝;✌;👌;👏;👊;💪;✋;👋;🙏;🐓;🐶;🐠;🙈;🙉;🌹;🌲;💔;💌;👻;💂;🍊;🍷;🍸;🍌;🍅;🍎;🍏;🍆;🍔;🍞;🔊;🎂;🎃;🎈;🎉;🎊;⚽;🏁;🏆;⏳;💡;💻;📢;🔎;🔦;🔞;⚠;‼;✅;❎;✖;✉;💾;✨;🌚;🌝;🌞;🏦;❄;⛅;☁;💦;☀;⚡;🌂;🐘;♥;👀;🎁;🗿 ",
		used: $.localStorage("__usingSmiles") && $.localStorage("__usingSmiles").split(";") || null,

		isUsed: function (symbol) {
			return !!~Settings.smiles.used.indexOf(symbol);
		},

		getCode: function(s) {
			var i=0,b="",a="",n,y=[],c=[],d,l,j=!1,f=!1,o;while(n=s.charCodeAt(i++)){d=n.toString(16).toUpperCase();l=s.charAt(i-1);if(i===2&&n===8419){c.push("003"+s.charAt(0)+"20E3");y.push(s.charAt(0));b='';a='';continue}b+=d;a+=l;if(!l.match(emojiCharSequence)){c.push(b);y.push(a);b='';a=''}}if(b){c.push(b);y.push(a)}b="";a="";for(var i in c){d=c[i];l=y[i];if(l.match(/\uD83C[\uDFFB-\uDFFF]/)){b+=d;a+=l;continue}if(j){b+=d;a+=l;j=!1;continue}if(d==="200C"||d==="200D"){if(b){j=!0;continue}else o+=l}if(l.match(/\uD83C[\uDDE6-\uDDFF]/)){if(f){b+=d;a+=l;f=!1;continue}f=!0;}else if(f)f=!1;b=d;a=l}return b;
		},

		showSettings: function () {
			var e = $.e,
				wrap = e("div"),
				list = e("div"),
				c,
				item = function(s) {
					c = Settings.smiles.getCode(s);
					if (c === "FFFD")
						return;
					return e("img", {
						"class": "settings-smile" + (Settings.smiles.isUsed(s) ? " settings-smile-active" : ""),
						"data-symbol": s,
						onclick: function() {
							$.elements.toggleClass(this, "settings-smile-active");
							rewrite();
						},
						src: "\/\/vk.com\/images\/emoji\/" + c + "_2x.png",
						alt: s
					});
				},
				rewrite = function() {
					var d = Array.prototype.map.call(list.querySelectorAll(".settings-smile-active"), function(node) {
						return node.getAttribute("data-symbol");
					});
					Settings.smiles.used = d;
					$.localStorage("__usingSmiles", d.join(";"));
				};

			list = e("div", {append: Settings.smiles.avaliable.map(item)});

			wrap.appendChild(Settings.getTabs());
			wrap.appendChild(Site.getPageHeader("Смайлы"));
			wrap.appendChild(list);
			Site.append(wrap);
			Site.setHeader("Смайлы");
		}
	}
};

if (!Settings.smiles.used) {
	$.localStorage("__usingSmiles", Settings.smiles.defaultSet);
	Settings.smiles.used = Settings.smiles.defaultSet.split(";");
}

function setStyleRule(selector, rule) {
	var stylesheet = document.styleSheets[(document.styleSheets.length - 1)];

	for( var i in document.styleSheets ){
		if( document.styleSheets[i].href && document.styleSheets[i].href.indexOf("default.min.css") ) {
			stylesheet = document.styleSheets[i];
			break;
		}
	}

	if (!stylesheet) {
		return;
	}

	if( stylesheet.addRule ){
		stylesheet.addRule(selector, rule);
	} else if( stylesheet.insertRule ){
		stylesheet.insertRule(selector + ' { ' + rule + ' }', stylesheet.cssRules.length);
	}
}

/*
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
	this.isAuthor = API.userId == t.authorId;
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
			}, Support.showError);
		};
	},
	deleteConfirm: function () {
		var themeId = this.themeId, node = this.node;
		VKConfirm("Вы уверены, что хотите удалить эту тему? Она перестанет работать у всех, кто поставил её у себя", function (ok) {
			APIdogRequest("themes.delete", { themeId: themeId }, function (result) {
				$.elements.remove(node);
			}, Support.showError);
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
};*/

