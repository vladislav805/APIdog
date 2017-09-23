//noinspection JSUnusedLocalSymbols
/**
 * +-----------------------------------------------+
 * | Vladislav Veluga (c) 2009-2014                |
 * | http://vlad805.ru/                            |
 * | http://apidog.ru/                             |
 * +-----------------------------------------------+
 * | Library v1.3.0 / 17 july 2014                 |
 * |         v1.3.1 / 13 january 2016 (compatible) |
 * |         v1.3.2 / 21 july 2017                 |
 * |         v1.3.3 / 01 september 2017            |
 * +-----------------------------------------------+
 */

window.$ = {
	ajax: {
		/**
		 * @deprecated
		 * @returns {XMLHttpRequest}
		 */
		init: function () {
			return  new XMLHttpRequest();
		}
	},

	/**
	 * @param {string} id
	 * @returns {HTMLElement}
	 */
	element: function(id) {
		return typeof id === "string" ? document.getElementById(id) : id;
	},

	elements: {

		/**
		 * refactored 13.01.2016
		 * @param {string} tagName
		 * @param {object=} attr
		 * @returns {HTMLElement}
		 */
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
							if (!Array.isArray(value)) {
								value = [value];
							}

							if (!value.length) {
								continue;
							}

							Array.prototype.forEach.call(value, function(item) {
								if (item) {
									node.appendChild(item);
								}
							});
							break;

						default:
							node.setAttribute(key, value);
					}
				}
			}
			return node;
		},

		/**
		 * @param {Node} elem
		 */
		remove: function(elem) {
			if (!elem) {
				return;
			}

			//noinspection JSUnresolvedVariable,JSUnresolvedFunction
			elem.remove ? elem.remove() : elem.parentNode.removeChild(elem);
		},

		/**
		 * @param {HTMLElement} elem
		 * @param {HTMLElement[]} nodes
		 * @returns {HTMLElement}
		 */
		append: function(elem, nodes) {
			for (var i = 0, l = nodes.length; i < l; ++i) {
				if (nodes[i]) {
					elem.appendChild(nodes[i]);
				}
			}
			return elem;
		},

		/**
		 * @param {HTMLElement} elem
		 * @returns {string}
		 */
		getStyle: function(elem) {
			return typeof window.getComputedStyle !== "undefined" ? getComputedStyle(elem) : elem.currentStyle;
		},

		/**
		 * @param {HTMLElement} elem
		 * @returns {object}
		 */
		getPosition: function(elem) {
			if (!elem) {
				return {};
			}

			var left = 0,
				top = 0,
				tmp = elem;

			while (tmp) {
				left += tmp.offsetLeft;
				top += tmp.offsetTop;
				tmp = tmp.offsetParent;
			}

			return {
				top: top,
				left: left,
				width: elem.offsetWidth,
				height: elem.offsetHeight,
				clientWidth: elem.clientWidth,
				clientHeight: elem.clientHeight
			};
		},

		/**
		 * refactored 13.01.2016
		 * @param {HTMLElement|HTMLElement[]} elem
		 * @param {string} className
		 * @returns {HTMLElement|HTMLElement[]}
		 */
		addClass: function(elem, className) {
			if (!elem) {
				return null;
			}

			if (Array.isArray(elem)) {
				elem.forEach(function(node) {
					$.elements.addClass(node, className);
				});
				return elem;
			}

			if (elem.classList) {
				elem.classList.add(className);
			} else if (!$.elements.hasClass(elem, className)) {
				elem.className = (elem.className + " " + className).replace(/\s+/g, " ").trim();
			}

			return elem;
		},

		/**
		 * refactored 13.01.2016
		 * @param {HTMLElement|HTMLElement[]} elem
		 * @param {string} className
		 * @returns {HTMLElement|HTMLElement[]}
		 */
		removeClass: function(elem, className) {
			if (!elem) {
				return null;
			}

			if (Array.isArray(elem)) {
				elem.forEach(function(node) {
					$.elements.removeClass(node, className);
				});
				return elem;
			}

			if (elem.classList) {
				elem.classList.remove(className);
			} else {
				elem.className = elem.className.split(" ").filter(function(cls) {
					return cls !== className;
				}).join(" ").trim();
			}

			return elem;
		},

		/**
		 * @param {HTMLElement} elem
		 * @param {string} className
		 * @returns {boolean}
		 */
		hasClass: function(elem, className) {
			if (!elem) {
				return false;
			}

			if (elem.classList && elem.classList.contains) {
				return elem.classList.contains(className);
			}

			return !!~elem.className.split(" ").indexOf(className);
		},

		/**
		 * @deprecated $.elements.triggerClass instead
		 */
		triggerClass: function(a, b) { return $.elements.toggleClass(a, b); },

		/**
		 * @param {HTMLElement|HTMLElement[]} elem
		 * @param {string} className
		 * @returns {HTMLElement|HTMLElement[]}
		 */
		toggleClass: function(elem, className) {
			if (!elem) {
				return null;
			}

			if (!Array.isArray(elem)) {
				elem = [elem];
			}

			for (var i = 0, l = elem.length, k; i < l; ++i) {
				k = elem[i];
				if (k.classList && k.classList.toggle) {
					k.classList.toggle(className);
				} else {
					if ($.elements.hasClass(k, className)) {
						$.elements.removeClass(k, className)
					} else {
						$.elements.addClass(k, className)
					}
				}
			}

			return elem;
		},

		/**
		 * @param {HTMLElement} node
		 * @returns {HTMLElement}
		 */
		clearChild: function(node) {
			var nodes = node.children;
			for (var i = nodes.length - 1, item; item = nodes[i]; --i) {
				node.removeChild(item);
			}
			return node;
		}
	},

	// 13.01.2016 refactored
	// 12.03.2016 fixed triming all \n in webkit
	/**
	 * @deprecated
	 * @param text
	 * @returns {string}
	 */
	trim: function (text) {
		return String.prototype.trim ? text.trim() : text.replace(/^\s+|\s+$/igm, "");
	},

	cookie: function(name, value, days) {
		var set = function(name, value, days) {
			var exdate = new Date();
			exdate.setDate(exdate.getDate() + days);
			value = escape(value) + ((exdate === null) ? "" : "; expires=" + exdate.toUTCString());
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
			}
			return name ? data[name] : data;
		}

		// remover
		if (name && (!value || days <= 0)) {
			set(name, "", -30);
			return true;
		}

		// setter
		return set(name, value, days || 30);
	},

	localStorage: function(name, value) {
		var isSupport = function () {
			return "localStorage" in window && window.localStorage;
		};

		if (!isSupport() || !name) {
			return false;
		}

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
			}
		}
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
			}
		},

		// refactored 13.01.2016
		remove: function (node, event, callback) {
			if (node.removeEventListener) {
				node.removeEventListener(event, callback);
			} else if (node.detachEvent) {
				node.detachEvent("on" + event, callback);
			} else {
				node["on" + event] = null;
			}
		},

		cancel: function (e) {
			e = e || window.event;

			if (!e) {
				return false;
			}

			e = e.originalEvent || e;
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
			e.cancelBubble = true;
			return e.returnValue = false;
		}
	},

	/**
	 * @deprecated
	 * @param {int} timestamp
	 * @param {int=} full
	 * @returns {string}
	 */
	getDate: function(timestamp, full) {
		return new Date(timestamp * 1000).long();
	},

	toTime: function (number) {
		var second = Math.floor(number % 60),
			minute = Math.floor(number / 60 % 60),
			hour = Math.floor(number / 60 / 60 % 60),
			n = function (n) {return n >= 10 ? n : "0" + n;};
		return (hour ? hour + ":" : "") + n(minute) + ":" + n(second);
	},

	textCase: function (number, titles) {
		number = Math.abs(number);
		return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5]];
	},

	/**
	 * @deprecated
	 * @param needle
	 * @param haystack
	 * @param index
	 * @returns {*}
	 */
	inArray: function(needle, haystack, index) {
		for (var key in haystack) {
			if (haystack.hasOwnProperty(key) && haystack[key] === needle) {
				return index ? key : true;
			}
		}
		return index ? -1 : false;
	}
};

/**
 *
 * @param {string} tag
 * @param {object=} attrs
 * @returns {HTMLElement}
 */
$.e = function(tag, attrs) { return $.elements.create(tag, attrs) };
$.getStyle = $.elements.getStyle;
$.getPosition = $.elements.getPosition;