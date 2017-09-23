var Board = {

	RequestPage: function(groupId) {
		switch (Site.get("act")) {

			case "create":
				if (Local.data[groupId] && !Local.data[groupId].is_admin) {
					window.location.hash = "#board" + groupId;
					return;
				}

				return Board.createBox(groupId);
				break;

			default:
				if (!~String(groupId).indexOf("_")) {
					Board.requestTopics(groupId);
				} else {
					var ids = groupId.replace(/topic-?/, "").split("_");
					Board.getTopic(ids[0], ids[1]);
				}
		}
	},

	DEFAULT_TOPICS_COUNT: 30,
	DEFAULT_COMMENTS_COUNT: 40,

	/**
	 * Request list of topics in group
	 * @param {int} groupId
	 */
	requestTopics: function(groupId) {
		Site.Loader();
		api("execute", {
			code: 'var g=parseInt(Args.g);return{t:API.board.getTopics({group_id:g,order:Args.r,offset:parseInt(Args.o),count:parseInt(Args.c),extended:1}),g:API.groups.getById({group_ids:g,fields:Args.f})};',
			g: groupId,
			r: Site.get("order"),
			o: getOffset(),
			c: Board.DEFAULT_TOPICS_COUNT,
			v: 5.56
		}).then(function(data) {
			Local.add(data.g);
			var parent = $.e("div"),
				list = $.e("div"),
				board = data.t,
				group = Local.data[-groupId],
				users = Local.add(board.profiles.concat(board.groups));

			parent.appendChild(
				Site.getPageHeader(
					board.count + " " + $.textCase(board.count, ["обсуждение", "обсуждения", "обсуждений"])
				)
			);

			if (board.can_add_topics) {
				parent.appendChild(Site.createTopButton({tag: "div", onclick: Board.createBox.bind(Board, groupId), title: "Создать тему"}));
			}

			board.items.forEach(function(c) {
				Board.topics[c.id] = c;
				list.appendChild($.e("a", {"class": "boards-item", href: "#board" + groupId + "_" + c.id, append: [
					$.e("strong", {html: c.title}),
					$.e("div", {"class": "boards-date", html: c.comments + " " + $.textCase(c.comments, ["комментарий", "комментария", "комментариев"])}),
					$.e("div", {"class": "boards-last", html: (c.updated_by > 0 ? ["Ответило", "Ответила", "Ответил"][users[c.updated_by].sex] + " " + getName(users[c.updated_by]) : "Ответил администратор сообщества") + " " + getDate(c.updated, APIDOG_DATE_FORMAT_SMART)})
				]}))
			});

			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), board.count, Board.DEFAULT_TOPICS_COUNT));
			Site.append(parent);
			Site.setHeader("Обсуждения", {link: (group.screen_name || "club" + groupId)});
		})
	},

	topics: {},

	/**
	 * Show modal window with form for create topic
	 * @param {int} groupId
	 */
	createBox: function(groupId) {
		var wrap = $.e("div", {
				"class": "board-creator",
				onsubmit:  function(event) {
					event.preventDefault();

					send();
					return false;
				}
			}),
			titleNode,

			send = function() {
				var title = titleNode.value.trim(),
					text = form.getTextarea().value.trim(),
					fromGroup = form.getFromGroup(),
					attachments = form.getAttachment().toString();

				if (!title || (!text || !attachments)) {
					Site.Alert({text: "Заполните оба поля!"});
					return false;
				}

				api("board.addTopic", {
					group_id: groupId,
					title: title,
					text: text,
					from_group: +fromGroup,
					attachments: attachments
				}).then(function() {
					modal.close();
					window.location.hash = "#board" + groupId + "_" + data;
				});
			},

			form = Site.getExtendedWriteForm({
				noHead: true,
				noLeftPhoto: true,
				asAdmin: Local.data[-groupId].is_admin,
				name: "text",
				allowAttachments: APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT,
				enableCtrlVFiles: true,
				autoHeightTextarea: true,
				onSend: function() {
					send();
				}
			}, 0, 0);


		wrap.appendChild($.e("div", {"class": "sf-wrap", append: [
			$.e("div", {"class": "tip", html: "Название обсуждения"}),
			titleNode = $.e("input", {type: "text", name: "title", required: true}),
			$.e("div", {"class": "tip", html: "Текст текст"})
		]}));

		wrap.appendChild(form.getNode());

		var modal = new Modal({
			title: "Создние обсуждения",
			content: wrap,
			footer: [
				{
					name: "close",
					title: "Закрыть",
					onclick: function() {
						this.close();
					}
				}
			]
		}).show();
	},

	/**
	 * Fetching information about group and topic
	 * @param {int} groupId
	 * @param {int} topicId
	 * @returns {Promise}
	 */
	getBoardInfo: function(groupId, topicId) {
		return new Promise(function(resolve) {
			if (Local.data[-groupId] && Board.topics[topicId]) {
				resolve({group: Local.data[-groupId], topic: Board.topics[topicId], groupId: groupId, topicId: topicId});
				return;
			}

			api("execute", {
				code: "var g=parseInt(Args.g),t=parseInt(Args.t);return{t:API.board.getTopics({group_id:g,topic_ids:t}).items[0],p:API.board.getComments({group_id:g,topic_id:t}).poll,g:API.groups.getById({group_ids:g})};",
				g: groupId,
				t: topicId,
				v: 5.56
			}).then(function(result) {
				Local.add(result.g);
				result.t.poll = result.p;
				Board.topics[topicId] = result.t;
				resolve({group: Local.data[-groupId], topic: result.t, groupId: groupId, topicId: topicId});
			});
		});
	},

	/**
	 * Show page with comments in topic
	 * @param groupId
	 * @param topicId
	 */
	getTopic: function(groupId, topicId) {
		Site.Loader();
		Board.getBoardInfo(groupId, topicId).then(function(info) {
			var parent = $.e("div"),
				topic = info.topic,
				isAdmin = info.group && info.group.is_admin,

				actions = isAdmin ? new DropDownMenu(Lang.get("general.actions"), (function() {
					var obj = {};

					obj["status"] = {
						label: topic.is_closed ? "Открыть обсуждение" : "Закрыть обсуждение",
						onclick: function(item) {
							Board.changeOpenStatus(groupId, topicId, topic, item);
						}
					};

					obj["fix"] = {
						label: topic.is_fixed ? "Открепить обсуждение" : "Закрепить обсуждение",
						onclick: function(item) {
							Board.changeFixStatus(groupId, topicId, topic, item);
						}
					};

					obj["edit"] = {
						label: "Редактировать",
						onclick: function() {
							Board.editTopic(groupId, topicId, this)
						}
					};

					obj["remove"] = {
						label: "Удалить обсуждение",
						onclick: function() {
							Board.removeTopic(groupId, topicId, this);
						}
					};
					return obj;
				})()) : null;

			parent.appendChild(Site.getPageHeader(info.topic.title.safe(), actions && actions.getNode()));


			if (topic.poll) {
				topic.poll.is_board = 1;
				parent.appendChild(Polls.getFullAttachment(topic.poll));
			}

			// TODO: reply style change
			// "[post" + i + "|" + (u.first_name || u.name) + "], " + n.value;
			parent.appendChild(comments({
				getMethod: "board.getComments",
				addMethod: "board.createComment",
				editMethod: "board.editComment",
				removeMethod: "board.deleteComment",
				restoreMethod: "board.restoreComment",
                ownerId: groupId,
				ownerField: "group_id",
				itemId: topicId,
				type: "topic",
				countPerPage: Board.DEFAULT_COMMENTS_COUNT,
				canComment: !info.topic.is_closed
			}));

			Site.append(parent);
			Site.setHeader("Обсуждение", {link: "board" + groupId});
		})
	},

	/**
	 * Request to change status of topic
	 * @param {int} groupId
	 * @param {int} topicId
	 * @param {Topic} topic
	 * @param {object} item
	 */
	changeOpenStatus: function(groupId, topicId, topic, item) {
		item.disable().commit();
		api(topic.is_closed ? "board.openTopic" : "board.closeTopic", {
			group_id: groupId,
			topic_id: topicId
		}).then(function() {
			topic.is_closed = !topic.is_closed;
			item.label(topic.is_closed ? "Открыть обсуждение" : "Закрыть обсуждение").enable().commit();
		});
	},

	/**
	 * Request to change fix status of topic
	 * @param {int} groupId
	 * @param {int} topicId
	 * @param {Topic} topic
	 * @param {object} item
	 */
	changeFixStatus: function(groupId, topicId, topic, item) {
		item.disable().commit();
		api(topic.is_fixed ? "board.fixTopic" : "board.unfixTopic", {
			group_id: groupId,
			topic_id: topicId
		}).then(function() {
			topic.is_fixed = !topic.is_fixed;
			item.label(topic.is_fixed ?  "Открепить обсуждение" : "Закрепить обсуждение").enable().commit();
		});
	},

	/**
	 * Show form and request for edit topic
	 * @param {int} groupId
	 * @param {int} topicId
	 * @param {HTMLElement} from
	 */
	editTopic: function(groupId, topicId, from) {
		var modal = new Modal({
			title: "Редактирование",
			content: Site.createInlineForm({
				name: "title",
				title: "Сохранить",
				type: "text",
				value: Board.topics[topicId].title,
				onsubmit: function(event) {
					event.preventDefault();
					var title = this.title.value.trim();
					if (!title) {
						Site.Alert({text: "Введите название!"});
						return false;
					}

					api("board.editTopic", {
						group_id: groupId,
						topic_id: topicId,
						title: title
					}).then(function() {
						Site.Alert({text: "Название успешно изменено!"});
						modal.remove();
					});
					return false;
				}
			}),
			footer: [{
				name: "close",
				title: "Отмена",
				onclick: function() {
					this.close();
				}
			}],
			noPadding: true
		}).show(from);
	},

	/**
	 * Confirm and request to remove topic
	 * @param {int} groupId
	 * @param {int} topicId
	 * @param {HTMLElement} from
	 */
	removeTopic: function(groupId, topicId, from) {
		VKConfirm("Вы уверены, что хотите удалить обсуждение? Это дейстие нельзя отменить!", function() {
			api("board.deleteTopic", {
				group_id: groupId,
				topic_id: topicId
			}).then(function() {
				Site.Alert({text: "Обсуждение удалено!"});
				window.location.hash = "#board" + groupId;
			});
		}, from);
	}
};
