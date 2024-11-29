import React, { useEffect, useRef } from "react";
import { View, Alert, Platform } from "react-native";
import { PorcupineManager } from "@picovoice/porcupine-react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions"; // 권한 요청

type WakeWordScreenProps = {
  onWakeWordDetected: () => void; // Callback for handling wake word detection
};

const WakeWordScreen: React.FC<WakeWordScreenProps> = ({ onWakeWordDetected }) => {
  const accessKey = "JpFUWjMA4/HwbCr8dcB//n9/rcjsgb4fstZyd089hFvlF0SPM8+Dvw=="; // Porcupine Access Key
  const porcupineManagerRef = useRef<PorcupineManager | null>(null); // Using useRef to persist the instance

  useEffect(() => {
    // 마이크 권한 요청 함수
    const requestAudioPermission = async () => {
      try {
        const result = await request(
          Platform.OS === "ios"
            ? PERMISSIONS.IOS.MICROPHONE
            : PERMISSIONS.ANDROID.RECORD_AUDIO
        );

        if (result === RESULTS.GRANTED) {
          console.log("Audio permission granted.");
          initializePorcupine(); // 권한이 허용되면 Porcupine 초기화
        } else {
          Alert.alert("권한 필요", "오디오 권한이 필요합니다.");
        }
      } catch (error) {
        console.error("Failed to request audio permission:", error);
      }
    };

    // Porcupine 초기화
    const initializePorcupine = async () => {
      try {
        porcupineManagerRef.current = await PorcupineManager.fromKeywordPaths(
          accessKey,
          ["쿠키야_ko_android_v3_0_0.ppn"], // '쿠키야' 키워드 파일 경로
          () => {
            console.log("쿠키야 detected!");
            onWakeWordDetected(); // Trigger the callback function
          },
          (error) => {
            console.error("Porcupine error:", error);
          },
          "resource/porcupine_params_ko.pv"
        );

        // Wake Word 감지 시작
        const didStart = await porcupineManagerRef.current.start();
        console.log("Porcupine started:", didStart);
      } catch (error) {
        console.error("Failed to initialize Porcupine:", error);
      }
    };

    // 앱 로드 시 오디오 권한 요청
    requestAudioPermission();

    // 컴포넌트 언마운트 시 리소스 해제
    return () => {
      if (porcupineManagerRef.current) {
        porcupineManagerRef.current.stop();
        porcupineManagerRef.current.delete();
      }
    };
  }, [onWakeWordDetected]); // Dependency on onWakeWordDetected to avoid unnecessary effect executions

  return <View />;
};

export default WakeWordScreen;