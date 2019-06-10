function VKPhoto (p) {
	var photo = this;
	this.ownerId = p.owner_id;
	this.photoId = p.id;
	this.albumId = p.album_id;

	if ("sizes" in p) {
		p.sizes.forEach(function(item) {
			if (item.type in VKPhoto.__assocKeys) {
				p["photo" + VKPhoto.__assocKeys[item.type]] = item.src;
			}
		});
	} else {
		this.photo75 = p.photo_75;
		this.photo130 = p.photo_130;
		this.photo604 = p.photo_604;
		this.photo807 = p.photo_807;
		this.photo1280 = p.photo_1280;
		this.photo2560 = p.photo_2560;
	}

	this.width = p.width;
	this.height = p.height;

	this.description = p.text;
	this.date = p.date;

	this.latitude = p.lat;
	this.longitude = p.long;

	this.postId = p.post_id;
	this.tags = p.tags;

	this.isLiked = !!(p.likes && p.likes.user_likes);
	this.likesCount = p.likes && p.likes.count;

	this.canComment = !!p.can_comment;
	this.commentsCount = p.comments && p.comments.count || 0;

	this.canRepost = !!p.can_repost;
}

VKPhoto.__assocKeys = {
	s: 75, m: 130, x: 604, y: 807, z: 1280, w: 2560
};

VKPhoto.prototype = {

	getAttachId: function() {
		return this.getType() + this.getId();
	},

	getType: function() {
		return "photo";
	},

	getId: function() {
		return this.ownerId + "_" + this.photoId;
	},

	/**
	 * Returns the largest photo (original)
	 * @return {string} URL photo
	 */
	getMaxSizePhotoURL: function() {
		return this.photo2560 || this.photo1280 || this.photo807 || this.photo604;
	},

	getNode: function() {
		//return $("<a href='/photo" + this.getId() + "' onclick='return go(this, event);'><img src='" + this.photo807 + "' alt='' /></a>");
	},

	getNodeItem: function(options) {
		options = options || {};
		var e = $.e, wrap = e("div", {"class": "attacher-photo-item", append: e("img", {src: this.photo604})}), self = this;

		if (options.onClick) {
			$.event.add(wrap, "click", function(event) {
				options.onClick(self.ownerId, self.photoId, self, event);
			});
		}

		return wrap;
	}
};

function VKPhotoAlbum(a) {
	this.ownerId = a.owner_id;
	this.albumId = a.id || a.album_id;
	this.title = a.title;
	this.description = a.description;
	this.size = a.size;
	this.thumbnail = a.thumb_src;
	this.dateCreated = a.created;
	this.dateUpdated = a.updated;
}

VKPhotoAlbum.prototype = {

	getType: function() {
		return "album";
	},

	getId: function() {
		return this.albumId;
	},

	/**
	 * Return VK-styled ID
	 * @returns {string}
	 */
	getAttachId: function() {
		return this.getType() + this.ownerId + "_" + this.getId();
	},

	/**
	 *
	 * @param {{onClick: function}} options
	 * @returns {*}
	 */
	getNodeItem: function(options) {
		options = options || {};
		var e = $.e,
			self = this,
			node = e("div", {
				"class": "attacher-album-item",
				style: "background: url(" + this.thumbnail + ") no-repeat; background-size: cover;",
				append: e("div", {"class": "attacher-album-title", html: this.title.safe()})
			});

		if (options.onClick) {
			$.event.add(node, "click", function(event) {
				options.onClick(self.ownerId, self.albumId, self, event);
			});
		}

		return node;
	}
};

var Photos = {

	route: function(url) {
		var result, ownerId, id, act = Site.get("act"), offset = getOffset();

		if (/^photos(-?\d+)?$/img.test(url)) {
			result = /^photos(-?\d+)?$/img.exec(url);
			id = Math.floor(result[1] || API.userId);

			switch (act) {
				case "all":
					return Photos.requestAllPhotos(id, offset).then(Photos.showAlbum);

				case "tagged":
					return Photos.requestUserTagged(id, offset).then(Photos.showAlbum);

				case "new_tags":
					return Photos.requestNewTags(offset).then(Photos.showAlbum);

				default:
					return Photos.getAlbums(id, offset).then(Photos.showAlbums);
			}
		} else if (/^photos(-?\d+)_(-?\d+)$/img.test(url)) {
			result = /^photos(-?\d+)_(-?\d+)$/img.exec(url);
			ownerId = result[1];
			id = result[2];

			return Photos.requestAlbum(ownerId, id, getOffset()).then(Photos.showAlbum);
		} else {
			result = /^photo(-?\d+)_(\d+)$/img.exec(url);
			ownerId = parseInt(result[1]);
			id = parseInt(result[2]);
			var accessKey = Site.get("accessKey");
			var list = Site.get("list");

			return Photos.requestPhoto(ownerId, id, accessKey, list).then(Photos.showPhoto);
		}
	},


	/* Helper */

	/** @deprecated */
	normalizePhoto: function(photo) {
		return photo;
	},

	getAttachment: function(photo, options) {
		return Photos.itemPhoto(photo, {list: options.list, wall: options.full, from: getAddress(true)});
	},

	/**
	 * @param {PhotoAlbum|{thumb: {photo_604: string, photo_big: string}}} album
	 * @deprecated
	 * @returns {HTMLElement|Node}
	 */
	getAttachmentAlbum: function(album) {
		return $.e("a", {href: "#photos" + album.owner_id + "_" + album.id, "class": "attachments-album", append: [
			$.e("img", {src: getURL(album.thumb.photo_604 || album.thumb.photo_big)}),
			$.e("div", {"class": "attachments-album-footer sizefix", append: [
				$.e("div", {"class": "fr", html:album.size}),
				$.e("div", {"class": "attachments-album-title sizefix", html: album.title.safe()}),
			]})
		]});
	},

	/**
	 *
	 * @param {int} ownerId
	 * @returns {HTMLElement|Node}
	 */
	getTabs: function(ownerId) {
		var tabs = [
			["photos" + ownerId + "?act=all", Lang.get("photos.albums_all_photos")],
			["photos" + ownerId, Lang.get("photos.albums")]
		];

		ownerId > 0 && tabs.push(["photos" + ownerId + "?act=tagged", Lang.get("photos.albums_tagged")]);

		if (ownerId === API.userId && Site.counters && Site.counters.photos > 0) {
			tabs.push(["photos" + ownerId + "?act=new_tags", "Отметки", Site.counters.photos]);
		}

		return Site.getTabPanel(tabs);
	},

	ALBUMS_PER_PAGE: 40,

	ALBUM_ID: {
		PROFILE: -6,
		WALL: -7,
		SAVED: -15
	},

	/**
	 * Get albums
	 * @param {int} ownerId
	 * @param {int} offset
	 */
	getAlbums: function(ownerId, offset) {
		return api("photos.getAlbums", {
			owner_id: ownerId,
			offset: offset,
			need_system: 1,
			need_covers: 1,
			count: Photos.ALBUMS_PER_PAGE,
			v: 5.56
		}).then(function(res) {
			res.ownerId = ownerId;
			res.offset = offset;
			return res;
		});
	},

	/**
	 * @param {{count: int, items: Photo[], ownerId: int=, offset: int=}} data
	 */
	showAlbums: function(data) {
		var list = $.e("div", {
				append: data.items.map(function(album) {
					return Photos.itemAlbum(album);
				})
			}),
			ownerId = data.ownerId,
			offset = data.offset,
			menu = {
				allComments: {
					label: "Все комментарии",
					onclick: function() {
						window.location.hash = "#photos" + ownerId + "?act=comments"
					}
				}
			};

		if (ownerId === API.userId || (Local.data[ownerId] && Local.data[ownerId].is_admin)) {
			menu.createAlbum = {
				label: Lang.get("photos.albums_actions_create"),
				onclick: function() {
					Photos.createAlbum(ownerId);
				}
			};
		}


		Site.append($.e("div", {append: [
				Photos.getTabs(ownerId),
				Site.getPageHeader(data.count + " " + Lang.get("photos", "albums_count", data.count),
					new DropDownMenu(Lang.get("general.actions"), menu).getNode()
				),
				list,
				Site.getSmartPagebar(offset, data.count, Photos.ALBUMS_PER_PAGE)
			]}));
		Site.setHeader(Lang.get("photos.albums"));
	},

	/**
	 * @param {PhotoAlbum} album
	 * @returns {HTMLElement|Node}
	 */
	itemAlbum: function(album) {
		var img = $.e("div", {"class": "albums-left", "data-size": album.size}),
			e = $.e;

		//noinspection JSPrimitiveTypeWrapperUsage
		img.style.backgroundImage = "url(" + getURL(album.thumb_src) + ")";

		return e("a", {
			"class": "albums-item",
			href: "#photos" + album.owner_id + "_" + album.id,
			append: [
				img,
				e("div", {"class": "albums-info", append: [
					e("div", {"class": "bold", html: album.title.safe()}),
					album.updated
						? e("div", {
							"class": "albums-created",
							html: Lang.get("photos.album_updated") + " " + new Date(album.updated * 1000).long()
						})
						: null
				]})
			]
		});
	},

	/**
	 * @param {int} ownerId
	 */
	createAlbum: function (ownerId) {
		Photos.editAlbumPage(ownerId, 0);
	},

	albumInfo: {},
	listContent: {},
	albumContent: {},


	ITEMS_PER_PAGE: 50,

	/**
	 *
	 * @param {int} offset
	 * @returns {int}
	 * @private
	 */
	__getChunkIdByOffset: function(offset) {
		return Math.floor(offset / 100);
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {int} offset
	 * @param {{count: int, items: Photo[]}} data
	 * @param {PhotoAlbum=} album
	 */
	putAlbumContent: function(ownerId, albumId, offset, data, album) {
		var key = ownerId + "_" + albumId;

		if (!Photos.albumContent[key]) {
			Photos.albumContent[key] = [];
		}

		Photos.albumContent[key][Photos.__getChunkIdByOffset(offset)] = data;

		if (album) {
			Photos.albumInfo[albumId] = album;
		}
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {int=} offset
	 * @returns {null|{count: int, items: Photo[]}}
	 */
	getAlbumContent: function(ownerId, albumId, offset) {
		var key, data;

		key = ownerId + "_" + albumId;
		data = Photos.albumContent[key];

		if (!data) {
			return null;
		}

		return offset === undefined ? data : data[Photos.__getChunkIdByOffset(offset)];
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @returns {int}
	 */
	getAlbumSize: function(ownerId, albumId) {
		if (this.albumInfo[ownerId + "_" + albumId]) {
			return this.albumInfo[ownerId + "_" + albumId].size;
		}

		var chunks = this.getAlbumContent(ownerId, albumId);
		for (var i = 0, l = chunks.length; i < l; ++i) {
			if (chunks[i]) {
				return chunks[i].count;
			}
		}
		return NaN;
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {int} newSize
	 */
	setAlbumSize: function(ownerId, albumId, newSize) {
		if (this.albumInfo[ownerId + "_" + albumId]) {
			this.albumInfo[ownerId + "_" + albumId].size = newSize;
		}

		var chunks = this.getAlbumContent(ownerId, albumId);
		for (var i = 0, l = chunks.length; i < l; ++i) {
			if (chunks[i]) {
				chunks[i].count = newSize;
			}
		}
	},

	/**
	 * Добавляет фотографии в нужный чанк альбома.
	 * Возвращет новую длину альбома после вставки фотографий.
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {Photo[]} photos
	 * @returns {int}
	 */
	pushNewPhotos: function(ownerId, albumId, photos) {
		var chunks = this.getAlbumContent(ownerId, albumId), lastChunk;

		var size;
		if (!(lastChunk = chunks[chunks.length - 1])) {
			size = Photos.getAlbumSize(ownerId, albumId);
		} else {
			photos.forEach(function () {
				lastChunk.items.push(photos);
			});
			size = (chunks.length - 1) * 100 + photos.length;
		}

		this.setAlbumSize(ownerId, albumId, size);
		return size;
	},

	/**
	 * @param {string} list
	 * @param {int} offset
	 * @param {{count: int, items: Photo[]}} data
	 */
	putListContent: function(list, offset, data) {
		if (!Photos.listContent[list]) {
			Photos.listContent[list] = [];
		}

		Photos.listContent[list][Photos.__getChunkIdByOffset(offset)] = data;
	},

	/**
	 * Возвращает нужный чанк с фотками из листа по сдвигу
	 * @param {string} key
	 * @param {int=} offset
	 * @returns {{count: int, items: Photo[]}|null}
	 */
	getListContent: function(key, offset) {
		var data = Photos.listContent[key];

		if (!data) {
			return null;
		}

		return offset === undefined ? data : data[Photos.__getChunkIdByOffset(offset)];
	},

	/**
	 * @param {string} list
	 * @returns {int}
	 */
	getListSize: function(list) {
		var chunks = this.getListContent(list);
		for (var i = 0, l = chunks.length; i < l; ++i) {
			if (chunks[i]) {
				return chunks[i].count;
			}
		}
		return NaN;
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {int} photoId
	 * @returns {int}
	 */
	getRealOffsetInAlbumByPhoto: function(ownerId, albumId, photoId) {
		var albumChunks = this.albumContent[ownerId + "_" + albumId];

		if (!albumChunks) {
			return -1;
		}

		for (var i = 0, l = albumChunks.length; i < l; ++i) {
			if (!albumChunks[i]) {
				continue
			}
			for (var j = 0, k = albumChunks[i].items.length; j < k; ++j) {
				if (albumChunks[i].items[j].id === photoId) {
					return i * 100 + j;
				}
			}
		}

		return -1;
	},

	/**
	 * Ищет чанк в альбоме по фотке
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {int} photoId
	 * @returns {{count: int, items: Photo[]}|null}
	 */
	getChunkContentByAlbum: function(ownerId, albumId, photoId) {
		return this.__getChunkContentInList(this.albumContent[ownerId + "_" + albumId], photoId);
	},

	/**
	 * Ищет чанк в листе по фотке
	 * @param {string} list
	 * @param {int} photoId
	 * @returns {{count: int, items: Photo[]}|null}
	 */
	getChunkContentByList: function(list, photoId) {
		return this.__getChunkContentInList(this.listContent[list], photoId);
	},

	/**
	 * Ищет чанк в списке альбома или листа по фотке
	 * @param {{count: int, items: Photo[]}[]} data
	 * @param {int} photoId
	 * @returns {{count: int, items: Photo[]}|null}
	 * @private
	 */
	__getChunkContentInList: function(data, photoId) {
		for (var i = 0, l = data.length; i < l; ++i) {
			if (!data[i]) {
				continue
			}
			for (var j = 0, k = data[i].items.length; j < k; ++j) {
				if (data[i].items[j].id === photoId) {
					return data[i];
				}
			}
		}
		return null;
	},

	photo2album: {},

	/**
	 * Сохраняет ассоциацию между фото и альбомом
	 * @param {Photo|Photo[]} photo
	 */
	putPhotoForAlbum: function(photo) {
		if (Array.isArray(photo)) {
			photo.forEach(Photos.putPhotoForAlbum);
			return;
		}

		this.photo2album[photo.id] = photo.album_id;
	},

	/**
	 * Возвращает идентификтор альбома, в которой находится фото
	 * @param {int|Photo} photo
	 * @returns {int|null}
	 */
	getAlbumIdByPhotoId: function(photo) {
		if (typeof photo === "object") {
			photo = photo.id;
		}
		return this.photo2album[photo];
	},

	CUSTOM_ALBUMS: {
		ALL_PHOTOS: function(ownerId) {
			return {id: 0, owner_id: ownerId, list: "all" + ownerId, title: Lang.get("photos.photos_all")};
		},
		TAGGED: function(ownerId) {
			return {id: 0, owner_id: ownerId, list: "tagged" + ownerId, title: "Отмеченные фотографии"};
		},
		NEW_TAGGED: function() {
			return {id: 0, owner_id: API.userId, list: "newTags", title: "Новые отметки"};
		}
	},

	__init: function() {
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {int} offset
	 * @returns {Promise<{album: PhotoAlbum, count: int, items: Photo[], offset: int}>}
	 */
	requestAlbum: function(ownerId, albumId, offset) {
		return new Promise(function(resolve, reject) {
			var data;

			if (data = Photos.getAlbumContent(ownerId, albumId, offset)) {
				resolve({
					album: Photos.albumInfo[albumId],
					count: data.count,
					items: data.items,
					offset: offset
				});
				return;
			}

			api("execute", {
				code: "var h=parseInt(Args.h),a=parseInt(Args.a),o=parseInt(Args.o);return{data:API.photos.get({owner_id:h,album_id:a,extended:1,v:5.56,offset:o,count:100}),album:API.photos.getAlbums({owner_id:h,album_ids:a,v:5.56}).items[0]};",
				h: ownerId,
				a: albumId,
				o: Math.floor(offset / 100) * 100
			}).then(function(data) {
				Photos.putAlbumContent(ownerId, albumId, offset, data.data, data.album);
				resolve({
					album: data.album,
					count: data.data.count,
					items: data.data.items,
					offset: offset
				});
			}).catch(reject);
		});
	},

	/**
	 * @param {int} ownerId
	 * @param {int} offset
	 * @returns {Promise<{album: PhotoAlbum, count: int, items: Photo[], offset: int}>}
	 */
	requestAllPhotos: function(ownerId, offset) {
		var data, listName = "all" + ownerId;

		return new Promise(function(resolve, reject) {
			if (data = Photos.getListContent(listName, offset)) {
				resolve({
					album: Photos.CUSTOM_ALBUMS.ALL_PHOTOS(ownerId),
					list: listName,
					count: data.count,
					items: data.items,
					offset: offset
				});
				return;
			}

			api("photos.getAll", {
				owner_id: ownerId,
				offset: Math.floor(offset / 100) * 100,
				extended: 1,
				count: 100,
				v: 5.56
			}).then(function(data) {

				Photos.putListContent(listName, offset, data);
				resolve({
					album: Photos.CUSTOM_ALBUMS.ALL_PHOTOS(ownerId),
					list: listName,
					count: data.count,
					items: data.items,
					offset: offset
				});
			}).catch(reject);
		});
	},

	/**
	 * @param {int} ownerId
	 * @param {int} offset
	 */
	requestUserTagged: function(ownerId, offset) {
		var data, listName = "tagged" + ownerId;
		return new Promise(function(resolve, reject) {
			if (data = Photos.getListContent(listName, offset)) {
				resolve({
					album: Photos.CUSTOM_ALBUMS.TAGGED(ownerId),
					list: listName,
					count: data.count,
					items: data.items,
					offset: offset
				});
				return;
			}

			api("photos.getUserPhotos", {
				user_id: ownerId,
				offset: offset,
				count: 100,
				extended: 1,
				sort: 0,
				v: 5.56
			}).then(function(data) {
				Photos.putListContent(listName, offset, data);
				resolve({
					album: Photos.CUSTOM_ALBUMS.TAGGED(ownerId),
					list: listName,
					count: data.count,
					items: data.items,
					offset: offset
				});
			}).catch(function() {
				Site.append(Site.getEmptyField(Lang.get("photos", "photos_access_denied_userphotos")));
				Site.setHeader("Назад", {link: "photos" + ownerId});
				reject();
			});
		});
	},

	requestNewTags: function(offset) {
		var listName = "newTags";
		return new Promise(function(resolve, reject) {
			if (data = Photos.getListContent(listName, offset)) {
				resolve({
					album: Photos.CUSTOM_ALBUMS.NEW_TAGGED(),
					list: listName,
					count: data.count,
					items: data.items,
					offset: offset
				});
				return;
			}

			api("photos.getNewTags", {
				offset: offset,
				count: 100,
				v: 5.56
			}).then(function (data) {
				Photos.putListContent(listName, offset, data);
				resolve({
					album: Photos.CUSTOM_ALBUMS.NEW_TAGGED(),
					list: listName,
					count: data.count,
					items: data.items,
					offset: offset
				});
			}).catch(reject);
		});
	},


	/**
	 * @param {{album: PhotoAlbum, count: int, items: Photo[], offset: int}} data
	 */
	showAlbum: function(data) {
		var album = data.album,

			items = data.items,

			ownerId = album.owner_id,
			albumId = album.id,

			parent = $.e("div"),
			list = $.e("div"),

			menu = {};


		if (albumId) {
			menu.comments = {
				label: Lang.get("photos.photos_comments_album"),
				onclick: function() {
					window.location.hash = "#photos" + ownerId + "?act=comments&albumId=" + albumId;
				}
			};
		}

		if (albumId > 0) {
			menu.edit = {
				label: Lang.get("photos.photos_edit_album"),
				onclick: Photos.editAlbumPage.bind(Photos, ownerId, albumId)
			};

			menu.deleteAlbum = {
				label: Lang.get("photos.photos_delete_album"),
				onclick: function() {
					VKConfirm(Lang.get("photos.photos_delete_album_confirm"), function() {
						api("photos.deleteAlbum", {
							owner_id: ownerId,
							album_id: albumId
						}).then(function() {
							Site.Alert({text: Lang.get("photos.photos_delete_album_success")});
							window.location.hash = "#photos" + ownerId;
						});
					});
				}
			};
		}

		parent.appendChild(Site.getPageHeader(data.count + " " + Lang.get("photos", "photos_count", data.count),
			Sugar.Object.size(menu)
				? new DropDownMenu(Lang.get("general.actions"), menu).getNode()
				: null
		));

		if (albumId > 0 && (ownerId === API.userId || album.can_upload)) {
			parent.appendChild(Site.createTopButton({
				tag: "div",
				title: Lang.get("photos.photos_upload"),
				onclick: function() {
					Photos.chooseFilesForUpload(ownerId, albumId);
				}
			}));
		}

		if (!data.count) {
			list.appendChild(Site.getEmptyField(Lang.get("photos.photos_empty")));
		} else {
			//for (var i = data.offset, l = Math.min(data.offset + Photos.ITEMS_PER_PAGE, data.count); i < l; ++i) {
			for (var i = data.offset % 100, l = ((data.offset + Photos.ITEMS_PER_PAGE) % 100) || 100; i < l; ++i) {
				if (!items[i]) {
					continue;
				}

				Photos.putPhotoForAlbum(items[i]);

				list.appendChild(Photos.itemPhoto(items[i], {
					likes: true,
					comments: true,
					list: album.list
				}));
			}
		}

		parent.appendChild(list);
		parent.appendChild(Site.getSmartPagebar(data.offset, data.count, Photos.ITEMS_PER_PAGE));
		Site.append(parent);
		Site.setHeader(album.title, {link: "photos" + ownerId});

	},


	/**
	 * @param {Photo} photo
	 * @param {{accessKey: string=, list: string=, likes: boolean=, comments: boolean=}} opts
	 * @returns {HTMLElement|Node}
	 */
	itemPhoto: function(photo, opts) {
		opts = opts || {};
		var item, image,
			list = opts && opts.list,
			params = {};

		if (photo.access_key) {
			params.accessKey = photo.access_key;
		}

		if (list) {
			params.list = list;
		}

		params = httpBuildQuery(params);

		//noinspection JSUnusedAssignment
		item = $.e("a", {
			"class": "photos-item",
			href: "#photo" + photo.owner_id + "_" + photo.id + (params ? "?" + params : ""),
			append: image = $.e("img", {src: getURL(photo.photo_604) })
		});

		/*var likes;
		likes = (opts && opts.likes && photo.likes && photo.likes.count > 0);
		item.appendChild($.e("div", {"class": "photos-likes photos-tips" + (!likes ? " hidden" : ""), append: [
			$.e("div", {"class": "wall-icons likes-icon" + (photo.likes && !photo.likes.user_likes ? "-on" : "")}),
			$.e("span", {html: " " + (photo.likes && photo.likes.count), id: "minilike-count_" + photo.owner_id + "_" + photo.id})
		]}));
		likes = false;
		likes = opts && opts.comments && photo.comments && photo.comments.count > 0;
		item.appendChild($.e("div", {"class": "photos-comments photos-tips" + (!likes ? " hidden" : ""), append: [
			$.e("div", {"class": "wall-icons wall-comments"}),
			$.e("span", {html: " " + (photo.comments && photo.comments.count)})
		]}));*/

		return item;
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 */
	chooseFilesForUpload: function(ownerId, albumId) {
		var node = $.e("input", {
			type: "file",
			multiple: true,
			accept: "image/*",
			onchange: function() {
				Photos.upload(ownerId, albumId, node);
			}
		});
		node.click();
	},

	/**
	 * @param {int} ownerId
	 * @param {int} albumId
	 * @param {HTMLElement|Node} node
	 */
	upload: function(ownerId, albumId, node) {
		uploadFiles(node, {
			maxFiles: 50,
			method: "photos.getUploadServer",
			params: {
				group_id: ownerId < 0
					? -ownerId
					: 0,
				album_id: albumId
			}
		}, {
			onTaskFinished: function(result) {

				Site.Alert({
					text: Lang.get("photos", "album_uploaded_success", result.length) + " " + result.length + " " + Lang.get("photos", "album_uploaded_photos", result.length) + "!"
				});

				var size = Photos.pushNewPhotos(ownerId, albumId, result.map(Photos.normalizePhoto));

				window.location.hash = "#photos" + ownerId + "_" + albumId +
					"?offset=" + (size ? (Math.floor(size / Photos.ITEMS_PER_PAGE) * Photos.ITEMS_PER_PAGE) : 0);
			}
		});
	},

	DEFAULT_PRIVACY_ITEMS: [
		{value: "all", html: "photo.editAlbumPrivacyAll"},
		{value: "friends", html: "photo.editAlbumPrivacyFriends"},
		{value: "friends_of_friends", html: "photo.editAlbumPrivacyFriendOfFriends"},
		{value: "friends_of_friends_only", html: "photo.editAlbumPrivacyFriendsOfFriendsOnly"},
		{value: "nobody", html: "photo.editAlbumPrivacyNobody"},
		{value: "custom", html: "photo.editAlbumPrivacyCustom"}
	],

	editAlbumPage: function(ownerId, albumId) {
		var handle = function(data) {
			/** @type {PhotoAlbum} */
			var album = data.album;

			var items = [
				{
					type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
					name: "title",
					title: "photo.editAlbumTitle",
					value: album.title
				},
				{
					type: APIDOG_UI_EW_TYPE_ITEM_TEXTAREA,
					name: "description",
					title: "photo.editAlbumDescription",
					value: album.description
				}
			];

			if (ownerId > 0) {
				items.push({
					type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
					name: "privacy_view",
					title: "photo.editAlbumPrivacyView",
					items: Photos.DEFAULT_PRIVACY_ITEMS,
					value: album.privacy_view
				});
				items.push({
					type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
					name: "privacy_comment",
					title: "photo.editAlbumPrivacyComment",
					items: Photos.DEFAULT_PRIVACY_ITEMS,
					value: album.privacy_comment
				});
			} else {
				items.push({
					type: APIDOG_UI_EW_TYPE_ITEM_CHECKBOX,
					name: "upload_by_admins_only",
					title: "photo.editAlbumUploadOnlyAdmins",
					checked: album.upload_by_admins_only
				});
				items.push({
					type: APIDOG_UI_EW_TYPE_ITEM_CHECKBOX,
					name: "comments_disabled",
					title: "photo.editAlbumDisabledComments",
					checked: album.comments_disabled
				});
			}

			new EditWindow({
				title: "photo.editAlbumWindowTitle",
				isEdit: true,
				items: items,
				onSave: function(values, modal) {
					values.owner_id = ownerId;
					albumId && (values.album_id = albumId);
					values.v = 5.56;
					api(albumId ? "photos.editAlbum" : "photos.createAlbum", values)
						.then(function() {
							modal.setContent(Site.getEmptyField("photo.editAlbumSuccess")).setFooter("").closeAfter(1500);
							album.title = values.title;
							album.description = values.description;
							!albumId && Site.route();
						});
				}
			});
		};

		if (albumId) {
			Photos.requestAlbum(ownerId, albumId, -1).then(handle);
		} else {
			handle({album: {title: "", description: "", privacy_view: ["all"], privacy_comment: ["all"]}});
		}
	},

	/** @deprecated */
	photos: {},

	/** @deprecated */
	access_keys: {},

	/** @deprecated */
	lists: {},

	/**
	 *
	 * @param ownerId
	 * @param photoId
	 * @param accessKey
	 * @param list
	 * @returns {Promise<{
	 *     ownerId: int,
	 *     photoId: int,
	 *     albumId: int=,
	 *     accessKey: string=,
	 *     list: string=,
	 *     chunk: {
	 *         count: int,
	 *         items: Photo[]
	 *     },
	 *     previous: Photo|null,
	 *     current: Photo,
	 *     next: Photo|null,
	 *     position: int
	 * }>}
	 */
	requestPhoto: function(ownerId, photoId, accessKey, list) {
		return new Promise(function(resolve, reject) {
			var chunk, position, result, prev, next, size, realOffset = -1;

			result = { ownerId: ownerId, photoId: photoId, accessKey: accessKey };

			if (list) {
				chunk = Photos.getChunkContentByList(list, photoId);

				if (!chunk) {
					// TODO: if that list not exists (for example, direct enter)
					return;
				}

				position = chunk.items.map(function(photo) {
					return photo.id;
				}).indexOf(photoId);

				size = Photos.getListSize(list);

				if (position - 1 < 0 && size > 2) {
					prev = null; // TODO
				}

				if (position + 1 > size && size > 2) {
					next = null; // TODO
				}

				result.list = list;
				result.chunk = chunk;
				result.position = position;
			} else {
				var albumId = Photos.getAlbumIdByPhotoId(photoId);

				if (!albumId) {
					// TODO: if that album not exists in cache
					console.log("!albumId");
					return;
				}

				chunk = Photos.getChunkContentByAlbum(ownerId, albumId, photoId);

				if (!chunk) {
					// TODO ??
					return;
				}

				position = chunk.items.map(function(photo) {
					return photo.id;
				}).indexOf(photoId);

				size = Photos.getAlbumSize(ownerId, albumId);

				realOffset = Photos.getRealOffsetInAlbumByPhoto(ownerId, albumId, photoId);
				var roundOffset = realOffset - (realOffset % 100);

				if (position - 1 < 0 && size > 2) {
					prev = null; // TODO
				}

				if (position + 1 > size && size > 2) {
					next = null; // TODO
				}

				result.albumId = albumId;
				result.chunk = chunk;
				result.position = position;
				result.realOffset = realOffset;
			}

			result.current = chunk.items[position];

			result.previous = position > 0
				? (prev
					? prev
					: chunk.items[position - 1]
				)
				: null;

			result.next = position + 1 < size
				? (next
					? next
					: chunk.items[position + 1]
				)
				: null;

			resolve(result);
		});
	},


	/**
	 * @param {{
	 *     ownerId: int,
	 *     photoId: int,
	 *     albumId: int=,
	 *     accessKey: string=,
	 *     list: string=,
	 *     chunk: {
	 *         count: int,
	 *         items: Photo[]
	 *     },
	 *     position: int,
	 *     size: int,
	 *     previous: Photo|null,
	 *     current: Photo,
	 *     next: Photo|null,
	 *     realOffset: int
	 * }} data
	 */
	showPhoto: function(data) {
		console.log(data);
		var e = $.e,

			ownerId = data.ownerId,
			albumId = data.albumId,
			photoId = data.photoId,
			accessKey = data.accessKey,

			l = Lang.get,

			current = data.current,

			header,
			viewer = e("div", {append: e("img", {src: current.photo_604})}),
			footer = e("div", {html: new Date(current.date * 1000).long()}),

			menu = {};

		menu.openOriginal = {
			label: l("photo.viewActionShowOriginal"),
			onclick: function() {
				window.open(getURL(current.photo_2560 || current.photo_1280 || current.photo_807 || current.photo_604));
			}
		};

		menu.openListSizes = {
			label: l("photo.viewActionShowListSizes"),
			onclick: function() {
				Photos.downloadPhoto(ownerId, photoId, accessKey);
			}
		};

		menu.share = {
			label: l("photo.viewActionShare"),
			onclick: function() {
				Photos.share(ownerId, photoId, accessKey, current.can_repost);
			}
		};

		if (ownerId === API.userId) {

			menu.changeCaption = {
				label: l("photo.viewActionChangeCaption"),
				onclick: function() {
					Photos.changeCaption(ownerId, photoId);
				}
			};

			if (albumId === Photos.ALBUM_ID.PROFILE) {
				menu.makeProfilePhoto = {
					label: l("photo.viewActionMakeProfilePhoto"),
					onclick: function() {
						Photos.setProfilePhoto(ownerId, photoId);
					}
				};
			}
		}

		if (ownerId === API.userId || ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin) {
			menu.deletePhoto = {
				label: l("photo.viewActionDelete"),
				onclick: function() {
					Photos.deletePhoto(ownerId, photoId, accessKey).then(function() {
						var block;
						footer.insertBefore(block = e("div", {
							"class": "photo-deleted",
							append: [
								$.e("span", {html: l("photos.viewPhotoDeleted")}),
								$.e("span", {
									"class": "a",
									html: l("photo.viewActionRestore"),
									onclick: function() {
										//Photos.restorePhoto(ownerId, photoId, accessKey).then();
									}
								})
							]
						}), node.nextSibling);
					});
				}
			};
		}

		header = Site.getPageHeader("photo M of N", new DropDownMenu(l("general.actions"), menu).getNode());

		Site.append(e("div", {append: [
			header,
			viewer,
			footer
		]}));
	},


	/** @deprecated */
	getViewer: function (list, position, objects) {
		var previous   = list[position.previous],
			next       = list[position.next],
			photo      = list[position.current === -1 ? -1 : position.current] || position.photo,
			owner_id   = photo.owner_id,
			album_id   = photo.album_id || photo.aid,
			photo_id   = photo.id || photo.pid,
			access_key = photo.access_key || Site.Get("access_key") || "",
			parent     = document.createElement("div"),
			header     = document.createElement("div"),
			frame      = document.createElement("div"),
			shower     = document.createElement("div"),
			headerFull = document.createElement("div"),
			footerFull = document.createElement("div"),
			footer     = document.createElement("div"),
			commentsWrap   = document.createElement("div"),
			like       = getLikeButton("photo", owner_id, photo_id, access_key, photo.likes && photo.likes.count, photo.likes && photo.likes.user_likes),
			links = (function (a, b, c, d, e, f, g, h, i, j, k, l) {
				for (; e < f; ++e) {
					l = {};
					if (a[c + d[e]] == g) {
						continue;
					}
					l[j] = (((((l[i] = ((((100 * d[e]) / a[i]) * a[i]) / 100)) * 100) / a[i]) * a[j]) / 100);
					l[k] = a[c + d[e]];
					b[h](l);
				}
				return b;
			})(photo, [], "photo_", [75, 130, 604, 807, 1280, 2560], 0, 6, undefined, "push", "width", "height", "url", {}),
			actions    = {},
			headerText = Lang.get("photos", "photo_noun") + " " + (position.current + 1 || 1) + Lang.get("photos", "photo_count_of") + (position.current != -1 ? list.length : 1);
		header.id    = "photo_actions_head";
		frame.className = "photo-frame";
// Prepare actions box
//actions["Fullscreen"] = function (event) {Photos.setFullViewMode(true);};
		if ((owner_id > 0 && owner_id == API.userId) || (owner_id < 0 && Local.data[owner_id] && Local.data[owner_id].is_admin)) {
			if (album_id != -6 && album_id != -15 || (Local.data[owner_id] && Local.data[owner_id].is_admin))
				actions[Lang.get("photos", "photo_actions_edit")]   = function (event) {Photos.changeCaption(owner_id, photo_id);};
			if ((owner_id === API.userId || owner_id < 0 && (Local.data[owner_id] && Local.data[owner_id].is_admin)) && album_id === -6)
				actions[Lang.get("photos.photo_actions_set_profile_photo")] = function (event) {Photos.setProfilePhoto(owner_id, photo_id);};
			actions[Lang.get("photos", "photo_actions_delete")] = function (event) {Photos.deletePhoto(owner_id, photo_id, access_key, header);};
//actions[Lang.get("photos", "photo_actions_move")]   = function (event) {Photos.movePhoto(owner_id, photo_id);};
//actions[Lang.get("photos", "photo_actions_addTag")] = function (event) {Photos.addTagPhoto(owner_id, photo_id);};
			if (album_id != -6 && album_id != -3)
				actions[Lang.get("photos", "photo_actions_cover")]  = function (event) {Photos.makeCover(owner_id, album_id, photo_id);};
		} else {
			actions[Lang.get("photos", "photo_actions_report")] = function (event) {Photos.reportPhoto(owner_id, photo_id);};
		}
		if (owner_id != API.userId)
			actions[Lang.get("photos", "photo_actions_save")]   = function (event) {Photos.savePhoto(owner_id, photo_id, access_key);};
		if (owner_id == API.userId && album_id > 0 || album_id == -15)
			actions["Переместить в другой альбом"] = function(event) {Photos.showChooseAlbumsForMovePhoto(owner_id, photo_id, album_id); };
//if (photo.tags && photo.tags.count > 0)
//	actions[Lang.get("photos", "photo_actions_tags")]   = function (event) {};
//if (album_id != -3)
		actions["Оценили"]                                  = function (event) {window.location.hash = "#photo" + owner_id + "_" + photo_id + (access_key ? "?access_key=" + access_key + "&" : "?") + "act=likes"};
		actions["Поделиться"]                              = function (event) {Photos.share(owner_id, photo_id, access_key, photo.can_repost)};
		actions["Найти похожие"] = function () { window.open("https://yandex.ru/images/search?img_url=" + encodeURIComponent(photo.photo_2560 || photo.photo_1280 || photo.photo_807 || photo.photo_604) + "&rpt=imageview"); };
		actions[Lang.get("photos", "photo_actions_download")]   = function (event) {Photos.downloadPhoto(owner_id, photo_id, access_key, links);};
		actions[Lang.get("photos", "photo_actions_download_original")]  = function (event) {
			var url = photo.photo_2560 || photo.photo_1280 || photo.photo_807 || photo.photo_604;
			window.open(url);
		};
		header.appendChild(Site.getPageHeader(
			headerText,
			Site.CreateDropDownMenu(Lang.get("photos", "photo_actions"), actions)
		));
		headerFull.className = "photo-view-full-header";
		headerFull.appendChild($.e("div", {
			"class": "fr photo-view-full-header-close",
			onclick: function () {
				Photos.setFullViewMode(false);
			},
			html: Lang.get("photos.photo_view_full_close")
		}));

		footerFull.appendChild(Photos.getFooterPanelFullView(owner_id, photo_id, access_key));
		if (photo.deleted) {
			header.appendChild($.elements.create("div", {
				"class": "photo-deleted",
				html: Lang.get("photos", "photo_action_deleted")
			}));
		}
		// Photo-block
		headerFull.appendChild($.elements.create("div", {"class": "photo-view-full-header-title", html: headerText}));
		shower.className = "photo-shower";
		shower.appendChild(Photos.getMoveablePanelViewer([previous, photo, next]));


		var onClickPhoto = function (percent)
		{

			if (percent >= 60 && next) {
				window.location.hash = "#photo" + next.owner_id + "_" + next.id + "?" +
					(next.access_key || next.list ? "?access_key=" + next.access_key + "&list=" + next.list : "")
				//(next.access_key ? "access_key=" + next.access_key : "") +
				//(next.list ? "list=" + next.list : "")
			} else if (percent <= 40 && previous) {
				window.location.hash = "#photo" + previous.owner_id + "_" + previous.id + "?" +
					(previous.access_key || previous.list ? "?access_key=" + previous.access_key + "&list=" + previous.list : "")
				//(previous.access_key ? "access_key=" + previous.access_key : "") +
				//(previous.list ? "list=" + previous.list : "")
			}
		};

		/*Photos.touchEvent(shower, function (event)
			{
				var element = shower,
					x = event.clientX - element.offsetLeft,
					percent = (100 * x) / $.getPosition(element).width;
				onClickPhoto(percent);
			},
			function (event)
			{
				Photos.likePhoto(owner_id, photo_id, access_key, function (photo, likes) {
					var button = getLikeButton("photo", photo.owner_id, photo.photo_id, photo.access_key, {
							count: likes.count,
							user_likes: likes.me
						}, {
							count: 0
						}),
						likeParent = $.element("like_photo_" + photo.owner_id + "_" + photo.photo_id);
					$.elements.clearChild(likeParent);
					likeParent.appendChild(button);
					var icon = $.element("photo_like_effect" + photo.owner_id + "_" + photo.photo_id);
					if (likes.me) {
						$.elements.addClass(icon, "photo-likeeffect-active");
					} else {
						$.elements.removeClass(icon, "photo-likeeffect-active");
					}
				});
			}, 550);*/
		// TODO: проверка на то, что нажатие произошло не в текстовом поле, а на странице
		window.onKeyDownCallback = function (event)
		{
			switch (event.key)
			{
				case KeyboardCodes.left: onClickPhoto(0); break;
				case KeyboardCodes.right: onClickPhoto(100); break;
			}
		};


		// Insert info block

		footer.className = "photo-footer";
		footer.appendChild($.e("div", {"class": "wall-stat wall-footer likes", id: "like_photo_" + owner_id + "_" + photo_id, append: [like]}));
		footer.appendChild($.e("div", {"class": "photo-tags", id: "photo_tags_" + owner_id + "_" + photo_id}));
		footer.appendChild($.e("div", {"class": "photo-description", id: "photo_description_" + owner_id + "_" + photo_id, append: [$.e("div", {html: Site.toHTML(photo.text || "")})]}));
		if (photo.lat && photo["long"]) {
			var placeNode;
			footer.appendChild(placeNode = $.e("div", {id: "photo-place" + owner_id + "_" + photo_id}));
			/*			new Vlad805API("place.getByCoordinaties", {
							lat: photo.lat,
							"long": photo["long"]
						}).onResult(function (data) {
							if (!data)
								return;
							data = data.items[0];
							var obj = {coordinates: data["long"] + " " + data.lat, place: {title: data.info.text}};
							placeNode.appendChild(Wall.getGeoAttachment(obj, false));
							$.elements.remove(placeNode);
						});
			*/
		}
		footer.appendChild($.e("div", {"class": "photo-uploaded", append: [
			$.e("span", {"class": "tip", html: Lang.get("photos.photo_view_uploaded")}),
			document.createTextNode($.getDate(photo.date))
		]}));
		footer.appendChild($.e("div", {"class": "photo-album", append: [
			$.e("span", {"class": "tip", html: Lang.get("photos.photo_view_album")}),
			$.e("a", {href: "#photos" + owner_id + "_" + album_id, html: Site.Escape(Photos.albumInfo[owner_id + "_" + album_id] && Photos.albumInfo[owner_id + "_" + album_id].title) || "< Альбом >"})
		]}));
		var authorLink, authorID;
		footer.appendChild($.elements.create("div", {"class": "photo-uploader", append: [
			$.elements.create("span", {"class": "tip", html: Lang.get("photos.photo_view_owner")}),
			(authorLink = $.elements.create("a", {
				html: (owner_id < 0 ? (photo.user_id == 100 ? Local.data[owner_id] && Local.data[owner_id].name || "DELETED" : Local.data[photo.user_id] && Local.data[photo.user_id].first_name + " " + Local.data[photo.user_id].last_name || "DELETED DELETED") : Local.data[owner_id] && Local.data[owner_id].first_name + " " + Local.data[owner_id].last_name || "DELETED DELETED"),
				href: "#" + (owner_id < 0 ? (photo.user_id == 100 ? Local.data[owner_id] && Local.data[owner_id].screen_name || "club" + -owner_id : Local.data[photo.user_id] && Local.data[photo.user_id].screen_name || "id" + photo.user_id) : Local.data[owner_id] && Local.data[owner_id].screen_name || "id" + owner_id)
			}))
		]}));
		if (
			owner_id < 0 && (
				(photo.user_id == 100 && !Local.data[owner_id]) ||
				photo.user_id != 100 && !Local.data[photo.user_id]
			) ||
			owner_id > 0 && !Local.data[owner_id]
		) {
			var need = (
				owner_id < 0 ? (
						photo.user_id == 100 ?
							owner_id :
							photo.user_id
					) :
					owner_id
			);
			Site.API(
				need > 0 ? "users.get" : "groups.getById",
				need > 0 ? {user_ids: need, fields: "screen_name,online"} : {group_ids: -need},
				function (data) {
					data = Site.isResponse(data);
					Local.add(data);
					data = data[0];
					authorLink.href = "#" + data.screen_name;
					authorLink.innerHTML = data.name || data.first_name + " " + data.last_name + Site.isOnline(data);
				}
			);
		}
		var loadComments = function (event) {
			if (event) {
				this.value = Lang.get("photos.photo_view_load_comments_loading");
				this.disabled = true;
			}
			$.elements.clearChild(commentsWrap);

			commentsWrap.appendChild(comments({
				getMethod: "photos.getComments",
				addMethod: "photos.createComment",
				editMethod: "photos.editComment",
				removeMethod: "photos.deleteComment",
				restoreMethod: "photos.restoreComment",
				ownerId: owner_id,
				itemId: photo_id,
				type: "photo",
				countPerPage: 50,
				canComment: photo.canComment,
				accessKey: access_key
			}));


		};
		if (album_id != -3) {
			commentsWrap.appendChild($.elements.create("div", {"class": "button-block", html: Lang.get("photos.photo_view_load_comments"), onclick: (function (owner_id, photo_id, access_key) {
				return loadComments;
			})(owner_id, photo_id, access_key)}));
			if (Site.Get("offset", true) != undefined) {
				loadComments(false);
			}
		}
		footerFull.className = "photo-view-full-footer";
		frame.appendChild(headerFull);
		frame.appendChild(shower);
		frame.appendChild(footerFull);
		var nodes = [header, frame, footer, commentsWrap];
		for (var i = 0, l = nodes.length; i < l; ++i)
			parent.appendChild(nodes[i]);
		Site.append(parent);
		Photos.onResizedWindowUpdateMarginsPhotosMoveableFullScreenView();
		var f = Site.Get("from");
		Site.setHeader(Lang.get("photos", "photo_noun"), f ? {link: f} : null);
		if (photo.tags && photo.tags.count > 0 || !photo.tags)
			Photos.tagsPhoto(owner_id, photo_id, access_key);
	},

	/**
	 * @param {int} ownerId
	 * @param {int} photoId
	 * @param {string=} accessKey
	 * @param {boolean=} canRepost
	 */
	share: function(ownerId, photoId, accessKey, canRepost) {
		share("photo", ownerId, photoId, accessKey, actionAfterShare, {
			wall: canRepost,
			user: true,
			group: true
		});
	},

	/** @deprecated */
	tagsPhoto: function (owner_id, photo_id, access_key) {
		Site.APIv5("photos.getTags", {owner_id: owner_id, photo_id: photo_id, access_key: access_key, v: 5.10}, function (data) {
			data = data.response;
			if (!data || data && !data.length)
				return;
			var users = [], u;
			for (var i = 0, l = data.length; i < l; ++i) {
				u = data[i];
				users.push($.elements.create("span", {
					"class": "a",
					//href: "#id" + u.user_id,
					html: u.tagged_name,
					onclick: (function (position) {return function (event) {
						var photo = $.element("photo__current"), tip = photo.lastChild;
						if (photo.firstChild == photo.lastChild) {
							tip = document.createElement("div");
							photo.appendChild(tip);
						} else
							$.elements.clearChild(photo.lastChild);
						var square = document.createElement("div"), percent = "%";
						square.className = "photo-tag-square";
						square.style.top = position[0][1] + percent;
						square.style.left = position[0][0] + percent;
						square.style.width = (position[1][0] - position[0][0]) + percent;
						square.style.height = (position[1][1] - position[0][1]) + percent;
						tip.appendChild(square);

						var e = $.elements.create,
							blocks = [];
						for (var q = 0; q < 4; ++q)
							blocks.push(e("div", {"class": "photo-tag-blocked"}));

						blocks[0].style.top = 0;
						blocks[0].style.left = 0;
						blocks[0].style.width = position[0][0] + percent;
						blocks[0].style.height = "100%";

						blocks[1].style.top = 0;
						blocks[1].style.left = position[1][0] + percent;
						blocks[1].style.width = (100 - position[1][0]) + percent;
						blocks[1].style.height = "100%";

						blocks[2].style.top = 0;
						blocks[2].style.left = position[0][0] + percent;
						blocks[2].style.width = (position[1][0] - position[0][0]) + percent;
						blocks[2].style.height = position[0][1] + percent;

						blocks[3].style.top = position[1][1] + percent;
						blocks[3].style.left = position[0][0] + percent;
						blocks[3].style.width = (position[1][0] - position[0][0]) + percent;
						blocks[3].style.height = (100 - position[1][1]) + percent;
						var closeTip = function (event) {
							$.elements.remove(tip);
							return $.event.cancel(event);
						};
						for (var q = 0; q < 4; ++q) {
							$.event.add(blocks[q], "click", closeTip);
							tip.appendChild(blocks[q]);
						}

						return false;
					}})([[u.x, u.y], [u.x2, u.y2]])
				}));
				if (u.user_id == API.userId && !u.viewed) {
					users.push(document.createTextNode(" "));
					users.push($.e("span", {"class": "a", html: "[подтвердить отметку]", onclick: (function (o,p,t){
						return function (event) {
							var elem = this;
							Site.API("photos.confirmTag", {
								owner_id: o,
								photo_id: p,
								access_key: access_key,
								tag_id: t
							}, function (data) {
								data = Site.isResponse(data);
								$.elements.remove(elem.previousSibling);
								$.elements.remove(elem);
							});
						};
					})(owner_id, photo_id, (u.id || u.tag_id))}));
				}
				if (u.user_id == API.userId || owner_id == API.userId) {
					users.push(document.createTextNode(" "));
					users.push($.e("span", {"class": "a", html: "[x]", onclick: (function (o,p,t){
						return function (event) {
							var elem = this;
							Site.API("photos.removeTag", {
								owner_id: o,
								photo_id: p,
								access_key: access_key,
								tag_id: t
							}, function (data) {
								data = Site.isResponse(data);
								$.elements.remove(elem.previousSibling.previousSibling);
								$.elements.remove(elem.previousSibling);
								$.elements.remove(elem);
							});
						};
					})(owner_id, photo_id, (u.id || u.tag_id))}));
				}
				users.push(document.createTextNode(", "));
			}
			users.length = users.length - 1;
			$.element("photo_tags_" + owner_id + "_" + photo_id).appendChild($.elements.create("div", {append: users}));
		});
	},

	/** @deprecated */
	setFullViewMode: function (state) {
		var e = document.getElementsByTagName("html")[0], c = "photo-view-full";
		if (state)
			$.elements.addClass(e, c);
		else
			$.elements.removeClass(e, c)
	},

	/** @deprecated */
	getFooterPanelFullView: function (owner_id, photo_id, access_key) {
		var panel = document.createElement("div"),
			photo = Photos.photos[owner_id + "_" + photo_id],
			item = function (icon, count, fx) {
				return $.elements.create("div", {"class": "photo-view-full-footer-item sizefix", onclick: fx, append: [
					$.elements.create("div", {"class": "photo-view-full-footer-wrap", append: [
						$.elements.create("div", {"class": "photo-view-full-icons photo-view-full-icon-" + icon}),
						$.elements.create("span", {html: (count > 0 ? " " + count : ""), id: "photofullview" + owner_id + "_" + photo_id})
					]})
				]});
			};
		panel.style.height = "100%";
		panel.appendChild(item("like", photo.likes && photo.likes.count || 0, function (event) {
			// TODO
			/*Likes.Like(null, "photo", owner_id, photo_id, access_key, function (data) {
				var e = $.element("photofullview" + owner_id + "_" + photo_id);
				e.innerHTML = data.likes.count > 0 ? " " + data.likes.count : "";
				e.previousSibling.className = "photo-view-full-icons photo-view-full-icon-like" + (data.likes.user_likes ? "-active" : "");
			});*/
		}));
		panel.appendChild(item("comment", photo.comments && photo.comments.count || 0, function (event) {
			Photos.setFullViewMode(0);
			Site.route(window.location.hash += "?&offset=0");
			window.scrollTo(0, 590);
		}));
		panel.appendChild(item("people", photo.tags && photo.tags.count || 0, function (event) {
			if (photo.tags && photo.tags.count > 0)
				Photos.setFullViewMode(0);
		}));
		return panel;
	},

	/** @deprecated */
	alreadySaved: {},

	/** @deprecated */
	savePhoto: function (owner_id, photo_id, access_key) {
		var save = function () {
			Site.API("photos.copy", {
				owner_id: owner_id,
				photo_id: photo_id,
				access_key: access_key
			}, function (data) {
				data = Site.isResponse(data);
				if (data > 0) {
					Site.Alert({text: "Сохранено в альбом &quot;Сохраненные фотографии&quot;"});
					Photos.alreadySaved[owner_id + "_" + photo_id] = true;
				}
			});
		};
		if (Photos.alreadySaved[owner_id + "_" + photo_id]) {
			VKConfirm("Вы только что сохранили эту фотографию к себе в альбом. Хотите сделать это еще раз?", save);
		} else save();
	},

	/** @deprecated */
	showChooseAlbumsForMovePhoto: function(ownerId, photoId, albumId) {
		var albumsSelect = $.e("select", {name: "album", disabled: "disabled"}),
			loaded = false,
			insert = function(items) {
				items.forEach(function(item) {
					var opt = $.e("option", { value: item.id, html: item.title });
					opt.disabled = item.id === albumId;
					albumsSelect.appendChild(opt);
				});
				albumsSelect.disabled = false;
			},
			move = function() {
				if (!loaded || albumsSelect.disabled) {
					return;
				}
				var album = albumsSelect.options[albumsSelect.selectedIndex].value;

				loaded = false;
				Site.API("photos.move", {target_album_id: album, photo_id: photoId}, function(data) {
					data = Site.isResponse(data);
					data && modal.close();
				});
			},
			form = $.e("form", {onsubmit: function(event) { event.preventDefault(); }, append: albumsSelect}),
			modal = new Modal({title: "Переместить в другой альбом", content: form, footer: [{
				name: "ok", title: "Переместить", onclick: move,
			}, {
				name: "cancel", title:"Отмена", onclick: function(event) { this.close() }
			}]}).show();
		Site.APIv5("photos.getAlbums", {owner_id: ownerId, v: 5.52}, function(data) {
			data = Site.isResponse(data);
			loaded = true;
			data.items && insert(data.items);
		});
	},

	/**
	 * Append form for edit caption for photo
	 * @param {int} ownerId
	 * @param {int} photoId
	 */
	changeCaption: function(ownerId, photoId) {
		var photo = Photos.photos[ownerId + "_" + photoId],
			description = $.element("photo_description_" + ownerId + "_" + photoId);

		$.elements.clearChild(description);
		description.appendChild(Site.getExtendedWriteForm({
			noHead: true,
			noLeftPhoto: true,
			name: "caption",
			value: photo.text,
			onSend: function(event) {
				var text = event.text.trim();
				Photos.editPhoto(ownerId, photoId, text).then(function() {
					description.innerHTML = text.safe().format();
					photo.text = text;
				});
				return false;
			}
		}, ownerId, photoId));
	},

	/**
	 * Request for edit caption of photo
	 * @param {int} ownerId
	 * @param {int} photoId
	 * @param {string} text
	 * @returns {Promise}
	 */
	editPhoto: function(ownerId, photoId, text) {
		return api("photos.edit", {
			owner_id: ownerId,
			photo_id: photoId,
			caption:  text
		});
	},

	/** @deprecated */
	getReportSelect: function (type) {
		var parent = document.createElement("div"),
			tip    = document.createElement("div"),
			//select = document.createElement("select"),
			reasons = "это спам|детская порнография|экстремизм|насилие|пропаганда наркотиков|материал для взрослых|оскорбление"
				.split("|");
		tip.className = "tip";
		tip.innerHTML = "Выберите, пожалуйста, причину, почему Вы хотите пожаловаться на " + (type == 2 ? "комментарий" : "фотографию") + ":";
		parent.appendChild(tip);
		//select.name = "reason";
		for (var i = 0, l = reasons.length; i < l; ++i)
			parent.appendChild($.elements.create("label", {append: [
				$.elements.create("input", {type: "radio", name: "reason", value: i}),
				document.createTextNode(" " + reasons[i])
			]}));
		//parent.appendChild(select);
		return parent;
	},

	/** @deprecated */
	reportPhoto: function (owner_id, photo_id) {
		var photo = Photos.photos[owner_id + "_" + photo_id],
			Form = document.createElement("form"),
			body = document.createElement("div");
		Form.appendChild(Site.getPageHeader("Составление жалобы на фотографию"));
		body.className = "sf-wrap";
		body.appendChild($.elements.create("img", {"class": "fr", src: photo.photo_130}));
		body.appendChild(Photos.getReportSelect());
		body.appendChild($.elements.create("input", {type: "submit", value: "Пожаловаться"}));
		Form.appendChild(body);
		Form.onsubmit = function (event) {
			if (!this.reason)
				return false;
			var reasons = this.reason,
				reason;
			for (var i = 0, l = reasons.length; i < l; ++i)
				if (reasons[i].checked) {
					reason = i;
					break;
				}
			if (reason == undefined) {
				Site.Alert({text: "Пожалуйста, выберите причину"});
				return false;
			}
			Site.API("photos.report", {
				owner_id: owner_id,
				photo_id: photo_id,
				reason:   reason
			}, function (data) {
				if (data.response)
					Site.route(window.location.hash);
			});
			return false;
		};
		Site.append(Form);
	},

	/**
	 * @param {int} ownerId
	 * @param {int} photoId
	 * @param {string=} accessKey
	 * @returns {Promise<boolean>}
	 */
	deletePhoto: function (ownerId, photoId, accessKey) {
		return new Promise(function(resolve, reject) {
			VKConfirm(Lang.get("photos.photo_action_delete"), function() {
				api("photos.delete", {
					owner_id: ownerId,
					photo_id: photoId,
					access_key: accessKey
				}).then(resolve).catch(reject);
			});
		});
	},

	/** @deprecated */
	restorePhoto: function (ownerId, photoId, accessKey, node) {
		Site.API("photos.restore", {
			owner_id: ownerId,
			photo_id: photoId,
			access_key: accessKey
		}, function (data) {
			if (Site.isResponse(data)) {
				$.elements.remove(node);
				Photos.photos[owner_id + "_" + photo_id].deleted = true;
			} else {
				Site.Alert({text: "Поздно. Фотографию восстановить уже невозможно"});
			}
		})
	},

	/** @deprecated */
	makeCover: function (owner_id, album_id, photo_id) {
		VKConfirm(Lang.get("photos", "photo_action_makeCover"), function () {
			Site.API("photos.makeCover", {
				owner_id: owner_id,
				album_id: album_id,
				photo_id: photo_id
			}, function (data) {
				data = Site.isResponse(data);
				if (data) {
					Site.Alert({text: Lang.get("photos", "photo_action_makedCover")});
				}
			});
		});
	},

	/**
	 * @param {int} ownerId
	 * @param {int} photoId
	 * @param {string=} accessKey
	 */
	downloadPhoto: function(ownerId, photoId, accessKey) {
		var sl = new SmartList({
				data: {count: -1, items: []},
				countPerPage: 50,
				getItemListNode: function(i) {
					return SmartList.getDefaultItemListNode({
						link: i.src,
						title: i.width + "×" + i.height,
						icon: ""
					})
				},
				optionsItemListCreator: {
					textContentBold: true
				}
			}),
			modal = new Modal({
				title: "Ссылки на оригиналы",
				content: sl.getNode(),
				footer: [
					{
						title: "cancel",
						name: "cancel",
						onclick: function() {
							this.close();
						}
					}
				],
				noPadding: true
			}),
			sorter = function(a, b) {
				return a.width > b.width ? -1 : a.width < b.width ? 1 : 0;
			},
			showItems = function(data) {
				var items = data[0].sizes.sort(sorter);

				sl.setData({count: items.length, items: items.map(function(a, b) {a.id = b + 1; return a;})});
			};

		modal.show();

		api("photos.getById", {
			photos: ownerId + "_" + photoId + "_" + accessKey,
			photo_sizes: 1,
			v: 5.80
		}).then(showItems).catch(function(e) {
			console.error("downloadPhoto", e);
		});
	},

	/**
	 * @param {int} ownerId
	 * @param {int} photoId
	 * @returns {Promise}
	 */
	setProfilePhoto: function(ownerId, photoId) {
		return api("execute", {
			code: "return API.photos.reorderPhotos({owner_id:parseInt(Args.o),photo_id:parseInt(Args,p),after:API.photos.get({owner_id:parseInt(Args.o),album_id:-6,rev:1,count:1,v:5.56}).items[0].id,v:5.56});",
			o: ownerId,
			p: photoId
		}).then(function(data) {
			Site.Alert({text: Lang.get("photos.successfully_setted_profile_photo")});
			return data;
		});
	},

	/** @deprecated */
	getMoveablePanelViewer: function (photos) {
		var moveable = document.createElement("div"),
			getId = function (photo) {
				return photo ?
					photo.owner_id + "_" + photo.id +
					(photo.access_key || photo.list ? "?access_key=" + photo.access_key + "&list=" + photo.list : "")
					: false;
			},
			ids = "previous,current,next".split(",");
		moveable.className = "photo-view-moveable";
		moveable.style.webkitTransform = "translateX(-33.33%)";
		moveable.style.mozTransform = "translateX(-33.33%)";
		moveable.style.transform = "translateX(-33.33%)";
		for (var i = 0, l = photos.length; i < l; ++i) {
			var photo = photos[i];
			if (!photo) photo = {photo_807: "about:blank"};
			moveable.appendChild($.e("div", {"class": "photo-view-item", "data-photoid": photo.owner_id + "_" + photo.id, append:
				$.e("div", {
					style: "height: 100%;",
					append: $.e("img", {
						src: getURL(photo.photo_807 || photo.photo_604),
						alt: "",
						"class": "photo-img",
					}),
					id: "photo__" + ids[i]
				})
			}));
		}
		(function (element, photos) {
			var start    = {x: 0, y: 0},
				end      = {x: 0, y: 0},
				is       = {up: false, right: false, down: false, left: false, count: 0, norelease: false, ts: 0},
				getTouch = function (event){
					var touch = (event.touches[0] || event.changedTouches[0]);
					return {x: touch.pageX, y: touch.pageY};
				},
				addEvent = function (nameEvent, fx) {
					$.event.add(element, nameEvent, fx);
				},
				p = -33.33,
				getCurrentPosition = function (node) {
					return p;
				},
				setCurrentPosition = function (node, value) {
					p = value;
					node.style.mozTransform = "translateX(" + value + "%)";
					node.style.webkitTransform = "translateX(" + value + "%)";
					node.style.msTransform = "translateX(" + value + "%)";
					node.style.oTransform = "translateX(" + value + "%)";
					node.style.transform = "translateX(" + value + "%)";
				};
			setCurrentPosition(element, -33.33);
			addEvent("touchstart", function (event) {
				var touch = getTouch(event);
				start = touch;
				$.event.cancel(event);
				is.count = 0;
				is.ts = Math.floor(+new Date() / 1000);
			});
			addEvent("touchmove", function (event) {
				var touch = getTouch(event),
					parent = element.parentNode,
					elementPosition = $.getPosition(element),
					widthItem = elementPosition.width,
					heightItem = elementPosition.height,
					module = function (n) {return n > 0 ? n : -n;};
				var current = getCurrentPosition(element);
				//current = +current;
				if (is.count > 7) {
					if (start.x - touch.x > 20)
						is.left = true;
					if (touch.x - start.x > 20)
						is.right = true;
					if (touch.y - start.y > 60 && !is.left && !is.right)
						is.down = true;
					if (start.y - touch.y > 60 && !is.left && !is.right)
						is.up = true;
				}
				if ((is.left || is.right) && !is.up && !is.down) {
					var max = Math.max(start.x, touch.x),
						min = Math.min(start.x, touch.x),
						per = ((100 * (max - min)) / widthItem);
					setCurrentPosition(element, -(((33.33 + (start.x < touch.x ? -per : per)) * 3) / 3));
					//element.style.transform = "translateX(-" +  + "%)";
					$.event.cancel(event);
				}
				if ((is.up || is.down) && !$.elements.hasClass(document.getElementsByTagName("html")[0], "photo-view-full")) {
					var top = (is.up ? start.y - touch.y : -(touch.y - start.y));
					window.scrollBy(0, top);
				}
				is.count++;
			});
			addEvent("touchend", function (event) {
				var touch = getTouch(event);
				end = touch;
				var current = getCurrentPosition(element);
				//+element.style.left.replace(/%/g, "");
				$.elements.addClass(element, "photo-view-moveable-dropped");
				if ((is.left || is.right) && current < -44.444 && photos.next || current > -22.222 && photos.previous) {
					setCurrentPosition(element, -((current < -44.44 ? 66.667 : 0)));
					//element.style.transform = "translateX(" +  + ")";
					setTimeout(function () {
						window.location.hash = "photo" + (current < -44.444 ? photos.next : photos.previous);
					}, 200);
				} else {
					setCurrentPosition(element, -33.333);
//                  element.style.transform = "translateX(-33.33%)";
					setTimeout(function () {
						$.elements.removeClass(element, "photo-view-moveable-dropped");
					}, 200);
				}
//				if (!is.left && !is.right && !is.top && !is.bottom && Math.round(+new Date() / 1000) - is.ts >= 2)
//					Photos.setFullViewMode(1);
				is = {up: false, right: false, down: false, left: false, count: 0, norelease: false};
				$.event.cancel(event);
			});
			return element;
		})(moveable, {
			previous: getId(photos[0]),
			next: getId(photos[2])
		});
		return moveable;
	},

	/** @deprecated */
	onResizedWindowUpdateMarginsPhotosMoveableFullScreenView: function (event) {
		return;
		var imgs = document.querySelectorAll(".photo-view-full .photo-view-item"),
			widthClient = document.documentElement.clientWidth,
			heightClient = document.documentElement.clientHeight;
		for (var i = 0, l = imgs.length; i < l; ++i) {
			var item = imgs[i],
				photo_id = item.getAttribute("data-photoid"),
				photo = Photos.photos[photo_id];
			if (
				photo.height < photo.width && widthClient > heightClient ||
				photo.height > photo.width && widthClient < heightClient
			)
				continue;
			var height = photo.height,
				per = (((100 * height) / heightClient) / 2);

			item.style.paddingTop = per + "px";
		}
	}
};
