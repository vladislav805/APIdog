<?
	$dir = scandir("../js/");
	header("Content-type: text/javascript; charset=utf-8");
	foreach ($dir as $file) {
		if (strpos($file, "js")) {
			print file_get_contents("../js/" . $file);
		};
	};