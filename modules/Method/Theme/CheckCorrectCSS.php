<?

	namespace Method\Theme;

	use Connection;
	use Controller;
	use Method\BaseMethod;

	class CheckCorrectCSS extends BaseMethod {

		protected $code;

		/**
		 * CheckCorrectCSS constructor.
		 * @param $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 */
		public function run(Controller $controller, Connection $db) {
			$code = $this->code;

			$roundStart = substr_count($code, "(");
			$roundEnd = substr_count($code, ")");

			$rectStart = substr_count($code, "[");
			$rectEnd = substr_count($code, "]");

			$figureStart = substr_count($code, "{");
			$figureEnd = substr_count($code, "}");

			return !($roundStart != $roundEnd || $rectStart != $rectEnd || $figureStart != $figureEnd || !$figureStart || !$figureEnd);
		}
	}