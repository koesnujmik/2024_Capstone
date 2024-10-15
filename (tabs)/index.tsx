import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { CameraType, CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Audio } from 'expo-av';
import { Ionicons,AntDesign } from '@expo/vector-icons';

const App = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string, text: string }[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppedRef = useRef(false);
  const SILENCE_THRESHOLD = -80; // 무음으로 간주할 데시벨 임계값
  const SILENCE_DURATION = 2000; // 무음 지속 시간 (밀리초)


  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);
  

  if (!permission) {
    return <View />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Button onPress={requestPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: false };
      const takedPhoto = (await cameraRef.current.takePictureAsync(options)) as CameraCapturedPicture;
      setPhoto(takedPhoto);
      await uploadPhoto(takedPhoto);
    }
  };

  const uploadPhoto = async (takedPhoto: CameraCapturedPicture) => {
    const formData = new FormData();
    
    const photoFile = new File(
        [await fetch(takedPhoto.uri).then(res => res.blob())],
        'photo.jpg', 
        { type: 'image/jpeg' } 
    );

    formData.append('file', photoFile);

    try {
        const response = await fetch('http://192.168.0.93:8000/upload/photo', {
            method: 'POST',
            body: formData,
        });

        // 응답 상태가 200 (성공)이 아닐 경우 오류 처리
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            throw new Error(`Upload failed with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Upload result:', result);
    } catch (error) {
        console.error('Error uploading photo:', error);
    }
};

  const toggleCameraView = () => {
    setCameraVisible(!cameraVisible);
  };

  const sendQuestion = async () => {
    if (!question.trim()) return;

    setChatLog(prevChatLog => [...prevChatLog, { sender: 'user', text: question }]);
    try {
      const response = await fetch('http://192.168.0.93:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: question
        }),
      });

      // 응답이 성공인지 확인
      if (!response.ok) {
          const errorText = await response.text();
          console.error('HTTP error:', response.status, errorText);
          setChatLog(prevChatLog => [...prevChatLog, { sender: 'bot', text: 'Error: ' + errorText }]);
          return;
    }

      const data = await response.json();
      setChatLog(prevChatLog => [...prevChatLog, { sender: 'bot', text: data.answer }]);
    } catch (error) {
      console.error('Error:', error);
      setChatLog(prevChatLog => [...prevChatLog, { sender: 'bot', text: 'Error connecting to the server' }]);
    }
    setQuestion('');
  };

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording; // recording을 ref에 저장
      setIsRecording(true);
      isStoppedRef.current = false;

      monitorRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (isStoppedRef.current) {
      console.log('Recording is already stopped.');
      return;
    }

    const currentRecording = recordingRef.current; // 현재 recording을 참조

    if (!currentRecording) {
      console.log('Recording does not exist, cannot stop.');
      return;
    }

    console.log('Stopping recording..');
    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      console.log('Recording stopped and stored at', uri);
      Alert.alert('녹음 종료', `녹음 파일이 저장되었습니다: ${uri}`);
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      // Recording 객체를 null로 설정하고, 중지 상태로 업데이트
      recordingRef.current = null; // recording을 null로 설정
      setIsRecording(false);
      isStoppedRef.current = true; // 중지 상태로 설정
      // 타이머를 정리합니다.
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }
  };

  const monitorRecording = (recording: Audio.Recording) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    const checkSilence = async () => {
      if (isStoppedRef.current) return;

      const status = await recording.getStatusAsync();
      if (status.metering !== undefined) {
        console.log(`Current dB: ${status.metering}`);

        if (status.metering < SILENCE_THRESHOLD) {
          console.log('Silence detected');
          if (!silenceTimeoutRef.current) {
            console.log('Starting silence timeout...');
            silenceTimeoutRef.current = setTimeout(() => {
              console.log('Silence duration exceeded, attempting to stop recording.');

              const currentRecording = recordingRef.current; // 현재 recording을 참조
              if (currentRecording) {
                stopRecording();
              } else {
                console.log('Recording does not exist, skipping stop.');
              }
            }, SILENCE_DURATION);
          }
        } else {
          console.log('Sound detected, resetting timer');
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        }
      } else {
        console.warn('Metering is undefined, checking again in next cycle');
      }
    };

    const intervalId = setInterval(checkSilence, 100);
    return () => clearInterval(intervalId);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}  // 필요에 따라 조정
      >
        {!cameraVisible && (
          <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.chatContainer}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}  
              keyboardShouldPersistTaps="handled" 
            >
              {chatLog.map((chat, index) => (
                <View key={index} style={chat.sender === 'user' ? styles.userMessage : styles.botMessage}>
                  <Text style={styles.chatText}>{chat.text}</Text>
                </View>
              ))}
            </ScrollView>
  
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask your question..."
                value={question}
                onChangeText={text => setQuestion(text)}
              />
              <TouchableOpacity onPress={sendQuestion} style={styles.iconButton}>
                <Text style={styles.buttonText}>Send</Text>
              </TouchableOpacity>
  
              <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={styles.iconButton}>
                <Ionicons name="mic" size={24} color="white" />
              </TouchableOpacity>
  
              <TouchableOpacity onPress={toggleCameraView} style={styles.iconButton}>
                <Ionicons name="camera" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
  
        {cameraVisible && (
          <View style={{ flex: 1 }}>
            <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={toggleCameraView}>
                  <Ionicons name="arrow-back" size={32} color="white" />
                </TouchableOpacity>
  
                <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                  <AntDesign name="retweet" size={44} color="black" />
                </TouchableOpacity>
  
                <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
                  <AntDesign name="camera" size={44} color="black" />
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );  
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  chatContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  iconButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 10,
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  button: {
    marginHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAEAEA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  chatText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#f2f2f2',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
}); 
  
export default App;
