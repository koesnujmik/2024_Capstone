import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const SILENCE_THRESHOLD = -80; // Silence threshold in dB
const SILENCE_DURATION = 2000; // Silence duration in milliseconds

interface AudioUploadProps {
  nextStep?: () => void; // nextStep is an optional function type
}

const AudioUpload: React.FC<AudioUploadProps> = ({ nextStep }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppedRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null); // Ref for success sound

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
  
      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      isStoppedRef.current = false;
  
      monitorRecording(recording);
  
      setTimeout(async () => {
        const status = await recording.getStatusAsync();
        if (status.metering === undefined) {
          console.warn('Metering is still undefined after starting recording');
        } else {
          console.log(`Initial dB: ${status.metering}`);
        }
      }, 500);
  
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (isStoppedRef.current) {
      console.log('Recording is already stopped.');
      return;
    }
  
    const currentRecording = recordingRef.current;
  
    if (!currentRecording) {
      console.log('Recording does not exist, cannot stop.');
      return;
    }
  
    console.log('Stopping recording..');
    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      console.log('Recording stopped and stored at', uri);
      
      Alert.alert('Recording Stopped', `Recording file saved at: ${uri}`);
  
      if (uri) {
        await uploadAudio(uri);
      } else {
        console.error('Recording URI is null. Cannot upload.');
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      isStoppedRef.current = true;
  
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
              const currentRecording = recordingRef.current;
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
        setTimeout(checkSilence, 500);
      }
    };

    const intervalId = setInterval(checkSilence, 100);
    return () => clearInterval(intervalId);
  };

  const uploadAudio = async (uri: string) => {
    const formData = new FormData();
    const response = await fetch(uri);
    const blob = await response.blob();

    const fileName = 'input.wav';

    formData.append('file', {
      uri,
      name: fileName,
      type: 'audio/wav',
    } as unknown as Blob);

    try {
      const uploadResponse = await fetch('http://ip:8000/upload/audio', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.ok) {
        Alert.alert('Success', 'Audio uploaded successfully.');
        console.log("Calling nextStep from AudioUpload"); // 추가
        if (nextStep) nextStep(); // Automatically call nextStep on success
      } else {
        const errorData = await uploadResponse.json();
        Alert.alert('Upload Failed', `Failed to upload audio: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload audio: ' + (error instanceof Error ? error.message : 'An unknown error occurred.'));
    }
  };


  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordButtonRecording]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Ionicons name="mic" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
  },
  recordButton: {
    backgroundColor: '#FF6347',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
  recordButtonRecording: {
    backgroundColor: '#FF4500',
  },
});

export default AudioUpload;