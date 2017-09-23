/**
 * Возвращает кнопку для лайков
 * Created 10.01.2016 from code Wall.LikeButton
 * @param  {String}   type      Тип
 * @param  {int}      ownerId   Идентификатор владельца
 * @param  {int}      itemId    Идентификатор элемента
 * @param  {String}   accessKey Ключ доступа
 * @param  {int}      likes     Количество лайков
 * @param  {boolean|number}  isLiked   Лайкнул ли текущий пользователь?
 * @param  {Function=} callback  Колбэк при успехе добавления/удаления лайка
 * @param  {Object=}   options   Опции для кнопки
 * @return {HTMLElement}        Кнопка
 */
function getLikeButton(type, ownerId, itemId, accessKey, likes, isLiked, callback, options) {
	if (type === "topic_comment") {
		ownerId *= -1;
	}
	var e = $.e,

		requestLike = function() {
			toggleLike(type, ownerId, itemId, accessKey || "", update);
		},

		update = function(result) {
			setCount(result.likes);
			setLiked(result.isLiked);
			callback && callback(result);
		},

		showLikers = function() {
			likers(type, ownerId, itemId, accessKey, false, { from: wrap });
		},

		setCount = function(n) {
			count.innerHTML = n ? formatNumber(n) : "";
		},

		setLiked = function(s) {
			$.elements[s ? "addClass" : "removeClass"](wrap, "vklike-active");
		},

		label = e("span", {"class": "vklike-label", html: Lang.get("likers.likeButton"), onclick: requestLike}),
		icon = e("div", {"class": "vklike-icon"}),
		iconWrap = e("div", {"class": "vklike-icon-wrap", append: icon, onclick: requestLike}),
		count = e("div", {"class": "vklike-count", onclick: showLikers}),

		wrap = e("div", {
			"class": "vklike-wrap",
			append: [ label, iconWrap, count ]
		});

	setCount(likes);
	setLiked(isLiked);

	if (options && options.right) {
		$.elements.addClass(wrap, "vklike-wrap-right");
	}

	return wrap;
}

/**
 * Триггер лайков
 *  * Created 10.01.2016
 * @param  {String}   type      Тип
 * @param  {int}      ownerId   Идентификатор владельца
 * @param  {int}      itemId    Идентификатор элемента
 * @param  {String}   accessKey Ключ доступа
 * @param  {Function} callback  Колбэк при успехе
 * @return {void}
 */
function toggleLike(type, ownerId, itemId, accessKey, callback) {
	api("execute", {
		code: 'var p={type:Args.t,item_id:Args.i,owner_id:Args.o,access_key:Args.a},me=API.likes.isLiked(p),act;act=me==0?API.likes.add(p):API.likes.delete(p);return[(-me)+1,act.likes,API.likes.getList(p+{filter:"copies"}).count];',
		o: ownerId,
		i: itemId,
		t: type,
		a: accessKey
	}).then(function(data) {
		var p = {
			type: type,
			ownerId: ownerId,
			itemId: itemId,
			accessKey: accessKey,
			isLiked: !!data[0],
			likes: parseInt(data[1]),
			reposts: parseInt(data[2])
		};

		callback && callback(p);
		//window.onLikedItem && window.onLikedItem(p);
	});
}

/**
 * Возвращает кнопку для репостов
 * Created 10.01.2016
 * @param  {String}   type       Тип
 * @param  {int}      ownerId    Идентификатор владельца
 * @param  {int}      itemId     Идентификатор элемента
 * @param  {String}   accessKey  Ключ доступа
 * @param  {int}      reposts    Количество репостов
 * @param  {boolean}  isReposted Репостнул ли текущий пользователь?
 * @param  {{wall: boolean, user: boolean, group: boolean}} access
 * @param  {Object=}   options    Опции для кнопки
 * @return {HTMLElement}             Кнопка
 */
function getRepostButton(type, ownerId, itemId, accessKey, reposts, isReposted, access, options) {
	var e = $.e,

		openShareWindow = function() {
			share(type, ownerId, itemId, accessKey || "", actionAfterShare, access, { from: wrap });
		},

		showReposted = function() {
			likers(type, ownerId, itemId, accessKey, true, { from: wrap });
		},

		setCount = function(n) {
			count.innerHTML = n ? formatNumber(n) : "";
		},

		setReposted = function(s) {
			$.elements[s ? "addClass" : "removeClass"](wrap, "vklike-active");
		},

		label = e("span", {"class": "vklike-label", html: Lang.get("likers.repostButton"), onclick: openShareWindow}),
		icon = e("div", {"class": "vklike-repost-icon", onclick: openShareWindow}),
		count = e("div", {"class": "vklike-count", onclick: showReposted}),

		wrap = e("div", {
			"class": "vklike-wrap vkrepost-wrap",
			append: [ label, icon, count ]
		});

	setCount(reposts);
	setReposted(isReposted);

	if (options && options.right) {
		$.elements.addClass(wrap, "vklike-wrap-right");
	}

	return wrap;
}

/**
 * Open modal window and load list of likers of item
 * Created 10.01.2016
 * @param  {String}  type        Тип
 * @param  {int}     ownerId     Идентификатор владельца
 * @param  {int}     itemId      Идентификатор элемента
 * @param  {String=}  accessKey   Ключ доступа
 * @param  {boolean=} onlyReposts Только ли репосты?
 * @param  {Object=}  options     Дополнительные параметры для окна
 * @return {void}
 */
function likers(type, ownerId, itemId, accessKey, onlyReposts, options) {
	options = options || {};
	var
		e = $.e,

		listAll = e("div"),
		listFriends = e("div"),

		friendsOnly = false,

		tab = new TabHost([
			{
				name: "all",
				title: Lang.get("likers.tabAll"),
				content: listAll
			},
			{
				name: "friends",
				title: Lang.get("likers.tabFriends"),
				content: listFriends
			}
		], {
			onOpenedTabChanged: function(event) {
				friendsOnly = event.opened.name === "friends";
				offset = 0;
				isAllLoaded = false;
				isLoading = false;
				load();
			}
		}),

		getCurrentList = function() {
			return !friendsOnly ? listAll : listFriends;
		},

		load = function() {
			if (isAllLoaded) {
				return;
			}

			if (!offset) {
				$.elements.clearChild(getCurrentList()).appendChild(Site.Loader(true));
			}

			api("likes.getList", {
				type: type,
				owner_id: ownerId,
				item_id: itemId,
				access_key: accessKey || "",
				count: step,
				filter: onlyReposts ? "copies" : "likes",
				friends_only: friendsOnly ? 1 : 0,
				extended: 1,
				fields: "photo_100,online,screen_name",
				offset: offset,
				v: 5.38
			}).then(function(result) {
				if (!offset) {
					$.elements.clearChild(getCurrentList());
				}
				addItemsToList(result.items);
				isLoading = false;
			});
		},

		addItemsToList = function(items) {
			var list = getCurrentList();
			items.forEach(function(user) {
				list.appendChild(Templates.getListItemUserRow(user));
			});
			if (!items.length) {
				isAllLoaded = true;
				if (!list.children.length) {
					list.appendChild(Site.getEmptyField(Lang.get(!onlyReposts ? "likers.listNothing" : "likers.listNothingReposts")))
				}
			}
		},

		offset = 0,
		step = 50,

		isAllLoaded = false,
		isLoading = false;

	new Modal({
		title: Lang.get(!onlyReposts ? "likers.windowTitle" : "likers.windowTitleReposts"),
		content: tab.getNode(),
		noPadding: true,
		footer: [
			{
				name: "close",
				title: Lang.get("likers.windowClose"),
				onclick: function() { this.close() }
			}
		],
		onScroll: function(event) {
			if (isLoading || !event.needLoading) return;
			load((isLoading = true) && (offset += step));
		}
	}).show(options.from);

	load(offset);
}

var APIDOG_SHARE_STEP_CHOOSE_TARGET_TYPE = 1,
	APIDOG_SHARE_STEP_CHOOSE_TARGET_ID = 2,
	APIDOG_SHARE_STEP_ADD_COMMENT = 3,
	APIDOG_SHARE_STEP_DO_SHARE = 4,

	APIDOG_SHARE_TARGET_WALL = 0,
	APIDOG_SHARE_TARGET_TYPE_USER = 1,
	APIDOG_SHARE_TARGET_TYPE_GROUP = 2;

/**
 * Open dialog for select target for repost
 * @param {string} type
 * @param {int} ownerId
 * @param {int} itemId
 * @param {string|null=} accessKey
 * @param {function=} callback
 * @param {{wall: boolean, user: boolean, group: boolean}} access
 * @param {{from: HTMLElement}} options
 */
function share(type, ownerId, itemId, accessKey, callback, access, options) {
	access = access || {wall: true, user: true, group: true};

	options = options || {};

	type = type.replace("post", "wall");

	var wrapper = $.e("div"),

		objectId = ownerId + (itemId ? "_" + itemId : ""),
		object = type + objectId + (accessKey ? "_" + accessKey : ""),

		step = 0,
		targetType,
		targetId,
		comment,

		chooseForm,
		chooseFormId,
		chooseTargetIdForm,
		chooseTargetIdLoading,
		chooseTargetIdEmpty,

		commentNode,

		loadTargetItems = function(type, callback) {
			switch (+type) {
				case APIDOG_SHARE_TARGET_TYPE_USER:
					api("execute", {
						code: "var m=API.messages.getDialogs({count:70,v:5.38}).items,i=0,l=m.length,d=[],c=[],u=[],g=[],o;while(i<l){o=m[i].message;d.push([o.user_id,o.chat_id]);if(o.user_id<0){g.push(-o.user_id);}else if(o.chat_id){c.push(o.chat_id);}else{u.push(o.user_id);};i=i+1;};return{dialogs:d,users:API.users.get({user_ids:u}),groups:API.groups.getById({group_ids:g}),chats:API.messages.getChat({chat_ids:c})};"
					}).then(function(result) {
						var u = parseToIDObject(result.users),
							g = parseToIDObject(result.groups),
							c = parseToIDObject(result.chats),
							l = result.dialogs;
						callback(l.map(function(i) {
							if (i[1]) {
								return {value: Peer.LIMIT + i[1], html: c[i[1]].title};
							} else if (i[0] < 0) {
								return {value: -i[0], html: g[-i[0]].name};
							} else {
								return {value: i[0], html: u[i[0]].first_name + " " + u[i[0]].last_name};
							}
						}));
					});
					break;

				case APIDOG_SHARE_TARGET_TYPE_GROUP:
					api("groups.get", {
						filter: "editor",
						fields: "members_count",
						extended: 1,
						v: 5.28
					}).then(function(result) {
						callback(result.items.map(function (i) {
							return {value: i.id, html: i.name};
						}));
					});
					break;

				default:
					console.log("WTF?!", type);
					callback([]);
			}
		},

		setNodeByStep = function(step) {
			switch (step) {
				case APIDOG_SHARE_STEP_CHOOSE_TARGET_TYPE:
					//targetType = null;
					//chooseFormId = null;
					// если что-то поломалось, раскомментировать строки
					// выше.
					// убирал это когда разбирался с IE/Edge, в них
					// всегда выбиралось сообщество, а не то, что надо.
					// в v6.5 всё работало, но этих строк не было.
					// суть проблемы была в функции, которая определяла
					// значение выбранного option в select. после
					// копипаста из 6.5 сюда, всё заработало
					wrapper.appendChild(chooseForm = $.e("form", {"class": "sf-wrap", append: [
						access.wall ? $.e("label", {append: [
							$.e("input", {
								type: "radio",
								name: "targetType",
								value: APIDOG_SHARE_TARGET_WALL,
								onchange: function() {
									nextStep();
								}
							}),
							$.e("span", {html: "на свою стену"})
						]}) : null,

						access.user ? $.e("label", {"class": "mbo", append: [
							$.e("input", {
								type: "radio",
								name: "targetType",
								value: APIDOG_SHARE_TARGET_TYPE_USER,
								onchange: function() {
									nextStep();
								}
							}),
							$.e("span", {html: "личным сообщением"})
						]}) : null,

						access.group  ? $.e("label", {append: [
							$.e("input", {
								type: "radio",
								name: "targetType",
								value: APIDOG_SHARE_TARGET_TYPE_GROUP,
								onchange: function() {
									nextStep();
								}
							}),
							$.e("span", {html: "в сообщество"})
						]}) : null
					]}));
					modal.setButton("cancel", {name: "cancel", title: "Отмена", onclick: cancelButtonCallback});
					break;

				case APIDOG_SHARE_STEP_CHOOSE_TARGET_ID:
					targetType = getRadioGroupSelectedValue(chooseForm.targetType);

					if (targetType === APIDOG_SHARE_TARGET_WALL) {
						return nextStep(targetId = API.userId);
					}

					clearWrapper();


						chooseFormId = $.e("div", {append: [
							$.e("div", {"class": "tip", html: targetType === APIDOG_SHARE_TARGET_TYPE_USER ? "Выберите диалог:" : "Выберите сообщество:"}),
							chooseTargetIdForm = $.e("select", { "class": "sf", append: chooseTargetIdLoading = $.e("option", {value: 0, html: "< загрузка >"}) })
						]});
						chooseTargetIdForm.disabled = true;

						loadTargetItems(targetType, function (items) {
							$.elements.remove(chooseTargetIdLoading);
							chooseTargetIdForm.appendChild(chooseTargetIdEmpty = $.e("option", {value: 0, html: "< не выбрано >", selected: true}));
							items.map(function (item) {
								chooseTargetIdForm.appendChild($.e("option", item));
							});
							chooseTargetIdForm.disabled = false;
						});

					wrapper.appendChild(chooseFormId);
					modal.setButton("ok", {name: "ok", title: "Далее", onclick: okButtonCallback})
					     .setButton("cancel", {name: "cancel", title: "Назад", onclick: cancelButtonCallback});
					break;

				case APIDOG_SHARE_STEP_ADD_COMMENT:
					if (chooseTargetIdForm) {
						targetId = chooseTargetIdForm.options[chooseTargetIdForm.selectedIndex].value;
					}
					if (targetId === "0") {
						return previousStep();
					}

					clearWrapper();

					wrapper.appendChild($.e("div", {append: [
						targetType === APIDOG_SHARE_TARGET_WALL && (type === "photo" || type === "video" || type === "club") ? $.e("blockquote", {html: "<strong>Внимание!<\/strong> При данном действии Ваш аккаунт станет онлайн! Такова особенность работы API ВКонтакте."}) : null,
						$.e("div", {"class": "tip", html: "Ваш комментарий (необязательно):"}),
						commentNode = $.e("textarea", { "class": "sf" })
					]}));
					modal.setButton("ok", {name: "ok", title: "Готово", onclick: okButtonCallback});
					commentNode.focus();
					break;

				case APIDOG_SHARE_STEP_DO_SHARE:
					comment = commentNode.value.trim();
					doShare();
					break;

				default:
				// ты чо ты чо охуел?
			}
		},

		nextStep = function () {
			setNodeByStep(++step);
		},

		previousStep = function () {
			clearWrapper();
			step === APIDOG_SHARE_STEP_ADD_COMMENT && targetType === APIDOG_SHARE_TARGET_WALL ? step -= 2 : --step;
			setNodeByStep(step);
		},

		clearWrapper = function () {
			$.elements.clearChild(wrapper);
		},

		doShare = function () {

			switch (+targetType) {
				case APIDOG_SHARE_TARGET_WALL:
					api("wall.repost", { object: object, message: comment.toNormal() }).then(function(result) {
						callback({
							message: false,
							postId: result.post_id,
							likes: result.likes_count,
							reposts: result.reposts_count
						}, modal);
					});
					break;

				case APIDOG_SHARE_TARGET_TYPE_USER:

					var params = { attachment: object, message: comment.toNormal(), peer_id: targetId };

					api("messages.send", params).then(function(result) {
						callback({
							message: true,
							messageId: result,
							peerId: targetId
						}, modal);
					});
					break;

				case APIDOG_SHARE_TARGET_TYPE_GROUP:
					api("wall.repost", { object: object, group_id: targetId, message: comment.toNormal() }).then(function(result) {
						callback({
							message: false,
							postId: result.post_id,
							likes: result.likes_count,
							reposts: result.reposts_count,
							groupId: targetId
						}, modal);
					});
					break;

				default:
					console.log("Unknown type")
			}
		},

		okButtonCallback = function() {
			nextStep();
		},

		cancelButtonCallback = function() {
			if (!(step - 1)) {
				modal.close();
			} else {
				previousStep();
			}
		},

		modal = new Modal({
			title: "Поделиться",
			content: wrapper,
			footer: [
				{
					name: "ok",
					title: "Далее",
					onclick: okButtonCallback
				},
				{
					name: "cancel",
					title: "Отмена",
					onclick: cancelButtonCallback
				}
			]
		}).show(options.from);
	nextStep();
}

/**
 * Actions after share
 * @param {object} result
 * @param {Modal} modal
 */
function actionAfterShare(result, modal) {
	modal
		.setContent("Запись успешно отправлена")
		.setButtons([
			{
				name: "go",
				title: "Перейти",
				onclick: function () {
					var u;
					if (result.message) {
						u = "im?to=" + result.peerId;
					} else {
						u = "wall" + (result.groupId ? -result.groupId : API.userId) + "_" + result.postId;
					}
					window.location.hash = "#" + u;
					modal.close();
				}
			},
			{
				name: "cancel",
				title: "Закрыть",
				onclick: function () {
					modal.close();
				}
			}
		])
		.closeAfter(7000);
}