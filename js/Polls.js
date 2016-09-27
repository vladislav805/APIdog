/**
 * APIdog v6.5
 *
 * TODO:
 * 		1. replace
 */

var Polls = {
	getAttachment: function(poll, id) {
		var e = $.e;
		return e("div", {"class": "attachments-poll", append: [
				e("div", {"class": "wall-icons wall-icon-poll"}),
				e("span", {"class": "tip", html: " " + Lang.get("polls.poll") + " "}),
				e("strong", {append: e("a", {href: "#" + id, html: poll.question.safe()}) })
			]
		});
	},
	getFullAttachment: function(poll) {
		var e = $.e,
			ownerId = poll.owner_id,
			pollId = poll.id || poll.poll_id,
			form = e("form", {"class": "wall-poll", id: "poll" + ownerId + "_" + pollId}),
			list = e("div", {"class": "poll-answers"}),
			isBoard = poll.is_board || 0,
			selectedAnswerId = poll.answer_id;

		var getItem = function(obj) {
			var answerId = (obj.id || obj.answer_id),
				goToVoters = !poll.anonymous
					? function(event) {
						Polls.showVoters(ownerId, pollId, answerId);
						return cancelEvent(event);
					  }
					: null;

			list.appendChild(e("div", {
				"class": "poll-option",
				id: "poll" + ownerId + "_" + pollId + "_" + answerId,
				append: [
					e("div", {"class": "poll-option-info", append: [
						e("div", {"class": "poll-line-count tip fr", html: obj.rate + "% (" + obj.votes + ")", onclick: goToVoters}),
						e("div", {
							"class": "poll-option-item" + (!selectedAnswerId ? " a" : "") + (answerId == selectedAnswerId ? " poll-selected" : ""),
							html: obj.text.safe()
						})
					]}),
					e("div", {
						"class": "poll-line-in",
						style: "width:" + obj.rate + "%",
						onclick: goToVoters
					})
				],
				onclick: function(event) {
					$.event.cancel(event);

					if (selectedAnswerId) {
						return;
					};

					new APIRequest("polls.addVote", {
						ownerId: ownerId,
						pollId: pollId,
						answerId: answerId,
						isBoard: parseInt(isBoard)
					}).debug().setOnCompleteListener(function(data) {
						if (data) {
							Polls.update(ownerId, pollId, isBoard);
						};
					}).setOnErrorListener(function(error) {

					}).execute();
				}
			}));
		};

		form.appendChild(e("div", {
			"class": "poll-top",
			append: [
				e("span", {
					"class": "fr tip",
					html: (
						poll.anonymous
							? lg("polls.typeClose")
							: lg("polls.typeOpen")
					) + " " + lg("polls.noun") + ", " + poll.votes + " " + lg("polls.votersCounts", poll.votes)
				}),
				e("strong", {
					html: lg("polls.poll") + " &laquo;" + poll.question.safe() + "&raquo;"
				})
			]
		}));

		var answers = poll.answers;

		answers.forEach(getItem);

		form.appendChild(list);

		if (selectedAnswerId) {
			form.appendChild(e("a", {
				"class": "poll-removeVote",
				html: lg("polls.cancelVote"),
				onclick: function(event) {
					new APIRequest("polls.deleteVote", {
						ownerId: ownerId,
						pollId: pollId,
						answerId: selectedAnswerId,
						isBoard: parseInt(isBoard)
					}).debug().setOnCompleteListener(function(data) {
						if (data) {
							Polls.update(ownerId, pollId, isBoard);
						};
					}).execute();
					return cancelEvent(event);
				}
			}));
		};

		return form;
	},

	update: function(ownerId, pollId, isBoard) {
		var node = $.element("poll" + ownerId + "_" + pollId);

		if (node) {
			node.style.opacity = .5;
			node.appendChild($.e("div", {
				"class": "poll-updater animation",
				html: lg("polls.updating")
			}));
		};

		new APIRequest("polls.getById", {
			ownerId: ownerId,
			pollId: pollId,
			isBoard: parseInt(isBoard)
		}).setOnCompleteListener(function(data) {
			isBoard && (data.isBoard = 1);

			if (node) {
				node.parentNode.insertBefore(Polls.getFullAttachment(data), node);
				$.elements.remove(node);
			};
		}).execute();
	},

	polls: {},

	getAnswer: function(ownerId, pollId, answerId) {
		var poll, answers;
		poll = Polls.polls[ownerId + "_" + pollId];

		if (!poll) {
			return false;
		};

		answers = poll.answers;

		for (var i = 0, l = answers.length; i < l; ++i) {
			if (answers[i].id == answerId) {
				return answers[i];
			};
		};

		return false;
	},



	showVoters: function(ownerId, pollId, answerId) {
		var has = !!(Polls.polls[ownerId + "_" + pollId]),
			onlyFriends = +!!+Site.get("onlyFriends");
		Site.Loader();

		APIRequest.createExecute("var p,u,o=Args.o,p=Args.p,a=Args.a,i=Args.i;if(!Args.n){p=API.polls.getById({owner_id:o,poll_id:p,v:5.29});};u=API.polls.getVoters({owner_id:o,poll_id:p,answer_ids:a,fields:Args.q,offset:i,count:75,v:5.29,friends_only:f});return{p:p,u:u};", {
				o: ownerId,
				p: pollId,
				a: answerId,
				i: getOffset(),
				f: onlyFriends,
				q: "photo_50,online,screen_name"
		}).setOnCompleteListener(function(data) {
			if (data.p) {
				Polls.polls[ownerId + "_" + pollId] = data.p;
			};

			var e = $.e,
				parent = e("div"),
				list = e("div"),
				tabs = e("div"),
				poll = Polls.polls[ownerId + "_" + pollId],
				answers = poll.answers,
				answer = Polls.getAnswer(ownerId, pollId, answerId);

			for (var k = 0, l = answers.length; k < l; ++k) {
				tabs.appendChild(e("a", {
					href: "#poll" + ownerId + "_" + pollId + "?answerId=" + answers[k].id,
					html: Site.Escape(answers[k].text),
					"class": "tab-link" + (answers[k].id == answerId ? " tab-sel" : "")
				}));
			};

			var users = data.u[0].users,
				count = users.count,
				fr,
				check = e("label", {
					"class": "sf-wrap fr",
					append: [
						fr = e("input", {
							type: "checkbox",
							onchange: function(event) {

							}
						}),
						e("span", {"class": "tip", html: " только друзья"})
					]
				});
			console.log(onlyFriends);
			if (onlyFriends)
				fr.checked = true;
			users = users.items;
			parent.appendChild(Site.CreateHeader(Lang.get("polls.voters") + " &laquo;" + answer.text + "&raquo;", check));
			parent.appendChild(tabs);
			Array.prototype.forEach.call(users, function(u) {
				list.appendChild(Templates.getMiniUser(u));
			});


			parent.appendChild(list);

			new Modal({
				title: "title",
				content: parent,
				noPadding: true,
				footer: [{
					name: "ok",
					title: lg("general.close"),
					onclick: function(event) {
						this.close();
					}
				}]
			}).show();
		}).execute();
	},
};
