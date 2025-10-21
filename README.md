# 🚀 Space Shooter (Arduino + p5.js + Tone.js)

A **space shooter game** built with **p5.js**, **Tone.js**, and **Arduino** integration!  
You control a spaceship using a **joystick** connected to an Arduino. Shoot falling asteroids, score points, and survive as long as you can!

---

## 🎮 Features
- **Arduino joystick control** for player movement  
- **Button-triggered shooting** (via joystick or external button)  
- **LED feedback** on firing  
- **Background music and sound effects** using **Tone.js**  
- **Animated asteroid enemies** loaded from a sprite sheet  
- **Scoring and lives system**  
- **Game start and restart functionality**

---

## 🧠 Tech Stack
- **p5.js** – Graphics, input, and game loop  
- **Tone.js** – Background music and sound effects  
- **Arduino** – Hardware joystick + button + LED  
- **Serial communication** – Data exchange between p5.js and Arduino  

---

## ⚙️ Setup Instructions

### 1. Hardware Setup
- Connect a **joystick** module to your **Arduino**:
  - `X-axis → A0`
  - `Y-axis → A1`
  - `Joystick button → D2`
  - `External button → D3` (optional)
  - `LED → D13` (optional feedback)
- Upload a simple Arduino sketch that sends data in the format:
