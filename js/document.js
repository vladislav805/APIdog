function VKDocument(d) {
	this.ownerId = d.owner_id;
	this.documentId = d.id;
//	this.typeId = d.type;
	this.extension = d.ext;
	this.title = d.title;
	this.date = d.date;
	this.size = d.size;
	this.url = d.url;
	//noinspection JSUnusedGlobalSymbols
	this.canModify = !!(this.ownerId > 0 && this.ownerId === API.userId || this.ownerId < 0 && Local.data[this.ownerId] && Local.data[this.ownerId].is_admin);
}

VKDocument.prototype = {

	getAttachId: function() {
		return this.getType() + this.ownerId + "_" + this.getId();
	},

	getId: function() {
		return this.documentId;
	},

	getType: function() {
		return "doc";
	},

	/**
	 * Returns node for attachment
	 * @param {{onClick: function}} options
	 * @returns {HTMLElement}
	 */
	getNodeItem: function(options) {
		var self = this;
		return getRowAttachment({
			link: this.url,
			title: this.title,
			subtitle: this.size.bytes(1) + " | " + getDate(this.date, APIDOG_DATE_FORMAT_RELATIVE),
			icon: "document",
			isBlank: true,
			onClick: function(event) {
				event.preventDefault();
				options.onClick(self.ownerId, self.documentId, self, event);
				return false;
			}
		});
	},
};



var Docs = {

	explain: function(url) {
		url = url || window.location.hash.substring(1);
		var matches = /docs?(-?\d+)?(_(\d+))?/img.exec(url),
			ownerId = parseInt(matches[1]) || API.userId,
			docId = parseInt(matches[3]);

		if (docId) {
			return Docs.getById(ownerId, docId);
		}

		if (!Docs.storage[ownerId]) {
			Site.Loader();
			api("docs.get", {
				owner_id: ownerId || API.userId,
				v: 5.56
			}).then(function(data) {
				Docs.storage[ownerId] = data;
				Docs.showList(ownerId);
			});
		} else {
			Docs.showList(ownerId);
		}
	},

	storage: {},
	docs: {},

	DEFAULT_COUNT: 50,

	/**
	 * Show list of documents owner's
	 * @param {int} ownerId
	 */
	showList: function(ownerId) {

		/** @var {{count: int, items: object[]}} data */
		var data = Docs.storage[ownerId];

		var parent = $.e("div"),

			sl = new SmartList({
				data: data,
				countPerPage: Docs.DEFAULT_COUNT,
				getItemListNode: Docs.item,
				needSearchPanel: true,

				filter: function(query, item) {
					return ~item.title.toLowerCase().indexOf(query.toLowerCase());
				},

				/*optionsItemListCreator: {

					remove: function(item) {
						console.log(item);
					},

					filter: function(item) {
						return item.owner_id > 0 && item.owner_id === API.userId || item.owner_id < 0 && Local.data[item.owner_id] && Local.data[item.owner_id].is_admin
					}

				}*/

			});

		parent.appendChild(
			Site.getPageHeader(
				"<span id=docs-count>" + data.count + " " + $.textCase(data.count, Lang.get("docs.docs")) + "</span>",
				new DropDownMenu(Lang.get("general.actions"), {
					upload: {
						label: Lang.get("docs.upload"),
						onclick: Docs.initUpload.bind(Docs, sl)
					},
					refresh: {
						label: Lang.get("docs.refresh"),
						onclick: function() {
							Docs.storage[ownerId] = null;
							Docs.explain();
						}
					}
				}).getNode()
			)
		);

		parent.appendChild(sl.getNode());


		Site.setHeader("Документы");
		Site.append(parent);
	},

	initUpload: function(sl) {
		var e = $.e("input", {type: "file", multiple: true, onchange: function() {
			uploadFiles(this, {
				maxFiles: 20,
				method: "docs.getUploadServer"
			}, {
				onTaskFinished: function(result) {
					result.reverse().forEach(function(i) {
						sl.add(i);
					});
				}
			});
		}});
		e.click();
	},

	/**
	 * Return item of document
	 * @param {VkDocument} doc
	 * @returns {*}
	 */
	item: function(doc) {
		Docs.docs[doc.owner_id + "_" + doc.id] = doc;
		var e = $.e, node;

		return node = e("a", {
			href: doc.url,
			target: "_blank",
			"class": "doc-item",
			id: "doc" + doc.owner_id + "_" + doc.id,
			append: [
				doc.preview
					? e("div", {
						"class": "doc-preview",
						style: "background-image: url(" + getURL(doc.preview.photo.sizes[0].src) + ")"
					})
					: e("div", {
						"class": "doc-ext",
						html: doc.ext
					}),

				e("div", {"class": "doc-content", append: [
					e("div", {"class": "doc-title", html: doc.title.safe()}),
					e("div", {"class": "doc-size", html: doc.size.bytes(2) + " | " + getDate(doc.date, APIDOG_DATE_FORMAT_SMART)})
				]}),

				e("div", {"class": "sl-action sl-action-remove", onclick: function(event) {
					Docs.remove(doc.owner_id, doc.id).then(function() {
						$.elements.addClass(node, "doc-deleted");
						node.href = "";
						node.addEventListener("click", function(event) {
							event.preventDefault();
						});
						Docs.storage[doc.owner_id].items.splice(Docs.storage[doc.owner_id].items.indexOf(doc), 1);
						Docs.storage[doc.owner_id].count--;
					});
					return $.event.cancel(event);
				}}),
			]
		});
	},

	/**
	 * Request for remove document
	 * @param {int} ownerId
	 * @param {int} documentId
	 * @returns {Promise}
	 */
	remove: function(ownerId, documentId) {
		return api("docs.delete", {
			owner_id: ownerId,
			doc_id: documentId
		});
	},

	/**
	 * @deprecated
	 */
	getAttachment: function (doc) {
		var isImage = !!doc.photo_100,
			item = document.createElement(isImage ? "a" : "div");
		console.log(doc);
		if (doc.graffiti) {
			item = $("img", {src: doc.graffiti.src, width: doc.grattiti.width, height: doc.graffiti.height});
			return item;
		};

		if (isImage) {
			var blank = "about:blank",
				gif = $.e("div", {"class": "attachments-doc-gif-real hidden", append: [
					srcImg = $.e("img", {src: blank, alt: ""}),
					$.e("div", {
						"class": "docs-add animation",
						onclick: function (event) {
							Docs.add(doc.owner_id, (doc.id || doc.doc_id), doc.access_key);
							return $.event.cancel(event);
						}
					})
				]}),
				srcImg,
				preview = $.e("div", {"class": "attachments-doc-gif-preview", append: [
					$.e("img", {src: getURL(doc.photo_130), alt: ""}),
					$.e("div", {"class":"attachments-doc-title", html: Site.Escape(doc.title) + " (" + Docs.getSize(doc.size) + ")"})
				]});
			$.event.add(item, "click", function (event) {
				if (doc.ext !== "gif") {
					return true;
				}

				if(!$.elements.hasClass(this, "docs-gif-open")) {
					$.elements.addClass(this, "docs-gif-open");
					$.elements.removeClass(this.firstChild, "hidden");
					$.elements.addClass(this.lastChild, "hidden");
					srcImg.src = getURL(doc.url);
				}else{
					$.elements.removeClass(this, "docs-gif-open");
					$.elements.addClass(this.firstChild, "hidden");
					$.elements.removeClass(this.lastChild, "hidden");
					srcImg.src = blank;
				}

				return $.event.cancel(event);
			});
			item.href = doc.url;
			item.target = "_blank";
			item.className = "attachments-doc-img";
			item.appendChild(gif);
			item.appendChild(preview);
		} else {
			item.className = "attachments-doc";
			item.appendChild($.elements.create("div", {"class": "wall-icons wall-icon-doc"}));
			item.appendChild($.elements.create("span", {"class": "tip", html: " " + Lang.get("docs.doc") + " "}));
			item.appendChild($.elements.create("a", {html: Site.Escape(doc.title), href: doc.url, target: "_blank"}));
		}
		return item;
	},
	add: function (ownerId, docId, accessKey) {
		Site.API("docs.add", {
			owner_id:   ownerId,
			doc_id:     docId,
			access_key: accessKey
		}, function (data) {
			if (data.response) {
				Site.Alert({text: Lang.get("docs.saved")});
				Docs.storage[API.userId] = null;
			}
		});
	}
};
