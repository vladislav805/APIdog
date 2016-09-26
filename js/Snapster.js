/**
 * APIdog v6.5
 *
 * Branch: dev
 * Progress: 40%
 */

function SnapsterItem (d) {
	this.type = d.type;
	this.ownerId = d.source_id;
	this.postId = d.post_id;
	this.date = d.date;
	this.photo = new SnapsterPhoto(d.photos.items[0]);
};

SnapsterItem.prototype = {

	getId: function() {
		return this.ownerId + "_" + this.postId;
	},

	getNode: function() {
		return $.e("div", {"class": "snapster-item", append: [
			this._getHeader($.e),
			this._getContent($.e),
			this._getFooter($.e)
		]});
	},

	getOwner: function() {
		return Local.Users[this.ownerId];
	},

	getLinkForOwner: function() {
		return "#" + this.getOwner().screen_name;
	},

	getLink: function() {
		return "#chronicle?act=item&id=" + this.getId();
	},

	getDate: function() {
		var d = new Date(this.date * 1000);

		return d.getHours().fix00() + ":" + d.getMinutes().fix00();
	},

	getComments: function() {
		return this.photo.getComments();
	},

	_getHeader: function(e) {
		return e("div", {"class": "snapster-head", append: [
			e("a", {
				"class": "snapster-head-time",
				href: this.getLink(),
				html: this.getDate()
			}),
			e("a", {
				"class": "snapster-head-photo",
				href: this.getLinkForOwner(),
				append: e("img", {
					src: this.getOwner().photo_100
				})
			}),
			e("div", {"class": "snapster-head-content", append: [
				e("a", {href: this.getLinkForOwner(), html: getName(this.getOwner())})
			]})
		]});
	},

	_getContent: function(e) {
		var start = Date.now() / 1000, self = this;
		return e("div", {"class": "snapster-content", append: [
			e("img", {src: self.photo.getURL("x"), onload: function(event) {
				if (self.photo.getURL("y") && Date.now() / 1000 - start < 2)
					this.src = self.photo.getURL("y");
			}})
		]});
	},

	_getFooter: function(e) {
		var comments = this.getComments(),
			self = this,
			actions = e("div", {"class": "snapster-footer-actions", append: [
				this._fac = e("div", {"class": "fr snapster-footer-actions-comment"}),
				this._fal = e("div", {"class": "fl snapster-footer-actions-like", onclick: function(event) {
					self.like();
				}}),
				this._falt = e("div", {"class": "fl snapster-footer-actions-likes", html: this._getLikesText(), onclick: function(event) {
					self.showLikes();
				}}),
			]}),
			wrap = e("div", {"class": "snapster-footer", append: [actions, this._getCommentNode(e, comments)]});

		return wrap;
	},

	_getCommentNode: function(e, comments) {
		var node = e("div", {"class": "snapster-footer-comments", append: comments.items.map(function(i) {
			return i.getNode();
		})});
		return node;
	},

	_getLikesText: function(p) {
		p = p || this.photo.likes;
		return p ? "Нравится " + p + " " + $.textCase(p, ["человеку", "людям", "людям"]) : "Никому не понравилось";
	},

	like: function(callback) {
		var self = this;
		Site.API("execute", {
			code: 'var p={type:"photo",item_id:' + this.photo.photoId + ',owner_id:' + this.photo.ownerId + ',access_key:"' + this.photo.accessKey + '"},me=API.likes.isLiked(p),act;act=me==0?API.likes.add(p):API.likes.delete(p);return[(-me)+1,act.likes];'
		}, function(result) {
			data = Site.isResponse(result);
			var l = data[1], i = data[0];
			if (callback) {
				callback({likes: l, isLiked: i});
			};
			$.elements[i ? "addClass" : "removeClass"](self._fal, "snapster-footer-actions-like-active");
			self.photo.isLiked = i;
			self.photo.likes = l;
			self._falt.innerHTML = self._getLikesText();
		});
	},

	showLikes: function() {
		likers("photo", this.photo.ownerId, this.photo.photoId, this.photo.accessKey);
	}
};


function SnapsterPhoto (d) {
	this.ownerId = d.owner_id;
	this.photoId = d.id;
	this.albumId = d.albumId;
	this.date = d.date;
	this.text = d.text;
	this.width = d.width;
	this.height = d.height;
	this.latitude = d.lat;
	this.longitude = d["long"];
	this.place = d.place;
	this.likes = d.likes && d.likes.count;
	this.canComment = d.can_comment;
	this.comments = d.comments;
	this.isLiked = d.likes && d.likes.user_likes;
	this.accessKey = d.access_key;
	this.photos = this._parseImages(d.sizes);
};
SnapsterPhoto.prototype = {
	_parseImages: function(sizes) {
		var d = {};
		sizes.forEach(function(size) {
			d[size.type] = size;
		});
		return d;
	},
	getURL: function(sizeId) {
		return this.photos[sizeId].src;
	},
	getComments: function() {
		var c = this.comments || {items: [], count: 0}, self = this;
		c.items = c.items.map(function(q) {
			return new SnapsterComment(q, self);
		});
		return c;
	}
};
function SnapsterComment (d, parent) {
	this.fromId = d.from_id;
	this.commentId = d.id;
	this.text = d.text;
	this.date = d.date;
	this.parent = parent;
};
SnapsterComment.prototype = {
	getAuthor: function() {
		return Local.Users[this.fromId];
	},

	getNode: function() {
		var e = $.e, a = this.getAuthor();
		return e("div", {"class": "snapster-shortComment-item", append: [
			e("a", {href: "#" + a.screen_name, html: getName(a)}),
			e("span", {html: " "}),
			e("span", {html: Mail.Emoji(Site.Escape(this.text))})
		]});
	},

	deleteComment: function(callback) {
		Site.API("photos.deleteComment", {
			owner_id: this.parent.ownerId,
			comment_id: this.commentId
		}, function(result) {
			result = Site.isResponse(result);
			if (callback) {
				callback(result);
			}
		});
	}
};

var Snapster = {

	resolve: function(act) {
		switch (act) {
			case "item":
				var id = Site.get("id");
				return Snapster.item.load(id);

			case "upload":
				return Snapster.upload.show();

			case "search":
				return Snapster.search.show();

			case "profile":
				return Snapster.profile.show();

			default:
				Snapster.feed.open().loadItems(null, Snapster.feed.showItems);
		};
	},

	feed: {

		open: function() {
			var wrap = $.e("div");
			wrap.appendChild(Site.getPageHeader("Snapster", $.e("a", {"class": "fr", href: "#chronicle?act=upload", html: "Загрузить"})));
			wrap.appendChild($.e("div", {append: Site.Loader(true), id: Snapster.feed.wrapElementId}));
			Site.Append(wrap);
			return Snapster.feed;
		},

		wrapElementId: "snapsterWrap",

		loadItems: function(startFrom, callback) {
			Site.APIv5("chronicle.getFeed", {
				count: 30,
				fields: "photo_100,online,screen_name",
				start_from: startFrom || "",
				v: 5.38
			}, function(data) {
				data = Site.isResponse(data);
				if (!data)
					return;
				Local.add(data.profiles);
				callback && callback(Snapster.parse(data.items));
				if (!startFrom) {
					$.elements.remove($.element(Snapster.feed.wrapElementId).firstChild);
				};
			});
		},

		showItems: function(data) {
			var wrap = $.element(Snapster.feed.wrapElementId);

			data.forEach(function(item) {
				wrap.appendChild(item.getNode({isFeed: true}));
			});

			return Snapster.feed;
		}
	},

	upload: {
		show: function() {

		}
	},

	item: {
		show: function() {

		}
	},

	search: {
		show: function() {

		}
	},

	profile: {
		show: function() {

		}
	},

	parse: function(d) {
		return Array.isArray(d)
			? d.map(function(o) { return new SnapsterItem(o) })
			: new SnapsterItem(d);
	},

	RequestPage: function() {
		Snapster.resolve(Site.get("act"));
	}
};

/*

chronicle.search
chronicle.getProfile
chronicle.getPhotos
chronicle.getBanned
chronicle.getPlaces
chronicle.getMessages
chronicle.getUploadServer
chronicle.save
chronicle.getMessageById
chronicle.getFeedback
chronicle.getPreset
chronicle.getExplore
chronicle.addPreset
chronicle.getPhotosById
chronicle.getExploreSection
chronicle.markAsRead
chronicle.getPresets
chronicle.banNews
chronicle.unbanNews

*/