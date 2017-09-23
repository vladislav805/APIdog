<?

	namespace Method\Theme;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Model\Theme;

	class Remove extends BaseMethod {

		/** @var int */
		protected $themeId;

		/**
		 * Remove constructor.
		 * @param array $request
		 */
		public function __construct($request) {
			parent::__construct($request);
		}

		/**
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {
			/** @var Theme $theme */
			$theme = $controller->perform(new GetById(["themeId" => $this->themeId]));

			if ($theme->getAuthorId() !== $controller->getSession()->getUserId()) {
				throw new APIdogException(ErrorCode::THEME_ACCESS_FORBIDDEN);
			}

			$sql = sprintf("DELETE FROM `theme` WHERE `themeId` = '%d' LIMIT 1", $this->themeId);
			$result = $db->query($sql, $db::RESULT_AFFECTED);

			unlink("user/theme/" . $theme->getContentCSS());

			return (boolean) $result;
		}
	}