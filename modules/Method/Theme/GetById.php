<?

	namespace Method\Theme;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Model\Theme;

	class GetById extends BaseMethod {

		/** @var int */
		protected $themeId;

		/**
		 * GetById constructor.
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

			if ($this->themeId < 0) {
				throw new APIdogException(ErrorCode::INVALID_PARAM);
			}

			$sql = sprintf("SELECT * FROM `theme` WHERE `themeId` = '%d' LIMIT 1", $this->themeId);

			$theme = $db->query($sql, $db::RESULT_ITEM);

			if (!$theme) {
				throw new APIdogException(ErrorCode::THEME_NOT_FOUND);
			}

			return new Theme($theme);
		}

	}