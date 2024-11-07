import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import AudioUpload from './AudioUpload';
import { recipes } from '../../data/recipes';
import styles from './styles';

const HandleCookMode = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(true);

  const { index } = useLocalSearchParams();
  console.log('Selected Recipe Index:', index);
  const recipeData = recipes[Number(index)];

  if (!recipeData) return null;

  const toggleIngredients = () => {
    setShowIngredients((prev) => !prev);
    setStepIndex(0);
  };

  const nextStep = () => {
    console.log("Current Step Index:", stepIndex); // 추가
    if (stepIndex < recipeData.recipeInstructions.length - 1) {
      setStepIndex(prevStepIndex => {
        console.log("Updating Step Index to:", prevStepIndex + 1); // 추가
        return prevStepIndex + 1;
      });
    } else {
      toggleIngredients(); // 마지막 단계 후에 창을 닫음
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleIngredients} style={styles.cookButton}>
        <Text style={styles.cookButtonText}>요리 시작하기</Text>
      </TouchableOpacity>

      {showIngredients && (
        <View style={styles.fullscreenContainer}>
          <View style={styles.ingredientsContainer}>
            <TouchableOpacity onPress={toggleIngredients} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            {stepIndex === 0 ? (
              <>
                <Text style={styles.stepTitle}>재료 목록</Text>
                {recipeData.recipeIngredient.map((ingredient, index) => (
                  <Text key={index} style={styles.ingredientText}>• {ingredient}</Text>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.stepTitle}>Step {stepIndex}</Text>
                <View style={styles.instructionContent2}>
                  <Image source={{ uri: recipeData.recipeInstructions[stepIndex - 1].image }} style={styles.stepImage} />
                  <Text style={styles.stepText}>{recipeData.recipeInstructions[stepIndex - 1].text}</Text>
                </View>
              </>
            )}
            <TouchableOpacity
              onPress={prevStep}
              style={[styles.navigationButton, styles.prevButton]}
              disabled={stepIndex === 1}
            >
              <Text style={styles.buttonText}>이전 단계</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={nextStep}
              style={[styles.navigationButton, styles.nextButton]}
              disabled={stepIndex >= recipeData.recipeInstructions.length}
            >
              <Text style={styles.buttonText}>다음 단계</Text>
            </TouchableOpacity>

            <View style={styles.container}>
              <AudioUpload nextStep={nextStep} />
            </View>
          </View>
        </View>
      )}
    </View>
);
};

export default HandleCookMode;
