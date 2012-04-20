drdelambre.people = {
	init : function(){
		new drdelambre.people.Search();
		new drdelambre.people.UserCreator('#add-user');
		$('#content .user').not('#add-user').each(function(){
			new drdelambre.people.User(this);
		});
	}
};

drdelambre.people.Search = drdelambre.class({
	element: null,
	oldText: '',

	init : function(){
		this.element = $('#search .input-wrap input');
		this.element.bind('focus', this.start);
		this.element.bind('input', this.check);
		this.element.bind('blur', this.stop);
	},
	start : function(evt){
		$('#content .user').removeClass('selected').addClass('blur');
		this.oldText = '';
		$('#autocomplete .entry').remove();
		if(this.element.val().length) this.clearCheck();
		this.element.bind('keydown', this.keynav);
	},
	check : function(evt){
		if(this.checkTime) return;
		this.checkTime = setTimeout(this.clearCheck,100);
	},
	clearCheck : function(){
		this.checkTime = null;
		if(this.oldText == this.element.val()) return;
		this.oldText = this.element.val();
		var data = {
			type: 'contact',
			request: 'autocomplete',
			value: this.oldText
		};
		
		var retFunc = $.proxy(function(resp){
			var h = $('#autocomplete').height();
			$('#autocomplete .entry').remove();
			var anchor = $('#autocomplete .last');
			if(!resp.matches){
				anchor.before('<div class="entry empty">nothing found</div>');
				return;
			}
			for(var ni = 0; ni < resp.matches.length; ni++)
				anchor.before('<div class="entry"><input type="hidden" value="' + resp.matches[ni][0] + '">' + resp.matches[ni][1] + '</div>');

			$('#autocomplete .entry').bind('mouseenter', function(){
				$('#autocomplete .entry').removeClass('selected');
				$(this).addClass('selected');
			}).bind('mouseleave', function(){
				$('#autocomplete .entry').removeClass('selected');
			}).bind('mousedown', $.proxy(function(evt){
				var id = $(evt.target).find('input').val(),
					users = $('#content .user');
				this.element.blur();

				users.addClass('blur');
				for(var ni = users.length; ni!=0;){
					if(users.eq(--ni).find('input:first').val() == id) users.eq(ni).removeClass('blur');
				}

				this.element.val('');
				setTimeout($.proxy(function(){ $(window).bind('mousedown', this.clear); }, this),1);
			}, this));

			var more = resp.count - resp.matches.length;
			if(more)
				anchor.css({ display: '' }).html('<span>' + more + '</span> more');
			else
				anchor.css({ display: 'none' });

			if($('#autocomplete').css('display') == 'none'){
				$('#autocomplete').stop().slideDown(300);
				return;
			}
			
			var nH = $('#autocomplete').height();
			$('#autocomplete').css({ height: h }).stop().animate({ height: nH },{ duration: 100, complete: function(){ $(this).css({ paddingTop: '', height: '' }); }});
		},this);
		
		$.ajax({ data: JSON.stringify(data), success: retFunc });
	},
	stop : function(evt){
		console.log('blur');
		this.element.unbind('keydown', this.keynav);
		$('#content .user').removeClass('blur');
		if($('#autocomplete').css('display') != 'none'){
			$('#autocomplete').slideUp(300);
		}
	},
	keynav : function(evt){
		if(evt.which == 38){			// up
			evt.stopPropagation();
			evt.preventDefault();
			var sel = $('#autocomplete .entry.selected');
			var prev = sel.prev('.entry');

			if(!prev.length) sel.removeClass('selected');
			else if(sel.length){
				sel.removeClass('selected');
				prev.addClass('selected');
			}
		} else if(evt.which == 40){		// down
			evt.preventDefault();
			evt.stopPropagation();
			var sel = $('#autocomplete .entry.selected');
			var next = sel.next('.entry');

			if(!sel.length)
				$('#autocomplete .entry').eq(0).addClass('selected');
			else if(next.length){
				sel.removeClass('selected');
				next.addClass('selected');
			}
		} else if(evt.which == 13){
			var sel = $('#autocomplete .entry.selected');
			this.element.blur();
			if(!sel.length){
				var retFunc = $.proxy(function(resp){
					var users = $('#content .user');
					if(!resp.matches) return;
					users.addClass('blur');
					for(var ni = resp.matches.length; ni!=0;){
						var id = resp.matches[--ni][0],
							type = resp.matches[ni][1];
						for(var no = users.length; no != 0;){
							var inps = users.eq(--no).find('input');
							if(	inps.eq(0).val()==id &&
								inps.eq(1).val()==resp.matches)
								users.eq(no).removeClass('blur');
						}
					}
				},this);
				
				var data = {
					type: 'contact',
					request: 'complete',
					value: this.element.val()
				};
				
				$.ajax({ data: JSON.stringify(data), success: retFunc });
			} else {
				var id = sel.find('input').val(),
					users = $('#content .user');
				users.addClass('blur');
				for(var ni = users.length; ni!=0;){
					if(users.eq(--ni).find('input:first').val() == id) users.eq(ni).removeClass('blur');
				}
				sel.removeClass('selected');
			}
			
			this.element.val('');
			$(window).bind('mousedown', this.clear);
		}
	},
	clear : function(evt){
		$(window).unbind('mousedown',this.clear);
		if($(evt.target).closest('.user').length) return;
		$('#content .user').removeClass('blur');
	}
});

drdelambre.people.UserCreator = drdelambre.class({
	element: null,

	init : function(elem){
		this.element = $(elem);
		this.element[0].inst = this;
		this.element.find('.front').bind('mousedown', this.flip);
		new drdelambre.default.Textarea(this.element.find('.back .input-wrap'),{
			defaultText: '',
			enter: this.save
		});
		var buts = this.element.find('.back .button');
		buts.eq(0).bind('mousedown', $.proxy(function(){ this.clear(); },this));
		buts.eq(1).bind('mousedown', this.save);
	},
	flip : function(evt){
		if(this.element.is('.selected')){
			this.element.removeClass('selected');
			this.clear();
			return;
		}
		$(window).bind('mousedown', this.clear);
		$('#content .user.selected').each(function(){
			this.inst.reset();
		});
		$('#content .user').not(this).addClass('blur');
		this.element.removeClass('blur').addClass('selected');
		this.element.find('.back input').focus();
	},
	reset : function(){
		$(window).unbind('mousedown', this.clear);
		this.element.find('.back .input-wrap input')[0].inst.reset();
		this.element.removeClass('selected');
	},
	clear : function(evt){
		if(evt && $(evt.target).closest('.user').length) return;
		$(window).unbind('mousedown', this.clear);
		$('#content .user').removeClass('blur selected');
		this.element.find('.back .input-wrap input')[0].inst.reset();
	},
	save : function(evt){
		var data = {
			type: 'contact',
			request: 'new',
			name: this.element.find('.back .input-wrap input').val()
		};
		
		var retFunc = $.proxy(function(json){
			var div = $('<div class="user floating"><div class="user-wrap"><input type="hidden" value="' + json.id + '"><input type="hidden" value="float"><div class="front">\
					<img class="avatar" src="' + URL_BASE + '/images/avatar/blank.png">\
					<div class="header"><div class="name">' + json.name + '</div></div>\
				</div><div class="back">\
					<img class="contact" src="' + URL_BASE + '/images/contact.png">\
					<div class="header"><div class="name">' + json.name + '</div></div>\
					<div class="contact"></div>\
				</div></div></div>');
			this.element.after(div);
			new drdelambre.people.User(div);
			this.clear();
		},this);
		
		$.ajax({ data: JSON.stringify(data), success: retFunc });
	}
});

drdelambre.people.User = drdelambre.class({
	element: null,
	mouse: null,

	init : function(elem){
		this.element = $(elem);
		this.element[0].inst = this;
		this.mouse = new drdelambre.default.ComplexMouse({
			element: this.element,

			click: this.flip,
			start: this.start,
			move: this.move,
			end: this.end
		});
		var buts = this.element.find('.back .toggle .button');
		buts.eq(0).bind('mousedown', this.showInfo);
		buts.eq(1).bind('mousedown', this.showHistory);
		this.element.find('div.contact').bind('mousewheel DOMMouseScroll', this.iScroll);
		this.element.find('.lists').bind('mousewheel DOMMouseScroll', this.hScroll);
		
		this.element.find('div.contact .add-btn').bind('mousedown', this.openAdd);
		this.element.find('.add-more .input-wrap').each($.proxy(function(ni,oz){
			new drdelambre.default.Textarea(oz,{
				defaultText: ''
			});
		},this));
		this.element.find('.back .list').bind('mousedown', this.selectList);
		buts = this.element.find('.add-more .footer .button');
		buts.eq(0).bind('mousedown', this.closeAdd);
		buts.eq(1).bind('mousedown', this.saveAdd);
	},
	flip : function(evt){
		if(!$(evt.target).closest('.front, .back .header').length) return;
		if(this.element.is('.selected')){
			this.element.removeClass('selected');
			this.clear();
			return;
		}
		$(window).bind('mousedown', this.clear);
		$('#content .user.selected').each(function(){
			this.inst.reset();
		});
		$('#content .user').not(this).addClass('blur');
		this.element.removeClass('blur').addClass('selected');
	},
	reset : function(){
		$(window).bind('mousedown', this.clear);
		this.element.removeClass('selected');
		this.showInfo();
		this.closeAdd();
	},
	clear : function(evt){
		if(evt && $(evt.target).closest('.user').length) return;
		$(window).unbind('mousedown', this.clear);
		$('#content .user').removeClass('blur selected');
		this.showInfo();
		this.closeAdd();
	},

	showHistory : function(evt){
		var buts = this.element.find('.back .toggle .button');
		if(buts.eq(1).is('.selected')) return;
		buts.removeClass('selected').eq(1).addClass('selected');
		this.element.find('div.contact').fadeOut(300, $.proxy(function(){
			this.element.find('.lists').fadeIn(300);
		}, this));
	},
	hScroll : function(evt){
		var wheel = { x: 0, y: 0 },
			e = evt.originalEvent,
			speed = 0.1,
			elem = this.element.find('.lists');
	
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
	},
	showInfo : function(evt){
		var buts = this.element.find('.back .toggle .button');
		if(buts.eq(0).is('.selected')) return;
		buts.removeClass('selected').eq(0).addClass('selected');
		this.element.find('.lists').fadeOut(200, $.proxy(function(){
			this.element.find('div.contact').fadeIn(200);
		}, this));
	},
	iScroll : function(evt){
		var wheel = { x: 0, y: 0 },
			e = evt.originalEvent,
			speed = 0.1,
			elem = this.element.find('div.contact');
	
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
	},

	openAdd : function(evt){
		var con = this.element.find('div.contact');
		con.width(con.width()).slideUp(300, $.proxy(function(){
			con.css({ width: '' });
			var more = this.element.find('.add-more');
			more.css({ display: '' }).css({ width: more.width(), display: 'none' }).slideDown(300, function(){ $(this).css({ width: '' }); });
		}, this));
	},
	closeAdd : function(evt){
		var more = this.element.find('.add-more');
		var con = this.element.find('div.contact');
		if(!this.element.is('.selected')){
			more.css({ display: 'none' });
			if(!this.element.find('.back .toggle').length || this.element.find('.back .toggle .button:first').is('.selected'))
				setTimeout(function(){ con.css({ display: '' }); },200);
			return;
		}
		more.width(more.width()).slideUp(300, function(){
			more.find('.input-wrap input, .input-wrap textarea').each(function(){
				this.inst.reset();
			});
			more.css({ width: '' });
			con.css({ display: '' }).css({ width: con.width(), display: 'none' }).slideDown(300, function(){ con.css({ width: '' }); });
		});
	},
	saveAdd : function(evt){
		var retFunc = $.proxy(function(json){
			this.closeAdd();
		},this);
		
		var data = {
			type: 'contact',
			request: 'editInfo',
			id: this.element.find('input').eq(0).val(),
			user: this.element.find('input').eq(1).val(),
			key: this.element.find('.add-more .input-wrap input').val(),
			value: this.element.find('.add-more .input-wrap textarea').val()
		}
		
		$.ajax({ data: JSON.stringify(data), success: retFunc });
	},

	selectList : function(evt){
		var id = $(evt.target).closest('.list').find('input:first').val(),
			found = [];
		$('#content .user:not(#add-user) .back .list input').each(function(){
			if(this.value != id) return;
			found.push($(this).closest('.user'));
		});
		
		$('#content .user').removeClass('selected').addClass('blur');
		for(var ni = found.length; ni != 0;)
			found[--ni].removeClass('blur');
		this.reset();
	},

	start : function(evt){
		if(this.element.is('.selected')) this.element.removeClass('selected');
		this.spacer = $('<div class="user spacer"></div>');
		this.element.before(this.spacer);
		this.element.css({
			position: 'absolute',
			top: this.spacer.position().top,
			left: this.spacer.position().left,
			zIndex: 4,
			'-webkit-transition': 'none'
		});
		
		this.starter = {
			top: evt.pageY - this.spacer.position().top,
			left: evt.pageX - this.spacer.position().left
		};
	},
	move : function(evt){
		var off = {
			top: evt.pageY - this.starter.top,
			left: evt.pageX - this.starter.left
		};
		this.element.css(off);
		
		var next = this.spacer.parent().find('.user:not(.spacer, #add-user)').not(this.element);
		for(var ni = 0; ni < next.length; ni++){
			off = next.eq(ni).offset();
			if(	evt.pageY > off.top &&
				evt.pageY < off.top + next.eq(ni).outerHeight(true) &&
				evt.pageX > off.left &&
				evt.pageX < off.left + next.eq(ni).outerWidth(true)){
				if(evt.pageX < off.left + next.eq(ni).outerWidth(true)/2)
					next.eq(ni).before(this.spacer);
				else
					next.eq(ni).after(this.spacer);
				break;
			}
		}
	},
	end : function(evt){
		this.element.animate({
			top: this.spacer.position().top,
			left: this.spacer.position().left
		},{ duration: 200, complete: $.proxy(function(){
			this.spacer.after(this.element);
			this.spacer.remove();
			delete this.spacer;
			this.element.css({
				position: '',
				top: '',
				left: '',
				zIndex: '',
				'-webkit-transition': ''
			});
			
			var data = {
				type: 'contact',
				request: 'reorder',
				users: []
			};
			
			var users = $('#content .user:not(#add-user)');
			for(var ni = 0; ni < users.length; ni++){
				var inp = users.eq(ni).find('input');
				data.users.push([inp[0].value,inp[1].value]);
			}
			
			$.ajax({ data: JSON.stringify(data) });
		},this)});
	}
});