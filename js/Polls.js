/**
 * APIdog v6.5
 *
 * upd: -1
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
			form = e("form", {"class": "sf-wrap wall-poll", id: "poll" + ownerId + "_" + pollId}),
			list = e("div", {"class": "poll-answers"}),
			isBoard = poll.is_board || 0,
			answerId = poll.answer_id;
		var getItem = function(obj) {
			var id = (obj.id || obj.answer_id), goToVoters = (!poll.anonymous ? function(event){
				window.location.hash = "#poll" + ownerId + "_" + pollId + "?answerId=" + id;
				return cancelEvent(event);
			} : null);
			list.appendChild(e("div", {
				"class": "poll-option",
				id: "poll" + ownerId + "_" + pollId + "_" + id,
				append: [
					e("div", {"class": "poll-line-count tip fr", html: obj.rate + "% (" + obj.votes + ")", onclick: goToVoters}),
					e("div", {
						"class": "poll-option-item" + (!answerId ? " a" : "") + (id == answerId ? " poll-selected" : ""),
						html: obj.text.safe()
					}),
					e("div", {
						"class": "poll-line",
						append: e("div", {"class": "poll-line-in", style: "width:" + obj.rate + "%"}),
						onclick: goToVoters
					})
				],
				onclick: function(event) {
					$.event.cancel(event);
					if (answerId)
						return;
					Site.API("polls.addVote", {
						owner_id: ownerId,
						poll_id: pollId,
						answer_id: id,
						is_board: parseInt(isBoard)
					}, function(data) {
						data = Site.isResponse(data);
						if (data)
							Polls.update(ownerId, pollId, isBoard);
					});
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
							? Lang.get("polls.type_close")
							: Lang.get("polls.type_open")
					) + " " + Lang.get("polls.poll_noun")
				}),
				e("strong", {
					style: "color: gray",
					html: Lang.get("polls.poll") + " &laquo;" + poll.question.safe() + "&raquo;"
				})
			]
		}));
		var answers = poll.answers;

		answers.forEach(getItem);

		if (answerId)
			list.appendChild(e("a", {
				"class": "tip",
				html: Lang.get("polls.cancel_my_vote"),
				onclick: function(event) {
					Site.API("polls.deleteVote", {
						owner_id: ownerId,
						poll_id: pollId,
						answer_id: answerId,
						is_board: parseInt(isBoard)
					}, function(data){
						data = Site.isResponse(data);
						if (data)
							Polls.update(ownerId, pollId, isBoard);
					})
					return cancelEvent(event);
				}
			}))
		form.appendChild(list);
		return form;
	},
	update: function(ownerId, pollId, isBoard) {
		var node = $.element("poll" + ownerId + "_" + pollId);
		node.style.opacity = 0.5;
		node.appendChild($.e("div", {
			"class": "poll-updater animation",
			html: Lang.get("polls.updating")
		}));
		Site.API("polls.getById", {
			owner_id: ownerId,
			poll_id: pollId,
			is_board: parseInt(isBoard)
		}, function(data) {
			data = Site.isResponse(data);
			if (isBoard)
				data.isBoard = 1;
			node.parentNode.insertBefore(Polls.getFullAttachment(data), node);
			$.elements.remove(node);
		});
	},
	polls: {},
	getPoll: function(ownerId, pollId) {
		// wtf here is empty? O_o
	},
	getAnswer: function(ownerId, pollId, answerId) {
		var poll, answers;
		poll = Polls.polls[ownerId + "_" + pollId];
		if (!poll) return false;
		answers = poll.answers;
		for (var i = 0, l = answers.length; i < l; ++i)
			if (answers[i].id == answerId)
				return answers[i];
		return false;
	},
	getList: function(ownerId, pollId, answerId) {
		var has = !!(Polls.polls[ownerId + "_" + pollId]),
			onlyFriends = +!!+Site.get("onlyFriends");
		Site.Loader();
		Site.API("execute", {
			code: ("var p,u,o=Args.o,p=Args.p,a=Args.a,i=Args.i;if(!Args.n){p=API.polls.getById({owner_id:o,poll_id:p,v:5.29});};u=API.polls.getVoters({owner_id:o,poll_id:p,answer_ids:a,fields:Args.q,offset:i,count:75,v:5.29,friends_only:f});return{p:p,u:u};"),
				o: ownerId,
				p: pollId,
				a: answerId,
				i: getOffset(),
				f: onlyFriends,
				q: "photo_50,online,screen_name"
		}, function(data) {
			data = Site.isResponse(data);
			if (data.p)
				Polls.polls[ownerId + "_" + pollId] = data.p;
			var e = $.e,
				parent = e("div"),
				list = e("div"),
				tabs = e("div"),
				poll = Polls.polls[ownerId + "_" + pollId],
				answers = poll.answers,
				answer = Polls.getAnswer(ownerId, pollId, answerId);
			for (var k = 0, l = answers.length; k < l; ++k)
				tabs.appendChild(e("a", {
					href: "#poll" + ownerId + "_" + pollId + "?answerId=" + answers[k].id,
					html: Site.Escape(answers[k].text),
					"class": "tab-link" + (answers[k].id == answerId ? " tab-sel" : "")
				}));
			var users = data.u[0].users,
				count = users.count,
				fr,
				check = e("label", {
					"class": "sf-wrap fr",
					append: [
						fr = e("input", {
							type: "checkbox",
							onchange: function(event) {
								window.location.hash = "#poll" + ownerId + "_" + pollId + "?answerId=" + answerId + "&onlyFriends=" + (+this.checked);
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
			Site.Append(parent);
			Site.SetHeader(Lang.get("polls.info_about_poll").replace(/%t/img, answer.text));
		})
	},
};
