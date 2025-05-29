import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { getWeatherByCity } from '../utils/weather';
import { isDayTime } from '../utils/theme';

const SearchScreen = () => {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isDay, setIsDay] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigation = useNavigation();

  // Geoapify API key (replace with your key from https://www.geoapify.com/)
  const GEOAPIFY_API_KEY = 'b9262113cfe540c0975a6badc188fed8';

  // Load search history and last weather data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await AsyncStorage.getItem('searchHistory');
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
        const weatherData = await AsyncStorage.getItem('lastWeatherData');
        if (weatherData) {
          const parsedData = JSON.parse(weatherData);
          setIsDay(isDayTime(parsedData));
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  // Fetch city suggestions from Geoapify
  const fetchSuggestions = async (input) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/autocomplete`,
        {
          params: {
            text: input,
            type: 'city',
            format: 'json',
            apiKey: GEOAPIFY_API_KEY,
            limit: 5, // Limit to 5 suggestions
          },
        }
      );
      const cities = response.data.results.map((item) => ({
        city: item.city || item.name,
        country: item.country,
        lat: item.lat,
        lon: item.lon,
      }));
      setSuggestions(cities);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError('Failed to load city suggestions');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounced fetchSuggestions to limit API calls
  const debouncedFetchSuggestions = useCallback(
    debounce((input) => fetchSuggestions(input), 300),
    []
  );

  // Handle TextInput changes
  const handleInputChange = (text) => {
    setCity(text);
    setError(null);
    debouncedFetchSuggestions(text);
  };

  // Handle suggestion selection
  const handleSuggestionPress = (item) => {
    setCity(item.city);
    setShowSuggestions(false);
    setSuggestions([]);
    // Navigate directly with coordinates
    navigation.navigate('Home', {
      location: { latitude: item.lat, longitude: item.lon },
    });
    // Save to history
    saveToHistory(item.city, { lat: item.lat, lon: item.lon });
  };

  // Save city to search history and weather data
  const saveToHistory = async (cityName, coords, weatherData) => {
    try {
      const newEntry = { city: cityName, latitude: coords.lat, longitude: coords.lon };
      const updatedHistory = [
        newEntry,
        ...searchHistory.filter(
          (item) => item.city.toLowerCase() !== cityName.toLowerCase()
        ),
      ].slice(0, 10);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      if (weatherData) {
        await AsyncStorage.setItem('lastWeatherData', JSON.stringify(weatherData));
        setIsDay(isDayTime(weatherData));
      }
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  };

  const handleSearch = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const response = await getWeatherByCity(city.trim());
      if (response.success) {
        const { coord, name } = response.data;
        await saveToHistory(name, coord, response.data);
        navigation.navigate('Home', {
          location: { latitude: coord.lat, longitude: coord.lon },
        });
      } else {
        setError(response.error || 'City not found');
      }
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryItemPress = (item) => {
    navigation.navigate('Home', {
      location: { latitude: item.latitude, longitude: item.longitude },
    });
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, themeStyles.card]}
      onPress={() => handleSuggestionPress(item)}
    >
      <Text style={[styles.suggestionText, themeStyles.text]}>
        {item.city}, {item.country}
      </Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.historyItem, themeStyles.card]}
      onPress={() => handleHistoryItemPress(item)}
    >
      <Text style={[styles.historyText, themeStyles.text]}>{item.city}</Text>
    </TouchableOpacity>
  );

  const themeStyles = isDay ? lightStyles : darkStyles;

  return (
    <View style={[styles.container, themeStyles.background]}>
      <TextInput
        style={[styles.input, themeStyles.card]}
        placeholder="Enter city name (e.g., London)"
        placeholderTextColor={isDay ? '#999' : '#ccc'}
        value={city}
        onChangeText={handleInputChange}
        autoCapitalize="words"
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />
      {showSuggestions && suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderSuggestionItem}
          style={[styles.suggestionList, themeStyles.card]}
          keyboardShouldPersistTaps="handled"
        />
      )}
      {error && <Text style={[styles.errorText, themeStyles.errorText]}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSearch} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Search</Text>
        )}
      </TouchableOpacity>
      {searchHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={[styles.historyTitle, themeStyles.text]}>Previous Searches</Text>
          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.historyList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  suggestionList: {
    maxHeight: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0cca35',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  historyText: {
    fontSize: 16,
  },
});

const lightStyles = StyleSheet.create({
  background: {
    backgroundColor: '#f2f9ff',
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  text: {
    color: '#333',
  },
  errorText: {
    color: '#ff4444',
  },
});

const darkStyles = StyleSheet.create({
  background: {
    backgroundColor: '#00172D',
  },
  card: {
    backgroundColor: '#09203f',
    borderColor: '#555',
  },
  text: {
    color: '#fff',
  },
  errorText: {
    color: '#ff6666',
  },
});

export default SearchScreen;