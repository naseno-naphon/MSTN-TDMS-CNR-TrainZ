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

class cnr_gen_main isclass Vehicle{
	CNR_State_GenCoach state;


	///// ----- ACS - 鉄道接続システムの変数を宣言する | (てつどせつぞくSystemのへんすうをせんげんする) ----- /////
	CNR_AcsSystem 	acsSystem;
	CNR_Systems 	cnrSystems;

	Browser 		_uiBrowser;
	CNR_DMI 		dmiSystem;
	bool			m_dmiResetPending = false;
	float			m_dmiResetTimer = 0.0f;

	///// ----- 顧客データ検証システムの変数を宣言する | こきゃくDataけんしょうSystem ----- /////
	Asset 			textureAsset, 
					soundsAsset;
	// ประกาศ Function
	public int NumWagonsInTrain(Train train) {
		return train.GetVehicles().size();
	}

	// -- 「CNR」車両のエンジン電気システムの変数を宣言する | 「CNR」しゃりょうのEngineでんきSystemのへんすうをせんげんする -- //
	ProductQueue 	fuelQ, 
					electricalLoadQ;

	void 			FuelConsumptionSystem(float currentTime);
	thread void 	GeneratorEngineEvent1();
	thread void 	GeneratorEngineEvent2();
	void 			GeneratorLoadEvent(float currentTime);
	void 			EngineFanCoolerEvent(float currentTime);
	void 			DynamicSmokeEffect(float currentTime);
	void 			UpdateTrainLCDSigns(void);
	public string 	GetPropertyType(string p_propertyID);
	public string 	GetPropertyDescription(string p_propertyID);
	public string 	GetPropertyValue(string p_propertyID);
	public void 	SetPropertyValue(string p_propertyID, string p_value);
	thread void 	MainLoop();

	// -- 「CNR」車両の供給システムの変数を宣言する | 「CNR」しゃりょうのきょうきゅうSystemのへんすうをせんげんする -- //
	public Vehicle[] SafeGetVehicles(void) {
		Train t = me.GetMyTrain();
		if (t) return t.GetVehicles();
		return new Vehicle[0];
	}
	void 			CouplerHandler(Message msg);

	void 			onInteriorChange();
	void 			onSignalLightChange(float currentTime);
	void 			GeneralCheckSystem(float currentTime);

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
		if(state.isDebug) Interface.Print("[" + me.GetLocalisedName() + "] Debug Log > " + message);
	}

	CNR_AuthHandler authHelper;
	CNR_State_Auth authState;
	Library m_scriptLib;

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
		Asset asset = 				GetAsset();
		textureAsset = 				asset.FindAsset("texture-asset");
		soundsAsset	= 				asset.FindAsset("sounds-asset");
		Library acsLib =			World.GetLibrary(asset.LookupKUIDTable("acslib"));

		float sleepRandomiser = 	Math.Rand(2.25, 3.75);
		state.m_pipeDelayRandomizer = 	Math.Rand(0.9, 1.4);
		state.m_intSeatDelayRandomizer = 	Math.Rand(1,5);
		state.m_intShadeDelayRandomizer = Math.Rand(5,15);
		state.m_intShadeOpenRandomizer =	Math.Rand(0,2);
		
		state.engineExhaust = 			Math.Rand(0,1);

		fuelQ =						me.GetQueue("fuel");
		if (!fuelQ) fuelQ =			me.GetQueue("fuel_tank");
		if (!fuelQ) fuelQ =			me.GetQueue("fuel-tank");
		
		electricalLoadQ =			me.GetQueue("e-load");
		if (!electricalLoadQ) electricalLoadQ = me.GetQueue("electrical_load");
		if (!electricalLoadQ) electricalLoadQ = me.GetQueue("electrical-load");

		state.voltage = 0.0f;
		state.frequency = 0.0f;
		state.startup_spike = 0.0f;

		if (!acsSystem) acsSystem = new CNR_AcsSystem();
		acsSystem.Init(me, acsLib, sleepRandomiser, "back");

		PrintDebug("[Boot-up] LoadAsset is Loaded...!");
	}

	void LoadSystem(){
		LoadAssets();
		PrintDebug("[Boot-up] LoadSystem is Loading...!");

		acsSystem.UpdateCarPosition();

		if(GetMyTrain()){
			AddHandler(me,"Vehicle","Coupled","CouplerHandler");		//Handler การพ่วงขบวน
			AddHandler(me,"Vehicle","Decoupled","CouplerHandler");		//Handler การถอดพ่วงออก

			AddHandler(me, "Vehicle", "Derailed", "VehicleDerailHandler");
			AddHandler(me, "Train", "StoppedMoving", "FlyShuntHandler");
			AddHandler(me, "ACScallback", "", "ACShandler");			//ตรวจเช็คระบบ ACS Handler
			PostMessage(me,"pfx","-0-1",0.15f);

			//เรียกการทำงานของระบบ ACS เข้ามาใช้ใน Script นี้
			PostMessage(me, "ACScallback", "DelayedRecalc", 1.0f + acsSystem.m_sleepRandomiser);
			if (!GetMyTrain().GetFrontmostLocomotive()){
			  	PostMessage(me, "ACScallback", "DisablePhysics", 1.0f + acsSystem.m_sleepRandomiser);
			}
		}

		PostMessage(me,"pfx","-0-1",0.15f);

		//สั่งให้ฟังก์ชั่นทั้งหมดทำงาน
		GeneratorEngineEvent1();
		GeneratorEngineEvent2();
		onInteriorChange();
		MainLoop();

		PrintDebug("[Boot-up] LoadSystem is Loaded!");
	}


	void ModuleInitHandler(Message msg) {
		if (World.GetCurrentModule() != World.DRIVER_MODULE)
			dmiSystem.SetCustomHUD(false, state, me, m_scriptLib);
	}

	void CameraHandler(Message msg) {
		if (msg.minor == "Target-Changed") 
			dmiSystem.SetCustomHUD(cast<Vehicle>World.GetCameraTarget() == me, state, me, m_scriptLib);
	}

	// Remove UpdateLCDHandler as it is replaced by staggered row processing in MainLoop

	thread void PlayNavButtonSound() {
		if (!m_scriptLib) return;
		int r1 = (int)Math.Rand(1.0f, 5.99f);
		int r2 = (int)Math.Rand(1.0f, 5.99f);
		World.Play2DSound(m_scriptLib.GetAsset(), "assets/sounds/button_push_in_" + (string)r1 + ".wav");
		Sleep(0.1f);
		World.Play2DSound(m_scriptLib.GetAsset(), "assets/sounds/button_push_out_" + (string)r2 + ".wav");
	}

	void BrowserClickHandler(Message msg) {
		bool isHUD = dmiSystem.IsHUDBrowser(cast<Browser>msg.src);
		bool isDMI = dmiSystem.IsDMIBrowser(cast<Browser>msg.src);

		if (isHUD and (msg.minor == "live://btn_info" or msg.minor == "btn_info")) {
			// HUD tray button → etcs_click sound
			if (m_scriptLib) World.Play2DSound(m_scriptLib.GetAsset(), "assets/sounds/etcs_click.wav");

			// Toggle DMI popup
			if (!dmiSystem.IsOpen()) 
				dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			 else 
				dmiSystem.Close(me);

		} else if (isDMI) {
			// Extract property ID from URL (live://property/XXX or live://XXX)
			string url = msg.minor;
			string propID = "";
			string livePrefix = "live://property/";
			string livePrefixShort = "live://";
			if (url.size() >= livePrefix.size() and url[0, livePrefix.size()] == livePrefix)
				propID = url[livePrefix.size(), url.size()];
			else if (url.size() >= livePrefixShort.size() and url[0, livePrefixShort.size()] == livePrefixShort)
				propID = url[livePrefixShort.size(), url.size()];

			if (propID != "" and m_scriptLib) {
				// Mechanical: only 5 main navbar tabs + PWR button
				bool isMechanical = (propID == "monitor_page_0" or
				                     propID == "monitor_page_1" or
				                     propID == "monitor_page_2" or
				                     propID == "monitor_page_3" or
				                     propID == "monitor_page_4" or
				                     propID == "monitor_page_back" or
				                     propID == "dmi_power_toggle");

				if (isMechanical) PlayNavButtonSound();
				else World.Play2DSound(m_scriptLib.GetAsset(), "assets/sounds/alarm/idu_beep.wav");
			}

			// Delegate to DMI kernel
			string res = dmiSystem.HandleBrowserClick(msg, state, me);
			if (res == "HANDLED") {
				dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			} else if (res != "" and res != "UNKNOWN") {
				LinkPropertyValue(res);
			}
		}
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



	// Thin wrappers – actual logic lives in CNR_DMI (cnr_dmi_kernel.gs)
	void ShowDMIDetails(Message msg) {
		dmiSystem.Show(state, me, m_scriptLib, fuelQ);
	}
	void DMIBrowserClosed(Message msg) {
		dmiSystem.OnClosed(msg, me);
	}
	void UpdateViewDetails(Message msg) {
		if (msg.dst == me) dmiSystem.Show(state, me, m_scriptLib, fuelQ);
	}
	void DMIResetHandler(Message msg) {
		PrintDebug("[DMI-System] Received Reset Signal!");
		m_dmiResetPending = true;
		m_dmiResetTimer = World.GetTimeElapsed() + 1.0f;
	}

	public void Init(void) {
		state = new CNR_State_GenCoach();
		state.StateInit();
		dmiSystem = new CNR_DMI();

		acsSystem = new CNR_AcsSystem();
		cnrSystems = new CNR_Systems();
		inherited();
		
		// Force HIGH platform default across all linked coaches
		cnrSystems.ToggleCoachAnimation(me, "platform-selector", state.togglePlatform);

		state.resetBrakeStates = Constructors.NewSoup();
		state.doorSelectionStates = Constructors.NewSoup();
		state.system_logs = Constructors.NewSoup();
		state.InitTranslations();
		
		// Randomize initial MR/CR pressure (0-6 bar) for testing
		float randP = Math.Rand(0.0f, 6.0f);
		state.script_mr_press = randP;
		state.script_cr_press = randP;
		state.mr_press_internal = randP;
		state.cr_press_internal = randP;
		
		// Set default selection (all cars selected) if not loaded from properties
		Vehicle[] vehicles = SafeGetVehicles();
		if (vehicles.size() > 0) {
			int totalCars = vehicles.size();
			int i;
			for (i = 0; i < totalCars; i++) {
				if (state.doorSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) {
					state.doorSelectionStates.SetNamedTag((string)i, 1);
				}
				if (!state.interlockSelectionStates) state.interlockSelectionStates = Constructors.NewSoup();
				if (state.interlockSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) {
					state.interlockSelectionStates.SetNamedTag((string)i, 1);
				}
				if (!state.lcdSelectionStates) state.lcdSelectionStates = Constructors.NewSoup();
				if (state.lcdSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) {
					state.lcdSelectionStates.SetNamedTag((string)i, 1);
				}
				if (!state.signalLampSelectionStates) state.signalLampSelectionStates = Constructors.NewSoup();
				if (state.signalLampSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) {
					state.signalLampSelectionStates.SetNamedTag((string)i, 1);
				}
			}
		}
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
			
			AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
			AddHandler(me, "Camera", "", "CameraHandler");
			AddHandler(me, "Browser-URL", "", "BrowserClickHandler");
			AddHandler(me, "Browser-Click", "", "BrowserClickHandler");
			AddHandler(me, "MapObject", "View-Details", "ShowDMIDetails");
			AddHandler(me, "Browser", "Closed", "DMIBrowserClosed");
			AddHandler(me, "Vehicle", "View-Details", "UpdateViewDetails");
			AddHandler(me, "DMI-System", "Reset", "DMIResetHandler");
			AddHandler(me, "Interface-Property-Change", "", "InterfacePropertyChangeHandler");
			AddHandler(me, "CNR-System", "UpdateLCD", "UpdateLCDHandler");
			AddHandler(me, "Animation-Event", "", "AnimationEventHandler");


			LoadSystem();
			
			// Check initial camera target
			if (cast<Vehicle>World.GetCameraTarget() == me) {
				dmiSystem.SetCustomHUD(true, state, me, m_scriptLib);
			}
		}
	}
/* +=================================================================================================================================================================+ */
/* |                                                                                                                                                                 | */
/* |   ██████╗ ██████╗  █████╗  ██████╗██╗  ██╗           ███████╗███╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗  | */
/* |  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║  ██║    ██╗    ██╔════╝████╗  ██║██╔════╝ ██║████╗  ██║██╔════╝    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║  | */
/* |  ██║     ██║   ██║███████║██║     ███████║    ╚═╝    █████╗  ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║█████╗      ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║  | */
/* |  ██║     ██║   ██║██╔══██║██║     ██╔══██║    ██╗    ██╔══╝  ██║╚██╗██║██║   ██║██║██║╚██╗██║██╔══╝      ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║  | */
/* |  ╚██████╗╚██████╔╝██║  ██║╚██████╗██║  ██║    ╚═╝    ███████╗██║ ╚████║╚██████╔╝██║██║ ╚████║███████╗    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║  | */
/* |   ╚═════╝ ╚═════╝ ╚╝  ╚╝ ╚═════╝╚╝  ╚╝           ╚══════╝╚╝  ╚═══╝ ╚═════╝ ╚╝╚╝  ╚═══╝╚══════╝    ╚══════╝   ╚╝   ╚══════╝   ╚╝   ╚══════╝╚╝     ╚╝  | */
/* |                                                                                                                                                                 | */
/* +=================================================================================================================================================================+ */
	thread void MainLoop() {
		while(true) {
			float currentTime = World.GetTimeElapsed();
			
			if (m_dmiResetPending and currentTime > m_dmiResetTimer) {
				m_dmiResetPending = false;
				dmiSystem.ResetDMI(me, state, m_scriptLib, fuelQ);
			}

			FuelConsumptionSystem(currentTime);
			GeneratorLoadEvent(currentTime);
			EngineFanCoolerEvent(currentTime);
			DynamicSmokeEffect(currentTime);
			cnrSystems.BellEventHandler(me, state, currentTime);
			// Selective Door Listener (Follow dummy mesh for consistency)
			bool dummyL = (GetMeshAnimationFrame("dummy-door-left") > 0);
			if (dummyL != state.isDoorLeft) {
				// Trigger closing sound request locally
				if (state.isDoorLeft and !dummyL) state.door_sound_left_req = 2;

				state.isDoorLeft = dummyL;
				me.SetMeshAnimationState("left-passenger-door", dummyL);
				if (dummyL) dmiSystem.AddLog(state, "READY", state.GetText("LOG_DOOR_L_OPEN"), me);
				else dmiSystem.AddLog(state, "READY", state.GetText("LOG_DOOR_L_CLOSE"), me);
			}
			bool dummyR = (GetMeshAnimationFrame("dummy-door-right") > 0);
			if (dummyR != state.isDoorRight) {
				// Trigger closing sound request locally
				if (state.isDoorRight and !dummyR) state.door_sound_right_req = 2;

				state.isDoorRight = dummyR;
				me.SetMeshAnimationState("right-passenger-door", dummyR);
				if (dummyR) dmiSystem.AddLog(state, "READY", state.GetText("LOG_DOOR_R_OPEN"), me);
				else dmiSystem.AddLog(state, "READY", state.GetText("LOG_DOOR_R_CLOSE"), me);
			}
			
			// Update Physical Status (Return value)
			state.doorLeftReal = (GetMeshAnimationFrame("left-passenger-door") > 0.01f);
			state.doorRightReal = (GetMeshAnimationFrame("right-passenger-door") > 0.01f);

			cnrSystems.DoorInterlockEvent(me, state, currentTime);
			cnrSystems.BrakeSoundEvent(me, state, currentTime);

			// Update core simulation systems (20Hz loop, deltaTime = 0.05s)
			cnrSystems.MRAirSystem(me, state, currentTime, 0.05f);
			cnrSystems.WSPControl(me, state, 0.05f);
			cnrSystems.PhysicalBrakeUpdate(me, state, m_scriptLib);
			cnrSystems.DiscBrakeThermal(me, state, currentTime, 0.05f);
			cnrSystems.BrakePipeMonitor(me, state, currentTime);


			GeneralCheckSystem(currentTime);
			cnrSystems.onSignalLightChange(me, state, currentTime, textureAsset);
			cnrSystems.EventAirConditional(me, state, currentTime);
			cnrSystems.UpdateCurrentLoad(me, state);
			
			// [Smart Mesh-LOD] Update interior visibility based on camera distance
			cnrSystems.LODUpdate(me, state, currentTime);
			
			// Update DMI browser in real-time
			dmiSystem.TickRefresh(currentTime, state, me, m_scriptLib, fuelQ);
			dmiSystem.UpdateHUD(currentTime, state, me, m_scriptLib);
			cnrSystems.LCDUpdateLoop(me, state, currentTime);

			// [Optimization] Staggered LCD Update Processing
			// Update one row per tick (20 ticks/sec) to prevent frame drops
			if (state.lcd_pending_row >= 0) {
				cnrSystems.UpdateLCDTextureState(me, state, false);
				state.lcd_pending_row++;
				if (state.lcd_pending_row > 8) state.lcd_pending_row = -1;
			}

			// Door Sound Processing (Restored) & MR Consumption
			if (state.door_sound_left_req != 0) {
				if (state.m_EngineStats1 or state.m_EngineStats2 or state.m_EngineCheck) {
					if (state.door_sound_left_req < 3) {
						state.mr_press_internal = state.mr_press_internal - 0.05f; // MR Consumption
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
			}
			if (state.door_sound_left_req == 3 and currentTime >= state.door_sound_left_end) {
				StopSoundScriptEvent("door_open"); StopSoundScriptEvent("door_close");
				state.door_sound_left_req = 0;
			}

			if (state.door_sound_right_req != 0) {
				if (state.m_EngineStats1 or state.m_EngineStats2 or state.m_EngineCheck) {
					if (state.door_sound_right_req < 3) {
						state.mr_press_internal = state.mr_press_internal - 0.05f; // MR Consumption
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
			}
			if (state.door_sound_right_req == 3 and currentTime >= state.door_sound_right_end) {
				StopSoundScriptEvent("door_open"); StopSoundScriptEvent("door_close");
				state.door_sound_right_req = 0;
			}

			if (state.isUIVisible and state.activeBrowser and currentTime >= state.next_UIRefresh_time) {
				// Dynamic Refresh Rate: 0.1s for high-activity pages, 0.5s for others
				// CRITICAL: Block automatic refresh on LCD Config page (2) to prevent input loss
				if (state.monitor_page == 2) {
					state.next_UIRefresh_time = currentTime + 1.0f; // Just push it back, don't refresh
				} else {
					float interval = 0.5f;
					if (state.monitor_page == 0 or state.monitor_page == 1) interval = 0.1f;
					
					state.next_UIRefresh_time = currentTime + interval;
					me.PropertyBrowserRefresh(state.activeBrowser);
				}
			}
			
			Sleep(0.05f); // 20 updates per second

			// LCD Lazy Sync: Process dirty state after typing pause (1.5s)
			if (state.lcd_dirty_timer > 0.0f and currentTime > state.lcd_dirty_timer) {
				state.lcd_dirty_timer = 0.0f;
				UpdateTrainLCDSigns();
				cnrSystems.BroadcastLCDConfig(me, state, state.lcdSelectionStates);
			}
		}
	}

	void FuelConsumptionSystem(float currentTime) {
		if (!state.coolerSystem) return;
		if (currentTime < state.next_FuelConsumptionSystem_time) return;
		state.next_FuelConsumptionSystem_time = currentTime + 1.0f;

		if(!fuelQ.GetQueueCount()){
			cnrSystems.ToggleCoachAnimation(me, "load-electrical",false);
			state.m_EngineStats1 = false; state.m_EngineStats2 = false;
			state.coolerSystem = false;
			return;
		}

		// Calculate Fuel Consumption based on Load
		// Base idle consumption: 0.002
		// Load factor: 0.0001 per 1% load
		float fuelRate = 0.002f + (state.Eloaded * 0.0001f);
		
		// Add extra consumption if voltage is sagging (engine straining)
		if (state.voltage < 1.0f) fuelRate = fuelRate * (1.1f + (1.0f - state.voltage));

		state.fuel_consumed = state.fuel_consumed + fuelRate;

		if (state.fuel_consumed >= 1.0f) {
			state.fuel_consumed = state.fuel_consumed - 1.0f;
			if (fuelQ) fuelQ.DestroyProductMatching(null,1);
			else state.fuel_consumed = 0.0f; // Reset if no queue to prevent accumulation
		}
	}

	void FlowRPM(int engineIndex, float targetRPM, float duration) {
		if (duration <= 0.0f) {
			if (engineIndex == 1) state.eng1_rpm = targetRPM;
			else state.eng2_rpm = targetRPM;
			return;
		}
		float startTime = World.GetTimeElapsed();
		float startRPM = 0.0f;
		if (engineIndex == 1) { startRPM = state.eng1_rpm; state.isRPMFlowing1 = true; }
		else { startRPM = state.eng2_rpm; state.isRPMFlowing2 = true; }
		
		while (World.GetTimeElapsed() - startTime < duration) {
			float elapsed = World.GetTimeElapsed() - startTime;
			float p = elapsed / duration;
			// Linear Flow with slight mechanical jitter
			float current = startRPM + (targetRPM - startRPM) * p;
			current = current + Math.Rand(-2.5f, 2.5f);
			
			if (engineIndex == 1) state.eng1_rpm = current;
			else state.eng2_rpm = current;
			
			Sleep(0.05f);
		}
		
		if (engineIndex == 1) { state.eng1_rpm = targetRPM; state.isRPMFlowing1 = false; }
		else { state.eng2_rpm = targetRPM; state.isRPMFlowing2 = false; }
	}


	thread void GeneratorEngineEvent1(){
		bool run = 0;
		while(true){
			//เมื่อ !run และ state.m_EngineStats ถูกต้อง
      		if (!run and state.m_EngineStats1){
      			run = 1;
				//หยุดเล่นเสียงเดิมทั้งหมด
				state.bell1_req = 0;
				StopSoundScriptEvent("cnr1-start");
				StopSoundScriptEvent("cnr1-idle");
				StopSoundScriptEvent("cnr1-revv-load");
				StopSoundScriptEvent("cnr1-load");
				StopSoundScriptEvent("cnr1-load-idle");
				StopSoundScriptEvent("cnr1-stop");

				// เริ่มต้นกระบวนการสตาร์ท: เปิดระบบ RPM Flow และรีเซ็ต RPM ทันที
				state.isRPMFlowing1 = true;
				state.eng1_rpm = 0.0f;

				//เริ่มเเล่นเสียงกริ่ง
				PrintDebug("[GeneratorEngineEvent1] Bell Check Fault!");
				state.bell1_req = 1;
				Sleep(5.0f);
				
      			PlaySoundScriptEvent("cnr1-start");
				Sleep(0.2f);
				
				//เริ่มควัน
				PostMessage(me,"pfx","+0",0.1f);
				PrintDebug("[GeneratorEngineEvent1] Smoke Started!");

				FlowRPM(1, 400.0f, 0.8f);   // 0.2 -> 1.0s
				state.isRevving1 = true;
				FlowRPM(1, 750.0f, 0.8f);   // 1.0 -> 1.8s
				FlowRPM(1, 700.0f, 0.9f);   // 1.8 -> 2.8s
				
				state.bell1_req = 0;
				
				//หักน้ำมันตอนสตาร์ทไป 1 ลิตร
				if (fuelQ) fuelQ.DestroyProductMatching(null,1);
				state.isRevving1 = false;
      			Sleep(3.90f);

				//เริ่มทำงานระบบกินน้ำมัน
				PrintDebug("[GeneratorEngineEvent1] Active FuelConsumptionSystem() Finished!");
      			StopSoundScriptEvent("cnr1-start");
				state.coolerSystem = true;
				state.engine1_ready = true;
				dmiSystem.AddLog(state, "READY", state.GetText("LOG_E1_READY"), me);
				PrintDebug("[GeneratorEngineEvent1] is Started!");


      			while (run and state.m_EngineStats1){
					// Auto-trigger loading if HEP was connected early
					if (state.toggleLoadElectrical and state.engine1_ready and !state.engine1Loaded) state.engine1Loading = true;

					if(state.engine1Loading){
      					StopSoundScriptEvent("cnr1-idle");
						PrintDebug("[GeneratorEngineEvent1] Loading Electrical!");

      					PlaySoundScriptEvent("cnr1-revv-load");
						state.isRevving1 = false;
						Sleep(0.270f);
						state.isRevving1 = true;
						FlowRPM(1, 1500.0f, 1.649f);
						state.isRevving1 = false;
						FlowRPM(1, 1200.0f, 0.818f);
						state.isRevving1 = true;
						FlowRPM(1, 1520.0f, 0.722f);
						state.isRevving1 = false;
						FlowRPM(1, 1500.0f, 1.879f);
      					StopSoundScriptEvent("cnr1-revv-load");

						PrintDebug("[GeneratorEngineEvent1] Electrical is Loaded!");
						state.m_EngineCheck = true;

						state.engine1Loading = false;
						state.engine1Loaded = true;
					}
					else if(state.engine1Download){
						state.engine1Loaded = false;
						StopSoundScriptEvent("cnr1-load");


						//จากโหลดลงมาที่ Idle
						PlaySoundScriptEvent("cnr1-load-idle");
						FlowRPM(1, 600.0f, 2.0f);
						FlowRPM(1, 700.0f, 0.5f);
      					StopSoundScriptEvent("cnr1-load-idle");


						//เล่นเสียง Idle 5 วินาที
						PlaySoundScriptEvent("cnr1-idle");

						state.engine1Download = false;
					}

					if(state.engine1Loaded and !state.engine1Loading){
						PlaySoundScriptEvent("cnr1-load");
						state.isRevving1 = false;
					}
					
					if(!state.engine1Loaded and !state.engine1Download){
      					PlaySoundScriptEvent("cnr1-idle");
						state.isRevving1 = false;
					}
			
					//อยู่ใน Loop เมื่อ
      				if (!state.m_EngineStats1) run = 0;
					
      				Sleep(0.05f);
      			}
				run = 0; // FIX DEADLOCK: Ensure run is reset even if while loop exits due to state.m_EngineStats1 becoming false

				if(state.engine1Loaded){
      				StopSoundScriptEvent("cnr1-load");

					//จากโหลดลงมาที่ Idle
					PlaySoundScriptEvent("cnr1-load-idle");
					state.engine1_ready = false;
					FlowRPM(1, 600.0f, 2.0f);
					FlowRPM(1, 700.0f, 0.5f);
      				StopSoundScriptEvent("cnr1-load-idle");

					//เล่นเสียง Idle 5 วินาที
					PlaySoundScriptEvent("cnr1-idle");
					state.engine1Loaded = false;
				}
				state.engine1_ready = false;

				//เล่นเสียง Idle 5 วินาที
				state.bell1_req = 1;
				Sleep(2.0f);
				state.bell1_req = 0;
				Sleep(1.0f);
      			StopSoundScriptEvent("cnr1-idle");
				state.coolerSystem = false;

				//หยุดเล่นควัน
				PrintDebug("[GeneratorEngineEvent1] Stop Smoke!!");
				PostMessage(me,"pfx","-0",0.5f);

				//เสียงหยุุด
      			PlaySoundScriptEvent("cnr1-stop");
				FlowRPM(1, 0.0f, 2.5f); // Shutdown RPM flow
      			Sleep(3.601f);
      			StopSoundScriptEvent("cnr1-stop");

				//หยุดเล่นเสียงเดิมทั้งหมด
				state.bell1_req = 0;
				StopSoundScriptEvent("cnr1-start");
				StopSoundScriptEvent("cnr1-idle");
				StopSoundScriptEvent("cnr1-revv-load");
				StopSoundScriptEvent("cnr1-load");
				StopSoundScriptEvent("cnr1-load-idle");
				StopSoundScriptEvent("cnr1-stop");

				StopSoundScriptEvent("cnr1-stop");
				dmiSystem.AddLog(state, "INFO", state.GetText("LOG_E1_STOP"), me);
				PrintDebug("[GeneratorEngineEvent1] is Stopped!");
			}
			Sleep(0.1f);
		}
	}
	
	thread void GeneratorEngineEvent2(){
		bool run = 0;
		while(true){
			//เมื่อ !run และ state.m_EngineStats ถูกต้อง
      		if (!run and state.m_EngineStats2){
      			run = 1;
				//หยุดเล่นเสียงเดิมทั้งหมด
				state.bell2_req = 0;
				StopSoundScriptEvent("cnr2-start");
				StopSoundScriptEvent("cnr2-idle");
				StopSoundScriptEvent("cnr2-revv-load");
				StopSoundScriptEvent("cnr2-load");
				StopSoundScriptEvent("cnr2-load-idle");
				StopSoundScriptEvent("cnr2-stop");

				// เริ่มต้นกระบวนการสตาร์ท: เปิดระบบ RPM Flow และรีเซ็ต RPM ทันที
				state.isRPMFlowing2 = true;
				state.eng2_rpm = 0.0f;

				//เริ่มเเล่นเสียงกริ่ง
				PrintDebug("[GeneratorEngineEvent2] Bell Check Fault!");
				state.bell2_req = 1;
				Sleep(5.0f);

				PrintDebug("[GeneratorEngineEvent2] is Starting!");
				dmiSystem.AddLog(state, "INFO", state.GetText("LOG_E2_START"), me);
      			PlaySoundScriptEvent("cnr2-start");
				Sleep(0.2f);
				
				//เริ่มควัน
				PostMessage(me,"pfx","+1",0.1f);
				PrintDebug("[GeneratorEngineEvent2] Smoke Started!");

				FlowRPM(2, 400.0f, 0.8f);   // 0.2 -> 1.0s
				state.isRevving2 = true;
				FlowRPM(2, 750.0f, 0.8f);   // 1.0 -> 1.8s
				FlowRPM(2, 700.0f, 0.9f);   // 1.8 -> 2.8s
				
				state.bell2_req = 0;

				//หักน้ำมันตอนสตาร์ทไป 1 ลิตร
				if (fuelQ) fuelQ.DestroyProductMatching(null,1);
				state.isRevving2 = false;
				state.coolerSystem = true;
				state.engine2_ready = true;
      			Sleep(3.90f);

				//เริ่มทำงานระบบกินน้ำมัน
				PrintDebug("[GeneratorEngineEvent2] Active FuelConsumptionSystem() Finished!");
      			StopSoundScriptEvent("cnr2-start");
				state.coolerSystem = true;
				state.engine2_ready = true;
				dmiSystem.AddLog(state, "READY", state.GetText("LOG_E2_READY"), me);
				PrintDebug("[GeneratorEngineEvent2] is Started!");


      			while (run and state.m_EngineStats2){
					// Auto-trigger loading if HEP was connected early
					if (state.toggleLoadElectrical and state.engine2_ready and !state.engine2Loaded) state.engine2Loading = true;

					if(state.engine2Loading){
      					StopSoundScriptEvent("cnr2-idle");
						PrintDebug("[GeneratorEngineEvent2] Loading Electrical!");

      					PlaySoundScriptEvent("cnr2-revv-load");
						state.isRevving2 = false;
						Sleep(0.270f);
						state.isRevving2 = true;
						FlowRPM(2, 1500.0f, 1.649f);
						state.isRevving2 = false;
						FlowRPM(2, 1200.0f, 0.818f);
						state.isRevving2 = true;
						FlowRPM(2, 1520.0f, 0.722f);
						state.isRevving2 = false;
						FlowRPM(2, 1500.0f, 1.879f); // ลดจาก 1.979f เพื่อชดเชย overhead ~0.2s
      					StopSoundScriptEvent("cnr2-revv-load");

						PrintDebug("[GeneratorEngineEvent2] Electrical is Loaded!");
						state.m_EngineCheck = true;
						state.engine2_ready = true;

						state.engine2Loading = false;
						state.engine2Loaded = true;
					}
					else if(state.engine2Download){
						state.engine2Loaded = false;
						StopSoundScriptEvent("cnr2-load");


						//จากโหลดลงมาที่ Idle
						PlaySoundScriptEvent("cnr2-load-idle");
						FlowRPM(2, 600.0f, 2.0f);
						FlowRPM(2, 700.0f, 0.5f);
      					StopSoundScriptEvent("cnr2-load-idle");


						//เล่นเสียง Idle 5 วินาที
						PlaySoundScriptEvent("cnr2-idle");

						state.engine2Download = false;
					}

					if(state.engine2Loaded and !state.engine2Loading){
						PlaySoundScriptEvent("cnr2-load");
						state.isRevving2 = false;
					}
					
					if(!state.engine2Loaded and !state.engine2Download){
      					PlaySoundScriptEvent("cnr2-idle");
						state.isRevving2 = false;
					}
			
					//อยู่ใน Loop เมื่อ
      				if (!state.m_EngineStats2) run = 0;
					
      				Sleep(0.05f);
      			}
				run = 0; // FIX DEADLOCK: Ensure run is reset even if while loop exits due to state.m_EngineStats2 becoming false

				if(state.engine2Loaded){
      				StopSoundScriptEvent("cnr2-load");

					//จากโหลดลงมาที่ Idle
					PlaySoundScriptEvent("cnr2-load-idle");
					Sleep(2.5f);
      				StopSoundScriptEvent("cnr2-load-idle");

					//เล่นเสียง Idle 5 วินาที
					PlaySoundScriptEvent("cnr2-idle");
					state.engine2Loaded = false;
					state.engine2_ready = false;
				}

				//เล่นเสียง Idle 5 วินาที
				state.bell2_req = 1;
				Sleep(2.0f);
				state.bell2_req = 0;
				Sleep(1.0f);
      			StopSoundScriptEvent("cnr2-idle");
				state.coolerSystem = false;

				//หยุดเล่นควัน
				PrintDebug("[GeneratorEngineEvent2] Stop Smoke!!");
				PostMessage(me,"pfx","-1",0.5f);

				//เสียงหยุุด
      			PlaySoundScriptEvent("cnr2-stop");
      			Sleep(3.601f);
      			StopSoundScriptEvent("cnr2-stop");

				//หยุดเล่นเสียงเดิมทั้งหมด
				state.bell2_req = 0;
				StopSoundScriptEvent("cnr2-start");
				StopSoundScriptEvent("cnr2-idle");
				StopSoundScriptEvent("cnr2-revv-load");
				StopSoundScriptEvent("cnr2-load");
				StopSoundScriptEvent("cnr2-load-idle");
				StopSoundScriptEvent("cnr2-stop");

				StopSoundScriptEvent("cnr2-stop");
				dmiSystem.AddLog(state, "INFO", state.GetText("LOG_E2_STOP"), me);
				PrintDebug("[GeneratorEngineEvent2] is Stopped!");
			}
			Sleep(0.1f);
		}
	}

	void GeneratorLoadEvent(float currentTime){
		if (currentTime < state.next_GeneratorLoadEvent_time) return;
		state.next_GeneratorLoadEvent_time = currentTime + 0.2f;

		Vehicle[] vehicles = SafeGetVehicles();
		if (vehicles.size() == 0) return; // Safety exit if no train context

		float totalTrainLoad = 0.0f;
		int i;

		// 1. Collect Load from all vehicles
		// HEP State determines what to count:
		//   toggleLoadElectrical=false → HEP button NOT pressed → APVC only (no power to coaches)
		//   toggleLoadElectrical=true, loadElectrical=false → HEP connecting/stabilizing → idle floor per coach
		//   loadElectrical=true → HEP relay active → full reported load from each coach
		if (!state.toggleLoadElectrical) {
			// HEP not requested — generator only serves APVC itself
			float myLoad = state.current_load;
			if (myLoad < 20.0f) myLoad = 20.0f;
			totalTrainLoad = myLoad;
		} else {
			// HEP requested or active — aggregate via STAGGERED GetProperties read
			// Each tick: refresh ONE coach in the cache, sum from full cache.
			// 12 coaches × 0.2s/tick = full refresh every 2.4s — smooth & no spike.

			if (state.cached_coach_loads.size() != vehicles.size()) {
				state.cached_coach_loads = new float[vehicles.size()];
				int ci;
				for (ci = 0; ci < vehicles.size(); ci++)
					state.cached_coach_loads[ci] = 21.0f;
				state.load_read_stagger_idx = 0;
			}

			// Advance pointer, read ONE vehicle
			state.load_read_stagger_idx = (state.load_read_stagger_idx + 1) % vehicles.size();
			int ri = state.load_read_stagger_idx;
			if (vehicles[ri]) {
				if (vehicles[ri] == me) {
					float ml = state.current_load;
					if (ml < 20.0f) ml = 20.0f;
					state.cached_coach_loads[ri] = ml;
				} else {
					Soup rs = vehicles[ri].GetProperties();
					if (rs and rs.GetNamedTagAsBool("isMSTN")) {
						float cl = rs.GetNamedTagAsFloat("current_load", 21.0f);
						if (cl < 21.0f) cl = 21.0f;
						if (!state.loadElectrical and cl > 21.0f) cl = 21.0f;
						state.cached_coach_loads[ri] = cl;
					} else {
						state.cached_coach_loads[ri] = 21.0f;
					}
				}
			}

			// Sum from cache — O(N) float adds only, no GetProperties
			for (i = 0; i < vehicles.size(); i++)
				totalTrainLoad = totalTrainLoad + state.cached_coach_loads[i];
		}

		// 2. Check Generator Capacity (kW/Load Capacity) — declared first, used by spike calculation below
		float maxCapacity = 0.0f;
		if (state.engine1_ready) maxCapacity = maxCapacity + 450.0f; 
		if (state.engine2_ready) maxCapacity = maxCapacity + 450.0f; 

		// 3. Add System Startup Inrush Spike (After HEP connect, before relay active)
		// Uses totalTrainLoad (already computed above with floor=20kW) as the true steady-state baseline.
		// Peak inrush = 74% of active capacity, blending down to actual load over 5 seconds.
		state.startup_spike = 0.0f;
		if (state.toggleLoadElectrical and state.m_EngineCheck and state.hep_stability_timer < 5.0f) {
			float spikeRatio = 1.0f - (state.hep_stability_timer / 5.0f);
			// Use actual computed train load as the settled steady-state target
			float estimatedNormalLoad = totalTrainLoad;
			// Peak inrush load: 74% of active capacity (inrush exceeds steady state)
			float peakLoad = maxCapacity * 0.74f;
			if (estimatedNormalLoad > peakLoad) peakLoad = estimatedNormalLoad;
			// Blend from peakLoad (t=0) → estimatedNormalLoad (t=5s)
			float overrideLoad = peakLoad * spikeRatio + estimatedNormalLoad * (1.0f - spikeRatio);
			state.startup_spike = overrideLoad - totalTrainLoad;
			if (state.startup_spike > 0.0f) totalTrainLoad = overrideLoad;
		}

		// 4. Voltage & Frequency Simulation
		if (maxCapacity > 0) {
			float targetVoltage = 1.0f;
			if (totalTrainLoad > maxCapacity) {
				// Reduced voltage sag (max 10% drop instead of 20%)
				targetVoltage = 1.0f - ((totalTrainLoad - maxCapacity) / maxCapacity) * 0.1f;
			}
			
			// Rock-solid adjustment speed
			float adjustmentSpeed = 0.1f; 
			if (state.engine1_ready and state.engine2_ready) adjustmentSpeed = 0.2f;

			state.voltage = cnrSystems.Lerp(state.voltage, targetVoltage, adjustmentSpeed);
			state.frequency = 50.0f * state.voltage;
		} else {
			state.voltage = 0.0f;
			state.frequency = 0.0f;
		}

		if (state.voltage < 0.0f) state.voltage = 0.0f;

		// --- OVERLOAD PROTECTION SYSTEM (2-TIER) ---
		// TIER 2: >105% sustained 60s → TOTAL SHUTDOWN (then auto-reset, no lockout)
		// TIER 1: >95%  sustained 60s → HEP CUTOFF only (engines keep running at idle)
		float loadPercentage = 0.0f;
		if (maxCapacity > 0) loadPercentage = (totalTrainLoad / maxCapacity) * 100.0f;

		// Accumulate timers (0.2s per tick)
		if (loadPercentage > 105.0f) {
			state.overload_100_timer = state.overload_100_timer + 0.2f; // Tier 2 accumulator
			state.overload_97_timer  = state.overload_97_timer  + 0.2f; // >105% also counts for Tier 1
		} else if (loadPercentage > 95.0f) {
			state.overload_97_timer = state.overload_97_timer + 0.2f;
			if (state.overload_100_timer > 0.0f) state.overload_100_timer = state.overload_100_timer - 0.1f;
		} else {
			// Cool-off phase — timers decay
			if (state.overload_100_timer > 0.0f) state.overload_100_timer = state.overload_100_timer - 0.1f;
			if (state.overload_97_timer  > 0.0f) state.overload_97_timer  = state.overload_97_timer  - 0.1f;
		}
		if (state.overload_100_timer < 0.0f) state.overload_100_timer = 0.0f;
		if (state.overload_97_timer  < 0.0f) state.overload_97_timer   = 0.0f;

		// TIER 2 TRIP (>105% for 60s) — Total Engine Shutdown, no lockout, auto-reset for restart
		if (state.overload_100_timer >= 60.0f and state.m_EngineCheck) {
			state.m_EngineStats1 = false;
			state.m_EngineStats2 = false;
			// Also reset HEP so button can be pressed again after restart
			state.toggleLoadElectrical = false;
			state.loadElectrical = false;
			cnrSystems.ToggleCoachAnimation(me, "load-electrical", false);
			UpdateTrainLCDSigns();
			dmiSystem.UpdateLCDAnimations(me, state);
			// Bell alarm for 5s then auto-stop
			state.bell1_req = 1;
			state.bell2_req = 1;
			state.engine_lockout_timer = 5.0f; // 5s alarm only — bell handler clears at 0
			// Reset timers
			state.overload_100_timer = 0.0f;
			state.overload_97_timer  = 0.0f;
			dmiSystem.AddLog(state, "CRIT", "OVERLOAD TRIP T2: Load " + (string)((int)loadPercentage) + "% > 105% sustained 60s — ENGINES SHUTDOWN, HEP RESET", me);
			PrintDebug("[GeneratorLoadEvent] TIER 2 OVERLOAD TRIP! Load=" + (string)((int)totalTrainLoad) + "kW / " + (string)((int)loadPercentage) + "%");
		}
		// TIER 1 TRIP (>95% for 60s) — HEP Cutoff, engines keep running at idle
		else if (state.overload_97_timer >= 60.0f and state.loadElectrical and state.m_EngineCheck) {
			// Disconnect HEP — engines drop to idle, no power to coaches
			state.toggleLoadElectrical = false;
			state.loadElectrical = false;
			cnrSystems.ToggleCoachAnimation(me, "load-electrical", false);
			UpdateTrainLCDSigns();
			dmiSystem.UpdateLCDAnimations(me, state);
			state.overload_97_timer = 0.0f;
			dmiSystem.AddLog(state, "WARN", "OVERLOAD TRIP T1: Load " + (string)((int)loadPercentage) + "% > 95% sustained 60s — HEP CUTOFF, Engines at Idle", me);
			PrintDebug("[GeneratorLoadEvent] TIER 1 OVERLOAD. HEP Cutoff. Load=" + (string)((int)totalTrainLoad) + "kW");
		}

		// --- APVC AUTO-SEQUENCE LOGIC ---
		// Implicitly sync primary engine if only one is running
		if (state.m_EngineStats1 and !state.m_EngineStats2) state.primary_engine = 1;
		else if (state.m_EngineStats2 and !state.m_EngineStats1) state.primary_engine = 2;

		if (state.engine_lockout_timer <= 0.0f) {
			// 1. Auto-Start Backup Engine (>80% Load sustained for 30s)
			// 30-second delay prevents false triggers from brief load spikes or voltage swings.
			bool wantBackup = false;
			if (state.primary_engine == 1 and state.m_EngineStats1 and !state.m_EngineStats2 and !state.auto_start_e2_blocked) wantBackup = (state.Eloaded > 80.0f);
			else if (state.primary_engine == 2 and state.m_EngineStats2 and !state.m_EngineStats1 and !state.auto_start_e1_blocked) wantBackup = (state.Eloaded > 80.0f);

			if (wantBackup) {
				state.auto_start_backup_timer = state.auto_start_backup_timer + (currentTime - state.last_GeneratorLoadEvent_time);
				if (state.auto_start_backup_timer >= 30.0f) {
					state.auto_start_backup_timer = 0.0f;
					if (state.primary_engine == 1) {
						state.m_EngineStats2 = true;
						dmiSystem.AddLog(state, "WARN", "APVC: LOAD > 80% / 30s (AUTO E2 START)", me);
					} else {
						state.m_EngineStats1 = true;
						dmiSystem.AddLog(state, "WARN", "APVC: LOAD > 80% / 30s (AUTO E1 START)", me);
					}
				}
			} else {
				state.auto_start_backup_timer = 0.0f; // Reset if load drops below threshold
			}
		} else {
			state.auto_start_backup_timer = 0.0f;
		}

		// 2. Auto-Stop Backup Engine (Sufficient & Stable Load)
		if (state.m_EngineStats1 and state.m_EngineStats2 and totalTrainLoad < (0.7f * 450.0f)) {
			state.auto_stop_timer = state.auto_stop_timer + (currentTime - state.last_GeneratorLoadEvent_time);
			if (state.auto_stop_timer > 15.0f) { // 15 seconds stability check
				if (state.primary_engine == 1) {
					state.m_EngineStats2 = false;
					state.auto_start_e2_blocked = false; // Reset block when naturally stopping
					dmiSystem.AddLog(state, "INFO", "APVC: LOAD STABLE (AUTO E2 STOP)", me);
				} else {
					state.m_EngineStats1 = false;
					state.auto_start_e1_blocked = false; // Reset block when naturally stopping
					dmiSystem.AddLog(state, "INFO", "APVC: LOAD STABLE (AUTO E1 STOP)", me);
				}
				state.auto_stop_timer = 0.0f;
			}
		} else {
			state.auto_stop_timer = 0.0f;
			// Reset user block if load drops to a safe level naturally (e.g. < 70%)
			if (state.auto_start_e2_blocked and state.Eloaded < 70.0f) state.auto_start_e2_blocked = false;
			if (state.auto_start_e1_blocked and state.Eloaded < 70.0f) state.auto_start_e1_blocked = false;
		}
		
		state.last_GeneratorLoadEvent_time = currentTime;

		// 6. Detailed Electrical Stats Calculation
		state.gen_kW = totalTrainLoad; 
		state.gen_V_AC = 400.0f * state.voltage;
		
		// 7. 24V DC Simulation (USB/PIS)
		if (state.m_EngineStats1 or state.m_EngineStats2) {
			state.gen_V_DC24 = 24.0f + Math.Rand(-0.1f, 0.1f);
			state.gen_A_DC24 = (state.Eloaded / 100.0f) * 40.0f; // Scale amps to percentage
		} else {
			state.gen_V_DC24 = 0.0f;
			state.gen_A_DC24 = 0.0f;
		}
		if (state.gen_V_AC > 10.0f) {
			state.gen_Amps = (state.gen_kW * 1000.0f) / (1.732f * state.gen_V_AC * 0.85f);
		} else {
			state.gen_Amps = 0.0f;
		}
		
		if (state.m_EngineCheck) {
			state.gen_V_DC = 110.0f + (Math.Rand(-1.0f, 1.0f)); 
			state.gen_A_DC = 10.0f + ((state.gen_kW / 900.0f) * 100.0f * 0.15f);
		} else {
			state.gen_V_DC = 96.0f; // Battery only
			state.gen_A_DC = 2.0f;
		}

		// 7. Update display load (Percentage of current active capacity)
		// Always compute from totalTrainLoad which now includes all coaches' baseline idle load.
		// This ensures Eloaded reflects real train-wide load, not just the APVC's own demand.
		float targetDisplayLoad = 20.0f; // Fallback: no engine running yet
		if (maxCapacity > 0) {
			targetDisplayLoad = (totalTrainLoad / maxCapacity) * 100.0f;
		} else if (state.toggleLoadElectrical) {
			targetDisplayLoad = 25.0f; // Dummy load during engine spin-up stabilization
		}
		state.Eloaded = cnrSystems.Lerp(state.Eloaded, targetDisplayLoad, 2.0f); 

		// 8. Individual Engine Loading Trigger Logic
		if (state.toggleLoadElectrical) {
			if (state.engine1_ready and !state.engine1Loaded and !state.engine1Loading) state.engine1Loading = true;
			if (state.engine2_ready and !state.engine2Loaded and !state.engine2Loading) state.engine2Loading = true;
		} else {
			if (state.engine1Loaded and !state.engine1Download) state.engine1Download = true;
			if (state.engine2Loaded and !state.engine2Download) state.engine2Download = true;
		}

		// 8. Detailed Engine Simulation
		float targetRpm1 = 0.0f; float targetTemp1 = 30.0f; float targetOil1 = 0.0f; float targetFlow1 = 0.0f;
		if (state.engine1_ready) {
			if (state.engine1Loaded) {
				targetRpm1 = 1500.0f + Math.Rand(-2.0f, 2.0f);
				targetTemp1 = 82.0f + (state.gen_kW / 900.0f) * 8.0f; 
				targetOil1 = 4.5f + Math.Rand(-0.1f, 0.1f);
				targetFlow1 = 15.0f + (state.gen_kW / 900.0f) * 45.0f;
			} else {
				targetRpm1 = 700.0f + Math.Rand(-10.0f, 10.0f);
				targetTemp1 = 60.0f; 
				targetOil1 = 2.5f + Math.Rand(-0.1f, 0.1f);
				targetFlow1 = 8.0f;
			}
		} else if (state.m_EngineStats1) {
			targetRpm1 = 700.0f + Math.Rand(-5.0f, 5.0f); targetOil1 = 1.2f; targetFlow1 = 5.0f;
		}

		float targetRpm2 = 0.0f; float targetTemp2 = 30.0f; float targetOil2 = 0.0f; float targetFlow2 = 0.0f;
		if (state.engine2_ready) {
			if (state.engine2Loaded) {
				targetRpm2 = 1500.0f + Math.Rand(-2.0f, 2.0f);
				targetTemp2 = 82.0f + (state.gen_kW / 900.0f) * 8.0f; 
				targetOil2 = 4.5f + Math.Rand(-0.1f, 0.1f);
				targetFlow2 = 15.0f + (state.gen_kW / 900.0f) * 45.0f;
			} else {
				targetRpm2 = 700.0f + Math.Rand(-10.0f, 10.0f);
				targetTemp2 = 60.0f; 
				targetOil2 = 2.5f + Math.Rand(-0.1f, 0.1f);
				targetFlow2 = 8.0f;
			}
		} else if (state.m_EngineStats2) {
			targetRpm2 = 700.0f + Math.Rand(-5.0f, 5.0f); targetOil2 = 1.2f; targetFlow2 = 5.0f;
		}

		if (!state.isRPMFlowing1) state.eng1_rpm = targetRpm1;
		if (!state.isRPMFlowing2) state.eng2_rpm = targetRpm2;

		state.eng1_temp = cnrSystems.Lerp(state.eng1_temp, targetTemp1, 0.02f);
		state.eng1_oil_press = cnrSystems.Lerp(state.eng1_oil_press, targetOil1, 2.0f);
		state.eng1_fuel_flow = cnrSystems.Lerp(state.eng1_fuel_flow, targetFlow1, 0.5f);

		state.eng2_temp = cnrSystems.Lerp(state.eng2_temp, targetTemp2, 0.02f);
		state.eng2_oil_press = cnrSystems.Lerp(state.eng2_oil_press, targetOil2, 2.0f);
		state.eng2_fuel_flow = cnrSystems.Lerp(state.eng2_fuel_flow, targetFlow2, 0.5f);

		state.eng2_temp = cnrSystems.Lerp(state.eng2_temp, targetTemp2, 0.02f);
		state.eng2_oil_press = cnrSystems.Lerp(state.eng2_oil_press, targetOil2, 2.0f);
		state.eng2_fuel_flow = cnrSystems.Lerp(state.eng2_fuel_flow, targetFlow2, 0.5f);

		// 9. Cross-Vehicle Synchronization — STAGGERED (1 vehicle per tick to prevent frame spikes)
		// Instead of syncing all coaches in one tick (O(N) SetProperties spike), we advance a
		// pointer each tick and sync only 1 vehicle. For a 12-car train, full scan = 2.4s.
		// Voltage/frequency changes are broadcast via dummy-load-electrical mesh (instant, lightweight).
		bool syncNeeded = false;
		if (Math.Abs(state.voltage - state.last_gen_broadcast_voltage) > 0.01f) syncNeeded = true;
		if (Math.Abs(state.gen_kW - state.last_gen_broadcast_kW) > 2.0f) syncNeeded = true;
		if (Math.Abs(state.script_mr_press - state.last_gen_broadcast_mr) > 0.05f) syncNeeded = true;
		if (currentTime % 10.0f < 0.2f) syncNeeded = true; // Force full rescan every 10s

		if (syncNeeded) {
			// Advance stagger pointer — skip self
			if (state.sync_stagger_idx < 0) state.sync_stagger_idx = 0;
			state.sync_stagger_idx = (state.sync_stagger_idx + 1) % vehicles.size();
			Vehicle sv = vehicles[state.sync_stagger_idx];
			if (sv and sv != me) {
				// CRITICAL: Use NEW empty soup — never call sv.GetProperties() here.
				// Calling GetProperties on another vehicle wakes its script and forces it to
				// serialize ALL state including 45 LCD tags — that's the stutter source.
				// With a new soup, only the 11 tags below are merged via SetProperties.
				// The pass coach SetProperties handler reads missing tags from its own state.
				Soup s = Constructors.NewSoup();
				s.SetNamedTag("voltage",       state.voltage);
				s.SetNamedTag("frequency",      state.frequency);
				s.SetNamedTag("gen_kW",         state.gen_kW);
				s.SetNamedTag("gen_Amps",       state.gen_Amps);
				s.SetNamedTag("gen_V_AC",       state.gen_V_AC);
				s.SetNamedTag("gen_V_DC",       state.gen_V_DC);
				s.SetNamedTag("gen_A_DC",       state.gen_A_DC);
				s.SetNamedTag("gen_V_DC24",     state.gen_V_DC24);
				s.SetNamedTag("gen_A_DC24",     state.gen_A_DC24);
				s.SetNamedTag("script_mr_press",state.script_mr_press);
				s.SetNamedTag("script_cr_press",state.script_cr_press);
				sv.SetProperties(s);
				state.last_gen_broadcast_voltage = state.voltage;
				state.last_gen_broadcast_kW = state.gen_kW;
				state.last_gen_broadcast_mr = state.script_mr_press;
			}
		}

		// 10. Logic for HEP Relay (with Stability Check)
		if(state.m_EngineCheck and state.toggleLoadElectrical and state.voltage > 0.9f){
			if (state.hep_stability_timer < 5.0f) {
				state.hep_stability_timer = state.hep_stability_timer + 0.5f;
				state.loadElectrical = false;
			} else {
				if(!state.loadElectrical) { cnrSystems.ToggleCoachAnimation(me, "load-electrical",true); state.loadElectrical = true; UpdateTrainLCDSigns(); dmiSystem.UpdateLCDAnimations(me, state); }
				state.loadElectrical = true;
			}
		} else {
			state.hep_stability_timer = 0.0f;
			if(state.loadElectrical) { cnrSystems.ToggleCoachAnimation(me, "load-electrical",false); state.loadElectrical = false; UpdateTrainLCDSigns(); dmiSystem.UpdateLCDAnimations(me, state); }
			state.loadElectrical = false;
		}

		// --- TIER 2 ENGINE LOCKOUT & ALARM TIMER ---
		// Counts down 60 seconds. While active:
		// 1. Alarm bells ring continuously
		// 2. Engine restarts are completely blocked (enforced in Event Handlers & DMI)
		if (state.engine_lockout_timer > 0.0f) {
			state.engine_lockout_timer = state.engine_lockout_timer - 0.2f; // Matches 0.2s event interval
			state.bell1_req = 1;
			state.bell2_req = 1;
			
			// Auto clear when finished
			if (state.engine_lockout_timer <= 0.0f) {
				state.engine_lockout_timer = 0.0f;
				state.bell1_req = 0;
				state.bell2_req = 0;
				dmiSystem.AddLog(state, "INFO", "OVERLOAD COOLDOWN: Finished — Engines ready for restart", me);
			}
		}

		PrintDebug("[GeneratorLoadEvent] Coaches=" + (string)vehicles.size() + " | TotalLoad=" + (string)((int)totalTrainLoad) + "kW | MaxCap=" + (string)((int)maxCapacity) + "kW | Eloaded=" + (string)((int)state.Eloaded) + "% | HEP=" + state.loadElectrical + " | V=" + state.voltage);
	}

	void EngineFanCoolerEvent(float currentTime){
		if (currentTime < state.next_EngineFanCoolerEvent_time) return;
		state.next_EngineFanCoolerEvent_time = currentTime + 1.0f;

		if(state.coolerSystem){
			if(state.engineExhaust == 0){
				StartMeshAnimationLoop("cooler-0");
				SetMeshAnimationSpeed("cooler-0", 0.6f);
				SetMeshAnimationFrame("cooler-1", GetMeshAnimationFrameCount("cooler-1"), 1.5f);
				StopMeshAnimation("cooler-1");

				SetMeshVisible("cooler-0",true,0);
				SetMeshVisible("cooler-1",false,0);
				SetMeshVisible("cooler-fixed-0",false,0);
				SetMeshVisible("cooler-fixed-1",true,0);
			}
			else{
				StartMeshAnimationLoop("cooler-1");
				SetMeshAnimationSpeed("cooler-1", 0.6f);
				SetMeshAnimationFrame("cooler-0", GetMeshAnimationFrameCount("cooler-0"), 1.5f);
				StopMeshAnimation("cooler-0");

				SetMeshVisible("cooler-0",false,0);
				SetMeshVisible("cooler-1",true,0);
				SetMeshVisible("cooler-fixed-0",true,0);
				SetMeshVisible("cooler-fixed-1",false,0);
			}
		}
		else{
			SetMeshAnimationFrame("cooler-0", GetMeshAnimationFrameCount("cooler-0"), 1.0f);
			StopMeshAnimation("cooler-0");
			SetMeshAnimationFrame("cooler-1", GetMeshAnimationFrameCount("cooler-1"), 1.0f);
			StopMeshAnimation("cooler-1");

			SetMeshVisible("cooler-0",false,0);
			SetMeshVisible("cooler-1",false,0);
			SetMeshVisible("cooler-fixed-0",true,0);
			SetMeshVisible("cooler-fixed-1",true,0);
		}
	}

	void DynamicSmokeEffect(float currentTime){
		if (currentTime < state.next_DynamicSmokeEffect_time) return;
		state.next_DynamicSmokeEffect_time = currentTime + 0.1f;

		float r = 10; float g = 10; float b = 15; float a_rev = 40;
		float start_r = 90; float start_g = 90; float start_b = 95;
		float end_r = 150; float end_g = 150; float end_b = 160;
		float a_idle = 2;

		if(state.m_EngineStats1){
			if(state.isRevving1){
				SetPFXEmitterRate(0, 0, 200);
				SetPFXEmitterMaxSize(0, 0, 2);
				SetPFXEmitterVelocity(0, 0, 10);
				SetPFXEmitterStartColor(0, 0, r, g, b, a_rev);
				SetPFXEmitterEndColor(0, 0, r, g, b, a_rev);
			}
			else{
				SetPFXEmitterRate(0, 0, 100);
				SetPFXEmitterMaxSize(0, 0, 2);
				SetPFXEmitterStartColor(0, 0, start_r, start_g, start_b, a_idle);
				SetPFXEmitterEndColor(0, 0, end_r, end_g, end_b, a_idle);
			}
		}

		if(state.m_EngineStats2){
			if(state.isRevving2){
				SetPFXEmitterRate(1, 0, 200);
				SetPFXEmitterMaxSize(1, 0, 2);
				SetPFXEmitterVelocity(1, 0, 10);
				SetPFXEmitterStartColor(1, 0, r, g, b, a_rev);
				SetPFXEmitterEndColor(1, 0, r, g, b, a_rev);
			}
			else{
				SetPFXEmitterRate(1, 0, 100);
				SetPFXEmitterMaxSize(1, 0, 2);
				SetPFXEmitterVelocity(1, 0, 10);
				SetPFXEmitterStartColor(1, 0, start_r, start_g, start_b, a_idle);
				SetPFXEmitterEndColor(1, 0, end_r, end_g, end_b, a_idle);
			}
		}
	}

/* +================================================================================================================================================================+ */
/* |                                                                                                                                                                | */
/* |   ██████╗ ██████╗  █████╗  ██████╗██╗  ██╗           ███████╗██╗   ██╗██████╗ ██████╗ ██╗  ██╗   ██╗    ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗  | */
/* |  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║  ██║    ██╗    ██╔════╝██║   ██║██╔══██╗██╔══██╗██║  ╚██╗ ██╔╝    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║  | */
/* |  ██║     ██║   ██║███████║██║     ███████║    ╚═╝    ███████╗██║   ██║██████╔╝██████╔╝██║   ╚████╔╝     ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║  | */
/* |  ██║     ██║   ██║██╔══██║██║     ██╔══██║    ██╗    ╚════██║██║   ██║██╔═══╝ ██╔═══╝ ██║    ╚██╔╝      ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║  | */
/* |  ╚██████╗╚██████╔╝██║  ██║╚██████╗██║  ██║    ╚═╝    ███████║╚██████╔╝██║     ██║     ███████╗██║       ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║  | */
/* |   ╚═════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝           ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝╚═╝       ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝  | */
/* |                                                                                                                                                                | */
/* +================================================================================================================================================================+ */

	void UpdateTrainLCDSigns(void) {
		dmiSystem.UpdateLCDSigns(me, state);
		dmiSystem.UpdateLCDAnimations(me, state);
		cnrSystems.UpdateLCDTextureState(me, state, false);
	}

	void GeneralCheckSystem(float currentTime){
		if (currentTime < state.next_GeneralCheckSystem_time) return;
		state.next_GeneralCheckSystem_time = currentTime + 0.5f;

		if(me.GetVelocity() * 3.6 < -0.1)
			state.speed = me.GetVelocity() * -3.6;
		else
			state.speed = me.GetVelocity() * 3.6;

		// Deceleration calculation (m/s2)
		float current_v_ms = me.GetVelocity();
		if (current_v_ms < 0) current_v_ms = -current_v_ms; // Use absolute value for deceleration rate
		float dt = currentTime - state.last_speed_time;
		if (dt > 0.2f) {
			float dv = current_v_ms - state.last_speed;
			float accel = dv / dt;
			// Round to 2 decimal places
			int accel_i = (int)(accel * 100.0f);
			state.deceleration_ms2 = (float)accel_i / 100.0f;

			state.last_speed = current_v_ms;
			state.last_speed_time = currentTime;
		}

		state.mr_press = state.script_mr_press;
		state.bp_press = 98101.7 * (me.GetEngineParam("brake-pipe-pressure") - 0.00103341);
		state.bc_press = 98101.7 * (me.GetEngineParam("brake-cylinder-pressure") - 0.00103341);

		state.m_EngineCheck = (state.engine1_ready or state.engine2_ready);
		state.coolerSystem = state.m_EngineCheck;
		state.m_DoorInterlock = (me.GetMeshAnimationFrame("dummy-doorinterlock") == 0);

		if(state.m_intSeatCoachType == 2){
			if(World.GetGameTime() >= 0.33 and World.GetGameTime() <= 0.75) state.m_isDaySeat = false;
			else state.m_isDaySeat = true;
			onInteriorChange();
		}
	}

	public void SetProperties(Soup p_soup) {
		inherited(p_soup);
		if (!state) {
			state = new CNR_State_GenCoach();
			state.StateInit();
		}
		state.handbrake = p_soup.GetNamedTagAsBool("handbrake", state.handbrake);
		if (dmiSystem and state) {
			dmiSystem.SetProperties(p_soup, state);
			state.door_interlock_bypass = (p_soup.GetNamedTagAsInt("door_interlock_bypass", (int)state.door_interlock_bypass) != 0);
			state.door_interlock_speed = p_soup.GetNamedTagAsFloat("door_interlock_speed", state.door_interlock_speed);

			bool changed = false;

			bool newForceZero = (p_soup.GetNamedTagAsInt("lcd_force_zero", (int)state.lcd_force_zero) != 0);
			if (state.lcd_force_zero != newForceZero) {
				state.lcd_force_zero = newForceZero;
				changed = true;
			}

			state.script_mr_press = p_soup.GetNamedTagAsFloat("script_mr_press", state.script_mr_press);
			state.script_cr_press = p_soup.GetNamedTagAsFloat("script_cr_press", state.script_cr_press);
			
			int newMode = p_soup.GetNamedTagAsInt("car_num_mode", state.car_num_mode);
			if (state.car_num_mode != newMode) {
				state.car_num_mode = newMode;
				state.lcd_manual_dirty = true;
			}
			
			int i;
			int p;
			if (p_soup.GetNamedTagAsInt("has_lcd_save", 0) == 1) {
				if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
				for (p = 0; p < 5; p++) {
					bool newEn = p_soup.GetNamedTagAsBool("lcd_page_en_" + (string)p, state.lcd_page_enabled[p]);
					state.lcd_page_enabled[p] = newEn;
					Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)p);
				if (!pageSoup) {
					pageSoup = Constructors.NewSoup();
					state.lcd_config_pages.SetNamedSoup("page_" + (string)p, pageSoup);
				}
				int ln;
				for (ln = 0; ln < 9; ln++) {
					string tag = "lcd_page_" + (string)p + "_line_" + (string)ln;
					if (p_soup.GetNamedTagAsInt("has_lcd_save", 0) == 1) {
						string newVal = p_soup.GetNamedTag(tag);
						if (pageSoup.GetNamedTag("line_" + (string)ln) != newVal) {
							pageSoup.SetNamedTag("line_" + (string)ln, newVal);
							changed = true;
						}
					}
				}
				// CRITICAL FIX: Commit sub-soup back to parent
				state.lcd_config_pages.SetNamedSoup("page_" + (string)p, pageSoup);
			}

			// Legacy restore for old saves
			if (p_soup.GetNamedTagAsInt("has_lcd_save", 0) == 1 and !p_soup.GetNamedTagAsBool("lcd_new_save", false)) {
				Soup p1 = state.lcd_config_pages.GetNamedSoup("page_0");
				for (i = 0; i < 9; i++) {
					string oldVal = p_soup.GetNamedTag("lcd_config_line_" + i);
					p1.SetNamedTag("line_" + (string)i, oldVal);
					state.lcd_config_lines[i] = oldVal;
				}
			}
			float newBr = p_soup.GetNamedTagAsFloat("lcd_brightness", state.lcd_brightness);
			bool newPwr = p_soup.GetNamedTagAsBool("lcd_power", state.lcd_power);
			if (state.lcd_brightness != newBr or state.lcd_power != newPwr) {
				state.lcd_brightness = newBr;
				state.lcd_power = newPwr;
				changed = true;
			}
				if (changed) {
					// Immediately sync current lines from pages soup before posting message
					bool foundActive = false;
					Soup activePageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_active_page_idx);
					if (activePageSoup) {
						int lIdx;
						for (lIdx = 0; lIdx < 9; lIdx++) {
							state.lcd_config_lines[lIdx] = activePageSoup.GetNamedTag("line_" + (string)lIdx);
						}
					}
					state.lcd_manual_dirty = true;
					PostMessage(me, "CNR-System", "UpdateLCD", 0.05f); // Faster response
				}
			}
		}
		state.mr_press_internal = state.script_mr_press;
		state.cr_press_internal = state.script_cr_press;
	}

	public Soup GetProperties(void) {
		Soup soup = inherited();
		if (!state) return soup;

		soup.SetNamedTag("handbrake", state.handbrake);
		if (dmiSystem and state) {
			dmiSystem.GetProperties(soup, state);
			soup.SetNamedTag("MSTN_Type", 1); 
			// These are updated in MainLoop
			soup.SetNamedTag("doorLeftReal", state.doorLeftReal);
			soup.SetNamedTag("doorRightReal", state.doorRightReal);
			if (state.door_interlock_bypass) soup.SetNamedTag("door_interlock_bypass", 1);
			else soup.SetNamedTag("door_interlock_bypass", 0);
			soup.SetNamedTag("door_interlock_speed", state.door_interlock_speed);
			soup.SetNamedTag("script_mr_press", state.script_mr_press);
			soup.SetNamedTag("script_cr_press", state.script_cr_press);
			soup.SetNamedTag("lcd_force_zero", (int)state.lcd_force_zero);
			soup.SetNamedTag("disc_temp", state.disc_temp);
			soup.SetNamedTag("brake_pipe_state", state.brake_pipe_state);
			soup.SetNamedTag("car_num_mode", state.car_num_mode);
			
			int i;
			for (i = 0; i < 9; i++) {
				soup.SetNamedTag("lcd_config_line_" + i, state.lcd_config_lines[i]);
			}
			int p;
			if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
			for (p = 0; p < 5; p++) {
				soup.SetNamedTag("lcd_page_en_" + (string)p, state.lcd_page_enabled[p]);
				Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)p);
				if (pageSoup) {
					int ln;
					for (ln = 0; ln < 9; ln++) {
						soup.SetNamedTag("lcd_page_" + (string)p + "_line_" + (string)ln, pageSoup.GetNamedTag("line_" + (string)ln));
					}
				}
			}
			soup.SetNamedTag("lcd_new_save", true);
			soup.SetNamedTag("lcd_brightness", state.lcd_brightness);
			soup.SetNamedTag("lcd_power", state.lcd_power);
			soup.SetNamedTag("has_lcd_save", 1);
		}
		return soup;
	}

	void toggleSeatType(void){
  		switch(state.m_intSeatCoachType){
  			case 0:
  			state.m_intSeatCoachType = 0;
			onInteriorChange();
  			break;

  			case 1:
  			state.m_intSeatCoachType = 1;
			onInteriorChange();
  			break;

  			case 2:
  			state.m_intSeatCoachType = 2;
			onInteriorChange();
  			break;

  			default:
  			break;

  		}
  		if(state.m_intSeatCoachType++>1) state.m_intSeatCoachType = 0;
	}

	public string GetDescriptionHTML(void) {
		return dmiSystem.GetDescriptionHTML(state, me, authState.isVerify);
	}

	thread void UpdateVehicleDoorThread(Vehicle v, string doorName, bool isOpen) {
		// Randomized delay for passenger coaches (Reaction time)
		if (v != me) {
			Sleep(Math.Rand(0.2f, 2.0f));
		} else {
			Sleep(0.1f); // Tiny delay for the master car too
		}

		Soup properties = v.GetProperties();
		if (!properties) return;
		
		// Create an unlocked copy (Trainz Soups are often locked when returned from other vehicles)
		Soup s = Constructors.NewSoup();
		s.Copy(properties);

		// Set property internally
		if (doorName == "door-left") s.SetNamedTag("toggleDoorLeft", isOpen);
		if (doorName == "door-right") s.SetNamedTag("toggleDoorRight", isOpen);

		// Trigger Sound Request in target vehicle (Restored "Old Way")
		int soundReq = 2; if (isOpen) soundReq = 1;
		if (doorName == "door-left") s.SetNamedTag("door_sound_left_req", soundReq);
		else if (doorName == "door-right") s.SetNamedTag("door_sound_right_req", soundReq);
		
		// Ensure target car recognizes power for sound processing (Use actual state)
		s.SetNamedTag("engineStats", state.m_EngineCheck);
		s.SetNamedTag("engine1", state.m_EngineStats1);
		s.SetNamedTag("engine2", state.m_EngineStats2);
		
		v.SetProperties(s);

		// Log door event
		string logMsg = "";
		if (doorName == "door-left") {
			if (isOpen) logMsg = state.GetText("LOG_DOOR_L_OPEN");
			else logMsg = state.GetText("LOG_DOOR_L_CLOSE");
		} else {
			if (isOpen) logMsg = state.GetText("LOG_DOOR_R_OPEN");
			else logMsg = state.GetText("LOG_DOOR_R_CLOSE");
		}
		if (logMsg != "") dmiSystem.AddLog(state, "READY", logMsg, v);

		// REMOTE MESH COMMANDS (Standard CNR logic)
		bool dir = v.GetDirectionRelativeToTrain();
		if (doorName == "door-left") {
			if (dir) v.SetMeshAnimationState("dummy-door-left", isOpen);
			else v.SetMeshAnimationState("dummy-door-right", isOpen);
		} else if (doorName == "door-right") {
			if (dir) v.SetMeshAnimationState("dummy-door-right", isOpen);
			else v.SetMeshAnimationState("dummy-door-left", isOpen);
		}
	}

	thread void MasterDoorControlSelectiveThread(string doorName, bool isOpen) {
		Vehicle[] vehicles = SafeGetVehicles();
		if (vehicles.size() == 0) return;
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			int selState = state.doorSelectionStates.GetNamedTagAsInt((string)i, 1);
			if (selState == 1) {
				UpdateVehicleDoorThread(vehicles[i], doorName, isOpen);
			}
		}
	}

	thread void MasterDoorControlThread(string doorName, bool isOpen) {
		Vehicle[] vehicles = SafeGetVehicles();
		if (vehicles.size() == 0) return;
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			UpdateVehicleDoorThread(vehicles[i], doorName, isOpen);
		}
	}

	// Auto-reset ann_playing flag after announcement estimated duration
	thread void PlayAnnouncementDoneThread(float duration) {
		Sleep(duration);
		state.ann_playing = false;
	}

	thread void ResetBrakeThread(int vIdx) {
		Vehicle[] vehicles = SafeGetVehicles();
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

	public void LinkPropertyValue(string p_propertyID){
		// Note: Sound is played in BrowserClickHandler before this is called.
		// This function only handles ACTION: events recursed from the kernel.

		if (p_propertyID == "ACTION:TOGGLE_SEAT") { toggleSeatType(); return; }
		if (p_propertyID == "ACTION:UPDATE_LCD") { UpdateTrainLCDSigns(); return; }
		if (p_propertyID == "ACTION:OPEN_DMI") { dmiSystem.Show(state, me, m_scriptLib, fuelQ); return; }
		if (p_propertyID == "ACTION:RESET_DMI") { dmiSystem.ResetDMI(me, state, m_scriptLib, fuelQ); return; }
		if (p_propertyID == "ACTION:HANDBRAKE_APPLY") { cnrSystems.BroadcastHandbrake(me, true); return; }
		if (p_propertyID == "ACTION:HANDBRAKE_REL") { cnrSystems.BroadcastHandbrake(me, false); return; }

		// --- ANNOUNCEMENT SOUND PLAYBACK (one-shot, no repeat while playing) ---
		if (p_propertyID.size() > 12 and p_propertyID[0, 12] == "ACTION:ANN_PLAY:") {
			// Format: "ACTION:ANN_PLAY:<id>:<lang>"
			// One-shot guard: if flag still set from last play, ignore duplicate triggers
			// Note: ann_playing is reset by PlayAnnouncementDoneThread() after ~60s max,
			// or immediately on ACTION:ANN_STOP.
			if (!state.ann_playing) {
				string payload = p_propertyID[16, p_propertyID.size()]; // "<id>:<lang>"
				string[] parts = Str.Tokens(payload, ":");
				int annId = 3; int lang = 0; // defaults: Approaching Station / EN
				if (parts.size() >= 1) annId = Str.ToInt(parts[0]);
				if (parts.size() >= 2) lang  = Str.ToInt(parts[1]);
				if (annId < 1) annId = 1;
				if (annId > 12) annId = 12;
				state.ann_playing = true;
				cnrSystems.PlayAnnouncementToTrain(me, annId, lang);
				// Auto-reset after 90s (longest announcement estimate) to allow replay
				PlayAnnouncementDoneThread(90.0f);
			}
			return;
		}

		if (p_propertyID == "ACTION:ANN_STOP") {
			state.ann_playing = false;
			return;
		}

		if (p_propertyID.size() > 19 and p_propertyID[0, 19] == "ACTION:RESET_BRAKE:") {
			int vIdx = Str.ToInt(p_propertyID[19, p_propertyID.size()]);
			ResetBrakeThread(vIdx);
			return;
		}

		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") {
			inherited(p_propertyID);
			return;
		}

		if (p_propertyID.size() >= 15 and p_propertyID[0, 15] == "toggle_lcd_sel_") {
			int vIdx = Str.ToInt(p_propertyID[15, p_propertyID.size()]);
			if (!state.lcdSelectionStates) state.lcdSelectionStates = Constructors.NewSoup();
			int sVal = state.lcdSelectionStates.GetNamedTagAsInt((string)vIdx, 1);
			if (sVal == 1) state.lcdSelectionStates.SetNamedTag((string)vIdx, 0);
			else state.lcdSelectionStates.SetNamedTag((string)vIdx, 1);
			dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			return;
		}

		string res = dmiSystem.LinkPropertyValue(me, state, p_propertyID);
		if (res == "HANDLED") {
			dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			return;
		}
		if (res != "" and res != "UNKNOWN") {
			LinkPropertyValue(res); // Recurse with the actual action
			return;
		}
		
		if (p_propertyID == "ctrl_door_left_toggle" or p_propertyID == "toggleDoorLeft") {
			// SAFETY CHECK: Block opening if overspeed and interlock is ON
			bool overspeed = (state.speed > state.door_interlock_speed and state.m_DoorInterlock and !state.door_interlock_bypass);
			if (overspeed and !state.m_PSGdoorleft) {
				// Block opening (force closed)
				state.m_PSGdoorleft = false;
			} else {
				state.m_PSGdoorleft = !state.m_PSGdoorleft;
			}
			MasterDoorControlSelectiveThread("door-left", state.m_PSGdoorleft);
			dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			return;
		}
		if (p_propertyID == "ctrl_door_left_off") {
			state.m_PSGdoorleft = false;
			MasterDoorControlSelectiveThread("door-left", false);
			dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			return;
		}
		if (p_propertyID == "ctrl_door_right_toggle" or p_propertyID == "toggleDoorRight") {
			// SAFETY CHECK: Block opening if overspeed and interlock is ON
			bool overspeed = (state.speed > state.door_interlock_speed and state.m_DoorInterlock and !state.door_interlock_bypass);
			if (overspeed and !state.m_PSGdoorright) {
				// Block opening (force closed)
				state.m_PSGdoorright = false;
			} else {
				state.m_PSGdoorright = !state.m_PSGdoorright;
			}
			MasterDoorControlSelectiveThread("door-right", state.m_PSGdoorright);
			dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			return;
		}
		if (p_propertyID == "ctrl_door_right_off") {
			state.m_PSGdoorright = false;
			MasterDoorControlSelectiveThread("door-right", false);
			dmiSystem.Show(state, me, m_scriptLib, fuelQ);
			return;
		}
		if(p_propertyID == "state.togglePlatform"){
			state.togglePlatform = !state.togglePlatform;
			cnrSystems.ToggleCoachAnimation(me, "platform-selector", state.togglePlatform);
			dmiSystem.Show(state, me, m_scriptLib, fuelQ);
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

		inherited(p_propertyID);
	}

	void InterfacePropertyChangeHandler(Message msg) {
		LinkPropertyValue(msg.minor);
		// Force immediate physics update on property change
		cnrSystems.PhysicalBrakeUpdate(me, state, m_scriptLib);
	}


	void UpdateLCDHandler(Message msg) {
		UpdateTrainLCDSigns();
	}

	public string GetPropertyType(string p_propertyID){
		string type = dmiSystem.GetPropertyType(p_propertyID);
		if (type != "UNKNOWN") return type;

		if (p_propertyID == "ctrl_door_left_toggle") return "link";
		if (p_propertyID == "ctrl_door_right_toggle") return "link";
		
		// Use length parameters as in user's vehicle.gs example
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") return "string,0,12";
		if (p_propertyID.size() >= 15 and p_propertyID[0, 15] == "toggle_lcd_sel_") return "link";

		return inherited(p_propertyID);
	}

	public string GetPropertyDescription(string p_propertyID) {
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") {
			return state.GetText("LCD_CONFIG_TITLE");
		}
		return inherited(p_propertyID);
	}

	public string GetPropertyValue(string p_propertyID) {
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") {
			int idx = Str.ToInt(p_propertyID[16, p_propertyID.size()]);
			if (idx >= 0 and idx < 9) return state.lcd_config_lines[idx];
		}
		return inherited(p_propertyID);
	}

	public void SetPropertyValue(string p_propertyID, string p_value) {
		if (p_propertyID.size() >= 16 and p_propertyID[0, 16] == "lcd_config_line_") {
			int idx = Str.ToInt(p_propertyID[16, p_propertyID.size()]);
			if (idx >= 0 and idx < 9) {
				// Thai Filtering Logic
				string filtered = "";
				int baseCount = 0;
				int i;
				for (i = 0; i < p_value.size(); i++) {
					string ch = p_value[i, i+1];
					if (!state.IsThaiNonSpacing(ch)) {
						if (baseCount < 12) {
							filtered = filtered + ch;
							baseCount++;
						} else break;
					} else filtered = filtered + ch;
				}

				// UPDATE PERSISTENT SOUP (The missing piece)
				if (!state.lcd_config_pages) state.lcd_config_pages = Constructors.NewSoup();
				Soup pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_edit_page_idx);
				if (!pageSoup) {
					pageSoup = Constructors.NewSoup();
					state.lcd_config_pages.SetNamedSoup("page_" + (string)state.lcd_edit_page_idx, pageSoup);
				}
				pageSoup.SetNamedTag("line_" + (string)idx, filtered);

				// Update active view if editing the current page
				if (state.lcd_edit_page_idx == state.lcd_active_page_idx) {
					state.lcd_config_lines[idx] = filtered;
				}

				state.lcd_manual_dirty = true;
				UpdateTrainLCDSigns(); // Immediate local visual update
			}
			return;
		}
		inherited(p_propertyID, p_value);
	}


	void onInteriorChange(){
		if(!state.m_isDaySeat or state.m_intSeatCoachType == 1){
			SetMeshVisible("seat_night",true,0);
			SetMeshVisible("seat_day",false,0);
		}
		else if(state.m_isDaySeat or state.m_intSeatCoachType == 0){
			SetMeshVisible("seat_night",false,0);
			SetMeshVisible("seat_day",true,0);
		}
		else if(state.m_intSeatCoachType == 2){
			if(!state.m_isDaySeat == 1){
				SetMeshVisible("seat_night",true,0);
				SetMeshVisible("seat_day",false,0);
			}
			else if(state.m_isDaySeat == 0){
				SetMeshVisible("seat_night",false,0);
				SetMeshVisible("seat_day",true,0);
			}
		}
	}

	void onSignalLightChange(float currentTime){
		cnrSystems.onSignalLightChange(me, state, currentTime, textureAsset);
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

	void CouplerHandler(Message msg){
		if(msg.src == me){
			if(msg.minor == "Decoupled"){
				if(me.GetDirectionRelativeToTrain())
					World.PlaySound(soundsAsset,"sounds/external/decoupling.wav",1,1.0,10.0,me,"a.limfront");
				else
					World.PlaySound(soundsAsset,"sounds/external/decoupling.wav",1,1.0,10.0,me,"a.limback");

				// Consist changed — rebuild LCD product cache on next UpdateTrainLCDSigns call
				dmiSystem.InvalidateLCDCache();
				return;
			}

			if(msg.minor == "Coupled"){
				if(me.GetDirectionRelativeToTrain())
					World.PlaySound(soundsAsset,"sounds/external/coupling.wav",1,1.0,10.0,me,"a.limfront");
				else
					World.PlaySound(soundsAsset,"sounds/external/coupling.wav",1,1.0,10.0,me,"a.limback");

				// Consist changed — rebuild LCD product cache and apply current route
				dmiSystem.InvalidateLCDCache();
				UpdateTrainLCDSigns();
				
				// Re-initialize selection states for new vehicles
				if (!state.lcdSelectionStates) state.lcdSelectionStates = Constructors.NewSoup();
				int i;
				Vehicle[] vehicles = SafeGetVehicles();
				for (i = 0; i < vehicles.size(); i++) {
					if (state.lcdSelectionStates.GetNamedTagAsInt((string)i, -1) == -1) {
						state.lcdSelectionStates.SetNamedTag((string)i, 1);
					}
				}
				// Auto-sync LCD config to all cars
				cnrSystems.BroadcastLCDConfig(me, state, state.lcdSelectionStates);
				
				return;
			}
		}
	}
};
