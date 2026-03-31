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

class cnr_ans_ansh_cab isclass DefaultLocomotiveCabin{
	CNR_State_AnsCab state;


	GameObject 		ownerObj = null;       // เก็บ object ที่ห้องขับถูก attach ให้
    MeshObject 		ownerMesh = null;      // ถ้า owner เป็น MeshObject จะเก็บที่นี่
    Vehicle 		ownerVehicle = null;

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

	Library		 	m_scriptLib;
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
		door_gangway_front =		GetNamedControl("door_gangway_front");
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
		state = new CNR_State_AnsCab();
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
				Interface.Print("cnr_ans_ansh_cab.gs: 'scriptlib' not found in kuid-table of " + asset.GetLocalisedName());
			}
		} else {
			Interface.Print("cnr_ans_ansh_cab.gs: GetAsset() returned null in Init()");
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
        // ANS: ซ้าย/ขวาของ cab สลับกับ AnimMesh เพราะห้องขับหันกลับหลัง
        cabSystem.Init(ownerVehicle, ownerMesh, "doors_light_left", "doors_light_right");

		// Fallback: ถ้าหา scriptlib ในตัว cabin ไม่เจอ ให้พยายามหาจากตัวรถ (Owner)
		if (!m_scriptLib and ownerVehicle) {
			Asset vAsset = ownerVehicle.GetAsset();
			if (vAsset) {
				KUID kuid = vAsset.LookupKUIDTable("scriptlib");
				if (kuid) {
					m_scriptLib = World.GetLibrary(kuid);
					if (m_scriptLib) {
						Interface.Print("cnr_ans_ansh_cab.gs: Found 'scriptlib' from owner vehicle: " + vAsset.GetLocalisedName());
						authHelper.Verify(authState, m_scriptLib);
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
			// Note: ANS has no interior sub-meshes to toggle in this version,
			// but we still throttle the camera polling to save CPU.
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
		// ANS: ไฟซ้าย/ขวาสลับกัน เพราะห้องขับหันกลับหลัง
		bool locked = cabSystem.CnrDoorIndicatorLamp(
			currentTime, m_EngineStats, m_DoorInterlock, isDoorRight, speed,
			"right-passenger-cnr", "doors_light_left", door_interlock_bypass, door_interlock_speed);
		if (locked) m_lockDoorToggle = true;
		else if (m_EngineStats) m_lockDoorToggle = false;
	}

	void CnrDoorIndicatorLampLeft(float currentTime){
		// ANS: ไฟซ้าย/ขวาสลับกัน เพราะห้องขับหันกลับหลัง
		bool locked = cabSystem.CnrDoorIndicatorLamp(
			currentTime, m_EngineStats, m_DoorInterlock, isDoorLeft, speed,
			"left-passenger-cnr", "doors_light_right", door_interlock_bypass, door_interlock_speed);
		if (locked) m_lockDoorToggle = true;
		else if (m_EngineStats) m_lockDoorToggle = false;
	}

	void CnrDoorAutoLamp(float currentTime){
		int newState;

		// Gangway End (ด้านท้าย ANS)
		newState = cabSystem.AutoLampDo(currentTime, door_gangway_front.GetValue(), "led_door_gangway_end", state.autoLamp_gangway_state, state.autoLamp_gangway_next);
		if (newState == 1 and state.autoLamp_gangway_state == 0) state.autoLamp_gangway_next = currentTime + 1.0f;
		state.autoLamp_gangway_state = newState;

		// Gangway Front (ด้านหน้า ANS)
		newState = cabSystem.AutoLampDo(currentTime, door_gangway_end.GetValue(), "led_door_gangway_front", state.autoLamp_int_front_state, state.autoLamp_int_front_next);
		if (newState == 1 and state.autoLamp_int_front_state == 0) state.autoLamp_int_front_next = currentTime + 1.0f;
		state.autoLamp_int_front_state = newState;

		// Gangway INT End
		newState = cabSystem.AutoLampDo(currentTime, door_gangway_int_front.GetValue(), "led_door_gangway_int_end", state.autoLamp_int_end_state, state.autoLamp_int_end_next);
		if (newState == 1 and state.autoLamp_int_end_state == 0) state.autoLamp_int_end_next = currentTime + 1.0f;
		state.autoLamp_int_end_state = newState;

		// Gangway INT Front (ด้านหน้า ANS — ไม่มี state เฉพาะ ใช้ simple toggle)
		if (door_gangway_int_end.GetValue() != 0)
			ownerMesh.SetTextureSelfIllumination("led_door_gangway_int_front", 150, 0, 0);
		else
			ownerMesh.SetTextureSelfIllumination("led_door_gangway_int_front", 0, 80, 0);
	}

    void UserSetControl(CabinControl p_control,float p_value) { 
		if (!authState.isVerify) return;
        inherited(p_control, p_value);

		// -- 左ドアー | ひだりDoor -- //
		if(p_control == door_out_low_left or p_control == door_in_low_left){
			if(p_value == 1) ToggleDoorSide("right",true,true);
			return;
		}
		
		if(p_control == door_out_high_left or p_control == door_in_high_left){
			if(p_value == 1) ToggleDoorSide("right",false,true);
			return;
		}

		if(p_control == door_in_left_close){
			if(p_value == 1) ToggleDoorSide("right",false,false);
			return;
		}


		// -- 右ドアー | みぎDoor -- //
		if(p_control == door_out_low_right or p_control == door_in_low_right){
			if(p_value == 1) ToggleDoorSide("left",true,true);
			return;
		}
		
		if(p_control == door_out_high_right or p_control == door_in_high_right){
			if(p_value == 1) ToggleDoorSide("left",false,true);
			return;
		}

		if(p_control == door_in_right_close){
			if(p_value == 1) ToggleDoorSide("left",false,false);
			return;
		}

		// -- 通路ドアー | つうろDoor -- //
		if(p_control == door_gangway_front){
			if(p_value == 1)
				ToggleDoorSlideAutomate("door_gangway_front", "front");
			return;
		}

		if(p_control == door_gangway_end){
			if(p_value == 1)
				ToggleDoorSlideAutomate("door_gangway_end", "back");
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
	}
};