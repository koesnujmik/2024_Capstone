import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import WakeWordScreen from "./Pico"; // Adjust path based on your project structure

type CookModeProps = {
  recipeName: string;
  ingredients: string[];
  instructions: { "@type": string; text: string; image?: string }[];
  onClose: () => void;
  startFromWakeWord: boolean; // Added prop to start from wake word
};

const CookMode: React.FC<CookModeProps> = ({ recipeName, ingredients, instructions, onClose, startFromWakeWord }) => {
  const [currentStep, setCurrentStep] = useState(0);  // Current cooking step

  // Move to next step if possible
  const handleNextStep = () => {
    console.log(`handleNextStep called. Current Step: ${currentStep}`);
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Move to previous step if possible
  const handlePreviousStep = () => {
    console.log(`handlePreviousStep called. Current Step: ${currentStep}`);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // If the wake word is detected, move to the next step only if it's not the last step
  useEffect(() => {
    console.log(`useEffect triggered. startFromWakeWord: ${startFromWakeWord}, Current Step: ${currentStep}`);
    if (startFromWakeWord && currentStep < instructions.length - 1) {
      handleNextStep();
    }
  }, [startFromWakeWord, currentStep, instructions.length]);

  return (
    <View style={styles.container}>
      <Text style={styles.recipeName}>{recipeName}</Text>
      <Text>Step {currentStep + 1}: {instructions[currentStep]?.text}</Text>

      {instructions[currentStep]?.image && (
        <Image source={{ uri: instructions[currentStep].image }} style={styles.image} />
      )}

      {/* Cooking step controls */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handlePreviousStep} disabled={currentStep === 0}>
          <Text style={styles.buttonText}>이전 단계</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleNextStep} disabled={currentStep === instructions.length - 1}>
          <Text style={styles.buttonText}>다음 단계</Text>
        </TouchableOpacity>
      </View>

      {/* Wake Word detection */}
      <WakeWordScreen onWakeWordDetected={handleNextStep} /> 

      {/* Close button */}
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
