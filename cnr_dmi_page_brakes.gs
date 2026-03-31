// =====================================================================
// cnr_dmi_page_brakes.gs
// DMI Page 3: BRAKES - Brake Monitor, Brake Controls, Park Brake
// =====================================================================

include "cnr_dmi_page_lcd.gs"

class CNR_DMI_PageBrakes isclass CNR_DMI_PageLCD {
	public string GetBrakesMonitorPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		bool isModal = state.is_lcd_modal_open;
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");
		string headBlue = GetThemeColor(state, "headBlue"); if (isModal) headBlue = GetThemeColor(state, "modalHeadBlue");
		string mainBg = GetThemeColor(state, "darkerGrey"); string titleBg = headBlue; string valColor = GetThemeColor(state, "yellow");

		float bp = 98101.7 * (owner.GetEngineParam("brake-pipe-pressure") - 0.00103341);
		float bc = 98101.7 * (owner.GetEngineParam("brake-cylinder-pressure") - 0.00103341);
		float mr = state.script_mr_press;
		float cr = state.script_cr_press;

		int bp_i = (int)(bp / 10.0f); string bp_s = (string)(bp_i / 10) + "." + (string)(bp_i % 10);
		int bc_i = (int)(bc / 10.0f); string bc_s = (string)(bc_i / 10) + "." + (string)(bc_i % 10);
		int mr_i = (int)(mr * 10.0f); string mr_s = (string)(mr_i / 10) + "." + (string)(mr_i % 10);
		int cr_i = (int)(cr * 10.0f); string cr_s = (string)(cr_i / 10) + "." + (string)(cr_i % 10);
		int decel_i = (int)(state.deceleration_ms2 * 1000.0f);
		int decel_abs = decel_i; if (decel_abs < 0) decel_abs = -decel_abs;
		int decel_frac = decel_abs % 1000;
		string decel_frac_s;
		if (decel_frac < 10) decel_frac_s = "00" + (string)decel_frac;
		else if (decel_frac < 100) decel_frac_s = "0" + (string)decel_frac;
		else decel_frac_s = (string)decel_frac;
		string decel_s = (string)(decel_abs / 1000) + "." + decel_frac_s;
		if (state.deceleration_ms2 >= 0.0f) decel_s = "+" + decel_s;
		else decel_s = "-" + decel_s;

		string bpStateStr = "REL"; string bpStateColor = GetThemeColor(state, "green");
		if (state.brake_pipe_state == 1) { bpStateStr = "INITIAL"; bpStateColor = GetThemeColor(state, "yellow"); }
		else if (state.brake_pipe_state == 2) { bpStateStr = "SERVICE"; bpStateColor = GetThemeColor(state, "yellow"); }
		else if (state.brake_pipe_state == 3) { bpStateStr = "FULL SERV"; bpStateColor = GetThemeColor(state, "orange"); }
		else if (state.brake_pipe_state == 4) { bpStateStr = "EMG"; bpStateColor = GetThemeColor(state, "red"); }

		string mrColor = valColor; if (state.alert_low_mr_active) mrColor = GetThemeColor(state, "red");
		string tempColor = valColor; if (state.alert_crit_temp_active) tempColor = GetThemeColor(state, "red"); else if (state.alert_high_temp_active) tempColor = GetThemeColor(state, "orange");

		string comp1Str = "<font color='" + GetThemeColor(state, "mediumGrey") + "'>OFF</font>";
		if (state.mr_comp1_state == 1) comp1Str = "<font color='" + GetThemeColor(state, "yellow") + "'>START</font>";
		else if (state.mr_comp1_state == 2) comp1Str = "<font color='" + GetThemeColor(state, "green") + "'>RUN</font>";
		else if (state.mr_comp1_state == 3) comp1Str = "<font color='" + GetThemeColor(state, "red") + "'>STOP</font>";

		string comp2Str = "<font color='" + GetThemeColor(state, "mediumGrey") + "'>OFF</font>";
		if (state.mr_comp2_state == 1) comp2Str = "<font color='" + GetThemeColor(state, "yellow") + "'>START</font>";
		else if (state.mr_comp2_state == 2) comp2Str = "<font color='" + GetThemeColor(state, "green") + "'>RUN</font>";
		else if (state.mr_comp2_state == 3) comp2Str = "<font color='" + GetThemeColor(state, "red") + "'>STOP</font>";

		string wspStr = "<font color='" + GetThemeColor(state, "grey") + "'>INACTIVE</font>";
		if (state.wsp_active) wspStr = "<font color='" + GetThemeColor(state, "red") + "'><b>ACTIVE (VENTING)</b></font>";

		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + titleBg + "><td colspan=4 align=center><b><font color=" + whiteColor + ">" + state.GetText("BRAKES") + "</font></b></td></tr>";
		
		// Row 1: BP, BC, MR, CR
		content = content + "<tr>";
		content = content + "<td width=25% align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>BP</b><br><font color=" + valColor + " size=4>" + bp_s + "</font> bar</td>";
		content = content + "<td width=25% align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>BC</b><br><font color=" + valColor + " size=4>" + bc_s + "</font> bar</td>";
		content = content + "<td width=25% align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>MR</b><br><font color=" + mrColor + " size=4>" + mr_s + "</font> bar</td>";
		content = content + "<td width=25% align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>CR</b><br><font color=" + valColor + " size=4>" + cr_s + "</font> bar</td>";
		content = content + "</tr>";

		// Row 2: Decel, Temp, BP State
		content = content + "<tr>";
		content = content + "<td align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>" + state.GetText("DECEL_RATE") + "</b><br><font color=" + GetThemeColor(state, "green") + " size=4>" + decel_s + "</font> m/s²</td>";
		content = content + "<td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>Disc Temp</b><br><font color=" + tempColor + " size=4>" + (int)state.disc_temp + " &deg;C</font></td>";
		content = content + "<td align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>Dist. Valve</b><br><font color=" + bpStateColor + " size=4>" + bpStateStr + "</font></td>";
		
		float v_ms = state.speed / 3.6f;
		if (v_ms < 0.0f) v_ms = -v_ms; // Treat reversing as positive distance

		float dt = state.last_speed_time - state.last_eval_time;
		if (state.last_eval_time == 0.0f or dt < 0.0f or dt > 5.0f) dt = 0.0f; // Prevent huge jumps or uninitialized state
		state.last_eval_time = state.last_speed_time;
		
		state.odo_total = state.odo_total + (v_ms * dt);
		if (bc > 150.0f and v_ms > 0.05f) {
			if (!state.is_braking_test) {
				state.is_braking_test = true;
				state.brake_start_odo = state.odo_total;
				state.brake_dist_val = 0.0f;
			} else {
				state.brake_dist_val = state.odo_total - state.brake_start_odo;
			}
		} else if (state.is_braking_test and v_ms <= 0.05f) {
			state.is_braking_test = true;
		} else if (v_ms > 0.05f and bc <= 150.0f) {
			state.is_braking_test = false;
		}
		
		int odo_i = (int)state.odo_total; string odo_s = (string)odo_i + "." + (string)(int)((state.odo_total - odo_i) * 10);
		int brk_i = (int)state.brake_dist_val; string brk_dist_s = (string)brk_i + "." + (string)(int)((state.brake_dist_val - brk_i) * 10);
		content = content + "</tr><tr>";
		content = content + "<td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>Trailer ODO</b><br><font color=" + valColor + " size=4>" + odo_s + " m</font></td>";
		content = content + "<td colspan=2 align=center bgcolor=" + GetThemeColor(state, "darkGrey") + "><b>Braking Dist.</b><br><font color=" + valColor + " size=4>" + brk_dist_s + " m</font></td>";
		content = content + "</tr>";

		// Row 3: Compressor & WSP Status
		content = content + "<tr><td colspan=2 bgcolor=" + GetThemeColor(state, "darkGrey") + " align=center height=30><b>Comp 1:</b> " + comp1Str + " &nbsp; <b>Comp 2:</b> " + comp2Str + "</td>";
		content = content + "<td colspan=2 bgcolor=" + GetThemeColor(state, "darkGrey") + " align=center height=30><b>WSP System:</b> " + wspStr + "</td></tr>";
		content = content + "</table><table width=455 height=5 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>";

		// Physical Specs (Detailed Thai)
		content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "darkestGrey") + " cellpadding=3 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + GetThemeColor(state, "darkerGrey") + "><td colspan=2 align=center><b><font color=" + whiteColor + " size=2>" + state.GetText("BRAKE_SYS_MODEL") + "</font></b></td></tr>";
		content = content + "<tr><td colspan=2 align=center><font color=" + valColor + "><b>" + state.GetText("BRAKE_MODEL_NAME") + "</b></font></td></tr>";
		content = content + "<tr><td width=30%><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">Valve Type:</font></td><td><font size=1>" + state.GetText("KE_VALVE") + "</font></td></tr>";
		content = content + "<tr><td><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">Mechanism:</font></td><td><font size=1>" + state.GetText("DISC_BRAKE") + "</font></td></tr>";
		content = content + "<tr><td><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">Cylinders:</font></td><td><font size=1>" + state.GetText("BRAKE_CYL_8X8") + "</font></td></tr>";
		content = content + "<tr><td colspan=2><font size=1 color=" + GetThemeColor(state, "mediumGrey") + ">" + state.GetText("BRAKE_DESC_1") + "<br>" + state.GetText("BRAKE_DESC_2") + "</font></td></tr>";
		content = content + "</table>";

		return content;
	}

	public string GetBrakesControlPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		string headColor = "#23486A";
		string mainBg = "#222222";
		if (state.is_lcd_modal_open) {
			headColor = "#152E44";
			mainBg = "#111111";
		}
		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headColor + "><td colspan=2 align=center><b><font color=#FFFFFF>" + state.GetText("RESET_BRAKE") + "</font></b></td></tr>";
		
		int totalCars = 0;
		Train myTrain = owner.GetMyTrain();
		if (myTrain) totalCars = myTrain.GetVehicles().size();

		content = content + "<tr><td colspan=2 align=center bgcolor=#111111 height=25><font size=1 color=#AAAAAA>" + state.GetText("SELECT_COACH_CTRL") + "</font></td></tr>";
		content = content + "<tr><td colspan=2 align=center bgcolor=#111111><center><table cellpadding=1 cellspacing=1 border=0 align=center><tr>";
		int i;
		for (i = 0; i < totalCars; i++) {
			if (!state.resetBrakeSelectionStates) state.resetBrakeSelectionStates = Constructors.NewSoup();
			if (state.resetBrakeSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) state.resetBrakeSelectionStates.SetNamedTag((string)i, 0); // default unselected
			int selState = state.resetBrakeSelectionStates.GetNamedTagAsInt((string)i, 0);
			string btnColor = "#444444"; if (selState == 1) btnColor = "#008800";
			content = content + "<td width=22 bgcolor=" + btnColor + " align=center height=22><a href='live://property/toggle_resetbrake_sel_" + (string)i + "'>" + (string)(i+1) + "</a></td>";
		}
		content = content + "</tr></table></center></td></tr>";

		content = content + "</table>";
		content = content + "<table width=455 cellpadding=0 cellspacing=0 border=0><tr><td height=10>&nbsp;</td></tr></table>";
		
		content = content + "<table width=455 bgcolor=#222222 cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr><td width=50% bgcolor=#005500 align=center height=45><a href='live://property/resetBrakeEdit_confirm'><img src='assets/na_20.png' width=35 height=35></a></td>";
		content = content + "<td width=50% bgcolor=#880000 align=center height=45><a href='live://property/monitor_brakes_subpage_0'><img src='assets/na_11.png' width=35 height=35></a></td></tr>";
		content = content + "</table>";
		
		content = content + "<table width=455 cellpadding=0 cellspacing=0 border=0><tr><td height=10>&nbsp;</td></tr></table>";
		
		content = content + "<table width=455 bgcolor=#222222 cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=#552200><td colspan=2 align=center><b><font color=#FFFFFF>" + state.GetText("PARK_BRAKE") + "</font></b></td></tr>";
		content = content + "<tr><td width=50% bgcolor=#005500 align=center height=30><a href='live://property/parkbrake_apply_sel'><b><font color=#FFFFFF>" + state.GetText("PARK_APPLY") + " (SEL)</font></b></a></td>";
		content = content + "<td width=50% bgcolor=#004400 align=center height=30><a href='live://property/parkbrake_apply_all'><b><font color=#FFFFFF>" + state.GetText("PARK_APPLY") + " (ALL)</font></b></a></td></tr>";
		content = content + "<tr><td width=50% bgcolor=#880000 align=center height=30><a href='live://property/parkbrake_release_sel'><b><font color=#FFFFFF>" + state.GetText("PARK_REL") + " (SEL)</font></b></a></td>";
		content = content + "<td width=50% bgcolor=#660000 align=center height=30><a href='live://property/parkbrake_release_all'><b><font color=#FFFFFF>" + state.GetText("PARK_REL") + " (ALL)</font></b></a></td></tr>";
		content = content + "</table>";
		return content;
	}
 
	public string GetBrakesPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		string content = "<table width=455 cellpadding=0 cellspacing=0 border=0><tr>";
		string mBg = "#333333"; string cBg = "#333333";
		string mTxt = "#AAAAAA"; string cTxt = "#AAAAAA";
		if (state.monitor_brakes_subpage == 0) { mBg = "#23486A"; mTxt = "#FFFFFF"; }
		else { cBg = "#23486A"; cTxt = "#FFFFFF"; }

		content = content + "<td width=50% bgcolor=" + mBg + " height=35><table width=100% border=0 cellspacing=0 cellpadding=0><tr><td width=15%></td><td align=center><a href='live://property/monitor_brakes_subpage_0'><b><font color=" + mTxt + ">" + state.GetText("STATUS_MONITOR") + "</font></b></a></td><td width=15%></td></tr></table></td>";
		content = content + "<td width=50% bgcolor=" + cBg + " height=35><table width=100% border=0 cellspacing=0 cellpadding=0><tr><td width=15%></td><td align=center><a href='live://property/monitor_brakes_subpage_1'><b><font color=" + cTxt + ">" + state.GetText("RESET_BRAKE") + "</font></b></a></td><td width=15%></td></tr></table></td>";
		content = content + "</tr></table><table width=455 height=10 cellpadding=0 cellspacing=0 border=0><tr><td>&nbsp;</td></tr></table>";

		if (state.monitor_brakes_subpage == 0) content = content + GetBrakesMonitorPageHTML(state, owner);
		else content = content + GetBrakesControlPageHTML(state, owner);

		return content;
	}

};
