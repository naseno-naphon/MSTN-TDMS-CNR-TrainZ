// =====================================================================
// cnr_dmi_page_home.gs
// DMI Page 0: HOME - Optimized 770x480 High-Fidelity UI
// 9-Car Grid + Consolidated Header Integration
// =====================================================================

include "cnr_dmi.gs"

class CNR_DMI_PageHome isclass CNR_DMI_Display {

	public string GetHomePageHTML(CNR_State_GenCoach state, Vehicle owner, Vehicle[] vehicles, Library scriptLib) {
		string cSteelBlue = "#2B4B63";  // Main Panel Bg
		string cBlack     = "#000000";  // Data Table Container
		string cCrewBlue  = "#154C79";  // Sub-Header Gradient Start
		string cGreyBar   = "#999999";  // Label Bar Grey
		string cCapsule   = "#3B6790";  // Train Diagram Blue
		string cWhite     = "#FFFFFF";
		string cBlackTxt  = "#000000";
		
		int totalCars = vehicles.size();
		int maxCars = 9;
		int startIdx = state.monitor_home_page * maxCars;
		if (startIdx >= totalCars) { state.monitor_home_page = 0; startIdx = 0; }
		
		// 1. SUB-HEADER (Crew - Home)
		string subHdr = "<table width=770 height=26 bgcolor=" + cCrewBlue + " cellpadding=4 cellspacing=0 border=0><tr>";
		subHdr = subHdr + "<td align=left><font size=3 color=" + cWhite + "><b>Crew - Home</b></font></td>";
		subHdr = subHdr + "</tr></table>";

		// 2. MAIN LAYOUT (2 Columns: Content | Sidebar)
		string mainTable = "<table width=770 border=0 cellpadding=0 cellspacing=0><tr>";
		
		// Column 1: Main Content Section (Width 630px)
		mainTable = mainTable + "<td width=630 valign=top align=left>";
		
		// Row 1.1: [Warn Indic | Coach Indication]
		string topRow = "<table width=630 border=0 cellpadding=2 cellspacing=0><tr>";
		// A. Warn Indicators (Left)
		string warnGrid = "<table width=90 height=60 bgcolor=#333333 cellpadding=1 cellspacing=1 border=0>";
		string[] warnLabels = new string[6];
		warnLabels[0] = "EB"; warnLabels[1] = "Slip"; warnLabels[2] = "Comp"; warnLabels[3] = "PIC"; warnLabels[4] = "Load"; warnLabels[5] = "Speed";
		int w; for (w = 0; w < 3; w++) {
			warnGrid = warnGrid + "<tr height=20>";
			int c; for (c = 0; c < 2; c++) {
				int idx = w * 2 + c;
				warnGrid = warnGrid + "<td align=center valign=middle bgcolor=#1A1A1A><font size=1 color=#666666><b>" + warnLabels[idx] + "</b></font></td>";
			}
			warnGrid = warnGrid + "</tr>";
		}
		warnGrid = warnGrid + "</table>";
		topRow = topRow + "<td width=100 align=left valign=top>" + warnGrid + "</td>";
		
		// B. Coach Indication (Center)
		string prevArr = "<font color=#666666>[ < ]</font>";
		if (state.monitor_home_page > 0) prevArr = "<b><a href='live://property/monitor_home_page_prev'>[ < ]</a></b>";
		string nextArr = "<font color=#666666>[ > ]</font>";
		if (totalCars > startIdx + maxCars) nextArr = "<b><a href='live://property/monitor_home_page_next'>[ > ]</a></b>";
		
		string labelBar = "<table width=520 height=26 bgcolor=" + cGreyBar + " cellpadding=4 cellspacing=0 border=0><tr>";
		labelBar = labelBar + "<td align=left><b>Trainset No. 06</b></td><td align=right><font size=1 color=#333333>PAGE " + (string)(state.monitor_home_page + 1) + "</font> &nbsp; " + prevArr + "&nbsp; PAGE " + (string)(state.monitor_home_page + 1) + "&nbsp;" + nextArr + "</td></tr></table>";
		
		string diagram = "<table width=520 height=70 bgcolor=" + cCapsule + " cellpadding=2 cellspacing=0 border=0 style='border-radius:15px; margin-top:5px; border:2px solid #555555;'><tr>";
		int i; for (i = 0; i < 9; i++) {
			int vIdx = startIdx + i;
			string carNum = "--";
			string Lbg = "#004400"; string Rbg = "#004400"; 
			
			if (vIdx < totalCars) {
				string vn = vehicles[vIdx].GetLocalisedName();
				string[] parts = Str.Tokens(vn, "- ");
				if (parts.size() > 0) carNum = parts[parts.size()-1]; else carNum = (string)(vIdx+1);
				
				Soup s = vehicles[vIdx].GetProperties();
				if (s) {
					if (s.GetNamedTagAsBool("m_PSGdoorleft", false)) Lbg = "#FF0000"; else Lbg = "#21FC0D";
					if (s.GetNamedTagAsBool("m_PSGdoorright", false)) Rbg = "#FF0000"; else Rbg = "#21FC0D";
				}
			}
			
			string carCell = "<table width=54 height=60 border=1 bordercolor=#222222 cellpadding=0 cellspacing=0 bgcolor=#1A1A1A>";
			carCell = carCell + "<tr><td width=38 align=center valign=middle><font size=3 color=" + cWhite + "><b>" + carNum + "</b></font></td>";
			carCell = carCell + "<td width=14 valign=top><table width=14 height=60 cellpadding=2 cellspacing=0 border=0>";
			carCell = carCell + "<tr height=30><td align=center bgcolor=" + Lbg + "><font size=1 color=#000000><b>L</b></font></td></tr>";
			carCell = carCell + "<tr height=30><td align=center bgcolor=" + Rbg + "><font size=1 color=#000000><b>R</b></font></td></tr>";
			carCell = carCell + "</table></td></tr></table>";

			diagram = diagram + "<td width=57 align=center valign=middle>" + carCell + "</td>";
		}
		diagram = diagram + "</tr></table>";
		topRow = topRow + "<td width=530 valign=top align=left>" + labelBar + diagram + "</td>";
		topRow = topRow + "</tr></table>";
		
		// Row 1.2: [Data Table] (Spans left of the sidebar)
		string dataGrid = "<table align=center width=620 bgcolor=" + cBlack + " cellpadding=0 cellspacing=0 border=1 bordercolor=#444444 style='margin-top:10px;'>";
		string[] rowLabels = new string[8];
		rowLabels[0] = "VCB"; rowLabels[1] = "K"; rowLabels[2] = "BP Press"; rowLabels[3] = "BC Press"; rowLabels[4] = "MR Press"; rowLabels[5] = "Load %"; rowLabels[6] = "AC Temp"; rowLabels[7] = "WC Status";
		string[] rowUnits = new string[8];
		rowUnits[0] = "-"; rowUnits[1] = "-"; rowUnits[2] = "bar"; rowUnits[3] = "bar"; rowUnits[4] = "bar"; rowUnits[5] = "%"; rowUnits[6] = "C"; rowUnits[7] = "-";

		int r; for (r = 0; r < 8; r++) {
			dataGrid = dataGrid + "<tr height=22>";
			dataGrid = dataGrid + "<td width=100 bgcolor=#1A1A1A align=left>&nbsp;<b><font size=1 color=" + cWhite + ">" + rowLabels[r] + "</font></b></td>";
			int c; for (c = 0; c < 9; c++) {
				int vIdx = startIdx + c;
				string val = "-"; string cellBg = cBlack; string fontCol = cWhite;
				if (vIdx < totalCars) {
					Soup s = vehicles[vIdx].GetProperties();
					if (s) {
						if (r == 0) { bool vcb = s.GetNamedTagAsBool("vcb_connected", false); if (vcb) { val = "ON"; cellBg = cWhite; fontCol = cBlackTxt; } }
						else if (r == 1) { bool k = s.GetNamedTagAsBool("k_connected", false); if (k) { val = "ON"; cellBg = cWhite; fontCol = cBlackTxt; } }
						else if (r == 2) val = FormatFloat2(vehicles[vIdx].GetEngineParam("brake-pipe-pressure") / 100.0);
						else if (r == 3) val = FormatFloat2(vehicles[vIdx].GetEngineParam("brake-cylinder-pressure") / 100.0);
						else if (r == 4) val = FormatFloat2(s.GetNamedTagAsFloat("script_mr_press", 0.0f));
						else if (r == 5) val = (string)(int)s.GetNamedTagAsFloat("Eloaded", 0.0f);
						else if (r == 6) val = (string)(int)s.GetNamedTagAsFloat("ac_temp", 25.0f);
						else if (r == 7) { if (s.GetNamedTagAsBool("wc_active", false)) val = "YES"; else val = "NO"; }
					}
				}
				dataGrid = dataGrid + "<td width=52 bgcolor=" + cellBg + " align=center><font size=1 color=" + fontCol + "><b>" + val + "</b></font></td>";
			}
			dataGrid = dataGrid + "<td width=40 bgcolor=#1A1A1A align=center><font size=1 color=#AAAAAA>" + rowUnits[r] + "</font></td>";
			dataGrid = dataGrid + "</tr>";
		}
		dataGrid = dataGrid + "</table>";
		
		mainTable = mainTable + topRow + dataGrid + "</td>";
		
		// Column 2: The Siderbar (Vertical LINE VOLT Section, 140px)
		string mSidebar = "<table width=130 height=320 border=0 cellpadding=8 cellspacing=0 bgcolor=" + cSteelBlue + " style='border-left:1px solid #154C79;'>";
		mSidebar = mSidebar + "<tr><td valign=top align=left>";
		mSidebar = mSidebar + "<font size=2 color=#AAAAAA>Line voltage</font><br>";
		mSidebar = mSidebar + "<font size=5 color=" + cWhite + "><b>25<font size=2>kV</font></b></font><br><br><br>";
		mSidebar = mSidebar + "<font size=2 color=#AAAAAA>outside</font><br>";
		mSidebar = mSidebar + "<font size=5 color=" + cWhite + "><b>36<font size=2>&deg;C</font></b></font>";
		mSidebar = mSidebar + "</td></tr></table>";
		
		mainTable = mainTable + "<td width=140 valign=top align=right>" + mSidebar + "</td>";
		mainTable = mainTable + "</tr></table>";

		string fullHtml = "<table width=770 border=0 cellpadding=4 cellspacing=0><tr><td>" + mainTable + "</td></tr></table>";
		
		return subHdr + fullHtml;
	}

	string FormatFloat2(float val) {
		float absVal = val; if (absVal < 0.0f) absVal = -absVal;
		int iv = (int)(absVal * 100.0f);
		int whole = (int)val; 
		int dec = iv % 100;
		string zeroPad = ""; if (dec < 10) zeroPad = "0";
		
		string sWhole = (string)whole;
		if (val < 0.0f and whole == 0) sWhole = "-0";
		
		return sWhole + "." + zeroPad + (string)dec;
	}
};
