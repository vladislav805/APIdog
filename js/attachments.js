var APIDOG_ATTACHMENT_PHOTO = 1,
	APIDOG_ATTACHMENT_VIDEO = 2,
	APIDOG_ATTACHMENT_AUDIO = 4,
	APIDOG_ATTACHMENT_DOCUMENT = 8,
	APIDOG_ATTACHMENT_MAP = 16,
	APIDOG_ATTACHMENT_POLL = 0, // TODO: 32
	APIDOG_ATTACHMENT_LINK = 64,
//	APIDOG_ATTACHMENT_NOTE = 128,
//	APIDOG_ATTACHMENT_PAGE = 256,
	APIDOG_ATTACHMENT_ALBUM = 0, // TODO: 512
	APIDOG_ATTACHMENT_TIMER = 1024,
	APIDOG_ATTACHMENT_STICKER = 2048,
	APIDOG_ATTACHMENT_GIFT = 0, // TODO: 4096,


	APIDOG_UI_EW_TYPE_ITEM_SIMPLE = 0,
	APIDOG_UI_EW_TYPE_ITEM_TEXTAREA = 1,
	APIDOG_UI_EW_TYPE_ITEM_SELECT = 2,
	APIDOG_UI_EW_TYPE_ITEM_CHECKBOX = 3,
	APIDOG_UI_EW_TYPE_ITEM_RADIO = 4,
	APIDOG_UI_EW_TYPE_ITEM_CUSTOM = 5;

/**
 * Контроллер для аттачей
 * 29/02/2016: создан
 * 07/08/2016: переименован, описан
 * @param {{peerId: int=, ownerId: int, onOpen: function=, onSelect: function=, methods: object=, allowedTypes: int=, maxCount: int, expandBottom: boolean=}} options
 */
function AttachmentController(options) {
	this.peerId = options.peerId;
	this.ownerId = options.ownerId || API.userId;
	this.mBundle = new AttachmentBundle();
	this.content = $.e("div");
	this._onSelect = options.onSelect && options.onSelect.bind(this);
	this.methods = options.methods;
	this.allowedTypes = options.allowedTypes || (APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT);
	this.maxCount = options.maxCount || 10;
	this.mToTop = !options.expandBottom;
	this.wrapPreview = $.e("div");
}

AttachmentController.mediaCache = {photo: {}, video: {}, audio: {}, doc: {}};

AttachmentController.prototype = {

	mBundle: null,

	mTypeChooser: null,

	open: function(from) {
		var self = this;
		this.chunk = [];
		this.modal = new Modal({
			title: Lang.get("attacher.modalTitle"),
			content: this.content,
			width: 750,
			noPadding: true,
			footer: [
				{
					name: "ok",
					title: Lang.get("attacher.modalOk"),
					onclick: function() {
						self._onSelect(self.mBundle.get());
						self.done();
						this.close();
					}
				},
				{
					name: "cancel",
					title: Lang.get("attacher.modalCancel"),
					onclick: function() {
						this.close();
					}
				}
			]
		});
		this.modal.show(from);
	},

	clear: function() {
		this.mBundle.clear().setLink(null).setGeo(null).setTimer(null);
		this.done();
		return this;
	},

	getNodeButton: function() {
		return this.wrapButton = $.e("div", {"class": "attacher-button-wrap vkform-icon-attach", append: this.button = this.createTypeList()});
	},

	getNodePreview: function() {
		return this.wrapPreview;
	},

	createTypeList: function() {
		var self = this, obj = {};
		for (var i = 0, j; i <= 12; ++i) {
			j = Math.pow(2, i);

			if (!(this.allowedTypes & j)) {
				continue;
			}

			obj[j] = {
				label: Lang.get(AttachmentController.langs[j]),
				onclick: (function(k) {
					return function() {
						self.openSelectWindow(k, this);
					}
				})(j)
			};

		}

		this.mTypeChooser = new DropDownMenu("", obj, {toTop: this.mToTop});
		return this.mTypeChooser.getNode();
	},

	/**
	 * Return string vk-style
	 * @returns {string}
	 */
	toString: function() {
		return this.mBundle.getString();
	},

	getList: function() {
		return this.mBundle.get();
	},

	/**
	 * Return coordinates
	 * @returns {float[]}
	 */
	getGeo: function() {
		return this.mBundle.getGeo();
	},

	/**
	 * @returns {int}
	 */
	getTimer: function() {
		return this.mBundle.getTimer();
	},

	saveIntoCache: function(target, items) {
		items.forEach(function(item) {
			target[item.owner_id + "_" + item.id] = item;
		});
	},

	openSelectWindow: function(typeId, button) {
		button = this.wrapButton;
		var self = this, tabs, host;
		switch (typeId) {

			/**
			 * Photo
			 */
			case APIDOG_ATTACHMENT_PHOTO:
				var albums,
					loadAlbums = function(callback) {
						if (albums) {
							return callback(albums);
						}

						api("photos.getAlbums", {owner_id: self.ownerId, extended: 1, need_system: 1, need_covers: 1, v: 5.52}).then(function(result) {
							callback(albums = parse(result.items, VKPhotoAlbum));
						});
					},

					albumsListNode,
					albumContents = {},

					openAlbum = function(ownerId, albumId) {
						if (albumContents[ownerId + "_" + albumId]) {
							showAlbum(ownerId, albumContents[ownerId + "_" + albumId]);
							return;
						}

						$.elements.clearChild(albumsListNode).appendChild(getLoader());

						api("photos.get", {owner_id: ownerId, album_id: albumId, v: 5.52, count: 1000, extended: 1}).then(function(result) {
							showAlbum(ownerId, albumContents[ownerId + "_" + albumId] = parse(result.items, VKPhoto));
							self.saveIntoCache(AttachmentController.mediaCache.photo, result.items);
						});
					},

					showAlbum = function(ownerId, photos) {
						$.elements.clearChild(albumsListNode);
						var list = $.e("div", {"class": "attacher-list-photos"});
						photos.forEach(function(photo) {
							var item = photo.getNodeItem();

							$.event.add(item, "click", function() {
								self.add(photo).done();
							});

							item.appendChild($.e("div", {
								"class": "attacher-photo-checkbox",
								onclick: function(event) {
									this.classList.toggle("attacher-photo-checkbox-checked");
									this.classList.contains("attacher-photo-checkbox-checked")
										? self.add(photo)
										: self.remove(photo);
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
					};

				tabs = [
					{
						name: "album",
						title: Lang.get("attacher.photoAlbum"),
						content: albumsListNode = $.e("div", { append: getLoader() }),
						onOpen: function() {
							loadAlbums(showAlbums);
						}
					},
					{
						name: "file",
						title: Lang.get("attacher.photoFile"),
						content: this.createFileForm(typeId)
					},
					{
						name: "url",
						title: Lang.get("attacher.photoURL"),
						content: this.createURLForm(typeId)
					}
				];
				host = new TabHost(tabs, {});

				this.open(button);
				this.modal.setContent(host.getNode());
				break;

			/**
			 * Video
			 */
			case APIDOG_ATTACHMENT_VIDEO:
				var videoListNode,
					videos,
					loadVideos = function(callback) {
						if (videos) {
							return callback(videos);
						}

						api("video.get", {owner_id: self.ownerId, v: 5.52}).then(function(result) {
							callback(videos = parse(result.items, VKVideo));
							self.saveIntoCache(AttachmentController.mediaCache.video, result.items);
						});
					},

					showVideos = function(videos) {
						$.elements.clearChild(videoListNode);
						var list = $.e("div", {"class": "attacher-list-videos"});
						videos.forEach(function(video) {
							list.appendChild(video.getNodeItem({
								onClick: function() {
									self.add(video).done();
								}
							}));
						});
						videoListNode.appendChild(list);
					};

				tabs = [
					{
						name: "list",
						title: Lang.get("attacher.videoList"),
						content: videoListNode = $.e("div", { append: getLoader() }),
						onOpen: function() {
							loadVideos(showVideos);
						}
					}
				];
				host = new TabHost(tabs, {});

				this.open(button);
				this.modal.setContent(host.getNode());
				break;

			/**
			 * Audio
			 */
			case APIDOG_ATTACHMENT_AUDIO:
				var
					audioListNode,
					audios,
					loadAudios = function(callback) {
						if (audios) {
							return callback(audios);
						}

						api("audio.get", {owner_id: self.ownerId, v: 5.68}).then(function(result) {
							callback(audios = parse(result.items, VKAudio));
							self.saveIntoCache(AttachmentController.mediaCache.audio, result.items);
						});
					},

					showAudios = function(audios) {
						$.elements.clearChild(audioListNode);
						var list = $.e("div", {"class": "attacher-list-audios"});
						audios.forEach(function(audio) {
							list.appendChild(audio.getNodeItem({
								onClick: function() {
									self.add(audio).done();
								}
							}));
						});
						audioListNode.appendChild(list);
					};

				tabs = [
					{
						name: "list",
						title: Lang.get("attacher.audioList"),
						content: audioListNode = $.e("div", { append: getLoader() }),
						onOpen: function() {
							loadAudios(showAudios);
						}
					}
				];
				host = new TabHost(tabs, {});

				this.open(button);
				this.modal.setContent(host.getNode());
				break;


			/**
			 * Document
			 */
			case APIDOG_ATTACHMENT_DOCUMENT:
				var documentListNode,
					documentListGroupNode,
					documents,
					loadDocuments = function(callback, ownerId) {
						if (documents) {
							return callback(documents);
						}

						api("docs.get", {owner_id: ownerId, v: 5.68}).then(function(result) {
							callback(documents = parse(result.items, VKDocument));
							self.saveIntoCache(AttachmentController.mediaCache.doc, result.items);
						}).catch(function(er) {console.error(er)});
					},

					showDocuments = function(documents) {
						$.elements.clearChild(documentListNode);
						$.elements.clearChild(documentListGroupNode);
						var list = $.e("div", {"class": "attacher-list-documents"});
						documents.forEach(function(doc) {
							list.appendChild(doc.getNodeItem({
								onClick: function() {
									self.add(doc).done();
								}
							}));
						});
						documentListNode.appendChild(list);
					};

				tabs = [
					{
						name: "list",
						title: Lang.get("attacher.documentList"),
						content: documentListNode = $.e("div", { append: getLoader() }),
						onOpen: function() {
							loadDocuments(showDocuments, API.userId);
						}
					},
					{
						name: "file",
						title: Lang.get("attacher.documentFile"),
						content: this.createFileForm(typeId)
					},
					{
						name: "url",
						title: Lang.get("attacher.documentURL"),
						content: this.createURLForm(typeId)
					}
				];

				if (self.ownerId < 0) {
					tabs.splice(1, 0, {
						name: "listOwn",
						title: Lang.get("attacher.documentListGroup"),
						content: documentListGroupNode = $.e("div", { append: getLoader() }),
						onOpen: function() {
							loadDocuments(showDocuments, self.ownerId);
						}
					});
				}
				host = new TabHost(tabs, {});

				this.open();
				this.modal.setContent(host.getNode());
				break;

			/**
			 * Link
			 */
			case APIDOG_ATTACHMENT_LINK:
				var field, form = $.e("form", {
					"class": "attacher-url-wrap",
					append: [
						$.e("span", {html: "Вставтье ссылку"}),
						field = $.e("input", {
							type: "url",
							autocomplete: "off"
						})
					]
				});
				var timer, add = function() {
					self.mBundle.setLink(field.value.trim());
					self.done();
					self.modal.close();
				};
				$.event.add(field, "keyup", function() {
					timer && clearTimeout(timer);
					var url = field.value.trim(),
						isCorrect = /^https?:\/\//img.test(url) && url.length > 8;

					if (!isCorrect) {
						return;
					}

					timer = setTimeout(add, 2500);
				});

				$.event.add(form, "submit", function(event) {
					event.preventDefault();
					return false;
				});

				this.open(button);
				this.modal.setContent(form);
				break;

			/**
			 * Timer
			 */
			case APIDOG_ATTACHMENT_TIMER:
				var dateChooser;
				this.open(button);
				this.modal.setTitle("Выбор времени отправки поста")
				    .setWidth(400)
				    .setPadding(true)
				    .setContent((dateChooser = createInputDate({name: "chooseDate"}, this.mBundle.getTimer())).node)
				    .setButtons([
						{
							name: "ok",
							title: "ОК",
							onclick: function () {
								var val = dateChooser.getValue();

								self.mBundle.setTimer(val);
								self.modal.close();
								self.done();
							}
						},
						{
							name: "cancel",
							title: "Отмена",
							onclick: function () {
								self.modal.close();
							}
						}
				    ]);

				if (!this.mBundle.getTimer()) {
					var d = new Date(Date.now() + 3 * 60 * 60 * 1000);
					dateChooser.setCurrentDate(d.getDate(), d.getMonth() + 1, d.getFullYear(), d.getHours(), d.getMinutes() - (d.getMinutes() % 5));
				}
				break;

			/**
			 * Map
			 */
			case APIDOG_ATTACHMENT_MAP:
				var mapNode = $.e("div", {"class": ""}), currentPosition;
				mapNode.style.height = (document.documentElement.clientHeight * .6) + "px";
				this.open(button);
				this.modal.setContent(mapNode);
				this.loadYandexMapsAPILibrary().then(function() {
					ymaps.ready(function() {
						var placemark, map;
						map = new ymaps.Map(mapNode, {
							center: [0, 0],
							zoom: 2,
							yandexMapAutoSwitch: false,
							controls: []
						});

						map.controls.add("typeSelector", {position: {top: 5, left: 5}})
						   .add("zoomControl", {position: {top: 70, left: 5}});

						map.events.add("click", function(event) {
							if (placemark) {
								map.geoObjects.remove(placemark);
							}

							placemark = new ymaps.Placemark(event.get("coords"));

							map.geoObjects.add(placemark);

							currentPosition = event.get("coords");
						});
						ymaps.geolocation.get({provider: "yandex"}).then(function(data) {
							map.setCenter(data.geoObjects.position, 10);
						});
					});
				});
				this.modal.setButton("ok", {
					name: "ok",
					title: Lang.get("attacher.modalOk"),
					onclick: function() {
						if (currentPosition) {
							self.mBundle.setGeo(currentPosition);
						}
						self.modal.close();
						self.done();
					}
				});
				break;
		}
	},

	/**
	 * Create form and field for uploading files
	 * @param {int} typeId
	 * @returns {HTMLElement}
	 */
	createFileForm: function(typeId) {
		var self = this, input, form = $.e("form", {
			"class": "attacher-formfile-wrap",
			append: [
				$.e("div", {
					"class": "attacher-formfile-label",
					html: Lang.get("attacher.fileSelect")
				}),
				input = $.e("input", {
					type: "file",
					name: "file", "class": "attacher-formfile-field"
				})
			]
		});

		input.addEventListener("change", function() {
			uploadFiles(input, {
				maxFiles: self.maxCount - self.mBundle.getCount(),
				method: self.methods[APIDOG_ATTACHMENT_PHOTO === typeId ? "photo" : "document"],
			}, {
				onTaskFinished: function(result) {
					var fx = APIDOG_ATTACHMENT_PHOTO === typeId ? VKPhoto : VKDocument;
					result.forEach(function(item) {
						self.add(new fx(item));
					});
					self.done();
				}
			});
		});

		return form;
	},

	/**
	 * Add event listener for uploading files via Ctrl+V
	 * @param {HTMLTextAreaElement} textarea
	 * @returns {this}
	 */
	registerTextareaEvents: function(textarea) {
		var self = this;
		textarea.addEventListener("paste", function(e) {
			var files = [], isImages = true;

			for (var i = 0, item; item = e.clipboardData.items[i]; i++) {
				if (e.clipboardData.items[i].kind === "file") {
					files.push(item.getAsFile());
					isImages = isImages && ~ item.type.indexOf("image/");
					break;
				}
			}

			if (!files.length) {
				return;
			}

			uploadFiles(files, {
				maxFiles: self.maxCount - self.mBundle.getCount(),
				method: self.methods[isImages ? "photo" : "document"],
			}, {
				onTaskFinished: function(result) {
					var fx = isImages ? VKPhoto : VKDocument;
					result.forEach(function(item) {
						self.add(new fx(item));
					});
					self.done();
				}
			});
		});
		return this;
	},

	chunk: [],

	/**
	 * Create form and field for adding file via URL
	 * @param typeId
	 * @returns {HTMLElement}
	 */
	createURLForm: function(typeId) {
		var self = this,
			field,
			form = $.e("form", {
				"class": "attacher-url-wrap",
				append: [
					$.e("span", {html: "Вставтье ссылку на изображение. Ограничение: 25МБ"}),
					field = $.e("input", {
						type: "url",
						autocomplete: "off"
					})
				]
			}),

			uploadImage = function(url) {
				var target = { method: self.methods[APIDOG_ATTACHMENT_PHOTO === typeId ? "photo" : "document"], params: { access_token: API.accessToken } };
				APIdogRequest("vk.uploadByLink", { link: url, target: JSON.stringify(target) }).then(function(attach) {
					var fx = attach.type === "photo" ? VKPhoto : VKDocument;
					self.add(new fx(attach));
					self.done();
				});
			}.bind(this);

		var upload = function() {
			var url = field.value.trim(),
				isCorrect = /^https?:\/\//img.test(url) && url.length > 12,
				testImage;

			if (!isCorrect) {
				return;
			}

			field.disabled = true;
			testImage = new Image();
			testImage.addEventListener("error", function() {
				alert("invalid link: not image");
				field.disabled = false;
			});

			testImage.addEventListener("load", function() {
				uploadImage(url);
			});

			testImage.src = url;

		};

		$.event.add(field, "keyup", upload);

		$.event.add(form, "submit", function(event) {
			event.preventDefault();
			return false;
		});

		return form;
	},

	add: function(object) {
		this.mBundle.add(object);
		this.chunk.push(object);
		return this;
	},

	remove: function(object) {
		this.mBundle.remove(object);
		this.chunk.splice(this.chunk.indexOf(object), 1);
		return this;
	},

	done: function() {
		this.chunk.length && this._onSelect && this._onSelect(this.chunk);
		this.chunk = [];
		this.modal && this.modal.close();

		this.updatePreview();

		return this;
	},

	/**
	 * Parse already existing attachments (for editing)
	 * @param {Attachment[]} items
	 * @returns {AttachmentController}
	 */
	parse: function(items) {
		if (!items) {
			return this;
		}

		var types = {
			photo: VKPhoto,
			video: VKVideo,
			audio: VKAudio,
			doc: VKDocument,
			link: VKLink
		};

		items.forEach(function(item) {
			var a = item[item.type];
			AttachmentController.mediaCache[item.type][a.owner_id + "_" + a.id] = a;
			this.add(new (types[item.type])(item[item.type]));
		}, this);

		this.done();
	},

	loadYandexMapsAPILibrary: function() {
		return new Promise(function(resolve) {
			var YandexAPI = "//api-maps.yandex.ru/2.1/?lang=ru_RU",
				scripts = document.getElementsByTagName("script"),
				s = $.e("script", {type: "text/javascript", src: YandexAPI, onload: resolve});

			for (var i = 0; i < scripts.length; ++i) {
				if (scripts[i].src === YandexAPI) {
					return resolve();
				}
			}

			getHead().appendChild(s);
		});
	},

	updatePreview: function() {
		$.elements.clearChild(this.getNodePreview());

		var self = this, preview = self.getNodePreview();

		this.mBundle.get().forEach(function(attach) {
			preview.appendChild(attach.getNodeItem({
				onClick: function(ownerId, itemId, object, event) {
					event.preventDefault();
					event.stopPropagation();
					event.cancelBubble = true;
					VKConfirm("Убрать из прекреплений?", function() {
						self.remove(object).done();
					});
					return false;
				}
			}));
		});

		if (this.mBundle.getLink()) {
			preview.appendChild(VKLink.fromString(this.mBundle.getLink()).getNodeItem({
				onClick: function(ownerId, itemId, object, event) {
					event.preventDefault();
					event.stopPropagation();
					event.cancelBubble = true;
					VKConfirm("Убрать из прекреплений?", function() {
						self.mBundle.setLink(null);
						self.done();
					});
					return false;
				}
			}));
			this.mTypeChooser.get(APIDOG_ATTACHMENT_LINK).disable().commit();
		} else {
			this.mTypeChooser.get(APIDOG_ATTACHMENT_LINK).enable().commit();
		}

		if (this.mBundle.getTimer()) {
			preview.appendChild($.e("div", {"class": "attach-row-wrap", append: [
				$.e("div", {"class": "attach-row-icon-wrap", append: $.e("div", { "class": "attach-row-icon attach-icon-link" })}),
				$.e("div", {"class": "attach-row-title", html: "Таймер"}),
				$.e("div", {"class": "attach-row-description", html: $.getDate(this.mBundle.getTimer())}),
			], onclick: function() {
				VKConfirm("Убрать из прекреплений?", function() {
					self.mBundle.setTimer(null);
					self.done();
				});
				return false;
			}}));
			this.mTypeChooser.get(APIDOG_ATTACHMENT_TIMER).disable().commit();
		} else {
			this.mTypeChooser.get(APIDOG_ATTACHMENT_TIMER).enable().commit();
		}

		if (this.mBundle.getGeo()) {
			preview.appendChild(Wall.getGeoAttachment({coordinates: this.mBundle.getGeo().join(" "), onClick: function(event) {
				event.preventDefault();
				VKConfirm("Убрать из прекреплений?", function() {
					self.mBundle.setGeo(null);
					self.done();
				});
				return false;
			}}, true));
			this.mTypeChooser.get(APIDOG_ATTACHMENT_MAP).disable().commit();
		} else {
			this.mTypeChooser.get(APIDOG_ATTACHMENT_MAP).enable().commit();
		}
	}
};

AttachmentController.langs = {
	"1": "attacher.typePhoto",
	"2": "attacher.typeVideo",
	"4": "attacher.typeAudio",
	"8": "attacher.typeDocument",
	"16": "attacher.typeMap",
	"32": "attacher.typePoll",
	"64": "attacher.typeLink",
	"128": "attacher.typeNote",
	"256": "attacher.typePage",
	"512": "attacher.typeAlbum",
	"1024": "attacher.typeTimer",
	"2048": "attacher.typeSticker"
};


/**
 *
 * @param {{url: string, preview_page: string=, title: string=}} p
 * @constructor
 */
function VKLink(p) {
	this.url = p.url;
	this.title = (p.title || "");
	this.previewPage = p.preview_page;
	this.shortlink = this.getShortLink();
}

VKLink.fromString = function(url) {
	return new VKLink({title: "Ссылка", url: url});
};

VKLink.prototype = {
	getNodeItem: function(options) {
		options = options || {};
		var self = this;

		return getRowAttachment({
			link: this.previewPage ? "#page" + this.previewPage + "?site=1" : this.getSafeLink(),
			title: this.title,
			icon: "link",
			subtitle: this.shortlink.safe(),
			isBlank: true,
			onClick: function(event) {
				if (options.onClick) {
					event.preventDefault();
					options.onClick(0, 0, self, event);
					return false;
				}

				if (self.previewPage && event.ctrlKey) {
					this.href = self.url;
				}

				return true;
			}
		});


	},

	getShortLink: function() {
		var link;
		try {
			link = this.url.match(/\/\/([^\/]+)(\/|$)/igm)[0].replace(/\//g, "");
		} catch (e) {
			link = this.url;
		}
		return link;
	},

	getSafeLink: function() {
		return this.url.replace(/https?:\/\/(m\.)?vk\.com\//ig, "\/\/apidog.ru\/#");
	}
};

/**
 * @param {{
 *   link: string
 *   title: string,
 *   subtitle: string=,
 *   onClick: function=,
 *   icon: string=,
 *   context: object=,
 *   isBlank: boolean=
 * }} options
 */
function getRowAttachment(options) {
	var link;
	link = $.e("a", {
		"class": "attach-row-wrap",
		href: options.link,
		onclick: function(event) {
			if (options.onClick) {
				options.onClick.call(link, event, options.context);
				return false;
			}
			return true;
		},
		append: [
			$.e("div", {"class": "attach-row-icon-wrap", append: $.e("div", { "class": "attach-row-icon attach-icon-" + options.icon })}),
			$.e("div", {"class": "attach-row-content", append: [
				$.e("div", {"class": "attach-row-title", html: options.title.safe()}),
				$.e("div", {"class": "attach-row-description", html: options.subtitle.safe()})
			]})
		]
	});

	if (options.isBlank) {
		link.target = "_blank";
	}

	return link;
}


/**
 * Attachment choose window
 * Created 12.01.2016
 */

function AttachmentBundle() {
	this.mList = [];
	this.mGeo = null;
	this.mLink = null;
	this.clear();
}

AttachmentBundle.prototype = {

	mList: [],

	mGeo: null,

	mLink: null,

	mTimer: null,

	getString: function() {
		var list = this.mList.map(function(item) {
			return item.getAttachId();
		});

		if (this.mLink) {
			list.push(this.mLink);
		}

		return list.join(",");
	},

	add: function(item) {
		this.mList.push(item);
		return this;
	},

	getCount: function() {
		return this.mList.length;
	},

	get: function() {
		return this.mList;
	},

	remove: function(item) {
		if (typeof item === "object") {
			item = this.mList.indexOf(item);
			if (!~item) {
				return this;
			}
		}
		this.mList.splice(item, 1);
		return this;
	},

	getGeo: function() {
		return this.mGeo;
	},

	setGeo: function(coordinates) {
		this.mGeo = coordinates;
		return this;
	},

	getTimer: function() {
		return this.mTimer;
	},

	setTimer: function(date) {
		this.mTimer = date;
		return this;
	},

	setLink: function(link) {
		this.mLink = link;
		return this;
	},

	getLink: function() {
		return this.mLink;
	},

	clear: function() {
		this.mList = [];
		return this;
	}

};