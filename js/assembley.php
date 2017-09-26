<?
	$list = scanDir(".");

	$ignore = [".", "..", "auth.js", "assembley.php", "_.js"];

	header("Content-type: text/javascript");

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

	exit;