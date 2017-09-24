<?

	namespace Method\Internal;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class UpdateLangPack extends BaseMethod {

		/**
		 * UpdateLangPack constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * Parse language global file and parse to split files
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$all = json_decode(file_get_contents("./lang/lang.json"), true);
			$data = [];
			foreach ($all as $key => $item) {
				foreach ($item as $lang => $val) {
					$data[$lang][$key] = $val;
				}
			}

			foreach ($data as $lang => $item) {
				file_put_contents(sprintf("./lang/%d.json", $lang), json_encode($item, JSON_UNESCAPED_UNICODE));
			}

			return true;
		}
	}