var Groups = {

	RequestPage: function() {
		switch (Site.get("act")) {
			case "invites":
				return Groups.invites.page().then(Groups.invites.load).then(Groups.invites.show);

			case "search":
				return Groups.search.page().then(Groups.search.load).then(Groups.search.show);

			case "recommends":
				Groups.recommendations.page().then(Groups.recommendations.load).then(Groups.recommendations.show);
				break;

// TODO
			case "create":
				Groups.showCreateForm();
				break;

			case "manage":
			case "stat":
			case "blacklist":
			case "requests":
				alert("Not implemented yet");
				break;

			default:
				Site.Loader();
				var userId = parseInt(Site.get("userId") || API.userId);
				if (Groups.groupsList[userId]) {
					Groups.showList(userId, Groups.groupsList[userId]);
					return;
				}

				return api("groups.get", {
					user_id: userId,
					extended: 1,
					fields: "members_count,verified,city",
					v: 5.19
				}).then(function(data) {
					Groups.showList(userId, data);
				});
		}
	},

	getTabs: function(ownerId) {
		var list = Groups.groupsList[ownerId],
			tabs = [
				[API.userId === ownerId ? "groups" : "groups?userId=" + ownerId, Lang.get("groups.tabAll"), list ? list.count : 0]
			],
			adminCount = 0;

		if (list) {
			for (var i = 0, item; item = list.items[i]; ++i) {
				if (ownerId === API.userId && item.is_admin) {
					adminCount++;
				}
			}
		}

		if (ownerId === API.userId) {
			if (adminCount > 0) {
				tabs.push(["groups?section=admin", Lang.get("groups.tabManage"), adminCount]);
			}

			if (Site.counters && Site.counters.groups > 0) {
				tabs.push(["groups?act=invites", Lang.get("groups.tabInvites"), Site.counters.groups]);
			}

			tabs.push(["groups?act=recommends", Lang.get("groups.tabSuggestions")]);
			tabs.push(["groups?act=search", Lang.get("groups.tabSearch")]);
		}

		return Site.getTabPanel(tabs);
	},

	groupsList: {},

	/**
	 * Show list of groups
	 * @param {int} ownerId
	 * @param {{count: int, items: object[]}} list
	 */
	showList: function(ownerId, list){
		Groups.groupsList[ownerId] = list;

		var wrap = $.e("div"),

			adminCount = 0,
			onlyAdmin = Site.get("section") === "admin",

			realList = Object.assign({}, list),

			LgUsers = Lang.get("groups.members_followers"),
			LgFollowers = Lang.get("groups.members_members");

		if (onlyAdmin) {
			realList.items = list.items.filter(function(group) {
				return group.is_admin;
			});
			realList.count = realList.length;
		}

		var sl = new SmartList({
			data: realList,
			getItemListNode: SmartList.getDefaultItemListNode,
			countPerPage: 50,
			needSearchPanel: true,

			optionsItemListCreator: {
				textContentBold: true,

				remove: {
					filter: function(item) {
						return item.is_member;
					},

					onClick: function(item) {
						Groups.leave(item, function() {
							sl.remove(item);
						});
					},

					label: {
						content: Lang.get("groups.actionLeave"),
						width: 190
					}
				},

				getSubtitle: function(c) {
					return (c.members_count ? formatNumber(c.members_count) + " " + $.textCase(c.members_count, c.type === "page" ? LgFollowers : LgUsers) : "");
				},
			},


			filter: SmartList.getDefaultSearchFilter({ fields: ["name"] })
		});

		window.onScrollCallback = function(event) {
			event.needLoading && sl.showNext();
		};

		for (var i = 0, item; item = list.items[i]; ++i) {
			if (ownerId === API.userId && item.is_admin) {
				adminCount++;
			}
		}

		var count = !onlyAdmin ? list.count : adminCount;

		wrap.appendChild(Groups.getTabs(ownerId));
		wrap.appendChild(Site.getPageHeader(
			count + " " + $.textCase(count, ["группа", "группы", "групп"]),
			ownerId === API.userId ? $.e("a", {"class": "fr", onclick: Groups.showCreateForm, html: "Создать группу"}) : null
		));
		wrap.appendChild(sl.getNode());
		Site.setHeader("Список групп");
		Site.append(wrap);
	},

	Item: function(c, opts) {
		var groupId = c.gid || c.id,
			current = $.e("a", {
				href: "#" + c.screen_name,
				"class": "groups-item",
				id: "group_" + groupId
			});
		Local.data[-groupId] = c;
		var type = {page: "Публичная страница", group: "Группа", event: "Событие"}[c.type],
			users = c.type === "page" ? ["подписчик", "подписчика", "подписчиков"] : ["участник", "участника", "участников"],
			members = c.members_count, right;


		current.appendChild($.e("img", {src: getURL(c.photo || c.photo_50), "class": "groups-left"}));
		current.appendChild(right = $.e("div", {"class": "groups-right", append: [
			$.e("strong", {html: c.name.safe()}),
			$.e("div", {"class": "tip", html: type}),
			$.e("div", {"class": "tip", html: (members ? formatNumber(members) + " " + $.textCase(members, users) : "")})
		]}));

		if (opts && opts.request) {
			var wrapForButtons,
				fastJoin = function(event) {
					$.event.cancel(event);
					Groups.join(groupId, function() {
						$.elements.clearChild(wrapForButtons).appendChild($.e("span", {"class": "tip", html: Lang.get("groups.requests_join_success")}))
					});
				},
				fastDecline = function (event) {
					$.event.cancel(event);
					Groups.leave(groupId, function() {
						$.elements.clearChild(wrapForButtons).appendChild($.e("span", {"class": "tip", html: Lang.get("groups.requests_decline")}))
					});
				};

			var user = Local.data[c.invited_by];
			right.appendChild($.e("div", {"class": "tip", append: [
				$.e("span", {html: "Вас приглашает "}),
				$.e("a", {href: "#" + user.screen_name, html: getName(user)})
			]}));

			right.appendChild(wrapForButtons = $.e("div", {append: [
				$.e("input", {type: "button", value: "Принять", onclick: fastJoin}),
				document.createTextNode(" "),
				$.e("input", {type: "button", value: "Отклонить", onclick: fastDecline})
			]}));
		}

		return current;
	},

	showCreateForm: function () {
		var e = $.e,
			form = e("div", {"class": "sf-wrap"}),
			grouptype = (function (tiles, d) {
				for (var val in tiles)
					d.push(e("option", {value: val, html: tiles[val]}));
				return d;
			})(Lang.get("groups.create_type_values"), []),
			groupsubtype = (function (tiles, d) {
				for (var i = 0, l = tiles.length; i < l; ++i)
					d.push(e("option", {value: i + 1, html: tiles[i]}));
				return d;
			})(Lang.get("groups.create_subtype_values"), []),

			title, description, type, subtypegroup;

		form.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("groups.create_title")}));
		form.appendChild(title = e("input", {type: "text", name: "title", required: true}));
		form.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("groups.create_description")}));
		form.appendChild(description = e("textarea", {type: "text", name: "description"}));
		form.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("groups.create_type")}));
		form.appendChild(type = e("select", {name: "typegroup", append: grouptype, onchange: function (event) {
			if (this.options[this.selectedIndex].value == "public")
				$.elements.removeClass($.element("create-group-public"), "hidden");
			else
				$.elements.addClass($.element("create-group-public"), "hidden");
		}}));
		form.appendChild(e("div", {"class": "hidden", id: "create-group-public", append: [
			e("div", {"class": "tip tip-form", html: Lang.get("groups.create_subtype")}),
			subtypegroup = e("select", {name: "subtypegroup", append: groupsubtype})
		]}));

		var modal = new Modal({
			title: Lang.get("groups.creating"),
			content: form,
			footer: [
				{
					name: "create",
					title: Lang.get("groups.create"),
					onclick: function () {
						var _title = $.trim(title.value),
							_description = $.trim(description.value),
							_type = type.options[type.selectedIndex].value,
							_subtype = _type != "public" ? "" : subtypegroup.options[subtypegroup.selectedIndex].value;

						if (!_title) {
							Site.Alert({text: Lang.get("groups.create_enter_title")});
							title.focus();
							return false;
						};

						Site.APIv5("groups.create", {
							title: _title,
							description: _description,
							type: _type,
							subtype: _subtype,
							v: 5.24
						}, function (data) {
							data = Site.isResponse(data);

							if (!data)
								return;

							modal.close();
							window.location.hash = "#club" + data.id;
						});
					}
				},
				{
					name: "cancel",
					title: Lang.get("general.cancel"),
					onclick: function () {
						modal.close();
					}
				}
			]
		}).show();
	},


	/**
	 *
	 * @param {User} group
	 * @param {VkList} wall
	 */
	display: function(group, wall) {
		var wrap = $.e("div"),
			counters = group.counters,
			groupId = group.id,
			nodeInfo = $.e("div"),
			buttons = [],
			e = $.e,

			isActive = !group.deactivated,

			infoRow = function(name, value, format) {
				return e("div", {"class": "group-info-item", append: [
					e("div", {"class": "group-info-name", html: name}),
					e("div", {"class": "group-info-value", html: typeof value === "string"
						? format
							? Site.toHTML(value)
							: value
						: "",
						append: typeof value === "string" ? [] : [value]
					})
				]});
			},

			counterRow = function(links) {
				var nodeMedia = $.e("div", {"class": "grid-links-wrap"});
				for (var i = 0, k, isLink; k = links[i]; ++i) {
					if (!k.count) {
						continue;
					}

					isLink = typeof k.link === "string";

					nodeMedia.appendChild(e(isLink ? "a" : "div", {
						"class": "grid-links-item a",
						href: isLink ? "#" + k.link : null,
						onclick: !isLink ? k.link : null,
						append: [
							k.count > 0
								? e("strong", {
									"class": "grid-links-count",
									html: parseInt(k.count).toK()
								})
								: k.icon
								? e("div", {"class": "i i18 " + k.icon})
								: null,
							e("div", {
								"class": "grid-links-label cliptextfix",
								html: k.label, //k.count >= 0 ? $.textCase(k.count, Lang.get("groups." + k.label)) : Lang.get("groups." + k.label)
							})
						]
					}));
				}
				return nodeMedia;
			},

			onMemberStateChange = function(newState) {
				group.is_member = newState;

				var s = this;
				//noinspection JSCheckFunctionSignatures
				this.parentNode.insertBefore(getJoinLeaveButton(), s);
				//noinspection JSCheckFunctionSignatures
				$.elements.remove(s);
			},

			getJoinLeaveButton = function() {
				var b = null;
				b = group.is_member
					? $.e("input", {
						type: "button",
						value: (group.type === "page" ? "Отписаться" : "Выйти из группы"),
						onclick: Groups.leave.bind(null, group, onMemberStateChange.bind(b, false))
					})

					: $.e("input", {
						type: "button",
						value: (group.is_closed ? "Подать заявку" : (group.type === "page" ? "Подписаться" : "Вступить")),
						onclick: Groups.join.bind(null, group, onMemberStateChange.bind(b, true))
					});
				return b;
			},
			location = [];


		group.country && group.country.title && location.push(group.country.title);
		group.city && group.city.title && location.push(group.city.title);

		buttons.push(getJoinLeaveButton());

		wrap.appendChild(Groups.getCover(group));




		wrap.appendChild(e("div", {
			"class": "profile-info",
			append: [
				e("div", {"class": "profile-right", append: [
					e("div", {"class": "profile-name",
						html: group.name.safe() + Site.isVerify(group)
					}),

					Groups.getStatusNode(group),

					e("div", {"class": "tip", html: location.join(", ")}),
				]}),
				e("div", {
					"class": "profile-left",
					append: e("a", { href: "#photos-" + groupId + "_-6", append: lz(getURL(group.photo_100 || group.photo_50), 80, 80)})
				})
			]
		}));

// А этот кусок кода писала лично Надя Иванова :3
		if (group.ban_info) {
			nodeInfo.appendChild($.e("div",{"class": "block-error", style: "margin: 4px 10px 8px", append: [
				$.e("strong", {html: Lang.get("groups.pageBlacklistedDescription")}),
				$.e("div", {append:[
					$.e("strong", {html: Lang.get("groups.pageBlacklistedEndDate")}),
					$.e("span", {html: group.ban_info.end_date ? getDate (group.ban_info.end_date) : Lang.get("groups.pageBlacklistedForever")})
				]}),
				group.ban_info.comment ? $.e("div", {append: [
					$.e("strong", {html: Lang.get("groups.pageBlacklistedComment")}),
					$.e("div", {html: group.ban_info.comment.safe()})
				]}) : null
			]}));
		}
// конец
		if (isActive) {
			nodeInfo.appendChild(Site.getPageHeader(Lang.get("groups.pageInfoTitle")));

			if (group.description) {
				nodeInfo.appendChild(infoRow(Lang.get("groups.pageInfoDescription"), group.description, true));
			}

			if (group.site) {
				nodeInfo.appendChild(infoRow(Lang.get("groups.pageInfoSite"), group.site, true));
			}

			if (group.start_date) {
				if (group.type === "event") {
					nodeInfo.appendChild(infoRow(Lang.get("groups.pageInfoDateStart"), getDate(group.start_date, APIDOG_DATE_FORMAT_FULL)));
				} else {
					try {
						nodeInfo.appendChild(infoRow(Lang.get("groups.pageInfoDateCreated"), (function(a) {
							var b = /(\d{4})(\d{2})(\d{2})/img.exec(a);
							return getDate(new Date(b[1], b[2] - 1, b[3]) / 1000, APIDOG_DATE_FORMAT_FULL);
						})(group.start_date) ));
					} catch (e) {}
				}
			}

			if (group.finish_date) {
				nodeInfo.appendChild(infoRow(Lang.get("groups.pageInfoDateEnd"), getDate(group.finish_date, APIDOG_DATE_FORMAT_FULL)));
			}

			if (group.place) {
				group.place.title = group.place.title || Lang.get("groups.pageInfoUnknownPlace");

				//noinspection JSValidateTypes
				/** @var {Geo} place */
				var place = {place: group.place, coordinates: group.place.latitude + " " + group.place.longitude};

				var map = Wall.getGeoAttachment(place, false);
				nodeInfo.appendChild(map);
			}

			if (group.wiki_page) {
				nodeInfo.appendChild(Site.createTopButton({
					link: "pages?oid=-" + groupId + "&p=" + encodeURIComponent(group.wiki_page),
					title: group.wiki_page
				}));
			}

			var links = [
				{
					link: "search?group_id=" + groupId,
					label: "Участники",
					count: group.members_count
				},
				{
					link: Groups.showContacts.bind(null, group.contacts),
					label: "Контакты",
					count: group.contacts && group.contacts.length || 0
				},
				{
					link: Groups.showLinks.bind(null, group.links),
					label: "Ссылки",
					count: group.links && group.links.length
				},
				{
					link: "board" + groupId,
					label: "Обсуждения",
					count: counters && counters.topics || 0
				},
				{
					link: "photos-" + groupId,
					label: "Альбомы",
					count: counters && counters.albums
				},
				{
					link: "videos-" + groupId,
					label: "Видеозаписи",
					count: counters && counters.videos
				},
				{
					link: "audio?ownerId=-" + groupId,
					label: "Аудиозаписи",
					count: counters && counters.audios
				},
				{
					link: "docs-" + groupId,
					label: "Документы",
					count: counters && counters.docs
				}
			];

			if (group.is_admin) {
				links.push({link: "groups?act=manage&groupId=" + groupId, label: "Управление", count: -1});
				links.push({link: "groups?act=blacklist&groupId=" + groupId, label: "Черный список", count: -1});
				links.push({link: "groups?act=stat&groupId=" + groupId, label: "Статистика", count: -1});
				if (group.r > 0) {
					links.push({link: "groups?act=requests&groupId=" + groupId, label: "Заявки на вступление в группу", count: group.r});
				}
			}

			links.push({link: "feed?act=search&ownerId=-" + groupId, label: "Поиск по стене", count: -1});
			nodeInfo.appendChild(Site.getPageHeader("Группа"));
			nodeInfo.appendChild(counterRow(links));
		} else {
			nodeInfo.appendChild($.e("div", {"class": "msg-empty", html: Lang.get("groups.pageGroupBlocked")}));
		}

		wrap.appendChild(nodeInfo);

		if (!group.deactivated) {
			if (wall) {
				wrap.appendChild(Wall.getNodeWall(-groupId, {
					data: wall,
					canPost: group.can_post,
					extra: group.e,
					canSuggest: group.type === "page" && !group.ban_info
				}));
			} else {
				wrap.appendChild(Site.getEmptyField(Lang.get("groups.pageWallNotAvailable")));
			}
		}

		Site.setHeader(Lang.get("groups.type")[group.type]);
		Site.append(wrap);
	},

	getCover: function(group) {
		var bg, cover = group.cover, actions = Groups.getActions(group);

		if (cover && cover.enabled) {
			var img, height, targetWidth = g("page").offsetWidth;

			for (var i = 0, item; item = cover.images[i]; ++i) {
				if (item.width > targetWidth) {
					img = item.url;
					height = item.height * (targetWidth / item.width);
					break
				}
			}


			bg = $.e("div", {"class": "group-cover"});
			bg.style.backgroundImage = "url(" + img + ")";
			bg.style.height = height + "px";
			bg.appendChild(actions);
		} else {
			return Site.getPageHeader(getName(group), actions);
		}

		return bg;
	},

	/**
	 * Returns ability items actions
	 * @param {User} group
	 * @returns {HTMLElement}
	 */
	getActions: function(group) {
		var p = {}, ms = group.member_status;

		switch (ms) {
			case MemberStatus.NOT_MEMBER:
			case MemberStatus.INVITED_BY_SOMEBODY:
				p["join"] = {
					label: Lang.get(MemberStatus.NOT_MEMBER === ms ? "groups.actionJoin" : "groups.actionAcceptInvite"),
					onclick: function(item) {
						item.disable();
						Groups.join(group, false, function() {
							item.label(Lang.get(MemberStatus.NOT_MEMBER === ms ? "groups.actionDoneJoin" : "groups.actionDoneAcceptInvite"));
						});
					}
				};
				break;

			case MemberStatus.MEMBER:
			case MemberStatus.REJECTED_INVITE:
				p["leave"] = {
					label: Lang.get(MemberStatus.MEMBER === ms ? "groups.actionLeave" : "groups.actionCancelRequest"),
					onclick: function(item) {
						item.disable();
						Groups.leave(group, function() {
							item.label(Lang.get(MemberStatus.MEMBER === ms ? "groups.actionDoneLeave" : "groups.actionDoneCancelRequest"));
						});
					}
				};
				break;

			case MemberStatus.NOT_SURE:
				/*p["join"] = {
					label: Lang.get("groups.actionJoin"),
					onclick: function() {}
				};
				p["leave"] = {
					label: Lang.get(MemberStatus.MEMBER === ms ? "groups.actionLeave" : "groups.actionAcceptCancelRequest"),
					onclick: function() {}
				};*/
				break;
		}

		p["share"] = {
			label: Lang.get("groups.actionShare"),
			onclick: function() {
				//noinspection JSCheckFunctionSignatures
				share("club", group.id, 0, null, actionAfterShare, {
					wall: true,
					user: false,
					group: true
				});
			}
		};

		p["favorite"] = {
			label: Lang.get(!group.is_favorite ? "profiles.actionFavoriteAdd" : "profiles.actionFavoriteRemove"),
			onclick: function(item) {
				item
					.disable()
					.commit();

				Groups.toggleFavorite(group, function() {
					console.log("toggle fav callback", group.is_favorite);
					item
						.label(Lang.get(!group.is_favorite ? "profiles.actionFavoriteAdd" : "profiles.actionFavoriteRemove"))
						.enable()
						.commit();
				});
//					APINotify.fire(DogEvent.PROFILE_USER_FAVORITE_CHANGED, { userId: user.id, favorite: user.is_favorite });
			}
		};

		return new DropDownMenu(Lang.get("general.actions"), p).getNode();
	},

	/**
	 * Делает запрос на добавление в закладки или удаление из закладок
	 * @param  {Object}   group    Объект Группы
	 * @param  {Function} callback Пользовательский колбэк
	 */
	toggleFavorite: function(group, callback) {
		var toFavorite = !group.is_favorite;
		api(toFavorite ? "fave.addGroup" : "fave.removeGroup", {
			group_id: group.id
		}).then(function() {
			new Snackbar({
				text: "Группа " + (toFavorite ? "добавлена в закладки" : "убрана из закладок")
			}).show();
			group.is_favorite = toFavorite;
			console.log("toggle fav will ", group.is_favorite);
			callback && callback();
		});
	},

	/**
	 * Возвращает DOMNode для статуса
	 * @param  {User} group
	 * @return {HTMLElement}
	 */
	getStatusNode: function(group) {
		var e = $.e,
			i = group.is_admin,
			s = (group.status || ""),
			a = group.status_audio;

		if (!group.status_audio) {
			var w = e("div", {
				"class": (s ? "profile-status" : "") + (!s && i ? " tip" : ""),
				"data-status": s,
				html: s.safe().emoji() || (i ? Lang.get("profiles.statusChange") : "")
			});

			i && w.addEventListener("click", Groups.editStatus.bind(w, group.id));

			return w;
		} else {
			return Audios.getListItem(a, {
				removeBroadcast: i
			});
		}
	},

	/**
	 * Заменяет поле со статусом на текстовое поле
	 * Context: DOMNode
	 */
	editStatus: function(groupId) {
		if (this.dataset.opened === "opened") {
			return;
		}

		var text = this.dataset.status, node = this;
		this.dataset.opened = "opened";

		this.innerHTML = "";
		node.appendChild(Site.createInlineForm({
			name: "text",
			value: text,
			onsubmit: function(event) {
				event.preventDefault();
				var fText = this.text,
					text = fText.value.trim();
				Groups.setStatus(groupId, text).then(function() {
					node.dataset.opened = "";
					node.dataset.status = text;
					node.innerHTML = text ? text.safe().emoji() : Lang.get("profiles.statusChange");

					if (!text) {
						node.className = 'profile-status tip';
					}

//					APINotify.fire(DogEvent.GROUP_STATUS_CHANGED, { text: text, groupId: groupId });
				});
				return false;
			},
			title: Lang.get("profiles.statusChangeSubmit")
		}));
		this.firstChild.text.focus();
	},

	/**
	 * Запрос на изменение статуса
	 * @param {int} groupId
	 * @param {String} text
	 * @returns {Promise}
	 */
	setStatus: function(groupId, text) {
		return api("status.set", {group_id: groupId, text: text});
	},


	/**
	 * Confirm and request to join group
	 * @param {object} group
	 * @param {boolean=} notSure
	 * @param {function=} callback
	 */
	join: function(group, notSure, callback) {
		api("groups.join", {group_id: group.id, not_sure: notSure ? 1 : 0}).then(function() {
			callback && callback();
		});
	},

	/**
	 * Confirm and request to leave group
	 * @param {object} group
	 * @param {function=} callback
	 */
	leave: function(group, callback) {
		VKConfirm("Вы действительно хотите выйти из группы `" + group.name.safe() + "`", function() {
			api("groups.leave", {group_id: group.id}).then(function() {
				callback && callback();
			});
		});
	},


	/**
	 * Confirm and request for share group
	 * @param {int} groupId
	 * @param {HTMLInputElement} button
	 */
	share: function(groupId, button) {
		VKConfirm("Вы действительно хотите рассказать друзьям о сообществе? Это приведет к появлению онлайна на Вашей странице!", function() {
			button.disabled = true;
			/** @var {{success}} data */
			api("wall.repost", {object: "club" + groupId}).then(function(data) {
				if (data.success) {
					button.value = "Вы рассказали друзьям!";
				}
			});
		});
	},

	/**
	 * Open modal window and request data for links of group
	 * @param {GroupContact[]} data
	 */
	showLinks: function(data) {
		var modal = new Modal({
			title: "Ссылки",
			noPadding: true,
			content: $.e("div", {append: data.map(function(item) {
				var isVK, link;
				link = item.url;
				isVK = /^https?:\/\/(m\.)?vk\.com\//ig.test(link);
				if (isVK) {
					link = link.replace(/^https?:\/\/(m\.)?vk\.com\//ig, "#");
				}

				return $.e("a", {
					href: link,
					target: "_blank",
					"class": "friends-item",
					append: [
						item.photo_50 ? $.e("img", {src: getURL(item.photo_50), alt: "", "class": "friends-left"}) : $.e("div"),
						$.e("div", {"class": "friends-right", append: [
							$.e("div", {html:"<strong>" + item.name + "</strong>"}),
							$.e("div", {"class": "tip", html: item.desc || ""})
						]})
					]
				});
			})}),
			footer: [
				{
					name: "close",
					title: "Закрыть",
					onclick: function() {
						modal.close();
					}
				}
			]
		}).show();
	},

	/**
	 * Show modal with information about contacts
	 * @param {GroupContact[]} contacts
	 */
	showContacts: function(contacts) {
		var modal = new Modal({
			title: "Контакты",
			noPadding: true,
			content: $.e("div", {append: contacts.map(function(item) {
				var user = Local.data[item.user_id];
				return $.e(user ? "a" : "div", {
					href: user && "#" + user.screen_name,
					onclick: function() {
						this.tagName === "A" && modal.close();
					},
					"class": "friends-item",
					append: [
						$.e("img", {src: user ? getURL(user.photo_50) : "", alt: "", "class": "friends-left"}),
						$.e("div", {"class": "friends-right", append: [
							$.e("div", {html: user ? "<strong>" + getName(user) + "</strong>" : ""}),
							$.e("div", {"class": "tip", html: item.desc ? item.desc : ""}),
							$.e("div", {"class": "tip", html: item.email ? item.email : ""}),
							$.e("div", {"class": "tip", html: item.phone ? item.phone : ""})
						]})
					]
				});
			})}),
			footer: [
				{
					name: "close",
					title: "Закрыть",
					onclick: function () {
						modal.close();
					}
				}
			]
		}).show();
	},


	getRequests: function(screenName) {
		api("execute", {
			code: "var g=API.utils.resolveScreenName({screen_name:Args.s,v:5.28}),i;if(g.type!=\"group\")return{};i=g.object_id;return{i:i,g:API.groups.getById({group_id:i,v:5.28}),r:API.groups.getRequests({group_id:i,count:50,offset:parseInt(Args.o),fields:Args.f,v:5.28})};",
			s: screenName,
			o: getOffset(),
			f:"photo_50,sex,screen_name"
		}).then(function(data) {
			/** @var {{g, r}} data */
			Local.add(data.g);
			var groupId = data.i;
			data["r"] = data.r || {count: 0, items: []};
			data.r.groupId = groupId;
			Groups.showRequests(data.r);
		});
	},


	showRequests: function(data) {
		var e = $.e,
			groupId = data.groupId,
			group = Local.data[-groupId],
			count = data.count,
			wrap = e("div"),
			list = e("div"),
			item = function (u) {
				var q;
				q = e("div", {"class": "friends-item", append: [
					e("img", {"class": "friends-left", src: getURL(u.photo_50)}),
					e("div", {"class": "friends-right", append: [
						e("strong", {append: e("a", {href: "#" + u.screen_name, html: getName(u)})}),
						e("div", {"class": "friends-action", append: [
							e("input", {type: "button", value: "Принять", onclick: function() {
								var button = this;
								Groups.approveRequest(groupId, u.id).then(function() {
									q.style.opacity = .5;
									$.elements.remove(button.parentNode);
								});
							}}),
							e("input", {type: "button", value: "Отклонить", onclick: function() {
								var button = this;
								Groups.removeMember(groupId, u.id).then(function() {
									q.style.opacity = .5;
									$.elements.remove(button.parentNode);
								});
							}})
						]})
					]})
				]});
				list.appendChild(q);
			};

		data = data.items;

		if (data.length) {
			Array.prototype.forEach.call(data, item);
		} else {
			list.appendChild(Site.getEmptyField("Нет заявок на вступление"));
		}

		wrap.appendChild(Site.getPageHeader(count + " заяв%s на вступление".replace(/%s/img, $.textCase(count, ["ка", "ки", "ок"]))));
		wrap.appendChild(list);
		wrap.appendChild(Site.getSmartPagebar(getOffset(), count, 50));
		Site.append(wrap);
		Site.setHeader("Заявки на вступление", {link: group.screen_name});
	},

	/**
	 * Request for approve user request for invite
	 * @param {int} groupId
	 * @param {int} userId
	 * @returns {Promise}
	 */
	approveRequest: function(groupId, userId) {
		return api("groups.approveRequest", {
			group_id: groupId,
			user_id: userId
		});
	},

	/**
	 * Request for remove user from group members or remove request for invite
	 * @param {int} groupId
	 * @param {int} userId
	 * @returns {Promise}
	 */
	removeMember: function(groupId, userId) {
		return api("groups.removeUser", {
			group_id: groupId,
			user_id: userId
		});
	},


	invites: {

		/**
		 * Draw page
		 * @returns {Promise}
		 */
		page: function() {
			return new Promise(function(resolve) {
				var sl = new SmartList({
						data: {count: -1, items: []},
						countPerPage: 50
					}),
					wrap = $.e("div", {append: [
						Groups.getTabs(API.userId),
						Site.getPageHeader(Lang.get("groups.request_header")),
						sl.getNode()
					]});

				Site.setHeader(Lang.get("groups.request_header"), {link: "groups"});
				Site.append(wrap);
				resolve({wrap: wrap, list: sl});
			});
		},

		/**
		 * Request for invites to groups
		 * @param {{wrap: HTMLElement, list: SmartList, data}} data
		 * @returns {Promise.<{wrap: HTMLElement, list: SmartList, data: {count: int, items: User[]}}>}
		 */
		load: function(data) {
			return api("execute", {
				code:'var g=API.groups.getInvites({count:150,offset:parseInt(Args.o),fields:Args.fg});return{i:g,u:API.users.get({user_ids:g.items@.invited_by,fields:Args.fu})};',
				fg: "members_count",
				fu: "online,screen_name",
				o: getOffset(),
				v: 5.56
			}).then(function(res) {
				Local.add(res.u);
				data.data = res.i;
				return data;
			});
		},

		/**
		 * Show list of invites
		 * @param {{wrap: HTMLElement, list: SmartList, data: {count: int, items: User[]}}} data
		 */
		show: function(data) {
			var res = data.data;
			data.wrap.insertBefore(
				Site.getPageHeader(Lang.get("groups.request_you_have") + res.count + " " + $.textCase(res.count, Lang.get("groups.request_groups"))),
				data.list.getNode()
			);

			$.elements.remove(data.wrap.firstChild);

			data.list.setData(res);
		}
	},


	recommendations: {

		/**
		 * Draw page
		 * @returns {Promise}
		 */
		page: function() {
			return new Promise(function(resolve) {
				var parent = $.e("div"),
					sl = new SmartList({
						data: {count: -1, items: []},
						countPerPage: 40
					});

				parent.appendChild(Groups.getTabs(API.userId));
				parent.appendChild(Site.getPageHeader(Lang.get("groups.suggestionsTitle")));
				parent.appendChild(sl.getNode());

				window.onScrollCallback = function(event) {
					event.needLoading && sl.showNext();
				};

				Site.setHeader(Lang.get("groups.suggestionsTitle"));
				Site.append(parent);
				resolve({sl: sl});
			});
		},

		/**
		 * Request for suggestions
		 * @returns {Promise}
		 */
		load: function(meta) {
			return api("newsfeed.getSuggestedSources", {
				count: 100,
				shuffle: 1,
				fields: "members_count,photo_50,verified,online",
				v: 5.56
			}).then(function(res) {
				meta.data = res;
				return meta;
			});
		},

		/**
		 * Show items on page
		 */
		show: function(meta) {
			meta.sl.setData(meta.data);
		}

	},

	search: {
		getQuery: function() {
			var p = Site.get();

			return {
				q: p.q,
				sort: p.sort || 0
			};
		},

		page: function() {
			return new Promise(function(resolve) {
				var parent = $.e("div"),
					p = Groups.search.getQuery(),
					form = Site.createInlineForm({
						name: "q",
						title: Lang.get("groups.searchButton"),
						placeholder: Lang.get("groups.searchPlaceholder"),
						value: p.q,
						onsubmit: function(event) {
							event.preventDefault();
							p.q = this.q.value.trim();
							p.sort = this.sort.options[this.sort.selectedIndex].value;
							window.history.replaceState(null, document.title, "#groups?act=search&" + Object.toQueryString(p));
							Groups.search.load({sl: sl}).then(Groups.search.show);
							return false;
						}
					}),
					sort = $.e("select", {name: "sort", append: (Lang.get("groups.searchSortTypes") || []).map(function(item, i) {
						return $.e("option", {value: i, html: item});
					}) }),
					sl = new SmartList({
						data: {count: 0, items: []},
						countPerPage: 40
					});

				p.sort && (sort.selectedIndex = parseInt(p.sort));

				form.appendChild(sort);

				parent.appendChild(Groups.getTabs(API.userId));
				parent.appendChild(Site.getPageHeader(Lang.get("groups.searchTitle")));
				parent.appendChild(form);
				parent.appendChild(sl.getNode());

				window.onScrollCallback = function(event) {
					event.needLoading && sl.showNext();
				};

				Site.setHeader(Lang.get("groups.searchTitle"));
				Site.append(parent);

				p.q && Groups.search.load({sl: sl}).then(Groups.search.show);

				resolve({sl: sl});
			});
		},

		/**
		 * Request for results
		 * @returns {Promise}
		 */
		load: function(meta) {
			var p = {
				count: 250,
				fields: "members_count,city",
				v: 5.56
			};

			Object.merge(p, Groups.search.getQuery());
			return api("groups.search", p).then(function(res) {
				meta.data = res;
				return meta;
			});
		},

		/**
		 * Show items on page
		 */
		show: function(meta) {
			meta.sl.setData(meta.data);
		}
	},




	Blacklist:{
		/**
		 * @deprecated
		 */
		Request: function (screen_name, offset) {
			Site.API("execute", {
				code:'var g=API.groups.getById({group_id:"' + screen_name + '",v:5.14})[0],b=API.groups.getBanned({group_id:g.id,count:40,offset:' + offset + ',fields:"photo_rec,online,screen_name"});return [b,API.users.get({user_ids:b.items@.ban_info@.admin_id,fields:"sex"}),g];'
			}, function (data) {
				var parent = document.createElement("div"),
					list = document.createElement("div"),
					form = document.createElement("form"),
					data = Site.isResponse(data),
					users = data[0],
					admins = data[1],
					group = data[2],
					count = users.count,
					users = users.items,
					gid = group.id,
					reasons = Lang.get("groups.bl_reasons");
				if(!group.is_admin)
					return window.location.hash = "#" + screen_name;
				Local.add(data[0].items.concat(data[1]).concat([group]));
				parent.appendChild(Site.getPageHeader(
					Lang.get("groups.bl_in") + count + " " + Lang.get("groups", "bl_users", count),
					$.elements.create("span", {"class": "fr a", html: "Забанить", onclick: function (event) {
						this.innerHTML = $.elements.hasClass(form, "hidden") ? "Скрыть" : "Забанить";
						$.elements.triggerClass(form, "hidden");
//                      $.elements.triggerClass(list, "hidden");
					}})
				));
				parent.appendChild((function (f) {
					f.onsubmit = function (event) {
						var uid = form.user.value,
							reason = form.reason.options[form.reason.selectedIndex].value,
							comment = form.comment.value;
						comment_visible = +form.comment_visible.checked;
						end_date = form.end_date.options[form.end_date.selectedIndex].value;
// fast fix begin
						uid = uid.split("/")
						uid = uid[uid.length - 1].replace(/#/img, "").split("?")[0];
// fast fix end
						Site.API("execute",{
							code: 'var uid=API.utils.resolveScreenName({screen_name:"' + uid + '",v: 5.14});if(uid.type!="user")return -1;else uid=uid.object_id;return [API.groups.banUser({user_id:uid,group_id:' + gid + ',reason:' + reason + ',comment:"' + comment /* there was addSlashes TODO: remove this fuck */ + '",comment_visible:' + comment_visible + ',end_date:' + end_date + '}),API.users.get({user_ids:uid,fields:"photo_rec,online,screen_name"})[0]];'
						}, function (data) {
							data = Site.isResponse(data);
							if(!data[0])
								return Site.Alert({text: "Ошибка!<br><br>" + response.execute_errors[0].error_msg});
							var parent = $.element("blacklist"),
								user = data[1];
							Local.add([user]);
							user.user_id = user.id;
							user.ban_info = {
								reason: reason,
								comment: comment,
								end_date: parseInt(end_date),
								admin_id: API.userId,
								date: Math.round(new Date().getTime() / 1000)
							};
							parent.insertBefore(Groups.Blacklist.Item(user, 1, gid), parent.children[0]);
							form.user.value = "";
							form.reason.selectedIndex = 0;
							form.comment.value = "";
							form.comment_visible.checked = false;
							form.end_date.selectedIndex = 0;
						});
						return false;
					};
					f.className = "sf-wrap hidden";
					var e = $.elements.create;
					f.appendChild(e("div", {"class": "tip tip-form", html: "Пользователь"}));
					f.appendChild(e("input", {type: "text", name: "user", required: true}));
					f.appendChild(e("div", {"class": "tip tip-form", html: "Причина"}));
					f.appendChild(e("select", {name: "reason", append: (function (a, b) {
						for (var i = 1, l = a.length; i < l; ++i)
							b.push(e("option", {html: a[i], value: i}));
						return b;
					})(reasons, [])}));
					f.appendChild(e("div", {"class": "tip tip-form", html: "Срок"}));
					f.appendChild(e("select", {name: "end_date", append: (function () {
						var now = Math.round(new Date().getTime() / 1000),
							opts = [[1, "час"], [24, "день"], [24 * 7, "неделя"], [24 * 30, "месяц"], [24 * 365, "год"], [0, "навсегда"]],
							options = [];
						for (var i = 0, l = opts.length; i < l; ++i)
							options.push(e("option", {value: opts[i][0] ? now + (opts[i][0] * 60 * 60) : opts[i][0], html: opts[i][1]}));
						return options;
					})()}));
					f.appendChild(e("div", {"class": "tip tip-form", html: "Комментарий"}));
					f.appendChild(e("input", {type: "text", name: "comment"}));
					f.appendChild(e("label", {"class": "tip-form", append: [
						e("input", {type: "checkbox", name: "comment_visible"}),
						e("span", {"class": "tip", html: " комментарий виден пользователю"})
					]}));
					f.appendChild(e("input", {type: "submit", value: "Заблокировать"}));
					return f;
				})(form));
				list.id = "blacklist";
				parent.appendChild((function (l, u) {
					for(var i = 0, k = u.length; i < k; ++i)
						l.appendChild(Groups.Blacklist.Item(u[i], 0, gid));
					return l;
				})(list,users));
				Site.setHeader("Черный список сообщества", {link: screen_name});
				Site.append(parent);
			});
		},
		/**
		 * @deprecated
		 */
		Item: function (c, animation, gid) {
			var info = c.ban_info,
				user_id = c.id,
				admin = Local.data[info.admin_id],
				actions,
				item = Templates.getUser(c, {a: console.log(c, info), actions: [
					actions = $.e("div", {"class": "tip", append: [
						$.e("span", {html: Lang.get("groups.bl_blocked")[admin.sex || 2] + " "}),
						$.e("a", {href: "#" + admin.screen_name, html: admin.first_name + " " + admin.last_name + Site.isOnline(admin)}),
						$.e("span", {html: " " + $.getDate(info.date) + " " + (!info.end_date > 0 ? " навсегда" : Lang.get("groups.bl_until") + " " + $.getDate(info.end_date))})
					]})],
					close: function (event) {
						var e = this;
						Site.API("groups.unbanUser", {
							group_id: gid,
							user_id: user_id
						}, function (data) {
							var user = Local.data[user_id];
							$.elements.clearChild(actions);
							actions.appendChild($.elements.create("span", {"class": "tip", html: Lang.get("groups.bl_deleted")[user.sex || 0] + Lang.get("groups.bl_deleted_from")}));
						});
					}
				});
			if (animation)
				$.elements.addClass(item, "doc-saved");
			return item;
		}
	},

	showChangerPhoto: function(groupId) {
		var form = document.createElement("form");
		form.className = "profile-uploader";
		form.method = "post";
		form.target = "_uploader_photo";
		form.enctype = "multipart/form-data";
		form.appendChild($.e("div", {"class":"tip", html: Lang.get("profiles.profile_photo_upload_tip")}));
		form.appendChild(Site.createFileChooserButton("photo", {
			fullWidth: true,
			accept: "image/*"
		}));
		form.onsubmit = function() {
			uploadFiles(this.photo.files[0], {
				method: "photos.getOwnerPhotoUploadServer",
				params: {
					group_id: groupId
				}
			}, {
				onTaskFinished: function(photo) {
					// TODO: user message
					alert("Успешно");
				}
			});
		};
		form.appendChild($.e("input",{type: "submit",value: "Загрузить фотографию"}));
		Site.append(form);
		Site.setHeader(Lang.get("profiles.profile_photo_upload"), {link: Local.data[-groupId].screen_name});
		form.parentNode.insertBefore(Site.getPageHeader(Lang.get("profiles.profile_photo_upload")), form);
	}
};

var MemberStatus = {
	NOT_MEMBER: 0,
	MEMBER: 1,
	NOT_SURE: 2,
	REJECTED_INVITE: 3,
	REQUESTED_JOIN: 4,
	INVITED_BY_SOMEBODY: 5
};