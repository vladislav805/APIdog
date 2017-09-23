<?
	/*************************
	 *                       *
	 *    DEPRECATED CODE    *
	 *                       *
	 *************************/




	require_once "conf.php";

	/****************
	 * APIdog APIv2 *
	 ****************
	 *  14.03.2015  *
	 ****************/

	// ban for themes.*: 315482675

	function getAdmin ($userId)
	{
		$agents = [
			23048942	=> 1, // Veluga
			203384908	=> 1, // Tester
			3869934		=> 1, // Ivanova
//			261742180	=> 2, // Metelev (fake, Arseny)
//			59164960	=> 2, // Metelev
//			178908687	=> 2, // Metelev (fake, Sergey)
			184870404	=> 3, // Karpovich
			202984498	=> 3, // Karpovich (fake, Anton)
//			134740039	=> 4, // Motirin (dismissed)
//			163143504	=> 5, // Shevchuk (dismissed)
//			16758923	=> 6, // Desyatov (dismissed)
//			103503275	=> 6, // Tamoyan  (dismissed)
			19027419	=> 7, // Tkachuk
//			41053069	=> 8, // Gaist (dismissed)
			18773011	=> 9, // Dacuk
			95207619	=> 21,// Vityaz
			4366635		=> 20 // Ericsson
		][$userId];
		return ($agents ? $agents : false);
	};








	class User {


		static function associateAuthKey ($authKey, $authId, $userId)
		{
			if (!$authKey || !$authId || !$userId || $userId < 0)
				new Errors(53);
			$user = APIdog::mysql("SELECT * FROM `auth` WHERE `hash`='$authKey' LIMIT 1", 1);
			if (!$user)
				new Errors(54);
			if ($user["auth_id"] != $authId || $user["user_id"] != 0)
				new Errors(55);
			$user = APIdog::mysql("UPDATE `auth` SET `user_id` = '$userId' WHERE `hash`='$authKey' LIMIT 1", 5);
			$settings = Settings::getBitmask($userId);
			$lang = ["ru", "en", "ua", 999 => "gop"][$settings["lang"]];
			return [
				"userId" => $userId,
				"authKey" => $authKey,
				"authId" => $authId,
				"user" => [
					"settings" => [
						"userId" => $userId,
						"bitmask" => (int) $settings["bitmask"],
						"language" => [
							"languageId" => $settings["lang"],
							"languageCode" => $lang,
							"languageFile" => "/lang/" . $lang . ".json"
						]
					]
				]
			];
		}
	}