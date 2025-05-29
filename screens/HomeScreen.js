import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import * as Location from "expo-location";
import { getWeatherByCoords, getForecastByCoords } from "../utils/weather";
import { isDayTime, getWeatherIcon } from "../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const fallbackLocation = {
  latitude: 40.7128, // New York
  longitude: -74.006,
};

const HomeScreen = ({ navigation, route }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [isDay, setIsDay] = useState(true);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastError, setForecastError] = useState(null);

  const fetchWeather = async () => {
    console.log("Starting fetchWeather");
    setLoading(true);
    setError(null);
    let coords = route.params?.location || null;

    console.log("Location from params:", coords);

    if (!coords) {
      console.log("Requesting location permissions");
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission status:", status);
      if (status !== "granted") {
        console.log(
          "Location permission not granted. Using fallback location."
        );
        coords = fallbackLocation;
      } else {
        try {
          console.log("Fetching current position");
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Lowest,
            timeout: 3000,
          });
          console.log("Raw location data:", location);
          coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          console.log("Current position:", coords);
        } catch (locError) {
          console.error("Location error:", locError.message);
          setError("Failed to get location. Using fallback location.");
          coords = fallbackLocation;
        }
      }
    }

    console.log("Fetching weather for coords:", coords);
    try {
      const response = await getWeatherByCoords(
        coords.latitude,
        coords.longitude
      );
      console.log("Weather API response:", response);
      if (response.success) {
        setWeather(response.data);
        setIsDay(isDayTime(response.data));
      } else {
        console.error("Weather API error:", response.error);
        setError(response.error || "Failed to fetch weather");
      }
    } catch (err) {
      console.error("Unexpected error:", err.message);
      setError("Unexpected error fetching weather");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }

    // Fetch forecast
    console.log("Starting fetchForecast for coords:", coords);
    setForecastLoading(true);
    setForecastError(null);
    try {
      const response = await getForecastByCoords(
        coords.latitude,
        coords.longitude
      );
      console.log("Forecast API response:", response);
      if (response.success) {
        setForecast(response.data);
      } else {
        console.error("Forecast API error:", response.error);
        setForecastError(response.error || "Failed to fetch forecast");
      }
    } catch (err) {
      console.error("Unexpected error:", err.message);
      setForecastError("Unexpected error fetching forecast");
    } finally {
      console.log("Setting forecast loading to false");
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [route.params?.location]);

  const renderForecastItem = ({ item }) => {
  // Create date object from timestamp
  const date = new Date(item.dt * 1000);
  
  // Get formatted date components
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayOfMonth = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  
  // Get weather condition
  const main = item.weather[0].main;
  
  // Calculate if it's day or night for this forecast time
  const isDay = isDayTime(item); // Assuming your weather data has sunrise/sunset info
  
  return (
    <View style={[styles.forecastCard, themeStyles.card]}>
      <Text style={[styles.forecastDay, themeStyles.text]}>
        {`${dayOfWeek} ${dayOfMonth}-${month}`}
      </Text>
      <Image
        source={getWeatherIcon(main, isDay)}
        style={styles.forecastIcon}
      />
      <Text style={[styles.forecastTemp, themeStyles.text]}>
        {Math.round(item.main.temp)}°C
      </Text>
      <Text style={themeStyles.text}>{main}</Text>
    </View>
  );
};

  const themeStyles = isDay ? lightStyles : darkStyles;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0cca35" />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  if (!weather || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error ||
            "Failed to load weather data. Please check your internet connection."}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWeather}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate("Search")}
        >
          <Text style={styles.searchButtonText}>Search for a City</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, themeStyles.background]}>
      <View style={styles.header}>
        <Text style={[styles.cityText, themeStyles.text]}>{weather.name}</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
          <Ionicons
            name="search-outline"
            size={24}
            color={isDay ? "#000" : "#fff"}
          />
        </TouchableOpacity>
      </View>
      <Image
        source={getWeatherIcon(weather.weather[0].main, isDay)}
        style={styles.icon}
      />
      <View style={styles.weatherBox}>
        <Text style={[styles.date, themeStyles.text]}>
          {new Date().toDateString()}
        </Text>
        <Text style={styles.temp}>{Math.round(weather.main.temp)}°</Text>
        <Text style={[styles.condition, themeStyles.text]}>
          {weather.weather[0].main}
        </Text>
        <View style={styles.details}>
          <Text style={themeStyles.text}>Wind: {weather.wind.speed} km/h</Text>
          <Text style={themeStyles.text}>Hum: {weather.main.humidity}%</Text>
        </View>
      </View>
      <View style={styles.forecastSection}>
        <Text style={[styles.forecastTitle, themeStyles.text]}>
          5-Day Forecast
        </Text>
        {forecastLoading ? (
          <ActivityIndicator size="small" color="#0cca35" />
        ) : forecastError ? (
          <Text style={styles.errorText}>{forecastError}</Text>
        ) : (
          <FlatList
            data={forecast}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderForecastItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.forecastList}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between', 
   paddingVertical: 10,
  },
  cityText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  icon: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginVertical: 20,
  },
  weatherBox: {
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
  },
  date: {
    fontSize: 16,
  },
  temp: {
    fontSize: 72,
    fontWeight: "300",
    marginVertical: 10,
    color: "#0cca35",
  },
  condition: {
    fontSize: 20,
    marginBottom: 10,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
  },
  forecastSection: {
    marginTop: 20,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  forecastList: {
    paddingVertical: 10,
  },
  forecastCard: {
    alignItems: "center",
    marginRight: 15,
    padding: 15,
    borderRadius: 12,
    width: 120,
  },
  forecastDay: {
    fontSize: 14,
    marginBottom: 5,
  },
  forecastIcon: {
    width: 50,
    height: 50,
    marginVertical: 5,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    marginBottom: 10,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0cca35",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  searchButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

const lightStyles = StyleSheet.create({
  background: {
    backgroundColor: "#f2f9ff",
  },
  card: {
    backgroundColor: "#fff",
  },
  text: {
    color: "#000",
  },
});

const darkStyles = StyleSheet.create({
  background: {
    backgroundColor: "#00172D",
  },
  card: {
    backgroundColor: "#09203f",
  },
  text: {
    color: "#fff",
  },
});

export default HomeScreen;
