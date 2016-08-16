<?
	/**
	 * APIdog.ru v6.5
	 * Copyright (c) 2012-2016
	 *
	 * Vladislav Veluga (c) 2009-2016
	 * 16 august 2016
	 */

	include_once "zero.config.php";
	include_once "zero.helper.php";
	include_once "zero.userarea.php";
	include_once "zero.pageutilites.php";
	include_once "zero.language.php";
	include_once "zero.authorize.php";
	include_once "zero.db.php";

	if (isset($_REQUEST["act"]) ?? false) {
		header("X-Frame-Options: SAMEORIGIN");
	};

	if (!defined("_install")) {
		exit("not configured. please, configure zero-module before using site");
	};

	session_start();

	//error_reporting(E_ERROR | E_PARSE);

	date_default_timezone_set("Europe/Minsk"); // GMT+3
	header("Content-Type: text/html; charset=UTF-8");


	define("KEY_ACCESS_TOKEN", "userAccessToken");
	define("KEY_AUTH_KEY", "authKey");

	function initDefines() {
		global $ssAdmins;

		$authKey = escape(isset($_COOKIE[KEY_AUTH_KEY]) ? $_COOKIE[KEY_AUTH_KEY] : "");
		$session = getSessionByAuthKey($authKey);

		if (!$authKey || !$session) {
			$userAccessToken = "";
			$authKey = "";
			$userId = 0;
			$isAdmin = false;
		} else {
			$userAccessToken = escape($_COOKIE[KEY_ACCESS_TOKEN]);
			$userId = $session->userId;
			$isAdmin = isset($ssAdmins[$session->userId]);
		};

		define("userAccessToken", $userAccessToken);
		define("userAuthKey", $authKey);
		define("userId", $userId);
		define("isAdminCurrentUser", $isAdmin);
	};

	if (!function_exists("escape")) {
		/**
		 * Функция для "обезопашивания" строк для записи в БД
		 * @param  String $string Строка, которую нужно экранировать
		 * @return String          Результат, безопасная строка
		 */
		function escape($string) {
			return getDatabase()->escape_string($string);
		};
	};



	/**
	 * Включил ли пользователь себе доступ к новой версии?
	 * @return boolean
	 */
	function isNewVersionEnabled() {
		return SQLquery("SELECT `v5` FROM `settings` WHERE `userId` = '" . userId . "' LIMIT 1", SQL_RESULT_ITEM)["v5"];
	};

	/**
	 * Выкинуть ошибку и остановить выполнение
	 * @param  int  $errorId Идентификатор ошибки
	 * @param  mixed $extra   Дополнительные данные, если нужны
	 */
	function throwError($errorId, $extra = false) {

		include_once "zero.errors.php";

		$data = [
			"errorId" => $errorId,
			"message" => getErrorTextById($errorId),
			"params" => $_REQUEST
		];

		if ($extra) {
			$data["extra"] = [];
			foreach ($extra as $key => $value) {
				$data["extra"][$key] = $value;
			};
		};

		output($data);
	};


	session_write_close();

	initDefines();