drdelambre.footer = {
	init: function(){
		new drdelambre.footer.BugMenu('#footer .button:first', '#bug-reporter');
		new drdelambre.footer.Timer('#actions .timer');
		var buts = $('#actions .button').addClass('inactive');
		buts.each(function(){
			if($(this).find('input').val() == window.location.hash)
				$(this).removeClass('inactive');
		});
		buts.bind('mousedown', function(evt){
			var elem = $(evt.target).closest('.button');
			$('#actions .button').addClass('inactive');
			elem.removeClass('inactive');
			drdelambre.loadState(elem.find('input').val());
		});
		if($(window).width() > 640){
			$('#content').height($(window).height() - $('#name').height() - 2*parseInt($('#content').css('padding-top')));
			new drdelambre.default.InvisibleSlider('#content');
		} else {
			$('#inner-wrap').height($(window).height() - $('#name').height());
			new drdelambre.default.InvisibleSlider('#inner-wrap');
		}
		$(window).resize(function(){
			if($(window).width() > 640)
				$('#content').height($(window).height() - $('#name').height() - 2*parseInt($('#content').css('padding-top'))).trigger('resizer');
			else
				$('#inner-wrap').height($(window).height() - $('#name').height());
		});
	}
};
/****************************************************************************\

	function: BugMenu
		An inline bug submition form

	params:
		button: the initial toggle button
		element: the menu object

	notes:

\***************************************************************************/
drdelambre.footer.BugMenu = new drdelambre.class({
	button: null,
	element: null,

	init : function(button, element){
		this.button = $(button);
		this.element = $(element);
	
		this.button.bind('mousedown', this.open);
		this.element.bind('mousedown', this.startDrag);
		
		new drdelambre.default.Textarea(this.element.find('.input-wrap'));
	},	
	open : function(evt){
		var speed = 500;
		
		var save = $("<div class='button notice'>save</div>").bind('mousedown', this.save);
		var cancel = $("<div class='button'>cancel</div>").bind('mousedown', this.close);

		this.button.after(save).after(cancel);
		save.css({ opacity: 0 }).animate({ opacity: 1 },{ duration: speed });
		cancel.css({ opacity: 0 }).animate({ opacity: 1 },{ duration: speed });

		this.button.css({ overflow: 'hidden', 'white-space': 'nowrap' }).animate({ width: 0, marginLeft: 0, marginRight: 0 }, { duration: speed, complete: function(){
			$(this).css({ width: '', display: 'none', overflow: '', 'white-space':'', marginLeft: '', marginRight: '' });
		}});
		
		this.element.css({ left: $(window).width() - this.element.outerWidth(true) }).slideDown(speed);
		this.overlay = $('<div></div>').css({
				width: $(window).width(),
				height: $(window).height(),
				position: 'absolute',
				top: 0,
				left: 0,
				zIndex: 3,
				cursor: 'crosshair',
				'-moz-user-select': 'none',
				'-khtml-user-select': 'none',
				'user-select': 'none'
			});
		new drdelambre.default.ComplexMouse({
			element: this.overlay,
			
			start: this.startDraw,
			move: this.onDraw,
			end: this.killDraw
		});
		$(document.body).append(this.overlay);
		$(window).bind('resize', this.resize);
	},
	close : function(evt){
		var speed = 400;

		$(window).unbind('resize', this.resize);
		var buts = this.button.nextAll('.button');
		buts.eq(0).animate({ opacity: 0 },{ duration: speed, complete:function(){ $(this).remove(); }});
		buts.eq(1).animate({ opacity: 0 },{ duration: speed, complete:function(){ $(this).remove(); }});

		this.button.css({ overflow: 'hidden', 'white-space': 'nowrap', display:'' });
		var w = this.button.width();
		this.button.css({ width: 0 }).animate({ width: w }, { duration: speed, complete: function(){
			$(this).css({ opacity: '', width: '', overflow: '', 'white-space':'' });
		}});

		this.element.slideUp(speed);
		this.overlay.fadeOut(speed * 1.5, function(){ $(this).remove(); });
	},
	save : function(evt){
		//send that crap to the database!
		this.close();
	},
	resize : function(evt){
		if(!this.overlay) return;
		this.overlay.css({
			width: $(window).width(),
			height: $(window).height()
		});
	},
	
	startDrag : function(evt){
		if($(evt.target).closest('.input-wrap').length) return;
		this.diff = evt.pageX - this.element.offset().left;
		$(document.body).css({
			'-moz-user-select': 'none',
			'-khtml-user-select': 'none',
			'user-select': 'none'
		});
		$(window).bind('mousemove', this.onDrag).bind('mouseup', this.killDrag);
	},
	onDrag : function(evt){
		var nX = evt.pageX - this.diff;
		if(nX < 0) nX = 0;
		else if(nX + this.element.outerWidth(true) > $(window).width()) nX = $(window).width() - this.element.outerWidth(true);
		
		this.element.css({ left: nX });
	},
	killDrag : function(evt){
		$(document.body).css({
			'-moz-user-select': '',
			'-khtml-user-select': '',
			'user-select': ''
		});
		$(window).unbind('mousemove', this.onDrag).unbind('mouseup', this.killDrag);
	},
	
	startDraw : function(evt){
		if($(evt.target).closest('div.note').length) return false;
		this.start = {
			top: evt.pageY - 5,
			left: evt.pageX - 5
		};

		this.note = new drdelambre.footer.Note();
		this.note.create();
		this.note.element.css(this.start).width(0).find('div.overlay').css({ 'border-radius': '1em' });

		this.overlay.append(this.note.element);
	},
	onDraw : function(evt){
		var nPos = {
			top: this.start.top,
			height: evt.pageY - this.start.top,
			left: this.start.left,
			width: evt.pageX - this.start.left
		};
		
		if(nPos.width < 0){
			nPos.width *= -1;
			nPos.left -= nPos.width;
		}
		
		if(nPos.height < 0){
			nPos.height *= -1;
			nPos.top -= nPos.height;
		}
		
		this.note.element.css({
			top: nPos.top,
			left: nPos.left,
			width: nPos.width
		}).find('div.overlay').css({
			height: nPos.height
		});
	},
	killDraw : function(evt){
		if(this.note) this.note.activate();
		delete this.note;
	}
});

/****************************************************************************\

	function: Note
		A window for framing arbitrary selection on a 2d plane 

	params:

	notes:

\***************************************************************************/
drdelambre.footer.Note = new drdelambre.class({
	element : null,
	create : function(isActive){
		this.element = $('\
			<div class="note">\
				<div class="overlay"><img style="display:none;" src="' + URL_BASE + '/images/resize_handle.png"/></div>\
				<div class="notes" style="display:none;">\
					<div class="input-wrap"><textarea></textarea></div>\
				</div>\
				<div class="close" style="display:none;">X</div>\
			</div>');
		this.element.find('div.close').bind('mousedown', this.close);
		this.element.find('div.overlay').bind('mousedown', this.startMove);
		if(isActive) this.activate();
		return this.element;
	},
	
	close : function(evt){ this.element.fadeOut(300, function(){ $(this).remove(); }); },

	activate : function(evt){
		this.element.find('div.overlay').animate({ 'border-bottom-left-radius': '0', 'border-bottom-right-radius': '0' },{ duration: 300 });
		this.element.find('div.overlay img').delay(300).fadeIn(300);
		this.element.find('div.close').fadeIn(300);
		this.element.animate({ 'border-bottom-left-radius': '0', 'border-bottom-right-radius': '0' },{ duration: 300, complete: function(){
			var elem = $(this);
			setTimeout(function(){
				elem.css({ 'border-radius':'1em' });
			},100);
		}});
		new drdelambre.default.Textarea(this.element.find('div.notes .input-wrap'),{
			defaultText: 'notes...'
		});
		this.element.find('div.notes').delay(300).slideDown(300);
	},

	deactivate : function(evt){
		this.element.find('div.notes').slideUp(300);
		this.element.find('div.overlay').delay(300).animate({ 'border-bottom-left-radius': '1em', 'border-bottom-right-radius': '1em' },{ duration: 300 });
		this.element.find('div.close').fadeOut(300);
/*		this.element.animate({ 'border-bottom-left-radius': '1em', 'border-bottom-right-radius': '0' },{ duration: 300, complete: function(){
			var elem = $(this);
			setTimeout(function(){
				elem.css({ 'border-radius':'1em' });
			},100);
		}});
*/	},

	startMove : function(evt){
		if($(evt.target).closest('div.overlay img').length){
			this.startResize(evt);
			return;
		}
		
		evt.preventDefault();
		this.element.parent().append(this.element);

		var pos = this.element.position();
		this.diff = {
			top: evt.pageY - pos.top,
			left: evt.pageX - pos.left
		};
		$(window).bind('mousemove', this.onMove).bind('mouseup', this.killMove);
		return false;
	},

	onMove : function(evt){
		var nPos = {
			top: evt.pageY - this.diff.top,
			left: evt.pageX - this.diff.left
		};
		
		if(nPos.top < 0) nPos.top = 0;
		else if(nPos.top > $(window).height() - this.element.height()) nPos.top = $(window).height() - this.element.height();
		if(nPos.left < 0) nPos.left = 0;
		else if(nPos.left > $(window).width() - this.element.width()) nPos.left = $(window).width() - this.element.width();

		this.element.css(nPos);
	},

	killMove : function(evt){
		delete this.diff;
		$(window).unbind('mousemove', this.onMove).unbind('mouseup', this.killMove);
	},

	startResize : function(evt){
		evt.preventDefault();
		this.element.draggable = false;
		var pos = this.element.position();
		this.diff = {
			top: this.element.find('div.overlay').height() - evt.pageY,
			left: this.element.width() - evt.pageX
		};
		var handle = this.element.find('div.overlay img');
		this.minDim = {
			width: handle.outerWidth(true) + 10,
			height: handle.outerHeight(true) + 10
		};
		$(window).bind('mousemove', this.onResize).bind('mouseup', this.killResize);
		return false;
	},

	onResize : function(evt){
		var nDim = {
			width: evt.pageX + this.diff.left,
			height: evt.pageY + this.diff.top
		};
		
		if(nDim.width < this.minDim.width) nDim.width = this.minDim.width;
		if(nDim.height < this.minDim.height) nDim.height = this.minDim.height;

		this.element.width(nDim.width).find('div.overlay').height(nDim.height);
	},

	killResize : function(evt){
		delete this.diff, this.minDim;
		$(window).unbind('mousemove', this.onResize).unbind('mouseup', this.killResize);
	}
});

drdelambre.footer.Timer = new drdelambre.class({
	element: null,
	time: 0,
	diff: 0,
	
	timeout:null,
	interval:null,
	
	init : function(elem){
		this.element = $(elem);
		this.element.find('span').bind('mousedown', this.toggle);
		this.element.find('div.reset').bind('mousedown', this.reset);

		var sync = JSON.stringify({ type: 'timer', request: 'getTime' });
		$.ajax({ data: sync, context: this, success: this.setTime });
	},
	toggle : function(){
		var date = new Date();
		if(this.interval == null){
			this.time = date.getTime() - this.diff + this.time;
			this.interval = setInterval(this.displayTime, 360);
			this.element.addClass('active');
			this.timeout = setInterval($.proxy(function(){
				$.ajax({ data: JSON.stringify({ type: 'timer', request: 'getTime' }), context: this, success: this.setTime });
			}, this), 300000);
		} else {
			this.diff = date.getTime();
			this.displayTime();
			clearInterval(this.interval);
			this.interval = null;
			this.element.removeClass('active');
			if(this.timeout){
				clearInterval(this.timeout);
				this.timeout = null;
			}
		}

		this.storeTime();
	},
	reset : function(){
		var date = new Date();
		this.time = this.diff = date.getTime();
		this.displayTime();
		this.storeTime();
	},
	setTime : function(resp){
		if(!resp || resp.status != 'success') return;
		if(resp.time){
			this.time = resp.time * 1000;
			this.diff = resp.diff * 1000;
		} else {
			var date = new Date();
			this.time = this.diff = date.getTime();
		}

		if(resp.start && this.interval == null){
//			this.element.find('div.time').css({ color: '#888' });
			this.element.addClass('active');
			this.interval = setInterval(this.displayTime, 360);
		}
			
		this.displayTime();
	},
	storeTime : function(resp){
		var data = { type: 'timer', request: 'setTime', time: this.time / 1000, diff: this.diff / 1000 };
		if(this.interval != null) data.start = true;

		$.ajax({ data: JSON.stringify(data), context: this });
	},
	displayTime : function(){
		var date = new Date();
		var num = "00.000";
		if(this.interval != null){
			num = (Math.floor((date.getTime() - this.time) / 3600) / 1000).toString();
		} else {
			num = (Math.floor((this.diff - this.time)/3600) / 1000).toString();
		}
		if(num.indexOf('.') == -1) num += '.';
		if(num.indexOf('.') < 3) num = '0' + num;
		while(num.length<6) num += '0';
		this.element.find('span').html(num);
	}
});