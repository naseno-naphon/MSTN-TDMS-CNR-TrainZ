# MSTN-TDMS-CNR-TrainZ 🚄
**Modernized Train Data Management System (DMI) for Trainz Simulator 2022/2024**

[**🇹🇭 ภาษาไทย**](#thai) | [**🇺🇸 English**](#english) | [**🛠️ Installation**](#install) | [**✍️ Credits**](#credits)

---

<a name="thai"></a>
## 🇹🇭 ภาษาไทย (Thai Version)

### บทนำ
ระบบ **Driver Machine Interface (DMI)** รุ่นปรับปรุงล่าสุดสำหรับตู้รถไฟรุ่น MSTN CNR พัฒนาด้วยความละเอียดสูง 770x480 พิกเซล โดยใช้ภาษา **TrainzScript (.gs)** เพื่อตอบโจทย์การควบคุมขบวนรถที่ทันสมัย มีความแม่นยำทางเทคนิคสูง และรองรับการทำขบวนขนาดใหญ่

### คุณสมบัติที่โดดเด่น:
- **Unified Interface**: หน้าจอรวมเป็นผืนเดียว (Integrated Header) ตัดส่วนหัวที่เป็นขอบสีดำออก เพื่อให้ปุ่มควบคุมและสถานะ Speed/Time รวมอยู่ในระบบจอสัมผัส Blue Area ทั้งหมด
- **Brake System HUD (BAR Units)**: แสดงผลแรงดันลม (BP / BC / MR) ในหน่วย **Bar** พร้อมทศนิยม 2 ตำแหน่ง (เช่น 5.24 bar) ตรงตามมาตรฐานการทำขบวนสากล
- **Carriage HUD & Door Indicator**: 
    - ตารางขบวนรถรองรับการแสดงผล **9 ตู้รถไฟต่อหน้า** พร้อมระบบ Pagination `[ < ] [ > ]`
    - **Door Status HUD**: แต่ละตู้มีไฟสถานะแยกประตูซ้าย-ขวา (**L / R**)
    - **สีสถานะ**: สีเขียว (ปิด/ล็อคปกติ) และสีแดง (ประตูเปิดหรือขัดข้อง)
- **High-Fidelity 2-Column Sidebar**: แยกส่วนข้อมูลระบบไฟ (Line Voltage) และอุณหภูมิ (Outside Temp) ออกมาเป็นคอลัมน์แนวตั้งทางขวาสุด เพื่อความสะดวกในการติดตามสถานะระบบไฟฟ้าอย่างรวดเร็ว

---

<a name="english"></a>
## 🇺🇸 English Version

### Introduction
The **MSTN-TDMS-CNR-TrainZ** is a completely refactored Driver Machine Interface (DMI) designed for high-fidelity train simulation in Trainz Simulator. Built with a modular **TrainzScript (.gs)** architecture, it features a 770x480 touchscreen layout with professional-grade telemetry. Licensed under **GNU GPL v2**.

### Key Features:
- **Unified Screen Design**: All critical data (Destination, Speed, Time, Power) is integrated into a single cohesive "Steel Blue" panel, providing a seamless "One-Screen" experience.
- **Precision Braking Data**: Brake Pipe (BP), Brake Cylinder (BC), and Main Reservoir (MR) pressures are displayed in **Bar** units with 2-point decimal precision.
- **Carriage Diagram with Door HUD**:
    - Supports a high-density 9-car data grid with built-in pagination.
    - **Integrated Door HUD**: Individual **L (Left)** and **R (Right)** door status indicators for every car.

---

<a name="install"></a>
## 🛠️ Installation & Technical Specs
See the detailed [**Installation Guide**](INSTALLATION.md) for more info.
- **Script Engine**: TrainzScript (.gs)
- **Resolution**: 770 x 480 px
- **Telemetry Precision**: 2 Decimal Places (Bar/Temp)
- **Compatibility**: Trainz Simulator 2022 / TRS22+
- **License**: GNU General Public License v2 (GPL v2)

---

<a name="credits"></a>
## ✍️ Credits & Authorship
- **Software Logic & UI**: Naphon W.
- **Vehicle Modelling & Textures**: Voravit L.
- **Production**: Made by MSTN Production Team

---
**MSTN-TDMS-CNR-TrainZ** - *Modern UI, Professional Data.*
