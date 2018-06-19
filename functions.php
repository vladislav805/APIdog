<?

	spl_autoload_register(function($cls) {
		/** @noinspection PhpIncludeInspection */
		require_once "modules/" . str_replace("\\", "/", $cls) . ".php";
	});

	define("KEY_ACCESS_TOKEN", "userAccessToken");
	define("KEY_AUTH_KEY", "authKey");
	define("KEY_SALT", "salt");

	define("KB", 1024);
	define("MB", 1024 * KB);
	define("GB", 1024 * MB);

	define("HOUR", 60 * 60);
	define("DAY", 24 * HOUR);
	define("MONTH", 30 * DAY);

	define("APIDOG_VERSION", "6.4.6");
	define("APIDOG_BUILD", "20180619");

	/**
	 * Return param from query string/post body by key
	 * @param string $key
	 * @return string
	 */
	function get($key) {
		return isset($_REQUEST[$key]) ? $_REQUEST[$key] : "";
	}

	/**
	 * Output $data as JSON and stop script
	 * @param mixed  $data
	 * @param string $wrap
	 */
	function output($data, $wrap = "result") {
		$c = get("callback");
		$j = json_encode([$wrap => $data], JSON_UNESCAPED_UNICODE);
		header("Content-type: " . ($c ? "text/javascript" : "application/json") . "; charset=utf-8");
		exit(($c ? $c . "(" : "") . $j . ($c ? ");" : ""));
	}

	/**
	 * Return number $n in range $min to $max
	 * @param float $min
	 * @param float $n
	 * @param float $max
	 * @return float
	 */
	function toRange($min, $n, $max) {
		return min($max, max($n, $min));
	}

	/**
	 * Returns true, if client is authorized
	 * @return boolean
	 */
	function isAuthorize() {
		return isset($_COOKIE[KEY_ACCESS_TOKEN]);
	}

	function safeString(&$str) {
		return $str = str_replace("'", '\\\'', $str);
	}

	/**
	 * Returns true, if $string is correct URL
	 * @param string $string
	 * @return boolean
	 */
	function isURL($string) {
		return (boolean) preg_match("/^((https?|ftp|market):\/\/)?([A-Za-z0-9А-Яа-яЁё-]{1,64}\.)+([A-Za-zА-Яа-я]{2,6})\/?(.*)$/iu", $string);
	}

	define("INVITE_FILE_DB", "invites.json");

	define("INVITE_STATE_OPEN", 0);
	define("INVITE_STATE_USED", 1);

	function invite_open() {
		return json_decode(file_get_contents(INVITE_FILE_DB), true);
	}

	function invite_save($data) {
		file_put_contents(INVITE_FILE_DB, json_encode($data, JSON_UNESCAPED_UNICODE));
	}