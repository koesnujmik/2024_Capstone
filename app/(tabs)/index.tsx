import React, { useRef, useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraType, CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Audio } from 'expo-av';
import { AntDesign } from '@expo/vector-icons';
import axios from 'axios';

const App = () => {
  // State variables for camera and audio
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [text, setText] = useState<string>('');

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
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
      const response = await fetch('http://<IP주소>:8000/upload/photo', {
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

  // Handle text upload
  const uploadText = async () => {
    try {
      const response = await axios.post('http://<IP 주소>:8000/upload/text', { text });
      Alert.alert('Success', response.data.message);
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
      const response = await fetch('http://<IP 주소>:8000/upload/audio', {
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
      {/* Camera Section */}
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <AntDesign name="retweet" size={44} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
            <AntDesign name="camera" size={44} color="black" />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Text Input Section */}
      <TextInput
        placeholder="Enter text"
        value={text}
        onChangeText={setText}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, color: 'white' }}
      />
      <Button title="Upload Text" onPress={uploadText} />

      {/* Audio Recording Section */}
      <Button title={recording ? 'Stop Recording' : 'Start Recording'} onPress={recording ? stopRecording : startRecording} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    margin: 64,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'gray',
    borderRadius: 10,
    marginHorizontal: 10,
  },
});

export default App;
