<?

	include_once "./framework.v6.5.php";
	include_once "../api-helper.php";

	if (!defined("CURRENT_USER_ID") || defined("CURRENT_USER_ID") && CURRENT_USER_ID == 0) {
		exit(header("Location: /auth.php"));
	}

	function getLabel ($name) {
		return getLangLabel("vkhide", $name);
	};


	template(APIdogTemplateTop);

?>
<div class="vkhide about-text">
	<h1><?=getLabel("_title");?></h1>
	<p><?=getLabel("_description");?></p>
	<h3><?=getLabel("_instructionsTitle");?></h3>
	<p><?=getLabel("_instructions");?></p>
	<div class="vkhide-button-wrap">

		<input
			type="button"
			value="<?=getLabel("_buttonEnable")?>"
			onclick="VKHide.enable(this);" />

	</div>

	<blockquote><?=getLabel("_warningMobile");?></blockquote>
</div>
<?
	template(APIdogTemplateBottom);