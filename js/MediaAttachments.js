//@require Audio.js
//@require Docs.js

var MediaAttachment = {

	getFromParam: function() {
		return window.location.hash.substring(1);
	},

	photo: function(photo, opts) {
		opts = opts || {};
		var params = {};

		photo.access_key && (params.access_key = photo.access_key);
		params.from = MediaAttachment.getFromParam();
		params = Object.toQueryString(params);

		return {
			node: $.e("a", {
				"class": "photos-item attachments-photo",
				href: "#photo" + photo.owner_id + "_" + photo.id + (params ? "?" + params : ""),
				append: $.e("img", {src: getURL(photo.photo_130) })
			}),
			xsize: photo.photo_604,
			width: photo.width,
			height: photo.height
		};
	},

	video: function(video, opts) {
		opts = opts || {};
		var e = $.e, params = {};

		video.access_key && (params.access_key = video.access_key);
		params.from = MediaAttachment.getFromParam();
		params = Object.toQueryString(params);

		return {
			node: e("a",{
				href: "#video" + video.owner_id + "_" + video.id + (params ? "?" + params : ""),
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
							e("span", {html: video.duration.getDuration()}),
							e("div", {html: video.title.safe()})
						]})
					]
				})
			}),
			width: 720,
			height: 480
		};
	},

	audio: function() {},

	document: function(doc) {
		return {
			node: new VKDocument(doc).getAttachmentNode()
		};
	},
	sticker: function(sticker) {
		var img = lz((isEnabled(4) ? "\/\/static.apidog.ru\/proxed\/stickers\/%sb.png" : STICKERS_SCHEMA_IMAGE).schema({s: sticker.id}));
		img.style.margin = "4px 0";
		return {
			node: img
		};
	},

	link: function(link) {
		var shortlink;

		try {
			shortlink = link.url.match(/\/\/([^\/]+)(\/|$)/igm)[0].replace(/\//g, "");
		} catch (e) {
			shortlink = "перейти";
		};

		link.url = link.url.replace(/https?:\/\/(m\.)?vk\.com\//ig, "\/\/apidog.ru\/6.5\/#");

		return { node: $.e("div", {
			"class": "attachments-link",
			append: [
				$.e("div", {"class": "wall-icons wall-icon-link"}),
				$.e("span", {"class": "tip", html: " Ссылка "}),
				$.e("a", {href: link.url, target: "_blank", html: shortlink + " "}),
				link.preview_page
					? $.e("a", {
						href: "#page" + link.preview_page + "?site=1",
						"class": "btn",
						html: "Предпросмотр"
					  })
					: null

			]
		}) };
	},

	poll: function() {},
	page: function() {},
	note: function() {},
	graffiti: function() {},
	wall: function() {},
	reply: function() {},
	album: function() {},
	app: function() {},

	gift: function(gift) {
		var e = $.e;
		return e("a", {"class": "attachments-gift", href: "#gifts", append: [
			$.e("div", {"class": "gift-preview", append: [
				$.e("img", {"class": "gift-image", src: getURL(gift.gift.thumb_256)}),
				gift.message
					? $.e("div", {"class": "gift-message", html: gift.message.safe()})
					: null
			]}),
			e("div", {html: lg("gifts.gift")})
		]});
	}

};


function MediaAttachments(attachments) {
	this.items = attachments || [];
};

MediaAttachments.prototype.id = function(id) {
	this._id = id;
	return this;
};

MediaAttachments.prototype.count = function() {
	if (this.counts) {
		return this.counts;
	};

	var result = {};
	this.items.forEach(function(item) {
		result[item.type] && result[item.type]++ || (result[item.type] = 1);
	});

	return this.counts = result;
};

MediaAttachments.cases = [
	[],
	[1],
	[2],
	[3],
	[2,2],
	[2,3],
	[3,3],
	[3,4],
	[4,4],
	[4,5],
	[5,5]
];

MediaAttachments.prototype.setup = function(items) {
	var sizes = MediaAttachments.cases[items.length],

		row = function(r) {

		},

		split = function(sizes) {
			var result = [], current = [], row = 0, cell = 0;

			for (var i = 0, l = items.length; i < l; ++i, ++cell) {
				current.push(items[i]);

				if (cell >= sizes[row]) {
					cell = 0; ++row;
					result.push(current);
					current = [];
				};
			};

			current.length && result.push(current);

			return result;
		},

		rows = split(sizes);

	var parent = items[0].node.parentNode,
		parentWidth = $.getPosition(parent).width;

	for (var i = 0, l = rows.length; i < l; ++i) {

		var row = rows[i];

		var sumWidth = row.sum("width"),
			maxParentWidth = parentWidth,
			/*maxWidth = row.max("width").width,
			minHeight = row.min("height").height,
			maxHeight = row.max("height").height,*/

			delta = sumWidth / maxParentWidth;
		for (var j = 0, k = row.length; j < k; ++j) {
			var width = (row[j].width / delta),
				deltaItem = width / row[j].width,
				height = deltaItem * row[j].height;

			if (height > 600) {
				deltaItem = 600 / row[j].height;
				height = 600;
				width = deltaItem * row[j].width;
			}

console.log("QQQ", width, height);
			row[j].node.style.width = width + "px";
			row[j].node.style.height = height + "px";
			row[j].node.style.float = "left";
			if (row[j].xsize && width > 130) {
				row[j].node.querySelector("img").setAttribute("src", row[j].xsize);
			};
		}

	};
};

//MediaAttachments._queueSetup = [];

MediaAttachments.prototype.get = function() {
	var wrap = $.e("div");

	if (!this.items.length) {
		return wrap;
	};

	var result = [
			[], // 0 photo
			[], // 1 video
			[], // 2 audio
			[], // 3 document
			[], // 4 sticker
			[], // 5 link
			[], // 6 poll
			[], // 7 page
			[], // 8 note
			[], // 9 graffiti
			[], // 10 wall
			[], // 11 reply
			[], // 12 album
			[], // 13 app
			[], // 14 gift
		],
		audioPlaylist;
		photoList = [],
		counts = this.count();

		this.items.forEach(function(item, index) {
			var obj = item[item.type];
			switch (item.type) {
				case "photo":
					result[0].push(MediaAttachment.photo(obj, { once: counts.photo === 1 }));
					break;

				case "video":
					result[1].push(MediaAttachment.video(obj));
					break;

				case "audio":
//					audioPlaylist ? audioPlaylist : (audioPlaylist = new VKPlaylist([], APIDOG_AUDIO_PLAYLIST_ATTACHMENT, this._id))
					result[2].push(MediaAttachment.audio(obj));
					break;

				case "doc":
					result[3].push(MediaAttachment.document(obj));
					break;

				case "sticker":
					result[4].push(MediaAttachment.sticker(obj));
					break;

				case "link":
					result[5].push(MediaAttachment.link(obj));
					break;

				case "wall":
					result[10].push(MediaAttachment.wall(obj));
					break;

				case "gift":
					result[14].push(MediaAttachment.gift(obj));
					break;
			};
		});
/*
		for (var i = 0, l = attachments.length; i < l; ++i){
			var a=attachments[i];
			switch(a.type){
				case "photo":
					photos.push(Photos.getAttachment(a.photo, {list: id, full: (ass.photo == 1), from: Site.getAddress(true)}));
					break;
				case "video":
					videos.push(Video.getAttachment(a.video, {from: true}));
					break;
				case "audio":
					audio = a.audio;
					audio.aid = audio.aid || audio.id;
					audios.push(Audios.Item(audio, {lid: audioIdList, from: 8}));
					Audios.Lists[audioIdList].push(audio.owner_id + "_" + (audio.aid || audio.id));
					Audios.Data[audio.owner_id + "_" + (audio.aid || audio.id)] = audio;
					break;
				case "doc":
					docs.push(Docs.getAttachment(Docs.tov5(a.doc)));
					break;
				case "link":
					link = Site.getLinkAttachment(a.link);
					break;
				case "poll":
					if (a.poll && !a.poll.answers)
						continue;
					poll = Polls.getFullAttachment(a.poll, id);
					break;
				case "sticker":
					sticker = Site.getStickerAttachment(a.sticker);
					break;
				case "wall":
					wall.push(Wall.getAttachment(a.wall));
					break;
				case "page":
					page = Pages.getAttachment(a.page);
					break;
				case "note":
					note = Notes.getAttachment(a.note);
					break;
				case "wall_reply":
					a = a.wall_reply;
					reply = Wall.getAttachmentReply(a.owner_id, a.post_id, r.id);
					break;
				case "album":
					var album=a.album;
					album.id = album.id || album.album_id;
					albums.push(Photos.getAttachmentAlbum(album));
					break;
			}
		}
		var nodes=[
			$.e("div",{append: photos}),
			$.e("div",{append: albums}),
			$.e("div",{append: videos}),
			$.e("div",{append: audios}),
			$.e("div",{append: docs}),
			page,
			note,
			poll,
			$.e("div",{append: wall}),
			reply,
			link,
			sticker
		];*/

		var resizable = [],
			wrap = $.e("div", { "class": "attachments-wrapper", append: result.flatten().compact().map(function(item) {
				item.width && item.height && resizable.push(item);
				return item.node || item;
			}) });

		resizable.length && this.setup.bind(this).delay(400, resizable);

		return wrap;
};