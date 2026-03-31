// =====================================================================
// cnr_dmi_page_settings.gs
// DMI Page 4: SETTINGS - Settings, Door Interlock, Signal Lamp,
//                        System Log, System Info, About
// =====================================================================

include "cnr_dmi_page_brakes.gs"

class CNR_DMI_PageSettings isclass CNR_DMI_PageBrakes {
	public string GetSettingsPageHTML(CNR_State_GenCoach state) {
		bool isModal = state.is_lcd_modal_open;
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");
		string headBlue = GetThemeColor(state, "headBlue"); if (isModal) headBlue = GetThemeColor(state, "modalHeadBlue");
		string darkerGrey = GetThemeColor(state, "darkerGrey");
		string darkestGrey = GetThemeColor(state, "darkestGrey");
		string mediumGrey = GetThemeColor(state, "mediumGrey");
		string lightGrey = GetThemeColor(state, "lightGrey");
		string innerBg = GetThemeColor(state, "innerBg");
		string darkGreen = GetThemeColor(state, "darkGreen"); if (isModal) darkGreen = GetThemeColor(state, "modalDarkGreen");
		string darkRed = GetThemeColor(state, "darkRed");
		string headGrey = GetThemeColor(state, "headGrey");

		string content = "<table width=455 bgcolor=" + darkerGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headBlue + "><td colspan=2 align=center><b><font color=" + whiteColor + ">" + state.GetText("SETTINGS") + "</font></b></td></tr>";
		
		// --- CATEGORY: GENERAL ---
		content = content + "<tr><td colspan=2 bgcolor=#111111 height=20><font size=1 color=#AAAAAA>&nbsp; GENERAL SETTINGS</font></td></tr>";
		
		// Language Selection
		content = content + "<tr><td width=40% height=40>&nbsp; " + state.GetText("LANGUAGE") + "</td><td width=60% align=center>";
		string enColor = "#444444"; string jaColor = "#444444"; string zhColor = "#444444";
		if (state.language == 0) enColor = "#008800"; else if (state.language == 1) jaColor = "#008800"; else zhColor = "#008800";
		content = content + "<table width=100% cellpadding=0 cellspacing=1 border=0><tr>";
		content = content + "<td bgcolor=" + enColor + " align=center height=30 width=33%><a href='live://property/set_lang_0'><b>" + state.GetText("ENGLISH") + "</b></a></td>";
		content = content + "<td bgcolor=" + jaColor + " align=center height=30 width=33%><a href='live://property/set_lang_1'><b>" + state.GetText("JAPANESE") + "</b></a></td>";
		content = content + "<td bgcolor=" + zhColor + " align=center height=30 width=34%><a href='live://property/set_lang_2'><b>" + state.GetText("CHINESE") + "</b></a></td>";
		content = content + "</tr></table></td></tr>";

		// --- CATEGORY: TRAIN SYSTEMS ---
		content = content + "<tr><td colspan=2 bgcolor=#111111 height=20><font size=1 color=#AAAAAA>&nbsp; TRAIN SYSTEMS</font></td></tr>";

		// Door Interlock Settings Link
		content = content + "<tr><td width=40% height=40>&nbsp; " + state.GetText("DOOR_INTERLOCK_BYPASS") + "</td>";
		content = content + "<td width=60% align=center><table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		content = content + "<td bgcolor=#3B6790 align=center height=35><a href='live://property/monitor_page_6'><b>" + state.GetText("SETTINGS") + "</b></a></td>";
		content = content + "</tr></table></td></tr>";

		// Signal Lamp Settings Link
		content = content + "<tr><td width=40% height=40>&nbsp; " + state.GetText("SIGNAL_LAMP") + "</td>";
		content = content + "<td width=60% align=center><table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		content = content + "<td bgcolor=#3B6790 align=center height=35><a href='live://property/monitor_page_8'><b>" + state.GetText("SETTINGS") + "</b></a></td>";
		content = content + "</tr></table></td></tr>";
		
		// --- CATEGORY: CAR NUMBER ---
		content = content + "<tr><td colspan=2 bgcolor=#111111 height=20><font size=1 color=#AAAAAA>&nbsp; CAR NUMBER CONFIGURATION</font></td></tr>";
		
		// Car Numbering Modal Button
		content = content + "<tr><td width=40% height=40>&nbsp; " + state.GetText("CAR_NUMBERING") + "</td><td width=60% align=center>";
		content = content + "<table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		content = content + "<td bgcolor=#3B6790 align=center height=35><a href='live://property/car_numbering_open'><b>" + state.GetText("SETTINGS") + "</b></a></td>";
		content = content + "</tr></table></td></tr>";
		
		// Numbering Start (Front/Rear/Auto)
		content = content + "<tr><td width=40% height=40>&nbsp; Numbering Start</td><td width=60% align=center>";
		string fNumColor = "#444444"; string rNumColor = "#444444"; string aNumColor = "#444444";
		if (state.car_num_mode == 0) fNumColor = "#008800"; else if (state.car_num_mode == 1) rNumColor = "#008800"; else aNumColor = "#008800";
		content = content + "<table width=100% cellpadding=0 cellspacing=1 border=0><tr>";
		content = content + "<td bgcolor=" + fNumColor + " align=center height=30 width=33%><a href='live://property/set_car_num_mode_0'><b>FRONT</b></a></td>";
		content = content + "<td bgcolor=" + rNumColor + " align=center height=30 width=33%><a href='live://property/set_car_num_mode_1'><b>REAR</b></a></td>";
		content = content + "<td bgcolor=" + aNumColor + " align=center height=30 width=34%><a href='live://property/set_car_num_mode_2'><b>AUTO</b></a></td>";
		content = content + "</tr></table></td></tr>";
		
		// --- CATEGORY: DIAGNOSTICS ---
		content = content + "<tr><td colspan=2 bgcolor=#111111 height=20><font size=1 color=#AAAAAA>&nbsp; MAINTENANCE & DIAGNOSTICS</font></td></tr>";

		// System Log Button
		content = content + "<tr><td width=40% height=40>&nbsp; " + state.GetText("SYSTEM_LOG") + "</td>";
		content = content + "<td width=60% align=center><table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		content = content + "<td bgcolor=#3B6790 align=center height=35><a href='live://property/monitor_page_5'><b>" + state.GetText("VIEW_LOGS") + "</b></a></td>";
		content = content + "</tr></table></td></tr>";
		
		// System Info Button
		content = content + "<tr><td width=40% height=40>&nbsp; System Info (OS)</td>";
		content = content + "<td width=60% align=center><table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		content = content + "<td bgcolor=#3B6790 align=center height=35><a href='live://property/monitor_page_7'><b>INFO</b></a></td>";
		content = content + "</tr></table></td></tr>";
		
		// About Button
		content = content + "<tr><td width=40% height=40>&nbsp; About</td>";
		content = content + "<td width=60% align=center><table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		content = content + "<td bgcolor=#3B6790 align=center height=35><a href='live://property/monitor_page_9'><b>ABOUT</b></a></td>";
		content = content + "</tr></table></td></tr>";
		
		content = content + "<tr><td colspan=2 height=111></td></tr>";
		content = content + "</table>";
		return content;
	}

	public string GetDoorInterlockPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		bool isModal = state.is_lcd_modal_open;
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");
		string headBlue = GetThemeColor(state, "headBlue"); if (isModal) headBlue = GetThemeColor(state, "modalHeadBlue");
		string darkerGrey = GetThemeColor(state, "darkerGrey");
		string darkestGrey = GetThemeColor(state, "darkestGrey");
		string mediumGrey = GetThemeColor(state, "mediumGrey");
		string lightGrey = GetThemeColor(state, "lightGrey");
		string innerBg = GetThemeColor(state, "innerBg");
		string darkGreen = GetThemeColor(state, "darkGreen"); if (isModal) darkGreen = GetThemeColor(state, "modalDarkGreen");
		string headGrey = GetThemeColor(state, "headGrey");

		string content = "<table width=455 bgcolor=" + darkerGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headBlue + "><td colspan=2 align=center><b><font color=" + whiteColor + ">" + state.GetText("DOOR_INTERLOCK") + "</font></b></td></tr>";
		
		// Coach Selection Row
		int totalCars = owner.GetMyTrain().GetVehicles().size();
		content = content + "<tr><td colspan=2 align=center bgcolor=#111111 height=25><font size=1 color=#AAAAAA>" + state.GetText("SELECT_COACH_CTRL") + "</font></td></tr>";
		content = content + "<tr><td colspan=2 align=center bgcolor=#111111><center><table cellpadding=1 cellspacing=1 border=0 align=center><tr>";
		int i;
		for (i = 0; i < totalCars; i++) {
			if (!state.interlockSelectionStates) state.interlockSelectionStates = Constructors.NewSoup();
			if (state.interlockSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) state.interlockSelectionStates.SetNamedTag((string)i, 1);
			int selState = state.interlockSelectionStates.GetNamedTagAsInt((string)i, 1);
			string btnColor = "#444444"; if (selState == 1) btnColor = "#008800";
			content = content + "<td width=22 bgcolor=" + btnColor + " align=center height=22><a href='live://property/toggle_interlock_sel_" + (string)i + "'>" + (string)(i+1) + "</a></td>";
		}
		content = content + "</tr></table></center></td></tr>";

		// Bypass Toggle (Edit)
		string bypassStr = state.GetText("ENABLED"); string bypassColor = "#008800";
		if (state.door_interlock_bypass_edit) { bypassStr = state.GetText("DISABLED"); bypassColor = "#880000"; }
		content = content + "<tr><td width=50% height=40>&nbsp; " + state.GetText("STATUS") + "</td>";
		content = content + "<td width=50% align=center bgcolor=" + bypassColor + " height=40><a href='live://property/interlockEdit_toggleBypass'><b>" + bypassStr + "</b></a></td></tr>";

		// Speed Adjustment (Edit)
		content = content + "<tr><td width=50% height=40>&nbsp; " + state.GetText("INTERLOCK_SPEED_LIMIT") + "</td><td width=50% align=center>";
		content = content + "<table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		content = content + "<td width=30% align=center bgcolor=" + headGrey + " height=40><a href='live://property/interlockEdit_dec'><img src='assets/na_08.png' height=30></a></td>";
		content = content + "<td width=40% align=center><b>" + (int)state.door_interlock_speed_edit + " km/h</b></td>";
		content = content + "<td width=30% align=center bgcolor=" + headGrey + " height=40><a href='live://property/interlockEdit_inc'><img src='assets/na_07.png' height=30></a></td>";
		content = content + "</tr></table></td></tr>";

		content = content + "</table>";
		content = content + "<table width=455 cellpadding=0 cellspacing=0 border=0><tr><td height=150>&nbsp;</td></tr></table>";
		
		// Confirm / Cancel
		content = content + "<table width=455 bgcolor=" + darkerGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr><td width=50% bgcolor=" + darkGreen + " align=center height=45><a href='live://property/interlockEdit_confirm'><img src='assets/na_20.png' width=35 height=35></a></td>";
		content = content + "<td width=50% bgcolor=" + GetThemeColor(state, "darkRed") + " align=center height=45><a href='live://property/interlockEdit_cancel'><img src='assets/na_11.png' width=35 height=35></a></td></tr>";
		
		content = content + "</table>";
		return content;
	}

	// ------------------------------------------------------------------
	// PAGE 8: SIGNAL LAMP SETTINGS
	// ------------------------------------------------------------------
	public string GetSignalLampPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		bool isModal = state.is_lcd_modal_open;
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");
		string headBlue = GetThemeColor(state, "headBlue"); if (isModal) headBlue = GetThemeColor(state, "modalHeadBlue");
		string darkerGrey = GetThemeColor(state, "darkerGrey");
		string darkestGrey = GetThemeColor(state, "darkestGrey");
		string mediumGrey = GetThemeColor(state, "mediumGrey");
		string lightGrey = GetThemeColor(state, "lightGrey");
		string innerBg = GetThemeColor(state, "innerBg");
		string darkGreen = GetThemeColor(state, "darkGreen"); if (isModal) darkGreen = GetThemeColor(state, "modalDarkGreen");
		string darkRed = GetThemeColor(state, "darkRed");
		string headGrey = GetThemeColor(state, "headGrey");

		string content = "<table width=455 bgcolor=" + darkerGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headBlue + "><td colspan=2 align=center><b><font color=" + whiteColor + ">" + state.GetText("SIGNAL_LAMP") + "</font></b></td></tr>";

		// Coach selection row  ALL cars shown, non-APVC/ANF are greyed and unclickable
		if (!owner.GetMyTrain()) { content = content + "</table>"; return content; }
		Vehicle[] vehicles = owner.GetMyTrain().GetVehicles();
		int totalCars = vehicles.size();

		// Init soups if needed
		if (!state.signalLampSelectionStates) state.signalLampSelectionStates = Constructors.NewSoup();
		if (!state.signalLampModeEditStates)  state.signalLampModeEditStates  = Constructors.NewSoup();

		// Currently selected car
		int selCar = state.signalLampSelectionStates.GetNamedTagAsInt("selected_car", -1);
		int i;

		// Find a valid default selected car if none selected
		if (selCar < 0 or selCar >= totalCars) {
			for (i = 0; i < totalCars; i++) {
				string vn = vehicles[i].GetLocalisedName();
				if (Str.Find(vn, "APVC", 0) != -1 or Str.Find(vn, "ANF", 0) != -1) {
					selCar = i;
					state.signalLampSelectionStates.SetNamedTag("selected_car", selCar);
					break;
				}
			}
		}

		content = content + "<tr><td colspan=2 align=center bgcolor=#111111 height=25><font size=1 color=#AAAAAA>" + state.GetText("SELECT_COACH_CTRL") + "</font></td></tr>";
		content = content + "<tr><td colspan=2 align=center bgcolor=#111111><center><table cellpadding=1 cellspacing=1 border=0 align=center><tr>";

		for (i = 0; i < totalCars; i++) {
			string vName = vehicles[i].GetLocalisedName();
			bool eligible = (Str.Find(vName, "APVC", 0) != -1 or Str.Find(vName, "ANF", 0) != -1);
			string btnColor;
			string numColor;
			if (eligible) {
				if (i == selCar) {
					btnColor = "#008800"; // Green highlight for the selected car
					numColor = "#FFFFFF";
				} else {
					btnColor = "#3B6790";
					numColor = "#FFFFFF";
				}
			} else {
				btnColor = "#2A2A2A";
				numColor = "#555555";
			}
			if (eligible) {
				content = content + "<td width=22 bgcolor=" + btnColor + " align=center height=22><a href='live://property/siglamp_car_sel_" + (string)i + "'><font color=" + numColor + ">" + (string)(i+1) + "</font></a></td>";
			} else {
				content = content + "<td width=22 bgcolor=" + btnColor + " align=center height=22><font color=" + numColor + ">" + (string)(i+1) + "</font></td>";
			}
		}
		content = content + "</tr></table></center></td></tr>";

		// Divider
		content = content + "<tr><td colspan=2 bgcolor=#111111 height=4></td></tr>";

		// Show per-car mode control only if a valid car is selected
		if (selCar >= 0 and selCar < totalCars) {
			string selName = vehicles[selCar].GetLocalisedName();
			content = content + "<tr bgcolor=#1A3A1A><td colspan=2 align=center height=28><font color=#21FC0D size=1>" + state.GetText("CAR") + " " + (string)(selCar+1) + " &nbsp; <b>" + selName + "</b></font></td></tr>";

			// Mode buttons: AUTO / ON / OFF
			int curMode = state.signalLampModeEditStates.GetNamedTagAsInt((string)selCar, 0);
			string autoBg = "#333333"; string autoTxt = "#888888";
			string onBg   = "#333333"; string onTxt   = "#888888";
			string offBg  = "#333333"; string offTxt  = "#888888";
			if (curMode == 0) { autoBg = "#3B6790"; autoTxt = "#FFFFFF"; }
			else if (curMode == 1) { onBg = "#005500"; onTxt = "#FFFFFF"; }
			else if (curMode == 2) { offBg = "#880000"; offTxt = "#FFFFFF"; }

			content = content + "<tr><td colspan=2 align=center bgcolor=#1A1A1A height=50>";
			content = content + "<table width=100% border=0 cellspacing=2 cellpadding=0><tr>";
			content = content + "<td width=33% align=center bgcolor=" + autoBg + " height=44><a href='live://property/siglamp_mode_" + (string)selCar + "_0'><b><font color=" + autoTxt + ">" + state.GetText("SIGLAMP_AUTO") + "</font></b></a></td>";
			content = content + "<td width=34% align=center bgcolor=" + onBg + " height=44><a href='live://property/siglamp_mode_" + (string)selCar + "_1'><b><font color=" + onTxt + ">" + state.GetText("SIGLAMP_ON") + "</font></b></a></td>";
			content = content + "<td width=33% align=center bgcolor=" + offBg + " height=44><a href='live://property/siglamp_mode_" + (string)selCar + "_2'><b><font color=" + offTxt + ">" + state.GetText("SIGLAMP_OFF") + "</font></b></a></td>";
			content = content + "</tr></table>";
			content = content + "</td></tr>";

			// Auto mode info
			content = content + "<tr><td colspan=2 bgcolor=#111111 height=25><font size=1 color=#886600>&nbsp; AUTO: " + state.GetText("SIGLAMP_AUTO") + " = 18:00 - 06:00</font></td></tr>";
		} else {
			// No APVC/ANF in consist
			content = content + "<tr><td colspan=2 align=center bgcolor=#111111 height=60><font color=#555555>" + state.GetText("SIGLAMP_NA") + "</font></td></tr>";
		}

		content = content + "</table>";
		content = content + "<table width=455 cellpadding=0 cellspacing=0 border=0><tr><td height=150>&nbsp;</td></tr></table>";

		// Confirm / Cancel
		content = content + "<table width=455 bgcolor=" + darkerGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr><td width=50% bgcolor=" + darkGreen + " align=center height=45><a href='live://property/siglampEdit_confirm'><img src='assets/na_20.png' width=35 height=35></a></td>";
		content = content + "<td width=50% bgcolor=" + GetThemeColor(state, "darkRed") + " align=center height=45><a href='live://property/siglampEdit_cancel'><img src='assets/na_11.png' width=35 height=35></a></td></tr>";

		content = content + "</table>";
		return content;
	}

	// ------------------------------------------------------------------
	// PAGE 4: SYSTEM LOG
	// ------------------------------------------------------------------
	public string GetSystemLogPageHTML(CNR_State_GenCoach state) {
		string content = "";
		
		string cCrewBg = "#154c79"; // Crew row bg
		string titleRow = "<table width=770 height=26 bgcolor=" + cCrewBg + " cellpadding=4 cellspacing=0 border=0><tr><td align=left><font size=3 color=#FFFFFF><b>Crew - Fault list</b></font></td></tr></table>";
		
		// Unfiltered logs logic
		int totalLogs = state.system_logs.CountTags();
		Soup filteredLogs = Constructors.NewSoup();
		int totalFiltered = 0;
		int j;
		for (j = totalLogs - 1; j >= 0; j--) {
			string msg = state.system_logs.GetNamedTag((string)j);
			filteredLogs.SetNamedTag((string)totalFiltered, msg);
			totalFiltered++;
		}
		
		int maxDisp = 8;
		if (state.monitor_log_selected < 0) state.monitor_log_selected = 0;
		if (state.monitor_log_selected >= totalFiltered) state.monitor_log_selected = totalFiltered - 1;
		if (state.monitor_log_selected < 0) state.monitor_log_selected = 0;
		
		if (state.monitor_log_selected < state.monitor_log_page) state.monitor_log_page = state.monitor_log_selected;
		if (state.monitor_log_selected >= state.monitor_log_page + maxDisp) state.monitor_log_page = state.monitor_log_selected - (maxDisp - 1);
		if (state.monitor_log_page < 0) state.monitor_log_page = 0;
		if (state.monitor_log_page > totalFiltered - maxDisp) state.monitor_log_page = totalFiltered - maxDisp;
		if (state.monitor_log_page < 0) state.monitor_log_page = 0;

		string cGrid = "#BBBBBB"; 
		string tHdr = "<tr bgcolor=#162D4A height=24>";
		tHdr = tHdr + "<td width=60 align=center><b><font size=2 color=#FFFFFF>Car</font></b></td>";
		tHdr = tHdr + "<td width=80 align=center><b><font size=2 color=#FFFFFF>Code</font></b></td>";
		tHdr = tHdr + "<td width=610 align=left><b><font size=2 color=#FFFFFF>&nbsp; Active Fault</font></b></td></tr>";

		string dt = "<table width=770 cellpadding=4 cellspacing=1 border=0 bgcolor=" + cGrid + ">" + tHdr;

		int i;
		for (i = 0; i < maxDisp; i++) {
			int idx = state.monitor_log_page + i;
			string logHit = "";
			if (idx < totalFiltered) logHit = filteredLogs.GetNamedTag((string)idx);
			
			if (logHit != "") {
				string[] tokens = Str.Tokens(logHit, "|");
				if (tokens.size() >= 5) {
					string carInfo = tokens[1];
					string statPart = tokens[2];
					string typePart = tokens[3];
					string msgPart  = tokens[4];

					string[] carTokens = Str.Tokens(carInfo, " -");
					string carNum = carInfo;
					if (carTokens.size() > 0) carNum = carTokens[carTokens.size() - 1];

					string codePart = "----"; 
					if (statPart != "") codePart = statPart;
					if (codePart.size() > 4) codePart = codePart[0, 4];

					string iconHtml = "";
					if (typePart == "FAULT") iconHtml = "<b><font color=#FF4444>( ! )</font></b>&nbsp;";
					else if (typePart == "WARN") iconHtml = "<b><font color=#EBD302>( i )</font></b>&nbsp;";
					else if (typePart == "READY") iconHtml = "<b><font color=#00FF00>(&#10003;)</font></b>&nbsp;";
					
					// Make row slightly lighter if selected for navigation reference
					string rowBg = "#0A1628";
					if (idx == state.monitor_log_selected) rowBg = "#112A45";

					dt = dt + "<tr bgcolor=" + rowBg + " height=35>";
					dt = dt + "<td width=60 align=center bgcolor=#20729C><font size=2 color=#FFFFFF><b>" + carNum + "</b></font></td>";
					dt = dt + "<td width=80 align=center><font size=2 color=#FFFFFF><b>" + codePart + "</b></font></td>";
					dt = dt + "<td width=610 align=left><font size=2 color=#FFFFFF><b>&nbsp;" + iconHtml + msgPart + "</b></font></td>";
					dt = dt + "</tr>";
				}
			} else {
				dt = dt + "<tr bgcolor=#0A1628 height=35>";
				dt = dt + "<td width=60 align=center bgcolor=#20729C></td>";
				dt = dt + "<td width=80 align=center></td>";
				dt = dt + "<td width=610 align=left></td>";
				dt = dt + "</tr>";
			}
		}
		dt = dt + "</table>";

		string pStr = (string)(state.monitor_log_page / maxDisp + 1) + " / " + (string)((totalFiltered - 1) / maxDisp + 1);
		if (totalFiltered == 0) pStr = "1 / 1";

		string pagination = "<table cellpadding=4 cellspacing=2 border=0><tr>";
		pagination = pagination + "<td bgcolor=#20729C width=40 align=center><a href='live://property/log_up'><font size=2 color=#FFFFFF><b>&#9650;</b></font></a></td>";
		if (state.monitor_log_page > 0) pagination = pagination + "<td bgcolor=#20729C width=80 align=center><a href='live://property/log_up'><font size=2 color=#FFFFFF><b>Prev.</b></font></a></td>";
		else pagination = pagination + "<td bgcolor=#113355 width=80 align=center><font size=2 color=#888888><b>Prev.</b></font></td>";
		pagination = pagination + "<td align=center valign=middle width=60><font size=2 color=#FFFFFF>" + pStr + "</font></td>";
		if (state.monitor_log_page + maxDisp < totalFiltered) pagination = pagination + "<td bgcolor=#20729C width=80 align=center><a href='live://property/log_down'><font size=2 color=#FFFFFF><b>Next</b></font></a></td>";
		else pagination = pagination + "<td bgcolor=#113355 width=80 align=center><font size=2 color=#888888><b>Next</b></font></td>";
		pagination = pagination + "<td bgcolor=#20729C width=40 align=center><a href='live://property/log_down'><font size=2 color=#FFFFFF><b>&#9660;</b></font></a></td>";
		pagination = pagination + "</tr></table>";

		content = "<table width=770 height=378 bgcolor=#0A1628 cellpadding=0 cellspacing=0 border=0><tr><td valign=top align=center>";
		content = content + titleRow + "<br>" + dt + "<br>";
		content = content + "<table width=770 border=0><tr><td align=right>" + pagination + "</td></tr></table>";
		content = content + "</td></tr></table>";

		return content;
	}

	// ------------------------------------------------------------------
	// PAGE 7: SYSTEM INFO (OS Physical Specs)
	// ------------------------------------------------------------------
	public string GetSystemInfoPageHTML(CNR_State_GenCoach state) {
		string mainBg = "#222222"; string titleBg = "#23486A"; string valColor = "#21FC0D"; string whiteColor = "#FFFFFF";
		
		float upS = World.GetTimeElapsed() - state.dmi_boot_timer;
		if (state.dmi_power_state != 3) upS = 0.0f;
		int upH = (int)(upS / 3600.0f);
		int upM = (int)((upS / 60.0f) % 60.0f);
		int upSec = (int)(upS % 60.0f);
		string uptimeStr = (string)upH + "h " + (string)upM + "m " + (string)upSec + "s";

		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + titleBg + "><td colspan=2 align=center><b><font color=" + whiteColor + ">SYSTEM INFORMATION (RTOS)</font></b></td></tr>";
		
		content = content + "<tr><td colspan=2 bgcolor=#111111 height=20><font size=1 color=#AAAAAA>&nbsp; HARDWARE SPECIFICATIONS</font></td></tr>";
		content = content + "<tr><td width=35%>&nbsp; Processor</td><td><font color=" + whiteColor + "><b>ARM Cortex-R82 Dual-Core</b></font><br><font size=1 color=#888888>Architecture: ARMv8-R64 @ 1.60GHz</font></td></tr>";
		content = content + "<tr><td>&nbsp; Memory</td><td><font color=" + whiteColor + "><b>2048 MB LPDDR4X ECC</b></font><br><font size=1 color=#888888>Type: Multi-bit Error Correction Code</font></td></tr>";
		content = content + "<tr><td>&nbsp; Graphics</td><td><font color=" + whiteColor + "><b>ARM Mali-G52 Embedded</b></font><br><font size=1 color=#888888>VRAM: 1024 MB Reserved System Memory</font></td></tr>";

		content = content + "<tr><td colspan=2 bgcolor=#111111 height=20><font size=1 color=#AAAAAA>&nbsp; OPERATING SYSTEM</font></td></tr>";
		content = content + "<tr><td>&nbsp; OS Name</td><td><font color=" + valColor + "><b>MSTN-RTOS v2.8.1</b></font></td></tr>";
		content = content + "<tr><td>&nbsp; Kernel Type</td><td>Microkernel (Deterministic)</td></tr>";
		content = content + "<tr><td>&nbsp; Security</td><td>Secure Boot / TrustZone (EL3)</td></tr>";
		content = content + "<tr><td>&nbsp; System Uptime</td><td><font color=" + whiteColor + ">" + uptimeStr + "</font></td></tr>";

		content = content + "<tr><td colspan=2 bgcolor=#111111 height=20><font size=1 color=#AAAAAA>&nbsp; REAL-TIME PERFORMANCE</font></td></tr>";
		content = content + "<tr><td colspan=2 align=center><table width=100% cellpadding=5 cellspacing=0 border=0>";
		content = content + "<tr>";
		content = content + "<td width=33% align=center bgcolor=#1A1A1A><b>CPU LOAD</b><br><font color=" + valColor + " size=4>" + (string)(int)state.rtos_cpu_load + "%</font></td>";
		content = content + "<td width=34% align=center bgcolor=#1A1A1A><b>MEM USED</b><br><font color=" + valColor + " size=4>" + (string)(int)state.rtos_mem_load + " MB</font></td>";
		content = content + "<td width=33% align=center bgcolor=#1A1A1A><b>JITTER</b><br><font color=" + valColor + " size=4>" + (string)(int)state.rtos_jitter + " &mu;s</font></td>";
		content = content + "</tr></table></td></tr>";

		content = content + "</table>";
		return content;
	}

	// ------------------------------------------------------------------
	// PAGE 9: ABOUT
	// ------------------------------------------------------------------
	public string GetAboutPageHTML(CNR_State_GenCoach state) {
		string content = "<table width=455 bgcolor=#000000 cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=#23486A><td colspan=2 align=center><b><font color=#FFFFFF>ABOUT</font></b></td></tr>";
		content = content + "<tr bgcolor=#000000><td colspan=2 height=20>&nbsp;</td></tr>";
		content = content + "<tr><td colspan=2 bgcolor=#000000 align=center height=200><img src='assets/dev_logo.png' width=80></td></tr>";
		content = content + "<tr bgcolor=#000000><td colspan=2 height=20>&nbsp;</td></tr>";
		
		// Section: Creative
		content = content + "<tr><td colspan=2><table width=100% border=0 cellspacing=0 cellpadding=1>";
		content = content + "<tr><td bgcolor=#1A1A1A align=right><font color=#AAAAAA>Texture & Model &nbsp;</font></td><td width=60% bgcolor=#1A1A1A>&nbsp;<b><font color=#FFFFFF>Voravit L.</font></b></td></tr>";
		content = content + "<tr><td bgcolor=#1A1A1A align=right><font color=#AAAAAA>Sounds &nbsp;</font></td><td bgcolor=#1A1A1A>&nbsp;<b><font color=#FFFFFF>Naphon W.<br>&nbsp;Ronnakrit R.</font></b></td></tr>";
		content = content + "<tr><td bgcolor=#1A1A1A align=right><font color=#AAAAAA>Script &nbsp;</font></td><td bgcolor=#1A1A1A>&nbsp;<b><font color=#FFFFFF>Naphon W.</font></b></td></tr>";
		content = content + "</table></td></tr>";
		
		content = content + "<tr bgcolor=#000000><td colspan=2 height=10>&nbsp;</td></tr>";
		
		// Section: Production
		content = content + "<tr><td colspan=2><table width=100% border=0 cellspacing=0 cellpadding=1>";
		content = content + "<tr><td bgcolor=#1A1A1A align=right><font color=#AAAAAA>Developer &nbsp;</font></td><td width=60% bgcolor=#1A1A1A>&nbsp;<b><font color=#FFFFFF>MSTN Production</font></b></td></tr>";
		content = content + "<tr><td bgcolor=#1A1A1A align=right><font color=#AAAAAA>Publisher &nbsp;</font></td><td bgcolor=#1A1A1A>&nbsp;<b><font color=#FFFFFF>MSTN Production</font></b></td></tr>";
		content = content + "</table></td></tr>";
		
		content = content + "<tr bgcolor=#000000><td colspan=2 height=20>&nbsp;</td></tr>";
		
		// Footer
		content = content + "<tr bgcolor=#000000><td colspan=2 align=center><font size=1 color=#666666>Last updated 21 Mar 2026<br>&copy; 2026 MSTN Production</font></td></tr>";
		
		content = content + "</table>";
		return content;
	}


	public string GetStatusMonitorPanelHTML(CNR_State_GenCoach state, Vehicle owner, ProductQueue fuelQ, Library scriptLib) {
		if (!owner.GetMyTrain()) return "<html><body bgcolor=#000000></body></html>";
		Vehicle[] vehicles = owner.GetMyTrain().GetVehicles();
		float velocity = state.speed;
		if (velocity < 0.0f) velocity = -velocity;
		int speed = (int)velocity;
		bool isModal = (state.is_lcd_modal_open or state.modal_mode != 0);
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");

		float gameTime = World.GetGameTime() + 0.5f;
		if (gameTime >= 1.0f) gameTime = gameTime - 1.0f;
		int totalSeconds = (int)(gameTime * 86400.0f);
		int hours = (totalSeconds / 3600) % 24;
		int minutes = (totalSeconds / 60) % 60;
		int seconds = totalSeconds % 60;

		string timeStr = (string)hours + ":";
		if (minutes < 10) timeStr = timeStr + "0";
		timeStr = timeStr + (string)minutes + ":";
		if (seconds < 10) timeStr = timeStr + "0";
		timeStr = timeStr + (string)seconds;

		string pwrColor = "#FF0000"; if (state.dmi_power_state > 0) pwrColor = "#21FC0D";
		string pwrBtn = "<a href='live://property/dmi_power_toggle'><table width=40 height=40 bgcolor=#1A1A1A border=1 bordercolor=" + pwrColor + "><tr><td align=center valign=middle><img src='assets/nav/power.png' width=24 height=24></td></tr></table></a>";

		string destText = state.ann_next_stop_name;
		if (destText == "") destText = "-";

		bool isBooted = (state.dmi_power_state == 3);
		string speedDisp = "--";
		string timeDisp = "--:--:--";
		
		int d = World.GetGameDate();
		int m = World.GetGameMonth();
		int y = World.GetGameYear();
		string dStr = (string)d; if (d < 10) dStr = "0" + dStr;
		string mStr = (string)m; if (m < 10) mStr = "0" + mStr;
		string dateDisp = dStr + "/" + mStr + "/" + (string)y;

		if (isBooted) { speedDisp = (string)speed; timeDisp = timeStr; }

		string iconOA = "<img src='assets/nav/fault_overview.png' width=32 height=32>";
		string iconS = "<img src='assets/nav/remedy_text.png' width=32 height=32>";

		string content = "";
		if (state.monitor_page == 0) content = GetHomePageHTML(state, owner, vehicles, scriptLib);
		else if (state.monitor_page == 1) content = GetPowerPageHTML(state, owner, fuelQ);
		else if (state.monitor_page == 2) content = GetLCDPageHTML(state, owner);
		else if (state.monitor_page == 3) content = GetBrakesPageHTML(state, owner);
		else if (state.monitor_page == 4) content = GetSettingsPageHTML(state);
		else if (state.monitor_page == 5) content = GetSystemLogPageHTML(state);
		else if (state.monitor_page == 6) content = GetDoorInterlockPageHTML(state, owner);
		else if (state.monitor_page == 7) content = GetSystemInfoPageHTML(state);
		else if (state.monitor_page == 8) content = GetSignalLampPageHTML(state, owner);
		else if (state.monitor_page == 9) content = GetAboutPageHTML(state);

		// --- Power State Content Override ---
		// If booting or OFF, replace the page content but keep the frame
		if (state.dmi_power_state == 0) content = "<table width=750 height=400 bgcolor=#000000 cellspacing=0 cellpadding=0 border=0><tr><td></td></tr></table>";
		else if (state.dmi_power_state == 1) content = GetLogoBootHTML();
		else if (state.dmi_power_state == 2) content = GetTerminalBootHTML(state, owner);
		else if (state.dmi_power_state == 4) content = GetLoadingBootHTML(state);

		string tabs = GetNavigationTabsHTML(state);

		string w_screen = "770"; string w_content = "770"; string w_inner = "770";

		// Refined Layout with modal support
		string bodyBgc = "#111111"; if (state.is_lcd_modal_open or state.modal_mode != 0) bodyBgc = "#080808";
		
		// Unified layout structure (Always shows header/tabs)
		bool blockContent = (state.is_lcd_modal_open or state.modal_mode != 0);
		string innerTable = "<table width=" + w_content + " height=420 bgcolor=#2B4B63 cellpadding=0 cellspacing=0 border=0>" +
					"<tr><td valign=top align=center>" + GetSharedHeaderHTML(state) + "</td></tr>" +
					"<tr><td valign=top align=center height=360>" + content + "</td></tr>" +
				"</table>";
		string innerContent;
		if (blockContent) {
			innerContent = "<div style='pointer-events:none'>" + innerTable + "</div>";
		} else {
			innerContent = innerTable;
		}
				
		string pageBody = "<table width=" + w_screen + " height=480 bgcolor=#111111 cellpadding=0 cellspacing=0 border=0>" +
			"<tr height=420><td height=420 valign=top align=center bgcolor=" + bodyBgc + ">" + innerContent + "</td></tr>" +
			"<tr height=60><td height=60 valign=bottom align=center>" + tabs + "</td></tr>" +
			"</table>";
		
		return "<html><body marginheight=0 marginwidth=0 bgcolor=#000000>" +
			"<table width=770 height=480 cellpadding=0 cellspacing=0 border=0><tr height=480>" +
			"<td width=770 height=480 align=left valign=top>" + pageBody + "</td>" +
			"</tr></table>" +
			"</body></html>";
	}

	public string GetLogDetailModalContent(CNR_State_GenCoach state) {
		// Re-filter to find the exact log by state.monitor_log_selected
		int totalLogs = state.system_logs.CountTags();
		Soup filteredLogs = Constructors.NewSoup();
		int totalFiltered = 0;
		int j;
		for (j = totalLogs - 1; j >= 0; j--) {
			string msg = state.system_logs.GetNamedTag((string)j);
			bool passes = false;
			if (state.log_filter == 0) passes = true;
			else {
				string[] tokens = Str.Tokens(msg, "|");
				if (tokens.size() >= 5) {
					string logType = tokens[3];
					if (state.log_filter == 1 and logType == "FAULT") passes = true;
					else if (state.log_filter == 2 and logType == "WARN") passes = true;
					else if (state.log_filter == 3 and logType == "READY") passes = true;
				}
			}
			if (passes) {
				filteredLogs.SetNamedTag((string)totalFiltered, msg);
				totalFiltered++;
			}
		}

		string logHit = "";
		if (state.monitor_log_selected >= 0 and state.monitor_log_selected < totalFiltered) {
			logHit = filteredLogs.GetNamedTag((string)state.monitor_log_selected);
		}

		string timePart = "N/A"; string carPart = "N/A"; string msgPart = "No Detail"; string typePart = "INFO";
		if (logHit != "") {
			string[] tokens = Str.Tokens(logHit, "|");
			if (tokens.size() >= 5) {
				timePart = tokens[0];
				carPart  = tokens[1];
				typePart = tokens[3];
				msgPart  = tokens[4];
			}
		}

		string msgColor = "#FFFFFF";
		if (typePart == "FAULT") msgColor = "#FF4444";
		else if (typePart == "WARN") msgColor = "#EBD302";
		else if (typePart == "READY") msgColor = "#44FF44";

		// Construct inner content for RenderModalWindow
		string table = "<table width=100% bgcolor=#1A1A1A cellpadding=10 cellspacing=1 border=0>";
		table = table + "<tr><td height=140 valign=top align=left>";
		table = table + "<font size=3 color=" + msgColor + ">" + msgPart + "</font>";
		table = table + "</td></tr>";
		table = table + "<tr><td height=15></td></tr>";
		table = table + "<tr><td align=center bgcolor=#005500 height=45><a href='live://property/log_modal_close'><table width=120 border=0><tr><td align=center><b><font size=4>" + state.GetText("OK") + "</font></b></td></tr></table></a></td></tr>";
		table = table + "</table>";
		
		string title = state.GetText("LOG_DETAIL") + ": " + carPart;
		return RenderModalWindow(title, table, 440);
	}

	public string GetLCDEditModalContent(CNR_State_GenCoach state) {
		string table = "<table width=410 bgcolor=#222222 cellpadding=4 cellspacing=1 border=0>";
		table = table + "<tr bgcolor=#23486A><td colspan=3 align=center><b><font color=#FFFFFF size=2>EDITOR: LCD CONFIG - PAGE " + (string)(state.lcd_edit_page_idx + 1) + "</font></b></td></tr>";
		table = table + "<tr>";
		table = table + "<th width=60 bgcolor=#222222 align=center><font size=1>Line</font></th>";
		table = table + "<th width=165 bgcolor=#222222 align=center><font size=1>Current Content (Ref)</font></th>";
		table = table + "<th width=185 bgcolor=#222222 align=center><font size=1>New Content (Type here)</font></th>";
		table = table + "</tr>";
		
		Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_edit_page_idx);
		bool anyContent = false;
		int line;
		CNR_Systems cSystems = new CNR_Systems();

		for (line = 0; line < 9; line++) {
			string lineTxt = "";
			if (pageSoup) lineTxt = pageSoup.GetNamedTag("line_" + (string)line);
			
			// Pre-fill Pull Priority: 1. Custom Page Data, 2. Current Rendered Strings
			if (lineTxt == "") {
				lineTxt = state.GetLCDEditLineDefault(state.lcd_edit_page_idx, line);
			}
			if (lineTxt != "") anyContent = true;

			// Truncate for display in modal
			lineTxt = cSystems.TruncateTo11(state, lineTxt);

			table = table + "<tr>";
			table = table + "<td bgcolor=#333333 align=center><font size=1>Line " + (string)(line+1) + "</font></td>";
			table = table + "<td bgcolor=#111111 align=center><font size=1 color=#AAAAAA>" + lineTxt + "</font></td>";
			table = table + "<td bgcolor=#111111 align=center><trainz-object style=edit-box id=modal_lcd_line_" + (string)line + " width=160 height=20></trainz-object></td>";
			table = table + "</tr>";
		}
		
		table = table + "<tr><td colspan=3 height=10></td></tr>";
		table = table + "</table>";

		// ACTION BUTTONS TABLE  full-fill, no gaps
		string btnTable = "<table width=410 border=0 cellpadding=0 cellspacing=0><tr>";
		
		// Apply  green solid background, always active
		btnTable = btnTable + "<td width=50% align=center valign=middle bgcolor=#005500 height=45>";
		btnTable = btnTable + "<a href='live://property/lcd_modal_apply_edit'><center><img src='assets/na_20.png' width=32 height=32></center></a>";
		btnTable = btnTable + "</td>";

		// Cancel  red solid background
		btnTable = btnTable + "<td width=50% align=center valign=middle bgcolor=#880000 height=45>";
		btnTable = btnTable + "<a href='live://property/lcd_modal_cancel_edit'><center><img src='assets/na_11.png' width=32 height=32></center></a>";
		btnTable = btnTable + "</td>";

		btnTable = btnTable + "</tr></table>";

		return table + btnTable;
	}

	public string GetModalPageHTML(CNR_State_GenCoach state) {
		string content = "";
		// Identify which modal content to show based on mode
		if (state.modal_mode >= 1 and state.modal_mode <= 5) {
			content = GetLCDModalContent(state);
		} else if (state.modal_mode == 6) {
			content = GetLogDetailModalContent(state);
		} else if (state.modal_mode == 7) {
			content = GetLCDTemplateModalContent(state);
		} else if (state.modal_mode == 8) {
			content = GetLCDEditModalContent(state);

		}
		
		if (content == "") return "";

		string html = "<html><body marginheight=0 marginwidth=0 style='background-color: transparent;'>";
		html = html + "<table width=100% height=100% cellpadding=0 cellspacing=0 border=0>";
		html = html + "<tr><td align=center valign=middle>" + content + "</td></tr>";
		html = html + "</table></body></html>";
		return html;
	}

};
