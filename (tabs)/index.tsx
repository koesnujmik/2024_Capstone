import React, { useRef, useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, StyleSheet, Text,KeyboardAvoidingView,Platform,TouchableWithoutFeedback, Keyboard, ScrollView,SafeAreaView,StatusBar} from 'react-native';
import { CameraType, CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Audio } from 'expo-av';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const App = () => {
  // State variables for camera and audio
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [text, setText] = useState('');

  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [facing, setFacing] = useState<CameraType>('back'); // 카메라 방향 상태
  const [cameraVisible, setCameraVisible] = useState(false); // 카메라 보이기/숨기기 상태
  const cameraRef = useRef<CameraView | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string, text: string }[]>([]);

    // Handle camera permissions
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

    // Toggle between front and back camera
    const toggleCameraFacing = () => {
      setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
    };

    
    // Handle photo capture and upload
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
        const response = await fetch('http://10.0.2.2:8000/upload/photo', {
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
      setCameraVisible(!cameraVisible); // 카메라 뷰 토글
    };

  // FastAPI 서버로 질문을 보내고 답변을 받는 함수
  const sendQuestion = async () => {
    if (!question.trim()) return; // 빈 질문 방지

    // 새로운 대화 로그에 사용자 질문 추가
    setChatLog(prevChatLog => [...prevChatLog, { sender: 'user', text: question }]);
    
    try {
      const response = await fetch('http://10.0.2.2:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
        }),
      });

      const data = await response.json();

      // 서버 응답을 대화 로그에 추가
      setChatLog(prevChatLog => [...prevChatLog, { sender: 'bot', text: data.answer }]);
      
    } catch (error) {
      console.error('Error:', error);
      setChatLog(prevChatLog => [...prevChatLog, { sender: 'bot', text: 'Error connecting to the server' }]);
    }
    
    setQuestion(''); // 질문 초기화
  };

  // Handle audio recording and upload
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.granted) {
        const { recording } = await Audio.Recording.createAsync();
        setRecording(recording);
      } else {
        Alert.alert('Permission Denied', 'You need to allow audio recording permission.');
      }
    } catch (error:unknown) {
      if (error instanceof Error) {
        Alert.alert('Error', 'Failed to upload text: ' + error.message);
      } else {
        Alert.alert('Error', 'An unknown error occurred.');
      }
    }
  };

  const stopRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        uploadAudio(uri);
      } else {
        Alert.alert('Error', 'Failed to retrieve audio URI.');
      }
      setRecording(null);
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
      const response = await fetch('http://10.0.2.2:8000/upload/audio', {
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
            {/* 카메라 화면이 아닐 때 */}
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

                {/* 녹음 버튼 */}
                <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={styles.iconButton}>
                  <Ionicons name="mic" size={24} color="white" />
                </TouchableOpacity>

                {/* 카메라 버튼 */}
                <TouchableOpacity onPress={toggleCameraView} style={styles.iconButton}>
                  <Ionicons name="camera" size={24} color="white" />
                </TouchableOpacity>
            </View>
            </View>
            )} 

            {/* 카메라 화면이 보일 때 */}
            {cameraVisible && (
              <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef}
              >
                <View style={styles.buttonContainer}>
                  {/* 뒤로가기 버튼 */}
                  <TouchableOpacity style={styles.backButton} onPress={toggleCameraView}>
                    <Ionicons name="arrow-back" size={32} color="white" />
                  </TouchableOpacity>

                  {/* 카메라 전환 버튼 */}
                  <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                    <AntDesign name="retweet" size={44} color="black" />
                  </TouchableOpacity>

                  {/* 사진 촬영 버튼 */}
                  <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
                    <AntDesign name="camera" size={44} color="black" />
                  </TouchableOpacity>
                </View>
              </CameraView>
            )}
          
      </KeyboardAvoidingView>
      </View>  
  );
};

const styles = StyleSheet.create({
  container:{
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
    backgroundColor: '#007AFF', // 버튼 색상
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
    flexDirection: 'row', // 가로로 나란히 배치
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#f2f2f2',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1, // 입력란이 최대한 공간 차지
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
});

export default App;
