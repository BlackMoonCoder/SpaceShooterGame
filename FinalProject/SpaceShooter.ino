const int VRx = A0;
const int VRy = A1;
const int buttonPin = 2;
const int whiteLED = 13;
const int blueLED = 11;

String inputString = "";
bool lastButtonState = HIGH;
bool joystickPressed = false;
bool externalButtonPressed = false;

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(whiteLED, OUTPUT);
  pinMode(blueLED, OUTPUT);
  digitalWrite(whiteLED, LOW);
  digitalWrite(blueLED, LOW);
}

void loop() {
  // Handle incoming messages from p5.js
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      inputString.trim();
      if (inputString == "LED_ON") {
        digitalWrite(whiteLED, HIGH);
      } else if (inputString == "LED_OFF") {
        digitalWrite(whiteLED, LOW);
      }
      inputString = "";
    } else {
      inputString += inChar;
    }
  }

  // Indicate connection
  digitalWrite(blueLED, HIGH);

  // Read joystick
  int xVal = analogRead(VRx);
  int yVal = analogRead(VRy);

  // Read button
  bool currentButtonState = digitalRead(buttonPin);
  if (lastButtonState == HIGH && currentButtonState == LOW) {
    joystickPressed = !joystickPressed;
  }
  lastButtonState = currentButtonState;

  // Send joystick and button state to p5
  Serial.print(xVal);
  Serial.print(",");
  Serial.print(yVal);
  Serial.print(",");
  Serial.print(joystickPressed ? 1 : 0);
  Serial.print(",");
  Serial.println(externalButtonPressed ? 1 : 0);

  delay(50);
}
