/**
 * @param {{
 *   data: {count: int, items: object[]},
 *   countPerPage: int,
 *   needSearchPanel: boolean=,
 *   getItemListNode: function=,
 *   optionsItemListCreator: object=,
 *   filter: function=,
 *   actions: object[]=,
 *   onPageCreated: function=
 * }} options
 * @constructor
 */
function SmartList(options) {
	if (!options) {
		throw new TypeError("no enough options");
	}

	this.mPerPage = options.countPerPage || 50;

	this.mNeedSearchPanel = options.needSearchPanel;
	this.mFilterCallback = options.filter;

	this.mOnPageCreated = options.onPageCreated;

	this.mGetItemListNode = options.getItemListNode || SmartList.getDefaultItemListNode;
	this.mOptionsItemListCreator = options.optionsItemListCreator || {};
	this.mActions = options.actions || [];

	this.mCache = {};
	this.mStateAction = SmartList.state.NORMAL;
	this.mIsAllOutputted = false;
	this.mLastIndex = 0;
	this.mQueryResult = [];



	this.init();
	this.initPlurals();
	this.setData(options.data);
}

//noinspection JSUnusedLocalSymbols
SmartList.prototype = {

	/**
	 * Initialization
	 */
	init: function() {
		this.mNodeList = $.e("div", {"class": "sl-list"});
		this.mNodeSearchForm = this.mNeedSearchPanel ? this.initSearchForm() : $.e("div");

		this.mNodeWrap = $.e("div", {"class": "sl-wrap", append: [this.mNodeSearchForm, this.mNodeList]});
	},

	initPlurals: function() {
		this.mNodeList.dataset.phEmpty = Lang.get("smartList.list_empty");
		this.mNodeList.dataset.phEmptySearch = Lang.get("smartList.list_empty_search");
	},

	initSearchForm: function() {
		var self = this;
		this.mNodeSearchForm = Site.createInlineForm({
			type: "search",
			name: "q",
			title: Lang.get("smartList.search_label"),
			autocomplete: "off",
			placeholder: Lang.get("smartList.search_holder"),
			onkeyup: function(event) {
				self.onFilterStart.call(self, this, event);
			},
			onsubmit: function(event) {
				event.preventDefault();
			}
		});

		return this.mNodeSearchForm;
	},

	/**
	 * Output items
	 * @param {User[]=} data
	 */
	output: function(data) {
		if (data) {
			$.elements.clearChild(this.mNodeList);
		} else {
			data = this.mItems;
		}

		var chunk = data.slice(this.mLastIndex, this.mLastIndex += this.mPerPage);

		chunk.forEach(function(item) {
			var node = this.mCache[item.id] || (this.mCache[item.id] = this.mGetItemListNode(item, this.mOptionsItemListCreator));
			this.mNodeList.appendChild(node);
		}, this);


		if (this.mLastIndex === data.length) {
			this.mIsAllOutputted = true;
		}

		this.mOnPageCreated && this.mOnPageCreated();
	},

	showNext: function() {
		!this.mIsAllOutputted && this.output(this.mStateAction === SmartList.state.NORMAL ? null : this.mQueryResult);
	},

	/**
	 * Returns wrap
	 * @returns {HTMLElement}
	 */
	getNode: function() {
		return this.mNodeWrap;
	},

	/**
	 * Returns list node
	 * @returns {HTMLElement}
	 */
	getList: function() {
		return this.mNodeList;
	},

	add: function(item) {
		var first = this.mItems[0];
		this.mItems.splice(0, 0, item);

		if (this.mCache[first.id]) {
			this.mNodeList.insertBefore(this.mCache[item.id] = this.mGetItemListNode(item, this.mOptionsItemListCreator), this.mNodeList.firstChild);
			this.mLastIndex++;
		}

		$.elements.addClass(this.mCache[item.id], "sl-item-added");

		return this;
	},

	/**
	 * Remove item from items and UI list
	 * @param {object} item
	 * @returns {SmartList}
	 */
	remove: function(item) {
		var index = this.mItems.indexOf(item);

		if (~index) {
			this.mItems.splice(index, 1);
			this.mLastIndex--;
		}

		if (this.mCache[item.id]) {
			$.elements.remove(this.mCache[item.id]);

		}

		return this;
	},

	setData: function(data) {
		this.clear();

		this.mCount = data.count;
		this.mItems = data.items;

		this.setState(this.mCount !== -1 ? SmartList.state.NORMAL : SmartList.state.LOADING);

		this.output();
		return this;
	},

	clear: function() {
		$.elements.clearChild(this.mNodeList);
		this.mCount = 0;
		this.mItems = [];
		this.mLastIndex = 0;
		this.setState(SmartList.state.NORMAL);
	},

	setGetItemListNode: function(fx) {
		this.mGetItemListNode = fx;
		return this;
	},

	setOptionsItemListCreator: function(obj, value) {
		if (value === undefined) {
			this.mOptionsItemListCreator = obj;
		} else {
			this.mOptionsItemListCreator[obj] = value;
		}
		return this;
	},

	/**
	 * Set state for UI
	 * @param {SmartList.state|int} state
	 * @returns {SmartList}
	 */
	setState: function(state) {
		this.mStateAction = state;
		this.mNodeList.dataset.state = state;
		return this;
	},

	/**
	 * Calls when key up and filter will run
	 * @context this
	 * @param {HTMLInputElement} node
	 * @param {Event} event
	 */
	onFilterStart: function(node, event) {
		var q = node.value.trim();

		this.mIsAllOutputted = false;
		this.mLastIndex = 0;

		if (!q) {
			return this.cancelSearch();
		}

		this.setState(SmartList.state.SEARCH);

		this.output(this.mQueryResult = this.mItems.filter(this.mFilterCallback.bind(null, q)));
	},

	/**
	 * Cancel search when query is empty
	 */
	cancelSearch: function() {
		this.setState(SmartList.state.NORMAL);
		this.output();
	},

};

SmartList.state = {
	NORMAL: 0,
	SEARCH: 1,
	LOADING: 2
};

/**
 * Default handler for item list
 * @param {User|{title: string, icon: string, link: string}} item
 * @param {{
 *   mail: boolean=,
 *   textContentBold: boolean=,
 *   add: {
 *     filter: function=,
 *     onClick: function=,
 *     label: {
 *       content: string,
 *       width: int=
 *     }=
 *   }=,
 *   remove: {
 *     filter: function=,
 *     onClick: function=,
 *     label: {
 *       content: string,
 *       width: int=
 *     }=
 *   }=,
 *   getSubtitle: function=,
 *   icon: string=
 * }=} options
 * @returns {HTMLElement}
 */
SmartList.getDefaultItemListNode = function(item, options) {
	options = options || {};
	var link = item.link || "#" + (item.screen_name || ("name" in item ? "club" : "id") + item.id), wrap, nImage, nAdd, nRemove, nContentWrap, nSubtitle;
	wrap = $.e("div", {"class": "sl-item", append: [
		$.e("a", {"class": "sl-photo-wrap", href: link, append: nImage = item.photo_50 ? $.e("img", {src: getURL(item.photo_50)}) : $.e("div", {"class": "sl-photo-icon"})}),
		nContentWrap = $.e("a", {"class": "sl-content-wrap", href: link, append: $.e("div", {"class": "sl-content", html: item.title ? item.title.safe() : getName(item)})})
	]});

	if (options.getSubtitle && (nSubtitle = options.getSubtitle(item))) {
		if (!(nSubtitle instanceof HTMLElement)) {
			nSubtitle = $.e("div", {html: nSubtitle})
		}
		$.elements.addClass(nSubtitle, "sl-content-second");

		nContentWrap.appendChild(nSubtitle);
	}

	wrap.appendChild($.e("div", {"class": "sl-actions-wrap", append: [
		options.mail
			? $.e("a", {"class": "sl-action sl-action-mail", href: "#im?to=" + item.id})
			: null,

		options.add && (options.add.filter && options.add.filter(item) || !options.add.filter)
			? nAdd = $.e("div", {"class": "sl-action sl-action-add", onclick: options.add.onClick.bind(null, item, wrap)})
			: null,

		options.remove && (options.remove.filter && options.remove.filter(item) || !options.remove.filter)
			? nRemove = $.e("div", {"class": "sl-action sl-action-remove", onclick: options.remove.onClick.bind(null, item, wrap)})
			: null

		// TODO: message in friends requests
		/*options.isFriendRequest && item.message
			? e("span", {html: i.message.safe()
		}) : null,*/
	]}));

	if (options.icon || item.icon) {
		$.elements.addClass(nImage, options.icon || item.icon);
	}

	options.add && options.add.label && nAdd && bindTooltip(nAdd, {content: options.add.label.content, position: Tooltip.X_LEFT, width: options.add.label.width});
	options.remove && options.remove.label && nRemove && bindTooltip(nRemove, {content: options.remove.label.content, position: Tooltip.X_LEFT, width: options.remove.label.width});

	options.textContentBold && $.elements.addClass(wrap, "sl-content-bold");

	return wrap;
};

/**
 * @param {{
 *   fields: string[],
 *   matchCase: boolean=
 * }} options
 * @returns {Function}
 */
SmartList.getDefaultSearchFilter = function(options) {
	options = options || {};
	return function(query, item) {
		var words = query.replace(/\s{2,}/ig, "");

		if (!options.matchCase) {
			words = words.toLowerCase();
		}

		words = words.split(" ");
		var okCond;

		for (var i = 0, word; word = words[i]; ++i) {
			okCond = 0;
			for (var j = 0, field, value; field = options.fields[j]; ++j) {
				value = item[field];

				if (!options.matchCase) {
					value = value.toLowerCase();
				}

				~value.indexOf(word) && ++okCond;
			}

			if (!okCond) {
				return false;
			}
		}

		return true;
	}
};