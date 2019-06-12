var Instruments = {

	showList: function() {

		var items = [
			{ title: "Анализатор диалогов", click: this.dialogs }
		];

		var sl = new SmartList({
			data: {count: 0, items: items},
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
						e("td", {"class": "mail-tsrv", html: formatNumber(item[1])}),
						e("td", {"class": "mail-tsrv", html: percent(item[1])})
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

};