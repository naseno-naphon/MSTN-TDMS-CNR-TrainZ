/* +===============================================================================================================================+ */
/* |                                                                                                                               | */
/* |  MSTN PRODUCTION - Copyright 2024-2026 All rights reserved. Made by MSTN Team.                                                | */
/* +===============================================================================================================================+ */

// =====================================================================
// cnr_dmi.gs
// DMI (Driver Machine Interface) - Display Module (SHARED)
// CONTAINS: Theme, Helpers, Boot Sequences, Modals, Navigation, Router
// Page-specific HTML is in cnr_dmi_page_*.gs files.
// =====================================================================

include "gs.gs"
include "cnr_state.gs"
include "cnr_systems.gs"

class CNR_DMI_Display {
	public string GetThemeColor(CNR_State_GenCoach state, string type) {
		bool dimmed = (state.is_lcd_modal_open or state.modal_mode != 0);
		if (type == "mainBg") { if (dimmed) return "#111111"; return "#222222"; }
		if (type == "titleBg") { if (dimmed) return "#152E44"; return "#23486A"; }
		if (type == "white") { if (dimmed) return "#888888"; return "#FFFFFF"; }
		if (type == "yellow") { if (dimmed) return "#665500"; return "#EBD302"; }
		if (type == "headBlue") { if (dimmed) return "#152E44"; return "#23486A"; }
		if (type == "headGold") { if (dimmed) return "#664B01"; return "#C49102"; }
		if (type == "headGrey") { if (dimmed) return "#1A1A1A"; return "#333333"; }
		if (type == "green") { if (dimmed) return "#107B06"; return "#21FC0D"; }
		if (type == "red") { if (dimmed) return "#7B0000"; return "#FF0000"; }
		if (type == "orange") { if (dimmed) return "#7B5600"; return "#FFB200"; }
		if (type == "grey") { if (dimmed) return "#222222"; return "#444444"; }
		if (type == "darkGrey") { if (dimmed) return "#0D0D0D"; return "#1A1A1A"; }
		if (type == "darkerGrey") { if (dimmed) return "#111111"; return "#222222"; }
		if (type == "lightGrey") { if (dimmed) return "#555555"; return "#AAAAAA"; }
		if (type == "mediumGrey") { if (dimmed) return "#444444"; return "#888888"; }
		if (type == "darkestGrey") { if (dimmed) return "#050505"; return "#111111"; }
		if (type == "orangeTitle") { if (dimmed) return "#6B4F01"; return "#C49102"; }
		if (type == "darkRed") { if (dimmed) return "#440000"; return "#880000"; }
		if (type == "black") { if (dimmed) return "#000000"; return "#000000"; }
		if (type == "innerBg") { if (dimmed) return "#0D0D0D"; return "#1A1A1A"; }
		if (type == "lcdBg") { if (dimmed) return "#070B11"; return "#0F1722"; }
		if (type == "darkBlue") { if (dimmed) return "#002233"; return "#004466"; }
		if (type == "darkGreen") { if (dimmed) return "#003300"; return "#006600"; }
		if (type == "darkGreenBg") { if (dimmed) return "#0D1D0D"; return "#1A3A1A"; }
		if (type == "brightGreen") { if (dimmed) return "#107B06"; return "#21FC0D"; }
		if (type == "darkerGreen") { if (dimmed) return "#001A00"; return "#003300"; }
		if (type == "modalHeadBlue") { return "#152E44"; }
		if (type == "darkBlueBg") { if (dimmed) return "#0D1822"; return "#1A2E41"; }
		if (type == "fadedDarkBlueBg") { return "#0D1822"; }
		if (type == "modalBg") { return "#080808"; }
		if (type == "modalDarkGreen") { return "#002200"; }
		if (type == "amber") { if (dimmed) return "#534500"; return "#A68B00"; }
		if (type == "modalAmber") { return "#534500"; }
		if (type == "inactiveBg") { if (dimmed) return "#1A1A1A"; return "#333333"; }
		if (type == "inactiveTxt") { if (dimmed) return "#666666"; return "#AAAAAA"; }
		if (type == "modalWhite") { return "#444444"; }
		return "#000000";
	}
	
	// ------------------------------------------------------------------
	// ADVANCED VIEW TABLE (called from GetDescriptionHTML in gen_coach)
	// ------------------------------------------------------------------
	public string GetAdvancedViewTable(CNR_State_GenCoach state, Vehicle owner) {
		if (!owner.GetMyTrain()) return "";
		string table = "<table cellspacing=1 cellpadding=2 border=0 bgcolor=#555555>";
		table = table + "<tr bgcolor=#23486A><td><b>No.</b></td><td><b>" + state.GetText("CAR") + "</b></td><td><b>BP<br>bar</b></td><td><b>MR</b></td><td><b>BC<br>bar</b></td><td><b>" + state.GetText("LOAD") + " %</b></td><td><b>" + state.GetText("AC") + "</b></td><td><b>" + state.GetText("R_DR") + " (L/R)</b></td><td><b>Interlock</b></td><td><b>Lamp</b></td><td><b>Event (A/C)</b></td><td width=100><b>" + state.GetText("BACK") + " Reset</b></td></tr>";
		
		Vehicle[] vehicles = owner.GetMyTrain().GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			Vehicle v = vehicles[i];
			Soup s = v.GetProperties(); // Call once per vehicle
			
			string bgColor = "#222222";
			if (i % 2 != 0) bgColor = "#111111";
			if (v == owner) bgColor = "#444444";
			
			float bp = 98101.7 * (v.GetEngineParam("brake-pipe-pressure") - 0.00103341);
			float bc = 98101.7 * (v.GetEngineParam("brake-cylinder-pressure") - 0.00103341);
			float mr = 0.0f;

			if (s) mr = s.GetNamedTagAsFloat("script_mr_press", 0.0f);

			string coachName = v.GetLocalisedName();
			string[] tokens = Str.Tokens(coachName, "|");
			if (tokens.size() > 0) coachName = tokens[tokens.size() - 1];
			string[] dashTokens = Str.Tokens(coachName, "-");
			if (dashTokens.size() > 0) coachName = dashTokens[0];

			int bp_i = (int)(bp / 10.0); string bp_s = (string)(bp_i / 10) + "." + (string)(bp_i % 10);
			int bc_i = (int)(bc / 10.0); string bc_s = (string)(bc_i / 10) + "." + (string)(bc_i % 10);
			
			string load = "0%"; string airState = state.GetText("OFFLINE"); string doors = state.GetText("CLOSED") + " / " + state.GetText("CLOSED");
			string interlock = state.GetText("OFFLINE"); string lamp = state.GetText("OFFLINE"); string events = "0 / 0";

			if (s and s.GetNamedTagAsBool("isMSTN", false)) {
				lamp = "OFF"; if (s.GetNamedTagAsBool("toggleSigLamp")) lamp = "ON";
				
				string aircon_desc = "<font color='#888888'>OFF</font>";
				int acS = s.GetNamedTagAsInt("airconState");
				if (acS == 1) aircon_desc = "<font color='#EBD302'>STARTING</font>";
				else if (acS == 2) aircon_desc = "<font color='#21FC0D'>COOLING</font>";
				else if (acS == 3) aircon_desc = "<font color='#FF4444'>STOPPING</font>";
				else if (acS == 4) aircon_desc = "<font color='#FFB200'>CUTOFF</font>";
				airState = aircon_desc;

				string toilet_desc = "<font color='#888888'>IDLE</font>";
				int tS = s.GetNamedTagAsInt("toiletState");
				if (tS == 1) toilet_desc = "<font color='#EBD302'>STARTING</font>";
				else if (tS == 2) toilet_desc = "<font color='#00FFFF'>FLUSHING</font>";
				else if (tS == 3) toilet_desc = "<font color='#FF4444'>STOPPING</font>";
				else if (tS == 4) toilet_desc = "<font color='#B388FF'>COOLDOWN</font>";

				bool dir = v.GetDirectionRelativeToTrain();
				bool dL_phys = s.GetNamedTagAsBool("doorLeftReal");
				bool dR_phys = s.GetNamedTagAsBool("doorRightReal");
				
				string doorL = "C"; string doorR = "C";
				bool trainLeft = dL_phys; bool trainRight = dR_phys;
				if (!dir) { trainLeft = dR_phys; trainRight = dL_phys; }
				
				if (trainLeft) doorL = "O";
				if (trainRight) doorR = "O";
				
				doors = doorL + " / " + doorR;
				interlock = "NO"; if (s.GetNamedTagAsBool("doorInterlock")) interlock = "YES";
				
				if (s.GetNamedTagAsInt("MSTN_Type", -1) == 1) {
					load = (string)(int)s.GetNamedTagAsFloat("Eloaded") + "%";
					events = aircon_desc + " / GEN";
				} else {
					if (s.GetNamedTagAsBool("engineStats")) load = "100%"; else load = "0%";
					events = aircon_desc + " / " + toilet_desc;
				}
			}
			
			table = table + "<tr bgcolor=" + bgColor + ">";
			table = table + "<td>" + (string)(i + 1) + "</td>";
			table = table + "<td>" + coachName + "</td>";
			int mr_i = (int)(mr * 10.0f); string mr_s = (string)(mr_i / 10) + "." + (string)(mr_i % 10);
			string mrDisp = mr_s; if (mr < 6.0f and mr > 0.1f) mrDisp = "<font color='#FF0000'>" + mr_s + "</font>";
			
			table = table + "<td>" + bp_s + "</td>";
			table = table + "<td>" + mrDisp + "</td>";
			table = table + "<td>" + bc_s + "</td>";
			table = table + "<td>" + load + "</td>";
			table = table + "<td>" + airState + "</td>";
			table = table + "<td>" + doors + "</td>";
			table = table + "<td>" + interlock + "</td>";
			table = table + "<td>" + lamp + "</td>";
			table = table + "<td>" + events + "</td>";

			string resetStatus = state.GetText("BACK");
			int rState = state.resetBrakeStates.GetNamedTagAsInt((string)i, 0);
			if (rState == 1) resetStatus = "<font color='#ebd302'>Resetting...</font>";
			else if (rState == 2) resetStatus = "<font color='#21fc0d'>Done</font>";
			else resetStatus = "<b><a href=live://property/resetBrake_" + (string)i + ">" + state.GetText("BACK") + "</a></b>";

			table = table + "<td width=100>" + resetStatus + "</td>";
			table = table + "</tr>";
		}
		table = table + "</table>";
		return table;
	}

	// ------------------------------------------------------------------
	// NATIVE PROPERTIES WINDOW (Description HTML)
	// ------------------------------------------------------------------
	public string GetDescriptionHTML(CNR_State_GenCoach state, Vehicle owner, bool isVerify) {
		string html = "<html><body>";
		html = html + "<table bgcolor=#3B6790><tr bgcolor=#23486A><td width=100%><b>APVC Coach - " + state.GetText("CAR") + "</b></td></tr></table>";

		if (isVerify) {
			string m_SignalLamp = "AUTO";
			if (state.signal_lamp_mode == 1) m_SignalLamp = "ON";
			else if (state.signal_lamp_mode == 2) m_SignalLamp = "OFF";
			string m_PassengerDoorLeft = HTMLWindow.CheckBox("live://property/toggleDoorLeft", state.m_PSGdoorleft);
			string m_PassengerDoorRight = HTMLWindow.CheckBox("live://property/toggleDoorRight", state.m_PSGdoorright);
			string m_SeatType;
			if (state.m_intSeatCoachType == 0) m_SeatType = "Day";
			else if (state.m_intSeatCoachType == 1) m_SeatType = "Night";
			else m_SeatType = "Automatic";
			string m_toggleDoorInterlock = HTMLWindow.CheckBox("live://property/state.toggleDoorInterlock", state.toggleDoorInterlock); 


			string highPlatformMessage;
			if(state.m_PSGdoorleft){
				if(!state.togglePlatform) 	highPlatformMessage = " -> (Lower Platform : <b><font color='#FF0000'>X</font></b>)</p>";
				else					highPlatformMessage = " -> (Lower Platform : <b><font color='#00ff00'>/</font></b>)</p>";
			}
			else if(state.m_PSGdoorright){
				if(!state.togglePlatform)		highPlatformMessage = " -> (Lower Platform : <b><font color='#FF0000'>X</font></b>)</p>";
				else					highPlatformMessage = " -> (Lower Platform : <b><font color='#00ff00'>/</font></b>)</p>";
			}
			else						highPlatformMessage = " -> (Lower Platform : " + HTMLWindow.CheckBox("live://property/state.togglePlatform", state.togglePlatform) + ")</p>";

			// NOTE: Generator & Fuel controls moved to DMI (Power Tab)
			html = html + "<br>";
			html = html + "<table bgcolor=#000000D0 cellpadding=0 cellspacing=0 border=0><tr height=1><td width=100%></td></tr></table>";
			html = html + "<table width=100%> <tr bgcolor=#23486A><td width=100%><b>General Systems</b></td></tr> </table>";
			html = html + "<table><tr><td width=100%>";
			html = html + "<p>? Signal Lamp : " + m_SignalLamp + "</p>";
			html = html + "<p>? " + state.GetText("LEFT_DOORS") + " : " + m_PassengerDoorLeft + " | " + state.GetText("RIGHT_DOORS") + " "  + m_PassengerDoorRight + " -> " + highPlatformMessage + "</p>";
			html = html + "<p>? Coach Seat Type : <a href=live://property/toggleTypeSeatCoach><b>" + m_SeatType + "</b></a></p>";
			html = html + "<p>? Door Interlock : " + HTMLWindow.CheckBox("live://property/state.toggleDoorInterlock", state.toggleDoorInterlock) + "</p>";
			html = html + "</td></tr></table><br>";
			
			html = html + "<table bgcolor=#000000D0 cellpadding=0 cellspacing=0 border=0><tr height=1><td width=100%></td></tr></table>";
			html = html + "<table width=100%><tr bgcolor=#23486A><td width=100%><b>Status Monitor (DMI)</b></td></tr></table>";
			html = html + "<p align=center><a href=live://property/open_dmi><table width=300 bgcolor=#3B6790 cellpadding=2 cellspacing=0 border=0><tr><td align=center height=38><font size=4 color=#FFFFFF><b>&gt;&gt; Open DMI Screen</b></font></td></tr></table></a></p>";
			html = html + "<p align=center><a href=live://property/reset_dmi><font size=2 color=#AAAAAA>Reset DMI System (Fix frozen screen)</font></a></p><br>";
			html = html + "<table bgcolor=#000000D0 cellpadding=0 cellspacing=0 border=0><tr height=1><td width=100%></td></tr></table>";
			html = html + "<p align=left><font size=2><b>Advanced View Detail</b> - <a href=live://property/toggleAdvancedView>Click to [Show / Hide]</a></font></p>";
			if (state.showAdvancedView) {
				html = html + GetAdvancedViewTable(state, owner);
			}
			html = html + "<br>";
		}
		else {
			html = html + "<p><font color='#ff0000'>Authentication Failed</font></p>";
		}

		html = html + "<table bgcolor=#000000D0 cellpadding=0 cellspacing=0 border=0><tr height=1><td width=100%></td></tr></table>";
		html = html + "<table><tr bgcolor=#23486A><td width=100% align=center><p>Function Script by Naphon W.<br>Modelling and Textures by Voravit L.</p><p><font size=5><b>Made by MSTN Production</b></font></p></td></tr></table>";
		html = html + "</body></html>";
		return html;
	}

	string FormatFloat2(float val) {
		int iv = (int)(val * 100.0f);
		int whole = iv / 100;
		int dec = iv % 100;
		string sd = (string)dec;
		if (dec < 10) sd = "0" + sd;
		return (string)whole + "." + sd;
	}

	public string RenderModalWindow(string title, string content, int width) {
		string outerBorder = "#000000";
		string winBorder = "#555555";
		string winHeader = "#23486A";
		string winBg = "#111111";

		// Outer 10px border using a table wrapper
		string html = "<table width=" + (string)(width + 20) + " bgcolor=" + outerBorder + " cellpadding=10 cellspacing=0 border=0><tr><td>";
		html = html + "<table width=" + (string)width + " bgcolor=" + winBorder + " cellpadding=1 cellspacing=0 border=0><tr><td>";
		html = html + "<table width=100% bgcolor=" + winBg + " cellpadding=2 cellspacing=1 border=0>";
		html = html + "<tr bgcolor=" + winHeader + "><td align=center height=35 valign=middle><b><font color=#FFFFFF size=4>" + title + "</font></b></td></tr>";
		html = html + "<tr><td align=center>" + content + "</td></tr>";
		html = html + "</table></td></tr></table>";
		html = html + "</td></tr></table>";

		return html;
	}

	// ------------------------------------------------------------------
	// LCD MODAL CONTENT GENERATOR
	// ------------------------------------------------------------------
	public string GetLCDModalContent(CNR_State_GenCoach state) {
		string modal = "";
		if (state.modal_mode == 1 or state.modal_mode == 2) { // Origin or Destination
			string title = state.GetText("TRN_ORIGIN"); if (state.modal_mode == 2) title = state.GetText("TRN_DEST");
			string[] bgs = new string[7]; int val = state.lcd_origin; if (state.modal_mode == 2) val = state.lcd_dest;
			int iter; for(iter=0;iter<7;iter++){ if (val == iter) bgs[iter] = GetThemeColor(state, "darkGreen"); else bgs[iter] = GetThemeColor(state, "darkerGrey"); }
			string pref = "lcd_sel_orig_"; if (state.modal_mode == 2) pref = "lcd_sel_dest_";
			
			string table = "<table width=100% cellpadding=2 cellspacing=1 border=0>";
			table = table + "<tr><td align=center bgcolor=" + bgs[0] + "><a href='live://property/" + pref + "0'>" + state.GetText("BANGKOK") + "</a></td><td align=center bgcolor=" + bgs[1] + "><a href='live://property/" + pref + "1'>" + state.GetText("CHIANG_MAI") + "</a></td><td align=center bgcolor=" + bgs[2] + "><a href='live://property/" + pref + "2'>" + state.GetText("UBON_RAT") + "</a></td><td align=center bgcolor=" + bgs[3] + "><a href='live://property/" + pref + "3'>" + state.GetText("NONG_KHAI") + "</a></td></tr>";
			table = table + "<tr><td align=center bgcolor=" + bgs[4] + "><a href='live://property/" + pref + "4'>" + state.GetText("VTE") + "</a></td><td align=center bgcolor=" + bgs[5] + "><a href='live://property/" + pref + "5'>" + state.GetText("HAT_YAI") + "</a></td><td align=center bgcolor=" + bgs[6] + "><a href='live://property/" + pref + "6'>" + state.GetText("PHUKET") + "</a></td><td bgcolor=" + GetThemeColor(state, "darkerGrey") + "></td></tr>";
			table = table + "<tr><td colspan=4 height=15></td></tr>";
			table = table + "<tr><td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkGreen") + " height=45><a href='live://property/lcd_apply'><img src='assets/na_20.png' width=35 height=35></a></td><td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkRed") + " height=45><a href='live://property/lcd_cancel'><img src='assets/na_11.png' width=35 height=35></a></td></tr>";
			table = table + "</table>";
			return RenderModalWindow(title, table, 400);

		} else if (state.modal_mode == 3) { // Variant
			string t0Bg = GetThemeColor(state, "darkerGrey"); string t1Bg = GetThemeColor(state, "darkerGrey");
			if (state.lcd_train_idx == 0) t0Bg = GetThemeColor(state, "darkGreen"); else t1Bg = GetThemeColor(state, "darkGreen");
			
			string table = "<table width=100% cellpadding=2 cellspacing=1 border=0>";
			table = table + "<tr><td width=50% align=center bgcolor=" + t0Bg + " height=60><a href='live://property/lcd_sel_train_0'><b>Variant 1</b><br><font size=1>(E.g. No.9)</font></a></td><td width=50% align=center bgcolor=" + t1Bg + " height=60><a href='live://property/lcd_sel_train_1'><b>Variant 2</b><br><font size=1>(E.g. No.5)</font></a></td></tr>";
			table = table + "<tr><td colspan=2 height=15></td></tr>";
			table = table + "<tr><td align=center bgcolor=" + GetThemeColor(state, "darkGreen") + " height=45><a href='live://property/lcd_apply'><img src='assets/na_20.png' width=35 height=35></a></td><td align=center bgcolor=" + GetThemeColor(state, "darkRed") + " height=45><a href='live://property/lcd_cancel'><img src='assets/na_11.png' width=35 height=35></a></td></tr>";
			table = table + "</table>";
			return RenderModalWindow(state.GetText("SELECT_VARIANT"), table, 400);

		} else if (state.modal_mode == 4) { // Signage Override
			// Grid mapping: 
			// index -1: Normal
			// index 14: Blank
			// index 15: Factory
			
			int[] modes = new int[4];
			modes[0] = -1; modes[1] = 14; modes[2] = 15; modes[3] = 16;
			
			string[] labels = new string[4];
			labels[0] = state.GetText("SIGN_MODE_NORMAL");
			labels[1] = state.GetText("SIGN_MODE_OFF");
			labels[2] = state.GetText("SIGN_MODE_FACTORY");
			labels[3] = state.GetText("SIGN_MODE_MANUAL");
			
			string[] bgs = new string[4];
			int iter; 
			for(iter=0; iter<4; iter++) { 
				if (state.lcd_override_id == modes[iter]) bgs[iter] = GetThemeColor(state, "darkGreen"); else bgs[iter] = GetThemeColor(state, "darkerGrey"); 
			}

			string table = "<table width=100% cellpadding=2 cellspacing=1 border=0>";
			table = table + "<tr>";
			table = table + "<td align=center bgcolor=" + bgs[0] + " height=60><a href='live://property/lcd_sel_mode_-1'><b>" + labels[0] + "</b></a></td>";
			table = table + "<td align=center bgcolor=" + bgs[1] + " height=60><a href='live://property/lcd_sel_mode_14'><b>" + labels[1] + "</b></a></td>";
			table = table + "<td align=center bgcolor=" + bgs[2] + " height=60><a href='live://property/lcd_sel_mode_15'><b>" + labels[2] + "</b></a></td>";
			table = table + "<td align=center bgcolor=" + bgs[3] + " height=60><a href='live://property/lcd_sel_mode_16'><b>" + labels[3] + "</b></a></td>";
			table = table + "</tr>";
			
			table = table + "<tr><td colspan=4 height=15></td></tr>";
			table = table + "<tr><td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkGreen") + " height=45><a href='live://property/lcd_apply'><img src='assets/na_20.png' width=35 height=35></a></td><td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkRed") + " height=45><a href='live://property/lcd_cancel'><img src='assets/na_11.png' width=35 height=35></a></td></tr>";
			table = table + "</table>";
			return RenderModalWindow(state.GetText("FORCE_BLANK_OPTS"), table, 400);

		} else if (state.modal_mode == 5) { // Swap
			string table = "<table width=100% cellpadding=2 cellspacing=1 border=0>";
			table = table + "<tr><td align=center height=60><font size=3>" + state.GetText("SWAP_MSG") + "</font></td></tr>";
			table = table + "<tr><td height=10></td></tr>";
			table = table + "<tr><td><table width=100% cellpadding=0 cellspacing=0 border=0><tr><td width=50% align=center bgcolor=" + GetThemeColor(state, "darkGreen") + " height=45><a href='live://property/lcd_swap_confirm'><img src='assets/na_20.png' width=35 height=35></a></td><td width=50% align=center bgcolor=" + GetThemeColor(state, "darkRed") + " height=45><a href='live://property/lcd_swap_cancel'><img src='assets/na_11.png' width=35 height=35></a></td></tr></table></td></tr>";
			table = table + "</table>";
			return RenderModalWindow(state.GetText("CONFIRM_SWAP"), table, 400);
		}
		return "";
	}

	public string GetNavigationTabsHTML(CNR_State_GenCoach state) {
		int i;
		bool isPowerOn = (state.dmi_power_state == 3);
		
		string cNavBg = "#0A1628"; // Bar Backdrop (Black/Navy)
		string cTabGrey = "#999999"; // The "Raised" grey bar color
		string cHomeBlue = "#3B6790"; // Home Button Blue
		
		int btnW = 54; int btnH = 54;
		int homeW = 110; // Wide Home button
		
		string tabs = "<table width=770 height=60 bgcolor=" + cNavBg + " cellpadding=0 cellspacing=0 border=0><tr>";
		tabs = tabs + "<td width=10></td>"; 
		
		// The "Raised" Grey Bar Container (Dips down at the end)
		// Icon group (4-5 icons)
		string iconBar = "<table cellpadding=2 cellspacing=2 border=0 bgcolor=" + cTabGrey + "><tr>";
		
		string[] pageIcons = new string[5]; 
		pageIcons[0] = "assets/na_18.png"; // Up Arrow
		pageIcons[1] = "assets/nav/remedy_text.png"; // Help/Question
		pageIcons[2] = "assets/nav/fault_overview.png"; // Sound
		pageIcons[3] = "assets/nav/train_power_supply_1.png"; // Brightness
		pageIcons[4] = ""; // Home (special case)

		for (i = 0; i < 4; i++) {
			string label = "<img src='" + pageIcons[i] + "' width=48 height=48>";
			string link = "monitor_page_" + (string)(i+1); // Dummy links for now or use real ones
			if (isPowerOn) label = "<a href='live://property/" + link + "'>" + label + "</a>";
			iconBar = iconBar + "<td bgcolor=#333333 width=" + (string)btnW + " height=" + (string)btnH + " align=center valign=middle border=2 bordercolor=#FFFFFF>" + label + "</td>";
		}
		
		// HOME BUTTON (Rightmost in group)
		string homeBtn = "<td bgcolor=" + cHomeBlue + " width=" + (string)homeW + " height=" + (string)btnH + " align=center valign=middle border=2 bordercolor=#FFFFFF>";
		homeBtn = homeBtn + "<a href='live://property/monitor_page_0'><font size=4 color=#FFFFFF><b>Home</b></font></a></td>";
		
		iconBar = iconBar + homeBtn + "</tr></table>";

		// ASSEMBLY: Left Spaced Bar
		tabs = tabs + "<td align=left valign=middle>" + iconBar + "</td>";
		
		// The "Notch" (Empty space to the right where the grey bar ends)
		tabs = tabs + "<td width=350 bgcolor=" + cNavBg + "></td>"; 
		tabs = tabs + "</tr></table>";
		return tabs;
	}

	public string GetLogoBootHTML() {
		// Centered logo with alpha support (png on black background)
		return "<table width=750 height=400 bgcolor=#000000 cellpadding=0 cellspacing=0 border=0><tr><td align=center valign=middle><img src='assets/logo.png' width=380 height=380></td></tr></table>";
	}

	public string GetLoadingBootHTML(CNR_State_GenCoach state) {
		float elapsed = World.GetTimeElapsed() - state.dmi_boot_timer;
		if (elapsed > 3.0f) elapsed = 3.0f;
		float progress = elapsed / 3.0f;
		
		string content = "<table width=750 height=400 bgcolor=#000000 cellpadding=0 cellspacing=0 border=0>";
		content = content + "<tr><td align=center valign=middle height=300><img src='assets/logo.png' width=300 height=300></td></tr>";
		content = content + "<tr><td align=center valign=top height=100>";
		content = content + "<font color=#FFFFFF size=2>Loading System Resources...</font><br><br>";
		content = content + "<trainz-object type='progress' progress='" + (string)progress + "' width='380' height='20' color='#21FC0D'></trainz-object>";
		content = content + "</td></tr></table>";
		return content;
	}

	public string GetTerminalBootHTML(CNR_State_GenCoach state, Vehicle owner) {
		float elapsed = World.GetTimeElapsed() - state.dmi_boot_timer;
		if (elapsed > 8.0f) elapsed = 8.0f; 

		int totalLines = 26;
		string[] lines = new string[totalLines];
		lines[0] = "MSTN DMI ARM-BIOS v2.8.1 (Build 2026-03-20)";
		lines[1] = "CPU: MSTN ARM Cortex-R82 Dual @ 1.60GHz";
		lines[2] = "Memory: 2048MB LPDDR4X ECC Test: 2048MB OK";
		lines[3] = "GPU: MSTN Embedded Mali-G52 (VRAM 1024MB)";
		lines[4] = "--------------------------------------------";
		lines[5] = "Initializing Hardware Abstraction Layer...";
		lines[6] = "Detecting Peripheral Devices...";
		lines[7] = "  - COM1: Serial Port Detected";
		lines[8] = "  - COM2: HST Network Interface Detected";
		lines[9] = "  - USB: MSTN Input Hub Detected";
		lines[10] = "Loading Kernel: /boot/mstn_rtk_arm64.bin... [DONE]";
		lines[11] = "Switching to Secure Monitor (EL3)... [OK]";
		lines[12] = "Scanning Train Network (HST-CAN BUS)...";
		
		int vCount = 0; if (owner.GetMyTrain()) vCount = owner.GetMyTrain().GetVehicles().size();
		lines[13] = "  - Detected " + (string)vCount + " Vehicles on HST-CAN";
		lines[14] = "  - Link Quality: 99.8% (Signal Strong)";
		lines[15] = "Checking Engine Status...";
		
		string e1S = "Standby"; if (state.m_EngineStats1) e1S = "Online";
		string e1R = "NO"; if (state.engine1_ready) e1R = "YES";
		lines[16] = "  - ENG1: " + e1S + " / Ready: " + e1R;
		
		string e2S = "Standby"; if (state.m_EngineStats2) e2S = "Online";
		string e2R = "NO"; if (state.engine2_ready) e2R = "YES";
		lines[17] = "  - ENG2: " + e2S + " / Ready: " + e2R;
		
		lines[18] = "Checking Electrical Systems...";
		lines[19] = "  - HEP Bus Voltage: " + (string)(int)state.gen_V_AC + "V AC";
		lines[20] = "  - DC Battery Bank: " + (string)(int)state.gen_V_DC + "V DC";
		
		string relayS = "Open"; if (state.loadElectrical) relayS = "Closed";
		lines[21] = "  - Load Relay: " + relayS;
		lines[22] = "Initializing GUI Subsystem...";
		lines[23] = "  - Loading MSTN_CNR_Design_System...";
		lines[24] = "Mounting File Systems... [OK]";
		lines[25] = "System Ready. Launching MSTN DMI Overview...";

		// Realistic non-linear timing (stutter/pause effect)
		int numToShow = 0;
		float t = elapsed;
		if (t < 0.8f) numToShow = (int)(t * 10.0f); // Fast start
		else if (t < 1.3f) numToShow = 8; // Pause
		else if (t < 3.5f) numToShow = 8 + (int)((t - 1.3f) * 4.0f); // Medium
		else if (t < 4.2f) numToShow = 16; // Pause at Engine Check
		else if (t < 7.0f) numToShow = 16 + (int)((t - 4.2f) * 4.0f); // Finish up
		else numToShow = totalLines;

		if (numToShow > totalLines) numToShow = totalLines;
		if (numToShow < 1) numToShow = 1;

		// Limit number of lines to avoid overflow and maintain "push up" effect
		int maxVisible = 24;
		int startIdx = 0;
		if (numToShow > maxVisible) startIdx = numToShow - maxVisible;

		string content = "<table width=750 height=400 bgcolor=#000000 cellpadding=10 cellspacing=0 border=0><tr><td valign=bottom align=left><font face='courier' size=1 color=#21FC0D>";
		int i;
		for (i = startIdx; i < numToShow; i++) {
			content = content + lines[i] + "<br>";
		}
		if (numToShow < totalLines) content = content + "_"; 
		content = content + "</font></td></tr></table>";
		return content;
	}

	public string GetSharedHeaderHTML(CNR_State_GenCoach state) {
		float velocity = state.speed; if (velocity < 0.0f) velocity = -velocity;
		string speedDisp = (string)(int)velocity;
		string destText = state.ann_next_stop_name; if (destText == "") destText = "-";
		
		float gameTime = World.GetGameTime() + 0.5f; if (gameTime >= 1.0f) gameTime = gameTime - 1.0f;
		int totalSeconds = (int)(gameTime * 86400.0f);
		int hours = (totalSeconds / 3600) % 24; int minutes = (totalSeconds / 60) % 60;
		string zeroMin = ""; if (minutes < 10) zeroMin = "0";
		string timeStr = (string)hours + ":" + zeroMin + (string)minutes;

		string pwrColor = "#FF0000"; if (state.dmi_power_state > 0) pwrColor = "#21FC0D";
		string pwrBtn = "<a href='live://property/dmi_power_toggle'><table width=40 height=40 bgcolor=#1A1A1A border=1 bordercolor=" + pwrColor + "><tr><td align=center valign=middle><img src='assets/nav/power.png' width=24 height=24></td></tr></table></a>";
		
		string html = "<table width=770 height=60 bgcolor=#08101A cellpadding=4 cellspacing=0 border=0><tr>";
		html = html + "<td width=50 align=center valign=middle>" + pwrBtn + "</td>";
		html = html + "<td width=300 align=left valign=middle>&nbsp;<font size=2 color=#AAAAAA>Destination:</font><br><font size=4 color=#FFFFFF><b>" + destText + "</b></font></td>";
		html = html + "<td width=100 align=center valign=middle><font size=5 color=#FFFFFF><b>" + speedDisp + "</b></font><br><font size=1 color=#AAAAAA>km/h</font></td>";
		html = html + "<td width=100 align=right valign=middle><font size=3 color=#FFFFFF><b>" + timeStr + "</b></font><br><font size=1 color=#AAAAAA>" + (string)World.GetGameDate() + "/" + (string)World.GetGameMonth() + "</font></td>";
		html = html + "<td width=60 align=center valign=middle><a href='live://property/monitor_page_5'><table width=44 height=44 bgcolor=#CC0000 cellpadding=0 cellspacing=0 border=0><tr><td align=center valign=middle><img src='assets/nav/fault_overview.png' width=28 height=28></td></tr></table></a></td>";
		html = html + "<td width=60 align=center valign=middle><a href='live://property/monitor_page_4'><table width=44 height=44 bgcolor=#88AA00 cellpadding=0 cellspacing=0 border=0><tr><td align=center valign=middle><img src='assets/nav/remedy_text.png' width=28 height=28></td></tr></table></a></td>";
		html = html + "</tr></table>";
		return html;
	}

};

