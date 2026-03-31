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

class cnr_arc_cab isclass DefaultLocomotiveCabin{
	CNR_State_ArcCab state;


	GameObject 		ownerObj = null;       // เก็บ object ที่ห้องขับถูก attach ให้
    MeshObject 		ownerMesh = null;      // ถ้า owner เป็น MeshObject จะเก็บที่นี่
    Vehicle 		ownerVehicle = null;

	CabinControl	door_gangway_front,
					door_gangway_end,
					door_gangway_int_end,
					door_gangway_int_front,
					door_kitchen_int;

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

    Train       	myTrain;
    Locomotive  	loco;
    Vehicle     	veh;
    StringTable 	str;

	Library 		m_scriptLib;
	CNR_AuthHandler authHelper;
	CNR_State_Auth 	authState;

	void 			LoadMeshInit(float currentTime);
	thread void 	MainLoop();

    void LoadControls(){
		door_gangway_front =		GetNamedControl("door_gangway_front");
		door_gangway_end =			GetNamedControl("door_gangway_end");
		door_gangway_int_end =		GetNamedControl("door_gangway_int_end");
		door_gangway_int_front =	GetNamedControl("door_gangway_int_front");
		door_kitchen_int = 			GetNamedControl("door_kitchen_int");

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
    }

	public void Init(void){
		state = new CNR_State_ArcCab();
		state.StateInit();
		state.isARC = true;

		authHelper = new CNR_AuthHandler();
		authState = new CNR_State_Auth();

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
				Interface.Print("cnr_arc_cab.gs: 'scriptlib' not found in kuid-table of " + asset.GetLocalisedName());
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
							Interface.Print("cnr_arc_cab.gs: Found 'scriptlib' from owner vehicle: " + vAsset.GetLocalisedName());
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
			
			LoadMeshInit(currentTime);

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

	void LoadMeshInit(float currentTime){
		if (currentTime < state.next_CnrLoadMeshInit_time) return;
		state.next_CnrLoadMeshInit_time = currentTime + 0.5f;

		int inInterior = (int)(World.GetCameraMode() == 1);
		if (state.last_cam_in_interior != inInterior) {
			state.last_cam_in_interior = inInterior;
			bool showInteriorMeshes = (inInterior == 0); // Show if NOT in interior cam (since we're in external view)
			ownerMesh.SetMeshVisible("door_kitchen", showInteriorMeshes, 0);
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

	void ToggleGangwayDoorConnect(string direction){
        if (state.gangway_connect_direction == "") {
            state.gangway_connect_direction = direction;
            state.gangway_connect_start_time = World.GetTimeElapsed() + 0.5f;
            state.gangway_connect_attempt = 0;
            state.target_gangway_veh = null;
        }
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
		// Update Platform Toggle if different
		if (togglePlatformReq != (GetMeshAnimationFrame("dummy-platform-selector") > 0)) {
			ownerVehicle.PostMessage(ownerVehicle, "Interface-Property-Change", "state.togglePlatform", (int)togglePlatformReq);
		}
		
		// Trigger Door Toggle if different
		bool dir = ownerVehicle.GetDirectionRelativeToTrain();
		string meshSide = side;
		if (!dir) {
			if (side == "left") meshSide = "right";
			else if (side == "right") meshSide = "left";
		}
		
		bool currentOpen = (ownerMesh.GetMeshAnimationFrame("dummy-door-" + meshSide) > 1);
		
		if (toggleOpenReq != currentOpen) {
			string prop = "ctrl_door_" + side;
			if (toggleOpenReq) prop = prop + "_toggle";
			else prop = prop + "_off";
			
			ownerVehicle.PostMessage(ownerVehicle, "Interface-Property-Change", prop, 0);
		}
		return;
	}

    void UserSetControl(CabinControl p_control,float p_value) { 
		if (!authState.isVerify) return;
        inherited(p_control, p_value);

		if(p_control == door_kitchen_int){
			ownerMesh.SetMeshAnimationFrame("door_kitchen", p_value);
			return;
		}

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