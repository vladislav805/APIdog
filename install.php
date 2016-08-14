<?

	$sampleFile = '<' . "?\n\n\t/**\n\t * База данных\n\t */\n\n\t\$dbHost = \"%h\";\n\t\$dbUser = \"%u\";\n\t\$dbPassword = \"%p\";\n\t\$dbDatabase = \"%d\";\n\n\t/**\n\t * Для блога: вывод автора\n\t */\n\t\$dogAdminBlogName = [\n\t\t%i => \"Разработчик\"\n\t];\n\n\t/**\n\t * Для поддержки: ID, имя, фото\n\t */\n\t\$ssAgents = [\n\t\t1 => [\"agentId\"=>1,\"name\"=>\"support.agent_developer\",\"isModer\"=>false,\"photo\"=>\"support_dev.png\"]\n\t];\n\n\t/**\n\t * Для поддержки: заблокированные пользователи\n\t */\n\t\$ssBlockedUsers = [];\n\n\t/**\n\t * Для определения админов/агентов по VK ID\n\t */\n\t\$ssAdmins = [\n\t\t%i\t=> 1\n\t];\n\n\t/**\n\t * Для авторизации: ID и ключи приложений\n\t */\n\t\$authApps = [\n\t\t[2274003, \"hHbZxrka2uZ6jB1inYsH\"]\t// 1\tAndroid\n\t];\n\tdefine(\"_installed\",true);";

	function getLabel($t){
		$phrases = ["_title" => "Configure APIdog", "_headTitle" => "Configuring"];

		return isset($phrases[$t]) ? $phrases[$t] : "";
	};

	function getUserDataForNonStdPages() { return ["usr" => [], "lng" => []]; };

	if (isset($_REQUEST["act"])) {

		$db = new MySQLi($_REQUEST["dbHost"], $_REQUEST["dbUser"], $_REQUEST["dbPassword"], $_REQUEST["dbDatabase"]);

		$errors = [];

		if (!$db || $db->error) {
			$errors[] = [0, "Database error: " . $db->error];
		} else {

			$file = $sampleFile;
			$replace = [
				"dbHost" => "h",
				"dbUser" => "u",
				"dbPassword" => "p",
				"dbDatabase" => "d",
				"userId" => "i"
			];

			foreach ($replace as $param => $schema) {
				$file = str_replace("%" . $schema, addslashes(trim($_REQUEST[$param])), $file);
			};

			$configFile = file_put_contents("zero.config.php", $file);

			if (!$configFile) {
				$errors[] = [0, "Error while create config-file (zero.config.php)"];
			};

			$sqlQueries = [
				"CREATE TABLE `auth` (`auth_id` int(11) NOT NULL, `user_id` int(11) NOT NULL, `date` int(11) NOT NULL, `dateVisit` int(11) NOT NULL, `hash` varchar(32) NOT NULL, `appId` int(11) NOT NULL DEFAULT '-1') ENGINE=MyISAM DEFAULT CHARSET=utf8",
				"CREATE TABLE `blog` (`postId` int(11) NOT NULL, `date` int(11) NOT NULL, `title` varchar(128) NOT NULL, `text` longtext NOT NULL, `adminId` int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8",
				"CREATE TABLE `blogViews` (`viewId` int(11) NOT NULL, `postId` int(11) NOT NULL, `userId` int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8",
				"CREATE TABLE `paid` (`orderId` int(11) NOT NULL, `productId` int(11) NOT NULL, `userId` int(11) NOT NULL, `date` int(11) NOT NULL, `untilDate` int(11) NOT NULL, `amount` int(11) NOT NULL, `isActive` int(11) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8",
				"CREATE TABLE `products` (`productId` int(11) NOT NULL, `amount` int(11) NOT NULL, `title` varchar(128) NOT NULL, `description` varchar(2048) NOT NULL, `period` int(11) NOT NULL, `analog` varchar(64) NOT NULL, `released` tinyint(1) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8",
				"CREATE TABLE `settings` (`id` int(11) NOT NULL, `userId` int(11) NOT NULL, `bitmask` int(11) NOT NULL DEFAULT '11512', `notifications` int(11) NOT NULL DEFAULT '19', `lang` int(1) NOT NULL, `v5` tinyint(1) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8",
				"ALTER TABLE `auth` ADD UNIQUE KEY `hash` (`hash`), ADD KEY `auth_id` (`auth_id`), ADD KEY `user_id` (`user_id`)",
				"ALTER TABLE `blog` ADD PRIMARY KEY (`postId`), ADD UNIQUE KEY `postId` (`postId`), ADD KEY `postId_2` (`postId`)",
				"ALTER TABLE `blogViews` ADD PRIMARY KEY (`viewId`)",
				"ALTER TABLE `paid` ADD PRIMARY KEY (`orderId`)",
				"ALTER TABLE `products` ADD PRIMARY KEY (`productId`)",
				"ALTER TABLE `settings` ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `userId` (`userId`)",
				"ALTER TABLE `auth` MODIFY `auth_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1",
				"ALTER TABLE `blog` MODIFY `postId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1",
				"ALTER TABLE `blogViews` MODIFY `viewId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1",
				"ALTER TABLE `paid` MODIFY `orderId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1",
				"ALTER TABLE `products` MODIFY `productId` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1",
				"ALTER TABLE `settings` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1"
			];

			foreach ($sqlQueries as $query) {
				$result = $db->query($query);
				if (!$result) {
					$errors[] = [1, $query];
				};
			};
		};

		$isSuccess = !sizeOf($errors);

		include_once "template/top.php";
?>
<h1><?=($isSuccess ? "APIdog was configured" : "Error occured while configure");?></h1>
<?
		if ($isSuccess) {
?>
<a class="btn" href="./">Start using</a>
<?
		} else {
?>
<p>Same errors was occured:</p>
<ol>
<?
			foreach ($errors as $index => $error) {
				list($type, $error) = $error;
				switch ($type) {
					case 1:
?><li>Query error: <?=$error;?></li><?
						break;

					default:
?><li>Configure error: <?=$error;?></li><?
						break;
				};
			};
?>
</ol>
<a class="btn" href="install.php">Try again</a>
<?
		}
		include_once "template/bottom.php";
		exit;
	};




	include_once "template/top.php";

?>

<form action="install.php?act=do" method="post">
	<h1>APIdog Installer&amp;configurer</h1>
	<fieldset>
		<legend>Database settings</legend>
		<p>Host</p>
		<div><input type="text" name="dbHost" /></div>
		<p>User</p>
		<div><input type="text" name="dbUser" /></div>
		<p>Password</p>
		<div><input type="password" name="dbPassword" /></div>
		<p>Database</p>
		<div><input type="text" name="dbDatabase" /></div>
	</fieldset>
	<fieldset>
		<legend>User access</legend>
		<p>Your userId VK (user will be approved as admin of site)</p>
		<div><input type="text" name="userId" autocomplete="off" /></div>
	</fieldset>
	<input type="submit" value="Install&amp;configure" />
</form>

<?

	include_once "template/bottom.php";