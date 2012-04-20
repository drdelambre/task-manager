<?php
function smarty_modifier_clean_message($string)
{
	$string = "<p>" . $string . "</p>";
	$string = str_replace('\n', "</p><p>", $string);
	return $string;
}
?>
