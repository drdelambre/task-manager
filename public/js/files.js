drdelambre.files = {
	init: function(){
		$('#content .list').each(function(){
			new drdelambre.files.List(this);
		});
	}
};

drdelambre.files.List = new drdelambre.class({
	element: null,

	init : function(elem){
		this.element = $(elem);
		this.element.find('.header .button').bind('mousedown', this.toggle);
	},
	
	toggle : function(evt){
		var list = this.element.find('.files');
		if(this.element.is('.hidden')){
			this.element.removeClass('hidden').find('.header').find('.button').html('hide');
			list.css({ display: '' }).css({ width: list.width(), display: 'none' }).slideDown(300, function(){ $(this).css({ width: '' }); });
		} else {
			this.element.addClass('hidden').find('.header').find('.button').html('unhide');
			list.width(list.width()).slideUp(300, function(){ $(this).css({ width: '' }); });
		}
	}
});