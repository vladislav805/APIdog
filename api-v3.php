<?

	/**********************
	 * APIdog             *
	 *         Backend v3 *
	 **********************
	 *     18.07.2017     *
	 **********************/

	require_once "conf.php";
	require_once "functions.php";

	header("Access-Control-Allow-Origin: *");
	header("Access-Control-Allow-Credentials: true");
	header("Access-Control-Allow-Methods: HEAD, OPTIONS, GET, POST");
	header("Access-Control-Allow-Headers: Content-Type, User-Agent, X-Requested-With, If-Modified-Since, Cache-Control");

	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);

	$method = get("method");


	safeString($method);

	$db = new Connection(dbh, dbu, dbp, dbd); // TODO: add port
	$main = new Controller($db);

	if (get(KEY_AUTH_KEY)) {
		$main->init(get(KEY_ACCESS_TOKEN), get(KEY_AUTH_KEY), "");
	}

	/** @noinspection SpellCheckingInspection */
	$methods = [

		"authorize.do" => "\Method\Authorize\Login",

		"internal.collectError" => "\Method\Internal\CollectError",

		"user.getSettings" => "\Method\Settings\Get",
		"user.saveSettings" => "\Method\Settings\Set",
		"user.getSessions" => "\Method\Session\Get",
		"user.killSession" => "\Method\Session\Kill",

		"themes.getList" => "\Method\Theme\GetList",
		"themes.apply" => "\Method\Theme\Apply",
		"themes.getUsers" => "\Method\Theme\GetUsers",
		"themes.recount" => "\Method\Theme\Recount",
		"themes.report" => null,
		"themes.setRate" => null,
		"themes.create" => "\Method\Theme\Add",
		"themes.edit" => "\Method\Theme\Edit",
		"themes.remove" => "\Method\Theme\Remove",

		"vk.upload" => "\Method\VK\UploadByFile",
		"vk.uploadByLink" => "\Method\VK\UploadByLink",
		"vk.getAudioBitrate" => "\Method\VK\GetAudioBitrate",
		"vk.getUserDateRegistration" => "\Method\VK\GetUserDateRegistration",
		"vk.fetchDocumentation" => "\Method\VK\FetchDocumentation",

		"internal.updateLangPack" => "\Method\Internal\UpdateLangPack",

		"app.fixAudio" => "\Method\VK\FixAudio",

		"app.test" => "\Method\Internal\Test"

	];


	$action = isset($methods[$method]) ? $methods[$method] : null;

	try {
		if ($action) {
			output($main->perform(new $action($_REQUEST)));
		} else {
			throw new APIdogException(ErrorCode::UNKNOWN_METHOD);
		}
	} catch (APIdogVKException $e) {
		output($e, "error");
	} catch (APIdogException $e) {
		output($e, "error");
	} catch (Exception $e) {
		var_dump($e);
	} finally {
		exit;
	}




/*
		case "apidog.downloadAudio":

			$params = http_build_query([
				"access_token" => $_REQUEST["key"],
				"audios" => $_REQUEST["audio"],
				"v" => 4.99
			]);
			$c = curl_init("https://api.vk.com/method/audio.getById?" . $params);
			curl_setopt($c, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($c, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($c, CURLOPT_SSL_VERIFYHOST, false);
			curl_setopt($c, CURLOPT_TIMEOUT, 5);
			curl_setopt($c, CURLOPT_USERAGENT, VK_SHIT_USER_AGENT);
			$data = json_decode(curl_exec($c));
//			var_dump(curl_error($c));
			curl_close($c);


			if (!isset($data->response)) {
				print "<pre>Error:\n\n";
				var_dump($data);
				exit("Error");
			};

			$data = $data->response[0];

			if (isset($data->content_restricted)) {
				printf("К сожалению, аудиозапись <strong>%s</strong> &mdash; %s скачать нельзя (content_restricted).", $data->artist, $data->title);
				exit;
			};

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
			if (!$fp) {//1905
				echo "<script>console.log( 'Error: " . $errno . " - " . $errstr . "' );</script>";
			} else {
				//$fp = fsockopen($host, 80, $errno, $errstr, 30);
				stream_set_blocking($fp, false); //19.05.2016
				fputs($fp, "HEAD " . $path . " HTTP/1.0\nHOST: " . $host . "\n\n");
				while (!feof($fp)) {
					$x .= fgets($fp, 256);
				};
				fclose($fp);

				preg_match("/Content-Length: ([0-9]+)/i", $x, $size);
				$size = $size[1];

				header("Content-type: audio/mpeg");
				header("Content-length: " . $size); // вес
				header("Content-Disposition: attachment; filename=\"$artist - $title.mp3\"");
				readfile($urlf);
				exit;
			}
			break;

*/