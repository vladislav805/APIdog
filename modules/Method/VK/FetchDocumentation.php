<?

	namespace Method\VK;

	use APIdogException;
	use Connection;
	use Controller;
	use Method\BaseMethod;

	class FetchDocumentation extends BaseMethod {

		/** @var string */
		protected $p;

		/**
		 * FetchDocumentation constructor.
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
			/** @noinspection SpellCheckingInspection */
			$page = file_get_contents("https://vk.com/dev/" . $this->p, false, stream_context_create([
				"http" => [
					"method" => "GET",
					"header" => "Content-Type: application/x-www-form-urlencoded\r\nCookie: audio_vol=98; remixflash=17.0.0; remixscreen_depth=24; remixdt=0; audio_time_left=0; remixlang=0; remixfeed=*.*.*.*.*.*.*.*; remixrt=0; remixretina=1; remixsrt=1; remixshow_fvbar=1; remixrefkey=6dec4cd87064697ab1; remixtst=a3234fe9; remixmdevice=1440/900/1/!!!!!!!"
				]
			]));

			$page = iconv("cp1251", "utf8", $page);

			preg_match_all("/<title>(.*)<\/title>/i", $page, $title);
			$title = str_replace(" | Разработчикам | ВКонтакте", "", $title[1][0]);

			$page = explode("<div id=\"dev_page_wrap1\">", $page);
			$page = explode("<div class=\"dev_footer_wrap", $page[1]);
			$page = preg_replace("/\n\s{2,}/", "", $page[0]);
			//$page = preg_replace("/<!--.*-->/", "", $page);

			return [
				"page" => $this->p,
				"title" => $title,
				"html" => $page
			];
		}
	}