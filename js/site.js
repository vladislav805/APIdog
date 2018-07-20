var Site = {

	/**
	 * Show user info on initialization
	 * @param {User} u
	 */
	showUser: function(u) {
		g("_link").href = "#" + (u.screen_name || "id" + u.id);
		g("_name").textContent = u.first_name;
		g("_photo").src = getURL(u.photo_50);

		var menuLink = g("_linkMenu");
		menuLink.href = "#" + (u.screen_name || "id" + u.id);
		menuLink.querySelector("strong").textContent = u.first_name;
		menuLink.querySelector("img").src = getURL(u.photo_50);
		menuLink.querySelector(".menu-profile-background").style.backgroundImage = "url(" + getURL(u.photo_50) + ")";
	},


	/**
	 * @deprecated
	 * @param {string} method
	 * @param {object} params
	 * @param {function} callback
	 */
	API: function(method, params, callback) {
		api(method, params).then(function(response) {
			callback({response: response});
		}).catch(function(error) {
			callback({error: error});
		});
	},

	/**
	 * @deprecated
	 * @param {string} method
	 * @param {object} params
	 * @param {function} callback
	 */
	APIv5: function (method, params, callback) {
		return Site.API("execute", {code: "return API." + method + "(" + Site.stringifyExecuteParams(params) + ");"}, callback);
	},

	/**
	 * @deprecated
	 */
	stringifyExecuteParams: function (params) {
		var pairs = [];
		for (var key in params) {
			if (!params.hasOwnProperty(key)) {
				continue;
			}
			pairs.push(key + ":" + (!isNaN(params[key]) ? null === params[key] || "" === params[key] ? "\"\"" :  params[key] : "\"" + params[key].replace(/\\/img, "\\\\").replace(/"/igm, "\\\"").replace(/\n/img, "\\n") + "\""));
		}
		return pairs.length ? "{" + pairs.join(",") + "}" : "";
	},

	/**
	 * @deprecated
	 */
	isResponse: function(data) {
		if (data && data.response)
			return data.response;
		else
			try {
				switch (data.error.error_code) {
					case 5:
						if (confirm("Сессия устарела.\nЕсли Вы меняли пароль или сбрасывали сессии, пожалуйста, нажмите 'ОК' и переавторизауйтесь.\nВ противном случае, нажмите 'Отмена' и попробуйте позже. Возможно, это проблемы на нашей стороне.\n\nAPIErr5")) {
							window.location.href = "/authorize.php?act=logout&debug=1";
						}
						return;

					case 14:
						Site.showCaptcha(data.error);
						break;

					default:
						Site.Alert({
							text: "Ошибка от API:<br/><tt>" + (data.error.error_text || Errors[data.error.error_code] || data.error.error_msg) + "</tt>"
						});
						break;
				}
			} catch (e) {}
	},

	showCaptcha: function(p) {
		var e = $.e,
			captchaId = p.captcha_sid,
			url = p.captcha_img,
			textarea,
			m = new Modal({
				width: 280,
				title: "Captcha",
				content: e("div", {"class": "captcha", append: [
					e("img", {src: isEnabled(Setting.USING_PROXY) ? "\/proxy?t=png&u=" + encodeURIComponent(url) : url}),
					textarea = e("input", {"class": "sizefix", type: "text", name: "text", maxlength: 10, autocomplete: "off"})
				]}),
				footer: [
					{
						name: "retry",
						title: Lang.get("general.retry"),
						onclick: function () {
							m.close();
							Site.reCaptcha(captchaId, textarea.value.trim(), p.request_params)
						}
					},
					{
						name: "cancel",
						title: Lang.get("general.cancel"),
						onclick: function () {
							m.close();
						}
					}
				]
			}).show();
	},

	reCaptcha: function(captchaId, captchaKey, params) {
		var p = {};
		(params || []).forEach(function (i) {
			p[i.key] = i.value;
		});
		var method = p.method, callback = p.callback;
		delete p.method;
		delete p.callback;
		p.captcha_sid = captchaId;
		p.captcha_key = captchaKey;
		Site.API(method, p, callback);
		return false;
	},

	SECTIONS: ["friends","messages","photos","videos","groups","notifications"],

	setCounters: function(data) {
		data = data || Site.counters || {};
		Site.SECTIONS.forEach(function(name) {
			q("[data-menu='" + name + "']").dataset.count = data[name] || 0;
		});
		Site.counters = data;
	},

	onClickHead: function(event, node) {
		var u;
		if (u = node.getAttribute("data-url")) {
			setLocation(u);
		} else if (u = node.onclicked) {
			u();
			node.onclicked = null;
		}
	},

	getStickerAttachment: function(sticker) {
		return $.e("img", {
			style: "margin: 4px 0",
			src: (isEnabled(Setting.USING_PROXY) ? "\/\/static.apidog.ru\/proxed\/stickers\/%sb.png" : EmotionController.SCHEMA_STICKER_IMAGE_ITEM).schema({s: sticker.id}),
			alt: "Стикер"
		});
	},


	/**
	 * updated 04/07/2015 from v6.5
	 * updated 01/10/2017 from v6.4.6: added defaultValue
	 * @param {string=} param
	 * @param {*=} defaultValue
	 * @returns {object|string}
	 */
	get: function(param, defaultValue) {
		var hash = window.location.hash.replace("#", ""), offset, params = {};

		hash = hash.slice(hash.indexOf("?") + 1).split("&");

		hash.forEach(function(item) {
			offset = item.indexOf("=");
			params[item.slice(0, offset)] = decodeURIComponent(item.slice(++offset));
		});

		return param ? (params[param] || defaultValue) : params;
	},

	/**
	 * @deprecated
	 * @param {string} param
	 * @param {boolean=} real
	 * @return {number|string}
	 */
	Get: function(param, real) {
		var result = Site.get(param);
		return !real && !result ? 0 : result;
	},


	route: function(url) {
		if (!url) {
			url = window.location.hash.substring(1);
		}

		if (Site.get("w") || Site.get("z")) {
			return window.location.hash = "#" + (Site.get("w") || Site.get("z"));
		}

		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;

		url = url.split("?")[0].replace("#", "");
		var reg = {
			Friends:    /^friends?$/ig,
			Feed:       /^feed$/ig,
			Wall:       /^wall(-?\d+)?(_\d+)?$/ig,
			Poll:       /^poll(-?\d+)_(\d+)$/ig,
			Photos:     /^((photos(-?\d+)?(_-?\d+)?)|(photo(-?\d+)_(\d+)))$/ig,
			Video:      /^((videos(-?\d+)?(_-?\d+)?)|(video(-?\d+)_(\d+)))$/ig,
			Audios:     /^audios?(-?\d+)?(_(\d+))?$/ig,
			Groups:     /^groups$/ig,
			Docs:       /^(docs(-?\d+)?|doc(-?\d+)_(\d+))$/ig,
			Search:     /^search$/ig,
			Settings:   /^settings$/ig,
			Board:      /^(board|topic-?)(\d+_?\d*)$/ig,
			Fave:       /^fave$/ig,
			Gifts:      /^gifts$/ig,
			Places:     /^places?$/ig,
			Notes:      /^(notes(\d+)?|note(\d+)_(\d+))$/ig,
			Pages:      /^(pages|page(-?\d+)_(\d+))$/ig,
			Apps:       /^apps$/ig,
			Polls:      /^poll(-?\d+)_(\d+)$/ig,
			Dev:		/^dev(\/([A-Za-z0-9._]+))?$/ig,
			Analyzes:	/^analyzes(\/([A-Za-z]+)(\/(-?\d+))?)?$/ig
		};

		if (/^([^\/]+)\/([^?]+)/img.test(url)) {
			var r = /^([^\/]+)\/([^?]+)/img.exec(url);
			switch (r[1]) {
				case "dev": return Dev.explain(r[2]);
				case "stickers": return Settings.store.getItem(r[2]);
				case "analyzes": return Analyzes.open.apply(window, r[2].split("/"));
				case "images": return window.location.href = "//vk.com/" + url;
				default: return Feed.searchByOwner(r[1], r[2], getOffset());
			}
		}

		//noinspection JSUnresolvedFunction,JSUnresolvedVariable
		window.ga&&ga('send', 'pageview');
		window.onLeavePage && window.onLeavePage();

		window.onResizeCallback = null;
		window.onKeyDownCallback = null;
		window.onScrollCallback = null;
		window.onLeavePage = null;
		window.onDragEnter = null;
		window.onDragLeave = null;
		window.onDropped = null;

		url = url
			.replace(/^event(\d+)$/ig, "club$1")
			.replace(/^public(\d+)$/ig, "club$1")
			.replace(/^album(-?\d+)_(-?\d+)$/ig, "photos$1_$2")
			.replace(/^write(\d+)$/img, "im?to=$1");

		Audios.miniPlayer.hide();
		Menu.hide();

		if (reg.Photos.test(url))
			return Photos.route(url);
		if (reg.Video.test(url))
			return Video.Resolve(url);

		if (reg.Audios.test(url))
			return Audios.route();

		if (reg.Wall.test(url))
			return Wall.Resolve(url);

		if (reg.Friends.test(url))
			return Friends.explain();

		if ((/^mail$/ig.test(url) || /^im$/ig.test(url)))
			return IM.Resolve(url);

		if (reg.Pages.test(url))
			return Pages.explain(url);
		if (reg.Docs.test(url))
			return Docs.explain(url);
		if (reg.Analyzes.test(url))
			return Analyzes.open();
		for (var current in reg) {
			if (reg[current].test(url)) {
				var id = url.replace(new RegExp(current, "igm"), "");
				if (!id)
					id = API.userId;
				window[current].RequestPage(id);
				return;
			}
		}

		Site.requestPageByScreenName(url);

	},

	/**
	 * @param {string} screenName
	 */
	requestPageByScreenName: function(screenName) {
		api("execute", {
			code:'var c=API.account.getCounters(),d=API.utils.resolveScreenName({screen_name:Args.q}),w=d.object_id,o=parseInt(Args.o);if(!d.length)return{t:0};if(d.type=="user"){API.stats.viewUser({user_id:w});var u=API.users.get({user_ids:w,fields:Args.f})[0];return{t:"u",c:c,w:API.wall.get({owner_id:w,extended:1,offset:o,count:25}),u:u,e:{p:API.wall.get({owner_id:w,filter:"postponed"}).count}};}else if(d.type=="group"){API.stats.viewGroup({group_id:w});var g=API.groups.getById({group_id:w,fields:Args.f,extended:1})[0];return{t:"g",c:c,w:API.wall.get({owner_id:-w,extended:1,offset:o,count:25}),g:g,e:{s:API.wall.get({owner_id:-w,filter:"suggests"}).count,p:API.wall.get({owner_id:-w,filter:"postponed"}).count},r:API.groups.getRequests({group_id:w}).count};}else return{t:"a",a:API.apps.get({app_id:w,extended:1}),c:c};',
			q: screenName,
			o: getOffset(),
			f: "description,wiki_page,members_count,links,activity,place,ban_info,start_date,finish_date,sex,photo_50,photo_100,photo_200,friend_status,photo_id,maiden_name,online,last_seen,counters,activites,bdate,can_write_private_message,status,can_post,city,country,exports,screen_name,blacklisted,blacklisted_by_me,are_friends,first_name_gen,first_name_ins,site,common_count,contacts,relation,nickname,home_town,verified,can_see_gifts,is_favorite,cover,friend_status,crop_photo,member_status,can_message",
			v: 5.64
		}).then(function(result) {
			Site.setCounters(result.c);
			switch (result.t) {
				case "u":
					return Profile.display(result.u, result.w);

				case "g":
					return Groups.display(result.g, result.w);

				case "a":
					return Apps.display(result.a);

				default:
					//new Snackbar({text: "О_о", duration: 1000}).show();
			}
		}).catch(function(e) {
			console.error(e);
		});
	},


	queue: [],

	queueTimer: 0,

	/**
	 * @param {int} userId
	 */
	queueUser: function(userId) {
		if (~Site.queue.indexOf(userId)) {
			return;
		}

		Site.queue.push(userId);

		Site.queueTimer && clearTimeout(Site.queueTimer);

		Site.queueTimer = setTimeout(Site.loadQueueUsers, 1000);
	},

	loadQueueUsers: function() {
		var userIds = Site.queue, users = [], groups = [];

		userIds.forEach(function(i) {
			(i > 0 ? users : groups).push(Math.abs(i) || 0);
		});

		Site.queue.length = 0;

		api("execute", {
			code: "return{u:API.users.get({user_ids:Args.u,fields:Args.f}),g:API.groups.getById({group_ids:Args.g})};",
			u: users.join(","),
			g: groups.join(","),
			f: "online,screen_name,photo_50,photo_100",
			v:5.28
		}).then(function(data) {
			Local.add(data.u);
			Local.add(data.g);
			data = data.u.concat(data.g || []);
			var nodes, id;
			Array.prototype.forEach.call(data, function (i) {
				id = i.name ? -i.id : i.id;
				nodes = document.querySelectorAll("._im_link_" + id);
				Array.prototype.forEach.call(nodes, function (node) {
					console.log("Loaded info about " + (i.name ? -i.id : i.id));
					switch (node.tagName.toLowerCase()) {
						case "a":
							if (!node.children.length)
								node.innerHTML = getName(i);
							node.href = "#" + (i.screen_name || (id > 0 ? "id" : "club") + i.id);
							break;
						case "img":
							node.src = i.photo_50 || i.photo_100 || i.photo;
							break;
						case "strong":
							node.innerHTML = getName(i);
							break;
					}
				});
			});
		}).catch(function(error) {
			console.error("unable to load info about users", error);
		});
	},

	_ldr: null,
	Loader: function (isReturn) {
		var elem = Site._ldr ? Site._ldr : (Site._ldr = $.e("div", {style: "padding: 90px 0", append: $.e("div", {"class": "loader-line"})}));
		return !isReturn ? Site.append(elem) : elem;
	},

	append: function(node) {
		$.elements.clearChild(g("content")).appendChild(node);
		return this;
	},

	/**
	 * Returns icon of online for user
	 * @param {User} data
	 */
	isOnline: function(data) {
		if (data && data.online) {
			if (data.online_app) {
				var title, className;

				switch (parseInt(data.online_app)) {
					case 3682744:
					case 2847524:
					case 3133286:
						title = "iPad";
						className = "iphone";
						break;

					case 3087106:
					case 3140623:
						title = "iPhone";
						className = "iphone";
						break;

					case 2274003:
						title = "Android";
						className = "android";
						break;

					case 3697615:
						title = "Windows 8";
						className = "wp";
						break;

					case 3502557:
					case 2424737:
					case 3502561:
						title = "Windows Phone";
						className = "wp";
						break;

					case 2685278:
					case 1997282:
						title = "Kate Mobile (Android)";
						className = "kate";
						break;

					case 3698024:
						title = "Instagram";
						className = "instagram"; // TODO
						break;

					case 5027722:
						title = "VK Messenger Desktop";
						className = "vkdesktop"; // TODO
						break;

					default:
						title = "unknown (" + data.online_app + ")";
						className = "other";
				}
			} else {
				if (data.online_mobile) {
					title = "m.vk.com";
					className = "mobile";
				} else {
					title = "vk.com";
					className = "full";
				}
			}

			return " <div class='online online-" + className + "' data-title='" + title + "' data-last-seen='" + (data.last_seen && data.last_seen.time || 0) + "'></div> ";
		}

		return "";
	},

	initOnlineTooltips: function() {
		Array.prototype.forEach.call(document.querySelectorAll(".online:not([data-online-tooltip-init])"), function(item) {
			item.dataset.onlineTooltipInit = 1;
			//noinspection JSUnresolvedVariable
			bindTooltip(item, {
				content: "Использует " + item.dataset.title + (+item.dataset.lastSeen
					? "<br>Последний раз: " + new Date(item.dataset.lastSeen * 1000).relative()
					: ""
				)
			});
		});
	},

	/**
	 *
	 * @param {User} fields
	 * @returns {string}
	 */
	isVerify: function(fields) {
		return fields && fields.verified ? " <div class=\"online-verify\"></div> " : "";
	},

	/**
	 * @param {User} data
	 * @returns {string}
	 */
	getLastSeenString: function(data) {
		var s = data.last_seen,
			icon = s && s.platform ? ' <div class="online online-' + ["mobile", "iphone", "iphone", "android", "wp", "wp"][s.platform - 1] + '"><\/div>' : "";
		return data.online
			? ""
			: (
				s && s.platform
					? " <span class='tip'>" + (Lang.get("profiles.profile_was_in")[data.sex]) + " " + getDate(s.time) + icon + "<\/span>"
					: ""
			);
	},

	toHTML: function(str) {
		str = str
			.replace(/<br\s?\/?>/img, "\n")
			.replace(/</img, "&lt;")
			.replace(/>/img, "&gt;")
			.replace(/(\r|\n)/img, "<br \/>")
			.replace(/(\n|\r|^)#([A-Za-zА-Яа-яЁё0-9іїґє][A-Za-z0-9А-Яа-яЁё_іїґє]+)@([A-Za-z0-9_.-]+)/ig, "<a href=\"&#35;$3?act=search&q=&#35;$2\">&#35;$2@$3<\/a>")
			.replace(/(\n|\r|^)#([A-Za-zА-Яа-яЁёіїґє][A-Za-z0-9А-Яа-яЁё_іїґє]+)/ig, "<a href=\"&#35;feed?act=search&q=&#35;$2\">&#35;$2<\/a>")
			.replace(/((https?|browser):\/\/)?(([A-Za-zА-Яа-яЁё0-9-][A-Za-zА-Яа-яЁё0-9-]*\.)+(ru|рф|com\.ru|org\.ru|net\.ru|pp\.ru|edu\.ru|fm|ac\.ru|int\.ru|msk\.ru|spb\.ru|ru\.com|ru\.net|cat|su|ua|com\.ua|net\.ua|org\.ua|edu\.ua|gov\.ua|biz\.ua|in\.ua|kz|by|am|az|kg|ge|tj|tm|uz|lv|lt|ee|eu|asia|com|academy|net|org|edu|gov|int|biz|info|aero|coop|museum|name|law\.pro|cpa\.pro|med\.pro|xxx|us|ca|co\.uk|me\.uk|org\.uk|ltd\.uk|plc\.uk|de|com\.fr|ac|ag|as|at|be|br|cc|ch|cz|co\.id|do|web\.id|net\.id|ie|il|in|is|it|jp|li|lu|me|ms|com\.mx|no|nu|pl|sh|tk|to|tv|tw|ws|yandex|google|vk|travel|gl|co|media|ml|ga|gq|io|sk|ly|city|moscow|pro|gs|ph))(\/([A-Za-z\u0410-\u042f\u0430-\u044f0-9@\-_#%&?+\/.=!;:~]*[^\.\[\]\,;\(\)\?<\&\s:])?)?/img, function(a) {

				if (emojiRegExp.test(a)) {
					return a;
				}

				try {
					a = decodeURI(a);
				} finally {
					if (!/^https?:/ig.test(a)) {
						a = "http:\/\/" + a;
					}
				}

				var url = new URL(a),

					isInternal = url.hostname === location.hostname,
					attr = [];

				if ((~url.hostname.indexOf("vk.com") || ~url.hostname.indexOf("apidog.ru")) && !/^(photo|video|audio|market\d+|album\d+|topic\d+|page-\d+|feed$|groups$|fave$|wall-?\d+)/img.test(url.pathname)) {
					attr.push("onmouseenter=\"Site.overLinkUser(this, '" + (~url.hostname.indexOf("apidog.ru") ? url.hash : url.pathname).substring(1) + "')\"");
				}

				if (~url.hostname.indexOf("vk.com")) {
					if (isEnabled(Setting.AVOID_VK_LINKS)) {
						url.hostname = location.hostname;
						url.hash = "#" + url.pathname.substring(1);
						url.pathname = location.pathname;
					} else {
						attr.push("onclick=\"return Site.openExternalLink(this, event);\"");
					}
				}

				if (url.hostname === "vk.cc" || url.hostname === "goo.gl") {
					attr.push("onmouseenter=\"Site.fetchShortLinkVKCC(this)\"");
				}



				attr.push("href=\"" + url.toString() + "\"");

				if (!isInternal) {
					attr.push("target=\"_blank\"");
				}

				return "<a " + attr.join(" ") + ">" + (a.length > 100 ? a.substr(0, 120) + "..." : a) + "</a>";
			})
			.replace(/\[([A-Za-z0-9_]+)(:bp-\d+_\d+)?\|([^\]]+)\]/mig,"<a href=\"&#35;$1\" onmouseenter=\"Site.overLinkUser(this, '$1')\">$3<\/a>")
			.replace(/%23/img, "#");
		return str;
	},

	/**
	 * Callback for click on external link
	 * @param {HTMLAnchorElement} link
	 * @param {Event} event
	 */
	openExternalLink: function(link, event) {
		event.cancelBubble = true;
		event.stopPropagation();
		VKConfirm("Вы уверены, что хотите открыть эту ссылку? После перехода по этой ссылке Вы можете стать онлайн! Продолжить?", function() {
			window.open(link.href);
		}, link);
		return false;
	},

	fetchShortLinkVKCC: function(node) {
		if (node.dataset.requested) {
			return;
		}

		var tooltip = bindTooltip(node, {
			content: "Загрузка..."
		});

		node.dataset.requested = "1";
		api("utils.checkLink", {url: node.href}).then(function(res) {
			tooltip.setContent(res.link);
		});
	},

	/**
	 *
	 * @param {HTMLAnchorElement} node
	 * @param {string} user
	 */
	overLinkUser: function(node, user) {
		if (node.dataset.requested) {
			return;
		}
		node.dataset.requested = "1";
		var l = user;
		if (/^(photo|video|audio|market\d+|album\d+|topic\d+|page-\d+|feed$|groups$|fave|wall-?\d+$)/img.test(l)) {
			return;
		}
		var tooltip = bindTooltip(node, {
			content: "Загрузка...",
			width: 280
		});
		api("execute", {
			code: "var l=Args.l,t=API.utils.resolveScreenName({screen_name:l});if(t.type==\"user\"){return API.users.get({user_ids:t.object_id,fields:Args.f})[0];}else if(t.type==\"group\"){return API.groups.getById({group_id:t.object_id,fields:Args.f})[0];}else if(t.type==\"application\"){return API.apps.get({app_ids:l.object_id})[0];}return null;",
			l: l,
			f: "photo_100,online,last_seen,members_count",
			v: 5.56
		}).then(function(res) {
			tooltip.setIcon(res.photo_100);
			tooltip.setContent(getName(res) + "<br>" + (res.last_seen ? getDate(res.last_seen.time, APIDOG_DATE_FORMAT_SMART) : (res.members_count ? "Участников: " + res.members_count : "")));
		});
	},

	/**
	 * Set title in header
	 * @param {string} title
	 * @param {{link: string=, fx: callback=}=} back
	 */
	setHeader: function(title, back) {
		g("_header").innerHTML = title;
		document.title = "APIdog | " + title;
		Site.setBackButton(back);
	},

	/**
	 * Set header action
	 * @param {{link: string=, fx: callback=}} obj
	 */
	setBackButton: function (obj) {
		var link = $.element("miniplayer");
		if (!obj) {
			link.setAttribute("data-url", "");
			link.onclicked = null;
		} else {
			if (obj.link) {
				link.setAttribute("data-url", obj.link);
			}

			if (obj.fx) {
				link.onclicked = obj.fx;
			}
		}
	},

	/**
	 * @param {string} text
	 * @returns {HTMLElement}
	 */
	getEmptyField: function(text) {
		return $.e("div", {"class": "msg-empty", html: text});
	},

	showNewNotifications: function (data) {
		if (!data) return;
		Local.add(data.profiles.concat(data.groups));
		data = data.items;
		var u = Local.data;

		data.forEach(function (i) {
			var ownerId, itemId, type, feed, parent, iText, iImage, iLink, user, users, text, userPhoto;
			iText = null; iImage = null; iLink = null;
			feed = i.feedback;
			parent = i.parent;
			userPhoto = false;
			type = i.type;
			switch (type) {
				case "like_post":
				case "like_comment":
				case "like_photo":
				case "like_video":
					if (!isNotification(2)) return;
					type = type.replace("like_", "");
					users = (function (users) {
						user = u[users[0].from_id];
						userPhoto = user.photo_50;
						text = user.first_name + " " + user.last_name;
						if (users.length > 1)
							text += " и ещё " + (users.length - 1) + " пользователь ";
						text += " liked your " + type;
						return text;
					})(feed.items);
					iText = users;
					iImage = getURL(parent && parent.photo_130 || userPhoto);
					iLink = "feed?act=notifications";
					break;

				case "reply_comment":
				case "reply_comment_photo":
				case "reply_comment_video":
					if (!isNotification(16)) return;
					type = type.replace(/^reply_/ig, "");
					if (!feed.to_id) {
						feed.to_id = parent.to_id || parent.from_id;
						if (type === "wall")
							feed.to_id = parent.post.to_id;
					}
					var creator = u[feed.from_id];
					var link = [
						type,
						{
							wall: parent.post && parent.post.to_id,
							photo: parent.owner_id,
							video: parent.owner_id
						}[type],
						"_" + (type === "wall" ? parent.post.id : parent.id)
					].join("");
					iImage = creator.photo_50;
					iText = "<strong>" + getName(creator) + "<\/strong> replied to your comment<br>" + Site.toHTML(feed.text).emoji();
					iLink = link;
					break;

				case "follow":
					if (!isNotification(32)) return;
					feed = feed.items[0];
					user = u[feed.from_id];
					iText = user.first_name + " " + user.last_name + " was followed you";
					iImage = user.photo_50;
					iLink = (user.screen_name || "id" + user.id);
					break;
			}

			if (iText) {
				Site.Alert({
					text: iText,
					icon: iImage,
					click: (function (l) {
						return function () {
							window.location.hash = "#" + l;
						}
					})(iLink)
				});
			}
		});
	},

	/**
	 * Create wrapper and content of attachments
	 * @param {Attachment[]} attachments
	 * @param {string=} id
	 */
	createNodeAttachments: function(attachments, id) {
		var wrap = $.e("div", {"class": "attachments-wrap"});

		if (!attachments) {
			return wrap;
		}

		var photos = [],
			photosItems = [],
			videos = [],
			audios = [],
			docs = [],
			link = null,
			page = null,
			albums = [],
			sticker = null,
			poll = null,
			note = null,
			wall = [],
			reply = null,
			audioIdList = Date.now(),
			ass = {}, i, a;


		attachments.forEach(function(item) {
			ass[item.type] ? ass[item.type]++ : (ass[item.type] = 1);
		});

		for (i = 0; a = attachments[i]; ++i) {
			switch (a.type) {

				case "photo": // TODO
					photos.push(Photos.getAttachment(a.photo, {list: id, full: ass.photo === 1, from: getAddress(true)}));
					photosItems.push(a.photo);
					break;

				case "video": // TODO
					videos.push(Video.getAttachment(a.video, {from: true}));
					break;

				case "audio": // TODO
					/*audio = a.audio;
					audio.aid = audio.aid || audio.id;
					audios.push(Audios.Item(audio, {lid: audioIdList, from: 8}));
					Audios.Lists[audioIdList].push(audio.owner_id + "_" + (audio.aid || audio.id));
					Audios.Data[audio.owner_id + "_" + (audio.aid || audio.id)] = audio;*/
					audios.push(new VKAudio(a.audio).getNodeItem());
					break;

				case "doc":
					docs.push(new VKDocument(a.doc).getNodeItem({ onClick: function(ownerId, documentId, document) {
						window.open(document.url);
					}}));
					break;

				case "link":
					link = new VKLink(a.link).getNodeItem();
					break;

				case "poll":
					if (a.poll && !a.poll.answers)
						continue;
					poll = Polls.getFullAttachment(a.poll);
					break;

				case "sticker": // TODO
					sticker = Site.getStickerAttachment(a.sticker);
					break;

				case "wall":
					wall.push(Wall.getWallAttachment(a.wall));
					break;

				case "page": // TODO
					page = Pages.getAttachment(a.page);
					break;

				case "note":
					note = Notes.getAttachment(a.note);
					break;

				case "wall_reply": // TODO
					a = a.wall_reply;
					reply = Wall.getReplyAttachment(a.owner_id, a.post_id, r.id);
					break;

				case "album": // TODO
					var album=a.album;
					album.id = album.id || album.album_id;
					albums.push(Photos.getAttachmentAlbum(album));
					break;
			}
		}

		if (photosItems.length) {
			Photos.putListContent(id, 0, {count: photosItems.length, items: photosItems});
		}

		return $.e("div",{append: [
			$.e("div", {append: photos}),
			$.e("div", {append: albums}),
			$.e("div", {append: videos}),
			$.e("div", {append: audios}),
			$.e("div", {append: docs}),
			page,
			note,
			poll,
			$.e("div", {append: wall}),
			reply,
			link,
			sticker
		]});
	},


	/**
	 * @param {int|string} offset
	 * @param {int} count
	 * @param {int} step
	 * @param {{onClick: function=}=} options
	 */
	getSmartPagebar: function(offset, count, step, options) {
		offset = parseInt(offset);
		options = options || {};

		var wrap = $.e("div", {"class": "pagebar-wrap"}),
			replace = function(offset) {
				if (options.onClick) {
					options.onClick(offset);
					return;
				}

				if (getOffset()) {
					window.location.hash = window.location.hash.replace(/offset=(\d+)/ig, "offset=" + offset);
				} else {
					window.location.hash += (~window.location.hash.indexOf("?") ? "&" : "?") + "offset=" + offset;
				}
			},

			item = function(i, text) {
				var current = $.e("div", {
					"class": "pagebar",
					onclick: replace.bind(null, i),
					html: text || (Math.round(i / step) + 1)
				});
				i === offset && $.elements.addClass(current, "pagebar-current");
				return current;
			},

			getPoints = function() {
				return $.e("span", {"class": "pagebar", html: "...", onclick: function() {
					selectPageManual(this);
				}});
			},

			selectPageManual = function(from) {
				var userPage,
					offset,
					modal = new Modal({
						title: "Выбор страницы",
						content: $.e("div", {"class": "sf-wrap", append: [
							$.e("p", {html: "Введите номер страницы, на которую хотите перейти:<br \/>от 1 до " + (Math.floor(count / step) + 1)}),
							userPage = $.e("input", {type: "number", autocomplete: "off", autofocus: "yes"})
						]}),
						footer: [
							{
								name: "go",
								title: "Перейти",
								onclick: function() {
									var page = parseInt(userPage.value.trim());

									if (!page || isNaN(page) || page <= 0) {
										alert("Введено не число или число меньше нуля");
										return;
									}

									offset = (page - 1) * step;

									if (offset >= count) {
										alert("Слишком далеко: введён номер страницы больше, чем их существует");
										return;
									}

									replace(offset);
									modal.close();
								}
							},
							{
								name: "close",
								title: "Закрыть",
								onclick: function() {
									this.close();
								}
							}
						]
					}).show();
				userPage.addEventListener("keydown", function (event) {
					var code = event.keyCode;
					if (code >= 96 && code <= 105 || code >= 48 && code <= 57) return;
					event.preventDefault();
				});
			};

		if (offset - step * 4 >= 0) {
			wrap.appendChild(item(0, 1));
			wrap.appendChild(getPoints());
		}

		for (var i = offset - (step * 3), l = offset + (step * 3); i <= l; i += step) {
			if (i < 0 || i >= count) {
				continue;
			}

			if (i >= offset + step * 4) {
				break;
			}

			wrap.appendChild(item(i));
		}

		if (offset + step * 4 <= count) {
			wrap.appendChild(getPoints());
			wrap.appendChild(item(Math.floor(count / step) * step, Math.floor(count / step) + 1));
		}
		return wrap.children.length > 1 ? wrap : $.e("div");
	},


	/**
	 * @deprecated
	 * @param {string} str
	 * @returns {string}
	 */
	Escape: function(str) {
		return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	},

	getPlatformNode: function(name) {
		var elem = $.e("div", {"class": "online"});

		//noinspection SpellCheckingInspection
		elem.title = {
			android: "Android",
			wphone: "Windows Phone",
			windows: "Windows 8",
			ipad: "iPad",
			ipod: "iPod",
			iphone: "iPhone",
			other: "API",
			instagram: "Instagram",
			"": "API",
			"undefined": "API"
		}[name];

		//noinspection FallThroughInSwitchStatementJS,SpellCheckingInspection
		switch (name) {
			case "wphone":
			case "windows":
				$.elements.addClass(elem, "online-wp");
				break;

			case "ipad":
			case "ipod":
				name = "iphone";

			case "iphone":
			case "android":
				$.elements.addClass(elem, "online-" + name);
				break;

			default:
				$.elements.addClass(elem, "online-other");
		}

		return elem;
	},

	/**
	 * @deprecated
	 * @param {string} a
	 * @param {object} b
	 * @param {object=} c
	 * @returns {HTMLElement}
	 */
	CreateDropDownMenu: function(a,b,c){ return new DropDownMenu(a,DDMconvert2new(b),c).getNode() },


	/**
	 *
	 * @param {string|HTMLElement} left
	 * @param {string|HTMLElement=} right
	 * @param {object=} opts
	 * @returns {HTMLElement}
	 */
	getPageHeader: function(left, right, opts) {
		opts = opts || {};
		var head = $.e("div", {"class": (!opts.className ? "hider-title" : opts.className) + " sizefix"});

		if (typeof right === "string") {
			right = $.e("div", {"class": "hider-right", html: right});
		}

		if (typeof left === "string") {
			left = $.e("div", {"class": "hider-title-content", html: left});
		}

		head.appendChild(left);

		if (right) {
			head.appendChild(right);
		}

		return head;
	},

	// end implements


	/**
	 * Create table of tabs
	 * @param {Array[]} tabs
	 * @returns {HTMLElement}
	 */
	getTabPanel: function(tabs) {
		var e = $.e("div", {"class": "tabs"}),
			TAB_ACTION = 0,
			TAB_LABEL = 1,
			TAB_COUNT = 2;

		for (var i = 0, item; item = tabs[i]; ++i) {
			var c = $.e("a");
			if (typeof item[TAB_ACTION] === "string") {
				c.href = "#" + item[TAB_ACTION];
			} else {
				c.onclick = tabs[i][TAB_ACTION];
			}
			c.innerHTML = tabs[i][TAB_LABEL];
			c.className = "tab" + (window.location.hash.replace(/&?offset=\d+&?/ig, "") === "#" + tabs[i][TAB_ACTION] ? " tab-sel" : "");
			if (item[TAB_COUNT]) {
				c.dataset.count = item[TAB_COUNT];
			}
			e.appendChild(c);
		}
		return e;
	},

	/**
	 *
	 * @param {{tag: string=, link: string=, onclick: function=, title: string}} opts
	 * @returns {HTMLElement}
	 */
	createTopButton: function(opts) {
		opts = opts || {};
		var tag = opts.tag || "a",
			button = $.e(tag, {"class": "a topbtn", html: opts.title});
		button[tag === "a" ? "href" : "onclick"] = (tag === "a" ? "#" + opts.link : opts.onclick);
		return button;
	},

	/**
	 * @param {{link: string=, text: string, click: function=}} opts
	 * @returns {HTMLElement}
	 */
	getNextButton: function(opts) {
		return $.e("a",{
			href: opts.link,
			html: opts.text,
			onclick: opts.click,
			"class": "button-block sizefix"
		})
	},

	/**
	 * Create inline file chooser button field
	 * @param {string} name
	 * @param {{fullWidth, accept}} opts
	 * @returns {HTMLElement}
	 */
	createFileChooserButton: function(name, opts) {
		return $.e("div", {
			"class": "file-wrap sizefix",
			style: opts && opts.fullWidth ? "width:100%;" : "",
			append: [
				$.e("div", {"class": "file-fake", append: [
					$.e("div", {"class": "file-label sizefix", id: "file_" + name + "_label", html: "&nbsp;"}),
					$.e("div", {"class": "file-button btn a sizefix", html: "Обзор.."})
				]}),
				$.e("input", {
					"class": "file-original",
					type: "file",
					name: name,
					accept: opts.accept || "",
					onchange: function() {
						$.element("file_" + name + "_label").innerHTML = this.value.split(/([\\\/])/g).pop();
					}
				})
			]
		});
	},

	/**
	 * Create inline form
	 * @param {{onsubmit, type, name, value, title, onkeyup, onblur, placeholder, method, action, enctype, target}} opts
	 * @returns {HTMLElement}
	 */
	createInlineForm: function(opts) {
		var e = $.e,
			formWrap = e("form", {onsubmit: opts.onsubmit, append: e("table", {"class": "s", append: [
					e("tr", {append: [
						e("td", {"class": "s-text", append: e("input", {
								type: opts.type || "text",
								"class": "sizefix",
								name: opts.name,
								value: (opts.value || "").unsafe(),
								autocomplete: "off",
								onkeyup: opts.onkeyup,
								onblur: opts.onblur,
								placeholder: opts.placeholder || ""
							}),
						}),
						e("td", {"class": "s-submit", append: e("input", {type: "submit", value: opts.title}) })
					]})
				]})
			});

		if (opts.method) {
			formWrap.method = opts.method;
		}

		if (opts.action) {
			formWrap.action = opts.action;
		}

		if (opts.enctype) {
			formWrap.enctype = opts.enctype;
		}

		if (opts.target) {
			formWrap.target = opts.target;
		}

		return formWrap;
	},

	/**
	 * Create hider
	 * @param {HTMLElement} head
	 * @param {HTMLElement} content
	 * @param {boolean} isOpened
	 * @returns {HTMLElement}
	 */
	createHider: function(head, content, isOpened) {
		var parent = $.e("div");
		head.addEventListener("click", function() {
			$.elements.toggleClass(content, "hidden");
		});

		if (!isOpened) {
			$.elements.addClass(content, "hidden");
		}

		parent.appendChild(head);
		parent.appendChild(content);
		return parent;
	},

	/**
	 * Create smart form with text field
	 * @param {{
	 *     title: string=,
	 *     noHead: boolean=,
	 *     noLeftPhoto: boolean=,
	 *     data: object[]=,
	 *
	 *     value: string=,
	 *     valueAttachments: Attachment[]=,
	 *     maxCount: int=,
	 *
	 *     allowAttachments: int=,
	 *     attachmentMethods: object=,
	 *     attachmentChooseBottom: boolean=,
	 *
	 *     asAdmin: boolean=,
	 *     withSign: boolean=,
	 *     friendsOnly: boolean=,
	 *     timer: boolean=,
	 *     smiles: boolean=,
	 *     mbo: boolean=,
	 *     autoSave: string=,
	 *
	 *     ctrlEnter: boolean=,
	 *     enableCtrlVFiles: boolean=,
	 *     autoHeightTextarea: boolean=,
	 *
	 *     onSend: function=,
	 *     onKeyUp: function=,
	 *
	 *     name: string,
	 *     id: string=
	 * }} opts
	 * @param {int} ownerId
	 * @param {int} itemId
	 * @returns {HTMLElement|object}
	 */
	getExtendedWriteForm: function(opts, ownerId, itemId) {
		opts = opts || {};

		var form = $.e("form"), textArea;

		if (!opts.noHead) {
			form.appendChild(Site.getPageHeader(opts.title || "Добавить комментарий"));
		}

		if (opts && opts.data) {
			for (var label in opts.data) {
				form[label] = opts.data[label];
			}
		}

		var additionally = [],
			checks = {},
			labelInput = function(name, tip) {
				return $.e("label", {append: [
					checks[name] = $.e("input", {type: "checkbox", name: name}),
					document.createTextNode(tip)
				]});
			};

		if (opts.asAdmin) {
			additionally.push(labelInput("asAdmin", "от имени сообщества"));
		}

		if (opts.withSign) {
			additionally.push(labelInput("withSign", "подпись"));
		}

		if (opts.friendsOnly) {
			additionally.push(labelInput("friendsOnly", "только друзьям"));
		}

		textArea = $.e("textarea", {
			"class": "sizefix",
			name: opts.name,
			id: opts.id || "",
			html: opts.value || "",

			onkeydown: function(event) {
				event.stopPropagation();
				event.cancelBubble = true;
			}
		});

		if (opts.autoHeightTextarea) {
			makeMagicTextarea(textArea);
		}

		var sendButton,
			replyLine,

			attachments = new AttachmentController({
				maxCount: opts.maxCount || 10,
				ownerId: ownerId,
				allowedTypes: opts.allowAttachments,
				onSelect: function(a) {

				},
				methods: opts.attachmentMethods ? opts.attachmentMethods : {
					photo: "photos.getWallUploadServer",
					document: "docs.getWallUploadServer"
				},
				expandBottom: opts.attachmentChooseBottom
			}),

			emotions = new EmotionController({
				mode: ((opts.allowAttachments & APIDOG_ATTACHMENT_STICKER) ? APIDOG_EMOTIONS_MODE_STICKERS : 0) | APIDOG_EMOTIONS_MODE_SMILES,
				textArea: textArea
			});

		form.appendChild($.e("div", {"class": "form-new", append: [
			$.e("a", {
				"class": "form-photoProfile-wrap",
				href: "#" + Local.data[API.userId].screen_name,
				append: $.e("img", {
					src: getURL(Local.data[API.userId].photo_50),
					alt: ""
				})
			}),

			$.e("div", {"class": "form-new-right", append: [
				$.e("div", {"class": "form-wrap", append: textArea}),

				$.e("div", {"class": "form-new-footer", append: [
					$.e("div", {"class": "form-footer-action", append: [
						sendButton = $.e("input",{type: "submit", value: Lang.get("general.send")}),
						$.e("span", {append: additionally})
					]}),

					$.e("div", {"class": "form-footer-userSelect", append: [
						emotions.getNodeButton(),
						attachments.getNodeButton()
					]})
				]}),
				emotions.getNodeWrap(),

				ownerId && itemId
					? replyLine = $.e("div", {"class": "form-new-reply"})
					: null,

				attachments.getNodePreview()
			]})
		]}));

		var cacheText,
			onSubmit = function(event) {
				event && event.preventDefault();

				opts.onSend && opts.onSend.call(this, {
					text: textArea.value.trim(),
					attachments: attachments,
					asAdmin: checks.asAdmin && checks.asAdmin.checked,
					withSign: checks.withSign && checks.withSign.checked,

					onlyFriends: checks.onlyFriends && checks.onlyFriends.checked,

					publishDate: attachments.getTimer(),

					textAreaNode: textArea,

					clear: obj.clear
				});

				return false;
			};

		if (opts.ctrlEnter || opts.onKeyUp || opts.autoSave) {
			textArea.addEventListener("keyup", function(event) {
				opts.ctrlEnter && event.ctrlKey && event.keyCode === KeyboardCodes.enter && onSubmit(event);

				opts.onKeyUp && opts.onKeyUp.call(form, event);

				opts.autoSave && $.localStorage("sff-" + opts.autoSave, textArea.value.trim());
			});
		}

		if (opts.autoSave && (cacheText = $.localStorage("sff-" + opts.autoSave))) {
			textArea.value = cacheText;
		}


		if (opts.valueAttachments) {
			attachments.parse(opts.valueAttachments);
		}

		if (opts.enableCtrlVFiles) {
			attachments.registerTextareaEvents(textArea);
		}

		if (opts.mbo) {
			$.elements.addClass(sendButton, "mbo");
		}

		if (opts.noLeftPhoto) {
			$.elements.addClass(form, "form-new-right-noLeft");
		}

		form.addEventListener("submit", onSubmit);

		var obj = {
			getNode: function() {
				return form;
			},

			clear: function() {
				textArea.value = "";
				$.localStorage("sff-" + opts.autoSave, null);
				checks.asAdmin && (checks.asAdmin.checked = false);
				checks.withSign && (checks.withSign.checked = false);
				checks.onlyFriends && (checks.onlyFriends.checked = false);
				attachments.clear();
				emotions.close();
				obj.setReply(null);
			},

			/**
			 * Returns main textarea
			 * @returns {HTMLTextAreaElement}
			 */
			getTextarea: function() {
				return textArea;
			},

			getFromGroup: function() {
				return checks.asAdmin && checks.asAdmin.checked;
			},

			/**
			 * Returns attachment controller for this comment block
			 * @returns {AttachmentController}
			 */
			getAttachment: function() {
				return attachments;
			},

			/**
			 * Returns emptions controller for this comment block
			 * @returns {EmotionController}
			 */
			getEmotions: function() {
				return emotions;
			},

			setReply: function(user) {
				$.elements.clearChild(replyLine);

				if (!user) {
					return obj;
				}

				replyLine.appendChild($.e("div", {append: [
					$.e("span", {html: "в ответ "}),
					$.e("a", {html: (user.first_name_dat + " " + user.last_name_dat).safe()}),
					$.e("span", {"class": "a", html: " [x]", onclick: obj.setReply.bind(obj, null)})
				]}));
				return obj;
			}
		};

		return obj;
	},

	/**
	 * Show notification in left bottom angle(?)
	 * @param {{click: function=, icon: string=, text: string, delay: int=, time: int=}} opts
	 * @returns {Element}
	 * @constructor
	 */
	Alert: function(opts) {
		opts = opts || {};

		var close = function () {
				clearTimeout(timeout);
				try {
					wrap.style.bottom = "-100px";
					wrap.style.opacity = 0;
					Site.redrawAlerts(wrap);
					$.elements.addClass(wrap, "alert-closing");
					setTimeout(function () {
						$.elements.remove(wrap);
					}, 1000);
				} catch (e) {}
			},
			elem = $.e("div"),
			wrap = $.e("div", {"class": "alert sizefix", append: elem, onclick: function() {
				opts.click && opts.click();
				close();
			}}),
			timeout;

		if (opts.icon) {
			elem.appendChild($.e("img", {"class": "alert-icon", src: opts.icon, alt: ""}));
		}

		opts.delay = opts.delay || 50;
		opts.time = opts.time || 5000;
		elem.appendChild($.e("div", {"class": "alert-content" + (opts.icon ? " alert-content-withIcon" : ""), html: opts.text}));

		wrap.style.opacity = 0;

		var h = 0;
		Array.prototype.forEach.call(document.querySelectorAll(".alert:not(.alert-closing)"), function(item) {
			h += item.offsetHeight + 30;
		});

		wrap.style.bottom = h + "px";

		setTimeout(function () {
			wrap.style.marginTop = (API.bitmask & 128 ? 45 : -1) + "px";
			wrap.style.opacity = 1;
		}, opts.delay);

		timeout = setTimeout(close, opts.time);

		getBody().appendChild(wrap);
		return wrap;
	},
	redrawAlerts: function (deleted) {
		var q = document.querySelectorAll(".alert:not(.alert-closing)"),
			d = deleted.offsetHeight,
			px = function (p) {return parseInt(p)};
		Array.prototype.forEach.call(q, function (item) {
			item.style.bottom = (px(item.style.bottom) - d - 30) + "px";
		});
	},

	/**
	 * @deprecated
	 */
	getScrolled: function() {
		return getScroll();
	},

	/**
	 * @deprecated
	 */
	getDate: function(unix) {
		return new Date(unix * 1000).relative();
	},


	showCaptchaBox: function (o) {

		var t, form = $.e("form", {"class": "form-captcha", append: [
				$.e("img", {src: o.captchaImage}),
				t = $.e("input", {type: 'text', autocomplete: 'off', name: 'key'})
			]}),
			modal = new Modal({
				title: "Captcha",
				content: form,
				footer: [
					{
						name: "ok",
						title: "OK",
						onclick: function() {
							var key = form.key.value.trim();
							if (!key)
								return;
							modal.close();
							if (o.handler)
								return o.handler(key);
						}
					}
				]
			}).show();
		t.focus();
	},
};
var Errors = {
	1: "Неизвестная ошибка",
	4: "Неверный sig",
	5: "Ошибка аутификации пользователя",
	6: "Слишком много запросов в секунду",
	7: "Данное действие запрещено пользователем при авторизации",
	20: "Запрещенное действие: запрос к API через OAuth-авторизацию к данному методу запрещен. Для получения данных с этой страницы требуется полная авторизация",
	100: "Внутренняя ошибка исполнения запроса к API: В запросе пропущен обязательный параметр для выполнения данного метода",
	113: "Неверный параметр user_id",
	114: "Неправильный параметр album_id",
	119: "Неверное название",
	200: "Доступ запрещен",
	211: "Доступ к комментарию запрещен",
	212: "Доступ к комментариям запрещен"
};

function getURL(url, type) {
	type = type || "jpg";
	if (isEnabled(Setting.DISABLE_IMAGES)) {
		return "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='4' y='108.5' font-size='24'%3E&lt; изображение &gt;%3C/text%3E%3C/svg%3E";
	}

	if (typeof url !== "string" || !isEnabled(Setting.USING_PROXY)) {
		return url;
	}

	return url.indexOf("/pp.")
		? url.replace(/\/pp\.(vk\.me|userapi\.com)\//img, "/apidog.ru:4007/")
		: "\/api\/v2\/apidog.proxyData?t=" + type + "&u=" + encodeURIComponent(url);
}
