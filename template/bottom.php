					</section>
				</section>
				<div class="footer">
					<div class="tip"><?=getLabel("footer");?></div>
				</div>
			</div>
		</div>
		<script src="lib/lib1.3.0.js"></script>
		<script src="js/Constants.js"></script>
		<script src="js/SDK.js"></script>
		<!--script src="js/VKUpload.js"></script-->
		<script src="lib/nondefault.js?1"></script>
		<script type="text/javascript"><?
	if (defined("_installed")) {
		$user = getUserDataForNonStdPages();
		print "var API = " . json_encode($user["usr"] ? $user["usr"] : [
			"userAccessToken" => "",
			"userId" => 0,
			"authKey" => "",
			"settings" => [
				"bitmask" => 0,
				"languageId" => defined("USER_LANGUAGE_ID") ? USER_LANGUAGE_ID : 0
			]
		]);
		if ($user["lng"]) {
			print (";var Lang = {\"data\":" . json_encode($user["lng"], JSON_UNESCAPED_UNICODE) . ",\"get\":function(a){return Lang.data[a] || \"%\"+a+\"%\";}};");
		};
	};
?></script>
		<noscript>
			<img src="//mc.yandex.ru/watch/19029880" style="position:absolute; left:-9999px;" alt="" />
		</noscript>
		<script>(function (d,w,c){(w[c]=w[c]||[]).push(function(){try{w.yaCounter19029880=new Ya.Metrika({id:19029880,trackHash:!0})}catch(e){}});var n=d.getElementsByTagName("script")[0],s=d.createElement("script"),f=function(){n.parentNode.insertBefore(s,n);};s.type="text/javascript";s.async=!0;s.src=(d.location.protocol=="https:"?"https:":"http:")+"//mc.yandex.ru/metrika/watch.js";if(w.opera=="[object Opera]")d.addEventListener("DOMContentLoaded",f,!1);else f()})(document,window,"yandex_metrika_callbacks");(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create','UA-73434682-1',{'sampleRate':5});ga('send','pageview');</script>
	</body>
</html><!-- APIdog Corp. --><!-- Have fun since 8 august 2012 until now! -->
