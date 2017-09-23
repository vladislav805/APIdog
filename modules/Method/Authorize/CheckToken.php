<?

	namespace Method\Authorize;

	use APIdogException;
	use Connection;
	use Controller;
	use Method\BaseMethod;
	use Model\VKSession;

	class CheckToken extends BaseMethod {

		/** @var VKSession */
		protected $vk;

		/**
		 * CheckToken constructor.
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
			if (!$this->vk->getAccessToken()) {
				throw new APIdogException(\ErrorCode::AUTHORIZE_TOKEN_EMPTY);
			};

			// TODO: check and reopen this code: it has been disabled after server is down by long waiting
			/*$ch = curl_init("https://oauth.vk.com/access_token?client_id=" . $app->id . "&client_secret=" . $app->secret . "&v=5.24&grant_type=client_credentials");
			curl_setopt($ch, CURLOPT_USERAGENT, "VKAndroidApp/4.38-816 (Android 6.0; SDK 23; x86;  Google Nexus 5X; ru)");
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_TIMEOUT, 5);
			$result = curl_exec($ch);
			$data = json_decode($result);
			curl_close($ch);

			$accessToken = $data->access_token;
			$test = APIdog::api("secure.checkToken", [
				"access_token" => $accessToken,
				"v" => 5.0,
				"token" => $userToken,
				"client_secret" => $app->secret
			], true);


			if ($test->error)
			{
				return new Errors(41);
			};

			$test = $test->response;
			$userId = (int) $test->user_id;*/

			return true;
		}
	}