// =====================================================================
// cnr_ann_scanner.gs
// Announcement Auto-Scanner Module
//
// HOW IT WORKS:
//   Always scans ALL nearby scenery objects within SCAN_RADIUS.
//   Then filters results in two ways depending on ann_scan_mode:
//
//   Mode 0 — STATION MATCH (default):
//     Only highlights and auto-triggers announcements when a found
//     object's name CONTAINS one of the LCD destination station names
//     (origin or destination set in the Signboard sub-page).
//     This lets the system detect "we are approaching Hat Yai station"
//     and auto-play "Approaching Station" or "Next Station" audio.
//
//   Mode 1 — ALL OBJECTS:
//     Shows the closest found object regardless of name, and also
//     highlights any station match if present.
//
// AUTO-TRIGGER LOGIC (ann_mode == 1 only):
//   When a station match is found within TRIGGER_RADIUS and the
//   matched station name changed from the last trigger, the system
//   returns an ACTION string to the coach to play the announcement.
//   The coach is responsible for playing the correct sound file via
//   GetSoundPath().
//
// FILE NAMING (place in sounds/announcement/):
//   ann_<ID>_en.wav   English    ann_<ID>_th.wav  Thai
//   ann_<ID>_jp.wav   Japanese   ann_<ID>_zh.wav  Chinese
//
// Announcement IDs:
//   01=Welcome Aboard  02=Next Station    03=Approaching Station
//   04=Doors Closing   05=Mind the Gap   06=Please Hold On
//   07=Priority Seats  08=No Smoking     09=Prepare to Alight
//   10=Thank You       11=Ticket Check   12=Delay Notice
// =====================================================================

include "cnr_state.gs"

class CNR_Ann_Scanner {

	float SCAN_RADIUS    = 200.0f; // metres: search radius for any object
	float TRIGGER_RADIUS = 80.0f;  // metres: auto-trigger announcement when match this close

	// Station keyword list — must align with lcd_origin/lcd_dest indices 0-6
	// These are English substrings to match against localised object names.
	// Add more aliases separated by | if needed (we check with Str.Find).
	string[] STATION_KEYS;  // initialised in Init()
	bool m_inited = false;

	void Init() {
		if (m_inited) return;
		m_inited = true;
		STATION_KEYS = new string[7];
		STATION_KEYS[0] = "Bangkok";
		STATION_KEYS[1] = "Chiang Mai";
		STATION_KEYS[2] = "Ubon";
		STATION_KEYS[3] = "Nong Khai";
		STATION_KEYS[4] = "Vientiane";
		STATION_KEYS[5] = "Hat Yai";
		STATION_KEYS[6] = "Phuket";
	}

	// ------------------------------------------------------------------
	// GetSoundPath — Returns relative asset path for a given ann_id + lang
	// ------------------------------------------------------------------
	public string GetSoundPath(int ann_id, int lang) {
		string idStr = (string)ann_id;
		if (ann_id < 10) idStr = "0" + idStr;
		string langStr = "en";
		if (lang == 1) langStr = "th";
		else if (lang == 2) langStr = "jp";
		else if (lang == 3) langStr = "zh";
		return "sounds/announcement/ann_" + idStr + "_" + langStr + ".wav";
	}

	// ------------------------------------------------------------------
	// _LogANN — append ANN log entry (declared before TickScan for GScript)
	// ------------------------------------------------------------------
	public void _LogANN(CNR_State_GenCoach state, Vehicle owner, string message) {
		if (!state.system_logs) state.system_logs = Constructors.NewSoup();

		int count = state.system_logs.CountTags();
		int maxLogs = 100;
		if (count >= maxLogs) {
			int i;
			for (i = 0; i < maxLogs - 1; i++) {
				state.system_logs.SetNamedTag((string)i, state.system_logs.GetNamedTag((string)(i + 1)));
			}
			count = maxLogs - 1;
		}
		string timeStr  = state.GetFormattedTime(World.GetGameTime());
		string carInfo  = owner.GetLocalisedName();
		string[] parts  = Str.Tokens(carInfo, "|");
		string posPart  = ""; if (parts.size() > 1) posPart = parts[parts.size() - 1];
		string logEntry = timeStr + "|ANS " + posPart + "|AUTO SCAN|ANN|" + message;
		state.system_logs.SetNamedTag((string)state.system_logs_count, logEntry);
		state.system_logs_count++;
	}

	// ------------------------------------------------------------------
	// PickAutoAnnId
	// ------------------------------------------------------------------
	int PickAutoAnnId(float dist) {
		if (dist < 20.0f) return 5;
		if (dist < 40.0f) return 4;
		if (dist < TRIGGER_RADIUS) return 3;
		return 2;
	}

	AsyncObjectSearchResult m_searchResult;
	WorldCoordinate m_scanPos;
	string m_matchKeyOrig;
	string m_matchKeyDest;

	// ------------------------------------------------------------------
	// TickScan — Call from TickRefresh every frame; internally rate-limited
	// Returns "" normally, or "ANN_PLAY:<ann_id>:<lang>" when auto-trigger fires.
	// ------------------------------------------------------------------
	public string TickScan(float currentTime, CNR_State_GenCoach state, Vehicle owner) {
		if (state.ann_mode != 1) {
			if (m_searchResult) m_searchResult = null; // Clean up
			return "";
		}

		Init();

		// If a search is currently running, poll for completion
		if (m_searchResult) {
			int errCode = m_searchResult.GetSearchErrorCode();
			if (errCode == 3) { // 3 = ERROR_NOT_COMPLETE
				return "";
			}
			
			if (errCode > 0 and errCode < 100) {
				// Search failed
				m_searchResult = null;
				return "";
			}

			// Complete! Process results.
			WorldCoordinate myPos = m_scanPos;
			string matchKeyOrig = m_matchKeyOrig;
			string matchKeyDest = m_matchKeyDest;

			// --- Scan ALL scenery objects ---
			string closestAnyName = "";
			float  closestAnyDist = SCAN_RADIUS + 1.0f;
			string closestMatchName = "";
			float  closestMatchDist = SCAN_RADIUS + 1.0f;

			NamedObjectInfo[] objects = m_searchResult.GetResults();
			m_searchResult = null; // Clear immediately
			
			int i;
			for (i = 0; i < objects.size(); i++) {
				if (!objects[i].objectRef) continue;
				MapObject obj = cast<MapObject>objects[i].objectRef;
				if (!obj) continue;

				WorldCoordinate objPos = obj.GetMapObjectPosition();
				float dist = myPos.GetDistanceTo(objPos);
				if (dist >= SCAN_RADIUS) continue;

				string oName = obj.GetLocalisedName();
				if (oName == "") oName = "object_" + (string)i;

				// Track closest ANY object
				if (dist < closestAnyDist) {
					closestAnyDist = dist;
					closestAnyName = oName;
				}

				// Check if this object name matches a destination station
				bool isMatch = false;
				if (matchKeyOrig != "" and Str.Find(oName, matchKeyOrig, 0) != -1) isMatch = true;
				if (matchKeyDest != "" and Str.Find(oName, matchKeyDest, 0) != -1) isMatch = true;

				if (isMatch and dist < closestMatchDist) {
					closestMatchDist = dist;
					closestMatchName = oName;
				}
			}

			// --- Update state (All Objects result) ---
			if (closestAnyDist <= SCAN_RADIUS) {
				state.ann_scan_result = closestAnyName;
				state.ann_scan_dist   = closestAnyDist;
			} else {
				state.ann_scan_result = "";
				state.ann_scan_dist   = 0.0f; // 0 = scanned, nothing found
			}

			// --- Update state (Station Match result) ---
			if (closestMatchDist <= SCAN_RADIUS) {
				state.ann_scan_matched    = closestMatchName;
				state.ann_scan_match_dist = closestMatchDist;
			} else {
				state.ann_scan_matched    = "";
				state.ann_scan_match_dist = -1.0f;
			}

			// --- Log new scan result ---
			if (closestAnyName != "" or closestMatchName != "") {
				int dAny   = (int)closestAnyDist;
				int dMatch = (int)closestMatchDist;
				string logMsg = "SCAN: " + closestAnyName + " (" + (string)dAny + "m)";
				if (closestMatchName != "") logMsg = logMsg + " | MATCH: " + closestMatchName + " (" + (string)dMatch + "m)";
				_LogANN(state, owner, logMsg);
			}

			// --- Auto-trigger announcement when match found within TRIGGER_RADIUS ---
			if (closestMatchName != "" and closestMatchDist <= TRIGGER_RADIUS) {
				int autoId = PickAutoAnnId(closestMatchDist);
				// Dedup: only trigger when station name OR ann type changed
				if (closestMatchName != state.ann_scan_matched or autoId != state.ann_last_auto_id) {
					state.ann_last_auto_id = autoId;
					state.ann_playing = true;
					return "ANN_PLAY:" + (string)autoId + ":" + (string)state.ann_sound_lang;
				}
			} else {
				// Reset dedup when no match in trigger zone
				state.ann_last_auto_id = 0;
			}

			return "";
		}

		// Throttle triggering new searches
		if (currentTime < state.next_ann_scan_time) return "";
		state.next_ann_scan_time = currentTime + 3.0f;

		m_scanPos = owner.GetMapObjectPosition();
		m_matchKeyOrig = "";
		m_matchKeyDest = "";
		if (state.lcd_origin >= 0 and state.lcd_origin < 7) m_matchKeyOrig = STATION_KEYS[state.lcd_origin];
		if (state.lcd_dest   >= 0 and state.lcd_dest   < 7) m_matchKeyDest = STATION_KEYS[state.lcd_dest];

		m_searchResult = World.GetNamedObjectList("sc", "");
		
		return "";
	}

};
