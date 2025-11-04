#include <WiFi.h>
#include <WebSocketsServer.h>
#include <Wire.h>
#include <MPU6050.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// WebSocket server on port 81
WebSocketsServer webSocket = WebSocketsServer(81);

// MPU6050 sensor
MPU6050 mpu;

// OLED Display settings (128x64)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Pin definitions
#define HEART_RATE_PIN 34
#define LED_PIN 2

// Sensor data variables
int16_t ax, ay, az;
int16_t gx, gy, gz;
float pitch = 0, roll = 0, yaw = 0;

// Heart rate variables
int hr = 70; // Current heart rate (BPM) - the main variable
int heartRateValue = 0;
int bpm = 0;
unsigned long lastBeatTime = 0;
int beatThreshold = 550;
int signal = 0;
float smoothedBPM = 70; // Initialize to 70
bool beatDetected = false;

// Display variables
int displayPage = 0;
unsigned long lastDisplayUpdate = 0;
const int displayUpdateInterval = 100; // 10Hz display update

// Timing
unsigned long lastUpdate = 0;
unsigned long lastHeartRateCalc = 0;
const int updateInterval = 50;
const int heartRateInterval = 20;

// Calibration offsets
int16_t axOffset = 0, ayOffset = 0, azOffset = 0;
int16_t gxOffset = 0, gyOffset = 0, gzOffset = 0;

// Exercise tracking
int repCount = 0;
String currentExercise = "Ready";
String feedback = "Start moving";

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_PIN, OUTPUT);
  pinMode(HEART_RATE_PIN, INPUT);
  
  // Initialize I2C
  Wire.begin(21, 22);
  
  // Initialize OLED Display
  if(!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    // Continue without display
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("AI Fitness");
    display.println("Tracker");
    display.println();
    display.println("Initializing...");
    display.display();
  }
  
  delay(1000);
  
  // Initialize MPU6050
  Serial.println("Initializing MPU6050...");
  mpu.initialize();
  
  if (mpu.testConnection()) {
    Serial.println("MPU6050 OK");
    displayMessage("MPU6050", "Connected", 1000);
  } else {
    Serial.println("MPU6050 FAIL");
    displayMessage("MPU6050", "Failed!", 2000);
  }
  
  mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);
  mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_250);
  
  // Calibrate
  displayMessage("Calibrating", "Keep still...", 0);
  calibrateMPU6050();
  displayMessage("Calibration", "Complete!", 1000);
  
  // Connect to WiFi
  displayMessage("WiFi", "Connecting...", 0);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    displayMessage("WiFi OK", WiFi.localIP().toString().c_str(), 2000);
  } else {
    Serial.println("\nWiFi failed");
    displayMessage("WiFi", "Failed!", 2000);
  }
  
  // Start WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  displayMessage("System", "Ready!", 1000);
  Serial.println("System Ready");
}

void loop() {
  webSocket.loop();
  
  unsigned long currentTime = millis();
  
  // Read heart rate
  if (currentTime - lastHeartRateCalc >= heartRateInterval) {
    lastHeartRateCalc = currentTime;
    readHeartRate();
  }
  
  // Update sensors and send data
  if (currentTime - lastUpdate >= updateInterval) {
    lastUpdate = currentTime;
    readMPU6050Data();
    calculateOrientation();
    sendSensorData();
  }
  
  // Update display
  if (currentTime - lastDisplayUpdate >= displayUpdateInterval) {
    lastDisplayUpdate = currentTime;
    updateDisplay();
  }
}

void calibrateMPU6050() {
  long axSum = 0, aySum = 0, azSum = 0;
  long gxSum = 0, gySum = 0, gzSum = 0;
  int samples = 200;
  
  for (int i = 0; i < samples; i++) {
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    axSum += ax;
    aySum += ay;
    azSum += az - 16384;
    gxSum += gx;
    gySum += gy;
    gzSum += gz;
    delay(5);
  }
  
  axOffset = axSum / samples;
  ayOffset = aySum / samples;
  azOffset = azSum / samples;
  gxOffset = gxSum / samples;
  gyOffset = gySum / samples;
  gzOffset = gzSum / samples;
}

void readMPU6050Data() {
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  ax -= axOffset;
  ay -= ayOffset;
  az -= azOffset;
  gx -= gxOffset;
  gy -= gyOffset;
  gz -= gzOffset;
}

void calculateOrientation() {
  float axG = ax / 16384.0;
  float ayG = ay / 16384.0;
  float azG = az / 16384.0;
  
  pitch = atan2(ayG, sqrt(axG * axG + azG * azG)) * 180.0 / PI;
  roll = atan2(-axG, azG) * 180.0 / PI;
  
  float gyroZ = gz / 131.0;
  yaw += gyroZ * (updateInterval / 1000.0);
  
  if (yaw > 180) yaw -= 360;
  if (yaw < -180) yaw += 360;
}

void readHeartRate() {
  signal = analogRead(HEART_RATE_PIN);
  
  static int peak = 512;
  static int trough = 512;
  static unsigned long lastValidBeat = 0;
  
  peak = max(peak * 0.95, (float)signal);
  trough = min(trough * 1.05, (float)signal);
  beatThreshold = (peak + trough) / 2;
  
  if (signal > beatThreshold && !beatDetected) {
    beatDetected = true;
    unsigned long currentTime = millis();
    
    if (lastBeatTime > 0) {
      unsigned long beatInterval = currentTime - lastBeatTime;
      if (beatInterval > 300 && beatInterval < 2000) {
        bpm = 60000 / beatInterval;
        if (smoothedBPM == 0) {
          smoothedBPM = bpm;
        } else {
          smoothedBPM = (smoothedBPM * 0.7) + (bpm * 0.3);
        }
        lastValidBeat = currentTime;
      }
    }
    lastBeatTime = currentTime;
    digitalWrite(LED_PIN, HIGH);
  } else if (signal < beatThreshold - 50) {
    beatDetected = false;
    digitalWrite(LED_PIN, LOW);
  }
  
  // If no valid beats detected for 5 seconds, gradually reduce BPM to resting rate
  if (millis() - lastValidBeat > 5000 && smoothedBPM > 0) {
    smoothedBPM = smoothedBPM * 0.99; // Slowly decrease
    if (smoothedBPM < 60) smoothedBPM = 60; // Don't go below 60 BPM
  }
  
  // Initialize smoothedBPM to a default resting rate if still 0
  if (smoothedBPM == 0) {
    smoothedBPM = 70; // Default resting heart rate
  }
  
  // Update hr variable (main heart rate variable)
  hr = (int)smoothedBPM;
}

void sendSensorData() {
  StaticJsonDocument<512> doc;
  
  doc["ax"] = ax / 16384.0;
  doc["ay"] = ay / 16384.0;
  doc["az"] = az / 16384.0;
  doc["gx"] = gx / 131.0;
  doc["gy"] = gy / 131.0;
  doc["gz"] = gz / 131.0;
  doc["pitch"] = round(pitch * 10) / 10.0;
  doc["roll"] = round(roll * 10) / 10.0;
  doc["yaw"] = round(yaw * 10) / 10.0;
  doc["heartRate"] = hr; // Use hr variable
  doc["pulse"] = signal;
  doc["beatDetected"] = beatDetected;
  doc["repCount"] = repCount;
  doc["exercise"] = currentExercise;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  webSocket.broadcastTXT(jsonString);
  
  // Debug output every 2 seconds
  static unsigned long lastDebug = 0;
  if (millis() - lastDebug > 2000) {
    lastDebug = millis();
    Serial.printf("💓 HR: %d BPM, Pulse: %d, Beat: %s, Clients: %d\n", 
                  hr, signal, beatDetected ? "YES" : "NO", webSocket.connectedClients());
  }
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Rotate through different display pages
  switch(displayPage % 3) {
    case 0:
      displayHeartRatePage();
      break;
    case 1:
      displayOrientationPage();
      break;
    case 2:
      displayExercisePage();
      break;
  }
  
  // Auto-rotate every 3 seconds
  static unsigned long lastPageChange = 0;
  if (millis() - lastPageChange > 3000) {
    lastPageChange = millis();
    displayPage++;
  }
  
  display.display();
}

void displayHeartRatePage() {
  // Heart icon
  display.setCursor(0, 0);
  display.println("HEART RATE");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Large BPM display
  display.setTextSize(3);
  display.setCursor(20, 20);
  display.print(hr); // Use hr variable
  
  display.setTextSize(1);
  display.setCursor(90, 35);
  display.print("BPM");
  
  // Beat indicator
  if (beatDetected) {
    display.fillCircle(64, 55, 5, SSD1306_WHITE);
  } else {
    display.drawCircle(64, 55, 5, SSD1306_WHITE);
  }
}

void displayOrientationPage() {
  display.setCursor(0, 0);
  display.println("ORIENTATION");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  display.setTextSize(1);
  
  // Pitch
  display.setCursor(0, 15);
  display.print("Pitch:");
  display.setCursor(60, 15);
  display.print(pitch, 1);
  display.print((char)247); // degree symbol
  
  // Roll
  display.setCursor(0, 30);
  display.print("Roll:");
  display.setCursor(60, 30);
  display.print(roll, 1);
  display.print((char)247);
  
  // Yaw
  display.setCursor(0, 45);
  display.print("Yaw:");
  display.setCursor(60, 45);
  display.print(yaw, 1);
  display.print((char)247);
}

void displayExercisePage() {
  display.setCursor(0, 0);
  display.println("EXERCISE");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Exercise name
  display.setTextSize(2);
  display.setCursor(0, 15);
  display.println(currentExercise);
  
  // Rep count
  display.setTextSize(1);
  display.setCursor(0, 35);
  display.print("Reps: ");
  display.setTextSize(2);
  display.print(repCount);
  
  // Connection status
  display.setTextSize(1);
  display.setCursor(0, 55);
  if (webSocket.connectedClients() > 0) {
    display.print("Connected");
  } else {
    display.print("No clients");
  }
}

void displayMessage(const char* line1, const char* line2, int delayMs) {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  
  display.setCursor(0, 10);
  display.println(line1);
  
  display.setTextSize(1);
  display.setCursor(0, 35);
  display.println(line2);
  
  display.display();
  
  if (delayMs > 0) {
    delay(delayMs);
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected\n", num);
      break;
      
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connected from %d.%d.%d.%d\n", 
                      num, ip[0], ip[1], ip[2], ip[3]);
        
        StaticJsonDocument<128> doc;
        doc["status"] = "connected";
        doc["device"] = "ESP32 Fitness Tracker";
        String response;
        serializeJson(doc, response);
        webSocket.sendTXT(num, response);
      }
      break;
      
    case WStype_TEXT:
      {
        String command = String((char*)payload);
        Serial.printf("Received: %s\n", command.c_str());
        
        // Parse JSON commands
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, command);
        
        if (!error) {
          if (doc.containsKey("command")) {
            String cmd = doc["command"].as<String>();
            
            if (cmd == "calibrate") {
              calibrateMPU6050();
              webSocket.sendTXT(num, "{\"status\":\"calibrated\"}");
              
            } else if (cmd == "reset_yaw") {
              yaw = 0;
              webSocket.sendTXT(num, "{\"status\":\"yaw_reset\"}");
              
            } else if (cmd == "reset_reps") {
              repCount = 0;
              webSocket.sendTXT(num, "{\"status\":\"reps_reset\"}");
              
            } else if (cmd == "set_exercise") {
              currentExercise = doc["exercise"].as<String>();
              webSocket.sendTXT(num, "{\"status\":\"exercise_set\"}");
            }
          }
        }
      }
      break;
  }
}

