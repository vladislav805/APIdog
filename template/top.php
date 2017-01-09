<!DOCTYPE html>
<html lang="ru-RU">
	<head>
		<base href="/6.5/" />
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
		<title><?=getLabel("_title");?></title>
		<link rel="stylesheet" href="css/base.css" />
		<link rel="stylesheet" href="css/adaptive.css" />
		<link rel="stylesheet" href="css/ui-elements.css" />
		<link rel="stylesheet" href="css/nondefault.css" />
		<link rel="yandex-tableau-widget" href="manifest.json?7" />
		<link rel="icon" href="favicon.png?1" />
		<link rel="shortcut icon" href="favicon.png?1" />
		<!--script type="text/javascript" src="/advert.js"></script-->
	</head>
	<body id="main">
		<div class="dog-wrapper" id="wrap">
			<div class="head head-fixed" id="dog-head">
				<div class="head-wrap">
					<div class="head-menuIcon" onclick="menu.toggle();"><div class="head-menuIconInner"></div></div>
					<a href="./" class="head-logo svg-logo fl"></a>
					<div class="head-content" id="head-content">
						<div class="head-title" id="head-title"><?=getLabel("_headTitle");?></div>
					</div>
				</div>
			</div>
			<div class="dog-page dog-page-fixed" id="wrap-content">
				<div class="dog-menu" id="dog-menu">
					<aside>
						<!--a href="auth.php"><?=getLabel("menuAuthorize");?></a-->
						<a href="blog.php"><?=getLabel("menuBlog");?></a>
						<!--a href="faq"><?=getLabel("menuFaq");?></a-->
						<a href="about.php"><?=getLabel("menuAbout");?></a>
						<a href="donate.php"><?=getLabel("menuDonate");?></a>
					</aside>
				</div>
				<section class="dog-content" id="dog-content">
					<section class="content" id="content">