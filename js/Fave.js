/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Fave = {
	RequestPage: function () {
		var offset = Site.Get("offset");
		switch(Site.Get("section")) {
			case "links":   return Fave.Links(offset); break;
			case "posts":   return Fave.Posts(offset); break;
			case "photos":  return Fave.Photos(offset);break;
			case "videos":  return Fave.Videos(offset);break;
			case "users":
			default:        return Fave.Users(offset);
		}
	},
	GetTabs: function () {
		return Site.CreateTabPanel([
			["fave", "Люди"],
			["fave?section=links", "Ссылки"],
			["fave?section=posts", "Посты"],
			["fave?section=photos" ,"Фото"],
			["fave?section=videos", "Видео"]
		]);
	},
	userChate: null,
	Users: function (offset) {
		var fx = function (data) {
			var parent = document.createElement("div"), list = document.createElement("div"), count = data.count;
			parent.appendChild(Fave.GetTabs());
			parent.appendChild(Site.CreateHeader("У Вас в закладках " + count + " " + $.TextCase(count, ["человек","человека","человек"])));
			if (count == 0)
				parent.appendChild(Site.EmptyField("Никого нет.."));
			else {
				var fxSearch = function (event) {
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
			}
			for (var i = offset, data = data.items, l = offset + 40; i < l; ++i)
				list.appendChild(Fave.getUser(data[i]))
			list.appendChild(Site.PagebarV2(Site.Get("offset"), count, 40));
			parent.appendChild(list);
			Site.SetHeader("Закладки");
			Site.Append(parent);
		};
			Site.API("execute", {code: "return API.fave.getUsers({count:500,fields:\"photo_50,online,can_write_private_message,screen_name\",v:5});"}, fx); // FASTFIX (need rewrite)
	},
	insertUsers: function (node, users, from, until) {
		for (var u = users.items; from < until; ++from)
			node.appendChild(Fave.getUser(u[from]));
	},
	searchUser: function (node, users, q) {
		var founded = [];
		users = users.response;
		for (var i = 0, u = users.items, l = u.length; i < l; ++i) {
			if (new RegExp(q, "gi").test(u[i].first_name) || new RegExp(q, "gi").test(u[i].last_name))
				founded.push(u[i]);
		}
		if (!founded.length) {
			node.appendChild(Site.EmptyField(Lang.get("docs.search_by_query") + " \"" + Site.Escape(q) + "\" " + Lang.get("docs.search_not_found")));
		} else {
			Fave.insertUsers(node, {count: founded.length, items: founded}, 0, founded.length);
		}
	},
	getUser: function (i) {
		var e = $.e, q;
		return (q = i ? e("a", {"class": "friends-item", id: "fave-user" + i.id, href: "#" + (i.screen_name || "id" + i.id), append: [
			e("img", {"class": "friends-left", src: getURL(i.photo_100) || i.photo_50}),
			e("div", {"class": "friends-right", append: [
				e("div", {
					"class": "feed-delete",
					onclick: (function (id) {
						return function (event) {
							$.event.cancel(event);
							return Fave.removeUser(id, q);
						};
					})(i.id)
				}),
				e("strong", {
					"class": "m-p-name",
					html: Site.Escape(i.first_name + " " + i.last_name) + Site.isOnline(i)
				})
			]})
		]}) : document.createTextNode(""));
	},
	removeUser: function (userId, node) {
		Site.API("fave.removeUser", {
			user_id: userId
		}, function (data) {
			if (data)
			{
				$.elements.remove(node);
			}
		});
	},
	removeLink: function (linkId, node) {
		Site.API("fave.removeLink", {
			link_id: linkId
		}, function (data) {
			if (data)
			{
				$.elements.remove(node);
			}
		});
	},
	Links:function(offset){
		Site.APIv5("fave.getLinks",{
			count: 40,
			offset: offset,
			v: 5.19
		}, function (data) {
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				q;
			list.className = "minilist";
			parent.appendChild(Fave.GetTabs());
			parent.appendChild(Site.CreateHeader("У Вас в закладках " + data.count + " " + $.TextCase(data.count, ["ссылка","ссылки","ссылок"])));
			parent.appendChild(Site.CreateInlineForm({
				type: "url",
				name: "link",
				placeholder: "Вставьте ссылку",
				title: "Добавить",
				onsubmit: function (event) {
					$.event.cancel(event);

					var link = $.trim(this.link.value);

					link = link.replace(/(https?:\/\/)?apidog\.ru\/6\.5\/#/igm, "http:\/\/vk.com/");

					Site.API("fave.addLink", {
						link: link
					}, function (data) {
						if (Site.isResponse(data))
							Site.Go(window.location.hash);
					})

					return false;
				}
			}));
			if (data.count == 0)
				parent.appendChild($.e("div",{"class": "msg-empty", html: "Ничего нет.."}))
			for(var i = 0; i < data.items.length; ++i) {
				var url = data.items[i].url;
				if (/\/\/vk\.com\//igm.test(url))
					url = url.replace(new RegExp("\\/\\/vk\\.com\\/", "img"), "\/\/apidog.ru\/6.5\/#");
				list.appendChild(q = $.e("a", {
					"class": "groups-item",
					href: url,
					append: [
						$.e("img", {"class": "groups-left", src: getURL(data.items[i].photo_50)}),
						$.e("div", {"class": "groups-right", append: [
							$.e("div", {
								"class": "feed-delete",
								onclick: (function (id) {
									return function (event) {
										$.event.cancel(event);
										return Fave.removeLink(id, q);
									};
								})(data.items[i].id)
							}),
							$.e("strong", {html: Site.Escape(data.items[i].title)}),
							$.e("div", {"class": "tip", html: data.items[i].description || ""})
						]})
					]
				}));
			}
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), data.count, 40));
			Site.SetHeader("Закладки");
			Site.Append(parent);
		});
	},
	Posts: function (offset) {
		Site.APIv5("fave.getPosts",{
			count: 30,
			offset: offset,
			extended: 1,
			v: 5.29
		}, function (data) {
			data = Site.isResponse(data);
			Local.AddUsers(data.profiles.concat(data.groups));
			var parent = document.createElement("div"),
				count = data.count;
			data = data.items;
			parent.appendChild(Fave.GetTabs());
			parent.appendChild(Site.CreateHeader("У Вас в закладках " + count + " " + $.textCase(count, ["запись","записи","записей"])));
			if (!count)
				parent.appendChild(Site.EmptyField("Ничего нет.."));
			else
				for (var i = 0, l = data.length; i < l; ++i)
					parent.appendChild(Wall.ItemPost(data[i], data[i].owner_id, data[i].id, {from: "fave?section=posts"}));
			parent.appendChild(Site.PagebarV2(offset, count, 30));
			Site.SetHeader("Закладки");
			Site.Append(parent);
		});
	},
	Photos: function (offset) {
		Site.APIv5("fave.getPhotos", {
			count: 40,
			offset: offset,
			extended: 1,
			v: 5.29
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				count = data.count;
			data = data.items;
			parent.appendChild(Fave.GetTabs());
			parent.appendChild(Site.CreateHeader("У Вас в закладках " + count + " " + $.TextCase(count, ["фотография","фотографии","фотографий"])));
			if (!count)
				parent.appendChild(Site.EmptyField("Ничего нет.."));
			else
				for (var i = 0, l = data.length; i < l; ++i) {
					data[i].likes = {count: 0, user_likes: 0};
					data[i].comments = {count: 0};
					list.appendChild(Photos.itemPhoto(data[i]));
				};
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 40));
			Site.SetHeader("Закладки");
			Site.Append(parent);
		});
	},
	Videos: function (offset) {
		Site.API("fave.getVideos", {
			count: 30,
			offset: offset,
			extended: 1,
			need_likes: 1
		},function(data){
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div");
			parent.appendChild(Fave.GetTabs());
			parent.appendChild(Site.CreateHeader("У Вас в закладках " + data[0] + " " + $.TextCase(data[0], ["видеозапись","видеозаписи","видеозаписей"])));
			if (data[0] == 0)
				parent.appendChild($.elements.create("div",{"class": "msg-empty", html: "Ничего нет.."}))
			for(var i = 1; i < data.length; ++i)
				list.appendChild(Video.Item && Video.Item(data[i]) || Video.item(Video.tov5(data[i])));
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"),data[0],40));
			Site.SetHeader("Закладки");
			Site.Append(parent);
		});
	}
};