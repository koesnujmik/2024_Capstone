import React, { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import NextStepWord from './NextStepWord'; // WakeWordScreen import
import Sound from 'react-native-sound'; // 음성 출력 모듈
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
  const [timerValue, setTimerValue] = useState<number | null>(null);
  const [isTimerVisible, setIsTimerVisible] = useState(false); // 타이머 팝업 표시 여부
  const [remainingTime, setRemainingTime] = useState<number | null>(null); // 타이머 남은 시간
  const [audioFilePath, setAudioFilePath] = useState<string | null>(null);

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

      // Periodic update every 15 seconds
  const intervalId = setInterval(async () => {
    if (currentStep < instructions.length) {
      console.log('Sending current step and capturing photo...');

      if (cameraRef.current) {
        await takePhotoAndSave(String(currentStep));
      }
    } else {
      console.log('All steps completed, stopping interval.');
      clearInterval(intervalId);
    }
  }, 5000); // Execute every 15 seconds

  // Cleanup on unmount
  return () => clearInterval(intervalId);

  }, [startFromWakeWord, currentStep, instructions.length]);

  
  useEffect(() => {
    if (remainingTime !== null && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime && prevTime > 1) {
            return prevTime - 1;
          } else {
            clearInterval(timer);
            setIsTimerVisible(false);
            return null;
          }
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  useEffect(() => {
    if (audioFilePath && filePath) {
      // audioFilePath와 filePath 둘 다 준비되었을 때 업로드 실행
      rootfunction(String(currentStep));
    }
  }, [audioFilePath, filePath]);

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
  
 /* const fetchDemoResults = async () => {
    try {
      const response = await fetch('https://mzqtrgawbxztzmzd.tunnel-pt.elice.io/chat_final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        }),
      });

      const data = await response.json();
      console.log('Demo response:', data);

      // 다음 단계 여부 확인
      if (data.nextStep === true) {
        handleNextStep();
      }

      // 주의사항 처리
      if (data.caution && typeof data.caution === 'string') {
        playCautionAudio(data.caution);
      }

      // 타이머 처리
      if (data.timer && data.timer > 0) {
        setTimerValue(data.timer);
        setRemainingTime(data.timer); // 타이머 남은 시간 설정
        setIsTimerVisible(true);
      }

      // 답변 음성 처리
      if (data.responseAudio && typeof data.responseAudio === 'string') {
        playResponseAudio(data.responseAudio);
      }
    } catch (error) {
      console.error('Error fetching demo results:', error);
    }
  };*/

  const playCautionAudio = (audioFilePath: string) => {
    const sound = new Sound(audioFilePath, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load sound', error);
        return;
      }
      sound.play(() => {
        sound.release(); // 재생 완료 후 리소스 해제
      });
    });
  };

  const playResponseAudio = (audioFilePath: string) => {
    const sound = new Sound(audioFilePath, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load response sound', error);
        return;
      }
      sound.play(() => {
        sound.release(); // 재생 완료 후 리소스 해제
      });
    });
  };

  const takePhotoAndSave = async (step: string) => {
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
      console.log('filePath updated to:', filePath);

      await rootfunction(String(currentStep));
    } catch (error) {
      console.error('Error during photo save:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const rootfunction = async (currentstep: string) => {
    if (!filePath) {
      console.warn("No photo file to upload.");
      return;
    }
    
    console.log(audioFilePath);
    if (audioFilePath) {
      // 녹음 파일이 준비되기 전에 전송을 시도하면 안됨.
      // 녹음 완료 후 audioFilePath가 셋팅되었다는 가정 하에
      uploadAudioToServer(filePath, currentstep);
    } else {
      console.warn("No audio file to upload.");
      uploadPhotoToServer(filePath, currentstep);
    }
  };

  const uploadPhotoToServer = async (filePath: string, step: string) => {
    const serverUrl = 'https://mzqtrgawbxztzmzd.tunnel-pt.elice.io/chat_final_sec'; //본인 ip로 변경
    const fileName = filePath.split('/').pop();

    const formData = new FormData();
    formData.append('file', {
      uri: `file://${filePath}`, // 명시적으로 file:// 추가
      type: 'image/jpg',
      name: fileName,
    });

    formData.append('step', step);

    console.log(formData);

    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Demo response:', data);

      // 다음 단계 여부 확인
      if (data.nextStep === true) {
        handleNextStep();
      }

      // 주의사항 처리
      if (data.caution && typeof data.caution === 'string') {
        playCautionAudio(data.caution);
      }

      // 타이머 처리
      if (data.timer && data.timer > 0) {
        setTimerValue(data.timer);
        setRemainingTime(data.timer); // 타이머 남은 시간 설정
        setIsTimerVisible(true);
      }

    } catch (error) {
      console.error('Error fetching demo results:', error);
    }
  };

  const uploadAudioToServer = async (filePath: string, step: string) => {
    const serverUrl = 'https://mzqtrgawbxztzmzd.tunnel-pt.elice.io/chat_final'; //본인 ip로 변경
    const fileName = filePath.split('/').pop();

    const formData = new FormData();
    formData.append('file', {
      uri: `file://${filePath}`, // 명시적으로 file:// 추가
      type: 'image/jpg',
      name: fileName,
    });

    if (audioFilePath) {
      formData.append('audio', {
        uri: `file://${audioFilePath}`,
        type: 'audio/m4a',
        name: audioFilePath.split('/').pop() || 'recorded_audio.m4a',
      });
    }
  
    formData.append('step', step);

    console.log(formData);


    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Demo response:', data);

      // 다음 단계 여부 확인
      if (data.nextStep === true) {
        handleNextStep();
      }

      // 주의사항 처리
      if (data.caution && typeof data.caution === 'string') {
        playCautionAudio(data.caution);
      }

      // 타이머 처리
      if (data.timer && data.timer > 0) {
        setTimerValue(data.timer);
        setRemainingTime(data.timer); // 타이머 남은 시간 설정
        setIsTimerVisible(true);
      }

      const base64Data = data.responseAudio;

      // 파일 저장 경로 설정
      const path = `${RNFS.DocumentDirectoryPath}/output_${Date.now()}.mp3`; // React Native 로컬 폴더

      // 파일 쓰기 (Base64 데이터를 MP3 파일로 저장)
      await RNFS.writeFile(path, base64Data, "base64");
      Alert.alert("File saved successfully!", `Saved at: ${path}`);
      console.log("Audio file saved at:", path);

      // 답변 음성 처리
      if (path && typeof path === 'string') {
        playResponseAudio(path);
      }
    } catch (error) {
      console.error('Error fetching demo results:', error);
    }

      /*if (response.ok) {
        const result = await response.json();
        console.log('File uploaded successfully:', result);
      } else {
        const error = await response.text();
        console.error('Upload failed with status:', response.status, error);
      }
    } catch (error) {
      console.error('Network request failed:', error);
    }*/

    

  };

  // Move to next step if possible
  const handleNextStep = () => {
    if (currentStep < instructions.length) {
      const newStep = currentStep + 1
      setCurrentStep(newStep);
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

          <Record  onRecordingComplete={(filePath) => setAudioFilePath(filePath)}/>

          <WakeWordScreen
            onWakeWordDetected={async () => {
              console.log("Wake word detected! Calling takePhotoAndSave...");
              await takePhotoAndSave(String(currentStep)); // 사진 촬영 완료까지 대기
              rootfunction(String(currentStep)); // filePath가 확실히 업데이트된 후 호출
            }}
          />
          
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
