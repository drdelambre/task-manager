<?php
function smarty_function_add_event($params, &$smarty){
	$output = "";
	if(!is_array($params['event'])) $params['event'] = array($params['event']);
	foreach($params['event'] as $evt){
		$backcolor = preg_replace('[#]', '', $evt->calendar->color);
		$topcolor = color_sub($backcolor, '333333');

		$start_time_g = explode(':', $evt->starttime);
		$start_time = mktime($start_time_g[0],$start_time_g[1],$start_time_g[2]);
		$end_time_g = explode(':', $evt->endtime);
		$end_time = mktime($end_time_g[0],$end_time_g[1],$end_time_g[2]);
		if($end_time < $start_time){
			$output .= "<!-- offtime: " . $evt->starttime . " vs " . $evt->endtime . " -->";
			$next = ($end_time - mktime(0,0,0))/600;
			$end_time = mktime(23,59,59);
		}
		$height = ($end_time - $start_time) / 600;
		$top = ($start_time - mktime(0,0,0)) / 600;

		if($start_time_g[1] == '00') $start_f = 'ga';
		else $start_f = 'g:ia';

		if($end_time_g[1] == '00') $end_f = 'ga';
		else $end_f = 'g:ia';

		if($evt->repeats == 0){
			$left = 14.285714 * date('w', strtotime($evt->startdate));
			$output .= "<div class=\"event\" style=\"top:" . $top . "ex;left:" . $left . "%; border: 1px solid #" . $topcolor . "; background: #" . $backcolor . "\">
				<div class=\"event_body\" style=\"height:" . $height . "ex;background:#" . $backcolor . ";\">
					<input type=\"hidden\" value=\"" . $evt->id . "\">
					<input type=\"hidden\" value=\"0\">
					<input type=\"hidden\" value=\"" . $evt->calendar_id . "\">
					<div class=\"event_name\" style=\"background:#" . $topcolor . ";\"><div class=\"button\">x</div> </div>"; //<span>" . rtrim(date($start_f, $start_time), 'm') . "</span>-<span>" . rtrim(date($end_f, $end_time), 'm') . "</span></div>
			$output .= "<div class=\"event_description\">" . $evt->name . "</div>\n";
				if(!isset($next)) $output .= "<div class=\"event_drag\"><img src=\"" . PROJECT_BASE_URL . "/images/drag.gif\" /></div>";
			$output .= "</div>
			</div>\n";
		} else {
			for($ni = 0; $ni < 7; $ni++){
				if(!(($evt->repeats >> $ni) & 0x01)) continue;
				$left = 14.285714 * $ni;
				$output .= "<div class=\"event\" style=\"top:" . $top . "ex;left:" . $left . "%; border: 1px solid #" . $topcolor . "; background: #" . $backcolor . "\">
					<div class=\"event_body\" style=\"height:" . $height . "ex;background:#" . $backcolor . ";\">
						<input type=\"hidden\" value=\"" . $evt->id . "\">
						<input type=\"hidden\" value=\"" . $ni . "\">
						<input type=\"hidden\" value=\"" . $evt->calendar_id . "\">
						<div class=\"event_name\" style=\"background:#" . $topcolor . ";\"><div class=\"button\">x</div> </div>"; //<span>" . rtrim(date($start_f, $start_time), 'm') . "</span>-<span>" . rtrim(date($end_f, $end_time), 'm') . "</span></div>
				$output .= "<div class=\"event_description\">" . $evt->name . "</div>\n";
					if(!isset($next)) $output .= "<div class=\"event_drag\"><img src=\"" . PROJECT_BASE_URL . "/images/drag.gif\" /></div>";
				$output .= "</div>
				</div>\n";
				if(isset($next))
					$output .= "<div class=\"event\" style=\"top:0ex;left:" . ($left + 14.2857) . "%;\">
					<div class=\"event_body\" style=\"height:" . $next . "ex;background:#" . $backcolor . ";\">
						<input type=\"hidden\" value=\"" . $evt->id . "\">
						<div class=\"event_name\" style=\"background:#" . $topcolor . ";\"><span>" . rtrim(date($start_f, $start_time), 'm') . "</span>-<span>" . rtrim(date($end_f, $end_time), 'm') . "</span></div>
						<div class=\"event_description\">" . $evt->name . "</div>
						<div class=\"event_drag\"><img src=\"" . PROJECT_BASE_URL . "/images/drag.gif\" /></div>
					</div>
					</div>\n";
			}
		}
	}
	print $output;
}

function color_sub($colorOne, $colorTwo){
	$colorOne = preg_replace('[#]', '', $colorOne);
	$colorTwo = preg_replace('[#]', '', $colorTwo);
	$colorOne = preg_replace('[^a-fA-F0-9]', '', $colorOne);
	$colorTwo = preg_replace('[^a-fA-F0-9]', '', $colorTwo);
	if(strlen($colorOne) == 3){
		$color = str_split($colorOne);
		$colorOne = $color[0] . $color[0] . $color[1] . $color[1] . $color[2] . $color[2];
	} else if(strlen($colorOne) != 6) return;

	if(strlen($colorTwo) == 3){
		$color = str_split($colorTwo);
		$colorTwo = $color[0] . $color[0] . $color[1] . $color[1] . $color[2] . $color[2];
	} else if(strlen($colorTwo) != 6) return;

	$color = str_split($colorOne, 2);
	$color_s = str_split($colorTwo, 2);
	$red = hexdec($color[0]) - hexdec($color_s[0]);
	$green = hexdec($color[1]) - hexdec($color_s[1]);
	$blue = hexdec($color[2]) - hexdec($color_s[2]);

	return ($red<0?'00':str_pad(dechex($red),2,'0',STR_PAD_LEFT)) . ($green<0?'00':str_pad(dechex($green),2,'0',STR_PAD_LEFT)) . ($blue<0?'00':str_pad(dechex($blue),2,'0',STR_PAD_LEFT));
}

?>
