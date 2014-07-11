
	// ----------------
	// Global Variables
	// ----------------

	var UI = {
		'listdata' : {"items":[]},
		'currlist' : false,
		'acccol' : {},
		'defaultaccentcolor' : 'red',
		'passcolor' : '',
		'mobile' : false
	};

	function log(x) {
		// Turn logging on or off
		console.log(x);
	}


	// -----------
	// Main Setup
	// -----------

	$(document).ready(function(){
		// Mobile Sniffing
		UI.mobile = navigator.userAgent.search("ZuneWP7") > 0;


		// Accent Color
		UI.acccol = new mColor(accentcolors[UI.defaultaccentcolor]).setLightness(30);
		UI.passcolor = document.location.href.split('?color=')[1];
		if(UI.passcolor){
			UI.passcolor = UI.passcolor.split('?')[0];
			log("PASSCOLOR = " + UI.passcolor + " accentcolors[UI.passcolor] = " + JSON.stringify(accentcolors[UI.passcolor]));
			if(accentcolors[UI.passcolor]){
				UI.acccol = new mColor(accentcolors[UI.passcolor]).setLightness(30);
			}
		}

		$('body').css('background-color', UI.acccol.getString());


		// Page Content
		homePageHTML = gen_HomePageHTML();

		var bk = document.location.href.split('?list=')[1];

		if(listlist.indexOf(bk) > -1){
			UI.currlist = bk.split('?color=')[0];
			$('body').html('<div id="wrapper"></div>');
			setup_ListPage(UI.currlist, true);
		} else {
			setup_HomePage();
		}

	});

	function setup_HomePage(){
		UI.currlist = 'listo_home';
		updateURL();

		$('body').html(homePageHTML);
		$('#wrapper')
			.css({left: '-=100%', opacity: 0})
			.animate({left: 0, opacity: 1},{queue: false, duration: 'fast'});
		$('h1').css({color: UI.acccol.lighten(0.2).getString()});

		if(UI.mobile){
			log("WP7 = true");
			$('#wrapper').css('overflow-y' , 'scroll');
		}
	}

	function setup_ListPage(list){
		log("setup_ListPage: " + list);
		UI.currlist = list;
		list_Sync();
		updateURL();

		// this wrapper is the from the landing page - used to be  left: '-=100%'
		var wrap = $('#wrapper');
		var wrapchil = wrap.children();

		if(wrapchil.length > 0){
			wrapchil.each(function (i, item) {
				var ti = $(item);

				// Add animations on each item to the fx queue on the navigation DOM element
				$.queue(wrap[0], 'fx', function () {
					var that = this;
					var ani = {opacity:0, width:0};
					var ct = ti.html().replace(' ', '_').replace('&nbsp;', '_');
					log('comparing ' + UI.currlist + ' == ' + ct);
					if(UI.currlist == ct) { ani = {}; }

					ti.animate(ani, {
						complete: function(){ $.dequeue(that); },
						duration: 100,
					});
				});
			});

			$.queue(wrap[0], 'fx', function(){
				$('#wrapper').fadeOut(function(){
					log('Calling gen_ListPageHTML from the fx queue');
					gen_ListPageHTML();
					});
			});

			wrap.dequeue();
			wrap.dequeue();
		} else {
			gen_ListPageHTML();
		}
	}

	// ---------------
	// HTML Generators
	// ---------------

	function gen_HomePageHTML(){
		var re = '<div id="wrapper">';
		var incl = (((100 - UI.acccol.getLightness())*0.4) / (listlist.length + 1));

		$(listlist).each(function(l){
			var bg = UI.acccol.setLightness(((listlist.length + 1) - l) *incl + UI.acccol.getLightness());
			var bgcolor = bg.getString();
			var txcolor = bg.lighten(0.8).getString();

			re += '<div class="listname" ';
			re += 'style="background-color:'+bgcolor+'; color:'+txcolor+';" ';
			re += 'onclick="setup_ListPage(\''+listlist[l]+'\');">';
			re += listlist[l].replace('_', '&nbsp;');
			re += '</div>';
		});

		re  += '<h1>LISTO!</h1></div>';

		return re;
	}

	function gen_ListPageHTML(){
		log("gen_ListPageHTML");

		var con = "<div id='wrapper'>";
		con += " <input type='text' id='itemNew'>";
		con += " <div id='itemGrid'></div>";
		con += " <div id='footer'>";
		con += "  <div id='homeButton'>&lsaquo; home &nbsp;</div>";
		con += "  <div id='listStatus'></div>";
		con += " </div>";
		con += "</div>";
		$('body').html(con);

		var lcon = $('#wrapper');
		lcon.css({'left': '100%', opacity: 0});
		lcon.animate({'left': 0, opacity: 1},{duration: 'fast'});

		$('#itemNew').on('keypress', function(event) {
			if ( event.which == 13 ) {
				var ni = $('#itemNew');
				if(ni.val() === '') { list_Sync(); }
				else { list_AddNewItem(ni.val()); }
			}
		}).css({
			color: UI.acccol.getString(),
			backgroundColor : "rgb(250,250,250)"
		});

		$('#homeButton').on('click', function(event) {
			setup_HomePage();
		}).css({
			color: UI.acccol.lighten(0.4).getString(),
			backgroundColor : UI.acccol.lighten(0.1).getString()
		});

		$('#listStatus').css('color', UI.acccol.lighten(0.3).getString());

		if(UI.mobile) $('#wrapper').css('overflow-y' , 'scroll');

		list_Refresh();
	}

	function gen_ItemHTML(num, bgc, hideclose) {
		var txtitem = bgc.lighten(0.8).getString();
		var bgitem = bgc.getString();
		var bgclose = bgc.lighten(0.1).getString();
		var re = '<div id="item'+num+'" class="item" style="background-color:'+bgitem+';">';
		re += '<span style="color:'+txtitem+';">' + UI.listdata.items[num] + '</span>';
		if(!hideclose){
			re += '<span class="removeButton" onclick="list_RemoveItem('+num+');" style="color:'+bgclose+';">&#10006;</span>';
		}
		re += '</div>';

		return re;
	}


	// ----------------
	// List Functions
	// ----------------

	function list_Refresh(){
		log("list_Refresh");

		// List Status
		var stat =	'<b>' + UI.currlist.replace('_', ' ') + '</b><br>';
		stat +=		'last remove: ' + timeToEnglish(UI.listdata.lastremove);
		stat +=		'<br>';
		stat +=		'last add: ' + timeToEnglish(UI.listdata.lastadd);
		//stat +=	'User Agent: ' + navigator.userAgent;

		$('#listStatus').html(stat);

		// List Items
		var con = '';
		var incl = (((100 - UI.acccol.getLightness())*0.4) / (UI.listdata.items.length + 1));

		if(UI.listdata.items.length){
			$(UI.listdata.items).each(function(i) {
				con = (gen_ItemHTML(i, UI.acccol.setLightness(((i+1)*incl + UI.acccol.getLightness()))) + con);
			});
		} else {
			con += '<div class="item" style="color:'+UI.acccol.lighten(0.3).getString()+';">';
			con += '<i>it\'s empty in here...</i></div>';
		}

		$('#itemGrid').html(con);
	}

	function list_AddNewItem(item){
		item = inputSan($.trim(item), true);

		log("ADDNEWITEM - " + item);

		if(typeof UI.listdata.items == 'undefined') { UI.listdata.items = []; }

		if(item !== ''){
			UI.listdata.items.push(item);
			$('#itemGrid').prepend(gen_ItemHTML(UI.listdata.items.length-1, UI.acccol, true));
			$('#itemGrid .item:first span').css({color:'white'});
			$('#itemGrid .item:first').css({backgroundColor: UI.acccol.lighten(0.7).getString()}).toggle().slideDown('fast');
			list_Sync({"itemadd": item});
		}
	}

	function list_RemoveItem(i){
		var item = $(('#item'+i));

		item.slideUp('fast', function(){
			list_Sync({'itemremove': $.trim(inputSan(item.children('*:first').html(), false))});
		});
	}

	function list_Sync(passeddata){
		log("list_Sync: passed " + JSON.stringify(passeddata));

		if (typeof passeddata !== 'object') {
			passeddata = {"":""};
		}

		passeddata.list = UI.currlist;
		$('#itemNew').val('').fadeTo('fast', 0.8);


		//	=======================
		//	SAVE DATA
		//	=======================
		var returndata = UI.listdata;
		if(passeddata.itemadd){
			returndata.items.push(passeddata.itemadd);
			returndata.lastadd = new Date().toString();
		}

		if(passeddata.itemremove){
			var ai = returndata.items.indexOf(passeddata.itemremove);
			if(ai > -1){
				returndata.items.splice(ai, 1);
				returndata.lastremove = new Date().toString();
			}
		}

		//	=======================
		//	RETRIEVE DATA
		//	=======================

		if(returndata === ''){
			UI.listdata = {"items":[]};
		} else {
			UI.listdata = returndata;
		}

		list_Refresh();
		$('#itemNew').fadeTo('fast', 1.0);
	}


	// ----------------
	// Helper Functions
	// ----------------


	function updateURL(){
		// Color
		var colu = '';
		if(UI.passcolor && UI.defaultaccentcolor != UI.passcolor){
			colu = '?color=' + UI.passcolor;
		}

		var ps = (typeof window.history.pushState == 'function');

		// List
		if(UI.currlist != 'listo_home'){
			var nw = UI.currlist.replace(' ', '');
			if(ps) window.history.pushState('', 'LISTO! ' + UI.currlist, (colu+'?list='+nw));
			document.title = UI.currlist.replace('_', ' ') + ' LISTO!';
		} else {
			if(ps) window.history.pushState('', 'LISTO! home', colu+'?list=listo_home');
			document.title = 'LISTO!';
		}
	}

	function timeToEnglish(t){
		if(typeof t == 'undefined') { return 'never'; }

		var diff = new Date().getTime() - (t*1);
		var minute = 1000 * 60;
		var hour = minute * 60;
		var day = hour * 24;

		log("TTE: " + t + " \t diff: " + diff);

		if (diff < minute) {
			return 'moments ago';
		}
		else if (diff < hour) {
			var m = Math.round(diff/minute);
			if(m == 1){ return '1 minute ago'; }
			else { return m + ' minutes ago'; }
		}
		else if (diff < day) {
			var h = Math.round(diff/hour);
			if(h == 1) { return '1 hour ago'; }
			else { return h + ' hours ago'; }
		}
		else {
			var d = Math.round(diff/day);
			if(d == 1) { return 'yesterday'; }
			else { return d + ' days ago'; }
		}

		return 'a zillion years ago';
	}

	function inputSan(t, removeamp){
		if(removeamp) t = t.replace("&", '&amp;');
		t = t.replace("(",	'&#40;');
		t = t.replace(")",	'&#41;');
		t = t.replace("[",	'&#91;');
		t = t.replace("]",	'&#93;');
		t = t.replace("\\",	'&#47;');
		t = t.replace(">",  '&gt;');
		t = t.replace("<",  '&lt;');
		t = t.replace('"',  '&quot;');
		t = t.replace('“',  '&quot;');
		t = t.replace('”',  '&quot;');
		t = t.replace("'",  '&apos;');
		t = t.replace("‘",  '&apos;');
		t = t.replace("’",  '&apos;');
		return t;
	}