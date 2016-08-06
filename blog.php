<?

	$pagePrefix = "blog";

	include_once "zero.framework.php";
	include_once "zero.helper.php";

	/**
	 * Возвращает именованые ссылки на автора блога
	 * @param  int $id Идентификатор пользователя ВК
	 * @return string  Имя
	 */
	function getAdminLink ($id) {
		global $dogAdminBlogName;
		return $dogAdminBlogName[$id];
	};

	$blog = new Blog;

	$postId = (int) $_REQUEST["postId"];
	$offset = (int) $_REQUEST["offset"];
	$action = (string) $_REQUEST["act"];

	if (!$postId) {

		switch ($action) {

			case "add":
				if (!CURRENT_USER_ADMIN) {
					header("Location: ?");
					exit;
				};

				template(APIdogTemplateTop);
				print $pagination;

?>
<form class="blog-post" method="post" action="?act=create">
	<h1><input class="blog-new-title" type="text" placeholder="<?=getLabel("_newTitle")?>" autocomplete="off" name="title" /></h1>
	<div><textarea name="text" class="blog-new-text"></textarea></div>
	<div><input type="submit" value="Создать" class="blog-new-submit" /></div>
</form>
<?

				print $pagination;
				template(APIdogTemplateBottom);
				break;

			case "create":
				if (!CURRENT_USER_ADMIN) {
					header("Location: ?");
					exit;
				};

				$title = $_REQUEST["title"];
				$text = $_REQUEST["text"];
				$adminId = (int) userId;

				$postId = $blog->addPost($title, $text, $adminId);

				header("Location: ?postId=" . $postId);
				exit;
				break;

			default:

				$list = $blog->getTimeline($offset);

				$pagination = pagination($offset, $list["count"], 40);

				template(APIdogTemplateTop);
				print $pagination;

				foreach ($list["items"] as $item) {
?>
<section class="blog-item">
	<h1><a href="blog.php?postId=<?=$item["postId"];?>"><?=htmlSpecialChars($item["title"]);?></a></h1>
	<p><?=htmlSpecialChars(strip_tags(explode("\n", $item["text"])[0]));?></p>
	<div class="info"><a href="./#id<?=$item["adminId"];?>"><?=getAdminLink($item["adminId"]);?></a> | <?=date("d.m.Y H:i", $item["date"]);?></div>
</section>
<?
				};

				print $pagination;
				template(APIdogTemplateBottom);
		};

	} else {

		switch ($action) {

			case "delete":

				if (!CURRENT_USER_ADMIN) {
					header("Location: ?");
					exit;
				};

				$result = $blog->deletePost($postId);

				exit(header("Location: ?"));
				break;

			default:

				$post = $blog->getPost($postId);

				if (!$post) {
					exit(header("Location: ?"));
				};

				template(APIdogTemplateTop);

				$post = $post["post"];

?>
<section class="blog-post">
	<div class="blog-viewsCount"><?=getLabel("_views")?>: <?=$post["views"];?></div>
	<h1><?=$post["title"];?></h1>
	<p><?=nl2br($post["text"]);?></p>
	<div></div>
	<div class="info"><a href="./#id<?=$post["adminId"];?>"><?=getAdminLink($post["adminId"]);?></a> | <?=date("d.m.Y H:i", $post["date"]);?></div>
<?
				if (CURRENT_USER_ADMIN) {
?>
	<div class="blog-actions">
		<a href="blog.php?act=delete&amp;postId=<?=$postId;?>">Удалить</a>
	</div>
<?
				};
?>
</section>
<?

				template(APIdogTemplateBottom);

		};

	};