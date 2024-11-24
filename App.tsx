import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, Platform } from "react-native";
import { PorcupineManager } from "@picovoice/porcupine-react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions"; // 권한 요청

const WakeWordScreen = () => {
  const [message, setMessage] = useState(""); // 화면에 표시될 메시지 상태
  const accessKey = "JpFUWjMA4/HwbCr8dcB//n9/rcjsgb4fstZyd089hFvlF0SPM8+Dvw=="; // Porcupine Access Key

  useEffect(() => {
    let porcupineManager: PorcupineManager | null = null;

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
        porcupineManager = await PorcupineManager.fromKeywordPaths(
          accessKey,
          ["쿠키야_ko_android_v3_0_0.ppn"], // '쿠키야' 키워드 파일 경로
          () => {
            console.log("쿠키야 detected!");
            setMessage("안녕"); // '안녕' 메시지를 화면에 출력
          },
          (error) => {
            console.error("Porcupine error:", error);
          },
          "resource/porcupine_params_ko.pv"
        );

        // Wake Word 감지 시작
        const didStart = await porcupineManager.start();
        console.log("Porcupine started:", didStart);
      } catch (error) {
        console.error("Failed to initialize Porcupine:", error);
      }
    };

    // 앱 로드 시 오디오 권한 요청
    requestAudioPermission();

    // 컴포넌트 언마운트 시 리소스 해제
    return () => {
      if (porcupineManager) {
        porcupineManager.stop();
        porcupineManager.delete();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  message: {
    fontSize: 24,
    color: "#333",
  },
});

export default WakeWordScreen;