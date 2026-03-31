/* +===============================================================================================================================+ */
/* |                                                                                                                               | */
/* |  ���+   ���+�������+��������+���+   ��+    ������+ ������+  ������+ ������+ ��+   ��+ ������+��������+��+ ������+ ���+   ��+  | */
/* |  ����+ �������+----++--��+--+����+  ���    ��+--��+��+--��+��+---��+��+--��+���   �����+----++--��+--+�����+---��+����+  ���  | */
/* |  ��+����+����������+   ���   ��+��+ ���    ������++������++���   ������  ������   ������        ���   ������   �����+��+ ���  | */
/* |  ���+��++���+----���   ���   ���+��+���    ��+---+ ��+--��+���   ������  ������   ������        ���   ������   ������+��+���  | */
/* |  ��� +-+ �����������   ���   ��� +�����    ���     ���  ���+������++������+++������+++������+   ���   ���+������++��� +�����  | */
/* |  +-+     +-++------+   +-+   +-+  +---+    +-+     +-+  +-+ +-----+ +-----+  +-----+  +-----+   +-+   +-+ +-----+ +-+  +---+  | */
/* |																															   | */
/* |                						Copyright 2024-2026 All rights reserved.											   | */
/* |												Made by MSTN Team.                                                             | */
/* +===============================================================================================================================+ */

// =====================================================================
// cnr_dmi_kernel.gs
// DMI (Driver Machine Interface) - Kernel Module
// Manages the DMI popup browser lifecycle and processing logic.
// Inherits HTML generation from CNR_DMI_PageSettings (via chain).
// =====================================================================

include "cnr_dmi_page_settings.gs"
include "cnr_systems.gs"
include "cnr_ann_scanner.gs"
include "cnr_ann_schedule.gs"

class CNR_DMI isclass CNR_DMI_PageSettings {

	// ------------------------------------------------------------------
	// BROWSER STATE (fully encapsulated)
	// ------------------------------------------------------------------
	Browser m_browser;
	Browser m_modalBrowser;
	Browser m_hudBrowser;
	bool    m_initialised;
	int     m_left, m_top, m_right, m_bottom;
	float   m_nextRefresh;
	float   m_nextHUDUpdate;
	string  m_lastHTML;
	string  m_lastModalHTML;
	CNR_Ann_Scanner  m_scanner;
	CNR_Ann_Schedule m_schedule;


	// ------------------------------------------------------------------
	// LOGGING SYSTEM
	// ------------------------------------------------------------------
	public void AddLog(CNR_State_GenCoach state, string logType, string message, Vehicle veh) {
		if (!state.system_logs) state.system_logs = Constructors.NewSoup();
		
		int count = state.system_logs.CountTags();
		int maxLogs = 100;

		// Shift logs to make room for new one (simple FIFO)
		if (count >= maxLogs) {
			int i;
			for (i = 0; i < maxLogs - 1; i++) {
				state.system_logs.SetNamedTag((string)i, state.system_logs.GetNamedTag((string)(i + 1)));
			}
			count = maxLogs - 1;
		}

		// Format: Time | Car Info | Status | Type | Message
		string timeStr = state.GetFormattedTime(World.GetGameTime());
		
		// 1. Detect Type (ANS, ANSH, ARC, APVC, ANF)
		string carInfo = veh.GetLocalisedName();
		
		// Expected format from callers: "Carrier Name-RunningNum|#Pos"
		string[] parts = Str.Tokens(carInfo, "|");
		string namePart = parts[0];
		string posPart = "";
		if (parts.size() > 1) posPart = parts[parts.size() - 1];

		// Extract Running Number (after last '-')
		string[] nameTokens = Str.Tokens(namePart, "-");
		string runNum = "";
		if (nameTokens.size() > 1) runNum = nameTokens[nameTokens.size() - 1];

		// Detect Vehicle Type
		string type = "CAR";
		if (Str.Find(namePart, "ANS", 0) != -1) type = "ANS";
		else if (Str.Find(namePart, "ARC", 0) != -1) type = "ARC";
		else if (Str.Find(namePart, "APVC", 0) != -1) type = "APVC";
		else if (Str.Find(namePart, "ANF", 0) != -1) type = "ANF";

		// Format: "Type #Pos (Num)"
		string vehicleIdentity = type + " " + posPart + "\n(" + runNum + ")";
		
		string logEntry = timeStr + "|" + vehicleIdentity + "|" + state.GetText("LOG_" + logType) + "|" + logType + "|" + message;
		
		state.system_logs.SetNamedTag((string)state.system_logs_count, logEntry);
		state.system_logs_count++;
	}

	public void CheckSystemsFaults(Vehicle owner, CNR_State_GenCoach state) {
		float currentTime = World.GetTimeElapsed();
		if (currentTime < state.next_CheckSystemsFaults_time) return;
		state.next_CheckSystemsFaults_time = currentTime + 2.0f;

		// 1. Air Pressure Alerts
		if (state.mr_press_internal < 6.5f) {
			if (!state.alert_low_mr_active) {
				state.alert_low_mr_active = true;
				float fVal = (float)((int)(state.mr_press_internal * 100.0f)) / 100.0f;
				string sVal = (string)fVal;
				int dotPos = Str.Find(sVal, ".", 0);
				if (dotPos != -1 and sVal.size() > dotPos + 3) sVal = sVal[0, dotPos + 3];
				AddLog(state, "FAULT", "LOW MR PRESS (" + sVal + " bar)", owner);
			}
		} else if (state.mr_press_internal > 7.0f) {
			if (state.alert_low_mr_active) {
				state.alert_low_mr_active = false;
				float fVal = (float)((int)(state.mr_press_internal * 100.0f)) / 100.0f;
				string sVal = (string)fVal;
				int dotPos = Str.Find(sVal, ".", 0);
				if (dotPos != -1 and sVal.size() > dotPos + 3) sVal = sVal[0, dotPos + 3];
				AddLog(state, "READY", "MR PRESS NORMAL (" + sVal + " bar)", owner);
			}
		}

		// 2. Cooling Temperature Alerts
		if (state.disc_temp > 450.0f) {
			if (!state.alert_crit_temp_active) {
				state.alert_crit_temp_active = true;
				string sVal = (string)((int)state.disc_temp);
				AddLog(state, "FAULT", "CRIT BRAKE TEMP (" + sVal + " C)", owner);
			}
		} else if (state.disc_temp > 300.0f) {
			if (!state.alert_high_temp_active) {
				state.alert_high_temp_active = true;
				string sVal = (string)((int)state.disc_temp);
				AddLog(state, "WARN", "HIGH BRAKE TEMP (" + sVal + " C)", owner);
			}
		} else if (state.disc_temp < 250.0f) {
			if (state.alert_crit_temp_active or state.alert_high_temp_active) {
				state.alert_crit_temp_active = false;
				state.alert_high_temp_active = false;
				string sVal = (string)((int)state.disc_temp);
				AddLog(state, "READY", "BRAKE TEMP NORMAL (" + sVal + " C)", owner);
			}
		}

		// 3. WSP Intervention
		if (state.wsp_active) {
			if (!state.log_wsp_active) {
				state.log_wsp_active = true;
				AddLog(state, "WARN", "WSP ACTIVE", owner);
			}
		} else {
			state.log_wsp_active = false;
		}
	}



	// Is the DMI window currently open?
	public bool IsOpen() { return m_browser != null; }

	// ------------------------------------------------------------------
	// OPEN / REFRESH the DMI window
	// ------------------------------------------------------------------
	public void Show(CNR_State_GenCoach state, Vehicle owner, Library scriptLib, ProductQueue fuelQ) {
		Asset libAsset = owner.GetAsset();
		if (scriptLib) libAsset = scriptLib.GetAsset();

		int mW = 0, mH = 0, mX = 0, mY = 0;
		bool isSmallModal = true; // Default to small modal size

		if (!m_browser) {
			m_browser = Constructors.NewBrowser();
			m_browser.SetWindowStyle(Browser.STYLE_NO_FRAME);
			m_browser.SetCloseEnabled(false);
			if (!m_initialised) {
				m_left   = 5;
				m_top    = 100;
				m_right  = m_left + 770;
				m_bottom = m_top  + 480;
				m_initialised = true;
			}
			owner.Sniff(cast<GameObject>m_browser, "Browser",     "Closed", true);
			owner.Sniff(cast<GameObject>m_browser, "Browser-URL", "",       true);
			owner.Sniff(cast<GameObject>m_browser, "Browser-Click", "",     true);
		} else {
			m_left   = m_browser.GetWindowLeft();
			m_top    = m_browser.GetWindowTop();
			m_right  = m_browser.GetWindowRight();
			m_bottom = m_browser.GetWindowBottom();
		}

		m_browser.SetWindowRect(m_left, m_top, m_right, m_bottom);
		
		// REMOVED: Periodic synchronization from browser (caused data wipes and corruption)
		// We now rely solely on LinkPropertyValue with link-on-focus-loss for manual edits.

		// Handle first-time power state
		if (state.dmi_first_open) {
			state.dmi_power_state = 0; // Start OFF
			state.dmi_first_open = false;
		}

		string html = GetStatusMonitorPanelHTML(state, owner, fuelQ, scriptLib);
		if (html != m_lastHTML) {
			m_browser.LoadHTMLString(libAsset, html);
			m_lastHTML = html;
		}

		m_browser.SetWindowVisible(true);

		// --- MODAL BROWSER (Internal legacy modals and new LCD modals) ---
		if (state.modal_mode != 0 or state.is_lcd_modal_open) {
			if (!m_modalBrowser) {
				m_modalBrowser = Constructors.NewBrowser();
				m_modalBrowser.SetWindowStyle(Browser.STYLE_NO_FRAME);
				m_modalBrowser.SetCloseEnabled(false);
				owner.Sniff(cast<GameObject>m_modalBrowser, "Browser",     "Closed", true);
				owner.Sniff(cast<GameObject>m_modalBrowser, "Browser-URL", "",       true);
				owner.Sniff(cast<GameObject>m_modalBrowser, "Browser-Click", "",     true);
			}
			
			// Determine modal size and position based on type
			if (state.is_lcd_modal_open or state.modal_mode == 7 or state.modal_mode == 8 or state.modal_mode == 11) { // Large modals
				mW = 430; mH = 370;
				mX = m_left + ( (m_right - m_left) - mW ) / 2;
				mY = m_top + ( (m_bottom - m_top) - mH ) / 2;
				isSmallModal = false;
			} else { // Smaller legacy modals
				mW = 465; mH = 210;
				mX = m_left + ( (m_right - m_left) - mW ) / 2;
				mY = m_top + 230; 
				isSmallModal = true;
			}
			
			m_modalBrowser.SetWindowRect(mX, mY, mX + mW, mY + mH);
			
			string modalHtml = "";
			if (state.is_lcd_modal_open or state.modal_mode == 8) { // LCD Edit Modal
				modalHtml = GetLCDEditModalContent(state);
			} else if (state.modal_mode == 7) { // Load Template Modal
				modalHtml = GetLCDTemplateModalContent(state);
			} else if (state.modal_mode == 11) { // Car Numbering Modal
				modalHtml = GetCarNumberingModalContent(state, owner);
			} else { // Other legacy modals
				modalHtml = GetModalPageHTML(state);
			}

			if (modalHtml != "") {
				if (modalHtml != m_lastModalHTML) {
					m_modalBrowser.LoadHTMLString(libAsset, modalHtml);
					m_lastModalHTML = modalHtml;
				}
				m_modalBrowser.SetWindowVisible(true);
				m_modalBrowser.BringToFront();
			} else {
				m_modalBrowser.SetWindowVisible(false);
			}
		} else {
			if (m_modalBrowser) {
				m_modalBrowser.SetWindowVisible(false);
				m_modalBrowser = null;
				m_lastModalHTML = "";
			}
		}

	}

	// ------------------------------------------------------------------
	// FORCE CLOSE the DMI window
	// ------------------------------------------------------------------
	public void Close(Vehicle owner) {
		if (m_browser) {
			owner.Sniff(cast<GameObject>m_browser, "Browser",     "Closed", false);
			owner.Sniff(cast<GameObject>m_browser, "Browser-URL", "",       false);
			owner.Sniff(cast<GameObject>m_browser, "Browser-Click", "",     false);
			m_browser = null;
			m_lastHTML = ""; // CLEAR THIS so it can re-open!
		}
		if (m_modalBrowser) {
			owner.Sniff(cast<GameObject>m_modalBrowser, "Browser",     "Closed", false);
			owner.Sniff(cast<GameObject>m_modalBrowser, "Browser-URL", "",       false);
			owner.Sniff(cast<GameObject>m_modalBrowser, "Browser-Click", "",     false);
			m_modalBrowser = null;
			m_lastModalHTML = "";
		}
	}

	// ------------------------------------------------------------------
	// HANDLE Browser "Closed" message
	// ------------------------------------------------------------------
	public void OnClosed(Message msg, Vehicle owner) {
		if (msg.src == m_browser) {
			owner.Sniff(cast<GameObject>m_browser, "Browser",     "Closed", false);
			owner.Sniff(cast<GameObject>m_browser, "Browser-URL", "",       false);
			owner.Sniff(cast<GameObject>m_browser, "Browser-Click", "",     false);
			m_browser = null;
			m_lastHTML = ""; // CLEAR THIS so it can re-open!
			if (m_modalBrowser) {
				m_modalBrowser.SetWindowVisible(false);
				m_modalBrowser = null;
			}
		} else if (msg.src == m_modalBrowser) {
			owner.Sniff(cast<GameObject>m_modalBrowser, "Browser",     "Closed", false);
			owner.Sniff(cast<GameObject>m_modalBrowser, "Browser-URL", "",       false);
			owner.Sniff(cast<GameObject>m_modalBrowser, "Browser-Click", "",     false);
			m_modalBrowser = null;
			m_lastModalHTML = ""; // CLEAR THIS so it can re-open!
		}
	}

	// ------------------------------------------------------------------
	// HARD RESET the DMI system (Forced Reboot)
	// Called by ACS on couple/decouple, or manually via UI.
	// ------------------------------------------------------------------
	public void ResetDMI(Vehicle owner, CNR_State_GenCoach state, Library scriptLib, ProductQueue fuelQ) {
		bool wasOpen = (m_browser != null);

		// 1. Completely destroy the existing browsers
		Close(owner); 
		m_initialised = false; 
		m_lastHTML = "";
		m_lastModalHTML = "";
		
		// 2. Reset the power state to force a fresh boot sequence
		state.dmi_power_state = 0; // OFF
		state.dmi_boot_timer = 0.0f;
		state.dmi_first_open = true;
		state.modal_mode = 0; // Clear any stuck modals
		state.is_lcd_modal_open = false; // Clear LCD edit modal state

		// Log the hard reset event
		AddLog(state, "INFO", "DMI SYSTEM REBOOT - Consist changed", owner);

		// 3. If it was open before the reset, open it back up immediately
		if (wasOpen) {
			Show(state, owner, scriptLib, fuelQ);
		}
	}

	// ------------------------------------------------------------------
	// PROPERTY INTERACTION HANDLING
	// ------------------------------------------------------------------
	public string LinkPropertyValue(Vehicle owner, CNR_State_GenCoach state, string p_propertyID) {
		if (p_propertyID == "monitor_page_back") {
			state.monitor_page = state.last_monitor_page;
			state.modal_mode = 0;
			state.is_lcd_modal_open = false;
			return "HANDLED";
		}
		if (Str.Find(p_propertyID, "monitor_page_", 0) == 0) {
			int pIdx = Str.ToInt(Str.Tokens(p_propertyID, "monitor_page_")[0]);
			// Save current page to history only when entering a sub-page (5-9) from a main page (0-4)
			if (pIdx >= 5 and pIdx <= 9) {
				if (state.monitor_page < 5) state.last_monitor_page = state.monitor_page;
			}
			
			state.monitor_page = pIdx;
			state.modal_mode = 0; // Dismiss any open modal on page change
			state.is_lcd_modal_open = false; // Dismiss any open LCD edit modal on page change
			
			if (pIdx == 5) { // Log Page Init
				state.monitor_log_page = 0;
				state.monitor_log_selected = 0;
			}
			
			if (pIdx == 6) {
				state.door_interlock_bypass_edit = state.door_interlock_bypass;
				state.door_interlock_speed_edit = state.door_interlock_speed;
				if (state.door_interlock_speed_edit < 5.0f) state.door_interlock_speed_edit = 10.0f;
				// Ensure all cars are selected by default for Master Control
				if (owner.GetMyTrain()) {
					int totalCars = owner.GetMyTrain().GetVehicles().size();
					int i;
					if (!state.interlockSelectionStates) state.interlockSelectionStates = Constructors.NewSoup();
					for (i = 0; i < totalCars; i++) {
						state.interlockSelectionStates.SetNamedTag((string)i, 1);
					}
				}
			}
			if (pIdx == 8) {
				// Signal Lamp page init: load current modes from each car's properties, reset selection
				if (!state.signalLampSelectionStates) state.signalLampSelectionStates = Constructors.NewSoup();
				if (!state.signalLampModeEditStates)  state.signalLampModeEditStates  = Constructors.NewSoup();
				state.signalLampSelectionStates.SetNamedTag("selected_car", -1); // Reset selection
				if (owner.GetMyTrain()) {
					Vehicle[] vehicles8 = owner.GetMyTrain().GetVehicles();
					int j;
					for (j = 0; j < vehicles8.size(); j++) {
						Vehicle v8 = vehicles8[j];
						Soup sp8 = v8.GetProperties();
						int existingMode = 0;
						if (sp8) existingMode = sp8.GetNamedTagAsInt("signal_lamp_mode", 0);
						state.signalLampModeEditStates.SetNamedTag((string)j, existingMode);
					}
				}
			}
			return "HANDLED";
		}
		if (p_propertyID == "monitor_power_subpage_0") { state.monitor_power_subpage = 0; return "HANDLED"; }
		if (p_propertyID == "monitor_power_subpage_1") { state.monitor_power_subpage = 1; return "HANDLED"; }
		
		if (p_propertyID == "monitor_brakes_subpage_0") { state.monitor_brakes_subpage = 0; return "HANDLED"; }
		if (p_propertyID == "monitor_brakes_subpage_1") { state.monitor_brakes_subpage = 1; return "HANDLED"; }
		
		if (p_propertyID == "dmi_power_toggle") {
			if (state.dmi_power_state == 0) {
				state.dmi_power_state = 1; // Start Boot (LOGO)
				state.dmi_boot_timer = 0.0f; 
			} else {
				state.dmi_power_state = 0; // Turn OFF
			}
			return "HANDLED";
		}
		if (p_propertyID == "set_lang_0") { state.language = 0; return "HANDLED"; }
		if (p_propertyID == "set_lang_1") { state.language = 1; return "HANDLED"; }
		if (p_propertyID == "set_lang_2") { state.language = 2; return "HANDLED"; }
		if (p_propertyID.size() >= 17 and p_propertyID[0, 17] == "set_car_num_mode_") {
			state.car_num_mode = Str.ToInt(p_propertyID[17, p_propertyID.size()]);
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "HANDLED";
		}
		if (p_propertyID.size() >= 15 and p_propertyID[0, 15] == "set_log_filter_") {
			state.log_filter = Str.ToInt(p_propertyID[15, p_propertyID.size()]);
			state.monitor_log_page = 0; // Reset scroll position on filter change
			state.monitor_log_selected = 0; // Reset selection on filter change
			return "HANDLED";
		}
		if (p_propertyID == "log_up") {
			if (state.monitor_log_selected > 0) {
				state.monitor_log_selected--;
				// Auto-scroll up if selection moves above visible area
				if (state.monitor_log_selected < state.monitor_log_page) {
					state.monitor_log_page = state.monitor_log_selected;
				}
			}
			return "HANDLED";
		}
		if (p_propertyID == "log_down") {
			// Need total count for bounds checking, but kernel doesn't have the filtered list directly.
			// However, we can just increment and let the display clamp it, or assume a large number.
			// A better way is to pass the count or let the display component handle the increment logic.
			// But for now, we'll increment and the display will clamp it.
			state.monitor_log_selected++; 
			// Auto-scroll logic happens in GetSystemLogPageHTML clamping or we can estimate.
			// Let's just increment, GetSystemLogPageHTML will clamp both selected and page.
			return "HANDLED";
		}
		if (p_propertyID == "log_enter") {
			if (state.system_logs and state.system_logs.CountTags() > 0) {
				state.modal_mode = 6; // Log Detail Modal
			}
			return "HANDLED";
		}
		if (p_propertyID == "log_modal_close") {
			state.modal_mode = 0;
			return "HANDLED";
		}
		if (p_propertyID.size() >= 11 and p_propertyID[0, 11] == "resetBrake_") {
			return "ACTION:RESET_BRAKE:" + p_propertyID[11, p_propertyID.size()];
		}
		if (p_propertyID.size() >= 22 and p_propertyID[0, 22] == "toggle_resetbrake_sel_") {
			string idxStr = p_propertyID[22, p_propertyID.size()];
			int vIdx = Str.ToInt(idxStr);
			if (!state.resetBrakeSelectionStates) state.resetBrakeSelectionStates = Constructors.NewSoup();
			int currentState = state.resetBrakeSelectionStates.GetNamedTagAsInt((string)vIdx, 0);
			if (currentState == 1) state.resetBrakeSelectionStates.SetNamedTag((string)vIdx, 0);
			else state.resetBrakeSelectionStates.SetNamedTag((string)vIdx, 1);
			return "HANDLED";
		}
		if (p_propertyID == "resetBrakeEdit_confirm") {
			Train myTrain = owner.GetMyTrain();
			if (myTrain) {
				Vehicle[] vehicles = myTrain.GetVehicles();
				int i;
				for (i = 0; i < vehicles.size(); i++) {
					if (state.resetBrakeSelectionStates and state.resetBrakeSelectionStates.GetNamedTagAsInt((string)i, 0) == 1) {
						owner.PostMessage(owner, "Interface-Property-Change", "resetBrake_" + (string)i, 0.1f);
						// Also reset selection after execution
						state.resetBrakeSelectionStates.SetNamedTag((string)i, 0);
					}
				}
			}
			state.monitor_brakes_subpage = 0;
			return "HANDLED";
		}
		if (p_propertyID == "parkbrake_apply_all") {
			CNR_Systems cSys = new CNR_Systems();
			cSys.BroadcastHandbrake(owner, true);
			AddLog(state, "INFO", state.GetText("LOG_PARK_APPLY_ALL"), owner);

			return "HANDLED";
		}
		if (p_propertyID == "parkbrake_release_all") {
			CNR_Systems cSys = new CNR_Systems();
			cSys.BroadcastHandbrake(owner, false);
			AddLog(state, "INFO", state.GetText("LOG_PARK_REL_ALL"), owner);

			return "HANDLED";
		}
		if (p_propertyID == "parkbrake_apply_sel") {
			CNR_Systems cSys = new CNR_Systems();
			cSys.BroadcastHandbrakeSelective(owner, state.resetBrakeSelectionStates, true);
			return "HANDLED";
		}
		if (p_propertyID == "parkbrake_release_sel") {
			CNR_Systems cSys = new CNR_Systems();
			cSys.BroadcastHandbrakeSelective(owner, state.resetBrakeSelectionStates, false);
			return "HANDLED";
		}

		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "toggle_door_sel_") {
			int vIdx = Str.ToInt(p_propertyID[16, p_propertyID.size()]);
			int currentState = state.doorSelectionStates.GetNamedTagAsInt((string)vIdx, 1);
			if (currentState == 1) state.doorSelectionStates.SetNamedTag((string)vIdx, 0);
			else state.doorSelectionStates.SetNamedTag((string)vIdx, 1);
			return "HANDLED";
		}
		if (p_propertyID == "monitor_home_page_prev") {
			state.monitor_home_page--;
			return "HANDLED";
		}
		if (p_propertyID == "monitor_home_page_next") {
			state.monitor_home_page++;
			return "HANDLED";
		}
		if (p_propertyID == "toggleAdvancedView") {
			state.showAdvancedView = !state.showAdvancedView;
			return "HANDLED";
		}
		if (p_propertyID == "toggleSigLamp") {
			// Legacy no-op: signal_lamp_mode is now controlled via the Signal Lamp settings page (page 8)
		  	return "HANDLED";
		}
		if(p_propertyID == "toggleTypeSeatCoach") {
			return "ACTION:TOGGLE_SEAT";
		}
		if(p_propertyID == "state.toggleDoorInterlock") {
			state.toggleDoorInterlock = !state.toggleDoorInterlock;
			return "HANDLED";
		}
		if (p_propertyID == "toggleInterlockBypass") {
			state.door_interlock_bypass = !state.door_interlock_bypass;
			return "HANDLED";
		}
		
		// --- Door Interlock Page 6 Handlers ---
		if (Str.Find(p_propertyID, "toggle_interlock_sel_", 0) == 0) {
			string idxStr = Str.Tokens(p_propertyID, "_")[3];
			int idx = Str.ToInt(idxStr);
			if (!state.interlockSelectionStates) state.interlockSelectionStates = Constructors.NewSoup();
			int sVal = state.interlockSelectionStates.GetNamedTagAsInt(idxStr, 1);
			if (sVal == 1) state.interlockSelectionStates.SetNamedTag(idxStr, 0); else state.interlockSelectionStates.SetNamedTag(idxStr, 1);
			return "HANDLED";
		}
		if (p_propertyID == "interlockEdit_toggleBypass") {
			state.door_interlock_bypass_edit = !state.door_interlock_bypass_edit;
			return "HANDLED";
		}
		if (p_propertyID == "interlockEdit_inc") {
			state.door_interlock_speed_edit = state.door_interlock_speed_edit + 5.0f;
			if (state.door_interlock_speed_edit > 40.0f) state.door_interlock_speed_edit = 40.0f;
			return "HANDLED";
		}
		if (p_propertyID == "interlockEdit_dec") {
			state.door_interlock_speed_edit = state.door_interlock_speed_edit - 5.0f;
			if (state.door_interlock_speed_edit < 5.0f) state.door_interlock_speed_edit = 5.0f;
			return "HANDLED";
		}
		if (p_propertyID == "interlockEdit_cancel") {
			state.monitor_page = 4;
			return "HANDLED";
		}
		if (p_propertyID == "interlockEdit_confirm") {
			// Apply to selected cars via centralized broadcast system
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastInterlockSettings(owner, state.interlockSelectionStates, state.door_interlock_bypass_edit, state.door_interlock_speed_edit);
			state.monitor_page = 4;
			return "HANDLED";
		}

		// --- Signal Lamp Page 8 Handlers ---
		// Car selection: siglamp_car_sel_N
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "siglamp_car_sel_") {
			string idxStr = p_propertyID[16, p_propertyID.size()];
			int selIdx = Str.ToInt(idxStr);
			if (!state.signalLampSelectionStates) state.signalLampSelectionStates = Constructors.NewSoup();
			state.signalLampSelectionStates.SetNamedTag("selected_car", selIdx);
			return "HANDLED";
		}
		// Mode selection: siglamp_mode_N_M  (N=car index, M=mode 0/1/2)
		if (p_propertyID.size() >= 13 and p_propertyID[0, 13] == "siglamp_mode_") {
			string rest = p_propertyID[13, p_propertyID.size()];
			// rest is "N_M" � split on last underscore
			int lastUnder = -1;
			int ci;
			for (ci = 0; ci < rest.size(); ci++) {
				if (rest[ci, ci+1] == "_") lastUnder = ci;
			}
			if (lastUnder >= 0) {
				int carIdx  = Str.ToInt(rest[0, lastUnder]);
				int newMode = Str.ToInt(rest[lastUnder+1, rest.size()]);
				if (!state.signalLampModeEditStates) state.signalLampModeEditStates = Constructors.NewSoup();
				state.signalLampModeEditStates.SetNamedTag((string)carIdx, newMode);
			}
			return "HANDLED";
		}
		if (p_propertyID == "siglampEdit_cancel") {
			state.monitor_page = 4;
			return "HANDLED";
		}
		if (p_propertyID == "siglampEdit_confirm") {
			CNR_Systems cSys = new CNR_Systems();
			cSys.BroadcastSignalLampSettings(owner, state.signalLampModeEditStates);
			state.monitor_page = 4;
			return "HANDLED";
		}

		// --- LCD CONTROLS ---
		if (p_propertyID == "lcd_br_inc") {
			state.lcd_brightness = state.lcd_brightness + 0.5f;
			if (state.lcd_brightness > 30.0f) state.lcd_brightness = 30.0f;
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_br_dec") {
			state.lcd_brightness = state.lcd_brightness - 0.5f;
			if (state.lcd_brightness < 0.0f) state.lcd_brightness = 0.0f;
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_power_toggle") {
			state.lcd_power = !state.lcd_power;
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_power_on") {
			state.lcd_power = true;
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_power_off") {
			state.lcd_power = false;
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		
		if (p_propertyID == "lcd_swap_toggle") {
			state.lcd_swap_enabled = !state.lcd_swap_enabled;
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_swap_period_inc") {
			state.lcd_swap_period = state.lcd_swap_period + 5.0f;
			if (state.lcd_swap_period > 60.0f) state.lcd_swap_period = 60.0f;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_swap_period_dec") {
			state.lcd_swap_period = state.lcd_swap_period - 5.0f;
			if (state.lcd_swap_period < 5.0f) state.lcd_swap_period = 5.0f;
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}

		if (p_propertyID == "car_numbering_open") {
			state.modal_mode = 11;
			// Initialization or sync current selection from train
			bool isFirstSync = (!state.lcdForceZeroSelection);
			if (isFirstSync) state.lcdForceZeroSelection = Constructors.NewSoup();
			
			Train t = owner.GetMyTrain();
			if (t) {
				Vehicle[] vehs = t.GetVehicles();
				int i;
				for (i = 0; i < vehs.size(); i++) {
					Soup p = vehs[i].GetProperties();
					if (p) {
						// If it's the first time in this session, default ARC cars to "Skip"
						if (isFirstSync) {
							string vName = vehs[i].GetAsset().GetLocalisedName();
							bool isARC = (Str.Find(vName, "ARC", 0) != -1);
							if (isARC) state.lcdForceZeroSelection.SetNamedTag((string)i, 1);
							else state.lcdForceZeroSelection.SetNamedTag((string)i, 0);
						} else {
							// Normal sync from current properties
							bool fz = (p.GetNamedTagAsInt("lcd_force_zero", 0) == 1);
							state.lcdForceZeroSelection.SetNamedTag((string)i, (int)fz);
						}
					}
				}
			}
			return "HANDLED";
		}
		
		if (Str.Find(p_propertyID, "toggle_lcd_force_zero_", 0) != -1) {
			int idx = Str.ToInt(p_propertyID[22, p_propertyID.size()]);
			if (!state.lcdForceZeroSelection) state.lcdForceZeroSelection = Constructors.NewSoup();
			int cur = state.lcdForceZeroSelection.GetNamedTagAsInt((string)idx, 0);
			state.lcdForceZeroSelection.SetNamedTag((string)idx, 1 - cur);
			return "HANDLED";
		}
		
		if (p_propertyID == "car_numbering_apply") {
			if (state.lcdForceZeroSelection) {
				CNR_Systems cSystems = new CNR_Systems();
				cSystems.BroadcastCarNumbering(owner, state.lcdForceZeroSelection);
			}
			state.modal_mode = 0;
			return "HANDLED";
		}
		
		if (p_propertyID == "car_numbering_cancel") {
			state.modal_mode = 0;
			return "HANDLED";
		}

		if (p_propertyID.size() >= 19 and p_propertyID[0, 19] == "lcd_open_edit_modal") {
			if (p_propertyID.size() > 20 and p_propertyID[19, 20] == "_") {
				state.lcd_edit_page_idx = Str.ToInt(p_propertyID[20, p_propertyID.size()]);
			}
			state.is_lcd_modal_open = true;
			return "HANDLED";
		}
		if (p_propertyID == "lcd_modal_cancel") {
			state.is_lcd_modal_open = false;
			state.modal_mode = 0;
			return "HANDLED";
		}
		if (p_propertyID == "lcd_modal_apply") {
			CNR_Systems cSystems = new CNR_Systems();
			if (m_modalBrowser) {
				if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
				Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_edit_page_idx);
				if (!pageSoup) pageSoup = Constructors.NewSoup();

				int l;
				for (l = 0; l < 9; l++) {
					string elementID = "modal_lcd_line_" + (string)l;
					string val = m_modalBrowser.GetElementProperty(elementID, "text");
					
					// Only update if something was typed (blank = no change)
					if (val != "") {
						// Apply 11-char limit (Phase 2)
						val = cSystems.TruncateTo11(state, val);

						pageSoup.SetNamedTag("line_" + (string)l, val);
						
						// Immediate sync for active page
						if (state.lcd_active_page_idx == state.lcd_edit_page_idx) {
							state.lcd_config_lines[l] = val;
						}
					}
				}
				state.lcd_config_pages.SetNamedSoup("page_" + (string)state.lcd_edit_page_idx, pageSoup);
			}
			state.is_lcd_modal_open = false;
			return "ACTION:UPDATE_LCD";
		}

		if (p_propertyID.size() >= 14 and p_propertyID[0, 14] == "lcd_edit_page_") {
			state.lcd_edit_page_idx = Str.ToInt(p_propertyID[14, p_propertyID.size()]);
			return "HANDLED";
		}
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_toggle_page_") {
			int pIdx = Str.ToInt(p_propertyID[16, p_propertyID.size()]);
			state.lcd_page_enabled[pIdx] = !state.lcd_page_enabled[pIdx];
			state.lcd_manual_dirty = true;

			// Sync: ????? page ?????? activate ??? load ????????? lcd_config_pages ????? lcd_config_lines
			// ???????? BroadcastLCDConfig ???????????????????????????
			if (state.lcd_page_enabled[pIdx]) {
				state.lcd_active_page_idx = pIdx;
				if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
				Soup activeSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)pIdx);
				CNR_Systems cSyncSys = new CNR_Systems();
				int ln;
				for (ln = 0; ln < 9; ln++) {
					string lineVal = "";
					if (activeSoup) lineVal = activeSoup.GetNamedTag("line_" + (string)ln);
					// Fallback: ??? page 0 ???? 1 ????????????? soup ????????? default
					if (lineVal == "") {
						if (pIdx == 0) lineVal = state.lcd_config_lines_th[ln];
						else if (pIdx == 1) lineVal = state.lcd_lines_en[ln];
					}
					state.lcd_config_lines[ln] = cSyncSys.TruncateTo11(state, lineVal);
				}
			}

			return "ACTION:UPDATE_LCD";
		}

		if (Str.Find(p_propertyID, "lcd_select_template_", 0) == 0) {
			state.pending_template_id = p_propertyID[20, p_propertyID.size()];
			return "ACTION:REFRESH";
		}

		if (p_propertyID == "lcd_template_confirm") {
			string tID = state.pending_template_id;
			if (tID == "") return "ACTION:REFRESH";

			int k; for(k=0; k<9; k++) { state.lcd_lines_en[k]=""; state.lcd_config_lines_th[k]=""; }
			
			if (tID == "009") {
				state.lcd_config_lines_th[0]="??????? : 009"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????"; state.lcd_config_lines_th[4]="????????"; state.lcd_config_lines_th[6]="?????????"; 
				state.lcd_lines_en[0]="TRAIN : 009"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Krungthep"; state.lcd_lines_en[4]="Aphiwat"; state.lcd_lines_en[6]="Chiang Mai";
			} else if (tID == "010") {
				state.lcd_config_lines_th[0]="??????? : 010"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="?????????"; state.lcd_config_lines_th[6]="???????"; state.lcd_config_lines_th[7]="????????"; 
				state.lcd_lines_en[0]="TRAIN : 010"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Chiang Mai"; state.lcd_lines_en[6]="Krungthep"; state.lcd_lines_en[7]="Aphiwat";
			} else if (tID == "023") {
				state.lcd_config_lines_th[0]="??????? : 023"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????"; state.lcd_config_lines_th[4]="????????"; state.lcd_config_lines_th[6]="???????????"; 
				state.lcd_lines_en[0]="TRAIN : 023"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Krungthep"; state.lcd_lines_en[4]="Aphiwat"; state.lcd_lines_en[6]="Ubon"; state.lcd_lines_en[7]="Ratchathani";
			} else if (tID == "024") {
				state.lcd_config_lines_th[0]="??????? : 024"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????????"; state.lcd_config_lines_th[6]="???????"; state.lcd_config_lines_th[7]="????????"; 
				state.lcd_lines_en[0]="TRAIN : 024"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Ubon Ratchathani"; state.lcd_lines_en[6]="Krungthep"; state.lcd_lines_en[7]="Aphiwat";
			} else if (tID == "025") {
				state.lcd_config_lines_th[0]="??????? : 025"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????"; state.lcd_config_lines_th[4]="????????"; state.lcd_config_lines_th[6]="???????"; 
				state.lcd_lines_en[0]="TRAIN : 025"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Krungthep"; state.lcd_lines_en[4]="Aphiwat"; state.lcd_lines_en[6]="Nong Khai";
			} else if (tID == "026") {
				state.lcd_config_lines_th[0]="??????? : 026"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????"; state.lcd_config_lines_th[6]="???????"; state.lcd_config_lines_th[7]="????????"; 
				state.lcd_lines_en[0]="TRAIN : 026"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Nong Khai"; state.lcd_lines_en[6]="Krungthep"; state.lcd_lines_en[7]="Aphiwat";
			} else if (tID == "031") {
				state.lcd_config_lines_th[0]="??????? : 031"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????"; state.lcd_config_lines_th[4]="????????"; state.lcd_config_lines_th[6]="???????"; 
				state.lcd_lines_en[0]="TRAIN : 031"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Krungthep"; state.lcd_lines_en[4]="Aphiwat"; state.lcd_lines_en[6]="Hat Yai";
			} else if (tID == "032") {
				state.lcd_config_lines_th[0]="??????? : 032"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????"; state.lcd_config_lines_th[6]="???????"; state.lcd_config_lines_th[7]="????????"; 
				state.lcd_lines_en[0]="TRAIN : 032"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Hat Yai"; state.lcd_lines_en[6]="Krungthep"; state.lcd_lines_en[7]="Aphiwat";
			} else if (tID == "167") {
				state.lcd_config_lines_th[0]="??????? : 167"; state.lcd_config_lines_th[1]="?????? : [no]"; state.lcd_config_lines_th[3]="???????"; state.lcd_config_lines_th[4]="????????"; state.lcd_config_lines_th[6]="?????????"; 
				state.lcd_lines_en[0]="TRAIN : 167"; state.lcd_lines_en[1]="CAR : [no]"; state.lcd_lines_en[3]="Krungthep"; state.lcd_lines_en[4]="Aphiwat"; state.lcd_lines_en[6]="Chiang Mai";
			}
			
			state.lcd_current_lang = 0;
			state.lcd_manual_dirty = true;
			CNR_Systems cSystems = new CNR_Systems();

			if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
			Soup pageSoup0 = state.lcd_config_pages.GetNamedSoup("page_0");
			if (!pageSoup0) pageSoup0 = Constructors.NewSoup();
			for(k=0; k<9; k++) pageSoup0.SetNamedTag("line_" + (string)k, cSystems.TruncateTo11(state, state.lcd_config_lines_th[k]));
			state.lcd_config_pages.SetNamedSoup("page_0", pageSoup0);
            
			Soup pageSoup1 = state.lcd_config_pages.GetNamedSoup("page_1");
			if (!pageSoup1) pageSoup1 = Constructors.NewSoup();
			for(k=0; k<9; k++) pageSoup1.SetNamedTag("line_" + (string)k, cSystems.TruncateTo11(state, state.lcd_lines_en[k]));
			state.lcd_config_pages.SetNamedSoup("page_1", pageSoup1);
            
            state.lcd_page_enabled[0] = true;
            state.lcd_page_enabled[1] = true;
            state.lcd_page_enabled[2] = false;
            state.lcd_page_enabled[3] = false;
            state.lcd_page_enabled[4] = false;
            
            state.lcd_edit_page_idx = 0;
			for(k=0; k<9; k++) {
				state.lcd_config_lines[k] = cSystems.TruncateTo11(state, state.lcd_config_lines_th[k]);
			}
			
			state.pending_template_id = "";
			state.modal_mode = 0;
			return "ACTION:REFRESH";
		}

		if (p_propertyID == "lcd_clear_all") {
			if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
			int j; for (j = 0; j < 5; j++) {
				Soup pageSoup = Constructors.NewSoup();
				int k; for (k = 0; k < 9; k++) pageSoup.SetNamedTag("line_" + (string)k, "");
				state.lcd_config_pages.SetNamedSoup("page_" + (string)j, pageSoup);
			}
			int k; for (k = 0; k < 9; k++) state.lcd_config_lines[k] = "";
			state.lcd_manual_dirty = true;
			return "ACTION:REFRESH";
		}

		if (p_propertyID == "lcd_clear_current") {
			if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
			Soup pageSoup = Constructors.NewSoup();
			int k; for (k = 0; k < 9; k++) {
				pageSoup.SetNamedTag("line_" + (string)k, "");
				state.lcd_config_lines[k] = "";
			}
			state.lcd_config_pages.SetNamedSoup("page_" + (string)state.lcd_edit_page_idx, pageSoup);
			state.lcd_manual_dirty = true;
			return "ACTION:REFRESH";
		}

		// --- VIRTUAL KEYBOARD HANDLERS ---
		if (p_propertyID == "lcd_quick_toggle") {
			if (state.lcd_override_id == 16) state.lcd_override_id = 14;
			else state.lcd_override_id = 16;
			
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") {
			int idx = Str.ToInt(p_propertyID[16, p_propertyID.size()]);
			string newText = m_browser.GetElementProperty("property/" + p_propertyID, "text");
			
			if (idx >= 0 and idx < 9) {
				if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
				Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_edit_page_idx);
				if (!pageSoup) pageSoup = Constructors.NewSoup();
				
				pageSoup.SetNamedTag("line_" + (string)idx, newText);
				state.lcd_config_pages.SetNamedSoup("page_" + (string)state.lcd_edit_page_idx, pageSoup);

				if (state.lcd_active_page_idx == state.lcd_edit_page_idx) {
					state.lcd_config_lines[idx] = newText;
				}
				
				state.lcd_override_id = 16;
			}
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_apply_manual_config") {
			// Pull all current lines from browser just in case focus wasn't lost on some
			int l;
			for (l = 0; l < 9; l++) {
				string elementID = "property/lcd_config_line_" + (string)l;
				string val = m_browser.GetElementProperty(elementID, "text");
				if (val != "") {
					owner.PostMessage(owner, "Interface-Property-Change", elementID + "|" + val, 0.0f);
				}
			}
			
			CNR_Systems cSystems = new CNR_Systems();
			cSystems.BroadcastLCDConfig(owner, state, state.lcdSelectionStates);
			return "ACTION:UPDATE_LCD";
		}
		if (p_propertyID == "lcd_open_template") {
			state.modal_mode = 7;
			return "HANDLED";
		}

		// LCD Route Selector
		if (p_propertyID == "lcd_open_orig" or p_propertyID == "lcd_open_dest" or p_propertyID == "lcd_open_train" or p_propertyID == "lcd_open_blank") {
			state.lcd_bak_origin = state.lcd_origin;
			state.lcd_bak_dest = state.lcd_dest;
			state.lcd_bak_train_idx = state.lcd_train_idx;
			state.lcd_bak_is_blank = state.lcd_is_blank;
			state.lcd_bak_factory = state.lcd_factory;
			state.lcd_bak_override_id = state.lcd_override_id;
			
			if (p_propertyID == "lcd_open_orig") state.modal_mode = 1;
			if (p_propertyID == "lcd_open_dest") state.modal_mode = 2;
			if (p_propertyID == "lcd_open_train") state.modal_mode = 3;
			if (p_propertyID == "lcd_open_blank") state.modal_mode = 4;
			return "HANDLED";
		}
		
		if(p_propertyID == "lcd_apply") {
			state.modal_mode = 0;
			state.is_lcd_modal_open = false;
			return "ACTION:UPDATE_LCD";
		}
		if(p_propertyID == "lcd_cancel") {
			state.lcd_origin = state.lcd_bak_origin;
			state.lcd_dest = state.lcd_bak_dest;
			state.lcd_train_idx = state.lcd_bak_train_idx;
			state.lcd_is_blank = state.lcd_bak_is_blank;
			state.lcd_factory = state.lcd_bak_factory;
			state.lcd_override_id = state.lcd_bak_override_id;
			state.modal_mode = 0;
			state.is_lcd_modal_open = false;
			return "HANDLED";
		}
		
		if(p_propertyID == "lcd_swap_ask") {
			state.modal_mode = 5;
			return "HANDLED";
		}
		if(p_propertyID == "lcd_swap_confirm") {
			int temp = state.lcd_origin;
			state.lcd_origin = state.lcd_dest;
			state.lcd_dest = temp;
			state.modal_mode = 0;
			return "ACTION:UPDATE_LCD";
		}
		if(p_propertyID == "lcd_swap_cancel") {
			state.modal_mode = 0;
			return "HANDLED";
		}

		if(p_propertyID.size() >= 13 and p_propertyID[0, 13] == "lcd_sel_orig_") {
			state.lcd_origin = Str.ToInt(Str.Tokens(p_propertyID, "lcd_sel_orig_")[0]);
			if (state.lcd_origin != 0) state.lcd_dest = 0;
			else if (state.lcd_dest == 0) state.lcd_dest = 1;
			return "HANDLED";
		}
		if(p_propertyID.size() >= 13 and p_propertyID[0, 13] == "lcd_sel_dest_") {
			state.lcd_dest = Str.ToInt(Str.Tokens(p_propertyID, "lcd_sel_dest_")[0]);
			if (state.lcd_dest != 0) state.lcd_origin = 0;
			else if (state.lcd_origin == 0) state.lcd_origin = 1;
			return "HANDLED";
		}
		if(p_propertyID.size() >= 14 and p_propertyID[0, 14] == "lcd_sel_train_") {
			state.lcd_train_idx = Str.ToInt(Str.Tokens(p_propertyID, "lcd_sel_train_")[0]);
			return "HANDLED";
		}
		if(p_propertyID.size() >= 13 and p_propertyID[0, 13] == "lcd_sel_mode_") {
			state.lcd_override_id = Str.ToInt(Str.Tokens(p_propertyID, "lcd_sel_mode_")[0]);
			// Backwards compatibility for flags
			state.lcd_is_blank = (state.lcd_override_id == 14);
			state.lcd_factory  = (state.lcd_override_id == 15);
			return "HANDLED";
		}

		// --- LCD Sub-Page Navigation ---
		if (p_propertyID == "lcd_subpage_0") { state.lcd_subpage = 0; return "HANDLED"; }
		if (p_propertyID == "lcd_subpage_1") { state.lcd_subpage = 1; return "HANDLED"; }
		if (p_propertyID == "lcd_subpage_2") { state.lcd_subpage = 2; return "HANDLED"; }

		// --- LCD Modal Editor Handlers ---
		// lcd_open_edit_modal is handled above
		if (p_propertyID == "lcd_modal_cancel_edit") { // Renamed to avoid conflict
			state.is_lcd_modal_open = false;
			state.modal_mode = 0;
			return "HANDLED";
		}
		if (p_propertyID == "lcd_modal_apply_edit") { // Renamed to avoid conflict
			if (m_modalBrowser) {
				int l;
				if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
				Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_edit_page_idx);
				if (!pageSoup) pageSoup = Constructors.NewSoup();

				for (l = 0; l < 9; l++) {
					string elementID = "modal_lcd_line_" + (string)l;
					string val = m_modalBrowser.GetElementProperty(elementID, "text");
					
					pageSoup.SetNamedTag("line_" + (string)l, val);
					
					if (state.lcd_active_page_idx == state.lcd_edit_page_idx) {
						state.lcd_config_lines[l] = val;
					}
				}
				state.lcd_config_pages.SetNamedSoup("page_" + (string)state.lcd_edit_page_idx, pageSoup);
				state.lcd_override_id = 16;
				
				CNR_Systems cSystems = new CNR_Systems();
				cSystems.UpdateLCDTextureState(owner, state, false);
			}
			state.modal_mode = 0;
			state.is_lcd_modal_open = false;
			return "ACTION:UPDATE_LCD";
		}

		// Manual LCD Line Inputs
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") {
			// Return HANDLED to stop recursion in vehicle.gs LinkPropertyValue 
			// The native property system will take over because GetPropertyType returns "string"
			return "HANDLED"; 
		}

		// --- Announcement Mode ---
		if (p_propertyID == "ann_set_manual") {
			state.ann_mode = 0;
			state.ann_playing = false; // Stop any playing when switching to manual
			return "HANDLED";
		}
		if (p_propertyID == "ann_set_auto") {
			state.ann_mode = 1;
			state.ann_playing = false;
			state.ann_scan_dist = -1.0f; // Reset scan state so it shows "Scanning..."
			state.ann_scan_result = "";
			return "HANDLED";
		}

		// --- Announcement Sound Language ---
		if (p_propertyID == "ann_slang_0") { state.ann_sound_lang = 0; return "HANDLED"; }
		if (p_propertyID == "ann_slang_1") { state.ann_sound_lang = 1; return "HANDLED"; }
		if (p_propertyID == "ann_slang_2") { state.ann_sound_lang = 2; return "HANDLED"; }
		if (p_propertyID == "ann_slang_3") { state.ann_sound_lang = 3; return "HANDLED"; }

		// --- Select Announcement (ann_sel_N) ---
		if (p_propertyID.size() >= 8 and p_propertyID[0, 8] == "ann_sel_") {
			int selId = Str.ToInt(p_propertyID[8, p_propertyID.size()]);
			state.ann_active_id = selId;
			state.ann_playing = false; // Reset play on selection change
			return "HANDLED";
		}

		// --- Play / Stop Announcement ---
		if (p_propertyID == "ann_play") {
			if (state.ann_active_id > 0) {
				state.ann_playing = true;
				return "ACTION:ANN_PLAY:" + (string)state.ann_active_id + ":" + (string)state.ann_sound_lang;
			}
			return "HANDLED";
		}
		if (p_propertyID == "ann_stop") {
			state.ann_playing = false;
			return "ACTION:ANN_STOP";
		}

		// --- Announcement Scan Mode ---
		if (p_propertyID == "ann_scan_mode_0") { state.ann_scan_mode = 0; return "HANDLED"; }
		if (p_propertyID == "ann_scan_mode_1") { state.ann_scan_mode = 1; return "HANDLED"; }

		// --- Schedule-based quick play ---
		if (p_propertyID == "ann_sched_play") {
			// Auto-selects ANN_03 (Approaching Station) for the upcoming stop
			state.ann_active_id = 3;
			state.ann_playing = true;
			return "ACTION:ANN_PLAY:3:" + (string)state.ann_sound_lang;
		}

		if(p_propertyID == "toggleEngine1" or p_propertyID == "ctrl_engine1_toggle") {
			// OVERLOAD RESTART LOCKOUT: Block if timer > 0
			if (!state.m_EngineStats1 and state.engine_lockout_timer > 0.0f) return "HANDLED";
			
			state.m_EngineStats1 = !state.m_EngineStats1;
			if (!state.m_EngineStats1) state.auto_start_e1_blocked = true; // User manually stopped -> prevent auto-start bouncing
			else {
				state.auto_start_e1_blocked = false; // User manually started -> clear block
				if (!state.m_EngineStats2) state.primary_engine = 1; // Mark as primary if it's the only one running
			}
			return "HANDLED";
		}
		if(p_propertyID == "toggleEngine2" or p_propertyID == "ctrl_engine2_toggle") {
			// OVERLOAD RESTART LOCKOUT: Block if timer > 0
			if (!state.m_EngineStats2 and state.engine_lockout_timer > 0.0f) return "HANDLED";
			
			state.m_EngineStats2 = !state.m_EngineStats2;
			if (!state.m_EngineStats2) state.auto_start_e2_blocked = true; // User manually stopped -> prevent auto-start bouncing
			else {
				state.auto_start_e2_blocked = false; // User manually started -> clear block
				if (!state.m_EngineStats1) state.primary_engine = 2; // Mark as primary if it's the only one running
			}
			return "HANDLED";
		}
		if (p_propertyID == "ctrl_engine_quick_start") {
			// Start whichever engine is currently stopped and ! in lockout
			if (state.engine_lockout_timer > 0.0f) return "HANDLED";
			
			if (!state.m_EngineStats1) {
				state.m_EngineStats1 = true;
				state.auto_start_e1_blocked = false;
				if (!state.m_EngineStats2) state.primary_engine = 1;
			} else if (!state.m_EngineStats2) {
				state.m_EngineStats2 = true;
				state.auto_start_e2_blocked = false;
				if (!state.m_EngineStats1) state.primary_engine = 2;
			}
			return "HANDLED";
		}
		if(p_propertyID == "toggleElectricalLoad" or p_propertyID == "ctrl_load_toggle") {
			// INTERLOCK: Only allowed if at least one engine is READY, or if we are turning it OFF
			if(state.engine1_ready or state.engine2_ready or state.toggleLoadElectrical){
				state.toggleLoadElectrical = !state.toggleLoadElectrical;
				if(state.toggleLoadElectrical) {
					if(state.engine1_ready) state.engine1Loading = true;
					if(state.engine2_ready) state.engine2Loading = true;
				} else {
					if(state.engine1Loaded) state.engine1Download = true;
					if(state.engine2Loaded) state.engine2Download = true;
				}
			}

			return "HANDLED";
		}
		if(p_propertyID == "ctrl_handbrake_apply") {
			return "ACTION:HANDBRAKE_APPLY";
		}
		if(p_propertyID == "ctrl_handbrake_rel") {
			return "ACTION:HANDBRAKE_REL";
		}
		if(p_propertyID == "open_dmi") {
			return "ACTION:OPEN_DMI";
		}
		if (p_propertyID == "reset_dmi") {
			return "ACTION:RESET_DMI";
		}

		return "UNKNOWN";
	}

	public string GetPropertyType(string p_propertyID) {
		if(p_propertyID == "monitor_home_page_prev") return "link";
		if(p_propertyID == "monitor_home_page_next") return "link";
		if(p_propertyID.size() >= 13 and p_propertyID[0, 13] == "monitor_page_") return "link";
		if(p_propertyID == "monitor_power_subpage_0") return "link";
		if(p_propertyID == "monitor_power_subpage_1") return "link";
		if(p_propertyID == "monitor_brakes_subpage_0") return "link";
		if(p_propertyID == "monitor_brakes_subpage_1") return "link";
		if(p_propertyID == "resetBrakeEdit_confirm") return "link";
		if(p_propertyID.size() >= 11 and p_propertyID[0, 11] == "resetBrake_") return "link";
		if(p_propertyID.size() >= 22 and p_propertyID[0, 22] == "toggle_resetbrake_sel_") return "link";
		if(p_propertyID.size() >= 16 and p_propertyID[0, 16] == "toggle_door_sel_") return "link";
		if (p_propertyID == "toggleSigLamp") return "link";
		if (p_propertyID == "toggleDoorLeft") return "link";
		if (p_propertyID == "toggleDoorRight") return "link";
		if (p_propertyID == "state.togglePlatform") return "link";
		if (p_propertyID == "toggleAdvancedView") return "link";
		if (p_propertyID == "toggleTypeSeatCoach") return "link";
		if (p_propertyID == "toggleEngine1" or p_propertyID == "ctrl_engine1_toggle") return "link";
		if (p_propertyID == "toggleEngine2" or p_propertyID == "ctrl_engine2_toggle") return "link";
		if (p_propertyID == "ctrl_engine_quick_start") return "link";
		if (p_propertyID == "toggleElectricalLoad" or p_propertyID == "ctrl_load_toggle") return "link";
		if (p_propertyID == "toggleExhaust") return "link";
		if (p_propertyID == "state.toggleDoorInterlock") return "link";
		if (p_propertyID == "toggleInterlockBypass") return "link";
		if (p_propertyID == "lcd_open_orig") return "link";
		if (p_propertyID == "lcd_open_dest") return "link";
		if (p_propertyID == "lcd_open_train") return "link";
		if (p_propertyID == "lcd_open_blank") return "link";
		if (p_propertyID == "lcd_apply") return "link";
		if (p_propertyID == "lcd_cancel") return "link";
		if (p_propertyID == "lcd_swap_ask") return "link";
		if (p_propertyID == "lcd_swap_confirm") return "link";
		if (p_propertyID == "lcd_swap_cancel") return "link";
		if (p_propertyID.size() >= 13 and p_propertyID[0, 13] == "lcd_sel_orig_") return "link";
		if (p_propertyID.size() >= 13 and p_propertyID[0, 13] == "lcd_sel_dest_") return "link";
		if (p_propertyID.size() >= 14 and p_propertyID[0, 14] == "lcd_sel_train_") return "link";
		if (p_propertyID == "lcd_do_factory") return "link"; // Deprecated
		if (p_propertyID.size() >= 13 and p_propertyID[0, 13] == "lcd_sel_mode_") return "link";
		if (p_propertyID.size() >= 13 and p_propertyID[0, 13] == "lcd_do_blank_") return "link"; // Deprecated
		if (p_propertyID == "ctrl_door_left_toggle") return "link";
		if (p_propertyID == "ctrl_door_right_toggle") return "link";
		if (p_propertyID == "monitor_page_back") return "link";
		if (p_propertyID == "set_lang_0") return "link";
		if (p_propertyID == "set_lang_1") return "link";
		if (p_propertyID == "set_lang_2") return "link";
		if (p_propertyID == "log_up") return "link";
		if (p_propertyID == "log_down") return "link";
		if (p_propertyID == "log_enter") return "link";
		if (p_propertyID == "log_modal_close") return "link";
		if (p_propertyID == "monitor_page_4") return "link";
		if (p_propertyID == "monitor_page_5") return "link";
		if (p_propertyID == "monitor_page_7") return "link";
		if (p_propertyID == "monitor_page_9") return "link";
		if (p_propertyID == "ctrl_handbrake_apply") return "link";
		if (p_propertyID == "ctrl_handbrake_rel") return "link";
		if (p_propertyID == "open_dmi") return "link";
		if (p_propertyID == "reset_dmi") return "link";
		if (p_propertyID == "lcd_subpage_0") return "link";
		if (p_propertyID == "lcd_subpage_1") return "link";
		if (p_propertyID == "ann_set_manual") return "link";
		if (p_propertyID == "ann_set_auto") return "link";
		if (p_propertyID == "ann_slang_0") return "link";
		if (p_propertyID == "ann_slang_1") return "link";
		if (p_propertyID == "ann_slang_2") return "link";
		if (p_propertyID == "ann_slang_3") return "link";
		if (p_propertyID.size() >= 8 and p_propertyID[0, 8] == "ann_sel_") return "link";
		if (p_propertyID == "ann_play") return "link";
		if (p_propertyID == "ann_stop") return "link";
		if (p_propertyID == "ann_scan_mode_0") return "link";
		if (p_propertyID == "ann_scan_mode_1") return "link";
		if (p_propertyID == "ann_sched_play") return "link";

		// Signal Lamp Page 8
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "siglamp_car_sel_") return "link";
		if (p_propertyID.size() >= 13 and p_propertyID[0, 13] == "siglamp_mode_") return "link";
		if (p_propertyID == "siglampEdit_cancel") return "link";
		if (p_propertyID == "siglampEdit_confirm") return "link";

		if (p_propertyID == "lcd_subpage_2") return "link";
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") return "link";

		return "UNKNOWN";
	}

	// ------------------------------------------------------------------
	// HANDLE a Browser-URL click
	// ------------------------------------------------------------------
	public string HandleBrowserClick(Message msg, CNR_State_GenCoach state, Vehicle owner) {
		if (msg.src != m_browser and msg.src != m_modalBrowser) return "";
		
		// If modal is active and background is clicked, refocus modal
		if (state.modal_mode != 0 and msg.src == m_browser) {
			if (m_modalBrowser) {
				m_modalBrowser.SetWindowVisible(true);
				m_modalBrowser.BringToFront(); // Re-raise modal above DMI on click-outside
			}
			return "HANDLED";
		}
		string url    = msg.minor;

		// Robustness: strip potential single/double quotes from the URL string
		if (url.size() >= 2) {
			if ((url[0, 1] == "'" and url[url.size()-1, url.size()] == "'") or
			    (url[0, 1] == "\"" and url[url.size()-1, url.size()] == "\"")) {
				url = url[1, url.size()-1];
			}
		}

		string prefix = "live://";
		if (url.size() >= prefix.size() and url[0, prefix.size()] == prefix) {
			string body = url[prefix.size(), url.size()];
			string pPrefix = "property/";
			if (body.size() >= pPrefix.size() and body[0, pPrefix.size()] == pPrefix) {
				body = body[pPrefix.size(), body.size()];
			}
			string res = LinkPropertyValue(owner, state, body);
			if (res == "UNKNOWN") return body; // Return the property ID itself so it can be handled by the coach
			return res;
		}
		return "";
	}

	// ------------------------------------------------------------------
	// MAIN-LOOP TICK
	// ------------------------------------------------------------------
	public void TickRefresh(float currentTime, CNR_State_GenCoach state, Vehicle owner, Library scriptLib, ProductQueue fuelQ) {




		// --- Handle Boot Sequence Timers (Background Processing) ---
		if (state.dmi_power_state == 1) { // LOGO (3s)
			if (state.dmi_boot_timer == 0.0f) state.dmi_boot_timer = currentTime;
			if (currentTime >= state.dmi_boot_timer + 3.0f) {
				state.dmi_power_state = 2; // Move to TERMINAL
				state.dmi_boot_timer = currentTime;
			}
		} else if (state.dmi_power_state == 2) { // TERMINAL (8s)
			if (state.dmi_boot_timer == 0.0f) state.dmi_boot_timer = currentTime;
			
			// --- Bell Sound Trigger ---
			if (currentTime >= state.dmi_boot_timer + 3.5f and state.bell1_req == 0) {
				state.bell1_req = 1;
			}

			if (currentTime >= state.dmi_boot_timer + 8.0f) {
				state.dmi_power_state = 4; // Move to LOADING
				state.dmi_boot_timer = currentTime;
			}
		} else if (state.dmi_power_state == 4) { // LOADING (3s)
			if (currentTime >= state.dmi_boot_timer + 3.0f) {
				state.dmi_power_state = 3; // Move to ON
				state.dmi_boot_timer = 0.0f;
				// Stop bell when boot finishes
				if (state.bell1_req == 1) {
					state.bell1_req = 0;
				}
			}
		} else if (state.dmi_power_state == 0) {
			// Safety: Stop bell if power state is OFF
			state.bell1_req = 0;
		}

		if (m_browser) {
			if (currentTime >= m_nextRefresh) {
				m_nextRefresh = currentTime + 0.1f;
				
				// --- RTOS Deterministic Simulation ---
				if (currentTime >= state.next_RTOS_tick) {
					state.next_RTOS_tick = currentTime + 0.5f;
					// CPU: 12% - 14% (Very stable for RTOS)
					state.rtos_cpu_load = 12.0f + (Math.Rand(0.0f, 2.0f));
					// MEM: Fixed at 1248MB / 2048MB (Static allocation)
					state.rtos_mem_load = 1248.0f + (Math.Rand(0.0f, 4.0f));
					// GPU: Stable 8%
					state.rtos_gpu_load = 8.0f + (Math.Rand(0.0f, 1.0f));
					// Jitter: Microseconds (Deterministic)
					state.rtos_jitter = 12.0f + (Math.Rand(0.0f, 15.0f));
				}

				CheckSystemsFaults(owner, state);
				// --- Auto Announcement Scanner (only in Auto mode) ---
				if (!m_scanner) m_scanner = new CNR_Ann_Scanner();
				string scanAction = m_scanner.TickScan(currentTime, state, owner);
				if (scanAction != "") state.ann_scan_pending_action = scanAction;

				// --- Time-based next-stop suggestion (Manual mode hint) ---
				if (!m_schedule) m_schedule = new CNR_Ann_Schedule();
				int svcIdx = m_schedule.GetServiceIndex(state);
				if (svcIdx >= 0) {
					float gameTimeF = World.GetGameTime();
					int totalGameSec = (int)(gameTimeF * 86400.0f);
					int gameMin = (totalGameSec / 60) % 1440;
					int nextIdx = m_schedule.GetNextStopIndex(svcIdx, gameMin);
					state.ann_svc_idx        = svcIdx;
					state.ann_next_stop      = nextIdx;
					state.ann_next_stop_name = m_schedule.GetNextStopLabel(svcIdx, nextIdx);
				} else {
					state.ann_svc_idx        = -1;
					state.ann_next_stop      = -1;
					state.ann_next_stop_name = "";
				}

				Show(state, owner, scriptLib, fuelQ);
			}
		}
	}

	// ------------------------------------------------------------------
	// CUSTOM HUD BUTTON (Logic moved from coach)
	// ------------------------------------------------------------------
	public void SetCustomHUD(bool visible, CNR_State_GenCoach state, Vehicle owner, Library scriptLib) {
		if (visible) {
			if (World.GetCurrentModule() != World.DRIVER_MODULE) visible = false;
			if (cast<Vehicle>World.GetCameraTarget() != owner) visible = false;
		}

		if (visible) {
			int width = Interface.GetDisplayWidth();
			int height = Interface.GetDisplayHeight();
			if (width <= 0 or height <= 0) return;

			int xr = width - 500;
			int xt = height - 270;
			int xb = xt + 45;
			
			if (!m_hudBrowser) {
				m_hudBrowser = Constructors.NewBrowser();
				m_hudBrowser.SetWindowStyle(Browser.STYLE_NO_FRAME);
				m_hudBrowser.SetCloseEnabled(false);
			}
			m_hudBrowser.SetWindowRect(0, xt, xr, xb);
			
			Asset libAsset = owner.GetAsset();
			if (scriptLib) libAsset = scriptLib.GetAsset();

			m_hudBrowser.LoadHTMLString(libAsset, "<html><body marginheight=0 marginwidth=0><a href='live://btn_info'><img src='assets/nav/fault_overview_1.png' width=64 height=64></a></body></html>");
			m_hudBrowser.SetWindowVisible(true);
		} else {
			if (m_hudBrowser) m_hudBrowser.SetWindowVisible(false);
		}
	}

	// ------------------------------------------------------------------
	// PERIODIC HUD PERSISTENCE (Keep-alive)
	// ------------------------------------------------------------------
	public void UpdateHUD(float currentTime, CNR_State_GenCoach state, Vehicle owner, Library scriptLib) {
		if (currentTime < m_nextHUDUpdate) return;
		m_nextHUDUpdate = currentTime + 2.0f; // Update every 2 seconds

		// Only show HUD if camera is focused on the owner
		bool shouldBeVisible = (World.GetCurrentModule() == World.DRIVER_MODULE and cast<Vehicle>World.GetCameraTarget() == owner);
		
		if (shouldBeVisible) {
			// If ! initialized, create it. Otherwise, SetCustomHUD(true) will ensure it's visible.
			if (!m_hudBrowser) {
				SetCustomHUD(true, state, owner, scriptLib);
			} else {
				// Safety: Re-sync position in case resolution changed (Interface.GetDisplayWidth/Height)
				int width = Interface.GetDisplayWidth();
				int height = Interface.GetDisplayHeight();
				if (width > 0 and height > 0) {
					int xr = width - 500;
					int xt = height - 270;
					int xb = xt + 45;
					m_hudBrowser.SetWindowRect(0, xt, xr, xb);
					m_hudBrowser.SetWindowVisible(true);
				}
			}
		} else {
			// Ensure it's hidden if focus moved away
			if (m_hudBrowser) {
				m_hudBrowser.SetWindowVisible(false);
			}
		}
	}


	// Is this browser the HUD button?
	public bool IsHUDBrowser(Browser b) {
		return (b != null and b == m_hudBrowser);
	}

	// Is this browser the virtual keyboard? (Deprecated)
	public bool IsKBBrowser(Browser b) {
		return false;
	}

	// Helper to check if source is any of the DMI browsers
	public bool IsDMIBrowser(Browser b) {
		if (!b) return false;
		return (b == m_browser or b == m_modalBrowser or b == m_hudBrowser);
	}

	// ------------------------------------------------------------------
	// LCD SIGN LOGIC
	// ------------------------------------------------------------------

	// Cache: last applied product index per vehicle (keyed by vehicle index in train)
	Soup m_lcdLastProdIdx;   // int per vehicle slot
	int  m_lcdLastElecState; // -1 = uninit, 0 = off, 1 = on

	public int GetLCDProductIndex(int origin, int dest, int trainVar, bool isBlank) {
		if (isBlank) return 14;
		if (origin == 0 and dest != 0) { // Outbound
			if (dest == 1) { if (trainVar == 0) return 2; else return 0; }
			if (dest == 2) return 4; if (dest == 3) return 6; if (dest == 4) return 10;
			if (dest == 5) return 8; if (dest == 6) return 13;
		} else if (dest == 0 and origin != 0) { // Inbound
			if (origin == 1) { if (trainVar == 0) return 3; else return 1; }
			if (origin == 2) return 5; if (origin == 3) return 7; if (origin == 4) return 11;
			if (origin == 5) return 9; if (origin == 6) return 12;
		}
		return 14;
	}

	// Call this when route/electrical changes � updates product immediately, no delay.
	// Uses a per-vehicle dirty cache so vehicles that already show the correct product
	// are ! touched (avoids the expensive Soup config read + destroy/create cycle).
	public void UpdateLCDSigns(Vehicle owner, CNR_State_Base state) {
		// Priority: Forced Zero (Skip) > Override > route-based index
		int prodIdx = 14; // blank/default
		if (state.lcd_force_zero) {
			prodIdx = 16; // Force manual mode (blank background) to show "000" text slots
		} else if (state.lcd_override_id != -1) {
			prodIdx = state.lcd_override_id;
		} else if (state.loadElectrical) {
			prodIdx = GetLCDProductIndex(state.lcd_origin, state.lcd_dest, state.lcd_train_idx, false);
		}

		if (!m_lcdLastProdIdx) m_lcdLastProdIdx = Constructors.NewSoup();
		int lastIdx = m_lcdLastProdIdx.GetNamedTagAsInt("last_p", -1);

		if (prodIdx != lastIdx) {
			m_lcdLastProdIdx.SetNamedTag("last_p", prodIdx);

			ProductQueue ledQ = owner.GetQueue("destination-led");
			if (ledQ) {
				int actualProdIdx = prodIdx;
				if (prodIdx == 16) actualProdIdx = 14; // Manual mode uses index 14 (Blank) as base

				ledQ.DestroyAllProducts();
				Soup apSoup = owner.GetAsset().GetConfigSoup().GetNamedSoup("queues").GetNamedSoup("destination-led").GetNamedSoup("allowed-products");
				if (apSoup) {
					KUID pKuid = apSoup.GetNamedTagAsKUID((string)actualProdIdx);
					if (pKuid) {
						Asset pAsset = World.FindAsset(pKuid);
						if (pAsset) ledQ.CreateProduct(pAsset, 1);
					}
				}
			}
		}

		if (prodIdx == 16) {
			CNR_Systems cSys = new CNR_Systems();
			cSys.UpdateLCDTextureState(owner, state, state.lcd_manual_dirty);
		}

		
		state.lcd_manual_dirty = false;
	}
	// Force the LCD cache to be invalidated (call after a train consist change or
	// any other event that could change which vehicles are in the train).
	public void InvalidateLCDCache() {
		m_lcdLastProdIdx = null;
		m_lcdLastElecState = -1;
	}

	// Controls the mesh animation loop of every destination-led product mesh
	// based on whether electrical power is active.  Call this whenever
	// state.loadElectrical changes.  When power is OFF the animation is stopped
	// so the sign mesh stays static; when power is ON the loop restarts.
	public void UpdateLCDAnimations(Vehicle owner, CNR_State_GenCoach state) {
		int elecState = 0;
		if (state.loadElectrical) elecState = 1;
		if (elecState == m_lcdLastElecState) return; // No change � skip
		m_lcdLastElecState = elecState;

		Vehicle[] vehicles = owner.GetMyTrain().GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			Vehicle v = vehicles[i];
			ProductQueue ledQ = v.GetQueue("destination-led");
			if (!ledQ) continue;

			if (state.loadElectrical) {
				// Power ON: resume animation loop on the product mesh
				v.StartMeshAnimationLoop("destination-led");
			} else {
				// Power OFF: freeze/stop the product mesh animation
				v.StopMeshAnimation("destination-led");
			}
		}
	}

	// ------------------------------------------------------------------
	// PROPERTY MANAGEMENT (State Sync)
	// ------------------------------------------------------------------
	public void SetProperties(Soup soup, CNR_State_GenCoach state) {
		state.signal_lamp_mode = soup.GetNamedTagAsInt("signal_lamp_mode", state.signal_lamp_mode);
		state.m_GWDoorFront = soup.GetNamedTagAsBool("toggleGWDoorFront", state.m_GWDoorFront);
		state.m_GWDoorEnd = soup.GetNamedTagAsBool("toggleGWDoorEnd", state.m_GWDoorEnd);
		state.m_INTDoorFront = soup.GetNamedTagAsBool("toggleINTDoorFront", state.m_INTDoorFront);
		state.m_INTDoorEnd = soup.GetNamedTagAsBool("toggleINTDoorEnd", state.m_INTDoorEnd);
		state.m_PSGdoorleft = soup.GetNamedTagAsBool("toggleDoorLeft", state.m_PSGdoorleft);
		state.m_PSGdoorright = soup.GetNamedTagAsBool("toggleDoorRight", state.m_PSGdoorright);
		state.m_intExteriorType = soup.GetNamedTagAsInt("toggleLiveryExterior", state.m_intExteriorType);
		state.togglePlatform = soup.GetNamedTagAsBool("state.togglePlatform", state.togglePlatform);
		state.toggleDoorInterlock = soup.GetNamedTagAsBool("state.toggleDoorInterlock", state.toggleDoorInterlock);
		state.lcd_origin = soup.GetNamedTagAsInt("lcd_origin", state.lcd_origin);
		state.lcd_dest = soup.GetNamedTagAsInt("lcd_dest", state.lcd_dest);
		state.lcd_train_idx = soup.GetNamedTagAsInt("lcd_train_idx", state.lcd_train_idx);
		state.lcd_is_blank = soup.GetNamedTagAsBool("lcd_is_blank", state.lcd_is_blank);
		state.lcd_factory = soup.GetNamedTagAsBool("lcd_factory", state.lcd_factory);
		state.lcd_override_id = soup.GetNamedTagAsInt("lcd_override_id", state.lcd_override_id);
		state.modal_mode = soup.GetNamedTagAsInt("modal_mode", state.modal_mode);
		state.showAdvancedView = soup.GetNamedTagAsBool("showAdvancedView", state.showAdvancedView);
		state.m_EngineStats1 = soup.GetNamedTagAsBool("engine1", state.m_EngineStats1);
		state.m_EngineStats2 = soup.GetNamedTagAsBool("engine2", state.m_EngineStats2);
		state.toggleLoadElectrical = soup.GetNamedTagAsBool("toggleLoadElectrical", state.toggleLoadElectrical);
		state.engineExhaust = soup.GetNamedTagAsInt("engineExhaust", state.engineExhaust);
		state.script_mr_press = soup.GetNamedTagAsFloat("script_mr_press", state.script_mr_press);
		state.language = soup.GetNamedTagAsInt("language", state.language);
		state.dmi_power_state = soup.GetNamedTagAsInt("dmi_power_state", state.dmi_power_state);
		state.dmi_first_open = soup.GetNamedTagAsBool("dmi_first_open", state.dmi_first_open);
		state.gen_V_DC24 = soup.GetNamedTagAsFloat("gen_V_DC24", state.gen_V_DC24);
		state.gen_A_DC24 = soup.GetNamedTagAsFloat("gen_A_DC24", state.gen_A_DC24);
		state.handbrake = soup.GetNamedTagAsBool("handbrake", state.handbrake);
		state.deceleration_ms2 = soup.GetNamedTagAsFloat("deceleration_ms2", state.deceleration_ms2);
		
		Soup logsSoup = soup.GetNamedSoup("system_logs");
		if (logsSoup) state.system_logs.Copy(logsSoup);
		
		Soup selSoup = soup.GetNamedSoup("doorSelectionStates");
		if (selSoup) state.doorSelectionStates.Copy(selSoup);

		if (soup.GetIndexForNamedTag("door_sound_left_req") != -1) state.door_sound_left_req = soup.GetNamedTagAsInt("door_sound_left_req");
		if (soup.GetIndexForNamedTag("door_sound_right_req") != -1) state.door_sound_right_req = soup.GetNamedTagAsInt("door_sound_right_req");
	}

	public void GetProperties(Soup soup, CNR_State_GenCoach state) {
		soup.SetNamedTag("signal_lamp_mode", state.signal_lamp_mode);
		soup.SetNamedTag("toggleGWDoorFront", state.m_GWDoorFront);
		soup.SetNamedTag("toggleGWDoorEnd", state.m_GWDoorEnd);
		soup.SetNamedTag("toggleINTDoorFront", state.m_INTDoorFront);
		soup.SetNamedTag("toggleINTDoorEnd", state.m_INTDoorEnd);
		soup.SetNamedTag("toggleDoorLeft", state.m_PSGdoorleft);
		soup.SetNamedTag("toggleDoorRight", state.m_PSGdoorright);
		soup.SetNamedTag("toggleLiveryExterior", state.m_intExteriorType);
		soup.SetNamedTag("state.togglePlatform", state.togglePlatform);
		soup.SetNamedTag("state.toggleDoorInterlock", state.toggleDoorInterlock);
		soup.SetNamedTag("lcd_origin", state.lcd_origin);
		soup.SetNamedTag("lcd_dest", state.lcd_dest);
		soup.SetNamedTag("lcd_train_idx", state.lcd_train_idx);
		soup.SetNamedTag("lcd_is_blank", state.lcd_is_blank);
		soup.SetNamedTag("lcd_factory", state.lcd_factory);
		soup.SetNamedTag("lcd_override_id", state.lcd_override_id);
		soup.SetNamedTag("modal_mode", state.modal_mode);
		soup.SetNamedTag("showAdvancedView", state.showAdvancedView);
		soup.SetNamedTag("engine1", state.m_EngineStats1);
		soup.SetNamedTag("engine2", state.m_EngineStats2);
		soup.SetNamedTag("toggleLoadElectrical", state.toggleLoadElectrical);
		soup.SetNamedTag("engineExhaust", state.engineExhaust);
		soup.SetNamedTag("Eloaded", state.Eloaded);
		soup.SetNamedTag("airconState", state.aircon_state);
		soup.SetNamedTag("isDoorLeft", state.isDoorLeft);
		soup.SetNamedTag("isDoorRight", state.isDoorRight);
		soup.SetNamedTag("doorInterlock", state.m_DoorInterlock);
		soup.SetNamedTag("isMSTN", true);
		soup.SetNamedTag("MSTN_Type", 1); 
		soup.SetNamedTag("script_mr_press", state.script_mr_press);
		soup.SetNamedTag("current_load", state.current_load);
		soup.SetNamedTag("language", state.language);
		soup.SetNamedTag("dmi_power_state", state.dmi_power_state);
		soup.SetNamedTag("dmi_first_open", state.dmi_first_open);
		soup.SetNamedTag("gen_V_DC24", state.gen_V_DC24);
		soup.SetNamedTag("gen_A_DC24", state.gen_A_DC24);
		soup.SetNamedTag("handbrake", state.handbrake);
		soup.SetNamedTag("deceleration_ms2", state.deceleration_ms2);

		// LCD Snapshot for Passenger Coaches
		soup.SetNamedTag("lcd_snap_power", state.lcd_power);
		soup.SetNamedTag("lcd_snap_brightness", state.lcd_brightness);
		soup.SetNamedTag("lcd_snap_override_id", state.lcd_override_id);
		soup.SetNamedTag("has_lcd_snap", 1);
		int p_snap;
		for (p_snap = 0; p_snap < 5; p_snap++) {
			soup.SetNamedTag("lcd_snap_p" + (string)p_snap + "_en", state.lcd_page_enabled[p_snap]);
			
			int ln_snap;
			for (ln_snap = 0; ln_snap < 9; ln_snap++) {
				// Priority: 1. Soup (Edit mode) 2. Master Arrays
				string val = "";
				if (state.lcd_config_pages) {
					Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)p_snap);
					if (pageSoup) val = pageSoup.GetNamedTag("line_" + (string)ln_snap);
				}
				if (val == "") {
					if (p_snap == 0) val = state.lcd_config_lines_th[ln_snap];
					else if (p_snap == 1) val = state.lcd_lines_en[ln_snap];
				}
				
				soup.SetNamedTag("lcd_snap_p" + (string)p_snap + "_l" + (string)ln_snap, val);
			}
		}

		Soup outLogsSoup = Constructors.NewSoup();
		outLogsSoup.Copy(state.system_logs);
		soup.SetNamedSoup("system_logs", outLogsSoup);

		Soup outSelSoup = Constructors.NewSoup();
		outSelSoup.Copy(state.doorSelectionStates);
		soup.SetNamedSoup("doorSelectionStates", outSelSoup);
	}


};
