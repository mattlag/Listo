	/*
	========================================================
	Three setup variables for you!
	========================================================
	*/

	/*
	--------------------------------------------------------
	Lists
	An array of list names you want to keep.
	List names should use underscores_between_words
	--------------------------------------------------------
	*/
	var listlist = ['to_do', 'groceries', 'for_the_house', 'online'];


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
	cloudstorageserverurl
	Listo! works fine using local HTML5 storage, but if you
	hook it up to a server, it can persist changes in the
	cloud.  This requires you to write a .php backend that
	saves and serves up values via POST.
	If you want to do that, specify the URL of the server
	page here.
	--------------------------------------------------------
	*/
	var cloudstorageserverurl = false;
	// var cloudstorageserverurl = 'http://www.yourdomain.com/listo/sync.php';
	// var cloudstorageserverurl = '/sync.php';




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
		'syncstate' : {'variable':false, 'localstorage':false, 'cloudstorage':false},
		'unsync' : [],
		'animationspeed' : 100,
		'w': false
	};

	// Test & Debug Switches
	var TEST = {
		'disable_local' : false,
		'disable_cloud' : false,
		'console_log' : true,
		'show_dev_buttons' : true,
		'console_entries' : []
	};

	// -----------
	// Main Setup
	// -----------

	$(document).ready(function(){
		log('>>> READY \t START');

		data_Get();

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

		$('body').add('#wrapper').css('background-color', UI.accentmcolor.getString());

		// Page Content
		UI.w = $('#wrapper');
		var bk = document.location.href.split('?list=')[1];

		if(listlist.indexOf(bk) > -1){
			navigate(bk.split('?color=')[0]);
		} else {
			navigate();
		}

		refresh_SyncStatus();

		log('>>> READY \t END\n');
	});

	function navigate(list){
		log('\nnavigate \t START');
		log('\tto: ' + (list? list : 'homepage'));

		var dir = 1;
		var animationspeed = 400;

		if(list){
			UI.currlist = list;
			if(!UI.listdata[list]) UI.listdata[list] = {'items':[], 'lastremove':false, 'lastadd':false};
			dir = -1;
		} else {
			UI.currlist = false;
		}

		updateURL();

		UI.w.css({'overflow': 'hidden'});
		UI.w.animate(
			{'left': (2000*dir), 'opacity': 0},
			{'duration': animationspeed, 'complete':
				function(){
					dir*=-1;
					UI.currlist ? refresh_ListPage_HTML() : refresh_HomePage_HTML();
					UI.w.css({'left': (2000*dir), 'overflow': 'hidden'})
					.animate({'scrollTop': 0}, 1)
					.animate({'left': 0, 'opacity': 1}, {'duration': animationspeed, 'complete':
						function(){
							UI.w.css({'overflow-y': 'scroll'});
						}
					});
				}
			});

		log('navigate \t END\n');
	}








	// --------------------------------
	// HOME Functions
	// --------------------------------

	function refresh_HomePage_HTML(){
		var con = '';
		var incl = (((100 - UI.accentmcolor.getLightness())*0.4) / (listlist.length + 1));

		$(listlist).each(function(l){
			var bg = UI.accentmcolor.setLightness(((listlist.length + 1) - l) *incl + UI.accentmcolor.getLightness());
			var bgcolor = bg.getString();
			var txcolor = bg.lighten(0.8).getString();
			var countbgcolor = bg.lighten(0.15).getString();
			var lname = listlist[l];
			var listnum = UI.listdata[lname].items.length;

			con += '<div class="list" ';
			con += 'tabindex="'+(l+1)+'" ';
			con += 'style="cursor:pointer; background-color:'+bgcolor+'; color:'+txcolor+';" ';
			con += 'onclick="navigate(\''+lname+'\');">';
			con += '<span class="listname">'+lname.replace(/_/gi, '&nbsp;')+'</span>';
			if(listnum) con += '<span class="listcount" style="background-color:'+countbgcolor+';"><span style="color:'+bgcolor+';">'+listnum+'</span></span>';
			con += '</div>';
		});

		con += '<div id="footer"></div>';

		$('#wrapper').html(con);
		$('#syncstatus').css('color', UI.accentmcolor.lighten(0.3).getString());

		refresh_HomePageFooter_HTML();
	}

	function refresh_HomePageFooter_HTML() {
		var con = '<h1>listo!</h1>';
		con += "<div id='syncstatus'>"+make_SyncStatus_HTML()+"</div>";
		con += "<div id='themestatus'>"+make_ThemeChooser_HTML()+"</div>";

		if(TEST.show_dev_buttons) con += TEST_make_Debug_Buttons();

		$('#footer').html(con).css({'color': UI.accentmcolor.lighten(0.4).getString()});
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
		var re = '';
		re += 'local storage: ' + timeToEnglish(UI.syncstate.localstorage);
		re += '<br>';
		re += 'cloud storage: ' + timeToEnglish(UI.syncstate.cloudstorage);
		return re;
	}

	function refresh_SyncStatus() {
		try { document.getElementById('syncstatus').innerHTML = make_SyncStatus_HTML(); } catch (e){}
	}









	// ----------------------------------------
	// LIST Functions
	// ----------------------------------------

	function refresh_ListPage_HTML(){
		log('\nrefresh_ListPage_HTML \t START');

		var con = "<input type='text' id='itemnew'>";
		con += "<div id='itemgrid'></div>";
		con += "<div id='footer'></div>";

		$('#wrapper').html(con);
		refresh_List_HTML();
		refresh_ListPageFooter_HTML();
		refresh_ListStatus_HTML();
		list_FlashFocusClearInput();

		$('#itemnew').on('keypress', function(event) {
			if ( event.which == 13 ) {
				var ni = $('#itemnew');
				list_AddNewItem(ni.val());
			}
		}).css({
			color: UI.accentmcolor.getString(),
			backgroundColor : "rgb(250,250,250)"
		});
		$('#homebutton').on('click', function(event) {
			navigate();
		}).css({
			color: UI.accentmcolor.lighten(0.4).getString(),
			backgroundColor : UI.accentmcolor.lighten(0.1).getString()
		});

		// var fcolor = UI.accentmcolor.lighten(0.3).getString();
		// if(UI.mobile) $('#wrapper').css('overflow-y' , 'scroll');

		log('refresh_ListPage_HTML \t END\n');
	}

	function refresh_List_HTML(){
		log("\nrefresh_List_HTML \t START");
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
		$('#itemgrid').html(con);

		log("refresh_List_HTML \t END\n");
	}

	function refresh_ListPageFooter_HTML() {
		var con = "<button id='homebutton'>&#x276E; home &nbsp;</button>";
		con += '<h1>' + UI.currlist.replace(/_/gi, ' ') + '</h1>';
		con += "<div id='liststatus'></div>";

		if(TEST.show_dev_buttons) con += TEST_make_Debug_Buttons();

		$('#footer').html(con).css({'color': UI.accentmcolor.lighten(0.4).getString()});
	}

	function refresh_ListStatus_HTML() {
		var sl = get_SelectedList();
		var	stat =	'last remove: ' + timeToEnglish(sl.lastremove);
		stat +=	'<br>';
		stat +=	'last add: ' + timeToEnglish(sl.lastadd);
		//stat +=	'User Agent: ' + navigator.userAgent;
		$('#liststatus').html(stat);
	}

	function list_AddNewItem(item){
		item = inputSan($.trim(item), true);
		// log("\nADDNEWITEM - " + item);

		var sl = get_SelectedList();

		if(typeof sl.items == 'undefined') { sl.items = []; }

		if(item !== ''){
			$('#itemgrid').prepend(make_Item_HTML(sl.items.length-1, item, UI.accentmcolor, true));
			$('#itemgrid .item:first span').css({color:'white'});
			$('#itemgrid .item:first').css({backgroundColor: UI.accentmcolor.lighten(0.4).getString()}).toggle().slideDown((UI.animationspeed*1.6), refresh_List_HTML);
			data_Push({"itemadd": item});
		} else {
			data_Get();
		}

		list_FlashFocusClearInput();
	}

	function list_RemoveItem(i){
		var item = $(('#item'+i));

		item.slideUp(UI.animationspeed, function(){
			data_Push({'itemremove': $.trim(inputSan(item.children('*:first').html(), false))});
			refresh_List_HTML();
			list_FlashFocusClearInput();
		});
	}

	function list_FlashFocusClearInput() {
		$('#itemnew').fadeTo(UI.animationspeed, 0.8).val('').fadeTo(UI.animationspeed, 1.0).focus();
	}

	function make_Item_HTML(num, name, bgc, hideclose) {
		// log('make_Item_HTML: name = ' + name);
		var txtitem = bgc.lighten(0.8).getString();
		var bgitem = bgc.getString();
		var bgclose = bgc.lighten(0.1).getString();
		var re = '<div id="item'+num+'" class="item" style="background-color:'+bgitem+';">';
		re += '<span class="itemname" style="color:'+txtitem+';">' + name + '</span>';
		if(!hideclose){
			re += '<button class="itemremove" onclick="list_RemoveItem('+num+');" style="color:'+bgclose+';">&#10006;</button>';
		}
		re += '</div>';

		// log('make_Item_HTML\t END');
		return re;
	}

	function get_SelectedList(){
		// log('get_SelectedList \t START');
		// log('\tcurrlist = ' + UI.currlist + ' return = ' + JSON.stringify(UI.listdata[UI.currlist]));

		if(UI.currlist){
			return UI.listdata[UI.currlist];
		} else {
			throw "Attempted to access a list while none was selected.";
		}
	}














	// --------------------
	// Data Functions: GET
	// --------------------

	function data_Get() {
		// Set default  data
		log('data_Get\t START');
		var got_clouddata = cloudStorage_getData();
		var got_localdata = localStorage_getData();
		log('\tCloud Storage and Local Storage: ' + got_clouddata + ' ' + got_localdata);

		if(got_clouddata && got_clouddata !== {}){
			// Cloud connection is good
			log('\tBranch: Got Clouddata');
			UI = got_clouddata;

			var uns = got_localdata.unsync;
			if(uns){
				// Recovering from a bad Cloud Sync Status, attempt to merge
				for(var i=0; i<uns.length; i++){
					data_Push(uns[i].updates, UI.listdata[uns[i].list]);
				}
			}

			// Now that everything is as good as can be, load appropriate data to UI
			UI.unsync = [];
			if(got_localdata && got_localdata.accentcolorname && got_localdata.accentcolorname !== UI.defaultaccentcolorname){
				// But, respect local theme choice if there is one
				UI.accentcolorname = got_localdata.accentcolorname;
			}
			localStorage_PushChange();

		} else if (got_localdata && got_localdata !== {}) {
			// If no Cloud Storage, fallback to Local Storage
			log('\tBranch: Got Localdata (but not cloud data)');
			UI = got_localdata;
			log('\tCopied got_localdata to UI:');
			// log(got_localdata);
			// log(UI);
		} else {
			// Nothing saved, default to empty lists
			log('\tBranch: No Data');
			setupDefaultLists();
		}
		refresh_SyncStatus();

		log('data_Get\t END');
	}

	function localStorage_getData(){
		log('localStorage_getData:\t START');
		if(TEST.disable_local) return false;

		try {
			var ls = JSON.parse(localStorage.getItem('Listo_Data'));
			ls.syncstate.localstorage = now();
			log('\treturning: ' + ls);
			log('\tsyncstate.localstorage: ' + ls.syncstate.localstorage);
			log('localStorage_getData:\t END');
			return ls;
		} catch (e) {
			UI.syncstate.localstorage = false;
			log('\tCATCH syncstate.localstorage: ' + UI.syncstate.localstorage);
			log('localStorage_getData:\t END');
			return false;
		}
	}

	function cloudStorage_getData(){
		if(!cloudstorageserverurl) return false;
		if(TEST.disable_cloud) return false;

		var clouddata = false;

		// Get JSON data via AJAX or whatever

		if(clouddata){
			clouddata = JSON.parse(clouddata);
			clouddata.syncstate.cloudstorage = now();
			return clouddata;
		} else {
			UI.syncstate.cloudstorage = false;
			return false;
		}
	}


	// --------------------
	// Data Functions: PUSH
	// --------------------

	function data_Push(updates, list){
		list = list || get_SelectedList();
		updates = updates || {};

		log("data_Push: passed " + JSON.stringify(updates));

		if(updates.itemadd){
			list.items.push(updates.itemadd);
			list.lastadd = now();
			UI.syncstate.variable = now();
		}

		if(updates.itemremove){
			var ai = list.items.indexOf(updates.itemremove);
			if(ai > -1){
				list.items.splice(ai, 1);
				list.lastremove = now();
				UI.syncstate.variable = now();
			}
		}


	//	=======================
	//	SAVE DATA ELSWHERE
	//	=======================
		localStorage_PushChange();

		if(cloudstorageserverurl){
			cloudStorage_PushChange();
			if(!UI.syncstate.cloudstorage){
				// Failed to sync to the cloud, try to save locally for later
				UI.unsync.push({'list':UI.currlist, 'updates':updates});
				localStorage_PushChange();
				log('Unable to Push to the cloud, unsync is now');
				log(UI.unsync);
			}
		}

		refresh_SyncStatus();
	}

	function localStorage_PushChange(){
		UI.syncstate.localstorage = false;
		if(!TEST.disable_local){
			try {
				localStorage.setItem('Listo_Data', JSON.stringify(UI));
				UI.syncstate.localstorage = now();
			} catch (e) {
				log('localStorage_PushChange: local storage not supported.');
			}
		}
	}

	function cloudStorage_PushChange() {
		var success = false;

		// Save JSON data via AJAX or whatever

		if(success && !TEST.disable_cloud){
			UI.syncstate.cloudstorage = now();
		} else {
			UI.syncstate.cloudstorage = false;
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

	function now() {return (new Date().valueOf());}

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






	// ----------------
	// Test Functions
	// ----------------

	function TEST_make_Debug_Buttons() {
		var re = '<br><br>';
		re += '<style>.devbutton { font-size:.6em; height: 24px; margin-right:8px; padding:8px; border:0px; border-radius:4px; color:white; background-color:slategray;}</style>';
		re += '<button class="devbutton" onclick="navigate(UI.currlist);">Soft Refresh</button>';
		re += '<button class="devbutton" onclick="localStorage.removeItem(\'Listo_Data\');">Clear Local Storage</button>';
		re += '<button class="devbutton" onclick="console.log(UI);">Dump UI Variable</button>';
		re += '<button class="devbutton" onclick="TEST.disable_local = !TEST.disable_local; refresh_SyncStatus(); log(\'TEST.disable_local = \' + TEST.disable_local);">Toggle Local Storage</button>';
		re += '<button class="devbutton" onclick="TEST.disable_cloud = !TEST.disable_cloud; refresh_SyncStatus(); log(\'TEST.disable_cloud = \' + TEST.disable_cloud);">Toggle Cloud Storage</button>';
		return re;
	}

	function log(x) {
		TEST.console_entries.push(x);
		if(TEST.console_log) console.log(x);
	}

	function dumpErrorInfo(message, url, line) {
		var re = '<br><h1>Looks like something went wrong.  Oops</h1><textarea style="background-color:white; color:black; font-size:20px; font-family:monospace; width:80%; height:80%;">';

		re += 'MSG:\t' + message + '\n';
		re += 'LINE:\t' + line + '\n';
		for(var i=0; i<TEST.console_entries.length; i++){
			re += ''+i+'\t'+TEST.console_entries[i]+'\n';
		}

		re += '</textarea>';
		document.getElementById('wrapper').innerHTML += re;
	}