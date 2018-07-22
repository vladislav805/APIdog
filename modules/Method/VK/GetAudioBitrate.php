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
				"audios" => $this->audio,
				"v" => 5.67
			]);

			$data = $data->send();

			if (isset($data->error) || isset($data->response) && !isset($data->response[0])) {
				throw new APIdogException(ErrorCode::VK_AUDIO_BITRATE_COULD_NOT_GET_AUDIO);
			}

			$data = $data->response[0];

			/** @var int $duration */
			$duration = $data->duration;

			if (!$data->url) {
				throw new APIdogException(ErrorCode::VK_AUDIO_BITRATE_NOT_URL);
			}

			$ch = curl_init($data->url);

			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_HEADER, 1);
			curl_setopt($ch, CURLOPT_NOBODY, 1);
			curl_setopt($ch, CURLOPT_USERAGENT, VK_SHIT_USER_AGENT);
			curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 3);

			$output = curl_exec($ch);

			curl_close($ch);

			$headers = [];
			$data = explode("\n", $output);
			$headers["status"] = trim(array_shift($data));

			foreach ($data as $row) {
				$middle = explode(":", $row);
				if (sizeOf($middle) === 2) {
					$headers[trim($middle[0])] = trim($middle[1]);
				}
			}

			$size = (int) $headers["Content-Length"];


			if (!$size) {
				throw new APIdogException(ErrorCode::VK_AUDIO_BITRATE_NOT_CONTENT_SIZE);
			}

			return [
				"size" => $size,
				"bitrate" => (int) ($size * 8 / $duration / 1000)
			];
		}
	}