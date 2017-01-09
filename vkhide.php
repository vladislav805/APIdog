<?

	$pagePrefix = "vkhide";

	include_once "zero.framework.php";
	include_once "zero.helper.php";

	if (!defined("userId") || defined("userId") && userId == 0) {
		exit(header("Location: auth.php"));
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