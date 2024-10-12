import React, { useRef, useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, StyleSheet, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, StatusBar } from 'react-native';
import { CameraType, CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Audio } from 'expo-av';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import axios from 'axios';

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
  const [isRecording, setIsRecording] = useState(false); // 녹음 상태 추가
  let silenceDuration = 0; // 무음 지속 시간
  const MAX_SILENCE_DURATION = 2000; // 2초

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
    formData.append('file', {
      uri: takedPhoto.uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    try {
      const response = await fetch('http://221.149.60.113:8000/upload/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
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
      const response = await fetch('http://221.149.60.113:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
        }),
      });

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
      const permission = await Audio.requestPermissionsAsync();
      if (permission.granted) {
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true); // 녹음 시작
        silenceDuration = 0; // 무음 지속 시간 초기화

        const silenceChecker = setInterval(async () => {
          const status = await recording.getStatusAsync();
          if (status.isRecording) {
            const currentSilence = await checkForSilence(recording);
            silenceDuration += currentSilence;

            if (silenceDuration >= MAX_SILENCE_DURATION) {
              clearInterval(silenceChecker);
              stopRecording(); // 자동 멈춤
            }
          } else {
            clearInterval(silenceChecker); // 녹음이 멈추면 체크도 중지
          }
        }, 100);
      } else {
        Alert.alert('Permission Denied', 'You need to allow audio recording permission.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording: ' + (error instanceof Error ? error.message : 'An unknown error occurred.'));
    }
  };

  const stopRecording = async () => {
    if (recording && isRecording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        await uploadAudio(uri);
      } else {
        Alert.alert('Error', 'Failed to retrieve audio URI.');
      }
      setRecording(null);
      setIsRecording(false); // 녹음 상태 초기화
    }
  };

  const checkForSilence = async (recording: Audio.Recording): Promise<number> => {
    const status = await recording.getStatusAsync();
    if (status.metering && status.metering < 50) { // 음량이 50 이하인 경우
      silenceDuration += 100; // 100ms 무음이 지속됨
      return 100; // 무음 상태
    } else {
      silenceDuration = 0; // 소리 감지 시 무음 지속 시간 초기화
      return 0; // 소리 감지
    }
  };


  const uploadAudio = async (uri: string) => {
    const formData = new FormData();
    const response = await fetch(uri);
    const blob = await response.blob();

    formData.append('file', {
      uri,
      name: 'audio.wav',
      type: 'audio/wav',
    } as unknown as Blob);

    try {
      const response = await fetch('http://221.149.60.113:8000/upload/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const result = await response.json();
      console.log('Upload result:', result);
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {!cameraVisible && (
          <View style={{ flex: 1 }}>
            <ScrollView style={styles.chatContainer}>
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
                  <AntDesign name="arrowleft" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
                  <Text style={{ color: 'white' }}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                  <Text style={{ color: 'white' }}>Flip Camera</Text>
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
