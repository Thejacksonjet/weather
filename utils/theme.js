export const isDayTime = (weatherData, timestamp = null) => {
  // Get sunrise and sunset times from weather data (in UTC seconds)
  const sunrise = weatherData.sys?.sunrise || 0;
  const sunset = weatherData.sys?.sunset || 0;
  
  // Use provided timestamp (for forecast) or current UTC time
  const now = timestamp !== null ? timestamp : Math.floor(Date.now() / 1000);
  
  // Simply check if current time is between sunrise and sunset
  return now >= sunrise && now <= sunset;
};

export const getWeatherIcon = (main, isDay) => {
  const condition = main.toLowerCase();
  const time = isDay ? 'day' : 'night';
  const iconMap = {
    clear: {
      day: require('../assets/icons/clear-day.png'),
      night: require('../assets/icons/clear-night.png'),
    },
    clouds: {
      day: require('../assets/icons/cloudy-day.png'),
      night: require('../assets/icons/cloudy-night.png'),
    },
    rain: {
      day: require('../assets/icons/rain-day.png'),
      night: require('../assets/icons/rain-night.png'),
    },
    thunderstorm: {
      day: require('../assets/icons/thunder-day.png'),
      night: require('../assets/icons/thunder-night.png'),
    },
    drizzle: {
      day: require('../assets/icons/drizzle-day.png'),
      night: require('../assets/icons/drizzle-night.png'),
    },
  };
  
  return iconMap[condition]?.[time] || iconMap['clear'][time];
};