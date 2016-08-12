<?

	include_once "../zero.framework.php";
	include_once "../zero.helper.php";

	if (!defined("isAdminCurrentUser") || !isAdminCurrentUser) {
		exit("401");
	};

	$languageId = (int) isset($_REQUEST["languageId"]) ? $_REQUEST["languageId"] : 0;

	$languages = [
		["id" => 0, "title" => "Русский"],
		["id" => 1, "title" => "Английский"],
		["id" => 2, "title" => "Украинский"]
	];


	if (!isset($_REQUEST["languageId"])) {
?><ul><?
		foreach ($languages as $value) {
?>
<li><a href="./editor.php?languageId=<?=$value["id"];?>"><?=$value["title"];?></a></li>
<?
		}
?></ul><?
		exit;
	};

	if (isset($_REQUEST["save"])) {
var_dump($_POST);
print "<br><br><br><br><br><br><br><br><br>";
		$json = json_encode($_POST, JSON_UNESCAPED_UNICODE);
var_dump($json);
exit;
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
<form action="./editor.php?languageId=<?=$languageId;?>&amp;save=1" method="post" enctype="multipart/form-data">
<table>
<?
	$fields = json_decode(file_get_contents("./0.json"), true);
	$data = json_decode(file_get_contents("./" . $languageId . ".json"), true);

	$offset = (int) (isset($_REQUEST["offset"]) ? $_REQUEST["offset"] : 0);
	$perPage = 50;
	$i = -1;
	foreach ($fields as $section => $s) {

		foreach ($s as $key => $value) {
			$i++;

			if (!($i >= $offset && $offset + $perPage < $i)) {
				continue 1;
			};

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
					<td><input type="text" name="<?=$section;?>[<?=$key?>][<?=$i;?>]" value="<?=(isset($item[$i]) ? htmlspecialchars($item[$i]) : "");?>" placeholder="<?=htmlspecialchars($v)?>" /></td>
				</tr>
<?
				}
?>
			</table>
<?
			} else {
?><input type="text" name="<?=$section;?>[<?=$key?>]" value="<?=htmlspecialchars($item);?>" placeholder="<?=htmlspecialchars($value)?>" /><?
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