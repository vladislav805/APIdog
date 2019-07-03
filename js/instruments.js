var Instruments = {

	showList: function() {

		var items = [
			{ id: 1, title: "Анализатор диалогов", click: this.dialogs },
			{ id: 2, title: "Анализатор одного диалога", click: this.selectDialog.bind(this, this.dialog) },

			{ id: 8, title: "Скачать альбом", click: this.downloadAlbum.bind(this, null) },
			{ id: 9, title: "Скачать диалог", click: this.selectDialog.bind(this, this.createArchive) },
			{ id: 10, title: "Открыть сохраненный диалог", click: this.showFormOpenArchive },
		];

		var sl = new SmartList({
			data: {count: items.length, items: items},
			countPerPage: 50,
			getItemListNode: function(item) {
				return $.e("div", {"class": "sl-item sl-content-bold a", onclick: item.click.bind(Instruments), append: [
					$.e("div", {"class": "sl-photo-wrap", append: $.e("div", {"class": "sl-photo-icon"})}),
					$.e("div", {"class": "sl-content-wrap", append: $.e("div", {"class": "sl-content", html: item.title ? item.title.safe() : "unk"})})
				]})
			}
		});

		Site.setHeader("Инструменты");
		Site.append($.e("div", {append: [
			Site.getPageHeader("Инструменты", "v2.0 dev"),
			sl.getNode()
		]}));
	},


	__dialogsCache: null,
	dialogs: function() {

		var isStoppedByUser = false;

		var textViewStatus = $.e("span", {"class": "tip", html: "loading.."});
		var progressBar = new ProgressBar(0, 100);

		var COUNT_FETCH_CONVERSATIONS_PER_REQUEST = 200;

		var modal = new Modal({
			title: "Анализатор",
			content: $.e("div", {
				append: [
					textViewStatus,
					progressBar.getNode()
				]
			}),
			footer: [
				{
					name: "cancel",
					title: "Отмена",
					onclick: function() {
						isStoppedByUser = true;
						modal.close();
					}
				}
			],
			uncloseableByBlock: true,
			width: 400
		}).show();

		var setStatus = function(text, current, max) {
			if (!isNaN(current) && !isNaN(max)) {
				var percent = current * 100 / max;
				var str = percent.toFixed(1);


				textViewStatus.textContent = formatNumber(current) + "/" + formatNumber(max) + " (" + str + "%)";
				progressBar.setValue(percent);
				modal.setTitle(text + ": " + str + "%");
			}
		};

		var getPeerIds = function() {
			return new Promise(function(resolve, reject) {
				if (Instruments.__dialogsCache) {
					resolve(Instruments.__dialogsCache);
				} else {
					var ids = [];
					var request = function(offset) {
						if (isStoppedByUser) {
							reject({__reason: "BY_USER"});
							return;
						}

						api("execute", {
							code: "var o=parseInt(Args.o),l=parseInt(Args.l),m=API.messages.getConversations({offset:o,count:l});return{d:m.items@.conversation@.peer@.id,c:m.count};",
							o: offset || 0,
							l: COUNT_FETCH_CONVERSATIONS_PER_REQUEST,
							v: api.VERSION_FRESH
						}).then(function(data) {
							if (!data.d) {
								return;
							}

							var left = data.c - ids.length;

							ids = ids.concat(data.d);

							setStatus("Сбор списка", ids.length, data.c);

							if (left) {
								setTimeout(function () {
									request(offset + COUNT_FETCH_CONVERSATIONS_PER_REQUEST);
								}, 350);
							} else {
								resolve(Instruments.__dialogsCache = ids);
							}
						});
					};

					request(0);
				}
			});
		};

		var countAll = function(ids) {
			var chunks = ids.inGroupsOf(25).map(function(chunk) {
				return "return[" + chunk.filter(function(a) {
					return !!a;
				}).map(function(id) {
					return "[" + id + ",API.messages.getHistory({peer_id:" + id + "}).count]";
				}).join(",") + "];";
			});

			return new Promise(function(resolve) {
				var result = [];
				var req = function(i) {
					api("execute", {
						code: chunks[i],
						v: api.VERSION_FRESH
					}).then(function(res) {
						result = result.concat(res);
						setStatus("Просчёт", result.length, ids.length);
						if (chunks[i + 1]) {
							req(i + 1);
						} else {
							resolve(result);
						}
					});
				};

				req(0);
			});

		};

		var show = function(result) {

			result.sort(function(a, b) {
				return b[1] - a[1];
			});

			console.log(result);

			var e = $.e;

			var count = result.reduce(function(p, c) { return p + c[1]; }, 0);

			var table = e("table", {"class": "analyzer-table sizefix"});

			var percent = function (n) {
				return (n * 100 / count).toFixed(2) + "%";

			};

			var userIds = [];
			var chatIds = [];
			var groupIds = [];

			var row = function(item, n) {
				var peerId = item[0];
				var peer = new Peer(peerId);

				if (peer.isChat()) {
					chatIds.push(peer.getId());
				} else if (peer.isGroup()) {
					groupIds.push(peer.getId());
				} else {
					userIds.push(peer.getId());
				}

				return e("tr", {
					append: [
						e("td", {"class": "analyzer-dialogs-name", html: n + 1}),
						e("td", {"class": "mail-tsrt", append:
							e("a", {
								href: "#im?peer=" + peer.get(),
								id: "analyze_list_peer_" + peer.get(),
								html: (peer.isGroup() ? "group" : (peer.isChat() ? "chat" : "id")) + peer.getId()
							})
						}),
						e("td", {"class": "analyzer-table-value", html: formatNumber(item[1])}),
						e("td", {"class": "analyzer-table-value", html: percent(item[1])})
					]
				});
			};

			result.forEach(function(peer, i) {
				table.appendChild(row(peer, i));
			});

			var wrap = e("div", {append: [
				Site.getPageHeader("Статистика сообщений в диалогах"),
				table
			]});

			modal.setContent(wrap)
			     .setTitle("Результаты")
			     .setWidth(500)
			     .setPadding(false);

			fetchUserGroupsChatsInfo(userIds, groupIds, chatIds);
		};

		var fetchUserGroupsChatsInfo = function(userIds, groupIds, chatIds) {

			var type = 0;
			var offset = 0;

			var next = function() {
				var source = [userIds, groupIds, chatIds][type];
				var splitBy = [200, 100, 20][type];
				var ids = source.slice(offset, offset + splitBy).join(",");

				api(
					["users.get", "groups.getById", "messages.getChat"][type],
					[
						{ user_ids: ids },
						{ group_ids: ids },
						{ chat_ids: ids }
					][type]
				).then(function(data) {

					for (var i = 0, l = data.length; i < l; ++i) {
						var r = data[i];
						var text;
						var id;

						switch (type) {
							case 0: // user
								text = getName(r);
								id = r.id;
								break;

							case 1: // group
								text = r.name;
								id = -r.id;
								break;

							case 2: // chat
								text = r.title;
								id = Peer.LIMIT + r.id;
								break;
						}

						var node = $.element("analyze_list_peer_" + id);

						node && (node.textContent = text);
					}

					if (source.length > offset + splitBy) {
						offset += splitBy;
					} else if (type < 2) {
						type++;
						offset = 0;
						next();
					} else {
						console.log("all data loaded");
					}
				});
			};

			next();
		};


		getPeerIds().then(countAll).then(show);
	},

	/**
	 * CENSOR
	 */
	__censoredWords: null,

	__getCensoredWords: function() {
		var self = this;
		return this.__censoredWords
			? Promise.resolve(this.__censoredWords)
			: fetch("/assets/censored_words.json").then(function(res) {
				return self.__censoredWords = res.json();
			});
	},

	/**
	 * SELECT DIALOG
	 */
	selectDialog: function(onSelect) {
		var e = $.e,
			list = e("div"),
			modal = new Modal({
				title: "Выберите диалог для анализа",
				content: getLoader(),
				footer: [
					{
						name: "cancel",
						title: Lang.get("general.cancel"),
						onclick: function () {
							this.close();
						}
					}
				]
			}).setPadding(false).show();

		api("messages.getConversations", {
			fields: "photo_50,online,sex",
			count: 100,
			extended: 1,
			offset: 0,
			preview_length: 1,
			v: api.VERSION_FRESH,
		}).then(function(data) {
			Local.add(data.profiles);
			Local.add(data.groups);

			return data.items;
		}).then(function(items) {

			var callback = function(peerId, info) {
				onSelect(peerId, info);
				modal.close();
			};

			items.forEach(function(item) {
				var peerId = item.conversation.peer.id;

				var tmp, info;
				if (item.conversation.peer.type === "chat") {
					tmp = item.conversation.chat_settings;
					info = {
						id: peerId,
						name: tmp.title,
						photo_50: tmp.photo_50 || "about:blank"
					};
				} else {
					tmp = Local.data[peerId];
					info = tmp;
					info.id = peerId;
				}

				list.appendChild(Templates.getListItemUserRow(info, {
					simpleBlock: true,
					onClick: callback.bind(null, peerId, info)
				}));
			});

			modal.setContent(list);
		});
	},

	/**
	 * LOADER DIALOG CONTENT
	 */
	loadDialogContent: function(peerId, modal) {

		var countMessagesInDialog = -1;

		var isStoppedByUser = false;

		var loadChunkOfMessages = function(offset, resolve) {
			if (offset === false || isStoppedByUser) {
				return;
			}

			modal.status.textContent = "Загрузка сообщений... [" + formatNumber(offset) + "-" + formatNumber(Math.min(offset + 5000, countMessagesInDialog)) +" / " + formatNumber(countMessagesInDialog) + "]";

			modal.progress.setValue(offset);

			var code = "var p=parseInt(Args.p),o=parseInt(Args.o),s=parseInt(Args.s),m=parseInt(Args.m),r=[],i=0;while(i<m){r=r+(API.messages.getHistory({peer_id:p,offset:o+i*s,count:200}).items);i=i+1;};return r;";

			api("execute", {
				p: peerId,
				o: offset,
				s: 200,
				m: 25,
				v: api.VERSION_FRESH,
				code: code
			}).then(function(data) {
				var isFull = saveMessages(data);
				if (!isFull) {
					setTimeout(function() {
						loadChunkOfMessages(offset + data.length, resolve);
					}, 300);
				} else {
					resolve(store);
				}
			});
		};

		var store = [];

		var saveMessages = function(messages) {
			messages.forEach(function(chunk) {
				Sugar.Array.insert(store, chunk);
			});

			return store.length === countMessagesInDialog;
		};

		modal.status.textContent = "Получение количества сообщений в диалоге...";
		modal.progress.setMax(10).setMin(0).setValue(1);

		return api("execute", {
			code: "return API.messages.getHistory({peer_id:parseInt(Args.p),count:1}).count;",
			p: peerId,
			v: api.VERSION_FRESH
		}).then(function(count) {
			countMessagesInDialog = count;

			modal.progress.setValue(10);
			modal.status.textContent = "Получено количество сообщений в диалоге: " + count;

			return new Promise(function(resolve) {
				setTimeout(function() {
					modal.progress.setMax(count).setValue(0);
					loadChunkOfMessages(0, resolve);
				}, 350);
			});
		});
	},


	/**
	 * Dialog analyzer
	 * @param {int} peerId
	 * @param {User|Chat} peerInfo
	 */

	dialog: function(peerId, peerInfo) {
		var modal = new Modal({
			title: "Анализатор диалога",
			width: 450,
			content: "",
			footer: [
				{
					name: "cancel",
					title: Lang.get("general.cancel"),
					onclick: function () {
						this.close();
					}
				}
			]
		});

		modal.status = $.e("span", {"class": "tip"});
		modal.progress = new ProgressBar(0, 100);

		modal.setContent($.e("div", {append: [modal.status, modal.progress.getNode()]}));

		modal.show();

		var censoredWords = [];


		var RE_trimmer = RegExp("[()\\[\\]{}<>\\s,.:;'\"_\\/\\\\|?\\*+!@#$%^=~—¯-]+", "igm");
		var RE_spaces = RegExp("\\s{2,}", "gm");

		var ignoredWords = ["не", "а", "я", "с", "и", "в", "у", "то", "как", "по", "о", "к", "или", "на", "но", "что", "кто", "http", "https", "a", "of", "i", "it", "is"];

		var labels = {
			messages: "Сообщений от ...",
			words: "Слов в сообщениях от ...",
			abuseWords: "Использование мата (количество слов)",
			photo: "Фотографии",
			video: "Видеозаписи",
			audio: "Аудиозаписи",
			doc: "Документы",
			link: "Ссылки",
			audio_message: "Голосовые сообщения",
			sticker: "Стикеры",
			graffiti: "Граффити",
			wall: "Посты",
			poll: "Опросы"
		};

		var statsShowAsUser = ["messages", "words", "abuseWords", "photo", "video", "audio", "doc", "sticker", "link", "audio_message", "graffiti", "post", "poll"]; // TODO надо ли?

		var stats = {};
		var words = {};

		Sugar.Object.keys(labels).map(function (key) {
			stats[key] = {};
		});

		var inc = function (obj, key) {
			if (!(key in obj)) {
				obj[key] = 0;
			}
			++obj[key];
		};

		var addRow = function (table, label, value) {
			table.appendChild($.e("tr", {
				append: [
					$.e("td", {"class": "analyzer-dialog-name", html: label}),
					$.e("td", {"class": "analyzer-table-value", html: value})
				]
			}));
		};

		var addRowUser = function (table, userId, value, all) {
			var user = userId ? Local.data[userId] : {name: "всего"};

			addRow(
				table,
				user ? getName(user) : "user_" + userId,
				formatNumber(value) + " (" + (value / all * 100).toFixed(2) + "%)"
			);
		};

		var handleMessage = function (m, i) {
			!(i % 100) && modal.progress.setValue(i);

			inc(stats.messages, m.from_id);

			if ("text" in m) {
				m.text.replace(RE_trimmer, " ")
				 .replace(RE_spaces, "")
				 .split(" ")
				 .forEach(function (word) {
					 word = word.trim().toLowerCase();

					 if (!word || ~ignoredWords.indexOf(word)) {
						 return;
					 }

					 inc(stats.words, m.from_id);
					 inc(words, word);

					 if (~censoredWords.indexOf(word)) {
						 inc(stats.abuseWords, m.from_id);
					 }
				 });
			} else {
				console.log("NO TEXT", m);
			}

			m.attachments && m.attachments.forEach(function (a) {
				if (a.type in stats) {
					if (a.type === "doc" && "preview" in a.doc && !("photo" in a.doc.preview)) {
						var key = "audio_message" in a.doc.preview
							? "audio_message" : "graffiti";
						inc(stats[key], m.from_id);
						return;
					}

					inc(stats[a.type], m.from_id);
				}
			});
		};

		var a = Sugar.Object.map(words, function (value, key) {
			return {word: key, value: value};
		});

		var topWords = Sugar.Object.values(a);

		topWords.sort(function (a, b) {
			return b.value - a.value;
		});
		console.log(words, topWords);

		Instruments.__getCensoredWords().then(function (words) {
			censoredWords = words;
		});

		Instruments.loadDialogContent(peerId, modal).then(function (messages) {
			modal.status.textContent = "Обработка сообщений...";
			messages.forEach(handleMessage);

			return stats;
		}).then(function (stats) {
			var table = $.e("table", {"class": "analyzer-table sizefix"});

			for (var key in stats) {
				if (!stats.hasOwnProperty(key)) {
					continue;
				}

				var all = Sugar.Object.sum(stats[key]);

				if (!all) {
					continue;
				}

				table.appendChild($.e("tr", {
					"class": "analyzer-header",
					append: $.e("td", {
						colspan: 2,
						html: key in labels ? labels[key] : key
					})
				}));

				addRow(table, "всего", all);

				var items = [];
				for (var userId in stats[key]) {
					if (!stats[key].hasOwnProperty(userId)) {
						continue;
					}

					items.push({userId: userId, value: stats[key][userId]});
				}

				items.sort(function (a, b) {
					return b.value - a.value;
				});

				items.forEach(function (item) {
					if (~statsShowAsUser.indexOf(key)) {
						addRowUser(table, item.userId, item.value, all);
					} else {
						addRow(table, item.userId, item.value);
					}
				})
			}

			table.appendChild($.e("tr", {
				"class": "analyzer-header",
				append: $.e("td", {
					colspan: 2,
					html: "Топ 100 самых используемых слов"
				})
			}));

			topWords.forEach(function (item) {
				addRow(table, item.word, item.value);
			});


			modal.setContent($.e("div", {append: table})).setPadding(false);
		});
	},

	/**
	 * @param {int} peerId
	 * @param {User|{id: int, name: string, photo_50: string}} peerInfo
	 */
	createArchive: function(peerId, peerInfo) {
		var modal = new Modal({
			title: "Сохранение диалога",
			width: 450,
			content: "",
			footer: [
				{
					name: "cancel",
					title: Lang.get("general.cancel"),
					onclick: function() {
						this.close();
					}
				}
			]
		});

		modal.status = $.e("span", {"class": "tip"});
		modal.progress = new ProgressBar(0, 100);

		modal.setContent($.e("div", {append: [ modal.status, modal.progress.getNode() ]}));

		modal.show();

		var getSizes = function(sizes) {
			var assoc = {};
			for (var i = 0; i < sizes.length; ++i) {
				assoc[sizes[i].type] = sizes[i].url;
			}
			return assoc;
		};

		var processAttachments = function(msg) {
			if (msg.attachments) {
				if (msg.attachments.length) {
					msg.attachments = msg.attachments.map(function(a) {
						switch (a.type) {
							case "photo":
								var o = getSizes(a.photo.sizes);
								delete a.photo.sizes;
								a.photo.src_thumb = o.o || o.m || o.s;
								a.photo.src_max = o.w || o.z || o.y || o.x;
								break;

							case "audio":
								delete a.audio.url;
								delete a.audio.is_licensed;
								delete a.audio.is_hq;
								delete a.audio.ads;
								delete a.audio.access_key;
								delete a.audio.track_code;
								delete a.audio.is_explicit;
								delete a.audio.main_artists;
								delete a.audio.featured_artists;
								break;
						}
						return a;
					});
				} else {
					delete msg.attachments;
				}
			}
		};

		Instruments.loadDialogContent(peerId, modal).then(function(messages) {
			modal.status.textContent = "Обработка...";

			messages.forEach(function(msg) {
				delete msg.important;
				delete msg.peer_id;
				delete msg.conversation_message_id;
				delete msg.is_hidden;
				delete msg.random_id;

				msg.cmid = msg.conversation_message_id;
				delete msg.conversation_message_id;

				if (msg.fwd_messages) {
					if (!msg.fwd_messages.length) {
						delete msg.fwd_messages;
					} else {
						msg.fwd_messages.forEach(function(m) {
							processAttachments(m);
						})
					}
				}

				processAttachments(msg);
			});

			var blob = new Blob(["\ufeff", JSON.stringify({
				meta: {
					v: "2.0",
					peer: peerId,
					ownerId: API.userId,
					owner: { name: peerInfo.name, firstName: peerInfo.first_name, lastName: peerInfo.last_name},
					d: getUnixTime(),
				},
				data: messages
			})], {
				type: "application/json;charset=utf-8"
			});

			modal.setContent("Готово").closeAfter(5000);

			saveAs(blob, "dialog" + peerId + ".v2.json");
		});
	},


	showFormOpenArchive: function() {

		var openFile = function(fileNode) {
			var file = fileNode.files[0];

			if (!file) {
				return alert("Вы не выбрали файл");
			}

			var fr = new FileReader();
			fr.onerror = function(event) {
				console.error("Instruments.showFormOpenArchive@openFile", event);
				alert("Произошла ошибка чтения файла.\n\n" + event.toString());
			};

			fr.onload = function(event) {
				return Instruments.openArchive(fr.result);
			};

			fr.readAsText(file);
		};

		var form = $.e("form", {
			"class": "sf-wrap",
			onsubmit: function (event) {
				event.preventDefault();
				openFile(this.file);
				return false;
			},
			append: [
				$.e("p", {html: "Выберите файл .json, который Вы сохранили с помощью инструментов APIdog. Поддерживается на данный момент только архивы версии 2.0 и выше."}),
				Site.createFileChooserButton("file", {fullWidth: true, required: true}),
				$.e("input", {type: "submit", value: "Открыть"})
			]
		});

		Site.append(form);
	},

	openArchive: function(data) {

		var items = $.e("div");
		var peer;

		var check = function(resolve) {
			if (!data) {
				throw new ReferenceError("No data");
			}

			data = JSON.parse(data);

			console.log(data);

			if (!("meta" in data)) {
				throw new ReferenceError("No meta info");
			}

			peer = new Peer(data.meta.peer);

			if (!("v" in data.meta) || data.meta.v < 2.0) {
				throw new TypeError("Not supported version");
			}


			/**
			 * "peer":407912003,"ownerId":203384908,"owner":{"firstName":"Алексей","lastName":"Калинин"}
			 */

			resolve(data = data.data);
		};

		var offset = 0;
		var STEP = 50;

		var busy = false;

		var showChunk = function() {

			var arg = {peer: peer};
			for (var limit = offset + STEP ; offset < limit; ++offset) {
				items.appendChild(IM.item(data[offset], arg));
			}

			busy = false;
		};

		window.onScrollCallback = function (event) {
			if (!busy && event.needLoading) {
				busy = true;
				showChunk();
			}
		};

		new Promise(check).then(showChunk);

		Site.append(items);
	},

	downloadAlbum: function(url) {

		var modal;
		var status = $.e("span", {});
		var progress = new ProgressBar(0, 1);

		var createAssocPhotoSizesObject = function(sizes) {
			return sizes.reduce(function(obj, curr) {
				obj[curr.type] = curr.url;
				return obj;
			}, {});
		};

		var getMaxSizePhoto = function(sizes) {
			var s = createAssocPhotoSizesObject(sizes);
			return s.w || s.z || s.y || s.x;
		};

		var getAlbumContents = function(ownerId, albumId) {
			status.textContent = "Получаю содержимое альбома...";
			return api("execute", {
				code: "var o=parseInt(Args.o),a=parseInt(Args.a),m=parseInt(Args.m),i=0,d=[],c=1,q;while(i<25&&d.length<c){q=API.photos.get({owner_id:o,album_id:a,count:m,offset:i*m});c=q.count;d=d+q.items@.sizes;i=i+1;};return d;",
				o: ownerId,
				a: albumId,
				m: 1000,
				v: api.VERSION_FRESH
			}).then(function(photos) {
				status.textContent = "Обработка прямых ссылок...";
				progress.setValue(1);
				return photos.map(getMaxSizePhoto);
			});
		};

		var fetchAllPhotos = function(urls) {

			var photos = [];

			var curr = 0;

			status.textContent = "Скачивание фотографий...";
			progress.setValue(0).setMax(urls.length);

			var downloadPhoto = function(onload) {
				fetch(urls[curr]).then(function(result) {
					return result.blob();
				}).then(function(blob) {
					photos.push(blob);
					progress.setValue(curr);
					setTimeout(onload, 50);
				});
			};

			return new Promise(function(resolve) {


				var onDone = function() {
					resolve(photos);
				};

				var onLoaded = function() {
					curr++;
					if (curr < urls.length) {
						downloadPhoto(onLoaded)
					} else {
						onDone();
					}
				};

				downloadPhoto(onLoaded);

			});
		};

		var makeZip = function(photos) {
			status.textContent = "Создание архива...";

			var zip = new JSZip;

			photos.forEach(function(photo, i) {
				!(i % 20) && progress.setValue(i);
				zip.file((i + 1) + ".jpg", photo);
			});

			status.textContent = "Генерация архива...";
			progress.setMax(1).setValue(0);

			zip.generateAsync({ type: "blob" }).then(function(content) {
				saveAs(content, "photos.zip");
				status.textContent = "Готово";
				progress.setValue(1);
				modal.closeAfter(5000);
			});
		};

		var process = function(url) {
			var regex = /album(-?\d+)_(\d+)/ig;

			var ids = regex.exec(url);

			if (!ids) {
				alert("Не могу спарсить ownerId и albumId.");
				return;
			}

			var ownerId = +ids[1];
			var albumId = +ids[2];

			if (!ownerId || !albumId) {
				alert("Не могу спарсить ownerId и albumId.");
				return;
			}

			includeScripts(["/lib/jszip.min.js"])
				.then(getAlbumContents.bind(null, ownerId, albumId))
				.then(fetchAllPhotos)
				.then(makeZip);
		};

		if (!url) {
			url = prompt("Введите/вставьте ниже ссылку на альбом", "");
		}

		if (!url || !url.trim()) {
			alert("Не вставлена ссылка");
			return;
		}

		process(url);

		modal = new Modal({
			title: "Скачать альбом",
			content: $.e("div", {append: [status, progress.getNode()]}),
			unclosableByBlock: true
		});

		modal.show();
	}


};