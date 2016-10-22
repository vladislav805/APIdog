/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Wall = {
	Storage: {},
	Resolve: function(url) {
		Site.Loader();
		if (/^wall(-?\d+)$/.test(url)) {
			var ownerId = parseInt(/^wall(-?\d+)$/.exec(url)[1]),
				offset = getOffset();
			switch (getAct()) {
				case "suggested":
					Wall.getRequestExtraWall(ownerId, offset, Wall.FILTER_SUGGESTED);
					break;

				case "postponed":
					Wall.getRequestExtraWall(ownerId, offset, Wall.FILTER_POSTPONED);
					break;

				default:
					Wall.RequestWall(ownerId, offset);
			};
		} else if (/^wall(-?\d+)_(\d+)$/.test(url)) {
			var ids = /wall(-?\d+)_(\d+)/.exec(url),
				ownerId = ids[1],
				postId = ids[2];
			switch (getAct()) {
				case "edit":
					Wall.edit(ownerId, postId);
					break;

				default:
					return Wall.getItem(ownerId, postId);
			};
		};
	},

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! v6.4 оставить

	CreateSelectAttachmentsMenu: function(from, allowed, form) {
		var needed = {};
		if (allowed & 2)
			needed["Фотографию"] = function() {SelectAttachments.CreateSelector("photo", from)};
		if (allowed & 4)
			needed["Документ"] = function() {SelectAttachments.CreateSelector("doc", from)};
		// if (allowed & 8)
		//  needed["Видеозапись"] = function() {SelectAttachments.CreateSelector("video")};
		if (allowed & 16)
			needed["Аудиозапись"] = function() {SelectAttachments.CreateSelector("audio")};
		if (allowed & 32)
			needed["Карту"] = function() {SelectAttachments.CreateSelector("map")};
		if (allowed & 64)
			needed["Опрос"] = function() {SelectAttachments.CreateSelector("poll", from)};
		if (allowed & 128)
			needed["Таймер"] = function() { Wall.choosePublishDate(form); };
		var elem = Site.CreateDropDownMenu("Прикрепить", needed, {toTop: true});
		$.elements.addClass(elem, "fr");
		elem.style.padding = "6px 8px 7px";
		return allowed != 0 ? elem : $.elements.create("div");
	},

	RequestWall: function(ownerId, opts) {
		opts = opts || {};
		var callback = function(data) {
			console.log(data);
			var e = $.e,
				parent = e("div", {
					"class": "wall-profile-wrap",
					id: "wall-wrap" + ownerId
				}),
				list = e("div", {
					id: "wall-list" + ownerId
				}),
				data = Site.isResponse(data) || {},
				wall = data && data.items || [],
				count = data.count;
			if (data.profiles) Local.add(data.profiles);
			if (data.groups) Local.add(data.groups);
			parent.appendChild(Site.getPageHeader("Стена <i>" + count + " " + $.textCase(count, ["запись", "записи", "записей"]) + "<\/i>"));
			if (opts.can_post || opts.canSuggest) {
				var params = {
					name: "message",
					nohead: true,
					onsubmit: function(event) {
						event.preventDefault();
						var text = Site.AddSlashes(this.message.value).replace(/\n/ig, "\\n").replace(/"/ig, "\\\""),
							t = this.message,
							attachments = this.attachments.value,
							q = [],
							publishDate = this.publishDate && parseInt(this.publishDate.value);
						if (!text && !attachments) {
							Site.Alert({
								text: "Введите текст!",
								click: function(event) {t.focus();}
							});
							return false;
						};

						q.push("owner_id:" + ownerId);
						q.push("message:\"" + text + "\"");

						if (attachments) {
							q.push("attachments:\"" + attachments + "\"");
						};

						if (this.as_admin && this.as_admin.checked) {
							q.push("from_group:1");
						};

						if (this.sign && this.sign.checked) {
							q.push("signed:1");
						};

						if (this.friends_only && this.friends_only.checked) {
							q.push("friends_only:1");
						};

						if (this.geo && this.geo.value) {
							var geo = this.geo.value.trim().split(" ");
							q.push("lat:" + geo[0] + ",\"long\":" + geo[1]);
						};

						if (publishDate) {
							q.push("publish_date:" + publishDate);
						};
						if (ownerId == API.userId && !(API.SettingsBitmask & 1) && !publishDate) {
							var cnf = new Modal({
								title: "Постинг на стену",
								content: "<strong>Внимание!</strong> Вы используете offline режим на нашем сайте, но хотите написать пост себе на стену. При написании поста себе на стену Ваш аккаунт станет онлайн на 15 минут. Вы уверены, что хотите опубликовать запись и стать онлайн? Вы можете отправить пост с таймером на 5 минут (или выбрать дату самостоятельно): в таком случае дата последнего захода не изменится и онлайн на аккаунте не появится<br \/><strong>Отправить<\/strong> &mdash; отправить сразу, будет онлайн<br \/><strong>Отложка<\/strong> &mdash; отправить отложкой, пост будет доступен только через  минут<br \/><strong>Отмена<\/strong> &mdash; не отправлять вообще",
								footer: [
									{
										name: "post",
										title: "Отправить",
										onclick: function(event) {
											sendPost(q, t);
											cnf.close();
										}
									},
									{
										name: "timer",
										title: "Отложка",
										onclick: function(event) {
											q.push("publish_date:" + parseInt((Date.now() / 1000) + (5 * 60)));
											sendPost(q, t);
											cnf.close();
										}
									},
									{
										name: "cancel",
										title: "Отмена",
										onclick: function(event) {
											cnf.close();
										}
									}
								]
							}).show();
						} else {
							sendPost(q, t);
						};
						return false;
					},
					allowAttachments: 126 + 128
				};
				var sendPost = function(q, t) {

					Site.API("execute", {
						code:"var p=API.wall.post({" + q.join(",") + "}).post_id;return API.wall.getById({posts:\"" + ownerId + "_\"+p})[0];"
					}, function(result) {
						var data = Site.isResponse(result),
							list = $.element("wall-list" + ownerId);
						list.insertBefore(Wall.itemPost(data, data.to_id, data.id, {deleteBtn: true}), list.firstChild);
						t.value = "";
					});
					SelectAttachments.RemoveSelector();
					SelectAttachments.ClearAttachments();
				d};
				if (ownerId > 0 && ownerId == API.userId)
					params.friends_only = true;
				if (ownerId < 0 && Local.Users[ownerId] && Local.Users[ownerId].is_admin){
					if (Local.Users[ownerId].type == "page")
						params.realAdmin = true;
					else
						params.asAdmin = true;
					params.withSign = true;
				}
				params.owner_id = ownerId;
				params.ctrlEnter = true;
				params.timer = true;
				parent.appendChild(Site.CreateWriteForm(params, 0, 0));
			}
			if (data.count)
				for (var i = 0, post; post = wall[i]; ++i)
					list.appendChild(Wall.itemPost(post, post.owner_id, post.id, {
						deleteBtn: true
					}));
			else
				list.appendChild(Site.EmptyField("Нет ни одной записи"));
			if (opts && opts.extra)
				$.elements.append(parent, Wall.getExtraLinks(ownerId, opts.extra));
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(getOffset(), count, 25));
			return opts.data ? parent : Site.Append(parent);
		};
		if (opts.data)
			return callback(
				opts.data,
				{ ownerId: ownerId }
			);

	},

	choosePublishDate: function(form) {
		var dateChooser,
			modal = new Modal({
				width: 400,
				title: "Выбор времени отправки поста",
				content: (dateChooser = createInputDate({name: "chooseDate"}, form.publishDate.value)).node,
				footer: [
					{
						name: "ok",
						title: "ОК",
						onclick: function() {
							var val = dateChooser.getValue();
							form.publishDate.value = val;
							$.elements.removeClass(form.timerUI, "hidden");
							form.timerUI.lastChild.innerHTML = $.getDate(val);
							modal.close();
						}
					},
					{
						name: "cancel",
						title: "Отмена",
						onclick: function() {
							modal.close();
						}
					}
				]
			}).show(),

			d = new Date(Date.now() + 3 * 60 * 60 * 1000);

		if (!form.publishDate.value) {
			dateChooser.setCurrentDate(d.getDate(), d.getMonth() + 1, d.getFullYear(), d.getHours(), d.getMinutes() - (d.getMinutes() % 5));
		};
	},

	getExtraLinks: function(ownerId, extra) {
		var g = Local.Users[ownerId], d = [], e = $.e, l = Lang.get;
//		if (ownerId > 0 || ownerId < 0 && !g.is_admin)
//			return d;
		if (extra.s)
			d.push(e("a",
			{
				"class": "wall-extra-buttons",
				href: "#wall" + ownerId + "?act=suggested",
				html: l("wall.filter_suggests").replace(/%i/i, extra.s)
			}));
		if (extra.p)
			d.push(e("a",
			{
				"class": "wall-extra-buttons",
				href: "#wall" + ownerId + "?act=postponed",
				html: l("wall.filter_postponed").replace(/%i/i, extra.p)
			}));
		return d;
	},

	POST_TYPE_SUGGESTED: "suggest",
	FILTER_SUGGESTED: "suggests",
	FILTER_POSTPONED: "postponed",

	getRequestExtraWall: function(ownerId, offset, type) {
		Site.API("execute", {
			code: "return API.wall.get({owner_id:%h,count:25,offset:%o,filter:\"%t\",extended:1,v:5.31});".schema({
				h: ownerId,
				o: offset,
				t: type
			})
		}, function(data) {
			data = Site.isResponse(data);
			if (!data) return;
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
			item = Wall.itemPost;
		if (items.length)
			items.forEach(function(post) {
				list.appendChild(item(post, post.owner_id, post.id, {extra: true, type: type}));
			});
		else
			list.appendChild(Site.EmptyField("ТУТ НИЧЕГО НЕТ"));
		wrap.appendChild(Site.getPageHeader(Lang.get("wall.filter_" + type).replace("(%i)", "")));
		wrap.appendChild(list);
		wrap.appendChild(Site.PagebarV2(offset, count, 25));
		Site.Append(wrap);
	},

	posts: {},

	getItem: function(ownerId, postId) {
		new APIRequest("execute", {
			code: "var o=Args.h,p=Args.p,i=o+\"_\"+p,w,c,l,a,s,p,g,z=[],f=\"online,screen_name,first_name_dat,last_name_dat\";w=API.wall.getById({posts:i,extended:1,copy_history_depth:4,v:5.29});i=w.items[0];if(!i){i={errorId:1,id:0};};c=API.wall.getComments({owner_id:o,post_id:p,count:50,offset:Args.o,extended:1,sort:\"asc\",need_likes:1,v:5.29});l=API.likes.getList({type:\"post\",owner_id:o,item_id:p,filter:\"likes\",fields:f,friends_only:1,extended:1,count:4,skip_own:1,v:5.29});a=API.wall.get({owner_id:o,count:1}).items[0];i.can_pin=parseInt(a.can_pin?a.can_pin:i.id!=a.id);i.is_pinned=parseInt(a.id==i.id&&a.is_pinned);s=API.users.get({user_ids:c.items@.reply_to_user+c.items@.from_id,fields:f});p=(w.profiles?w.profiles:z)+(c.profiles?c.profiles:z)+(l.items?l.items:z)+(s?s:z);g=(w.groups?w.groups:z)+(c.groups?c.groups:z);return{post:i,profiles:p?p:[],groups:g?g:[],comments:c,likes:{all:{count:i.likes.count},friends:{count:l.count,items:l.items@.id}},a:API.account.getCounters()};",
			h: ownerId,
			p: postId,
			o: getOffset()
		}).setOnCompleteListener(function(data) {
			console.log(data);
			Site.setCounters(data.a);
			Local.add(data.profiles);
			Local.add(data.groups);

			if (data.post && data.post.errorId) {
				Site.append(getEmptyField("Запись недоступна"));
				return;
			};

			var e = $.e,
				post = data.post,
				comments = data.comments,
				wrap = e("div"),
				owner = Local.Users[post.owner_id],
				comments = Wall.getComments(comments, ownerId, postId, {
					canComment: post.comments && post.comments.can_post,
					isAdmin: Local.Users[ownerId] && Local.Users[ownerId].is_admin
				}),
				head = Site.getPageHeader("Пост на стене", (function() {
					var obj = {};
					if (post.can_edit)
						obj["Редактировать"] = function(event) {
							return Wall.editPost(ownerId, postId);
						};

					if (post.can_pin && post.can_delete)
						obj[post.is_pinned ? "Открепить" : "Закрепить"] = function(event) {
							return Wall.togglePin(post.is_pinned, ownerId, postId);
						};

					if (post.can_delete || ownerId == API.userId)
						obj["Удалить"] = function(event) {
							return Wall.deletePost(ownerId, postId);
						};
					return Site.CreateDropDownMenu(Lang.get("general.actions"), obj);
				})());




			wrap.appendChild(head);
			wrap.appendChild($.e("div", {append: Wall.itemPost(post, ownerId, postId, {item: !0})}));
			wrap.appendChild(comments);

			var from = Site.get("from");

			from = from && decodeURIComponent(from) || from;
console.log(from)
			Site.setHeader(
				"Запись на стене",
				from || ownerId in Local.Users && Local.Users[ownerId].screen_name
						? Local.Users[ownerId].screen_name
						: (ownerId > 0 ? "id" + ownerId : "club" + (-ownerId))
			);

			Site.append(wrap);

			var reply;
			if (reply = Site.get("reply")) {
				Wall.scrollToComment(ownerId, postId, reply);
			};
		}).execute();
	},



	itemPost: function(post, ownerId, postId, opts) {
		opts = opts || {};
		ownerId = post.source_id || post.owner_id || post.to_id;
		postId = post.id || post.post_id;

		Wall.Storage["wall" + ownerId + "_" + postId] = post;
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
			users = Local.Users,
			isReply = post.post_type == "reply",

			std = {first_name: "DELETED", last_name: "DELETED", online: 0, queue: true}

			owner = users[ownerId] || std,
			from = users[fromId] || std,
			signer = users[signerId] || std,
			w = Site.Escape;

		if (post && !ownerId && !postId) {
			parent.innerHTML = "Error: Repost not found"
			return parent;
		};

		wrap.appendChild(e("a", {
			href: "#" + from.screen_name,
			"class": "_im_link_" + fromId,
			append: e("img", {
				"class": "wall-left _im_link_" + fromId,
				src: getURL(from.photo_50 || from.photo_rec || from.photo)
			})
		}));

		if (opts.hide) {
			wrap.appendChild(Feed.getHideNode("wall", ownerId, postId));
		};

		if ((opts.deleteBtn || opts.extra) && (post.can_delete || post.can_edit)) {
			wrap.appendChild(e("div", {
				"class": "feed-close a",
				onclick: function(event) {
					return Wall.deletePost(ownerId, postId);
				}
			}));
		};

		var linkToPost = [
			(post.type === "post" ? "wall" : (post.type == "topic" ? "board" : post.type || "wall")),
			(post.type === "topic" ? -ownerId : ownerId),
			"_",
			postId,
			opts.from ? "?from=" + encodeURIComponent(opts.from) : ""
		].join("");

		right.appendChild(e("div", {
			append: [
				e("div", {"class": "wall-head", append: [
					e("div", {"class": "wall-head-author", append: [
						e("strong", {
							append: [
								e("a", {
									href: "#" + from.screen_name,
									"class": "_im_link_" + fromId,
									html: getName(from)
								}),
								post.is_pinned
									? e("span", {"class": "tip", html: " запись закреплена "})
									: null
							]
						}),
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
						e("a", {
							"data-unix": post.date,
							"class": opts.feed ? "__autodate" : "",
							href: "#" + linkToPost,
							html: (opts.feed ? Site.getDate(post.date) : $.getDate(post.date)) + " "
						}),
						post.post_source && post.post_source.type === "api"
							? Site.Platform(post.post_source.platform || "other")
							: null
					]})
				]})
			]
		}));

		right.appendChild(e("div", {
			"class": "wall-content n-f",
			append: truncate(post.text, {length: opts.item ? -1 : 400})
		}));

		right.appendChild(e("div", {
			"class": "wall-attachments",
			append: Site.Attachment(post.attachments, "wall" + ownerId + "_" + postId)
		}));

// TODO: переписать эту херню. она работает на говне
		if (post.copy_history && post.copy_history.length) {
			var reposts = post.copy_history, next, j, k;
			for (j = 0; j < reposts.length; ++j) {
				next = [];
				for (k = j + 1; k < reposts.length; ++k) {
					next.push(reposts[k]);
				};
				reposts[j].copy_history = next;
			};
			right.appendChild(e("div", {
				"class": "wall-repost",
				append: Wall.itemPost(reposts[0], reposts[0].owner_id, reposts[0].id, {
					message: opts.message,
					repost: true
				})
			}));
		};

		if (post.geo) {
			right.appendChild(Wall.GeoAttachment(post.geo));
		};

		if (signerId) {
			right.appendChild(e("div", {
				"class": "wall-signer",
				append: [
					e("div", {"class": "wall-icons wall-icon-author"}),
					document.createTextNode(" "),
					e("a", {
						"class": "_im_link_" + signerId,
						html: getName(signer),
						href: "#" + signer.screen_name
					})
				]
			}));
		};

		if (!opts.repost && !opts.extra && !opts.message) {
			footer.appendChild(e("div", {append: [
				!opts.item ? e("a", {
					"class": "vklike-wrap",
					href: "#" + linkToPost,
					append: [
						e("div", {"class": "vklike-comment-icon"}),
						e("div", {"class": "vklike-count", html: formatNumber(post.comments.count)})
					]
				}) : null,
				e("div", {"class": "fr", append: [
					getRepostButton("post", ownerId, postId, null, post.reposts && post.reposts.count || 0, post.reposts && post.reposts.user_reposted || false, {
						wall: (post.likes && post.likes.can_publish) && (post.reposts && !post.reposts.user_reposted) && !owner.is_closed,
						user: true,
						group: !owner.is_closed
					}),
					getLikeButton("post", ownerId, postId, null, post.likes.count, post.likes.user_likes, post.reposts)
				]})
			]}));
		};

		if (opts.extra)
		{
			if (opts.type === Wall.FILTER_SUGGESTED)
			{
				footer.appendChild(e("a",
				{
					"class": "fr a",
					href: "#wall" + ownerId + "_" + postId + "?act=edit",
					html: "Ред. и публикация"
				}));
			}
			else if (opts.type === Wall.FILTER_POSTPONED)
			{
				footer.appendChild(e("div",
				{
					"class": "fr a",
					html: "Опубликовать сейчас",
					onclick: function(event)
					{
						var btn = this;
						Site.API("wall.post",
						{
							owner_id: ownerId,
							post_id: postId
						},
						function(result)
						{
							result = Site.isResponse(result);
							if (!result) return;

							var h = e("div", {"class": "fr", append: [
								e("span", {"class": "tip", html: "Опубликовано. "}),
								e("a", {href: "#wall" + ownerId + "_" + result.post_id, html: "Перейти"})
							]});
							btn.parentNode.insertBefore(h, btn);
							$.elements.remove(btn);
						});
					}
				}));
			};
		};

		if (opts.message)
		{
			if (from.queue) Site.queueUser(fromId);
			if (owner.queue) Site.queueUser(ownerId);
			if (signer.queue) Site.queueUser(signerId);
			if (!opts.repost)
				$.elements.addClass(parent, "wall-repost");
		};

		right.appendChild(footer);

		wrap.appendChild(right);
		parent.appendChild(wrap);
		return parent;
	},

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
		};
	},

	edit: function(ownerId, postId) {
		var id = ownerId + "_" + postId;
		if (!Wall.posts[id]) {
			Site.API("execute", {
				code: "return API.wall.getById({posts:Args.id,extended:1,v:5.29});",
				id: id
			}, function(result) {
				result = Site.isResponse(result);
				if (!result || result.items && !result.items.length) {
					Site.Alert({ text: "Ошибка" });
					return;
				};

				Local.add(result.profiles.concat(result.groups));
				Wall.posts[id] = result.items[0];
				Wall.edit(ownerId, postId);
			});
			return;
		};

		var post = Wall.posts[id],
			e = $.e,
			wrap = e("div"),
			form = e("form", {"class": "sf-wrap"}),

			u = Local.Users[post.from_id],
			host = Local.Users[post.owner_id],

			text,
			attachments = Wall.AttachmentToString(post.attachments),
			signer,
			saver;

		form.appendChild(text = e("textarea", {
			name: "text",
			html: post.text,
			style: "height: 280px;"
		}));

		if (ownerId < 0) {
			form.appendChild(e("label", {
				append: [
					signer = e("input", { type: "checkbox", name: "signer" }),
					e("span", {
						html: " подпись автора " + (post.post_type === Wall.POST_TYPE_SUGGESTED ? " (" + getName(u) + ")" : "")
					})
				]
			}));

			if (post.signer_id) {
				signer.checked = true;
			}
		};

		var a = Site.CreateDropDownMenu("Прикрепить", {
			"Фотографию": function() {SelectAttachments.CreateSelector("photo", ownerId)},
			"Документ": function() {SelectAttachments.CreateSelector("doc", ownerId)},
			"Аудиозапись": function() {SelectAttachments.CreateSelector("audio")},
			"Карту": function() {SelectAttachments.CreateSelector("map")},
			"Опрос": function() {SelectAttachments.CreateSelector("poll", ownerId)}
		}, { toTop: true });

		$.elements.addClass(a, "fr");
		a.style.padding = "6px 8px 7px";
		form.appendChild(a);
		form.appendChild(saved = e("input", {
			type: "button",
			value: Lang.get("general.save"),
			onclick: function(event) {
				event.preventDefault();
				submit(1, this);
			}
		}));

		if (ownerId < 0 && host.is_admin) {
			form.appendChild(e("input", {
				type: "button",
				value: Lang.get("wall.publish"),
				onclick: function(event) {
					event.preventDefault();
					submit(2, this);
				}
			}));
		};

		var submit = function(type, button) {
			var f = {message: text.value.trim(), attachments: attachments, signed: signer.checked ? 1 : 0};
			if (!f.message && !f.attachments) {
				Site.Alert({text: "Нельзя оставлять пустым пост!", click: function() { text.focus() }});
				return;
			};


			button.disabled = true;
			var oldBtn = button.value, params = {
				owner_id: ownerId,
				post_id: postId,
				message: f.message,
				attachments: f.attachments,
				signed: f.signed
			};
			button.value += "...";

			if (post.post_type == "postpone") {
				params.publish_date = post.date;
			};

			Site.API(["wall.edit", "wall.post"][type - 1], params, function(result) {
				result = Site.isResponse(result);
				button.value = oldBtn;
				button.disabled = false;
				if (type == 1) Site.Alert({text: "saved"});
				if (type == 2) {
					window.location.hash = post.post_type === Wall.POST_TYPE_SUGGESTED ? "#wall" + ownerId + "?act=suggested" : "#wall" + ownerId + "_" + result.post_id;
				};
			});
			return!1;
		};

		wrap.appendChild(Site.getPageHeader("Редактирование записи"));
		wrap.appendChild(form);

		Site.append(wrap);
		Site.setHeader("Редактирование записи", {link: (ownerId > 0 ? "id" + ownerId : "club" + Math.abs(ownerId))});
	},

// што блеать это за пиздец?!
	editPost:function(oid,pid){
		Site.SetHeader("Редактирование записи", {fx: function() {Site.Go("wall" + oid + "_" + pid);}, link: "wall" + oid + "_" + pid});
		var Parent=document.createElement("div"),
			Form=document.createElement("form"),
			post=Wall.Storage["wall"+oid+"_"+pid];
		Parent.appendChild(Site.getPageHeader("Редактирование записи"));
		Form.className="sf-wrap";
		var tip=function(l){
			return $.elements.create("div",{"class":"tip",html:l});
		};
		Form.appendChild(tip("Текст записи"));
		Form.appendChild($.elements.create("textarea",{html:(post.copy_owner_id?post.copy_text:post.text).replace(/<br>/igm,"\n"),name:"text"}));
		if(!post.copy_owner_id){
			Form.appendChild(tip("Прикрепления"));
			Form.appendChild($.elements.create("input",{type:"text",value:Wall.AttachmentToString(post.attachments),name:"attachments"}));
		}
		if(post.owner_id<0&&API.userId!=post.from_id){
			var opts={type:"checkbox",value:1,name:"sign"};
			if(post.signer_id)
				opts.checked = true;
			Form.appendChild($.elements.create("label",{
				append:[
					$.elements.create("input",opts),
					$.elements.create("span",{html:" подпись"})
				]
			}));
		}
		Form.appendChild($.elements.create("input",{type:"submit",value:"Сохранить пост"}));
		Form.onsubmit=function(event){
			var text=$.trim(this.text.value),
				attachments=this.attachments?$.trim(this.attachments.value):"",
				sign=(this.sign?(this.sign.checked?1:0):"");
			if(!text&&!attachments){
				var textElem = this.text;
				Site.Alert({
					text: "Ошибка! Поля не могут быть пустыми!",
					click: function(event) {
						textElem.focus();
					}
				});
				return false;
			}
			Site.API("wall.edit",{
				owner_id:oid,
				post_id:pid,
				message:text,
				attachments:attachments,
				signed:sign
			},function(data){
				if(data.response){
					Wall.getItem(oid,pid);
				}
			})
			return false;
		};
		Parent.appendChild(Form);
		Site.Append(Parent);
		return false;
	},

	togglePin: function(isPinned, ownerId, postId) {
		Site.API(!isPinned ? "wall.pin" : "wall.unpin", {
			owner_id: ownerId,
			post_id: postId
		}, function(data) {
			data = Site.isResponse(data);
			Site.Alert({text: "Пост " + (!isPinned ? "закреплен" : "откреплен")});
			Site.Go(window.location.hash);
		});
	},

	restorePost: function(ownerId, postId) {
		Site.API("wall.restore", {
			owner_id: ownerId,
			post_id: postId
		}, function(data) {
			var e = $.element("wall-post" + ownerId + "_"+ postId);
			$.elements.removeClass(e.firstChild, "hidden");
			$.elements.remove($.element("wall-deleted" + ownerId + "_" + postId));
		});
		return false;
	},

	deletePost: function(ownerId, postId) {
		VKConfirm("Вы уверены, что хотите удалить эту запись?", function() {
			Site.API("wall.delete", {
				owner_id: ownerId,
				post_id: postId
			}, function(data) {
				if (!data.response)
					return;
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
							onclick: function(event) {
								return Wall.restorePost(ownerId, postId);
							}
						})
					]
				}));
			});
		});
		return false;
	},

	// deprecated 10.01.2016, instead - getAttachmentIdsByObjects
	AttachmentToString: function(a) {
		if (!a)
			return "";
		for (var i = 0, b = []; i < a.length; ++i)
			switch (a[i].type) {
				case "photo":    b.push("photo" + a[i].photo.owner_id + "_" + (a[i].photo.pid || a[i].photo.id)); break;
				case "video":    b.push("video" + a[i].video.owner_id + "_" + (a[i].video.vid || a[i].video.id)); break;
				case "audio":    b.push("audio" + a[i].audio.owner_id + "_" + (a[i].audio.aid || a[i].audio.id)); break;
				case "doc":      b.push("doc"   + a[i].doc.owner_id +   "_" + (a[i].doc.did   || a[i].doc.id));   break;
				case "graffiti": b.push("graffiti" + a[i].graffiti.owner_id+"_"+(a[i].graffiti.gid||a[i].graffiti.id)); break;
				case "link":     b.push(a[i].link.url); break;
				case "note":     b.push("note"  + a[i].note.owner_id  + "_" + (a[i].note.nid  || a[i].note.id));  break;
				case "app":      b.push("app"   + a[i].app.app_id); break;
				case "poll":     b.push("poll"  + a[i].poll.owner_id +  "_" + (a[i].poll.poll_id || a[i].poll.id)); break;
				case "page":     b.push("page"  + a[i].page.gid +       "_" + (a[i].page.pid  || a[i].page.id)); break;
				case "album":    b.push("album" + a[i].album.owner_id + "_" + (a[i].album.aid || a[i].album.album_id)); break;
			}
		return b.join(",");
	},


	// deprecated 10.01.2016
	LikeButton: function(type, ownerId, postId, likes, reposts, accessKey) {

		return getLikeButton(type, ownerId, postId, null, likes.count, likes.user_likes, reposts, accessKey);
	},


	getComments: function(comments, ownerId, postId, opts) {

		return new Comments({
			type: "wall",
			ownerId: ownerId,
			postId: postId,
		}, comments, {
			get: {
				method: "wall.getComments",
				itemField: "post_id"
			},
			add: {
				method: "wall.addcomment",
				text: "text",
				attachments: "attachments",
				itemField: "post_id",
				callback: function() {

				}
			},
			edit: {
				method: "wall.editComment",
				text: "text",
				attachments: "attachments",
				callback: function() {

				}
			},
			remove: {
				method: "wall.deleteComment",
				callback: function() {

				}
			},
			restore: {
				method: "wall.restoreComment",
				callback: function() {

				}
			},
			report: {
				method: "wall.reportComment",
				callback: function() {

				}
			}
		}).getNode();
	},
	comments:{},
	scrollToComment: function(ownerId, postId, commentId) {
		var id = "wall-comment" + ownerId + "_" + postId + "_" + commentId,
			node = $.element(id),
			scroll,
			top,
			plus = (API.SettingsBitmask & 128) ? $.getPosition($.element("hat")).height : 0;
		if (!node)
			return;
		top = $.getPosition(node).top;
		scroll = top - plus;

		$.elements.addClass(node, "wall-replied");
		window.scrollTo(0, scroll);
	},

	// deprecated 10.01.2016
	ItemComment: function(comment, ownerId, postId, opts) {
		ownerId = +ownerId;
		var e = $.e,
			commentId = comment.id,

			fromId = comment.from_id,
			from = Local.Users[fromId],

			userId = comment.user_id || fromId,
			user = Local.Users[userId] || {},

			replyId = comment.reply_to_user,
			reply = Local.Users[replyId] || {},

			canEdit = comment.can_edit,
			canDelete = canEdit || ownerId === API.userId || fromId === API.userId || (Local.Users[ownerId] && Local.Users[ownerId].is_admin) || (Local.Users[fromId] && Local.Users[fromId].is_admin);
			wrap = e("div", {
				id: "wall-comment" + ownerId + "_" + postId + "_" + commentId,
				"class": "comments"
			});
		Wall.comments[ownerId + "_" + commentId] = comment;
		Wall.Storage["comment" + ownerId + "_" + postId + "_" + commentId] = comment;

		user.screen_name = user.screen_name || (fromId > 0 ? "id" + fromId : "club" + -fromId);
		wrap.appendChild(e("div", {
			"class":"wall-in",
			append: [
				e("a", {
					href: "#" + user.screen_name,
					"class":"comments-left",
					append: e("img", {src: getURL(user.photo_50)})
				}),
				e("div", {
					"class":"comments-right",
					append: [
						e("a", {
							href: "#" + user.screen_name,
							append: e("strong", {
								html: user.name || user.first_name + " " + user.last_name + " " + Site.isOnline(user)
							})
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
							"class": "comments-content n-f",
							id: "wall-cmt" + ownerId + "_" + commentId,
							html: Mail.Emoji(Site.Format(comment.text) || "")
						}),
						e("div", {
							"class": "comments-attachments",
							append: Site.Attachment(comment.attachments, "comment" + ownerId + "_" + commentId)
						}),
						e("div", {
							"class": "comments-footer",
							append: [
								e("div", {
									"class":"comments-actions",
									append: [
										e("a",{
											href: "#wall" + ownerId + "_" + postId + "?reply=" + commentId,
											html: "Ответить",
											onclick: function(event) {
												$.event.cancel(event);
												return Wall.reply(ownerId, postId, commentId, fromId);
											}
										}),
										document.createTextNode(" "),
										e("a",{
											href: "#wall?act=likesComment&ownerId=" + ownerId + "&commentId=" + commentId + "&from=" + postId,
											html: "Оценили"
										}),
										document.createTextNode(" "),
										canEdit
											? e("span",{
												"class": "a",
												html: "Редактировать",
												onclick: function(event) {
													return Wall.editComment(ownerId, comment);
												}})
											: null,
										document.createTextNode(" "),
										canDelete
											? e("span",{
												"class": "a",
												html: "Удалить",
												onclick: function(event) {
													return Wall.deleteComment(ownerId, postId, commentId);
												}})
											: null
									]
								}),
								e("div", {
									"class": "comments-footer-left",
									html: $.getDate(comment.date)
								}),
								e("div", {
									"class":"wall-likes likes",
									id: "like_comment_" + ownerId + "_" + commentId,
									append: Wall.LikeButton("comment", ownerId, commentId, comment.likes || {})
								})
							]
						})
					]
				})
			]
		}));
		return wrap;
	},
	reply: function(ownerId, postId, commentId, toId){
		var area = $.element("wall-comments-area" + ownerId + "_" + postId),
			to = Local.Users[toId],
			reply = $.element("wall-comments-reply" + ownerId + "_" + postId),
			replyUI = $.element("wall-comments-replyUI" + ownerId + "_" + postId),
			e = $.e;

		if (reply.value == commentId)
			return;

		if (!$.trim(area.value))
			reply.value = commentId;
		area.value += " [" + (to.screen_name || (toId > 0 ? "id" + toId : "club" + (-toId))) + "|" + (to.name || to.first_name) + "], ";
		var l = area.value.length - 1;
		area.setSelectionRange(l, l);
		$.elements.clearChild(replyUI);
		replyUI.appendChild(e("div", {append: [
			e("a", {href: "#" + to.screen_name, html: (to.name || to.first_name_dat + " " + to.last_name_dat)}),
			e("div", {"class": "feed-close a", onclick: function(event) {
				area.value = area.value.replace(new RegExp("^\[" + to.screen_name + "|" + (to.name || to.first_name) + "\], " ,"img"), "");
				reply.value = "";
				$.elements.clearChild(replyUI);
			}})
		]}))
	},

	// deprecated 10.01.2016
	editComment: function(ownerId, comment) {
		var textNode = $.element("wall-cmt" + ownerId + "_" + comment.id);
		textNode.innerHTML = "";
		textNode.appendChild(Site.CreateWriteForm({
			nohead: true,
			noleft: true,
			ctrlEnter: true,
			name: "text",
			value: comment.text,
			onsubmit: function(event) {
				var text = this.text && $.trim(this.text.value);
				if (!text) {
					Site.Alert({text: "Введите текст!"});
					return false;
				};
				Site.API("wall.editComment", {
					owner_id: ownerId,
					comment_id: comment.id,
					message: text,
					attachments: Wall.AttachmentToString(comment.attachments)
				}, function(data) {
					data = Site.isResponse(data);
					if (!data)
						return;
					comment.text = text;
					textNode.innerHTML = Mail.Emoji(Site.Format(text));
				})
				return false;
			}
		}, ownerId, 0));
	},

	// deprecated 10.01.2016
	restoreComment: function(ownerId, postId, commentId) {
		Site.API("wall.restoreComment",{
			owner_id: ownerId,
			comment_id: commentId
		}, function(data) {
			if (data.response) {
				var elem = $.element("wall-comment" + ownerId + "_" + postId + "_" + commentId);
				$.elements.removeClass(elem.querySelector(".wall-in"), "hidden");
				$.elements.remove($.element("wall-comment" + ownerId + "_" + postId + "_" + commentId + "_deleted"));
			};
		});
		return false;
	},

	// deprecated 10.01.2016
	deleteComment: function(ownerId, postId, commentId) {
		Site.API("wall.deleteComment",{
			owner_id: ownerId,
			comment_id: commentId
		}, function(data) {
			data = Site.isResponse(data);
			if(data === 1){
				var elem = $.element("wall-comment" + ownerId + "_" + postId + "_" + commentId);
				$.elements.addClass(elem.querySelector(".wall-in"), "hidden");
				elem.appendChild($.e("div", {
					id: "wall-comment" + ownerId + "_" + postId + "_" + commentId + "_deleted",
					append: [
						$.e("span",{
							"class": "tip",
							html: "Комментарий успешно удален. "
						}),
						$.e("a", {
							html: "Восстановить",
							onclick: function(event) {
								return Wall.restoreComment(ownerId, postId, commentId);
							}
						})
					]
				}));
			};
		});
		return false;
	},

	GeoAttachment: function(geo, needmap) {
		var coord = geo.coordinates.split(" "),
			parent = document.createElement("div"),
			map = document.createElement("div"),
			YandexLink = "http:\/\/maps.yandex.ru\/?ll=" + coord[1] + "," + coord[0] +"&pt=" + coord[1] + "," + coord[0] +"&z=14&l=map",
			APIdogLink = "#place?id=" + (geo && geo.place && (geo.place.id || geo.place.pid));
		map.className = "attachments-geo" + (geo.showmap || needmap ? "-map" : "");

		if (geo && !geo.place)
			return parent;

		if (geo.showmap || needmap) {
			map.appendChild($.e("a",{
				"class": "attachments-geo-linkmap",
				style:"background:url('\/\/static-maps.yandex.ru\/1.x\/?ll=" + coord[1] + "," + coord[0] + "&size=650,250&z=14&l=map&lang=ru-RU&pt=" + coord[1] + "," + coord[0] + ",vkbkm') center center no-repeat;",
				target: "_blank",
				href: YandexLink,
				append :$.e("div", {
					"class": "attachments-album-footer attachments-album-title sizefix",
					html: Site.Escape(geo.place.title)
				})
			}));
			parent.appendChild(map);
		}
		parent.appendChild($.e("a", {
			"class": "attachments-geo-plainlink",
			target: (!(geo.place.id || geo.place.pid)) ? "_blank" : "",
			style: "background:url(" + geo.place.icon + ") no-repeat",
			href: (!(geo.place.id || geo.place.pid)) ? YandexLink : APIdogLink,
			html: Site.Escape(geo.place.title || geo.place.address || "Место")
		}));
		return parent;
	},
	getAttachment: function(post) {
		post = post || {};
		return $.e("a", {
			href: "#wall" + (post.owner_id || post.source_id || post.to_id) + "_" + (post.id || post.pid) + "?from=" + window.location.hash,
			"class": "attachments-post",
			append: [
				$.e("div", {"class": "wall-icons wall-icon-repost"}),
				$.e("strong", {html: " " + Lang.get("wall.post_on_wall")})
			]
		});
	},
	getAttachmentReply: function(ownerId, postId, commentId) {
		return $.e("a", {
			href: "#wall" + ownerId + "_" + postId + "?reply=" + commentId + "&from=" + window.location.hash,
			"class": "attachments-post",
			append: [
				$.e("div", {"class": "wall-icons wall-icon-repost"}),
				$.e("strong", {html: " " + Lang.get("wall.comment_on_wall")})
			]
		});
	},
	getMessageAttachment: function(post) {
		var post = Wall.itemPost(post, post.owner_id, post.id, {message: true});
		return post;
	}
};
