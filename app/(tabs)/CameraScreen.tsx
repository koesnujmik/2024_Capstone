import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Button } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import styles from './styles';

const CameraScreen = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraVisible, setCameraVisible] = useState(true); // 카메라 화면 보이기
  const { index } = useLocalSearchParams();

  useEffect(() => {
    const lockOrientation = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); 
    };

    lockOrientation(); // 컴포넌트가 마운트될 때 가로모드로 잠금
    return () => {
      ScreenOrientation.unlockAsync(); // 컴포넌트 언마운트 시 잠금 해제
    };
  }, []);

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Button onPress={requestPermission} title="카메라 권한 허용하기" />
      </View>
    );
  }

  const handleGoToRecipeScreen = () => {
    // 카메라를 숨기고 세로 모드로 전환
    setCameraVisible(false);
    ScreenOrientation.unlockAsync(); // 화면 잠금 해제
    router.push({ pathname: '/(tabs)/RecipeScreen', params: { index } });
  };

  const handleGoToCookMode = () => {
    // 카메라를 숨기고 요리모드 화면으로 전환
    setCameraVisible(false);
    router.push({ pathname: '/(tabs)/HandleCookMode', params: { index } });
  };

  return (
    <View style={styles.container}>
      {/* 카메라 기능이 작동하지만 화면에 보이지 않도록 설정 */}
      <CameraView 
        style={[styles.camera, { opacity: cameraVisible ? 1 : 0 }]} 
        ref={cameraRef} 
        facing={facing}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoToRecipeScreen} 
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.adjustText}>카메라 화면을 조정해주세요</Text>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            style={styles.cookmodeButton}
            onPress={handleGoToCookMode}
          >
            <Text style={styles.cookButtonText}>요리모드</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

export default CameraScreen;
