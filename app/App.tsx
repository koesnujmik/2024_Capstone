import React, { useState } from 'react';
import { View } from 'react-native';
import RecipeSearch from './RecipeSearch';
import RecipeDetail from './RecipeDetail';
import CookMode from './CookMode';

type Recipe = {
  name: string;
  image: string[];
  recipeIngredient: string[];
  recipeInstructions: { "@type": string; text: string; image?: string }[];
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'search' | 'details' | 'camera' | 'cookmode'>('search');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // 레시피 선택 시 상세 화면으로 전환
  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentScreen('details');
  };

  // 카메라 화면에서 요리 모드로 전환
  const handleTriggerCookMode = () => {
    console.log('Switching to CookMode');
    setCurrentScreen('cookmode');
    console.log('Current screen after update:', 'cookmode'); // 상태 업데이트 확인
  };

  // 카메라 화면 종료
  const handleCloseCamera = () => {
    setCurrentScreen('details');
  };

  // 상세 화면에서 카메라로 전환
  const handleStartCamera = () => {
    setCurrentScreen('camera');
  };

  // 검색 화면으로 돌아가기
  const handleBackToSearch = () => {
    setSelectedRecipe(null);
    setCurrentScreen('search');
  };

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'search' && (
        <RecipeSearch onRecipeSelect={handleRecipeSelect} />
      )}
      {currentScreen === 'details' && selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onBack={handleBackToSearch}
          onStartCamera={handleStartCamera}
        />
      )}
      {currentScreen === 'camera' && selectedRecipe && (
        <CookMode
          onClose={handleCloseCamera}
          onTriggerCookMode={handleTriggerCookMode}
          recipeName={selectedRecipe.name}
          ingredients={selectedRecipe.recipeIngredient}
          instructions={selectedRecipe.recipeInstructions} 
          startFromWakeWord={false}      
        />
      )}
    </View>
  );
};

export default App;
