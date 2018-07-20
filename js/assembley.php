<?
	$list = scanDir(".");

	$ignore = [".", "..", "auth.js", "assembley.php"];

	header("Content-type: text/javascript");

	ob_start(function($buffer) {
		return preg_replace(['/ {2,}/sm', '/\t+/sm'], "", $buffer);
	});

	foreach ($list as $file) {
		if (!in_array($file, $ignore)) {
			readfile($file);
		}
	}



	$list = scanDir("../lib");

	foreach ($list as $file) {
		if (!in_array($file, $ignore)) {
			readfile("../lib/" . $file);
		}
	}


	readfile("http://api.vlad805.ru/v2/external.js");

	ob_end_flush();

	exit;