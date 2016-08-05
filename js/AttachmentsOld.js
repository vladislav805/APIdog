/**
 * APIdog v6.5
 *
 * upd: -1
 */

var SelectAttachments = {
	Chated: {},
	CreateSelector: function (type, owner_id) {
		var parent = document.createElement("div"),
			form = document.createElement("div");
		parent.className = "selectattachments-wrap";
		form.id = "selectattachments-wrap";
		form.appendChild($.elements.create("input", {
			type: "button",
			value: "Отмена",
			onclick: SelectAttachments.RemoveSelector,
			style: "float: right;margin-right: 10px;margin-top: -2px;padding: 0px 12px !important;line-height: 29px;",
		}));
		parent.appendChild(form);
		if (type != "map" && $.element("im-geo") && $.element("im-geo").value.split(",") >= 10)
			return Site.Alert({
				text: "К одному сообщению можно прикрепить не более 10 прикреплений."
			})
		switch (type) {
			case "photo":
				parent.appendChild(SelectAttachments.Photos({owner_id: owner_id}));
			break;
			case "audio":
				if (SelectAttachments.Chated["_audio"])
					parent.appendChild(SelectAttachments.Audio(SelectAttachments.Chated["_audio"], {
						chated: true
					}));
				else
					Site.API("audio.get", {count: 30}, function (data) {
						data = Site.isResponse(data);
						if (typeof data !== "undefined") {
							SelectAttachments.Chated["_audio"] = data;
							parent.appendChild(SelectAttachments.Audio(data));
						}
					});
			break;
			case "doc":
				if (SelectAttachments.Chated["_docs"])
					parent.appendChild(SelectAttachments.Docs(SelectAttachments.Chated["_docs"], {
						chated: true
					}, owner_id < 0 ? -owner_id : null));
				else
					Site.API("docs.get", {count: 50}, function (data) {
						data = Site.isResponse(data);
						if (typeof data !== "undefined") {
							Array.prototype.forEach.call(data, function (d) {
								d = Docs.tov5(d);
								Docs.docs[d.owner_id + "_" + d.id] = d;
							});
							SelectAttachments.Chated["_docs"] = data;
							parent.appendChild(SelectAttachments.Docs(data, owner_id < 0 ? -owner_id : null));
						}
					});
			break;
			case "map":
				if ($.element("im-geo") && $.element("im-geo").value != "")
					return Site.Alert({
						text: "К сообщению можно прикрепить только одну карту"
					})
				parent.appendChild($.elements.create("div", {
					id: "attach-map",
					append: [
						$.elements.create("div", {"class": "selectattachments-title", html: "Прикрепить карту"}),
						$.elements.create("h1", {html: "Загрузка Yandex Maps API..."})
					],
					"class": "selectattachments-map"
				}));
				form.appendChild($.elements.create("input",{
					type: "button",
					value: "Готово",
					id: "map-done",
					disabled: true,
					style: "float:right;margin-right:16px;",
					onclick: function (event) {
						var coords = this.getAttribute("coords")
						$.element("im-geo").value = coords;
						SelectAttachments.AddAttachment({type: "map", coords: coords, id: "map"});
						SelectAttachments.RemoveSelector();
					}
				}))
				var asyncFx = SelectAttachments.Map;
			break;
			case "poll":
				parent.appendChild(SelectAttachments.Poll(owner_id, document.createElement("form")));
			break;
		}
		parent.appendChild($.elements.create("div", {"id": "im-listattachments"}));
		if($.element("im-selectattach").children.length > 0)
			SelectAttachments.RemoveSelector();
		$.element("im-selectattach").appendChild(parent);
		if (asyncFx)
			asyncFx();
	},
	RemoveSelector: function () {
		$.elements.clearChild($.element("im-selectattach"));
	},
	AddAttachment: function (data) {
		var node = document.createElement("div"),
			closer = $.elements.create("div",{
				"class": "selectattachments-delete",
				onclick: (function (id) {
					return function (event) {
						$.event.cancel(event);
						return SelectAttachments.DeleteAttachment(id);
					}
				})(data.id)});
			node.id = "attachment-" + data.id;
			node.appendChild(closer);
		switch (data.type) {
			case "photo":
				node.appendChild($.elements.create("img", {
					"class": "selectattachments-photo",
					src: getURL(data.src)
				}));
			break;
			case "doc":
				if (~["jpg", "gif", "png"].indexOf(data.ext)){
					$.elements.addClass(node, "selectattachments-item-noMargin");
					node.appendChild($.elements.create("div", {
						"class": "attachments-doc-img",
						append:[
							$.elements.create("div", {"class": "attachments-doc-gif-real"}),
							$.elements.create("div", {"class": "attachments-doc-gif-preview", append: [
								$.elements.create("img", {src: data.thumb_s, alt: ""}),
								$.elements.create("div", {
									"class": "attachments-doc-title",
									html: data.title + " (" + $.toData(data.size) + ")"
								})
							]})
						]
					}));
				} else
					node.appendChild($.elements.create("div", {
						"class": "selectattachments-doc",
						html: data.title
					}));
			break;
			case "map":
				node.appendChild($.elements.create("div", {
					"class": "attachments-map-preview",
					append: [Wall.GeoAttachment({
						coordinates: data.coords,
						place: {
							title: "Местоположение"
						}
					}, true)]
				}))
			break;
			case "audio":
				$.elements.addClass(node, "selectattachments-item-audio");
				node.appendChild(Audios.Item(Audios.Data[data.id.replace("audio", "")], {
					lid: 0,
					from: 512,
					removeFromAttachments: true
				}));
			break;
			case "poll":
				node.appendChild($.elements.create("div", {append: [
					$.elements.create("span", {html: "Опрос ", "class": 'tip'}),
					$.elements.create("strong", {html: data.title})
				]}));
			break;
		}
		$.elements.addClass(node, "selectattachments-item");
		$.element("im-listattachments").appendChild(node);
		var attachments = $.trim($.element("im-attachments").value).split(",");
		attachments.push(data.id);
		$.element("im-attachments").value = attachments.join(",");
	},
	DeleteAttachment: function (id) {
		var input = $.element("im-attachments");
		input.value = (function (value, i, id) {
			for( ; i < value.length; ++i)
				if (value[i] == id)
					delete value[i];
			return value.join(",");
		})(input.value.split(","), 0, id);
		$.elements.remove($.element("attachment-" + id));
	},
	ClearAttachments: function () {
		$.elements.clearChild($.element("im-listattachments"));
		$.element("im-attachments").value = "";
	},
	UISelector: function (cases) {
		var parent = document.createElement("div"),
			current,
			c,
			isOpen,
			data,
			fx = function (event) {
				$.elements.toggleClass(this, "changer-opened");
				if (this.nextSibling)
					$.elements.toggleClass(this.nextSibling, "hidden");
				return $.event.cancel(event);
			};
		for (var i = 0; i < cases.length; ++i) {
			c = cases[i];
			isOpen = c.isOpen;
			data = c.data;
			current = document.createElement("div");
			current.appendChild($.elements.create("div", {
				"class": "selectfix changer-title" + (isOpen ? " changer-opened" : ""),
				html: c.title,
				onclick: fx
			}));
			current.appendChild($.elements.create("div", {
				"class": (!isOpen ? "hidden" : "") + " changer-content",
				append: typeof data != "array" ? [data] : data
			}));
			parent.appendChild(current);
		}
		return parent;
	},
	Photos: function (opts) {
		var parent = document.createElement("div");
		parent.appendChild($.elements.create("div", {"class": "selectattachments-title",html: "Прикрепить фотографию"}));
		parent.appendChild(
			SelectAttachments.UISelector([
				{
					title: "Загрузить",
					data: SelectAttachments.CreateUploadFormPhoto(opts.owner_id || "")
				},
				{
					title: "Добавить по ссылке",
					data: (function (parent, form, iframe) {
						iframe.name = "_uploader";
						iframe.id = "_uploader";
						iframe.src = "about:blank";
						iframe.className = "hidden";
						form = Site.CreateInlineForm({
							method: "post",
							action: "/?act=requestAttach&mail=" + (+!opts.owner_id),
							target: "_uploader",
							title: "Прикрепить",
							name: "url",
							type: "url",
							placeholder: "Вставьте ссылку на изображение (не более 2Мб файл)",
							onsubmit: function (event) {
								if (this.url && !$.trim(this.url.value)){
									Site.Alert({
										text: "Ошибка! Поле пустое!"
									})
									return false;
								}
								if (this.url && !/^((https?|ftp):\/\/)?([A-Za-z0-9А-Яа-яЁё-]{1,64}\.)+([A-Za-zА-Яа-я]{2,6})\/?(.*)$/img.test(this.url.value)){
									Site.Alert({
										text: "Ошибка! Введена не ссылка!"
									});
									return false;
								}
							}
						});
						iframe.onload = function (event) {
							var frame = getFrameDocument(this);
							if (frame && frame.location.href != "about:blank") {
								var data = $.JSON(frame.getElementsByTagName("body")[0].innerHTML).response;
								if (data.status == 1) {
									if (!data.gif)
										SelectAttachments.AddAttachment({
											type: "photo",
											id: "photo" + data.owner_id + "_" + (data.pid || data.id),
											src: getURL(data.photo_130)
										});
									else {
										data.type = "doc";
										data.id = "doc" + data.owner_id + "_" + (data.did || data.id);
										SelectAttachments.AddAttachment(data);
									}
									SelectAttachments.RemoveSelector();
								} else
									Site.Alert({
										text: "Ошибка! " + (["Файл больше 2Мб.","Введена не ссылка.","Введена ссылка не на изображение"][(--data.error)])
									});
							}
						};
						parent.appendChild(form);
						parent.appendChild(iframe);
						return parent;
					}) (document.createElement("div"), null, document.createElement("iframe"))
				}
			])
		);
		return parent;
	},
	CreateUploadFormPhoto: function (owner_id) {
		var Form = document.createElement("form");
		Form.action = "/upload.php?act=photo_" + (!owner_id ? "mail" : "wall" + (owner_id < 0 ? "&groupId=" + (-owner_id) : ""));
		var fld;
		Form.appendChild($.elements.create("div", {append:[
			fld = Site.CreateFileButton("photo", {fullwidth: true}),
			$.elements.create("input", {type: "submit", value: "Загрузить"})
		]}));
		fld = fld.lastChild;
		fld.multiple = true;
		Form.onsubmit = function (event) {
			event.preventDefault();

			var upload,
				index = 0,
				files = fld.files,
				modal,
				updateUI = function (event) {
					if (modal) {
						modal.setContent(
							event.percent < 99.9
								? "Загрузка файла... " + event.percent.toFixed(1) + "%"
								: "Файл загружен, загрузка на сервер ВКонтакте..."
						);
					}
				},
				result = [],
				finish = function (file) {
					result.push(file);
					next();
				},
				next = function () {
					files[++index] ? doTask(index) : endTask();
				},
				handleError = function (error) {
					var f = files[index];
					Site.Alert({text: "upload file &laquo;" + Site.Escape(f.name) + "&raquo; failure"});
					next();
				},
				endTask = function () {
					modal.close();
					modal = null;

					result.map(function (i) {
						SelectAttachments.AddAttachment({
							type: "photo",
							id: "photo" + i.owner_id + "_" + (i.pid || i.id),
							src: getURL(i.src)
						});
					});
					SelectAttachments.RemoveSelector();
				},

				doTask = function (index) {
					var f = files[index];
					if (f.size > 26214400) { // 25MB
						Site.Alert({text: "file &laquo;" + f.name + "&raquo; was passed because size more than 25MB"});
						return next();
					}
					upload = new VKUpload(f)
						.onUploading(updateUI)
						.onUploaded(finish)
						.onError(handleError)
						.upload(!owner_id ? "photos.getMessagesUploadServer" : "photos.getWallUploadServer", owner_id < 0 ? {group_id: -owner_id} : {user_id: owner_id}, fld);

					var title = "Загрузка (" + (index + 1) + "/" + files.length + ")";

					if (!modal) {
						modal = new Modal({
							title: title,
							content: "Подключение...",
							uncloseableByBlock:  true,
							width: 260
						}).show();
					} else {
						modal.setTitle(title);
					};

				};
			// защита от дурака
			files = Array.prototype.slice.call(files, 0, 10);
			doTask(index);

			return false;
		};
		return Form;
	},





	Docs: function (data, groupId) {
		var parent = document.createElement("div");
		parent.appendChild($.elements.create("div", {"class": "selectattachments-title", html: "Прикрепить документ"}));
		parent.appendChild(
			SelectAttachments.UISelector([
				{
					title: "Загрузить",
					data: SelectAttachments.CreateUploadFormDoc(groupId)
				},
				{
					title: "Выбрать из уже загруженных",
					data: (function (docs, list, fx) {
						for (var i = 1; i < docs.length; ++i)
							list.appendChild(fx(docs[i]));
						return list;
					})(data, document.createElement("div"), function (item) {
						var current = document.createElement("div");
						current.onclick = (function (data) {
							return function (event) {
								data.type = "doc";
								data.id = "doc" + data.owner_id + "_" + (data.did || data.id);
								SelectAttachments.AddAttachment(data);
								SelectAttachments.RemoveSelector();
							}
						})(item);
						current.appendChild($.elements.create("div", {"class": "selectattachments-doc-name",append:[$.elements.create("span",{"class": "tip", html: $.toData(item.size)}),$.elements.create("div",{html:item.title})]}));
						return current;
					})
				}
			])
		);
		return parent;
	},
	CreateUploadFormDoc: function (groupId) {
		var Form = document.createElement("form");
		var onLoad = function (event) {
			if(getFrameDocument(this).location.href == "about:blank")
				return;
			var data = $.JSON(getFrameDocument(this).getElementsByTagName("body")[0].innerHTML);
			if (data && data.owner_id){
				data.type = "doc";
				data.id = "doc" + data.owner_id + "_" + (data.did || data.id);
				SelectAttachments.AddAttachment(data);
				SelectAttachments.RemoveSelector();
			}
		};
		Form.action = "/upload.php?act=doc_wall&groupId=" + groupId;
		Form.method = "post";
		Form.enctype = "multipart/form-data";
		Form.appendChild($.elements.create("div", {append:[
			$.elements.create("iframe", {src: "about:blank", "class": "hidden", id: "mail-doc-uploader", name:"mail-doc-uploader", onload: onLoad}),
			Site.CreateFileButton("file", {fullwidth: true}),
			$.elements.create("input", {type: "submit", value: "Загрузить"})
		]}));
		Form.target = "mail-doc-uploader";
		return Form;
	},
	CheckActivityYandexMapsAPI: function (fx) {
		var YandexAPI = "\/\/api-maps.yandex.ru\/2.0\/?load=package.standard&lang=ru-RU",
			scripts = document.getElementsByTagName("script");
		for (var i = 0; i < scripts.length; ++i)
			if (scripts[i].src == YandexAPI)
				return fx();
		document.getElementsByTagName("head")[0].appendChild($.elements.create("script", {
			type: "text/javascript",
			src: YandexAPI,
			onload: function (event) {
				fx();
			}
		}));
	},
	Map: function () {
		SelectAttachments.CheckActivityYandexMapsAPI(function () {
			var parent = $.element("attach-map");
			parent.style.height = "400px";
			$.elements.remove(parent.lastChild);
			parent.appendChild($.elements.create("div", {id: "attachment-map", "style": "height:370px;"}));
			ymaps.ready(function () {
				var map,
					geolocation = ymaps.geolocation,
					coords = [geolocation.latitude, geolocation.longitude],
					map = new ymaps.Map('attachment-map', {
						center: coords,
						zoom: 10
					});
				map.controls
					.add("smallZoomControl", {left: 5, top: 5})
					.add("searchControl", {left: 5, bottom: 5})
					.add("typeSelector", {right: 7, top: 5})
				map.events.add("click", function (event) {
					if(map && map.group)
						map.group.removeAll()
					var done = $.element("map-done"),
						coords = event.get("coordPosition");
					done.disabled = false;
					done.setAttribute("coords", coords.join(" "));
					map.group = new ymaps.GeoObjectArray({});
					map.group.add(new ymaps.Placemark(coords));
					map.geoObjects.add(map.group);
					map.setCenter(coords, map.getZoom(), {
						duration: 200
					});
				});
			});
		});
	},
	Audio: function (data) {
		var parent = document.createElement("div");
		parent.appendChild($.elements.create("div", {"class": "selectattachments-title", html: "Прикрепить аудиозапись"}));
		var widget = document.createElement("div");
		var lid = (+new Date());
		Audios.Lists[lid] = [];
		for (var i = 1; i < data.length; ++i) {
			widget.appendChild(Audios.Item(data[i], {
				from: 256,
				lid: lid,
				addToAttachments: true
			}));
			Audios.Lists[lid].push(data[i].owner_id + "_" + (data[i].aid || data[i].id));
			Audios.Data[data[i].owner_id + "_" + (data[i].aid || data[i].id)] = data[i];
		}
		parent.appendChild(widget);
		return parent;
	},
	Poll: function (owner_id, Form) {
		var parent = document.createElement("div"),
			List = document.createElement("div"),
			removeItemButton = function (event) {
				$.elements.remove(this.parentNode);
				$.elements.removeClass(add_button, "hidden");
			},
			item = function (unclosable) {
				var a = document.createElement("input"),
					b = document.createElement("div"),
					c = document.createElement("div");
				a.type = "text";
				a.maxlength = 64;
				a.className = "_poll_create_item polls-create-item";
				c.className = "fr feed-close polls-create-item-delete";
				c.type = "button";
				$.event.add(c, "click", removeItemButton);
				if (!unclosable)
					b.appendChild(c);
				b.appendChild(a);
				return b;
			},
			checkbox_anonymous = [
				$.elements.create("input", {type: "checkbox", name: "is_anonymous"}),
				$.elements.create("span", {html: " анонимный", "class": "tip"})
			],
			add_button = $.elements.create("span", {"class": "a", html: "Добавить", onclick: function (event) {
				if (List.children.length < 10) {
					List.appendChild(item());
					if (List.children.length >= 10)
						$.elements.addClass(this, "hidden");
				} else {
					Site.Alert({text: "Возможно прикрепить 10 вариантов ответа"});
					$.elements.addClass(this, "hidden");
				}
			}});
		parent.appendChild($.elements.create("div", {"class": "selectattachments-title", html: "Прикрепить опрос"}));
		List.id = "_poll_create_items_wrap";
		List.appendChild(item(true));
		List.appendChild(item(true));
		Form.className = "sf-wrap";
		Form.appendChild($.e("span", {"class": "tip", html: "Вопрос:"}));
		Form.appendChild($.e("input", {type: "text", name: "question", required: true}));
		Form.appendChild($.e("span", {"class": "tip", html: "Ответы:"}));
		Form.appendChild(List);
		Form.appendChild(add_button);
		Form.appendChild($.e("label", {append: checkbox_anonymous}));
		Form.appendChild($.e("input", {type: "submit", value: "Прикрепить"}));
		Form.onsubmit = function (event) {
			var title = this.question && this.question.value,
				is_anonymous = this.is_anonymous.checked,
				items = (function (items) {
					var answers = [], item;
					for (var i = 0, l = items.length; i < l; ++i) {
						item = $.trim(items[i].value);
						if (item)
							answers.push(item);
					};
					return JSON.stringify(answers);
				})(List.querySelectorAll("input[type=text]"));
			if (!title || items == "[]" || items == "[\"\"]") {
				Site.Alert({text: "Ошибка!"});
				return false;
			}
			Site.APIv5("polls.create", {
				owner_id: (owner_id < 0 ? owner_id : API.uid),
				question: title,
				is_anonymous: +is_anonymous,
				add_answers: items,
				v: 5.0
			}, function (data) {
				if (data.response) {
					data = data.response;
					var id = data.owner_id + "_" + data.id;
					SelectAttachments.AddAttachment({type: "poll", id: "poll" + id, title: title});
					SelectAttachments.RemoveSelector();
				} else
					Site.Alert({text: "Ошибка!<br><br>" + data.error.error_msg});
			})
			return false;
		};
		parent.appendChild(Form);
		return parent;
	}
};