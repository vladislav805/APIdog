/**
 * APIdog v6.5
 *
 * upd: -1
 */

var TicketCommentActions = [
	{actionId: 0,	state: "Нет ответа", description: "Ожидание обработки"},
	{actionId: 1,	state: "Есть ответ", description: "Отвечено"},
	{actionId: 4,	state: "Подтверждено", description: "Подтвержденое"},
	{actionId: 5,	state: "В ожидании исправления", description: "В ожидании исправления"},
	{actionId: 6,	state: "Исправлено", description: "Исправленное"},
	{actionId: 7,	state: "Не подтверждено", description: "Не подтвержденное"},
	{actionId: 8,	state: "Невозможное", description: "Невозможное"},
	{actionId: 9,	state: "Стороннее", description: "Стороннее"},
	{actionId: 10,	state: "Принятое", description: "Принятое"},
	{actionId: 11,	state: "Отклоненное", description: "Отклоненное"},
	{actionId: 12,	state: "Он утюг", description: "Я утюг"},
	{actionId: 13,	state: "Он не прав", description: "Дядя, ты не прав"},
	{actionId: 14,	state: "Недостаточно данных", description: "В ожидании дополнительной информации"},
	{actionId: 15,	state: "Событие: изменено название", description: "изменил название тикета", verb: true, action: true},
	{actionId: 16,	state: "Событие: изменена тема", description: "изменил тему тикета", verb: true, action: true},
	{actionId: 17,	state: "Событие: приватный тикет", description: "сделал тикет приватным", verb: true, action: true},
	{actionId: 18,	state: "Тикет закрыт", description: "закрыл тикет", verb: true, action: true},
	{actionId: 19,	state: "Повтор", description: "повтор ", isRepeat: true},
	{actionId: 20,	state: "Исправлено в следующей версии", description: "исправлено в будущей версии "},
	{actionId: 50,	state: "¯\\_(ツ)_/¯", description: "¯\\_(ツ)_/¯"},
];

var Support = {
	Ajax: function (url, params, callback) {
		$.ajax.post({
			url:      url,
			callback: callback,
			params:   params,
			json:     true
		});
	},

	api: function (method, params, callback) {
		params = params || {};
		params.authKey = API.APIdogAuthKey;
		Support.Ajax("/bugs.php?method=" + method, params, callback);
	},

	offset: function () {
		return Site.Get("offset");
	},

	filter: function () {
		return Site.Get("filter");
	},

	categoryId: function () {
		return Site.Get("categoryId");
	},

	ticketId: function () {
		return Site.Get("id");
	},

	actionId: function () {
		return parseInt(Site.Get("actionId")) || 0;
	},

	open: function () {
		var act = Site.Get("act"),
			id = Support.ticketId() || (window.location.hash.split("/")[1] || "").split("?")[0];

		if (!act && id)
			act = "ticket";

		switch (act) {
			case "new":
				return Support.newTicketBox();

			case "ticket":
				Site.Loader();
				return APIdogRequest("support.getTicket", {
					count:		30,
					offset:		Support.offset(),
					ticketId:	Site.Get("id") || id
				}, Support.getTicket, Support.showError);

			case "donate":
				return Support.pageDonate();

			case "markup":
				return Support.showMarkUpHelpPage();

			default:
				Site.Loader();
				APIdogRequest("support.get", {
					count:			30,
					offset:			Support.offset(),
					filter:			Support.filter(),
					category_id:	Support.categoryId(),
					actionId:			Support.actionId(),
//					startWith:		Support.startWith
				}, Support.getList, Support.showError);
		}
	},

	getResult: function (data) {
		return data.response;
	},

	showError: function (error) {
		Site.Alert({
			text: "Ошибка APIdog API: #" + error.errorId + " (" + error.message + ")"
		});
	},

	getTabs: function (header) {
		return header ? Site.CreateHeader(header, null, v65HeaderStyle) : $.e("div");
	},
	getState: function ( n )
	{
		if ( n == 0 )
			return "Обработка...";
		if ( n == 1 || n == 4 )
			return "Есть ответ";
		var vars = Lang.get( "support.types_comment" );
		for ( var a in vars )
		{
			if ( vars[ n - 1 ] )
				return vars [ n - 1 ];
			if ( vars[ n - 4 ] )
				return vars [ n - 4 ];
		}
		return "";
	},
	chatedCount: [],
	chatedList: [],
	getList: function (data, isChate) {
		var e = $.e,
			parent = e("div"),
			list   = e("div", {"class": "support-list"}),
			count,
			items;

		count = data.count;
		items = data.items;

		if (items.length) {
			items.forEach(function (item) {
				list.appendChild(Support.itemList(item));
			});
		} else {
			list.appendChild(Site.EmptyField("Нет тикетов"));
		};

		parent.appendChild(Support.getTabs(Lang.get("support", "asked", count) + " " + count + " " + Lang.get("support", "questions", count)));

		parent.appendChild(e("select", {
			"class": "support-filter",
			onchange: function (event) {
				window.location.hash = "#support?categoryId=" + this.options[this.selectedIndex].value;
			},
			append: (function (a, b, c, d, f) {
				for (d in b) {
					f = e("option", {value: b[d].category_id, html: b[d].title})
					if (c == b[d].category_id)
						f.selected = true;
					a.push(f);
				}
				return a;
			})([], Lang.get("support.categories"), Support.categoryId())}));

		if (API.isAdmin) {
			parent.appendChild(e("select", {
				"class": "support-filter",
				onchange: function (event) {
					window.location.hash = "#support?actionId=" + this.options[this.selectedIndex].value
				},
				append: (function(a,b,c,d,f,g){
					for(d in b) {
						g = b[d];
						f = e("option", {value: g.actionId, html: g.state});
						if (c === g.actionId)
							f.selected = true;
						a.push(f);
					};
					return a;
				})([], TicketCommentActions, Support.actionId())
			}))
		};

		parent.appendChild(Site.CreateTopButton({tag: "a", link: "support?act=new", title: Lang.get("support.create_new_question")}));
		parent.appendChild(Site.CreateTabPanel([
			["support", "Все вопросы"],
			["support?filter=2", "Мои вопросы"]
		]));
		parent.appendChild(list);

		parent.appendChild(Site.PagebarV2(Support.offset(), count, 30));
		Site.Append(parent);
		Site.SetHeader(Lang.get("support.support")) //, {link: "support"});
	},

	categories: Lang.get("support.categories"),

	getCategory: function (category_id) {
		var list = Lang.get("support.categories");
		for (var i = 0, l = list.length; i < l; ++i)
			if (list[i].category_id == category_id)
				return list[i].title;
	},

	itemList: function (c) {
		return $.e("a", {
			"class": "boards-item",
			href: "#support/" + c.ticketId,
			append: [
				$.e("strong", {html: Site.Escape(c.title)}),
				$.e("div", {"class": "boards-date", html: $.getDate(c.date) + "<br>" + Support.getCategory(c.categoryId)}),
				$.e("div", {"class": "boards-last", html: (c.isPrivate ? "(•) " : "") + (c.isNew && c.userId == API.uid ? "<font color=red>Новый ответ</font> / " : "") + Support.getTicketState(c.actionId).state})
			]
		});
	},

	censor: function (text) {
		return /(^|\s)((д(о|o)лб(а|a))?(е|e|ё)(б|п)т?(а|a)?|(п(р|p)и)?пи(з|3)д((а|a)(н(у|y)т(ы(й|ая|(е|e)))?)?|(е|e)ц)|((з|3)(а|a))?(е|e|ё)((б|п)(а|a)?(л((о|o)|(е|e)т)?|н(ут)?(ь((с|c)я)?|ый?)|ть?|ыш|и(с|c)ь)?)?|(о|o|а|a)?(х|x)(у|y)(й(ня)?|(е|e|ё)((с|c)(о|o)(с|c)|в|н|л(а|a)?)(н?(ый|(а|a)я|(о|o)(е|e))|ш(ий|(а|a)я|(о|o)(е|e))|а|a|ый|лa?)?)|пид(о|o|а|a)?(р|p)((а|a)?(с|c)?ы?)?)(?=(\s|$))/img.test(text);
	},

	newTicketBox: function () {
		var page = document.createElement("div"),
			form = document.createElement("div"),
			formNode = $.e("div", {"class": "hidden"}),
			opened = Date.now() / 1000;
		page.appendChild(Site.CreateHeader(Lang.get("support.support")));
		form.className = "sf-wrap";

		form.appendChild($.e("div", {
			style: "padding: 6px 8px; border-left: 2px solid rgb(95, 127, 186);",
			html: Support.formatText(Site.Format("[h1]FAQ - Частозадаваемые вопросы[/h1]\n[h3]Что не так с этой поддержкой?[/h3]Добро пожаловать! Обратите внимание, что данная техническая поддержка относится к проекту APIdog. Задавайте нам вопросы, связанные с обнаруженными проблемами при работе с сайтом.\nВсе вопросы, связанные непосредственно с проблемами ВКонтакте, задавайте [url=#im?to=333]Агенту Поддержки ВКонтакте[/url].\n\n[h3]Есть ли у APIdog приложения для смартфона?[/h3]Разработкой мобильных приложений APIdog не занимается. Есть только этот сайт. Можно заходить как с компьютера, так и с телефона, планшета, телевизора. Для Android есть приложение нашего партнёра: [url=#operator_555_public]VK Coffee[/url].\n\n[h3]Что случилось с группами, и как теперь следить за новостями?[/h3]Группы APIdog и APIdog Updates, а также резервное сообщество заблокированы модераторами ВКонтакте.\nСледить за новостями, обновлениями и прочей информацией можно в нашем канале в Telegram: [url=https://telegram.me/apidogru]@apidogru[/url].\n\n[h3]Зачем вы убрали вход по токену?! Очень нужна такая возможность![/h3]Это очередное требование со стороны Команды ВКонтакте. К сожалению, данный вид входа убран окончательно и возвращён не будет.\n\n[h3]Где найти разделы \"Администрирование сообщества\", \"Настройки приватности страницы\" и полноценные \"Отложенные записи\"?[/h3]В настоящее время на нашем сайте нет этих разделов. Но, обещаем, вскоре появятся.\n\n[h3]Как мне удалить свою страницу?[/h3]Такое можно сделать только с полной или мобильной версии ВКонтакте.\n\n[h3]Как мне заблокировать человека или сообщество, которое нарушает правила? Как сменить имя?[/h3]Обратитесь к [url=#im?to=333]Агенту Поддержки ВКонтакте[/url].\n\n[h3]Как обновить фотографию, как играть в игры и приложения, не сбивая дату последнего захода?[/h3]\nПерейдите на страницу [url=vkoffline.php]https://apidog.ru/vkoffline.php[/url], нажмите \"Начать\", а затем откройте ВК. Обратите внимание! Нельзя закрывать эту специальную вкладку APIdog. Всё время вы будете отмечены как онлайн, однако по завершению такой сессии дата захода останется неизменной.\n\n[h3]Что такое мнимый онлайн?[/h3]Это функция, которая позволит Вам быть онлайн, пока открыт APIdog, но при этом дата последнего захода на сайт не изменится.\n\n[h3]В одной из тем недоработка или есть предложение по улучшению.[/h3]Наша команда не занимается разработкой тем для сайта. Все обращения по поводу тем оставляйте самим авторам тем.\n\n[h3]Что такое APIdog Longpoll?[/h3][url=extensions]APIdog Longpoll[/url] — это небольшое расширение от нашего сайта для ваших браузеров. С его помощью все события (новые сообщения, уведомления и т.д.) будут происходить на сайте мгновенно. Установив это расширение Вы снижаете нагрузку на наш сервер и позволяете мобильным пользователям также беспроблемно пользоваться возможностями сайта.\n\n[h3]Сайт работает, но ничего не загружает.[/h3]Такое бывает, если мы выкатили обновление, но Ваш браузер так и не понял это и не знает, как отобразить страницу. Вот что нужно делать в таком случае:\n1. Выйдите с сайта.\n2. Очистите куки, кэш (Ctrl+Shift+Del).\n3. Войдите на сайт.\nЕсли это не помогло, откройте консоль браузера (Ctrl+Shift+J), сделайте скриншот с ошибкой и отправьте сведения разработчикам.\n\n[h3]Как делать репосты?[/h3]Чтобы поделиться какой-либо записью со стены группы или человека, нужно кликнуть на время размещения записи, а затем нажать на кнопку «Рассказать друзьям». Отправка записи в сообщество или сообщением доступна в меню «Действия» в верхнем углу.\n\n[h3]Сайт постоянно требует ввести капчу (символы с картинки)[/h3]Запрашивает ввод капчи не APIdog, а ВКонтакте. Почему? Мы понятия не имеем. Попробуйте переавторизоваться, зайти через vk.com, продолжать вводить капчу, ещё что-нибудь. К этой проблеме мы не относимся.\n\n[h3]Что означает иконка \"К\" у имени пользователя?[/h3]Это означает, что данный пользователь в данный момент использует неофициальное приложение Kate Mobile для Android.\n\n[h3]Как восстановить удалённые сообщения или диалог?[/h3]Восстановить удалённые сообщения НЕВОЗМОЖНО. Прежде чем удалять — несколько раз убедитесь в том, что действительно диалог/сообщение должны быть удалены.\n\n[h3]\"Ваш браузер не поддерживает MP3\"[/h3]Суть проблемы написана в самом оповещении. Ваш браузер не поддерживает формат MP3 (HTML5), в котором хранится вся музыка ВК. Обновите браузер до последней версии или установите другой: Firefox выше 23 версии, Opera выше 26 версии, Chrome, Safari выше 6 версии, IE выше 10 версии, или Edge.\n\n[h3]Что обозначают галочки у диалогов?[/h3]Одна галочка — сообщение доставлено до собеседника, но ещё не прочитано им; две — собеседник прочитал сообщение; нет галочек вообще — это входящее сообщение. P.S.: У нас нет [url=https://ru.wikipedia.org/wiki/SMS]SMS[/url]! У нас сообщения.\n\n[h3]Как стать Агентом Поддержки? Хочу к вам в команду![/h3]Нашей команде не требуются новые лица.\n\n\n[h3][red]Внимание![/red] Если Вы задали вопрос, ответ на который содержится в кратком FAQ (во всём, что выше написано), то вопрос будет удален без ответа и предупреждения![/h3]", {noLinks: true, noHashTags: true}))
		}));

		var ltitle, ldescription, lcategory, lattachment, lprivate, submit;

		formNode.appendChild($.e("div", {"class": "tip tip-form", html: Lang.get("support.new_question_title")}));
		formNode.appendChild(ltitle = $.e("input", {type: "text", name: "title", maxlength: 64, required: true}));

		formNode.appendChild($.e("div", {"class": "tip tip-form", html: Lang.get("support.new_question_description")}));
		formNode.appendChild(ldescription = $.e("textarea", {name: "text", required: true}));
		formNode.appendChild($.e("div", {"class": "tip tip-form", style: "font-size: x-small !important", html: "Поддерживается псевдоразметка. <a onclick=\"Support.showMarkUpHelpPage()\">Подробнее</a>"}));

		formNode.appendChild($.e("div", {"class": "tip tip-form", html: Lang.get("support.new_question_category")}));
		formNode.appendChild(lcategory = Support.getSelectCategory());

		formNode.appendChild($.e("div", {id: "attach"}));
		formNode.appendChild($.e("div", {"class": "tip tip-form", html: Lang.get("support.new_question_attach")}));
		formNode.appendChild(Support.getUploadForm(0, form));
		formNode.appendChild(lattachment = $.e("input", {name: "attachment", type: "hidden"}));

		formNode.appendChild($.e("label", {append: [
			lprivate = $.e("input", {type: "checkbox", name: "isPrivate"}),
			$.e("span", {html: " приватный тикет (ответить могут ТОЛЬКО разработчик и агенты поддержки)"})
		]}));

		formNode.appendChild($.e("label", {append: [
			$.e("input", {type: "checkbox", onchange: function (event) { submit.disabled = !this.checked }}),
			$.e("span", {html: " я прочитал FAQ и ответа на мой вопрос нет"})
		]}));

		formNode.appendChild(submit = $.e("input", {
			type: "submit",
			name: "submitter",
			disabled: true,
			value: Lang.get("support.new_question_submit"),
			onclick: function (event) {
				var title		= $.trim(ltitle.value),
					text		= $.trim(ldescription.value).replace(new RegExp(API.access_token, "igm"), "*access_token*"),
					attachments	= parseInt(lattachment.value),
					isPrivate	= lprivate.checked ? 1 : 0,
					categoryId	= lcategory.options[lcategory.selectedIndex].value;

				if (Support.censor(title) || Support.censor(text)) {
					Site.Alert({text: "Не материтесь!"});
					return;
				};

				submit.disabled = true;

				APIdogRequest("support.createTicket", {
					title: title,
					text: text,
					isPrivate: isPrivate,
					attachments: attachments,
					userAgent: navigator.userAgent,
					isExtension: API.isExtension ? 1 : 0,
					categoryId: categoryId
				}, function (data) {
					if (data.ticketId)
						window.location.hash = "#support/" + data.ticketId + "?created=1";
				});
				return false;
			}
		}));
		form.appendChild($.e("input", {
			type: "button",
			style: "margin: 10px auto; display: block;",
			value: "Моего вопроса нет, создать тикет",
			onclick: function () {
				var was = (Date.now() / 1000) - opened;

				Site.Alert({
					text: was < 30
						? "Неужели! Вы так быстро читаете? Учтите, что если Ваш вопрос здесь обсуждался, повторно на него никто отвечать не будет - тикет будет удален агентами поддержки APIdog. Спасибо за понимание!"
						: "Учтите, что тикет с вопросом, ответ на который содержится в FAQ, будет удален без ответа и предупреждения.",
					time: 20000
				});
				$.elements.removeClass(formNode, "hidden");
				$.elements.remove(this);
			}
		}));
		form.appendChild(formNode);
		page.appendChild(form);
		form.attachment = lattachment;
		Site.Append(page);
		Site.SetHeader(Lang.get("support.new_question_head"), {link: "support"});
	},
	getSelectCategory: function () {
		var select = document.createElement("select"), cats = Lang.get("support.categories");
		select.name = "category";
		for (var i = 0, l = cats.length; i < l; ++i)
			select.appendChild($.elements.create("option", {value: cats[i].category_id, html: cats[i].title}));
		return select;
	},

	getTicketState: function (actionId, isSmall) {
		var a = {description: "Ожидание обработки.."};

		if (actionId > 50) {
			for (var i = 8; i < 15; ++i) {
				if (actionId & Math.pow(i)) {
					actionId = i;
					break;
				};
			};
		};

		TicketCommentActions.forEach(function (i) {
			a = i.actionId == actionId ? i : a;
		});
		return a;
	},

	updater: null,

	agents: {},

	saveAgents: function (agents) {
		agents.forEach(function (agent) {
			Support.agents[agent.agentId] = agent;
		});
	},

	getTicket: function (data) {

		// TODO
		if (data.error) {
			Site.Append(Site.EmptyField("Нет доступа. Тикет был удален или он приватный."));
			return;
		};

		var info		= data.ticket,
			comments	= data.comments,
			count		= data.count,
			comments	= data.items,
			parent		= document.createElement("div"),
			list		= document.createElement("div"),
			ticketId	= info.ticketId,
			form,
			acts		= Support.getTicketActions(info),
			act			= acts ? Site.CreateDropDownMenu(Lang.get("support.actions"), acts) : null;

		Support.saveAgents(data.agents);

		parent.appendChild(Support.getTabs());
		parent.appendChild(Site.CreateHeader(Site.Escape(info.title), act));

		comments.forEach(function (item) {
			list.appendChild(Support.itemComment(item));
		});

		Site.loadQueueUsers();

		parent.appendChild(list);
		parent.appendChild(Site.PagebarV2(Site.Get("offset"), count, 30));
		if (info.canReply) {
			parent.appendChild(Support.getWriteForm(info, list, {}));
		} else {
			if (info.isBanned) {
				parent.appendChild(Site.EmptyField("Команда APIdog посчитала Ваши действия в поддержке сайта ненормальными, в связи с этим Вы не можете задавать вопросы, отвечать на тикеты и пр."));
			};
		};
		Site.Append(parent);
		Site.SetHeader(Lang.get("support.item_head") + " #" + ticketId, {link: "support"});
	},

	getTicketActions: function (info) {
		var opts = {},
			ticketId = info.ticketId, i = 0;
		if (API.isAdmin && (++i)) {
			opts["Пометить как отвеченный"] = function (event) {
				APIdogRequest("support.markTicketAsReplied", {ticketId: ticketId}, function (data) {
					data == 1 && Site.Alert({text: "Вопрос отмечен отвеченным"});
				}, Support.showError);
			};
		}
		if (info.canDelete && (++i)) {
			opts[Lang.get("support.delete")] = function (event) {
				VKConfirm("Вы уверены, что хотите удалить тикет?", function () {
					APIdogRequest("support.deleteTicket", {ticketId: ticketId}, function (data) {
						Site.Alert({text: Lang.get("support.deleted")});
					}, Support.showError);
				});
			};
		};
		return i ? opts : false;
	},

	getWriteForm: function (ticket, list, options) {
		var e = $.e,
			wrap = e("div"),
			form = e("form", {append: Site.CreateHeader(Lang.get("support.reply"))}),
			additionally = [];


		if (ticket.canResponse) {
			var s;
			additionally.push($.e("div", {append: [
				s = $.e("select", {name: "actionId", append: (function (a, b) {
					a.forEach(function (c) {
						if (!c.action) b.push($.e("option", {value: c.actionId, html: c.description}));
					});
					return b;
				})(TicketCommentActions, [])})
			]}));
			s.selectedIndex = 1;
		};

		var taNode;
		form.appendChild($.e("div", {
			"class": "wall-new",
			append: [
				$.e("div",{
					"class":"wall-new-right wall-new-right-noleft",
					append:[
						$.e("div", {
							"class": "wall-wrap",
							append: (taNode = $.e("textarea", {name: "text", "class": "sizefix"})) }),
						$.e("input", {"class": "fl", id: "sp-su", type: "submit", value: Lang.get("support.reply_button")}),
						$.e("div", {"class": "oh", append: [
							$.e("input", {type: "hidden", name: "attachment"}),
							$.e("div", {id: "attach"}),
							$.e("div", {append: additionally})
						]})
					]
				})
			]
		}));

		taNode.style.height = "120px";

		if (ticket.canResponse) {
			var end = ["С наилучшими пожеланиями,", "Всего наилучшего,", "Отличного времяпровождения,", "Хорошего настроения!", "Всего доброго!", "Всего хорошего!"];
			end = end[random(0, end.length -1 )];
			taNode.value = "Здравствуйте!\n\n\n\n" + end + "\nКоманда поддержки APIdog";
		};
		form.onsubmit = function (event) {
			var bitmask = 0,
				text = this.text && $.trim(this.text.value),
				attachments = this.attachment && this.attachment.value,
				textField = this.text,
				attachField = this.attachment;
			if (ticket.canResponse) {
				var actionId = this.actionId && this.actionId.options[this.actionId.selectedIndex].value;
				actionField = this.actionId;
			};
			if (!actionId && !text) {
				Site.Alert({text: Lang.get("support.empty")});
				return false;
			};

			var btn = $.element("sp-su");

			btn.value = "...";
			btn.disabled = true;

			APIdogRequest("support.addComment", {
				ticketId: ticket.ticketId,
				text: text.replace(new RegExp(API.access_token, "igm"), "*access_token*"),
				attachments: attachments,
				action: actionId
			}, function (data) {
				btn.value = Lang.get("support.reply")
				btn.disabled = false;
				if (data.comment) {
					if (data.agents && data.agents.length)
						Support.saveAgents(data.agents);
					list.appendChild(Support.itemComment(data.comment));
					textField && (textField.value = "");
					attachField && (attachField.value = "");
					$.elements.clearChild($.element("attach"));
					if (ticket.canResponse) {
						actionField.selectedIndex = 1;
					};
				};
			}, Support.showError);
			return false;
		};
		wrap.appendChild(form);
		wrap.appendChild(SelectAttachments.UISelector([
			{
				title: "Прикрепить",
				data: Support.getUploadForm(ticket.ticketId, form)
			}
		]));
		return wrap;
	},
	getUploadForm: function (ticketId, writeForm) {
		var e = $.e,
			inputWrap,
			form = e("form", {
				append: [
					inputWrap = Site.CreateFileButton("file", {accept: "image/*", fullwidth: true}),
					e("input", {type: "submit"})
				],
				onsubmit: function (event) {
					var input = inputWrap.getElementsByTagName("input")[0],
						file = input.files[0],
						modal = new Modal({
							title: "Процесс",
							content: "Загрузка...",
							uncloseableByBlock:  true,
							width: 260
						}).show(),
						upload = new VKUpload(file)
							.onUploading(function (event) {
								modal.setContent("Загрузка файла... " + event.percent.toFixed(1) + "%");
							})
							.onUploaded(function (attachment) {
								console.log(attachment)
								modal.close();
								writeForm.attachment.value = attachment.attachmentId;
								writeForm.querySelector("#attach").appendChild(e("img", {
									src: attachment.url,
									onclick: function (event) {
										VKConfirm("Открепить файл?", function () {
											writeForm.attachment.value = "";
											$.elements.clearChild(writeForm.querySelector("#attach"));
											(form.parentNode && form.parentNode.parentNode || form).style.display = "block";
										});
									}
								}));

								form.style.display = "none";
							})
							.onError(function (error) {
								console.log(error)
							})
							.upload("support.uploadImage", {});
					event.preventDefault();
					return false;
				}
			});
		return form;
	},

	comments: {},

	itemComment: function (c) {
		var item = document.createElement("div"),
			userId = c.userId,
			ticketId = c.ticketId,
			commentId = c.commentId,
			l = Lang.get,
			user = Local.Users[userId];

		Support.comments[ticketId + "_" + commentId] = c;

		if (userId < 0) {
			user = Support.agents[-userId],
			user = {
				name: Lang.get(user.name),
				photo: "//static.apidog.ru/v6.4/" + user.photo
			};
		} else {
			if (!user) {
				if (userId > 0) {
					Site.queueUser(userId);
					user = {
						domain: "#id" + userId,
						name: "User " + userId,
						photo: "//static.apidog.ru/multichat-icon50.png"
					};
				} else {

				};
			} else {
				user = {
					domain: "#" + user.screen_name,
					name: user.first_name + " " + user.last_name + Site.isOnline(user),
					photo: getURL(user.photo_50 || user.photo_rec)
				};
			};
		};


		var actions = [],
			textNode = $.e("div", {html: Mail.Emoji(Support.formatText(Site.Format(c.text, {vk: true})))}),
			contentNode;

		item.className = "comments board-creater";
		item.id = "support_" + ticketId + "_" + commentId;

		if (c.canEdit) {
			actions.push($.e("span", {"class": "a", html: l("support.edit"), onclick: (function (node, ticketId, commentId) {
				return function (event) {
					var node = textNode.parentNode;
					$.elements.clearChild(node);
					node.appendChild(Support.editForm(ticketId, commentId));
				};
			})(textNode, ticketId, commentId)}));
			actions.push($.e("span", {"class": "tip", html: " | "}));
		};

		if (c.canDelete) {
			actions.push($.e("span", {"class": "a", html: l("support.delete"), onclick: (function (id, elem) {
				return function (event) {
					APIdogRequest("support.deleteComment", {
						ticketId: ticketId,
						commentId: commentId
					}, function (data) {
						if (data.result) {
							$.elements.clearChild(elem);
							elem.appendChild($.e("div", {"class": "comment-deleted", append: [
								document.createTextNode(l("support.deletedComment") + ". "),
								$.e("span", {"class": "a", html: Lang.get("comment.restore"), onclick: function (event) {
									APIdogRequest("support.restoreComment", {
										ticketId: ticketId,
										commentId: commentId
									}, function (data) {
										if (data.result) {
											item.parentNode.insertBefore(Support.itemComment(c), item);
											$.elements.remove(item);
										};
									}, Support.showError);
								}})
							]}))
						}
					});
				}
			})(c.id, item)}));
		};

		var action = Support.getTicketState(c.actionId);

		item.appendChild($.e(userId > 0 ? "a" : "div", {
			"class": "comments-left",
			href: user.domain,
			append: $.e("img", {src: user.photo, "class": "_im_link_" + userId})
		}));

		item.appendChild($.e("div", {"class": "comments-right", append: c.actionId < 4 ? [
			$.e("div", {"class": "fr tip", html: "(#" + commentId + ")"}),
			userId > 0
				? $.e("strong", {append: $.e("a", {href: user.domain, "class": "_im_link_" + userId, html: user.name})})
				: $.e("strong", {html: user.name}),
			$.e("div", {"class": "comments-content", id: "support_" + ticketId + "_" + commentId + "_text", append: textNode}),
			$.e("div", {"class": "comments-attachments", append: Support.getAttachment(c.attachments)}),
			$.e("div", {
				"class": "comments-footer",
				append: [
					contentNode = $.e("div", {"class": "comments-actions", append: actions}),
					$.e("div",{"class": "comments-footer-left", html: $.getDate(c.date) + (c.updated ? " (изм. " + Site.getDate(c.updated) + ")" : "")})
				]
			})
		] : [
			$.e("div", {"class": "fr tip", html: "(#" + commentId + ")"}),
			$.e("strong", {html: user.name}),
			!action.verb ? $.e("span", {"class": "tip", html: l("support.marked_as")}) : null,
			$.e("strong", {html: action.description}),
			action.actionId == 19 ? $.e("a", {href: "#support/" + c.text, html: "тикета #" + c.text}) : null,
			action.actionId != 19 ? $.e("div", {append: textNode}) : null,
			$.e("div", {"class": "comments-attachments", append: Support.getAttachment(c.attachments)}),
			$.e("div", {
				"class": "comments-footer",
				append: [
					contentNode = $.e("div", {"class": "comments-actions", append: actions}),
					$.e("div",{"class": "comments-footer-left", html: $.getDate(c.date) + (c.updated ? " (изм. " + Site.getDate(c.updated) + ")" : "")})
				]
			})
		]}));

		if (c.userAgent) {
			if (actions.length) {
				contentNode.appendChild($.e("span", {"class": "tip", html: " | "}));
			};
			contentNode.appendChild(Support.getMoreCommentButton(c));
		};

		return item;
	},

	getMoreCommentButton: function (info) {
		var cont;
		return $.e("span", {"class": "a", html: "Показать сведения", onclick: function (event) {
			var modal = new Modal({
				title: "Сведения",
				content: cont = $.e("div", {append: [
					$.e("dl", {append: [
						$.e("dt", {html: "User-agent:"}),
						$.e("dd", {html: info.userAgent}),
						$.e("dt", {html: "Расширение APIdog LongPoll:"}),
						$.e("dd", {html: info.isExtension ? "установлено" : "не установлено"})
					]})
				]}),
				footer: [
					{ name: "close", title: "Закрыть", onclick: function () { modal.close() } }
				]
			}).show();
			if (API.isAdmin)
				Support.loadUserSettings(info.userId, modal, cont);
		}});
	},

	loadUserSettings: function (userId, modal, cont) {
		APIdogRequest("settings.get", {userId: userId, extended: 1}, function (result) {
			var params = result.settings,
				table = $.e("table"),
				row = function (key, value) {
					table.appendChild($.e("tr", {append: [
						$.e("td", {append: $.e("strong", {html: key})}),
						$.e("td", {html: JSON.stringify(value)})
					]}));
				};
			for (var key in params) {
//				if (key.indexOf("enable")) continue;
				row(key, params[key]);
			};
			cont.appendChild(table);
		});
	},

	editForm: function (ticketId, commentId) {
		var item = Support.comments[ticketId + "_" + commentId];
		return Site.CreateWriteForm({
			name: "text",
			value: item.text,
			nohead: true,
			noleft: true,
			ctrlEnter: true,
			onsubmit: function (event) {
				var text = this.text && $.trim(this.text.value),
					nodeText = this.text;

				if (!text) {
					Site.Alert({text: Lang.get("support.edit_empty")});
					nodeText.focus();
					return false;
				};

				APIdogRequest("support.editComment", {
					ticketId: ticketId,
					commentId: commentId,
					text: text.replace(new RegExp(API.access_token, "igm"), "*access_token*"),
					attachments: (item.attachments || []).map(function (i) { return i.attachmentId })
				}, function (data) {
					if (data.result) {
						var node = $.element("support_" + ticketId + "_" + commentId);
						item.text = text;
						node.parentNode.insertBefore(Support.itemComment(item), node);
						nodeText && (nodeText.value = "");
						$.elements.remove(node);
					}
				});
				return false;
			}
		});
	},

	getAttachment: function (attachment) {
		var list = $.e("div");
		if (!attachment || attachment && !attachment.length)
			return list;
		attachment.forEach(function (i) {
			list.appendChild($.e("a", {
				"class": "photos-item",
				href: i.url,
				target: "_blank",
				append: $.e("img", {src: i.url}),
				style: "max-width: 400px; max-height: 400px;"
			}));
		});
		return list;
	},

	pageDonate: function () {
		var parent = document.createElement("div"), i = document.createElement("iframe"), w = document.createElement("iframe");
		i.style.width = "507px"; i.style.display = "block"; i.style.margin = "0 auto"; i.style.height = "134px"; i.style.border = "0";
		i.src = "https:\/\/money.yandex.ru\/embed\/donate.xml?" +
		"account=410012195338722&quickpay=donate&payment-type-choice=on&default-sum=30&targets=%D0%A1%D0%B1%D0%BE%D1%80+%D0%BF%D0%BE%D0%B6%D0%B5%D1%80%D1" +
		"%82%D0%B2%D0%BE%D0%B2%D0%B0%D0%BD%D0%B8%D0%B9+%D0%BD%D0%B0+%D1%80%D0%B0%D0%B7%D0%B2%D0%B8%D1%82%D0%B8%D0%B5+%D1%81%D0%B0%D0%B9%D1%82%D0%B0+APIdo" +
		"g&target-visibility=on&project-name=APIdog&project-site=http%3A%2F%2Fapidog.ru%2F&button-text=05&fio=on";
		w.style.width = "507px"; w.style.display = "block"; w.style.margin = "0 auto"; w.style.height = "175px"; w.style.border = "0";
		w.src = "\/\/events.webmoney.ru\/social\/widgetDonate.aspx?guid="
		+ "ce7b005b-b90d-4e70-a5c4-0a2009c3ccb6&type=widget&h=169&w=507#1";
		parent.appendChild(Support.getTabs("Пожертвования")); parent.appendChild(i); parent.appendChild(w); Site.Append(parent);
	},

	formatText: function (text) {
		text = text.replace(/\[(\/?)(s|b|u|i|big|small|h1|h2|h3|pre|blockquote|code)\]/igm, "<$1$2>");
		text = text.replace(/\[(\/?)(red|gray)\]/igm, "<$1font color='$2'>");
		text = text.replace(/\[(\/?)url=?([^\]]+)\]([^\[]+)\[\/url\]/img, function (a, b, c, d) {
			return "<a target=\"_blank\" href='" + c + "'>" +  d+ "<\/a>"
		});
		return text;
	},

	showMarkUpHelpPage: function () {
		var e = $.e("div", {append: (function (a) {
			var tags = {
				"s": "Зачеркнутый текст",
				"b": "Полужирный текст",
				"u": "Подчеркнутый текст",
				"i": "Курсивный текст",
				"big": "Увеличивает размер текста на 1",
				"small": "Уменьшает размер текста на 1",
				"h1": "Заголовок 1 уровня",
				"h2": "Заголовок 2 уровня",
				"h3": "Заголовок 3 уровня",
				"pre": "Моноширинный текст",
				"blockquote": "Цитата",
				"code": "Блок с кодом",
				"red": "Красный текст",
				"gray": "Серый текст"
			},
				i, w = a("table", {"class": "mail-ts sizefix"}), q = function (t) {
				return a("tr", {append: [
					a("td", {"class": "mail-tsrt", html: "[" + t + "]"}),
					a("td", {"class": "mail-tsrt", html: Support.formatText("[" + t + "]text[/" + t + "]")}),
					a("td", {"class": "mail-tsrt", html: tags[t]})
				]})
			};
			w.appendChild(a("thead", {append: [
				a("th", {"class": "mail-tsrt", html: "Название"}),
				a("th", {"class": "mail-tsrt", html: "Пример"}),
				a("th", {"class": "mail-tsrt", html: "Описание"})
			]}));
			for (i in tags)
				w.appendChild(q(i));
			return w;
		})($.e)});
		var modal = new Modal({title: "Помощь по разметке", content: e, footer: [ { name: "close", title: "Закрыть", onclick: function () { modal.close() } } ]}).show();
	}
};