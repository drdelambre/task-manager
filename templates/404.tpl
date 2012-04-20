<html>
<head>
	<title>{$page_title}: 404 error</title>
	<link rel="stylesheet" href="{$url_base}/css/error.css" type="text/css">
	<script type="text/javascript" src="{$url_base}/js/jquery.js"></script>
	<script type="text/javascript" src="{$url_base}/js/jquery.color.js"></script>
	<script type="text/javascript" src="{$url_base}/js/error.js"></script>
	<script type="text/javascript"> var URL_BASE = "{$url_base}"; </script>
</head>
<body>
<div id="wall">
{foreach from=$studs item=curr}
	<div class="name">{$curr.name}</div>
{/foreach}
</div>
<div id="errorMessage">
	<table><tbody>
		<tr>
			<td id="leftCont">
				<div>...something broke</div>
				you've reached another dark corner of the internet. to be honest, this shouldn't have happened. but now that we've got you here, sign our wall! and once you're done, follow this link <a href="{$url_base}/">back out of the underworld</a>
			</td>
			<td id="rightCont">error code<div>404</div></td>
		</tr>
		<tr><td id="nameCont" colspan="2">
			<div id="nameWrap">
				<input type="hidden" value="{$url}">
				<div>your name</div>
				<div class="inputWrap"><input></div>
				<div class="button">send to wall</div>
			</div>
		</td></tr>
	</tbody></table>
</div>
</body>
</html>
