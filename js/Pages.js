/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Pages = {
	getAttachment: function (page) {
		return $.e("div", {"class": "attachments-page", append: [
			$.e("div", {"class": "wall-icons wall-icon-page"}),
			$.e("span", {"class": "tip", html: " Страница "}),
			$.e("a", {href: "#page-" + page.group_id + "_" + page.id, html: page.title})
		]});
	},
	explain: function (url) {
		if (/^page-?\d+_\d+/img.test(url))
		{
			var ids = /^page(-?\d+)_(\d+)/img.exec(url),
				groupId = ids[1],
				pageId = ids[2];
			switch (Site.Get("act"))
			{

				case "versions":
					return Pages.getVersions({
						groupId: groupId,
						pageId: pageId
					});
					break;

				default:
					return Pages.load({
						groupId: groupId,
						pageId: pageId,
						version: Site.Get("version"),
						global: Site.Get("global"),
						site: Site.Get("site")
					});
				break;
			};
		};

		switch (Site.Get("act"))
		{

			case "titles":
				Pages.getTitles(Site.Get("group"));
				break;

			default:
				Pages.load({
					groupId: Site.Get("group") || Site.Get("oid"),
					pageTitle: (Site.Get("title") || Site.Get("p")).replace(/_/gim, " "),
					version: Site.Get("version"),
					global: Site.Get("global")
				});
				break;
		}
	},
	storage: {},
	load: function (opts) {
		opts = opts || {};
		opts.link = opts.groupId + "_" + (opts.pageId || opts.pageTitle);
		Site.Loader();
		if (Pages.storage[opts.link] && !opts.version)
			return Pages.makeAction(Pages.storage[opts.link]);

		console.log(opts.pageTitle);

		opts.pageTitle = decodeURIComponent(opts.pageTitle);

		Site.API("execute", {
			code: ("var p=" + (!opts.version ? "API.pages.get({owner_id:%o,title:\"%t\",page_id:\"%i\",v:5.24,need_html:1,need_source:1%s%g})" : "API.pages.getVersion({group_id:%o,version_id:%v,need_html:1})") + ";return {page:p,group:API.groups.getById({group_id:p.group_id,v:5.24})[0],users:API.users.get({user_ids:[p.creator_id,p.editor_id],v:5.24})};")
					.replace(/%o/img, opts.groupId > 0 && !Site.Get("site") ? -opts.groupId : opts.groupId)
					.replace(/%t/img, opts.pageTitle || "")
					.replace(/%i/img, opts.pageId || "")
					.replace(/%v/img, opts.version || "")
					.replace(/%g/img, (opts.global ? ",global:1" : "") || "")
					.replace(/%s/img, Site.Get("site") ? ",site_preview:1" : "")
		}, function (data) {
			data = Site.isResponse(data);

			Local.AddUsers([data.group]);
			Local.AddUsers(data.users);

			Pages.makeAction(new Page(data.page));
		});
	},
	makeAction: function (page) {
		switch (Site.Get("act")) {
			case "edit":    return Pages.editPage(page); break;
			case "history": return Pages.getVersions(page); break;
			default:        return Pages.showContent(page); break;
		}
	},
	showContent: function (page) {
		if (!page.pageId)
			return Site.Alert({text: "Нет доступа к странице"});
		var e = $.e,
			parent = e("div"),
			actions = {},
			content = e("div", {"class": "note-content", html: Wiki.parseContent(page.sourceHTML)});

		if (page.canEdit)
			actions[Lang.get("pages.action_edit")] = function (event) {
				Pages.editPage(page);
			};
		if (page.canEditAccess)
			actions[Lang.get("pages.action_edit_access")] = function (event) {
				Pages.setAccessControl(page, content);
			};
		actions[Lang.get("pages.action_show_versions")] = function (event) {
			window.location.hash = "#page-" + page.groupId + "_" + page.pageId + "?act=versions";
		};
		Wiki.insertStyles();

		parent.appendChild(Site.CreateHeader(page.getTitleString(), page.canEdit ? Site.CreateDropDownMenu(Lang.get("general.actions"), actions) : null));
		parent.appendChild(content);
		parent.appendChild(page.getFooterPage());
		Site.Append(parent);
		Site.SetHeader(Lang.get("pages.page"));
		Wiki.initNormalize();
	},
	setAccessControl: function (page, node) {

		if ($.element("page-edit-access" + page.pageId))
			return $.elements.remove($.element("page-edit-access" + page.pageId));
		var e = $.e;
		node.parentNode.insertBefore(e("form", {id: "page-edit-access" + page.pageId, "class": "sf-wrap page-edit-access", append: [
			e("div", {"class": "pages-edit-access-tip", html: Lang.get("pages.edit_access_who_view")}),
			e("div", {"class": "pages-edit-access-wrap", append: Pages.getPrivacySelect("privacyView", page.privacyView)}),
			e("div", {"class": "pages-edit-access-tip", html: Lang.get("pages.edit_access_who_edit")}),
			e("div", {"class": "pages-edit-access-wrap", append: Pages.getPrivacySelect("privacyEdit", page.privacyEdit)}),
			e("input", {type: "submit", value: Lang.get("general.save")})
		], onsubmit: function (event) {
			$.event.cancel(event);
			var v = this.privacyView.options[this.privacyView.selectedIndex].value,
				e = this.privacyEdit.options[this.privacyEdit.selectedIndex].value;
			Site.API("pages.saveAccess", {
				group_id: page.groupId,
				page_id: page.pageId,
				view: v,
				edit: e
			}, function (data) {
				data = Site.isResponse(data);

				if (data != page.pageId)
					return;

				$.elements.remove($.element("page-edit-access" + page.pageId));
				page.privacyView = v;
				page.privacyEdit = e;
				Pages.storage[page.groupId + "_" + page.pageId] = page;
			})
			return false;
		}}), node);
	},
	getPrivacySelect: function (name, selected) {
		var e = $.e, s = e("select", {name: name}), t = Lang.get("pages.privacy");
		for (var i = 0; i < t.length; ++i)
			s.appendChild(e("option", {value: i, html: t[i]}));
		s.selectedIndex = selected;
		return s;
	},
	editPage: function (page) {
		var e = $.e,
			p = e("div", {append: Site.CreateHeader(Lang.get("pages.head_edit"))}),
			s = e("textarea", {"class": "note-edit-text", name: "text", html: page.sourceWiki}),
			v = e("div", {"class": "pages-edit-preview", id: "page-edit-preview"}),
			b = e("input", {type: "submit", value: Lang.get("general.save")}),
			f = e("form", {"class": "sf-wrap", onsubmit: function(event) {$.event.cancel(event); Pages.save(page, s.value, b, v); }, append: [
				s,
				e("div", {"class": "pages-edit-actions", append: [
					b
					//e("input", {type: "button", value: Lang.get("pages.preview"), onclick: function (event) {return Pages.preview(page, s.value, v);}})
				]}),
				v
			]});

		p.appendChild(f);

		Site.Append(p);
		Site.SetHeader(Lang.get("pages.head_edit"), {link: "page-" + page.groupId + "_" + page.pageId});
	},

	// v6.4 - 11/09/2014
	// невозможно сделать предпросмотр вики-кода из-за бага в методе pages.parseWiki. text работает странно.
	// во-первых, если есть русские символы, то он возвращает null (однако, решается при использовании
	// iconv(utf8, cp1251)). Во-вторых, при сложном коде тоже возвращается null.

	/*preview: function (page, source, preview) {
		$.ajax.post({
			url: "/api/dog.parseWiki",
			json: true,
			params: {
				access_token: API.access_token,
				group_id: page.groupId,
				text: source
			},
			callback: function (data) {
				console.log(data);
				preview.innerHTML = Wiki.parseContent(data.response);
			}
		});
	},*/
	save: function (page, source, button, preview) {
		button.disabled = true;
		button.value = "...";
		Site.API("pages.save", {
			group_id: page.groupId,
			page_id: page.pageId,
			text: source
		}, function (data) {
			data = Site.isResponse(data);
			if (!data) return Site.Alert({text: "Error"});
			button.disabled = false;
			button.value = Lang.get("general.saved");
			setTimeout(function () {
				button.value = Lang.get("general.save");
			}, 1500);
		})
	},
	getVersions: function (opts) {
		opts = opts || {};
		Site.Loader();
		Site.APIv5("pages.getHistory", {
			group_id: -opts.groupId,
			page_id: opts.pageId,
			v: 5.24
		}, function (data) {
			data = Site.isResponse(data);

			Pages.showHistory(data, opts.groupId, opts.pageId);
		});
	},
	showHistory: function (items, groupId, pageId) {
		var e = $.e,
			p = e("div", {append: Site.CreateHeader(Lang.get("pages.head_history"))}),
			t = e("table", {"class": "pages-history-table"});

		for (var i = 0, l = items.length; i < l; ++i)
			t.appendChild(new PageVersion(items[i], groupId, pageId).getRow());

		p.appendChild(t);

		Site.Append(p);
		Site.SetHeader(Lang.get("pages.action_show_versions"), {link: "page-" + groupId + "_" + pageId});
	},
	getTitles: function (groupId) {
		Site.APIv5("pages.getTitles", {group_id: groupId > 0 ? groupId : -groupId, v: 5.24}, function (data) {
			data = Site.isResponse(data);

			if (!data)
				return;

			var e = $.e,
				parent = e("div"),
				list = e("div");

			for (var i = 0, l = data.length; i < l; ++i) {
				list.appendChild(new Page(data[i], true).getItem());
			}

			parent.appendChild(Site.CreateHeader(Lang.get("pages.head_all_pages_of_group"), data.length + " " + Lang.get("pages", "pages", data.length)));
			parent.appendChild(list);

			Site.Append(parent);
			Site.SetHeader(Lang.get("pages.head_all_pages_of_group"), {link: "club" + (groupId > 0 ? groupId : -groupId)});
		})
	}
};

function Page (p, noChate) {
	var self = this;

	self.pageId = (p.id || p.pid || p.page_id);
	self.groupId = (p.group_id);
	self.title = p.title;

	self.privacyView = p.who_can_view;
	self.privacyEdit = p.who_can_edit;

	self.created = typeof p.created === "string" ? new Date(p.created.replace(" ", "T")) / 1000 : p.created;
	self.creatorId = p.creator_id;
	self.edited = typeof p.edited === "string" ? new Date(p.edited.replace(" ", "T")) / 1000 : p.edited;
	self.editorId = p.editor_id;

	self.views = p.views;
	self.sourceWiki = p.source;
	self.sourceHTML = p.html;
	self.viewUrl = p.view_url;
	self.original = p.url;

	self.isVersion = !!p.version_created;
	if (p.page_id && p.id) {
		self.pageId = p.page_id;
		self.versionId = p.id;
	}
	self.versionDate = p.version_created;

	self.parent = p.parent;
	self.preParent = p.parent2;

	self.canEdit = p.current_user_can_edit;
	self.canEditAccess = p.current_user_can_edit_access;

	self.getGroup = function () {
		var g = Local.Users[-this.groupId];
		return {name: g.name, link: "#" + (g.screen_name || "id" + g.id)}
	};

	self.getTitleString = function () {
		var g = this.getGroup();
		return $.e("span", {append: [
			$.e("a", {href: g.link, html: g.name}),
			document.createTextNode(" » "),
			$.e("a", {href: "#page-" + this.groupId + "_" + this.pageId, html: this.title})
		]});
	};
	self.getAuthor = function () {
		var u = Local.Users[this.creatorId];
		return {name: u.first_name + " " + u.last_name, link: "#" + (u.screen_name || "id" + u.id)};
	};
	self.getEditor = function () {
		var u = Local.Users[this.editorId];
		return {name: u.first_name + " " + u.last_name, link: "#" + (u.screen_name || "id" + u.id)};
	};
	self.getFooterPage = function () {
		var a,
			e,
			n = $.e,
			p = n("div", {"class": "pages-footer"});

		p.appendChild(n("div", {"class": "pages-footer-item tip", html: this.views + " " + Lang.get("pages", "views", this.views)}));
		if (this.creatorId) {
			a = this.getAuthor();
			p.appendChild(n("div", {"class": "pages-footer-item tip", append: [
				n("span", {html: Lang.get("pages.page_author")}),
				n("a", {href: a.link, html: a.name}),
				n("span", {html: " " + Site.getDate(this.created)})
			]}));
		}
		if (this.editorId) {
			e = this.getEditor();
			p.appendChild(n("div", {"class": "pages-footer-item tip", append: [
				n("span", {html: Lang.get("pages.page_editor")}),
				n("a", {href: e.link, html: e.name}),
				n("span", {html: " " + Site.getDate(this.edited)})
			]}));
		}
		if (this.original) {
			p.appendChild(n("div", {"class": "pages-footer-item tip", append: [
				n("span", {html: Lang.get("pages.page_original")}),
				n("a", {href: self.original, html: Lang.get("pages.page_original_show"), target: "_blank"})
			]}));
		}

		return p;
	};
	self.getItem = function () {
		var e = $.e;
		return e("a", {"class": "boards-item", href: "#page-" + this.groupId + "_" + this.pageId, append: [
			e("strong", {html: this.title}),
			e("div", {"class": "boards-date", html: Site.getDate(this.created)}),
			e("div", {"class": "boards-last", html: this.views + " " + Lang.get("pages", "views", this.views) + Lang.get("pages.edtited") + Site.getDate(this.edited)})
		]});
	};

	if (!self.isVersion && !noChate)
		Pages.storage[self.groupId + "_" + self.pageId] = self;
};
function PageVersion (v, groupId, pageId) {
	var self = this;

	self.versionId = v.id;
	self.groupId = groupId > 0 ? groupId : -groupId;
	self.pageId = pageId;
	self.size = v.length;
	self.date = v.date;
	self.editorId = v.editor_id;
	self.editorName = v.editor_name;
	self.getRow = function () {
		var e = $.e;
		return e("tr", {"class": "pages-history-item", append: [
			e("td", {html: Site.getDate(this.date)}),
			e("td", {append: e("a", {href: "#id" + this.editorId, html: this.editorName})}),
			e("td", {html: this.size}),
			e("td", {append: e("a", {href: this.getLink(), html: Lang.get("pages.view")})})
		]});
	};
	self.getLink = function () {
		return "#page-" + this.groupId + "_" + this.pageId + "?version=" + this.versionId;
	};
};