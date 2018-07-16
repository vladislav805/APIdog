<?
	/** @var Controller $cn */

	if (!defined("APIDOG_IS_AUTHORIZED") || !APIDOG_IS_AUTHORIZED) {
		exit;
	}

	try {
		$cn->perform(new \Method\Session\Kill(["authId" => $cn->getSession()->getAuthId()]));
	} catch (Exception $e) {
		//var_dump($e);
	} finally {

		foreach ($_COOKIE as $name => $value) {
			setCookie($name, null, 0, "/");
		}

		session_destroy();

		header("Location: ./");
		exit;
	}