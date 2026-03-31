/* +===============================================================================================================================+ */
/* |                                                                                                                               | */
/* |  ███╗   ███╗███████╗████████╗███╗   ██╗    ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗  | */
/* |  ████╗ ████║██╔════╝╚══██╔══╝████╗  ██║    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║  | */
/* |  ██╔████╔██║███████╗   ██║   ██╔██╗ ██║    ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║   ██║██║   ██║██╔██╗ ██║  | */
/* |  ██║╚██╔╝██║╚════██║   ██║   ██║╚██╗██║    ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║   ██║██║   ██║██║╚██╗██║  | */
/* |  ██║ ╚═╝ ██║███████║   ██║   ██║ ╚████║    ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║  | */
/* |  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═══╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝  | */
/* |																															   | */
/* |                						Copyright 2024-2026 All rights reserved.											   | */
/* |												Made by MSTN Team.                                                             | */
/* +===============================================================================================================================+ */


// cnr_state.gs - Shared State Classes for CNR Rolling Stock Scripts
// Localization logic has been moved to cnr_translation.gs

include "Vehicle.gs"
include "cnr_translation.gs"

class CNR_State_Auth {
	public bool   isVerify = false;
	public string userName = "";
	public string userEmail = "";
	public string userKey = "";
	public string userPurchaseDate = "";
	public string auth_token = "";
};

// CNR_State_Base inherits CNR_Translation for multi-language support
class CNR_State_Base isclass CNR_Translation {

	// --- Power & HEP System ---
	public bool 	isHEPon = false;
	public bool 	hep_relay = false;
	public float 	hep_voltage = 0.0f;
	public float 	hep_frequency = 0.0f;
	public float    hep_load = 0.0f;

	// Aliases used by older code
	public float	voltage = 0.0f;
	public float	frequency = 0.0f;

	// --- AC / Air Conditioning System ---
	public int 		aircon_state = 0;       // 0=Off 1=Starting 2=Running 3=Stopping 4=Cutoff
	public int 		aircon_m_time = 0;
	public float 	aircon_next_time = 0.0f;
	public float 	aircon_sag_timer = 0.0f;
	public float    ac_temp = 32.0f;        // Simulated AC Temp

	// internal compat aliases
	public int 		ac_inner_state = 0;
	public float 	ac_timer = 0.0f;

	// --- WC / Toilet System ---
	public int 		toilet_state = 0;       // 0=Idle 1=Starting 2=Flushing 3=Stopping 4=Cooldown
	public int 		toilet_m_time = 0;
	public float 	toilet_next_time = 0.0f;
	public int 		toilet_pipe0 = 0;
	public int 		toilet_pipe1 = 0;

	public int 		wc_inner_state = 0;
	public float 	wc_timer = 0.0f;

	// --- Platform & Door System ---
	public bool 	isDoorLeft = false;
	public bool 	isDoorRight = false;
	public bool 	doorLeftReal = false;
	public bool 	doorRightReal = false;
	public bool 	togglePlatform = true;
	public bool 	door_interlock_bypass = false;
	public float    door_interlock_speed = 10.0f;
	public bool 	door_interlock_bypass_edit = false;
	public float    door_interlock_speed_edit = 10.0f;

	public bool 	m_DoorInterlock = false;

	// --- Signal Lamp ---
	// 0=Auto (18:00-06:00 if last car), 1=On (always), 2=Off (always)
	public int 		signal_lamp_mode = 0;

	// --- Brake System ---
	public float 	brake_pipe = 0.0f;
	public float 	brake_cyl = 0.0f;
	public bool 	park_brake = false;
	public float    decelerationRate = 0.0f;

	// Readable aliases
	public float 	bp_press = 0.0f;
	public float 	bc_press = 0.0f;
	public float 	mr_press = 0.0f;

	// --- Speed / Motion ---
	public float 	speed = 0.0f;
	public float 	deceleration_ms2 = 0.0f;
	public float    last_speed = 0.0f;
	public float    last_speed_time = 0.0f;

	// --- Load ---
	public float 	current_load = 0.0f;

	// --- System Event Timers ---
	public float 	next_BrakeSoundEvent_time = 0.0f;
	public float 	next_BrakeIndicatorEvent_time = 0.0f;
	public float 	next_DoorInterlockEvent_time = 0.0f;
	public float 	next_DoorHandlerEvent_time = 0.0f;
	public float 	next_onSignalLightChange_time = 0.0f;
	public int      last_signal_lamp_phys = -1; // -1: uninit, 0: off, 1: on
	public int      last_signal_lamp_dir = -1;  // -1: uninit, 0: back, 1: front
	public int      last_brake_ind_glow = -1;   // -1: uninit, 1: glowing (ext cam), 0: off (int cam)
	public float    next_CameraModeCheck_time = 0.0f; // [Optimization] Throttle camera mode polling
	public int      cached_train_size = 0;           // [Optimization] Cached result of GetVehicles().size()

	// --- Coach Status ---
	public bool 	m_EngineStats = false;
	public bool 	m_EngineCheck = false;

	// --- Coach Type Identification ---
	public bool 	isAPVC = false;
	public bool 	isANF = false;
	public bool 	isARC = false;

	// --- Utilities ---
	public int 		monitor_page = 0;
	public int      monitor_home_page = 0;
	public int      monitor_log_page = 0;
	public int      monitor_log_selected = 0;
	public int      log_filter = 0;
	public int      last_monitor_page = 0;
	public bool 	isDebug = false;
	public bool 	isUIVisible = false;
	public bool 	showAdvancedView = false;
	public Soup 	resetBrakeStates;
	public Soup     resetBrakeSelectionStates;
	public Soup     doorSelectionStates;
	public Soup     interlockSelectionStates;
	public Soup     signalLampSelectionStates;  // Per-car selection for Signal Lamp edit page
	public Soup     signalLampModeEditStates;   // Per-car mode (0/1/2) being edited before Apply
	public Soup     system_logs;
	public int      system_logs_count = 0;
	public float 	m_intShadeDelayRandomizer;
	public float 	m_pipeDelayRandomizer;

	// --- DMI Power & Boot System ---
	public int      dmi_power_state = 0; // 0: OFF, 1: LOGO, 2: TERMINAL, 3: ON, 4: LOADING
	public float    dmi_boot_timer = 0.0f;
	public bool     dmi_first_open = true;
	public int      bell1_req = 0;
	public int      bell2_req = 0;
	public int      bell1_inner_state = 0;
	public float    bell1_timer = 0.0f;
	public int      bell2_inner_state = 0;
	public float    bell2_timer = 0.0f;

	// --- Door Sound States ---
	public int      door_sound_left_req = 0;
	public int      door_sound_right_req = 0;
	public float    door_sound_left_end = 0.0f;
	public float    door_sound_right_end = 0.0f;

	// --- Common Air & Brake Simulation State ---
	public float	script_mr_press = 8.5f;
	public float	script_cr_press = 8.5f;
	public float    disc_temp = 30.0f;           // °C averaged all discs
	public int      brake_pipe_state = 0;        // 0=Release 1=Lap 2=Service 3=Full Service 4=Emergency
	
	public float    next_DiscThermal_time = 0.0f;
	public float    next_BrakePipeMonitor_time = 0.0f;
	public int      last_brake_pipe_state = 0;   // Used for transition detection
	public bool     handbrake = false;           // Park Brake
	public bool     emg_active = false;
	public bool     emg_locked = false;
	public float    emg_timer = 0.0f;
	public float    emg_stagger_delay = 0.0f;
	public int      emg_bogie_idx = 0;

	// --- WSP (Wheel Slide Protection) ---
	public bool   wsp_active = false;
	public float  wsp_vent_timer = 0.0f;
	public float  wsp_slide_factor = 0.0f; // 0.0 = Good Adhesion, 1.0 = Slide
	public float  next_WSPLog_time = 0.0f;
	public bool   log_wsp_active = false;

	public int GetThaiCharType(string ch) {
		if (ch == "่" or ch == "้" or ch == "๊" or ch == "๋" or ch == "์") return 3; // Tone Marks (Above)
		if (ch == "ิ" or ch == "ี" or ch == "ึ" or ch == "ื" or ch == "ุ" or ch == "ู" or ch == "ั" or ch == "ํ" or ch == "็" or ch == "๎") return 2; // Vowels (Above/Below)
		return 1; // Generic Base
	}


	public bool IsThaiNonSpacing(string ch) {
		int type = GetThaiCharType(ch);
		return (type == 2 or type == 3);
	}

	// Safe UTF-8 parser for GameScript (which treats strings as byte arrays).
	// Thai UTF-8 characters are 3 bytes long and ALWAYS start with 0xE0.
	// We capture the 0xE0 prefix from a known Thai character literal to avoid compile errors.
	public string[] GetUTF8Chars(string text) {
		string[] chars = new string[0];
		int i = 0;
		if (text.size() == 0) return chars;
		
		string thaiPrefix = "ก"[0, 1]; // Extracts 0xE0
		
		while (i < text.size()) {
			string b = text[i, i+1];
			if (b == thaiPrefix) {
				// 3-byte Thai character
				if (i + 3 <= text.size()) {
					chars[chars.size()] = text[i, i+3];
					i = i + 3;
				} else {
					chars[chars.size()] = text[i, text.size()];
					i = text.size();
				}
			} else {
				// 1-byte ASCII (or unsupported multi-byte)
				chars[chars.size()] = b;
				i++;
			}
		}
		return chars;
	}

	// --- LCD Config (beta) ---
	public bool     lcd_manual_dirty = false;
	public string[] lcd_config_lines = new string[9];
	public string[] lcd_rendered_lines = new string[9];
	public Soup     lcdSelectionStates;
	public Soup     lcd_config_pages;
	public bool[]   lcd_page_enabled = new bool[5];
	public int      lcd_edit_page_idx = 0;
	public int      lcd_active_page_idx = 0;
	public bool     link_on_focus_loss_auto_apply = true;

	// Virtual Keyboard State
	public bool     lcd_power = false;
	public float 	lcd_brightness = 5.0f;     // RAW 0-30 (Def: 5.0)
	public float 	lcd_last_brightness = 5.0f;

	public string[] lcd_lines_en = new string[9];
	public string[] lcd_config_lines_th = new string[9];
	public bool     lcd_swap_enabled = false;
	public float    lcd_swap_timer_start = 0.0f;
	public float    lcd_swap_period = 20.0f;
	public int      lcd_current_lang = 0; // 0 = TH, 1 = EN
	
	// LCD Sign Routing (Moved to base for common access)
	public int 		lcd_origin = 0;
	public int 		lcd_dest = 1;
	public int 		lcd_train_idx = 0;
	public bool 	lcd_is_blank = false;
	public bool     lcd_factory = false;   // Factory LED mode
	public int      lcd_override_id = -1;  // -1: Route, 14: Blank, 15: Factory
	public bool 	loadElectrical = false; // Moved to base for LCD power check
	public bool     is_lcd_modal_open = false; // Background dimming flag
	public float    lcd_next_sync_time = 0.0f; // Debug throttle timer
	public int      lcd_pending_row = -1;      // -1: idle, 0-8: currently updating row X
	public string[] lcd_processed_vars = new string[9]; // Cache for ProcessLCDVars results
	public int      car_number_offset = 0;
	public bool     lcd_force_zero = false;
	public Soup     lcdForceZeroSelection;
	public int      car_num_mode = 2; // 0=Front, 1=Rear, 2=APVC (Auto)
	public string   pending_template_id = "";

	public string GetLCDEditLineDefault(int pageIdx, int lineIdx) {
		if (lineIdx < 0 or lineIdx >= 9) return "";
		if (pageIdx == 0) return lcd_config_lines_th[lineIdx];
		if (pageIdx == 1) return lcd_lines_en[lineIdx];
		return "";
	}

	// Cache for each slot: [row][col] -> "fontIdx,brightness"
	public Soup     lcd_slot_cache; 
	public float    last_gen_broadcast_voltage = -1.0f;
	public float    last_gen_broadcast_kW = -1.0f;
	public float    last_gen_broadcast_mr = -1.0f;

	// --- [Smart Mesh-LOD] Camera-Distance Based Interior Visibility ---
	public float  lod_next_check_time   = 0.0f;  // Throttle: poll every 0.5s
	public bool   lod_interior_visible  = true;  // Current baseline state (starts visible)
	public bool   lod_target_visible    = true;  // Goal state (true = show, false = hide)
	public float  lod_next_step_time    = 0.0f;  // Time for next stagger step
	public int    lod_step_index        = -1;    // Current mesh index being toggled (-1 = idle)
	public bool   lod_init_done         = false; 

	// General Passenger & Seat states (Moved from subclasses for LOD access)
	public bool   m_isDaySeat           = false;
	public int    m_intSeatCoachType    = 0;

	public void StateInit(void)
	{
		int i;
		if (lcd_config_lines.size() != 9) lcd_config_lines = new string[9];
		if (lcd_rendered_lines.size() != 9) lcd_rendered_lines = new string[9];
		// Ensure lcd_lines_en and lcd_config_lines_th are also initialized to size 9 if they aren't already
		if (lcd_lines_en.size() != 9) lcd_lines_en = new string[9];
		if (lcd_config_lines_th.size() != 9) lcd_config_lines_th = new string[9];

		for (i = 0; i < 9; i++) {
			if (lcd_config_lines[i] == null) lcd_config_lines[i] = "";
			if (lcd_rendered_lines[i] == null) lcd_rendered_lines[i] = "";
			if (lcd_lines_en[i] == null) lcd_lines_en[i] = "";
			if (lcd_config_lines_th[i] == null) lcd_config_lines_th[i] = "";
			if (lcd_processed_vars[i] == null) lcd_processed_vars[i] = "";
		}
		if (!lcdSelectionStates) lcdSelectionStates = Constructors.NewSoup();
		if (!lcd_config_pages) lcd_config_pages = Constructors.NewSoup();
		if (!lcd_slot_cache) lcd_slot_cache = Constructors.NewSoup();
	}
};

class CNR_State_GenCoach isclass CNR_State_Base {

	// System Event Timers
	public float 	next_FuelConsumptionSystem_time = 0.0f;
	public float 	next_GeneratorLoadEvent_time = 0.0f;
	public float 	next_GeneralCheckSystem_time = 0.0f;
	public float 	next_UIRefresh_time = 0.0f;
	public int      monitor_power_subpage = 0;
	public int      monitor_brakes_subpage = 0;
	public float 	lcd_dirty_timer = 0.0f;

	public float 	next_EngineFanCoolerEvent_time = 0.0f;
	public float 	next_DynamicSmokeEffect_time = 0.0f;

	// Property Browser
	public Browser  activeBrowser;
	public Browser  m_modalBrowser;

	// Engine & Generator Systems
	public bool 	m_EngineStats1 = false;
	public bool 	m_EngineStats2 = false;
	public bool 	engine1_ready = false;
	public bool 	engine2_ready = false;
	public bool 	isRPMFlowing1 = false;
	public bool 	isRPMFlowing2 = false;
	public bool 	m_EngineCheck_1 = false;
	public bool 	toggleEngineSelector1 = false;
	public bool 	toggleEngineSelector2 = false;
	public float 	fuel_consumed = 0.0f;
	public float 	startup_spike = 0.0f;
	public bool 	engine1Loading = false;
	public bool 	engine1Loaded = false;
	public bool 	engine1Download = false;
	public bool 	engine2Loading = false;
	public bool 	engine2Loaded = false;
	public bool 	engine2Download = false;
	public int  	primary_engine = 1; // 1 or 2, determines which is backup
	public bool 	auto_start_e1_blocked = false; // Prevents auto-start E1 if manually stopped
	public bool 	auto_start_e2_blocked = false; // Prevents auto-start E2 if manually stopped
	public float	auto_start_backup_timer = 0.0f; // Sustained >80% timer before auto-starting backup (30s)
	public bool   	alert_low_mr_active = false;
	public bool   	alert_high_temp_active = false;
	public bool   	alert_crit_temp_active = false;
	public float  	next_CheckSystemsFaults_time = 0.0f;
	
	// RTOS Resource Simulation (Industrial ARM Specs)
	public float    rtos_cpu_load = 0.0f;
	public float    rtos_mem_load = 0.0f;
	public float    rtos_gpu_load = 0.0f;
	public float    rtos_jitter = 0.0f;
	public float    next_RTOS_tick = 0.0f;


	// Detailed Engine Simulated Stats
	public float 	eng1_rpm = 0.0f;
	public float 	eng1_temp = 30.0f;
	public float 	eng1_oil_press = 0.0f;
	public float 	eng1_fuel_flow = 0.0f;

	public float 	eng2_rpm = 0.0f;
	public float 	eng2_temp = 30.0f;
	public float 	eng2_oil_press = 0.0f;
	public float 	eng2_fuel_flow = 0.0f;

	// Electrical & Cooling Systems
	public bool 	toggleLoadElectrical = false;
	public float 	loadElectrical_delay_timer = 0.0f;
	public float 	hep_stability_timer = 0.0f;
	public float 	auto_stop_timer = 0.0f;
	public float 	last_GeneratorLoadEvent_time = 0.0f;

	// --- Overload Protection System ---
	public float    overload_97_timer = 0.0f;      // Timer for >97% load (Tier 1: Disconnect HEP at 30s)
	public float    overload_100_timer = 0.0f;     // Timer for >100% load (Tier 2: Shutdown Engines at 60s)
	public float    engine_lockout_timer = 0.0f;   // Cooldown/Alarm timer (60s) after Tier 2 trip
	public float 	Eloaded = 0.0f;
	public float 	gen_kW = 0.0f;
	public float 	gen_Amps = 0.0f;
	public float 	gen_V_AC = 0.0f;
	public float 	gen_V_DC = 0.0f;
	public float 	gen_A_DC = 0.0f;
	public float	gen_V_DC24 = 0.0f;
	public float	gen_A_DC24 = 0.0f;
	public bool 	coolerSystem = false;

	// Door & Platform Systems
	public bool 	isDoorOpen = false;
	public bool 	m_GWDoorFront = false;
	public bool 	m_GWDoorEnd = false;
	public bool 	m_INTDoorFront = false;
	public bool 	m_INTDoorEnd = false;
	public bool 	m_PSGdoorleft = false;
	public bool 	m_PSGdoorright = false;
	public bool 	toggleDoorInterlock = true;

	public int 		modal_mode = 0;

	public int 		lcd_bak_origin = 0;
	public int 		lcd_bak_dest = 1;
	public int 		lcd_bak_train_idx = 0;
	public bool 	lcd_bak_is_blank = false;
	public bool     lcd_bak_factory = false;
	public int      lcd_bak_override_id = -1;

	// Passenger & Interior Elements
	public int 		m_intShadeOpenRandomizer;
	public float 	m_intSeatDelayRandomizer;
	public float 	m_intShadeDelayRandomizer;
	public float 	m_pipeDelayRandomizer;

	// Utilities
	public int 		engineExhaust;
	public bool 	isRevving1 = false;
	public bool 	isRevving2 = false;

	// Additional Coach State
	public int  	m_intExteriorType = 0;

	// --- MR Air System (Script-simulated Compressor + Governor) ---
	public float  mr_press_internal = 8.5f;    // MR pressure bar (script simulation)
	public float  cr_press_internal = 8.5f;    // CR tank pressure bar (script simulation)
	public bool   mr_compressor_running = false;
	public int    mr_comp1_state = 0;     // 0=Off 1=Starting 2=Running 3=Stopping
	public int    mr_comp2_state = 0;     // 0=Off 1=Starting 2=Running 3=Stopping
	public float  mr_comp1_timer = 0.0f;
	public float  mr_comp2_timer = 0.0f;
	public float  next_MRAirSystem_time = 0.0f;

	// Announcement System
	public int    lcd_subpage = 0;          // 0=Signboard, 1=Announcement
	public int    ann_mode = 0;             // 0=Manual, 1=Auto
	public int    ann_active_id = 0;        // Currently selected announcement (0=none)
	public int    ann_sound_lang = 0;       // Sound language: 0=EN, 1=TH, 2=JP, 3=ZH
	public bool   ann_playing = false;      // Is announcement currently playing?
	public int    ann_scan_mode = 0;        // 0=Station Match (vs LCD dest), 1=All Objects
	public string ann_scan_result = "";     // Latest scan result name
	public string ann_scan_matched = "";    // Name of matched station (if any)
	public float  ann_scan_dist = -1.0f;   // Latest scan distance in metres (-1 = not yet scanned)
	public float  ann_scan_match_dist = -1.0f; // Distance of matched station
	public float  next_ann_scan_time = 0.0f;
	public int    ann_last_auto_id = 0;     // Last auto-triggered ann_id to avoid repeated plays
	public string ann_scan_pending_action = ""; // Pending action from scanner to dispatch to coach
	public int    ann_svc_idx   = -1;
	public int    ann_next_stop = -1;
	public string ann_next_stop_name = ""; // "StationName (HH:MM)" from schedule

	// --- Cross-Vehicle Sync Stagger ---
	public int    sync_stagger_idx = -1;   // Pointer for staggered SetProperties sync (1 vehicle/tick)

	// --- Staggered Load Reading Cache ---
	public float[] cached_coach_loads = new float[0]; // Per-vehicle load cache (refreshed 1/tick)
	public int    load_read_stagger_idx = 0;           // Pointer for staggered GetProperties read
	// [Added state variables]
	public float 	odo_total = 0.0f;
	public float 	brake_dist_val = 0.0f;
	public bool     is_braking_test = false;
	public float    brake_start_odo = 0.0f;
	public float    last_eval_time = 0.0f;
};



class CNR_State_PassCoach isclass CNR_State_Base {
	// System Event Timers
	public float 	next_CnrFunctionHandler_time = 0.0f;
	public float 	next_DirectionMonitor_time = 0.0f;
	public float 	next_GeneralCheckSystem_time = 0.0f;
	public float 	next_UIRefresh_time = 0.0f;

	// Property Browser
	public Browser  activeBrowser;

	// Seat & Interior
	// (m_isDaySeat and m_intSeatCoachType moved to CNR_State_Base)

	// Stairway System
	public bool 	target_stairway_right = false;
	public bool 	target_stairway_left = false;
	public float 	delay_stairway_right_time = 0.0f;
	public float 	delay_stairway_left_time = 0.0f;

	// External Door States
	public bool 	m_GWDoorFront = false;
	public bool 	m_GWDoorEnd = false;
	public bool 	m_INTDoorFront = false;
	public bool 	m_INTDoorEnd = false;
	public bool 	m_INTDoorBeFRONT = false;
	public bool 	m_PSGdoorleft = false;
	public bool 	m_PSGdoorright = false;

	// Electrical pass-through
	public float	gen_V_DC24 = 0.0f;
	public float	gen_A_DC24 = 0.0f;
	public float	script_mr_press = 0.0f;
	public float	current_load = 0.0f;
	public int  	m_intExteriorType = 0;

	// Timing
	public float 	next_onSignalLightChange_time = 0.0f;

	// Door Interlock
	public bool 	toggleDoorInterlock = true;

	// LCD Sync Timer
	public float 	next_DirectLCDSync_time = 0.0f;
};

// ============================================================
// Shared Cab State Base (Gangway connect logic + timers)
// ============================================================
class CNR_State_CabBase isclass CNR_State_Base {

	// Auto-close timers
	public float	auto_close_door_gangway_front = 0.0f;
	public float	auto_close_door_gangway_end = 0.0f;
	public float	auto_close_door_gangway_int_front = 0.0f;
	public float	auto_close_door_gangway_int_end = 0.0f;

	// Gangway connect state machine
	public string	gangway_connect_direction = "";
	public float	gangway_connect_start_time = 0.0f;
	public float	gangway_connect_close_time = 0.0f;
	public float	gangway_connect_next_attempt_time = 0.0f;
	public int		gangway_connect_attempt = 0;
	public Vehicle	target_gangway_veh;
	public string	target_neighborSide = "";

	// Common timers
	// Common timers
	public float	next_CnrLoadMeshInit_time = 0.0f;
	public int      last_cam_in_interior = -1; // [Optimization] -1: uninit, 0: exterior, 1: interior
};

// ============================================================
// CNR_State_AnfCab — ANF Air-conditioned sleeper cabin state
// ============================================================
class CNR_State_AnfCab isclass CNR_State_CabBase {
	public float	next_CnrAirGaugeInit_time = 0.0f;
	public float	next_CnrFunctionHandler_time = 0.0f;

	// Auto lamp states for gangway LEDs
	public int		autoLamp_gangway_state = 0;
	public float	autoLamp_gangway_next = 0.0f;
	public int		autoLamp_int_front_state = 0;
	public float	autoLamp_int_front_next = 0.0f;
	public int		autoLamp_int_end_state = 0;
	public float	autoLamp_int_end_next = 0.0f;
};

// ============================================================
// CNR_State_AnsCab — ANS/ANSH reversed-cabin state
// ============================================================
class CNR_State_AnsCab isclass CNR_State_CabBase {
	public float	next_CnrAirGaugeInit_time = 0.0f;
	public float	next_CnrFunctionHandler_time = 0.0f;

	// Auto lamp states
	public int		autoLamp_gangway_state = 0;
	public float	autoLamp_gangway_next = 0.0f;
	public int		autoLamp_int_front_state = 0;
	public float	autoLamp_int_front_next = 0.0f;
	public int		autoLamp_int_end_state = 0;
	public float	autoLamp_int_end_next = 0.0f;
};

// ============================================================
// CNR_State_ArcCab — ARC restaurant/dining car cabin state
// ============================================================
class CNR_State_ArcCab isclass CNR_State_CabBase {
	// ARC has no air gauge or function handler timers at this time

};

class CNR_ScriptLibrary isclass Library {
    public void Init(void){
    }

    public string LibraryCall(string method, string[] args, GSObject[] gso){
        return "ERROR:unsupported_method";
    }
};
