<?php
	/**
	 * APIdog v6.5
	 *
	 * Вывод списка файлов
	 */

	$files = scandir("./");
?><pre><?
	foreach ($files as $name) {
		if (!strpos($name, "js"))
			continue;
?><a href="./<?=$name;?>"><?=$name;?></a> - <?=sizeof(file($name));?> / <?=filesize($name);?>b <br /><?
	}