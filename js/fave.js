var Fave = {

	RequestPage: function () {
		var offset = getOffset();
		switch (Site.get("section")) {
			case "links":   return Fave.getLinks().then(Fave.showLinks);
			case "groups":   return Fave.getGroups().then(Fave.showGroups);
			case "posts":   return Fave.Posts(offset);
			case "photos":  return Fave.Photos(offset);
			case "videos":  return Fave.Videos(offset);
			case "users":
			default:        return Fave.getUsers().then(Fave.showUsers);
		}
	},

	getTabs: function () {
		return Site.getTabPanel([
			["fave", "Люди"],
			["fave?section=groups", "Группы"],
			["fave?section=links", "Ссылки"],
			["fave?section=posts", "Посты"],
			["fave?section=photos" ,"Фото"],
			["fave?section=videos", "Видео"]
		]);
	},

	userCache: null,

	/**
	 * Request to get favourites users
	 * @returns {Promise}
	 */
	getUsers: function() {
		return new Promise(function(resolve) {
			if (Fave.userCache) {
				resolve(Fave.userCache);
			} else {
				api("fave.getUsers", {v: 5.56, count: 500, fields: "photo_50,online,can_write_private_message,screen_name"}).then(resolve);
			}
		});
	},

	/**
	 * Show favourites users list
	 * @param {{count: int, items: User[]}} data
	 */
	showUsers: function(data) {
		Fave.userCache = data;
		var parent = $.e("div"),
			sl = new SmartList({
				data: data,
				countPerPage: 50,
				needSearchPanel: true,
				getItemListNode: SmartList.getDefaultItemListNode,
				optionsItemListCreator: {
					textContentBold: true,

					remove: {
						onClick: function(user, node) {
							node.style.opacity = .5;
							Fave.removeUser(user.id).then(function() {
								sl.remove(user);
							});
						}
					}
				},

				filter: SmartList.getDefaultSearchFilter({
					fields: ["first_name", "last_name"]
				})
			}),
			count = data.count;

		window.onScrollCallback = function(event) {
			event.needLoading && sl.showNext();
		};

		parent.appendChild(Fave.getTabs());
		parent.appendChild(Site.getPageHeader("У Вас в закладках " + count + " " + $.textCase(count, ["человек","человека","человек"])));
		parent.appendChild(sl.getNode());

		Site.setHeader("Закладки");
		Site.append(parent);
	},

	/**
	 * Request to remove user from favourites
	 * @param {int} userId
	 * @returns {Promise}
	 */
	removeUser: function(userId) {
		return api("fave.removeUser", { user_id: userId });
	},


	groupCache: null,

	/**
	 * Request to get favourites groups
	 * @returns {Promise}
	 */
	getGroups: function() {
		return new Promise(function(resolve) {
			if (Fave.groupCache) {
				resolve(Fave.groupCache);
			} else {
				api("fave.getPages", {v: 5.94, type: "groups", count: 500, fields: "photo_50,screen_name"}).then(resolve);
			}
		});
	},

	/**
	 * Show favourites groups list
	 * @param {{count: int, items: {group: User[]}}} data
	 */
	showGroups: function(data) {
		Fave.groupCache = data;
		console.log(data);
		var parent = $.e("div"),
			sl = new SmartList({
				data: {
					count: data.count,
					items: data.items.map(function(item) {
						return {
							id: item.group.id,
							name: item.group.name,
							photo_50: item.group.photo_50
						}
					})
				},
				countPerPage: 50,
				needSearchPanel: true,
				getItemListNode: SmartList.getDefaultItemListNode,
				optionsItemListCreator: {
					textContentBold: true,

					remove: {
						onClick: function(group, node) {
							node.style.opacity = .5;
							Fave.removeGroup(group.id).then(function() {
								sl.remove(group);
							});
						}
					}
				},

				filter: SmartList.getDefaultSearchFilter({
					fields: ["name"]
				})
			}),
			count = data.count;

		var __fuckingVkFavesGetPagesReturnFakeCount = 0;
		window.onScrollCallback = function(event) {
			if (++__fuckingVkFavesGetPagesReturnFakeCount >= 1000) {
				window.onScrollCallback = null;
				return;
			}
			event.needLoading && sl.showNext();
		};

		parent.appendChild(Fave.getTabs());
		parent.appendChild(Site.getPageHeader("У Вас в закладках " + count + " " + $.textCase(count, ["сообщество","сообщества","сообществ"])));
		parent.appendChild(sl.getNode());

		Site.setHeader("Закладки");
		Site.append(parent);
	},

	/**
	 * Request to remove group from favourites
	 * @param {int} userId
	 * @returns {Promise}
	 */
	removeGroup: function(userId) {
		//return api("fave.removeUser", { user_id: userId });
	},


	linkCache: null,

	/**
	 * Request to get favourites links
	 * @returns {Promise}
	 */
	getLinks: function() {
		return new Promise(function(resolve) {
			if (Fave.linkCache) {
				resolve(Fave.linkCache);
			} else {
				api("fave.getLinks", {v: 5.56, count: 500}).then(resolve);
			}
		});
	},

	/**
	 * Show favourites links list
	 * @param {{count: int, items: object[]}} data
	 */
	showLinks: function(data) {
		var parent = $.e("div");
		parent.appendChild(Fave.getTabs());
		parent.appendChild(Site.getPageHeader(
			"У Вас в закладках " + data.count + " " + $.textCase(data.count, ["ссылка","ссылки","ссылок"])
		));
		parent.appendChild(Site.createInlineForm({
			type: "url",
			name: "link",
			placeholder: "Вставьте ссылку",
			title: "Добавить",
			onsubmit: function (event) {
				$.event.cancel(event);

				var link = this.link.value.trim();

				link = link.replace(/(https?:\/\/)?apidog\.ru\/(6\.4\/)?#/igm, "http:\/\/vk.com/");

				Fave.addLink(link).then(function() {
					// TODO: get info about user/group/app/photo/video/doc/away
				});

				return false;
			}
		}));

		var sl = new SmartList({
			data: data,
			countPerPage: 50,
			needSearchPanel: true,
			getItemListNode: Fave.getLinkItem,
			optionsItemListCreator: {
				textContentBold: true,

				remove: {
					filter: function () {
						return true;
					},
					onClick: function (link, node) {
						node.style.opacity = .5;
						Fave.removeLink(link.id).then(function () {
							sl.remove(link);
						});
					}
				}
			},

			filter: SmartList.getDefaultSearchFilter({
				fields: ["title", "url"]
			})
		});


		parent.appendChild(sl.getNode());
		Site.setHeader("Закладки");
		Site.append(parent);
	},

	/**
	 * Returns item of link for list
	 * @param {{title, url, photo_50, description, id}} item
	 * @param {object} options
	 * @returns {HTMLElement}
	 */
	getLinkItem: function(item, options) {
		var screenName = item.url.split("/")[3];
		return SmartList.getDefaultItemListNode({
			id: item.id,
			screen_name: screenName,
			photo_50: item.photo_50,
			name: item.title,
			subtitle: item.description
		}, options);
	},

	/**
	 * Request to add link to favourites
	 * @param {string} url
	 * @returns {Promise}
	 */
	addLink: function(url) {
		return api("fave.addLink", { link: url });
	},

	/**
	 * Request to remove link from favourites
	 * @param {string} linkId
	 * @returns {Promise}
	 */
	removeLink: function (linkId) {
		return api("fave.removeLink", { link_id: linkId });
	},

	Posts: function (offset) {
		Site.APIv5("fave.getPosts",{
			count: 30,
			offset: offset,
			extended: 1,
			v: 5.29
		}, function (data) {
			data = Site.isResponse(data);
			Local.add(data.profiles.concat(data.groups));
			var parent = document.createElement("div"),
				count = data.count;
			data = data.items;
			parent.appendChild(Fave.getTabs());
			parent.appendChild(Site.getPageHeader("У Вас в закладках " + count + " " + $.textCase(count, ["запись","записи","записей"])));
			if (!count)
				parent.appendChild(Site.getEmptyField("Ничего нет.."));
			else
				for (var i = 0, l = data.length; i < l; ++i)
					parent.appendChild(Wall.getItemPost(data[i], data[i].owner_id, data[i].id, {from: "fave?section=posts"}));
			parent.appendChild(Site.getSmartPagebar(offset, count, 30));
			Site.setHeader("Закладки");
			Site.append(parent);
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
			parent.appendChild(Fave.getTabs());
			parent.appendChild(Site.getPageHeader("У Вас в закладках " + count + " " + $.textCase(count, ["фотография","фотографии","фотографий"])));
			if (!count)
				parent.appendChild(Site.getEmptyField("Ничего нет.."));
			else
				for (var i = 0, l = data.length; i < l; ++i) {
					data[i].likes = {count: 0, user_likes: 0};
					data[i].comments = {count: 0};
					list.appendChild(Photos.itemPhoto(data[i]));
				}
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 40));
			Site.setHeader("Закладки");
			Site.append(parent);
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
			parent.appendChild(Fave.getTabs());
			parent.appendChild(Site.getPageHeader("У Вас в закладках " + data[0] + " " + $.textCase(data[0], ["видеозапись","видеозаписи","видеозаписей"])));
			if (!data[0]) {
				parent.appendChild($.elements.create("div", {"class": "msg-empty", html: "Ничего нет.."}))
			}
			for(var i = 1; i < data.length; ++i) {
				list.appendChild(Video.Item && Video.Item(data[i]) || Video.item(Video.tov5(data[i])));
			}
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(),data[0],40));
			Site.setHeader("Закладки");
			Site.append(parent);
		});
	}
};