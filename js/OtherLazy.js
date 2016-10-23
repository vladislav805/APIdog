var Analytics = {
	google: function() {
		(function(i,s,o,g,r,a,m){
			i['GoogleAnalyticsObject']=r;
			i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},
			i[r].l=1*new Date();
			a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];
			a.async=1;
			a.src=g;
			m.parentNode.insertBefore(a,m);
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
		ga('create', 'UA-73434682-1', {sampleRate: 5});
		ga('send', 'pageview');
	},
	yandex: function() {
		(function(d,w,c){
			(w[c]=w[c]||[]).push(function(){try{w.yaCounter19029880=new Ya.Metrika({id:19029880,trackHash:!0})}catch(e){}});
			var n=d.getElementsByTagName("script")[0],
				s=d.createElement("script"),
				f=function(){
					n.parentNode.insertBefore(s,n);
				};
			s.type="text/javascript";
			s.async=!0;
			s.src=(d.location.protocol=="https:"?"https:":"http:")+"//mc.yandex.ru/metrika/watch.js";
			if(w.opera=="[object Opera]")
				d.addEventListener("DOMContentLoaded",f,!1);
			else
				f()
		})(document,window,"yandex_metrika_callbacks");
	},
	liveinternet: function() {
		new Image().src="\/\/counter.yadro.ru\/hit?r"+escape(document.referrer)+((typeof(screen)=="undefined")?"":";s"+screen.width+"*"+screen.height+"*"+(screen.colorDepth?screen.colorDepth:screen.pixelDepth))+";u"+escape(document.URL)+";"+Math.random();
	}
};

ModuleManager.eventManager.addEventListener("OtherLazy", function() {
	console.log("anal inited");
	Analytics.google();
	Analytics.yandex();
	Analytics.liveinternet();
});