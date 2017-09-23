var Notes = {

	getAttachment: function(note) {
		return getRowAttachment({
			link: "#note" + note.owner_id + "_" + note.id,
			title: note.title,
			subtitle: "Заметка",
			icon: "post"
		});
	},

	RequestPage: function() {
		var h = window.location.hash.replace("#", ""),
			note = /^note(\d+)_(\d+)/ig.exec(h),
			notes = /^notes(\d+)?/ig.exec(h);

		note = note ? [note[1], note[2]] : [];
		notes = notes ? notes[1] : API.userId;


		return Notes.explain(Site.get("act"), note && note[0] || notes, note[1]);
	},

	explain: function (act, ownerId, noteId) {
		switch (act) {
			case "friends":
				return Notes.getFriendsNotes();

			case "create":
				return Notes.create();

			default:
				return ownerId && noteId
					? Notes.getItem(ownerId, noteId)
					: Notes.getList(ownerId);
		}
	},

	getTabs: function(ownerId) {
		var tabs = [
			["notes" + (ownerId !== API.userId ? ownerId : ""), Lang.get("notes.notes")]
		];

		if (ownerId === API.userId) {
			tabs = tabs.concat([
				["notes?act=friends", Lang.get("notes.friends_notes")],
				["notes?act=create", Lang.get("notes.create")]
			]);
		}

		return Site.getTabPanel(tabs);
	},

	create: function() {
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

			var title = this.title.value.trim(),
				text = this.contentNote.value.trim(),
				privacy = this.privacy.options[this.privacy.selectedIndex].value,
				privacyComment = this.privacyComment.options[this.privacyComment.selectedIndex].value;

			if (!title || !text) {
				Site.Alert({text: Lang.get("notes.new_error")});
				return false;
			}

			api("notes.add", {title: title, text: text, privacy: privacy, comment_privacy: privacyComment}).then(function(data) {
				window.location.hash = "#note" + API.userId + "_" + data.nid;
			});
			return false;
		};
		parent.appendChild(Site.getPageHeader(Lang.get("notes.new_creating")));
		parent.appendChild(form);
		Site.append(parent);
		Site.setHeader(Lang.get("notes.new_creating"), {link: "notes"});
	},

	getPrivacy: function() {
		var d = [], t = Lang.get("notes.privacy"), e = $.e;
		for (var i = 0, l = t.length; i < l; ++i)
			d.push(e("option", {value: i, html: t[i]}));
		return d;
	},

	getList: function(ownerId) {
		ownerId = ownerId || API.userId;
		api("notes.get", {user_id: ownerId, count: 30, offset: getOffset(), v: 5.56}).then(function(data) {
			var e = $.e,
				count = data.count,
				items = data.items,
				parent = e("div"),
				list = e("div");

			for (var i = 0, l = items.length; i < l; ++i) {
				list.appendChild(Notes.item(items[i]));
			}

			parent.appendChild(Notes.getTabs(ownerId));
			parent.appendChild(Site.getPageHeader(count + " " + Lang.get("notes", "notes_", count)));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 30));
			Site.append(parent);
			Site.setHeader(Lang.get("notes.notes"), ownerId ? {link: "id" + ownerId} : {});
		});
	},

	getFriendsNotes: function() {
		api("notes.getFriendsNotes", {count: 30, offset: getOffset(), v: 5.56}).then(function(data) {
			var e = $.e,
				count = data.count,
				items = data.items,
				parent = e("div"),
				list = e("div");

			for (var i = 0, l = items.length; i < l; ++i) {
				list.appendChild(Notes.item(items[i]));
			}

			parent.appendChild(Notes.getTabs(API.userId));
			parent.appendChild(Site.getPageHeader(count + " " + Lang.get("notes", "notes_", count)));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 30));
			Site.append(parent);
			Site.setHeader(Lang.get("notes.friends_notes"), {link: "notes"});
		})
	},

	item: function(n) {
		var e = $.e;
		return e("a", {"class": "boards-item", href: "#note" + n.owner_id + "_" + n.id, append: [
			e("strong", {html: n.title}),
			e("div", {"class": "boards-date", html: getDate(n.date, APIDOG_DATE_FORMAT_FULL)}),
			e("div", {"class": "boards-last", html: n.comments + " " + Lang.get("notes", "comments_", n.comments)}),
			n.owner_id !== API.userId && n.first_name && n.last_name ? e("div", {"class": "a strong", html: getName(n), onclick: function (event) {
				$.event.cancel(event);
				window.location.hash = "#id" + n.owner_id;
			}}) : null
		]});
	},

	getItem: function(ownerId, noteId) {
		api("execute", {
			code: 'var p={type:"note",owner_id:parseInt(Args.o),item_id:parseInt(Args.i),v:5.11},c=API.notes.getComments({owner_id:p.owner_id,note_id:p.item_id,count:30,v:5.11,offset:Args.s});return{note:API.notes.getById({owner_id:p.owner_id,note_id:p.item_id,v:5.56,need_wiki:1}),likes:{count:API.likes.getList(p).count,user_likes:API.likes.isLiked(p).liked},comments:c,users:API.users.get({user_ids:(c.items@.uid+c.items@.reply_to+[p.owner_id]),fields:Args.f})};',
			o: ownerId,
			i: noteId,
			s: getOffset(),
			f: "photo_50,online,first_name_gen,last_name_gen,screen_name"
		}).then(function(data) {
			var e = $.e,
				note = data.note,
				owner_id = note.owner_id,
				users = Local.add(data.users),
				parent = e("div"),
				content = e("div");

			Notes.insertStyles();
			Notes.getContent(content, note);

			parent.appendChild(Site.getPageHeader(Lang.get("notes.note")));
			parent.appendChild(content);


			Site.append(parent);
			Site.setHeader(Lang.get("notes.note") + " " + users[owner_id].first_name_gen, {link: "notes" + owner_id});
			Wiki.initNormalize();
		});
	},
	getContent: function (node, note) {
		var e = $.e, u = Local.data[note.owner_id], content;
		node.appendChild(e("div", {"class": "note-head", append: [
			e("img", {src: getURL(u.photo_50)}),
			e("div", {append: [
				e("a", {href: "#" + u.screen_name, html: u.first_name + " " + u.last_name}),
				e("span", {html: getDate(note.date, APIDOG_DATE_FORMAT_FULL)})
			]})
		]}));
		node.appendChild(content = e("div", {"class": "note-content", html: Notes.filterContent(note.text)}));
		if (note.owner_id === API.userId) {
			node.appendChild(e("div", {"class": "note-content tip", append: [
				e("a", {"class": "a", html: Lang.get("notes.edit"), onclick: function() {
					Notes.editNote(content, note);
				}}),
				document.createTextNode(" | "),
				e("a", {"class": "a", html: Lang.get("notes.delete"), onclick: function() {
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
			if (e[i].link === Notes.WIKI_STYLES)
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

				var title = this.title.value.trim(),
					text = this.contentNote.value.trim(),
					privacy = this.privacy.options[this.privacy.selectedIndex].value,
					privacyComment = this.privacyComment.options[this.privacyComment.selectedIndex].value;

				if (!title || !text) {
					Site.Alert({text: Lang.get("notes.new_error")});
					return false;
				}

				api("notes.edit", {
					note_id: note.id,
					title: title,
					text: text,
					privacy: privacy,
					comment_privacy: privacyComment,
					v: 5.24
				}).then(function() {
					Site.route(window.location.hash);
				});
				return false;
			},
			"class": "sf-wrap",
			style: "padding: 0",
			append: [
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_title")}),
				$.e("input", {type: "text", value: note.title.safe(), name: "title"}),
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_content")}),
				$.e("textarea", {"class": "note-edit-text", html: String(note.text_wiki).unsafe(), name: "contentNote"}),
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_who_view")}),
				pv,
				$.e("div", {"class": "tip tip-form", html: Lang.get("notes.new_who_comment")}),
				pc,
				$.e("input", {type: "submit", value: Lang.get("general.save")})
			]
		}));
		$.elements.remove(node.nextSibling);
	},
	deleteNote: function(node, ownerId, noteId) {
		api("notes.delete", {note_id: noteId}).then(function() {
			Site.Alert({text: Lang.get("notes.deleted")});
			window.location.hash = "#notes";
		});
	}
};
