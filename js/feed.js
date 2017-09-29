var Feed = {

	/**
	 * Returns tabs
	 * @returns {HTMLElement}
	 */
	getTabs: function() {
		return Site.getTabPanel([
			["feed", Lang.get("feed.tabs_feed")],
			["feed?act=notifications", Lang.get("feed.tabs_notifications"), Site.counters && Site.counters.notifications],
			["feed?act=comments", Lang.get("feed.tabs_comments")],
			["feed?act=friends", Lang.get("feed.tabs_updates_friends")],
			["feed?act=search", Lang.get("feed.tabs_search")]
		]);
	},

	/**
	 * Returns start_from value
	 * @returns {int}
	 */
	getStartFrom: function() {
		return (Date.now() - 14 * DAY) / 1000;
	},

	RequestPage: function() {
		switch (Site.get("act")) {
			case "notifications":
				return Notifications.init();

			case "comments":
				return Feed.page({ needSections: false, title: "Комментарии" }).then(Feed.comments.load.bind(Feed.comments, "")).then(Feed.comments.show);


			case "search":
				return Feed.search({q: Site.Get("q") || "", offset: getOffset()});



			case "friends":
				return Feed.page({ needSections: false, title: "Обновления друзей" }).then(Feed.friends.load).then(Feed.friends.show);

			case "mentions":
				return Feed.page({ needSections: false, title: "Упоминания" }).then(Feed.mentions.load).then(Feed.show);

			case "recommends":
				return Feed.page({ needSections: true, title: "Рекомендации" }).then(Feed.recommendations.load).then(Feed.show);

			case "select_list":
				return Feed.page({ needSections: false, title: "Списки новостей" }).then(Feed.lists.load).then(Feed.lists.show);

			default:
				return Feed.page({ needSections: true, title: Lang.get("feed.newsfeed") }).then(Feed.request).then(Feed.show);
		}
	},

	/**
	 * Counter-limiter for output advertisements
	 */
	adCounter: 0,

	/**
	 * Insert tab selections
	 * @param {{needSections: boolean=, title: string=}} options
	 * @returns {Promise}
	 */
	page: function(options) {
		options = options || {};
		return new Promise(function(resolve) {
			var parent = $.e("div"),
				list = $.e("div", {id: "mainFeed", append: Site.Loader(true)});

			parent.appendChild(Feed.getTabs());
			parent.appendChild(Site.getPageHeader(options.title));
			options.needSections && parent.appendChild(Feed.getSelectionsTabs());
			parent.appendChild(list);

			Site.append(parent);
			Site.setHeader(Lang.get("feed.header_title"));
			resolve({list: list});
		});
	},

	/**
	 * Request feed data
	 * @param {{list: HTMLElement, data: *?, nextRequest: function?, wasNext: string?}} meta
	 * @param {string=} next
	 */
	request: function(meta, next) {
		var lists = Site.get("list") || "",
			filter = Site.get("filter") === "photos" ? "photo,wall_photo,photo_tag" : "post";

		Feed.resetAd();
		Feed.adCounter = 0;

		return api("execute", {
			code: "var f=API.newsfeed.get({start_time:Args.s,count:Args.c,filters:Args.f,source_ids:Args.i,start_from:Args.o}),w=[],i=0,p,q,o,u=[];if(parseInt(Args.n)==1){while(p=f.items[i]){q=p.source_id+\"_\"+p.post_id;o=API.wall.getComments({count:3,sort:Args.t,owner_id:p.source_id,post_id:p.post_id,extended:1});w.push({i:q,c:o.items});u=u+o.profiles;u=u+o.groups;i=i+1;}};API.account.setOffline();return{f:f,c:w,u:u,v:API.account.getCounters()};",
			s: Feed.getStartFrom(),
			c: 21,
			f: filter,
			i: lists,
			t: "asc",
			v: 5.63,
			o: next,
			n: +isEnabled(Setting.COMMENTS_IN_FEED) // TODO: comments
		}).then(
			/**
			 *
			 * @param {{v: object, u: User[], c: object, f: {items: Post[], profiles: User[], groups: User[], next_from: string}}} result
			 * @returns {{data: object, list: HTMLElement}}
			 */
			function(result) {
			Site.setCounters(result.v);

			var comments = (function(data) {
				var obj = {};

				data.forEach(function(item) {
					obj[item.i] = item.c;
				});

				return obj;
			})(result.c);

			Local.add(result.u);

			var data = result.f;

			Local.add(data.profiles.concat(data.groups));

			data.items = data.items.map(function(post) {
				if (post.comments) {
					post.comments.items = comments[post.source_id + "_" + post.post_id];
				}
				return post;
			});

			meta.data = data;
			meta.nextRequest = Feed.request;
			meta.wasNext = next;

			return meta;
		}).catch(function(error) {
			console.error(error);
		});
	},

	/**
	 * Show items
	 * @param {{list: HTMLElement, data: {items: Post[], next_from: string, count: int}, nextRequest: function?, wasNext: string}} meta
	 */
	show: function(meta) {
		var res = meta.data,
			list = meta.list,

			data = res.items,
			next = res.next_from,

			nextRequest = meta.nextRequest || Feed.request;

		!meta.wasNext && $.elements.clearChild(list);

		for (var i = 0, c; c = data[i]; ++i) {

			if (c.marked_as_ads) {
				console.info("Feed: passed `marked_as_ads` post ");
				continue;
			}

			switch (c.type) {

				case "post":
					var node = Wall.getItemPost(c, c.source_id, c.post_id, { hide: true, from: "feed" });

					if (isEnabled(Setting.COMMENTS_IN_FEED) && c.comments.items) {
						var comments = $.e("div", {"class": "feed-post-fast-comments-wrap"});

						c.comments.items.forEach(function(comment) {
							comments.appendChild(Wall.getItemComment(comment, c.source_id, c.post_id));
						});

						node.appendChild(comments);
					}

					list.appendChild(node);

					Feed.adCounter++;
					break;

				case "photo":
					list.appendChild(Feed.event.addedPhotos(c));
					Feed.adCounter++;
					break;

			}

			if (Feed.adCounter && !(Feed.adCounter % 15)) {
				list.appendChild(Feed.getPostAd());
			}
		}

		var load = false,
			callback = function() {
				if (load) {
					return;
				}
				load = true;
				nextRequest.call(Feed, {list: list}, next).then(Feed.show).then(function() {
					//noinspection JSCheckFunctionSignatures
					button && $.elements.remove(button);
				});

			},
			button = $.e("div", {"class": "button-block", html: "Поздние записи..", onclick: callback});

		list.appendChild(button);

		window.onScrollCallback = function (event) {
			!load && event.needLoading && callback();
		};

		return meta;
	},

	/**
	 *
	 * @returns {HTMLElement}
	 */
	getSelectionsTabs: function() {
		var e = Site.getTabPanel([
			["feed", Lang.get("feed.tabs_feed_selections")],
			["feed?filter=photos", Lang.get("feed.tabs_photos")],
			["feed?list=friends", Lang.get("feed.tabs_friends")],
			["feed?list=groups,pages", Lang.get("feed.tabs_groups")],
			["feed?act=recommends", Lang.get("feed.tabs_recommends")],
			["feed?act=select_list", Lang.get("feed.tabs_select")]
		]);
		$.elements.addClass(e, "feed-tabs-selector");
		return e;
	},

	event: {
		addedPhotos: function (item) {
			var parent = document.createElement("div"),
				right = document.createElement("div"),
				list = document.createElement("div"),
				photos = item.photos,
				user = Local.data[item.source_id];
			parent.id = "wall-photo"+ item.source_id + "_" + item.post_id;

			parent.appendChild($.elements.create("a", {
				href: "#" + user.screen_name,
				append: $.e("img", {src: getURL(user.photo || user.photo_rec || user.photo_50), "class": "wall-left"})
			}));
			right.appendChild($.elements.create("div", {"class": "feed-updatePhotos-head", append: [
				$.e("a", {href: "#" + user.screen_name, html: getName(user), "class": "bold"}),
				$.e("span", {"class": "tip", html: " " + Lang.get("feed.events_added_photos_verb")[user.sex || 0] + " " + photos.count + " " + Lang.get("feed", "events_added_photos_photos", photos.count)})
			]}));
			list.className = "feed-updatePhotos-previews";
			for (var i = 0; i < photos.items.length; ++i)
				list.appendChild(Photos.itemPhoto(Photos.v5normalize(photos.items[i])));
			right.appendChild(list);
			right.appendChild($.elements.create("div", {"class": "tip", html: Site.getDate(item.date)}));
			right.className = "wall-right";
			parent.appendChild(right);
			return $.elements.create("div", {append: parent, "class": "wall-item feed-updatePhotos-item"});
		},
		addedFriends: function (item) {
			var wrap = document.createElement("div"),
				left = document.createElement("a"),
				right = document.createElement("div"),
				owner = Local.data[item.source_id],
				users = item.friends && item.friends.items || [],
				count = item.friends && item.friends.count || 0,
				e = $.elements.create,
				nodes = Feed.event.getFriendsListNode(users);
			wrap.className = "wall-item feed-updateFriends-item";
			if (!count)
				return $.e("div");
			right.className = "wall-right";
			left.href = "#" + owner.screen_name;
			left.appendChild(e("img", {"class": "wall-left", src: getURL(owner.photo_50)}));
			right.appendChild(e("div", {append: [
				e("a", {"class": "bold", href: "#" + owner.screen_name, html: owner.first_name + " " + owner.last_name + Site.isOnline(owner)}),
				document.createTextNode(" "),
				e("span", {"class": "tip", html: Lang.get("feed.friends_added")[owner.sex] + " " + count + " " + Lang.get("feed", "friends_friends", count) + ": "}),
				nodes[0],
				nodes[1]
			]}));
			right.appendChild(e("div", {"class": "tip feed-updateFriends-date", html: Site.getDate(item.date)}));
			wrap.appendChild(left);
			wrap.appendChild(right);
			return wrap;
		},
		getFriendsListNode: function (u) {
			var e = $.e,
				g = [],
				t = e("span", {"class": "tip"}),
				p = e("div", {"class": "feed-friends-photos"}),
				m = function (a, b)
				{
					b = Local.data[a.uid];
					return e("a", {href: "#" + b.screen_name, html: b.first_name + " " + b.last_name});
				},
				n = function (a, b)
				{
					b = Local.data[a.uid];
					return e("a", {"class": "feed-friends-photo", href: "#" + b.screen_name, append: e("img", {src: getURL(b.photo_50)})});
				},
				i = -1,
				l = u.length;
			for ( ; ++i < l; )
			{
				g.push(m(u[i]));
				p.appendChild(n(u[i]));
			}
			i = -1;
			l = g.length;
			for ( ; ++i < l; )
			{
				t.appendChild(g[i]);
				if (i + 1 === l)
					break;
				if (i + 2 === l) {
					t.appendChild(document.createTextNode(Lang.get("general.and")));
					continue;
				}
				t.appendChild(document.createTextNode(", "));
			}
			return [t, p];
		},
	},

	addBan: function (owner_id, type, item_id) {
		var params = {}, curPost = $.element("wall-" + (type == "wall" ? "post" : type) + owner_id + "_" + item_id);
		if (owner_id > 0) params.user_ids = owner_id; else params.group_ids = -owner_id;
		Site.API("newsfeed.addBan", params, function (response) {
			var e = document.querySelectorAll(".wall-item[id^=\"wall-post" + owner_id + "\"]");
			for (var i = 0, l = e.length; i < l; ++i)
				if (curPost != e[i])
					$.elements.addClass(e[i], "hidden");
			$.elements.clearChild(curPost.previousSibling);
			curPost.previousSibling.appendChild($.elements.create("div", {html: "Все записи этого " + (owner_id > 0 ? "пользователя" : "сообщества") + " скрыты из новостной ленты"}));
			curPost.previousSibling.appendChild($.elements.create("a", {html: "Отмена", onclick: function () {
				Feed.removeFromBan(owner_id, function () {
					for (var i = 0, l = e.length; i < l; ++i)
						if (curPost != e[i])
							$.elements.removeClass(e[i], "hidden");
					$.elements.removeClass(curPost, "hidden");
					$.elements.remove(curPost.previousSibling);
				});
			}}));
		});
	},
	removeFromBan: function (ownerId, callback) {
		var options = {};
		if (ownerId > 0)
			options.user_ids = ownerId;
		else
			options.group_ids = -ownerId;
		Site.API("newsfeed.deleteBan", options, function (data) {
			data = Site.isResponse(data);
			callback();
		});
	},

	comments: {

		/**
		 * Load info about comments
		 * @returns {Promise}
		 */
		load: function(from, meta) {
			return api("newsfeed.getComments", {
				start_from: from,
				count: 10,
				allow_group_comments: 1,
				last_comments_count: 3,
				fields: "photo_50,online,first_name_dat,last_name_dat",
				need_likes: 1,
				v: 5.56
			}).then(function(data) {
				Local.add(data.profiles);
				Local.add(data.groups);
				meta.data = data;
				meta.from = from;
				return meta;
			});
		},

		/**
		 * Show list of posts with comments
		 * @param {{from: string=, data: {count: int, items: object[], next_from: string=}, list: HTMLElement}} d
		 */
		show: function(d) {
			var list = d.list, e = $.e;

			!d.from && $.elements.clearChild(list);

			/**
			 * @type {{count: int, items: object[], next_from?: string}}
			 */
			var data = d.data;

			list.className = "feed-comments";

			data.items.forEach(function(item) {
				var type = item.type,
					ownerId = item.source_id,
					postId = item.post_id,

					current = e("div", {"class": "feed-comments-item", id: "feed_comments_" + type + "_" + ownerId + "_" + postId});

				if (item.type === "note") {
					return;
				}

				if (item.type !== "post" && item.type !== "topic") {
					var self = {type: item.type};
					//noinspection JSUndefinedPropertyAssignment
					item.attachments = [];
					self[item.type] = item;
					item.attachments.push(self);
				}

				var post = Wall.getItemPost(item, ownerId, postId, {from: "feed?act=comments"});

				post.insertBefore(e("div", {
					"class": "feed-close a",
					onclick: function() {
						// TODO: to separate method and normal icon
						Feed.comments.unsubscribe(type, ownerId, postId).then(function() {
							current.style.opacity = .5;
						});
					}
				}), post.firstChild);

				var comments = e("div", {
						"class": "feed-comments-node",
						id: "feed_comments_" + type + "_" + ownerId + "_" + postId,
						append: item.comments.list.map(function(comment) {
							comment = Wall.getItemComment(comment, ownerId, postId, {});
							$.elements.addClass(comment, "wall-right");
							return comment;
						})
					}),

					write = Feed.getCommentForm(ownerId, postId, {
						fromGroup: ownerId < 0 ? Local.data[ownerId] && Local.data[ownerId].is_admin : false,
						allowAttachments: APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT
					}, type);

				$.elements.addClass(write, "wall-right");

				comments.appendChild(write);
				current.appendChild(post);
				current.appendChild(comments);

				list.appendChild(current);
			});

			var freeze = !data.next_from;
			window.onScrollCallback = function(event) {
				!freeze && event.needLoading && (freeze = true) && Feed.comments.load(data.next_from, list).then(Feed.comments.show);
			};

		},

		unsubscribe: function(type, ownerId, postId) {
			return api("newsfeed.unsubscribe", { type: type, owner_id: ownerId, item_id: postId, v: 5.56 });
		}
	},

	lists: {
		data: null,

		load: function(list) {
			return api("newsfeed.getLists", {v: 5.56}).then(function(data) {
				Feed.lists.data = data.items;
				return {list: list, data: data};
			});
		},

		/**
		 * Show list of feed-lists
		 * @param {{list: HTMLElement, data: {count: int, items: object[]}}} d
		 */
		show: function(d) {
			var list = d.list, data = d.data;

			data.items = data.items.map(function(list) {
				list.link = "#feed?list=" + list.id;
				return list;
			});

			$.elements.clearChild(list);

			var sl = new SmartList({
				data: data,
				getItemListNode: SmartList.getDefaultItemListNode,
				optionsItemListCreator: {
					remove: {
						onClick: function(item) {
							console.log(item) // TODO: add request
						}
					},
					icon: "feed-icon-list"
				},
				countPerPage: 20
			});

			list.appendChild(sl.getNode());
		}
	},

	mentions: {
		data: null,

		load: function(meta) {
			return api("newsfeed.getMentions", {
				start_time: Feed.getStartFrom(),
				count: Feed.DEFAULT_COUNT,
				allow_group_comments: 1,
				v: 5.56
			}).then(function(result) {
				Local.add(result.profiles);
				Local.add(result.groups);
				meta.data = result;
				meta.nextRequest = Feed.mentions.load;
				return meta;
			});
		}
	},

	recommendations: {

		load: function(meta) {
			return api("newsfeed.getRecommended", {
				start_time: Feed.getStartFrom(),
				count: Feed.DEFAULT_COUNT,
				allow_group_comments: 1,
				v: 5.56,
				start_from: Site.get("start_from")
			}).then(function(result) {
				Local.add(result.profiles);
				Local.add(result.groups);
				meta.data = result;
				meta.nextRequest = Feed.recommendations.load;
				return meta;
			});
		}

	},

	friends: {

		load: function(list) {
			return api("newsfeed.get", {
				start_time: Feed.getStartFrom(),
				count: Feed.DEFAULT_COUNT,
				filters: "friend",
				v: 5.56
			}).then(function(res) {
				Local.add(res.profiles);
				Local.add(res.groups);
				return {list: list, data: res};
			});
		},

		show: function(data) {
			console.log(data);
		}

	},















	/**
	 * @param {{profiles, groups, items, next_from}} data
	 */
	getFriends: function(data) {
		Local.add(data.profiles.concat(data.groups));
		var parent = document.createElement("div"),
			list = document.createElement("div"),
			next = data.next_from;
		Feed.getFriendsFeed(list, data.items, next);
		parent.appendChild(Feed.getTabs());
		parent.appendChild(Site.getPageHeader("Обновления друзей"));
		parent.appendChild(list);
		Site.append(parent);
		Site.setHeader("Обновления друзей");
	},

	getFriendsFeed: function (list, data, next) {
		for (var i = 0, l = data.length; i < l; ++i)
			list.appendChild(Feed.event.addedFriends(data[i]));
		list.appendChild($.elements.create("div", {"class": "button-block", html: "Поздние обновления..", onclick: function (event) {
			var start = new Date(),
				button = this;
			button.innerHTML = "&nbsp;";
			$.elements.addClass(button, "msg-loader");
			start.setTime(start.getTime() - 1000 * 60 * 60 * 24 * 14);
			start = parseInt(start / 1000);
			Site.APIv5("newsfeed.get", {
				start_time: start,
				count: 25,
				filters: "friend",
				start_from: next,
				v: 5.14
			}, function (data) {
				data = Site.isResponse(data);
				Local.add(data.profiles.concat(data.groups));
				var count = data.count, next = data.next_from;
				data = data.items;
				$.elements.remove(button);
				Feed.getFriendsFeed(list, data, next);
			});
		}}));
		return list;
	},
	getBanned: function () {
		Site.APIv5("newsfeed.getBanned", {
			v: 5.14,
			extended: 1,
			fields: "photo_50,first_name_dat,screen_name,online"
		}, function (data) {
			data = Site.isResponse(data);
			var list = document.createElement("div"),
				data = data.groups.concat(data.profiles || []);
			for (var i = 0, l = data.length; i < l; ++i) {
				if (!data)
					continue;
				list.appendChild(Templates.getMiniUser(data[i], {action: {
					node: $.e("div", {
						"class": "feed-delete",
						onclick: (function (id) {
							return function () {
								return Feed.removeBan(id, this);
							};
						})(data[i].name ? -data[i].id : data[i].id)
					})
				}}));
			};


			var m = new Modal({
				noPadding: true,
				title: "Фильтр",
				content: list,
				footer: [
					{
						name: "close",
						title: "Закрыть",
						onclick: function () {
							m.close();
						}
					}
				]
			}).show();
		})
	},
	removeBan: function (id, node) {
		if ($.elements.hasClass(node, "__deleted"))
			return;
		var options = {};
		if (id > 0)
			options.user_ids = id;
		else
			options.group_ids = -id;
		Site.API("newsfeed.deleteBan", options, function (data) {
			data = Site.isResponse(data);
			if (data) {
				var i = node.parentNode;
				$.elements.addClass(node, "__deleted");
				i.style.opacity = ".5";
			}
		});
	},

	getCommentForm: function (ownerId, postId, opts, type) {
		return $.e("div");


		var obj = {
			name: "message",
			noHead: true,
			ctrlEnter: true,
			asAdmin: opts.fromGroup,
			allowAttachments: 30,
			id: "wall-comments-area" + ownerId + "_" + postId,
			onsubmit: function (event) {
				var text = this.message.value, // there was addSlashes
					fromGroup = this.from_group ? (this.from_group.checked ? 1 : 0) : 0,
					attachments = this.attachments && this.attachments.value || "",
					form = this,
					params = {
						owner_id: ownerId,
						attachments: attachments,
						from_group: fromGroup,
						v: 5.29
					};
				switch (type)
				{
					case "wall":
					case "post": params.post_id = postId; params.text = text; break;
					case "photo": params.photo_id = postId; params.message = text; break;
					case "video": params.video_id = postId; params.message = text; break;
					case "topic":
					case "board": params.topic_id = postId; params.text = text; params.group_id = Math.abs(ownerId); break;
				}
				if (!text && !attachments) {
					alert("Введите текст!");
					return false;
				}
				Site.APIv5({
					post: "wall.addComment",
					wall: "wall.addComment",
					photo: "photos.createComment",
					video: "video.createComment",
					topic: "board.addComment",
					board: "board.addComment"
				}[type], params, function (result) {
					data = Site.isResponse(result);
					var list = $.element("feed_comments_" + type + "_" + ownerId + "_" + postId),
						att = attachments.split(","), a = [];
					if (att.length) {
						var b, c = {
							photo: Photos.photos,
							video: Video.videos,
							audio: Audios.Data,
							doc: Docs.docs
						};
						Array.prototype.forEach.call(att, function (i) {
							if (!i) return;
							b = /(photo|video|audio|doc)(-?\d+_\d+)/img.exec(i);
							i = {type: b[1]};
							i[b[1]] = c[b[1]][b[2]];
							a.push(i);
						});
					}
					var node;
					form.parentNode.insertBefore(node = Wall.getItemComment({
						from_id: API.userId,
						id: data.comment_id,
						text: text,
						attachments: a,
						date: Math.round(+new Date() / 1000),
						can_edit: true,
						can_delete: true,
						likes: {
							count: 0,
							user_likes: 0,
							can_like: 1
						}
					}, ownerId, postId, {}), form);
					node.className = "wall-right";
					form.message.value = "";
					form.attachments.value = "";
					if (form.from_group)
						form.from_group.checked = false;
				});
				return false;
			}
		};
		return Site.getExtendedWriteForm(obj, ownerId, postId);
	},
	search: function (opts) {
		opts.q = decodeURIComponent(opts.q);
		Site.APIv5("newsfeed.search", {
			extended: 1,
			q: decodeURIComponent(opts.q),
			count: 30,
			offset: opts.offset,
			start_time: Math.round(+new Date()/1000) - 2 * 31536000,
			end_time: Math.round(+new Date()/1000),
			v: 5.0
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				form = document.createElement("form"),
				elem = document.createElement("div");
			form.className = "sf-wrap";
			form.appendChild($.elements.create("input", {type: "text", name:"q", placeholder:"Введите ключевое слово..", value: opts.q}));
			form.appendChild($.elements.create("input", {type: "submit", value:"Поиск"}));
			elem.id = "feed-search";
			elem.appendChild(Site.getPageHeader($.textCase(data.count, ["Найдена", "Найдены", "Найдено"]) + " " + data.count + " " + $.textCase(data.count, ["запись", "записи", "записей"])));
			elem.appendChild(Site.createInlineForm({
				name: "q",
				value: opts.q,
				title: "Поиск",
				onsubmit: function (event) {
					if ("#feed?act=search&q=" + this.q.value == window.location.hash)
						return false;
					window.location.hash = "#feed?act=search&q=" + encodeURIComponent(this.q.value);
					$.elements.clearChild(list);
					elem.appendChild($.elements.create("div", {"class": "msg-empty msg-loader"}));
					return false;
				}
			}))
			Site.append(parent);
			var posts = data.items;
			Local.add(data.profiles);
			Local.add(data.groups || data.group);
			for (var i = 0, l = posts.length; i < l; ++i) {
				var c = posts[i];
				try {
					list.appendChild(Wall.getItemPost(c, c.owner_id, c.id, {ban: true, q: opts.q, from: "feed?act=search&q=" + opts.q}));
				} catch (e) {}
			}
			if (!l)
				list.appendChild(Site.getEmptyField("Ничего не найдено"))
			list.appendChild(Site.getSmartPagebar(opts.offset, data.count, 30));
			elem.appendChild(list);
			parent.appendChild(Feed.getTabs());
			parent.appendChild(elem);
			Site.setHeader("Поиск");
		})
	},
	searchByOwner: function (screenName, query, offset) {
		Site.Loader();
		query = decodeURIComponent(query || "") || "";
		var q = Site.Escape(query);
		Site.API("execute", {
			code: "return{o:API.users.get({user_ids:\"%d\",fields:\"first_name_gen,online,screen_name\",v:5.29})[0],g:API.groups.getById({group_id:\"%d\"})[0],r:API.wall.search({query:\"%s\",domain:\"%d\",count:50,offset:%o,owners_only:%f,extended:1,v:5.29})};"
				.replace(/%s/img, query) // there was addSlashes
				.replace(/%d/img, screenName)
				.replace(/%o/img, offset)
				.replace(/%f/img, Site.Get("comments") ? 0 : 1)
		}, function (data) {
			data = Site.isResponse(data);
			if (!data.o && !data.g) {
				Site.append(Site.getEmptyField("Ошибка<br\/><br\/>data.o && data.g is null"));
				return;
			};
			Local.add([data.o, data.g]);
			Local.add(data.r.profiles);
			Local.add(data.r.groups);
			var e = $.e,
				owner = data.o || data.g,
				isUser = data.o,
				u = Local.data,
				w = data.r.items,
				hash = String(q).split("@")[0],
				count = data.r.count,
				form = Site.createInlineForm({
					title: "Найти",
					value: hash,
					placeholder: "Поиск..",
					name: "q",
					onsubmit: function (event) {
						window.location.hash = "#" + screenName + "?act=search&q=" + encodeURIComponent($.trim(this.q.value));
						event.preventDefault();
						return false;
					}
				}),
				list = e("div"),
				page = e("div", {append: [
					Site.getPageHeader(
						("На странице %s найдено %d " + $.textCase(count, ["запись", "записи", "записей"]) + " по хэштегу %h")
							.replace(/%s/img, Site.Escape(isUser ? owner.first_name_gen : owner.name))
							.replace(/%d/img, count)
							.replace(/%h/img, hash)
					),
					form,
					list
				]});
			if (w.length)
				Array.prototype.forEach.call(w, function (post) {
					list.appendChild(Wall.getItemPost(post, post.owner_id, post.id, {deleteBtn: true, from: Site.getAddress(true)}));
				});
			else
				list.appendChild(Site.getEmptyField(query ? "Ничего не найдено" : "Введите запрос"));
			list.appendChild(Site.getSmartPagebar(offset, count, 50));
			Site.append(page);
			Site.setHeader("Поиск по стене", {link: screenName});
		});
	},

	curAd: [],

	/**
	 * Reset state of rotation advertisements
	 */
	resetAd: function() {
		Feed.curAd = (API.ad.feed && API.ad.feed || []).shuffle();
	},

	/**
	 * Return APIdog advertisement post
	 * @returns {HTMLElement}
	 */
	getPostAd: function() {
		var item = Feed.curAd.splice(0, 1)[0], e = $.e;
		if (!item) {
			return e("div");
		}
		Feed.curAd.push(item);
		return e("div", {"class": "wall-item", onclick: function() {
			var l = window.open(item.adLink, "_blank");
			l.focus();
		}, append: [
			e("a", {href: "#apicatru", append: e("img", {"class": "wall-left", src: "//static.apidog.ru/images/a/apidoglogo.png"})}),
			e("div", {"class": "wall-right", append: [
				e("div", {"class": "wall-head", append: [
					e("div", {"class": "wall-head-author", append:
						e("strong", { html: item.title })
					}),
					e("div", {"class": "wall-head-meta", append:
						e("p", { html: "APIdog | Реклама" })
					})
				]}),
				e("div", {"class": "wall-content n-f", html: item.description.safe()}),
				e("div", {"class": "wall-attachments clearfix", append: e("img", {src: item.adImage, style: "max-width: 100%; display: block; margin: 5px auto;"})}),
				e("a", {"class": "fr btn", style: "margin-bottom: 7px; cursor: pointer", href: item.adLink, html: "Перейти", target: "_blank"})
			]})
		]});
	}
};
