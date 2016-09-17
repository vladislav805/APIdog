/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Feed = {
	Filter: "",
	GetTabs: function() {
		return Site.CreateTabPanel([
			["feed", lg("feed.tabFeed")],
			["feed?act=notifications", lg("feed.tabNotifications")],
			["feed?act=comments", lg("feed.tabComments")],
			["feed?act=friends", lg("feed.tabUpdatesFriends")],
			["feed?act=search", lg("feed.tabSearch")]
		]);
	},

	RequestPage: function() {
		var start = new Date();
		start.setTime(start.getTime() - 1000 * 60 * 60 * 24 * 14);
		start = parseInt(start / 1000);

		switch (getAct()) {

			case "comments":
				return new APIRequest("execute", {
					code: "return API.newsfeed.getComments({offset:Args.o,from:Args.f,count:30,allow_group_comments:1,last_comments:1,fields:\"photo_50,online,first_name_dat,last_name_dat\",v:5.30});",
						o: getOffset(),
						f: Site.get("from")
				}).setOnCompleteListener(Feed.showComments).execute();

			case "search":
				if (Site.get("owner")) {
					return Feed.searchByOwner(Site.get("owner"), Site.get("q"), getOffset());
				};
				return Feed.search({q: Site.get("q") || "", offset: getOffset()});

			case "notifications":
				Site.Loader();
				return new APIRequest("execute", {
					code: "API.notifications.markAsViewed();return API.notifications.get({count:40,start_time:Args.start,filters:Args.filters,v:5.52});",
					start: start,
					filters: "wall,mentions,comments,likes,reposts,followers,friends"
				}).setOnCompleteListener(Notifications.getItems).execute();

			case "friends":
				Site.APIv5("newsfeed.get", {start_time: start, count: 30, filters: "friend", v: 5.14}, Feed.getFriends);
			break;
			case "mentions":
				Site.APIv5("newsfeed.getMentions", {start_time: start, count: 30, allow_group_comments:1, v: 5.8}, Feed.convert);
			break;
			case "recommends":
				Site.APIv5("newsfeed.getRecommended", {start_time: start, count: 50, allow_group_comments:1, v: 5.14, start_from: Site.get("start_from")}, Feed.convert);
			break;
			case "select_list":
				if (Feed.Filters.length)
					Feed.getLists();
				else
					Site.APIv5("newsfeed.getLists", {v: 5.14}, function(data) {
						data = Site.isResponse(data);
						Feed.Filters = data.items;
						return Feed.getLists();
					});
			break;
			default:
				Site.Loader();
				var lists = Site.get("lists") || "",
					filter = Site.get("filter") == "photos" ? "photo,wall_photo,photo_tag" : "post,photo,photo_tag",
					requests = [
						{method: "account.getCounters", params: {}},
						{method: "newsfeed.get", params: {start_time: start, count: 25, filters: filter, source_ids: lists, v: 5.14}}];
				if (!Feed.Filters.length)
					requests.push({
						method: "newsfeed.getLists",
						params: {}
					});

				Site.APIExecute(requests, Feed.getFeed);
		}
	},
	convert: function(data) {console.log(data);
		return Feed.getFeed({response: [null, data]});
	},
	Cache:{},
	CacheDate:0,
	Filters: [],
	getFeed: function(data) {
		data = data.response || data;
		if (data[0])
			Site.setCounters(data[0]);
		if (data[2])
			Feed.Filters = data[2];
		var parent = document.createElement("div"),
			list = document.createElement("div"),
			count = (data = data[1]).count || 0,
			next = data.next_from,
			users = Local.add(data.profiles.concat(data.groups)),
			data = data.items;
		Feed.getItems(list, data, count, next);
		parent.appendChild(Feed.GetTabs());
		parent.appendChild(Site.CreateHeader(lg("feed.newsfeed"), $.e("a", {"class": "fr", html: lg("feed.filter"), onclick: function() {
			Feed.getBanned(this);
		}})));
		parent.appendChild(Feed.getSelectionsTabs());
		parent.appendChild(list);
		Site.Append(parent);
		Site.SetHeader(lg("feed.headTitle"));
	},
	getSelectionsTabs: function() {
		var e = Site.CreateTabPanel([
			["feed", lg("feed.tabFeedSelections")],
			["feed?filter=photos", lg("feed.tabPhotos")],
			["feed?lists=friends", lg("feed.tabFriends")],
			["feed?lists=groups,pages", lg("feed.tabGroups")],
			["feed?act=recommends", lg("feed.tabRecommends")],
			["feed?act=select_list", lg("feed.tabSelect")]
		]);
		$.elements.addClass(e, "feed-tabs-selector");
		return e;
	},
	getItems: function(list, data, count, next) {
		for (var i = 0, l = data.length; i < l; ++i) {
			var c = data[i];
			switch (c.type){
				case "post":
					list.appendChild(Wall.itemPost(c, c.source_id, c.post_id, {hide: true, from: "feed"}));
					break;
				case "photo":
					list.appendChild(Feed.event.addedPhotos(c));
					break;
				default:
					console.log("Feed.getItems: ", c);
			}
		};
		var evfx, button;
		list.appendChild(button=$.e("div", {"class": "button-block", html: "Поздние записи..", onclick: evfx=function(event) {
			if (this.disabled)
				return;
			this.disabled = true;
			var start = new Date(),
				button = this,
				lists = Site.get("lists") || "",
				filter = Site.get("filter") == "photos" ? "photo,wall_photo,photo_tag" : "post,photo,photo_tag";
			button.innerHTML = "&nbsp;";
			$.elements.addClass(button, "msg-loader");
			start.setTime(start.getTime() - 1000 * 60 * 60 * 24 * 14);
			start = parseInt(start / 1000);
			Site.APIv5(Site.get("act") != "recommends" ? "newsfeed.get" : "newsfeed.getRecommended", {
				start_time: start,
				count: 25,
				filters: filter,
				source_ids: lists,
				start_from: next,
				v: 5.14
			}, function(data) {
				data = Site.isResponse(data);
				Local.add(data.profiles.concat(data.groups));
				var count = data.count, next = data.next_from;
				data = data.items;
				Feed.getItems(list, data, count, next);
				$.elements.remove(button);
			});
		}}));

		window.onScrollCallback = function(event) {
			if (event.needLoading) {
				evfx.call(button);
			};
		};
	},
	event: {
		addedPhotos: function(item) {
			var parent = document.createElement("div"),
				right = document.createElement("div"),
				list = document.createElement("div"),
				photos = item.photos,
				user = Local.Users[item.source_id];
			parent.id = "wall-photo"+ item.source_id + "_" + item.post_id;
			parent.appendChild(Feed.getHideNode("photo", item.source_id, item.post_id));
			parent.appendChild($.e("a", {
				href: "#" + user.screen_name,
				append: [$.e("img", {src: getURL(user.photo || user.photo_rec || user.photo_50), "class": "wall-left"})]
			}));
			right.appendChild($.e("div", {append: [
				$.e("a", {href: "#" + user.screen_name, html: (user.name || user.first_name + " " + user.last_name + Site.isOnline(user)), "class": "bold"}),
				$.e("span", {"class": "tip", html: " " + lg("feed.eventsAddedPhotosVerb")[user.sex || 0] + " " + photos.count + " " + Lang.get("feed", "eventsAddedPhotosPhotos", photos.count)})
			]}));
			for (var i = 0; i < photos.items.length; ++i)
				list.appendChild(Photos.itemPhoto(Photos.v5normalize(photos.items[i])));
			right.appendChild(list);
			right.appendChild($.e("div", {"class": "tip", html: Site.getDate(item.date)}));
			right.className = "wall-right";
			parent.appendChild(right);
			return $.e("div", {append: [parent], "class": "wall-item"});
		},
		addedFriends: function(item) {
			var wrap = document.createElement("div"),
				left = document.createElement("a"),
				right = document.createElement("div"),
				owner = Local.Users[item.source_id],
				users = item.friends && item.friends.items || [],
				count = item.friends && item.friends.count || 0,
				e = $.e,
				nodes = Feed.event.getFriendsListNode(users);
			wrap.className = "wall-item";
			if (!count)
			return $.e("div");
			right.className = "wall-right";
			left.href = "#" + owner.screen_name;
			left.appendChild(e("img", {"class": "wall-left", src: getURL(owner.photo_50)}));
			right.appendChild(e("div", {append: [
				e("a", {"class": "bold", href: "#" + owner.screen_name, html: owner.first_name + " " + owner.last_name + Site.isOnline(owner)}),
				document.createTextNode(" "),
				e("span", {"class": "tip", html: lg("feed.friendsAdded")[owner.sex] + " " + count + " " + Lang.get("feed", "friendsFriends", count) + ": "}),
				nodes[0],
				nodes[1]
			]}));
			right.appendChild(e("div", {"class": "tip", html: Site.getDate(item.date)}));
			wrap.appendChild(left);
			wrap.appendChild(right);
			return wrap;
		},
		getFriendsListNode: function(u) {
			var e = $.e,
				g = [],
				t = e("span", {"class": "tip"}),
				p = e("div"),
				m = function(a, b)
				{
					b = Local.Users[a.uid];
					return e("a", {href: "#" + b.screen_name, html: b.first_name + " " + b.last_name});
				},
				n = function(a, b)
				{
					b = Local.Users[a.uid];
					return e("a", {"class": "feed-friends-photo", href: "#" + b.screen_name, append: e("img", {src: getURL(b.photo_50)})});
				},
				i = -1,
				l = u.length;
			for ( ; ++i < l; )
			{
				g.push(m(u[i]));
				p.appendChild(n(u[i]));
			};
			i = -1;
			l = g.length;
			for ( ; ++i < l; )
			{
				t.appendChild(g[i]);
				if (i + 1 == l)
					break;
				if (i + 2 == l) {
					t.appendChild(document.createTextNode(lg("general.and")));
					continue;
				}
				t.appendChild(document.createTextNode(", "));
			};
			return [t, p];
		},
	},
	getHideNode: function(type, owner_id, item_id) {
		return $.e("div", {
			"class": "feed-close a",
			onclick: function(event) {
				event.stopPropagation();
				return Feed.hidePost(type, owner_id, item_id);
			}
		});
	},
	hidePost: function(type, owner_id, item_id) {
		var node = $.element("wall-" + (type == "wall" ? "post" : type) + owner_id + "_" + item_id);

		Site.API("newsfeed.ignoreItem", {type: type, owner_id: owner_id, item_id: item_id}, function(response) {
			if (!Site.isResponse(response))
				return;

			var hidden = $.e("div", {"class": "wall-hidden", append: [
				$.e("div", {html: "Эта запись не будет показываться в ленте."}),
				$.e("div", {append: [
					$.e("a", {
						html: "Скрыть все новости этого " + (owner_id > 0 ? "пользователя" : "сообщества"),
						onclick: function(event) {
							event.stopPropagation();
							return Feed.addBan(owner_id, type, item_id);
						}
					})
				]}),
				$.e("div", {append:
					$.e("a", {
						html: "Вернуть этот пост в ленту",
						onclick: function(event) {
							event.stopPropagation();
							$.elements.removeClass(node, "hidden");
							$.elements.remove(hidden);
							return Feed.unhidePost(type, owner_id, item_id);
						}
					})
				})
			]});
			$.elements.addClass(node, "hidden");
			node.parentNode.insertBefore(hidden, node);
		});
		return false;
	},
	unhidePost: function(type, owner_id, item_id) {
		var e = $.element("wall-" + (type == "wall" ? "post" : type) + owner_id + "_" + item_id);
		Site.API("newsfeed.unignoreItem", {type: type, owner_id: owner_id, item_id: item_id}, function(response) {
			if (!Site.isResponse(response))
				return;
		});
		return false;
	},
	addBan: function(owner_id, type, item_id) {
		var params = {}, curPost = $.element("wall-" + (type == "wall" ? "post" : type) + owner_id + "_" + item_id);
		if (owner_id > 0) params.user_ids = owner_id; else params.group_ids = -owner_id;
		Site.API("newsfeed.addBan", params, function(response) {
			var e = document.querySelectorAll(".wall-item[id^=\"wall-post" + owner_id + "\"]");
			for (var i = 0, l = e.length; i < l; ++i)
				if (curPost != e[i])
					$.elements.addClass(e[i], "hidden");
			$.elements.clearChild(curPost.previousSibling);
			curPost.previousSibling.appendChild($.e("div", {html: "Все записи этого " + (owner_id > 0 ? "пользователя" : "сообщества") + " скрыты из новостной ленты"}));
			curPost.previousSibling.appendChild($.e("a", {html: "Отмена", onclick: function() {
				Feed.removeFromBan(owner_id, function() {
					for (var i = 0, l = e.length; i < l; ++i)
						if (curPost != e[i])
							$.elements.removeClass(e[i], "hidden");
					$.elements.removeClass(curPost, "hidden");
					$.elements.remove(curPost.previousSibling);
				});
			}}));
		});
	},
	removeFromBan: function(ownerId, callback) {
		var options = {};
		if (ownerId > 0)
			options.user_ids = ownerId;
		else
			options.group_ids = -ownerId;
		Site.API("newsfeed.deleteBan", options, function(data) {
			data = Site.isResponse(data);
			callback();
		});
	},
	getLists: function() {
		var lists = Feed.Filters,
			parent = document.createElement("div"),
			list = document.createElement("div"),
			e = $.e,
			getItem = function(i) {
				return e("a", {href: "#feed?lists=" + (i.id ? "list" + i.id : i.name), html: i.title.safe()});
			};
		list.className = "minilist";
		for (var i = 0, l = lists.length; i < l; ++i)
			list.appendChild(getItem(lists[i]));
		if (!lists.length)
			list.appendChild(Site.EmptyField("Нет списоков новостей"));
		parent.appendChild(Feed.GetTabs());
		parent.appendChild(Site.CreateHeader("Списки новостей"));
		parent.appendChild(Feed.getSelectionsTabs());
		parent.appendChild(list);
		parent.appendChild(Site.CreateNextButton({text: lg("feed.listsRecommend"), link: "#groups?act=recommends"}));
		Site.Append(parent);
		Site.SetHeader("Списки новостей");
	},
	getFriends: function(data) {
		data = Site.isResponse(data);
		Local.add(data.profiles.concat(data.groups));
		var parent = document.createElement("div"),
			list = document.createElement("div"),
			next = data.next_from,
			data = data.items;
		Feed.getFriendsFeed(list, data, next);
		parent.appendChild(Feed.GetTabs());
		parent.appendChild(Site.CreateHeader("Обновления друзей"));
		parent.appendChild(list);
		Site.Append(parent);
		Site.SetHeader("Обновления друзей");
	},
	getFriendsFeed: function(list, data, next) {
		for (var i = 0, l = data.length; i < l; ++i)
			list.appendChild(Feed.event.addedFriends(data[i]));
		list.appendChild($.e("div", {"class": "button-block", html: "Поздние обновления..", onclick: function(event) {
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
			}, function(data) {
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
	getBanned: function(animateFrom) {
		Site.APIv5("newsfeed.getBanned", {
			v: 5.14,
			extended: 1,
			fields: "photo_50,first_name_dat,screen_name,online"
		}, function(data) {
			data = Site.isResponse(data);
			var list = document.createElement("div"),
				data = data.groups.concat(data.profiles || []);
			for (var i = 0, l = data.length; i < l; ++i) {
				if (!data)
					continue;
				list.appendChild(Templates.getMiniUser(data[i], {action: {
					node: $.e("div", {
						"class": "feed-delete",
						onclick: (function(id) {
							return function() {
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
						onclick: function() {
							m.close();
						}
					}
				]
			}).show(animateFrom);
		})
	},
	removeBan: function(id, node) {
		if ($.elements.hasClass(node, "__deleted"))
			return;
		var options = {};
		if (id > 0)
			options.user_ids = id;
		else
			options.group_ids = -id;
		Site.API("newsfeed.deleteBan", options, function(data) {
			data = Site.isResponse(data);
			if (data) {
				var i = node.parentNode;
				$.elements.addClass(node, "__deleted");
				i.style.opacity = ".5";
			}
		});
	},
	AddBan:function(id,list){
		var opts={};
		if(id>0)
			opts.uids=id;
		else
			opts.gids=-id;
		Site.API("newsfeed.addBan",opts,function(data){
			if(data.response===1){
				if(list==true){
					$.element("feedbanned"+id).style.opacity=1;
					$.element("feedact"+id).innerHTML='<a href="#feed" onclick="return Feed.DeleteBanned('+id+');">Вернуть в новости<\/a>';
				}else{
					var other=document.querySelectorAll(".feed_owner"+id);
					var other_btns=document.querySelectorAll(".feed_owner"+id+" .feed-close");
					for(var i=0;i<other.length;++i){
						other[i].style.opacity=0.5;
						other_btns[i].style.display="none";
					}
				}
			}
		});
		return false;
	},
	showComments: function(data) {
		data = Site.isResponse(data);
		Local.add(data.profiles.concat(data.groups));
		var e = $.e,
			posts = data.items,
			parent = e("div"),
			list = e("div"),
			post, item, c, type, ownerId, postId, comments, i, j, k, m;
		parent.className = "feed-comments";
		for (i = 0, l = posts.length; i < l; ++i) {
			item = posts[i];
			current = e("div", {"class": "feed-comments-item"});
			type = posts[i].type,
			ownerId = posts[i].source_id,
			postId = posts[i].post_id;

			current.id = "feed_comments_" + type + "_" + ownerId + "_" + postId;
			if (item.type == "note")
				continue;
			if (item.type != "post" && item.type != "topic")
			{
				var self = {type: item.type};
				item.attachments = [];
				self[item.type] = item;
				item.attachments.push(self);
			};
			post = Wall.itemPost(item, ownerId, postId, {from: "feed?act=comments"});
			post.insertBefore((function(type, ownerId, postId) {
				return e("div", {
					"class": "feed-close a",
					onclick: function(event) {
						Site.API("newsfeed.unsubscribe", {
							type: type,
							owner_id: ownerId,
							item_id: postId
						}, function(data) {
							if (data.response)
								$.element("feed_comments_" + type + "_" + ownerId + "_" + postId).style.opacity = .5;
						});
					}
				});
			})(type, ownerId, postId), post.firstChild);

			comments = e("div", {"class": "feed-comments-node", id: "feed_comments_" + type + "_" + ownerId + "_" + postId});

			for (j = 0, k = item.comments.list.length; j < k; ++j) {
				comments.appendChild((function(comment, j) {
					if (comment.cid) {
						comment.id = comment.cid;
						comment.reply_to_user = comment.reply_to_uid;
						comment.reply_to_comment = comment.reply_to_cid;
					};
					comment = Wall.ItemComment(comment, ownerId, postId, {});
					comment.className = "wall-right";
					return comment;
				})(item.comments.list[j], j));
			};
			var write = Feed.getCommentForm(ownerId, postId, {
					fromGroup: ownerId < 0 ? Local.Users[ownerId] && Local.Users[ownerId].is_admin : false,
					allowAttachments: 60
				}, type);
			$.elements.addClass(write, "wall-right");

			comments.appendChild(write);
			current.appendChild(post);
			current.appendChild(comments);
			list.appendChild(current);
		};
		parent.appendChild(Feed.GetTabs());
		parent.appendChild(Site.CreateHeader("Комментарии"));
		parent.appendChild(list);
		Site.SetHeader("Комментарии", {link: "feed"});
		Site.Append(parent);
	},
	getCommentForm: function(ownerId, postId, opts, type) {
		var obj = {
			name: "message",
			nohead: true,
			ctrlEnter: true,
			asAdmin: opts.fromGroup,
			allowAttachments: 30,
			id: "wall-comments-area" + ownerId + "_" + postId,
			onsubmit: function(event) {
				var text = Site.AddSlashes(this.message.value),
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
				};
				if (!text && !attachments) {
					alert("Введите текст!");
					return false;
				};
				Site.APIv5({
					post: "wall.addComment",
					wall: "wall.addComment",
					photo: "photos.createComment",
					video: "video.createComment",
					topic: "board.addComment",
					board: "board.addComment"
				}[type], params, function(result) {
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
						Array.prototype.forEach.call(att, function(i) {
							if (!i) return;
							b = /(photo|video|audio|doc)(-?\d+_\d+)/img.exec(i);
							i = {type: b[1]};
							i[b[1]] = c[b[1]][b[2]];
							a.push(i);
						});
					};
					var node;
					form.parentNode.insertBefore(node = Wall.ItemComment({
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
		return Site.CreateWriteForm(obj, ownerId, postId);
	},
	search: function(opts) {
		opts.q = decodeURIComponent(opts.q);
		Site.APIv5("newsfeed.search", {
			extended: 1,
			q: decodeURIComponent(opts.q),
			count: 30,
			offset: opts.offset,
			start_time: Math.round(+new Date()/1000) - 2 * 31536000,
			end_time: Math.round(+new Date()/1000),
			v: 5.0
		}, function(data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				form = document.createElement("form"),
				elem = document.createElement("div");
			form.className = "sf-wrap";
			form.appendChild($.e("input", {type: "text", name:"q", placeholder:"Введите ключевое слово..", value: opts.q}));
			form.appendChild($.e("input", {type: "submit", value:"Поиск"}));
			elem.id = "feed-search";
			elem.appendChild(Site.CreateHeader($.TextCase(data.count, ["Найдена", "Найдены", "Найдено"]) + " " + data.count + " " + $.TextCase(data.count, ["запись", "записи", "записей"])));
			elem.appendChild(Site.CreateInlineForm({
				name: "q",
				value: opts.q,
				title: "Поиск",
				onsubmit: function(event) {
					if ("#feed?act=search&q=" + this.q.value == window.location.hash)
						return false;
					window.location.hash = "#feed?act=search&q=" + encodeURIComponent(this.q.value);
					$.elements.clearChild(list);
					elem.appendChild($.e("div", {"class": "msg-empty msg-loader"}));
					return false;
				}
			}))
			Site.Append(parent);
			var posts = data.items;
			Local.add(data.profiles);
			Local.add(data.groups || data.group);
			for (var i = 0, l = posts.length; i < l; ++i) {
				var c = posts[i];
				try {
					list.appendChild(Wall.itemPost(c, c.owner_id, c.id, {ban: true, q: opts.q, from: "feed?act=search&q=" + opts.q}));
				} catch (e) {}
			}
			if (!l)
				list.appendChild(Site.EmptyField("Ничего не найдено"))
			list.appendChild(Site.PagebarV2(opts.offset, data.count, 30));
			elem.appendChild(list);
			parent.appendChild(Feed.GetTabs());
			parent.appendChild(elem);
			Site.SetHeader("Поиск", {link: "feed"});
		})
	},
	searchByOwner: function(ownerId, query, offset) {
		Site.Loader();
		query = decodeURIComponent(query || "") || "";
		var q = query.safe();
		Site.API("execute", {
			code: "return{o:API.users.get({user_ids:Args.h,fields:Args.f,v:5.29})[0],g:API.groups.getById({group_id:-Args.h})[0],r:API.wall.search({query:Args.q,owner_id:Args.h,count:50,offset:parseInt(Args.o),owners_only:Args.w==1,extended:1,v:5.29})};",
			h: ownerId,
			f: "first_name_gen,online,screen_name",
			q: query,
			o: getOffset(),
			w: Site.get("comments") ? 0 : 1
		}, function(data) {
			data = Site.isResponse(data);
			if (!data.o && !data.g) {
				Site.Append(Site.EmptyField("Ошибка<br\/><br\/>data.o && data.g is null"));
				return;
			};
			Local.add([data.o, data.g]);
			Local.add(data.r.profiles);
			Local.add(data.r.groups);
			var e = $.e,
				owner = data.o || data.g,
				isUser = data.o,
				u = Local.Users,
				w = data.r.items,
				owner = Local.Users[ownerId],
				hash = String(q).split("@")[0],
				count = data.r.count,
				form = Site.CreateInlineForm({
					title: "Найти",
					value: hash,
					placeholder: "Поиск..",
					name: "q",
					onsubmit: function(event) {
						window.location.hash = "#feed?act=search&owner=" + ownerId + "&q=" + encodeURIComponent($.trim(this.q.value));
						event.preventDefault();
						return false;
					}
				}),
				list = e("div"),
				page = e("div", {append: [
					Site.CreateHeader(
						("На странице %s найдено %d " + $.textCase(count, ["запись", "записи", "записей"]) + " по хэштегу %h")
							.replace(/%s/img, (isUser ? owner.first_name_gen : owner.name).safe())
							.replace(/%d/img, count)
							.replace(/%h/img, hash)
					),
					form,
					list
				]});
			if (w.length)
				Array.prototype.forEach.call(w, function(post) {
					list.appendChild(Wall.itemPost(post, post.owner_id, post.id, {deleteBtn: true, from: Site.getAddress(true)}));
				});
			else
				list.appendChild(Site.EmptyField(query ? "Ничего не найдено" : "Введите запрос"));
			list.appendChild(Site.PagebarV2(offset, count, 50));
			Site.Append(page);
			Site.SetHeader("Поиск по стене", {link: "#" + owner.screen_name});
		});
	}
};