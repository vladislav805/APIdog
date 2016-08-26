/**
 * APIdog v6.5
 *
 * Last update: 04/03/2016
 * Branch: release
 */

function VKDocument (d) {
	this.ownerId = d.owner_id;
	this.documentId = d.id;
	this.typeId = d.type;
	this.extension = d.ext;
	this.title = d.title;
	this.date = d.date;
	this.size = d.size;
	this.url = d.url;
	this.preview100 = d.photo_100;
	this.preview130 = d.photo_130;
	this.isImage = !!this.preview100;
	this.canModify = !!(this.ownerId > 0 && this.ownerId == API.userId || this.ownerId < 0 && Local.Users[this.ownerId] && Local.Users[this.ownerId].is_admin);
};

VKDocument.prototype = {
	getAttachId: function() {
		return this.getType() + this.ownerId + "_" + this.getId();
	},
	getId: function() { return this.documentId; },
	getType: function() { return "doc"; },

	getNode: function (actionBlock, forceCreate) {
		if (this.node && !forceCreate) {
			return this.node;
		};

		var e = $.e,
			context = this,
			wrap = e("a", {
				"class": "doc-item",
				onclick: function () {
					if (isMobile && actionBlock) {
						actionBlock.setItemForAction(context).show();
					};
				},
				target: "_blank",
					id: "doc" + this.ownerId + "_" + this.documentId,
					append: [
						e("div", {
							"class": "doc-actions",
							append: [
								e("div", {
									title: Lang.get("docs.actionOpen"),
									"class": "doc-i doc-i-download",
									onclick: function (event) {
										window.open(context.url);
										return $.event.cancel(event);
									}
								}),
								context.canModify ? e("div", {
									title: Lang.get("docs.actionEdit"),
									"class": "doc-i doc-i-edit",
									onclick: function (event) {
										context.edit(this);
										return $.event.cancel(event);
									}
								}) : null,
								context.ownerId != API.userId ? e("div", {
									title: Lang.get("docs.actionCopy"),
									"class": "doc-i doc-i-add",
									onclick: function (event) {
										context.copy();
										return $.event.cancel(event);
									}
								}) : null,
								context.canModify ? e("div", {
									title: Lang.get("docs.actionDelete"),
									"class": "doc-i doc-i-delete",
									onclick: function (event) {
										context.deleteDocument(wrap);
										return $.event.cancel(event);
									}
								}) : null,
							]
						}),
						e("div", {
							"class": "doc-extension",
							html: this.extension
			  			}),
						e("div", {"class": "doc-info", append: [
							this.nodeTitle = e("div", {"class": "doc-name cliptextfix", html: this.title.safe()}),
							e("div", {"class": "docs-size", html: this.getFooter()})
						]})
					]
			});

		if (!forceCreate) {
			this.node = wrap;
		};

		return wrap;
	},

	getNodeItem: function(options) {
		options = options || {};
		var node = this.getNode(null, true);
		if (options.onClick) {
			$.event.add(node, "click", function(event) {
				event.preventDefault();
				options.onClick(event);
				return false;
			});
		};
		return node;
	},

	edit: function (nodeButton) {
		var doc = this;
		new EditWindow({
			lang: true,
			title: "docs.editWindowTitle",
			isEdit: true,
			fromNode: nodeButton,
			items: [
				{
					type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
					name: "title",
					title: "docs.editTitle",
					value: doc.title
				}
			],
			onSave: function (values, modal) {
				new APIRequest("docs.edit", values)
					.setParam("ownerId", doc.ownerId)
					.setParam("docId", doc.documentId)
					.setParam("accessKey", doc.accessKey)
					.setOnCompleteListener(function (data) {
						modal.setContent(getEmptyField("docs.editSuccess", true)).setFooter("").closeAfter(1500);
						doc.title = values.title;
						doc.notifySetDataChanged();
						APINotify.fire(DogEvent.DOCUMENT_EDITED, { document: doc });
					})
					.execute();
			}
		});

	},

	share: function () {
		share("doc", this.ownerId, this.documentId, this.accessKey, null, {user: true});
	},

	copy: function () {
		var self = this;
		new APIRequest("docs.add", {
			ownerId: this.ownerId,
			docId: this.documentId,
			accessKey: this.accessKey
		}).setOnCompleteListener(function (data) {
			new Snackbar({text: Lang.get("docs.infoCopied"), duration: 2500}).show();
			Docs.mStorage[API.userId] && Docs.mStorage[API.userId].items && Docs.mStorage[API.userId].items.unshift(self);
			self.ownerId = API.userId;
			self.documentId = data;
			self.date = Date.now() / 1000;
			APINotify.fire(DogEvent.DOCUMENT_ADDED, { document: self });
		}).execute();
	},

	notifySetDataChanged: function () {
		this.nodeTitle.innerHTML = this.title.safe();
	},

	fixHeight: function () {
		var height = $.getPosition(this.node).height;
		console.log(this.node.clientHeight, this.node.offsetHeight, this.node.scrollHeight)
		this.node.style.height = height + "px";
		return height;
	},

	deleteDocument: function () {
		var self = this, height = this.fixHeight();
		new Snackbar({
			text: Lang.get("docs.deleteDone"),
			duration: 10000,
			onClose: function () {
				new APIRequest("docs.delete", {
					ownerId: self.ownerId,
					docId: self.documentId,
					accessKey: self.accessKey
				}).setOnCompleteListener(function (result) {
					$.elements.remove(self.node);
					APINotify.fire(DogEvent.DOCUMENT_DELETED, { document: self });
				}).execute();
			},
			onClick: function (snackbar) {
				snackbar.close();
			},
			action: {
				label: Lang.get("docs.deleteRestore"),
				onClick: function () {
					$.elements.removeClass(self.node, "doc-deleted");
				}
			}
		}).show();
		setTimeout(function() {
			$.elements.addClass(self.node, "doc-deleted");
		}, 10);
	},

	getFooter: function () {
		return this.getSize() + " | " + $.getDate(this.date);
	},

	getSize: function () {
		return this.size.getInformationValue()
	},

	getAttachmentNode: function () {
		var e = $.e,
		self = this,
			hc = $.elements.hasClass,
			ac = $.elements.addClass,
			rc = $.elements.removeClass;
		if (this.isImage) {
			var isOpened = false,
				nodeImage,
				nodeWrap,
				nodeFullView,
				nodePreView;

			return nodeWrap = e("a", {
				href: this.url,
				target: "_blank",
				"class": Docs.CLASS_GIF_WRAP,
				append: [
					nodeFullView = $.e("div", {"class": "doc-a-gif-fullview hidden", append: [
						nodeImage = $.e("img", {src: "about:blank", "src-gif": this.url, alt: ""}),
						$.e("div", {"class": "doc-i-more", onclick: function (event) {
							Docs.mActionBlock.setItemForAction(self).show();
							return $.event.cancel(event);
						}})
					]}),
					nodePreView = $.e("div", {"class": "doc-a-gif-preview", append: [
						$.e("img", {src: getURL(this.preview130), alt: ""}),
						$.e("div", {"class":"doc-a-gif-title", html: this.title.safe() + " (" + this.getSize() + ")"})
					]})
				],
				onclick: function (event) {
					/*if (this.extension != "gif") {
						return true;
					};*/

					isOpened = !isOpened;

					(!isOpened ? rc : ac)(nodeWrap, Docs.CLASS_GIF_PREVIEW_OPENED);
					(!isOpened ? ac : rc)(nodeFullView, Docs.CLASS_GIF_HIDDEN);
					(!isOpened ? rc : ac)(nodePreView, Docs.CLASS_GIF_HIDDEN);


					nodeImage.setAttribute("src", isOpened ? nodeImage.getAttribute("src-gif") : "");


					return $.event.cancel(event);
				}
			});
		};

		return e("div", {
			"class": "doc-a-wrap",
			onclick: function () {
				Docs.mActionBlock.setItemForAction(self).show();
			},
			id: "doc" + this.ownerId + "_" + this.documentId + "attachment",
			append: [
				e("div", {
					"class": "doc-extension",
					html: this.extension
				}),
				e("div", {"class": "doc-info", append: [
					e("strong", {html: this.title.safe()}),
					e("div", {"class": "docs-size", html: this.getFooter()})
				]})
			]
		});
	}
};



var Docs = {

	API: {

		code: {

			getDocuments: "var o=parseInt(Args.o),h;if(o>0){h=API.users.get({user_ids:o,fields:\"first_name_dat,last_name_dat\",v:5.9});}else{h=API.groups.getById({group_ids:-o,fields:\"can_upload_doc\",v:5.9});};return{host:h[0],docs:API.docs.get({owner_id:o,v:5.34})};"

		}

	},

	getSize: function() { return 0 },

	explain: function(url) {
		url = url || window.location.hash.substring(1);
		var matches = /docs?(-?\d+)?(_(\d+))?/img.exec(url),
			ownerId = parseInt(matches[1]) || API.userId,
			docId = parseInt(matches[3]);

		if (docId) {
			return Docs.getById(ownerId, docId);
		};

		if (!Docs.mStorage[ownerId]) {
			Site.Loader();
			new APIRequest("execute", {
				code: Docs.API.code.getDocuments,
				o: ownerId
			}).setOnCompleteListener(function (data) {
				Local.add([data.host]);
				Docs.showList(new VKList(data.docs, VKDocument), ownerId);
			}).execute();
		} else {
			Docs.showList(Docs.mStorage[ownerId], ownerId);
		};
	},


	mStorage: {},
	mList: null,
	mActionBlock: null,

	showList: function(data, ownerId) {

		Docs.mStorage[ownerId] = data;

		var e = $.e,
			list = e("div", {id: "doclist"}),
			parent = e("div", {"class": "docs-list", append: list}),
			actions = {},
			groupId = ownerId < 0 ? -ownerId : 0,
			canUpload = ownerId == API.userId || ownerId < 0 && Local.Users[ownerId] && Local.Users[ownerId].can_upload_doc,

			offset = 0,
			step = 50,

			insertDocs = function () {
				for (var i = offset, l = offset + step; i < l; ++i) {
					if (!data.has(i)) {
						break;
					};

					list.appendChild(data.get(i).getNode(Docs.mActionBlock));
				};
				offset = i;
			};

		if (canUpload) {
			actions[Lang.get("docs.upload")] = function (event) {
				Docs.initUpload(groupId);
			};
		};

		actions[Lang.get("docs.refresh")] = function (event) {Docs.mStorage[ownerId] = null;Docs.explain();};

		var search = new SearchLine({
			onsubmit: fxSearch,
			onkeyup: fxSearch,
			placeholder: Lang.get("docs.search")
		});
		parent.insertBefore(search.getNode(), parent.firstChild);
		parent.insertBefore(Site.getPageHeader(
			"<span id=docs-count>" + data.getCount() + " " + Lang.get("docs", "docs", data.getCount()) + "</span>",
			Site.CreateDropDownMenu(Lang.get("general.actions"), actions)
		), parent.firstChild);

		var fxSearch = function (event) {
			/*var text = $.trim(this.q ? this.q.value : this.value);
			$.elements.clearChild(list);
			if (!text) {
				Docs.insertDocs(list, data, 0, 30);
				Docs.setCount(data.count);
			} else {
				Docs.search(list, data, text);
			}
			return false;*/
		};


		insertDocs();

		window.onScrollCallback = function (event) {
			if (event.needLoading && list.children.length < data.getCount()) {
				insertDocs();
			};
		};

		if (data.getCount() <= 0) {
			list.appendChild(getEmptyField(data.getCount() < 0 ? "docs.errorAccessDenied" : "docs.errorNoOneDocument", true));
		};


		Site.setHeader(Lang.get("docs.docsTitle"));
		Site.append(parent);
	},

	initUpload: function (groupId) {
		var e = $.e("input", {type: "file", multiple: true, onchange: function (e) { Docs.onUpload(this, groupId) }});
		e.click();
	},

	onUpload: function(node, groupId) {
		uploadFiles(node, {
			maxFiles: 20,
			method: "docs.getUploadServer",
			params: {group_id: groupId}
		}, {
			onTaskFinished: function(result) {
				var parent = $.element("doclist"), doc, node, o = groupId ? -groupId : API.userId;

				result.map(function(i) {
					doc = new VKDocument(Docs.tov5(i));
					node = doc.getNode(Docs.mActionBlock);
					$.elements.addClass(node, "docs-saved");
					parent.insertBefore(node, parent.firstChild);
					return doc;
				});

				$.elements.addClass($.element("uploadform"), "hidden");
				Docs.mStorage[o].items = result.concat(Docs.mStorage[o].items);
				Docs.setCount(Docs.mStorage[o].items.length);
				APINotify.fire(DogEvent.DOCUMENT_UPLOADED, { ownerId: o, documents: result });
			}
		});
	},

	setCount: function(n, before, after) {
		$.element("docs-count").innerHTML = (before ? before + " " : "") + n + " " + Lang.get("docs", "docs", n) + (after ? " " + after : "");
	},
	insertDocs: function(node, docs, from, until) {
		for (var d = docs.items; from < until; ++from)
			node.appendChild(Docs.item(d[from]));
	},

	item: function(doc, opts) {
		if (!doc)
			return $.e("div");
		opts = opts || {};
		Docs.docs[doc.owner_id + "_" + doc.id] = doc;
		var e = $.elements.create,
			item,
			type = opts && opts.type !== undefined ? opts.type : +Docs.view;
		switch (type) {
			case 0:
				item = e("a", {
					href: doc.url,
					"class": "docs-item",
					target: "_blank",
					id: "doc" + doc.owner_id + "_" + doc.id,
					append: [
						e("div", {"class": "docs-delete", onclick: function (event) {
							Docs["delete"](this.parentNode, doc.owner_id, doc.id);
							return $.event.cancel(event);
						}}),
						Docs.isDocAsImage(doc, e),
						e("div", {"class": "docs-right", append: [
							e("strong", {html: doc.title.safe()}),
							e("div", {"class": "docs-size", html: Docs.getSize(doc.size)})
						]})
					]
				});
				break;
			case 1:
				item = e("a", {
					href: doc.url,
					target: "_blank",
					"class": "docs-item-dale",
					id: "doc" + doc.owner_id + "_" + doc.id,
					append: [
						e("div", {"class": "docs-delete", onclick: function (event) {
							Docs["delete"](this.parentNode, doc.owner_id, doc.id);
							return $.event.cancel(event);
						}}),
						Docs.isDocAsImage(doc, e, true),
						e("div", {"class": "docs-dale-foot", append: [
							e("strong", {html: doc.title.safe()}),
							e("div", {"class": "docs-size", html: Docs.getSize(doc.size)})
						]})
					]
				})
				break;
		}

		return item;
	},

// todo:
	search: function(node, docs, q) {
		var founded = [];
		for (var i = 0, d = docs.items, l = d.length; i < l; ++i) {
			if (new RegExp(q, "gi").test(d[i].title))
				founded.push(d[i]);
		}
		if (!founded.length) {
			node.appendChild(Site.EmptyField(Lang.get("docs.search_by_query") + " \"" + q.safe() + "\" " + Lang.get("docs.search_not_found")));
			Docs.setCount(0, Lang.get("docs", "founded", 0));
		} else {
			Docs.insertDocs(node, {count: founded.length, items: founded}, 0, founded.length);
			Docs.setCount(founded.length, Lang.get("docs", "founded", founded.length));
			if (!q)
				node.appendChild(Site.PagebarV2(0, founded.length, 30));
		}
	},


	// need for upload
	tov5: function(doc) {
		doc.owner_id    = doc.owner_id  || doc.oid;
		doc.id          = doc.id        || doc.did;
		doc.photo_130   = doc.photo_130 || doc.thumb;
		doc.photo_100   = doc.photo_100 || doc.thumb_s;
		return doc;
	},

	CLASS_GIF_WRAP: "doc-a-wrap",
	CLASS_GIF_PREVIEW_OPENED: "doc-a-gif-opened",
	CLASS_GIF_HIDDEN: "hidden",

	getAttachment: function(doc) {
		return new VKDocument(doc).getAttachmentNode();
	},

	getById: function(ownerId, docId) {
		new APIRequest("docs.getById", {docs: ownerId + "_" + docId}).setOnCompleteListener(function (data) {
			console.log(data);
		}).execute();
	}
};

onInited(function() {
	Docs.mActionBlock = new ActionBlock([
		{ name: "opn", label: lg("docs.actionOpen"), onClick: function(item) { window.open(item.url); } },
		{ name: "cpy", label: lg("docs.actionCopy"), onClick: function(item) { item.copy(); } },
		{ name: "snd", label: lg("docs.actionSend"), onClick: function(item) { item.share(); } },
		{ name: "edt", label: lg("docs.actionEdit"), onClick: function(item) { item.edit(); } },
		{ name: "dlt", label: lg("docs.actionDelete"), onClick: function(item) { item.deleteDocument(); } }
	]).setOnPreparingItem(function(action, item) {
		switch (action.name) {
			case "cpy":
				return item.ownerId != API.userId;

			case "edt":
			case "dlt":
				return item.canModify;

			default: return true;
		};
	});
});