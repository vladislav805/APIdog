var Mail = {

	/** @deprecated */
	version: 1, // 1 - dialogs, 0 - messages

	explain: function() {
		switch (Site.get("act")) {
			case "item":
				Mail.getMessageById(+Site.get("id"));
				break;

			case "search":
				Mail.search.page();
				break;

			case "chat":
				return Mail.createChat();
				break;

			default:
				Mail.createWrap().then(function(list) {
					var type = parseInt(Site.get("type") || 0);

					return Mail.version && type !== Mail.TYPE_IMPORTANT
						? Mail.getDialogs(0).then(Mail.showDialogs.bind(Mail, list))
						: Mail.getListMessages(list, type);
				});
		}
	},

	TYPE_IMPORTANT: 3,

	/**
	 * Create wrapper for page of dialogs or mail
	 * @return {Promise}
	 */
	createWrap: function() {
		return new Promise(function(resolve) {
			var list;
			Site.append($.e("div", {id: "_mail", append: [
				Mail.getListMessagesTabs(),
				list = $.e("div", {id: "_mail-wrap", append: Site.Loader(true)})
			]}));
			resolve(list);
		});
	},

	DEFAULT_COUNT: 50,

	/**
	 * Request for get dialogs
	 * @param {int} offset
	 */
	getDialogs: function(offset) {
		return api("execute", {
			code: 'return{c:API.account.getCounters(),d:API.messages.getConversations({count:parseInt(Args.c),offset:parseInt(Args.o),extended:1})};',
			f: "photo_50,online,sex",
			o: offset,
			c: Mail.DIALOGS_PER_PAGE,
			v: 5.56
		}).then(function(data) {
			Site.setCounters(data.c);
			Local.add(data.d.profiles.concat(data.d.groups));
			data.d.offset = offset;
			console.log(data);
			return data.d;
		});
	},

	DIALOGS_PER_PAGE: 50,

	/**
	 * Show dialogs in page
	 * @param {{count: int, items: Message[], offset: int}} data
	 * @param {HTMLElement} list
	 */
	showDialogs: function(list, data) {
		return new Promise(function(resolve) {
			!data.offset && $.elements.clearChild(list);

			data.items.map(function (item) {
				list.appendChild(Mail.item(item, {conversations: true}));
			});


			if (data.offset + data.items.length + Mail.DIALOGS_PER_PAGE < data.count + Mail.DIALOGS_PER_PAGE)
				list.appendChild(Site.getNextButton({
					text: Lang.get("im.next"),
					click: function (event) {
						$.event.cancel(event);
						if (this.disabled) {
							return;
						}

						//noinspection JSCheckFunctionSignatures
						Mail.getDialogs(offset + Mail.DIALOGS_PER_PAGE, this);
						this.disabled = true;
					}
				}));

			if (!data.offset) {
				list.parentNode.insertBefore(Site.getPageHeader(data.count + " " + Lang.get("mail", "dialogs", data.count), Mail.getActions()), list);
			}

			Site.setHeader(Lang.get("mail.dialogs_noun"));
			resolve();
		});
	},

	/**
	 * Updating message row in list
	 * @param {Message} message
	 */
	updateDialogNode: function(message) {
		var peer = new Peer(message.chat_id ? message.chat_id + Peer.LIMIT : message.user_id), node, text;

		if (!(node = g("mail-dialog" + peer.get()))) {
			return;
		}

		$.elements[!message.out && !message.read_state ? "addClass" : "removeClass"](node, "dialogs-item-new");
		$.elements[!message.out ? "addClass" : "removeClass"](node, "dialogs-in");
		$.elements[message.out ? "addClass" : "removeClass"](node, "dialogs-out");

		text = message.body.replace(/\n{2,}/g, " ").replace(/\n/ig, " \\ ").safe();
		text = text.length > 120 ? text.substring(0, 120) + ".." : text;
		text = text.emoji();

		node.querySelector(".dialogs-rawText").innerHTML = !message.action ? text : IM.getStringActionFromSystemVKMessage(message);
		node.querySelector(".dialogs-attachments").textContent = Mail.getStringAttachments(message);
		node.querySelector(".dialogs-date").textContent = getDate(message.date, APIDOG_DATE_FORMAT_SMART);
		node.querySelector(".dialogs-date").dataset.time = message.date;
	},

	photosChats: {},

	/**
	 * Item message
	 * TODO: replace converter by normal function
	 * @param {Message|{message: Message, unread: int}|{conversation: {peer: {id: int, type: string, local_id: int}, in_read: int, out_read: int, unread_count: int, important: boolean, last_message_id: int, chat_settings: {title: string, members_count: int, state: string, photo: {photo_50: string, photo_100: string, photo_200: string}=} }, last_message: object, unread_count: int=}} message
	 * @param {{unread: int=, highlight: string=, toMessage: boolean=, conversations: boolean=}=} options
	 * @returns {HTMLElement}
	 */
	item: function(message, options) {
		var e = $.e, unread, user, text, peer;
		options = options || {};
		unread = message.unread || options.unread || 0;

		if (Mail.version && message.message) {
			message = message.message;
		}

		peer = new Peer(message.chat_id ? Peer.LIMIT + message.chat_id : message.user_id);

		if (options.conversations) {
			var info = message.conversation,
				msg = message.last_message;
			message = {
				id: msg.id,
				date: msg.date,
				out: msg.out,
				user_id: info.peer.type === "chat" ? msg.from_id : msg.peer_id,
				chat_id: info.peer.type === "chat" ? info.peer.local_id : null,
				read_state: info.in_read === info.out_read,
				title: info.chat_settings && info.chat_settings.title,
				body: msg.text,
				attachments: msg.attachments,
				fwd_messages: msg.fwd_messages,
				geo: msg.geo
			};

			if (info.peer.type === "chat" && info.chat_settings && info.chat_settings.photo_50) {
				message.photo_50 = info.chat_settings.photo_50;
				message.photo_100 = info.chat_settings.photo_100;
				message.photo_200 = info.chat_settings.photo_200;
			}

			unread = info.unread_count;

			peer = new Peer(info.peer.id);
		}

		user = Local.data[message.user_id] || {last_name: "", first_name: ""};


		text = message.body.replace(/\n/g, " ").replace(/\n/ig, " \\ ").safe();
		text = text.length > 120 ? text.substring(0, 120) + ".." : text;
		text = text.emoji();

		if (options.highlight) {
			text = text.replace(new RegExp("(" + options.highlight + ")", "igm"), "<span class='search-highlight'>$1<\/span>");
		}

		var date, link = e("a", {"class": "selectfix dialogs-item",
			"data-peer-id": peer.get(),
			"data-message-id": message.id,

			href: !options.toMessage
				? "#im?to=" + peer.get()
				: "#mail?act=item&id=" + message.id,

			id: Mail.version
				? "mail-dialog" + peer.get()
				: "mail-message" + message.id,

			append: [
				e("div", {"class": "dialogs-left", append: e("img", {src: getURL(message.photo_50 || user.photo_50)}) }),

				e("div", {"class": "dialogs-content", append: [
					e("div", {"class": "dialogs-title", append: [
						e("span", {"class": "tip", html: (peer.isChat() ? Lang.get("mail.chat_noun") : "")}),
						e("strong", {html: peer.isChat() ? message.title.safe().emoji() : getName(user)}),
					]}),
					e("div", {"class": "dialogs-text", append: [
						e("img", {"class": "dialogs-miniPhoto", src: getURL(Local.data[API.userId].photo_50)}),
						e("div", {"class": "dialogs-wrapRawText", append: [
							e("div", {"class": "dialogs-rawText", html: [

								user && peer.isChat()
									? user.first_name.safe() + " " + user.last_name[0] + ".: "
									: "",

								!message.action
									? text
									: IM.getStringActionFromSystemVKMessage(message)

							].join("")}),

							e("div", {"class": "dialogs-attachments", html: Mail.getStringAttachments(message)})
						]})
					]}),
				]}),

				date = e("div", {"class": "dialogs-meta", "data-count": parseInt(unread), append: [
					e("div", {"class": "dialogs-date", "data-time": message.date, html: getDate(message.date, APIDOG_DATE_FORMAT_SMART)})
				]})
			]});

		bindTooltip(date, {
			content: [
				message.out
					? "Исходящее"
					: "Входящее",

				message.read_state
					? "прочитано"
					: "не прочитано"
			].join(", "),
			position: Tooltip.Y_TOP | Tooltip.X_LEFT,
			width: 200
		});

		date.lastChild.style.marginLeft = "-128px";
		date.lastChild.style.bottom = "36px";

		if (!message.out) {
			if (!message.read_state) {
				$.elements.addClass(link, "dialogs-item-new");
			}

			$.elements.addClass(link, "dialogs-in");
		} else {
			$.elements.addClass(link, "dialogs-out");
		}

		if (message.read_state) {
			$.elements.addClass(link, "dialogs-readed");
		}

		return link;
	},

	dialogsSettings: null,

	/**
	 * Save settings of notifications for dialog
	 * @param {{conversations: {count: int, items: object[]}}} data
	 */
	setNotificationsSettings: function(data) {
		Mail.dialogsSettings = {};
		data.conversations.items.filter(function(item) {
			Mail.dialogsSettings[item.peer_id] = item;
		});
	},

	/**
	 * @param {Message} msg
	 * @returns {string}
	 */
	getStringAttachments: function(msg) {
		if (msg.attachments && msg.attachments.length > 0 || msg.geo || msg.fwd_messages) {
			//noinspection SpellCheckingInspection
			var assoc = {photos: 0, videos: 0, audios: 0, docs: 0, stickers: 0, map: 0, links: 0, walls: 0, fwd_messages: 0, wall_replys: 0, gifts: 0},
				attachments = [];

			msg.attachments && msg.attachments.forEach(function(item) {
				assoc[item.type + "s"]++;
			});

			assoc.map = +!!msg.geo;
			msg.fwd_messages = msg.fwd_messages && msg.fwd_messages.length || 0;

			var attachNames = Lang.get("mail.attachment_names");

			for (var item in attachNames) {
				if (attachNames.hasOwnProperty(item) && assoc[item]) {
					attachments.push((assoc[item] > 1 ? assoc[item] + " " : "") + $.textCase(assoc[item], attachNames[item]));
				}
			}

			if (assoc.stickers) {
				attachments = [attachNames.stickers[0]];
			}

			return attachments.join(", ");
		}

		return "";
	},

	defaultChatImage: "\/\/static.apidog.ru\/multichat-icon50.png",

	getActions: function() {
		var p = {};

		p["readAll"] = {
			label: Lang.get("mail.actionReadAll"),
			onclick: function(item) {
				new Modal({
					width: 395,
					title: Lang.get("mail.readAllConfirmTitle"),
					content: Lang.get("mail.readAllConfirmText"),
					footer: [
						{
							name: "yes",
							title: Lang.get("general.yes"),
							onclick: function () {
								this.close();
								Mail.requestReadAll();
							}
						},
						{
							name: "close",
							title: Lang.get("general.no"),
							onclick: function () {
								this.close();
							}
						}
					]
				}).show(item.node());
			}
		};

		p["createChat"] = {
			label: Lang.get("mail.actionCreateChat"),
			isDisabled: true,
			onclick: function() {
				alert("not implemented yet!");
			}
		};

		p["utils"] = {
			label: Lang.get("mail.actionUtilites"),
			isDisabled: true,
			onclick: function() {
				alert("not implemented yet!");
			}
		};


		p["mode"] = {
			label: Lang.get(Mail.version ? "mail.actionSwitch2messages" : "mail.actionSwitch2dialogs"),
			onclick: function() {
				Mail.version = +!Mail.version;
				Mail.explain();
			}
		};

		p["refresh"] = {
			label: Lang.get("mail.actionRefreshCache"),
			onclick: function() {
				Mail.explain();
			}
		};

		return new DropDownMenu(Lang.get("general.actions"), p).getNode();
	},
/*
	setAutoRead: function (node) {
		API.bitmask += node.checked ? (isEnabled(Setting.AUTO_READ_DIALOG) ? 0 : 2) : (isEnabled(Setting.AUTO_READ_DIALOG) & 2 ? -2 : 0);
	},
*/
	/**
	 * Request read all
	 * @param {int=} readed
	 */
	requestReadAll: function(readed) {
		api("execute", {
			code: 'var m=API.messages.getDialogs({unread:1,count:19,v:5.16}),c=m.count,i=0,m=m.items,q;while(i<m.length){if(m[i].message.chat_id){q={peer_id:2000000000+m[i].message.chat_id};}else{q={peer_id:m[i].message.user_id};};API.messages.markAsRead(q);i=i+1;};return{n:c-19,r:parseInt(Args.r)+i};',
			r: readed || 0
		}).then(function(data) {
			if (data.n > 0) {
				return Mail.requestReadAll(data.r);
			}

			data = data.r;

			if (isNaN(data)) {
				return;
			}

			Site.Alert({text: data + " " + $.textCase(data, Lang.get("mail.dialog_was_readed"))});
		});
	},

	deletedMessage: false,

	/**
	 * Request list of messages
	 * @param {HTMLElement} list
	 * @param {int} type
	 */
	getListMessages: function(list, type) {
		var params = [
				'"out":0', // inbox
				'"out":1', // outbox
				'"out":0,"filters":1', // new
				'"filters":8' // important
			][type],
			offset = getOffset();
		api("execute", {
			code: "var m=API.messages.search({q:Args.q,preview_length:110,count:parseInt(Args.c),v:5.63,offset:Args.o,FILTER});return{m:m,u:API.users.get({user_ids:m.items@.user_id,v:5.8,fields:Args.f}),a:API.account.getCounters()};".replace("FILTER", params),
			o: offset,
			q: "*",
			c: Mail.DEFAULT_COUNT,
			f: "photo_50,online,screen_name,sex"
		}).then(function(data) {
			Site.setCounters(data["a"]);
			Local.add(data["u"]);
			Mail.showListMessages(data["m"], {list: list, type: type, offset: offset});
		});
	},

	/**
	 * Returns tabs
	 * @returns {HTMLElement}
	 */
	getListMessagesTabs: function() {
		return Site.getTabPanel(!Mail.version ? [
			["mail", Lang.get("mail.tabs_all")],
			["mail?type=2", Lang.get("mail.tabs_new")],
			["mail?type=3", Lang.get("mail.tabs_important")],
			["mail?act=search", Lang.get("mail.tabs_search")]
		] : [
			["mail", Lang.get("mail.tabs_dialogs")],
			["mail?type=3", Lang.get("mail.tabs_important")],
			["mail?act=search", Lang.get("mail.tabs_search")]
		]);
	},

	/**
	 * Show list of messages
	 * @param {{count: int, items: Message[]}} data
	 * @param {{type: int, list: HTMLElement, offset: int}} options
	 */
	showListMessages: function(data, options) {
		var list = options.list,
			count = data.count,
			items = data.items,

			words = Lang.get("mail.types_messages");

		list.id = "mail-list";

		if (Mail.deletedMessage) {
			var removedMessageId = parseInt(Mail.deletedMessage),
				notification;

			list.parentNode.insertBefore(notification = $.e("div", {"class": "photo-deleted", append: [
				document.createTextNode(Lang.get("mail.message_id_deleted").replace(/%i%/ig, removedMessageId)),
				$.e("span", {"class": "a", html: Lang.get("mail.message_restore"), onclick: function() {
					Mail.restoreMessage(removedMessageId).then(function() {
						$.elements.remove(notification);
						Site.Alert({
							text: Lang.get("mail.success_restore"),
							click: function() {
								window.location.hash = "#mail?act=item&id=" + removedMessageId;
							}
						})
					}).catch(function() {
						Site.Alert({text: Lang.get("mail.failed_restore")});
					});
				}})
			]}), list);
			Mail.deletedMessage = false;
		}

		$.elements.clearChild(list);

		if (count) {
			items.forEach(function(item) {
				list.appendChild(Mail.item(item, {toMessage: true}));
			});
		} else {
			list.appendChild(Site.getEmptyField(Lang.get("mail.you_have_not") + Lang.get("mail.you_have_not_by_types")[options.type]));
		}

		list.parentNode.insertBefore(Site.getPageHeader(formatNumber(count) + " " + $.textCase(count, words[options.type]), Mail.getActions()), list);

		list.appendChild(Site.getSmartPagebar(getOffset(), count, Mail.DEFAULT_COUNT));

		Site.setHeader(Lang.get("mail.messages"));
	},

	/**
	 * Request for restore message by ID
	 * @param {int} messageId
	 * @returns {Promise}
	 */
	restoreMessage: function(messageId) {
		return api("messages.restore", {message_id: messageId});
	},

	/**
	 *
	 * @param {int} data
	 */
	getMessageById: function(data) {
		api("execute", {
			code: 'var m=API.messages.getById({message_ids:Args.id,v:5.8}).items[0],i=(m.fwd_messages@.user_id);i.push(m.user_id);if(parseInt(Args.r)==1){API.messages.markAsRead({message_ids:m.id});};var u=API.users.get({user_ids:i,fields:Args.f,v:5.8});return{m:m,u:u};',
			id: data,
			f: "photo_50,screen_name,online,can_write_private_message,first_name_gen,last_name_gen,sex",
			r: isEnabled(Setting.AUTO_READ_DIALOG) ? 1 : 0
		}).then(function(data) {
			Local.add(data["u"]);
			return data.m
		}).then(Mail.showMessage);
	},

	/**
	 * Show message
	 * @param {Message} data
	 */
	showMessage: function(data) {
		var parent = $.e("div");
		var peerId = new Peer(data.chat_id ? Peer.LIMIT + data.chat_id : data.user_id),
			messageId = data.id,

			actions = {

				findMessageInDialog: function() {
					Mail.findOffsetByMessageId(messageId, peerId.get()).then(function(offset) {
						window.location.hash = "#im?to=" + peerId.get() + "&force=1&offset=" + offset + "&messageId=" + messageId;
					});
				},

				openDialog: function() {
					window.location.hash = "#im?to=" + peerId.get();
				},

				forwardMessage: function() {
					IM.forwardMessagesIds = [messageId];
					window.location.hash = "#mail";
				},

				markAsImportant: function() {
					var field = this;
					api("messages.markAsImportant", {
						message_ids: messageId,
						important: +!data.important
					}).then(function() {
						Site.Alert({text: Lang.get("mail.message_success_marked_as") + (!data.important ? Lang.get("mail.message_important") : Lang.get("mail.message_unimportant"))});
						data.important = !data.important;
						field.value = data.important ? Lang.get("mail.mark_as_unimportant") : Lang.get("mail.mark_as_important");
					});
				},

				markAsRead: function() {
					this.disabled = true;
					this.value = "Чтение...";
					var field = this;
					api("messages.markAsRead", {
						message_ids: messageId
					}).then(function() {
						$.elements.remove(field);
					});
				},

				deleteMessage: function() {
					VKConfirm(Lang.get("mail.confirm_delete_message"), function() {
						api("messages.delete", {message_ids: messageId}).then(function(data) {
							Site.Alert({text: Lang.get("mail.success_deleted")});
							Mail.deletedMessage = messageId;
							window.location.hash = "#mail" + (data.out ? "?type=1" : "");
						});
					});
				}
			},
			e = $.elements.create,
			user = Local.data[data.user_id],
			mar = actions.markAsRead;

		parent.appendChild(Site.getPageHeader(Lang.get("mail.message_id") + messageId));

		parent.appendChild(e("div", {"class": "friends-item", append: [
			e("img", {"class": "friends-left", src: getURL(user.photo_50)}),

			e("div", {"class": "mail-head friends-right", append: [
				e("div", {html: (
					data.out && peerId.isUser()
						? Lang.get("mail.message_for") + " <a href='#" + user.screen_name + "'>" + user.first_name_gen.safe() + " " + user.last_name_gen.safe() + Site.isOnline(user) + "<\/a>"
						: (peerId.isUser()
							? Lang.get("mail.message_from") + " <a href='#" + user.screen_name + "'>" + user.first_name_gen.safe() + " " + user.last_name_gen.safe() + Site.isOnline(user) + "<\/a>"
							: Lang.get("mail.message_from_chat") + " &laquo;" + data.title.safe() + "&raquo; " + Lang.get("mail.message_from_chat_from") + " <a href='#" + user.screen_name + "'>" + user.first_name_gen.safe() + " " + user.last_name_gen.safe() + Site.isOnline(user) + "<\/a>"
						)
					)
				}),
				e("div", {"class": "tip", html: getDate(data.date, APIDOG_DATE_FORMAT_SMART)})
			]})
		]}));

		var text = e("div",{"class": "n-f", html: Site.toHTML(data.body.safe()).emoji()});
		text.style.whiteSpace = "";

		parent.appendChild(e("div", {"class": "mail-content-item", append: [
			text,
			Site.createNodeAttachments(data.attachments, "mail" + messageId),
			IM.forwardedMessages(data.fwd_messages)
		]}));

		actions = [
			[actions.openDialog, Lang.get("mail.message_dialog")],
			[actions.findMessageInDialog, Lang.get("mail.message_find")],
			[actions.forwardMessage, Lang.get("mail.message_forward")],
			[actions.markAsImportant, Lang.get("mail.message_mark") + (!data.important ? Lang.get("mail.message_important") : Lang.get("mail.message_unimportant"))],
			[actions.deleteMessage, Lang.get("mail.message_delete")]
		];

		if (!data.read_state && !data.out) {
			actions.splice(actions.length - 2, 0, [mar, "Прочитать"]);
		}

		parent.appendChild(e("div", {"class": "mail-actions", append: actions.map(function(item) {
			return e("input", {type: "button", value: item[1], onclick: item[0]});
		})}));

		parent.appendChild(Site.getPageHeader("Ответить"));
		parent.appendChild(Site.getExtendedWriteForm({
			noHead: true,
			ctrlEnter: true,
			name: "message",
			allowAttachments: APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT | APIDOG_ATTACHMENT_MAP | APIDOG_ATTACHMENT_LINK,
			mbo: true,
			enableCtrlVFiles: true,
			autoHeightTextarea: true,
			attachmentMethods: {
				photo: "photos.getMessageUploadServer",
				document: "docs.getWallUploadServer"
			},
			smiles: APIDOG_EMOTIONS_MODE_SMILES | APIDOG_EMOTIONS_MODE_STICKERS,
			onSend: function(event) {
				api("messages.send", {
					peer_id: peerId.get(),
					message: event.text,
					attachment: event.attachments.toString(),
					v: 5.56
				}).then(function() {
					window.location.hash = "#mail";
					Site.Alert({text: "Сообщение успешно отправлено!"});
				});
				return false;
			}
		}, 0, 0).getNode());

		Site.setHeader(Lang.get("mail.message"), {link: "mail" + (data.out ? "?type=1" : "")});
		Site.append(parent);
	},

	/**
	 * Search
	 */
	search: {

		/**
		 * Preparing page and form
		 */
		page: function() {
			var parent = $.e("div"),
				list = $.e("div", {id: "__mail-search-list"}),
				e = $.elements.create,
				q;

			if (q = Site.get("q")) {
				Mail.search.onSubmit(decodeURIComponent(q), Site.get("type"));
			}

			parent.appendChild(Mail.getListMessagesTabs());
			parent.appendChild(Site.getPageHeader(Lang.get("mail.search"), e("span", {id: "__mail-search-count", "class": "fr"})));
			parent.appendChild(Mail.search.getForm());
			parent.appendChild(list);

			Site.append(parent);
			Site.setHeader(Lang.get("mail.search"));
		},

		form: null,

		/**
		 * Creating form
		 * @returns {HTMLElement}
		 */
		getForm: function() {
			if (Mail.search.form) {
				return Mail.search.form;
			}

			/** @var {HTMLSelectElement} where */
			var where,
				form = Site.createInlineForm({
					type: "search",
					name: "q",
					value: decodeURIComponent(Site.get("q") || ""),
					placeholder: Lang.get("mail.search_query"),
					title: Lang.get("mail.search"),
					onsubmit: function(event) {
						/** @var {{q: HTMLInputElement}} this */
						event.preventDefault();
						window.location.hash = "#mail?act=search&type=" + where.options[where.selectedIndex].value + "&q=" + encodeURIComponent(this.q.value.trim());
						return false;
					}
				}),
				e = $.elements.create;

			form.appendChild(e("div", {"class": "sf-wrap", append: [
				where = e("select", {name: "where", append: [
					e("option", {value: 1, html: Lang.get("mail.search_by_dialogs")}),
					e("option", {value: 0, html: Lang.get("mail.search_by_messages"), selected: true})
				]})
			]}));

			return Mail.search.form = form;
		},

		/**
		 * Request for search
		 * @param {string} q
		 * @param {int} type
		 * @returns {boolean}
		 */
		onSubmit: function(q, type) {
			api(["execute", "messages.searchDialogs"][type], [
				{
					code: 'var m=API.messages.search({q:Args.q,preview_length:120,count:parseInt(Args.c),offset:parseInt(Args.o)});return{m:m,u:API.users.get({user_ids:m.items@.user_id,fields:Args.f})};',
					v: 5.56,
					c: Mail.DEFAULT_COUNT,
					o: getOffset(),
					f: "photo_50,online,screen_name",
					q: q
				}, {
					q: q,
					limit: 16,
					fields: "photo_50,online,screen_name,sex",
					v: 5.56
				}
			][type]).then(function(data) {
				Local.add(data["u"]);
				Mail.search.showResult(data["m"], type, {q: q})
			}).catch(function(error) {
				console.error(error);
				Site.Alert({text: "error. please look for console."});
			});
			return false;
		},

		/**
		 *
		 * @param {{count: int, items: Message[]}} data
		 * @param {int} type
		 * @param {{q: string}} options
		 * @returns {*}
		 */
		showResult: function(data, type, options) {
			var item = [
					/**
					 * Parser for search messages
					 * @param {Message} i
					 * @returns {HTMLElement}
					 */
					function(i) {
						return Mail.item(i, {highlight: options.q, toMessage: true});
					},

					/**
					 * Parser for search dialog
					 * @param {User|Chat|{email: string}} i
					 * @returns {HTMLElement}
					 */
					function(i) {
						console.log(i);
						var e = $.elements.create;
						return e("a", {"class": "miniProfile-item", href: "#im?to=" + (i.admin_id ? Peer.LIMIT + i.id : i.id), append: [
							e("img", {"class": "miniProfile-left", src: i.photo_50 ? getURL(i.photo_50) : Mail.DEFAULT_CHAT_IMAGE}),
							e("div", {"class": "miniProfile-right", html: {profile: getName(i), chat: i.title.safe().emoji(), email: i.email.safe()}[i.type]})
						]})
					}][type],
				founded = $.e("div"),
				items = [data.items, data][type];

			items.forEach(function(i) {
				founded.appendChild(item(i));
			});

			$.element("__mail-search-count").innerHTML = data.count ? Lang.get("mail.search_founded") + data.count + " " + $.textCase(data.count, Lang.get("mail.search_messages")) : "";
			var list = $.element("__mail-search-list");
			$.elements.clearChild(list);
			list.appendChild(founded);

			if (data.count) {
				list.appendChild(Site.getSmartPagebar(getOffset(), data.count, Mail.DEFAULT_COUNT));
			}
		}
	},

	/**
	 * Search place/offset of message in dialog by ID
	 * @param {int} messageId
	 * @param {int} peerId
	 */
	findOffsetByMessageId: function(messageId, peerId) {
		return new Promise(function(resolve) {
			var offset = 0,
				isFound = false,
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
					],
					unclosableByBlock: true
				}).show(),

				request = function () {

					api("execute", {
						code: "var o=parseInt(Args.o),p=parseInt(Args.p),i=0,l=25,d=[],s=200;while(i<l){d=d+API.messages.getHistory({peer_id:p,offset:o+(s*i),count:s}).items@.id;i=i+1;};return d;",
						o: offset,
						p: peerId,
						v: 5.56
					}).then(function(data) {

						for (var i = 0, l = data.length; i < l; ++i) {
							if (data[i] === messageId) {
								onFound(offset + i);
								break;
							}
						}

						if (data.length !== 0) {
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
										onclick: function () {
											modal.close()
										}
									});
							}
						}
					});
				},

				cancel = function() {
					active = false;
					stoppedByUser = true;
					modal.close();
				},

				onFound = function(offset) {
					if (stoppedByUser) {
						return;
					}

					active = false;
					isFound = true;
					modal.close();
					resolve(parseInt(offset / 50) * 50);
				};
			request();
		});
	},


	DEFAULT_CHAT_IMAGE: "\/\/static.apidog.ru\/multichat-icon50.png",

	/**
	 * Create page and form for creating chat
	 */
	createChat: function() {

		if (!Friends.friends[API.userId]) {
			api("friends.get", {
				fields: Friends.DEFAULT_FIELDS,
				v: 5.56,
				order: "hints"
			}).then(function(data) {
				Friends.friends[API.userId] = data;
				Mail.createChat();
			});
			return;
		}

		var e = $.e,
			parent = e("div"),
			form = e("form", {onsubmit: Mail.onSubmitCreateChat}),
			title = e("div", {"class": "sf-wrap"}),
			status = e("div", {"class": "tip tip-form"}),
			creator = e("input", {
				type: "submit",
				value: Lang.get("mail.create_creator"),
				"class": "mail-create-btn",
				disabled: true
			}),
			selected = 0,

			setStatus = function() {
				creator.disabled = (selected <= 1 || name.value.trim());
				status.innerHTML = Lang.get("mail.create_status", selected).schema({n: selected});
			},

			onClickItem = function (event) {
				var check = form.querySelectorAll("input[type=checkbox]:checked");
				selected = check.length;
				if (selected >= 250)
					$.event.cancel(event);
				if (this.querySelector("input[type=checkbox]").checked)
					$.elements.addClass(this, "mp-checked");
				else
					$.elements.removeClass(this, "mp-checked");
				setStatus();
			},

			name = e("input", {type: "text", required: true, name: "title", onkeyup: setStatus}),
			item = function(item) {
				var i = e("label", {
					"class": "miniProfile-item",
					append: [
						e("img", {"class": "miniProfile-left", src: getURL(item.photo_50)}),
						e("div", {"class": "_checkbox fr"}),
						e("input", {"class": "multiple_friends hidden", type: "checkbox", name: "items[]", value: item.id}),
						e("div", {"class": "miniProfile-right", append: e("strong", {
							append: e("a", {
								href: "#" + (item.screen_name || "id" + item.id),
								onclick: function (event) { $.event.cancel (event) },
								html: getName(item)
							})
						})})
					]
				});

				i.addEventListener("click", onClickItem.bind(i));

				return i;
			},
			list = e("div");

		title.appendChild(e("div", {"class": "tip tip-form", html: Lang.get("mail.create_title")}));
		title.appendChild(name);
		title.appendChild(creator);
		title.appendChild(status);

		for (var i = 0, f = Friends.friends[API.userId].items, friend; friend = f[i]; ++i) {
			list.appendChild(item(friend));
		}

		form.appendChild(title);
		form.appendChild(list);
		parent.appendChild(Site.getPageHeader(Lang.get("mail.create_header")));
		parent.appendChild(form);
		Site.append(parent);
		Site.setHeader(Lang.get("mail.create_header"), {link: "mail"});
		setStatus();
	},

	MAX_COUNT_MEMBERS_IN_CHAT: 200,

	/**
	 * On submit form for create chat
	 * @param {Event} event
	 * @returns {boolean}
	 */
	onSubmitCreateChat: function(event) {
		$.event.cancel(event);

		var title = this.title.value.trim(),
			checked = this.querySelectorAll("input[type=checkbox]:checked"),
			userIds = [];

		for (var i = 0, l = Math.min(checked.length, Mail.MAX_COUNT_MEMBERS_IN_CHAT); i < l; ++i) {
			userIds.push(checked[i].value);
		}

		userIds = userIds.join(",");

		api("messages.createChat", {title: title, user_ids: userIds}).then(function(data) {
			window.location.hash = "#im?to=-" + data;
		}).catch(function(error) {
			/** @var {VkError} error */
			Site.Alert({text: error || error.error_msg})
		});

		return false;
	}
};
