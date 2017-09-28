var onDomContentLoaded = function() {
	$.event.add(document, "visibilitychange", onHiddenStateChange);
	$.event.add(document, "mozvisibilitychange", onHiddenStateChange);
	$.event.add(document, "webkitvisibilitychange", onHiddenStateChange);
	$.event.add(document, "msvisibilitychange", onHiddenStateChange);

	/**
	 * @deprecated
	 */
	$.getDate = function(n,t){n=+n+(window._timeOffset||0);var t=typeof t==="undefined"?1:t,i=new Date,e;i.setTime(n*1e3);var r=new Date,o=i.getDate(),s=i.getMonth(),f=i.getFullYear(),c=i.getHours(),u=i.getMinutes(),v=i.getSeconds(),l=r.getDate(),a=r.getMonth(),h=r.getFullYear(),y=r.getHours(),p=r.getMinutes(),w=r.getSeconds();if(u=u<10?"0"+u:u,l===o&&a===s&&h===f){if(t===2)return c+":"+u;e=Lang.get("general.todayS")}else e=l-1===o&&a===s&&h===f?Lang.get("general.yesterdayS"):o+" "+Lang.get("general.months")[s]+" "+(h===f?"":f);return t===1&&(e+=Lang.get("general.dateAt")+c+":"+u),e}
};

var onLoad = function() {
	/*try {
		var audioSettings = $.localStorage("audio-settings");
		if (audioSettings & 16)
			Audios.player.toggleBroadcast($.elem(".live-audio")[0]);
		if (audioSettings & 32)
			Audios.player.toggleRepeat($.elem(".repeat-audio")[0]);
	} catch (e) {}*/



	window.CONST_MENU_HEIGHT = $.getPosition(g("_menu")).height;

	var reWriteWidthToTopLeftButton = function () {
		var all = $.getPosition(g("wrap")),
			content = $.getPosition(g("wrap-content"));
		g("_menu_up").style.width = ((all.width - content.width) / 2) + "px";
	};

	reWriteWidthToTopLeftButton();


	Mail.version = !isEnabled(Setting.MESSAGES_INSTEAD_DIALOGS);

	/**
	 * Initializations
	 */
	Audios.player.initEvents();

	if (isEnabled(Setting.USING_PROXY)) {
		$.elements.remove($.element("_link_ext"));
		$.elements.remove($.element("_notify_ext"));
	}

	if (isEnabled(Setting.IS_TOUCH)) {
		Menu.initTouchEvents();
	}

	// TODO: themes
	//Settings.applyCustomCSS();

	/**
	 * Initial request
	 */

	api("execute", {
		code: "return{u:API.users.get({fields:Args.uf})[0],c:API.account.getCounters(),b:API.account.getBalance(),a:API.account.getAppPermissions(),s:API.store.getProducts({merchant:Args.m,filters:Args.sf,type:Args.st,extended:1}),l:API.messages.getRecentStickers().sticker_ids,f:API.friends.get({fields:Args.uf,order:Args.o}),d:API.utils.getServerTime(),i:API.account.getInfo(),q:API.account.getPushSettings({device_id:1})};",
		uf: "online,photo_50,sex,bdate,screen_name,can_write_private_message,city,country,last_seen", // user fields
		m: "google",
		sf: "active,promoted", // store filter
		st: "stickers", // store type
		o: "hints", // friends order
		v: 5.64
	}).then(
		/**
		 * @param {{
		 *   u: User,
		 *   c: object,
		 *   b: int,
		 *   a: int,
		 *   s: {
		 *     count: int,
		 *     items: Sticker[]
		 *   },
		 *   l: int[],
		 *   f: {
		 *     count: int,
		 *     items: User[]
		 *   },
		 *   d: int,
		 *   i: object,
		 *   q: {
		 *     disabled: boolean,
		 *     conversations: {
		 *       count: int,
		 *       items: object[]
		 *     }
		 *   }
		 * }} data
		 */
	function(data) {
		var user = data.u, friends, isAlreadyStarted = false;

		Local.add(user);

		if (data.u) {
			Site.showUser(data.u);
		}

		if (data.c) {
			Site.setCounters(data.c);
		}

		if (data.b) {
			API.userBalance = data.b;
		}

		if (data.q) {
			Mail.setNotificationsSettings(data.q);
		}


		window._timeOffset = parseInt(Date.now() / 1000) - data.d;

		if (data.s && data.s.items) {
			EmotionController.populate(data.s.items.filter(function(i) {
				return !i.promoted;
			}), data.l);
		}



		if (friends = data.f) {
			Local.add(friends.items);
			Friends.friends[API.userId] = friends;
			Friends.showBirthdays(friends.items);
		}

		requestCounters();
		setInterval(requestCounters, 60000);

		//if (!API.userId)
		//	Site.associateAuthKey(API.authKey, API.authId, user.id);

		if (!getAddress())
			window.location.hash = "#" + user.screen_name;

		// TODO: ThemeManager.onInstall();

			Lang.load(function() {
				if (!getAddress()) {
					window.location.hash = "#" + user.screen_name;
					isAlreadyStarted = true;
				}

				!isAlreadyStarted && Site.route(getAddress());
			});

		$.elements.removeClass(document.documentElement, "_notloaded");

		/*if (window.adblockEnabled) {
			$.elements.appendToBody($.e("div", {style: "background: rgba(255, 0, 0, .8); color: rgb(255, 255, 255); line-height: 35px; display: block !important; height: 35px !important; opacity: 1 !important; visibility: visible !important; margin: 0 !important; padding: 0 16px; position: fixed !important; bottom: 0 !important; width: 100% !important; left: 0 !important; right: 0 !important;", html: "Мы обнаружили включенный AdBlock в Вашем браузере! Пожалуйста, если Вам нравится наш сайт, отключите его. <a style=\"color: rgb(255, 255, 255); text-decoration: underline;\" onclick=\"showAdBlockWindow(event); return false;\" href=\"#\">Почему я должен это сделать?</a>"}));
		};*/

		initStatLiveInternet();
		initStatYandexMetrika();
		initStatGoogleAnalytics();
		initAdMarketGid();
		initAdOur();

	});

	var scrollIteration = 0;
	window.addEventListener("scroll", Menu.toTopScrollEvent);
	window.addEventListener("scroll", function(event) {
		if (++scrollIteration < 5) {
			return;
		}

		scrollIteration = 0;

		var top = getScroll();

/*		if (window._tnfHash && $.element("tnf" + _tnfHash) && API.bitmask & 128) {
			Pidor.redrawHeadPosition(top);
		}
*/
		if (!window.onScrollCallback)
			return;
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
		var stop = function () {
			$.event.cancel(event)
		};
		switch (event.keyCode) {
			case KeyboardCodes.mediaChangeState:
			case KeyboardCodes.F1:
				Audios.player.toggle();
				stop();
				break;

			case KeyboardCodes.mediaPrevious:
			case KeyboardCodes.F2:
				Audios.previous();
				stop();
				break;

			case KeyboardCodes.mediaNext:
			case KeyboardCodes.F3:
				Audios.next();
				stop();
				break;

			case KeyboardCodes.tab:
				// TODO: EmotionController
				/*var el = document.querySelector(".imdialog-icon-smile-button");
				if (!el || event.ctrlKey || event.shiftKey) return;
				el.click();
				stop();*/
				break;

			case KeyboardCodes.F7:
				if (event.ctrlKey) {
					if (event.shiftKey) {
						getHead().appendChild($.e("script", {src: "/_/console.js"}));
					}
				}
				break;


			case KeyboardCodes.F9:
				if (event.ctrlKey) {
					initFreeMode();
				} else {
					Profile.showLastActivity(API.userId);
				}
				stop();
				break;

			case KeyboardCodes.F10:
				// TODO: return this
				if (!window._il) {
					getHead().appendChild($.e("script", {src: "/_/lamp.min.js"}));
				} else {
					$.elements.remove(window._il);
					window._il = null;
				}
				stop();
				break;
		}
	});

	if ("onhashchange" in window) {
		window.addEventListener("hashchange", function () {
			Site.route(window.location.hash);
		});
	} else {
		window.oldHash = window.location.hash;
		setInterval(function () {
			if (window.location.hash !== window.oldHash) {
				Site.route(window.oldHash = window.location.hash);
			}
		}, 1500);
	}
	Pidor.init();
};

function initFreeMode() {
	var resizable = document.querySelector("#page"),
		width = $.localStorage(initFreeMode.KEY_STORAFE_WIDTH) || resizable.offsetWidth;

	$.elements.addClass(document.documentElement, "manual-mode");

	resizable.style.width = width + "px";

	new ResizeSensor(resizable, function() {
		$.localStorage(initFreeMode.KEY_STORAFE_WIDTH, resizable.offsetWidth);
	});
}

initFreeMode.KEY_STORAFE_WIDTH = "mmw";


window.addEventListener("DOMContentLoaded", onDomContentLoaded);
window.addEventListener("load", onLoad);


function isHidden() {
	//noinspection JSUnresolvedVariable
	return document.hidden || document.mozHidden || document.webkitHidden || document.msHidden;
}

function onHiddenStateChange() {
	if (!isHidden() && LongPoll.hasUnread.length) {
		var messages = LongPoll.hasUnread.join(",");
		LongPoll.hasUnread = [];

		//noinspection JSIgnoredPromiseFromCall
		api("messages.markAsRead", {message_ids: messages});
	}
}


function blank() {

}

function getHead() {
	return document.getElementsByTagName("head")[0];
}

function getBody() {
	return document.getElementsByTagName("body")[0];
}

function getAddress(o) {
	var h = window.location.hash.replace("#", "");
	return o ? h : h.split("?")[0];
}

function setLocation(path) {
	return window.location.hash = "#" + path;
}

/**
 * Get node by ID
 * @param {string} id
 * @returns {Element}
 */
function g(id) {
	return document.getElementById(id);
}

/**
 * Get node by selector
 * @param {string} selector
 * @returns {Element}
 */
function q(selector) {
	return document.querySelector(selector);
}

/**
 * Cross-browser function for get content of iframe
 * @param frame
 * @returns {Document}
 */
function getFrameDocument(frame) {
	return frame.contentDocument || frame.contentWindow || frame.document;
}

/**
 * Get full name of user
 * @param {object} u
 * @returns {string}
 */
function getName(u) {
	return u.name ? u.name.safe() : (u.first_name || "").safe() + " " + (u.last_name || "").safe() + Site.isOnline(u);
}

/**
 * Return true if `bit` setting is enabled
 * @param {int} bit
 * @returns {boolean}
 */
function isEnabled(bit) {
	return !!(API.bitmask & bit);
}

function isNotification(bit) {
	return false; //isEnabled(1024) && (API.bitmaskNotifications & bit) > 0;
}

function getUnixTime() {
	return parseInt(Date.now() / 1000);
}

var APIDOG_DATE_FORMAT_FULL = 1,
	APIDOG_DATE_FORMAT_MEDIUM = 2,
	APIDOG_DATE_FORMAT_SMALL = 3,
	APIDOG_DATE_FORMAT_RELATIVE = 4,
	APIDOG_DATE_FORMAT_SMART = 5;

/**
 * Returns human representation of date
 * @param {int|Date} time
 * @param {int=} mode
 * @returns {string}
 */
function getDate(time, mode) {
	if (!(time instanceof Date)) {
		time = new Date(time * 1000);
	}

	mode = mode || APIDOG_DATE_FORMAT_FULL;

	var lang = API.language, locale = "en";

	if (lang === 0 || lang === 2) {
		locale = "ru";
	}

	switch (mode) {
		case APIDOG_DATE_FORMAT_FULL:
			//noinspection JSUnresolvedFunction
			return time.long(locale);

		case APIDOG_DATE_FORMAT_MEDIUM:
			//noinspection JSUnresolvedFunction
			return time.medium(locale);

		case APIDOG_DATE_FORMAT_SMALL:
			//noinspection JSUnresolvedFunction
			return time.short(locale);

		case APIDOG_DATE_FORMAT_RELATIVE:
			//noinspection JSUnresolvedFunction
			return time.relative(locale);

		case APIDOG_DATE_FORMAT_SMART:
			//noinspection JSUnresolvedFunction
			return Math.abs(Date.now() - time.getTime()) <= 4 * 3600 * 1000 ? time.relative(locale) : time.long(locale);
	}
	return "";
}

/**
 * Returns current scroll by Y about page
 * @returns {int}
 */
function getScroll() {
	return document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
}

/**
 * Return offset from address
 * @returns {int}
 */
function getOffset() {
	return parseInt(Site.get("offset")) || 0;
}

/**
 * Build string query
 * @param {object|Array} array
 * @returns {string}
 */
function httpBuildQuery(array) {
	return Object.toQueryString(array);
}

/**
 * Get value from form element
 * @param {HTMLElement|String} node
 * @returns {String|Number|null}
 */
function getValue(node) {
	if (typeof node === "string") {
		node = g(node);
	}
	switch (node.tagName.toLowerCase()) {

		case "input":
			/** @var {HTMLInputElement} node */
			switch (node.type) {

				case "text":
				case "password":
				case "hidden":
				case "email":
					return node.value;

				case "checkbox":
					return parseInt(node.checked);

				default:
					return null;
			}
			break;

		case "select":
			/** @var {HTMLSelectElement} node */
			return node.options[node.selectedIndex].value;

	}
	return null;
}

function prefix(node, property, value) {
	var forPrefix = property[0].toUpperCase() + property.substring(1);
	node.style["webkit" + forPrefix] = value;
	node.style["moz" + forPrefix] = value;
	node.style["ms" + forPrefix] = value;
	node.style["o" + forPrefix] = value;
	node.style[property] = value;
	return node;
}

/**
 * Change selection in field
 * @param {HTMLInputElement} input
 * @param {int} start
 * @param {int} end
 */
function setSelectionRange(input, start, end) {
	if (input.setSelectionRange) {
		input.setSelectionRange(start, end);
	} else {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveStart("character", start);
		range.moveEnd("character", end - start);
		range.select();
	}
}

/**
 * Smart listener for node
 * @param {Node} node
 * @param {function} callback
 * @param {boolean=} isReverse
 */
function setSmartScrollListener(node, callback, isReverse) {
	var fired = false,
		reset = function () {
			fired = false;
		};
	node.addEventListener("scroll", function () {
		var scrolled = this.scrollTop,
			blockHeight = this.offsetHeight,
			contentHeight = Array.prototype.reduce.call(this.children, function (prev, cur) {
				return prev + cur.offsetHeight;
			}, 0),
			needLoading = !isReverse ? contentHeight - scrolled - (blockHeight * 1.5) < 0 : scrolled < blockHeight * 1.5;

		if (needLoading && !fired) {
			fired = true;
			callback(reset);
		}

	});
}

/**
 * Returns loader node
 * @returns {HTMLElement}
 */
function getLoader() {
	return $.e("div", {style: "padding: 90px 0", append: $.e("div", {"class": "loader-line"})});
}

/**
 * @param  {class}  superclass Родительный класс
 * @param  {class}  subclass   Дочерний класс
 * @param  {object} methods    Новые методы
 * @return {class}             Дочерний наследованный класс
 */
function extendClass(superclass, subclass, methods) {
	subclass.prototype = Object.create(superclass.prototype);
	subclass.prototype.constructor = subclass;

	for (var method in methods) {
		subclass.prototype[method] = methods[method];
	}

	return subclass;
}

/**
 * Return lazy load image
 * @param {string} src
 * @param {int} width
 * @param {int} height
 * @returns {HTMLElement}
 */
function lz(src, width, height) {
	return $.e("img", {alt: "image", src: src, width: width, height: height});
}

function formatNumber(n) {
	return parseInt(n).format(0).replace(/,/, " ");
}

/**
 * @deprecated
 */
function random(a, b) {
	return Number.random(a, b);
}

/**
 * @deprecated
 */
function shuffle(array) {
	return array.shuffle();
}

function is2x() {
	return window.devicePixelRatio > 1;
}

function parse(data, fx) {
	return data.map(function (i) {
		return new fx(i);
	});
}

function includeScripts(scripts, onLoad) {
	if (!Array.isArray(scripts))
		scripts = [scripts];

	var loaded = 0, all = scripts.length, e = $.e, head = getHead();
	scripts.forEach(function (script) {
		head.appendChild(e("script", {
			src: script,
			onload: function (event) {
				$.elements.remove(this);
				if (++loaded === all)
					onLoad();
			}
		}));
	});
}

// TODO: i18n
function VKConfirm(text, callback, from) {
	var title = "Подтверждение";

	var modal = new Modal({ title: title, content: text, width: 350, footer: [
		{ name: "yes", title: Lang.get("general.yes"), onclick: function () { modal.close(); callback(); } },
		{ name: "no", title: Lang.get("general.no"), onclick: function () { modal.close(); } }
	]}).show(from);
	return modal;
}

/* Prototypes */

Number.prototype.format = function() {
	return String(this).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, "$1\u2009").trim();
};

Number.prototype.fix00 = function() {
	return this < 10 ? "0" + this : this;
};

String.prototype.schema = function(data) {
	var s = this, k;
	for (k in data) {
		if (data.hasOwnProperty(k)) {
			s = s.replace(new RegExp("%" + k, "img"), data[k]);
		}
	}
	return s;
};


/**
 * TODO: 1000 => 1K
 * @returns {Number}
 */
Number.prototype.toK = function() {
	return this.metric(1, "|KM");
};

Number.prototype.toTime = function() {
	var d = [Math.floor(this / 60 % 60), Math.floor(this % 60)],
		h = Math.floor(this / 60 / 60 % 60);
	d = d.map(function(n) {return n >= 10 ? n : "0" + n});
	h && d.unshift(h);
	return d.join(":");
};

Number.prototype.toRange = function(min, max) {
	return Math.max(Math.min(this, max), min);
};

String.prototype.safe = function() {
	return this.escapeHTML();
};

String.prototype.unsafe = function() {
	return this.unescapeHTML();
};

String.prototype.bb = function() {
	return String(this)
		.replace(/\[((\/?)(s|b|u|i|big|small|h1|h2|h3|pre|center)|(h|b)r)\]/igm, "<$1$2>")
		.replace(/\[(\/?)(red|gray)\]/igm, "<$1span class='bb-color-$2'>")
		.replace(/\[(\/?)li\]/igm, "<$1div class='bb-li'>")
		.replace(/\[(\/?)url=?([^\]]+)\]([^\[]+)\[\/url\]/img, function(a, b, c, d) {
			return "<a href='" + c + "'>" +  d+ "<\/a>"
		});
};

var emojiNeedReplace = !~navigator.userAgent.toLowerCase().indexOf("iphone"),
	emojiRegExp = /((?:[\u2122\u231B\u2328\u25C0\u2601\u260E\u261d\u2626\u262A\u2638\u2639\u263a\u267B\u267F\u2702\u2708]|[\u2600\u26C4\u26BE\u2705\u2764]|[\u25FB-\u25FE]|[\u2602-\u2618]|[\u2648-\u2653]|[\u2660-\u2668]|[\u26A0-\u26FA]|[\u270A-\u2764]|[\uE000-\uF8FF]|[\u2692-\u269C]|[\u262E-\u262F]|[\u2622-\u2623]|[\u23ED-\u23EF]|[\u23F8-\u23FA]|[\u23F1-\u23F4]|[\uD83D\uD83C\uD83E]|[\uDC00-\uDFFF]|[0-9]\u20e3|[\u200C\u200D])+)/g,
	emojiCharSequence = /[0-9\uD83D\uD83C\uD83E]/,
	emojiFlagRegExp = /\uD83C\uDDE8\uD83C\uDDF3|\uD83C\uDDE9\uD83C\uDDEA|\uD83C\uDDEA\uD83C\uDDF8|\uD83C\uDDEB\uD83C\uDDF7|\uD83C\uDDEC\uD83C\uDDE7|\uD83C\uDDEE\uD83C\uDDF9|\uD83C\uDDEF\uD83C\uDDF5|\uD83C\uDDF0\uD83C\uDDF7|\uD83C\uDDF7\uD83C\uDDFA|\uD83C\uDDFA\uD83C\uDDF8/,
	emojiImageTemplate = "<img src=\"\/\/vk.com\/images\/emoji\/{code}{size}.png\" alt=\"{symbol}\" class=\"emoji\" \/>",
	emojiImageTemplateProxy = "<img src=\"\/\/static.apidog.ru\/proxed\/smiles\/{code}.png\" alt=\"{symbol}\" class=\"emoji\" \/>",
	emojiHandler = function(s){//noinspection JSDuplicatedDeclaration
		var i=0,b="",a="",n,y=[],c=[],d,l,o="",j=!1,f=!1;while(n=s.charCodeAt(i++)){d=n.toString(16).toUpperCase();l=s.charAt(i-1);if(i===2&&n===8419){c.push("003"+s.charAt(0)+"20E3");y.push(s.charAt(0));b='';a='';continue}b+=d;a+=l;if(!l.match(emojiCharSequence)){c.push(b);y.push(a);b='';a=''}};if(b){c.push(b);y.push(a)}b="";a="";//noinspection JSDuplicatedDeclaration
		for(var i in c){d=c[i];l=y[i];if(l.match(/\uD83C[\uDFFB-\uDFFF]/)){b+=d;a+=l;continue}if(j){b+=d;a+=l;j=!1;continue}if(d==="200C"||d==="200D"){if(b){j=!0;continue}else o+=l}if(l.match(/\uD83C[\uDDE6-\uDDFF]/)){if(f){b+=d;a+=l;f=!1;continue}f=!0;}else if(f)f=!1;if(b)o+=emojiRender(b,a,!0);b=d;a=l}if(b)o+=emojiRender(b,a,!0);return o},
	emojiRender = function(a,b){return(isEnabled(4)?emojiImageTemplateProxy:emojiImageTemplate).replace("{code}", a).replace("{size}", is2x()?"_2x":"").replace("{symbol}",b)};

String.prototype.emoji = function() {
	return emojiNeedReplace ? this.replace(emojiRegExp, emojiHandler).replace(/\uFE0F/g, '') : this;
};

//String.prototype.toNormal=function(){try{return this.replace(/\s*((,|;|\!|\?)+)(\s*|$)/igm,"$1 ").replace(/(.|^)(\s*)-(\s*)([^$\s\t,;\?\"\'\!\?\.]*)/igm,function(a,b,c,d,e){return~["то","нибудь","ха"].indexOf(e)||e[0]!=="-"||!isNaN(b) &&!isNaN(e)||e[0].toUpperCase()===e[0]?b+"-"+e:b+" - "+e}).replace(/\s*(\((?!\()|\)(?!\)))\s*/igm,function(a){return"("===a?" (":") "}).toString()}catch(e){return this.toString()}};
// просто заменять "--" на длинное тире ВК, и затем  производить замену. напомню проблему: "текст -- текст" -> "текст-- текст"

String.prototype.toNormal=function() { return this.toString(); };

/**
 * Request to APIdog API
 * @param {string} method
 * @param {object} params
 * @returns {Promise}
 * @constructor
 */
function APIdogRequest(method, params) {
	params = params || {};
	params.authKey = API.authKey;

	return new Promise(function(resolve, reject) {
		var xhr = new XMLHttpRequest(),
			postFields = Object.toQueryString(params);

		xhr.open("POST", "api-v3.php?method=" + method, true);

		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		xhr.onreadystatechange = function() {
			if (xhr.DONE === xhr.readyState) {
				if (xhr.status === 200) {
					try {
						var json = JSON.parse(xhr.responseText);

						if (!("result" in json) || json.error) {
							reject({data: json.error, reason: APIdogRequest.FAILED_CAUSE_HANDLE});
							return;
						}

						resolve(json.result);
					} catch (exc) {
						reject({data: null, reason: APIdogRequest.FAILED_CAUSE_SERVER_JSON});
					}
				} else {
					reject({data: null, reason: APIdogRequest.FAILED_CAUSE_SERVER_5xx});
				}
			}
		};
		xhr.send(postFields);
	});
}

APIdogRequest.FAILED_CAUSE_SERVER_5xx = 0xDEAD;
APIdogRequest.FAILED_CAUSE_SERVER_JSON = 0xBADF00D;
APIdogRequest.FAILED_CAUSE_HANDLE = 0xC001;




/* Events */



function initStatLiveInternet() {
	new Image().src="\/\/counter.yadro.ru\/hit?r"+escape(document.referrer)+((typeof(screen)==="undefined")?"":";s"+screen.width+"*"+screen.height+"*"+(screen.colorDepth?screen.colorDepth:screen.pixelDepth))+";u"+escape(document.URL)+";"+Math.random();
}

function initStatYandexMetrika() {
	(function (d,w,c){(w[c]=w[c]||[]).push(function(){try{w.yaCounter19029880=new Ya.Metrika({id:19029880,trackHash:!0})}catch(e){}});var n=d.getElementsByTagName("script")[0],s=d.createElement("script"),f=function(){n.parentNode.insertBefore(s,n);};s.type="text/javascript";s.async=!0;s.src="https://d31j93rd8oukbv.cloudfront.net/metrika/watch_ua.js";if(w.opera==="[object Opera]")d.addEventListener("DOMContentLoaded",f,!1);else f()})(document,window,"yandex_metrika_callbacks");
}

function initStatGoogleAnalytics() {
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;a.onload=function(){ga('create', 'UA-73434682-1', {'sampleRate': 5});ga('send', 'pageview');};m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
}

function initAdMarketGid() {
	var D=new Date(),d=document,b='body',ce='createElement',ac='appendChild',st='style',ds='display',n='none',gi='getElementById'; var i=d[ce]('iframe');i[st][ds]=n;d[gi]("MarketGidScriptRootC592365")[ac](i);var iw,c;try{iw=i.contentWindow.document;iw.open();iw.writeln("<ht"+"ml><bo"+"dy></bo"+"dy></ht"+"ml>");iw.close();c=iw[b];} catch(e){iw=d;c=d[gi]("MarketGidScriptRootC592365");}var dv=iw[ce]('div');dv.id="MG_ID";dv[st][ds]=n;dv.innerHTML=592365;c[ac](dv); var s=iw[ce]('script');s.async='async';s.defer='defer';s.charset='utf-8';s.src="//jsc.marketgid.com/a/p/apidog.ru.592365.js?t="+D.getYear()+D.getMonth()+D.getDate()+D.getHours();c[ac](s);
}

function initAdOur() {
	(function(a,b,c,f,g){
		if (!c) {
			return;
		}
		var d=function(e){
			return b("a",{
				style:"text-align:center;display:block;padding:6px 0;",
				target:"_blank",
				href:"/"+e.adLink.split("/")[3],
				append:[
					b("p",{
						append:b("strong",{html:e.title})
					}),
					b("img",{
						src:e.adImage,
						alt:e.title,
						style:"max-width:125px;display:block;margin:8px auto;"+([0,"","max-height: 105px;"][e.type])
					}),
					e.type===2
						?b("div",{style:"padding-bottom:8px;",html:e.description})
						:null,
					b("div",{style:"display:inline-block;margin:0 auto;cursor:pointer!important;",html:"Перейти"})
				]
			})
		};
		g=b("div");
		while(f<a.length)
			g.appendChild(d(a[f++]));
		for(f=0,a=random(1,4);f<a;++f)
			c.appendChild(b("div"));
		c.appendChild(g);
		for(f=0,a=random(1,4);f<a;++f)
			c.appendChild(b("div"));
	})(API.ad.menu,$.e,$.element("_menu"),0);
}
var Menu = {

	CLASS_OPENED: "menu-opened",

	toggle: function() {
		$.elements.toggleClass(document.documentElement, Menu.CLASS_OPENED);
	},

	hide: function() {
		$.elements.removeClass(document.documentElement, Menu.CLASS_OPENED);
	},

	// TODO: переписать на Hammer.js
	initTouchEvents: function () {
		if (typeof window.touchbodymoved !== "undefined")
			return;
		window.touchstartX = 0;
		window.touchstartY = 0;
		window.touchendX = 0;
		window.touchendY = 0;
		window.touched = [];
		window.touchbodymoved = false;
		var zone = getBody(),
			evalDirection = function (a, b, c, d, e) {
				e = (a < b ? 1 : (a > b ? 2 : 0)) + (c < d ? 4 : (c > d ? 8 : 0));
				return [e, [((e & 1) || (e & 2) ? a - b : 0), ((e & 4 || e & 8) ? c - d : 0)]];
			},
			getTouches = function (event){
				return (event.touches[0] || event.changedTouches[0]);
			},
			block = function(event) {
				event.preventDefault();
			};
		$.event.add(zone, "touchstart", function(event) {
			//$.elements.removeClass(zone, "animation");
			var e = getTouches(event);
			window.touchstartX = e.pageX;
			window.touchstartY = e.pageY;
		});
		$.event.add(zone, "touchmove", function(event) {
		});
		$.event.add(zone, "touchend", function (event) {
			var e = getTouches(event);
			window.touchendX = e.pageX;
			window.touchendY = e.pageY;
			window.touchbodymoved = false;
			var result = evalDirection(window.touchendX, window.touchstartX, window.touchendY, window.touchstartY, 0);
			if (Math.abs(result[1][0]) > 60 && Math.abs(result[1][1]) < 40) {
				if (result[0] & 2)
					$.elements.addClass(document.documentElement, Menu.CLASS_OPENED);
				if (result[0] & 1)
					$.elements.removeClass(document.documentElement, Menu.CLASS_OPENED);
			}
		});
	},
	toTopPositionYStarted: 0,
	toTopPositionOnePart: 0,
	toTop: function (q, start) {
		if (start) {
			Menu.toTopPositionYStarted = Site.getScrolled();
		}

		var part = Menu.toTopPositionYStarted / 100,
			scrolled = Site.getScrolled(),
			started = Menu.toTopPositionYStarted,
			animate = function (opts) {
				var start = new Date,
					timer = setInterval(function () {
						var progress = (new Date - start) / opts.duration;

						if (progress > 1) {
							progress = 1;
						}

						opts.step(opts.delta(progress));

						if (progress >= 1) {
							clearInterval(timer);
						}
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
	toTopScrollEvent: function (event) {
		if (Site.getScrolled() > window.CONST_MENU_HEIGHT) {
			$.elements.removeClass(g("_menu_up"), "hidden");
		} else {
			$.elements.addClass(g("_menu_up"), "hidden");
		}
	}
};
window.KeyboardCodes={left:37,right:39,up:38,down:40,"delete":8,tab:9,enter:13,esc:27,pageUp:33,pageDown:34,space:32,mediaPrevious:177,mediaNext:176,mediaStop:178,mediaChangeState:179,F1:112,F2:113,F3:114,F4:115,F5:116,F6:117,F7:118,F8:119,F9:120,F10:121,F11:122,F12:123};
function loadStickers() {
	api("store.getProducts", {merchant: "google", filters: "purchased,active,promoted", type: "stickers", v: 5.14, extended: 1}).then(function(data) {
		data = data.items.filter(function(d) {
			return !d.promoted;
		});

		IM.saveStickers(data);
	});
}

function cancelEvent(e) {
	e = e || window.event;
	if (!e) {
		return !1;
	}
	e = e.originalEvent || e;
	e.preventDefault && e.preventDefault();
	e.stopPropagation && e.stopPropagation();
	e.cancelBubble = !0;
	return e.returnValue = !1;
}

window.onResizeCallback;
window.onKeyDownCallback;
window.onLeavePage;
window.onScrollCallback;
window.onLikedItem;
window.vkLastCheckNotifications = getUnixTime();
window.isMobile = /(mobile?|android|ios|bada|j2me|wp|phone)/ig.test(navigator.userAgent.toLowerCase());


var Local = {

	/** @var {Object} data */
	data: {},

	/**
	 * Add data about profiles and groups
	 * @param {Object[]} users
	 * @returns {Object}
	 */
	add: function (users) {
		if (!users) {
			return Local.data;
		}

		if (!Array.isArray(users)) {
			users = [users];
		}


		for (var i = 0, id, j, l; j = users[i]; ++i) {

			id = [(j.uid || j.id), -(j.gid || j.id)][j.type && j.type !== "profile" ? 1 : 0];

			if (!Local.data[id]) {
				Local.data[id] = {};
			}

			l = Local.data[id];

			if (!l.screen_name && !j.screen_name) {
				l.screen_name = (id > 0 ? "id" + id : "club" + (-id));
			}

			Object.merge(l, j);

		}
		return Local.data; // updated 23/09/2014 (v6.3.3.0.1)
	}

};

window.vkLastCheckNotifications = null;

function requestCounters() {
	api("execute", {
		code: "if(Args.il==\"1\"){API.account.setOnline({voip:0});};return{c:API.account.getCounters(),f:API.friends.getOnline({v:5.8,online_mobile:1}),n:API.notifications.get({start_time:Args.st,count:5})};",
		st: vkLastCheckNotifications,
		il: isEnabled(1) ? 1 : 0
	}).then(function(data) {
		window.vkLastCheckNotifications = getUnixTime();

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
		}

		Friends.friends[API.userId].items = friends;

		// TODO
		/*ThemeManager._cb.onintrvaleddatarecieved && ThemeManager._cb.onintrvaleddatarecieved(ThemeManager.getBundle(), {
			counters: data.c,
			friendsOnline: data.f
		});*/
	});
}

function getSelectNumbersInRange(options, min, max, value, step) {
	step = step || 1;
	var select = $.e("select", {name: options.name, onchange: options.onchange || null}), attrs;
	for (var x = min; x <= max; x += step) {
		attrs = {value: x, html: options.labels ? options.labels[x] : x};
		//noinspection EqualityComparisonWithCoercionJS
		if (value == x) {
			attrs.selected = true;
		}
		select.appendChild($.e("option", attrs));
	}
	return select;
}

function createInputDate(options, date) {
	options = options || {};
	var e = $.e,
		wrap,
		u = new Date(date * 1000),
		d, m, y, h, i,
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
				if (over && index === sel) {
					d.selectedIndex = 0;
				}
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
		}, 2017, 2018, u.getFullYear()),

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
}

function getUnixtimeFromCustomInputBundle(d, m, y, h, i) {
	d = new Date(
		y.options[y.selectedIndex].value.trim(),
		m.options[m.selectedIndex].value.trim() - 1,
		d.options[d.selectedIndex].value.trim(),
		h.options[h.selectedIndex].value.trim(),
		i.options[i.selectedIndex].value.trim(),
		0
	);

	return d.toString() === "Invalid Date" ? 0 : parseInt(d.getTime() / 1000);
}

function setSelectedItem(select, value) {
	Array.prototype.forEach.call(select.options, function (item, index) {
		if (item.value === value.toString()) {
			select.selectedIndex = index;
		}
	});
}

function getRadioGroupSelectedValue(radios) {
	var result = null;
	if (!radios.length) return radios.value;
	Array.prototype.forEach.call(radios, function(i) {
		if (i.checked) result = i.value;
	});
	return result;
}

function extendObject(target, data) {
	target = target || {};
	data = data || {};
	Object.keys(data).forEach(function(key) {
		if (!target[key]) {
			target[key] = data[key];
		}
	});
	return target;
}

var truncateDefaultOptions = {
	length: 300,
	minTrail: 20,
	moreText: "Показать полностью"
};

function truncate(text, options) {
	text = String(text);
	options = extendObject(options, truncateDefaultOptions);

	var isOver = text.length > options.length + options.minTrail,
		indexSplit = isOver ? text.indexOf(" ", options.length) : text.length,
		textSmall = text.substring(0, indexSplit),
		textRemaining = text.substring(indexSplit),

		nodeSmall = $.e("span", {
			html: Site.toHTML(textSmall).emoji()
		}),
		nodeEllipsis = $.e("span", {
			html: "… "
		}),
		nodeRemaining = $.e("span", {
			"class": "hidden",
			html: Site.toHTML(textRemaining).emoji()
		}),
		nodeButton = $.e("a", {
			"class": "b",
			html: options.moreText,
			href: "#",
			onclick: function(event) {
				$.elements.removeClass(nodeRemaining, "hidden");
				$.elements.remove(nodeEllipsis);
				$.elements.remove(nodeButton);
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
}

setInterval(function() {
	Array.prototype.forEach.call(document.querySelectorAll("[data-time]"), function(i) {
		i.textContent = getDate(+i.dataset.time, APIDOG_DATE_FORMAT_SMART);
	});
}, 5000);

function parseToIDObject(data) {
	var o = {};
	(data || []).forEach(function (i) {
		o[i.id] = i;
	});
	return o;
}


var DAY = 24 * 60 * 60 * 1000;


function getUploadParams(getServerMethod, file) {
	return {
		"photos.getUploadServer": {param: "file1", name: "p.jpg", method: "photos.save"},
		"photos.getWallUploadServer": {param: "photo", name: "p.jpg", method: "photos.saveWallPhoto"},
		"photos.getChatUploadServer": {param: "photo", name: "p.jpg", method: "messages.setChatPhoto"},
		"photos.getMessagesUploadServer": {param: "photo", name: "p.jpg", method: "photos.saveMessagesPhoto"},
		"photos.getOwnerPhotoUploadServer": {param: "photo", name: "p.jpg", method: "photos.saveOwnerPhoto"},
		"video.save": {param: "file", name: "v.mp4"},
		"audio.getUploadServer": {param: "file", name: "a.mp3", method: "audio.save"},
		"docs.getUploadServer": {param: "file", name: file.name, method: "docs.save"},
		"docs.getWallUploadServer": {param: "file", name: file.name, method: "docs.save"},
		"chronicle.getUploadServer": {param: "photo", name: "p.jpg", method: "chronicle.save"}
	}[getServerMethod];
}
var uploadId = 0;

// created 10.01.2016
// need refactoring
function uploadFiles(node, o, callbacks) {

	o = o || {};
	var upload,
		index = 0,

		files = node instanceof HTMLElement ? node.files : node,
		title,
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
			}
			callbacks && callbacks.onUploading && callbacks.onUploading(event);
		},

		result = [],
		finish = function (file) {
			result.push(file.result);
			callbacks && callbacks.onFileUploaded && callbacks.onFileUploaded(file.result);
			next();
		},

		next = function () {
			files[++index] ? doTask(index) : endTask();
		},

		handleError = function() {
			var f = files[index];
			Site.Alert({text: "upload file &laquo;" + f.name.safe() + "&raquo; failure"});
			callbacks && callbacks.onError && callbacks.onError(f);
			next();
		},

		endTask = function () {
			modal.close();
			//modal = null;

			callbacks && callbacks.onTaskFinished && callbacks.onTaskFinished(result);
		},

		doTask = function (index) {
			var f = files[index], uploadId = ++window.uploadId;
			if (false && !isEnabled(Setting.USING_PROXY) && API.isExtension && API.extension && API.extension.versionSDK >= 2.1) {


				//sendEvent("onFileUploadRequest", {source: "clipboard"});
				var fr = new FileReader(),
					dm = getUploadParams(o.method, f),
					ev = {
						source: "file",
						getServerMethod: o.method,
						getServerParams: o.params || {},
						paramName: dm.param,
						field: "photo", // TODO: there hardcode
						fileName: f.name,
						saveMethod: dm.method,
						uploadId: uploadId,
						accessToken: API.accessToken
					};

				fr.onloadend = function(event) {
					if (event.target.readyState !== FileReader.DONE) {
						return;
					}

					ev.file = event.target.result;

					console.log(ev);
					sendEvent("onFileUploadRequest", ev, function(event) {
						console.log(event);
					});

				};
				fr.readAsDataURL(f);



			} else {
				if (f.size > 26214400) { // 25MB
					Site.Alert({text: "file &laquo;" + f.name + "&raquo; was passed because size more than 25MB"});
					return next();
				}
				upload = new VKUpload(f)
					.onUploading(updateUI)
					.onUploaded(finish)
					.onError(handleError)
					.upload(o.method, o.params || {}, {node: node});
			}

			title = "Загрузка (" + (index + 1) + "/" + files.length + ")";
			if (!modal) {
				modal = new Modal({
					title: title,
					content: $.e("div", {append: [
						status,
						progressbar.getNode()
					]}),
					unclosableByBlock: true,
					width: 270
				}).show();
			} else {
				modal.setTitle(title);
			}

		};
	files = Array.prototype.slice.call(files, 0, o.maxFiles || 10);
	doTask(index);
}



/**
 * Tab host
 * Created 10.01.2016
 */
function TabHost (items, callbacks) {
	this.items = items;
	this.callbacks = callbacks || {};

	this._init();
}

TabHost.prototype = {
	_init: function() {
		var s = this;
		this.tabs = this.items.map(function(i) {
			return i instanceof Tab ? i : new Tab(s, i);
		});
	},

	tabs: null,

	setTab: function(selected) {
		if (!isNaN(selected)) {
			selected = this.tabs[selected];
		}

		if (typeof selected === "string") {
			selected = this.findTabByName(selected);
		}

		var old = this.getSelectedTab();

		if (old) {
			old.hide();
			old.leave();
		}

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
			}
		});
		return found;
	},

	findTabByName: function(name) {
		var found = null;
		this.tabs.forEach(function(tab) {
			if (tab.name === name) {
				found = tab;
			}
		});
		return found;
	},

	//getTab: function() {},

	node: null,

	nodeTabs: null,
	nodeContents: null,

	getNode: function() {
		if (this.node) {
			return this.node;
		}

		var e = $.e,
			wrap = e("div", {"class": "vktab-wrap"}),
			tabs = e("div", {"class": "vktab-tabs"}),
			contents = e("div", {"class": "vktab-contents"});

		this.tabs.forEach(function(item) {
			tabs.appendChild(item.title);
			contents.appendChild(item.content);
		});

		this.setTab(0);

		wrap.appendChild(tabs);
		wrap.appendChild(contents);

		return this.node = wrap;
	}
};

/**
 * Item tab
 * Created 10.01.2016
 */

function Tab(host, o) {
	var that = this,
		click = function() {
			host.setTab(that);
		};
	this.name = o.name;
	this.title = $.e("div", {"class": "vktab-tab", html: o.title, onclick: click});
	this.content = $.e("div", {"class": "vktab-content", append: o.content});
	this.onOpen = o.onOpen;
	this.onLeave = o.onLeave;
}

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
 * Выпадающее меню
 * @param {string} label   Название меню, то, на что кликают
 * @param {object} actions Элементы меню в формате, описанном ниже
 * @param {object=} options Опции
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
		label = Lang.get("general.actions");
	}

	options = options || {};

	this.mLabel = label;
	this.mActions = actions;
	this.mOptions = options;
	this.mItemsNodes = {};

	this.init();
	this.update();
}

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
			this.mNodeTitle = $.e("div", {"class": "xdd-title", html: this.mLabel, onclick: function() {
				self.toggle();
			}}),
			this.mNodeList = $.e("div", {"class": "xdd-items"})
		], onclick: function(event) { event.stopPropagation(); event.cancelBubble = true; }});

		if (this.mOptions.toTop) {
			$.elements.addClass(this.mNodeWrap, "xdd-toTop");
		}

		this.mNodeList.xdd = this;

		return this;
	},

	isOpened: function() {
		return $.elements.hasClass(this.mNodeList, DropDownMenu.CLASS_OPENED);
	},

	open: function() {
		DropDownMenu.closeAllDropdown()
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
			if (!this.mActions.hasOwnProperty(label)) {
				continue;
			}
			item = this.mActions[label];

//			if (!this.mItemsNodes[label]) {
			this.mItemsNodes[label] = this._createItem(item, label);
//			};

			this.mNodeList.appendChild(this.mItemsNodes[label]);
		}
	},

	add: function(label, options) {
		this.mActions[label] = options;
		this.update();
		return this;
	},

	set: function(label, options) {
		if (!this.mActions[label]) {
			return this;
		}

		for (var key in options) {
			if (options.hasOwnProperty(key)) {
				this.mActions[label][key] = options[key];
			}
		}

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
				$.elements.removeClass(s.mItemsNodes[label], DropDownMenu.CLASS_ITEM_DISABLED);
				return f;
			},

			disable: function() {
				s.set(label, { isDisabled: true });
				$.elements.addClass(s.mItemsNodes[label], DropDownMenu.CLASS_ITEM_DISABLED);
				return f;
			},

			label: function(text) {
				s.set(label, { label: text });
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
		return $.e("div", {
			"class": [
				"xdd-item",
				i.isDisabled ? DropDownMenu.CLASS_ITEM_DISABLED : "",
				i.isHidden ? "hidden" : ""
			].join(" "),
			"data-label": key,
			html: i.label,
			onclick: function(event) {
				event.stopPropagation();
				event.cancelBubble = true;

				if (i.isDisabled) {
					return;
				}

				self.close();
				i.onclick(self.get(key), this);
			}
		})
	},

	/**
	 * Returns original root node
	 * @returns {HTMLElement}
	 */
	getNode: function() {
		return this.mNodeWrap;
	}
};

DropDownMenu.CLASS_OPENED = "xdd-opened";
DropDownMenu.CLASS_ITEM_DISABLED = "xdd-item-disabled";

DropDownMenu.closeAllDropdown = function(event) {
	var opened = document.querySelectorAll("." + DropDownMenu.CLASS_OPENED),
		clicked = event && event.target;

	Array.prototype.forEach.call(opened, function(item) {
		var init = item.parentNode, depth = 0;

		do {
			if (clicked && clicked === init) {
				return;
			}
		} while ((clicked && (clicked = clicked.parentNode) || true) && depth++ < 4);
		item && item.xdd && item.xdd.close();
	});
};

// back compatible
function DDMconvert2new(a,b,c,d){b={};c=0;for(d in a){if(a.hasOwnProperty(d))b["i"+c++]={label:d,onclick:a[d]}}return b}

getBody().addEventListener("click", DropDownMenu.closeAllDropdown);



/**
 * Notifications as in Android 5.0+
 * @param {{duration: int=, onClick: function=, onClose: function=, text: string}} options
 * @constructor
 */
function Snackbar(options) {
	this._init(options);
	this.setOptions(options);
}

Snackbar.CLASS_HIDDEN_ACTION = "hidden";
Snackbar.CLASS_FADE_OUT = "snackbar-fadeout";

Snackbar.prototype = {

	/**
	 * Initialization
	 * @param {{duration: int, onClick: function, onClose: function}} options
	 * @private
	 */
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
		}

		if (this._onClick) {
			this.nodeWrap.addEventListener("click", function() {
				self._onClick(self);
			});
		}
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
		}
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

	setDuration: function(duration) {
		this._duration = duration;

		if (this._id) {
			clearTimeout(this._duration);
			this._id = setTimeout(function() {
				self.close();
			}, this._duration);
		}

		return this;
	},

	show: function() {
		var self = this;
		this._id = setTimeout(function() {
			self.close();
		}, this._duration);
		getBody().appendChild(this.nodeWrap);
		return this;
	},

	close: function() {
		clearTimeout(this._id);
		$.elements.addClass(this.nodeWrap, Snackbar.CLASS_FADE_OUT);
		var self = this;
		setTimeout(function() {
			$.elements.remove(self.nodeWrap);
		}, 500);
		return this;
	},

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
}

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

};

function makeMagicTextarea(node) {
	if (!makeMagicTextarea.node) {
		getBody().appendChild(makeMagicTextarea.node = $.e("div", {style: "position:absolute;top:-9999px;left:-99999px;z-index:-99999;opacity:0;word-wrap:break-word;white-space:pre;font-size:12px;line-height:15px;padding:4px 5px;" }));
	}

	var update = function() {
		makeMagicTextarea.node.innerHTML = node.value.split("\n").join("<br/>");
		node.style.height = (makeMagicTextarea.node.offsetHeight + 8).toRange(50, 200) + "px";
	};

	node.addEventListener("keydown", function() {
		makeMagicTextarea.node.style.width = (node.offsetWidth - 10) + "px";
	});

	node.addEventListener("keyup", update);

	node.value.trim() && update();
}

makeMagicTextarea.node = null;

var Pidor = {

	REMEMBER_KEY: "hideTopNotify",

	close: function(hash, auto) {
		var node = $.element("tnf" + _tnfHash);
		if (!node) {
			return;
		}

		if (auto) {
			$.elements.remove(node);
			Pidor.redrawHeadPosition(28);
			return;
		}

		$.localStorage(Pidor.REMEMBER_KEY, hash);
		node.style.height = node.offsetHeight + "px";
		node.classList.add("topNotification-closing");
		setTimeout(Pidor.close.bind(this, hash, true), 1000);
	},

	init: function() {
		if (!window._tnfHash) {
			return;
		}

		if ($.localStorage(Pidor.REMEMBER_KEY) === _tnfHash) {
			Pidor.close(_tnfHash, true);
		}
	},

	redrawHeadPosition: function(top) {
		var heightNotify = 28;
		var g = heightNotify - top;
		$.element("hat").style.top = (heightNotify - Math.min(Math.max(top, 0), heightNotify)) + "px";
	}
};

var Analyzes = {
	open: function (name, ownerId) {
		includeScripts(["/utilites.js"], function() {
			Analyzes.open(name, ownerId);
		});
	}
};

var eelid = 0;
var eels = {};
function sendEvent(method, data, callback) {
	if (callback) {
		if (typeof callback !== "string") {
			var id = "extensionEvent" + ++eelid;
			receiveEvent(id, callback);
		}
		data.callback = callback;
	}

	data.method = method;
	data.OUT = true;
	window.postMessage(JSON.stringify(data), "*");
}

var receivingEvents = {};

function receiveEvent(method, callback) {
	receivingEvents[method] = callback;
}

function handleExtensionEvent(event) {
	try {
		event = typeof event === "string" ? JSON.parse(event) : event;
	} catch (e) {
		console.warn("Unknown content from extension");
		return;
	}
	receivingEvents && receivingEvents[event.method] && receivingEvents[event.method](event);
}

receiveEvent("onAccessTokenRequire", function (event) {
	if ((API.bitmask & 4))
		return;
	LongPoll._ext = true;
	LongPoll.enabled = false;
	LongPoll.start = function () {};
	LongPoll.abort();
	console.info("Extension: token is required");
	onExtensionInited(event && event.version || 1.2, event && event.agent);
	sendEvent(event.callback, {
		useraccesstoken: API.accessToken,
		userAgent: API.vkShitUserAgent,
		settings: API.bitmask
	});
});

receiveEvent("onLongPollDataReceived", function (event) {
	try {
		var json = typeof event.updates === "string" ? JSON.parse(event.updates) : event.updates;
		LongPoll.getResult({updates: json}, null, true);
	} catch (e) {
		console.error("APIdogExtensionReceiveError<EmptyResponse>");
	}
});

receiveEvent("onAPIRequestExecuted", function (data) {
	api.fx.sRequests[data.requestId](data.requestResult);
});

window.addEventListener("message", function (event) {
	if (event.source !== window)
		return;
	console.log("DOG", event.data);
	handleExtensionEvent(event.data);
});


function onExtensionInited (v, a) {
	API.isExtension = true;
	API.extension = {
		versionSDK: v,
		agentSDK: a
	};
	$.elements.remove($.element("_link_ext"));
	$.elements.remove($.element("_notify_ext"));
}

var APIdogAPIErrorCodes = {
	UNKNOWN_METHOD: 1,
	INVALID_PARAM: 2,
	INTERNAL_DATABASE_ERROR: 3,
	AUTHORIZE_HAS_ERROR: 5,
	AUTHORIZE_TOKEN_EMPTY: 6,
	AUTHORIZE_HAS_ERROR_WHILE_CHECK: 7,
	AUTHORIZE_HAS_ERROR_INVALID_CLIENT: 8,
	AUTHORIZE_HAS_ERROR_CAPTCHA: 9,
	AUTHORIZE_HAS_ERROR_2FA: 10,
	AUTHORIZE_HAS_ERROR_INVALID_APPLICATION: 11,
	AUTH_KEY_INVALID: 15,
	VK_UPLOAD_NO_FILE: 19,
	VK_UPLOAD_INVALID_TARGET: 20,
	VK_UPLOAD_INVALID_METHOD: 21,
	VK_UPLOAD_FILE_TOO_LARGE: 22,
	VK_UPLOAD_GET_SERVER_FAILURE: 23,
	VK_UPLOAD_FILE_SENT_FAILURE: 24,
	VK_UPLOAD_SAVE_FAILED: 25,
	VK_UPLOAD_FILE_NOT_EXIST: 26,
	VK_UPLOAD_LINK_INCORRECT: 27,
	VK_UPLOAD_LINK_BROKEN_CODE: 28,
	VK_UPLOAD_LINK_BROKEN_ERROR: 29,
	VK_UPLOAD_INTERNAL_ERROR: 30,
	VK_AUDIO_BITRATE_COULD_NOT_GET_AUDIO: 40,
	VK_AUDIO_BITRATE_SOCKET_ERROR: 41,
	VK_AUDIO_BITRATE_NOT_CONTENT_SIZE: 42
};

function defaultAPIdogAPIErrorHandler(error) {

}