/**
 * APIdog v6.5
 *
 * Branch: dev
 * Progress: 30%
 */

function VKAudio(a) {
	this.ownerId = a.owner_id;
	this.audioId = a.id || a.aid;
	this.albumId = a.album_id;
	this.lyricsId = a.lyrics_id;
	this.artist = a.artist;
	this.title = a.title;
	this.duration = a.duration;
	this.genreId = a.genre_id || a.genre;
	this.url = a.url;
	this.date = a.date;
	this.isNoSearch = !!a.no_search;
};

VKAudio.prototype = {

	getAttachId: function() {
		return this.getType() + this.ownerId + "_" + this.getId();
	},

	getType: function() {
		return "audio";
	},

	/**
	 * Returns string in "VK-style"
	 */
	getId: function() {
		return this.ownerId + "_" + this.audioId;
	},

	/**
	 * Playlist, which pinned this audio
	 */
	mPlaylist: null,

	/**
	 * Node for list
	 */
	mNode: null,

	/**
	 * Node of icon play/pause for list
	 */
	mNodeControl: null,

	/**
	 * Node of time playing for list
	 */
	mNodeTimePlayed: null,

	/**
	 * Node of artist for list
	 */
	mNodeArtist: null,

	/**
	 * Node of title for list
	 */
	mNodeTitle: null,

	/**
	 * Create (or return if was created in past) node for inserting to list
	 */
	getNode: function() {
		if (this.mNode) {
			return this.mNode;
		};

		var e = $.e,
			self = this,

			wrap = e("div", {
				id: "audio" + this.getId(),
				"class": "audio-item",

				append: [
					e("div", {"class": "audio-right", append: [
						e("div", {"class": "audio-times", append: [
							e("div", {"class": "audio-time-real", html: this.getDuration()}),
							this.mNodeTimePlayed = e("div", {"class": "audio-time-played"})
						]}),
						e("div", {"class": "audio-actions", append: this.getActions()})
					]}),
					this.mNodeControl = e("div", {"class": "audio-control audio-i audio-i-play"}),
					e("div", {"class": "audio-content", append: [
						e("div", {"class": "audio-title", append: [
							this.mNodeArtist = e("strong", {html: this.artist.safe()}),
							document.createTextNode(" — "),
							this.mNodeTitle = e("span", {html: this.title.safe()})
						]})
					]})
				],

				onclick: function(event) {
					if (event.ctrlKey) {
						return self.getBitrate(function(result) {
							new Snackbar({
								text: result.isSuccess
									? lg("audio.infoBitrate").schema({
										t: self.artist + " - " + self.title,
										b: result.rate,
										s: result.size.getInformationValue()
									})
									: lg("audio.errorBitrate")
							}).show();
						});
					};

					Audios.setPlaylist(self.getPlaylist());

					return $.event.cancel(event);
				}
			});


		return wrap;
	},

	/**
	 *
	 */
	setStateControl: function(isPlaying) {
		$.elements[isPlaying ? "removeClass" : "addClass"](this.mNodeControl, "audio-i-play");
		$.elements[isPlaying ? "addClass" : "removeClass"](this.mNodeControl, "audio-i-pause");
	},

	/**
	 * Returns playlist, which audio pinned
	 */
	getPlaylist: function() {
		return this.mPlaylist;
	},

	/**
	 * Returns duration in human-style
	 */
	getDuration: function() {
		return $.toTime(this.duration);
	},

	/**
	 * Returns buttons for list-item
	 */
	getActions: function() {
		return [];
	},

	/**
	 * Preloading text lyrics
	 */
	loadLyrics: function(listener) {
		if (!this.lyricsId) {
			listener({text: ""});
			return;
		};

		new APIRequest("audio.getLyrics", {lyricsId: this.lyricsId}).setOnCompleteListener(listener).execute();
	},

	/**
	 * Adding audio to list my audios
	 */
	addAudio: function(callback) {
		var self = this;
		new APIRequest("audio.add", { ownerId: this.ownerId, audioId: this.audioId })
			.setOnCompleteListener(function(result) {
				APINotify.fire(DogEvent.AUDIO_ADDED, { audio: self });

				var list = Audios.getPlaylist(APIDOG_AUDIO_PLAYLIST_OWNER, API.userId);

				if (list) {
					list.addAudio(self);
				};
			})
			.setOnErrorListener(function(error) {
				console.error(error);
			})
			.execute();
	},

	/**
	 * Open dialog moving audio to album
	 */
	moveAudioToAlbum: function() {

	},

	/**
	 * Open modal window for editing audio
	 */
	editAudio: function() {
		var audio = this, w;
		w = new EditWindow({
			lang: true,
			title: "audio.editWindowTitle",
			isEdit: true,
			items: [
				{
					type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
					name: "artist",
					title: "audio.editArtist",
					value: audio.artist
				},
				{
					type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
					name: "title",
					title: "audio.editTitle",
					value: audio.title
				},
				{
					type: APIDOG_UI_EW_TYPE_ITEM_SELECT,
					name: "genreId",
					title: "audio.editTitle",
					items: Audios.mGenres.map(function(item) {
						return {
							value: item.genreId,
							html: item.title
						};
					}),
					value: audio.genreId
				},
				{
					type: APIDOG_UI_EW_TYPE_ITEM_CHECKBOX,
					name: "noSearch",
					title: "audio.editTitle",
					checked: audio.isNoSearch
				},
				{
					type: APIDOG_UI_EW_TYPE_ITEM_TEXTAREA,
					name: "text",
					title: "audio.editText",
					value: ""
				}
			],
			onSave: function(values, modal) {
				new APIRequest("audio.edit", values)
					.setParam("ownerId", audio.ownerId)
					.setParam("audioId", audio.audioId)
					.setOnCompleteListener(function(data) {
						modal.setContent(getEmptyField("audio.editSuccess", true)).setFooter("").closeAfter(1500);
						audio.artist = values.artist;
						audio.title = values.title;
						audio.lyricsId = data; // audio.edit returns id of lyrics after saving
						audio.isNoSearch = values.noSearch;
						audio.genreId = values.genreId;
						audio.notifySetDataChanged();
					})
					.execute();
			}
		});
		var text = w.getItemFormNodeByName();
		text.disabled = true;
		text.value = "...";
		this.getLyrics(function(lyrics) {
			text.value = lyrics;
		});
	},

	/**
	 * Invoking when audio was edited
	 * Do not invoke manually!
	 */
	notifySetDataChanged: function() {
		this.mNodeArtist = this.artist.safe();
		this.mNodeTitle = this.title.safe();
	},

	/**
	 * Open confirm and delete audio
	 */
	deleteAudio: function() {
		var self = this;
		new Snackbar({
			text: lg("audio.deleteDone"),
			duration: 10000,
			onClose: function() {
				new APIRequest("audio.delete", {
					ownerId: self.ownerId,
					audioId: self.audioId
				}).setOnCompleteListener(function(result) {
					$.elements.remove(self.mNode);
				}).execute();
			},
			onClick: function(snackbar) {
				snackbar.close();
			},
			action: {
				label: lg("audio.deleteRestore"),
				onClick: function() {
					$.elements.removeClass(self.node, "doc-deleted");
				}
			}
		}).show();
		$.elements.addClass(this.node, "doc-deleted");
	},

	getBitrate: function(callback) {
		APIdogRequest("apidog.getBitrate", { a: API.userAccessToken, i: this.getId() }, function(data) {
			callback({ isSuccess: data.isSuccess, rate: data.bitrate, size: data.size || 0 });
		});
	}

};


/**
 * Playlist of audios
 */
function VKPlaylist(data, type, id) {
	this.playlistId = type + id;
	this.id = id;
	this.type = type;
	this.mRealCount = data.count;
	this.mData = parse(data.items, VKAudio);
	this.mCurrent = -1;
	this.mIsShuffled = false;
	this.notifyItemsAboutPlaylist();
};

VKPlaylist.prototype = {

	/**
	 * Playlist label: contain type+id
	 */
	playlistId: null,

	/**
	 * ID of list. Usually it contain ownerId, target audio, etc info
	 */
	id: null,

	/**
	 * Type of list. Supported constants:
	 * APIDOG_AUDIO_PLAYLIST_OWNER
	 * APIDOG_AUDIO_PLAYLIST_ATTACHMENT
	 * APIDOG_AUDIO_PLAYLIST_OWNER_ALBUM
	 * APIDOG_AUDIO_PLAYLIST_RADIO
	 */
	type: null,

	/**
	 * Real count audios in list, requested from VK
	 */
	mRealCount: 0,

	/**
	 * List of VKAudio-objects
	 */
	mData: null,

	/**
	 * Positive index, if playing this list. Contains current position in list
	 */
	mCurrent: -1,

	/**
	 * Flag. true if in current time playlist are loading
	 */
	mIsLoading: false,

	/**
	 * Flag. true if all list was loaded
	 */
	mIsAllLoaded: false,

	/**
	 * Flag, true if list already shuffled
	 */
	mIsShuffled: false,

	/**
	 * List changer listnener
	 * Invoked after preloading and shuffling list
	 */
	mOnListChangedListener: null,

	/**
	 * Returns playlist ID
	 */
	getListId: function() {
		return this.playlistId;
	},

	/**
	 * Returns ID of playlist
	 */
	getId: function() {
		return this.id;
	},

	/**
	 * Returns content type of playlist
	 */
	getType: function() {
		return this.type;
	},

	/**
	 * Returns real count of audios in list (VK)
	 */
	getRealCount: function() {
		return this.mRealCount;
	},

	/**
	 * Returns available items in current time in this playlist
	 */
	getCount: function() {
		return this.mData.length;
	},

	/**
	 * Return audio by index from this playlist
	 */
	get: function(index) {
		return this.mData[index] || false;
	},

	/**
	 * Returns current playing audio (index or object)
	 */
	getCurrent: function(isExtended) {
		return !isExtended ? this.mCurrent : this.get(this.mCurrent);
	},

	/**
	 * Returns true, if currently playing audio isn't last
	 */
	hasNext: function() {
		return this.mCurrent != -1 && this.mCurrent + 1 < this.mData.length - 1;
	},

	/**
	 * Returns true, if currently playing audio isn't first
	 */
	hasPrevious: function() {
		return this.mCurrent != -1 && this.mCurrent - 1 >= 0;
	},

	/**
	 * Preloading playlist, if cached count not equal real count
	 */
	preload: function(callback) {
		if (this.mIsLoading || this.mIsAllLoaded) {
			return;
		};

		this.mIsLoading = true;
		var self = this, wasCount = this.getCount();
		callback(function(result) {
			result = result.items ? result : result.audios;
			APINotify.fire(DogEvent.AUDIO_LIST_PRELOADED, { playlistId: self.getId() });
			result = parse(result.items, VKAudio);
			self.mData = self.mData.concat(result);
			self.notifyItemsAboutPlaylist();
			self.notifySetListChanged({
				inserted: {
					startId: wasCount + 1,
					endId: self.getCount(),
					items: result
				}
			});
			self.mIsLoading = false;
			self.mIsAllLoaded = result.length == 0;
		});
	},

	/**
	 * Returns index in playlist by audioId
	 */
	findPositionById: function(audioId) {
		for (var i = 0, l = this.mData.length; i < l; ++i) {
			if (this.mData[i].audioId === audioId) {
				return i;
			};
		};
		return -1;
	},

	/**
	 * Shuffle playlist
	 */
	shuffle: function() {
		var current = this.getCurrent(true).audioId;

		if (this.mIsShuffled) {
			this.mData = this.mDataNormal;
			this.mDataNormal = null;
			return;
		} else {
			var clone = this.mData.slice(0);
			this.mDataNormal = this.mData;
			this.mData = shuffle(clone);
		};

		this.mCurrent = this.findPositionById(current);
		this.mIsShuffled = !this.mIsShuffled;
		this.notifySetListChanged();
	},

	/**
	 * Change listener of event changing list
	 */
	setOnListChangedListener: function(listener) {
		this.mOnListChangedListener = listener;
		return this;
	},

	/**
	 * Set playlist for VKAudio
	 * Do not invoke manually!
	 */
	notifyItemsAboutPlaylist: function() {
		var that = this;
		this.mData.map(function(item) {
			item.mPlaylist = that;
		});
	},

	/**
	 * Invoke when list was changed
	 */
	notifySetListChanged: function(event) {
		this.mOnListChangedListener && this.mOnListChangedListener(event);
	},

	/**
	 * Add audio in begin list
	 */
	addAudio: function(audio) {
		this.mData.unshift(audio);
		~this.mCurrent && this.mCurrent++;
		APINotify.fire(DogEvent.AUDIO_PLAYLIST_CHANGED, { playlist: this, audio: audio });
		this.notifySetListChanged({
			inserted: {
				startId: 1,
				endId: 1,
				items: [audio]
			}
		});
	},

	removeAudio: function(audio) {
		var index = this.findPositionById(audio.audioId);
		this.mData.splice(index, 1);
	}

};

/**
 * Albums of audios in vk
 */
function VKAudioAlbum(a) {
	this.ownerId = a.owner_id;
	this.albumId = a.id || a.album_id;
	this.title = a.title;
};

VKAudioAlbum.prototype = {

	mNode: null,
	mNodeTitle: null,

	getId: function() {
		return this.ownerId + "_" + this.albumId;
	},

	getLink: function() {
		var o = {};
		API.userId != this.ownerId ? (o.ownerId = this.ownerId) : null;
		o.albumId = this.albumId;
		return httpBuildQuery(o);
	},

	getNode: function() {
		if (this.mNode) {
			return this.mNode;
		};

		var e = $.e;

		return this.mNode = e("a", {href: "#audio?" + this.getLink(), "class": "simplelist-item", append: [
			e("div", {"class": "simplelist-actions", append: this.getActions()}),
			e("div", {"class": "simplelist-content", append: [
				this.mNodeTitle = e("strong", {html: this.title.safe()})
			]})
		]});
	},

	getActions: function() {
		var a = [], e = $.e, s = this;
		if (this.ownerId != API.userId) {
			return a;
		};

		a.push(e("div", {
			"class": "audio-i audio-i-edit",
			title: lg("audio.albumTipEdit"),
			onclick: function(event) {
				s.editAlbum(this);
				event.preventDefault();
				return false;
			}
		}));

		a.push(e("div", {
			"class": "audio-i audio-i-delete",
			title: lg("audio.albumTipDelete"),
			onclick: function(event) {
				s.deleteAlbum();
				event.preventDefault();
				return false;
			}
		}));

		return a;
	},

	/**
	 * Open dialog editing album
	 */
	editAlbum: function(fromNode) {
		var album = this;
		new EditWindow({
			lang: true,
			fromNode: fromNode,
			title: "audio.editAlbumWindowTitle",
			isEdit: true,
			items: [
				{
					type: APIDOG_UI_EW_TYPE_ITEM_SIMPLE,
					name: "title",
					title: "audio.editAlbumTitle",
					value: album.title
				}
			],
			onSave: function(values, modal) {
				new APIRequest("audio.editAlbum", values)
					.setParam("ownerId", album.ownerId)
					.setParam("albumId", album.albumId)
					.setOnCompleteListener(function(data) {
						modal.setContent(getEmptyField("audio.editAlbumSuccess", true)).setFooter("").closeAfter(1500);
						album.title = values.title;
						album.notifySetDataChanged();
					})
					.execute();
			}
		});
	},

	/**
	 * Remove album
	 */
	deleteAlbum: function() {
		var self = this;
		new Snackbar({
			text: lg("audio.deleteAlbumDone"),
			duration: 10000,
			onClose: function() {
				new APIRequest("audio.deleteAlbum", {
					ownerId: self.ownerId,
					albumId: self.albumId
				}).setOnCompleteListener(function(result) {
					$.elements.remove(self.mNode);
				}).execute();
			},
			onClick: function(snackbar) {
				snackbar.close();
			},
			action: {
				label: lg("audio.deleteAlbumRestore"),
				onClick: function() {
					$.elements.removeClass(self.mNode, "doc-deleted");
				}
			}
		}).show();
		$.elements.addClass(this.mNode, "doc-deleted");
	},

	notifySetDataChanged: function() {
		this.mNodeTitle.innerHTML = this.title.safe();
	}

};

function VKAudioBroadcast(o) {
	var isUser = o.type === "profile";
	this.audio = new VKAudio(o.status_audio);
	this.id = isUser ? o.id : -o.id;
	this.name = (isUser ? o.first_name + " " + o.last_name : o.name).safe();
	this.photo = o.photo_100;
	this.domain = o.screen_name;
	this.isAdmin = !!o.is_admin;
};

/**
 * TODO: для трансляций в группах, где текущий пользователь есть администратор добавить кнопку в виде
 * крестика для удаления трансляции и удаления из этого списка
 */

VKAudioBroadcast.prototype = {

	mNode: null,

	getId: function() {
		return this.id;
	},

	getNode: function() {
		if (this.mNode) {
			return this.mNode;
		};

		var e = $.e;

		return this.mNode = e("a", {"class": "userlist-item", append: [
			e("img", {"class": "userlist-photo", src: this.photo}),
			e("div", {"class": "userlist-content", append: [
				e("strong", {html: this.name}),
				this.audio.getNode()
			]})
		]});
	}

};



function RadioItem(r) {
	this.stationId = r.stationId;
	this.title = r.title;
	this.cityId = r.cityId;
	this.city = null;
	this.streams = parse(r.streams, RadioStream);
	this.site = r.site;
	this.frequency = r.frequency;
};

RadioItem.prototype.getId = function() {
	return this.stationId;
};

RadioItem.prototype.getCityName = function() {
	return this.city && this.city.title || "";
};

RadioItem.prototype.getFrequency = function() {
	return this.frequency > 0 ? this.frequency.toFixed(1) + " MHz" : "";
};

RadioItem.prototype.getNode = function() {
	var e = $.e;

	return e("div", {
		id: "audio-station" + this.getId(),
		"class": "audio-item",

		append: [
			e("div", {"class": "audio-right", append: [
				e("div", {"class": "audio-times", html: this.getCityName()}),
//				e("div", {"class": "audio-actions", append: this.getActions()})
			]}),
			this.mNodeControl = e("div", {"class": "audio-control audio-i audio-i-play"}),
			e("div", {"class": "audio-content", append: [
				e("div", {"class": "audio-title", append: [
					this.mNodeArtist = e("strong", {html: this.title.safe()}),
					document.createTextNode(" "),
					this.mNodeTitle = e("i", { "class": "audio-radio-frequency", html: this.getFrequency()})
				]})
			]})
		],

		onclick: function(event) {
			if (event.ctrlKey) {
				return self.getCurrentTrack(function(result) {
					/*new Snackbar({
						text: result.isSuccess
							? lg("audio.infoBitrate").schema({
								t: self.artist + " - " + self.title,
								b: result.rate,
								s: result.size.getInformationValue()
							})
							: lg("audio.errorBitrate")
					}).show();*/
				});
			};

			Audios.setPlaylist(self.getPlaylist());

			return $.event.cancel(event);
		}
	});
};

RadioItem.prototype.getPlaylist = function() {
	return new VKPlaylist({ count: 1, items: [this] }, APIDOG_AUDIO_PLAYLIST_RADIO, 0);
};

function RadioStream(s) {
	this.url = s.url;
	this.bitrate = s.bitrate;
	this.format = s.format.toUpperCase();
};

function RadioCity(c) {
	this.cityId = c.cityId;
	this.title = c.title;
};





var
	APIDOG_AUDIO_PLAYLIST_OWNER = "own",
	APIDOG_AUDIO_PLAYLIST_OWNER_ALBUM = "alb",
	APIDOG_AUDIO_PLAYLIST_RECOMMENDATIONS = "rcm",
	APIDOG_AUDIO_PLAYLIST_POPULAR = "ppr",
	APIDOG_AUDIO_PLAYLIST_ATTACHMENT = "atc",
	APIDOG_AUDIO_PLAYLIST_RADIO = "rdo",

	APIDOG_AUDIO_TAB_ALL = "all",
	APIDOG_AUDIO_TAB_TRANSLATIONS = "translations",
	APIDOG_AUDIO_TAB_POPULAR = "popular",
	APIDOG_AUDIO_TAB_RECOMMENDATIONS = "recommendations",
	APIDOG_AUDIO_TAB_ALBUMS = "albums",
	APIDOG_AUDIO_TAB_RADIO = "radio";


var Audios = {

	mActionBlock: null,

	mPlayer1: null,
	mPlayer2: null,

	mGenres: [
		{ generId: 0, title: "---" },
		{ generId: 1, title: "Rock" },
		{ generId: 2, title: "Pop" },
		{ generId: 3, title: "Rap & Hip-Hop" },
		{ generId: 4, title: "Easy Listening" },
		{ generId: 5, title: "Dance & House" },
		{ generId: 6, title: "Instrumental" },
		{ generId: 7, title: "Metal" },
		{ generId: 21, title: "Alternative" },
		{ generId: 8, title: "Dubstep" },
		{ generId: 9, title: "Jazz & Blues" },
		{ generId: 10, title: "Drum & Bass" },
		{ generId: 11, title: "Trance" },
		{ generId: 12, title: "Chanson" },
		{ generId: 13, title: "Ethnic" },
		{ generId: 14, title: "Acoustic & Vocal" },
		{ generId: 15, title: "Reggae" },
		{ generId: 16, title: "Classical" },
		{ generId: 17, title: "Indie Pop" },
		{ generId: 19, title: "Speech" },
		{ generId: 22, title: "Electropop & Disco" },
		{ generId: 18, title: "Other" }
	],

	API: {

		code: {

			getAudios: "var o=parseInt(Args.o),h=parseInt(Args.h),l=parseInt(Args.a),c=parseInt(Args.c);return API.audio.get({owner_id:h,album_id:l,count:c,offset:o,v:5.61,extended:1,fields:\"online,photo_100\"});",

			getAlbums: "var o=Args.o,l=API.audio.getAlbums({owner_id:o,v:5.38,v:5.38}).count,d=[];while(d.length<l){d=d+API.audio.getAlbums({owner_id:o,count:100,offset:d.length}).items;};return{count:l,items:d};",

			getAlbum: "var o=parseInt(Args.o),i=parseInt(Args.i),l=[],a,j=0,n=0,f=false,k=API.audio.getAlbums({owner_id:o,v:5.39}).count;while(l.length<k){l=l+API.audio.getAlbums({owner_id:o,offset:l.length}).items;};while(!f&&n<l.length){if(l[n].id==i){f=true;a=l[n];};n=n+1;};return{audios:API.audio.get({owner_id:o,album_id:i,count:1000,v:5.39}),album:a};",

			getItem: "var o=Args.o,i=Args.i,a=API.audio.getById({audios:o+\"_\"+i})[0],o=a.owner_id;return{a:a,h:o>0?API.users.getById({user_ids:o,fields:\"online\"}):API.groups.getById({group_ids:-o}),l:a.lyrics_id?API.audio.getLyrics({lyrics_id:a.lyrics_id}).text:\"\"};",

			getItemForEdit: "var o=Args.o,i=Args.i,a=API.audio.getById({audios:o+\"_\"+i})[0];return{a:a,l:a.lyrics_id?API.audio.getLyrics({lyrics_id:a.lyrics_id}).text:\"\"};"

		},


		/**
		 * Count of items per page: count of loading elements
		 */
		ITEMS_PER_PAGE: 75,

		invoke: {

			/**
			 * Invoking method for getting list of audios' user or group
			 */
			get: function(ownerId, offset, count, callback) {
				APIRequest
					.createExecute(Audios.API.code.getAudios, { o: offset || 0, h: ownerId, c: count })
					.setOnCompleteListener(callback)
					.execute()
			},

			/**
			 * Invoking method for getting album' user or group
			 */
			getAlbum: function(ownerId, albumId, count, callback) {
				APIRequest
					.createExecute(Audios.API.code.getAlbum, { o: offset || 0, h: ownerId, a: albumId || 0, c: count })
					.setOnCompleteListener(callback)
					.execute()
			},

			/**
			 * Invoking method for getting albums' user or group
			 */
			getAlbums: function(ownerId, callback) {
				APIRequest
					.createExecute(Audios.API.code.getAlbums, { o: ownerId })
					.setOnCompleteListener(callback)
					.execute()
			},

			/**
			 * Invoking method for getting recommendations
			 */
			getRecommendations: function(target, offset, callback) {
				new APIRequest("audio.getRecommendations", {shuffle: 1, count: Audios.API.ITEMS_PER_PAGE, offset: offset || 0, v: 5.39})
					.setParam(typeof target === "string" ? "targetAudio" : "userId", target)
					.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
					.setOnCompleteListener(callback)
					.execute();
			},

			/**
			 * Invoking method for getting popular audios
			 */
			getPopular: function(onlyEng, genreId, offset, callback) {
				new APIRequest("audio.getPopular", {onlyEng: onlyEng, count: Audios.API.ITEMS_PER_PAGE, offset: offset || 0, generId: genreId, v: 5.39})
					.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
					.setOnCompleteListener(callback)
					.execute();
			},

			/**
			 * Invoking method for getting broadcast list of friends and groups
			 */
			getBroadcasts: function(callback) {
				new APIRequest("audio.getBroadcastList", {filter: "all", active: 1, fields: "online,photo_100", v: 5.39})
					.setWrapper(APIDOG_REQUEST_WRAPPER_V5)
					.setOnCompleteListener(function(data) {
						callback(data.map(function(item) {
							return new VKAudioBroadcast(item);
						}));
					})
					.execute();
			},

			getRadio: function(callback) {
				APIdogRequest("vlad805.getRadio", { v: 2.1 }, function(result) {
					callback(result);
				});
			},

			getCurrentBroadcastingTrack: function(stationId, callback) {
				APIdogRequest("vlad805.getCurrentBroadcastingSong", { v: 2.1, stationId: stationId }, function(result) {

				});
			}

		}

	},



	Resolve: function(url) {
		Audios.open();
	},

	Storage: {},
	Data: {},
	Lists: {0: []},
	CurrentList: 0,
	Current: "0_0",
	Settings: 0,
	Albums: {},
	l2l: {},
	l2c: {},
	Texts: {},




	mPlaylists: {},
	mAlbums: {},
	// 23048942: { 123, 124, 125 }

	/**
	 * Check exists of playlist
	 */
	hasPlaylist: function(type, id) {
		return !!Audios.getPlaylist(type, id);
	},

	/**
	 * Add created playlist in local cache
	 */
	addPlaylist: function(type, id, playlist) {
		Audios.mPlaylists[type + id] = playlist;
	},

	/**
	 * Returns playlist from local cache by type and id
	 */
	getPlaylist: function(type, id) {
		return Audios.mPlaylists[type + id];
	},

	/**
	 * Check exists in local cache albums of user or group
	 */
	hasAlbums: function(ownerId) {
		return !!Audios.getAlbums(ownerId);
	},

	/**
	 * Add list of albums of user or group
	 */
	addAlbums: function(ownerId, items) {
		Audios.mAlbums[ownerId] = items;
	},

	/**
	 * Returns albums from local cache
	 */
	getAlbums: function(ownerId) {
		return Audios.mAlbums[ownerId];
	},

	/**
	 * Returns album from local cache
	 */
	getAlbum: function(ownerId, albumId) {
		return Audios.mAlbums[ownerId] && Audios.mAlbums[ownerId][albumId];
	},

	/**
	 * Retruns albums asyncronized: if albums has in local cache, they will be returned in callback, if not, they will
	 * be requested from VK
	 */
	getAlbumsAsync: function(ownerId, callback) {
		var albums;

		if (albums = Audios.getAlbums(ownerId)) {
			return callback(albums);
		};

		Audios.API.invoke.getAlbums(ownerId, function(result) {
			albums = new VKList(result, VKAudioAlbum);
			Audios.addAlbums(ownerId, albums);
			callback(albums);
		});
	},

	/**
	 * Retruns album asyncronized: if album has in local cache, it will be returned in callback, if not, it will be
	 * requested from VK
	 */
	getAlbumAsync: function(ownerId, albumId, callback) {
		var album;

		if (album = Audios.getAlbum(ownerId, albumId)) {
			return callback(album);
		};

		Audios.API.invoke.get(ownerId, audioId, 1000, function(result) {
			Audios.addAlbum(result.album);
			callback(new VKPlaylist(albums, APIDOG_AUDIO_PLAYLIST_OWNER_ALBUM, ownerId + "_" + albumId));
		});
	},


	open: function() {
		var act = Site.get(APIDOG_CONST_ACT),
			ownerId = parseInt(Site.get(APIDOG_CONST_OWNER_ID) || API.userId);

		Audios.showPage(ownerId, act);

		switch (act) {

			case APIDOG_AUDIO_TAB_TRANSLATIONS:
				Audios.API.invoke.getBroadcasts(function(data) {
					Audios.showCustomList(APIDOG_AUDIO_TAB_TRANSLATIONS, {

						title: lg("audio.translationsTitle"),

						getItems: function() {
							return data;
						}

					});
				});
				break;

			case APIDOG_AUDIO_TAB_POPULAR:
				var foreign = Site.get(APIDOG_CONST_FOREIGN) || 0, genreId = parseInt(Site.get(APIDOG_CONST_GENRE_ID)) || 0;
				Audios.API.invoke.getPopular(foreign, genreId, 0, function(result) {
					result = { count: 150, items: result };
					var id = foreign + "," + genreId,
						playlist = new VKPlaylist(result, APIDOG_AUDIO_PLAYLIST_POPULAR, id);
					Audios.addPlaylist(APIDOG_AUDIO_PLAYLIST_POPULAR, id, playlist);
					Audios.showList(playlist);
				});
				break;

			case APIDOG_AUDIO_TAB_RECOMMENDATIONS:
				var target = Site.get(APIDOG_CONST_TARGET) || ownerId;
				Audios.API.invoke.getRecommendations(target, 0, function(result) {
					var playlist = new VKPlaylist(result, APIDOG_AUDIO_PLAYLIST_RECOMMENDATIONS, target);
					Audios.addPlaylist(APIDOG_AUDIO_PLAYLIST_RECOMMENDATIONS, target, playlist);
					Audios.showList(playlist);
				});
				break;

			case APIDOG_AUDIO_TAB_ALBUMS:
				Audios.getAlbumsAsync(ownerId, function(data) {

					console.log(data);

					Audios.showCustomList(APIDOG_AUDIO_TAB_ALBUMS, {

						title: lg("audio.albumsListTitle"),

						getItems: function() {
							return data.getItems();
						}

					});
				});
				break;

			case APIDOG_AUDIO_TAB_RADIO:
				Audios.API.invoke.getRadio(function(result) {
					console.log(result);
					Audios.saveRadio(result);
					Audios.showRadio();
				});
				break;

			case APIDOG_AUDIO_TAB_ALL:
			default:

				if (Audios.hasPlaylist(APIDOG_AUDIO_PLAYLIST_OWNER, ownerId)) {
					return Audios.showList(Audios.getPlaylist(APIDOG_AUDIO_PLAYLIST_OWNER, ownerId));
				};

				Audios.API.invoke.get(ownerId, 0, 150, function(result) {
					Local.add(result.profiles, result.groups);
					var playlist = new VKPlaylist(result, APIDOG_AUDIO_PLAYLIST_OWNER, ownerId);
					Audios.addPlaylist(APIDOG_AUDIO_PLAYLIST_OWNER, ownerId, playlist);
					Audios.showList(playlist);
				});
		}
	},

	mTabs: null,
	mNodeList: null,
	mNodeHeadCount: null,

	showPage: function(ownerId, tab) {
		if (this.mTabs) {
			$.elements.clearChild(Audios.mNodeList);
			Audios.mSearchLine.setVisibility(Audios.needSearchLine(tab));
			return this.mTabs;
		};

		var e = $.e,

			tabFake = e("div"),


			list = e("div"),

			items = (function(isOwner, tabs) {
				tabs.push({ name: APIDOG_AUDIO_TAB_ALL, title: lg("audio.tabAll"), content: tabFake });
				if (isOwner) {
					tabs.push({ name: APIDOG_AUDIO_TAB_TRANSLATIONS, title: lg("audio.tabTranslations"), content: tabFake });
					tabs.push({ name: APIDOG_AUDIO_TAB_POPULAR, title: lg("audio.tabPopular"), content: tabFake });
				};
				tabs.push({ name: APIDOG_AUDIO_TAB_RECOMMENDATIONS, title: lg("audio.tabRecommendations"), content: tabFake });
				tabs.push({ name: APIDOG_AUDIO_TAB_ALBUMS, title: lg("audio.tabAlbums"), content: tabFake });
				if (isOwner) {
					tabs.push({ name: APIDOG_AUDIO_TAB_RADIO, title: lg("audio.tabRadio"), content: tabFake });
				}
				return tabs;
			})(ownerId == API.userId, []),

			tabs = new TabHost(items, {
				onOpenedTabChanged: function(event) {
					window.location.hash = "#audio" + (ownerId == API.userId ? "?ownerId=" + ownerId + "&" : "?") + "act=" + event.opened.getName();
				}
			}),

			head = Site.getPageHeader("<span id=audio-count>0</span>"),

			search = new SearchLine({
				onsubmit: Audios.onSearch,
				onkeyup: Audios.onSearch,
				placeholder: lg("audio.search")
			});

			wrap = e("div", {append: [
				head,
				ownerId == API.userId ? search.getNode() : null,
				tabs.getNode(),
				list
			]});


		Audios.mTabs = tabs;
		Audios.mNodeHeadCount = head.querySelector("#audio-count");
		Audios.mSearchLine = search;
		Audios.mNodeList = list;

		Audios.mSearchLine.setVisibility(Audios.needSearchLine(tab));

		Site.append(wrap);
		return wrap;
	},

	needSearchLine: function(tab) {
		return tab == APIDOG_AUDIO_TAB_ALL;
	},

	onSearch: function(event) {
		console.log(event);
	},

	// 01/03/2016 created
	showList: function(playlist) {

		Audios.mNodeHeadCount.innerHTML = playlist.getRealCount() + " " + lg("audio.audios", playlist.getCount());

		var time = 0, step = Audios.API.ITEMS_PER_PAGE, nList = this.mNodeList;

		Audios.fillList(nList, playlist, 0, step);

		playlist.setOnListChangedListener(function(event) {
			Audios.fillList(nList, playlist, event.inserted.startId, event.inserted.endId);
		});

		Audios.preloadList(playlist);


		window.onScrollCallback = function(event) {
			if (!event.needLoading || window.audioLoadingState) {
				return;
			};

			Audios.fillList(nList, playlist, ++time * step, step);
		};


     	return;
	},

	showCustomList: function(type, adapter) {
		adapter = adapter || {};

		Audios.mNodeHeadCount.innerHTML = adapter.title;

		var nList = this.mNodeList;

		adapter.getItems().forEach(function(item) {
			console.log(item);
			var node = item.getNode();
			nList.appendChild(node);
		});
	},

	preloadList: function(playlist) {
		playlist.preload(function(onResult) {
			switch (playlist.getType()) {

				case APIDOG_AUDIO_PLAYLIST_RECOMMENDATIONS:
					Audios.API.invoke.getRecommendations(playlist.getId(), playlist.getCount(), onResult);
					break;

				case APIDOG_AUDIO_PLAYLIST_POPULAR:
					var s = playlist.getId().split(",");
					Audios.API.invoke.getPopular(s[0], s[1], playlist.getCount(), 75, onResult);
					break;

				default:
					Audios.API.invoke.get(playlist.getId(), playlist.getCount(), 75, onResult);
			};
		});
	},


	fillList: function(node, playlist, start, step) {
		var item;
		for (var i = start, l = Math.min(start + step, playlist.getCount()); i < l; ++i) {
			if (item = playlist.get(i)) {
				node.appendChild(item.getNode());
			};
		};

		if (playlist.getCount() != playlist.getRealCount()) {

			Audios.preloadList(playlist);

		};

		return node;
	},
























	createList: function(data) {
		var lid = Math.floor(+new Date() / 10);
		if (!$.isArray(data))
			data = [data];
		for (var i = 0; i < data.length; ++i) {
			Audios.Data[data[i].owner_id + "_" + (data[i].aid || data[i].id)] = data[i];
		};
		Audios.Lists[lid] = data;
		return {lid: lid, list: data};
	},
	Item: function(c, opts) {
		var item = document.createElement("div"),
			_id = c.owner_id + "_" + (c.aid || c.id),
			controls = [];
		opts = opts || {};
		item.className = "audio-item" + (Audios.Current == _id ? " audio-playing" : "") + (opts && (opts.set & 32) ? " audio-itemNoHover" : "") + (Audios._Uploaded && Audios._Uploaded == _id ? " docs-saved" : "");
		item.id = "audio" + _id;
		if (Audios._Uploaded && Audios._Uploaded == _id)
			Audios._Uploaded = null;

		var to = Site.get("to");

		$.event.add(item, "click", (opts && !opts.addToAttachments ? (function(oid, aid, lid, noSelect) {
			return function(event) {
				if (to && window.location.hash.indexOf("im") < 0)
					return $.event.cancel(event);
				if (event.ctrlKey)
				{
					return Audios.getBitrate(_id);
				};
				Audios.CurrentList = lid;
				Audios.Play({
					oid: oid,
					aid: aid,
					settings: 2
				});
				return $.event.cancel(event);
			};
		}) (c.owner_id, (c.aid || c.id), opts && opts.lid ? opts.lid : 0) : (function(oid, aid) {
			return function(event) {
				try{
				SelectAttachments.AddAttachment({type: "audio", id: "audio" + oid + "_" + aid});
				SelectAttachments.RemoveSelector();
				}catch(e){} // временняк до v6.3
							// бля, ты шутишь что ли? xD уже v6.4, эта хуйня всё еще здесь
			};
		})(c.owner_id, (c.aid || c.id))));
		if (opts && opts.removeBroadcast)
			controls.push($.elements.create("div", {
				"class": "audio-delete",
				onclick: (function(id) {return function(event) {
					Audios.setBroadcast("");
					Audios.Player.TriggerBroadcast($.element("repeat-audio"), 1);
					var parent = this.parentNode.parentNode.parentNode;
					Site.API("status.get", {
						user_id: id
					}, function(data) {
						var status = Site.isResponse(data).text;
						parent.parentNode.appendChild($.elements.create("div", {"class": "profile-status" + (!status ? " tip" : ""),onclick: function(event) {Profile.EditStatus(this);},html: (status || "изменить статус")}));
						$.elements.remove(parent);
					});
					$.event.cancel(event);
				}})(opts.uid)
			}))
		controls.push($.elements.create("div", {
			"class": "audio-sprite audio-goto",
			onclick: (function(oid, aid) {
				return function(event) {
					//window.location.hash = "#audio?act=item&ownerId=" + c.owner_id + "&audioId=" + (c.aid || c.id);
					$.event.cancel(event);

					Audios.showModalInfoItem(c.owner_id, c.aid || c.id);

				};
			})(c.owner_id, (c.aid || c.id))
		}));
		if (opts && opts.add)
			controls.push($.elements.create("div", {
				"class": "audio-add audio-sprite fr",
				onclick: (function(oid, aid) {
					return function(event) {
						$.event.cancel(event);
						Audios.Add(oid, aid, 1);
						return;
					}
				})(c.owner_id, (c.aid || c.id))
			}));
		item.appendChild($.e("div", {
			"class": "fr",
			append: [
				$.e("div", {"class": "tip audio-item-played", html: "00:00"}),
				$.e("div", {"class": "tip audio-item-real", html: $.toTime(c.duration)}),
				$.e("div", {"class": "audio-control fr", append: controls})
			]
		}));
		item.appendChild($.elements.create("div", {"class": "audio-item-control audio-sprite"}));
		item.appendChild($.elements.create("div", {"class": "audio-item-title", title: (Site.Escape(c.artist) + " — " + Site.Escape(c.title)).replace(/&amp;/ig, "&"), append: [
			$.elements.create("strong", {html: Site.Escape(c.artist).replace(/&amp;/img, "&")}),
			document.createTextNode(" — "),
			$.elements.create("span", {html: Site.Escape(c.title).replace(/&amp;/img, "&")})
		]}));

		if (to && window.location.hash.indexOf("im") < 0) {
			$.event.add(item, "click", function(event) {
				$.event.cancel(event);

				if (IM.attachs[to])
					IM.attachs[to].push(["audio", c.owner_id, (c.aid || c.id)]);
				else
					IM.attachs[to] = [["audio", c.owner_id, (c.aid || c.id)]];
				window.location.hash = "#im?to=" + to;

				return false;
			});
		}

		return item;
	},



	timeline: null,
	volumeline: null,
	setVolumeState: function(volume)
	{
		Audios.volumeline.setValue(volume);
		Audios.getPlayer().volume = volume / 100;
		$.localStorage("audio-vol", volume);
	},
	getPlayer: function() {return $.element("Player"); },

	isPlaying: function() {
		return !Audios.getPlayer().paused;
	},

	Player: {
		InitEvents: function(player) {
			var /*timelineNode = $.element("head-player-timeline"),
				timelineInput = $.element("head-player-timeline-input"),
				timelineGhost = $.element("head-player-timeline-ghost"),
				timelineBuffer*/

				volumelineNode = $.element("head-player-volume"),
				volumelineInput = $.element("head-player-volume-input"),
				volumelineGhost = $.element("head-player-volume-ghost");

//			Audios.timeline = new Slider(timelineNode, timelineInput);
			Audios.volumeline = new Slider(volumelineNode, volumelineInput);

			Audios.volumeline.setMinimum(0);
			Audios.volumeline.setMaximum(100);

/*			Audios.timeline.onchange = function(byUser)
			{
				var t = Audios.timeline.getValue();
console.log(byUser);
				if (!Audios.Current || t === 0) return;
				if (byUser)
				{
					player.currentTime = t;
				};
				timelineGhost.style.width = Audios.timeline.handle.style.left;
			};
*/
			Audios.volumeline.onchange = function(event)
			{
				var n = Audios.volumeline.getValue();
				Audios.setVolumeState(n);
				volumelineGhost.style.width = Audios.volumeline.handle.style.left;
			};

			$.event.add(window, "resize", function(event)
			{
//				Audios.timeline.recalculate();
				Audios.volumeline.recalculate();
			});

			$.event.add(player, "timeupdate", function(event) {
				var played = this.currentTime,
					duration = this.duration,
					persent = (100 * played) / duration,
					playedString = $.toTime(!(Audios.Settings & 1024) ? played : duration - played);
//				Audios.timeline.setValue(played);
				$.element("player-playedtime").innerHTML = playedString;
				$.element("head-player-line-played").style.width = persent + "%";
				try {
					$.elem(".audio-playing .audio-item-played")[0].innerHTML = playedString;
					$.elem(".audio-playing .audio-item-real")[0].innerHTML = $.toTime(duration);
				} catch (e) {}
			});
			$.event.add(player, "progress", function(event)
			{
				try
				{
					var buffers = this.buffered,
						progress = $.element("head-player-line-loaded"),
						progresses = progress.children,
						duration = this.duration;
					if (buffers.length < progresses.length)
					{
						$.elements.clearChild(progress);
					};
					for (var i = 0, l = buffers.length; i < l; ++i)
					{
						var loaded = [buffers.start(i), buffers.end(i)],
							left = (100 * loaded[0]) / duration,
							width = (100 * loaded[1]) / duration;
						if (progresses[i])
						{
							progresses[i].style.left = left + "%";
							progresses[i].style.width = (width - left) + "%";
						}
						else
						{
							var item = $.e("div", {"class": "head-player-line-loaded"});
							item.style.left = left + "%";
							item.style.width = (width - left) + "%";
							progress.appendChild(item);
						};
					};
				}
				catch (e)
				{
					console.error(e);
				};
			});
			$.event.add(player, "loadedmetadata", function(event)
			{
				try
				{
					$.elem(".audio-playing .audio-item-real").innerHTML = $.toTime(this.duration);
				}
				catch (e)
				{}
			});
			$.event.add($.element("head-player-line-wrap"), "click", function(event) {
				var pos = $.getPosition($.element("head-player-line")),
					left = event.target == $.element("head-player-line") ? event.layerX : $.getPosition(event.target).left + event.layerX - pos.left,
					time = (((left * 100) / pos.width) / 100) * player.duration;
				player.currentTime = time;
				$.event.cancel(event);
			});
			$.event.add(player, "ended", function(event) {
				if (Audios.Settings & 32) {
					var current = Audios.Current.split("_");
					Audios.Play({
						oid: current[0],
						aid: current[1]
					});
					if ((Audios.Settings & 16) == 16)
						Audios.setBroadcast(Audios.Current);
				} else
					Audios.Next();
			});
			$.elements.addClass(player, "sys-audio-inited");
		},
		Play: function() {
			$.element("Player").play();
			var btn = $.elem(".audio-playing .audio-item-control")[0];
			$.elements.removeClass(btn, "player-play");
			$.elements.addClass(btn, "player-pause");
			$.elements.addClass($.element("headplayer-play"), "hidden");
			$.elements.removeClass($.element("headplayer-pause"), "hidden");
		},
		Pause: function() {
			$.element("Player").pause();
			var btn = $.elem(".audio-playing .audio-item-control")[0];
			$.elements.addClass(btn, "player-play");
			$.elements.removeClass(btn, "player-pause");
			$.elements.removeClass($.element("headplayer-play"), "hidden");
			$.elements.addClass($.element("headplayer-pause"), "hidden");
		},
		Trigger: function() {
			if ($.element("Player").paused)
				Audios.Player.Play();
			else
				Audios.Player.Pause();
		},
		TriggerBroadcast: function(button, state) {
			var bit = !!(Audios.Settings & 16);
			if (bit || state) {
				$.elements.removeClass(button, "live-audio-on");
				Audios.Settings -= 16;
				Audios.setBroadcast("");
			} else {
				$.elements.addClass(button, "live-audio-on");
				Audios.Settings += 16;
				Audios.setBroadcast(Audios.Current);
			}
			$.localStorage("audio-settings", Audios.Settings);
		},
		TriggerRepeat: function(button) {
			var bit = !!(Audios.Settings & 32);
			if (bit) {
				$.elements.removeClass(button, "repeat-audio-on");
				Audios.Settings -= 32;
			} else {
				$.elements.addClass(button, "repeat-audio-on");
				Audios.Settings += 32;
			}
			$.localStorage("audio-settings", Audios.Settings);
		},
		TriggerPlayList: function(button) {
			var condition = !$.elements.hasClass($.element("audioplaylist"), "hidden")
			if (condition) {
				$.elements.removeClass(button, "text-audio-on");
				//$.elements.removeClass($.element("content"), "hidden");
				$.elements.addClass($.element("audioplaylist"), "hidden");
			} else {
				var list = $.element("audioplaylist-list");
				if (list.length != Audios.Lists[Audios.CurrentList].length)
					Audios.UpdateList(Audios.Lists[Audios.CurrentList], Audios.CurrentList, list);
				$.elements.addClass(button, "text-audio-on");
				//$.elements.addClass($.element("content"), "hidden");
				$.elements.removeClass($.element("audioplaylist"), "hidden");
			}
		},
		Add: function(button) {
			if (!Audios.Current || Audios.Data[Audios.Current].added)
				return;
			var current = Audios.Current.split("_");
			Site.API("audio.add", {
				owner_id: current[0],
				audio_id: current[1]
			}, function(data) {
				data = Site.isResponse(data);
				if (data) {
					Audios.Data[Audios.Current].added = true;
					$.elements.addClass($.elem(".add-audio")[0], "add-audio-on");
					Site.Alert({
						text:"Аудиозапись &laquo;" + Audios.Data[Audios.Current].artist + " &mdash; " + Audios.Data[Audios.Current].title + "&raquo; успешно добавлена в Ваши аудиозаписи"
					});
					try {
						$.elements.addClass($.elem("#audio" + Audios.Current + " .audio-add")[0], "audio-added");
					} catch (e) {}
				};
			})
		},
		Share: function(button) {
			window.location.hash = "#mail?attach=audio" + Audios.Current;
		}
	},
	setVolume: function(node, event) {
		console.log(node, event);
		var pos = $.getPosition(node),
			left = (event.layerX > 0 ? event.layerX : event.offsetX) + 5,
			val = left * 100 / pos.width;
		Audios.setVol(val);
		$.event.cancel(event);
	},
	setVol: function(val) {},
	Play: function(object) {
		if (!$.element("Player").canPlayType("audio/mpeg")) {
			alert("Ваш браузер не поддерживает воспроизведение MP3 файлов!");
			return;
		};
		var vol = $.localStorage("audio-vol");
		if (vol === null || vol === undefined || vol === "null")
		{
			vol = 100;
		};
		Audios.MiniPlayer.Show();
		var AudioID = object.oid + "_" + object.aid,
			AudioPlayer = $.element("Player"),
			AudioObject = Audios.Data[AudioID];
		if (!$.elements.hasClass(AudioPlayer, "sys-audio-inited"))
			Audios.Player.InitEvents(AudioPlayer);
		Audios.reinitIcons(); // было внизу
		if (!AudioObject.url) {
			return Site.Alert({text: "Аудиозапись изъята из публичного доступа."});
		};
//		Audios.timeline.setMaximum(AudioObject.duration);
		Audios.setVolumeState(vol);
		if (AudioID != Audios.Current) {
			Audios.Current = AudioID;
			AudioPlayer.src = getURL(AudioObject.url, "mp3");
			AudioPlayer.load();
			Audios.Player.Play();
			var title = "<strong>" + Site.Escape(AudioObject.artist).replace(/&amp;/g, "&") + "</strong> &mdash; " + Site.Escape(AudioObject.title).replace(/&amp;/g, "&");
			$.element("headplayer-titleNormal").firstChild.innerHTML = title;
			$.element("headplayer-titleMini").firstChild.innerHTML = title;
			$.elements.removeClass($.elem(".add-audio")[0], "add-audio-on");
			var previous = $.elem(".audio-playing");
			for (var i = 0; i < previous.length; ++i)
				$.elements.removeClass(previous[i], "audio-playing");
			var previous = $.elem(".player-pause");
			for (var i = 0; i < previous.length; ++i)
				$.elements.removeClass(previous[i], "player-pause");
			$.elements.addClass($.element("audio" + AudioID), "audio-playing");
			if (Audios.Settings & 16)
				Audios.setBroadcast(AudioID);
			if (AudioObject.owner_id != API.userId)
				$.elements.removeClass($.element("add-audio"), "hidden");
			else
				$.elements.addClass($.element("add-audio"), "hidden");
		} else
			Audios.Player.Trigger();
	},
	setBroadcast: function(audio_id) {
		Site.API("audio.setBroadcast", {audio: audio_id}, "blank");
	},
	getCurrentPositionInList: function() {
		var list = Audios.Lists[Audios.CurrentList];
		for (var i = 0; i < list.length; ++i)
			if (list[i] == Audios.Current)
				return {position: i, previous: (typeof list[i - 1] != "undefined"), next: (typeof list[i + 1] != "undefined")};
		return {position: -1, previous: false, next: false};
	},
	toObject: function(str) {
		str = str.split("_");
		return {oid: str[0], aid: str[1]};
	},
	Previous: function() {
		var i = Audios.getCurrentPositionInList(), l = Audios.Lists[Audios.CurrentList], u;
		u = i.previous ? l[i.position - 1] : l[l.length - 1];
		Audios.Play(Audios.toObject(u));
	},
	Next: function() {
		try {
			var i = Audios.getCurrentPositionInList(), l = Audios.Lists[Audios.CurrentList], u;
			u = i.next ? l[i.position + 1] : l.length > 1 ? l[0] : false;
			if (u !== false)
				Audios.Play(Audios.toObject(u));
		} catch (e) {} // заглушка до v6.4
	},
	ReCountTime: function() {
		var elem = $.element("Player");
		$.element("player-playedtime").innerHTML = ((Audios.Settings & 1024) == 0) ? $.toTime(elem.currentTime) : "-" + $.toTime(elem.duration - elem.currentTime);
	},
	UpdateList: function(list, lid, node) {
		for (var i = 0; i < list.length; ++i)
			node.appendChild(Audios.Item(Audios.Data[list[i]], {
				from: 32,
				lid: lid
			}));
	},
	reinitIcons: function() {
		var isRadio = Audios.getRadioCurrent(),
			a = "addClass",
			r = "removeClass",
			e = $.element,
			h = "hidden";
		console.log(isRadio);
		$.elements[!isRadio ? r : a](e("live-audio"), h);
		$.elements[!isRadio ? r : a](e("repeat-audio"), h);
		$.elements[!isRadio ? r : a](e("share-audio"), h);
		$.elements[isRadio ? r : a](e("find-audio"), h);
	},
	MiniPlayer: {
		Hide: function(event) {
			var e = $.element;
			$.elements.addClass(e("headplayer"), "hidden");
			$.elements.removeClass(e("miniplayer"), "hidden");
			return $.event.cancel(event);
		},
		Show: function(event) {
			var e = $.element;
			$.elements.removeClass(e("headplayer"), "hidden");
			$.elements.addClass(e("miniplayer"), "hidden");
			$.elements.removeClass(e("headplayer-titleMini"), "hidden");
			return $.event.cancel(event);
		},
		ChangeFormatTime: function(event) {
			Audios.Settings = ((Audios.Settings & 1024) != 0) ? Audios.Settings - 1024 : Audios.Settings + 1024;
			Audios.ReCountTime();
			return $.event.cancel(event);
		}
	},
	lastSearched: ["",0,0],
	showSerachPage: function() {
		var e = $.e,
			to = Site.get("to"),
			parent = e("div", {append: [
				Site.CreateHeader("Поиск"),
				Audios.getRightPanel(),
				form = Site.CreateInlineForm({
					type: "search",
					name: "q",
					value: Site.get("q") || Audios.lastSearched[0] || "",
					placeholder: "Поиск..",
					title: "Поиск",
					onsubmit: function(event) {
						var query = $.trim(this.q.value),
							performer = !!this.performer.checked,
							lyrics = !!this.lyrics.checked;
						Audios.lastSearched = [query, performer, lyrics];
						Audios.doSearch(query, performer, lyrics, 0, list);
						return false;
					}
				}),
				list = e("div", {id: "audio-search-list"})
			]});
		form.appendChild(e("div", {"class": "sf-wrap", append: [
			e("label", {
				append: [
					e("input", {type: "checkbox", name: "performer"}),
					e("span", {html: " только по исполнителям"})
				]
			}),
			e("label", {
				append: [
					e("input", {type: "checkbox", name: "lyrics"}),
					e("span", {html: " только с текстом"})
				]
			})]
		}));
		form.id = "audio-search";
		Site.Append(parent);
		Site.SetHeader("Поиск аудиозаписей");
		var q;
		if (Audios.lastSearched[0] && (q = Audios.lastSearched))
			Audios.doSearch(q[0], q[1], q[2], 0, list);
	},
	doSearch: function(query, onlyPerformer, onlyWithLyrics, offset, list) {
		Site.API("audio.search", {
			q: query,
			performer_only: +onlyPerformer,
			lyrics: +onlyWithLyrics,
			auto_complete: 1,
			count: 40,
			offset: Site.get("offset")
		}, function(data) {
			data = Site.isResponse(data);
			var lid = +new Date(),
				wrap = $.e("div"),
				id,
				item,
				count = data[0];
			Audios.Lists[lid] = [];
			for (var i = 1; i < data.length; ++i) {
				item = data[i];
				id = item.owner_id + "_" + (item.aid || item.id);
				wrap.appendChild(Audios.Item(item, {lid: lid, from: 64, add: true}));
				Audios.Lists[lid].push(id);
				Audios.Data[id] = item;
			};
			wrap.appendChild(Site.PagebarV2(Site.get("offset"), count > 1000 ? 1000 : count, 40));
			list = list || $.element("audio-search-list");
			$.elements.clearChild(list);
			list.appendChild(wrap);
		});
	},
	getFriendsBroadcast: function() {
		Site.API("audio.getBroadcastList", {
			filter: "all",
			active: 1,
			fields: "online,photo_rec,screen_name"
		}, function(data) {
			data = Site.isResponse(data);
			Local.AddUsers(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				item = function(c) {
					var lid = (+new Date());
					Audios.Lists[lid] = [c.status_audio];
					Audios.Data[c.status_audio.owner_id + "_" + c.status_audio.aid] = c.status_audio;
					return $.elements.create("div", {"class": "friends-item", append: [
						$.elements.create("img", {src: getURL(c.photo_rec || c.photo || c.photo_50), "class": "friends-left"}),
						$.elements.create("div", {"class": "friends-right", append: [
							$.elements.create("a", {href: "#" + c.screen_name, append: [
								$.elements.create("strong", {html: (c.type == "profile" ? c.first_name + " " + c.last_name + Site.isOnline(c) : c.name)}),
								Audios.Item(c.status_audio, {lid: lid, set: 32})
							]})
						]})
					]})
				};
			list.id = "audiolist";
			if (data.length)
				for (var i = 0; i < data.length; ++i)
					list.appendChild(item(data[i]));
			else
				list.appendChild(Site.EmptyField("В данный момент никто не транслирует аудиозаписи"));
			parent.appendChild(Site.CreateHeader("Трансляции"));
			parent.appendChild(Audios.getRightPanel());
			parent.appendChild(list);
			Site.Append(parent);
			Site.SetHeader("Трансляции друзей");
		})
	},
	getPopular: function(offset) {
		offset = +offset || 0;
		Site.API("audio.getPopular", {
			count: 50,
			offset: offset,
			genre_id: Site.get("genreId")
		}, function(data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				lid = (+new Date()), gnr;
			Audios.Lists[lid] = Audios.getStringListFromArrayList(data);
			list.id = "audiolist";
			for (var i = 0; i < data.length; ++i) {
				list.appendChild(Audios.Item(data[i], {
					lid: lid,
					from: 64,
					add: true
				}));
				Audios.Data[data[i].owner_id + "_" + (data[i].aid || data[i].id)] = data[i];
			};
			list.appendChild(Site.getPagination({offset: offset, count: 1000, step: 50, callback: function(event) {
				window.scrollTo(0, 0); // top
				Audios.getPopular(event.offset);
			}}));
			parent.appendChild(Site.CreateHeader("Популярные аудиозаписи", gnr = $.e("select", {"class": "fr", append: Audios.getGenreNodeArray(), onchange: function(event) {
				window.location.hash = "#audio?act=popular&genreId=" + this.options[this.selectedIndex].value;
			}})));
			gnr.selectedIndex = (function(a,b,c,d){for(d=a.length;++c<d;)if(a[c][0]==b)return c})(Audios.genres, Site.get("genreId"), -1);
			parent.appendChild(Audios.getRightPanel());
			//parent.appendChild($.e("div", {"class": "sf-wrap", append: }));
			parent.appendChild(list);
			Site.Append(parent);
			Site.SetHeader("Популярное");
		})
	},
	getStringListFromArrayList: function(data) {
		var d = [];
		for (var i = 0, l = data.length; i < l; ++i)
			d.push(data[i].owner_id + "_" + (data[i].id || data[i].aid));
		return d;
	},
	getRecommendations: function(offset) {
		var offset = +offset || 0;
		Site.API("execute", {
			code: 'return API.audio.getRecommendations({count:50,offset:%o,user_id:%u,v:5.9});'
					.replace(/%o/i, offset)
					.replace(/%u/i, Site.get("oid"))
		}, function(data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				count = data.count,
				lid = (+new Date());
			data = data.items;
			Audios.Lists[lid] = Audios.getStringListFromArrayList(data);
			list.id = "audiolist";
			for (var i = 0; i < data.length; ++i) {
				list.appendChild(Audios.Item(data[i], {
					lid: lid,
					from: 64,
					add: true
				}));
				Audios.Data[data[i].owner_id + "_" + (data[i].aid || data[i].id)] = data[i];
				//Audios.Lists[lid].push(data[i]);
			}
			parent.appendChild(Site.CreateHeader("Рекомендованные аудиозаписи"));
			parent.appendChild(Audios.getRightPanel());
			parent.appendChild(list);
			list.appendChild(Site.getPagination({offset: offset, count: count, step: 50, callback: function(event) {
				window.scrollTo(0, 0); // top
				Audios.getRecommendations(event.offset);
			}}));
			Site.Append(parent);
			Site.SetHeader("Рекомендации");
		})
	},
	l2a: {},
	getAlbumsOld: function(owner_id) {
		owner_id = owner_id || API.userId;
		if (!Audios.Albums[owner_id] && !Audios.l2a[owner_id])
			return Site.API("audio.getAlbums", {
				count: 75,
				owner_id: owner_id
			}, function(data) {
				data = Site.isResponse(data);
				Audios.Save([{type: 2, data: data}]);
				Audios.getAlbums(owner_id);
				Audios.l2a[owner_id] = true;
			});
		var parent = document.createElement("div"),
			list = document.createElement("div"),
			albums = Audios.Albums[owner_id];
		if (owner_id == API.userId || Local.Users[owner_id] && Local.Users[owner_id].is_admin)
			list.appendChild($.elements.create("a", {
				"class": "list-item",
				href: "#audio?act=albums&action=create",
				html: "<i class='list-icon list-icon-add'></i> Создать альбом"
			}));
		var to = Photos.getToParam(1);
		if (albums)
			for (var i = 0; i < albums.length; ++i) {
				var album = Audios.Albums[owner_id + "_" + albums[i]];
				list.appendChild($.elements.create("a", {
					"class": "list-item",
					href: "#audio?oid=" + album.owner_id + "&album=" + album.album_id + to,
					html: Site.Escape(album.title)
				}));
			}
		else
			list.appendChild(Site.EmptyField("Альбомов нет"));
		list.id = "audiolist";
		parent.appendChild(Site.CreateHeader("Альбомы"));
		parent.appendChild(Audios.getRightPanel());
		parent.appendChild(list);
		Site.Append(parent);
		Site.SetHeader("Альбомы");
	},
	createAlbum: function(oid) {
		oid = oid || API.userId;
		var Form = document.createElement("form"),
			page = document.createElement("div");
		Form.onsubmit = function(event) {
			var e = this,
				title = e.title.value,
				oid = e.owner_id.value;
			if (!$.trim(title)) {
				Site.Alert({text: "Поле \"название\" не может быть пустым!"});
				return false;
			}
			if (!(oid == API.userId || oid < 0)) {
				Site.Alert({text: "Вы не можете здесь создавать альбом!"});
				return false;
			}
			Site.API("audio.addAlbum", {
				group_id: (oid < 0 ? -oid : ""),
				title: title
			}, function(data) {
				data = Site.isResponse(data);
				if (data && data.album_id) {
					Site.Alert({text: "Альбом успешно создан!"});
					window.location.hash = "#audio?oid=" + oid + "&album=" + data.album_id;
				} else
					Site.Alert({text: "Ошибка!<br>" + data.error.error_msg})
			});
			return false;
		};
		Form.appendChild(Site.CreateHeader("Создание аудиоальбома", '<a href="#audio' + (oid != API.userId && oid < 0 ? '?oid=' + oid : '') + '">Назад<\/a>'));
		page.className = "sf-wrap";
		page.appendChild($.elements.create("div", {"class": "tip tip-form", html: "Название альбома"}));
		page.appendChild($.elements.create("input", {type:"text", name: "title", required: true}));
		page.appendChild($.elements.create("input", {type:"hidden", name: "owner_id", value: oid}));
		page.appendChild($.elements.create("input", {type:"submit", value: "Создать"}));
		Form.appendChild(page);
		Site.Append(Form);
	},
	editAlbum: function(oid, aid) {
		var title = Audios.Albums[oid + "_" + aid] && Audios.Albums[oid + "_" + aid].title;
		var parent = document.createElement("div"),
			Form = Site.CreateInlineForm({type: "text", name: "title", value: title, title: "Сохранить"});
		Form.onsubmit = function(event) {
			if (!$.trim(this.title.value)) {
				Site.Alert({text: "Пустое поле!"});
				return false;
			}
			var o = [oid, aid],
				title = $.trim(this.title.value);
			Site.API("audio.editAlbum", {
				owner_id: oid,
				album_id: aid,
				title: title
			}, function(data) {
				if (data.response && data.response == 1) {
					Site.Alert({text: "Альбом успешно отредактирован!"});
					Audios.Albums[o[0] + "_" + o[1]].title = title;
					window.location.hash = "#audio?oid=" + o[0] + "&album=" + o[1];
				}
			});
			return false;
		};
		Form.appendChild($.elements.create("input", {type: "hidden", name: "owner_id", value: (oid < 0 ? -oid : "")}));
		Form.appendChild($.elements.create("input", {type: "hidden", name: "album_id", value: aid}));
		parent.appendChild(Site.CreateHeader("Редактирование альбома"));
		parent.appendChild(Form);
		Site.Append(parent);
		Site.SetHeader("Альбом", {link: "audio?oid=" + oid + "&album=" + aid});
	},

	showModalInfoItem: function(ownerId, audioId) {
		var w,
			modal = new Modal({
				title: "Аудиозапись",
				content: w = $.e("div", {append: Site.Loader(true)}),
				footer: [
					{
						name: "ok",
						title: "Закрыть",
						onclick: function(event) {
							modal.close();
						}
					}
				]
			}).show(),
			id = ownerId + "_" + audioId,
			audio = Audios.Storage[id],

			showInfo = function(audio) {
				var e = $.e,
					parent = e("div"),
				actions = [
					{
						label: "Скачать MP3",
						url: audio.url,
						attribute: ["download", audio.artist + " - " + audio.title + ".mp3"]
					},
					{
						label: "Скачать MP3 (alternative)",
						url: "//apidog.ru/api/v2/apidog.downloadAudio?key=" + API.access_token + "&audio=" + ownerId + "_" + audioId,
						attribute: ["target", "_blank"]
					},
					{
						label: "Отправить другу",
						url: "#mail?attach=audio" + ownerId + "_" + audioId
					},
					{
						label: "Редактировать",
						url: "#audio?act=item&ownerId=" + ownerId + "&audioId=" + audioId + "&action=edit",
						hide: !(API.userId == ownerId || ownerId < 0 && Local.Users[ownerId] && Local.Users[ownerId].is_admin),
						callback: function(event) {
							modal.close();
						}
					},
					{
						label: "Удалить",
						callback: function(event) {
							var elem = this;
							VKConfirm("Вы действительно хотите удалить эту аудиозапись?", function() {
								Site.API("audio.delete", {
									owner_id: ownerId,
									audio_id: audioId
								}, function(data) {
									data = Site.isResponse(data);
									if (!data)
										return Site.Alert({text: "Ошибка!<br>" + data.error.error_msg});
									$.elements.removeClass(elem.nextSibling, "hidden");
									$.elements.addClass(elem, "hidden");
								})
							});
						},
						hide: !(API.userId == ownerId || ownerId < 0 && Local.Users[ownerId] && Local.Users[ownerId].is_admin)
					},
					{
						label: "Восстановить",
						callback: function(event) {
							var elem = this;
							Site.API("audio.restore", {
								owner_id: ownerId,
								audio_id: audioId
							}, function(data) {
								data = Site.isResponse(data);
								if (!data)
									return Site.Alert({text: "Ошибка!<br>" + data.error.error_msg});
								$.elements.removeClass(elem.previousSibling, "hidden");
								$.elements.addClass(elem, "hidden");
							})
						},
						hide: true
					}
				];
				actions.forEach(function(link) {
					var attributes = {"class": "list-item"};
					if (link.hide) attributes["class"] += " hidden";
					if (link.url) attributes.href = link.url;
					if (link.callback) attributes.onclick = link.callback;
					attributes.html = link.label;
					if (link.attribute) attributes[link.attribute[0]] = link.attribute[1];
					parent.appendChild(e("a", attributes));
				});
				if (audio.text) {
					parent.appendChild(Site.getPageHeader("Текст аудиозаписи"));
					parent.appendChild(e("div", {"class": "audio-text", html: Site.Format(audio.text)}));
				};
				$.elements.clearChild(w).appendChild(parent);
				w.parentNode.style.padding = "0";
			};

		if (!audio || audio.lyrics_id && !audio.text) {
			Site.API("execute", {
				code: "var a=API.audio.getById({audios:\"" + id + "\"})[0],o=a.owner_id;return{a:a,h:(o>0?API.users.getById({user_ids:o,fields:\"online\"}):API.groups.getById({group_ids:-o}))[0],l:API.audio.getLyrics({lyrics_id:a.lyrics_id}).text};"
			}, function(data) {
				data = Site.isResponse(data);
				data.a.text = data.l;
				Audios.Storage[data.a.owner_id + "_" + (data.a.aid || data.a.id)] = data.a;
				showInfo(data.a);
			});
		} else {
			showInfo(audio);
		};
	},

	showUploadForm: function() {
		var node = $.e("input", {
			type: "file",
			accept: "audio/mp3",
			multiple: true,
			onchange: function() {
				uploadFiles(node, {
					maxFiles: 5,
					method: "audio.getUploadServer"
				}, {
					onTaskFinished: function(result) {
						result.forEach(function(a) {
							Audios.l2l[API.userId] = null;
							Audios._Uploaded = a.owner_id + "_" + (a.aid || a.id);
						});
						Site.Go("#audio");
					}
				});
			}
		});
		node.click();
	},




	_radio: null,

	saveRadio: function(data) {
		Audios._radio = {
			count: data.count,
			cities: parse(data.cities, RadioCity),
			stations: parse(data.items, RadioItem)
		};

		Audios.radio.init();
	},

	radio: {

		init: function() {
			Audios.radio.getStations().forEach(function(station) {
				if (!station.cityId) {
					return;
				};

				station.city = Audios.radio.getCityById(station.cityId);
			});
		},

		getStationById: function(stationId) {
			return Audios._radio.stations.find(function(station) { return station.stationId === stationId });
		},

		getCityById: function(cityId) {
			return Audios._radio.cities.find(function(city) { return city.cityId === cityId });
		},

		getStations: function() {
			return Audios._radio.stations;
		}

	},

	showRadio: function() {
		Audios.showCustomList(APIDOG_AUDIO_TAB_RADIO, {

			title: lg("audio.radioTitle"),

			getItems: function() {
				return Audios.radio.getStations();
			}

		});
	},





	getRadio: function() {
		var e = $.e,
			parent = e("div", {"class": "audio-wrap"}),
			list = e("div", {"id": "audiolist"});

		list.appendChild(Site.Loader(true));
		parent.appendChild(Site.CreateHeader("Онлайн-радио", e("a", {href: "http:\/\/radio.vlad805.ru\/", target: "_blank", "class": "fr", html: "radio.vlad805.ru"})));
		parent.appendChild(Audios.getRightPanel());
		parent.appendChild(list);
		Site.Append(parent);

		var clbk = function(data) {
data = data.response;
			$.elements.clearChild(list);

			var cities = (function(a, b, c) {
				for (c in a)
					b[a[c].cityId] = a[c].title;
				return b;
			})(data.cities, {}, null);

			data = data.items;

			for (var item in data) {
				item = data[item];
				list.appendChild(Audios.getRadioItem(item, cities));
				Audios.radio[item.stationId] = item;
			};

		};

		Support.Ajax("/api/v2/vlad805.getRadio", {v:2.1}, clbk);

		//new Vlad805API("radio.get", {count: 50, v: 2.0}).onResult(callback);
		Site.SetHeader("Online radio");
	},
	getRadioCurrent: function() {
		return !isNaN(parseInt(Audios.Current)) && Audios.Current < 0 ? -Audios.Current : false;
	},
	getRadioItem: function(i, l) {
		var n = document.createElement("div"),
			c = [],
			station;

		n.className = "audio-item" + (Audios.Current == -i.stationId ? " audio-playing" : "");
		n.id = "audio" + i.stationId;

		$.event.add(n, "click", function(event) {
			var AudioPlayer;
			AudioPlayer = $.element("Player");
			if (!$.elements.hasClass(AudioPlayer, "sys-audio-inited"))
				Audios.Player.InitEvents(AudioPlayer);
			AudioPlayer.pause();
			AudioPlayer.src = i.streams[0].url;
			AudioPlayer.load();
			Audios.MiniPlayer.Show();
			Audios.Player.Play()
			Audios.Current = -i.stationId;
			Audios.reinitIcons();

			var other = document.querySelectorAll(".audio-playing"), j = 0, it;
			while (it = other[j++])
				$.elements.removeClass(it, "audio-playing");

			$.elements.addClass(n, "audio-playing");
			var title = "<strong>" + Site.Escape(i.title) + "</strong>" + (i.cityId && l[i.cityId] ? " (" + Site.Escape(l[i.cityId]) + ")" : "");
			$.element("headplayer-titleNormal").firstChild.innerHTML = title;
			$.element("headplayer-titleMini").firstChild.innerHTML = title;
		});

		c.push($.e("div", {
			"class": "audio-sprite audio-goto",
			onclick: function(event) {
				$.event.cancel(event);
				Audios.getRadioCurrentBroadcastingSong(i);
			}
		}));
		n.appendChild($.elements.create("div", {
			"class": "fr",
			append: [
				$.e("div", {"class": "audio-control fr", append: c})
			]
		}));
		n.appendChild($.e("div", {"class": "audio-item-control audio-sprite"}));
		n.appendChild($.e("div", {"class": "audio-item-title", title: Site.Escape(i.title) + (i.cityId && l[i.cityId] ? " (" + Site.Escape(l[i.cityId]) : ""), append: [
			$.e("strong", {html: Site.Escape(i.title)}),
			i.cityId ? $.e("span", {html: " (" + l[i.cityId] + ")"}) : null
		]}));
		return n;
	},
	getRadioCurrentBroadcastingSong: function(station) {
		if (!station)
			return;
		if (!isNaN(station))
			station = Audios.radio[station];

		var clbk = function(data) {
data = data.response;
			if (data.success)
				alert("На <" + station.title + "> сейчас играет трек <" + data.title + ">");
			else
				alert("Неизвестная ошибка");
		};


		Support.Ajax("/api/v2/vlad805.getRadioTrack", {stationId: station.stationId}, clbk);


		//new Vlad805API("radio.getCurrentBroadcastingSong", {stationId: station.stationId, v: 2.0}).onResult();
	}
};