<?php
function smarty_function_calendar($params, &$smarty){
	if(!array_key_exists('_calendar', $user)) $user->_calendar = array('timestamp' => time());
	$time = explode(':', date('H:i:s:n:Y', $user->_calendar['timestamp']));
	$output = '<div class="cal_wrap" style=""><div class="cal_month_head">' .
				'<div class="cal_month_nav_left"><img src="' . PROJECT_BASE_URL . '/images/prev.png"></div>' . 
				'<div class="cal_month_nav_right"><img src="' . PROJECT_BASE_URL . '/images/next.png"></div>' .
				'<div class="cal_month"><h3>' . date('F') . '</h3><span>' . date('Y') . '</span></div></div>';

	$firstDay = mktime($time[0],$time[1],$time[2],$time[3],1,$time[4]);
	$lastDay = mktime($time[0],$time[1],$time[2],$time[3] + 1,0,$time[4]);
	
	$week = date('W') - date('W', mktime(date('H'), date('i'), date('s'), date('n'), 1));

	if(date('w', $firstDay) == 0) $pre = 0;
	else $pre = date('j', strtotime('last sunday', $firstDay));

	if(date('W') == date('W', $firstDay)) $output .= '<div class="cal_week curr_week">';
	else $output .= '<div class="cal_week">';

	$ni = 0;
	for(; $ni < date('w', $firstDay); $ni++)
		$output .= '<div class="cal_day other_month">' . ($pre + $ni) . '</div>';
	for($ni = 0; $ni < date('j',$lastDay); $ni++){
		$today = mktime($time[0],$time[1],$time[2],$time[3],$ni+1,$time[4]);

		if(date('w', $today) == 0){
			$output .= "</div><div class=\"cal_week" .
				((date('W', strtotime('monday', $today)) - (!date('w')?1:0)) - date('W', $firstDay) == $week?' curr_week':'') .
				((date('j', $lastDay) - $ni < 7)?' last_week':'') . "\">";
		}

		$output .= '<div class="cal_day' .
			(date('w', $today) == 6?' last_day':'') .
			(date('m-d-Y') == date('m-d-Y', $today)?' today':'') . '">' . ($ni + 1) . '</div>';
	}
	$ni = 7 - ($ni + date('w', $firstDay)) % 7;
	for($no = 1;$no <= $ni;$no++)
		$output .= '<div class="cal_day other_month' . ($no==$ni?' last_day':'') . '">' . $no . '</div>';
	
	$output .= "</div></div>";
	print $output;
}
?>
