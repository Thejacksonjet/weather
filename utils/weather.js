import axios from "axios";

const API_KEY = "b85b775fa6706577efee28a956b85cdb"; // Old key, works for /weather and /forecast

export const getWeatherByCity = async (city) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;
  try {
    console.log("Fetching weather for city:", city);
    const res = await axios.get(url);
    console.log("Weather by city response:", res.data);
    return { success: true, data: res.data };
  } catch (error) {
    console.error(
      "Error fetching weather by city:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch weather",
    };
  }
};

export const getWeatherByCoords = async (latitude, longitude) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
  try {
    console.log("Fetching weather for coords:", { latitude, longitude });
    const res = await axios.get(url);
    console.log("Weather by coords response:", res.data);
    return { success: true, data: res.data };
  } catch (error) {
    console.error(
      "Error fetching weather by coords:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch weather",
    };
  }
};

export const getForecastByCoords = async (latitude, longitude) => {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`;
  try {
    console.log("Fetching forecast for coords:", { latitude, longitude });
    const res = await axios.get(url);
    console.log("Forecast response:", res.data);
    // Filter to get one forecast per day (e.g., noon each day)
    const dailyForecast = res.data.list
      .filter((item) => item.dt_txt.includes("12:00:00")) // Noon each day
      .slice(0, 5); // Limit to 5 days
    return { success: true, data: dailyForecast };
  } catch (error) {
    console.error(
      "Error fetching forecast:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.message || "Failed to fetch forecast",
    };
  }
};
