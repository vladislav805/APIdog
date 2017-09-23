<?

	namespace Method\VK;

	use APIdogException;
	use CURLFile;
	use ErrorCode;
	use stdClass;
	use Tools\VKRequest;

	class UploadTask {

		/** @var string */
		private $target;

		/** @var string */
		private $file;

		/** @var string */
		private $method;

		/** @var array */
		private $params;

		/** @var string */
		private $server;

		/** @var array */
		private $result;

		/**
		 * Get constructor.
		 * @param string $file
		 * @param string $target
		 * @throws APIdogException
		 */
		public function __construct($file, $target) {
			$this->file = $file;
			$this->target = $target;

			$this->initialize();
		}

		/**
		 * @return mixed
		 * @throws APIdogException
		 */
		public function initialize() {
			if (!$this->file) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_NO_FILE);
			}

			if (!file_exists($this->file)) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_FILE_NOT_EXIST);
			}

			if (fileSize($this->file) > VK_LIMIT_UPLOAD) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_FILE_TOO_LARGE);
			}

			$this->parseTarget();

			return $this;
		}

		private function parseTarget() {
			$d = json_decode($this->target);

			if (!$d) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_INVALID_TARGET);
			}

			$this->method = $d->method;
			$this->params = (array) $d->params;
		}

		/**
		 * @param string $method
		 * @return array|null
		 */
		private static function getUploadParamsData($method) {
			$d = [
				"photos.getUploadServer"			=> ["param" => "file1","name" => "p.jpg",  "method" => "photos.save", "parser" => "photo"],
				"photos.getWallUploadServer"		=> ["param" => "photo",	"name" => "p.jpg", "method" => "photos.saveWallPhoto", "parser" => "photo"],
				"photos.getChatUploadServer"		=> ["param" => "photo",	"name" => "p.jpg", "method" => "messages.setChatPhoto", "parser" => "photo"],
				"photos.getMessagesUploadServer"	=> ["param" => "photo",	"name" => "p.jpg", "method" => "photos.saveMessagesPhoto", "parser" => "photo"],
				"photos.getOwnerPhotoUploadServer"	=> ["param" => "photo",	"name" => "p.jpg", "method" => "photos.saveOwnerPhoto", "parser" => "photoProfile"],
				"video.save"						=> ["param" => "file",	"name" => "v.mp4", "parser" => "video"],
				"audio.getUploadServer"				=> ["param" => "file",	"name" => "a.mp3", "method" => "audio.save", "parser" => "audio"],
				"docs.getUploadServer"				=> ["param" => "file",	"name" => null,    "method" => "docs.save", "parser" => "document"],
				"docs.getWallUploadServer"			=> ["param" => "file",	"name" => null,    "method" => "docs.save", "parser" => "document"],
				"chronicle.getUploadServer"			=> ["param" => "photo",	"name" => "p.jpg", "method" => "chronicle.save", "parser" => "photo"]
			];

			return isset($d[$method]) ? $d[$method] : null;
		}

		/**
		 * @return boolean
		 * @throws APIdogException
		 */
		public function getServer() {
			$server = new VKRequest($this->method, $this->params);

			$res = $server->send();

			if (isset($res->error)) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_GET_SERVER_FAILURE, $res->error);
			}

			$this->server = $res->response->upload_url;
			return true;
		}

		/**
		 * @param string|boolean $filename
		 * @return boolean
		 * @throws APIdogException
		 */
		public function upload($filename = false) {
			$p = $this->getUploadParamsData($this->method);

			if ($p["name"] !== null) {
				$filename = $p["name"];
			}

			$ch = curl_init($this->server);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_TIMEOUT, 10);
			curl_setopt($ch, CURLOPT_POSTFIELDS, [
				$p["param"] => new CurlFile($this->file, "file/exgpd", $filename)
			]);
			curl_setopt($ch, CURLOPT_INFILESIZE, fileSize($this->file));

			$this->result = json_decode(curl_exec($ch), true);

			if (!$this->result && curl_error($ch)) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_FILE_SENT_FAILURE);
			}

			if (isset($this->result["error"]) && $this->result["error"] === "unknown error") {
				throw new APIdogException(ErrorCode::VK_UPLOAD_FILE_UNSUPPORTED_TYPE_FORMAT);
			}

			curl_close($ch);

			return true;
		}

		/**
		 * @return $this|mixed|stdClass
		 * @throws APIdogException
		 */
		public function save() {
			$p = $this->getUploadParamsData($this->method);

			if (isset($this->params["user_id"]) && !isset($this->result["user_id"])) {
				$this->result["user_id"] = $this->params["user_id"];
			}

			if (isset($this->params["group_id"]) && !isset($this->result["group_id"])) {
				$this->result["group_id"] = $this->params["group_id"];
			}

			$this->result["access_token"] = $this->params["access_token"];

			$saver = new VKRequest($p["method"], $this->result);

			$response = $saver->send();

			if (isset($response->error) || !isset($response->response)) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_SAVE_FAILED, $response->error);
			}

			$response = $response->response;

			// Sometimes preserving the API method returns an array with one element,
			// even if provided with only one file. To fix this, add this bike and
			// check whether the response element zero of the array.
			if (is_array($response) && isset($response[0])) {
				$response = $response[0];
			}

			if (isset($p["parser"])) {
				$response = $this->{$p["parser"]}($response);
			}

			return $response;
		}

		public static function photo($p) {
			return [
				"type" => "photo",
				"id" => $p->pid,
				"owner_id" => $p->owner_id,
				"date" => $p->created,
				"photo_75" => $p->src_small,
				"photo_130" => $p->src,
				"photo_604" => $p->src_big,
				"photo_807" => isset($p->src_xbig) ? $p->src_xbig : null,
				"photo_1280" => isset($p->src_xxbig) ? $p->src_xxbig : null,
				"photo_2560" => isset($p->src_xxxbig) ? $p->src_xxxbig : null,
				"width" => $p->width,
				"height" => $p->height,
				"album_id" => $p->aid
			];
		}

		/*\
        |*| разница между photo и photoProfile есть: эти идиоты не изменили формат фотографии даже при v=5.x
		\*/
		public static function photoProfile($p) {
			return [
				"type" => "photo",
				"owner_id" => null, // TODO: insert here current user id
				"date" => time(),
				"photo_75" => $p->photo_src_small,
				"photo_130" => $p->photo_src,
				"photo_604" => $p->photo_src_big,
				"photo_807" => isset($p->photo_src_xbig) ? $p->photo_src_xbig : null,
				"photo_1280" => isset($p->photo_src_xxbig) ? $p->photo_src_xxbig : null,
				"photo_2560" => isset($p->photo_src_xxxbig) ? $p->photo_src_xxxbig : null,
				"user_id" => null, // TODO: insert here current user id
				"album_id" => -6,
				"post_id" => $p->post_id
			];
		}

		public static function audio($a) {
			return [
				"type" => "audio",
				"id" => $a->aid,
				"owner_id" => $a->owner_id,
				"title" => $a->title,
				"artist" => $a->artist,
				"duration" => (int) $a->duration,
				"url" => $a->url,
				"no_search" => (int) $a->no_search,
				"genre_id" => $a->genre_id
			];
		}

		public static function document($d) {
			return [
				"type" => "doc",
				"id" => $d->did,
				"owner_id" => $d->owner_id,
				"title" => $d->title,
				"size" => $d->size,
				"ext" => $d->ext,
				"url" => $d->url,
				"date" => time(),
				"photo_100" => isset($d->thumb_s) ? $d->thumb_s : null,
				"photo_130" => isset($d->thumb) ? $d->thumb : null
			];
		}

	}