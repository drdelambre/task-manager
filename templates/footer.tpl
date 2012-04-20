<link class="footer" rel="stylesheet" type="text/css" href="{$url_base}/css/footer.css" />
<div id="header">
	<div class="disclaimer"><div class="demo">this is just a<span>demo</span></div><a id="logout" href="{$url_base}/logout">logout</a><div class="sub">but there would normally be user related actions here, like changing your information/password/preferences</div></div>
	<div id="user-info"><span>logged in as</span>{$current_user->email}</div>
</div>
<div id="inner-wrap">
	<div id="right-bar"></div>
	<div id="content"></div>
</div>
<div id="bug-reporter" style="display:none;">
	<div class="title">description<div>what led up to this bug, what'd you expect to happen, and what happened?</div></div>
	<div class="input-wrap"><textarea></textarea></div>
	<div class="hint">you can drag this box around and select portions of the screen for us to focus on</div>
</div>
<div id="footer" style="position:absolute;">
	<div class="buttons">
		<div class="button">report a bug</div>
	</div>
	<div id="actions"><div id="actions-wrap">
		<div class="button inactive"><input type="hidden" value="#people"/>people</div><!--
		--><div class="button inactive"><input type="hidden" value="#tasks"/>tasks</div><!--
		--><div class="button inactive"><input type="hidden" value="#files"/>files</div><!--
		--><div class="button inactive last"><input type="hidden" value="#invoice"/>invoice</div><!--
		--><div class="timer">
			<div class="header">timer</div>
			<div class="reset">reset</div>
			<span>00.000</span>
		</div>
	</div></div>
	<div id="name"><a href="http://creativecommons.org/licenses/by-nc-sa/3.0/" target="_blank"><img src="{$url_base}/images/cc.png" /></a><a class="resume" href="{$url_base}/boatwrightResume.pdf" target="_blank">drdelambreLabs</a></div>
</div>
