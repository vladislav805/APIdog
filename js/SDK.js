/**
 * APIdog v6.5 General SDK
 * Vladislav Veluga (c) 2012-2016
 *
 * https://apidog.ru/
 *
 * Branch: editing
 */

function getHead() { return document.getElementsByTagName("head")[0] };
function getBody() { return document.getElementsByTagName("body")[0] };
function getAddress (o) {
	var h = window.location.hash.replace("#", "");
	return o ? h : h.split("?")[0];
};

function setLocation (path) {
	return window.location.hash = "#" + path;
};

function g(id) { return document.getElementById(id) };
function getResponse(data) { return data.response };
function getFrameDocument(frame) { return frame.contentDocument || frame.contentWindow || frame.document };
function getName(u) { return u.name ? u.name.safe() : String(u.first_name).safe() + " " + String(u.last_name).safe() + Site.isOnline(u) };
function isEnabled(bit) { return !!(API.settings.bitmask & bit) };
function isNotification(bit) { return isEnabled(1024) && (API.bitmaskNotifications & bit) > 0 };
function getUnixTime() { return parseInt(Date.now() / 1000) };
function getOffset() { return Site.get("offset") || 0 };
function getAct() { return Site.get("act") };
function isTouch() { return window._isTouch };
function isArray(object) { return Array.isArray(object) };
function inRange(min, value, max) { return min < value && value < max };
function toRange(min, value, max) { return Math.max(min, Math.min(value, max)) };
function getScroll() { return document.documentElement.scrollTop || document.body.scrollTop };
function formatNumber(n) { return parseInt(n).format().replace(/,/ig, "\u2009") };
function random(a, b) {return Number.random(a, b) };
function shuffle(array) { return array.shuffle() };
function httpBuildQuery(array, noEncode) { return Object.toQueryString(array) };
function is2x() { return window.devicePixelRatio > 1 };

function getLoader() {
	return $.e("div", {style: "padding: 90px 0", append: $.e("div", {"class": "loader-svg"})});
};

function getTabPanel(tabs, options) {
	options = options || {};
	var e = $.e,
		wrap = e("div", {"class": "vktab-tabs"}),
		tab,
		item,
		param,
		val;

	for (var label in tabs) {
		item = tabs[label];
		tab = e("a", { "class": "vktab-tab", html: item.title });

		if (item.link) {
			tab.href = "#" + item.link;
		} else {
			$.event.add(tab, "click", item.onclick);
		};

		if (item.current) {
			param = Site.get(item.current.name);
			val = item.current.value;

			if (typeof val === "string" ? val == param : isArray(val) && !~val.indexOf(param)) {
				$.elements.addClass(tab, "vktab-tab-active");
			};
		};

		wrap.appendChild(tab);
	};

	return e("div", {"class": "vktab-wrap", append: wrap});
};

function prefix(node, property, value) {
	var forPrefix = property[0].toUpperCase() + property.substring(1);
	node.style["webkit" + forPrefix] = value;
	node.style["moz" + forPrefix] = value;
	node.style["ms" + forPrefix] = value;
	node.style["o" + forPrefix] = value;
	node.style[property] = value;
	return node;
};

function setSelectionRange(input, start, end) {
	if (input.setSelectionRange) {
		input.setSelectionRange(start, end);
	} else {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveStart("character", start);
		range.moveEnd("character", end - start);
		range.select();
	};
};

function setSmartScrollListener(node, callback, isReverse) {
	var fired = false, reset = function() { fired = false; };
	node.addEventListener("scroll", function(event) {
		var scrolled = this.scrollTop,
			blockHeight = this.offsetHeight,
			contentHeight = Array.prototype.reduce.call(this.children, function(prev, cur) {
				return prev + cur.offsetHeight;
			}, 0),
			needLoading = !isReverse ? contentHeight - scrolled - (blockHeight * 1.5) < 0 : scrolled < blockHeight * 1.5;

		if (needLoading && !fired) {
			fired = true;
			callback(reset);
		};

	});
};

function recognizeBrowser (ua, returnAsObject) {
	ua = (ua || navigator.userAgent).toLowerCase();
	var browser = "Unknown", os = "Unknown";
	if (/yabrowser\/([\d\.]+)/i.test(ua))
		browser = "Яндекс.Браузер " + (/yabrowser\/([\d\.]+)/i.exec(ua)[1]);
	else if (/opr\/([\d\.]+)/i.test(ua))
		browser = "Opera " + (/opr\/([\d\.]+)/i.exec(ua)[1]);
	else if (/chrome\/([\d\.]+)/i.test(ua))
		browser = "Chrome " + (/chrome\/([\d\.]+)/i.exec(ua)[1]);
	else if (/safari\/([\d\.]+)/i.test(ua))
		browser = "Safari " + (/safari\/([\d\.]+)/i.exec(ua)[1]);
	else if (/msie ([\d\.])/i.test(ua))
		browser = "Internet Explorer " + (/msie ([\d\.])/i.exec(ua)[1]);
	else if (/firefox\/([\d\.]+)/i.test(ua))
		browser = "Mozilla Firefox " + (/firefox\/([\d\.]+)/i.exec(ua)[1]);

	if (/ios/i.test(ua))
		os = "iOS " + (function(v) {
			return v.replace(/_/g, ".");
		})((/os ([\d_]+)/i).exec(ua)[1]);
	else if (/android/i.test(ua))
		os = "Android " + (/android ([\d\.]+)/i.exec(ua)[1]);
	else if (/windows/i.test(ua))
		os = "Windows " + (function(v) {
			return {
				"5.0": "2000",
				"5.1": "XP",
				"6.0": "Vista",
				"6.1": "7",
				"6.2": "8",
				"6.3": "8.1",
				"10": "10",
				"10.0": "10"
			}[v] || "(unknown version)";
		})(/windows NT\s?([\d\.]+)/i.exec(ua)[1]);
	else if (/linux/i.test(ua))
		os = "Linux";
	if (~ua.indexOf("mobile"))
		browser += " (mobile)";

	if (~ua.indexOf("Win64") || ~ua.indexOf("WOW64"))
		os += " (x64)";
	if (~ua.indexOf("Win32"))
		os += " (x86)";

	return !returnAsObject ? "Browser: " + browser + " / OS: " + os : {browser: browser, os: os};
};

function VKConfirm(title, text, callback, from) {
	if (!callback) {
		callback = text;
		text = title;
		title = Lang.get("general.confirm");
	};
	var modal = new Modal({
		title: title,
		content: text,
		width: 350,
		footer: [
			{
				name: "yes",
				title: Lang.get("general.yes"),
				onclick: function() {
					modal.close();
					callback();
				}
			},
			{
				name: "no",
				title: Lang.get("general.no"),
				onclick: function() {
					modal.close();
				}
			}
		]
	}).show(from);
	return modal;
};

var _isTouch = true;
window.addEventListener("mousemove", function _mouseMoveDetector() {
    _isTouch = false;
    $.elements.removeClass(getBody(), "isTouch");
    window.removeEventListener("mousemove", _mouseMoveDetector);
});


/**
 * Prototypes
 */

/**
 * Geerate string with name of value of file
 * @return {String} string, contains value and unit of measure
 */
Number.prototype.getInformationValue = function() {
	if (this <= 0) {
		return "0 b";
	};
	var n;
	for (var i = 5; i >= 0; --i) {
		n = Math.round(this / Math.pow(1024, i) * 10) / 10;
		if (n >= 1)
			return n + " " + (("b Kb Mb Gb Tb".split(" "))[i]);
	};
	return null;
};

/**
 * Return formatted string by lang-values
 * @param {mixed} data  if object, replacing by this key=>value, else - it key for replacing
 * @param {mixed} value if in first arg string: it contain new value
 */
String.prototype.setLang = function(data, value) {
	if (!$.isObject(data)) {
		return this.replace(new RegExp("%" + data, "img"), Lang.get(value));
	};
	var s = this, i;
	for (var k in data) {
		i = data[k];
		if (isNaN(i)) {
			if (!i.indexOf("!")) {
				i = i.replace("!", "");
			} else if (!i.indexOf("@")) {
				i = i.replace("@", "").split(".");
				i = Lang.get(i[0], i[1], value);
			} else {
				i = Lang.get(i);
			}
		};
		s = s.replace(new RegExp("%" + k, "img"), i);
	};
	return s;
};

String.prototype.schema = function(data) {
	var s = this, k;
	for (k in data) {
		s = s.replace(new RegExp("%" + k, "img"), data[k]);
	};
	return s;
};

/**
 * Return HTML-code from pseudo-BB-code
 * @return {String} result html-code
 */
String.prototype.bb = function() {
	return String(this)
		.replace(/\[(s|b|u|i|big|small|h1|h2|h3|pre|center|(h|b)r)\](.*?)\[\/\1\]/igm, "<$1>$3</$1>")
		.replace(/\[(red|gray)\](.*?)\[\/\1\]/igm, "<span class='bb-color-$1'>$2</$1>")
		.replace(/\[li\](.*?)\[\/li\]/igm, "<div class='bb-li'>$1</div>")
		.replace(/\[url=(.*?)\](.*?)\[\/url\]/img, "<a href='$1'>$2<\/a>");
};

var emojiNeedReplace = !~navigator.userAgent.toLowerCase().indexOf("iphone"),
	emojiRegExp = /((?:[\u2122\u231B\u2328\u25C0\u2601\u260E\u261d\u2626\u262A\u2638\u2639\u263a\u267B\u267F\u2702\u2708]|[\u2600\u26C4\u26BE\u2705\u2764]|[\u25FB-\u25FE]|[\u2602-\u2618]|[\u2648-\u2653]|[\u2660-\u2668]|[\u26A0-\u26FA]|[\u270A-\u2764]|[\uE000-\uF8FF]|[\u2692-\u269C]|[\u262E-\u262F]|[\u2622-\u2623]|[\u23ED-\u23EF]|[\u23F8-\u23FA]|[\u23F1-\u23F4]|[\uD83D\uD83C\uD83E]|[\uDC00-\uDFFF]|[0-9]\u20e3|[\u200C\u200D])+)/g,
	emojiCharSequence = /[0-9\uD83D\uD83C\uD83E]/,
	emojiFlagRegExp = /\uD83C\uDDE8\uD83C\uDDF3|\uD83C\uDDE9\uD83C\uDDEA|\uD83C\uDDEA\uD83C\uDDF8|\uD83C\uDDEB\uD83C\uDDF7|\uD83C\uDDEC\uD83C\uDDE7|\uD83C\uDDEE\uD83C\uDDF9|\uD83C\uDDEF\uD83C\uDDF5|\uD83C\uDDF0\uD83C\uDDF7|\uD83C\uDDF7\uD83C\uDDFA|\uD83C\uDDFA\uD83C\uDDF8/,
	emojiImageTemplate = "<img src=\"\/\/vk.com\/images\/emoji\/{code}{size}.png\" alt=\"{symbol}\" class=\"emoji\" \/>",
	emojiImageTemplateProxy = "<img src=\"\/\/static.apidog.ru\/proxed\/smiles\/{code}.png\" alt=\"{symbol}\" class=\"emoji\" \/>",
	emojiHandler = function(s){var i=0,b="",a="",n,y=[],c=[],d,l,o="",j=!1,f=!1;while(n=s.charCodeAt(i++)){d=n.toString(16).toUpperCase();l=s.charAt(i-1);if(i==2&&n==8419){c.push("003"+s.charAt(0)+"20E3");y.push(s.charAt(0));b='';a='';continue};b+=d;a+=l;if(!l.match(emojiCharSequence)){c.push(b);y.push(a);b='';a=''}};if(b){c.push(b);y.push(a)};b="";a="";for(var i in c){d=c[i];l=y[i];if(l.match(/\uD83C[\uDFFB-\uDFFF]/)){b+=d;a+=l;continue};if(j){b+=d;a+=l;j=!1;continue};if(d=="200C"||d=="200D"){if(b){j=!0;continue}else o+=l};if(l.match(/\uD83C[\uDDE6-\uDDFF]/)){if(f){b+=d;a+=l;f=!1;continue};f=!0;}else if(f)f=!1;if(b)o+=emojiRender(b,a,!0);b=d;a=l};if(b)o+=emojiRender(b,a,!0);return o},
	emojiRender = function(a,b){return(isEnabled(4)?emojiImageTemplateProxy:emojiImageTemplate).format({code:a,size:is2x()?"_2x":"",symbol:b})};

String.prototype.emoji = function() {
	return emojiNeedReplace ? this.replace(emojiRegExp, emojiHandler).replace(/\uFE0F/g, '') : this;
};

/* Replaced by SugarJS */

Number.prototype.fix00 = function() { return this < 10 ? "0" + this : this };
Number.prototype.toK = function() { return this.metric(1, "|KM") };
String.prototype.safe = function() { return this.escapeHTML() };
String.prototype.unsafe = function() { return this.unescapeHTML() };




/* APIdog API request function */

window.APIdogAPIDomain	= "apidog.ru";
window.APIdogAPIPath	= "/6.5/api-v2.php?method=";

function APIdogRequest(method, params, callback, fallback, progress) {
	params = params || {};
	params.authKey = API.userAuthKey;
	var xhr = new XMLHttpRequest(),
		postFields = Object.toQueryString(params),
		key;
	xhr.open("POST", location.protocol + "\/\/" + window.APIdogAPIDomain + window.APIdogAPIPath + method, true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function(event) {

		if (xhr.readyState == xhr.DONE) {
			if (xhr.status == 200) {
				var json = JSON.parse(xhr.responseText);
				if (json.response && !json.response.errorId) {
					callback && callback(json.response);
				} else {
					fallback && fallback(json.response);
				};
			} else {
				fallback && fallback({}, xhr);
			};
		};
	};

	progress && (xhr.onprogress = function(event) {
		console.log(event.loaded,event.total, event.loaded * 100 / event.total)
		progress(event.loaded * 100 / event.total);
	});

	xhr.send(postFields);
};

/* Events */

function init(event) {
	if (APIdogNoInitPage) {
		return;
	};

	identifyDeviceByCSS();
	$.elements.addClass(getBody(), isMobile ? "mobile" : "pc");
	window.addEventListener("hashchange", function(event) {
		console.info("hash changed", window.location.hash);
			Site.Go(window.location.hash);
	});

	if (!Lang.lang) { Lang.lang = API.settings.languageId; }; // using ?



	menu.initTouchEvents();

	startFirstRequestAPI();

	window.addEventListener("scroll", function(event) {
		if (!window.onScrollCallback)
			return;
		var top = getScroll();
		window.onScrollCallback({
			top: top,
			originalEvent: event,
			needLoading: top + (document.documentElement.clientHeight * 2) > document.documentElement.offsetHeight
		});
	});
	//window.addEventListener("resize", reWriteWidthToTopLeftButton);
	window.addEventListener("resize", function(event) {

		if (!window.onResizeCallback) {
			return;
		};

		var c  = $.element("content"),
			cp = $.getPosition(c),
			p  = $.element("page"),
			pp = $.getPosition(p),
			w  = document.getElementsByTagName("body"),
			wp = $.getPosition(p);
		window.onResizeCallback({
			originalEvent: event,
			content:    {width: cp.width, height: cp.height},
			page:       {width: pp.width, height: pp.height},
			body:       {width: wp.width, height: wp.height}
		});
	});
	getBody().addEventListener("dragenter", function(event) {
		if (!window.onDragEnter)
			return;
		event.preventDefault();
		window.onDragEnter(event);
		return false;
	});
	getBody().addEventListener("dragleave", function(event) {
		if (!window.onDragLeave)
			return;
		event.preventDefault();
		window.onDragLeave(event);
		return false;
	});
	getBody().addEventListener("drop", function(event) {
		if (!window.onDropped)
			return;
		window.onDropped(event);
		event.preventDefault();
		return false;
	});
	getBody().addEventListener("keydown", function(event) {
		if (!window.onKeyDownCallback)
			return;

		window.onKeyDownCallback({
			key: event.keyCode,
			originalEvent: event
		});
	});
	getBody().addEventListener("keydown", function(event) {
		event = event || window.event;
		var stop = function() { $.event.cancel(event) };
		switch (event.keyCode) {
			case KeyboardCodes.MEDIA_CHANGE_STATE:
			case KeyboardCodes.F1:
				Audios.Player.Trigger();
				stop();
				break;

			case KeyboardCodes.TAB:
				var el = document.querySelector(".imdialog-icon-smile-button");
				if (!el || event.ctrlKey || event.shiftKey) return;
				el.click();
				stop();
				break;

			case KeyboardCodes.MEDIA_PREVIOUS:
			case KeyboardCodes.F2:
				Audios.Previous();
				stop();
				break;

			case KeyboardCodes.MEDIA_NEXT:
			case KeyboardCodes.F3:
				Audios.Next();
				stop();
				break;
		}
	});
	getBody().addEventListener("click", function(event) {
		var opened = document.querySelector(".dd-open"), clicked = event.target, init;

		if (!opened) {
			return;
		};

		init = opened.parentNode;

		do {
			if (clicked == init) {
				return;
			};
		} while (clicked = clicked.parentNode);

		$.elements.removeClass(opened, "dd-open");
	});

	$.getDate = function(n,t){n=+n+(window._timeOffset||0);var t=typeof t=="undefined"?1:t,i=new Date,e;i.setTime(n*1e3);var r=new Date,o=i.getDate(),s=i.getMonth(),f=i.getFullYear(),c=i.getHours(),u=i.getMinutes(),v=i.getSeconds(),l=r.getDate(),a=r.getMonth(),h=r.getFullYear(),y=r.getHours(),p=r.getMinutes(),w=r.getSeconds();if(u=u<10?"0"+u:u,l==o&&a==s&&h==f){if(t==2)return c+":"+u;e=Lang.get("general.todayS")}else e=l-1==o&&a==s&&h==f?Lang.get("general.yesterdayS"):o+" "+Lang.get("general.months")[s]+" "+(h==f?"":f);return t==1&&(e+=Lang.get("general.dateAt")+c+":"+u),e};

};

function startFirstRequestAPI() {
	Loader.main.setTitle("Requesting user info...");
	new APIRequest("execute", {
		code: 'return{u:API.users.get({fields:"photo_50,photo_100,screen_name,bdate",v:5.52})[0],c:API.account.getCounters(),b:API.account.getBalance(),a:API.account.getAppPermissions(),s:API.store.getProducts({filters:"active",type:"stickers",v:5.52,extended:1}),l:API.messages.getRecentStickers().sticker_ids,f:API.friends.get({fields:"online,photo_50,photo_100,sex,bdate,screen_name,can_write_private_message,city,country",v:5.52,order:"hints"}),d:API.utils.getServerTime()};'
	}).setOnErrorListener(function() {
		new Modal({
			title: Lang.get("site.errorWhileInitTitle"),
			content: Lang.get("site.errorWhileInit"),
			footer: [
				{
					name: "enableProxy",
					title: Lang.get("site.errorWhileInitButtonProxy"),
					onclick: function() {
						if (!(API.settings.bitmask & 4)) {
							API.settings.bitmask += 4;
						};

						startFirstRequestAPI();
						this.close();
					}
				},
				{
					name: "tryAgain",
					title: Lang.get("site.errorWhileInitButtonTryAgain"),
					onclick: function() {
						startFirstRequestAPI();
						this.close();
					}
				}
			]
		}).show();
	}).setOnCompleteListener(function(data) {
		var user = data.u, friends, isAlreadyStarted = false;

		API.userId      = user.id;
		API.bdate = user.bdate;

		Local.add([user]);

		// показать имя и фото в шапке
		user && Site.showUser(user);

		// вычислить временную неточность между настоящим временем и временем на устройстве
		window._timeOffset = parseInt(Date.now() / 1000) - data.d;

		API.access = data.a;

		// сохранить доступные стикеры
//		data.s && data.s.items && IM.saveStickers(data.s.items);

		// сохранить последние использованные стикеры
//		data.l && IM.saveLastStickers(data.l);

		// показать счетчики в меню
		data.c && Site.setCounters(data.c);

		// сохранить баланс голосов, если доступны
		data.b && (API.userBalance = data.b);

		// показать дни рождения под меню
//		(friends = data.f) && (Local.add(friends.items) && Friends.showBirthdays(friends.items));

		if (!APIdogNoInitPage) {
			setInterval(UpdateCounters, 60000);
		};

/*		if (!API.APIdogAuthUserId) {
			Site.associateAuthKey(API.userAuthKey, API.APIdogAuthId, user.id);
		};
*/

		Loader.main.setTitle("Loading language data...");
		Lang.load(function() {
			Loader.main.close();
			onInited();
			if (!getAddress()) {
				window.location.hash = "#" + user.screen_name;
				isAlreadyStarted = true;
			};

			if (!isAlreadyStarted) {
				Site.Go(getAddress());
			};
		});

		var age = 0;
		if (/^\d+\.\d+\.\d+$/img.test(API.bdate)) {
			var year = +API.bdate.split(".")[2];
			age = new Date().getFullYear() - year;
		};
	}).execute();
};

var _initqueue = [];

function onInited (fx) {
	fx && _initqueue.push(fx) || (function(a,b,c){for (b=-1,c=a.length;++b<c;){a[b]()}})(_initqueue);
};

var Loader = {

	main: {

		CLASS_WRAP: ".loadScreen-wrap",
		CLASS_TITLE: ".loadScreen-title",

		setTitle: function(title) {
			document.querySelector(Loader.main.CLASS_TITLE).innerHTML = title;
		},

		close: function() {
			$.elements.remove(document.querySelector(Loader.main.CLASS_WRAP));
			$.elements.removeClass(document.documentElement, "_notloaded");
		}

	}

};

var menu = {
	toggle: function() { $.elements.toggleClass(g("wrap"), "menu-opened"); },

	// created 11.01.2016
	// refactored 09.02.2016
	initTouchEvents: function() {
		delete Hammer.defaults.cssProps.userSelect;

		var wrap = $.element("wrap"),
			menu = $.element("dog-menu"),

			clso = "menu-opened",
			clsp = "menu-pan",

			hammer = new Hammer(wrap),

			listen = null,

			start = 0,

			x,

			vertical = 0,

			reset = function() {
				listen = null;
				$.elements.removeClass(menu, clsp);
				prefix(menu, "transform", "");
			},

			setTransform = function(x) {
				prefix(menu, "transform", "translateX(" + x + "px)");
			},

			open = function() {
				reset();
				$.elements.addClass(wrap, clso);
			},

			close = function() {
				reset();
				$.elements.removeClass(wrap, clso);
			},

			restore = function() {
				reset();
				start ? open() : close();
			},

			directionDetected = 0;

		hammer.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL });

		hammer.on("pan", function(event) {
			vertical++;

			if (listen === null) {
				if (vertical < 5) {
					vertical++;
				} else {
					listen = event.deltaX / event.deltaY > 1;
				};
			};
		});

		hammer.on("panstart", function(event) {
			if (event.pointerType == "mouse") {
				return listen = false;
			};

			start = $.elements.hasClass(wrap, clso) ? 216 : 0;
			$.elements.addClass(menu, clsp);
			listen = null;
			vertical = 0;
		});

		hammer.on("panleft panright", function(event) {
			if (!listen) return;
			event.preventDefault();

			x = Math.max(0, Math.min(216, !start ? event.deltaX : 216 + event.deltaX));

			!event.isFinal && setTransform(x);
		});

		hammer.on("panend", function(event) {
			if (event.velocityX > .7 && event.deltaX > 0 || x > 172) {
				open(); start = 216;
			} else if (event.velocityX > .7 && event.deltaX < 0 || x < 43) {
				close(); start = 0;
			} else {
				restore();
			};
		});
	},

	/**
	 * Hiding/showing header
	 * @param  {ScrollEvent} event Event-object from listener
	 */
	toTopScrollEvent: function(event) {
		//$.elements[getScroll() > window.CONST_MENU_HEIGHT ? "removeClass" : "addClass"](g("_menu_up"), "hidden");

		var scroll = getScroll(),
			value = toRange(0, _ttrlt + scroll - window._scrlt, 50);

		g("dog-head").style.webkitTransform = "translateY(" + -value + "px)";
		g("dog-head").style.transform = "translateY(" + -value + "px)";

		if ($.elements.hasClass(g("wrap"), "menu-opened")) {
			g("dog-menu").style.top = (50 - value) + "px";
		};

		window._scrlt = scroll;
		window._ttrlt = value;
	}
};

var nav = {
	replace: function(url) {
		url = url.replace(/^#/img, "");
		window.history.replaceState({}, null, "#" + url);
	},

	go: function(url) {
		url = url.replace(/^#/img, "");
		window.history.pushState({}, null, "#" + url);
		Site.Go(url);
	}
};


/*
 *	Вопрос: только вот какого хуя оно не пашет одновременно одним способом и там и там?!
 */

window.addEventListener("scroll", menu.toTopScrollEvent);

var _scrlt = getScroll();
var _ttrlt = 0;

window.KeyboardCodes = {
	LEFT: 37,
	RIGHT: 39,
	UP: 38,
	DOWN: 40,
	DELETE: 8,
	TAB: 9,
	ENTER: 13,
	ESC: 27,
	PAGEUP: 33,
	PAGEDOWN: 34,
	SPACE: 32,
	MEDIA_PREVIOUS: 177,
	MEDIA_NEXT: 176,
	MEDIA_STOP: 178,
	MEDIA_CHANGE_STATE: 179,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123
};
function loadStickers() {
	new APIRequest("store.getProducts", {filters: "active", type: "stickers", v: 5.52, extended: 1}).setWrapper(APIDOG_REQUEST_WRAPPER_V5).setOnCompleteListener(function(data) {
		data = data.items;
		IM.saveStickers(data);
	}).execute();
};


var APINotify = {

	mEvents: {},

	listen: function(eventId, listener) {
		APINotify.mEvents[eventId] ? APINotify.mEvents[eventId].push(listener) : (APINotify.mEvents[eventId] = [listener]);
		return this;
	},

	fire: function(eventId, extra) {
		var query = APINotify.mEvents[eventId];

		if (!query || !query.length) {
			return;
		};

		for (var i = 0, l = query.length; i < l; ++i) {
			query[i](extra);
		};

		return this;
	}

};

var DogEvent = {

	PROFILE_USER_BLOCK_CHANGED: 100,
	PROFILE_USER_FAVORITE_CHANGED: 101,
	PROFILE_STATUS_CHANGED: 102,

	FRIEND_STATUS_CHANGED: 200,

	AUDIO_LIST_PRELOADED: 1100,
	AUDIO_ADDED: 1101,
	AUDIO_PLAYLIST_CHANGED: 1102,

	DOCUMENT_UPLOADED: 1200,
	DOCUMENT_EDITED: 1201,
	DOCUMENT_ADDED: 1202,
	DOCUMENT_DELETED: 1203,

	INTERNAL_SETTINGS_CHANGED: 3200

};


function getBrowserFeatures () {
	var u = navigator.userAgent.toLowerCase(),
		is = function(s) {
			return ~u.indexOf(s);
		},
		get = function(cases) {
			var item;
			for (var name in cases) {
				item = cases[name].split("|");
				for (var i = 0, l = item.length; i < l; ++i) {
					if (is(item[i])) {
						return name;
					};
				};
			};
			return null;
		};

	return {
		os: get({ linux: "x11|linux", mac: "mac", windows: "win" }),
		browser: get({ ie: "msie|edge", firefox: "firefox", opera: "opr|opera", yabrowser: "yabrowser", chrome: "chrome", safari: "applewebkit" }),
		engine: get({ ie: "trident", gecko: "gecko", presto: "opera|presto", webkit: "webkit" })
	};
};

function identifyDeviceByCSS () {
	var features = getBrowserFeatures();
	for (var key in features) {
		$.elements.addClass(getBody(), features[key]);
	};
}


function cancelEvent(e){e=e||window.event;if(!e)return!1;e=e.originalEvent||e;e.preventDefault&&e.preventDefault();e.stopPropagation&&e.stopPropagation();e.cancelBubble=!0;return e.returnValue=!1;};
function sizeof(a){return Object.keys(a).length;};

window.onResizeCallback;
window.onKeyDownCallback;
window.onLeavePage;
window.onScrollCallback;
window.onLikedItem;
window.onNewMessageReceived;
window.onMessageReaded;
window.onTyping;
window.onChatUpdated;
window.vkLastCheckNotifications = getUnixTime();
window.isMobile = /(mobile?|android|ios|bada|j2me|wp|phone)/ig.test(navigator.userAgent.toLowerCase());

var Local = {
	Users: {},
	AddUsers: function(a) { return Local.add(a); },

	/**
	 * Сохранение данных о пользователях/группах/чатах и пр.
	 * 23/09/2014: updated, returns object (v6.3.3.0.1)
	 * 07/08/2016: добавлена поддержка хранения chat (v6.5)
	 * @param {Array} users Массив с пользователями
	 */
	add: function() {
		if (arguments.length > 1) {
			Array.prototype.forEach.call(arguments, function(a) { Local.add(a) });
			return Local.Users;
		};

		var users = arguments[0];

		if (users == null) {
			return;
		};

		if (!$.isArray(users)) {
			users = [users];
		};
		var j;
		for (var i = 0; i < users.length; ++i) {
			j = users[i];
			if (!j) {
				continue;
			};
			var id = {
				"group": -(j.gid || j.id),
				"event": -(j.gid || j.id),
				"page": -(j.gid || j.id),
				"profile": j.uid || j.id,
				"chat": APIDOG_DIALOG_PEER_CHAT_MAX_ID + (j.id || j.chat_id)
			}[j.type || "profile"];
			if (!(id in Local.Users)) {
				Local.Users[id] = {};
			};

			if (!("screen_name" in Local.Users[id]) && !("screen_name" in j)) {
				Local.Users[id].screen_name = (id > 0 ? "id" + id : "club" + -id);
			};

			for (var label in j) {
				Local.Users[id][label] = j[label];
			};

			if (id < 0 && !(("photo" in Local.Users[id]) || ("photo_rec" in Local.Users[id]))) {
				var p = Local.Users[id].photo_50;
				Local.Users[id].photo = p;
				Local.Users[id].photo_rec = p;
				Local.Users[id].photo_50 = p;
			};
		};
		return Local.Users;
	},

	getUserByDomain: function(screen_name) {
		for (var user in Local.Users)
			if (Local.Users[user].screen_name == screen_name)
				return Local.Users[user];
		return false;
	}
};

function UpdateCounters () {
	new APIRequest("execute", {
		code: ("return{c:API.account.getCounters(),f:API.friends.getOnline({v:5.8,online_mobile:1}),n:API.notifications.get({start_time:%s,count:5})" + (isEnabled(1) ? ",online:API.account.setOnline({voip:0})" : "") + "};").schema({s: vkLastCheckNotifications})
	}).setOnCompleteListener(function(data) {
		vkLastCheckNotifications = getUnixTime();
		if (!data || APIdogNoInitPage)
			return;

		Site.setCounters(data.c);
		Site.showNewNotifications(data.n);

		var friends = Friends.friends[API.userId] && Friends.friends[API.userId].items || [],
			f = data.f,
			fo = f.online,
			fom = f.online_mobile,
			id;
		for (var i = 0, l = friends.length; i < l; ++i) {
			id = friends[i].id;

			friends[i].online = ~fom.indexOf(id) || ~fo.indexOf(id);
			friends[i].online_mobile = ~fom.indexOf(id);
			friends[i].online_app = !~fo.indexOf(id);
		};
		//Friends.friends[API.userId].items = friends;

	}).execute();
};

function getSelectNumbersInRange (options, min, max, value, step) {
	step = step || 1;
	var select = $.e("select", {name: options.name, onchange: options.onchange || null}), attrs;
	for (var x = min; x <= max; x += step) {
		attrs = {value: x, html: options.labels ? options.labels[x] : x};
		if (value == x) {
			attrs.selected = true;
		};
		select.appendChild($.e("option", attrs));
	};
	return select;
};

function createInputDate(options, date) {
	options = options || {};
	var e = $.e,
		wrap,
		target,
		u = new Date(date * 1000),
		d,
		m,
		y,
		h,
		i,
		getDaysInMonth = function(month, year) {
			return [31, year % 4 ? 28 : 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		recount = function() {
			var sel = d.selectedIndex,
				cur = getDaysInMonth(m.options[m.selectedIndex].value - 1, y.options[y.selectedIndex].value);
			Array.prototype.forEach.call(d.options, function(node, index) {
				var over = index >= cur;
				node.style.display = over ? "none" : "";
				node.disabled = over;
				if (over && index == sel)
					d.selectedIndex = 0;
			});
		};

	wrap = e("div", {"class": "ui-dateChooser", append: [

		d = getSelectNumbersInRange({
			name: options.name + "Day"
		}, 1, 31, u.getDate()),

		m = getSelectNumbersInRange({
			name: options.name + "Month",
			labels: [null, "января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
			onchange: recount
		}, 1, 12, u.getMonth() + 1),

		y = getSelectNumbersInRange({
			name: options.name + "Year",
			onchange: recount
		}, 2016, 2018, u.getFullYear()),

		h = getSelectNumbersInRange({
			name: options.name + "Hours"
		}, 0, 23, u.getHours()),

		i = getSelectNumbersInRange({
			name: options.name + "Minutes"
		}, 0, 59, u.getMinutes(), 5),
	]});

	return {

		node: wrap,

		getValue: function() {
			return getUnixtimeFromCustomInputBundle(d, m, y, h, i);
		},

		setCurrentDate: function(xd, xm, xy, xh, xi) {
			setSelectedItem(d, xd);
			m.selectedIndex = xm - 1;
			setSelectedItem(y, xy);
			setSelectedItem(h, xh);
			setSelectedItem(i, xi);
		}
	};
};

function LazyImage(url, width, height) {

	this._node = $.e("img", {"src-url": url, src: "data:image/svg+xml,%3Csvg height=%220%22 width=%220%22 viewport=%220 0 0 0%22 version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3C/svg%3E", onload: this._loaded.bind(this), style: "background: url(\"" + lzHolder + "\") no-repeat center center" });

	if (width && height) {
		this._node.width = width;
		this._node.height = height;
	};

	lzQueue.push(this);

	this._node.addEventListener("progress", function(event) { console.log("IMAGE PROGRESS") });

	this.x = -1;
	this.y = -1;

};

LazyImage.prototype = {

	getNode: function() {
		return this._node;
	},

	load: function() {
		this._node.setAttribute("src", this._node.getAttribute("src-url"));
	},

	find: function() {
		var pos = $.getPosition(this._node);
		this.x = pos.left;
		this.y = pos.top;
	},

	setClass: function(cls) {
		this._node.className = Array.prototype.join.call(arguments, " ");
		return this;
	},

	_loaded: function() {

	}

};

var lzQueue = [],
	lzCache = {},
	lzLast = 0,
	lzHolder = "data:image/svg+xml,%3Csvg height=%2226%22 width=%2226%22 viewport=%220 0 100 100%22 version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3ClinearGradient id=%22int%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%220%25%22%3E%3Cstop offset=%220%25%22 stop-opacity=%221%22 stop-color=%22%23567CA4%22%3E%3C/stop%3E%3Cstop offset=%2260%25%22 stop-opacity=%221%22 stop-color=%22%23567CA4%22%3E%3C/stop%3E%3Cstop offset=%22100%25%22 stop-opacity=%220%22 stop-color=%22%23567CA4%22%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle style=%22stroke: url%28'%23int'%29 none;%22 r=%2211.5%22 cy=%2213%22 cx=%2213%22 stroke=%22%23567CA4%22 stroke-width=%223%22 stroke-dasharray=%2231.7929, 40.4637%22 stroke-dashoffset=%220%22 transform-origin=%22center center%22 fill=%22transparent%22%3E %3CanimateTransform attributeType='xml' attributeName='transform' type='rotate' from='0 13 13' to='360 13 13' dur='0.8s' repeatCount='indefinite'/%3E %3C/circle%3E%3C/svg%3E";

function lz(src, width, height) {
	var image;
	if (lzCache[src]) {
		image = lzCache[src].getNode();
	} else {
		image = new LazyImage(src, width, height);
		lzCache[src] = image;
	};
	return image.getNode();
};

ModuleManager.eventManager.addEventListener("SDK", function() {
	window.addEventListener("scroll", function(event) {
		var d;
		if ((d = Date.now()) - lzLast < 200) {
			return;
		};

		var top = getScroll(),
			limit = top + document.documentElement.clientHeight;

		lzLast = d;

		lzQueue = lzQueue.filter(function(image) {
			if (image.y < 0) {
				image.find();
			};

			if (image.y <= top || image.y >= limit) {
				return true;
			};

			image.load();

			return false;
		});
	});

});

function getUnixtimeFromCustomInputBundle(d, m, y, h, i) {
	var d = new Date(
			y.options[y.selectedIndex].value.trim(),
			m.options[m.selectedIndex].value.trim() - 1,
			d.options[d.selectedIndex].value.trim(),
			h.options[h.selectedIndex].value.trim(),
			i.options[i.selectedIndex].value.trim(),
			0
	);

	return d.toString() === "Invalid Date" ? 0 : parseInt(d.getTime() / 1000);
};

function setSelectedItem(select, value) {
	Array.prototype.forEach.call(select.options, function(item, index) {
		if (item.value == value) {
			select.selectedIndex = index;
		};
	});
};

function extendClass(child, parent) {
	var F = function() { };
	F.prototype = parent.prototype;
	child.prototype = new F();
	child.prototype.constructor = child;
	child.superclass = parent.prototype;
};

function extendObject(target, data) {
	target = target || {};
	data = data || {};
	Object.keys(data).forEach(function(key) {
		if (!target[key])
			target[key] = data[key];
	});
	return target;
};

var truncateDefaultOptions = {
	length: 300,
	minTrail: 20,
	moreText: "Показать полностью"
};
function truncate (text, options) {

	options = extendObject(options, truncateDefaultOptions);

	var

		isOver = options.length == -1 ? false : text.length > options.length + options.minTrail,
		indexSplit = isOver ? text.indexOf(" ", options.length) : text.length,
		textSmall = text.substring(0, indexSplit),
		textRemaining = text.substring(indexSplit),

		nodeSmall = $.e("span", {
			html: Site.Format(textSmall).emoji()
		}),
		nodeEllipsis = $.e("span", {
			html: "… "
		}),
		nodeRemaining = $.e("span", {
			"class": "hidden",
			html: Site.Format(textRemaining).emoji()
		}),
		nodeButton = $.e("a", {
			"class": "wall-showMoreButton",
			html: options.moreText,
			href: "#",
			onclick: function(event) {
				$.elements.removeClass(nodeRemaining, "hidden");
				$.elements.remove(nodeEllipsis);
				$.elements.remove(this);
				event.preventDefault();
				return false
			}
		});

	return isOver ? $.e("p", {append: [
		nodeSmall,
		nodeEllipsis,
		nodeButton,
		nodeRemaining
	]}) : nodeSmall;
};



function parse (data, fx) {
	return data.map(function(i) {
		return new fx(i);
	});
};

function VKList (data, constructor) {
	data = data || {count: -1, items: []};
	this.items = constructor ? parse(data.items, constructor) : data;
	this.count = data.count;
};

VKList.prototype = {

	has: function(i) {
		return !!this.get(i);
	},

	get: function(i) {
		return this.items[i];
	},

	map: function(callback) {
		return this.items.map(callback);
	},

	getItems: function() {
		return this.items;
	},

	getCount: function() {
		return this.count;
	}

};

// created 09.02.2016
// updated 10.02.2016
function ExtendedModal (options) {
	options = options || {};
	options.noPadding = true;
	this.modal = new Modal(options);

	this.customizeCallbacks();
};

ExtendedModal.prototype = {

	customizeCallbacks: function() {
		var m = this.modal, context = this;

		$.elements.addClass(m.modal, "modal-x"); // add pseudo name
		m._windowStateChanged(); // fix scroll, unblocked
		m._windowStateChanged = function() { }; // clear for nothing

		m._addCloseButtonHead();

		m._setupButtons = function() { };
		m.addButton = function() { };

		m._onResizeDocument = function() {
			context.onResizeDocument(context.getSizes());
		};

		m.wrap.style.display = "block";
		m.wrap.style.justifyContent = "";
		m.wrap.style.alignItems = "";
		m.modal.style.marginTop = "0";
		m.block.style.display = "none";

		this.initMoveableTitle(m.title);
	},

	getSizes: function() {
		var p = $.getPosition(this.modal.modal);
		return {
			documentWidth: document.documentElement.clientWidth,
			documentHeight: document.documentElement.clientHeight,
			modalWidth: p.width,
			modalHeight: p.height,
			modalTop: p.top,
			modalLeft: p.left,
			modalRight: document.documentElement.clientWidth - p.left,
			modalBottom: document.documentElement.clientHeight - p.top
		};
	},

	initMoveableTitle: function(title) {
		var coods = { x: 0, y: 0 },
			dragged = false,
			pos,
			computeDelta = function(x, y) {
				return { x: x - coods.x, y: y - coods.y };
			},
			d,
			context = this;

		$.event.add(title, "mousedown", function(event) {
			pos = context.getSizes();
			coods = { x: event.clientX, y: event.clientY };
			dragged = true;
		});

		$.event.add(title, "mousemove", function(event) {
			if (!dragged) return;

			d = computeDelta(event.clientX, event.clientY);

			context.setPosition(pos.modalLeft + d.x, pos.modalTop + d.y);
		});

		$.event.add(title, "mouseup", function(event) {
			dragged = false;
		});

		$.event.add(title, "mouseout", function(event) {
			dragged = false;
		});
	},

	onResizeDocument: function() {
		var p = this.getSizes();
		this.setPosition(p.modalLeft, p.modalTop);
	},

	setPosition: function(l, t, w, h) {
		var p = this.getSizes(),
			getCorrectCoordinate = function(v, m) {
				return v < 0 ? 0 : v > m ? m : v;
			};

		this.modal.modal.style.left = getCorrectCoordinate(l, p.documentWidth - p.modalWidth) + "px"; // x
		this.modal.modal.style.top = getCorrectCoordinate(t, p.documentHeight - p.modalHeight) + "px"; // y

		if (w !== undefined) {
			this.modal.modal.style.width = w + "px";
		};

		if (h !== undefined) {
			this.modal.modal.style.height = h + "px";
		};

		return this;
	},

	show: function() {
		this.modal.show();
		return this;
	},

	close: function() {
		this.modal.close();
		return this;
	},

	closeAfter: function(a) {
		this.modal.closeAfter(a);
		return this;
	}
};


setInterval(function() {
	Array.prototype.forEach.call(document.querySelectorAll(".__autodate"), function(i) {
		i.innerHTML = Site.getDate(+i.getAttribute("data-unix"));
	});
}, 5000);

if(!md5){var md5=function(n){var j=function(o,r){var q=(o&65535)+(r&65535),p=(o>>16)+(r>>16)+(q>>16);return(p<<16)|(q&65535)},g=function(o,p){return(o<<p)|(o>>>(32-p))},k=function(w,r,p,o,v,u){return j(g(j(j(r,w),j(o,u)),v),p)},a=function(q,p,w,v,o,u,r){return k((p&w)|((~p)&v),q,p,o,u,r)},h=function(q,p,w,v,o,u,r){return k((p&v)|(w&(~v)),q,p,o,u,r)},c=function(q,p,w,v,o,u,r){return k(p^w^v,q,p,o,u,r)},m=function(q,p,w,v,o,u,r){return k(w^(p|(~v)),q,p,o,u,r)},b=function(A,u){var z=1732584193,y=-271733879,w=-1732584194,v=271733878,r,q,p,o;A[u>>5]|=128<<((u)%32);A[(((u+64)>>>9)<<4)+14]=u;for(var t=0,s=A.length;t<s;t+=16){r=z;q=y;p=w;o=v;z=a(z,y,w,v,A[t+0],7,-680876936);v=a(v,z,y,w,A[t+1],12,-389564586);w=a(w,v,z,y,A[t+2],17,606105819);y=a(y,w,v,z,A[t+3],22,-1044525330);z=a(z,y,w,v,A[t+4],7,-176418897);v=a(v,z,y,w,A[t+5],12,1200080426);w=a(w,v,z,y,A[t+6],17,-1473231341);y=a(y,w,v,z,A[t+7],22,-45705983);z=a(z,y,w,v,A[t+8],7,1770035416);v=a(v,z,y,w,A[t+9],12,-1958414417);w=a(w,v,z,y,A[t+10],17,-42063);y=a(y,w,v,z,A[t+11],22,-1990404162);z=a(z,y,w,v,A[t+12],7,1804603682);v=a(v,z,y,w,A[t+13],12,-40341101);w=a(w,v,z,y,A[t+14],17,-1502002290);y=a(y,w,v,z,A[t+15],22,1236535329);z=h(z,y,w,v,A[t+1],5,-165796510);v=h(v,z,y,w,A[t+6],9,-1069501632);w=h(w,v,z,y,A[t+11],14,643717713);y=h(y,w,v,z,A[t+0],20,-373897302);z=h(z,y,w,v,A[t+5],5,-701558691);v=h(v,z,y,w,A[t+10],9,38016083);w=h(w,v,z,y,A[t+15],14,-660478335);y=h(y,w,v,z,A[t+4],20,-405537848);z=h(z,y,w,v,A[t+9],5,568446438);v=h(v,z,y,w,A[t+14],9,-1019803690);w=h(w,v,z,y,A[t+3],14,-187363961);y=h(y,w,v,z,A[t+8],20,1163531501);z=h(z,y,w,v,A[t+13],5,-1444681467);v=h(v,z,y,w,A[t+2],9,-51403784);w=h(w,v,z,y,A[t+7],14,1735328473);y=h(y,w,v,z,A[t+12],20,-1926607734);z=c(z,y,w,v,A[t+5],4,-378558);v=c(v,z,y,w,A[t+8],11,-2022574463);w=c(w,v,z,y,A[t+11],16,1839030562);y=c(y,w,v,z,A[t+14],23,-35309556);z=c(z,y,w,v,A[t+1],4,-1530992060);v=c(v,z,y,w,A[t+4],11,1272893353);w=c(w,v,z,y,A[t+7],16,-155497632);y=c(y,w,v,z,A[t+10],23,-1094730640);z=c(z,y,w,v,A[t+13],4,681279174);v=c(v,z,y,w,A[t+0],11,-358537222);w=c(w,v,z,y,A[t+3],16,-722521979);y=c(y,w,v,z,A[t+6],23,76029189);z=c(z,y,w,v,A[t+9],4,-640364487);v=c(v,z,y,w,A[t+12],11,-421815835);w=c(w,v,z,y,A[t+15],16,530742520);y=c(y,w,v,z,A[t+2],23,-995338651);z=m(z,y,w,v,A[t+0],6,-198630844);v=m(v,z,y,w,A[t+7],10,1126891415);w=m(w,v,z,y,A[t+14],15,-1416354905);y=m(y,w,v,z,A[t+5],21,-57434055);z=m(z,y,w,v,A[t+12],6,1700485571);v=m(v,z,y,w,A[t+3],10,-1894986606);w=m(w,v,z,y,A[t+10],15,-1051523);y=m(y,w,v,z,A[t+1],21,-2054922799);z=m(z,y,w,v,A[t+8],6,1873313359);v=m(v,z,y,w,A[t+15],10,-30611744);w=m(w,v,z,y,A[t+6],15,-1560198380);y=m(y,w,v,z,A[t+13],21,1309151649);z=m(z,y,w,v,A[t+4],6,-145523070);v=m(v,z,y,w,A[t+11],10,-1120210379);w=m(w,v,z,y,A[t+2],15,718787259);y=m(y,w,v,z,A[t+9],21,-343485551);z=j(z,r);y=j(y,q);w=j(w,p);v=j(v,o)}return[z,y,w,v]},f=function(r){var q="",s=-1,p=r.length,o,t;while(++s<p){o=r.charCodeAt(s);t=s+1<p?r.charCodeAt(s+1):0;if(55296<=o&&o<=56319&&56320<=t&&t<=57343){o=65536+((o&1023)<<10)+(t&1023);s++}if(o<=127){q+=String.fromCharCode(o)}else{if(o<=2047){q+=String.fromCharCode(192|((o>>>6)&31),128|(o&63))}else{if(o<=65535){q+=String.fromCharCode(224|((o>>>12)&15),128|((o>>>6)&63),128|(o&63))}else{if(o<=2097151){q+=String.fromCharCode(240|((o>>>18)&7),128|((o>>>12)&63),128|((o>>>6)&63),128|(o&63))}}}}}return q},e=function(p){var o=Array(p.length>>2),r,q;for(r=0,q=o.length;r<q;r++){o[r]=0}for(r=0,q=p.length*8;r<q;r+=8){o[r>>5]|=(p.charCodeAt(r/8)&255)<<(r%32)}return o},l=function(p){var o="";for(var r=0,q=p.length*32;r<q;r+=8){o+=String.fromCharCode((p[r>>5]>>>(r%32))&255)}return o},d=function(o){return l(b(e(o),o.length*8))},i=function(q){var t="0123456789abcdef",p="",o;for(var s=0,r=q.length;s<r;s++){o=q.charCodeAt(s);p+=t.charAt((o>>>4)&15)+t.charAt(o&15)}return p};return i(d(f(n)))}};

function parseToIDObject (data) {
	var o = {};
	(data || []).forEach(function(i) {
		o[i.id] = i;
	});
	return o;
};

function getAttachmentIdsByObjects (data) {
	return (data || []).map(function(i) {
		if (i.type === "link") {
			return i.link.url;
		};
		return i.type + (i.owner_id || i.oid || -i.gid) + "_" + (i.id || i.aid || i.vid || i.did || i.gid || i.nid || i.pid);
	});
};

function getRadioGroupSelectedValue (radios) {
	var result = null;
	if (!radios.length) return radios.value;
	Array.prototype.forEach.call(radios, function(i) {
		if (i.checked) result = i.value;
	});
	return result;
};


var APIQueue = {
	index: 0,
	queue: [],
	history: {},

	add: function(apiRequest) {
		if (!apiRequest) {
			return;
		};

		if (!apiRequest.isComplete()) {
			APIQueue.queue.push(apiRequest);
			APIQueue.history[++this.index] = apiRequest;
		};

		return this.index;
	},

	get: function(index) {
		return this.history[index];
	}
};

/**
 * Extended request to API
 * Created 29/02/2016
 */
function APIRequest (method, params) {
	this.method = method;
	this.params = params || {};
	this.queueId = APIQueue.add(this);
	this.mTime = Date.now();
	this.mSendVia = APIDOG_REQUEST_VIA_DIRECT;
	this.mState = APIDOG_REQUEST_STATE_CREATED;
	this._init();
};

APIRequest.createExecute = function(code, params) {
	params = params || {};
	params.code = code;
	return new APIRequest("execute", params);
};



APIRequest.prototype = {

	/**
	 * Way of requesting
	 */
	mSendVia: null,

	/**
	 * Current state of request
	 * Do not modify manually!
	 */
	mState: null,

	/**
	 * Listener, which will be called, when request returns correct response
	 */
	mCompleteListener: null,

	/**
	 * Listener, which will be called, when request get error or internet connection is refused
	 */
	mErrorListener: null,

	/**
	 * Object extends Request
	 */
	mRequest: null,

	/**
	 * Result
	 */
	mResult: null,

	/**
	 * Wrapper of request
	 */
	mWrapper: null,

	/**
	 * If need loggin all changes of request
	 */
	mDebug: false,

	/**
	 * Time of creating request
	 */
	mTime: 0,

	/**
	 * Initializate object
	 * Do not call manually!
	 */
	_init: function() {
		this.setParam(APIDOG_CONST_ACCESS_TOKEN, API.userAccessToken);
		this.setParam(APIDOG_CONST_LANG, "ru"); // TODO: user-defined language
		this.setParam(APIDOG_CONST_RANDOM, Math.random());
		!this.getParam(APIDOG_CONST_VERSION) && this.setParam(APIDOG_CONST_VERSION, APIDOG_REQUEST_DEFAULT_VERSION);

		if (API.settings.bitmask & APIDOG_SETTINGS_PROXY) {
			this.mSendVia = APIDOG_REQUEST_VIA_PROXY;
		};

		this._debug("inited", this);
	},

	/**
	 * Logging to console, if mDebug = true
	 */
	_debug: function() {
		Array.prototype.splice.call(arguments, 0, 0, "Request<" + this.method + ">#" + this.getQueueId() + " (" + (this._time() / 1000).toFixed(3) + "s): ");
		this.mDebug && console.log.apply(console, arguments);
	},

	/**
	 * Returns time until start request
	 * @return {Number} Period in ms
	 */
	_time: function() {
		return Date.now() - this.mTime;
	},

	/**
	 * User define listener for response
	 */
	setOnCompleteListener: function(listener) {
		this.mCompleteListener = listener;
		return this;
	},

	/**
	 * User define listener for errors
	 */
	setOnErrorListener: function(listener) {
		this.mErrorListener = listener;
		return this;
	},

	/**
	 * Set wrapper of request.
	 * Supported values: APIDOG_REQUEST_WRAPPER_V5
	 */
	setWrapper: function(type) {
		this.mWrapper = type;
		return this;
	},

	/**
	 * If the query is executed using direct mode, instant stop request will not be. Instead, the
	 * query will be executed,but callback will not be called.
	 */
	cancel: function() {
		this.mRequest && this.mRequest.cancel();
		this._debug("cancelled", this);
	},

	/**
	 * When you call this method builds and executes a request to the API.
	 */
	execute: function() {
		this._convertParams();
		this._prepareRequest();
		this.mRequest.send(httpBuildQuery(this.params));

		return this;
	},

	/**
	 * Change value of paramether of request
	 * Can be invoked only before calling .execute()
	 */
	setParam: function(key, value) {
		if (this.mState >= APIDOG_REQUEST_STATE_REQUESTED) {
			throw "<APIRequest>.setParam(...): already put in the request, modify the parameters are prohibited";
		};

		this.params[key] = value;
		return this;
	},

	/**
	 * Enable debug-logiing
	 */
	debug: function() {
		this.mDebug = true;
		return this;
	},

	/**
	 * Returns currently value of paramether by key
	 */
	getParam: function(key) {
		return this.params[key];
	},

	/**
	 * Convert keys of params-object from camelCaseStyle to under_score by rules
	 */
	_convertParams: function() {
		var vkStyle = function(key) { return key.replace(/[A-Z]/g, function(a) {return "_" + a.toLowerCase()})},
			params = {};

		for (var key in this.params) {
			params[vkStyle(key)] = String(this.params[key]);
		};

		this.params = params;
		this._debug("converted params");
		return params;
	},

	/**
	 * Returns true, if request completed
	 */
	isComplete: function() {
		return this.mState == APIDOG_REQUEST_STATE_LOADED;
	},

	_wrapperV5: function() {
		return {

			getCode: function(method, params) {
				return "return API." + method + "(" + this.getParams(params) + ");"
			},

			getParams: function(p) {
				p = this.removeDefaultParams(p);

				var pairs = [], t;
				for (var key in p) {
					t = p[key];

					if (t === undefined) {
						continue;
					};

					pairs.push(key + ":" + this.getValue(t));
				};
				return pairs.length ? "{" + pairs.join(",") + "}" : "";
			},

			removeDefaultParams: function(p) {
				p.lang = undefined;
				p.access_token = undefined;
				p.random = undefined;
				return p;
			},

			getValue: function(v) {
				return !isNaN(v) ? null == v || "" == v ? "\"\"" : v : "\"" + v.replace(/"/igm, "\\\"").replace(/\n/img, "\\n") + "\"";
			}

		};
	},

	/**
	 * Preparing params for sending request
	 */
	_prepareRequest: function() {
		this._debug("preparing request");
		/**
		 * Sometimes we need wrap request in execute with version 4.x for getting info in version 5.x: in param code
		 * we change version yo 5.x
		 */
		if (this.mWrapper) {
			switch (this.mWrapper) {
				case APIDOG_REQUEST_WRAPPER_V5:
					var code = this._wrapperV5().getCode(this.method, this.params);
					this.method = "execute";
					this.params = {code: code};
					this._init();
					break;
			};
		};

		/**
		 * If body of request has length more than 4kb (4096 symbols), than direct request via script will be failure
		 * with error 400 bad request
		 */
		if (httpBuildQuery(this.params).length > 4096 - 5 - 32) {
			this._debug("enabled transport: proxy");
			this.mSendVia = APIDOG_REQUEST_VIA_PROXY;
		};

		if (API.extension && API.extension.versionSDK >= 2.0 && !isEnabled(APIDOG_SETTINGS_PROXY)) {
			this._debug("enabled transport: extension");
			this.mSendVia = APIDOG_REQUEST_VIA_EXTENSION;
		};

		switch (this.mSendVia) {
			case APIDOG_REQUEST_VIA_DIRECT:
				this.mRequest = new DirectRequest(this);
				break;

			case APIDOG_REQUEST_VIA_PROXY:
				this.mRequest = new ProxyRequest(this);
				break;

			case APIDOG_REQUEST_VIA_EXTENSION:
				this.mRequest = new ExtensionRequest(this);
				break;
		};

		mState = APIDOG_REQUEST_STATE_PREPARED;
	},

	/**
	 * Returns queue indifier
	 */
	getQueueId: function() {
		return this.queueId;
	},

	/**
	 * Calling when request was completed (data recieved)
	 */
	_onCompleteLoad: function(result) {
		this.mResult = result;
		this.mState = APIDOG_REQUEST_STATE_LOADED;
		this._debug("completed", this);
		if ("response" in result) {
			if ("execute_errors" in result) {
				this._debug("\nExecute errors:", result.execute_errors, "\n\nParams:", this.params);
			};
			this.mCompleteListener && this.mCompleteListener(result.response);
		} else if ("error" in result) {
			this._onErrorAPI(result.error);
		};
	},

	/**
	 * Calling when while requesting was ocurred error
	 */
	_onError: function(reason) {
		this._debug("error is unknown, go to custom error listener");
		this.mErrorListener && this.mErrorListener({reason: reason}, APIDOG_REQUEST_ERROR_INTERNAL);
	},

	/**
	 *
	 */
	_onErrorAPI: function(error) {
		this._debug("error in response vk occured", error);
		switch (error.error_code) {
			case APIDOG_REQUEST_API_ERROR_CAPTCHA:
				Site.showCaptcha(error);
				break;

			case APIDOG_REQUEST_API_ERROR_INVALID_TOKEN:

				window.location.href = "/authorize.php?act=logout&from=v6.5";
				break;

			case APIDOG_REQUEST_API_ERROR_RUNTIME:
				var msg = "Runtime error API: debug info\n\nMethod: " + this.method + "\nParams:\n" + (function(a) {
					var b = [];
					for (var c in a) {
						b.push(c + " = " + a[c]);
					}
					return b.join("\n");
				})(this.params);
				console.error(msg);
				alert(msg);
				break;

			default:
				this.mErrorListener && this.mErrorListener(error, APIDOG_REQUEST_ERROR_API);
		};
	}
};

/**
 * Direct request: get info by request to api.vk.com
 */
function DirectRequest (apiRequest) {
	this.mRequest = apiRequest;
	this.mNode = $.e("script", {type: "text/javascript"});
};
DirectRequest.prototype = {

	/**
	 * Script-transfer node
	 */
	mNode: null,

	/**
	 * @Override
	 * Send request
	 */
	send: function(paramsString) {
		this.setUp(paramsString);
		getHead().appendChild(this.mNode);
	},

	/**
	 * Set URL-address for API
	 */
	setUp: function(params) {
		var s = this;
		this.mNode.src = "https:\/\/api.vk.com\/method\/" + this.mRequest.method + "?" + params + "&callback=APIQueue.history[" + this.mRequest.getQueueId() + "].mRequest.mListener";
		this.mNode.onerror = function(event) {
			s._onError(event);
		};
	},

	/**
	 * Input data
	 */
	mListener: function(data) {
		this.mRequest._onCompleteLoad(data);
	},

	/**
	 * @Override
	 * Cancel request: by setting callback function to empty
	 */
	cancel: function() {
		this.mListener = function() {  };
	},

	/**
	 * Invoked when request catch error
	 */
	_onError: function(event) {
		this.mRequest._onError(APIDOG_REQUEST_FAILED_BY_UNKNOWN);
	}

};

/**
 * Proxy request: get info by request it via proxy APIdog server
 */
function ProxyRequest (apiRequest) {
	this.mRequest = apiRequest;
	this.mXhr = new XMLHttpRequest();
	this._init();
};

ProxyRequest.prototype = {

	_init: function() {
		var self = this;
		this.mXhr.open("POST", "//apidog.ru:4006/method/" + this.mRequest.method);
		this.mXhr.onreadystatechange = function() {
			if (self.mXhr.readyState === 4) {
				if (self.mXhr.status === 200) {
					self._onResponse();
				} else {
					self._onError();
				}
				self.mXhr = null;
			}
		};
	},

	/**
	 * @Override
	 * Send request
	 */
	send: function(paramsString) {
		this.mXhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		this.mXhr.send(paramsString);
	},

	/**
	 * Input data
	 */
	_onResponse: function() {
		this.mRequest._onCompleteLoad(JSON.parse(this.mXhr.responseText));
	},

	/**
	 * Error listener, when has problems witch connection
	 */
	_onError: function() {
		this.mRequest._onError(!this.mXhr.status ? APIDOG_REQUEST_FAILED_BY_NETWORK_PROBLEMS : APIDOG_REQUEST_FAILED_BY_APIDOG_DOWN);
	},

	/**
	 * @Override
	 * Cancel request: by setting callback function to empty
	 */
	cancel: function() {
		this.mListener = function() {  };
	}

};

/**
 * Extension request: get info by request it via extension APIdog Plus
 */
function ExtensionRequest (apiRequest) {
	this.mRequest = apiRequest;

};

ExtensionRequest.prototype = {

	/**
	 * @Override
	 * Send request
	 */
	send: function(paramsString) {
		sendEvent("onAPIRequestExecute", {
			requestMethod: this.mRequest.method,
			requestParams: this.mRequest.params,
			requestId: this.mRequest.getQueueId()
		});
	},

	/**
	 * Input data
	 */
	_onResponse: function(result) {
		this.mRequest._onCompleteLoad(result);
	},

	/**
	 * Error listener, when has problems witch connection
	 */
	_onError: function() {
		this.mRequest._onError(!this.mXhr.status ? APIDOG_REQUEST_FAILED_BY_NETWORK_PROBLEMS : APIDOG_REQUEST_FAILED_BY_APIDOG_DOWN);
	},

	/**
	 * @Override
	 * Cancel request: by setting callback function to empty
	 */
	cancel: function() {
		this.mListener = function() {  };
	}

};

window.receiveEvent && receiveEvent("onAPIRequestExecuted", function(data) {
	APIQueue.get(data.requestId).mRequest._onResponse(data.requestResult);
});













function timeInterval(t) {
	var d = Math.ceil(Date.now() / 1000);
	return Math.max(d, t) - Math.min(d, t);
};



function share(type, ownerId, itemId, accessKey, callback, access) {

	access = /*access ||*/ {wall: true, user: true, group: true};

	type = type.replace("post", "wall");

	var
		l = Lang.get,

		wrapper = $.e("div"),

		objectId = ownerId + (itemId ? "_" + itemId : ""),
		object = type + objectId + (accessKey ? "_" + accessKey : ""),

		step = 0,
		targetType,
		targetId,
		comment,

		chooseForm,
		chooseFormId,
		chooseTargetIdForm,
		chooseTargetIdLoading,
		chooseTargetIdEmpty,

		commentNode,

		text = function(text) {
			return document.createTextNode(text);
		},

		loadTargetItems = function(type, callback) {
			switch (+type) {
				case APIDOG_SHARE_TARGET_TYPE_MESSAGE:
					new APIRequest("execute", {
						code: "var m=API.messages.getDialogs({count:70,v:5.38}).items,i=0,l=m.length,d=[],c=[],u=[],g=[],o;while(i<l){o=m[i].message;d.push([o.user_id,o.chat_id]);if(o.user_id<0){g.push(-o.user_id);}else if(o.chat_id){c.push(o.chat_id);}else{u.push(o.user_id);};i=i+1;};return{dialogs:d,users:API.users.get({user_ids:u}),groups:API.groups.getById({group_ids:g}),chats:API.messages.getChat({chat_ids:c})};"
					}).setOnCompleteListener(function(result) {
						var u = parseToIDObject(result.users),
							g = parseToIDObject(result.groups),
							c = parseToIDObject(result.chats);
						callback(result.dialogs.map(function(i) {
							if (i[1]) {
								return {value: "c" + i[1], html: l("share.targetLabelChat") + " «" + c[i[1]].title + "»"};
							} else if (i[0] < 0) {
								return {value: "g" + (-i[0]), html: g[-i[0]].name};
							} else {
								return {value: "u" + i[0], html: u[i[0]].first_name + " " + u[i[0]].last_name};
							};
						}));
					}).execute();
					break;
				case APIDOG_SHARE_TARGET_TYPE_GROUP:
					new APIRequest("groups.get", {
						filter: "editor",
						fields: "members_count",
						extended: 1,
						v: 5.28
					}).setWrapper(APIDOG_REQUEST_WRAPPER_V5).setOnCompleteListener(function(result) {
						callback(result.items.map(function(i) {
							return {value: i.id, html: i.name};
						}));
					}).execute();
					break;

				default:
					console.log("WTF?!", type)
					callback([]);
			}
		},

		setNodeByStep = function(step) {
			switch (step) {
				case APIDOG_SHARE_STEP_CHOOSE_TARGET_TYPE:
					wrapper.appendChild(chooseForm = $.e("form", {"class": "sf-wrap", append: [
						access.wall ? $.e("label", {append: [
							$.e("input", {type: "radio", name: "targetType", value: APIDOG_SHARE_TARGET_WALL, checked: true}),
							$.e("span", {html: l("share.targetTypeWall")})
						]}) : null,
						access.user ? $.e("label", {append: [
							$.e("input", {type: "radio", name: "targetType", value: APIDOG_SHARE_TARGET_TYPE_MESSAGE}),
							$.e("span", {html: l("share.targetTypeUser")})
						]}) : null,
						access.group  ? $.e("label", {append: [
							$.e("input", {type: "radio", name: "targetType", value: APIDOG_SHARE_TARGET_TYPE_GROUP}),
							$.e("span", {html: l("share.targetTypeGroup")})
						]}) : null
					]}));
					break;

				case APIDOG_SHARE_STEP_CHOOSE_TARGET_ID:
					targetType = getRadioGroupSelectedValue(chooseForm.targetType);

					if (targetType == APIDOG_SHARE_TARGET_WALL) {
						return nextStep(targetId = API.userId);
					};

					clearWrapper();

					if (!chooseFormId) {
						chooseFormId = $.e("div", {append: [
							$.e("div", {"class": "tip", html: l(targetType == APIDOG_SHARE_TARGET_TYPE_MESSAGE ? "share.chooseTargetUser" : "share.chooseTargetGroup")}),
							chooseTargetIdForm = $.e("select", { "class": "sf", append: chooseTargetIdLoading = $.e("option", {value: 0, html: l("share.chooseStateLoading")}) })
						]});
						chooseTargetIdForm.disabled = true;

						loadTargetItems(targetType, function(items) {
							$.elements.remove(chooseTargetIdLoading);
							chooseTargetIdForm.appendChild(chooseTargetIdEmpty = $.e("option", {value: 0, html: l("share.chooseStateNotSelected"), selected: true}));
							items.map(function(item) {
								chooseTargetIdForm.appendChild($.e("option", item));
							});
							chooseTargetIdForm.disabled = false;
						});
					};
					wrapper.appendChild(chooseFormId);
					break;

				case APIDOG_SHARE_STEP_ADD_COMMENT:
					if (chooseTargetIdForm) {
						targetId = chooseTargetIdForm.options[chooseTargetIdForm.selectedIndex].value;
					};

					if (targetId == "0") {
						return previousStep();
					};

					clearWrapper();

					wrapper.appendChild($.e("div", {append: [
						targetType == APIDOG_SHARE_TARGET_WALL && (type == "photo" || type == "video" || type == "club") ? $.e("blockquote", {html: l("share.warningOnline")}) : null,
						$.e("div", {"class": "tip", html: l("share.commentLabel")}),
						commentNode = $.e("textarea", { "class": "sf" })
					]}));
					commentNode.focus();
					modal.setButton("ok", {name: "ok", title: l("share.buttonComplete"), onclick: okButtonCallback});
					break;

				case APIDOG_SHARE_STEP_DO_SHARE:
					comment = commentNode.value.trim();
					doShare();
					break;

				default:
					// ты чо, ты чо охуел?
			};
		},

		nextStep = function() {
			setNodeByStep(++step);
		},

		previousStep = function() {
			setNodeByStep(--step);
		},

		clearWrapper = function() {
			$.elements.clearChild(wrapper);
		},

		doShare = function() {
			switch (+targetType) {
				case APIDOG_SHARE_TARGET_WALL:
					new APIRequest("wall.repost", { object: object, message: comment }).debug().setOnCompleteListener(function(result) {
						console.log(result);
						callback && callback(!!result, {
							message: false,
							postId: result.post_id,
							likes: result.likes_count,
							reposts: result.reposts_count
						}, modal);
					}).execute() || modal.close();
					break;

				case APIDOG_SHARE_TARGET_TYPE_MESSAGE:
					var params = { attachment: object, message: comment },
						to = String(targetId).substring(0, 1),
						id = String(targetId).substring(1);

					params[{u: "userId", g: "groupId", c: "chatId"}[to]] = id;
					new APIRequest("messages.send", params).setOnCompleteListener(function(result) {
						callback && callback(!!result, {
							message: true,
							messageId: result,
							peerId: to == "c" ? 2000000000 + id : to === "g" ? -id : id
						}, modal) || modal.close();
					}).execute();
					break;

				case APIDOG_SHARE_TARGET_TYPE_GROUP:
					new APIRequest("wall.repost", { object: object, group_id: targetId, message: comment }).setOnCompleteListener(function(result) {
						callback && callback(!!result, {
							message: false,
							postId: result.post_id,
							likes: result.likes_count,
							reposts: result.reposts_count,
							groupId: targetId
						}, modal) || modal.close();
					}).execute();
					break;

				default:
					console.log("Unknown type")
			};
		},

		okButtonCallback = function(event) {
			nextStep();
		},

		modal = new Modal({
			title: l("share.windowTitle"),
			content: wrapper,
			footer: [
				{
					name: "ok",
					title: l("share.buttonNextStep"),
					onclick: okButtonCallback
				},
				{
					name: "cancel",
					title: l("share.buttonCancel"),
					onclick: function() {
						modal.close();
					}
				}
			]
		}).show();
	nextStep();
};

function actionAfterShare(isSuccess, result, modal) {
	modal
		.setContent(Lang.get("share.afterWindowTitle"))
		.setButtons([
			{
				name: "go",
				title: Lang.get("share.afterButtonGo"),
				onclick: function() {
					var u;
					if (result.message) {
						u = "im?to=" + getPeerId(result.peerId);
					} else {
						u = "wall" + (result.groupId ? -result.groupId : API.userId) + "_" + result.postId;
					};
					window.location.hash = "#" + u;
					modal.close();
				}
			},
			{
				name: "cancel",
				title: Lang.get("share.afterButtonClose"),
				onclick: function() {
					modal.close();
				}
			}
		])
		.closeAfter(7000);
};


/**
 * Attachment choose window
 * Created 12.01.2016
 */

function AttachmentBundle() {

};

AttachmentBundle.prototype = {

	list: [],

	nodeList: null,

	getString: function() {
		return this.list.map(function(item) {
			return item.getAttachId();
		}).join(",");
	},

	registerList: function(node) {
		this.nodeList = node;
		return this;
	},

	add: function(item) {
		this.list.push(item);
		return this;
	},

	getCount: function() {
		return this.list.length;
	},

	get: function() {
		return this.list;
	},

	remove: function(item) {
		if (typeof item === "object") {
			item = this.list.indexOf(item);
			if (!~item) {
				return this;
			};
		};
		this.list.splice(item, 1);
		return this;
	},

	clear: function() {
		this.list = [];
		return this;
	}

};


/* Likes */

/**
 * Возвращает кнопку для лайков
 * Created 10.01.2016 from code Wall.LikeButton
 * @param  {String}   type      Тип
 * @param  {int}      ownerId   Идентификатор владельца
 * @param  {int}      itemId    Идентификатор элемента
 * @param  {String}   accessKey Ключ доступа
 * @param  {int}      likes     Количество лайков
 * @param  {boolean}  isLiked   Лайкнул ли текущий пользователь?
 * @param  {int}      reposts   Количество репостов
 * @param  {Function} callback  Колбэк при успехе добавления/удаления лайка
 * @param  {Object}   options   Опции для кнопки
 * @return {DOMNode}            Кнопка
 */
function getLikeButton(type, ownerId, itemId, accessKey, likes, isLiked, reposts, callback, options) {
	var e = $.e,

		requestLike = function() {
			toggleLike(type, ownerId, itemId, accessKey || "", update);
		},

		update = function(result) {
			setCount(result.likes);
			setLiked(result.isLiked);
			callback && callback(result);
		},

		showLikers = function() {
			likers(type, ownerId, itemId, accessKey, false, { from: wrap });
		},

		setCount = function(n) {
			count.innerHTML = n ? formatNumber(n) : "";
		},

		setLiked = function(s) {
			$.elements[s ? "addClass" : "removeClass"](wrap, "vklike-active");
		},

		label = e("span", {"class": "vklike-label", html: lg("likers.likeButton"), onclick: requestLike}),
		icon = e("div", {"class": "vklike-icon"}),
		iconWrap = e("div", {"class": "vklike-icon-wrap", append: icon, onclick: requestLike}),
		count = e("div", {"class": "vklike-count", onclick: showLikers}),

		wrap = e("div", {
			"class": "vklike-wrap",
			append: [ label, iconWrap, count ]
		});

	setCount(likes);
	setLiked(isLiked);

	if (options && options.right) {
		$.elements.addClass(wrap, "vklike-wrap-right");
	};

	return wrap;
};

/**
 * Возвращает кнопку для репостов
 * Created 10.01.2016
 * @param  {String}   type       Тип
 * @param  {int}      ownerId    Идентификатор владельца
 * @param  {int}      itemId     Идентификатор элемента
 * @param  {String}   accessKey  Ключ доступа
 * @param  {int}      reposts    Количество репостов
 * @param  {boolean}  isReposted Репостнул ли текущий пользователь?
 * @param  {int}      access     Битовая маска, куда можно репостить
 * @param  {Function} callback   Колбэк при успехе репоста
 * @param  {Object}   options    Опции для кнопки
 * @return {DOMNode}             Кнопка
 */
function getRepostButton(type, ownerId, itemId, accessKey, reposts, isReposted, access, callback, options) {
	var e = $.e,

		openShareWindow = function() {
			share(type, ownerId, itemId, accessKey || "", actionAfterShare, access, { from: wrap });
		},

		update = function(result) {
			setCount(result.likes);
			setReposted(result.isReposted);
			callback && callback(result);
		},

		showReposted = function() {
			likers(type, ownerId, itemId, accessKey, true, { from: wrap });
		},

		setCount = function(n) {
			count.innerHTML = n ? formatNumber(n) : "";
		},

		setReposted = function(s) {
			$.elements[s ? "addClass" : "removeClass"](wrap, "vklike-active");
		},

		label = e("span", {"class": "vklike-label", html: lg("likers.repostButton"), onclick: openShareWindow}),
		icon = e("div", {"class": "vklike-repost-icon", onclick: openShareWindow}),
		count = e("div", {"class": "vklike-count", onclick: showReposted}),

		wrap = e("div", {
			"class": "vklike-wrap vkrepost-wrap",
			append: [ label, icon, count ]
		});

	setCount(reposts);
	setReposted(isReposted);

	if (options && options.right) {
		$.elements.addClass(wrap, "vklike-wrap-right");
	};

	return wrap;
};


/**
 * Триггер лайков
 *  * Created 10.01.2016
 * @param  {String}   type      Тип
 * @param  {int}      ownerId   Идентификатор владельца
 * @param  {int}      itemId    Идентификатор элемента
 * @param  {String}   accessKey Ключ доступа
 * @param  {Function} callback  Колбэк при успехе
 * @return {void}
 */
function toggleLike(type, ownerId, itemId, accessKey, callback) {
	new APIRequest("execute", {
		code: 'var p={type:Args.t,item_id:Args.i,owner_id:Args.o,access_key:Args.a},me=API.likes.isLiked(p),act;act=me==0?API.likes.add(p):API.likes.delete(p);return[(-me)+1,act.likes,API.likes.getList(p+{filter:"copies"}).count];',
		o: ownerId,
		i: itemId,
		t: type,
		a: accessKey
	}).setOnCompleteListener(function(data) {
		var p = {
			type: type,
			ownerId: ownerId,
			itemId: itemId,
			accessKey: accessKey,
			isLiked: !!data[0],
			likes: parseInt(data[1]),
			reposts: parseInt(data[2])
		};

		callback && callback(p);
		window.onLikedItem && window.onLikedItem(p);
	}).execute();
};

/**
 * Open modal window and load list of likers of item
 * Created 10.01.2016
 * @param  {String}  type        Тип
 * @param  {int}     ownerId     Идентификатор владельца
 * @param  {int}     itemId      Идентификатор элемента
 * @param  {String}  accessKey   Ключ доступа
 * @param  {boolean} onlyReposts Только ли репосты?
 * @param  {Object}  options     Дополнительные параметры для окна
 * @return {void}
 */
function likers(type, ownerId, itemId, accessKey, onlyReposts, options) {
	options = options || {};
	var
		e = $.e,

		listAll = e("div"),
		listFriends = e("div"),

		friendsOnly = false,

		tab = new TabHost([
			{
				name: "all",
				title: lg("likers.tabAll"),
				content: listAll
			},
			{
				name: "friends",
				title: lg("likers.tabFriends"),
				content: listFriends
			}
		], {
			onOpenedTabChanged: function(event) {
				friendsOnly = event.opened.name == "friends";
				offset = 0;
				isAllLoaded = false;
				isLoading = false;
				load();
			}
		}),

		getCurrentList = function() {
			return !friendsOnly ? listAll : listFriends;
		},

		load = function() {
			if (isAllLoaded) {
				return;
			};

			if (!offset) {
				$.elements.clearChild(getCurrentList()).appendChild(Site.Loader(true));
			};

			new APIRequest("likes.getList", {
					type: type,
					owner_id: ownerId,
					item_id: itemId,
					access_key: accessKey || "",
					count: step,
					filter: onlyReposts ? "copies" : "likes",
					friends_only: friendsOnly ? 1 : 0,
					extended: 1,
					fields: "photo_100,online,screen_name",
					offset: offset,
					v: 5.38
				})
				.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
				.setOnCompleteListener(function(result) {
					if (!offset) {
						$.elements.clearChild(getCurrentList());
					};
					addItemsToList(result.items);
					isLoading = false;
				})
				.execute();
		},

		addItemsToList = function(items) {
			var list = getCurrentList();
			items.forEach(function(user) {
				list.appendChild(Templates.getListItemUserRow(user));
			});
			if (!items.length) {
				isAllLoaded = true;
				if (!list.children.length) {
					list.appendChild(getEmptyField(lg(!onlyReposts ? "likers.listNothing" : "likers.listNothingReposts")))
				};
			};
		},

		offset = 0,
		step = 50,

		isAllLoaded = false,
		isLoading = false,

		modal = new Modal({
			title: lg(!onlyReposts ? "likers.windowTitle" : "likers.windowTitleReposts"),
			content: tab.getNode(),
			noPadding: true,
			footer: [
				{
					name: "close",
					title: lg("likers.windowClose"),
					onclick: function() { this.close() }
				}
			],
			onScroll: function(event) {
				if (isLoading || !event.needLoading) return;
				load((isLoading = true) && (offset += step));
			}
		}).show(options.from);

	load(offset);
};




/**
 * Universal edit-window
 * Created 10.01.2016
 */

function EditWindow (o) {
	o = o || {};

	this.isLangPhrases = !!o.lang;

	// userdata
	this.items = o.items;
	this.validate = !!o.validate;

	// events
	this.onSave = o.onSave;
	this.onValidFail = o.onValidFail;

	// system
	this.modal = null;
	this.content = null;
	this.nodes = {};
	this.state = false;

	// others
	this.fromNode = o.fromNode;

	// initialize
	this.init(o);
	this.populate();
};

EditWindow.prototype = {

	init: function(o) {
		var self = this;
		this.modal = new Modal({
			title: this.label(o.title),
			content: this.content = $.e("form", {"class": "sf-wrap"}),
			footer: [
				{
					name: "save",
					title: o.isEdit ? this.label("general.save", true) : this.label(o.save),
					onclick: function() {
						self.onSubmit();
						this.close();
					}
				},
				{
					name: "close",
					title: this.label("general.cancel", true),
					onclick: function() {
						this.close();
					}
				}
			]
		}).show(this.fromNode || false);
	},

	label: function(key, forceLang) {
		return this.isLangPhrases || forceLang ? Lang.get(key) : key;
	},

	populate: function() {
		var e = $.e, wrap, that = this, node, l = function(t) { return t || "" }, tmp;
		this.items.forEach(function(i) {

			node = null;

			switch (i.type) {
				case APIDOG_UI_EW_TYPE_ITEM_SIMPLE:
					node = e("input", {type: "text", name: i.name, value: l(i.value)});
					break;

				case APIDOG_UI_EW_TYPE_ITEM_TEXTAREA:
					node = e("textarea", {name: i.name, html: l(i.value)});
					break;

				case APIDOG_UI_EW_TYPE_ITEM_SELECT:
					node = e("select", {name: i.name, append: i.items.map(function(s) {
						if (s.value == i.value) {
							s.selected = true;
						};
						return e("option", s);
					})});
					break;

				case APIDOG_UI_EW_TYPE_ITEM_CHECKBOX:
				case APIDOG_UI_EW_TYPE_ITEM_RADIO:
					tmp = {type: i.type == APIDOG_UI_EW_TYPE_ITEM_CHECKBOX ? "checkbox" : "radio", name: i.name, value: i.value};

					if (i.checked) {
						tmp.checked = true;
					};

					node = e("label", {append: [
						e("input", tmp),
						e("span", {html: that.label(i.title)})
					]});
					break;

				case APIDOG_UI_EW_TYPE_ITEM_CUSTOM:
					node = i.node;
					node._getValue = i.getValue;
					break;
			};

			node.setAttribute("data-apt", i.type);

			wrap = e("div", {append: [
				i.type != APIDOG_UI_EW_TYPE_ITEM_CHECKBOX && i.type != APIDOG_UI_EW_TYPE_ITEM_RADIO
					? e("div", {"class": "tip tip-form", html: that.label(i.title)})
					: null,
				that.nodes[i.name] = node
			]});

			that.content.appendChild(wrap);
		});
	},

	onSubmit: function() {
		if (this.state) {
			return;
		};

		if (this.validate && !this.checkValidForm()) {
			this.onValidFail && this.onValidFail();
		};

		this.lock();
		this.onSave && this.onSave(this.getValues(), this.modal);
	},

	lock: function() { this.state = true; },

	unlock: function() { this.state = false; },

	checkValidForm: function() {
		return true; // TODO
	},

	getItemFormNodeByName: function(name) {
		return this.content[name];
	},

	getValues: function() {
		var nodes = this.nodes, data = {}, items = this.items, value, node;
		Object.keys(this.nodes).forEach(function(key) {
			node = nodes[key];
			switch (+node.getAttribute("data-apt")) {
				case APIDOG_UI_EW_TYPE_ITEM_SIMPLE:
				case APIDOG_UI_EW_TYPE_ITEM_TEXTAREA:
					value = node.value;
					break;

				case APIDOG_UI_EW_TYPE_ITEM_SELECT:
					value = node.options[node.selectedIndex].value;
					break;

				case APIDOG_UI_EW_TYPE_ITEM_CHECKBOX:
				case APIDOG_UI_EW_TYPE_ITEM_RADIO:
					value = String(node.firstChild.checked ? 1 : 0);
					break;

				case APIDOG_UI_EW_TYPE_ITEM_CUSTOM:
					value = node._getValue();
					break;

				default:
					value = null;
			};

			data[key] = value;
		});
		return data;
	}

};

/**
 * Выпадающее меню
 * @param {String}                                label   Название меню, то, на что кликают
 * @param {Object<String, Object<String, Mixed>>} actions Элементы меню в формате, описанном ниже
 * @param {Object<String, Mixed>}                 options Опции
 *
 * actions = {
 *     key: {                  key = ключ
 *         string   label      название
 *         function onclick    функция, вызываемая
 *         boolean  isDisabled true, если заблокирован
 *         boolean  isHidden   true, если элемент нужно скрыть
 *     }
 * }
 *
 * options = {
 *     boolean  animation = true          нужна ли анимация?
 *     int      animationDuration = 300   длительность анимации
 * }
 */
function DropDownMenu(label, actions, options) {
	if (typeof label === "object") {
		options = actions;
		actions = label;
		label = lg("general.actions");
	};

	options = options || {};

	this.mLabel = label;
	this.mActions = actions;
	this.mOptions = options;

	this.init();
	this.update();
};

DropDownMenu.prototype = {

	mLabel: "",
	mActions: {},
	mOptions: {},

	mNodeWrap: null,
	mNodeTitle: null,
	mNodeList: null,
	mItemsNodes: {},

	init: function() {
		var self = this;
		this.mNodeWrap = $.e("div", {"class": "xdd-wrap", append: [
			this.mNodeTitle = $.e("div", {"class": "xdd-title", html: this.mLabel, onclick: function(event) {
				self.toggle();
			}}),
			this.mNodeList = $.e("div", {"class": "xdd-items"})
		], onclick: function(event) { event.stopPropagation(); event.cancelBubble = true; }});
		return this;
	},

	isOpened: function() {
		return $.elements.hasClass(this.mNodeList, DropDownMenu.CLASS_OPENED);
	},

	open: function() {
		var lh = parseInt($.getStyle(this.mNodeList).lineHeight),
			count = this.mNodeList.children.length;

		$.elements.addClass(this.mNodeList, DropDownMenu.CLASS_OPENED);
		this.recalcHeight();
	},

	close: function() {
		$.elements.removeClass(this.mNodeList, DropDownMenu.CLASS_OPENED);
		this.mNodeList.style.height = 0;
	},

	toggle: function() {
		this.isOpened() ? this.close() : this.open();
	},

	recalcHeight: function() {
		var lh = parseInt($.getStyle(this.mNodeList).lineHeight), count = 0;
		Array.prototype.forEach.call(this.mNodeList.children, function(itemMenu) {
			count += +!$.elements.hasClass(itemMenu, "hidden");
		});
		this.mNodeList.style.height = (count * lh) + "px";
	},

	update: function() {
		var item;

		$.elements.clearChild(this.mNodeList);
		for (var label in this.mActions) {
			item = this.mActions[label];

//			if (!this.mItemsNodes[label]) {
				this.mItemsNodes[label] = this._createItem(item, label);
//			};

			this.mNodeList.appendChild(this.mItemsNodes[label]);
		};
	},

	add: function(label, options) {
		this.mActions[label] = options;
		this.update();
		return this;
	},

	set: function(label, options) {
		if (!this.mActions[label]) {
			return this;
		};

		for (var key in options) {
			this.mActions[label][key] = options[key];
		};

		return this;
	},

	remove: function(label) {
		delete this.mActions[label];
		this.update();
		return this;
	},

	get: function(label) {
		var i = this.mActions[label], s = this, f = {
			show: function() {
				s.set(label, { isHidden: false });
				return f;
			},

			hide: function() {
				s.set(label, { isHidden: true });
				return f;
			},

			enable: function() {
				s.set(label, { isDisabled: false });
				return f;
			},

			disable: function() {
				s.set(label, { isDisabled: true });
				return f;
			},

			label: function(text) {
				s.mItemsNodes[label].innerHTML = text;
				return f;
			},

			node: function() {
				return s.mItemsNodes[label];
			},

			remove: function() {
				s.remove(label);
				return f;
			},

			commit: function() {
				s.update();
				return f;
			}
		};
		return f;
	},

	_createItem: function(i, key) {
		var self = this;
		console.log("created", i, key);
		return $.e("div", {
			"class": [
				"xdd-item",
				i.isDisabled ? "xdd-item-disabled" : "",
				i.isHidden ? "hidden" : ""
			].join(" "),
			"data-label": key,
			html: i.label,
			onclick: function(event) {
				event.stopPropagation();
				event.cancelBubble = true;

				if (i.isDisabled) {
					return;
				};

				self.close();
				i.onclick(self.get(key));
			}
		})
	},

	getNode: function() {
		return this.mNodeWrap;
	}
};
DropDownMenu.CLASS_OPENED = "xdd-opened";

// back compatible
function DDMconvert2new(a,b,c,d){b={},c=0;for(d in a){b["i"+c++]={label:d,onclick:a[d]}};return b};

/**
 * Возвращает пустое поле с текстом
 * @param  {String}  text Текст
 * @param  {Boolean} lang Брать ли текст из языковых данных или просто использовать текст
 * @return {DOMNode}      Объект поля
 */
function getEmptyField (text, lang) {
	return $.e("div", {"class": "msg-empty", html: lang ? lg(text) : text});
};

// created 10.01.2016
// need refactoring
function uploadFiles (node, o, callbacks) {

	if (!ModuleManager.isModuleLoaded("uploader")) {
		ModuleManager.load("uploader", function() {
			uploadFiles(node, o, callbacks);
		});
		return;
	}

	o = o || {};
	var upload,
		index = 0,

		files = node ? node.files : node == null && "url" in o ? [o.url] : null,

		modal,
		status = $.e("span", {html: lg("attacher.uploadModalConnecting")}),
		progressbar = new ProgressBar(0, 100),

		updateUI = function(event) {
			if (modal) {
				status.innerHTML = (
					event.percent < 99.9
						? lg("attacher.uploadModalSending")
						: lg("attacher.uploadMediaSent")
				);
				progressbar.setValue(event.percent);
			};
			callbacks && callbacks.onUploading && callbacks.onUploading(event);
		},

		result = [],

		finish = function(file) {
			result.push(file);
			callbacks && callbacks.onFileUploaded && callbacks.onFileUploaded(file);
			next();
		},

		next = function() {
			files[++index] ? doTask(index) : endTask();
		},

		handleError = function(error) {
			var f = files[index];
			Site.Alert({text: "upload file &laquo;" + f.name.safe() + "&raquo; failure"});
			callbacks && callbacks.onError && callbacks.onError(f);
			next();
		},

		endTask = function() {
			modal.close();
			modal = null;

			callbacks && callbacks.onTaskFinished && callbacks.onTaskFinished(result);
		},

		doTask = function(index) {
			var f = files[index];
			if (typeof f !== "string" && f.size > 26214400) { // 25MB
				Site.Alert({text: "file &laquo;" + f.name + "&raquo; was passed because size more than 25MB"});
				return next();
			}
			var title = lg("attacher.uploadModalTitle").schema({c: index + 1, a: files.length});
			if (!modal) {
				modal = new Modal({
					title: title,
					content: $.e("div", {append: [
						status,
						progressbar.getNode()
					]}),
					uncloseableByBlock: true,
					width: 270
				}).show();
			} else {
				modal.setTitle(title);
			};
			upload = new VKUpload(f)
				.onUploading(updateUI)
				.onUploaded(finish)
				.onError(handleError)
				.upload(o.method, o.params || {}, {node: node});
		};
	files = Array.prototype.slice.call(files, 0, o.maxFiles || 10);
	doTask(index);
};

/**
 * Tab host
 * Created 10.01.2016
 */

function TabHost (items, callbacks) {
	this.items = items;
	this.callbacks = callbacks || {};

	this._init();
};

TabHost.prototype = {
	_init: function() {
		var s = this;
		this.tabs = this.items.map(function(i) {
			return i instanceof Tab ? i : new Tab(s, i);
		});
	},

	tabs: null,

	setSelectedTab: function(selected) {
		if (!isNaN(selected)) {
			selected = this.tabs[selected];
		};

		if (typeof selected === "string") {
			selected = this.findTabByName(selected);
		};

		var old = this.getSelectedTab();

		if (old) {
			old.hide();
			old.leave();
		};

		selected.show();
		selected.open();

		this.callbacks.onOpenedTabChanged && this.callbacks.onOpenedTabChanged({
			opened: selected,
			closed: old
		});
	},

	getSelectedTab: function() {
		var found = null;
		this.tabs.forEach(function(tab) {
			if (tab.isActive) {
				found = tab;
			};
		});
		return found;
	},

	findTabByName: function(name) {
		var found = null;
		this.tabs.forEach(function(tab) {
			if (tab.name) {
				found = tab;
			};
		});
		return found;
	},

	getTab: function() {},

	node: null,

	nodeTabs: null,
	nodeContents: null,

	getNode: function() {
		if (this.node) {
			return this.node;
		};

		var e = $.e,
			wrap = e("div", {"class": "vktab-wrap"}),
			tabs = e("div", {"class": "vktab-tabs"}),
			contents = e("div", {"class": "vktab-contents"});

		this.tabs.forEach(function(item) {
			tabs.appendChild(item.title);
			contents.appendChild(item.content);
		});

		this.setSelectedTab(0);

		wrap.appendChild(tabs);
		wrap.appendChild(contents);

		return this.node = wrap;
	}
};

/**
 * Item tab
 * Created 10.01.2016
 */

function Tab (host, o) {
	var that = this,
		click = function(event) {
			host.setSelectedTab(that);
		};
	this.name = o.name;
	this.title = $.e("div", {"class": "vktab-tab", html: o.title, onclick: click});
	this.content = $.e("div", {"class": "vktab-content", append: o.content});
	this.onOpen = o.onOpen;
	this.onLeave = o.onLeave;
};

Tab.prototype = {
	isActive: false,

	show: function() {
		this.isActive = true;
		$.elements.addClass(this.title, "vktab-tab-active");
		$.elements.addClass(this.content, "vktab-content-active");
		return this;
	},

	hide: function() {
		this.isActive = false;
		$.elements.removeClass(this.title, "vktab-tab-active");
		$.elements.removeClass(this.content, "vktab-content-active");
		return this;
	},

	open: function(host) {
		this.onOpen && this.onOpen(this, host);
		return this;
	},

	leave: function(host) {
		this.onLeave && this.onLeave(this, host);
		return this;
	},

	setTitle: function(title) {
		this.title.innerHTML = title;
		return this;
	},

	setContent: function(content) {
		$.elements.clearChild(this.content).appendChild(content);
		return this;
	},

	getName: function() {
		return this.name;
	}
};

/**
 * Search form line
 * Created 29.02.2016
 */
function SearchLine (options) {
	this._options = options || {};

	this._init();
};
SearchLine.EVENT_SEARCH = "onSearch";
SearchLine.EVENT_KEYUP = "onKeyUp";
SearchLine.EVENT_FOCUS = "onFocus";
SearchLine.EVENT_BLUR = "onBlur";
SearchLine.prototype = {

	defaultOptions: {
		placeholder: ""
	},

	getOption: function(name) {
		return this._options[name] || this.defaultOptions[name];
	},

	/**
	 * Initialize object
	 */
	_init: function() {
		var e = $.e,
			field = e("input", {type: "text", "class": "searchform-field sizefix", autocomplete: false, placeholder: this.getOption("placeholder")}),
			icon = e("input", {type: "submit", "class": "searchform-icon", value: ""}),
			wrap = e("div", {"class": "searchform-wrap", append: [icon, field]})
			hints = e("div", {"class": "searchform-hints"});

		this.nodeForm = e("form", {"class": "searchform", append: [wrap, hints]});
		this.nodeField = field;
		this.nodeIcon = icon;
		this.nodeHints = hints;
		this._initEvents();
	},

	setVisibility: function(isVisible) {
		this.nodeForm.style.display = isVisible ? "block" : "none";
		return this;
	},

	/**
	 * Initialize events
	 */
	_initEvents: function() {
		var self = this;

		$.event.add(this.nodeForm, "submit", function(event) {
			event.preventDefault();
			self._onSubmit();
		});

		$.event.add(this.nodeField, "keyup", function(event) {
			self._onKeyUp(event);
		});

		$.event.add(this.nodeField, "focus", function(event) {
			self._onFocus();
		});

		$.event.add(this.nodeField, "blur", function(event) {
			self._onBlur();
		});

		$.event.add(this.nodeIcon, "click", function(event) {
			self._onSubmit();
		});
	},

	setOnHintRequestListener: function(listener) {
		this.mOnHintRequestListener = listener;
		return this;
	},



	mOnClick: null,
	mOnKeyUp: null,
	mOnFocus: null,
	mOnBlur: null,
	mOnHintRequestListener: null,

	getEventParams: function(event) {
		return {
			event: event,
			text: this.nodeField.value.trim(),
			context: this
		};
	},

	/**
	 * Callback, invoked when
	 */
	_onSubmit: function() {
		this.mOnSearch && this.mOnSearch(this.getEventParams(SearchLine.EVENT_SEARCH));
	},

	/**
	 * Callback, invoked when
	 */
	_onKeyUp: function() {
		this.mOnKeyUp && this.mOnKeyUp(this.getEventParams(SearchLine.EVENT_KEYUP));
	},

	/**
	 * Callback, invoked when
	 */
	_onFocus: function() {
		this.mOnFocus && this.mOnFocus(this.getEventParams(SearchLine.EVENT_FOCUS));
	},

	/**
	 * Callback, invoked when
	 */
	_onBlur: function() {
		this.mOnBlur && this.mOnBlur(this.getEventParams(SearchLine.EVENT_BLUR));
	},

	getNode: function() {
		return this.nodeForm;
	}
};

/**
 * Actions list as in Android 5.0+
 * Created 29.02.2016
 */
function ActionBlock (actions) {
	this._actions = actions;
	this._init();
};

ActionBlock.CLASS_OPENED = "actionBlock-showing";

ActionBlock.prototype = {

	_init: function() {
		this.nodeWrap = $.e("div", {"class": "actionBlock"});
		getBody().appendChild(this.nodeWrap);
	},

	_prepareItems: function() {
		var e = $.e, self = this;
		return e("div", {"class": "actionBlock-wrap", append: this._actions.map(function(i) {
			if (self.mOnPreparingItem && self.mOnPreparingItem(i, self.mItemForAction) === false) {
				return e("div");
			};
			return e("div", {
				"class": "actionBlock-item" + (i.iconClass ? " actionBlock-item-icon " + i.iconClass : ""),
				onclick: function(event) {
					i.onClick && i.onClick(self.mItemForAction);
					self.hide();
				},
				html: i.label
			});
		})});
	},

	nodeWrap: null,
	mItemForAction: null,
	mOnPreparingItem: null,

	setItemForAction: function(item) {
		this.mItemForAction = item;
		return this;
	},

	setOnPreparingItem: function(listener) {
		this.mOnPreparingItem = listener;
		return this;
	},

	getNode: function() {
		return this.nodeWrap;
	},

	show: function() {
		var w = this.nodeWrap, s = this;
		w.appendChild($.e("div", {"class": "actionBlock-block", onclick: function() { s.hide() }}));
		w.appendChild(this._prepareItems());
		w.style.bottom = -(45 * this._actions.length) + "px";
		$.elements.addClass(w, ActionBlock.CLASS_OPENED);
	},

	hide: function() {
		var w = this.nodeWrap;
		$.elements.removeClass(w, ActionBlock.CLASS_OPENED);
		setTimeout(function() {
			$.elements.clearChild(w);
		}, 500);
	}

};

/**
 * Pending action
 * Created 29/02/2016
 */
function PendingAction (action, time) {
	var self = this;
	this._action = action;
	this._cancelled = false;
	this._id = setTimeout(function() {
		!self._cancelled && self.doAction();
	}, time);
};

PendingAction.prototype = {

	doAction: function() {
		this._action && this._action();
	},

	cancel: function() {
		this._cancelled = true;
		clearTimeout(this._id);
		return this;
	},

	force: function() {
		this.cancel().doAction();
	}

}

/**
 * Notifications as in Android 5.0+
 */
function Snackbar (options) {
	this._init(options);
	this.setOptions(options);
};

Snackbar.CLASS_HIDDEN_ACTION = "hidden";
Snackbar.CLASS_FADE_OUT = "snackbar-fadeout";

Snackbar.prototype = {

	_init: function(options) {
		var self = this;
		this.nodeWrap = $.e("div", {"class": "snackbar", append: [
			this.nodeAction = $.e("div", {"class": "snackbar-right"}),
			this.nodeContent = $.e("div", {"class": "snackbar-content"})
		]});
		this._duration = options.duration || 7000;
		this._onClick = options.onClick;
		this._onClose = options.onClose;
		if (this._onClose) {
			this._pending = new PendingAction(function() {
				self._onClose();
				self.close();
			}, options.duration);
		};
		if (this._onClick) {
			this.nodeWrap.addEventListener("click", function(event) {
				self._onClick(self);
			});
		};
	},

	setOptions: function(options) {
		$.elements[options.action ? "removeClass" : "addClass"](this.nodeAction, Snackbar.CLASS_HIDDEN_ACTION);
		var self = this;
		this._options = options;
		if (options.action) {
			$.elements.clearChild(this.nodeAction).appendChild($.e("div", {
				"class": "snackbar-action",
				html: options.action.label,
				onclick: function(event) {
					event.preventDefault();
					self._onClickAction(event);
				}
			}))
		};
		this.setText(options.text);
	},

	_onClickAction: function(event) {
		this._pending.cancel();
		this._options.action.onClick(this, event);
		this.close();
	},

	setText: function(text) {
		this.nodeContent.innerHTML = text;
		return this;
	},

	show: function() {
		var self = this;
		this._id = setTimeout(function() {
			self.close();
		}, this._duration);
		getBody().appendChild(this.nodeWrap);
	},

	close: function() {
		clearTimeout(this._id);
		$.elements.addClass(this.nodeWrap, Snackbar.CLASS_FADE_OUT);
		var self = this;
		setTimeout(function() {
			$.elements.remove(self.nodeWrap);
		}, 500);
	},

};

/**
 * Modal window
 * @param   {Object}   o   Options
 */
function Modal(o) {
	this._options = o || {};
	this._init();
};

Modal.prototype = {

	_construct: function() {
		var modal = this;
		this.modal = $.e("div", {"class": "modal modal-animation"});
		this.title = $.e("h1", {"class": "modal-title"});
		this.body = $.e("div", {"class": "modal-content"});
		this.footer = $.e("div", {"class": "modal-footer"});
		this.block = $.e("div", {"class": "modal-block", onclick: !this._options.uncloseableByBlock ? function() { modal.close() } : null});
		this.wrap = $.e("div", {"class": "modal-wrap"});

		this.modal.appendChild(this.title);
		this.modal.appendChild(this.body);
		this.modal.appendChild(this.footer);

		this.wrap.appendChild(this.modal);
		this.wrap.appendChild(this.block);
	},

	/**
	 * Initialize modal window
	 * @return   {Modal}
	 */
	_init: function() {

		this._construct();

		var s = this, self = this;
		$.elements.addClass(this.wrap, "hidden");
		$.event.add(this.body, "scroll", function(event) {
			s._onScroll(event);
		});

		$.event.add(window, "resize", function(event) {
			self._onResizeDocument(event);
		});

		if (isEnabled(128)) {
			this.modal.style.marginTop = "50px";
			this.hasMarginTop = true;
		};

		this._setOptions();
		this._windowStateChanged();
		this._insert();
	},

	/**
	 * Is fixed hat
	 */
	hasMarginTop: false,

	/**
	 * Insert modal to document
	 * @return   {Modal}
	 */
	_insert: function() {
		getBody().appendChild(this.wrap);
		return this;
	},

	/**
	 * Set options of modal
	 * @param   {Modal}
	 */
	_setOptions: function() {
		var o = this._options || {};
		if (o.title) {
			this.title.innerHTML = o.title;
		};

		if (o.content) {
			if (typeof o.content === "string") {
				this.body.innerHTML = o.content;
			} else {
				this.body.appendChild(o.content);
			};
		};

		if (o.footer) {
			if (Array.isArray(o.footer)) {
				this.buttons = o.footer;
				this._setupButtons();
				if (this._hasCloseButton) {
					this._addCloseButtonHead();
				};
			} else {
				if (typeof footer === "string") {
					this.footer.innerHTML = o.footer;
				} else {
					this.footer.append(o.footer);
				};
			};
		};

		if (o.noPadding) {
			this.setPadding(false);
		};

		if (o.width) {
			this.setWidth(o.width);
		};

		if (o.height) {
			this.setHeight(o.height);
		};

		if (o.onScroll) {
			this._onScrollCallback = o.onScroll;
		};

		return this;
	},

	setOnScroll: function(fx) {
		this._onScrollCallback = fx;
		return this;
	},

	_hasCloseButton: function() {
		var found = false;

		(this.buttons || []).forEach(function(b) { if (b.name == "close") found = true; });

		return found;
	},

	_addCloseButtonHead: function() {
		var self = this;
		this.modal.insertBefore($.e("div", {
			"class": "modal-closeButton",
			onclick: function() {
				self.close();
			}
		}), this.title);
	},

	setPadding: function(state) {
		$.elements[state ? "removeClass" : "addClass"](this.body, "modal-content-noPadding");
		return this;
	},

	/**
	 * Setup buttons by special format
	 * @return   {Modal}
	 */
	_setupButtons: function() {
		if (!this.buttons)
			return this;
		this.footer.innerHTML = "";
		var n = this.footer, b, self = this;
		b = this.buttons.map(function(item) {
			n.appendChild($.e("button", {html: item.title, "data-name": item.name, onclick: function(event) {
				item.onclick.call(self);
			}}));
		});

		return this;
	},

	/**
	 * Open modal and show it on document
	 * @return   {Modal}
	 */
	show: function(fromNodeAnimation) {
		if (fromNodeAnimation) {

			if (~Object.prototype.toString.call(fromNodeAnimation).toLowerCase().indexOf("html")) {
				fromNodeAnimation = this.computeFrom(fromNodeAnimation);
			};

			this._showAnimate(fromNodeAnimation);
		};

		$.elements.removeClass(this.wrap, "hidden");

		this._onResizeDocument();
		return this;
	},

	_showAnimate: function(from) {
		var modal = this.modal,
			setStyle = function(left, top, scale, opacity) {
				var s;
				modal.style.opacity = opacity;
				prefix(modal, "transform", s = ("translate(" + left + "px, " + top + "px) scale(" + scale + ")"));
			},
			doc = {height: document.documentElement.clientHeight, width: document.documentElement.clientWidth};

		$.elements.removeClass(modal, "modal-animation");
		$.elements.addClass(modal, "modal-targetAnimated");

		setStyle(
			from.left - (doc.width / 2),
			from.top - (doc.height / 2),
			.1,
			.1
		);

		setTimeout(function() {
			setStyle(0, 0, 1, 1);
		}, 50);

		setTimeout(function() {
			$.elements.removeClass(modal, "modal-targetAnimated");
		}, 320);
	},

	computeFrom: function(node) {
		var pos = $.getPosition(node);
		pos.top -= getScroll();
		return {
			top: pos.top + pos.height / 2,
			left: pos.left + pos.width / 2
		};
	},

	/**
	 * Close modal
	 */
	close: function() {
		$.elements.addClass(this.wrap, "modal-closing");
		var s = this;
		setTimeout(function() {
			s.remove();
		}, 600);
		return this;
	},

	remove: function() {
		this.wrap.remove();
		this._windowStateChanged();
	},

	/**
	 * Set title of modal
	 * @param   {String}   title   New title of modal
	 */
	setTitle: function(title) {
		this.title.innerHTML = title;
		return this;
	},

	/**
	 * Set content of modal
	 *
	 * @param   {?}   content   New content of modal
	 */
	setContent: function(content) {
		this.body.innerHTML = "";
		if (typeof content === "string")
			this.body.innerHTML = content;
		else
			this.body.appendChild(content);
		return this;
	},

	/**
	 * Return content wrapper
	 * @return   {Node}   Wrapper of content modal
	 */
	getContent: function() {
		return this.body;
	},

	/**
	 * Set footer of modal
	 *
	 * @param   {?}   footer   New footer of modal
	 */
	setFooter: function(footer) {
		this.footer.innerHTML = "";
		if (typeof footer === "string")
			this.footer.innerHTML = footer;
		else
			this.footer.appendChild(footer);
		return this;
	},

	/**
	 * Current button-set
	 *
	 * @return   {Array}   Buttons of modal
	 */
	getButtons: function() {
		if (!this.buttons)
			return false;
		return this.buttons;
	},

	/**
	 * Adding button
	 *
	 * @param   {Object}   opts   Options of button
	 */
	addButton: function(opts) {
		this.getButtons().unshift(opts);
		this._setupButtons();
		return this;
	},

	/**
	 * Replace button in modal
	 *
	 * @param   {String}   name   Name of button
	 * @param   {Object}   opts   Options of button
	 */
	setButton: function(name, opts) {
		var found = -1;
		this.buttons = this.buttons.map(function(i) {
			if (i.name !== name)
				return i;
			found = true;
			return opts;
		});
		if (found)
			this._setupButtons();
		return this;
	},

	/**
	 * Replace button in modal
	 *
	 * @param   {String}   name   Name of button
	 * @param   {Object}   opts   Options of button
	 */
	setButtons: function(buttons) {
		this.buttons = buttons
		this._setupButtons();
		return this;
	},

	/**
	 * Remove button from footer
	 *
	 * @param    {String}   name   Name of button
	 * @return   {Modal}
	 */
	removeButton: function(name) {
		var index = -1;
		this.buttons = this.buttons.forEach(function(i, x) {
			if (i.name !== name)
				return;
			index = x;
		});
		if (~index) {
			this.buttons.splice(index, 1);
			this._setupButtons();
		};
		return this;
	},

	/**
	 * Parse sizes
	 *
	 * @param	{Number}   w   Value
	 */
	_parseSizes: function(w) {
		return typeof w === "string" ? w : w + "px";
	},

	/**
	 * Set width of modal window
	 *
	 * @param   {Number}   w   New value of width
	 */
	setWidth: function(w) {
		if (document.documentElement.clientWidth < 512 && typeof w === "string" && w.indexOf("%")) {
			return this;
		};

		this.modal.style.width = this._parseSizes(w);
		return this;
	},

	/**
	 * Set height of modal window
	 *
	 * @param   {Number}   h   New value of height
	 */
	setHeight: function(h) {
		this.modal.style.height = this._parseSizes(h);
		return this;
	},

	/**
	 * Closing window with delay
	 * @param  {Number} time Delay in ms
	 */
	closeAfter: function(time) {
		var s = this;
		setTimeout(function() { s.close(); }, time);
		return this;
	},

	_onScrollCallback: null,

	_onScroll: function(event) {
		var ch, st, oh;
		this._onScrollCallback && this._onScrollCallback({
			top: st = this.body.scrollTop,
			scrollHeight: oh = this.body.offsetHeight,
			contentHeight: ch = (this.body.firstChild && this.body.firstChild.offsetHeight),
			needLoading: ch - st - oh * 2 < 0
		});
	},

	_onResizeDocument: function(event) {
		var d = document.documentElement.clientHeight;

		if (this.hasMarginTop) {
			d -= 50;
		};

		this.modal.style.maxHeight = (d - 50) + "px";
		this.body.style.maxHeight = (d - 157) + "px";
	},

	_windowStateChanged: function() {
		var hasOpened = false;
		Array.prototype.forEach.call(document.querySelectorAll(".modal:not(.modal-x)"), function(i) {
			if (!$.elements.hasClass(i, "hidden")) hasOpened = true;
		});
		$.elements[hasOpened ? "addClass" : "removeClass"](document.documentElement, "__fixedBody");
	}
};

/**
 * Custom progressbar
 *
 * @param   {Number}   min   Minimal value
 * @param   {Number}   max   Maximum value
 */
function ProgressBar (min, max) {
	this.min = min || 0;
	this.max = max || 100;
	this.value = 0;
	this.wrap = $.e("div", {"class": 'pb-wrap', append: this.line = $.e("div", {"class": 'pb-line'})});
	this._init();
};
ProgressBar.prototype = {
	_init: function() {

	},

	/**
	 * Return node of progressbar
	 * @return   {Node}
	 */
	getNode: function() {
		this.update();
		return this.wrap;
	},

	/**
	 * Update UI by current values
	 * @return   {ProgressBar}
	 */
	update: function() {
		this.line.style.width = this.getPercent() + "%";
		return this;
	},

	/**
	 * Eval percent from current values
	 * @return   {Number}
	 */
	getPercent: function() {
		return Math.abs(this.min - ((this.min + this.value) * 100 / this.max));
	},

	/**
	 * Change minimal value
	 * @param   {Number}   min   New minimal value
	 */
	setMin: function(min) {
		this.min = min;
		this.update();
		return this;
	},

	/**
	 * Change maximal value
	 * @param   {Number}   max   New maximal value
	 */
	setMax: function(max) {
		this.max = max;
		this.update();
		return this;
	},

	/**
	 * Change current value
	 * @param   {Number}   value   New value
	 */
	setValue: function(value) {
		this.value = value;
		this.update();
		return this;
	},

	/**
	 * Return current value
	 * @return   {Number}   Current value
	 */
	getValue: function() {
		return this.value;
	}
};

/**
 * Privacy window
 * Created 11.01.2016
 */
function PrivacyWindow () {

};


/**
 * [ReportWindow description]
 * @param {String}	method    [description]
 * @param {int}		ownerId   [description]
 * @param {String}	itemKey   [description]
 * @param {int}		itemId    [description]
 * @param {String}	accessKey [description]
 */
function ReportWindow(method, ownerId, itemKey, itemId, accessKey, needComment) {
	this._options = {};
	this._method = method;

	this._params = { ownerId: ownerId };
	this._params[itemKey] = itemId;
	if (accessKey) {
		this._params.accessKey = accessKey;
	};

	this.needComment = needComment;
	this._init();
	this.initReport();
};
ReportWindow.prototype = Modal.prototype;

ReportWindow.prototype.initReport = function() {
	var e = $.e, self = this;

	this
		.setTitle(lg("report.modalTitle"))
		.setContent(this.getForm())
		.setButtons(this.getButtons())
		.show();
};

ReportWindow.prototype.getSelectedIndex = function() {
	var f = this.form.elements.report, selected = -1;
	for (var i = 0, l = f.length; i < l; ++i) {
		if (f[i].checked) {
			selected = i;
			break;
		}
	};
	return selected;
};

ReportWindow.prototype.isValid = function() {
	return ~this.getSelectedIndex();
};

ReportWindow.prototype.getForm = function() {
	var e = $.e,
		self = this,
		fields,
		form = e("form", {
			onsubmit: function(event) {
				event.preventDefault();

				self.send();

				return false;
			},

			append: [
				e("blackqoute", {html: lg("report.modalDescription")}),
				fields = e("div", {"class": "sf-wrap", append: this.getListOrReasons()})
			]
		});

	if (this.needComment) {
		fields.appendChild(e("div", {append: [
			e("div", {"class": "tip", html: lg("report.modalComment")}),
			e("textarea", {name: "comment"})
		]}));
	};

	return this.form = form;
};

ReportWindow.prototype.getListOrReasons = function() {
	var items = (lg(this._method !== "users.report" ? "report.modalReasons" : "report.modalReasonsUser") || []),
		result = [], item;
	for (var key in items) {
		item = items[key];
		result.push($.e("label", { append: [
			$.e("input", {type: "radio", name: "report", value: key}),
			$.e("span", {html: item})
		] }));
	};
	return result;
};

ReportWindow.prototype.getButtons = function() {
	var self = this;
	return [
		{
			name: "ok",
			title: lg("report.modalOkButton"),
			onclick: function() {
				self.send();
			}
		},
		{
			name: "cancel",
			title: lg("general.cancel"),
			onclick: function() {
				this.close();
			}
		}
	];
};

ReportWindow.prototype.send = function() {
	if (!this.isValid()) {
		return false;
	};

	var self = this;

	this.sendRequest(function() {
		self
			.setContent(lg("report.modalSuccess"))
			.setButtons([{
				name: "close",
				title: lg("general.close"),
				onclick: function(event) {
					this.close();
				}
			}])
			.closeAfter(2000);
	});
};

ReportWindow.prototype.sendRequest = function(callback) {
	this._params.reason = this.getSelectedIndex();
	if (this.needComment) {
		this._params.comment = this.form.comment.value.trim();
	};

	new APIRequest(this._method, this._params)
		.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
		.setOnCompleteListener(function(result) {
			callback(true);
		})
		.setOnErrorListener(function(result) {
			callback(false);
		})
		.execute();
};

/**
 * Контроллер для аттачей
 * 29/02/2016: создан
 * 07/08/2016: переименован, описан
 */
function AttachmentController(options) {
	var self = this;
	this.peerId = options.peerId;
	this.ownerId = options.ownerId || API.userId;
	this.bundle = new AttachmentBundle();
	this.content = $.e("div");
	this._onOpen = options.onOpen;
	this._onSelect = options.onSelect;
	this.methods = options.methods;
	this.allowedTypes = options.allowedTypes || (APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT);
	this.maxCount = options.maxCount || 10;
};

AttachmentController.prototype = {

	open: function(from) {
		this.chunk = [];
		this.modal = new Modal({
			title: lg("attacher.modalTitle"),
			content: this.content,
			width: "60%",
			noPadding: true,
			footer: [
				{
					name: "ok",
					title: lg("attacher.modalOk"),
					onclick: function(event) {
						self._onSelect(self.getSelected());
						this.close();
					}
				},
				{
					name: "cancel",
					title: lg("attacher.modalCancel"),
					onclick: function(event) {
						this.close();
					}
				}
			]
		});
		this.modal.show(from);
	},

	clear: function() {
		this.bundle.clear();
		return this;
	},

	getNode: function() {
		var self = this;
		return this.wrapButton = $.e("div", {"class": "attacher-button-wrap", append: this.button = $.e("div", {
			"class": "vkform-comment-button-attachment",
			onclick: function(event) {
				self.toggleTypeList();
			}
		})});
	},

	toggleTypeList: function() {
		if (!this.typeListNode) {
			this.createTypeList();
		};

		this.typeListNode.classList.toggle("attacher-typeList-opened");
		return this;
	},

	hideTypeList: function() {
		this.typeListNode.classList.remove("attacher-typeList-opened");
	},

	createTypeList: function() {
		var wrap = $.e("div", {"class": "attacher-typeList"}), self = this;
		for (var i = 0, j; i <= 12; ++i) {
			j = Math.pow(2, i);

			if (!(this.allowedTypes & j)) {
				continue;
			};

			wrap.appendChild($.e("div", {
				"class": "attacher-typeList-item",
				html: lg(AttachmentController.langs[j]),
				onclick: (function(k) {
					return function(event) { self.openSelectWindow(k, this); }
				})(j)
			}));
		};
		this.wrapButton.appendChild(wrap);
		return (this.typeListNode = wrap);
	},

	getAttachmentString: function() {
		return this.bundle.getString();
	},

	getGeo: function() {
		return [];
	},

	openSelectWindow: function(typeId, button) {
		var self = this;
		switch (typeId) {
			case APIDOG_ATTACHMENT_PHOTO:
				var
					albums,
					loadAlbums = function(callback) {
						if (albums) {
							return callback(albums);
						};

						new APIRequest("photos.getAlbums", {ownerId: self.ownerId, extended: 1, needSystem: 1, needCovers: 1, v: 5.52})
							.setOnCompleteListener(function(result) {
								callback(albums = parse(result.items, VKPhotoAlbum));
							})
							.execute();
					},
					albumsListNode,
					albumContents = {},
					openAlbum = function(ownerId, albumId) {
						if (albumContents[ownerId + "_" + albumId]) {
							showAlbum(ownerId, albumContents[ownerId + "_" + albumId]);
							return;
						};

						$.elements.clearChild(albumsListNode).appendChild(getLoader());

						new APIRequest("photos.get", {ownerId: ownerId, albumId: albumId, v: 5.52, count: 1000, extended: 1})
							.setOnCompleteListener(function(result) {
								showAlbum(ownerId, albumContents[ownerId + "_" + albumId] = parse(result.items, VKPhoto));
							})
							.execute();
					},
					showAlbum = function(ownerId, photos) {
						$.elements.clearChild(albumsListNode);
						var list = $.e("div", {"class": "attacher-list-photos"});
						photos.forEach(function(photo) {
							var item = photo.getNodeItem();

							$.event.add(item, "click", function(event) {
								self.add(photo).done();
							});

							item.appendChild($.e("div", {
								"class": "attacher-photo-checkbox",
								onclick: function(event) {
									this.classList.toggle("attacher-photo-checkbox-checked");
									event.cancelBubble = true;
									event.stopPropagation();
								}
							}));
							list.appendChild(item);
						});
						albumsListNode.appendChild(list);
					},
					showAlbums = function(albums) {
						$.elements.clearChild(albumsListNode);
						var list = $.e("div", {"class": "attacher-list-albums"});
						albums.forEach(function(album) {
							list.appendChild(album.getNodeItem({ onClick: openAlbum }))
						});
						albumsListNode.appendChild(list);
					},
					tabs = [
						{
							name: "album",
							title: lg("attacher.photoAlbum"),
							content: albumsListNode = $.e("div", { append: getLoader() }),
							onOpen: function() {
								loadAlbums(showAlbums);
							}
						},
						{
							name: "file",
							title: lg("attacher.photoFile"),
							content: this.createFileForm(typeId)
						},
						{
							name: "url",
							title: lg("attacher.photoURL"),
							content: this.createURLForm()
						}
					],
					host = new TabHost(tabs, {});

				this.open(button);
				this.modal.setContent(host.getNode());
				break;

			case APIDOG_ATTACHMENT_DOCUMENT:
				var
					documentListNode,
					documents,
					loadDocuments = function(callback) {
						if (documents) {
							return callback(documents);
						};

						new APIRequest("docs.get", {ownerId: self.ownerId, v: 5.52})
							.setOnCompleteListener(function(result) {
								callback(documents = parse(result.items, VKDocument));
							})
							.execute();
					},

					showDocuments = function(documents) {
						$.elements.clearChild(documentListNode);
						var list = $.e("div", {"class": "attacher-list-documents"});
						documents.forEach(function(doc) {
							list.appendChild(doc.getNodeItem({
								onClick: function(event) {
									self.add(doc).done();
								}
							}));
						});
						documentListNode.appendChild(list);
					},

					tabs = [
						{
							name: "list",
							title: lg("attacher.documentList"),
							content: documentListNode = $.e("div", { append: getLoader() }),
							onOpen: function() {
								loadDocuments(showDocuments);
							}
						},
						{
							name: "file",
							title: lg("attacher.documentFile"),
							content: this.createFileForm(typeId)
						},
						{
							name: "url",
							title: lg("attacher.documentURL"),
							content: this.createURLForm()
						}
					],
					host = new TabHost(tabs, {});

				this.open(button);
				this.modal.setContent(host.getNode());
				break;
		};
	},

	createFileForm: function(typeId) {
		var self = this, input, form = $.e("form", {
			"class": "attacher-formfile-wrap",
			append: [
				$.e("div", {
					"class": "attacher-formfile-label",
					html: lg("attacher.fileSelect")
				}),
				input = $.e("input", {
					type: "file",
					name: "file", "class": "attacher-formfile-field"
				})
			]
		});

		$.event.add(input, "change", function(event) {
			uploadFiles(input, {
				maxFiles: self.maxCount - self.bundle.getCount(),
				method: self.methods[APIDOG_ATTACHMENT_PHOTO == typeId ? "photo" : "document"],
			}, {
				onTaskFinished: function(result) {
					var fx = APIDOG_ATTACHMENT_PHOTO == typeId ? VKPhoto : VKDocument;
					result.forEach(function(item) {
						self.add(new fx(item));
					});
					self.done();
				}
			});
		});

		return form;
	},

	chunk: [],

	createURLForm: function() {
		var self = this,
			field,
			form = $.e("form", {
				"class": "attacher-url-wrap",
				append: $.e("span", {html: "В переработке..."}) /*field = $.e("input", {
					type: "url",
					autocomplete: "off"
				})*/
			}),

			uploadImage = function(url) {
				uploadFiles(null, {url: url}, {
					onTaskFinished: function(result) {
						var fx = APIDOG_ATTACHMENT_PHOTO == typeId ? VKPhoto : VKDocument;
						self.add(new fx(result[0])).done();
					}
				})
			};

		/*$.event.add(field, "keyup", function(event) {
			var url = this.value.trim(),
				isCorrect = /^https?:\/\//img.test(url) && url.length > 12,
				testImage;

			if (!isCorrect) {
				return;
			};

			this.disabled = true;

			testImage = new Image();
			testImage.onerror = function() {
				alert("invalid link: not image");
				field.disabled = false;
			};
			testImage.onload = function() {
				uploadImage();
			};
		});*/

		$.event.add(form, "submit", function(event) {
			event.preventDefault();
			return false;
		});

		return form;
	},

	add: function(object) {
		console.log("controller.add", object);
		this.bundle.add(object);
		this.chunk.push(object);
		return this;
	},

	done: function() {
		this._onSelect(this.chunk);
		this.chunk = [];
		this.modal.close();
		return this;
	}
};

AttachmentController.langs = {
	"1": "attacher.typePhoto",
	"2": "attacher.typeVideo",
	"4": "attacher.typeAudio",
	"8": "attacher.typeDocument",
	"16": "attacher.typeMap"
};

/**
 * Контролер для смайлов и стикеров
 * 07/08/2016: создан
 */
function SmileController(options) {

};

SmileController.prototype = {
	getNode: function() {
		return $.e("div");
	}
};

var APIdogNoInitPage;
function blank () {};