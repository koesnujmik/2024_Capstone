import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

type CookModeProps = {
  recipeName: string;
  ingredients: string[];
  instructions: { "@type": string; text: string; image?: string }[];
  onClose: () => void;
  startFromWakeWord: boolean; // Added prop to start from wake word
};

const CookMode: React.FC<CookModeProps> = ({ recipeName, ingredients, instructions, onClose, startFromWakeWord }) => {
  const [currentStep, setCurrentStep] = useState(0);  // 현재 요리 단계

  // 레시피 단계 진행 (다음 단계)
  const handleNextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 레시피 단계 되돌리기 (이전 단계)
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // If started from wake word, directly go to the next step
  React.useEffect(() => {
    if (startFromWakeWord) {
      handleNextStep();
    }
  }, [startFromWakeWord]);

  return (
    <View style={styles.container}>
      <Text style={styles.recipeName}>{recipeName}</Text>
      <Text>단계 {currentStep + 1}: {instructions[currentStep]?.text}</Text>

      {instructions[currentStep]?.image && (
        <Image source={{ uri: instructions[currentStep].image }} style={styles.image} />
      )}

      {/* 요리 단계 조작 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePreviousStep} disabled={currentStep === 0}>
          <Text style={styles.buttonText}>이전 단계</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleNextStep} disabled={currentStep === instructions.length - 1}>
          <Text style={styles.buttonText}>다음 단계</Text>
        </TouchableOpacity>
      </View>

      {/* 종료 버튼 */}
      <TouchableOpacity onPress={onClose} style={styles.button}>
        <Text style={styles.buttonText}>종료</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    padding: 10,
    backgroundColor: '#ff6347',
    margin: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 20,
  },
});

export default CookMode;
