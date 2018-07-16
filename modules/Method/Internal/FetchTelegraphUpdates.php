<?
	/**
	 * Created by vlad805.
	 */

	namespace Method\Internal;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class FetchTelegraphUpdates extends BaseMethod {

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$url = "https://api.telegra.ph/getPage/APIdog-v646-dev-08-20?return_content=true";

			$request = new \Tools\Request($url, true);

			return $request->send()->getJSON();
		}
	}