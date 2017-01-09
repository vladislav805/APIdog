/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Site = {
	 initialization: function() {
		if (APIdogNoInitPage) {
			return;
		};

		if (!window.longpollStarted) {
			window.longpollStarted = true;
			if (!LongPoll._ext) {
				setTimeout(LongPoll.start, 3000);
			};
		};
	},


	showUser: function  (u) {
		g("_link").href = "#" + (u.screen_name || "id" + u.id);
		g("_name").innerHTML = u.first_name.safe();
		g("_photo").src = getURL(u.photo_50);
	},

	proxy: function (method, params, callback) {
		delete params.callback;
		$.ajax.post({
			url: "//apidog.ru:4006/method/" + method,
			callback: callback,
			params: params,
			json: true
		});
	},


	APIRequestCallbacks: [],
	APIRequestCallbacksCount: -1,

	API: function(method, params, callback) {
		return new APIRequest(method, params).setOnCompleteListener(callback).execute();
	},

	APIv5: function (method, params, callback) {
		return new APIRequest(method, params).setWrapper(APIDOG_REQUEST_WRAPPER_V5).setOnCompleteListener(function(d) {
			callback({response: d});
		}).setOnErrorListener(function(e) {
			callback({error: d});
		}).execute();
	},

	// test
	isResponse: function (data) {
		return data.response || data;
	},

	showCaptcha: function (p) {
		var e = $.e,
			captchaId = p.captcha_sid,
			url = p.captcha_img,
			textarea,
			m = new Modal({
				width: 280,
				title: "Captcha",
				content: e("div", {"class": "captcha", append: [
					e("img", {src: isEnabled(4) ? "\/api\/v2\/apidog.proxyData?t=png&u=" + encodeURIComponent(url) : url}),
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

	reCaptcha: function (captchaId, captchaKey, params) {
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

	setCounters: function (data) {
		if (!data) return;
		"friends,messages,photos,videos,groups,notifications".split(",").forEach(function (name) {
			var value = data[name];
			if (value > 0) {
				g("menu-" + name).setAttribute("data-count", parseInt(value).toK());
			} else {
				g("menu-" + name).removeAttribute("data-count");
			};
		});
		Site.counters = data;
	},

	setMailCounter: function(count) {
		g("menu-messages").setAttribute("data-count", parseInt(count).toK());
		Site.counters.messages = count;
	},

	onClickHead: function (event, node) {
		var u;
		if (u = node.getAttribute("data-url")) {
			setLocation(u);
		} else if (u = node.onclicked) {
			node.onclicked();
			node.onclicked = null;
		};
	},

	getLinkAttachment: function (link) {
		var shortlink;
		try {
			shortlink = link.url.match(/\/\/([^\/]+)(\/|$)/igm)[0].replace(/\//g, "");
		} catch (e) {
			shortlink = "перейти";
		};
		link.url = link.url.replace(/https?:\/\/(m\.)?vk\.com\//ig, "\/\/apidog.ru\/#");
		return $.e("a", {
			href: link.preview_page ? "#page" + link.preview_page + "?site=1" : link.url,
			"data-url": link.url,
			onclick: function(event) {
				if (event.ctrlKey) {
					this.href = this.dataset.url;
				};
				event.preventDefault();
				return false;
			},
			"class": "attach-row-wrap",
			target: "_blank",
			append: [
				$.e("div", {"class": "attach-row-icon-wrap", append: $.e("div", { "class": "attach-row-icon attach-icon-link" })}),
				$.e("div", {"class": "attach-row-title", html: link.title.safe()}),
				$.e("div", {"class": "attach-row-description", html: shortlink.safe()})

			]
		});
	},


/*

<a class="attach-row-wrap" href="%s" onclick="stopEvent(event);" target="_blank">
	<div class="attach-row-icon-wrap">
		<div class="attach-row-icon attach-icon-%s"></div>
	</div>
	<div class="attach-row-title">%s</div>
	<div class="attach-row-description">%s</div>
</a>


 */


	getStickerAttachment: function (sticker) {
		return $.e("img", {
			style: "margin: 4px 0",
			src: (isEnabled(4) ? "\/\/static.apidog.ru\/proxed\/stickers\/%sb.png" : STICKERS_SCHEMA_IMAGE).schema({s: sticker.id}),
			alt: "Стикер"
		});
		// return MediaAttachment.sticker(sticker);
	},















	// updated 04/07/2015 from v6.5
	get: function (param) {
		var hash = window.location.hash.replace("#", ""),
			key,
			current,
			offset,
			c,
			params = {};

		hash = hash.slice(hash.indexOf("?") + 1).split("&");

		for (key in hash) {
			c = hash[key];
			offset = c.indexOf("=");
			key = c.slice(0, offset);
			value = c.slice(++offset);
			params[key] = value;
		};

		return param ? params[param] : params;
	},


	Go: function (url) {
		if (Site.Get("w"))
			return window.location.hash = "#" + Site.Get("w");
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
		url = url.split("?")[0].replace("#", "");
		var reg = {
			Friends:    /^friends?$/ig,
			Feed:       /^feed$/ig,
			Wall:       /^wall(-?\d+)?(_\d+)?$/ig,
			Photos:     /^((photos(-?\d+)?(_-?\d+)?)|(photo(-?\d+)_(\d+)))$/ig,
			Video:      /^((videos(-?\d+)?(_-?\d+)?)|(video(-?\d+)_(\d+)))$/ig,
			Audios:     /^audios?(-?\d+)?(_(\d+))?$/ig,
			Groups:     /^groups$/ig,
			Docs:       /^(docs(-?\d+)?|doc(-?\d+)_(\d+))$/ig,
			Search:     /^search$/ig,
			Settings:   /^settings$/ig,
			Board:      /^(board|topic-)(\d+_?\d*)$/ig,
			Support:    /^support(\/([0-9a-f]+)|search|faq|about|donate)?$/ig,
			Fave:       /^fave$/ig,
			Gifts:      /^gifts$/ig,
			Places:     /^places?$/ig,
			Notes:      /^(notes(\d+)?|note(\d+)_(\d+))$/ig,
			Pages:      /^(pages|page(-?\d+)_(\d+))$/ig,
			Apps:       /^apps$/ig,
			Snapster:	/^chronicle$/ig,
			Polls:      /^poll(-?\d+)_(\d+)$/ig,
			Dev:		/^dev(\/([A-Za-z0-9\._]+))?$/ig,
			Analyzes:	/^analyzes(\/([A-Za-z]+)(\/(-?\d+))?)?$/ig
		};

		var modulesAssoc = {
			Friends: "friends",
			Feed: "feed",
			Wall: "wall",
			Photos: "photos",
			Video: "video",
			Audios: "audio",
			Groups: "groups",
			Docs: "documents",
			Search: "search",
			Settings: "settings",
			Board: "board",
			Fave: "fave",
			Gifts: "gifts",
			Places: "places",
			Notes: "notes",
			Pages: "pages",
			Apps: "apps",
			Snapster: "snapster",
			Polls: "polls",
			Dev: "vkutils"
			//Analyzes:	/^analyzes(\/([A-Za-z]+)(\/(-?\d+))?)?$/ig,
		};

		if (/^([^\/]+)\/([^\?]+)/img.test(url)) {
			var r = /^([^\/]+)\/([^\?]+)/img.exec(url);
			switch (r[1]) {
				case "dev": return Dev.explain(r[2]);
//				case "stickers": return Settings.store.getItem(r[2]);
//				case "analyzes": return Analyzes.open.apply(window, r[2].split("/"));
				case "images": return window.location.href = "//vk.com/" + url;
				default: return Feed.searchByOwner(r[1], r[2], Site.Get("offset"));
			};
		};

		window.onLeavePage && window.onLeavePage();

		window.onResizeCallback = null;
		window.onKeyDownCallback = null;
		window.onScrollCallback = null;
		window.onLeavePage = null;
		window.onDragEnter = null;
		window.onDragLeave = null;
		window.onDropped = null;
		window.onNewMessageReceived = null;
		window.onMessageReaded = null;
		window.onTyping = null;
		window.onChatUpdated = null;

		url = url
				.replace(/^event(\d+)$/ig, "club$1")
				.replace(/^public(\d+)$/ig, "club$1")
				.replace(/^album(-?\d+)_(-?\d+)$/ig, "photos$1_$2")
				.replace(/^write(\d+)$/img, "im?to=$1");
//		Audios.MiniPlayer.Hide();
		$.elements.removeClass($.element("wrap"), "menu-opened");
		if (reg.Polls.test(url)) {
			var poll = reg.Polls.exec(url), answerId = Site.Get("answerId");
			return ModuleManager.load("polls", function() {!answerId ? Polls.getPoll(poll[1], poll[2]) : Polls.getList(poll[1], poll[2], answerId)})
		}

		if (reg.Photos.test(url))
			return ModuleManager.load("photos", function() {Photos.Resolve(url);});
		if (reg.Video.test(url))
			return ModuleManager.load("video", function() {Video.Resolve(url)});
		if (reg.Audios.test(url))
			return ModuleManager.load("audio", function() {Audios.Resolve(url)});
		if (reg.Wall.test(url))
			return ModuleManager.load("wall", function() {Wall.Resolve(url);});
		if (reg.Places.test(url))
			return ModuleManager.load("places", function() {Places.explain(url);});
		if (reg.Friends.test(url))
			return ModuleManager.load("friends", function() {Friends.explain(Site.Get("id"));});
		if ((/^mail$/ig.test(url) || /^im$/ig.test(url)))
			return ModuleManager.load(["mail", "im"], function() {IM.Resolve(url)});
		if (reg.Pages.test(url))
			return ModuleManager.load("pages", function() {Pages.explain(url);});
		if (reg.Docs.test(url))
			return ModuleManager.load("documents", function() {Docs.explain(url);});
		for (var current in reg) {
			if (reg[current].test(url)) {
				var id = url.replace(new RegExp(current, "igm"), "");
				if (!id)
					id = API.uid;
				ModuleManager.load(modulesAssoc[current], function() {console.log("callback!"); window[current].RequestPage(id);});
				return;
			}
		}
		ModuleManager.load(["profiles", "groups", "apps"], function() {
			console.log(123);
			Site.requestPageByScreenName(url);
		});
		return;
	},

	requestPageByScreenName: function(screenName) {
		new APIRequest("execute", {
			code:'var c=API.account.getCounters({v:5.11}),d=API.utils.resolveScreenName({screen_name:Args.q}),w=d.object_id,o=parseInt(Args.o);if(!d.length)return{t:0};if(d.type=="user"){API.stats.viewUser({user_id:w});var u=API.users.get({user_ids:w,fields:Args.f})[0];return{t:"u",c:c,w:API.wall.get({owner_id:w,extended:1,offset:o,count:25}),u:u,e:{p:API.wall.get({owner_id:w,filter:"postponed"}).count}};}else if(d.type=="group"){API.stats.viewGroup({group_id:w});var c=API.groups.getById({group_id:w,fields:Args.f,extended:1})[0];return{t:"g",c:c,w:API.wall.get({owner_id:-w,extended:1,offset:o,count:25}),g:c,e:{s:API.wall.get({owner_id:-w,filter:"suggests"}).count,p:API.wall.get({owner_id:-w,filter:"postponed"}).count},r:API.groups.getRequests({group_id:w}).count};}else return{t:"a",a:API.apps.get({app_id:w})};',

			q: screenName,
			o: getOffset(),
			f: "description,wiki_page,members_count,links,activity,place,ban_info,start_date,finish_date,sex,photo_rec,friend_status,photo_id,maiden_name,online,last_seen,counters,activites,bdate,can_write_private_message,status,can_post,city,country,exports,screen_name,blacklisted,blacklisted_by_me,are_friends,first_name_gen,first_name_ins,site,common_count,contacts,relation,nickname,home_town,verified,can_see_gifts,is_favorite,friend_status,crop_photo"
		}).setOnErrorListener(function(e) {
			console.error(e);
		}).setOnCompleteListener(function(result) {
			Site.setCounters(result.c);
			switch (result.t) {
				case "u":
					return Profile.display(result.u, result.w);

				case "g":
					return Groups.display(result.g, result.w);

				case "a":
					return Apps.display(result.a);

				default:
					new Snackbar({text: "О_о", duration: 1000}).show();
			};
		}).execute();
	},

	queue: [],
	queueTimer: null,
	queueUser: function (userId) {
		if (~Site.queue.indexOf(userId))
			return;
		Site.queue.push(userId);
		if (Site.queueTimer)
			clearTimeout(Site.queueTimer);
		Site.queueTimer = setTimeout(Site.loadQueueUsers, 1000);
	},
	loadQueueUsers: function () {
		var userIds = Site.queue, users = [], groups = [];

		userIds.forEach(function (i) {
			(i > 0 ? users : groups).push(Math.abs(i) || 0);
		});
		Site.queue.length = 0;

		Site.API("execute", {
			code: "return{u:API.users.get({user_ids:[" + users.join(",") + "],fields:\"online,screen_name,photo_50,photo_100\",v:5.28}),g:API.groups.getById({group_ids:[" + groups.join(",") + "]})};"
		}, function (data) {
			data = Site.isResponse(data);
			if (!data)
				return;
			Local.AddUsers(data.u);
			Local.AddUsers(data.g);
			data = data.u.concat(data.g || []);
			var nodes, id;
			Array.prototype.forEach.call(data, function (i) {
				id = i.name ? -i.id : i.id;
				nodes = document.querySelectorAll("._im_link_" + id);
				Array.prototype.forEach.call(nodes, function (node) {
					console.log("Loadeded info about " + (i.name ? -i.id : i.id));
					switch (node.tagName.toLowerCase()) {
						case "a":
							if (!node.children.length)
								node.innerHTML = i.name || i.first_name + " " + i.last_name + Site.isOnline(i);
							node.href = "#" + (i.screen_name || (id > 0 ? "id" : "club") + i.id);
							break;
						case "img":
							node.src = i.photo_50 || i.photo_100 || i.photo || i.photo_rec;
							break;
						case "strong":
							node.innerHTML = i.name || i.first_name + " " + i.last_name + Site.isOnline(i);
							break;
					}
				});
			});
		});
	},

	_ldr: null,
	Loader: function (isReturn) {
		var elem = Site._ldr ? Site._ldr : (Site._ldr = $.e("div", {style: "padding: 90px 0", append: $.e("div", {"class": "loader-svg"})}));
		return !isReturn ? Site.Append(elem) : elem;
	},

	APIExecute: function (obj, callback) {
		var requests = [], returnString = [], code, params = function (d) {
			var b = [];
			for (var a in d)
				b.push(a + ":\"" + Site.AddSlashes(d[a]) + "\"");
			return b.join(",");
		};
		if (isArray(obj)) {
			for (var i = 0, l = obj.length; i < l; ++i)
				requests.push("API." + obj[i].method + "({" + params(obj[i].params) + "})");
			code = "return [" + requests.join(",") + "];";
		} else {
			for (var item in obj) {
				var i = obj[item];
				requests.push("var " + i.name + "=API." + i.method + "({" + params(i.params) + "})");
				returnString.push(item + ':' + i.name);
			}
			code = requests.join(";") + ";return {" + returnString.join(",") + "};";
		}
		return callback ? Site.API("execute", {code: code}, callback) : code;
	},

	append: function (node) {
		$.elements.clearChild(g("content")).appendChild(node);
		return Site;
	},
	isOnline: function (data, mode) {
		mode = mode || 0;
		if (data && data.online) {
			if (data.online_app) {
				var title, cls;
				switch(parseInt(data.online_app)) {
					case 3682744:
					case 2847524:
					case 3133286: title = "iPad"; cls = "iphone"; break;
					case 3087106:
					case 3140623: title = "iPhone"; cls = "iphone"; break;
					case 2274003: title = "Android"; cls = "android"; break;
					case 3697615: title = "Windows 8"; cls = "wp"; break;
					case 3502557:
					case 2424737:
					case 3502561: title = "Windows Phone"; cls = "wp"; break;
					case 2685278:
					case 1997282: title = "Kate Mobile (Android)"; cls = "kate"; break;
					case 3074321: title = "APIdog"; cls = "apidog"; break;
					//case 3698024: title = "Instagram"; cls = "instagram";
					default: return ' <div class="online online-app"><\/div> '; break; // Other
				};
				return ' <div class="online online-' + cls + '" title="' + title + '"><\/div> ';
			};
			if (data.online_mobile)
				return ' <div class="online online-mobile"></div> ';
			else
				return ' <div class="online online-full"></div> ';
		} else if (mode === 1 && data.last_seen && data.last_seen.platform) {
			var icon = ["mobile", "iphone", "iphone", "android", "wp", "wp"][data.last_seen.platform - 1];
		};
		//general.was_sex
		return data ? " " + (mode === 1 && data.last_seen ? "<span class='tip'>" + (Lang.get("profiles.profile_was_in")[data.sex]) + " " + $.getDate(data.last_seen.time) + (icon ? ' <div class="online online-' + icon + '"><\/div>' : '') + "<\/span>" : "") : false;
	},
	isVerify: function (fields) {
		return fields && fields.verified ? ' <div class="online-verify"><\/div> ' : '';
	},
	Format: function (str, opts){
		opts = opts || {};
		str = str
			.replace(/<br\s?\/?>/img, "\n")
			.replace(/</img, "&lt;")
			.replace(/>/img, "&gt;")
			.replace(/(\r|\n)/img, "<br \/>")
			.replace(/((https?|browser):\/\/)?(([A-Za-zА-Яа-яЁё0-9-][A-Za-zА-Яа-яЁё0-9-]*\.)+(ru|рф|com\.ru|org\.ru|net\.ru|pp\.ru|edu\.ru|fm|ac\.ru|int\.ru|msk\.ru|spb\.ru|ru\.com|ru\.net|cat|su|ua|com\.ua|net\.ua|org\.ua|edu\.ua|gov\.ua|biz\.ua|in\.ua|kz|by|am|az|kg|ge|tj|tm|uz|lv|lt|ee|eu|asia|com|academy|net|org|edu|gov|int|biz|info|aero|coop|museum|name|law\.pro|cpa\.pro|med\.pro|xxx|us|ca|co\.uk|me\.uk|org\.uk|ltd\.uk|plc\.uk|de|com\.fr|ac|ag|as|at|be|br|cc|ch|cz|co\.id|web\.id|net\.id|ie|il|in|is|it|jp|li|lu|me|ms|com\.mx|no|nu|pl|sh|tk|to|tv|tw|ws|yandex|google|vk|travel|gl|co|media|ml|ga|gq|io|sk|ly))(\/([A-Za-z\u0410-\u042f\u0430-\u044f0-9@\-\_#%&?+\/\.=!;#:~-]*[^\.\[\]\,;\(\)\?<\&\s:])?)?/img, function (a, b, c, d) {
					if (/((?:[\u2122\u231B\u2328\u25C0\u2601\u260E\u261d\u2626\u262A\u2638\u2639\u263a\u267B\u267F\u2702\u2708]|[\u2600\u26C4\u26BE\u2705\u2764]|[\u25FB-\u25FE]|[\u2602-\u2618]|[\u2648-\u2653]|[\u2660-\u2668]|[\u26A0-\u26FA]|[\u270A-\u2764]|[\uE000-\uF8FF]|[\u2692-\u269C]|[\u262E-\u262F]|[\u2622-\u2623]|[\u23ED-\u23EF]|[\u23F8-\u23FA]|[\u23F1-\u23F4]|[\uD83D\uD83C\uD83E]|[\uDC00-\uDFFF]|[0-9]\u20e3|[\u200C\u200D])+)/g.test(a) || opts.noLinks) {
						return a;
					};
					a = a.replace(new RegExp("#", "ig"), "&#35;");
					var original;
					try {
						original = decodeURI(a);
					} catch (e) {
						original = a;
					};

					if (!/^https?:/ig.test(a)) {
						a = "http:\/\/" + a;
					};

					if ((API.SettingsBitmask & 16) && !opts.vk) {
						a = a.replace(/^(https?:\/\/)?(m\.)?vk\.com\//igm, "\/\/apidog.ru\/&#35;");
					};

					var shortlink = a.match(/\/\/([^\/]+)\//igm),
						needWarning = $.inArray(shortlink, ["vk.com", "m.vk.com", "login.vk.com", "vkontakte.ru", "m.vkontakte.ru"]) && !(API.SettingsBitmask & 1),
						isAPIdog = shortlink == "apidog.ru";
					return ("<a href=\"" + a.replace(/&#35;/ig, "%23") + "\"%t%onclick=\"%r%\">" + (original.length > 100 ? original.substr(0, 120) + "..." : original) + "<\/a>").replace(/%r%/img, needWarning ? " event.cancelBubble=true;event.stopPropagation(); return confirm('Вы уверены, что хотите открыть эту ссылку? После перехода по этой ссылке Вы можете стать онлайн! Продолжить?');" : "event.cancelBubble=true;event.stopPropagation();\" onmouseup=\"event.cancelBubble=true;event.stopPropagation();\"").replace(/%t%/img, !isAPIdog ? " target=\"_blank\"" : "");
				})
			.replace(/\[([A-Za-z0-9_]+)(:bp-\d+_\d+)?\|([^\]]+)\]/mig,"<a href=\"&#35;$1\">$3<\/a>")
			.replace(/\#([A-Za-zА-Яа-яЁё0-9іїґє][A-Za-z0-9А-Яа-яЁё_іїґє]+)@([A-Za-z0-9_\.-]+)/img, "<a href=\"&#35;$2?act=search&q=&#35;$1\">&#35;$1@$2<\/a>")
			.replace(/\#([A-Za-zА-Яа-яЁёіїґє][A-Za-z0-9А-Яа-яЁё_іїґє]+)/img, !opts.noHashTags ? "<a href=\"&#35;feed?act=search&q=&#35;$1\">&#35;$1<\/a>" : "#$1")
			.replace(/%23/img, "#")
			.replace(/\*zfstyle\*/img, '<img src="\/\/static.apidog.ru\/zfstyle.png" alt="" \/>'); // zf, привет
		return str;
	},

	setHeader: function (title, backButton) {
		document.title = "APIdog | " + title;
		g("head-title").innerHTML = title;

		Site.setBackHeader(backButton);

		return Site;
	},

	setBackHeader: function(backButton) {
		var bb = g("head-content");
		if (backButton) {
			bb.classList.add("head-back");
			bb.onclick = function() {
				if (typeof backButton === "function") {
					backButton();
				} else {
					nav.go(backButton);
				};
			};
		} else {
			bb.classList.remove("head-back");
			bb.onclick = null;
		};
	},

	showNewNotifications: function (data) {
		if (!data) return;
		Local.AddUsers(data.profiles.concat(data.groups));
		data = data.items;
		var u = Local.Users;

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
					if (!feed.to_id)
					{
						feed.to_id = post.to_id || post.from_id;
						if (type == "wall")
							feed.to_id = post.post.to_id;
					};
					creator = u[feed.from_id];
					var link = [
						type,
						{
							wall: post.post && post.post.to_id,
							photo: post.owner_id,
							video: post.owner_id
						}[type],
						"_" + (type == "wall" ? post.post.id : post.id)
					].join("");
					iImage = creator.photo_50;
					iText = "<strong>" + (creator.name || creator.first_name + " " + creator.last_name) + "<\/strong> replied to your comment<br>" + Mail.Emoji(Site.Format(feed.text));
					iLink = link;
					break;

				case "follow":
					if (!isNotification(32)) return;
					feed = feed.items[0];
					user = u[feed.from_id];
					iText = user.first_name + " " + user.last_name + " was followed you";
					iPhoto = user.photo_50;
					iLink = (user.screen_name || "id" + user.id);
					break;
			};
			if (iText)
				Site.Alert({
					text: iText,
					icon: iImage,
					click: (function (l) {
						return function () {
							window.location.hash = "#" + l;
						}
					})(iLink)
				});
		});
	},

	Attachment:function(attachments,id){
		return new MediaAttachments(attachments).id(id).get();
	},
	PagebarV2:function(offset,count,step){
		offset = parseInt(offset);
		var html = document.createElement("div"),
			fx = function (event) {
				if (Site.Get("offset"))
					window.location.hash = window.location.hash
						.replace(/offset=(\d+)/ig, "offset=" + this.getAttribute("offset"));
				else
					window.location.hash += (/\?/.test(window.location.hash) ? "&" : "?") + "offset=" + this.getAttribute("offset");
			},
			item = function (i, text) {
				var current = document.createElement("div");
				current.setAttribute("offset", i);
				$.event.add(current, "click", fx);
				current.className = "pagebar" + (i == offset ? " pagebar-current" : "");
				current.innerHTML = text || (Math.round(i / step) + 1);
				return current;
			},
			getPoints = function (argument) {
				return $.e("span", {"class": "pagebar", html: "...", onclick: function (event) {
					Site.pagebarv2manual(count, step);
				}});
			};
		html.className = "pagebar-wrap";
		html.setAttribute("count", count);
		step = step || 20;
		var k = 0;
		if (offset - step * 4 >= 0) {
			html.appendChild(item(0, "1"));
			html.appendChild(getPoints());
		}
		for(var i = offset - (step * 3), l = offset + (step * 3); i <= l; i += step) {
			if (i < 0 || i >= count)
				continue;
			if(i >= (offset + step * 4))
				break;
			html.appendChild(item(i));
			k++;
		}
		if (offset + step * 4 <= count) {
			html.appendChild(getPoints());
			html.appendChild(item(Math.floor(count / step) * step, Math.floor(count / step) + 1));
		}
		return k > 1 ? html : document.createElement("div");
	},
	pagebarv2manual: function (count, step) {
		var uPage,
			offset,
			modal = new Modal({
				title: "Выбор страницы",
				content: $.e("div", {"class": "sf-wrap", append: [
					$.e("p", {html: "Введите номер страницы, на которую хотите перейти:<br \/>от 1 до " + (Math.floor(count / step) + 1)}),
					uPage = $.e("input", {type: "number", autocomplete: "off", autofocus: "yes"})
				]}),
				footer: [
					{
						name: "go",
						title: "Перейти",
						onclick: function (event) {
							var page = parseInt(uPage.value.trim());
							if (!page || isNaN(page) || page <= 0) {
								alert("Введено не число или номер страницы, меньше нуля");
								return;
							};
							offset = (page - 1) * step;
							if (offset >= count) {
								alert("Слишком далеко: введён номер страницы больше, чем их существует");
								return;
							};
							if (Site.Get("offset"))
								window.location.hash = window.location.hash
									.replace(/offset=(\d+)/ig, "offset=" + offset);
							else
								window.location.hash += (/\?/.test(window.location.hash) ? "&" : "?") + "offset=" + offset;
							modal.close();
						}
					},
					{
						name: "close",
						title: "Закрыть",
						onclick: function (event) {
							modal.close();
						}
					}
				]
			}).show();
		uPage.addEventListener("keydown", function (event) {
			var code = event.keyCode;
			if (code >= 96 && code <= 105 || code >= 48 && code <= 57) return;
			event.preventDefault();
		});
	},

//      v6.3 alpha
//      o: {
//          int     :   offset,
//          int     :   step,
//          int     :   count,
//          function:   callback
//      }

	getPagination: function (o) {
		o = o || {};
		var html    = document.createElement("div"),
			step    = parseInt(o.step   || 20),
			offset  = parseInt(o.offset || 0),
			count   = parseInt(o.count  || 0),
			fx = function (offset) {
				return function (event) {
					if (o.callback)
						o.callback({
							offset: parseInt(offset),
							page: parseInt(this.innerHTML),
							count: o.count
						});
				};
			},
			item = function (i, text) {
				var current = document.createElement("div");
				current.setAttribute("data-offset", i);
				$.event.add(current, "click", fx(i));
				current.className = "pagebar" + (i == offset ? " pagebar-current" : "");
				current.innerHTML = text || (Math.round(i / step) + 1);
				return current;
			};
		html.className = "pagebar-wrap";
		html.setAttribute("count", count);
		var k = 0;
		if (offset - step * 4 >= 0) {
			html.appendChild(item(0, "1"));
			html.appendChild($.elements.create("span", {"class": "tip", html: " ... "}));
		}
		for (var i = offset - (step * 3), l = offset + (step * 3); i <= l; i += step) {
			if (i < 0 || i >= count)
				continue;
			if(i >= (offset + step * 4))
				break;
			html.appendChild(item(i));
			k++;
		}
		if (offset + step * 4 <= count) {
			html.appendChild($.elements.create("span", {"class": "tip", html: " ... "}));
			html.appendChild(item(Math.floor(count / step) * step, Math.floor(count / step) + 1));
		}
		return k > 1 ? html : document.createElement("div");
	},

	AddSlashes: function (str) {
		return (String(str))
//          .replace(/[\\"']/g,'\\$&')
			.replace(/\u0000/g, "\\0")
			.replace(/\n/img, "\n");
	},
	Platform: function (name)
	{
		var elem = $.e("div", {"class": "online"});
		elem.title = {
			android: "Android",
			wphone: "Windows Phone",
			windows: "Windows 8",
			ipad: "iPad",
			ipod: "iPod",
			iphone: "iPhone",
			other: "API",
			"": "API",
			"undefined": "API"
		}[name];
		switch (name)
		{
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
		};
		return elem;
	},


	CreateHeader: function (left, right, opts) {

		return Site.getPageHeader(left, right, opts);

		if (!opts) opts = {};
		var head = document.createElement("div");
		head.className = (!opts.className ? "hider-title" : opts.className) + " sizefix";
		if (typeof right === "string")
			right = $.elements.create("div", {"class": "hider-right", html: right});
		if (right)
			head.appendChild(right);
		if (typeof left === "string")
			left = $.elements.create("div", {"class": "hider-title-content", html: left});
		head.appendChild(left);
		return head;
	},

	// 05/07/2015 implemented  from v6.5
	// 29/02/2016 set old style from .m-head-* to .hider-*
	getPageHeader: function (left, right, options) {
		options = options || {};
		var e = $.e;
		right = typeof right === "string" ? e("h2", {html: right}) : right;
		if (right)
			$.elements.addClass(right, "hider-right");
		return e("div", {"class": "hider clearfix", append: [
			right,
			typeof left === "string" ? e("h2", {"class": "hider-title-content", html: left}) : left
		]});
	},




	CreateTabPanel: function (tabs) {
		var e = document.createElement("div");
		e.className = "tabs";
		for(var i = 0; i < tabs.length; ++i) {
			var c = document.createElement("a");
			if (typeof tabs[i][0] === "string")
				c.href = "#" + tabs[i][0];
			else
				c.onclick = tabs[i][0];
			c.innerHTML = tabs[i][1];
			c.className = "tab" + (
				window.location.hash.replace(/\&?offset=\d+\&?/ig, "") == "#" + tabs[i][0] ? " tab-sel" : "");
			e.appendChild(c);
		}
		return e;
	},
	CreateTopButton: function (opts) {
		if (!opts)
			opts = {};
		var tag = opts.tag || "a",
			button = document.createElement(tag);
		button[tag == "a" ? "href" : "onclick"] = (tag == "a" ? "#" + opts.link : opts.onclick);
		if (opts.click)
			button.onclick = opts.click;
		button.innerHTML = opts.title;
		button.className = "a topbtn";
		return button;
	},
	CreateNextButton: function (opts) {
		return $.elements.create("a",{
			href: opts.link,
			html: opts.text,
			onclick: opts.click,
			"class": "button-block sizefix"
		})
	},
	CreateFileButton:function(name, opts){
		var params = {
			"class": "file-original",
			type: "file",
			name: name,
			accept: opts.accept || "",
			onchange: (function (name) {
				return function (event) {
					$.element("file_" + name + "_label").innerHTML = this.value.replace(/([^\\\/]+)$/img, "$1");
				};
			})(name)
		};
		if (!opts.not_requiered)
			params.required = true;
		return $.elements.create("div", {
			"class": "file-wrap sizefix",
			style: opts && opts.fullwidth ? "width:100%;" : "",
			append: [
				$.e("div", {"class": "file-fake", append:[
					$.e("div", {"class": "file-label sizefix", id: "file_" + name + "_label", html: "&nbsp;"}),
					$.e("div", {"class": "file-button btn a sizefix", html: "Обзор.."})
				]}),
				$.e("input", params)
			]
		});
	},

	getInlineForm: function(opts) {
		var e = $.e,
			form = e("form", {append: [
				e("table", {"class": "s", append: e("tr", {append: [
						e("td", {"class": "s-text", append: [
							e("input", {
								type: opts.type || "text",
								"class": "sizefix",
								name: opts.name,
								value: (opts.value || "").unsafe(),
								onkeyup: opts.onkeyup,
								autocomplete: "off",
								onblur: opts.onblur,
								placeholder: (opts.placeholder || "").unsafe()
							})
						]}),
						e("td", {"class": "s-submit", append: e("input", {type: "submit", name: "submitbtninline", value: opts.title}) })
					]})
				})
			],
			onsubmit: opts.onsubmit
		});
		return form;
	},

	/**
	 * @deprecated
	 */
	CreateHider: function (head, content, isOpened) {
		var parent = document.createElement("div");
		head.onclick = function (event) {
			$.elements.toggleClass(content, "hidden");
		};
		if (!isOpened)
			$.elements.addClass(content, "hidden");
		parent.appendChild(head);
		parent.appendChild(content);
		return parent;
	},

	/**
	 * @deprecated
	 */
	CreateWriteForm:function(opts, ownerId, postId){
		var Form=document.createElement("form"), txtr, smbx;
		opts = opts || {};
		if (!opts.nohead)
			Form.appendChild(Site.CreateHeader(opts.title || "Добавить комментарий"));
		if (opts && opts.data)
			for(var label in opts.data)
				Form[label] = opts.data[label];
		var additionally = [],
			labelInput = function (name, tip) {
				return $.e("label", {"class": "ib", append: [
					$.e("input", {type: "checkbox", name: name}),
					$.e("span", {html: " " + tip})
				]});
			},
			at = opts && opts.allowAttachments || 0;
		if (opts.asAdmin || opts.realAdmin) {
			additionally.push(labelInput("as_admin", "от имени сообщества"));
		};

		if (opts.withSign) {
			additionally.push(labelInput("sign", "подпись"));
		};

		if (opts.friends_only) {
			additionally.push(labelInput("friends_only", "только друзьям"));
		};

		if (opts.reply || ownerId && postId) {
			additionally.push($.e("input", {type: "hidden", name: "reply_cid", value: "", id: "wall-comments-reply" + ownerId + "_" + postId}));
		};

		if (opts.timer) {
			additionally.push($.e("input", {type: "hidden", name: "publishDate", value: "", id: "wall-timer-hidden"}))
			additionally.push(Form.timerUI = $.e("div", {id: "wall-publishDate", "class": "wallAttach-item hidden", append: [
				$.e("div", {"class": "wallAttach-unattach", onclick: function (event) {
					this.nextSibling.innerHTML = "";
					Form.publishDate.value = "";
					$.elements.addClass(this.parentNode, "hidden");
				}}),
				$.e("div", {"class": "wallAttach-timer"})
			]}));
		};

		Form.appendChild($.e("div",{
			"class":"wall-new",
			append:[
				!opts.noleft ? $.e("a",{
					href: opts.linkimg || "#" + API.screen_name,
					append: $.e("img", {
						"class": "wall-photoprofile",
						src: getURL(opts.img || API.photo_rec),
						alt: ""
					})
				}) : null,
				$.e("div",{
					"class":"wall-new-right" + (opts.noleft ? " wall-new-right-noleft" : ""),
					append:[
						$.e("div", {"class": "wall-wrap", append: (txtr = $.e("textarea", {
							name: opts.name,
							id: opts.id || "",
							"class": "sizefix",
							html: opts.value || "",
							onkeyup: opts.ctrlEnter ? function (event) {
								if (event.ctrlKey && event.keyCode == KeyboardCodes.enter)
									Form.onsubmit(event);
							} : null
						}))}),
						opts.smiles ? $.e("div", {"class": "fr imdialog-attach-icon-wrap", append: [
							$.e("div", {"class": "imdialog-icon-general imdialog-icon-smile-button"})
						], onclick: function (event) {
							if (!smbx) return;
							$.elements.toggleClass(smbx, "hidden");
						}}) : null,
//						Wall.CreateSelectAttachmentsMenu(opts.owner_id, at, Form),
						$.e("input",{type: "submit", name: "submitbtn", value: lg("general.send")}),
						ownerId && postId ? $.e("div", {id: "wall-comments-replyUI" + ownerId + "_" + postId}) : null,
						$.e("span", {append: additionally}),
						at ? $.e("input",{type:"hidden",value: "", name:"attachments", id:"im-attachments"}) : null,
						at ? $.e("input",{type:"hidden",value: "", name:"geo", id:"im-geo"}) : null,
						at ? $.e("div", {id: "im-listattachments"}) : null,
						at ? $.e("div", {id: "im-selectattach"}) : null,
//						opts.smiles ? (smbx = IM.insertSmilesNode(null, txtr)) : null
					]
				})
			]
		}));
		$.elements.addClass(smbx, "hidden");
		Form.onsubmit=opts.onsubmit;
		return Form;
	},

	/**
	 * @deprecated | 29/02/2016
	 */
	Alert: function (opts) {
		opts = opts || {};
		var wrap = document.createElement("div"),
			elem = document.createElement("div"),
			close = function () {
				try {
					wrap.style.bottom = "-100px";
					wrap.style.opacity = 0;
					Site.redrawAlerts(wrap);
					$.elements.addClass(wrap, "alert-closing");
					setTimeout(function () {
						$.elements.remove(wrap);
					}, 1000);
				} catch (e) {}
			};
		$.event.add(wrap, "click", close);
//      $.event.add(wrap, "click", function (event) {$.elements.remove(this);});
		wrap.className = "alert sizefix";
		if (opts && opts.click)
			elem.onclick = opts.click;
		if (opts && opts.icon)
			elem.appendChild($.e("img", {"class": "alert-icon", src: opts.icon, alt: ""}));
		opts.delay = opts.delay || 50;
		opts.time = opts.time || 5000;
		elem.appendChild($.elements.create("div", {"class": "alert-content" + (opts.icon ? " alert-content-withicon" : ""), html: opts.text}));
		wrap.appendChild(elem);
		wrap.style.opacity = 0;

		var q = document.querySelectorAll(".alert:not(.alert-closing)"), h = 0;
		Array.prototype.forEach.call(q, function (item) {
			h += item.offsetHeight + 30;
		});

		wrap.style.bottom = h + "px";

		setTimeout(function () {
			wrap.style.marginTop = (API.SettingsBitmask & 128 ? 45 : -1) + "px";
			wrap.style.opacity = 1;
		}, opts.delay);
		setTimeout(close, opts.time);
		document.getElementsByTagName("body")[0].appendChild(wrap);
		return wrap;
	},

	/**
	 * @deprecated
	 */
	redrawAlerts: function (deleted) {
		var q = document.querySelectorAll(".alert:not(.alert-closing)"),
			h = 0,
			d = deleted.offsetHeight,
			px = function (p) {return parseInt(p)};
		Array.prototype.forEach.call(q, function (item) {
			item.style.bottom = (px(item.style.bottom) - d - 30) + "px";
		});
	},

	/**
	 * @deprecated
	 */
	associateAuthKey: function (authKey, authId, userId) {
		Support.Ajax("\/api\/v2\/apidog.associateAuthKey", {
			authKey: authKey,
			authId: authId,
			userId: userId
		}, function (data) {
			if (data && data.response && data.response.error) {
				return;
			};
			data = data.response;
			Site.Alert({text: "Settings was successfully synced."});
			Settings.applySettings(data.user.settings, true);
		})
	},

	/**
	 * @deprecated
	 */
	setAPIdogActivity: function () {
		APIdogRequest("support.ping", {}, function (data) {
			data = data.count;
			$.element("count-support").innerHTML = data > 0 ? "<i>" + data + "</i>" : "";
		});
	},

	getDate: function (unix) {
		var date = new Date(unix * 1000);
		var now = parseInt(+new Date() / 1000);
		return date.relative(function(num, unit, ms, loc) {
			if (unit == 3 && num > 1 || unit > 3) {
				return "{d} {month}" + (unit >= 7 ? " {yyyy}" : "") + " {h}:{mm}";
			};
		});
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
						onclick: function (event) {
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

	/**
	 * @deprecated
	 */
	Get: function (a, b) { var c=Site.get(a);return!b&&!c?0:c },
	getAddress: function(o) { return getAddress(o); },
	getScrolled: function(){return getScroll()},
	SetHeader: function(a,b){Site.setHeader(a,b)},
	Append: function(a) { Site.append(a) },
	EmptyField: function(a) { return getEmptyField(a) },
	Escape: function(a) { return String(a).safe() },
	Unescape:function(a){ return String(a).unsafe() },
	CreateDropDownMenu: function(a,b,c){ return new DropDownMenu(a,DDMconvert2new(b),c).getNode() },
	DropDown:function(a,b,c){$.elements.toggleClass(a,"dd-open");var p=$.getPosition(a),b=$.getPosition(b);if(c){a.style.top="auto";a.style.bottom=0}},
	CreateInlineForm: function(a) { return Site.getInlineForm(a); },
	SetBackButton: function(a){},
	enableLoggingAPIRequests: function () {},
	logAPIReuqest: function () {},

};

/**
 * Return url of photo or empty svg-image (if images disabled) or proxy address
 * @param  {string} url  url of photo
 * @param  {string} type extension of file
 * @return {string}      result
 */
function getURL (url, type) {
	type = type || "jpg";
	if (isEnabled(16384)) {
		return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Ctext font-size='26px' y='136' x='9' font-family='sans-serif' line-height='125%25' style='letter-spacing:0px;word-spacing:0px'%3E%3Ctspan x='9' y='136'%3E &lt;Изображение &gt;%3C/tspan%3E%3C/text%3E%3C/svg%3E";
	};

	return (isEnabled(4) ? "\/api\/v2\/apidog.proxyData?t=" + type + "&u=" + encodeURIComponent(url) : url);
};


/**
 * @deprecated
 */
function setDragEventListener(n,t){var s=this;s.e=n;s.s=t.onDragStart;s.d=t.onDrag;s.u=t.onDragEnd;s.sx=0;s.sy=0;s.w=!1;s.p=function(q){q=$.event.fixEvent(q);return{x:q.clientX+window.scrollX,y:q.clientY+window.scrollY}};s.e.onmousedown=function(q){var p=s.p(q);s.sx=p.x;s.sy=p.y;s.w=!0;if(s.s)s.s(q,s)};s.e.onmousemove=function(q){if(!s.w)return;var p=s.p(q);if(s.d)s.d({event:q,e:s.e,ox:p.x-s.sx,oy:p.y-s.sy})};s.e.onmouseup=function(q){var p=s.p(q);s.w=false;if(s.u)s.u({event:q,e:s.e,ox:s.sx-p.x,oy:s.sy-p.y})}};

/**
 * @deprecated
 */
function refreshFeed(){if(getAddress(true)!="feed")return;Feed.RequestPage()};var v65HeaderStyle={className:"gifts-head"};