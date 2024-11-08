// app/RecipeListScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Text, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { recipes } from '../../data/recipes';
import * as ScreenOrientation from 'expo-screen-orientation';

const RecipeListScreen = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const lockOrientation = async () => {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        };
        lockOrientation();
        return () => {
          ScreenOrientation.unlockAsync();
        };
    }, []);

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="요리, 재료를 검색해주세요."
                placeholderTextColor="#333"
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredRecipes}
                numColumns={2}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(tabs)/RecipeScreen', params: { index: recipes.indexOf(item).toString() } })}
                        style={styles.itemContainer}
                    >
                        <Image source={{ uri: item.image[0] }} style={styles.image} />
                        <Text style={styles.recipeName} numberOfLines={2} ellipsizeMode="tail">
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    searchBar: {
        height: 40,
        borderColor: '#888',
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 15,
        backgroundColor: '#f2f2f2',
    },
    itemContainer: {
        flex: 1,
        margin: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
        paddingVertical: 10,
        alignItems: 'center',
    },
    image: {
        width: Dimensions.get('window').width / 2 - 30,
        height: 120,
        borderRadius: 10,
    },
    recipeName: {
        marginTop: 8,
        textAlign: 'center', 
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        flexWrap: 'wrap',
    },
    listContainer: {
        paddingHorizontal: 10,
    },
});

export default RecipeListScreen;
