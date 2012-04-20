<!DOCTYPE html>
<html>
	<head>
		<link href="{$url_base}/images/favicon.png" rel="icon" type="image/png" />
		<link class="default" rel="stylesheet" type="text/css" href="{$url_base}/css/default.css" />
		<link class="login" rel="stylesheet" type="text/css" href="{$url_base}/css/login.css" />
		<script type="text/javascript" src="{$url_base}/js/jquery.js"></script>
		<script type="text/javascript" src="{$url_base}/js/default.js"></script>
		<script type="text/javascript">
		var URL_BASE = "{$url_base}";
		{literal}
		$.ajaxSetup({
			url: "./json",
			type: "POST",
			processData: false,
			dataType: "json",
			contentType: "application/json",
			async: true
		});

		$.ajax({
			data: JSON.stringify({
				type: 'user',
				request: 'timezone',
				timezone: (new Date().getTimezoneOffset())*-60
			})
		});
		drdelambre.login = {
			login : new drdelambre.class({
				element: null,

				init : function(elem){
					this.element = $(elem);
					if(!this.element.length) return;
					this.element.find('.sign').animate({
						opacity: 1
					},{ duration: 400, easing: 'linear' });
					this.element.find('.sign').bind('mousedown', this.toggle);
					var inps = this.element.find('.input-wrap');
					new drdelambre.default.Textarea(inps.eq(0),{ defaultText: '', enter: this.send });
					new drdelambre.default.Textarea(inps.eq(1),{ defaultText: '', enter: this.send, type: 'password' });
					new drdelambre.default.Textarea(inps.eq(2),{ defaultText: '', enter: this.send, type: 'password' });
					new drdelambre.default.Textarea(inps.eq(3),{ defaultText: '', enter: this.send });
					this.element.find('.button').bind('mousedown', this.send);
				},
				toggle : function(){
					var elem = this.element.find('.sign-up');
					if(elem.css('display') == 'none'){
						elem.slideDown(300);
						elem.css({ color: '#000' });
						this.element.find('.button span').animate({
							opacity: 0
						},{ duration: 300, complete:function(){
							$(this).html('<span>sign</span><span class="back">up</span>').css({ opacity: ''});
						}});
					} else {
						elem.slideUp(300);
						elem.css({ color: '' });
						this.element.find('.button span:first').animate({
							opacity: 0
						},{ duration: 300, complete:function(){
							$(this).html('login').css({ opacity: ''});
						}});
					}
				},
				validate : function(){
					var err = false;
					var inps = this.element.find('.input-wrap input');
					if(inps.eq(0).closest('.input-wrap').is('.unchanged') || !inps.eq(0).val().length){
						inps[0].inst.error('email required');
						err = true;
					}
					if(inps.eq(1).closest('.input-wrap').is('.unchanged') || !inps.eq(1).val().length){
						inps[1].inst.error('password required');
						err = true;
					}
					if(this.element.find('.sign-up').css('display') != 'none'){
						if(inps.eq(2).closest('.input-wrap').is('.unchanged') || !inps.eq(2).val().length){
							inps[2].inst.error('again');
							err = true;
						} else if(inps.eq(2).val().length && inps.eq(2).val() != inps.eq(1).val()){
							inps[2].inst.error('passwords don\'t match');
							err = true;
						}
						if(inps.eq(3).closest('.input-wrap').is('.unchanged') || !inps.eq(3).val().length){
							inps[3].inst.error('name required');
							err = true;
						}
					}
					return !err;
				},
				send : function(){
					if(!this.validate()) return;
					var inps = this.element.find('.input-wrap input');
					var data = {
						type: 'user',
						request: 'login',
						email: inps.eq(0).val(),
						password: this.md5(inps.eq(1).val())
					};
					inps.eq(1)[0].inst.reset();
					
					if(this.element.find('.sign-up').css('display') != 'none'){
						data.request = "signup";
						data.name = inps.eq(3).val();
					}
					
					var retFunc = function(json){
						if(!json || !json.status || json.status!='success'){
							this.element.find('.input-wrap:first input')[0].inst.error(json.error);
							return;
						}
						drdelambre.publish('/login', [json]);
					};

					$.ajax({ url: URL_BASE + '/json', data: JSON.stringify(data), context: this, success: retFunc });
				},
				
				md5 : function(a){
					function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),a.length*8))}
					function rstr2hex(c){try{hexcase}catch(g){hexcase=0}var f=hexcase?"0123456789ABCDEF":"0123456789abcdef";var b="";var a;for(var d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15)}return b}
					function str2rstr_utf8(c){var b="";var d=-1;var a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++}if(a<=127){b+=String.fromCharCode(a)}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63))}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63))}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63))}}}}}return b}
					function rstr2binl(b){var a=Array(b.length>>2);for(var c=0;c<a.length;c++){a[c]=0}for(var c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(c%32)}return a}
					function binl2rstr(b){var a="";for(var c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(c%32))&255)}return a}
					function binl_md5(p,k){p[k>>5]|=128<<((k)%32);p[(((k+64)>>>9)<<4)+14]=k;var o=1732584193;var n=-271733879;var m=-1732584194;var l=271733878;for(var g=0;g<p.length;g+=16){var j=o;var h=n;var f=m;var e=l;o=md5_ff(o,n,m,l,p[g+0],7,-680876936);l=md5_ff(l,o,n,m,p[g+1],12,-389564586);m=md5_ff(m,l,o,n,p[g+2],17,606105819);n=md5_ff(n,m,l,o,p[g+3],22,-1044525330);o=md5_ff(o,n,m,l,p[g+4],7,-176418897);l=md5_ff(l,o,n,m,p[g+5],12,1200080426);m=md5_ff(m,l,o,n,p[g+6],17,-1473231341);n=md5_ff(n,m,l,o,p[g+7],22,-45705983);o=md5_ff(o,n,m,l,p[g+8],7,1770035416);l=md5_ff(l,o,n,m,p[g+9],12,-1958414417);m=md5_ff(m,l,o,n,p[g+10],17,-42063);n=md5_ff(n,m,l,o,p[g+11],22,-1990404162);o=md5_ff(o,n,m,l,p[g+12],7,1804603682);l=md5_ff(l,o,n,m,p[g+13],12,-40341101);m=md5_ff(m,l,o,n,p[g+14],17,-1502002290);n=md5_ff(n,m,l,o,p[g+15],22,1236535329);o=md5_gg(o,n,m,l,p[g+1],5,-165796510);l=md5_gg(l,o,n,m,p[g+6],9,-1069501632);m=md5_gg(m,l,o,n,p[g+11],14,643717713);n=md5_gg(n,m,l,o,p[g+0],20,-373897302);o=md5_gg(o,n,m,l,p[g+5],5,-701558691);l=md5_gg(l,o,n,m,p[g+10],9,38016083);m=md5_gg(m,l,o,n,p[g+15],14,-660478335);n=md5_gg(n,m,l,o,p[g+4],20,-405537848);o=md5_gg(o,n,m,l,p[g+9],5,568446438);l=md5_gg(l,o,n,m,p[g+14],9,-1019803690);m=md5_gg(m,l,o,n,p[g+3],14,-187363961);n=md5_gg(n,m,l,o,p[g+8],20,1163531501);o=md5_gg(o,n,m,l,p[g+13],5,-1444681467);l=md5_gg(l,o,n,m,p[g+2],9,-51403784);m=md5_gg(m,l,o,n,p[g+7],14,1735328473);n=md5_gg(n,m,l,o,p[g+12],20,-1926607734);o=md5_hh(o,n,m,l,p[g+5],4,-378558);l=md5_hh(l,o,n,m,p[g+8],11,-2022574463);m=md5_hh(m,l,o,n,p[g+11],16,1839030562);n=md5_hh(n,m,l,o,p[g+14],23,-35309556);o=md5_hh(o,n,m,l,p[g+1],4,-1530992060);l=md5_hh(l,o,n,m,p[g+4],11,1272893353);m=md5_hh(m,l,o,n,p[g+7],16,-155497632);n=md5_hh(n,m,l,o,p[g+10],23,-1094730640);o=md5_hh(o,n,m,l,p[g+13],4,681279174);l=md5_hh(l,o,n,m,p[g+0],11,-358537222);m=md5_hh(m,l,o,n,p[g+3],16,-722521979);n=md5_hh(n,m,l,o,p[g+6],23,76029189);o=md5_hh(o,n,m,l,p[g+9],4,-640364487);l=md5_hh(l,o,n,m,p[g+12],11,-421815835);m=md5_hh(m,l,o,n,p[g+15],16,530742520);n=md5_hh(n,m,l,o,p[g+2],23,-995338651);o=md5_ii(o,n,m,l,p[g+0],6,-198630844);l=md5_ii(l,o,n,m,p[g+7],10,1126891415);m=md5_ii(m,l,o,n,p[g+14],15,-1416354905);n=md5_ii(n,m,l,o,p[g+5],21,-57434055);o=md5_ii(o,n,m,l,p[g+12],6,1700485571);l=md5_ii(l,o,n,m,p[g+3],10,-1894986606);m=md5_ii(m,l,o,n,p[g+10],15,-1051523);n=md5_ii(n,m,l,o,p[g+1],21,-2054922799);o=md5_ii(o,n,m,l,p[g+8],6,1873313359);l=md5_ii(l,o,n,m,p[g+15],10,-30611744);m=md5_ii(m,l,o,n,p[g+6],15,-1560198380);n=md5_ii(n,m,l,o,p[g+13],21,1309151649);o=md5_ii(o,n,m,l,p[g+4],6,-145523070);l=md5_ii(l,o,n,m,p[g+11],10,-1120210379);m=md5_ii(m,l,o,n,p[g+2],15,718787259);n=md5_ii(n,m,l,o,p[g+9],21,-343485551);o=safe_add(o,j);n=safe_add(n,h);m=safe_add(m,f);l=safe_add(l,e)}return Array(o,n,m,l)}
					function md5_cmn(h,e,d,c,g,f){return safe_add(bit_rol(safe_add(safe_add(e,h),safe_add(c,f)),g),d)}
					function md5_ff(g,f,k,j,e,i,h){return md5_cmn((f&k)|((~f)&j),g,f,e,i,h)}
					function md5_gg(g,f,k,j,e,i,h){return md5_cmn((f&j)|(k&(~j)),g,f,e,i,h)}
					function md5_hh(g,f,k,j,e,i,h){return md5_cmn(f^k^j,g,f,e,i,h)}
					function md5_ii(g,f,k,j,e,i,h){return md5_cmn(k^(f|(~j)),g,f,e,i,h)}
					function safe_add(a,d){var c=(a&65535)+(d&65535);var b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535)}
					function bit_rol(a,b){return(a<<b)|(a>>>(32-b))}
					return rstr2hex(rstr_md5(str2rstr_utf8(a)))
				}
			})
		};
		{/literal}</script>
	</head>
	<body>
		<div id="content-wrap">
			{if !$current_user}
			<div id="notice">
				<h1>notice:</h1>
				<div>this website uses html5 extensively. please make sure you have a recent version of <a href="https://www.google.com/chrome/" target="_blank">chrome</a> or <a href="http://www.mozilla.org/en-US/firefox/new/" target="_blank">firefox</a></div>
			</div>
			<div id="login">
				<div id="login-wrap">task demo</div>
				<div id="login-entry">
					<div id="login-speak">If you're just here to play around, try logging in with guest:guest</div>
					<div class="sign" style="opacity:0;">sign up</div>
					<div class="button"><span>login</span></div>
					<div style="overflow:hidden;margin-right:0.5em">
						<div class="row"><div class="title">email</div><div class="input-wrap"><input /></div></div>
						<div class="row"><div class="title">password</div><div class="input-wrap"><input /></div></div>
						<div class="sign-up" style="display:none;">
							<div class="row"><div class="title">again</div><div class="input-wrap"><input /></div></div>
							<div class="row"><div class="title">name</div><div class="input-wrap"><input /></div></div>
						</div>
					</div>
				</div>
			</div>
			{else}
			<div id="loading">loading content...</div>
			{/if}
			<div id="watermark">drdelambreLabs</div>
		</div>
		<canvas id="background"></canvas>
	</body>
	<script type="text/javascript">{literal}
		if($('#login').length){
			if(window.location.hash) window.location.hash = '';
			new drdelambre.login.login('#login');
			$('#login .input-wrap:first input').focus();
			drdelambre.subscribe('/login', function(){
				$('#login').animate({ opacity: 0.5 },{ duration: 150 });
				drdelambre.toggleContext('#tasks');
			});
			setTimeout(function(){
				new drdelambre.default.Background('#background');
			},450);
		} else {
			if(!window.location.hash) window.location.hash = '#tasks';
			$(window).load(function(){
				new drdelambre.default.Background('#background');
				drdelambre.toggleContext(window.location.hash);
			});
		}
	{/literal}</script>
</html>
