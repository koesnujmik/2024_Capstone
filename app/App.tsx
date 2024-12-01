import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RecipeSearch from './RecipeSearch';
import RecipeDetail from './RecipeDetail';
import CookMode from './CookMode';
import CustomText from './CustomText';

type Recipe = {
  name: string;
  image: string[];
  recipeIngredient: string[];
  recipeInstructions: { "@type": string; text: string; image?: string }[];
};

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'search' | 'details' | 'camera' | 'cookmode'>('search');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentScreen('details');
  };

  const handleTriggerCookMode = () => {
    setCurrentScreen('cookmode');
  };

  const handleCloseCamera = () => {
    setCurrentScreen('details');
  };

  const handleStartCamera = () => {
    setCurrentScreen('camera');
  };

  const handleBackToSearch = () => {
    setSelectedRecipe(null);
    setCurrentScreen('search');
  };

  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 0,
  },
});

export default App;
