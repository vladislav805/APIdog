<?

	namespace Method\Theme;

	use APIdogException;
	use Connection;
	use Controller;
	use Method\BaseMethod;

	class Apply extends BaseMethod {

		/** @var int */
		protected $themeId;

		/**
		 * Apply constructor.
		 * @param array $request
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
			if ($this->themeId) {
				$controller->perform(new GetById(["themeId" => $this->themeId]));
			}

			$result = $db->query(sprintf("UPDATE `settings` SET `themeId` = '%d' WHERE `userId` = '%d' LIMIT 1", $this->themeId, $controller->getSession()->getUserId()), $db::RESULT_AFFECTED);

			return (boolean) $result;
		}
	}