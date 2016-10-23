/**
 * APIdog v6.5
 *
 * upd: -1
 */

var IM = {
	storage: {},
	storageCount: {},

	explain: function (to) {
		switch (Site.get("act")) {
			case "upload_photo":
				IM.showUploadFormMessagePhoto(to);
				break;

			case "attachMap":
				IM.attachMap(to);
				break;

			case "attachments":
				IM.getAttachmentsDialog(to);
				break;

			default:
				if (!to)
					return window.location.hash = "#mail";
				IM.show(to);
		}
	},

	isAsVK: function () { return !isMobile && isEnabled(32768); },

	attachs: {},
	geo: {},

	page: function () {







		var parent = document.createElement("div"),
			list = document.createElement("div"),
			attachments = document.createElement("div");
		parent.id = "_mail";
		list.id = "_im-wrap";
		attachments.id = "_im-attachments";
		attachments.className = "hidden";

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
			};
			window.onResizeCallback = IM.onResizeFullVersion;
		};
		parent.appendChild(list);
		parent.appendChild(attachments);
		IM.dd.init();
		Site.Append(parent);
	},


	show: function(peerId, extra) {
		var e = $.e,
			form = IM.createSendForm(peerId),
			list = IM.createListMessages(peerId),
			listNode = list.node,
			listWrap,
			wrap = e("div", {
				"class": "im-wrapper",
				append: [
					form.node,
					listWrap = $.e("div", {"class": "imdialog-list-wrapper", append: listNode})
				]
			}),
			peer = parsePeer(peerId), // [type, id]
			id = toPeerId(peerId), // 1, -1, 200000001

			isFull = isEnabled(APIDOG_SETTINGS_DIALOGS_REVERSE),

			currentOffset = 0,
			isFirst = true,

			load = function() {
				new APIRequest("execute", {
					code: 'var p=Args.p,m=API.messages.getHistory({peer_id:p,count:60,offset:Args.o,v:5.52}),c=[],g=[];if(Args.r!=0){API.messages.markAsRead({peer_id:p,v:5.52});};if(Args.c!=0){c=API.messages.getChat({chat_ids:p-2000000000,fields:Args.f});};if(Args.g!=0){g=API.groups.getById({group_id:p});};return{dialog:m,users:API.users.get({user_ids:m.items@.user_id+m.items@.action_mid+c.users@.invited_by+p,fields:Args.f}),chats:c,groups:g};',
					p: id,
					r: isEnabled(2) ? 1 : 0,
					f: "photo_100,screen_name,can_write_private_message,online,last_seen,sex,blacklisted,first_name_gen,last_name_gen,first_name_acc,last_name_acc,sex,blacklisted",
					o: parseInt(currentOffset),
					c: +(peer[0] === APIDOG_DIALOG_PEER_CHAT && !(peerId in Local.Users)),
					g: +(peer[0] === APIDOG_DIALOG_PEER_GROUP && !(peerId in Local.Users))
				}).setOnCompleteListener(function(result) {
					Local.add(result.users);
					Local.add(result.groups);
					Local.add(result.chats);

					setPeerInfo();

					result = result.dialog;

					currentOffset += result.items.length;
					insert(parse(result.items, VKMessage), result.count, Math.max(result.in_read, result.out_read));

					if (isFirst && isFull) {
						listWrap.scrollTo(0, 999999);
						isFirst = false;
					};

				}).setOnErrorListener(function(e) {
					console.error(e);
				}).execute();
			},
			setPeerInfo = function() {
				var t, u = Local.Users[id], l;
				console.log(id, peer);
				switch (peer[0]) {
					case APIDOG_DIALOG_PEER_USER:
						t = getName(u);
						l = u.screen_name;
						break;

					case APIDOG_DIALOG_PEER_GROUP:
						t = u.name.safe();
						l = u.screen_name;
						break;

					case APIDOG_DIALOG_PEER_CHAT:
						t = u.title.safe();
						break;

					default: t = "unknown";
				};
				form.headName.innerHTML = t;
				form.head.onclick = function() {
					if (l) {
						nav.go(l);
					} else {
						IM.showChatInfo(peer[1]);
					};
				}
			},
			insert = function(messages, count, readUntil) {
				messages.forEach(function(message) {
					if (!isFull) {
						listNode.appendChild(message.getNode());
					} else {
						listNode.insertBefore(message.getNode(), listNode.firstChild);
					};
				});
			};


		load();
		Site.append(wrap).setHeader(lg("im.dialog"), "mail");
		IM.setHandlers(isFull, form, list, listWrap, load);
	},

	setHandlers: function(isFull, form, list, listWrap, load) {
		var menu = $.element("dog-menu");
		if (!isFull) {
			(window.onResizeCallback = function(event) {
				var vh = document.documentElement.clientHeight,
					fs = $.getPosition(form.node),
					fh = fs.top + fs.height;

				listWrap.style.height = (vh - fh) + "px";
				menu.style.height = (vh - 50) + "px";
			})();
		} else {
			(window.onResizeCallback = function(event) {
				var vh = document.documentElement.clientHeight,
					fh = form.node.clientHeight;

				form.node.parentNode.style.height = (vh - 50) + "px";
				listWrap.style.height = (vh - 50 - fh) + "px";
				form.node.style.position = "absolute";
				form.node.style.bottom = "0";
				form.node.style.width = "100%";
				form.node.style.left = "0";
				form.node.style.right = "0";
				menu.style.height = (vh - 50) + "px";
			})();
		};

		setSmartScrollListener(listWrap, function(reset) {
			load();
			reset();
		}, isFull);

		window.onLeavePage = function() {
			menu.style.height = "auto";
		};
	},

	createSendForm: function(peerId) {
		var e = $.e,
			send = function(event) {
				event && event.preventDefault();
				actionspace.cAttach.clear();
				//actionspace.cSmile.close();
				VKMessage.send({
					peerId: peerId,
					text: textarea.value.trim(),
					attachments: actionspace.cAttach.getAttachmentString(),
					geo: actionspace.cAttach.getGeo()
				});
				textarea.value = "";
				return false;
			},
			head,
			headName = e("span", { id: "g-title-dialog-" + peerId, html: "peer " + peerId }),
			headActions = IM.getActions(peerId),
			form,
			textarea = IM.createTextarea(peerId, {
				send: send
			}),
			actionspace = IM.createActionspace(peerId, {
				send: send
			}),
			wrap = e("form", {id: "g-form-dialog-" + peerId, append: [
				head = Site.getPageHeader(headName, headActions),
				form = e("div", {"class": "im-formsend", append: [
					textarea,
					actionspace.node
				]})
			]});

		$.elements.addClass(head, "im-formsend-title");


		$.event.add(wrap, "submit", send);

		return {
			node: wrap,
			head: head,
			headName: headName
		};
	},

	createTextarea: function(peerId, extra) {
		var textarea = $.e("textarea", {
			"class": "sizefix im-textfield",
			name: "message",
			placeholder: lg("im.formTextareaPlaceholder"),
			autofocus: true,
			html: $.localStorage("im_text_" + peerId) || "",
			id: "im-sendtext"
		});

		$.event.add(textarea, "keydown", function(event) {

			var now = Date.now() / 1000;

			if (event.keyCode !== KeyboardCodes.ENTER && (isEnabled(APIDOG_SETTINGS_SEND_TYPING) && !IM.lastTyping || IM.lastTyping + 5 < now)) {

				new APIRequest("messages.setActivity", {type: "typing", peer_id: toPeerId(peerId), v: 5.52}).execute();
				IM.lastTyping = now;
				return;
			};

			if (event.keyCode === KeyboardCodes.ENTER) {
				if (
					(isEnabled(APIDOG_SETTINGS_SEND_BY_ENTER) && !event.ctrlKey && !event.metaKey && !event.shiftKey)
					||
					(!isEnabled(APIDOG_SETTINGS_SEND_BY_ENTER) && (event.ctrlKey || event.metaKey))
				) {
					extra.send();
					event.preventDefault();
					return false;
				} else {
					return true;
				};
			};

		});

		$.event.add(textarea, "keyup", function(event) {
			$.localStorage("im_text_" + peerId, textarea.value);
		});

		return textarea;
	},

	createActionspace: function(peerId) {
		var e = $.e,
			left = e("div", {"class": "fl im-actionspace-left"}),
			right = e("div", {"class": "fr im-actionspace-right"}),
			nAttachments = e("input", {type: "hidden", name: "attachments", value: ""}),
			wrap = e("div", {"class": "im-actionspace clearfix", append: [left, right, nAttachments] }),

			cSmile = new SmileController(),
			cAttach = new AttachmentController({
				peerId: toPeerId(peerId),
				maxCount: 10,
				methods: {
					photo: "photos.getMessagesUploadServer",
					document: "docs.getWallUploadServer"
				},
				onSelect: function(result) {
					nAttachments.value = nAttachments.value.split(",").filter(function(v) { return !!v; }).concat(result.map(function(v) {
						return v.getAttachId();
					}));
				}
			}),

			attachNode = cAttach.getNode();

		$.elements.addClass(attachNode.firstChild, "im-actionbutton");

		right.appendChild(e("input", {type: "submit", name:"sendbutton", value: lg("im.formSend")}));
		left.appendChild(cSmile.getNode());
		left.appendChild(attachNode);

		return {
			node: wrap,
			cSmile: cSmile,
			cAttach: cAttach
		};
	},

	createListMessages: function(peerId) {
		var e = $.e,
			wrap = e("table", {id: "g-messages-list" + peerId});

		return {
			node: wrap
		};
	},

	showChatInfo: function(peerId) {
		var
			e = $.e,

			chat,

			uiUsers = e("div", {"class": "im-dialog-users", append: getLoader()}),
			uiSettings = e("div", {"class": "im-dialog-settings", append: getLoader()}),
			wrap = new TabHost([
				{
					name: "users",
					title: lg("im.chatInfoUsers"),
					content: uiUsers
				},
				{
					name: "settings",
					title: lg("im.chatInfoSettings"),
					content: uiSettings
				},
			]),

			modal = new Modal({
				title: lg("im.chatInfoTitle").schema({t:"..."}),
				content: wrap.getNode(),
				noPadding: true,
				footer: [{
					name: "close",
					title: lg("general.close"),
					onclick: function() {
						this.close();
					}
				}]
			}),

			load = function() {
				new APIRequest("execute", {
					code: "var i=parseInt(Args.c),c=API.messages.getChat({chat_id:i,v:5.52,fields:\"online\"});return{c:c,u:API.users.get({user_ids:c.users@.id+c.users@.invited_by,fields:Args.f})};",
					c: peerId,
					f: "online,photo_100,photo_50,screen_name,first_name_gen,last_name_gen,sex"
				}).setOnCompleteListener(function(result) {
					Local.add(result.u);

					showUsers(result.c.users);
					showSettings(result.c);

					modal.setTitle(lg("im.chatInfoTitle").schema({t: result.c.title.safe().emoji()}));
				}).execute();
			},

			showUsers = function(users) {
				$.elements.clearChild(uiUsers);
				users.forEach(function(user) {
					// TODO!
					// There will be multiline item with name of inviter and button for kick
					// from chat for admins
					uiUsers.appendChild(Templates.getMiniUser(Local.Users[user.id]));
				});
			},

			showSettings = function(chatapi) {
				$.elements.clearChild(uiSettings);

				chat = new VKChat(chatapi);

				uiSettings.appendChild(getTitleForm());
				uiSettings.appendChild(getNotificationsForm());
			},

			getTitleForm = function() {
				var lHead = Site.getPageHeader(lg("im.chatInfoFormTitleHead")),
					lForm = Site.getInlineForm({
						title: lg("im.chatInfoFormTitleChange"),
						name: "title",
						value: chat.title,
						onsubmit: function() {
							event.preventDefault();
							chat.edit(this.title.value.trim(), function() {
								new Snackbar({text: lg("im.chatInfoFormTitleEdited")}).show();
							});
							return false;
						}
					});
				lForm.style.padding = "10px"; // ух ебать костыль нахуй
				return e("div", {append: [lHead, lForm]});
			},

			getNotificationsForm = function() {
				var lHead = Site.getPageHeader(lg("im.chatInfoFormNotificationsHead")),
					disabled = chat.settings.disabled,
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
						};
					},

					showSelectDateUntilNotificationsWillBeDisabled = function(onSelected) {
						var dateChooser,
							modal = new Modal({
								width: 400,
								title: lg("im.chatInfoFormNotificationsModalTitle"),
								content: (dateChooser = createInputDate({name: "untilDate"}, (Date.now() / 1000) + (24 * 60 * 60))).node,
								footer: [
									{
										name: "ok",
										title: lg("im.chatInfoFormNotificationsModalOk"),
										onclick: function() {
											onSelected(dateChooser.getValue());
											this.close();
										}
									},
									{
										name: "cancel",
										title: lg("general.cancel"),
										onclick: function() {
											this.close();
										}
									}
								]
							}).show();
					},

					updateButtonText = function() {
						lButton.value = lg(disabled ? "im.chatInfoFormNotificationsEnable" : "im.chatInfoFormNotificationsDisable");
						lInfo.innerHTML = disabled
										? disabled < 0
											? lg("im.chatInfoFormNotificationsDisabledEver")
											: lg("im.chatInfoFormNotificationsDisabledUntil").schema({d: $.getDate(disabled)})
										: lg("im.chatInfoFormNotificationsEnabled");
					},

					sendNewNotificationsSettings = function(disabledUntil) {
						// TODO: переделать под всех, а не только под конфы
						var time = disabledUntil <= 0 ? disabledUntil : disabledUntil - parseInt(Date.now() / 1000);
						console.log(chat);
						chat.setSilenceMode(disabledUntil, function() {
							lButton.disabled = false;
							disabled = disabledUntil;
							updateButtonText();
						}).execute();
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
				return e("div", {append: [lHead, lForm]});
			};

		modal.show($.element("g-title-dialog-c" + peerId));
		load();
	},

	getActions: function(peerId) {
		peerId = toPeerId(peerId);

		var menu = {};

		menu["read"] = {
			label: lg("im.actionReadDialog"),
			onclick: function() {
				IM.readDialog(peerId);
			}
		};

		menu["attachments"] = {
			label: lg("im.actionAttachments"),
			onclick: function() {
				IM.showAttachments(peerId);
			},
			isDisabled: true
		};

		menu["leave"] = {
			label: lg("im.actionLeaveChat"),
			onclick: function(item) {
				VKConfirm(lg("im.leaveChatConfirmTitle"), lg("im.leaveChatConfirm"), function() {
					IM.leaveChat(peerId - APIDOG_DIALOG_PEER_CHAT_MAX_ID)
				}, item.node());
			},
			isHidden: peerId < APIDOG_DIALOG_PEER_CHAT_MAX_ID
		};

		menu["goto"] = {
			label: lg("im.actionGoTo"),
			onclick: function() {
				IM.openGoToDateWindow();
			},
			isDisabled: true
		};

		menu["search"] = {
			label: lg("im.actionSearch"),
			onclick: function() {
				IM.openSearchWindow(peerId);
			},
			isDisabled: true
		};

		menu["delete"] = {
			label: lg("im.actionDeleteDialog"),
			onclick: function(item) {
				VKConfirm(lg("im.deleteDialogConfirmTitle"), lg("im.deleteDialogConfirm"), function() {
					IM.deleteDialog(peerId);
				}, item.node());
			}
		};

		return new DropDownMenu(lg("general.actions"), menu).getNode();
	},

	readDialog: function(peerId) {
		new APIRequest("messages.markAsRead", {
				peerId: peerId,
				v: 5.52
			})
		.debug()
			.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
			.setOnCompleteListener(function(data) {

			})
			.execute();
	},

























	onResizeFullVersion: function (event) {
		var w = event.content.width + "px";
		g("mail-header").style.width = w;
		g("mail-writeform").style.width = w;
		g("im-list" + Site.Get("to")).style.marginBottom = $.getPosition(g("mail-writeform")).height + "px";
	},

	dd: {
		init: function () {

return; // @todo

			var body = getBody(),
				block,
				showBlock = function () {
					if (block)
						return;
					body.appendChild(block = $.e("div", {"class": 'uploadblock __dropzone'}));
				},
				closeBlock = function () {
					block && $.elements.remove(block);
					block = null;
				};
			window.onDragEnter = function (event) {
				showBlock();
			};
			window.onDragLeave = function (event) {
				if (event.target == block)
					closeBlock();
			};
			window.onDropped = function (event) {
				var e = event.dataTransfer;
				closeBlock();
				if (!e.files.length)
					return;
				IM.onDroppedFiles(e.files);
			};
		},
	},



	chats: {},
	createIM: function (peer) {
		var wrap = $.element("_im-wrap"),
			peerId = peer.join(""),
			page = document.createElement("div"),
			actions = (function (a, b) {

				b[a("im.action_mark_readed")] = function (event) {
					Site.API("messages.markAsRead", { peer_id: toPeerId(peer) }, "blank");
				};

				b[a("im.action_attachments")] = function (event) {
					window.location.hash = "#im?to=" + peer + "&act=attachments";
				};

/*				b[a("im.action_analyze_dialog")] = function (event) {
					window.location.hash = "#analyzes/dialog/" + to;
				};
*/
				if (peer[0] === APIDOG_DIALOG_PEER_CHAT) {
					b[a("im.chat_leave_chat")] = function (event) {
						IM.leaveFromChat(peer[1]);
					};
				};

				if (!IM.isAsVK()) {
					b[a(!Site.Get("force") ? "im.action_enable_pagination" : "im.action_disable_pagination")] = function (event) {
						window.location.hash = !Site.Get("force")
							? "#im?to=" + peerId + "&force=1"
							: "#im?to=" + peerId;
					};
				};

				b[a("im.action_delete_dialog")] = function (event) {
					VKConfirm("Вы уверены, что хотите <strong>удалить</strong> диалог?", function () {
						Site.API("messages.deleteDialog", {
							count: 10000,
							user_id: toPeerId(peer)
						}, function (data) {
							if (!data.response) {
								return Site.Alert({text: data.error.error_msg});
							};

							Site.Alert({text: Lang.get("mail.deleted_dialog")});
							window.location.hash = "#mail";
						});
					});
				};
				return b;
			})(Lang.get, {}),
			header = Site.CreateHeader("<span id='_im_header'>&nbsp;<\/span>", Site.CreateDropDownMenu(Lang.get("general.actions"), actions)),
			form = IM.createForm(peer),
			list = document.createElement("table"),
			chat = document.createElement("div");

		header.id = "mail-header";
		$.elements.addClass(header, "a");
		list.id = "im-list" + peerId;
		list.className = "imdialog-list";
		list.appendChild(Site.Loader(true));
		chat.id = "_im_chatinfo";
		chat.className = "imdialog-chatinfo hidden";

		page.appendChild(form);
		page.appendChild(list);
		page.id = "_im";

		$.elements.clearChild(wrap);
		wrap.appendChild(header);
		wrap.appendChild(page);
		wrap.appendChild(chat);
		Site.SetHeader(Lang.get("im.dialog"), {link: "mail"});

		if (!isMobile && $.element("im-text")) {
			$.element("im-text").focus();
		};

		if (IM.isAsVK()) {
			IM.onResizeFullVersion({content: $.getPosition($.element("content"))});
		};
	},
	forwardMessagesIds: null,
	setHeight: function (textarea, holder) {
		setTimeout(function () {
			holder.innerHTML = Site.Escape(textarea.value).replace(/\n/img, "<br\/>");
			var h = holder.offsetHeight + 16;
			h = h < 55 ? 55 : h > 230 ? 230 : h;
			textarea.style.height = h + "px";
			textarea.style.overflow = h >= 230 ? "auto" : "hidden";
		}, 30);
	},

	// refactored 15.01.2016: added support dialogs with groups
	createForm: function (peer) {
		var e = $.elements.create,
			peerId = peer.join(""),
			to = peerId, // to do check list
			user = getObjectByPeer(peer),
			foot,
			holder,
			txt,
		f = e("form", {append: [
			e("div", {"class": "im-textfield-wrap sizefix", id: "mail-writeform", append: [
				txt = e("textarea", {
					"class": "sizefix im-textfield",
					name: "message",
					placeholder: Lang.get("im.enter_message"),
					autofocus: true,
					maxlength: 4096,
					onkeydown: function (event) {

						IM.setHeight(this, holder);
						var l = this.value.length;
						$.element("imtwl").innerHTML = l > 4000
							? "Остал" + $.textCase(4096 - l, ["ся", "ось", "ось"]) + " " + (4096 - l) + " " + $.textCase(4096 - l, ["символ", "символа", "символов"])
							: "";

						var now = (+new Date() / 1000);

						if (event.keyCode != KeyboardCodes.ENTER && ((API.SettingsBitmask & 2048) && !IM.lastTyping || IM.lastTyping + 5 < now)) {
							var opts = {type: "typing", peer_id: toPeerId(peer)};

							Site.API("messages.setActivity", opts, "blank");
							IM.lastTyping = now;
						};

						if (event.keyCode === KeyboardCodes.ENTER) {
							if ((API.SettingsBitmask & 8192) && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
								return this.form.onsubmit(event);
							} else if (!(API.SettingsBitmask & 8192) && (event.ctrlKey || event.metaKey)) {
								return this.form.onsubmit(event);
							} else {
								return true;
							};
						};

					},

					onkeyup: function (event) {
						$.localStorage("im_text_" + peerId, this.value);
					},

					html: $.localStorage("im_text_" + peerId) || "",
					id: "im-text"
				}),
			e("div", {"class": "imdialog-autoheight-holder", append: (holder = e("div"))}),
			e("span", {style: "color:red", id: "imtwl"}),
			e("div", {"class": "imdialog-attachments", id: "imdialog-attachments", append: [
				IM.forwardMessagesIds ? e("div", {"class": "imdialog-attach-item imdialog-fwdblock", append: [
					e("div", {"class": "imdialog-icon-general imdialog-icon-fwd fl"}),
					e("span", {html: IM.forwardMessagesIds.length + " " + Lang.get("im", "forwarded_messages", IM.forwardMessagesIds.length)}),
					e("div", {"class": "feed-delete", onclick: function (event) {
						$.elements.remove(this.parentNode);
						IM.forwardMessagesIds = null;
						f.fwd.value = "";
					}})
				]}) : null,
				IM.attachs[to] ? IM.explainAttachments(IM.attachs[to]) : null,
				IM.geo[to] ? IM.explainGeoAttachment(IM.geo[to]) : null
			]}),
			foot = e("div", {"class": "im-foot", append: [
					e("div", {"class": "fr", append: [
						e("div", {"class": "fr imdialog-attach-icon-wrap", append: [
							e("div", {"class": "imdialog-icon-general imdialog-icon-attachment"})
						], onclick: function (event) {
							if ($.element("_im-sel-type-attach")) {
								$.elements.remove($.element("_im-sel-type-attach"));
								return;
							}
							IM.getSelectTypeAttachment(to, foot, this);
						}}),
						e("div", {"class": "fr imdialog-attach-icon-wrap", append: [
							e("div", {"class": "imdialog-icon-general imdialog-icon-smile-button"})
						], onclick: function (event) {
							var node = $.element("imdialog-smiles");
							if (!node.children.length)
								node.appendChild(IM.getSmiles());

							$.elements.toggleClass(node, "hidden");
						}})
//                      e("div", {"class": "fr imdialog-icon-general imdialog-icon-map"})
					]}),
					e("div", {"class": "fl", append: [
						e("input", {"class": "fl", type: "submit", value: Lang.get("im.send"), name: "submitter"}),
						e("div", {"class": "fl tip im-typing", id: "im-typing-wrap", append: [
							e("span", {"class": "im-typing-text", id: "im-typing" + to, html: ""}),
							e("span", {id: "im-typing-points", html: ""})
						]}),
						e("div", {"class": "fl imdialog-actions hidden", id: "imdialog-actions", append: [
							e("input", {"class": "fl", type: "button", value: Lang.get("im.action_important"), onclick: IM.markMessagesAsImportant}),
							e("input", {"class": "fl", type: "button", value: Lang.get("im.action_unimportant"), onclick: IM.markMessagesAsUnImportant}),
							e("input", {"class": "fl", type: "button", value: Lang.get("im.action_forward"), onclick: IM.forwardingMessages}),
							e("input", {"class": "fl", type: "button", value: Lang.get("im.action_delete"), onclick: IM.deleteMessages}),
						]})
					]})
				]}),
				e("div", {id: "imdialog-smiles", "class": "imdialog-emotions hidden"}),
				e("input", {type: "hidden", name: "fwd", value: IM.forwardMessagesIds ? IM.forwardMessagesIds.join(",") : ""}),
				IM.getHiddenInputWithAttachments(to, IM.attachs[to] ? IM.attachs[to] : []),
			]}),
		]});

		if (peer[0] === APIDOG_DIALOG_PEER_USER && user && user.blacklisted) {
			f.style.display = "none";
			$.elements.remove(txt);
		};

		f.onsubmit = function (event) {
			try {
				var c = IM.geo[to] || ["", ""];
				IM.send(peer, {
					text: this.message.value,
					fields: [this.message],
					fwd: this.fwd.value,
					attachments: this.attachments.value,
					lat: c[0],
					"long": c[1]
				});
				this.fwd.value = "";
				this.message.style.height = "55px";
				this.attachments.value = "";
				IM.geo[to] = null;
				$.elements.clearChild($.element("imdialog-attachments"));
				event && event.preventDefault();
			} catch (e) {
				console.log("IM/submit: try/catch", e);
			};
			return false;
		};
		return f;
	},
	explainAttachments: function (attachs) {
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
					item.appendChild(Wall.getAttachment(Wall.posts[id]));
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
	},
	removeAttachment: function (to, attachment_id) {
		try {
			$.elements.remove($.element("imattachment" + attachment_id));
		} catch (e) {}

		var attachs = IM.attachs[to], item, newAttachs = [];
		if (!attachs)
			return;
		for (var i = 0, l = attachs.length; i < l; ++i) {
			item = attachs[i];
			if (item[0] + item[1] + "_" + item[2] != attachment_id)
				newAttachs.push(newAttachs);
		}
		IM.attachs[to] = newAttachs;
		$.element("imattachments" + to).value = IM.getHiddenInputWithAttachments(null, IM.attachs[to], true);
	},
	getHiddenInputWithAttachments: function (to, attachs, isString) {
		var str = [], id, c;
		for (var i = 0, l = attachs.length; c = attachs[i]; ++i) {
			id = c[1] + "_" + c[2] + (c[3] ? "_" + c[3] : "");
			str.push(attachs[i][0] + id);
		}
		return !isString ? $.e("input", {type: "hidden", name: "attachments", value: str.join(","), id: "imattachments" + to}) : str.join(",");
	},
	getSelectTypeAttachment: function (to, node, button) {
		var e = $.e, parent = document.createElement("div"), l = Lang.get;
		parent.id = "_im-sel-type-attach";
		parent.className = "dd dd-open";
		var items = [
			{t: l("im.attach_photo"), h: "photos" + "?to=" + to},
			{t: l("im.attach_video"), h: "videos" + "?to=" + to},
			{t: l("im.attach_audio"), h: "audio" + "?to=" + to}, // warning! audios in v=4.x
			{t: l("im.attach_doc"), h: "docs" + "?to=" + to},
			{t: l("im.attach_map"), f: IM.attachMap}
		],
		item = function (o) {
			return e("div", {"class": "dd-item", html: o.t, onclick: function (event) {
				o.f ? o.f(to) : (window.location.hash = "#" + o.h);
				$.elements.remove(parent);
			}});
		};
		if (to > 0)
			items.push({t: l("im.attach_gift"), h: "gifts?act=send&toId=" + to});
		parent.appendChild(e("div", {"class": "imdialog-attachment-arrow"}));
		for (var i = 0, l = items.length; i < l; ++i) {
			parent.appendChild(item(items[i]));
		}
		var pos = $.getPosition(button.parentNode);
		if (!IM.isAsVK())
			parent.style.top = (pos.height) + "px";
		else
			parent.style.top = -(items.length * 28 + 10) + "px";

		node.appendChild(parent);
	},

	getSelectedMessagesCount: function () {
		return document.querySelectorAll(".imdialog-selected").length;
	},

	getIdSelectedMessages: function () {
		var messages = document.querySelectorAll(".imdialog-selected"), message_ids = [];
		for (var i = 0, l = messages.length; i < l; ++i) {
			message_ids.push(+messages[i].getAttribute("data-message-id"));
		}
		for (var i = 0, l = messages.length; i < l; ++i) {
			$.elements.removeClass(messages[i], "imdialog-selected");
		}
		$.elements.addClass($.element("imdialog-actions"), "hidden");
		$.elements.removeClass($.element("im-typing-wrap"), "hidden");
		return message_ids;
	},

	userTyping: null,
	userTypingDots: null,
	USER_TYPING_INTERVAL_ANIMATION: 500,
	setUserTyping: function (user_id, chat_id, isList) {
		var element_id = chat_id ? -chat_id : user_id,
			element = $.element("im-typing" + element_id);
		if (!element)
			return;
		clearTimeout(IM.userTyping);
		var user = Local.Users[user_id];
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

	// refactored 15.01.2016: added support for dialogs with groups
	showDialog: function (peer, messages, offset) {
		var target = getObjectByPeer(peer),
			peerId = peer.join(""),
			node = $.element("im-list" + peerId),
			count = messages.count,
			messages = messages.items,
			i = 0,
			l = messages.length;
		$.element("_im_header").innerHTML = peer[0] != APIDOG_DIALOG_PEER_CHAT ? peer[0] == APIDOG_DIALOG_PEER_USER ? Site.Escape(target.first_name + " " + target.last_name) + Site.isOnline(target, 1) : Site.Escape(target.name) : Lang.get("im.chat") + " &laquo;" + Mail.Emoji(Site.Escape(target.title)) + "&raquo;";

		$.element("_im_header").onclick = function (event) {
			if (peer[0] != APIDOG_DIALOG_PEER_CHAT) {
				window.location.hash = "#" + (target.screen_name || "id" + target.id)
			} else {
			//	IM.showChatInfoOld();
			};
		};

		node.className = "imdialog-list " + (peer[0] != APIDOG_DIALOG_PEER_CHAT ? "imdialog-list-user" : "imdialog-list-chat");

		if (peer[0] == APIDOG_DIALOG_PEER_CHAT) {
			IM.getChatInfoNode($.element("_im_chatinfo"), peer[1], target.admin_id);
		};

		if (offset == 0 || Site.Get("force")) {
			$.elements.clearChild(node);
		};

		var newMsgIds = [];

		if (Site.Get("force")) {
			node.parentNode.insertBefore(Site.PagebarV2(Site.Get("offset"), count, 50), node);
		};

		if (IM.isAsVK()) {
			messages = messages.reverse();
		};

		messages.forEach(function (message) {
			if (!message.read_state)
				newMsgIds.push(message.id);
			node.appendChild(IM.item(message, {to: peer[1]}));
		});

		if (newMsgIds.length && ((API.SettingsBitmask & 2) != 0)) {
			Site.API("messages.markAsRead", {message_ids: newMsgIds.join(",")}, "blank");
		};

		if (!Site.Get("force"))
		{
			if (!IM.isAsVK() && offset + messages.length + 50 < count + 50)
				node.appendChild($.e("tr", {append: $.e("td", {colspan: 2, append: $.e("div", {"class": "button-block sizefix",
					html: Lang.get("im.next"),
					onclick: function (event) {
						$.event.cancel(event);
						if (this.disabled)
							return false;
						this.disabled = true;
						this.innerHTML = "...";
						IM.load(peer, node.children.length - 1, this);
						return false;
					}
				}) })}) );
		} else {
			node.parentNode.appendChild(Site.PagebarV2(Site.Get("offset"), count, 50));
		};

		window.onResizeCallback = function (args) {
			node.width = args.content.width;

			var mw = args.content.width - 88;
			mw += "px";
			Array.prototype.forEach.call(document.querySelectorAll(".imdialog-content"), function (e) {
				e.style.maxWidth = mw;
			});
			if (IM.isAsVK()) {
				IM.onResizeFullVersion(args);
			};
		};

		window.onResizeCallback({content: $.getPosition($.element("content"))});
		IM.requestScroll(true);

		var searchMsg = Site.Get("messageId");
		if (Site.Get("force") && (searchMsg = $.element("imdialog-message" + searchMsg))) {
			searchMsg.scrollIntoView();
			window.scrollBy(0, -50);
		};
	},

	prepareText: function (text) {
		try {
			var schemas = {
				"\\([cс]\\)":  "©",
				":ниггер:":     unescape("%uD83C%uDF1A"),
				"\\*луна\\*":   unescape("%uD83C%uDF1A"),
				"ghbdtn":       "привет",
				"jr":           "ок",
				"yt":           "не",
				"lf":           "да",
				"fuf":          "ага",
				"eue":          "угу",
				"kjk":          "лол",
				"дщд":          "lol",
				"vlf":          "мда",
				",kznm":        "блять",
				",kz":          "бля",
				"yf\\[eq":      "нахуй",
				"\\[eq":        "хуй"
			}, item;
			for (item in schemas)
				text = text.replace(new RegExp("(^|\\s)" + item + "(\\s|$)", "img"), "$1" + schemas[item] + "$2");
		} finally {
			return text;
		};
	},
	send: function (peer, o) {
		var p = {
			message: IM.prepareText(o.text),
			guid: parseInt(Math.random() * 10000000),
			v: 4.104,
			forward_messages: o.fwd,
			attachment: o.attachments,
			lat: o.lat,
			"long": o["long"]
		}, peerId = peer.join(""),
		f = IM.getIdSelectedMessages();

		IM.attachs[peerId] = [];

		if (f.length > 0 && !o.fwd) {
			p.forward_messages = f.join(",");
		};

		switch (peer[0]) {
			case APIDOG_DIALOG_PEER_USER: p.user_id = peer[1]; break;
			case APIDOG_DIALOG_PEER_CHAT: p.chat_id = peer[1]; break;
			case APIDOG_DIALOG_PEER_GROUP: p.user_id = -peer[1]; break;
		};

		for (var i = 0, l = o.fields.length; i < l; ++i)
			o.fields[i].value = "";

		IM.forwardMessagesIds = null;

		console.log("IM/send: ", p);

		if (!$.trim(p.message) && !$.trim(p.attachment) && !$.trim(p.forward_messages) && !p.lat && !p["long"])
			return false;

		p.message = p.message.replace(/apidog\.ru\/#/ig, "vk.com\/");

console.log(p);
/*		var uniqueId = Site.API("messages.send", p, function (data) {
			var messageId = Site.isResponse(data);
			$.localStorage("im_text_" + peerID, "")
			IM.clearUnreadMessagesFix(to);

			IM.sent(to, messageId, uniqueId);
		});
*/
		IM.showSendingMessage(to, p, uniqueId);
		IM.closeEmotions();
		IM.requestScroll(true);
	},
	getAttachmentByIds: function (type, ownerId, itemId, accessKey)
	{
		var id = ownerId + "_" + itemId, ide = id + "_" + accessKey;
		switch (type)
		{
			case "photo":
				return Photos.photos[id];

			case "video":
				return Videos.videos[id] || Video.videos[ide];

			case "audio":
				return Audios.Data[id];

			case "doc":
				return Docs.docs[id] || Docs.docs[ide];

			default:
				return false;
		};
	},
	showSendingMessage: function (to, msg, uniqueId)
	{
		var attachments = msg.attachment.split(",").map(function (i)
			{
				if (!i)
					return;
				i = /(photo|video|audio|doc)(-?\d+)_(\d+)/img.exec(i);
				return IM.getAttachmentByIds.apply(this, i);
			}),
			o = {body: msg.message, attachments: attachments, id: -uniqueId, date: Date.now() / 1000, read_state: 0, out: 1};
		if (to > 0) o.user_id = to; else { o.chat_id = Math.abs(to); o.user_id = API.uid; };
		var list = $.element("im-list" + to), q = IM.item(o, {sending: true, uniqueId: uniqueId, to: to});
		if (!IM.isAsVK())
			list.insertBefore(q, list.firstChild);
		else
			list.appendChild(q);
		window.onResizeCallback && window.onResizeCallback({content: $.getPosition($.element("content"))});
	},
	sending: {},
	sent: function (peerId, messageId, uniqueId)
	{
		if ($.element("imdialog-message" + messageId))
			return $.elements.remove(g("imdialog-message-" + uniqueId));
		var msg = document.querySelector(".msgSending" + uniqueId),
			time = msg.querySelector(".imdialog-time"),
			content = msg.querySelector(".imdialog-content");
		msg.setAttribute("data-message-id", messageId);
		msg.setAttribute("id", "imdialog-message" + messageId);
		time.innerHTML = IM.getTime(Date.now() / 1000);
		time.href = "#mail?act=item&id=" + messageId;
		content.appendChild($.e("div", {id: "msg-attach" + messageId}))
	},
	clearUnreadMessagesFix: function (to)
	{
		Array.prototype.forEach.call(document.querySelectorAll(".imdialog-unread.imdialog-dialog" + to + ":not(.imdialog-my)"),
		function (item)
		{
			$.elements.removeClass(item, "imdialog-unread")
		});
	},
	sendSticker: function (to, stickerId) {
		IM.requestScroll(true);
		var params = {sticker_id: stickerId, guid: random(0, 99999999)};
		if (to > 0) params.user_id = to; else params.chat_id = -to;
		Site.API("messages.sendSticker", params, function () {
			IM.requestScroll(true);
		});
	},
	getTime: function (unix) {
		unix = +unix + (window._timeOffset || 0);
		var date = new Date(unix * 1000), n2 = function (n) {return n < 10 ? "0" + n : n;};

		var isAnotherDay = (date / 1000) + (60 * 60 * 24) < new Date() / 1000;

		return !isAnotherDay ? date.getHours() + ":" + n2(date.getMinutes()) : n2(date.getDate()) + "." + n2(date.getMonth() + 1) + (new Date().getFullYear() != date.getFullYear() ? "." + date.getFullYear() : "");
	},
	n2: function (n) {return n < 10 ? "0" + n : n;},
	item: function (i, o) {
		return new VKMessage(i).getNode();
	},
	getMap: function (geo, opts) {
		opts = opts || {};

		var coord = geo.coordinates.split(" "),
			parent = document.createElement("div"),
			map = document.createElement("div"),
			e = $.e,
			YandexLink = "\/\/maps.yandex.ru\/?ll=" + coord[1] + "," + coord[0] +"&pt=" + coord[1] + "," + coord[0] +"&z=14&l=map",
			place = geo.place || {};
			APIdogLink = "#place?id=" + (place.id || place.pid);
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
			init = Local.Users[i.from_id || i.user_id] || du,
			action = Local.Users[i.action_mid] || du,
			l = Lang.get,
			act,
			lang;
		switch (i.action) {
			case "chat_kick_user":
				basis = l("im.message_action_kick_source");
				act = l("im.message_action_kick");
				if (i.action_mid == (i.from_id || i.user_id)) {
					basis = l("im.message_action_leave_source");
					act = l("im.message_action_leave");
				};
				break;
			case "chat_invite_user":
			case "action_email":
				basis = l("im.message_action_invite_source");
				act = l("im.message_action_invite");
				if (i.action_mid == (i.from_id || i.user_id)) {
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
		return basis
			.replace(/%if/img, init.first_name)
			.replace(/%il/img, init.last_name)
			.replace(/%af/img, action.first_name)
			.replace(/%al/img, action.last_name)
			.replace(/%a/img, act[init.sex])
			.replace(/%u/img, l("im.message_action_user"))
			.replace(/%t/img, i.action_text)
	},
	itemAction: function (i, o) {

	},
	itemSelect: function (event) {
		if (this.firstChild && this.firstChild.className == "__mail-deleted")
			return;
		$.elements.toggleClass(this, "imdialog-selected");
		if (IM.getSelectedMessagesCount() < 100) {

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
		};
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
			Local.AddUsers(data.users);
			node.appendChild(IM.getAttachments(data.attachments, "mail" + message_id));
			if(data.geo)
				node.appendChild(Wall.GeoAttachment(data.geo, true));
			node.appendChild(IM.forwardedMessages(data.forwarded));
		});
	},
	getMessageAttachmentsList: function (a){ return Site.Attachment(a) },
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
			user = Local.Users[user_id] || false;
		item.className = "im-fwd-item";
		item.appendChild($.e("div", {"class": "im-fwd-right", append: [
			$.e("a", {"class": "bold _im_link_" + user_id, href: "#" + (user ? user.screen_name : "id" + user_id), html: (user ? user.first_name + " " + user.last_name + Site.isOnline(user) : "DELETED DELETED")}),
			$.e("span", {"class": "im-date-fwd", html: $.getDate(message.date)}),
			$.e("div", {"class": "im-text", html: !message.action ? Mail.Emoji(Site.Format(message.body)) : IM.getStringActionFromSystemVKMessage(message) }),
			IM.getAttachments(message.attachments, parseInt(new Date() / 1000)),
			IM.forwardedMessages(message.fwd_messages),
			message.geo ? IM.getMap(message.geo, {map: true, mail: true}) : null
		]}));
		if (!user)
			Site.queueUser(user_id);
		return item;
	},
	getChatInfoNode: function (node, chat_id, adminId) {
		var chat = IM.chats[chat_id],
			e = $.elements.create,
			parent = document.createElement("div"),
			title = IM.getChangeTitleChatForm(chat_id, chat),
			members = IM.getMembersChatList(chat_id, chat && chat.users || [], adminId),
			photo = IM.getChangeChatPhotoForm(chat_id, chat);
		parent.id = "__chat_info_" + chat_id;
		if (chat.kick || chat.left) {

			parent.appendChild(Site.EmptyField([
				Lang.get("im.chat_kicked"),
				Lang.get("im.chat_left")
			][chat.kick ? 0 : 1]));

			return parent;
		};
		parent.appendChild(title);
		parent.appendChild(photo);
		parent.appendChild(members);
		node.appendChild(parent);
		return parent;
	},
	getChangeTitleChatForm: function (chat_id, chat) {
		if (!chat)
			return $.elements.create("div");
		return Site.CreateInlineForm({
			name: "title",
			placeholder: Lang.get("im.chat_title"),
			value: chat.title,
			type: "text",
			title: Lang.get("im.chat_title_save"),
			onsubmit: function (event) {
				var title = $.trim(this.title.value);
				if (!title) {
					Site.Alert({text: Lang.get("im.error_title_will_be_not_empty")});
					this.title.focus();
					return false;
				}
				Site.API("messages.editChat", {chat_id: chat_id, title: title}, function (data) {
					if (data.response)
						Site.Alert({text: Lang.get("im.info_chat_title_saved")});
				});
				return false;
			}
		})
	},
	isInChat: function (users) {
		for (var i = 0, l = users.length; i < l; ++i) {
			if (users[i].id == API.uid || users[i] == API.uid)
				return true;
		}
		return false;
	},
	getMembersChatList: function (chat_id, users, adminId) {
		var e = $.elements.create,
			parent = document.createElement("div"),
			isMember = IM.isInChat(users),
			invited_user, user_node;

		if (!isMember)
			return parent;

		parent.appendChild(Site.CreateHeader(Lang.get("im.chat_members"), isMember ? e("span", {"class": "a fr", html: Lang.get("im.chat_leave_chat"), onclick: function (event) {
			IM.leaveFromChat(chat_id);
		}}) : null));
		for (var i = 0, l = users.length; i < l; ++i) {
			invited_user = Local.Users[users[i].invited_by] || {};
			parent.appendChild(user_node = Templates.getUser(users[i], {
				fulllink: true,
				actions: [e("div", {"class": "tip", append: users[i].id != adminId ? [
					e("span", {html: Lang.get("im.chat_invited_by")[invited_user.sex || 2] + " "}),
					e("span", {"class": "a", html: Site.Escape(invited_user.first_name + " " + invited_user.last_name) + Site.isOnline(invited_user)})
				] : [ e("div", {"class": "tip", html: "Создатель беседы"}) ]})],
				close: invited_user.id == API.uid || API.uid == adminId ? (function (user_id, user_node) {return function (event) {
					IM.removeUserFromChat(chat_id, user_id, user_node.nextSibling);
					$.event.cancel(event);
					return false;
				}}) (users[i].id, user_node) : false
			}));
		}
		if (users.length < 50)
			parent.appendChild(e("div", {"class": "button-block", html: Lang.get("im.chat_invite_user"), onclick: function (event) {
				window.location.hash = "#friends?to=" + chat_id;
			}}));
		return parent;
	},
	leaveFromChat: function (chat_id) {
		VKConfirm(Lang.get("im.prompt_leave_chat"), function () {
			Site.API("messages.removeChatUser", {chat_id: chat_id, user_id: API.uid}, function (data) {
				if (data.response) {
					Site.Alert({text: Lang.get("im.info_left_chat")});
					window.location.hash = "#mail";
				}
			});
		});
	},
	removeUserFromChat: function (chat_id, user_id, user_node) {
		var user = Local.Users[user_id];
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
			head = Site.CreateHeader(Lang.get("im.chat_photo"), chat.photo_50 ? deleteBtn : null),
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
				Site.CreateFileButton("file", {fullwidth: true}),
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
		var data = $.JSON(getFrameDocument(e).getElementsByTagName("body")[0].innerHTML).response;
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
	showChatInfoOld: function () {
		var chat = $.element("_im_chatinfo"), dialog = $.element("_im");
		if ($.elements.hasClass(chat, "hidden")) {
			$.elements.addClass(dialog, "hidden");
			$.elements.removeClass(chat, "hidden");
		} else {
			$.elements.addClass(chat, "hidden");
			$.elements.removeClass(dialog, "hidden");
		}
	},
	setSmileTab: null,

	// temporary
	STICKERS_SCHEMA_THUMBNAIL: STICKERS_SCHEMA_THUMBNAIL,
	STICKERS_SCHEMA_IMAGE: STICKERS_SCHEMA_IMAGE,
	STICKERS_SCHEMA_BACKGROUND: STICKERS_SCHEMA_BACKGROUND,

	getEmotionsTabs: function (contents) {
		var tabs = document.createElement("div"), e = $.elements.create, selectedIndex = 0, nodes = [], item;

		if (!IM.stickersLoaded) {
			var fx = arguments.callee;
			setTimeout(function () {fx(contents)}, 500);
			return;
		};

		tabs.className = "imdialog-emotions-tabs";

		var smilesCallback = function (event) {
			for (var i = 0, l = tabs.children.length; i < l; ++i) {
				$.elements.removeClass(tabs.children[i], "imdialog-emotions-tab-active");
			};
			$.elements.addClass(tabs.children[0], "imdialog-emotions-tab-active");
			$.elements.clearChild(contents);
			IM.insertSmilesNode(contents);
			contents.style.background = "";
		};

		tabs.appendChild(e("div", {"class": "imdialog-emotions-tab", id: "imdialog-emotions-tab-0", onclick: smilesCallback, append: [
			e("div", {"class": "imdialog-icons imdialog-icon-smile-tab"})
		]}));

		tabs.appendChild(e("div", {"class": "imdialog-emotions-tab", id: "imdialog-emotions-tab-1", append: [
			e("div", {"class": "imdialog-icons imdialog-icon-recent-tab"})
		], onclick:  function (event) {
			IM.showStickersInCategory({
				node: contents,
				sticker_ids: IM.stickersLast,
				tabs: tabs,
				active_tab: 1,
				packId: 0
			});
		}}));


		nodes[1] = IM.stickersLast;

		for (var i = 0, l = IM.stickersAvailable.length; i < l; ++i) {
			item = IM.stickersAvailable[i];
			console.error(item, item.stickers)
			tabs.appendChild(e("div", {"class": "imdialog-emotions-tab", append: [
				e("img", {src: IM.STICKERS_SCHEMA_THUMBNAIL.replace(/%c/ig, item.id)})
			], onclick: (function (list, i, d) {return function (event) {
				IM.showStickersInCategory({
					node: contents,
					sticker_ids: list,
					tabs: tabs,
					active_tab: i + 2,
					packId: d
				});
			}})(item.stickers.sticker_ids, i, item.id)}));
			nodes[i + 2] = item.stickers.sticker_ids;
		};
		$.elements.addClass(tabs.children[0], "imdialog-emotions-tab-active");

/*		$.event.add(tabs, "wheel", function (event) {
			event.preventDefault();
			var direction = event.deltaY < 0 ? -1 : 1, old = selectedIndex;
			selectedIndex += direction;
			selectedIndex = selectedIndex <= 0 ? 0 : (selectedIndex < nodes.length ? selectedIndex : nodes.length - 1);

			if (selectedIndex <= 0)
				return old == selectedIndex ? null : smilesCallback();

			IM.showStickersInCategory({
				node: contents,
				sticker_ids: nodes[selectedIndex],
				tabs: tabs,
				active_tab: selectedIndex
			});
		});*/

		return tabs;
	},
	showStickersInCategory: function (o) {
		console.log(o)
		var node = o.node,
			list = o.sticker_ids,
			tabs = o.tabs,
			n    = o.active_tab,
			e    = $.elements.create;
		for (var i = 0, l = tabs.children.length; i < l; ++i) {
			$.elements.removeClass(tabs.children[i], "imdialog-emotions-tab-active");
		}
		$.elements.addClass(tabs.children[n], "imdialog-emotions-tab-active");
		$.elements.clearChild(node);

		var parent = document.createElement("div"),
			screen = document.createElement("div"),
			row = document.createElement("div"),
			screens = 0,
			points = IM.getNavigationPointsStickers(parseInt(list.length / 8), parent);
		parent.className = "selectfix";
		screen.className = "imdialog-emotions-screen";
		for (var i = 0, l = list.length; i < l; ++i) {
			if (i && (i % 4) == 0) {
				screen.appendChild(row);
				row = document.createElement("div");
			};
			if (i && (i % 8) == 0) {
				parent.appendChild(screen);
				screen = document.createElement("div");
				screen.className = "imdialog-emotions-screen";
				screens++;
			};
			screen.appendChild(IM.getStickerItem(list[i]));
		};


		var touch = new Hammer(parent),
			_x = 0,
			scroll = function (event) {
				event.preventDefault();
				var direction = event.deltaY > 0 ? -1 : 1,
					width = $.getPosition(parent).width,
					percent = (direction * width),
					value = _x + percent;

				if (-percent >= 30)
					_x -= 100;
				else if (percent >= 30)
					_x += 100;

				if (-_x <= 0)
					_x = 0;
				else if (-_x > screens * 100)
					_x += 100;

				$.elements.addClass(parent, "imdialog-emotions-frame-animation");

				Mail.setTransform(parent, "translateX(" + (_x) + "%)");
				IM.setActiveNavigationPointSticker(points, -(_x / 100));
				setTimeout(function () {
					$.elements.removeClass(parent, "imdialog-emotions-frame-animation");
				}, 300);


					// вверх - пред
					// вниз - след
			};

		node.style.backgroundImage = o.packId > 0 ? "url(" + IM.STICKERS_SCHEMA_BACKGROUND.replace(/%s/img, o.packId) + ")" : "none";

		$.event.add(parent, "wheel", scroll);


		touch.on("pan", function (event) {
			var width = $.getPosition(parent).width,
				distanceX = event.deltaX,
				percent = (distanceX * 100 / width),
				value = (_x + percent);

			if (-value < 0 || -value > screens * 100)
				value = _x + (percent * .5);

			Mail.setTransform(parent, "translateX(" + value + "%)");
		});
		touch.on("panend", function (event) {

			if (event.direction != Hammer.DIRECTION_LEFT && event.direction != Hammer.DIRECTION_RIGHT)
				return;

			var width = $.getPosition(parent).width,
				distanceX = event.deltaX,
				percent = (distanceX * 100 / width),
				value = _x + percent;

			if (-percent >= 30)
				_x -= 100;
			else if (percent >= 30)
				_x += 100;

			if (-_x <= 0)
				_x = 0;
			else if (-_x > screens * 100)
				_x += 100;

			$.elements.addClass(parent, "imdialog-emotions-frame-animation");

			Mail.setTransform(parent, "translateX(" + (_x) + "%)");
			IM.setActiveNavigationPointSticker(points, -(_x / 100));
			setTimeout(function () {
				$.elements.removeClass(parent, "imdialog-emotions-frame-animation");
			}, 300);
		});

		parent.appendChild(screen);
		new Hammer(node).on("pan", function (event) {
			event.srcEvent.stopPropagation();
		});
		node.appendChild(parent);
		node.appendChild(points);
	},
	getNavigationPointsStickers: function (count, parent) {
		var scroll = document.createElement("div"),
			e = $.e,
			item = function (translateX, selected) {
				var item = e("div", {"class": "imdialog-emotions-navigation-wrap", append: e("div", {"class": "imdialog-emotions-navigation-point"})});
				item.onclick = function (event) {
					$.elements.addClass(parent, "imdialog-emotions-frame-animation");
					Mail.setTransform(parent, "translateX(" + -translateX + "%)");
					$.elements.removeClass(document.querySelector(".imdialog-emotions-navigation-point-active"), "imdialog-emotions-navigation-point-active");
					$.elements.addClass(item, "imdialog-emotions-navigation-point-active");
					setTimeout(function () {
						$.elements.removeClass(parent, "imdialog-emotions-frame-animation");
					}, 300);
				};
				if (selected)
					$.elements.addClass(item, "imdialog-emotions-navigation-point-active");
				return item;
			};
		for (var i = 0; i < count; ++i) {
			scroll.appendChild(item(i * 100, i == 0));
		}

		scroll.style.width = (count * 22) + "px";
		scroll.className = "imdialog-stickers-points";

		return scroll;
	},
	setActiveNavigationPointSticker: function (points, page) {
		$.elements.removeClass(document.querySelector(".imdialog-emotions-navigation-point-active"), "imdialog-emotions-navigation-point-active");
		$.elements.addClass(points.children[page], "imdialog-emotions-navigation-point-active");
	},
	getTo: function () {
		return parseInt(Site.Get("to"));
	},
	getStickerItem: function (item) {
		var s = $.e("div", {"class": "imdialog-sticker-item", append: $.e("img", {src: (API.SettingsBitmask & 4 ? "\/\/static.apidog.ru\/proxed\/stickers\/%s%b.png" : IM.STICKERS_SCHEMA_IMAGE).replace(/%s/ig, item)})}),
			touch = new Hammer(s);
		touch.on("tap", function (event) {
			IM.requestScroll();
			IM.sendSticker(IM.getTo(), item);
			IM.closeEmotions();
		});
		return s;
	},
	stickersAvailable: [],
	stickersLoaded: false,
	stickersLast: [],
	saveStickers: function (data) {
		IM.stickersAvailable = data;
		IM.stickersLoaded = true;
	},
	saveLastStickers: function (data) {
		IM.stickersLast = data;
	},
	smiles: "D83DDE0A,D83DDE03,D83DDE09,D83DDE04,D83DDE06,D83DDE02,D83DDE0E,2764,D83DDE1A,D83DDE18,D83DDE19,D83DDE17,D83DDE0D,263A,D83DDE0F,D83DDE07,D83DDE0C,D83DDE14,D83DDE12,D83DDE15,D83DDE10,D83DDE29,D83DDE1F,D83DDE23,D83DDE16,D83DDE25,D83DDE13,D83DDE22,D83DDE2D,D83DDE2B,D83DDE11,D83DDE20,D83DDE21,D83DDE28,D83DDE2C,D83DDE1D,D83DDE1C,D83DDE0B,D83DDE31,D83DDE33,D83DDE35,D83DDE2F,D83DDE2E,D83DDE36,D83DDE08,D83DDC7F,D83DDE38,D83DDE39,D83DDE3C,D83DDE3D,D83DDE3E,D83DDE3F,D83DDE3B,D83DDE40,D83DDE3A,D83DDC4D,D83DDC4E,261D,270C,D83DDC4C,D83DDC4F,D83DDC4A,D83DDCAA,270B,D83DDC4B,D83DDE4F,D83DDC13,D83DDC36,D83DDC20,D83DDE48,D83DDE49,D83CDF39,D83CDF32,D83DDC94,D83DDC8C,D83DDC7B,D83DDC82,D83CDF4A,D83CDF77,D83CDF78,D83CDF4C,D83CDF45,D83CDF4E,D83CDF4F,D83CDF46,D83CDF54,D83CDF5E,D83DDD0A,D83CDF82,D83CDF83,D83CDF88,D83CDF89,D83CDF8A,26BD,D83CDFC1,D83CDFC6,23F3,D83DDCA1,D83DDCBB,D83DDCE2,D83DDD0E,D83DDD26,D83DDD1E,26A0,203C,2705,274E,2716,2709,D83DDCBE,2728,D83CDF1A,D83CDF1D,D83CDF1E,D83CDFE6,2744,26C5,2601,D83DDCA6,2600,26A1,D83CDF02,D83DDC18,2665,D83DDC40,D83CDF81,D83DDDFF".split(","),
	getSmiles: function () {
		if (IM.smilesPanel)
			return IM.smilesPanel;
		var parent = document.createElement("div"),
			list = document.createElement("div");
		list = IM.insertSmilesNode(list);
		list.className = "imdialog-emotions-category";
		list.id = "imdialog-emotions-smiles";
		parent.style.position = "relative";
		parent.appendChild(IM.getUpArrow(45));
		if (!IM.isAsVK()){
			parent.appendChild(IM.getEmotionsTabs(list));
			parent.appendChild(list);
		} else {
			parent.appendChild(list);
			parent.appendChild(IM.getEmotionsTabs(list));
		};
		IM.smilesPanel = parent;
		return parent;
	},
	smilesNode: null,
	insertSmilesNode: function (list, target) {
		var e = $.elements.create,
			getIMText = function () { return $.element("im-text") },
			getItem = function (symbol) {
				code = Settings.smiles.getCode(symbol);
				return e("div", {"class": "imdialog-emotions-smile-wrap", "data-emoji": code, append: e("img", {
						src: isEnabled(4)
							? "\/\/static.apidog.ru\/proxed\/smiles\/" + code + ".png"
							: "\/\/vk.com\/images\/emoji\/" + code + ".png",
						"class": "animation700",
						style: "opacity: 0",
						onload: function (event) {
							this.style.opacity = 1;
						}
					}),
					onclick: function (event) {
						IM.insertEmojiSymbol(target || getIMText(), code, symbol);
					}
				});
			},
			item, spliting;
		list = list || e("div", {"class": "imdialog-emotions-category", id: "imdialog-emotions-category"});
		for (var i = 0, l = Settings.smiles.used.length; i < l; ++i) {
			list.appendChild(getItem(Settings.smiles.used[i]));
		};

		list.appendChild(e("div", {"class": "imdialog-emotions-smile-wrap", append: e("span", {html: "¯\\_(ツ)_/¯"}), onclick: function (event)
		{
			IM.insertEmojiSymbol(target || getIMText(), 0, "¯\\_(ツ)_/¯");
		}}));
		return list;
	},
	closeEmotions: function () {
		$.elements.addClass(g("imdialog-smiles"), "hidden");
	},
	getUpArrow: function (right) {
		var arrow = $.e("div", {"class": "imdialog-attachment-arrow"});
		arrow.style.right = right + "px";
		return arrow;
	},
	insertEmojiSymbol: function (node, code, symbol) {
		node.focus();
		var emoji = " " + symbol + " ", n = 0;
		if (node.selectionStart) n = node.selectionStart;
		else if (document.selection) {
			var sel = document.selection.createRange(),
				clone = sel.duplicate();
			sel.collapse(true);
			clone.moveToElementText(node);
			clone.setEndPoint("EndToEnd", sel);
			n = clone.text.length;
		}
		n = n || 0;
		var text = node.value.split(""),
			newText = [];
		for (var i = 0; i <= text.length; i++) {
			if(i == n)
				newText.push(emoji);
			newText.push(text[i])
		}
		node.value = newText.join("");
		n = n + emoji.length;
		if (node.selectionStart)
			node.setSelectionRange(n, n);
//      if (screen.width >= 640)
//          elem.blur();
		return false;
	},
	notifyAudio: null,
	notify: function () {
		if (!(API.SettingsBitmask & 64))
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

	onDroppedFiles: function (files) {
		console.log(files);
	},



	showUploadFormMessagePhoto: function (to) {
		var e = $.e,
			p = e("div"),
			h = Site.CreateHeader(Lang.get("im.uploader_add_photo_by_link")),
			t = e("div", {"class": "tip tip-form", html: Lang.get("im.uploader_file_condition")}),
			m = Site.CreateHeader(Lang.get("im.uploader_upload")),
			a = Site.CreateInlineForm({
				method: "post",
				action: "/api/v2/dog.uploadRemoteAttachByURL?mail=1",
				title: Lang.get("im.uploader_upload"),
				name: "url",
				type: "url",
				placeholder: Lang.get("im.uploader_add_photo_by_link_placeholder"),
				onsubmit: function (event) {
					if (this.url && !$.trim(this.url.value) && !/^((https?|ftp):\/\/)?([A-Za-z0-9]{1,64}\.)+([A-Za-z]{2,6})\/?(.*)$/img.test(this.url.value)) {
						Site.Alert({
							text: Lang.get("im.uploader_incorrect_link")
						});
						return false;
					};
					var m = new Modal({
						title: "Загрузка изображения",
						content: "Пожалуйста, подождите...",
						width: 380
					}).show();
					var params = {};
					if (this.captchaId.value && this.captchaKey.value) {
						params.captchaId = this.captchaId.value;
						params.captchaKey = this.captchaKey.value;
					};
					Support.Ajax("/api/dog.uploadRemoteAttachByURL?mail=1&url=" + $.trim(this.url.value), params, function (data) {
						m.close();
						console.log(data);
						data = Site.isResponse(data);
						if (data && data.error == 3) {
							return IM.onCaptchaErrorUploadMessagePhoto(data, form);
						};
						if (!data)
							return;
						Photos.photos[data.owner_id + "_" + data.id] = data;
						if (data.error) {
							Site.Alert({text: "API Error #" + data.error})
						};
						if (IM.attachs[to])
							IM.attachs[to].push([data.type, data.owner_id, data.id]);
						else
							IM.attachs[to] = [[data.type, data.owner_id, data.id]];
						window.location.hash = "#im?to=" + to;
					});
					return false;
				}
			}),
			f = e("form", {action: "/upload.php?act=photo_mail", method: "post", enctype: "multipart/form-data", target: "_u"}),
			b = e("input", {type: "submit", value: Lang.get("im.uploader_upload")}),
			u = Site.CreateFileButton("photo", {fullwidth: true});
		u.lastChild.multiple = true;
		u.onchange = function (event) {
			IM.onUploadFormMessagePhoto(to, this.lastChild, event, f);
		};

		f.className = "sf-wrap";
		p.appendChild(m);
		p.appendChild(f);

		f.appendChild(t);
		f.appendChild(u);
//		f.appendChild(b);
		// --------------
		p.appendChild(h);
		p.appendChild(a);
		a.appendChild(e("input", {type: "hidden", name: "captchaKey", value: ""}));
		a.appendChild(e("input", {type: "hidden", name: "captchaId", value: ""}));
		// --------------
		//p.appendChild(i);

		Site.Append(p);
		Site.SetHeader(Lang.get("im.uploader_header"), {link: "im?to=" + to});
	},
	onUploadFormMessagePhoto: function (peerId, node, event, form) {
		uploadFiles(node, {
			maxFiles: 10 - (IM.attachs[peerId] && IM.attachs[peerId].length || 0),
			method: "photos.getMessagesUploadServer"
		}, {
			onTaskFinished: function (result) {
				IM.attachs[peerId] = (IM.attachs[peerId] || []).concat(result.map(function (i) {
					var id = ["photo", i.owner_id, i.pid || i.id];
					Photos.photos[id[1] + "_" + id[2]] = Photos.v5normalize(i);
					return id;
				}));

				window.location.hash = "#im?to=" + peerId;
			}
		});
	},
	onCaptchaErrorUploadMessagePhoto: function (data, form) {
		var e = $.e, wrap,
			captchaId = data.captchaId,
			image = data.captchaImage;
		document.getElementsByTagName("body")[0].appendChild(wrap = e("table", {
			"class": "captcha",
			append: e("tr", {append: e("td", {
				align: "center",
				valign: "center",
				append: e("form", {
					onsubmit: function (event) {
						$.event.cancel(event);
						$.elements.remove(wrap);
						form.captchaKey.value = this.text.value;
						form.captchaId.value = captchaId;
						form.submit();
					},
					append: [
						e("img", {src: getURL(image)}),
						e("input", {"class": "sizefix", type: "text", name: "text", maxlength: 10}),
						e("input", {"class": "sizefix", type: "submit", value: "Продолжить"})
					]
				})
			})})
		}));
	},
	loadYandexMapsAPILibrary: function (fx) {
		ModuleManager.load(["http://api-maps.yandex.ru/2.1/?lang=ru_RU&q=YandexMaps.js"], fx);
	},
	attachMap: function (to) {
		if (IM.geo[to]) {
			return Site.Alert({text: "no more than 1 map"});
		};

		IM.loadYandexMapsAPILibrary(function (event) {IM.showAttachFormMap(to)});

		var parent = document.createElement("div"),
			e = $.e,
			map = e("div", {id: "map", "class": "imdialog-select-map"});

		parent.appendChild(map); // asdf

		var modal = new Modal({
			title: Lang.get("im.map_attach_header"),
			content: parent,
			noPadding: true,
			width: "80%",
			footer: [
				{
					name: "ready",
					title: Lang.get("im.map_attach_ready"),
					onclick: function () {
						var p = $.element("imdialog-attachments");
						p.appendChild(IM.explainGeoAttachment(IM.geo[to]));
						this.close();
					}
				},
				{
					name: "cancel",
					title: Lang.get("general.cancel"),
					onclick: function () {
						this.close();
					}
				}
			]
		}).show();
	},
	showAttachFormMap: function (to) {
		ymaps.ready(function (event) {

			var el = $.element("map"),
				pos = $.getPosition(el),
				map;

			ymaps.geolocation.get({
				provider: "yandex"
			}).then(function (data) {
				var bounds = data.geoObjects.get(0).properties.get("boundedBy"),
					q = ymaps.util.bounds.getCenterAndZoom(bounds, [pos.width, pos.height]),
					input = $.element("_map_coords"),
					bl;
				q.yandexMapAutoSwitch = false;
				q.controls = [];
				map = new ymaps.Map("map", q);
				map.controls.add("typeSelector", {position: {top: 5, left: 5}})
							.add("zoomControl", {position: {top: 70, left: 5}});

				map.events.add("click", function  (event) {
					if (bl)
						map.geoObjects.remove(bl);

					bl = new ymaps.Placemark(event.get("coords"), {}, {});

					map.geoObjects.add(bl);

					IM.geo[to] = event.get("coords");
				})
			})
		});
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
			load = function (o) {
				Site.API("execute", {
					code: 'var d=[],i=%o,s=200,l=i+s*10;while(i<l){d=d+API.messages.getHistory({%f_id:%i,offset:i,count:s,v:5.28}).items;i=i+s;};return d@.attachments;'
						.replace(/%o/img, o || 0)
						.replace(/%f/img, to > 0 ? "user" : "chat")
						.replace(/%i/img, Math.abs(to))
				}, function (d) {
					d = Site.isResponse(d);
					if (!d) return;
					var a = [];
					currentPositionLoaded += d.length;
					r.call(d, function (w) {
						if (!w)
							return;

						r.call(w, function (q) {
							if (~accepted.indexOf(q.type))
								a.push(q);
						});
					});
					items = items.concat(a);
					if (!o) $.elements.clearChild(list);
					show(items);
				});
			},
			setFilter = function (f) {
				filter = f;
				$.elements.clearChild(list);
				currentPosition = 0;
				show(items);
			},
			show = function (data) {
				console.log(data, filter);
				var i = currentPosition, item, a, node, size = 0, empty;
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
							node = Audios.Item(a);
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
				currentPosition += size;
				if (!size)
					list.appendChild(empty = Site.EmptyField(Lang.get("im.attach_view_noone")));
				list.appendChild(Site.CreateNextButton({
					click: function (event) {
						event.preventDefault();
						if (empty) $.elements.remove(empty);
						load(currentPositionLoaded);
						$.elements.remove(this);
						return false;
					},
					text: Lang.get("im.next")
				}));
			},
			parent = e("div", {append: [
				Site.CreateHeader(
					Lang.get("im.attach_view"),
					Site.CreateDropDownMenu(Lang.get("im.attach_view_filter"), (function (a, b) {
						a[b("im.attach_view_all")] = function (event) { setFilter(null) };
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

		Site.Append(parent);
		Site.SetHeader(Lang.get("im.attach_view"), {link: "im?to=" + to});
	},
	Resolve: function (a) {
		if (a == "mail")
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
					if (this.src == this.getAttribute("src_big"))
						return;
					this.src = this.getAttribute("src_big");
					this.style.width = "100%";
					this.style.maxWidth = "604px";
				}
			})
		]});
	}
};