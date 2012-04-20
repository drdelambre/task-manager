<?php
class LoremIpsum {
	private static $words = array(
		'lorem',
		'ipsum',
		'dolor',
		'sit',
		'amet',
		'consectetur',
		'adipiscing',
		'elit',
		'curabitur',
		'vel',
		'hendrerit',
		'libero',
		'eleifend',
		'blandit',
		'nunc',
		'ornare',
		'odio',
		'ut',
		'orci',
		'gravida',
		'imperdiet',
		'nullam',
		'purus',
		'lacinia',
		'a',
		'pretium',
		'quis',
		'congue',
		'praesent',
		'sagittis',
		'laoreet',
		'auctor',
		'mauris',
		'non',
		'velit',
		'eros',
		'dictum',
		'proin',
		'accumsan',
		'sapien',
		'nec',
		'massa',
		'volutpat',
		'venenatis',
		'sed',
		'eu',
		'molestie',
		'lacus',
		'quisque',
		'porttitor',
		'ligula',
		'dui',
		'mollis',
		'tempus',
		'at',
		'magna',
		'vestibulum',
		'turpis',
		'ac',
		'diam',
		'tincidunt',
		'id',
		'condimentum',
		'enim',
		'sodales',
		'in',
		'hac',
		'habitasse',
		'platea',
		'dictumst',
		'aenean',
		'neque',
		'fusce',
		'augue',
		'leo',
		'eget',
		'semper',
		'mattis',
		'tortor',
		'scelerisque',
		'nulla',
		'interdum',
		'tellus',
		'malesuada',
		'rhoncus',
		'porta',
		'sem',
		'aliquet',
		'et',
		'nam',
		'suspendisse',
		'potenti',
		'vivamus',
		'luctus',
		'fringilla',
		'erat',
		'donec',
		'justo',
		'vehicula',
		'ultricies',
		'varius',
		'ante',
		'primis',
		'faucibus',
		'ultrices',
		'posuere',
		'cubilia',
		'curae',
		'etiam',
		'cursus',
		'aliquam',
		'quam',
		'dapibus',
		'nisl',
		'feugiat',
		'egestas',
		'class',
		'aptent',
		'taciti',
		'sociosqu',
		'ad',
		'litora',
		'torquent',
		'per',
		'conubia',
		'nostra',
		'inceptos',
		'himenaeos',
		'phasellus',
		'nibh',
		'pulvinar',
		'vitae',
		'urna',
		'iaculis',
		'lobortis',
		'nisi',
		'viverra',
		'arcu',
		'morbi',
		'pellentesque',
		'metus',
		'commodo',
		'ut',
		'facilisis',
		'felis',
		'tristique',
		'ullamcorper',
		'placerat',
		'aenean',
		'convallis',
		'sollicitudin',
		'integer',
		'rutrum',
		'duis',
		'est',
		'etiam',
		'bibendum',
		'donec',
		'pharetra',
		'vulputate',
		'maecenas',
		'mi',
		'fermentum',
		'consequat',
		'suscipit',
		'aliquam',
		'habitant',
		'senectus',
		'netus',
		'fames',
		'quisque',
		'euismod',
		'curabitur',
		'lectus',
		'elementum',
		'tempor',
		'risus',
		'cras' );

	public static function generate($count, $wpp = 100, $wps = 24.460){
		$wordList = self::getWords($count);
		
		$delta = $count;
		$curr = 0;
		$sentences = array();
		while($delta > 0){
			$senSize = self::gaussianSentence();
			if(($delta - $senSize) < 4)
				$senSize = $delta;

			$delta -= $senSize;
			
			$sentence = array();
			for($i = $curr; $i < ($curr + $senSize); $i++)
				$sentence[] = $wordList[$i];

			$ni = count($sentence);
			$sentence[$ni - 1] .= '.';
		
			$commas = self::numberOfCommas($count);
		
			for($i = 1; $i <= $commas; $i++){
				$index = (int)round($i * $ni / ($commas + 1));
			
				if($index < ($ni - 1) && $index > 0)
					$sentence[$index] .= ',';
			}

			$curr = $curr + $senSize;
			$sentences[] = $sentence;
		}
		
		$paragraphs = self::getParagraphArr($sentences, $wpp, $wps);
		
		$paragraphStr = array();
		foreach($paragraphs as $p){
			$paragraphString = '';
			foreach($p as $sentence)
				$paragraphString .= ucfirst(implode(' ', $sentence)) . ' ';

			$paragraphStr[] = $paragraphString;
		}
		
		return "\t" . implode("\n\t", $paragraphStr);
	}
	
	private static function getWords($count){
		$arr = array();
		$i = 2;
		$arr[0] = 'lorem';
		$arr[1] = 'ipsum';
		
		for($i; $i < $count; $i++){
			$index = array_rand(self::$words);
			$word = self::$words[$index];

			if($i > 0 && $arr[$i - 1] == $word)
				$i--;
			else
				$arr[$i] = $word;
		}
		
		return $arr;
	}
	
	private static function getParagraphArr($sentences, $wpp, $wps){
		$total = count($sentences);
		
		$paragraphs = array();
		$pCount = 0;
		$currCount = 0;
		$curr = array();
		
		for($i = 0; $i < $total; $i++){
			$s = $sentences[$i];
			$currCount += count($s);
			$curr[] = $s;
			if($currCount >= ($wpp - round($wps / 2.00)) || $i == $total - 1){
				$currCount = 0;
				$paragraphs[] = $curr;
				$curr = array();
			}
		}
		
		return $paragraphs;
	}
	
	private static function numberOfCommas($len){
		$avg = (float) log($len, 6);
		$stdDev = (float) $avg / 6.000;
		
		$x = self::random_0_1();
		$y = self::random_0_1();
		
		$u = sqrt(-2*log($x))*cos(2*pi()*$y);

		return (int) round($u * $stdDev + $avg);
	}
	
	private static function gaussianSentence(){
		$avg = (float) 24.460;
		$stdDev = (float) 5.080;
		
		$x = self::random_0_1();
		$y = self::random_0_1();
		
		$u = sqrt(-2*log($x))*cos(2*pi()*$y);

		return (int) round($u * $stdDev + $avg);
	}
	
	private static function random_0_1(){
		return (float)rand()/(float)getrandmax();
	}

}
