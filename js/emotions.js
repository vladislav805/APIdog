var APIDOG_EMOTIONS_MODE_SMILES = 1,
	APIDOG_EMOTIONS_MODE_STICKERS = 2;

/**
 * Emotions
 * @param {{
 *     onOpen: function=,
 *     onClick: function=,
 *     mode: int,
 *     textArea: HTMLElement=
 * }} options
 * @returns {{getNodeButton: function}}
 */
function EmotionController(options) {
	var e = $.e;

	this.options = options || {};

	this.textArea = options.textArea;

	this.mode = options.mode;

	this.tabs = e("div", {"class": "emotions-tabs"});
	this.wrapTabs = e("div", {"class": "emotions-tabs-wrap", append: this.tabs});
	this.wrapContents = e("div", {"class": "emotions-contents"});

	this.mOnClick = options.onClick;

	this.createTabs();
	this.init();

	this.wrap = e("div", {"class": "emotions-wrap", append: [(this.mode & APIDOG_EMOTIONS_MODE_STICKERS) ? this.wrapTabs : null, this.wrapContents]});
}

EmotionController.prototype = {

	init: function() {
		var self = this;
		this.textArea.addEventListener("keydown", function(event) {
			if (event.keyCode === KeyboardCodes.tab) {
				self.toggle();
				$.event.cancel(event);
				return false;
			}
		});
	},

	/**
	 * Initial
	 */
	createTabs: function() {
		this.tabsTitles = {};
		this.tabs.appendChild(this.createTab(0, $.e("div", {"class": "emotions-icon-smiles"})));

		if (this.mode & APIDOG_EMOTIONS_MODE_STICKERS) {
			this.tabs.appendChild(this.createTab(-1, $.e("div", {"class": "emotions-icon-recent"})));

			var items = EmotionController.data.items;

			items.forEach(function(pack) {
				this.tabs.appendChild(this.createTab(pack.id));
			}, this);
		}

		this.setScrollListenerTab();
		this.setTouchListenerTab();

		this.setTab(0);
	},

	/**
	 * Create tab with icon
	 * @param {int} packId
	 * @param {*=} icon
	 * @returns {HTMLElement}
	 */
	createTab: function(packId, icon) {
		var self = this;
		return this.tabsTitles[packId] = $.e("div", {
			"class": "emotions-tab",
			id: "emotions-tab-" + packId,
			onclick: function() {

				console.log(self.tabs.dataset.hammer);
				(!self.tabs.dataset.hammer || self.tabs.dataset.hammer === "0") && self.setTab.call(self, packId);
			},
			append: icon || $.e("img", {src: EmotionController.SCHEMA_STICKER_IMAGE_TAB.replace("%c", packId.toString())}),
			ondragstart: function(event) {
				event.preventDefault();
				return false;
			}
		});
	},

	tabsScrolled: 0,

	setScrollListenerTab: function() {
		this.tabsScrolled = 0;
		var self = this;
		$.event.add(this.tabs, "wheel", function(event) {
			event.preventDefault();
			var TO_BOTTOM = -1,
				TO_TOP = 1,

				direction = event.deltaY > 0 ? TO_BOTTOM : TO_TOP;

			self.tabsScrolled = (self.tabsScrolled + -direction * 20).toRange(0, self.getMaxOffsetForTabTranslate());

			self.setScrollTab(self.tabsScrolled);
		});
	},

	getMaxOffsetForTabTranslate: function() {
		return this.tabs.parentNode.offsetWidth - (EmotionController.data.items.length + 3) * 30;
	},

	setTouchListenerTab: function() {
		var touch = new Hammer(this.tabs), self = this;

		touch.on("panstart", function() {
			self.tabs.dataset.hammer = "1";
		});

		touch.on("pan", function(event) {
			var distanceX = -event.deltaX;

			self.setScrollTab((self.tabsScrolled + distanceX).toRange(0, self.getMaxOffsetForTabTranslate()));
		});

		touch.on("panend", function(event) {
			event.preventDefault();
			self.tabsScrolled = (self.tabsScrolled - event.deltaX).toRange(0, self.getMaxOffsetForTabTranslate());
			self.setScrollTab(self.tabsScrolled);
			setTimeout(function() {
				self.tabs.dataset.hammer = "0";
			}, 300);
		})
	},

	setScrollTab: function(x) {
		prefix(this.tabs, "transform", "translateX(" + -x + "px)");
	},

	tabsTitles: {},

	/**
	 * Set viewport
	 * @param {int} packId
	 */
	setTab: function(packId) {
		this.setSelectedTab(packId);

		this.setContent(
			packId
				? (packId > 0
					? this.getNodeStickersPack(packId)
					: this.getNodeStickersRecent()
				)
				: this.getNodeSmiles()
		);
	},

	/**
	 * Set selected tab on tab panel
	 * @param {int} id
	 */
	setSelectedTab: function(id) {
		Array.prototype.forEach.call(document.querySelectorAll("." + EmotionController.CLASS_TAB_ACTIVE), function(item) {
			$.elements.removeClass(item, EmotionController.CLASS_TAB_ACTIVE);
		});

		$.elements.addClass(this.tabsTitles[id], EmotionController.CLASS_TAB_ACTIVE);
	},

	/**
	 * Create panel with smiles
	 * @returns {HTMLElement}
	 */
	getNodeSmiles: function() {
		var e = $.e,
			self = this,
			getItem = function(symbol) {
				/** @var {HTMLElement} img */
				var img;
				return e("div", {"class": "emotions-smile-wrap", append: (
						img = e("img", {
							src: self.getSmileURL(symbol),
							style: "opacity: 0",
							onload: function() { img.style.opacity = "1"; }
						})
					),
					onclick: self.handleClick.bind(self, APIDOG_EMOTIONS_MODE_SMILES, symbol)
				});
			},
			list = $.e("div", {"class": "emotions-smile-list"});

		EmotionController.smiles.map(function(smile) {
			list.appendChild(getItem(smile));
		});

		/*list.appendChild(e("div", {"class": "imdialog-emotions-smile-wrap", append: e("span", {html: "¯\\_(ツ)_/¯"}), onclick: function (event)
		{
			IM.insertEmojiSymbol(target || getIMText(), 0, "¯\\_(ツ)_/¯");
		}}));*/
		return list;
	},

	/**
	 * Returns view of list recent stickers
	 * @returns {HTMLElement}
	 */
	getNodeStickersRecent: function() {
		return this.getStickerListView(EmotionController.data.recent, 0);
	},

	/**
	 * Returns view of list stickers pack
	 * @param packId
	 * @returns {HTMLElement}
	 */
	getNodeStickersPack: function(packId) {
		return this.getStickerListView(this.findStickerPackById(packId).items, packId);
	},

	/**
	 * @param {int[]} stickers
	 * @param {int} packId
	 * @returns {HTMLElement}
	 */
	getStickerListView: function(stickers, packId) {
		//noinspection JSUnresolvedFunction
		var e = $.e,

			setViewPage = function(i) {
				if (i < 0 || i >= screens.length) {
					i = i < 0 ? 0 : screens.length - 1;
				}

				current = i;
				prefix(list, "transform", "translateX(" + -(i * 100) + "%)");
				nav.dataset.active = i;
			},

			current,

			getCurrent = function() {
				return current;
			},

			screens = stickers.map(function(sticker) {
				return this.getStickerItem(sticker);
			}, this).inGroupsOf(8).map(function(screen) {
				return e("div", {"class": "emotions-stickers-screen", append: screen});
			}),

			dotsNodes = {},

			dots = Array.apply(null, new Array(screens.length)).map(function(v, i) {
				return dotsNodes[i] = e("div", {"class": "emotions-stickers-dot", onclick: setViewPage.bind(null, i)});
			}),

			list = e("div", {"class": "emotions-stickers-list", append: screens}),

			nav = e("div", {"class": "emotions-stickers-dots", append: dots}),

			wrap = e("div", {"class": "emotions-stickers-list-wrap", append: [list, nav]});

		if (packId) {
			wrap.style.background = "url(" + this.getStickerBackgroundURL(packId) + ")";
		}

		this.setTouchListener(list, setViewPage, getCurrent, screens.length - 1);
		this.setScrollListener(list, setViewPage, getCurrent);

		setViewPage(0);

		return wrap;
	},

	/**
	 * Scroll listener for navigate by screens of stickers
	 * @param list
	 * @param setPage
	 * @param getPage
	 */
	setScrollListener: function(list, setPage, getPage) {
		$.event.add(list, "wheel", function(event) {
			event.preventDefault();
			var TO_BOTTOM = -1,
				TO_TOP = 1,

				direction = event.deltaY > 0 ? TO_BOTTOM : TO_TOP;

			setPage(getPage() - direction);
		});
	},

	/**
	 * Touch listener
	 * @param {HTMLElement} list
	 * @param {function} setPage
	 * @param {function} getPage
	 * @param {int} last
	 */
	setTouchListener: function(list, setPage, getPage, last) {
		var touch = new Hammer(list);

		touch.on("panstart", function() {
			$.elements.addClass(list, "emotions-stickers-list--pan");
		});

		touch.on("pan", function(event) {
			var distanceX = event.deltaX, page = getPage();

			var w = list.parentNode.offsetWidth,
				c = w * page,
				x;

			if (page <= 0 && distanceX > 0 || page >= last && distanceX < 0) {
				distanceX *= .25;
			}

			x = c - distanceX;

			prefix(list, "transform", "translateX(" + -x + "px)");
		});

		touch.on("panend", function(event) {
			if (event.direction !== Hammer.DIRECTION_LEFT && event.direction !== Hammer.DIRECTION_RIGHT) {
				return;
			}

			$.elements.removeClass(list, "emotions-stickers-list--pan");

			var deltaX = event.deltaX,
				deltaOK = list.parentNode.offsetWidth / 3;

			if (Math.abs(deltaX) >= deltaOK) {
				setPage(getPage() + (deltaX < 0 ? 1 : -1));
			} else {
				setPage(getPage());
			}


		});
	},

	/**
	 * Returns node item of sticker
	 * @param stickerId
	 * @returns {HTMLElement}
	 */
	getStickerItem: function(stickerId) {
		//noinspection JSUnusedGlobalSymbols,SpellCheckingInspection
		return $.e("div", {"class": "emotions-sticker-wrap mbo", append: $.e("img", {
			src: this.getStickerURL(stickerId),
			ondragstart: function(event) {
				event.preventDefault();
				return false;
			},

			onclick: this.handleClick.bind(this, APIDOG_EMOTIONS_MODE_STICKERS, stickerId)
		})});
	},

	/**
	 * Returns URL for smile
	 * @param {string} s
	 * @returns {string}
	 */
	getSmileURL: function(s) {
		var i=0,b="",a="",n,y=[],c=[],d,l,j=!1,f=!1;while(n=s.charCodeAt(i++)){d=n.toString(16).toUpperCase();l=s.charAt(i-1);if(i===2&&n===8419){c.push("003"+s.charAt(0)+"20E3");y.push(s.charAt(0));b='';a='';continue}b+=d;a+=l;if(!l.match(emojiCharSequence)){c.push(b);y.push(a);b='';a=''}}if(b){c.push(b);y.push(a)}b="";a="";for(i in c){d=c[i];l=y[i];if(l.match(/\uD83C[\uDFFB-\uDFFF]/)){b+=d;a+=l;continue}if(j){b+=d;a+=l;j=!1;continue}if(d==="200C"||d==="200D"){if(b){j=!0;continue}}if(l.match(/\uD83C[\uDDE6-\uDDFF]/)){if(f){b+=d;a+=l;f=!1;continue}f=!0;}else if(f)f=!1;b=d;a=l}
		return (isEnabled(Settings.USING_PROXY)
			? "//apidog.ru/images/smiles/"
			: "//vk.com/images/emoji/") + b + ".png";
	},

	/**
	 * Returns URL for sticker
	 * @param {int} s
	 * @returns {string}
	 */
	getStickerURL: function(s) {
		return (isEnabled(Setting.USING_PROXY)
			? "//apidog.ru/images/stickers/%sb.png"
			: "//vk.com/images/stickers/%s/128b.png"
		).replace("%s", String(s));
	},

	/**
	 * Returns URL for background of sticker list
	 * @param {int} packId
	 * @returns {string}
	 */
	getStickerBackgroundURL: function(packId) {
		return "//vk.com/images/store/stickers/%s/background.png".replace("%s", String(packId)); // TODO: proxy
	},

	/**
	 * Returns if exists sticker pack
	 * @param {int} packId
	 * @returns {StickerPack|null}
	 */
	findStickerPackById: function(packId) {
		for (var i = 0, item; item = EmotionController.data.items[i]; ++i) {
			if (item.id === packId) {
				return item;
			}
		}
		return null;
	},

	/**
	 * Set content
	 * @param {HTMLElement} node
	 */
	setContent: function(node) {
		$.elements.clearChild(this.wrapContents).appendChild(node);
	},

	/**
	 * Returns button for open panel
	 * @returns {HTMLElement}
	 */
	getNodeButton: function() {
		return $.e("div", {"class": "attacher-button-wrap vkform-icon-smile", onclick: this.onButtonClick.bind(this)});
	},

	/**
	 * Event listener for button
	 */
	onButtonClick: function() {
		this.toggle();
	},

	/**
	 * Toggle state for panel
	 */
	toggle: function() {
		$.elements.toggleClass(this.wrap, EmotionController.CLASS_OPENED);
	},

	/**
	 * Close panel
	 * @returns {EmotionController}
	 */
	close: function() {
		$.elements.removeClass(this.wrap, EmotionController.CLASS_OPENED);
		return this;
	},

	/**
	 * Returns element for inserting panel in form
	 * @returns {HTMLElement}
	 */
	getNodeWrap: function() {
		return this.wrap;
	},

	/**
	 * Change listener for handle clicks
	 * @param {function} listener
	 * @returns {EmotionController}
	 */
	setOnClick: function(listener) {
		this.mOnClick = listener;
		return this;
	},

	handleClick: function(type, data) {
		if (type === APIDOG_EMOTIONS_MODE_SMILES && this.textArea) {
			this.textArea.focus();
			var emoji = " " + data + " ",
				n = this.textArea.selectionStart || 0;

			this.textArea.value = this.textArea.value.insert(emoji, n);
			n = n + emoji.length;
			setSelectionRange(this.textArea, n, n);
			return;
		}

		this.mOnClick && this.mOnClick(type, data);
	}

};

EmotionController.SCHEMA_STICKER_IMAGE_TAB = "//vk.com/images/store/stickers/%c/thumb_44.png";
EmotionController.SCHEMA_STICKER_IMAGE_ITEM = "//vk.com/images/stickers/%s/128b.png";
EmotionController.SCHEMA_STICKER_IMAGE_BACKGROUND = "//vk.com/images/store/stickers/%s/background.png";

EmotionController.CLASS_OPENED = "emotions--opened";
EmotionController.CLASS_TAB_ACTIVE = "emotions-tab--opened";

/**
 * @type {{items: StickerPack[], recent: int[]}}
 */
EmotionController.data = {items: [], recent: []};

EmotionController.smiles = "";

/**
 * Add information about stickers of user
 * @param {StickerPack[]} items
 * @param {int[]} recent
 */
EmotionController.populate = function(items, recent) {
	EmotionController.updateSmileSet();
	EmotionController.data = {
		items: items.map(function(item) {
			item.items = item.stickers.sticker_ids;
			delete item.stickers;
			return item;
		}),
		recent: recent
	};
};

EmotionController.updateSmileSet = function() {
	EmotionController.smiles = $.localStorage("__usingSmiles").split(";");
};