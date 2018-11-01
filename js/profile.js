var Profile = {
	RequestPage: function(screenName) {
		switch(Site.get("act")) {
			case "requests":
				return Groups.getRequests(screenName);

			case "members":
				return Groups.Members(screenName, getOffset());

			case "blacklist":
				return Groups.Blacklist.Request(screenName, getOffset());

/*			case "stat":
				return Groups.Stat.Request(screen_name);
*/
			case "search":
				return Feed.searchByOwner(screenName, Site.Get("q"), getOffset());
		}
	},

	/**
	 * Вывод на экран страницы пользователя
	 * @param  {User} user Объект пользователя
	 * @param  {object} wall Данные стены
	 */
	display: function (user, wall) {
		var e = $.e,
			wrap = e("div", {"class": "profile"}),
			nodeInfo = e("div"),
			nodeMedia = e("div", {"class": "grid-links-wrap"}),

			info = user, // for compatible

//			friendStatus = info.friend_status,
			counters = user.counters || {},
			userId = user.id,
			isDeleted = user.deactivated,
			isActive = !isDeleted,
			isClosed = user.is_closed,
			bl = user.blacklisted,
			thumb = user.crop_photo && user.crop_photo.photo && (user.crop_photo.photo.owner_id + "_" + user.crop_photo.photo.id) || user.photo_id;

		var photo = lz(getURL(user.photo_100 || user.photo_50), 80, 80),
			isPhoto = user.photo_id,
			location = [];

		if (user.country && user.country.title) {
			location.push(user.country.title);
		}

		if (user.city && user.city.title) {
			location.push(user.city.title);
		}

		nodeInfo.appendChild(e("div", {
			"class": "profile-info",
			append: [
				e("div", {
					"class": "profile-left",
					append: isPhoto
						? e("a", { href: "#photo" + thumb, append: photo})
						: photo
				}),
				e("div", {"class": "profile-right", append: [
					e("div", {"class": "profile-name",
						html: user.first_name.safe() + " " + user.last_name.safe() + Site.isOnline(user) + Site.isVerify(user) + Site.getLastSeenString(user)
					}),

					Profile.getStatusNode(user),

					e("div", {"class": "tip", html: location.join(", ")}),

					user.can_write_private_message && API.userId !== userId
						? e("a", {"class": "btn", href: "#im?to=" + userId, html: Lang.get("profiles.actionWriteMessage")})
						: null
				]})
			]}));

		wrap.appendChild(Site.getPageHeader(
			e("strong", {html: user.first_name.safe() + (user.nickname ? " " + user.nickname.safe() : "") + " " + user.last_name.safe() + (user.maiden_name ? " (" + user.maiden_name.safe() + ")" : "")}),
			new DropDownMenu(Lang.get("general.actions"), Profile.getDisplayActions(user)).getNode()
		));

		if (isActive && !bl && !isClosed) {
			nodeInfo.appendChild(Site.getPageHeader(
				Lang.get("profiles.info"),
				API.userId === userId
					? $.e("a", {
						"class": "fr",
						href: "#settings?act=profile",
						html: Lang.get("profiles.info_edit")
					})
					: null
			));

			var infoRow = function(name, value, format) {
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
			};

			if (user.mobile_phone) {
				nodeInfo.appendChild(infoRow(Lang.get("profiles.infoMobilePhone"), user.mobile_phone));
			}

			if (user.home_phone) {
				nodeInfo.appendChild(infoRow(Lang.get("profiles.infoHomePhone"), user.home_phone));
			}

			if (user.home_town) {
				nodeInfo.appendChild(infoRow(Lang.get("profiles.infoHomeCity"), user.home_town));
			}

			if (user.bdate) {
				var b = info.bdate.split("."),
					months = Lang.get("general.months"),
					birthday = b[0] + " " + months[b[1] - 1] + (b[2] ? " " + b[2] : "");

				nodeInfo.appendChild(infoRow(Lang.get("profiles.birthday"), birthday));
			}


			if (API.userId === userId) {
				user.common_count = 0;
			}

			var cnt = user.counters,
				links = [
					{
						link: "friends?id=" + userId,
						label: "countersFriends",
						count: cnt.friends
					},
					{
						link: "friends?id=" + userId + "&act=mutual",
						label: "countersFriendsCommon",
						count: cnt.common_count
					},
					{
						link: "groups?userId=" + userId,
						label: "countersGroups",
						count: cnt.groups
					},
					{
						link: "photos" + userId,
						label: "countersAlbums",
						count: cnt.albums
					},
					{
						link: "photos" + userId + "?act=all",
						label: "countersPhotos",
						count: cnt.photos
					},
					{
						link: "videos" + userId,
						label: "countersVideos",
						count: cnt.videos
					},
					{
						link: "audio?ownerId=" + userId,
						label: "countersAudios",
						count: cnt.audios
					},
					{
						link: "notes" + userId,
						label: "countersNotes",
						count: cnt.notes
					},
					{
						link: function() { Profile.showFollowers(user.screen_name, this) },
						label: "countersFollowers",
						count: cnt.followers
					},
					{
						link: function() { Profile.showSubscriptions(user.screen_name, this) },
						label: "countersSubscriptions",
						count: cnt.subscriptions + cnt.pages
					},
					{
						link: user.can_see_gifts ? "gifts?userId=" + userId : "gifts?act=send&toId=" + userId,
						label: user.can_see_gifts ? "countersGifts" : "countersGiftsSend",
						count: user.can_see_gifts ? counters.gifts : -1,
						icon: user.can_see_gifts ? null : "profile-i-gift"
					},
					{
						link: "feed?act=search&ownerId=" + user.id,
						label: "countersWallSearch",
						count: isActive && wall.count ? -1 : 0,
						icon: "profile-i-searchWall"
					},
					{
						link: function() { Profile.showFullInfo(user.id, this); },
						label: "fullInfoTitle",
						count: -1,
						icon: "profile-i-fullInfo"
					}
				];

			for (var i = 0, k, isLink; k = links[i]; ++i) {
				if (!k.count) {
					continue;
				}

				isLink = typeof k.link === "string";

				nodeMedia.appendChild(e(isLink && !isClosed ? "a" : "div", {
					"class": "grid-links-item a",
					href: isLink ? "#" + k.link : null,
					onclick: isLink || isClosed ? null : k.link,
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
							html: k.count >= 0 ? $.textCase(k.count, Lang.get("profiles." + k.label)) : Lang.get("profiles." + k.label)
						})
					]
				}));
			}

			wrap.appendChild(nodeInfo);
			wrap.appendChild(nodeMedia);

			if (wall.count > 0 || user.can_post) {
				wrap.appendChild(Wall.getNodeWall(userId, {
					data: wall,
					canPost: info.can_post,
					extra: user.e
				}));
			}

		} else if (!isActive) {

			nodeInfo.appendChild(Site.getEmptyField({
				deleted: Lang.get("profiles.profileDeleted"),
				banned: Lang.get("profiles.profileBanned")
			}[isDeleted]));
			wrap.appendChild(nodeInfo);

		} else if (isClosed) {
			nodeInfo.appendChild(Site.getEmptyField(Lang.get("profiles.profileClosed")));
			wrap.appendChild(nodeInfo);
		} else {

			nodeInfo.appendChild(Site.getEmptyField(Lang.get("profiles.blocked").schema({
				n: getName(user), a: Lang.get("profiles.blockedVerb")[user.sex]
			})));
			wrap.appendChild(nodeInfo);
		}
		Site.setHeader(Lang.get("profiles.pageHead").schema({n: info.first_name_gen}));
		Site.append(wrap);
	},

	/**
	 * Возвращает поля для создания дропдаун меню
	 * @param  {User} user Объект пользователя
	 */
	getDisplayActions: function(user) {
		var result = {}, isActive = !user.deactivated, status = user.friend_status;

		if (API.userId !== user.id) {

			switch (status) {
				case 0:
				case 2:
					result["friendButton"] = {
						label: Lang.get(status === 0 ? "profiles.actionFriendAdd" : "profiles.actionFriendAccept"),
						onclick: function (item) {
							// friends.add
							// result: [
							// Lang.get("profiles.acts_friend_sent"),
							// Lang.get("profiles.acts_friend_agreed"),
							// null,
							// Lang.get("profiles.acts_friend_secondarary")
							// ][data - 1]
							// APINotify.fire(DogEvent.FRIEND_STATUS_CHANGED, { status: ??? });
						}
					};
					if (status === 2) {
						result["friendReject"] = {
							label: Lang.get("profiles.actionFriendReject"),
							onclick: function (item) {
								// friends.delete
								// Lang.get("profiles.request_cancelled")
								// APINotify.fire(DogEvent.FRIEND_STATUS_CHANGED, { status: ??? });
							}
						};
					}
					break;

				case 1:
				case 3:
					result["friendButton"] = {
						label: Lang.get(!(status - 1) ? "profiles.actionFriendCancel" : "profiles.actionFriendDelete"),
						onclick: function (item) {
							// friends.delete
							// [
							// Lang.get("profiles.acts_friend_deleted"),
							// Lang.get("profiles.acts_friend_request_deleted"),
							// Lang.get("profiles.reccomendation_deleted")
							// ][data - 1]
							// APINotify.fire(DogEvent.FRIEND_STATUS_CHANGED, { status: ??? });
						}
					};
					break;
			}

			if (isActive) {
				result["report"] = {
					label: Lang.get("profiles.actionReport"),
					onclick: function() {
						showReportWindow("users.report", 0, "user_id", user.id, null, true);
					}
				};

				result["block"] = {
					label: Lang.get(!user.blacklisted_by_me ? "profiles.actionBlock" : "profiles.actionUnblock"),
					onclick: function(item) {
						item
							.disable()
							.commit();

						Profile.toggleBlock(user, function() {
							item
								.label(Lang.get(!user.blacklisted_by_me ? "profiles.actionBlock" : "profiles.actionUnblock"))
								.enable()
								.commit();
						});
//						APINotify.fire(DogEvent.PROFILE_USER_BLOCK_CHANGED, { userId: user.id, blocked: user.blacklisted_by_me });
					}
				};
			}
		}

		if (isActive) {
			result["registration"] = {
				label: Lang.get("profiles.actionDateRegistration"),
				onclick: function() {
					Profile.showDateOfRegister(user.id);
				}
			};

			result["lastActivity"] = {
				label: Lang.get("profiles.actionLastActivity"),
				onclick: function() {
					Profile.showLastActivity(user.id);
				}
			};
		}

		if (API.userId !== user.id) {
			result["favorite"] = {
				label: Lang.get(!user.is_favorite ? "profiles.actionFavoriteAdd" : "profiles.actionFavoriteRemove"),
				onclick: function(item) {
					item
						.disable()
						.commit();

					Profile.toggleFavorite(user, function() {
						item
							.label(Lang.get(!user.is_favorite ? "profiles.actionFavoriteAdd" : "profiles.actionFavoriteRemove"))
							.enable()
							.commit();
					});
//					APINotify.fire(DogEvent.PROFILE_USER_FAVORITE_CHANGED, { userId: user.id, favorite: user.is_favorite });
				}
			};
		}

		result["refresh"] = {
			label: Lang.get("profiles.actionRefresh"),
			onclick: function() {
				Site.route(window.location.hash);
			}
		};

		return result;
	},

	/**
	 * Делает запрос на добавление в ЧС или удаление из ЧС
	 * @param  {Object}   user     Объект пользователя
	 * @param  {Function} callback Пользовательский колбэк
	 */
	toggleBlock: function(user, callback) {
		var toBlock = !user.blacklisted_by_me;
		api(toBlock ? "account.banUser" : "account.unbanUser", {
			user_id: user.id
		}).then(function() {
			new Snackbar({
				text: Lang.get(toBlock ? "profiles.blockInfoAdded" : "profiles.blockInfoRemoved").schema({
					n: user.first_name.safe() + " " + user.last_name.safe(),
					a: Lang.get(toBlock ? "profiles.blockInfoAddedVerb" : "profiles.blockInfoRemvoedVerb")[user.sex]
				})
			}).show();
			user.blacklisted_by_me = toBlock;
			callback && callback();
		});
	},

	/**
	 * Делает запрос на добавление в закладки или удаление из закладок
	 * @param  {Object}   user     Объект пользователя
	 * @param  {Function} callback Пользовательский колбэк
	 */
	toggleFavorite: function(user, callback) {
		var toFavorite = !user.is_favorite;
		api(toFavorite ? "fave.addUser" : "fave.removeUser", {
			user_id: user.id
		}).then(function() {
			new Snackbar({
				text: Lang.get(toFavorite ? "profiles.favoriteAdded" : "profiles.favoriteRemoved").schema({
					n: user.first_name.safe() + " " + user.last_name.safe(),
					a: Lang.get(toFavorite ? "profiles.favoriteAddedVerb" : "profiles.favoriteRemovedVerb")[user.sex]
				})
			}).show();
			user.is_favorite = toFavorite;
			callback && callback();
		});
	},

	/**
	 * Возвращает DOMNode для статуса
	 * @param  {User} user Объект пользователя
	 * @return {HTMLElement}     DOM-объект
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
				html: s.safe().emoji() || (i ? Lang.get("profiles.statusChange") : "")
			})
			: Audios.getListItem(a, {
				removeBroadcast: i
			});
	},

	/**
	 * Заменяет поле со статусом на текстовое поле
	 * Context: DOMNode
	 */
	editStatus: function() {
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
				Profile.setStatus(text).then(function() {
					node.dataset.opened = "";
					node.dataset.status = text;
					node.innerHTML = text ? text.safe().emoji() : Lang.get("profiles.statusChange");

					if (!text) {
						node.className = 'profile-status tip';
					}

//					APINotify.fire(DogEvent.PROFILE_STATUS_CHANGED, { text: text });
				});
				return false;
			},
			title: Lang.get("profiles.statusChangeSubmit")
		}));
		this.firstChild.text.focus();
	},

	/**
	 * Запрос на изменение статуса
	 * @param {String}   text     Текст
	 * @returns {Promise}
	 */
	setStatus: function(text) {
		return api("status.set", {text: text});
	},

	/**
	 * @param {User} user
	 * @returns {HTMLElement}
	 */
	getRelationshipString: function(user) {
		//noinspection JSValidateTypes
		var relation = user.relation,
			sex = user.sex === 1,
			partner = user.relation_partner || false,

			/** @var {User} userPartner */
			userPartner = partner ? Local.data[partner.id] : {},
			str,
			prefix,
			nameCase,
			cases = [null, "ins", "abl", "acc"],
			e = $.e;

		switch (relation) {
			case 1:
				str = sex
					? "не замужем"
					: "не женат";
				break;

			case 2:
				str = partner
					? "встречается" : (
						sex
							? "есть друг"
							: "есть подруга"
					);

				prefix = "с";
				nameCase = 1;
				break;

			case 3:
				str = sex
					? "помолвлена"
					: "помолвлен";

				prefix = "с";
				nameCase = 1;
				break;

			case 4:
				str = sex
					? "замужем"
					: "женат";

				prefix = sex
					? "за"
					: "на";

				nameCase = 2;
				break;

			case 5:
				str = "всё сложно";
				prefix = "с";
				nameCase = 1;
				break;

			case 6:
				str = "в активном поиске";
				break;

			case 7:
				str = sex
					? "влюблена"
					: "влюблен";

				prefix = "в";
				nameCase = 3;
				break;

			case 8:
				str = "в гражданском браке";

				prefix = "с";
				nameCase = 1;
				break;

			default:
				str = "";
				prefix = "";
		}

		nameCase = nameCase ? "_" + cases[nameCase] : "";
		return e("span", {append: [
			e("span", {html: str + (partner ? " " + prefix + " " : "")}),
			partner ? e("a", {html: (userPartner["first_name" + nameCase] + " " + userPartner["last_name" + nameCase]).safe(), href: "#" + userPartner.screen_name}) : null
		]});

	},

	/**
	 * Request and show full info about user
	 * @param {int} userId
	 * @param {HTMLElement} fromNodeAnimation
	 */
	showFullInfo: function(userId, fromNodeAnimation) {
		var modal = new Modal({
			title: Lang.get("profiles.fullInfoTitle"),
			width: 550,
			content: Site.Loader(true),
			noPadding: true,
			footer: [
				{
					name: "close",
					title: Lang.get("general.close"),
					onclick: function() {
						this.close();
					}
				}
			],
			unclosableByBlock: true
		});

		modal.show(fromNodeAnimation);

		api("execute",{
			code:'var u=API.users.get({user_ids:Args.u,fields:Args.ff,v:5.8})[0],r=u.relatives@.id;if(u.relation_partner){r.push(u.relation_partner.id);}return{u:u,a:API.users.get({user_ids:r,fields:Args.fr})};',
			u: userId,
			ff: "online,last_seen,timezone,contacts,sex,rate,connections,activities,interests,movies,tv,books,games,about,quotes,music,schools,relatives,relation,education,city,country,personal,home_town,first_name_gen,site,maiden_name",
			fr: "sex,online,screen_name,first_name_ins,last_name_ins,first_name_acc,last_name_acc,first_name_abl,last_name_abl"
		}).then(
			/** @var {{a: User[], u: User}} data */
			function(data) {

			Local.add(data.a);


			var elem = $.e("div"),
				tableInfo = document.createElement("div");
			/** @var {User} user */
			var user = data.u;

			var attitude = Lang.get("profiles.info_attitudes"),
				location = [];

			if (user.country && user.country.title) {
				location.push(user.country.title);
			}

			if (user.city && user.city.title) {
				location.push(user.city.title);
			}

			location = location.join(", ");

			var lifeMain = Lang.get("profiles.info_life_main"),
				peopleMain = Lang.get("profiles.info_people_main"),
				political = Lang.get("profiles.info_political"),
				d = [
					{
						title: Lang.get("profiles.info_general_head"),
						fields: [
							[user.bdate, Lang.get("profiles.info_birthday")],
							[user.relation ? Profile.getRelationshipString(user) : null, Lang.get("profiles.relation")],
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
								return $.e("div", {html: Site.toHTML(l) });
							})(user.site) : null, Lang.get("profiles.info_site")],
							[user.skype ? $.e("a", {href: "skype:" + user.skype + "?call", html: user.skype, target: "_blank"}): null, "Skype"],
							[user.instagram ? $.e("a", {href: "https:\/\/instagram.com\/" + user.instagram, html: user.instagram, target: "_blank"}): null, "Instagram"],
							[user.livejournal ? $.e("a", {href: "https:\/\/" + user.livejournal + ".livejournal.com\/", html: user.livejournal, target: "_blank"}): null, "LiveJournal"]
						]
					},
					{},
					{
						title: Lang.get("profiles.info_education_head"),
						fields: user.schools ? (function(schools) {
							var d = [];
							for (var i = 0, item; item = schools[i]; ++i) {
								d.push([
									item.name + (
										item.year_from
											? ", " + Lang.get("profiles.info_education_year_from") + " " + item.year_from
											: ""
									) + (
										item.year_to
											? " " + Lang.get("profiles.info_education_year_to") + " " + item.year_to
											: ""
									) + (
										item["class"]
											? " (" + Lang.get("profiles.info_education_class") + " \"" + item["class"] + "\")"
											: ""
									),
									item.type_str || Lang.get("profiles.info_education_school")
								]);
							}
							return d;
						})(user.schools) : []
					},
					{
						title: Lang.get("profiles.info_personal_head"),
						fields: [
							[user.personal && user.personal.religion, Lang.get("profiles.info_personal_religion")],
							[user.personal && user.personal.political ? political[user.personal.political] : null, Lang.get("profiles.info_personal_political")],
							[user.personal && user.personal.life_main ? lifeMain[user.personal.life_main] : null, Lang.get("profiles.info_personal_life_main")],
							[user.personal && user.personal.people_main ? peopleMain[user.personal.people_main] : null, Lang.get("profiles.info_personal_people_main")],
							[user.personal && user.personal.smoking ? attitude[user.personal.smoking] : null, Lang.get("profiles.info_personal_smoking")],
							[user.personal && user.personal.alcohol ? attitude[user.personal.alcohol] : null, Lang.get("profiles.info_personal_alcohol")],
							[user.personal && user.personal.inspired, Lang.get("profiles.info_personal_inspired")],
						]
					},
					{
						title: Lang.get("profiles.info_i_head"),
						fields: [
							[user.activities, Lang.get("profiles.info_i_activities")],
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
				],

				cat,
				field,

				row = function(name, value, format) {
					if (!format && typeof value === "string") {
						value = value.safe();
					}

					return $.e("div", {"class": "group-info-item", append: [
						$.e("div", {"class": "group-info-name", html: name}),
						$.e("div", {"class": "group-info-value", html: (
								typeof value === "string"
									? (
										format
											? Site.toHTML(value)
											: value
									)
									: ""
							),
							append: typeof value === "string" ? [] : value
						})
					]});
				},

				join = function(array) {
					var result = $.e("div");
					for (var i = 0, item; item = array[i]; ++i) {
						if (i) {
							result.appendChild(document.createTextNode(", "));
						}

						result.appendChild(item);
					}
					return result;
				};

			if (user.relatives && user.relatives.length > 0) {
				var relatives = user.relatives,
					r = {},
					item,
					type,
					rel,
					reldata = [],
					i,
					j,
					q,
					getLink = function(obj) {
						var isVkUser = obj.id > 0;
						return $.e(isVkUser ? "a" : "span", {
							href: isVkUser ? "#id" + obj.id : "",
							html: obj.name.safe()
						});
					}, parent;

				for (i = 0; item = relatives[i]; ++i) {
					type = item.type;
					rel = Local.data[item.id];
					rel = item.id > 0
						? {name: rel.first_name + " " + rel.last_name, id: item.id, sex: rel.sex}
						: {name: item.name, id: item.id, sex: 0};

					r[type] ? r[type].push(rel) : (r[type] = [rel]);
				}

				if (r.parent) {
					if (r.parent.length > 1) {
						reldata.push([join([getLink(r.parent[0]), getLink(r.parent[1])]), Lang.get("profiles.relatives")]);
					} else {
						parent = r.parent[0];
						reldata.push([getLink(parent), Lang.get("profiles.relative_sex")[parent.sex]]);
					}
				}
				if (r.grandparent) {
					if (r.grandparent.length > 1) {
						r.grandparent = r.grandparent.map(getLink);
						reldata.push([join(r.grandparent), Lang.get("profiles.grandparents")]);
					} else {
						parent = r.grandparent[0];
						reldata.push([getLink(parent), Lang.get("profiles.grandparent_sex")[parent.sex]]);
					}
				}

				if (r.child) {
					if (r.child.length > 1) {
						r.child = r.child.map(getLink);
						reldata.push([join(r.child), Lang.get("profiles.children")]);
					} else {
						parent = r.child[0];
						reldata.push([getLink(parent), Lang.get("profiles.child_sex")[parent.sex]]);
					}
				}
				if (r.grandchild) {
					if (r.grandchild.length > 1) {
						r.grandchild = r.grandchild.map(getLink);
						reldata.push([join(r.grandchild), Lang.get("profiles.grandchildren")]);
					} else {
						parent = r.grandchild[0];
						reldata.push([getLink(parent), Lang.get("profiles.grandchild_sex")[parent.sex]]);
					}
				}
				d[2] = {title: Lang.get("profiles.info_relatives_head"), fields: reldata};
			}

			for (i = 0; cat = d[i]; ++i) {
				q = 0;
				if (cat.fields) {
					for (k = 0, j = cat.fields.length; k < j; ++k) {
						if (cat.fields[k][0]) {
							q++;
						}
					}
				}

				if (!cat.fields || !cat.fields.length || !q) {
					continue;
				}

				tableInfo.appendChild(Site.getPageHeader(cat.title));

				for (var k = 0; field = cat.fields[k]; ++k) {
					if (field[0]) {
						tableInfo.appendChild(row(field[1], field[0], 2 === i));
					}
				}
			}
			elem.appendChild(tableInfo);
			modal.setContent(elem);
		}).catch(function(e) {
			modal.setContent(Site.getEmptyField("Cannot get info about user... :(<br>"+e.toString()));
		});
	},

	/**
	 * Открывает модальное окно, загружает и выводит информацию о подписчиках юзера screenName
	 * @param {String} screenName Скрин нейм пользователя
	 * @param {HTMLElement} node
	 */
	showFollowers: function(screenName, node) {
		var
			e = $.e,
			offset = 0,
			step = 100,
			allLoaded = false,
			wrap = e("div", {"class": "listView-wrap", append: getLoader()}),
			modal = new Modal({
				title: Lang.get("profiles.modalFollowersTitleLoading"),
				content: wrap,
				noPadding: true,
				footer: [{
					name: "close",
					title: Lang.get("general.close"),
					onclick: function() { this.close() }
				}]
			}).show(node),
			load = function(callback) {
				api("execute", {
					code: "var i=API.utils.resolveScreenName({screen_name:Args.d}).object_id;return{u:API.users.get({user_id:i,fields:Args.f,name_case:\"gen\",v:5.52})[0],d:API.users.getFollowers({user_id:i,count:Args.c,fields:Args.f,offset:parseInt(Args.o),v:5.52})};",
					d: screenName,
					c: step,
					f: "screen_name,first_name_gen,first_name_gen,photo_50,verified,online",
					o: offset
				}).then(function(data) {
					if (!offset) {
						$.elements.clearChild(wrap);
					}

					modal.setTitle(Lang.get("profiles.modalFollowersTitle").schema({n: data.u.first_name}));
					(data.d.items || []).map(function(u) {
						wrap.appendChild(Templates.getMiniUser(u));
					});

					if (wrap.children.length >= data.d.count) {
						allLoaded = true;
					}

					offset += data.d.items.length;

					callback && callback();

				});
			};

		setSmartScrollListener(wrap.parentNode, function(reset) {
			!allLoaded && load(reset);
		});

		load();
	},

	/**
	 * Открывает модальное окно, загружает и выводит информацию о подписках юзера screenName
	 * @param {String} screenName Скрин нейм пользователя
	 * @param {HTMLElement} node
	 */
	showSubscriptions: function(screenName, node) {
		var e = $.e,
			offset = 0,
			step = 100,
			allLoaded = false,
			wrap = e("div", {"class": "listView-wrap", append: getLoader()}),
			modal = new Modal({
				title: Lang.get("profiles.modalSubscriptionsTitleLoading"),
				content: wrap,
				noPadding: true,
				footer: [{
					name: "close",
					title: Lang.get("general.close"),
					onclick: function() { this.close() }
				}]
			}).show(node),
			load = function(callback) {
				api("execute", {
					code: "var i=API.utils.resolveScreenName({screen_name:Args.d}).object_id;return{u:API.users.get({user_id:i,fields:Args.f,name_case:\"gen\",v:5.52})[0],d:API.users.getSubscriptions({user_id:i,count:Args.c,extended:1,fields:Args.f,offset:parseInt(Args.o),v:5.52})};",
					d: screenName,
					c: step,
					f: "screen_name,first_name_gen,first_name_gen,photo_50,verified,online,sex",
					o: offset
				}).then(function(data) {
					if (!offset) {
						$.elements.clearChild(wrap);
					}

					modal.setTitle(Lang.get("profiles.modalSubscriptonsTitle").schema({n: data.u.first_name}));
					(data.d.items || []).map(function(u) {
						wrap.appendChild(Templates.getMiniUser(u));
					});

					if (wrap.children.length >= data.d.count) {
						allLoaded = true;
					}

					offset += data.d.items.length;

					callback && callback();

				});
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
		APIdogRequest("vk.getUserDateRegistration", {
			userId: userId
		}).then(function(data) {

			/** @var {{user, days, time}} data */
			//noinspection JSValidateTypes
			/** @var {{first_name, last_name, sex}} user */

			var user = Local.data[userId],

				text = user.first_name + " " + user.last_name + " " + Lang.get("profiles.registeredVerb")[user.sex] + " " + Lang.get("general.dateAt") + $.getDate(data.created) + " (" + formatNumber(data.days) + " " + $.textCase(data.days, Lang.get("profiles.registeredAgo")) + ")";

			//noinspection JSCheckFunctionSignatures
			return new Snackbar({text: text}).show();
		}).catch(function(error) {
			alert("Ошибка");
			console.error(error);
		});
	},

	/**
	 * Показывает дату последнего посещения
	 * @param  {int} userId Идентификатор пользователя
	 */
	showLastActivity: function(userId) {
		api("execute", {
			code: "var u=API.users.get({user_ids:Args.u,fields:\"last_seen,sex,online\",v:5.28})[0],a,t=API.utils.getServerTime()-u.last_seen.time;if(!u)return 0;if(u.online_app)a=API.apps.get({app_id:u.online_app});return{u:u,t:t,a:a};",
			u: userId
		}).then(function(data) {
			var user = data.u,
				app = data.a,
				left = data.t,
				startString = user.first_name.safe() + " " + Lang.get("general.was_sex")[user.sex] + " ",
				platformId = user.last_seen.platform,

				computeDifferentTime = function(d) {
					var t = [Math.floor(d / 60 % 60), Math.floor(d % 60)];
					return (
							t[0] > 0
								? t[0] + " " + Lang.get("profiles", "wasMinutesAgo", t[0]) + Lang.get("general.and")
								: ""
						) +
						t[1] +
						" " +
						Lang.get("profiles", "wasSecondsAgo", t[1]) + Lang.get("profiles.wasAgo");
				};

			user.online_mobile = user.online_mobile || platformId === User.PLATFORM.M_VK_COM;
			user.online = user.online || platformId === User.PLATFORM.WEB;

			platformId = platformId === User.PLATFORM.M_VK_COM || platformId === User.PLATFORM.WEB ? false : platformId;

			new Snackbar({
				text:
				startString +
				(left > 3600
						? new Date((user.last_seen && user.last_seen.time || 0) * 1000).long()
						: computeDifferentTime(left)
				) + (
					app || platformId
						? Lang.get("profiles.wasViaApp").schema({n: (app && app.title || Lang.get("profiles.wasApp")[platformId - 1])})
						: Lang.get(user.online_mobile ? "profiles.wasViaMobile" : "profiles.wasViaPC")
				)
			}).show();
		});
	},



};
