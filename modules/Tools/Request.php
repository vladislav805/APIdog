<?

	namespace Tools;

	class Request {

		/** @var resource */
		private $mCurl;

		/** @var string */
		private $mUrl;

		/** @var string */
		private $userAgent = "";

		/** @var boolean */
		private $isPost = false;

		/** @var array */
		private $post = [];

		/** @var mixed */
		private $result;

		/**
		 * Request constructor.
		 * @param string $url
		 * @param boolean $isPost
		 */
		public function __construct($url, $isPost = false) {
			$this->mCurl = curl_init($url);
			$this->mUrl = $url;
			$this->isPost($isPost);
		}

		/**
		 * Change user agent
		 * @param string $ua
		 * @return $this
		 */
		public function setUserAgent($ua) {
			$this->userAgent = $ua;
			return $this;
		}

		/**
		 * @param boolean|null $state
		 * @return boolean|Request
		 */
		public function isPost($state = null) {
			if ($state === null) {
				return $this->isPost;
			}

			$this->isPost = (boolean) $state;
			return $this;
		}

		/**
		 * @param array $params
		 * @return $this
		 */
		public function setParams($params) {
			$this->post = $params;
			return $this;
		}

		/**
		 * @param string $key
		 * @param mixed  $value
		 * @return $this
		 */
		public function setParam($key, $value) {
			$this->post[$key] = $value;
			return $this;
		}

		public function getParams() {
			return $this->post;
		}

		/**
		 * Initialization
		 */
		public function init() {
			curl_setopt($this->mCurl, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($this->mCurl, CURLOPT_SSL_VERIFYHOST, 0);
			curl_setopt($this->mCurl, CURLOPT_SSL_VERIFYPEER, 0);
			curl_setopt($this->mCurl, CURLOPT_POST, $this->isPost);
			curl_setopt($this->mCurl, CURLOPT_TIMEOUT, 5);

			if ($this->userAgent) {
				curl_setopt($this->mCurl, CURLOPT_USERAGENT, $this->userAgent);
			}

			$params = http_build_query($this->post);

			if ($this->isPost) {
				curl_setopt($this->mCurl, CURLOPT_POSTFIELDS, $params);
			} else {
				curl_setopt($this->mCurl, CURLOPT_URL, $this->mUrl = ($this->mUrl . "?" . $params));
			}
		}

		/**
		 * Send request
		 * @return $this
		 */
		public function send() {
			$this->init();
			$this->result = curl_exec($this->mCurl);
			curl_close($this->mCurl);
			return $this;
		}

		/**
		 * Return result raw result
		 * @return mixed
		 */
		public function getResult() {
			return $this->result;
		}

		/**
		 * Return result as JSON object
		 * @return \stdClass
		 */
		public function getJSON() {
			return json_decode($this->result);
		}

	}