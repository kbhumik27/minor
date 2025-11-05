/*
  Final: ESP32 Fitness Tracker + SpO2
  - MPU6050 (GY-521)
  - MAX30100 (SpO2 + Pulse)
  - Circular analog pulse sensor (for backup)
  - WiFi + WebSocket broadcast
*/

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>
#include "MAX30100_PulseOximeter.h"

// ======== CONFIG ========
const char* ssid = "Utkarsh's Galaxy A54 5G";
const char* password = "123456ab";

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C
#define I2C_SDA 21
#define I2C_SCL 22
#define PULSE_PIN 34
#define LED_PIN 2

// ======== OBJECTS ========
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_MPU6050 mpu;
WebSocketsServer webSocket(81);
PulseOximeter pox;

// ======== GLOBALS ========
float pitch_smooth = 0, roll_smooth = 0, pitch_offset = 0, roll_offset = 0, yaw = 0;
float ax_raw = 0, ay_raw = 0, az_raw = 0;
float gx_dps = 0, gy_dps = 0, gz_dps = 0;
const float alpha = 0.90f;

int sensorSignal = 0;
int threshold = 520;
bool pulseDetected = false;
unsigned long lastPeakTime = 0;
float bpm = 0, avgBPM = 0;
const int avgWindow = 8;
float bpmBuffer[avgWindow] = {0};
int bpmIndex = 0;

float spo2 = 0;   // SpO2 from MAX30100
float hr_spo2 = 0; // HR from MAX30100

unsigned long lastSend = 0, lastDisplayUpdate = 0;
const unsigned long sendInterval = 200;
const unsigned long displayInterval = 200;

// ======== PROTOTYPES ========
void displayIntro(const char*, const char*);
void calibrateMPU();
void readSensorsAndCompute();
void readPulse();
void updateDisplay();
void sendSensorData();
void webSocketEvent(uint8_t, WStype_t, uint8_t*, size_t);
void onBeatDetected();

// ======== SETUP ========
void setup() {
  Serial.begin(115200);
  Wire.begin(I2C_SDA, I2C_SCL);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // OLED init
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    for (;;);
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  displayIntro("AI Fitness Tracker", "Initializing...");

  // MPU6050 init
  if (!mpu.begin()) {
    displayIntro("MPU6050", "Connection Failed!");
    for (;;);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setGyroRange(MPU6050_RANGE_250_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  delay(200);

  displayIntro("Calibrating MPU", "Keep still...");
  calibrateMPU();

  // ===== MAX30100 INIT =====
  displayIntro("MAX30100", "Starting...");
  if (!pox.begin()) {
    Serial.println("MAX30100 not found - check wiring");
    displayIntro("MAX30100", "Not found!");
  } else {
    pox.setIRLedCurrent(MAX30100_LED_CURR_7_6MA);
    pox.setOnBeatDetectedCallback(onBeatDetected);
    Serial.println("MAX30100 initialized.");
  }

  // WiFi
  displayIntro("WiFi", "Connecting...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(250);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    displayIntro("WiFi Connected", WiFi.localIP().toString().c_str());
  } else {
    displayIntro("WiFi", "Failed!");
  }

  // WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  displayIntro("System Ready", "Streaming...");
  delay(800);
}

// ======== LOOP ========
void loop() {
  webSocket.loop();
  pox.update();

  hr_spo2 = pox.getHeartRate();
  spo2 = pox.getSpO2();

  readSensorsAndCompute();
  readPulse();

  if (millis() - lastSend >= sendInterval) {
    lastSend = millis();
    sendSensorData();
  }

  if (millis() - lastDisplayUpdate >= displayInterval) {
    lastDisplayUpdate = millis();
    updateDisplay();
  }
}

// ======== FUNCTIONS ========

void onBeatDetected() {
  digitalWrite(LED_PIN, HIGH);
  delay(20);
  digitalWrite(LED_PIN, LOW);
}

void displayIntro(const char* line1, const char* line2) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 10);
  display.println(line1);
  display.setCursor(0, 30);
  display.println(line2);
  display.display();
  delay(800);
}

void calibrateMPU() {
  const int N = 300;
  double ax = 0, ay = 0, az = 0;
  sensors_event_t a, g, temp;
  delay(300);
  for (int i = 0; i < N; ++i) {
    mpu.getEvent(&a, &g, &temp);
    ax += a.acceleration.x;
    ay += a.acceleration.y;
    az += a.acceleration.z;
    delay(5);
  }
  ax /= N; ay /= N; az /= N;
  pitch_offset = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0 / PI;
  roll_offset = atan2(ay, az) * 180.0 / PI;
  pitch_smooth = roll_smooth = 0.0;
}

void readSensorsAndCompute() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  ax_raw = a.acceleration.x / 9.80665f;
  ay_raw = a.acceleration.y / 9.80665f;
  az_raw = a.acceleration.z / 9.80665f;

  float pitch_raw = atan2(-a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z)) * 180.0f / PI;
  float roll_raw = atan2(a.acceleration.y, a.acceleration.z) * 180.0f / PI;
  float pitch_corr = pitch_raw - pitch_offset;
  float roll_corr = roll_raw - roll_offset;
  pitch_smooth = alpha * pitch_smooth + (1 - alpha) * pitch_corr;
  roll_smooth = alpha * roll_smooth + (1 - alpha) * roll_corr;
  gx_dps = g.gyro.x * 180.0f / PI;
  gy_dps = g.gyro.y * 180.0f / PI;
  gz_dps = g.gyro.z * 180.0f / PI;
  yaw += gz_dps * ((float)sendInterval / 1000.0f);
  if (yaw > 180.0f) yaw -= 360.0f;
  if (yaw < -180.0f) yaw += 360.0f;
}

void readPulse() {
  sensorSignal = analogRead(PULSE_PIN);
  unsigned long now = millis();
  if (sensorSignal > threshold && !pulseDetected) {
    pulseDetected = true;
    unsigned long interval = now - lastPeakTime;
    if (lastPeakTime != 0 && interval > 300 && interval < 2000) {
      float instantBPM = 60000.0f / (float)interval;
      bpmBuffer[bpmIndex] = instantBPM;
      bpmIndex = (bpmIndex + 1) % avgWindow;
      float sum = 0; int cnt = 0;
      for (int i = 0; i < avgWindow; ++i) {
        if (bpmBuffer[i] > 0.1f) { sum += bpmBuffer[i]; cnt++; }
      }
      if (cnt > 0) avgBPM = sum / cnt;
      bpm = instantBPM;
    }
    lastPeakTime = now;
  }
  if (sensorSignal < threshold - 30) pulseDetected = false;
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("AI Fitness Tracker");
  display.drawLine(0, 10, SCREEN_WIDTH - 1, 10, SSD1306_WHITE);

  display.setCursor(0, 14);
  display.print("Pitch: "); display.println(pitch_smooth, 1);
  display.setCursor(0, 26);
  display.print("Roll : "); display.println(roll_smooth, 1);
  display.setCursor(0, 38);
  display.print("BPM  : "); display.println((int)round(avgBPM));
  display.setCursor(0, 50);
  display.print("SpO2 : "); display.println(spo2, 1);
  display.display();
}

void sendSensorData() {
  StaticJsonDocument<512> doc;
  doc["pitch"] = round(pitch_smooth * 10.0f) / 10.0f;
  doc["roll"] = round(roll_smooth * 10.0f) / 10.0f;
  doc["yaw"] = round(yaw * 10.0f) / 10.0f;

  // ✅ Added corrected accel key names for dashboard
  doc["accel_x"] = ax_raw;
  doc["accel_y"] = ay_raw;
  doc["accel_z"] = az_raw;

  doc["gyro_x"] = gx_dps;
  doc["gyro_y"] = gy_dps;
  doc["gyro_z"] = gz_dps;

  // Pulse + SpO2
  doc["heartRate"] = (int)round(avgBPM);
  doc["spo2"] = spo2;
  doc["hr_spo2"] = hr_spo2;

  doc["wifi"] = (WiFi.status() == WL_CONNECTED) ? "ok" : "lost";
  doc["timestamp"] = millis() / 1000.0f;

  String out;
  serializeJson(doc, out);
  Serial.println(out);
  webSocket.broadcastTXT(out);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      webSocket.sendTXT(num, "{\"status\":\"connected\"}");
      break;
    default:
      break;
  }
}