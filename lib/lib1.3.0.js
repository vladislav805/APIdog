/**
 * +-----------------------------------------------+
 * | Vladislav Veluga (c) 2009-2014                |
 * | http://vlad805.ru/                            |
 * | http://apidog.ru/                             |
 * +-----------------------------------------------+
 * | Library v1.3.0 / 17 july 2014                 |
 * |         v1.3.1 / 13 january 2016 (compatable) |
 * |         v1.3.2 / 8 august 2016 (compatable)   |
 * +-----------------------------------------------+
 */

window.$ = {
	ajax: {
		init: function () {
			var request = new XMLHttpRequest();

			if (!request)
				try {
					request = new ActiveXObject("Msxml2.XMLHTTP");
				} catch (e) {
					try {
						request = new ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) {
						req = false;
					}
				};
			return request;
		},

		get: function (opts) {
			var req = $.ajax.init();
			req.open("GET", opts.url, true);
			req.onreadystatechange=function(){
				if (this.readyState === 4) {
					if (this.status === 200){
						if (opts.callback)
							opts.callback(opts.json ? $.JSON(this.responseText) : this.responseText, this);
					} else {
						if (opts.fallback)
							opts.fallback(this.responseText, this);
					}
				}
			}
			req.send(null);
			return req;
		},

		// created 13.01.2016
		queryBuilder: function (p) {
			var params = [], key;
			for (key in p)
				params.push(encodeURIComponent(key) + "=" + encodeURIComponent(p[key]));
			return params.join("&");
		},

		post: function (opts) {
			opts = opts || {};
			params = opts.params ? $.ajax.queryBuilder(opts.params) : "";
			var req = $.ajax.init();
			req.open("POST", opts.url, true);
			req.onreadystatechange = function(){
				if (this.readyState === 4 && this.status == 200)
					opts.callback && opts.callback(opts.json ? $.JSON(this.responseText) : this.responseText, this);
			};
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			req.send(params);
		}
	},

	elem: function (selector) {
		return document.querySelectorAll(selector);
	},

	element: function (id) {
		return typeof id === "string" ? document.getElementById(id) : id;
	},

	isArray: function (object) {
		return Object.prototype.toString.call(object) === "[object Array]";
	},

	isObject: function (object) {
		return Object.prototype.toString.call(object) === "[object Object]";
	},

	// created 13.01.2016
	each: function (data, callback) {
		if (!data) {
			return;
		};

		if (data.length) {
			Array.prototype.forEach.call(data, function (item, index) {
				callback(item, index);
			});
		} else {
			for (var key in data) {
				if (!data.hasOwnProperty(key)) {
					continue;
				};
				callback(data[key], key);
			};
		};
	},

	elements: {

		// refactored 13.01.2016
		create: function (tagName, attr) {
			var node = document.createElement(tagName), key, value;
			for (key in attr) {
				value = attr[key];
				if (key.indexOf("on") === 0 && typeof value === "function") {
					$.event.add(node, key.substring(2), value);
				} else {
					switch (key) {
						case "innerHTML":
						case "html":
							node.innerHTML = value;
							break;

						case "append":
							if (!$.isArray(value))
								value = [value];
							if (value == [])
								continue;

							$.each(value, function (item, index) {
								if (!item) return;
								node.appendChild(item);
							});
							break;

						default:
							node.setAttribute(key, value);
					};
				};
			};
			return node;
		},

		remove: function (elem) {
			if (!elem) {
				return;
			};

			elem.remove ? elem.remove() : elem.parentNode.removeChild(elem);
		},

		append: function (elem, nodes) {
			for (var i = 0, l = nodes.length; i < l; ++i)
				if (nodes[i])
					elem.appendChild(nodes[i]);
			return elem;
		},

		appendToBody: function (elem) {
			return document.getElementsByTagName("body")[0].appendChild(elem);
		},

		getStyle:function (elem) {
			return (typeof window.getComputedStyle !== "undefined" ? getComputedStyle(elem) : elem.currentStyle);
		},

		getPosition: function (elem) {
			if (!elem)
				return {};
			var width = elem.offsetWidth,
				height = elem.offsetHeight,
				w = elem.clientWidth,
				h = elem.clientHeight,
				left = 0,
				top = 0;

			while (elem) {
				left += elem.offsetLeft;
				top += elem.offsetTop;
				elem = elem.offsetParent;
			};

			return {
				top: top,
				left: left,
				width: width,
				height: height,
				clientWidth: w,
				clientHeight: h
			};
		},

		// refactored 13.01.2016
		addClass: function (elem, className) {
			if (!elem) {
				return;
			};

			var modern = !!elem.classList;

			if ($.isArray(elem)) {
				for (var i = 0, l = elem.length; i < l; ++i) {
					$.elements.addClass(elem[i], className);
				};
			} else {
				if (modern) {
					elem.classList.add(className);
					return elem;
				};

				if ($.elements.hasClass(elem, className)) {
					return;
				} else {
					elem.className = $.trim((elem.className + " " + className).replace(/\s+/g," "));
				};
			};
			return elem;
		},

		// refactored 13.01.2016
		removeClass: function (elem, className) {
			if (!elem) {
				return;
			};

			if ($.isArray(elem)) {
				for (var i = 0, l = elem.length; i < l; ++i) {
					$.elements.removeClass(elem[i], className);
				};
			} else {
				if (elem.classList) {
					elem.classList.remove(className);
				} else {
					elem.className = $.trim(elem.className.replace(new RegExp("(^|\\s)" + className + "(\\s|$)", "g"), "$1").replace(/\s+/g," "));
				};
			};
			return elem;
		},

		// refactored 13.01.2016
		hasClass: function (elem, className) {
			if (!elem) {
				return;
			};

			if (elem.classList && elem.classList.contains) {
				return elem.classList.contains(className);
			};

			return $.inArray(className, elem.className.split(" "));
		},

		triggerClass: function (a, b) {
			return $.elements.toggleClass(a, b);
		},

		toggleClass: function (elem, className) {
			if (!elem) {
				return;
			};

			if (!$.isArray(elem)) {
				elem = [elem];
			};

			for (var i = 0, l = elem.length, k; i < l; ++i) {
				k = elem[i];
				if (k.classList && k.classList.toggle) {
					k.classList.toggle(className);
				} else {
					if ($.elements.hasClass(k, className)) {
						$.elements.removeClass(k, className)
					} else {
						$.elements.addClass(k, className)
					};
				};
			};

			return elem;
		},

		clearChild: function (node) {
			var nodes = node.children;
			for (var i = nodes.length - 1; i >= 0; --i)
				node.removeChild(nodes[i]);
			return node;
		}
	},

	// 13.01.2016 refactored
	// 12.03.2016 fixed triming all \n in webkit
	trim: function (text) {
		return String.prototype.trim ? text.trim() : text.replace(/^\s+|\s+$/igm, "");
	},

	cookie: function (name, value, days) {
		var set = function (name, value, days) {
			var exdate = new Date();
			exdate.setDate(exdate.getDate() + days);
			value = escape(value) + ((exdate == null) ? "" : "; expires=" + exdate.toUTCString());
			document.cookie = name + "=" + value;
			return true;
		};

		// getter
		if (value === undefined && days === undefined) {
			var cookies = document.cookie.split("; "),
				item = function (str) {
					var firstEqual = str.indexOf("="),
						name = str.slice(0, firstEqual),
						value = str.slice(firstEqual + 1);
					return {name: name, value: value};
				}, t, data = {};
			for (var i = 0, l = cookies.length; i < l; ++i) {
				t = item(cookies[i]);
				data[t.name] = t.value;
			};
			return name ? data[name] : data;
		};

		// remover
		if (name && (value == null || days <= 0)) {
			set(name, "", -30);
			return true;
		}

		// setter
		return set(name, value, days || 30);
	},

	localStorage: function (name, value) {
		var isSupport = function () { return ("localStorage" in window) && (window.localStorage !== null) };
		if (!isSupport() || !name)
			return false;
		var ls = window.localStorage;
		if (value === undefined) {
			try {
				return ls.getItem(name);
			} catch (e) {
				return null;
			}
		} else {
			if (value === null) {
				try {
					ls.removeItem(name);
					return true;
				} catch (e) {
					return false;
				}
			} else {
				try {
					ls.setItem(name, value);
					return true;
				} catch (e) {
					return false;
				}
			};
		};
	},

	event: {

		// refactored 13.01.2016
		add: function (node, event, callback){
			if (window.addEventListener) {
				node.addEventListener(event, callback);
			} else if (node.attachEvent) {
				node.attachEvent("on" + event, callback);
			} else {
				node["on" + event] = callback;
			};
		},

		// refactored 13.01.2016
		remove: function (node, event, callback) {
			if (node.removeEventListener) {
				node.removeEventListener(event, callback);
			} else if (node.detachEvent) {
				node.detachEvent("on" + event, callback);
			} else {
				node["on" + event] = null;
			};
		},

		cancel: function (e) {
			e = e || window.event;

			if (!e) {
				return false;
			};

			e = e.originalEvent || e;
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
			e.cancelBubble = true;
			return e.returnValue = false;
		}
	},

	JSON: function (string) {
		if (JSON && JSON.parse) {
			return JSON.parse(string);
		};

		try {
			return eval("(" + string + ")");
		} catch (e) {
			return {};
		};
	},

	JSONString: function (object) {
		if (JSON && JSON.stringify)
			return JSON.stringify(object);
		else
			return null; // TODO: сделать рекурсивную функцию
	},

	getDate:function(timestamp,full){
		var stamp = new Date(timestamp * 1000),
			now = new Date(),
			target = [stamp.getFullYear(), stamp.getMonth(), stamp.getDate(), stamp.getHours(), stamp.getMinutes(), stamp.getSeconds()],
			current = [now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()],
			n = function (n) {return n >= 10 ? n : "0" + n;};
		var text;
		if (target[0] == current[0] && target[1] == current[1]) {
			if(target[2] == current[2]) {
				if (full == 2)
					return target[3] + ":" + n(target[4]);
				text = "сегодня ";
			} else
				if (target[2] - 1 > 0 && target[1] == current[1] || target[2] - 1 <= 0 && target[1] + 1 == current[1])
					text = "вчера ";
		} else
			text = target[2] + " " + (("января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря".split("|"))[target[1]]) + (target[0] != current[0] ? " " + n(target[0]) : "");
		if (full == 1)
			text += " в " + target[3] + ":" + n(target[4]);
		return text;
	},

	toTime: function (number) {
		var second = Math.floor(number % 60),
			minute = Math.floor(number / 60 % 60),
			hour = Math.floor(number / 60 / 60 % 60),
			n = function (n) {return n >= 10 ? n : "0" + n;};
		return (hour ? hour + ":" : "") + n(minute) + ":" + n(second);
	},

	toData: function (bytes) {
		if (bytes <= 0) {
			return "0 байт";
		};

		var n;
		for (var i = 5; i >= 0; i--) {
			n = Math.round(bytes / Math.pow(1024, i) * 10) / 10;
			if(n >= 1)
				return n + " " + (("байт КБ МБ ГБ ТБ".split(" "))[i]);
		};

		return null;
	},

	textCase: function (number, titles) {
		number = Math.abs(number);
		return titles[((number % 100 > 4 && number % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5])];
	},

	inArray: function (needle, haystack, index) {
		for (var key in haystack)
			if (haystack[key] == needle)
				return index ? key : true;
		return index ? -1 : false;
	},

	php: {
		http_query_build: function (params) {
			var str = [];
			for (current in params)
				str.push(current + "=" + escape(params[current]));
			return str.join("&");
		}
	},

	browser: {
		msie: /msie/ig.test(navigator.userAgent),
		firefox: /firefox/ig.test(navigator.userAgent),
		opera: /opera/ig.test(navigator.userAgent) && !/msie/ig.test(navigator.userAgent),
		chrome: /chrome/ig.test(navigator.userAgent) && !/safari/ig.test(navigator.userAgent),
		safari: /safari/ig.test(navigator.userAgent) && !/chrome/ig.test(navigator.userAgent),
		iphone: /iphone/ig.test(navigator.userAgent),
		mobile: /mobile/ig.test(navigator.userAgent),
	},

	url: {
		get: function (name) {
			var query = window.location.search.replace(/^\?/igm,"").split("&"), current;
			for (var i = 0, l = query.length; i < l; ++i) {
				current = query[i].split("=");
				if (current[0] == name)
					return current.slice(1).join("");
			}
			return null;
		}
	}
};

$.e = $.elements.create;
$.TextCase = $.textCase;
$.php.in_array = $.inArray;
$.getStyle = $.elements.getStyle;
$.getPosition = $.elements.getPosition;
window._libloaded=true;
window.onerror = function (event) { // IE fix
	return false;
};