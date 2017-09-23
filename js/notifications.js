var Notifications = {

	init: function() {

		var parent = $.e("div", {id: "feed-notifications"}),
			list = $.e("div", {append: Site.Loader(true)});
		parent.appendChild(Feed.getTabs());
		parent.appendChild(Site.getPageHeader(
			Lang.get("feed.tabs_notifications"),
			isEnabled(Setting.LEFT_NOTIFICATIONS_COUNTER)
				? $.e("span", {"class": "a fr mbo", html: "Сбросить счетчик", onclick: function() {
					Notifications.setAsViewed().then(function(data) {
						Site.Alert({text: "Счетчик ответов сброшен"});
						Site.counters.notifications = 0;
						Site.setCounters();
						return data;
					});
				}})
				: null
		));

		parent.appendChild(list);

		Site.append(parent);
		Site.setHeader("Ответы", {link: "feed"});

		Notifications.requestItems().then(Notifications.show.bind(Notifications, list));
		!isEnabled(Setting.LEFT_NOTIFICATIONS_COUNTER) && Notifications.setAsViewed();
	},

	DEFAULT_COUNT: 40,

	/**
	 * Reset counters
	 * @returns {Promise.<boolean>}
	 */
	setAsViewed: function() {
		return api("notifications.markAsViewed");
	},

	/**
	 * Returns value for parameter start_time
	 * @returns {int}
	 */
	getStartTime: function() {
		return parseInt((Date.now() - (365 * DAY)) / 1000);
	},

	/**
	 * Request for list notifications
	 * @param {string=} startFrom
	 * @returns {Promise}
	 */
	requestItems: function(startFrom) {
		return api("notifications.get", {
			start_time: Notifications.getStartTime(),
			count: Notifications.DEFAULT_COUNT,
			start_from: startFrom || "",
			filters: "wall,mentions,comments,likes,reposts,followers,friends",
			v: 5.56
		}).then(function(result) {
			Local.add(result.profiles);
			Local.add(result.groups);
			return result;
		});
	},

	/**
	 * Show items on list page
	 * @param {HTMLElement} list
	 * @param {{count: int, items: object[], profiles: User[], groups: User[], last_viewed: int, next_from: string}} data
	 */
	show: function(list, data) {
		var u = Local.data,
			user,
			elem,
			date,
			e = $.e,
			l = Lang.get,
			isLastViewedInserted = false,
			su = {first_name: "%firstName%", last_name: "%lastName%", id: 0, screen_name: "id0"};

		if (list.firstChild === list.lastChild && list.firstChild.style) {
			$.elements.clearChild(list);
		}

		data.items.forEach(
			/**
			 *
			 * @param {{type: string, date: int, parent: object, feedback: object, reply: object=}} item
			 * @param {int} i
			 */
			function(item, i) {



			var type;

			var post,
				left,
				right,
				feed,
				reply,
			users, first, and, link;

			date = item.date;
			post = item.parent;
			feed = item.feedback;
			reply = item.reply;
			left = e("div");
			right = e("div");
			elem = e("div", {"class": "notifications-item"});

			switch (item.type) {

				case "follow":
					users = feed.items;
					first = u[users[0].from_id] || su;
					and = feed.count - 1;

					left.appendChild(Notifications.getPhotoLinkProfile(first, {icon: "plus"}));

					right.appendChild(e("div", {append: [
						e("strong", {append: e("a",{href: "#" + first.screen_name, html: getName(first)})}),

						and
							? e("span", {"class": "tip", html: l("general.and") + and + l("notifications.followed_yet") + l("notifications", "users", and) + " "})
							: null,

						e("span", {"class": "tip", html: (and
							? l("notifications.followed_more")
							: (first.sex === 1 ? l("notifications.followed_female") : l("notifications.followed_male"))
						)})
					]}));

					if (and) {
						right.appendChild(e("div", {append: users.map(function(usr, index) {
							return index && Notifications.getPhotoLinkProfile(u[usr.from_id], {opt: "notifications-photo-small"});
						})}));
					}

					right.appendChild(e("div", {"class": "notifications-date", "data-time": date, html: getDate(date, APIDOG_DATE_FORMAT_SMART)}));
					break;

				case "like_post":
				case "like_comment":
				case "like_photo":
				case "like_video":
				case "like_comment_photo":
				case "like_comment_video":
				case "like_comment_topic":
					type = item.type.replace("like_", "");
					users = feed.items;

					first = u[users[0].from_id] || su;
					and = feed.count - 1;

					link = {
						post: "wall" + post.to_id + "_" + post.id,
						comment: "wall" + (post.post && post.post.to_id) + "_" + (post.post && post.post.id) + "?reply=" + post.id,
						photo: "photo" + post.owner_id + "_" + post.id,
						video: "video" + post.owner_id + "_" + post.id,
						comment_photo: "photo" + (post.photo && post.photo.owner_id) + "_" + (post.photo && post.photo.id) + "?offset=0&_=1",
						comment_video: "video" + (post.video && post.video.owner_id) + "_" + (post.video && post.video.id) + "?offset=0&_=1",
						comment_topic: "board" + (post.topic && -post.topic.owner_id) + "_" + (post.topic && post.topic.id) + "?id=" + post.id
					}[type];

					left.appendChild(Notifications.getPhotoLinkProfile(first, {icon: "like"}));

					right.appendChild(e("div", {append: [
						e("strong", {append: [e("a", {href: "#" + first.screen_name, html: getName(first)})]}),

						and
							? e("span", {"class": "tip", html: l("general.and") + l("notifications.followed_yet") + and + " " + l("notifications", "users", and) + " "})
							: null,

						e("span", {"class": "tip", html: (and
							? l("notifications.liked_more")
							: (first.sex === 1 ? l("notifications.liked_female") : l("notifications.liked_male"))
						) + " "}),

						e("a", {
							href: "#" + link,
							html: l("notifications.liked_types")[type]
						})
					]}));

					if (and) {
						right.appendChild(e("div", {append: users.map(function(usr, index) {
							return index && Notifications.getPhotoLinkProfile(u[usr.from_id], {opt: "notifications-photo-small"});
						})}));
					}

					right.appendChild(e("div", {"class": "notifications-date", "data-time": date, html: getDate(date, APIDOG_DATE_FORMAT_SMART)}));
					break;

				case "wall":
				case "wall_publish":
					user = u[feed.from_id];

					left.appendChild(Notifications.getPhotoLinkProfile(user));

					right.appendChild(e("div", {append: [
						e("strong", {append: e("a", {
							href: "#" + user.screen_name,
							html: getName(user)
						}) }),
						e("span", {"class": "tip", html: " " + l(feed.to_id === API.userId ? "notifications.on_your_wall" : "notifications.on_suggestion_request")})
					]}));

					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: Site.toHTML(feed.text).emoji()}),
						Site.createNodeAttachments(feed.attachments)
					]}));

					right.appendChild(e("a", {"class": "notifications-date", "data-time": date, html: getDate(date, APIDOG_DATE_FORMAT_SMART), href: "#wall" + feed.to_id + "_" + feed.id}));
					break;

				case "copy_post":
				case "copy_photo":
				case "copy_video":
					type = item.type.replace(/^copy_/ig, "");
					users = feed.items;
					first = u[users[0].from_id] || su;
					and = feed.count - 1;
					link = {
						post: "wall" + post.to_id + "_" + post.id,
						photo: "photo" + post.owner_id + "_" + post.id,
						video: "video" + post.owner_id + "_" + post.id
					}[type];

					left.appendChild(Notifications.getPhotoLinkProfile(first, {icon: "repost"}));

					right.appendChild(e("div", {append: [
						e("strong", {append: e("a", {href: "#" + first.screen_name, html: getName(first)})}),

						and
							? e("span", {"class": "tip", html: l("general.and") + and + l("notifications.followed_yet") + l("notifications", "users", and) + " "})
							: null,

						e("span", {"class": "tip", html: (and
							? l("notifications.reposted_more")
							: (first.sex === 1 ? Lang.get("notifications.reposted_female") : Lang.get("notifications.reposted_male"))
						) + " "}),

						e("a", {
							href: "#" + link,
							html: l("notifications.repost_types")[type]
						})
					]}));
					if (and) {
						right.appendChild(e("div", {append: users.map(function(usr, index) {
							return index && Notifications.getPhotoLinkProfile(u[usr.from_id], {opt: "notifications-photo-small"});
						})}));
					}
					right.appendChild(e("div", {"class": "notifications-date", "data-time": date, html: getDate(date, APIDOG_DATE_FORMAT_SMART)}));
					break;

				case "friend_accepted":
					users = feed.items;
					first = u[users[0].from_id] || su;
					and = feed.count - 1;

					left.appendChild(Notifications.getPhotoLinkProfile(first, {icon: "plus-green"}));

					right.appendChild(e("div", {append: [
						e("strong", {append: e("a", {href: "#" + first.screen_name, html: getName(first)})}),

						and
							? e("span", {"class": "tip", html: l("general.and") + and + l("notifications.followed_yet") + l("notifications", "users", and) + " "})
							: null,

						e("span", {"class": "tip", html: (and
							? l("notifications.accepted_more")
							: (first.sex === 1 ? l("notifications.accepted_female") : l("notifications.accepted_male"))
						) + " "})
					]}));

					if (and) {
						right.appendChild(e("div", {append: users.map(function(usr, index) {
							return index && Notifications.getPhotoLinkProfile(u[usr.from_id], {opt: "notifications-photo-small"});
						})}));
					}
					right.appendChild(e("div", {"class": "notifications-date", "data-time": date, html: getDate(date, APIDOG_DATE_FORMAT_SMART)}));
					break;

				case "mention":
				case "mention_comments":
					var isComment = item.type !== "mention";

					if (!feed.to_id) {
						feed.to_id = feed.from_id;
					}

					var creator = u[feed.from_id] || su;
					var owner = u[feed.to_id] || su;

					left.appendChild(Notifications.getPhotoLinkProfile(creator, {icon: "mention"}));

					right.appendChild(e("div", {append: [
						e("strong", {
							append: e("a", {href: "#" + creator.screen_name, html: getName(creator), onclick: Notifications.stopPropagation}),
							onclick: Notifications.stopPropagation
						}),

						e("span", {"class": "tip", html: " " + l("notifications.mention_in_" + (isComment ? "comment" : "wall") + (creator.sex === 1 ? "_female" : "_male"))}),

						feed.to_id < 0
							? e("span", {"class": "tip", html: l("notifications.mention_on_wall_group")})
							: null,

						feed.to_id < 0
							? e("a", {href: "#" + owner.screen_name, html: owner.name.safe(), onclick: Notifications.stopPropagation})
							: null
					]}));

					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: Site.toHTML(feed.text).emoji()}),
						Site.createNodeAttachments(feed.attachments)
					]}));

					post = post || feed || {};
					right.appendChild(e("a", {
						"class": "notifications-date",
						href: "#" + (post.post_type === "post" ? "wall" : feed.post_type) + String(post.to_id) + "_" + post.id,
						"data-time": date,
						html: getDate(date, APIDOG_DATE_FORMAT_SMART),
						onclick: Notifications.stopPropagation
					}));

					if (!reply) {
						right.addEventListener("click", function() {
							if (right.dataset.opened) {
								return;
							}
							right.dataset.opened = true;

							right.appendChild(Notifications.getWriteForm({
								owner_id: (feed && (feed.owner_id || feed.to_id)) || (post && (post.to_id || post.owner_id)),
								item_id: isComment ? post.id : feed.id,
								method: "wall.createComment",
								text: "text",
								field: "post_id",
								comment_id: "",
								user_id: feed.from_id,
								callback: function(data, opts, params, form) {
									var commentId = data.comment_id || data.cid || data.id;

									if (!commentId) {
										Site.Alert({text: "Ошибка отправки комментария"});
										return;
									}

									var reply = {
											id: commentId,
											text: params.text,
											date: (Date.now() / 1000),
											from_id: API.userId
										},
										comment = Notifications.getComment(reply);
									form.parentNode.insertBefore(comment, form);
									$.elements.remove(form);
								}
							}));
						});
					} else {
						reply = Notifications.getComment(reply);
						right.appendChild(reply);
					}
					break;

				case "comment_post":
				case "comment_photo":
				case "comment_video":
					type = item.type.replace("comment_", "");

					if (!feed.to_id) {
						feed.to_id = post.to_id || post.from_id || post.owner_id;
					}

					creator = u[feed.from_id] || su;
					owner = u[feed.to_id] || su;
					link = {post: "wall", photo: "photo", video: "video"}[type] + (post.to_id || post.owner_id) + "_" + post.id;

					left.appendChild(Notifications.getPhotoLinkProfile(creator));

					right.appendChild(e("div", {append: [
						e("strong", {append: e("a", {href: "#" + creator.screen_name, html: getName(creator), onclick: Notifications.stopPropagation}) }),

						e("span", {"class": "tip", html: " " + l("notifications.comment_" + (creator.sex === 1 ? "fe" : "") + "male") + " "}),
						e("a", {html: l("notifications.comment_in_" + type), href: "#" + link, onclick: Notifications.stopPropagation}),

						feed.to_id < 0
							? e("span", {"class": "tip", html: l("notifications.mention_on_wall_group")})
							: null,

						feed.to_id < 0
							? e("a", {href: "#" + owner.screen_name, html: owner.name, onclick: Notifications.stopPropagation})
							: null
					]}));

					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: Site.toHTML(feed.text).emoji()}),
						Site.createNodeAttachments(feed.attachments)
					]}));

					right.appendChild(e("div", {"class": "notifications-date", "data-time": date, html: getDate(date, APIDOG_DATE_FORMAT_SMART)}));

					if (!reply) {

						right.addEventListener("click", function() {
							if (right.dataset.opened) {
								return;
							}
							right.dataset.opened = true;

							right.appendChild(Notifications.getWriteForm({
								owner_id: feed.to_id || post.owner_id,
								item_id: post.id,
								method: {post: "wall.addComment", photo: "photos.createComment", video: "video.createComment"}[type],
								text: "text",
								field: {post: "post_id", photo: "photo_id", video: "video_id"}[type],
								comment_id: feed.id,
								user_id: feed.from_id,
								callback: function(data, opts, params, form) {
									var commentId = data.comment_id || data.cid || data.id;

									if (!commentId) {
										Site.Alert({text: "Ошибка отправки комментария"});
										return;
									}

									var reply = {
											id: commentId,
											text: params.text,
											date: (Date.now() / 1000),
											from_id: API.userId
										},
										comment = Notifications.getComment(reply);
									form.parentNode.insertBefore(comment, form);
									$.elements.remove(form);
								}
							}));
						});
					} else {
						reply = Notifications.getComment(reply);
						right.appendChild(reply);
					}
					break;

				case "reply_comment":
				case "reply_comment_photo":
				case "reply_comment_video":
				case "reply_topic":
					type = {
						comment: "wall",
						comment_photo: "photo",
						comment_video: "video",
						topic: "topic"
					}[item.type.replace("reply_", "")];

					if (!feed.to_id) {
						feed.to_id = post.to_id || post.from_id;
						if (type === "wall") {
							feed.to_id = post.post.to_id;
						}
					}

					creator = u[feed.from_id] || su;
					owner = u[feed.to_id] || su;

					link = [
						{
							wall: "wall",
							photo: "photo",
							video: "video",
							topic: "board"
						}[type],
						{
							wall: post.post && post.post.to_id,
							photo: post.photo && post.photo.owner_id,
							video: post.video && post.video.owner_id,
							topic: -post.owner_id
						}[type],
						"_",
						{
							wall: post.post && post.post.id,
							photo: post.photo && post.photo.id,
							video: post.video && post.video.id,
							topic: post && post.id
						}[type]
					].join("");

					left.appendChild(Notifications.getPhotoLinkProfile(creator, {icon: "comment"}));

					right.appendChild(e("div", {append: [
						e("strong", {append: e("a", {href: "#" + creator.screen_name, html: getName(creator), onclick: Notifications.stopPropagation}) }),

						e("span", {"class": "tip", html: " " + l("notifications.reply_" + (creator.sex === 1 ? "fe" : "") + "male_in_comment") + " "}),

						e("a", {html: Lang.get("notifications.reply_in_" + type), href: "#" + link, onclick: Notifications.stopPropagation}),

						feed.to_id < 0
							? e("span", {"class": "tip", html: l("notifications.mention_on_wall_group")})
							: null,

						feed.to_id < 0
							? e("a", {href: "#" + owner.screen_name, html: owner.name, onclick: Notifications.stopPropagation})
							: null
					]}));

					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: Site.toHTML(feed.text).emoji()}),
						Site.createNodeAttachments(feed.attachments)
					]}));

					right.appendChild(e("div", {"class": "notifications-date", "data-time": date, html: getDate(date, APIDOG_DATE_FORMAT_SMART)}));

					if (!reply) {
						right.addEventListener("click", function() {
							if (right.dataset.opened) {
								return;
							}

							right.dataset.opened = true;

							right.appendChild(Notifications.getWriteForm({
								owner_id: {
									wall: post.post && post.post.to_id,
									photo: post.owner_id,
									video: post.owner_id,
									p: -post.owner_id
								}[type],
								item_id: (type === "wall" ? post.post.id : post.id),
								method: {
									wall: "wall.addComment",
									photo: "photos.createComment",
									video: "video.createComment",
									topic: "board.addComment"
								}[type],
								text: {
									wall: "text",
									photo: "message",
									video: "message",
									topic: "text"
								}[type],
								field: {
									wall: "post_id",
									photo: "photo_id",
									video: "video_id",
									topic: "topic_id"
								}[type],
								comment_id: feed.id,
								user_id: feed.from_id,
								callback: function (data, opts, params, form) {

									var commentId = data.comment_id || data.cid || data.id;

									if (params.field === "post_id" && !commentId || !data) {
										Site.Alert({text: "Ошибка отправки комментария"});
										return;
									}

									var reply = {
											id: commentId || data,
											text: params[{
												wall: "text",
												photo: "message",
												video: "message",
												topic: "text",
												post: "text"
											}[type]],
											date: (Date.now() / 1000),
											from_id: API.userId
										},
										comment = Notifications.getComment(reply);
									form.parentNode.insertBefore(comment, form);
									$.elements.remove(form);
								}
							}));
						});
					} else {
						reply = Notifications.getComment(reply);
						right.appendChild(reply);
					}
					break;
			}

			left.className = "notifications-left";
			right.className = "notifications-right";

			elem.appendChild(left);
			elem.appendChild(right);

			list.appendChild(elem);

			if (!isLastViewedInserted && item.date > data.last_viewed && data.items[i + 1] && data.items[i + 1].date < data.last_viewed) {
				list.appendChild(Notifications.getLastViewedSeparator());
				isLastViewedInserted = true;
			}
		});

		data.next_from && list.appendChild($.e("div", {"class": "notifications-more", html: l("notifications.load_more"), onclick: function() {
			if (this.dataset.loading) {
				return;
			}
			this.dataset.loading = true;

			var button = this;
			button.innerHTML = "&nbsp;";
			Notifications.requestItems(data.next_from).then(function(result) {
				//noinspection JSCheckFunctionSignatures
				$.elements.remove(button);
				return result;
			}).then(Notifications.show.bind(Notifications, list));
		}}));
	},


	getWriteForm: function(opts) {
		opts = opts || {};
		var form = Site.getExtendedWriteForm({
			name: "message",
			noHead: true,

			value: opts.user_id ? "[" + Local.data[opts.user_id].screen_name + "|" + Local.data[opts.user_id][opts.user_id > 0 ? "first_name" : "name"] + "], " : "",
			asAdmin: opts.owner_id < 0 && Local.data[opts.owner_id].is_admin,
			smiles: true,

			allowAttachments: APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT | APIDOG_EMOTIONS_MODE_STICKERS,
			ctrlEnter: true,
			enableCtrlVFiles: true,

			onSend: function(event) {
				var text = event.text,
					attachments = event.attachments.toString(),

					params = getDefaultParams();

				if (!text && !attachments) {
					return false;
				}

				params[opts.text] = text;
				params.attachments = attachments;


				if (event.asAdmin) {
					params.from_group = 1;
				}

				api(opts.method, params).then(function(data) {
					event.clear();

					opts.callback && opts.callback(data, opts, params, form.getNode());
				});
				return false;
			}
		}, opts.owner_id, opts.item_id),

		getDefaultParams = function() {
			var params = {v: 5.56};
			params[opts.field === "topic_id" ? "group_id" : "owner_id"] = opts.owner_id;

			if (opts.comment_id) {
				params.reply_to_comment = opts.comment_id;
			}

			params[opts.field] = opts.item_id;
			return params;
		};

		form.getEmotions().setOnClick(function(type, stickerId) {
			var params = getDefaultParams();

			if (form.getFromGroup()) {
				params.from_group = 1;
			}

			params.sticker_id = stickerId;

			api(opts.method, params).then(function(data) {
				form.clear();
				opts.callback && opts.callback(data, opts, params, form.getNode());
			});
			form.getEmotions().close();
		});

		return form.getNode();
	},

	/**
	 * Stop bubbling and prevent default events
	 * @param {Event} event
	 */
	stopPropagation: function(event) {
		event.cancelBubble = true;
		event.stopPropagation && event.stopPropagation();
	},

	/**
	 * Returns photo
	 * @param {User} user
	 * @param {{icon: string=, opt: string=}=} opts
	 * @returns {*|HTMLElement}
	 */
	getPhotoLinkProfile: function (user, opts) {
		return $.e("a", {
			href: "#" + user.screen_name,
			append: [
				$.e("img", {src: getURL(user.photo_50), alt: "", "class": "notifications-photo " + (opts && opts.opt ? opts.opt : "")}),
				opts && opts.icon
					? $.e("div", {"class": "notifications-icon notifications-icon-" + opts.icon })
					: null
			],
			onclick: Notifications.stopPropagation
		});
	},

	/**
	 * Return item of comment
	 * @param {object} reply
	 * @param {{owner_id: int}=} opts
	 * @returns {HTMLElement}
	 */
	getComment: function(reply, opts) {
		opts = opts || {};
		var e = $.e,
			owner_id = opts.owner_id,
			id = reply.id,
			from_id = reply.from_id || API.userId,
			user = Local.data[from_id] || {},
			text = Site.toHTML(reply.text).emoji(),
			attachments = Site.createNodeAttachments(reply.attachments, "comment");
		return e("div", {"class": "comment notifications-comment-replied", id: "comment-" + owner_id + "_" + id, append: [
			e("a", {"class": "comment-left", href: "#" + user.screen_name, append:
				e("img", {src: getURL(user.photo_50 || user.photo)})
			}),
			e("div", {"class": "comment-right", append: [
				e("strong", {append: e("a", {href: "#" + user.screen_name, html: getName(user)})}),
				e("div", {"class": "comment-content", html: text}),
				e("div", {"class": "comment-attachments", append: attachments}),
				e("div", {"class": "comment-footer", append:
					e("div", {"class": "comment-meta", append:
						e("a", {"class": "comment-date", html: $.getDate(reply.date)}) }) // TODO: link to comment
				})
			]})
		]});
	},

	getLastViewedSeparator: function () {
		return $.e("div", {"class": "notifications-lastViewed", html: "↑ " + Lang.get("notifications.newer_items")});
	}
};