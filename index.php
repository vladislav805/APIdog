<?

	include_once "zero.framework.php";

	// если не подключена новая версия, то перекидываем назад
	if (getAuthKey() && !isNewVersionEnabled()) {
		header("Location: /6.4/");
		exit;
	};

	// если нет authKey, или есть, но нет accessToken
	if (!getAuthKey() || getAuthKey() && !getAccessToken()) {
		gotoLogout();
	};

	// информация о сессии по authKey
	$user = getSessionByAuthKey(getAuthKey());

	// если нет информации, то сессия невалидна/просрочена
	if (!$user) {
		gotoLogout();
	};

	// собираем информацию для js-модуля
	$JavaScriptUserObject = prepareJavaScriptUserObject($user);

	// и языковые данные для сайта
	$speech = getLang($user->getSettings()->languageId);

	// настройка "фиксированная шапка"
	$isFixedHead = $user->getSettings()->bitmask & 128;

	closeDatabase();

?><!DOCTYPE html>
<html lang="ru-RU" class="_notloaded">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=yes" />
		<meta name="theme-color" content="#5F7FBA" />
		<meta http-equiv="Cache-Control" content="no-cache" />
		<meta http-equiv="cleartype" content="on" />
		<meta http-equiv="msthemecompatible" content="no" />
		<meta http-equiv="imagetoolbar" content="no" />
		<meta name="format-detection" content="telephone=no" />
		<meta name="format-detection" content="address=no" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="application-name" content="APIdog" />
		<meta name="msapplication-tooltip" content="Неофициальный клиент ВКонтакте offline" />

		<link rel="stylesheet" href="default.css" />
		<link rel="yandex-tableau-widget" href="manifest.json?7" />
		<link rel="icon" href="favicon.png?1" />
		<link rel="shortcut icon" href="favicon.png?1" />
		<script>
			var API = <?=json_encode($JavaScriptUserObject, JSON_UNESCAPED_UNICODE);?>;
			window.adblockEnabled = !1;
			/*< ?=($user["theme"] ? "var apdgtoi=function(w,d){" . $user["theme"]->openJS() . "};" : "");? >*/
		</script>
		<script type="text/javascript" src="/advert.js"></script>
		<style type="text/css">
			html._notloaded{overflow:hidden;}._notloaded .loadScreen-wrap{font-family:Tahoma;display:block !important;background:#4E729A;color:#FFFFFF;position:fixed;z-index:9999999;top:0;left:0;right:0;bottom:0;width:100%;height:100%;}.loadScreen-logo{/*background:url(//static.apidog.ru/v6.2/logo_login_2x.png) no-repeat center center/300px;*/overflow:hidden;width:300px;height:110px;margin:0 auto;}.loadScreen-animation{background-image:url("data:image/svg+xml,%3Csvg height=%2226%22 width=%2226%22 class=%22progress-arc%22 viewport=%220 0 100 100%22 version=%221.1%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3ClinearGradient id=%22int%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%220%25%22%3E%3Cstop offset=%220%25%22 stop-opacity=%221%22 stop-color=%22%23FFFFFF%22%3E%3C/stop%3E%3Cstop offset=%2260%25%22 stop-opacity=%221%22 stop-color=%22%23FFFFFF%22%3E%3C/stop%3E%3Cstop offset=%22100%25%22 stop-opacity=%220%22 stop-color=%22%23FFFFFF%22%3E%3C/stop%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle style=%22stroke: url%28'%23int'%29 none;%22 r=%2211.5%22 cy=%2213%22 cx=%2213%22 stroke=%22%23FFFFFF%22 stroke-width=%223%22 stroke-dasharray=%2231.7929, 40.4637%22 stroke-dashoffset=%220%22 transform-origin=%22center center%22 fill=%22transparent%22%3E%3C/circle%3E%3C/svg%3E");width:40px;height:40px;background-size:100%;margin:0 auto;-webkit-animation:loaderRound .8s linear infinite;-ms-animation:loaderRound .8s linear infinite;animation:loaderRound .8s linear infinite;}@-webkit-keyframes loaderRound{0%{transform:rotate(0);-webkit-transform:rotate(0)}100%{transform:rotate(360deg);-webkit-transform:rotate(360deg);}}@-ms-keyframes loaderRound{0%{transform:rotate(0);-ms-transform:rotate(0)}100%{transform:rotate(360deg);-ms-transform:rotate(360deg)}}@keyframes loaderRound{0%{transform:rotate(0);}100%{transform:rotate(360deg)}}.loadScreen-content{position:absolute;top:50%;left:50%;margin:-105px 0 0 -150px;}.loadScreen-label{margin-top:-25px;text-align:right;margin-right:50px;margin-bottom:15px;line-height:20px;font-size:18px;}.loadScreen-title{text-align:center;line-height:50px;font-size:21px}.loadScreen-footer{text-align:center;position:absolute;bottom:10px;font-size:xx-small;color:rgba(255,255,255,.5);width:80%;left:10%;right:10%;}
		</style>
	</head>
	<body id="main" class="animation isTouch">

		<div class="hidden loadScreen-wrap">
			<div class="loadScreen-content">
				<div class="loadScreen-logo"><svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMidYMid' width='300' height='120' viewBox='0 0 1029 259'><style>.a{fill:#FFF;}</style><path d='M950 259C931 259 900 259 900 259L900 229C900 229 933 229 950 229 980 229 991 217 991 194 979 199 967 202 954 202 910 202 887 177 887 129 887 79 913 57 965 57 983 57 1004 56 1029 60L1029 193C1029 237 1002 259 950 259ZM991 88C985 86 976 85 964 85 938 85 925 99 925 128 925 156 936 170 959 170 970 170 980 168 991 162L991 88ZM490 126C490 78 514 54 562 54 572 54 582 57 593 61L593 0 630 0 630 195C608 201 585 204 563 204 515 204 490 178 490 126ZM593 168L593 94C585 88 575 86 563 86 540 86 528 99 528 125 528 157 540 172 565 172 574 172 584 171 593 168ZM420 0L458 0 458 204 420 204 420 0ZM310 133L304 100C339 93 356 80 356 59 356 42 347 33 330 33L279 33 279 204 241 204 241 0 333 0C374 0 395 19 395 58 395 99 367 124 310 133ZM152 149L84 149 97 116 138 116 106 39 39 204 0 204 87 0 128 0 216 204 175 204 152 149Z' class='a'/><path d='M863 174C863 145 863 102 863 73 863 43 863 43 838 43 798 43 721 43 681 43 657 43 657 43 657 73 657 93 657 145 657 175 657 205 657 205 681 205 721 205 798 205 838 205 863 205 863 205 863 174ZM759 116L707 73 809 73 759 116ZM681 175L681 81C681 81 719 113 742 133 759 148 759 148 778 133 801 113 838 81 838 81L838 175 681 175Z' class='a'/></svg></div>
				<div class="loadScreen-label">v6.5 alpha</div>
				<div class="loadScreen-animation"></div>
				<div class="loadScreen-title">Loading...</div>
			</div>
			<div class="loadScreen-footer">
				<p>APIdog v6.5 &copy; 2012&ndash;2016</p>
				<p><?=$speech["loadingAuthors"];?></p>
			</div>
		</div>




		<div class="dog-wrapper" id="wrap">
			<div class="head<?=($isFixedHead ? " head-fixed" : "");?>" id="dog-head">
				<div class="head-wrap">
					<div class="head-menuIcon" onclick="menu.toggle();"><div class="head-menuIconInner"></div></div>
					<div class="head-right">
						<a class="head-user" href="#" id="_link">
							<img class="head-user-photo" src="data:image/svg+xml,%3Csvg fill='%23FFFFFF' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E" id="_photo" />
							<div class="head-user-name" id="_name">Loading...</div>
						</a>
						<div class="head-music"></div>
					</div>
					<div class="head-content" id="head-content">
						<div class="head-title" id="head-title">
							APIdog
						</div>
					</div>
				</div>
			</div>


<!--
					<div class="head-player-button">
							<div class="head-player-button-l cp" onclick="Audios.Previous();"></div>
							<div class="head-player-button-p1 cp" id="headplayer-play" onclick="Audios.Player.Play();"></div>
							<div class="head-player-button-p2 cp hidden" id="headplayer-pause" onclick="Audios.Player.Pause();"></div>
							<div class="head-player-button-r cp" onclick="Audios.Next();"></div>
						</div>
						<div class="act-audio">
							<div class="act-audio-icons">
								<div title="Добавить в свои аудиозаписи" class="add-audio hidden cp" id="add-audio" onclick="Audios.Player.Add(this);"></div>
								<div title="Включить/выключить трансляцию на страницу" class="live-audio cp" id="live-audio" onclick="Audios.Player.TriggerBroadcast(this);"></div>
								<div title="Узнать название трека" class="find-audio hidden cp" id="find-audio" onclick="Audios.getRadioCurrentBroadcastingSong(Audios.getRadioCurrent());"></div>
								<div title="Повторять эту композицию" class="repeat-audio cp" id="repeat-audio" onclick="Audios.Player.TriggerRepeat(this);"></div>
								<div class="share-audio cp" id="share-audio" onclick="Audios.Player.Share(this);"></div>
							</div>
							<div id="head-player-volume">
								<input type="text" id="head-player-volume-input" value="100" />
								<div id="head-player-volume-ghost"></div>
							</div>
						</div>
						<div class="head-player-main" onclick="return Audios.MiniPlayer.Hide(event);">
							<div class="head-player-wraptitle cp">
								<div class="head-player-time" id="player-playedtime" onclick="Audios.MiniPlayer.ChangeFormatTime(event);">0:00</div>
								<div class="head-player-title" id="headplayer-titleNormal"><div class="headplayer-titleReal"></div></div>
							</div>
							<div class="head-player-line" onclick="$.event.cancel(event);" id="head-player-line-wrap">
								<div class="head-player-lineplayback" id="head-player-line">
									<div class="head-player-lineplayback-played" id="head-player-line-played">
										<div class="act-audio-ball"></div>
									</div>
									<div class="head-player-lineplayback-loaded" id="head-player-line-loaded"></div>
								</div>
							</div>
						</div>
-->










			<div class="dog-page<?=($isFixedHead ? " dog-page-fixed": "");?>" id="wrap-content">
				<div class="dog-menu" id="dog-menu">
					<aside>
						<a href="#mail" id="menu-messages"><?=$speech["menuMessages"];?></a>
						<a href="#feed"><?=$speech["menuFeed"];?></a>
						<a href="#feed?act=notifications" id="menu-notifications"><?=$speech["menuNotifications"];?></a>
						<a href="#friends" id="menu-friends"><?=$speech["menuFriends"];?></a>
						<a href="#photos" id="menu-photos"><?=$speech["menuPhotos"];?></a>
						<a href="#groups" id="menu-groups"><?=$speech["menuGroups"];?></a>
						<a href="#audio"><?=$speech["menuAudios"];?></a>
						<a href="#videos" id="menu-videos"><?=$speech["menuVideos"];?></a>
						<a href="#docs"><?=$speech["menuDocs"];?></a>
						<a href="#fave"><?=$speech["menuFaves"];?></a>
						<a href="#search"><?=$speech["menuSearch"];?></a>
					</aside>
					<br />
					<aside>
						<a href="#settings"><?=$speech["menuSettings"];?></a>
						<!--a href="#support">FAQ</a-->
						<a href="donate.php"><?=$speech["menuDonate"];?></a>
						<a href="blog.php"><?=$speech["menuBlog"];?></a>
						<a href="extensions.php" id="_link_ext">APIdog LongPoll</a>
						<a href="auth.php?act=logout"><?=$speech["menuLogout"];?></a>
					</aside>
					<div id="birthdays"></div>
					<div class="footer">
						<div class="tip"><?=$speech["footer"];?></div>
					</div>
				</div>
				<div id="_menu_up" onclick="menu.toTop(null, true);" class="hidden menu-totop">
					<aside><?=$speech["pageGoToUp"];?></aside>
				</div>
				<section class="dog-content" id="dog-content">
					<section class="content" id="content">
						<div class="loader-wrap" style="padding: 90px 0;">
							<div class="loader-svg"></div>
						</div>
					</section>
				</section>
			</div>
		</div>
		<script src="lib1.3.0.js"></script>
		<script src="//apidog.ru/hammer.js"></script>
		<script src="/minify.php?file=jsDebug"></script>
		<audio id="Player" class="hidden"></audio>
		<noscript>
			<img src="//mc.yandex.ru/watch/19029880" style="position:absolute; left:-9999px;" alt="" />
		</noscript>
		<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', 'UA-73434682-1', 'auto');</script>
	</body>
</html><!-- APIdog Corp. --><!-- Have fun since 8 august 2012 until now! -->



<!--div class="menu-notify-wrap"><strong class="menu-notify">Информация</strong><div style="padding: 5px"><b>Три</b> официальные группы APIdog были заблокированы.<br><a href="#wall23048942_3628">Подробнее (1) &raquo;</a><br><a href="#wall-104924272_2">Подробнее (2) &raquo;</a><br><a href="#wall23048942_3894">FAQ &raquo;</a></div></div-->
<!--
<div class="avmn-wrap">
	<div class="avmn"><?=$speech["ads_title"];?></div>

	<div id="MarketGidScriptRootC592365">
		<div id="MarketGidPreloadC592365">
			<a id="mg_add592365" href="http://usr.marketgid.com/demo/celevie-posetiteli/" target="_blank">
				<img src="//cdn.marketgid.com/images/marketgid_add_link.png" style="border:0px">
			</a>
			<a href="http://marketgid.com/" target="_blank">Загрузка...</a>
		</div>
		<script>(function(){var D=new Date(),d=document,b='body',ce='createElement',ac='appendChild',st='style',ds='display',n='none',gi='getElementById'; var i=d[ce]('iframe');i[st][ds]=n;d[gi]("MarketGidScriptRootC592365")[ac](i);try{var iw=i.contentWindow.document;iw.open();iw.writeln("<ht"+"ml><bo"+"dy></bo"+"dy></ht"+"ml>");iw.close();var c=iw[b];} catch(e){var iw=d;var c=d[gi]("MarketGidScriptRootC592365");}var dv=iw[ce]('div');dv.id="MG_ID";dv[st][ds]=n;dv.innerHTML=592365;c[ac](dv); var s=iw[ce]('script');s.async='async';s.defer='defer';s.charset='utf-8';s.src="//jsc.marketgid.com/a/p/apidog.ru.592365.js?t="+D.getYear()+D.getMonth()+D.getDate()+D.getHours();c[ac](s);})();</script>
	</div>
	<div class="apidog-a" id="_apidv"></div>
</div>
-->