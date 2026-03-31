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

include "cnr_state.gs"
include "cnr_auth.gs"
include "cnr_acs_system.gs"
include "cnr_systems.gs"
include "cnr_dmi_kernel.gs"

class cnr_pass_main isclass Vehicle{
	CNR_State_PassCoach state;


	///// ----- 顧客データ検証システムの変数を宣言する | こきゃくDataけんしょうSystem ----- /////
	Library 		m_scriptLib; // reference to AccessAuthLibrary
	CNR_AuthHandler authHelper;
	CNR_State_Auth 	authState;
	CNR_AcsSystem 	acsSystem;
	CNR_Systems 	cnrSystems;
	
	Asset 			textureAsset, 
					soundsAsset;

	// -- 「CNR」車両の供給システムの変数を宣言する | 「CNR」しゃりょうのきょうきゅうSystemのへんすうをせんげんする -- //
	void 			CnrFunctionHandler(float currentTime);
	void 			onSignalLightChange(float currentTime);
	void 			GeneralCheckSystem(float currentTime);
	void 			onInteriorChange();

	thread void 	MainLoop();

	float GetNormalTimeInMin(){
		float h = World.GetGameTime() + 0.5;
		if (h > 1) h = h - 1;
		h = h*24*60;
		return h;
	}

	public void PropertyBrowserRefresh(Browser browser) {
		if (state) {
			state.activeBrowser = browser;
			state.isUIVisible = true;
			state.next_UIRefresh_time = World.GetTimeElapsed() + 0.5f;
			me.Sniff(cast<GameObject>browser, "Browser", "Closed", true);
		}
		inherited(browser);
	}

	void PropertyBrowserHandler(Message msg) {
		if (msg.minor == "Closed") {
			if (state) {
				state.isUIVisible = false;
				state.activeBrowser = null;
			}
			me.Sniff(cast<GameObject>msg.src, "Browser", "Closed", false);
		}
	}

	void PrintDebug(string message){
		if(state.isDebug)
			Interface.Print("[" + me.GetLocalisedName() + "] Debug Log > " + message);
	}

	// Lerp moved to CNR_Systems
	
	bool AuthSystem(){
		if (!authHelper) authHelper = new CNR_AuthHandler();
		if (!authState) authState = new CNR_State_Auth();

		authHelper.Verify(authState, m_scriptLib);

		if(authState.isVerify){
			authState.userName = authState.userName;
			authState.userEmail = authState.userEmail;
			authState.userKey = authState.userKey;
			authState.userPurchaseDate = authState.userPurchaseDate;
			authState.isVerify = true; // map to local var
		}

		PrintDebug("[AuthSystem] Auth Result: " + authState.isVerify);
		SetMeshVisible("default",authState.isVerify,0);
		return authState.isVerify;
	}

	void LoadAssets(){
		PrintDebug("[Boot-up] LoadAsset is Loading...!");
		Asset asset = 		GetAsset();
		textureAsset = 		asset.FindAsset("texture-asset");
		soundsAsset	= 		asset.FindAsset("sounds-asset");

		//เรียกระบบ Auto Coupling System Library
		Soup kuidSoupLoad = asset.GetConfigSoup().GetNamedSoup("kuid-table");
		KUID kuid_acs = null;
		if (kuidSoupLoad) kuid_acs = kuidSoupLoad.GetNamedTagAsKUID("acslib");
		
		Library acsLib = null;
		if (kuid_acs) acsLib = World.GetLibrary(kuid_acs);
		else Interface.Print("cnr_pass_coach.gs: 'acslib' not found in kuid-table");
		float sleepRandomiser = Math.Rand(2.25, 3.75);
		
		if (!acsSystem) acsSystem = new CNR_AcsSystem();
		acsSystem.Init(me, acsLib, sleepRandomiser, "front");

		PrintDebug("[Boot-up] LoadAsset is Loaded!");
	}
	
	void LoadSystem(){
		LoadAssets();
		PrintDebug("[Boot-up] LoadSystem is Loading...!");

		acsSystem.UpdateCarPosition();

		if(GetMyTrain()){
			// [Optimization] Cache initial train size
			state.cached_train_size = GetMyTrain().GetVehicles().size();

			AddHandler(me,"Vehicle","Coupled","CouplerHandler");		//Handler การพ่วงขบวน
			AddHandler(me,"Vehicle","Decoupled","CouplerHandler");		//Handler การถอดพ่วงออก

			AddHandler(me, "Vehicle", "Coupled", "VehicleCoupleHandler");
			AddHandler(me, "Vehicle", "Decoupled", "VehicleDecoupleHandler");
			AddHandler(me, "Vehicle", "Derailed", "VehicleDerailHandler");
			AddHandler(me, "Vehicle", "BadCouple", "VehicleCoupleHandler");
			AddHandler(me, "World", "ModuleInit", "VehicleDecoupleHandler");
			AddHandler(me, "Train", "StoppedMoving", "FlyShuntHandler");
			AddHandler(me, "ACScallback", "", "ACShandler");			//ตรวจเช็คระบบ ACS Handler
			PostMessage(me,"pfx","-0-1",0.15f);

			//เรียกการทำงานของระบบ ACS เข้ามาใช้ใน Script นี้
			PostMessage(me, "ACScallback", "DelayedRecalc", 1.0f + acsSystem.m_sleepRandomiser);
			if (!GetMyTrain().GetFrontmostLocomotive()){
			  	PostMessage(me, "ACScallback", "DisablePhysics", 1.0f + acsSystem.m_sleepRandomiser);
			}
		}

		//สั่งให้ฟังก์ชั่นทั้งหมดทำงาน
		onInteriorChange();
		
		MainLoop();

		PostMessage(me,"pfx","-0-1-2-3-4-5",1.0f);
		PrintDebug("[Boot-up] LoadSystem is Loaded!");
	}

	public void Init(void){
		state = new CNR_State_PassCoach();
		state.StateInit();
		acsSystem = new CNR_AcsSystem();

		cnrSystems = new CNR_Systems();

		inherited();
		
		// [Optimization] Set local state only. 
		// Init() runs on EVERY car during placement; calling ToggleCoachAnimation 
		// (which scans the whole train) here causes O(N^2) lag on large consists.
		me.SetMeshAnimationState("dummy-platform-selector", state.togglePlatform);

		state.resetBrakeStates = Constructors.NewSoup();
		state.doorSelectionStates = Constructors.NewSoup();
		state.interlockSelectionStates = Constructors.NewSoup();
		state.system_logs = Constructors.NewSoup();
		state.InitTranslations();

		// Randomize initial MR/CR pressure (0-6 bar) for testing
		float randP = Math.Rand(0.0f, 6.0f);
		state.script_mr_press = randP;
		state.script_cr_press = randP;
		AddHandler(me, "Browser", "Closed", "PropertyBrowserHandler");
		AddHandler(me, "Interface-Property-Change", "", "InterfacePropertyChangeHandler");
		AddHandler(me, "Animation-Event", "", "AnimationEventHandler");

		Asset asset = GetAsset();
		if (asset) {
			// ใช้ GetConfigSoup() แทน LookupKUIDTable เพื่อป้องกัน Crash ถ้าไม่เจอ Key
			Soup kuidSoup = asset.GetConfigSoup().GetNamedSoup("kuid-table");
			KUID kuid_script = null;
			KUID kuid_texture = null;
			KUID kuid_sounds = null;

			if (kuidSoup) {
				kuid_script = kuidSoup.GetNamedTagAsKUID("scriptlib");
				kuid_texture = kuidSoup.GetNamedTagAsKUID("texture-asset");
				kuid_sounds = kuidSoup.GetNamedTagAsKUID("sounds-asset");
			}

			if (!kuid_script or !kuid_texture or !kuid_sounds) {
				m_scriptLib = null;
			} else {
				m_scriptLib = World.GetLibrary(kuid_script);
			}
		}

		if(AuthSystem() == true){
			string assetName = GetAsset().GetLocalisedName();
			state.isAPVC = (Str.Find(assetName, "APVC", 0) != -1);
			state.isANF = (Str.Find(assetName, "ANF", 0) != -1);
			state.isARC = (Str.Find(assetName, "ARC", 0) != -1);
			LoadSystem();
		}
	}

	void UpdateLocalLCDSigns(void) {
		state.lcd_manual_dirty = true;
		cnrSystems.UpdateLCDTextureState(me, state, true);
	}

	// DirectSyncLCDFromAPVC has been removed
	// Remove UpdateLCDHandler as it is replaced by staggered row processing in MainLoop
	thread void MainLoop() {
		while(true) {
			float currentTime = World.GetTimeElapsed();
			
			CnrFunctionHandler(currentTime);
			onSignalLightChange(currentTime);
			GeneralCheckSystem(currentTime);
			cnrSystems.DoorInterlockEvent(me, state, currentTime);
			cnrSystems.BrakeIndicatorEvent(me, state, currentTime);

			// [Optimization] Stagger simulations 
			// Instead of every 0.05s, run these at different offsets
			float stagger = (float)(me.GetId() % 5) * 0.01f;
			if (currentTime + stagger >= state.next_BrakeSoundEvent_time)
				cnrSystems.BrakeSoundEvent(me, state, currentTime);
			
			if (currentTime + stagger >= state.aircon_next_time)
				cnrSystems.EventAirConditional(me, state, currentTime);
			
			if (currentTime + stagger >= state.toilet_next_time)
				cnrSystems.EventFlushingToilet(me, state, currentTime);
			
			cnrSystems.UpdateCurrentLoad(me, state);
			cnrSystems.LCDUpdateLoop(me, state, currentTime);

			// [Optimization] Staggered LCD Update Processing
			// Update one row per tick (20 ticks/sec) to prevent frame drops
			if (state.lcd_pending_row >= 0) {
				cnrSystems.UpdateLCDTextureState(me, state, false);
				state.lcd_pending_row++;
				if (state.lcd_pending_row > 8) state.lcd_pending_row = -1;
			}

			// Update core simulation systems (Passenger)
			cnrSystems.WSPControl(me, state, 0.05f);
			cnrSystems.PhysicalBrakeUpdate(me, state, m_scriptLib);

			
			if (currentTime + stagger >= state.next_DiscThermal_time)
				cnrSystems.DiscBrakeThermal(me, state, currentTime, 0.05f);
			
			if (currentTime + stagger >= state.next_BrakePipeMonitor_time)
				cnrSystems.BrakePipeMonitor(me, state, currentTime);

			if (state.delay_stairway_right_time > 0 and currentTime >= state.delay_stairway_right_time) {
				me.SetMeshAnimationState("stairway_right",state.target_stairway_right);
				state.delay_stairway_right_time = 0.0f;
			}
			if (state.delay_stairway_left_time > 0 and currentTime >= state.delay_stairway_left_time) {
				me.SetMeshAnimationState("stairway_left",state.target_stairway_left);
				state.delay_stairway_left_time = 0.0f;
			}

			if (state.door_sound_left_req != 0) {
				if (state.m_EngineStats and state.door_sound_left_req < 3) {
					if (state.door_sound_left_req == 1) {
						PlaySoundScriptEvent("door_open");
						state.door_sound_left_end = currentTime + 4.357f;
					} else {
						PlaySoundScriptEvent("door_close");
						state.door_sound_left_end = currentTime + 5.549f;
					}
					state.door_sound_left_req = 3;
				}
			}
			if (state.door_sound_left_req == 3 and currentTime >= state.door_sound_left_end) {
				StopSoundScriptEvent("door_open"); StopSoundScriptEvent("door_close");
				state.door_sound_left_req = 0;
			}

			if (state.door_sound_right_req != 0) {
				if (state.m_EngineStats and state.door_sound_right_req < 3) {
					if (state.door_sound_right_req == 1) {
						PlaySoundScriptEvent("door_open");
						state.door_sound_right_end = currentTime + 4.357f;
					} else {
						PlaySoundScriptEvent("door_close");
						state.door_sound_right_end = currentTime + 5.549f;
					}
					state.door_sound_right_req = 3;
				}
			}
			if (state.door_sound_right_req == 3 and currentTime >= state.door_sound_right_end) {
				StopSoundScriptEvent("door_open"); StopSoundScriptEvent("door_close");
				state.door_sound_right_req = 0;
			}

			if (state.isUIVisible and state.activeBrowser and currentTime >= state.next_UIRefresh_time) {
				state.next_UIRefresh_time = currentTime + 0.5f;
				me.PropertyBrowserRefresh(state.activeBrowser);
			}

			Sleep(0.05f);
		}
	}

	void CnrFunctionHandler(float currentTime){
		if (currentTime < state.next_CnrFunctionHandler_time) return;
		state.next_CnrFunctionHandler_time = currentTime + 0.1f;

		state.m_EngineStats = (GetMeshAnimationFrame("dummy-load-electrical") > 0);
		
		// Map HEP state to local voltage so systems like Air Conditioning can function
		if (state.m_EngineStats) state.voltage = 1.0f;  // 100% stable voltage
		else state.voltage = 0.0f;                      // 0% voltage

		bool newLoad = state.m_EngineStats;
		if (newLoad != state.loadElectrical) {
			state.loadElectrical = newLoad;
			UpdateLocalLCDSigns();
		}
		
		bool meshPlat = (GetMeshAnimationFrame("dummy-platform-selector") > 0);
		if (meshPlat != state.togglePlatform) {
			state.togglePlatform = meshPlat;
		}
		
		state.m_DoorInterlock = (GetMeshAnimationFrame("dummy-doorinterlock") == 0);

		bool dummyL = (GetMeshAnimationFrame("dummy-door-left") > 0);
		if (dummyL != state.isDoorLeft) {
			if (state.isDoorLeft and !dummyL) state.door_sound_left_req = 2; 
			else if (!state.isDoorLeft and dummyL) state.door_sound_left_req = 1;

			state.isDoorLeft = dummyL;
			me.SetMeshAnimationState("left-passenger-cnr", dummyL);
		}

		bool dummyR = (GetMeshAnimationFrame("dummy-door-right") > 0);
		if (dummyR != state.isDoorRight) {
			if (state.isDoorRight and !dummyR) state.door_sound_right_req = 2;
			else if (!state.isDoorRight and dummyR) state.door_sound_right_req = 1;

			state.isDoorRight = dummyR;
			me.SetMeshAnimationState("right-passenger-cnr", dummyR);
		}

		bool targetStairL = false;
		if (!state.togglePlatform and state.isDoorLeft) targetStairL = true;
		
		bool targetStairR = false;
		if (!state.togglePlatform and state.isDoorRight) targetStairR = true;

		if (targetStairL != state.target_stairway_left) {
			state.target_stairway_left = targetStairL;
			SetMeshAnimationState("stairway_left", targetStairL);
		}
		if (targetStairR != state.target_stairway_right) {
			state.target_stairway_right = targetStairR;
			SetMeshAnimationState("stairway_right", targetStairR);
		}
		
		state.doorLeftReal = (GetMeshAnimationFrame("left-passenger-cnr") > 0.01f);
		state.doorRightReal = (GetMeshAnimationFrame("right-passenger-cnr") > 0.01f);
   	}

	void GeneralCheckSystem(float currentTime){
		if (currentTime < state.next_GeneralCheckSystem_time) return;
		state.next_GeneralCheckSystem_time = currentTime + 0.5f;

		if(me.GetVelocity() * 3.6 < -0.1) state.speed = me.GetVelocity() * -3.6;
		else state.speed = me.GetVelocity() * 3.6;

		state.mr_press = state.script_mr_press;
		state.bp_press = 98101.7 * (me.GetEngineParam("brake-pipe-pressure") - 0.00103341);
		state.bc_press = 98101.7 * (me.GetEngineParam("brake-cylinder-pressure") - 0.00103341);

		if(state.m_intSeatCoachType == 2){
			if(World.GetGameTime() >= 0.33 and World.GetGameTime() <= 0.75) state.m_isDaySeat = false;
			else state.m_isDaySeat = true;
			onInteriorChange();
		}

		// [Smart Mesh-LOD] Update interior visibility based on camera distance
		cnrSystems.LODUpdate(me, state, currentTime);
	}

	void onInteriorChange(){
		// [Smart Mesh-LOD] Don't force-show seats while LOD is hiding/revealing interior
		if (!state.lod_interior_visible) return;

		if(!state.m_isDaySeat or state.m_intSeatCoachType == 1){
			SetMeshVisible("ans_seat_night",true,0);
			SetMeshVisible("ans_seat_day",false,0);
		}
		else if(state.m_isDaySeat or state.m_intSeatCoachType == 0){
			SetMeshVisible("ans_seat_night",false,0);
			SetMeshVisible("ans_seat_day",true,0);
		}
		else if(state.m_intSeatCoachType == 2){
			if(!state.m_isDaySeat == 1){
				SetMeshVisible("ans_seat_night",true,0);
				SetMeshVisible("ans_seat_day",false,0);
			}
			else if(state.m_isDaySeat == 0){
				SetMeshVisible("ans_seat_night",false,0);
				SetMeshVisible("ans_seat_day",true,0);
			}
		}
	}

	void onSignalLightChange(float currentTime){
		cnrSystems.onSignalLightChange(me, state, currentTime, textureAsset);
	}

	void CouplerHandler(Message msg){
		// [Optimization] Update cached train size on any consist change
		if (GetMyTrain()) state.cached_train_size = GetMyTrain().GetVehicles().size();

		if(msg.src == me){
			if(msg.minor == "Decoupled"){
				if(me.GetDirectionRelativeToTrain())
					World.PlaySound(soundsAsset,"sounds/external/decoupling.wav",1,1.0,10.0,me,"a.limfront");
				else
					World.PlaySound(soundsAsset,"sounds/external/decoupling.wav",1,1.0,10.0,me,"a.limback");

				return;
			}

			if(msg.minor == "Coupled"){
				if(me.GetDirectionRelativeToTrain())
					World.PlaySound(soundsAsset,"sounds/external/coupling.wav",1,1.0,10.0,me,"a.limfront");
				else
					World.PlaySound(soundsAsset,"sounds/external/coupling.wav",1,1.0,10.0,me,"a.limback");
				
				return;
			}
		}
	}

	public string TrimMass(float floatmass) {
		floatmass = floatmass / 1000;
		string mass = ((string)(float)floatmass);

		if (floatmass < 100) Str.Left(mass,5);
		else if (floatmass >= 100 and floatmass < 1000) Str.Left(mass,6);
		else Str.Left(mass,7);

		return mass;
	}

	public string TrimLength(float floatlength) {
		string length = ((string)(float)floatlength);

		if (floatlength < 100) Str.Left(length,5);
		else if (floatlength >= 100 and floatlength < 1000) Str.Left(length,6);
		else Str.Left(length,7);
	
		return length;
	}

	public int NumWagonsInTrain(Train train) {
		Vehicle[] vehicles = GetMyTrain().GetVehicles();
		int numwags = 0;
		int i;
		
		for(i = 0; i < vehicles.size(); i++) {
			if(!vehicles[i].isclass(Locomotive)) numwags++;
		}

		return numwags;
	}

	public void SetProperties(Soup soup){
	  	inherited(soup);
		if (!state) {
			state = new CNR_State_PassCoach();
			state.StateInit();
		}
		state.handbrake = soup.GetNamedTagAsBool("handbrake", state.handbrake);

	  	state.signal_lamp_mode = soup.GetNamedTagAsInt("signal_lamp_mode", state.signal_lamp_mode);
	  	state.m_GWDoorFront = soup.GetNamedTagAsBool("toggleGWDoorFront", state.m_GWDoorFront);
	  	state.m_GWDoorEnd = soup.GetNamedTagAsBool("toggleGWDoorEnd", state.m_GWDoorEnd);
	  	state.m_INTDoorFront = soup.GetNamedTagAsBool("toggleINTDoorFront", state.m_INTDoorFront);
	  	state.m_INTDoorEnd = soup.GetNamedTagAsBool("toggleINTDoorEnd", state.m_INTDoorEnd);
	  	state.m_INTDoorBeFRONT = soup.GetNamedTagAsBool("toggleINTDoorBeFRONT", state.m_INTDoorBeFRONT);
	  	state.m_PSGdoorleft = soup.GetNamedTagAsBool("toggleDoorLeft", state.m_PSGdoorleft);
	  	state.m_PSGdoorright = soup.GetNamedTagAsBool("toggleDoorRight", state.m_PSGdoorright);
	  	state.m_intExteriorType = soup.GetNamedTagAsInt("toggleLiveryExterior", state.m_intExteriorType);
	  	state.togglePlatform = soup.GetNamedTagAsBool("state.togglePlatform", state.togglePlatform);
	  	state.showAdvancedView = soup.GetNamedTagAsBool("showAdvancedView", state.showAdvancedView);
		state.m_EngineStats = soup.GetNamedTagAsBool("engineStats", state.m_EngineStats);
		state.loadElectrical = soup.GetNamedTagAsBool("loadElectrical", state.loadElectrical);
		// [AC FIX] รับค่า voltage ที่ APVC broadcast มา เพื่อให้ AC system ทำงานได้
		state.voltage = soup.GetNamedTagAsFloat("voltage", state.voltage);
		state.frequency = soup.GetNamedTagAsFloat("frequency", state.frequency);
		state.lcd_origin = soup.GetNamedTagAsInt("lcd_origin", state.lcd_origin);
		state.lcd_dest = soup.GetNamedTagAsInt("lcd_dest", state.lcd_dest);
		state.lcd_train_idx = soup.GetNamedTagAsInt("lcd_train_idx", state.lcd_train_idx);
		state.lcd_active_page_idx = soup.GetNamedTagAsInt("lcd_active_page_idx", state.lcd_active_page_idx);
		
		int newMode = soup.GetNamedTagAsInt("car_num_mode", state.car_num_mode);
		if (state.car_num_mode != newMode) {
			state.car_num_mode = newMode;
			// Trigger redraw if changed via SetProperties (e.g. from broadcast)
			state.lcd_manual_dirty = true;
		}
		
		if (soup.GetNamedTagAsInt("lcd_packed_v2", 0) == 1) {
			// FAST PATH: packed format from BroadcastLCDConfig (6 tags instead of 45)
			string enables = soup.GetNamedTag("lcd_enables"); // "1;0;1;0;1"
			string[] enbParts = Str.Tokens(enables, ";");
			bool changed = false;
			int p2;
			for (p2 = 0; p2 < 5; p2++) {
				bool newEn = state.lcd_page_enabled[p2];
				if (enbParts.size() > p2) newEn = (enbParts[p2] == "1");
				if (state.lcd_page_enabled[p2] != newEn) { state.lcd_page_enabled[p2] = newEn; changed = true; }

				string packed = soup.GetNamedTag("lcd_p" + (string)p2);
				if (packed != "") {
					string[] lineParts = Str.Tokens(packed, ";");
					if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
					Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)p2);
					if (!pageSoup) { pageSoup = Constructors.NewSoup(); }
					int ln2;
					for (ln2 = 0; ln2 < 9; ln2++) {
						string val = "-";
						if (lineParts.size() > ln2) val = lineParts[ln2];
						if (val == "-") val = "";
						if (pageSoup.GetNamedTag("line_" + (string)ln2) != val) {
							pageSoup.SetNamedTag("line_" + (string)ln2, val);
							changed = true;
						}
					}
					state.lcd_config_pages.SetNamedSoup("page_" + (string)p2, pageSoup);
				}
			}
			// Metadata
			if (soup.GetIndexForNamedTag("lcd_brightness") != -1) {
				state.lcd_brightness = soup.GetNamedTagAsFloat("lcd_brightness", state.lcd_brightness);
				state.lcd_power = soup.GetNamedTagAsBool("lcd_power", state.lcd_power);
			}
			if (changed) {
				Soup activePageSoup = null;
				if (state.lcd_config_pages) activePageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_active_page_idx);
				if (activePageSoup) {
					int lIdx2;
					for (lIdx2 = 0; lIdx2 < 9; lIdx2++)
						state.lcd_config_lines[lIdx2] = activePageSoup.GetNamedTag("line_" + (string)lIdx2);
				}
				state.lcd_manual_dirty = true;
				PostMessage(me, "CNR-System", "UpdateLCD", 0.05f);
			}
		} else if (soup.GetNamedTagAsInt("has_lcd_save", 0) == 1) {
			// Legacy 45-tag format (map save/load backward compat)
			bool hasAnyPage = (soup.GetIndexForNamedTag("lcd_page_0_line_0") != -1);
			if (hasAnyPage) {
			int p;
			bool changed = false;
			for (p = 0; p < 5; p++) {
				bool newEn = soup.GetNamedTagAsBool("lcd_page_en_" + (string)p, state.lcd_page_enabled[p]);
				if (state.lcd_page_enabled[p] != newEn) {
					state.lcd_page_enabled[p] = newEn;
					changed = true;
				}

				if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
				Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)p);
				if (!pageSoup) { pageSoup = Constructors.NewSoup(); state.lcd_config_pages.SetNamedSoup("page_" + (string)p, pageSoup); }
				
				int ln;
				for (ln = 0; ln < 9; ln++) {
					string tag = "lcd_page_" + (string)p + "_line_" + (string)ln;
					string newVal = soup.GetNamedTag(tag);
					if (pageSoup.GetNamedTag("line_" + (string)ln) != newVal) {
						pageSoup.SetNamedTag("line_" + (string)ln, newVal);
						changed = true;
					}
				}
				state.lcd_config_pages.SetNamedSoup("page_" + (string)p, pageSoup);
			}
			if (!soup.GetNamedTagAsBool("lcd_new_save", false)) {
				Soup p1 = state.lcd_config_pages.GetNamedSoup("page_0");
				int i;
				for (i = 0; i < 9; i++) {
					string oldVal = soup.GetNamedTag("lcd_config_line_" + (string)i);
					p1.SetNamedTag("line_" + (string)i, oldVal);
					state.lcd_config_lines[i] = oldVal;
				}
			}
			float newBr = soup.GetNamedTagAsFloat("lcd_brightness", state.lcd_brightness);
			bool newPwr = soup.GetNamedTagAsBool("lcd_power", state.lcd_power);
			if (state.lcd_brightness != newBr or state.lcd_power != newPwr) {
				state.lcd_brightness = newBr;
				state.lcd_power = newPwr;
				changed = true;
			}
			state.lcd_override_id = soup.GetNamedTagAsInt("lcd_override_id", state.lcd_override_id);
			if (changed) {
				Soup activePageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_active_page_idx);
				if (activePageSoup) {
					int lIdx;
					for (lIdx = 0; lIdx < 9; lIdx++) {
						state.lcd_config_lines[lIdx] = activePageSoup.GetNamedTag("line_" + (string)lIdx);
					}
				}
				state.lcd_manual_dirty = true;
				PostMessage(me, "CNR-System", "UpdateLCD", 0.05f);
			}
			} // end hasAnyPage
		}
	}

	public Soup GetProperties(void){
		Soup soup = inherited();
		if (!soup) soup = Constructors.NewSoup();
		if (!state) return soup;
		soup.SetNamedTag("handbrake", state.handbrake);
		soup.SetNamedTag("signal_lamp_mode", state.signal_lamp_mode);
		soup.SetNamedTag("toggleGWDoorFront", state.m_GWDoorFront);
		soup.SetNamedTag("toggleGWDoorEnd", state.m_GWDoorEnd);
		soup.SetNamedTag("toggleINTDoorFront", state.m_INTDoorFront);
		soup.SetNamedTag("toggleINTDoorEnd", state.m_INTDoorEnd);
		soup.SetNamedTag("toggleINTDoorBeFRONT", state.m_INTDoorBeFRONT);
		soup.SetNamedTag("toggleDoorLeft", state.m_PSGdoorleft);
		soup.SetNamedTag("toggleDoorRight", state.m_PSGdoorright);
		soup.SetNamedTag("toggleLiveryExterior", state.m_intExteriorType);
		soup.SetNamedTag("state.togglePlatform", state.togglePlatform);
		soup.SetNamedTag("showAdvancedView", state.showAdvancedView);
		soup.SetNamedTag("engineStats", state.m_EngineStats);
		soup.SetNamedTag("airconState", state.aircon_state);
		soup.SetNamedTag("toiletState", state.toilet_state);
		soup.SetNamedTag("ac_temp", state.ac_temp);
		soup.SetNamedTag("ac_active", (state.aircon_state == 2));
		soup.SetNamedTag("wc_active", (state.toilet_state == 0));
		soup.SetNamedTag("isDoorLeft", state.isDoorLeft);
		soup.SetNamedTag("isDoorRight", state.isDoorRight);
		soup.SetNamedTag("doorLeftReal", state.doorLeftReal);
		soup.SetNamedTag("doorRightReal", state.doorRightReal);
		soup.SetNamedTag("doorInterlock", state.m_DoorInterlock);
		soup.SetNamedTag("door_interlock_bypass", (int)state.door_interlock_bypass);
		soup.SetNamedTag("door_interlock_speed", state.door_interlock_speed);

		soup.SetNamedTag("isMSTN", true);
		soup.SetNamedTag("MSTN_Type", 0);
		soup.SetNamedTag("script_mr_press", state.script_mr_press);
		soup.SetNamedTag("current_load", state.current_load);
		soup.SetNamedTag("gen_V_DC24", state.gen_V_DC24);
		soup.SetNamedTag("gen_A_DC24", state.gen_A_DC24);
		soup.SetNamedTag("script_cr_press", state.script_cr_press);
		soup.SetNamedTag("disc_temp", state.disc_temp);
		soup.SetNamedTag("brake_pipe_state", state.brake_pipe_state);

		// LCD: packed format (5 tags instead of 45) + backward-compat legacy save
		int p;
		string enables = "";
		if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
		for (p = 0; p < 5; p++) {
			if (p > 0) enables = enables + ";";
			if (state.lcd_page_enabled[p]) enables = enables + "1";
			else enables = enables + "0";
			string packed = "";
			Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)p);
			int ln;
			for (ln = 0; ln < 9; ln++) {
				if (ln > 0) packed = packed + ";";
				string txt = "";
				if (pageSoup) txt = pageSoup.GetNamedTag("line_" + (string)ln);
				if (txt == "") txt = "-";
				packed = packed + txt;
			}
			soup.SetNamedTag("lcd_p" + (string)p, packed);
		}
		soup.SetNamedTag("lcd_enables", enables);
		soup.SetNamedTag("lcd_packed_v2", 1);
		// Also write legacy tags for map save compat
		soup.SetNamedTag("has_lcd_save",  1);
		soup.SetNamedTag("lcd_new_save",  true);
		soup.SetNamedTag("lcd_brightness", state.lcd_brightness);
		soup.SetNamedTag("lcd_power",     state.lcd_power);
			soup.SetNamedTag("lcd_override_id",    state.lcd_override_id);
		soup.SetNamedTag("lcd_origin",          state.lcd_origin);
		soup.SetNamedTag("lcd_dest",            state.lcd_dest);
		soup.SetNamedTag("lcd_train_idx",       state.lcd_train_idx);
		soup.SetNamedTag("lcd_active_page_idx", state.lcd_active_page_idx);
		soup.SetNamedTag("loadElectrical",      state.loadElectrical);
		soup.SetNamedTag("car_num_mode",        state.car_num_mode);
		
		return soup;
	}

	public string GetAdvancedViewTable() {
		string table = "<table cellspacing=1 cellpadding=2 border=0 bgcolor=#555555>";
		table = table + "<tr bgcolor=#23486A><td><b>No.</b></td><td><b>Coach Name</b></td><td><b>BP<br>bar</b></td><td><b>MR</b></td><td><b>BC<br>bar</b></td><td><b>Load %</b></td><td><b>Air State</b></td><td><b>Doors (L/R)</b></td><td><b>Interlock</b></td><td><b>Lamp</b></td><td><b>Event (A/T)</b></td><td width=100><b>Brake Reset</b></td></tr>";
		
		Vehicle[] vehicles = GetMyTrain().GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			Vehicle v = vehicles[i];
			
			string bgColor = "#222222";
			if (i % 2 != 0) { bgColor = "#111111"; }
			if (v == me) { bgColor = "#444444"; }
			
			float bp = 98101.7 * (v.GetEngineParam("brake-pipe-pressure") - 0.00103341);
			float bc = 98101.7 * (v.GetEngineParam("brake-cylinder-pressure") - 0.00103341);
			float mr = 0.0f;

			Soup s = v.GetProperties();
			if (s) mr = s.GetNamedTagAsFloat("script_mr_press", 0.0f);

			string coachName = v.GetLocalisedName();
			string[] tokens = Str.Tokens(coachName, "|");
			if (tokens.size() > 0) coachName = tokens[tokens.size() - 1];
			string[] dashTokens = Str.Tokens(coachName, "-");
			if (dashTokens.size() > 0) coachName = dashTokens[0];

			int bp_i = (int)(bp / 10.0);
			string bp_s = (string)(bp_i / 10) + "." + (string)(bp_i % 10);
			int bc_i = (int)(bc / 10.0);
			string bc_s = (string)(bc_i / 10) + "." + (string)(bc_i % 10);

			string load = "0%";
			string airState = "OFF";
			string doors = "C / C";
			string interlock = "OFF";
			string lamp = "OFF";
			string events = "0 / 0";

			if (s and s.GetNamedTagAsBool("isMSTN", false)) {
				int lampModeInt = s.GetNamedTagAsInt("signal_lamp_mode", 0);
				if (lampModeInt == 1) lamp = "ON";
				else if (lampModeInt == 2) lamp = "OFF";
				else lamp = "AUTO";

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

				string doorL = "C"; if (s.GetNamedTagAsBool("isDoorLeft")) doorL = "O";
				string doorR = "C"; if (s.GetNamedTagAsBool("isDoorRight")) doorR = "O";
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
			table = table + "<td>" + bp_s + "</td>";
			table = table + "<td>X</td>";
			table = table + "<td>" + bc_s + "</td>";
			table = table + "<td>" + load + "</td>";
			table = table + "<td>" + airState + "</td>";
			table = table + "<td>" + doors + "</td>";
			table = table + "<td>" + interlock + "</td>";
			table = table + "<td>" + lamp + "</td>";
			table = table + "<td>" + events + "</td>";

			string resetStatus = "RESET";
			string resetLink = "resetBrake_" + (string)i;
			int rState = state.resetBrakeStates.GetNamedTagAsInt((string)i, 0);
			if (rState == 1) resetStatus = "<font color='#ebd302'>Resetting...</font>";
			else if (rState == 2) resetStatus = "<font color='#21fc0d'>Done</font>";
			else resetStatus = "<b><a href=live://property/" + resetLink + ">RESET</a></b>";

			table = table + "<td width=100>" + resetStatus + "</td>";
			table = table + "</tr>";
		}
		
		table = table + "</table>";
		return table;
	}

	public string GetStatusMonitorPanelHTML(void) {
		Vehicle[] vehicles = GetMyTrain().GetVehicles();
		int totalCars = vehicles.size();
		int i;

		string header = "<table width=460 bgcolor=#23486A cellspacing=1 cellpadding=3 border=0><tr><td colspan=2 align=center><b><font color=#FFFFFF>TRAIN STATUS MONITOR (DMI)</font></b></td></tr></table>";
		header = header + "<table width=460 bgcolor=#1A1A1A cellpadding=2 cellspacing=0 border=0><tr>";
		header = header + "<td align=left><font size=5 color=#EBD302><b>CNP DMI v2.0</b></font></td>";
		header = header + "<td align=right><font size=2 color=#888888>" + (string)totalCars + " Cars Detected</font></td>";
		header = header + "</tr></table>";

		string content = "";

		if (state.monitor_page == 0) {
			string row1 = "<tr bgcolor=#222222><td width=35><font size='0.2' color=#FFFFFF><b>Car</b></font></td>";
			string row2 = "<tr><td width=35 bgcolor=#222222><font size='0.2' color=#FFFFFF><b>L-Dr</b></font></td>";
			string row3 = "<tr><td width=35 bgcolor=#222222><font size='0.2' color=#FFFFFF><b>R-Dr</b></font></td>";
			string row4 = "<tr><td width=35 bgcolor=#222222><font size='0.2' color=#FFFFFF><b>BP</b></font></td>";
			string row5 = "<tr><td width=35 bgcolor=#222222><font size='0.2' color=#FFFFFF><b>BC</b></font></td>";
			string row6 = "<tr><td width=35 bgcolor=#222222><font size='0.2' color=#FFFFFF><b>Load</b></font></td>";
			string row7 = "<tr><td width=35 bgcolor=#222222><font size='0.2' color=#FFFFFF><b>A/C</b></font></td>";
			string row8 = "<tr><td width=35 bgcolor=#222222><font size='0.2' color=#FFFFFF><b>WC</b></font></td>";

			int itemsPerPage = 15;
			int totalPages = ((totalCars - 1) / itemsPerPage) + 1;
			if (state.monitor_home_page >= totalPages) state.monitor_home_page = totalPages - 1;
			if (state.monitor_home_page < 0) state.monitor_home_page = 0;

			int startIndex = state.monitor_home_page * itemsPerPage;
			int endIndex = startIndex + itemsPerPage;
			if (endIndex > totalCars) endIndex = totalCars;

			int coachCount = 1;
			for (i = 0; i < startIndex; i++) {
				if (vehicles[i].GetProperties().GetNamedTagAsBool("isMSTN")) coachCount++;
			}

			for (i = startIndex; i < endIndex; i++) {
				Vehicle v = vehicles[i];
				Soup s = v.GetProperties();
				string carLabel = "L";
				if (s and s.GetNamedTagAsBool("isMSTN")) { carLabel = (string)coachCount; coachCount++; }

				string carNumColor = "#3B6790";
				if (v == me) carNumColor = "#EBD302";
				row1 = row1 + "<td width=14 bgcolor=" + carNumColor + " align=center><font size='0.2' color=#FFFFFF><b>" + carLabel + "</b></font></td>";

				string dLColor = "#000000";
				if (s and s.GetNamedTagAsBool("isMSTN")) {
					dLColor = "#333333";
					if (s.GetNamedTagAsBool("doorLeftReal")) dLColor = "#FF0000";
				}
				row2 = row2 + "<td bgcolor=" + dLColor + " height=15 align=center></td>";

				string dRColor = "#000000";
				if (s and s.GetNamedTagAsBool("isMSTN")) {
					dRColor = "#333333";
					if (s.GetNamedTagAsBool("doorRightReal")) dRColor = "#FF0000";
				}
				row3 = row3 + "<td bgcolor=" + dRColor + " height=15 align=center></td>";
				
				float bc = 98101.7 * (v.GetEngineParam("brake-cylinder-pressure") - 0.00103341);
				float bp = 98101.7 * (v.GetEngineParam("brake-pipe-pressure") - 0.00103341);
				string bp_str = "0.0"; string bc_str = "0.0"; string bcColor = "#222222";
				if (s) {
					int bp_i = (int)(bp / 100.0f); int bc_i = (int)(bc / 100.0f);
					bp_str = (string)(bp_i / 10) + "." + (string)(bp_i % 10);
					bc_str = (string)(bc_i / 10) + "." + (string)(bc_i % 10);
					int resetState = state.resetBrakeStates.GetNamedTagAsInt((string)i, 0);
					if (resetState == 1) { bcColor = "#EBD302"; bc_str = "RST"; }
					else if (resetState == 2) { bcColor = "#00FF00"; bc_str = "DNE"; }
					else if (bc >= 450000.0f) {
						bcColor = "#FF0000";
						bc_str = "<a href='live://property/resetBrake_" + (string)i + "'><font color=#FFFFFF>" + bc_str + "</font></a>";
					}
				}
				row4 = row4 + "<td bgcolor=#222222 align=center><font size='0.2' color=#AAAAAA>" + bp_str + "</font></td>";
				row5 = row5 + "<td bgcolor=" + bcColor + " align=center><font size='0.2' color=#AAAAAA>" + bc_str + "</font></td>";
				
				string elColor = "#440000"; string acColor = "#333333"; string wcColor = "#333333";
				if (s and s.GetNamedTagAsBool("isMSTN")) {
					if (s.GetNamedTagAsBool("engineStats")) elColor = "#004400";
					int acS = s.GetNamedTagAsInt("airconState");
					if (acS == 1) acColor = "#EBD302"; else if (acS == 2) acColor = "#004400"; else if (acS == 3) acColor = "#880000";
					int tS = s.GetNamedTagAsInt("toiletState");
					if (tS == 1) wcColor = "#EBD302"; else if (tS == 2) wcColor = "#880088"; else if (tS == 3) wcColor = "#880000";
				}
				row6 = row6 + "<td bgcolor=" + elColor + " height=14 align=center></td>";
				row7 = row7 + "<td bgcolor=" + acColor + " height=14 align=center></td>";
				row8 = row8 + "<td bgcolor=" + wcColor + " height=14 align=center></td>";
			}
			string headerText = "<b>HOME - OVERVIEW</b>";
			if (totalCars > itemsPerPage) {
				string prevBtn = "<font color=#888888>&lt;</font>";
				string nextBtn = "<font color=#888888>&gt;</font>";
				if (state.monitor_home_page > 0) prevBtn = "<a href=live://property/monitor_home_page_prev><b>&lt;</b></a>";
				if (state.monitor_home_page < totalPages - 1) nextBtn = "<a href=live://property/monitor_home_page_next><b>&gt;</b></a>";
				headerText = prevBtn + " &nbsp; <b>HOME - OVERVIEW (Page " + (string)(state.monitor_home_page + 1) + "/" + (string)totalPages + ")</b> &nbsp; " + nextBtn;
			}
			content = "<table width=460 bgcolor=#222222 cellpadding=2 cellspacing=1 border=0><tr bgcolor=#23486A><td colspan=17 align=center>" + headerText + "</td></tr>" + row1 + row2 + row3 + row4 + row5 + row6 + row7 + row8 + "</table>";
		}
		else if (state.monitor_page == 1) {
			content = "<table width=460 bgcolor=#222222 cellpadding=2 cellspacing=1 border=0>";
			content = content + "<tr bgcolor=#23486A><td colspan=4 align=center><b>Main Electrical Network</b></td></tr>";
			content = content + "<tr bgcolor=#333333><td width=25%>System</td><td width=25%>Voltage</td><td width=25%>Frequency</td><td width=25%>Status</td></tr>";
			
			string pwrStatus = "<font color=#FF0000>OFF</font>";
			if (state.m_EngineStats) pwrStatus = "<font color=#00FF00>ONLINE</font>";

			content = content + "<tr><td>3-Ph 400V</td><td>" + (string)(int)(400.0f * state.voltage) + " V</td><td>" + (string)(int)state.frequency + " Hz</td><td>" + pwrStatus + "</td></tr>";
			content = content + "<tr><td>AC 220V</td><td>220 V</td><td>50 Hz</td><td><font color=#00FF00>NORMAL</font></td></tr>";
			content = content + "<tr><td>DC 24V</td><td>" + (string)(int)state.gen_V_DC24 + " V</td><td>--</td><td><font color=#FFFFFF>USB/PIS</font></td></tr>";
			content = content + "</table>";
		}

		string tabs = "<table width=460 bgcolor=#444444 cellpadding=6 cellspacing=1 border=0><tr>";
		string[] pageNames = new string[3]; pageNames[0] = "HOME"; pageNames[1] = "POWER"; pageNames[2] = "LCD";
		for (i = 0; i < 3; i++) {
			string tColor = "#222222";
			string fontColor = "#AAAAAA";
			if (state.monitor_page == i) { tColor = "#3B6790"; fontColor = "#FFFFFF"; }
			tabs = tabs + "<td bgcolor=" + tColor + " width=33% align=center><a href=live://property/monitor_page_" + (string)i + "><font size=2 color=" + fontColor + "><b>" + pageNames[i] + "</b></font></a></td>";
		}
		tabs = tabs + "</tr></table>";
		
		string screenSpacer = "<font size=1 color=#000000>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br>&nbsp;<br></font>";

		string w_screen = "470";
		string w_content = "460";
		string w_inner = "455";

		return "<table width=" + w_screen + " height=360 bgcolor=#111111 cellpadding=0 cellspacing=0 border=0>" +
			"<tr><td height=40 valign=top align=center>" + header + "</td></tr>" +
			"<tr><td height=280 bgcolor=#000000 valign=top align=center>" +
				"<table width=" + w_content + " height=10 cellpadding=0 cellspacing=0 border=0><tr><td></td></tr></table>" +
				"<table width=" + w_content + " cellpadding=0 cellspacing=0 border=0><tr><td valign=top width=" + w_inner + ">" + content + "</td><td width=5 valign=top>" + screenSpacer + "</td></tr></table>" +
			"</td></tr>" +
			"<tr><td height=40 valign=bottom align=center>" + tabs + "</td></tr>" +
			"</table>";
	}

	public string GetDescriptionHTML(void){
		float fMass = 0.0f;
		float fLength = 0.0f;
		int j;
		for(j = 0; j < GetMyTrain().GetVehicles().size(); j++){
			fMass = fMass + GetMyTrain().GetVehicles()[j].GetMass();
			fLength = fLength + GetMyTrain().GetVehicles()[j].GetLength();
		}
		string wagonmass = TrimMass(GetMass());
		string wagonlength = TrimLength(GetLength());
		string trainmass = TrimMass(fMass);
		string trainmassunit = TrimMass(fMass/2);
		string trainlength = TrimLength(fLength);

		string html = inherited();
		
		html = html + "
		<table>
			<tr bgcolor=#3B6790>
				<td width=100%>
					<table>
						<tr bgcolor=#56021F>
							<td width=100%>
								<font size='2'>
									<b>MSTN CNR - Passenger Coach</b>
								</font>
							</td>
						</tr>
					</table>
					
					<table>
						<tr bgcolor=#23486A>
							<td width=50% align=left>
								<b>Train Info | 列車の情報</b>
							</td>
							<td width=50% align=left>
								<b>Coach Info | 機関車の情報</b>
							</td>
						</tr>
					</table>

					<table>
						<tr>
							<td width=50% align=left>
								<font size='0.5'>
									<p>Length: &nbsp;" + trainlength + "m</p>";

									string massUnit;
									if(Str.ToInt(trainmassunit) > 640)
										massUnit = "<font color='#ff0000ff'>" + trainmassunit + "</font>";
									else
										massUnit = trainmassunit;

									html = html + "
									<p>Mass: &nbsp;" + trainmass + "t | " + massUnit + " / <font color='#ff0000ff'>640</font> Unit</p>
									<p>Count of wagons: &nbsp;" + (string)GetMyTrain().GetVehicles().size() + " cars</p>
								</font>
							</td>

							<td width=50% align=left>
								<font size='0.5'>
									<p>Length: &nbsp;" + wagonlength + "m</p>
									<p>Mass: &nbsp;" + wagonmass + "t</p>
								</font>
							</td>
						</tr>
					</table>
					
					<table>
						<tr bgcolor=#23486A>
							<td width=100%>
								<b>Status Monitor (DMI)</b>
							</td>
						</tr>
					</table>
					
					<p align=center>
						<a href='live://property/open_dmi'>
							<table width=300 bgcolor=#3B6790 cellpadding=2 cellspacing=0 border=0>
								<tr>
									<td align=center height=38>
										<font size=4 color=#FFFFFF><b>&gt;&gt; Open DMI Screen</b></font>
									</td>
								</tr>
							</table>
						</a>
					</p>
					
					<p align=center>
						<a href='live://property/reset_dmi'>
							<font size=2 color=#AAAAAA>Reset DMI System (Fix frozen screen)</font>
						</a>
					</p>
					
					<br>
					
					<table bgcolor=#000000D0 cellpadding=0 cellspacing=0 border=0><tr height=1><td width=100%></td></tr></table>
					
					<p align=left>
						<font size=2>
							<b>Advanced View Detail</b> - <a href='live://property/toggleAdvancedView'>Click to [Show / Hide]</a>
						</font>
					</p>
					";
			if (state.showAdvancedView) {
				html = html + GetAdvancedViewTable();
			}
			html = html + "

					<br>
					
					<table>
						<tr bgcolor=#23486A>
							<td width=100%>
								<b>This Script Made by Napon K. | MSTN TEAM<br>Model by Voravit L. | SRTMODSTRAINZ</b>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>";

		return html;
	}

	thread void ResetBrakeThread(int vIdx) {
		Vehicle[] vehicles = GetMyTrain().GetVehicles();
		if (vIdx < 0 or vIdx >= vehicles.size()) return;
		Vehicle v = vehicles[vIdx];

		state.resetBrakeStates.SetNamedTag((string)vIdx, 1);

		Asset nullEng = m_scriptLib.GetAsset().FindAsset("null-engine");

		if (nullEng) v.SetEngineAsset(nullEng);
		Sleep(2.0f);

		v.SetEngineAsset(v.GetDefaultEngineAsset());
		state.resetBrakeStates.SetNamedTag((string)vIdx, 2);
		Sleep(1.0f);

		state.resetBrakeStates.SetNamedTag((string)vIdx, 0);
	}

	thread void PlayNavButtonSound() {
		if (!m_scriptLib) return;
		int r1 = (int)Math.Rand(1.0f, 5.99f);
		int r2 = (int)Math.Rand(1.0f, 5.99f);
		World.Play2DSound(m_scriptLib.GetAsset(), "assets/sounds/button_push_in_" + (string)r1 + ".wav");
		Sleep(0.05f);
		World.Play2DSound(m_scriptLib.GetAsset(), "assets/sounds/button_push_out_" + (string)r2 + ".wav");
	}

	public void LinkPropertyValue(string p_propertyID){
		if (p_propertyID == "handbrake") {
			state.handbrake = (GetProperties().GetNamedTagAsInt("handbrake", 0) != 0);
			return;
		}
		if (p_propertyID.size() >= 13 and p_propertyID[0, 13] == "monitor_page_") {
			state.monitor_page = Str.ToInt(Str.Tokens(p_propertyID, "monitor_page_")[0]);
			return;
		}
		if (p_propertyID == "monitor_home_page_prev") {
			state.monitor_home_page--;
			return;
		}
		if (p_propertyID == "monitor_home_page_next") {
			state.monitor_home_page++;
			return;
		}
		if(p_propertyID.size() >= 11 and p_propertyID[0, 11] == "resetBrake_") {
			int vIdx = Str.ToInt(Str.Tokens(p_propertyID, "resetBrake_")[0]);
			ResetBrakeThread(vIdx);
			return;
		}
		if(p_propertyID == "state.togglePlatform"){
			state.togglePlatform = !state.togglePlatform;
			cnrSystems.ToggleCoachAnimation(me, "platform-selector", state.togglePlatform);
			return;
		}
		if (p_propertyID == "door_interlock_bypass") {
			state.door_interlock_bypass = (GetProperties().GetNamedTagAsInt("door_interlock_bypass", 0) != 0);
			return;
		}
		if (p_propertyID == "door_interlock_speed") {
			state.door_interlock_speed = GetProperties().GetNamedTagAsFloat("door_interlock_speed", 10.0f);
			return;
		}
		if (p_propertyID == "car_num_mode") {
			state.car_num_mode = GetProperties().GetNamedTagAsInt("car_num_mode", 2);
			state.lcd_manual_dirty = true;
			return;
		}
		if (p_propertyID == "handbrake") {
			state.handbrake = (GetProperties().GetNamedTagAsInt("handbrake", 0) != 0);
			return;
		}
		if(p_propertyID == "toggleAdvancedView"){
			state.showAdvancedView = !state.showAdvancedView;
			return;
		}
		if(p_propertyID == "toggleDebug"){
			state.isDebug = !state.isDebug;
			return;
		}
		if (p_propertyID ==  "toggleSigLamp"){
		  	return;
		}
		
		if (p_propertyID ==  "toggleDoorLeft"){
		  	state.m_PSGdoorleft = !state.m_PSGdoorleft;
			if(me.GetDirectionRelativeToTrain()) SetMeshAnimationState("dummy-door-left",state.m_PSGdoorleft);
			else SetMeshAnimationState("dummy-door-right",state.m_PSGdoorleft);
		  	return;
		}
		if (p_propertyID ==  "toggleDoorRight"){
		  	state.m_PSGdoorright = !state.m_PSGdoorright;
			if(me.GetDirectionRelativeToTrain()) SetMeshAnimationState("dummy-door-right",state.m_PSGdoorright);
			else SetMeshAnimationState("dummy-door-left",state.m_PSGdoorright);
		  	return;
		}

		inherited(p_propertyID);
	}

	public string GetPropertyType(string p_propertyID){
		if(p_propertyID == "monitor_home_page_prev") return "link";
		if(p_propertyID == "monitor_home_page_next") return "link";
		if(p_propertyID.size() >= 13 and p_propertyID[0, 13] == "monitor_page_") return "link";
		if(p_propertyID.size() >= 11 and p_propertyID[0, 11] == "resetBrake_") return "link";
		if (p_propertyID == "toggleSigLamp")
		  	return "link";
		if (p_propertyID == "toggleDoorLeft")
		  	return "link";
		if (p_propertyID == "toggleDoorRight")
		  	return "link";
		if (p_propertyID == "state.togglePlatform")
			return "link";
		if (p_propertyID == "toggleAdvancedView")
		  	return "link";
		if (p_propertyID == "Reload")
		  	return "link";
		if (p_propertyID == "toggleDebug")
		  	return "link";

		return inherited(p_propertyID);
	}

	void InterfacePropertyChangeHandler(Message msg) {
		LinkPropertyValue(msg.minor);
		// Force immediate physics update on property change
		cnrSystems.PhysicalBrakeUpdate(me, state, m_scriptLib);
	}


	void AnimationEventHandler(Message msg) {
		// msg.minor example: wheelslip_start_bog0
		if (Str.Find(msg.minor, "wheelslip_", 0) == 0) {
			string rest = msg.minor[10, msg.minor.size()]; // "start_bog0", "loop_bog0", "stop_bog0"
			int under = Str.Find(rest, "_bog", 0);
			if (under >= 0) {
				string type = rest[0, under];         // "start", "loop", "stop"
				int bogIdx = Str.ToInt(rest[under+4, rest.size()]);
				cnrSystems.VisualWheelLockHandler(me, type, bogIdx, state);
			}
		}
	}



/* +===================================================================================================+ */
/* |                                                                                                   | */
/* |     █████╗  ██████╗███████╗              ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗    | */
/* |    ██╔══██╗██╔════╝██╔════╝              ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║    | */
/* |    ███████║██║     ███████╗    █████╗    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║    | */
/* |    ██╔══██║██║     ╚════██║    ╚════╝    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║    | */
/* |    ██║  ██║╚██████╗███████║              ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║    | */
/* |    ╚═╝  ╚═╝ ╚═════╝╚══════╝              ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝    | */
/* |                                                                                                   | */
/* +===================================================================================================+ */

	void FlyShuntHandler(Message msg){ if(acsSystem) acsSystem.FlyShuntHandler(msg); }
	void VehicleDerailHandler(Message msg){ if(acsSystem) acsSystem.VehicleDerailHandler(msg); }
	void VehicleCoupleHandler(Message msg){ if(acsSystem) acsSystem.VehicleCoupleHandler(msg); }
	void VehicleDecoupleHandler(Message msg){ if(acsSystem) acsSystem.VehicleDecoupleHandler(msg); }
	void ACShandler(Message msg){ if(acsSystem) acsSystem.ACShandler(msg); }
};
