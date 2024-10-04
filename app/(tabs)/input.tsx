import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

const App = () => {
  const [text, setText] = useState<string>('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null); // Use Audio.Recording directly

  const uploadText = async () => {
    try {
      const response = await axios.post('http://<컴퓨터 IP 주소>/upload/text', {
        text,
      }) as { data: { message: string } }; // Type assertion here
      const message = response.data.message || 'Text uploaded successfully!';
      Alert.alert('Success', message);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', 'Failed to upload text: ' + error.message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };
  

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.granted) {
        const { recording } = await Audio.Recording.createAsync();
        setRecording(recording);
      } else {
        Alert.alert('Permission Denied', 'You need to allow audio recording permission.');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', 'Failed to start recording: ' + error.message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };

  const stopRecording = async () => {
    if (recording) {
      setRecording(null);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); // This could be null if recording failed
      if (uri) {
        uploadAudio(uri); // Call uploadAudio only if uri is not null
      } else {
        Alert.alert('Error', 'Failed to retrieve audio URI.');
      }
    }
  };

  const uploadAudio = async (uri: string) => {
    const formData = new FormData();
    
    // Blob으로 변환하기 위해 fetch를 사용하여 파일 읽기
    const response = await fetch(uri);
    const blob = await response.blob();

    formData.append('file', {
        uri,
        name: 'audio.wav',  // 파일 이름 수정
        type: 'audio/wav',  // MIME 타입 확인
    } as unknown as Blob); // 타입 캐스팅

    try {
        const response = await fetch('http://<컴퓨터 IP 주소>/upload/audio', {  // 실제 IP 주소 사용
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
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Enter text"
        value={text}
        onChangeText={setText}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, color:'white' }}
      />
      <Button title="Upload Text" onPress={uploadText} />
      <Button title={recording ? 'Stop Recording' : 'Start Recording'} onPress={recording ? stopRecording : startRecording} />
    </View>
  );
};

export default App;