<?
	/**
	 * APIdog v6.5
	 *
	 * Branch: release
	 *
	 * Last update: 02/11/2015
	 */

	define("VK_LIMIT_UPLOAD", 25 * 1024 * 1024);

	class VKAPI {
		private $userAccessToken;
		private $v;

		public function __construct ($userAccessToken, $v = 4.99) {
			$this->userAccessToken = $userAccessToken;
			$this->v = $v;
		}

		public function request ($method, $params) {
			$request = new VKAPIRequest($method);
			if ($this->userAccessToken) {
				$request->setParam("access_token", $this->userAccessToken);
			};
			if ($this->v) {
				$request->setParam("v", $this->v);
			};
			foreach ($params as $key => $value) {
				$request->setParam($key, $value);
			};
			return $request;
		}
	}

	class VKAPIRequest {
		private $userAccessToken;
		private $method;
		private $params = [];
		private $APIRequestURL = "https://api.vk.com/method/";

		public function __construct ($method) {
			$this->method = $method;
		}

		public function setParam ($key, $value) {
			$this->params[$key] = $value;
		}

		public function send () {
			$c = curl_init($this->APIRequestURL . $this->method);
			curl_setopt($c, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($c, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($c, CURLOPT_SSL_VERIFYHOST, false);
			curl_setopt($c, CURLOPT_POST, true);
			curl_setopt($c, CURLOPT_POSTFIELDS, $this->getQueryString());
			$result = curl_exec($c);
			curl_close($c);

			return new VKAPIResult(json_decode($result));
		}

		private function getQueryString () {
			return http_build_query($this->params);
		}

		public function setAPIRequestURL ($url) {
			$this->APIRequestURL = $url;
			return $this;
		}
	}

	class VKAPIResult {
		private $result;

		public function __construct ($result) {
			$this->result = $result;
		}

		public function isSuccess () {
			return (boolean) !$this->result->error;
		}

		public function getResponse () {
			return $this->result->response;
		}

		public function getError () {
			return new VKAPIError($this->result->error);
		}

		public function getResult () {
			return $this->result;
		}
	}

	class VKAPIError {
		public $errorId;
		public $errorMessage;
		public $requestParams;

		public function __construct ($error)
		{
			$this->errorId = $error->error_code;
			$this->errorMessage = $error->error_msg;
			$this->requestParams = $error->request_params;
		}
	}