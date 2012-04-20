setInterval(function(){
	$('.time').each(function(){
		var time = $(this).find('input').val();
		$(this).html('<input type="hidden" value="' + time + '">' + drdelambre.relativeTime(time));
	});
},10000);

var drdelambre = drdelambre || {
	default: {},
	cache: {},
	debug: true,
	unload : function(params){
		if(!params.style) return;
		var styles = $('head style.' + params.style + ', head link.' + params.style);
		if(!styles.length) return;
		styles[0].disabled = true;
	},
	load: function(params){
		var complete = [null,true];
		var templateDone = function(resp){
			complete[0] = $(resp);
			if(complete[1] && params.complete) params.complete(complete[0]);
		};
		
		var scriptDone = function(){
			complete[1] = true;
			if(complete[0]!==false && params.complete) params.complete(complete[0]);
		};

		var notFound = function(resp){
			drdelambre.toggleContext();
		};
	
		if(params.template){
			complete[0] = false;
			$.ajax({
				url: URL_BASE + '/template/' + params.template,
				success: templateDone,
				error: notFound,
				dataType: 'html'
			});
		}
			
		if(params.script){
			complete[1] = false;
			var url = URL_BASE + '/js/' + params.script + '.js';
			var s = document.createElement('script');
			s.type = 'text/javascript';
			s.async = true;
			s.src = url;
			document.head.appendChild(s);
			$(s).load(scriptDone).bind('error', notFound);
		}
	},
	
	publish : function(topic, args){
		if(Object.prototype.toString.apply(args) !== '[object Array]')
			args = [args];
	
		var cache = drdelambre.cache;
		for(var t in cache){
			if(topic.match(new RegExp(t)))
				$.each(cache[t], function(){
					this.apply($, args || []);
				});
		}
	},
	subscribe : function(topic, callback){
		var cache = drdelambre.cache;
		topic = '^' + topic.replace(/\*/,'.*');
		if(!cache[topic])
			cache[topic] = [];
		cache[topic].push(callback);
		return [topic, callback];
	},
	unsubscribe : function(handle){
		var cache = drdelambre.cache,
			t = handle[0];
		cache[t] && $.each(cache[t], function(idx){
			if(this == handle[1])
				cache[t].splice(idx, 1);
		});
	},
	class : function(proto){
		var fun = function(){
			if(!(this instanceof arguments.callee))
				throw "Object not called as constructor";
			for(var member in proto){
				if(typeof proto[member] != 'function')
					this[member] = proto[member];
				else
					this[member] = $.proxy(proto[member],this);
			}
			if(this.init) this.init.apply(this,arguments);
		};

		fun.prototype = proto || {};
		return fun;
	},
	relativeTime : function(time){
		var diff = ((new Date().getTime() / 1000) - time)&~0,
			rel = ' ago';
		if(diff < 0){
			rel = ' from now';
			diff *= -1;
		}
		if(diff < 10) return "just now";
		if(diff < 60) return diff + " second" + (diff == 1?'':'s') + rel;
		diff = (diff/60)&~0;
		if(diff < 60) return diff + " minute" + (diff == 1?'':'s') + rel;
		diff = (diff/60)&~0;
		if(diff < 24) return diff + " hour" + (diff == 1?'':'s') + rel;
		diff = (diff/24)&~0;
		if(diff < 7) return diff + " day" + (diff == 1?'':'s') + rel;
		diff = (diff/7)&~0;
		if(diff < 4) return diff + " week" + (diff == 1?'':'s') + rel;

		diff = new Date(time*1000);
		return (diff.getMonth()+1) + '-' + (diff.getDate()<10?'0'+diff.getDate():diff.getDate()) + '-' + diff.getFullYear();
	},
	
	loadState : function(hash){
		var oldhash;
		if(window.location.hash != hash){
			oldhash = window.location.hash;
			if(oldhash.length) oldhash = oldhash.substr(1);

			window.location.hash = hash;
			var actions = $('#actions-wrap .button').addClass('inactive');
			for(var ni = actions.length; ni != 0;){
				if(actions.eq(--ni).find('input').val() == hash)
					actions.eq(ni).removeClass('inactive');
			}
		}

		hash = hash.substr(1);

		var add = function(elem){
			if($('#content').children().length){
				var oc = $('#content'),
					nc = $('<div id="content"></div>');
				oc.after(nc);
				nc.append(elem);

				nc.css({
					height: oc.height(),
					width: oc.width()
				}).animate({
					top: 0 - oc.outerHeight(true)
				},{ duration: 600 });
				oc.animate({
					top: 0 - oc.outerHeight(true)
				},{ duration: 600, complete: function(){
					if(oldhash && oldhash.length) drdelambre.unload({ style: oldhash });
					oc.remove();
					nc.css({ top: '', width: '' });
				}});
			} else {
				$('#content').append(elem).css({
					opacity: 0
				}).animate({
					opacity: 1
				},{ duration: 600 });
			};

			drdelambre[hash].init();
		};

		drdelambre.load({
			template: hash,
			script: hash,
			complete: add
		});
	},
	
	toggleContext : function(state){
		if($('#content-wrap').length){	//error or login page exists
			var addCalendar = function(elem){
				$('#right-bar').append(elem);
				new drdelambre.calendar.Calendar('#right-bar .calendar');
				if($(window).width() > 640)
					$('#right-bar').css({
						right: 0-$('#right-bar').outerWidth(true)
					}).delay(400).animate({
						right: 0
					}, {duration: 500});
//				else $('#content').prepend($('#right-bar'));
			};
			var killIt = function(){
				drdelambre.unload({ style: 'login' });
				$('#content-wrap').remove();
				drdelambre.footer.init();
	
				drdelambre.load({
					template: 'calendar',
					script:'calendar',
					complete: addCalendar
				});
				
				drdelambre.loadState(state);

				$('#actions').css({
					display: '',
					bottom: '-2.4em'
				}).animate({
					bottom: '0'
				},{ duration: 500 });
				
				$('#header').css({ display: '' });
				var b = $('#user-info').css('bottom');
				$('#user-info').css({
					bottom: 0
				}).animate({ bottom: b }, { duration: 500, complete: function(){
					$(this).css({ bottom: '' });
				}});
			};
			var loaded = function(elem){
				$(document.body).append(elem);
				$('#header').css({ display: 'none' });
				$('#actions').css({ display: 'none' });
	
				var speed = 800;
				$('#background').css({
					top: $(window).height() * -0.2,
					position: 'absolute'
				}).animate({
					top: 0
				},{ duration: speed, easing: 'linear' });
	
				$('#footer').css({ bottom: $(window).height() }).animate({
					bottom: 0
				},{ duration: speed, easing: 'linear', complete: killIt });
				$('#content-wrap').animate({
					top: $(window).height()
				},{ duration: speed, easing: 'linear' });
			}
			drdelambre.load({
				template: 'footer',
				script: 'footer',
				complete: loaded
			});
		} else { //bring up error/login page
		}
	}
};

/****************************************************************************\

	function: ComplexMouse
		managing multimodal interaction is complicated, this makes it
		a litte easier

	params:
		options: an object defining the behaviour of the menu
			element: the element to monitor
			allowSelect: if false, document text selection is disabled

		// all of these callbacks take the mouse event as a parameter
			click: a callback function for when the element is clicked
			dblclick: a callback function for when the element is
				double clicked
			startMove: a callback function for when the element is starts
				to be dragged by the user
			onMove: a callback function for when the element is being
				dragged by the user
			endMove: a callback function for when the drag event has ended

	notes:

\***************************************************************************/
drdelambre.default.ComplexMouse = new drdelambre.class({
	init : function(options){
		this.data = {
			clickTimer: null,
			wait: false,
			moving: false,
			evt: null
		};
	
		this.options = $.extend({
			click : null,
			dblclick : null,
			start : null,
			move : null,
			end : null,
			
			element : null,
			allowSelect : false
		}, options);
		
		if(this.options.element){
			this.options.element = $(this.options.element);
			this.options.element.bind('mousedown', this.clickTrain);
			this.options.element.bind('touchstart', this.clickTrain);
		}
	},
	realDouble : function(evt){
		$(window).unbind('mouseup', this.realDouble);
		$(window).unbind('touchend', this.realDouble);
		if(this.options.dblclick) this.options.dblclick(evt);
		if(!this.options.allowSelect)
			$(document.body).css({
				'-moz-user-select': '',
				'-khtml-user-select': '',
				'user-select': ''
			});
		var sel = window.getSelection?window.getSelection():document.getSelection();
		sel.removeAllRanges();
	},
	clickTrain : function(evt){
		if(this.data.clickTimer != null){
			clearTimeout(this.data.clickTimer);
			this.data.clickTimer = null;
			this.data.wait = false;

			$(window).bind('mouseup', this.realDouble);
			$(window).bind('touchend', this.realDouble);
			return;
		}

		if(!this.options.allowSelect)
			$(document.body).css({
				'-moz-user-select': 'none',
				'-khtml-user-select': 'none',
				'user-select': 'none'
			});

		this.data.clickTimer = setTimeout($.proxy(function(){ this.clickTimeout(evt); }, this), 300);
		this.data.evt = evt;

		if(evt.type == 'touchstart'){
			if(this.options.element) this.options.element.unbind('mousedown', this.clickTrain);
			$(window).bind('gesturestart', this.killTouch);
			$(window).bind('touchmove', this.mouseMove);
			$(window).bind('touchend', this.killMove);
			evt.preventDefault();
			evt.stopPropagation();
		} else {
			$(window).bind('mousemove', this.mouseMove);
			$(window).bind('mouseup', this.killMove);
		}
	},
	clickTimeout : function(evt){
		if(this.data.wait){
			this.data.wait = false;
			if(this.options.click) this.options.click(this.data.evt);
			if(!this.options.allowSelect)
				$(document.body).css({
					'-moz-user-select': '',
					'-khtml-user-select': '',
					'user-select': ''
				});
		}

		this.data.clickTimer = null;
	},
	mouseMove : function(evt){
		if(this.data.clickTimer != null){
			clearTimeout(this.data.clickTimer);
			this.data.clickTimer = null;
		}
		
		if(evt.type == 'touchmove'){
			evt.preventDefault();
			evt.stopPropagation();
			evt = evt.originalEvent.touches[0] || evt.originalEvent.changedTouches[0];
		}
		if(!this.data.moving){
			this.data.moving = true;
			if(this.options.start && this.options.start(this.data.evt) === false) this.killMove(this.data.evt);
		} else if(this.options.move) this.options.move(evt);
	},
	killMove : function(evt){
		$(window).unbind('mousemove', this.mouseMove);
		$(window).unbind('touchmove', this.mouseMove);
		$(window).unbind('mouseup', this.killMove);
		$(window).unbind('touchend', this.killMove);
		if(this.data.moving){
			this.data.moving = false;
			if(this.options.end) this.options.end(evt);
			if(!this.options.allowSelect)
				$(document.body).css({
					'-moz-user-select': '',
					'-khtml-user-select': '',
					'user-select': ''
				});
		} else if(this.data.clickTimer == null){
			if(this.options.click) this.options.click(this.data.evt);
			if(!this.options.allowSelect)
				$(document.body).css({
					'-moz-user-select': '',
					'-khtml-user-select': '',
					'user-select': ''
				});
		} else this.data.wait = true;
	},
	killTouch : function(evt){
//		console.log('gesture!');
		$(window).unbind('gesturestart', this.killTouch);
		if(this.data.moving) this.killMove();
		else {
			$(window).unbind('touchmove', this.mouseMove);
			$(window).unbind('touchend', this.killMove);
			this.data.wait = false;
		}

		evt.preventDefault();
		evt.stopPropagation();
	},
	remove : function(){
		$(window).unbind('gesturestart', this.killTouch);
		$(window).unbind('mousemove', this.mouseMove);
		$(window).unbind('touchmove', this.mouseMove);
		$(window).unbind('mouseup', this.killMove);
		$(window).unbind('touchend', this.killMove);
		$(window).unbind('mouseup', this.realDouble);
		$(window).unbind('touchend', this.realDouble);
		if(this.options.element){
			this.options.element.unbind('mousedown', this.clickTrain);
			this.options.element.unbind('touchstart', this.clickTrain);
		}
	}
});

/****************************************************************************\

	function: Background
		draws a sunshine background, cause it's pretty

	params:
		elem: an optional canvas element to draw to

	notes:

\***************************************************************************/
drdelambre.default.Background = new drdelambre.class({
	element : null,
	offset : { x: 0, y: 0 },
	init : function(elem){
		if(!elem){
			elem = document.createElement('canvas');
			document.body.appendChild(elem);
		}
		
		this.element = $(elem);
		
		$(window).resize(this.draw);
		this.draw();
	},
	draw : function(){
		if(	this.element[0].width == $(window).width() &&
			this.element[0].height == $(window).height()) return;
		this.element[0].width = $(window).width();
		this.element[0].height = $(window).height();
		$(this.element).css({
			width: $(window).width(),
			height: $(window).height(),
			top: 0,
			left: 0,
			position: 'fixed',
			zIndex: 1
		});

		var canvas = document.createElement('canvas'),
			hatch = this.hatch($(window).width(),$(window).height());
		canvas.width = $(window).width();
		canvas.height = $(window).height();
		var ctx = canvas.getContext('2d');
		var vars = [ctx.canvas.width, ctx.canvas.width/4, ctx.canvas.height];
		var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, vars[0]);
//		grad.addColorStop(1, 'rgb(172, 211, 240)');
//		grad.addColorStop(0.5, 'rgb(82, 162, 214)');
		grad.addColorStop(0, 'rgb(255, 235, 102)');
//		grad.addColorStop(0.5, 'rgb(255, 221, 0)');
		grad.addColorStop(0.5, 'rgb(260, 150, 0)');
//		grad.addColorStop(1, 'rgb(240,162,0)');
		grad.addColorStop(1, 'rgb(250,100,0)');

		ctx.save();
			ctx.translate(vars[1], vars[2]);
			ctx.fillStyle = grad;
			ctx.fillRect(0-vars[1],0,vars[0],0-vars[2]);
		ctx.restore();

		ctx.globalAlpha = 0.5;
		ctx.drawImage(hatch,0,0);
		ctx.globalAlpha = 1;

		if(vars[0] < vars[2]) vars[0] = vars[2];
		var can = this.noise($(window).width()/1.5,$(window).height()/1.5,80);
		this.stackblur(can, 2);
	
		var canToo = document.createElement('canvas');
		canToo.width = $(window).width();
		canToo.height = $(window).height();
		var cntx = canToo.getContext('2d');

		grad = cntx.createRadialGradient(0, 0, 0, 0, 0, vars[0]);
//		grad.addColorStop(1, "rgba(82, 162, 214,0.1)");
//		grad.addColorStop(0.2, "rgba(172, 211, 240,0.3)");
		grad.addColorStop(0.5, "rgba(255, 215, 70,0.1)");
		grad.addColorStop(0.2, "rgba(255, 255, 130,0.3)");
		grad.addColorStop(0, "rgba(255,255,255,0)");

		cntx.translate(vars[1], vars[2] + 20);
		cntx.rotate(Math.PI/4);
		for(var ni = 0; ni < 10; ni++){
			cntx.rotate(Math.PI/8);

			cntx.beginPath();
			cntx.moveTo(-2,0);
			cntx.lineTo(-vars[0]/10, vars[0]);
			cntx.lineTo(-vars[0]/10 - 4, vars[0]);
			cntx.lineTo(-4, 0);
			cntx.closePath();
			cntx.fillStyle = "rgba(243, 175, 0,0.3)";
			cntx.fill();

			cntx.beginPath();
			cntx.moveTo(-2, 0);
			cntx.lineTo(-vars[0]/10, vars[0]);
			cntx.lineTo(vars[0]/10, vars[0]);
			cntx.lineTo(2, 0);
			cntx.closePath();
			cntx.fillStyle = grad;
			cntx.fill();
		}

		cntx.scale(1.5,1.5);
//		cntx.globalAlpha=0.3;
//		cntx.drawImage(can,0,0);
		cntx.scale(2/3,2/3);

		this.element[0].getContext('2d').drawImage(canvas,0,0);
		this.element[0].getContext('2d').drawImage(canToo,0,0);
	},
//	stall: function(evt){ $(window).unbind('resize', this.draw); },
//	start: function(evt){ $(window).bind('resize', this.draw); },
	noise : function(width,height,amount){
		var can = document.createElement('canvas');
		can.width = width;
		can.height = height;

		var layer = can.getContext('2d'), pixels;
		try { pixels = layer.getImageData(0, 0, layer.canvas.width, layer.canvas.height); } catch(e){};
		var rnd = Math.random,
			flr = Math.floor,
			amm = layer.canvas.width * (1-amount/100);
		for(var ni = 0,val, line=(4 * layer.canvas.width), data=pixels.data,length=pixels.data.length; ni < length;){
			data[ni++] = data[ni++] = data[ni++] = 0;
			data[ni++] = rnd()*255;
			ni += flr(rnd()/4)*line;
			ni += flr(rnd()*amm/4)*4;
		}
		layer.putImageData(pixels, 0, 0);
		return can;
	},
	stackblur : function(canvas, radius, direction){
		if(isNaN(radius) || radius < 1) return;
		radius |= 0;
		
		function BlurStack(){
			this.r = 0;
			this.g = 0;
			this.b = 0;
			this.a = 0;
			this.next = null;
		}
		var mul_table = [
				512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
				454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
				482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
				437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
				497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
				320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
				446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
				329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
				505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
				399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
				324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
				268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
				451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
				385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
				332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
				289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];
		var shg_table = [
				 9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 
				17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 
				19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
				20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
				21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
				21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 
				22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
				22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 
				23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
				23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
				23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 
				23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 
				24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
				24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
				24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
				24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

		var context = canvas.getContext("2d");
		var imageData;
		
		try {
			imageData = context.getImageData(0,0,context.canvas.width,context.canvas.height );
		} catch(e) {}
				
		var pixels = imageData.data;
				
		var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, 
		r_out_sum, g_out_sum, b_out_sum, a_out_sum,
		r_in_sum, g_in_sum, b_in_sum, a_in_sum, 
		pr, pg, pb, pa, rbs;
				
		var div = radius + radius + 1;
		var w4 = context.canvas.width << 2;
		var widthMinus1  = context.canvas.width - 1;
		var heightMinus1 = context.canvas.height - 1;
		var radiusPlus1  = radius + 1;
		var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;
		
		var stackStart = new BlurStack();
		var stack = stackStart;
		for (i = 1; i < div; i++){
			stack = stack.next = new BlurStack();
			if ( i == radiusPlus1 ) var stackEnd = stack;
		}
		stack.next = stackStart;
		var stackIn = null;
		var stackOut = null;
		
		yw = yi = 0;
		
		var mul_sum = mul_table[radius];
		var shg_sum = shg_table[radius];

		if(direction != 'vertical'){
			for(y = 0; y < context.canvas.height; y++ ){
				r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
				
				r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
				g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
				b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
				a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );
				
				r_sum += sumFactor * pr;
				g_sum += sumFactor * pg;
				b_sum += sumFactor * pb;
				a_sum += sumFactor * pa;
				
				stack = stackStart;
				
				for(i = 0; i < radiusPlus1; i++){
					stack.r = pr;
					stack.g = pg;
					stack.b = pb;
					stack.a = pa;
					stack = stack.next;
				}
				
				for(i = 1; i < radiusPlus1; i++){
					p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
					r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
					g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
					b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
					a_sum += ( stack.a = ( pa = pixels[p+3])) * rbs;
					
					r_in_sum += pr;
					g_in_sum += pg;
					b_in_sum += pb;
					a_in_sum += pa;
					
					stack = stack.next;
				}
				
				
				stackIn = stackStart;
				stackOut = stackEnd;
				for (x = 0; x < context.canvas.width; x++){
					pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
					if (pa != 0){
						pa = 255 / pa;
						pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
						pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
						pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
					} else {
						pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
					}
					
					r_sum -= r_out_sum;
					g_sum -= g_out_sum;
					b_sum -= b_out_sum;
					a_sum -= a_out_sum;
					
					r_out_sum -= stackIn.r;
					g_out_sum -= stackIn.g;
					b_out_sum -= stackIn.b;
					a_out_sum -= stackIn.a;
					
					p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;
					
					r_in_sum += ( stackIn.r = pixels[p]);
					g_in_sum += ( stackIn.g = pixels[p+1]);
					b_in_sum += ( stackIn.b = pixels[p+2]);
					a_in_sum += ( stackIn.a = pixels[p+3]);
					
					r_sum += r_in_sum;
					g_sum += g_in_sum;
					b_sum += b_in_sum;
					a_sum += a_in_sum;
					
					stackIn = stackIn.next;
					
					r_out_sum += ( pr = stackOut.r );
					g_out_sum += ( pg = stackOut.g );
					b_out_sum += ( pb = stackOut.b );
					a_out_sum += ( pa = stackOut.a );
					
					r_in_sum -= pr;
					g_in_sum -= pg;
					b_in_sum -= pb;
					a_in_sum -= pa;
					
					stackOut = stackOut.next;
		
					yi += 4;
				}
				yw += context.canvas.width;
			}
		}
		
		if(direction != 'horizontal'){
			for ( x = 0; x < context.canvas.width; x++ ){
				g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
				
				yi = x << 2;
				r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
				g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
				b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
				a_out_sum = radiusPlus1 * ( pa = pixels[yi+3]);
				
				r_sum += sumFactor * pr;
				g_sum += sumFactor * pg;
				b_sum += sumFactor * pb;
				a_sum += sumFactor * pa;
				
				stack = stackStart;
				
				for(i = 0; i < radiusPlus1; i++){
					stack.r = pr;
					stack.g = pg;
					stack.b = pb;
					stack.a = pa;
					stack = stack.next;
				}
				
				yp = context.canvas.width;
				
				for(i = 1; i <= radius; i++){
					yi = ( yp + x ) << 2;
					
					r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
					g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
					b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
					a_sum += ( stack.a = ( pa = pixels[yi+3])) * rbs;
				   
					r_in_sum += pr;
					g_in_sum += pg;
					b_in_sum += pb;
					a_in_sum += pa;
					
					stack = stack.next;
				
					if( i < heightMinus1 )
						yp += context.canvas.width;
				}
				
				yi = x;
				stackIn = stackStart;
				stackOut = stackEnd;
				for (y = 0; y < context.canvas.height; y++){
					p = yi << 2;
					pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
					if (pa > 0){
						pa = 255 / pa;
						pixels[p]   = ((r_sum * mul_sum) >> shg_sum ) * pa;
						pixels[p+1] = ((g_sum * mul_sum) >> shg_sum ) * pa;
						pixels[p+2] = ((b_sum * mul_sum) >> shg_sum ) * pa;
					} else {
						pixels[p] = pixels[p+1] = pixels[p+2] = 0;
					}
					
					r_sum -= r_out_sum;
					g_sum -= g_out_sum;
					b_sum -= b_out_sum;
					a_sum -= a_out_sum;
				   
					r_out_sum -= stackIn.r;
					g_out_sum -= stackIn.g;
					b_out_sum -= stackIn.b;
					a_out_sum -= stackIn.a;
					
					p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * context.canvas.width )) << 2;
					
					r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
					g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
					b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
					a_sum += ( a_in_sum += ( stackIn.a = pixels[p+3]));
				   
					stackIn = stackIn.next;
					
					r_out_sum += ( pr = stackOut.r );
					g_out_sum += ( pg = stackOut.g );
					b_out_sum += ( pb = stackOut.b );
					a_out_sum += ( pa = stackOut.a );
					
					r_in_sum -= pr;
					g_in_sum -= pg;
					b_in_sum -= pb;
					a_in_sum -= pa;
					
					stackOut = stackOut.next;
					
					yi += context.canvas.width;
				}
			}
		}
		
		context.putImageData(imageData, 0, 0);
	},
	hatch : function(w, h){
		var canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		
		var n1 = this.noise(w/2, h/2, 20),
			n2 = document.createElement('canvas');
			n2.width = w/2;
			n2.height = h/2;
			n2.getContext('2d').drawImage(n1,0,0);
		
		this.stackblur(n2,20, 'horizontal');
		this.stackblur(n1,20, 'vertical');

		var ctx = canvas.getContext('2d');
		ctx.scale(2,2);
		ctx.drawImage(n1,0,0);
		ctx.drawImage(n2,0,0);
		
		return canvas;
	}
});

/****************************************************************************\

	function: TextArea
		nice autogrow textarea with default text and EVERYTHING

	params:
		element: the textarea node to play with
		options: an object filled with callback functions
			update: a callback function that takes a single integer parameter
				representing the change in size for handling resize events on
				the element.
			enter: a callback function that is fired when enter has been
				pressed while the textarea is selected
	notes:
		the onUpdate is still a little funky. Needs to be smoothed.

\***************************************************************************/
drdelambre.default.Textarea = new drdelambre.class({
	element: null,
	text: null,
	shadow: null,
	minHeight: 0,
	isInput: false,
	oldVal: 0,

	init : function(elem, options){
		this.options = $.extend({
			update: null,
			enter: null,
			upload: false,
			type: 'text'
		}, options);
	
		this.element = $(elem);

		if(this.options.upload){
			this.element.bind('dragenter', this.enter);
			this.element.bind('dragleave', this.leave);
			this.element.bind('dragover', this.hover);
			this.element.bind('drop', this.drop);
			this.element.html('<div>' + this.element.html() + '<div class="file-btn">+</div></div><div class="file-list" style="display:none"></div>');
		}
		
		this.text = this.element.find('textarea, input');
		this.text[0].inst = this;
		if(this.text[0].nodeName.toLowerCase() == 'textarea'){
			this.options.type = 'text';
			this.minHeight = this.text.height('').height();
			this.text.bind('input onpropertychange', this.update);
		} else this.isInput = true;
	
		var val = this.text.val();
		if(this.options.hasOwnProperty('defaultText')){
			if(!val.length) this.text.val(this.options.defaultText);
		} else if(val.length) this.options.defaultText = val;
	
		if(this.text.val() == this.options.defaultText)
			this.element.addClass('unchanged');
	
		this.text.bind('focus', this.clear);
		this.text.bind('blur', this.checkClear);
		if(this.options.type == 'number'){
			this.text.bind('input paste', this.numberCheck);
			this.oldVal = this.options.defaultText;
		}
	},
	update : function(evt){
		if(!this.shadow){
			if(this.text.height() < this.minHeight) this.text.height(this.minHeight);
			return;
		}
		this.shadow.find('span').html($('<div/>').text(this.text.val()).html());
		var height = this.shadow.outerHeight();

		if(height < this.minHeight){
			var oH = this.text.height();
			this.minHeight = this.text.css({ height: '' }).height();
			var diff = 0 - oH + this.minHeight;
			if(diff){
				this.text.stop().animate({ height: oH + diff },{ duration: 200, complete: function(){
					$(this).css({ height: '' });
				}});
				if(this.options.update) this.options.update(diff);
			}
			return;
		}
		
		var diff = 0 - this.text.height() + this.text.height(height).height();
		if(diff && this.options.update) this.options.update(diff);
	},
	clear : function(evt){
		if(!this.isInput){
			if(this.shadow) this.shadow.remove();
			var val = this.text.val();
			this.minHeight = this.text.val('').height('').height();
			this.text.val(val);
			this.shadow = $('<pre><span>' + val + '</span><br/></pre>');
			this.text.before(this.shadow);
		}

		if(this.text.val()==this.options.defaultText){
			this.text.val('');
			if(!this.isInput) this.update();
			else if(this.options.type == 'password') this.text[0].type = 'password';
		}
		this.element.removeClass('unchanged');
		$(window).bind('mousedown', this.clearCatch);
		if(this.options.enter) $(window).bind('keypress', this.keyCatch);
		
		setTimeout($.proxy(function(){
			this.text[0].setSelectionRange(this.text.val().length,this.text.val().length);
		},this),1);
	},
	clearCatch : function(evt){
		if($(evt.target).closest(this.text).length) return;
		this.checkClear();
	},
	checkClear : function(evt){
		if(!this.text.val().length){
			this.text.val(this.options.defaultText);
			this.element.addClass('unchanged');
			if(!this.isInput) this.update();
			if(this.options.type == "password") this.text[0].type='text';
		}
		$(window).unbind('mousedown', this.clearCatch).unbind('keypress', this.keyCatch);
		if(this.shadow){
			this.shadow.remove();
			this.shadow = null;
		}
	},
	keyCatch : function(evt){
		if(evt.which == 13){
			this.checkClear(null);
			evt.stopPropagation();
			this.options.enter();
			return false;
		}
	},
	reset : function(evt){
		this.text.val(this.options.defaultText);
		this.element.addClass('unchanged');
		this.text.unbind('blur', this.checkClear).unbind('focus', this.clear).bind('blur', this.checkClear).bind('focus', this.clear);
		$(window).unbind('mousedown', this.clearCatch).unbind('keypress', this.keyCatch);
		if(this.shadow){
			this.shadow.remove();
			this.shadow = null;
		}
		this.update();
		this.text.css({
			height: '',
			'font-size': ''
		});
	},
	error : function(errors){
		if(errors.constructor.toString().indexOf("Array") == -1)
			errors = [errors];
		var err = $('<div class="errors"></div>');
		for(var ni = errors.length; ni != 0;)
			err.append('<div class="error">' + errors[--ni] + "</div>");

		this.element.addClass('invalid');
		var setup = $.proxy(function(){
			err.css({
				opacity: 0
			}).animate({ opacity: 1 },{ duration: 150 });
			this.element.bind('mousedown', this.closeError);
			this.text.bind('focus input', this.closeError);
		}, this);
		if(this.element.find('.errors').length){
			this.element.find('.errors').fadeOut(100, function(){
				$(this).before(err).remove();
				setup();
			});
		} else {
			this.element.prepend(err);
			setup();
		}
	},
	closeError : function(){
		this.element.unbind('mousedown', this.closeError);
		this.text.unbind('focus input', this.closeError);
		var err = this.element.find('.errors');
		err.closest('.input-wrap').removeClass('invalid');
		err.remove();
		setTimeout($.proxy(function(){
			this.text.focus();
		},this),1);
	},
	numberCheck : function(evt){
		if(/^\d*(\.\d{0,3}?)?$/.test(this.text.val()))
			this.oldVal = this.text.val();
		else this.text.val(this.oldVal);
    },
	
	disable : function(){
		this.text.unbind('focus', this.clear);
		this.text.unbind('blur', this.checkClear);
		this.text.unbind('input onpropertychange', this.update);
		this.element.unbind('dragenter', this.enter);
		this.element.unbind('dragleave', this.leave);
		this.element.unbind('dragover', this.hover);
		this.element.unbind('drop', this.drop);
		this.text[0].disabled = "disabled";
	},
	enable : function(){
		this.text.unbind('focus', this.clear).bind('focus', this.clear);
		this.text.unbind('blur', this.checkClear).bind('blur', this.checkClear);
		this.text.unbind('input onpropertychange', this.update).bind('input onpropertychange', this.update);
		if(this.options.drag){
			this.element.unbind('dragenter', this.enter).bind('dragenter', this.enter);
			this.element.unbind('dragleave', this.leave).bind('dragleave', this.leave);
			this.element.unbind('dragover', this.hover).bind('dragover', this.hover);
			this.element.unbind('drop', this.drop).bind('drop', this.drop);
		}
		this.text[0].disabled = false;
	},
	
	enter : function(evt){ this.element.addClass('hover'); },
	leave : function(evt){ this.element.removeClass('hover'); },
	hover : function(evt){
		evt.stopPropagation();
		evt.preventDefault();
//		evt.originalEvent.dataTransfer.dropEffect = 'copy';
	},
	drop : function(evt){
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.originalEvent.dataTransfer.files;
		this.element.removeClass('hover');
		
		var list = this.element.find('div.file-list');
		for(var ni = files.length;ni!=0;){
			var file = new drdelambre.default.File(files[--ni]);
			list.append(file.element);
		}
		if(list.css('display') == 'none') list.slideDown(300);
	},

	addFile : function(files){}
});

/****************************************************************************\

	function: Confirm
		A general purpose popup for selecting options

	params:
		options: an object defining the behaviour of the popup
			message: a string to display to the user
			actions: an array of [action string, callback] arrays

	notes:

\***************************************************************************/
drdelambre.default.Confirm = new drdelambre.class({
	element: null,
	
	init : function(options){
		this.element = $("\
			<div class='popup-overlay'>\
				<div class='popup'>\
					<div class='message'>" + options.message + "</div>\
					<div class='actions'></div>\
				</div>\
			</div>").css({ opacity: 0 });
	
		var wrap = this.element.find('div.actions');
		for(var ni = options.actions.length; ni != 0;)
			wrap.prepend($("<span>" + options.actions[--ni][0] + "</span>").bind('mousedown', ($.proxy(function(call){
				return $.proxy(function(){ this.close(call); },this);
			}, this))(options.actions[ni][1])));
		delete wrap;
	
		$(document.body).append(this.element);
	
		this.resize();
	
		$(document.body).addClass('blur');
		$(this.element).animate({ opacity: 1.0 }, { duration: 300 });
		$(window).bind('resize', this.resize);
	},
	resize : function(){
		this.element.css({
			width: $(window).width(),
			height: $(window).height()
		});
		var pop = this.element.find('.popup');
		pop.css({
			left: ($(window).width() - pop.width()) / 2,
			top: ($(window).height() - pop.height()) / 2
		});
	},
	close : function(callback){
		$(document.body).removeClass('blur');
		$(window).unbind('resize', this.resize);
		this.element.animate({ opacity: 0 }, { duration: 300, complete: function(){ $(this).remove(); }});
		if(callback) callback();
	},
});

/****************************************************************************\

	function: Slider
		A simple slider

	params:
		options:
			element: the .slider element
			update: a callback for processing a change in position

	notes:

\***************************************************************************/
drdelambre.default.Slider = new drdelambre.class({
	element : null,
	options : null,

	init : function(options){
		this.element = $(options.element);
		delete options.element;
		this.options = $.extend({
			update: null
		}, options);
		
		new drdelambre.default.ComplexMouse({
			element: this.element,
			
			click: this.center,
			startMove: this.start,
			onMove: this.move,
			endMove: this.end
		});
	},
	center : function(evt){
		var handle = this.element.find('.slide-handle');
		if(this.element.width() > this.element.height()){
			var nLeft = evt.pageX - this.element.offset().left - handle.outerWidth(true)/2;
			if(nLeft < 0) nLeft = 0;
			else if(nLeft > this.element.width() - handle.outerWidth(true)) nLeft = this.element.width() - handle.outerWidth(true);
			handle.stop().animate({
				left: nLeft
			},{ duration: 100 });
			if(this.options.update){
				var per = nLeft / (this.element.width() - handle.outerWidth(true));
				this.options.update(per);
			}
		} else {
			var nTop = evt.pageY - this.element.offset().top - handle.outerHeight(true)/2;
			if(nTop < 0) nTop = 0;
			else if(nTop > this.element.height() - handle.outerHeight(true)) nTop = this.element.height() - handle.outerHeight(true);
			handle.stop().animate({
				top: nTop
			},{ duration: 100 });
			if(this.options.update){
				var per = nTop / (this.element.height() - handle.outerHeight(true));
				this.options.update(per);
			}
		}
	},
	start : function(evt){
		var handle = this.element.find('.slide-handle');
		if(this.element.width() > this.element.height())
			this.diff = this.element.offset().left + handle.outerWidth(true)/2;
		else
			this.diff = this.element.offset().top + handle.outerHeight(true)/2;
		if(this.options.update)
			this.updater = setInterval(this.update, 100);
	},
	move : function(evt){
		var handle = this.element.find('.slide-handle');
		if(this.element.width() > this.element.height()){
			var nLeft = evt.pageX - this.diff;
			if(nLeft < 0) nLeft = 0;
			else if(nLeft > this.element.width() - handle.outerWidth(true)) nLeft = this.element.width() - handle.outerWidth(true);
			handle.css({ left: nLeft });
	
			this.pos = nLeft;
		} else {
			var nTop = evt.pageY - this.diff;
			if(nTop < 0) nTop = 0;
			else if(nTop > this.element.height() - handle.outerHeight(true)) nTop = this.element.height() - handle.outerHeight(true);
			handle.css({ top: nTop });
	
			this.pos = nTop;
		}
	},
	end : function(evt){
		if(this.updater){
			clearInterval(this.updater);
			this.update();
		}

		delete this.diff, this.pos;
	},
	update : function(){
		if(!this.options.update) return;
		var pos;
		if(this.element.width() > this.element.height())
			pos = this.pos / (this.element.width() - this.element.find('.slide-handle').outerWidth(true));
		else
			pos = this.pos / (this.element.height() - this.element.find('.slide-handle').outerHeight(true));
		this.options.update(pos);
	},

	set : function(percentage){
		if(percentage < 0) percentage = 0;
		else if(percentage > 1) percentage = 1;
		var handle = this.element.find('div.slide-handle');
		if(this.element.width() > this.element.height()){
			var n = this.element.width() - handle.outerWidth(true);
			percentage = ((n * percentage)&~0)/n;
			handle.stop().animate({
				left: n * percentage
			},{ duration: 100, easing: 'linear' });
		} else {
			var n = this.element.height() - handle.outerHeight(true);
			percentage = ((n * percentage)&~0)/n;
			handle.stop().animate({
				top: n * percentage
			},{ duration: 100, easing: 'linear' });
		}
		if(this.options.update) this.options.update(percentage);
	},
	get : function(){
		var handle = this.element.find('div.slide-handle');
		if(this.element.width() > this.element.height())
			return handle.position().left / (this.element.width()-handle.outerWidth(true));
		return handle.position().top / (this.element.height()-handle.outerHeight(true));
	}
});

//needs
//	scroll initialization messes up
//	horizontal scrollbar shrinks vertical scrollbar
//	scroll on finger drag?
drdelambre.default.BoxSlider = new drdelambre.class({
	element : null,
	options : null,
	hSlider : null,
	vSlider: null,
	vertStat : 0, // 0:moving, 1:open, 2: closed
	horizStat : 0, // 0:moving, 1:open, 2: closed
	
	init : function(options){
		this.element = $(options.element);
		delete options.element;
		this.options = $.extend({
			update: null,
			left: false
		}, options);
		
		this.element.html("\
			<div class='scroll-bar" + (this.options.left?' left':'') + "'>\
				<div class='slider-y' style='display: none;'>\
					<div class='slide-handle'></div>\
				</div>\
				<div class='scroll-content'>" + this.element.html() + "</div>\
				<div class='slider-x' style='display: none;'>\
					<div class='slide-handle'></div>\
				</div>\
			</div>").css({ overflow: 'hidden' });
		
		this.hSlider = new drdelambre.default.Slider({
			element: this.element.children('.scroll-bar').children('.slider-x'),
			update: this.horizontalUpdate
		});
		this.vSlider = new drdelambre.default.Slider({
			element: this.element.children('.scroll-bar').children('.slider-y'),
			update: this.verticalUpdate
		});
	
		this.vertStat = this.horizStat = 2;
		this.element.bind('resizer', $.proxy(function(evt){
			evt.stopPropagation();
			if(this.resizeThrottle) return;
			this.resizeThrottle = setTimeout(this.resize, 50);
		},this));
		
		this.element.bind('mousewheel', this.scroll);
	},
	verticalUpdate : function(percentage){
		var content = this.element.children('.scroll-bar').children('.scroll-content');

		var diff = (content[0].scrollHeight - content[0].clientHeight) * percentage;
		content.stop().animate({ scrollTop: diff },{ duration: 100, easing: 'linear' });
	},
	horizontalUpdate : function(percentage){
		var content = this.element.children('.scroll-bar').children('.scroll-content');

		var diff = (content[0].scrollWidth - content[0].clientWidth) * percentage;
		content.stop().animate({ scrollLeft: diff },{duration: 100});
	},
	showVScroll : function(){
		var vert = this.element.children('.scroll-bar').children('.slider-y');

		this.vertStat = 0;
		vert.css({ display: '' });
		vert.find('.slide-handle').css({
			opacity: 0
		}).stop().delay(400).animate({
			opacity: 1
		},{ duration: 300, complete: function(){
			$(this).css({
				opacity: '',
				left: ''
			});
		}});
		var style = {
			left: vert.css('marginLeft'),
			right: vert.css('marginRight'),
			width: vert.width()
		};
		
		vert.css({
			marginLeft: 0,
			marginRight: 0,
			width: 0
		}).stop().animate({
			marginLeft: style.left,
			marginRight: style.right,
			width: style.width
		},{ duration: 400, complete: $.proxy(function(){
			this.vertStat = 1;
			vert.css({
				marginLeft: '',
				marginRight: '',
				width: ''
			});
		}, this)});
	},
	hideVScroll : function(){
		var vert = this.element.children('.scroll-bar').children('.slider-y');

		this.vertStat = 0;
		vert.find('.slide-handle').css({
			opacity: 1
		}).stop().animate({
			opacity: 0
		},{ duration: 300, complete: function(){
			$(this).css({
				opacity: ''
			});
		}});
		vert.delay(200).stop().animate({
			marginLeft: 0,
			marginRight: 0,
			width: 0
		},{ duration: 400, complete: $.proxy(function(){
			this.vertStat = 2;
			vert.css({
				marginLeft: '',
				marginRight: '',
				width: '',
				display: 'none'
			});
			
			this.vSlider.set(0);
		}, this)});
	},
	showHScroll : function(){
		var horiz = this.element.children('.scroll-bar').children('.slider-x');
		this.horizStat = 0;
		horiz.css({ display: '' });
		horiz.find('.slide-handle').css({
			opacity: 0
		}).stop().delay(400).animate({
			opacity: 1
		},{ duration: 300, complete: function(){
			$(this).css({
				opacity: ''
			});
		}});
		var style = {
			top: horiz.css('marginTop'),
			bottom: horiz.css('marginBottom'),
			height: horiz.height()
		};
		
		horiz.css({
			marginTop: 0,
			marginBottom: 0,
			height: 0
		}).stop().animate({
			marginTop: style.top,
			marginBottom: style.bottom,
			height: style.height
		},{ duration: 400, complete: $.proxy(function(){
			this.horizStat = 1;
			horiz.css({
				marginTop: '',
				marginBottom: '',
				height: ''
			});
		}, this)});
	},
	hideHScroll : function(){
		var bar = this.element.children('.scroll-bar');
		var content = bar.children('.scroll-content'),
			horiz = bar.children('.slider-x');

		this.horizStat = 0;
		content.animate({
			height: content.height() + horiz.outerHeight(true)
		},{ duration: 300 });
		horiz.find('.slide-handle').css({
			opacity: 1
		}).stop().animate({
			opacity: 0
		},{ duration: 300, complete: function(){
			$(this).css({
				opacity: ''
			});
		}});

		horiz.delay(200).stop().animate({
			marginTop: 0,
			marginBottom: 0,
			height: 0
		},{ duration: 300, complete: $.proxy(function(){
			this.horizStat = 2;
			horiz.css({
				marginTop: '',
				marginBottom: '',
				height: '',
				display: 'none'
			});
			this.hSlider.set(0);
		}, this)});
	},
	resize : function(){
		if(this.resizeThrottle) delete this.resizeThrottle;

		var bar = this.element.children('.scroll-bar');
		var content = bar.children('.scroll-content'),
			vert = bar.children('.slider-y'),
			horiz = bar.children('.slider-x');
		var vOff = content[0].scrollTop;
		var oOff = vOff / (content[0].scrollHeight - content[0].clientHeight);

		content.css({ height: '' });
		vert.height('').height(this.element.height() - parseInt(vert.css('marginTop')) * 2).css({ display: 'none' });
		content.height(this.element.height() - horiz.outerHeight(true));
		content[0].scrollTop = vOff;

		var hScroll = content[0].clientWidth < content[0].scrollWidth,
			vScroll = content[0].clientHeight < content[0].scrollHeight;

		if(this.vertStat == 1) vert.css({ display: '' });
		if(hScroll)
			this.hSlider.set(content[0].scrollLeft / (content[0].scrollWidth - content[0].clientWidth));
		if(vScroll)
			this.vSlider.set(oOff);

		if(vScroll && this.vertStat == 2)
			this.showVScroll();
		else if(!vScroll && this.vertStat == 1)
			this.hideVScroll();

		if(hScroll && this.horizStat == 2)
			this.showHScroll();
		else if(!hScroll && this.horizStat == 1)
			this.hideHScroll();
	},
	
	scroll : function(evt){
		var speed = 0.05;
		
		if(!this.nY) this.nY = 0;
		this.nY += evt.originalEvent.wheelDeltaY*speed;

		if(!this.nX) this.nX = 0;
		this.nX += evt.originalEvent.wheelDeltaX*speed;

		evt.preventDefault();
		if(!this.throttle) this.throttle = setTimeout(this.scrollThrottle,100);
	},
	
	scrollThrottle : function(){
		var content = this.element.children('.scroll-bar').children('.scroll-content');
		this.vSlider.set((content.scrollTop() - this.nY)/(content[0].scrollHeight - content[0].clientHeight));
		this.hSlider.set((content.scrollLeft() - this.nX)/(content[0].scrollWidth - content[0].clientWidth));
		this.nY = this.nX = 0;
		this.throttle = null;
	}
});

drdelambre.default.InvisibleSlider = new drdelambre.class({
	element: null,

	resizeThrottle: null,
	scrollThrottle: null,
	scrollX: 0,
	scrollY: 0,
	
	init : function(elem){
		this.element = $(elem);
		
		this.element.bind('resizer', $.proxy(function(evt){
			evt.stopPropagation();
		},this));
		this.element.bind('mousewheel DOMMouseScroll', $.proxy(function(evt){
			var wheel = { x: 0, y: 0 },
				e = evt.originalEvent,
				speed = 0.1;

			if ('wheelDeltaX' in e) {
				wheel.x = e.wheelDeltaX * speed;
				wheel.y = e.wheelDeltaY * speed;
			} else if('detail' in e){
				if(e.axis === 2){
					wheel.y = -e.detail / speed;
					wheel.x = 0;
				} else {
					wheel.x = -e.detail / speed;
					wheel.y = 0;
				}
			} else {
				wheel.x = 0;
				wheel.y = e.wheelDelta * speed;
			}
			evt.stopPropagation();
			evt.preventDefault();

			this.element.scrollTop(this.element.scrollTop() - wheel.y);
			this.element.scrollLeft(this.element.scrollLeft() - wheel.x);
		},this));
	}
});

drdelambre.default.File = new drdelambre.class({
	element: null,
	reader: null,
	file: null,
	
	init : function(file){
		this.element = $('<div class="file"><div class="close">x</div><span class="name">' + file.name + '</span><div class="progress"><span></span></div></div>');
		this.file = file;

		this.reader = new FileReader();
		this.reader.onerror = $.proxy(function(evt){
			this.element.addClass('error').delay(300).fadeOut(200, function(){ $(this).remove(); });
		},this);
		this.reader.onabort = $.proxy(function(evt){
			this.element.fadeOut(200, function(){ $(this).remove(); });
		},this);
		this.reader.onloadstart = $.proxy(function(evt){
			this.element.addClass('loading');
			this.element.find('.progress span').css({ width: '0%' });
		},this);
		this.reader.onload = this.upload();
		
		this.reader.readAsBinaryString(this.file);

		return this.element;
	},
	upload : function(){
		var xhr = new XMLHttpRequest();

		xhr.upload.onprogress = this.update;
		xhr.onload = this.done;
		xhr.onreadystatechange = $.proxy(function(evt){
			if(xhr.readyState == 4 && xhr.status == 200)
				this.element.prepend('<input type="hidden" value="' + JSON.parse(xhr.responseText).hash + '">');
		},this);

		xhr.open('POST', URL_BASE + '/upload', true);
		xhr.setRequestHeader("Content-Type", "multipart/form-data");
		xhr.setRequestHeader("X_FILENAME", this.file.name);

		xhr.send(this.file);
	},
	update : function(evt){
		if(!evt.lengthComputable) return;
		var loaded = Math.round((evt.loaded / evt.total) * 100);
		if(loaded < 100)
			this.element.find('.progress span').css({ width: loaded + '%' });
	},
	done : function(){
		this.element.find('.close').bind('mousedown', this.remove);
		this.element.removeClass('loading');
	},
	remove : function(){
		$.ajax({ data: JSON.stringify({
			type: 'file',
			request: 'remove',
			hash: this.element.find('input:first').val()
		})});
		
		this.element.fadeOut(200, function(){ $(this).remove(); });
	}
});
