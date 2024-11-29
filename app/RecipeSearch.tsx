import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { recipes } from '../data/recipes';

type Recipe = typeof recipes[0];

type RecipeSearchProps = {
  onRecipeSelect: (recipe: Recipe) => void; // 레시피 선택 시 부모로 전달할 콜백
};

const RecipeSearch: React.FC<RecipeSearchProps> = ({ onRecipeSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = recipes.filter(recipe => recipe.name.includes(query));
      setFilteredRecipes(filtered);
    } else {
      setFilteredRecipes(recipes);
    }
  };

  const renderRecipe = ({ item }: { item: Recipe }) => (
    <TouchableOpacity onPress={() => onRecipeSelect(item)} style={styles.recipeContainer}>
      <Image source={{ uri: item.image[0] }} style={styles.image} />
      <Text style={styles.recipeName}>{item.name}</Text>
      <Text style={styles.ingredients}>{item.recipeIngredient.join(', ')}</Text>
    </TouchableOpacity>
  );

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

export default RecipeSearch;
