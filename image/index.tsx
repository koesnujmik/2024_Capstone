import React, { useRef, useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';

export default function HomeScreen() {
    const webviewRef = useRef<WebView | null>(null);
    const [htmlUri, setHtmlUri] = useState<string | null>(null);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);

    useEffect(() => {
        const loadHtmlFile = async () => {
            try {
                const asset = Asset.fromModule(require('../../assets/speech.html'));
                await asset.downloadAsync();
                setHtmlUri(asset.uri);
            } catch (error) {
                console.error('HTML 파일 로드 중 오류:', error);
            }
        };

        loadHtmlFile();
    }, []);

    const startListening = () => {
        console.log('음성 인식 시작 버튼이 눌렸습니다.');
        if (webviewRef.current) {
            webviewRef.current.injectJavaScript('startListening();');
        }
    };

    const handleMessage = async (event: WebViewMessageEvent) => {
        const message = event.nativeEvent.data;
        console.log('WebView에서 메시지 수신:', message);
        if (message === 'start-recording') {
            console.log('WebView에서 녹음 시작 요청 수신');
            await startRecording(); // 녹음 시작
        }
    };

    const startRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                console.error('녹음 권한이 필요합니다.');
                return;
            }

            const { recording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            console.log('녹음이 시작되었습니다.');
        } catch (error) {
            console.error('녹음 중 오류 발생:', error);
        }
    };

    const stopRecording = async () => {
        if (recording) {
            await recording.stopAndUnloadAsync();
            setRecording(null);
            console.log('녹음이 종료되었습니다.');
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Button title="음성 인식 시작" onPress={startListening} />
            {htmlUri ? (
                <WebView
                    ref={webviewRef}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    source={{ uri: htmlUri }}
                    onMessage={handleMessage}
                />
            ) : (
                <Text>로딩 중...</Text>
            )}
        </View>
    );
}
