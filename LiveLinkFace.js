/*
 
  author: Dead Flamingo
  version:1.0.0

  Chataigne module for Live Link Face iOS APP
  
*/

// Variables to track next update time
var nextStatusCheckTime = 0;

// Variables to track query responses
var lastBatteryQueryTime = 0;
var lastThermalQueryTime = 0;
var lastBatteryResponseTime = 0;
var lastThermalResponseTime = 0;
var responseTimeoutSeconds = 3; // Timeout period to consider app inactive if no response

// Variables for recording blink
var isRecording = false;
var recordingBlinkState = false;
var lastBlinkTime = 0;
var blinkInterval = 0.5; // Blink every 0.5 seconds

function init() {
  // Automatically add OS module if not exists
  var OSexist = root.modules.getItemWithName("OS");
  if (OSexist.name != "os") {
    script.log("Adding OS module automatically");
    var newOSModule = root.modules.addItem("OS");
  }

  // Set default OSC Send Target IP from OS module network info
  var osModule = root.modules.os;
  if (osModule && osModule.values.networkInfos && osModule.values.networkInfos.ip) {
    local.parameters.remoteControl.targetIP.set(osModule.values.networkInfos.ip.get());
  }

  // Set default values
  local.values.status.arSessionActive.set(0);
  local.values.status.recording.set(0);
  local.values.status.videoDisplay.set(1);
  local.values.status.appActive.set(0);
  
  // Enable logging and set module color
  local.logIncoming.set(1);
  local.logOutgoing.set(1);
  local.color.set(0xFF171717);
  
  // Set update rate to check for responses (increased for smoother blinking)
  script.setUpdateRate(10); // 10Hz for smoother blinking
  
  // Set initial update timestamp
  nextStatusCheckTime = util.getTime();
  
  // Initial status queries
  queryBattery();
  queryThermals();
}

function moduleParameterChanged(param) {
  // Process trigger parameters
  if (!param.isParameter()) {
    if (param.name == "setSubject") {
      setLiveLinkSubject();
    } else if (param.name == "setSlate") {
      setSlate();  
    } else if (param.name == "setTake") {
      setTake();
    } else if (param.name == "setSendTarget") {
      setOSCSendTarget();
    } else if (param.name == "applyTargets") {
      applyLiveLinkTargets();
    } else if (param.name == "clearAllTargets") {
      clearAllLiveLinkTargets();
    }
  }
}

function moduleValueChanged(value) {
  // Process trigger values
  if (!value.isParameter()) {
    if (value.name == "startARSession") {
      startARSession();
    } else if (value.name == "stopARSession") {
      stopARSession();
    } else if (value.name == "startStream") {
      startLiveLinkStream();
    } else if (value.name == "stopStream") {
      stopLiveLinkStream();
    } else if (value.name == "setSlate") {
      setSlate();
    } else if (value.name == "setTake") {
      setTake();
    } else if (value.name == "startRecording") {
      startRecording();
    } else if (value.name == "stopRecording") {
      stopRecording();
    } else if (value.name == "displayOn") {
      videoDisplayOn();
    } else if (value.name == "displayOff") {
      videoDisplayOff();
    } else if (value.name == "queryBattery") {
      queryBattery();
    } else if (value.name == "queryThermals") {
      queryThermals();
    } else if (value.name == "setSendTarget") {
      setOSCSendTarget();
    } else if (value.name == "applyTargets") {
      applyLiveLinkTargets();
    } else if (value.name == "clearAllTargets") {
      clearAllLiveLinkTargets();
    }
  }
}

// Function to set OSC send target
function setOSCSendTarget() {
  var ipAddress = local.parameters.remoteControl.targetIP.get();
  var port = local.parameters.remoteControl.targetPort.get();
  
  // Send OSC command to set send target
  local.send("/OSCSetSendTarget", ipAddress, port);
  
  // Optional: Log the action for debugging
  script.log("Setting OSC Send Target - IP: " + ipAddress + ", Port: " + port);
}

// Process incoming OSC messages from Live Link Face
function oscEvent(address, args) {
  var currentTime = util.getTime();
  
  if (address == "/OSCSetSendTargetConfirm") {
    // Optionally handle confirmation 
    script.log("OSC Send Target set successfully");
  } else if (address == "/ARSessionStartConfirm") {
    local.values.status.arSessionActive.set(1);
    script.log("AR Session started successfully");
    updateAppActiveStatus(true);
  } else if (address == "/ARSessionStopConfirm") {
    local.values.status.arSessionActive.set(0);
    script.log("AR Session stopped successfully");
    updateAppActiveStatus(true);
  } else if (address == "/Battery") {
    if (args.length > 0) {
      var batteryLevel = args[0];
      local.values.status.batteryLevel.set(batteryLevel * 100); // Convert to percentage
      lastBatteryResponseTime = currentTime;
      updateAppActiveStatus(true);
    }
  } else if (address == "/Thermals") {
    if (args.length > 0) {
      var thermalState = parseInt(args[0]);
      
      // Map thermal state values to colors:
      // 0 - Light Green
      // 1 - Dark Green
      // 2 - Yellow
      // 3 - Red
      var thermalColor = 0xffCCCCCC; // Default to grey
      
      if (thermalState === 0) {
        thermalColor = 0xff90EE90; // Light green (ARGB format)
      } else if (thermalState === 1) {
        thermalColor = 0xff006400; // Dark green
      } else if (thermalState === 2) {
        thermalColor = 0xffFFFF00; // Yellow
      } else if (thermalState === 3) {
        thermalColor = 0xffFF0000; // Red
      }
      
      local.values.status.thermalState.set(thermalColor);
      lastThermalResponseTime = currentTime;
      updateAppActiveStatus(true);
    }
  } else if (address == "/RecordStartConfirm") {
    if (args.length > 0) {
      isRecording = true;
      recordingBlinkState = true;
      local.values.status.recording.set(1);
      
      // Automatically increment the take number for the next recording
      var currentTake = local.parameters.liveLinkSettings.takeNumber.get();
      local.parameters.liveLinkSettings.takeNumber.set(currentTake + 1);
      
      // Update app active status since we received a response
      updateAppActiveStatus(true);
    }
  } else if (address == "/RecordStopConfirm") {
    if (args.length > 2) {
      isRecording = false;
      recordingBlinkState = false;
      local.values.status.recording.set(0);
      
      // Update app active status since we received a response
      updateAppActiveStatus(true);
    }
  } else if (address == "/AppActivated") {
    local.values.status.appActive.set(1);
    
    // If app is activated, request status updates
    queryBattery();
    queryThermals();
  } else if (address == "/AppDeactivated") {
    local.values.status.appActive.set(0);
  }
}

// Function to update app active status based on response timing
function updateAppActiveStatus(forceActive) {
  if (forceActive) {
    local.values.status.appActive.set(1);
    return;
  }
  
  var currentTime = util.getTime();
  
  // Check if we've received a response to our queries within the timeout period
  var batteryQueryActive = (lastBatteryQueryTime === 0) || 
                           (lastBatteryResponseTime > lastBatteryQueryTime) || 
                           (currentTime - lastBatteryQueryTime < responseTimeoutSeconds);
                           
  var thermalQueryActive = (lastThermalQueryTime === 0) ||
                           (lastThermalResponseTime > lastThermalQueryTime) ||
                           (currentTime - lastThermalQueryTime < responseTimeoutSeconds);
  
  // If we've sent queries and haven't received responses within the timeout, mark as inactive
  if (lastBatteryQueryTime > 0 && lastThermalQueryTime > 0) {
    var isActive = batteryQueryActive || thermalQueryActive;
    local.values.status.appActive.set(isActive ? 1 : 0);
  }
}

// Command callbacks

// AR Session commands
function startARSession() {
  local.send("/ARSessionStart");
  script.log("Starting AR Session...");
}

function stopARSession() {
  local.send("/ARSessionStop");
  script.log("Stopping AR Session...");
}

// Live Link Target management
function applyLiveLinkTargets() {
  script.log("Applying Live Link targets...");
  
  // First clear all existing targets
  clearAllLiveLinkTargets();
  
  // Add enabled targets (now 10 targets)
  for (var i = 1; i <= 10; i++) {
    var targetContainer = local.parameters.liveLinkSettings.targets["target" + i];
    if (targetContainer && targetContainer.enabled && targetContainer.enabled.get()) {
      var ipAddress = targetContainer.ipAddress.get();
      var port = targetContainer.port.get();
      
      if (ipAddress && ipAddress !== "") {
        local.send("/AddLiveLinkAddress", ipAddress, port);
        script.log("Added Live Link target " + i + ": " + ipAddress + ":" + port);
      }
    }
  }
}

function clearAllLiveLinkTargets() {
  local.send("/ClearAllLiveLinkAddresses");
  script.log("Cleared all Live Link targets");
}

// Connection commands
function setLiveLinkSubject() {
  var subjectName = local.parameters.liveLinkSettings.subjectName.get();
  local.send("/LiveLinkSubject", subjectName);
}

function startLiveLinkStream() {
  local.send("/LiveLinkStreamStart");
}

function stopLiveLinkStream() {
  local.send("/LiveLinkStreamStop");
}

// Device Status commands
function queryBattery() {
  local.send("/BatteryQuery");
  lastBatteryQueryTime = util.getTime();
}

function queryThermals() {
  local.send("/ThermalsQuery");
  lastThermalQueryTime = util.getTime();
}

// Recording commands
function setSlate() {
  var slateName = local.parameters.liveLinkSettings.slateName.get();
  local.send("/Slate", slateName);
}

function setTake() {
  var takeNumber = local.parameters.liveLinkSettings.takeNumber.get();
  local.send("/Take", takeNumber);
}

function startRecording() {
  var slateName = local.parameters.liveLinkSettings.slateName.get();
  var takeNumber = local.parameters.liveLinkSettings.takeNumber.get();
  local.send("/RecordStart", slateName, takeNumber);
  // Set recording status and start blinking
  isRecording = true;
  recordingBlinkState = true;
  local.values.status.recording.set(1);
}

function stopRecording() {
  local.send("/RecordStop");
  // Stop recording and blinking
  isRecording = false;
  recordingBlinkState = false;
  local.values.status.recording.set(0);
}

// Video Display commands
function videoDisplayOn() {
  local.send("/VideoDisplayOn");
  local.values.status.videoDisplay.set(1);
}

function videoDisplayOff() {
  local.send("/VideoDisplayOff");
  local.values.status.videoDisplay.set(0);
}

// Automatic update function - called at the frequency set by script.setUpdateRate()
function update(deltaTime) {
  var currentTime = util.getTime();
  
  // Handle recording indicator blinking
  if (isRecording) {
    if (currentTime - lastBlinkTime >= blinkInterval) {
      recordingBlinkState = !recordingBlinkState;
      local.values.status.recording.set(recordingBlinkState ? 1 : 0);
      lastBlinkTime = currentTime;
    }
  }
  
  // Check for query timeouts
  if (lastBatteryQueryTime > 0 && lastBatteryResponseTime < lastBatteryQueryTime && 
      currentTime - lastBatteryQueryTime >= responseTimeoutSeconds) {
    // No response to battery query within timeout
    updateAppActiveStatus();
  }
  
  if (lastThermalQueryTime > 0 && lastThermalResponseTime < lastThermalQueryTime && 
      currentTime - lastThermalQueryTime >= responseTimeoutSeconds) {
    // No response to thermal query within timeout
    updateAppActiveStatus();
  }
  
  // Check if it's time to send status queries (every 60 seconds)
  if (currentTime >= nextStatusCheckTime) {
    // Send queries regardless of app status
    queryBattery();
    queryThermals();
    
    // Schedule next update in 60 seconds (1 minute)
    nextStatusCheckTime = currentTime + 60;
  }
}