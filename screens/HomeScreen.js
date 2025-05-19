import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import LottieView from 'lottie-react-native';
import { getWeatherByCity } from '../utils/weather';

export default function HomeScreen() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);
    setError('');
    try {
      const data = await getWeatherByCity(city);
      setWeather(data);
    } catch {
      setError('Could not fetch weather.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🌤️ Weather App</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter city name"
        value={city}
        onChangeText={setCity}
      />

      <TouchableOpacity style={styles.button} onPress={fetchWeather}>
        <Text style={styles.buttonText}>Get Weather</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#0cca35" style={{ marginTop: 20 }} />}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {weather && (
        <View style={styles.result}>
          <LottieView
            source={require('../assets/weather-animation.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.city}>{weather.name}</Text>
          <Text style={styles.temp}>{Math.round(weather.main.temp)}°C</Text>
          <Text style={styles.desc}>{weather.weather[0].description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#fff', flex: 1 },
  heading: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16 },
  button: { backgroundColor: '#0cca35', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  result: { alignItems: 'center', marginTop: 30 },
  city: { fontSize: 22, fontWeight: '600' },
  temp: { fontSize: 40, fontWeight: 'bold' },
  desc: { fontSize: 18, fontStyle: 'italic' },
  error: { color: 'red', marginTop: 10, textAlign: 'center' }
});
