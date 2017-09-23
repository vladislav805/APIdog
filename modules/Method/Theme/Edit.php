<?

	namespace Method\Theme;

	use APIdogException;
	use Connection;
	use Controller;
	use ErrorCode;
	use Method\BaseMethod;
	use Model\Theme;

	class Edit extends BaseMethod {

		/** @var int */
		protected $themeId;

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
		 * Edit constructor.
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
			$time = time();

			/** @var Theme $theme */
			$theme = $controller->perform(new GetById(["themeId" => $this->themeId]));

			if ($theme->getAuthorId() !== $controller->getSession()->getUserId()) {
				throw new APIdogException(ErrorCode::THEME_ACCESS_FORBIDDEN);
			}

			$sql = sprintf("UPDATE `theme` SET `title` = '%s', `date` = '%d', `isPrivate` = '%d', `version` = '%s', `changelog` = '%s' WHERE `themeId` = '%d' LIMIT 1", $this->title, $time, $this->isPrivate, $this->version, $this->changelog, $this->themeId);
			$db->query($sql, $db::RESULT_AFFECTED);

			$fh = fopen("user/theme/" . $theme->getFileCSS(), "w+");
			fwrite($fh, $this->codeCSS);
			fclose($fh);

			return true;
		}
	}