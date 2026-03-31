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

class CNR_Systems {

	// Symmetric Step function for smooth transitions (prevents overshooting)
	public float Lerp(float a, float b, float c) {
		if (a < b) {
			a = a + c;
			if (a > b) a = b;
		} else if (a > b) {
			a = a - c;
			if (a < b) a = b;
		}
		return a;
	}

	// Toggle animation across all vehicles in the train
	public void ToggleCoachAnimation(Vehicle veh, string name, bool boolean) {
		Train myTrain = veh.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			vehicles[i].SetMeshAnimationState("dummy-" + name, boolean);
		}
	}

	// NEW: Broadcast Door Interlock settings to selected vehicles
	public void BroadcastInterlockSettings(Vehicle owner, Soup selection, bool bypass, float speed) {
		Train myTrain = owner.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			if (selection.GetNamedTagAsInt((string)i, 1) == 1) {
				Vehicle v = vehicles[i];
				Soup s = v.GetProperties();
				if (s) {
					s.SetNamedTag("door_interlock_bypass", (int)bypass);
					s.SetNamedTag("door_interlock_speed", speed);
					v.SetProperties(s);
					// Notify script to refresh local state variable from the soup we just set
					v.PostMessage(v, "Interface-Property-Change", "door_interlock_bypass", 0.0f);
					v.PostMessage(v, "Interface-Property-Change", "door_interlock_speed", 0.0f);
				}
			}
		}
	}

	public bool IsCoachByLocalName(Vehicle v) {
		string name = v.GetAsset().GetLocalisedName();
		if (Str.Find(name, "Locomotive", 0) != -1) return false;
		if (Str.Find(name, "Engine", 0) != -1) return false;
		if (Str.Find(name, "Loco", 0) != -1) return false;
		if (Str.Find(name, "Power", 0) != -1) return false;
		if (Str.Find(name, "ANS", 0) != -1) return true;
		if (Str.Find(name, "ANSH", 0) != -1) return true;
		if (Str.Find(name, "ARC", 0) != -1) return true;
		if (Str.Find(name, "APVC", 0) != -1) return true;
		if (Str.Find(name, "ANF", 0) != -1) return true;
		return false;
	}

	// NEW: Broadcast Signal Lamp mode to selected vehicles (APVC/ANF only)
	public void BroadcastSignalLampSettings(Vehicle owner, Soup modeStates) {
		Train myTrain = owner.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			Vehicle v = vehicles[i];
			string vName = v.GetLocalisedName();
			bool isEligible = (Str.Find(vName, "APVC", 0) != -1 or Str.Find(vName, "ANF", 0) != -1);
			if (!isEligible) continue;
			int newMode = modeStates.GetNamedTagAsInt((string)i, 0);
			Soup s = v.GetProperties();
			if (s) {
				s.SetNamedTag("signal_lamp_mode", newMode);
				v.SetProperties(s);
				v.PostMessage(v, "Interface-Property-Change", "signal_lamp_mode", 0.0f);
			}
		}
	}

	// NEW: Broadcast Handbrake to all vehicles in the train
	public void BroadcastHandbrake(Vehicle owner, bool boolean) {
		Train myTrain = owner.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			Vehicle v = vehicles[i];
			v.SetHandBrake(boolean);
			// Update internal properties so scripts can see the change
			Soup s = v.GetProperties();
			if (s) {
				s.SetNamedTag("handbrake", (int)boolean);
				v.SetProperties(s);
				v.PostMessage(v, "Interface-Property-Change", "handbrake", 0.0f);
			}
		}
	}

	// NEW: Broadcast Handbrake to selected vehicles in the train
	public void BroadcastHandbrakeSelective(Vehicle owner, Soup selection, bool boolean) {
		Train myTrain = owner.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			if (selection.GetNamedTagAsInt((string)i, 0) == 1) {
				Vehicle v = vehicles[i];
				v.SetHandBrake(boolean);
				Soup s = v.GetProperties();
				if (s) {
					s.SetNamedTag("handbrake", (int)boolean);
					v.SetProperties(s);
					v.PostMessage(v, "Interface-Property-Change", "handbrake", 0.0f);
				}
			}
		}
	}


	// Centralized Air Conditioning System logic
	public void EventAirConditional(Vehicle veh, CNR_State_Base state, float currentTime) {
		if (state.aircon_state == 2) state.ac_temp = Lerp(state.ac_temp, 22.0f, 0.005f);
		else state.ac_temp = Lerp(state.ac_temp, 35.0f, 0.002f);

		// Responsive Voltage Monitoring
		if (state.voltage < 0.85f) {
			// Increment sag timer for sustained drop protection (assuming 0.1s call rate or tracking delta)
			state.aircon_sag_timer = state.aircon_sag_timer + 0.1f;
			
			// Only trigger forced shutdown if voltage is low for more than 3.0 seconds
			if (state.aircon_sag_timer > 3.0f) {
				if (state.aircon_state == 1 or state.aircon_state == 2) {
					veh.StopSoundScriptEvent("air_start");
					veh.StopSoundScriptEvent("air_loop");
					veh.PlaySoundScriptEvent("air_stop");
					state.aircon_state = 4; // Forced shutdown / Cooldown
					state.aircon_m_time = 60; // 1 minute cooldown
					state.aircon_next_time = currentTime + 10.0f; 
				}
				return; // Keep timer accumulated while voltage is low
			}
		} else {
			// Reset sag timer instantly if voltage is healthy
			state.aircon_sag_timer = 0.0f;
		}

		if (currentTime < state.aircon_next_time) return;

		bool hasPower = (state.m_EngineStats or state.m_EngineCheck);
		if (state.isclass(CNR_State_PassCoach)) hasPower = state.m_EngineStats;
		
		// Hysteresis: Require 92% voltage to attempt starting from idle
		if (state.aircon_state == 0 and state.voltage < 0.92f) return;
		if (state.aircon_state == 0) {
			if (hasPower) {
				if (Math.Rand(0.0f, 1.0f) <= 0.2f) { // 20% chance to start per check
					veh.StopSoundScriptEvent("air_start"); veh.StopSoundScriptEvent("air_loop"); veh.StopSoundScriptEvent("air_stop");
					veh.PlaySoundScriptEvent("air_start");
					veh.StartMeshAnimationLoop("air_conditioner");
					veh.SetMeshAnimationSpeed("air_conditioner", 1.0f);
					state.aircon_state = 1;
					state.aircon_next_time = currentTime + 1.858f;
				} else {
					state.aircon_next_time = currentTime + 1.0f; 
				}
			} else {
				state.aircon_next_time = currentTime + 2.0f;
			}
		}
		else if (state.aircon_state == 1) {
			veh.StopSoundScriptEvent("air_start");
			veh.PlaySoundScriptEvent("air_loop");
			state.aircon_m_time = Math.Rand(45, 120);
			state.aircon_state = 2;
			state.aircon_next_time = currentTime;
		}
		else if (state.aircon_state == 2) {
			state.aircon_m_time = state.aircon_m_time - 1;

			if (!hasPower or state.aircon_m_time <= 0) {
				veh.StopSoundScriptEvent("air_loop");
				veh.PlaySoundScriptEvent("air_stop");
				state.aircon_state = 3;
				state.aircon_next_time = currentTime + 1.858f; // Animation/Sound stopping duration
			} else {
				state.aircon_next_time = currentTime + 1.0f;
			}
		}
		else if (state.aircon_state == 3) {
			veh.StopSoundScriptEvent("air_stop");
			veh.StopMeshAnimation("air_conditioner");
			state.aircon_m_time = Math.Rand(15, 45);
			state.aircon_state = 4;
			state.aircon_next_time = currentTime;
		}
		else if (state.aircon_state == 4) {
			state.aircon_m_time = state.aircon_m_time - 1;
			if (state.aircon_m_time <= 0) {
				state.aircon_state = 0;
				state.aircon_next_time = currentTime + 1.0f;
			} else {
				state.aircon_next_time = currentTime + 1.0f;
			}
		}
	}

	// Centralized Flushing Toilet System logic
	public void EventFlushingToilet(Vehicle veh, CNR_State_Base state, float currentTime) {
		if (currentTime < state.toilet_next_time) return;

		bool hasPower = (state.m_EngineStats or state.m_EngineCheck);
		if (state.isclass(CNR_State_PassCoach)) hasPower = state.m_EngineStats;
		
		if (state.toilet_state == 0) {
			if (hasPower) {
				if (Math.Rand(0.0f, 1.0f) <= 0.1f) {
					veh.StopSoundScriptEvent("air_toilet_start"); veh.StopSoundScriptEvent("air_toilet_loop"); veh.StopSoundScriptEvent("air_toilet_stop");
					veh.PlaySoundScriptEvent("air_toilet_start");
					state.toilet_state = 1;
					state.toilet_next_time = currentTime + 1.858f;
				} else {
					state.toilet_next_time = currentTime + 2.0f;
				}
			} else {
				state.toilet_next_time = currentTime + 3.0f;
			}
		}
		else if (state.toilet_state == 1) {
			veh.StopSoundScriptEvent("air_toilet_start");
			veh.PlaySoundScriptEvent("air_toilet_loop");
			state.toilet_m_time = Math.Rand(2, 5);
			state.toilet_pipe0 = Math.Rand(0, 5);
			state.toilet_pipe1 = Math.Rand(0, 5);
			state.toilet_state = 2;
			state.toilet_next_time = currentTime;
		}
		else if (state.toilet_state == 2) {
			state.toilet_m_time = state.toilet_m_time - 1;

			veh.PostMessage(veh, "pfx", "+" + state.toilet_pipe0, 0.1f);
			veh.PostMessage(veh, "pfx", "+" + state.toilet_pipe1, 0.1f);

			// Consumption of MR
			if (state.isclass(CNR_State_GenCoach)) {
				CNR_State_GenCoach gs = cast<CNR_State_GenCoach>state;
				gs.mr_press_internal = gs.mr_press_internal - 0.01f;
			}

			if (!hasPower or state.toilet_m_time <= 0) {
				veh.StopSoundScriptEvent("air_toilet_loop");
				veh.PlaySoundScriptEvent("air_toilet_stop");
				state.toilet_state = 3;
				state.toilet_next_time = currentTime + 2.288f;
			} else {
				state.toilet_next_time = currentTime + 1.0f;
			}
		}
		else if (state.toilet_state == 3) {
			veh.StopSoundScriptEvent("air_toilet_stop");
			veh.PostMessage(veh, "pfx", "-" + state.toilet_pipe0, 0.1f);
			veh.PostMessage(veh, "pfx", "-" + state.toilet_pipe1, 0.1f);
			state.toilet_m_time = Math.Rand(60, 240);
			state.toilet_state = 4;
			state.toilet_next_time = currentTime;
		}
		else if (state.toilet_state == 4) {
			state.toilet_m_time = state.toilet_m_time - 1;
			if (state.toilet_m_time <= 0) {
				state.toilet_state = 0;
				state.toilet_next_time = currentTime + 1.0f;
			} else {
				state.toilet_next_time = currentTime + 1.0f;
			}
		}
	}

	// Centralized Brake Sound Event logic
	public void BrakeSoundEvent(Vehicle veh, CNR_State_Base state, float currentTime) {
		if (currentTime < state.next_BrakeSoundEvent_time) return;
		state.next_BrakeSoundEvent_time = currentTime + 0.1f;

		if (state.bc_press > 60 and state.speed != 0) {
			if (state.speed > 30) {
				if (state.bc_press > 300) {
					veh.StopSoundScriptEvent("brake_rub_1"); veh.StopSoundScriptEvent("brake_rub_2"); veh.StopSoundScriptEvent("brake_rub_3");
					veh.StopSoundScriptEvent("brake_40_loop"); veh.StopSoundScriptEvent("brake_20_bc1_loop"); veh.PlaySoundScriptEvent("brake_20_bc4_loop");
					veh.StopSoundScriptEvent("brake_5_loop"); veh.StopSoundScriptEvent("brake_5_loop-2");
				} else {
					veh.StopSoundScriptEvent("brake_rub_1"); veh.StopSoundScriptEvent("brake_rub_2"); veh.StopSoundScriptEvent("brake_rub_3");
					veh.StopSoundScriptEvent("brake_40_loop"); veh.PlaySoundScriptEvent("brake_20_bc1_loop"); veh.StopSoundScriptEvent("brake_20_bc4_loop");
					veh.StopSoundScriptEvent("brake_5_loop"); veh.StopSoundScriptEvent("brake_5_loop-2");
				}
			} else if (state.speed > 10 and state.speed < 30) {
				veh.StopSoundScriptEvent("brake_rub_1"); veh.StopSoundScriptEvent("brake_rub_2"); veh.StopSoundScriptEvent("brake_rub_3");
				veh.PlaySoundScriptEvent("brake_40_loop"); veh.StopSoundScriptEvent("brake_20_bc1_loop"); veh.StopSoundScriptEvent("brake_20_bc4_loop");
				veh.StopSoundScriptEvent("brake_5_loop"); veh.StopSoundScriptEvent("brake_5_loop-2");
			} else if (state.speed < 10) {
				if (state.bc_press > 300) {
					veh.StopSoundScriptEvent("brake_rub_1"); veh.StopSoundScriptEvent("brake_rub_2"); veh.StopSoundScriptEvent("brake_rub_3");
					veh.StopSoundScriptEvent("brake_40_loop"); veh.StopSoundScriptEvent("brake_20_bc1_loop"); veh.StopSoundScriptEvent("brake_20_bc4_loop");
					veh.PlaySoundScriptEvent("brake_5_loop"); veh.StopSoundScriptEvent("brake_5_loop-2");
				} else {
					veh.StopSoundScriptEvent("brake_rub_1"); veh.StopSoundScriptEvent("brake_rub_2"); veh.StopSoundScriptEvent("brake_rub_3");
					veh.StopSoundScriptEvent("brake_40_loop"); veh.StopSoundScriptEvent("brake_20_bc1_loop"); veh.StopSoundScriptEvent("brake_20_bc4_loop");
					veh.StopSoundScriptEvent("brake_5_loop"); veh.PlaySoundScriptEvent("brake_5_loop-2");
				}
			} else {
				veh.StopSoundScriptEvent("brake_rub_1"); veh.StopSoundScriptEvent("brake_rub_2"); veh.PlaySoundScriptEvent("brake_rub_3");
				veh.StopSoundScriptEvent("brake_40_loop"); veh.StopSoundScriptEvent("brake_20_bc1_loop"); veh.StopSoundScriptEvent("brake_20_bc4_loop");
				veh.StopSoundScriptEvent("brake_5_loop"); veh.StopSoundScriptEvent("brake_5_loop-2");
			}
		} else {
			veh.StopSoundScriptEvent("brake_rub_1"); veh.StopSoundScriptEvent("brake_rub_2"); veh.StopSoundScriptEvent("brake_rub_3");
			veh.StopSoundScriptEvent("brake_40_loop"); veh.StopSoundScriptEvent("brake_20_bc1_loop"); veh.StopSoundScriptEvent("brake_20_bc4_loop");
			veh.StopSoundScriptEvent("brake_5_loop"); veh.StopSoundScriptEvent("brake_5_loop-2");
		}
	}

	// Centralized Brake Indicator logic
	public void BrakeIndicatorEvent(Vehicle veh, CNR_State_Base state, float currentTime) {
		if (currentTime < state.next_BrakeIndicatorEvent_time) return;
		state.next_BrakeIndicatorEvent_time = currentTime + 0.05f;

		float brakeFrame1 = veh.GetMeshAnimationFrame("brake_indicator_1");
		float brakeFrame2 = veh.GetMeshAnimationFrame("brake_indicator_2");

		float bcVal = (state.bc_press / 400) * 100;
		if (state.handbrake) bcVal = 100.0f; // Handbrake forces RED indicator (Applied)

		float factorVal = 2.0f; // Smooth transition factor

		veh.SetMeshAnimationFrame("brake_indicator_1", Lerp(brakeFrame1, bcVal, factorVal));
		veh.SetMeshAnimationFrame("brake_indicator_2", Lerp(brakeFrame2, bcVal, factorVal));

		// [Optimization] Poll camera mode every 0.25s instead of 0.05s
		if (currentTime >= state.next_CameraModeCheck_time) {
			state.next_CameraModeCheck_time = currentTime + 0.25f;
			int camMode = World.GetCameraMode();
			int wantGlow = 0; if (camMode != 1) wantGlow = 1;
			
			if (state.last_brake_ind_glow != wantGlow) {
				state.last_brake_ind_glow = wantGlow;
				if (wantGlow == 1) {
					veh.SetTextureSelfIllumination("led_door_gangway_int_front", 0, 80, 0);
					veh.SetTextureSelfIllumination("led_door_gangway_int_end", 0, 80, 0);
					veh.SetTextureSelfIllumination("led_door_gangway", 0, 80, 0);
					veh.SetTextureSelfIllumination("led_door_gangway_front", 0, 80, 0);
					veh.SetTextureSelfIllumination("led_door_gangway_end", 0, 80, 0);
				} else {
					veh.SetTextureSelfIllumination("led_door_gangway_int_front", 0, 0, 0);
					veh.SetTextureSelfIllumination("led_door_gangway_int_end", 0, 0, 0);
					veh.SetTextureSelfIllumination("led_door_gangway", 0, 0, 0);
					veh.SetTextureSelfIllumination("led_door_gangway_front", 0, 0, 0);
					veh.SetTextureSelfIllumination("led_door_gangway_end", 0, 0, 0);
				}
			}
		}
	}

	// Simulated MR Air System with Compressor Sound & Timing
	public void MRAirSystem(Vehicle veh, CNR_State_GenCoach state, float currentTime, float deltaTime) {
		// Compressor starts only after engine startup is fully complete (engine*_ready = true)
		bool hasPower = (state.engine1_ready or state.engine2_ready);
		
		// 1. Governor Logic (Automatic)
		bool wantComp1 = false;
		bool wantComp2 = false;

		if (hasPower) {
			// Governor: Cut-in at 7.0 bar, Cutout at 9.0 bar (CNR Standard)
			if (state.mr_press_internal < 7.0f) {
				state.mr_compressor_running = true;
			} else if (state.mr_press_internal >= 9.0f) {
				state.mr_compressor_running = false;
			}
		} else {
			state.mr_compressor_running = false;
		}

		if (state.mr_compressor_running) {
			if (state.mr_press_internal < 6.0f) {
				// Both compressors for rapid recovery at low pressure
				wantComp1 = true;
				wantComp2 = true;
			} else {
				// Standard cycle (6.0 - 9.0): One compressor is enough
				wantComp1 = true;
				wantComp2 = false;
			}
		}

		// 2. Individual Compressor State Machine (Comp 1)
		if (wantComp1 and state.engine1_ready) {
			if (state.mr_comp1_state == 0) { // Off -> Starting
				state.mr_comp1_state = 1;
				state.mr_comp1_timer = currentTime + 1.45f;
				veh.PlaySoundScriptEvent("comp1-start");
			} else if (state.mr_comp1_state == 1 and currentTime >= state.mr_comp1_timer) {
				state.mr_comp1_state = 2; // Starting -> Running
				veh.StopSoundScriptEvent("comp1-start");
				veh.PlaySoundScriptEvent("comp1-loop");
			} else if (state.mr_comp1_state == 3) { // Interrupt stopping -> Start again
				state.mr_comp1_state = 1;
				state.mr_comp1_timer = currentTime + 1.45f;
				veh.StopSoundScriptEvent("comp1-stop");
				veh.PlaySoundScriptEvent("comp1-start");
			}
		} else {
			if (state.mr_comp1_state == 1 or state.mr_comp1_state == 2) {
				if (state.mr_comp1_state == 2) veh.StopSoundScriptEvent("comp1-loop");
				else veh.StopSoundScriptEvent("comp1-start");
				state.mr_comp1_state = 3; // Running/Starting -> Stopping
				state.mr_comp1_timer = currentTime + 0.69f;
				veh.PlaySoundScriptEvent("comp1-stop");
			} else if (state.mr_comp1_state == 3 and currentTime >= state.mr_comp1_timer) {
				state.mr_comp1_state = 0; // Stopped
				veh.StopSoundScriptEvent("comp1-stop");
			}
		}

		// 2b. Individual Compressor State Machine (Comp 2)
		if (wantComp2 and state.engine2_ready) {
			if (state.mr_comp2_state == 0) {
				state.mr_comp2_state = 1;
				state.mr_comp2_timer = currentTime + 1.45f;
				veh.PlaySoundScriptEvent("comp2-start");
			} else if (state.mr_comp2_state == 1 and currentTime >= state.mr_comp2_timer) {
				state.mr_comp2_state = 2;
				veh.StopSoundScriptEvent("comp2-start");
				veh.PlaySoundScriptEvent("comp2-loop");
			} else if (state.mr_comp2_state == 3) {
				state.mr_comp2_state = 1;
				state.mr_comp2_timer = currentTime + 1.45f;
				veh.StopSoundScriptEvent("comp2-stop");
				veh.PlaySoundScriptEvent("comp2-start");
			}
		} else {
			if (state.mr_comp2_state == 1 or state.mr_comp2_state == 2) {
				if (state.mr_comp2_state == 2) veh.StopSoundScriptEvent("comp2-loop");
				else veh.StopSoundScriptEvent("comp2-start");
				state.mr_comp2_state = 3;
				state.mr_comp2_timer = currentTime + 0.69f;
				veh.PlaySoundScriptEvent("comp2-stop");
			} else if (state.mr_comp2_state == 3 and currentTime >= state.mr_comp2_timer) {
				state.mr_comp2_state = 0;
				veh.StopSoundScriptEvent("comp2-stop");
			}
		}

		// 3. Pressure Calculation (bar) - Improved Charge Rate
		float chargeRate = 0.0f;
		if (state.mr_comp1_state == 2) chargeRate = chargeRate + 0.06f; // Single comp: 0.06 bar/s
		if (state.mr_comp2_state == 2) chargeRate = chargeRate + 0.06f; // Both comp: 0.12 bar/s
		
		// Leakage & Consumption
		// [Optimization] Use cached train size (state.cached_train_size) instead of GetVehicles().size() every tick
		float leakRate = -0.001f - (0.0003f * (float)state.cached_train_size); // Natural Leakage 
		if (state.aircon_state == 1 or state.aircon_state == 2) leakRate = leakRate - 0.0008f; // Additional aircon consumption
		
		state.mr_press_internal = state.mr_press_internal + (chargeRate * deltaTime) + (leakRate * deltaTime);
		if (state.mr_press_internal < 0) state.mr_press_internal = 0;
		if (state.mr_press_internal > 9.5f) state.mr_press_internal = 9.5f; // Safety hard cap (0.5 bar above Governor cutout)

		// CR Tank Equalization (Flow from MR to CR)
		if (state.cr_press_internal < state.mr_press_internal) {
			float flow = (state.mr_press_internal - state.cr_press_internal) * 0.08f;
			state.cr_press_internal = state.cr_press_internal + flow;
			state.mr_press_internal = state.mr_press_internal - flow;
		} else if (state.cr_press_internal > state.mr_press_internal) {
			float flow = (state.cr_press_internal - state.mr_press_internal) * 0.02f;
			state.cr_press_internal = state.cr_press_internal - flow;
			state.mr_press_internal = state.mr_press_internal + flow;
		}
		
		state.script_mr_press = state.mr_press_internal;
		state.script_cr_press = state.cr_press_internal;
	}




	// ------------------------------------------------------------------
	// DISC BRAKE THERMAL MODEL
	// ------------------------------------------------------------------
	public void DiscBrakeThermal(Vehicle veh, CNR_State_Base state, float currentTime, float deltaTime) {
		if (currentTime < state.next_DiscThermal_time) return;
		state.next_DiscThermal_time = currentTime + 0.5f;

		float ambientTemp = 30.0f;
		float bc = state.bc_press;
		if (state.wsp_active) bc = bc * 0.1f; // WSP significantly reduces friction

		// Heat up during braking
		if (bc > 10.0f and state.speed > 1.0f) {
			float heatRate = (bc / 500.0f) * (state.speed / 100.0f) * 2.5f;
			state.disc_temp = state.disc_temp + heatRate;
		} else {
			// Cooling down
			float coolingFactor = 0.02f;
			if (state.speed > 40.0f) coolingFactor = 0.05f; 
			state.disc_temp = Lerp(state.disc_temp, ambientTemp, coolingFactor);
		}

		if (state.disc_temp > 550.0f) state.disc_temp = 550.0f;
		if (state.disc_temp < ambientTemp) state.disc_temp = ambientTemp;
	}

	// Helper to play one-shot brake sounds (Release & Rigging)
	public void PlayBrakeOneShot(Vehicle veh, string type) {
		Soup kuidTable = veh.GetAsset().GetConfigSoup().GetNamedSoup("kuid-table");
		if (!kuidTable) return;
		KUID soundKuid = kuidTable.GetNamedTagAsKUID("sounds-asset");
		Asset soundAsset = World.FindAsset(soundKuid);
		if (!soundAsset) return;

		string file = "";
		float vol = 1.0f;
		if (type == "release") {
			int r = Math.Rand(1, 3);
			file = "sounds/external/brake/suspension/brake_release" + (string)r + ".wav";
			vol = 1.0f;
		} else if (type == "rigging") {
			int r = Math.Rand(1, 5);
			file = "sounds/external/brake/suspension/brake_rigging" + (string)r + ".wav";
			vol = 0.4f; // Pneumatic disc rigging is quieter
		}

		if (file != "") {
			World.PlaySound(soundAsset, file, vol, 10.0f, 100.0f, veh, "a.bog0");
			World.PlaySound(soundAsset, file, vol, 10.0f, 100.0f, veh, "a.bog1");
		}
	}

	// Brake Pipe Monitor (Distributor Valve simulation)
	public void BrakePipeMonitor(Vehicle veh, CNR_State_Base state, float currentTime) {
		if (currentTime < state.next_BrakePipeMonitor_time) return;
		state.next_BrakePipeMonitor_time = currentTime + 0.2f;

		// bp_press is in Pa, 1 bar = 100,000 Pa approx
		float bp_bar = state.bp_press / 100.0f;

		int newState = 0;
		if (bp_bar > 4.8f) newState = 0;      // Release
		else if (bp_bar > 4.5f) newState = 1; // Initial Service
		else if (bp_bar > 3.6f) newState = 2; // Service
		else if (bp_bar > 3.4f) newState = 3; // Full Service
		else newState = 4;                   // Emergency (< 3.5 bar)

		// --- Transition Detection for Sounds ---
		// Transition from Active Brake (Lap/Service/Emer) -> Release
		if (state.last_brake_pipe_state != 0 and newState == 0) {
			if (state.speed > 0.0f) {
				PlayBrakeOneShot(veh, "release");
				PlayBrakeOneShot(veh, "rigging");
			}
		}

		state.brake_pipe_state = newState;
		state.last_brake_pipe_state = newState;
	}

	// Centralized Current Load logic
	public void UpdateCurrentLoad(Vehicle veh, CNR_State_Base state) {
		// --- Load Design Targets (per 450 kW engine = 1 unit) ---
		// 13 coaches (1 APVC + 12 pax): idle = ~65% (294 kW), all-aircon = ~74% (333 kW)
		//
		// APVC (generator car): 30 kW base — extra from compressors, battery charger, CCTV, control systems
		// Passenger coach    : 22 kW base — lighting, HVAC fan, PIS screen, safety systems, outlets
		// Air conditioning   : +3 kW per coach when running (one rooftop inverter unit ~3.5 kW avg COP≈3)
		// Toilet flush pump  : +2 kW per coach when flushing cycle active
		// Passport door move : +5 kW per side while door actuator is mid-stroke (transient only)
		// Gangway door move  : +1 kW per door mid-stroke (transient)
		//
		// Validation:
		//   Idle  : 30 + 12×22           = 294 kW / 450 = 65.3% ✓
		//   Aircon: (30+3) + 12×(22+3)   = 333 kW / 450 = 74.0% ✓ (<75%)

		bool isAPVC = state.isAPVC; // Set at Init() from asset name — more reliable than name string match
		float load = 21.0f;
		if (isAPVC) load = 30.0f;

		// Air conditioning: +4 kW (≈19% of 21 kW idle baseline)
		// All-aircon: 34 + 12×25 = 334 kW / 450 = 74.2% (<75%) ✓
		// Idle only:  30 + 12×21 = 282 kW / 450 = 62.7% ✓
		if (state.aircon_state == 1 or state.aircon_state == 2) load = load + 4.0f;

		// Toilet flushing pump (running state = 1: starting, 2: flushing)
		if (state.toilet_state == 1 or state.toilet_state == 2) load = load + 2.0f;

		// Passenger door actuator (transient load while door is mid-stroke, not fully open/closed)
		string doorLeftMesh = "left-passenger-cnr";
		string doorRightMesh = "right-passenger-cnr";
		if (isAPVC) {
			doorLeftMesh = "left-passenger-door";
			doorRightMesh = "right-passenger-door";
		}

		float doorLeftAnim = veh.GetMeshAnimationFrame(doorLeftMesh);
		if (doorLeftAnim > 0.01f and doorLeftAnim < 0.99f) load = load + 5.0f;
		float doorRightAnim = veh.GetMeshAnimationFrame(doorRightMesh);
		if (doorRightAnim > 0.01f and doorRightAnim < 0.99f) load = load + 5.0f;

		// Gangway door actuators (transient)
		if (veh.GetMeshAnimationFrame("door_gangway_front") > 0.01f and veh.GetMeshAnimationFrame("door_gangway_front") < 0.99f) load = load + 1.0f;
		if (veh.GetMeshAnimationFrame("door_gangway_end") > 0.01f and veh.GetMeshAnimationFrame("door_gangway_end") < 0.99f) load = load + 1.0f;
		if (veh.GetMeshAnimationFrame("door_gangway_int_front") > 0.01f and veh.GetMeshAnimationFrame("door_gangway_int_front") < 0.99f) load = load + 1.0f;
		if (veh.GetMeshAnimationFrame("door_gangway_int_end") > 0.01f and veh.GetMeshAnimationFrame("door_gangway_int_end") < 0.99f) load = load + 1.0f;

		// ANF sleeping car: individual room doors & kitchen (non-APVC only)
		if (!isAPVC) {
			if (veh.GetMeshAnimationFrame("door_kitchen") > 0.01f and veh.GetMeshAnimationFrame("door_kitchen") < 0.99f) load = load + 1.0f;
			int i;
			for (i = 1; i <= 12; i++) {
				string meshName = "door_int_room_anf" + (string)i;
				float anim = veh.GetMeshAnimationFrame(meshName);
				if (anim > 0.01f and anim < 0.99f) load = load + 0.5f;
			}
		}

		state.current_load = load;
	}

	// Centralized Door Interlock logic
	public void DoorInterlockEvent(Vehicle veh, CNR_State_Base state, float currentTime) {
		if (currentTime < state.next_DoorInterlockEvent_time) return;
		state.next_DoorInterlockEvent_time = currentTime + 0.1f;

		bool engineStats = state.m_EngineStats or state.m_EngineCheck;

		if (engineStats and state.speed > state.door_interlock_speed and state.m_DoorInterlock and !state.door_interlock_bypass) {
			if (state.isclass(CNR_State_PassCoach)) {
				if (veh.GetMeshAnimationFrame("dummy-door-left") > 0) {
					veh.SetMeshAnimationState("dummy-door-left", false);
					// state is passed by reference — set directly, no SetProperties/PostMessage needed
					state.door_sound_left_req = 2;
				}
				if (veh.GetMeshAnimationFrame("dummy-door-right") > 0) {
					veh.SetMeshAnimationState("dummy-door-right", false);
					state.door_sound_right_req = 2;
				}
			} else if (state.isclass(CNR_State_GenCoach)) {
				// For GenCoach, we should trigger a master close to ensure whole train is synced
				if (state.isDoorLeft or state.isDoorRight) {
					// Use specific 'off' toggle to ensure doors close and UI state resets to false
					if (state.isDoorLeft) veh.PostMessage(veh, "Interface-Property-Change", "ctrl_door_left_off", 0.1f);
					if (state.isDoorRight) veh.PostMessage(veh, "Interface-Property-Change", "ctrl_door_right_off", 0.1f);
				}
			}
		}
	}

	// Centralized Door Handler logic (Mainly for GenCoach)
	public void DoorHandlerEvent(Vehicle veh, CNR_State_Base state, float currentTime) {
		if (currentTime < state.next_DoorHandlerEvent_time) return;
		state.next_DoorHandlerEvent_time = currentTime + 0.1f;

		// Track GEN coach local door mesh states for UI alignment
		bool meshL = (veh.GetMeshAnimationFrame("left-passenger-door") != 0);
		if (meshL != state.isDoorLeft) {
			state.isDoorLeft = meshL;
			// Note: We no longer broadcast ToggleCoachAnimation here to avoid breaking selective selection.
		}

		bool meshR = (veh.GetMeshAnimationFrame("right-passenger-door") != 0);
		if (meshR != state.isDoorRight) {
			state.isDoorRight = meshR;
		}

		// Sync interlock dummy
		veh.SetMeshAnimationState("dummy-doorinterlock", state.m_DoorInterlock);
	}

	// Centralized Signal Light logic (Only for APVC/ANF coaches)
	// signal_lamp_mode: 0=Auto (18:00-06:00 if last car), 1=On (always), 2=Off (always)
	public void onSignalLightChange(Vehicle veh, CNR_State_Base state, float currentTime, Asset textureAsset) {
		if (currentTime < state.next_onSignalLightChange_time) return;
		state.next_onSignalLightChange_time = currentTime + 1.0f;

		if (!state.isAPVC and !state.isANF) return;

		// --- Determine if the lamp should physically be ON ---
		bool lampOn = false;
		if (state.signal_lamp_mode == 1) {
			// Mode 1: Always On
			lampOn = true;
		} else if (state.signal_lamp_mode == 2) {
			// Mode 2: Always Off
			lampOn = false;
		} else {
			// Mode 0: Auto — on between 18:00 and 06:00, and only if this car is the last in the consist
			float gameTime = World.GetGameTime() + 0.5f;
			if (gameTime >= 1.0f) gameTime = gameTime - 1.0f;
			int totalSec = (int)(gameTime * 86400.0f);
			int hours = (totalSec / 3600) % 24;
			// Night window: 18:00 (>=18) OR 00:00-05:59 (<6)
			bool isNight = (hours >= 18 or hours < 6);
			// Check last car
			bool isLastCar = false;
			Train myTrain = veh.GetMyTrain();
			if (myTrain) {
				Vehicle[] vehicles = myTrain.GetVehicles();
				if (vehicles.size() > 0) {
					isLastCar = (vehicles[vehicles.size() - 1] == veh);
				}
			}
			lampOn = (isNight and isLastCar);
		}

		int phys = 0; if (lampOn) phys = 1;
		int dir = 0; if (veh.GetDirectionRelativeToTrain()) dir = 1;

		if (state.last_signal_lamp_phys == phys and state.last_signal_lamp_dir == dir) return;
		state.last_signal_lamp_phys = phys;
		state.last_signal_lamp_dir = dir;

		if (phys == 0) {
			veh.SetTextureSelfIllumination("red", 0, 0, 0);
			veh.SetTextureSelfIllumination("red_sidebody", 0, 0, 0);
			veh.SetFXTextureReplacement("red_sidebody", textureAsset, dir);
		} else {
			veh.SetTextureSelfIllumination("red", 400, 50, 50);
			veh.SetTextureSelfIllumination("red_sidebody", 50, 50, 50);
			veh.SetFXTextureReplacement("red_sidebody", textureAsset, dir);
		}
	}
	// Helper to process individual bell logic
	void ProcessBell(Vehicle veh, string name, int bell_id, CNR_State_Base state, float currentTime) {
		int req = 0;
		int inner_state = 0;
		float timer = 0;

		if (bell_id == 1) { req = state.bell1_req; inner_state = state.bell1_inner_state; timer = state.bell1_timer; }
		else { req = state.bell2_req; inner_state = state.bell2_inner_state; timer = state.bell2_timer; }

		if (req == 1) {
			if (inner_state == 0) { // Off -> Starting
				veh.PlaySoundScriptEvent(name + "-start");
				timer = currentTime + 0.115f;
				inner_state = 1;
			} else if (inner_state == 1 and currentTime >= timer) { // Starting -> Looping
				veh.StopSoundScriptEvent(name + "-start"); // Safety
				veh.PlaySoundScriptEvent(name + "-loop");
				inner_state = 2;
			} else if (inner_state == 3) { // Was Stopping -> Restart Start
				veh.StopSoundScriptEvent(name + "-stop");
				veh.PlaySoundScriptEvent(name + "-start");
				timer = currentTime + 0.115f;
				inner_state = 1;
			}
		} else { // Off Request
			if (inner_state == 2) { // Looping -> Stopping
				veh.StopSoundScriptEvent(name + "-loop");
				veh.PlaySoundScriptEvent(name + "-stop");
				timer = currentTime + 0.40f;
				inner_state = 3;
			} else if (inner_state == 1) { // Starting -> Stopping (Interrupt)
				veh.StopSoundScriptEvent(name + "-start");
				veh.PlaySoundScriptEvent(name + "-stop");
				timer = currentTime + 0.40f;
				inner_state = 3;
			} else if (inner_state == 3 and currentTime >= timer) { // Stopping -> Off
				veh.StopSoundScriptEvent(name + "-stop");
				inner_state = 0;
			}
		}

		if (bell_id == 1) { state.bell1_inner_state = inner_state; state.bell1_timer = timer; }
		else { state.bell2_inner_state = inner_state; state.bell2_timer = timer; }
	}

	// Centralized Bell Sound System logic
	public void BellEventHandler(Vehicle veh, CNR_State_Base state, float currentTime) {
		ProcessBell(veh, "cnr1-bell", 1, state, currentTime);
		ProcessBell(veh, "cnr2-bell", 2, state, currentTime);
	}

	// ------------------------------------------------------------------
	// PlayAnnouncementToTrain — One-shot announcement sound broadcast
	// Plays ann_<id>_<lang>.wav on a.bog0 and a.bog1 of every eligible
	// coach in the train.
	//
	// Eligible families: ANS, ANSH, ARC, APVC, ANF
	// Excluded: Locomotive (has "Locomotive" or "Engine" in name) and
	//           APVC power cars (checked via state.isAPVC && no passenger).
	//
	// soundsKUID: the kuid-table key "sounds-asset" from the calling vehicle.
	//             All CNR coaches share the same sound asset, so we can get
	//             it from the GenCoach and use it for the whole train.
	// annId: 1-12 (announcement index)
	// lang:  0=EN 1=TH 2=JP 3=ZH
	// ------------------------------------------------------------------
	public void PlayAnnouncementToTrain(Vehicle owner, int annId, int lang) {
		// Build sound file path
		string idStr = (string)annId;
		if (annId < 10) idStr = "0" + idStr;
		string langStr = "en";
		if (lang == 1) langStr = "th";
		else if (lang == 2) langStr = "jp";
		else if (lang == 3) langStr = "zh";
		string soundFile = "sounds/announcement/ann_" + idStr + "_" + langStr + ".wav";

		// Get sound asset from the calling vehicle's kuid-table
		Soup kuidTable = owner.GetAsset().GetConfigSoup().GetNamedSoup("kuid-table");
		if (!kuidTable) return;
		KUID soundKuid = kuidTable.GetNamedTagAsKUID("sounds-asset");
		Asset soundAsset = World.FindAsset(soundKuid);
		if (!soundAsset) return;

		Train myTrain = owner.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			Vehicle veh = vehicles[i];
			string vName = veh.GetLocalisedName();

			// Exclude locomotives: Trainz locomotives usually have "Locomotive",
			// "Engine", "Loco", or "Power Car" in their name.
			bool isLoco = false;
			if (Str.Find(vName, "Locomotive", 0) != -1) isLoco = true;
			if (Str.Find(vName, "Engine", 0)     != -1) isLoco = true;
			if (Str.Find(vName, "Loco",   0)     != -1) isLoco = true;
			if (Str.Find(vName, "Power",  0)     != -1) isLoco = true;
			if (isLoco) continue;

			// Include only CNR family coaches
			bool isEligible = false;
			if (Str.Find(vName, "ANS",  0) != -1) isEligible = true;
			if (Str.Find(vName, "ANSH", 0) != -1) isEligible = true;
			if (Str.Find(vName, "ARC",  0) != -1) isEligible = true;
			if (Str.Find(vName, "APVC", 0) != -1) isEligible = true;
			if (Str.Find(vName, "ANF",  0) != -1) isEligible = true;
			if (!isEligible) continue;

			// Play on both bogies (spatial audio)
			World.PlaySound(soundAsset, soundFile, 1.0f, 5.0f, 80.0f, veh, "a.bog0");
			World.PlaySound(soundAsset, soundFile, 1.0f, 5.0f, 80.0f, veh, "a.bog1");
		}
	}

	// Truncates text to 11 base characters (not counting Thai accents/above-vowels)
	public string TruncateTo11(CNR_State_Base state, string text) {
		if (text == "") return "";
		string[] utf8Chars = state.GetUTF8Chars(text);
		int baseCount = 0;
		string output = "";
		int i;
		for (i = 0; i < utf8Chars.size(); i++) {
			string ch = utf8Chars[i];
			if (!state.IsThaiNonSpacing(ch)) {
				if (baseCount >= 24) break;
				baseCount++;
			}
			output = output + ch;
		}
		return output;
	}

	// ------------------------------------------------------------------
	// LCD MANUAL CONFIG RENDERING (BETA)
	// ------------------------------------------------------------------
	
	public int GetFontIndex(string ch) {
		if (ch == "-") return 0;
		if (ch == ".") return 1;
		if (ch == "/") return 2;
		if (ch == "0") return 3;
		if (ch == "1") return 4;
		if (ch == "2") return 5;
		if (ch == "3") return 6;
		if (ch == "4") return 7;
		if (ch == "5") return 8;
		if (ch == "6") return 9;
		if (ch == "7") return 10;
		if (ch == "8") return 11;
		if (ch == "9") return 12;
		if (ch == ":") return 13;
		if (ch == "A") return 14; if (ch == "B") return 15; if (ch == "C") return 16; if (ch == "D") return 17;
		if (ch == "E") return 18; if (ch == "F") return 19; if (ch == "G") return 20; if (ch == "H") return 21;
		if (ch == "I") return 22; if (ch == "J") return 23; if (ch == "K") return 24; if (ch == "L") return 25;
		if (ch == "M") return 26; if (ch == "N") return 27; if (ch == "O") return 28; if (ch == "P") return 29;
		if (ch == "Q") return 30; if (ch == "R") return 31; if (ch == "S") return 32; if (ch == "T") return 33;
		if (ch == "U") return 34; if (ch == "V") return 35; if (ch == "W") return 36; if (ch == "X") return 37;
		if (ch == "Y") return 38; if (ch == "Z") return 39;
		if (ch == "a") return 40; if (ch == "b") return 41; if (ch == "c") return 42; if (ch == "d") return 43;
		if (ch == "e") return 44; if (ch == "f") return 45; if (ch == "g") return 46; if (ch == "h") return 47;
		if (ch == "i") return 48; if (ch == "j") return 49; if (ch == "k") return 50; if (ch == "l") return 51;
		if (ch == "m") return 52; if (ch == "n") return 53; if (ch == "o") return 54; if (ch == "p") return 55;
		if (ch == "q") return 56; if (ch == "r") return 57; if (ch == "s") return 58; if (ch == "t") return 59;
		if (ch == "u") return 60; if (ch == "v") return 61; if (ch == "w") return 62; if (ch == "x") return 63;
		if (ch == "y") return 64; if (ch == "z") return 65;
		if (ch == "ก") return 66; if (ch == "ข") return 67; if (ch == "ฃ") return 68; if (ch == "ค") return 69; if (ch == "ฅ") return 70; if (ch == "ฆ") return 71;
		if (ch == "ง") return 72; if (ch == "จ") return 73; if (ch == "ฉ") return 74; if (ch == "ช") return 75; if (ch == "ซ") return 76; if (ch == "ฌ") return 77;
		if (ch == "ญ") return 78; if (ch == "ฎ") return 79; if (ch == "ฏ") return 80; if (ch == "ฐ") return 81; if (ch == "ฑ") return 82; if (ch == "ฒ") return 83;
		if (ch == "ณ") return 84; if (ch == "ด") return 85; if (ch == "ต") return 86; if (ch == "ถ") return 87; if (ch == "ท") return 88; if (ch == "ธ") return 89;
		if (ch == "น") return 90; if (ch == "บ") return 91; if (ch == "ป") return 92; if (ch == "ผ") return 93; if (ch == "ฝ") return 94; if (ch == "พ") return 95;
		if (ch == "ฟ") return 96; if (ch == "ภ") return 97; if (ch == "ม") return 98; if (ch == "ย") return 99; if (ch == "ร") return 100; if (ch == "ฤ") return 101;
		if (ch == "ล") return 102; if (ch == "ว") return 103; if (ch == "ศ") return 104; if (ch == "ษ") return 105; if (ch == "ส") return 106; if (ch == "ห") return 107;
		if (ch == "ฬ") return 108; if (ch == "อ") return 109; if (ch == "ฮ") return 110;
		if (ch == "ะ") return 111; if (ch == "ั") return 112; if (ch == "า") return 113; if (ch == "ำ") return 137; if (ch == "ิ") return 115; if (ch == "ี") return 116;
		if (ch == "ึ") return 117; if (ch == "ื") return 118; if (ch == "ุ") return 119; if (ch == "ู") return 120; if (ch == "เ") return 121; if (ch == "แ") return 122;
		if (ch == "โ") return 123; if (ch == "ใ") return 124; if (ch == "ไ") return 125; if (ch == "ๅ") return 126; if (ch == "ๆ") return 127; if (ch == "่") return 128;
		if (ch == "้") return 129; if (ch == "๊") return 130; if (ch == "๋") return 131; if (ch == "์") return 132;
		if (ch == "็") return 134; if (ch == "ํ") return 135; if (ch == "๎") return 136;
		if (ch == " ") return 133;
		return 133;
	}

	public bool IsThaiTone(string ch) {
		if (ch == "่" or ch == "้" or ch == "๊" or ch == "๋" or ch == "์") return true;
		return false;
	}

	public string ProcessLCDVars(string input, Vehicle v, CNR_State_Base state, int row) {
		if (input == "") {
			state.lcd_processed_vars[row] = "";
			return "";
		}
		
		// Phase 2: If car is forced to 000 (skipped), hide Origin/Dest info (rows 2-8)
		if (state.lcd_force_zero and row > 1) {
			state.lcd_processed_vars[row] = "";
			return "";
		}

		// If input hasn't changed since last process, return cached result
		if (state.lcd_processed_vars[row] != "" and !state.lcd_manual_dirty) {
			// [Optimization] We only re-process if it contains variables that might change (like [no])
			if (Str.Find(input, "[", 0) == -1) return input;
		}

		string output = input;
		Train t = v.GetMyTrain();
		if (t) {
			Vehicle[] vehs = t.GetVehicles();
			int totalCoaches = 0;
			int myCoachIdx = -1;
			int[] apvcCoaches = new int[vehs.size()];
			int apvcCount = 0;
			int i;

			// Pass 1: Identify coaches and APVC positions
			for (i = 0; i < vehs.size(); i++) {
				if (IsCoachByLocalName(vehs[i])) {
					if (vehs[i] == v) myCoachIdx = totalCoaches;
					
					// Identify APVC
					string vName = vehs[i].GetAsset().GetLocalisedName();
					if (Str.Find(vName, "APVC", 0) != -1) {
						apvcCoaches[apvcCount] = totalCoaches;
						apvcCount++;
					}
					totalCoaches++;
				}
			}

			if (myCoachIdx != -1) {
				int carIdx;
				int startCoachIdx = 0;

				// Decision Logic for Start Point
				// Priority:
				// 1. If mode is FRONT (0) or REAR (1), obey the absolute end
				// 2. If mode is AUTO (2), use APVC as car 1
				// 3. If multiple APVCs, use FRONT/REAR to pick which APVC is 1
				
				if (state.car_num_mode == 0) {
					// MANUAL FRONT: Always start 1 at first coach
					startCoachIdx = 0;
				} else if (state.car_num_mode == 1) {
					// MANUAL REAR: Always start 1 at last coach
					startCoachIdx = totalCoaches - 1;
				} else {
					// AUTO MODE: Use APVC priority
					if (apvcCount >= 1) {
						// There's at least one APVC. 
						// (If 2+ APVCs, we use the first one in Auto mode)
						startCoachIdx = apvcCoaches[0];
					} else {
						// No APVC: Fallback to front
						startCoachIdx = 0;
					}
				}

				// Sequential count from the chosen start point
				carIdx = Math.Abs(myCoachIdx - startCoachIdx) + 1;

				// Apply user-defined offset
				carIdx = carIdx + state.car_number_offset;
				
				string carNoStr = (string)carIdx;
				
				// ARC or Force Zero Exception: Force 000
				if (state.isARC or state.lcd_force_zero) {
					carNoStr = "000";
				} else {
					// Pad to 3 digits (e.g. 001, 010)
					if (carIdx < 10) carNoStr = "00" + (string)carIdx;
					else if (carIdx < 100) carNoStr = "0" + (string)carIdx;
				}

				// Replace placeholders manually (one by one)
				string[] tags = new string[4];
				tags[0] = "[no]"; tags[1] = "[NO]"; tags[2] = "[CAR_NO]"; tags[3] = "[car_no]";
				
				int tIdx;
				for (tIdx = 0; tIdx < 4; tIdx++) {
					int found = Str.Find(output, tags[tIdx], 0);
					if (found != -1) {
						output = output[0, found] + carNoStr + output[found + tags[tIdx].size(), output.size()];
					}
				}
			}
		}
		state.lcd_processed_vars[row] = output;
		return output;
	}

	// ------------------------------------------------------------------
	// UpdateLCDTextureState — Centralized LCD text rendering
	// Replaces textures on slot_XX_YY_con/tone/vow effects based on
	// manual input or page configurations.
	// ------------------------------------------------------------------
	public void UpdateLCDTextureState(Vehicle veh, CNR_State_Base state, bool force) {
		if (!state) return;
		Asset fontLib = veh.GetAsset().FindAsset("font_lib");
		if (!fontLib) {
			return;
		}

		float br = 0.0f;
		if (state.lcd_power) br = state.lcd_brightness;
		
		// If forced or brightness changed, invalidate the entire line cache
		if (force or state.lcd_brightness != state.lcd_last_brightness) {
			int r;
			for (r = 0; r < 9; r++) {
				state.lcd_rendered_lines[r] = "@FORCE_REDRAW@";
				state.lcd_processed_vars[r] = ""; // Invalidate variable cache too
			}
			state.lcd_last_brightness = state.lcd_brightness;
		}

		int startRow = 0;
		int endRow = 9;

		// [Staggered Update Support]
		// If pending_row is set, we only update ONE row to save CPU.
		if (state.lcd_pending_row >= 0 and !force) {
			startRow = state.lcd_pending_row;
			if (startRow > 8) startRow = 8;
			endRow = startRow + 1;
		}

		int row;
		for (row = startRow; row < endRow; row++) {
			string text = ProcessLCDVars(state.lcd_config_lines[row], veh, state, row);
			
			// Skip if text matches what's already on the mesh (unless forced)
			if (!force and text == state.lcd_rendered_lines[row] and state.lcd_brightness == state.lcd_last_brightness) continue;
			
			state.lcd_rendered_lines[row] = text; // Update the local car buffer
			
			int col = 0;
			int i;
			string rowStr = (string)row; if (row < 10) rowStr = "0" + rowStr;

			string[] utf8Chars = state.GetUTF8Chars(text);
			int charIdx = 0;

			// We iterate through all 11 slots to ensure any leftovers from previous text are cleared
			for (col = 0; col < 11; col++) {
				string colStr = (string)col; if (col < 10) colStr = "0" + colStr;
				string suffix = colStr + "_" + rowStr;

				int conIdx = 133; int toneIdx = 133; int vowIdx = 133;
				float conBr = 0.0f; float toneBr = 0.0f; float vowBr = 0.0f;

				if (charIdx < utf8Chars.size() and state.lcd_power) {
					string ch = utf8Chars[charIdx];
					conIdx = GetFontIndex(ch);
					conBr = br;
					charIdx++;

					// Check for Thai non-spacing characters (Tone/Vowel) that belong to THIS base character
					// Note: Multiple non-spacing chars can pile on one base char (e.g. vowel + tone)
					while (charIdx < utf8Chars.size() and state.IsThaiNonSpacing(utf8Chars[charIdx])) {
						string nextCh = utf8Chars[charIdx];
						int subIdx = GetFontIndex(nextCh);
						if (IsThaiTone(nextCh)) {
							toneIdx = subIdx; toneBr = br;
						} else {
							vowIdx = subIdx; vowBr = br;
						}
						charIdx++;
					}
				}

				// Apply with Cache Check
				if (!state.lcd_slot_cache) state.lcd_slot_cache = Constructors.NewSoup();
				string cacheKey = suffix;
				string currentCache = state.lcd_slot_cache.GetNamedTag(cacheKey);
				string newCache = (string)conIdx + "," + (string)conBr + "," + (string)toneIdx + "," + (string)toneBr + "," + (string)vowIdx + "," + (string)vowBr;

				if (force or currentCache != newCache) {
					state.lcd_slot_cache.SetNamedTag(cacheKey, newCache);


					veh.SetFXTextureReplacement("slot_" + suffix + "_con_l",  fontLib, conIdx);
					veh.SetFXTextureReplacement("slot_" + suffix + "_con_r",  fontLib, conIdx);
					veh.SetTextureSelfIllumination("slot_" + suffix + "_con", conBr, conBr, conBr);

					veh.SetFXTextureReplacement("slot_" + suffix + "_tone_l", fontLib, toneIdx);
					veh.SetFXTextureReplacement("slot_" + suffix + "_tone_r", fontLib, toneIdx);
					veh.SetTextureSelfIllumination("slot_" + suffix + "_tone", toneBr, toneBr, toneBr);

					veh.SetFXTextureReplacement("slot_" + suffix + "_vow_l",  fontLib, vowIdx);
					veh.SetFXTextureReplacement("slot_" + suffix + "_vow_r",  fontLib, vowIdx);
					veh.SetTextureSelfIllumination("slot_" + suffix + "_vow", vowBr, vowBr, vowBr);
				}
			}
		}
		state.lcd_last_brightness = state.lcd_brightness;
	}


	public void BroadcastLCDConfig(Vehicle owner, CNR_State_Base state, Soup selection) {
		state.lcd_manual_dirty = true;
		Train myTrain = owner.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();

		// Pack all LCD data into compact strings.
		// Format per page: "line0;line1;...;line8"  (empty line encoded as "-")
		// Enables: "1;0;1;0;1"  (5 bools)
		// This reduces 45 individual tag SetProperties to 6 tags — ~87% fewer tag ops.
		// Separator ";" is safe: Thai station names never contain semicolons.
		string enables = "";
		int p;
		string[] packedPages = new string[5];
		for (p = 0; p < 5; p++) {
			if (p > 0) enables = enables + ";";
			if (state.lcd_page_enabled[p]) enables = enables + "1";
			else enables = enables + "0";

			string packed = "";
			Soup pageSoup = null;
			if (state.lcd_config_pages) pageSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)p);
			int ln;
			for (ln = 0; ln < 9; ln++) {
				if (ln > 0) packed = packed + ";";
				string txt = "";
				if (pageSoup) txt = pageSoup.GetNamedTag("line_" + (string)ln);
				if (txt == "") txt = "-";
				packed = packed + txt;
			}
			packedPages[p] = packed;
		}

		int i;
		for (i = 0; i < vehicles.size(); i++) {
			if (selection.GetNamedTagAsInt((string)i, 0) != 1) continue;
			Vehicle v = vehicles[i];

			// Use NEW soup — never read the coach's full soup (that forces it to serialize 45 LCD tags)
			Soup s = Constructors.NewSoup();
			s.SetNamedTag("lcd_packed_v2",    1);
			s.SetNamedTag("lcd_enables",      enables);
			for (p = 0; p < 5; p++)
				s.SetNamedTag("lcd_p" + (string)p, packedPages[p]);

			// Metadata / route
			s.SetNamedTag("lcd_brightness",      state.lcd_brightness);
			s.SetNamedTag("lcd_power",           state.lcd_power);
			s.SetNamedTag("lcd_swap_period",     state.lcd_swap_period);
			s.SetNamedTag("lcd_active_page_idx", state.lcd_active_page_idx);
			s.SetNamedTag("lcd_origin",          state.lcd_origin);
			s.SetNamedTag("lcd_dest",            state.lcd_dest);
			s.SetNamedTag("lcd_train_idx",       state.lcd_train_idx);
			s.SetNamedTag("car_number_offset",   state.car_number_offset);
			s.SetNamedTag("car_num_mode",        state.car_num_mode);

			v.SetProperties(s);
			v.PostMessage(v, "Interface-Property-Change", "car_num_mode", 0.0f);
		}
	}

	public void BroadcastCarNumbering(Vehicle owner, Soup selection) {
		Train myTrain = owner.GetMyTrain();
		if (!myTrain) return;
		Vehicle[] vehicles = myTrain.GetVehicles();
		int i;
		for (i = 0; i < vehicles.size(); i++) {
			Vehicle v = vehicles[i];
			Soup s = v.GetProperties();
			if (s) {
				bool forceZero = (selection.GetNamedTagAsInt((string)i, 0) == 1);
				s.SetNamedTag("lcd_force_zero", (int)forceZero);
				v.SetProperties(s);
				// Notification for the vehicle's script to update state
				v.PostMessage(v, "Interface-Property-Change", "lcd_force_zero", 0.0f);
			}
		}
	}


	public void LCDUpdateLoop(Vehicle v, CNR_State_Base state, float currentTime) {
		// Initialization Check: Jitter the timer to prevent all cars swapping synchronized
		if (state.lcd_swap_timer_start == 0.0f) {
			state.lcd_swap_timer_start = currentTime + Math.Rand(0.0f, state.lcd_swap_period);
		}

		if (state.lcd_manual_dirty) {
			UpdateLCDTextureState(v, state, true);
			state.lcd_manual_dirty = false;
			return;
		}
		// Calculate how many pages are enabled to determine auto swap
		int enabledCount = 0;
		int firstEnabled = -1;
		int p;
		for (p = 0; p < 5; p++) {
			if (state.lcd_page_enabled[p]) {
				enabledCount++;
				if (firstEnabled == -1) firstEnabled = p;
			}
		}

		state.lcd_swap_enabled = (enabledCount > 1);

		if (!state.lcd_power or enabledCount == 0) {
			// Do nothing or clear? If no pages enabled, the screen will just display empty, or we stop updates.
			if (enabledCount == 0) {
				int k; for (k = 0; k < 9; k++) { 
					if (state.lcd_config_lines[k] != "") {
						state.lcd_config_lines[k] = "";
						// Only redraw if actually changed to avoid loop
						state.lcd_manual_dirty = true;
					}
				}
			}
			state.lcd_swap_timer_start = currentTime;
			return;
		}
		
		if (!state.lcd_swap_enabled) {
			// Single page mode -> Lock to firstEnabled
			if (state.lcd_active_page_idx != firstEnabled) {
				state.lcd_active_page_idx = firstEnabled;
				state.lcd_pending_row = 0; // Trigger staggered update
				// Invalidate variable cache for the new page
				int i; for (i = 0; i < 9; i++) state.lcd_processed_vars[i] = "";
			}
			
			Soup activeSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_active_page_idx);
			int i;
			for (i = 0; i < 9; i++) {
				string l = "";
				if (activeSoup) l = activeSoup.GetNamedTag("line_" + (string)i);
				state.lcd_config_lines[i] = l;
			}
			state.lcd_swap_timer_start = currentTime;
			return;
		}

		if (currentTime - state.lcd_swap_timer_start >= state.lcd_swap_period) {
			state.lcd_swap_timer_start = currentTime;
			
			// Find next enabled page
			int nextIdx = state.lcd_active_page_idx + 1;
			while (true) {
				if (nextIdx > 4) nextIdx = 0;
				if (state.lcd_page_enabled[nextIdx]) break;
				nextIdx++;
			}
			state.lcd_active_page_idx = nextIdx;
			
			// Invalidate variable cache for the new page
			int k; for (k = 0; k < 9; k++) state.lcd_processed_vars[k] = "";

			Soup activeSoup = state.lcd_config_pages.GetNamedSoup("page_" + (string)state.lcd_active_page_idx);
			// Update current lines
			int i;
			for (i = 0; i < 9; i++) {
				if (activeSoup) state.lcd_config_lines[i] = activeSoup.GetNamedTag("line_" + (string)i);
				else state.lcd_config_lines[i] = "";
			}
			// Trigger staggered redraw locally (MainLoop will handle incrementing rows)
			state.lcd_pending_row = 0;
		}
	}

	// ===========================================================================
	// Smart Mesh-LOD System
	// Hides interior meshes when camera > 700m, reveals < 500m (hysteresis)
	// First placement: 1s delay, then staggered reveal 150ms per mesh
	// ===========================================================================

	// Returns an array of interior mesh names for this vehicle type
	string[] GetLODMeshList(CNR_State_Base state) {
		string[] meshes;

		if (state.isANF) {
			// ANF: Sleeper car — full interior + 12 room doors + electrical
			meshes = new string[0];
			meshes[meshes.size()] = "interior";
			meshes[meshes.size()] = "electrical_cabinet_anf";
			meshes[meshes.size()] = "door_electrical_cabinet_anf2";
			meshes[meshes.size()] = "door_gangway_int_end";
			meshes[meshes.size()] = "door_gangway_int_front";
			int i;
			for (i = 1; i <= 12; i++)
				meshes[meshes.size()] = "door_int_room_anf" + (string)i;
		} else if (state.isARC) {
			// ARC: Restaurant / Dining car
			meshes = new string[0];
			meshes[meshes.size()] = "interior";
			meshes[meshes.size()] = "electrical_cabinet_arc";
			meshes[meshes.size()] = "door_gangway_int_end";
		} else {
			// ANS / ANSH — detect by asset name in caller; use full interior list
			// ans_seat_day / ans_seat_night handled separately to respect onInteriorChange()
			meshes = new string[0];
			meshes[meshes.size()] = "interior";
			meshes[meshes.size()] = "door_gangway_int_end";
			meshes[meshes.size()] = "door_gangway_int_front";
			// ANS-specific electrical
			meshes[meshes.size()] = "electrical_cabinet_ans";
			// ANSH-specific electrical + lift
			meshes[meshes.size()] = "electrical_cabinet_ansh";
			meshes[meshes.size()] = "lift_wheelchair_right";
			meshes[meshes.size()] = "lift_wheelchair_left";
			// Seat meshes (LOD hides both; onInteriorChange() will re-show correct one)
			meshes[meshes.size()] = "ans_seat_day";
			meshes[meshes.size()] = "ans_seat_night";
		}
		return meshes;
	}

	// Main LOD Update — call from GeneralCheckSystem (PassCoach) or MainLoop stagger
	// currentTime = World.GetTimeElapsed()
	public void LODUpdate(Vehicle veh, CNR_State_Base state, float currentTime) {

		// -----------------------------------------------------------------------
		// PHASE A: First-time init
		// -----------------------------------------------------------------------
		if (!state.lod_init_done) {
			state.lod_init_done = true;
			// Default state is visible. "เริ่มวางแสดงไปเลยไม่ต้องหน่วง" (Show immediately on place, no delay)
			return;
		}

		// -----------------------------------------------------------------------
		// PHASE B: Staggered Toggling in progress (Hide or Show sequentially)
		// -----------------------------------------------------------------------
		if (state.lod_step_index >= 0) {
			// Fast-forward condition: If camera is focusing on this car, or inside it (dist < 20m)
			// Instantly finish loading so interior view 1 doesn't look empty and buggy
			bool fastForward = false;
			if (state.lod_target_visible) {
				WorldCoordinate camPos = World.GetCameraPosition();
				WorldCoordinate myPos  = veh.GetMapObjectPosition();
				if (myPos.GetDistanceTo(camPos) < 20.0f) fastForward = true;
				if (cast<Vehicle>World.GetCameraTarget() == veh) fastForward = true;
			}

			if (fastForward or currentTime >= state.lod_next_step_time) {
				string[] meshes = GetLODMeshList(state);
				
				// Process multiple elements if fast-forwarding, otherwise 1 step at a time
				int limit = state.lod_step_index + 1;
				if (fastForward) limit = meshes.size();
				int i;
				
				for (i = state.lod_step_index; i < limit; i++) {
					if (veh.HasMesh(meshes[i])) {
						if (state.lod_target_visible) {
							bool skip = false;
							if (meshes[i] == "ans_seat_day" and !state.m_isDaySeat) skip = true;
							if (meshes[i] == "ans_seat_night" and state.m_isDaySeat) skip = true;
							if (!skip) veh.SetMeshVisible(meshes[i], true, 0.0f);
						} else {
							veh.SetMeshVisible(meshes[i], false, 0.0f);
						}
					}
				}
				
				state.lod_step_index = limit;
				// Check completion
				if (state.lod_step_index >= meshes.size()) {
					state.lod_interior_visible = state.lod_target_visible;
					state.lod_step_index       = -1;
				} else {
					// Slow down stagger to 0.3s per mesh to prevent physics engine hitching
					state.lod_next_step_time = currentTime + 0.3f;
				}
			}
			return; // Don't run distance polling while actively toggling meshes
		}

		// -----------------------------------------------------------------------
		// PHASE C: Throttled camera-distance check (every 0.5s)
		// -----------------------------------------------------------------------
		if (currentTime < state.lod_next_check_time) return;
		state.lod_next_check_time = currentTime + 0.5f;

		WorldCoordinate camPos = World.GetCameraPosition();
		WorldCoordinate myPos  = veh.GetMapObjectPosition();
		float dist = myPos.GetDistanceTo(camPos);

		// Hysteresis thresholds: hide >500m, show <300m as requested
		bool wantVisible = state.lod_interior_visible;
		if (dist > 500.0f) wantVisible = false;
		else if (dist < 300.0f) wantVisible = true;

		// If a change in visibility is needed, kick off the staggered procedure
		if (wantVisible != state.lod_interior_visible) {
			state.lod_target_visible = wantVisible;
			state.lod_step_index     = 0;
			state.lod_next_step_time = currentTime;
		}
	}

	// NEW: Visual Wheel Lock Handler (called from coach Animation-Event)
	// Triggers visual effects and local emg_locked state
	public void VisualWheelLockHandler(Vehicle veh, string type, int bogIdx, CNR_State_Base state) {
		string bIdx = (string)bogIdx;
		if (type == "start") {
			veh.PostMessage(veh, "pfx", "+locked_sparks_" + bIdx, 0.0f);
			state.emg_locked = true;
			state.emg_bogie_idx = bogIdx;
		} else if (type == "stop") {
			veh.PostMessage(veh, "pfx", "-locked_sparks_" + bIdx, 0.0f);
			state.emg_locked = false;
		}
	}

	// NEW: WSP (Wheel Slide Protection) System Logic
	// Simulates deterministic wheel locking during emergency braking
	public void WSPControl(Vehicle v, CNR_State_Base state, float deltaT) {
		float currentTime = World.GetTimeElapsed();
		
		// Detection: BP < 1.0 bar or emergency state
		if (state.brake_pipe_state == 4 or state.bp_press < 100.0f) {
			if (!state.emg_active) {
				state.emg_active = true;
				state.emg_timer = currentTime;
				// Random delay for each car to feel natural
				state.emg_stagger_delay = Math.Rand(2.0f, 5.0f); 
				state.emg_bogie_idx = (int)Math.Rand(0.0f, 2.0f);
			}

			
			if (state.emg_active and !state.emg_locked and currentTime >= state.emg_timer + state.emg_stagger_delay) {
				if (state.speed > 2.0f) {
					VisualWheelLockHandler(v, "start", state.emg_bogie_idx, state);
				}
			}
			
			// Auto-release lock when train is nearly stopped (no sliding when stationary)
			if (state.emg_locked and state.speed < 1.0f) {
				VisualWheelLockHandler(v, "stop", state.emg_bogie_idx, state);
			}
		} else if (state.brake_pipe_state < 4 and state.bp_press > 400.0f) {
			if (state.emg_active) {
				if (state.emg_locked) {
					VisualWheelLockHandler(v, "stop", state.emg_bogie_idx, state);
				}
				state.emg_active = false;
			}
		}
	}

	// NEW: Physical Brake Update System
	// Manages enginespec switching based on handbrake and WSP lock states
	// Handbrake = full lock (all 4 axles) -> enginespec_emg
	// WSP Lock  = partial lock (1-2 axles) -> enginespec_wheellock
	public void PhysicalBrakeUpdate(Vehicle v, CNR_State_Base state, Library scriptLib) {
		Asset currentSpec = v.GetEngineAsset();

		if (state.handbrake) {
			// Priority 1: Handbrake — full lock on all 4 axles (4.5 bar BC)
			Asset emgSpec = null;
			if (scriptLib) emgSpec = scriptLib.GetAsset().FindAsset("enginespec_emg");
			
			if (emgSpec and currentSpec != emgSpec) {
				v.SetEngineAsset(emgSpec);
			}
		} else if (state.emg_locked) {
			// Priority 2: WSP Wheel Lock — partial lock (1-2 axles, ~50% brake force)
			Asset lockSpec = null;
			if (scriptLib) lockSpec = scriptLib.GetAsset().FindAsset("enginespec_wheellock");
			
			if (lockSpec and currentSpec != lockSpec) {
				v.SetEngineAsset(lockSpec);
			}
		} else {
			// Normal: restore default enginespec
			Asset normalSpec = v.GetDefaultEngineAsset();
			if (normalSpec and currentSpec != normalSpec) {
				v.SetEngineAsset(normalSpec);
			}
		}
	}

};



