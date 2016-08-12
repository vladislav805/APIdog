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

		$targetFile = "./" . $languageId . ".json";
		$data = json_decode(file_get_contents($targetFile), true);

		foreach ($_POST as $section => $v) {
			foreach ($v as $key => $value) {
				$data[$section][$key] = $value;
			};
		};

		$fh = file_put_contents($targetFile, json_encode($data, JSON_UNESCAPED_UNICODE));
		header("Location: " .$_SERVER["HTTP_REFERER"]);
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

	.pagination-wrap {
		border-bottom: 1px solid black;
		overflow: hidden;
	}

	.pagination-wrap a {
		display: block;
		float: left;
		text-align: center;
		line-height: 50px;
		text-decoration: none;
		color: black;
		box-sizing: border-box;
		border-right: 1px solid black;
	}

	.pagination-wrap a:last-child {
		border-right: none;
	}

	.pagination-wrap a[data-current] {
		font-weight: 900;
		color: gray;
		box-shadow: inset 0 0 6px 1px rgba(0, 0, 0, .5);
	}

	.pagination-wrap[data-links="1"] a { width: 100%; }
	.pagination-wrap[data-links="2"] a { width: 50%; }
	.pagination-wrap[data-links="3"] a { width: 33.3333%; }
	.pagination-wrap[data-links="4"] a { width: 25%; }
	.pagination-wrap[data-links="5"] a { width: 20%; }
	.pagination-wrap[data-links="6"] a { width: 16.6666%; }
	.pagination-wrap[data-links="7"] a { width: 14.2857%; }
	.pagination-wrap[data-links="8"] a { width: 12,5%; }
</style>
<form action="./editor.php?languageId=<?=$languageId;?>&amp;save=1" method="post" enctype="multipart/form-data">
<?
	$fields = json_decode(file_get_contents("./0.json"), true);
	$data = json_decode(file_get_contents("./" . $languageId . ".json"), true);

	$count = 0;
	foreach ($fields as $a) {
		foreach ($a as $b) {
			$count++;
		};
	};


	$offset = (int) (isset($_REQUEST["offset"]) ? $_REQUEST["offset"] : 0);
	$perPage = 150;
	$j = -1;

	$pages = pagination($offset, $count, $perPage, 20);

	print $pages;

?><table><?

	foreach ($fields as $section => $s) {

		foreach ($s as $key => $value) {
			$j++;

			if (!($j >= $offset && $offset + $perPage > $j)) {
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