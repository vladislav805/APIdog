<?

	$pagePrefix = "login";

	include_once "zero.framework.php";
	include_once "zero.helper.php";

	if ($_REQUEST["act"]) {

		switch ($_REQUEST["act"]) {

			/**
			 * Завершение сессии
			 */
			case "logout":
				$hash = escape($_REQUEST["hash"]);
				SQLquery("DELETE FROM `auth` WHERE `hash` = '$hash' LIMIT 1");

				session_destroy();

				foreach ($_COOKIE as $key => $value) {
					setCookie($key, null, 0);
				};

				header("Location: /");
				break;
		}

		exit;
	};

	template(APIdogTemplateTop);
?>
<div class="login-content">
		<form onsubmit="try { authorize(this, event); } catch (e) {}; return false;" action="#" method="post"><div id="authSimple"><input class="fields" type="text" name="username" placeholder="Телефон или email" /><input class="fields" type="password" name="password" placeholder="Пароль" /><div class="fields pseudoselect-wrap"><select class="pseudoselect" name="application" onchange="changeApplicationName(this);"><option value="1" selected>Android</option><option value="2">iPhone</option><option value="3">iPad</option><option value="4">Windows Phone</option><option value="6">Windows</option><option value="8">BlackBerry (Vika)</option><option value="9">Snapster Android</option><option value="10">Kate Mobile</option></select><div class="pseudoselect-arrow">▼</div><div class="pseudoselect-label" id="applicationName">Android</div></div></div><div id="authCaptcha" class="hidden"><input type="hidden" name="captchaId" id="captchaId" value="" /><img src="about:blank" alt="" id="captchaImage" onclick="setCaptchaImage(this);" onerror="onErrorCaptcha(this);" /><input type="text" class="fields fields-nopadding" name="captchaKey" id="captchaKey" value="" autocomplete="off" /></div><div id="authValidation" class="hidden"><h2>Подтверждение входа</h2><p>На номер <strong id="validationPhone"></strong> <span id="validationTime">будет</span> выслано SMS с кодом, который Вы должны ввести в поле ниже</p><input type="hidden" name="validationId" id="validationId" value="" /><div><input type="button" value="Отправить SMS" id="submitSms" onclick="sendValidationSMS(this);" /><div class="loader-wrap"><div class="loader-line"></div></div></div><div id="validationForm" class="hidden"><input type="text" class="fields" value="" name="validationCode" id="validationCode" /></div></div><div class="submit"><input type="submit" id="submitMain" value="Войти" /><div class="loader-wrap"><div class="loader-line"></div></div></div><div class="hidden" id="errorBlock"></div><div class="orOAuth"><div><a href="/login.php">Не работает новая форма? Попробуйте через старую</a>.</div><small>Вход по access_token был заблокирован со стороны ВКонтакте.</small></div></form>
</div>
<script type="text/javascript">
	window.addEventListener("DOMContentLoaded", function () {
		$.elements.addClass(getBody(), "login");
	});
</script>
<?
	template(APIdogTemplateBottom);