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
};

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe }) => {
  const [showCookMode, setShowCookMode] = useState(false);
  const [startFromWakeWord, setStartFromWakeWord] = useState(false);

  const handleStartCooking = () => {
    setShowCookMode(true);
  };

  const handleCloseCookMode = () => {
    setShowCookMode(false);
  };




  if (showCookMode) {
    return (
      <CookMode
        recipeName={recipe.name}
        ingredients={recipe.recipeIngredient}
        instructions={recipe.recipeInstructions}
        onClose={handleCloseCookMode}
        startFromWakeWord={startFromWakeWord}
      />
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
