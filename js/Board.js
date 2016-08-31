/**
 * APIdog v6.5
 *
 * upd: -1
 */

var Board = {
	RequestPage: function (group_id) {
		switch (Site.get("act")) {
			case "create":
				if (Local.Users[group_id] && !Local.Users[group_id].is_admin)
					return window.location.hash = "#board" + group_id;
				return Board.createBox(group_id);
			break;
			default:
				if (String(group_id).indexOf("_") < 0)
					return Board.list(group_id);
				else {
					var ids = group_id.replace("topic-", "").split("_");
					return Board.getTopic(ids[0], ids[1]);
				}
		}
	},
	list: function (group_id) {
		Site.Loader();
		Site.API("execute", {
			code: 'return [API.board.getTopics({group_id:%g%,order:%r%,offset:%o%,count:30,extended:1,v:5.0}),API.groups.getById({group_ids:%g%,fields:"can_add_topics"})[0]];'
					.replace(/%g%/ig, group_id)
					.replace(/%r%/ig, Site.get("order"))
					.replace(/%o%/ig, getOffset())
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				fieldlist = document.createElement("div"),
				board = data[0],
				group = data[1],
				users = Local.add(board.profiles.concat(board.groups)),
				list = board.items;
			parent.appendChild(
				Site.CreateHeader(
					board.count + " " + $.TextCase(board.count, ["обсуждение", "обсуждения", "обсуждений"])
				)
			);
			if (board.can_add_topics)
				parent.appendChild(Site.CreateTopButton({link: "board" + group_id + "?act=create", title: "Создать тему"}));
			for (var i = 0; i < list.length; i++) {
				var c = list[i];
				Board.topics[c.id] = c;
				fieldlist.appendChild($.elements.create("a", {"class": "boards-item", href: "#board" + group_id + "_" + c.id, append: [
					$.e("strong", {html: c.title}),
					$.e("div", {"class": "boards-date", html: c.comments + " " + $.TextCase(c.comments, ["комментарий", "комментария", "комментариев"])}),
					$.e("div", {"class": "boards-last", html: (c.updated_by > 0 ? ["Ответило", "Ответила", "Ответил"][users[c.updated_by].sex] + " " + users[c.updated_by].first_name + " " + users[c.updated_by].last_name : "Ответил администратор сообщества") + " " + $.getDate(c.updated)})
				]}))
			};
			parent.appendChild(fieldlist);
			parent.appendChild(Site.PagebarV2(getOffset(), board.count, 30));
			Site.Append(parent);
			Site.SetHeader("Обсуждения", {link: group.screen_name || "club" + group_id});
		})
	},
	topics: {},
	createBox: function (group_id) {
		var Form = document.createElement("form");
		Form.appendChild(Site.CreateHeader("Создание обсуждения"));
		Form.appendChild($.elements.create("div", {"class": "sf-wrap", append: [
			$.elements.create("div", {"class": "tip", html: "Название обсуждения"}),
			$.elements.create("input", {type: "text", name: "title", required: true, style: "border:1px solid #D4D7E2"}),
			$.elements.create("div", {"class": "tip", html: "Текст текст"})
		]}));
		Form.className = "board-creater";
		Form.appendChild(Site.CreateWriteForm({
			nohead: true,
			asAdmin: true,
			name: "text",
			allowAttachments: 30,
			noleft: true
		}).children[0]);
		Form.onsubmit = function (event) {
			var title = this.title && $.trim(this.title.value),
				text = this.text && $.trim(this.text.value),
				from_group = this.as_admin && this.as_admin.checked,
				attachments = this.attachments && this.attachments.value;
			if (!title || !text) {
				Site.Alert({text: "Заполните оба поля!"});
				return false;
			}
			Site.API("board.addTopic", {
				group_id: group_id,
				title: title,
				text: text,
				from_group: +from_group,
				attachments: attachments
			}, function (data) {
				data = Site.isResponse(data);
				if (data)
					window.location.hash = "#board" + group_id + "_" + data;
			});
			return false;
		};
		Site.Append(Form);
		Site.SetHeader("Создание обсуждения", {link: "board" + group_id});
	},
	getTopic: function (group_id, board_id) {
		Site.Loader();
		Site.API("execute", {
			code: 'return [API.board.getComments({group_id:%g%,topic_id:%b%,need_likes:1,extended:1,count:40,offset:%o%,sort: "asc",v:5.0}),API.board.getTopics({group_id:%g%,topic_ids:%b%}).items[0],API.groups.getById({group_id:%g%})[0].is_admin];'
					.replace(/%g%/ig, group_id)
					.replace(/%b%/ig, board_id)
					.replace(/%o%/ig, getOffset())
		}, function (data) {
			data = Site.isResponse(data);
			var topic = data[1],
				isAdmin = data[2],
				data = data[0],
				comments = data.items,
				users = Local.add(data.profiles.concat(data.groups)),
				count = data.count,
				parent = document.createElement("div"),
				list = document.createElement("div"),
				actions = isAdmin ? Site.CreateDropDownMenu("Действия", (function (topic, gid, tid) {
					var obj = {};
					if (topic.is_closed)
						obj["Открыть обсуждение"] = function (event) {
							return Board.openBoard(gid, tid);
						};
					else
						obj["Закрыть обсуждение"] = function (event) {
							return Board.closeBoard(gid, tid);
						};
					if (topic.is_fixed)
						obj["Открепить обсуждение"] = function (event) {
							return Board.unfixBoard(gid, tid);
						};
					else
						obj["Закрепить обсуждение"] = function (event) {
							return Board.fixBoard(gid, tid);
						};
					obj["Редактировать"] = function (event) {
						return Board.editBoard(gid, tid);
					};
					obj["Удалить обсуждение"] = function (event) {
						return Board.deleteBoard(gid, tid);
					};
					return obj;
				})(topic, group_id, board_id)) : "";
			Board.topics[topic.id] = topic;
			parent.appendChild(Site.CreateHeader("Обсуждение", actions));
			var header = Site.CreateHeader(
				$.elements.create("div", {id: "topicname", html: "<strong>" + Site.Escape(topic.title) + "<\/strong>"})
				, $.elements.create("div", {id: "topicname_count", "class": "tip fr", html: topic.comments + " " +$.TextCase(topic.comments, "комментарий,комментария,комметариев".split(","))})),
				form = Board.getWriteForm(group_id, board_id, isAdmin, list),
				ft = form.querySelector("textarea");
			header.style.marginTop = "-7px";
			header.style.borderTop = "none";
			parent.appendChild(header);
			if (data.poll) {
				data.poll.is_board = true;
				parent.appendChild($.elements.create("div", {
					id: "poll" + data.poll.owner_id + "_" + (data.poll.poll_id || data.poll.id),
					append: Polls.getFullAttachment(data.poll)
				}));
			}
			for (var i = 0, l = comments.length; i < l; ++i) {
				list.appendChild(Board.item(comments[i], isAdmin, group_id, board_id, {textarea: ft}));
			}
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(getOffset(), count, 40));
			if (!topic.is_closed)
				parent.appendChild(form);
			Site.Append(parent);
			Site.SetHeader("Обсуждение", {link: "board" + group_id});
		})
	},
	comments: {},
	item: function (c, is_admin, group_id, topic_id, o) {
		o = o || {};
		Board.comments[group_id + "_" + topic_id + "_" + c.id] = c;
		var item = document.createElement("div"),
			from = c.from_id,
			user = Local.Users[from],
			screen_name = user.screen_name,
			name = from > 0 ? user.first_name + " " + user.last_name : user.name,
			photo = getURL(user.photo || user.photo_50),
			actions = [],
			textNode = $.elements.create("div", {html: Site.Format(c.text)});
		item.className = "comments board-creater";
		item.id = "comment_topic_" + group_id + "_" + topic_id + "_" + c.id;
		actions.push($.e("span", {"class": "a", html: "Ответить", onclick: (function (n, u, i) {
			return function (event) {
				n.value = "[post" + i + "|" + (u.first_name || u.name) + "], " + n.value;
				n.focus();
			};
		})(o.textarea, user, c.id)}));
		actions.push($.e("span", {"class": "tip", html: " | "}));
		if (API.userId == from || is_admin && from < 0) {
			actions.push($.elements.create("span", {"class": "a", html: "Редактировать", onclick: (function (node, group_id, topic_id, comment_id, is_admin) {
				return function (event) {
					var node = textNode.parentNode;
					$.elements.clearChild(node);
					node.appendChild(Board.editForm(group_id, topic_id, comment_id, is_admin));
				};
			})(textNode, group_id, topic_id, c.id, is_admin)}));
			actions.push($.elements.create("span", {"class": "tip", html: " | "}));
		}
		if (is_admin || API.userId == from)
			actions.push($.elements.create("span", {"class": "a", html: "Удалить", onclick: (function (id, elem) {
				return function (event) {
					Site.API("board.deleteComment", {
						group_id: group_id,
						topic_id: topic_id,
						comment_id: id
					}, function (data) {
						data = Site.isResponse(data);
						if (data) {
							$.elements.clearChild(elem);
							elem.appendChild($.elements.create("div", {"class": "comment-deleted", append: [
								document.createTextNode("Комментарий удален. "),
								$.elements.create("span", {"class": "a", html: "Восстановить", onclick: (function (group_id, topic_id, comment_id) {
									return function (event) {
										Site.API("board.restoreComment", {
											group_id: group_id,
											topic_id: topic_id,
											comment_id: comment_id
										}, function (data) {
											data = Site.isResponse(data);
											if (data)
												$.elements.clearChild(item);
											item.parentNode.insertBefore(Board.item(Board.comments[group_id + "_" + topic_id + "_" + comment_id], is_admin, group_id, topic_id), item);
											$.elements.remove(item);
										})
									};
								})(group_id, topic_id, id)})
							]}))
						}
					});
				}
			})(c.id, item)}));
		item.appendChild($.e("div", {"class": "comments-left", append:$.e("img", {src: getURL(photo)})}));
		item.appendChild($.e("div", {"class": "comments-right", append: [
			$.elements.create("a", {href: "#" + screen_name, html: "<strong>%n%</strong>".replace("%n%", Site.Escape(name))}),
			$.elements.create("div", {"class": "comments-content", id: "topic" + group_id + "_" + topic_id + "_" + c.id + "_text", append: [textNode]}),
			$.elements.create("div", {"class": "comments-attachments", append:[Site.Attachment(c.attachments)]}),
			$.elements.create("div",{
				"class": "comments-footer",
				append: [
					$.elements.create("div", {"class": "comments-actions", append: actions}),
					$.elements.create("div",{"class": "comments-footer-left", html:$.getDate(c.date)}),
					$.elements.create("div",{
						"class": "wall-likes likes",
						id: "like_topic_comment_-" + group_id + "_" + c.id,
						append: [Wall.LikeButton("topic_comment", -group_id, c.id, c.likes)]
					})
				]
			})
		]}));
		return item;
	},
	getWriteForm: function (group_id, topic_id, is_admin, list) {
		return Site.CreateWriteForm({
			name: "text",
			asAdmin: is_admin,
			owner_id: -group_id,
			onsubmit: function (event) {
				var text = this.text && $.trim(this.text.value),
					attachments = this.attachments && this.attachments.value,
					from_group = this.as_admin && +this.as_admin.checked,
					nodeList = list,
					nodeText = this.text;
				if (!text) {
					Site.Alert({text: "Введите текст!"});
					return false;
				}
				Site.API("board.addComment", {
					group_id: group_id,
					topic_id: topic_id,
					text: text,
					attachments: attachments.replace(/(^,|,$)/ig, ""),
					from_group: from_group
				}, function (data) {
					data = Site.isResponse(data);
					if (data) {
						nodeList.appendChild(Board.item({
							from_id: from_group ? -group_id : API.userId,
							date: Math.round(+new Date() / 1000),
							text: text,
							id: data
						}, is_admin, group_id, topic_id));
						nodeText && (nodeText.value = "");
					}
				});
				return false;
			},
			allowAttachments: 30
		});
	},
	editForm: function (group_id, topic_id, comment_id, is_admin) {
		var item = Board.comments[group_id + "_" + topic_id + "_" + comment_id];
		return Site.CreateWriteForm({
			name: "text",
			value: item.text,
			nohead: true,
			noleft: true,
			onsubmit: function (event) {
				var text = this.text && $.trim(this.text.value),
					attachments = this.attachments && this.attachments.value,
					nodeText = this.text;
				if (!text) {
					Site.Alert({text: "Введите текст!"});
					return false;
				}
				Site.API("board.editComment", {
					group_id: group_id,
					topic_id: topic_id,
					comment_id: comment_id,
					text: text,
					attachments: attachments
				}, function (data) {
					data = Site.isResponse(data);
					if (data) {
						var node = $.element("comment_topic_" + group_id + "_" + topic_id + "_" + comment_id);
						node.parentNode.insertBefore(Board.item({
							from_id: item.from_id,
							date: Math.round(+new Date() / 1000),
							text: text,
							id: comment_id
						}, is_admin, group_id, topic_id), node);
						nodeText && (nodeText.value = "");
						$.elements.remove(node);
					}
				});
				return false;
			},
			allowAttachments: 30
		});
	},
	openBoard: function (group_id, topic_id) {
		Site.API("board.openTopic", {
			group_id: group_id,
			topic_id: topic_id
		}, function (data) {
			data = Site.isResponse(data);
			if (data)
				Site.Go(window.location.hash);
		})
	},
	closeBoard: function (group_id, topic_id) {
		Site.API("board.closeTopic", {
			group_id: group_id,
			topic_id: topic_id
		}, function (data) {
			data = Site.isResponse(data);
			if (data)
				Site.Go(window.location.hash);
		})
	},
	fixBoard: function (group_id, topic_id) {
		Site.API("board.fixTopic", {
			group_id: group_id,
			topic_id: topic_id
		}, function (data) {
			data = Site.isResponse(data);
			if (data) {
				Site.Alert({text: "Обсуждение закреплено!"});
				Site.Go(window.location.hash);
			}
		})
	},
	unfixBoard: function (group_id, topic_id) {
		Site.API("board.unfixTopic", {
			group_id: group_id,
			topic_id: topic_id
		}, function (data) {
			data = Site.isResponse(data);
			if (data) {
				Site.Alert({text: "Обсуждение откреплено!"});
				Site.Go(window.location.hash);
			}
		})
	},
	editBoard: function (group_id, topic_id) {
		var parent = $.element("topicname");
		$.elements.addClass($.element("topicname_count"), "hidden");
		$.elements.clearChild(parent);
		parent.appendChild(Site.CreateInlineForm({
			name: "title",
			title: "Сохранить",
			type: "text",
			value: Site.Escape(Board.topics[topic_id].title),
			onsubmit: function (event) {
				if (this.title && !$.trim(this.title.value)){
					Site.Alert({text: "Введите название!"});
					return false;
				}
				var text = this.title && this.title.value;
				Site.API("board.editTopic", {
					group_id: group_id,
					topic_id: topic_id,
					title: text
				}, function (data) {
					data = Site.isResponse(data);
					if (data) {
						Site.Alert({text: "Название успешно изменено!"});
						$.elements.clearChild(parent);
						$.elements.removeClass($.element("topicname_count"), "hidden");
						parent.appendChild($.elements.create("strong", {html: Site.Escape(text)}));
						Board.topics[topic_id] && (Board.topics[topic_id].title = text);
					}
				});
				return false;
			}
		}));
	},
	deleteBoard: function (group_id, topic_id) {
		Site.API("board.deleteTopic", {
			group_id: group_id,
			topic_id: topic_id
		}, function (data) {
			data = Site.isResponse(data);
			if (data) {
				Site.Alert({text: "Обсуждение удалено!"});
				window.location.hash = "#board" + group_id;
			}
		})
	}
};