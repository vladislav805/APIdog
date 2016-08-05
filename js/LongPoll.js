/**
 * APIdog v6.5
 *
 * Branch: dev
 * Progress: 40%
 */

function LongPollResult (result) {
	this.serverData = {
		server: LongPoll.currentData && LongPoll.currentData.server,
		ts: result.ts,
		key: LongPoll.currentData && LongPoll.currentData.key
	};

	this.updates = result.updates.map(function (i) {
		return new LongPollEvent(i);
	});
};

LongPollResult.prototype = {

	each: function (fx) {
		this.updates.forEach(fx);
		return this;
	},

	get: function (i) {
		return this.updates[i];
	}

};

var
	APIDOG_LONGPOLL_EVENT_SET_FLAGS = 2,
	APIDOG_LONGPOLL_EVENT_REMOVE_FLAGS = 3,
	APIDOG_LONGPOLL_EVENT_NEW_MESSAGE = 4,
	APIDOG_LONGPOLL_EVENT_READ_INBOX_MESSAGES = 6,
	APIDOG_LONGPOLL_EVENT_READ_OUTBOX_MESSAGES = 7,
	APIDOG_LONGPOLL_EVENT_FRIEND_ONLINE = 8,
	APIDOG_LONGPOLL_EVENT_FRIEND_OFFLINE = 9,
	APIDOG_LONGPOLL_EVENT_CHAT_UPDATED = 51,
	APIDOG_LONGPOLL_EVENT_TYPING_USER = 61,
	APIDOG_LONGPOLL_EVENT_TYPING_CHAT = 62,
	APIDOG_LONGPOLL_EVENT_CALL = 70,
	APIDOG_LONGPOLL_SET_COUNT_DIALOGS = 80,
	APIDOG_LONGPOLL_SET_NOTIFY_CHAT = 114,

	APIDOG_LONGPOLL_FLAG_UNREAD = 1,
	APIDOG_LONGPOLL_FLAG_OUTBOX = 2,
	APIDOG_LONGPOLL_FLAG_DELETED = 128,
	APIDOG_LONGPOLL_FLAG_HAS_ATTACHMENT = 512;

function LongPollEvent (e) {
	this.eventId = e[0];
	switch (e[0]) {

		case APIDOG_LONGPOLL_EVENT_NEW_MESSAGE:
			var p = {
				id: e[1],
				date: e[4],
				title: LongPoll.fixStrings(e[5]),
				body: LongPoll.fixStrings(e[6]),
				read_state: !(e[2] & APIDOG_LONGPOLL_FLAG_UNREAD),
				out: !!(e[2] & APIDOG_LONGPOLL_FLAG_OUTBOX),
				needInfo: true
			};
// "source_act":"chat_title_update","source_text":"APIdog v6.5 dev"
// "action":"chat_title_update","action_text":"APIdog v6.5 dev"
			if (e[3] > 2000000000) {
				p.chat_id = e[3] - 2000000000;
				p.from_id = parseInt(e[7].from);
			} else {
				p.from_id = e[3];
			};

			this.message = new VKMessage(p);
//			this.attachments = LongPoll.parseAttachments(e[7]);
			break;

		case APIDOG_LONGPOLL_EVENT_SET_FLAGS:
			this.messageId = e[1];
			this.flag = e[2];
			this.peerId = e[3] || 0;
			break;

		case APIDOG_LONGPOLL_EVENT_REMOVE_FLAGS:
			this.messageId = e[1];
			this.flag = e[2];
			this.peerId = e[3] || 0;
			break;

		case APIDOG_LONGPOLL_EVENT_CHAT_UPDATED:
			this.chatId = e[1];
			this.selfEdit = !!e[2];
			break;

		case APIDOG_LONGPOLL_EVENT_FRIEND_ONLINE:
			this.userId = -e[1];
			break;

		case APIDOG_LONGPOLL_EVENT_FRIEND_OFFLINE:
			this.userId = -e[1];
			break;

		case APIDOG_LONGPOLL_EVENT_TYPING_USER:
		case APIDOG_LONGPOLL_EVENT_TYPING_CHAT:
			this.userId = e[1];
			if (this.eventId === APIDOG_LONGPOLL_EVENT_TYPING_CHAT) {
				this.chatId = e[2];
			};
			break;

		case APIDOG_LONGPOLL_SET_COUNT_DIALOGS:
			this.count = e[1];
			break;

	};
};



var LongPoll = {

	// created 15.01.2016
	getPeerId: function (id) {
		return id < 0
			? ["g", -id]
			: id >= 2000000000
				? ["c", 2000000000 - id]
				: ["u", id];
	},

	enabled: false,

	ajaxRequest: null,

	// refactored 15.01.2016
	start: function (params) {
		if (!LongPoll.isNeedStart()) {
			return;
		};

		var ar;

		if (ar = LongPoll.ajaxRequest) {
			ar.abort();
			ar = null;
		};

		if (params) {
			LongPoll.currentData = params;
		};

		LongPoll.newRequest();
	},

	isNeedStart: function () {
		return!!(API.SettingsBitmask & APIDOG_SETTINGS_LONGPOLL);
	},

	// created 15.01.2016
	newRequest: function () {
		console.info("LP/start: creating request");

		var ar = new XMLHttpRequest();

		ar.timeout = 25000;

		ar.ontimeout = function () {
			console.error("LP/timeout: connection aborted");
		};

		ar.onerror = function () {
			console.error("LP/fail: " + ar.status + ")");
			setTimeout(function () {
				LongPoll.start(LongPoll.lastParams);
			}, 5000);
		};

		ar.onloadend = function () {
			if (ar.status === 200) {
				var result = JSON.parse(ar.responseText);

				if (result.response) {
					LongPoll.resolveProblem(result.response);
					return;
				};

				if (result[0].failed) {
					LongPoll.currentData = null;
					setTimeout(LongPoll.start, 2000);
					return;
				};

				if (result[1].errorId) {
					console.error("LP/error: " + result[1].errorId);
					setTimeout(LongPoll.start, 2000);
					return;
				};

				if (!LongPoll.currentData.server) {
					LongPoll.currentData = result[1];
				};

				console.info("LP/result: " + JSON.stringify(result[0]))

				LongPoll.getResult(
					LongPoll.parseResult(result[0])
				);
			};
		};

		ar.open("GET", "/longpoll?" + LongPoll.getServerURL(), true);
		ar.send(null);

		LongPoll.ajaxRequest = ar;
	},

	currentData: { server: 0, ts: 0, key: "" },

	// created 15.01.2016
	getServerURL: function () {
		var l = LongPoll.currentData || {},
			p = {
				access_token: API.access_token,
				server: l.server || "",
				ts: l.ts || "",
				key: l.key || ""
			};

		if (l.captcha_sid) {
			p.captcha_sid = l.captcha_sid;
			p.captcha_key = l.captcha_key;
		};

		return $.ajax.queryBuilder(p);
	},

	lastRequest: 0,

	// created 15.01.2016
	parseResult: function (result) {
		return new LongPollResult(result);
	},

	// created 15.01.2016
	parseAttachments: function (a) {
		var attachments = [],
			extra = {},
			fwd = [],

			counts = {a: 0, f: 0};

		if (a.from) {
			extra.fromId = parseInt(a.from);
		};

		if (a.attach1_type) {
			for (var i = 1, l = 10; i <= l; ++i) {
				if (!a["attach" + i + "_type"]) {
					break;
				};
				counts.a++;
				attachments.push(a["attach" + i + "_type"] + a["attach" + i]);
			};
		};

		if (a.fwd) {
			fwd = a.fwd.split(",").map(function (id) {
				counts.f++;
// TODO: make VKMessage
//				return new VKMessage();
				return {text: a["fwd" + id]};
			});
		};

		return {
			extra: extra,
			attachments: attachments,
			forwarded: fwd,
			counts: counts
		};
	},


	// created 15.01.2016
	fixStrings: function (s) {
		return (s || "")
			.replace(/<br(\s?\/)?>/img, "\n")
			.replace(/&amp;/img, "&")
			.replace(/&lt;/img, "<")
			.replace(/&gt;/img, ">")
			.replace(/&quot;/img, "\"");
	},




	// refactored 15.01.2016
	getResult: function (data, server, isExtension) {

		LongPoll.lastRequest = parseInt(Date.now() / 1000);

		if (!isExtension) {
			if (data.response) {
				LongPoll.getError(data);
				return;
			};

			if (!data.updates) {
				LongPoll.start();
				return;
			};
		};

		LongPoll.currentData.ts = data.serverData.ts;
		setTimeout(LongPoll.start, 700);

		data.each(function (i) {
			switch (i.eventId) {
				case APIDOG_LONGPOLL_EVENT_REMOVE_FLAGS:
					switch (i.flag) {
						case APIDOG_LONGPOLL_FLAG_UNREAD:
							window.onMessageReaded && window.onMessageReaded(i.messageId, i.peerId);
							break;

						default:
							console.warn("LP/skip: eventId = %d, flag = %d", i.eventId, i.flag);
					};
					break;


				case APIDOG_LONGPOLL_EVENT_NEW_MESSAGE:
					window.onNewMessageReceived && window.onNewMessageReceived(i.message);
					break;

				case APIDOG_LONGPOLL_EVENT_TYPING_USER:
				case APIDOG_LONGPOLL_EVENT_TYPING_CHAT:
					window.onTyping && window.onTyping(i.userId, i.chatId)
					break;

				default:
					console.warn("LP/skip: eventId = %d", i.eventId);
			};
		});


return;



		for (var i = 0, l = updates.length; i < l; ++i) {
			c = updates[i];
			type = c[0];
			id = c[1];
			console.log("LongPoll.getResult: ", c);
			switch (type) {
/*
//		удаление сообщений
				case 2: [2, int messageId, int flags (128), int peerId];
*/
				case 3:




					var message_id = id,
						state = c[2],
						from = parseInt(c[3] >= 2e9 ? (2e9 - c[3]) : c[3]);
					if (state != 1)
						continue;
					if (isListMessages) {
/*						$.elements.addClass(document.querySelector("#mail-dialog" + from + " .dialogs-state"), "dialogs-state-readed");
						$.elements.removeClass($.element("mail-dialog" + from), "dialogs-item-new");
						$.element("ml" + from).innerHTML = "";
*/					} else
						try {
							$.elements.removeClass($.element("imdialog-message" + message_id), "imdialog-unread");
						} catch (e) {}
					break;
				case 4:

/*

	аттачи:
		ссылка:

			{
				"attach1_photo":"2000010708_396436767",
				"attach1_title":"Заголовок",
				"attach1_desc":"Описание",
				"attach1_url":"ссылка",
				"attach1_type":"link",
				"attach1":""
			}



		пересланные сообщения:

			{
				"fwd":"23048942_1481075,23048942_1481076,23048942_1481077,23048942_1481078,23048942_1481079,23048942_1481080:(184870404_1743185)",
				"fwd_msg_count":"7",
				"fwd23048942_1481075":"текст сообщения",
				"fwd23048942_1481076":"текст сообщения",
				"fwd23048942_1481077":"текст сообщения",
				"fwd23048942_1481078":"текст сообщения",
				"fwd23048942_1481079":"текст сообщения",
				"fwd184870404_1743185":"текст сообщения",
				"fwd23048942_1481080":"текст сообщения"
			}



		геометки:

			{
				"geo":"8NTT_gUD"
			}



		стикеры:

			{
				"attach1_product_id":"2",
				"attach1_type":"sticker",
				"attach1":"66"
			}

*/

					var from = parseInt(c[3] >= 2e9 ? (2e9 - c[3]) : c[3]),
						fromUser = (from > 0 ? (out ? API.uid : from) : c[7].from),
						flag = c[2],
						out = !!(flag & 2),
						add;
					if (nowIM === from){
						inRead.push(id);
						add = true;
					};
					if (isNotification(1) && !out && nowIM != from)
					{
						var user = Local.Users[fromUser];
						if (user)
						{
							var name = user.first_name + " " + user.last_name;
							Site.Alert({
								text: [
									"<strong>" + (from < 0
										? name + " в беседе &laquo;" + c[5] + "&raquo;"
										: name) + "<\/strong>",
									c[6]
										? Mail.Emoji(c[6].substr(0, 60)) + (c[6].length > 60 ? "..." : "")
										: LongPoll.getAttachmentNotification(c[7])
								].join("<br \/>"),
								icon: user.photo_50,
								time: 7000,
								click: (function (i)
								{
									return function (event)
									{
										window.location.hash = "#im?to=" + from;
									};
								})(from)
							});
						};
					};

					if (!out)
						IM.notify();

					var v = Mail.version;
					if (
						isListMessages && (
							(Mail.version && (!t) && !act) ||
							(!Mail.version && !act && ((t == 1 && out) || (!t && !out)))
						)
					) {
						var attachments = (function (a, b, c, d, e, f) {
							for (; c < d; c++) {
								if (!a[e + c])
									break;
								b.push({type: a[e + c + f]});
							}
							return b;
						})(c[7], [], 1, 10, "attach", "_type"),
							item = $.element("mail-dialog" + from),
							unread = $.element("ml" + from) && +$.element("ml" + from).innerHTML || 0;
						if (item) {
							var parentNode = item.parentNode;
							$.elements.remove(item);
						} else
							var parentNode = $.element("mail-list");
						if (!out)
							unread++;
						c[6] = c[6]
							.replace(/<br(\s?\/)?>/img, "\n")
							.replace(/&amp;/img, "&")
							.replace(/&lt;/img, "<")
							.replace(/&gt;/img, ">")
							.replace(/&quot;/img, "\"");
						var obj = {
							out: out,
							user_id: fromUser,
							from_id: fromUser,
							date: c[4],
							body: c[6],
							read_state: !(flag & 1),
							id: id,
							title: c[5].replace(/<br(\s?\/)?>/img, "\n")
								.replace(/&amp;/img, "&")
								.replace(/&lt;/img, "<")
								.replace(/&gt;/img, ">")
								.replace(/&quot;/img, "\""),
							attachments: attachments,
							fwd_messages: (c[7].fwd ? new Array(c[7].fwd.split(",").length) : []),
							action: c[7] && c[7].source_act,
							action_mid: c[7] && c[7].source_mid
						};
						if (IM.dialogsContent[from])
							IM.dialogsContent[from].unshift(id);
						else
							IM.dialogsContent[from] = [id];
						if (from > 0)
							obj.user_id = from;
						else
							obj.chat_id = -from;
						parentNode.insertBefore(Mail.item(obj, {unread: unread}), parentNode.firstChild);
						continue;
					}
					var attachments = c[7],
						hasAtatch = attachments && (attachments.attach1_type || attachments.fwd || attachments.geo),
						node = $.element("im-list" + from),
						obj = {
							out: out,
							user_id: fromUser,
							from_id: fromUser,
							date: c[4],
							body: c[6],
							read_state: !(flag & 1),
							id: id,
							action: c[7] && c[7].source_act,
							action_mid: c[7] && c[7].source_mid,
							action_text: c[7] && c[7].source_text,
							longpoll: hasAtatch,
							byLP: true
						};
					if (attachments && attachments.attach1_type == "sticker") {
						var sticker_id = attachments.attach1;
						obj.attachments = [{
							type: "sticker",
							sticker: {
								id: sticker_id,
								photo_64: "\/\/vk.com\/images\/stickers\/" + sticker_id + "\/64b.png",
								photo_128: "\/\/vk.com\/images\/stickers\/" + sticker_id + "\/128b.png",
								photo_256: "\/\/vk.com\/images\/stickers\/" + sticker_id + "\/256b.png",
								width: 256,
								height: 256
							}
						}];
						hasAtatch = false;
					}
					if (node && !$.element("imdialog-message" + id) && !Site.Get("force")) {
						if (IM.isAsVK())
							node.appendChild(IM.item(obj, {to: from}));
						else
							node.insertBefore(IM.item(obj, {to: from}), node.firstChild);
						window.onResizeCallback({content: $.getPosition($.element("content"))});
					};
//                  if (add)
//                      IM.History[from].unshift(obj);
					if (hasAtatch && Mail.version)
						IM.getAttachmentsMessageLongPoll(id);
					break;
				case 8:
					var user = Local.Users[-id];
					if (isNotification(64)) {
						if (!user)
							continue;
						Site.Alert({
							text: user.first_name + " " + user.last_name + " в сети",
							time: 7000,
							icon: getURL(user.photo_rec || user.photo_50),
							click: (function (user) {
								return function (event) { window.location.hash = "#" + (user.screen_name || "id" + (user.id || user.uid)) };
							})(user)
						});
					};
					if (user) {
						Local.Users[-id].online = true;
					};
					break;
				case 9:
					var user = Local.Users[-id];
					if (isNotification(64)) {
						if (!user)
							continue;
						Site.Alert({
							text: user.first_name + " " + user.last_name + " выш" + (["ел", "ла", "ел"][user.sex || 2]) + " из сети",
							time: 7000,
							icon: getURL(user.photo_rec || user.photo_50),
							click: (function (user) {
								return function (event) { window.location.hash = "#" + (user.screen_name || "id" + (user.id || user.uid)) };
							})(user)
						});
					};
					if (user) {
						Local.Users[-id].online = false;
						Local.Users[-id].online_mobile = false;
					};
					break;
				case 51:
//                  IM.UpdateChat(id);
					break;
				case 61:
					IM.setUserTyping(id, false, isListMessages);
					break;
				case 62:
					IM.setUserTyping(id, c[2], isListMessages);
					break;
				case 80:
					g("count-messages").innerHTML = (!id ? "" : "<i>" + id + "</i>");
					break;
			}
		}
		if (inRead.length && isEnabled(2)) {
			if (isHidden())
				LongPoll.hasUnread = LongPoll.hasUnread.concat(inRead);
			else
				Site.API("messages.markAsRead", {message_ids: inRead.join(",")}, "blank");
		};
	},
	hasUnread: [],
	getAttachmentNotification: function (attachments) {
		var str;
		if (attachments.attach1_type == "sticker")
			return "<i>&lt; Стикер &gt;<\/i>";
		return "<i>&lt; Прикрепления &gt;<\/i>";
	},

	restart: function () {
		if (!LongPoll._ext) {
			LongPoll.Abort();
			setTimeout(function () { // эта херня всё равно не пашет
				LongPoll.Start();
			}, 2000);
		} else {
			sendEvent("onAccessTokenReceived", {useraccesstoken: API.access_token});
		};
	},

	// deprecated 17.01.2016
	Stop: function () { LongPoll.stop(); },

	// renamed 17.01.2016
	stop: function () {
		LongPoll.ajaxRequest && LongPoll.ajaxRequest.abort();
	},

	Abort: function () {
		LongPoll.Stop();
		LongPoll.enabled = false;
		console.log("LongPoll.stop: stopped");
	},

	getError: function (data) {
		var result = data.response,
			eid = result.error_id,
			description = result.description;
		Site.Alert({
			text: "LongPoll Error: " + eid + ": " + description,
			icon: "//static.apidog.ru/apple-touch-icon-57x57.png"
		});
	},

	// refactored 17.01.2016
	resolveProblem: function (error) {
		switch (error.error_id) {
			case 3:
				if (error.description == "#14 - Captcha needed") {

					Site.showCaptchaBox({
						captchaImage: "//api.vk.com/captcha.php?sid=" + id,
						handler: function (value) {
							LongPoll.currentData.captcha_sid = id;
							LongPoll.currentData.captcha_key = value;
							LongPoll.start();

						}
					});
				}
			break;
		}
	},

	hasProblemNotify: function (time) {
		var modal = new Modal({
			title: "LongPoll",
			content: "Кажется, LongPoll перестал работать. Последнее полученное сообщение от него было получено " + Math.round(time) + " секунд(ы) назад.",
			footer: [
				{
					name: "restart",
					title: "Перезапустить",
					onclick: function () {
						LongPoll.restart();
						modal.close();
					}
				},
				{
					name: "cancel",
					title: "Закрыть",
					onclick: function () {
						modal.close();
					}
				}
			]
		}).show();
	}
};


function isHidden () {
	return document.hidden || document.mozHidden || document.webkitHidden || document.msHidden;
};

function onHiddenStateChange (event) {
	if (!(!isHidden() && LongPoll.hasUnread.length)) {
		return;
	};

	var msgs = LongPoll.hasUnread.join(",");
	LongPoll.hasUnread = [];
	Site.API("messages.markAsRead", {message_ids: msgs}, "blank");
};

$.event.add(document, "visibilitychange", onHiddenStateChange);
$.event.add(document, "msvisibilitychange", onHiddenStateChange);
$.event.add(document, "mozvisibilitychange", onHiddenStateChange);
$.event.add(document, "webkitvisibilitychange", onHiddenStateChange);