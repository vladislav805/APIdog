<?

	namespace Method\VK;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Tools\VKRequest;

	class DownloadAudio extends BaseMethod {

		/** @var string */
		protected $token;

		/** @var int */
		protected $ownerId;

		/** @var int */
		protected $audioId;

		/**
		 * DownloadAudio constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		function run(Controller $controller, Connection $db) {

			if (!$this->token) {
				throw new APIdogException(ErrorCode::AUTH_KEY_INVALID);
			}

			$req = new VKRequest("audio.getById", [
				"access_token" => $this->token,
				"audios" => sprintf("%d_%d", $this->ownerId, $this->audioId),
				"v" => 5.63
			]);

			$data = $req->send();

			if (!isset($data->response)) {
				header("HTTP/1.1 403 Forbidden");
				throw new APIdogException(ErrorCode::VK_AUDIO_DOWNLOAD_COULD_NOT_GET_AUDIO);
			}

			$data = $data->response[0];

			if (isset($data->content_restricted)) {
				throw new APIdogException(ErrorCode::VK_AUDIO_DOWNLOAD_CONTENT_RESTRICTED);
			}

			$directURL = $data->url;

			$parsedURL = parse_url($directURL);

			$host = $parsedURL["host"];
			$path = $parsedURL["path"];

			$fp = stream_socket_client($host . ":80", $errno, $errStr, 7);
			if ($fp) {
				stream_set_blocking($fp, false);
				fputs($fp, "HEAD " . $path . " HTTP/1.0\nHOST: " . $host . "\n\n");
				$x = "";
				while (!feof($fp)) {
					$x .= fgets($fp, 1024);
				}
				fclose($fp);

				preg_match("/Content-Length: ([0-9]+)/i", $x, $size);
				$size = $size[1];

				header("Content-type: audio/mpeg");
				header("Content-length: " . $size); // вес
				header(sprintf("Content-Disposition: attachment; filename=\"%d %d.mp3\"", $this->ownerId, $this->audioId));
				readfile($directURL);
				exit;
			}

		}
	}