/**
 * APIdog v6.5
 *
 * upd: -1
 */

function VKVideo(v) {

};

VKVideo.prototype = {
	getAttachId: function() {
		return this.getType() + this.ownerId + "_" + this.getId();
	},

	getType: function() {
		return "video";
	},

	getId: function() {
		return this.videoId;
	}

};

var Video = {

	// deprecated
	Storage: {Albums:{},Videos:{}},

	tov5: function (o) { return Video.normailzev5(o); },

	Resolve: function (url) { return Video.explain(url); },

	normailzev5: function (video) {
		video.id = video.vid || video.id;
		video.photo_130 = video.image || video.photo_130;
		video.photo_320 = video.image_medium || video.photo_320;
		return video;
	},

	// added 10.01.2016
	initVideoJSLibrary: function (callback) {
		var script = $.e("script", {src: "/includes/videojs.js", onload: function () { callback() }}),
			styles = $.e("link", {rel: "stylesheet", href: "/includes/videojs.css"});

		getHead().appendChild(script);
		getHead().appendChild(styles);
	},

	getAttachment: function (video, o) {
		o = o || {};
		var e = $.e, p = {};
		video = Video.normailzev5(video);
		if (video.access_key)
			p.access_key = video.access_key;
		if (o.from)
			p.from = Site.getAddress(true);
		return e("a",{
			href: "#video" + video.owner_id + "_" + video.id + (sizeof(p) ? "?" + httpBuildQuery(p) : ""),
			"class": "attachments-video",
			append: e("div", {
				"class": "attachments-video-wrap",
				append: [
					e("img", {
						src: getURL(video.photo_800 || video.photo_640 || video.photo_320 || video.photo_130),
						alt: "",
						"class":"attachments-video-img"
					}),
					e("div", {"class": "attachments-video-fugure", append: e("div", {"class": "attachments-video-fugure-source"})}),
					e("div", {"class": "attachments-video-title", append: [
						e("span", {html: Video.getDurationString(video.duration)}),
						e("div", {html: Site.Escape(video.title)})
					]})
				]
			})
		});
	},

	explain: function (url) {
		var list = /^videos(-?\d+)?$/ig,
			album = /^videos(-?\d+)_(\d+)$/ig,
			item = /^video(-?\d+)_(\d+)$/ig,
			act = Site.Get("act");
		if (list.test(url)) {
			var owner_id = /^videos(-?\d+)?$/ig.exec(url)[1] || API.uid;
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
				owner_id = ids[1] || API.uid,
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
				case "edit":    return Video.editVideo(owner_id, video_id, access_key); break;
				default:        return Video.getVideo(owner_id, video_id, access_key); break;
			}
		}
	},

	getTabs: function (owner_id) {
		var tabs = [
			["videos" + (owner_id != API.uid ? owner_id : ""), Lang.get("videos.tabs_videos")],
			["videos" + (owner_id != API.uid ? owner_id : "") + "?act=albums", Lang.get("videos.tabs_albums")]
		];
		if (owner_id > 0) {
			tabs.push(["videos" + (owner_id != API.uid ? owner_id : "") + "?act=tags", Lang.get("videos.tabs_tags")]);
		};
		if (owner_id == API.uid) {
			tabs.push(["videos?act=search", Lang.get("videos.tabs_search")]);
		};
		return Site.CreateTabPanel(tabs);
	},

	getVideos: function (owner_id, album_id) {
		var offset = Site.Get("offset"), p = {
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

			parent.appendChild(Site.CreateHeader(
				count + " " + Lang.get("videos", "videos", count),
				album_id && owner_id == API.uid
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


			if (owner_id == API.uid || owner_id < 0 && Local.Users[owner_id] && Local.Users[owner_id].is_admin)
				list.appendChild(Site.CreateTopButton({
					tag: "div",
					//link: "videos?act=upload" + (owner_id < 0 ? "&gid=" + (-owner_id) : ""),
					title: Lang.get("videos.action_video_add_my"),
					onclick: function (event) { Video.newVideo(owner_id < 0 ? -owner_id : 0) }
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
				list.appendChild(Site.EmptyField(Lang.get("videos.videos_empty")));
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(offset, count, 20));
			Site.Append(parent);
			Site.SetHeader(Lang.get("videos.videos_header"));
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
						document.createTextNode((Lang.get("videos.video_tagged")[Local.Users[v.placer_id].sex || 2]) + " " + Local.Users[v.placer_id].first_name + " " + Local.Users[v.placer_id].last_name + " " + Site.getDate(v.tag_created))
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

	// created 10.01.2016
	newVideo: function (groupId) {
		var host;
		new Modal({
			noPadding: true,
			title: Lang.get("videos.newVideoWindowTitle"),
			content: (host = new TabHost([
				{
					name: "add",
					title: Lang.get("videos.newVideoTabAdd"),
					content: Video.getAddVideoForm(groupId)
				},
				{
					name: "upload",
					title: Lang.get("videos.newVideoTabUpload"),
					content: Video.getUploadVideoForm(groupId)
				}
			], {
				onOpenedTabChanged: function (event) {

				}
			})).getNode(),
			footer: [
				{
					name: "add",
					title: Lang.get("videos.upload_create"),
					onclick: function () {
						var s = host.getSelectedTab(), modal = this;
						if (s.name == "add") {
							console.log(s)
							s = s.content.firstChild;
							var params = {
								link: $.trim(s.url.value),
								name: $.trim(s.title.value),
								description: $.trim(s.description.value),
								wallpost: s.wallpost && +s.wallpost.checked,
				//              is_private: +s.is_private.checked,
								repeat: +s.repeat.checked,
								v: 5.18
							};

							if (groupId) {
								params.group_id = groupId;
							};

							if (!params.link) {
								Site.Alert({text: Lang.get("videos.error_insert_link")});
								return;
							};

							Site.APIv5("video.save", params, function (data) {
								data = Site.isResponse(data);
								document.getElementsByTagName("head")[0].appendChild($.e("script", {
									src: data.upload_url.replace(/^http:\/\/cs(\d+)\.vk\.com\//igm, "https://pu.vk.com/c$1/")
								}));
								window.location.hash = "#videos" + data.owner_id + "?uploaded=success";
								modal.close();
							});
						} else {
							var params = {
								name: $.trim(s.title.value),
								description: $.trim(s.description.value),
								wallpost: s.wallpost && +s.wallpost.checked,
								repeat: +s.repeat.checked,
								v: 5.18
							};
							Site.APIv5("video.save", params, function (data) {

								data = Site.isResponse(data);

								$.elements.clearChild(s.content);

								s.content.action = data.upload_url;
								s.content.enctype = "multipart/form-data";
								s.content.method = "post";
								s.content.target = "__video-upload";

								s.content.appendChild(tip(Lang.get("videos.upload_select_file")));
								s.content.appendChild(Site.CreateFileButton("video_file", {fullwidth: true}));
								s.content.appendChild(e("input", {type: "submit", value: Lang.get("videos.upload_upload")}));
								s.content.appendChild(e("iframe", {src: "about:blank", name: "__video-upload", id: "__video-upload", width: "100%", height: 200, frameborder: 0, onload: function () {
									try {
										if (getFrameDocument(this).location.href == "about:blank")
											return;
										Site.Alert({text: Lang.get("videos.upload_success")});
									} catch (e) {
										console.error(e.toString());
									}
								}}));
							});

						};
					}
				},
				{
					name: "close",
					title: Lang.get("general.cancel"),
					onclick: function () {

					}
				}
			]
		}).show();
	},

	// refactored 10.01.2016
	getAddVideoForm: function (groupId) {
		var e = $.e,
			form = e("form", {"class": "sf-wrap sf-wrap-forcePadding"}),
			tip = function (text) {return e("div", {"class": "tip", html: text});};
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
		form.appendChild(e("label", {append: [
			e("input", {type: "checkbox", name: "repeat"}),
			document.createTextNode(Lang.get("videos.upload_is_repeat"))
		]}));

		return form;
	},

	// refactored 10.01.2016
	getUploadVideoForm: function (groupId) {
		var e = $.e,
			form = e("form", {"class": "sf-wrap sf-wrap-forcePadding"}),
			tip = function (text) {return e("div", {"class": "tip", html: text});};

		form.appendChild(tip(Lang.get("videos.upload_title")));
		form.appendChild(e("input", {type: "text", name:"title"}));

		form.appendChild(tip(Lang.get("videos.upload_description")));
		form.appendChild(e("textarea", {name: "description"}));

		if (!groupId) {
			form.appendChild(e("label", {append: [
				e("input", {type: "checkbox", name: "wallpost"}),
				document.createTextNode(Lang.get("videos.upload_is_wallpost"))
			]}));
		};

		form.appendChild(e("label", {append: [
			e("input", {type: "checkbox", name: "repeat"}),
			document.createTextNode(Lang.get("videos.upload_is_repeat"))
		]}));

		return form;
	},

	albums: {},

	getAlbums: function (owner_id) {
		Site.APIv5("video.getAlbums", {
			owner_id: owner_id,
			offset: Site.Get("offset"),
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
			parent.appendChild(Site.CreateHeader(
				"<span id=vac>" + count + "</span> " + Lang.get("videos", "albums", count),
				owner_id == API.uid ? $.e("span", {href: "#videos" + owner_id + "?act=create", html: Lang.get("videos.albums_new"), "class": "fr a", onclick: function (event) {
					Video.showCreateAlbum(list, owner_id, this);
				}}) : null
			));
			if (r.error && r.error_code == 204) {
				list.appendChild(Site.EmptyField(Lang.get("videos.error_access_denied")));
			} else
				if (count)
					for (var i = 0, l = data.length; i < l; ++i) {
						var v = data[i];
						Video.albums[v.owner_id + "_" + v.id] = v;
						list.appendChild(Video.itemAlbum(v, p));
					}
				else
					list.appendChild(Site.EmptyField(Lang.get("videos.albums_empty")));

			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 40));
			Site.Append(parent);
			Site.SetHeader(Lang.get("videos.albums_header"), {link: "videos" + (owner_id != API.uid ? owner_id : "")});
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
						id: data.album_id,
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
					Site.CreateInlineForm({
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
		parent.appendChild(Site.CreateHeader(Lang.get("videos.albums_edit_header")));
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
					Site.CreateInlineForm({
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
		Site.Append(parent);
	},

	editAlbum: function (ownerId, albumId, title) {
		Site.APIv5("video.editAlbum", {
			owner_id: ownerId,
			album_id: albumId,
			title: title,
			v: 5.14
		}, function (data) {
			if (data) {
				if (Video.albums[ownerId + "_" + albumId])
					Video.albums[ownerId + "_" + albumId].title = title;
				Site.Go(window.location.hash.replace("#", ""));
			}
		})
	},

	deleteAlbum: function (ownerId, albumId) {
		VKConfirm(Lang.get("videos.confirm_album_delete"), function () {
			Site.APIv5("video.deleteAlbum", {owner_id: ownerId, album_id: albumId, v: 5.14}, function (data) {
				if (!data)
					return Site.Alert({text: "error #" + data.error.error_code + " (" + data.error.error_msg + ")"});
				Site.Alert({text: Lang.get("videos.info_album_deleted")});
				window.location.hash = "#videos" + (ownerId != API.uid ? ownerId : "") + "?act=albums";
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
		var offset = Site.Get("offset");
		Site.API("execute", {
			code: 'var v=API.video.getNewTags({count:30,offset:%o%,v:5.18});return {videos:v,users:API.users.get({user_ids:v.items@.placer_id,field:"online,sex"})};'
				.replace(/%o%/, offset)
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				users = Local.AddUsers(data.users),
				data = data.videos,
				count = data.count,
				data = data.items;
			parent.appendChild(Video.getTabs(API.uid));
			parent.appendChild(Site.CreateHeader(
				count
					? Lang.get("videos.videos_tags_header")
						.replace(/%d/img, count)
						.replace(/%s/img, Lang.get("videos", "videos__tags", count))
					: Lang.get("videos.videos_tags") ));
			if (count)
				for (var i = 0, l = data.length; i < l; ++i)
					parent.appendChild(Video.item(data[i]));
			else
				parent.appendChild(Site.EmptyField());
			parent.appendChild(Site.PagebarV2(offset, count, 30));
			Site.Append(parent);
			Site.SetHeader(Lang.get("videos.videos_tags"), {link: "videos"});
		})
	},

	getUserVideos: function (owner_id) {
		var offset = Site.Get("offset");
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
			parent.appendChild(Site.CreateHeader(count + " " + Lang.get("videos", "videos", count)));
			if (newTags)
				parent.appendChild(Site.CreateTopButton({tag: "a", link: "videos?act=newtags", title: Lang.get("videos.videos_tags") + " (" + newTags + ")"}))
			if (count)
				for (var i = 0, l = data.length; i < l; ++i)
					list.appendChild(Video.item(data[i]));
			else
				list.appendChild(Site.EmptyField(Lang.get("videos.tags_user_no")));
			parent.appendChild(list);
			parent.appendChild(Site.PagebarV2(offset, count, 30));
			Site.Append(parent);
			Site.SetHeader(Lang.get("videos.tags_header"));
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
			offset: Site.Get("offset"),
			v: 5.18
		};
		if (!$.element("__video-search"))
			Video.searchPage();
		else
			Site.APIv5("video.search", params, function (data) {
				if (data.error && data.error.error_code == 100) {
					return Site.Alert({text: Lang.get("videos.error_search_empty_query")});
				};
				return Video.getSearchResults(Site.isResponse(data));
			});
	},

	searchPage: function () {
		var parent = document.createElement("div"),
			l = Lang.get,
			list = document.createElement("div"),
			form = Site.CreateInlineForm({
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

		parent.appendChild(Video.getTabs(API.uid));
		parent.appendChild(Site.CreateHeader(l("videos.search_search"), e("span", {id: "__video-search-count", html: "", "class": "fr"})));
		parent.appendChild(form);
		parent.appendChild(list);

		Site.Append(parent);
		Site.SetHeader(Lang.get("videos.search_videos"), {link: "videos"});
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
		parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 30));
		list.appendChild(parent);
	},

	// local-cache
	videos: {},

	// modernized 10.01.2016
	getVideo: function (owner_id, video_id, access_key) {
		if (!window.videojs) {
			return Video.initVideoJSLibrary(function () {
				Video.getVideo(owner_id, video_id, access_key);
			});
		};
		Site.API("execute", {
			code: ('var v=API.video.get({videos:"%o%_%v%%a%",extended:1,v:5.18}),p=v.profiles,g=v.groups;v=v.items[0];v.inAlbums=API.video.getAlbumsByVideo({owner_id:%o%,video_id:%v%});return{video:v,u:p+g,increment:API.video.incViewCounter({owner_id:%o%,video_id:%v%}),tags:API.video.getTags({owner_id:%o%,video_id:%v%,v:5.21})};')
				.replace(/%o%/ig, owner_id)
				.replace(/%g%/ig, -owner_id)
				.replace(/%v%/ig, video_id)
				.replace(/%a%/ig, access_key ? "_" + access_key : "")
		}, function (data) {
			data = Site.isResponse(data);
			Local.AddUsers(data.u);

			var video       = data.video;

			if (!video) {
				Site.Append(Site.EmptyField("Видеозапись не найдена. Возможно, она была удалена или у Вас нет доступа."));
				return;
			};

			if (Audios.isPlaying())
				Audios.Player.Pause();

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
				player      = Video.getAPIdogPlayer(video),
				footer      = Video.getFooter(video, tags),
				comments    = Video.getComments(owner_id, video_id, access_key, video.comments, owner_id == API.uid || video.can_comment || !!video.privacy_comment),
				from		= Site.Get("from") ? decodeURIComponent(Site.Get("from")) : false;

			Video.videos[owner_id + "_" + video_id] = video;

			parent.appendChild(header);
			parent.appendChild(player);
			parent.appendChild(footer);
			parent.appendChild(comments);

			Site.Append(parent);
			Site.SetHeader(Lang.get("videos.video_header"), {link: from ? from : "videos" + (owner_id == API.uid ? "" : owner_id)});


			if (player.firstChild.tagName.toLowerCase() == "video") {
				Video.onChangeBodySizeEvent();
				videojs("__video_player_wrap", {
					controls: true,
					plugins: {
						videoJsResolutionSwitcher: {
							"default": 360,
							dynamicLabel: true
						}
					}
				}, function () {
					var playerjs = this;

					playerjs.hotkeys({
						volumeStep: 0.1,
						seekStep: 10,
						enableNumbers: true
					});

					playerjs.updateSrc((function (links, resolutions, key, p) {
						for (key in links) {
							p = parseInt(key.replace(/^mp4_/ig, ""));
							resolutions.push({
								src: links[key],
								type: "video/mp4",
								label: p + "p",
								res: p
							});
						};
						return resolutions;
					})(video.files, []));

					window.onLeavePage = function () {
						playerjs.dispose();
					};
				});
			};
		})
	},

	hasMineInVideo: function (tags) {
		for (var i = 0, l = tags.length; i < l; ++i)
			if (tags[i].user_id == API.uid)
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
			hasMine		= ~video.inAlbums.indexOf(-2) || API.uid == video.owner_id;
		if (!accessKey && API.uid == video.owner_id)
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
		if (video.can_edit) {
			actions[l("videos.action_video_edit")]          = function (event) {Video.editVideo(ownerId, videoId, accessKey)};
		};
		if (hasMine) {
			actions[l("videos.action_video_delete")]        = function (event) {Video.deleteVideo(ownerId, videoId, accessKey)};
		};
		return Site.CreateHeader(Site.Escape(video.title), Site.CreateDropDownMenu(Lang.get("general.actions"), actions));
	},

	// modernized 07.01.2016
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
			owner = Local.Users[owner_id] || {},
			e = $.elements.create;
		o = o || {};
		parent.className = "video-footer";
		if (video.files && !video.files.external) {
			parent.appendChild(e("div", {style: "padding: 2px", append: Site.CreateDropDownMenu("Скачать", (function (v, o) {
				for (var i in v)
					o[i.toUpperCase().replace("_", " ")] = (function (u) { return function () { window.open(u) }})(v[i]);
				return o;
			})(video.files, {}), {toTop: true})}) );
		};
		if (description) {
			parent.appendChild(e("div", {"class": "tip", html: Lang.get("videos.video_description")}));
			parent.appendChild(e("div", {html: Site.Format(Site.Escape(description))}));
		};
		parent.appendChild(e("div", {append: [e("span", {"class": "tip", html: Lang.get("videos.video_uploaded")}), document.createTextNode($.getDate(date))]}));
		parent.appendChild(e("div", {"class": "wall-likes likes", id:"like_video_" + owner_id + "_" + video.id, append: [Wall.LikeButton("video", owner_id, video.id, video.likes, 0, o.access_key || null)]}));
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

	onChangeBodySizeEvent: function () {
		var width = $.getPosition($.element("content")).width,
			player = $.element("__video_player_wrap");

		player.style.width = width + "px";
		player.style.height = (width * 0.70) + "px";
	},

	getAPIdogPlayer: function (video) {
		var wrap = $.e("div");
		window.onResizeCallback = Video.onChangeBodySizeEvent;
		if (!video.files || video.files && (video.files.external || video.files.flv_320 || video.files.flv_240)) {
			wrap.id = "__video_player_wrap";
			var u = video.player.replace(/^http:/ig, "https:");
			wrap.appendChild($.e("iframe", {
				frameborder: 0,
				allowfullscreen: true,
				src: video.files && video.files.external ? (/vk.com/ig.test(u) ? video.files.external.replace(/^http:/ig, "https:") : u) : "data:text/html,<html><meta charset=utf-8><body><a href='" + u + "' target=_blank>Открыть видео в отдельном окне</a><br><iframe src='" + u + "' frameborder=0 width=100% height=100%></iframe></body></html>",
				style:"width:100%;height:100%;"
			}));
			setTimeout(Video.onChangeBodySizeEvent, 200);
			return wrap;
		};

		var v = $.e("video", {"class": "video-js vjs-default-skin vjs-big-play-centered", width: "100%", id: "__video_player_wrap", "data-setup": '{"controls": true}'});
		wrap.appendChild(v);
		return wrap;
	},

	deleteVideo: function (ownerId, videoId, accessKey) {
		VKConfirm(Lang.get("videos.confirm_video_delete"), function () {
			var method, params;
			if (ownerId == API.uid) {
				method = "video.delete";
				params = {
					owner_id: ownerId,
					video_id: videoId,
					access_key: accessKey || ""
				};
			} else {
				method = "video.removeFromAlbum";
				params = {
					target_id: API.uid,
					album_id: -2,
					owner_id: ownerId,
					video_id: videoId
				};
			};
			Site.API(method, params, function (data) {
				if (data.response) {
					Site.Alert({text: Lang.get("videos.info_video_deleted")});
					Video.deleted = {owner_id: ownerId, video_id: videoId};
					if (ownerId == API.uid)
						window.location.hash = "#videos" + ownerId;
				}
			});
		});
	},

	addVideo: function (ownerId, videoId, accessKey) {
		Site.API("video.add", {owner_id: ownerId, video_id: videoId, access_key: accessKey || ""}, function (data) {
			if (data.response) {
				Site.Alert({text: Lang.get("videos.info_video_added")});
			}
		});
	},

	// refactored 10.01.2016
	editVideo: function (ownerId, videoId, accessKey) {

		var video = Video.videos[ownerId + "_" + videoId],
			privacyChoises = Lang.get("videos.video_edit_privacy").map(function (v, i) { return {value: i, html: v} }),
			convertPrivacyToInteger = function (privacy) {
				return {all: 0, friends: 1, friends_of_freinds: 2, nobody: 3}[privacy.type] || -1;
			},
			items = [
				{
					type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
					name: "name",
					title: "videos.video_edit_title",
					value: video.title
				},
				{
					type: APIDOG_UI_EW_TYPE_ITEM_TEXTAREA,
					name: "desc",
					title: "videos.video_edit_description",
					value: video.description
				},
				{
					type: APIDOG_UI_EW_TYPE_ITEM_CHECKBOX,
					name: "repeat",
					title: "videos.video_edit_repeat",
					checked: video.repeat
				}
			];

		if (ownerId < 0) {
			items.push({
				type:APIDOG_UI_EW_TYPE_ITEM_CHECKBOX,
				name: "no_comments",
				title: "videos.video_edit_no_comments",
				checked: video.no_comments
			});
		} else {
			items.push({
				type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
				name: "privacy_view",
				title: "videos.video_edit_privacy_view",
				items: privacyChoises,
				value: convertPrivacyToInteger(video.privacy_view)
			});
			items.push({
				type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
				name: "privacy_comment",
				title: "videos.video_edit_privacy_comment",
				items: privacyChoises,
				value: convertPrivacyToInteger(video.privacy_comment)
			});
		};

// TODO: privacy

		new EditWindow({
			lang: true,
			title: "videos.video_edit_header",
			isEdit: true,
			items: items,
			onSave: function (values, modal) {
				values.owner_id = ownerId;
				values.video_id = videoId;
				values.access_key = accessKey;

				Site.API("video.edit", values, function (data) {
					modal.setContent(getEmptyField("videos.video_edit_success", true)).setFooter("").closeAfter(1500);
				})
			}
		});
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



	getComments: function (ownerId, videoId, accessKey, count, canComment) {
		var parent = $.e("div", {id: "__video-comments"}),
			btn = Site.CreateNextButton({link: window.location.hash, text: Lang.get("videos.comments_header_button").replace(/%s/ig, count), click: function (event) {
				Video.createCommentNode({
					ownerId: ownerId,
					videoId: videoId,
					accessKey: accessKey,
					canComment: canComment,
					offset: 0,
					node: this.parentNode,
					count: count
				});
			}});
		return $.elements.create("div", {append: [parent, btn]});
	},
	createCommentNode: function (o) {
		var parent = document.createElement("div"),
			list = document.createElement("div"),
			form = Video.getCommentForm(o.ownerId, o.videoId, list),
			e = $.e;

		list.id = "__video-comments-list";
		list.appendChild(Site.EmptyField("<img src='\/\/static.apidog.ru\/im-attachload.gif' alt='' \/>"));

		parent.appendChild(Site.CreateHeader(Lang.get("videos.comments_header").replace(/%s/ig, o.count)))
		parent.appendChild(list);

		Video.loadComments({
			owner_id: o.ownerId,
			video_id: o.videoId,
			access_key: o.accessKey,
			offset: o.offset,
			parent: list
		});

		if (o.canComment)
			parent.appendChild(form);

		$.elements.clearChild(o.node);
		o.node.appendChild(parent);
	},
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
			Local.AddUsers(data.profiles.concat(data.groups));
			var count = data.count,
				data = data.items,
				parent = document.createElement("div");
			if (count)
				for (var i = 0, l = data.length; i < l; ++i) {
					parent.appendChild(Video.itemComment(data[i], o.owner_id, o.video_id));
				}
			else
				parent.appendChild(Site.EmptyField(Lang.get("videos.comments_noone")));
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
			if (API.SettingsBitmask & 128)
				top -= 48;
			document.body.scrollTop = top;
			document.documentElement.scrollTop = top;
		})
	},
	getCommentForm: function (ownerId, videoId, list) {
		return Site.CreateWriteForm({
			asAdmin: (ownerId < 0 && Local.Users[ownerId] && Local.Users[ownerId].is_admin),
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
							user_id: API.uid,
							from_id: (this.as_admin && this.as_admin.checked) ? ownerId : API.uid,
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
		var user = Local.Users[from_id] || {}, actions = [];
		if (comment.can_edit) {
			actions.push(e("span", {"class": "a", html: Lang.get("comment.edit"), onclick: function () {
				Video.editComment(owner_id, comment_id);
			}}));
			actions.push(e("span", {"class": "tip", html: " | "}));
		}
		if (owner_id > 0 && owner_id == API.uid || owner_id < 0 && Local.Users[owner_id] && Local.Users[owner_id].is_admin || from_id == API.uid) {
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
		if (from_id != API.uid) {
			if (actions.length)
				actions.push(e("span", {"class": "tip", html: " | "}));
			actions.push(e("span", {"class": "a", html: Lang.get("comment.report"), onclick: function (event) {
				this.parentNode.insertBefore($.elements.create("form", {
					onsubmit: function (event) {return false;},
					"class": "sf-wrap",
					append: [
						Photos.getReportSelect(2),
/**/                    e("input", {type: "button", value: "Готово", onclick: function (event) {
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
							e("div", {"class": "comments-content", html: Mail.Emoji(Site.Format(Site.Escape(comment.text)) || ""), id: "video_comment_" + owner_id + "_" + comment_id}),
							e("div", {"class": "comments-attachments", append: [Site.Attachment(comment.attachments, "video_comment" + owner_id + "_" + comment_id)]}),
							e("div",{
								"class":"comments-footer",
								append:[
									e("div", {"class":"comments-actions", append: actions}),
									e("div", {"class":"comments-footer-left", html:$.getDate(comment.date)}),
									e("div", {
										"class": "wall-likes likes",
										id: "like_video_comment_" + owner_id + "_" + comment_id,
										append:[Wall.LikeButton("video_comment", owner_id, comment_id, comment.likes)]
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
		textNode.appendChild(Site.CreateWriteForm({
			nohead: true,
			noleft: true,
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
					$.element("video_comment_" + owner_id + "_" + comment_id).innerHTML = Mail.Emoji(Site.Format(Site.Escape(text)));
				})
				return false;
			}
		}))
	},
	putTag: function (ownerId, videoId, userId, callback) {
		var u = Local.Users[userId];
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
		Video.putTag(ownerId, videoId, API.uid, function (data) {
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
			tip = function (text) {return e("div", {"class": "tip", html: text});},
			types = Lang.get("videos.report_types");
		for (var current in types)
			selecttype.appendChild(e("option", {value: current, html: types[current]}));
		selecttype.name = "type";
		form.className = "sf-wrap";
		form.appendChild(tip(Lang.get("videos.report_type")));
		form.appendChild(selecttype);
		form.appendChild(tip(Lang.get("videos.report_comment")));
		form.appendChild(e("textarea", {name: "comment"}));
		form.appendChild(e("input", {type: "submit", value: Lang.get("videos.report_send")}));
		parent.appendChild(Site.CreateHeader(Lang.get("videos.report_header")));
		parent.appendChild(form);
		Site.Append(parent);
		Site.SetHeader(Lang.get("videos.report_header_short"), {link: "video" + owner_id + "_" + video_id});
	}
};