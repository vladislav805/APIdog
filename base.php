<?php
	/*************************
	 *                       *
	 *    DEPRECATED CODE    *
	 *                       *
	 *************************/

	/* ------------------------------ *
	 * APIdog.ru                      *
	 * version 6.4.6                  *
	 * Copyright (c) 2012-2017        *
	 * ------------------------------ *
	 * Vladislav Veluga (c) 2009-2017 *
	 * ------------------------------ *
	 * 23 may 2013                    *
	 * ------------------------------ *
	 */

	if (!$_REQUEST["act"])
		header("X-Frame-Options: SAMEORIGIN");



    date_default_timezone_set("Etc/GMT+3");



	$l10n = [
		"ru" => [
			"mail" => "Сообщения",
			"friends" => "Друзья",
			"feed" => "Новости",
			"notifications" => "Ответы",
			"photos" => "Фотографии",
			"groups" => "Группы",
			"videos" => "Видеозаписи",
			"audios" => "Аудиозаписи",
			"docs" => "Документы",
			"faves" => "Закладки",
			"questions" => "Вопросы",
			"offers" => "Предложения",
			"search" => "Поиск",
			"settings" => "Настройки",
			"support" => "Поддержка",
			"pro" => "Платные услуги",
			"donate" => "Пожертвования",
			"logout" => "Выход",
			"ads_title" => "Объявления",
			"gotomvkcom" => "Перейти на m.vk.com",
			"wait" => "Пожалуйста, подождите...",
			"longwait" => "Долгая загрузка?",
			"waitvars" => "Варианты решения этой проблемы",
			"loaddata" => "Загрузка данных.."
		],
		"ua" => [
			"mail" => "Повідомлення",
			"friends" => "Друзі",
			"feed" => "Новини",
			"notifications" => "Відповіді",
			"photos" => "Фотографії",
			"groups" => "Спільноти",
			"videos" => "Відеозаписи",
			"audios" => "Аудіозаписи",
			"docs" => "Документи",
			"faves" => "Закладки",
			"search" => "Пошук",
			"settings" => "Налаштування",
			"questions" => "Запитання",
			"offers" => "Пропозиції",
			"support" => "Підтримка",
			"pro" => "Платні послуги",
			"donate" => "Пожертви",
			"logout" => "Вихід",
			"ads_title" => "Оголошення",
			"gotomvkcom" => "Перейти на m.vk.com",
			"wait" => "Будь-ласка, зачекайте...",
			"longwait" => "Довго завантажується?",
			"waitvars" => "Варіанти вирішення цієї проблеми",
			"loaddata" => "Завантаження даних.."
		],
		"en" => [
			"mail" => "Messages",
			"friends" => "Friends",
			"feed" => "Feed",
			"notifications" => "Notifications",
			"photos" => "Photos",
			"groups" => "Groups",
			"videos" => "Videos",
			"audios" => "Audios",
			"docs" => "Documents",
			"faves" => "Faves",
			"questions" => "Questions",
			"offers" => "Offers",
			"search" => "Search",
			"settings" => "Settings",
			"support" => "Support",
			"pro" => "Paid services",
			"donate" => "Donate",
			"logout" => "Logout",
			"ads_title" => "Our ads",
			"gotomvkcom" => "Go to m.vk.com",
			"wait" => "Please, wait...",
			"longwait" => "Long loading?",
			"waitvars" => "Solutions to this problem",
			"loaddata" => "Loading data.."
		],
		"gop" => [
			"mail" => "Базары",
			"friends" => "Кореша",
			"feed" => "Падик",
			"notifications" => "Крики тусовки",
			"photos" => "Фотки",
			"groups" => "Тусовки",
			"videos" => "Порнуха",
			"audios" => "Музон",
			"docs" => "Каракули",
			"faves" => "Своё",
			"questions" => "Доёбы",
			"offers" => "???",
			"search" => "Яндекс",
			"settings" => "Стройка",
			"support" => "Раковник",
			"donate" => "Попрошайки",
			"logout" => "Слиться",
			"ads_title" => "Рекламки в падике",
			"wait" => "Please, wait...",
			"loaddata" => "Гружу хуйню.."
		]
	];

	class APIdog {

		var $user_id;

		function __construct($userId) {
			$this->user_id = $userId;
			!defined("userId") && define("userId", $userId);
		}

		static function connect() {
			return new mysqli(dbh, dbu, dbp, dbd, dbr);
		}

		static function mysql($query, $type = 0) {
			$bd = mysqli_connect(dbh, dbu, dbp, dbd, dbr);
			mysqli_query($bd, "SET NAMES utf8");
			$response = @mysqli_query($bd, $query);
//echo mysqli_error($bd);
			switch ($type) {
				case 1:
					return @mysqli_fetch_assoc($response);
					break;
				case 2:
					$data = [];
					while ($item = @mysqli_fetch_assoc($response)) {
						$data[] = $item;
					}

					return $data;
					break;
				case 3:
					return (int)mysqli_fetch_array($response)["COUNT(*)"];
					break;
				case 4:
					return (int)mysqli_insert_id($bd);
					break;
				case 5:
					return (int)mysqli_affected_rows($bd);
					break;
				default:
					return $response;
			}
		}





	}

	class VKv5 {
		static function photo ($p) {
			return [
				"type" => "photo",
				"id" => $p["pid"],
				"owner_id" => $p["owner_id"],
				"date" => $p["created"],
				"photo_75" => $p["src_small"],
				"photo_130" => $p["src"],
				"photo_604" => $p["src_big"],
				"photo_807" => $p["src_xbig"],
				"photo_1280" => $p["src_xxbig"],
				"photo_2560" => $p["src_xxxbig"],
				"width" => $p["width"],
				"height" => $p["height"],
				"user_id" => $p["uid"],
				"album_id" => $p["aid"]
			];
		}
		/*\
        |*| разница между photo и photoProfile есть: эти идиоты не изменили формат фотографии даже при v=5.x
		\*/
		static function photoProfile ($p) {
			return [
				"type" => "photo",
				"owner_id" => userId,
				"date" => time(),
				"photo_75" => $p["photo_src_small"],
				"photo_130" => $p["photo_src"],
				"photo_604" => $p["photo_src_big"],
				"photo_807" => $p["photo_src_xbig"],
				"photo_1280" => $p["photo_src_xxbig"],
				"photo_2560" => $p["photo_src_xxxbig"],
				"user_id" => userId,
				"album_id" => -6,
				"post_id" => $p["post_id"]

			];
		}
		static function audio ($a) {
			return [
				"type" => "audio",
				"id" => $a["aid"],
				"owner_id" => $a["owner_id"],
				"title" => $a["title"],
				"artist" => $a["artist"],
				"duration" => (int) $a["duration"],
				"url" => $a["url"],
				"no_search" => (int) $a["no_search"],
				"genre_id" => $a["genre_id"]
			];
		}
		static function doc ($d) {
			return [
				"type" => "doc",
				"id" => $d["did"],
				"owner_id" => $d["owner_id"],
				"title" => $d["title"],
				"size" => $d["size"],
				"ext" => $d["ext"],
				"url" => $d["url"],
				"photo_100" => $d["thumb_s"],
				"photo_130" => $d["thumb"]
			];
		}
	}

	class Ads {
		public $data;

		public function __construct () {

		}
		private function parse ($data = false) {
			if (!$data)
				$data = [];
			foreach ($data as $i => $item) {
				$data[$i] = new Ad($item);
			}
			return $data;
		}
		public function getById ($id) {
			$id = (int) $id;
			return new Ad(APIdog::mysql("SELECT * FROM `ads` WHERE `id`='$id' LIMIT 1", 1));
		}
		public function getAvailable ($count = 2, $needShuffle = true, $offset = 0) {
			$available = [];
			$current = time();

			$available = $this->parse(APIdog::mysql("SELECT * FROM `ads` WHERE `active` = 1 AND `type` IN (1,2) AND `dateStart` < $current AND `dateEnd` > $current", 2));

			if ($needShuffle) {
				shuffle($available);
			};

			return [
				"menu" => array_slice($available, $offset, $count),
				"feed" => $this->parse(APIdog::mysql("SELECT * FROM `ads` WHERE `active` = 1 AND `type` IN (10) AND `dateStart` < $current AND `dateEnd` > $current", 2))
			];
		}
		public function get ($count = 20, $offset = 0) {
			$offset = (int) $offset;
			$count = (int) $count;
			return $this->parse(APIdog::mysql("SELECT * FROM `ads` LIMIT $offset,$count", 2));
		}
		public function add ($params) {

			$active = 1;
			$type = (int) $params["type"];
			$title = mysql_escape_string($params["title"]);
			$description = mysql_escape_string($params["description"]);
			$link = mysql_escape_string($params["link"]);
			$image = mysql_escape_string($params["image"]);
			$ownerId = (int) $params["ownerId"];
			$dateStart = (int) $params["dateStart"];
			$dateEnd = (int) $params["dateEnd"];


			$test = APIdog::mysql(
				"INSERT INTO `ads` (`type`, `active`, `link`, `image`, `title`, `description`, `ownerId`, `dateStart`, `dateEnd` ) VALUES ( $type, $active, '$link', '$images', '$title', '$description', $ownerId, $dateStart, $dateEnd )", 4);
			return $test;
		}
		public function delete ($id) {
			$id = (int) $id;
			$ad = $this->getById($id);
			if (!$ad || $ad->ownerId)
				return -46;
			return APIdog::mysql("DELETE FROM `ads` WHERE `id`='$id' LIMIT 1", 5);
		}
		public function set ($id, $ad) {
			foreach ($this->data as $i => $item) {
				if ($item->id == $id) {
					$this->data[$i] = $ad;
					break;
				}
			}
		}
		public function click ($id) {
			$id = (int) $id;
			return APIdog::mysql("UPDATE `ads` SET `clicks` = (`clicks` + 1) WHERE `id` = $id", 4);
		}
		public function view ($id) {
			$id = (int) $id;
			return APIdog::mysql("UPDATE `ads` SET `views` = (`views` + 1) WHERE `id` = " . $id, 4);
		}
		static function views ($ids) {

			$ids = array_map("intval", $ids);
			if (!sizeOf($ids))
				return;
			APIdog::mysql("UPDATE `ads` SET `views` = (`views` + 1) WHERE `id` IN (" . join(",", $ids) . ")", 4);
		}
		public function save () {
			return $s;
		}
		static function getHTMLCode ($count = 2) {
			$ads = new Ads();
			$data = $ads->getAvailable($count);
			$html = [];
			foreach ($data as $ad)
				$html[] = $ad->getHTMLCode();
			return join("\n", $html);
		}
		static function getWeb ($count = 2) {
			$ads = new Ads();
			$data = $ads->getAvailable($count);
			$ids = [];
			foreach ($data as $key => $list) {
				foreach ($list as $i => $a) {
					$ids[] = $a->id;
					$data[$key][$i] = [
						"adId" => $a->id,
						"adLink" => "//apidog.ru/ads.php?adId=" . $a->id,
						"adImage" => "//static.apidog.ru/images/a/" . $a->image,
						"title" => $a->title,
						"description" => $a->description,
						"type" => $a->type
					];
				};
			};
			Ads::views($ids);
			return $data;
		}
	}
