<?

	namespace Method\Theme;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Model\Theme;

	class Add extends BaseMethod {

		/** @var string */
		protected $codeCSS;

		/** @var string */
		protected $codeJS;

		/** @var string */
		protected $title;

		/** @var string */
		protected $version;

		/** @var string */
		protected $changelog;

		/** @var boolean */
		protected $isPrivate;

		/**
		 * Add constructor.
		 * @param $request
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

			if (!$controller->getSession()->isAuthorized()) {
				throw new APIdogException(ErrorCode::AUTH_KEY_INVALID);
			}

			if (!$this->codeCSS || !$this->title) {
				throw new APIdogException(ErrorCode::INVALID_PARAM);
			}

			if (!$controller->perform(new CanCreateTheme([]))) {
				throw new APIdogException(ErrorCode::THEME_MAX_COUNT_OF_THEMES);
			}

			if ($controller->perform(new CheckCorrectCSS(["code" => $this->codeCSS]))) {
				throw new APIdogException(ErrorCode::THEME_INCORRECT_CSS);
			}

			$updated = time();
			$authorId = $controller->getSession()->getUserId();
			$fileCSS = $authorId . "." . $updated . ".css";

			$fh = fopen("user/theme/" . $fileCSS, "w+");
			fwrite($fh, $this->codeCSS);
			fclose($fh);

			$themeId = $db->query(sprintf("INSERT INTO `theme` (`title`, `fileCSS`, `fileJS`, `date`, `isPrivate`, `authorId`, `version`, `changelog`) VALUES ('%s', '%s', '%s', '%d', '%d', '%d', '%s', '%s')", $this->title, $fileCSS, "", $updated, $this->isPrivate, $authorId, $this->version, $this->changelog), $db::RESULT_INSERTED_ID);

			return new Theme($themeId);
		}
	}