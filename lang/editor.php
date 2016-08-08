<?
	$languageId = (int) $_REQUEST["languageId"];

	$languages = [
		["id" => 0, "title" => "Русский"],
		["id" => 1, "title" => "Английский"],
		["id" => 2, "title" => "Украинский"]
	];

	function getKeys() {
		$d = json_decode(file_get_contents("./0.json"));
		foreach ($d as $section => $inner) {
			foreach ($inner as $key => $value) {
				$keys[] = $section . "!" . $key;
			};
		};
		return $keys;
	};

	function prepareItems($data) {
		foreach ($data as $section => $inner) {
			foreach ($inner as $key => $value) {
				if (is_object($value)) {
					$d = [];
					foreach ($value as $k => $v) {
						$d[] = $k . "=" . $v;
					}
					$value = join("|;|", $d);
				} elseif (is_array($value)) {
					$value = join("|", $value);
				};
				$name = $section . "!" . $key;

				$items[$name] = $value;
			};
		};
		return $items;
	};

	if (!isset($_REQUEST["languageId"])) {
		foreach ($languages as $value) {
?>
<a href="./editor.php?languageId=<?=$value["id"];?>"><?=$value["title"];?></a>
<?
		}
		exit;
	}

	if ($_REQUEST["save"]) {

		$json = [];

		foreach ($_POST as $key => $value) {
			list($section, $label) = explode("!", $key);

			if (strPos($value, "|;|") !== false) { // object
				$items = explode("|;|", $value);
				$value = [];
				foreach ($items as $item) {
					list($k, $v) = explode("=", $item);
					$value[$k] = $v;
				};
			} elseif (strPos($value, "|") !== false) { // array
				$value = explode("|", $value);
				if (sizeOf($value) == 2 && !$value[0] && $value[1]) {
					$value = [$value[1]];
				}
			};

			$json[$section][$label] = $value;
		};

		$json = json_encode($json, JSON_UNESCAPED_UNICODE);

		$fh = fopen($languageId . ".json", "w+");
		fwrite($fh, $json);
		fclose($fh);
		header("Location: ?languageId=" . $languageId);
		exit;
	};

	$data = json_decode(file_get_contents($languageId . ".json"));

?>
<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		font-family: Tahoma;
	}

	table {
		width: 100%;
	}

	th {
		font-weight: normal;
		font-family: Consolas, monospace;
		text-align: left;
	}

	td {
		width: 100%;
	}

	td input {
		width: 100%;
		line-height: 28px;
		padding: 0 8px;
	}
</style>
<form action="./editor.php?languageId=<?=$languageId;?>&amp;save=1" method="post">
<table>
<?
	$items = prepareItems($data);

	foreach (getKeys() as $key) {
//		$placeholder = isset($items[$key]) ? "" : $
?>
	<tr>
		<th><?=$key;?></th>
		<td><input type="text" name="<?=$key;?>" value="<?=htmlspecialchars($items[$key]);?>" /></td>
	</tr>
<?
	}

?>
</table>
<input type="submit" value="Save" />
</form>