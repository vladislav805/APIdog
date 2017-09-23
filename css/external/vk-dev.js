var Deva = {

	init: function(opts) {
		cur.searchEl = ge('dev_top_input');
		// placeholderSetup(cur.searchEl, {back: true});

		cur.nav.push(function(changed, old, n) {
			if ((old[0] == 'dev' || old[0] == 'dev/') && !old.act || old[0].substr(0, 3) !== 'dev') {
				return true;
			}
			if (n[0].substr(0, 4) == 'dev/' || (n[0] == 'dev' && n.act) && cur.page) {
				var page = n[0].substr(4);
				if (page) {
					Dev.switchPage(page, n.edit, n);
					return false;
				}
			}
		});

		var onKey = function(e) {
			if (cur.edit && e.keyCode == 83 && (e.ctrlKey || e.metaKey)) {
				var btn = ge('dev_save_button');
				btn.click();
				return cancelEvent(e);
			}
			if (e.keyCode == KEY.RETURN && hasClass(e.target, 'dev_param_field')) {
				ge('dev_req_run_btn').click();
			}
		}
		Dev.scrollnode = browser.msie6 ? pageNode : window;
		window.scrollTop = bodyNode.scrollTop = pageNode.scrollTop = htmlNode.scrollTop = 0;
		addEvent(document, 'keydown', onKey);
		addEvent(Dev.scrollnode, 'scroll', Dev.scrollCheck);
		addEvent(window, 'resize', Dev.onResize);
		setTimeout(Dev.scrollCheck, 50);
		cur.destroy.push(function() {
			removeEvent(document, 'keydown', onKey);
			removeEvent(Dev.scrollnode, 'scroll', Dev.scrollCheck);
			removeEvent(window, 'resize', Dev.onResize);

			cur.seactionSearchScroll && cur.seactionSearchScroll.destroy && cur.seactionSearchScroll.destroy();
		});

		Dev.initPage(opts);
		Dev.initSuggestions();
		Dev.onResize();
		placeholderSetup('dev_top_input');
		cur.verDD && Dev.checkMethodParams();

		Dev.mainPageSliderInit(opts.main_slider_items);
	},

	initPage: function(opts) {
		if (opts.edit) {
			var desc = ge('dev_method_desc');
			placeholderSetup(desc, {back: true});
			var simular = ge('dev_edit_simular');
			placeholderSetup(simular, {back: true});
			var textareas = geByClass('dev_textarea', ge('dev_page'));
			for(var i in textareas) {
				autosizeSetup(textareas[i], {});
			}
			elfocus(desc);
		}
		if (opts.res) {
			Dev.requestResult(parseJSON(opts.res));
		}
		opts.lang = extend(cur.lang || {}, opts.lang);
		extend(cur, opts);
		// elfocus(cur.searchEl);
		cur.editors = [];
		if (opts.editors) {
			for(var i in opts.editors) {
				var ed = opts.editors[i];
				cur.initEdit.apply(cur.initEdit, ed);
			}
		}
		this.checkBlockHeight();
		this.scrollToAnchor();

		each(geByClass('dev_methods_list_access_group_icon'), function () {
			this.onmouseover = showTooltip.pbind(this, {
				text: getLang('developers_group_access_method_tip'),
				black: 1,
			});
		});
	},

	checkBlockHeight: function() {
		var left = geByClass1('dev_left_nav_wrap'), wrap = ge('dev_page_wrap1'),
			block = wrap && geByClass1('dev_page_block', wrap) || wrap;

		if (!left || !block || geByClass1('no_min_height', block)) return;

		var leftSZ = getSize(left), wrapSZ = getSize(wrap),
			paddTop = intval(getStyle(block, 'paddingTop')),
			paddBottom = intval(getStyle(block, 'paddingBottom'));
		if (wrapSZ[1] < leftSZ[1]) {
			setStyle(block, {minHeight: leftSZ[1] - paddTop - paddBottom});
		} else {
			setStyle(wrap, {minHeight: 0});
			setStyle(block, {minHeight: 0});
		}
		onBodyResize(true);
	},
	diselectLeftNav: function() {
		var selNode = geByClass1('nav_selected', 'dev_left_nav');
		if (!selNode) {
			return;
		}
		removeClass(selNode, 'nav_selected');
		var id = selNode.id.replace('dev_mlist_', ''), submenu = ge('dev_mlist_submenu_'+id);
		if (submenu) {
			hide(submenu);
		} else {
			hide(selNode.parentNode);
		}
	},
	setLeftNav: function(sel) {
		if (sel == 'null') {
			Dev.diselectLeftNav();
			return;
		}

		if (!Dev.checkExpandMethodList(sel)) {
			return;
		}

		var p = ge('dev_mlist_'+sel);
		if (p) {
			var submenu = ge('dev_mlist_submenu_'+sel);
			if (submenu) {
				show(submenu);
			} else if (!geByClass1('nav_selected', p.parentNode)) {
				addClass(p, 'nav_selected');
				show(p.parentNode);
			}
		}
	},

	checkExpandMethodList: function (sel) {
		var pageRaw = String(sel).split('.');
		if (cur.sections && cur.sections[pageRaw[0]]) {
			return false;
		}
		return true;
	},

	animLeftNav: function(oldSel, newSel, page) {
		var leftNav = ge('dev_left_nav');
		if (!leftNav || !newSel) return;

		var mark = ge('dev_left_nav_mark'),
			fromY = oldSel && oldSel.offsetTop || 0, toY, duration,
			oldSubMenu = oldSel ? (hasClass(oldSel, 'submenu') ? domPN(oldSel) : domNS(oldSel)) : false,
			newSubMenu = newSel ? (hasClass(newSel, 'submenu') ? domPN(newSel) : domNS(newSel)) : false;

		if (!Dev.checkExpandMethodList(page)) {
			newSubMenu = false;
			Dev.diselectLeftNav();
		}

		//f (oldSubMenu !== newSubMenu) {
		hide(oldSubMenu);
		show(newSubMenu);
		//}
		if (oldSel) {
			toY = newSel.offsetTop || 0;
			duration = (toY != fromY) ? intval(30 * Math.log(Math.abs(toY - fromY) / 5)) : 0;
			setStyle(mark, {height: getSize(oldSel)[1], top: fromY});
			addClass(leftNav, 'anim');
			animate(mark, {height: getSize(newSel)[1], top: toY}, {duration: duration, transition: Fx.Transitions.easeOutCirc, onComplete: function() {
				removeClass(leftNav, 'anim');
				setStyle(mark, {display: ''});
			}});
			if (oldSubMenu && oldSubMenu !== newSubMenu) {
				show(oldSubMenu);
				slideUp(oldSubMenu, duration);
			}
			if (newSubMenu && oldSubMenu !== newSubMenu) {
				hide(newSubMenu);
				slideDown(newSubMenu, duration);
			}
		}
	},

	onResize: function() {
		var nav = ge('dev_left_nav'), acts = ge('dev_page_acts');

		var redraw = function(el) {
			if (getStyle(el, 'position') == 'fixed') {
				setStyle(el, {position: 'relative'});
				el.offsetLeft;
				setStyle(el, {position: 'fixed'});
			}
		}
		if (nav) {
			redraw(nav);
			setTimeout(redraw.pbind(nav), 0);
		}
		if (acts) {
			redraw(acts);
			setTimeout(redraw.pbind(acts), 0);
		}
		Dev.scrollCheck();
	},

	scrollCheck: function() {
		var nav = geByClass1('dev_left_nav_wrap');
		if (!nav) return false;

		var wh = window.lastWindowHeight || 0, st = Math.min(scrollGetY(), bodyNode.clientHeight - wh), pos = 0,
			head = ge('dev_top_nav_wrap'), headH = getSize(head)[1], position, ml,
			bottom = ge('dev_footer_wrap'), bottomH = isVisible(bottom) ? getSize(bottom)[1] : 0,
			navPos = getXY(nav)[1], navH = getSize(nav)[1], navMT = intval(getStyle(nav, 'marginTop')),
			page = ge('dev_page_wrap'), pageH = getSize(page)[1], navMB = navMT + 25,
			tooBig = navH > pageH, navPB = Math.max(0, bottomH + st + wh - bodyNode.clientHeight - navMB),
			lastPos = (cur.filterLastPos === undefined) ? headH : cur.filterLastPos, lastSt = cur.lastSt || 0;
		if ((st > 0 || browser.msie) && !tooBig) {
			position = 'fixed';
			pos = (wh - headH > navH + navMT + navMB + navPB) ? headH : Math.max(Math.min(headH, lastPos + lastSt - st), wh - navH - navMT - navMB - navPB);
			ml = Math.min(0, Math.max(-bodyNode.scrollLeft, bodyNode.clientWidth - getSize(ge('page_layout'))[0]));
			cur.filterLastPos = pos;
		} else {
			position = 'relative';
			pos = ml = 0;
			cur.filterLastPos = headH;
		}
		cur.lastSt = st;
		setStyle(nav, {top: pos + 'px', marginLeft: ml + 'px', position: position});
	},

	scrollToAnchor: function() {
		handleScroll((nav.fromStr(nav.curLoc || nav.strLoc).f || '').replace(/\+/g, ' '));
	},

	switchPage: function(page, edit, opts) {
		cur.page = page;
		var pageRaw = page.split('.');

		var mlist = ge('dev_mlist_list'),
			curSel = geByClass1('nav_selected', ge('dev_left_nav')),
			isMethod = !!pageRaw[1] || page == 'execute', newSel;

		Dev.switchSection(pageRaw[0], false, true);

		if (isMethod) {
			newSel = ge('dev_mlist_' + pageRaw[0]);
			if (!newSel || hasClass(newSel, 'dev_mlist_item'))  {
				newSel = pageRaw[0] == 'orders' && ge('dev_mlist_payments')/* || ge('dev_mlist_methods')*/;
			}
		} else {
			newSel = ge('dev_mlist_'+page.replace('.', '_'));
			if (!newSel && cur.sections && cur.sections[page]) {
				newSel = ge('dev_mlist_' + page) || page == 'orders' && ge('dev_mlist_payments')/* || ge('dev_mlist_methods')*/;
			}
		}

		if (newSel) {
			removeClass(curSel, 'nav_selected');
			addClass(newSel, 'nav_selected');
		} else {
			cur.noSelFound = true;
		}
		Dev.animLeftNav(curSel, newSel, page);

		if (isMethod && mlist) {
			var curMSel = geByClass1('nav_selected', mlist),
				newMSel = ge('dev_mlist_'+page.replace('.', '_'));
			removeClass(curMSel, 'nav_selected');
			if (newSel) {
				addClass(newMSel, 'nav_selected');
			}
		}

		var actsCont = ge('dev_page_acts');
		var pageOpts = {preload: 1};
		if (opts && opts.translate) {
			pageOpts.translate = opts.translate;
		}
		if (opts && opts.f) {
			pageOpts.f = opts.f;
		}
		if (edit) {
			pageOpts.edit = 1;
		} else if (opts && opts.act == 'history') {
			pageOpts.act = 'history';
		}
		if (opts && opts.ver) {
			pageOpts.ver = opts.ver;
		}

		if (Dev.checkExpandMethodList(page)) {
			ge('dev_section_methods').innerHTML = '';
		}

		ajax.post('/dev/'+page, pageOpts, {
			onDone: function(title, text, acts, top_section, edit_sections, isPage, isSection, opts, js, bodyClass, parent_section, section_methods) {
				window.tooltips && tooltips.hideAll();
				ge('dev_header_name').innerHTML = title;
				ge('dev_page_cont').innerHTML = text;
				ge('dev_page_acts').innerHTML = acts;
				ge('dev_page_sections').innerHTML = edit_sections;
				ge('dev_section_methods').innerHTML = section_methods;
				if (top_section && ge('dev_top_' + top_section)) {
					each(geByClass('dev_top_link', ge('dev_top_nav')), function() {
						removeClass(this, 'sel');
					});
					addClass(ge('dev_top_' + top_section), 'sel');
				}
				if (bodyClass !== bodyNode.className) {
					bodyNode.className = bodyClass;
				}
				delete pageOpts.preload;
				delete cur.verDD;
				Dev.setLeftNav(parent_section);
				nav.setLoc('dev/'+page+nav.toStr(pageOpts));
				toggle('dev_method_narrow', !isPage && !isSection && pageOpts.act !== 'history');
				Dev.initPage(opts);
				if (js) {
					eval('(function(){' + js + ';})()');
				}

				if (cur.seactionSearchScroll) {
					cur.seactionSearchScroll.destroy();
					delete cur.seactionSearchScroll;
				}

				scrollToTop(0);
			},
			showProgress: function() {
				// if (newSel && !cur.devSectLoader) {
				//   cur.devSectLoader = actsCont.innerHTML;
				//   actsCont.innerHTML = '<div class="progress_inline dev_sect_load fl_r"></div>';
				// }
			},
			hideProgress: function() {
				// if (cur.devSectLoader) {
				//   actsCont.innerHTML = cur.devSectLoader;
				//   cur.devSectLoader = false;
				// }
			}
		});
	},

	switchSection: function(sect, openSect, onlyIfSect) {
		if (cur.sect == sect) {
			return;
		}
		if (!cur.sections || !cur.sections[sect]) {
			if (onlyIfSect) {
				return;
			}
			sect = 'users';
		}

		//remove old selection
		var curSel = geByClass1('nav_selected', ge('dev_mlist_list'));
		removeClass(curSel, 'nav_selected');

		/*var rows = cur.sections[sect].list;
		var name = cur.sections[sect].name;
		ge('dev_section_menu').innerHTML = name;
		if (cur.methodsDD && cur.methodsDD.header && cur.methodsDD.header.firstChild) {
		  cur.methodsDD.header.firstChild.innerHTML = name;
		}
		var html = '';
		var firstMethod = false;
		for (var i in rows) {
		  var name      = rows[i][0];
		  var className = rows[i][1];
		  if (!firstMethod) {
			firstMethod = name;
		  }
		  html += '<a id="dev_mlist_'+(name.replace(/\./g, '_'))+'" class="dev_mlist_item'+(cur.page == name ? ' nav_selected' : '')+(className ? ' '+className : '')+'" href="/dev/'+name+'" role="listitem">'+name+'</a>';
		}
		var mlist = ge('dev_mlist_list');
		mlist.innerHTML = html;
		*/

		cur.sect = sect;
		if (openSect) {
			nav.go('/dev/'+sect);
		}
	},

	getParamName: function(obj) {
		var name = obj.id.replace(/^dev_edit_/, '');
		return name.substr(0, 1).toUpperCase() + name.substr(1);
	},

	saveDoc: function(hash, btn) {
		var params = {act: 'a_save_page', hash: hash, page: cur.page, type: cur.type};
		if (nav.objLoc.translate) {
			params.translate = parseInt(nav.objLoc.translate);
		}
		var textareas = geByClass('dev_textarea', ge('dev_page'));
		for (var i in textareas) {
			params[Dev.getParamName(textareas[i])] = val(textareas[i]);
		}
		if (cur.editors) {
			for (var i in cur.editors) {
				var ed = cur.editors[i];
				if (ed) {
					params[Dev.getParamName(ed.cont)] = ed.val();

				}
				debugLog('ed', ed);
			}
		}
		var inputs = geByClass('dev_input', ge('dev_page'));
		for (var i in inputs) {
			params[Dev.getParamName(inputs[i])] = val(inputs[i]);
		}
		var parents = [];
		if (cur.dropDowns) {
			for (var i in cur.dropDowns) {
				var iItem = cur.dropDowns[i];
				var value = iItem.val();
				if (parseInt(value) != -1) {
					for(var k in iItem.options.defaultItems) {
						var kItem = iItem.options.defaultItems[k];
						if (kItem[0] == value) {
							parents.push(kItem[2]);
							break;
						}
					}
				}
			}
		}
		params['parents'] = parents.join(',');
		var settings_page_hidden = ge('settings_page_hidden');
		if (settings_page_hidden) {
			params['page_settings_hidden'] = settings_page_hidden.checked ? 1 : 0;
		}
		ajax.post('dev', params, {
			onDone: function(msg) {
				showDoneBox(msg);
			},
			showProgress: lockButton.pbind(btn),
			hideProgress: unlockButton.pbind(btn)
		})
	},

	clearMethodRes: function (btn, hash) {
		lockButton(btn);
		ajax.post('dev.php', {
			act: 'a_clear_method_res',
			page: cur.page,
			hash: hash,
		}, {
			onDone: function () {
				ge('dev_result').innerHTML = '';
				unlockButton(btn);
			},
			onFail: function () {
				unlockButton(btn);
			}
		})
	},

	parentChange: function(dd, v, objId) {
		var cont = ge(objId);

		var el = cont;
		var nextEl = el.nextSibling;
		while (nextEl) {
			if (hasClass(nextEl, 'dev_sel_section')) {
				for (var i in cur.dropDowns) {
					if (cur.dropDowns[i].container.parentNode == nextEl) {
						cur.dropDowns.splice(i ,1);
					}
				}
				re(nextEl);
			} else {
				el = nextEl;
			}
			nextEl = el.nextSibling;
		}
		if (parseInt(v) == -1) {
			var name = '';
		} else {
			var name = '';
			for (var i in dd.defaultItems) {
				if (parseInt(dd.defaultItems[i][0]) == parseInt(v)) {
					name = dd.defaultItems[i][2];
				}
			}
		}
		var prg = ge('dev_sections_progress');
		var parents = [];
		if (cur.dropDowns) {
			for (var i in cur.dropDowns) {
				var iItem = cur.dropDowns[i];
				var value = iItem.val();
				if (parseInt(value) == -1) {
					break;
				} else {
					for(var k in iItem.options.defaultItems) {
						var kItem = iItem.options.defaultItems[k];
						debugLog(kItem);
						if (kItem[0] == value) {
							parents.push(kItem[2]);
							break;
						}
					}
				}
			}
		}
		ajax.post('dev', {act: 'a_get_sections', name: name, page: cur.page, parents: parents.join(','), hash: cur.editHash}, {
			onDone: function(rows, js) {
				cont.parentNode.insertBefore(cf(rows), prg);
				eval('(function(){' + js + ';})()');
			},
			showProgress: show.pbind(prg),
			hideProgress: hide.pbind(prg)
		});
	},

	changeConsoleCheckBox: function(el) {
		checkbox(el);
		var v = hasClass(el, 'on') ? 1 : 0;
		val(geByClass1('dev_param_checkbox_val', el), v);
	},

	checkMethodParams: function() {
		var params = geByClass('dev_param_item', ge('dev_params_wrap'));
		var ver = cur.verDD.val().split('.');

		var verA = parseInt(ver[0]),
			verB = parseInt(ver[1]);

		for(var i = 0; i < params.length; i++) {
			var param = params[i],
				from_version = param.getAttribute('data-from-version'),
				deprecated_from = param.getAttribute('data-deprecated-from');

			var from = Dev.checkParamVersion(from_version.split('.'), verA, verB),
				dep = Dev.checkParamVersion(deprecated_from.split('.'), verA, verB, 1);

			var helper = geByClass1('dev_param_disabled_helper', param);
			if (helper.tt) helper.tt.destroy();

			if (from || dep) {
				addClass(param, 'dev_param_disabled');
				var str = [];
				if (dep) str.push(cur.lang.developers_deprecated_from_err.replace('%s', deprecated_from));
				if (from) str.push(cur.lang.developers_from_version_err.replace('%s', from_version));
				helper.setAttribute('onmouseover', 'showTooltip(this, {text: \''+str.join('<br>')+'\', shift: [0,0,0], black: 1})');
			} else {
				removeClass(param, 'dev_param_disabled');
			}
		}
	},

	checkParamVersion: function(ver, a, b, dep){
		var verA = parseInt(ver[0]),
			verB = parseInt(ver[1]);

		if (verA == 0) return false;

		if (dep) {
			if (a > verA || (verA == a && b >= verB)) {
				return true;
			}
		} else {
			if (a < verA || (verA == a && b < verB)) {
				return true;
			}
		}

		return false;
	},

	methodRun: function(hash, btn, paramsAdd) {
		var params = {hash: hash};
		var paramsFields = geByClass('dev_param_item', ge('dev_params_wrap'));

		window.tooltips && tooltips.hideAll();

		var params = {act: 'a_run_method', method: cur.page, hash: hash};
		for (var i in paramsFields) {
			if (hasClass(paramsFields[i], 'dev_param_disabled')) {
				continue;
			}
			var el = geByClass1('dev_param_field', paramsFields[i]);
			if (hasClass(el, 'dev_param_checkbox')) {
				var v = hasClass(el, 'on') ? 1 : 0;
			} else {
				var v = val(el);
			}
			if (v !== '') {
				params['param_'+el.id.substr(10)] = v;
			}
		}
		if (cur.edit) {
			params['_edit'] = '1';
		}
		if (cur.verDD) {
			params['param_v'] = cur.verDD.val_full()[1];
		}
		if (paramsAdd) {
			for(var i in paramsAdd) {
				params['param_'+i] = paramsAdd[i];
			}
		}

		var url_params = [];
		for(var i in params) {
			if(i.substr(0, 6) == 'param_') {
				url_params.push('params[' + i.substr(6) + ']=' + encodeURIComponent(params[i]));
			}
		}
		history.pushState({}, '', location.pathname + '?' + url_params.join('&'));

		var onResponse = function(code) {
			if (code) {
				code = code.replace(/^<pre>(.*)<\/pre>$/, '$1');
			}
			try {
				var res = parseJSON(code);
				if (res.error && res.error.error_code == 14) {
					cur.appCaptcha = showCaptchaBox(res.error.captcha_sid, 0, false, {
						onSubmit: function(sid, value) {
							Dev.methodRun(hash, btn, {captcha_sid: sid, captcha_key: value});
							cur.appCaptcha.hide();
						},
						imgSrc: res.error.captcha_img
					});
				}
				Dev.requestResult(res);
			} catch(e) {
				Dev.requestError(code);
			}
			return true;
		}
		ajax.post('dev', params, {
			onDone: onResponse,
			onFail: onResponse,
			showProgress: lockButton.pbind(btn),
			hideProgress: unlockButton.pbind(btn)
		});
	},

	btHide: function(obj) {
		var cont = obj.parentNode;
		hide(cont);
		if (hasClass(obj, 'dev_result_lbracket')) {
			var html = '[...]';
		} else {
			var html = '{...}';
		}
		var expander = se('<span class="dev_result_hidden" onclick="Dev.btShow(this);">'+html+'</span>');
		cont.parentNode.insertBefore(expander, cont);
	},

	btShow: function(obj) {
		var cont = obj.nextSibling;
		re(obj);
		show(cont);
	},


	checkUploadUrl: function(url) {
		if (url && url.match(/^((https?:\/\/)?)(?:[a-z0-9\.]+\.)?(vkontakte\.ru|vk\.com|vk\.me|userapi\.com)\//ig)) {
			return true;
		}

		return false;
	},

	wrapObject: function(obj, rootNode, objName, parentContext) {
		var html = '';
		if (!cur.wrapNum) {
			cur.wrapNum = 0;
		}
		if (obj === null) {
			return '<span class="dev_result_num">null</span>';
		}
		switch (typeof obj) {
			case 'object':
				var items = [];
				if (Object.prototype.toString.call( obj ) == '[object Array]') {
					for (var i in obj) {
						items.push(Dev.wrapObject(obj[i], null, i, obj));
					}
					html += '<span class="dev_result_block"><span class="dev_result_lbracket" onclick="Dev.btHide(this);">[</span>'+items.join(', ')+'<span class="dev_result_lbracket" onclick="Dev.btHide(this);">]</span></span>';
				} else {
					for (var i in obj) {
						items.push('<span class="dev_result_key">"'+clean(i)+'":</span> '+Dev.wrapObject(obj[i], null, i, obj));
					}
					var res = '<div class="dev_result_obj">'+items.join(',<br/>')+'</div>';
					html += '<span class="dev_result_block"><span id="dev_wrap_open_'+cur.wrapNum+'" class="dev_result_bracket" onclick="Dev.btHide(this);">{</span><br/>'+res+'<span id="dev_wrap_close_'+cur.wrapNum+'" class="dev_result_bracket" onclick="Dev.btHide(this);">}</span></span>';
					cur.wrapNum += 1;
				}
				break;
			case 'string':
				var str = clean(obj);
				if (obj.match(/^https?:\/\/.*/)) {
					var onmouseover = '', displayUrl;
					if (obj.match(/^.*\.(jpe?g|png|gif)$/i)) {
						onmouseover = 'onmouseover="return Dev.onMouseOverImageLink(this);" onmouseout="return Dev.onMouseOutImageLink()"';
					}

					if(obj.length > 40) {
						displayUrl = str.substr(0, 17) + '...' + str.substr(-19);
					} else {
						displayUrl = str;
					}

					str = '<a href="' + str + '" target="_blank" ' + onmouseover + '>' + displayUrl + '</a>';
				}
				str = str.replace(/\n/g, '<br />');
				html += '<span class="dev_result_str">"'+str+'"</span>';
				break;
			case 'number':
				var el = '<span class="dev_result_num">'+obj+'</span>', id;

				if (parentContext && objName == 'id') {
					if (parentContext.first_name) {
						id = 'id'+obj;
					} else if (parentContext.screen_name) {
						id = ''+parentContext.screen_name;
					}
					if (id) {
						el = '<a target=_blank href="/' + id + '" mention_id="' + id + '" onmouseover="mentionOver(this)">' + el + '</a>';
					}
				} else if (objName == 'date' || objName == 'created' || objName == 'updated' || objName == 'edited') {
					el = '<span onmouseover="Dev.onMouseOverDate(this)" onmouseout="Dev.onMouseOut()" data-date="' + obj + '">' + el + '</span>';
				}

				html += el;
				break;
			case 'boolean':
				html += '<span class="dev_result_bool">'+obj+'</span>';
			default:
				debugLog('unknown type', typeof obj);
				break;
		}
		if (rootNode && obj.response && obj.response['upload_url'] && Dev.checkUploadUrl(obj.response['upload_url'])) {
			html += '<div class="dev_upload_form"><form id="dev_file_submit" action="'+clean(obj.response['upload_url'])+'" target="dev_upload_iframe" enctype="multipart/form-data" method="post"><input type="file" name="file" onchange="this.parentNode.submit(); show(\'dev_upload_iframe_wrap\')" class="dev_upload_input" /></form></div><div id="dev_upload_iframe_wrap"><iframe id="dev_upload_iframe" name="dev_upload_iframe"></iframe></div>';
		}
		return html;
	},

	showObjTooltip: function(el, content, onShowStart) {
		if (window.tooltips) {
			window.tooltips.hideAll();
		}
		showTooltip(el, {
			content: '<div class="dev_tt_preview">'+content+'</div>',
			slide: 15,
			shift: [0, 0, -4],
			className: 'wall_tt dev_tt',
			hasover: false,
			nohideover: true,
			center: 1,
			showdt: 0,
			onShowStart: onShowStart
		});
	},

	onMouseOut: function() {
		delete window.cur.currTooltipTarget;
	},

	onMouseOverDate: function(dateel) {
		window.cur.prettyTimestamps || (window.cur.prettyTimestamps = {});
		window.cur.currTooltipTarget = dateel;
		var timestamp = dateel.getAttribute('data-date'), pretty;

		function showTT(pretty) {
			if (pretty && window.cur.currTooltipTarget == dateel) {
				Dev.showObjTooltip(dateel, pretty);
			}
			window.cur.prettyTimestamps[timestamp] = pretty;
		}

		if (pretty = window.cur.prettyTimestamps[timestamp]) {
			showTT(pretty);
		} else {
			ajax.post('/dev', { act: 'date_format', date: timestamp }, {onDone: showTT});
		}
	},

	onMouseOutImageLink: function() {
		cur.overedDevLink = null;
		window.tooltips && tooltips.hideAll();
	},

	onMouseOverImageLink: function(linkEl) {
		var img = new Image();
		cur.overedDevLink = linkEl;
		img.onload = function () {
			if(cur.overedDevLink != linkEl) return;
			Dev.showObjTooltip(linkEl, '<img align="center" src="' + linkEl.href + '"/> <div class="resolution"></div>', function(tooltip) {
				var resEl = geByClass1('resolution', tooltip.container);
				var imgEl = geByTag1('img', tooltip.container);
				resEl.innerHTML = img.width + ' x ' + img.height;
			});
		};
		img.src = linkEl.href;
	},

	requestError: function(code) {
		var html = '<pre class="dev_result_error">'+code.replace(/<\/?pre>/g, '')+'</pre>';
		var res = ge('dev_result');
		if (res) {
			res.innerHTML = html;
			addClass(domPN(res), 'has_res');
		}
	},

	requestResult: function(res) {
		if (ge('dev_const_start_from')) {
			var nextBtn = ge('dev_req_next');
			if (res && res.response && res.response['next_from']) {
				cur.nextFrom = res.response['next_from'];
				show(nextBtn);
			} else {
				hide(nextBtn);
			}
		}
		var html = Dev.wrapObject(res, true), res = ge('dev_result');
		if (res) {
			res.innerHTML = html;
			addClass(domPN(res), 'has_res');
		}
	},

	nextPage: function(hash, el) {
		val('dev_const_start_from', cur.nextFrom);
		Dev.methodRun(hash, el);
	},

	resultMove: function(el) {
		var res = ge('dev_result');

		if (!hasClass(el, 'dev_result_lbracket') && !hasClass(el, 'dev_result_bracket')) {
			return false;
		}
		while(el) {
			if (hasClass(el, 'dev_result_block')) {
				addClass(el, 'dev_result_highlight')
				break;
			}
			el = el.parentNode;
			if (el == res) {
				break;
			}
		}
		if (cur.highLighted != el) {
			removeClass(cur.highLighted, 'dev_result_highlight')
			cur.highLighted = el;
		}
	},

	onSearchChange: function(el, ev) {
		if (ev) {
			switch(ev.keyCode) {
				case KEY.DOWN:
					return Dev.selSuggRow(false, 1, ev);
					break;
				case KEY.UP:
					return Dev.selSuggRow(false, -1, ev);
					break;
				case KEY.RETURN:
					return Dev.onSearchSelect();
					break;
				case KEY.ESC:
					val(el, '');
					break;
			}
		}
		setTimeout(function() {
			var v = val(el).toLowerCase().replace(/[^a-zà-ÿ]+/g, '');
			if (v) {
				if (v == cur.prevSearch) {
					return show('dev_search_suggest');;
				}
				var reStr = '';
				for (var i = 0; i < v.length; i++) {
					reStr += v.substr(i, 1)+'.*?';
				}
				var regEx = new RegExp('.*?('+reStr+')', 'i');
				var regExPrior = new RegExp('^('+reStr+')', 'i');
				var found = [];
				for(var i in cur.sections) {
					var list = cur.sections[i].list;
					for (var k in list) {
						var method = list[k][0];
						var m = method.match(regExPrior);
						if (m) {
							found.push([method, method.length]);
						} else {
							var m = method.match(regEx);
							if (m) {
								found.push([method, method.length+2]);
							}
						}
					}
				}
				found = found.sort(function(a, b) {
					if (a[1] < b[1]) {
						return -1;
					} else if (a[1] > b[1]) {
						return 1
					} else {
						return 0;
					}
				});
				var foundList = [];
				for (var i in found) {
					foundList.push(found[i][0])
				}
				Dev.showUsers(foundList, v);
			} else {
				Dev.showUsers();
			}
			cur.prevSearch = v;
		}, 0);
	},

	initSuggestions: function() {
		var cont = ge('dev_search_suggest_list');
		debugLog('init sugg');
		stManager.add(['notifier.css', 'notifier.js'], function() {
			debugLog('go next');
			cur.scroll = new Scrollbar(cont, {
				prefix: 'fc_',
				nomargin: true,
				global: true,
				nokeys: true,
				right: vk.rtl ? 'auto' : 0,
				left: !vk.rtl ? 'auto' : 0
			});
		});
	},

	showSuggestions: function(list, v) {
		if (list && list.length) {
			var cont = ge('dev_search_suggest_list');
			var html = '';
			var reStr = [];
			for (var i = 0; i < v.length; i++) {
				reStr.push(v.substr(i, 1));
			}
			var reg = new RegExp(reStr.join('.*?'), 'i');
			for(var i in list) {
				var name = list[i];
				name = name.replace(reg, function(found) {
					return '<em>'+found+'</em>';
				})
				html += '<a class="dev_search_row" onmousedown="return Dev.onSearchSelect(event);" onmouseover="Dev.selSuggRow(this);">'+name+'</a>';
			}
			cont.innerHTML = html;
			show('dev_search_suggest');
			if (cur.scroll) {
				cur.scroll.scrollTop(0);
				cur.scroll.update(false, true);
			}
		} else {
			hide('dev_search_suggest');
			debugLog('hiden');
		}

	},

	onSearchSelect: function(ev) {
		var cont = ge('dev_search_suggest_list');
		var el = ge('dev_top_input');
		var curSel = geByClass1('dev_sugg_sel', cont);
		var method = false;
		var q = val(el);
		if (curSel) {
			method = val(curSel).replace(/<[^>]*>/g, '');
		} else {
			firstSel = geByClass1('dev_search_row', cont);
			var methodStr = (val(firstSel) || '').replace(/<[^>]*>/g, '');
			if (methodStr && methodStr.replace(/[\. ]/g, '').toLowerCase().indexOf(q.replace(/[\. ]/g, '').toLowerCase()) === 0) {
				if (methodStr.split('.')[0].toLowerCase().indexOf(q.toLowerCase()) === 0) {
					method = methodStr.split('.')[0];
				} else {
					method = methodStr;
				}
			}
		}

		if (method) {
			nav.go('dev/'+method);
			val(el, '');
		} else {
			nav.go('dev?act=search&q='+q);
		}
		Dev.onSearchChange(el, ev);
		return cancelEvent(ev);
	},

	selSuggRow: function(obj, move, ev) {
		if (!isVisible(ge('dev_search_suggest'))) {
			return false;
		}
		var cont = ge('dev_search_suggest_list');
		var curSel = geByClass1('dev_sugg_sel', cont);
		if (!obj) {
			if (move == 1 && curSel) {
				obj = curSel.nextSibling;
			} else if (move == -1 && curSel) {
				obj = curSel.previousSibling;
				if (!obj) {
					var listRows = geByClass('dev_search_row', cont);
					obj = listRows[listRows.length - 1];
				}
			}
			if (!obj) {
				obj = geByClass1('dev_search_row', cont);
			}
		}
		if (curSel != obj) {
			if (curSel) {
				removeClass(curSel, 'dev_sugg_sel');
			}
			addClass(obj, 'dev_sugg_sel');
			if (move) {
				var y = getXY(obj)[1];
				var stY = getXY(cont)[1];
				var pos = y - stY - cont.scrollTop;
				var minHeight = getSize(obj)[1];
				var maxHeight = getSize(cont)[1] - getSize(obj)[1];
				if (pos > maxHeight) {
					cur.scroll.scrollTop(cont.scrollTop + pos - maxHeight);
				} else if (pos < 0) {
					cur.scroll.scrollTop(Math.max(0, cont.scrollTop + pos));
				}
			}

		}
		return cancelEvent(ev);

	},

	onSearchBlur: function() {
		hide('dev_search_suggest');
	},

	checkParamVal: function(obj, ev, type, checks) {
		switch(ev.keyCode) {
			case KEY.UP:
				if (type == 'int' || type == 'positive') {
					val(obj, intval(val(obj)) + 1);
				}
				break;
			case KEY.DOWN:
				if (type == 'int' || type == 'positive') {
					val(obj, intval(val(obj)) - 1);
				}
				break;
		}
		setTimeout(function() {
			var v = val(obj);
			var startVal = v;
			switch(type) {
				case 'int':
					v = (v == '-') ? '-' : intval(v);
					break;
				case 'positive':
					v = positive(v);
					break;
			}
			if (v != startVal) {
				addClass(obj, 'dev_wrong_val');
			} else {
				removeClass(obj, 'dev_wrong_val');
			}

		}, 0)

	},

	toggleMethodListHeader: function(obj) {
		var v = val(obj);
		if (hasClass(obj, 'dev_methods_list_min')) {
			removeClass(obj, 'dev_methods_list_min');
			addClass(obj, 'dev_methods_list_max');
		} else {
			if (!v) {
				addClass(obj, 'dev_methods_list_min');
				removeClass(obj, 'dev_methods_list_max');
			}
		}
	},

	expandResult: function() {
		var result = ge('dev_result'),
			table = ge('dev_req_table'),
			tableWrap = ge('dev_req_table_wrap'),
			curY = scrollGetY();

		if (!result || !hasClass(domPN(result), 'has_res') || hasClass(table, 'wide')) {
			return false;
		}

		addClass(table, 'wide');
		setStyle(tableWrap, {height: getSize(table)[1]});
		scrollToY(curY, 0);

		addEvent(document, 'click', function(e) {
			var el = e.target;
			while (el && el !== domPN(result)) {
				el = domPN(el);
			}
			if (!el) {
				removeClass(table, 'wide');
				setStyle(tableWrap, {height: null});
				removeEvent(document, 'click', arguments.callee);
			}
		});
	},

	showPageSettings: function() {

	},

	reportError: function(address, title) {
		return !showBox('/bugs', {act: 'new_box', doc: address, doc_title: replaceEntities(title)}, {
			stat: ['wide_dd.js', 'wide_dd.css', 'page.css', 'page.js', 'upload.js'],
			cache: 1,
			dark: 1,
			params: {
				width: 500,
				hideButtons: true,
				bodyStyle: 'border: 0px; padding: 0px'
			}
		});
	},

	paletteDown: function(ev, down, y, noChangeColor) {
		var palette = ge('dev_palette');
		var height = getSize(palette)[1];
		if (y === undefined) {
			var y = ev.offsetY || ev.layerY;
		}
		var y = Math.max(0, Math.min(y, height));
		var t =  Math.round(y / (height / 360));
		t = Math.abs(t - 360);
		t = (t == 360)? 0 : t;
		ge('dev_colors').style.backgroundColor = "rgb("+Dev.hsv2rgb(t,100,100)+")";
		if (!noChangeColor) {
			Dev.setColor(Dev.hsv2rgb(t, cur.pickerX, cur.pickerY));
		}
		cur.pickerT = t;
		var pointer = ge('dev_picker1');
		setStyle(pointer, {marginTop: y - 1});
		if (down) {
			var yMain = ev.clientY;
			var onMove = function(evNew) {
				Dev.paletteDown(evNew, false, y + evNew.clientY - yMain);
			}
			addEvent(window, 'mousemove', onMove);

			addEvent(window, 'mouseup', function(evNew) {
				removeEvent(window, 'mousemove', onMove)
			});
		}
		return cancelEvent(ev);
	},

	colorsDown: function(ev, down, x, y, noChangeColor) {
		var pointer = ge('dev_picker2');
		var colors = ge('dev_colors');
		var size = getSize(colors);
		if (x === undefined) {
			var x = ev.offsetX || ev.layerX;
		}
		if (y === undefined) {
			var y = ev.offsetY || ev.layerY;
		}
		y = Math.max(0, Math.min(y, size[1]));
		x = Math.max(0, Math.min(x, size[0]));
		setStyle(pointer, {marginTop: y - 6, marginLeft: x - 7});
		cur.pickerX = x / size[0] * 100;
		cur.pickerY = 100 - y / size[1] * 100;
		if (!noChangeColor) {
			Dev.setColor(Dev.hsv2rgb(cur.pickerT, cur.pickerX, cur.pickerY));
		}
		if (down) {
			var yMain = ev.clientY;
			var xMain = ev.clientX;
			var onMove = function(evNew) {
				Dev.colorsDown(evNew, false, x + evNew.clientX - xMain, y + evNew.clientY - yMain);
			}
			addEvent(window, 'mousemove', onMove);
			addEvent(window, 'mouseup', function(evNew) {
				removeEvent(window, 'mousemove', onMove)
			});
		}
		return cancelEvent(ev);
	},

	hsv2rgb: function (H,S,V){
		debugLog('try', H, S, V);
		var f, p, q , t, lH, R, G, B;

		S /=100;
		V /=100;

		lH = Math.floor(H / 60);

		f = H/60 - lH;
		p = V * (1 - S);
		q = V *(1 - S*f);
		t = V* (1 - (1-f)* S);

		switch (lH) {
			case 0: R = V; G = t; B = p; break;
			case 1: R = q; G = V; B = p; break;
			case 2: R = p; G = V; B = t; break;
			case 3: R = p; G = q; B = V; break;
			case 4: R = t; G = p; B = V; break;
			case 5: R = V; G = p; B = q; break;
		}

		return [parseInt(R*255), parseInt(G*255), parseInt(B*255)];
	},
	rgb2hsv: function(rgb) {
		var rr, gg, bb,
			r = rgb[0] / 255,
			g = rgb[1] / 255,
			b = rgb[2] / 255,
			h, s,
			v = Math.max(r, g, b),
			diff = v - Math.min(r, g, b),
			diffc = function(c){
				return (v - c) / 6 / diff + 1 / 2;
			};

		if (diff == 0) {
			h = s = 0;
		} else {
			s = diff / v;
			rr = diffc(r);
			gg = diffc(g);
			bb = diffc(b);

			if (r === v) {
				h = bb - gg;
			} else if (g === v) {
				h = (1 / 3) + rr - bb;
			} else if (b === v) {
				h = (2 / 3) + gg - rr;
			}
			if (h < 0) {
				h += 1;
			} else if (h > 1) {
				h -= 1;
			}
		}
		return {
			h: Math.round(h * 360),
			s: Math.round(s * 100),
			v: Math.round(v * 100)
		};
	},
	hex2rgb: function(hex) {
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b) {
			return r + r + g + g + b + b;
		});

		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : [0,0,0];
	},

	setColor: function(color) {
		var col = ge('dev_colorbox'+cur.colorNum);
		setStyle(col, {backgroundColor: 'rgb('+color.join(',')+')'});
		var colInp = ge('widget_color'+cur.colorNum);
		var hex = [color[0].toString(16), color[1].toString(16), color[2].toString(16)];
		for(var i in hex) if (hex[i].length == 1) hex[i] = '0' + hex[i];
		val(colInp, hex.join('').toUpperCase());
		cur.soonUpdatePreview();
	},

	showColorBox: function(obj, num, ev) {
		if (browser.msie && browser.version < 9) {
			return false;
		}
		cur.colorNum = num;
		var wrap = ge('dev_widget_colors');
		var cont = ge('dev_colorpicker');
		var colors = ge('dev_colors');
		var palette = ge('dev_palette');
		var shownHere = false;
		if (!cur.colorShown) {
			fadeIn(cont, 200);
			var shownHere = true;
			cur.colorShown = true;
		}
		var posY = (getXY(obj)[1] - getXY(wrap)[1]);
		if (cur.colorInited) {
			animate(cont, {marginTop: -179 + posY}, 200)
		} else {
			setStyle(cont, {marginTop: -179 + posY})
			var palSize = getSize(palette);
			var pal = palette.getContext('2d');
			var gradient = pal.createLinearGradient(palSize[0]/2,palSize[1],palSize[0]/2,0);
			var hue = [[255,0,0],[255,255,0],[0,255,0],[0,255,255],[0,0,255],[255,0,255],[255,0,0]];
			for (var i=0; i <= 6; i++){
				color = 'rgb('+hue[i][0]+','+hue[i][1]+','+hue[i][2]+')';
				gradient.addColorStop(i*1/6, color);
			};
			pal.fillStyle = gradient;
			pal.fillRect(0, 0, palSize[0], palSize[1]);
			addEvent(document, 'mouseup', function() {
				cur.paletteDown = false;
			})
		}
		var colInp = ge('widget_color'+cur.colorNum);
		var color = val(colInp);
		var rgb = Dev.hex2rgb(color);
		var hsv = Dev.rgb2hsv(rgb);

		Dev.paletteDown(false, false, (360 - hsv.h) / 360 * getSize(palette)[1], true);
		var colorsSize = getSize(colors);
		Dev.colorsDown(false, false, (hsv.s) / 100 * colorsSize[0], (100 - hsv.v) / 100 * colorsSize[1], true);

		var onWndMove = function(ev) {
			var el = ev.target;
			while(el) {
				if (el.id == 'dev_colorpicker' || hasClass(el, 'dev_colorbox_cont')) {
					if (cur.colorBoxHideTimeout) {
						debugLog('cancel Hide');
						clearTimeout(cur.colorBoxHideTimeout);
						cur.colorBoxHideTimeout = false;
					}
					return false;
				}
				el = el.parentNode;
			}
			if (cur.colorBoxHideTimeout) {
				return false;
			}
			cur.colorBoxHideTimeout = setTimeout(function() {
				fadeOut(cont, 200);
				cur.colorShown = false;
				removeEvent(window, 'mousemove', onWndMove);
			}, 500);

		};
		if (shownHere) {
			addEvent(window, 'mousemove', onWndMove);
		}

		cur.colorInited = true;
		return cancelEvent(ev);
	},

	addVersion: function(hash) {
		var params = {
			act: 'a_save_version',
			ver: val('dev_edit_number'),
			methods: val('dev_edit_methods'),
			text: val('dev_edit_ver_text'),
			text_en: val('dev_edit_ver_text_en'),
			text_private: val('dev_edit_ver_text_private'),
			is_hidden: isChecked('dev_checkbox_is_hidden'),
			hash: hash
		}

		ajax.post('dev.php', params, {
			onDone: function() {
				nav.go('/dev/versions')
			},
			onFail: function(obj) {
				obj = ge(obj);
				if (obj) {
					notaBene(obj);
					return true;
				}
			}
		});

	},

	deleteVersion: function(hash) {
		var params = {
			act: 'a_delete_version',
			ver: val('dev_edit_number'),
			hash: hash
		}

		ajax.post('dev.php', params, {
			onDone: function() {
				nav.go('/dev/versions')
			},
			onFail: function(obj) {
				obj = ge(obj);
				if (obj) {
					notaBene(obj);
					return true;
				}
			}
		});

	},

	checkWallURL: function(message) {
		var rx = /([!()?., \n\r\t \u00A0]|^)((https?:\/\/)?((?:[a-z0-9_\-]+\.)+[a-z]{2,6})(\/.*?)?(\#.*?)?)(&nbsp;|[ \t\r\n \u00A0]|$)/i, matches;
		if (message && (matches = message.match(rx))) {
			message = message.substr(matches.index + matches[0].length);
			var url = matches[2],
				query = matches[5] || '';
			if (!url.match(/^https?:\/\//)) {
				url = 'http://' + url;
			}
			var post_raw = false;
			if (matches[4].match(/(^|\.|\/\/)(vkontakte\.ru|vk\.com)/)) {
				post_raw = query.match(/wall(-?\d+)_(\d+)(\?reply=(\d+))?$/);
			}
			if (post_raw && post_raw[4]) {
				post_raw = post_raw[1] + '_' + post_raw[4];
			} else if (post_raw && post_raw[2]) {
				post_raw = post_raw[1] + '_' + post_raw[2];
			} else {
				post_raw = false;
			}
			return post_raw;
		}
	},

	mainPageSliderTime: 8000,
	mainPageSliderInit: function (items) {
		if (!geByClass1('dev_main_featured_banners')) {
			return;
		}
		cur.devMainSliderItems = items;
		cur.devMainSliderPos = null;
		cur.devMainSliderEl = geByClass1('dev_main_featured_banner');

		var backgrounds = '', buttons = '';
		for(var i in items) {
			backgrounds += '<div class="dev_main_featured_banners_bg_item dev_main_featured_banners_bg_' + items[i].className + '" id="dev_main_featured_banners_bg_' + i + '"></div>';
			buttons += '<div class="dev_main_featured_banners_change_button" id="dev_main_featured_banners_button_' + i + '" onclick="Dev.mainPageSliderChange(' + i + ', \'auto\')">' + items[i].title + '</div>';
		}
		val(geByClass1('dev_main_featured_banners_bg'), backgrounds);
		val(geByClass1('dev_main_featured_banners_buttons'), buttons);

		Dev.mainPageSliderStartRotation();
		Dev.mainPageSliderChange(0, '', 1);

		cur.destroy.push(function () {
			Dev.mainPageSliderStopRotation();
		});
	},

	mainPageSliderChange: function (pos, nav, fast) {
		if (cur.mainSliderBlocked || pos == cur.devMainSliderPos) {
			return;
		}
		cur.mainSliderBlocked = 1;

		if (nav == 'auto') {
			nav = pos > cur.devMainSliderPos ? 'next' : 'prev';
		}

		var curEl = cur.devMainSliderEl;

		var newItem = cur.devMainSliderItems[pos];

		var item_opts = isObject(newItem) ? newItem : {className: newItem};

		var newEl = ce('div', {
			className: 'dev_main_featured_banner',
		});
		if (item_opts.title && item_opts.caption) {
			val(newEl, '<div class="dev_main_featured_banner_slide_cont_wrap"><div class="dev_main_featured_banner_slide_cont">' +
				'<a class="dev_main_featured_banner_slide_title" href="' + item_opts.link + '">' + item_opts.title + '</a>' +
				'<div class="dev_main_featured_banner_slide_caption">' + item_opts.caption + '</div>' +
				'</div></div>');
		}

		var wrap = geByClass1('dev_main_featured_banners_anim_helper');
		if (nav == 'next') {
			wrap.appendChild(newEl);
		} else {
			wrap.insertBefore(newEl, curEl);
			addClass(wrap, 'dev_main_featured_banners_prev');
		}

		Dev.mainPageSliderStopRotation();

		removeClass('dev_main_featured_banners_bg_' + cur.devMainSliderPos, 'dev_main_featured_banners_bg_active');
		addClass('dev_main_featured_banners_bg_' + pos, 'dev_main_featured_banners_bg_active');

		removeClass('dev_main_featured_banners_button_' + cur.devMainSliderPos, 'active_slide');
		addClass('dev_main_featured_banners_button_' + pos, 'active_slide');

		setTimeout(function () {
			addClass(wrap, 'dev_main_featured_banners_anim dev_main_featured_banners_anim_' + nav);
			removeClass(curEl, 'dev_main_featured_banner_active');

			//setTimeout(function () {
			addClass(newEl, 'dev_main_featured_banner_active');

			setTimeout(function () {
				removeClass(wrap, 'dev_main_featured_banners_anim dev_main_featured_banners_anim_' + nav);
				removeClass(wrap, 'dev_main_featured_banners_prev');

				re(curEl);
				cur.devMainSliderEl = newEl;
				cur.devMainSliderPos = pos;

				cur.mainSliderBlocked = 0;

				Dev.mainPageSliderStartRotation();

				if (fast) {
					addClass(geByClass1('dev_main_featured_banners'), 'dev_main_featured_banners_inited');
				}
			}, fast ? 0 : 520);
			//}, fast ? 0 : 80); // 280
		});

	},

	mainPageSliderStartRotation: function () {
		if (cur.mainSliderBlocked) {
			return;
		}
		Dev.mainPageSliderStopRotation();
		cur.devMainPageSliderTimer = setTimeout(Dev.mainPageSliderNext, Dev.mainPageSliderTime);
	},

	mainPageSliderStopRotation: function () {
		clearTimeout(cur.devMainPageSliderTimer);
	},


	mainPageSliderNext: function() {
		var newPos = cur.devMainSliderPos + 1;

		if (newPos > cur.devMainSliderItems.length - 1) {
			newPos = 0;
		}

		Dev.mainPageSliderChange(newPos, 'next');
	},

	mainPageSliderPrev: function() {
		var newPos = cur.devMainSliderPos - 1;

		if (newPos < 0) {
			newPos = cur.devMainSliderItems.length - 1;
		}

		Dev.mainPageSliderChange(newPos, 'prev');
	},

	focusSectionsSearch: function () {
		if (!cur.seactionSearchScroll) {
			cur.seactionSearchScroll = new uiScroll(geByClass1('dev_section_search_result_wrap'));
		}
		Dev.updateSectionsResult('');
		cur.seactionSearchScroll.scrollTop(0);
		setTimeout(function () {
			cur.seactionSearchScroll.update();
		}, 50);
	},

	updateSectionsResult: function () {
		var el = ge('dev_section_search_query');
		var query = clean(trim(val(el)));

		if (query.toLowerCase() == String(attr(el, 'data-section')).toLowerCase()) {
			query = '';
		}

		if (query) {
			var reStr = '';
			for (var i = 0; i < query.length; i++) {
				reStr += query.substr(i, 1)+'.*?';
			}
			var regEx = new RegExp('.*?('+reStr+')', 'i');
			var regExPrior = new RegExp('^('+reStr+')', 'i');
		}

		var found = [], found2 = [];
		for(var i in cur.sections) {
			var name = cur.sections[i].name;

			if (!query) {
				found.push(i);
				continue;
			}
			if (name.match(regExPrior) || i != name && i.match(regExPrior)) {
				found.push(i);
			} else if (name.match(regEx) || i != name && i.match(regEx)) {
				found2.push([i, name.length])
			}
		}
		found2 = found2.sort(function (a, b) {
			if (a[1] < b[1]) {
				return -1;
			} else if (a[1] > b[1]) {
				return 1
			} else {
				return 0;
			}
		});

		for(var i in found2) {
			found.push(found2[i][0]);
		}

		var result = '';
		var reg = query ? new RegExp(reStr, 'i') : '';
		for(var i in found) {
			var name = cur.sections[found[i]].name;
			if (query) {
				name = name.replace(reg, function(m) {
					return '<span>' + m + '</span>';
				});
			}
			result += '<div class="dev_section_search_result_item" data-href="/dev/' + found[i] + '" onmousedown="nav.go(attr(this, \'data-href\'))" onmouseover="Dev.overSectionsSearchItem(this)">' + name + '</div>';
		}

		var resEl = ge('dev_section_search_result');
		val(resEl, result);

		if (!result) {
			addClass(geByClass1('dev_section_search_result_wrap'), 'dev_section_no_result');
		} else {
			removeClass(geByClass1('dev_section_search_result_wrap'), 'dev_section_no_result');
			addClass(resEl.firstChild, 'over');
		}
	},

	keyUpSectionsSearch: function (e) {
		if ([KEY.DOWN, KEY.UP, KEY.ENTER].indexOf(e.keyCode) != -1) {
			return;
		}
		Dev.updateSectionsResult();
		cur.seactionSearchScroll && cur.seactionSearchScroll.scrollTop(0);
	},

	blurSectionsSearch: function (el) {
		val(el, attr(el, 'data-section'));
	},

	keyDownSectionsSearch: function (e) {
		e = e || window.event;

		if (e.keyCode == KEY.ESC) {
			var el = ge('dev_section_search_query');
			val(el, attr(el, 'data-section'));
		}

		if ([KEY.DOWN, KEY.UP, KEY.ENTER].indexOf(e.keyCode) != -1) {
			var resEl = ge('dev_section_search_result');
			var item = geByClass1('over', resEl);
			if (!item) {
				item = resEl.firstChild;
			}
			if (!item) {
				return;
			}
			var newItem;
			switch (e.keyCode) {
				case KEY.DOWN:
					newItem = item.nextSibling;
					if (!newItem) {
						newItem = resEl.firstChild;
					}
					break;
				case KEY.UP:
					newItem = item.previousSibling;
					if (!newItem) {
						newItem = resEl.lastChild;
					}
					break;
				case KEY.ENTER:
					nav.go(attr(item, 'data-href'));
					break;
			}
			if (newItem) {
				removeClass(item, 'over');
				addClass(newItem, 'over');
				cur.seactionSearchScroll && cur.seactionSearchScroll.scrollIntoView(newItem);
			}
			return cancelEvent(e);
		}
	},

	overSectionsSearchItem: function (el) {
		removeClass(geByClass1('over', 'dev_section_search_result'), 'over');
		addClass(el, 'over');
	},

	clickSpoiler: function(el, block_id, hash) {
		var parent = el.parentNode, cont = geByClass1('dev_method_block_content', parent), act = 'hide'
		$.elements.toggleClass(parent, 'dev_block_spoiler_minimized');
	},

	selectNode(el, e) {
		cancelEvent(e)

		const range = document.createRange()
		range.selectNodeContents(el)

		const selection = getSelection()
		selection.removeAllRanges()
		selection.addRange(range)

		document.execCommand('copy')
	},


	_eof:1};

function geByClass1(searchClass, node, tag) {
	node = g(node) || document;
	tag = tag || '*';
	return node.querySelector && node.querySelector(tag + '.' + searchClass) || geByClass(searchClass, node, tag)[0];
}

function geByClass(searchClass, node, tag) {
	node = ge(node) || document;
	tag = tag || '*';
	var classElements = [];

	if (node.querySelectorAll && tag !== '*') {
		return node.querySelectorAll(tag + '.' + searchClass);
	}
	if (node.getElementsByClassName) {
		var nodes = node.getElementsByClassName(searchClass);
		if (tag !== '*') {
			tag = tag.toUpperCase();
			for (var i = 0, l = nodes.length; i < l; ++i) {
				if (nodes[i].tagName.toUpperCase() === tag) {
					classElements.push(nodes[i]);
				}
			}
		} else {
			classElements = Array.prototype.slice.call(nodes);
		}
		return classElements;
	}

	var els = geByTag(tag, node);
	var pattern = new RegExp('(^|\\s)' + searchClass + '(\\s|$)');
	for (var i = 0, l = els.length; i < l; ++i) {
		if (pattern.test(els[i].className)) {
			classElements.push(els[i]);
		}
	}
	return classElements;
}

function geByTag(searchTag, node) {
	node = g(node) || document;
	return node.getElementsByTagName(searchTag);
}

function hasClass(obj, name) {
	obj = g(obj);
	return obj && obj.nodeType === 1 && obj.classList.contains(name);
}

function addClass(obj, name) {
	if ((obj = g(obj)) && !hasClass(obj, name)) {
		obj.classList.add(name);
	}
}

function removeClass(obj, name) {
	if (obj = g(obj)) {
		obj.classList.remove(name);
	}
}


for (var key in Deva) {
	if (Deva.hasOwnProperty(key)) {
		Dev[key] = Deva[key];
	}
}