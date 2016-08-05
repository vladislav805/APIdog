/**
 * APIdog v6.5 General SDK
 * Vladislav Veluga (c) 2012-2016
 *
 * https://apidog.ru/
 *
 * Branch: editing
 */




function getHead () {
	return document.getElementsByTagName("head")[0];
};

function getBody () {
	return document.getElementsByTagName("body")[0];
};

function getAddress (o) {
	var h = window.location.hash.replace("#", "");
	return o ? h : h.split("?")[0];
};

function setLocation (path) {
	return window.location.hash = "#" + path;
};

function g (id) {
	return document.getElementById(id);
};

function getResponse (data) {
	return data.response;
};

function getFrameDocument (frame) {
	return frame.contentDocument || frame.contentWindow || frame.document;
};

function getName (u) {
	return Site.Escape(u.first_name) + " " + Site.Escape(u.last_name) + Site.isOnline(u);
};

function isEnabled (bit) {
	return !!(API.SettingsBitmask & bit);
};

function isNotification (bit) {
	return isEnabled(1024) && (API.bitmaskNotifications & bit) > 0;
};

function getUnixTime () {
	return parseInt(Date.now() / 1000);
};

function getOffset () {
	return Site.Get("offset");
};

function isTouch () {
	return window._isTouch;
};

function isArray (object) {
	return (Object.prototype.toString.call(object) === "[object Array]");
};

function inRange (min, value, max) {
	return min < value && value < max;
};

function toRange (min, value, max) {
	return Math.max(min, Math.min(value, max));
};

function getScroll () {
	return document.documentElement.scrollTop || document.body.scrollTop;
};

function formatNumber (n) {
	n = String(n);
	n = new Array(4 - n.length % 3).join("U") + n;
	return $.trim(n.replace(/([0-9U]{3})/g, "$1 ").replace(/U/g, ""));
};

function random (a, b) {
	return Math.floor(Math.random() * (++b - a) + a);
};

function shuffle(array) {
	var m = array.length, t, i;
	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	};
	return array;
};

function httpBuildQuery (array, noEncode) {
	if (!array)
		return "";
	if (isArray(array))
		return array.join("&");
	else {
		var data = [], key;
		for (key in array) {
			data.push(noEncode ? key + "=" + array[key] : encodeURIComponent(key) + "=" + encodeURIComponent(array[key]));
		}
		return data.join("&");
	};
};

function includeScripts (scripts, onLoad) {
	if (!Array.isArray(scripts))
		scripts = [scripts];

	var loaded = 0, all = scripts.length, e = $.e, head = getHead();
	scripts.forEach(function (script) {
		head.appendChild(e("script", {
			src: script,
			onload: function (event) {
				if ($.elements.remove(this) && ++loaded == all)
					onLoad();
			}
		}));
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
		os = "iOS " + (function (v) {
			return v.replace(/_/g, ".");
		})((/os ([\d_]+)/i).exec(ua)[1]);
	else if (/android/i.test(ua))
		os = "Android " + (/android ([\d\.]+)/i.exec(ua)[1]);
	else if (/windows/i.test(ua))
		os = "Windows " + (function (v) {
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

function VKConfirm (title, text, callback) {
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
				onclick: function () {
					modal.close();
					callback();
				}
			},
			{
				name: "no",
				title: Lang.get("general.no"),
				onclick: function () {
					modal.close();
				}
			}
		]
	}).show();
	return modal;
};

var _isTouch = true;
window.addEventListener("mousemove", function _mouseMoveDetector() {
    _isTouch = false;
    $.elements.removeClass(getBody(), "isTouch");
    window.removeEventListener("mousemove", _mouseMoveDetector);
});

/* Theme SDK */

var ThemeManager = {

	_cb: {
		bundle: {},
		oninstall: null,
		ondestroy: null,
		onresize: null,
		onscroll: null,
		onlikeditem: null,
		onnavigatestart: null,
		onnavigateend: null,
		onplayerinited: null,
		onplayertrackchanged: null,
		onlongpollmessagerecieve: null,
		onnotifyreplied: null,
		onintrvaleddatarecieved: null,
	},

	onInstall: function (callback)
	{
		ThemeManager._cb.bundle = new ThemeBundle();

		if (callback)
		{
			ThemeManager._cb.oninstall = callback;
			return ThemeManager;
		};

		ThemeManager._cb.oninstall && ThemeManager._cb.oninstall(this.getBundle());
	},

	onDestroy: function (callback)
	{
		if (callback)
		{
			ThemeManager._cb.ondestroy = callback;
			return ThemeManager;
		};

		ThemeManager._cb.ondestroy && ThemeManager._cb.ondestroy(this.getBundle());
	},

	getBundle: function ()
	{
		return ThemeManager._cb.bundle;
	},

	onResize: function (callback)
	{
		if (callback)
		{
			ThemeManager._cb.onresize = callback;
			return ThemeManager;
		};

		ThemeManager._cb.onresize && ThemeManager._cb.onresize(this.getBundle(), {
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight
		});
	},

	onScroll: function (callback)
	{
		if (callback)
		{
			ThemeManager._cb.onscroll = callback;
			return ThemeManager;
		};

		ThemeManager._cb.onscroll && ThemeManager._cb.onscroll(this.getBundle(), getScroll());
	},

	onIntervaledDataRecieved: function (callback)
	{
		if (callback)
		{
			ThemeManager._cb.onintrvaleddatarecieved = callback;
			return ThemeManager;
		};
	},

};
function ThemeBundle () {

};
ThemeBundle.prototype = {

	storage: {},

	set: function (key, value)
	{
		this.storage[key] = value;
		return this;
	},

	get: function (key)
	{
		return this.storage[key];
	},

	remove: function (key)
	{
		delete this.storage[key];
		return this;
	},

	removeAll: function ()
	{
		this.storage = {};
	}
};


/**
 * Prototypes
 */

var ds = {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"};

/**
 * Formatting number by groups: from 1234567 to 1 234 567
 * @return {String} result number
 */
Number.prototype.format = function () {
	return String(this).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, "$1\u2009").trim();
};

/**
 * Return number with beginning zero if number less than 10
 * @return {String} result number
 */
Number.prototype.fix00 = function () {
	return this < 10 ? "0" + this : this;
};

/**
 * Geerate string with name of value of file
 * @return {String} string, contains value and unit of measure
 */
Number.prototype.getInformationValue = function () {
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
String.prototype.setLang = function (data, value)
{
	if (!$.isObject(data) && value)
	{
		return this.replace(new RegExp("%" + data, "img"), Lang.get(value));
	};
	var s = this, i;
	for (var k in data)
	{
		i = data[k];
		s = s.replace(new RegExp("%" + k, "img"), isNaN(i) ? !i.indexOf("!") ? i.replace("!", "") : Lang.get(i) : i);
	};
	return s;
};


String.prototype.schema = function (data)
{
	var s = this, k;
	for (k in data)
	{
		s = s.replace(new RegExp("%" + k, "img"), data[k]);
	};
	return s;
};

/**
 * Return random number
 * @param  {Number} a Minimal value of returning number
 * @param  {Number} b Maximum value of returning number
 * @return {Number}   Result random number
 */
Number.random = function (a, b) {
	return Math.floor(Math.random() * (++b - a) + a);
};

/**
 * Replace html-tags for safe inserting in page
 * @return {String} safe string
 */
String.prototype.safe = function ()
{
	var s = this, i;
	for (i in ds)
		s = s.replace(i, ds[i]);
	return s;
};

/**
 * Return HTML-code from pseudo-BB-code
 * @return {String} result html-code
 */
String.prototype.bb = function ()
{
	return String(this)
		.replace(/\[(s|b|u|i|big|small|h1|h2|h3|pre|center|(h|b)r)\](.*?)\[\/\1\]/igm, "<$1>$3</$1>")
		.replace(/\[(red|gray)\](.*?)\[\/\1\]/igm, "<span class='bb-color-$1'>$2</$1>")
		.replace(/\[li\](.*?)\[\/li\]/igm, "<div class='bb-li'>$1</div>")
		.replace(/\[url=(.*?)\](.*?)\[\/url\]/img, "<a href='$1'>$2<\/a>");
};



/* APIdog API request function */

window.APIdogAPIDomain	= "apidog.ru";
window.APIdogAPIPath	= "/api/v2/";

function APIdogRequest (method, params, callback, fallback) {
	params = params || {};
	params.authKey = API.userAuthKey;
	var xhr = new XMLHttpRequest(),
		postFields = httpBuildQuery(params),
		key;
	xhr.open("POST", location.protocol + "\/\/" + window.APIdogAPIDomain + window.APIdogAPIPath + method, true);
	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xhr.onreadystatechange = function (event) {
		if (xhr.DONE == xhr.readyState) {
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
	xhr.send(postFields);
};

window.addEventListener("DOMContentLoaded", function () {
	identifyDeviceByCSS();
	window.addEventListener("hashchange", function (event) {
		if (window.NoHashChange != true)
			Site.Go(window.location.hash);
		window.NoHashChange = false;
	});
});

/* Events */

window.addEventListener("load", function (event) {
	if (APIdogNoInitPage) {
		return;
	};




	window.CONST_MENU_HEIGHT = $.getPosition(g("_menu")).height;

	if (!Lang.lang)
		Lang.lang = API.settings.languageId;

	(function (d,w,c){(w[c]=w[c]||[]).push(function(){try{w.yaCounter19029880=new Ya.Metrika({id:19029880,trackHash:!0})}catch(e){}});var n=d.getElementsByTagName("script")[0],s=d.createElement("script"),f=function(){n.parentNode.insertBefore(s,n);};s.type="text/javascript";s.async=!0;s.src=(d.location.protocol=="https:"?"https:":"http:")+"//mc.yandex.ru/metrika/watch.js";if(w.opera=="[object Opera]")d.addEventListener("DOMContentLoaded",f,!1);else f()})(document,window,"yandex_metrika_callbacks");

	if (API.SettingsBitmask & 32) {

	};

	menu.initTouchEvents();


	startFirstRequestAPI();

	window.addEventListener("scroll", function (event) {
		if (!window.onScrollCallback)
			return;
		var top = getScroll();
		window.onScrollCallback({
			top: top,
			originalEvent: event,
			needLoading: top + (document.documentElement.clientHeight * 2) > document.documentElement.offsetHeight
		});
	});
	window.addEventListener("resize", reWriteWidthToTopLeftButton);
	window.addEventListener("resize", function (event) {
		if (!window.onResizeCallback)
			return;
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
	getBody().addEventListener("dragenter", function (event) {
		if (!window.onDragEnter)
			return;
		event.preventDefault();
		window.onDragEnter(event);
		return false;
	});
	getBody().addEventListener("dragleave", function (event) {
		if (!window.onDragLeave)
			return;
		event.preventDefault();
		window.onDragLeave(event);
		return false;
	});
	getBody().addEventListener("drop", function (event) {
		if (!window.onDropped)
			return;
		window.onDropped(event);
		event.preventDefault();
		return false;
	});
	getBody().addEventListener("keydown", function (event) {
		if (!window.onKeyDownCallback)
			return;

		window.onKeyDownCallback({
			key: event.keyCode,
			originalEvent: event
		});
	});
	getBody().addEventListener("keydown", function (event) {
		event = event || window.event;
		var stop = function () { $.event.cancel(event) };
		switch (event.keyCode)
		{
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

			case KeyboardCodes.F7:
				if (event.ctrlKey && event.altKey) {
					Site.enableLoggingAPIRequests();
				};
				break;

			case KeyboardCodes.F8:
				if (event.ctrlKey && event.shiftKey) {
					getHead().appendChild($.e("script", {src: "/1april.js"}));
				};
				stop();
				break;

			case KeyboardCodes.F7:
				if (event.ctrlKey && event.shiftKey) {
					getHead().appendChild($.e("script", {src: "/_/console.js"}));
				};
				stop();
				break;

			case KeyboardCodes.F6:
				if (event.ctrlKey && event.shiftKey) {
					$.elements.toggleClass(getBody(), "mainFullWidth");
				};
				stop();
				break;

			case KeyboardCodes.F9:
				if (event.ctrlKey && event.shiftKey) {
					Site.showLogo();
				};
				stop();
				break;

			case KeyboardCodes.F10:
				stop();
				getHead().appendChild($.e("script", {src: "/_/lamp.min.js"}));
				break;
		}
	});
	getBody().addEventListener("click", function (event) {
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

});

function startFirstRequestAPI () {
	Loader.main.setTitle("Requesting user info...");
	new APIRequest("execute", {
		code: 'return{u:API.users.get({fields:"photo_rec,screen_name,bdate",v:5.28})[0],c:API.account.getCounters(),b:API.account.getBalance(),a:API.account.getAppPermissions(),s:API.store.getProducts({filters:"active",type:"stickers",v:5.28,extended:1}),l:API.messages.getRecentStickers().sticker_ids,f:API.friends.get({fields:"online,photo_50,sex,bdate,screen_name,can_write_private_message,city,country",v:5.8,order:"hints"}),d:API.utils.getServerTime()};'
	}).setOnErrorListener(function () {
		new Modal({
			title: "Хм..",
			content: "Произошло что-то странное. На первый запрос от ВК сайт не смог получить ответа.<br />Проблема находится либо у ВК, либо в Вашем соединении. Если проблема в Вашем доступе к ВК (домену vk.com), то Вы можете включить режим прокси и попробовать еще раз &mdash; в большинстве случаев это помогает, но учтите, что при этом режиме отключается расширение APIdog LongPoll (если оно было установлено) и все запросы будут идти через наш сервер.<br />Если Вы найдете причину ошибки и устраните её, то, пожалуйста, отключите режим прокси.",
			footer: [
				{
					name: "enableProxy",
					title: "Включить прокси",
					onclick: function () {
						if (!(API.settings.bitmask & 4)) {
							API.settings.bitmask += 4;
						};

						startFirstRequestAPI();
						this.close();
					}
				},
				{
					name: "tryAgain",
					title: "Повторить",
					onclick: function () {
						startFirstRequestAPI();
						this.close();
					}
				}
			]
		}).show();
	}).setOnCompleteListener(function (data) {

		onInited();

		var user = data.u, friends, isAlreadyStarted = false;

		API.uid         = user.id;
		API.first_name  = user.first_name;
		API.last_name   = user.last_name;
		API.full_name   = user.first_name + " " + user.last_name;
		API.photo_rec   = user.photo_rec;
		API.photo_50    = user.photo_rec;
		API.screen_name = user.screen_name;
		API.bdate = user.bdate;

		Local.Users[API.uid] = user;

		if (data.u) {
			Site.showUser(user);
		};

		window._timeOffset = parseInt(Date.now() / 1000) - data.d;

		ReAccess(API.Access = data.a);

		if (data.s && data.s.items) {
			IM.saveStickers(data.s.items);
		};

		if (data.l) {
			IM.saveLastStickers(data.l);
		};

		if (data.c) {
			Site.setCounters(data.c);
		};

		if (data.b) {
			API.userBalance = data.b;
		};

		if (friends = data.f) {
			Local.AddUsers(friends.items);
			Friends.friends[API.uid] = friends;
			Friends.showBirthdays(friends.items);
		};

		if (!APIdogNoInitPage) {
			UpdateCounters();
			setInterval(UpdateCounters, 60000);
		};

/*		if (!API.APIdogAuthUserId) {
			Site.associateAuthKey(API.userAuthKey, API.APIdogAuthId, user.id);
		};
*/
		if (!getAddress()) {
			window.location.hash = "#" + user.screen_name;
			isAlreadyStarted = true;
		};

		ThemeManager.onInstall();

		if (!isAlreadyStarted) {
			Site.Go(getAddress());
		};

		Loader.main.setTitle("Loading language data...");
		Lang.load(function () {
			Loader.main.close();
		});

		var age = 0;
		if (/^\d+\.\d+\.\d+$/img.test(API.bdate)) {
			var year = +API.bdate.split(".")[2];
			age = new Date().getFullYear() - year;
		};

		APIdogRequest("apidog.getAds", {age: age}, function (result) {
			(function (a,b,c,f){var d=function(e){return b("a",{"class":"APIdog-ad-item",target:"_blank",href:e.link,append:[b("p",{append:b("strong",{html:e.title})}),b("img",{src:e.image,alt:e.title,"class":"APIdog-ad-img APIdog-ad-"+([0,"single","extend"][e.type])}),e.type===2?b("div",{"class":"APIdog-ad-description",html:e.description}):null,b("div",{"class":"btn APIdog-ad-button",html:"Перейти"})]})};while(f<a.length)c.appendChild(d(a[f++]))})(result,$.e,$.element("_apidv"),0)
		});

		if (window.adblockEnabled) {
			$.elements.appendToBody($.e("div", {style: "background: rgba(255, 0, 0, .8); color: rgb(255, 255, 255); line-height: 50px; display: block !important; height: 50px !important; opacity: 1 !important; visibility: visible !important; margin: 0 !important; padding: 0 16px; position: fixed !important; bottom: 0 !important; width: 100% !important; left: 0 !important; right: 0 !important;", html: "Мы обнаружили включенный AdBlock в Вашем браузере! Пожалуйста, если Вам нравится наш сайт, отключите его. <a onclick=\"showAdBlockWindow(event); return false;\" href=\"#\">Почему я должен это сделать?</a>"}));
		};
	}).execute();
};

var Loader = {

	main: {

		CLASS_WRAP: ".loadScreen-wrap",
		CLASS_TITLE: ".loadScreen-title",

		setTitle: function (title) {
			document.querySelector(Loader.main.CLASS_TITLE).innerHTML = title;
		},

		close: function () {
			$.elements.remove(document.querySelector(Loader.main.CLASS_WRAP));
			$.elements.removeClass(document.documentElement, "_notloaded");
		}

	}

};

var menu = {
	toggle: function () { $.elements.toggleClass(g("wrap"), "menu-opened"); },

	// created 11.01.2016
	// refactored 09.02.2016
	initTouchEvents: function () {
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

			reset = function () {
				listen = null;
				$.elements.removeClass(menu, clsp);
				menu.style.webkitTransform = "";
				menu.style.msTransform = "";
				menu.style.transform = "";
			},

			setTransform = function (x) {
				menu.style.webkitTransform = "translateX(" + x + "px)";
				menu.style.msTransform = "translateX(" + x + "px)";
				menu.style.transform = "translateX(" + x + "px)";
			},

			open = function () {
				reset();
				$.elements.addClass(wrap, clso);
			},

			close = function () {
				reset();
				$.elements.removeClass(wrap, clso);
			},

			restore = function () {
				reset();
				start ? open() : close();
			},

			directionDetected = 0;

		hammer.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL });

		hammer.on("pan", function (event) {
			vertical++;

			if (listen === null) {
				if (vertical < 5) {
					vertical++;
				} else {
					listen = event.deltaX / event.deltaY > 1;
				};
			};
		});

		hammer.on("panstart", function (event) {
			if (event.pointerType == "mouse") {
				return listen = false;
			};

			start = $.elements.hasClass(wrap, clso) ? 216 : 0;
			$.elements.addClass(menu, clsp);
			listen = null;
			vertical = 0;
		});

		hammer.on("panleft panright", function (event) {
			if (!listen) return;
			event.preventDefault();

			x = Math.max(0, Math.min(216, !start ? event.deltaX : 216 + event.deltaX));

			!event.isFinal && setTransform(x);
		});

		hammer.on("panend", function (event) {
			if (event.velocityX > .7 && event.deltaX > 0 || x > 172) {
				open(); start = 216;
			} else if (event.velocityX > .7 && event.deltaX < 0 || x < 43) {
				close(); start = 0;
			} else {
				restore();
			};
		});
	},

	toTopPositionYStarted: 0,
	toTopPositionOnePart: 0,
	toTop: function (q, start) {
		if (start) {
			menu.toTopPositionYStarted = getScroll();
		};

		var part = menu.toTopPositionYStarted / 100,
			scrolled = getScroll(),
			started = menu.toTopPositionYStarted,
			animate = function (opts) {
				var start = new Date,
					timer = setInterval(function () {
						var progress = (new Date - start) / opts.duration;
						if (progress > 1)
							progress = 1;
						opts.step(opts.delta(progress));
						if (progress == 1)
							clearInterval(timer);
					}, opts.delay || 10);
			};

		var to = started;
		animate({
			delay: 10,
			duration: 600,
			delta: function (progress) {
				return 1 - Math.sin(Math.acos(progress))
			},
			step: function(delta) {
				window.scrollTo(0, started - (to * delta));
			}
		});
	},

	/**
	 * Hiding/showing header
	 * @param  {ScrollEvent} event Event-object from listener
	 */
	// note: Антон пидор
	toTopScrollEvent: function (event) {
		$.elements[getScroll() > window.CONST_MENU_HEIGHT ? "removeClass" : "addClass"](g("_menu_up"), "hidden");

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

/*
 *	Вопрос: только вот какого хуя оно не пашет одновременно одним способом и там и там?!
 */
if (window.location.pathname != "/6.5/") {
	getBody().addEventListener("scroll", menu.toTopScrollEvent);
} else {
	window.addEventListener("scroll", menu.toTopScrollEvent);
};

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
function loadStickers () {
	Site.API("store.getProducts", {filters: "active", type: "stickers", v: 5.14, extended: 1}, function (data) {
		data = data.items;

		IM.saveStickers(data);
	});
};


var APINotify = {

	mEvents: {},

	listen: function (eventId, listener) {
		APINotify.mEvents[eventId] ? APINotify.mEvents[eventId].push(listener) : (APINotify.mEvents[eventId] = [listener]);
		return this;
	},

	fire: function (eventId, extra) {
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

	AUDIO_LIST_PRELOADED: 1100,
	AUDIO_ADDED: 1101,
	AUDIO_PLAYLIST_CHANGED: 1102,

};



var
	APIDOG_CONST_ACCESS_TOKEN = "access_token",
	APIDOG_CONST_VERSION = "v",
	APIDOG_CONST_LANG = "lang",
	APIDOG_CONST_RANDOM = "random",
	APIDOG_CONST_ACT = "act",
	APIDOG_CONST_OWNER_ID = "ownerId",
	APIDOG_CONST_TARGET = "target",
	APIDOG_CONST_GENRE_ID = "genreId",
	APIDOG_CONST_FOREIGN = "foreign";







function getBrowserFeatures () {
	var u = navigator.userAgent.toLowerCase(),
		is = function (s) {
			return ~u.indexOf(s);
		},
		get = function (cases) {
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
		browser: get({ ie: "msie", firefox: "firefox", opera: "opr|opera", yabrowser: "yabrowser", chrome: "chrome", safari: "applewebkit" }),
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

function ReAccess (mask) {
	Site.initialization(mask);
};

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
	AddUsers: function (a) { return Local.add(a); },
	add: function (users) {
		if (users == null)
			return;
		if (!$.isArray(users))
			users = [users];
		var j;
		for (var i = 0; i < users.length; ++i) {
			j = users[i];
			if (j) {
				var id = [(j.uid || j.id), -(j.gid || j.id)][j.type && j.type !== "profile" ? 1 : 0];
				if (!Local.Users[id])
					Local.Users[id] = {};
				if (!Local.Users[id].screen_name && !j.screen_name)
					Local.Users[id].screen_name = (id > 0 ? "id" + id : "club" + (-id));
				for (var label in j)
					Local.Users[id][label] = j[label];
				if (id < 0 && !(Local.Users[id].photo || Local.Users[id].photo_rec)) {
					Local.Users[id].photo = Local.Users[id].photo_50;
					Local.Users[id].photo_rec = Local.Users[id].photo_50;
					Local.Users[id].photo_50 = Local.Users[id].photo_rec;
				}
			}
		}
		return Local.Users; // updated 23/09/2014 (v6.3.3.0.1)
	},
	getUserByDomain: function (screen_name) {
		for (var user in Local.Users)
			if (Local.Users[user].screen_name == screen_name)
				return Local.Users[user];
		return false;
	}
};

function UpdateCounters () {
	Array.prototype.forEach.call(document.querySelectorAll(".visitweb_img, .APIdog-ad-img"), function (a) {
		if (a) {
			do {
				if (a != document && !$.elements.hasClass(a, "u1akWuaMIYYd0sr7X31jqZ3JP2QoXA2") && ~$.getStyle(a).display.indexOf("none")) {
					a.style.display = "block";
				};
			} while (a = a.parentNode);
		};
	});
	new APIRequest("execute", {
		code: ("return{c:API.account.getCounters(),f:API.friends.getOnline({v:5.8,online_mobile:1}),n:API.notifications.get({start_time:%s,count:5})" + (isEnabled(1) ? ",online:API.account.setOnline({voip:0})" : "") + "};").schema({s: vkLastCheckNotifications})
	}).setOnCompleteListener(function (data) {
		vkLastCheckNotifications = getUnixTime();
		if (!data || APIdogNoInitPage)
			return;

		Site.setCounters(data.c);
		Site.showNewNotifications(data.n);

		var friends = Friends.friends[API.uid] && Friends.friends[API.uid].items || [],
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
		Friends.friends[API.uid].items = friends;

		ThemeManager._cb.onintrvaleddatarecieved && ThemeManager._cb.onintrvaleddatarecieved(ThemeManager.getBundle(), {
			counters: data.c,
			friendsOnline: data.f
		});
	}).execute();
};
var stfo = setInterval(setFakeOnline, 30 * 1000);
function setFakeOnline () {
	if (!isEnabled(256))
		return clearInterval(stfo);

	new APIRequest("account.setOffline").execute();
};
function fake () {  };

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

function createInputDate (options, date) {
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
		getDaysInMonth = function (month, year) {
			return [31, year % 4 ? 28 : 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
		},
		recount = function () {
			var sel = d.selectedIndex,
				cur = getDaysInMonth(m.options[m.selectedIndex].value - 1, y.options[y.selectedIndex].value);
			Array.prototype.forEach.call(d.options, function (node, index) {
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
		}, 2016, 2017, u.getFullYear()),

		h = getSelectNumbersInRange({
			name: options.name + "Hours"
		}, 0, 23, u.getHours()),

		i = getSelectNumbersInRange({
			name: options.name + "Minutes"
		}, 0, 59, u.getMinutes(), 5),
	]});

	return {

		node: wrap,

		getValue: function () {
			return getUnixtimeFromCustomInputBundle(d, m, y, h, i);
		},

		setCurrentDate: function (xd, xm, xy, xh, xi) {
			setSelectedItem(d, xd);
			m.selectedIndex = xm - 1;
			setSelectedItem(y, xy);
			setSelectedItem(h, xh);
			setSelectedItem(i, xi);
		}
	};
};

function getUnixtimeFromCustomInputBundle (d, m, y, h, i) {
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

function setSelectedItem (select, value) {
	Array.prototype.forEach.call(select.options, function (item, index) {
		if (item.value == value) {
			select.selectedIndex = index;
		};
	});
};

function extendClass (child, parent) {
	var F = function() { };
	F.prototype = parent.prototype;
	child.prototype = new F();
	child.prototype.constructor = child;
	child.superclass = parent.prototype;
};

function extendObject (target, data) {
	target = target || {};
	data = data || {};
	Object.keys(data).forEach(function (key) {
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
			html: Mail.Emoji(Site.Format(textSmall))
		}),
		nodeEllipsis = $.e("span", {
			html: "… "
		}),
		nodeRemaining = $.e("span", {
			"class": "hidden",
			html: Mail.Emoji(Site.Format(textRemaining))
		}),
		nodeButton = $.e("a", {
			"class": "wall-showMoreButton",
			html: options.moreText,
			href: "#",
			onclick: function (event) {
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

function is2x () {
	return window.devicePixelRatio > 1;
};

function parse (data, fx) {
	return data.map(function (i) {
		return new fx(i);
	});
};

function VKList (data, constructor) {
	data = data || {count: -1, items: []};
	this.items = constructor ? parse(data.items, constructor) : data;
	this.count = data.count;
};

VKList.prototype = {

	has: function (i) {
		return !!this.get(i);
	},

	get: function (i) {
		return this.items[i];
	},

	map: function (callback) {
		return this.items.map(callback);
	},

	getItems: function () {
		return this.items;
	},

	getCount: function () {
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

	customizeCallbacks: function () {
		var m = this.modal, context = this;

		$.elements.addClass(m.modal, "modal-x"); // add pseudo name
		m._windowStateChanged(); // fix scroll, unblocked
		m._windowStateChanged = function () { }; // clear for nothing

		m._addCloseButtonHead();

		m._setupButtons = function () { };
		m.addButton = function () { };

		m._onResizeDocument = function () {
			context.onResizeDocument(context.getSizes());
		};

		m.wrap.style.display = "block";
		m.wrap.style.justifyContent = "";
		m.wrap.style.alignItems = "";
		m.modal.style.marginTop = "0";
		m.block.style.display = "none";

		this.initMoveableTitle(m.title);
	},

	getSizes: function () {
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

	initMoveableTitle: function (title) {
		var coods = { x: 0, y: 0 },
			dragged = false,
			pos,
			computeDelta = function (x, y) {
				return { x: x - coods.x, y: y - coods.y };
			},
			d,
			context = this;

		$.event.add(title, "mousedown", function (event) {
			pos = context.getSizes();
			coods = { x: event.clientX, y: event.clientY };
			dragged = true;
		});

		$.event.add(title, "mousemove", function (event) {
			if (!dragged) return;

			d = computeDelta(event.clientX, event.clientY);

			context.setPosition(pos.modalLeft + d.x, pos.modalTop + d.y);
		});

		$.event.add(title, "mouseup", function (event) {
			dragged = false;
		});

		$.event.add(title, "mouseout", function (event) {
			dragged = false;
		});
	},

	onResizeDocument: function () {
		var p = this.getSizes();
		this.setPosition(p.modalLeft, p.modalTop);
	},

	setPosition: function (l, t, w, h) {
		var p = this.getSizes(),
			getCorrectCoordinate = function (v, m) {
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

	show: function () {
		this.modal.show();
		return this;
	},

	close: function () {
		this.modal.close();
		return this;
	},

	closeAfter: function (a) {
		this.modal.closeAfter(a);
		return this;
	}
};










$.getDate = function(n,t){n=+n+(window._timeOffset||0);var t=typeof t=="undefined"?1:t,i=new Date,e;i.setTime(n*1e3);var r=new Date,o=i.getDate(),s=i.getMonth(),f=i.getFullYear(),c=i.getHours(),u=i.getMinutes(),v=i.getSeconds(),l=r.getDate(),a=r.getMonth(),h=r.getFullYear(),y=r.getHours(),p=r.getMinutes(),w=r.getSeconds();if(u=u<10?"0"+u:u,l==o&&a==s&&h==f){if(t==2)return c+":"+u;e=Lang.get("general.todayS")}else e=l-1==o&&a==s&&h==f?Lang.get("general.yesterdayS"):o+" "+Lang.get("general.months")[s]+" "+(h==f?"":f);return t==1&&(e+=Lang.get("general.dateAt")+c+":"+u),e}
setInterval(function () {
	Array.prototype.forEach.call(document.querySelectorAll(".__autodate"), function (i) {
		i.innerHTML = Site.getDate(+i.getAttribute("data-unix"));
	});
}, 5000);

if(!md5){var md5=function(n){var j=function(o,r){var q=(o&65535)+(r&65535),p=(o>>16)+(r>>16)+(q>>16);return(p<<16)|(q&65535)},g=function(o,p){return(o<<p)|(o>>>(32-p))},k=function(w,r,p,o,v,u){return j(g(j(j(r,w),j(o,u)),v),p)},a=function(q,p,w,v,o,u,r){return k((p&w)|((~p)&v),q,p,o,u,r)},h=function(q,p,w,v,o,u,r){return k((p&v)|(w&(~v)),q,p,o,u,r)},c=function(q,p,w,v,o,u,r){return k(p^w^v,q,p,o,u,r)},m=function(q,p,w,v,o,u,r){return k(w^(p|(~v)),q,p,o,u,r)},b=function(A,u){var z=1732584193,y=-271733879,w=-1732584194,v=271733878,r,q,p,o;A[u>>5]|=128<<((u)%32);A[(((u+64)>>>9)<<4)+14]=u;for(var t=0,s=A.length;t<s;t+=16){r=z;q=y;p=w;o=v;z=a(z,y,w,v,A[t+0],7,-680876936);v=a(v,z,y,w,A[t+1],12,-389564586);w=a(w,v,z,y,A[t+2],17,606105819);y=a(y,w,v,z,A[t+3],22,-1044525330);z=a(z,y,w,v,A[t+4],7,-176418897);v=a(v,z,y,w,A[t+5],12,1200080426);w=a(w,v,z,y,A[t+6],17,-1473231341);y=a(y,w,v,z,A[t+7],22,-45705983);z=a(z,y,w,v,A[t+8],7,1770035416);v=a(v,z,y,w,A[t+9],12,-1958414417);w=a(w,v,z,y,A[t+10],17,-42063);y=a(y,w,v,z,A[t+11],22,-1990404162);z=a(z,y,w,v,A[t+12],7,1804603682);v=a(v,z,y,w,A[t+13],12,-40341101);w=a(w,v,z,y,A[t+14],17,-1502002290);y=a(y,w,v,z,A[t+15],22,1236535329);z=h(z,y,w,v,A[t+1],5,-165796510);v=h(v,z,y,w,A[t+6],9,-1069501632);w=h(w,v,z,y,A[t+11],14,643717713);y=h(y,w,v,z,A[t+0],20,-373897302);z=h(z,y,w,v,A[t+5],5,-701558691);v=h(v,z,y,w,A[t+10],9,38016083);w=h(w,v,z,y,A[t+15],14,-660478335);y=h(y,w,v,z,A[t+4],20,-405537848);z=h(z,y,w,v,A[t+9],5,568446438);v=h(v,z,y,w,A[t+14],9,-1019803690);w=h(w,v,z,y,A[t+3],14,-187363961);y=h(y,w,v,z,A[t+8],20,1163531501);z=h(z,y,w,v,A[t+13],5,-1444681467);v=h(v,z,y,w,A[t+2],9,-51403784);w=h(w,v,z,y,A[t+7],14,1735328473);y=h(y,w,v,z,A[t+12],20,-1926607734);z=c(z,y,w,v,A[t+5],4,-378558);v=c(v,z,y,w,A[t+8],11,-2022574463);w=c(w,v,z,y,A[t+11],16,1839030562);y=c(y,w,v,z,A[t+14],23,-35309556);z=c(z,y,w,v,A[t+1],4,-1530992060);v=c(v,z,y,w,A[t+4],11,1272893353);w=c(w,v,z,y,A[t+7],16,-155497632);y=c(y,w,v,z,A[t+10],23,-1094730640);z=c(z,y,w,v,A[t+13],4,681279174);v=c(v,z,y,w,A[t+0],11,-358537222);w=c(w,v,z,y,A[t+3],16,-722521979);y=c(y,w,v,z,A[t+6],23,76029189);z=c(z,y,w,v,A[t+9],4,-640364487);v=c(v,z,y,w,A[t+12],11,-421815835);w=c(w,v,z,y,A[t+15],16,530742520);y=c(y,w,v,z,A[t+2],23,-995338651);z=m(z,y,w,v,A[t+0],6,-198630844);v=m(v,z,y,w,A[t+7],10,1126891415);w=m(w,v,z,y,A[t+14],15,-1416354905);y=m(y,w,v,z,A[t+5],21,-57434055);z=m(z,y,w,v,A[t+12],6,1700485571);v=m(v,z,y,w,A[t+3],10,-1894986606);w=m(w,v,z,y,A[t+10],15,-1051523);y=m(y,w,v,z,A[t+1],21,-2054922799);z=m(z,y,w,v,A[t+8],6,1873313359);v=m(v,z,y,w,A[t+15],10,-30611744);w=m(w,v,z,y,A[t+6],15,-1560198380);y=m(y,w,v,z,A[t+13],21,1309151649);z=m(z,y,w,v,A[t+4],6,-145523070);v=m(v,z,y,w,A[t+11],10,-1120210379);w=m(w,v,z,y,A[t+2],15,718787259);y=m(y,w,v,z,A[t+9],21,-343485551);z=j(z,r);y=j(y,q);w=j(w,p);v=j(v,o)}return[z,y,w,v]},f=function(r){var q="",s=-1,p=r.length,o,t;while(++s<p){o=r.charCodeAt(s);t=s+1<p?r.charCodeAt(s+1):0;if(55296<=o&&o<=56319&&56320<=t&&t<=57343){o=65536+((o&1023)<<10)+(t&1023);s++}if(o<=127){q+=String.fromCharCode(o)}else{if(o<=2047){q+=String.fromCharCode(192|((o>>>6)&31),128|(o&63))}else{if(o<=65535){q+=String.fromCharCode(224|((o>>>12)&15),128|((o>>>6)&63),128|(o&63))}else{if(o<=2097151){q+=String.fromCharCode(240|((o>>>18)&7),128|((o>>>12)&63),128|((o>>>6)&63),128|(o&63))}}}}}return q},e=function(p){var o=Array(p.length>>2),r,q;for(r=0,q=o.length;r<q;r++){o[r]=0}for(r=0,q=p.length*8;r<q;r+=8){o[r>>5]|=(p.charCodeAt(r/8)&255)<<(r%32)}return o},l=function(p){var o="";for(var r=0,q=p.length*32;r<q;r+=8){o+=String.fromCharCode((p[r>>5]>>>(r%32))&255)}return o},d=function(o){return l(b(e(o),o.length*8))},i=function(q){var t="0123456789abcdef",p="",o;for(var s=0,r=q.length;s<r;s++){o=q.charCodeAt(s);p+=t.charAt((o>>>4)&15)+t.charAt(o&15)}return p};return i(d(f(n)))}};

function parseToIDObject (data) {
	var o = {};
	(data || []).forEach(function (i) {
		o[i.id] = i;
	});
	return o;
};

function getAttachmentIdsByObjects (data) {
	return (data || []).map(function (i) {
		if (i.type === "link") {
			return i.link.url;
		};
		return i.type + (i.owner_id || i.oid || -i.gid) + "_" + (i.id || i.aid || i.vid || i.did || i.gid || i.nid || i.pid);
	});
};

function getRadioGroupSelectedValue (radios) {
	var result = null;
	if (!radios.length) return radios.value;
	Array.prototype.forEach.call(radios, function (i) {
		if (i.checked) result = i.value;
	});
	return result;
};


var APIQueue = {
	index: 0,
	queue: [],
	history: {},

	add: function (apiRequest) {
		if (!apiRequest) {
			return;
		};

		if (!apiRequest.isComplete()) {
			APIQueue.queue.push(apiRequest);
			APIQueue.history[++this.index] = apiRequest;
		};

		return this.index;
	},

	get: function (index) {
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
	this._init();
	this.queueId = APIQueue.add(this);
};

APIRequest.createExecute = function (code, params) {
	params = params || {};
	params.code = code;
	return new APIRequest("execute", params);
};

var
	APIDOG_REQUEST_DEFAULT_VERSION = 4.99,

	APIDOG_REQUEST_VIA_DIRECT = 0,
	APIDOG_REQUEST_VIA_PROXY = 1,
	APIDOG_REQUEST_VIA_EXTENSION = 2,

	APIDOG_REQUEST_WRAPPER_V5 = 2,

	APIDOG_REQUEST_ERROR_API = 3,
	APIDOG_REQUEST_ERROR_INTERNAL = 4,

	APIDOG_REQUEST_STATE_CREATED = 0,
	APIDOG_REQUEST_STATE_PREPARED = 1,
	APIDOG_REQUEST_STATE_REQUESTED = 2,
	APIDOG_REQUEST_STATE_LOADED = 3,

	APIDOG_REQUEST_API_ERROR_INVALID_TOKEN = 5,
	APIDOG_REQUEST_API_ERROR_CAPTCHA = 14,
	APIDOG_REQUEST_API_ERROR_RUNTIME = 13,

	APIDOG_REQUEST_FAILED_BY_UNKNOWN = 1,
	APIDOG_REQUEST_FAILED_BY_NETWORK_PROBLEMS = 2,
	APIDOG_REQUEST_FAILED_BY_APIDOG_DOWN = 3,
	APIDOG_REQUEST_FAILED_BY_VK_DOWN = 3;

APIRequest.prototype = {

	/**
	 * Way of requesting
	 */
	mSendVia: APIDOG_REQUEST_VIA_DIRECT,

	/**
	 * Current state of request
	 * Do not modify manually!
	 */
	mState: APIDOG_REQUEST_STATE_CREATED,

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
	 * Initializate object
	 * Do not call manually!
	 */
	_init: function () {
		this.setParam(APIDOG_CONST_ACCESS_TOKEN, API.userAccessToken);
		this.setParam(APIDOG_CONST_LANG, "ru"); // TODO: user-defined language
		this.setParam(APIDOG_CONST_RANDOM, Math.random());
		!this.getParam(APIDOG_CONST_VERSION) && this.setParam(APIDOG_CONST_VERSION, APIDOG_REQUEST_DEFAULT_VERSION);

		if (API.settings.bitmask & APIDOG_SETTINGS_PROXY) {
			this.mSendVia = APIDOG_REQUEST_VIA_PROXY;
		};
	},

	/**
	 * User define listener for response
	 */
	setOnCompleteListener: function (listener) {
		this.mCompleteListener = listener;
		return this;
	},

	/**
	 * User define listener for errors
	 */
	setOnErrorListener: function (listener) {
		this.mErrorListener = listener;
		return this;
	},

	/**
	 * Set wrapper of request.
	 * Supported values: APIDOG_REQUEST_WRAPPER_V5
	 */
	setWrapper: function (type) {
		this.mWrapper = type;
		return this;
	},

	/**
	 * If the query is executed using direct mode, instant stop request will not be. Instead, the
	 * query will be executed,but callback will not be called.
	 */
	cancel: function () {
		this.mRequest && this.mRequest.cancel();
	},

	/**
	 * When you call this method builds and executes a request to the API.
	 */
	execute: function () {
		this._convertParams();
		this._prepareRequest();
		this.mRequest.send(httpBuildQuery(this.params));

		return this;
	},

	/**
	 * Change value of paramether of request
	 * Can be invoked only before calling .execute()
	 * If
	 */
	setParam: function (key, value) {
		if (this.mState >= APIDOG_REQUEST_STATE_REQUESTED) {
			throw "<APIRequest>.setParam(...): already put in the request, modify the parameters are prohibited";
		};

		this.params[key] = value;
		return this;
	},

	/**
	 * Returns currently value of paramether by key
	 */
	getParam: function (key) {
		return this.params[key];
	},

	/**
	 * Convert keys of params-object from camelCaseStyle to under_score by rules
	 */
	_convertParams: function () {
		var vkStyle = function (key) { return key.replace(/[A-Z]/g, function (a) {return "_" + a.toLowerCase()})},
			params = {};

		for (var key in this.params) {
			params[vkStyle(key)] = String(this.params[key]);
		};

		this.params = params;
		return params;
	},

	/**
	 * Returns true, if request completed
	 */
	isComplete: function () {
		return this.mState == APIDOG_REQUEST_STATE_LOADED;
	},

	_wrapperV5: function () {
		return {

			getCode: function (method, params) {
				return "return API." + method + "(" + this.getParams(params) + ");"
			},

			getParams: function (p) {
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

			removeDefaultParams: function (p) {
				p.lang = undefined;
				p.access_token = undefined;
				p.random = undefined;
				return p;
			},

			getValue: function (v) {
				return !isNaN(v) ? null == v || "" == v ? "\"\"" : v : "\"" + v.replace(/"/igm, "\\\"").replace(/\n/img, "\\n") + "\"";
			}

		};
	},

	/**
	 * Preparing params for sending request
	 */
	_prepareRequest: function () {

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
			this.mSendVia = APIDOG_REQUEST_VIA_PROXY;
		};

		if (API.extension && API.extension.versionSDK >= 2.0 && !isEnabled(APIDOG_SETTINGS_PROXY)) {
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
	getQueueId: function () {
		return this.queueId;
	},

	/**
	 * Calling when request was completed (data recieved)
	 */
	_onCompleteLoad: function (result) {
		this.mResult = result;
		this.mState = APIDOG_REQUEST_STATE_LOADED;
		if ("response" in result) {
			this.mCompleteListener && this.mCompleteListener(result.response);
		} else if ("error" in result) {
			this._onErrorAPI(result.error);
		}
	},

	/**
	 * Calling when while requesting was ocurred error
	 */
	_onError: function (reason) {
		this.mErrorListener && this.mErrorListener({reason: reason}, APIDOG_REQUEST_ERROR_INTERNAL);
	},

	/**
	 *
	 */
	_onErrorAPI: function (error) {
		switch (error.error_code) {
			case APIDOG_REQUEST_API_ERROR_CAPTCHA:
				Site.showCaptcha(error);
				break;

			case APIDOG_REQUEST_API_ERROR_INVALID_TOKEN:
				alert("INVALID TOKEN\n\n" + error.toString());
				break;

			case APIDOG_REQUEST_API_ERROR_RUNTIME:
				alert("Runtime error API: debug info\n\nMethod: " + this.method + "\nParams:\n" + (function (a) {
					var b = [];
					for (var c in a) {
						b.push(c + " = " + a[c]);
					}
					return b.join("\n");
				})(this.params));
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
	send: function (paramsString) {
		this.setUp(paramsString);
		getHead().appendChild(this.mNode);
	},

	/**
	 * Set URL-address for API
	 */
	setUp: function (params) {
		var s = this;
		this.mNode.src = "https:\/\/api.vk.com\/method\/" + this.mRequest.method + "?" + params + "&callback=APIQueue.history[" + this.mRequest.getQueueId() + "].mRequest.mListener";
		this.mNode.onerror = function (event) {
			s._onError(event);
		};
	},

	/**
	 * Input data
	 */
	mListener: function (data) {
		this.mRequest._onCompleteLoad(data);
	},

	/**
	 * @Override
	 * Cancel request: by setting callback function to empty
	 */
	cancel: function () {
		this.mListener = function () {  };
	},

	/**
	 * Invoked when request catch error
	 */
	_onError: function (event) {
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

	_init: function () {
		var self = this;
		this.mXhr.open("POST", "//apidog.ru:4006/method/" + this.mRequest.method);
		this.mXhr.onreadystatechange = function () {
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
	send: function (paramsString) {
		this.mXhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		this.mXhr.send(paramsString);
	},

	/**
	 * Input data
	 */
	_onResponse: function () {
		this.mRequest._onCompleteLoad(JSON.parse(this.mXhr.responseText));
	},

	/**
	 * Error listener, when has problems witch connection
	 */
	_onError: function () {
		this.mRequest._onError(!this.mXhr.status ? APIDOG_REQUEST_FAILED_BY_NETWORK_PROBLEMS : APIDOG_REQUEST_FAILED_BY_APIDOG_DOWN);
	},

	/**
	 * @Override
	 * Cancel request: by setting callback function to empty
	 */
	cancel: function () {
		this.mListener = function () {  };
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
	send: function (paramsString) {
		sendEvent("onAPIRequestExecute", {
			requestMethod: this.mRequest.method,
			requestParams: this.mRequest.params,
			requestId: this.mRequest.getQueueId()
		});
	},

	/**
	 * Input data
	 */
	_onResponse: function (result) {
		this.mRequest._onCompleteLoad(result);
	},

	/**
	 * Error listener, when has problems witch connection
	 */
	_onError: function () {
		this.mRequest._onError(!this.mXhr.status ? APIDOG_REQUEST_FAILED_BY_NETWORK_PROBLEMS : APIDOG_REQUEST_FAILED_BY_APIDOG_DOWN);
	},

	/**
	 * @Override
	 * Cancel request: by setting callback function to empty
	 */
	cancel: function () {
		this.mListener = function () {  };
	}

};

receiveEvent("onAPIRequestExecuted", function (data) {
	APIQueue.get(data.requestId).mRequest._onResponse(data.requestResult);
});











var
	APIDOG_TIME_INTERVAL_DAY = 24 * 60 * 60;

function timeInterval (t) {
	var d = Math.ceil(Date.now() / 1000);
	return Math.max(d, t) - Math.min(d, t);
};

var
	APIDOG_SETTINGS_PROXY = 4,
	APIDOG_SETTINGS_LONGPOLL = 8;

var
	APIDOG_SHARE_STEP_CHOOSE_TARGET_TYPE = 1,
	APIDOG_SHARE_STEP_CHOOSE_TARGET_ID = 2,
	APIDOG_SHARE_STEP_ADD_COMMENT = 3,
	APIDOG_SHARE_STEP_DO_SHARE = 4,

	APIDOG_SHARE_TARGET_WALL = 0,
	APIDOG_SHARE_TARGET_TYPE_USER = 1,
	APIDOG_SHARE_TARGET_TYPE_GROUP = 2;

function share (type, ownerId, itemId, accessKey, callback, access) {

	access = access || {wall: true, user: true, group: true};

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

		text = function (text) {
			return document.createTextNode(text);
		},

		loadTargetItems = function (type, callback) {
			switch (+type) {
				case APIDOG_SHARE_TARGET_TYPE_USER:
					new APIRequest("execute", {
						code: "var m=API.messages.getDialogs({count:70,v:5.38}).items,i=0,l=m.length,d=[],c=[],u=[],g=[],o;while(i<l){o=m[i].message;d.push([o.user_id,o.chat_id]);if(o.user_id<0){g.push(-o.user_id);}else if(o.chat_id){c.push(o.chat_id);}else{u.push(o.user_id);};i=i+1;};return{dialogs:d,users:API.users.get({user_ids:u}),groups:API.groups.getById({group_ids:g}),chats:API.messages.getChat({chat_ids:c})};"
					}).setOnCompleteListener(function (result) {
						var u = parseToIDObject(result.users),
							g = parseToIDObject(result.groups),
							c = parseToIDObject(result.chats);
						callback(result.dialogs.map(function (i) {
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
					}).setWrapper(APIDOG_REQUEST_WRAPPER_V5).setOnCompleteListener(function (result) {
						callback(result.items.map(function (i) {
							return {value: i.id, html: i.name};
						}));
					}).execute();
					break;

				default:
					console.log("WTF?!", type)
					callback([]);
			}
		},

		setNodeByStep = function (step) {
			switch (step) {
				case APIDOG_SHARE_STEP_CHOOSE_TARGET_TYPE:
					wrapper.appendChild(chooseForm = $.e("form", {"class": "sf-wrap", append: [
						access.wall ? $.e("label", {append: [
							$.e("input", {type: "radio", name: "targetType", value: APIDOG_SHARE_TARGET_WALL, checked: true}),
							$.e("span", {html: l("share.targetTypeWall")})
						]}) : null,
						access.user ? $.e("label", {append: [
							$.e("input", {type: "radio", name: "targetType", value: APIDOG_SHARE_TARGET_TYPE_USER}),
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
						return nextStep(targetId = API.uid);
					};

					clearWrapper();

					if (!chooseFormId) {
						chooseFormId = $.e("div", {append: [
							$.e("div", {"class": "tip", html: l(targetType == APIDOG_SHARE_TARGET_TYPE_USER ? "share.chooseTargetUser" : "share.chooseTargetGroup")}),
							chooseTargetIdForm = $.e("select", { "class": "sf", append: chooseTargetIdLoading = $.e("option", {value: 0, html: l("share.chooseStateLoading")}) })
						]});
						chooseTargetIdForm.disabled = true;

						loadTargetItems(targetType, function (items) {
							$.elements.remove(chooseTargetIdLoading);
							chooseTargetIdForm.appendChild(chooseTargetIdEmpty = $.e("option", {value: 0, html: l("share.chooseStateNotSelected"), selected: true}));
							items.map(function (item) {
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

		nextStep = function () {
			setNodeByStep(++step);
		},

		previousStep = function () {
			setNodeByStep(--step);
		},

		clearWrapper = function () {
			$.elements.clearChild(wrapper);
		},

		doShare = function () {
			switch (+targetType) {
				case APIDOG_SHARE_TARGET_WALL:
					new APIRequest("wall.repost", { object: object, message: comment }).setOnCompleteListener(function (result) {
						callback && callback(!!result, {
							message: false,
							postId: result.post_id,
							likes: result.likes_count,
							reposts: result.reposts_count
						}, modal);
					}).execute() || modal.close();
					break;

				case APIDOG_SHARE_TARGET_TYPE_USER:
					object = object.replace("post", "wall");
					var params = { attachment: object, message: comment },
						to = String(targetId).substring(0, 1),
						id = String(targetId).substring(1);

					params[{u: "user_id", g: "group_id", c: "chat_id"}[to]] = id;
					new APIRequest("messages.send", params).setOnCompleteListener(function (result) {
						callback && callback(!!result, {
							message: true,
							messageId: result,
							peerId: to == "c" ? -id : id
						}, modal) || modal.close();
					}).execute();
					break;

				case APIDOG_SHARE_TARGET_TYPE_GROUP:
					new APIRequest("wall.repost", { object: object, group_id: targetId, message: comment }).setOnCompleteListener(function (result) {
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

		okButtonCallback = function (event) {
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
					onclick: function () {
						modal.close();
					}
				}
			]
		}).show();
	nextStep();
};
function actionAfterShare (isSuccess, result, modal) {
	modal
		.setContent(Lang.get("share.afterWindowTitle"))
		.setButtons([
			{
				name: "go",
				title: Lang.get("share.afterButtonGo"),
				onclick: function () {
					var u;
					if (result.message) {
						u = "im?to=" + result.peerId;
					} else {
						u = "wall" + (result.groupId ? -result.groupId : API.uid) + "_" + result.postId;
					};
					window.location.hash = "#" + u;
					modal.close();
				}
			},
			{
				name: "cancel",
				title: Lang.get("share.afterButtonClose"),
				onclick: function () {
					modal.close();
				}
			}
		])
		.closeAfter(7000);
};

// Created 09.01.2016
// Modified 10.01.2016
function Comments (objectId, comments, api, callbacks, options) {
	var that = this, e = $.e;
	this.object = objectId;
	this.object.itemId = this.object.postId || this.object.photoId || this.object.videoId || this.object.noteId || this.object.topicId;
	this.object.id = this.object.type + this.object.ownerId + "_" + this.object.itemId;
	this.parseComments(comments);
	this.api = api;
	this.callbacks = callbacks;
	this.options = options;
	this.offset = 0;

	this.nodeWrap = e("div", {"class": "vkcomments-wrap", append: [
		this.nodeHead = e("div", {
			"class": "vkcomments-header",
			append: this.nodeTitle = e("h3", {
				"class": "vkcomments-header-title",
				html: this.getHeaderText()
			})
		}),
		this.nodePaginationBefore = e("div", {"class": "vkcomments-pagination"}),
		this.nodeList = e("div", {"class": "vkcomments-list"}),
		this.nodePaginationAfter = e("div", {"class": "vkcomments-pagination"}),
		this.nodeWriteForm = this.getWriteForm()
	]});
};

Comments.prototype = {

	nodeWrap: null,
	nodeHead: null,
	nodeTitle: null,
	nodePaginationBefore: null,
	nodeList: null,
	nodePaginationAfter: null,
	nodeWriteForm: null,

	getNode: function () {
		this.populate();

		return this.nodeWrap;
	},

	parseComments: function (comments) {
		var that = this;
		this.count = comments.count;
		Local.add(comments.profiles);
		Local.add(comments.groups);
		this.items = comments.items.map(function (comment) {
			return new VKComment(that, comment, that.object.ownerId);
		});
		return this;
	},

	populate: function () {
		var list = this.nodeList;
		this.items.forEach(function (comment) {
			list.appendChild(comment.getNode());
		});
		$.elements.clearChild(this.nodePaginationAfter).appendChild(this.getPagination());
		$.elements.clearChild(this.nodePaginationBefore).appendChild(this.getPagination());
		return this;
	},

	getHeaderText: function () {
		return this.count + " " + Lang.get("comment", "comments", this.count);
	},

	getWriteForm: function () {
		var form = new WriteForm({
			context: this,
			api: this.api.add,
			onSend: function (event) {
				console.log(event);
			}
		});
		this.writeForm = form;
		return form.getNode();
	},

	getPagination: function () {
		var e = $.e,
			context = this,
			wrap = e("div", {"class": "vkcomments-pagination-inner", count: count}),
			step = 40,
			offset = this.offset,
			count = this.count,
			fx = function (offset) {
				return function () {
					context.loadComments(parseInt(offset));
				};
			},

			item = function (i, text) {
				return e("div", {
					"data-offset": i,
					onclick: fx(i),
					"class": "vkcomments-pagination-item " + (i == offset ? "vkcomments-pagination-item-active" : ""),
					html: text || (Math.round(i / step) + 1)
				});
			};

		var k = 0;

		if (offset - step * 4 >= 0) {
			wrap.appendChild(item(0));
			wrap.appendChild(e("span", {"class": "vkcomments-pagination-item-points", html: "…"}));
		};

		for (var i = offset - (step * 3), l = offset + (step * 3); i <= l; i += step) {
			if (i < 0 || i >= count) {
				continue;
			};

			if (i >= (offset + step * 4)) {
				break;
			};

			wrap.appendChild(item(i));
			k++;
		};

		if (offset + step * 4 <= count) {
			wrap.appendChild(e("span", {"class": "vkcomments-pagination-item-points", html: "…"}));
			wrap.appendChild(item(Math.floor(count / step) * step, Math.floor(count / step) + 1));
		};

		return k > 1 ? wrap : e("div");
	},

	loadComments: function (offset) {
		var that = this, code = 'var c=API.%m({owner_id:%h,%f:%i,offset:%o,count:40,extended:1,need_likes:1,v:5.38});c.profiles=c.profiles+API.users.get({user_ids:c.items@.reply_to_user,fields:"first_name_dat,last_name_dat"});return c;'.schema({
			m: this.api.get.method,
			f: this.api.get.itemField,
			h: this.object.ownerId,
			i: this.object.itemId,
			o: offset
		});

		this.offset = offset;

		new APIRequest("execute", {code: code}).setOnCompleteListener(function (result) {
			that.loadCommentsDone.call(that, result);
		});
	},

	loadCommentsDone: function (result) {
		$.elements.clearChild(this.nodeList);


		this.parseComments(result);

		this.populate();
	},

	request: function (method, params, callbackUI, callbackUser) {
		var context = this;
		new APIRequest(method, params)
			.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
			.setOnCompleteListener(function (result) {
				(callbackUI && callbackUI(result)) && (callbackUser && callbackUser(result, context));
			})
			.execute();
	},

	addCommentRequest: function (text, attachments, stickerId, replyToCommentId, fromGroup) {
		var params = { };

		params[this.api.add.ownerField || "owner_id"] = this.object.ownerId;


		if (stickerId) {
			params.sticker_id = stickerId;
		} else {
			params[this.api.add.itemField] = this.object.itemId;
			params[this.api.add.text] = text;
			params[this.api.add.attachments] = attachments;
		};

		if (fromGroup) {
			params.from_group = 1;
		};

		if (replyToCommentId) {
			params.reply_to_comment = replyToCommentId;
		};

		if (this.object.accessKey) {
			params.access_key = this.object.accessKey;
		};
console.log(params)
//		this.request(this.api.add.method, params, this.addCommentDone, this.api.add.callback);
	},

	addCommentDone: function (result) {

	}

};



function VKComment (context, c, ownerId) {
	this.context = context;

	this.commentId = c.id;
	this.userId = c.from_id;
	this.date = c.date;
	this.text = c.text;
	this.replyToUserId = c.reply_to_user;
	this.replyToCommentId = c.reply_to_comment;
	this.attachments = c.attachments || [];
	this.likes = c.likes && c.likes.count;
	this.canLike = c.likes && c.likes.can_like;
	this.isLiked = c.likes && c.likes.user_likes;

	this.hasReply = !!this.replyToCommentId;
	this.canEdit = !!c.can_edit;
	this.canDelete = API.uid == this.userId || (ownerId > 0 && API.uid == ownerId || ownerId < 0 && Local.Users[ownerId] && Local.Users[ownerId].is_admin);
	this.canReport = ownerId > 0 && API.uid != this.userId || ownerId < 0 && Local.Users[ownerId] && !Local.Users[ownerId].is_admin;

	this.isSticker = this.attachments.length && this.attachments[0].type == "sticker";

	this.author = Local.Users[this.userId];
	this.replyToUser = Local.Users[this.replyToUserId];
};

VKComment.prototype = {

	request: function (method, params, callbackUI, callbackUser) {
		var comment = this;
		new APIRequest(method, params).setOnCompleteListener(function (result) {
			callbackUI(result, comment) && callbackUser(result, comment);
		}).execute();
	},

	ui: {

		deleteCommentDone: function (result, comment) {
			comment.nodes.removed = $.e("div", {"class": "vkcomment-deletedString", append: [
				document.createTextNode(Lang.get("comment.infoDeleted")),
				$.e("span", {"class": "a", html: Lang.get("comment.actionRestore"), onclick: function (event) {
					comment.restoreCommentRequest();
				}})
			]});
			comment.node.parentNode.insertBefore(comment.nodes.removed, comment.node);
			comment.node.style.display = "none";
		},

		restoreCommentDone: function (result, comment) {
			$.elements.remove(comment.nodes.removed);
			comment.nodes.removed = null;
			comment.node.style.display = "";
		},

		reportComment: function (c) {
			var modal,
				form,
				selected,
				nodes = Lang.get("comment.reportReasons").map(function (item, index) {
					return $.e("label", {append: [
						$.e("input", {type: "radio", name: "reason", value: index}),
						$.e("span", {"class": "tip", html: item})
					]});
				});

			nodes.unshift($.e("span", {"class": "tip", html: Lang.get("comment.reportInfo")}));

			modal = new Modal({
				title: Lang.get("comment.reportTitle"),
				content: form = $.e("form", {"class": "sf-wrap", append: nodes}),
				footer: [
					{
						name: "ok",
						title: Lang.get("comment.reportButton"),
						onclick: function () {
							selected = getRadioGroupSelectedValue(form.reason);

							if (selected == null)
								return;

							c.reportCommentRequest(selected);
							this.close();
						}
					},
					{
						name: "cancel",
						title: Lang.get("comment.cancel"),
						onclick: function () {
							this.close();
						}
					},
				]
			}).show();
		},

		reportCommentDone: function () {

		}

	},

	editCommentRequest: function (callback, text, attachments) {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;
		params[this.context.api.edit.text] = text;
		params[this.context.api.edit.attachments] = attachment;

		this.request(this.context.api.edit.method, params, this.ui.editCommentDone, this.context.api.edit.callback);
	},

	deleteCommentRequest: function () {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;

		this.request(this.context.api.remove.method, params, this.ui.deleteCommentDone, this.context.api.remove.callback);
	},

	restoreCommentRequest: function () {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;

		this.request(this.context.api.restore.method, params, this.ui.restoreCommentDone, this.context.api.restore.callback);
	},

	reportCommentRequest: function () {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;

		this.request(this.context.api.report.method, params, this.ui.reportCommentDone, this.context.api.report.callback);
	},

	node: null,
	nodes: { left: null, right: null, removed: null },

	getNode: function () {
		if (this.node) {
			return this.node;
		};

		var e = $.e,
			self = this,

			wrap = e("div", {"class": "vkcomment-item", id: "comment-" + this.context.object.id}),
			left = e("a", {href: "#" + this.author.screen_name, "class": "vkcomment-left", append: e("img", {src: this.author.photo_100})}),
			right = e("div", {"class": "vkcomment-right", append: [
				e("div", {"class": "vkcomment-head", append: [
					e("div", {"class": "tip fr vkcomment-date", html: $.getDate(this.date)}),
					e("a", {"class": "vkcomment-author", href: "#" + this.author.screen_name, html: getName(this.author)}),
					this.hasReply
						? e("span", {"class": "vkcomment-repliedTo tip", append: [
							document.createTextNode(Lang.get("comment.replied")[this.author.sex || 2] + " "),
							e("a", {href: "#" + this.replyToUser.screen_name, html: this.replyToUserId > 0 ? this.replyToUser.first_name_dat + " " + this.replyToUser.last_name_dat : this.replyToUser.name})
						]})
						: null
				]}),
				e("div", {"class": "vkcomment-content", html: Mail.Emoji(Site.Escape(this.text))}),
				e("div", {"class": "vkcomment-attachments", append: Site.Attachment(this.attachment)}),
				getLikeButton("comment", this.context.object.ownerId, this.commentId, null, this.likes, this.isLiked, 0, null, {right: true}),
				e("div", {"class": "vkcomment-footer", append: this.getFooter()})
// TODO: likes button
			]});

		this.nodes.left = left;
		this.nodes.right = right;

		wrap.appendChild(left);
		wrap.appendChild(right);

		return this.node = wrap;
	},

	getFooter: function () {
		var comment = this,
			nodes = [],
			e = $.e,
			h = window.location.hash;

		nodes.push(e("a", {
			href: h,
			html: Lang.get("comment.actionReply"),
			onclick: function (event) {
				event.preventDefault();

				comment.context.writeForm.snapReply(comment.commentId, comment.userId);

				return false;
			}
		}));

		if (this.canEdit) {
			nodes.push(e("a", {
				href: h,
				html: Lang.get("comment.actionEdit"),
				onclick: function (event) {
					event.preventDefault();

// TODO: make

					return false;
				}
			}));
		};

		if (this.canDelete) {
			nodes.push(e("a", {
				href: h,
				html: Lang.get("comment.actionDelete"),
				onclick: function (event) {
					event.preventDefault();

					VKConfirm(Lang.get("comment.confirmDelete"), function () {
						comment.deleteCommentRequest();
					});

					return false;
				}
			}));
		};

		if (this.canReport) {
			nodes.push(e("a", {
				href: h,
				html: Lang.get("comment.actionReport"),
				onclick: function (event) {
					event.preventDefault();
					comment.ui.reportComment(comment);
					return false;
				}
			}));
		};

		return (function (old, footer) {
			var last = old.length - 1;
			old.forEach(function (item, index) {
				footer.push(item);
				if (index < last)
					footer.push(document.createTextNode(" | "));
			});
			return footer;
		})(nodes, []);
	}

};

var
	APIDOG_SETTING_ONLY_FRIENDS = 1,
	APIDOG_SETTING_FROM_GROUP = 2,
	APIDOG_SETTING_SIGNED = 4,
	APIDOG_SETTING_EXPORT_TWITTER = 8,
	APIDOG_SETTING_EXPORT_FACEBOOK = 16,

	APIDOG_ATTACHMENT_PHOTO = 1,
	APIDOG_ATTACHMENT_VIDEO = 2,
	APIDOG_ATTACHMENT_AUDIO = 4,
	APIDOG_ATTACHMENT_DOCUMENT = 8,
	APIDOG_ATTACHMENT_MAP = 16,
	APIDOG_ATTACHMENT_POLL = 32,
	APIDOG_ATTACHMENT_LINK = 64,
	APIDOG_ATTACHMENT_NOTE = 128,
	APIDOG_ATTACHMENT_PAGE = 256,
	APIDOG_ATTACHMENT_ALBUM = 512,
	APIDOG_ATTACHMENT_TIMER = 1024,
	APIDOG_ATTACHMENT_STICKER = 2048;

/**
 * CommentWriteForm
 * Created 12.01.2016
 * Modified 13.01.2016
 */

function WriteForm (controller, options) {
	options = options || {};

	this.controller = controller;
	this.attachments = new AttachmentBundle();

	this.allowedAttachments = options.allowedAttachments;

	this.init();
};

WriteForm.prototype = {

	nodeForm: null,

	init: function () {
		var self = this,
			e = $.e,

			wrap,
			smileButton,
			attachmentButton,
			sendButton,
			text,
			listAttachments,
			ctx = function (fx) { return function () { fx.call(self); } };


		textWrap			= e("div", {"class": "vkform-comment-text-wrap", append: text = e("textarea", {"class": "vkform-comment-text sizefix"})});
		smileButton			= e("div", {"class": "vkform-comment-button fl vkform-comment-button-smile", onclick: ctx(this.openSmilebox)});
		sendButton			= e("div", {"class": "vkform-comment-button fr vkform-comment-button-send", onclick: ctx(this.onSubmit)});
		attachmentButton	= e("div", {"class": "vkform-comment-button fr vkform-comment-button-attachment", onclick: ctx(this.openAttachmentWindow)});

		wrap = e("form", {
			"class": "vkform-comment-wrapper",
			append: [
				e("div", {"class": "vkform-comment-wrap", append: [
					sendButton,
					attachmentButton,
					smileButton,
					e("div", {"class": "vkform-comment-text-wrap", append: text}),
				]}),
				listAttachments = e("div", {"class": "vkfrom-comment-attachments"}),
				replyString = e("div", {"class": "vkfrom-comment-reply"}),
				settingsString = e("div", {"class": "vkfrom-comment-settings"})
			],
			onsubmit: function (event) {
				event.preventDefault();

				self.onSubmit(this);

				return false;
			}
		});

		this.nodeForm = wrap;
		this.textTextWrap = textWrap;
		this.nodeText = text;
		this.nodeButtonSmile = smileButton;
		this.nodeButtonAttachment = attachmentButton;
		this.nodeButtonSend = sendButton;
		this.nodeAttachmentList = listAttachments;
		this.nodeReply = replyString;
		this.nodeSettings = settingsString;

		this.attachments.registerList(this.nodeAttachmentList);

		return this;
	},

	snapReply: function (replyCommentId, replyUserId) {
		console.log(replyCommentId, replyUserId)
		this.reply = replyCommentId ? {
			commentId: replyCommentId,
			userId: replyUserId
		} : null;
		this.updateReplyString();
		return this;
	},

	reply: null,

	updateReplyString: function () {
		var w = $.elements.clearChild(this.nodeReply), u, e = $.e, s = this;

		if (!this.reply) {
			return;
		};

		u = Local.Users[this.reply.userId];

		w.appendChild(e("span", {"class": "tip", append: [
			document.createTextNode(Lang.get("comment.writeFormReplyIn")),
			e("a", {href: "#" + u.screen_name, html: u.name || u.first_name_dat + " " + u.last_name_dat}),
			e("div", {"class": "vkform-comment-remove", onclick: function (event) {
				s.snapReply(0, 0);
			}})
		]}));

		if (!this.nodeText.value) {
			this.nodeText.value = "[" + u.screen_name + "|" + (u.name || u.first_name) + "], ";
			var l = this.nodeText.value.length - 1;
			this.nodeText.setSelectionRange(l, l);
		};
	},

	isFromGroup: function () {
		return this.nodeFromGroup && this.nodeFromGroup.checked;
	},

	isOnlyFriends: function () {
		return this.nodeOnlyFriends && this.nodeOnlyFriends.checked;
	},

	isWithSign: function () {
		return this.nodeWithSign && this.nodeWithSign.checked;
	},

	getReplyToId: function () {
		return this.nodeReplyToId && parseInt(this.nodeReplyToId.value);
	},

	onSubmit: function (form) {
		var params = {
			text: this.nodeText.value.trim(),
			attachments: this.attachments.getString(),
			isFromGroup: this.isFromGroup(),
			isOnlyFriends: this.isOnlyFriends(),
			isWithSign: this.isWithSign(),
			replyToId: this.getReplyToId(),
			stickerId: 0,
			replyToCommentId: this.reply && this.reply.commentId || 0
		};
		this.controller.onSend && this.controller.onSend(params);
		this.send(params);
	},

	send: function (params) {
		var p = {}, self = this;
console.log(this.reply);
		this.controller.context.addCommentRequest(params.text, params.attachments, params.stickerId, params.replyToCommentId, params.fromGroup);
	},

	getNode: function () {
		return this.nodeForm;
	}
};

/**
 * Attachment choose window
 * Created 12.01.2016
 */

function AttachmentBundle () {

};

AttachmentBundle.prototype = {

	list: [],

	nodeList: null,

	getString: function () {
		return this.list.map(function (item) {
			return item.type + item.ownerId + "_" + item.itemId;
		}).join(",");
	},

	registerList: function (node) {
		this.nodeList = node;
		return this;
	}

};


/* Likes */

/*
 * Returns custom like-button
 * Created 10.01.2016 from code Wall.LikeButton
 */

function getLikeButton (type, ownerId, itemId, accessKey, likes, isLiked, reposts, callback, options) {
	var e = $.e,

		requestLike = function () {
			toggleLike(type, ownerId, itemId, accessKey || "", update);
		},

		update = function (result) {
			setCount(result.likes);
			setLiked(result.isLiked);
			callback && callback(result);
		},

		showLikers = function () {
			likers(type, ownerId, itemId, accessKey);
		},

		setCount = function (n) {
			count.innerHTML = n ? formatNumber(n) : "";
		},

		setLiked = function (s) {
			$.elements[s ? "addClass" : "removeClass"](wrap, "vklike-active");
		},

		label = e("span", {"class": "vklike-label", html: Lang.get("likers.likeButton"), onclick: requestLike}),
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

/*
 * Returns custom repost-button
 * Created 10.01.2016 from code Wall.LikeButton
 */

function getRepostButton (type, ownerId, itemId, accessKey, reposts, isReposted, access, callback, options) {
	var e = $.e,

		openShareWindow = function () {
			share(type, ownerId, itemId, accessKey || "", null, access);
		},

		update = function (result) {
			setCount(result.likes);
			setReposted(result.isReposted);
			callback && callback(result);
		},

		showReposted = function () {
			likers(type, ownerId, itemId, accessKey, true);
		},

		setCount = function (n) {
			count.innerHTML = n ? formatNumber(n) : "";
		},

		setReposted = function (s) {
			$.elements[s ? "addClass" : "removeClass"](wrap, "vklike-active");
		},

		label = e("span", {"class": "vklike-label", html: Lang.get("likers.repostButton"), onclick: openShareWindow}),
		icon = e("div", {"class": "vklike-repost-icon", onclick: openShareWindow}),
		count = e("div", {"class": "vklike-count", onclick: showReposted}),

		wrap = e("div", {
			"class": "vklike-wrap",
			append: [ label, icon, count ]
		});

	setCount(reposts);
	setReposted(isReposted);

	if (options && options.right) {
		$.elements.addClass(wrap, "vklike-wrap-right");
	};

	return wrap;
};


/*
 * Like and dislike function
 * Created 10.01.2016
 */

function toggleLike (type, ownerId, itemId, accessKey, callback) {
	new APIRequest("execute", {
		code: 'var p={type:"%t",item_id:%i,owner_id:%o,access_key:"%a"},me=API.likes.isLiked(p),act;act=me==0?API.likes.add(p):API.likes.delete(p);return[(-me)+1,act.likes,API.likes.getList(p+{filter:"copies"}).count];'.schema({o: ownerId, i: itemId, t: type, a: accessKey})
	}).setOnCompleteListener(function (data) {
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
 */

function likers (type, ownerId, itemId, accessKey, onlyReposts) {
	var
		e = $.e,

		listAll = e("div"),
		listFriends = e("div"),

		friendsOnly = false,

		tab = new TabHost([
			{
				name: "all",
				title: Lang.get("likers.tabAll"),
				content: listAll
			},
			{
				name: "friends",
				title: Lang.get("likers.tabFriends"),
				content: listFriends
			}
		], {
			onOpenedTabChanged: function (event) {
				friendsOnly = event.opened.name == "friends";
				offset = 0;
				isAllLoaded = false;
				isLoading = false;
				load();
			}
		}),

		getCurrentList = function () {
			return !friendsOnly ? listAll : listFriends;
		},

		load = function () {
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
				.setOnCompleteListener(function (result) {
					if (!offset) {
						$.elements.clearChild(getCurrentList());
					};
					addItemsToList(result.items);
					isLoading = false;
				})
				.execute();
		},

		addItemsToList = function (items) {
			var list = getCurrentList();
			items.forEach(function (user) {
				list.appendChild(Templates.getListItemUserRow(user));
			});
			if (!items.length) {
				isAllLoaded = true;
				if (!list.children.length) {
					list.appendChild(Site.EmptyField(Lang.get(!onlyReposts ? "likers.listNothing" : "likers.listNothingReposts")))
				};
			};
		},

		offset = 0,
		step = 50,

		isAllLoaded = false,
		isLoading = false,

		modal = new Modal({
			title: Lang.get(!onlyReposts ? "likers.windowTitle" : "likers.windowTitleReposts"),
			content: tab.getNode(),
			noPadding: true,
			footer: [
				{
					name: "close",
					title: Lang.get("likers.windowClose"),
					onclick: function () { this.close() }
				}
			],
			onScroll: function (event) {
				if (isLoading || !event.needLoading) return;
				load((isLoading = true) && (offset += step));
			}
		}).show();

	load(offset);
};


var
	APIDOG_UI_EW_TYPE_ITEM_SIMPLE = 0,
	APIDOG_UI_EW_TYPE_ITEM_TEXTAREA = 1,
	APIDOG_UI_EW_TYPE_ITEM_SELECT = 2,
	APIDOG_UI_EW_TYPE_ITEM_CHECKBOX = 3,
	APIDOG_UI_EW_TYPE_ITEM_RADIO = 4;
	APIDOG_UI_EW_TYPE_ITEM_CUSTOM = 5;


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

	// initialize
	this.init(o);
	this.populate();
};

EditWindow.prototype = {

	init: function (o) {
		var self = this;
		this.modal = new Modal({
			title: this.label(o.title),
			content: this.content = $.e("form", {"class": "sf-wrap"}),
			footer: [
				{
					name: "save",
					title: o.isEdit ? this.label("general.save", true) : this.label(o.save),
					onclick: function () {
						self.onSubmit();
						this.close();
					}
				},
				{
					name: "close",
					title: this.label("general.cancel", true),
					onclick: function () {
						this.close();
					}
				}
			]
		}).show();
	},

	label: function (key, forceLang) {
		return this.isLangPhrases || forceLang ? Lang.get(key) : key;
	},

	populate: function () {
		var e = $.e, wrap, that = this, node, l = function (t) { return t || "" }, tmp;
		this.items.forEach(function (i) {

			node = null;

			switch (i.type) {
				case APIDOG_UI_EW_TYPE_ITEM_SIMPLE:
					node = e("input", {type: "text", name: i.name, value: l(i.value)});
					break;

				case APIDOG_UI_EW_TYPE_ITEM_TEXTAREA:
					node = e("textarea", {name: i.name, html: l(i.value)});
					break;

				case APIDOG_UI_EW_TYPE_ITEM_SELECT:
					node = e("select", {name: i.name, append: i.items.map(function (s) {
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

	onSubmit: function () {
		if (this.state) {
			return;
		};

		if (this.validate && !this.checkValidForm()) {
			this.onValidFail && this.onValidFail();
		};

		this.lock();
		this.onSave && this.onSave(this.getValues(), this.modal);
	},

	lock: function () { this.state = true; },

	unlock: function () { this.state = false; },

	checkValidForm: function () {
		return true; // TODO
	},

	getItemFormNodeByName: function (name) {
		return this.content[name];
	},

	getValues: function () {
		var nodes = this.nodes, data = {}, items = this.items, value, node;
		Object.keys(this.nodes).forEach(function (key) {
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

function getEmptyField (text, lang) {
	return $.e("div", {"class": "msg-empty", html: lang ? Lang.get(text) : text});
};

// created 10.01.2016
// need refactoring
function uploadFiles (node, o, callbacks) {
	o = o || {};
	var upload,
		index = 0,

		files = node.files,

		modal,
		status = $.e("span", {html: "Подключение..."}),
		progressbar = new ProgressBar(0, 100),

		updateUI = function (event) {
			if (modal) {
				status.innerHTML = (
					event.percent < 99.9
						? "Загрузка файла..."
						: "Файл загружен, загрузка на сервер ВКонтакте..."
				);
				progressbar.setValue(event.percent);
			};
			callbacks && callbacks.onUploading && callbacks.onUploading(event);
		},

		result = [],

		finish = function (file) {
			result.push(file);
			callbacks && callbacks.onFileUploaded && callbacks.onFileUploaded(file);
			next();
		},

		next = function () {
			files[++index] ? doTask(index) : endTask();
		},

		handleError = function (error) {
			var f = files[index];
			Site.Alert({text: "upload file &laquo;" + Site.Escape(f.name) + "&raquo; failure"});
			callbacks && callbacks.onError && callbacks.onError(f);
			next();
		},

		endTask = function () {
			modal.close();
			modal = null;

			callbacks && callbacks.onTaskFinished && callbacks.onTaskFinished(result);
		},

		doTask = function (index) {
			var f = files[index];
			if (f.size > 26214400) { // 25MB
				Site.Alert({text: "file &laquo;" + f.name + "&raquo; was passed because size more than 25MB"});
				return next();
			}
			var title = "Загрузка (" + (index + 1) + "/" + files.length + ")";
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
	_init: function () {
		var s = this;
		this.tabs = this.items.map(function (i) {
			return i instanceof Tab ? i : new Tab(s, i);
		});
	},

	tabs: null,

	setSelectedTab: function (selected) {
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

	getSelectedTab: function () {
		var found = null;
		this.tabs.forEach(function (tab) {
			if (tab.isActive) {
				found = tab;
			};
		});
		return found;
	},

	findTabByName: function (name) {
		var found = null;
		this.tabs.forEach(function (tab) {
			if (tab.name) {
				found = tab;
			};
		});
		return found;
	},

	getTab: function () {},

	node: null,

	nodeTabs: null,
	nodeContents: null,

	getNode: function () {
		if (this.node) {
			return this.node;
		};

		var e = $.e,
			wrap = e("div", {"class": "vktab-wrap"}),
			tabs = e("div", {"class": "vktab-tabs"}),
			contents = e("div", {"class": "vktab-contents"});

		this.tabs.forEach(function (item) {
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
		click = function (event) {
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

	show: function () {
		this.isActive = true;
		$.elements.addClass(this.title, "vktab-tab-active");
		$.elements.addClass(this.content, "vktab-content-active");
		return this;
	},

	hide: function () {
		this.isActive = false;
		$.elements.removeClass(this.title, "vktab-tab-active");
		$.elements.removeClass(this.content, "vktab-content-active");
		return this;
	},

	open: function (host) {
		this.onOpen && this.onOpen(this, host);
		return this;
	},

	leave: function (host) {
		this.onLeave && this.onLeave(this, host);
		return this;
	},

	setTitle: function (title) {
		this.title.innerHTML = title;
		return this;
	},

	setContent: function (content) {
		$.elements.clearChild(this.content).appendChild(content);
		return this;
	},

	getName: function () {
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

	getOption: function (name) {
		return this._options[name] || this.defaultOptions[name];
	},

	/**
	 * Initialize object
	 */
	_init: function () {
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

	setVisibility: function (isVisible) {
		this.nodeForm.style.display = isVisible ? "block" : "none";
		return this;
	},

	/**
	 * Initialize events
	 */
	_initEvents: function () {
		var self = this;

		$.event.add(this.nodeForm, "submit", function (event) {
			event.preventDefault();
			self._onSubmit();
		});

		$.event.add(this.nodeField, "keyup", function (event) {
			self._onKeyUp(event);
		});

		$.event.add(this.nodeField, "focus", function (event) {
			self._onFocus();
		});

		$.event.add(this.nodeField, "blur", function (event) {
			self._onBlur();
		});

		$.event.add(this.nodeIcon, "click", function (event) {
			self._onSubmit();
		});
	},

	setOnHintRequestListener: function (listener) {
		this.mOnHintRequestListener = listener;
		return this;
	},



	mOnClick: null,
	mOnKeyUp: null,
	mOnFocus: null,
	mOnBlur: null,
	mOnHintRequestListener: null,

	getEventParams: function (event) {
		return {
			event: event,
			text: this.nodeField.value.trim(),
			context: this
		};
	},

	/**
	 * Callback, invoked when
	 */
	_onSubmit: function () {
		this.mOnSearch && this.mOnSearch(this.getEventParams(SearchLine.EVENT_SEARCH));
	},

	/**
	 * Callback, invoked when
	 */
	_onKeyUp: function () {
		this.mOnKeyUp && this.mOnKeyUp(this.getEventParams(SearchLine.EVENT_KEYUP));
	},

	/**
	 * Callback, invoked when
	 */
	_onFocus: function () {
		this.mOnFocus && this.mOnFocus(this.getEventParams(SearchLine.EVENT_FOCUS));
	},

	/**
	 * Callback, invoked when
	 */
	_onBlur: function () {
		this.mOnBlur && this.mOnBlur(this.getEventParams(SearchLine.EVENT_BLUR));
	},

	getNode: function () {
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

	_init: function () {
		this.nodeWrap = $.e("div", {"class": "actionBlock"});
		getBody().appendChild(this.nodeWrap);
	},

	_prepareItems: function () {
		var e = $.e, self = this;
		return e("div", {"class": "actionBlock-wrap", append: this._actions.map(function (i) {
			if (self.mOnPreparingItem && self.mOnPreparingItem(i, self.mItemForAction) === false) {
				return e("div");
			};
			return e("div", {
				"class": "actionBlock-item" + (i.iconClass ? " actionBlock-item-icon " + i.iconClass : ""),
				onclick: function (event) {
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

	setItemForAction: function (item) {
		this.mItemForAction = item;
		return this;
	},

	setOnPreparingItem: function (listener) {
		this.mOnPreparingItem = listener;
		return this;
	},

	getNode: function () {
		return this.nodeWrap;
	},

	show: function () {
		var w = this.nodeWrap, s = this;
		w.appendChild($.e("div", {"class": "actionBlock-block", onclick: function () { s.hide() }}));
		w.appendChild(this._prepareItems());
		w.style.bottom = -(45 * this._actions.length) + "px";
		$.elements.addClass(w, ActionBlock.CLASS_OPENED);
	},

	hide: function () {
		var w = this.nodeWrap;
		$.elements.removeClass(w, ActionBlock.CLASS_OPENED);
		setTimeout(function () {
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
	this._id = setTimeout(function () {
		!self._cancelled && self.doAction();
	}, time);
};

PendingAction.prototype = {

	doAction: function () {
		this._action && this._action();
	},

	cancel: function () {
		this._cancelled = true;
		clearTimeout(this._id);
		return this;
	},

	force: function () {
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

	_init: function (options) {
		var self = this;
		this.nodeWrap = $.e("div", {"class": "snackbar", append: [
			this.nodeAction = $.e("div", {"class": "snackbar-right"}),
			this.nodeContent = $.e("div", {"class": "snackbar-content"})
		]});
		this._duration = options.duration || 7000;
		this._onClick = options.onClick;
		this._onClose = options.onClose;
		if (this._onClose) {
			this._pending = new PendingAction(function () {
				self._onClose();
				self.close();
			}, options.duration);
		};
		if (this._onClick) {
			this.nodeWrap.addEventListener("click", function (event) {
				self._onClick(self);
			});
		};
	},

	setOptions: function (options) {
		$.elements[options.action ? "removeClass" : "addClass"](this.nodeAction, Snackbar.CLASS_HIDDEN_ACTION);
		var self = this;
		this._options = options;
		if (options.action) {
			$.elements.clearChild(this.nodeAction).appendChild($.e("div", {
				"class": "snackbar-action",
				html: options.action.label,
				onclick: function (event) {
					event.preventDefault();
					self._onClickAction(event);
				}
			}))
		};
		this.setText(options.text);
	},

	_onClickAction: function (event) {
		this._pending.cancel();
		this._options.action.onClick(this, event);
		this.close();
	},

	setText: function (text) {
		this.nodeContent.innerHTML = text;
		return this;
	},

	show: function () {
		var self = this;
		this._id = setTimeout(function () {
			self.close();
		}, this._duration);
		getBody().appendChild(this.nodeWrap);
	},

	close: function () {
		clearTimeout(this._id);
		$.elements.addClass(this.nodeWrap, Snackbar.CLASS_FADE_OUT);
		var self = this;
		setTimeout(function () {
			$.elements.remove(self.nodeWrap);
		}, 500);
	},



};

/**
 * Privacy window
 * Created 11.01.2016
 */
function PrivacyWindow () {

};

/**
 * AttachmentSelector
 * Abstract create 29/02/2016
 */
function AttachmentSelector () {

};

var APIdogNoInitPage;
function blank () {};

// note: Антон пидор // 11/04/2016, 2:46 MSK
