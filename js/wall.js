var Wall = {

	Resolve: function (url) {
		Site.Loader();
		var ownerId, offset, postId;
		if (/^wall(-?\d+)$/.test(url)) {
			ownerId = parseInt(/^wall(-?\d+)$/.exec(url)[1]);
			offset = getOffset();
			switch (Site.get("act")) {
				case "suggested":
					Wall.getRequestExtraWall(ownerId, offset, Wall.FILTER_SUGGESTED);
					break;

				case "postponed":
					Wall.getRequestExtraWall(ownerId, offset, Wall.FILTER_POSTPONED);
					break;

				default:
					Wall.getNodeWall(ownerId, offset);
			}
		} else if (/^wall(-?\d+)_(\d+)$/.test(url)) {
			var ids = /wall(-?\d+)_(\d+)/.exec(url);
			ownerId = ids[1];
			postId = ids[2];
			switch (Site.get("act")) {
				case "reposts":
					Wall.getReposts(ownerId, postId, getOffset());
					break;

				case "edit":
					Wall.edit(ownerId, postId);
					break;

				default:
					return Wall.showOnePost(ownerId, postId);
			}
		} else {

		}
	},

	getNodeWall: function(ownerId, opts) {
		var e = $.e,

			data = opts.data,

			parent = e("div", {
				"class": "wall-profile-wrap",
				id: "wall-wrap" + ownerId
			}),

			list = e("div", {
				id: "wall-list" + ownerId
			}),
			wall,
			count;

		count = data.count;
		wall = data && data.items || [];

		data.profiles && Local.add(data.profiles.concat(data.groups));

		parent.appendChild(Site.getPageHeader(Lang.get("wall.wall") + " <i>" + count + " " + Lang.get("wall.posts", count) + "<\/i>"));

		if (opts.canPost || opts.canSuggest) {
			var form = Site.getExtendedWriteForm({
				name: "message",
				noLeftPhoto: true,
				noHead: true,

				onSend: function(event) {
					var send = function() {
						Wall.sendPost(ownerId, event).then(function(data) {
							list.insertBefore(Wall.getItemPost(data, data.to_id, data.id, {deleteBtn: true}), list.firstChild);
							form.clear();
						});
					};

					if (!event.text && !event.attachments.toString()) {
						return false;
					}


					if (ownerId === API.userId && !isEnabled(Setting.ENABLED_ONLINE) && !event.publishDate) {
						var cnf = new Modal({
							title: Lang.get("wall.postingWarningTimerTitle"),
							content: Lang.get("wall.postingWarningTimerContent"),
							footer: [
								{
									name: "post",
									title: Lang.get("general.send"),
									onclick: function() {
										send();
										cnf.close();
									}
								},
								{
									name: "timer",
									title: Lang.get("wall.postingWarningTimerLater"),
									onclick: function() {
//										q.push("publish_date:API.utils.getServerTime()+(60*5)");
										event.publishDate = parseInt(Date.now() / 1000) + 60 * 5;
										send();
										cnf.close();
									}
								},
								{
									name: "cancel",
									title: Lang.get("general.cancel"),
									onclick: function() {
										cnf.close();
									}
								}
							]
						}).show();
					} else {
						send();
					}
					return false;
				},

				mbo: ownerId === API.userId,

				allowAttachments: (
					APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT | APIDOG_ATTACHMENT_LINK | APIDOG_ATTACHMENT_MAP | APIDOG_ATTACHMENT_ALBUM | APIDOG_ATTACHMENT_POLL | APIDOG_ATTACHMENT_TIMER
				),

				autoHeightTextarea: true,
				enableCtrlVFiles: true,
				ctrlEnter: true,
				autoSave: "wall" + API.userId,

				friendsOnly: ownerId > 0 && ownerId === API.userId,
				asAdmin: ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin && Local.data[ownerId].type === "page",
				withSign: ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin,
				maxCount: 10
			}, ownerId, 0);
			parent.appendChild(form.getNode());
		}

		if (data.count) {
			for (var i = 0, post; post = wall[i]; ++i) {
				list.appendChild(Wall.getItemPost(post, post.owner_id, post.id, {
					deleteBtn: true
				}));
			}
		} else {
			list.appendChild(Site.getEmptyField("Нет ни одной записи"));
		}

		if (opts && opts.extra) {
			$.elements.append(parent, Wall.getExtraLinks(ownerId, opts.extra));
		}

		parent.appendChild(list);
		parent.appendChild(Site.getSmartPagebar(getOffset(), count, 25));

		return parent;
	},

	/**
	 * Send post
	 * @param {int} ownerId
	 * @param event
	 */
	sendPost: function(ownerId, event) {
		var ll = event.attachments.getGeo();
		return new Promise(function(resolve) {
			api("execute", {
				code: "var o=parseInt(Args.o),p=API.wall.post({owner_id:o,message:Args.t,attachments:Args.a,from_group:parseInt(Args.g)==1,signed:parseInt(Args.s)==1,friends_only:parseInt(Args.f)==1,publish_date:parseInt(Args.p),lat:parseDouble(Args.lt),\"long\":parseDouble(Args.lg)}).post_id;" +
				"return API.wall.getById({posts:o+\"_\"+p,v:5.63})[0];",
				o: ownerId,
				t: event.text,
				a: event.attachments.toString(),
				g: event.fromGroup,
				s: event.withSign,
				f: event.friendsOnly,
				p: event.publishDate,
				lt: ll && ll[0] || 0,
				lg: ll && ll[1] || 0,
				v: 5.63
			}).then(function(data) {
				resolve(data);
			});
		});
	},

	getExtraLinks: function (ownerId, extra) {
		var d = [], e = $.e, l = Lang.get;

		if (extra.s) {
			d.push(e("a", {
				"class": "wall-extra-buttons",
				href: "#wall" + ownerId + "?act=suggested",
				html: l("wall.filter_suggests").replace(/%i/i, extra.s)
			}));
		}

		if (extra.p) {
			d.push(e("a", {
				"class": "wall-extra-buttons",
				href: "#wall" + ownerId + "?act=postponed",
				html: l("wall.filter_postponed").replace(/%i/i, extra.p)
			}));
		}

		return d;
	},

	POST_TYPE_SUGGESTED: "suggest",
	FILTER_SUGGESTED: "suggests",
	FILTER_POSTPONED: "postponed",

	getRequestExtraWall: function(ownerId, offset, type) {
		api("execute", {
			code: "return API.wall.get({owner_id:Args.h,count:25,offset:Args.o,filter:Args.t,extended:1,v:5.63});",
			h: ownerId,
			o: offset,
			t: type
		}).then(function(data) {
			return Wall.showExtraWall(ownerId, type, data, offset);
		});
	},

	showExtraWall: function(ownerId, type, result, offset) {
		Local.add(result.profiles.concat(result.groups));
		var e = $.e,
			wrap = e("div"),
			list = e("div"),
			count = result.count,
			items = result.items,
			item = Wall.getItemPost;
		if (items.length) {
			items.forEach(function(post) {
				list.appendChild(item(post, post.owner_id, post.id, {extra: true, type: type}));
			});
		} else {
			list.appendChild(Site.getEmptyField("ТУТ НИЧЕГО НЕТ"));
		}
		wrap.appendChild(Site.getPageHeader(Lang.get("wall.filter_" + type).replace("(%i)", "")));
		wrap.appendChild(list);
		wrap.appendChild(Site.getSmartPagebar(offset, count, 25));
		Site.append(wrap);
	},

	posts: {},

	showOnePost: function(ownerId, postId, isModal) {
		api("execute", {
			code: "var o=parseInt(Args.h),p=parseInt(Args.p),i=o+\"_\"+p,w,c,l,a,s,p,g,z=[],f=Args.f;w=API.wall.getById({posts:i,extended:1,copy_history_depth:4});i=w.items[0];l=API.likes.getList({type:\"post\",owner_id:o,item_id:p,filter:\"likes\",fields:f,friends_only:1,extended:1,count:4,skip_own:1,v:5.29});a=API.wall.get({owner_id:o,count:1}).items[0];i.can_pin=parseInt(a.can_pin?a.can_pin:i.id!=a.id);i.is_pinned=parseInt(a.id==i.id&&a.is_pinned);p=(w.profiles?w.profiles:z)+(l.items?l.items:z)+(s?s:z);g=(w.groups?w.groups:z);return{post:i,profiles:p?p:[],groups:g?g:[],likes:{all:{count:i.likes.count},friends:{count:l.count,items:l.items@.id}},a:API.account.getCounters()};",
			f: "online,screen_name,first_name_dat,last_name_dat",
			h: ownerId,
			p: postId,
			o: getOffset(),
			v: 5.63
		}).then(function(data) {
			Site.setCounters(data.a);
			Local.add(data.profiles);
			Local.add(data.groups);

			var node = Wall.showNode(ownerId, postId, data), modal;

			if (isModal) {
				modal = new Modal({
					title: "Пост",
					width: 800,
					content: node,
					noPadding: true,
					footer: [
						{
							name: "close",
							title: "Закрыть",
							onclick: function() {
								this.close();
							}
						}
					]
				}).show();
				modal.onRecount = function(w) {
					return w > 800 ? 800 : w;
				};
				modal._onResizeDocument();
				return;
			}

			var from = decodeURIComponent(Site.get("from"));
			Site.setHeader("Запись на стене", {
				link: (
					from !== "" ? from : (
						Local.data[ownerId]
							? Local.data[ownerId].screen_name
							: (ownerId > 0 ? "id" + ownerId : "club" + (-ownerId))
					)
				)
			});
			Site.append(node);

			var reply;
			if (reply = Site.get("reply")) {
				Wall.scrollToComment(ownerId, postId, reply);
			}
		});
	},

	showNode: function(ownerId, postId, data) {
		var e = $.e,
			post = data.post,
			comments = data.comments,
			wrap = e("div"),
			head = Site.getPageHeader("Пост на стене", (function() {
				var obj = {};

				if (!post.can_delete) {
					obj["report"] = {
						label: "Пожаловаться",
						onclick: function() {
							showReportWindow("wall.report", ownerId, "post", postId, null, false);
						}
					};
				}

				if (post.can_edit) {
					obj["edit"] = {
						label: "Редактировать",
						onclick: function() {
							return Wall.edit(ownerId, postId);
						}
					};
				}

				if (post.can_pin && API.userId === ownerId) {
					obj["pin"] = {
						label: post.is_pinned ? "Открепить" : "Закрепить",
						onclick: function() {
							return Wall.togglePin(post.is_pinned, ownerId, postId);
						}
					};
				}

				if (post.can_delete || ownerId === API.userId) {
					obj["remove"] = {
						label: "Удалить",
						onclick: function (item, node) {
							console.log(this);
							return Wall.deletePost(ownerId, postId, node);
						}
					};
				}



				return new DropDownMenu(Lang.get("general.actions"), obj).getNode();
			})());

		comments = Wall.getComments(comments, ownerId, postId, {
			canComment: post.comments && post.comments.can_post,
			isAdmin: Local.data[ownerId] && Local.data[ownerId].is_admin
		});


		wrap.appendChild(head);
		wrap.appendChild(Wall.getItemPost(post, ownerId, postId, {item: !0}));
		if (data.likes.all.count) {
			wrap.appendChild(Wall.getLikesPanel(data.likes, ownerId, postId));
		}
		wrap.appendChild(comments);
		return wrap;
	},

	/**
	 * Returns node of likers
	 * @param {object} likes
	 * @param {int} ownerId
	 * @param {int} postId
	 * @returns {HTMLElement}
	 */
	getLikesPanel: function(likes, ownerId, postId) {
		var e = $.e,
			wrap = e("div", {
				"class": "wall-likes-list",
				onclick: function() {
					likers("post", ownerId, postId);
					return false;
				}
			}),
			all = likes.all && likes.all.count || 0,
			friends = likes.friends && likes.friends.count || 0,
			length = likes.friends && likes.friends.items && likes.friends.items.length || 0,
			text = function (text) {
				if (!text) {
					return;
				}
				list.appendChild(document.createTextNode(text));
			},
			list = all ? e("span", {
				"class": "tip a",
				html:
					(all
							? "Понравилось " + all + " " + $.textCase(all, ["пользователю", "пользователям", "пользователям"]) +
							(friends
									? ", в том числе "
									: ""
							)
							: "Никому не понравилось"
					)
			}) : e("div");

		var friendsOutputted = 0;
		Array.prototype.forEach.call(likes.friends && likes.friends.items || [], function(f, i) {
			f = Local.data[f];
			list.appendChild(e("a", {
				href: "#" + f.screen_name,
				html: f.first_name_dat + " " + f.last_name_dat,
				onclick: function (event) {
					event.cancelBubble = true;
					event.stopPropagation();
				}
			}));
			text(i < length - 2 || friends > 4 && i < length - 1 ? ", " : i === length - 2 ? " и " : "");
			friendsOutputted++;
		});
		var left = friends - friendsOutputted;

		if (left) {
			text(" и еще " + left + " " + $.textCase(left, ["другу", "друзьям", "друзьям"]));
		}

		wrap.appendChild(list);
		return wrap;
	},

	/**
	 *
	 * @param {Post} post
	 * @param {int} ownerId
	 * @param {int} postId
	 * @param {{repost: boolean=, deleteBtn: boolean=, hide: boolean=, extra: object=, from: string=, item: boolean=, feed: boolean=, message: boolean=, type: string=}} opts
	 * @returns {HTMLElement}
	 */
	getItemPost: function(post, ownerId, postId, opts) {
		opts = opts || {};
		ownerId = post.source_id || post.owner_id || post.to_id;
		postId = post.id || post.post_id;

		Wall.posts[ownerId + "_" + postId] = post;

		var fromId = post.from_id || post.to_id || ownerId,
			signerId = post.signer_id,

			e = $.e,
			wrap = e("div"),
			parent = e("div", {
				"class": "wall-item" + (opts.repost ? " nopadding" : ""),
				id: (opts.repost ? "re" : "") + "wall-post" + ownerId + "_" + postId
			}),
			right = e("div", {"class": "wall-right"}),
			footer = e("div", {"class": "wall-footer"}),
			users = Local.data,

			std = {first_name: "DELETED", last_name: "DELETED", online: 0, queue: true},

			owner = users[ownerId] || std,
			from = users[fromId] || std,
			signer = users[signerId] || std;

		if (post && !ownerId && !postId) {
			parent.innerHTML = "Пост удален.";
			return parent;
		}

		/**
		 * Left user photo
		 */
		wrap.appendChild(e("a", {
			href: "#" + from.screen_name,
			"class": "_im_link_" + fromId,
			append: e("img", {
				"class": "wall-left _im_link_" + fromId,
				src: getURL(from.photo_50 || from.photo)
			})
		}));

		/**
		 * If feed, we can suggest delete post from news
		 */
		if (opts.hide) {
			right.appendChild(Feed.getHideNode("wall", ownerId, postId));
		}

		/**
		 * If post on wall and current user can delete post, show button for remove post
		 */
		if ((opts.deleteBtn || opts.extra) && (post.can_delete || post.can_edit)) {
			var remBtn;
			right.appendChild(remBtn = e("div", {
				"class": "feed-close a",
				onclick: function() {
					return Wall.deletePost(ownerId, postId, remBtn);
				}
			}));
		}

		var linkToPost = [
			(post.type === "post" ? "wall" : (post.type === "topic" ? "board" : post.type || "wall")),
			(post.type === "topic" ? -ownerId : ownerId),
			"_",
			postId,
			opts.from ? "?from=" + encodeURIComponent(opts.from) : ""
		].join(""), date;


		/**
		 * Head
		 */
		right.appendChild(e("div", {append: [

			e("div", {"class": "wall-head", append: [
				e("div", {"class": "wall-head-author", append: [
					e("strong", { append: [
						e("a", {
							"class": "_im_link_" + fromId,
							href: "#" + from.screen_name,
							html: getName(from)
						}),
						post.is_pinned
							? e("span", {"class": "tip", html: " запись закреплена "})
							: null
					]}),

					post.friends_only
						? e("div", {"class": "feed-friends_only"})
						: null,

					post.post_source && post.post_source.data
						? Wall.getPostSource(post.post_source, from)
						: null,

					post.final_post
						? e("span", {"class": "tip", html: "удалил" + (from.sex === 1 ? "а" : "") + " страницу"})
						: null
				]}),

				e("div", {"class": "wall-head-meta", append: [
					date = e("span", {append: e(opts.item ? "span" : "a", {
							"data-time": post.date,
							href: "#" + linkToPost,
							onclick: function(event) {
								if (opts.item) {
									return;
								}

								Wall.showOnePost(ownerId, postId, true);
								event.preventDefault();
								return false;
							},
							html: getDate(post.date, APIDOG_DATE_FORMAT_SMART)
						})
					}),

					post.post_source && post.post_source.type === "api"
						? Site.getPlatformNode(post.post_source.platform || "other")
						: null
				]})
			]})
		]}));

		bindTooltip(date, {
			content: getDate(post.date, APIDOG_DATE_FORMAT_FULL),
			position: Tooltip.X_RIGHT | Tooltip.Y_CENTER,
			width: 220
		});

		/**
		 * Content
		 */
		right.appendChild(e("div", {
			"class": "wall-content n-f",
			append: opts.item ? $.e("div", {html: Site.toHTML(post.text).emoji() }) : truncate(post.text)
		}));

		/**
		 * Attachments
		 */
		right.appendChild(e("div", {
			"class": "wall-attachments",
			append: Site.createNodeAttachments(post.attachments, "wall" + ownerId + "_" + postId)
		}));

		/**
		 * Reposts
		 */
		if (post.copy_history && post.copy_history.length) {
			var reposts = post.copy_history, j, k, wrapForReposts = e("div", { "class": "wall-repost" });

			for (j = 0; k = reposts[j]; ++j) {
				wrapForReposts.appendChild(Wall.getItemPost(k, k.owner_id, k.id, {
					message: opts.message,
					repost: true
				}));
			}
			right.appendChild(wrapForReposts);
		}

		/**
		 * Geo attachment
		 */
		if (post.geo) {
			right.appendChild(Wall.getGeoAttachment(post.geo));
		}

		/**
		 * Signer
		 */
		if (signerId) {
			right.appendChild(e("div", { "class": "wall-signer", append: [
				e("div", {"class": "wall-icons wall-icon-author"}),
				e("a", {
					"class": "_im_link_" + signerId,
					html: getName(signer),
					href: "#" + signer.screen_name
				})
			]}));
		}

		/**
		 * If this post is not repost and this post not will be inserted into message, output footer
		 */
		if (!opts.repost && !opts.extra && !opts.message) {
			footer.appendChild(e("div", {"class": "vklike-wrapper", append: [
				e("div", {"class": "vklike-basic-wrap", append: [
					!opts.item
						? e("a", {
							"class": "vklike-wrap",
							href: "#" + linkToPost,
							append: [
								e("div", {"class": "vklike-comment-icon"}),
								e("div", {"class": "vklike-count", html: formatNumber(post.comments.count)})
							]
						})
						: null,

					post.views
						? e("div", {
							"class": "vklike-wrap",
							append: [
								e("div", {"class": "vklike-view-icon"}),
								e("div", {"class": "vklike-count", html: formatNumber(post.views.count)})
							]
						})
						: null,
				]}),
				e("div", {"class": "vklike-rate-wrap", append: [
					getRepostButton("post", ownerId, postId, null, post.reposts && post.reposts.count || 0, post.reposts && post.reposts.user_reposted || false, {
						wall: (post.likes && post.likes.can_publish) && (post.reposts && !post.reposts.user_reposted) && !owner.is_closed,
						user: true,
						group: !owner.is_closed
					}),
					getLikeButton("post", ownerId, postId, null, post.likes && post.likes.count, post.likes && post.likes.user_likes)
				]})
			]}));
		}

		if (opts.extra) {
			if (opts.type === Wall.FILTER_SUGGESTED) {
				footer.appendChild(e("a", {
					"class": "fr a",
					href: "#wall" + ownerId + "_" + postId + "?act=edit",
					html: "Ред. и публикация"
				}));
			} else if (opts.type === Wall.FILTER_POSTPONED) {
				var btn;
				footer.appendChild(btn = e("div", {
					"class": "fr a",
					html: "Опубликовать сейчас",
					onclick: function() {
						api("wall.post", {
							owner_id: ownerId,
							post_id: postId
						}).then(function(result) {
							var h = e("div", {"class": "fr", append: [
								e("span", {"class": "tip", html: "Опубликовано. "}),
								e("a", {href: "#wall" + ownerId + "_" + result.post_id, html: "Перейти"})
							]});
							btn.parentNode.insertBefore(h, btn);
							$.elements.remove(btn);
						});
					}
				}));
			}
		}


		if (opts.message) {
			from.queue && Site.queueUser(fromId);
			owner.queue && Site.queueUser(ownerId);
			signer.queue && Site.queueUser(signerId);
			!opts.repost && $.elements.addClass(parent, "wall-repost");
		}

		if (opts.item) {
			$.elements.addClass(parent, "wall-single");
		}

		right.appendChild(footer);
		wrap.appendChild(right);
		parent.appendChild(wrap);
		return parent;
	},

	/**
	 * Returns node of post source
	 * @param {object} data
	 * @param {object} from
	 * @returns {HTMLElement}
	 */
	getPostSource: function(data, from) {
		var e = $.e,
			isUser = !from.name,
			isFemale = from.sex === 1;
		switch (data.data) {
			case "profile_photo":
				return e("span", {
					"class": "tip",
					html: isUser ? "обновил" + (isFemale ? "а" : "") + " фотографию на странице" : " обновлена фотография сообщества"
				});
		}
	},

	/**
	 * @deprecated
	 * @param ownerId
	 * @param postId
	 */
	edit: function(ownerId, postId) {
		var id = ownerId + "_" + postId;
		if (!Wall.posts[id]) {
			api("execute", {
				code: "return API.wall.getById({posts:Args.i,extended:1,v:5.29});",
				i: id
			}).then(function(result) {
				if (!result.items.length) {
					Site.Alert({ text: "Ошибка" });
					return;
				}

				Local.add(result.profiles.concat(result.groups));
				Wall.posts[id] = result.items[0];
				//Wall.edit(ownerId, postId);
			});
			return;
		}

		var post = Wall.posts[id],
			e = $.e,
			wrap = e("div"),
			form = e("form", {"class": "sf-wrap"}),

			u = Local.data[post.from_id],
			host = Local.data[post.owner_id],

			text,
			attachments = Wall.AttachmentToString(post.attachments),
			signer,

		nodeAttach = $.e("input", {type: "hidden", id: "im-attachments"});

		form.appendChild(text = e("textarea", {
			name: "text",
			html: post.text,
			style: "height: 280px;"
		}));

		if (ownerId < 0) {
			form.appendChild(e("label", { append: [
				signer = e("input", { type: "checkbox", name: "signer" }),
				e("span", { html: " подпись автора " + (post.post_type === Wall.POST_TYPE_SUGGESTED ? " (" + getName(u) + ")" : "") })
			]}));
			if (post.signer_id) {
				signer.checked = true;
			}
		}

		/*var a = Site.CreateDropDownMenu("Прикрепить", {
				"Фотографию": function () {SelectAttachments.CreateSelector("photo", ownerId)},
				"Документ": function () {SelectAttachments.CreateSelector("doc", ownerId)},
				"Аудиозапись": function () {SelectAttachments.CreateSelector("audio")},
				"Карту": function () {SelectAttachments.CreateSelector("map")},
				"Опрос": function () {SelectAttachments.CreateSelector("poll", ownerId)}
			}, {
				toTop: true
			});

		$.elements.addClass(a, "fr");
		a.style.padding = "6px 8px 7px";
		form.appendChild(a);*/

		form.appendChild(nodeAttach);
		form.appendChild(e("input", {
			type: "button",
			value: Lang.get("general.save"),
			onclick: function(event) {
				event.preventDefault();
				submit(1, this);
			}
		}));

		nodeAttach.value = attachments;

		if (ownerId < 0 && host.is_admin && post.post_type === Wall.FILTER_POSTPONED) {
			form.appendChild(e("input", {
				type: "button",
				value: Lang.get("wall.publish"),
				onclick: function(event) {
					event.preventDefault();
					submit(2, this);
				}
			}));
		}

		var submit = function(type, button) {
			var f = {message: text.value.trim(), attachments: nodeAttach.value, signed: signer && signer.checked ? 1 : 0};
			if (!f.message && !f.attachments) {
				Site.Alert({text: "Нельзя оставлять пустым пост!", click: function () { text.focus() }});
				return;
			}

			button.disabled = true;
			var oldBtn = button.value, params = {
				owner_id: ownerId,
				post_id: postId,
				message: f.message.toNormal(),
				attachments: f.attachments,
				signed: f.signed
			};
			button.value += "...";

			if (post.post_type === Wall.FILTER_POSTPONED) {
				params.publish_date = post.date;
			}

			api(["wall.edit", "wall.post"][type - 1], params).then(function(result) {
				button.value = oldBtn;
				button.disabled = false;
				if (type === 1) {
					Site.Alert({text: "saved"});
				} else if (type === 2) {
					window.location.hash = post.post_type === Wall.POST_TYPE_SUGGESTED ? "#wall" + ownerId + "?act=suggested" : "#wall" + ownerId + "_" + result.post_id;
				}
			});
			return!1;
		};

		wrap.appendChild(Site.getPageHeader("Редактирование записи"));
		wrap.appendChild(form);

		Site.append(wrap);
		Site.setHeader("Редактирование записи", {link: (ownerId > 0 ? "id" + ownerId : "club" + Math.abs(ownerId))});
	},


	/**
	 * Request toggle pin post
	 * @param {boolean} isPinned
	 * @param {int} ownerId
	 * @param {int} postId
	 */
	togglePin: function(isPinned, ownerId, postId) {
		api(!isPinned ? "wall.pin" : "wall.unpin", {
			owner_id: ownerId,
			post_id: postId
		}).then(function() {
			Site.Alert({text: "Пост " + (!isPinned ? "закреплен" : "откреплен")});
			Site.route(window.location.hash);
		});
	},

	/**
	 * Request restore post
	 * @param {int} ownerId
	 * @param {int} postId
	 * @returns {boolean}
	 */
	restorePost: function(ownerId, postId) {
		api("wall.restore", {
			owner_id: ownerId,
			post_id: postId
		}).then(function() {
			var e = $.element("wall-post" + ownerId + "_"+ postId);
			$.elements.removeClass(e.firstChild, "hidden");
			$.elements.remove($.element("wall-deleted" + ownerId + "_" + postId));
		});
		return false;
	},

	/**
	 * Confirm and request delete post
	 * @param {int} ownerId
	 * @param {int} postId
	 * @param {HTMLElement} node
	 * @returns {boolean}
	 */
	deletePost: function(ownerId, postId, node) {
		VKConfirm("Вы уверены, что хотите удалить эту запись?", function() {
			api("wall.delete", {
				owner_id: ownerId,
				post_id: postId
			}).then(function() {
				var e = $.element("wall-post" + ownerId + "_" + postId);
				$.elements.addClass(e.firstChild, "hidden");
				e.appendChild($.e("div", {
					"class": "wall-deleted",
					id: "wall-deleted" + ownerId + "_" + postId,
					append: [
						$.e("span", {
							"class": "tip",
							html: "Запись удалена. "
						}),
						$.e("a", {
							href: "#wall" + ownerId + "_" + postId,
							html: "Восстановить",
							onclick: function() {
								return Wall.restorePost(ownerId, postId);
							}
						})
					]
				}));
			});
		}, node);
		return false;
	},

	/**
	 * Returns attachment in string, comma separated
	 * @param {object[]} a
	 * @returns {string}
	 * @constructor
	 */
	AttachmentToString: function(a) {
		if (!a) {
			return "";
		}
		for (var i = 0, b = [], q, t; q = a[i]; ++i)
			/** @var {{owner_id: int, pid: int, vid: int, aid: int, did: int, gid: int, nid: int, id: int, app_id: int}} t */
			t = q[q.type];
			switch (q.type) {
				case "photo":    b.push("photo" + t.owner_id + "_" + (t.pid || t.id)); break;
				case "video":    b.push("video" + t.owner_id + "_" + (t.vid || t.id)); break;
				case "audio":    b.push("audio" + t.owner_id + "_" + (t.aid || t.id)); break;
				case "doc":      b.push("doc"   + t.owner_id +   "_" + (t.did || t.id));   break;
				case "graffiti": b.push("graffiti" + t.owner_id+"_"+(t.gid|| t.id)); break;
				case "link":     b.push(t.url); break;
				case "note":     b.push("note"  + t.owner_id  + "_" + (t.nid  || t.id));  break;
				case "app":      b.push("app"   + t.app_id); break;
				case "poll":     b.push("poll"  + t.owner_id +  "_" + (t.poll_id || t.id)); break;
				case "page":     b.push("page"  + t.gid +       "_" + (t.pid  || t.id)); break;
				case "album":    b.push("album" + t.owner_id + "_" + (t.aid || t.album_id)); break;
			}
		return b.join(",");
	},


	getComments: function (q, ownerId, postId, opts) {
		return comments({
			getMethod: "wall.getComments",
			addMethod: "wall.createComment",
			editMethod: "wall.editComment",
			removeMethod: "wall.deleteComment",
			restoreMethod: "wall.restoreComment",
			reportMethod: "wall.reportComment",

			ownerId: ownerId,
			itemId: postId,
			type: "post",
			countPerPage: 50,
			canComment: opts.canComment
		});
	},
	comments:{},

	scrollToComment: function (ownerId, postId, commentId) {
		var id = "wall-comment" + ownerId + "_" + postId + "_" + commentId,
			node = $.element(id),
			scroll,
			top,
			plus = isEnabled(Setting.FIXED_HEADER) * $.getPosition($.element("hat")).height;
		if (!node)
			return;
		top = $.getPosition(node).top;
		scroll = top - plus;

		$.elements.addClass(node, "wall-replied");
		window.scrollTo(0, scroll);
	},

	/**
	 * @deprecated
	 */
	getItemComment: function (comment, ownerId, postId) {
		ownerId = +ownerId;

		var e = $.e,
			commentId = comment.id,

			fromId = comment.from_id,

			userId = comment.user_id || fromId,
			user = Local.data[userId],

			replyId = comment.reply_to_user,
			reply = Local.data[replyId] || {},

			wrap = e("div", {
				id: "wall-comment" + ownerId + "_" + postId + "_" + commentId,
				"class": "comment"
			});

		Wall.comments[ownerId + "_" + commentId] = comment;

		user.screen_name = user.screen_name || (fromId > 0 ? "id" + fromId : "club" + -fromId);
		wrap.appendChild(e("div", {"class":"wall-in", style: 'display: flex; flex: 1;', append: [
			e("a", {
				"class":"comment-left",
				href: "#" + user.screen_name,
				append: e("img", {src: getURL(user.photo_50)})
			}),
			e("div", {"class":"comment-right", append: [
				e("a", {
					href: "#" + user.screen_name,
					append: e("strong", { html: getName(user) })
				}),
				replyId
					? e("span", {html: " ответил" + (user.sex === 1 ? "а" : "") + " "})
					: null,
				replyId
					? e("a", {
						href: "#" + reply.screen_name,
						html: reply.name || reply.first_name_dat + " " + reply.last_name_dat})
					: null,
				e("div",{
					"class": "comment-content n-f",
					id: "wall-cmt" + ownerId + "_" + commentId,
					html: (Site.toHTML(comment.text) || "").emoji() // TODO: truncate
				}),
				e("div", {
					"class": "comment-attachments",
					append: Site.createNodeAttachments(comment.attachments, "comment" + ownerId + "_" + commentId)
				}),
				e("div", { "class": "comment-footer", append: [
					getLikeButton("comment", ownerId, commentId, null, comment.likes && comment.likes.count, comment.likes && comment.likes.user_likes, null, {right: true}),
					e("div", {
						"class": "comment-footer-left",
						html: $.getDate(comment.date)
					})
				]})
			]})
		]}));
		return wrap;
	},


	/**
	 * Request and show list of reposts
	 * @param {int} ownerId
	 * @param {int} postId
	 * @param {int} offset
	 * @deprecated
	 */
	getReposts: function(ownerId, postId, offset) {
		api("wall.getReposts", {
			owner_id: ownerId,
			post_id: postId,
			count: 50,
			offset: offset,
			v: 5.0
		}).then(function(data) {
			var parent = $.e("div");
			parent.appendChild(Site.getTabPanel([
				["wall" + ownerId + "_" + postId + "?act=likes&params=00", "Мне нравится"],
				["wall" + ownerId + "_" + postId + "?act=reposts", "Репосты"]
			]));
			var items = data.items;
			Local.add(data.profiles.concat(data.groups));
			parent.appendChild(Site.getPageHeader("Репосты"));

			for (var i = 0, item; item = items[i]; ++i) {
				parent.appendChild(Wall.getItemPost(items[i], items[i].owner_id, items[i].id, {}));
			}

			// пагинация не работает, ибо не возвращается count: 03/05/2015
			//parent.appendChild(Site.getSmartPagebar(offset, count, 20));
			Site.append(parent);
			Site.setHeader("Список репостов", {link: "wall" + ownerId + "_" + postId});
		})
	},

	/**
	 * @param {Geo} geo
	 * @param {boolean=} needMap
	 * @returns {Element}
	 */
	getGeoAttachment: function(geo, needMap) {
		var c = geo.coordinates.split(" "),
			parent = $.e("div", {"class": "attach-map-wrap"}),
			map = document.createElement("div"),
			YandexLink = "http:\/\/maps.yandex.ru\/?ll=" + c[1] + "," + c[0] +"&pt=" + c[1] + "," + c[0] +"&z=14&l=map";

		if (geo.showmap || needMap) {
			map.appendChild($.e("a", {
				"class": "attachments-geo-linkmap",
				style:"background:url('\/\/static-maps.yandex.ru\/1.x\/?ll=" + c[1] + "," + c[0] + "&size=650,250&z=14&l=map&lang=ru-RU&pt=" + c[1] + "," + c[0] + ",vkbkm') center center no-repeat;",
				target: "_blank",
				href: YandexLink
			}));
			$.elements.addClass(parent, "attach-map-showMap");
			parent.appendChild(map);
		}

		if (geo.onClick) {
			map.addEventListener("click", geo.onClick.bind(geo));
		}

		if (geo && !geo.place) {
			return parent;
		}


		parent.appendChild(getRowAttachment({
			link: YandexLink,
			title: (geo.place.title || geo.place.address || "Место"),
			subtitle: "Место",
			icon: "place",
			isBlank: true,
			onClick: function(event) {
				if (!geo.place || geo.place && !geo.place.id) {
					return true;
				}

				event.preventDefault();
				Places.showPlaceInfo(geo && geo.place && (geo.place.id || geo.place.pid), this);
				return false;
			}
		}));

		/*parent.appendChild($.e("a", {
			"class": "attach-row-wrap",
			target: (!geo.place.id) ? "_blank" : "",
			onclick: function(event) {
				if (!geo.place || geo.place && !geo.place.id) {
					return true;
				}

				event.preventDefault();
				Places.showPlaceInfo(geo && geo.place && (geo.place.id || geo.place.pid), this);
				return false;
			},
			href: ,
			append: [
				$.e("div", {"class": "attach-row-icon-wrap", append: $.e("div", { "class": "attach-row-icon attach-icon-map", style: "background-image:url(" + geo.place.icon + ")", })}),
				$.e("div", {"class": "attach-row-title", html: .safe()})
			]
		}));*/
		return parent;
	},

	/**
	 * @param {Post} post
	 * @returns {HTMLElement}
	 */
	getWallAttachment: function(post) {
		post = post || {};

		return getRowAttachment({
			link: "#wall" + (post.owner_id || post.source_id || post.to_id) + "_" + post.id + "?from=" + encodeURIComponent(window.location.hash),
			title: Lang.get("wall.post_on_wall"),
			subtitle: post.text.substr(0, 120),
			icon: "post"
		});
	},

	getReplyAttachment: function(ownerId, postId, commentId) {
		return getRowAttachment({
			link: "#wall" + ownerId + "_" + postId + "?reply=" + commentId + "&from=" + encodeURIComponent(window.location.hash),
			title: Lang.get("wall.comment_on_wall"),
			icon: "post"
		});
	},

	getWallAttachment4Message: function (post) {
		return Wall.getItemPost(post, post.owner_id, post.id, {message: true});
	}
};