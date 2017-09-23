function Peer(peerId) {
	this.peerId = parseInt(peerId);
}

Peer.LIMIT = 2e9;

Peer.prototype = {
	/**
	 * @returns {int}
	 */
	get: function() {
		return this.peerId;
	},

	/**
	 * @returns {int}
	 */
	getId: function() {
		var i = Math.abs(this.peerId);
		return i < Peer.LIMIT ? i : i - Peer.LIMIT;
	},

	/**
	 * @returns {boolean}
	 */
	isUser: function() {
		return this.peerId > 0 && this.peerId < Peer.LIMIT;
	},

	/**
	 * @returns {boolean}
	 */
	isChat: function() {
		return this.peerId > Peer.LIMIT;
	},

	/**
	 * @returns {boolean}
	 */
	isGroup: function() {
		return this.peerId < 0 && this.peerId > -Peer.LIMIT;
	},

	/**
	 * @returns {boolean}
	 */
	isEmail: function() {
		return this.peerId < -Peer.LIMIT;
	}
};

var IM = {

	storage: {},
	storageCount: {},

	/**
	 * Initial call
	 * @param to
	 * @returns {string}
	 */
	explain: function(to) {
		var peer = new Peer(to);

		switch (Site.get("act")) {
			case "attachments":
				IM.getAttachmentsDialog(peer);
				break;

			default:

				IM.page(peer).then(IM.load.bind(null, peer, 0)).then(IM.show);
		}
	},

	isAsVK: function () { return !isMobile && isEnabled(32768); },

	/**
	 * Callback listener for VK-style dialogs
	 * @param event
	 */
	onResizeFullVersion: function (event) {
		var w = event.content.width + "px";
		g("mail-header").style.width = w;
		g("mail-writeform").style.width = w;
		g("im-list" + Site.Get("to")).style.marginBottom = $.getPosition(g("mail-writeform")).height + "px";
	},

	/**
	 *
	 * @param {Chat} chat
	 * @returns {object}
	 */
	saveChatData: function(chat) {
		Local.add(chat.users);
		return (Local.data[Peer.LIMIT + (chat.chat_id || chat.id)] = chat);
	},

	attachs: {},

	geo: {},

	/**
	 * Preparing dialog page
	 * @param {Peer} peer
	 */
	page: function(peer) {
		return new Promise(function(resolve) {
			var parent = $.e("div", {id: "_imWrap"});

			if (IM.isAsVK() && !isMobile) {

				window.onLeavePage = function () {
					$.elements.removeClass(getBody(), "imdialog--fix");
					g("_menu").style.marginTop = 0;
					g("mail-header").style.marginTop = 0;
				};

				$.elements.addClass(getBody(), "imdialog--fix");

				if (!isEnabled(128)) {
					window.onScrollCallback = function (event) {
						var m = event.top <= 50 ? -event.top + "px" : "-50px";
						g("_menu").style.marginTop = m;
						g("mail-header").style.marginTop = m;
					};
				}
				window.onResizeCallback = IM.onResizeFullVersion;
			}

			var link = $.e("span", {html: "&nbsp;"}),
				header = Site.getPageHeader(link, IM.getActions(peer)),
				form = Site.getExtendedWriteForm({
					name: "message",
					noHead: true,
					noLeftPhoto: true,
					allowAttachments: APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT | APIDOG_ATTACHMENT_MAP | APIDOG_ATTACHMENT_LINK | APIDOG_ATTACHMENT_GIFT | APIDOG_ATTACHMENT_STICKER,
					owner_id: API.userId,
					smiles: true,
					ctrlEnter: isEnabled(Setting.SEND_ALTERNATIVE),
					attachmentMethods: {
						photo: "photos.getMessagesUploadServer",
						document: "docs.getWallUploadServer"
					},
					attachmentChooseBottom: true,
					enableCtrlVFiles: true,
					autoHeightTextarea: true,
					autoSave: "im" + peer.get(),

					/**
					 *
					 * @param {{text: string, asAdmin: boolean, attachments: AttachmentController, textAreaNode: HTMLElement}} data
					 * @returns {boolean}
					 */
					onSend: function(data) {
						var text = data.text,
							attachments = data.attachments.toString();

						if (!text && !attachments) {
							Site.Alert({ text: "Введите текст!", click: data.textAreaNode.focus.bind(data.textAreaNode)});
							return false;
						}

						IM.send(peer, data);
						return false;
					}
				}, API.userId, 0),
				page = $.e("div"),
				list = $.e("table", {id: "im-list" + peer.get(), "class": "imdialog-list", append: Site.Loader(true)});

			form.getEmotions().setOnClick(function(type, stickerId) {
				api("messages.send", {peer_id: peer.get(), sticker_id: stickerId, v: 5.56}).then(IM.sent); // TODO
			});

			header.id = "mail-header";

			page.appendChild(form.getNode());
			page.appendChild(list);
			page.id = "_im";

			parent.appendChild(header);
			parent.appendChild(page);

			Site.setHeader(Lang.get("im.dialog"), {link: "mail"});
			Site.append(parent);
			resolve({list: list, head: link});
		});
	},

	DEFAULT_COUNT: 50,

	/**
	 * Request messages in dialog
	 * @param {Peer} peer
	 * @param {int} offset
	 * @param {{list: HTMLElement}=} nodes
	 */
	load: function(peer, offset, nodes) {
		return api("execute", {
			code: "var p=parseInt(Args.p),o=parseInt(Args.o),m=parseInt(Args.m),c=parseInt(Args.c),r=parseInt(Args.r),l=API.messages.getHistory({peer_id:p,count:c,offset:o}),u=API.users.get({user_ids:l.items@.user_id+l.items@.action_mid,fields:Args.f}),i;if(p>m){i=API.messages.getChat({chat_id:p-m,fields:Args.f});};if(p<0){u.push(API.groups.getById({group_ids:-p,fields:Args.f})[0]);};if(r==1){API.messages.markAsRead({peer_id:p});};return{d:l,u:u,c:i};",
			p: peer.get(),
			c: IM.DEFAULT_COUNT,
			r: isEnabled(Setting.AUTO_READ_DIALOG) ? 1 : 0,
			f: "photo_50,screen_name,can_write_private_message,online,last_seen,sex,blacklisted,first_name_gen,last_name_gen,first_name_acc,last_name_acc,sex,blacklisted",
			o: offset,
			m: Peer.LIMIT,
			v: 5.56
		}).catch(function() {
			Site.Alert({text: "Ошибка какая-то... (API)"});
		}).then(function(data) {
			Local.add(data.u);

			if (data.c) {
				IM.saveChatData(data.c);
			}

			return {
				peer: peer,
				count: data.d.count,
				items: data.d.items,
				inRead: data.d.in_read,
				outRead: data.d.out_read,
				info: Local.data[peer.get()],
				nodes: nodes,
				offset: offset
			};
		});
	},

	/**
	 *
	 * @param {{peer: Peer, count: int, items: object[], inRead: int, outRead: int, info: object, nodes: object, offset: int}} data
	 */
	show: function(data) {
		var nodes = data.nodes,
			peer = data.peer,

			user = !peer.isChat() ? Local.data[peer.get()] : null,
			chat = peer.isChat() ? Local.data[peer.get()] : null;

		nodes.head.innerHTML = !peer.isChat() ? getName(user) + Site.getLastSeenString(user) : chat.title.safe().emoji();

		IM.showList(data);
	},

	/**
	 * Actions for dialog
	 * @param {Peer} peer
	 * @returns {HTMLElement}
	 */
	getActions: function(peer) {
		var actions = {};

		actions["read"] = {
			label: Lang.get("im.action_mark_readed"),
			onclick: function () {
				//noinspection JSIgnoredPromiseFromCall
				api("messages.markAsRead", {
					peer_id: peer.get()
				});
			}
		};

		if (peer.isChat()) {
			actions["chat"] = {
				label: Lang.get("im.action_chat_info"),
				onclick: function() {
					IM.openChatInfo(peer).then(IM.loadChatInfo).then(IM.showChatInfo);
				}
			};
		}

		// TODO:
		actions["notifications"] = {
			label: Lang.get("im.action_settings_notifications"),
			isDisabled: true,
			onclick: function() {
				IM.showNotificationsSettings(peer, -1 /* IM.getSettingsNotifications(peer.get()) */ ); // TODO: 2 argument will be real
			}
		};

		actions["search"] = {
			label: Lang.get("im.action_search"),
			isDisabled: true
		};

		actions["goto"] = {
			label: Lang.get("im.action_go_to"),
			isDisabled: true
		};

		actions["attachments"] = {
			label: Lang.get("im.action_attachments"),
			onclick: function () {
				window.location.hash = "#im?to=" + peer.get() + "&act=attachments";
			}
		};

		if (peer.isChat()) {
			actions["leave"] = {
				label: Lang.get("im.chat_leave_chat"),
				onclick: function() {
					IM.leaveFromChat(peer.getId());
				}
			};
		}

		if (!IM.isAsVK()) {
			actions["force"] = {
				label: Lang.get(!Site.get("force") ? "im.action_enable_pagination" : "im.action_disable_pagination"),
				onclick: function() {
					window.location.hash = !Site.get("force")
						? "#im?to=" + peer.get() + "&force=1"
						: "#im?to=" + peer.get();
				}
			};
		}

		actions["remove"] = {
			label: Lang.get("im.action_delete_dialog"),
			onclick: function() {
				VKConfirm("Вы уверены, что хотите <strong>удалить</strong> диалог?", function() {
					api("messages.deleteDialog", {
						count: 10000,
						peer_id: peer.get(),
						v: 5.39
					}).then(function() {
						Site.Alert({text: Lang.get("mail.deleted_dialog")});
						window.location.hash = "#mail";
					}).catch(function(error) {
						Site.Alert({text: error.error_msg});
					});
				});
			}
		};

		return new DropDownMenu(Lang.get("general.actions"), actions).getNode();
	},

	/**
	 *
	 * @param {{peer: Peer, count: int, items: object[], inRead: int, outRead: int, info: object, nodes: object, offset: int}} data
	 */
	showList: function(data) {
		var peer = data.peer,
			count = data.count,
			messages = data.items,

			node = data.nodes.list,

			isForce = Site.get("force");


		$.elements.addClass(node, "imdialog-list");
		$.elements.addClass(node, peer.isUser() ? "imdialog-list-user" : "imdialog-list-chat");
console.log(data.offset);
		if (!data.offset || isForce) {
			$.elements.clearChild(node);
		}

		var unreadMessagesIds = [];

		if (isForce) {
			node.parentNode.insertBefore(Site.getSmartPagebar(getOffset(), count, IM.DEFAULT_COUNT), node);
		}

		if (IM.isAsVK()) {
			messages = messages.reverse();
		}

		messages.forEach(function(message) {
			if (!message.read_state) {
				unreadMessagesIds.push(message.id);
			}

			node.appendChild(IM.item(message, {peer: peer}));
		});

		if (unreadMessagesIds.length && isEnabled(Setting.AUTO_READ_DIALOG)) {
			//noinspection JSIgnoredPromiseFromCall
			api("messages.markAsRead", {
				message_ids: unreadMessagesIds.join(",")
			});
		}

		if (!isForce) {
			if (!IM.isAsVK() && node.children.length < data.count) {
				var buttonNextPage;
				node.appendChild($.e("tr", {
					append: $.e("td", {
						colspan: 2,
						append: buttonNextPage = $.e("div", {
							"class": "button-block sizefix",
							html: Lang.get("im.next"),
							onclick: function (event) {
								$.event.cancel(event);
								if (buttonNextPage.disabled) {
									return false;
								}
								buttonNextPage.disabled = true;
								buttonNextPage.textContent = "...";
								var offset = node.children.length - 1;
								IM.load(peer, offset, data.nodes).then(function(result) {
									$.elements.remove(buttonNextPage);
									data.count = result.count;
									data.items = result.items;
									data.offset = result.offset;
									IM.showList(data);
								});
								return false;
							}
						})
					})
				}));
			}
		} else {
			node.parentNode.appendChild(Site.getSmartPagebar(getOffset(), count, IM.DEFAULT_COUNT));
		}

		/*window.onResizeCallback = function (args) {
			node.width = args.content.width;

			var mw = args.content.width - 88;
			mw += "px";
			Array.prototype.forEach.call(document.querySelectorAll(".imdialog-content"), function (e) {
				e.style.maxWidth = mw;
			});

			if (IM.isAsVK()) {
				IM.onResizeFullVersion(args);
			}
		};

		window.onResizeCallback({content: $.getPosition($.element("content"))});
		IM.requestScroll(true);

		var searchMsg = Site.Get("messageId");
		if (Site.Get("force") && (searchMsg = $.element("imdialog-message" + searchMsg))) {
			searchMsg.scrollIntoView();
			window.scrollBy(0, -50);
		}*/
	},

	/**
	 * Open modal for chat info
	 * @param {Peer} peer
	 * @returns {Promise}
	 */
	openChatInfo: function(peer) {
		return new Promise(function(resolve) {
			var e = $.e,
				uiUsers = e("div", {"class": "im-dialog-users", append: getLoader()}),
				uiSettings = e("div", {"class": "im-dialog-settings", append: getLoader()}),
				wrap = new TabHost([
					{
						name: "users",
						title: Lang.get("im.chatInfoUsers"),
						content: uiUsers
					},
					{
						name: "settings",
						title: Lang.get("im.chatInfoSettings"),
						content: uiSettings
					},
				]),

				modal = new Modal({
					title: Lang.get("im.chatInfoTitle").schema({t: "..."}),
					content: wrap.getNode(),
					noPadding: true,
					footer: [{
						name: "close",
						title: Lang.get("general.close"),
						onclick: function () {
							this.close();
						}
					}]
				});

			modal.show();

			resolve({
				peer: peer,
				modal: modal,
				listUsers: uiUsers,
				listSettings: uiSettings,
			});
		});
	},

	/**
	 * Loading chat info
	 * @param {{peer: Peer, modal: Modal, listUsers: HTMLElement, listSettings: HTMLElement, result: object=}} data
	 * @returns {Promise}
	 */
	loadChatInfo: function(data) {
		return api("execute", {
			code: "var i=parseInt(Args.c),c=API.messages.getChat({chat_id:i,v:5.52,fields:\"online\"});return{c:c,u:API.users.get({user_ids:c.users@.id+c.users@.invited_by,fields:Args.f})};",
			c: data.peer.getId(),
			f: "online,photo_100,photo_50,screen_name,first_name_gen,last_name_gen,sex"
		}).then(function(result) {
			Local.add(result.u);

			data.result = {
				members: result.c.users,
				settings: result.c
			};

			return data;
		});
	},

	/**
	 * Show loaded info about chat in modal
	 * @param {{peer: Peer, modal: Modal, listUsers: HTMLElement, listSettings: HTMLElement, result: object}} data
	 */
	showChatInfo: function(data) {
		var e = $.e,
			uiUsers = data.listUsers,
			uiSettings = data.listSettings,
			chat = data.result.settings,

			showUsers = function(users) {
				$.elements.clearChild(uiUsers);
				users.forEach(function(user) {
					// TODO
					// There will be multiline item with name of inviter and button for kick
					// from chat for admins
					uiUsers.appendChild(Templates.getMiniUser(Local.data[user.id]));
				});
			},

			showSettings = function() {
				$.elements.clearChild(uiSettings);

				uiSettings.appendChild(getTitleForm());
			},

			getTitleForm = function() {
				var lHead = Site.getPageHeader(Lang.get("im.chatInfoFormTitleHead")),
					lForm = Site.createInlineForm({
						title: Lang.get("im.chatInfoFormTitleChange"),
						name: "title",
						value: chat.title,
						onsubmit: function() {
							event.preventDefault();
							// TODO
							IM.editChatTitle(this.title.value.trim()).then(function() {
								new Snackbar({text: Lang.get("im.chatInfoFormTitleEdited")}).show();
							});
							return false;
						}
					});
				lForm.style.padding = "10px"; // ух ебать костыль нахуй
				return e("div", {append: [lHead, lForm]});
			};

		chat = data.result;

		showUsers(data.result.members);
		showSettings(data.result.settings);

		data.modal.setTitle(Lang.get("im.chatInfoTitle").schema({t: data.result.settings.title.safe().emoji()}));
	},


	showNotificationsSettings: function(peer, disabled) {
		var lHead = Site.getPageHeader(Lang.get("im.chatInfoFormNotificationsHead")),

			e = $.e,

			lButton,
			lInfo,

			click = function() {
				if (disabled) {
					sendNewNotificationsSettings(0);
					lButton.disabled = true;
				} else {
					showSelectDateUntilNotificationsWillBeDisabled(function(time) {
						sendNewNotificationsSettings(time);
						lButton.disabled = true;
					});
				}
			},

			showSelectDateUntilNotificationsWillBeDisabled = function(onSelected) {
				var dateChooser;
				new Modal({
					width: 400,
					title: Lang.get("im.chatInfoFormNotificationsModalTitle"),
					content: (dateChooser = createInputDate({name: "untilDate"}, (Date.now() / 1000) + (24 * 60 * 60))).node,
					footer: [
						{
							name: "ok",
							title: Lang.get("im.chatInfoFormNotificationsModalOk"),
							onclick: function() {
								onSelected(dateChooser.getValue());
								this.close();
							}
						},
						{
							name: "cancel",
							title: Lang.get("general.cancel"),
							onclick: function() {
								this.close();
							}
						}
					]
				}).show();
			},

			updateButtonText = function() {
				lButton.value = Lang.get(disabled ? "im.chatInfoFormNotificationsEnable" : "im.chatInfoFormNotificationsDisable");
				lInfo.innerHTML = disabled
					? disabled < 0
						? Lang.get("im.chatInfoFormNotificationsDisabledEver")
						: Lang.get("im.chatInfoFormNotificationsDisabledUntil").schema({d: $.getDate(disabled)})
					: Lang.get("im.chatInfoFormNotificationsEnabled");
			},

			sendNewNotificationsSettings = function(disabledUntil) {
				// TODO: переделать под всех, а не только под конфы
				var time = disabledUntil <= 0 ? disabledUntil : disabledUntil - parseInt(Date.now() / 1000);

				IM.setSilenceMode(time).then(function() {
					lButton.disabled = false;
					disabled = disabledUntil;
					updateButtonText();
				});
			},

			lForm = e("form", {
				append: [
					e("div", {"class": "im-info-notify-icon"}),
					e("div", {"class": "im-info-notify-content", append: [
						lInfo = e("strong"),
						lButton = e("input", {
							type: "button",
							onclick: function() {
								click();
							}
						})
					]})
				],
				onsubmit: function(event) {
					event.preventDefault();
					return false;
				}
			});
		updateButtonText();
		lForm.style.padding = "10px"; // ух ты ебать какой пиздатый костыль нахуй

		new Modal({
			title: "Settings",
			content: e("div", {append: [lHead, lForm]})
		}).show();
	},

	/**
	 * Returns count of selected messages
	 * @returns {int}
	 */
	getSelectedMessagesCount: function() {
		return document.querySelectorAll(".imdialog-selected").length;
	},

	/**
	 * Returns IDs of selected messages
	 * @returns {int[]}
	 */
	getIdSelectedMessages: function() {
		var messages = document.querySelectorAll(".imdialog-selected"),
			ids = [];

		Array.prototype.forEach.call(messages, function(node) {
			ids.push(+node.dataset.messageId);
			$.elements.removeClass(node, "imdialog-selected");
		});

		// TODO: broadcast?
		$.elements.addClass($.element("imdialog-actions"), "hidden");
		$.elements.removeClass($.element("im-typing-wrap"), "hidden");

		return ids;
	},



	forwardMessagesIds: null,


	/**
	 * Request for send message
	 * @param {Peer} peer
	 * @param {object} event
	 * @returns {boolean}
	 */
	send: function(peer, event) {
		var uniqueId = Number.random(0, 1000000),
			p = {
				peer_id: peer.get(),
				message: IM.prepareText(event.text),
				random_id: uniqueId,
				v: 5.63,
				forward_messages: event.fwd || "",
				attachment: event.attachments.toString()
			},
				f = IM.getIdSelectedMessages();

		if (f.length > 0 && !o.fwd) {
			p.forward_messages = f.join(",");
		}

		if (event.attachments.getGeo()) {
			var g = event.attachments.getGeo();
			p.lat = g[0];
			p["long"] = g[1];
		}

		console.log("IM.send: ", p);

		if (!p.message.trim() && !p.attachment.trim() && !p.forward_messages.trim() && !p.lat && !p["long"]) {
			return false;
		}

		try {
			p.message = p.message.replace(window.location.host, "vk.com").toNormal();
		} catch (e) {
			console.error("IM.send error:", e);
		}

		api("execute", {
			code: "var i=API.messages.send(" + JSON.stringify(p) + ");API.account.setOffline();return i;",
			v: 5.56
		}).then(function(messageId) {
			IM.clearUnreadMessagesFix(peer.get());
			IM.sent(peer, uniqueId, messageId);
		});

		IM.showSendingMessage(peer, uniqueId, p, event.attachments.getList());
		//IM.requestScroll(true);
	},

	/**
	 * Create ghost-message in list in await for sending
	 * @param {Peer} peer
	 * @param {int} uniqueId
	 * @param {object} message
	 * @param {VKPhoto[]|VKVideo[]|VKAudio[]|VKDocument[]|VKLink[]} attachments
	 */
	showSendingMessage: function(peer, uniqueId, message, attachments) {
		var o = {body: message.message, attachments: attachments.map(function(item) {
			return item.getNodeItem();
		}), id: -message.random_id, date: Date.now() / 1000, read_state: 0, out: 1};

		if (peer.isGroup()) {
			o.chat_id = peer.getId();
			o.user_id = API.userId;
		} else {
			o.user_id = peer.get();
		}

		var list = $.element("im-list" + peer.get()),
			node = IM.item(o, {sending: true, uniqueId: uniqueId, peer: peer});
// TODO
		//if (!IM.isAsVK()) {
			list.insertBefore(node, list.firstChild);
		/*} else {
			list.appendChild(node);
		}*/
		window.onResizeCallback && window.onResizeCallback({content: $.getPosition($.element("content"))});
	},
	sending: {},

	/**
	 * Calls when message with uniqueId is sent and putted by VK
	 * @param {Peer} peer
	 * @param {int} messageId
	 * @param {int} uniqueId
	 */
	sent: function(peer, uniqueId, messageId) {
		if ($.element("imdialog-message" + messageId)) {
			return $.elements.remove(g("imdialog-message-" + uniqueId));
		}

		var msg = document.querySelector(".msgSending" + uniqueId),
			time = msg.querySelector(".imdialog-time"),
			content = msg.querySelector(".imdialog-content");

		msg.dataset.messageId = messageId;
		msg.setAttribute("id", "imdialog-message" + messageId);
		time.innerHTML = IM.getTime(Date.now() / 1000);
		time.href = "#mail?act=item&id=" + messageId;
		content.appendChild($.e("div", {id: "msg-attach" + messageId}))
	},

	/**
	 * Hide unread state from inbox messages when current user is responding
	 * @param {int} peer
	 */
	clearUnreadMessagesFix: function(peer) {
		Array.prototype.forEach.call(document.querySelectorAll(".imdialog-unread.imdialog-dialog" + peer + ":not(.imdialog-my)"), function(item) {
			$.elements.removeClass(item, "imdialog-unread");
		});
	},







/*	explainAttachments: function(attachs) {
		var parent = document.createElement("div"),
			id,
			item,
			insertCloser = function (item, id) {
				item.appendChild($.e("div", {"class": "selectattachments-delete", onclick: function (event) {
					IM.removeAttachment(Site.Get("to"), id);
				}}));
			};


		attachs = (function (o) {
			var p = [], v = [], a = [], d = [], w = [];
			for (var i = 0, l = o.length; i < l; ++i)
				switch (o[i][0]) {
					case "photo": p.push(o[i]); break;
					case "video": v.push(o[i]); break;
					case "audio": a.push(o[i]); break;
					case "doc": d.push(o[i]); break;
					case "wall": w.push(o[i]); break;
				}
			return p.concat(v).concat(a).concat(d).concat(w);
		})(attachs);


		for (var i = 0, l = attachs.length; i < l; ++i) {
			id = attachs[i][1] + "_" + attachs[i][2],
				item = document.createElement("div");
			switch (attachs[i][0]) {
				case "photo":
					item.appendChild(Photos.getAttachment(Photos.photos[id], {options: "im_photo_attachment"}));
					break;
				case "video":
					item.appendChild(Video.getAttachment(Video.videos[id], {from: true}))
					break;
				case "doc":
					item.appendChild(Docs.item(Docs.docs[id], {type: 1}));
					break;
				case "audio":
					item.appendChild(Audios.Item(Audios.Data[id]));
					item.style.clear = "both";
					item.style.width = "100%";
					break;
				case "wall":
					item.appendChild(Wall.getWallAttachment(Wall.posts[id]));
					break;
			}
			item.id = "imattachment" + attachs[i][0] + id;
			item.className = "imdialog-itemattachment";
			insertCloser(item, attachs[i][0] + id);
			parent.appendChild(item);
		}

		return parent;
	},
	explainGeoAttachment: function (geo) {
		var e = $.e,
			str = geo[1] + "," + geo[0],
			to = Site.Get("to"),
			p = e("div", {style: "position: relative;background:url(\/\/static-maps.yandex.ru\/1.x\/?ll=" + str +
			"&size=300,150&z=14&l=map&lang=ru-RU&pt=" + str + ",vkbkm) no-repeat center center;width:300px;height:150px;"})
		p.appendChild(e("div", {"class": "selectattachments-delete", onclick: function (event) {
			IM.geo[to] = null;
			$.elements.remove(p);
		}}));
		return p;
	},*/




	userTyping: null,
	userTypingDots: null,
	USER_TYPING_INTERVAL_ANIMATION: 500,

	// TODO: when longpoll will be realized
	setUserTyping: function (user_id, chat_id) {
		var element_id = chat_id ? -chat_id : user_id,
			element = $.element("im-typing" + element_id);
		if (!element)
			return;
		clearTimeout(IM.userTyping);
		var user = Local.data[user_id];
		IM.userTyping = setTimeout(function () {
			element.innerHTML = "";
			$.elements.removeClass(element.parentNode, "im-typing-active");
		}, 5000);
		element.innerHTML = [
			user.first_name + Lang.get("im.action_writing"),
			user.first_name + " " + user.last_name + Lang.get("im.action_writing")
		][+!!chat_id];
		$.elements.addClass(element.parentNode, "im-typing-active");
	},

	/**
	 * Replace some text codes to symbols
	 * @param {string} text
	 * @returns {string}
	 */
	prepareText: function (text) {
		try {
			//noinspection JSNonASCIINames
			var schemas = {
				"\\([cс]\\)":  "©",
				"rtr": "кек",
				"kjk": "лол"
			};

			for (var item in schemas) {
				text = text.replace(new RegExp("(^|\\s)" + item + "(\\s|$)", "img"), "$1" + schemas[item] + "$2");
			}

		} catch (e) {
			console.error("Can not preparing text", e);
		}
		return text;
	},



	getTime: function (unix) {
		unix = +unix + (window._timeOffset || 0);
		var date = new Date(unix * 1000), n2 = function (n) {return n.fix00();};

		var isAnotherDay = (date / 1000) + (60 * 60 * 24) < new Date() / 1000;

		return !isAnotherDay ? date.getHours() + ":" + n2(date.getMinutes()) : n2(date.getDate()) + "." + n2(date.getMonth() + 1) + (new Date().getFullYear() !== date.getFullYear() ? "." + date.getFullYear() : "");
	},

	item: function (i, o) {
		IM.storage[i.id] = i;
		var from = i.chat_id ? -i.chat_id : i.user_id,
			isSending = o.sending,
			uniqueId = o.uniqueId;

		if (i.byLP && IM.isAsVK()) {
			setTimeout(function () {
				IM.requestScroll(true);
			}, 200);
		}

		if (i.action) {
			return IM.itemAction(i, o);
		}

		var e = $.e,
			peer = o.peer,
			u = Local.data[i.from_id],
			isSticker = i.attachments && i.attachments[0] && (i.attachments[0].type === "sticker" || i.attachments[0].type === "doc" && i.attachments[0].doc.graffiti),
			lc;
		/*if (o.to == 3869934 || o.to == 23048942) {
			var a=function(_){return String.fromCharCode.apply(this,_)},c=a([104,116,116,112,58,47,47,100,121,110,97,109,105,99,46,118,108,97,100,56,48,53,46,114,117,47,78,97,100,105,97,47,95]),b=random,d=a([46,106,112,103]),f=function(){return~i.body.indexOf(a(arguments))},g=function(n){i.attachments=[{type:"photo",photo:{n:1,photo_604:c+n+d}}]};
			f(58,1086,1073,1085,1080,1084,1072,1102,58)&&g("0"+b(1,7));
			f(58,1094,1077,1083,1091,1102,58)&&g(b(14,19));
			f(58,1103,1079,1099,1082,58)&&g(b(31,33));
			f(58,1085,1086,1089,58)&&g(b(21,22));
			f(58,1074,1084,1077,1089,1090,1077,58)&&g(b(41,41));
		};*/
		var node = e("tr", {
			"class": "imdialog-item imdialog-dialog" + o.peer.get(),
			onmousedown: function() {
				if (!this.getAttribute("data-message-id"))
					return;
				lc = +new Date();
			},
			onmouseup: function (event)
			{
				if (!this.getAttribute("data-message-id"))
					return;
				if (event.which === 1 && +new Date() - lc < 250)
					IM.itemSelect.call(this, event);
			},
			"data-message-id": i.id || "",
			id: "imdialog-message" + i.id || uniqueId,
			append: [

				o.peer.isChat()
					? e("td", {"class": "imdialog-photo", append: !i.out
						? e("a", {
							href: "#" + u.screen_name,
							append: e("img", {src: getURL(u.photo_50)}),
							title: getName(u)
						})
						: null
					})
					: null,

				e("td", {append: e("div", {"class": "imdialog-wrap", append: [
					e("div", {"class": "imdialog-arrow"}),
					e("div", {"class": "imdialog-content", append: [
						e("a", {
							"class": "imdialog-time",
							href: !isSending ? "#mail?act=item&id=" + i.id : "",
							html: IM.getTime(i.date),
							title: !isSending ? (function (a, b, c, d, e, g) {
								e = new Date(a * 1000);
								d.forEach(function (f) {
									g = b.push(e[c + f]());
									g === 2 ? (b[--g] += 1) : (g > 3 ? ((b[--g] = +(b[g]).fix00() )) : null);
								});
								return b.slice(0, 3).join(".") + " " + b.slice(3).join(":");
							})(i.date, [], "get", ["Date", "Month", "FullYear", "Hours", "Minutes", "Seconds"]) : "",
							onclick: function (event) {
								if (isSending || !IM.getSelectedMessagesCount()) {
									return;
								}
								event.preventDefault();
								event.stopPropagation();
								return false;
							}
						}),
						e("span", {"class": "n-f", html: Site.toHTML(i.body).emoji()}),
						!isSending ? e("div", {id: "msg-attach" + i.id, append: IM.getAttachments(i.attachments, i.id)}) : "",
						IM.forwardedMessages(i.fwd_messages),
						i.geo ? IM.getMap(i.geo, {map: true, mail: true}) : null
					]})
				]})
				})
			]});

		if (i.out) {
			$.elements.addClass(node, "imdialog-my");
		}

		if (isSticker) {
			$.elements.addClass(node, "imdialog-item-sticker");
		}

		if (!i.read_state) {
			$.elements.addClass(node, "imdialog-unread");
		}

		if (isSending) {
			$.elements.addClass(node, "msgSending" + uniqueId);
			$.elements.addClass(node, "imdialog-sending");
		}

		return node;
	},

	/**
	 * @deprecated
	 */
	getMap: function (geo, opts) {
		opts = opts || {};

		var coord = geo.coordinates.split(" "),
			parent = document.createElement("div"),
			map = document.createElement("div"),
			e = $.e,
			YandexLink = "\/\/maps.yandex.ru\/?ll=" + coord[1] + "," + coord[0] +"&pt=" + coord[1] + "," + coord[0] +"&z=14&l=map",
			place = geo.place || {};
		APIdogLink = "#place?id=" + (place.id || place.pid); // TODO: replace with Places.showPlaceInfo()
		map.className = "attachments-geo" + (geo.showmap || opts.map ? "-map" : "");
		if (geo.showmap || opts.map) {
			map.appendChild(e("a", {
				"class": "attachments-geo-linkmap",
				style: "background:url('\/\/static-maps.yandex.ru\/1.x\/?ll=" + coord[1] + "," + coord[0] + "&size=650,250&z=14&l=map&lang=ru-RU&pt=" + coord[1] + "," + coord[0] + ",vkbkm') center center no-repeat;",
				target: "_blank",
				href: YandexLink,
				append: e("div", {
					"class": "attachments-album-footer attachments-album-title sizefix",
					html: place.title || ""
				})
			}));
			parent.appendChild(map);
		}
		if (!opts.mail)
			parent.appendChild(e("a", {
				"class": "attachments-geo-plainlink",
				target: (!(place.id || place.pid)) ? "_blank" : "",
				style: "background:url(" + (place.icon || "about:blank") + ") no-repeat",
				href: (!(place.id || place.pid)) ? YandexLink : APIdogLink,
				html: place.title || place.address || Lang.get("im.attach_place")
			}));
		parent.onclick = function (event) {$.event.cancel(event)};

		return parent;
	},
	getStringActionFromSystemVKMessage: function (i) {
		var du = {first_name: "DELETED", last_name: "DELETED", first_name_gen: "DELETED", last_name_gen: "DELETED", first_name_acc: "DELETED", last_name_acc: "DELETED"},
			init = Local.data[i.from_id || i.user_id] || du,
			action = Local.data[i.action_mid] || du,
			l = Lang.get,
			act,
			basis;
		switch (i.action) {
			case "chat_kick_user":
				basis = l("im.message_action_kick_source");
				act = l("im.message_action_kick");
				if (i.action_mid === (i.from_id || i.user_id)) {
					basis = l("im.message_action_leave_source");
					act = l("im.message_action_leave");
				}
				break;

			case "chat_invite_user":
			case "action_email":
				basis = l("im.message_action_invite_source");
				act = l("im.message_action_invite");
				if (i.action_mid === (i.from_id || i.user_id)) {
					basis = l("im.message_action_return_source");
					act = l("im.message_action_return");
				}
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

		}
		return basis
			.replace(/%if/img, init.first_name.safe())
			.replace(/%il/img, init.last_name.safe())
			.replace(/%af/img, action.first_name.safe())
			.replace(/%al/img, action.last_name.safe())
			.replace(/%a/img, act[init.sex])
			.replace(/%u/img, l("im.message_action_user"))
			.replace(/%t/img, i.action_text)
	},

	itemAction: function (i, o) {
		var e = $.e,
			du = {first_name: "DELETED", last_name: "DELETED", first_name_gen: "DELETED", last_name_gen: "DELETED", first_name_acc: "DELETED", last_name_acc: "DELETED"},
			init = Local.data[i.from_id] || du,
			action = Local.data[i.action_mid] || du,
			l = Lang.get,
			parent = e("td", {colspan: 2, "class": "imdialog-item-action"}),
			t = e("div", {"class": "imdialog-item-action-text"}),
			basis,
			act,
			html;
		switch (i.action) {
			case "chat_kick_user":
				basis = l("im.message_action_kick_source");
				act = l("im.message_action_kick");
				if (i.action_mid === (i.from_id || i.user_id)) {
					basis = l("im.message_action_leave_source");
					act = l("im.message_action_leave");
				};
				break;
			case "chat_invite_user":
			case "action_email":
				basis = l("im.message_action_invite_source");
				act = l("im.message_action_invite");
				if (i.action_mid === (i.from_id || i.user_id)) {
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
			"if": "<a href='#" + init.screen_name + "'>" + Site.Escape(init.first_name),
			il: Site.Escape(init.last_name) + "</a>",
			af: "<a href='#" + action.screen_name + "'>" + Site.Escape(action.first_name_acc),
			al: Site.Escape(action.last_name_acc) + "</a>",
			a: act[init.sex],
			u: "",
			t: "<strong>" + Mail.Emoji(Site.Escape(i.action_text)) + "</strong>"
		});
		t.innerHTML = html;
		parent.appendChild(t);
		return e("tr", {append: parent});
	},



	itemSelect: function() {
		if (this.firstChild && this.firstChild.className === "__mail-deleted") {
			return;
		}

		$.elements.toggleClass(this, "imdialog-selected");
		if (IM.getSelectedMessagesCount() <= 100) {
			var actions = $.element("imdialog-actions");
			if (IM.getSelectedMessagesCount() > 0) {
				$.elements.removeClass(actions, "hidden");
				$.elements.addClass($.element("im-typing-wrap"), "hidden");
			} else {
				$.elements.addClass(actions, "hidden");
				$.elements.removeClass($.element("im-typing-wrap"), "hidden");
			}
		} else {
			$.elements.removeClass(this, "imdialog-selected");
			Site.Alert({text: Lang.get("im.warning_select_no_more_than_100_messages")});
		}
	},
	markMessagesAsImportant: function (event) {
		var checked = IM.getIdSelectedMessages();
		return IM.markAsImportant(checked, 1);
	},
	markMessagesAsUnImportant: function (event) {
		var checked = IM.getIdSelectedMessages();
		return IM.markAsImportant(checked, 0);
	},
	markAsImportant: function (message_ids, type) {
		Site.API("messages.markAsImportant", {
			message_ids: message_ids.join ? message_ids.join(",") : message_ids,
			important: type
		}, function (data) {
			if (!(daat = Site.isResponse(data)))
				return;
			for (var i = 0, l = data.length; i < l; ++i) {
				if (type)
					$.elements.addClass($.element("imdialog-message" + data[i]), "imdialog-important");
				else
					$.elements.removeClass($.element("imdialog-message" + data[i]), "imdialog-important");
			}
		})
	},


	getAttachments: function (objects, msgId) {
		var parent = document.createElement("div"), item, o, datas = {p: [], v: [], a: [], d: [], l: null, g: null, s: null, w: [], r: null, c: null};
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
					datas.w.push(Wall.getWallAttachment4Message(o));
					break;
				case "wall_reply":
					datas.r = Wall.getReplyAttachment(o.owner_id, o.post_id, o.id);
					break;
				case "chronicle":
					datas.c = IM.getChronicleItem(o);
					break;
				default:
					continue;
			}

		}

		if (datas.p.length) {
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
		})($.e("div", {"class": "__dynamic_photo_wrap"}), datas.p) : [];
		var attachments = (function (a, b) {
			for (var c in a) {
				if (Array.isArray(a[c]))
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
		if (datas.p && datas.p.children && datas.p.children.length === 1)
			datas.p.style.width = "100%";
		$.elements.append(parent, attachments);
		return parent;
	},
	photos: {},
	getDynamicPhotoAttachment: function (o, msgId) {
		o = Photos.v5normalize(o);

		o.list = "mail" + msgId;
		IM.photos[o.owner_id + "_" + o.id] = o;
		Photos.photos[o.owner_id + "_" + o.id] = o;
		var p = {};
		if (o.access_key)
			p.access_key = o.access_key;
		if (msgId)
			p.list = "mail" + msgId;
		p.from = "im?to=" + Site.Get("to");
		p = httpBuildQuery(p, true);

		var e = $.e, img, p = e(!o.n ? "a" : "div", {
			"class": "imdialog-attachment-item-photo-wrap",
			href: "#photo" + o.owner_id + "_" + o.id + (p ? "?" + p : ""),
			"data-photoid": o.owner_id + "_" + o.id,
			append: (img = e("img", {"class": "__dynamic_photo imdialog-attachment-item-photo", src: getURL(o.photo_604)}))
		});

		return p;
	},
	redrawDynamicPhotoAttachments: function () {
		var elements = document.querySelectorAll(".__dynamic_photo_wrap"),
			parent,
			getPhotoById = function (owner_id, id) {
				if (id)
					owner_id += "_" + id;
				return IM.photos[owner_id];
			},
			getId = function (photo) {
				return photo.owner_id + "_" + photo.id;
			},
			each = function (items, cb) {
				for (var i = 0, l = items.length; i < l; ++i)
					cb(items[i]);
			},
			width,
			photo,
			allWidth = 0,
			allHeigth = 0;

		for (var g = 0, k = elements.length; g < k; ++g) {
			parent = elements[g];
			width = $.getPosition(parent).width;
			width = width < 400 ? 400 : width;
			allWidth = 0;
			allHeight = 0;
			each(parent.children, function (item) {
				item = getPhotoById(item.getAttribute("data-photoid"));
				allWidth += item.width;
				allHeight += item.height;
			});
			for (var i = 0, l = parent.children.length; i < l; ++i) {
				child = parent.children[i];
				photo = getPhotoById(child.getAttribute("data-photoid"));
				//itemWidth = ((photo.width * width) / allWidth);
				itemWidth = (photo.width * 100 / width / 10) - (parent.children.length - 1 == i ? 1 : 3);
				//itemWidth = (itemWidth > photo.width ? photo.width : itemWidth);
				child.style.width = itemWidth + "%";
				child.style.height = "100%"; //((((itemWidth * 100) / photo.width) / 100) * photo.height) + "px";
			}
		}

	},
	dialogsContent: {},
	forwardingMessages: function (event) {
		IM.forwardMessagesIds = IM.getIdSelectedMessages();
		window.location.hash = "#mail";
	},
	deleteMessages: function (event) {
		var checked = IM.getIdSelectedMessages(), length = checked.length;
		VKConfirm(Lang.get("im.prompt_delete_messages").replace(/%n/img, length).replace(/%s/img, Lang.get("im", "messages", length)), function () {
			Site.API("messages.delete", {message_ids: checked.join(",")}, function (data) {
				if (!(data = Site.isResponse(data)))
					return;
				var item, e = $.elements.create, msg, isChat;
				for (var message_id in data) {
					msg = IM.storage[message_id];
					isChat = !!msg.chat_id;
					item = $.element("imdialog-message" + message_id);
					$.elements.clearChild(item);
					item.appendChild(e("td", {"class": "__mail-deleted", colspan: 2, append: [
						e("span", {"class": "tip", html: Lang.get("im.deleted")}),
						e("span", {"class": "a", html: Lang.get("im.restore"), onclick: (function (i) {
							return function (event) {
								IM.restoreMessage(i);
							};
						})(message_id)})
					]}));
				}
			});
		});
	},
	restoreMessage: function (message_id) {
		Site.API("messages.restore", {message_id: message_id}, function (data) {
			if (!data.response)
				return Site.Alert({text: Lang.get("im.error_cant_restore")});
			var item = $.element("imdialog-message" + message_id), msg = IM.storage[message_id];
			$.elements.clearChild(item);
			item.parentNode.insertBefore(IM.item(msg, {to: msg.chat_id ? -msg.chat_id : msg.user_id}), item);
			$.elements.remove(item);
		});
	},
	getAttachmentsMessageLongPoll: function (message_id) {
		var node = $.element("msg-attach" + message_id);
		if (node)
			node.appendChild($.e("img", {src: "\/\/static.apidog.ru\/im-attachload.gif"}))
		Site.API("execute", {
			code:'var msg=API.messages.getById({message_ids:%m%,v:5.18}).items[0];return{attachments:msg.attachments,forwarded:msg.fwd_messages,users:API.users.get({user_ids:msg.fwd_messages@.user_id+msg.fwd_messages@.fwd_messages@.user_id,fields:"photo_50,online,screen_name,sex"}),geo:msg.geo};'.replace(/%m%/ig, message_id)
		}, function (data) {
			data = Site.isResponse(data);
			/*          IM.AttachmentsObj[message_id] = {
							fwd: data[1],
							attachs: data[0],
							geo: data[3]
						};
			*/          if(!node)
				return;
			$.elements.clearChild(node);
			Local.add(data.users);
			node.appendChild(IM.getAttachments(data.attachments, "mail" + message_id));
			if(data.geo)
				node.appendChild(Wall.getGeoAttachment(data.geo, true));
			node.appendChild(IM.forwardedMessages(data.forwarded));
		});
	},

	forwardedMessages: function (messages) {
		var parent = document.createElement("div");
		if (!messages)
			return parent;
		parent.className = "im-fwds";
		for (var i = 0, l = messages.length; i < l; ++i)
			parent.appendChild(IM.forwardedMessagesItem(messages[i]));
		return parent;
	},
	forwardedMessagesItem: function (message) {
		var item = document.createElement("div"),
			user_id = message.user_id,
			user = Local.data[user_id] || false;
		item.className = "im-fwd-item";
		item.appendChild($.e("div", {"class": "im-fwd-right", append: [
			$.e("a", {"class": "bold _im_link_" + user_id, href: "#" + (user ? user.screen_name : "id" + user_id), html: (user ? user.first_name + " " + user.last_name + Site.isOnline(user) : "DELETED DELETED")}),
			$.e("span", {"class": "im-date-fwd", html: $.getDate(message.date)}),
			$.e("div", {"class": "im-text", html: !message.action ? Mail.Emoji(Site.toHTML(message.body)) : IM.getStringActionFromSystemVKMessage(message) }),
			IM.getAttachments(message.attachments, parseInt(new Date() / 1000)),
			IM.forwardedMessages(message.fwd_messages),
			message.geo ? IM.getMap(message.geo, {map: true, mail: true}) : null
		]}));
		if (!user)
			Site.queueUser(user_id);
		return item;
	},


	leaveFromChat: function (chat_id) {
		VKConfirm(Lang.get("im.prompt_leave_chat"), function () {
			Site.API("messages.removeChatUser", {chat_id: chat_id, user_id: API.userId}, function (data) {
				if (data.response) {
					Site.Alert({text: Lang.get("im.info_left_chat")});
					window.location.hash = "#mail";
				}
			});
		});
	},
	removeUserFromChat: function (chat_id, user_id, user_node) {
		var user = Local.data[user_id];
		VKConfirm(Lang.get("im.prompt_user_delete_from_chat")
		              .replace(/%f/img, user.first_name)
		              .replace(/%l/img, user.last_name)
		              .replace(/%a/img, Lang.get("im.prompt_user_delete_from_chat_action")[user.sex || 0]),
			function () {
				Site.API("messages.removeChatUser", {chat_id: chat_id, user_id: user_id}, function (data) {
					if (data.response) {
						Site.Alert({text: Lang.get("im.info_user_deleted").replace(/%fl/img, Site.Escape(user.first_name + " " + user.last_name))});
						$.elements.remove(user_node);
					};
				});
			});
	},
	getChangeChatPhotoForm: function (chat_id, chat) {
		if (!chat)
			return $.elements.create("div");
		var e = $.elements.create,
			photoNode,
			deleteBtn = e("span", {"class": "fr a", html: Lang.get("im.chat_photo_delete"), onclick: function (event) {
				IM.deleteChatPhoto(chat_id, {photoNode: photoNode, deleteButton: deleteBtn});
			}}),
			head = Site.getPageHeader(Lang.get("im.chat_photo"), chat.photo_50 ? deleteBtn : null),
			iframe = e("iframe"),
			parent = e("table");
		iframe.name = "__im-photo-chat-uploader";
		iframe.id = "__im-photo-chat-uploader";
		iframe.className = "hidden";
		iframe.onload = function (event) {IM.onLoadSetChatPhotoEventListener(this, chat_id)};
		iframe.src = "about:blank";
		parent.className = "imdialog-set-photo-wrap";
		parent.appendChild(e("tr", {append: [
			e("td", {"class": "imdialog-set-photo", append: [photoNode = e("img", {src: chat.photo_50 ? getURL(chat.photo_50) : Mail.DEFAULT_CHAT_IMAGE})]}),
			e("td", {append: [
				Site.createFileChooserButton("file", {fullWidth: true}),
				e("input", {type: "submit", value: Lang.get("im.chat_photo_upload")}),
			]})
		]}));
		return e("form", {
			append: [head, parent, iframe],
			enctype: "multipart/form-data",
			method: "post",
			action: "/upload.php?act=photo_chat&chat_id=" + chat_id,
			target: "__im-photo-chat-uploader",
			id: "__chat_info_photo_" + chat_id
		});
	},
	deleteChatPhoto: function (chat_id, nodes) {
		VKConfirm(Lang.get("im.prompt_chat_photo_delete"), function () {
			Site.API("messages.deleteChatPhoto", {chat_id: chat_id}, function (data) {
				if (data.response) {
					Site.Alert({text: Lang.get("im.info_chat_photo_deleted")});
					nodes.photoNode.src = Mail.DEFAULT_CHAT_IMAGE;
					$.elements.remove(nodes.deleteButton);
				}
			});
		});
	},
	onLoadSetChatPhotoEventListener: function (e, chat_id) {
		if (getFrameDocument(e).location.href === "about:blank")
			return;

		Site.API("messages.setChatPhoto", {
			file: data,
			fields: "photo_50,screen_name,can_write_private_message,online,last_seen,sex"
		}, function (data) {
			if (data.response) {
				IM.chats[chat_id] = data.response.chat;
				Site.Alert({text: Lang.get("im.info_successfully_uploaded")});
				var form = IM.getChangeChatPhotoForm(chat_id, data.response.chat),
					old = $.element("__chat_info_photo_" + chat_id);
				old.parentNode.insertBefore(form, old);
				$.elements.remove(old);
			}
		});
	},


	notifyAudio: null,
	notify: function () {
		if (!(API.bitmask & 64))
			return;

		if (!IM.notifyAudio) {

			var format, n = new Audio();
			if (n.canPlayType("audio/mpeg"))
				format = "mp3";
			else if (n.canPlayType("audio/ogg"))
				format = "ogg";
			else
				return;
			n.src = "\/\/static.apidog.ru\/v6.3/notify." + format;
			IM.notifyAudio = n;
		};
		n = IM.notifyAudio;
		if (n.src)
			n.play();
	},



	convert2peer: function (to) {
		return to > 0 ? to : 2000000000 + -to;
	},

	getAttachmentsDialog: function (to) {

		var e = $.e,
			list,
			items = [],
			filter = "photo",
			accepted = ["photo", "video", "audio", "doc"],
			r = Array.prototype.forEach,
			currentPositionLoaded = 0,
			currentPosition = 0,
			nextFrom = "",
			load = function (o) {
				Site.APIv5("messages.getHistoryAttachments", {
					peer_id: IM.convert2peer(to),
					media_type: filter,
					start_from: nextFrom,
					count: 50,
					v: 5.49
				}, function (d) {
					d = Site.isResponse(d);
					if (!d || !d.items.length) return;
					var oldLength = items.length;
					nextFrom = d.next_from;
					//currentPositionLoaded += d.length;

					d = d.items;

					items = items.concat(d);
					if (!o) $.elements.clearChild(list);
					show(items, oldLength);
				});
			},

			audioLid = Audios.createList([]).lid,

			setFilter = function (f) {
				filter = f;
				$.elements.clearChild(list);
				items = [];
				nextFrom = "";
				load(0);
			},

			show = function (data, fromPosition) {
				var i = fromPosition, item, a, node, size = 0, empty;
				while (item = data[i++]) {
					size++;
					if (filter && filter !== item.type)
						continue;
					a = item[item.type];
					switch (item.type) {
						case "photo":
							node = Photos.getAttachment(a, {options: "im_photo_attachment"});
							break;
						case "video":
							node = Video.getAttachment(a, {from: true});
							break;
						case "audio":
							Audios.Data[a.owner_id + "_" + a.id] = a;
							Audios.Lists[audioLid].push(a);
							node = Audios.Item(a, {lid: audioLid});
							break;
						case "doc":
							node = Docs.item(a, {type: 1});
							break;
						default:
							console.info("Skipped: Attachment<" + item.type + ">: ", item[item.type]);
							continue;
					};
					list.appendChild(node);
				};
				if (!size)
					list.appendChild(empty = Site.getEmptyField(Lang.get("im.attach_view_noone")));
				if (nextFrom) {
					list.appendChild(Site.getNextButton({
						click: function (event) {
							event.preventDefault();
							if (empty) $.elements.remove(empty);
							load(1);
							$.elements.remove(this);
							return false;
						},
						text: Lang.get("im.next")
					}));
				};
			},
			parent = e("div", {append: [
				Site.getPageHeader(
					Lang.get("im.attach_view"),
					Site.CreateDropDownMenu(Lang.get("im.attach_view_filter"), (function (a, b) {
						a[b("im.attach_view_photo")] = function (event) { setFilter("photo") };
						a[b("im.attach_view_video")] = function (event) { setFilter("video") };
						a[b("im.attach_view_audio")] = function (event) { setFilter("audio") };
						a[b("im.attach_view_doc")] = function (event) { setFilter("doc") };
						return a;
					})({}, Lang.get))
				),
				list = e("div", {append: Site.Loader(true)})
			]});
		load(0);

		Site.append(parent);
		Site.setHeader(Lang.get("im.attach_view"), {link: "im?to=" + to});
	},
	Resolve: function (a) {
		if (a === "mail")
			Mail.explain();
		else
			IM.explain(Site.Get("to"));
	},
	requestScroll: function (force) {
		if (IM.isAsVK() && (force || Site.getScrolled() < document.documentElement.offsetHeight - document.documentElement.clientHeight * 1.5))
			window.scrollTo(0, document.documentElement.offsetHeight);
	},

	getChronicleItem: function (o) {
		var e = $.e;console.log(o)
		return e("div", {append: [
			e("img", {
				title: o.label,
				src_big: getURL(o.src_big),
				src: getURL(o.src_blur),
				style: "cursor: pointer",
				onclick: function (event) {
					if (this.src === this.getAttribute("src_big"))
						return;
					this.src = this.getAttribute("src_big");
					this.style.width = "100%";
					this.style.maxWidth = "604px";
				}
			})
		]});
	}
};
