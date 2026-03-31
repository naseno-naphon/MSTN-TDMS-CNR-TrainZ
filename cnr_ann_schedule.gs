// =====================================================================
// cnr_ann_schedule.gs — Station Stop Schedule Data
// NOTE: GScript does not support 2D arrays (string[][]).
//       All stop data is encoded using direct if/else assignment.
// =====================================================================

include "cnr_state.gs"

class CNR_StopEntry {
	public string name_th  = "";
	public string name_en  = "";
	public int    arr_min  = -1;  // -1 = origin terminus, minutes from midnight
	public int    dep_min  = -1;  // -1 = terminus
	public bool   isNextDay = false;
};

class CNR_Ann_Schedule {

	// ------------------------------------------------------------------
	// GetServiceIndex — maps lcd config to service ID
	//   0=Train 9/10  1=Train 5/6  2=Train 23/24  3=Train 25/26  4=Train 31/32
	// ------------------------------------------------------------------
	public int GetServiceIndex(CNR_State_GenCoach state) {
		int dest = state.lcd_dest;
		if (dest == 0) dest = state.lcd_origin;
		if (dest == 1) {
			if (state.lcd_train_idx == 0) return 0;
			return 1;
		}
		if (dest == 2) return 2;
		if (dest == 3 or dest == 4) return 3;
		if (dest == 5) return 4;
		return -1;
	}

	public int GetStopCount(int svcIdx) {
		if (svcIdx == 0) return 13;
		if (svcIdx == 1) return 13;
		if (svcIdx == 2) return 15;
		if (svcIdx == 3) return 15;
		if (svcIdx == 4) return 14;
		return 0;
	}

	// ------------------------------------------------------------------
	// GetStop — if/else chain per service (no 2D arrays)
	// arr_min/dep_min in minutes from midnight; isNextDay=true if +1 day
	// ------------------------------------------------------------------
	public CNR_StopEntry GetStop(int svcIdx, int stopIdx) {
		CNR_StopEntry e = new CNR_StopEntry();

		// === Train 9 (Bangkok → Chiang Mai) ===
		if (svcIdx == 0) {
			if      (stopIdx == 0)  { e.name_th="กรุงเทพอภิวัฒน์"; e.name_en="Bangkok Aphiwat";    e.arr_min=-1;   e.dep_min=1120; e.isNextDay=false; }
			else if (stopIdx == 1)  { e.name_th="ดอนเมือง";         e.name_en="Don Mueang";         e.arr_min=1135; e.dep_min=1137; e.isNextDay=false; }
			else if (stopIdx == 2)  { e.name_th="รังสิต";            e.name_en="Rangsit";            e.arr_min=1145; e.dep_min=1147; e.isNextDay=false; }
			else if (stopIdx == 3)  { e.name_th="อยุธยา";            e.name_en="Ayutthaya";          e.arr_min=1183; e.dep_min=1185; e.isNextDay=false; }
			else if (stopIdx == 4)  { e.name_th="อ่างทอง";           e.name_en="Ang Thong";          e.arr_min=1241; e.dep_min=1243; e.isNextDay=false; }
			else if (stopIdx == 5)  { e.name_th="นครสวรรค์";         e.name_en="Nakhon Sawan";       e.arr_min=1337; e.dep_min=1340; e.isNextDay=false; }
			else if (stopIdx == 6)  { e.name_th="พิษณุโลก";          e.name_en="Phitsanulok";        e.arr_min=15;   e.dep_min=17;   e.isNextDay=true;  }
			else if (stopIdx == 7)  { e.name_th="สวรรคโลก";          e.name_en="Sawankhalok";        e.arr_min=101;  e.dep_min=111;  e.isNextDay=true;  }
			else if (stopIdx == 8)  { e.name_th="เด่นชัย";           e.name_en="Den Chai";           e.arr_min=165;  e.dep_min=168;  e.isNextDay=true;  }
			else if (stopIdx == 9)  { e.name_th="นครลำปาง";          e.name_en="Nakhon Lampang";     e.arr_min=297;  e.dep_min=300;  e.isNextDay=true;  }
			else if (stopIdx == 10) { e.name_th="ลำปาง";             e.name_en="Lampang";            e.arr_min=357;  e.dep_min=360;  e.isNextDay=true;  }
			else if (stopIdx == 11) { e.name_th="ลำพูน";             e.name_en="Lamphun";            e.arr_min=400;  e.dep_min=410;  e.isNextDay=true;  }
			else if (stopIdx == 12) { e.name_th="เชียงใหม่";         e.name_en="Chiang Mai";         e.arr_min=435;  e.dep_min=-1;   e.isNextDay=true;  }
		}
		// === Train 5/6 (Bangkok → Chiang Mai, alt) ===
		else if (svcIdx == 1) {
			if      (stopIdx == 0)  { e.name_th="กรุงเทพอภิวัฒน์"; e.name_en="Bangkok Aphiwat";    e.arr_min=-1;   e.dep_min=1080; e.isNextDay=false; }
			else if (stopIdx == 1)  { e.name_th="ดอนเมือง";         e.name_en="Don Mueang";         e.arr_min=1095; e.dep_min=1097; e.isNextDay=false; }
			else if (stopIdx == 2)  { e.name_th="รังสิต";            e.name_en="Rangsit";            e.arr_min=1105; e.dep_min=1107; e.isNextDay=false; }
			else if (stopIdx == 3)  { e.name_th="อยุธยา";            e.name_en="Ayutthaya";          e.arr_min=1143; e.dep_min=1145; e.isNextDay=false; }
			else if (stopIdx == 4)  { e.name_th="อ่างทอง";           e.name_en="Ang Thong";          e.arr_min=1202; e.dep_min=1204; e.isNextDay=false; }
			else if (stopIdx == 5)  { e.name_th="นครสวรรค์";         e.name_en="Nakhon Sawan";       e.arr_min=1300; e.dep_min=1303; e.isNextDay=false; }
			else if (stopIdx == 6)  { e.name_th="พิษณุโลก";          e.name_en="Phitsanulok";        e.arr_min=35;   e.dep_min=37;   e.isNextDay=true;  }
			else if (stopIdx == 7)  { e.name_th="สวรรคโลก";          e.name_en="Sawankhalok";        e.arr_min=111;  e.dep_min=121;  e.isNextDay=true;  }
			else if (stopIdx == 8)  { e.name_th="เด่นชัย";           e.name_en="Den Chai";           e.arr_min=168;  e.dep_min=171;  e.isNextDay=true;  }
			else if (stopIdx == 9)  { e.name_th="นครลำปาง";          e.name_en="Nakhon Lampang";     e.arr_min=300;  e.dep_min=303;  e.isNextDay=true;  }
			else if (stopIdx == 10) { e.name_th="ลำปาง";             e.name_en="Lampang";            e.arr_min=360;  e.dep_min=363;  e.isNextDay=true;  }
			else if (stopIdx == 11) { e.name_th="ลำพูน";             e.name_en="Lamphun";            e.arr_min=403;  e.dep_min=413;  e.isNextDay=true;  }
			else if (stopIdx == 12) { e.name_th="เชียงใหม่";         e.name_en="Chiang Mai";         e.arr_min=438;  e.dep_min=-1;   e.isNextDay=true;  }
		}
		// === Train 23/24 (Bangkok → Ubon Ratchathani) ===
		else if (svcIdx == 2) {
			if      (stopIdx == 0)  { e.name_th="กรุงเทพอภิวัฒน์"; e.name_en="Bangkok Aphiwat";    e.arr_min=-1;   e.dep_min=1260; e.isNextDay=false; }
			else if (stopIdx == 1)  { e.name_th="ดอนเมือง";         e.name_en="Don Mueang";         e.arr_min=1280; e.dep_min=1282; e.isNextDay=false; }
			else if (stopIdx == 2)  { e.name_th="รังสิต";            e.name_en="Rangsit";            e.arr_min=1290; e.dep_min=1291; e.isNextDay=false; }
			else if (stopIdx == 3)  { e.name_th="อยุธยา";            e.name_en="Ayutthaya";          e.arr_min=1321; e.dep_min=1322; e.isNextDay=false; }
			else if (stopIdx == 4)  { e.name_th="สระบุรี";           e.name_en="Saraburi";           e.arr_min=1355; e.dep_min=1356; e.isNextDay=false; }
			else if (stopIdx == 5)  { e.name_th="ปากช่อง";           e.name_en="Pak Chong";          e.arr_min=1438; e.dep_min=1441; e.isNextDay=false; }
			else if (stopIdx == 6)  { e.name_th="นครราชสีมา";        e.name_en="Nakhon Ratchasima";  e.arr_min=90;   e.dep_min=103;  e.isNextDay=true;  }
			else if (stopIdx == 7)  { e.name_th="สำโรงทศพล";         e.name_en="Samrong Thot";       e.arr_min=182;  e.dep_min=183;  e.isNextDay=true;  }
			else if (stopIdx == 8)  { e.name_th="บุรีรัมย์";          e.name_en="Buriram";            e.arr_min=211;  e.dep_min=214;  e.isNextDay=true;  }
			else if (stopIdx == 9)  { e.name_th="สุรินทร์";          e.name_en="Surin";              e.arr_min=253;  e.dep_min=254;  e.isNextDay=true;  }
			else if (stopIdx == 10) { e.name_th="ศีรษะเกษ";          e.name_en="Si Sa Ket";          e.arr_min=282;  e.dep_min=283;  e.isNextDay=true;  }
			else if (stopIdx == 11) { e.name_th="อุดมพิสัย";         e.name_en="Udom Phisai";        e.arr_min=319;  e.dep_min=320;  e.isNextDay=true;  }
			else if (stopIdx == 12) { e.name_th="กันทรารมย์";        e.name_en="Kanthararom";        e.arr_min=338;  e.dep_min=339;  e.isNextDay=true;  }
			else if (stopIdx == 13) { e.name_th="กันทรลักษ์";        e.name_en="Kantharalak";        e.arr_min=366;  e.dep_min=367;  e.isNextDay=true;  }
			else if (stopIdx == 14) { e.name_th="อุบลราชธานี";       e.name_en="Ubon Ratchathani";   e.arr_min=400;  e.dep_min=-1;   e.isNextDay=true;  }
		}
		// === Train 25/26 (Bangkok → Nong Khai) ===
		else if (svcIdx == 3) {
			if      (stopIdx == 0)  { e.name_th="กรุงเทพอภิวัฒน์"; e.name_en="Bangkok Aphiwat";    e.arr_min=-1;   e.dep_min=1225; e.isNextDay=false; }
			else if (stopIdx == 1)  { e.name_th="ดอนเมือง";         e.name_en="Don Mueang";         e.arr_min=1240; e.dep_min=1242; e.isNextDay=false; }
			else if (stopIdx == 2)  { e.name_th="รังสิต";            e.name_en="Rangsit";            e.arr_min=1253; e.dep_min=1254; e.isNextDay=false; }
			else if (stopIdx == 3)  { e.name_th="อยุธยา";            e.name_en="Ayutthaya";          e.arr_min=1298; e.dep_min=1299; e.isNextDay=false; }
			else if (stopIdx == 4)  { e.name_th="สระบุรี";           e.name_en="Saraburi";           e.arr_min=1342; e.dep_min=1343; e.isNextDay=false; }
			else if (stopIdx == 5)  { e.name_th="ชุมทางแก่งคอย";    e.name_en="Kaeng Khoi Jct";     e.arr_min=1353; e.dep_min=1355; e.isNextDay=false; }
			else if (stopIdx == 6)  { e.name_th="สำมะรณ์";           e.name_en="Sam Phran";          e.arr_min=1438; e.dep_min=1443; e.isNextDay=false; }
			else if (stopIdx == 7)  { e.name_th="ชุมทางบัวใหญ่";     e.name_en="Bua Yai Jct";        e.arr_min=160;  e.dep_min=170;  e.isNextDay=true;  }
			else if (stopIdx == 8)  { e.name_th="เมืองพล";           e.name_en="Mueang Phon";        e.arr_min=194;  e.dep_min=195;  e.isNextDay=true;  }
			else if (stopIdx == 9)  { e.name_th="บ้านไผ่";           e.name_en="Ban Phai";           e.arr_min=217;  e.dep_min=220;  e.isNextDay=true;  }
			else if (stopIdx == 10) { e.name_th="ขอนแก่น";           e.name_en="Khon Kaen";          e.arr_min=250;  e.dep_min=252;  e.isNextDay=true;  }
			else if (stopIdx == 11) { e.name_th="น้ำพอง";            e.name_en="Nam Phong";          e.arr_min=277;  e.dep_min=278;  e.isNextDay=true;  }
			else if (stopIdx == 12) { e.name_th="กุมภวาปี";          e.name_en="Kumphawapi";         e.arr_min=312;  e.dep_min=313;  e.isNextDay=true;  }
			else if (stopIdx == 13) { e.name_th="อุดรธานี";          e.name_en="Udon Thani";         e.arr_min=339;  e.dep_min=344;  e.isNextDay=true;  }
			else if (stopIdx == 14) { e.name_th="หนองคาย";           e.name_en="Nong Khai";          e.arr_min=385;  e.dep_min=-1;   e.isNextDay=true;  }
		}
		// === Train 31/32 (Bangkok → Hat Yai) ===
		else if (svcIdx == 4) {
			if      (stopIdx == 0)  { e.name_th="กรุงเทพอภิวัฒน์"; e.name_en="Bangkok Aphiwat";    e.arr_min=-1;   e.dep_min=1010; e.isNextDay=false; }
			else if (stopIdx == 1)  { e.name_th="บางปะอิน";         e.name_en="Bang Pa-in";         e.arr_min=1021; e.dep_min=1022; e.isNextDay=false; }
			else if (stopIdx == 2)  { e.name_th="ศาลายา";           e.name_en="Salaya";             e.arr_min=1042; e.dep_min=1043; e.isNextDay=false; }
			else if (stopIdx == 3)  { e.name_th="นครปฐม";           e.name_en="Nakhon Pathom";      e.arr_min=1068; e.dep_min=1070; e.isNextDay=false; }
			else if (stopIdx == 4)  { e.name_th="บ้านโป่ง";          e.name_en="Ban Pong";           e.arr_min=1088; e.dep_min=1089; e.isNextDay=false; }
			else if (stopIdx == 5)  { e.name_th="ราชบุรี";           e.name_en="Ratchaburi";         e.arr_min=1117; e.dep_min=1127; e.isNextDay=false; }
			else if (stopIdx == 6)  { e.name_th="เพชรบุรี";          e.name_en="Phetchaburi";        e.arr_min=1170; e.dep_min=1171; e.isNextDay=false; }
			else if (stopIdx == 7)  { e.name_th="หัวหิน";            e.name_en="Hua Hin";            e.arr_min=1220; e.dep_min=1225; e.isNextDay=false; }
			else if (stopIdx == 8)  { e.name_th="ประจวบฯ";           e.name_en="Prachuap Khiri Khan"; e.arr_min=1301; e.dep_min=1301; e.isNextDay=false; }
			else if (stopIdx == 9)  { e.name_th="ชุมพร";             e.name_en="Chumphon";           e.arr_min=1435; e.dep_min=5;    e.isNextDay=false; }
			else if (stopIdx == 10) { e.name_th="สุราษฎร์ธานี";      e.name_en="Surat Thani";        e.arr_min=140;  e.dep_min=143;  e.isNextDay=true;  }
			else if (stopIdx == 11) { e.name_th="ชุมทางทุ่งสง";     e.name_en="Thung Song Jct";     e.arr_min=248;  e.dep_min=258;  e.isNextDay=true;  }
			else if (stopIdx == 12) { e.name_th="พัทลุง";            e.name_en="Phatthalung";        e.arr_min=351;  e.dep_min=353;  e.isNextDay=true;  }
			else if (stopIdx == 13) { e.name_th="ชุมทางหาดใหญ่";    e.name_en="Hat Yai Junction";   e.arr_min=425;  e.dep_min=-1;   e.isNextDay=true;  }
		}
		return e;
	}

	// ------------------------------------------------------------------
	// GetNextStopIndex — returns index of next upcoming stop from current gameMin
	// ------------------------------------------------------------------
	public int GetNextStopIndex(int svcIdx, int currentMin) {
		int count = GetStopCount(svcIdx);
		if (count == 0) return -1;

		int i;
		int bestIdx = count - 1;
		int bestDiff = 999999;

		for (i = 0; i < count; i++) {
			CNR_StopEntry s = GetStop(svcIdx, i);
			int stopMin = s.dep_min;
			if (stopMin == -1) stopMin = s.arr_min;
			if (stopMin == -1) continue;

			int adjStop = stopMin;
			if (s.isNextDay) adjStop = stopMin + 1440;

			int adjCur = currentMin;
			int diff = adjStop - adjCur;
			if (diff < 0) diff = diff + 2880; // handle wrap

			if (diff < bestDiff) {
				bestDiff = diff;
				bestIdx = i;
			}
		}
		return bestIdx;
	}

	// ------------------------------------------------------------------
	// FormatStopTime — "HH:MM" (or "HH:MM+1" for next-day)
	// ------------------------------------------------------------------
	public string FormatStopTime(int minutes, bool isNextDay) {
		if (minutes < 0) return "--";
		int h = (minutes / 60) % 24;
		int m = minutes % 60;
		string hh = (string)h; if (h < 10) hh = "0" + hh;
		string mm = (string)m; if (m < 10) mm = "0" + mm;
		string r = hh + ":" + mm;
		if (isNextDay) r = r + "+1";
		return r;
	}

	// ------------------------------------------------------------------
	// GetNextStopLabel — convenience: returns "STN (HH:MM)" for display
	// ------------------------------------------------------------------
	public string GetNextStopLabel(int svcIdx, int stopIdx) {
		if (svcIdx < 0 or stopIdx < 0) return "";
		CNR_StopEntry s = GetStop(svcIdx, stopIdx);
		int dispMin = s.arr_min; if (dispMin == -1) dispMin = s.dep_min;
		return s.name_th + " (" + FormatStopTime(dispMin, s.isNextDay) + ")";
	}

};
