var LongPoll = {

	/**
	 * ID of event
	 */
	event: {
		FLAG_SET: 1,
		FLAG_ADD: 2,

		/** @deprecated */
		FLAG_REMOVE: 3,

		MESSAGE_NEW: 4,
		MESSAGE_EDIT: 5,
		MESSAGE_READ_IN: 6,
		MESSAGE_READ_OUT: 7,

		FRIEND_ONLINE: 8,
		FRIEND_OFFLINE: 9,

		MESSAGE_REMOVE: 13,
		MESSAGE_RESTORE: 14,

		/** @deprecated */
		CHAT_EDITED: 51,
		CHAT_MODIFY_INFO: 52,

		TYPING_USER: 61,
		TYPING_CHAT: 62,

		COUNTER_MAIL_UPDATED: 80,

		CHAT_SETTINGS_EDITED: 114
	},

	/**
	 * Flags for messages
	 */
	flag: {
		UNREAD: 1,
		OUTBOX: 2,
		IMPORTANT: 8,
		FRIEND: 32,
		SPAM: 64,
		DELETED: 128
	},

	chatEditType: {
		MODIFIED_TITLE: 1, // "0"
		MODIFIED_PHOTO: 2, // "0"
		ADMIN_ADDED: 3,    // admin_id
		ADMIN_REMOVED: 9,  // user_id
		MESSAGE_FIXED: 5,  // conversation_message_id
		USER_ENTERED: 6,   // user_id
		USER_LEAVED: 7,    // user_id
		USER_KICKED: 8     // user_id
	},

	request: null,

	/**
	 * Is enabled longpoll
	 */
	enabled: false,

	/**
	 * @var {{ts: int, server: string, key: string}|null} server
	 */
	server: null,

	/**
	 * Start longpoll request
	 * @param {object=} data
	 * @param {object=} error
	 */
	start: function(data, error) {

		/*if (!isEnabled(Setting.ENABLED_LONGPOLL) || ~navigator.userAgent.toLowerCase().indexOf("opera mini")) {
			return;
		}

		LongPoll.enabled = true;

		LongPoll.request && LongPoll.request.abort();

		LongPoll.request = new XMLHttpRequest;


		var url = {
			userAccessToken: API.accessToken,
			server: data.server,
			ts: data.ts,
			key: data.key,
			r: Number.random(0, Number.MAX_SAFE_INTEGER)
		};

		if (error) {
			url.captchaSid = error.id;
			url.captchaKey = error.value;
		}


		LongPoll.request.open("GET", "/longpoll?" + Object.toQueryString(url), true);
		LongPoll.request.send(null);

		LongPoll.request.onreadystatechange = function() {
			if (LongPoll.request.readyState !== 4) {
				return
			}

			if (LongPoll.request.status === 200) {
				LongPoll.checkResponse(LongPoll.request.responseText)
				        .then(function(data) {
				        	LongPoll.server = data.server;
					        return data.events.updates;
				        })
				        .then(LongPoll.normalize)
				        .then(LongPoll.fireAllEvents)
						.catch(LongPoll.handleError);
				return;
			}


			if (LongPoll.request.status) {
				console.error("LongPoll Failed: HTTP/1.1 (status: " + LongPoll.request.status + ")");
				setTimeout(function () {
					LongPoll.start(LongPoll.lastParams);
				}, 5000);
			} else {
				Site.Alert({text: "А у Вас соединение с Интернетом, случаем, не пропало?"});
			}
		};*/
	},

	/**
	 * Parse
	 * @param {string} result
	 */
	checkResponse: function(result) {
		return new Promise(function(resolve) {
			result = JSON.parse(result);

			if (result[0]) {
				result[1].ts = result[0].ts;
				resolve({events: result[0], server: result[1]});
				return;
			}

			throw result[1];
		});
	},

	normalize: function(events) {
		console.log("normalize", events);
		return events.map(function(event) {
			var eventCode = event[0], data = null,
				isOut, peer, extra, attachments, hasAttach, hasForwarded, hasGeo;
			switch (eventCode) {
				case LongPoll.event.MESSAGE_NEW:
					isOut = event[2] & LongPoll.flag.OUTBOX;
					peer = new Peer(event[3]);
					extra = event[7] || {};
					attachments = [];
					hasAttach = "attach1" in extra;
					hasForwarded = "fwd" in extra;
					hasGeo = "geo" in extra;

					if (extra["attach1_type"] === "sticker") {
						attachments.push({
							type: "sticker",
							sticker: {
								id: extra["attach1"]
							}
						});
						hasAttach = false;
					}

					if (extra["attach1_type"] === "link" && !extra["attach2"] && !hasGeo) {
						attachments.push({
							type: "link",
							link: {
								url: extra["attach1_url"],
								title: extra["attach1_title"],
								description: extra["attach1_desc"],
								photo: extra["attach1_photo"],
							}
						});
						hasAttach = false;
					}

					data = {
						id: event[1],
						from_id: !peer.isChat() ? (isOut ? API.userId : peer.get()) : parseInt(extra.from),
						peer_id: peer.get(),
						date: event[4],
						title: event[5].unsafe(),
						body: event[6].unsafe(),
						out: isOut,
						read_state: !(event[2] & LongPoll.flag.UNREAD),
						action: extra["source_act"],
						action_mid: extra["source_mid"],
						__longpollData: {
							attachments: hasAttach || hasForwarded || hasGeo,
							randomId: 0 // TODO
						}
					};

					if (attachments.length) {
						data.attachments = attachments;
					}

					if (data.action) {
						data.action_text = data.title;
					}

					data.user_id = data.from_id;

					if (peer.isChat()) {
						data.chat_id = peer.getId();
					}
					break;

					// 5,831884,16,203384908,1532119126,"","fff",{"attach1_type":"doc","attach1":"203384908_469306861"}

				case LongPoll.event.MESSAGE_EDIT:
					isOut = event[2] & LongPoll.flag.OUTBOX;
					peer = new Peer(event[3]);
					extra = event[7] || {};
					attachments = [];
					hasAttach = "attach1" in extra;
					hasForwarded = "fwd" in extra;
					hasGeo = "geo" in extra;

					if (extra["attach1_type"] === "sticker") {
						attachments.push({
							type: "sticker",
							sticker: {
								id: extra["attach1"]
							}
						});
						hasAttach = false;
					}

					if (extra["attach1_type"] === "link" && !extra["attach2"] && !hasGeo) {
						attachments.push({
							type: "link",
							link: {
								url: extra["attach1_url"],
								title: extra["attach1_title"],
								description: extra["attach1_desc"],
								photo: extra["attach1_photo"],
							}
						});
						hasAttach = false;
					}

					data = {
						id: event[1],
						from_id: !peer.isChat() ? (isOut ? API.userId : peer.get()) : parseInt(extra.from),
						peer_id: peer.get(),
						date: event[4],
						title: event[5].unsafe(),
						body: event[6].unsafe(),
						read_state: !(event[2] & LongPoll.flag.UNREAD),
						action: extra["source_act"],
						action_mid: extra["source_mid"],
						__longpollData: {
							attachments: hasAttach || hasForwarded || hasGeo,
							randomId: 0 // TODO
						}
					};

					if (attachments.length) {
						data.attachments = attachments;
					}

					data.user_id = data.from_id;

					if (peer.isChat()) {
						data.chat_id = peer.getId();
					}
					break;

				case LongPoll.event.MESSAGE_READ_OUT:
				case LongPoll.event.MESSAGE_READ_IN:
					data = {
						peerId: event[1],
						messageId: event[2]
					};
					break;

				case LongPoll.event.CHAT_MODIFY_INFO:
					data = {
						type: event[1],
						peerId: event[2],
						info: event[3]
					};
					break;

				case LongPoll.event.FRIEND_ONLINE:
				case LongPoll.event.FRIEND_OFFLINE:
					data = {id: event[1], user: Local.data[-event[1]]};
					break;

				case LongPoll.event.TYPING_USER:
				case LongPoll.event.TYPING_CHAT:
					data = {
						userId: event[1],
						peerId: eventCode === LongPoll.event.TYPING_USER
							? event[1]
							: Peer.LIMIT + event[2]
					};
					break;

				case LongPoll.event.COUNTER_MAIL_UPDATED:
					data = event[1];
					break;

			}
			return {event: eventCode, data: data};
		});
	},

	/**
	 * Вызов слушателей событий
	 * @param {{event: int, data: object}[]} events
	 */
	fireAllEvents: function(events) {
		events.forEach(LongPoll.fireEvent);
	},

	/**
	 * Вызов слушателей для каждого события
	 * @param {{event: int, data: object}} event
	 */
	fireEvent: function(event) {
		if (LongPoll.__listeners[event.event]) {
			LongPoll.__listeners[event.event].forEach(function(listener) {
				listener(event.event, event.data);
			});
		}
	},

	/**
	 * Слушатели событий
	 */
	__listeners: {},

	/**
	 * Добаление слушателя событий
	 * @param {int[]} eventCodes
	 * @param {function} listener
	 */
	addListener: function(eventCodes, listener) {
		if (!Array.isArray(eventCodes)) {
			eventCodes = [eventCodes];
		}

		eventCodes.forEach(function(eventCode) {
			this.__putListener(eventCode, listener);
		}.bind(this));
	},

	/**
	 * Удаление слушателя событий
	 * @param eventCodes
	 * @param listener
	 */
	removeListener: function(eventCodes, listener) {
		if (!Array.isArray(eventCodes)) {
			eventCodes = [eventCodes];
		}

		eventCodes.forEach(function(eventCode) {
			this.__removeListener(eventCode, listener);
		}.bind(this));
	},

	__putListener: function(eventCode, listener) {
		if (!this.__listeners[eventCode]) {
			this.__listeners[eventCode] = [];
		}

		this.__listeners[eventCode].push(listener);
	},

	__removeListener: function(eventCode, listener) {
		if (!this.__listeners[eventCode]) {
			this.__listeners[eventCode] = [];
		}

		var index = this.__listeners[eventCode].indexOf(listener);

		if (~index) {
			this.__listeners[eventCode].splice(index, 1);
		}
	},

	/**
	 * @deprecated
	 */
	getResult: function(data, server, isExtension) {
		LongPoll.lastRequest = parseInt(Date.now() / 1000);

		if (!isExtension) {
			if (data.response)
				return LongPoll.getError(data);
			if (!data.updates)
				return LongPoll.start(server);
		};
		var updates = data.updates,
			currentPage = window.location.hash.replace("#", "").split("?")[0],
			nowIM = currentPage == "im" ? parseInt(Site.Get("to")) : null,
			inRead = [],
			isListMessages = currentPage == "mail" && !Site.Get("act"),
			c,
			id,
			type,
			act = Site.Get("act"),
			t = Site.Get("type");
		if (!isExtension) {
			server.ts = data.ts;
			if ((API.bitmask & 2) && !LongPoll.enabled)
				LongPoll.lastParams = server;
			else
				setTimeout(function () { LongPoll.start(server) }, 1000);
		};
		for (var i = 0, l = updates.length; i < l; ++i) {
			c = updates[i];
			type = c[0];
			id = c[1];
			console.log("LongPoll.getResult: ", c);
			switch (type) {
				case 3:
					var message_id = id,
						state = c[2],
						from = parseInt(c[3] >= 2e9 ? (2e9 - c[3]) : c[3]);
					if (state != 1)
						continue;
					if (isListMessages) {
						$.elements.addClass(document.querySelector("#mail-dialog" + from + " .dialogs-state"), "dialogs-state-readed");
						$.elements.removeClass($.element("mail-dialog" + from), "dialogs-item-new");
						$.element("ml" + from).innerHTML = "";
					} else
						try {
							$.elements.removeClass($.element("imdialog-message" + message_id), "imdialog-unread");
						} catch (e) {}
					break;
				/*case 4:
					var from = parseInt(c[3] >= 2e9 ? (2e9 - c[3]) : c[3]),
						fromUser = (from > 0 ? (out ? API.userId : from) : c[7].from),
						flag = c[2],
						out = !!(flag & 2),
						add;
					if (nowIM === from){
						inRead.push(id);
						add = true;
					};
					if (isNotification(1) && !out && nowIM != from)
					{
						var user = Local.data[fromUser];
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
							unread = $.element("ml" + from),
							parentNode;
						unread = unread.dataset.count;
						unread = unread && (~unread.indexOf("K") ? parseInt(unread) * 1000 : unread) || 0;
						if (item) {
							parentNode = item.parentNode;
							$.elements.remove(item);
						} else {
							parentNode = $.element("mail-list");
						};
						if (!out)
							unread++;
						else
							unread = 0;
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
					break;*/
				/*case 8:
					var user = Local.data[-id];
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
						Local.data[-id].online = true;
					};
					break;
				case 9:
					var user = Local.data[-id];
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
						Local.data[-id].online = false;
						Local.data[-id].online_mobile = false;
					};
					break;*/
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
					q("[data-menu='messages']").dataset.count = id;
					break;
			}
		}
		if (inRead.length && isEnabled(2)) {
			if (isHidden())
				LongPoll.hasUnread = LongPoll.hasUnread.concat(inRead);
			else
				Site.API("messages.markAsRead", {message_ids: inRead.join(",")}, "blank");
		}
	},
	hasUnread: [],







	restart: function() {
		if (!LongPoll._ext) {
			LongPoll.abort();
			setTimeout(function () { // эта херня всё равно не пашет
				LongPoll.start();
			}, 2000);
		} else {
			sendEvent("onAccessTokenReceived", {useraccesstoken: API.accessToken});
		}
	},

	stop: function() {
		LongPoll.request && LongPoll.request.abort();
	},

	abort: function() {
		LongPoll.stop();
		LongPoll.enabled = false;
		console.log("LongPoll.stop: stopped");
	},

	getError: function(data) {
		var result = data.response,
			eid = result.error_id,
			description = result.description;
		Site.Alert({
			text: "LongPoll Error: " + eid + ": " + description,
			icon: "//static.apidog.ru/apple-touch-icon-57x57.png"
		});
	},
	resolveProblem: function(error) {
		switch (error[0]) {
			case 1:
				Site.showCaptchaBox({
					captchaImage: error[1].captchaImg,
					handler: function (value) {
						LongPoll.start(null, {id: error[1].captchaId, value: value});

					}
				});
				break;

			case 3:
			case 4:
			case 5:
			case 7:
				setTimeout(LongPoll.start, 2000);
				break;

			case 6:
				setTimeout(function() {
					LongPoll.start(LongPoll.lastRequest);
				}, 2000);
				break;

			case 2:
				alert("longpoll server api error\n\n"+JSON.stringify(error[2].source));
				break;
		}
	}
};
