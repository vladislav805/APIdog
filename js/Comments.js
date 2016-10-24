// Created 09.01.2016
// Modified 10.01.2016
function Comments (objectId, comments, api, callbacks, options) {
	var that = this, e = $.e;
	this.object = objectId;
	this.object.itemId = this.object.postId || this.object.photoId || this.object.videoId || this.object.noteId || this.object.topicId;
	this.object.id = this.object.type + this.object.ownerId + "_" + this.object.itemId;
	this.parseComments(comments);
	this.api = api;
	this.callbacks = callbacks;
	this.options = options;
	this.offset = 0;

	this.nodeWrap = e("div", {"class": "vkcomments-wrap", append: [
		this.nodeHead = e("div", {
			"class": "vkcomments-header",
			append: [
				this.nodePaginationBefore = e("div", {"class": "vkcomments-pagination"}),
				this.nodeTitle = e("h3", {
					"class": "vkcomments-header-title",
					html: this.getHeaderText()
				})
			]
		}),
		this.nodeList = e("div", {"class": "vkcomments-list"}),
		this.nodePaginationAfter = e("div", {"class": "vkcomments-pagination"}),
		this.nodeWriteForm = this.getWriteForm()
	]});
};

Comments.prototype = {

	nodeWrap: null,
	nodeHead: null,
	nodeTitle: null,
	nodePaginationBefore: null,
	nodeList: null,
	nodePaginationAfter: null,
	nodeWriteForm: null,

	getNode: function() {
		this.populate();

		return this.nodeWrap;
	},

	parseComments: function(comments) {
		var that = this;
		this.count = comments.count;
		Local.add(comments.profiles);
		Local.add(comments.groups);
		this.items = comments.items.map(function(comment) {
			return new VKComment(that, comment, that.object.ownerId);
		});
		return this;
	},

	populate: function() {
		var list = this.nodeList;
		this.items.forEach(function(comment) {
			list.appendChild(comment.getNode());
		});
		$.elements.clearChild(this.nodePaginationAfter).appendChild(this.getPagination());
		$.elements.clearChild(this.nodePaginationBefore).appendChild(this.getPagination());
		return this;
	},

	getHeaderText: function() {
		return this.count + " " + Lang.get("comment", "comments", this.count);
	},

	getWriteForm: function() {
		var form = new WriteForm({
			context: this,
			api: this.api.add,
			onSend: function(event) {
				console.log(event);
			}
		});
		this.writeForm = form;
		return form.getNode();
	},

	getPagination: function() {
		var e = $.e,
			context = this,
			wrap = e("div", {"class": "vkcomments-pagination-inner", count: count}),
			step = 40,
			offset = this.offset,
			count = this.count,
			fx = function(offset) {
				return function() {
					context.loadComments(parseInt(offset));
				};
			},

			item = function(i, text) {
				return e("div", {
					"data-offset": i,
					onclick: fx(i),
					"class": "vkcomments-pagination-item " + (i == offset ? "vkcomments-pagination-item-active" : ""),
					html: text || (Math.round(i / step) + 1)
				});
			};

		var k = 0;

		if (offset - step * 4 >= 0) {
			wrap.appendChild(item(0));
			wrap.appendChild(e("span", {"class": "vkcomments-pagination-item-points", html: "…"}));
		};

		for (var i = offset - (step * 3), l = offset + (step * 3); i <= l; i += step) {
			if (i < 0 || i >= count) {
				continue;
			};

			if (i >= (offset + step * 4)) {
				break;
			};

			wrap.appendChild(item(i));
			k++;
		};

		if (offset + step * 4 <= count) {
			wrap.appendChild(e("span", {"class": "vkcomments-pagination-item-points", html: "…"}));
			wrap.appendChild(item(Math.floor(count / step) * step, Math.floor(count / step) + 1));
		};

		return k > 1 ? wrap : e("div");
	},

	loadComments: function(offset) {
		var that = this;

		this.offset = offset;

		new APIRequest("execute", {
			code: 'var o=Args.o,h=Args.h,i=Args.i,c=API.%m({owner_id:h,%f:i,offset:o,count:40,extended:1,need_likes:1,v:5.38});c.profiles=c.profiles+API.users.get({user_ids:c.items@.reply_to_user,fields:Args.q});return c;'.schema({
				m: this.api.get.method,
				f: this.api.get.itemField
			}),
			o: offset,
			h: this.object.ownerId,
			i: this.object.itemId,
			q: "first_name_dat,last_name_dat"
		}).setOnCompleteListener(function(result) {
			that.loadCommentsDone.call(that, result);
		}).execute();
	},

	loadCommentsDone: function(result) {
		$.elements.clearChild(this.nodeList);

		nav.replace("wall" + this.object.ownerId + "_" + this.object.itemId + "?offset=" + this.offset);

		this.parseComments(result);

		this.populate();
	},

	request: function(method, params, callbackUI, callbackUser) {
		var context = this;
		new APIRequest(method, params)
			.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
			.setOnCompleteListener(function(result) {
				(callbackUI && callbackUI(result)) && (callbackUser && callbackUser(result, context));
			})
			.execute();
	},

	addCommentRequest: function(text, attachments, stickerId, replyToCommentId, fromGroup) {
		var params = { };

		params[this.api.add.ownerField || "owner_id"] = this.object.ownerId;


		if (stickerId) {
			params.sticker_id = stickerId;
		} else {
			params[this.api.add.itemField] = this.object.itemId;
			params[this.api.add.text] = text;
			params[this.api.add.attachments] = attachments;
		};

		if (fromGroup) {
			params.from_group = 1;
		};

		if (replyToCommentId) {
			params.reply_to_comment = replyToCommentId;
		};

		if (this.object.accessKey) {
			params.access_key = this.object.accessKey;
		};
console.log(params)
//		this.request(this.api.add.method, params, this.addCommentDone, this.api.add.callback);
	},

	addCommentDone: function(result) {

	}

};



function VKComment (context, c, ownerId) {
	this.context = context;
	this.ownerId = ownerId;
	this.commentId = c.id;
	this.userId = c.from_id;
	this.date = c.date;
	this.text = c.text;
	this.replyToUserId = c.reply_to_user;
	this.replyToCommentId = c.reply_to_comment;
	this.attachments = c.attachments || [];
	this.likes = c.likes && c.likes.count;
	this.canLike = c.likes && c.likes.can_like;
	this.isLiked = c.likes && c.likes.user_likes;

	this.hasReply = !!this.replyToCommentId;
	this.canEdit = !!c.can_edit;
	this.canDelete = API.userId == this.userId || (ownerId > 0 && API.userId == ownerId || ownerId < 0 && Local.Users[ownerId] && Local.Users[ownerId].is_admin);
	this.canReport = ownerId > 0 && API.userId != this.userId || ownerId < 0 && Local.Users[ownerId] && !Local.Users[ownerId].is_admin;

	this.isSticker = this.attachments.length && this.attachments[0].type == "sticker";

	this.author = Local.Users[this.userId];
	this.replyToUser = Local.Users[this.replyToUserId];
};

VKComment.prototype = {

	request: function(method, params, callbackUI, callbackUser) {
		var comment = this;
		new APIRequest(method, params).setOnCompleteListener(function(result) {
			callbackUI(result, comment) && callbackUser(result, comment);
		}).execute();
	},

	ui: {

		deleteCommentDone: function(result, comment) {
			comment.nodes.removed = $.e("div", {"class": "vkcomment-deletedString", append: [
				document.createTextNode(Lang.get("comment.infoDeleted")),
				$.e("span", {"class": "a", html: Lang.get("comment.actionRestore"), onclick: function(event) {
					comment.restoreCommentRequest();
				}})
			]});
			comment.node.parentNode.insertBefore(comment.nodes.removed, comment.node);
			comment.node.style.display = "none";
		},

		restoreCommentDone: function(result, comment) {
			$.elements.remove(comment.nodes.removed);
			comment.nodes.removed = null;
			comment.node.style.display = "";
		},

		reportComment: function(c) {
			new ReportWindow("wall.reportComment", c.ownerId, "commentId", c.commentId, null, false).show();
		},

		reportCommentDone: function() {

		}

	},

	editCommentRequest: function(callback, text, attachments) {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;
		params[this.context.api.edit.text] = text;
		params[this.context.api.edit.attachments] = attachment;

		this.request(this.context.api.edit.method, params, this.ui.editCommentDone, this.context.api.edit.callback);
	},

	deleteCommentRequest: function() {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;

		this.request(this.context.api.remove.method, params, this.ui.deleteCommentDone, this.context.api.remove.callback);
	},

	restoreCommentRequest: function() {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;

		this.request(this.context.api.restore.method, params, this.ui.restoreCommentDone, this.context.api.restore.callback);
	},

	reportCommentRequest: function() {
		var params = {};

		params.owner_id = this.context.object.ownerId;
		params.comment_id = this.commentId;

		this.request(this.context.api.report.method, params, this.ui.reportCommentDone, this.context.api.report.callback);
	},

	node: null,
	nodes: { left: null, right: null, removed: null },

	getNode: function() {
		if (this.node) {
			return this.node;
		};

		var e = $.e,
			self = this,

			wrap = e("div", {"class": "vkcomment-item", id: "comment-" + this.context.object.id}),
			left = e("a", {href: "#" + this.author.screen_name, "class": "vkcomment-left", append: e("img", {src: this.author.photo_100})}),
			right = e("div", {"class": "vkcomment-right", append: [
				e("div", {"class": "vkcomment-head", append: [
					e("div", {"class": "tip fr vkcomment-date", html: $.getDate(this.date)}),
					e("a", {"class": "vkcomment-author", href: "#" + this.author.screen_name, html: getName(this.author)}),
					this.hasReply
						? e("span", {"class": "vkcomment-repliedTo tip", append: [
							document.createTextNode(Lang.get("comment.replied")[this.author.sex || 2] + " "),
							e("a", {href: "#" + this.replyToUser.screen_name, html: this.replyToUserId > 0 ? this.replyToUser.first_name_dat + " " + this.replyToUser.last_name_dat : this.replyToUser.name})
						]})
						: null
				]}),
				e("div", {"class": "vkcomment-content", html: this.text.safe().emoji()}),
				e("div", {"class": "vkcomment-attachments", append: Site.Attachment(this.attachment)}),
				getLikeButton("comment", this.context.object.ownerId, this.commentId, null, this.likes, this.isLiked, 0, null, {right: true}),
				e("div", {"class": "vkcomment-footer", append: this.getFooter()})
// TODO: likes button
			]});

		this.nodes.left = left;
		this.nodes.right = right;

		wrap.appendChild(left);
		wrap.appendChild(right);

		return this.node = wrap;
	},

	getFooter: function() {
		var comment = this,
			nodes = [],
			e = $.e,
			h = window.location.hash;

		nodes.push(e("a", {
			href: h,
			html: Lang.get("comment.actionReply"),
			onclick: function(event) {
				event.preventDefault();

				comment.context.writeForm.snapReply(comment.commentId, comment.userId);

				return false;
			}
		}));

		if (this.canEdit) {
			nodes.push(e("a", {
				href: h,
				html: Lang.get("comment.actionEdit"),
				onclick: function(event) {
					event.preventDefault();

niy();
// TODO: make

					return false;
				}
			}));
		};

		if (this.canDelete) {
			nodes.push(e("a", {
				href: h,
				html: Lang.get("comment.actionDelete"),
				onclick: function(event) {
					event.preventDefault();

					VKConfirm(Lang.get("comment.confirmDelete"), function() {
						comment.deleteCommentRequest();
					});

					return false;
				}
			}));
		};

		if (this.canReport) {
			nodes.push(e("a", {
				href: h,
				html: Lang.get("comment.actionReport"),
				onclick: function(event) {
					event.preventDefault();
					comment.ui.reportComment(comment);
					return false;
				}
			}));
		};

		return (function(old, footer) {
			var last = old.length - 1;
			old.forEach(function(item, index) {
				footer.push(item);
				if (index < last)
					footer.push(document.createTextNode(" | "));
			});
			return footer;
		})(nodes, []);
	}

};



/**
 * WriteForm
 * Created 12.01.2016
 * Modified 13.01.2016
 */

function WriteForm (controller, options) {
	options = options || {};

	this.controller = controller;
	this.attachments = new AttachmentBundle();

	this.allowedAttachments = options.allowedAttachments;

	this.init();
};

WriteForm.prototype = {

	nodeForm: null,

	init: function() {
		var self = this,
			e = $.e,

			wrap,
			smileButton,
			attachmentButton,
			sendButton,
			text,
			listAttachments,
			ctx = function(fx) { return function() { fx.call(self); } };


		textWrap			= e("div", {"class": "vkform-comment-text-wrap", append: text = e("textarea", {"class": "vkform-comment-text sizefix"})});
		smileButton			= e("div", {"class": "vkform-comment-button fl vkform-comment-button-smile", onclick: ctx(this.openSmilebox)});
		sendButton			= e("div", {"class": "vkform-comment-button fr vkform-comment-button-send", onclick: ctx(this.onSubmit)});
		attachmentButton	= e("div", {"class": "vkform-comment-button fr vkform-comment-button-attachment", onclick: ctx(this.openAttachmentWindow)});

		wrap = e("form", {
			"class": "vkform-comment-wrapper",
			append: [
				e("div", {"class": "vkform-comment-wrap", append: [
					sendButton,
					attachmentButton,
					smileButton,
					e("div", {"class": "vkform-comment-text-wrap", append: text}),
				]}),
				listAttachments = e("div", {"class": "vkfrom-comment-attachments"}),
				replyString = e("div", {"class": "vkfrom-comment-reply"}),
				settingsString = e("div", {"class": "vkfrom-comment-settings"})
			],
			onsubmit: function(event) {
				event.preventDefault();

				self.onSubmit(this);

				return false;
			}
		});

		this.nodeForm = wrap;
		this.textTextWrap = textWrap;
		this.nodeText = text;
		this.nodeButtonSmile = smileButton;
		this.nodeButtonAttachment = attachmentButton;
		this.nodeButtonSend = sendButton;
		this.nodeAttachmentList = listAttachments;
		this.nodeReply = replyString;
		this.nodeSettings = settingsString;

		this.attachments.registerList(this.nodeAttachmentList);

		return this;
	},

	snapReply: function(replyCommentId, replyUserId) {
		console.log(replyCommentId, replyUserId)
		this.reply = replyCommentId
			? {
				commentId: replyCommentId,
				userId: replyUserId
			  }
			: null;
		this.updateReplyString();
		return this;
	},

	reply: null,

	updateReplyString: function() {
		var w = $.elements.clearChild(this.nodeReply), u, e = $.e, s = this;

		if (!this.reply) {
			return;
		};

		u = Local.Users[this.reply.userId];

		w.appendChild(e("span", {"class": "tip", append: [
			document.createTextNode(Lang.get("comment.writeFormReplyIn")),
			e("a", {href: "#" + u.screen_name, html: u.name || u.first_name_dat + " " + u.last_name_dat}),
			e("div", {"class": "vkform-comment-remove", onclick: function(event) {
				s.snapReply(0, 0);
			}})
		]}));

		if (!this.nodeText.value) {
			this.nodeText.value = "[" + u.screen_name + "|" + (u.name || u.first_name) + "], ";
			var l = this.nodeText.value.length;
			this.nodeText.focus();
			setSelectionRange(this.nodeText, l, l);
		};
	},

	isFromGroup: function() {
		return this.nodeFromGroup && this.nodeFromGroup.checked;
	},

	isOnlyFriends: function() {
		return this.nodeOnlyFriends && this.nodeOnlyFriends.checked;
	},

	isWithSign: function() {
		return this.nodeWithSign && this.nodeWithSign.checked;
	},

	getReplyToId: function() {
		return this.nodeReplyToId && parseInt(this.nodeReplyToId.value);
	},

	onSubmit: function(form) {
		var params = {
			text: this.nodeText.value.trim(),
			attachments: this.attachments.getString(),
			isFromGroup: this.isFromGroup(),
			isOnlyFriends: this.isOnlyFriends(),
			isWithSign: this.isWithSign(),
			replyToId: this.getReplyToId(),
			stickerId: 0,
			replyToCommentId: this.reply && this.reply.commentId || 0
		};
		this.controller.onSend && this.controller.onSend(params);
		this.send(params);
	},

	send: function(params) {
		var p = {}, self = this;
console.log(this.reply);
		this.controller.context.addCommentRequest(params.text, params.attachments, params.stickerId, params.replyToCommentId, params.fromGroup);
	},

	getNode: function() {
		return this.nodeForm;
	}
};