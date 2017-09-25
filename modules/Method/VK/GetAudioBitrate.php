<?

	namespace Method\VK;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Tools\VKRequest;

	class GetAudioBitrate extends BaseMethod {

		/** @var string */
		protected $accessToken;

		/** @var string */
		protected $audio;

		/**
		 * GetAudioBitrate constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {

			$data = new VKRequest("audio.getById", [
				"access_token" => $this->accessToken,
				"audios" => $this->audio
			]);

			$data = $data->send();

			if (isset($data->error) || isset($data->response) && !isset($data->response[0])) {
				throw new APIdogException(ErrorCode::VK_AUDIO_BITRATE_COULD_NOT_GET_AUDIO);
			}

			$data = $data->response[0];

			/** @var int $duration */
			$duration = $data->duration;

			$url = parse_url(explode("?", $data->url)[0]);

			$host = $url["host"];
			$path = $url["path"];
			$fp = stream_socket_client($host . ":80", $errno, $errstr, 5); // 15.06.2016
			if (!$fp) {
				throw new APIdogException(ErrorCode::VK_AUDIO_BITRATE_SOCKET_ERROR);
			} else {
				stream_set_blocking($fp, false); // 19.05.2016
				fputs($fp, "HEAD " . $path . " HTTP/1.0\nUser-Agent: " . VK_SHIT_USER_AGENT ."\nHOST: " . $host . "\n\n");

				$x = "";

				while (!feof($fp)) {
					$x .= fgets($fp, 128);
				}
				fclose($fp);


				preg_match_all("/Location: ([^$]+)/", $x, $location, PREG_SET_ORDER);

				$location = isset($location[0]) ? $location[0][1] : $location;

				if ($location) {
					$host = $url["host"];
					$path = $url["path"];
					$fp = stream_socket_client($host . ":80", $errno, $errstr, 5); // 15.06.2016

					stream_set_blocking($fp, false); // 19.05.2016
					fputs($fp, "HEAD " . $path . " HTTP/1.0\nUser-Agent: " . VK_SHIT_USER_AGENT ."\nHOST: " . $host . "\n\n");

					$x = "";

					while (!feof($fp)) {
						$x .= fgets($fp, 128);
					}
					fclose($fp);
				}

				preg_match_all("/Content-Length: ([0-9]+)/", $x, $size, PREG_SET_ORDER);

				if (!sizeOf($size)) {
					throw new APIdogException(ErrorCode::VK_AUDIO_BITRATE_NOT_CONTENT_SIZE);
				}

				$size = (int) $size[0][1];

				return [
					"size" => $size,
					"bitrate" => (int) ($size / 128 / $duration)
				];
			}


		}
	}