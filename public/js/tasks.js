drdelambre.tasks = {
	init : function(elem){
		var creator = new drdelambre.tasks.TodoCreator('#new-list', function(json){
			$(window).unbind('mousedown',creatorClose);
			$('#new-list').slideUp(300);
			$('#add-list').delay(100).slideDown(400);
			
			if(!json) return;
			var div = creator.createList(json);

			$('#lists div.list.selected').each(function(){ this.inst.toggle(); });
			$('#lists').prepend(div.css({ display: 'none' }));

			new drdelambre.tasks.TodoList(div);
			div.delay(400).slideDown(400);
		});

		var creatorClose = function(evt){
			if($(evt.target).closest('#new-list').length) return;
			creator.close();
		};

		$('#add-list').bind('mousedown', function(){
			$('#add-list').slideUp(300);
			$('#new-list').delay(100).slideDown(400);
			setTimeout(function(){
				$(window).bind('mousedown', creatorClose);
			},1);
		});

		$('#lists .list').each(function(){
			new drdelambre.tasks.TodoList(this);
		});
	}
};

drdelambre.tasks.TodoCreator = new drdelambre.class({
	element: null,
	onclose: null,

	init : function(elem, _onclose){
		this.onclose = _onclose;
		if(!elem) this.element = this.create();
		else this.element = $(elem);
		this.dater = new drdelambre.tasks.DateSelect(this.element.find('.date-box'));
		new drdelambre.default.Textarea(this.element.find('.input-wrap.name-wrap'),{ defaultText: '', enter: this.save });
		new drdelambre.default.Textarea(this.element.find('.desc-wrap .input-wrap'), { defaultText: '', enter: this.save });
		new drdelambre.default.InvisibleSlider(this.element.find('.user-list'));
		this.element.find('.desc-wrap textarea').bind('input blur', this.activeDesc);
		this.element.find('.bottom-box .button.notice').bind('mousedown', this.save);
		this.element.find('.bottom-box .button:not(.notice)').bind('mousedown', this.close);
		this.element.find('.date-select input.date-entry').bind('focus', this.openDate);
		this.element.find('.date-select input.date-entry').bind('input', this.updateDate);
		this.element.find('.invite-action .button').bind('mousedown', this.addInviteUser);
		new drdelambre.default.Textarea(this.element.find('.invite-action .input-wrap'), {
			defaultText: '',
			enter: this.addInviteUser
		});
		this.element.find('.invite-action input').bind('input blur', function(evt){
			$(this).closest('.invite-action').removeClass('active');
			if(!$(this).is('.unchanged')) $(this).closest('.invite-action').addClass('active');
		});
	},
	create : function(){
		var div = '<div class="list-edit">\
				<input type="hidden" value="0">\
				<div class="name-title">name</div>\
				<div class="input-wrap name-wrap"><textarea></textarea></div>\
				<div class="desc-wrap" style="margin: 0.5em 0pt;">\
					<div class="txt-title">description</div>\
					<div class="input-wrap"><textarea></textarea></div>\
				</div>\
				<div class="user-list" style="display:none"></div>\
				<div class="invite-action">\
					<div class="button notice">invite</div>\
					<div class="input-wrap"><input /></div>\
				</div>\
				<div class="bottom-box">\
					<div class="buttons">\
						<div class="button notice" style="float: right;">save</div>\
						<div class="button" style="float: right;">cancel</div>\
					</div>\
					<span class="date-select">start date <input class="date-entry" /></span>\
					<span class="date-select" style="margin-left:1em;">end date <input class="date-entry" /></span>\
				</div>\
				<div class="date-box" style="display:none">\
					<div class="year"><div class="year-wrap">\
					</div></div>\
					<div class="month"><div class="month-wrap">\
						<span>jan</span>\
						<span>feb</span>\
						<span>mar</span>\
						<span>apr</span>\
						<span>may</span>\
						<span>jun</span>\
						<span>jul</span>\
						<span>aug</span>\
						<span>sep</span>\
						<span>oct</span>\
						<span>nov</span>\
						<span>dec</span>\
					</div></div>\
					<div class="day"><div class="day-wrap"></div></div>\
				</div>\
			</div>';
		return $(div);
	},
	load : function(json){
		if(json.id && !this.element.find('input:first').is('.input-wrap input'))
			this.element.find('input:first').val(json.id);
		this.element.find('.input-wrap.name-wrap').removeClass('unchanged').find('textarea').val(json.name);
		if(json.text)
			this.element.find('.desc-wrap').addClass('active').find('.input-wrap').removeClass('unchanged').find('textarea').val(json.text);
		var anchor = this.element.find('.user-list');
		if(!json.users) json.users = [];
		for(var ni = 0;ni < json.users.length;ni++)
			anchor.append('<div class="user"><div class="text-wrap">' + json.users[ni] + '</div>');
		if(json.start)
			this.element.find('.bottom-box .date-select').eq(0).addClass('selected').find('input.date-entry').val(this._dateString(json.start));
		if(json.end)
			this.element.find('.bottom-box .date-select').eq(1).addClass('selected').find('input.date-entry').val(this._dateString(json.end));
	},
	close : function(evt){
		if(this.onclose) this.onclose();
		this.reset();
	},
	reset : function(){
		this.element.find('textarea, .invite-action input').each(function(){ this.inst.reset(); });
		this.element.find('input.date-entry').val('');
		this.element.find('.date-select').removeClass('selected');
		this.element.find('.invite-action').removeClass('active');
		this.element.find('.user-list').css({ display: 'none' }).find('.user').remove();
	},
	openDate : function(evt){
		this.element.find('.date-select input.date-entry').unbind('focus', this.openDate);
		var box = this.element.find('.date-box');
		this.dater.options.output = $(evt.target).closest('input');
		this.dater.options.output.closest('.date-select').addClass('selected');
		var date = this._parseDate(this.dater.options.output.val());
		if(!date) date = new Date();
		this.dater.update(date);
		
		if(box.stop().css('display') == 'none')
			box.slideDown(400, $.proxy(function(){ this.dater.center(); },this));
			
		evt.stopPropagation();
		$(window).bind('mousedown', this.closeDate);
	},
	_parseDate : function(str){
		if(!/^([1-9]|0[1-9]|1[12])(\/|-)([1-9]|0[1-9]|(1|2)[0-9]|3[012])(\/|-)((19|20)\d\d)$/.test(str)) return false;
		str = str.replace(/-/g,'/').split('/');
		if(str.length != 3) return false;

		var date = new Date(str[2],str[0]-1,str[1],0,0,0,0);
		if(str[0] - 1 != date.getMonth()) return false;
		return date;
	},
	_dateString : function(date){
		if(!isNaN(parseInt(date)))
			date = new Date(parseInt(date) * 1000);
		return (date.getMonth()+1) + '/' + (date.getDate()<10?'0'+date.getDate():date.getDate()) + '/' + date.getFullYear();
	},
	updateDate : function(evt){
		var date = this._parseDate(this.dater.options.output.val());
		if(!date) return;
		this.dater.update(date);
	},
	closeDate : function(evt){
		if($(evt.target).closest('.date-box').length || $(evt.target).closest(this.dater.options.output).length)
			return;

		$(window).unbind('mousedown', this.closeDate);
		this.dater.options.output = null;
		this.element.find('.date-select input.date-entry').bind('focus', this.openDate);
		this.element.find('.date-box').slideUp(400);
	},
	save : function(evt){
		var name = this.element.find('.name-wrap textarea');
		if(name.closest('.input-wrap').is('.unchanged') || !name.val().length){
			name[0].inst.error('name required');
			return;
		}
		
		var emails = [];
		this.element.find('.user-list .user').each(function(){
			emails.push($(this).find('.text-wrap').text());
		});
		var data = {
			type: 'todolist',
			request: 'edit',
			name: this.element.find('.name-wrap textarea').val(),
			users: emails
		};
		
		if(!this.element.find('input:first').is('.input-wrap input'))
			data.id = this.element.find('input:first').val();
		
		if(!this.element.find('.desc-wrap textarea').is('.unchanged'))
			data.description = this.element.find('.desc-wrap textarea').val();
			
		var dates = this.element.find('.bottom-box .date-select');
		if(dates.eq(0).is('.selected') && dates.eq(0).find('input').val().length){
			var start = this._parseDate(dates.eq(0).find('input').val());
			if(start!==false) data.start = start.getTime()/1000;
		}
		if(dates.eq(1).is('.selected') && dates.eq(1).find('input').val().length){
			var end = this._parseDate(dates.eq(1).find('input').val());
			if(end!==false) data.end = end.getTime()/1000;
		}

		var retFunc = $.proxy(function(json){
			if(this.onclose) this.onclose(json);
			this.reset();
		}, this);

		$.ajax({ data: JSON.stringify(data), context: this, success: retFunc });
	},
	activeDesc : function(evt){
		setTimeout(function(){
			var par = $(evt.target).closest('.desc-wrap').removeClass('active');
			if(!$(evt.target).closest('.input-wrap').is('.unchanged')) par.addClass('active')
		},5);
	},
	createList : function(json){
		var div = '\
			<div class="list selected">\
				<input type="hidden" value="' + json.id + '" />\
				<div class="info">\
					<div class="buttons"><div class="button notice">delete</div></div>\
					<div class="name"><div class="remaining"><span>0</span>remain</div>' + json.name + '</div>';
		if(json.description)
			div += '<div class="list-text">' + json.description + '</div>';
		div += '\
				</div>\
				<div class="active" style="display:none;"></div>\
				<div class="new-todo"><div class="new-todo-wrap">\
					<div class="buttons">\
						<div class="button notice">clear</div>\
						<div class="button">add</div>\
					</div>\
					<div class="input-wrap"><textarea></textarea></div>\
				</div></div>\
				<div class="inactive" style="display:none;"><div class="window-nav">\
					<div class="nav" style="display:none;">\
						<div class="button prev" style="display:none;"><span>0</span>older</div>\
						<div class="button nect" style="display:none;"><span>0</span>newer</div>\
					</div>\
					<div class="wrap" style="display:none;">\
						<div class="prev-holder" style="display:none"></div>\
						<div class="window"></div>\
						<div class="next-holder" style="display:none"></div>\
					</div>\
				</div></div>\
			</div>';
		div = $(div);
		return div;
	},
	addInviteUser : function(evt){
		var list = this.element.find('.user-list'),
			inp = this.element.find('.invite-action input');
		if(inp.is('.unchanged')) return;
		if(list.css('display') == 'none')
			list.slideDown(400);
		var div = $('<div class="user"><div class="text-wrap">' + inp.val() + '</div>');
//		div.find('.button').bind('mousedown', this.removeInvite);
		div.addClass((list.find('.user').length + 1)%2?' odd':' even');
		inp[0].inst.reset();
		inp.focus();
		list.append(div);
		list.animate({ scrollTop: list[0].scrollHeight - list[0].clientHeight },{ duration: 300 });
	}
});

drdelambre.tasks.DateSelect = new drdelambre.class({
	element : null,
	options : {
		output : null,
		overdrag: 50
	},
	date : null,
	
	init: function(elem, options){
		this.element = $(elem);
		this.options = $.extend(this.options, options);
		if(this.options.output) this.options.output = $(this.options.output);
	
		new drdelambre.default.ComplexMouse({
			element: this.element.find('div.month'),
			
			click: this.setMonth,
			start: this.startMonth,
			move: this.moveMonth,
			end: this.endMonth
		});	
	
		new drdelambre.default.ComplexMouse({
			element: this.element.find('div.day'),
			
			click: this.setDay,
			start: this.startDay,
			move: this.moveDay,
			end: this.endDay
		});
	
		this.element.find('div.year').bind('mousedown',this.setYear);
	},
	update : function(date){
		if(!this.date || this.date.getMonth() != date.getMonth() || this.date.getFullYear() != date.getFullYear()){
			var days = ['sun','mon','tues','wed','thur','fri','sat'];
			var currDay = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 1, 0).getDay();
			var lastDay = new Date(date.getFullYear(), date.getMonth()+1, 0, 0, 0, 0, 0);
			//signal refresh of days
			var wrap = this.element.find('div.day-wrap');
			wrap.find('span').remove();
			for(ni = 1; ni <= lastDay.getDate();ni++){
				var str = '<span' + (date.getDate() == ni?' class="selected"':'') + '>';
				if(ni < 10) str += '0';
				str += ni + '<div>' + (days[currDay]) + '</div></span>';
				currDay = (currDay+1)%7;
				wrap.append(str);
			}
		}
		this.date = new Date(date.getTime());
		var year = this.element.find('div.year-wrap span').removeClass('selected').filter((function(dater){ return function(){ return ($(this).html()&~0) == dater.getFullYear() }})(this.date));
		if(!year.length){
			year = $('<span>' + this.date.getFullYear() + '</span>');
			var yearBox = this.element.find('div.year-wrap');
			this.element.find('div.year-wrap span').remove();
			yearBox.append(year);
			if(this.element.css('display') != 'none'){
				var curr = 0,
					dateYear = this.date.getFullYear();
				while(yearBox[0].scrollWidth <= yearBox.width())
					yearBox.prepend('<span>' + (dateYear - ++curr) + '</span>').append('<span>' + (dateYear + curr) + '</span>');
			}
		}
		year.addClass('selected');
		this.element.find('div.month-wrap span').removeClass('selected').eq(this.date.getMonth()).addClass('selected');
		this.element.find('div.day-wrap span').removeClass('selected').eq(this.date.getDate() - 1).addClass('selected');
		if(this.element.css('display') != 'none') this.center();
		if(this.options.output){
			if(this.options.output[0].nodeName.toLowerCase() == 'input')
				this.options.output.val((this.date.getMonth() + 1) + '/' + this.date.getDate() + '/' + this.date.getFullYear());
			else
				this.options.output.html((this.date.getMonth() + 1) + '/' + this.date.getDate() + '/' + this.date.getFullYear());
		}
	},
	center : function(){
		var day = this.element.find('div.day-wrap span.selected');
		
		var off = this.element.width()/2 - (day.position().left + day.outerWidth(true)/2);
		var right = this.element.width() - this.element.find('div.day-wrap')[0].scrollWidth;
		if(off > 0) off = 0;
		else if(off < right) off = right;

		this.element.find('div.day-wrap').animate({ left: off },{ duration: 300 });

		day = this.element.find('div.month-wrap span.selected');
		
		off = this.element.width()/2 - (day.position().left + day.outerWidth(true)/2);
		right = this.element.width() - this.element.find('div.month-wrap')[0].scrollWidth;
		if(off > 0) off = 0;
		else if(off < right) off = right;

		this.element.find('div.month-wrap').animate({ left: off },{ duration: 400 });

		day = this.element.find('div.year-wrap span.selected');

		off = this.element.width()/2 - (day.position().left + day.outerWidth(true)/2);
		
		//adding years to the beginning
		var yearBox = this.element.find('div.year-wrap');
		if(off > 0){
			var year = this.element.find('div.year-wrap span:first').html()&~0,
				lefter = day.offset().left,
				curr = 1;
			while(day.position().left <= off)
				yearBox.prepend('<span>' + (year - curr++) + '</span>');
			yearBox.prepend('<span>' + (year - curr) + '</span>');

			yearBox.css({ left: yearBox.position().left + lefter - day.offset().left });
			off = this.element.width()/2 - (day.position().left + day.outerWidth(true)/2);
		}

		//adding years to the end
		var left = yearBox[0].scrollWidth + off - yearBox.width();
		if(left < 0){
			var year = this.element.find('div.year-wrap span:last').html()&~0,
				newOne = null,
				curr = 1;
			while(left < 0){
				newOne = $('<span>' + (year + curr++) + '</span>');
				yearBox.append(newOne);
				left += newOne.outerWidth(true);
			}
			yearBox.append('<span>' + (year + curr) + '</span>')
		}

		this.element.find('div.year-wrap').stop().animate({ left: off },{ duration: 600, complete: function(){
			//triming years from the end
			var curr = tmp = $(this).find('span:last'),
				lefter = $(this).position().left;
				par = $(this).closest('div.year');
			while(curr.offset().left > par.offset().left + par.width()){
				tmp = curr;
				curr = curr.prev('span');
				tmp.remove();
			}

			//triming years from the beginning
			tmp = [];
			curr = $(this).find('span:first')
			lefter = this.scrollWidth;
			while(off + curr.position().left + curr.outerWidth(true) < 0){
				tmp.push(curr);
				curr = curr.next('span');
			}

			for(var ni = tmp.length; ni != 0;)
				tmp[--ni].remove();
				
			$(this).css({ left: '+=' + (lefter - this.scrollWidth) });
		}});
	},

	setYear : function(evt){
		if(!$(evt.target).closest('span').length) return;
		this.element.find('div.year-wrap span').removeClass('selected');
		$(evt.target).closest('span').addClass('selected');
		var date = new Date($(evt.target).closest('span').html(), this.date.getMonth(),this.date.getDate(),0,0,0,0);
		if(date.getMonth()!=this.date.getMonth()) date = new Date($(evt.target).closest('span').html(),this.date.getMonth()+1,0);
		this.update(date);
	},
	setMonth : function(evt){
		if(!$(evt.target).closest('span').length) return;
		this.element.find('div.month-wrap span').removeClass('selected');
		$(evt.target).closest('span').addClass('selected');
		var month = $(evt.target).prevAll('span').length;
		var date = new Date(this.date.getFullYear(), month,this.date.getDate(),0,0,0,0);
		if(month != date.getMonth()) date = new Date(date.getFullYear(), month+1, 0);
		this.update(date);
	},
	setDay : function(evt){
		var elem = $(evt.target).closest('div.day-wrap span');
		if(!elem.length) return;
		this.element.find('div.day-wrap span').removeClass('selected');
		elem.addClass('selected');
		this.update(new Date(this.date.getFullYear(), this.date.getMonth(),$(evt.target).closest('span').prevAll('span').length+1,0,0,0,0));
	},

	startMonth : function(evt){
		var month = this.element.find('div.month-wrap');
		this.monthOff = evt.pageX - month.position().left;
		this.monthDiff = month.width() - month[0].scrollWidth;
	},
	moveMonth : function(evt){
		var nLeft = evt.pageX - this.monthOff;
		if(nLeft > 0){
			var off = this.element.find('div.month').offset().left;
			nLeft = this.spring(evt.pageX - off,0,this.options.overdrag,$(window).width() - off);
			if(nLeft > this.options.overdrag) nLeft = this.options.overdrag;
		} else if(nLeft < this.monthDiff){
			var month = this.element.find('div.month-wrap');
			if(!this.msX) this.msX = evt.pageX;
			nLeft = this.spring(this.msX-evt.pageX,month.width() - month[0].scrollWidth,-this.options.overdrag,this.msX);
			if(nLeft < this.monthDiff - this.options.overdrag) nLeft = this.monthDiff - this.options.overdrag;
		}
		this.element.find('div.month-wrap').css({ left: nLeft });
	},
	endMonth : function(evt){
		var month = this.element.find('div.month-wrap');
		var left = month.position().left;
		if(left > 0 || left < this.monthDiff)
			this.oMonth(350);

		delete this.msX,this.monthOff, this.monthDiff;
	},
	oMonth : function(duration){
		var time = 0,
			month = this.element.find('div.month-wrap'),
			diff = 0;
		var curr = month.position().left;
		if(curr > 0) diff = -curr;
		else diff = month.width() - month[0].scrollWidth - curr;

		var move = $.proxy(function(){
			month.css({ left: this.spring(time,curr,diff,duration) });
			time += 50;
			if(time > duration){
				clearInterval(this.monthTimer);
				delete this.monthTimer;
			}
		},this);
		this.monthTimer = setInterval(move,50);
		move();
	},

	spring : function(time, start,diff,duration){
		time /= duration;
		time--;
		return diff*(time*time*time + 1) + start;
	},
	
	startDay : function(evt){
		var day = this.element.find('div.day-wrap');
		this.dayOff = evt.pageX - day.position().left;
		this.dayDiff = day.width() - day[0].scrollWidth;
	},
	moveDay : function(evt){
		var nLeft = evt.pageX - this.dayOff;
		if(nLeft > 0){
			var off = this.element.find('div.day').offset().left;
			nLeft = this.spring(evt.pageX - off,0,this.options.overdrag,$(window).width() - off);
			if(nLeft > this.options.overdrag) nLeft = this.options.overdrag;
		} else if(nLeft < this.dayDiff){
			var day = this.element.find('div.day-wrap');
			if(!this.dsX) this.dsX = evt.pageX;
			nLeft = this.spring(this.dsX-evt.pageX,day.width() - day[0].scrollWidth,-this.options.overdrag,this.dsX);
			if(nLeft < this.dayDiff - this.options.overdrag) nLeft = this.dayDiff - this.options.overdrag;
		}
		this.element.find('div.day-wrap').css({ left: nLeft });
	},
	endDay : function(evt){
		var day = this.element.find('div.day-wrap');
		var left = day.position().left;
		if(left > 0 || left < this.dayDiff)
			this.oDay(250);

		delete this.dsX,this.dayOff, this.dayDiff;
	},
	oDay : function(duration){
		var time = 0,
			day = this.element.find('div.day-wrap'),
			diff = 0;
		var curr = day.position().left;
		if(curr > 0) diff = -curr;
		else diff = day.width() - day[0].scrollWidth - curr;

		var move = $.proxy(function(){
			day.css({ left: this.spring(time,curr,diff,duration) });
			time += 50;
			if(time > duration){
				clearInterval(this.dayTimer);
				delete this.dayTimer;
			}
		},this);
		this.dayTimer = setInterval(move,50);
		move();
	}
});

drdelambre.tasks.TodoList = new drdelambre.class({
	element : null,
	canFetch: true,

	init : function(elem){
		this.element = $(elem);
		this.element[0].inst = this;
		var buttons = this.element.find('.info .button');
		buttons.eq(0).bind('mousedown', $.proxy(function(){
			new drdelambre.default.Confirm({
				message: 'positive?',
				actions:[
					['no', null],
					['yes', this.remove]
				]
			});
		}, this));
	
		this.mouse = new drdelambre.default.ComplexMouse({
			element: this.element.find('.info .name'),
			
			dblclick: this.editMode,
			click: this.toggle,
			start: this.start,
			move: this.move,
			end: this.end
		});
	
		buttons = this.element.find('.new-todo .button');
		buttons.eq(0).bind('mousedown', this.clearTodo);
		buttons.eq(1).bind('mousedown', this.createTodo);
	
		this.element.find('.entry').each(function(ni,oz){ new drdelambre.tasks.Todo(oz); });
	
		new drdelambre.default.Textarea(this.element.find('.new-todo .input-wrap'), { enter: this.createTodo, defaultText: 'enter a task' });
	
		this.element.find('.inactive').bind('mousewheel DOMMouseScroll', this.deadScroll);

		drdelambre.subscribe('/todo/edit/*', this.disableNew);
		drdelambre.subscribe('/todo/toggle/*', this.disableNew);
		drdelambre.subscribe('/todo/save/*', this.enableNew);
		drdelambre.subscribe('/todo/cancel/*', this.enableNew);

		drdelambre.subscribe('/todo/done', this.doneTodo);
		drdelambre.subscribe('/todo/undone', this.undoneTodo);
		drdelambre.subscribe('/todo/remove', this.removeTodo);

		drdelambre.subscribe('/todo/sort/start',
			$.proxy(function(elem){
				this.element.addClass('blur');
				if(!this.element.is('.selected')) return;
				this.open(true);
			},this)
		);
		drdelambre.subscribe('/todo/sort/end',
			$.proxy(function(elem){
				this.element.removeClass('blur');
//				if(!this.element.is('.selected')) return;
				if(!elem.closest(this.element).length){
					this.close();
					return;
				}
				this.open();

				var ent = this.element.find('.active .entry');
				var order = [];
				for(var ni = 0; ni < ent.length; ni++)
					order[ni+1] = ent.eq(ni).find('input:first').val();
	
				var data = {
					type: "todo",
					request: 'reorder',
					id: elem.find('input:first').val(),
					list: this.element.find('input:first').val(),
					order: order
				};
	
				$.ajax({ data: JSON.stringify(data) });
			},this)
		);
	},
	remove : function(){
		var jdata = JSON.stringify({ type: 'todolist', request: 'remove', id: this.element.find('input:first').val() });
		var retFunc = $.proxy(function(resp){
			if(resp.status != 'success') return;
			this.element.animate({
				opacity: 0,
				height: 0,
				marginTop: 0,
				marginBottom: 0
			},{
				duration: 300,
				complete: function(){ $(this).remove(); }
			});
		},this);

		$.ajax({ data: jdata, context: this, success: retFunc });
	},
	toggle : function(onlyActive){
		var isOpen = this.element.is('.selected');
		$('div.list.selected').each(function(ni, oz){ oz.inst.close(); });
		if(!isOpen) this.open(onlyActive);
	},
	open : function(onlyActive){
		var active = this.element.find('div.active'),
			entry = this.element.find('div.new-todo'),
			dead = this.element.find('div.inactive');

		if(!onlyActive && this.element.is('.selected') && entry.css('display') == 'none'){
			active.css({ 'border-bottom': '' });
			entry.slideDown(300, 'linear', null);
			if(dead.find('.entry').length) dead.slideDown(300, 'linear', null);
			return;
		}
		if(this.element.is('.selected') && onlyActive && entry.css('display') == 'none') return;

		this.element.addClass('selected');
		entry.find('textarea')[0].inst.reset();
		if(active.find('div.entry').length && active.css('display') == 'none') active.css({ display: '' }).css({ width: active.width(), display: 'none' }).slideDown(300, null);
		if(onlyActive === true){
			active.css({ 'border-bottom': 'none' });
			entry.slideUp(300, 'linear', null);
			dead.slideUp(300, 'linear', null);
			return;
		}
		entry.css({ display: '' }).css({ width: entry.width(), display: 'none' }).slideDown(300, function(){
			$(this).css({ width: '' }).trigger('resizer');
		});
		if(dead.find('div.entry').length)
			dead.css({ display: '' }).css({ width: dead.width(), display: 'none' }).slideDown(300, function(){
				this.scrollTop = this.scrollHeight - this.clientHeight;
			});
	},
	close : function(){
		if(!this.element.is('.selected')) return;
		var active = this.element.find('div.active'),
			entry = this.element.find('div.new-todo'),
			dead = this.element.find('div.inactive');

		this.element.removeClass('selected');
		this.element.find('div.entry.selected').each(function(ni, oz){ oz.inst.hide(); });
		active.width(active.width()).slideUp(200, 'linear', function(){
			$(this).css({ width: '', 'border-bottom': '' });
		});
		entry.width(entry.width()).slideUp(200, 'linear', function(){
			$(this).css({ width: '' }).trigger('resizer');
			$(window).resize();
		});
		dead.width(dead.width()).slideUp(200, 'linear', function(){ $(this).css({ width: '' }); });
	},
	editMode : function(evt){
		var retFunc = $.proxy(function(json){
			if(json.status != 'success') return;
			this.mouse.remove();
			$('#lists .list.selected').not(this.element).each(function(){ this.inst.toggle(); });
			if(this.element.is('.selected')) this.open(true);
			this.element.find('div.info').slideUp(400, $.proxy(function(){
				var editor = new drdelambre.tasks.TodoCreator(null,$.proxy(function(jsonr){
					$(window).unbind('mousedown', windowClose);

					editor.element.slideUp(300, $.proxy(function(){
						$('#lists .list').animate({ opacity: 1 },{ duration: 300, complete: function(){ $(this).removeClass('blur'); }});
						editor.element.remove();
						this.element.find('div.info').slideDown(300);
						if(this.element.is('.selected')) this.open();
					},this));

					this.mouse = new drdelambre.default.ComplexMouse({
						element: this.element.find('div.info div.name'),
						
						dblclick: this.editMode,
						click: this.toggle,
						start: this.start,
						move: this.move,
						end: this.end
					});
					
					if(!jsonr) return;
					this.element.find('.info .name').html('<div class="remaining">' + this.element.find('.info .name .remaining').html() + '</div>' + jsonr.name);
					var anchor = this.element.find('.list-text');
					if(jsonr.description){
						if(anchor.length) anchor.html(jsonr.description);
						else this.element.find('.info .name').after('<div class="list-text">' + jsonr.description + '</div>');
					} else if(anchor.length) anchor.remove();
					anchor = this.element.find('.info .times');
					if(jsonr.start){
						if(!anchor.length){
							this.element.find('.info').append('<div class="times">' + editor._dateString(jsonr.start) + '</div>');
							anchor = this.element.find('.name .times');
						} else anchor.html(editor._dateString(jsonr.start));
						if(jsonr.end) anchor.append('<span>until</span>' + editor._dateString(jsonr.end));
					} else if(anchor.length) anchor.remove();
				},this));
				var windowClose = function(evt){
					if($(evt.target).closest(editor.element).length) return;
					editor.close();
				};
				$(window).bind('mousedown', windowClose);
				editor.load(json);
				this.element.find('.new-todo, .inactive').slideUp(300, $.proxy(function(){
					var act = this.element.find('.active');
					if(act.find('div.entry').length) act.css({ borderBottom: 'none' });
				},this));
				this.element.before(editor.element.css({ display: 'none' }));
				editor.element.slideDown(300);
				$('#lists .list').addClass('blur').animate({ opacity: 0.4 },{ duration: 300 });
				this.element.stop().removeClass('blur').css({ opacity: '' });
			}, this));
		}, this);

		var data = {
			type: 'todolist',
			request: 'info',
			id: this.element.find('input:first').val()
		};
		$.ajax({ data: JSON.stringify(data), context: this, success: retFunc });
		$('div.list.selected').not(this.element).each(function(ni, oz){ oz.inst.toggle(); });
	},

	start : function(evt){
		//ok, i know this is hard to read, and it doesn't cache dimensions
		//so code is executed everytime i just wanted a variable
		//but it's three lines! there's beauty in how it all falls together.
		this.spacer = $('<div class="list spacer"></div>');

		$('#content').append(this.element.before(this.spacer.css({
			width: this.element.width(),
			height: this.element.height()
		})).css({
			position: 'absolute',
			top: this.spacer.position().top,
			left: this.spacer.position().left,
			width: this.spacer.width()
		})).find('.list:not(.spacer)').each(function(){ this.inst.close(); }).not(this.element).addClass('blur');

		this.startY = evt.pageY - this.spacer.animate({
				height: this.element.find('.info').height()
			},{ duration: 400 }).position().top;
	},
	move : function(evt){
		var nY = evt.pageY - this.startY;
		this.element.css({ top: nY });
		
		var next = this.spacer.next('.list'),
			prev = this.spacer.prev('.list');
		if(next.length && evt.pageY > next.position().top + next.outerHeight(true)/2)
			next.after(this.spacer);
		else if(prev.length && evt.pageY < prev.position().top)
			prev.before(this.spacer);
	},
	end : function(evt){
		this.element.animate({
			top: this.spacer.position().top
		},{ duration: 300, complete: $.proxy(function(){
			this.spacer.before(this.element.css({
				top: '',
				left: '',
				width: '',
				position: ''
			})).remove();
			$('#content .list').removeClass('blur');

			var order = [];
			$('#lists .list').each(function(ni,oz){
				order[ni] = $(oz).find('input:first').val();
			});

			var data = {
				type: "todolist",
				request: 'reorder',
				order: order
			};
			
			$.ajax({ data: JSON.stringify(data) });
		}, this)});
	},

	clearTodo : function(evt){},
	createTodo : function(evt){
		var text = this.element.find('.new-todo textarea');

		var data = {
			type: 'todo',
			request: 'edit',
			list: this.element.find('input:first').val(),
			text: text.val()
		};
		
		var retFunc = $.proxy(function(json){
			if(json.status != 'success') return;
			text[0].inst.reset();
			text.focus();
			var div = this._createTodo(json);

			var act = this.element.find('div.active');
			if(act.css('display') == 'none'){
				div.addClass('odd');
				act.append(div).slideDown(300);
			} else {
				div.addClass(act.find('.entry:last').is('.odd')?'even':'odd');
				act.append(div.css({ display: 'none' }));
				div.slideDown(300);
			}
			
			new drdelambre.tasks.Todo(div);

			setTimeout($.proxy(function(){
				var span = this.element.find('div.info div.name div.remaining span');
				if(span.length) span.html((span.html()&~0) + 1);
			},this),200);
		},this);
		
		$.ajax({ data: JSON.stringify(data), context: this, success: retFunc });
	},
	_createTodo : function(json){
		var claimed = false;	//
		var by_me = false;		// unimplemented
		
		if(!json.comments) json.comments = [];

		var comStr = "";
		for(var ni = 0; ni < json.comments.length; ni++)
			comStr += "<div class=\"comment" + (ni == json.comments.length - 1?' last':'') + "\">\
				<input type='hidden' value='" + json.comments[ni].id + "'>\
				<div class='creator'>" + json.comments[ni].creator + "\
					<span class='time'><input type='hidden' value='" + json.comments[ni].created + "'>" + drdelambre.relativeTime(json.comments[ni].created) + "</span>\
				</div>" + json.comments[ni].text + "</div>";
		
		var div = "<div class=\"entry" + (json.created?'':' done') + "\"> \
			<input type=\"hidden\" value=\"" + json.id + "\"> \
			<div class=\"buttons\">" + (claimed?by_me?"<div class=\"claim selected\">unclaim</div>":"<div class=\"claim claimed\">claimed</div>":"<div class=\"claim\">claim</div>") + "\
				<div class=\"checkbox" + (json.created?'':' selected') + "\"></div></div> \
			<div class=\"body\"> \
				<div class=\"text-wrap\">";

		if(!json.created) div += "<div class=\"completed\"><img src=\"./images/trash.png\">" + json.completed_by + "<span class='time'><input type='hidden' value='" + json.completed + "'>" + drdelambre.relativeTime(json.completed) + "</span></div>";
		div += json.text + "</div>";
		if(json.created) div += "\
			<div class=\"comment" + (json.comments.length?' avail':'') + "\"> \
				<img src=\"" + URL_BASE + "/images/commentA.png\"><span>" + (json.commentCount?json.commentCount:'') + "</span> \
			</div>";
		else if(json.comments.length) div += '\
			<div class="comment">\
				<img src="' + URL_BASE + '/images/commentA.png\"> \
			</div>';

		div += "</div> \
			<div class=\"comment-list\" style=\"display: none\"> \
				<div class=\"comments\"" + (comStr.length?'':' style="display:none;"') + ">" + comStr + "</div>";

		if(json.created) div += "\
			<div class=\"new-comment\"> \
				<div class=\"buttons\"> \
					<div class=\"button notice\">clear</div> \
					<div class=\"button\">add</div> \
				</div> \
				<div class=\"hours\">\
					<div class=\"input-wrap\"><input /></div> \
					<div class=\"title\">hours</div> \
				</div> \
				<div class=\"input-wrap\"><textarea></textarea></div>\
			</div>";
		div += " \
			</div> \
		</div>";
		
		return $(div);
	},
	
	disableNew : function(elem){
		if(!elem.closest(this.element).length) return;
		elem = this.element.find('.new-todo');
		if(elem.is('.disabled')) return;
		elem.addClass('disabled').stop().animate({ opacity: 0.4 },{ duration: 300 });
		elem.find('textarea')[0].inst.disable();
	},
	enableNew : function(elem){
		if(!elem.closest(this.element).length) return;
		elem = this.element.find('.new-todo');
		if(!elem.is('.disabled')) return;
		elem.removeClass('disabled').stop().animate({ opacity: 1 },{ duration: 300 });
		elem.find('textarea')[0].inst.enable();
	},

	doneTodo : function(elem){
		if(!elem.closest(this.element).length) return;
		this.enableNew(elem);
		this.element.find('.info .remaining span').html(this.element.find('.active .entry').length - 1);
		var par = elem.closest('.active, .inactive');
		if(par.find('.entry').length == 1)
			par.slideUp(400, function(){
				elem.remove();
				$(this).trigger('resizer');
			});
		else
			elem.css({
				height: elem.height(),
				opacity: 1
			}).animate({
				opacity: 0,
				height: 0
			},{ duration: 200, easing: 'linear', complete: function(){
				elem.trigger('resizer').remove();
			}});

		var retFunc = function(json){
			var todo = this._createTodo(json), list = this.element.find('.inactive');
			new drdelambre.tasks.Todo(todo);
			list.append(todo);
			list.animate({
				scrollTop: list[0].scrollHeight - list[0].clientHeight
			},{ duration: 300 });
			if(list.css('display')=='none')
				list.slideDown(400);
		};

		var data = {
			type:"todo",
			request:'edit',
			id: elem.find('input:first').val(),
			completed: true
		};

		$.ajax({ data: JSON.stringify(data), context: this, success: retFunc });
	},
	undoneTodo : function(elem){
		if(!elem.closest(this.element).length) return;
		var retFunc = function(json){
			var div = this._createTodo(json);
			div.removeClass('even odd').addClass(this.element.find('.active .entry:last').is('.odd')?'even':'odd');
			this.element.find('.active').append(div);
			this.element.find('.info .remaining span').html(this.element.find('.active .entry').length);
			var h = div.height();
			div.css({ height: 0, opacity: 0 }).animate({
				height: h,
				opacity: 1
			},{ duration: 200, complete:  function(){
				new drdelambre.tasks.Todo(this);
				$(this).css({ height: '' }).trigger('resizer');
			}});
		};

		var data = {
			type:"todo",
			request:'edit',
			id: elem.find('input:first').val(),
			completed: false
		};

		$.ajax({ data: JSON.stringify(data), context: this, success: retFunc });
		if(this.element.find('.inactive .entry').length == 1)
			this.element.find('.inactive').slideUp(400);
		if(!this.element.find('.active .entry').length)
			this.element.find('.active').slideDown(400);
		elem.slideUp(300, function(){ $( this).remove(); });
	},
	removeTodo : function(elem){
		if(!elem.closest(this.element).length) return;
		var data = {
			type: 'todo',
			request: 'remove',
			id: elem.find('input:first').val()
		};
		
		$.ajax({ data: JSON.stringify(data) });
		
		if(this.element.find('.inactive .entry').length == 1)
			this.element.find('.inactive').slideUp(400);
		elem.slideUp(300, function(){ $(this).remove(); });
	},
	
	deadScroll : function(evt){
		var wheel = { x: 0, y: 0 },
			e = evt.originalEvent,
			speed = 0.1,
			elem = this.element.find('.inactive');
	
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

		if(elem.scrollTop() - wheel.y > 0 && elem.scrollTop() - wheel.y < elem[0].scrollHeight - elem[0].clientHeight){
			evt.stopPropagation();
			evt.preventDefault();
		}
	
		elem.scrollTop(elem.scrollTop() - wheel.y);
		elem.scrollLeft(elem.scrollLeft() - wheel.x);
		
		if(this.canFetch && elem.scrollTop() < elem.height()){
			this.canFetch = false;
			var data = {
				type: 'todolist',
				request: 'fetch',
				start: elem.find('.entry').length,
				id: this.element.find('input:first').val()
			};
	
			$.ajax({ data: JSON.stringify(data), context: this, success: this.deadFetch });
		}
	},
	deadFetch : function(json){
		if(json.status != 'success' || !json.entries.length) return;
		var todo, list = this.element.find('.inactive');
		var h = list[0].scrollHeight;
		for(var ni = json.entries.length; ni!=0;){
			todo = this._createTodo(json.entries[--ni]);
			list.prepend(todo);
			new drdelambre.tasks.Todo(todo);
		}
		list.scrollTop(list.scrollTop() + list[0].scrollHeight - h);
		
		if(json.entries.length) this.canFetch = true;
	}
});

drdelambre.tasks.Todo = new drdelambre.class({
	element: null,
	canFetch: true,
	comInit: false,
	
	init : function(elem){
		this.element = $(elem);
		this.element[0].inst = this;

		var mouseOpt = {
			element: this.element.find('div.body'),
			click : this.toggle,
		};

		if(this.element.is('.done')){
			this.element.find('div.buttons .checkbox').bind('mousedown', this.unmarkDone);	
			this.element.find('.body .completed img').bind('mousedown',this.remove);
		} else {
			var cominp = this.element.find('.comment-list .new-comment .input-wrap');
			new drdelambre.default.Textarea(cominp.eq(0),{
				defaultText: '0.000',
				enter: this.saveComment,
				type: 'number'
			});
			new drdelambre.default.Textarea(cominp.eq(1),{
				defaultText: 'add comment',
				enter: this.saveComment,
				upload: true
			});
			
			cominp.eq(0).find('input').bind('input blur', this.activateHours);

			this.element.find('div.buttons .checkbox').bind('mousedown', this.markDone);	
			this.element.find('div.new-comment .button:not(.notice)').bind('mousedown', this.saveComment);
			this.element.find('.claim').bind('mousedown', this.toggleClaim);

			mouseOpt.dblclick = this.editMode;
			mouseOpt.start = this.start;
			mouseOpt.move = this.move;
			mouseOpt.end = this.end;
		}

		this.mouse = new drdelambre.default.ComplexMouse(mouseOpt);
		this.element.find('.comments').bind('mousewheel DOMMouseScroll', this.comScroll);
	},
	toggle : function(evt){
		var list = this.element.find('.comment-list'),
			claim = this.element.find('.claim');
		if(!list.is('.selected')){
			list.addClass('selected');
			if(!claim.is('.selected') && !claim.is('.claimed')){
				claim.animate({
					opacity: 1
				},{ duration: 300 });
			}
			var h = list.css({ display: '' }).outerHeight(true);
			list.css({ display: 'none' }).slideDown(300, $.proxy(function(){
				var listr = this.element.find('.comment-list .comments');
				listr.animate({
					scrollTop: listr[0].scrollHeight - listr[0].clientHeight
				},{ duration: 200 });
				if(this.comInit) return;
				this.comInit = true;
				listr.height(listr.stop().height());
				var data = {
					type: 'todo',
					request: 'fetch',
					start: listr.find('.comment').length,
					id: this.element.find('input:first').val()
				};
		
				$.ajax({ data: JSON.stringify(data), context: this, success: this.comFetch });
			},this));
			drdelambre.publish('/todo/toggle/', this.element);
			$(window).bind('mousedown', this.winToggle);
		} else {
			list.removeClass('selected');
			if(!claim.is('.selected') && !claim.is('.claimed')){
				claim.animate({
					opacity: 0
				},{ duration: 300 });
			}
			var files = this.element.find('.new-comment .input-wrap .file');
			if(files.length){
				var data = {
					type: 'file',
					request: 'remove',
					hash: []
				};
				for(var ni = 0; ni < files.length; ni++)
					data.hash.push(files.eq(ni).find('input').val());
				$.ajax({ data: JSON.stringify(data) });
			}
			files.remove();
			$(window).unbind('mousedown', this.winToggle);
			this.element.find('div.comment-list').slideUp(300);
			drdelambre.publish('/todo/cancel/', this.element);
		}
	},
	winToggle : function(evt){ if(!$(evt.target).closest(this.element).length) this.toggle(evt); },
	
	editMode : function(evt){
		this.mouse.remove();
		delete this.mouse;
		if(this.element.find('div.comment-list').css('display') != 'none')
			this.toggle();
		drdelambre.publish('/todo/edit/', this.element);
		$(window).bind('mousedown', this.staticMode);
		
		this.element.find('div.buttons:first').animate({ opacity: 0 },{ duration: 400 });
		this.element.find('div.body div.comment').fadeOut(200);

		this.element.find('div.body div.text-wrap').css({
			backgroundColor: 'rgba(255,255,255,0)'
		}).animate({
			width: '90%',
			paddingLeft: '0.5em',
			paddingRight: '0.5em',
			paddingTop: '0.3em',
			paddingBottom: '0.3em',
			backgroundColor: 'rgba(255,255,255,1)'
		},{
			duration: 200,
			complete: $.proxy(function(){
				var text = this.element.find('div.body div.text-wrap').css({
					width: '100%',
					backgroundColor: '',
					paddingLeft: '',
					paddingRight: '',
					paddingTop: '',
					paddingBottom: ''
				});
				text.html('<div class="button">cancel</div><div class="input-wrap"><textarea>' + $.trim(text.text()) + '</textarea></div>');
				var grrr = new drdelambre.default.Textarea(text.find('.input-wrap'),{ defaultText: '', enter: this.staticMode });
				grrr.text.focus();
				grrr.update();
			},this)
		});
	},
	staticMode : function(evt){
		if(evt && $(evt.target).closest(this.element.find('.input-wrap')).length) return;
		$(window).unbind('mousedown', this.staticMode);

		drdelambre.publish('/todo/save/', this.element);

		var data = {
			type: 'todo',
			request: 'edit',
			id: this.element.find('input:first').val(),
			list: this.element.closest('.list').find('input:first').val(),
			text: this.element.find('.body .text-wrap textarea')[0].value
		};

		var retFunc = function(json){
			var text = this.element.find('.body .text-wrap');
			text.html(json.text);
			var wid = text.width('').width();
			text.css({
				width: '90%',
				backgroundColor: 'rgba(255,255,255,1)',
				paddingLeft: '0.5em',
				paddingRight: '0.5em',
				paddingTop: '0.3em',
				paddingBottom: '0.3em'
			}).animate({
				width: wid,
				backgroundColor: 'rgba(255,255,255,0.2)',
				paddingLeft: '',
				paddingRight: '',
				paddingTop: '',
				paddingBottom: ''
			},{ duration: 200, complete: $.proxy(function(){
				text.css({
					width: '',
					backgroundColor: '',
					paddingLeft: '',
					paddingRight: '',
					paddingTop: '',
					paddingBottom: '',
					display: ''
				});
			},this)});
			this.element.find('div.body div.comment').fadeIn(200);
			this.element.find('div.buttons:first').animate({ opacity: 1 },{ duration: 400 });
			this.mouse = new drdelambre.default.ComplexMouse({
				element: this.element.find('div.body'),
				
				dblclick : this.editMode,
				click : this.toggle
			});
		};

		$.ajax({ data: JSON.stringify(data), context: this, success: retFunc });
	},
	
	saveComment : function(evt){
		var data = {
			type: 'todo',
			request: 'addComment',
			todo: this.element.find('input:first').val()
		};
		
		var text = this.element.find('.comment-list .new-comment .input-wrap:not(.hours .input-wrap)');
		if(!text.is('.unchanged')) data.text = text.find('textarea').val();
		var hours = this.element.find('.hours .input-wrap');
		if(!hours.is('.unchanged')) data.hours = hours.find('input').val();
		if((!data.hours || parseFloat(data.hours) <= 0) && !data.text) return;

		var files = this.element.find('.new-comment .input-wrap .file');
		if(files.length){
			data.files = [];
			for(var ni = 0; ni < files.length; ni++)
				data.files.push([files.eq(ni).find('input').val(),files.eq(ni).find('span.name').text()]);
		}
		files.remove();

		hours.find('input')[0].inst.reset();
		hours.find('input').blur();
		this.element.find('.comment-list .new-comment textarea')[0].inst.reset();
		this.element.find('.comment-list .new-comment textarea').focus();
		
		var retFunc = $.proxy(function(json){
			if(json.status!='success') return;
			var comment = this._createComment(json).addClass('last'),
				wrap = this.element.find('.comment-list .comments');
			wrap.find('.comment.last').removeClass('last');
			if(!wrap.find('.comment').length){
				wrap.append(comment);
				wrap.slideDown(300, function(){
					$(this).height('');
				});
			} else {
				wrap.append(comment);
				if(wrap.find('.comment').length > 5)
					wrap.animate({ scrollTop: wrap[0].scrollHeight - wrap[0].clientHeight },{ duration: 300 });
				else {
					wrap.height(wrap.height('').height());
					comment.css({ display: 'none' }).slideDown(300);
				}
			}
			
			var bubble = this.element.find('div.body .comment');
			if(!bubble.is('.avail')) bubble.addClass('avail');
			bubble.find('span').html((bubble.find('span').html()&~0)+1);
		},this);
		
		$.ajax({ data: JSON.stringify(data), context: this, success: retFunc });
	},
	_createComment : function(json){
		var div = '\
			<div class="comment' + (json.hours?' timed':'') + '">\
				<input type="hidden" value="' + json.id + '">\
				<div class="creator">\
					' + json.creator + '<span class="time"><input type="hidden" value="' + json.created + '">' + drdelambre.relativeTime(json.created) + '</span>\
				</div>';
		if(json.hours) div += '<div class="hours"><span>' + json.hours + '</span>hrs</div>';
		div += json.text;
		if(json.files && json.files.length){
			div += '<div class="files">';
			for(var ni = 0; ni < json.files.length;ni++)
				div += '<a href="' + URL_BASE + '/download/' + json.files[ni][0] + '">' + json.files[ni][1] + '</a>';
			div += '</div>';
		}
		div += '</div>';
		return $(div);
	},
	activateHours : function(evt){
		var cont = this.element.find('.comment-list .new-comment .hours');
		if(!cont.find('.input-wrap.unchanged').length)
			cont.addClass('activate');
		else
			cont.removeClass('activate');
	},
	
	markDone : function(evt){
		drdelambre.publish('/todo/done', this.element);
	},
	unmarkDone : function(evt){
		drdelambre.publish('/todo/undone', this.element);
	},
	remove : function(evt){
		drdelambre.publish('/todo/remove', this.element);
	},
	
	start : function(evt){
		drdelambre.publish('/todo/sort/start', this.element);
		if(this.element.find('.comment-list').css('display') != 'none')
			this.toggle();
		this.spacer = $("<div class='entry spacer'></div>");
		this.spacer.css({
			height: this.element.find('.body').height(),
			width: this.element.width()
		});
		this.element.before(this.spacer);
		$('#content').append(this.element);

		this.element.css({
			position: 'absolute',
			'z-index': 5,
			top: this.spacer.position().top - this.spacer.height()*0.05,
			left: this.spacer.position().left,
			width: this.spacer.width()
		}).animate({
			'font-size': '0.9em',
			width: this.spacer.width() * 1.1,
			left: this.spacer.position().left - 7,
		},{ duration: 200 });
		this.startY = evt.pageY - this.spacer.position().top + this.spacer.height()*0.05;
	},
	move : function(evt){
		this.element.css({
			top: evt.pageY - this.startY
		});
		
		var next = this.spacer.next('.entry'), prev = this.spacer.prev('.entry');
		
		var pos = this.spacer.offset(),
			height = this.spacer.height();
		if(this.spacer.closest('.active').css('display') == 'none'){
			pos = this.spacer.closest('.list').offset();
			height = this.spacer.closest('.list').height();
		}

		if(evt.pageY > pos.top + height){
			if(next.length) return next.after(this.spacer);
			var list = this.spacer.closest('.list').next('.list');
			if(!list.length || evt.pageY < list.offset().top + list.find('.info').height()) return;
			var oldList = this.spacer.closest('.list').addClass('blur');
			oldList.find('.remaining span').html(oldList.find('.active .entry').length - 1);
			if(!list.find('.active .entry').length) list.removeClass('blur');
			else list[0].inst.open(true);
			list.find('.remaining span').html(list.find('.active .entry').length + 1);
			list.find('.active').prepend(this.spacer);
		} else if(evt.pageY < pos.top){
			if(prev.length) return prev.before(this.spacer);
			var list = this.spacer.closest('.list').prev('.list');
			if(!list.length) return;
			var oldList = this.spacer.closest('.list').addClass('blur');
			oldList.find('.remaining span').html(oldList.find('.active .entry').length - 1);
			oldList[0].inst.close();
			if(!list.find('.active .entry').length) list.removeClass('blur');
			else list[0].inst.open(true);
			list.find('.remaining span').html(list.find('.active .entry').length + 1);
			list.find('.active').append(this.spacer);
		}
	},
	end : function(evt){
		this.spacer.before(this.element);
		this.element.animate({
			'font-size': '0.8em',
			width: this.spacer.width(),
			height: this.spacer.height(),
			top: this.spacer.position().top,
			left: this.spacer.position().left
		},{ duration: 150, easing: 'linear', complete: $.proxy(function(){
			this.spacer.closest('.list').prevAll('.list.selected').each(function(){
				this.inst.close();
			});
			this.spacer.remove();
			drdelambre.publish('/todo/sort/end', this.element);
			delete this.spacer, this.startY;
			var act = this.element.closest('.list').find('.active');
			if(act.css('display') == 'none') act.slideDown(400);
			this.element.css({
				'font-size': '',
				width: '',
				height: '',
				position: ''
			})
		},this)})
	},

	comScroll : function(evt){
		var wheel = { x: 0, y: 0 },
			e = evt.originalEvent,
			speed = 0.1,
			elem = this.element.find('.comments');
	
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
		
		if(elem.scrollTop() - wheel.y > 0 && elem.scrollTop() - wheel.y < elem[0].scrollHeight - elem[0].clientHeight){
			evt.stopPropagation();
			evt.preventDefault();
		}
	
		elem.scrollTop(elem.scrollTop() - wheel.y);
		elem.scrollLeft(elem.scrollLeft() - wheel.x);
		
		if(this.canFetch && elem.scrollTop() < elem.height()){
			this.canFetch = false;
			var data = {
				type: 'todo',
				request: 'fetch',
				start: elem.find('.comment').length,
				id: this.element.find('input:first').val()
			};
	
			$.ajax({ data: JSON.stringify(data), context: this, success: this.comFetch });
		}
	},
	comFetch : function(json){
		if(json.status != 'success' || !json.entries.length) return;
		var list = this.element.find('.comments');
		var h = list[0].scrollHeight;
		for(var ni = json.entries.length; ni!=0;)
			list.prepend(this._createComment(json.entries[--ni]));
		list.scrollTop(list.scrollTop() + list[0].scrollHeight - h);
		
		if(json.entries.length) this.canFetch = true;
	},
	
	toggleClaim : function(evt){
		var claim = this.element.find('.claim'),
			toClaim = true;
		if(claim.is('.claimed')) return;
		if(claim.is('.selected')){
			claim.removeClass('selected');
			claim.html('claim');
			toClaim = false;
		} else {
			claim.addClass('selected');
			claim.html('unclaim');
		}
		
		var data = {
			type: 'todo',
			request: 'claim',
			id: this.element.find('input').val(),
			claim: toClaim
		};
		
		$.ajax({ data: JSON.stringify(data) });
	}
});
/*
drdelambre.tasks.WindowNav = new drdelambre.class({
	element: null,
	count: 4,
	nextOne: null,
	prevOne: null,

	init : function(elem, count){
		this.element = $(elem);
		this.count = count;
		
		this.nextOne = this.element.find('div.nav div.button.next');
		this.prevOne = this.element.find('div.nav div.button.prev');
		
		this.nextOne.bind('mousedown', this.next);
		this.prevOne.bind('mousedown', this.prev);
		this.clean();
	},
	prev : function(){
		var ents = this.element.find('.prev-holder .entry');
		var len = ents.length > this.count?this.count:ents.length;
		var cont = $('<div class="window"></div>');
		var old = this.element.find('.window');
		for(var ni = ents.length - len; ni < ents.length; ni++)
			cont.append(ents.eq(ni));

		var spacer = $('<div class="window"></div>');
		spacer.css({
			width: old.width(),
			height: old.height()
		});

		cont.css({
			width: old.width(),
//			height: old.height(),
			position: 'absolute',
			top: 0,
			left: 0 - old.outerWidth(true)
		});
		
		old.before(cont);
		old.before(spacer);
		old.css({
			position: 'absolute',
			width: cont.width(),
//			height: cont.height(),
			top: 0,
			left: 0
		});
		
		cont.animate({ left: 0 },{ duration: 500 });
		spacer.animate({ height: cont.height() },{ duration: 500 });
		old.animate({
			left: old.outerWidth(true),
			opacity: 0
		},{ duration: 500, complete: $.proxy(function(){
			this.element.find('.next-holder').prepend(old.find('.entry'));
			cont.css({
				position: '',
				left: '',
				top: '',
				width: '',
				height: ''
			});
			old.remove();
			spacer.remove();
			this.clean();
		}, this)});
	},
	next : function(){
		var ents = this.element.find('.next-holder .entry');
		var len = ents.length > this.count?this.count:ents.length;
		var cont = $('<div class="window"></div>');
		var old = this.element.find('.window');
		for(var ni = 0; ni < len; ni++)
			cont.append(ents.eq(ni));

		var spacer = $('<div class="window"></div>');
		spacer.css({
			width: old.width(),
			height: old.height()
		});

		cont.css({
			width: old.width(),
//			height: old.height(),
			position: 'absolute',
			top: 0,
			left: 0 + old.outerWidth(true)
		});
		
		old.before(cont);
		old.before(spacer);
		old.css({
			position: 'absolute',
			width: cont.width(),
//			height: cont.height(),
			top: 0,
			left: 0
		});
		
		cont.animate({ left: 0 },{ duration: 500 });
		spacer.animate({ height: cont.height() },{ duration: 500 });
		old.animate({
			left: 0 - old.outerWidth(true),
			opacity: 0
		},{ duration: 500, complete: $.proxy(function(){
			this.element.find('.prev-holder').append(old.find('.entry'));
			cont.css({
				position: '',
				left: '',
				top: '',
				width: '',
				height: ''
			});
			old.remove();
			spacer.remove();
			this.clean();
		}, this)});
	},
	clean : function(){
		var nextCount = this.element.find('.next-holder .entry').length;
		var prevCount = this.element.find('.prev-holder .entry').length;

		this.nextOne.find('span').html(nextCount);
		if(!nextCount) this.nextOne.css({ display: 'none' });
		else if(!prevCount) this.nextOne.css({ display:'', 'border-left': 'none' });
		else this.nextOne.css({ display: '', 'border-left': '' });
	
		this.prevOne.find('span').html(prevCount);
		if(!prevCount) this.prevOne.css({ display: 'none' });
		else this.prevOne.css({ display: '' });
		
		if(!nextCount && !prevCount && !this.element.find('.wrap .window .entry').length)
			this.element.find('.wrap').css({ display: 'none' });
		else
			this.element.find('.wrap').css({ display: '' });
	},
	add : function(obj){
		var cont = this.element.find('.window');
		if(this.element.find('.next-holder .entry').length){
			cont.animate({ opacity: 0 },{ duration: 300, complete: $.proxy(function(){
				this.element.find('.prev-holder').append(this.element.find('.window .entry, .next-holder .entry'));
				var ents = this.element.find('.entry');
				var len = ents.length > this.count - 1? this.count - 1: ents.length;
				for(var ni = ents.length - len; ni < ents.length; ni++)
					cont.append(ents.eq(ni));
				cont.append(obj);
				cont.animate({ opacity: 1 }, { duration: 300 });
				this.clean();
			}, this)});
		} else {
			if(this.element.find('.window .entry').length == this.count){
				var pre = this.element.find('.prev-holder');
				var old = cont.find('.entry').eq(0);
				old.slideUp(300, function(){
					pre.append(old);
					old.css({ display: '' });
				});
			}
			cont.append(obj);
			$(obj).css({ display: 'none' }).slideDown(300, this.clean);
		}
	},
	remove : function(obj){
		if(!isNaN(parseFloat(obj))){
			var ent = this.element.find('.entry');
			for(var ni = ent.length; ni!=0;){
				if(ent.eq(--ni).find('input:first').val() == obj){
					obj = ent.eq(ni);
					break;
				}
			}
		} else obj = $(obj);
		
		if(this.element.find('.next-holder .entry').length){
			if(!obj.closest('.window').length){
				this.element.find('.window .entry').eq(0).slideUp(300, function(){
					$(this).closest('.window-nav').find('.prev-holder').append(this);
				});
				obj.remove();
			} else obj.slideUp(300, function(){ $(this).remove(); });
			var next = this.element.find('.next-holder .entry').eq(0).css({ display: 'none' });
			this.element.find('.window').append(next);
			next.slideDown(300);
		} else {
			obj.slideUp(300, function(){ $(this).remove(); });
			var prev = this.element.find('.prev-holder .entry:last').css({ display: 'none' });
			this.element.find('.window').prepend(prev);
			prev.slideDown(300);
		}
		
		this.clean();
	}
});
*/