/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Profile = {
	RequestPage: function (screen_name) {
		switch(Site.Get("act")) {
			case "info":
				return Profile.ShowFullInfo(screen_name);

			case "requests":
				return Groups.getRequests(screen_name);

			case "members":
				return Groups.Members(screen_name, getOffset());

			case "blacklist":
				return Groups.Blacklist.Request(screen_name, getOffset());

			case "stat":
				return Groups.Stat.Request(screen_name);

			case "followers":
				return Profile.Followers(screen_name);

			case "subscriptions":
				return Profile.Subscriptions(screen_name, (Site.Get("type") ? 1 : 0));

			case "links":
				return Groups.ShowLinks(screen_name);

			case "contacts":
				return Groups.ShowContacts(screen_name);

			case "search":
				return Feed.searchByOwner(screen_name, Site.Get("q"), getOffset());

			case "report":
				return Profile.ShowReportPage(screen_name);

			case "photo":
				var group = Local.getUserByDomain(screen_name);
				if (!group || group && !group.is_admin)
					return setLocation(screen_name);
				return Groups.showChangerPhoto(group.id || group.gid);

			default:
				var offset=0;
				Site.Loader();
				Site.API("execute",{
					code:'var q="' + screen_name + '",c=API.account.getCounters({v:5.11}),d=API.utils.resolveScreenName({screen_name:q}),w=d.object_id;if(!d.length)return{type:0};if(d.type=="user"){API.stats.viewUser({user_id:w});var u=API.users.get({user_ids:w,fields:"sex,photo_rec,photo_id,maiden_name,online,last_seen,counters,activites,bdate,can_write_private_message,status,can_post,city,country,exports,screen_name,blacklisted,blacklisted_by_me,are_friends,first_name_gen,first_name_ins,site,common_count,contacts,relation,nickname,home_town,verified,can_see_gifts,is_favorite,friend_status,crop_photo"})[0];return{type:d.type,c:c,user:{user:u,wall:API.wall.get({owner_id:w,extended:1,offset:%offset%,count:25}),e:{p:API.wall.get({owner_id:w,filter:"postponed"}).count}}};}else if(d.type=="group"){API.stats.viewGroup({group_id:w});var c=API.groups.getById({group_id:w,fields:"photo_pec,description,wiki_page,contacts,members_count,links,verified,counters,can_post,status,activity,city,country,site,place,ban_info,start_date,finish_date,is_favorite",extended:1})[0];return{type:d.type,c:c,club:{club:c,wall:API.wall.get({owner_id:-w,extended:1,offset:%offset%,count:25}),e:{s:API.wall.get({owner_id:-w,filter:"suggests"}).count,p:API.wall.get({owner_id:-w,filter:"postponed"}).count},r:API.groups.getRequests({group_id:w}).count}};}else return API.apps.get({app_id:w});'
						.replace(/%offset%/img, Site.Get("offset"))
				}, Profile.GeneratePage);
		}
	},
	GeneratePage:function(data){
		data=Site.isResponse(data);
		console.log("APIdog->getDataByScreenName: ", data);
		if (!data.type) {
			Site.SetHeader("Не найдено");
			Site.Alert({text: "Такой страницы не существует"});
			Site.Append(Site.EmptyField("Такой страницы не существует.<br><a href='\/\/vk.com\/" + window.location.hash.replace("#", "") + "' target='_blank'>Открыть эту страницу на vk.com<\/a>"));
			return;
		}
		if (data.error&&data.error.error_code)
			return alert("Ошибка!");
		if (data.type=="group")
			return Groups.GeneratePage(data);
		else if (data.type != "user")
			return Apps.showItem(data);
		Site.setCounters(data.c);
		var elem = document.createElement("div"),
			elem_info = document.createElement("div"),
			elem_media = document.createElement("div"),
			user = data.user,
			info = user.user,
			areFriends = info.friend_status,
			counters = info.counters || {},
			wall = user.wall,
			uid = info.id,
			f = user.friends,
			deleted = info.deactivated,
			active = !deleted,
			isFav = info.is_favorite,
			bl = info.blacklisted,
			thumb = info.crop_photo && info.crop_photo.photo && (info.crop_photo.photo.owner_id + "_" + info.crop_photo.photo.id) || info.photo_id;
		if (info.deactivated)
			areFriends = 3;
		elem.appendChild(
			Site.CreateHeader(
				"<strong>" + Site.Escape(info.first_name + " " + info.last_name + (info.maiden_name ? " (" + info.maiden_name + ")" : "")) + "<\/strong>",
				Site.CreateDropDownMenu(Lang.get("general.actions"), (function () {
					var opts = {},
						_uid = uid;
					if (uid != API.uid) {
						switch (areFriends) {
							case 0:
							case 2:
								opts[areFriends == 0 ? Lang.get("profiles.acts_add_friend") : Lang.get("profiles.acts_accept_request")] = function (event) {
									Friends.Add(uid, function (data) {
										data = Site.isResponse(data);
										Site.Alert({
											text: [Lang.get("profiles.acts_friend_sent"), Lang.get("profiles.acts_friend_agreed"), null, Lang.get("profiles.acts_friend_secondarary")][data - 1]
										});
										Site.Go(window.location.hash.replace("#", ""));
									});
								};
								if (areFriends == 2) {
									opts[Lang.get("profiles.acts_friend_cancel_friend")] = function (event) {
										Friends.Delete(uid, function (data) {
											if (!data.response)
												return Site.Alert({text: data.error && data.error.error_msg});
											data = Site.isResponse(data);
											Site.Alert({
												text: Lang.get("profiles.request_cancelled")
											});
											Site.Go(window.location.hash.replace("#", ""));
										})
									}
								}
							break;
							case 1:
							case 3:
								opts[areFriends == 1 ? Lang.get("profiles.acts_friend_cancel_request") : Lang.get("profiles.acts_friend_delete")] = function (event) {
									Friends.Delete(uid, function (data) {
										data = Site.isResponse(data);
										Site.Alert({
											text: [Lang.get("profiles.acts_friend_deleted"), Lang.get("profiles.acts_friend_request_deleted"), Lang.get("profiles.reccomendation_deleted")][data - 1]
										});
										Site.Go(window.location.hash);
									});
								}
							break;
						};
						if (active) {
							opts[Lang.get("profiles.acts_report")] = function (event) {
								window.location.hash = "#" + info.screen_name + "?act=report";
							};
							opts[!info.blacklisted_by_me ? Lang.get("profiles.acts_block") : Lang.get("profiles.acts_unblock")] = function (event) {
								Site.API("account." + (!info.blacklisted_by_me ? "" : "un") + "banUser", {
									user_id: _uid
								}, function (data) {
									data = Site.isResponse(data);
									if (data === 1) {
										var user = Local.Users[_uid], prefix = ("оа ".split("")[user.sex]);
										Site.Alert({
											text: Site.Escape(user.first_name) + " " + (!info.blacklisted_by_me ? ("занесен" + prefix + " в черный список") : "удален" + prefix + " из черного списка") // TODO Lang
										});
									}
								});
							}
						};
					};
					if (active) {
						opts[Lang.get("profiles.acts_date_registration")] = function () {
							APIdogRequest("apidog.getUserDateRegistration", { userDomain: uid }, Profile.Registered);
						};
						opts[Lang.get("profiles.acts_last_activity")] = function () {
							Site.API("execute", {
								code: "var u=API.users.get({user_ids:%u,fields:\"last_seen,sex,online\",v:5.28})[0],a,t=API.utils.getServerTime()-u.last_seen.time;if(!u)return 0;if(u.online_app)a=API.apps.get({app_id:u.online_app});return{u:u,t:t,a:a};".replace(/%u/img, uid)
							}, function (data) {
								data = Site.isResponse(data);
								var user = data.u,
									a = data.a,
									left = data.t,
									str = user.first_name + " " + Lang.get("general.was_sex")[user.sex] + " ",
									pl = user.last_seen.platform;

								if (pl === 1) {pl = false; user.online_mobile = true;};
								if (pl === 7) {pl = false; user.online = true;};

								Site.Alert({
									text:
										str +
										(left > 3600
											? $.getDate(user.last_seen && user.last_seen.time || 0)
											: function (d) {
												var t = [Math.floor(left / 60 % 60), Math.floor(left % 60)];
												return (
													t[0] > 0
														? t[0] + " " + $.textCase(t[0], ["минуту", "минуты", "минут"]) + " и "
														: ""
												) +
												t[1] +
												" " +
												$.textCase(t[1], ["секунду", "секунды", "секунд"]) + " назад";
											}(left)
										) + (
											a || pl
												? " через приложение &laquo;" + (a && a.title || ["мобильный", "iPhone", "iPad", "Android", "Windows Phone", "Windows 8", "ПК"][pl - 1]) + "&raquo;"
												: (user.online_mobile
													? " через мобильный"
													: " через ПК"
												)
										)
								});
							});
						};
					} else
						opts[Lang.get("profiles.counters_photos")] = function (event) { setLocation("photos" + uid); };
					if (API.uid != uid)
						opts[isFav ? "Удалить из закладок" : "Добавить в закладки"] = function (event) {
							Site.API("fave." + (isFav ? "remove": "add") + "User", {
								user_id: uid,
							}, function (data) {
								if (data.response)
									Site.Go(window.location.hash);
							});
						};
					opts[Lang.get("questions.head_list")] = function (event) {
						setLocation("questions?id=" + uid);
					};
					opts[Lang.get("profiles.acts_update")] = function () {
						Site.Go(window.location.hash.substring(1));
					};
/*					if (Site.Get("_slsu") || API.isAdmin)
						opts["Последнее использование APIdog"] = function () {
							Profile.showLastSeenAPIdog(uid);
						};
*/					return opts;
				})())
			)
		);
		var ava = $.e("img", {src: getURL(info.photo_rec), alt: ""}),
			isPhoto = info.photo_id,
			location = [];
		if (info.country && info.country.title)
			location.push(info.country.title);
		if (info.city && info.city.title)
			location.push(info.city.title);
		elem_info.appendChild($.elements.create("div", {"class": "profile-info", append: [
			$.elements.create("div", {"class": "profile-left", append: isPhoto ? $.elements.create("a", {
				href: "#photo" + thumb,
				append: ava
			}) : ava}),
			$.elements.create("div", {"class": "profile-right", append: [
				$.elements.create("strong", {html: info.first_name + (info.nickname ? " " + info.nickname : "") + " " + info.last_name + Site.isVerify(info) + Site.isOnline(info, 1)}),
				(!info.status_audio ? $.elements.create("div", {"class": (API.uid == uid ? "profile-status" : "") + (!info.status ? " tip" : ""), "data-status": info.status, onclick: (function (a) {return (a ? function (event) {Profile.EditStatus(this);} : function ( ) {});})(API.uid == uid), html: (Mail.Emoji(Site.Escape(info.status) || "") || (API.uid == uid ? Lang.get("profiles.status_change") : ""))}) : (function (a) {return Audios.Item(a, {from: 2, set: 32, lid: Audios.createList(a).lid, removeBroadcast: (API.uid == info.id), uid: info.id});
				})(info.status_audio)),
				$.elements.create("div", {"class": "tip", html: location.join(", ")}),
				(info.can_write_private_message && API.uid != uid ? $.elements.create("a", {"class": "btn", href: "#im?to=" + uid, html: Lang.get("profiles.write_message"), style: "margin: 4px 0 2px; text-align: center;"}) : null)
			]})
		]}));
		if (active && !bl) {
			elem_info.appendChild(Site.CreateHeader(Lang.get("profiles.info"), API.uid == uid ? $.elements.create("a", {"class": "fr", href: "#settings?act=profile", html: Lang.get("profiles.info_edit")}) : null ));
			var infoRow = function (name, value, format) {
				return $.elements.create("div", {"class": "group-info-item", append: [
					$.elements.create("div", {"class": "group-info-name", html: name}),
					$.elements.create("div", {"class": "group-info-value", html: (typeof value === "string" ? (format ? Site.Format(value) : value) : ""), append: (typeof value === "string" ? [] : [value])})
				]});
			};
			if (info.mobile_phone)
				elem_info.appendChild(infoRow(Lang.get("profiles.mobile_phone"), info.mobile_phone));
			if (info.home_phone)
				elem_info.appendChild(infoRow(Lang.get("profiles.home_phone"), info.home_phone));
			if (info.home_town)
				elem_info.appendChild(infoRow(Lang.get("profiles.home_city"), info.home_town));
			if (info.bdate) {
				var b = info.bdate.split("."),
					months = Lang.get("general.months"),
					birthday = b[0] + " " + months[b[1] - 1] + (b[2] ? " " + b[2] : "");
				elem_info.appendChild(infoRow(Lang.get("profiles.birthday"), birthday));
			}
			elem_info.appendChild($.e("a", {
				html: Lang.get("profiles.full_info"),
				href: "#" + info.screen_name + "?act=info",
				"class": "profile-gotofullinfo"
			}));
			elem_media.className="profile-media";
			if (API.uid == uid) info.common_count = 0;
			var csg = info.can_see_gifts;
			var q = {
				friends:        ["friends?id=" + uid,                       Lang.get("profiles.counters_friends")],
//              online_friends: ["friends" + uid + "?section=online",       "Друзья онлайн"],
				common_count:   ["friends?id=" + uid + "&act=mutual",       Lang.get("profiles.counters_common_friends")],
				groups:         ["groups?user_id=" + uid,                   Lang.get("profiles.counters_groups")],
				albums:         ["photos"+uid,                              Lang.get("profiles.counters_albums")],
//              user_photos:    ["photos" + uid + "?act=tagged",            "Фотографии с " + info.first_name_ins],
				photos:         ["photos"+uid+"?act=all",                   Lang.get("profiles.counters_photos")],
				videos:         ["videos"+uid,                              Lang.get("profiles.counters_videos")],
//              user_videos:    ["videos" + uid + "?act=tagged",            "Видео с " + info.first_name_ins],
				audios:         ["audio?oid="+uid,                          Lang.get("profiles.counters_audios")],
				notes:          ["notes" + uid,                             Lang.get("profiles.counters_notes")],
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
				href:"#" + (csg ? "gifts?userId="+uid : "gifts?act=send&toId="+uid),
				html: csg ? Lang.get("profiles.counters_gifts") + " <i class=count>" + formatNumber(counters.gifts) + "<\/i>" : Lang.get("profiles.counters_gifts_send")
			}));
			if (active && wall && wall.count)
				d.push($.e("a", {
					href:"#" + info.screen_name + "?act=search",
					html: "Поиск по стене " + info.first_name_gen
				}));
			elem_media.appendChild($.elements.create("div",{
				"class":"profile-last",
				append: $.e("div", {"class":"hider profile-lists", append: d})
			}));
			elem.appendChild(elem_info);
			elem.appendChild(elem_media);
			console.log(user.e);
			if (wall.count > 0 || info.can_post)
				elem.appendChild(Wall.RequestWall(uid, {data:wall,can_post:info.can_post,extra:user.e}));
		} else if (!active) {
			elem_info.appendChild($.elements.create("div", {"class": "msg-empty", html: {
				deleted: Lang.get("profiles.profile_deleted"),
				banned: Lang.get("profiles.profile_banned")
			}[deleted]}));
			elem.appendChild(elem_info);
		} else {
			elem_info.appendChild($.elements.create("div", {"class": "msg-empty", html: info.first_name + " " + info.last_name + " Вас заблокировал" + (info.sex === 1 ? "а" : "")}));
			elem.appendChild(elem_info);
		}
		Site.SetHeader(Lang.get("profiles.profile_head_MASK").replace(/%n%/ig, info.first_name_gen));
		Site.Append(elem);
	},
	EditStatus:function(elem){
		if (elem.opened)
			return;
		elem.opened = 1;
		var text = elem.getAttribute("data-status");
		//if (elem.innerHTML == "изменить статус" && /tip/ig.test(elem.className))
			elem.innerHTML = "";
		elem.appendChild(Site.CreateInlineForm({
			name: "text",
			value: text,
			onsubmit: function (event) {
				elem.setAttribute("data-status", $.trim(this.text.value));
				return Profile.SetStatus(this);
			},
			title: Lang.get("profiles.status_changer_complete")
		}));
		elem.firstChild.text.focus();
	},
	SetStatus:function(elem){
		var status = $.trim(elem.text.value);
		elem.parentNode.opened = 0;
		if (!status){
			elem.parentNode.className = 'profile-status tip';
			elem.parentNode.innerHTML = Lang.get("profiles.status_change");
		} else
			elem.parentNode.innerHTML = Mail.Emoji(Site.Escape(status));
		Site.API("status.set", {text: status}, "blank");
		return false;
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
			e = $.elements.create;

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
				info.appendChild($.elements.create("strong", {
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
						[user.twitter ? $.elements.create("a", {href: "https:\/\/twitter.com\/" + user.twitter, html: user.twitter, target: "_blank"}): null, "Twitter"],
						[user.facebook ? $.elements.create("a", {href: "https:\/\/facebook.com\/profile.php?id=" + user.facebook, html: user.facebook_name, target: "_blank"}) : null, "Facebook"],
						[user.site ? (function (l) {
							l = l.split(" ");
							var links = document.createElement("div");
							for (var i = 0 , k = l.length; i < k; ++i) {
								l[i] = $.trim(l[i]);
								if (!/^https?:\/\//i.test(l[i]))
									l[i] = "http://" + l[i];
								links.appendChild($.elements.create("a", {href: l[i], html: l[i], target: "_blank"}));
							}
							return links;
						})(user.site) : null, Lang.get("profiles.info_site")],
						[user.skype ? $.elements.create("a", {href: "skype:" + user.skype + "?call", html: user.skype, target: "_blank"}): null, "Skype"],
						[user.instagram ? $.elements.create("a", {href: "https:\/\/instagram.com\/" + user.instagram, html: user.instagram, target: "_blank"}): null, "Instagram"],
						[user.livejournal ? $.elements.create("a", {href: "https:\/\/" + user.livejournal + ".livejournal.com\/", html: user.livejournal, target: "_blank"}): null, "LiveJournal"]
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
					return $.elements.create("div", {"class": "group-info-item", append: [
						$.elements.create("div", {"class": "group-info-name", html: name}),
						$.elements.create("div", {
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
					return $.elements.create("span", {html: obj.id > 0 ? "<a href='#id" + obj.id + "'>" + obj.name + "</a>" : "<span>" + obj.name + "</span>"});
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
	FindIDByScreenName: function (screen_name) {
		if (/^(id|club)\d+$/img.test(screen_name))
			return (/^(id|club)(\d+)$/img.exec(screen_name))[2];
		else
			for (var current in Local.Users)
				if(Local.Users[current].screen_name == screen_name)
					return (Local.Users[current].uid || -Local.Users[current].gid || (Local.Users[current].name ? -Local.Users[current].id : Local.Users[current].id));
		return 0;
	},
	ItemListProfile: function (user) {
		var parent = document.createElement("a");
		parent.className = "friends-item a";
		parent.href = "#" + (user.screen_name || "id" + (user.uid || user.id));
		parent.appendChild($.elements.create("img", {
			"class": "friends-left",
			src: getURL(user.photo_rec || user.photo_50 || user.photo),
			alt: ""
		}));
		parent.appendChild($.elements.create("div", {
			"class": "friends-right",
			html: (user.name ? user.name : user.first_name + " " + user.last_name + Site.isOnline(user) + Site.isVerify(user))
		}))
		return parent;
	},
	Followers: function (screen_name) {
		Site.API("execute",{
			code: 'var id=API.utils.resolveScreenName({screen_name:"' + screen_name + '"}).object_id;return [API.users.get({user_id:id,fields:"screen_name,first_name_gen,first_name_gen"})[0],API.users.getFollowers({user_id:id,count:30,fields:"screen_name,online,photo_rec,verified",offset:' + Site.Get("offset") + '})];'
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				user = data[0],
				list = data[1];
			parent.appendChild(Site.CreateHeader("У " + user.first_name_gen + " " + formatNumber(list.count) + " " + Lang.get("profiles", "followers", list.count)));
			for (var i = 0; i < list.items.length; ++i)
				parent.appendChild(Profile.ItemListProfile(list.items[i]));
			list.items.push(user);
			Local.AddUsers(list.items);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), list.count, 30));
			Site.SetHeader(Lang.get("profiles.followers_head") + " " + user.first_name_gen, {link: Local.Users[user.uid || user.id].screen_name});
			Site.Append(parent);
		})
	},
	Subscriptions: function (screen_name) {
		Site.API("execute", {
			code: 'var id=API.utils.resolveScreenName({screen_name:"' + screen_name + '"}).object_id;return [API.users.get({user_id:id,fields:"screen_name,sex,first_name_gen"})[0],API.users.getSubscriptions({user_id:id,count:30,extended:1,fields:"screen_name,online,photo_rec,verified",v:5.2,offset:' + Site.Get("offset") + '})];'
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = data[1],
				user = data[0],
				verb = Lang.get("profiles.subscriptions_sex")[user.sex];
			parent.appendChild(Site.CreateHeader(user.first_name + " " + verb + Lang.get("general._on") + formatNumber(list.count) + " " + Lang.get("profiles", "subscriptions", list.count)));
			for (var i = 0; i < list.items.length; ++i)
				parent.appendChild(Profile.ItemListProfile(list.items[i]));
			list.items.push(user);
			Local.AddUsers(list.items);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), list.count, 30));
			Site.SetHeader("Кумиры " + user.first_name_gen, {link: Local.Users[user.uid || user.id].screen_name});
			Site.Append(parent);
		})
	},


	Registered: function (data) {
		if (data.error)
			return Site.Alert({text: "Ошибка запроса"});
		var user = data.user;
		return Site.Alert({
			text: user.firstName + " " + user.lastName + " зарегистрировал" + "ось,ась,ся".split(",")[user.sex] + " " + data.date + " в " + data.time + " (" + formatNumber(data.days) + " " + $.TextCase(data.days, "день,дня,дней".split(","))+ ")"
		});
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
			page.appendChild($.elements.create("input", {type: "hidden", name: "user_id", value: user.uid}));
			page.appendChild($.elements.create("div", {html: Lang.get("profiles.report_tip"), "class":"tip"}));
			var types = Lang.get("profiles.report_types");
			page.appendChild($.elements.create("select", {
				name: "reason",
				append: (function (a,b,c,d,e,f,g,h){for(;b<g;++b)f.push(h(e,{value:a[b][c],html:a[b][d]}));return f;})(types,0,0,1,"option",[],types.length,$.elements.create)
			}));
			page.appendChild($.elements.create("div", {html: Lang.get("profiles.report_comment"), "class": "tip"}));
			page.appendChild($.elements.create("textarea", {name: "comment"}));
			page.appendChild($.elements.create("input", {type: "submit", value: Lang.get("profiles.report_submit")}));
			Form.appendChild(page);
			Form.onsubmit = function (event) {
				if (this.reason.options[this.reason.selectedIndex].value == "0") {
					Site.Alert({text: Lang.get("profiles.report_error_reason")});
					return false;
				}
				var uid = this.user_id.value;
				Site.API("users.report", {
					user_id: uid,
					type: this.reason.options[this.reason.selectedIndex].value,
					comment: $.trim(this.comment.value)
				}, function (data) {
					console.log(data);
					if (data.response == 1) {
						window.location.href = "#id" + uid;
						Site.Alert({text: Lang.get("profiles.report_success")});
					}
				});
				return false;
			};
			Site.Append(Form);
			Site.SetHeader(Lang.get("profiles.report_head"), {link: user.screen_name});
		});
	}
	/*
	showLastSeenAPIdog: function (userId) {
		APIdogRequest("users.getLastSeenUser", {userId: userId}, function (data) {
			var user = Local.Users[userId];
			Site.Alert({
				text: data[0]
					? user.first_name + " " + user.last_name + " " + ([0, "была", "был"][user.sex || 2]) + " в последний раз на APIdog " + $.getDate(data[0])
					: user.first_name + " " + user.last_name + " ещё не " + ([0, "была", "был"][user.sex || 2]) + " на APIdog с момента ввода статистики",
				time: 7000
			});
		});
	}
	*/
};