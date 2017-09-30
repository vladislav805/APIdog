<?

	use Method\Settings\Setting;
	use Method\UI\l10n;

	$db = new Connection(dbh, dbu, dbp, dbd);
	$cn = new Controller($db);


	$cn->init($_COOKIE[KEY_ACCESS_TOKEN], $_COOKIE[KEY_AUTH_KEY], $_COOKIE[KEY_SALT]);

	if (isset($_REQUEST["page"])) {
		$path = "./page/" . basename($_REQUEST["page"]) . ".php";

		if (file_exists($path)) {
			/** @noinspection PhpIncludeInspection */
			require_once $path;
		} else {
			header("HTTP/1.1 404 Not found");
		}

		exit;
	}


	if (!$cn->getSession()->isAuthorized()) {
		header("Location: ./?page=logout");
		exit;
	}


	if (isset($_SESSION["invite"])) {
		if (hash_hmac("sha256", "q" . $cn->getSession()->getUserId() . "d", "apidog") !== $_SESSION["invite"]) {
			print "Invite key was given to another account.";
			exit;
		}


		$items = invite_open();
		unset($items[$_SESSION["invite"]]);
		invite_save($items);
		unset($_SESSION["invite"]);
	}


	/** @var \Model\Settings $settings */
	$settings = $cn->perform(new \Method\Settings\Get(null));
	$session = $cn->getSession();

	/** @var l10n $l10n */
	$l10n = $cn->perform(new l10n(["userId" => $settings->getLanguage()]));


	$jsObject = array_merge($settings->jsonSerialize(), $session->jsonSerialize());

	$jsObject["theme"] = null;

	$jsObject["languageBuild"] = filemtime(sprintf("./lang/%d.json", $settings->getLanguage()));

	if ($settings->getThemeId()) {
		try {
			$jsObject["theme"] = $cn->perform(new \Method\Theme\GetById(["themeId" => $settings->getThemeId()]));
		} catch (APIdogException $e) {
			var_dump("something wrong", $e);
		}
	}

	/** @var stdClass $ads */
	$ads = $cn->perform(new \Method\Ad\GetWeb(["count" => 2]));

	$jsObject["ad"] = [
		"menu" => $ads->menu,
		"feed" => $ads->feed
	];

	ob_start(function($buffer) {
		$search =  ['/\s{2,}/s', '/\n/s'];
		$replace = "";
		return preg_replace($search, $replace, $buffer);
	});
?>
<!DOCTYPE html>
<!--suppress ALL -->
<html lang="ru-RU" class="_notloaded "> <!-- manual-mode -->
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=yes" />
		<meta name="theme-color" content="#5F7FBA" />
		<meta http-equiv="cleartype" content="on" />
		<meta http-equiv="msthemecompatible" content="no" />
		<meta http-equiv="imagetoolbar" content="no" />
		<meta name="format-detection" content="telephone=no" />
		<meta name="format-detection" content="address=no" />
		<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="application-name" content="APIdog" />
		<meta name="msapplication-tooltip" content="Неофициальный клиент ВКонтакте offline" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-1536x2008.png" media="(device-width:768px) and (device-height:1024px) and (orientation:portrait) and (-webkit-device-pixel-ratio:2)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-1496x2048.png" media="(device-width:768px) and (device-height:1024px) and (orientation:landscape) and (-webkit-device-pixel-ratio:2)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-768x1004.png" media="(device-width:768px) and (device-height:1024px) and (orientation:portrait) and (-webkit-device-pixel-ratio:1)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-748x1024.png" media="(device-width:768px) and (device-height:1024px) and (orientation:landscape) and (-webkit-device-pixel-ratio:1)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-640x1096.png" media="(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-640x920.png" media="(device-width:320px) and (device-height:480px) and (-webkit-device-pixel-ratio:2)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-320x460.png" media="(device-width:320px) and (device-height:480px) and (-webkit-device-pixel-ratio:1)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-750x1294.png" media="(device-width:375px) and (device-height:667px) and (orientation:portrait) and (-webkit-device-pixel-ratio:2)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-1242x2148.png" media="(device-width:414px) and (device-height:736px) and (orientation:portrait) and (-webkit-device-pixel-ratio:3)" />
		<link rel="apple-touch-startup-image" href="//static.apidog.ru/ios/startup-1182x2208.png" media="(device-width:414px) and (device-height:736px) and (orientation:landscape) and (-webkit-device-pixel-ratio:3)" />
		<link rel="apple-touch-icon" href="//static.apidog.ru/ios/114x114.png" />
		<link rel="apple-touch-icon" sizes="72x72" href="//static.apidog.ru/ios/72x72.png"/>
		<link rel="apple-touch-icon" sizes="114x114" href="//static.apidog.ru/ios/114x114.png"/>
		<link rel="apple-touch-icon" sizes="144x144" href="//static.apidog.ru/ios/144x144.png"/>
		<title>APIdog</title>
		<link rel="stylesheet" href="css/default.css?v=<?=APIDOG_VERSION;?>" media="screen" />
		<link rel="stylesheet" href="css/attachments.css?v=<?=APIDOG_VERSION;?>" media="screen" />
		<link rel="yandex-tableau-widget" href="manifest.json?7" />
		<link rel="icon" href="./favicon.png?14" />
		<link rel="shortcut icon" href="./favicon.png?4" />
		<script>
			(function(a,b,c){a[b]=c})(window,"API",<?=json_encode($jsObject,JSON_UNESCAPED_UNICODE)?>);
		</script>
		<style type="text/css">
			html._notloaded{overflow:hidden}._notloaded .loadScreen-wrap{display:block!important;background:#4E729A;color:#FFF;position:fixed;z-index:9999;top:0;left:0;right:0;bottom:0;width:100%;height:100%}._notloaded .head-wrapper{display:none}.loadScreen-logo{background:url(//static.apidog.ru/v6.2/logo_login_2x.png) center center/300px no-repeat;overflow:hidden;width:300px;height:110px;margin:0 auto}@keyframes loaderRound{from{transform:rotate(0)}to{transform:rotate(360deg)}}@-webkit-keyframes loaderRound{from{transform:rotate(0)}to{transform:rotate(360deg)}}.loader-line{border:5px solid #4E729A;border-bottom-color:transparent;height:40px;width:40px;margin:0 auto;border-radius:50%;animation:loaderRound ease-in-out .7s infinite;-webkit-animation:loaderRound ease-in-out .7s infinite}.loadScreen-animation .loader-line{border-color:#fff;border-bottom-color:transparent}.loadScreen-content{position:absolute;top:50%;left:50%;margin:-105px 0 0 -150px}.loadScreen-label{text-align:center;line-height:50px;font-size:22px}.loadScreen-footer{text-align:center;position:absolute;bottom:10px;font-size:xx-small;color:rgba(255,255,255,.5);width:80%;left:10%;right:10%}.topNotification-wrap{background:#e8edf1;line-height:28px;font-size:14px}.topNotification-close{width:28px;height:28px;float:right;background:url("data:image/svg+xml,%3Csvg fill='rgb(93, 125, 182)' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E") center center;background-size:90%;cursor:pointer}.topNotification-content{text-align:center;padding:0 32px 0 0}.topNotification-closing{-webkit-transition:all .4s ease-in;-moz-transition:all .4s ease-in;transition:all .4s ease-in;background:#5f7fba}</style>
	</head>



	<body id="main" class="head-player-button-play isTouch<?=($settings->getBitmask() & Setting::FIXED_POSITION_HEADER ? " header--fixed": "");?>">

		<!-- Load screen -->
		<div class="hidden loadScreen-wrap">
			<div class="loadScreen-content">
				<div class="loadScreen-logo"></div>
				<div class="loadScreen-animation"><div class="loader-line"></div></div>
				<div class="loadScreen-label">Loading...</div>
			</div>
			<div class="loadScreen-footer">
				<p>APIdog v6.4.6 early access [build <?=APIDOG_BUILD;?>] &copy; 2012&ndash;2017</p>
				<p>Владислав Велюга, Антон Карпович, Александр Ткачук, Тарас Дацюк, Оксана Эриксон, Илья Ворчук, Надя Иванова</p>
			</div>
		</div>

		<!-- Notification -->
		<!--? include_once "../notification.php";?-->


		<!-- Main content -->
		<div class="all-page" id="wrap">

			<!-- Header -->
			<div class="head-wrapper" id="hat">

				<div class="head-wrap">

					<div class="head-icon-menu" onclick="Menu.toggle();"><div class="hat-menu-icon-in"></div></div>

					<a class="head-profile" href="#" id="_link">
						<div class="head-profile-photo-wrap">
							<img src="data:image/svg+xml,%3Csvg fill='%23FFFFFF' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E" class="head-profile-photo" id="_photo" />
						</div>
						<div class="head-profile-name" id="_name">Loading...</div>
					</a>

					<div class="head-content" data-open="title">

						<div class="head-content-single" id="miniplayer" onclick="Site.onClickHead(event, this);" data-url="">
							<div class="head-content-title" id="_header">&nbsp;Title</div>
							<div class="head-player-mini" id="headplayer-titleMini" onclick="return Audios.miniPlayer.show(event);">
								<div class="head-player-mini-title" id="head-player-mini-title"></div>
							</div>
						</div>



						<div class="head-content-player selectfix" id="headplayer">

							<div class="head-player-buttons">
								<div class="head-player-button-prev" onclick="Audios.previous();"></div>
								<div class="head-player-button-state" id="headplayer-play" onclick="Audios.player.toggle();"></div>
								<div class="head-player-button-next" onclick="Audios.next();"></div>
							</div>

							<div class="head-player-main" onclick="return Audios.miniPlayer.hide(event);">
								<div class="head-player-title-wrap">
									<div class="head-player-title" id="headplayer-titleNormal">
										<div class="headplayer-titleReal">
											<span id="head-player-artist"></span> &mdash; <span id="head-player-song"></span>
										</div>
									</div>
									<div class="head-player-time" id="player-playedtime" onclick="Audios.miniPlayer.changeFormatTime(event);">00:00</div>
								</div>
								<div class="head-player-line" onclick="$.event.cancel(event);" id="head-player-line-wrap">
									<div class="head-player-lines" id="head-player-line">
										<div class="head-player-line-played" id="head-player-line-played"></div>
										<div class="head-player-line-loaded" id="head-player-line-loaded"></div>
									</div>
								</div>
							</div>

							<div class="head-player-actions">
								<div class="head-player-actions-icons">
									<div class="head-player-add hidden cp" id="add-audio" onclick="Audios.player.add(this);"></div>
									<div class="head-player-live cp" id="live-audio" onclick="Audios.player.toggleBroadcast(this);"></div>
									<div class="head-player-find hidden cp" id="find-audio" onclick="Audios.resolveRadioTrack(Audios.getRadioCurrent());"></div>
									<!--div class="head-player-text-audio" onclick="Audios.Player.TriggerPlayList(this);"></div-->
									<div class="head-player-repeat cp" id="repeat-audio" onclick="Audios.player.toggleRepeat(this);"></div>
									<div class="head-player-share cp" id="share-audio" onclick="Audios.player.Share(this);"></div>
								</div>

								<div id="head-player-volume">
									<input type="text" id="head-player-volume-input" class="hidden" value="100" />
									<div id="head-player-volume-ghost"></div>
								</div>
							</div>

						</div>


					</div>
				</div>
			</div>
			<!-- / header -->

			<!-- Content -->
			<div class="content" id="wrap-content">

				<!-- Left menu -->
				<div class="menu" id="_menu">
					<a href="#" id="_linkMenu" class="menu-profile">
						<div class="menu-profile-background"></div>
						<div class="menu-profile-content">
							<img src="data:image/svg+xml,%3Csvg fill='%23FFFFFF' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E" class="menu-profile-photo" />
							<strong></strong>
						</div>
					</a>
					<aside>
						<a href="#mail" id="menu-mail" data-menu="messages" class="mbo"><?=$l10n->menuMail;?></a>
						<a href="#feed" class="mbo"><?=$l10n->menuFeed;?></a>
						<a href="#feed?act=notifications" data-menu="notifications" id="menu-feed"><?=$l10n->menuNotifications;?></a>
						<a href="#friends" data-menu="friends"><?=$l10n->menuFriends;?></a>
						<a href="#photos<?=$session->getUserId();?>" data-menu="photos"><?=$l10n->menuPhotos;?></a>
						<a href="#groups" data-menu="groups"><?=$l10n->menuGroups;?></a>
						<a href="#audio"><?=$l10n->menuAudios;?></a>
						<a href="#videos" data-menu="videos"><?=$l10n->menuVideos;?></a>
						<a href="#docs"><?=$l10n->menuDocuments;?></a>
						<a href="#fave" id="menu-fave"><?=$l10n->menuFaves;?></a>
						<a href="#search"><?=$l10n->menuSearch;?></a>
					</aside>
					<!--div class="menu-notify-wrap" id="_notify_ext">
						<strong class="menu-notify">Внимание!</strong>
						<div style="padding: 5px">
							<div>Не работают аудио?</div>
							<div><b><a href="/6.5/blog.php?postId=5">Подробнее &raquo;</a></b></div>
						</div>
					</div-->
					<aside>
						<a href="#settings"><?=$l10n->menuSettings;?></a>
						<a href="?page=donate" target="_blank"><?=$l10n->menuDonate;?></a>
						<a href="?page=plus" target="_blank" id="_link_ext">APIdog Plus</a>
						<a href="?page=logout" onclick="return confirm('<?=$l10n->menuLogoutConfirmation;?>')"><?=$l10n->menuLogout;?></a>
						<div class="footer">
							<div class="tip" style="font-size: x-small;">APIdog v<?=APIDOG_VERSION;?> / b<?=APIDOG_BUILD;?> &copy; 2012&ndash;2017</div>
						</div>
						<a href="https://telegra.ph/APIdog-v646-dev-08-20#<?=APIDOG_BUILD;?>" target="_blank" class="cglg">ChangeLog</a>
					</aside>
					<div id="birthdays"></div>
					<div class="avmn-wrap">
						<div class="avmn"><?=$l10n->menuAdvertisments;?></div>
						<div id="MarketGidScriptRootC592365">
							<div id="MarketGidPreloadC592365">
								<a id="mg_add592365" href="http://usr.marketgid.com/demo/celevie-posetiteli/" target="_blank">
									<img src="//cdn.marketgid.com/images/marketgid_add_link.png" style="border:0px">
								</a>
								<a href="http://marketgid.com/" target="_blank">Загрузка...</a>
							</div>
						</div>
						<div class="apidog-a" id="_apidv"></div>
					</div>
				</div>
				<!-- / left menu -->

				<div id="_menu_up" onclick="Menu.toTop(null, true);" class="hidden menu-totop">
					<aside>Наверх</aside>
				</div>

				<section class="page" id="page">
					<section class="content" id="content">
						<div class="loader-line"></div>
					</section>
				</section>
			</div>
		</div>
		<!--<script src="/default.min.js?v=<?=APIDOG_VERSION;?>"></script>-->

		<script src="js/assembley.php"></script>


		<audio id="player" class="hidden"></audio>
		<noscript><img src="//mc.yandex.ru/watch/19029880" style="position:absolute; left:-9999px;" alt="" /></noscript>
	</body>
</html>
<!-- APIdog Corp. -->
<!-- Have fun since 8 august 2012 until now! -->
<?
	ob_end_flush();
?>