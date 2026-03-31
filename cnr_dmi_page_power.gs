// =====================================================================
// cnr_dmi_page_power.gs
// DMI Page 1: POWER SUPPLY - Electrical, Engine & Fuel Systems
// =====================================================================

include "cnr_dmi_page_home.gs"

class CNR_DMI_PagePower isclass CNR_DMI_PageHome {

	public string GetElectricalPageHTML(CNR_State_GenCoach state, Vehicle owner) {
		string headColor = GetThemeColor(state, "headGrey");
		string mainBg = GetThemeColor(state, "mainBg");
		string whiteColor = GetThemeColor(state, "white");
		string innerBg = GetThemeColor(state, "innerBg");
		string darkGrey = GetThemeColor(state, "darkGrey");
		string lightGrey = GetThemeColor(state, "lightGrey");
		
		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=0 cellspacing=0 border=0><tr><td>";
		
		// --- SECTION 1: MAIN GENERATION HUB ---
		string loadStatus = "<font color=#FF0000>" + state.GetText("OFFLINE") + "</font>";
		if (state.loadElectrical) loadStatus = "<font color=#00FF00>" + state.GetText("ONLINE") + "</font>";
		else if (state.hep_stability_timer > 0) loadStatus = "<font color=#EBD302>" + state.GetText("STABILIZING") + "</font>";

		float freq = 50.0f;
		if (state.loadElectrical) freq = 50.0f + (Math.Rand(-2, 3) * 0.01f);
		
		content = content + "<table width=455 bgcolor=" + darkGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headColor + "><td colspan=4 align=center><font color=" + whiteColor + "><b>POWER PLANT MASTER STATUS [" + loadStatus + "]</b></font></td></tr>";
		content = content + "<tr>";
		content = content + "<td width=113 align=center bgcolor=" + innerBg + "><font size=1 color=" + lightGrey + ">" + state.GetText("GEN_TOTAL_PWR") + "</font><br><font color=#00FF00 size=4><b>" + (string)(int)state.gen_kW + "</b></font> <font size=1>kW</font></td>";
		content = content + "<td width=113 align=center bgcolor=" + innerBg + "><font size=1 color=" + lightGrey + ">" + state.GetText("GEN_TOTAL_CUR") + "</font><br><font color=#00FF00 size=4><b>" + (string)(int)state.gen_Amps + "</b></font> <font size=1>A</font></td>";
		content = content + "<td width=113 align=center bgcolor=" + innerBg + "><font size=1 color=" + lightGrey + ">" + state.GetText("VOLTAGE") + "</font><br><font size=3><b>" + (string)(int)state.gen_V_AC + "</b></font> <font size=1>V</font></td>";
		content = content + "<td width=113 align=center bgcolor=" + innerBg + "><font size=1 color=" + lightGrey + ">" + state.GetText("FREQUENCY") + "</font><br><font size=3><b>" + FormatFloat2(freq) + "</b></font> <font size=1>Hz</font></td>";
		content = content + "</tr>";
		
		// Load Bar
		float loadPerc = state.Eloaded; if (loadPerc > 100.0f) loadPerc = 100.0f;
		string loadBar = "<table cellspacing=1 cellpadding=0 border=0 height=10 width=451><tr>";
		int j;
		for (j = 0; j < 40; j++) {
			string bCol = "#111111";
			if (loadPerc / 100.0f * 40.0f >= (float)j) {
				bCol = "#00FF00"; if (loadPerc > 80.0f) bCol = "#FF0000"; else if (loadPerc > 60.0f) bCol = "#EBD302";
			}
			loadBar = loadBar + "<td bgcolor=" + bCol + "></td>";
		}
		loadBar = loadBar + "</tr></table>";
		content = content + "<tr><td colspan=4 bgcolor=#000000 height=12 align=center>" + loadBar + "</td></tr>";
		content = content + "</table>";

		content = content + "<table height=4><tr><td></td></tr></table>";

		// --- SECTION 2: POWER DISTRIBUTION GRID ---
		content = content + "<table width=455 bgcolor=" + darkGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headColor + "><td width=180><font size=1 color=" + whiteColor + ">" + state.GetText("PWR_FLOW_BUS") + "</font></td><td width=100 align=center><font size=1 color=" + whiteColor + ">STATUS</font></td><td width=85 align=right><font size=1 color=" + whiteColor + ">" + state.GetText("VOLTAGE") + "</font></td><td width=85 align=right><font size=1 color=" + whiteColor + ">" + state.GetText("CURRENT") + "</font></td></tr>";
		
		string mainStat = "<font color=#444444>OPEN</font>"; if (state.loadElectrical) mainStat = "<font color=#00FF00>MASTER</font>";
		content = content + "<tr><td bgcolor=" + innerBg + "><b>" + state.GetText("BUS_MAIN") + "</b></td><td bgcolor=" + innerBg + " align=center>" + mainStat + "</td><td bgcolor=" + innerBg + " align=right>" + (string)(int)state.gen_V_AC + " V</td><td bgcolor=" + innerBg + " align=right>" + (string)(int)state.gen_Amps + " A</td></tr>";
		
		string auxStat = "<font color=#444444>STBY</font>"; if (state.loadElectrical) auxStat = "<font color=#00FF00>NORMAL</font>";
		content = content + "<tr><td bgcolor=" + innerBg + "><b>" + state.GetText("BUS_AUX") + "</b></td><td bgcolor=" + innerBg + " align=center>" + auxStat + "</td><td bgcolor=" + innerBg + " align=right>220 V</td><td bgcolor=" + innerBg + " align=right> -- </td></tr>";
		
		string batStat = "<font color=#CCCCCC>" + state.GetText("DISCHARGING") + "</font>"; if (state.gen_A_DC > 0.0f) batStat = "<font color=#00FF00>" + state.GetText("CHARGING") + "</font>";
		content = content + "<tr><td bgcolor=" + innerBg + "><b>" + state.GetText("BUS_BATT") + "</b></td><td bgcolor=" + innerBg + " align=center>" + batStat + "</td><td bgcolor=" + innerBg + " align=right>" + (string)(int)state.gen_V_DC + " V</td><td bgcolor=" + innerBg + " align=right>" + (string)(int)state.gen_A_DC + " A</td></tr>";
		
		content = content + "<tr><td bgcolor=" + innerBg + "><b>" + state.GetText("BUS_DC_24V") + "</b></td><td bgcolor=" + innerBg + " align=center><font color=#00FF00>ACTIVE</font></td><td bgcolor=" + innerBg + " align=right>" + (string)(int)state.gen_V_DC24 + " V</td><td bgcolor=" + innerBg + " align=right>" + (string)(int)state.gen_A_DC24 + " A</td></tr>";
		content = content + "</table>";

		content = content + "<table height=4><tr><td></td></tr></table>";

		// --- SECTION 3: SYSTEM PROTECTION & LOAD ANALYTICS ---
		content = content + "<table width=455 border=0 cellspacing=0 cellpadding=0><tr><td width=226 valign=top>";
		// Protection
		content = content + "<table width=100% bgcolor=" + darkGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headColor + "><td colspan=2 align=center><font size=1 color=" + whiteColor + ">PROTECTION & SAFETY</font></td></tr>";
		content = content + "<tr><td bgcolor=" + innerBg + " width=60%><font size=1>" + state.GetText("GROUND_FAULT") + "</font></td><td bgcolor=" + innerBg + " align=center><font color=#00FF00 size=1>NOMINAL</font></td></tr>";
		content = content + "<tr><td bgcolor=" + innerBg + "><font size=1>" + state.GetText("INSULATION") + "</font></td><td bgcolor=" + innerBg + " align=center><font color=#00FF00 size=1>O.K.</font></td></tr>";
		content = content + "<tr><td bgcolor=" + innerBg + "><font size=1>" + state.GetText("PWR_FACTOR") + "</font></td><td bgcolor=" + innerBg + " align=center><font size=1>0.98</font></td></tr>";
		content = content + "</table>";
		content = content + "</td><td width=3></td><td width=226 valign=top>";
		// Load Distribution
		int hvacLoad = (int)(state.gen_kW * 0.65f);
		int lgtLoad = (int)(state.gen_kW * 0.15f);
		int auxLoad = (int)(state.gen_kW * 0.20f);
		
		content = content + "<table width=100% bgcolor=" + darkGrey + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headColor + "><td colspan=2 align=center><font size=1 color=" + whiteColor + ">POWER CONSUMPTION</font></td></tr>";
		content = content + "<tr><td bgcolor=" + innerBg + " width=60%><font size=1>" + state.GetText("HVAC_LOAD") + "</font></td><td bgcolor=" + innerBg + " align=right><font size=1>" + (string)hvacLoad + " kW</font></td></tr>";
		content = content + "<tr><td bgcolor=" + innerBg + "><font size=1>" + state.GetText("LGT_LOAD") + "</font></td><td bgcolor=" + innerBg + " align=right><font size=1>" + (string)lgtLoad + " kW</font></td></tr>";
		content = content + "<tr><td bgcolor=" + innerBg + "><font size=1>" + state.GetText("AUX_LOAD") + "</font></td><td bgcolor=" + innerBg + " align=right><font size=1>" + (string)auxLoad + " kW</font></td></tr>";
		content = content + "</table>";
		content = content + "</td></tr></table>";

		// Overload Warning Overlay
		if (state.overload_97_timer > 0.0f or state.overload_100_timer > 0.0f) {
			string msg = ""; string color = "#FF0000";
			if (state.overload_100_timer > 0.0f) {
				msg = "CRITICAL OVERLOAD - TRIP IN " + (string)(60 - (int)state.overload_100_timer) + "s";
			} else {
				msg = "WARNING: HIGH LOAD - SHED IN " + (string)(30 - (int)state.overload_97_timer) + "s";
				color = "#FF6600";
			}
			content = content + "<table width=455 bgcolor=" + color + " cellpadding=2><tr><td align=center><font color=#FFFFFF size=1><b>" + msg + "</b></font></td></tr></table>";
		}

		content = content + "</td></tr></table>";
		
		return content;
	}

	public string GetEnginePageHTML(CNR_State_GenCoach state, Vehicle owner, ProductQueue fuelQ) {
		// Fuel bar (Native progress object)
		float current_fuel = 0.0f;
		if (fuelQ and fuelQ.GetQueueCount() > 0) current_fuel = (float) fuelQ.GetQueueCount();
		float max_fuel = 1500.0f;
		
		float fRatio = current_fuel / max_fuel;
		string bColor = GetThemeColor(state, "green");
		if (fRatio < 0.15f) bColor = GetThemeColor(state, "red");
		else if (fRatio < 0.40f) bColor = GetThemeColor(state, "yellow");

		string fuelBar = "<table cellspacing=1 cellpadding=0 border=0 height=30 width=440><tr>";
		int j;
		for (j = 0; j < 60; j++) {
			string bCol = GetThemeColor(state, "darkerGrey");
			if (fRatio * 60.0f >= (float)j) bCol = bColor;
			fuelBar = fuelBar + "<td bgcolor=" + bCol + " height=30><font size=1>&nbsp;</font></td>";
		}
		fuelBar = fuelBar + "</tr></table>";

		string headColor = GetThemeColor(state, "headGold");
		string mainBg = GetThemeColor(state, "mainBg");
		string innerBg = GetThemeColor(state, "innerBg");
		string whiteColor = GetThemeColor(state, "white");

		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=2 cellspacing=1 border=0>";
		content = content + "<tr bgcolor=" + headColor + "><td colspan=4 align=center><font color=" + GetThemeColor(state, "black") + "><b>" + state.GetText("FUEL_SYS") + "</b></font></td></tr>";
		content = content + "<tr bgcolor=" + innerBg + "><td colspan=4 align=center><font size=1 color=" + GetThemeColor(state, "lightGrey") + ">0L</font> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <b><font color=" + whiteColor + ">" + (string) (int) current_fuel + " L / 1500 L</font></b> (" + (string) (int) ((current_fuel / max_fuel) * 100.0f) + "%) &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; <font size=1 color=" + GetThemeColor(state, "lightGrey") + ">1500L</font></td></tr>";
		content = content + "<tr><td colspan=4 bgcolor=" + GetThemeColor(state, "darkestGrey") + " align=center height=40>" + fuelBar + "</td></tr>";
		content = content + "</table><table width=455 height=10 cellpadding=0 cellspacing=0 border=0><tr><td>&nbsp;</td></tr></table>";
		
		content = content + "<table width=455 bgcolor=" + GetThemeColor(state, "darkGrey") + " cellpadding=2 cellspacing=1 border=0>";

		// Engines 1 & 2 Status Preparation
		string e1Status = "<font color=" + GetThemeColor(state, "red") + ">" + state.GetText("STOPPED") + "</font>"; string e1Btn = "<a href='live://property/ctrl_engine1_toggle'><b><font size=3>" + state.GetText("START_ENG") + " 1</font></b></a>"; string e1Color = GetThemeColor(state, "mediumGrey");
		if (state.m_EngineStats1) {
			if (state.engine1_ready) e1Status = "<font color=" + GetThemeColor(state, "green") + ">" + state.GetText("RUNNING") + "</font>"; else e1Status = "<font color=" + GetThemeColor(state, "yellow") + ">" + state.GetText("STARTING") + "</font>";
			e1Btn = "<a href='live://property/ctrl_engine1_toggle'><b><font size=3>" + state.GetText("STOP_ENG") + " 1</font></b></a>"; e1Color = GetThemeColor(state, "darkRed");
		}
		
		string e2Status = "<font color=" + GetThemeColor(state, "red") + ">" + state.GetText("STOPPED") + "</font>"; string e2Btn = "<a href='live://property/ctrl_engine2_toggle'><b><font size=3>" + state.GetText("START_ENG") + " 2</font></b></a>"; string e2Color = GetThemeColor(state, "mediumGrey");
		if (state.m_EngineStats2) {
			if (state.engine2_ready) e2Status = "<font color=" + GetThemeColor(state, "green") + ">" + state.GetText("RUNNING") + "</font>"; else e2Status = "<font color=" + GetThemeColor(state, "yellow") + ">" + state.GetText("STARTING") + "</font>";
			e2Btn = "<a href='live://property/ctrl_engine2_toggle'><b><font size=3>" + state.GetText("STOP_ENG") + " 2</font></b></a>"; e2Color = GetThemeColor(state, "darkRed");
		}

		// OVERLOAD LOCKOUT OVERRIDE
		if (state.engine_lockout_timer > 0.0f) {
			e1Status = "<font color=" + GetThemeColor(state, "red") + ">OVERLOAD TRIP</font>";
			e2Status = "<font color=" + GetThemeColor(state, "red") + ">OVERLOAD TRIP</font>";
			string lockTxt = "BLOCKED: " + (string)((int)state.engine_lockout_timer) + "s";
			e1Btn = "<b><font size=3 color=" + GetThemeColor(state, "mediumGrey") + ">" + lockTxt + "</font></b>";
			e2Btn = "<b><font size=3 color=" + GetThemeColor(state, "mediumGrey") + ">" + lockTxt + "</font></b>";
			e1Color = GetThemeColor(state, "darkerGrey");
			e2Color = GetThemeColor(state, "darkerGrey");
		}
		int o1_i = (int) (state.eng1_oil_press * 10.0f); string o1_str = (string) (o1_i / 10) + "." + (string) (o1_i % 10);
		int o2_i = (int) (state.eng2_oil_press * 10.0f); string o2_str = (string) (o2_i / 10) + "." + (string) (o2_i % 10);

		// Engines 1 & 2 (More Detailed Layout)
		content = content + "<tr bgcolor=" + GetThemeColor(state, "orangeTitle") + "><td colspan=2 align=center><font color=" + GetThemeColor(state, "black") + "><b>" + state.GetText("ENGINE_1") + "</b></font></td><td colspan=2 align=center><font color=" + GetThemeColor(state, "black") + "><b>" + state.GetText("ENGINE_2") + "</b></font></td></tr>";
		content = content + "<tr><td colspan=2 bgcolor=" + innerBg + " align=center>" + state.GetText("STATUS") + ": " + e1Status + "</td><td colspan=2 bgcolor=" + innerBg + " align=center>" + state.GetText("STATUS") + ": " + e2Status + "</td></tr>";
		
		content = content + "<tr><td colspan=2 bgcolor=" + GetThemeColor(state, "darkerGrey") + " align=center><font color=" + whiteColor + " size=4><b>" + (string) (int) state.eng1_rpm + "</b></font> <font size=1 color=" + GetThemeColor(state, "lightGrey") + ">" + state.GetText("RPM") + "</font></td>";
		content = content + "<td colspan=2 bgcolor=" + GetThemeColor(state, "darkerGrey") + " align=center><font color=" + whiteColor + " size=4><b>" + (string) (int) state.eng2_rpm + "</b></font> <font size=1 color=" + GetThemeColor(state, "lightGrey") + ">" + state.GetText("RPM") + "</font></td></tr>";
		
		content = content + "<tr><td colspan=2 bgcolor=" + innerBg + " align=center><font color=" + GetThemeColor(state, "yellow") + ">" + (string) (int) state.eng1_temp + " &deg;C</font> | <font color=" + GetThemeColor(state, "lightGrey") + ">Oil:</font> " + o1_str + " bar</td>";
		content = content + "<td colspan=2 bgcolor=" + innerBg + " align=center><font color=" + GetThemeColor(state, "yellow") + ">" + (string) (int) state.eng2_temp + " &deg;C</font> | <font color=" + GetThemeColor(state, "lightGrey") + ">Oil:</font> " + o2_str + " bar</td></tr>";
		
		float f1 = state.eng1_fuel_flow; float f2 = state.eng2_fuel_flow;
		content = content + "<tr><td colspan=2 bgcolor=" + GetThemeColor(state, "darkerGrey") + " align=center><font size=1 color=" + GetThemeColor(state, "mediumGrey") + ">Flow: " + (string)(int)f1 + " L/h | Load: " + (string)(int)state.Eloaded + "%</font></td>";
		content = content + "<td colspan=2 bgcolor=" + GetThemeColor(state, "darkerGrey") + " align=center><font size=1 color=" + GetThemeColor(state, "mediumGrey") + ">Flow: " + (string)(int)f2 + " L/h | Load: " + (string)(int)state.Eloaded + "%</font></td></tr>";

		content = content + "<tr><td colspan=2 align=center bgcolor=" + e1Color + " height=30><center>" + e1Btn + "</center></td>";
		content = content + "<td colspan=2 align=center bgcolor=" + e2Color + " height=30><center>" + e2Btn + "</center></td></tr>";
		content = content + "</table>";
		return content;
	}

	public string GetQuickControlsHTML(CNR_State_GenCoach state) {
		string baseColor = GetThemeColor(state, "mediumGrey");
		string mainBg = GetThemeColor(state, "darkestGrey");
		if (state.is_lcd_modal_open) {
			baseColor = GetThemeColor(state, "darkerGrey");
			mainBg = GetThemeColor(state, "modalBg");
		}

		string lColor = baseColor;
		bool canConnectHEP = (state.engine1_ready or state.engine2_ready or state.toggleLoadElectrical);
		
		if (state.toggleLoadElectrical) {
			lColor = GetThemeColor(state, "darkGreen"); if (state.is_lcd_modal_open) lColor = GetThemeColor(state, "modalDarkGreen");
		} else if (!canConnectHEP) {
			lColor = mainBg;
		}
		
		string hIcon = "<img src='assets/hep_load.png' width=48 height=48>";

		// Quick Start Button logic
		string sColor = baseColor;
		bool canStart = (!state.m_EngineStats1 or !state.m_EngineStats2);
		bool isStarting = ((state.m_EngineStats1 and !state.engine1_ready) or (state.m_EngineStats2 and !state.engine2_ready));
		
		if (state.engine_lockout_timer > 0.0f) canStart = false;
		
		if (isStarting) {
			sColor = GetThemeColor(state, "amber"); if (state.is_lcd_modal_open) sColor = GetThemeColor(state, "modalAmber");
		} else if (!canStart) {
			sColor = mainBg;
		}
		
		string sIcon = "<img src='assets/engine_start.png' width=48 height=48>";

		string content = "<table width=455 bgcolor=" + mainBg + " cellpadding=0 cellspacing=1 border=0><tr>";
		
		// HEP Button
		content = content + "<td width=227 bgcolor=" + lColor + " height=62 align=center valign=middle>";
		content = content + "<table width=100% border=0 cellspacing=0 cellpadding=0><tr><td width=20%></td><td align=center>";
		if (canConnectHEP and !state.is_lcd_modal_open) content = content + "<a href='live://property/ctrl_load_toggle'>" + hIcon + "</a>";
		else content = content + hIcon;
		content = content + "</td><td width=20%></td></tr></table></td>";
		
		// Quick Start Button
		content = content + "<td width=227 bgcolor=" + sColor + " height=62 align=center valign=middle>";
		content = content + "<table width=100% border=0 cellspacing=0 cellpadding=0><tr><td width=20%></td><td align=center>";
		if (canStart and !state.is_lcd_modal_open) content = content + "<a href='live://property/ctrl_engine_quick_start'>" + sIcon + "</a>";
		else content = content + sIcon;
		content = content + "</td><td width=20%></td></tr></table></td>";

		content = content + "</tr></table><table width=455 height=5 cellpadding=0 cellspacing=0 border=0><tr><td>&nbsp;</td></tr></table>";
		return content;
	}

	public string GetPowerPageHTML(CNR_State_GenCoach state, Vehicle owner, ProductQueue fuelQ) {
		string content = "<table width=455 cellpadding=0 cellspacing=0 border=0><tr>";
		
		bool isModal = state.is_lcd_modal_open;
		string whiteColor = GetThemeColor(state, "white"); if (isModal) whiteColor = GetThemeColor(state, "modalWhite");
		string headBlue = GetThemeColor(state, "headBlue"); if (isModal) headBlue = GetThemeColor(state, "modalHeadBlue");
		
		string eBg = GetThemeColor(state, "mediumGrey"); string nBg = GetThemeColor(state, "mediumGrey");
		string eTxt = GetThemeColor(state, "lightGrey"); string nTxt = GetThemeColor(state, "lightGrey");
		if (state.monitor_power_subpage == 0) { eBg = headBlue; eTxt = whiteColor; }
		else { nBg = headBlue; nTxt = whiteColor; }

		content = content + "<td width=50% bgcolor=" + eBg + " height=35><table width=100% border=0 cellspacing=0 cellpadding=0><tr><td width=15%></td><td align=center><a href='live://property/monitor_power_subpage_0'><b><font color=" + eTxt + ">Electrical</font></b></a></td><td width=15%></td></tr></table></td>";
		content = content + "<td width=50% bgcolor=" + nBg + " height=35><table width=100% border=0 cellspacing=0 cellpadding=0><tr><td width=15%></td><td align=center><a href='live://property/monitor_power_subpage_1'><b><font color=" + nTxt + ">Engine / Fuel</font></b></a></td><td width=15%></td></tr></table></td>";
		content = content + "</tr></table><table width=455 height=10 cellpadding=0 cellspacing=0 border=0><tr><td>&nbsp;</td></tr></table>";
		
		content = content + GetQuickControlsHTML(state);

		if (state.monitor_power_subpage == 0) content = content + GetElectricalPageHTML(state, owner);
		else content = content + GetEnginePageHTML(state, owner, fuelQ);

		return content;
	}

};
