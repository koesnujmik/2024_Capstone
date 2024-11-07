// app/RecipeListScreen.tsx
import React, { useState } from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, TextInput, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { recipes } from '../../data/recipes';

const RecipeListScreen = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // 검색 결과 필터링
    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChangeText={setSearchTerm}
            />
            <FlatList
                data={filteredRecipes}
                numColumns={2}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(tabs)/RecipeScreen', params: { index: recipes.indexOf(item).toString() } })}
                        style={styles.itemContainer}
                    >
                        <Image source={{ uri: item.image[0] }} style={styles.image} />
                        {/* 이름을 뒤에서 10글자로 제한 */}
                        <Text style={styles.recipeName}>
                            {item.name.length > 10 ? `...${item.name.slice(-10)}` : item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
    },
    searchBar: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    itemContainer: {
        alignItems: 'center', // 수평 중앙 정렬
        margin: 5,
    },
    image: {
        width: 150,
        height: 150,
        borderRadius: 10,
    },
    recipeName: {
        marginTop: 5, // 이미지와 이름 간의 여백
        textAlign: 'center', // 텍스트 중앙 정렬
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RecipeListScreen;
