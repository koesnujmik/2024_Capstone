import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { PorcupineManager } from "@picovoice/porcupine-react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { request, PERMISSIONS, RESULTS } from "react-native-permissions";
import RNFS from "react-native-fs";

const Record: React.FC<{ onRecordingComplete: (filePath: string) => void }> = ({ onRecordingComplete }) => {
  const accessKey = "JpFUWjMA4/HwbCr8dcB//n9/rcjsgb4fstZyd089hFvlF0SPM8+Dvw=="; // Replace with your actual key
  const porcupineManagerRef = useRef<PorcupineManager | null>(null);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const [isRecording, setIsRecording] = useState(false);
  const stopTimeout = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

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
    const path = `${RNFS.DocumentDirectoryPath}/record_${Date.now()}.m4a`;
    console.log("Recording path:", path);
  
    if (isRecordingRef.current) {
      console.warn("Recording already in progress. Ignoring startRecording.");
      return;
    }
  
    try {
      console.log("Initializing recording...");
      const result = await audioRecorderPlayer.startRecorder(path);
  
      if (result) {
        console.log("Recorder started successfully at:", result);
        isRecordingRef.current = true;
        setIsRecording(true);
  
        stopTimeout.current = setTimeout(() => {
          console.log("Auto-stopping recording after 6 seconds...");
          if (isRecordingRef.current) {
            stopRecording();
          }
        }, 6000);
      } else {
        console.error("Recorder failed to start.");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    if (!isRecordingRef.current) {
      console.warn("No recording in progress. Ignoring stopRecording.");
      return;
    }

    try {
      console.log("Stopping recording...");
      const result = await audioRecorderPlayer.stopRecorder();

      if (result) {
        console.log("Recording stopped. File saved to:", result);

        // 녹음 완료 시 경로 전달
        onRecordingComplete(result);

        // (선택) FastAPI 서버로 업로드 유지 가능
        // await uploadAudio(result);
      } else {
        console.error("Failed to stop recording. No result returned.");
      }
    } catch (error) {
      console.error("Error while stopping recording:", error);
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (stopTimeout.current) {
        clearTimeout(stopTimeout.current);
        stopTimeout.current = null;
      }
    }
  };

  const uploadAudio = async (filePath: string) => {
    try {
      const fileName = filePath.split("/").pop();
  
      const formData = new FormData();
      formData.append("file", {
        uri: `file://${filePath}`,
        name: fileName || "recorded_audio.m4a",
        type: "audio/m4a",
      });
  
      const response = await fetch("http://192.168.0.93:8000/upload/", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log("Audio uploaded successfully:", data);
      } else {
        const errorText = await response.text();
        console.error("Failed to upload audio:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  return null; // No UI rendering required
};

export default Record;