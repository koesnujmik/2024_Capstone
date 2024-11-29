import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Button } from 'react-native';
import CookMode from './CookMode';

type RecipeDetailProps = {
  recipe: {
    name: string;
    image: string[];
    recipeIngredient: string[];
    recipeInstructions: { "@type": string; text: string; image?: string }[];
  };
  onBack: () => void; // 뒤로가기
  onStartCamera: () => void;
};

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack }) => {
  const [showCamera, setShowCamera] = useState(false);

  const handleStartCooking = () => {
    setShowCamera(true); // 카메라 화면 표시
  };

  const handleCloseCamera = () => {
    setShowCamera(false); // RecipeDetail로 돌아오기
  };

  const handleTriggerCookMode = () => {
    console.log('Cook Mode Triggered!');
    // 요리 모드로 전환하는 동작 추가 가능
  };

  // 카메라 화면 렌더링
  if (showCamera) {
    return (
      <CookMode
        onClose={handleCloseCamera}
        onTriggerCookMode={handleTriggerCookMode}
        recipeName={recipe.name}
        ingredients={recipe.recipeIngredient}
        instructions={recipe.recipeInstructions} startFromWakeWord={false}      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: recipe.image[0] }} style={styles.image} />
      <Text style={styles.recipeName}>{recipe.name}</Text>
      <Text style={styles.sectionTitle}>재료</Text>
      {recipe.recipeIngredient.map((ingredient, index) => (
        <Text key={index} style={styles.ingredient}>{ingredient}</Text>
      ))}
      <Text style={styles.sectionTitle}>조리 과정</Text>
      {recipe.recipeInstructions.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <Text style={styles.stepText}>{index + 1}. {step.text}</Text>
          {step.image && (
            <Image source={{ uri: step.image }} style={styles.stepImage} />
          )}
        </View>
      ))}
      <View style={styles.buttonContainer}>
        <Button title="요리하기" onPress={handleStartCooking} color="#ff6347" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  ingredient: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  stepContainer: {
    marginVertical: 8,
  },
  stepText: {
    fontSize: 16,
    marginBottom: 5,
  },
  stepImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 5,
  },
  buttonContainer: {
    marginVertical: 20,
    paddingHorizontal: 40,
  },
});

export default RecipeDetail;
