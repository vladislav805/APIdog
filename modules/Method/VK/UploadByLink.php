<?

	namespace Method\VK;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;

	class UploadByLink extends BaseMethod {

		/** @var string */
		protected $target;

		/** @var string */
		protected $link;

		/** @var string */
		private $localFile;

		/**
		 * Get constructor.
		 * @param array $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 *
		 */
		public function __destruct() {
			file_exists($this->localFile) && unlink($this->localFile);
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {

			$this->localFile = "tmp/" . $controller->getSession()->getUserId() . "_" . time() . ".jpg";

			if (!$this->isValidURL()) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_LINK_INCORRECT);
			}

			$name = $this->getLocalName($this->link);
			$this->download($this->localFile);

			$task = new UploadTask($this->localFile, $this->target);
			$task->getServer();
			$task->upload($name);

			$result = $task->save();

			return $result;
		}

		/**
		 * @param string $str
		 * @return string
		 */
		private function getLocalName($str) {
			$path = parse_url($str, PHP_URL_PATH);
			return basename($path);
		}

		/**
		 * @param string $file
		 * @throws APIdogException
		 */
		private function download($file) {
			$fp = fopen($file, "w+");

			if (!$fp) {
				throw new APIdogException(ErrorCode::VK_UPLOAD_INTERNAL_ERROR);
			}

			$ch = curl_init($this->link);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_TIMEOUT, 7);
			curl_setopt($ch, CURLOPT_FILE, $fp);

			$contents = curl_exec($ch);

			$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

			try {
				if ($httpCode === 200) {
					if (!curl_error($ch)) {
						fwrite($fp, $contents);
					} else {
						throw new APIdogException(ErrorCode::VK_UPLOAD_LINK_BROKEN_ERROR);
					}
				} else {
					throw new APIdogException(ErrorCode::VK_UPLOAD_LINK_BROKEN_CODE);
				}
			} finally {
				fclose($fp);
				curl_close($ch);
			}
		}

		/**
		 * @return boolean
		 */
		private function isValidURL() {
			return (boolean) preg_match("/^((https?|ftp|market):\/\/)?([A-Za-z0-9А-Яа-яЁё-]{1,64}\.)+([A-Za-zА-Яа-я]{2,6})\/?(.*)$/iu", $this->link);
		}

	}