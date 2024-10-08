import React, { useRef, useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, StyleSheet, Text,KeyboardAvoidingView,Platform,TouchableWithoutFeedback, Keyboard} from 'react-native';
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
        const response = await fetch('http://192.168.0.93:8000/upload/photo', {
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

  // Handle text upload
  const uploadText = async () => {
    try {
      const response = await axios.post('http://192.168.0.93:8000/upload/text', { text });
      Alert.alert('Success', response.data.message);

      setText('');
    } catch (error: unknown) {
      if (error instanceof Error) {
        Alert.alert('Error', 'Failed to upload text: ' + error.message);
      } else {
        Alert.alert('Error', 'An unknown error occurred.');
      }
    }
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
      const response = await fetch('http://192.168.0.93:8000/upload/audio', {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
          {/* 카메라 화면이 아닐 때 */}
          {!cameraVisible && (
            <View style={styles.chatInputContainer}>
              <TextInput
                placeholder="Enter text"
                value={text}
                onChangeText={setText}
                style={styles.textInput}
              />
              <TouchableOpacity onPress={uploadText} style={styles.iconButton}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f2f2f2',
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
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
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
});

export default App;