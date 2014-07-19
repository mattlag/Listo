	/*
	========================================================
	Two setup variables for you!
	========================================================
	*/

	/*
	--------------------------------------------------------
	Accent Colors
	This should be a RGB color specified as an object.
	To switch the accent color, append '?color=orange'
	to the Listo URL, like:
	www.you.com/listo/?color=orange
	--------------------------------------------------------
	*/
	var accentcolors = {
		'red' :		{'r':130,'g':0,'b':10},
		'orange' :	{'r':200,'g':100,'b':0},
		'green' :	{'r':0,'g':100,'b':10},
		'blue' :	{'r':0,'g':200,'b':255},
		'purple' :	{'r':135,'g':0,'b':119},
		'gray' :	{'r':64,'g':64,'b':64}
	};


	/*
	--------------------------------------------------------
	Lists
	An array of lists you want to keep.
	List names should use underscores_between_words
	--------------------------------------------------------
	*/
	var listlist = ['to_do', 'groceries', 'household', 'online'];





	/*
	========================================================
	Start Product Code
	========================================================
	*/
	var UI = {
		'listdata' : {},
		'currlist' : false,
		'defaultaccentcolorname' : 'blue',
		'accentcolorname' : 'blue',
		'accentmcolor' : {},
		'syncstate' : {'variable':false, 'localstorage':false, 'cloudstorage':false}
	};

	function log(x) {
		// Turn logging on or off
		console.log(x);
	}


	// -----------
	// Main Setup
	// -----------

	$(document).ready(function(){
		log('>>> READY \t START');

		// Set default  data
		var cd = cloudStorage_getData();
		var ls = localStorage_getData();
		log('\tCloud Storage and Local Storage: ' + cd + ' ' + ls);
		if(cd && cd !== {}){ UI = cd; }
		else if (ls && ls !== {}) { UI = ls; }
		else { setupDefaultLists(); }


		// Accent Color
		var urlcolor = document.location.href.split('?color=')[1];
		if(urlcolor){
			urlcolor = urlcolor.split('?')[0];
			log("\tURL Color = " + urlcolor + " accentcolors[urlcolor] = " + JSON.stringify(accentcolors[urlcolor]));
			if(accentcolors[urlcolor]){
				UI.accentcolorname = urlcolor;
				UI.accentmcolor = new mColor(accentcolors[urlcolor]).setLightness(30);
			}
		} else {
			UI.accentcolorname = UI.defaultaccentcolorname;
			UI.accentmcolor = new mColor(accentcolors[UI.accentcolorname]).setLightness(30);
			log('\tDefault Accent Color: ' + UI.accentcolorname);
		}

		$('body').css('background-color', UI.accentmcolor.getString());


		// Page Content
		var bk = document.location.href.split('?list=')[1];

		if(listlist.indexOf(bk) > -1){
			set_SelectedList(bk.split('?color=')[0]);
		} else {
			navTo_HomePage();
		}

		log('>>> READY \t END\n');
	});

	function navTo_HomePage(){
		UI.currlist = false;
		updateURL();

		add_HomePage_HTML();
		$('#wrapper')
			.css({left: '-=100%', opacity: 0})
			.animate({left: 0, opacity: 1},{queue: false, duration: 'fast'});
		$('h1').css({color: UI.accentmcolor.lighten(0.2).getString()});

		// if(UI.mobile){
		//	log("WP7 = true");
		//	$('#wrapper').css('overflow-y' , 'scroll');
		// }
	}

	function navTo_ListPage(){
		log("\nnavTo_ListPage \t START");
		updateURL();

		// this wrapper is the from the landing page - used to be  left: '-=100%'
		var wrap = $('#wrapper');
		var wrapchil = wrap.children();

		log('\twrapchil.length ' + wrapchil.length);

		if(wrapchil.length > 0){
			wrapchil.each(function (i, item) {
				var ti = $(item);

				// Add animations on each item to the fx queue on the navigation DOM element
				$.queue(wrap[0], 'fx', function () {
					var that = this;
					var ani = {opacity:0, width:0};
					var ct = ti.html().replace(' ', '_').replace('&nbsp;', '_');
					// log('comparing ' + UI.currlist + ' == ' + ct);
					if(UI.currlist == ct) { ani = {}; }

					ti.animate(ani, {
						complete: function(){ $.dequeue(that); },
						duration: 100,
					});
				});
			});

			$.queue(wrap[0], 'fx', function(){
				$('#wrapper').fadeOut(function(){
					log('Calling add_ListPageHTML from the fx queue');
					add_ListPage_HTML();
				});
			});

			wrap.dequeue();
			wrap.dequeue();
		} else {
			add_ListPage_HTML();
		}

		log("navTo_ListPage \t END\n");
	}

	// ---------------
	// HTML Generators
	// ---------------

	function add_HomePage_HTML(){
		var con = '<div id="wrapper">';
		var incl = (((100 - UI.accentmcolor.getLightness())*0.4) / (listlist.length + 1));

		$(listlist).each(function(l){
			var bg = UI.accentmcolor.setLightness(((listlist.length + 1) - l) *incl + UI.accentmcolor.getLightness());
			var bgcolor = bg.getString();
			var txcolor = bg.lighten(0.8).getString();
			var lname = listlist[l];

			con += '<div class="listname" ';
			con += 'style="background-color:'+bgcolor+'; color:'+txcolor+';" ';
			con += 'onclick="set_SelectedList(\''+lname+'\');">';
			con += lname.replace('_', '&nbsp;');
			con += '</div>';
		});

		con += make_Footer_HTML();
		con += '</div>';

		$('body').html(con);

		$('#syncStatus').css('color', UI.accentmcolor.lighten(0.3).getString());
	}

	function add_ListPage_HTML(){
		var con = "<div id='wrapper'>";
		con += "<input type='text' id='itemNew'>";
		con += "<div id='itemGrid'></div>";
		con += make_Footer_HTML();
		con += "</div>";

		$('body').html(con);
		list_Refresh();

		var lcon = $('#wrapper');
		lcon.css({'left': '100%', opacity: 0});
		lcon.animate({'left': 0, opacity: 1},{duration: 'fast'});

		$('#itemNew').on('keypress', function(event) {
			if ( event.which == 13 ) {
				var ni = $('#itemNew');
				if(ni.val() === '') { list_PushChange(); }
				else { list_AddNewItem(ni.val()); }
			}
		}).css({
			color: UI.accentmcolor.getString(),
			backgroundColor : "rgb(250,250,250)"
		});

		$('#homeButton').on('click', function(event) {
			navTo_HomePage();
		}).css({
			color: UI.accentmcolor.lighten(0.4).getString(),
			backgroundColor : UI.accentmcolor.lighten(0.1).getString()
		});

		$('#listStatus').add('#syncStatus').css('color', UI.accentmcolor.lighten(0.3).getString());

		// if(UI.mobile) $('#wrapper').css('overflow-y' , 'scroll');
	}

	function make_Item_HTML(num, name, bgc, hideclose) {
		log('make_Item_HTML: name = ' + name);
		var txtitem = bgc.lighten(0.8).getString();
		var bgitem = bgc.getString();
		var bgclose = bgc.lighten(0.1).getString();
		var re = '<div id="item'+num+'" class="item" style="background-color:'+bgitem+';">';
		re += '<span style="color:'+txtitem+';">' + name + '</span>';
		if(!hideclose){
			re += '<span class="removeButton" onclick="list_RemoveItem('+num+');" style="color:'+bgclose+';">&#10006;</span>';
		}
		re += '</div>';

		log('make_Item_HTML\t END');
		return re;
	}

	function make_Footer_HTML() {
		var con = "<div id='footer'>";
		//if(UI.currlist)	con += "<div id='homeButton'>&lsaquo; home &nbsp;</div>";
		if(UI.currlist)	con += "<div id='homeButton'>&#x276E; home &nbsp;</div>";
		else con += '<h1>LISTO!</h1>';
		con += "<div id='listStatus'></div>";
		con += "<div id='syncStatus'>"+make_SyncStatus_HTML()+"</div>";
		con += "<div id='themeStatus'>"+make_ThemeChooser_HTML()+"</div>";
		con += "</div>";

		return con;
	}

	function make_ThemeChooser_HTML() {
		var re = '';
		re += make_ThemeChooser_Button(UI.accentcolorname);
		re += '<div id="themechoices">';

		for(var c in accentcolors){
			if(accentcolors.hasOwnProperty(c)){
				if(c !== UI.accentcolorname){
					re += make_ThemeChooser_Button(c);
				}
			}
		}

		re += '</div>';
		return re;		
	}

	function make_ThemeChooser_Button(name) {
		var mc = new mColor(accentcolors[name]).setLightness(30);
		var bgcolor = mc.lighten(0.05).getString();
		var txtcolor = mc.lighten(0.3).getString();
		var re = '<button class="themechooserbutton" ';
		re += 'style="background-color:'+bgcolor+'; color:'+txtcolor+';" ';
		re += 'onclick="selectTheme(\''+name+'\');" ';
		re += '>';
		re += name;
		if(UI.accentcolorname === name) re += ' theme';
		re += '</button>';

		return re;
	}

	function selectTheme(newtheme){
		if(UI.accentcolorname === newtheme){
			$('#themechoices').toggle();
		} else {
			UI.accentcolorname = newtheme;
			updateURL();
			location.reload();
		}
	}

	function make_SyncStatus_HTML() {
		/*
			Filled Hexagon &#x2B22;
			Empty Hexagon &#x2B21;
		*/
		var re = '';

		re += '&#x2B22; local storage';
		re += '<br>';
		re += '&#x2B22; cloud storage';
		return re;
	}
	// ----------------
	// List Functions
	// ----------------

	function list_Refresh(){
		log("\nlist_Refresh \t START");
		var sl = get_SelectedList();

		log('\tSelected List Items: ' + JSON.stringify(sl.items));
		// List Items
		var con = '';
		var incl = (((100 - UI.accentmcolor.getLightness())*0.4) / (sl.items.length + 1));

		if(sl.items.length){
			$(sl.items).each(function(i) {
				con = (make_Item_HTML(i, sl.items[i], UI.accentmcolor.setLightness(((i+1)*incl + UI.accentmcolor.getLightness()))) + con);
			});
		} else {
			con += '<div class="item" style="color:'+UI.accentmcolor.lighten(0.3).getString()+';">';
			con += '<i>it\'s empty in here...</i></div>';
		}
		$('#itemGrid').html(con);

		// List Status
		var stat =	'<b>' + UI.currlist.replace('_', ' ') + '</b><br>';
		stat +=	'last remove: ' + timeToEnglish(sl.lastremove);
		stat +=	'<br>';
		stat +=	'last add: ' + timeToEnglish(sl.lastadd);
		//stat +=	'User Agent: ' + navigator.userAgent;
		$('#listStatus').html(stat);

		log("list_Refresh \t END\n");
	}

	function list_AddNewItem(item){
		item = inputSan($.trim(item), true);
		// log("\nADDNEWITEM - " + item);

		var sl = get_SelectedList();

		if(typeof sl.items == 'undefined') { sl.items = []; }

		if(item !== ''){
			$('#itemGrid').prepend(make_Item_HTML(sl.items.length-1, item, UI.accentmcolor, true));
			$('#itemGrid .item:first span').css({color:'white'});
			$('#itemGrid .item:first').css({backgroundColor: UI.accentmcolor.lighten(0.7).getString()}).toggle().slideDown('fast');
			list_PushChange({"itemadd": item});
		}
	}

	function list_RemoveItem(i){
		var item = $(('#item'+i));

		item.slideUp('fast', function(){
			list_PushChange({'itemremove': $.trim(inputSan(item.children('*:first').html(), false))});
		});
	}

	function list_PushChange(updates){
		updates = updates || {};
		var now = new Date().valueOf();

		log("list_PushChange: passed " + JSON.stringify(updates));

		$('#itemNew').val('').fadeTo('fast', 0.8);
		var clist = get_SelectedList();

		if(updates.itemadd){
			clist.items.push(updates.itemadd);
			clist.lastadd = now;
			UI.syncstate.variable = now;
		}

		if(updates.itemremove){
			var ai = clist.items.indexOf(updates.itemremove);
			if(ai > -1){
				clist.items.splice(ai, 1);
				clist.lastremove = now;
				UI.syncstate.variable = now;
			}
		}


		//	=======================
		//	SAVE DATA ELSWHERE
		//	=======================
			localStorage_PushChange();
		//	cloudStorage_PushChange();
		//	=======================


		list_Refresh();
		$('#itemNew').fadeTo('fast', 1.0);
	}


	function get_SelectedList(){
		log('get_SelectedList \t START');
		log('\tcurrlist = ' + UI.currlist + ' return = ' + JSON.stringify(UI.listdata[UI.currlist]));

		if(UI.currlist){
			return UI.listdata[UI.currlist];
		} else {
			throw "Attempted to access a list while none was selected.";
		}
	}

	function set_SelectedList(list){
		UI.currlist = list;
		if(!UI.listdata[list]) UI.listdata[list] = {'items':[], 'lastremove':false, 'lastadd':false};
		navTo_ListPage();
	}


	// ----------------
	// Other Storage Places
	// ----------------
	function localStorage_PushChange(){
		if(supportsLocalStorage()){
			UI.syncstate.localstorage = new Date().valueOf();
			localStorage.setItem('ListoData', JSON.stringify(UI));
		} else {
			UI.syncstate.localstorage = false;
		}
	}

	function cloudStorage_PushChange() {
		var success = false;

		// Save data via AJAX or whatever

		if(success){
			UI.syncstate.cloudstorage = new Date().valueOf();
		}
	}

	function localStorage_getData(){
		log('localStorage_getData:\t START');
		if(supportsLocalStorage()){
			var ls = localStorage.getItem('ListoData');
			log('\treturning: ' + JSON.parse(ls));
			return JSON.parse(ls);
		} else {
			return false;
		}
	}

	function cloudStorage_getData(){
		var clouddata = false;

		// Get data via AJAX or whatever

		if(clouddata){
			return JSON.parse(clouddata);
		} else {
			return false;
		}
	}


	// ----------------
	// Helper Functions
	// ----------------

	function updateURL(){
		// log('updateURL\t START');
		// Color
		var p_info = '?';
		var p_title = 'Listo!';

		if(UI.currlist){
			// on a list page
			p_title = (UI.currlist.replace(' ', '') + ' Listo!');
			if(UI.accentcolorname === UI.defaultaccentcolorname){
				// default color
				p_info = ('?list=' + UI.currlist);
			} else {
				// custom color
				p_info = ('?list=' + UI.currlist + '?color=' + UI.accentcolorname);
			}
		} else {
			// on the homepage
			if(UI.accentcolorname !== UI.defaultaccentcolorname){
				p_info = ('?color=' + UI.accentcolorname);
			}
		}


		if(typeof window.history.pushState == 'function') window.history.pushState('', p_title, p_info);
		document.title = p_title;
		// log('updateURL\t END');
	}

	function timeToEnglish(t){
		if(!t) { return 'never'; }

		var diff = new Date().getTime() - (t*1);
		var minute = 1000 * 60;
		var hour = minute * 60;
		var day = hour * 24;

		// log("TTE: " + t + " \t diff: " + diff);

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

	function setupDefaultLists(){
		for(var l=0; l<listlist.length; l++){
			var lname = listlist[l];
			if(!UI.listdata[lname]) UI.listdata[lname] = {'items':[], 'lastadd':false, 'lastremove':false};
		}
	}

	function supportsLocalStorage() {
		try {
			var re = ('localStorage' in window && window.localStorage !== null);
			log('supportsLocalStorage: ' + re);
			return re;
		} catch (e) {
			return false;
		}
	}