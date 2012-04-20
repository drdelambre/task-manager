drdelambre.calendar = {};

/****************************************************************************\

	function: Calendar
		A date navigation widget

	params:
		obj: the outer container of the calendar
		options: an object defining the behaviour of the calendar
			date: the date to initialize the widget to
			speed: controls the speed of the animations

	notes:
		publishes on /calendar
			/daychange: a day was selected
			/monthchange: the months were navigated
			/resize: some months are longer, this shows the difference in px
		subscribes on /calendar
			/add: an event was added to the day given (in seconds)

\***************************************************************************/
drdelambre.calendar.Calendar = new drdelambre.class({
	element : null,
	options: {},
	
	init : function(elem, options){
		this.element = $(elem);
		this.options = $.extend({
			date: new Date(),
			speed: 400
		},options);
	
		var butt = this.element.find('div.cal-nav-buttons div');
		butt.eq(0).bind('mousedown', this.prevMonth);
		butt.eq(1).bind('mousedown', this.resetMonth);
		butt.eq(2).bind('mousedown', this.nextMonth);
		
		this.element.find('div.cal-day').bind('mousedown', this.selectDay);
		drdelambre.subscribe('/calendar/add', this.addEvent);
		drdelambre.subscribe('/calendar/monthchange', this.animate);
	},
	newCal : function(date){
		var data = {
			first: new Date(date.getFullYear(), date.getMonth(), 1).getDay(),
			last: 32 - new Date(date.getFullYear(), date.getMonth(), 32).getDate()
		};

		if(date.getMonth() == 0)
			data.prev = 32 - new Date(date.getFullYear()-1, 11, 32).getDate();
		else
			data.prev = 32 - new Date(date.getFullYear(), date.getMonth()-1, 32).getDate();

		var now = new Date();
		if(date.getFullYear() == now.getFullYear() && date.getMonth() == now.getMonth())
			data.today = now.getDate();

		var cal = "<div class='cal-slide-wrap'><div class='cal-week'>";
		var day, ni;

		for(ni = data.prev-data.first+1; ni <= data.prev; ni++)
			cal += "<div class='cal-day cal-null'>" + ni + "</div>";

		var sum = data.first+1;
		for(ni = 1; ni <= data.last; ni++){
			if(sum++%7 == 1) cal += "</div><div class='cal-week'>";
			cal += "<div class='cal-day" + (data.today && ni == data.today?' cal-today':'') + "'>" + ni + "</div>";
		}
		sum = (data.last + data.first)%7;
		if(sum > 0){
			for(ni = 1; sum++ < 7; ni++)
				cal += "<div class='cal-day cal-null'>" + ni + "</div>";
		}
		
		cal = $(cal + "</div></div>");
		cal.find('div.cal-day').bind('mousedown', this.selectDay);
		return cal;
	},
	animate : function(date, isReset){
		var direction = null;
		if(!isReset){
			if(date < this.date.getTime()/1000) direction = 'right';
			else direction = 'left';
		}
		date = this.date = new Date(date * 1000);
		var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		var oMon = this.element.find('div.cal-nav div.cal-month');
		var off = oMon.position();
		var mon = $("<div class='cal-month'>" + months[date.getMonth()] + " " + date.getFullYear() + "</div>").css({
			position: 'absolute',
			width: oMon.width(),
			top: direction=='left'?off.top + oMon.height():direction=='right'?off.top - oMon.height():off.top,
			left: off.left,
			opacity: !direction?0:1
		});

		oMon.after(mon).css({
			position: 'relative',
			opacity: 1
		}).animate({
			top: direction=='left'?off.top - oMon.height():direction=='right'?off.top + oMon.height():off.top,
			opacity: 0
		},{ duration: this.options.speed * 1.5 });
		
		mon.delay(!direction?this.options.speed:0).animate({
			top: off.top,
			left: off.left,
			opacity: 1
		},{ duration: this.options.speed * 1.5, complete: $.proxy(function(){
			oMon.remove();
			mon.css({
				top: '',
				position: '',
				left: '',
				width: '',
				opacity: ''
			});
		}, this)});

		var oCal = this.element.find('div.cal-slide-wrap');
		off = oCal.position();
		var cal = this.newCal(date).css({
			position: 'absolute',
			width: oCal.width(),
			top: off.top,
			left: direction=='left'?off.left + oCal.width():direction=='right'?off.left - oCal.width():off.left,
			opacity: !direction?0:1
		});

		oCal.after(cal).css({
			position: 'relative'
		}).animate({
			left: direction=='left'?off.left - oCal.width():direction=='right'?off.left + oCal.width():'',
			height: cal.height(),
			opacity: 0
		},{ duration: this.options.speed * (!direction?1.5:1) });
		
		if(cal.height() != oCal.height())
			drdelambre.publish('/calendar/resize', [oCal.height() - cal.height()]);

		cal.delay(!direction?this.options.speed:0).animate({
			left: off.left,
			opacity: 1
		},{ duration: this.options.speed, complete: $.proxy(function(){
			oCal.remove();
			cal.css({
				position: '',
				width: '',
				top: '',
				left: '',
				opacity: ''
			});
		}, this)});
	},
	nextMonth : function(evt){
		var date = new Date(this.date.getTime());
		if(date.getMonth() == 11){
			date.setMonth(0);
			date.setYear(date.getFullYear() + 1);
		} else {
			date.setMonth(date.getMonth() + 1);
		}

		drdelambre.publish('/calendar/monthchange', [(date.getTime()/1000)&~0]);
	},
	prevMonth : function(evt){
		var date = new Date(this.date.getTime());
		if(date.getMonth() == 0){
			date.setMonth(11);
			date.setYear(date.getFullYear() - 1);
		} else
			date.setMonth(date.getMonth() - 1);
		
		drdelambre.publish('/calendar/monthchange', [(date.getTime()/1000)&~0]);
	},
	resetMonth : function(evt){
		var nDate = new Date();
		if(this.date.getFullYear() == nDate.getFullYear() && this.date.getMonth() == nDate.getMonth()) return;
		drdelambre.publish('/calendar/monthchange', [(nDate.getTime()/1000)&~0, true]);
	},
	selectDay : function(evt){
		var elem = $(evt.target).closest('.cal-day');
		if(elem.is('.cal-selected')){
			this.element.find('.cal-day.cal-selected').removeClass('cal-selected');
			return;
		}
		this.element.find('.cal-day.cal-selected').removeClass('cal-selected');
		elem.addClass('cal-selected');
		var ni = $(elem).prevAll('div.cal-day').length - $(elem).prevAll('div.cal-null').length + 1;
		var week = $(elem).closest('div.cal-week');
		ni += week.prevAll('div.cal-week').find('div.cal-day').length - week.prevAll('div.cal-week').find('div.cal-null').length;

		this.date.setDate(ni);
		var date = ((this.date.getTime()/86400000)&~0)*86400 + this.date.getTimezoneOffset()*60;

		drdelambre.publish('/calendar/daychange', [date]);
	},
	addEvent : function(json){
		var date = new Date();
		date = new Date((json.time - date.getTimezoneOffset()*60)*1000);
		this.element.find('div.cal-slide-wrap div.cal-day').eq(date.getDate()-1).addClass('cal-active');
	}
});

/****************************************************************************\

	function: EventTicker
		An event manager

	params:
		element: the outer container of the manager

	notes:
		* closeFold() doesn't split folds if a new event was added to a
		  previously empty date
		* center() doesn't work yet, but fires
		* infinite scroll not implemented, should fire month changes

\***************************************************************************/
drdelambre.calendar.EventTicker = new drdelambre.class({
	element : null,
	
	init : function(elem){
		this.element = $(elem);
		this.element[0].inst = this;
		drdelambre.subscribe('/calendar/daychange', this.center);
	},
	create : function(json){
		var time = new Date().getTimezoneOffset()*60;
		var start = date = ((json.start/86400)&~0)*86400 + time,
			end = ((json.end/86400)&~0)*86400 + time;
		var inner = $('<div class="cal-ticker-inner"></div>');
		while(date <= end){
			inner.append(this._makeDate(date));
			date += 86400;
		}
		var dates = inner.find('.cal-date');
		for(var ni = 0; ni < json.events.length; ni++){
			var diff = ((json.events[ni].time/86400)&~0) - ((start/86400)&~0);
			dates.eq(diff).append(this._makeEntry(json.events[ni]));
		}

		//find and close folds
		for(var ni = 0; ni < dates.length; ni++){
			if(dates.eq(ni).find('.cal-entry').length) continue;
			if(ni < dates.length && dates.eq(ni+1).find('.cal-entry').length) continue;
			var wrap = $('<div class="cal-more"><div class="cal-more-inner" style="display:none;"></div><div class="cal-more-handle"><span></span><span></span><span></span></div></div>');
			dates.eq(ni).before(wrap);
			while(ni < dates.length && !dates.eq(ni).find('.cal-entry').length)
				wrap.find('.cal-more-inner').append(dates.eq(ni++));
		}

		this.element.append(inner);
		inner.css({
			position: 'relative',
			top: -1 * inner.outerHeight(true)
		}).animate({ top: 0 },{ duration: inner.outerHeight(true) * 5, complete:$.proxy(function(){
			inner.css({
				position: '',
				top: ''
			});
			
			new BoxSlider({
				element: this.element
			});
			this.element.find('div.cal-more div.cal-more-handle').bind('mousedown', this.openFold);
			this.element.find('div.cal-date').each($.proxy(function(ni,oz){
				new EventTickerDate(oz);
			},this));
			
			this.element.trigger('resizer');
		},this)});
	},
	_makeDate : function(date){
		var week = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
		var month = ['January','February','March','April','May','June','July','August','September','October','November','December'];
		var time = new Date(date*1000);
		return $('\
			<div class="cal-date">\
				<div class="cal-head">\
					<input type="hidden" value="' + date + '" />\
					<div class="cal-add">+</div>\
					<h1>' + week[time.getDay()] + '</h1>' + month[time.getMonth()] + ' ' + time.getDate() + '\
				</div>\
				<div class="cal-add-menu" style="display:none;">\
					<div class="input-wrap"><textarea></textarea></div>\
					<div class="cal-time">12:00<span>am</span></div>\
					<div class="time-picker">\
						<div class="slider"><div class="slide-handle"></div></div>\
						<div class="meridian">am</div>\
						<div class="meridian">pm</div>\
					</div>\
					<div class="cal-save">save</div>\
				</div>\
			</div>');
	},
	_makeEntry : function(json){
		var time = new Date();
		time = (((json.time/60)&~0) - time.getTimezoneOffset())%1440;
		var hrs = (time/60)&~0,
			mer = 'am';
		time = time%60<10?'0' + time%60:time%60;
		if(hrs >= 12){
			mer = 'pm';
			hrs = hrs>12?hrs-12:hrs;
		} else if(hrs==0) hrs = 12;

		return $('\
			<div class="cal-entry">\
				<input type="hidden" value="' + json.time + '">\
				<div class="cal-time">' + hrs + ':' + time + '<span>' + mer + '</span></div>\
				<div class="cal-body"><div class="details">' + json.text + '</div></div>\
			</div>');
	},
	openFold : function(evt){
		if($(evt.target).closest('div.cal-more').is('.open')) return;
		this.closeFold();
		var elem = $(evt.target).closest('div.cal-more');
		elem.addClass('open');
		var handle = elem.find('.cal-more-handle'), wrap = elem.find('.cal-more-inner');
		if($(window).width() > 640){
			elem.slideUp(300, function(){
				handle.css({ display: 'none' });
				wrap.css({ display: '' });
				$(this).slideDown(300, function(){
					$(this).css({ display: '' }).trigger('resizer');
				});
			})
		} else {
			elem.animate({ width: 0 },{ duration: 300, complete: function(){
				elem.css({
					width: '',
					display: ''
				});
				var w = wrap.css({ display: '' }).width() - handle.width();
				handle.css({ display: 'none' });
				elem.css({ width: 0, display: 'inline-block' }).animate({ width: w },{ duration: 1000, complete: function(){
					$(this).width('').trigger('resize');
				}});
			}});
		}
		
		setTimeout($.proxy(function(){
			$(window).bind('mousedown', this.closeFold);
		},this),1);
	},
	closeFold : function(evt){
		if(evt &&
			($(evt.target).closest(this.element).length ||
			 $(evt.target).closest('div.calendar').length)) return;
		
		$(window).unbind('mousedown', this.closeFold);
		//scan for splits here
		var elem = this.element.find('div.cal-more.open').removeClass('open');
		if($(window).width() > 640){
			elem.slideUp(300, function(){
				$(this).find('.cal-more-handle').css({ display: '' });
				$(this).find('.cal-more-inner').css({ display: 'none' });
				$(this).slideDown(300, function(){
					$(this).css({ display: '' }).trigger('resizer');
				});
			});
		} else {
			elem.animate({ width: 0 },{ duration: 300, complete: function(){
				elem.css({
					width: '',
					display: ''
				});
				elem.find('.cal-more-inner').css({ display: 'none' });
				var w = elem.find('.cal-more-handle').css({ display: '' }).width();
				elem.css({ width: 0, display: 'inline-block' }).animate({ width: w },{ duration: 1000, complete: function(){
					$(this).css({ display: '', width: '' }).trigger('resizer');
				}});
			}});
		}
	},
	center : function(date){
		var dates = this.element.find('div.cal-date div.cal-head input');
		for(var ni = dates.length; ni!=0;){
			if(dates.eq(--ni).val()!=date) continue;
			var fold = dates.eq(ni).closest('div.cal-more');
			var retFunc = $.proxy(function(){
				this.element.unbind('resizer', retFunc);
				this.element.find('.scroll-content')[0].scrollTop = dates.eq(ni).closest('div.cal-date').position().top;
			},this);
			this.element.bind('resizer', retFunc);
			if(fold.length)
				this.openFold({target:fold.find('div.cal-more-handle')});
			else if(!this.element.find('div.cal-more.open').length) this.element.trigger('resizer');
			else this.closeFold();
			break;
		}
	}
});

/****************************************************************************\

	function: EventTickerDate
		The event ticker date element

	params:
		element: the outer container of the date container

	notes:
		publishes on /calendar
			/add : a new event was added to this date

\***************************************************************************/
drdelambre.calendar.EventTickerDate = new drdelambre.class({
	element : null,
	addTime : null,
	addText : null,

	init : function(elem){
		this.element = $(elem);
		
		this.element.find('div.cal-head div.cal-add').bind('mousedown', this.openAdd);
		this.element.find('div.cal-add-menu div.cal-save').bind('mousedown', this.saveAdd);
		this.addText = new drdelambre.default.Textarea(this.element.find('div.cal-add-menu .input-wrap'), { defaultText: 'details', enter: this.saveAdd });
		this.addTime = new drdelambre.calendar.Slider({
			element: this.element.find('div.cal-add-menu .slider'),
			update: this.updateTime
		});
	},	
	addEvent : function(json){
		var elem = this._makeEntry(json),
			entries = this.element.find('div.cal-entry'),
			inserted = false;
		for(var ni = 0; ni < entries.length; ni++){
			if(entries.eq(ni).find('input').val()>elem.find('input').val()){
				inserted = true;
				entries.eq(ni).before(elem);
				break;
			}
		}
		
		if(!inserted) this.element.append(elem);
		
		elem.css({ display: 'none' }).slideDown(300);
		this.element.trigger('resizer');
	},
	_makeEntry : function(json){
		var time = new Date();
		time = (((json.time/60)&~0) - time.getTimezoneOffset())%1440;
		var hrs = (time/60)&~0,
			mer = 'am';
		time = time%60<10?'0' + time%60:time%60;
		if(hrs >= 12){
			mer = 'pm';
			hrs = hrs>12?hrs-12:hrs;
		} else if(hrs==0) hrs = 12;

		return $('\
			<div class="cal-entry">\
				<input type="hidden" value="' + json.time + '">\
				<div class="cal-time">' + hrs + ':' + time + '<span>' + mer + '</span></div>\
				<div class="cal-body"><div class="details">' + json.text + '</div></div>\
			</div>');
	},
	openAdd : function(evt){
		setTimeout($.proxy(function(){
			$(window).bind('mousedown', this.closeAdd);
			this.element.find('div.cal-head div.cal-add').html("-").unbind('mousedown', this.openAdd);
			this.element.addClass('adding').find('.cal-add-menu').slideDown(300);
			var time = new Date();
			time = (((time.getTime()/60000)&~0) - time.getTimezoneOffset())%1440 / 1440;
			this.addTime.set(time);
		},this),1);
	},
	closeAdd : function(evt){
		if(evt && $(evt.target).closest('.cal-add-menu').length) return;
		$(window).unbind('mousedown', this.closeAdd);
		this.element.removeClass('adding');
		this.element.find('div.cal-add').html("+").bind('mousedown', this.openAdd);
		this.element.find('div.cal-add-menu').slideUp(300);
		this.addText.reset();
	},
	saveAdd : function(evt){
		if(this.addText.element.is('.unchanged') || !this.addText.element.val().length){
			this.addText.error('cannot be empty');
			return;
		}
		
		var time = new Date();
		var data = {
			type: 'event',
			request: 'add',
			time: (((this.addTime.get() * 96)&~0)*900) + (this.element.find('.cal-head input').val()&~0),
			text: this.addText.element.val()
		};
		drdelambre.publish('/calendar/add', [data]);
		this.addEvent(data);
		this.closeAdd();
	},
	updateTime : function(percent){
		var time = ((96 * percent)&~0) * 15;
		if(percent == 1) time = 1425;
		var hours = (time / 60)&~0,
			mer = 'am';
		time = time%60;
		if(hours >= 12){
			mer = 'pm';
			hours = hours == 12?hours:hours-12;
		} else if(hours == 0) hours = 12;
		
		if(time < 10) time = '0' + time;
		
		this.element.find('.cal-add-menu .cal-time').html(hours + ':' + time + '<span>' + mer + '</span>');
	}
});

