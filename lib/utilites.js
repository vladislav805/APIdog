var Analyzes = {
	open: function (name, ownerId)
	{
		switch (name)
		{
			case "dialogs":
				return Analyzes.dialogs();

			case "dialog":
				return !ownerId
					? Analyzes.dialogSelect()
					: Analyzes.dialog(ownerId);

			case "wall":
				return Analyzes.wall(ownerId);

			case "dialogOpener":
				return Analyzes.openDialogFile();

			default:
				Analyzes.showAnalysator();
		};
	},
	showAnalysator: function ()
	{
		var e = $.e, item = function (t, l) {
			return e("a", {onclick: l, html: t});
		};

		Site.SetHeader("Утилиты");
		Site.append(e("div",
		{
			append: [
				Mail.getListMessagesTabs(),
				Site.CreateHeader("Утилиты", null, v65HeaderStyle),
				e("div",
				{
					"class": "profile-lists",
					append: [
						item("Анализ списка диалогов", Analyzes.dialogs),
						item("Анализ диалога", Analyzes.dialogSelect),
						item("Анализ стены", Analyzes.wall),
						item("Открыть файл сохраненной переписки", Analyzes.openDialogFile)
					]
				})
			]
		}));
	},

	dialogSelect: function (offset) {
		var e = $.e, wrap, head, list, modal = new Modal({
			title: "Выберите диалог для анализа",
			content: Site.Loader(true),
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
		offset = !isNaN(offset) ? offset : 0;
		Site.API("execute",
		{
			code: "var m=API.messages.getDialogs({count:100,offset:%o,preview_length:1,v:5.14});return{d:m,u:API.users.get({user_ids:m.items@.message@.user_id,fields:\"photo_50,online,sex\"})};".replace(/%o/ig, offset)
		},
		function (data)
		{
			data = Site.isResponse(data);

			Local.AddUsers(data.u);

			data = data.d;

			if (!offset)
			{
				wrap = e("div", {id: "anmw", append: list = e("div", {id: "anml"})});
				modal.setContent(wrap);
			}
			else
			{
				wrap = $.element("anmw");
				list = $.element("anml");
			};

			data.items.forEach(function (item)
			{
				list.appendChild(Analyzes.analyzeDialogItem(item, modal));
			});
		});
	},
	analyzeDialogItem: function (i, m) {
		var e = $.e,
			i = i.message,
			user = Local.Users[i.user_id || i.from_id],
			peerId = i.chat_id ? -i.chat_id : i.user_id || i.from_id,
			isChat = peerId < 0;
		return e("a",
		{
			"class": "friends-item",
			onclick: function () {
				m.close();
				Analyzes.dialog(peerId);
			},
			append: [
				e("img", {"class": "friends-left", src: getURL(!isChat ? user.photo_50 : i.photo_50 || Mail.DEFAULT_CHAT_IMAGE)}),
				e("div", {"class": "friends-right", append: e("strong", {html: isChat ? Site.Escape(i.title) : getName(user)})})
			]
		});
	},

	dialog: function (peerId)
	{

		var e = $.e,
			l = Lang.get,

			isStoppedByUser = false,

			mdModal = new Modal({
					title: "Анализатор диалога",
					content: $.e("div", {append: [
						tsStatus = $.e("span", {"class": "tip", html: "0/0"}),
						(pbStatus = new ProgressBar(0, 100)).getNode()
					]}),
					footer: [
						{
							name: "cancel",
							title: "Отмена",
							onclick: function (event) {
								isStoppedByUser = true;
								mdModal.close();
							}
						}
					],
					uncloseableByBlock: true,
					width: 400
				}).show(),

			page = e("div", {append: [
				Site.CreateHeader("Анализ диалога", null, v65HeaderStyle),
				wrap = e("div", {"class": "msg-empty tip mail-analyzer", append: [
					Mail.getMaterialLoader()
				]})
			]}),

			setStatus = function (text, current, max)
			{
				if (!isNaN(current) && !isNaN(max))
				{
					percent = (current * 100 / max).toFixed(1);
					tsStatus.innerHTML = formatNumber(current) + "/" + formatNumber(max);
					mdModal.setTitle("Загружаю сообщения: " + percent + "%");
					pbStatus.setValue(percent);
				};
				mdModal.setTitle(text + ": " + percent + "%");
			},

			init = function ()
			{
				setStatus("Инициализация", 0, 1);
				Site.API("execute",
				{
					code: (
						peerId > 0
							? "var o=%o;return{u:API.users.get({user_ids:o,fields:\"photo_100,online,first_name_ins,last_name_ins\",v:5})[0],m:API.messages.getHistory({user_id:o,v:5}).count};"
							: "var o=%o;return{c:API.messages.getChat({chat_id:o,v:5}),m:API.messages.getHistory({chat_id:o}).count};"
					).replace(/%o/i, Math.abs(peerId))
				},
				function (result)
				{
					result = Site.isResponse(result);
					saveInfo(result);
				});
				return page;
			},

			dialogInfo,

			saveInfo = function (result) {
				dialogInfo = {
					user: result.u,
					chat: result.c,
					count: result.m,
					isChat: !!result.c
				};
				start(0);
			},
			start = function (offset)
			{
				if (offset === false || isStoppedByUser) return;
				setStatus("Загружаю сообщения", offset, dialogInfo.count);
				var str = [], t = (peerId > 0 ? "user" : "chat");
				for (var i = 0, l = 25; i < l; ++i)
				{
					str.push("API.messages.getHistory({" + t + "_id:" + Math.abs(peerId) + ",v:5,offset:" + (offset + (i * 200)) + ",count:200}).items");
				};
				Site.API("execute",
				{
					code: "return[" + str.join(",") + "];"
				},
				function (data)
				{
					data = Site.isResponse(data);
					if ((data = saveMessages(data)).isFull)
					{
						analyze(data.messages);
						setTimeout(function () { start(offset + (25 * 200)) }, 300);
					}
					else
					{
						analyze(data.messages);
						showStat(stat);
					};
				});
			},

			db = [],
			saveMessages = function (data, offset)
			{
				var messages = [], isFull = true;
				data.forEach(function (item)
				{
					if (Array.isArray(item))
						messages = messages.concat(item);
				});
				isFull = data[data.length - 1] && data[data.length - 1].length == 200;
				data = null;
				db = db.concat(messages);

				return {messages: messages, isFull: isFull};
			},

			stat = {
				attachments: 0,
				photos: 0,
				videos: 0,
				audios: 0,
				docs: 0,
				walls: 0,
				wall_replys: 0,
				maps: 0,
				stickers: 0,
				forwarded: 0,
				users: {},
				censored: 0,
				welcomes: 0,
				comings: 0,
				abuses: 0,
				words: {},
				wordsCount: 0,
				dates: {}
			},

			analyze = function (messages)
			{
				//setStatus("Анализ...", 0, dialogInfo.count);
				messages.forEach(function (message, index)
				{
					updateInfo(message);
				});
			},

			censor = function ()
			{
				return /(^|\s)((д(о|o)+лб(а|a)+)?(е|e|ё)+(б|п)т?(а|a)+?|(п(р|p)и+)?пи+(з|3)д((а|a)+(н(у|y)+т(ы+(й+|а+я+|(е|e)+))?)?|(е|e)+ц)|((з|3)(а|a)+)?(е|e|ё)+((б|п)(а|a)+?(л((о|o)+|(е|e)+т)?|н(у+т)?(ь((с|c)я+)?|ый?)|ть?|ыш|и+(с|c)ь)?)?|(о|o|а|a)+?(х|x)(у|y)+(й(ня)?|(е|e|ё)+((с|c)(о|o)+(с|c)|в|н|л(а|a)*)(н?(ы+й|(а|a)+я|(о|o)+(е|e)+)|ш(ий|(а|a)я|(о|o)(е|e))|а|a|ый|лa?)?)|пи+д(о|o|а|a)+?(р|p)+((а|a)+?(с|c)?ы?)?|бл((е|e)+(а|a)+|я+)(ть)?)(?=(\s|$))/img;
			},

			ignore = ["не", "а", "я", "с", "и", "в", "у", "то", "как", "по", "о", "к", "или", "на", "но", "что", "кто", "http", "https", "a", "of", "i", "it", "is"],

			n2 = function (n)
			{
				return n < 10 ? "0" + n : n;
			},

			getDate = function (m)
			{
				var d = new Date((m.date || m) * 1000);
				return d.getFullYear() + "-" + n2(d.getMonth() + 1) + "-" + n2(d.getDate());
			},

			updateInfo = function (i)
			{
				var fromId = i.from_id || i.user_id, d;
				if (stat.users[fromId]) stat.users[fromId]++; else stat.users[fromId] = 1;
				if ((d = getDate(i)) && stat.dates[d]) stat.dates[d]++; else stat.dates[d] = 1;
				if (i.attachments)
				{
					stat.attachments += i.attachments.length;
					i.attachments.forEach(function (l)
					{
						stat[l.type + "s"]++;
					});
				};
				if (i.geo)
					stat.maps++;
				if (i.fwd_messages)
					stat.forwarded += i.fwd_messages.length;
				if (censor().test(i.body))
					stat.censored++;
				if (/(прив(ет)?|зда?р(а|о)в(ствуй(те)?)?|hi|hello|qq|добр(ый|ой|ого|ое)\s(день|ночи|вечер|утро))/i.test(i.body))
					stat.welcomes++;
				if (/(пока|до\s?св(и|е)дания|спок(ойной ночи|и)?|пэздуй с мопэда|до (завтр(а|о)|встречи))/i.test(i.body))
					stat.comings++;
				if (/(д(е|и)+б(и+л)?|д(о|а)+лб(о|а)+е+б|ху+(е|и)+с(о|а)+с|у?еб(ла+(н|сос)|ок)|му+да+к|пи+до+?р(ила+)?|даун|су+ка+)/i.test(i.body))
					stat.abuses++;
				i.body.replace(/[\(\)\[\]\{\}<>\s,.:;'\"_\/\\\|\?\*\+!@#$%\^=\~—¯_-]+/igm, " ").replace(/\s{2,}/gm, "").split(" ").forEach(function (word)
				{
					word = word.trim().toLowerCase();
					stat.wordsCount++;
					if (!word || ~ignore.indexOf(word)) return;
					stat.words[word] = stat.words[word] ? stat.words[word] + 1 : 1;
				});

			},

			showStat = function (d)
			{
			//	mdModal.close();
				var min = 0, max, words = [], dates = [], MAX_LIST_SIZE = 100, word, date;

				for (word in stat.words)
				{
					words.push([stat.words[word], word]);
				};
				words.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0 });
				if (words.length > MAX_LIST_SIZE)
					words.length = MAX_LIST_SIZE;

				for (date in stat.dates)
				{
					dates.push([stat.dates[date], date]);
				};
				dates.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0 });
				if (dates.length > MAX_LIST_SIZE / 3.3)
					dates.length = parseInt(MAX_LIST_SIZE / 3.3);

				var wrap = e("table", {}),
					header = Site.CreateHeader("Итог анализа " + (
						!dialogInfo.isChat
							? "диалога с " + dialogInfo.user.first_name_ins + " " + dialogInfo.user.last_name_ins
							: "беседы «" + dialogInfo.chat.title + "»"
						), null, v65HeaderStyle),
					page = e("div", {
						"class": "mail-analyzer-summary",
						append: [
							header,
							wrap
						]
					}),
					row = function (key, value) { wrap.appendChild(e("tr", {append: [
						e("th", { html: key }),
						e("td", { html: isNaN(value) ? value : formatNumber(value), align: "right" })
					]})) };


				row("Сообщений всего", db.length);
				row("Слов всего", d.wordsCount);
				row("Всего прикреплений", d.attachments);
				row("Фотографий", d.photos);
				row("Видеозаписей", d.videos);
				row("Аудиозаписей", d.audios);
				row("Документов", d.docs);
				row("Постов", d.walls);
				row("Комментариев", d.wall_replys);
				row("Карт", d.maps);
				row("Стикеров", d.stickers);
				row("Пересланных сообщений", d.forwarded);
				row("Нецензурных слов", d.censored);
				row("Оскорблений", d.abuses);
				row("Приветствий", d.welcomes);
				row("Прощаний", d.comings);

				showStatWords(page, words);

				showStatUsers(page, d.users);

				showStatDates(page, dates);

				showDownloadForm(page);

				//Site.append(page);
				mdModal.setTitle("Результаты анализа").setContent(page).setWidth(500).setPadding(false);
			},
			showStatWords = function (node, words)
			{
				var wn = e("div"), wnl, wnls = "list-style: inside decimal;", wnlc = "color: gray;";
				wn.appendChild(Site.CreateHeader("100 самых часто используемых слов в диалоге", null, v65HeaderStyle));
				wn.appendChild(wnl = e("ol", {style: "padding: 8px 12px"}));

				words.forEach(function (item)
				{
					wnl.appendChild(e("li", {
						html: item[0] + " " + $.textCase(item[0], ["раз", "раза", "раз"]) + " &mdash; &laquo;" + Mail.Emoji(item[1]) + "&raquo;",
						style: wnls + (censor().test(item[1]) ? wnlc : "")
					}));
				});
				node.appendChild(wn);
			},
			showStatDates = function (node, dates)
			{
				var wn = e("div"), wnl, wnls = "list-style: inside decimal;", wnlc = "color: gray;";
				wn.appendChild(Site.CreateHeader("30 самых &laquo;общительных&raquo; дней в диалоге", null, v65HeaderStyle));
				wn.appendChild(wnl = e("ol", {style: "padding: 8px 12px"}));

				dates.forEach(function (item)
				{
					wnl.appendChild(e("li", {
						html: item[0] + " " + $.textCase(item[0], ["сообщение", "сообщения", "сообщений"]) + " &mdash; " + getDateNormal(item[1])
					}));
				});
				node.appendChild(wn);
			},
			getDateNormal = function (d)
			{
				return d.split("-").reverse().join(".");
			},
			showStatUsers = function (node, data)
			{
				var list = e("table"),
					unknown = [],
					user,
					stdUser = {first_name: "DELETED", last_name: "DELETED"},
					item = function (i)
					{
						var userId = i[0], value = i[1];
						user = Local.Users[userId];
						if (!user)
						{
							Site.queueUser(userId);
							user = stdUser;
						};
						list.appendChild(e("tr", {append: [
							e("td", {append: e("a", {
								"class": "_im_link_" + userId,
								href: "#id" + userId,
								html: getName(user)
							})}),
							e("td", {html: formatNumber(value), align: "right"})
						]}));
					},
					users = [];

				for (var userId in data)
				{
					users.push([userId, data[userId]]);
				};

				users.sort(function (a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });

				users.forEach(item);

				node.appendChild(Site.CreateHeader("Статистика сообщений по отправителям", null, v65HeaderStyle));
				node.appendChild(list);
			},
			d2006 = 1138741200,
			saver = {
				minifyMessage: function (m)
				{
					var o = {
						i: m.id,
						f: m.from_id,
						t: m.body,
						d: m.date - d2006
					};
					if (m.attachments)
						o.a = saver.minifyAttachments(m.attachments);
					if (m.fwd_messages)
						o.m = saver.minifyForwardedMessages(m.fwd_messages);
					return o;
				},
				minifyAttachments: function (a)
				{
					var o;
					return a.map(function (i)
					{
						o = i[i.type];
						switch (i.type)
						{
							case "photo":
								return {
									t: 0,
									s: {
										m: o.photo_2560,
										s: o.photo_1280,
										n: o.photo_807,
										o: o.photo_604,
										t: o.photo_130
									},
									z: o.description || "",
									q: o.lat || 0,
									w: o.long || 0,
									o: o.user_id || o.owner_id,
									i: o.id,
									d: o.date - d2006
								};
							case "video":
								return {
									t: 1,
									o: o.owner_id,
									i: o.id,
									n: o.title,
									z: o.description,
									d: o.date - d2006,
									s: o.duration
								};
							case "audio":
								return {
									t: 2,
									o: o.owner_id,
									i: o.id,
									a: o.artist,
									n: o.title,
									d: o.duration,
									l: o.lyrics_id,
									g: o.genre_id
								};
							case "doc":
								return {
									t: 3,
									o: o.owner_id,
									i: o.id,
									n: o.title,
									e: o.ext,
									s: o.size
								};
							case "sticker":
								return {
									t: 4,
									i: o.id
								};
							default:
								return {
									t: -1,
									s: i.type
								};
						}
					});
				},
				minifyForwardedMessages: function  (a)
				{
					return a.map(function (i)
					{
						var o = {
							f: i.user_id,
							t: i.body,
							d: i.date - d2006
						};
						if (i.attachments)
							o.a = saver.minifyAttachments(i.attachments);
						if (i.fwd_messages)
							o.m = saver.minifyForwardedMessages(i.fwd_messages);
						return o;
					});
				}
			},

			showDownloadForm = function (node)
			{
				node.appendChild(Site.CreateHeader("Загрузка сообщений в файл", null, v65HeaderStyle));
				node.appendChild(e("div", {style: "padding: 8px 12px", append: [
					e("p", {html: "Вы можете загрузить и сохранить все сообщения в формате JSON"}),
					e("p", {html: "Осторожно! Если сообщений много, Ваше устройство может зависнуть"}),
					e("input",
					{
						type: "button",
						value: "Создать JSON-файл",
						onclick: function (event)
						{
							var json = [];
							db.forEach(function (item)
							{
								json.push(saver.minifyMessage(item));
							});
							var blob = new Blob(["\ufeff", JSON.stringify({
								meta: {
									v: "1.2",
									p: peerId,
									a: API.uid,
									t: dialogInfo.isChat
										? dialogInfo.chat.title
										: dialogInfo.user.first_name + " " + dialogInfo.user.last_name,
									d: parseInt(new Date() / 1000),
								},
								data: json
							})], {
								type: "application/json;charset=utf-8"
							});

							saveAs(blob, "dialog" + peerId + ".json");
						}
					})
				]}));
			};
		init();
	},





























	statDialogChate: null,
	dialogs: function ()
	{
		var ids = [],
			e = $.e,
			isEnd = false,
			isStoppedByUser = false,

			pbStatus,

			mdModal = new Modal({
					title: "Анализатор",
					content: $.e("div", {append: [
						tsStatus = $.e("span", {"class": "tip", html: "loading.."}),
						(pbStatus = new ProgressBar(0, 100)).getNode()
					]}),
					footer: [
						{
							name: "cancel",
							title: "Отмена",
							onclick: function (event) {
								isStoppedByUser = true;
								mdModal.close();
							}
						}
					],
					uncloseableByBlock: true,
					width: 400
				}).show(),

			page = e("div", {append: [
				Site.CreateHeader("Анализ диалогов", null, v65HeaderStyle),
				wrap = e("div", {"class": "msg-empty tip mail-analyzer", append: [
					Mail.getMaterialLoader()
				]})
			]}),

			setStatus = function (text, current, max)
			{
				if (!isNaN(current) && !isNaN(max))
				{
					percent = (current * 100 / max).toFixed(1);
					tsStatus.innerHTML = formatNumber(current) + "/" + formatNumber(max) + " (" + percent + "%)";
					pbStatus.setValue(percent);
					mdModal.setTitle(text + ": " + percent + "%");
				};

			},
			loadIds = function (offset)
			{
				if (isStoppedByUser)
				{
					stoppedByUser();
					return;
				};
				Site.API("execute",
				{
					code: "var o=%o,m=API.messages.getDialogs({offset:o,count:200,v:5.0}),d=[],i=0,l=m.items.length;while(i<l){d.push(m.items[i].chat_id?-m.items[i].chat_id:m.items[i].user_id);i=i+1;};return{d:d,e:m.count-(o+l)};"
						.replace(/%o/img, offset || 0)
				},
				function (data)
				{
					data = Site.isResponse(data);
					if (!data.d)
						return;
					ids = ids.concat(data.d);
					setStatus("Собираю список", ids.length, data.e + ids.length);
					if (data.e > 0)
						setTimeout(function () { loadIds(offset + 200); }, 350);
					else
						countAll(0);
				});
			},
			readyResult = [],
			countAll = function (offset)
			{
				if (!offset)
				{
					setStatus("Собираю диалоги", 0, ids.length);
				};
				var str = [], q, data = ids;
				for (var n = offset, m = n + 25; n < m; ++n)
				{
					q = data[n];
					if (!q)
						continue;
					str.push("[" + q + ",API.messages.getHistory({" + (q > 0 ? "user" : "chat") + "_id:" + (q > 0 ? q : -q) + ",v:5}).count]");
				};
				Site.API("execute",
				{
					code: "return[" + str.join(",") + "];"
				},
				function (result)
				{
					result = Site.isResponse(result);
					if (!result)
						return;
					readyResult = readyResult.concat(result);
					setStatus("Собираю диалоги", readyResult.length, ids.length);
					if (ids.length <= n)
						show();
					else
						setTimeout(function () { countAll(offset + 25) }, 350);
				});
			},
			userIds = [],
			chatIds = [],
			show = function ()
			{
			//	mdModal.close();
				var count = 0;
				readyResult.sort(function (a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });
				readyResult.forEach(function (item) { count += item[1] });

				var parent = document.createElement("div"),
					table = document.createElement("table"),
					percent = function (n)
					{
						return (n * 100 / count).toFixed(2) + "%";
					},
					e = $.e,
					row = function (item, n)
					{
						item[0] = item[0] < -2e9 ? (item[0] + 2e9) : item[0];
						(item[0] > 0 ? userIds : chatIds).push(item[0] > 0 ? item[0] : -item[0]);
						return e("tr", {append: [
							e("td", {"class": "mail-tsrn", html: n + 1}),
							e("td", {"class": "mail-tsrt", append:
								e("a", {href: "#im?to=" + item[0], id: "mcri" + item[0], html: item[0] > 0 ? "id" + item[0] : "chat" + -item[0]})
							}),
							e("td", {"class": "mail-tsrv", html: formatNumber(item[1])}),
							e("td", {"class": "mail-tsrv", html: percent(item[1])})
						]});
					};
				table.className = "mail-ts sizefix";
				for (var i = 0, l = readyResult.length; i < l; ++i)
					table.appendChild(row(readyResult[i], i));
				parent.appendChild(Site.CreateHeader("Статистика сообщений в диалогах", null, v65HeaderStyle));
				parent.appendChild(table);

				mdModal.setContent(parent).setTitle("Результаты").setWidth(500).setPadding(false);

				loadInfo(0, 0);
				Analyzes.statDialogChate = readyResult;
			},
			loadInfo = function (type, offset)
			{
				var n = [userIds, chatIds][type],
					ids = n.slice(offset, offset + 200).join(",");

				Site.API(["users.get", "messages.getChat"][type],
				[
					{
						user_ids: ids
					},
					{
						chat_ids: ids
					}
				][type],
				function (data)
				{
					data = Site.isResponse(data);
					var r, id, text;
					for (var i = 0, l = data.length; i < l; ++i)
					{
						r = data[i];
						switch (type)
						{
							case 0: id = "mcri" + data[i].uid; text = getName(data[i]); break
							case 1: id = "mcri-" + data[i].chat_id; text = data[i].title; break;
						};
						$.element(id).innerHTML = text;
					};
					if (n.length > offset + 200)
						loadInfo(type, offset + 200);
					else if (type === 0)
						loadInfo(1, 0);
				});
			};
		if (!Analyzes.statDialogChate)
		{
			loadIds(0);
		}
		else
		{
			readyResult = Analyzes.statDialogChate;
			show();
		};
	},

	wallCache: {},

	wall: function (ownerId)
	{
		//if (!ownerId)
		ownerId = API.uid;
		var q = Analyzes,

			e = $.e,
			l = Lang.get,
			teStatus,
			pbStatus,
			mdModal = new Modal({
					title: "Анализатор",
					content: $.e("div", {append: [
						teStatus = $.e("span", {"class": "tip", html: "loading.."}),
						(pbStatus = new ProgressBar(0, 100)).getNode()
					]}),
					footer: [
						{
							name: "cancel",
							title: "Отмена",
							onclick: function (event) {
								isStoppedByUser = true;
								mdModal.close();
							}
						}
					],
					uncloseableByBlock: true,
					width: 400
				}).show(),
			percent,

			setStatus = function (text, current, max)
			{
				if (isNaN(current) && isNaN(max))
				{
					max = 1;
					current = 0;
					text = "";
				}
				else
				{
					percent = (current * 100 / max).toFixed(1);
					teStatus.innerHTML = formatNumber(current) + "/" + formatNumber(max) + " (" + percent + "%)";
					pbStatus.setValue(percent);
				};
			},

			loadWall = function (offset)
			{
				start(offset);
			},

			wallInfo = {},
			posts = [],

			OFFSET_STEP = 100,

			start = function (offset)
			{
				setStatus("Загрузка записей...", offset, wallInfo.count || 1);
				var str = [];
				for (var i = 0, l = 25; i < l; ++i)
				{
					str.push("API.wall.get({owner_id:" + ownerId + ",v:5,filter:\"all\",offset:" + (offset + (i * OFFSET_STEP)) + ",count:" + OFFSET_STEP + ",extended:1})");
				};
				Site.API("execute",
				{
					code: "return[" + str.join(",") + "];"
				},
				function (data)
				{
					data = Site.isResponse(data);
					if (!offset && data[0])
					{
						wallInfo = {count: data[0].count};
					};
					savePosts(data)
					if (wallInfo.count > posts.length)
					{
						setTimeout(function () { start(offset + (25 * OFFSET_STEP)) }, 300);
					}
					else
					{
						setStatus("Всё загружено.<br\/>Внимание! Возможно зависание", wallInfo.count, wallInfo.count);
						setTimeout(function ()
						{
							analyze();
						}, 1000);
					};
				});
			},
			savePosts = function (data, offset)
			{
				var p = [], isFull = true;
				data.forEach(function (item)
				{
					Local.AddUsers(item.profiles);
					Local.AddUsers(item.groups);
					item = item.items;
					if (Array.isArray(item))
						p = p.concat(item);
				});
				isFull = data[data.length - 1] && data[data.length - 1].length == OFFSET_STEP;
				data = null;
				posts = posts.concat(p);
				p = null;
				return isFull;
			},
			analyze = function ()
			{
				setStatus("Анализ...", 0, wallInfo.count);
				posts.forEach(function (message, index)
				{
					updateInfo(message);
					if (!(index % 25))
						setStatus("Анализ...", index, wallInfo.count);
				});
				showStat(stat);
			},

			stat = {

				owners: 0,
				reposts: 0,
				others: 0,
				userIds: [],
				groupIds: [],

				writers: {},

				attachments: 0,
				photo: 0,
				video: 0,
				audio: 0,
				doc: 0,
				maps: 0,
				album: 0,
				note: 0,
				graffiti: 0,
				poll: 0,
				link: 0,
				page: 0,
				hashtags: 0,
				deletes: 0,

				censored: 0,

				moreLikes: {count: 0, id: 0},
				moreComments: {count: 0, id: 0},
				moreReposts: {count: 0, id: 0},

				countComments: 0,
				countLikes: 0,
				countReposts: 0,

				words: {}
			},

			ignore = ["не", "а", "я", "с", "и", "в", "у", "то", "как", "по", "о", "к", "или", "на", "но", "что", "кто", "http", "https", "a", "of", "i", "it", "is"],

			updateInfo = function (i)
			{
				var fromId = i.from_id || i.user_id;
				if (fromId > 0 && stat.userIds[fromId] || fromId < 0 && stat.groupIds[fromId])
					stat[fromId > 0 ? "userIds" : "groupIds"][fromId]++;
				else
					stat[fromId > 0 ? "userIds" : "groupIds"][fromId] = 1;

				if (i.attachments)
				{
					stat.attachments += i.attachments.length;
					i.attachments.forEach(function (l)
					{
						stat[l.type]++;
					});
				};
				if (i.geo)
					stat.maps++;
				if (/#([^#\s\.]+)/i.test(i.text))
					stat.hashtags++;
				i.text = i.text || "";
				i.text.replace(/[\(\)\[\]\{\}<>\s,.:;'\"_\/\\\|\?\*\+!@#$%\^=\~—¯_-]+/igm, " ").replace(/\s{2,}/gm, "").split(" ").forEach(function (word)
				{
					word = word.trim().toLowerCase();
					if (!word || ~ignore.indexOf(word)) return;
					stat.words[word] = stat.words[word] ? stat.words[word] + 1 : 1;
				});
				if (/(^|\s)((д(о|o)лб(а|a))?(е|e|ё)(б|п)т?(а|a)?|(п(р|p)и)?пи(з|3)д((а|a)(н(у|y)т(ы(й|ая|(е|e)))?)?|(е|e)ц)|((з|3)(а|a))?(е|e|ё)((б|п)(а|a)?(л((о|o)|(е|e)т)?|н(ут)?(ь((с|c)я)?|ый?)|ть?|ыш|и(с|c)ь)?)?|(о|o|а|a)?(х|x)(у|y)(й(ня)?|(е|e|ё)((с|c)(о|o)(с|c)|в|н|л(а|a)?)(н?(ый|(а|a)я|(о|o)(е|e))|ш(ий|(а|a)я|(о|o)(е|e))|а|a|ый|лa?)?)|пид(о|o|а|a)?(р|p)((а|a)?(с|c)?ы?)?|бл((е|e)(а|a)|я)(ть)?)(?=(\s|$))/img.test(i.text))
					stat.censored++;
				stat.countComments += i.comments.count;
				stat.countLikes += i.likes.count;
				stat.countReposts += i.reposts.count;
				if (i.final_post)
					stat.deletes++;
				if (i.copy_history)
					stat.reposts++;
				if (i.to_id != i.from_id)
					stat.others++;
				else
					stat.owners++;
			},

			showStat = function (d)
			{
				var min = 0, max, words = [], MAX_LIST_SIZE = 100;
				for (word in stat.words)
				{
					words.push([stat.words[word], word]);
				};
				words.sort(function (a, b) { return a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0 });
				if (words.length > MAX_LIST_SIZE)
					words.length = MAX_LIST_SIZE;
				var wrap = e("table", {}),
					header = Site.CreateHeader("Итог анализа стены", null, v65HeaderStyle),
					page = e("div", {
						"class": "mail-analyzer-summary",
						append: [
							header,
							wrap
						]
					}),
					row = function (key, value) { wrap.appendChild(e("tr", {append: [
						e("th", { html: key }),
						e("td", { html: isNaN(value) ? value : formatNumber(value), align: "right" })
					]})) };

				var count = posts.length;

				row("Записей", count);
				row("Всего прикреплений", d.attachments);
				row("Фотографий", d.photo);
				row("Видеозаписей", d.video);
				row("Аудиозаписей", d.audio);
				row("Документов", d.doc);
				row("Заметок", d.note);
				row("Альбомы", d.album);
				row("Карт", d.maps);
				row("Опросов", d.poll);
				row("Ссылок", d.link);
				row("Wiki-страниц", d.page);
				row("Всего комментариев", d.countComments);
				row("Всего лайков", d.countLikes);
				row("Всего репостов", d.countReposts);
				row("Постов своих", formatNumber(d.owners) + " (" + (d.owners * 100 / count).toFixed(1) + "%)");
				row("Постов чужих", formatNumber(d.others) + " (" + (d.others * 100 / count).toFixed(1) + "%)");
				row("Постов, содержащих репост", formatNumber(d.reposts) + " (" + (d.reposts * 100 / count).toFixed(1) + "%)");
				row("Удаления страницы", d.deletes);
				row("Постов, содержащих мат", d.censored);

//				showStatWords(page, words);

//				showStatUsers(page, d.users);

//				showDownloadForm(page);

				mdModal.setContent(page).setPadding(false).setTitle("Результаты").setWidth(400);
			};
		if (!q.wallCache[ownerId])
			loadWall(0);
		else
			showResults(q.wallCache[ownerId]);
	},

	openDialogFile: function ()
	{
		var e = $.e,
			pageWrap,
			filePickerForm,
			setActivity = function (node)
			{
				$.elements.clearChild(pageWrap).appendChild(node);
			},
			showFilePicker = function ()
			{
				if (filePickerForm)
				{
					filePickerForm.file.value = "";
					return filePickerForm;
				};

				filePickerForm = e("form",
				{
					onsubmit: function (event)
					{
						event.preventDefault();
						openFile(this.file);
						return false;
					},
					"class": "sf-wrap",
					append: [
						e("p", {html: "Выберите файл .json, который Вы сохранили с помощью анализатора диалога"}),
						Site.CreateFileButton("file", {fullwidth: true, required: true}),
						e("input", {type: "submit", value: "Далее >"})
					]
				});
				return filePickerForm;
			},
			openFile = function (fileNode)
			{
				var file = fileNode.files[0];

				if (!file)
				{
					return alert("Вы не выбрали файл");
				};

				var fr = new FileReader();
				fr.onerror = function (event)
				{
					console.error("Analyzes.openDialogFile@openFile", event);
					alert("Произошла ошибка чтения файла.\n\n" + event.toString());
				};
				fr.onload = function (event)
				{
					console.info("Analyzes.openDialogFile@openFile", event);
					return checkFile(fr.result);
				};
				fr.readAsText(file);
			},
			checkFile = function (data)
			{
				try
				{
					data = JSON.parse(data);
					if (!data.meta || data.meta && (!data.meta.t || !data.meta.v || !data.meta.p || !data.meta.d) || !data.data)
						throw "Неизвестный формат";
				}
				catch (e)
				{
					console.error("Analyzes.openDialogFile@checkFile: ", e);
					return alert("Ошибка чтения файла.\nФайл поврежден и/или имеет неизвестную структуру.")
				}
				finally
				{
					return readFile(data);
				};
			},
			dialogActivity,
			showDialogActivity = function ()
			{
				if (dialogActivity)
				{
					return dialogActivity;
				};

				dialogActivity = e("div", {"class": "imdialog-list imdialog-list-chat"});
				return dialogActivity;
			},
			meta,
			db,
			VERSION,
			d2006 = 1138741200,
			readFile = function (data)
			{
				db = data.data;
				meta = data.meta;
				VERSION = parseInt(meta.v);
				var userIds = [],
					add = function (i)
					{
						if (i.m)
							i.m.forEach(add);
						if (~userIds.indexOf(i.f))
							return;
						userIds.push(i.f);
					};
				data.data.forEach(function (i)
				{
					add(i);
				});
				userIds.length = 1000;
				Site.API("users.get",
				{
					user_ids: userIds.join(","),
					fields: "photo_50,online,first_name_acc,last_name_acc"
				},
				function (result)
				{
					saveUsers(result);
				});
				setActivity(showDialogActivity());
				showItems(0);
			},
			saveUsers = function (users)
			{
				Local.AddUsers(users);

				if (meta.p < 0)
				{
					return;
				};

				var w = Local.Users[meta.p];
				console.log(w)

				$.element("anza").innerHTML = " с " + w.first_name_acc + " " + w.last_name_acc;
			},
			showItems = function (i) {
				for (var l = i + 100, k; i < l; ++i)
				{
					k = db[i];
					if (!k) continue;
					dialogActivity.appendChild(IM.item({
						out: (!meta.a ? API.uid : meta.a) == k.f,
						user_id: k.f,
						from_id: k.f,
						date: k.d + d2006,
						body: k.t,
						read_state: true,
						id: k.i,
						attachments: explainAttachments(k.a),
						fwd_messages: explainForwardedMessages(k.m)
					},
					{
						to: meta.p
					}));
				};
				if (db.length > i + 100)
				{
					var next = i + 100;
					dialogActivity.appendChild(e("div",
					{
						"class": "button-block",
						html: "Далее",
						onclick: function ()
						{
							$.elements.remove(this);
							showItems(next);
						}
					}));
				};
			},
			fixDate = function (u)
			{
				return u + d2006;
			},
			explainAttachments = function (a)
			{
				if (!a)
				{
					return false;
				};
				return a.map(function (i)
				{

					switch (i.t)
					{
						case 0:
							return {type: "photo", photo: {
								photo_2560: i.s.m,
								photo_1280: i.s.s,
								photo_807: i.s.n,
								photo_604: i.s.o,
								photo_130: i.s.t,
								description: i.z,
								lat: i.q,
								"long": i.w,
								owner_id: i.o,
								id: i.i,
								date: fixDate(i.d)
							}};
						case 1:
							return {type: "video", video: {
								owner_id: i.o,
								id: i.i,
								title: i.n,
								description: i.z,
								date: fixDate(i.d),
								duration: i.s
							}};
						case 2:
							return {type: "audio", audio: {
								owner_id: i.o,
								id: i.i,
								artist: i.a,
								title: a.n,
								duration: i.d,
								lyrics_id: i.l,
								genre_id: i.g
							}};
						case 3:
							return {type: "doc", doc: {
								owner_id: i.o,
								id: i.i,
								title: i.n,
								ext: i.e,
								size: i.s
							}};
						default:
							return {
								t: -1,
								s: i.type
							};
					};
				});
			},
			explainForwardedMessages = function (f)
			{
				if (!f)
				{
					return false;
				};
				f.forEach(function (i)
				{
					return {
						user_id: i.f,
						date: i.date + d2006,
						body: i.t,
						attachments: explainAttachments(i.a),
						fwd_messages: explainForwardedMessages(i.m)
					};
				});
			};

		Site.append(e("div",
		{
			append: [
				Site.CreateHeader("Открытие файла переписки<span id=anza><\/span>", null, v65HeaderStyle),
				pageWrap = e("div")
			]
		}));
		setActivity(showFilePicker());
	}
};