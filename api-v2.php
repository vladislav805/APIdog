<?

	error_reporting(E_ERROR);

	/****************
	 * APIdog APIv2 *
	 ****************
	 *  14.03.2015  *
	 ****************/

	include_once "zero.framework.php";
	include_once "zero.helper.php";

	date_default_timezone_set ("Europe/Minsk");

	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Credentials: true");
	header("Access-Control-Allow-Methods: HEAD, OPTIONS, GET, POST");
	header("Access-Control-Allow-Headers: Content-Type, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control");


	$usersIgnoreAds = [23048942];


	$currentUserId = $currentUserId == "0" ? -1 : $currentUserId;

	switch ($_REQUEST["method"]) {

		// Settings

		// Returns settings of current user
		case "settings.get":
			if (!userId)
				throwError(9);

			$userId = (int) $_REQUEST["userId"];

			$extended = (boolean) $_REQUEST["extended"];

			$userId = !$userId ? userId : ($userId && isAdminCurrentUser ? $userId : userId);

			$s = Settings::getBitmask($userId);

			$b = $s["bitmask"];
			$langId = (int) $s["lang"];
			output(!$s ? throwError(30) : [
				"userId" => (int) $userId,
				"settings" => [
					"userId" => $userId,
					"bitmask" => (int) $s["bitmask"],
					"bitmaskNotifications" => (int) $s["notifications"],
					"language" => [
						"id" => $langId,
						"file" => "https://apidog.ru/6.5/lang/" . $langId . ".json"
					]
				]
			]);
			break;

		// Save user's settings
		case "settings.set":
			if (!userId) {
				throwError(9);
			};

			if (!isset($_REQUEST["bitmask"]) || !isset($_REQUEST["languageId"])) {
				throwError(5);
			};

			$bitmask = (int) $_REQUEST["bitmask"];
			$lang = (int) $_REQUEST["languageId"];
			$notifications = (int) $_REQUEST["bitmaskNotifications"];
			$userId = (int) userId;
			$test = SQLquery("SELECT `bitmask`, `userId` FROM `settings` WHERE `userId` = '$userId' LIMIT 1", SQL_RESULT_ITEM);
			if ($test["userId"]) {
				$success = SQLquery("UPDATE `settings` SET `bitmask` = '$bitmask', `notifications` = '$notifications', `lang` = '$lang' WHERE `userId` = '$userId' LIMIT 1", SQL_RESULT_AFFECTED) || $test["bitmask"] == $bitmask;
			} else {
				$success = SQLquery("INSERT INTO `settings` (`userId`, `bitmask`, `lang`, `notifications`) VALUES ('$userId', '$bitmask', '$lang', '$notifications')", SQL_RESULT_INSERTED);
			};
			$langId = $lang;
			$lang = [
				["languageId" => 0, "languageFile" => "/lang/ru.json"],
				["languageId" => 1, "languageFile" => "/lang/en.json"],
				["languageId" => 2, "languageFile" => "/lang/ua.json"],
				["languageId" => 999, "languageFile" => "/lang/gop.json"]
			][(int) $lang];

			output([
				"saved" => (boolean) $success,
				"userId" => $userId,
				"bitmask" => $bitmask,
				"bitmaskNotifications" => $notifications,
				"languageId" => $langId,
				"language" => $lang // deprected, remove after release 6.5
			]);
			break;

		// APIdog internal methods
		case "apidog.authorize":

			$login			= trim($_REQUEST["login"]);
			$password		= trim($_REQUEST["password"]);
			$application	= (int) $_REQUEST["application"];
			$captchaId		= (int) $_REQUEST["captchaId"];
			$captchaKey		= trim($_REQUEST["captchaKey"]);
			$validationId	= trim($_REQUEST["validationId"]);
			$validationCode	= trim($_REQUEST["validationCode"]);
			$auth = new Authorize();


			$result = $auth->requestByPairLoginPassword($login, $password, $application, $captchaId, $captchaKey, $validationId, $validationCode);

			output($result);

			break;

		// Register session of user authorization
		case "apidog.getAuthKey":

			$userAccessToken = $_REQUEST["userAccessToken"];
			$userApplication = (int) $_REQUEST["application"];

			$check = APIdog::checkToken($userAccessToken, $userApplication);

			if (!is_array($check) && $check < 0)
				throwError(-$check);

			$result = $check;

			if ((boolean) ($_REQUEST["extended"])) {
				$s = Settings::getBitmask(userId);
				$b = $s["bitmask"];
				$result["user"] = [
					"settings" => (int) $b
				];
			}

			output($result);

			break;

		// Associate authKey and userId, if user authorization had been did by token
		case "apidog.associateAuthKey":
			output(false);

			$authKey = escape($_REQUEST["authKey"]);
			$authId = (int) $_REQUEST["authId"];
			$userId = (int) $_REQUEST["userId"];

			output(User::associateAuthKey($authKey, $authId, $userId));
			break;

		// Returns sessions
		case "apidog.getSessions":
			if (!userId)
				throwError(9);
			output(Settings::getSessions());
			break;

		// Delete session
		case "apidog.killSession":
			if (!userId) {
				throwError(9);
			};

			$authId = (int) $_REQUEST["authId"];
			$session = APIdogSession::getByAuthKey($authKey);
			if ($session == -1)
				throwError(10);
			if (is_object($session) && $session->getUserId() != userId)
				throwError(11);
			output($session->kill());
			break;


		case "apidog.getLanguageData":
			$s = Settings::getBitmask(userId);
			$langId = $s["lang"];

			if (!in_array($langId, [0, 1, 2, 999])) {
				$langId = 0;
			};

			$languageFile = "lang/" . $langId . ".json";

			// сделано так для большей оптимизации, ибо каждый раз разбирать строку в json, чтобы ее снова собирать в json -- имхо, глупо
			header("Content-type: application/json; charset=utf-8");

			$size = filesize($languageFile) + 22;
			header("Content-Length: " . $size);

			print "{\"response\":{\"data\":";
			readFile($languageFile);
			print "}}";
			break;



		// Returns ads block, that will be show in site or platform applications
		case "apidog.getAds":
			if (!userId)
				throwError(9);

			requireModule("ads");

			$count = (Integer) $_REQUEST["count"];
			$count = toRange(1, $count, 5);
			$age = (Integer) $_REQUEST["age"];

			if (!$age) $age = 18;

			output([]);

			$ads = new AdsAPI;

			$data = !in_array(userId, $usersIgnoreAds) ? $ads->getAvailable($count, true, 0, $age) : [];


			output($data);
			break;

		case "apidog.getAdList":
			requireModule("ads");

			$ads = new AdsAPI;

			output($ads->get(40, (Integer) $_REQUEST["offset"]));
			break;

		case "apidog.getAdById":
			requireModule("ads");

			$adIds = array_map("intval", explode(",", $_REQUEST["adIds"]));

			$data = [];
			$ads = new AdsAPI;

			foreach ($adIds as $adId) {
				$i = $ads->getById($adId);

				if (!$i || !$i->adId) {
					continue;
				};

				if (!AdsAPI::isAdminAPIdog() && userId != $i->ownerId) {
					continue;
				} else {
					$i->canEdit = AdsAPI::isAdminAPIdog();
				};

				$data[] = $i;
			};

			output($data);
			break;

		case "apidog.setActive":
			requireModule("ads");

			$adId = (int) $_REQUEST["adId"];
			$state = (int) $_REQUEST["state"];

			$ads = new AdsAPI;

			if (AdsAPI::isAdminAPIdog()) {
				$ads->setActive($adId, $state);
				output(1);
			};
			output(0);
			break;

		case "apidog.uploadAdImage":
			requireModule("ads");

			AdsAPI::isAdminAPIdog();

			$file = $_FILES["image"];

			$ads = new AdsAPI;

			output($ads->uploadImage($file));
			break;

		case "apidog.createAd":
			requireModule("ads");

			AdsAPI::isAdminAPIdog();

			$params = [
				"title"			=> escape($_REQUEST["title"]),
				"description"	=> escape($_REQUEST["description"]),
				"link"			=> escape($_REQUEST["link"]),
				"image"			=> escape($_REQUEST["image"]),
				"type"			=> (Integer) $_REQUEST["type"],
				"ownerId"		=> (Integer) userId,
				"dateStart"		=> (Integer) $_REQUEST["dateStart"],
				"dateEnd"		=> (Integer) $_REQUEST["dateEnd"],
				"ageFrom"		=> (Integer) $_REQUEST["ageFrom"],
				"ageTo"		=> (Integer) $_REQUEST["ageTo"]
			];

			if (!$params["title"] || !$params["description"] || !$params["link"] || !$params["image"] || !$params["dateStart"] || !$params["dateEnd"]) {
				throwError(120);
			};

			$ads = new AdsAPI;

			output($ads->add($params));

			break;

		case "apidog.editAd":
			requireModule("ads");

			AdsAPI::isAdminAPIdog();

			$adId = (Integer) $_REQUEST["adId"];
			$params = [
				"title"			=> escape($_REQUEST["title"]),
				"description"	=> escape($_REQUEST["description"]),
				"link"			=> escape($_REQUEST["link"]),
				"image"			=> escape($_REQUEST["image"]),
				"type"			=> (Integer) $_REQUEST["type"],
				"ownerId"		=> (Integer) userId,
				"dateStart"		=> (Integer) $_REQUEST["dateStart"],
				"dateEnd"		=> (Integer) $_REQUEST["dateEnd"],
				"ageFrom"		=> (Integer) $_REQUEST["ageFrom"],
				"ageTo"		=> (Integer) $_REQUEST["ageTo"]
			];

			if (!$params["title"] || !$params["description"] || !$params["link"] || !$params["image"] || !$params["dateStart"] || !$params["dateEnd"]) {
				throwError(120);
			};

			$ads = new AdsAPI;

			output($ads->edit($adId, $params));

			break;

		case "apidog.deleteAd":
			requireModule("ads");

			AdsAPI::isAdminAPIdog();

			$adId = (Integer) $_REQUEST["adId"];

			$ads = new AdsAPI;

			output($ads->delete($adId));

			break;


		case "apidog.uploadAttachmentByURL":
			if (!userId)
				throwError(9);

			$url = trim($_REQUEST["url"]);

			if (!APIdog::isURL($url))
				throwError(21);

			$parsed = parse_url($url);

			$tmp = 0;

			$fp = fsockopen($parsed["host"], 80, $errno, $errstr, 30);
			fputs($fp, "HEAD " . $parsed["path"] . " HTTP/1.0\nHOST: " . $parsed["host"] . "\n\n");
			while (!feof($fp))
				$tmp .= fgets($fp, 128);
			fclose($fp);

			if (preg_match("Content-Length: ([0-9]+)", $x, $size))
				$size = $size[1];
			else
				$size = -1;
			if ($size < 0 || $size > 5 * MB)
				throwError(33);

			include_once "uploader.php";
			$type = exif_imagetype($url);

			if(!in_array($type, [1, 2, 3, 6]))
				throwError(32);

			$isGif = $type == 1;
			$name = time() . "." . (!$isGif ? "jpg" : "gif");
			$fh = fopen("upload/" . $name, "w+");
			fwrite($fh, file_get_contents($url));
			fclose($fh);

			$isMail = (boolean) $_REQUEST["isMail"];

			$field = !$isGif ? "photo" : "file";

			$_FILES[$field] = [
				"tmp_name" => __DIR__ . "/upload/" . $name,
				"name" => $name,
				"size" => $size
			];

			$upload = new Uploader($field);

			$method = !$isGif
				? $isMail
					? "photos.getMessagesUploadServer"
					: "photos.getWallUploadServer"
				: "docs.getWallUploadServer";

			$upload->getServer($method);
			$upload->upload();

			$result = !$isGif
				? $isMail
					? $upload->photoMessageSave()
					: $upload->photoWallSave()
				: $upload->docSave();
			output($result);
			break;

		case "apidog.getBitrate":
			if (!userId)
				throwError(9);

			$data = APIdog::api("audio.getById", [
				"access_token" => $_REQUEST["a"],
				"audios" => $_REQUEST["i"]
			])->response[0];
			if (!$data) {
				output([
					"isSuccess" => false
				]);
			};

			$duration = $data->duration;
			$urlf = $data->url;

			$url = parse_url($urlf);
			$host = $url["host"];
			$path = $url["path"];
			$fp = stream_socket_client("$host:80", $errno, $errstr, 30); //15.06.2016
			if(!$fp) {
				echo "<script>console.log( 'Error: " . $errno . " - " . $errstr . "' );</script>";
			} else {
				//$fp = fsockopen($host, 80, $errno, $errstr, 30);
				stream_set_blocking($fp, false); //19.05.2016
				fputs($fp, "HEAD " . $path . " HTTP/1.0\nHOST: " . $host . "\n\n");

				while (!feof($fp)) {
					$x .= fgets($fp, 128);
				};

				fclose($fp);

				if (ereg("Content-Length: ([0-9]+)", $x, $size)) {
					$size = (int) $size[1];
				} else {
					$size = false;
				};

				output([
					"isSuccess" => true,
					"size" => $size,
					"bitrate" => (int) ($size / 128 / $duration)
				]);
			}
			break;

		case "apidog.getUserDateRegistration":

			$domain = trim($_REQUEST["userDomain"]);
			$user = APIdog::api("users.get", [
				"user_ids" => $domain,
				"fields" => "photo_rec,photo_400_orig,photo_max,screen_name,sex",
				"v" => 5.4
			], true)->response[0];

			$request = file_get_contents("http://vk.com/foaf.php?id=" . $user->id);

			$xml = xml_parser_create();
			xml_parse_into_struct($xml, $request, $values, $indexes);
			xml_parser_free($xml);
			$unix = strtotime($values[$indexes["YA:CREATED"][0]]["attributes"]["DC:DATE"]);
			$date = date("d/m/Y/H/i/s", $unix);
			$now = new DateTime(date("Y-m-d"));
			$was = new DateTime(date("Y-m-d", $unix));
			$interval = $now->diff($was);
			$days = $interval->days;
			list($day, $month, $year, $hour, $minute, $second) = explode("/", $date);
			$month = explode(",", "января,февраля,марта,апреля,мая,июня,июля,августа,сентября,октября,ноября,декабря")[$month - 1];
			$photo = $user->photo_400_orig ? $user->photo_400_orig : $user->photo_max;
			$info = [
				"user" => [
					"firstName" => $user->first_name,
					"lastName" => $user->last_name,
					"userId" => $user->id,
					"domain" => $user->screen_name,
					"sex" => $user->sex,
					"photo" => $photo
				],
				"created" => $unix,
				"interval" => time() - $unix,
				"days" => $days,
				"date" => $day . " " . $month . " " . $year,
				"time" => $hour . ":" . $minute . ":" . $second
			];
			output($info);
			break;

		case "vlad805.getRadio":
			header("Content-type: application/json; charset=utf-8");
			exit(file_get_contents("http://api.vlad805.ru/radio.get?v=2.1&count=50"));
			break;

		case "vlad805.getRadioTrack":
			header("Content-type: application/json; charset=utf-8");
			exit(file_get_contents("http://api.vlad805.ru/radio.getCurrentBroadcastingSong?v=2.0&stationId=" . $_REQUEST["stationId"]));
			break;

		case "apidog.proxy":
			$vkmethod = $_REQUEST["VKmethod"];
			$params = array_merge($_GET, $_POST);
			unset($params["method"], $params["format"], $params["command"], $params["callback"]);
			$url = "https://api.vk.com/method/" . $vkmethod;
			$post = 1;
		case "apidog.proxyData":
		//exit;
			if ($method == "apidog.proxyData") {
				$url = $_REQUEST["u"];
				$post = 0;
//				$type = array_pop(explode(".", $path));
				if ($_REQUEST["t"])
					$type = $_REQUEST["t"];

			};
			$head = [
				"png" => "image/png",
				"jpg" => "image/jpg",
				"gif" => "image/gif",
				"mp3" => "audio/mpeg"
			];

			$head = $head[$type] ? $head[$type] : "application/json; charset=utf-8";

			header("Access-Control-Allow-Origin: *");
			header("Access-Control-Allow-Credentials: true");
			header("Access-Control-Allow-Methods: HEAD, OPTIONS, GET, POST");
			header("Content-type: " . $head);

			// ereg("Content-Range: bytes ([0-9]+-[0-9]+\/[0-9]+)", $x, $range);
			// $range = $range[1];

			$curl = curl_init($url);
			if ($post) {
				curl_setopt($curl, CURLOPT_POST, $post);
				curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($params));
			};
			curl_exec($curl);
			exit;

		case "apidog.downloadAudio":

			$data = APIdog::api("audio.getById", [
				"access_token" => $_REQUEST["key"],
				"audios" => $_REQUEST["audio"]
			])->response[0];
			if (!$data)
				exit("Error");

			function nameRelacer ($s) {
				return str_replace("&amp;", "&", str_replace("&lt;", "<", str_replace("&gt;", ">", $s)));
			};

			$artist = nameRelacer($data->artist);
			$title = nameRelacer($data->title);
			$urlf = $data->url;

			$url = parse_url($urlf);
			$host = $url["host"];
			$path = $url["path"];
			$fp = stream_socket_client("$host:80", $errno, $errstr, 30); //19.05.2016
			if(!$fp) {//1905
			echo "<script>console.log( 'Error: " . $errno . " - " . $errstr . "' );</script>";
			}
			else {
			//$fp = fsockopen($host, 80, $errno, $errstr, 30);
			stream_set_blocking($fp, false); //19.05.2016
			fputs($fp, "HEAD " . $path . " HTTP/1.0\nHOST: " . $host . "\n\n");
			while (!feof($fp))
				$x .= fgets($fp, 256);
			fclose($fp);

			preg_match("Content-Length: ([0-9]+)", $x, $size);
			$size = $size[1];


			header("Content-type: audio/mpeg");
			header("Content-length: " . $size); // вес
			header("Content-Disposition: attachment; filename=\"$artist - $title.mp3\"");
			readfile($urlf);
			return;
			}
			break;

		case "apidog.getVKDevPage":
			$p = $_REQUEST["p"];
			//$remixlang



			$page = file_get_contents("http://vk.com/dev/" . $p, false, stream_context_create([
				"http" => [
					"method" => "GET",
					"header" => "Content-Type: application/x-www-form-urlencoded\r\nCookie: audio_vol=98; remixflash=17.0.0; remixscreen_depth=24; remixdt=0; audio_time_left=0; remixlang=0; remixfeed=*.*.*.*.*.*.*.*; remixrt=0; remixretina=1; remixsrt=1; remixshow_fvbar=1; remixrefkey=6dec4cd87064697ab1; remixtst=a3234fe9; remixmdevice=1440/900/1/!!!!!!!"
				]
			]));
			$page = iconv("cp1251", "utf8", $page);

			preg_match_all("/<title>(.*)<\/title>/i", $page, $title);
			$title = str_replace(" | Разработчикам | ВКонтакте", "", $title[1][0]);

			$page = explode("<div id=\"dev_page_wrap1\">", $page);
			$page = explode("<div class=\"dev_footer_wrap", $page[1]);
			$page = preg_replace("/\n\s{2,}/", "", $page[0]);
			//$page = preg_replace("/<!--.*-->/", "", $page);

			output([
				"page" => $p,
				"title" => $title,
				"html" => $page
			]);

			break;


		case "apidog.createOrder":
			require_once "zero.paid.php";

			$productId = (int) $_REQUEST["productId"];
			$product = APIdogProduct::getProductById($productId);
			$feeType = $_REQUEST["feeType"];
			$s = $product->amount;

			$fee = 0;

			switch ($feeType) {
				case "PC": $fee = $s * (0.005 / (1 + 0.005)); break;
				case "AC": $fee = $s * 0.02; break;
				case "MC": $fee = 4; break;
				default: throwError(200);
			};

			$orderId = APIdogOrder::create($product);


			output(["orderId" => $orderId, "amount" => $s + $fee, "fee" => $fee]);

			break;


		default:
			throwError(8);
	}

	function getQueryStringWithFilter ($filter, $category, $o = [])
	{
		$ext = [];

		if ($filter & 1) {
			$ext[] = "`isRead`=0";
		};

		if ($category) {
			$ext[] = "`categoryId`='$category'";
		};

		if ($filter & 2) {
			$ext[] = "`userId`='" . userId . "'";
		};

		if ($o["userId"] && !($filter & 2)) {
			$ext[] = "`userId`='" . (int) $o["userId"] . "'";
		};

		if ($o["actionId"]) {
			$t = ((int) $o["actionId"]);
			$ext[] = "`actionId` = " . $t;
		};

		if (!getAdmin(userId)) {
			$ext[] = "(`isPrivate`=0 OR `userId`='" . userId . "')";
		};

		return (sizeof($ext) > 0 ? "WHERE " . implode(" AND ", $ext) : "");
	}