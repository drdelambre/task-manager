<?php
function smarty_function_calendar_ticker($params, &$smarty){
	$events = json_decode($params['events']);

	$output = '<div class="calendar-ticker"><div class="cal-ticker-inner">';
	$zoneDiff = $_SESSION['timezone'];
	$date = floor(($params['start'] + $zoneDiff)/86400)*86400 - $zoneDiff;
	$firstTime = true;
	foreach($events as $evt){
		$day = floor(($evt->{'date'} + $zoneDiff)/86400)*86400 - $zoneDiff;
		if($date != $day){
			if($firstTime)
				$firstTime = false;
			else {
				$date += 86400;
				$output .= '</div>';
			}

			$dayDiff = floor(($day - $date)/86400);

			if($dayDiff > 1){
				$output .= '<div class="cal-more"><div class="cal-more-inner" style="display:none;">';
				for($ni = 0; $ni < $dayDiff; $ni++){
					$tmpDay = $date + (86400*$ni);
					$output .= '<div class="cal-date"><div class="cal-head"><input type="hidden" value="' . $tmpDay . '" /><div class="cal-add">+</div><h1>' . date('l', $tmpDay) . '</h1>' . date('F', $tmpDay) . ' ' . date('jS', $tmpDay) . '</div><div class="cal-add-menu" style="display:none;"><div class="input-wrap"><textarea></textarea></div><div class="cal-time">12:00<span>am</span></div><div class="time-picker"><div class="slider"><div class="slide-handle"></div></div><div class="meridian">am</div><div class="meridian">pm</div></div><div class="cal-save">save</div></div></div>';
				}
				$output .= '</div><div class="cal-more-handle"><span></span><span></span><span></span></div></div>';
			} else if($dayDiff == 1)
				$output .= '<div class="cal-date"><div class="cal-head"><input type="hidden" value="' . $date . '" /><div class="cal-add">+</div><h1>' . date('l', $date) . '</h1>' . date('F', $date) . ' ' . date('jS', $date) . '</div><div class="cal-add-menu" style="display:none;"><div class="input-wrap"><textarea></textarea></div><div class="cal-time">12:00<span>am</span></div><div class="time-picker"><div class="slider"><div class="slide-handle"></div></div><div class="meridian">am</div><div class="meridian">pm</div></div><div class="cal-save">save</div></div></div>';

			$date = $day;
			$output .= '<div class="cal-date"><div class="cal-head"><input type="hidden" value="' . $date . '" /><div class="cal-add">+</div><h1>' . date('l', $date) . '</h1>' . date('F', $date) . ' ' . date('jS', $date) . '</div><div class="cal-add-menu" style="display:none;"><div class="input-wrap"><textarea></textarea></div><div class="cal-time">12:00<span>am</span></div><div class="time-picker"><div class="slider"><div class="slide-handle"></div></div><div class="meridian">am</div><div class="meridian">pm</div></div><div class="cal-save">save</div></div>';
		}

		$output .=	'<div class="cal-entry"><div class="cal-time">' . date('g:i', $evt->{'date'}) . '<span>' . date('a', $evt->{'date'}) . '</span></div>' .
					'<div class="cal-action"><div class="button">edit</div></div><div class="cal-body">' .
					'<div class="project"><a href="#">' . $evt->{'project'} . '</a></div><div class="details">' . $evt->{'text'} . '</div></div></div>';
	}
	
	$end = floor(($params['end'] + $zoneDiff)/86400)*86400 - $zoneDiff;
	print "< " . date('m-d-Y H:i:s', $end) . " >";
	$date += 86400;
	$dayDiff = floor(($end - $date)/86400);
	if($dayDiff > 1){
		$output .= '</div><div class="cal-more"><div class="cal-more-inner" style="display:none;">';
		for($ni = 0; $ni < $dayDiff; $ni++){
			$tmpDay = $date + (86400*$ni);
			$output .= '<div class="cal-date"><div class="cal-head"><input type="hidden" value="' . $tmpDay . '" /><div class="cal-add">+</div><h1>' . date('l', $tmpDay) . '</h1>' . date('F', $tmpDay) . ' ' . date('jS', $tmpDay) . '</div><div class="cal-add-menu" style="display:none;"><div class="input-wrap"><textarea></textarea></div><div class="cal-time">12:00<span>am</span></div><div class="time-picker"><div class="slider"><div class="slide-handle"></div></div><div class="meridian">am</div><div class="meridian">pm</div></div><div class="cal-save">save</div></div></div>';
		}
		$output .= '</div><div class="cal-more-handle"><span></span><span></span><span></span></div>';
	} else if($dayDiff == 1)
		$output .= '</div><div class="cal-date"><div class="cal-head"><input type="hidden" value="' . $date . '" /><div class="cal-add">+</div><h1>' . date('l', $date) . '</h1>' . date('F', $date) . ' ' . date('jS', $date) . '</div><div class="cal-add-menu" style="display:none;"><div class="input-wrap"><textarea></textarea></div><div class="cal-time">12:00<span>am</span></div><div class="time-picker"><div class="slider"><div class="slide-handle"></div></div><div class="meridian">am</div><div class="meridian">pm</div></div><div class="cal-save">save</div></div>';
	
	$output .= '</div></div></div>';
	print $output;
}
?>
