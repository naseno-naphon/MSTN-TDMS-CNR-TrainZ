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

// ============================================================
// CNR_CabSystem
// ระบบกลางสำหรับ Cab ที่มี Air Gauge, Door Lamp และ Pressure
// ใช้ร่วมกันระหว่าง cnr_anf_cab และ cnr_ans_ansh_cab
// ============================================================
class CNR_CabSystem isclass GameObject {

	MeshObject	m_mesh;
	Vehicle 	m_vehicle;

	// ชื่อ Texture ของไฟแสดงสถานะประตู
	string		m_lampMeshRight = "doors_light_right";
	string		m_lampMeshLeft  = "doors_light_left";

	// --------------------------------
	// Init
	// --------------------------------
	public void Init(Vehicle vehicle, MeshObject mesh, string lampRight, string lampLeft) {
		m_vehicle  = vehicle;
		m_mesh     = mesh;
		m_lampMeshRight = lampRight;
		m_lampMeshLeft  = lampLeft;
	}

	// --------------------------------
	// GetPressureParam
	// แปลง Engine Param จาก Trainz เป็นหน่วย PSI/kPa ที่ใช้งาน
	// --------------------------------
	public float GetPressureParam(string param) {
		if (param == "main-reservoir-pressure") {
			Soup s = m_vehicle.GetProperties();
			if (s and s.GetNamedTagAsBool("isMSTN")) {
				return s.GetNamedTagAsFloat("script_mr_press", 0.0f) / 1000.0f; // Return kPa
			}
		}
		
		float pressureMultiplier = 1.0 / (0.145 * 0.0000703);
		float pressureBase = 14.7 * 0.0000703;
		if (param == "main-reservoir-pressure") return 0.0f; // Native MR is 0 on coaches
		return pressureMultiplier * (m_vehicle.GetEngineParam(param) - pressureBase);
	}

	// --------------------------------
	// Lerp
	// --------------------------------
	public float Lerp(float a, float b, float c) {
		float ret;
		if (a < b)      ret = a + c;
		else if (a > b) ret = a - (c * 2);
		else            ret = a;
		return ret;
	}

	// --------------------------------
	// CnrAirGaugeUpdate
	// อัปเดตเข็มมาตรวัดลม BP และ BC
	// --------------------------------
	public void CnrAirGaugeUpdate(CabinControl gauge_bp, CabinControl gauge_bc) {
		float bp = 98101.7 * (m_vehicle.GetEngineParam("brake-pipe-pressure") - 0.00103341);
		float bc = 98101.7 * (m_vehicle.GetEngineParam("brake-cylinder-pressure") - 0.00103341);
		
		float gaugeVal = Math.Fabs(gauge_bp.GetValue());
		float factorVal = 0.8f;

		gauge_bp.SetValue(Lerp(gaugeVal, bp, factorVal));
		gauge_bc.SetValue(Lerp(gaugeVal, bc, factorVal));
	}

	// --------------------------------
	// CnrDoorIndicatorLamp (common)
	// คำนวณสีและตั้งค่าไฟสัญญาณประตู
	// Params:
	//   currentTime    - เวลาปัจจุบัน
	//   m_EngineStats  - สถานะเครื่องยนต์ทำงาน
	//   m_DoorInterlock - Door Interlock สถานะ
	//   isDoorOpen     - ประตูฝั่งนั้นเปิดอยู่ไหม
	//   speed          - ความเร็วรถ (km/h)
	//   animMesh       - ชื่อ Mesh Animation ประตูผู้โดยสาร
	//   textureName    - ชื่อ Texture ไฟสัญญาณ
	// --------------------------------
	public bool CnrDoorIndicatorLamp(float currentTime, bool m_EngineStats, bool m_DoorInterlock, bool isDoorOpen, float speed, string animMesh, string textureName, bool bypass, float interlockSpeed) {
		int r = 0, g = 0, b = 0;
		bool lockDoor = false;

		if (m_EngineStats) {
			if (!m_DoorInterlock or bypass) {
				g = 40;
			}
			else if (!isDoorOpen and m_mesh.GetMeshAnimationFrame(animMesh) < 1) {
				if (m_DoorInterlock and speed < interlockSpeed)
					g = 40;
				else if (m_DoorInterlock and speed > interlockSpeed) {
					lockDoor = true;
					r = 100;
				}
			}
			else {
				if (m_mesh.GetMeshAnimationFrame(animMesh) > 209) {
					g = 0;
				}
				else {
					if (((int)(currentTime * 4.0f) % 2) == 0) g = 40;
					else g = 0;
				}
			}
		}

		m_mesh.SetTextureSelfIllumination(textureName, r, g, b);
		return lockDoor;
	}


	// UpdateAutoLampState — ใช้สำหรับ 1 ประตู ทั้งหมด
	// Params:
	//   doorValue   - ค่าจาก CabinControl.GetValue()
	//   meshName    - ชื่อ Mesh ไฟ LED
	//   stateRef    - state ของ autoLamp (0 หรือ 1) [ส่งผ่าน int]
	//   nextTimeRef - เวลาต่อไปที่จะเปลี่ยนเป็นสีเขียว
	// --------------------------------
	public int AutoLampDo(float currentTime, float doorValue, string meshName, int curState, float curNextTime) {
		if (doorValue != 0) {
			if (curState == 0) {
				m_mesh.SetTextureSelfIllumination(meshName, 150, 0, 0);
				return 1;
			}
			
			if (currentTime >= curNextTime) {
				m_mesh.SetTextureSelfIllumination(meshName, 0, 80, 0);
			}
			return curState;
		}

		m_mesh.SetTextureSelfIllumination(meshName, 0, 80, 0);
		return 0;
	}
};
