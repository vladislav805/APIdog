/**
 * APIdog v6.5
 *
 * Branch: dev
 * Progress: 20%
 */


/**
 * Диалог
 * @param {Object} d Элемент ВК
 */
function VKDialog(d) {
	this.unread = d.unread || 0;
	this.lastReadOut = d.out_read;
	this.lastReadIn = d.in_read;
	this.lastMessage = new VKMessage(d.message);
};

VKDialog.prototype = {
	getNode: function(o) {
		return this.lastMessage.getDialogItemNode({unread: this.unread});
	}
};


/**
 * Сообщение
 * @param {Object} m Элемент ВК
 */
function VKMessage (m) {
	m = m.message || m;
	this.messageId = m.id;
	this.peerId = m.user_id || m.from_id;
	this.userId = m.user_id;
	this.chatId = m.chat_id;
	this.groupId = m.from_id < 0 ? -m.from_id : false;
	this.peer = getPeerByMessage(this); // [type, id]
	this.userId = m.user_id;
	this.fromId = m.chatId ? m.userId : m.groupId ? m.groupId : m.userId;
	this.date = m.date;
	this.title = m.title;
	this.text = m.body;
	this.geo = m.geo;
	this.attachments = m.attachments || [];
	this.forwardedMessages = m.fwd_messages;
	this.randomId = m.random_id;
	this.isRead = !!m.read_state;
	this.isOut = !!m.out;
	this.isImportant = !!m.important;
	this.action = m.action;
	this.actionId = m.action_mid;
	this.actionText = m.action_text;

	this.photo_50 = m.photo_50;
	this.photo_100 = m.photo_100;
	this.photo_200 = m.photo_200;

	if (this.chatId && this.photo_50) {
		Mail.photosChats[this.chatId] = { p50: this.photo_50, p100: this.photo_100, p200: this.photo_200 };
	};
};

var APIDOG_DIALOG_PEER_USER = "u",
	APIDOG_DIALOG_PEER_CHAT = "c",
	APIDOG_DIALOG_PEER_GROUP = "g",
	APIDOG_DIALOG_PEER_CHAT_MAX_ID = 2000000000;

VKMessage.prototype = {

	getInfoFrom: function () {
		var f = this.peer, i = f[1], t;
		console.log(f);
		switch (f[0]) {
			case APIDOG_DIALOG_PEER_USER:
				t = Local.Users[i];
				return { photo: t.photo_100, name: getName(t) };

			case APIDOG_DIALOG_PEER_CHAT:
				return { photo: this.photo_100 || Mail.photosChats[this.chatId] && Mail.photosChats[this.chatId].p100, name: this.title };

			case APIDOG_DIALOG_PEER_GROUP:
				t = Local.Users[-i];
				return { photo: t.photo_100, name: t.name };
		};
		return {};
	},

	getDialogItemNode: function (o) {
		o = o || {};
		var e = $.e,
			unread = o.unread,

			fromId = this.peer.join(""),
			from = this.getInfoFrom();

		text = this.text.replace(/\n/g, " ").safe();
		text = text.length > 120 ? text.substring(0, 120) + "…" : text;
		text = Mail.Emoji(text);

		if (o.highlight) {
			text = text.replace(new RegExp("(" + o.highlight + ")", "igm"), "<span class='search-highlight'>$1<\/span>");
		};

		var link = e("a", {
			href: Mail.version && o.type != 3 ? "#im?to=" + fromId : "#mail?act=item&id=" + this.messageId,
			"id": Mail.version ? "mail-dialog" + fromId : "mail-message" + this.messageId,
			"class": [
				"selectfix clearfix dialogs-item",
				(!this.isOut && !this.isRead ? "dialogs-item-new" : ""),
				(this.peer[0] == APIDOG_DIALOG_PEER_CHAT ? "dialogs-chat" : "")
			].join(" "),
			append: [
				e("div", {
					"class": "dialogs-item-left",
					append: [
						e("img", {
							"class": "dialogs-left",
							src: from.photo ? getURL(from.photo) : Mail.defaultChatImage
						}),
						e("span", {
							"class": "dialogs-unread",
							id: "ml" + fromId, html: unread || ""
						})
					]
				}),
				e("div", {
					"class": "dialogs-item-right",
					append: [
						e("div", {
							"class": "dialogs-content",
							append: [
								e("div", {
									"class": "dialogs-head",
									append: [
										e("div", {"class": "dialogs-date", append: [
											this.isOut
												? e("div", {
													"class": "dialogs-state" + (this.isRead ? " dialogs-state-readed" : "")
												  })
												: null,
												document.createTextNode($.getDate(this.date, 2))
										]}),
										e("div", {"class": "dialogs-name cliptextfix", html: from.name.emoji()})
									]
								}),
								e("div", {
									"class": "n-f dialogs-text" + (this.isOut && !this.isRead ? " dialogs-new-message" : "") + (!this.isOut ? " dialogs-in" : ""),
									append: [
										e("div", {
											append: [
												e("span", {
													"class": "dialogs-minitext cliptextfix",
													html: !this.action
														? text
														: IM.getStringActionFromSystemVKMessage(this)
												})
											]
										}),
										e("div", {
											"class": "dialogs-attachments tip",
											html: this.getAttachmentNamesString()
										})
									]
								})
							]
						})
				]})
		]});
		var attach, fwd;
		if (attach = Mail.getAttach())
		{
			$.event.add(link, "click", function (event)
			{
				if (!IM.attachs[to])
					IM.attachs[to] = [];
				IM.attachs[to].push(attach);
			});
		};

		return link;
	},

	getAttachmentNamesString: function () {
		var m = this;

		if (!m.attachments && !m.geo && !m.fwd_messages) {
			return "";
		};

		var attachs = {
			photo: 0,
			video: 0,
			audio: 0,
			doc: 0,
			sticker: 0,
			map: 0,
			link: 0,
			wall: 0,
			forwarded: 0,
			wall_reply: 0,
			gift: 0
		},
		attachments = [];

		if (m.attachments) {
			m.attachments.forEach(function(item) {
				attachs[item.type]++;
			});
		};

		attachs.map = !!m.geo;
		attachs.forwarded = m.fwd_messages ? m.fwd_messages.length : 0;

		var c;
		for (var item in attachs) {
			c = attachs[item]
			if (c > 0) {
				attachments.push(c + " " + lg("mail.attachmentName_" + item, c));
			};
		};

		if (attachs.stickers) {
			attachments = lg("mail.attachmentName_sticker");
		};

		return attachments.join(", ");
	},

	getNode: function(o) {
		var i = this;
		IM.storage[this.messageId] = this;

		var peerId = this.peer;

		if (this.action)
			return this.getNodeAction(o);

		var e = $.e,
			self = this,
			u = Local.Users[this.fromId],
			isSticker = this.attachments && this.attachments[0] && this.attachments[0].type === "sticker",
			lc,

			node = e("tr", {
			"class": "imdialog-item imdialog-dialog" + peerId + " " + (this.isOut ? " imdialog-my" : "") + (isSticker ? " imdialog-item-sticker" : "") + (!this.isRead ? " imdialog-unread" : ""),
			"data-message-id": this.messageId || "",
			"data-message-random": this.randomId,
			id: "imdialog-message" + this.messageId || 0,
			append: [
				peerId < 0
					? e("td", {
						"class": "imdialog-photo",
						append: !this.isOut
							? e("a", {
								href: "#" + u.screen_name,
								append: e("img", {
									src: getURL(u.photo_50)
								}),
								title: u.first_name + " " + u.last_name
							  })
							: null
						})
					  : null,
				e("td", {
					append: e("div", {
						"class": "imdialog-wrap",
						append: [
							e("div", {"class": "imdialog-arrow"}),
							e("div", {"class": "imdialog-content", append: [
								e("a", {
									"class": "imdialog-time",
									href: "#mail?act=item&id=" + this.messageId,
									append: e("span", {html: IM.getTime(this.date)}),
									/*title: (function (a, b, c, d, e, g) {
								e = new Date(a * 1000);
								d.forEach(function (f) {
									g = b.push(e[c + f]());
									g === 2 ? (b[--g] += 1) : (g > 3 ? ((b[--g] = IM.n2(b[g]))) : null);
								});
								return b.slice(0, 3).join(".") + " " + b.slice(3).join(":");
							})(i.date, [], "get", ["Date", "Month", "FullYear", "Hours", "Minutes", "Seconds"]) : "",*/
									onclick: function(event) {
										if (!IM.getSelectedMessagesCount()) {
											return true;
										};

										event.preventDefault();
										event.stopPropagation();
										return false;
									}
								}),
								e("span", {
									"class": "n-f",
									html: Mail.Emoji(Site.Format(this.text))
								}),
								e("div", {
									id: "msg-attach" + this.messageId,
									append: this.getAttachments(this.attachments, this.messageId)
								}),
								/*this.getForwardedMessages(this.forwardedMessages),*/
								this.geo
									? this.getMap(this.geo)
									: null
							]})
						]
					})
				})
			]
		});

		$.event.add(node, "mousedown", function() {
			if (!this.getAttribute("data-message-id")) {
				return;
			};

			lc = +new Date();
		});

		$.event.add(node, "mouseup", function(event) {
			if (!this.getAttribute("data-message-id")) {
				return;
			};

			if (event.which == 1 && +new Date() - lc < 250) {
				self.select(event);
			}
		});

		return this.node = node;
	},

	getNodeAction: function() {
		var e = $.e,
			du = {
				first_name: "DELETED",
				last_name: "DELETED",
				first_name_gen: "DELETED",
				last_name_gen: "DELETED",
				first_name_acc: "DELETED",
				last_name_acc: "DELETED"
			},
			init = Local.Users[this.fromId] || du,
			action = Local.Users[this.actionId] || du,
			l = Lang.get,
			parent = e("td", {colspan: 2, "class": "imdialog-item-action"}),
			t = e("div", {"class": "imdialog-item-action-text"}),
			basis,
			act,
			html;
		switch (this.action) {
			case "chat_kick_user":
				basis = l("im.message_action_kick_source");
				act = l("im.message_action_kick");
				if (this.actionId == (this.fromId || this.userId)) {
					basis = l("im.message_action_leave_source");
					act = l("im.message_action_leave");
				};
				break;

			case "chat_invite_user":
			case "action_email":
				basis = l("im.message_action_invite_source");
				act = l("im.message_action_invite");
				if (this.actionId == (this.fromId || this.userId)) {
					basis = l("im.message_action_return_source");
					act = l("im.message_action_return");
				};
				break;

			case "chat_create":
				basis = l("im.message_action_create_source");
				act = l("im.message_action_create");
				break;

			case "chat_title_update":
				basis = l("im.message_action_title_update_source");
				act = l("im.message_action_title_update");
				break;

			case "chat_photo_update":
				basis = l("im.message_action_chat_photo_update_source");
				act = l("im.message_action_chat_photo_update");
				break;

			case "chat_photo_remove":
				basis = l("im.message_action_chat_photo_remove_source");
				act = l("im.message_action_chat_photo_remove");
				break;
		};
		html = basis.schema({
			"if": "<a href='#" + init.screen_name + "'>" + init.first_name.safe(),
			il: init.last_name.safe() + "</a>",
			af: "<a href='#" + action.screen_name + "'>" + action.first_name_acc.safe(),
			al: action.last_name_acc.safe() + "</a>",
			a: act[init.sex],
			u: "",
			t: "<strong>" + Mail.Emoji(this.actionText.safe()) + "</strong>"
		});
		t.innerHTML = html;
		parent.appendChild(t);
		return e("tr", {append: parent});
	},

	getAttachments: function() {
		var objects = this.attachments,
			msgId = this.messageId,
			parent = $.e("div"),
			item,
			o,
			datas = {
				p: [],
				v: [],
				a: [],
				d: [],
				l: null,
				g: null,
				s: null,
				w: [],
				r: null,
				c: null
			};
		parent.className = "imdialog-item-attachments";

		var audioIdList = (+new Date());
		Audios.Lists[audioIdList] = [];

		for (item in objects) {
			item = objects[item];
			o = item[item.type];

			switch (item.type) {
				case "photo":
					datas.p.push(IM.getDynamicPhotoAttachment(o, msgId));
					break;
				case "video":
					datas.v.push(Video.getAttachment(o, {from: true}));
					break;
				case "audio":
					datas.a.push(Audios.Item(o, {lid: Audios.createList([o])}));
					break;
				case "doc":
					datas.d.push(Docs.getAttachment(o));
					break;
				case "link":
					datas.l = Site.getLinkAttachment(o);
					break;
				case "gift":
					datas.g = Gifts.getAttachment(o);
					break;
				case "sticker":
					datas.s = Site.getStickerAttachment(o);
					break;
				case "wall":
					datas.w.push(Wall.getMessageAttachment(o));
					break;
				case "wall_reply":
					datas.r = Wall.getAttachmentReply(o.owner_id, o.post_id, o.id);
					break;
				case "chronicle":
					datas.c = IM.getChronicleItem(o);
					break;
				default:
					continue;
			}

		}

		/*if (datas.p.length) {
			Photos.lists["mail" + msgId] = (function (a) {
				for (var b = 0, c = a.length, d = []; b < c; ++b)
					if (a[b].type == "photo") {
						a[b].photo.list = "mail" + msgId;
						d.push(a[b].photo);
					}
				return d;
			})(objects);
		}

		datas.p = datas.p.length ? (function (e, p) {
			for (var i = 0, l = p.length; i < l; ++i)
				e.appendChild(p[i]);
			return e;
		})($.e("div", {"class": "__dynamic_photo_wrap"}), datas.p) : [];*/
		var attachments = (function (a, b) {
			for (var c in a) {
				if ($.isArray(a[c]))
					for (var d = 0, e = a[c].length; d < e; ++d)
						b.push(a[c][d]);
				else
					b.push(a[c]);
			}
			return b;
		})(datas, []);
		attachments.forEach(function (item) {
			if (!item) return;
			$.event.add(item, "mouseup", function (event) {
				event.cancelBubble = true;
				event.stopPropagation();
			});
		});
		/*if (datas.p && datas.p.children && datas.p.children.length === 1)
			datas.p.style.width = "100%";*/
		$.elements.append(parent, attachments);
		return parent;
	},

	select: function() {
		if (this.node.firstChild && this.node.firstChild.className == "__mail-deleted") {
			return;
		};

		$.elements.toggleClass(this.node, VKMessage.CLASS_SELECTED);
		var count = IM.getSelectedMessagesCount();
		if (count < 100) {

			var actions = $.element("imdialog-actions");
			if (count > 0) {
				$.elements.removeClass(actions, "hidden");
				$.elements.addClass($.element("im-typing-wrap"), "hidden");
			} else {
				$.elements.addClass(actions, "hidden");
				$.elements.removeClass($.element("im-typing-wrap"), "hidden");
			}
		} else {
			$.elements.removeClass(this, VKMessage.CLASS_SELECTED);
			Site.Alert({text: Lang.get("im.warning_select_no_more_than_100_messages")});
		};
	}

};

VKMessage.CLASS_SELECTED = "imdialog-selected";

VKMessage.send = function(options) {
	$.localStorage("im_text_" + options.peerId, "");
	console.log(options)
	new APIRequest("messages.send", {
		peerId: toPeerId(options.peerId),
		message: options.text,
		attachment: options.attachments,
		random_id: random(1, 9999999),
		v: 5.52
	}).setOnCompleteListener(function(result) {
		var messageId = result;
		console.log("SENT MESSAGE: " + messageId);
		// TODO: notify about new msg
	}).setOnErrorListener(function(error) {
		console.log("ERROR WHILE SENDING MESSAGE: ", error);
	}).execute();
};

function getPeerByMessage(msg) {
	var id = msg.userId;
	return isNaN(msg)
		? id < 0
			? ["g", -id]
			: msg.chatId
				? ["c", msg.chatId]
				: ["u", id]
			: msg < 0
				? ["g", -msg]
				: msg >= 2000000000
					? ["c", 2000000000 - msg]
					: ["u", msg];
};

// 123 -> [u, 123], -123 -> [g, 123], 2000000123 => [c, 123]
function getPeer(id) {
	return inRange(-APIDOG_DIALOG_PEER_CHAT_MAX_ID, id, 0)
		? ["g", -id]
		: inRange(0, id, APIDOG_DIALOG_PEER_CHAT_MAX_ID)
			? ["u", id]
			: id > APIDOG_DIALOG_PEER_CHAT_MAX_ID
				? ["c", id - APIDOG_DIALOG_PEER_CHAT_MAX_ID]
				: ["e", -(id - APIDOG_DIALOG_PEER_CHAT_MAX_ID)];
};

// 123 -> u123, -123 -> g123, 2000000123 => c123
function getPeerId(id) {
	return getPeer(id).join("");
};

// u123 -> [u, 123], g123 -> [g, 123], c123 => 123
function parsePeer (pId) { // u123 -> [u, 123]
	return [pId[0], parseInt(pId.substring(1))];
};

// [u, 123] -> 123, [g, 123] -> -123, [c, 123] -> 2000000123
// u123 -> 123
function toPeerId (peer) {
	var t = peer[0];
	peer = parseInt(Array.isArray(peer) ? peer[1] : peer.substring(1));
	return {
		u: peer,
		g: -peer,
		c: 2000000000 + peer
	}[t];
};

// [u, 123] -> 123, [g,123] -> -123, [c,123] -> 2000000123
function toPeer(peer) {
	return toPeerId(peer.join(""));
};

function getObjectByPeer (peer) {
	switch (peer[0]) {
		case APIDOG_DIALOG_PEER_USER: return Local.Users[peer[1]];
		case APIDOG_DIALOG_PEER_CHAT: return IM.chats[peer[1]];
		case APIDOG_DIALOG_PEER_GROUP: return Local.Users[-peer[1]];
		default: return null;
	};
};

var Mail = {

	version: 1, // 1 - dialogs, 0 - messages

	explain: function() {
		switch (getAct()) {
			case "item":
				return Mail.getMessageById(+Site.Get("id"));

			case "search":
				return Mail.search.page();

			case "chat":
				return Mail.createChat();

			default:

				var type = +Site.Get("type") || 0;
				if (Mail.version && type != 3)
					return Mail.showDialogs(0);
				else
					return Mail.getListMessages(type);
		};
	},


	/**
	 * Загрузка списка сообщений
	 * 15.01.2016: добавлена поддержка сообщений от групп
	 * @param  {int}      offset   Сдвиг
	 * @param  {Function} callback Функция-обработчик
	 */
	loadDialogs: function(offset, callback) {
		new APIRequest("execute", {
			code: 'var m=API.messages.getDialogs({count:40,offset:Args.o,preview_length:120,v:5.52}),q=m.items,w,i=0,l=q.length,g=[];while(i<l){w=q[i].message;if(w.user_id<0){g.push(-w.user_id);};i=i+1;};return{counters:API.account.getCounters(),dialogs:m,users:API.users.get({user_ids:m.items@.message@.user_id+m.items@.message@.source_mid,fields:"photo_100,online,sex"}),groups:API.groups.getById({group_ids:g})};',
			o: offset
		}).setOnCompleteListener(function(data) {

			Local.add(data.users);
			Local.add(data.groups);
			Site.setCounters(data.counters);

			callback(data.dialogs.items.map(function(dialog) {
				return new VKDialog(dialog);
			}), data.dialogs.count);

		}).execute();
	},

	/**
	 * Функция загрузки и отображения диалогов
	 * 15.01.2016: добавлены обработчики onNewMessageReceived и onMessageReaded
	 */
	showDialogs: function() {

		var e = $.e,
			head,
			headCount = e("span", {html: "Loading..."}),
			headActions = Mail.getActions(), // TODO
			list,
			wrap = e("div", { append: [
				head = Site.getPageHeader(headCount, headActions),
				list = e("div", { id: "g-mail-list", "class": "g-loading", append: getLoader() })
			]}),

			currentOffset = 0,
			isEnd = false,
			isLoading = false,

			load = function() {
				isLoading = true;
				Mail.loadDialogs(currentOffset, function(items, count) {

					if (!currentOffset) {
						$.elements.clearChild(list);
					};

					isLoading = false;
					currentOffset += items.length;
					isEnd = currentOffset >= count;

					items.forEach(function(dialog) {
						list.appendChild(dialog.getNode());
					});
					headCount.innerHTML = count + " " + lg("mail.dialogs", count);
				});
			};

		window.onScrollCallback = function(event) {
			if (event.needLoading && !isLoading) {
				load();
			};
		};

		load();

		Site.append(wrap).setHeader(lg("mail.headTitle"));
/*
		window.onNewMessageReceived = function (message) {
			var from = getPeer(message).join(""),
				item = $.element("mail-dialog" + from),
				unreadCount = $.element("ml" + from) && +$.element("ml" + from).innerHTML || 0,
				parentNode;

			if (item) {
				parentNode = item.parentNode;
				$.elements.remove(item);
			} else {
				parentNode = $.element("mail-list");
			};
			if (!message.isOut) {
				unreadCount++;
			};

			IM.dialogsContent[from] ? IM.dialogsContent[from].unshift(message.messageId) : (IM.dialogsContent[from] = [message.messageId]);

			parentNode.insertBefore(message.getDialogItemNode({unread: unreadCount}), parentNode.firstChild);
		};

		window.onMessageReaded = function (messageId, peerId) {
			var p = getPeer(peerId).join("");
			$.elements.addClass(document.querySelector("#mail-dialog" + p + " .dialogs-state"), "dialogs-state-readed");
			$.elements.removeClass($.element("mail-dialog" + p), "dialogs-item-new");
			$.element("ml" + p).innerHTML = "";
		};*/
/*
		for (var i = 0, l = dialogs.length; i < l; ++i) {
			list.appendChild(Mail.item(dialogs[i]));
		};

		if (offset + dialogs.length + 50 < count + 50) {
			list.appendChild(Site.CreateNextButton({
				link: "#mail",
				text: Lang.get("im.next"),
				click: function (event) {
					$.event.cancel(event);
					if (this.disabled) return;
					Mail.getDialogs(offset + 40, this);
					this.disabled = true;
				}
			}));
		};

		if (!offset) {
			page.appendChild(Mail.getListMessagesTabs());
			page.appendChild(Site.CreateHeader(count + " " + Lang.get("mail", "dialogs", count), Mail.getActions()));
		};
		page.appendChild(list);
		Site.setCounters(counters);
		Site.SetHeader(Lang.get("mail.dialogs_noun"));

		if (!offset) {
			$.elements.clearChild(wrap);
		};

		wrap.appendChild(page);
*/
	},

	item: function (i, o) {

		return new VKMessage(i).getDialogItemNode(o);


	/*	var e = $.e,
			unread,
			user,
			to,
			text,
			delNode,
			cancelTap = false;
		o = o || {};
		unread = i.unread || o.unread || null;
		if (Mail.version && i.message)
			i = i.message;
		user = i.user_id > 0 ? Local.Users[i.user_id] : {last_name: "", first_name: ""};
		to = (i.chat_id ? -i.chat_id : i.user_id);

		if (to < 0 && i.photo_50)
			Mail.photosChats[to] = i.photo_50;

		i.photo_50 = i.photo_50 || Mail.photosChats[to];
		text = Site.Escape(i.body.replace(/\n/g, " ").replace(/\n/ig, " \\ "));
		text = text.length > 120 ? text.substring(0, 120) + ".." : text;
		text = Mail.Emoji(text);
		if (o.highlight)
			text = text.replace(new RegExp("(" + o.highlight + ")", "igm"), "<span class='search-highlight'>$1<\/span>");
		var link = e("a", {
			"href": Mail.version && Site.Get("type") != 3 ? "#im?to=" + to : "#mail?act=item&id=" + i.id,
			"data-count": parseInt(i.unread) || 0,
			"id": Mail.version ? "mail-dialog" + to : "mail-message" + i.id,
			"class": "selectfix dialogs-item" + (!i.out && !i.read_state ? " dialogs-item-new" : ""),
			append: e("div", {"class": "dialogs-item-wrap", append: [e("div", {style: "overflow: hidden;", append: [
				e("div", {"class": "dialogs-date", append: [
					i.out ? e("div", {"class": "dialogs-state" + (i.read_state ? " dialogs-state-readed" : "")}) : null,
					document.createTextNode($.getDate(i.date, 2))
				]}),
				e("img", {"class": "dialogs-left", src: (to < 0 ? (getURL(i.photo_50) || Mail.defaultChatImage) : getURL(user.photo_50))}),
				e("div", {"class": "dialogs-right", append: e("div", {append: [
					e("span", {"class": "tip", html: (to < 0 ? Lang.get("mail.chat_noun") : "")}),
					e("strong",{html: (to > 0 ? Site.Escape(user.first_name + " " + user.last_name) + " " + Site.isOnline(user) : Mail.Emoji(Site.Escape(i.title)))}),
					e("div", {"class": "n-f dialogs-text" + (i.out && !i.read_state ? " dialogs-new-message" : "") + (!i.out ? " dialogs-in" : ""), append:[
						e("div", {
							append: [
								e("span", {"class": "dialogs-unread", id: "ml" + to, html: unread || ""}),
								(i.out ? e("img", {src: getURL(API.photo_rec), "class": "dialogs-miniphoto"}) : null),
								e("span", {html: (user && to < 0 ? user.first_name + " " + user.last_name[0] + ".: " : "") + (!i.action ? text : IM.getStringActionFromSystemVKMessage(i))})
							]
						}),
						e("div", {"class": "dialogs-attachments tip", html: Mail.getStringAttachments(i)})
					]})
				]}) }) ]}),

			]})
		});
		var attach, fwd;
		if (attach = Mail.getAttach())
		{
			$.event.add(link, "click", function (event)
			{
				if (!IM.attachs[to])
					IM.attachs[to] = [];
				IM.attachs[to].push(attach);
			});
		};

		return link;*/
	},

	getAttach: function () {
		var a = String(Site.Get("attach")), b = /(photo|video|audio|doc|wall)(-?\d+)_(\d+)(_([\da-fA-F]+))?/img.exec(a), c = parseInt;
		return !b ? false : [b[1], c(b[2]), c(b[3]), b[5]];
	},

	// using in sticker-panel
	setTransform: function (node, value) {
		node.style.webkitTransform = value;
		node.style.mozTransform = value;
		node.style.msTransform = value;
		node.style.oTransform = value;
		node.style.transform = value;
	},

	DIALOGS_NODE_CLASS_ANIMATION_ON_SWIPE: "dialogs-item-swpiped",

	getRootItemNode: function (node) {
		var found;
		while (node.tagName.toLowerCase() != "a") {
			node = node.parentNode;
		}
		return node.firstChild;
	},

	defaultChatImage: "\/\/static.apidog.ru\/multichat-icon50.png",

	Emoji: function(a){return String(a).emoji()},



	EmojiOld: function (text)
	{
		return text.replace(/([\uE000-\uF8FF\u270A-\u2764\u2122\u25C0\u25FB-\u25FE\u2615\u263a\u2648-\u2653\u2660-\u2668\u267B\u267F\u2693\u261d\u26A0-\u26FA\u2708]|\uD83C[\uDC00-\uDFFF]|[\u2600\u26C4\u26BE\u23F3\u2764]|\uD83D[\uDC00-\uDFFF]|\uD83C[\uDDE8-\uDDFA]\uD83C[\uDDEA-\uDDFA]|[0-9]\u20e3)/g,
			function (symbol)
		{
			var i = 0,
				code = "",
				num;
			while (num = symbol.charCodeAt(i++))
			{
				if (i == 2 && num == 8419)
				{
					code = "003" + symbol.charAt(0) + "20E3";
					break;
				};
				code += num.toString(16);
			};
			code = code.toUpperCase();
			return (API.SettingsBitmask & 4 ? Mail.defaultEmojiTemplateProxy : Mail.defaultEmojiTemplate)
				.replace(/%c/g, code)
				.replace(/%s/g, symbol);
		}).replace(/\uFE0F/g, "");
	},


	getActions: function () {
		var p = {};

		p["readAll"] = {
			label: lg("mail.actionReadAll"),
			onclick: function(item) {
				var modal = new Modal({
					width: 395,
					title: lg("mail.readAllConfirmTitle"),
					content: lg("mail.readAllConfirmText"),
					footer: [
						{
							name: "yes",
							title: lg("general.yes"),
							onclick: function () {
								this.close();
								Mail.requestReadAll();
							}
						},
						{
							name: "close",
							title: lg("general.no"),
							onclick: function () {
								this.close();
							}
						}
					]
				}).show(item.node());
			}
		};

		p["createChat"] = {
			label: lg("mail.actionCreateChat"),
			isDisabled: true,
			onclick: function() {
				alert("not implemented yet!");
			}
		};




/*		p[Lang.get(Mail.version ? "mail.actionSwitch2messages" : "mail.actionSwitch2dialogs")] = function (event) {
			Mail.version = +!Mail.version;
			Mail.explain();
		};*/


		/*p[("!<input type=\"checkbox\" %s onchange='Mail.setAutoRead(this);' \/><span> " + Lang.get("settings.param_autoread") + "<\/span>").replace(/%s/ig, API.SettingsBitmask & 2 ? "checked" : "")] = function (event) {event.stopPropagation()};*/
		return new DropDownMenu(lg("general.actions"), p).getNode();
	},

	/**
	 * @deprecated
	 * @param {DOMNode} node ?
	 */
	/*setAutoRead: function (node) {
		API.SettingsBitmask += node.checked ? (API.SettingsBitmask & 2 ? 0 : 2) : (API.SettingsBitmask & 2 ? -2 : 0);
		Settings.fastSaveSettings(API.SettingsBitmask);
	},*/

	photosChats: {},

	requestReadAll: function (readed) {
		new APIRequest("execute", {
			code: 'var m=API.messages.getDialogs({unread:1,count:19,v:5.16}),c=m.count,i=0,m=m.items,q;while(i<m.length){if(m[i].message.chat_id){q={peer_id:2000000000+m[i].message.chat_id};}else{q={peer_id:m[i].message.user_id};};API.messages.markAsRead(q);i=i+1;};return{n:c-19,r:Args.r+i};',
			r: (readed || 0)
		}).setOnCompleteListener(function(data) {
			if (data.n > 0) {
				return Mail.requestReadAll(data.r);
			};

			data = data.r;

			if (isNaN(data)) {
				return;
			};


			new Snackbar({text: data + " " + lg("mail.readAllReadReady", data)}).show();
		}).execute()
	},

	deletedMessage: false,

	getListMessages: function (type) {
		var params = [
				'"out":0', // inbox
				'"out":1', // outbox
				'"out":0,"filters":1', // new
				'"filters":8' // important
			][type],
			offset = +Site.Get("offset");
		Site.API("execute", {
			code: 'var m=API.messages.get({preview_length:110,count:40,v:5.8,offset:%o%,%r%});return {mail:m,users:API.users.get({user_ids:m.items@.user_id,v:5.8,fields:"photo_50,online,screen_name,sex"})};'
				.replace(/%o%/ig, offset)
				.replace(/%r%/ig, params)
		}, function (data) {
			data = Site.isResponse(data);
			Local.AddUsers(data.users);
			Mail.showListMessages(data.mail, {type: type});
		});
	},

	getListMessagesTabs: function () {
		return Site.CreateTabPanel(!Mail.version ? [
			["mail", Lang.get("mail.tabs_inbox")],
			["mail?type=1", Lang.get("mail.tabs_outbox")],
			["mail?type=2", Lang.get("mail.tabs_new")],
			["mail?type=3", Lang.get("mail.tabs_important")],
			["mail?act=search", Lang.get("mail.tabs_search")],
			["analyzes", "Анализатор"]
		] : [
			["mail", Lang.get("mail.tabs_dialogs")],
			["mail?type=3", Lang.get("mail.tabs_important")],
			["mail?act=search", Lang.get("mail.tabs_search")],
			["analyzes", "Анализатор"]
		]);
	},

	showListMessages: function (data, options) {
		options = options || {};
		var parent = document.createElement("div"),
			list = document.createElement("div"),
			count = data.count,
			items = data.items;

		list.id = "mail-list";

		parent.appendChild(Mail.getListMessagesTabs());

		var words = Lang.get("mail.types_messages");

		parent.appendChild(Site.CreateHeader(formatNumber(count) + " " + $.TextCase(count, words[options.type]), Mail.getActions()));

		if (Mail.deletedMessage) {
			var deleted_message_id = Mail.deletedMessage, notification;
			list.appendChild(notification = $.elements.create("div", {"class": "photo-deleted", append: [
				document.createTextNode(Lang.get("mail.message_id_deleted").replace(/%i%/ig, deleted_message_id)),
				$.elements.create("span", {"class": "a", html: Lang.get("mail.message_restore"), onclick: function (event) {
					Site.API("messages.restore", {message_id: deleted_message_id}, function (data) {
						if (!data.response)
							return Site.Alert({text: Lang.get("mail.failed_restore")});
						$.elements.remove(notification);
						Site.Alert({text: Lang.get("mail.success_restore"), click: function (event) {
							window.location.hash = "#mail?act=item&id=" + deleted_message_id;
						}})
					});
				}})
			]}))
			Mail.deletedMessage = false;
		}

		if (count)
			for (var i = 0, l = items.length; i < l; ++i)
				list.appendChild(Mail.item(items[i], {}));
		else
			list.appendChild(Site.EmptyField(Lang.get("mail.you_havent") + (Lang.get("mail.you_havent_by_types")[options.type])))

		parent.appendChild(list);
		parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 40));

		Site.Append(parent);
		Site.SetHeader(Lang.get("mail.messages"));
	},

	getMessageById: function (data) {
		if (typeof data === "number") {
			var parent = arguments.callee;
			return Site.API("execute", {
				code: 'var m=API.messages.getById({message_ids:%i%,v:5.8}).items[0],i=(m.fwd_messages@.user_id);i.push(m.user_id);var u=API.users.get({user_ids:i,fields:"%f%",v:5.8});%r%return {message:m,users:u};'
					.replace(/%i%/ig, data)
					.replace(/%f%/ig, "photo_50,screen_name,online,can_write_private_message,first_name_gen,last_name_gen,sex")
					.replace(/%r%/ig, API.SettingsBitmask & 2 ? "API.messages.markAsRead({message_ids:m.id});" : ""),
			}, function (data) {
				data = Site.isResponse(data);

				Local.AddUsers(data.users);

				parent(data.message);
			})
		}
		var parent = document.createElement("div"),
			to = data.chat_id ? -data.chat_id : data.user_id,
			message_id = data.id,
			actions = {
				openDialog: function (event) {
					Mail.findOffsetByMessageId(message_id, Math.abs(to), data.chat_id ? "chat_id" : "user_id", function (offset) {
						window.location.hash = "#im?to=" + to + "&force=1&offset=" + offset + "&messageId=" + message_id;
					});
				},
				forwardMessage: function (event) {
					IM.forwardMessagesIds = [message_id];
					window.location.hash = "#mail";
				},
				markAsImportant: function (event) {
					var field = this;
					Site.API("messages.markAsImportant", {
						message_ids: message_id,
						important: +!data.important
					}, function (result) {
						if (!result.response)
							return;
						Site.Alert({text: Lang.get("mail.message_success_marked_as") + (!data.important ? Lang.get("mail.message_important") : Lang.get("mail.message_unimportant"))});
						data.important = !data.important;
						field.value = data.important ? Lang.get("mail.mark_as_unimportant") : Lang.get("mail.mark_as_important");
					});
				},
				deleteMessage: function (event) {
					if (!confirm(Lang.get("mail.confirm_delete_message")))
						return;

					Site.API("messages.delete", {message_ids: message_id}, function (data) {
						if (!data.response)
							return;

						Site.Alert({text: Lang.get("mail.success_deleted")});
						Mail.deletedMessage = message_id;
						window.location.hash = "#mail" + (data.out ? "?type=1" : "");
					})
				}
			},
			e = $.elements.create,
			user = Local.Users[data.user_id];

		parent.appendChild(Site.CreateHeader(Lang.get("mail.message_id") + message_id));

		parent.appendChild(e("div", {"class": "friends-item", append: [
			e("img", {"class": "friends-left", src: getURL(user.photo_50)}),
			e("div", {"class": "mail-head friends-right", append: [
				e("div", {html: (data.out && to > 0 ? Lang.get("mail.message_for") + " <a href='#" + user.screen_name + "'>" + user.first_name_gen + " "+user.last_name_gen + Site.isOnline(user) + "<\/a>" : (to > 0 ? Lang.get("mail.message_from") + " <a href='#" + user.screen_name + "'>" + user.first_name_gen + " " + user.last_name_gen + Site.isOnline(user) + "<\/a>" : Lang.get("mail.message_from_chat") + " &laquo;" + data.title + "&raquo; " + Lang.get("mail.message_from_chat_from") + " <a href='#" + user.screen_name + "'>" + user.first_name_gen + " " + user.last_name_gen + Site.isOnline(user) + "<\/a>"))}),
						e("div", {"class": "tip", html: $.getDate(data.date)})
					]})
				]
			}));

		var text = e("div",{"class": "n-f", html: Mail.Emoji(Site.Format(Site.Escape(data.body)))});
		text.style.whiteSpace = "";
		parent.appendChild(e("div", {"class": "mail-content-item", append: [
			text,
			Site.Attachment(data.attachments, "mail" + message_id),
			IM.forwardedMessages(data.fwd_messages)
		]}));
		actions = [
			[actions.openDialog, Lang.get("mail.message_open_dialog")],
			[actions.forwardMessage, Lang.get("mail.message_forward")],
			[actions.markAsImportant, Lang.get("mail.message_mark") + (!data.important ? Lang.get("mail.message_important") : Lang.get("mail.message_unimportant"))],
			[actions.deleteMessage, Lang.get("mail.message_delete")]
		];
		for (var i = 0, l = actions.length; i < l; ++i) {
			actions[i] = e("input", {type: "button", value: actions[i][1], onclick: actions[i][0]});
		}
		parent.appendChild(e("div", {"class": "mail-actions", append: actions}));
		parent.appendChild(Site.CreateHeader("Ответить"));
		parent.appendChild(Site.CreateWriteForm({
			nohead: true,
			ctrlEnter: true,
			name: "message",
			allowAttachments: 30,
			onsubmit: function (event) {
				var text = $.trim(this.message.value),
					attachments = $.trim(this.message.value),
					field = this.message;
				if(!text) {
					Site.Alert({
						text: "Введите сообщение!",
						click: function (event) {
							field.focus();
						}
					});
					return false;
				}
				var opts = {message: text, attachments: attachments};
				if (to > 0)
					opts.user_id = to;
				else
					opts.chat_id = -to;
				Site.API("messages.send", opts, function (data) {
					if (data.response) {
						window.location.hash="#mail";
						Site.Alert({text: "Сообщение успешно отправлено!"});
					}
				});
				return false;
			}
		}, 0, 0));

		Site.SetHeader(Lang.get("mail.message"), {link: "mail" + (data.out ? "?type=1" : "")});
		Site.Append(parent);
	},

	search: {
		page: function () {
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				e = $.elements.create, q;

			if (q = Site.Get("q")) {
				Mail.search.onSubmit(q, Site.Get("type"));
			};


			list.id = "__mail-search-list";
			parent.appendChild(Mail.getListMessagesTabs());
			parent.appendChild(Site.CreateHeader(Lang.get("mail.search"), e("span", {id: "__mail-search-count", "class": "fr"})));
			parent.appendChild(Mail.search.getForm());
			parent.appendChild(list);
			Site.Append(parent);
			Site.SetHeader(Lang.get("mail.search"));
		},
		form: null,
		getForm: function () {
			if (Mail.search.form)
				return Mail.search.form;

			var form = Site.CreateInlineForm({
					type: "search",
					name: "q",
					value: decodeURIComponent(Site.Get("q") || ""),
					placeholder: Lang.get("mail.search_query"),
					title: Lang.get("mail.search"),
					onsubmit: function (event) {
						event.preventDefault();
						window.location.hash = "#mail?act=search&type=" + this.where.options[this.where.selectedIndex].value + "&q=" + encodeURIComponent(this.q.value.trim());
						return false;
					}
				}),
				e = $.elements.create;
			form.appendChild(e("div", {"class": "sf-wrap", append: [
				e("select", {name: "where", append: [
					e("option", {value: 1, html: Lang.get("mail.search_by_dialogs")}),
					e("option", {value: 0, html: Lang.get("mail.search_by_messages"), selected: true})
				]})
			]}));
			return Mail.search.form = form;
		},
		onSubmit: function (q, type) {
			Site.API(
				["execute", "messages.searchDialogs"][type],
				[{
					code: 'var m=API.messages.search({q:"%q%",preview_length:120,count:40,offset:%o%,v:5.8});return {messages:m,users:API.users.get({user_ids:m.items@.user_id,fields:"%f%",v:5.8})};'
						.replace(/%q%/ig, decodeURIComponent(q))
						.replace(/%o%/ig, +Site.Get("offset"))
						.replace(/%f%/ig, "photo_50,online,screen_name")
				}, {
					q: decodeURIComponent(q),
					limit: 16,
					fields: "photo_50,online,screen_name,sex",
					v: 5.8
				}][type],
				function (data) {
					Mail.search.getResult(data.response, type, {q: q})
				}
			)

			return false;
		},
		getResult: function (data, type, options) {
			options = options || {};
			if (!data) {
				return Site.Alert({text: Lang.get("mail.unknown_error")});
			}
			if (type == 0) {
				Local.AddUsers(data.users);
				data = data.messages;
			}
			var item = [
				function (i) {
					var node = Mail.item(i, {highlight: options.q});
					node.href = "#mail?act=item&id=" + i.id;
					return node;
				}, function (i) {
					console.log(i);
					var e = $.elements.create;
					return e("a", {"class": "miniprofiles-item", href: "#im?to=" + (i.admin_id ? -i.id : i.id), append: [
						e("img", {"class": "miniprofiles-left", src: i.photo_50 ? getURL(i.photo_50) : Mail.DEFAULT_CHAT_IMAGE}),
						e("div", {"class": "miniprofiles-right", html: {profile: i.first_name + " " + i.last_name + Site.isOnline(i), chat: i.title, email: i.email}[i.type]})
					]})
				}][type],
				founded = document.createElement("div"),
				items = [data.items, data][type];

			for (var i = 0, l = items.length; i < l; ++i)
				founded.appendChild(item(items[i]));

			$.element("__mail-search-count").innerHTML = data.count ? Lang.get("mail.search_founded") + data.count + " " + $.TextCase(data.count, Lang.get("mail.search_messages")) : "";
			var list = $.element("__mail-search-list");
			$.elements.clearChild(list);
			list.appendChild(founded);
			if (data.count)
				list.appendChild(Site.PagebarV2(Site.Get("offset"), data.count, 40));
		}
	},

	findOffsetByMessageId: function (messageId, peerId, peerType, callback) {
		var offset = 0,
			isFound = false,
			code,
			active = true,
			stoppedByUser = false,
			modal = new Modal({
				title: "Поиск сообщения..",
				content: "Ищу место в диалоге, это может занять некоторое время..",
				footer: [
					{
						name: "cancel",
						title: "Отмена",
						onclick: function () {
							cancel();
							modal.close();
						}
					}
				]
			}).show(),
			request = function () {
				code = "var o=%o,i=0,l=25,d=[],s=200;while(i<l){d=d+API.messages.getHistory({%t:%p,offset:o+(s*i),count:s,v:5.28}).items@.id;i=i+1;};return d;".schema({t: peerType, o: offset, i: messageId, p: peerId});
				console.log(code);
				Site.API("execute", {
					code: code
				}, function (data) {
					data = Site.isResponse(data);

					for (var i = 0, l = data.length; i < l; ++i) {
						if (data[i] == messageId) {
							onFound(offset + i);
							break;
						};
					};

					if (data.length != 0) {
						if (active) {
							offset += data.length;
							setTimeout(request, 350);
						} else if (!stoppedByUser) {
							modal
								.setTitle("Хм..")
								.setContent("Странно.. Сообщение не нашлось в этом диалоге")
								.setButton("cancel", {
									name: "close",
									title: "Закрыть",
									onclick: function () { modal.close() }
								});
						};
					};
				});
			},
			cancel = function () {
				active = false;
				stoppedByUser = true;
				modal.close();
			},
			onFound = function (offset) {
				if (stoppedByUser) return;
				active = false;
				isFound = true;
				modal.close();
				callback(parseInt(offset / 50) * 50);
			};
		request();
	},


	DEFAULT_CHAT_IMAGE: "\/\/static.apidog.ru\/multichat-icon50.png",

	getMaterialLoader: function (o)
	{
		o = o || {};
		var e = $.e, node;
		node = e("div",
		{
			"class": "loader-wrap",
			append: e("div",
			{
				"class": "md",
				style: "margin: 0 auto 10px;",
				append: e("div",
				{
					"class": "md-spinner-wrapper",
					append: e("div",
					{
						"class": "md-inner",
						append: [
							e("div", {"class": "md-gap"}),
							e("div", {"class": "md-left", append: e("div", {"class": "md-half-circle"})}),
							e("div", {"class": "md-right", append: e("div", {"class": "md-half-circle"})})
						]
					})
				})
			})
		});
		return o.wrapClass ? e("div", {"class": o.wrapClass, append: node}) : node;
	},

	createChat: function () {

		if (!Friends.friends[API.uid]) {
			Site.APIv5("friends.get", {
				fields: "online,photo_50,sex,bdate,screen_name,can_write_private_message,city,country",
				v: 5.8,
				order: "hints"
			}, function (data) {
				data = Site.isResponse(data);
				Friends.friends[API.uid] = data;
				Mail.createChat();
			});
			return;
		}

		var e = $.e,
			parent = e("div"),
			form = e("form", {onsubmit: Mail.onSubmitCreateChat}),
			title = e("div", {"class": "sf-wrap"}),
			status = e("div", {"class": "tip tip-form"}),
			creater = e("input", {
				type: "submit",
				value: Lang.get("mail.create_creator"),
				"class": "mail-create-btn",
				disabled: true
			}),
			selected = 0,
			setStatus = function () {
				creater.disabled = (selected <= 1 || !$.trim(name.value));
				status.innerHTML = Lang.get("mail", "create_status", selected).replace(/%n/img, selected);
			},
			name = e("input", {type: "text", required: true, name: "title", onkeyup: setStatus}),
			item = function (item) {
				return e("label", {
					"class": "miniprofiles-item",
					onclick: function (event) {
						var check = form.querySelectorAll("input[type=checkbox]:checked");
						selected = check.length;
						if (selected >= 30)
							$.event.cancel(event);
						if (this.querySelector("input[type=checkbox]").checked)
							$.elements.addClass(this, "mp-checked");
						else
							$.elements.removeClass(this, "mp-checked");
						setStatus();
					},
					append: [
						e("img", {"class": "miniprofiles-left", src: getURL(item.photo_50 || item.photo_rec)}),
						e("div", {"class": "_checkbox fr"}),
						e("input", {"class": "multiple_friends hidden", type: "checkbox", name: "items[]", value: item.id || item.uid}),
						e("div", {"class": "miniprofiles-right", append: e("strong", {
							append: e("a", {
								href: "#" + (item.screen_name || "id" + (item.id || item.uid)),
								onclick: function (event) { $.event.cancel (event) },
								html: item.first_name + " " + item.last_name
							})
						})})
					]
				})
			},
			list = e("div");

		title.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("mail.create_title")}));
		title.appendChild(name);
		title.appendChild(creater);
		title.appendChild(status);

		for (var i = 0, f = Friends.friends[API.uid].items, l = f.length; i < l; ++i)
			list.appendChild(item(f[i]));

		form.appendChild(title);
		form.appendChild(list);
		parent.appendChild(Site.CreateHeader(Lang.get("mail.create_header")))
		parent.appendChild(form);
		Site.Append(parent);
		Site.SetHeader(Lang.get("mail.create_header"), {link: "mail"});
		setStatus();
	},

	onSubmitCreateChat: function (event) {
		$.event.cancel(event);

		var title = $.trim(this.title.value),
			checked = this.querySelectorAll("input[type=checkbox]:checked"),
			userIds = [];

		for (var i = 0, l = checked.length > 30 ? 30 : checked.length; i < l; ++i)
			userIds.push(checked[i].value);

		userIds = userIds.join(",");

		Site.API("messages.createChat", {title: title, user_ids: userIds}, function (data) {
			data = Site.isResponse(data);
			if (!data)
				return Site.Alert({text: data.error || data.error_msg});

			window.location.hash = "#im?to=-" + data;
		});

		return false;
	}
};