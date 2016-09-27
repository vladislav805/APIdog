/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Groups = {
	// need refactor
	// need rewrite
	RequestPage: function(ownerId) {
		switch (Site.get("section")) {
			case "invites":
				Site.Loader();
				return Groups.getInvites();

			case "search":
				if(!Site.get("q"))
					return [Site.Loader(), Groups.Search()];
				else
					return Groups.RequestSearch({
						offset: getOffset(),
						q: decodeURI(Site.Get("q")),
						sort: Site.Get("sort")
					});

			case "recommends":
				Site.APIv5("newsfeed.getSuggestedSources", {
					offset: getOffset(),
					count: 40,
					v: 5.29,
					shuffle: 1,
					fields: "members_count,photo_50,verified,online"
				}, function(data) {
					data = Site.isResponse(data);
					var parent = document.createElement("div"),
						list = document.createElement("div"),
						tabs = [
							["groups", "Все <i class='count'>" + formatNumber(Groups.Groups[API.userId] && Groups.Groups[API.userId].count || "") + "<\/i>"]
						],
						count = data.count,
						data = data.items,
						admins = 0;
					Local.add(data);
					if (Groups.Groups[API.userId] && Groups.Groups[API.userId].items)
						for (var i = 0, l = Groups.Groups[API.userId].items.length; i < l; ++i)
							if (Groups.Groups[API.userId].items[i].is_admin)
								admins++;
					if (admins > 0)
						tabs.push(["groups?section=admin", "Управление <i class='count'>" + admins + "</i>"]);
					if (Site.Counters && Site.Counters.groups > 0)
						tabs.push(["groups?act=invites", "Приглашения <i class='count'>" + Site.Counters.groups + "</i>"]);
					tabs.push(["groups?act=recommends", "Рекомендованное"]);
					tabs.push(["groups?act=search", "Поиск"]);
					parent.appendChild(Site.CreateTabPanel(tabs));
					parent.appendChild(Site.getPageHeader("Рекомендуемые сообщества"));
					for (var i = 0; i < data.length; ++i)
						if (data[i].type != "profile")
							list.appendChild(Groups.Item(data[i], {noDeleteButton: oid != API.userId}));
						else
							list.appendChild((function(item, elem) {
								elem.innerHTML = '<img src="'+getURL(item.photo_50)+'" alt="" class="friends-left" \/><div class="friends-right"><strong>'+item.first_name+' '+item.last_name + " " + Site.isVerify(data[i]) + " " + Site.isOnline(data[i]) + '<\/strong><\/div>';
								return elem;
							})(data[i], $.e("a", {"class": "groups-item",href:"#"+(data[i].screen_name||"id"+data[i].id)})));
					parent.appendChild(list);
					parent.appendChild(Site.PagebarV2(getOffset(), count, 40));
					Site.setHeader("Рекомендуемые сообщества");
					Site.append(parent);
				});
				break;

			default:
				Site.Loader();

				var ownerId = Site.get("userId") || API.userId;

				if (Groups.cache[ownerId]) {
					Groups.showList(ownerId);
					return;
				};

				new APIRequest("execute", {
					code: "var o=parseInt(Args.o);return{u:API.users.get({user_ids:o,fields:Args.uf,v:5.52}),g:API.groups.get({user_id:o,extended:1,fields:Args.gf,v:5.52})};",
					o: ownerId,
					uf: "first_name_gen,last_name_gen,sex",
					gf: "members_count,verified,city"
				}).setOnCompleteListener(function(data) {
					Local.add(data.u);

					Groups.cache[ownerId] = data.g.items;

					Groups.showList(ownerId);
				}).execute();
		};
	},

	cache: {},

	getTabs: function(ownerId) {
		var source = Groups.cache[ownerId] || [],
			isMy = ownerId == API.userId,

			adminCount = isMy ? source.filter(function(g) { return !!g.admin_level; }).length : 0,

			tabs = [
				[
					isMy
						? "groups"
						: "groups?userId=" + ownerId,
					lg("groups.listTabAll").schema({ n: source.length })
				]
			];

		if (isMy) {
			if (adminCount) {
				tabs.push([
					"groups?section=manage",
					lg("groups.listTabManage").schema({ n: adminCount })
				]);
			};

			if (Site.counters.groups) {
				tabs.push([
					"groups?section=invites",
					lg("groups.listTabInvites").schema({ n: Site.counters.groups })
				]);
			};

			tabs.push([
				"groups?act=search",
				lg("groups.listTabSearch")
			]);

			tabs.push([
				"groups?act=recommends",
				lg("groups.listTabRecommendations")
			]);
		};

		return Site.CreateTabPanel(tabs);
	},

	showList: function(ownerId) {
		var e = $.e,

			source = Groups.cache[ownerId],
			owner = Local.Users[ownerId],
			isMy = ownerId == API.userId,
			isAdmin = Site.get("section") === "manage",

			list = !(isMy && isAdmin)
				? source
				: source.filter(function(group) {
					return !!group.admin_level;
				  }),

			nodeWrap = e("div"),
			nodeList = e("div"),

			cursor = 0,
			chunkBy = 40,

			isBusy = true,

			insert = function() {
				if (cursor >= list.length) {
					return;
				};

				for (var max = cursor + chunkBy; cursor < Math.min(max, source.length); ++cursor) {
					nodeList.appendChild(Groups.itemList(list[cursor], {owner: owner}));
				};
				isBusy = false;
			};



		nodeWrap.appendChild(Groups.getTabs(ownerId));

		nodeWrap.appendChild(Site.getPageHeader(
			isMy
				? lg("groups.listHeaderJoinedYou").schema({
					n: source.length,
					g: lg("groups.inGroups", source.length)
				  })
				: lg("groups.listHeaderJoinedUser").schema({
					o: owner.first_name,
					n: source.length,
					g: lg("groups.inGroups", source.length)
				  }),
			isMy
				? e("a", {
					"class": "fr",
					onclick: Groups.showCreateForm,
					html: lg("groups.listHeaderCreateGroup")
				  })
				: null
		));

		nodeWrap.appendChild(nodeList);
		Site.setHeader(lg("groups.listGroupsHead"));
		Site.append(nodeWrap);

		insert();

		window.onScrollCallback = function(event) {
			if (event.needLoading && !isBusy) {
				isBusy = true;
				insert();
			};
		};
	},

	itemList: function(g, options) {
		options = options || {};
		var e = $.e,
			groupId = (g.id || g.gid),

			type = lg("groups.types")[g.type],
			users = lg(g.type == "page" ? "groups.countFollowers" : "groups.countMembers"),
			members = g.members_count,
			right;

// TODO
		return Templates.getUser(g, {
			fulllink: true,
			actions: [
				e("div", {"class": "tip", append: document.createTextNode(type + ", " + (members ? members.format() + " " + $.textCase(members, users) : ""))}),
				options.request
					? Groups.getInviteBlock(g)
					: null
			]
		});
	},

	getInviteBlock: function(group) {
		var e = $.e,

			inviter = Local.Users[group.invited_by],

			fastJoin = function(event) {
				Groups.join(group.id, function(res) {
					$.elements.clearChild(block);
					block.appendChild(e("span", {"class": "tip", html: lg("groups.invitesAcceptedSuccess")}))
				});
				$.event.cancel(event);
			},

			fastDecline = function(event) {
				Groups.leave(group.id, function(res) {
					$.elements.clearChild(block);
					block.appendChild(e("span", {"class": "tip", html: lg("groups.invitesDeclineSuccess")}))
				})
				$.event.cancel(event);
			},

			block = e("div", {"class": "tip", append: [
				e("span", {html: lg("groups.invitesInviter").schema({ u : getName(inviter) }) }),
				e("div", {"class": "groups-invite-actions", append: [
					e("input", {type: "button", value: lg("groups.invitesAccept"), onclick: fastJoin}),
					e("input", {type: "button", value: lg("groups.invitesDecline"), onclick: fastDecline})
				]})
			]});


		return block;
	},

	join: function(groupId, callback, notSure) {
		new APIRequest("groups.join", {
			groupId: groupId
		}).setOnCompleteListener(callback).execute();
	},

	leave: function(groupId, callback, notSure) {
		new APIRequest("groups.leave", {
			groupId: groupId
		}).setOnCompleteListener(callback).execute();
	},

	showCreateForm: function() {
		var e = $.e,
			form = e("div", {"class": "sf-wrap"}),
			grouptype = (function(tiles, d) {
				for (var val in tiles)
					d.push(e("option", {value: val, html: tiles[val]}));
				return d;
			})(Lang.get("groups.create_type_values"), []),
			groupsubtype = (function(tiles, d) {
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
		form.appendChild(type = e("select", {name: "typegroup", append: grouptype, onchange: function(event) {
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
					onclick: function() {
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
						}, function(data) {
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
					onclick: function() {
						modal.close();
					}
				}
			]
		}).show();
	},

	// need refactor
	// need rewrite
	display: function(group, wall) {
		var elem = document.createElement("div"),
			elem_info = document.createElement("div"),
			info = group, // for compatible
			counters = info.counters,
			gid = info.id,
			infoblock = document.createElement("div"),
			media = [],
			buttons,
			infoRow = function(name, value, format) {
				return $.e("div", {"class": "group-info-item", append: [
					$.e("div", {"class": "group-info-name", html: name}),
					$.e("div", {"class": "group-info-value", html: (typeof value === "string" ? (format ? Site.Format(value) : value) : ""), append: (typeof value === "string" ? [] : [value])})
				]});
			},
			counterRow = function(object) {
				var parent = $.e("div", {"class": "profile-media"}), s, q;

				for (var i = 0, l = object.length; i < l; ++i) {
					if (object[i][2]) {
						q = typeof object[i][0] === "string";
						s = $.e(q ? "a" : "div", {
							"class": "profile-counters a",
							append: [
								$.e("strong", {"class": "profile-counters-count", html: object[i][2] > 0 ? formatNumber(object[i][2]) : ""}),
								$.e("div", {"class": "profile-counters-label cliptextfix", html: object[i][1]})
							]
						});
						s[q ? "href" : "onclick"] = q ? "#" + object[i][0] : object[i][0];
						parent.appendChild(s);
					}
				}
				return parent;
			};
		if (info.is_member) {
			buttons = [
				$.e("input", {type: "button", value: (info.type == "page" ? "Отписаться" : "Выйти из группы"), onclick: (function(id, is_closed) {
					return function(event) {
						VKConfirm("Вы действительно хотите выйти из группы `" + Local.Users[-id].name + "`", function() {
							return Groups.Leave(id, this, is_closed);
						});
						return false;
					}
				})(gid, info.is_closed)})
			];

		} else {
			buttons = [
				$.e("input", {type: "button", value: (info.is_closed ? "Подать заявку" : (info.type == "page" ? "Подписаться" : "Вступить")), onclick: (function(id, is_closed) {
					return function(event) {
						return Groups.Join(gid, this, is_closed);
					}
				})(gid, info.is_closed)})
			]
		};
		elem.appendChild(Site.getPageHeader(info.name.safe(), Site.CreateDropDownMenu(Lang.get("general.actions"), (function(group, groupId) {
			var p = {}, isFave = group.is_favorite;
			if (info.is_closed) {
				p["Поделиться"] = function() {
					share("club", gid, null, null, actionAfterShare, {
						wall: true,
						user: false,
						group: true
					});
				};
			};
			p[isFave ? "Удалить из закладок" : "Добавить в закладки"] = function(event) {
				Site.API("fave." + (isFave ? "remove": "add") + "Group", {
					group_id: groupId,
				}, function(data) {
					if (data.response) {
						Site.Alert({text: !isFave ? "Сообщество добавлено в закладки" : "Сообщество удалено из закладок"});
						Site.Go(window.location.hash);
					};
				});
			};
			if (info.admin_level == 3) {
				p["Редактировать группу"] = function() {
					Groups.editGroupInfo(gid);
				};
			};

			return p;

		})(info, gid))));
		infoblock.appendChild($.e("a", {href: "#" + (info.is_admin ? info.screen_name + "?act=photo" : "photos-" + gid + "_-6"), append: $.e("img", {src: getURL(info.photo_50), "class": "group-left"}) }));
		infoblock.appendChild($.e("div", {"class": "group-right", append: [
			$.e("strong", {html: info.name.safe() + Site.isVerify(info)}),
			(!info.status_audio ? $.e("div", {
				"class": (info.is_admin ? "profile-status" : "") + (!info.status ? " tip" : ""),
				onclick: (function(a) {return (a ? function(event) {
					var elem = this;
					if (elem.opened)
						return;
					elem.opened = true;
					var text = elem.innerHTML;
					//if (elem.innerHTML == "изменить статус" && /tip/ig.test(elem.className))
						elem.innerHTML = "";
					elem.appendChild(Site.CreateInlineForm({
						name: "text",
						value: text,
						onsubmit: function(event) {
							var status = $.trim(this.text.value);
							elem.opened = false;
							if (!status){
								elem.className = 'profile-status tip';
								elem.innerHTML = Lang.get("profiles.status_change");
							} else
								elem.innerHTML = status.safe().emoji();

							Site.API("status.set", {group_id: gid, text: status}, "blank");
						},
						title: Lang.get("profiles.status_changer_complete")
					}));
					elem.firstChild.text.focus();
				} : null);})(info.is_admin, gid),
				html: (info.status || "").safe().emoji() || (info.is_admin ? Lang.get("profiles.status_change") : "")
			}) : (function(a) {
				return Audios.Item(a, {from: 2, set: 32, lid: Audios.createList(a).lid, gid: gid, uid: -gid});
			})(info.status_audio)),
			$.e("div", {"class": "group-act", id: "group" + gid + "_actions", append: buttons})
		]}));

		if (info.deactivated) {
			infoblock.appendChild($.e("div", {"class": "msg-empty", html: "Сообщество заблокировано администрацией сайта ВКонтакте."}));
		};

// А этот кусок кода писала лично Надя Иванова :3
		if (info.ban_info) {
			infoblock.appendChild($.e("div",{"class": "block-error", style: "margin: 4px 10px 8px", append: [
				$.e("strong", {html: "Вы в чёрном списке этого сообщества"}),
				$.e("div", {append:[
					$.e("strong", {html: "Oкончание блокировки: "}),
					$.e("span", {html: info.ban_info.end_date ? $.getDate (info.ban_info.end_date) : "&mdash; (навсегда)"})
				]}),
				info.ban_info.comment ? $.e("div", {append: [
					$.e("strong", {html: "Комментарий администратора:"}),
					$.e("div", {html: info.ban_info.comment.safe()})
				]}) : null
			]}));
		};
// конец
		if (!info.deactivated) {
			infoblock.appendChild(Site.getPageHeader("Информация"));
			if (info.description)
				infoblock.appendChild(infoRow("Описание", info.description, true));
			if (info.site)
				infoblock.appendChild(infoRow("Сайт", info.site, true));
			if (info.start_date) {
				if (info.type == "event")
					infoblock.appendChild(infoRow("Начало", $.getDate(info.start_date)));
				else try {
					infoblock.appendChild(infoRow("Дата создания", (function(a) {
						var b = /(\d{4})(\d{2})(\d{2})/img.exec(a);
						return $.getDate(new Date(b[1], b[2] - 1, b[3]) / 1000);
					})(info.start_date) ));
				} catch (e) {}
			}
			if (info.finish_date)
				infoblock.appendChild(infoRow("Конец", $.getDate(info.finish_date)));
			if (info.place && info.city && !info.place.title)
				info.place.title = info.city.title;
			if (info.place)
				var map = Wall.GeoAttachment({place:info.place,coordinates:info.place.latitue + " " + info.place.longitude}, false);
			if (group.city && !info.place)
				infoblock.appendChild(infoRow("Город", group.city.title));
			else if (info.place) {
				info.place.title = info.place.title || "Место";
				var map = Wall.GeoAttachment({place: info.place, coordinates: info.place.latitue + " " + info.place.longitude}, false);
				map.className = "group-info-item";
				map.style.marginBottom = "5px";
				infoblock.appendChild(map);
			}
			if (info.wiki_page)
				infoblock.appendChild(Site.CreateTopButton({link: "pages?oid=-" + gid + "&p=" + info.wiki_page, title: info.wiki_page}));
			var objects = [
				[info.screen_name + "?act=members", "Участники", info.members_count],
				[function() { Groups.showContacts(info.screen_name) }, "Контакты", info.contacts && info.contacts.length || 0],
				[function() { Groups.showLinks(info.screen_name) }, "Ссылки", info.links && info.links.length || 0],
				["board" + gid, "Обсуждения", counters && counters.topics || 0],
				["photos-" + gid, "Альбомы", counters && counters.albums || 0],
				["videos-" + gid, "Видеозаписи", counters && counters.videos || 0],
				["audio?oid=-" + gid, "Аудиозаписи", counters && counters.audios || 0],
				["docs-" + gid, "Документы", counters && counters.docs || 0]
			];
			if (info.is_admin) {
				objects.push([info.screen_name + "?act=blacklist", "Черный список", -1]);
				objects.push([info.screen_name + "?act=stat", "Статистика", -1]);
				if (group.r > 0)
					objects.push([info.screen_name + "?act=requests", "Заявки на вступление в группу", group.r]);
			};
			objects.push(["feed?act=search&owner=-" + info.id, "Поиск по стене", -1]);
			infoblock.appendChild(Site.getPageHeader("Группа"));
			infoblock.appendChild(counterRow(objects));

		};
		elem.appendChild(infoblock);
		if (!info.deactivated) {
			if (wall)
				elem.appendChild(Wall.RequestWall(-gid, {
					data:wall,
					can_post:info.can_post,
					extra:group.e,
					canSuggest: info.type === "page" && !info.ban_info
				}));
			else
				elem.appendChild(getEmptyField("Доступ к стене ограничен"));
		};
		Site.setHeader({page: "Страница", group: "Группа", event: "Встреча"}[info.type] +" " + info.name.safe());
		Site.append(elem);
	},
	Join:function(gid,btn,closed){
		btn.disabled=true;
		Site.API("groups.join",{
			group_id:gid
		},function(data){
			if(data.response===1)
				$.element("group"+gid+"_actions").innerHTML='<input type="button" onclick="return Groups.Leave('+gid+',this,'+closed+',1);" value="'+(!closed?"Выйти из группы":"Отменить заявку")+'" \/>';
		});
	},
	Leave:function(gid,btn,closed,nomember){
		if(btn)
			btn.disabled=true;
		if(closed&&!nomember&&!confirm("Вы уверены, что хотите выйти из закрытой группы? Вы сможете вернуться только после повторного подтверждения администратора!"))
			return;
		Site.API("groups.leave",{
			group_id:gid
		},function(data){
			if(data.response===1)
				if(btn)
					$.element("group"+gid+"_actions").innerHTML='<input type="button" onclick="return Groups.Join('+gid+',this,'+closed+');" value="Вступить в группу" \/>';
				else
					$.element("group_"+gid).style.opacity=0.5;
		});
	},




	editGroupInfo: function(groupId) {
		Site.APIv5("groups.getSettings", {group_id: groupId, v: 5.29}, function(result) {
			var d = result.response, q = [
				{value: 0, html: "отключены"},
				{value: 1, html: "открытые"},
				{value: 2, html: "ограниченные"}
			], w = [
				{value: 0, html: "выключены"},
				{value: 1, html: "включены"}
			];
			d.subject_list.unshift({id: 0, name: "&mdash;"});
			new EditWindow({
				title: "Редактирование группы",
				isEdit: true,
				save: "Сохранить",
				items: [
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
						name: "title",
						title: "Название сообщества",
						value: d.title
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_TEXTAREA,
						name: "description",
						title: "Описание",
						value: d.description
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
						name: "website",
						title: "Сайт",
						value: d.website
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "subject",
						title: "Тематика",
						items: d.subject_list.map(function(i) {
							return {value: i.id, html: i.name};
						}),
						value: d.subject
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "access",
						title: "Тип группы",
						items: [
							{value: 0, html: "открытая"},
							{value: 1, html: "закрытая"},
							{value: 2, html: "частная"}
						],
						value: d.access
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "wall",
						title: "Стена",
						items: [
							{value: 0, html: "выключена"},
							{value: 1, html: "открытая"},
							{value: 2, html: "ограниченная"},
							{value: 3, html: "закрытая"},
						],
						value: d.wall
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "topics",
						title: "Обсуждения",
						items: q,
						value: d.topics
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "photos",
						title: "Фотографии",
						items: q,
						value: d.photos
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "video",
						title: "Видеозаписи",
						items: q,
						value: d.video
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "audio",
						title: "Аудиозаписи",
						items: q,
						value: d.audio
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "docs",
						title: "Документы",
						items: q,
						value: d.audio
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "links",
						title: "Ссылки",
						items: w,
						value: d.links
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "places",
						title: "Места",
						items: w,
						value: d.places
					},
					{
						type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
						name: "contacts",
						title: "Контакты",
						items: w,
						value: d.contacts
					},
				],
				onSave: function(values, modal) {
					values.group_id = groupId;
					Site.APIv5("groups.edit", values, function(data) {
						Site.Alert({text: 'сохранено'})
					});
				}
			});
		});
	},





	showLinks: function(groupId) {
		var e = $.e,
			showContent = function(links) {
				var list = e("div"), isVK, link;

				modal.setContent(e("div", {append: links.map(function(item) {
					link = item.url;
					isVK = /^https?:\/\/(new\.|m\.)?vk\.com\//ig.test(link);

					if (isVK) {
						link = link.replace(/^https?:\/\/(new\.|m\.)?vk\.com\//ig, "#");
					};

					return e("a", {
						href: link,
						target: "_blank",
						"class": "friends-item",
						append: [
							item.photo_50
								? e("img", {src: getURL(item.photo_50), alt: "", "class": "friends-left"})
								: null,
							e("div", {"class": "friends-right", append: [
								e("div", {append: e("strong", {html: item.name.safe() }) }),
								e("div", {"class": "tip", html: (item.desc || "").safe() })
							]})
						]
					});
				}) }));
			},

			modal = new Modal({
				title: lg("groups.modalLinksTitle"),
				noPadding: true,
				content: getLoader(),
				footer: [
					{
						name: "close",
						title: lg("general.close"),
						onclick: function() {
							modal.close();
						}
					}
				]
			}).show();

		new APIRequest("execute", {
			code: "return API.groups.getById({group_id:Args.g,fields:\"links\",v:5.52})[0].links;",
			g: groupId
		}).setOnCompleteListener(showContent).execute();
	},

	showContacts: function(groupId) {
		var e = $.e,
			showContent = function(data) {
				Local.add(data.u);
				data = data.l;
				var list = data.map(function(item) {
					var id = item.user_id,
						user = Local.Users[id];
					return e(user ? "a" : "div", {
						"class": "friends-item",
						href: user && "#" + user.screen_name,
						onclick: function(event) {
							this.tagName == "A" && modal.close();
						},
						append: [
							e("img", {src: user ? getURL(user.photo_50) : Mail.defaultChatImage, alt: "", "class": "friends-left"}),
							e("div", {"class": "friends-right", append: [
								e("div", {append: user ? e("strong", {html: getName(user)}) : null}),
								e("div", {"class": "tip", html: item.desc ? item.desc.safe() : ""}),
								e("div", {"class": "tip", html: item.email ? item.email.safe() : ""}),
								e("div", {"class": "tip", html: item.phone ? item.phone.safe() : ""})
							]})
						]
					});
				});

				modal.setContent(e("div", {append: list}));
			},
			modal = new Modal({
				title: lg("groups.modalContactsTitle"),
				noPadding: true,
				content: getLoader(),
				footer: [{
					name: "close",
					title: lg("general.close"),
					onclick: function() {
						this.close();
					}
				}]
			}).show();

		new APIRequest("execute", {
			code: "var u=API.groups.getById({group_id:Args.g,fields:\"contacts\",v:5.52})[0].contacts;return{l:u,u:API.users.get({user_ids:u@.user_id,fields:\"photo_50,online,screen_name\"})};",
			g: groupId
		}).setOnCompleteListener(showContent).execute();
	},

	getRequests: function(screenName) {
		Site.API("execute", {
			code: "var g=API.utils.resolveScreenName({screen_name:\"%s\",v:5.28}),i;if(g.type!=\"group\")return{};i=g.object_id;return{i:i,g:API.groups.getById({group_id:i,v:5.28}),r:API.groups.getRequests({group_id:i,count:50,offset:%o,fields:\"photo_50,sex,screen_name\",v:5.28})};"
					.replace(/%s/img, screenName)
					.replace(/%o/img, parseInt(getOffset()) || 0)
		}, function(data) {
			data = Site.isResponse(data);

			Local.add(data.g);
			var groupId = data.i;
			data.r = data.r || {count: 0, items: []};
			data.r.groupId = groupId;
			Groups.showRequests(data.r);
		});
	},
	showRequests: function(data) {
		var e = $.e,
			groupId = data.groupId,
			group = Local.Users[-groupId],
			count = data.count,
			data = data.items,
			wrap = e("div"),
			list = e("div"),
			item = function(u) {
				var q;
				q = e("div", {"class": "friends-item", append: [
					e("img", {"class": "friends-left", src: getURL(u.photo_50)}),
					e("div", {"class": "friends-right", append: [
						e("strong", {append: e("a", {href: "#" + u.screen_name, html: getName(u)})}),
						e("div", {"class": "friends-action", append: [
							e("input", {type: "button", value: "Принять", onclick: function(event) {
								Groups.approveRequest({
									button: this,
									wrap: q,
									groupId: groupId,
									userId: u.id
								});
							}}),
							e("input", {type: "button", value: "Отклонить", onclick: function(event) {
								Groups.removeRequest({
									button: this,
									wrap: q,
									groupId: groupId,
									userId: u.id
								});
							}})
						]})
					]})
				]});
				list.appendChild(q);
			};
		if (data.length)
			Array.prototype.forEach.call(data, item);
		else
			list.appendChild(getEmptyField("Нет заявок на вступление"));

		wrap.appendChild(Site.getPageHeader(count + " заяв%s на вступление".replace(/%s/img, $.textCase(count, ["ка", "ки", "ок"]))));
		wrap.appendChild(list);
		wrap.appendChild(Site.PagebarV2(getOffset(), count, 50));
		Site.append(wrap);
		Site.setHeader("Заявки на вступление", {link: group.screen_name});
	},
	approveRequest: function(opts) {
		Site.API("groups.approveRequest", {
			group_id: opts.groupId,
			user_id: opts.userId
		}, function(data) {
			data = Site.isResponse(data);
			opts.wrap.style.opacity = .5;
			$.elements.remove(opts.button.nextSibling);
			$.elements.remove(opts.button);
		});
	},
	removeRequest: function(opts) {
		opts.request = true;
		Groups.deleteUser(opts);
	},
	deleteUser: function(opts) {
		Site.API("groups.removeUser", {
			group_id: opts.groupId,
			user_id: opts.userId
		}, function(data) {
			data = Site.isResponse(data);
			opts.wrap.style.opacity = .5;
			if (opts.request) {
				$.elements.remove(opts.button.previousSibling);
				$.elements.remove(opts.button);
			};
		});
	},
	Members: function(screen_name, offset) {
		var sort = Site.Get("sort") || "id_asc";
		Site.API("execute", {
			code:'var i=API.utils.resolveScreenName({screen_name:"' + screen_name + '",v:5.24}).object_id;return {members:API.groups.getMembers({group_id:i,count:40,offset:' + offset + ',sort:"' + sort + '",fields:"photo_50,online,screen_name,first_name_gen,last_name_gen",v:5.24%f}),group:API.groups.getById({group_id:i,v:5.24})[0]};'.replace(/%f/img, Site.Get("onlyFriends") ? ",filter:\"friends\"" : "")
		}, function(data) {
			var parent = document.createElement("div"),
				list = document.createElement("list");
			if (data.error)
				return Site.Alert({text: "Members is unavailable"});
			data = Site.isResponse(data);
			var count = data.members.count,
				members = data.members.items,
				group = data.group,
				groupId = group.id,
				changeSort = function(sort) {window.location.hash = "#" + screen_name + "?act=members&sort=" + sort;};
			Local.add(members);
			parent.appendChild(
				Site.getPageHeader(
					Lang.get("groups.members_in_group") + count + " " + Lang.get("groups", "members_members", count),
					group.is_admin ? Site.CreateDropDownMenu("Сортировка", {
						"Вошедшие по убыванию": function() {changeSort("time_desc");},
						"Вошедшие по возврастанию": function() {changeSort("time_asc");},
						"ID по убыванию": function() {changeSort("id_desc");},
						"ID по возврастанию": function() {changeSort("id_asc");}
					}) : null
				)
			);
			parent.appendChild(Site.CreateTopButton({tag: "a", link: "search?group_id=" + groupId, title: "Поиск по участникам"}));
			var id, name, wrap;
			Array.prototype.forEach.call(members, function(m) {
				id = m.id;
				name = m.first_name_gen + " " + m.last_name_gen
				list.appendChild(wrap = Templates.getUser(m, {
					fulllink: true,
					close: group.is_admin ? (function(i, n, w) { return function(event) {
						event.preventDefault();
						if (!confirm("Вы уверены, что хотите удалить " + n + " из группы?"))
							return;
						Groups.deleteUser({
							wrap: w,
							button: this,
							groupId: groupId,
							userId: i
						});
						return false;
					}})(id, name, wrap) : false
				}));
			});
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(offset, count, 40));
			Site.setHeader("Участники", {link: screen_name});
			Site.append(parent);
		})
	},

	getInvites: function() {
		new APIRequest("execute", {
			code:'var g=API.groups.getInvites({count:200,fields:"members_count",v:5.14});return{g:g,u:API.users.get({user_ids:g.items@.invited_by,fields:"online,screen_name,sex"})};'
		}).setOnCompleteListener(function(result) {
			Local.add(result.u);

			Groups.showInvites(result.g);
		}).execute();
	},

	showInvites: function(data) {
		var e = $.e,
			wrap = e("div"),
			list = e("div"),
			count = data.count,
			groups = data.items;

		wrap.appendChild(Groups.getTabs(API.userId));
		wrap.appendChild(Site.getPageHeader(
			count
				? lg("groups.invitesHead").schema({ n: count, g: lg("groups.toGroups", count)})
				: lg("groups.invitesHeadEmpty")
		));

		if (count) {
			for (var i = 0, l = groups.length, group; group = groups[i]; ++i) {
				list.appendChild(Groups.itemList(group, { request: true }));
			};
		} else {
			list.appendChild(getEmptyField(lg("groups.invitesContentEmpty")));
		};

		wrap.appendChild(list);
		Site.setHeader(lg("groups.invitesTitle"));
		Site.append(wrap);
	},

	Search: function() {
		var parent = document.createElement("div"),
			list = document.createElement("div");
		list.id = "groups-search-list";
		var tabs = [
				["groups", "Все <i class='count'>" + formatNumber(Groups.Groups[API.userId] && Groups.Groups[API.userId].count || "") + "<\/i>"]
			],
			admins = 0;
		if (Groups.Groups[API.userId] && Groups.Groups[API.userId].items)
			for (var i = 0, l = Groups.Groups[API.userId].items.length; i < l; ++i)
				if (Groups.Groups[API.userId].items[i].is_admin)
					admins++;
		if (admins > 0)
			tabs.push(["groups?section=admin", "Управление <i class='count'>" + admins + "</i>"]);
		if (Site.Counters && Site.Counters.groups > 0)
			tabs.push(["groups?act=invites", "Приглашения <i class='count'>" + Site.Counters.groups + "</i>"]);
		tabs.push(["groups?act=recommends", "Рекомендованное"]);
		tabs.push(["groups?act=search", "Поиск"]);
		parent.appendChild(Site.CreateTabPanel(tabs));
		parent.appendChild(Site.getPageHeader("<span id=\"groups-search-tip\">Введите критерии поиска<\/span>"));
		var form = Site.CreateInlineForm({
			name: "q",
			title: "Поиск",
			value: decodeURI(Site.Get("q") || ""),
			onsubmit: function() {
				window.location.hash = "#groups?act=search&q=" + encodeURI(this.q.value) + "&sort=" + this.sort.options[this.sort.selectedIndex].value;
				return false;
			}
		});
		var sort = $.e("select", {name: "sort", append: [
			$.e("option", {value: 0, html: "по количеству пользователей"}),
			$.e("option", {value: 1, html: "по скорости роста"}),
			$.e("option", {value: 2, html: "по отношению дневной посещаемости к количеству пользователей"}),
			$.e("option", {value: 3, html: "по отношению количества лайков к количеству пользователей"}),
			$.e("option", {value: 4, html: "по отношению количества комментариев к количеству пользователей"}),
			$.e("option", {value: 5, html: "по отношению количества записей в обсуждениях к количеству пользователей"})
		]});
		if (Site.Get("sort"))
			sort.options.selectedIndex = parseInt(Site.Get("sort"));
		form.appendChild($.e("div", {"class": "sf-wrap", append: [sort]}));
		parent.appendChild(form);
		parent.appendChild(list);
		Site.setHeader("Поиск", {link: "groups"});
		Site.append(parent);
	},
	RequestSearch: function(form) {
		try {
			var test = $.element("groups-search-list").className;
		} catch (e) {
			Groups.Search();
		} finally {
			var q = form.q,
				sort = form.sort;
			Site.APIv5("groups.search", {
				q: q,
				sort: sort,
				offset: form.offset,
				count: 50,
				fields: "members_count,city",
				v: 5.14
			}, function(data) {
				data = Site.isResponse(data);
				var count = data.count;
				data = data.items;
				$.element("groups-search-tip").innerHTML = Lang.get("groups", "search_founded", count) + " " + count + " " + Lang.get("groups", "search_groups", count);
				$.elements.clearChild($.element("groups-search-list"));
				for (var i = 0, l = data.length; i < l; ++i)
					$.element("groups-search-list").appendChild(Groups.Item(data[i]));
				$.element("groups-search-list").appendChild(Site.PagebarV2(getOffset(), count, 50));
			});
		}
		return false;
	},
	Blacklist:{
		Request: function(screen_name, offset) {
			Site.API("execute", {
				code:'var g=API.groups.getById({group_id:"' + screen_name + '",v:5.14})[0],b=API.groups.getBanned({group_id:g.id,count:40,offset:' + offset + ',fields:"photo_rec,online,screen_name"});return [b,API.users.get({user_ids:b.items@.ban_info@.admin_id,fields:"sex"}),g];'
			}, function(data) {
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
				if(group.is_admin == 0)
					return window.location.hash = "#" + screen_name;
				Local.add(data[0].items.concat(data[1]).concat([group]));
				parent.appendChild(Site.getPageHeader(
					Lang.get("groups.bl_in") + count + " " + Lang.get("groups", "bl_users", count),
					$.e("span", {"class": "fr bold a", html: "Забанить", onclick: function(event) {
						this.innerHTML = $.elements.hasClass(form, "hidden") ? "Скрыть" : "Забанить";
						$.elements.toggleClass(form, "hidden");
					}})
				));
				parent.appendChild((function(f) {
					f.onsubmit = function(event) {
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
							code: 'var uid=API.utils.resolveScreenName({screen_name:"' + uid + '",v: 5.14});if(uid.type!="user")return -1;else uid=uid.object_id;return [API.groups.banUser({user_id:uid,group_id:' + gid + ',reason:' + reason + ',comment:"' + Site.AddSlashes(comment) + '",comment_visible:' + comment_visible + ',end_date:' + end_date + '}),API.users.get({user_ids:uid,fields:"photo_rec,online,screen_name"})[0]];'
						}, function(data) {
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
					var e = $.e;
					f.appendChild(e("div", {"class": "tip tip-form", html: "Пользователь"}));
					f.appendChild(e("input", {type: "text", name: "user", required: true}));
					f.appendChild(e("div", {"class": "tip tip-form", html: "Причина"}));
					f.appendChild(e("select", {name: "reason", append: (function(a, b) {
						for (var i = 1, l = a.length; i < l; ++i)
							b.push(e("option", {html: a[i], value: i}));
						return b;
					})(reasons, [])}));
					f.appendChild(e("div", {"class": "tip tip-form", html: "Срок"}));
					f.appendChild(e("select", {name: "end_date", append: (function() {
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
				parent.appendChild((function(l, u) {
					for(var i = 0, k = u.length; i < k; ++i)
						l.appendChild(Groups.Blacklist.Item(u[i], 0, gid));
					return l;
				})(list,users));
				Site.setHeader("Черный список сообщества", {link: screen_name});
				Site.append(parent);
			});
		},
		Item: function(c, animation, gid) {
			var info = c.ban_info,
				user_id = c.id,
				admin = Local.Users[info.admin_id],
				actions,
				item = Templates.getUser(c, {a: console.log(c, info), actions: [
					actions = $.e("div", {"class": "tip", append: [
						$.e("span", {html: Lang.get("groups.bl_blocked")[admin.sex || 2] + " "}),
						$.e("a", {href: "#" + admin.screen_name, html: admin.first_name + " " + admin.last_name + Site.isOnline(admin)}),
						$.e("span", {html: " " + $.getDate(info.date) + " " + (!info.end_date > 0 ? " навсегда" : Lang.get("groups.bl_until") + " " + $.getDate(info.end_date))})
					]})],
					close: function(event) {
						var e = this;
						Site.API("groups.unbanUser", {
							group_id: gid,
							user_id: user_id
						}, function(data) {
							var user = Local.Users[user_id];
							$.elements.clearChild(actions);
							actions.appendChild($.e("span", {"class": "tip", html: Lang.get("groups.bl_deleted")[user.sex || 0] + Lang.get("groups.bl_deleted_from")}));
						});
					}
				});
			if (animation)
				$.elements.addClass(item, "docs-saved");
			return item;
		}
	},
	Stat: {
		Request: function(screen_name) {
			var convertDate = function(unixtime) {
					var date = new Date(unixtime * 1000),
						n2 = function(n) {return (n >= 10 ? n : "0" + n);}
					return [date.getFullYear(), n2(date.getMonth() + 1), n2(date.getDate())].join("-");
				},
				from = Site.Get("date1") || convertDate((+new Date() - (1000 * 86400 * 14)) / 1000),
				to = Site.Get("date2") || convertDate(+new Date() / 1000);
			Site.API("execute", {
				code:
					'var a=API.utils.resolveScreenName({screen_name:"' + screen_name + '"});'+
					'if(a.type!="group")'+
						'return -1;'+
					'else '+
						'return API.stats.get({group_id:a.object_id,date_from:"%from%",date_to:"%to%"});'
					.replace(/\%from\%/img, from)
					.replace(/\%to\%/img, to),
				v: 5.14
			}, function(data) {
				var script = document.createElement("script");
				script.src = "/Chart.min.js";
				script.onload = function(event) {
					Groups.Stat.page(data, screen_name);
				};
				document.getElementsByTagName("head")[0].appendChild(script);
			});
		},
		page: function(data, screen_name) {
			data = Site.isResponse(data);
			console.log(data);
			var parent = document.createElement("div"),
				h = function(title) {
					return $.e("div", {"class": "bold", style: "color:#66768F;border-bottom: 1px solid #DFDFDF;padding: 4px 3px;margin:2px 12px 0;", html: title});
				};
			parent.appendChild(Site.getPageHeader("Статистка", Site.CreateDropDownMenu("Действия", {
				"Выгрузить в файл": function() {}
			})));
			var g = Groups.Stat.getLines(data);
			parent.appendChild(h("Визиты"));
			parent.appendChild(Groups.Stat.getGraph(data, "visitors"));
			parent.appendChild(h("Просмотры"));
			parent.appendChild(Groups.Stat.getGraph(data, "views"));
			parent.appendChild(h("Новые подписчики"));
			parent.appendChild(Groups.Stat.getGraph(data, "subscribed"));
			parent.appendChild(h("Охват"));
			parent.appendChild(Groups.Stat.getGraph(data, "reach"));
			parent.appendChild(h("Охват подписчиков"));
			parent.appendChild(Groups.Stat.getGraph(data, "reach_subscribers"));
//			parent.appendChild(h("Возраст"));
//			parent.appendChild(Groups.Stat.getAges(data));
			parent.appendChild(h("Пол"));
			parent.appendChild(Groups.Stat.getSex(data));
			parent.appendChild(h("Страны"));
			parent.appendChild(g[2]);
			parent.appendChild(h("Города"));
			parent.appendChild(g[3]);
			Site.setHeader("Статистика сообщества", {link: screen_name});
			Site.append(parent);
		},
		CONST_VK_COLOR: "#66768F",
		text: function(ctx, color, x, y, text, align, maxHeight) {
			ctx.beginPath();
			ctx.textBaseline = "top";
			ctx.textAlign = align || "left";
			ctx.fillStyle = color || "black";
			ctx.font = "11px Tahoma";
			ctx.fillText(text, x + 0.5, y + 0.5, maxHeight);
			ctx.closePath();
			return ctx;
		},
		line: function(ctx, color, x1, y1, x2, y2, strong) {
			ctx.beginPath();
			ctx.strokeStyle = color || "black";
			ctx.lineWidth = strong || 1;
			ctx.moveTo(x1 + 0.5, y1 + 0.5);
			ctx.lineTo(x2 + 0.5, y2 + 0.5);
			ctx.stroke();
			ctx.closePath();
			return ctx;
		},
		rect: function(ctx, color, x, y, w, h) {
			ctx.beginPath();
			ctx.fillStyle = color || "black";
			ctx.fillRect(x, y, w, h);
			ctx.closePath();
			ctx.stroke();
			return ctx;
		},
		getGraph: function(data, field) {
			var canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d"),
				labels = [],
				datas = [];
			canvas.width = 600;
			canvas.width = 550;
			for (var i = 0; i < data.length; ++i) {
				labels.push(data[i].day.split("-").reverse().slice(0, 2).join("."));
				datas.push(data[i][field]);
			}
			new Chart(ctx).Line({
					labels: labels,
					datasets: [
						{
							fillColor: "#DAE1E9",
							strokeColor: "#597DA3",
							pointColor: "#fff",
							pointStrokeColor: "#597DA3",
							data: datas
						}
					]
				}, {animation: false});
			return canvas;
		},
		getSex: function(data) {
			var canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d"),
				vals = [{value: 0, color: "#B05C91"}, {value: 0, color: "#597DA3"}];
			for (var i = 0, l = data.length; i < l; ++i)
				for (var k = 0; k < data[i].sex.length; ++k)
					vals[{m:1,f:0}[data[i].sex[k].value]].value += data[i].sex[k].visitors;
			new Chart(ctx).Pie(vals ,{animation: false});
			return canvas;
		},
		getAges: function(data) {
			var canvas = document.createElement("canvas"),
				ctx = canvas.getContext("2d"),
				labels = [],
				values = [];
			for (var i = 0; i < data.length; ++i) {
				for (var k = 0; k < data[i].age.length; ++k)
					if (labels[data[i].age[k].value])
						values[data[i].age[k].value].data[0] += data[i].age[k].visitors;
					else {
						labels.push(data[i].age[k].value);
						values[data[i].age[k]] = {fillColor: "blue", strokeColor: "green", data: [data[i].age]};
					}
			}
			new Chart(ctx).Bar({labels: labels, datasets: values}, {animation: false});
			return canvas;
		},
		getLines: function(data) {
			var g = [
					document.createElement("canvas"), // age
					document.createElement("canvas"), // cities
					document.createElement("canvas"), // countries
					document.createElement("canvas")  // sex
				];
			for (var i = 0; i < g.length; ++i) {
				g[i].width = 300;
				g[i].style.display = "block";
				g[i].style.margin = "0 auto";
			}
			var counters = {
					age: [],
					cities: [],
					countries: [],
					sex: []
				},
				fields = "sex9age9cities9countries".split("9");
			for (var i = 0, l = data.length; i < l; ++i) {
				var q = data[i];
				for (var j = 0; j < fields.length; ++j)
					for (var k = 0; k < q[fields[j]].length; ++k)
						if (counters[fields[j]] && counters[q[fields[j]][k].value])
							counters[fields[j]][q[fields[j]][k].name || q[fields[j]][k].value] += q[fields[j]][k].visitors;
						else
							counters[fields[j]][q[fields[j]][k].name || q[fields[j]][k].value] = q[fields[j]][k].visitors
			}
//			g[0].height = Groups.Stat.getHeight(counters.age);
//          g[1].height = new Chart(ctx).Pie(data,options);
			g[2].height = Groups.Stat.getHeight(counters.countries);
			g[3].height = Groups.Stat.getHeight(counters.cities);
			var c = [g[0].getContext("2d"), g[1].getContext("2d"), g[2].getContext("2d"), g[3].getContext("2d")];
//			c[0] = Groups.Stat.getLine(c[0], counters.age);
//          c[1] = Groups.Stat.getLine(c[1], {Мужчины: counters.sex.m, Женщины: counters.sex.f});
			c[2] = Groups.Stat.getLine(c[2], counters.countries);
			c[3] = Groups.Stat.getLine(c[3], counters.cities);
			return g;
		},
		getHeight: function(items) {
			var h = 0;
			for (var a in items)
				h++;
			return 10 + h * 16;
		},
		getLine: function(ctx, items) {
			var i = 0, get = function(val) {
				return ((((val * 100) / all) * 200) / 100);
			},
			all = (function(a,b,c) {for((c)in(a))b+=a[c];return(b);})(items,0,null);
			for (var item in items) {
				Groups.Stat.rect(ctx, "#f0f0f0", 100, 2.5 + (i * 16), 200, 16);
				Groups.Stat.rect(ctx, "#d9dbe0", 100, 2.5 + (i * 16), get(items[item]), 16);
				Groups.Stat.text(ctx, Groups.Stat.CONST_VK_COLOR, 5, 5 + (i * 16), item, null, 100);
				Groups.Stat.text(ctx, Groups.Stat.CONST_VK_COLOR, 102.5, 5 + (i * 16), items[item]);
				i++;
			}
		}
	},
	showChangerPhoto: function(groupId) {
		var form = document.createElement("form"),
			frame = document.createElement("iframe");
		frame.name = "_uploader_photo";
		frame.id = "_uploader_photo";
		frame.onload = function(event) {
			if(getFrameDocument(this).location.href == "about:blank")
				return;
			var data = $.JSON(getFrameDocument(this).getElementsByTagName("body")[0].innerHTML);
			if (data.post_id) {
				window.location.hash = "#wall-" + groupId + "_" + data.post_id;
				Site.Alert({
					text: Lang.get("profiles.profile_photo_uploaded")
				});
			}
		};
		frame.src = "about:blank";
		frame.className = "hidden";
		form.className = "profile-uploader";
		form.method = "post";
		form.target = "_uploader_photo";
		form.enctype = "multipart/form-data";
		form.action = "/upload.php?act=photo_group&groupId=" + groupId;
		form.appendChild($.e("div", {"class":"tip", html: Lang.get("profiles.profile_photo_upload_tip")}));
		form.appendChild(Site.CreateFileButton("photo", {
			fullwidth: true,
			accept: "image/*"
		}));
		form.appendChild($.e("input",{type: "submit",value: "Загрузить фотографию"}));
		form.appendChild(frame);
		Site.append(form);
		Site.setHeader(Lang.get("profiles.profile_photo_upload"), {link: Local.Users[-groupId].screen_name});
		form.parentNode.insertBefore(Site.getPageHeader(Lang.get("profiles.profile_photo_upload")), form);
	}
};
