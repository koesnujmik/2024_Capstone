import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { PorcupineManager } from "@picovoice/porcupine-react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";

const Record: React.FC = () => {
  const accessKey = "JpFUWjMA4/HwbCr8dcB//n9/rcjsgb4fstZyd089hFvlF0SPM8+Dvw=="; // Porcupine Access Key
  const porcupineManagerRef = useRef<PorcupineManager | null>(null);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [isRecording, setIsRecording] = useState(false);
  const stopTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const requestAudioPermission = async () => {
      const permission =
        Platform.OS === "ios"
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await request(permission);

      if (result !== RESULTS.GRANTED) {
        Alert.alert("Permission Required", "Audio recording permission is required.");
        return false;
      }

      console.log("Audio recording permission granted.");
      return true;
    };

    const initializePorcupine = async () => {
      try {
        porcupineManagerRef.current = await PorcupineManager.fromKeywordPaths(
          accessKey,
          ["쿠키야_ko_android_v3_0_0.ppn"],
          () => {
            console.log("Keyword detected! Starting recording...");
            startRecording();
          },
          (error) => console.error("Porcupine error:", error),
          "resource/porcupine_params_ko.pv"
        );

        const didStart = await porcupineManagerRef.current.start();
        console.log("Porcupine started:", didStart);
      } catch (error) {
        console.error("Failed to initialize Porcupine:", error);
      }
    };

    const initialize = async () => {
      const hasPermission = await requestAudioPermission();
      if (hasPermission) {
        await initializePorcupine();
      }
    };

    initialize();

    return () => {
      if (porcupineManagerRef.current) {
        porcupineManagerRef.current.stop();
        porcupineManagerRef.current.delete();
      }
      if (stopTimeout.current) {
        clearTimeout(stopTimeout.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (isRecording) {
      console.warn("Recording already in progress. Ignoring startRecording.");
      return;
    }

    try {
      console.log("Start Recording");
      await audioRecorderPlayer.startRecorder();

      setIsRecording(true); // Update state to reflect recording status
      console.log("Recording started successfully.");

      // Automatically stop recording after 6 seconds
      stopTimeout.current = setTimeout(() => {
        console.log("Auto-stopping recording after 6 seconds...");
        stopRecording();
      }, 6000);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) {
      console.warn("No recording in progress. Ignoring stopRecording.");
      return;
    }

    try {
      console.log("Stop Recording");
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener(); // Clean up listener

      setIsRecording(false); // Reset state
      if (stopTimeout.current) {
        clearTimeout(stopTimeout.current); // Clear timeout
        stopTimeout.current = null;
      }

      console.log("Recording stopped successfully.");
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  return null; // No UI rendering required
};

export default Record;
