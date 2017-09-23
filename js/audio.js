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
}

VKAudio.prototype = {

	getAttachId: function () {
		return this.getType() + this.ownerId + "_" + this.getId();
	},

	getType: function () {
		return "audio";
	},

	getId: function () {
		return this.ownerId + "_" + this.audioId;
	},

	mNode: null,

	mNodeControl: null,

	mNodeTimePlayed: null,

	mNodeArtist: null,

	mNodeTitle: null,


	getNodeItem: function(options) {
		options = options || {};

		var e = $.e,
			self = this,

			wrap = e("div", {
				id: "audio" + this.getId(),
				"class": "audio-item",
				append: [
					e("div", {
						"class": "audio-right", append: [
							e("div", {
								"class": "audio-times", append: [
									e("div", {"class": "audio-time-real", html: this.getDuration()}),
									this.mNodeTimePlayed = e("div", {"class": "audio-time-played"})
								]
							}),
							e("div", {"class": "audio-actions", append: this.getActions()})
						]
					}),
					this.mNodeControl = e("div", {"class": "audio-control audio-i audio-i-play"}),
					e("div", {
						"class": "audio-content", append: [
							e("div", {
								"class": "audio-title", append: [
									this.mNodeArtist = e("strong", {html: this.artist.safe()}),
									document.createTextNode(" — "),
									this.mNodeTitle = e("span", {html: this.title.safe()})
								]
							})
						]
					})
				]
			});

		if (options.onClick) {
			$.event.add(wrap, "click", function(event) {
				options.onClick(self.ownerId, self.audioId, self, event);
			});
		}

		return wrap;
	},

	getDuration: function() {
		return $.toTime(this.duration);
	},

	getActions: function() {
		return [];
	},
};

var Audios = {

	Resolve: function() {
		Audios.RequestPage();
	},


	/**
	 * Full ID of current audio. Audios.items[<ID>]
	 * @var {string}
	 */
	currentAudioFullID: "0_0",

	/**
	 * ID of current playlist in Audios.storage[<ID>]
	 * @var {string|null}
	 */
	currentPlaylistID: null,

	/**
	 * Storage for playlists
	 */
	storage: {},

	/**
	 * Storage for audio by ID
	 */
	items: {},

	/**
	 * Bitmask for audio play settings
	 */
	playSettings: 0,

	/**
	 * Available bits settings
	 */
	BIT_BROADCAST: 16,
	BIT_REPEAT: 32,
	BIT_INVERSE_TIME: 1024,

	/**
	 * Checks if setting is enabled
	 * @param {int} bit
	 * @returns {boolean}
	 */
	isEnabled: function(bit) {
		return !!(Audios.playSettings & bit);
	},

	/**
	 * Classes for nodes
	 */
	CLASS_FLAT_MODE: "audios-flat",
	CLASS_PLAYING: "audios-playing",
	CLASS_RESTRICTED: "audios-restricted",
	CLASS_NOW_BROADCAST: "audios-noBroadcast",
	CLASS_PAUSED: "audios-paused",

	CLASS_HEAD_PLAY: "head-player-button-play",
	CLASS_HEAD_PAUSE: "head-player-button-pause",

	/**
	 * Route
	 */
	RequestPage: function() {
		var ownerId = parseInt(Site.get("ownerId")) || API.userId;

		switch (Site.get("act")) {
			case "search":
				Audios.showSerachPage();
				break;

			case "friends":
				return Audios.getFriendsBroadcast();
				break;

			case "popular":
				return Audios.getPopular();
				break;

			case "recommendations":
				return Audios.getRecommendations();
				break;

			case "radio":
				return Audios.getRadio();


			case "albums":
				return Audios.getAlbums(ownerId);

			default:
				return Audios.page({ownerId: ownerId, search: true, playlist: ownerId}).then(Audios.requestAudios).then(Audios.show).catch(Audios.fixAudio);
		}
	},


	/**
	 * Create template of audio list
	 * @param {{ownerId: int, search: boolean=, playlist: string=}} options
	 * @returns {Promise}
	 */
	page: function(options) {
		return new Promise(function(resolve) {
			var sl = new SmartList({
					data: {count: -1, items: []},
					countPerPage: 100,
					needSearchPanel: true,
					getItemListNode: Audios.getListItem,
					optionsItemListCreator: {
						playlist: options.playlist
					},
					filter: function(q, audio) {
						return ~audio.artist.toLowerCase().indexOf(q) || ~audio.title.toLowerCase().indexOf(q);
					}
				}),
				loader = Site.Loader(true),
				list = $.e("div", {"class": "audios-list", append: [sl.getNode(), loader]}),
				tabs = Audios.getTabs(options.ownerId),
				wrap = $.e("div", {"class": "audios-wrap", append: [tabs, list]});

			Site.append(wrap);

			resolve({list: list, sl: sl, loader: loader, ownerId: options.ownerId});
		});
	},

	/**
	 * Returns tabs
	 * @param {int} ownerId
	 */
	getTabs: function(ownerId) {
		var tabs = [],
			param = API.userId === ownerId ? "ownerId=" + ownerId : "";

		tabs.push(["audio" + (param ? "?" + param : ""), Lang.get("audios.tabs_audios")]);
		tabs.push(["audio?act=recommendations" + (param ? "&" + param : ""), Lang.get("audios.tabs_recommends")]);
		tabs.push(["audio?act=albums" + (param ? "&" + param : ""), Lang.get("audios.tabs_recommends")]);

		if (API.userId === ownerId) {
			tabs.push(["audio?act=friends", Lang.get("audios.tabs_friends")]);
			tabs.push(["audio?act=popular", Lang.get("audios.tabs_popular")]);
			tabs.push(["audio?act=radio", Lang.get("audios.tabs_radio")]);
		}

		return Site.getTabPanel(tabs);
	},


	/**
	 * Request audio data by owner
	 * @param {{ownerId: int}} meta
	 * @returns {*}
	 */
	requestAudios: function(meta) {
		var ownerId = meta.ownerId;
		if (Audios.storage[ownerId]) {
			meta.data = Audios.storage[ownerId];
			return meta;
		}

		return api("execute", {
			code: "var a=API.audio.get({owner_id:Args.o,count:5000}),s=API.account.getCounters();return{a:a,s:s};",
			o: ownerId,
			v: 5.56
		}).then(function(data) {
			Site.setCounters(data.s);
			if (!data.a || data.a && data.a.items && data.a.items[0] && data.a.items[0].owner_id === 100) {
				throw new TypeError("Audios is not fixed");
			}
			meta.data = data.a;
			Audios.storage[meta.ownerId] = data.a.items;
			return meta;
		});
	},

	/**
	 * Trying fix audio
	 * @param {TypeError|null} e
	 */
	fixAudio: function(e) {
		console.error(e);
		console.info("Fixing..");
		APIdogRequest("app.fixAudio", {token: API.accessToken}).then(function(res) {
			console.log("May be fixed. Try reload", res);
		});
	},

	/**
	 * Show audio list
	 * @param {{list: HTMLElement, sl: SmartList, data: {count: int, items: VKAudio[]}, ownerId: int, loader: HTMLElement}} obj
	 */
	show: function(obj) {
		$.elements.remove(obj.loader);
		obj.sl.setData(obj.data);
	},


	/**
	 * Return item node audio
	 * @param {VKAudio} audio
	 * @param {{flatMode: boolean=, removeBroadcast: boolean=, onMoreClick: function=, playlist: string=}} options
	 */
	getListItem: function(audio, options) {
		var e = $.e,
			item = e("div"),
			id = audio.owner_id + "_" + audio.id,
			cls = ["audios-item"];

		options = options || {};
		options.flatMode && item.classList.add(Audios.CLASS_FLAT_MODE);

		Audios.getCurrent() === id && emojiImageTemplate.classList.add(Audios.CLASS_PLAYING);
		Audios.items[id] = audio;

		item.id = "audio" + id;

		item.addEventListener("click", function(event) {
			if (event.ctrlKey) {
				return Audios.getBitrate(audio);
			}

			Audios.setPlay(audio, options.playlist);
			return $.event.cancel(event);
		});

		options.removeBroadcast && item.classList.add(Audios.CLASS_NOW_BROADCAST);

		/*if (opts && opts.removeBroadcast)
			controls.push($.elements.create("div", {
				"class": "audio-delete",
				onclick: (function (id) {return function (event) {
					Audios.setBroadcast("");
					Audios.player.toggleBroadcast($.element("repeat-audio"), 1);
					var parent = this.parentNode.parentNode.parentNode;
					Site.API("status.get", {
						user_id: id
					}, function (data) {
						var status = Site.isResponse(data).text;
						parent.parentNode.appendChild($.elements.create("div", {"class": "profile-status" + (!status ? " tip" : ""),onclick: function (event) {Profile.EditStatus(this);},html: (status || "изменить статус")}));
						$.elements.remove(parent);
					});
					$.event.cancel(event);
				}})(opts.uid)
			}))*/

		/*
		controls.push($.elements.create("div", {
			"class": "audio-sprite audio-goto",
			onclick: (function (oid, aid) {
				return function (event) {
					//window.location.hash = "#audio?act=item&ownerId=" + c.owner_id + "&audioId=" + (c.aid || c.id);
					$.event.cancel(event);

					Audios.showModalInfoItem(c.owner_id, c.aid || c.id);

				};
			})(c.owner_id, (c.aid || c.id))
		}));*/

		/*if (API.userId !== c.owner_id) {
			controls.push($.elements.create("div", {
				"class": "audio-add audio-sprite fr",
				onclick: (function (oid, aid) {
					return function (event) {
						$.event.cancel(event);
						Audios.Add(oid, aid, 1);
						return;
					}
				})(c.owner_id, (c.aid || c.id))
			}));
		}*/

		item.appendChild(e("div", {"class": "audios-state"}));

		item.appendChild(e("div", {"class": "audios-name", title: audio.artist + " — " + audio.title, append: [
			e("span", {"class": "audios-artist", html: audio.artist.safe() }),
			e("span", {"class": "audios-title", html: audio.title.safe() })
		]}));

		item.appendChild(e("div", {"class": "audios-meta", append: [
			e("div", {"class": "audios-time", html: "00:00"}),
			e("div", {"class": "audios-more", onclick: options.onMoreClick})
		]}));

		item.classList.add.apply(item.classList, cls);

		return item;
	},


	/**
	 * Returns full ID of current audio
	 * @returns {string}
	 */
	getCurrent: function() {
		return Audios.currentAudioFullID;
	},






















	miniPlayer: {
		mHead: null,

		getHead: function() {
			return this.mHead || (this.mHead = q(".head-content"));
		},

		hide: function (event) {
			this.getHead().dataset.open = "title";
			return $.event.cancel(event);
		},

		show: function (event) {
			this.getHead().dataset.open = "player";
			return $.event.cancel(event);
		},

		changeFormatTime: function (event) {
			Audios.playSettings = (Audios.isEnabled(Audios.BIT_INVERSE_TIME) ? Audios.playSettings - Audios.BIT_INVERSE_TIME : Audios.playSettings + Audios.BIT_INVERSE_TIME);
			Audios.recountTime();
			return $.event.cancel(event);
		}
	},


	/**
	 * Request for add audio ito user's list
	 * @param {VKAudio} audio
	 * @returns {Promise}
	 */
	add: function(audio) {
		return api("audio.add", {
			owner_id: audio.ownerId,
			audio_id: audio.id
		}).then(function() {
			audio.added = true;
			Site.Alert({text: "Аудиозапись &laquo;" + audio.artist.safe() + " &mdash; " + audio.title.safe() + "&raquo; успешно добавлена в Ваши аудиозаписи"});
			// TODO fire to storage current user
			return true;
		});
	},



	timeline: null,
	volumeline: null,
	setVolumeState: function(volume) {
		Audios.volumeline.setValue(volume);
		Audios.getPlayer().volume = volume / 100;
		$.localStorage(Audios.KEY_AUDIO_VOLUME, volume);
	},

	/**
	 * Returns player
	 * @returns {HTMLElement}
	 */
	getPlayer: function() {
		return $.element("player");
	},

	/**
	 * Returns state of playing
	 * @returns {boolean}
	 */
	isPlaying: function() {
		return !Audios.getPlayer().paused;
	},

	player: {

		initEvents: function() {
			var volumeLineNode = $.element("head-player-volume"),
				volumeLineInput = $.element("head-player-volume-input"),

			player = Audios.getPlayer();

			Audios.player.mVolumeGhost = $.element("head-player-volume-ghost");

			Audios.volumeline = new Slider(volumeLineNode, volumeLineInput);

			Audios.volumeline.setMinimum(0);
			Audios.volumeline.setMaximum(100);

			Audios.volumeline.onchange = Audios.player.onVolumeChangeSlider.bind(Audios.volumeline);

			//noinspection SpellCheckingInspection
			$.event.add(player, "timeupdate", Audios.player.onTimeUpdatePlayer.bind(player));
			$.event.add(player, "progress", Audios.player.onProgressPlayer.bind(player));
			//noinspection SpellCheckingInspection
			$.event.add(player, "loadedmetadata", Audios.player.onLoadedMetaDataPlayer.bind(player));
			$.event.add(player, "ended", Audios.player.onEndedPlayer.bind(player));

			$.event.add(player, "play", Audios.player.onPlay);
			$.event.add(player, "pause", Audios.player.onPause);

			$.event.add(window, "resize", Audios.volumeline.recalculate);
			$.event.add($.element("head-player-line-wrap"), "click", Audios.player.onTimelineClick.bind(player));

			//noinspection SpellCheckingInspection
			$.elements.addClass(player, "sys-audio-inited");
		},

		onVolumeChangeSlider: function() {
			var n = this.getValue();
			Audios.setVolumeState(n);
			Audios.player.mVolumeGhost.style.width = Audios.volumeline.handle.style.left;
		},

		onTimeUpdatePlayer: function() {
			var played = this.currentTime,
				duration = this.duration,
				percent = (100 * played) / duration,
				isReverse = Audios.isEnabled(Audios.BIT_INVERSE_TIME) && duration !== Infinity,
				playedString = $.toTime(!isReverse ? played : duration - played),
				playing;

			if (isReverse) {
				playedString = "-" + playedString;
			}

			$.element("player-playedtime").innerHTML = playedString;
			$.element("head-player-line-played").style.width = percent + "%";

			if ((playing = q(".audio-playing")) && this.duration !== Infinity) {
				try {
					playing.querySelector(".audio-item-played").innerHTML = playedString;
					playing.querySelector(".audio-item-real").innerHTML = $.toTime(duration);
				}catch(e){console.error(e)}
			}
		},

		onLoadedMetaDataPlayer: function(event) {

		},

		onProgressPlayer: function() {
			try {
				var buffers = this.buffered,
					progress = $.element("head-player-line-loaded"),
					progresses = progress.children,
					duration = this.duration;

				if (buffers.length < progresses.length) {
					$.elements.clearChild(progress);
				}

				for (var i = 0, l = buffers.length; i < l; ++i) {
					var left = (100 * buffers.start(i)) / duration,
						width = (100 * buffers.end(i)) / duration;

					if (progresses[i]) {
						progresses[i].style.left = left + "%";
						progresses[i].style.width = (width - left) + "%";
					} else {
						var item = $.e("div", {"class": "head-player-line-loaded"});
						item.style.left = left + "%";
						item.style.width = (width - left) + "%";
						progress.appendChild(item);
					}
				}
			} catch (e) {
				console.error(e);
			}
		},

		onEndedPlayer: function() {
			if (Audios.isEnabled(Audios.BIT_REPEAT)) {
				var current = Audios.getCurrent();
				Audios.setPlay(Audios.items[current], Audios.currentPlaylistID);
				if (Audios.isEnabled(Audios.BIT_BROADCAST)) {
					Audios.setBroadcast(Audios.currentAudioFullID);
				}
			} else {
				Audios.next();
			}
		},

		onPlay: function() {
			console.log('play');
			getBody().classList.remove(Audios.CLASS_HEAD_PAUSE);
			getBody().classList.add(Audios.CLASS_HEAD_PLAY);
		},

		onPause: function() {
			getBody().classList.remove(Audios.CLASS_HEAD_PLAY);
			getBody().classList.add(Audios.CLASS_HEAD_PAUSE);
		},

		onTimelineClick: function(event) {
			var pos = $.getPosition($.element("head-player-line")),
				left = event.target === $.element("head-player-line") ? event.layerX : $.getPosition(event.target).left + event.layerX - pos.left;

			this.currentTime = (((left * 100) / pos.width) / 100) * this.duration;
			$.event.cancel(event);
		},

		play: function() {
			Audios.getPlayer().play();
			/*var btn = q(".audio-playing .audio-item-control");
			$.elements.removeClass(btn, "player-play");
			$.elements.addClass(btn, "player-pause");
			$.elements.addClass($.element("headplayer-play"), "hidden");
			$.elements.removeClass($.element("headplayer-pause"), "hidden");*/
		},

		pause: function() {
			Audios.getPlayer().pause();
			/*var btn = q(".audio-playing .audio-item-control")[0];
			$.elements.addClass(btn, "player-play");
			$.elements.removeClass(btn, "player-pause");
			$.elements.removeClass($.element("headplayer-play"), "hidden");
			$.elements.addClass($.element("headplayer-pause"), "hidden");*/
		},

		toggle: function () {
			Audios.getPlayer().paused ? Audios.player.play() : Audios.player.pause();
		},

		toggleBroadcast: function (button, state) {
			var bit = Audios.isEnabled(Audios.BIT_BROADCAST);
			if (bit || state) {
				$.elements.removeClass(button, "head-player-live-on");
				Audios.playSettings -= 16;
				Audios.setBroadcast("");
			} else {
				$.elements.addClass(button, "head-player-live-on");
				Audios.playSettings += 16;
				Audios.setBroadcast(Audios.currentAudioFullID);
			}
			$.localStorage("audio-settings", Audios.playSettings);
		},

		toggleRepeat: function (button) {
			var bit = Audios.isEnabled(Audios.BIT_REPEAT);
			if (bit) {
				$.elements.removeClass(button, "head-player-repeat-on");
				Audios.playSettings -= 32;
			} else {
				$.elements.addClass(button, "head-player-repeat-on");
				Audios.playSettings += 32;
			}
			$.localStorage("audio-settings", Audios.playSettings);
		},

		add: function() {
			if (!Audios.currentAudioFullID || Audios.items[Audios.currentAudioFullID].added) {
				return;
			}

			Audios.add(Audios.items[Audios.getCurrent()]).then(function() {
				$.elements.addClass(q(".add-audio"), "head-player-add-on");
				$.elements.addClass(q("#audio" + Audios.currentAudioFullID + " .audio-add"), "audio-added");
			});
		},

		Share: function() {
			window.location.hash = "#mail?attach=audio" + Audios.currentAudioFullID;
		}

	},




	KEY_AUDIO_VOLUME: "audio-vol",

	/**
	 * Start track playing
	 * @param {VKAudio} track
	 * @param {string} playlistId
	 * @returns {*}
	 */
	setPlay: function(track, playlistId) {

		if (!Audios.getPlayer().canPlayType("audio/mpeg")) {
			alert("Ваш браузер не поддерживает воспроизведение MP3 файлов!");
			return;
		}

		var vol = $.localStorage(Audios.KEY_AUDIO_VOLUME);

		if (vol === null || vol === undefined || vol === "null") {
			vol = 100;
		}

		Audios.miniPlayer.show();

		var audioId = track.owner_id + "_" + track.id,
			player = $.element("player");

		if (!track.url) {
			Site.Alert({
				text: (
					API.isExtension
						? "Аудиозапись изъята из публичного доступа."
						: (!isMobile
							? "Не могу получить доступ к аудио. Решение и описание этой проблемы есть в оповещении в меню.\n<strong>УБЕДИТЕЛЬНАЯ ПРОСЬБА: НЕ СОЗДАВАТЬ<\/strong> тикеты в поддержке по этому вопросу. Они будут удаляться без ответа."
							: "На мобильном, к сожалению, прослушивание аудиозаписей недоступно.\nПодробнее о проблеме можно прочитать по ссылке в оповещении, которое находится в меню."
						)
				),
				time: 20000
			});
			return;
		}

		Audios.setVolumeState(vol);

		if (audioId === Audios.getCurrent()) {
			Audios.player.toggle();
			return;
		}

		Audios.currentAudioFullID = audioId;
		Audios.currentPlaylistID = playlistId;

		player.src = getURL(track.url, "mp3");
		player.load();
		player.play();

		Audios.setTitle(track);
		Audios.setButtonsState(track);

		Audios.isEnabled(Audios.BIT_BROADCAST) && Audios.setBroadcast(audioId);
	},

	/**
	 * Set title of current track in header of site
	 * @param {VKAudio|RadioStation} track
	 */
	setTitle: function(track) {
		var isRadio = !!track.stationId;
		$.element("head-player-artist").textContent = !isRadio ? track.artist : track.title;
		$.element("head-player-song").textContent = !isRadio ? track.title : track._city;
		$.element("head-player-mini-title").textContent = !isRadio ? track.artist + " - " + track.title : track.title
	},

	/**
	 * Set visibility buttons in header by track
	 * @param {VKAudio} track
	 */
	setButtonsState: function(track) {
		var isRadio = Audios.getRadioCurrent(),
			isOwn = !isRadio && track.owner_id !== API.userId;

		$.elements[isOwn || isRadio ? "removeClass" : "addClass"]($.element("add-audio"), "hidden");
		$.elements[isRadio ? "removeClass" : "addClass"]($.element("find-audio"), "hidden");
		Audios.volumeline.recalculate();
	},

	/**
	 * Send request to broadcast track
	 * @param {string} audioId
	 * @returns {Promise}
	 */
	setBroadcast: function(audioId) {
		return api("audio.setBroadcast", {audio: audioId});
	},

	/**
	 * Find position and ability to navigate in current playlist by current audio
	 * @returns {{position: int, previous: boolean, next: boolean}}
	 */
	getCurrentPositionInList: function() {
		var list = Audios.storage[Audios.currentPlaylistID];
console.log(list);
		for (var i = 0, l; l = list[i]; ++i) {
			if (l.owner_id + "_" + l.id === Audios.currentAudioFullID) {
				return { position: i, previous: !!list[i - 1], next: !!list[i + 1] };
			}
		}

		return { position: -1, previous: false, next: false };
	},

	previous: function() {
		var position = Audios.getCurrentPositionInList(), list;
console.log(position);
		if (!~position.position) {
			console.warn("Unknown position, unhandled: ", position);
			return;
		}

		if (!position.previous) {
			return;
		}

		list = Audios.storage[Audios.currentPlaylistID];
		Audios.setPlay(list[position.position - 1], Audios.currentPlaylistID);
	},


	next: function() {
		var position = Audios.getCurrentPositionInList(), list;

		if (!~position.position) {
			console.warn("Unknown position, unhandled: ", position);
			return;
		}

		if (!position.next) {
			return;
		}

		list = Audios.storage[Audios.currentPlaylistID];
		Audios.setPlay(list[position.position + 1], Audios.currentPlaylistID);
	},


	recountTime: function() {
		var elem = $.element("player");
		$.element("player-playedtime").innerHTML = Audios.isEnabled(Audios.BIT_INVERSE_TIME) ? $.toTime(elem.currentTime) : "-" + $.toTime(elem.duration - elem.currentTime);
	},



	lastSearched: ["",0,0],

	showSerachPage: function () {
		var e = $.e, list,
			parent = e("div", {append: [
				Site.getPageHeader("Поиск"),
				Audios.getRightPanel(),
				form = Site.createInlineForm({
					type: "search",
					name: "q",
					value: Site.Get("q") || Audios.lastSearched[0] || "",
					placeholder: "Поиск..",
					title: "Поиск",
					onsubmit: function (event) {
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
		Site.append(parent);
		Site.setHeader("Поиск аудиозаписей");
		var q;
		if (Audios.lastSearched[0] && (q = Audios.lastSearched)) {
			Audios.doSearch(q[0], q[1], q[2], 0, list);
		}
	},
	doSearch: function (query, onlyPerformer, onlyWithLyrics, offset, list) {
		Site.API("audio.search", {
			q: query,
			performer_only: +onlyPerformer,
			lyrics: +onlyWithLyrics,
			//auto_complete: 1,
			count: 40,
			offset: getOffset()
		}, function (data) {
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
				//wrap.appendChild(Audios.Item(item, {lid: lid, from: 64, add: true}));
				
			}
			wrap.appendChild(Site.getSmartPagebar(getOffset(), count > 1000 ? 1000 : count, 40));
			list = list || $.element("audio-search-list");
			$.elements.clearChild(list);
			list.appendChild(wrap);
		});
	},
	getFriendsBroadcast: function () {
		Site.API("audio.getBroadcastList", {
			filter: "all",
			active: 1,
			fields: "online,photo_rec,screen_name"
		}, function (data) {
			data = Site.isResponse(data);
			Local.add(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				item = function (c) {
					var lid = (+new Date());
					Audios.Lists[lid] = [c.status_audio];
					Audios.Data[c.status_audio.owner_id + "_" + c.status_audio.aid] = c.status_audio;
					return $.elements.create("div", {"class": "friends-item", append: [
						$.elements.create("img", {src: getURL(c.photo_rec || c.photo || c.photo_50), "class": "friends-left"}),
						$.elements.create("div", {"class": "friends-right", append: [
							$.elements.create("a", {href: "#" + c.screen_name, append: [
								$.elements.create("strong", {html: (c.type === "profile" ? c.first_name + " " + c.last_name + Site.isOnline(c) : c.name)}),
							//	Audios.Item(c.status_audio, {lid: lid, set: 32})
							]})
						]})
					]})
				};
			list.id = "audiolist";
			if (data.length)
				for (var i = 0; i < data.length; ++i)
					list.appendChild(item(data[i]));
			else
				list.appendChild(Site.getEmptyField("В данный момент никто не транслирует аудиозаписи"));
			parent.appendChild(Site.getPageHeader("Трансляции"));
			parent.appendChild(Audios.getRightPanel());
			parent.appendChild(list);
			Site.append(parent);
			Site.setHeader("Трансляции друзей");
		})
	},
	getPopular: function (offset) {
		offset = +offset || 0;
		Site.API("audio.getPopular", {
			count: 50,
			offset: offset,
			genre_id: Site.Get("genreId")
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				lid = (+new Date()), gnr;
			Audios.Lists[lid] = Audios.getStringListFromArrayList(data);
			list.id = "audiolist";
			for (var i = 0; i < data.length; ++i) {
				/*list.appendChild(Audios.Item(data[i], {
					lid: lid,
					from: 64,
					add: true
				}));*/
				Audios.Data[data[i].owner_id + "_" + (data[i].aid || data[i].id)] = data[i];
			}
			//list.appendChild(Site.getPagination({offset: offset, count: 1000, step: 50, callback: function (event) {
			//	window.scrollTo(0, 0); // top
			//	Audios.getPopular(event.offset);
			//}}));
			parent.appendChild(Site.getPageHeader("Популярные аудиозаписи", gnr = $.e("select", {"class": "fr", append: Audios.getGenreNodeArray(), onchange: function (event) {
				window.location.hash = "#audio?act=popular&genreId=" + this.options[this.selectedIndex].value;
			}})));
			gnr.selectedIndex = (function (a,b,c,d){for(d=a.length;++c<d;)if(a[c][0]===b)return c})(Audios.genres, Site.Get("genreId"), -1);
			parent.appendChild(Audios.getRightPanel());
			//parent.appendChild($.e("div", {"class": "sf-wrap", append: }));
			parent.appendChild(list);
			Site.append(parent);
			Site.setHeader("Популярное");
		})
	},
	getStringListFromArrayList: function (data) {
		var d = [];
		for (var i = 0, l = data.length; i < l; ++i)
			d.push(data[i].owner_id + "_" + (data[i].id || data[i].aid));
		return d;
	},
	getRecommendations: function (offset) {
		offset = +offset || 0;
		Site.API("execute", {
			code: 'return API.audio.getRecommendations({count:50,offset:%o,user_id:%u,v:5.9});'
				.replace(/%o/i, offset)
				.replace(/%u/i, Site.Get("oid"))
		}, function (data) {
			data = Site.isResponse(data);
			var parent = document.createElement("div"),
				list = document.createElement("div"),
				count = data.count,
				lid = (+new Date());
			data = data.items;
			Audios.Lists[lid] = Audios.getStringListFromArrayList(data);
			list.id = "audiolist";
			for (var i = 0; i < data.length; ++i) {
				/*list.appendChild(Audios.Item(data[i], {
					lid: lid,
					from: 64,
					add: true
				}));*/
				Audios.Data[data[i].owner_id + "_" + (data[i].aid || data[i].id)] = data[i];
				//Audios.Lists[lid].push(data[i]);
			}
			parent.appendChild(Site.getPageHeader("Рекомендованные аудиозаписи"));
			parent.appendChild(Audios.getRightPanel());
			parent.appendChild(list);
			//list.appendChild(Site.getPagination({offset: offset, count: count, step: 50, callback: function (event) {
		//		window.scrollTo(0, 0); // top
		//		Audios.getRecommendations(event.offset);
		//	}}));
			Site.append(parent);
			Site.setHeader("Рекомендации");
		})
	},
	l2a: {},
	getAlbums: function (owner_id) {
		owner_id = owner_id || API.userId;
		if (!Audios.Albums[owner_id] && !Audios.l2a[owner_id])
			return Site.API("audio.getAlbums", {
				count: 75,
				owner_id: owner_id
			}, function (data) {
				data = Site.isResponse(data);

				Audios.getAlbums(owner_id);
				Audios.l2a[owner_id] = true;
			});
		var parent = document.createElement("div"),
			list = document.createElement("div"),
			albums = Audios.Albums[owner_id];
		if (owner_id == API.userId || Local.data[owner_id] && Local.data[owner_id].is_admin)
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
			list.appendChild(Site.getEmptyField("Альбомов нет"));
		list.id = "audiolist";
		parent.appendChild(Site.getPageHeader("Альбомы"));
		parent.appendChild(Audios.getRightPanel());
		parent.appendChild(list);
		Site.append(parent);
		Site.setHeader("Альбомы");
	},
	createAlbum: function (oid) {
		oid = oid || API.userId;
		var Form = document.createElement("form"),
			page = document.createElement("div");
		Form.onsubmit = function (event) {
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
			}, function (data) {
				data = Site.isResponse(data);
				if (data && data.album_id) {
					Site.Alert({text: "Альбом успешно создан!"});
					window.location.hash = "#audio?oid=" + oid + "&album=" + data.album_id;
				} else
					Site.Alert({text: "Ошибка!<br>" + data.error.error_msg})
			});
			return false;
		};
		Form.appendChild(Site.getPageHeader("Создание аудиоальбома", '<a href="#audio' + (oid != API.userId && oid < 0 ? '?oid=' + oid : '') + '">Назад<\/a>'));
		page.className = "sf-wrap";
		page.appendChild($.elements.create("div", {"class": "tip tip-form", html: "Название альбома"}));
		page.appendChild($.elements.create("input", {type:"text", name: "title", required: true}));
		page.appendChild($.elements.create("input", {type:"hidden", name: "owner_id", value: oid}));
		page.appendChild($.elements.create("input", {type:"submit", value: "Создать"}));
		Form.appendChild(page);
		Site.append(Form);
	},
	editAlbum: function (oid, aid) {
		var title = Audios.Albums[oid + "_" + aid] && Audios.Albums[oid + "_" + aid].title;
		var parent = document.createElement("div"),
			Form = Site.createInlineForm({type: "text", name: "title", value: title, title: "Сохранить"});
		Form.onsubmit = function (event) {
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
			}, function (data) {
				if (data.response && data.response === 1) {
					Site.Alert({text: "Альбом успешно отредактирован!"});
					Audios.Albums[o[0] + "_" + o[1]].title = title;
					window.location.hash = "#audio?oid=" + o[0] + "&album=" + o[1];
				}
			});
			return false;
		};
		Form.appendChild($.elements.create("input", {type: "hidden", name: "owner_id", value: (oid < 0 ? -oid : "")}));
		Form.appendChild($.elements.create("input", {type: "hidden", name: "album_id", value: aid}));
		parent.appendChild(Site.getPageHeader("Редактирование альбома"));
		parent.appendChild(Form);
		Site.append(parent);
		Site.setHeader("Альбом", {link: "audio?oid=" + oid + "&album=" + aid});
	},

	showModalInfoItem: function (ownerId, audioId) {
		var w,
			modal = new Modal({
				title: "Аудиозапись",
				content: w = $.e("div", {append: Site.Loader(true)}),
				footer: [
					{
						name: "ok",
						title: "Закрыть",
						onclick: function (event) {
							modal.close();
						}
					}
				]
			}).show(),
			id = ownerId + "_" + audioId,
			audio = Audios.Storage[id],

			showInfo = function (audio) {
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
							url: "//apidog.ru/api/v2/apidog.downloadAudio?key=" + API.accessToken + "&audio=" + ownerId + "_" + audioId,
							attribute: ["target", "_blank"]
						},
						{
							label: "Отправить другу",
							url: "#mail?attach=audio" + ownerId + "_" + audioId
						},
						{
							label: "Редактировать",
							url: "#audio?act=item&ownerId=" + ownerId + "&audioId=" + audioId + "&action=edit",
							hide: !(API.userId == ownerId || ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin),
							callback: function (event) {
								modal.close();
							}
						},
						{
							label: "Удалить",
							callback: function (event) {
								var elem = this;
								VKConfirm("Вы действительно хотите удалить эту аудиозапись?", function () {
									Site.API("audio.delete", {
										owner_id: ownerId,
										audio_id: audioId
									}, function (data) {
										data = Site.isResponse(data);
										if (!data)
											return Site.Alert({text: "Ошибка!<br>" + data.error.error_msg});
										$.elements.removeClass(elem.nextSibling, "hidden");
										$.elements.addClass(elem, "hidden");
									})
								});
							},
							hide: !(API.userId == ownerId || ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin)
						},
						{
							label: "Восстановить",
							callback: function (event) {
								var elem = this;
								Site.API("audio.restore", {
									owner_id: ownerId,
									audio_id: audioId
								}, function (data) {
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
				actions.forEach(function (link) {
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
					parent.appendChild(e("div", {"class": "audio-text", html: Site.toHTML(audio.text)}));
				}
				$.elements.clearChild(w).appendChild(parent);
				w.parentNode.style.padding = "0";
			};

		if (!audio || audio.lyrics_id && !audio.text) {
			Site.API("execute", {
				code: "var a=API.audio.getById({audios:\"" + id + "\"})[0],o=a.owner_id;return{a:a,h:(o>0?API.users.getById({user_ids:o,fields:\"online\"}):API.groups.getById({group_ids:-o}))[0],l:API.audio.getLyrics({lyrics_id:a.lyrics_id}).text};"
			}, function (data) {
				data = Site.isResponse(data);
				data.a.text = data.l;
				Audios.Storage[data.a.owner_id + "_" + (data.a.aid || data.a.id)] = data.a;
				showInfo(data.a);
			});
		} else {
			showInfo(audio);
		}
	},

	getItem: function (ownerId, audioId, albumId) {
		var id = ownerId + "_" + audioId,
			audio = Audios.Storage[id];
		if (!audio || audio.lyrics_id && !audio.text) {
			Site.API("execute", {
				code: "var a=API.audio.getById({audios:\"%i\"})[0],o=a.owner_id;return{a:a,h:(o>0?API.users.getById({user_ids:o,fields:\"online\"}):API.groups.getById({group_ids:-o}))[0],l:API.audio.getLyrics({lyrics_id:a.lyrics_id}).text};"
					.replace(/%i/img, id)
			}, function (data) {
				data = Site.isResponse(data);
				data.a.text = data.l;
				Audios.Storage[data.a.owner_id + "_" + (data.a.aid || data.a.id)] = data.a;
				Audios.getItem(ownerId, audioId, albumId);
			});
			return;
		}

		var e = $.e,
			parent = e("div");

		if (!audio)
			return;

		//parent.appendChild(Audios.Item(audio, {lid: null, add: (audio.owner_id != API.userId)}));
		parent.appendChild(Site.getPageHeader("Действия"));
		var actions = [
			{
				label: "Скачать MP3",
				url: audio.url,
				attribute: ["download", audio.artist + " - " + audio.title + ".mp3"]
			},
			{
				label: "Скачать MP3 (alternative)",
				url: "//apidog.ru/api/v2/apidog.downloadAudio?key=" + API.accessToken + "&audio=" + ownerId + "_" + audioId,
				attribute: ["target", "_blank"]
			},
			{
				label: "Отправить другу",
				url: "#mail?attach=audio" + ownerId + "_" + audioId
			},
			{
				label: "Редактировать",
				url: "#audio?act=item&ownerId=" + ownerId + "&audioId=" + audioId + "&action=edit",
				hide: !(API.userId === ownerId || ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin)
			},
			{
				label: "Удалить",
				callback: function (event) {
					VKConfirm("Вы действительно хотите удалить эту аудиозапись?", function () {
						console.log("CALLBACK CALLED");
						var elem = this;
						Site.API("audio.delete", {
							owner_id: ownerId,
							audio_id: audioId
						}, function (data) {
							data = Site.isResponse(data);
							if (!data)
								return Site.Alert({text: "Ошибка!<br>" + data.error.error_msg});
							$.elements.removeClass(elem.nextSibling, "hidden");
							$.elements.addClass(elem, "hidden");
						})
					});
				},
				hide: !(API.userId == ownerId || ownerId < 0 && Local.data[ownerId] && Local.data[ownerId].is_admin)
			},
			{
				label: "Восстановить",
				callback: function (event) {
					var elem = this;
					Site.API("audio.restore", {
						owner_id: ownerId,
						audio_id: audioId
					}, function (data) {
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
		actions.forEach(function (link) {
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
			parent.appendChild(e("div", {"class": "sf-wrap", html: Site.toHTML(audio.text)}));
		}
		Site.append(parent);
		Site.setHeader("Аудиозапись", {link: "audio?oid=" + ownerId + (albumId ? "&album=" + albumId : "")})
	},
	editAudio: function (ownerId, audioId)
	{
		var id = ownerId + "_" + audioId,
			audio = Audios.Storage[id];
		if (!audio || audio.lyrics_id && !audio.text) {
			Site.API("execute", {
				code: "var a=API.audio.getById({audios:\"%i\"})[0];return{a:a,l:API.audio.getLyrics({lyrics_id:a.lyrics_id}).text};"
					.replace(/%i/img, id)
			}, function (data) {
				data = Site.isResponse(data);
				data.a.text = data.l;
				Audios.Storage[data.a.owner_id + "_" + (data.a.aid || data.a.id)] = data.a;
				Audios.editAudio(ownerId, audioId);
			});
			return;
		}
		var e = $.e,
			tip = function (l) { return e("div", {"class": "tip tip-form", html: l}); },
			artist,
			title,
			text,
			genre,
			noSearch,
			wrap = e("div", {append: [
				Site.getPageHeader("Редактирование аудиозаписи"),
				form = e("form", {"class": "sf-wrap", append: [
					tip("Исполнитель:"),
					artist = e("input", {type: "text", value: audio.artist}),
					tip("Название:"),
					title = e("input", {type: "text", value: audio.title}),
					tip("Жанр:"),
					genre = e("select", {append: Audios.getGenreNodeArray()}),
					e("label", {append: [
						noSearch = e("input", {type: "checkbox", name: "noSearch"}),
						e("span", {html: " не выводить в поиске"})
					]}),
					tip("Текст:"),
					text = e("textarea", {html: audio.text}),
					e("input", {type: "submit", value: "Сохранить"})
				]})
			]});
		if (audio.no_search)
			noSearch.checked = true;
		if (audio.genre)
			genre.selectedIndex = (function (a,b,c,d){for(d=a.length;c++<d;)if(a[c]&&a[c][0]===b)return c})(Audios.genres, audio.genre, 0);
		$.event.add(form, "submit", function (event)
		{
			event.preventDefault();

			Site.API("audio.edit",
				{
					owner_id: ownerId,
					audio_id: audioId,
					artist: artist.value.trim(),
					title: title.value.trim(),
					text: text.value.trim(),
					genre_id: genre.options[genre.selectedIndex].value,
					no_search: noSearch.checked ? 1 : 0
				},
				function (data)
				{
					if (data.response !== null)
					{
						Site.Alert({text: "Сохранено успешно"});
						audio.artist = artist.value.trim();
						audio.title = title.value.trim();
						audio.text = text.value.trim();
						audio.genre_id = genre.options[genre.selectedIndex].value;
						audio.no_search = noSearch.checked;
					}
					else
						Site.isResponse(data);
				});
			return false;
		});
		Site.append(wrap);
		Site.setHeader("Редактирование аудиозаписи", {link: "audio?act=item&ownerId=" + ownerId + "&audioId=" + audioId});
	},
	genres: [[0,"---"],[1,"Rock"],[2,"Pop"],[3,"Rap & Hip-Hop"],[4,"Easy Listening"],[5,"Dance & House"],[6,"Instrumental"],[7,"Metal"],[21,"Alternative"],[8,"Dubstep"],[9,"Jazz & Blues"],[10,"Drum & Bass"],[11,"Trance"],[12,"Chanson"],[13,"Ethnic"],[14,"Acoustic & Vocal"],[15,"Reggae"],[16,"Classical"],[17,"Indie Pop"],[19,"Speech"],[22,"Electropop & Disco"],[18,"Other"]],
	getGenreNodeArray:function(b){b=[];Audios.genres.forEach(function(d){b.push($.e("option",{value:d[0],html:d[1]}))});return b},
	showUploadForm: function () {
		var node = $.e("input", {
			type: "file",
			accept: "audio/mp3",
			multiple: true,
			onchange: function () {
				uploadFiles(node, {
					maxFiles: 5,
					method: "audio.getUploadServer"
				}, {
					onTaskFinished: function (result) {
						result.forEach(function (a) {
							Audios.l2l[API.userId] = null;
							Audios._Uploaded = a.owner_id + "_" + (a.aid || a.id);
						});
						Site.route("#audio");
					}
				});
			}
		});
		node.click();
	},


	radio: {},

	getRadio: function () {
		var e = $.e,
			parent = e("div", {"class": "audio-wrap"}),
			list = e("div", {"id": "audiolist"});

		list.appendChild(Site.Loader(true));
		parent.appendChild(Site.getPageHeader("Онлайн-радио", e("a", {href: "http:\/\/radio.vlad805.ru\/", target: "_blank", "class": "fr", html: "radio.vlad805.ru"})));
		parent.appendChild(list);
		Site.append(parent);

		vlad805.api.radio.get(60).then(function(data) {
			/** @var {{count: int, items: object[], cities: object[]}} data */
			$.elements.clearChild(list);

			var cities = (function(a, b) {
				a.forEach(function(c) {
					/** @var {{cityId: int}} c */
					b[c.cityId] = c;
				});
				return b;
			})(data.cities, {}, null);

			data.items.forEach(function(item) {
				/** @var {{stationId: int}} item */
				list.appendChild(Audios.getRadioItem(item, cities));
				Audios.radio[item.stationId] = item;
			});
		});

		Site.setHeader("Online radio", {});
	},

	getRadioCurrent: function() {
		return !isNaN(parseInt(Audios.currentAudioFullID)) && Audios.currentAudioFullID < 0 ? -Audios.currentAudioFullID : false;
	},

	getRadioItem: function(i, l) {
		var n = document.createElement("div"),
			c = [];

		n.className = "audio-item" + (Audios.currentAudioFullID === -i.stationId ? " audio-playing" : "");
		n.id = "audio" + i.stationId;

		var CITY = (i.cityId && l[i.cityId] ? Site.Escape(l[i.cityId].city) : "");
		i._city = CITY;
		$.event.add(n, "click", function() {
			var AudioPlayer;
			AudioPlayer = $.element("player");
			AudioPlayer.pause();
			AudioPlayer.src = i.streams[0].url;
			AudioPlayer.load();
			Audios.miniPlayer.show();
			Audios.player.play()
			Audios.currentAudioFullID = -i.stationId;
			Audios.setButtonsState(i);

			var other = document.querySelectorAll(".audio-playing"), j = 0, it;
			while (it = other[j++])
				$.elements.removeClass(it, "audio-playing");

			$.elements.addClass(n, "audio-playing");

			Audios.setTitle(i);
		});

		c.push($.e("div", {
			"class": "audio-sprite audio-goto",
			onclick: function (event) {
				$.event.cancel(event);
				Audios.getRadioCurrentBroadcastingSong(i);
			}
		}));
		n.appendChild($.e("div", {
			"class": "fr",
			append: $.e("div", {"class": "audio-control fr", append: c})
		}));
		n.appendChild($.e("div", {"class": "audio-item-control audio-sprite"}));
		n.appendChild($.e("div", {"class": "audio-item-title", title: i.title.safe() + (CITY ? " (" + CITY + ")" : ""), append: [
			$.e("strong", {html: i.title.safe()}),
			CITY ? $.e("span", {html: " (" + CITY + ")"}) : null
		]}));
		return n;
	},

	getRadioCurrentBroadcastingSong: function (station) {
		if (!station)
			return;

		if (!isNaN(station)) {
			station = Audios.radio[station];
		}


		vlad805.api.radio.getCurrentBroadcastingTrack(station.stationId).then(function(data) {
			if (data.title) {
				alert("На <" + station.title + "> сейчас играет трек <" + data.artist + " -- " + data.title + ">");
			} else {
				alert("Неизвестная ошибка");
			}
		});
	},

	/**
	 * Request and show bitrate of audio
	 * @param audioId
	 */
	getBitrate: function(audioId) {
		APIdogRequest("vk.getAudioBitrate", { audio: audioId, accessToken: API.accessToken }).then(function(data) {
			alert("Примерный битрейт: " + data.bitrate + "kbps");
		}).catch(function() {
			alert("К сожалению, не получилось получить битрейт");
		});
	},

	/**
	 * Request all playlist from VK and returns file m3u8
	 */
	downloadM3U8: function() {
		api("audio.get", {v: 5.56}).then(function(result) {
			var lines = result.items.map(function(i) {
				return "#EXTINF:" + i.duration + "," + i.artist + " - " + i.title + "\n" + i.url;
			});
			saveAs(new Blob(["#EXTM3U\n#PLAYLIST:Playlist Name\n" + lines.join("\n")], {type: "audio/x-mpegurl", charset:"utf-8"}), "playlist.m3u8");
		});
	},
};