/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Notes = {
	getAttachment: function (note) {
		return $.e("div", {"class": "attachments-note", append: [
			$.e("div", {"class": "wall-icons wall-icon-note"}),
			$.e("span", {"class": "tip", html: " Заметка "}),
			$.e("a", {href: "#note" + note.owner_id + "_" + note.id, html: note.title})
		]});
	},
	RequestPage: function (owner_id) {
		var h = window.location.hash.replace("#", ""),
			note = /^note(\d+)_(\d+)/ig.exec(h),
			notes = /^notes(\d+)?/ig.exec(h);
		note = note ? [note[1], note[2]] : [];
		notes = notes ? notes[1] : API.userId;
			console.log(note, notes);
		return Notes.explain(Site.Get("act"), note && note[0] || notes, note[1]);
	},
	explain: function (act, owner_id, note_id) {
		switch (act) {
			case "friends":
				return Notes.getFriendsNotes();
			break;
			case "create":
				return Notes.create();
			break;
			default:
				if (owner_id && note_id)
					return Notes.getItem(owner_id, note_id);
				return Notes.getList(owner_id);
		}
	},
	tov5: function (n) {
		if ($.isArray(n)) {
			return {count: n[0], items: n.slice(1)};
		}
		n.id            = +(n.id            || n.nid);
		n.user_id       = +(n.user_id       || n.uid);
		n.owner_id      = n.user_id;
		n.comments      = +(n.comments      || n.ncom);
		n.read_comments = +(n.read_comments || n.read_ncom);
		return n;
	},
	getTabs: function (owner_id) {
		var tabs = [
			["notes" + (owner_id != API.userId ? owner_id : ""), Lang.get("notes.notes")]
		];
		if (owner_id == API.userId)
			tabs = tabs.concat([["notes?act=friends", Lang.get("notes.friends_notes")], ["notes?act=create", Lang.get("notes.create")]]);
		return Site.CreateTabPanel(tabs);
	},
	create: function () {
		var e = $.e,
			parent = e("div"),
			form = e("form", {"class": "sf-wrap"});

		form.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("notes.new_title")}));
		form.appendChild(e("input", {type: "text", name: "title"}));
		form.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("notes.new_content")}));
		form.appendChild(e("textarea", {"class": "note-edit-text", name: "contentNote"}));
		form.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("notes.new_who_view")}));
		form.appendChild(e("select", {name: "privacy", append: Notes.getPrivacy()}));
		form.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("notes.new_who_comment")}));
		form.appendChild(e("select", {name: "privacyComment", append: Notes.getPrivacy()}));
		form.appendChild(e("input", {type: "submit", value: Lang.get("notes.create")}));
		form.onsubmit= function (event) {
			$.event.cancel(event);

			var title = $.trim(this.title.value),
				text = $.trim(this.contentNote.value),
				privacy = this.privacy.options[this.privacy.selectedIndex].value;
				privacyComment = this.privacyComment.options[this.privacyComment.selectedIndex].value;

			if (!title || !text) {
				Site.Alert({text: Lang.get("notes.new_error")});
				return false;
			}

			Site.API("notes.add", {title: title, text: text, privacy: privacy, comment_privacy: privacyComment}, function (data) {
				data = Site.isResponse(data);
				if (!data)
					return;
				window.location.hash = "#note" + API.userId + "_" + data.nid;
			});
			return false;
		};
		parent.appendChild(Site.CreateHeader(Lang.get("notes.new_creating")));
		parent.appendChild(form);
		Site.Append(parent);
		Site.SetHeader(Lang.get("notes.new_creating"), {link: "notes"});
	},
	getPrivacy: function () {
		var d = [], t = Lang.get("notes.privacy"), e = $.e;
		for (var i = 0, l = t.length; i < l; ++i)
			d.push(e("option", {value: i, html: t[i]}));
		return d;
	},
	getList: function (owner_id) {
		owner_id = owner_id || API.userId;
		Site.API("notes.get", {user_id: owner_id, count: 30, offset: Site.Get("offset")}, function (data) {
			if (!(data = Site.isResponse(data)))
				return;
			data = Notes.tov5(data);
			var e = $.e,
				count = data.count,
				items = data.items,
				parent = e("div"),
				list = e("div");

			for (var i = 0, l = items.length; i < l; ++i) {
				list.appendChild(Notes.item(Notes.tov5(items[i])));
			}

			parent.appendChild(Notes.getTabs(owner_id));
			parent.appendChild(Site.CreateHeader(count + " " + Lang.get("notes", "notes_", count)));
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 30));
			Site.Append(parent);
			Site.SetHeader(Lang.get("notes.notes"), owner_id ? {link: "id" + owner_id} : {});
		});
	},
	getFriendsNotes: function () {
		Site.API("notes.getFriendsNotes", {count: 30, offset: Site.Get("offset")}, function (data) {
			if (!(data = Site.isResponse(data)))
				return;
			data = Notes.tov5(data);
			var e = $.e,
				count = data.count,
				items = data.items,
				parent = e("div"),
				list = e("div");

			for (var i = 0, l = items.length; i < l; ++i) {
				list.appendChild(Notes.item(Notes.tov5(items[i])));
			}
			parent.appendChild(Notes.getTabs(API.userId));
			parent.appendChild(Site.CreateHeader(count + " " + Lang.get("notes", "notes_", count)));
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 30));
			Site.Append(parent);
			Site.SetHeader(Lang.get("notes.friends_notes"), {link: "notes"});
		})
	},
	item: function (n) {
		var e = $.e;
		return e("a", {"class": "boards-item", href: "#note" + n.user_id + "_" + n.id, append: [
			e("strong", {html: n.title}),
			e("div", {"class": "boards-date", html: Site.getDate(n.date)}),
			e("div", {"class": "boards-last", html: n.comments + " " + Lang.get("notes", "comments_", n.comments)}),
			n.user_id != API.userId && n.first_name && n.last_name ? e("div", {"class": "a strong", html: n.first_name + " " + n.last_name, onclick: function (event) {
				$.event.cancel(event);
				window.location.hash = "#id" + n.user_id;
			}}) : null
		]});
	},
	getItem: function (owner_id, note_id) {
		Site.API("execute", {
			code: 'var p={type:"note",owner_id:%o%,item_id:%n%,v:5.11},c=API.notes.getComments({owner_id:%o%,note_id:%n%,count:30,v:5.11});return {note:API.notes.getById({owner_id:%o%,note_id:%n%,v:4.0,need_wiki:1}),likes:{count:API.likes.getList(p).count,user_likes:API.likes.isLiked(p).liked},comments:c,users:API.users.get({user_ids:(c.items@.uid+c.items@.reply_to+[%o%]),fields:"photo_50,online,first_name_gen,last_name_gen,screen_name"})};'.replace(/%o%/ig, owner_id).replace(/%n%/ig, note_id)
		}, function (data) {
			if (!(data = Site.isResponse(data)))
				return;

			var e = $.e,
				note = Notes.tov5(data.note),
				owner_id = note.owner_id,
				note_id = note.id,
				comments = data.comments,
				items = Notes.tov5comments(comments.items),
				count = comments.count,
				users = Local.AddUsers(data.users),
				parent = e("div"),
				content = e("div"),
				comments = e("div");

			Notes.insertStyles();
			Notes.getContent(content, note);
			Notes.getComments(comments, owner_id, note_id, {count: count, items: items}, {can_comment: note.can_comment});

			parent.appendChild(Site.CreateHeader(Lang.get("notes.note")));
			parent.appendChild(content);
			parent.appendChild(Site.CreateHeader(Lang.get("notes.comments")));
			parent.appendChild(comments);

			Site.Append(parent);
			Site.SetHeader(Lang.get("notes.note") + " " + users[owner_id].first_name_gen, {link: "notes" + owner_id});
			Wiki.initNormalize();
		});
	},
	getContent: function (node, note) {
		var e = $.e, u = Local.Users[note.owner_id], content;
		node.appendChild(e("div", {"class": "note-head", append: [
			e("img", {src: getURL(u.photo_50)}),
			e("div", {append: [
				e("a", {href: "#" + u.screen_name, html: u.first_name + " " + u.last_name}),
				e("span", {html: Site.getDate(note.date)})
			]})
		]}));
		node.appendChild(content = e("div", {"class": "note-content", html: Notes.filterContent(note.text)}));
		if (note.owner_id == API.userId) {
			node.appendChild(e("div", {"class": "note-content tip", append: [
				e("a", {"class": "a", html: Lang.get("notes.edit"), onclick: function (event) {
					Notes.editNote(content, note);
				}}),
				document.createTextNode(" | "),
				e("a", {"class": "a", html: Lang.get("notes.delete"), onclick: function (event) {
					if (!confirm(Lang.get("notes.delete_confirm")))
						return;
					Notes.deleteNote(node, note.owner_id, note.id);
				}})
			]}));
		}
		return node;
	},
	filterContent: function (text) {
		return Wiki.parseContent(text);
	},
	WIKI_STYLES: "//apidog.ru/includes/wiki.css",
	insertStyles: function () {
		var e = document.getElementsByTagName("link");
		for (var i = 0, l = e.length; i < l; ++i)
			if (e[i].link == Notes.WIKI_STYLES)
				return;

		document.getElementsByTagName("head")[0].appendChild($.e("link", {rel: "stylesheet", href: Notes.WIKI_STYLES}));
	},
	editNote: function (node, note) {
		$.elements.clearChild(node);

		var pv = $.e("select", {name: "privacy", append: Notes.getPrivacy()}),
			pc = $.e("select", {name: "privacyComment", append: Notes.getPrivacy()}),
			pi = function (type) {
				return  {
					all: 0,
					friends: 1,
					friends_of_friends: 2,
					nobody: 3,
					users: 1
				}[type.type];
			};

		pv.selectedIndex = note.privacy; //pi(note.privacy_view);
		pc.selectedIndex = note.comment_privacy; //pi(note.privacy_comment);

		node.appendChild($.e("form", {
			onsubmit: function (event) {
				$.event.cancel(event);

				var title = $.trim(this.title.value),
					text = $.trim(this.contentNote.value),
					privacy = this.privacy.options[this.privacy.selectedIndex].value;
					privacyComment = this.privacyComment.options[this.privacyComment.selectedIndex].value;

				if (!title || !text) {
					Site.Alert({text: Lang.get("notes.new_error")});
					return false;
				}

				Site.APIv5("notes.edit", {
					note_id: note.id,
					title: title,
					text: text,
					privacy: privacy,
					comment_privacy: privacyComment,
					v: 5.24
				}, function (data) {
					if (data)
						Site.Go(window.location.hash.split("?")[0] + "?edited=" + Date.now()); // HOTFIX
				});
				return false;
			},
			"class": "sf-wrap",
			style: "padding: 0",
			append: [
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_title")}),
				$.e("input", {type: "text", value: Site.Escape(note.title), name: "title"}),
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_content")}),
				$.e("textarea", {"class": "note-edit-text", html: Site.Unescape(note.text_wiki), name: "contentNote"}),
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_who_view")}),
				pv,
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_who_comment")}),
				pc,
				$.e("input", {type: "submit", value: Lang.get("general.save")})
			]
		}));
		$.elements.remove(node.nextSibling);
	},

	deleteNote: function (node, owner_id, note_id) {
		Site.API("notes.delete", {note_id: note_id}, function (data) {
			if (data) {
				Site.Alert({text: Lang.get("notes.deleted")});
				window.location.hash = "#notes";
			}
		});
	},

	getComments: function (node, owner_id, note_id, comments, options) {
		options = options || {};
		var items = comments.items, count = comments.count, longId = owner_id + "_" + note_id;
		if (count || items.length)
			for (var i = 0, l = items.length; i < l; ++i) {
				node.appendChild(Notes.itemComment(items[i]));
			}
		else
			node.appendChild(Site.EmptyField(Lang.get("notes.comments_nothing")))
		var pagination;
		node.appendChild(pagination = Site.getPagination({offset: options.offset || 0, step: 30, callback: function (newOffset) {
			Notes.loadComments(node, newOffset, owner_id, note_id);
		}}));
		if (options.can_comment)
			node.appendChild(Notes.getWriteForm(owner_id, note_id, node));

		return node;
	},
	laodComments: function (node, offset, owner_id, note_id) {},
	tov5comments: function (n) {
		if ($.isArray(n)) {
			for (var i = 0, l = n.length; i < l; ++i) {
				n[i] = Notes.tov5comments(n[i]);
			}
			return n;
		}
		console.log(n);
		n.user_id = +(n.user_id || n.uid);
		n.id = +(n.id || n.cid);
		n.note_id = +(n.note_id || n.nid);
		n.owner_id = +(n.owner_id || n.oid);
		n.reply_to = +n.reply_to;
		return n;
	},
	comments: {},
	itemComment: function (c) {
		var e = $.e,
			item = e("div"),
			from = c.user_id,
			user = Local.Users[from],
			screen_name = user.screen_name,
			name = user.first_name + " " + user.last_name,
			photo = getURL(user.photo_50),
			owner_id = c.owner_id,
			note_id = c.note_id,
			comment_id = c.id,
			actions = [],
			textNode = e("div", {html: Site.Format(c.message)}),
			longId = owner_id + "_" + note_id + "_" + comment_id;

		Notes.comments[longId] = c;

		item.className = "comments board-creater";
		item.id = "comment_note_" + longId;
		if (API.userId == from) {
			actions.push(e("span", {"class": "a", html: Lang.get("notes.edit"), onclick: (function (node, owner_id, note_id, comment_id) {
				return function (event) {
					var node = textNode.parentNode;
					$.elements.clearChild(node);
					node.appendChild(Notes.editForm(owner_id, note_id, comment_id));
				};
			})(textNode, c.owner_id, c.note_id, c.id)}));
			actions.push(e("span", {"class": "tip", html: " | "}));
		}

		if (API.userId == from || owner_id == API.userId)
			actions.push(e("span", {"class": "a", html: Lang.get("notes.delete"), onclick: (function (id, elem) {
				return function (event) {
					if (!confirm(Lang.get("notes.delete_confirm_comment")))
						return;
					Site.API("notes.deleteComment", {
						owner_id: owner_id,
						comment_id: id
					}, function (data) {
						data = Site.isResponse(data);
						if (data) {
							$.elements.clearChild(elem);
							elem.appendChild(e("div", {"class": "comment-deleted", append: [
								document.createTextNode(Lang.get("notes.deleted_comment")),
								$.elements.create("span", {"class": "a", html: Lang.get("notes.restore"), onclick: (function (owner_id, note_id, comment_id) {
									return function (event) {
										Site.API("notes.restoreComment", {
											owner_id: owner_id,
											comment_id: comment_id
										}, function (data) {
											data = Site.isResponse(data);
											if (data)
												$.elements.clearChild(item);
											item.parentNode.insertBefore(Notes.itemComment(Notes.comments[longId]), item);
											$.elements.remove(item);
										})
									};
								})(owner_id, note_id, id)})
							]}))
						}
					});
				}
			})(c.id, item)}));
		item.appendChild(e("div", {"class": "comments-left", append: e("img", {src: photo}) }));
		item.appendChild(e("div", {"class": "comments-right", append: [
			e("a", {"class": "bold", href: "#" + screen_name, html: name}),
			e("div", {"class": "comments-content", id: "note" + longId + "_text", append: textNode}),
			e("div", {"class": "comments-attachments", append: Site.Attachment(c.attachments)}),
			e("div",{
				"class": "comments-footer",
				append: [
					e("div", {"class": "comments-actions", append: actions}),
					e("div",{"class": "comments-footer-left", html: $.getDate(c.date)})
				]
			})
		]}));
		return item;
	},
	getWriteForm: function (owner_id, note_id, list) {
		var form = Site.CreateWriteForm({
			name: "text",
			onsubmit: function (event) {
				var text = this.text && $.trim(this.text.value),
					nodeList = list,
					nodeText = this.text;
				if (!text) {
					Site.Alert({text: Lang.get("notes.enter_text")});
					return false;
				}
				Site.API("notes.createComment", {
					owner_id: owner_id,
					note_id: note_id,
					message: text,
				}, function (data) {
					data = Site.isResponse(data);
					if (data) {
						if (nodeList.querySelector(".msg-empty"))
							$.elements.remove(nodeList.querySelector(".msg-empty"));
						nodeList.insertBefore(Notes.itemComment({
							date: Math.round(+new Date() / 1000),
							message: text,
							id: data,
							owner_id: owner_id,
							note_id: note_id,
							user_id: API.userId,
							reply_to: 0
						}), form);
						nodeText && (nodeText.value = "");
					}
				});
				return false;
			}
		});
		return form;
	},
	editForm: function (owner_id, note_id, comment_id) {
		var longId = owner_id + "_" + note_id + "_" + comment_id,
			item = Notes.comments[longId];
		return Site.CreateWriteForm({
			name: "text",
			value: item.message,
			nohead: true,
			noleft: true,
			onsubmit: function (event) {
				var text = this.text && $.trim(this.text.value),
					nodeText = this.text;
				if (!text) {
					Site.Alert({text: Lang.get("notes.enter_text")});
					return false;
				}
				Site.API("notes.editComment", {
					owner_id: owner_id,
					note_id: note_id,
					comment_id: comment_id,
					message: text,
				}, function (data) {
					data = Site.isResponse(data);
					if (data) {
						var node = $.element("comment_note_" + longId);
						item.message = text;
						node.parentNode.insertBefore(Notes.itemComment(item), node);
						nodeText && (nodeText.value = "");
						$.elements.remove(node);
					}
				});
				return false;
			}
		});
	}
};