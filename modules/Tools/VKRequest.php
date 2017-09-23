<?

	namespace Tools;

	class VKRequest extends Request {

		/**
		 * VKRequest constructor.
		 * @param string $method
		 * @param array  $params
		 */
		public function __construct($method, $params) {
			parent::__construct("https://api.vk.com/method/" . $method, true);

			$this->setUserAgent(VK_SHIT_USER_AGENT);

			$this->isPost(true);
			$this->setParams($params);
		}

		public function send() {
			return parent::send()->getJSON();
		}

	}