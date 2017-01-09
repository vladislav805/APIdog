/**
 * APIdog v6.5
 *
 * Branch: editing
 * Last update: 22/08/2016
 */

var Fave = {

	RequestPage: function() {
		var section;
		switch (section = Site.get("section")) {
			case "links":
			case "posts":
			case "photos":
			case "videos":
			case "users":
				return Fave.page(Fave[section]);

			default:
				return Fave.page(Fave.users);
		};
	},

	getTabs: function() {
		return getTabPanel({
			users: {
				title: lg("fave.tabUsers"),
				link: "fave?section=users",
				current: {
					name: "section",
					value: [null, "", "users"]
				}
			},
			links: {
				title: lg("fave.tabLinks"),
				link: "fave?section=links",
				current: {
					name: "section",
					value: "links"
				}
			},
			posts: {
				title: lg("fave.tabPosts"),
				link: "fave?section=posts",
				current: {
					name: "section",
					value: "posts"
				}
			},
			photos: {
				title: lg("fave.tabPhotos"),
				link: "fave?section=photos",
				current: {
					name: "section",
					value: "photos"
				}
			},
			videos: {
				title: lg("fave.tabVideos"),
				link: "fave?section=videos",
				current: {
					name: "section",
					value: "videos"
				}
			}
		});
	},

	MAX_INSERTING: 50,

	page: function(controller) {
		var e = $.e,

			header = e("div"),
			list,

			wrap = e("div", {
				append: [
					Fave.getTabs(),
					Site.getPageHeader(header),
					controller.getNodeSearchForm(),
					list = controller.getNodeList()
				]
			}),

			reset = function() {
				isLoading = false;
			},

			isAll = false,
			isLoading = true;

		window.onScrollCallback = function(event) {
			if (!isAll && !isLoading && event.needLoading) {
				isLoading = true;
				controller.loadNext(reset);
			};
		};

		controller.onMetaData = function(count, all) {
			header.innerHTML = lg(controller.lang.header).schema({ n: count, f: lg(controller.lang.items, count) });
			isAll = all;
			if (!count) {
				$.elements.clearChild(list).appendChild(getEmptyField("fave.nothing"));
			};
		};

		if (!controller.hasCache()) {
			isLoading = true;
			controller.reset();
			controller.loadNext(reset);
		} else {
			controller.cursor = 0;
			controller.onMetaData(controller.cache.length, true);
			controller.show(Fave.MAX_INSERTING);
		};

		Site.append(wrap).setHeader(lg("fave.title"));
	},

/*

var i=0,m=25,s=200,r=[],c=1,t;while(r.length<c&&i<m){t=API.fave.getUsers({offset:s*i,count:s,v:5.52,fields:Args.f});c=t.count;r=r+t.items;i=i+1;};return r;

f = fields

*/

	users: {

		cache: [],

		cursor: 0,

		lang: {
			header: "fave.headTitle",
			items: "fave.usersUsers"
		},

		nodes: {
			form: null,
			list: null
		},

		reset: function() { this.cursor = 0; },

		hasCache: function() {
			console.log(this.cache);
			return !!this.cache.length;
		},

		getNodeSearchForm: function() {
			var e = $.e;
			return this.nodes.form = e("form");
		},

		getNodeList: function() {
			var e = $.e;
			return this.nodes.list = e("div");
		},


		loadNext: function(reset) {
			var self = this;
			new APIRequest("fave.getUsers", {
				count: 500,
				fields: "photo_100,online,can_write_private_message,city,screen_name",
				v: 5.52
			})
				.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
				.setOnCompleteListener(function(res) {
					self.onMetaData(res.count, true);
					reset();
					self.cache = self.cache.concat(res.items);
					self.show(Fave.MAX_INSERTING);
				})
				.execute();
		},

		show: function(max) {
			for (var i = 0, k = this.cursor; i < max && this.cache[k]; ++i, ++k, ++this.cursor)  {
				this.nodes.list.appendChild(Templates.getUser(this.cache[k], { fulllink: true, actions: (
					$.e("div", {"class": "i i24 fr settings-i-remove", onclick: function(event) {
						event.preventDefault();

						return false;
					}})
				)}));
			}
		}

	},



	links: {

		cache: [],

		cursor: 0,

		lang: { header: "fave.headTitle", items: "fave.linksLinks" },

		nodes: { form: null, list: null },

		reset: function() { this.cursor = 0; },

		hasCache: function() {
			return !!this.cache.length;
		},

		getNodeSearchForm: function() {
			var e = $.e;
			return this.nodes.form = e("form");
		},

		getNodeList: function() { return this.nodes.list = $.e("div"); },

		loadNext: function(reset) {
			var self = this;
			new APIRequest("fave.getLinks", {
				count: 500,
				v: 5.52
			})
				.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
				.setOnCompleteListener(function(res) {
					self.onMetaData(res.count, true);
					reset();
					self.cache = self.cache.concat(res.items);
					self.show(Fave.MAX_INSERTING);
				})
				.execute();
		},

		show: function(max) {
			var w, self = this;
			for (var i = 0, k = this.cursor; i < max && this.cache[k]; ++i, ++k, ++this.cursor)  {
				w = this.cache[k];
				(function(list, item) {

					list.appendChild(Templates.getUser({
						screen_name: item.url.split("/")[3],
						name: item.title,
						photo_50: item.photo_50,
						photo_100: item.photo_100
					}, { fulllink: true, actions: [
						$.e("div", {"class": "i i24 fr settings-i-remove", onclick: function(event) {
							event.preventDefault();
							self.remove(item.id, null);
							return false;
						}})
					]}));

				})(this.nodes.list, w);
			}
		},

		add: function(url, callback) {

		},

		remove: function(id, callback) {

		}
	},




/*

search in faved users

var fxSearch = function(event) {
	var text = $.trim(this.q ? this.q.value : this.value);
	$.elements.clearChild(list);
	if (!text) {
		Fave.insertUsers(list, Fave.userChate.response, 0, 40);
	} else {
		Fave.searchUser(list, Fave.userChate, text);
	}
	return false;
};
parent.appendChild(Site.CreateInlineForm({
	type: "search",
	name: "q",
	title: Lang.get("docs.find"),
	onsubmit: fxSearch,
	onkeyup: fxSearch,
	placeholder: Lang.get("docs.search")
}))

*/


/*

var i=0,m=25,s=200,r=[],c=1,t;while(r.length<c&&i<m){t=API.fave.getLinks({offset:s*i,count:s,v:5.52});c=t.count;r=r+t.items;i=i+1;};return r;

*/

/*

adding to faved links

$.event.cancel(event);

var link = $.trim(this.link.value);

link = link.replace(/(https?:\/\/)?apidog\.ru\/6\.5\/#/igm, "http:\/\/vk.com/");

Site.API("fave.addLink", {
	link: link
}, function(data) {
	if (Site.isResponse(data))
		Site.Go(window.location.hash);
})

return false;

*/

	posts: {
		cursor: 0,
		cache: [],
		lang: { header: "fave.headTitle", items: "fave.postsPosts" },
		nodes: { form: null, list: null },
		reset: function() { this.cursor = 0; this.cache = []; },
		hasCache: function() { return false; },
		getNodeSearchForm: function() { return null; },
		getNodeList: function() { return this.nodes.list = $.e("div"); },

		loadNext: function(reset) {
			var self = this;
			console.log(this.cursor);
			new APIRequest("fave.getPosts", {
				count: Fave.MAX_INSERTING,
				offset: this.cursor,
				v: 5.52,
				extended: 1
			})
				.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
				.setOnCompleteListener(function(res) {
					Local.add(res.profiles);
					Local.add(res.groups);

					self.onMetaData(res.count, res.count <= self.cache.length);
					reset();
					self.cache = self.cache.concat(res.items);

					ModuleManager.load("wall", function() {
						self.show(Fave.MAX_INSERTING);
					});
				})
				.execute();
		},

		show: function(max) {
			var w;
			for (var i = 0, k = this.cursor; i < max && this.cache[k]; ++i, ++k, ++this.cursor)  {
				w = this.cache[k];
				this.nodes.list.appendChild(Wall.itemPost(w, w.owner_id, w.id));
			};
		}

	},

	photos: {
		cursor: 0,
		cache: [],
		lang: { header: "fave.headTitle", items: "fave.photosPhotos" },
		nodes: { form: null, list: null },
		reset: function() { this.cursor = 0; this.cache = []; },
		hasCache: function() { return false; },
		getNodeSearchForm: function() { return null; },
		getNodeList: function() { return this.nodes.list = $.e("div"); },

		loadNext: function(reset) {
			var self = this;
			new APIRequest("fave.getPhotos", {
				count: Fave.MAX_INSERTING,
				offset: this.cursor,
				v: 5.52,
				extended: 1
			})
				.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
				.setOnCompleteListener(function(res) {

					self.onMetaData(res.count, res.count <= self.cache.length);
					reset();
					self.cache = self.cache.concat(res.items);
					ModuleManager.load("photos", function() {
						self.show(Fave.MAX_INSERTING);
					});
				})
				.execute();
		},

		show: function(max) {
			var w;
			for (var i = 0, k = this.cursor; i < max && this.cache[k]; ++i, ++k, ++this.cursor)  {
				w = this.cache[k];
				w.likes = {count: 0, user_likes: 0};
				w.comments = {count: 0};
				this.nodes.list.appendChild(Photos.itemPhoto(w));
			};
		}

	},

	videos: {
		cursor: 0,
		cache: [],
		lang: { header: "fave.headTitle", items: "fave.videosVideos" },
		nodes: { form: null, list: null },
		reset: function() { this.cursor = 0; this.cache = []; },
		hasCache: function() { return false; },
		getNodeSearchForm: function() { return null; },
		getNodeList: function() { return this.nodes.list = $.e("div"); },

		loadNext: function(reset) {
			var self = this;
			new APIRequest("fave.getVideos", {
				count: Fave.MAX_INSERTING,
				offset: this.cursor,
				v: 5.52,
				extended: 1
			})
				.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
				.setOnCompleteListener(function(res) {
					Local.add(res.profiles);
					Local.add(res.groups);

					self.onMetaData(res.count, res.count <= self.cache.length);
					reset();
					self.cache = self.cache.concat(res.items);
					ModuleManager.load("video", function() {
						self.show(Fave.MAX_INSERTING);
					});
				})
				.execute();
		},

		show: function(max) {
			var w;
			for (var i = 0, k = this.cursor; i < max && this.cache[k]; ++i, ++k, ++this.cursor)  {
				w = this.cache[k];
				this.nodes.list.appendChild(Video.item(w));
			};
		}

	}
};