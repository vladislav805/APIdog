function VKVideo(v) {
	this.ownerId = v.owner_id;
	this.videoId = v.id;
	this.albumIds = v.album_ids;
	this.title = v.title;
	this.description = v.description;
	this.date = v.date;
	this.duration = v.duration;
	this.player = v.player;

	this.canAdd = !!v.can_add;
	this.canEdit = !!v.can_edit;

	this.canRepost = !!v.can_repost;
	this.repostCount = v.reposts && v.reposts.count || 0;
	this.isReposted = !!(v.reposts && v.reposts.user_reposted);

	this.canLike = true;
	this.likesCount = v.likes && v.likes.count || 0;
	this.isLiked = !!(v.likes && v.likes.user_likes);

	this.canComment = !!v.can_comment;
	this.commentsCount = v.comments;

	this.isConverted = !!v.converted || !v.converting;
	this.isRepeated = !!v.repeat;

	this.preview130 = v.photo_130;
	this.preview320 = v.photo_320;
	this.preview640 = v.photo_640;
	this.preview800 = v.proto_800;

	this.privacyView = v.privacy_view;
	this.privacyComment = v.privacy_comment;

	this.platform = v.platform; // string

	this.isPrivate = !!v.is_private;
	this.isAutoplay = !v.no_autoplay;

	this.firstFrame130 = v.first_frame_130;
	this.firstFrame320 = v.first_frame_320;
	this.firstFrame800 = v.first_frame_800;

	this.isLive = !!v.live;
	this.liveStatus = v.live_status; // started,failed,finished,waiting,upcoming

	this.files = v.files;
}

VKVideo.prototype = {

	getAttachId: function() {
		return this.getType() + this.ownerId + "_" + this.getId();
	},

	getType: function() {
		return "video";
	},

	getId: function() {
		return this.videoId;
	},

	getNodeItem: function(options) {
		options = options || {};
		var e = $.e,
			self = this,
			node = e("div", {
				"class": "attacher-video-item",
				style: "background: url(" + this.preview320 + ") no-repeat; background-size: cover;",
				append: e("div", {"class": "attacher-video-title", html: this.title.safe()})
			});

		if (options.onClick) {
			$.event.add(node, "click", function(event) {
				options.onClick(self.ownerId, self.videoId, self, event);
			});
		}

		return node;
	}

};


var Video = {
	Storage: {
		Albums:{},
		Videos:{}
	},
	tov5: function (o) {
		return Video.normailzev5(o);
	},
	Resolve: function (url) {
		return Video.explain(url);
	},
	normailzev5: function (video) {
		video.id = video.vid || video.id;
		video.photo_130 = video.image || video.photo_130;
		video.photo_320 = video.image_medium || video.photo_320;
		return video;
	},

	getAttachment: function(video, o) {
		o = o || {};
		var e = $.e, p = {};

		if (video.access_key) {
			p.access_key = video.access_key;
		}

		if (o.from) {
			p.from = getAddress(true);
		}

		return e("a", {
			"class": "attach-video-wrap",
			href: "#video" + video.owner_id + "_" + video.id + (p ? "?" + Object.toQueryString(p) : ""),
			style: "background-image: url(" + getURL(video.photo_800 || video.photo_640 || video.photo_320 || video.photo_130) + ")",
			append: e("div", {"class": "attach-video-title", append: [
				e("div", {html: video.title.safe()}),
				e("span", {html: video.duration.toTime()})
			]})
		});
	},

	explain: function (url) {
		var list = /^videos(-?\d+)?$/ig,
			album = /^videos(-?\d+)_(\d+)$/ig,
			item = /^video(-?\d+)_(\d+)$/ig,
			act = Site.Get("act");
		if (list.test(url)) {
			var owner_id = /^videos(-?\d+)?$/ig.exec(url)[1] || API.userId;
			switch (act) {
				case "albums":  return Video.getAlbums(owner_id); break;
				case "search":  return Video.search(); break;
				case "tags":    return Video.getUserVideos(owner_id); break;
				case "newtags": return Video.getNewTags(); break;
				case "add":     return Video.addPage(+Site.Get("gid")); break;
				case "upload":  return Video.uploadPage(+Site.Get("gid")); break;
				default:        return Video.getVideos(owner_id); break;
			}
		} else if (album.test(url)) {
			var ids = /^videos(-?\d+)_(\d+)$/ig.exec(url),
				owner_id = ids[1] || API.userId,
				album_id = ids[2];
			switch (act) {
				default:        return Video.getVideos(owner_id, album_id); break;
			}
		} else if (item.test(url)) {
			var ids = /^video(-?\d+)_(\d+)$/ig.exec(url),
				owner_id = ids[1],
				video_id = ids[2],
				access_key = Site.Get("access_key");
			switch (act) {
				case "report":  return Video.reportVideo(owner_id, video_id); break;
				case "likes":   return Video.getLikes(owner_id, video_id, access_key); break;
				case "edit":    return Video.editVideo(owner_id, video_id, access_key); break;
				default:        return Video.getVideo(owner_id, video_id, access_key); break;
			}
		}
	},
	getTabs: function (owner_id) {
		var tabs = [
			["videos" + (owner_id != API.userId ? owner_id : ""), Lang.get("videos.tabs_videos")],
			["videos" + (owner_id != API.userId ? owner_id : "") + "?act=albums", Lang.get("videos.tabs_albums")]
		];
		if (owner_id > 0) {
			tabs.push(["videos" + (owner_id != API.userId ? owner_id : "") + "?act=tags", Lang.get("videos.tabs_tags")]);
		};
		if (owner_id == API.userId) {
			tabs.push(["videos?act=search", Lang.get("videos.tabs_search")]);
		};
		return Site.getTabPanel(tabs);
	},
	getVideos: function (owner_id, album_id) {
		var offset = getOffset(), p = {
			owner_id: owner_id,
			width: 130,
			count: 20,
			offset: offset,
			extended: 1,
			v: 5.14
		};
		if (album_id)
			p.album_id = album_id;
		Site.APIv5( "video.get", p, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				count = data.count,
				data = data.items;

			parent.appendChild(Video.getTabs(owner_id));

			parent.appendChild(Site.getPageHeader(
				count + " " + Lang.get("videos", "videos", count),
				album_id && owner_id == API.userId
					? Site.CreateDropDownMenu(
					Lang.get("general.actions"),
					(function () {
						var p = {};
						p[Lang.get("videos.action_edit_album")] = function (event) {
							Video.editAlbumPage(owner_id, album_id);
						};
						p[Lang.get("videos.action_delete_album")] = function (event) {
							Video.deleteAlbum(owner_id, album_id);
						};
						return p;
					})())
					: null
			));


			if (owner_id == API.userId || owner_id < 0 && Local.data[owner_id] && Local.data[owner_id].is_admin)
				list.appendChild(Site.createTopButton({
					link: "videos?act=upload" + (owner_id < 0 ? "&gid=" + (-owner_id) : ""),
					title: Lang.get("videos.action_video_add_my")
				}));

			if (Video.deleted) {
				var deletedVideoId = Video.deleted;
				parent.appendChild($.e("div", {"class": "photo-deleted", append: [
					document.createTextNode(Lang.get("videos.info_video_deleted")),
					$.e("span", {"class": "a", html: Lang.get("videos.action_video_restore"), onclick: function (event) {
						return Video.restoreVideo(deletedVideoId);
					}})
				]}));
				Video.deleted = null;
			};

			if (count)
				data.forEach(function (i) {
					list.appendChild(Video.item(i));
				});
			else
				list.appendChild(Site.getEmptyField(Lang.get("videos.videos_empty")));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(offset, count, 20));
			Site.append(parent);
			Site.setHeader(Lang.get("videos.videos_header"));
		});
	},
	getDurationString: function (duration) {
		var seconds = Math.floor(duration % 60),
			minutes = Math.floor(duration / 60 % 60),
			hours = Math.floor(duration / 3600 % 60),
			n2 = function (n) {return n < 10 ? "0" + n : n;},
			str = [n2(minutes), n2(seconds)];
		if (hours) str.unshift(hours);
		return str.join(":");
	},
	item: function (v) {

		var e = $.e,
			ownerId = v.owner_id,
			videoId = v.id || v.videoId,
			item = e("a", {
				href: "#video" + ownerId + "_" + videoId,
				"class": "videos-item",
				id: "_video" + ownerId + "_" + videoId,
				append: [
					e("div", {"class": "videos-left", append: [
						e("img", {src: getURL(v.photo_130)}),
						v.likes && v.likes.count ? e("div", {"class": "photos-likes photos-tips", append: [
							e("div", {"class": "wall-icons likes-icon" + (v.likes.user_likes ? "-on" : "")}),
							e("span", {html: v.likes.count || ""})
						]}) : null,
						e("div", {"class": "photos-comments photos-tips", append: [
							e("span", {html: Video.getDurationString(v.duration)})
						]})
					]}),
					e("div", {"class": "videos-right", append: [
						e("strong", {html: Site.Escape(v.title)}),
						e("div", {"class": "videos-mark", html: v.views ? formatNumber(v.views) + " " + Lang.get("videos", "views", v.views) : ""}),
						v.comments ? e("div", {"class": "videos-mark", append: [
							e("div", {"class": "wall-comments wall-icons"}),
							e("strong", {html: " " + v.comments}),
						]}) : null,
						v.placer_id ? e("div", {append: [
							document.createTextNode((Lang.get("videos.video_tagged")[Local.data[v.placer_id].sex || 2]) + " " + Local.data[v.placer_id].first_name + " " + Local.data[v.placer_id].last_name + " " + Site.getDate(v.tag_created))
						]}) : null,
						v.files && !v.files.external ? e("div", {"class": "videos-mark", html: (function(f,r){var m=0,i,o="";for(i in f)if(m<r(i))m=r(o=i);return o.replace("_"," ").toUpperCase()})(v.files,function(s){return s.replace(/(flv|mp4)_/img,"")})}) : null
					]})
				]
			});
		Video.videos[ownerId + "_" + videoId] = v;
		var to = Site.Get("to");
		if (to && window.location.hash.indexOf("im") < 0) {
			$.event.add(item, "click", function (event) {
				$.event.cancel(event);

				if (IM.attachs[to])
					IM.attachs[to].push(["video", ownerId, videoId]);
				else
					IM.attachs[to] = [["video", ownerId, videoId]];
				window.location.hash = "#im?to=" + to;

				return false;
			});
		}
		return item;
	},
	getUploadTabs: function (group_id) {
		var base = "videos?act=%a%" + (group_id ? "&gid=" + group_id : "");
		return Site.getTabPanel([
			[base.replace(/%a%/ig, "add"), Lang.get("videos.tabs_add")],
			[base.replace(/%a%/ig, "upload"), Lang.get("videos.tabs_upload")]
		]);
	},
	addPage: function (group_id) {
		var parent = document.createElement("div"),
			form = document.createElement("form"),
			e = $.elements.create,
			tip = function (text) {return e("div", {"class": "tip", html: text});}
		gid = +Site.Get("gid");
		form.action = "#videos?act=upload";
		form.className = "sf-wrap";
		form.appendChild(tip(Lang.get("videos.upload_link")));
		form.appendChild(e("input", {type: "url", name: "url", required: true}));
		form.appendChild(tip(Lang.get("videos.upload_title")));
		form.appendChild(e("input", {type: "text", name:"title"}));
		form.appendChild(tip(Lang.get("videos.upload_description")));
		form.appendChild(e("textarea", {name: "description"}));
		form.appendChild(e("label", {append: [
			e("input", {type: "checkbox", name: "wallpost"}),
			document.createTextNode(Lang.get("videos.upload_is_wallpost"))
		]}));
		/*		if (!gid) {
					form.appendChild(e("label", {append: [
						e("input", {type: "checkbox", name: "is_private"}),
						document.createTextNode(" для отправки в личное сообщение")
					]}));
				}
		*/		form.appendChild(e("label", {append: [
			e("input", {type: "checkbox", name: "repeat"}),
			document.createTextNode(Lang.get("videos.upload_is_repeat"))
		]}));
		form.appendChild(e("input", {type: "submit", value: Lang.get("videos.upload_create")}));
		form.onsubmit = function (event) {
			var params = {
				link: $.trim(this.url.value),
				name: $.trim(this.title.value),
				description: $.trim(this.description.value),
				wallpost: +this.wallpost.checked,
//              is_private: +this.is_private.checked,
				repeat: +this.repeat.checked,
				v: 5.18
			};
			if (gid)
				params.group_id = gid;
			if (!params.link) {
				Site.Alert({text: Lang.get("videos.error_insert_link")});
				return false;
			}
			Site.APIv5("video.save", params, function (data) {
				data = Site.isResponse(data);
				document.getElementsByTagName("head")[0].appendChild($.e("script", {
					src: data.upload_url.replace(/^http:\/\/cs(\d+)\.vk\.com\//igm, "https://pu.vk.com/c$1/")
				}));
				window.location.hash = "#videos" + data.owner_id + "?uploaded=success";
			});
			return false;
		}
		parent.appendChild(Video.getUploadTabs(group_id));
		parent.appendChild(Site.getPageHeader(Lang.get("videos.upload_header_add")));
		parent.appendChild(form);
		Site.append(parent);
		Site.setHeader(Lang.get("videos.upload_header_add"), {link: "videos" + (group_id ? -group_id : "")});
	},
	uploadPage: function (group_id) {
		var parent = document.createElement("div"),
			form = document.createElement("form"),
			e = $.elements.create,
			tip = function (text) {return e("div", {"class": "tip", html: text});}
		gid = +Site.Get("gid"),
			created = false;
		form.className = "sf-wrap";
		form.appendChild(tip(Lang.get("videos.upload_title")));
		form.appendChild(e("input", {type: "text", name:"title"}));
		form.appendChild(tip(Lang.get("videos.upload_description")));
		form.appendChild(e("textarea", {name: "description"}));
		if (!gid) {
			form.appendChild(e("label", {append: [
				e("input", {type: "checkbox", name: "wallpost"}),
				document.createTextNode(Lang.get("videos.upload_is_wallpost"))
			]}));
			/*          form.appendChild(e("label", {append: [
							e("input", {type: "checkbox", name: "is_private"}),
							document.createTextNode(" для отправки в личное сообщение")
						]}));
			*/      }
		form.appendChild(e("label", {append: [
			e("input", {type: "checkbox", name: "repeat"}),
			document.createTextNode(Lang.get("videos.upload_is_repeat"))
		]}));
		form.appendChild(e("input", {type: "submit", value: Lang.get("videos.upload_next")}));
		form.onsubmit = function (event) {
			if (!created) {
				var params = {
					name: $.trim(this.title.value),
					description: $.trim(this.description.value),
					wallpost: +this.wallpost.checked,
					//              is_private: +this.is_private.checked,
					repeat: +this.repeat.checked,
					v: 5.18
				};
				if (gid)
					params.group_id = gid;
				Site.APIv5("video.save", params, function (data) {
					data = Site.isResponse(data);
					created = true;
					$.elements.clearChild(form);
					form.action = data.upload_url;
					form.appendChild(tip(Lang.get("videos.upload_select_file")));
					form.appendChild(Site.createFileChooserButton("video_file", {fullWidth: true}));
					form.appendChild(e("input", {type: "submit", value: Lang.get("videos.upload_upload")}));
					form.appendChild(e("iframe", {src: "about:blank", name: "__video-upload", id: "__video-upload", width: "100%", height: 200, frameborder: 0, onload: function () {
						try {
							if (getFrameDocument(this).location.href == "about:blank")
								return;
							Site.Alert({text: Lang.get("videos.upload_success")});
						} catch (e) {
							console.error(e.toString());
						}
					}}));
					form.enctype = "multipart/form-data";
					form.method = "post";
					form.target = "__video-upload";
				});
				return false;
			}
		}
		parent.appendChild(Video.getUploadTabs(group_id));
		parent.appendChild(Site.getPageHeader(Lang.get("videos.upload_header_add")));
		parent.appendChild(form);
		Site.append(parent);
		Site.setHeader(Lang.get("videos.upload_header_add"), {link: "videos" + (group_id ? -group_id : "")});
	},
	albums: {},
	getAlbums: function (owner_id) {
		Site.APIv5("video.getAlbums", {
			owner_id: owner_id,
			offset: getOffset(),
			count: 40,
			extended: 1,
			v: 5.14
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				r = data,
				count = data.count || 0,
				data = data.items,
				p = Site.Get("move") ? {move: Site.Get("move")} : null;
			parent.appendChild(Video.getTabs(owner_id));
			parent.appendChild(Site.getPageHeader(
				"<span id=vac>" + count + "</span> " + Lang.get("videos", "albums", count),
				owner_id == API.userId ? $.e("span", {href: "#videos" + owner_id + "?act=create", html: Lang.get("videos.albums_new"), "class": "fr a", onclick: function (event) {
					Video.showCreateAlbum(list, owner_id, this);
				}}) : null
			));
			if (r.error && r.error_code == 204) {
				list.appendChild(Site.getEmptyField(Lang.get("videos.error_access_denied")));
			} else
			if (count)
				for (var i = 0, l = data.length; i < l; ++i) {
					var v = data[i];
					Video.albums[v.owner_id + "_" + v.id] = v;
					list.appendChild(Video.itemAlbum(v, p));
				}
			else
				list.appendChild(Site.getEmptyField(Lang.get("videos.albums_empty")));

			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(getOffset(), count, 40));
			Site.append(parent);
			Site.setHeader(Lang.get("videos.albums_header"), {link: "videos" + (owner_id != API.userId ? owner_id : "")});
		});
	},
	showCreateAlbum: function (list, owner_id, button) {
		button.style.display = "none";
		var e = $.e,
			onSubmit = function (event) {
				var title = $.trim(this.title.value);

				if (!title) {
					Site.Alert({text: Lang.get("videos.error_album_create")});
					return false;
				};
				Site.APIv5("video.addAlbum", {group_id: owner_id < 0 ? -owner_id : 0, title: title, v: 5.14}, function (data) {
					if (data.error) {
						var t;
						switch (data.error.error_code) {
							case 204: t = Lang.get("videos.error_access_denied"); break;
							case 302: t = Lang.get("videos.error_album_max"); break;
							default: t = data.error.error_msg; break;
						}
						return Site.Alert({text: t});
					}

					var creator = $.element("_videos_creator");
					creator.parentNode.insertBefore(Video.itemAlbum({
						id: data.response.album_id,
						owner_id: owner_id,
						title: title,
						count: 0,
						updated_time: Date.now() / 1000
					}), creator)
					$.elements.remove(creator);
					var count = $.element("vac");
					count.innerHTML = parseInt(count.innerHTML) + 1;
					button.style.display = "block";
				});
				return false;
			};
		if (list.children.length === 1 && $.elements.hasClass(list.firstChild, "msg-empty"))
			$.elements.remove(list.firstChild);
		list.insertBefore(e("div", {
			"class": "videos-item videos-item-album",
			id: "_videos_creator",
			append: [
				e("div", {"class": "videos-left", append: [
					e("img", {src: Video.DEFAULT_VIDEO_ALBUM_PHOTO_160})
				]}),
				e("div", {"class": "videos-right", append: [
					Site.createInlineForm({
						name: "title",
						title: Lang.get("videos.upload_create"),
						placeholder: Lang.get("videos.error_album_empty_title"),
						type: "text",
						onsubmit: onSubmit
					})
				]})
			]
		}), list.firstChild);
	},
	editAlbumPage: function (owner_id, album_id) {
		var parent = document.createElement("div"),
			album = Video.albums[owner_id + "_" + album_id],
			e = $.elements.create;

		if (!album) {
			window.location.hash = "#videos" + owner_id + "?act=albums";
			return;
		}

		parent.appendChild(Video.getTabs(owner_id));
		parent.appendChild(Site.getPageHeader(Lang.get("videos.albums_edit_header")));
		parent.appendChild(e("div", {
			"class": "videos-item videos-item-album",
			id: "_videos_editor_" + owner_id + "_" + album_id,
			append: [
				e("div", {"class": "videos-left", append: [
					e("img", {src: getURL(album.photo_160 || Video.DEFAULT_VIDEO_ALBUM_PHOTO_160)}),
					e("div", {"class": "photos-comments photos-tips", append: [
						e("span", {html: album.count})
					]})
				]}),
				e("div", {"class": "videos-right", append: [
					Site.createInlineForm({
						name: "title",
						value: album.title,
						title: Lang.get("general.save"),
						placeholder: Lang.get("videos.albums_edit_title"),
						type: "text",
						onsubmit: function (event) {
							var title = $.trim(this.title.value);
							if (!title) {
								Site.Alert({text: Lang.get("videos.error_album_empty_title")});
								return false;
							}
							Video.editAlbum(owner_id, album_id, title);
							return false;
						}
					})
				]})
			]
		}));
		Site.append(parent);
	},
	editAlbum: function (ownerId, albumId, title) {
		Site.APIv5("video.editAlbum", {
			owner_id: ownerId,
			album_id: albumId,
			title: title,
			v: 5.14
		}, function (data) {
			if (data.response) {
				if (Video.albums[ownerId + "_" + albumId])
					Video.albums[ownerId + "_" + albumId].title = title;
				Site.route(window.location.hash.replace("#", ""));
			}
		})
	},
	deleteAlbum: function (ownerId, albumId) {
		VKConfirm(Lang.get("videos.confirm_album_delete"), function () {
			Site.APIv5("video.deleteAlbum", {owner_id: ownerId, album_id: albumId, v: 5.14}, function (data) {
				if (!data.response)
					return Site.Alert({text: "error #" + data.error.error_code + " (" + data.error.error_msg + ")"});
				Site.Alert({text: Lang.get("videos.info_album_deleted")});
				window.location.hash = "#videos" + (ownerId != API.userId ? ownerId : "") + "?act=albums";
			});
		});
	},
	DEFAULT_VIDEO_ALBUM_PHOTO_160: "\/\/vk.com\/images\/question_video_album.png",
	itemAlbum: function (v, o) {
		var e = $.e, ownerId = v.owner_id, albumId = v.id || v.album_id;
		o = o || {};
		return e(!o.move ? "a" : "div", {
			href: "#videos" + ownerId + "_" + albumId,
			"class": "videos-item videos-item-album a",
			id: "_videos" + ownerId + "_" + albumId,
			append: [
				e("div", {"class": "videos-left", append: [
					e("img", {src: getURL(v.photo_160 || Video.DEFAULT_VIDEO_ALBUM_PHOTO_160)}),
					e("div", {"class": "photos-comments photos-tips", append: [
						e("span", {html: v.count})
					]})
				]}),
				e("div", {"class": "videos-right", append: [
					e("strong", {html: Site.Escape(v.title)}),
					e("div", {"class": "tip", html: Lang.get("photos", "album_updated") + " " + $.getDate(v.updated_time)})
				]})
			],
			onclick: o.move ? function (event) {
				Site.API("video.moveToAlbum", {
					album_id: albumId,
					video_ids: o.move,
					group_id: ownerId < 0 ? -ownerId : ""
				}, function (data) {
					if (data.response) {
						Site.Alert({text: Lang.get("videos.info_album_moved").replace(/%s/igm, Site.Escape(v.title))});
						window.location.hash = "#video" + ownerId + "_" + o.move;
					};
				});
			} : null
		});
	},
	getNewTags: function () {
		Site.Loader();
		var offset = getOffset();
		Site.API("execute", {
			code: 'var v=API.video.getNewTags({count:30,offset:%o%,v:5.18});return {videos:v,users:API.users.get({user_ids:v.items@.placer_id,field:"online,sex"})};'
				.replace(/%o%/, offset)
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				users = Local.add(data.users),
				data = data.videos,
				count = data.count,
				data = data.items;
			parent.appendChild(Video.getTabs(API.userId));
			parent.appendChild(Site.getPageHeader(
				count
					? Lang.get("videos.videos_tags_header")
					      .replace(/%d/img, count)
					      .replace(/%s/img, Lang.get("videos", "videos__tags", count))
					: Lang.get("videos.videos_tags") ));
			if (count)
				for (var i = 0, l = data.length; i < l; ++i)
					parent.appendChild(Video.item(data[i]));
			else
				parent.appendChild(Site.getEmptyField());
			parent.appendChild(Site.getSmartPagebar(offset, count, 30));
			Site.append(parent);
			Site.setHeader(Lang.get("videos.videos_tags"), {link: "videos"});
		})
	},
	getUserVideos: function (owner_id) {
		var offset = getOffset();
		Site.API("execute", {
			code: 'var v=API.video.getUserVideos({user_id:%u%,count:30,offset:%o%,v:5.18});return {videos:v,newTags:API.video.getNewTags().count};'
				.replace(/%u%/ig, owner_id)
				.replace(/%o%/, offset)
		}, function (data) {
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				data = Site.isResponse(data),
				newTags = data.newTags,
				data = data.videos,
				count = data.count,
				data = data.items;
			parent.appendChild(Video.getTabs(owner_id));
			parent.appendChild(Site.getPageHeader(count + " " + Lang.get("videos", "videos", count)));
			if (newTags)
				parent.appendChild(Site.createTopButton({tag: "a", link: "videos?act=newtags", title: Lang.get("videos.videos_tags") + " (" + newTags + ")"}))
			if (count)
				for (var i = 0, l = data.length; i < l; ++i)
					list.appendChild(Video.item(data[i]));
			else
				list.appendChild(Site.getEmptyField(Lang.get("videos.tags_user_no")));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(offset, count, 30));
			Site.append(parent);
			Site.setHeader(Lang.get("videos.tags_header"));
		})
	},
	search: function () {
		var params = {
			q: decodeURIComponent($.trim(Site.Get("q") || "")),
			sort: Site.Get("sort"),
			hd: Site.Get("hd"),
			adult: Site.Get("adult"),
			filters: (function (f, s) {
				if (f("mp4") == 1) s.push("mp4");
				if (f("youtube") == 1) s.push("youtube");
				s.push(f("length"));
				return s.join(",");
			})(Site.Get, []),
			count: 30,
			offset: getOffset(),
			v: 5.18
		};
		if (!$.element("__video-search")) {
			Video.searchPage();
		}

		if (params.q) {
			Site.APIv5("video.search", params, function (data) {
				if (data.error && data.error.error_code == 100) {
					return Site.Alert({text: Lang.get("videos.error_search_empty_query")});
				};
				return Video.getSearchResults(Site.isResponse(data));
			});
		}
	},
	searchPage: function () {
		var parent = document.createElement("div"),
			l = Lang.get,
			list = document.createElement("div"),
			form = Site.createInlineForm({
				type: "search",
				name: "q",
				value: decodeURIComponent(Site.Get("q") || ""),
				placeholder: l("videos.search_placeholder"),
				title: l("videos.search_search"),
				onsubmit: Video.searchSubmit
			}), e = $.elements.create;
		form.appendChild(e("div", {"class": "sf-wrap", append: [
			e("label", {append: [e("input", {type: "checkbox", name: "youtube"}), e("span", {html: " YouTube"})]}),
			e("label", {append: [e("input", {type: "checkbox", name: "mp4"}), e("span", {html: " MP4"})]}),
			e("label", {append: [e("input", {type: "checkbox", name: "hd"}), e("span", {html: l("videos.search_hd")})]}),
			e("label", {append: [e("input", {type: "checkbox", name: "adult"}), e("span", {html: l("videos.search_adult")})]}),
			e("select", {name: "length", append: [
				e("option", {value: "0", html: l("videos.search_length_any")}),
				e("option", {value: "short", html: l("videos.search_length_short")}),
				e("option", {value: "long", html: l("videos.search_length_long")})
			]})
		]}));

		list.id = "__video-search";

		parent.appendChild(Video.getTabs(API.userId));
		parent.appendChild(Site.getPageHeader(l("videos.search_search"), e("span", {id: "__video-search-count", html: "", "class": "fr"})));
		parent.appendChild(form);
		parent.appendChild(list);

		Site.append(parent);
		Site.setHeader(Lang.get("videos.search_videos"), {link: "videos"});
	},
	searchSubmit: function (event) {
		var q = $.trim(this.q.value),
			yt = +this.youtube.checked,
			mp4 = +this.mp4.checked,
			hd = +this.hd.checked,
			adult = +this.adult.checked,
			length = this.length.options[this.length.selectedIndex].value,
			params = {q: q, youtube: yt, mp4: mp4, hd: hd, length: length, adult: adult};
		window.location.hash = "#videos?act=search&" + (function (a,b,c,e,f,i){for(i in a)b[c](i+"="+encodeURIComponent(a[i]));return b[e](f);})(params,[],"push","join","&");
		return false;
	},
	getSearchResults: function (data) {
		var list = $.element("__video-search"),
			parent = document.createElement("div"),
			count = data.count,
			data = data.items;
		$.elements.clearChild(list);

		for (var i = 0, l = data.length; i < l; ++i)
			parent.appendChild(Video.item(data[i]));

		$.element("__video-search-count").innerHTML = Lang.get("videos", "search_result_found", count) + " " + formatNumber(count) + " " + Lang.get("videos", "videos", count);
		parent.appendChild(Site.getSmartPagebar(getOffset(), count, 30));
		list.appendChild(parent);
	},

	/* video page */
	videos: {},
	getVideo: function (owner_id, video_id, access_key) {
		Site.API("execute", {
			code: ('var v=API.video.get({videos:"%o%_%v%%a%",extended:1,v:5.18}),p=v.profiles,g=v.groups;v=v.items[0];if(v==null){return{no:!0,v:v};};v.inAlbums=API.video.getAlbumsByVideo({owner_id:%o%,video_id:%v%});return{video:v,u:p+g,increment:API.video.incViewCounter({owner_id:%o%,video_id:%v%}),tags:API.video.getTags({owner_id:%o%,video_id:%v%,v:5.21})};')
				.replace(/%o%/ig, owner_id)
				.replace(/%g%/ig, -owner_id)
				.replace(/%v%/ig, video_id)
				.replace(/%a%/ig, access_key ? "_" + access_key : "")
		}, function (data) {
			console.log(data);
			data = Site.isResponse(data);
			Local.add(data.u);

			var video       = data.video;

			if (!video) {
				Site.append(Site.getEmptyField("Видеозапись не найдена. Возможно, она была удалена или у Вас нет доступа."));
				return;
			};

			if (Audios.isPlaying())
				Audios.player.pause();

			var title       = video.title,
				description = video.description,
				duration    = video.duration,
				date        = video.date,
				views       = video.views,
				preview     = getURL(video.photo_640 || video.photo_320),
				likes       = video.likes,
				isRepeat    = video.repeat,
				tags        = data.tags,
				parent      = document.createElement("div"),
				header      = Video.getHeader(video, {access_key: access_key, tags: tags}),
				player      = Video.getAPIdogPlayer({video: video}),
				footer      = Video.getFooter(video, tags),
				comments    = Video.getComments(owner_id, video_id, access_key, video.comments, owner_id == API.userId || video.can_comment || !!video.privacy_comment),
				from		= Site.Get("from") ? decodeURIComponent(Site.Get("from")) : false;

			Video.videos[owner_id + "_" + video_id] = video;

			parent.appendChild(header);
			parent.appendChild(player);
			parent.appendChild(footer);
			parent.appendChild(comments);

			Site.append(parent);
			Site.setHeader(Lang.get("videos.video_header"), {link: from ? from : "videos" + (owner_id == API.userId ? "" : owner_id)});
		})
	},
	hasMineInVideo: function (tags) {
		for (var i = 0, l = tags.length; i < l; ++i)
			if (tags[i].user_id == API.userId)
				return tags[i].tag_id;
		return false;
	},
	getHeader: function (video, options) {
		var actions     = {},
			options     = options || {},
			ownerId     = video.owner_id,
			videoId     = video.id || video.video_id,
			tagId       = Video.hasMineInVideo(options.tags || []),
			accessKey   = options.access_key,
			l           = Lang.get,
			hasMine		= ~video.inAlbums.indexOf(-2) || API.userId == video.owner_id;
		if (!accessKey && API.userId == video.owner_id)
			if (!tagId)
				actions[l("videos.action_video_tag_me")]    = function (event) {Video.addMyTag(ownerId, videoId, this)};
			else
				actions[l("videos.action_video_untag_me")]  = function (event) {Video.removeTag(ownerId, videoId, tagId)};
		if (!hasMine) {
			actions[l("videos.action_video_add")]           = function (event) {Video.addVideo(ownerId, videoId, accessKey)};
		};
		if (!video.can_edit) {
			actions[l("videos.action_video_report")]        = function (event) {Video.showReportVideo(ownerId, videoId, accessKey)};
		};
		if (video.can_repost) {
			actions[l("videos.action_video_share")]         = function (event) {Video.share(ownerId, videoId, accessKey, video.can_repost)};
		};
		actions[l("videos.action_video_liked")]             = function (event) {Video.showLikesList(ownerId, videoId, accessKey)};
		if (video.can_edit) {
			actions[l("videos.action_video_edit")]          = function (event) {Video.editVideo(ownerId, videoId, accessKey)};
		};
		if (hasMine) {
			actions[l("videos.action_video_delete")]        = function (event) {Video.deleteVideo(ownerId, videoId, accessKey)};
		};
		return Site.getPageHeader(Site.Escape(video.title), Site.CreateDropDownMenu(Lang.get("general.actions"), actions));
	},
	share: function (ownerId, videoId, accessKey, canRepost) {
		share("video", ownerId, videoId, accessKey, actionAfterShare, {
			wall: canRepost,
			user: canRepost,
			group: canRepost
		});
	},
	getFooter: function (video, tags, o) {
		var parent = document.createElement("div"),
			description = video.description,
			date = video.date,
			views = video.views,
			owner_id = video.owner_id,
			owner = Local.data[owner_id] || {},
			e = $.elements.create;
		o = o || {};
		parent.className = "video-footer";
		/*      if (video.files && !video.files.external)
				{
					parent.appendChild(e("div", {style: "padding: 2px", append: Site.CreateDropDownMenu("Скачать", (function (v, o) {
						for (var i in v)
							o[i.toUpperCase().replace("_", " ")] = (function (u) { return function () { window.open(u) }})(v[i]);
						return o;
					})(video.files, {}), {toTop: true})}) );
				};
		*/      if (description) {
			parent.appendChild(e("div", {"class": "tip", html: Lang.get("videos.video_description")}));
			parent.appendChild(e("div", {html: Site.toHTML(Site.Escape(description))}));
		};
		parent.appendChild(e("div", {append: [e("span", {"class": "tip", html: Lang.get("videos.video_uploaded")}), document.createTextNode($.getDate(date))]}));
		parent.appendChild(e("div", {"class": "wall-likes likes", id:"like_video_" + owner_id + "_" + video.id, append: getLikeButton("video", owner_id, video.id, o.access_key, video.likes.count, video.likes.user_likes, o.access_key)}));
		parent.appendChild(e("div", {append: [
			e("span", {"class": "tip", html: Lang.get("videos.video_author")}),
			e("a", {href: "#" + owner.screen_name, html: (owner.name || owner.first_name + " " + owner.last_name + Site.isOnline(owner))})
		]}));
		parent.appendChild(e("div", {append: [
			e("span", {"class": "tip", html: Lang.get("videos.video_views")}),
			document.createTextNode(formatNumber(views))
		]}));
		if (tags && tags.length) {
			var taglist = document.createElement("div"),
				items = [],
				comma = function () {
					return document.createTextNode(", ");
				},
				item = function (item) {
					return e("a", {href: "#id" + item.user_id, html: Site.Escape(item.tagged_name)})
				};
			taglist.appendChild(e("span", {"class": "tip", html: Lang.get("videos.video_on_video")}));
			for (var i = 0, l = tags.length; i < l; ++i) {
				taglist.appendChild(item(tags[i]));
				if (i != l - 1)
					taglist.appendChild(comma());
			}
			parent.insertBefore(taglist, parent.firstChild);
		};
		return parent;
	},
	showLikesList: function (owner_id, video_id, access_key) {
		return window.location.hash = "#video" + owner_id + "_" + video_id + "?act=likes" + (access_key ? "&access_key=" + access_key : "");
	},
	onChangeBodySizeEvent: function () {
		var width = $.getPosition($.element("content")).width,
			player = $.element("__video_player_wrap");

		player.style.width = width + "px";
		player.style.height = (width * 0.70) + "px";
	},
	loadedVideoJS: false,
	getAPIdogPlayer: function (input) {
		window.addEventListener("resize", Video.onChangeBodySizeEvent);
		window._l = window.location.hash;
		var wrap            = document.createElement("div"),
			player          = input.player || document.createElement("video"),
			video           = input.video,
			e               = $.e,
			ac              = $.elements.addClass,
			rc              = $.elements.removeClass,
			listenEvent     = player.addEventListener,
			eventManager    = setInterval(function () {
				if (window._l == window.location.hash)
					return
				window.removeEventListener("resize", Video.onChangeBodySizeEvent);
				clearInterval(eventManager);
			}, 1000);

		if (!video.files || video.files && (video.files.external || video.files.flv_320 || video.files.flv_240)) {
			var u = video.player.replace(/^http:/ig, "https:").replace(/(&|\?)__ref=[^&$]+&?/ig, "$1");
			wrap.appendChild(e("iframe", {
				id: "__video_player_wrap",
				frameborder: 0,
				allowfullscreen: true,
				src: video.files && video.files.external ? (/vk.com/ig.test(u) ? video.files.external.replace(/^http:/ig, "https:") : u) : "data:text/html," + encodeURI("<html><meta charset='utf-8'><body style='margin: 0'><iframe src='" + u + "' frameborder=0 width=100% height=100%></iframe></body></html>"),
				style:"width:100%;height:100%;"
			}));
			wrap.appendChild(e("a", {"class": "button-block sizefix", href: ~u.indexOf("video_ext") ? "http://api.vlad805.ru/apidog.openPlayer?" + u.split("?")[1] : u, target: "_blank", html: "Открыть плеер в отдельном окне"}));
			setTimeout(Video.onChangeBodySizeEvent, 200);
			return wrap;
		}

		//player.poster = video.photo_640 || video.photo_320;
		player.src = video.files.mp4_360 || video.files.mp4_240;
		player.id = "__video_player_wrap";

		wrap.appendChild(player);
		wrap.className = "vp-wrap";

		var line,
			lineLoaded,
			linePlayed,
			timePlayed,
			timeDuration,
			isFirstRun = true,
			stateButton,
			selectSpeed,
			selectQuality,
			play = function () {
				player.play();
				if (!isFirstRun)
					return;
				isFirstRun = false;
				Site.API("video.playStarted", {owner_id: video.owner_id, video_id: video.id}, "blank");
			},
			pause = function () {
				player.pause();
			},
			moveTo = function (sec) {
				player.currentTime = sec;
			},
			triggerState = function (notNeed) {
				if (player.paused) {
					play();
					ac(this.firstChild, "vp-control-pause");
					rc(this.firstChild, "vp-control-play");
				} else {
					pause();
					rc(this.firstChild, "vp-control-pause");
					ac(this.firstChild, "vp-control-play");
				}
			},
			triggerMute = function (event) {
				player.muted = !player.muted;
				if (player.muted) {
					ac(this.firstChild, "vp-control-unmute");
					rc(this.firstChild, "vp-control-mute");
				} else {
					rc(this.firstChild, "vp-control-unmute");
					ac(this.firstChild, "vp-control-mute");
				}
			},
			isFullScreen = function () {
				if (document.fullScreenElement || document.msFullScreenElement || document.mozFullScreenElement || document.webkitFullscreenElement)
					return false;
				else
					return true;
			},
			triggerFullScreen = function (event) {
				var elem = player.parentNode;
				var is = isFullScreen();
				if (is) {
					if (elem.requestFullscreen)
						elem.requestFullscreen();
					else if (elem.msRequestFullscreen)
						elem.msRequestFullscreen();
					else if (elem.mozRequestFullScreen)
						elem.mozRequestFullScreen();
					else if (elem.webkitRequestFullscreen)
						elem.webkitRequestFullscreen();
					else
						console.error("Video.js: triggerFullScreen > fullscreen is not supported")
				} else {
					if (document.exitFullscreen)
						document.exitFullscreen();
					else if (document.msExitFullscreen)
						document.msExitFullscreen();
					else if (document.mozCancelFullScreen)
						document.mozCancelFullScreen();
					else if (document.webkitExitFullscreen)
						document.webkitExitFullscreen();
					else
						console.error("Video.js: triggerFullScreen > fullscreen is not supported");
				}
			},
			fullScreenEventListener = function (event) {
			},
			setSelectedQuality = function (event) {
				var elements = document.querySelectorAll(".vp-sq-item-active");
				for (var i = 0, l = elements.length; i < l; ++i)
					$.elements.removeClass(elements[i], "vp-sq-item-active");
				$.elements.addClass(this, "vp-sq-item-active");
				$.elements.addClass(this.parentNode, "hidden");
				this.parentNode.previousSibling.innerHTML = this.innerHTML;
			},
			getAvailableSizes = function (files, return_optimal) {
				var sizes = [], p;
				for (var format in files)
					if (/^mp4_/ig.test(format))
						sizes.push([format.replace(/^mp4_/ig, ""), files[format]]);
				if (return_optimal)
					return (function (a,b,c,d,e,f,g){for(;b<c;++b)if(!g&&a[b][f]==d)g=d;return!g?d-e:g||d})(sizes,0,sizes.length,360,120,0,null);
				for (var i = 0, l = sizes.length; i < l; ++i) {
					sizes[i] = $.elements.create("div", {
						"data-url": sizes[i][1],
						html: sizes[i][0],
						"class": "vp-sq-item" + (sizes[i][1] == player.src ? " vp-sq-item-active" : ""),
						onclick: setSelectedQuality
					});
				}
				return sizes;
			},
			setQuality = function (node) {
				var currentTime = player.currentTime,
					file = (function (c, h, n) {
						for (var i in c)
							if (h(c[i], n))
								return c[i].getAttribute("data-url");
					})(node.children, $.elements.hasClass, "vp-sq-item-active");
				player.src = file;

				var fxcb = function (event) {
					player.currentTime = currentTime;
					player.play();
					player.removeEventListener("loadedmetadata", fxcb, false);
				};
				player.addEventListener("loadedmetadata", fxcb, false);
			},
			getSpeedSelect = function () {
				var values = [.25, .5, .75, 1, 1.25, 1.5, 1.75, 2];
				for (var i = 0, l = values.length; i < l; ++i) {
					values[i] = $.e("div", {
						"data-speed": values[i],
						html: values[i],
						"class": "vp-ss-item" + (values[i] == player.playbackRate ? " vp-ss-item-active" : ""),
						onclick: setSelectedSpeed
					});
				}
				return values;
			},
			setSpeed = function (node) {
				var n = (function (c, h, n) {
					for (var i in c)
						if (h(c[i], n))
							return parseFloat(c[i].getAttribute("data-speed"));
					return 1;
				})(node.children, $.elements.hasClass, "vp-ss-item-active");
				player.playbackRate = n;
			},
			setSelectedSpeed = function (event) {
				var elements = document.querySelectorAll(".vp-ss-item-active");
				for (var i = 0, l = elements.length; i < l; ++i)
					$.elements.removeClass(elements[i], "vp-ss-item-active");
				$.elements.addClass(this, "vp-ss-item-active");
				$.elements.addClass(this.parentNode, "hidden");
				this.parentNode.previousSibling.innerHTML = this.innerHTML;
			},
			lastMove,
			hideControls = function (event) {
				$.elements.addClass(wrap.lastChild, "vp-foot-invisible");
			};

		wrap.appendChild(e("div", {"class": "vp-foot", append: [
			e("div", {style: "margin: 10px 0 0 0", append: [
				line = e("div", {"class": "vp-line", append: [
					e("div", {"class": "vp-line-all"}),
					lineLoaded = e("div", {id: "vp-line-loadeds"}),
					linePlayed = e("div", {"class": "vp-line-played"})
				]})
			]}),
			e("div", {"class": "vp-controls", append: [
				e("div", {"class": "fr vp-icon-wrap", onclick: triggerFullScreen, append: [
					e("div", {"class": "vp-icons vp-control-maximize"})
				]}),
				e("div", {"class": "fr vp-quality", append: [
					e("div", {"class": "vp-sq-current", html: getAvailableSizes(video.files, true), onclick: function (event) {
						$.elements.triggerClass(this.nextSibling, "hidden");
						$.event.cancel(event);
					}}),
					selectSpeed = e("div", {"class": "vp-sq-list hidden", append: getAvailableSizes(video.files), onclick: function () {
						setQuality(this);
					}})
				]}),
				player.playbackRate ? e("div", {"class": "fr vp-quality vp-speed", append: [
					e("div", {"class": "vp-ss-current", html: "1", onclick: function (event) {
						$.elements.triggerClass(this.nextSibling, "hidden");
						$.event.cancel(event);
					}}),
					selectQuality = e("div", {"class": "vp-ss-list hidden", append: getSpeedSelect(), onclick: function () {
						setSpeed(this);
					}})
				]}) : null,
				e("div", {"class": "fl vp-icon-wrap", onclick: triggerState, append: [
					stateButton = e("div", {"class": "vp-icons vp-control-play"})
				]}),
				e("div", {"class": "fl vp-icon-wrap vp-mute", onclick: triggerMute, append: [
					e("div", {"class": "vp-icons vp-control-mute"})
				]}),
				e("div", {"class": "fl vp-control-times", append: [
					timePlayed = e("span", {html: "0:00"}),
					document.createTextNode("/"),
					timeDuration = e("span", {html: "0:00"})
				]})
			]})
		]}));

		player.ontimeupdate = function (event) {
			var currentTime = this.currentTime || 0,
				duration = this.duration || 0,
				persent = (100 * currentTime) / duration,
				played = Video.getDurationString(currentTime);
			linePlayed.style.width = persent + "%";
			timePlayed.innerHTML = played;
		};
		player.onloadedmetadata = function (event) {
			timeDuration.innerHTML = Video.getDurationString(this.duration);
		};
		player.onplay = function (event) {
			ac(stateButton, "vp-control-pause");
			rc(stateButton, "vp-control-play");
		};
		player.onpause = function (event) {
			rc(stateButton, "vp-control-pause");
			ac(stateButton, "vp-control-play");
		};
		player.onprogress = function (event) {
			var buffers = this.buffered,
				progress = lineLoaded,
				progresses = progress.children,
				duration = this.duration;
			if (buffers.length < progresses.length) {
				$.elements.clearChild(progress);
			}
			for (var i = 0, l = buffers.length; i < l; ++i) {
				var loaded = [buffers.start(i), buffers.end(i)],
					left = (100 * loaded[0]) / duration,
					width = (100 * loaded[1]) / duration;
				if (progresses[i]) {
					progresses[i].style.left = left + "%";
					progresses[i].style.width = (width - left) + "%";
				} else {
					var item = $.elements.create("div", {"class": "vp-line-loaded"});
					item.style.left = left + "%";
					item.style.width = (width - left) + "%";
					progress.appendChild(item);
				}
			}
		};
		player.onended = function (event) {
			if (video.repeat) {
				player.currentTime = 0;
				player.play();
			}
		};
		player.onclick = triggerState;
		wrap.onclick = function (event) {
			$.elements.addClass(selectSpeed, "hidden");
			$.elements.addClass(selectQuality, "hidden");
		};
		wrap.onmousemove = function (event) {
			lastMove = parseInt(+new Date() / 1000);
			var cm = lastMove;
			$.elements.removeClass(wrap.lastChild, "vp-foot-invisible");

			setTimeout(function () {
				if (cm == lastMove && !player.paused)
					hideControls();
			}, 2000);
		};
		var getLeftWhileLine = function (node) {
			var left = 0, i = 0;
			do {
				left += node.offsetLeft;
				node = node.parentNode;
				++i;
			} while (node != line && i < 20);
			return left;
		};
// in Firefox event doesn't works...

		/*      player.parentNode.onfullscreenchange = fullScreenEventListener;
				player.parentNode.onmsfullscreenchange = fullScreenEventListener;
				player.parentNode.onmozfullscreenchange = fullScreenEventListener;
				player.parentNode.onwebkitfullscreenchange = fullScreenEventListener;
		*/      line.onclick = function (event) {
			var pos = $.getPosition(this),
				left = event.target == this ? (event.offsetX || event.layerX) : getLeftWhileLine(event.target) + (event.offsetX || event.layerX),
				time = (((left * 100) / pos.width) / 100) * player.duration;

			moveTo(time);

			$.event.cancel(event);
		};
		setTimeout(Video.onChangeBodySizeEvent, 200);
		return wrap;
	},



	deleteVideo: function (ownerId, videoId, accessKey) {
		VKConfirm(Lang.get("videos.confirm_video_delete"), function () {
			var method, params;
			if (ownerId == API.userId) {
				method = "video.delete";
				params = {
					owner_id: ownerId,
					video_id: videoId,
					access_key: accessKey || ""
				};
			} else {
				method = "video.removeFromAlbum";
				params = {
					target_id: API.userId,
					album_id: -2,
					owner_id: ownerId,
					video_id: videoId
				};
			};
			Site.API(method, params, function (data) {
				if (data.response) {
					Site.Alert({text: Lang.get("videos.info_video_deleted")});
					Video.deleted = {owner_id: ownerId, video_id: videoId};
					if (ownerId == API.userId)
						window.location.hash = "#videos" + ownerId;
				}
			});
		});
	},
	addVideo: function (owner_id, video_id, access_key) {
		Site.API("video.add", {owner_id: owner_id, video_id: video_id, access_key: access_key || ""}, function (data) {
			if (data.response) {
				Site.Alert({text: Lang.get("videos.info_video_added")});
			}
		});
	},
	editVideo: function (owner_id, video_id, access_key) {
		var page = document.createElement("div"),
			parent = document.createElement("form"),
			e = $.elements.create,
			l = Lang.get,
			tip = function (text) {return e("div", {"class": "tip", html: text})},
			onSubmit = function (event) {
				var title = $.trim(this.title.value),
					description = $.trim(this.description.value),
					privacy_view = +this.privacy_view.options[this.privacy_view.selectedIndex].value,
					privacy_comment = +this.privacy_comment.options[this.privacy_comment.selectedIndex].value,
					repeat = +this.repeat.checked,
					params = {name: title, desc: description, owner_id: owner_id, video_id: video_id, access_key: access_key || "", repeat: repeat};

				if (!title) {
					return Site.Alert({text: Lang.get("videos.error_video_edit_title")});
				};

				if (privacy_view >= 0) params.privacy_view = privacy_view;
				if (privacy_comment >= 0) params.privacy_comment = privacy_comment;

				Site.API("video.edit", params, function (data) {
					if (data) {
						Site.Alert({text: Lang.get("general.saved")});
						Site.route(window.location.hash.replace("#", ""));
					}
				})

				return false;
			},
			video = Video.videos[owner_id + "_" + video_id],
			getSelectPrivacy = function (name, selected) {
				var select = document.createElement("select");
				select.name = name;
				var types = Lang.get("videos.video_edit_privacy"), t;
				for (var i = 0, l = types.length; i < l; ++i) {
					t = {value: i, html: types[i]};
					if (selected == i) t.selected = true;
					select.appendChild(e("option", t));
				}
				if (selected == -1)
					select.appendChild(e("option", {value: -1, html: Lang.get("videos.video_edit_privacy_extra"), selected: true}));
				return select;
			},
			convertPrivacyToInteger = function (privacy) {
				return {all: 0, friends: 1, friends_of_freinds: 2, nobody: 3}[privacy.type] || -1;
			};

		parent.className = "sf-wrap";
		parent.appendChild(tip(l("videos.video_edit_title")))
		parent.appendChild(e("input", {type: "text", name: "title", value: video.title, required: true}));
		parent.appendChild(tip(l("videos.video_edit_description")))
		parent.appendChild(e("textarea", {name: "description", html: video.description}));

		parent.appendChild(tip(l("videos.video_edit_privacy_view")))
		parent.appendChild(getSelectPrivacy("privacy_view", convertPrivacyToInteger(video.privacy_view)));
		parent.appendChild(tip(l("videos.video_edit_privacy_comment")))
		parent.appendChild(getSelectPrivacy("privacy_comment", convertPrivacyToInteger(video.privacy_view)));
		var isRepeat = {type: "checkbox", name: "repeat"};
		if (video.repeat) isRepeat.checked = true;
		parent.appendChild(e("label", {append: [
			e("input", isRepeat),
			document.createTextNode(l("videos.video_edit_repeat"))
		]}));
		parent.appendChild(e("input", {type: "submit", value: l("general.save")}));
		parent.onsubmit = onSubmit;
		page.appendChild(Site.getPageHeader(l("videos.video_edit_header")));
		page.appendChild(parent);
		page.appendChild(e("a", {"class": "button-block", href: "#videos" + (owner_id != API.userId ? owner_id : "") + "?act=albums&move=" + video_id + "&owner_id=" + owner_id, html: l("videos.video_edit_move")}));
		Site.append(page);
		Site.setHeader(l("videos.video_edit_header"), {link: "video" + owner_id + "_" + video_id, fx: function (event) {Site.route(window.location.hash.replace("#", ""))}});
	},

	restoreVideo: function (videoObjectId) {
		Site.API("video.restore", {
			owner_id: videoObjectId.owner_id,
			video_id: videoObjectId.video_id
		}, function (data) {
			if (data.response)
				Site.Alert({text: "Видеозапись восстановлена. Кликните сюда, чтобы перейти к ней", click: function (event) {
					window.location.hash = "#video" + videoObjectId.owner_id + "_" + videoObjectId.video_id;
				}});
		})
	},
	downloadVideo: function (ownerId, videoId, files) {}, // not implemented
	getLikes: function (owner_id, video_id, access_key) {
		var offset = getOffset();
		Site.APIv5("likes.getList", {
			type: "video",
			owner_id: owner_id,
			item_id: video_id,
			access_key: access_key,
			filter: "likes",
			fields: "photo_50,online,screen_name",
			extended: 1,
			offset: offset,
			count: 50,
			v: 5.18
		}, function (data) {
			if (!(data = Site.isResponse(data)))
				return;
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				count = data.count,
				data = data.items;

			if (count)
				for (var i = 0, l = data.length; i < l; ++i)
					list.appendChild(Templates.getMiniUser(data[i]));
			else
				list.appendChild(Site.getEmptyField(Lang.get("videos.likes_nobody")));

			parent.appendChild(Site.getPageHeader(count ? count + " " + Lang.get("videos", "likes_users", count) : Lang.get("videos.likes_nobody")));
			parent.appendChild(list);
			parent.appendChild(Site.getSmartPagebar(offset, count, 50));

			Site.append(parent);
			Site.setHeader(Lang.get("videos.likes_header"), {link: "video" + owner_id + "_" + video_id});
		});
	},




// TODO: check it
	getComments: function (ownerId, videoId, accessKey, count, canComment) {
		var parent = $.e("div", {id: "__video-comments"}),
			btn = Site.getNextButton({link: window.location.hash, text: Lang.get("videos.comments_header_button").replace(/%s/ig, count), click: function (event) {
				Video.createCommentNode({
					ownerId: ownerId,
					videoId: videoId,
					accessKey: accessKey,
					canComment: canComment,
					offset: 0,
					node: this.parentNode,
					count: count
				});
				$.elements.remove(btn);
			}});
		return $.e("div", {append: [parent, btn]});
	},
	createCommentNode: function (o) {
		var parent = comments({
			getMethod: "video.getComments",
			addMethod: "video.createComment",
			editMethod: "video.editComment",
			removeMethod: "video.deleteComment",
			restoreMethod: "video.restoreComment",
			reportMethod: "video.reportComment",

			ownerId: o.ownerId,
			itemId: o.postId,
			accessKey: o.accessKey,
			type: "post",
			countPerPage: 50,
			canComment: o.canComment
		});
		o.node.appendChild(parent);
	},

	/*
	loadComments: function (o) {
		Site.APIv5("video.getComments", {
			owner_id: o.owner_id,
			video_id: o.video_id,
			access_key: o.access_key || "",
			offset: o.offset || 0,
			count: 30,
			need_likes: 1,
			extended: 1,
			v: 5.21
		}, function (data) {
			if (!(data = Site.isResponse(data))) {
				return;
			}
			Local.add(data.profiles.concat(data.groups));
			var count = data.count,
				data = data.items,
				parent = document.createElement("div");
			if (count)
				for (var i = 0, l = data.length; i < l; ++i) {
					parent.appendChild(Video.itemComment(data[i], o.owner_id, o.video_id));
				}
			else
				parent.appendChild(Site.getEmptyField(Lang.get("videos.comments_noone")));
			if (o.offset + 30 < count + 30) {
				parent.appendChild(Site.getPagination({
					count: count,
					offset: o.offset,
					step: 30,
					callback: function (data) {
						Video.loadComments({
							owner_id: o.owner_id,
							video_id: o.video_id,
							access_key: o.access_key,
							offset: data.offset,
							parent: o.parent
						});
					}
				}))
			}
			$.elements.remove(o.parent.lastChild);
			o.parent.appendChild(parent);
			var top = $.getPosition(o.parent.parentNode).top;
			if (API.bitmask & 128)
				top -= 48;
			document.body.scrollTop = top;
			document.documentElement.scrollTop = top;
		})
	},
	getCommentForm: function (ownerId, videoId, list) {
		return Site.getExtendedWriteForm({
			asAdmin: (ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin),
			name: "text",
			allowAttachments: 30,
			owner_id: ownerId,
			onsubmit: function (event) {
				var text = this.text && this.text.value,
					attachments = this.attachments && this.attachments.value || "";

				if (!$.trim(text)) {
					Site.Alert({text: Lang.get("videos.error_comments_empty_comment")});
					return false;
				}

				Site.API("video.createComment", {
					owner_id: ownerId,
					video_id: videoId,
					message: text,
					attachments: attachments,
					from_group: +(this.as_admin && this.as_admin.checked) || 0
				}, function (data) {
					data = Site.isResponse(data);
					if (data) {
						list.appendChild(Video.itemComment({
							id: data,
							data: Math.round(+new Date() / 1000),
							user_id: API.userId,
							from_id: (this.as_admin && this.as_admin.checked) ? ownerId : API.userId,
							text: text,
							likes: {count: 0, user_likes: 0},
							attachments: []
						}, ownerId, videoId))
					}
				});
				return false;
			}
		})
	},
	comments: {},
	itemComment: function (comment, owner_id, video_id) {
		var item = document.createElement("div"),
			from_id = comment.from_id,
			comment_id = comment.id,
			e = $.elements.create;
		Video.comments[owner_id + "_" + video_id + "_" + comment_id] = comment;
		Video.comments[owner_id + "_" + comment_id] = comment;
		item.id = "video-comment" + owner_id + "_" + video_id + "_" + comment_id;
		item.className = "comments";
		var user = Local.data[from_id] || {}, actions = [];
		if (comment.can_edit) {
			actions.push(e("span", {"class": "a", html: Lang.get("comment.edit"), onclick: function () {
				Video.editComment(owner_id, comment_id);
			}}));
			actions.push(e("span", {"class": "tip", html: " | "}));
		}
		if (owner_id > 0 && owner_id == API.userId || owner_id < 0 && Local.data[owner_id] && Local.data[owner_id].is_admin || from_id == API.userId) {
			actions.push(e("span", {"class": "a", html: Lang.get("comment.delete"), onclick: (function (owner_id, comment_id, node) {
				return function (event) {
					VKConfirm(Lang.get("comment.delete_confirm"), function () {
						Site.API("video.deleteComment", {
							owner_id: owner_id,
							comment_id: comment_id
						}, function (data) {
							data = Site.isResponse(data);
							if (!data)
								return;
							node.parentNode.insertBefore($.elements.create("div", {
								id: "video_comment_deleted_" + owner_id + "_" + comment_id,
								"class": "comments comments-deleted",
								append: [
									document.createTextNode(Lang.get("comment.deleted") + " "),
									e("span", {"class": "a", html: Lang.get("comment.restore"), onclick: (function (owner_id, comment_id, node) {
										return function (event) {
											Site.API("video.restoreComment", {
												owner_id: owner_id,
												comment_id: comment_id
											}, function (data) {
												data = Site.isResponse(data);
												if (data) {
													$.elements.remove($.element("video_comment_deleted_" + owner_id + "_" + comment_id));
													$.elements.removeClass(node, "hidden");
												}
											})
										};
									})(owner_id, comment_id, node)})
								]
							}), node);
							$.elements.addClass(node, "hidden");
						})
					});
				};
			})(owner_id, comment_id, item)}));
		}
		if (from_id != API.userId) {
			if (actions.length)
				actions.push(e("span", {"class": "tip", html: " | "}));
			actions.push(e("span", {"class": "a", html: Lang.get("comment.report"), onclick: function (event) {
				this.parentNode.insertBefore($.elements.create("form", {
					onsubmit: function (event) {return false;},
					"class": "sf-wrap",
					append: [
						Photos.getReportSelect(2),
						                    e("input", {type: "button", value: "Готово", onclick: function (event) {
							Video.reportComment(owner_id, comment_id, video_id);
							return false;
						}})
					],
				}), this);
				$.elements.addClass(this, "hidden");
			}}));
		}
		user.screen_name = user.screen_name || (user.uid || user.id ? "id" + (user.uid || user.id) : "club" + (-user.gid || -user.id));
		item.appendChild(
			e("div", {
				"class": "wall-in",
				append: [
					e("a", {href: "#" + user.screen_name, "class": "comments-left", append: [
						e("img", {src: getURL(user.photo || user.photo_rec || user.photo_50)})
					]}),
					e("div", {
						"class": "comments-right",
						append: [
							e("a", {"class": "bold", href: "#" + user.screen_name, html: (user.name || (user.first_name + " " + user.last_name + " " + Site.isOnline(user)))}),
							e("div", {"class": "comments-content", html: Mail.Emoji(Site.toHTML(Site.Escape(comment.text)) || ""), id: "video_comment_" + owner_id + "_" + comment_id}),
							e("div", {"class": "comments-attachments", append: [Site.createNodeAttachments(comment.attachments, "video_comment" + owner_id + "_" + comment_id)]}),
							e("div",{
								"class":"comments-footer",
								append:[
									e("div", {"class":"comments-actions", append: actions}),
									e("div", {"class":"comments-footer-left", html:$.getDate(comment.date)}),
									e("div", {
										"class": "wall-likes likes",
										id: "like_video_comment_" + owner_id + "_" + comment_id,
										append: getLikeButton("video_comment", owner_id, comment_id, null, comment.likes.count, comment.likes.user_likes)
									})
								]
							})
						]
					})
				]
			})
		);
		return item;
	},
	reportComment: function (ownerId, commentId, videoId) {
		Site.API("video.reportComment", {
			owner_id: ownerId,
			comment_id: commentId
		}, function (data) {
			if (data.response) {
				var e = $.element("video-comment" + ownerId + "_" + videoId + "_" + commentId)
				$.elements.clearChild(e);
				$.elements.addClass(e, "comments-deleted");
				e.innerHTML = Lang.get("comment.reported");
			}
		});
	},
	editComment: function (owner_id, comment_id) {
		var textNode = $.element("video_comment_" + owner_id + "_" + comment_id);
		textNode.innerHTML = '';
		textNode.appendChild(Site.getExtendedWriteForm({
			noHead: true,
			noLeftPhoto: true,
			name: "text",
			value: Video.comments[owner_id + "_" + comment_id].text,
			onsubmit: function (event) {
				var text = this.text && $.trim(this.text.value);
				if (!text) {
					Site.Alert({text: Lang.get("videos.error_comments_empty_comment")});
					return false;
				}
				Site.API("video.editComment", {
					owner_id: owner_id,
					comment_id: comment_id,
					message: text,
					attachments: Wall.AttachmentToString(Video.comments[owner_id + "_" + comment_id].attachments)
				}, function (data) {
					data = Site.isResponse(data);
					if (!data)
						return;
					Video.comments[owner_id + "_" + comment_id].text = text;
					$.element("video_comment_" + owner_id + "_" + comment_id).innerHTML = Mail.Emoji(Site.toHTML(Site.Escape(text)));
				})
				return false;
			}
		}))
	},*/
	putTag: function (ownerId, videoId, userId, callback) {
		var u = Local.data[userId];
		Site.API("video.putTag", {
			owner_id: ownerId,
			video_id: videoId,
			user_id: userId
		}, function (data) {
			if (data.response)
				callback({tag_id: data.response, user_id: userId, tagged_name: u.first_name + " " + u.last_name});
		});
	},
	addMyTag: function (ownerId, videoId, button) {
		Video.putTag(ownerId, videoId, API.userId, function (data) {
			if (!data)
				return;
			button.parentNode.insertBefore($.e("div", {"class": "dd-item", html: Lang.get("videos.tags_delete_mine"), onclick: function (event) {
				Video.removeTag(ownerId, videoId, data.tag_id);
			}}), button);
			Site.Alert({text: Lang.get("videos.info_tag_created")});
			$.elements.remove(button);
		})
	},
	removeTag: function (ownerId, videoId, tagId) {
		VKConfirm(Lang.get("videos.confirm_tag_delete"), function () {
			Site.API("video.removeTag", {
				owner_id: ownerId,
				video_id: videoId,
				tag_id: tagId
			}, function (data) {
				if (data.response) {
					Site.Alert({text: Lang.get("videos.info_tag_deleted")});
					button.parentNode.insertBefore($.e("div", {"class": "dd-item", html: Lang.get("videos.action_video_tag_me"), onclick: function (event) {
						Video.addMyTag(ownerId, videoId, this);
					}}), button);
					$.elements.remove(button);
				}
			});
		});
	},
	showReportVideo: function (ownerId, videoId) {
		window.location.hash = "#video" + ownerId + "_" + videoId + "?act=report";
	},
	reportVideo: function (owner_id, video_id) {
		var parent = document.createElement("div"),
			form = document.createElement("form"),
			e = $.e;
		form.onsubmit = function (event) {
			var type = this.type.options[this.type.selectedIndex].value,
				comment = this.comment.value;
			Site.API("video.report", {
				owner_id: owner_id,
				video_id: video_id,
				type: type,
				comment: comment
			}, function (data) {
				data = Site.isResponse(data);
				if (data === 1) {
					Site.Alert({text: Lang.get("videos.info_report_sent")});
					Site.Loader();
					window.location.hash = "#video" + owner_id + "_" + video_id;
				}
			});
			return false;
		};
		var selecttype = document.createElement("select"),
			tip = function (text) {
				return e("div", {"class": "tip", html: text});
			},
			types = Lang.get("videos.report_types");
		for (var current in types) {
			if (types.hasOwnProperty(current)) {
				selecttype.appendChild(e("option", {value: current, html: types[current]}));
			}
		}
		selecttype.name = "type";
		form.className = "sf-wrap";
		form.appendChild(tip(Lang.get("videos.report_type")));
		form.appendChild(selecttype);
		form.appendChild(tip(Lang.get("videos.report_comment")));
		form.appendChild(e("textarea", {name: "comment"}));
		form.appendChild(e("input", {type: "submit", value: Lang.get("videos.report_send")}));
		parent.appendChild(Site.getPageHeader(Lang.get("videos.report_header")));
		parent.appendChild(form);
		Site.append(parent);
		Site.setHeader(Lang.get("videos.report_header_short"), {link: "video" + owner_id + "_" + video_id});
	}
};