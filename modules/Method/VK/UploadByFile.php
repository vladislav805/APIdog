<?

	namespace Method\VK;

	use APIdogException;
	use Connection;
	use Controller;
	use Method\BaseMethod;

	class UploadByFile extends BaseMethod {

		/** @var string */
		protected $target;

		/** @var array */
		private $file;

		/**
		 * Get constructor.
		 * @param array $request
		 */
		public function __construct($request) {
			parent::__construct($request);
			$this->file = isset($_FILES["file"]) ? $_FILES["file"] : null;
		}

		/**
		 * Some action of method
		 * @param Controller $controller
		 * @param Connection $db
		 * @return mixed
		 * @throws APIdogException
		 */
		public function run(Controller $controller, Connection $db) {
			$task = new UploadTask($this->file["tmp_name"], $this->target);
			$task->getServer();
			$task->upload($this->file["name"]);
			unlink($this->file["tmp_name"]);

			$result = $task->save();

			return $result;
		}

	}