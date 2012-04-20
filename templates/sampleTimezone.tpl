<html>
<head>
	<script type="text/javascript" src="{$url_base}/js/jquery.js"></script>
</head>
<body>
</body>
{literal}
<script type="text/javascript">
	$.ajaxSetup({
		url: "./sample/json",
		type: "POST",
		processData: false,
		dataType: "json",
	});
	
	$.ajax({ data: JSON.stringify({
		type: 'user',
		request: 'timezone',
		timezone: (new Date().getTimezoneOffset())*-60
	}), context: this, success: function(){
		window.location = "./sample";
	}});
</script>
{/literal}
</html>