<?php
function smarty_function_sample_calendar($params, &$smarty){
	$start = time();
	if($params['start']) $start = $params['start'];

	$events = array();
	$zoneDiff = $_SESSION['timezone'];
	foreach(json_decode($params['events']) as $evt)
		$events[floor(($evt->{'date'} + $zoneDiff)/86400)*86400 - $zoneDiff] = true;

	$time = explode(':', date('H:i:s:n:Y', $start));
	$output =	'<div class="calendar"><div class="cal-inner"><div class="cal-nav">' .
				'<div class="cal-nav-buttons"><div class="cal-prev">&lt;</div>' .
				'<div class="cal-curr">today</div><div class="cal-next">&gt;</div>' .
				'</div><div class="cal-month">' . date('M', $start) . ' ' . date('Y', $start) . '</div></div><div class="cal-week-header">' .
				'<div class="cal-day">S</div><div class="cal-day">M</div><div class="cal-day">T</div>' .
				'<div class="cal-day">W</div><div class="cal-day">T</div><div class="cal-day">F</div>' .
				'<div class="cal-day">S</div></div><div class="cal-slide-wrap">';

	$firstDay = mktime(0,0,0,$time[3],1,$time[4]);
	$lastDay = mktime(0,0,0,$time[3] + 1,0,$time[4]);
	
	$week = date('W') - date('W', mktime(date('H'), date('i'), date('s'), date('n'), 1));

	if(date('w', $firstDay) == 0) $pre = 0;
	else $pre = date('j', strtotime('last sunday', $firstDay));

	$output .= '<div class="cal-week">';

	$ni = 0;
	for(; $ni < date('w', $firstDay); $ni++)
		$output .= '<div class="cal-day cal-null">' . ($pre + $ni) . '</div>';
	for($ni = 0; $ni < date('j',$lastDay); $ni++){
		$today = mktime(0,0,0,$time[3],$ni+1,$time[4]);
		$now = floor((time() + $zoneDiff)/86400)*86400 - $zoneDiff;

		if(date('w', $today) == 0) $output .= "</div><div class=\"cal-week\">";

		$output .= '<div class="cal-day' . ($events[$today]?' cal-active':'') . ($now == $today?' cal-today':'') . '">' . ($ni + 1) . '</div>';
	}

	$ni = (7 - (($ni + date('w', $firstDay)) %7))%7;
	for($no = 1;$no <= $ni;$no++)
		$output .= '<div class="cal-day cal-null">' . $no . '</div>';
	
	$output .= "</div></div></div></div>";
	print $output;
}
?>
