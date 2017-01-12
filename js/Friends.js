/**
 * APIdog v6.5
 *
 * upd: -1
 */

if (!window.Photos) {
	Photos = { getToParam: function() { var to = Site.get("to"); return (to ? ["?", "&"][t || 0] + "to=" + to : ""); } };
}

var Friends = {
	List: null,
	Lists: null,
	explain: function(ownerId) {
		switch (Site.get("act")) {
			case "requests":
				return Friends.getRequests();

			case "suggestions":
				return Friends.getSuggestions();

			case "recent":
				return Friends.getRecent();

			case "mutual":
				return Friends.getMutual(ownerId);

			case "calendar":
				return Friends.getCalendar();

			case "lists":
				switch (Site.get("action")) {
					case "create":
						return Friends.showFormCreateList();

					default:
						return Friends.getLists();
				};

			default:
				ownerId = ownerId || API.userId;
//				if (Friends.friends[ownerId] && (ownerId == API.userId || !ownerId))
//					return Friends.showFriends(ownerId, Friends.friends[ownerId]);
				Site.APIv5("friends.get", {
					user_id: ownerId,
					fields: "photo_50,online,can_write_private_message,screen_name,sex",
					order: "hints",
					v: 5.8
				}, function(data) {

					if (data.error) {
						Site.Alert({text: "Ошибка! Доступ запрещен!"});
						return;
					};
					Friends.showFriends(ownerId, Site.isResponse(data), true);
				});
				if (!Friends.Lists)
					Site.APIv5("friends.getLists", {
						v: 5.11
					}, function(data) {Friends.Lists = data.response});
		}
	},
	friends: {},
	Cities: [],
	getTabs: function(ownerId) {
		var user_id = ownerId != API.userId ? ownerId : "",
			has = Friends.friends[ownerId],
			count = has ? " <i class=count>" + Friends.friends[ownerId].count + "</i>" : "",
			count_online = has ? " <i class=count>" + (function(a, e) {
				for (var b = 0, c = 0, d = a.length; b < d; ++b)
					if (a[b][e])
						c++;
				return c;
			})(Friends.friends[ownerId].items, "online") + "</i>" : "",
			to = Photos.getToParam(1),
			tabs = [
				["friends" + (user_id ? "?id=" + user_id : "") + Photos.getToParam(0), Lang.get("friends.tabs_all") + count],
				["friends?section=online" + to + (user_id ? "&id=" + user_id : ""), Lang.get("friends.tabs_online") + (count_online || "")]
			];
		if (!to) {
			if (ownerId == API.userId) {
				tabs.push(["friends?act=requests", Lang.get("friends.tabs_requests") + " " + (Site.Counters && Site.Counters.friends || "")]);
				tabs.push(["friends?act=lists", Lang.get("friends.tabs_lists")]);
				tabs.push(["friends?act=suggestions", Lang.get("friends.tabs_suggestions")]);
			} else
				tabs.push(["friends?act=mutual&id=" + ownerId  , Lang.get("friends.tabs_mutual")]);
		}
		return Site.CreateTabPanel(tabs);
	},
	showFriends: function(user_id, response, save) {
		if (save == true && user_id == API.userId)
			Friends.friends[user_id] = response;
		if (Site.get("section") == "online") {
			var newArray = [];
			for (var i = 0, l = response.items.length; i < l; ++i) {
				if (response.items[i].online)
					newArray.push(response.items[i]);
			}
			var newResponse = {count: newArray.length, items: newArray};
			return Friends.showFriendsOnPage(user_id, newResponse, save);
		}
		if (Site.get("list")) {
			var list_id = +Site.get("list"),
				newArray = [];
			for (var i = 0, l = response.items.length; i < l; ++i) {
				if (~response.items[i].lists.indexOf(list_id))
					newArray.push(response.items[i]);
			}
			var newResponse = {count: newArray.length, items: newArray};
			return Friends.showFriendsOnPage(user_id, newResponse, false);
		}
		Friends.showFriendsOnPage(user_id, response);
	},
	showFriendsOnPage: function(user_id, response) {
		var count = response.count,
			friends = response.items,
			page = $.e("div"),
			head = $.e("div"),
			list = $.e("div"),
			list_id = +Site.get("list"),
			actions = null,
			empty = getEmptyField(Lang.get("friends.no_friends")),
			to = Photos.getToParam(1);
		if (list_id && !to)
			actions = Site.CreateDropDownMenu(Lang.get("general.actions"), {
				"Изменить": function(event) {
					Friends.editList(Site.get("list"))
				},
				"Удалить список": function(event) {
					VKConfirm(Lang.get("friends.confirm_delete_list"), function() {
						Site.API("friends.deleteList", {list_id: list_id}, function(data) {
							if (data.response) {
								Friends.Lists = null;
								window.location.hash = "#friends?act=lists";
								Site.Alert({text: Lang.get("friends.success_delete_list")});
							};
						});
					});
				}
			});
		else if (!list_id) {
			actions = $.e("span", {"class": "fr a", html: "Обновить", onclick: function(event) {
				Friends.friends[user_id] = null;
				Friends.explain(user_id);
			}});
		};
		empty.id = "friends-empty";
		head.appendChild(Site.getPageHeader(count + " " + $.textCase(count, Lang.get("friends.friend_s")), actions ? actions : false));
		head.appendChild(Friends.showSearchForm(friends));
		Local.add(friends);
		for (var i = 0, l = friends.length; i < l; ++i)
			list.appendChild(Friends.item(friends[i]));
		if (friends.length)
			$.elements.addClass(empty, "hidden");
		page.appendChild(Friends.getTabs(user_id));
		page.appendChild(head);
		page.appendChild(list);
		page.appendChild(empty);
		Site.append(page);
		Site.setHeader(Lang.get("friends.friends"));
	},
	item: function(i, options) {
		options = options || {};
		var e = $.elements.create, to = Photos.getToParam(0),
		bd = i.bdate.split("."), by = +bd[2], bm = +bm[1], bd = +bd[0], y = by ? (function(y, m, d, a, n) {
			n = new Date();
			a = n.getFullYear() - y;
			if (n.getMonth() + 1 < m || n.getMonth() + 1 === m && n.getDate() < d) {
				a--;
			};
			return a;
		})(by, bm, bd) : "",
		item = e("a", {"class": "friends-item", href: "#" + (i.screen_name || "id" + i.id), id: "friend" + i.id, append: [
			e("img", {"class": "friends-left", src: getURL(i.photo_50)}),
			e("div", {"class": "friends-right", append: [
				!to && options.add ? e("div", {"class": "friends-add btn friends-action fr", html: Lang.get("friends.add_to_friends"), onclick: (function(id) {
					return function(event) {
						$.event.cancel(event);
						var item = this.parentNode.parentNode, btn = this;
						if (btn.disabled)
							return false;
						btn.disabled = true;
						btn.innerHTML = Lang.get("friends.adding");
						Friends.addFriend(id, {
							item: item,
							button: btn
						});
						return false;
					}
				})(i.id)}) : null,
				e("div", {"class": "bold", html: Site.Escape(i.first_name + " " + i.last_name) + Site.isOnline(i)}),
				!to ? e("span", {"class": "friends-action", html: Lang.get("friends.write"), onclick: (function(id) {
					return function(event) {window.location.hash = "#im?to=" + id;$.event.cancel(event);}
				})(i.id)}) : null,
				!to && options.requests ? e("span", {
					"class": "tip",
					html: (function(a) {
						for (var b = 0, c = a.length, d= []; b < c; ++b) {
							if (a[b] != null) {
								d.push(a[b]);
							};
						};
						return d.join(", ");
					})(
						[
							i.city
								? i.city.title
								: null,

							by
								? y + " " + $.textCase(y, Lang.get("friends.years"))
								: null
						]
					)}) : null
			]})
		]});
		if (to)
			$.event.add(item, "click", function(event) {
				$.event.cancel(event);
				VKConfirm(
					Lang.get("friends.prompt_friend_will_be_added_to_chat")
						.replace(/%f/img, i.first_name)
						.replace(/%l/img, i.last_name)
						.replace(/%a/img, Lang.get("friends.prompt_friend_will_be_added_to_chat_action")[i.sex]),
				function() {
					Site.API("messages.addChatUser", {
						chat_id: Site.get("to"),
						user_id: i.id
					}, function(data) {
						if (data.response) {
							Site.Alert({
								text: Lang.get("friends.info_friend_added_to_chat")
									.replace(/%f/img, i.first_name)
									.replace(/%l/img, i.last_name)
									.replace(/%a/img, Lang.get("friends.prompt_friend_will_be_added_to_chat_action")[i.sex])
							});
						} else {
							Site.Alert({
								text: Lang.get("friends.error_friend_error_adding_to_chat")
									.replace(/%f/img, i.first_name)
									.replace(/%a/img, Lang.get("friends.error_friend_error_adding_to_chat_action")[i.sex])
									.replace(/%w/img, Lang.get("friends.error_friend_error_adding_to_chat_left")[i.sex])
							});
						}
						window.location.hash = "#im?to=-" + Site.get("to");
					});
				});
				return false;
			});

		return item;
	},
	addFriend: function(user_id, options) {
		Site.API("friends.add", {
			user_id: user_id
		}, function(data) {
			if (Site.isResponse(data)) {
				if (options && options.button)
					options.button.innerHTML = (Lang.get("friends.added_sex")[Local.Users[user_id] && Local.Users[user_id].sex || 0]) + Lang.get("friends._in_friends");
			}
		});
	},
	showSearchForm: function(friends) {
		return Site.CreateInlineForm({
			type: "search",
			name: "q",
			title: Lang.get("friends.search"),
			autocomplete: "off",
			placeholder: Lang.get("friends.search"),
			onkeyup: (function(friends) {
				return function(event) {
					Friends.filter(friends, $.trim(this.value));
				};
			})(friends),
			onsubmit: (function(friends) {
				return function(event) {
					Friends.filter(friends, $.trim(this.q.value));
					$.event.cancel(event);
					return false;
				};
			})(friends)
		});
	},
	filter: function(friends, q) {
		var found = [];
		if (q.length > 0)
			for (var i = 0, l = friends.length; i < l; ++i) {
				if (
					new RegExp(q, "ig").test(friends[i].first_name) ||
					new RegExp(q, "ig").test(friends[i].last_name)
				)
					found.push(friends[i].id);
			}
		else
			found = (function(f) {
				for (var a = 0, b = f.length, c = []; a < b; ++a)
					c.push(f[a].id);
				return c;
			})(friends, []);
		for (var i = 0, l = friends.length; i < l; ++i)
			if (~found.indexOf(friends[i].id))
				$.elements.removeClass($.element("friend" + friends[i].id), "friends-hidden");
			else
				$.elements.addClass($.element("friend" + friends[i].id), "friends-hidden");
		if (!found.length)
			$.elements.removeClass($.element("friends-empty"), "hidden");
		else
			$.elements.addClass($.element("friends-empty"), "hidden");
	},
	getRequests: function() {
		Site.API("execute", {
			code: 'var f=API.friends.getRequests({extended:1,need_mutual:1,v:5.8%o});return {requests:f,users:API.users.get({user_ids:f.items@.user_id,fields:"photo_50,city,bdate,screen_name,online,can_write_private_message",v:5.8})};'
				.replace(/%o/img, Site.get("out") ? ",out:1" : "")
		}, Friends.showRequests);
	},
	showRequests: function(data) {
		data = Site.isResponse(data);
		Local.add(data.users);
		data = data.requests;
		var parent = $.e("div");
		parent.appendChild(Friends.getTabs(API.userId));
		parent.appendChild(Site.CreateTabPanel([
			["friends?act=requests", "Входящие"],
			["friends?act=requests&out=1", "Исходящие"]
		]));
		parent.appendChild(
			Site.getPageHeader(
				data.count + " " + $.TextCase(data.count, Lang.get("friends.requests")) + Lang.get("friends._in_friends"),
				!Site.get("out") ? Site.CreateDropDownMenu(Lang.get("general.actions"), {
					"Отменить все заявки": function(){
						Site.API("friends.deleteAllRequests", {}, function(data) {
							data = Site.isResponse(data);
							if(data === 1)
								Site.Go(window.location.hash.replace(/\#/igm,""));
							else
								Site.Alert({
									text: "Странно.. Что-то пошло не так.."
								});
						});
					}
				}) : null
			)
		);
		data = data.items;
		if (data.length)
			for (var i = 0; i < data.length; ++i) {
				var u = Local.Users[data[i].user_id];
				u.message = data[i].message;
				parent.appendChild(Friends.item(u, {
					requests: true,
					add: !Site.get("out")
				}));
			}
		else
			parent.appendChild(getEmptyField("Заявок нет"));
		Site.setHeader(Lang.get("friends.requests_in_friends"));
		Site.append(parent);
	},
	getLists: function() {
		if (Friends.Lists)
			return Friends.showLists(Friends.Lists);
		Site.APIv5("friends.getLists", {v: 5.11}, function(data) {
			data = Site.isResponse(data);
			if (data.error) {
				Site.Alert({text: "Ошибка.."});
				return;
			}
			Friends.Lists = data;
			Friends.showLists(data);
		});
	},
	showLists: function(data) {
		Friends.Lists = data;
		var parent = $.e("div"),
			list = $.e("div");
		list.appendChild($.elements.create("a", {
			href: "#friends?act=lists&action=create",
			"class": "list-item",
			html: "<i class=\"list-icon list-icon-add\"></i> " + Lang.get("friends.create_list")
		}));
		data = data.items;
		if (data.length)
			for (var i = 0, l = data.length; i < l; ++i)
				list.appendChild($.elements.create("a", {
					href: "#friends?list=" + data[i].id,
					html: data[i].name.safe(),
					"class": "list-item"
				}));
		else
			list.appendChild(getEmptyField(Lang.get("friends.no_lists")));
		parent.appendChild(Friends.getTabs(API.userId));
		parent.appendChild(Site.getPageHeader(Lang.get("friends.lists_of_friends")));
		parent.appendChild(list);
		Site.setHeader(Lang.get("friends.lists_of_friends"));
		Site.append(parent);
	},
	getSuggestions: function(offset) {
		Site.APIv5("friends.getSuggestions", {
			offset: offset || 0,
			count: 40,
			filter: "mutual",
			fields: "photo_50,online,screen_name,sex,can_write_private_message",
			v: 5.11
		}, function(data) {
			data = Site.isResponse(data);
			Friends.showSuggestitions(data.items, !!++offset, +offset || 0)
		});
	},
	showSuggestitions: function(data, isExists, offset) {
		var nextfx = function(event) {
			$.elements.addClass(this, "msg-loader");
			this.innerHTML = "";
			Friends.getSuggestions(offset + 40);
		};
		if (!isExists) {
			var parent = $.e("div"),
				list = $.e("div");
			parent.appendChild(Friends.getTabs(API.userId));
			parent.appendChild(Site.getPageHeader(Lang.get("friends.suggestion_friends")));
			for (var i = 0, l = data.length; i < l; ++i)
				list.appendChild(Friends.item(data[i], {add: true}));
			var next = Site.CreateNextButton({link: window.location.hash, text: Lang.get("friends.yet_another")});
			$.event.add(next, "click", nextfx);
			list.id = "friends-suggestitions";
			list.appendChild(next);
			parent.appendChild(list);
			Site.setHeader(Lang.get("friends.suggestion_friends"), {link: "friends"});
			Site.append(parent);
		} else {
			var list = $.element("friends-suggestitions");
			$.elements.remove(list.lastChild);
			for (var i = 0, l = data.length; i < l; ++i)
				list.appendChild(Friends.item(data[i], {add: true}));
			var next = Site.CreateNextButton({link: window.location.hash, text: "Ещё.."});
			$.event.add(next, "click", nextfx);
			list.appendChild(next);
		}
	},
	getMutual: function(owner_id) {
		Site.API("execute",{
			code:"return API.users.get({user_ids:API.friends.getMutual({target_uid:" + owner_id + ",v:5.11}),fields:\"photo_50,online,can_write_private_message,screen_name\"});"
		}, function(data) {
			data = Site.isResponse(data);
			var parent = $.e("div");
			parent.appendChild(Friends.getTabs(owner_id));
			parent.appendChild(Site.getPageHeader(data.length + " " + $.TextCase(data.length, Lang.get("friends.mutual_friends"))));
			for (var i = 0, l = data; i < data.length; ++i)
				parent.appendChild(Friends.item(data[i]));
			Site.setHeader(Lang.get("friends.mutual_friends_head"), {link: "friends?id=" + owner_id});
			Site.append(parent);
		});
	},
	getRecent: function() {
		Site.API("execute", {
			code:"return API.users.get({user_ids:API.friends.getRecent({\"count\":70}),fields:\"photo_50,online,can_write_private_message,screen_name\"});",
			v: 5.11
		}, function(data) {
			data = Site.isResponse(data);
			var parent = $.e("div");
			parent.appendChild(Friends.getTabs(API.userId));
			parent.appendChild(Site.getPageHeader(Lang.get("friends.recent_friends")));
			for (var i = 0; i < data.length; ++i)
				parent.appendChild(Friends.item(data[i]));
			Site.setHeader(Lang.get("friends.recent_friends"), {link: "#friends"});
			Site.append(parent);
		});
	},
	showFormCreateList: function() {
		var thisFX = arguments.callee;
		if (!Friends.friends[API.userId]) {
			Site.APIv5("friends.get", {
				fields: "photo_50,online,can_write_private_message,screen_name,sex",
				order: "hints",
				v: 5.8
			}, function(data) {
				data = Site.isResponse(data);
				if (!data) {
					Site.Alert({text: "Странно, ошибка.."});
					return;
				}
				Friends.friends[API.userId] = data;
				return thisFX();
			});
			return;
		}
		var page = $.e("div"),
			creator = $.e("form"),
			list = $.e("form"),
			friends = Friends.friends[API.userId].items,
			e = $.elements.create;
		creator.className = "sf-wrap";
		creator.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("friends.title_of_list")}));
		creator.appendChild(e("input", {
			type: "text",
			name: "title"
		}));
		creator.appendChild(e("input", {type: "submit", id: "friends-create-btn", value: Lang.get("friends.create_list"), disabled: true}));
		creator.onsubmit = function(event) {
			var name = this.title.value,
				user_ids = (function(e, user_ids) {
					for (var i = 0, l = e.length; i < l; ++i)
						if (e[i].checked)
							user_ids.push(e[i].value);
					return user_ids.join(",");
				})(list.elements["items[]"], []);
			Site.APIv5("friends.addList", {name: name, user_ids: user_ids, v: 5.11}, function(data) {
				if ((data = Site.isResponse(data)) && data.list_id) {
					window.location.hash = "#friends?list=" + (data.list_id);
					delete Friends.friends[API.userId];
				}
			});
			$.event.cancel(event);
			return false;
		};
		for (var i = 0, l = friends.length; i < l; ++i) {
			list.appendChild(e("label", {"class": "miniprofiles-item", append: [
				e("div", {"class": "_checkbox fr"}),
				e("img", {src: getURL(friends[i].photo_50), "class": "miniprofiles-left"}),
				e("input", {type: "checkbox", name: "items[]", "class": "multiple_friends hidden", value: friends[i].id}),
				e("div", {"class": "miniprofiles-right", append: [e("strong", {
					"class": "a",
					html: friends[i].first_name + " " + friends[i].last_name + Site.isOnline(friends[i])
				})]})
			], onclick: function(event) {
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
	getList: function(list_id) {
		for (var i = 0, l = Friends.Lists.items.length; i < l; ++i)
			if (Friends.Lists.items[i].id == list_id)
				return Friends.Lists.items[i];
		return null;
	},
	editList: function(listId)
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
			function(data)
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
		var parent = $.e("div"),
			list = $.e("form"),
			friends = Friends.friends[API.userId].items,
			e = $.elements.create;
		parent.appendChild(Friends.getTabs());
		parent.appendChild(Site.getPageHeader(Lang.get("friends.editing_title")));
		parent.appendChild(Site.CreateInlineForm({
			name: "title",
			value: Friends.getList(listId).name,
			placeholder: "Введите название",
			onsubmit: function(event) {
				event.preventDefault();
				var name = $.trim(this.title.value);
				if (!name)
				{
					Site.Alert({text: Lang.get("friends.enter_title")});
					return false;
				};
				var userIds = (function(e, userIds)
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
				}, function(data) {
					if (data.response) {
						Friends.Lists = (function(l,n,i,d,q,f,k,c){for(c=l[d].length;k<c;++k)if(l[d][k][q]==i){l[d][k][f]=n;break;};return l;})(Friends.Lists,name,listId,"items","id","name",0,null);
						var f = Friends.friends[API.userId].items;
						f.forEach(function(item) {
							if (~userIds.indexOf(item.id)) {
								if (item.lists) {
									if (!~item.lists.indexOf(listId))
										item.lists.push(listId);
								} else
									item.lists = [listId];
							} else {
								if (item.lists && ~item.lists.indexOf(listId)) {
									item.lists = (function(i, l, n) {
										l.forEach(function(r) {
											if (r != i)
												n.push(r);
										});
										return n;
									})(listId, item.lists, []);
								};
							};
						});
						Site.Go("#friends?list=" + listId);
					}
				})
				return false;
			},
			title: Lang.get("friends.save")
		}));
		var ttchb, hasInList;
		for (var i = 0, l = friends.length; i < l; ++i) {
			hasInList = friends[i].lists && ~friends[i].lists.indexOf(listId);
			list.appendChild(e("label", {"class": "miniprofiles-item" + (hasInList ? " mp-checked" : ""), append: [
				e("div", {"class": "_checkbox fr"}),
				e("img", {src: getURL(friends[i].photo_50), "class": "miniprofiles-left"}),
				ttchb = e("input", {type: "checkbox", name: "items[]", "class": "multiple_friends hidden", value: friends[i].id}),
				e("div", {"class": "miniprofiles-right", append: e("strong", {
					"class": "a",
					html: getName(friends[i])
				})})
			], onclick: function(event) {
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
		Site.setHeader(Lang.get("friends.editing_title_head"), {fx: function() {Site.Go(window.location.hash);}})
	},

	// v6.3

	showBirthdays: function(friends) {
		var birthdays = [],
			parseFriend = function(friend) {
				if (!friend || !friend.bdate)
					return {};
				var d = friend.bdate.split("."); // 0 - day, 1 - month, 2 - year, 3 - user_id
				return {d: +d[0], m: +d[1], y: +d[2] || 0, u: friend.id || friend.uid};
			},
			nowDate = new Date(),
			n = {d: nowDate.getDate(), m: nowDate.getMonth() + 1, y: nowDate.getFullYear()},
			isContains = function(o) {
				return (n.d == o.d && n.m == o.m);
			};
		for (var i = 0, l = friends.length; i < l; ++i) {
			if (friends[i].bdate)
				birthdays.push(parseFriend(friends[i]));
		}
		// today

		var users = [], state = 0;
		for (var i = 0, l = birthdays.length; i < l; ++i) {
			if (isContains(birthdays[i]))
				users.push(birthdays[i].u);
		}

		// if not today, get tomorrow
		if (!users.length) {
			n = new Date(n.y, n.m - 1, n.d);
			n.setDate(n.getDate() + 1);
			n = {d: n.getDate(), m: n.getMonth() + 1, y: n.getFullYear()};

			for (var i = 0, l = birthdays.length; i < l; ++i) {
				if (isContains(birthdays[i]))
					users.push(birthdays[i].u);
			}
			state = 1;
		};
		if (!users.length)
			return;
		var info = [], list = [], user, s = [];

		for (var i = 0, l = users.length; i < l; ++i) {
			user = Local.Users[users[i]];
			list.push($.e("a", {href: "#" + user.screen_name, html: user.first_name + " " + user.last_name}));
		}
		var userlist = [];
		for (var i = 0, l = list.length; i < l; ++i) {
			userlist.push(list[i]);

			userlist.push(document.createTextNode(i + 2 < l ? ", " : i + 1 != l ? " и " : ""));
		}
		userlist.push(document.createTextNode([
			"",
			["сегодня", "завтра"][state],
			["празднует", "празднуют"][+(list.length > 1)],
			"день рождения"
		].join(" ")));

		$.element("birthdays").appendChild($.e("div", {"class": "menu-notify-wrap", append: [
			$.e("strong", {"class": "menu-notify", html: "Напоминание!"}),
			$.e("div", {style: "padding: 5px", append: userlist})
		]}));
	},

	// А тут старички. Здесь находится самый-самый первый код проекта.. Еще от ~28-29 мая 2013 года.. А v6.0 вышла
	// на публику только 1 июня.. Этот код ни разу не переписывался..
	// v6.0 beta
	DeleteFriendFromList:function(uid,lid){
		var k=(function(a,b,c){for(;c<a.length;++c)if(a[c].uid==b)return b})(Friends.List,uid,0);
		var lists=Friends.List[k].lists;
		for(var i=0;i<lists.length;++i)
			if(lists[i]==lid)
				delete lists[i];
		Friends.List[k].lists=lists;
		lists=lists.join(",");
		Site.API("friends.edit",{
			user_id:uid,
			list_ids:lists
		},function(data){
			data=Site.isResponse(data);
			if(data===1)
				$.element("friend"+uid).style.opacity=0.5;
		});
	},
	Add:function(uid,cb){
		Site.API("friends.add",{user_id:uid},cb?cb:function(data){
			data=Site.isResponse(data);
			var elem=$.element("friend"+uid+"_actions"),
				msg;
			switch(data){
				case 1:msg="Заявка отправлена";break;
				case 2:msg="Заявка одобрена";break;
				case 4:msg="Повторная заявка";break;
			}
			elem.innerHTML="<span class=\"tip\">"+msg+"<\/span>";
		});
		Friends.ClearCache();
	},
	Delete:function(uid,cb){
		Site.API("friends.delete",{user_id:uid},cb?cb:function(data){
			data=Site.isResponse(data);
			var elem=$.element("friend"+uid+"_actions"),
				msg;
			switch(data){
				case 1:msg="Пользователь удален из друзей";break;
				case 2:msg="Заявка отклонена";break;
				case 3:msg="Рекомендация удалена";break;
			}
			elem.innerHTML="<span class=\"tip\">"+msg+"<\/span>";
		});
		Friends.ClearCache();
	},
	ClearCache: function() {
		Friends.List = [];
		Friends.Lists = [];
	},
	MONTH_NAMES: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
	getCalendar: function() {
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
			parseFriend = function(friend) {
				if (!friend || !friend.bdate)
					return null;
				var d = friend.bdate.split("."); // 0 - day, 1 - month, 2 - year, 3 - user_id
				return {d: +d[0], m: +d[1], y: +d[2] || 0, u: friend.id || friend.uid};
			},
			nowDate = new Date(),
			n = {d: nowDate.getDate(), m: nowDate.getMonth() + 1, y: nowDate.getFullYear()},
			isContains = function(o) {
				return (n.d == o.d && n.m == o.m);
			},
			parent = $.e("div"),
			tables = $.e("div"),
			wrap = $.e("div"),
			month,
			isCorrectDate = function(d, m, y) {
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
			day = function(d, m, y) {
				var p = $.e("div", {"class": "friends-calendar-day", id: "friends-calendar-" + d + "-" + m, append: $.e("div", {"class": "friends-calendar-n", html: d})}),
					u = birthdays[m + 1] && birthdays[m + 1][d], c;
				if (u && u.length)
					for (var i = 0, l = u.length; i < l; ++i) {
						console.log(u[i]);
						c = Local.Users[u[i]];
						p.appendChild($.e("a", {"class": "friends-calendar-link", href: "#" + c.screen_name, append: $.e("img", {src: c.photo_50})}));
					}
				return p;
			};
		for (var M = 0; M < 12; ++M) {
			month = $.e("table");
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

		var setTransform = function(node, value) {
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
		touch.on("pan", function(event) {
			var width = $.getPosition(parent).width,
					distanceX = event.deltaX,
					percent = (distanceX * 100 / width),
					value = (x + percent);

				if (-value < 0 || -value > 11 * 100)
					value = x + (percent * .5);

				setTransform(tables, "translateX(" + value + "%)");
		});
		touch.on("panend", function(event) {
			if (event.direction != Hammer.DIRECTION_LEFT && event.direction != Hammer.DIRECTION_RIGHT)
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
			setTimeout(function() {
				$.elements.removeClass(tables, "imdialog-emotions-frame-animation");
			}, 300);
		});

		setTransform(tables, "translateX(" + (x = -((n.m - 1) * 100)) + "%)");

		wrap.className = "friends-calendar-wrap selectfix";
		wrap.appendChild(tables);
		parent.appendChild(Site.getPageHeader("Календарь"));
		parent.appendChild(wrap);
		Site.append(parent);
	}
};
