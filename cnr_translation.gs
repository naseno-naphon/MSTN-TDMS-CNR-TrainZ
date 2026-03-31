include "gs.gs"
include "soup.gs"
include "world.gs"
include "constructors.gs"

class CNR_Translation isclass Library {
	public int language = 0; // 0=EN, 1=JP, 2=CN, 3=TH
	Soup m_translations;

	public Soup GetTranslations(void) {
		Soup translations = Constructors.NewSoup();

		// -------------------------------------------------------
		// [1] HOME / OVERVIEW PAGE
		// -------------------------------------------------------
		translations.SetNamedTag("STATUS_MONITOR",    "STATUS MONITOR,ステータス・モニタ,状态监测,หน้าจอแสดงผล");
		translations.SetNamedTag("OVERVIEW",          "OVERVIEW,概要,概览,ภาพรวม");
		translations.SetNamedTag("CAR",               "CAR,号車,车厢,ตู้รถ");
		translations.SetNamedTag("L_DR",              "L DR,左扉,左门,ซ");
		translations.SetNamedTag("R_DR",              "R DR,右扉,右门,ข");
		translations.SetNamedTag("AC",                "AC,空調,空调,แอร์");
		translations.SetNamedTag("WC",                "WC,WC,洗手间,ส้วม");
		translations.SetNamedTag("LOAD",              "LOAD,負荷,负载,โหลด");
		translations.SetNamedTag("BP",                "BP,BP,列车管,BP");
		translations.SetNamedTag("BC",                "BC,BC,制动缸,BC");
		translations.SetNamedTag("BACK",              "BACK,戻る,返回,กลับ");

		// Master Door Controls
		translations.SetNamedTag("MASTER_DOOR_CTRL",  "MASTER DOOR CONTROL,マスタードア制御,总门控,แผงควบคุมประตูหลัก");
		translations.SetNamedTag("PLATFORM_HEIGHT",   "PLATFORM HEIGHT,ホーム高さ,站台高度,ความสูงชานชาลา");
		translations.SetNamedTag("LEFT",              "LEFT,左,左,ซ้าย");
		translations.SetNamedTag("RIGHT",             "RIGHT,右,右,ขวา");
		translations.SetNamedTag("HIGH",              "HIGH,高い,高,สูง");
		translations.SetNamedTag("LOW",               "LOW,低い,低,ต่ำ");
		translations.SetNamedTag("OPEN",              "OPEN,開,开,เปิด");
		translations.SetNamedTag("CLOSED",            "CLOSED,閉,关,ปิด");
		translations.SetNamedTag("NO_PWR",            "NO PWR,無電源,无电,ไม่มีไฟ");
		translations.SetNamedTag("SELECT_COACH_CTRL", "SELECT COACH TO CONTROL,制御する車両を選択,选择控制车厢,เลือกตู้คุมประตูเฉพาะ");
		translations.SetNamedTag("LEFT_DOORS",        "LEFT DOORS,左側ドア,左侧门,ประตูด้านซ้าย");
		translations.SetNamedTag("RIGHT_DOORS",       "RIGHT DOORS,右側ドア,右侧门,ประตูด้านขวา");

		// -------------------------------------------------------
		// [2] POWER / ELECTRICAL PAGE
		// -------------------------------------------------------
		translations.SetNamedTag("SYSTEM",            "SYSTEM,システム,系统,ระบบ");
		translations.SetNamedTag("STATUS",            "STATUS,状態,状态,สถานะ");
		translations.SetNamedTag("VOLTAGE",           "VOLTAGE,電圧,电压,แรงดันไฟ");
		translations.SetNamedTag("FREQUENCY",         "FREQ,周波数,频率,ความถี่");
		translations.SetNamedTag("NORMAL",            "NORMAL,正常,正常,ปกติ");
		translations.SetNamedTag("OFFLINE",           "OFFLINE,オフライン,离线,ออฟไลน์");
		translations.SetNamedTag("ONLINE",            "ONLINE,オンライン,在线,ออนไลน์");
		translations.SetNamedTag("STABILIZING",       "STABILIZING,安定化中,正在稳定,กำลังปรับเสถียร");
		translations.SetNamedTag("SYNCING",           "SYNCING,同期中,正在同步,กำลังซิงค์");

		// HEP
		translations.SetNamedTag("HEP",              "HEAD END POWER (HEP),ヘッドエンド電力,列车供电,ไฟเลี้ยงขบวนรถ");
		translations.SetNamedTag("RELAY",             "RELAY,リレー,继电器,รีเลย์");
		translations.SetNamedTag("SYS_LOAD",          "SYS LOAD,システム負荷,系统负载,โหลดระบบ");
		translations.SetNamedTag("OUTPUT",            "OUTPUT,出力,输出,พลังงาน");
		translations.SetNamedTag("CURRENT",           "CURRENT,電流,电流,กระแสไฟ");
		translations.SetNamedTag("CONNECT_HEP",       "CONNECT HEP,HEP接続,连接HEP,เชื่อมต่อ HEP");
		translations.SetNamedTag("DISCONNECT_HEP",    "DISCONNECT HEP,HEP切断,断开HEP,ตัดการเชื่อมต่อ HEP");

		// Advanced Electrical Tags
		translations.SetNamedTag("GEN_TOTAL_PWR",     "TOTAL PWR,出力合計,总功率,กำลังไฟรวม");
		translations.SetNamedTag("GEN_TOTAL_CUR",     "TOTAL CUR,電流合計,总电流,กระแสรวม");
		translations.SetNamedTag("BUS_MAIN",          "MAIN BUS,メインバス,主母线,บัสหลัก (400V)");
		translations.SetNamedTag("BUS_AUX",           "AUX BUS,補助バス,辅助母线,บัสรอง (220V)");
		translations.SetNamedTag("BUS_BATT",          "BATT BUS,バッテリーバス,电池母线,บัส 110V (BATT)");
		translations.SetNamedTag("TRANSFORMER",       "XFMR,変圧器,变压器,หม้อแปลง");
		translations.SetNamedTag("RECTIFIER",         "RECTIFIER,整流器,整流器,เครื่องเรียงกระแส");
		translations.SetNamedTag("CHARGING",          "CHARGING,充電中,充电中,กำลังชาร์จ");
		translations.SetNamedTag("DISCHARGING",       "DISCHARGING,放電中,放电中,กำลังคลายประจุ");
		translations.SetNamedTag("GROUND_FAULT",      "GF STATUS,地絡状態,接地故障状态,ความผิดพร่องลงดิน");
		translations.SetNamedTag("INSULATION",        "INSUL.,絶縁,绝缘,ฉนวน");
		translations.SetNamedTag("HVAC_LOAD",         "HVAC,空調,空调,โหลดแอร์");
		translations.SetNamedTag("LGT_LOAD",          "LIGHTS,照明,照明,โหลดไฟ");
		translations.SetNamedTag("AUX_LOAD",          "AUX,補助,辅助,โหลดเสริม");
		translations.SetNamedTag("PWR_FACTOR",        "PWR FACTOR,力率,功率因数,ตัวประกอบกำลัง (PF)");
		translations.SetNamedTag("PWR_FLOW_BUS",      "POWER DISTRIBUTION,電力分配,配电,การจ่ายไฟ");
		translations.SetNamedTag("BUS_DC_24V",       "AUX DC (24V),補助DC,辅助直流,บัสไฟฟ้าสำรอง (24V)");

		// Engines
		translations.SetNamedTag("ENGINE_1",          "ENGINE 1,エンジン 1,引擎 1,เครื่องยนต์ 1");
		translations.SetNamedTag("ENGINE_2",          "ENGINE 2,エンジン 2,引擎 2,เครื่องยนต์ 2");
		translations.SetNamedTag("START_ENG",         "START,始動,启动,สตาร์ท");
		translations.SetNamedTag("STOP_ENG",          "STOP,停止,停机,ดับเครื่อง");
		translations.SetNamedTag("RUNNING",           "RUNNING,稼働中,运行中,กำลังทำงาน");
		translations.SetNamedTag("STOPPED",           "STOPPED,停止,停机,หยุด");
		translations.SetNamedTag("STARTING",          "STARTING,始動中,启动中,สตาร์ท");
		translations.SetNamedTag("RPM",               "RPM,回転数,转速,รอบเครื่อง");
		translations.SetNamedTag("ENG_TEMP",          "TEMP,温度,温度,ความร้อน");
		translations.SetNamedTag("ENG_OIL",           "OIL,油圧,油压,แรงดันน้ำมัน");
		translations.SetNamedTag("ENG_FUEL",          "FUEL,燃料,燃料,น้ำมัน");

		// Fuel
		translations.SetNamedTag("FUEL_SYS",          "FUEL SYSTEM,燃料システム,燃料系统,ระบบน้ำมันเชื้อเพลิง");
		translations.SetNamedTag("TRN_FUEL_FLOW",     "FUEL FLOW,燃料流量,燃料流量,อัตราสิ้นเปลืองน้ำมัน");

		// -------------------------------------------------------
		// [3] LCD DESTINATION SIGN PAGE
		// -------------------------------------------------------
		translations.SetNamedTag("LCD_SIDE_CTRL",     "LCD SIDE DESTINATION CONTROL,側面LCD行先制御,侧面LCD目的地控制,ควบคุมหน้าจอ LCD ข้างรถ");
		translations.SetNamedTag("LCD_INFO_TEXT",     "Select display destination for side LCD screens.,側面LCDの行先を選択してください。,请选择侧面LCD显示目的地。,กรุณาเลือกสถานีปลายทางสำหรับจอข้างรถ");
		translations.SetNamedTag("TRN_ORIGIN",        "ORIGIN,始発,始发站,ต้นทาง");
		translations.SetNamedTag("TRN_DEST",          "DESTINATION,行先,目的地,ปลายทาง");
		translations.SetNamedTag("TRN_VARIANT",       "VARIANT,種別,种类,ประเภทรภ");
		translations.SetNamedTag("FORCE_BLANK",       "FORCE BLANK,強制消灯,强制黑屏,บังคับปิดหน้าจอ");
		translations.SetNamedTag("FORCE_BLANK_OPTS",  "DISPLAY MODE,表示モード,显示模式,โหมดหน้าจอ");
		translations.SetNamedTag("TURN_OFF_SIGN",     "TURN OFF SIGN,サイン消灯,关闭标志,ปิดป้ายไฟ");
		translations.SetNamedTag("TURN_ON_SIGN",      "NORMAL OPERATION,通常動作,正常运行,เปิดใช้งานปกติ");
		translations.SetNamedTag("SELECT_VARIANT",    "SELECT VARIANT,種別選択,选择种类,เลือกประเภทรภ");
		translations.SetNamedTag("BLANKED",           "BLANKED,消灯,黑屏,ถูกปิด");
		translations.SetNamedTag("INFO",              "INFO,情報,信息,ข้อมูล");
		translations.SetNamedTag("SWAP_MSG",          "Swap Origin and Destination?,始発と終点を入れ替えますか？,交换始发站和终点站？,สลับต้นทางและปลายทางหรือไม่?");
		translations.SetNamedTag("CONFIRM_SWAP",      "CONFIRM SWAP,入れ替え確認,确认交换,ยืนยันการสลับ");
		translations.SetNamedTag("SIGN_MODE_NORMAL",  "NORMAL OPERATION,通常動作,正常运行,แสดงปลายทางตามปกติ");
		translations.SetNamedTag("SIGN_MODE_OFF",     "SIGN OFF,サイン消灯,关闭标志,ปิดป้ายไฟ");
		translations.SetNamedTag("SIGN_MODE_FACTORY", "FACTORY LED,FACTORY LED,FACTORY LED,ป้ายเริ่มต้น (Factory LED)");

		// Station Names
		translations.SetNamedTag("BANGKOK",           "BANGKOK,バンコク,曼谷,กรุงเทพ");
		translations.SetNamedTag("CHIANG_MAI",        "CHIANG MAI,チェンマイ,清迈,เชียงใหม่");
		translations.SetNamedTag("UBON_RAT",          "UBON RAT.,ウボンラチャタニ,乌汶,อุบลราชธานี");
		translations.SetNamedTag("NONG_KHAI",         "NONG KHAI,ノンカイ,廊开,หนองคาย");
		translations.SetNamedTag("VTE",               "VIENTIANE,ビエンチャン,万象,เวียงจันทน์ (คำสะหวาด)");
		translations.SetNamedTag("HAT_YAI",           "HAT YAI,ハートヤイ,合艾,ชุมทางหาดใหญ่");
		translations.SetNamedTag("PHUKET",            "PHUKET,プーケット,普吉岛,ภูเก็ต");

		// -------------------------------------------------------
		// [4] BRAKES PAGE
		// -------------------------------------------------------
		translations.SetNamedTag("BRAKES",            "BRAKES,ブレーキ,制动,ระบบเบรก");
		translations.SetNamedTag("RESET_BRAKE",       "RESET BRAKE,ブレーキリセット,重置制动,รีเซ็ตเบรก");
		translations.SetNamedTag("DECEL_RATE",        "DECEL RATE,減速度,减速率,อัตราหน่วง");
		translations.SetNamedTag("RELEASED",          "RELEASED,緩解,缓解,ปลดเบรก");
		translations.SetNamedTag("APPLIED",           "APPLIED,適用,施加,ใช้งาน");
		translations.SetNamedTag("PARK_BRAKE",        "PARKING BRAKE,パーキングブレーキ,停放制动,เบรกจอด (เบรกมือ)");
		translations.SetNamedTag("PARK_APPLY",        "APPLY,適用,施加,ใส่เบรกมือ");
		translations.SetNamedTag("PARK_REL",          "RELEASE,解除,缓解,ปลดเบรกมือ");
		translations.SetNamedTag("BRAKE_SYS_MODEL",   "BRAKE SYSTEM MODEL,ブレーキシステムモデル,制动系统型号,รุ่นของระบบเบรก");
		translations.SetNamedTag("BRAKE_MODEL_NAME",  "KNORR-BREMSE EP COMPACT,クノールブレムゼ EP コンパクト,克诺尔 EP 紧凑型,KNORR-BREMSE EP COMPACT");
		translations.SetNamedTag("KE_VALVE",          "KE DISTRIBUTOR VALVE,KE分配弁,KE分配阀,วาล์วจ่ายลม KE");
		translations.SetNamedTag("DISC_BRAKE",        "DISC BRAKE (PNEUMATIC),ディスクブレーキ,盘式制动,ดิสก์เบรกลม");
		translations.SetNamedTag("BRAKE_CYL_8X8",     "8-CYLINDER (8x 8\"),8シリンダー,8缸,8 กระบอกเบรก (8x 8\")");
		translations.SetNamedTag("BRAKE_DESC_1",      "Microprocessor-controlled EP brake,マイクロプロセッサ制御EPブレーキ,微处理器控制EP制动,ระบบเบรกควบคุมด้วยไมโครโปรเซสเซอร์ (EP)");
		translations.SetNamedTag("BRAKE_DESC_2",      "with Wheel Slide Protection (WSP),WSP付き,带防滑保护,พร้อมระบบป้องกันล้อสไลด์ (WSP)");

		// -------------------------------------------------------
		// [5] SETTINGS PAGE
		// -------------------------------------------------------
		translations.SetNamedTag("SETTINGS",          "SETTINGS,設定,设置,การตั้งค่า");
		translations.SetNamedTag("LANGUAGE",          "LANGUAGE,言語,语言,ภาษา");
		translations.SetNamedTag("ENGLISH",           "ENGLISH,英語,英语,อังกฤษ(EN)");
		translations.SetNamedTag("JAPANESE",          "JAPANESE,日本語,日语,ญี่ปุ่น(JP)");
		translations.SetNamedTag("CHINESE",           "CHINESE,中国語,中文,จีน(CN)");
		translations.SetNamedTag("DOOR_INTERLOCK_BYPASS", "Door Interlock Bypass,ドアインターロック・バイパス,门控制安全旁路,ระบบยกเลิก Interlock ประตู");
		translations.SetNamedTag("DOOR_INTERLOCK",        "Door Interlock System,ドアインターロック・システム,车门联锁系统,ระบบ Interlock ประตู");
		translations.SetNamedTag("INTERLOCK_SPEED_LIMIT", "SPEED LIMIT,速度制限,速度限制,จำกัดความเร็ว");
		translations.SetNamedTag("SIGNAL_LAMP",           "Signal Lamp,シグナルランプ,信号灯,ไฟสัญญาณ (Signal Lamp)");
		translations.SetNamedTag("SIGLAMP_AUTO",          "AUTO,自動,自动,อัตโนมัติ");
		translations.SetNamedTag("SIGLAMP_ON",            "ON,点灯,打开,เปิด");
		translations.SetNamedTag("SIGLAMP_OFF",           "OFF,消灯,关闭,ปิด");
		translations.SetNamedTag("SIGLAMP_NA",            "N/A,N/A,N/A,ไม่รองรับ");
		translations.SetNamedTag("ACTIVE",            "ACTIVE,有効,有效,เปิดใช้งาน");
		translations.SetNamedTag("INACTIVE",          "INACTIVE,無効,无效,ปิดใช้งาน");
		translations.SetNamedTag("ENABLED",           "ENABLED,有効,已启用,เปิดใช้งาน");
		translations.SetNamedTag("DISABLED",          "DISABLED,無効,已禁用,ปิดใช้งาน");
		translations.SetNamedTag("SELECT_COASH",      "SELECT COASH,車両選択,选择车厢,เลือกตู้รถ");
		translations.SetNamedTag("CAR_NUMBERING",       "CAR NUMBERING,号車番号設定,车厢编号设置,การนัดลำดับคัน");
		translations.SetNamedTag("SYSTEM_LOG",        "SYSTEM LOG,システムログ,系统日志,บันทึกระบบ");
		translations.SetNamedTag("LOG_VIEWER",        "SYSTEM EVENT VIEWER,システムイベントビューア,系统事件查看器,บันทึกเหตุการณ์ระบบ");
		translations.SetNamedTag("VIEW_LOGS",         "VIEW LOGS,ログを見る,查看日志,ดูบันทึก");

		// -------------------------------------------------------
		// [6] SYSTEM LOG
		// -------------------------------------------------------
		translations.SetNamedTag("LOG_DOOR_L_OPEN",   "LEFT DOOR OPEN,左扉開,左门开,เปิดประตูด้านซ้าย");
		translations.SetNamedTag("LOG_DOOR_L_CLOSE",  "LEFT DOOR CLOSE,左扉閉,左门关,ปิดประตูด้านซ้าย");
		translations.SetNamedTag("LOG_DOOR_R_OPEN",   "RIGHT DOOR OPEN,右扉開,右门开,เปิดประตูด้านขวา");
		translations.SetNamedTag("LOG_DOOR_R_CLOSE",  "RIGHT DOOR CLOSE,右扉閉,右门关,ปิดประตูด้านขวา");
		translations.SetNamedTag("LOG_E1_START",      "ENG1 STARTING,ENG1始動中,引擎1启动中,กำลังสตาร์ทเครื่องยนต์ 1");
		translations.SetNamedTag("LOG_E1_READY",      "ENG1 READY,ENG1準備完了,引擎1就绪,เครื่องยนต์ 1 พร้อมทำงาน");
		translations.SetNamedTag("LOG_E1_STOP",       "ENG1 STOPPED,ENG1停止,引擎1停机,เครื่องยนต์ 1 ดับแล้ว");
		translations.SetNamedTag("LOG_E2_START",      "ENG2 STARTING,ENG2始動中,引擎2启动中,กำลังสตาร์ทเครื่องยนต์ 2");
		translations.SetNamedTag("LOG_E2_READY",      "ENG2 READY,ENG2準備完了,引擎2就绪,เครื่องยนต์ 2 พร้อมทำงาน");
		translations.SetNamedTag("LOG_E2_STOP",       "ENG2 STOPPED,ENG2停止,引擎2停机,เครื่องยนต์ 2 ดับแล้ว");
		translations.SetNamedTag("LOG_PARK_APPLY_ALL", "PARK BRAKE APPLY (ALL),パーキングブレーキ適用（全）,停放制动已施加（全部）,ใส่เบรกมือทั้งขบวน");
		translations.SetNamedTag("LOG_PARK_REL_ALL",   "PARK BRAKE RELEASE (ALL),パーキングブレーキ解除（全）,停放制动已缓解（全部）,ปลดเบรกมือทั้งขบวน");


		// Log Type Labels (used by AddLog)
		translations.SetNamedTag("LOG_FAULT",         "FAULT,障害,故障,ข้อผิดพลาด");
		translations.SetNamedTag("LOG_WARN",          "WARN,警告,警告,คำเตือน");
		translations.SetNamedTag("LOG_READY",         "READY,準備完了,就绪,พร้อม");
		translations.SetNamedTag("LOG_INFO",          "INFO,情報,信息,ข้อมูล");
		translations.SetNamedTag("LOG_DETAIL",        "Log Detail,ログ詳細,日志详情,รายละเอียดบันทึก");
		translations.SetNamedTag("OK",                "OK,OK,确定,ตกลง");

		// -------------------------------------------------------
		// [7] ANNOUNCEMENT SYSTEM PAGE
		// -------------------------------------------------------
		// Sub-tab labels (LCD page)
		translations.SetNamedTag("LCD_TAB_SIGNBOARD",  "SIGNBOARD,行先表示,目的地牌,ป้ายหน้าจอ");
		translations.SetNamedTag("LCD_TAB_ANNOUNCE",   "ANNOUNCEMENT,案内放送,广播公告,ระบบประกาศ");
		translations.SetNamedTag("LCD_TAB_CONFIG",     "LCD CONFIG,LCD設定,LCD配置,LCD Config (beta)");
		translations.SetNamedTag("LCD_CONFIG_TITLE",   "Manual LCD Text Configuration,LCDテキスト設定,手动LCD文本配置,ตั้งค่าข้อความ LCD (Manual)");
		translations.SetNamedTag("LCD_LINE",           "LINE,行,行,บรรทัด");

		// Mode labels
		translations.SetNamedTag("ANN_MODE",          "ANNOUNCEMENT MODE,案内モード,广播模式,โหมดประกาศ");
		translations.SetNamedTag("ANN_MANUAL",        "MANUAL,手動,手动,มือ");
		translations.SetNamedTag("ANN_AUTO",          "AUTO,自動,自动,อัตโนมัติ");
		translations.SetNamedTag("ANN_SOUND_LANG",    "SOUND LANGUAGE,放送言語,播报语言,ภาษาเสียงประกาศ");

		// Announcement list items
		translations.SetNamedTag("ANN_NONE",          "-- No Announcement --,-- 放送なし --,-- 无广播 --,-- ไม่มีประกาศ --");
		translations.SetNamedTag("ANN_01",            "Welcome Aboard,ご乗車ありがとうございます,欢迎乘车,ยินดีต้อนรับ");
		translations.SetNamedTag("ANN_02",            "Next Station,次の駅,下一站,สถานีต่อไป");
		translations.SetNamedTag("ANN_03",            "Approaching Station,まもなく到着,即将进站,กำลังเข้าสู่สถานี");
		translations.SetNamedTag("ANN_04",            "Doors Closing,ドアが閉まります,车门即将关闭,ประตูกำลังจะปิด");
		translations.SetNamedTag("ANN_05",            "Mind the Gap,足元にご注意ください,请注意站台间隙,ระวังช่องว่างชานชาลา");
		translations.SetNamedTag("ANN_06",            "Please Hold On,しっかりお掴まりください,请抓稳扶手,โปรดจับราว");
		translations.SetNamedTag("ANN_07",            "Priority Seats,優先席,优先席位,ที่นั่งสงวน");
		translations.SetNamedTag("ANN_08",            "No Smoking,禁煙,请勿吸烟,ห้ามสูบบุหรี่");
		translations.SetNamedTag("ANN_09",            "Prepare to Alight,降車準備,准备下车,เตรียมตัวลงจากรถ");
		translations.SetNamedTag("ANN_10",            "Thank You for Riding,ご乗車ありがとうございました,感谢您的乘坐,ขอบคุณที่ใช้บริการ");
		translations.SetNamedTag("ANN_11",            "Ticket Inspection,検札のお願い,验票,ตรวจตั๋ว");
		translations.SetNamedTag("ANN_12",            "Delay Announcement,遅延のお知らせ,延误通知,แจ้งความล่าช้า");

		// Scanner / Auto UI
		translations.SetNamedTag("ANN_SCAN_STATUS",   "SCAN STATUS,スキャン状況,扫描状态,สถานะสแกน");
		translations.SetNamedTag("ANN_SCANNING",      "Scanning...,スキャン中...,扫描中...,กำลังสแกน...");
		translations.SetNamedTag("ANN_NO_OBJECT",     "No station nearby,周辺に駅なし,附近无站点,ไม่พบสถานีในระยะ");
		translations.SetNamedTag("ANN_FOUND",         "Found:,検出:,检测到:,พบ:");
		translations.SetNamedTag("ANN_DIST",          "Distance,距離,距离,ระยะทาง");
		translations.SetNamedTag("ANN_SCAN_LOG",      "SCAN LOG,スキャンログ,扫描日志,บันทึกการสแกน");
		translations.SetNamedTag("ANN_PLAY",          "PLAY,再生,播放,เล่น");
		translations.SetNamedTag("ANN_STOP",          "STOP,停止,停止,หยุด");
		translations.SetNamedTag("ANN_SELECT",        "SELECT ANNOUNCEMENT,案内を選択,选择广播,เลือกประกาศ");
		translations.SetNamedTag("ANN_PLAYING",       "PLAYING,再生中,正在播放,กำลังเล่น");
		translations.SetNamedTag("ANN_IDLE",          "IDLE,待機,空闲,รอ");

		return translations;
	}

	public void InitTranslations(void) {
		m_translations = GetTranslations();
	}

	public string GetText(string tag) {
		if (!m_translations) InitTranslations();
		string raw = m_translations.GetNamedTag(tag);
		if (raw == "") return tag;

		string[] tokens = Str.Tokens(raw, ",");
		if (tokens.size() == 1) return raw;
		if (tokens.size() > language) return tokens[language];
		return tokens[0];
	}

	public string GetFormattedTime(float timeGame) {
		float gameTime = timeGame + 0.5f;
		if (gameTime >= 1.0f) gameTime = gameTime - 1.0f;
		int totalSeconds = (int)(gameTime * 86400.0f);
		int hours   = (totalSeconds / 3600) % 24;
		int minutes = (totalSeconds / 60) % 60;
		int seconds = totalSeconds % 60;
		string h = (string)hours;
		string m = (string)minutes; if (minutes < 10) m = "0" + m;
		string s = (string)seconds; if (seconds < 10) s = "0" + s;
		return h + ":" + m + ":" + s;
	}
};
