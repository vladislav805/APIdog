<?

	$ua = isset($_SERVER["HTTP_USER_AGENT"]) ? $_SERVER["HTTP_USER_AGENT"] : null;

	define("USER_FROM_UA", isset($_SERVER["HTTP_ACCEPT_LANGUAGE"]) ? strpos($_SERVER["HTTP_ACCEPT_LANGUAGE"], "uk") !== false : false);

?>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta key="fdad2cbd79b4cb58882469eb10ac79c1" />
		<title>APIdog | Авторизация</title>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link href="css/login.css" rel="stylesheet" />
		<script>
			window.__userFromUkraine=<?=json_encode(USER_FROM_UA);?>
		</script>
	</head>
	<body>
		<div class="wrap">

			<div class="slide-logo">
				<figure class="apidog-logo-wrap">
					<img src="images/logo.svg" class="apidog-logo" alt="" />
					<figcaption>v6.4.6 early access [build <?=APIDOG_BUILD;?>]</figcaption>
				</figure>
			</div>
			<div class="slide-content">


				<p class="aboutText">Альтернативная <del>офлайн-</del>версия ВКонтакте с дополнительным функционалом.</p>
				<form onsubmit="try { authorize(this, event); } catch (e) { console.log(e) } return false;" action="#" method="post">


					<div id="authSimple">
						<div class="field-wrap">
							<label for="username">Телефон или email</label>
							<input class="field" id="username" name="login" />
						</div>

						<div class="field-wrap">
							<label for="password">Пароль</label>
							<input class="field" type="password" name="password" id="password" />
						</div>

						<div class="field-wrap selectApp">
							<select name="application" onchange="changeApplicationName(this);" id="application">
								<option value="1" selected>Android</option>
								<option value="2">iPhone</option>
								<option value="3">iPad</option>
								<option value="4">Windows Phone</option>
								<option value="6">Windows</option>
								<option value="8">BlackBerry (Vika)</option>
								<option value="9">Snapster Android</option>
								<option value="10">Kate Mobile</option>
								<option value="11">Lynt</option>
								<option value="12">VK Desktop Messenger</option>
								<option value="13">WinPhone 2</option>
							</select>
							<label for="application">Приложение</label>
							<div class="pseudoselect-label" id="applicationName">Android</div>
						</div>
					</div>



					<div id="authCaptcha" class="hidden">
						<input type="hidden" name="captchaId" id="captchaId" value="" />
						<img src="about:blank" alt="" id="captchaImage" onclick="setCaptchaImage(this);" />
						<input type="text" class="field" name="captchaKey" id="captchaKey" value="" autocomplete="off" />
					</div>
					<div id="authValidation" class="hidden">
						<h2>Подтверждение входа</h2>
						<p>На номер <strong id="validationPhone"></strong> <span id="validationTime">будет</span> выслано SMS с кодом, который Вы должны ввести в поле ниже</p>
						<input type="hidden" name="validationId" id="validationId" value="" />
						<div>
							<input type="button" value="Отправить SMS" id="submitSms" onclick="sendValidationSMS(this);" />
							<div class="loader-wrap">
								<div class="loader-line"></div>
							</div>
						</div>
						<div id="validationForm" class="hidden">
							<input type="text" class="field" value="" name="validationCode" id="validationCode" />
						</div>
					</div>
					<div class="submit">
						<input type="submit" id="submitMain" value="Войти" />
						<div class="loader-wrap">
							<div class="loader-line"></div>
						</div>
					</div>
					<?if(USER_FROM_UA){?>
						<div style="color: #00bcd4;">Для пользователей из Украины: все запросы к ВКонтакте будут идти через наш прокси.</div>
					<?}?>
					<div class="hidden" id="errorBlock"></div>
					<div class="text-footer">
						<p>Нажимая кнопку "Войти",  Вы даете свое согласие на передачу Ваших данных через сервера APIdog <string>без их последующей записи</string>.</p>
					</div>
				</form>






			</div>
		</div>



		<!--script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', 'UA-73434682-1', 'auto');ga('require', 'linkid');ga('send', 'pageview');</script-->
		<script src="js/auth.js" async></script>
	</body>
</html>