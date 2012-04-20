<?php
function smarty_modifier_relative_time($time){
	$diff = time() - $time;
	$stamp = ' ago';
	if($diff < 0){
		$diff *= -1;
		$stamp = " from now";
	}

	if($diff < 10) return "just now";
	if($diff < 60) return $diff . " second" . ($diff == 1?'':'s') . $stamp;
	$diff = round($diff/60);
	if($diff < 60) return $diff . " minute" . ($diff == 1?'':'s') . $stamp;
	$diff = round($diff/60);
	if($diff < 24) return $diff . " hour" . ($diff == 1?'':'s') . $stamp;
	$diff = round($diff/24);
	if($diff < 7) return $diff . " day" . ($diff == 1?'':'s') . $stamp;
	$diff = round($diff/7);
	if($diff < 4) return $diff . " week" . ($diff == 1?'':'s') . $stamp;
	
	return date('M j, Y', strtotime($time));
}
?>
