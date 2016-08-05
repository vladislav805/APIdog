/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Notifications = {
	getItems: function (data, noglobal) {
		data = Site.isResponse(data)[0];
		Local.AddUsers(data.profiles.concat(data.groups));
		var count = data.count;
		if (!noglobal || noglobal.toString() == "[object XMLHttpRequest]") {
			var parent = document.createElement("div");
			parent.appendChild(Feed.GetTabs());
			parent.appendChild(Site.CreateHeader(Lang.get("feed.tabs_notifications")));
			parent.id = "feed-notifications";
		} else {
			var parent = $.element("feed-notifications");
		}
		var from = data.new_from,
			offset = data.new_offset;
		parent.appendChild(Notifications.getNodeData(data.items, document.createElement("div"), data.last_viewed));
		if (data.count > 20)
			parent.appendChild($.elements.create("div", {"class": "notifications-more", html: Lang.get("notifications.load_more"), onclick: function (event) {
				if (this.disabled)
					return;
				var start = new Date(), button = this;
				button.innerHTML = "&nbsp;";
				$.elements.addClass(button, "msg-loader");
				button.disabled = true;
				start.setTime(start.getTime() - 1000 * 60 * 60 * 24 * 14);
				Site.APIv5("notifications.get", {
					start_time: parseInt(start / 1000),
					count: 20,
					from: from,
					offset: offset,
					v: 5.14
				}, function (data) {
					Notifications.getItems({response: [Site.isResponse(data)]}, true);
					$.elements.remove(button)
				});
			}}));
		Site.Append(parent);
		Site.SetHeader("Ответы", {link: "feed"});
	},
	getWriteForm: function (opts) {
		opts = opts || {};
		return Site.CreateWriteForm({
			name: "message",
			nohead: true,
			value: opts.user_id ? "[" + Local.Users[opts.user_id].screen_name + "|" + Local.Users[opts.user_id][opts.user_id > 0 ? "first_name" : "name"] + "], " : "",
			asAdmin: opts.admin,
			smiles: true,
			onsubmit: function (event) {
				var text = $.trim(Site.AddSlashes(this.message.value)),
					textElem = this.message,
					sub = this.submitbtn;
				if(!text) {
					Site.Alert({
						text: "Введите текст!",
						click: function (event) {
							textElem.focus();
						}
					});
					return false;
				}
				var elem = this.parentNode,
					params = {v: 4.99},
					form = this;
				params[opts.field == "topic_id" ? "group_id" : "owner_id"] = opts.owner_id;
				if (opts.comment_id)
					params.reply_to_comment = opts.comment_id;
				params[opts.text] = text;
				params[opts.field] = opts.item_id;
				if (this.as_admin && this.as_admin.checked)
					params.from_group = 1;
				sub.disabled = true;
				Site.API(opts.method, params, function (result) {
					data = Site.isResponse(result);
					textElem.value = "";
					sub.disabled = false;
					if (opts.callback)
						opts.callback(data, opts, params, form);
				})
				return false;
			}
		});
	},
	preventEvent: function (event) {return $.event.cancel(event);},
	getPhotoLinkProfile: function (user, opts) {
		return $.elements.create("a", {
			href: "#" + (user.screen_name || (user.uid || user.id > 0 ? "id" + (user.uid || user.id) : "club" + -(user.gid || user.id))),
			append: [
				$.elements.create("img", {src: getURL(user.photo_50 || user.photo_rec || user.photo), alt: "", "class": "notifications-photo " + (opts && opts.opt ? opts.opt : "")}),
				(opts && opts.icon ? $.e("div", {"class": "notifications-icon notifications-icon-" + opts.icon }) : null)
			]
		});
	},
	getComment: function (reply, opts) {
		opts = opts || {};
		var e = $.elements.create,
			owner_id = opts.owner_id,
			id = reply.id,
			from_id = reply.from_id || API.uid,
			user = Local.Users[from_id] || {},
			text = Mail.Emoji(Site.Format(reply.text)),
			attachments = Site.Attachment(reply.attachments, "comment");
		return e("div", {id: "notifications-comment-" + owner_id + "_" + id, append: [
			e("a", {"class": "comments-left", href: "#" + user.screen_name, append:
				e("img", {src: getURL(user.photo_rec || user.photo_50 || user.photo)})
			}),
			e("div", {"class": "comments-right", append: [
				e("strong", {append: e("a", {href: "#" + user.screen_name, html: user.name || user.first_name + " " + user.last_name + Site.isOnline(user)})}),
				e("div", {"class": "comments-content n-f", html: text}),
				e("div", {"class": "comments-attachments", append: attachments}),
				e("div", {"class": "comments-footer", append: [
					e("div", {"class": "comments-footer-left", html: $.getDate(reply.date)})
				]})
			]})
		]});
	},
	getLastViewedSeparator: function () {
		return $.e("div", {"class": "notifications-lastViewed", html: "↑ " + Lang.get("notifications.newer_items")});
	},
	getNodeData: function (data, parent, lastViewed) {
		var _users = Local.Users,
			item,
			user,
			elem,
			type,
			date,
			e = $.e,
			l = Lang.get,
			ilv = false,
			stdusr = {first_name: "%firstName%", last_name: "%lastName%", id: 0, screen_name: "id0"};
		data.forEach(function (item, i) {
			var post,
				left,
				right,
				feed,
				reply;
			date = item.date;
			type = item.type;
			post = item.parent;
			feed = item.feedback;
			reply = item.reply;
			left = e("div");
			right = e("div");
			elem = e("div");
			elem.className = "notifications-item";
			ok = 0;
			switch (type) {
				case "follow":
					var users = feed.items,
						first = _users[users[0].from_id] || stdusr,
						and = feed.count - 1;
					left.appendChild(Notifications.getPhotoLinkProfile(first, {icon: "plus"}));
					right.appendChild(e("div", {append: [
						e("strong", {append: e("a",{href: "#" + first.screen_name, html: first.first_name + " " + first.last_name})}),
						(and > 0 ? e("span", {"class": "tip", html: l("general.and") + and + l("notifications.followed_yet") + l("notifications", "users", and) + " "}) : null),
						e("span", {"class": "tip", html: (and ? l("notifications.followed_more") : (first.sex == 1 ? l("notifications.followed_female") : l("notifications.followed_male")))})
					]}));
					if (and > 0) {
						var yet = e("div");
						for (var j = 1, k = users.length; j < k; ++j)
							yet.appendChild(Notifications.getPhotoLinkProfile(_users[users[j].from_id], {opt: "notifications-photo-small"}));
						right.appendChild(yet);
					};
					right.appendChild(e("div", {"class": "notifications-date", html: $.getDate(date)}));
				break;
				case "like_post":
				case "like_comment":
				case "like_photo":
				case "like_video":
				case "like_comment_photo":
				case "like_comment_video":
				case "like_comment_topic":
					type = type.replace(/^like_/ig, "");
					var users = feed.items,
						str_type = l("notifications.liked_types")[type],
						first = _users[users[0].from_id] || stdusr,
						and = feed.count - 1,
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
						e("strong", {append: [e("a", {href: "#" + first.screen_name, html: first.first_name + " " + first.last_name})]}),
						(and > 0 ? e("span", {"class": "tip", html: l("general.and") + l("notifications.followed_yet") + and +  " " + l("notifications", "users", and) + " "}) : null),
						e("span", {"class": "tip", html: (and ? l("notifications.liked_more") : (first.sex == 1 ? l("notifications.liked_female") : l("notifications.liked_male"))) + " "}),
						e("a", {
							href: "#" + link,
							html: str_type
						})
					]}));
					if (and > 0) {
						var yet = e("div");
						for (var j = 1, k = users.length; j < k; ++j)
							yet.appendChild(Notifications.getPhotoLinkProfile(_users[users[j].from_id], {opt: "notifications-photo-small"}));
						right.appendChild(yet);
					};
					right.appendChild(e("div", {"class": "notifications-date", html: $.getDate(date, 1)}));
				break;
				case "wall":
				case "wall_publish":
					user = _users[feed.from_id];
					var text = Mail.Emoji(Site.Format(feed.text)),
						attachments = Site.Attachment(feed.attachments);
					left.appendChild(Notifications.getPhotoLinkProfile(user));
					right.appendChild(e("div", {append: [
						e("strong", {append: [
							e("a", {
								href: "#" + user.screen_name,
								html: user.name || user.first_name + " " + user.last_name + Site.isOnline(user)
							})
						]}),
						e("span", {"class": "tip", html: " " + l(feed.to_id == API.uid ? "notifications.on_your_wall" : "notifications.on_suggestition_request")})
					]}));
					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: text}),
						attachments
					]}));
					right.appendChild(e("a", {"class": "notifications-date", html: $.getDate(date), href: "#wall" + feed.to_id + "_" + feed.id}));
				break;
				case "copy_post":
				case "copy_photo":
				case "copy_video":
					type = type.replace(/^copy_/ig, "");
					var users = feed.items,
						str_type = l("notifications.repost_types")[type],
						first = _users[users[0].from_id] || stdusr,
						and = feed.count - 1,
						link = {
							post: "wall" + post.to_id + "_" + post.id,
							photo: "photo" + post.owner_id + "_" + post.id,
							video: "video" + post.owner_id + "_" + post.id
						}[type];
					left.appendChild(Notifications.getPhotoLinkProfile(first, {icon: "repost"}));
					right.appendChild(e("div", {append: [
						e("strong", {append: [e("a", {href: "#" + first.screen_name, html: first.first_name + " " + first.last_name})]}),
						(and > 0 ? $.elements.create("span", {"class": "tip", html: Lang.get("general.and") + and + Lang.get("notifications.followed_yet") + Lang.get("notifications", "users", and) + " "}) : null),
						e("span", {"class": "tip", html: (and ? Lang.get("notifications.reposted_more") : (first.sex == 1 ? Lang.get("notifications.reposted_female") : Lang.get("notifications.reposted_male"))) + " "}),
						e("a", {
							href: "#" + link,
							html: str_type
						})
					]}));
					if (and > 0) {
						var yet = document.createElement("div");
						for (var j = 1, k = users.length; j < k; ++j)
							yet.appendChild(Notifications.getPhotoLinkProfile(_users[users[j].from_id], {opt: "notifications-photo-small"}));
						right.appendChild(yet);
					}
					right.appendChild(e("div", {"class": "notifications-date", html: $.getDate(date)}));
				break;
				case "friend_accepted":
					var users = feed.items,
						first = _users[users[0].from_id] || stdusr,
						and = feed.count - 1;
					left.appendChild(Notifications.getPhotoLinkProfile(first, {icon: "plus-green"}));
					right.appendChild(e("div", {append: [
						e("strong", {append: [e("a", {href: "#" + first.screen_name, html: first.first_name + " " + first.last_name})]}),
						(and > 0 ? $.elements.create("span", {"class": "tip", html: Lang.get("general.and") + and + Lang.get("notifications.followed_yet") + Lang.get("notifications", "users", and) + " "}) : null),
						e("span", {"class": "tip", html: (and ? Lang.get("notifications.accepted_more") : (first.sex == 1 ? Lang.get("notifications.accepted_female") : Lang.get("notifications.accepted_male"))) + " "})
					]}));
					if (and > 0) {
						var yet = document.createElement("div");
						for (var j = 1, k = users.length; j < k; ++j)
							yet.appendChild(Notifications.getPhotoLinkProfile(_users[users[j].from_id], {opt: "notifications-photo-small"}));
						right.appendChild(yet);
					}
					right.appendChild(e("div", {"class": "notifications-date", html: $.getDate(date)}));
				break;
				case "mention":
				case "mention_comments":
					var isComment = type != "mention", form;
					if (!feed.to_id)
						feed.to_id = feed.from_id;
					creator = _users[feed.from_id] || stdusr;
					owner = _users[feed.to_id] || stdusr;
					left.appendChild(Notifications.getPhotoLinkProfile(creator));
					right.appendChild(e("div", {append: [
						e("strong", {append: [
							e("a", {href: "#" + creator.screen_name, html: creator.name || creator.first_name + " " + creator.last_name})
						], onclick: Notifications.preventEvent}),
						e("span", {"class": "tip", html: " " + Lang.get("notifications.mention_in_" + (isComment ? "comment" : "wall") + (creator.sex == 1 ? "_female" : "_male"))}),
						(feed.to_id < 0 ? e("span", {"class": "tip", html: Lang.get("notifications.mention_on_wall_group")}) : null),
						(feed.to_id < 0 ? e("a", {href: "#" + owner.screen_name, html: owner.name}) : null)
					]}));
					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: Mail.Emoji(Site.Format(feed.text))}),
						Site.Attachment(feed.attachments)
					]}));
					post = post || feed || {};
					right.appendChild(e("a", {href: "#" + (post.post_type === "post" ? "wall" : (post.post_type == "topic" ? "board" : feed.post_type)) + String(post.to_id * (post.post_type == "board" ? -1 : 1)) + "_" + post.id, "class": "notifications-date", html: $.getDate(date)}));
					if (!reply)
					{
						$.event.add(right, "click", (function (q) { return function (e) {
							var form;
							if (q.getAttribute("data-opened"))
								return;
							q.setAttribute("data-opened", "yes");
							q.appendChild(form = Notifications.getWriteForm({
								owner_id: ((feed && (feed.owner_id || feed.to_id)) || (post && (post.to_id || post.owner_id))),
								item_id: isComment ? post.id : feed.id,
								method: "wall.addComment",
								text: "text",
								field: "post_id",
								comment_id: "",
								user_id: feed.from_id,
								callback: function (data, opts, params, form) {
									var commentId = data.comment_id || data.cid;
									if (!commentId) {
										Site.Alert({text: "Ошибка отправки комментария"});
										return;
									}
									var reply = {
										id: commentId,
										text: params.text,
										date: (+new Date() / 1000),
										from_id: API.uid
									};
									var comment = Notifications.getComment(reply);
									comment.className = "notifications-feedbacked";
									form.parentNode.insertBefore(comment, form);
									$.elements.remove(form);
								}
							}));
						} })(right) );
					}
					else
					{
						var reply = Notifications.getComment(reply);
						reply.className = "notifications-feedbacked";
						right.appendChild(reply);
					};

				break;
				case "comment_post":
				case "comment_photo":
				case "comment_video":
					var type = type.replace(/^comment_/ig, "");
					if (!feed.to_id)
						feed.to_id = post.to_id || post.from_id || parent.owner_id;
					creator = _users[feed.from_id] || stdusr;
					owner = _users[feed.to_id] || stdusr;
					var link = {post: "wall", photo: "photo", video: "video"}[type] + (post.to_id || post.owner_id) + "_" + post.id;
					left.appendChild(Notifications.getPhotoLinkProfile(creator));
					right.appendChild(e("div", {append: [
						e("strong", {append: [
							e("a", {href: "#" + creator.screen_name, html: creator.name || creator.first_name + " " + creator.last_name})
						], onclick: Notifications.preventEvent}),
						e("span", {"class": "tip", html: " " + Lang.get("notifications.comment_" + (creator.sex == 1 ? "fe" : "") + "male") + " "}),
						e("a", {html: Lang.get("notifications.comment_in_" + type), href: "#" + link}),
						(feed.to_id < 0 ? e("span", {"class": "tip", html: Lang.get("notifications.mention_on_wall_group")}) : null),
						(feed.to_id < 0 ? e("a", {href: "#" + owner.screen_name, html: owner.name}) : null)
					]}));
					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: Mail.Emoji(Site.Format(feed.text))}),
						Site.Attachment(feed.attachments)
					]}));
					console.log(feed)
					right.appendChild(e("div", {"class": "notifications-date", html: $.getDate(date)}));
					if (!reply)
					{
						$.event.add(right, "click", (function (q) { return function (e) {
							var form;
							if (q.getAttribute("data-opened"))
								return;
							q.setAttribute("data-opened", "yes");
							q.appendChild(form = Notifications.getWriteForm({
								owner_id: feed.to_id || parent.owner_id,
								item_id: post.id,
								method: {post: "wall.addComment", photo: "photos.createComment", video: "video.createComment"}[type],
								text: "text",
								field: {post: "post_id", photo: "photo_id", video: "video_id"}[type],
								comment_id: feed.id,
								user_id: feed.from_id,
								callback: function (data, opts, params, form) {
									var commentId = data.comment_id || data.cid;
									if (!commentId) {
										Site.Alert({text: "Ошибка отправки комментария"});
										return;
									}
									var reply = {
										id: commentId,
										text: params.text,
										date: (+new Date() / 1000),
										from_id: API.uid
									};
									var comment = Notifications.getComment(reply);
									comment.className = "notifications-feedbacked";
									form.parentNode.insertBefore(comment, form);
									$.elements.remove(form);
								}
							}));
						}})(right) );
					}
					else
					{
						var reply = Notifications.getComment(reply);
						reply.className = "notifications-feedbacked";
						right.appendChild(reply);
					};
				break;
				case "reply_comment":
				case "reply_comment_photo":
				case "reply_comment_video":
				case "reply_topic":
					var type = {
						comment: "wall",
						comment_photo: "photo",
						comment_video: "video",
						topic: "topic"
					}[type.replace(/^reply_/ig, "")];
					if (!feed.to_id) {
						feed.to_id = post.to_id || post.from_id;
						if (type == "wall")
							feed.to_id = post.post.to_id;
					}
					creator = _users[feed.from_id] || stdusr;
					owner = _users[feed.to_id] || stdusr;
					var link = [
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
					left.appendChild(Notifications.getPhotoLinkProfile(creator));
					right.appendChild(e("div", {append: [
						e("strong", {append: [
							e("a", {href: "#" + creator.screen_name, html: creator.name || creator.first_name + " " + creator.last_name})
						], onclick: Notifications.preventEvent}),
						e("span", {"class": "tip", html: " " + Lang.get("notifications.reply_" + (creator.sex == 1 ? "fe" : "") + "male_in_comment") + " "}),
						e("a", {html: Lang.get("notifications.reply_in_" + type), href: "#" + link}),
						(feed.to_id < 0 ? e("span", {"class": "tip", html: Lang.get("notifications.mention_on_wall_group")}) : null),
						(feed.to_id < 0 ? e("a", {href: "#" + owner.screen_name, html: owner.name}) : null)
					]}));
					right.appendChild(e("div", {append: [
						e("div", {"class": "n-f", html: Mail.Emoji(Site.Format(feed.text))}),
						Site.Attachment(feed.attachments)
					]}));
					right.appendChild(e("div", {"class": "notifications-date", html: $.getDate(date)}));
					if (!reply)
					{
						$.event.add(right, "click", (function (q) { return function (e) {
							var form;
							if (q.getAttribute("data-opened"))
								return;
							console.log(post, right, feed);
							q.setAttribute("data-opened", "yes");
							q.appendChild(form = Notifications.getWriteForm({
								owner_id: {wall: post.post && post.post.to_id, photo: post.owner_id, video: post.owner_id, topic: -post.owner_id}[type],
								admin: feed.to_id < 0 ? owner.is_admin : false,
								item_id: (type == "wall" ? post.post.id : post.id),
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
									var commentId = data.comment_id || data.cid || data.id || data;
									if (
										params.field == "post_id" && !commentId ||
										!data
									) {
										Site.Alert({text: "Ошибка отправки комментария"});
										return;
									}
									var reply = {
										id: commentId || data,
										text: params[{wall: "text", photo: "message", video: "message", topic: "text", post: "text"}[type]],
										date: (+new Date() / 1000),
										from_id: API.uid
									}
									var comment = Notifications.getComment(reply);
									comment.className = "notifications-feedbacked";
									form.parentNode.insertBefore(comment, form);
									$.elements.remove(form);
								}
							}) );
						}})(right));
					}
					else
					{
						var reply = Notifications.getComment(reply);
						reply.className = "notifications-feedbacked";
						right.appendChild(reply);
					};
				break;
			}
			left.className = "notifications-left";
			right.className = "notifications-right";
			elem.appendChild(left);
			elem.appendChild(right);
			parent.appendChild(elem);
			if (!ilv && item.date > lastViewed && data[i - 1] && data[i].date < lastViewed) {
				parent.appendChild(Notifications.getLastViewedSeparator());
				ilv = true;
			};
		});
		return parent;
	}
};