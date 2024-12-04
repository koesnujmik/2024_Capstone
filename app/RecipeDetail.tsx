import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import CookMode from './CookMode';
import CustomText from './CustomText';

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
  };

  // 카메라 화면 렌더링
  if (showCamera) {
    return (
      <CookMode
        onClose={handleCloseCamera}
        onTriggerCookMode={handleTriggerCookMode}
        recipeimage={recipe.image}
        recipeName={recipe.name}
        ingredients={recipe.recipeIngredient}
        instructions={recipe.recipeInstructions}
        startFromWakeWord={false} 
         />
    );
  }

  return (
    <View style={styles.container}>
      {/* 항상 보이는 뒤로가기 버튼 */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <CustomText style={styles.backButtonText}> ← </CustomText>
      </TouchableOpacity>

      {/* ScrollView 내부 컨텐츠 */}
      <ScrollView style={styles.content}>
        <Image source={{ uri: recipe.image[1] }} style={styles.image} />
        <CustomText style={styles.recipeName}>{recipe.name}</CustomText>
        <CustomText style={styles.sectionTitle}>재료</CustomText>
        {recipe.recipeIngredient.map((ingredient, index) => (
          <CustomText key={index} style={styles.ingredient}>
            - {ingredient}
          </CustomText>
        ))}
        <CustomText style={styles.sectionTitle}>조리 과정</CustomText>
        {recipe.recipeInstructions.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <CustomText style={styles.stepText}>
              {index + 1}. {step.text}
            </CustomText>
            {step.image && (
              <Image source={{ uri: step.image }} style={styles.stepImage} />
            )}
          </View>
        ))}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cookButton} onPress={handleStartCooking}>
            <CustomText style={styles.cookButtonText}>요리하기</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8EB', // 밝은 배경색
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5A5A5A',
  },
  content: {
    flex: 1,
    marginTop: 50, // 뒤로가기 버튼 아래로 컨텐츠 이동
    padding: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  recipeName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#3B3B3B',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#444444',
    marginVertical: 12,
  },
  ingredient: {
    fontSize: 16,
    color: '#5A5A5A',
    lineHeight: 22,
    marginBottom: 8,
  },
  stepContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepText: {
    fontSize: 16,
    color: '#3B3B3B',
    lineHeight: 24,
  },
  stepImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonContainer: {
    marginTop: 10,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  cookButton: {
    backgroundColor: '#008009', // 짙은 녹색
    paddingVertical: 12,
    paddingHorizontal: 70,
    borderRadius: 50,
    alignItems: 'center',
  },
  cookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default RecipeDetail;
