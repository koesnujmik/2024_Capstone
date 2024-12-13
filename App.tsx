import React, { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, View, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Modal } from 'react-native';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import NextStepWord from './NextStepWord';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
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
  const [currentStep, setCurrentStep] = useState(0);
  const [filePath, setFilePath] = useState<string | null>(null);  // 이미지 파일 경로
  const [audioFilePath, setAudioFilePath] = useState<string | null>(null); // 음성 파일 경로
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const [isCookMode, setIsCookMode] = useState(false);
  const [isCookComplete, setIsCookComplete] = useState(false);
  const [timerValue, setTimerValue] = useState<number | null>(null);
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  /**
   * 권한 요청 및 15초 주기 촬영
   */
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

    if (startFromWakeWord && currentStep < instructions.length) {
      handleNextStep();
    }

    // 15초 간격으로 Step 모드 전송
    const intervalId = setInterval(async () => {
      if (currentStep < instructions.length) {
        console.log('15초 주기: step 모드 전송...');
        await takePhotoAndSave(String(currentStep), "step");
      } else {
        console.log('All steps completed, stopping interval.');
        clearInterval(intervalId);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [startFromWakeWord, currentStep, instructions.length]);

  /**
   * 남은 타이머 관리
   */
  useEffect(() => {
    if (remainingTime && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev && prev > 1) return prev - 1;
          clearInterval(timer);
          setIsTimerVisible(false);
          return null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  /**
   * 오디오 권한
   */
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

  /**
   * 사진 촬영 -> filePath 업데이트 -> rootfunction 호출
   * @param mode 'step' | 'question'
   */
  const takePhotoAndSave = async (step: string, mode: 'step' | 'question') => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera is not ready.');
      return;
    }

    try {
      console.log(`[${mode}] Taking photo...`);
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: 'auto',
      });
      console.log('Photo path:', photo.path);

      const savePath = `${RNFS.DocumentDirectoryPath}/photo_${Date.now()}.jpg`;
      await RNFS.moveFile(photo.path, savePath);
      console.log(`File saved to: ${savePath}`);

      // 상태 업데이트 후 서버 전송
      setFilePath(savePath);
      rootfunction(savePath, String(currentStep), mode);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  /**
   * 서버 전송 함수
   * mode = 'step' => 이미지+현재단계만 전송
   * mode = 'question' => 질문 음성+이미지+단계 전송
   */
  const rootfunction = async (imagePath: string, step: string, mode: 'step' | 'question') => {
    const serverUrl = (mode === 'question')
      ? 'https://mzqtrgawbxztzmzd.tunnel-pt.elice.io/chat_final'    // 질문 처리 엔드포인트
      : 'https://mzqtrgawbxztzmzd.tunnel-pt.elice.io/chat_final_sec'; // step 처리 엔드포인트

    const fileName = imagePath.split('/').pop();
    const formData = new FormData();

    // 이미지
    formData.append('file', {
      uri: `file://${imagePath}`,
      type: 'image/jpg',
      name: fileName,
    });

    // 현재 단계
    formData.append('step', step);

    // 질문 모드인 경우에만 audio 추가
    if (mode === 'question' && audioFilePath) {
      const audioName = audioFilePath.split('/').pop() || 'recorded_audio.m4a';
      formData.append('audio', {
        uri: `file://${audioFilePath}`,
        type: 'audio/m4a',
        name: audioName,
      });
    }

    try {
      console.log(`[${mode}] Uploading FormData`, formData);
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log(`[${mode}] Response status:`, response.status);
      const data = await response.json();
      console.log(`[${mode}] Demo response:`, data);

      // 공통 응답 처리
      if (data.nextStep === true) {
        handleNextStep();
      }
      if (data.caution && typeof data.caution === 'string') {
        const base64Data = data.caution as string;
        const cautionpath = `${RNFS.DocumentDirectoryPath}/output_${Date.now()}.mp3`;
        await RNFS.writeFile(cautionpath, base64Data, 'base64');
        Alert.alert("File saved successfully!", `Saved at: ${cautionpath}`);
        playCautionAudio(cautionpath);
      }
      if (data.timer && data.timer > 0) {
        setIsTimerVisible(true);        
        setTimerValue(data.timer);
        setRemainingTime(data.timer);
      }

      // 질문 모드일 때 답변 음성 처리
      if (mode === 'question' && data.responseAudio) {
        const base64Data = data.responseAudio as string;
        const path = `${RNFS.DocumentDirectoryPath}/output_${Date.now()}.mp3`;
        await RNFS.writeFile(path, base64Data, 'base64');
        Alert.alert("File saved successfully!", `Saved at: ${path}`);
        playResponseAudio(path);
      }
    } catch (error) {
      console.error(`[${mode}] Error uploading:`, error);
    }
  };

  /**
   * 오디오/사진 업로드 후 단계 진행
   */
  const handleNextStep = () => {
    if (currentStep < instructions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCookComplete(true);
    }
  };

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
    setIsCookMode(true);
    setCurrentStep(0);
  };

  /**
   * 음성 재생 함수
   */
  const playCautionAudio = (filePath: string) => {
    const sound = new Sound(filePath, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load caution sound', error);
        return;
      }
      sound.play(() => sound.release());
    });
  };
  const playResponseAudio = (filePath: string) => {
    const sound = new Sound(filePath, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load response sound', error);
        return;
      }
      sound.play(() => sound.release());
    });
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

      {isTimerVisible && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={isTimerVisible}
          onRequestClose={() => setIsTimerVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.timerPopup}>
              <CustomText style={styles.timerText}>타이머: {remainingTime}초</CustomText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsTimerVisible(false)}
              >
                <CustomText style={styles.buttonText}>닫기</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {isCookMode ? (
        isCookComplete ? (
          <View style={styles.cookCompleteContainer}>
            <CustomText style={styles.completeText}>요리를 완성하였습니다!</CustomText>
            <Image source={{ uri: recipeimage[1] }} style={styles.completeImage} />
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

            {/* 음성 녹음 */}
            <Record onRecordingComplete={(filePath) => setAudioFilePath(filePath)} />

            {/* Wake Word Screen (질문 모드 전송) */}
            <WakeWordScreen
              onWakeWordDetected={async () => {
                if (!audioFilePath) {
                  Alert.alert("오류", "음성 파일이 아직 준비되지 않았습니다. 녹음을 완료해주세요!");
                  return;
                }
                console.log("Wake word detected! Sending question mode...");
                await takePhotoAndSave(String(currentStep), "question");
              }}
            />

            {/* NextStepWord: 음성 명령으로 단계만 이동 */}
            <NextStepWord
              onNextStepWordDetected={() => {
                console.log("NextStep word detected!");
                handleNextStep();
              }}
            />
          </View>
        )
      ) : (
        <View style={styles.cameraModeContainer}>
          <CustomText style={styles.adjustmentText}>카메라 화면을 조정해주세요</CustomText>
          <NextStepWord onNextStepWordDetected={cookModeStart} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={cookModeStart}>
              <CustomText style={styles.buttonText}>요리 시작</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8EB' },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  cameraModeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 15,
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B3B3B',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  ingredients: {
    fontSize: 16,
    color: '#5A5A5A',
    lineHeight: 24,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#3B3B3B',
    textAlign: 'center',
    marginVertical: 0,
  },
  image: {
    width: '50%',
    height: undefined,
    aspectRatio: 16 / 9,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginVertical: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
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
  disabledButton: { backgroundColor: '#CCC' },
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timerPopup: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 20,
    marginBottom: 15,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#008009',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default CookMode;
