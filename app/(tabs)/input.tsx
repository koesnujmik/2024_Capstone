import React, { useState, useRef } from 'react';
import { Button, View, Text, TextInput, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

export default function MediaRecorder() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();

  const cameraRef = useRef<CameraView | null>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');

  // Sequential permission requests to ensure all required permissions are granted.
  const requestPermissions = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!audioPermission?.granted) await requestAudioPermission();
    if (!mediaLibraryPermission?.granted) await requestMediaLibraryPermission();
  };

  // Ensure permissions are granted before rendering the camera view.
  if (!cameraPermission || !audioPermission || !mediaLibraryPermission) {
    return <View />; // Permissions are loading
  }

  if (!cameraPermission.granted || !audioPermission.granted || !mediaLibraryPermission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>We need your permission to use the camera, microphone, and media library.</Text>
        <Button onPress={requestPermissions} title="Grant Permissions" />
      </View>
    );
  }

  // Function to take a photo and save it to the media library.
  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo && photo.uri) {
        setPhotoUri(photo.uri);

        const fileName = `photo_${Date.now()}.jpg`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: photo.uri, to: fileUri });

        await MediaLibrary.createAssetAsync(fileUri);
        Alert.alert('Photo saved', `Photo has been saved at: ${fileUri}`);
      } else {
        Alert.alert('Photo capture failed', 'Failed to capture the photo.');
      }
    }
  };

  // Function to start video recording.
  const startRecordingVideo = async () => {
    if (cameraRef.current) {
      const video = await cameraRef.current.recordAsync();
      if (video && video.uri) {
        setVideoUri(video.uri);

        const fileName = `video_${Date.now()}.mp4`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: video.uri, to: fileUri });

        await MediaLibrary.createAssetAsync(fileUri);
        Alert.alert('Video saved', `Video has been saved at: ${fileUri}`);
      } else {
        Alert.alert('Video recording failed', 'Failed to record the video.');
      }
    }
  };

  // Function to stop video recording.
  const stopRecordingVideo = async () => {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
  };

  // Function to start audio recording.
  const startRecordingAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      Alert.alert('Error', 'Failed to start audio recording.');
    }
  };

  // Function to stop audio recording and save it to the media library.
  const stopRecordingAudio = async () => {
    try {
      await recording?.stopAndUnloadAsync();
      const uri = recording?.getURI();

      if (uri) {
        setAudioUri(uri);

        const fileName = `my_audio_${Date.now()}.mp3`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: fileUri });

        await MediaLibrary.createAssetAsync(fileUri);
        Alert.alert('Recording saved', `Recording has been saved as MP3 at: ${fileUri}`);
      }
      setRecording(null);
    } catch (error) {
      console.error('Error stopping audio recording:', error);
      Alert.alert('Error', 'Failed to stop audio recording.');
    }
  };

  // Function to save text input to a file.
  const saveTextToFile = async () => {
    try {
      const fileName = `my_text_${Date.now()}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, textInput);
      await MediaLibrary.createAssetAsync(fileUri);
      Alert.alert('Text saved', `Text has been saved at: ${fileUri}`);
    } catch (error) {
      console.error('Error saving text file:', error);
      Alert.alert('Error', 'Failed to save the text file.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <CameraView ref={cameraRef} style={{ width: 300, height: 400 }} facing={facing}>
        <Button title="Take Photo" onPress={takePhoto} />
        <Button title="Start Video Recording" onPress={startRecordingVideo} />
        <Button title="Stop Video Recording" onPress={stopRecordingVideo} />
      </CameraView>

      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecordingAudio : startRecordingAudio}
      />

      <TextInput
        style={{ height: 40, borderColor: 'blue', borderWidth: 1, width: '100%', marginTop: 20, color: 'white' }}
        placeholder="Enter text..."
        value={textInput}
        onChangeText={setTextInput}
      />
      <Button title="Save Text" onPress={saveTextToFile} />

      <Text>Saved Photo URI: {photoUri}</Text>
      <Text>Saved Video URI: {videoUri}</Text>
      <Text>Saved Audio URI: {audioUri}</Text>
    </View>
  );
}
