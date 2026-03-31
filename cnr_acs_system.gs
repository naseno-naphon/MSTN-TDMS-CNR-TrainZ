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

include "GS.gs"
include "Vehicle.gs"
include "Train.gs"
include "Library.gs"

class CNR_AcsSystem isclass GSObject {
	public define int 	CAR_DERAILED = -1;
	public define int 	CAR_CENTER = 0;
	public define int 	CAR_FRONT = 1;
	public define int 	CAR_BACK = 2;
	public define int 	CAR_SINGLE = 3;

	public int   		m_carPosition = -2;
	public float		m_sleepRandomiser;
	public bool  		m_bFacingWithinTrain = true;
	public bool  		m_bTimerActive = false;
	public bool			m_bIsFlyShunting = true;

	Vehicle				m_vehicle;
	Train				m_myTrain;
	Vehicle				m_frontVehicle;
	Vehicle				m_backVehicle;
	public Library		m_acsLib;
	string				m_pipeCouplerSide = "front";

	public void 		UpdateCarPosition(void);
	public void 		CommunicateToCoupledVehicles(void);
	public void 		UpdateLights(void);
	public int 			DetermineCarPosition(void);

	public void Init(Vehicle vehicle, Library acsLib, float sleepRandomiser, string pipeCouplerSide) {
		m_vehicle = vehicle;
		m_acsLib = acsLib;
		m_sleepRandomiser = sleepRandomiser;
		m_pipeCouplerSide = pipeCouplerSide;
	}

	public int DetermineCarPosition(void){
		if (!m_vehicle) return CAR_SINGLE;
		if (m_vehicle.IsDerailed())
		  	return CAR_DERAILED;

		Train myTrain = m_vehicle.GetMyTrain();
		if (!myTrain)
			return CAR_SINGLE;

		Vehicle[] cars = myTrain.GetVehicles();
		if (cars.size() <= 1)
		  	return CAR_SINGLE;

		if (cars[0] == m_vehicle)
		  	return CAR_FRONT;

		if (cars[cars.size() - 1] == m_vehicle)
		  	return CAR_BACK;

		return CAR_CENTER;
	}

	public void UpdateLights(void){
		if (!m_vehicle) return;
		switch (m_carPosition){
			default:
			case CAR_DERAILED:
			case CAR_CENTER:
				m_vehicle.SetMeshVisible("endcar_front_sign",false,0);
				m_vehicle.SetMeshVisible("endcar_back_sign",false,0);
			break;

			case CAR_SINGLE:
			case CAR_FRONT:
				if (m_vehicle.GetDirectionRelativeToTrain()){
					m_vehicle.SetMeshVisible("endcar_front_sign",true,0);
					m_vehicle.SetMeshVisible("endcar_back_sign",false,0);
				}
				else{
					m_vehicle.SetMeshVisible("endcar_front_sign",false,0);
					m_vehicle.SetMeshVisible("endcar_back_sign",true,0);
				}
			break;

			case CAR_BACK:
				if (m_vehicle.GetDirectionRelativeToTrain()){
					m_vehicle.SetMeshVisible("endcar_front_sign",false,0);
					m_vehicle.SetMeshVisible("endcar_back_sign",true,0);
				}
				else{
					m_vehicle.SetMeshVisible("endcar_front_sign",true,0);
					m_vehicle.SetMeshVisible("endcar_back_sign",false,0);
				}
			break;
		}
	}

	public void UpdateCarPosition(void){
		if (!m_vehicle) return;

		int position = DetermineCarPosition();
		bool bFacing = m_vehicle.GetDirectionRelativeToTrain();

		// Check for position change (Consist Change)
		if (m_carPosition != -2 and position != m_carPosition) {
			m_vehicle.PostMessage(m_vehicle, "DMI-System", "Reset", 0.5f + m_sleepRandomiser);
		}

		// Update state
		m_carPosition = position;
		m_bFacingWithinTrain = bFacing;

		UpdateLights();
		
		// Timer management instead of threads
		if (m_carPosition > CAR_CENTER) {
			if (!m_bTimerActive) {
				m_bTimerActive = true;
				m_vehicle.PostMessage(m_vehicle, "ACScallback", "PollTimer", m_sleepRandomiser);
			}
		} else {
			m_bTimerActive = false;
		}
	}

	public void CommunicateToCoupledVehicles(void){
		if (!m_vehicle) return;
		Train myTrain = m_vehicle.GetMyTrain();
		if (!myTrain) return;

		Vehicle[] cars = myTrain.GetVehicles();
		int myPosition;

		for (myPosition = 0; myPosition < cars.size(); ++myPosition){
		  	if (cars[myPosition] == m_vehicle)
		    	break;
		}

		if (!m_vehicle.GetDirectionRelativeToTrain()){
			if (myPosition + 1 < cars.size())
			  	m_frontVehicle = cars[myPosition + 1];
			else
			  	m_frontVehicle = null;

			if (myPosition - 1 >= 0)
			  	m_backVehicle = cars[myPosition - 1];
			else
			  	m_backVehicle = null;
		}
		else{
			if (myPosition + 1 < cars.size())
			  	m_backVehicle = cars[myPosition + 1];
			else
			  	m_backVehicle = null;

			if (myPosition - 1 >= 0)
			  	m_frontVehicle = cars[myPosition - 1];
			else
			  	m_frontVehicle = null;
		}
	}	

	public void FlyShuntHandler(Message msg){
		if (!m_vehicle) return;
		Train myTrain = m_vehicle.GetMyTrain();
		if (!myTrain) return;

		if (m_bIsFlyShunting and !myTrain.GetFrontmostLocomotive()){
			m_bIsFlyShunting = false;
			m_vehicle.SetMeshAnimationState("handbrake", true);
			m_vehicle.PostMessage(m_vehicle, "ACScallback", "DisablePhysics", 1.0f);
		}
	}

	public void VehicleDerailHandler(Message msg){
		if (!m_vehicle or msg.src != m_vehicle)
		  return;

		UpdateCarPosition();

		m_vehicle.PostMessage(m_vehicle, "ACScallback", "DelayedRecalc", 0.5f + m_sleepRandomiser);
	}

	public void VehicleCoupleHandler(Message msg){
		if (!m_vehicle) return;
		UpdateCarPosition();
		CommunicateToCoupledVehicles();
		if (msg.src == m_vehicle){
		  	m_vehicle.PostMessage(m_vehicle, "ACScallback", "DelayedRecalc", 0.5f + m_sleepRandomiser);
		}

		Train myTrain = m_vehicle.GetMyTrain();
		if (myTrain) {
			if (!myTrain.GetFrontmostLocomotive()){
				float limit = Train.MPH_TO_MPS / 2;

				if (Math.Fabs(myTrain.GetTrainVelocity()) > limit){
					m_bIsFlyShunting = true;
				}
				else{
					m_vehicle.PostMessage(m_vehicle, "ACScallback", "DisablePhysics", 1.0f);
				}
			}
		}
	}

	public void VehicleDecoupleHandler(Message msg){
		if (!m_vehicle) return;
		UpdateCarPosition();
		CommunicateToCoupledVehicles();
		m_vehicle.PostMessage(m_vehicle, "ACScallback", "DelayedRecalc", 0.5f + m_sleepRandomiser);

		Train myTrain = m_vehicle.GetMyTrain();
		if (myTrain) {
			if (!myTrain.GetFrontmostLocomotive()){
				m_bIsFlyShunting = true;
			}
		}
	}

	public void ACShandler(Message msg){
		if (!m_vehicle) return;

		// Timer-based polling logic
		if (msg.minor == "PollTimer") {
			m_bTimerActive = false;
			UpdateCarPosition();
			return;
		}

		if (msg.minor == "DelayedRecalc") {
		  	GSObject[] veh = new GSObject[1];
		  	veh[0] = m_vehicle;
		  	if (m_acsLib) m_acsLib.LibraryCall("ACSrecalc", new string[0], veh);
			return;
		}

		if (msg.minor == "DisablePhysics") {
		  	Train t = m_vehicle.GetMyTrain();
		  	if (t and !t.GetFrontmostLocomotive()) t.EnablePhysics(false);
			return;
		}

		if(msg.dst == m_vehicle){
			string[] callback = Str.Tokens(msg.minor, "|");

			if (callback.size() >= 3){
				if (callback[1] == m_pipeCouplerSide){
					if(callback[0] == "coupler"){
						if(callback[2] != "none"){
						   m_vehicle.SetMeshVisible("airbrakepipe-connected",true,0);
						   m_vehicle.SetMeshVisible("airbrakepipe-disconnected",false,0);
						   m_vehicle.SetMeshAnimationState("coupler",true);
						}
						else{
						   m_vehicle.SetMeshVisible("airbrakepipe-connected",false,0);
						   m_vehicle.SetMeshVisible("airbrakepipe-disconnected",true,0);
						   m_vehicle.SetMeshAnimationState("coupler",false);
						}
					}
				}
			}
			else
			  TrainzScript.Log("ERROR: ACS Library returned invalid callback \"" + msg.minor + "\" - not divisible into at least 3 parts!");
		}
  	}
};
