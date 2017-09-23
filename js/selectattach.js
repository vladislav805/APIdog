var SelectAttachments = {

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
				owner_id: (owner_id < 0 ? owner_id : API.userId),
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
