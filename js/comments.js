/**
 *
 * @param {{
 *     getMethod: string,
 *     addMethod: string,
 *     editMethod: string,
 *     removeMethod: string,
 *     restoreMethod: string=,
 *     reportMethod: string=,
 *     ownerId: int,
 *     itemId: int,
 *     ownerField: string=,
 *     type: string,
 *     accessKey: string=,
 *     countPerPage: int,
 *     canComment: boolean
 * }} options
 * @returns {HTMLElement}
 */
function comments(options) {

	if (!options) {
		throw "No options";
	}

	var API_FIELDS_DATA = "online,screen_name,first_name_dat,last_name_dat,sex,photo_50",

		type = options.type,
		ownerId = parseInt(options.ownerId),
		itemId = parseInt(options.itemId),
		ownerField = options.ownerField || "owner_id",

		db = {},

		request = {

			/**
			 * Getting comments
			 */
			getComments: function() {
				var params = {count: options.countPerPage, offset: mOffset, need_likes: 1, sort: "asc", extended: 1, fields: API_FIELDS_DATA, v: 5.65};
				params[ownerField] = options.ownerId;
				params[options.type + "_id"] = options.itemId;
				options.accessKey && (params.access_key = options.accessKey);
				api(options.getMethod, params).then(function(data) {
					Local.add(data.profiles);
					Local.add(data.groups);
					show(data.count, data.items);
				});
			},

			/**
			 * Request to post comment
			 * @param {string} text
			 * @param {string=} attachment
			 * @param {int=} reply2comment
			 * @param {int=} fromGroup
			 * @param {int=} stickerId
			 */
			addComment: function(text, attachment, reply2comment, fromGroup, stickerId) {
				var params = {message: text, attachments: attachment, reply_to_comment: reply2comment, sticker_id: stickerId || 0, v: 5.65, from_group: fromGroup};
				params[ownerField] = options.ownerId;
				params[options.type + "_id"] = options.itemId;
				api(options.addMethod, params).then(function(data) {
					var commentId = data && data.comment_id || data;
					writeForm.getAttachment().clear();
					observer.addComment(commentId, text, attachment, reply2comment, fromGroup, stickerId);
				});
			},

			/**
			 * Request to edit comment
			 * @param {int} commentId
			 * @param {string} text
			 * @param {string=} attachment
			 * @returns {Promise}
			 */
			editComment: function(commentId, text, attachment) {
				var params = {
					comment_id: commentId,
					message: text,
					attachments: attachment,
					v: 5.65
				};
				params[ownerField] = options.ownerId;
				params[options.type + "_id"] = options.itemId;
				return api(options.editMethod, params);
			},

			/**
			 * Request to remove comment
			 * @param {object} comment
			 */
			removeComment: function(comment) {
				var params = {
					comment_id: comment.id,
					v: 5.65
				};
				params[ownerField] = options.ownerId;
				params[options.type + "_id"] = options.itemId;
				api(options.removeMethod, params).then(function() {
					listWrap.firstChild.insertBefore(ui.getRestorePlaceholder(comment), comment._.wrap);
					listWrap.firstChild.removeChild(comment._.wrap);
				}).catch(function(error) {
					// TODO: user notify
				});
			},

			/**
			 * Request to restore comment
			 * @param {object} comment
			 */
			restoreComment: function(comment) {
				var params = {
					comment_id: comment.id,
					v: 5.65
				};
				params[ownerField] = options.ownerId;
				params[options.type + "_id"] = options.itemId;
				api(options.restoreMethod, params).then(function() {
					listWrap.firstChild.insertBefore(comment._.wrap, comment._.restore);
					listWrap.firstChild.removeChild(comment._.restore);
				}).catch(function(error) {
					// TODO: user notify
				});
			},

			/**
			 * Request to report comment
			 * @param {object} comment
			 */
			reportComment: function(comment) {
				var params = {
					comment_id: comment.id,
					v: 5.65
				};
				params[ownerField] = options.ownerId;
				params[options.type + "_id"] = options.itemId;
				api(options.reportMethod, params).then(function() {
					new Snackbar({
						text: "Sent",
						duration: 2000
					})
				}).catch(function(error) {
					// TODO: user notify
				});
			}

		},

		ui = {

			/**
			 *
			 * @param {object} comment
			 * @param {object} user
			 */
			reply: function(comment, user) {
				if (comment.id === mReply) {
					return;
				}

				var area = writeForm.getTextarea(),
					str = "[" + user.screen_name + "|" + user.first_name + "], ",
					position;
				area.focus();
				if (!area.value.length) {
					area.value += str;
					position = area.value.length;
				} else {
					area.value = str + area.value;
					position = str.length;
				}
				setSelectionRange(area, position, position);

				writeForm.setReply(user);

				mReply = comment.id;
			},

			edit: function(comment) {
				var form = Site.getExtendedWriteForm({
						name: "message",
						noLeftPhoto: true,
						noHead: true,
						allowAttachments: APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT,
						ownerId: ownerId,
						smiles: true,
						ctrlEnter: true,
						value: comment.text,
						valueAttachments: comment.attachments,
						enableCtrlVFiles: true,
						autoHeightTextarea: true,

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

							request.editComment(comment.id, text, attachments).then(function() {

								utils.appendAttachmentsByString(comment, attachments, 0);

								comment._.text.innerHTML = Site.toHTML(text).emoji();

								formNode.parentNode.insertBefore(comment._.text, formNode);
								formNode.parentNode.insertBefore(comment._.attachments = Site.createNodeAttachments(comment.attachments, "comment" + ownerId + "_" + comment.id), formNode);

								$.elements.remove(formNode);

							});
							return false;
						}
					}, ownerId, itemId),
					formNode = form.getNode();

				comment._.text.parentNode.insertBefore(formNode, comment._.text);
				$.elements.remove(comment._.text);
				$.elements.remove(comment._.attachments);
			},

			report: function(comment) {
				showReportWindow("wall.reportComment", ownerId, "comment", comment.id, null, false);
			},

			getRestorePlaceholder: function(comment) {
				return comment._.restore = e("div", {"class": "comment-deleted", append: [
					e("span",{
						html: "Комментарий успешно удален. "
					}),
					e("span", {
						"class": "a",
						html: "Восстановить",
						onclick: function() {
							request.restoreComment(comment);
						}
					})
				]});
			},

			clearForm: function() {
				writeForm.getTextarea().value = "";
				writeForm.getAttachment().clear();
			}

		},

		utils = {
			parseComment: function(commentId, text, attachment, reply2comment, fromGroup, stickerId) {
				/** @var {Comment} c */
				var c = {
					from_id: fromGroup ? ownerId : API.userId,
					id: commentId,
					text: text,
					date: parseInt(Date.now() / 1000),
					likes: {count: 0, user_likes: 0, can_like: 1},
					can_edit: 1,
					can_delete: 1
				};

				utils.appendAttachmentsByString(c, attachment, stickerId);

				if (reply2comment) {
					c.reply_to_comment = reply2comment;
					c.reply_to_user = db[reply2comment] && db[reply2comment].from_id;
				}

				return c;
			},

			/**
			 * Parse attachment string to objects
			 * @param {Comment} comment
			 * @param {string} attachmentString
			 * @param {int=} stickerId

			 */
			appendAttachmentsByString: function(comment, attachmentString, stickerId) {

				if (stickerId) {
					comment.attachments = [{type: "sticker", sticker: { id: stickerId }}];
				}

				var type;
				if (attachmentString) {
					comment.attachments = attachmentString.split(",").map(function(i) {
						console.log(i);
						type = /(photo|video|audio|doc)(-?\d+_\d+)/img.exec(i);
						type = type[1];
						var id = i.replace(type, "");
						i = {type: type};
						i[type] = AttachmentController.mediaCache[type][id];
						return i;
					});
				}
			}
		},

		observer = {
			addComment: function(commentId, text, attachment, reply2comment, fromGroup, stickerId) {
				var c = utils.parseComment(commentId, text, attachment, reply2comment, fromGroup, stickerId);
				ui.clearForm();

				listWrap.firstChild.appendChild(getItem(c));
				mReply = 0;
			}
		},

		e = $.e,

		getItem = function(c) {

			var commentId = c.id,

				userId = c.from_id || c.user_id,
				user = Local.data[userId],

				replyId = c.reply_to_user,
				reply = Local.data[replyId] || {},

				canEdit = c.can_edit,
				canDelete = c.can_delete || canEdit || ownerId === API.userId || (Local.data[ownerId] && Local.data[ownerId].is_admin),

				wrap = e("div", {
					id: "comment-" + type + "_" + ownerId + "_" + itemId + "_" + commentId,
					"class": "comment"
				});

			c._ = {};
			db[commentId] = c;

			user.screen_name = user.screen_name || (userId > 0 ? "id" + userId : "club" + -userId);

			wrap.appendChild(e("a", {
					"class": "comment-left",
					href: "#" + user.screen_name,
					append: e("img", {src: getURL(user.photo_50)})
				}));

			wrap.appendChild(e("div", {"class":"comment-right", append: [
				e("a", {
					href: "#" + user.screen_name,
					append: e("strong", { html: getName(user) })
				}),

				replyId
					? e("span", {html: " ответил" + (user.sex === 1 ? "а" : "") + " "})
					: null,

				replyId
					? e("a", {
						href: "#" + reply.screen_name,
						html: reply.name || reply.first_name_dat + " " + reply.last_name_dat})
					: null,

				c._.text = e("div",{
					"class": "comment-content",
					id: "wall-cmt" + ownerId + "_" + commentId,
					html: Site.toHTML(c.text).emoji()
				}),

				c._.attachments = e("div", {
					"class": "comment-attachments",
					append: Site.createNodeAttachments(c.attachments, "comment" + ownerId + "_" + commentId)
				}),

				e("div", { "class": "comment-footer", append: [
					getLikeButton(type === "post" ? "comment" : type + "_comment", ownerId, commentId, null, c.likes && c.likes.count, c.likes && c.likes.user_likes, null, {right: true}),
					e("div", {"class": "comment-meta", append: [
						e("div", { "class": "comment-actions", append: [

							options.canComment
								? e("a", {
									"class": "comment-action",
									href: getLink(commentId),
									html: "Ответить",
									onclick: function(event) {
										$.event.cancel(event);
										ui.reply(c, user);
									}
								})
								: null,

							canEdit
								? e("span",{
									"class": "comment-action",
									html: "Редактировать",
									onclick: function() {
										ui.edit(c);
									}})
								: null,

							!canEdit
								? e("span",{
									"class": "comment-action",
									html: "Пожаловаться",
									onclick: function() {
										ui.report(c);
									}})
								: null,

							canDelete
								? e("span",{
									"class": "comment-action",
									html: "Удалить",
									onclick: function() {
										request.removeComment(c);
									}})
								: null
						]}),
						e("div", {
							"class": "comment-date",
							"data-time": c.date,
							html: getDate(c.date, APIDOG_DATE_FORMAT_SMART)
						}),
					]})
				]})
			]}));
			return c._.wrap = wrap;
		},

		/**
		 * Get link to comment or page
		 * @param {int=} commentId
		 * @returns {string}
		 */
		getLink = function(commentId) {
			var params = [];

			if (mOffset) {
				params.push("offset=" + mOffset);
			}

			if (commentId) {
				params.push("reply=" + commentId);
			}

			return "#" + (type === "post" ? "wall" : type) + ownerId + "_" + itemId + (params.length ? "?" + params.join("&") : "");
		},

		/**
		 * Show loaded chunk in page
		 * @param {int} count
		 * @param {object[]} items
		 */
		show = function(count, items) {
			setCount(count);

			if (!mOffset && !count) {
				nothing();
				return;
			}

			var newList = $.e("div");

			items.forEach(function(comment) {
				newList.appendChild(getItem(comment));
			});

			listWrap.children.length && listWrap.removeChild(listWrap.firstChild);
			listWrap.appendChild(newList);
			rebuildPagination();
		},

		/**
		 * Nothing
		 */
		nothing = function() {
			listWrap.appendChild(Site.getEmptyField(options.canComment ? "Комментариев нет" : "Автор ограничил возможность комментирования записи"));
		},

		/**
		 * Rebuild pagination at top and bottom list
		 */
		rebuildPagination = function() {
			$.elements.clearChild(paginationTop).appendChild(Site.getSmartPagebar(mOffset, mCount, options.countPerPage, {
				onClick: nextPage
			}));
			$.elements.clearChild(paginationBottom).appendChild(Site.getSmartPagebar(mOffset, mCount, options.countPerPage, {
				onClick: nextPage
			}));
		},

		/**
		 * @param {int} newOffset
		 */
		nextPage = function(newOffset) {
			mOffset = newOffset;
			request.getComments();
		},

		mCount = 0,
		mOffset = 0,
		mReply = 0,

		setCount = function(count) {
			mCount = count;
			headTitle.innerHTML = count ? "Комментарии <i class=count>" + count + "<\/i>" : "Комментариев нет";
			setAddress();
		},

		setAddress = function() {
			window.history.replaceState(null, document.title, getLink());
		},

		getWriteForm = function() {
			var form = Site.getExtendedWriteForm({
				name: "message",
				title: "Добавить комментарий",
				noLeftPhoto: true,
				allowAttachments: APIDOG_ATTACHMENT_PHOTO | APIDOG_ATTACHMENT_VIDEO | APIDOG_ATTACHMENT_AUDIO | APIDOG_ATTACHMENT_DOCUMENT | APIDOG_ATTACHMENT_STICKER,
				owner_id: ownerId,
				asAdmin: ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin,
				reply: true,
				smiles: true,
				ctrlEnter: true,
				enableCtrlVFiles: true,
				autoHeightTextarea: true,

				/**
				 *
				 * @param {{text: string, asAdmin: boolean, attachments: AttachmentController, textAreaNode: HTMLElement, clear: function}} data
				 * @returns {boolean}
				 */
				onSend: function(data) {
					var text = data.text,
						fromGroup = +data.asAdmin,
						attachments = data.attachments.toString();

					if (!text && !attachments) {
						Site.Alert({ text: "Введите текст!", click: data.textAreaNode.focus.bind(data.textAreaNode)});
						return false;
					}

					form.clear();

					request.addComment(text, attachments, mReply, fromGroup);
					return false;
				}
			}, ownerId, itemId);
			form.getEmotions().setOnClick(function(type, stickerId) {
				request.addComment("", "", 0, +form.getFromGroup(), stickerId);
				form.getEmotions().close();
			});

			return form;
		};

	var wrap = $.e("div", {"class": "x-comments-wrap"}),
		headTitle = $.e("div", {html: "..."}),
		header = Site.getPageHeader(headTitle),
		listWrap = $.e("div", {"class" :"x-comments-items"}),

		paginationTop = $.e("div", {"class": "pagination pagination-top"}),
		paginationBottom = $.e("div", {"class": "pagination pagination-top"}),

		writeForm = options.canComment && getWriteForm();

	wrap.appendChild(header);
	wrap.appendChild(paginationTop);
	wrap.appendChild(listWrap);
	wrap.appendChild(paginationBottom);

	options.canComment && wrap.appendChild(writeForm.getNode());

	if (Site.get("offset")) {
		mOffset = Site.get("offset");
	}

	request.getComments();

	return wrap;
}