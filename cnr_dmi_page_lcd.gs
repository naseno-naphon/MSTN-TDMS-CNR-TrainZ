// =====================================================================
// cnr_dmi_page_lcd.gs
// DMI Page 2: LCD / SIGNBOARD - LCD Config, Signboard, Announcements
// =====================================================================

include "cnr_dmi_page_power.gs"

class CNR_DMI_PageLCD isclass CNR_DMI_PagePower {
	public string GetSignboardPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		bool isModal = state.is_lcd_modal_open;
		bool dimmed = (state.modal_mode != 0 or isModal);
		string[] stnNames = new string[7];
		stnNames[0] = state.GetText("BANGKOK"); stnNames[1] = state.GetText("CHIANG_MAI"); stnNames[2] = state.GetText("UBON_RAT");
		stnNames[3] = state.GetText("NONG_KHAI"); stnNames[4] = state.GetText("VTE"); stnNames[5] = state.GetText("HAT_YAI"); stnNames[6] = state.GetText("PHUKET");

		string trnName = "Normal";
		if (state.lcd_origin == 1 or state.lcd_dest == 1) {
			if (state.lcd_train_idx == 0) trnName = "Special Express 9/10";
			else trnName = "Special Express 5/6";
		} else if (state.lcd_origin == 2 or state.lcd_dest == 2) trnName = "Special Express 23/24";
		else if (state.lcd_origin == 3 or state.lcd_dest == 3) trnName = "Special Express 25/26";
		else if (state.lcd_origin == 4 or state.lcd_dest == 4) trnName = "Special Express 25/26 (VTE)";
		else if (state.lcd_origin == 5 or state.lcd_dest == 5) trnName = "Special Express 31/32";
		else if (state.lcd_origin == 6 or state.lcd_dest == 6) trnName = "Phuket (000)";

		string blankColor = GetThemeColor(state, "mediumGrey"); string blankText = state.GetText("SIGN_MODE_NORMAL");
		if (state.lcd_override_id == 14) { blankColor = GetThemeColor(state, "darkRed"); blankText = state.GetText("SIGN_MODE_OFF"); }
		else if (state.lcd_override_id == 15) { blankColor = GetThemeColor(state, "darkBlue"); blankText = state.GetText("SIGN_MODE_FACTORY"); }
		else if (state.lcd_override_id == 16) { blankColor = GetThemeColor(state, "headBlue"); blankText = state.GetText("SIGN_MODE_MANUAL"); }

		string origBg = GetThemeColor(state, "darkestGrey"); if (state.modal_mode == 1) origBg = GetThemeColor(state, "headBlue");
		string destBg = GetThemeColor(state, "darkestGrey"); if (state.modal_mode == 2) destBg = GetThemeColor(state, "headBlue");
		string trnBg = GetThemeColor(state, "darkestGrey"); if (state.modal_mode == 3) trnBg = GetThemeColor(state, "headBlue");
		string blankRowBg = blankColor; if (state.modal_mode == 4) blankRowBg = GetThemeColor(state, "headBlue");

		// COLOR DIMMING (Using Centralized Theme Helper)
		string mainBg = GetThemeColor(state, "mainBg");
		string titleBg = GetThemeColor(state, "titleBg");
		string valColor = GetThemeColor(state, "yellow");
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");

		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + titleBg + "><td colspan=2 align=center><b><font color=" + whiteColor + ">" + state.GetText("LCD_SIDE_CTRL") + "</font></b></td></tr>";

		// ORIG / DEST Row
		string origL = "<font color=" + valColor + " size=3><b>" + stnNames[state.lcd_origin] + "</b></font>";
		string destL = "<font color=" + whiteColor + " size=3><b>" + stnNames[state.lcd_dest] + "</b></font>";
		if (!dimmed) {
			origL = "<a href='live://property/lcd_open_orig'>" + origL + "</a>";
			destL = "<a href='live://property/lcd_open_dest'>" + destL + "</a>";
		}

		content = content + "<tr><td colspan=2 bgcolor=" + mainBg + " align=center><table width=410 cellpadding=2 cellspacing=1 border=0>";
		
		// Icon Logic: na_13/14 (White/Active), na_15/16 (Grey/Faded)
		string upIcon = "assets/na_15.png"; // Faded Up
		string dnIcon = "assets/na_16.png"; // Faded Down
		bool canSwap = !dimmed;
		bool upClickable = false;
		bool dnClickable = false;

		if (state.lcd_origin == 0) { // Bangkok at Origin -> Can move Down
			if (canSwap) { dnIcon = "assets/na_14.png"; dnClickable = true; }
		} else if (state.lcd_dest == 0) { // Bangkok at Destination -> Can move Up
			if (canSwap) { upIcon = "assets/na_13.png"; upClickable = true; }
		}

		string upBtn = "<img src='" + upIcon + "' width=40 height=30>";
		if (upClickable) upBtn = "<a href='live://property/lcd_swap_ask'>" + upBtn + "</a>";
		
		string dnBtn = "<img src='" + dnIcon + "' width=40 height=30>";
		if (dnClickable) dnBtn = "<a href='live://property/lcd_swap_ask'>" + dnBtn + "</a>";

		// Row 1 (Origin) + Down Icon
		content = content + "<tr><td width=120 height=30><font color=" + whiteColor + ">" + state.GetText("TRN_ORIGIN") + "</font></td><td align=center bgcolor=" + origBg + "><center>" + origL + "</center></td>";
		content = content + "<td width=60 bgcolor=" + GetThemeColor(state, "mediumGrey") + " align=center valign=middle><center>" + dnBtn + "</center></td></tr>";
		
		// Row 2 (Destination) + Up Icon
		content = content + "<tr><td width=120 height=30><font color=" + whiteColor + ">" + state.GetText("TRN_DEST") + "</font></td><td align=center bgcolor=" + destBg + "><center>" + destL + "</center></td>";
		content = content + "<td width=60 bgcolor=" + GetThemeColor(state, "mediumGrey") + " align=center valign=middle><center>" + upBtn + "</center></td></tr>";
		
		content = content + "</table></td></tr>";

		string trnL = "<font color=" + GetThemeColor(state, "lightGrey") + " size=3><b>" + trnName + "</b></font>";
		string blankL = "<b><font size=3 color=" + whiteColor + ">" + blankText + "</font></b>";
		if (!dimmed) {
			trnL = "<a href='live://property/lcd_open_train'>" + trnL + "</a>";
			blankL = "<a href='live://property/lcd_open_blank'>" + blankL + "</a>";
		}

		content = content + "<tr><td width=120 height=30><font color=" + whiteColor + ">" + state.GetText("TRN_VARIANT") + "</font></td><td align=center bgcolor=" + trnBg + "><center>" + trnL + "</center></td></tr>";
		content = content + "<tr><td height=30><font color=" + whiteColor + ">" + state.GetText("FORCE_BLANK") + "</font></td><td align=center bgcolor=" + blankRowBg + "><center>" + blankL + "</center></td></tr>";
		content = content + "</table>";
		return content;
	}

	// ------------------------------------------------------------------
	// LCD SUB-PAGE 2: CONFIG (BETA)
	// ------------------------------------------------------------------
	public string GetLCDConfigPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		bool isModal = state.is_lcd_modal_open;
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");
		string headBlue = GetThemeColor(state, "headBlue"); if (isModal) headBlue = GetThemeColor(state, "modalHeadBlue");
		string darkerGrey = GetThemeColor(state, "darkerGrey");
		string darkestGrey = GetThemeColor(state, "darkestGrey");
		string mediumGrey = GetThemeColor(state, "mediumGrey");
		string lightGrey = GetThemeColor(state, "lightGrey");
		string innerBg = GetThemeColor(state, "innerBg");
		string inactiveBg = GetThemeColor(state, "inactiveBg");
		string inactiveTxt = GetThemeColor(state, "inactiveTxt");
		string darkGreen = GetThemeColor(state, "darkGreen"); if (isModal) darkGreen = GetThemeColor(state, "modalDarkGreen");
		string darkBlue = GetThemeColor(state, "darkBlue");
		string darkRed = GetThemeColor(state, "darkRed");
		string headGrey = GetThemeColor(state, "headGrey");

		string content = "<table width=455 bgcolor=" + darkerGrey + " cellpadding=1 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headBlue + "><td colspan=2 align=center><b><font color=" + whiteColor + ">" + state.GetText("LCD_CONFIG_TITLE") + "</font></b></td></tr>";

		// Coach Selection Row
		int totalCars = 0;
		if (owner.GetMyTrain()) totalCars = owner.GetMyTrain().GetVehicles().size();
		content = content + "<tr><td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkestGrey") + " height=20><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">" + state.GetText("SELECT_COACH_CTRL") + "</font></td></tr>";
		content = content + "<tr><td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkestGrey") + "><center><table cellpadding=0 cellspacing=1 border=0 align=center><tr>";
		int i;
		for (i = 0; i < totalCars; i++) {
			if (!state.lcdSelectionStates) state.lcdSelectionStates = Constructors.NewSoup();
			if (state.lcdSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) state.lcdSelectionStates.SetNamedTag((string)i, 1);
			int selState = state.lcdSelectionStates.GetNamedTagAsInt((string)i, 1);
			string btnColor = inactiveBg; if (selState == 1) btnColor = darkGreen;
			content = content + "<td width=20 bgcolor=" + btnColor + " align=center height=20><a href='live://property/toggle_lcd_sel_" + (string)i + "'><font size=1 color=" + whiteColor + ">" + (string)(i+1) + "</font></a></td>";
		}
		content = content + "</tr></table></center></td></tr>";

		// (Template Button Moved to Right Column)
		// Inner Table splitting into Left & Right
		content = content + "<tr><td colspan=2 bgcolor=" + darkestGrey + ">";
		content = content + "<table width=100% border=0 cellspacing=0 cellpadding=1><tr><td width=310 valign=top height=325>";

		// LEFT COLUMN: Lines and Tabs
		string leftContent = "<table width=100% cellpadding=1 cellspacing=1 border=0>";
		// Page Selection Tabs (1 to 5)
		leftContent = leftContent + "<tr><td colspan=2 align=center bgcolor=" + GetThemeColor(state, "innerBg") + "><table width=100% cellpadding=0 cellspacing=1 border=0><tr>";
		for (i = 0; i < 5; i++) {
			string pBg = inactiveBg; string pFg = inactiveTxt;
			if (state.lcd_edit_page_idx == i) { pBg = headBlue; pFg = whiteColor; }
			leftContent = leftContent + "<td width=20% bgcolor=" + pBg + " align=center height=24><a href='live://property/lcd_edit_page_" + (string)i + "'><b><font color=" + pFg + " size=1>Page " + (string)(i+1) + "</font></b></a></td>";
		}
		leftContent = leftContent + "</tr></table></td></tr>";

		CNR_Systems cSystems = new CNR_Systems();
		bool isPageActive = state.lcd_page_enabled[state.lcd_edit_page_idx];

		int line;
		if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
		Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_edit_page_idx);
		for (line = 0; line < 9; line++) {
			string lineTxt = "";
			if (pageSoup) lineTxt = pageSoup.GetNamedTag("line_" + (string)line);
			
			if (lineTxt == "") {
				if (state.lcd_edit_page_idx == 0) lineTxt = state.lcd_config_lines_th[line];
				else if (state.lcd_edit_page_idx == 1) lineTxt = state.lcd_lines_en[line];
			}

			// Apply 11-char limit for display
			lineTxt = cSystems.TruncateTo11(state, lineTxt);

			string lineColor = GetThemeColor(state, "yellow");
			string headBg = mediumGrey;
			string rowBg = GetThemeColor(state, "lcdBg");
			if (!isPageActive) {
				lineColor = inactiveTxt;
				headBg = darkestGrey;
				rowBg = darkerGrey;
			}

			leftContent = leftContent + "<tr><td width=60 bgcolor=" + headBg + " align=center height=22><font size=1 color=" + GetThemeColor(state, "black") + ">" + state.GetText("LCD_LINE") + " " + (string)(line+1) + "</font></td>";
			leftContent = leftContent + "<td bgcolor=" + rowBg + " align=left height=22>&nbsp;<font size=2 color=" + lineColor + ">" + lineTxt + "</font></td></tr>";
		}
		// EDIT & SHOWING TOGGLE ROW
		string showBg = inactiveBg; string showLbl = "INACTIVE LCD"; string showFg = inactiveTxt;
		if (isPageActive) { showBg = darkGreen; showLbl = "ACTIVE LCD"; showFg = whiteColor; }
		
		leftContent = leftContent + "<tr><td colspan=2 height=4></td></tr>";
		leftContent = leftContent + "<tr><td colspan=2 align=center><table width=100% border=0 cellspacing=1 cellpadding=0><tr>";
		leftContent = leftContent + "<td width=50% align=center bgcolor=" + headBlue + " height=30><a href='live://property/lcd_open_edit_modal'><b><font color=" + whiteColor + " size=1>&nbsp;EDIT PAGE " + (string)(state.lcd_edit_page_idx + 1) + "&nbsp;</font></b></a></td>";
		leftContent = leftContent + "<td width=50% align=center bgcolor=" + showBg + " height=30><a href='live://property/lcd_toggle_page_" + (string)state.lcd_edit_page_idx + "'><b><font color=" + showFg + " size=1>" + showLbl + "</font></b></a></td>";
		leftContent = leftContent + "</tr></table></td></tr>";
		
		leftContent = leftContent + "</table>";

		content = content + leftContent + "</td>";

		// RIGHT COLUMN
		content = content + "<td width=145 valign=top bgcolor=" + GetThemeColor(state, "darkerGrey") + ">";
		
		string rightContent = "<table width=100% cellpadding=1 cellspacing=1 border=0>";

		string pwrBg = darkRed; string pwrLbl = "OFF";
		if (state.lcd_power) { pwrBg = darkGreen; pwrLbl = "ON"; }
		
		rightContent = rightContent + "<tr><td bgcolor=" + innerBg + " height=28><table width=100% border=0 cellspacing=1 cellpadding=0><tr>";
		rightContent = rightContent + "<td width=60% align=center><font size=1 color=" + lightGrey + ">PWR LCD</font></td>";
		rightContent = rightContent + "<td bgcolor=" + pwrBg + " align=center><a href='live://property/lcd_power_toggle'><b><font color=" + whiteColor + " size=1>" + pwrLbl + "</font></b></a></td>";
		rightContent = rightContent + "</tr></table></td></tr>";

		// LOAD TEMPLATE BUTTON
		rightContent = rightContent + "<tr><td height=5></td></tr>";
		rightContent = rightContent + "<tr><td align=center bgcolor=" + darkBlue + " height=28><a href='live://property/lcd_open_template'><b><font color=" + whiteColor + " size=2>TEMPLATE</font></b></a></td></tr>";

		// BRIGHTNESS
		float brVal = state.lcd_brightness;
		string brStr = (string)((int)brVal) + "." + (string)((int)(brVal * 10.0f) % 10);
		string brIncIcon = "assets/na_07.png"; if (brVal >= 30.0f) brIncIcon = "assets/na_09.png";
		string brDecIcon = "assets/na_08.png"; if (brVal <= 0.0f)  brDecIcon = "assets/na_10.png";

		rightContent = rightContent + "<tr><td height=10></td></tr>";
		rightContent = rightContent + "<tr><td bgcolor=" + innerBg + " align=center height=20><font size=1 color=" + lightGrey + ">BRIGHTNESS</font></td></tr>";
		rightContent = rightContent + "<tr><td align=center bgcolor=" + darkestGrey + " height=36>";
		rightContent = rightContent + "<table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		rightContent = rightContent + "<td align=center width=30%>";
		if (brVal > 0.0f) rightContent = rightContent + "<a href='live://property/lcd_br_dec'><img src='" + brDecIcon + "' width=18 height=18></a>";
		else rightContent = rightContent + "<img src='" + brDecIcon + "' width=18 height=18>";
		rightContent = rightContent + "</td><td align=center width=40%><b><font color=" + whiteColor + " size=2>" + brStr + "</font></b></td>";
		rightContent = rightContent + "<td align=center width=30%>";
		if (brVal < 30.0f) rightContent = rightContent + "<a href='live://property/lcd_br_inc'><img src='" + brIncIcon + "' width=18 height=18></a>";
		else rightContent = rightContent + "<img src='" + brIncIcon + "' width=18 height=18>";
		rightContent = rightContent + "</td></tr></table></td></tr>";

		rightContent = rightContent + "<tr><td height=10></td></tr>";
		rightContent = rightContent + "<tr><td bgcolor=" + innerBg + " align=center height=20><font size=1 color=" + lightGrey + ">AUTO SWAP</font></td></tr>";
		rightContent = rightContent + "<tr><td align=center bgcolor=" + darkestGrey + " height=22><b><font color=" + whiteColor + " size=1>Doing: Pg " + (string)(state.lcd_active_page_idx + 1) + "</font></b></td></tr>";
		rightContent = rightContent + "<tr><td align=center bgcolor=" + darkestGrey + " height=28>";
		rightContent = rightContent + "<table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		rightContent = rightContent + "<td align=center width=30%><a href='live://property/lcd_swap_period_dec'><img src='assets/na_08.png' width=16 height=16></a></td>";
		rightContent = rightContent + "<td align=center width=40%><b><font color=" + whiteColor + " size=1>" + (string)((int)state.lcd_swap_period) + "s</font></b></td>";
		rightContent = rightContent + "<td align=center width=30%><a href='live://property/lcd_swap_period_inc'><img src='assets/na_07.png' width=16 height=16></a></td>";
		rightContent = rightContent + "</tr></table></td></tr>";

		rightContent = rightContent + "<tr><td height=10></td></tr>";
		rightContent = rightContent + "<tr><td><table width=100% border=0 cellspacing=1 cellpadding=0><tr>";
		rightContent = rightContent + "<td width=50% align=center bgcolor=" + GetThemeColor(state, "orange") + " height=28><a href='live://property/lcd_clear_all'><b><font color=" + whiteColor + " size=1>CLR ALL</font></b></a></td>";
		rightContent = rightContent + "<td width=50% align=center bgcolor=" + GetThemeColor(state, "orange") + " height=28><a href='live://property/lcd_clear_current'><b><font color=" + whiteColor + " size=1>CLR P" + (string)(state.lcd_edit_page_idx + 1) + "</font></b></a></td>";
		rightContent = rightContent + "</tr></table></td></tr>";

		// APPLY BUTTON (Icon Only, centered green)
		rightContent = rightContent + "<tr><td height=10></td></tr>";
		rightContent = rightContent + "<tr><td align=center bgcolor=" + darkGreen + " height=45 valign=middle>";
		rightContent = rightContent + "<a href='live://property/lcd_apply_manual_config'><center><img src='assets/na_20.png' width=32 height=32></center></a></td></tr>";

		rightContent = rightContent + "</table>";
		content = content + rightContent + "</td></tr></table></td></tr>";

		content = content + "</table>";

		return content;
	}

	// ------------------------------------------------------------------
	// LCD SUB-PAGE 1: ANNOUNCEMENT SYSTEM
	// ------------------------------------------------------------------
	public string GetAnnouncementPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		bool isModal = state.is_lcd_modal_open;
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");
		string headBlue = GetThemeColor(state, "headBlue"); if (isModal) headBlue = GetThemeColor(state, "modalHeadBlue");
		string darkGreen = GetThemeColor(state, "darkGreen"); if (isModal) darkGreen = GetThemeColor(state, "modalDarkGreen");
		string mainBg = GetThemeColor(state, "darkerGrey"); string titleBg = headBlue;

		// --- Mode Row (Manual / Auto) ---
		string maBg = darkGreen; string maTxt = whiteColor; // Manual = active green
		string auBg = GetThemeColor(state, "inactiveBg"); string auTxt = GetThemeColor(state, "inactiveTxt"); // Auto  = inactive
		if (state.ann_mode == 1) {
			maBg = GetThemeColor(state, "inactiveBg"); maTxt = GetThemeColor(state, "inactiveTxt");
			auBg = GetThemeColor(state, "amber"); auTxt = GetThemeColor(state, "white"); // amber when auto
		}
		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + titleBg + "><td colspan=4 align=center><b><font color=" + whiteColor + ">" + state.GetText("ANN_MODE") + "</font></b></td></tr>";
		content = content + "<tr>";
		content = content + "<td width=50% align=center bgcolor=" + maBg + " height=32><a href='live://property/ann_set_manual'><b><font color=" + maTxt + ">" + state.GetText("ANN_MANUAL") + "</font></b></a></td>";
		content = content + "<td width=50% align=center bgcolor=" + auBg + " height=32><a href='live://property/ann_set_auto'><b><font color=" + auTxt + ">" + state.GetText("ANN_AUTO") + "</font></b></a></td>";
		content = content + "</tr></table>";
		content = content + "<table width=455 height=4 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";

		// --- Sound Language Row ---
		string[] sLangLabels = new string[4]; string[] sLangIDs = new string[4];
		sLangLabels[0] = "EN"; sLangLabels[1] = "TH"; sLangLabels[2] = "JP"; sLangLabels[3] = "ZH";
		sLangIDs[0] = "ann_slang_0"; sLangIDs[1] = "ann_slang_1"; sLangIDs[2] = "ann_slang_2"; sLangIDs[3] = "ann_slang_3";
		content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "innerBg") + " cellpadding=1 cellspacing=1 border=0><tr>";
		content = content + "<td width=35% height=28><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">&nbsp;" + state.GetText("ANN_SOUND_LANG") + "</font></td>";
		int li;
		for (li = 0; li < 4; li++) {
			string lBg = GetThemeColor(state, "inactiveBg"); string lTxt = GetThemeColor(state, "inactiveTxt");
			if (state.ann_sound_lang == li) { lBg = GetThemeColor(state, "headBlue"); lTxt = GetThemeColor(state, "white"); }
			content = content + "<td width=16% align=center bgcolor=" + lBg + "><a href='live://property/" + sLangIDs[li] + "'><b><font color=" + lTxt + ">" + sLangLabels[li] + "</font></b></a></td>";
		}
		content = content + "</tr></table>";
		content = content + "<table width=455 height=4 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";

		// --- Content: MANUAL or AUTO ---
		if (state.ann_mode == 0) {
			// MANUAL: Show announcement selector as button grid (2 columns)
			// ---- SELECTED indicator bar ----
			string selectedLabel = state.GetText("ANN_NONE");
			if (state.ann_active_id >= 1 and state.ann_active_id <= 12) {
				string[] annKeys2 = new string[13];
				annKeys2[0]="ANN_NONE"; annKeys2[1]="ANN_01"; annKeys2[2]="ANN_02"; annKeys2[3]="ANN_03";
				annKeys2[4]="ANN_04";  annKeys2[5]="ANN_05"; annKeys2[6]="ANN_06"; annKeys2[7]="ANN_07";
				annKeys2[8]="ANN_08";  annKeys2[9]="ANN_09"; annKeys2[10]="ANN_10"; annKeys2[11]="ANN_11";
				annKeys2[12]="ANN_12";
				selectedLabel = (string)state.ann_active_id + ". " + state.GetText(annKeys2[state.ann_active_id]);
			}
			content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "darkestGrey") + " cellpadding=2 cellspacing=1 border=0>";
			content = content + "<tr bgcolor=" + GetThemeColor(state, "darkGreenBg") + "><td width=120><font size=1 color=" + GetThemeColor(state, "mediumGrey") + ">&nbsp;" + state.GetText("ANN_SELECT") + "</font></td>";
			content = content + "<td align=center bgcolor=" + GetThemeColor(state, "headBlue") + "><font color=" + GetThemeColor(state, "yellow") + "><b>" + selectedLabel + "</b></font></td></tr>";
			content = content + "</table>";
			content = content + "<table width=455 height=4 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";

			// ---- 2-Column Button Grid (items 1-12, plus "None" row) ----
			string[] annKeys = new string[13];
			annKeys[0]="ANN_NONE"; annKeys[1]="ANN_01"; annKeys[2]="ANN_02"; annKeys[3]="ANN_03";
			annKeys[4]="ANN_04";   annKeys[5]="ANN_05"; annKeys[6]="ANN_06"; annKeys[7]="ANN_07";
			annKeys[8]="ANN_08";   annKeys[9]="ANN_09"; annKeys[10]="ANN_10"; annKeys[11]="ANN_11";
			annKeys[12]="ANN_12";

			content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "darkestGrey") + " cellpadding=1 cellspacing=1 border=0>";

			// Row 0: "-- No Announcement --" spanning full width
			string none_bg = GetThemeColor(state, "innerBg"); string none_txt = GetThemeColor(state, "mediumGrey");
			if (state.ann_active_id == 0) { none_bg = GetThemeColor(state, "headBlue"); none_txt = GetThemeColor(state, "yellow"); }
			content = content + "<tr><td colspan=2 align=center height=26 bgcolor=" + none_bg + ">";
			content = content + "<a href='live://property/ann_sel_0'><i><font color=" + none_txt + "> -- " + state.GetText("ANN_NONE") + " -- </font></i></a>";
			content = content + "</td></tr>";

			// Rows 1-12 in pairs (col A = odd, col B = even)
			int ai;
			for (ai = 1; ai <= 11; ai = ai + 2) {
				int aiB = ai + 1;
				// Col A
				string bgA = GetThemeColor(state, "innerBg"); string fgA = GetThemeColor(state, "lightGrey");
				if (state.ann_active_id == ai) { bgA = GetThemeColor(state, "headBlue"); fgA = GetThemeColor(state, "yellow"); }
				string labelA = (string)ai + ". " + state.GetText(annKeys[ai]);
				// Col B
				string bgB = GetThemeColor(state, "innerBg"); string fgB = GetThemeColor(state, "lightGrey");
				if (state.ann_active_id == aiB) { bgB = GetThemeColor(state, "headBlue"); fgB = GetThemeColor(state, "yellow"); }
				string labelB = ""; if (aiB <= 12) labelB = (string)aiB + ". " + state.GetText(annKeys[aiB]);

				content = content + "<tr>";
				content = content + "<td width=50% height=28 bgcolor=" + bgA + ">";
				content = content + "<a href='live://property/ann_sel_" + (string)ai + "'><font size=1 color=" + fgA + ">&nbsp;" + labelA + "</font></a>";
				content = content + "</td>";
				if (aiB <= 12) {
					content = content + "<td width=50% height=28 bgcolor=" + bgB + ">";
					content = content + "<a href='live://property/ann_sel_" + (string)aiB + "'><font size=1 color=" + fgB + ">&nbsp;" + labelB + "</font></a>";
					content = content + "</td>";
				} else {
					content = content + "<td width=50% bgcolor=" + GetThemeColor(state, "darkestGrey") + "></td>";
				}
				content = content + "</tr>";
			}
			content = content + "</table>";


			// --- TIME-BASED NEXT STOP SUGGESTION ---
			if (state.ann_svc_idx >= 0 and state.ann_next_stop >= 0 and state.ann_next_stop_name != "") {
				content = content + "<table width=455 height=4 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";
				content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "darkestGrey") + " cellpadding=2 cellspacing=1 border=0>";
				content = content + "<tr bgcolor=" + GetThemeColor(state, "darkGreenBg") + "><td colspan=3 align=center><b><font size=1 color=" + GetThemeColor(state, "brightGreen") + ">&#9650; NEXT STOP (TIME-BASED)</font></b></td></tr>";
				content = content + "<tr bgcolor=" + GetThemeColor(state, "darkerGreen") + "><td width=10 align=center><font color=" + GetThemeColor(state, "brightGreen") + " size=1>&#9654;</font></td>";
				content = content + "<td><font color=" + GetThemeColor(state, "brightGreen") + "><b>&nbsp;" + state.ann_next_stop_name + "</b></font></td>";
				content = content + "<td width=80 align=center bgcolor=" + GetThemeColor(state, "darkBlue") + "><a href='live://property/ann_sched_play'><font size=1 color=" + GetThemeColor(state, "white") + "><b>PLAY ANN</b></font></a></td></tr>";
				content = content + "</table>";
			}

			// Play / Stop button row

			string playBg = GetThemeColor(state, "darkBlue"); string playLabel = state.GetText("ANN_PLAY"); string playLink = "ann_play";
			if (state.ann_playing) { playBg = GetThemeColor(state, "darkRed"); playLabel = state.GetText("ANN_STOP"); playLink = "ann_stop"; }
			bool canPlay = (state.ann_active_id > 0);
			content = content + "<table width=455 height=4 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";
			content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "darkestGrey") + " cellpadding=2 cellspacing=1 border=0><tr>";
			if (canPlay) {
				content = content + "<td align=center bgcolor=" + playBg + " height=36><a href='live://property/" + playLink + "'><b><font size=3>" + playLabel + "</font></b></a></td>";
			} else {
				content = content + "<td align=center bgcolor=" + GetThemeColor(state, "darkerGrey") + " height=36><font color=" + GetThemeColor(state, "mediumGrey") + ">" + state.GetText("ANN_IDLE") + "</font></td>";
			}
			content = content + "</tr></table>";

		} else {
			// AUTO: Show scanner result
			content = content + "<table width=455 bgcolor=" + mainBg + " cellpadding=3 cellspacing=1 border=0>";
			content = content + "<tr bgcolor=" + titleBg + "><td colspan=2 align=center><b><font color=" + whiteColor + ">" + state.GetText("ANN_SCAN_STATUS") + "</font></b></td></tr>";

			// SCAN MODE toggle (Station Match / All Objects)
			string sm0Bg = GetThemeColor(state, "darkGreen"); string sm0Txt = GetThemeColor(state, "white");
			string sm1Bg = GetThemeColor(state, "mediumGrey"); string sm1Txt = GetThemeColor(state, "mediumGrey");
			if (state.ann_scan_mode == 1) { sm0Bg = GetThemeColor(state, "mediumGrey"); sm0Txt = GetThemeColor(state, "mediumGrey"); sm1Bg = GetThemeColor(state, "headBlue"); sm1Txt = GetThemeColor(state, "white"); }
			content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "innerBg") + " cellpadding=1 cellspacing=1 border=0><tr>";
			content = content + "<td width=40% height=26><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">&nbsp;Scan Mode</font></td>";
			content = content + "<td width=30% align=center bgcolor=" + sm0Bg + "><a href='live://property/ann_scan_mode_0'><font size=1 color=" + sm0Txt + "><b>Station Match</b></font></a></td>";
			content = content + "<td width=30% align=center bgcolor=" + sm1Bg + "><a href='live://property/ann_scan_mode_1'><font size=1 color=" + sm1Txt + "><b>All Objects</b></font></a></td>";
			content = content + "</tr></table>";
			content = content + "<table width=455 height=4 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";

			// SCAN RESULT: Station Match (primary highlight)
			string scanResultStr = "<font color=" + GetThemeColor(state, "mediumGrey") + ">" + state.GetText("ANN_SCANNING") + "</font>";
			string scanDistStr = "--";
			if (state.ann_scan_dist >= 0.0f) {
				if (state.ann_scan_result != "") {
					int distI = (int)state.ann_scan_dist;
					scanDistStr = (string)distI + " m";
					scanResultStr = "<font color=" + GetThemeColor(state, "yellow") + "><b>" + state.ann_scan_result + "</b></font>";
				} else {
					scanResultStr = "<font color=" + GetThemeColor(state, "darkGrey") + ">" + state.GetText("ANN_NO_OBJECT") + "</font>";
					scanDistStr = "--";
				}
			}
			// Station Match result row
			string matchStr = "<font color=" + GetThemeColor(state, "darkGrey") + ">--</font>";
			string matchDistStr = "--";
			if (state.ann_scan_matched != "") {
				int mDistI = (int)state.ann_scan_match_dist;
				matchStr = "<font color=" + GetThemeColor(state, "brightGreen") + "><b>" + state.ann_scan_matched + "</b></font>";
				matchDistStr = (string)mDistI + " m";
			}

			content = content + "<tr><td width=40% height=28><font color=" + GetThemeColor(state, "lightGrey") + ">&nbsp;" + state.GetText("ANN_FOUND") + "</font></td><td>" + scanResultStr + "</td></tr>";
			content = content + "<tr><td height=28><font color=" + GetThemeColor(state, "lightGrey") + ">&nbsp;" + state.GetText("ANN_DIST") + "</font></td><td><font color=" + GetThemeColor(state, "white") + ">" + scanDistStr + "</font></td></tr>";
			content = content + "</table>";

			// Scan Log section (last 5 ANN entries from system log)
			content = content + "<table width=455 height=4 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";
			content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "darkestGrey") + " cellpadding=2 cellspacing=1 border=0>";
			content = content + "<tr bgcolor=" + GetThemeColor(state, "mediumGrey") + "><td colspan=2 align=center><b><font size=1 color=" + GetThemeColor(state, "white") + ">" + state.GetText("ANN_SCAN_LOG") + "</font></b></td></tr>";

			// Scan through system_logs for ANN-tagged entries (last 5)
			int totalLogs = 0; if (state.system_logs) totalLogs = state.system_logs.CountTags();
			int shown = 0; int si;
			for (si = totalLogs - 1; si >= 0 and shown < 5; si--) {
				string entry = state.system_logs.GetNamedTag((string)si);
				// Log format: time|vehicle|type_text|type_code|message
				string[] parts = Str.Tokens(entry, "|");
				if (parts.size() >= 5 and parts[3] == "ANN") {
					string logTime = parts[0]; string logMsg = parts[4];
					content = content + "<tr><td width=70><font size=1 color=" + GetThemeColor(state, "mediumGrey") + ">" + logTime + "</font></td><td><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">" + logMsg + "</font></td></tr>";
					shown++;
				}
			}
			if (shown == 0) {
				content = content + "<tr><td colspan=2 align=center><font size=1 color=" + GetThemeColor(state, "darkGrey") + ">-- " + state.GetText("ANN_NO_OBJECT") + " --</font></td></tr>";
			}
			content = content + "</table>";
		}

		return content;
	}


	public string GetLCDTemplateModalContent(CNR_State_GenCoach state) {
		string content = "<table width=410 bgcolor=" + GetThemeColor(state, "innerBg") + " cellpadding=2 cellspacing=1 border=0>";
		
		string[] trains = new string[8];
		trains[0] = "009"; trains[1] = "010"; trains[2] = "023"; trains[3] = "024";
		trains[4] = "025"; trains[5] = "026"; trains[6] = "031"; trains[7] = "032";
		
		int i;
		for (i = 0; i < 8; i = i + 2) {
			content = content + "<tr>";
			
			// Highlight currently selected template
			string bgLeft = GetThemeColor(state, "mediumGrey"); if (state.pending_template_id == trains[i]) bgLeft = GetThemeColor(state, "headBlue");
			string bgRight = GetThemeColor(state, "mediumGrey"); if (state.pending_template_id == trains[i+1]) bgRight = GetThemeColor(state, "headBlue");

			content = content + "<td width=50% bgcolor=" + bgLeft + " align=center height=40><a href='live://property/lcd_select_template_" + trains[i] + "'><b><font color=" + GetThemeColor(state, "white") + " size=2>TRAIN " + trains[i] + "</font></b></a></td>";
			content = content + "<td width=50% bgcolor=" + bgRight + " align=center height=40><a href='live://property/lcd_select_template_" + trains[i+1] + "'><b><font color=" + GetThemeColor(state, "white") + " size=2>TRAIN " + trains[i+1] + "</font></b></a></td>";
			content = content + "</tr>";
		}
		
		content = content + "<tr><td colspan=2 height=10></td></tr>";
		content = content + "</table>";
		
		// Bottom Action Buttons (APPLY and CANCEL)
		string btnTable = "<table width=410 border=0 cellpadding=0 cellspacing=0><tr>";
		
		// Confirm button (Green)
		btnTable = btnTable + "<td width=50% align=center valign=middle bgcolor=#005500 height=45>";
		btnTable = btnTable + "<a href='live://property/lcd_template_confirm'><table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		btnTable = btnTable + "<td width=20%></td><td align=center><img src='assets/na_20.png' width=32 height=32></td><td width=20%></td>";
		btnTable = btnTable + "</tr></table></a></td>";
		
		// Cancel button (Red)
		btnTable = btnTable + "<td width=50% align=center valign=middle bgcolor=#880000 height=45>";
		btnTable = btnTable + "<a href='live://property/lcd_modal_cancel_edit'><table width=100% border=0 cellspacing=0 cellpadding=0><tr>";
		btnTable = btnTable + "<td width=20%></td><td align=center><img src='assets/na_11.png' width=32 height=32></td><td width=20%></td>";
		btnTable = btnTable + "</tr></table></a></td>";
		
		btnTable = btnTable + "</tr></table>";

		return RenderModalWindow("SELECT TRAIN TEMPLATE", content + btnTable, 410);
	}
	
	public string GetCarNumberingModalContent(CNR_State_GenCoach state, Vehicle owner) {
		string content = "<table width=410 bgcolor=" + GetThemeColor(state, "innerBg") + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr><td colspan=2 align=center bgcolor=#111111 height=25><font size=1 color=#AAAAAA>" + state.GetText("SELECT_COACH_CTRL") + "</font></td></tr>";
		content = content + "<tr><td colspan=2 align=center bgcolor=#111111><center><table cellpadding=1 cellspacing=1 border=0 align=center><tr>";
		
		int totalCars = 0;
		Train myTrain = owner.GetMyTrain();
		if (myTrain) totalCars = myTrain.GetVehicles().size();
		
		int i;
		for (i = 0; i < totalCars; i++) {
			if (!state.lcdForceZeroSelection) state.lcdForceZeroSelection = Constructors.NewSoup();
			int selState = state.lcdForceZeroSelection.GetNamedTagAsInt((string)i, 0);
			string btnColor = "#008800"; // Green = Normal
			if (selState == 1) btnColor = "#884400"; // Orange/Brown = Skip (000)
			
			content = content + "<td width=22 bgcolor=" + btnColor + " align=center height=22><a href='live://property/toggle_lcd_force_zero_" + (string)i + "'>" + (string)(i+1) + "</a></td>";
			if ((i + 1) % 13 == 0 and i < totalCars - 1) content = content + "</tr><tr>";
		}
		content = content + "</tr></table></center></td></tr>";
		content = content + "<tr><td colspan=2 height=10></td></tr>";
		content = content + "</table>";
		
		// Bottom Action Buttons (APPLY and CANCEL)
		string btnTable = "<table width=410 border=0 cellpadding=0 cellspacing=0><tr>";
		btnTable = btnTable + "<td width=50% align=center valign=middle bgcolor=#005500 height=45>";
		btnTable = btnTable + "<a href='live://property/car_numbering_apply'><center><img src='assets/na_20.png' width=32 height=32></center></a>";
		btnTable = btnTable + "</td>";
		btnTable = btnTable + "<td width=50% align=center valign=middle bgcolor=#880000 height=45>";
		btnTable = btnTable + "<a href='live://property/car_numbering_cancel'><center><img src='assets/na_11.png' width=32 height=32></center></a>";
		btnTable = btnTable + "</td></tr></table>";

		return RenderModalWindow("CAR NUMBERING CONFIG", content + btnTable, 410);
	}


	// ------------------------------------------------------------------
	// ------------------------------------------------------------------
	// LCD PAGE ROUTER
	// ------------------------------------------------------------------
	public string GetLCDPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		if (state.lcd_subpage == 0) state.lcd_subpage = 2; // Default to LCD Config highlighting

		string[] bg = new string[2];
		string[] txt = new string[2];
		int i;
		for (i = 0; i < 2; i++) {
			bg[i] = GetThemeColor(state, "mediumGrey"); if (state.is_lcd_modal_open) bg[i] = GetThemeColor(state, "innerBg");
			txt[i] = GetThemeColor(state, "lightGrey"); if (state.is_lcd_modal_open) txt[i] = GetThemeColor(state, "mediumGrey");
		}
		
		// Index logic: 0 is Config (was index 1), 1 is Announce (was index 0)
		int configIdx = 0;
		int annIdx = 1;
		
		if (state.lcd_subpage == 2) { // Config
			bg[configIdx] = GetThemeColor(state, "headBlue"); if (state.is_lcd_modal_open) bg[configIdx] = GetThemeColor(state, "modalHeadBlue");
			txt[configIdx] = GetThemeColor(state, "white"); if (state.is_lcd_modal_open) txt[configIdx] = GetThemeColor(state, "mediumGrey");
		} else if (state.lcd_subpage == 1) { // Announce
			bg[annIdx] = GetThemeColor(state, "headBlue"); if (state.is_lcd_modal_open) bg[annIdx] = GetThemeColor(state, "modalHeadBlue");
			txt[annIdx] = GetThemeColor(state, "white"); if (state.is_lcd_modal_open) txt[annIdx] = GetThemeColor(state, "mediumGrey");
		}

		string subTabs = "<table width=455 cellpadding=0 cellspacing=0 border=0><tr>";
		
		// Tab 1: LCD Config
		subTabs = subTabs + "<td width=50% bgcolor=" + bg[configIdx] + " height=35><table width=100% border=0 cellspacing=0 cellpadding=0><tr><td align=center>";
		if (!state.is_lcd_modal_open) subTabs = subTabs + "<a href='live://property/lcd_subpage_2'><b><font color=" + txt[configIdx] + ">" + state.GetText("LCD_TAB_CONFIG") + "</font></b></a>";
		else subTabs = subTabs + "<b><font color=" + txt[configIdx] + ">" + state.GetText("LCD_TAB_CONFIG") + "</font></b>";
		subTabs = subTabs + "</td></tr></table></td>";

		// Tab 2: Announcement
		subTabs = subTabs + "<td width=50% bgcolor=" + bg[annIdx] + " height=35><table width=100% border=0 cellspacing=0 cellpadding=0><tr><td align=center>";
		if (!state.is_lcd_modal_open) subTabs = subTabs + "<a href='live://property/lcd_subpage_1'><b><font color=" + txt[annIdx] + ">" + state.GetText("LCD_TAB_ANNOUNCE") + "</font></b></a>";
		else subTabs = subTabs + "<b><font color=" + txt[annIdx] + ">" + state.GetText("LCD_TAB_ANNOUNCE") + "</font></b>";
		subTabs = subTabs + "</td></tr></table></td>";
		
		subTabs = subTabs + "</tr></table><table width=455 height=8 cellpadding=0 cellspacing=0 border=0><tr><td>&nbsp;</td></tr></table>";

		if (state.lcd_subpage == 1) return subTabs + GetAnnouncementPageHTML(state, owner);
		return subTabs + GetLCDConfigPageHTML(state, owner);
	}

};
