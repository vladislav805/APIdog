<?
	/**
	 * APIdog v6.5
	 *
	 * Branch: release
	 *
	 * Last update: 01/11/2015
	 */

	error_reporting(E_ERROR);
	$data = json_decode(trim($_REQUEST["target"]));

	$method = $data->method;
	$params = (array) $data->params;
	$file = $_FILES["file"];

	$acceptedMethods = [
		"photos.getUploadServer",
		"photos.getWallUploadServer",
		"photos.getChatUploadServer",
		"photos.getMessagesUploadServer",
		"photos.getOwnerPhotoUploadServer",
		"video.save",
		"audio.getUploadServer",
		"docs.getUploadServer",
		"docs.getWallUploadServer",
		"chronicle.getUploadServer"
	];

	$methodParams = [
		"photos.getUploadServer" => [
			"param" => "file1",
			"name" => "p.jpg",
			"method" => "photos.save"
		],
		"photos.getWallUploadServer" => [
			"param" => "photo",
			"name" => "p.jpg",
			"method" => "photos.saveWallPhoto"
		],
		"photos.getChatUploadServer" => [
			"param" => "photo",
			"name" => "p.jpg",
			"method" => "messages.setChatPhoto"
		],
		"photos.getMessagesUploadServer" => [
			"param" => "photo",
			"name" => "p.jpg",
			"method" => "photos.saveMessagesPhoto"
		],
		"photos.getOwnerPhotoUploadServer" => [
			"param" => "photo",
			"name" => "p.jpg",
			"method" => "photos.saveOwnerPhoto"
		],
		"video.save" => [
			"param" => "file",
			"name" => "v.mp4"
		],
		"audio.getUploadServer" => [
			"param" => "file",
			"name" => "a.mp3",
			"method" => "audio.save"
		],
		"docs.getUploadServer" => [
			"param" => "file",
			"name" => $file["name"],
			"method" => "docs.save"
		],
		"docs.getWallUploadServer" => [
			"param" => "file",
			"name" => $file["name"],
			"method" => "docs.save"
		],
		"chronicle.getUploadServer" => [
			"param" => "photo",
			"name" => "p.jpg",
			"method" => "chronicle.save"
		]
	];

	/**
	 * Вывод ответа и завершение
	 * @param  Mixed $data Ответ
	 */
	function outJSON ($data) {
		header("Content-type: application/json; charset=utf-8");
		exit(json_encode($data, JSON_UNESCAPED_UNICODE));
	};

	/**
	 * Вывод ошибки
	 * @param  int  $errorId Идентификатор ошибки
	 * @param  boolean $d    Дополнительные данные
	 */
	function outError ($errorId, $d = false) {
		$q = ["error_code" => -$errorId];
		if ($d) {
			$q["errorData"] = $d;
		};
		outJSON(["error" => $q]);
	};

	require_once("VKAPIClasses.port.v7.php");

	// If the method name does not refer to downloading files, cancelling
	// a request
	if (!in_array($method, $acceptedMethods)) {
		outError(1);
	};

	// If sent by user a file larger than 5 MB, cancelling a request
	if ($file["size"] > VK_LIMIT_UPLOAD) {
		unlink($file["tmp_name"]);
		outError(2);
	};

	// Get options to download from our configuration
	$p = $methodParams[$method];

	if ($p["isAPIdog"]) {
		switch ($method) {
			case "support.uploadImage":
				include_once "api-helper.php";
				$result = Attachment::uploadImage($file);
				break;

			case "apidog.uploadAdImage":
				include_once "ads-engine.php";
				$api = new AdsAPI;
				$result = $api->uploadImage($file);
				break;

			default:
				outError(-4);
				break;
		};
		outJSON($result);
		exit;
	};

	/**
	 * Requesting address for upload
	 */

	$API = new VKAPI($params["access_token"], 4.99);

	// The requested URL to download the file
	$server = $API->request($method, $params)->send();

	// If has error while getting URL, cancelling a request and send
	// result to user
	if (!$server->isSuccess()) {
		outJSON($server->getResult());
	};
	// If has no error, then take response
	$serverData = $server->getResponse();

	/**
	 * Uploading
	 */


	// Init curl and upload file
	$ch = curl_init($serverData->upload_url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, [ $p["param"] => new CurlFile($file["tmp_name"], "file/exgpd", $p["name"]) ]);
	curl_setopt($ch, CURLOPT_INFILESIZE, filesize($file["tmp_name"]));
	$result = json_decode(curl_exec($ch), true);
	curl_close($ch);
	// Remove file from server
	unlink($file["tmp_name"]);

	/**
	 * Saving file
	 */

	// If you want to save the file do not need to request a method to
	// save (for example, in the case of video.save), then give that has
	// issued the server to the request to obtain the load address.
	if (!$p["method"]) {
		outJSON($serverData);
	};
	// If the uploader server has issued the error, then return error 3
	// and the whole answer.
	// This could be, if in the documents upload a file with the
	// extension exe, mp3 or apk.
	if ($result["error"]) {
		outError(3, $result);
	};

	if ($params["user_id"] && !$result["user_id"])
		$result["user_id"] = $params["user_id"];
	if ($params["group_id"] && !$result["group_id"])
		$result["group_id"] = $params["group_id"];
	// The requested retention method and pass it all the parameters that
	// we received when downloading the file
	$saved = $API->request($p["method"], $result)->send();
	// Take a response of request for save file
	$response = $saved->getResponse();

	// Sometimes preserving the API method returns an array with one element,
	// even if provided with only one file. To fix this, add this bike and
	// check whether the response element zero of the array.
	if (is_array($response) && isset($response[0])) {
		$response = $response[0];
	};

	// ... and return answer to user (frontend)
	outJSON($response);
	exit;