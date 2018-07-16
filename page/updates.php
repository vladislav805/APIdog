<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport"
			content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0" />
		<meta http-equiv="X-UA-Compatible" content="ie=edge" />
		<title>APIdog Updates</title>
		<link rel="stylesheet" href="/css/telegraph.css" />
		<script src="/js/lib1.3.0.js"></script>
		<script src="/js/auth.js"></script>
		<script>
			function nodeToDom(node) {
				if (typeof node === 'string' || node instanceof String) {
					return document.createTextNode(node);
				}
				var domNode;
				if (node.tag) {
					domNode = document.createElement(node.tag);
					if (node.attrs) {
						for (var name in node.attrs) {
							if (node.attrs.hasOwnProperty(name)) {
								var value = node.attrs[name];
								domNode.setAttribute(name, value);
							}
						}
					}
				} else {
					domNode = document.createDocumentFragment();
				}

				if (node.children) {
					for (var i = 0; i < node.children.length; i++) {
						var child = node.children[i];
						domNode.appendChild(nodeToDom(child));
					}
				}
				return domNode;
			}

			window.addEventListener("DOMContentLoaded", function() {
				APIdogRequest("internal.fetchUpdates", {}).then(function(data) {

					var rootNode = nodeToDom({children: data.result.content});
					$.elements.remove($.element("loadingTelegraph"));
					$.elements.clearChild($.element("contentTelegraph")).appendChild(rootNode);
				});
			});

		</script>
	</head>
	<body>
		<div class="Xloading" id="loadingTelegraph">
			<div class="Xloading-text">
				<span class="loading-text-words">L</span>
				<span class="loading-text-words">O</span>
				<span class="loading-text-words">A</span>
				<span class="loading-text-words">D</span>
				<span class="loading-text-words">I</span>
				<span class="loading-text-words">N</span>
				<span class="loading-text-words">G</span>
			</div>
		</div>
		<div id="contentTelegraph"><div style="margin: 50px 0; text-align: center;">Загрузка...</div></div>
	</body>
</html>