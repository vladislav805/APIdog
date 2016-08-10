<?
	$languageId = (int) $_REQUEST["languageId"];

	$languages = [
		["id" => 0, "title" => "Русский"],
		["id" => 1, "title" => "Английский"],
		["id" => 2, "title" => "Украинский"]
	];

	
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

	if (isset($_REQUEST["save"])) {

		$json = json_encode($_POST["data"], JSON_UNESCAPED_UNICODE);

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

	body > form > table > tbody > tr > td {
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
	$fields = json_decode(file_get_contents("./0.json"), true);
	$data = json_decode(file_get_contents("./" . $languageId . ".json"), true);

	foreach ($fields as $section => $s) {
		foreach ($s as $key => $value) {

			$item = isset($data[$section][$key]) ? $data[$section][$key] : null;
?>
	<tr>
		<th><?=$section.".".$key;?></th>
		<td><?
			if (is_array($value)) {
?>
			<table>
<?
				foreach ($value as $i => $v) {
?>
				<tr>
					<td><?=$i;?></td>
					<td><input type="text" name="data[<?=$section;?>][<?=$key?>][<?=$i;?>]" value="<?=(isset($item[$i]) ? htmlspecialchars($item[$i]) : "");?>" placeholder="<?=htmlspecialchars($v)?>" /></td>
				</tr>
<?
				}
?>
			</table>
<?
			} else {
?><input type="text" name="data[<?=$section;?>][<?=$key?>]" value="<?=htmlspecialchars($item);?>" placeholder="<?=htmlspecialchars($value)?>" /><?
			}
?></td>
	</tr>
<?
		}
	}

?>
</table>
<input type="submit" value="Save" />
</form>