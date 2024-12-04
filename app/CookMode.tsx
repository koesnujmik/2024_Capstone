import React, { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import NextStepWord from './NextStepWord'; // WakeWordScreen import
import RNFS from 'react-native-fs'; // 파일 시스템 모듈
import WakeWordScreen from './WakeWord';
import Record from './record';
import CustomText from './CustomText';

type CookModeProps = {
  onClose: () => void;
  onTriggerCookMode: () => void;
  recipeimage: string[];
  recipeName: string;
  ingredients: string[];
  instructions: { "@type": string; text: string; image?: string }[];
  startFromWakeWord: boolean;
};

const CookMode: React.FC<CookModeProps> = ({
  onClose,
  recipeimage,
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
  const [isCookComplete, setIsCookComplete] = useState(false); // 요리 완성 상태

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

    if (startFromWakeWord && currentStep <= instructions.length) {
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
  // Move to next step if possible
  const handleNextStep = () => {
    if (currentStep < instructions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCookComplete(true); // 마지막 단계 이후 요리 완성 상태로 전환
    }
  };

  // Move to previous step if possible
  const handlePreviousStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleCloseCookMode = () => {
    setCurrentStep(0);
    setIsCookComplete(false);
    onClose(); 
  };

  const cookModeStart = () => {
    console.log('Wake word detected!');
    setIsCookMode(true); // CookMode 활성화
    setCurrentStep(0);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <CustomText>Camera permissions are not granted.</CustomText>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <CustomText>Loading camera...</CustomText>
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
  
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <CustomText style={styles.backButtonText}> ← </CustomText>
      </TouchableOpacity>
  
      {isCookMode ? (
        isCookComplete ? (
          <View style={styles.cookCompleteContainer}>
            <CustomText style={styles.completeText}>요리를 완성하였습니다!</CustomText>
            <Image
              source={{ uri: recipeimage[1] }}
              style={styles.completeImage}
            />
            <TouchableOpacity style={styles.homeButton} onPress={handleCloseCookMode}>
              <CustomText style={styles.homeButtonText}>홈으로 돌아가기</CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cookModeContainer}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              {currentStep === 0 ? (
                <>
                  <CustomText style={styles.sectionTitle}>재료</CustomText>
                  <CustomText style={styles.ingredients}>
                    {ingredients.join('\n')}
                  </CustomText>
                </>
              ) : (
                <>
                  <CustomText style={styles.stepText}>
                    {`단계 ${currentStep}: ${instructions[currentStep - 1]?.text}`}
                  </CustomText>
                  {instructions[currentStep - 1]?.image && (
                    <Image
                      source={{ uri: instructions[currentStep - 1]?.image }}
                      style={styles.image}
                    />
                  )}
                </>
              )}
            </ScrollView>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, currentStep === 0 && styles.disabledButton]}
                onPress={handlePreviousStep}
                disabled={currentStep === 0}
              >
                <CustomText style={styles.buttonText}>이전 단계</CustomText>
              </TouchableOpacity>
              {currentStep === instructions.length ? (
                <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                  <CustomText style={styles.buttonText}>완성</CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                  <CustomText style={styles.buttonText}>다음 단계</CustomText>
                </TouchableOpacity>
              )}
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

          <Record/>
          </View>
        )
      ) : (
        <View style={styles.cameraModeContainer}>
          <CustomText style={styles.adjustmentText}>카메라 화면을 조정해주세요</CustomText>
          <NextStepWord onNextStepWordDetected={cookModeStart} />

          <View style={styles.buttonContainer}> 
            <TouchableOpacity
              style={styles.button}
              onPress={cookModeStart}
            >
              <CustomText style={styles.buttonText}>요리 시작</CustomText>
            </TouchableOpacity>              
          </View>
        </View>
      )}
    </View>
  );
}; 
  

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8EB',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,

  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B3B3B',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10
  },
  ingredients: {
    fontSize: 16,
    color: '#5A5A5A',
    lineHeight: 24,
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 100, // 버튼과 간격 확보
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  cameraModeContainer: {
    flex: 1, // Ensures the container takes up the entire screen space
    justifyContent: 'center', // Aligns its children vertically in the center
    alignItems: 'center', // Centers the content horizontally
    padding: 16,
  },
  adjustmentText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B3B3B',
    marginBottom: 20,
  },
  cookModeContainer: {
    flex: 1,
    justifyContent: 'flex-start', // 위쪽부터 시작
    alignItems: 'center',
    padding: 15,
  },
  stepText: {
    fontSize: 18,
    fontWeight: 'regular',
    color: '#3B3B3B',
    textAlign: 'center',
    marginVertical: 0,
  },
  image: {
    width: '50%', // 화면 너비의 90%로 확대
    height: undefined, // 비율 유지
    aspectRatio: 16 / 9, // 가로 비율을 더 길게 조정
    resizeMode: 'contain', // 잘리지 않게 유지
    alignSelf: 'center', // 가운데 정렬
    marginVertical: 10, // 상하 간격 추가
  },
  
  buttonContainer: {
    position: 'absolute',
    bottom: 10, // Keeps the button at the bottom of the screen
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#008009',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6347',
  },
  cookCompleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B3B3B',
    textAlign: 'center',
    marginBottom: 20,
  },
  completeImage: {
    width: '50%',
    height: undefined,
    aspectRatio: 16 / 9,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  homeButton: {
    backgroundColor: '#008009',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CookMode;

