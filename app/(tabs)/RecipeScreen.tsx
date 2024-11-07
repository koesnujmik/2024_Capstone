import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { recipes } from '../../data/recipes';
import { useRouter } from 'expo-router';
import styles from './styles';

const { width } = Dimensions.get('window');

const RecipeScreen = () => {
  const router = useRouter();
  const { index } = useLocalSearchParams();
  const recipeData = recipes[Number(index)];

  if (!recipeData) return null;

  const [cameraVisible, setCameraVisible] = useState(false);

  return (
    <View style={styles.container}>
      {!cameraVisible && (
        <ScrollView>
          <Image source={{ uri: recipeData.image[0] }} style={styles.image} />

          <Text style={styles.title}>{recipeData.name}</Text>
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>재료</Text>
          <View style={styles.card}>
            {recipeData.recipeIngredient.map((ingredient, index) => (
              <Text key={index} style={styles.ingredientText}>• {ingredient}</Text>
            ))}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>조리 순서</Text>
          {recipeData.recipeInstructions.map((instruction, index) => (
            <View key={index} style={styles.instructionCard}>
              <Text style={styles.stepNumber}>Step {index + 1}</Text>
              <View style={styles.instructionContent1}>
                <Image source={{ uri: instruction.image }} style={styles.instructionImage} />
                <Text style={styles.instructionText}>{instruction.text}</Text>
              </View>
            </View>
          ))}

          <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity
              style={styles.cookmodeButton}
              onPress={() => router.push({ pathname: '/(tabs)/CameraScreen', params: { index: Number(index) } })} // 인덱스 값을 전달
            >
              <Text style={styles.cookButtonText}>요리하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default RecipeScreen;
