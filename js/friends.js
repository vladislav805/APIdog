var Friends = {
	List: null,
	Lists: null,
	explain: function(ownerId) {
		ownerId = parseInt(ownerId || API.userId);

		switch (Site.get("act")) {
			case "requests":
				return Friends.getRequests().then(Friends.showRequests);

			case "suggestions":
				return Friends.getSuggestions();

			case "recent":
				return Friends.getRecent();

			case "mutual":
				return Friends.getMutual(ownerId);


			case "lists":
				switch (Site.get("action")) {
					case "create":
						return Friends.showFormCreateList();

					default:
						return Friends.getLists(ownerId);
				}

			default:
				if (Friends.friends[ownerId] && (ownerId === API.userId || !ownerId)) {
					return Friends.showFriends(ownerId, Friends.friends[ownerId]);
				}

				api("friends.get", {
					user_id: ownerId,
					fields: Friends.DEFAULT_FIELDS,
					order: "hints",
					v: 5.8
				}).then(function(data) {
					Friends.showFriends(ownerId, data, true);
				}).catch(function(error) {
					console.log(error);
					Site.Alert({text: "Ошибка! Доступ запрещен!"});
				});
		}
	},

	DEFAULT_FIELDS: "photo_50,online,can_write_private_message,screen_name,sex,last_seen",

	friends: {},

	Cities: [],

	/**
	 * Returns top tabs
	 * @param {int} ownerId
	 * @returns {HTMLElement}
	 */
	getTabs: function(ownerId) {
		var userId = ownerId !== API.userId ? ownerId : "",
			has = Friends.friends[ownerId],
			count = has ? Friends.friends[ownerId].count : 0,
			countOnline = has ? (function(a,e) {
				for (var b=0,c=0,d=a.length;b<d;++b)a[b][e]&&++c;return c;
			})(Friends.friends[ownerId].items, "online") : 0,
			tabs = [
				["friends" + (userId ? "?id=" + userId : "") + Photos.getToParam(0), Lang.get("friends.tabs_all"), count],
				["friends?section=online" + (userId ? "&id=" + userId : ""), Lang.get("friends.tabs_online"), countOnline],
				["friends?act=lists" + (userId ? "&id=" + userId : ""), Lang.get("friends.tabs_lists")]
			];

		if (ownerId === API.userId) {
			tabs.push(["friends?act=requests", Lang.get("friends.tabs_requests"), Site.counters && Site.counters.friends || ""]);
			tabs.push(["friends?act=suggestions", Lang.get("friends.tabs_suggestions")]);
		} else {
			tabs.push(["friends?act=mutual&id=" + ownerId, Lang.get("friends.tabs_mutual")]);
		}

		return Site.getTabPanel(tabs);
	},

	/**
	 * Pre output friends and filtering
	 * @param {int} userId
	 * @param {{count: int, items: object[]}} response
	 * @param {boolean=} save
	 */
	showFriends: function(userId, response, save) {
		if (save) {
			Friends.friends[userId] = response;
		}

		var items;

		if (Site.get("section") === "online") {
			items = response.items.filter(function(user) {
				return user.online;
			});
			return Friends.showFriendsOnPage(userId, {count: items.length, items: items});
		}

		if (Site.get("list")) {
			var listId = +Site.get("list");
			items = response.items.filter(function(user) {
				return user.lists && ~user.lists.indexOf(listId);
			});
			return Friends.showFriendsOnPage(userId, {count: items.length, items: items});
		}

		Friends.showFriendsOnPage(userId, response);
	},

	/**
	 * Output friend list
	 * @param {int} userId
	 * @param {{count: int, items: object[]}} response
	 */
	showFriendsOnPage: function(userId, response) {
		var count = response.count,
			page = $.e("div"),
			listId = +Site.get("list"),
			actions = null;

		if (listId && userId === API.userId) {
			actions = new DropDownMenu(Lang.get("general.actions"), {
				edit: {
					label: "Изменить",
					onclick: function() {
						Friends.editList(listId);
					}
				},
				remove: {
					label: "Удалить",
					onclick: function() {
						Friends.removeList(listId);
					}
				}
			});
		} else if (!listId) {
			actions = $.e("span", {"class": "fr a", html: "Обновить", onclick: function() {
				Friends.friends[userId] = null;
				Friends.explain(userId);
			}});
		}

		Local.add(response.items);

		var sl = new SmartList({
			data: response,
			countPerPage: 50,
			needSearchPanel: true,
			getItemListNode: SmartList.getDefaultItemListNode,
			optionsItemListCreator: {
				mail: true,
				textContentBold: true
			},

			filter: SmartList.getDefaultSearchFilter({
				fields: ["first_name", "last_name"]
			}),

			onPageCreated: function() {
				Site.initOnlineTooltips();
			}
		});

		window.onScrollCallback = function(event) {
			event.needLoading && sl.showNext();
		};

		page.appendChild(Friends.getTabs(userId));
		page.appendChild(Site.getPageHeader(count + " " + $.textCase(count, Lang.get("friends.friend_s")), actions ? actions : false));
		page.appendChild(sl.getNode());

		Site.append(page);
		Site.setHeader(Lang.get("friends.friends"));
		Site.initOnlineTooltips();
	},

	// Second line in item (old code)
	/*getFooter: function() {
		(function (a){for(var b=0,c=a.length,d=[];b<c;++b)if(a[b]!==null)d.push(a[b]);return d.join(", ");})([i.city ? i.city.title : null, i.bdate && i.bdate.split(".").length === 3 ? (new Date().getFullYear() - (+i.bdate.split(".")[2])) + " " + $.textCase(new Date().getFullYear() - (+i.bdate.split(".")[2]), Lang.get("friends.years")) : null])})
	},*/


	/**
	 * Request for add user to friends
	 * @param {int} userId
	 * @returns {Promise}
	 */
	add: function(userId) {
		return api("friends.add", {user_id: userId});
	},

	/**
	 * Request for remove user from friends
	 * @param {int} userId
	 * @returns {Promise}
	 */
	remove: function(userId) {
		return api("friends.delete", {user_id: userId});
	},



	/**
	 * Request for friends requests
	 * @returns {Promise}
	 */
	getRequests: function() {
		return api("execute", {
			code: 'var f=API.friends.getRequests({extended:1,need_mutual:1,v:5.8,out:parseInt(Args.isOut)});return{requests:f,users:API.users.get({user_ids:f.items@.user_id,fields:Args.fields,v:5.8})};',
			isOut: Site.get("out") ? 1 : 0,
			fields: "photo_50,city,bdate,screen_name,online,can_write_private_message,is_friend"
		});
	},

	/**
	 * Show friends requests
	 * @param data
	 */
	showRequests: function(data) {
		Local.add(data.users);
		data = data.requests;
		var parent = $.e("div"), isOut = Site.get("out");
		parent.appendChild(Friends.getTabs(API.userId));
		parent.appendChild(Site.getTabPanel([
			["friends?act=requests", "Входящие"],
			["friends?act=requests&out=1", "Исходящие"]
		]));
		parent.appendChild(Site.getPageHeader(
			data.count + " " + $.textCase(data.count, Lang.get("friends.requests")) + Lang.get("friends._in_friends"),
			!isOut
				? $.e("div", {"class": "a", html: "Отменить все", onclick: function() {
					api("friends.deleteAllRequests", {}).then(function() {
						Site.route(window.location.hash.replace(/#/igm,""));
					}).catch(function() {
						Site.Alert({ text: "Странно.. Что-то пошло не так.." });
					});
				}})
				: null
		));

		var sl = new SmartList({
			data: {
				count: data.count,
				items: data.items.map(function(item) {
					var user = Local.data[item.user_id];
					user.message = item.message;
					return user;
				})
			},
			countPerPage: 50,
			getItemListNode: SmartList.getDefaultItemListNode,
			optionsItemListCreator: {
				mail: true,
				textContentBold: true,

				getSubtitle: function(user) {
					return user.message;
				},

				add: {
					filter: function() {
						return !isOut;
					},

					onClick: function(user) {
						Friends.add(user.id).then(function() {
							sl.remove(user);
							new Snackbar({text: getName(user) + " " + Lang.get("friends.added_sex") + Lang.get("friends._in_friends")}).show();
						});
					},

					label: {
						content: "Принять заявку",
						width: 120
					}
				},

				remove: {
					onClick: function(user) {
						Friends.remove(user.id).then(function() {
							sl.remove(user);
						});
					},

					label: {
						content: isOut ? "Отменить заявку" : "Отклонить заявку",
						width: 130
					}
				}
			}
		});

		parent.appendChild(sl.getNode());

		Site.setHeader(Lang.get("friends.requests_in_friends"));
		Site.append(parent);
	},

	/**
	 * Request for suggestions friends
	 */
	getSuggestions: function() {
		api("friends.getSuggestions", {
			count: 200,
			filter: "mutual",
			fields: "photo_50,online,screen_name,sex,can_write_private_message,is_friend",
			v: 5.56
		}).then(Friends.showUsers.bind(null, {
			title: Lang.get("friends.suggestion_friends"),
			bacK: "friends",
			head: Lang.get("friends.suggestion_friends"),
			userId: API.userId,
			suggest: true
		}));
	},

	/**
	 * Request for mutual friends list
	 * @param {int} userId
	 */
	getMutual: function(userId) {
		api("execute",{
			code: "var u=API.users.get({user_ids:API.friends.getMutual({target_uid:parseInt(Args.u)}),fields:Args.f});return{count:u.length,items:u};",
			u: userId,
			f: "photo_50,online,can_write_private_message,screen_name,is_friend",
			v: 5.56
		}).then(Friends.showUsers.bind(null, {
			title: Lang.get("friends.mutual_friends_head"),
			back: "friends?id=" + userId,
			head: Lang.get("friends.mutual_friends_head"),
			userId: userId
		}));
	},

	/**
	 * Request for recent friends list
	 */
	getRecent: function() {
		api("execute", {
			code: "var u=API.users.get({user_ids:API.friends.getRecent({count:400}),fields:Args.f});return{count:u.length,items:u};",
			f: "photo_50,online,can_write_private_message,screen_name,is_friend",
			v: 5.56
		}).then(Friends.showUsers.bind(null, {
			title: Lang.get("friends.recent_friends"),
			back: "friends",
			head: Lang.get("friends.recent_friends"),
			userId: API.userId
		}));
	},

	/**
	 * Show list of users
	 * @param {{title: string, back: string, userId: int, head: string, suggest: boolean=}} options
	 * @param {{count: int, items: User[]}} data
	 */
	showUsers: function(options, data) {
		var parent = $.e("div"), sl;
		parent.appendChild(Friends.getTabs(options.userId));
		parent.appendChild(Site.getPageHeader(options.head));
		sl = new SmartList({
			data: data,
			countPerPage: 50,
			getItemListNode: SmartList.getDefaultItemListNode,
			optionsItemListCreator: {
				mail: true,
				textContentBold: true,

				add: {
					filter: function(item) {
						return !item.is_friend;
					},

					onClick: function(user) {
						Friends.add(user.id).then(function() {
							new Snackbar({text: getName(user) + " " + Lang.get("friends.added_sex") + Lang.get("friends._in_friends")}).show();
						});
					}
				},

				remove: {
					filter: function() {
						return options.suggest;
					},

					onClick: function(user) {
						Friends.hideSuggestion(user.id).then(function() {
							sl.remove(user);
						});
					},

					label: {
						content: "Скрыть"
					}
				}
			}
		});
		parent.appendChild(sl.getNode());
		Site.setHeader(options.title, {link: options.back});
		Site.append(parent);
	},

	hideSuggestion: function(userId) {
		return api("friends.hideSuggestion", {user_id: userId});
	},

	lists: {},

	/**
	 * Request for get friend lists
	 * @param {int} userId
	 */
	getLists: function(userId) {
		if (Friends.lists[userId]) {
			Friends.showFriendLists(userId);
			return;
		}

		api("friends.getLists", {user_id: userId, return_system: 1, v: 5.56}).then(function(data) {
			Friends.lists[userId] = data;
			Friends.showFriendLists(userId);
		}).catch(function(error) {
			console.error(error);
		});
	},

	/**
	 * Show list of lists of friends
	 * @param {int} userId
	 */
	showFriendLists: function(userId) {
		var data = Friends.lists[userId],

			parent = $.e("div"),
			list = $.e("div");

		if (userId === API.userId) {
			list.appendChild($.e("a", {
				href: "#friends?act=lists&action=create",
				"class": "list-item",
				html: "<i class=\"list-icon list-icon-add\"></i> " + Lang.get("friends.create_list")
			}));
		}

		data = data.items;

		var u = API.userId === userId ? "" : "id=" + userId + "&";

		if (data.length) {
			for (var i = 0, l; l = data[i]; ++i) {
				list.appendChild($.e("a", {"class": "list-item", href: "#friends?" + u + "list=" + l.id, html: l.name.safe() }));
			}
		} else {
			list.appendChild(Site.getEmptyField(Lang.get("friends.no_lists")));
		}

		parent.appendChild(Friends.getTabs(userId));
		parent.appendChild(Site.getPageHeader(Lang.get("friends.lists_of_friends")));
		parent.appendChild(list);
		Site.setHeader(Lang.get("friends.lists_of_friends"));
		Site.append(parent);
	},


	/**
	 *
	 */
	showFormCreateList: function () {
		if (!Friends.friends[API.userId]) {
			api("friends.get", {
				fields: Friends.DEFAULT_FIELDS,
				order: "hints",
				v: 5.64
			}).then(function(data) {
				Friends.friends[API.userId] = data;
				Friends.showFormCreateList();
			});
			return;
		}
		var page = document.createElement("div"),
			creator = document.createElement("form"),
			list = document.createElement("form"),
			friends = Friends.friends[API.userId].items,
			e = $.elements.create;
		creator.className = "sf-wrap";
		creator.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("friends.title_of_list")}));
		creator.appendChild(e("input", {
			type: "text",
			name: "title"
		}));
		creator.appendChild(e("input", {type: "submit", id: "friends-create-btn", value: Lang.get("friends.create_list"), disabled: true}));
		creator.onsubmit = function (event) {
			var name = this.title.value,
				user_ids = (function (e, user_ids) {
					for (var i = 0, l = e.length; i < l; ++i)
						if (e[i].checked)
							user_ids.push(e[i].value);
					return user_ids.join(",");
				})(list.elements["items[]"], []);
			Site.APIv5("friends.addList", {name: name, user_ids: user_ids, v: 5.11}, function (data) {
				if ((data = Site.isResponse(data)) && data.list_id) {
					Friends.friends[API.userId] = null;
					Friends.Lists = null;
					window.location.hash = "#friends?list=" + (data.list_id);

				}
			});
			$.event.cancel(event);
			return false;
		};
		for (var i = 0, l = friends.length; i < l; ++i) {
			list.appendChild(e("label", {"class": "miniProfile-item", append: [
				e("div", {"class": "_checkbox fr"}),
				e("img", {src: getURL(friends[i].photo_50), "class": "miniProfile-left"}),
				e("input", {type: "checkbox", name: "items[]", "class": "multiple_friends hidden", value: friends[i].id}),
				e("div", {"class": "miniProfile-right", append: [e("strong", {
					"class": "a",
					html: friends[i].first_name + " " + friends[i].last_name + Site.isOnline(friends[i])
				})]})
			], onclick: function (event) {
				var check = this.querySelector("input[type=checkbox]");
				if (check.checked)
					$.elements.addClass(this, "mp-checked");
				else
					$.elements.removeClass(this, "mp-checked");
				$.element("friends-create-btn").disabled = !document.querySelectorAll(".mp-checked").length;
			}}));
		};
		page.appendChild(Friends.getTabs(API.userId));
		page.appendChild(Site.getPageHeader(Lang.get("friends.creating_list")));
		page.appendChild(creator);
		page.appendChild(list);
		Site.setHeader(Lang.get("friends.creating_list"), {link: "friends?act=lists"});
		Site.append(page);
	},

	/**
	 * Return list by id
	 * @param {int} userId
	 * @param {int} listId
	 * @returns {object|null}
	 */
	getList: function(userId, listId) {
		for (var i = 0, l; l = Friends.lists[userId].items[i]; ++i) {
			if (l.id === listId) {
				return l;
			}
		}
		return null;
	},

	editList: function (listId)
	{
		listId = parseInt(listId);
		var thisFX = arguments.callee;
		if (!Friends.friends[API.userId])
		{
			Site.APIv5("friends.get",
				{
					fields: "photo_50,online,can_write_private_message,screen_name,sex",
					order: "hints",
					v: 5.8
				},
				function (data)
				{
					data = Site.isResponse(data);
					if (!data)
					{
						return Site.Alert({text: "Странно, ошибка.."});
					};
					Friends.friends[API.userId] = data;
					return thisFX();
				});
			return;
		};
		var parent = document.createElement("div"),
			list = document.createElement("form"),
			friends = Friends.friends[API.userId].items,
			e = $.elements.create;
		parent.appendChild(Friends.getTabs());
		parent.appendChild(Site.getPageHeader(Lang.get("friends.editing_title")));
		parent.appendChild(Site.createInlineForm({
			name: "title",
			value: Friends.getList(listId).name,
			placeholder: "Введите название",
			onsubmit: function (event) {
				event.preventDefault();
				var name = $.trim(this.title.value);
				if (!name)
				{
					Site.Alert({text: Lang.get("friends.enter_title")});
					return false;
				};
				var userIds = (function (e, userIds)
				{
					for (var i = 0, l = e.length; i < l; ++i)
						if (e[i].checked)
							userIds.push(parseInt(e[i].value));
					return userIds;
				})(list.elements["items[]"], []);
				Site.API("friends.editList", {
					name: name,
					list_id: listId,
					user_ids: userIds.join(",")
				}, function (data) {
					if (data.response) {
						Friends.Lists = (function (l,n,i,d,q,f,k,c){for(c=l[d].length;k<c;++k)if(l[d][k][q]==i){l[d][k][f]=n;break;};return l;})(Friends.Lists,name,listId,"items","id","name",0,null);
						var f = Friends.friends[API.userId].items;
						f.forEach(function (item) {
							if (~userIds.indexOf(item.id)) {
								if (item.lists) {
									if (!~item.lists.indexOf(listId))
										item.lists.push(listId);
								} else
									item.lists = [listId];
							} else {
								if (item.lists && ~item.lists.indexOf(listId)) {
									item.lists = (function (i, l, n) {
										l.forEach(function (r) {
											if (r != i)
												n.push(r);
										});
										return n;
									})(listId, item.lists, []);
								};
							};
						});
						Site.route("#friends?list=" + listId);
					}
				})
				return false;
			},
			title: Lang.get("friends.save")
		}));
		var ttchb, hasInList;
		for (var i = 0, l = friends.length; i < l; ++i) {
			hasInList = friends[i].lists && ~friends[i].lists.indexOf(listId);
			list.appendChild(e("label", {"class": "miniProfile-item" + (hasInList ? " mp-checked" : ""), append: [
				e("div", {"class": "_checkbox fr"}),
				e("img", {src: getURL(friends[i].photo_50), "class": "miniProfile-left"}),
				ttchb = e("input", {type: "checkbox", name: "items[]", "class": "multiple_friends hidden", value: friends[i].id}),
				e("div", {"class": "miniProfile-right", append: [e("strong", {
					"class": "a",
					html: getName(friends[i])
				})]})
			], onclick: function (event) {
				var check = this.querySelector("input[type=checkbox]");
				if (check.checked)
					$.elements.addClass(this, "mp-checked");
				else
					$.elements.removeClass(this, "mp-checked");
			}}));
			if (hasInList)
				ttchb.checked = true;
		};
		parent.appendChild(Site.getPageHeader(Lang.get("friends.creating_list")));

		parent.appendChild(list);
		Site.append(parent);
		Site.setHeader(Lang.get("friends.editing_title_head"), {fx: function () {Site.route(window.location.hash);}})
	},

	/**
	 * Confirm and request for remove friend list
	 * @param {int} listId
	 */
	removeList: function(listId) {
		VKConfirm(Lang.get("friends.confirm_delete_list"), function() {
			api("friends.deleteList", {list_id: listId}).then(function() {
				Friends.lists[API.userId] = null;
				window.location.hash = "#friends?act=lists";
				new Snackbar({text: Lang.get("friends.success_delete_list")}).show();
			});
		});
	},

	// v6.3

	/**
	 * Show birthdays under menu
	 * @param {User[]} friends
	 */
	showBirthdays: function(friends) {
		var nowDate = new Date(),
			n = {d: nowDate.getDate(), m: nowDate.getMonth() + 1, y: nowDate.getFullYear()},

			/**
			 * Filter users by birth day
			 * @param {object[]} items
			 * @param {{d: int, m: int, y: int=}} d
			 */
			getByDate = function(items, d) {
				return items.filter(function(item) {
					return isContains(item, d);
				});
			},

			/**
			 * Checks if birthday is equals
			 * @param {{d: int, m: int, y: int=}} o
			 * @param {{d: int, m: int, y: int=}} n
			 * @returns {boolean}
			 */
			isContains = function(o, n) {
				return (n.d === o.d && n.m === o.m);
			},

			users, isTomorrow, nodes, text;

		friends = friends.filter(function(user) {
			return user.bdate;
		}).map(function(user) {
			var d = user.bdate.split("."); // 0 - day, 1 - month, 2 - year, 3 - userId
			return {d: +d[0], m: +d[1], y: +d[2] || 0, u: user.id};
		});


		users = getByDate(friends, n);
		isTomorrow = 0;

		if (!users.length) {
			nowDate.setDate(nowDate.getDate() + 1);
			users = getByDate(friends, {d: nowDate.getDate(), m: nowDate.getMonth() + 1});
			isTomorrow = true;
		}

		if (!users.length) {
			return;
		}

		nodes = users.map(function(item) {
			item = Local.data[item.u];
			return $.e("a", {href: "#" + item.screen_name, html: getName(item)});
		});

		text = [];
		for (var i = 0, l = nodes.length; i < l; ++i) {
			text.push(nodes[i]);
			text.push(document.createTextNode(i + 2 < l ? ", " : i + 1 !== l ? " и " : ""));
		}
		text.push(document.createTextNode([
			["сегодня", "завтра"][isTomorrow],
			["празднует", "празднуют"][+(nodes.length > 1)],
			"день рождения"
		].join(" ")));

		g("birthdays").appendChild($.e("div", {"class": "menu-notify-wrap", append: [
			$.e("strong", {"class": "menu-notify", html: "Напоминание!"}),
			$.e("div", {style: "padding: 5px", append: text})
		]}));
	},

	MONTH_NAMES: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
	/*getCalendar: function () {
		if (!Friends.friends[API.userId]) {
			var callback = arguments.callee;
			Site.APIv5("friends.get", {
				fields: "photo_50,can_write_private_message,online,screen_name,bdate,sex",
				v: 5.8
			}, callback);
			return;
		}

		var friends = Friends.friends[API.userId].items,
			birthdays = {},
			parseFriend = function (friend) {
				if (!friend || !friend.bdate)
					return null;
				var d = friend.bdate.split("."); // 0 - day, 1 - month, 2 - year, 3 - user_id
				return {d: +d[0], m: +d[1], y: +d[2] || 0, u: friend.id || friend.uid};
			},
			nowDate = new Date(),
			n = {d: nowDate.getDate(), m: nowDate.getMonth() + 1, y: nowDate.getFullYear()},
			isContains = function (o) {
				return (n.d == o.d && n.m == o.m);
			},
			parent = document.createElement("div"),
			tables = document.createElement("div"),
			wrap = document.createElement("div"),
			month,
			isCorrectDate = function (d, m, y) {
				if (m === 1)
					return (y % 4) != 0 && d <= 28 || (y % 4) == 0 && d <= 29;
				return d <= [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
			},
			test;
		for (var i = 0, l = friends.length; i < l; ++i) {
			if (friends[i].bdate) {
				var f = parseFriend(friends[i]);
				if (birthdays[f.m]) {
					if (birthdays[f.m][f.d])
						birthdays[f.m][f.d].push(f.u);
					else
						birthdays[f.m][f.d] = [f.u];
				} else {
					birthdays[f.m] = {};
					birthdays[f.m][f.d] = [f.u];
				}
			}
		}
		var Y = n.y, week,
			day = function (d, m, y) {
				var p = $.e("div", {"class": "friends-calendar-day", id: "friends-calendar-" + d + "-" + m, append: $.e("div", {"class": "friends-calendar-n", html: d})}),
					u = birthdays[m + 1] && birthdays[m + 1][d], c;
				if (u && u.length)
					for (var i = 0, l = u.length; i < l; ++i) {
						console.log(u[i]);
						c = Local.data[u[i]];
						p.appendChild($.e("a", {"class": "friends-calendar-link", href: "#" + c.screen_name, append: $.e("img", {src: c.photo_50})}));
					}
				return p;
			};
		for (var M = 0; M < 12; ++M) {
			month = document.createElement("table");
			month.className = "friends-calendar";
			month.id = "friends-calendar-month-" + M;
			for (var w = 0; w <= 6; ++w) {
				week = $.e("tr");
				for (var d = 0; d < 7; ++d)
					week.appendChild($.e("td"));
				month.appendChild(week);
			}
			w = 1;
			for (var D = 1; D <= 32; ++D) {
				test = new Date(Y, M, D);
				if (!isCorrectDate(D, M, Y)) {
					if (month.rows[w + 1])
						$.elements.remove(month.rows[w + 1]);
					break;
				}
				d = test.getDay();
				month.rows[(d == 0 ? w > 0 ? w - 1 : w : w)].cells[(d == 0 ? 6 : d - 1)].appendChild(day(D, M, Y));
				if (d == 6)
					w++;
			}
			if (!month.rows[0].cells[6].innerHTML)
				$.elements.remove(month.rows[0]);
			if (!month.rows[month.rows.length - 1].cells[0].innerHTML)
				$.elements.remove(month.rows[month.rows.length - 1]);
			month.appendChild($.e("caption", {html: Friends.MONTH_NAMES[M]}))
			tables.appendChild($.e("div", {"class": "friends-calendar-table-wrap", append: month}));
		}

		var setTransform = function (node, value) {
				node.style.webkitTransform = value;
				node.style.mozTransform = value;
				node.style.msTransform = value;
				node.style.oTransform = value;
				node.style.transform = value;
			},
			touch = new Hammer(wrap),
			x = 0,
			distanceX,
			percent;
		touch.on("pan", function (event) {
			var width = $.getPosition(parent).width,
				distanceX = event.deltaX,
				percent = (distanceX * 100 / width),
				value = (x + percent);

			if (-value < 0 || -value > 11 * 100)
				value = x + (percent * .5);

			setTransform(tables, "translateX(" + value + "%)");
		});
		touch.on("panend", function (event) {
			if (event.direction !== Hammer.DIRECTION_LEFT && event.direction !== Hammer.DIRECTION_RIGHT)
				return;

			var width = $.getPosition(parent).width,
				distanceX = event.deltaX,
				percent = (distanceX * 100 / width),
				value = x + percent;

			if (-percent >= 30)
				x -= 100;
			else if (percent >= 30)
				x += 100;

			if (-x <= 0)
				x = 0;
			else if (-x > 11 * 100)
				x += 100;

			$.elements.addClass(tables, "imdialog-emotions-frame-animation");

			setTransform(tables, "translateX(" + (x) + "%)");
			setTimeout(function () {
				$.elements.removeClass(tables, "imdialog-emotions-frame-animation");
			}, 300);
		});

		setTransform(tables, "translateX(" + (x = -((n.m - 1) * 100)) + "%)");

		wrap.className = "friends-calendar-wrap selectfix";
		wrap.appendChild(tables);
		parent.appendChild(Site.getPageHeader("Календарь"));
		parent.appendChild(wrap);
		Site.append(parent);
	}*/
};
