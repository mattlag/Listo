	/*
	========================================================
	Three setup variables for you!
	========================================================
	*/

	/*
	--------------------------------------------------------
	Default Lists
	An array of list names you want to keep.
	List names should use underscores_between_words.
	What lists exist can be modified on the settings page.
	--------------------------------------------------------
	*/
	var listlist = ['to_do', 'groceries', 'for_the_house', 'online'];


	/*
	--------------------------------------------------------
	Theme Colors
	This should be a RGB color specified as an object.
	Theme choice will be saved locally, per client, with
	HTML5 local storage.  It can be changed on the settings
	page.
	--------------------------------------------------------
	*/
	var themecolors = {
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
	// Customized stuff the User adds
	var USER = {
		'list_data' : {},
		'theme_name' : 'blue',
		'sync_state' : {'variable':false, 'localstorage':false, 'cloudstorage':false},
		'unsync' : [],
	};

	// Stuff the UI needs
	var UI = {
		'current_list' : false,
		'theme_mcolor' : {},
		'animation_speed' : 60,
		'listpage' : false,
		'homepage' : false
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

		$(window).on('error', dumpErrorInfo);

		// Setup
		UI.homepage = $('#homepage');
		UI.listpage = $('#listpage');
		data_Sync();

		// Accent Color
		UI.theme_mcolor = new mColor(themecolors[USER.theme_name]).setLightness(30);
		UI.homepage.add('#listpage').css('background-color', UI.theme_mcolor.getString());
		log('\tDefault Accent Color: ' + USER.theme_name);

		// Page Content
		refresh_HomePage_HTML();

		log('>>> READY \t END\n');
	});

	function navigate(list){
		log('\nnavigate \t START');
		log('\tto: ' + (list? list : 'homepage'));

		UI.current_list = list;

		if(list){
			if(!USER.list_data[list]) USER.list_data[list] = {'items':[], 'lastremove':false, 'lastadd':false};
			refresh_ListPage_HTML();
			navTo(UI.listpage, list_FlashFocusClearInput);
		} else {
			refresh_HomePage_HTML();
			navTo(UI.homepage);
		}


		log('navigate \t END\n');
	}

	function navTo(target, complete) {
		log('navTo ' + target.id);

		var current = UI.listpage;
		if(target === UI.listpage) current = UI.homepage;
		var both = $('#homepage').add('#listpage');
		var speed = UI.animation_speed*2;

		both.css({'overflow' : 'hidden'});
		target.css({'left' : '100%'});
		current.css({'left' : '0%'});

		current.animate(
			{'left' : '-=100%'}, speed,
			function() { current.scrollTop(0); }
		);


		target.animate(
			{'left' : '-=100%'}, speed,
			function(){
				both.css({'overflow-y' : 'auto'});
				target.scrollTop(0);
				if(complete) complete.call();
			}
		);


	}




	// --------------------------------
	// HOME Functions
	// --------------------------------

	function refresh_HomePage_HTML(){
		var con = '';
		var incl = (((100 - UI.theme_mcolor.getLightness())*0.4) / (listlist.length + 1));

		$(listlist).each(function(l){
			var bg = UI.theme_mcolor.setLightness(((listlist.length + 1) - l) *incl + UI.theme_mcolor.getLightness());
			var bgcolor = bg.getString();
			var txcolor = bg.lighten(0.8).getString();
			var countbgcolor = bg.lighten(0.15).getString();
			var lname = listlist[l];
			var listnum = USER.list_data[lname].items.length;

			con += '<div class="list" ';
			con += 'tabindex="'+(l+2)+'" ';
			con += 'style="cursor:pointer; background-color:'+bgcolor+'; color:'+txcolor+';" ';
			con += 'onclick="navigate(\''+lname+'\');">';
			con += '<span class="listname">'+lname.replace(/_/gi, ' ')+'</span>';
			if(listnum) con += '<span class="listcount" style="background-color:'+countbgcolor+';"><span style="color:'+bgcolor+';">'+listnum+'</span></span>';
			con += '</div>';
		});

		con += '<div id="homefooter"></div>';

		UI.homepage.html(con);
		$('#syncstatus').css('color', UI.theme_mcolor.lighten(0.3).getString());
		UI.homepage.focus();
		refresh_HomePageFooter_HTML();
	}

	function refresh_HomePageFooter_HTML() {
		var con = '<h1>listo!</h1>';
		con += "<div id='syncstatus'>"+make_SyncStatus_HTML()+"</div>";
		con += "<div id='themestatus'>"+make_ThemeChooser_HTML()+"</div>";

		if(TEST.show_dev_buttons) con += TEST_make_Debug_Buttons();

		$('#homefooter').html(con).css({'color': UI.theme_mcolor.lighten(0.4).getString()});
	}

	function make_ThemeChooser_HTML() {
		var re = '';
		re += make_ThemeChooser_Button(USER.theme_name);
		re += '<div id="themechoices">';

		for(var c in themecolors){
			if(themecolors.hasOwnProperty(c)){
				if(c !== USER.theme_name){
					re += make_ThemeChooser_Button(c);
				}
			}
		}

		re += '</div>';
		return re;
	}

	function make_ThemeChooser_Button(name) {
		var mc = new mColor(themecolors[name]).setLightness(30);
		var bgcolor = mc.lighten(0.05).getString();
		var txtcolor = mc.lighten(0.5).getString();
		var re = '<button class="footerbutton" ';
		re += 'style="background-color:'+bgcolor+'; color:'+txtcolor+';" ';
		re += 'onclick="selectTheme(\''+name+'\');" ';
		re += '>';
		re += name;
		if(USER.theme_name === name) re += ' theme';
		re += '</button>';

		return re;
	}

	function selectTheme(newtheme){
		if(USER.theme_name === newtheme){
			$('#themechoices').toggle();
		} else {
			USER.theme_name = newtheme;
			data_Push();
			location.reload();
		}
	}

	function make_SyncStatus_HTML() {
		var re = '<table>';

		if(USER.sync_state.cloudstorage){
			re += '<tr><td class="leftcol">saved:</td><td>' + timeToEnglish(USER.sync_state.cloudstorage) + '</td></tr>';
		} else if (USER.sync_state.localstorage){
			re += '<tr><td class="leftcol">saved locally:</td><td>' + timeToEnglish(USER.sync_state.localstorage) + '</td></tr>';
			if(cloudstorageserverurl){
				re += '<tr><td colspan="2">waiting for internet to sync with the cloud</td></tr>';
				re += '<tr><td colspan="2">' + make_Refresh_Button() + '</td></tr>';
			}
		} else {
			re += '<tr><td>could not save</td></tr>';
			re += '<tr><td>data will be lost when this tab is closed</td></tr>';
			if(cloudstorageserverurl){
				re += '<tr><td colspan="2">' + make_Refresh_Button() + '</td></tr>';
			}
		}
		re += '</table>';
		return re;
	}

	function make_Refresh_Button() {
		var bgcolor = UI.theme_mcolor.lighten(0.05).getString();
		var txtcolor = UI.theme_mcolor.lighten(0.3).getString();
		var re = '<button class="footerbutton" ';
		re += 'style="background-color:'+bgcolor+'; color:'+txtcolor+';" ';
		re += 'onclick="data_Sync();" ';
		re += '>';
		re += 'refresh';
		re += '</button>';
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
		con += "<div id='listfooter'></div>";

		$('#listpage').html(con);
		refresh_List_HTML();
		refresh_ListPageFooter_HTML();
		refresh_ListStatus_HTML();

		$('#itemnew').on('keypress', function(event) {
			if ( event.which == 13 ) {
				var ni = $('#itemnew');
				list_AddNewItem(ni.val());
			}
		}).css({
			'color': UI.theme_mcolor.getString(),
			'backgroundColor' : "rgb(250,250,250)"
		});

		$('#homebutton').css({
			'color': UI.theme_mcolor.lighten(0.4).getString(),
			'backgroundColor' : UI.theme_mcolor.lighten(0.1).getString()
		});

		log('refresh_ListPage_HTML \t END\n');
	}

	function refresh_List_HTML(){
		log("\nrefresh_List_HTML \t START");
		var sl = get_SelectedList();

		log('\tSelected List Items: ' + JSON.stringify(sl.items));
		// List Items
		var con = '';
		var incl = (((100 - UI.theme_mcolor.getLightness())*0.4) / (sl.items.length + 1));

		if(sl.items.length){
			$(sl.items).each(function(i) {
				con = (make_Item_HTML(i, sl.items[i], UI.theme_mcolor.setLightness(((i+1)*incl + UI.theme_mcolor.getLightness()))) + con);
			});
		} else {
			con += '<div class="item" id="emptyinhere" style="color:'+UI.theme_mcolor.lighten(0.2).getString()+';">';
			con += '<i>it\'s empty in here...</i></div>';
		}
		$('#itemgrid').html(con);

		log("refresh_List_HTML \t END\n");
	}

	function refresh_ListPageFooter_HTML() {
		var con = "<button id='homebutton' onclick='navigate(false);'>home &ensp; &#x276F;</button>";
		con += '<h1>' + UI.current_list.replace(/_/gi, ' ') + '</h1>';
		con += "<div id='liststatus'></div>";

		if(TEST.show_dev_buttons) con += TEST_make_Debug_Buttons();

		$('#listfooter').html(con).css({'color': UI.theme_mcolor.lighten(0.4).getString()});
	}

	function refresh_ListStatus_HTML() {
		var sl = get_SelectedList();
		var	stat = '<table style="float:right;">';
		stat += '<tr><td class="leftcol">last remove:</td><td class="rightcol">' + timeToEnglish(sl.lastremove) + '</td></tr>';
		stat +=	'<tr><td class="leftcol">last add:</td><td class="rightcol">' + timeToEnglish(sl.lastadd) + '</td></tr>';
		stat += '</table>';
		$('#liststatus').html(stat);
	}

	function list_AddNewItem(item){
		item = inputSan($.trim(item), true);
		// log("\nADDNEWITEM - " + item);

		var sl = get_SelectedList();

		if(typeof sl.items == 'undefined') { sl.items = []; }

		if(item !== ''){
			$('#emptyinhere').animate({'opacity' : 0}, (UI.animation_speed/4));
			$('#itemgrid').prepend(make_Item_HTML(sl.items.length-1, item, UI.theme_mcolor, true));
			$('#itemgrid .item:first span').css({color:'white'});
			$('#itemgrid .item:first').css({backgroundColor: UI.theme_mcolor.lighten(0.4).getString()}).toggle().slideDown((UI.animation_speed*1.2), refresh_List_HTML);
			data_Push({"itemadd": item});

		} else {
			data_Sync();
		}

		list_FlashFocusClearInput('list_AddNewItem');
	}

	function list_RemoveItem(i){
		var item = $(('#item'+i));

		item.slideUp(UI.animation_speed*2, function(){
			data_Push({'itemremove': $.trim(inputSan(item.children('*:first').html(), false))});
			refresh_List_HTML();
			list_FlashFocusClearInput('list_RemoveItem');
		});
	}

	function list_FlashFocusClearInput(calledby) {
		log('list_FlashFocusClearInput \t calledby ' + (calledby || 'navigate'));
		$('#itemnew').fadeTo(UI.animation_speed, 0.95).val('').fadeTo(UI.animation_speed, 1.0).focus();
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
		// log('\tcurrent_list = ' + UI.current_list + ' return = ' + JSON.stringify(USER.list_data[UI.current_list]));

		if(UI.current_list){
			return USER.list_data[UI.current_list];
		} else {
			log('get_SelectedList \t RETURNING FALSE');
			return false;
		}
	}














	// --------------------
	// Data Functions: GET
	// --------------------

	function data_Sync() {
		if(!cloudstorageserverurl || TEST.disable_cloud){
			data_Got({});
		} else {
			ax(USER);
		}
	}

	function data_Got(got_clouddata) {
		// Set default  data
		log('data_Got\t START');
		var got_localdata = localStorage_getData();
		log('\tCloud Storage and Local Storage: ' + got_clouddata + ' ' + got_localdata);

		if(got_clouddata && got_clouddata !== {}){
			// Cloud connection is good
			log('\tBranch: Got Clouddata');
			USER = got_clouddata;

			var uns = got_localdata.unsync;
			if(uns){
				// Recovering from a bad Cloud Sync Status, attempt to merge
				for(var i=0; i<uns.length; i++){
					data_Push(uns[i].updates, USER.list_data[uns[i].list]);
				}
			}

			// Now that everything is as good as can be, load appropriate data to USER
			USER.unsync = [];
			if(got_localdata && got_localdata.theme_name){
				// But, respect local theme choice if there is one
				USER.theme_name = got_localdata.theme_name;
			}
			localStorage_PushChange();

		} else if (got_localdata && got_localdata !== {}) {
			// If no Cloud Storage, fallback to Local Storage
			log('\tBranch: Got Localdata (but not cloud data)');
			USER = got_localdata;
			log('\tCopied got_localdata to USER from GOT_LOCALDATA:');
			// log(USER);
			// log(got_localdata);
		} else {
			// Nothing saved, default to empty lists
			log('\tBranch: No Data');
			setupDefaultLists();
			data_Push();
		}
		refresh_SyncStatus();

		log('data_Got\t END');
	}

	function localStorage_getData(){
		log('localStorage_getData:\t START');
		if(TEST.disable_local) return false;

		try {
			var ls = JSON.parse(window.localStorage.getItem('Listo_Data'));
			ls.sync_state.localstorage = now();
			log('\treturning: ' + ls);
			log('\tsync_state.localstorage: ' + ls.sync_state.localstorage);
			log('localStorage_getData:\t END RETURNING LS');
			return ls;
		} catch (e) {
			USER.sync_state.localstorage = false;
			log('\tERROR CATCH localStorage: ' + window.localStorage);
			log('localStorage_getData:\t END RETURNING FALSE');
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
			USER.sync_state.variable = now();
		}

		if(updates.itemremove){
			var ai = list.items.indexOf(updates.itemremove);
			if(ai > -1){
				list.items.splice(ai, 1);
				list.lastremove = now();
				USER.sync_state.variable = now();
			}
		}


	//	=======================
	//	SAVE DATA ELSWHERE
	//	=======================
		localStorage_PushChange();
		data_Sync();

		refresh_SyncStatus();
		refresh_ListStatus_HTML();
	}

	function localStorage_PushChange(){
		USER.sync_state.localstorage = false;
		var setresult = 'initial';

		log('localStorage_PushChange');
		log(window.localStorage);
		if(!TEST.disable_local){
			try {
				setresult = window.localStorage.setItem('Listo_Data', JSON.stringify(USER));
				USER.sync_state.localstorage = now();
			} catch (e) {
				log('localStorage_PushChange: local storage not supported.');
				log(setresult);
			}
		}
	}


	function ax(pdata) {
		$.ajax({
			type: 'POST',
			url:  cloudstorageserverurl,
			data: pdata
		})
		.done(function(redata) {
			redata = JSON.parse(redata);
			log("ax: returns");
			log(redata);
			if(redata.sync_state.cloudstorage !== USER.sync_state.cloudstorage){
				throw('AJAX LAG: a change was made while the AJAX request was out.');
			}
			if(!TEST.disable_cloud) USER.sync_state.cloudstorage = now();

			data_Got(redata);
		})
		.fail(function(data){
			log("Error, AJAX failure: \n" + JSON.stringify(data));
			USER.sync_state.cloudstorage = false;
			USER.unsync.push({'list':UI.current_list, 'updates':updates});
			localStorage_PushChange();
			log('Unable to Push to the cloud, unsync is now');
			log(USER.unsync);

			data_Got({});
			// setTimeout(function(){ ax(USER); }, 300000);
		});
	}












	// ----------------
	// Helper Functions
	// ----------------

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
			if(!USER.list_data[lname]) USER.list_data[lname] = {'items':[], 'lastadd':false, 'lastremove':false};
		}
	}






	// ----------------
	// Test Functions
	// ----------------

	function TEST_make_Debug_Buttons() {
		var re = '<br><br>';
		re += '<style>.devbutton { font-size:.6em; height: 24px; margin-right:8px; padding:8px; border:0px; border-radius:4px; color:white; background-color:slategray;}</style>';
		// re += '<button class="devbutton" onclick="navigate(UI.current_list);">Soft Refresh</button>';
		re += '<button class="devbutton" onclick="window.localStorage.removeItem(\'Listo_Data\');">Clear Local Storage</button>';
		re += '<button class="devbutton" onclick="console.log(UI);">Dump UI Variable</button>';
		re += '<button class="devbutton" onclick="console.log(USER);">Dump USER Variable</button>';
		re += '<button class="devbutton" onclick="TEST.disable_local = !TEST.disable_local; refresh_SyncStatus(); log(\'TEST.disable_local = \' + TEST.disable_local);">Toggle Local Storage</button>';
		re += '<button class="devbutton" onclick="TEST.disable_cloud = !TEST.disable_cloud; refresh_SyncStatus(); log(\'TEST.disable_cloud = \' + TEST.disable_cloud);">Toggle Cloud Storage</button>';
		return re;
	}

	function log(x) {
		TEST.console_entries.push(x);
		if(TEST.console_log) console.log(x);
	}

	function dumpErrorInfo() {
		log('dumpErrorInfo');

		var re = '<br><h3>Looks like something went wrong.  Oops</h3><textarea style="background-color:white; color:black; font-size:20px; font-family:monospace; width:80%; height:80%;">';

		for(var i=0; i<TEST.console_entries.length; i++){
			re += ''+i+'\t'+TEST.console_entries[i]+'\n';
		}

		re += '</textarea>';
		document.getElementById('homepage').innerHTML += re;
	}