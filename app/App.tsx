import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { recipes } from '../data/recipes';
import RecipeDetail from './RecipeDetail';

type Recipe = typeof recipes[0]; 

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = recipes.filter(recipe => recipe.name.includes(query));
      setFilteredRecipes(filtered);
    } else {
      setFilteredRecipes(recipes);
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity onPress={() => handleRecipePress(item)} style={styles.recipeContainer}>
      <Image source={{ uri: item.image[0] }} style={styles.image} />
      <Text style={styles.recipeName}>{item.name}</Text>
      <Text style={styles.ingredients}>{item.recipeIngredient.join(', ')}</Text>
    </TouchableOpacity>
  );

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="요리, 재료를 검색해주세요."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderRecipe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  recipeContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 10,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 5,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  ingredients: {
    marginTop: 5,
    color: '#666',
  },
});

export default App;
