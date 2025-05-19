import axios from 'axios';

const API_KEY = 'b85b775fa6706577efee28a956b85cdb';

export const getWeatherByCity = async (city) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

  try {
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};
