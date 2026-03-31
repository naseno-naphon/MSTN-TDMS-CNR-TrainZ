# MSTN CNR - Technical Installation Guide 🛠️
**Detailed setup for Master Trains and Trailer Coaches (Consists)**

---

## 🏗️ Prerequisites
- **Minimum Trainz Version**: Trainz Simulator 2022 (Build 5.0) or higher.
- **Primary Dependency**: [MSTN CNR | Script Library-00](https://github.com/naseno-naphon/MSTN-TDMS-CNR-TrainZ) `<kuid:1144998:100064>`.

---

## 🚂 1. Master Vehicle Setup (Driver Cab)
To enable the DMI display in your locomotive or master power car, update its `config.txt`:

### **Script Settings:**
```txt
script                                  "cnr_dmi.gs"
class                                   "CNR_DMI_Display"
```

### **Script-Include Table**:
Ensure the master vehicle points to this library:
```txt
script-include-table
{
  cnr_lib                               <kuid:1144998:100064>
}
```

---

## 🚃 2. Trailer Coach Setup (Consist Data Feed)
For the DMI to display per-car data (Brakes, Doors, AC), each carriage in the consist must have the following properties in its `config.txt` and use the matching script:

### **Script Integration for Coaches**:
```txt
script                                  "cnr_pass_coach.gs"
class                                   "CNR_PassCoach"
```

### **Data Extension Tags**:
Add these within the `extensions` or `script-data` section to ensure the DMI can handshaking with the trailer:
```txt
extensions
{
  mstn-data
  {
    has_wc                              1     ; 0=No WC, 1=Has WC
    ac_default_temp                     25.0  ; Starting Temp (C)
    vcb_vcar                            1     ; Enable VCB monitoring
  }
}
```

---

## 🚪 3. Door & HUD Indicators
The DMI Door HUD tracks Left/Right state using the following naming convention in the carriage script:
- **Left Door**: `m_PSGdoorleft` (Must be a Boolean in the Soup).
- **Right Door**: `m_PSGdoorright` (Must be a Boolean in the Soup).

---

## 🚫 4. Finalizing for Submission (MUST READ)
When you are ready to upload to the **Download Station (DLS)**:
1. **Delete Documentation**: Remove `README.md`, `INSTALLATION.md`, and `LICENSE`.
2. **Delete Git**: Remove the `.git` folder.
3. **Submit**: Only then should you click **Submit Edit** in Trainz Content Manager.

---
**MSTN-TDMS-CNR-TrainZ System Integration**
