<?

	$pagePrefix = "login";

	include_once "zero.framework.php";
	include_once "zero.helper.php";

	if (getAuthKey()) {
		header("Location: ./");
		exit;
	};

	if (isset($_REQUEST["act"])) {

		switch ($_REQUEST["act"]) {

			/**
			 * Завершение сессии
			 */
			case "logout":
				session_start();
				$authKey = getAuthKey();
				SQLquery("DELETE FROM `auth` WHERE `hash` = '$authKey' LIMIT 1", 0);
				closeDatabase();

				foreach ($_COOKIE as $key => $value) {
					setCookie($key, null, -1, "/");
				};

				session_destroy();

				header("Location: auth.php");
				break;
		}

		exit;
	};

	closeDatabase();
	template("template/auth.html");