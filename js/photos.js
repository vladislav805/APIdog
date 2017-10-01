function VKPhoto (p) {
	var photo = this;
	this.ownerId = p.owner_id;
	this.photoId = p.id;
	this.albumId = p.album_id;

	this.photo75 = p.photo_75;
	this.photo130 = p.photo_130;
	this.photo604 = p.photo_604;
	this.photo807 = p.photo_807;
	this.photo1280 = p.photo_1280;
	this.photo2560 = p.photo_2560;

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
	Resolve: function (url) {
		var albums = /^photos(-?\d+)?$/img,
			album = /^photos(-?\d+)_(-?\d+)$/img,
			photo = /^photo(-?\d+)_(\d+)$/img;
		if (albums.test(url)) {
			var id = /^photos(-?\d+)?$/img.exec(url); id = id[1] || API.userId;
			switch(Site.Get("act")) {
				case "all":			return Photos.getAll(id); break;
				case "comments":	return Photos.getAllComments(id); break;
				case "create":		return Photos.createAlbum(id); break;
				case "tagged":		return Photos.getUserTagged(id); break;
				case "new_tags":	return Photos.getNewTags(id); break;
				case "map":			return Photos.showMapWithAllPhotos(id); break;
				default:			return Photos.getAlbums(id); break;
			}
		} else if (album.test(url)) {
			var id = /^photos(-?\d+)_(-?\d+)$/img.exec(url), owner_id = id[1], album_id = id[2];
			switch(Site.Get("act")){
				case "comments": return Photos.getAllComments(owner_id, album_id); break;
				case "upload":   return Photos.getUploadForm(owner_id, album_id); break;
				default:         return Photos.requestAlbum(owner_id, album_id, getOffset(), !Site.get("rev"));
			}
		} else {
			var id = /^photo(-?\d+)_(\d+)$/img.exec(url),
				owner_id = id[1],
				photo_id = id[2],
				access_key = Site.Get("access_key"),
				list = Site.Get("list");
			switch(Site.Get("act")){
				case "likes": return Photos.getLikes(owner_id, photo_id, access_key, list); break;
				default:      return Photos.getShow(owner_id, photo_id, access_key, list);
			}
		}
	},

	loadYandexMaps: function (callback)
	{
		var YandexAPI = "//api-maps.yandex.ru/2.1/?lang=ru_RU",
			scripts = document.getElementsByTagName("script");
		for (var i = 0; i < scripts.length; ++i)
			if (scripts[i].src == YandexAPI)
				return callback();
		document.getElementsByTagName("head")[0].appendChild($.e("script",
			{
				type: "text/javascript",
				src: YandexAPI,
				onload: function (event) { callback() }
			}));
	},

	showMapWithAllPhotos: function (ownerId)
	{
		var e = $.e,
			wrap,
			mapNode,
			map,
			status,
			loadPhotos = function (offset)
			{
				Site.API("photos.getAll",
					{
						owner_id: ownerId,
						count: 200,
						offset: offset,
						extended: 1
					},
					function (data)
					{
						data = Site.isResponse(data);
						var count = data.shift();
						addPhotos(data.map(Photos.v5normalize));
						setStatus("Загрузка фотографий (" + items.length + "/" + count + ")..");
						if (items.length < count)
							loadPhotos(offset + 200);
						else
							onComplete();
					});
			},
			syncSize = function ()
			{
				var h = $.getPosition(document.documentElement).clientHeight + "px";
				wrap.style.height = h;
				mapNode.style.height = h;
				map.container.fitToViewport();
			},
			addPhotos = function (photos)
			{
				photos.forEach(function (photo)
				{
					if (photo.hasOwnProperty("lat"))
						insertPhotoIntoMap(photo);
				});
				items = items.concat(photos);
				syncSize();
			},
			setStatus = function (text)
			{
				status.innerHTML = text;
			},
			items = [],
			points = [],a = 0,
			insertPhotoIntoMap = function (photo)
			{
				var m = Math.min(photo.width, photo.height),
					k = (30 * 100 / m),
					z = k * 0.01,
					w = photo.width * z,
					h = photo.height * z,
					s = {
						type: "Circle",
						coordinates: [0, 0],
						radius: 15
					},
					point = new ymaps.Placemark([photo.lat, photo["long"]],
						{
							hintContent: $.getDate(photo.date)
						},
						{
							iconLayout: ymaps.templateLayoutFactory.createClass("<div class=\"photos-map-item\"><img src=\"" + photo.photo_130 + "\" width=" + w + " height=" + h + " \/><\/div>"),
							iconShape: s,
							iconImageOffset: [-(w / 2), -(h / 2)]
						});
				map.geoObjects.add(point);
				point._id = points.push(point);
			},
			onComplete = function ()
			{
				setStatus("Фотографии загружены");
				setTimeout(function ()
				{
					setStatus(points.length + " " + $.textCase(points.length, ["фотография", "фотографии", "фотографий"]) + " на карте");
				}, 2000);
			};

		wrap = e("div", {"class": "photos-map-wrap", append: [
			mapNode = e("div", {"class": "photos-map"}),
			status = e("div", {"class": "photos-map-status"})
		]});

		Photos.loadYandexMaps(function ()
		{
			ymaps.ready(function (event)
			{
				setStatus("Яндекс.Карты загружены");
				map = new ymaps.Map(mapNode, {
					center: [0, 0],
					yandexMapAutoSwitch: false,
					controls: [],
					zoom: 1,
					autoFitToViewport: "always"
				});
				map.controls
				   .add("typeSelector", {position: {top: 5, left: 5}})
				   .add("zoomControl", {position: {top: 70, left: 5}});

				window.onResizeCallback = function () { syncSize() };
				document.body.style.overflow = "hidden";
				document.documentElement.style.overflow = "hidden";
				window.onLeavePage = function ()
				{
					document.body.style.overflow = "auto";
					document.documentElement.style.overflow = "auto";
				};
				syncSize();
				loadPhotos(0);
				setStatus("Загрузка фотографий..");
			});
		});
		Site.append(wrap);
	},


	/* Helper */


	v5normalize: function (photo) {
		photo.id         = photo.pid        || photo.id;
		photo.album_id   = photo.album_id   || photo.aid;
		photo.date       = photo.date       || photo.created;
		photo.photo_2560 = photo.photo_2560 || photo.src_xxxbig;
		photo.photo_1280 = photo.photo_1280 || photo.src_xxbig;
		photo.photo_807  = photo.photo_807  || photo.src_xbig;
		photo.photo_604  = photo.photo_604  || photo.src_big;
		photo.photo_130  = photo.photo_130  || photo.src;
		photo.photo_75   = photo.photo_75   || photo.src_small;
		photo.width      = photo.width;
		photo.height     = photo.height;
		return photo;
	},


	getAttachment: function (photo, options) {
		return Photos.itemPhoto(Photos.v5normalize(photo), {list: options.list, wall: options.full, from: getAddress(true)});
	},
	getAttachmentAlbum: function (album) {
		return $.e("a", {href: "#photos" + album.owner_id + "_" + album.id, "class": "attachments-album", append: [
			$.e("img", {src: getURL(album.thumb.photo_604 || album.thumb.photo_big)}),
			$.e("div", {"class": "attachments-album-footer sizefix", append: [
				$.e("div", {"class": "fr", html:album.size}),
				$.e("div", {"class": "attachments-album-title sizefix", html: Site.Escape(album.title)}),
			]})
		]});
	},

	getToParam: function (t) {
		var to = Site.Get("to");
		return (to ? ["?", "&"][t || 0] + "to=" + to : "");
	},
	getTabs: function (owner_id) {
		var tabs = [
			["photos" + owner_id + "?act=all" + Photos.getToParam(1), Lang.get("photos", "albums_all_photos")],
			["photos" + owner_id + Photos.getToParam(0), Lang.get("photos", "albums")]
		];
		var to = Site.Get("to");
		if (owner_id > 0 && !to)
			tabs.push(["photos" + owner_id + "?act=tagged", Lang.get("photos", "albums_tagged")]);
		if (owner_id == API.userId && Site.counters && Site.counters.photos > 0 && !to)
			tabs.push(["photos" + owner_id + "?act=new_tags", "Отметки <i class=count>" + Site.counters.photos + "</i>"]);
		return Site.getTabPanel(tabs);
	},


	/* Albums */


	getAlbums: function (owner_id) {
		var offset = getOffset();
		Site.Loader();
		Site.API("execute", {
			code: 'return API.photos.getAlbums({owner_id:%u,offset:%o,need_system:1,need_covers:1,count:30,v:5.8});'
				.replace(/%u/i, owner_id)
				.replace(/%o/i, offset)
		}, function (data) {
			var data = Site.isResponse(data),
				count = data.count,
				albums = data.items,
				parent = document.createElement("div"),
				list = document.createElement("div"),
				to = Site.Get("to");
			for (var i = 0, l = albums.length; i < l; ++i)
				list.appendChild(Photos.itemAlbum(albums[i], {}));
			var menu = {
				"Все комментарии": function (event) {window.location.hash = "#photos" + owner_id + "?act=comments"}
			};
			if ((Local.data[owner_id] && Local.data[owner_id].is_admin) || owner_id == API.userId)
				menu[Lang.get("photos", "albums_actions_create")] = function (event) {window.location.hash = "#photos" + owner_id + "?act=create"};
			parent.appendChild(Photos.getTabs(owner_id));
			parent.appendChild(
				Site.getPageHeader(count + " " + Lang.get("photos", "albums_count", count),
					!to ? Site.CreateDropDownMenu(Lang.get("photos", "albums_actions"), menu) : null
				));
			if (to)
				parent.appendChild(Site.createTopButton({link: "im?act=upload_photo&to=" + to, title: "Загрузить"}));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(offset, count, 30));
			Site.append(parent);
			Site.setHeader(Lang.get("photos", "albums"), !to ? {} : {link: "im?to=" + to});
		});
	},
	itemAlbum: function (c, opts) {
		var img = new Image(), e = $.e;
		img.src = getURL(c.thumb_src);
		return e("a", {
			href: "#photos" + c.owner_id + "_" + (c.aid || c.album_id || c.id) + Photos.getToParam(0),
			"class": "albums-item",
			append: [
				e("div", {"class": "albums-left", append: [
					img,
					e("div", {"class": "albums-size", html: c.size})
				]}),
				e("div", {"class": "albums-info", append: [
					e("div", {"class": "bold", html: Site.Escape(c.title)}),
					e("div", {"class": "albums-created", html: (c.updated ? Lang.get("photos", "album_updated") + " " + $.getDate(c.updated) : "")})
				]})
			]
		});
	},
	createAlbum: function (owner_id) {
		var Form = document.createElement("div"),
			getPrivacySelect = function (name) {
				var select = document.createElement("select");
				select.name = name;
				var types = Lang.get("photos", "new_album_private");
				for (var i = 0, l = types.length; i < l; ++i)
					select.appendChild($.e("option", {html: types[i], value: i}));
				return select;
			},
			getTip = function (text) {
				return $.e("div", {"class": "tip tip-form", html: text});
			};

		var title, description, privacy, comment_privacy;

		Form.className = "sf-wrap";
		Form.appendChild(getTip(Lang.get("photos", "new_album_title")));
		Form.appendChild(title = $.elements.create("input", {type: "text", name: "title", required: true}));
		Form.appendChild(getTip(Lang.get("photos", "new_album_description")));
		Form.appendChild(description = $.elements.create("textarea", {name: "description"}));
		Form.appendChild(getTip(Lang.get("photos", "new_album_who_can_view")));
		Form.appendChild(privacy = getPrivacySelect("privacy"));
		Form.appendChild(getTip(Lang.get("photos", "new_album_who_can_comment")));
		Form.appendChild(comment_privacy = getPrivacySelect("comment_privacy"));
		//Form.appendChild($.elements.create("input", {type: "submit", value: "Создать альбом"}));


		var modal = new Modal({
			title: Lang.get("photos", "new_album_verb"),
			content: Form,
			footer: [
				{
					name: "create",
					title: Lang.get("photos.albums_actions_create"),
					onclick: function () {
						var _title = $.trim(title.value),
							_description = $.trim(description.value),
							_privacy = privacy.options[privacy.selectedIndex].value,
							_comment_privacy = comment_privacy.options[comment_privacy.selectedIndex].value;
						if (!title) {
							Site.Alert({text: Lang.get("photos", "new_album_error1")});
							return false;
						}
						Site.APIv5("photos.createAlbum", {
							group_id: (owner_id < 0 ? -owner_id : ""),
							title: _title,
							description: _description,
							privacy: _privacy,
							comment_privacy: _comment_privacy,
							v: 5.0
						}, function (data) {
							data = Site.isResponse(data);
							modal.close();
							if (data)
								window.location.hash = "#photos" + data.owner_id + "_" + (data.id || data.aid)
						})
					}
				}
			]
		}).show();


		//Site.append(parent);
		//Site.setHeader(Lang.get("photos", "new_album"), {link: "photos" + owner_id});
	},
	albumsInfo: {},
	albumsContent: {},
	requestAlbum: function (owner_id, album_id, offset) {
		console.log("requestAlbum", arguments);
		offset = offset || 0;
		if (Photos.albumsInfo[owner_id + "_" + album_id] && Photos.albumsContent[owner_id + "_" + album_id] && Photos.albumsContent[owner_id + "_" + album_id].items[offset] && offset + 30 >= Photos.albumsContent[owner_id + "_" + album_id].size && Photos.albumsContent[owner_id + "_" + album_id].items[offset + 30])
		//if (!offset || offset + 31 < Photos.albumsContent[owner_id + "_" + album_id].length)
			return Photos.getAlbum(owner_id, album_id, [Photos.albumsContent[owner_id + "_" + album_id], Photos.albumsInfo[owner_id + "_" + album_id]], 0);
		Site.Loader();
		Site.API("execute", {
			code: 'var o=%o,a=%a;return [API.photos.get({owner_id:o,album_id:a,extended:1,v:5.0,offset:%q,count:1000}),API.photos.getAlbums({owner_id:o,album_ids:a,v:5}).items[0]];'
				.replace(/%o/g, owner_id)
				.replace(/%a/g, album_id)
				.replace(/%q/g, offset)
		}, function (data) {
			Photos.getAlbum(owner_id, album_id, Site.isResponse(data), offset );
		})
	},
	chateAlbum: function (owner_id, album_id, info, content, offset) {
		console.log("chateAlbum", arguments);
		Photos.albumsInfo[owner_id + "_" + album_id] = info;
		if (!offset) {
			Photos.albumsContent[owner_id + "_" + album_id] = content;
		} else {
			if (!Photos.albumsContent[owner_id + "_" + album_id]) {
				Photos.albumsContent[owner_id + "_" + album_id] = {count: info.size, items: []};
			}
			for (var i = 0, l = content.items.length; i < l; ++i) {
				Photos.albumsContent[owner_id + "_" + album_id].items[offset + i] = content.items[i];
			}
		}
	},


	/* Photos in albums */


	getAll: function (owner_id) {
		var offset = getOffset();
		Site.Loader();
		Site.API("execute", {
			code: 'return API.photos.getAll({owner_id:%u,offset:%o,extended:1,count:30,v:5});'
				.replace(/%u/i, owner_id)
				.replace(/%o/i, offset)
		}, function (data) {
			data = Site.isResponse(data);
			var count = data.count,
				photos = data.items,
				parent = document.createElement("div"),
				list = document.createElement("div");
			parent.appendChild(Photos.getTabs(owner_id));
			parent.appendChild(Site.getPageHeader(count + " " + Lang.get("photos", "photos_count", count)));
			if (count == 0)
				list.appendChild(Site.getEmptyField(Lang.get("photos", "photos_empty")));
			for (var i = 0, l = photos.length; i < l; ++i) {
				if (photos[i] == null)
					break;
				list.appendChild(Photos.itemPhoto(photos[i], {likes: true, comments: false}));
			}
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 30));
			Site.append(parent);
			Site.setHeader(Lang.get("photos", "photos_all"), {link: "photos" + owner_id});
		});
	},
	getAlbum: function (owner_id, album_id, data, offset) {
		var info = data[1],
			content = data[0];
		console.log("getAlbum", arguments);
		Photos.chateAlbum(owner_id, album_id, info, content, offset);
		content = Photos.albumsContent[owner_id + "_" + album_id];
		var count = content.count,
			photos = content.items,
			title = Site.Escape(info.title),
			parent = document.createElement("div"),
			list = document.createElement("div"),
			offset = getOffset(),
			menu = {},
			to = Site.Get("to");
		console.log(photos);
		menu[Lang.get("photos", "photos_comments_album")] = ((function (owner_id, album_id) {return function (event) {window.location.hash = "#photos" + owner_id + "?act=comments&album_id=" + album_id;}})(owner_id, album_id));
		if (album_id > 0) {
			menu[Lang.get("photos", "photos_edit_album")] = ((function (owner_id, album_id) {return function (event) {Photos.editAlbumPage(owner_id, album_id)};})(owner_id, album_id));
			menu[Lang.get("photos", "photos_delete_album")] = ((function (owner_id, album_id) {
				return function (event) {
					VKConfirm(Lang.get("photos", "photos_delete_album_confirm"), function () {
						Site.API("photos.deleteAlbum", {
							owner_id: owner_id,
							album_id: album_id
						}, function (data) {
							if (Site.isResponse(data) == 1) {
								Site.Alert({
									text: Lang.get("photos", "photos_delete_album_success")
								});
								window.location.hash = "#photos" + owner_id;
							};
						});
					});
				};
			})(owner_id, album_id));
		}
		parent.appendChild(Site.getPageHeader(count + " " + Lang.get("photos", "photos_count", count),
			!to ? Site.CreateDropDownMenu("Действия", menu) : null
		));
		if ((owner_id == API.userId || info.can_upload) && !to && album_id > 0)
			parent.appendChild(Site.createTopButton({tag: "div", title: Lang.get("photos", "photos_upload"), onclick: function () {
				Photos.getUploadForm(owner_id, album_id);
			}}));
		if (!count)
			list.appendChild(Site.getEmptyField(Lang.get("photos", "photos_empty")));
		console.log(offset);
		for (var i = offset, l = offset + 30; i < l; ++i) {
			console.log(i, photos[i]);;
			if (photos[i] == null)
				continue;
			list.appendChild(Photos.itemPhoto(photos[i], {likes: true, comments: true}));
		}
		parent.appendChild(list);
		parent.appendChild(Site.getSmartPagebar(getOffset(), count, 30));
		Site.append(parent);
		Site.setHeader(Lang.get("photos", "album"), {link: "photos" + owner_id + Photos.getToParam(0)});
	},
	getPrivacySelect: function (name, defaultValue) {
		var select = document.createElement("select");
		select.name = name;
		var types = Lang.get("photos", "new_album_private"), obj;
		for (var i = 0, l = types.length; i < l; ++i) {
			obj = {html: types[i], value: i};
			if (i == defaultValue)
				obj.selected = true;
			select.appendChild($.elements.create("option", obj));
		}
		return select;
	},
	getTip: function (text) {
		return $.e("div", {"class": "tip tip-form", html: text});
	},
	editAlbumPage: function (owner_id, album_id) {
		var album = Photos.albumsInfo[owner_id + "_" + album_id],
			parent = document.createElement("div"),
			Form = document.createElement("form"),
			toInt = function (str) {
				return typeof str === "number" ? str : {
					all: 0,
					friends: 1,
					friends_of_friends: 2,
					nobody: 3,
					users: 1
				}[str.type];
			};
		Form.className = "sf-wrap";
		Form.appendChild(Photos.getTip(Lang.get("photos", "new_album_title")));
		Form.appendChild($.elements.create("input", {type: "text", name: "title", required: true, value: album.title}));
		Form.appendChild(Photos.getTip(Lang.get("photos", "new_album_description")));
		Form.appendChild($.elements.create("textarea", {name: "description", html: album.description}));
		Form.appendChild(Photos.getTip(Lang.get("photos", "new_album_who_can_view")));
		Form.appendChild(Photos.getPrivacySelect("privacy", toInt(album.privacy_view)));
		Form.appendChild(Photos.getTip(Lang.get("photos", "new_album_who_can_comment")));
		Form.appendChild(Photos.getPrivacySelect("comment_privacy", toInt(album.privacy_comment)));
		Form.appendChild($.elements.create("input", {type: "submit", value: Lang.get("photos", "edit_album_save")}));
		Form.onsubmit = function (event) {
			var title = this.title && $.trim(this.title.value),
				description = this.description && $.trim(this.description.value),
				privacy = this.privacy && this.privacy.options[this.privacy.selectedIndex].value,
				comment_privacy = this.comment_privacy && this.comment_privacy.options[this.comment_privacy.selectedIndex].value;
			if (!title) {
				Site.Alert({text: Lang.get("photos", "new_album_error1")});
				return false;
			}
			Site.API("photos.editAlbum", {
				owner_id: owner_id,
				album_id: album_id,
				title: title,
				description: description,
				privacy: privacy,
				comment_privacy: comment_privacy
			}, function (data) {
				data = Site.isResponse(data);
				if (data) {
					var a = Photos.albumsInfo[owner_id + "_" + album_id];
					a.title = title;
					a.description = description;
					a.privacy_view = privacy;
					a.privacy_comment = comment_privacy;
					Site.route(window.location.hash = "#photos" + owner_id + "_" + album_id)
				}
			})
			return false;
		};
		parent.appendChild(Site.getPageHeader(Lang.get("photos", "edit_album_verb")));
		Site.setHeader(Lang.get("photos", "new_album"), {link: "photos" + owner_id});
		parent.appendChild(Form);
		Site.append(parent);
	},
	getUserTagged: function (owner_id) {
		Site.APIv5("photos.getUserPhotos", {
			user_id: owner_id,
			offset: getOffset(),
			count: 40,
			extended: 1,
			sort: 0,
			v: 5.0
		}, function (data) {
			if (!data.response) {
				Site.append(Site.getEmptyField(Lang.get("photos", "photos_access_denied_userphotos")));
				Site.setHeader("Назад", {link: "photos" + owner_id});
			}
			data = Site.isResponse(data);
			var count = data.count,
				photos = data.items,
				parent = document.createElement("div"),
				list = document.createElement("div");
			parent.appendChild(Photos.getTabs(owner_id));
			parent.appendChild(Site.getPageHeader(count + " " + Lang.get("photos", "photos_count", count)));
			if (count == 0)
				list.appendChild(Site.getEmptyField(Lang.get("photos", "photos_empty")));
			Photos.lists["tags" + owner_id] = [];
			for (var i = 0, l = photos.length; i < l; ++i) {
				if (photos[i] == null)
					break;
				Photos.lists["tags" + owner_id].push(photos[i]);
				list.appendChild(Photos.itemPhoto(photos[i], {likes: true, comments: false}));
			}
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 40));
			Site.append(parent);
			Site.setHeader("Отмеченные фотографии", {link: "photos" + owner_id});
		});
	},
	getNewTags: function () {
		Site.APIv5("photos.getNewTags", {
			offset: getOffset(),
			count: 40,
			v: 5.0
		}, function (data) {
			data = Site.isResponse(data);
			var count = data.count,
				photos = data.items,
				parent = document.createElement("div"),
				list = document.createElement("div");
			parent.appendChild(Photos.getTabs(API.userId));
			parent.appendChild(Site.getPageHeader(count + " " + Lang.get("photos", "photos_count", count)));
			if (count == 0)
				list.appendChild(Site.getEmptyField(Lang.get("photos", "photos_empty")));
			//Photos.lists["newtags"] = [];
			for (var i = 0, l = photos.length; i < l; ++i) {
				if (photos[i] == null)
					break;
				//Photos.lists["newtags"].push(photos[i]);
				list.appendChild(Photos.itemPhoto(photos[i], {likes: true, comments: false, list: "newtags"}));
			}
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 40));
			Site.append(parent);
			Site.setHeader("Новые отметки", {link: "photos" + API.userId});
		})
	},
	photos: {},
	access_keys: {},
	lists: {},
	createList: function (list_id, photos) {
		Photos.lists[list_id] = (function (data) {
			for (var ids = [], i = 0, l = data.length; i < l; ++i) {
				data[i] = Photos.v5normalize(data[i]);
				ids.push(data[i].owner_id + "_" + data[i].id);
				Photos.addPhotoChate(data[i]);
			}
			return ids;
		})(photos);
		return list_id;
	},
	addPhotoChate: function (c) {
		Photos.photos[c.owner_id + "_" + c.id] = c;
		if (c.access_key)
			Photos.access_keys[c.owner_id + "_" + c.id] = c.access_key;
	},
	itemPhoto: function (c, opts) {
		opts = opts || {};
		var item = document.createElement("a"),
			list = opts && opts.list,
			access_key = c.access_key || c.accessKey,
			params = {},
			to = Site.Get("to");
		c = Photos.v5normalize(c);
		item.className = "photos-item";
		if (access_key)
			params.access_key = access_key;
		if (list) {
			if (/^(wall|comment|mail|new|photo)/ig.test(list))
				params.list = list;
			if (!Photos.lists[list])
				Photos.lists[list] = [];
			c.list = list;
			if (!$.inArray(c, Photos.lists[list]))
				Photos.lists[list].push(c);
		};
		if (to)
			params.to = to;
		if (opts.from)
			params.from = opts.from;
		params = httpBuildQuery(params);
		item.href = "#photo" + (c.owner_id || c.ownerId) + "_" + (c.id || c.photoId) + (params ? "?" + params : "");
		Photos.addPhotoChate(c);
		item.appendChild($.e("img", {src: getURL(opts.wall ? c.photo_604 || c.photo604 : c.photo_130 || c.photo130)}));
		var f;
		f = (opts && opts.likes && c.likes && c.likes.count > 0);
		item.appendChild($.e("div", {"class": "photos-likes photos-tips" + (!f ? " hidden" : ""), append: [
			$.e("div", {"class": "wall-icons likes-icon" + (c.likes && !c.likes.user_likes ? "-on" : "")}),
			$.e("span", {html: " " + (c.likes && c.likes.count), id: "minilike-count_" + c.owner_id + "_" + c.id})
		]}));
		f = false;
		f = opts && opts.comments && c.comments && c.comments.count > 0;
		item.appendChild($.e("div", {"class": "photos-comments photos-tips" + (!f ? " hidden" : ""), append: [
			$.e("div", {"class": "wall-icons wall-comments"}),
			$.e("span", {html: " " + (c.comments && c.comments.count)})
		]}));

		return item;
	},
	getUploadForm: function (ownerId, albumId) {
		var node = $.e("input", {type: "file", multiple: true, accept: "image/*", onchange: function () {
			Photos.upload(ownerId, albumId, node);
		}});
		node.click();
	},

	upload: function (ownerId, albumId, node) {
		uploadFiles(node, {
			maxFiles: 50,
			method: "photos.getUploadServer",
			params: { group_id: ownerId < 0 ? -ownerId : 0, album_id: albumId }
		}, {
			onTaskFinished: function (result) {

				Site.Alert({text: Lang.get("photos", "album_uploaded_success", result.length) + " " + result.length + " " + Lang.get("photos", "album_uploaded_photos", result.length) + "!"});

				var hasObject = !!Photos.albumsContent[ownerId + "_" + albumId];

				result.forEach(function (p) {
					Photos.photos[ownerId + "_" + p.id] = Photos.v5normalize(p);
					if (hasObject) {
						Photos.albumsContent[ownerId + "_" + albumId].count++;
						Photos.albumsContent[ownerId + "_" + albumId].items.push(p);
					};
				});
				window.location.hash = "#photos" + ownerId + "_" + albumId +
					"?offset=" + (hasObject ? (Math.floor(Photos.albumsContent[ownerId + "_" + albumId].items.length / 30) * 30) : 0);
			}
		});
	},


	/* Comments */


	getAllComments: function (owner_id) {
		Site.Loader();
		Site.API("execute", {
			code: 'var c=API.photos.getAllComments({owner_id:%h%,album_id:%a%,count:30,offset:%o%,need_likes:1,v:5}),p=[],i=0;while(i<c.items.length){p.push("%h%_"+c.items[i].pid);i=i+1;}return[c,API.users.get({user_ids:c.items@.from_id+c.items@.reply_to_user,fields:"photo_rec,screen_name,online,first_name_dat,last_name_dat",v:5.0}),API.photos.getById({photos:p,extended:1,v:5.0})];'
				.replace(/%h%/ig, owner_id)
				.replace(/%a%/ig, Site.Get("album_id"))
				.replace(/%o%/ig, getOffset())
		}, function (data) {
			data = Site.isResponse(data);
			var comments = data[0],
				count = comments.count,
				comments = comments.items,
				users = Local.add(data[1]),
				photos = (function (photos) {
					var data = {};
					for (var i = 0, l = photos.length; i < l; ++i)
						data[photos[i].owner_id + "_" + (photos[i].id || photos[i].pid)] = photos[i];
					return data;
				})(data[2]),
				parent = document.createElement("div"),
				list = document.createElement("div");
			for (var i = 0, l = comments.length; i < l; ++i)
				list.appendChild(Photos.itemComment(comments[i], owner_id, comments[i].pid, {photo: photos[owner_id + "_" + comments[i].pid]}));
			parent.appendChild(Site.getPageHeader(Lang.get("photos", "photos_all")));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 30));
			Site.append(parent);
			Site.setHeader(Lang.get("photos", "photos_all"), {link: "photos" + owner_id});
		})
	},

	// SEE HERE
	reply: function (ownerId, photoId, commentId, toId){
		var area = $.element("photo-comment-writearea"),
			to = Local.data[toId],
			reply = $.element("wall-comments-reply" + ownerId + "_" + photoId),
			replyUI = $.element("wall-comments-replyUI" + ownerId + "_" + photoId),
			e = $.e;

		if (reply.value == commentId)
			return;

		if (!$.trim(area.value))
			reply.value = commentId;
		area.value += " [" + (to.screen_name || (toId > 0 ? "id" + toId : "club" + (-toId))) + "|" + (to.name || to.first_name) + "], ";
		var l = area.value.length - 1;
		area.setSelectionRange(l, l);
		$.elements.clearChild(replyUI);
		replyUI.appendChild(e("div", {append: [
			e("a", {href: "#" + to.screen_name, html: (to.name || to.first_name_dat + " " + to.last_name_dat)}),
			e("div", {"class": "feed-close a", onclick: function (event) {
				area.value = area.value.replace(new RegExp("^\[" + to.screen_name + "|" + (to.name || to.first_name) + "\], " ,"img"), "");
				reply.value = "";
				$.elements.clearChild(replyUI);
			}})
		]}))
	},


	/* Viewer v3.0 */


	getShow: function (owner_id, photo_id, access_key, list) {
		if (list && Photos.lists[list] && (list = Photos.lists[list])) {
			return Photos.getViewer(list, Photos.getCurrentPositionInViewedList(list, {owner_id: owner_id, id: photo_id}, {place: null}));
		} else {
			if (
				Photos.photos[owner_id + "_" + photo_id] &&
				Photos.lists[owner_id + "_" + Photos.photos[owner_id + "_" + photo_id].album_id]
			) {
				return Photos.getViewer(
					Photos.lists[owner_id + "_" + Photos.photos[owner_id + "_" + photo_id].album_id],
					Photos.getCurrentPositionInViewedList(
						Photos.lists[owner_id + "_" + Photos.photos[owner_id + "_" + photo_id].album_id],
						{owner_id: owner_id, id: photo_id}
					)
				);
			}
			Site.API("execute", {
				code: 'var a=API.photos.getById({photos:"%o%_%p%%a%",extended:1,v:5.7})[0];return [API.photos.get({owner_id:%o%,album_id:a.album_id,extended:1,v:5.7}),"%o%_"+a.album_id,a];'
					.replace(/%o%/ig, owner_id)
					.replace(/%p%/ig, photo_id)
					.replace(/%a%/ig, access_key ? "_" + access_key : "")
			}, function (data) {
				data = Site.isResponse(data);
				var photos = data[0],
					list = list || data[1],
					item = data[2];
				if (!Photos.lists[list])
					Photos.lists[list] = [];
				if (!photos)
					photos = {items: [item]};

				item && (item.list = list);

				for (var i = 0, l = photos.items.length; i < l; ++i) {
					photos.items[i] = Photos.v5normalize(photos.items[i]);
					Photos.lists[list].push(photos.items[i]);
					Photos.photos[photos.items[i].owner_id + "_" + photos.items[i].id] = photos.items[i];
				}
				Photos.photos[item.owner_id + "_" + item.id] = item;
				var name = String(Site.Get("list"));
				list = Photos.lists[list];
				var pos = (/^mail/igm.test(name)) ? list && list[0] : {owner_id: owner_id, id: photo_id};
				return Photos.getViewer(list, Photos.getCurrentPositionInViewedList(list, pos));
			})
		}
	},
	getCurrentPositionInViewedList: function (list, object) {
		for (var i = 0, l = list.length, o = object.owner_id, p = (object.id || object.pid), c = -1; i < l && c == -1; ++i)
			if (list[i].list == object || list[i].owner_id == o && (list[i].id == p || list[i].pid == p))
				c = i;
		return c != -1 ?
			{current: c, previous: list[c - 1] ? c - 1 : false, next: list[c + 1] ? c + 1 : false} :
			{current: -1, previous: false, next: false, photo: Photos.photos[object.owner_id + "_" + object.id]};
	},
	getViewer: function (list, position, objects) {
		var previous   = list[position.previous],
			next       = list[position.next],
			photo      = list[position.current === -1 ? -1 : position.current] || position.photo,
			owner_id   = photo.owner_id,
			album_id   = photo.album_id || photo.aid,
			photo_id   = photo.id || photo.pid,
			access_key = photo.access_key || Site.Get("access_key") || "",
			place      = objects && objects.place,
			parent     = document.createElement("div"),
			header     = document.createElement("div"),
			frame      = document.createElement("div"),
			shower     = document.createElement("div"),
			headerFull = document.createElement("div"),
			footerFull = document.createElement("div"),
			makeLike   = Photos.getLikeEffect(owner_id, photo_id),
			footer     = document.createElement("div"),
			commentsWrap   = document.createElement("div"),
			like       = getLikeButton("photo", owner_id, photo_id, access_key, photo.likes && photo.likes.count, photo.likes && photo.likes.user_likes),
			links      = (function (a,b,c,d,e,f,g,h,i,j,k,l){for(;e<f;++e){l={};if(a[c+d[e]]==g)continue;l[j]=(((((l[i]=((((100*d[e])/a[i])*a[i])/100))*100)/a[i])*a[j])/100);l[k]=a[c+d[e]];b[h](l);};return b;})(photo,[],"photo_",[75,130,604,807,1280,2560],0,6,undefined,"push","width","height","url",{}),
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
		headerFull.appendChild($.elements.create("div", {"class": "photo-view-full-header-title", html: headerText}))
		shower.className = "photo-shower";
		shower.appendChild(makeLike);
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

		Photos.touchEvent(shower, function (event)
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
			}, 550);
		window.onKeyDownCallback = function (event)
		{
			switch (event.key)
			{
				case KeyboardCodes.left: onClickPhoto(0); break;
				case KeyboardCodes.right: onClickPhoto(100); break;
			};
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
			*/		};
		footer.appendChild($.e("div", {"class": "photo-uploaded", append: [
			$.e("span", {"class": "tip", html: Lang.get("photos.photo_view_uploaded")}),
			document.createTextNode($.getDate(photo.date))
		]}));
		footer.appendChild($.e("div", {"class": "photo-album", append: [
			$.e("span", {"class": "tip", html: Lang.get("photos.photo_view_album")}),
			$.e("a", {href: "#photos" + owner_id + "_" + album_id, html: Site.Escape(Photos.albumsInfo[owner_id + "_" + album_id] && Photos.albumsInfo[owner_id + "_" + album_id].title) || "< Альбом >"})
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

	share: function(ownerId, photoId, accessKey, canRepost) {
		share("photo", ownerId, photoId, accessKey, actionAfterShare, {
			wall: canRepost,
			user: true,
			group: true
		});
	},

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
				};
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
				};
				users.push(document.createTextNode(", "));
			}
			users.length = users.length - 1;
			$.element("photo_tags_" + owner_id + "_" + photo_id).appendChild($.elements.create("div", {append: users}));
		});
	},
	setFullViewMode: function (state) {
		var e = document.getElementsByTagName("html")[0], c = "photo-view-full";
		if (state)
			$.elements.addClass(e, c)
		else
			$.elements.removeClass(e, c)
	},
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
	alreadySaved: {},
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
				};

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
			})
			return false;
		};
		Site.append(Form);
	},
	deletePhoto: function (owner_id, photo_id, access_key, node) {
		VKConfirm(Lang.get("photos", "photo_action_delete"), function () {
			Site.API("photos.delete", {
				owner_id: owner_id,
				photo_id: photo_id,
				access_key: access_key
			}, function (data) {
				data = Site.isResponse(data);
				if (data) {
					var bl;
					node.parentNode.insertBefore(bl = $.e("div", {
						"class": "photo-deleted",
						append: [
							$.e("span", {html: Lang.get("photos", "photo_action_deleted")}),
							document.createTextNode(" "),
							$.e("span", {"class": "a", html: "Восстановить", onclick: function (event) {
								Photos.restorePhoto(owner_id, photo_id, access_key, bl);
							}})
						]
					}), node.nextSibling);
				}
			})
		});
	},
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
	downloadPhoto: function (owner_id, photo_id, access_key, links) {
		var parent = document.createElement("div"),
			item = function (url, width, height) {
				return $.elements.create("a", {href: url, target: "_blank", html: parseInt(width) + "&times;" + parseInt(height)});
			};
		parent.id = "photo_downloadlinks" + owner_id + "_" + photo_id;
		parent.className = "profile-lists";
		parent.appendChild(Site.getPageHeader("Ссылки на оригиналы"));
		for (var i = 0, l = links.length; i < l; ++i) {
			var link = links[i];
			parent.appendChild(item(link.url, link.width, link.height));
		}
		parent.appendChild($.elements.create("img", {src: "//static.apidog.ru/im-attachload.gif", style: "display: block; margin: 7px auto;"}))
		Site.append(parent);
		Site.setHeader("Оригиналы", {fx: function (event) {
			Site.route(window.location.hash);
		}});
		Site.API("execute", {
			code: 'return API.photos.getById({photos:"%id%",photo_sizes:1})[0].sizes;'
				.replace(/%id%/ig, owner_id + "_" + photo_id + (access_key ? "_" + access_key : ""))
		}, function (data) {
			data = Site.isResponse(data);
			if (!data)
				return;
			$.elements.clearChild(parent);
			parent.appendChild(Site.getPageHeader("Ссылки на оригиналы"));

			data.sort(function (a, b)
			{
				return a.width > b.width ? -1 : a.width < b.width ? 1 : 0;
			});

			for (var i = 0, l = data.length; i < l; ++i) {
				var link = data[i];
				parent.appendChild(item(link.src, link.width, link.height));
			}
		})
	},
	setProfilePhoto: function (ownerId, photoId) {
		Site.API("execute", {
			code: "return API.photos.reorderPhotos({owner_id:%o,photo_id:%p,after:API.photos.get({owner_id:%o,album_id:-6,rev:1,count:1,v:5.28}).items[0].id,v:5.28});".replace(/%o/img, ownerId).replace(/%p/img, photoId)
		}, function (data) {
			if (data.response)
				Site.Alert({text: Lang.get("photos.successfully_setted_profile_photo")});
		});
	},
	likePhoto: function (owner_id, photo_id, access_key, onCompleteCallback) {
		Site.API("execute", {
			code: 'var p={type:"photo",access_key:"' + access_key + '",item_id:' + photo_id + ',owner_id:' + owner_id + '},me=API.likes.isLiked(p),act;if(me==0)act=API.likes.add(p);else act=API.likes.delete(p);return [(-me)+1,act.likes];'
		}, function (result) {
			data = Site.isResponse(result);
			if (onCompleteCallback && typeof onCompleteCallback === "function")
				onCompleteCallback({owner_id: owner_id, photo_id: photo_id}, {count: data[1], me: data[0]})
		});
	},
	getLikes: function (ownerId, photoId, accessKey, list) {
		Site.Loader();
		var offset = getOffset();
		Site.APIv5("likes.getList", {
			type: "photo",
			owner_id: ownerId,
			item_id: photoId,
			access_key: accessKey,
			filter: "likes",
			fields: "photo_50,online,screen_name",
			extended: 1,
			offset: offset,
			count: 50,
			v: 5.20
		}, function (data) {
			if (!(data = Site.isResponse(data)))
				return;
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				count = data.count,
				data = data.items;

			if (count)
				for (var i = 0, l = data.length; i < l; ++i)
					list.appendChild(Templates.getMiniUser(data[i]));
			else
				list.appendChild(Site.getEmptyField("Никто не оценил"));

			parent.appendChild(Site.getPageHeader(count ? count + " " + $.textCase(count, ["пользователь оценил", "пользователя оценили", "пользователей оценили"]) : "Оценили"));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(offset, count, 50));

			Site.append(parent);
			Site.setHeader("Оценили", {link: "photo" + ownerId + "_" + photoId});
		});
	},


	/* Event Helpers */


	initTouchEventPhoto: function (node) {
		node.onclick = function (event) {
			return false;
		};
		var id = node.href.split("#")[1].replace(/photo/i, "").split("_"),
			owner_id = parseInt(id[0]),
			photo_id = parseInt(id[1]);
		Photos.touchEvent(node, function (event) {
			window.location.href = node.href;
		}, function (event) {
			Photos.likePhoto(owner_id, photo_id, "", function (photo, likes) {
				var link = $.element("minilike" + photo.owner_id + "_" + photo.photo_id),
					count = $.element("minilike-count_" + photo.owner_id + "_" + photo.photo_id),
					icon = count.previousSibling;
				count.innerHTML = " " + likes.count;
				if (likes.me == 1) {
					$.elements.addClass(link, "photos-minilike-active");
					icon.className = "wall-icons likes-icon";
				} else {
					$.elements.removeClass(link, "photos-minilike-active");
					icon.className = "wall-icons likes-icon-on";
				}
				if (likes.count)
					$.elements.removeClass(count.parentNode, "hidden");
				else
					$.elements.addClass(count.parentNode, "hidden");
			});
		});

	},
	isTouch: function () {
		var agent = navigator.userAgent.toLowerCase();
		return !!(agent.indexOf("iphone") >= 0 || agent.indexOf("ipad") >= 0 || agent.indexOf("android") >= 0);
	},
	touchEvent: function(node, onTapCallback, onDoubleTapCallback, delay){

		if ((API.bitmask & 512) != 0) {
			$.event.add(node, "click", onTapCallback);
			return;
		}

		var isiOS = Photos.isTouch(),
			action;
		delay = delay == null ? 500 : delay;
		$.event.add(node, isiOS == true ? "touchend" : "click", function (event) {
			var now = new Date().getTime(),
				lastTouch = node.getAttribute("lasttouch") || now + 1,
				delta = now - lastTouch;
			clearTimeout(action);
			if (delta < 500 && delta > 0) {
				if (onDoubleTapCallback != null && typeof onDoubleTapCallback == "function")
					onDoubleTapCallback(event);
			} else {
				node.setAttribute("lasttouch", now);
				action = setTimeout(function () {
					if (onTapCallback != null && typeof onTapCallback == "function")
						onTapCallback(event);
					clearTimeout(action);
				}, delay, [event]);
			}
			node.setAttribute("lasttouch", now);
		});
	},

	/* UI Effects */

	getLikeEffect: function (owner_id, photo_id) {
		return $.elements.create("div", {"class": "photo-likeeffect", id: "photo_like_effect" + owner_id + "_" + photo_id});
	},
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
					setCurrentPosition(element, -(((33.33 + (start.x < touch.x ? -per : per)) * 3) / 3))
					//element.style.transform = "translateX(-" +  + "%)";
					$.event.cancel(event);
				}
				if ((is.up || is.down) && !$.elements.hasClass(document.getElementsByTagName("html")[0], "photo-view-full")) {
					var top = (is.up ? start.y - touch.y : -(touch.y - start.y));
					window.scrollBy(0, top);
				}
				is.count++;
			})
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
