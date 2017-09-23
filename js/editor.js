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
 * @param {string} method
 * @param {int} ownerId
 * @param {string} itemKey
 * @param {int} itemId
 * @param {string|null=} accessKey
 * @param {boolean=} needComment
 */
function showReportWindow(method, ownerId, itemKey, itemId, accessKey, needComment) {
	var params = {owner_id: ownerId},
		modal = new Modal({});
	params[itemKey] = itemId;

	if (accessKey) {
		params.access_key = accessKey;
	}

	var e = $.e,
		fields,

		getListOrReasons = function() {
			var items = (Lang.get(method !== "users.report" ? "report.modalReasons" : "report.modalReasonsUser") || []),
				result = [], item;

			for (var key in items) {
				if (!items.hasOwnProperty(key)) {
					continue;
				}

				item = items[key];
				result.push($.e("label", { append: [
					$.e("input", {type: "radio", name: "report", value: key}),
					$.e("span", {html: item})
				] }));
			}
			return result;
		},

		form = e("form", {
			onsubmit: function(event) {
				event.preventDefault();

				send();

				return false;
			},

			append: [
				e("blockquote", {html: Lang.get("report.modalDescription")}),
				fields = e("div", {"class": "sf-wrap", append: getListOrReasons()})
			]
		}),

		getSelectedIndex = function() {
			var f = form.elements.report;
			for (var i = 0, l = f.length; i < l; ++i) {
				if (f[i].checked) {
					return i;
				}
			}
			return -1;
		},

		isValid = function() {
			return ~getSelectedIndex();
		},

		send = function() {
			if (!isValid()) {
				return false;
			}

			params.reason = getSelectedIndex();

			if (needComment) {
				params.comment = form.comment.value.trim();
			}

			api(method, params).then(function() {
				modal.setContent(Lang.get("report.modalSuccess")).setButtons([{
				    name: "close",
				    title: Lang.get("general.close"),
				    onclick: function() {
					    this.close();
				    }
				}])
				.closeAfter(2000);
			}).catch(function(error) {
				alert(JSON.stringify(error));
			});
		};

	if (needComment) {
		fields.appendChild(e("div", {append: [
			e("div", {"class": "tip", html: Lang.get("report.modalComment")}),
			e("textarea", {name: "comment"})
		]}));
	}


	modal.setTitle(Lang.get("report.modalTitle"))
		.setContent(form)
		.setButtons([
			{ name: "ok", title: Lang.get("report.modalOkButton"), onclick: send },
			{ name: "cancel", title: Lang.get("general.cancel"), onclick: function() { this.close(); } }
		])
		.show();
}
