<?

	session_start();

	if (preg_match("/(MSAppHost|WebView Rev)/i", $_SERVER["HTTP_USER_AGENT"])) {
		exit("not accepted. please, close this application and open http://apidog.ru/ in browser.");
	}

	require_once "conf.php";
	require_once "functions.php";

	header("Content-Type: text/html; charset=UTF-8");

	$page = get("page");


	if (isAuthorize()) {
		require_once "page/main-authorized.php";
	} else {
		if (!isset($_SESSION["invite"])) {
			header("HTTP/1.1 403 Forbidden");
			print "Access forbidden without invite key or active session on site.";
			exit;
		}
		require_once "page/main-login.php";
	}
