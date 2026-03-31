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

include "defaultlocomotivecabin.gs"
include "cnr_state.gs"
include "cnr_auth.gs"
include "cnr_cab_system.gs"

class cnr_anf_cab isclass DefaultLocomotiveCabin{
	CNR_State_AnfCab state;

	GameObject 		ownerObj = null;       // เก็บ object ที่ห้องขับถูก attach ให้
    MeshObject 		ownerMesh = null;      // ถ้า owner เป็น MeshObject จะเก็บที่นี่
    Vehicle 		ownerVehicle = null;

	CabinControl 	door_int_room_anf1,
					door_int_room_anf2,
					door_int_room_anf3,
					door_int_room_anf4,
					door_int_room_anf5,
					door_int_room_anf6,
					door_int_room_anf7,
					door_int_room_anf8,
					door_int_room_anf9,
					door_int_room_anf10,
					door_int_room_anf11,
					door_int_room_anf12;

	CabinControl	door_gangway_front,
					door_gangway_end,
					door_gangway_int_end,
					door_gangway_int_front;

	CabinControl	door_in_high_left,
					door_in_high_right,
					door_in_left_close,
					door_in_low_left,
					door_in_low_right,
					door_in_right_close,
					door_out_high_left,
					door_out_high_right,
					door_out_low_left,
					door_out_low_right;

	CabinControl	air_gauge_bp_pressure,
					air_gauge_bc_pressure;

	bool			m_DoorInterlock,
					m_lockDoorToggle,
					isDoorLeft,
					isDoorRight,
					togglePlatform = true,
					m_EngineStats;

	float 			speed, 
					mr_press, 
					bp_press, 
					bc_press,
					door_interlock_speed = 10.0f;

	bool			door_interlock_bypass = false;

    Train       	myTrain;
    Locomotive  	loco;
    Vehicle     	veh;
    StringTable 	str;

	Library 		m_scriptLib;
	CNR_AuthHandler authHelper;
	CNR_State_Auth 	authState;

	CNR_CabSystem 	cabSystem;

	void 			CnrLoadMeshInit(float currentTime);
	void 			CnrAirGaugeInit(float currentTime);
	void 			CnrDoorIndicatorLampRight(float currentTime);
	void 			CnrDoorIndicatorLampLeft(float currentTime);
	void 			CnrDoorAutoLamp(float currentTime);
	void 			CnrFunctionHandler(float currentTime);
	thread void 	MainLoop();

    void LoadControls(){
		door_int_room_anf1 =		GetNamedControl("door_int_room_anf1");
		door_int_room_anf2 =		GetNamedControl("door_int_room_anf2");
		door_int_room_anf3 =		GetNamedControl("door_int_room_anf3");
		door_int_room_anf4 =		GetNamedControl("door_int_room_anf4");
		door_int_room_anf5 =		GetNamedControl("door_int_room_anf5");
		door_int_room_anf6 =		GetNamedControl("door_int_room_anf6");
		door_int_room_anf7 =		GetNamedControl("door_int_room_anf7");
		door_int_room_anf8 =		GetNamedControl("door_int_room_anf8");
		door_int_room_anf9 =		GetNamedControl("door_int_room_anf9");
		door_int_room_anf10 =		GetNamedControl("door_int_room_anf10");
		door_int_room_anf11 =		GetNamedControl("door_int_room_anf11");
		door_int_room_anf12 =		GetNamedControl("door_int_room_anf12");
		
		door_gangway_front = 		GetNamedControl("door_gangway_front");
		door_gangway_end =			GetNamedControl("door_gangway_end");
		door_gangway_int_end =		GetNamedControl("door_gangway_int_end");
		door_gangway_int_front =	GetNamedControl("door_gangway_int_front");

		door_in_high_left = 		GetNamedControl("door_in_high_left");
		door_in_low_left = 			GetNamedControl("door_in_low_left");
		door_in_left_close = 		GetNamedControl("door_in_left_close");
		door_out_high_left = 		GetNamedControl("door_out_high_left");
		door_out_low_left = 		GetNamedControl("door_out_low_left");

		door_in_high_right = 		GetNamedControl("door_in_high_right");
		door_in_low_right = 		GetNamedControl("door_in_low_right");
		door_in_right_close = 		GetNamedControl("door_in_right_close");
		door_out_high_right = 		GetNamedControl("door_out_high_right");
		door_out_low_right = 		GetNamedControl("door_out_low_right");
		
		air_gauge_bp_pressure = 	GetNamedControl("air_gauge-bp_pressure");
		air_gauge_bc_pressure = 	GetNamedControl("air_gauge-bc_pressure");
    }

	public void Init(void){
		state = new CNR_State_AnfCab();
		state.StateInit();

		authHelper = new CNR_AuthHandler();
		authState = new CNR_State_Auth();
		cabSystem = new CNR_CabSystem();

		inherited();
	
		Asset asset = GetAsset();
		if (asset) {
			// ใช้ GetConfigSoup() แทน LookupKUIDTable เพื่อป้องกัน Crash ถ้าไม่เจอ Key
			Soup kuidSoup = asset.GetConfigSoup().GetNamedSoup("kuid-table");
			KUID kuid = null;
			if (kuidSoup) kuid = kuidSoup.GetNamedTagAsKUID("scriptlib");

			if (kuid) {
				m_scriptLib = World.GetLibrary(kuid);
			} else {
				Interface.Print("cnr_anf_cab.gs: 'scriptlib' not found in kuid-table of " + asset.GetLocalisedName());
			}
		}
		
		if (m_scriptLib) {
			authHelper.Verify(authState, m_scriptLib);
		}

		LoadControls();

		MainLoop();
	}

	// เรียกเมื่อห้องขับถูก attach/detach
    public void Attach(GameObject owner){
        inherited(owner);            // เรียก parent ใว้ก่อน
        ownerObj = owner;

        // พยายาม cast ทันที
        ownerVehicle = cast<Vehicle>(ownerObj);
        ownerMesh = cast<MeshObject>(ownerObj);

        // เชื่อม cabSystem กับ owner
        cabSystem.Init(ownerVehicle, ownerMesh, "doors_light_right", "doors_light_left");

		// Fallback: ถ้าหา scriptlib ในตัว cabin ไม่เจอ ให้พยายามหาจากตัวรถ (Owner)
		if (!m_scriptLib and ownerVehicle) {
			Asset vAsset = ownerVehicle.GetAsset();
			if (vAsset) {
				Soup vKuidSoup = vAsset.GetConfigSoup().GetNamedSoup("kuid-table");
				if (vKuidSoup) {
					KUID kuid = vKuidSoup.GetNamedTagAsKUID("scriptlib");
					if (kuid) {
						m_scriptLib = World.GetLibrary(kuid);
						if (m_scriptLib) {
							Interface.Print("cnr_anf_cab.gs: Found 'scriptlib' from owner vehicle: " + vAsset.GetLocalisedName());
							authHelper.Verify(authState, m_scriptLib);
						}
					}
				}
			}
		}
    }

	thread void MainLoop() {
		while(true) {
			float currentTime = World.GetTimeElapsed();
			if (!authState.isVerify) {
				Sleep(1.0f);
				continue;
			}
			
			CnrFunctionHandler(currentTime);
			CnrAirGaugeInit(currentTime);
			CnrLoadMeshInit(currentTime);
			CnrDoorIndicatorLampRight(currentTime);
			CnrDoorIndicatorLampLeft(currentTime);
			CnrDoorAutoLamp(currentTime);

			// Update ToggleDoorAutomate
			if (state.auto_close_door_gangway_front > 0.0f and currentTime >= state.auto_close_door_gangway_front) {
				ownerMesh.SetMeshAnimationState("door_gangway_front", false);
				state.auto_close_door_gangway_front = 0.0f;
			}
			if (state.auto_close_door_gangway_end > 0.0f and currentTime >= state.auto_close_door_gangway_end) {
				ownerMesh.SetMeshAnimationState("door_gangway_end", false);
				state.auto_close_door_gangway_end = 0.0f;
			}
			if (state.auto_close_door_gangway_int_front > 0.0f and currentTime >= state.auto_close_door_gangway_int_front) {
				ownerMesh.SetMeshAnimationState("door_gangway_int_front", false);
				state.auto_close_door_gangway_int_front = 0.0f;
			}
			if (state.auto_close_door_gangway_int_end > 0.0f and currentTime >= state.auto_close_door_gangway_int_end) {
				ownerMesh.SetMeshAnimationState("door_gangway_int_end", false);
				state.auto_close_door_gangway_int_end = 0.0f;
			}

			// Update ToggleGangwayDoorConnect
			if (state.gangway_connect_direction != "") {
				if (currentTime >= state.gangway_connect_start_time) {
					if (state.target_gangway_veh == null) {
						if (state.gangway_connect_attempt < 5) {
							if (currentTime >= state.gangway_connect_next_attempt_time) {
								Vehicle[] v = ownerVehicle.GetMyTrain().GetVehicles();
								int myIndex = -1;
								int i;
								for (i = 0; i < v.size(); i++) {
									if (v[i] == ownerVehicle) {
										myIndex = i;
										break;
									}
								}
								if (myIndex != -1) {
									int t = 0;
									if(ownerVehicle.GetDirectionRelativeToTrain()){
										if (state.gangway_connect_direction == "front") t = myIndex - 1;
										else if (state.gangway_connect_direction == "back") t = myIndex + 1;
									}
									else{
										if (state.gangway_connect_direction == "front") t = myIndex + 1;
										else if (state.gangway_connect_direction == "back") t = myIndex - 1;
									}
									if (t >= 0 and t < v.size()) {
										state.target_gangway_veh = v[t];
										if (state.gangway_connect_direction == "front") state.target_neighborSide = "end";
										else state.target_neighborSide = "front";
										state.target_gangway_veh.SetMeshAnimationState("door_gangway_" + state.target_neighborSide, true);
										state.gangway_connect_close_time = currentTime + 5.0f;
									} else {
										state.gangway_connect_direction = "";
									}
								} else {
									state.gangway_connect_attempt++;
									state.gangway_connect_next_attempt_time = currentTime + 0.25f;
								}
							}
						} else {
							state.gangway_connect_direction = "";
						}
					} else {
						if (currentTime >= state.gangway_connect_close_time) {
							state.target_gangway_veh.SetMeshAnimationState("door_gangway_" + state.target_neighborSide, false);
							state.gangway_connect_direction = "";
						}
					}
				}
			}

			Sleep(0.1f);
		}
	}

	void CnrAirGaugeInit(float currentTime){
		if (currentTime < state.next_CnrAirGaugeInit_time) return;
		state.next_CnrAirGaugeInit_time = currentTime + 0.01f;
		cabSystem.CnrAirGaugeUpdate(air_gauge_bp_pressure, air_gauge_bc_pressure);
	}

	void CnrFunctionHandler(float currentTime){
		if (currentTime < state.next_CnrFunctionHandler_time) return;
		state.next_CnrFunctionHandler_time = currentTime + 0.1f;

		m_EngineStats = (ownerMesh.GetMeshAnimationFrame("dummy-load-electrical") > 1);

		if(m_EngineStats){
			togglePlatform = (GetMeshAnimationFrame("dummy-platform-selector") > 0);
			m_DoorInterlock = (ownerMesh.GetMeshAnimationFrame("dummy-doorinterlock") < 1);
		bool dir = ownerVehicle.GetDirectionRelativeToTrain();
		if (dir) {
			isDoorLeft = ownerMesh.GetMeshAnimationFrame("dummy-door-left") > 1;
			isDoorRight = ownerMesh.GetMeshAnimationFrame("dummy-door-right") > 1;
		} else {
			isDoorLeft = ownerMesh.GetMeshAnimationFrame("dummy-door-right") > 1;
			isDoorRight = ownerMesh.GetMeshAnimationFrame("dummy-door-left") > 1;
		}
		}

		if(ownerVehicle.GetVelocity() * 3.6 < -0.1)
			speed = ownerVehicle.GetVelocity() * -3.6;
		else
			speed = ownerVehicle.GetVelocity() * 3.6;

		mr_press = cabSystem.GetPressureParam("main-reservoir-pressure");
		bp_press = cabSystem.GetPressureParam("brake-pipe-pressure");
		bc_press = cabSystem.GetPressureParam("brake-cylinder-pressure");

		// ดึงค่าการตั้งค่าจากตัวรถ (Owner Vehicle Properties)
		if (ownerVehicle) {
			Soup s = ownerVehicle.GetProperties();
			if (s) {
				door_interlock_bypass = (s.GetNamedTagAsInt("door_interlock_bypass", 0) != 0);
				door_interlock_speed = s.GetNamedTagAsFloat("door_interlock_speed", 10.0f);
			}
		}
   	}

	void ToggleGangwayDoorConnect(string direction){
        if (state.gangway_connect_direction == "") {
            state.gangway_connect_direction = direction;
            state.gangway_connect_start_time = World.GetTimeElapsed() + 0.5f;
            state.gangway_connect_attempt = 0;
            state.target_gangway_veh = null;
        }
	}

	void CnrLoadMeshInit(float currentTime){
		if (currentTime < state.next_CnrLoadMeshInit_time) return;
		state.next_CnrLoadMeshInit_time = currentTime + 0.5f;

		int inInterior = (int)(World.GetCameraMode() == 1);
		if (state.last_cam_in_interior != inInterior) {
			state.last_cam_in_interior = inInterior;
			bool showInteriorMeshes = (inInterior == 0);

			ownerMesh.SetMeshVisible("door_int_room_anf1", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf2", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf3", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf4", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf5", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf6", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf7", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf8", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf9", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf10", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf11", showInteriorMeshes, 0);
			ownerMesh.SetMeshVisible("door_int_room_anf12", showInteriorMeshes, 0);

			ownerMesh.SetMeshVisible("door_gangway_end", showInteriorMeshes, 0);
		}
	}

	void ToggleDoorAutomate(string mesh, bool toggle){
		ownerMesh.SetMeshAnimationState(mesh, toggle);
		float target = World.GetTimeElapsed() + 5.0f;
		if (mesh == "door_gangway_front") state.auto_close_door_gangway_front = target;
		else if (mesh == "door_gangway_end") state.auto_close_door_gangway_end = target;
		else if (mesh == "door_gangway_int_front") state.auto_close_door_gangway_int_front = target;
		else if (mesh == "door_gangway_int_end") state.auto_close_door_gangway_int_end = target;
	}

	void ToggleDoorSlideAutomate(string mesh, string nextDoorConnect){
		if(ownerMesh.GetMeshAnimationFrame(mesh) < 1){
			ToggleDoorAutomate(mesh,true);
			if(nextDoorConnect != null) ToggleGangwayDoorConnect(nextDoorConnect);
			Interface.Print("[ToggleDoorSlideAutomate] open");
		}
		else{
			ownerMesh.SetMeshAnimationState(mesh, false);
			Interface.Print("[ToggleDoorSlideAutomate] close");
		}
	}

	void ToggleDoorSide(string side, bool togglePlatformReq, bool toggleOpenReq){
		if(!m_lockDoorToggle){
			// Update Platform Toggle if different
			if (togglePlatformReq != (GetMeshAnimationFrame("dummy-platform-selector") > 0)) {
				ownerVehicle.PostMessage(ownerVehicle, "Interface-Property-Change", "state.togglePlatform", (int)togglePlatformReq);
			}
			
			// Trigger Door Toggle if different
			bool currentOpen = false;
			if (side == "left") currentOpen = isDoorLeft;
			else if (side == "right") currentOpen = isDoorRight;
			
			if (toggleOpenReq != currentOpen) {
				string prop = "ctrl_door_" + side;
				if (toggleOpenReq) prop = prop + "_toggle";
				else prop = prop + "_off";
				
				ownerVehicle.PostMessage(ownerVehicle, "Interface-Property-Change", prop, 0);
			}
		}
		return;
	}

	void CnrDoorIndicatorLampRight(float currentTime){
		bool locked = cabSystem.CnrDoorIndicatorLamp(
			currentTime, m_EngineStats, m_DoorInterlock, isDoorRight, speed,
			"right-passenger-cnr", "doors_light_right", door_interlock_bypass, door_interlock_speed);
		if (locked) m_lockDoorToggle = true;
		else if (m_EngineStats) m_lockDoorToggle = false;
	}

	void CnrDoorIndicatorLampLeft(float currentTime){
		bool locked = cabSystem.CnrDoorIndicatorLamp(
			currentTime, m_EngineStats, m_DoorInterlock, isDoorLeft, speed,
			"left-passenger-cnr", "doors_light_left", door_interlock_bypass, door_interlock_speed);
		if (locked) m_lockDoorToggle = true;
		else if (m_EngineStats) m_lockDoorToggle = false;
	}

	void CnrDoorAutoLamp(float currentTime){
		int newState;

		// Gangway Main
		newState = cabSystem.AutoLampDo(currentTime, door_gangway_end.GetValue(), "led_door_gangway", state.autoLamp_gangway_state, state.autoLamp_gangway_next);
		if (newState == 1 and state.autoLamp_gangway_state == 0) state.autoLamp_gangway_next = currentTime + 1.0f;
		state.autoLamp_gangway_state = newState;

		// Gangway INT Front
		newState = cabSystem.AutoLampDo(currentTime, door_gangway_int_front.GetValue(), "led_door_gangway_int_front", state.autoLamp_int_front_state, state.autoLamp_int_front_next);
		if (newState == 1 and state.autoLamp_int_front_state == 0) state.autoLamp_int_front_next = currentTime + 1.0f;
		state.autoLamp_int_front_state = newState;

		// Gangway INT End
		newState = cabSystem.AutoLampDo(currentTime, door_gangway_int_end.GetValue(), "led_door_gangway_int_end", state.autoLamp_int_end_state, state.autoLamp_int_end_next);
		if (newState == 1 and state.autoLamp_int_end_state == 0) state.autoLamp_int_end_next = currentTime + 1.0f;
		state.autoLamp_int_end_state = newState;
	}

    void UserSetControl(CabinControl p_control,float p_value) { 
		if (!authState.isVerify) return;
        inherited(p_control, p_value);

		// -- 左ドアー | ひだりDoor -- //
		if(p_control == door_out_low_left or p_control == door_in_low_left){
			if(p_value == 1) ToggleDoorSide("left",true,true);
			return;
		}
		
		if(p_control == door_out_high_left or p_control == door_in_high_left){
			if(p_value == 1) ToggleDoorSide("left",false,true);
			return;
		}

		if(p_control == door_in_left_close){
			if(p_value == 1) ToggleDoorSide("left",false,false);
			return;
		}


		// -- 右ドアー | みぎDoor -- //
		if(p_control == door_out_low_right or p_control == door_in_low_right){
			if(p_value == 1) ToggleDoorSide("right",true,true);
			return;
		}
		
		if(p_control == door_out_high_right or p_control == door_in_high_right){
			if(p_value == 1) ToggleDoorSide("right",false,true);
			return;
		}

		if(p_control == door_in_right_close){
			if(p_value == 1) ToggleDoorSide("right",false,false);
			return;
		}


		// -- 通路ドアー | つうろDoor -- //
		if(p_control == door_gangway_front){
			ownerMesh.SetMeshAnimationFrame("door_gangway_end", p_value);
			return;
		}

		if(p_control == door_gangway_end){
			if(p_value == 1)
				ToggleDoorSlideAutomate("door_gangway_front", "back");
			return;
		}


		// -- キャビンを結ぶ通路ドアー | CabinをむすぶつうろDoor -- //
		if(p_control == door_gangway_int_front){
			if(p_value == 1) ToggleDoorSlideAutomate("door_gangway_int_front",null);
			return;
		}

		if(p_control == door_gangway_int_end){
			if(p_value == 1) ToggleDoorSlideAutomate("door_gangway_int_end",null);
			return;
		}
	   

	   	// -- キャビンと通路の間のドアー | CabinとつうろのまのDoor -- //
		if(p_control == door_int_room_anf1){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf1",p_value);
			return;
		}

		if(p_control == door_int_room_anf2){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf2",p_value);
			return;
		}

		if(p_control == door_int_room_anf3){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf3",p_value);
			return;
		}

		if(p_control == door_int_room_anf4){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf4",p_value);
			return;
		}

		if(p_control == door_int_room_anf5){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf5",p_value);
			return;
		}

		if(p_control == door_int_room_anf6){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf6",p_value);
			return;
		}

		if(p_control == door_int_room_anf7){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf7",p_value);
			return;
		}

		if(p_control == door_int_room_anf8){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf8",p_value);
			return;
		}

		if(p_control == door_int_room_anf9){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf9",p_value);
			return;
		}

		if(p_control == door_int_room_anf10){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf10",p_value);
			return;
		}

		if(p_control == door_int_room_anf11){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf11",p_value);
			return;
		}

		if(p_control == door_int_room_anf12){
			ownerMesh.SetMeshAnimationFrame("door_int_room_anf12",p_value);
			return;
		}
	}

};