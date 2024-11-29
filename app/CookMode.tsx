import React, { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import NextStepWord from './NextStepWord'; // WakeWordScreen import
import RNFS from 'react-native-fs'; // 파일 시스템 모듈
import WakeWordScreen from './WakeWord';
import Record from './record';

type CookModeProps = {
  onClose: () => void;
  onTriggerCookMode: () => void;
  recipeName: string;
  ingredients: string[];
  instructions: { "@type": string; text: string; image?: string }[];
  startFromWakeWord: boolean;
};

const CookMode: React.FC<CookModeProps> = ({
  onClose,
  recipeName,
  ingredients,
  instructions,
  startFromWakeWord,
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 현재 조리 단계
  const [filePath, setFilePath] = useState<string | null>(null); // 파일 경로 저장 상태
  const device = useCameraDevice('back');
  const [isCookMode, setIsCookMode] = useState(false); // CookMode 활성화 상태
  const cameraRef = useRef<Camera>(null); // 카메라 참조 생성

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();
      const storagePermission = await requestAudioPermission();

      if (
        cameraPermission === 'granted' &&
        microphonePermission === 'granted' &&
        storagePermission
      ) {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    })();

    if (startFromWakeWord && currentStep < instructions.length - 1) {
      handleNextStep();
    }
  }, [startFromWakeWord, currentStep, instructions.length]);

  const requestAudioPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'App needs access to your microphone to record audio',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Failed to request permission:', error);
      return false;
    }
  };

  const checkServerStatus = async () => {
    try {
      const response = await fetch("http://192.168.0.93:8000/upload/", { method: "HEAD" }); // 서버 IP와 포트를 설정
      if (response.ok) {
        console.log("Server is running.");
        return true;
      }
    } catch (error) {
      console.error("Server is not running:", error);
      Alert.alert("Error", "FastAPI 서버가 실행 중이 아닙니다.");
    }
    return false;
  };
  

  const takePhotoAndSave = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera is not ready.');
      return;
    }

    try {
      console.log('Attempting to take photo...');
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'auto',
      });

      console.log('Photo taken at:', photo.path);

      // 파일 저장 경로 설정
      const savePath = `${RNFS.DocumentDirectoryPath}/photo_${Date.now()}.jpg`;
      console.log('Saving photo to:', savePath);

      await RNFS.moveFile(photo.path, savePath);
      console.log('File moved successfully to:', savePath);

      // 상태 업데이트
      setFilePath(savePath);
      console.log('filePath updated to:', savePath);

      await uploadPhotoToServer(savePath);
    } catch (error) {
      console.error('Error during photo save:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const uploadPhotoToServer = async (filePath: string) => {
    const serverUrl = 'http://192.168.0.93:8000/upload/'; //본인 ip로 변경
    const fileName = filePath.split('/').pop();

    const formData = new FormData();
    formData.append('file', {
      uri: `file://${filePath}`, // 명시적으로 file:// 추가
      type: 'image/jpg',
      name: fileName,
    });

    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('File uploaded successfully:', result);
      } else {
        const error = await response.text();
        console.error('Upload failed with status:', response.status, error);
      }
    } catch (error) {
      console.error('Network request failed:', error);
    }
  };

  const handleRecordingComplete = (filePath: string) => {
    console.log("Recording completed. File saved at:", filePath);
    // 추가 작업: 파일 업로드 또는 저장 경로 처리
  };

  // Move to next step if possible
  const handleNextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Move to previous step if possible
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleWakeWordDetected = () => {
    console.log('Wake word detected!');
    setIsCookMode(true); // CookMode 활성화
    setCurrentStep(0);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Camera permissions are not granted.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    {/* Camera component always mounted but visibility managed */}
      <Camera
        style={!isCookMode ? StyleSheet.absoluteFill : { width: 0, height: 0 }}
        device={device}
        isActive={true}
        photo={true}
        ref={cameraRef}
        onInitialized={() => console.log('Camera initialized')}
        onError={(error) => console.error('Camera error:', error)}
      />

      {!isCookMode ? (
        <>
          <Text style={styles.adjustmentText}>카메라 화면을 조정해주세요</Text>

          <NextStepWord onNextStepWordDetected={handleWakeWordDetected} />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.cookModeContainer}>
          {/* Recipe Name */}
          <Text style={styles.recipeName}>{recipeName}</Text>

        {/* Current Step */}
        <Text style={styles.stepText}>
          Step {currentStep + 1}: {instructions[currentStep]?.text}
        </Text>

        {/* Current Step Image */}
        {instructions[currentStep]?.image && (
          <Image source={{ uri: instructions[currentStep].image }} style={styles.image} />
        )}

        {/* Cooking Step Controls */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, currentStep === 0 && styles.disabledButton]}
            onPress={handlePreviousStep}
            disabled={currentStep === 0}
          >
            <Text style={styles.buttonText}>이전 단계</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, currentStep === instructions.length - 1 && styles.disabledButton]}
            onPress={handleNextStep}
            disabled={currentStep === instructions.length - 1}
          >
            <Text style={styles.buttonText}>다음 단계</Text>
          </TouchableOpacity>
          </View>

          {/* Wake Word Detection */}
          <NextStepWord
            onNextStepWordDetected={() => {
              console.log("NextStep word detected!");
              handleNextStep();
            }}
          />

          <WakeWordScreen
            onWakeWordDetected={() => {
              console.log("Wake word detected! Calling takePhotoAndSave...");
              takePhotoAndSave();
            }}
          />

          <TouchableOpacity style={styles.closeButton} onPress={() => setIsCookMode(false)}>
            <Text style={styles.buttonText}>카메라로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      )}
      <Record />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  adjustmentText: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#ff6347',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  cookModeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white',
  },
  stepText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    color: 'white',
  },
  image: {
    width: '50%',
    height: 150,
    borderRadius: 8,
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  button: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ff6347',
    marginHorizontal: 100,
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default CookMode;