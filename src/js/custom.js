$(document).ready(function(){
    $(".shinybox").shinybox();       

    $('.skillbar').each(function(){
		$(this).find('.skillbar-bar').animate({
			width:$(this).attr('data-percent')
		},6000);
	});
});
