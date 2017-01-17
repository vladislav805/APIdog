<?

	/****************
	 * APIdog APIv2 *
	 ****************
	 *  14.03.2015  *
	 ****************/

	// ban for themes.*: 315482675

	/**
	 * Возвращает номер агента поддержки по VK ID
	 * @param  int $userId Идентификатор пользователя
	 * @return int         Номер агента или false
	 */
	function getAdmin ($userId = userId) {
		global $ssAdmins;
		return $ssAdmins[$userId] ?? false;
	};


	define("KB", 1024);
	define("MB", 1024 * 1024);
	define("GB", 1024 * 1024 * 1024);




	class APIdog {

		/**
		 * @deprecated
		 * @return MySQLi
		 */
		static function connect() { return getDatabase(); }

		/**
		 * @deprecated
		 * @return Mixed
		 */
		static function mysql($query, $type = 0) {
			$type = [
				1 => SQL_RESULT_ITEM,
				2 => SQL_RESULT_ITEMS,
				3 => SQL_RESULT_COUNT,
				4 => SQL_RESULT_INSERTED,
				5 => SQL_RESULT_AFFECTED,
				0 => 0
			][$type];

			return SQLquery($query, $type);
		}

		/**
		 * API VK request
		 * @param  String  $method             Метод
		 * @param  Object  $params             Параметры
		 * @param  boolean $withoutAccessToken Отправить запрос без токена
		 * @return Object                      Ответ от ВК
		 */
		static function api($method, $params, $withoutAccessToken = false) {
			if (!isset($params)) {
				$params = [];
			};

			if (!$params["v"]) {
				$params["v"] = 4.99;
			};

			if ($token = getAccessToken() && !$params["access_token"] && !$withoutAccessToken) {
				$params["access_token"] = $token;
			};

			$params["timestamp"] = time();
			$params["lang"] = "ru";

			$curl = curl_init("https://api.vk.com/method/" . $method);
			curl_setopt($curl, CURLOPT_POST, 1);
			curl_setopt($curl, CURLOPT_POSTFIELDS, $params);
			curl_setopt($curl, CURLOPT_TIMEOUT, 10);
			curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
			$json = json_decode(curl_exec($curl));
			curl_close($curl);
			return $json;
		}


		/**
		 * Загрузка изображения на ipic.su
		 * @param  String $file Путь к изображению
		 * @return Object
		 */
		static function uploadImage ($file) {
			$sizes = getImageSize($file);
			$size = fileSize($file);
			$ch = curl_init("http://ipic.su/api/index.php");
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_POST, true);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
			curl_setopt($ch, CURLOPT_INFILESIZE, $size);
			curl_setopt($ch, CURLOPT_POSTFIELDS, [
				"image" => new CurlFile($file, "file/exgpd", "usrapdg" . time() . ".jpg"),
				"action" => "loadimg",
				"quality" => 100
			]);
			$result = curl_exec($ch);
			unlink($file);
			curl_close($ch);
			return [
				"width" => $sizes[0],
				"height" => $sizes[1],
				"url" => $result ? "//ipic.su/img/fs/" . $result : false,
				"size" => $size
			];
		}

		/**
		 * Создание рандомной строки
		 * @deprecated
		 * @param  int $length Длина требуемой строки
		 * @return string      Строка
		 */
		static function getHash($length = 32) {
			$symbols = "0123456789abcdef";
			$l = strlen($symbols) - 1;
			$hash = "";
			for ($i = 0; $i < $length; ++$i) {
				$hash .= $symbols[rand(0, $l)];
			};
			return $hash;
		}

		/**
		 * Проверка на то, что в строке находится ссылка
		 * @param  string  $url Строка
		 * @return boolean      true, если ссылка
		 */
		static function isURL($url) {
			return (boolean) preg_match("/^((https?|ftp|market):\/\/)?([A-Za-z0-9А-Яа-яЁё-]{1,64}\.)+([A-Za-zА-Яа-я]{2,6})\/?(.*)$/iu", $url);
		}

		/**
		 * Минификация JS
		 * @return array Результат
		 */
		static function rebuildJS() {
			$url = "http://closure-compiler.appspot.com/compile";

			$files = [];
			$dir = scandir("js/");

			foreach ($dir as $file){
				if (strPos($file, "js")) {
					$files[] = file_get_contents("./js/" . $file);
				};
			};

			$fileTemp = "default.temp.js";
			$fileTarget = "default.min.js";

			file_put_contents($fileTemp, join("\n", $files));

			$js = curl($url, "output_format=json&output_info=compiled_code&output_info=warnings&output_info=errors&output_info=statistics&compilation_level=SIMPLE_OPTIMIZATIONS&warning_level=default&language=ECMASCRIPT5&output_file_name=default.min.js&code_url=http%3A%2F%2Fapidog.ru%2Flib1.3.0.js&code_url=http%3A%2F%2Fapidog.ru%2F6.5%2F" . $fileTemp . "&code_url=http%3A%2F%2Fapidog.ru%2F6.5%2Fhammer.js&code_url=http%3A%2F%2Fstatic.apidog.ru%2Fexternal.min.js&js_code=");

			$result = json_decode($js);
			$code = $result->compiledCode;

			if (sizeof($result->errors) || !$code) {
				$errors = [];
				foreach ($result->errors as $i => $error) {
					$errors[] = [
						"type" => $error->type,
						"message" => $error->error,
						"line" => $error->lineno,
						"col" => $error->charno
					];
				};
				throwError(502, [ "errors" => $errors ]);
			};

			file_put_contents($fileTarget, $code);

			$s = $result->statistics;

			return [
				"result" => true,
				"stats" => [
					"original" => [
						"normal" => $s->originalSize,
						"gzip" => $s->originalGzipSize
					],
					"compressed" => [
						"normal" => $s->compressedSize,
						"gzip" => $s->compressedGzipSize
					]
				]
			];
		}
	};

	/**
	 * Настройки
	 */
	class Settings {
		public $bitmask;

		/**
		 * Получить настройки пользователя по его ID
		 * @param  int $userId Идентификатор пользователя
		 * @return array       Битовая маска настроек и язык
		 */
		static function getBitmask($userId) {
			return SQLquery("SELECT `bitmask`,`lang` FROM `settings` WHERE `userId` = '" . $userId . "' LIMIT 1", SQL_RESULT_ITEM);
		}

		/**
		 * Получить открытые сессии пользователя на сайте
		 * @return array Массив сессий
		 */
		static function getSessions() {
			$list = SQLquery("SELECT * FROM `auth` WHERE `user_id` = '" . userId . "' ORDER BY `date` DESC", SQL_RESULT_ITEMS);

			foreach ($list as $i => $session) {
				$list[$i] = new AuthSession($session);
			};

			return [
				"count" => sizeof($list),
				"items" => $list
			];
		}

		/**
		 * Получить сессию по идентификатору авторизации
		 * @deprecated
		 * @param  int $authId Идентификатор авторизации
		 * @return AuthSession Сессия
		 */
		static function getSessionById($authId) {
			return APIdogSession::getByAuthKey();
		}
	};


	/**
	 * Вывод данных в формате JSON
	 * @param  mixed $data Данные
	 */
	function output($data) {
		$callback = $_REQUEST["callback"];
		$json = json_encode(["response" => $data], JSON_UNESCAPED_UNICODE);
		header("Content-type: " . ($callback ? "text/javascript" : "application/json") . "; charset=utf-8");
		$data = ($callback ? $callback . "(" : "") . $json . ($callback ? ");" : "");
		header("Content-Length: " . mb_strlen($data));
		print $data;

		exit;
	};

	/**
	 * Вывод ошибки о том, что метод отключен
	 */
	function sendDeprecated() { return throwError(101); };

	/**
	 * Подключает модуль
	 * @deprecated
	 */
	function requireModule ($name) { include_once "./" . $name . "-engine.php"; };

	/**
	 * Проверяет, находится ли число $n в пределах [$min, $max]
	 */
	function toRange ($min, $n, $max) { return min($max, max($n, $min)); };


	class Blog {
		public $db;
		public function __construct() { }

		/**
		 * Возвращает записи из блога
		 * @param  int $offset Сдвиг выборки
		 * @return array       Массив с count и items
		 */
		public function getTimeline($offset = 0) {
			$offset = (int) $offset;
			$items = SQLquery("SELECT * FROM `blog` ORDER BY `postId` DESC LIMIT $offset,30", SQL_RESULT_ITEMS);
			$items = $items ? $items : [];
			return ["count" => sizeOf($items), "items" => $items];
		}

		/**
		 * Добавление записи в блог
		 * @param string $title   Заголовок
		 * @param string $text    Текст
		 * @param int    $adminId ID пользователя
		 */
		public function addPost($title, $text, $adminId) {
			$id = SQLquery("INSERT INTO `blog` (`date`, `title`, `text`, `adminId`) VALUES ('". time(). "','". escape($title) . "','" . escape($text) . "','" . ((int) $adminId) . "'", SQL_RESULT_INSERTED);

			return $id;
		}

		/*public function editPost ($postId, $title, $text) {
			return $this->db->update()->table("blog")->set([
				"title" => $title,
				"text" => $text
			])->where(["postId", $postId])->execute();
		}*/

		/**
		 * Удаление записи из блога
		 * @param  int $postId Идентификатор поста
		 */
		public function deletePost($postId) {
			return SQLquery("DELETE FROM `blog` WHERE `postId`='" . ((int) $postId) . "' LIMIT 1");
		}

		/**
		 * Возвращает пост из блога по идентификатору
		 * @param  int  $postId Идентификатор поста
		 * @return array        Пост
		 */
		public function getPost($postId) {
			$post = SQLquery("SELECT * FROM `blog` WHERE `postId` = '" . ((int) $postId) . "' LIMIT 1", SQL_RESULT_ITEM);

			if ($post) {
				$post["views"] = $this->viewPost($postId);
			};

			return $post ? ["post" => $post] : null;
		}


		private function viewPost($postId) {
			$postId = (int) $postId;
			SQLquery("INSERT INTO `blogViews` (`postId`, `userId`) VALUES ('" . $postId . "', '" . userId . "')", 0);
			$count = SQLquery("SELECT COUNT(*) FROM `blogViews` WHERE `postId`='" . $postId . "' LIMIT 1", SQL_RESULT_COUNT);

			return $count;
		}
	};
