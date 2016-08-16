/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Profile = {
	RequestPage: function (screenName) {
		switch(Site.Get("act")) {

			// deprecated
			case "info":
				return Profile.ShowFullInfo(screenName);

			case "requests":
				return Groups.getRequests(screenName);

			// deprecated
			case "members":
				return Groups.Members(screenName, getOffset());

			// deprecated
			case "blacklist":
				return Groups.Blacklist.Request(screenName, getOffset());

			// deprecated
			case "stat":
				return Groups.Stat.Request(screenName);

			// deprecated
			case "followers":
				return Profile.Followers(screenName);

			// deprecated
			case "subscriptions":
				return Profile.Subscriptions(screenName, (Site.Get("type") ? 1 : 0));

			// deprecated
			case "links":
				return Groups.ShowLinks(screenName);

			// deprecated
			case "contacts":
				return Groups.ShowContacts(screenName);

			// deprecated
			case "search":
				return Feed.searchByOwner(screenName, Site.Get("q"), getOffset());

			// deprecated
			case "report":
				return Profile.ShowReportPage(screenName);

			// deprecated
			case "photo":
				var group = Local.getUserByDomain(screenName);
				if (!group || group && !group.is_admin)
					return setLocation(screenName);
				return Groups.showChangerPhoto(group.id || group.gid);

			default:



		}
	},


	display: function (user, wall) {
		var e = $.e,
			wrap = e("div", {"class": "profile"}),
			nodeInfo = e("div"),
			nodeMedia = e("div", {"class": "profile-media"}),

			info = user, // for compatible

			friendStatus = info.friend_status,
			counters = user.counters || {},
			userId = user.id,
			isDeleted = user.deactivated,
			isActive = !isDeleted,
			isFav = user.is_favorite,
			bl = user.blacklisted,
			thumb = user.crop_photo && user.crop_photo.photo && (user.crop_photo.photo.owner_id + "_" + user.crop_photo.photo.id) || user.photo_id;

		if (user.deactivated) {
			friendStatus = 3;
		};


		var photo = e("img", {src: getURL(user.photo_rec), alt: ""}),
			isPhoto = user.photo_id,
			location = [],
			status = Profile.getStatusNode(user);

		if (user.country && user.country.title) {
			location.push(user.country.title);
		};

		if (user.city && user.city.title) {
			location.push(user.city.title);
		};

		nodeInfo.appendChild(e("div", {
			"class": "profile-info",
			append: [
				e("div", {
					"class": "profile-left",
					append: isPhoto
						? e("a", { href: "#photo" + thumb, append: photo})
						: photo
				}),
				e("div", {
					"class": "profile-right",
					append: [
						e("strong", {
							html: user.first_name.safe() + " " + user.last_name.safe() + Site.isOnline(user, 1) + Site.isVerify(user)
						}),
						status,
				e("div", {"class": "tip", html: location.join(", ")}),
				(user.can_write_private_message && API.userId != userId ? e("a", {"class": "btn", href: "#im?to=u" + userId, html: Lang.get("profiles.actionWriteMessage"), style: "margin: 4px 0 2px; text-align: center;"}) : null)
			]})
		]}));

		wrap.appendChild(Site.getPageHeader(
			e("strong", {html: user.first_name.safe() + " " + user.last_name.safe() + (user.maiden_name ? " (" + user.maiden_name + ")" : "")}),
			new DropDownMenu(lg("general.actions"), Profile.getDisplayActions(user)).getNode()
		));

		if (isActive && !bl) {
			nodeInfo.appendChild(Site.getPageHeader(
				lg("profiles.info"),
				API.userId == userId
					? $.e("a", {
						"class": "fr",
						href: "#settings?act=profile",
						html: lg("profiles.info_edit")
					  })
					: null
			));

			var infoRow = function (name, value, format) {
				return e("div", {
					"class": "group-info-item",
					append: [
						e("div", {
							"class": "group-info-name",
							html: name
						}),
						e("div", {
							"class": "group-info-value",
							html: typeof value === "string"
								? format
									? Site.Format(value)
									: value
								: "",
							append: typeof value === "string" ? [] : [value]
						})
				]});
			};

			if (user.mobile_phone) {
				nodeInfo.appendChild(infoRow(lg("profiles.infoMobilePhone"), user.mobile_phone));
			};

			if (user.home_phone) {
				nodeInfo.appendChild(infoRow(lg("profiles.infoHomePhone"), user.home_phone));
			};

			if (user.home_town) {
				nodeInfo.appendChild(infoRow(lg("profiles.infoHomeCity"), user.home_town));
			};

			if (user.bdate) {
				var b = info.bdate.split("."),
					months = lg("general.months"),
					birthday = b[0] + " " + months[b[1] - 1] + (b[2] ? " " + b[2] : "");

				nodeInfo.appendChild(infoRow(lg("profiles.birthday"), birthday));
			};

			nodeInfo.appendChild($.e("a", {
				html: Lang.get("profiles.full_info"),
				href: "#" + info.screen_name + "?act=info",
				"class": "profile-gotofullinfo"
			}));

// точка конца рефакторинга


			if (API.userId == userId) {
				info.common_count = 0;
			};

			var csg = info.can_see_gifts;
			var q = {
				friends:        ["friends?id=" + userId,                       Lang.get("profiles.counters_friends")],
//              online_friends: ["friends" + userId + "?section=online",       "Друзья онлайн"],
				common_count:   ["friends?id=" + userId + "&act=mutual",       Lang.get("profiles.counters_common_friends")],
				groups:         ["groups?user_id=" + userId,                   Lang.get("profiles.counters_groups")],
				albums:         ["photos"+userId,                              Lang.get("profiles.counters_albums")],
//              user_photos:    ["photos" + userId + "?act=tagged",            "Фотографии с " + info.first_name_ins],
				photos:         ["photos"+userId+"?act=all",                   Lang.get("profiles.counters_photos")],
				videos:         ["videos"+userId,                              Lang.get("profiles.counters_videos")],
//              user_videos:    ["videos" + userId + "?act=tagged",            "Видео с " + info.first_name_ins],
				audios:         ["audio?oid="+userId,                          Lang.get("profiles.counters_audios")],
				notes:          ["notes" + userId,                             Lang.get("profiles.counters_notes")],
				followers:      [info.screen_name + "?act=followers",       Lang.get("profiles.counters_followers")],
				subscriptions:  [info.screen_name + "?act=subscriptions",   Lang.get("profiles.counters_subscriptions"), counters.subscriptions + counters.pages],
			},
				d = [Site.CreateHeader(Lang.get("profiles.counters_additional"))];
			for(var current in q)
				if(counters[current] || info[current] || q[current][2])
					d.push($.e("a", {
						href:"#" + q[current][0],
						html: q[current][1] + " <i class='count'>" + formatNumber(q[current][2] || counters[current] || info[current]) + "<\/i>"
					}))

			d.push($.e("a", {
				href:"#" + (csg ? "gifts?userId="+userId : "gifts?act=send&toId="+userId),
				html: csg ? Lang.get("profiles.counters_gifts") + " <i class=count>" + formatNumber(counters.gifts) + "<\/i>" : Lang.get("profiles.counters_gifts_send")
			}));
			if (isActive && wall && wall.count)
				d.push($.e("a", {
					href:"#" + info.screen_name + "?act=search",
					html: "Поиск по стене " + info.first_name_gen
				}));

			// начало рефакторинга

			nodeMedia.appendChild(e("div", {
				"class": "profile-last profile-lists", append: d
			}));

			wrap.appendChild(nodeInfo);
			wrap.appendChild(nodeMedia);

			if (wall.count > 0 || user.can_post) { // TODO: rename
				wrap.appendChild(Wall.RequestWall(userId, {
					data: wall,
					can_post: info.can_post,
					extra:user.e
				}));
			};

		} else if (!isActive) {

			nodeInfo.appendChild(getEmptyField({
				deleted: Lang.get("profiles.profileDeleted"),
				banned: Lang.get("profiles.profileBanned")
			}[isDeleted]));
			wrap.appendChild(nodeInfo);

		} else {

			nodeInfo.appendChild(getEmptyField(lg("profiles.blocked").schema({
				n: getName(user), a: lg("profiles.blockedVerb")[user.sex]
			})));
			wrap.appendChild(nodeInfo);
		}
		Site.setHeader(lg("profiles.pageHead").schema({n: info.first_name_gen}));
		Site.append(wrap);
	},

	getDisplayActions: function(user) {
		var result = {}, isActive = !user.deactivated, status = user.friend_status;

		if (API.userId != user.id) {

			switch (status) {
				case 0:
				case 2:
					result["friendButton"] = {
						label: lg(!status == 0 ? "profiles.actionFriendAdd" : "profiles.actionFriendAccept"),
						onclick: function (item) {
							// friends.add
							// result: [
							// Lang.get("profiles.acts_friend_sent"),
							// Lang.get("profiles.acts_friend_agreed"),
							// null,
							// Lang.get("profiles.acts_friend_secondarary")
							// ][data - 1]
						}
					};
					if (status == 2) {
						result["friendReject"] = {
							label: lg("profiles.actionFriendReject"),
							onclick: function (item) {
								// friends.delete
								// Lang.get("profiles.request_cancelled")
							}
						};
					};
					break;

				case 1:
				case 3:
					result["friendButton"] = {
						label: lg(!(status - 1) ? "profiles.actionFriendCancel" : "profiles.actionFriendDelete"),
						onclick: function (item) {
							// friends.delete
							// [
							// Lang.get("profiles.acts_friend_deleted"),
							// Lang.get("profiles.acts_friend_request_deleted"),
							// Lang.get("profiles.reccomendation_deleted")
							// ][data - 1]
						}
					};
					break;
			};

			if (isActive) {
				result["report"] = {
					label: lg("profiles.actionReport"),
					onclick: function(item) {
						Profile.showReportWindow(user);
					}
				};

				result["block"] = {
					label: lg(!user.blacklisted_by_me ? "profiles.actionBlock" : "profiles.actionUnblock"),
					onclick: function(item) {
						item
							.disable()
							.commit();

						Profile.toggleBlock(user, function() {
							item
								.label(lg(!user.blacklisted_by_me ? "profiles.actionBlock" : "profiles.actionUnblock"))
								.enable()
								.commit();
						});
					}
				};
			};
		};

		if (isActive) {
			result["registration"] = {
				label: lg("profiles.actionDateRegistration"),
				onclick: function(item) {
					Profile.showDateOfRegister(user.id);
				}
			};

			result["lastActivity"] = {
				label: lg("profiles.actionLastActivity"),
				onclick: function(item) {
					Profile.showLastActivity(user.id);
				}
			};
		};

		if (API.userId != user.id) {
			result["favorite"] = {
				label: lg(!user.is_favorite ? "profiles.actionFavoriteAdd" : "profiles.actionFavoriteRemove"),
				onclick: function(item) {
					item
						.disable()
						.commit();

					Profile.toggleFavorite(user, function() {
						item
							.label(lg(!user.is_favorite ? "profiles.actionFavoriteAdd" : "profiles.actionFavoriteRemove"))
							.enable()
							.commit();
					});
				}
			};
		};

		return result;
	},

	toggleBlock: function(user, callback) {
		var toBlock = !user.blacklisted_by_me;
		new APIRequest(toBlock ? "account.banUser" : "account.unbanUser", {
			userId: user.id
		}).debug().setOnCompleteListener(function(data) {
			new Snackbar({
				text: lg(toBlock ? "profiles.blockInfoAdded" : "profiles.blockInfoRemoved").schema({
					n: user.first_name.safe() + " " + user.last_name.safe(),
					a: lg(toBlock ? "profiles.blockInfoAddedVerb" : "profiles.blockInfoRemvoedVerb")[user.sex]
				})
			}).show();
			user.blacklisted_by_me = toBlock;
			callback && callback();
		}).execute();
	},

	toggleFavorite: function(user, callback) {
		var toFavorite = !user.is_favorite;
		new APIRequest(toFavorite ? "fave.addUser" : "fave.removeUser", {
			userId: user.id
		}).setOnCompleteListener(function(result) {
			new Snackbar({
				text: lg(toFavorite ? "profiles.favoriteAdded" : "profiles.favoriteRemoved").schema({
					n: user.first_name.safe() + " " + user.last_name.safe(),
					a: lg(toFavorite ? "profiles.favoriteAddedVerb" : "profiles.favoriteRemvoedVerb")[user.sex]
				})
			}).show();
			user.is_favorite = toFavorite;
			callback && callback();
		}).execute();
	},

	/**
	 * Возвращает DOMNode для статуса
	 * @param  {Object} user Объект пользователя
	 * @return {DOMNode}     DOM-объект
	 */
	getStatusNode: function(user) {
		var e = $.e,
			i = API.userId === user.id,
			s = (user.status || ""),
			a = user.status_audio;

		return !user.status_audio
			? e("div", {
				"class": (s ? "profile-status" : "") + (!s && i ? " tip" : ""),
				"data-status": s,
				onclick: i
					? Profile.editStatus
					: null,
				html: s.safe().emoji() || (i ? lg("profiles.statusChange") : "")
			  })
			  : Audios.Item(a, {
				from: 2,
				set: 32,
				lid: Audios.createList(a).lid,
				removeBroadcast: i,
				userId: user.id
			  });
	},

	editStatus: function(){
		if (this.dataset.opened === "opened") {
			return;
		};


		var text = this.dataset.status, node = this;
		this.dataset.opened = "opened";

		this.innerHTML = "";
		this.appendChild(Site.CreateInlineForm({
			name: "text",
			value: text,
			onsubmit: function (event) {
				event.preventDefault();
				var text = this.text.value.trim(),
					fText = this.text,
					fButton = this.submitbtninline;console.log(text);
				Profile.setStatus(text, function() {
					node.dataset.opened = ""
					node.dataset.status = text;
					node.innerHTML = text ? text.safe().emoji() : lg("profiles.statusChange");

					if (!text) {
						node.className = 'profile-status tip';
					};
				});
				return false;
			},
			title: lg("profiles.statusChangeSubmit")
		}));
		this.firstChild.text.focus();
	},

	/**
	 * Запрос на изменение статуса
	 * @param {String}   text     Текст
	 * @param {Function} callback Обработка ответа
	 */
	setStatus: function(text, callback){
		new APIRequest("status.set", {text: text}).setOnCompleteListener(callback).execute();
	},

	getRelationship: function (user) {
		var relation = user.relation,
			sex = user.sex == 1,
			partner = user.relation_partner || false,
			userPartner = partner ? Local.Users[partner.id] : {},
			str,
			prefix,
			nameCase,
			cases = [null, "ins", "abl", "acc"],
			e = e;

		switch (relation) {
			case 1: str = sex ? "не замужем" : "не женат"; break;
			case 2: str = partner ? "встречается" : (sex ? "есть друг" : "есть подруга"); prefix = "с"; nameCase = 1; break;
			case 3: str = sex ? "помолвлена" : "помолвлен"; prefix = "с"; nameCase = 1; break;
			case 4: str = sex ? "замужем" : "женат"; prefix = sex ? "за" : "на"; nameCase = 2; break;
			case 5: str = "всё сложно"; prefix = "с"; nameCase = 1; break;
			case 6: str = "в активном поиске"; break;
			case 7: str = sex ? "влюблена" : "влюблен"; prefix = "в"; nameCase = 3; break;
			default: str = ""; prefix = "";
		}
		nameCase = nameCase ? "_" + cases[nameCase] : "";
		return e("span", {append: [
			e("span", {html: str + (partner ? " " + prefix + " " : "")}),
			partner ? e("a", {html: userPartner["first_name" + nameCase] + " " + userPartner["last_name" + nameCase] + Site.isOnline(userPartner), href: "#" + userPartner.screen_name}) : null
		]});

	},
	ShowFullInfo:function(screen_name){
		Site.API("execute",{
			code:'var user=API.users.get({user_ids:"' + screen_name + '",fields:"photo_rec,online,last_seen,timezone,contacts,sex,rate,connections,activities,interests,movies,tv,books,games,about,quotes,music,schools,relatives,relation,education,screen_name,city,country,status,personal,home_town,first_name_gen,site,maiden_name",v:5.8})[0];var u=user.relatives@.id;if(user.relation_partner)u.push(user.relation_partner.id);return [user,API.users.get({user_ids:u,fields:"sex,online,screen_name,first_name_ins,last_name_ins,first_name_acc,last_name_acc,first_name_abl,last_name_abl"})];'
		}, function (data) {
			data = Site.isResponse(data);
			var elem = document.createElement("div"),
				profilehead = document.createElement("div"),
				tableinfo = document.createElement("div"),
				user = data[0],
				relatives = data[1];
			Local.AddUsers(relatives);
			elem.appendChild(Site.CreateHeader(Site.Escape(user.first_name + " " + user.last_name + (user.maiden_name ? " (" + user.maiden_name + ")" : ""))));
			profilehead.className="profile-info";
			profilehead.appendChild((function (u) {
				var parent = document.createElement("div"),
					photo = document.createElement("img"),
					info = document.createElement("div");
				photo.alt = "";
				photo.src = getURL(u.photo_rec);
				photo.className = "profile-left";
				info.className = "profile-right";
				info.appendChild(e("strong", {
					innerHTML: Site.Escape(u.first_name + " " + u.last_name) + " <span class=\"tip\">" + Site.isOnline(u) + "<\/span>"
				}));
				parent.appendChild(photo);
				parent.appendChild(info);
				return parent;
			})(user));
			var attitude = Lang.get("profiles.info_attitudes"),
				location = [];
			if (user.country && user.country.title)
				location.push(user.country.title);
			if (user.city && user.city.title)
				location.push(user.city.title);
			location = location.join(", ");
			var life_main = Lang.get("profiles.info_life_main"),
				people_main = Lang.get("profiles.info_people_main"),
				political = Lang.get("profiles.info_political"),
				d = [
				{
					title: Lang.get("profiles.info_general_head"),
					fields: [
						[user.bdate, Lang.get("profiles.info_birthday")],
						[user.relation ? Profile.getRelationship(user) : null, Lang.get("profiles.relation")],
						[user.home_town, Lang.get("profiles.home_city")],
						[user.personal && user.personal.langs ? user.personal.langs.join(", ") : "", Lang.get("profiles.info_languages")],
					]
				},
				{
					title: Lang.get("profiles.info_contacts_head"),
					fields: [
						[location, Lang.get("profiles.info_location")],
						[user.mobile_phone, Lang.get("profiles.mobile_phone")],
						[user.home_phone, Lang.get("profiles.home_phone")],
						[user.twitter ? e("a", {href: "https:\/\/twitter.com\/" + user.twitter, html: user.twitter, target: "_blank"}): null, "Twitter"],
						[user.facebook ? e("a", {href: "https:\/\/facebook.com\/profile.php?id=" + user.facebook, html: user.facebook_name, target: "_blank"}) : null, "Facebook"],
						[user.site ? (function (l) {
							l = l.split(" ");
							var links = document.createElement("div");
							for (var i = 0 , k = l.length; i < k; ++i) {
								l[i] = $.trim(l[i]);
								if (!/^https?:\/\//i.test(l[i]))
									l[i] = "http://" + l[i];
								links.appendChild(e("a", {href: l[i], html: l[i], target: "_blank"}));
							}
							return links;
						})(user.site) : null, Lang.get("profiles.info_site")],
						[user.skype ? e("a", {href: "skype:" + user.skype + "?call", html: user.skype, target: "_blank"}): null, "Skype"],
						[user.instagram ? e("a", {href: "https:\/\/instagram.com\/" + user.instagram, html: user.instagram, target: "_blank"}): null, "Instagram"],
						[user.livejournal ? e("a", {href: "https:\/\/" + user.livejournal + ".livejournal.com\/", html: user.livejournal, target: "_blank"}): null, "LiveJournal"]
					]
				},
				{},
				{
					title: Lang.get("profiles.info_education_head"),
					fields: user.schools ? (function (schools) {
						var d = [], item;
						for (var i = 0, l = schools.length; i < l; ++i) {
							item = schools[i];
							d.push([item.name + (item.year_from ? ", " + Lang.get("profiles.info_education_year_from") + " " + item.year_from : "") + (item.year_to ? " " + Lang.get("profiles.info_education_year_to") + " " + item.year_to : "") + (item["class"] ? " (" + Lang.get("profiles.info_education_class") + " \"" + item["class"] + "\")" : ""), item.type_str || Lang.get("profiles.info_education_school")]);
						}
						return d;
					})(user.schools) : []
				},
				{
					title: Lang.get("profiles.info_personal_head"),
					fields: [
						[user.personal && user.personal.religion, Lang.get("profiles.info_personal_religion")],
						[user.personal && user.personal.political ? political[user.personal.political] : null, Lang.get("profiles.info_personal_political")],
						[user.personal && user.personal.life_main ? life_main[user.personal.life_main] : null, Lang.get("profiles.info_personal_life_main")],
						[user.personal && user.personal.people_main ? people_main[user.personal.people_main] : null, Lang.get("profiles.info_personal_people_main")],
						[user.personal && user.personal.smoking ? attitude[user.personal.smoking] : null, Lang.get("profiles.info_personal_smoking")],
						[user.personal && user.personal.alcohol ? attitude[user.personal.alcohol] : null, Lang.get("profiles.info_personal_alcohol")],
						[user.personal && user.personal.inspired, Lang.get("profiles.info_personal_inspired")],
					]
				},
				{
					title: Lang.get("profiles.info_i_head"),
					fields: [
						[user.activities, Lang.get("profiles.info_i_activites")],
						[user.interests, Lang.get("profiles.info_i_interests")],
						[user.music, Lang.get("profiles.info_i_music")],
						[user.movies, Lang.get("profiles.info_i_movies")],
						[user.tv, Lang.get("profiles.info_i_tv")],
						[user.books, Lang.get("profiles.info_i_books")],
						[user.games, Lang.get("profiles.info_i_games")],
						[user.quotes, Lang.get("profiles.info_i_quotes")],
						[user.about, Lang.get("profiles.info_i_about")]
					]
				}
				];
				var cat, field, row = function (name, value, format) {
					if (!format && typeof value === "string")
						value = Site.Escape(value);
					return e("div", {"class": "group-info-item", append: [
						e("div", {"class": "group-info-name", html: name}),
						e("div", {
							"class": "group-info-value",
							html: (
								typeof value === "string" ?
										(
											format ?
												Site.Format(value) :
												value
										) : ""
								),
							append: (typeof value === "string" ? [] : value)
						})
					]});
				},
				join = function (array) {
					var result = $.e("div");
					for (var i = 0, l = array.length; i < l; ++i) {
						if (i)
							result.appendChild(document.createTextNode(", "));
						result.appendChild(array[i]);
					}
					return result;
				};
			if (user.relatives && user.relatives.length > 0) {
				var relatives = user.relatives, r = {}, item, type, rel, obj, reldata = [];
				for (var i = 0, l = relatives.length; i < l; ++i) {
					item = relatives[i];
					type = item.type;
					rel = Local.Users[item.id];
					rel = item.id > 0 ? {name: rel.first_name + " " + rel.last_name, id: item.id, sex: rel.sex} : {name: item.name, id: item.id, sex: 0};
					if (!r[type])
						r[type] = [rel];
					else
						r[type].push(rel);
				}
				var getLink = function (obj) {
					return e("span", {html: obj.id > 0 ? "<a href='#id" + obj.id + "'>" + obj.name + "</a>" : "<span>" + obj.name + "</span>"});
				}, parent;
				if (r.parent) {
					if (r.parent.length > 1)
						reldata.push([join([getLink(r.parent[0]), getLink(r.parent[1])]), Lang.get("profiles.relatives")]);
					else {
						parent = r.parent[0];
						reldata.push([getLink(parent), Lang.get("profiles.relative_sex")[parent.sex]]);
					}
				}
				if (r.grandparent) {
					if (r.grandparent.length > 1) {
						for (var i = 0, l = r.grandparent.length; i < l; ++i)
							r.grandparent[i] = getLink(r.grandparent[i]);
						reldata.push([join(r.grandparent), Lang.get("profiles.grandparents")]);
					} else {
						parent = r.grandparent[0];
						reldata.push([getLink(parent), Lang.get("profiles.grandparent_sex")[parent.sex]]);
					}
				}

				if (r.child) {
					if (r.child.length > 1) {
						for (var i = 0, l = r.child.length; i < l; ++i)
							r.child[i] = getLink(r.child[i]);
						reldata.push([join(r.child), Lang.get("profiles.children")]);
					} else {
						parent = r.child[0];
						reldata.push([getLink(parent), Lang.get("profiles.child_sex")[parent.sex]]);
					}
				}
				if (r.grandchild) {
					if (r.grandchild.length > 1) {
						for (var i = 0, l = r.grandchild.length; i < l; ++i)
							r.grandchild[i] = getLink(r.grandchild[i]);
						reldata.push([join(r.grandchild), Lang.get("profiles.grandchildren")]);
					} else {
						parent = r.grandchild[0];
						reldata.push([getLink(parent), Lang.get("profiles.grandchild_sex")[parent.sex]]);
					}
				}
				d[2] = {title: Lang.get("profiles.info_relatives_head"), fields: reldata};
			}
			var q = 0;
			for (var i = 0, l = d.length; i < l; ++i) {
				cat = d[i];
				q = 0;
				if (cat.fields)
					for (var k = 0, j = cat.fields.length; k < j; ++k)
						if (!!cat.fields[k][0])
							q++;
				if (!cat.fields || cat.fields.length == 0 || q == 0)
					continue;
				tableinfo.appendChild(Site.CreateHeader(cat.title));
				for (var k = 0, j = cat.fields.length; k < j; ++k) {
					field = cat.fields[k];
					if (!field[0])
						continue;
					tableinfo.appendChild(row(field[1], field[0], 2 == i));
				}
			}
			elem.appendChild(profilehead);
			elem.appendChild(tableinfo);
			Site.Append(elem);
			Site.SetHeader(Site.Escape(user.first_name + " " + user.last_name), {link: user.screen_name});
		});
	},

	// fallback
	FindIDByScreenName:function(a,c){c=Local.Users;if(/^(id|club)\d+$/img.test(a)){return(/^(id|club)(\d+)$/img.exec(a))[2];}else{for(var b in c){if(c[b].a == a){return(c[b].userId || -c[b].gid || (c[b].name ? -c[b].id : c[b].id))}}};return 0;},

	// fallback
	ItemListProfile: function (user) {
		return Templates.getMiniUser(user);
	},

	/**
	 * Открывает модальное окно, загружает и выводит информацию о подписчиках юзера screenName
	 * @param  {String} screenName Скрин нейм пользователя
	 */
	showFollowers: function(screenName) {
		var
			e = $.e,
			offset = 0,
			step = 100,
			allLoaded = false,
			wrap = e("div", {"class": "listView-wrap", append: getLoader()}),
			modal = new Modal({
				title: lg("profiles.modalFollowersTitleLoading"),
				content: wrap,
				noPadding: true,
				footer: [{
					name: "close",
					title: lg("general.close"),
					onclick: function() { this.close() }
				}]
			}).show(),
			load = function(callback) {
				new APIRequest("execute", {
					code: "var i=API.utils.resolveScreenName({screen_name:Args.d}).object_id;return{u:API.users.get({user_id:i,fields:Args.f,name_case:\"gen\",v:5.52})[0],d:API.users.getFollowers({user_id:i,count:Args.c,fields:Args.f,offset:parseInt(Args.o),v:5.52})};",
					d: screenName,
					c: step,
					f: "screen_name,first_name_gen,first_name_gen,photo_50,verified,online",
					o: offset
				}).setOnCompleteListener(function(data) {
					if (!offset) {
						$.elements.clearChild(wrap);
					};

					modal.setTitle(lg("profiles.modalFollowersTitle").schema({n: data.u.first_name}));
					(data.d.items || []).map(function(u) {
						wrap.appendChild(Templates.getMiniUser(u));
					});

					if (wrap.children.length >= data.d.count) {
						allLoaded = true;
					};

					offset += data.d.items.length;

					callback && callback();

				}).execute();
			};

		setSmartScrollListener(wrap.parentNode, function(reset) {
			!allLoaded && load(reset);
		});

		load();
	},

	/**
	 * Открывает модальное окно, загружает и выводит информацию о подписках юзера screenName
	 * @param  {String} screenName Скрин нейм пользователя
	 */
	showSubscriptions: function(screenName) {
		var
			e = $.e,
			offset = 0,
			step = 100,
			allLoaded = false,
			wrap = e("div", {"class": "listView-wrap", append: getLoader()}),
			modal = new Modal({
				title: lg("profiles.modalSubscriptionsTitleLoading"),
				content: wrap,
				noPadding: true,
				footer: [{
					name: "close",
					title: lg("general.close"),
					onclick: function() { this.close() }
				}]
			}).show(),
			load = function(callback) {
				new APIRequest("execute", {
					code: "var i=API.utils.resolveScreenName({screen_name:Args.d}).object_id;return{u:API.users.get({user_id:i,fields:Args.f,name_case:\"gen\",v:5.52})[0],d:API.users.getSubscriptions({user_id:i,count:Args.c,extended:1,fields:Args.f,offset:parseInt(Args.o),v:5.52})};",
					d: screenName,
					c: step,
					f: "screen_name,first_name_gen,first_name_gen,photo_50,verified,online,sex",
					o: offset
				}).setOnCompleteListener(function(data) {
					if (!offset) {
						$.elements.clearChild(wrap);
					};

					modal.setTitle(lg("profiles.modalSubscriptonsTitle").schema({n: data.u.first_name}));
					(data.d.items || []).map(function(u) {
						wrap.appendChild(Templates.getMiniUser(u));
					});

					if (wrap.children.length >= data.d.count) {
						allLoaded = true;
					};

					offset += data.d.items.length;

					callback && callback();

				}).execute();
			};

		setSmartScrollListener(wrap.parentNode, function(reset) {
			!allLoaded && load(reset);
		});

		load();
	},

	/**
	 * Показывает дату регистрации пользователя
	 * @param  {int} userId Идентификатор пользователя
	 */
	showDateOfRegister: function(userId) {
		APIdogRequest("apidog.getUserDateRegistration", {
			userDomain: userId
		}, function (data) {

			if (data.error) {
				return new Snackbar({text: "Ошибка запроса"}).show();
			};

			var user = data.user,

				text = user.firstName + " " + user.lastName + " " + lg("profiles.registeredVerb")[user.sex] + " " + lg("general.dateAt") + data.time + " (" + formatNumber(data.days) + " " + lg("profiles.registeredAgo", data.days) + ")";

			return new Snackbar({text: text}).show();
		});
	},

	/**
	 * Показывает дату последнего посещения
	 * @param  {int} userId Идентификатор пользователя
	 */
	showLastActivity: function(userId) {
		new APIRequest("execute", {
			code: "var u=API.users.get({user_ids:Args.u,fields:\"last_seen,sex,online\",v:5.28})[0],a,t=API.utils.getServerTime()-u.last_seen.time;if(!u)return 0;if(u.online_app)a=API.apps.get({app_id:u.online_app});return{u:u,t:t,a:a};",
			u: userId
		}).setOnCompleteListener(function(data) {
			var user = data.u,
				app = data.a,
				left = data.t,
				startString = user.first_name + " " + Lang.get("general.was_sex")[user.sex] + " ",
				platformId = user.last_seen.platform,

				computeDifferentTime = function(d) {
					var t = [Math.floor(d / 60 % 60), Math.floor(d % 60)];
					return (
						t[0] > 0
							? t[0] + " " + Lang.get("profiles", "wasMinutesAgo", t[0]) + lg("general.and")
							: ""
					) +
					t[1] +
					" " +
					Lang.get("profiles", "wasSecondsAgo", t[1]) + lg("profiles.wasAgo");
				};

			platformId = platformId === 1 || platformId === 7 ? false : platformId;

			user.online_mobile = user.online_mobile || platformId === 1;
			user.online = user.online || platformId === 7;

			new Snackbar({
				text:
					startString +
					(left > 3600
						? $.getDate(user.last_seen && user.last_seen.time || 0)
						: computeDifferentTime(left)
					) + (
						app || platformId
							? lg("wasViaApp").schema({n: (app && app.title || ["мобильный", "iPhone", "iPad", "Android", "Windows Phone", "Windows 8", "ПК"][platformId - 1])})
							: lg(user.online_mobile ? "profiles.wasViaMobile" : "profiles.wasViaPC")
					)
			}).show();
		}).execute();
	},


	ShowReportPage: function (screen_name) {
		Site.API("users.get", {
			user_ids: screen_name,
			fields: "photo_rec,online,screen_name",
			name_case: "gen"
		}, function (data) {
			user = Site.isResponse(data)[0];
			Local.AddUsers([user]);
			var Form = document.createElement("form");
			Form.appendChild(Site.CreateHeader(Lang.get("profiles.report_head")));
			var page = document.createElement("div");
			page.className = "sf-wrap";
			page.appendChild(e("input", {type: "hidden", name: "user_id", value: user.userId}));
			page.appendChild(e("div", {html: Lang.get("profiles.report_tip"), "class":"tip"}));
			var types = Lang.get("profiles.report_types");
			page.appendChild(e("select", {
				name: "reason",
				append: (function (a,b,c,d,e,f,g,h){for(;b<g;++b)f.push(h(e,{value:a[b][c],html:a[b][d]}));return f;})(types,0,0,1,"option",[],types.length,e)
			}));
			page.appendChild(e("div", {html: Lang.get("profiles.report_comment"), "class": "tip"}));
			page.appendChild(e("textarea", {name: "comment"}));
			page.appendChild(e("input", {type: "submit", value: Lang.get("profiles.report_submit")}));
			Form.appendChild(page);
			Form.onsubmit = function (event) {
				if (this.reason.options[this.reason.selectedIndex].value == "0") {
					Site.Alert({text: Lang.get("profiles.report_error_reason")});
					return false;
				}
				var userId = this.user_id.value;
				Site.API("users.report", {
					user_id: userId,
					type: this.reason.options[this.reason.selectedIndex].value,
					comment: $.trim(this.comment.value)
				}, function (data) {
					console.log(data);
					if (data.response == 1) {
						window.location.href = "#id" + userId;
						Site.Alert({text: Lang.get("profiles.report_success")});
					}
				});
				return false;
			};
			Site.Append(Form);
			Site.SetHeader(Lang.get("profiles.report_head"), {link: user.screen_name});
		});
	}
};