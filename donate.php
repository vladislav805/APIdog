<?

	$pagePrefix = "donate";

	include_once "zero.framework.php";
	include_once "zero.helper.php";

	template(APIdogTemplateTop);
?>
<div class="donate-content">
	<div class="donate-items">
		<div class="donate-item">
			<div class="donate-logo donate-logo-ym"></div>
			<h3><?=getLabel("_itemYandex");?></h3>
			<h4>410012195338722</h4>
		</div>
		<div class="donate-item">
			<div class="donate-logo donate-logo-wm"></div>
			<h3><?=getLabel("_itemWM");?></h3>
			<h4>R103293127726</h4>
		</div>
		<!--dt><?=getLabel("_itemBTC");?></dt>
		<dd>1E6CzdeXJ9VEvoP5WkZPEH8EFcAwzFi9MY</dd-->
	</div>
	<p class="about-text"><?=getLabel("_description");?></p>
</div>
<?
	template(APIdogTemplateBottom);