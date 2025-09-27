let form = document.getElementById('form');

document.addEventListener("DOMContentLoaded", () => {
  handleWeatherRequest("London");
});

function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

form.addEventListener('submit', function(event) {
    event.preventDefault();
    let cityName = document.getElementById('inp').value.trim();

    if (cityName) {
        handleWeatherRequest(cityName);
    } else {
        alert("Please enter a city name");
    }
    document.getElementById('inp').value = '';
});

async function handleWeatherRequest(cityName = "New York") {
  try {
  showLoader()
    const coords = await getCoordinates(cityName);
    if (!coords) {
      console.error("Failed to fetch coordinates for city:", cityName);
      return;
    }

    const weatherData = await getWeather(coords.lat, coords.lng);
    if (!weatherData) {
      console.error("Failed to fetch weather data for coordinates:", coords);
      hideLoader();
      return;
    }

     renderWeather(coords, weatherData);
  } catch (error) {
    console.error("Error in handleWeatherRequest:", error);
  } finally {
    hideLoader();
  }
}

async function getCoordinates(cityName) {
    const apiKey = "f2d73aa48c524b35a83d7ded0a1117d1";
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(cityName)}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results.length > 0) {
            const { city, town, village, country } = data.results[0].components;
            const { lat, lng } = data.results[0].geometry;

            return { 
                lat, 
                lng, 
                city: city || town || village || cityName, 
                country 
            };
        } else {
            alert("No results found");
            return null;
        }
    } catch (error) {
        console.error("Error fetching geocoding data:", error);
    }
}

async function getWeather(lat, lng) {
    const apiKey = "d23e62863cd84b179dc22728252209";
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&days=7`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            alert(data.error.message);
            return null;
        }
        return data;
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

function renderWeather(coords, weatherData) {
  document.querySelector('.city-name').textContent = `${coords.city}`;
  document.querySelectorAll('.temp p').forEach(el => el.textContent = `${Math.round(weatherData.current.temp_c)}`);
  document.querySelectorAll(".wind p").forEach(el => el.textContent = `${weatherData.current.wind_kph} kph`);
  document.querySelectorAll(".moisture p").forEach(el => el.textContent = `${weatherData.current.humidity} %`);
  document.querySelectorAll(".weather-type").forEach(el => el.textContent = weatherData.current.condition.text);
  document.querySelector(".feels-like span").textContent = `${Math.round(weatherData.current.feelslike_c)}°`;

  hourlyForecast(weatherData);
  weaklyForecast(weatherData)

  let localtime = weatherData.location.localtime;
  let { formatDate, formatTime } = formatDateTime(localtime);

  const dateP = document.querySelector('.date p');
  if (dateP) dateP.textContent = formatDate;

  const timeP = document.querySelector('.time p');
  if (timeP) timeP.textContent = formatTime;
  document.querySelector("#greeting h2").textContent = greeting(weatherData.location.localtime);
}

function formatDateTime(localTime) {
  let [datePart, timePart] = localTime.split(" "); 

  const date = new Date(datePart);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formatDate = date.toLocaleDateString("en-US", options);

  let [hours, minutes] = timePart.split(":");
  hours = parseInt(hours, 10);
  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formatTime = `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;

  return { formatDate, formatTime };
}

function hourlyForecast(data) {
  const allHours = data.forecast.forecastday[0].hour; 
  let currentHour = new Date(data.location.localtime).getHours();

  let next6 = [];
  for (let i = 0; i < 6; i++) {
    let hourIndex = (currentHour + i) % 24;
    next6.push(allHours[hourIndex]);
  }

  const cards = document.querySelectorAll(".row3 .forecast-card");

  next6.forEach((h, i) => {
    if (!cards[i]) return;

    let [datePart, timePart] = h.time.split(" "); 
    let [hour, minute] = timePart.split(":");

    hour = parseInt(hour, 10);
    let ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; 
    let formattedTime = `${hour} ${ampm}`;

    cards[i].querySelector(".time").textContent = formattedTime;
    cards[i].querySelector(".temp p").textContent = Math.round(h.temp_c);
    cards[i].querySelector(".weather-type").textContent = h.condition.text;
  });

  return next6;
}

function weaklyForecast(data) {
  const cards = document.querySelectorAll(".weakly-card");
  const forecastDays = data.forecast.forecastday;

  forecastDays.forEach((day, i) => {
    if (!cards[i]) return;

    const date = new Date(day.date);
    let label;
    if (i === 0) {
      label = "Today";
    } else {
      const options = { weekday: "short" };
      label = date.toLocaleDateString("en-US", options);
    }

    cards[i].querySelector(".day").textContent = label;
    cards[i].querySelector(".temp p").textContent = Math.round(day.day.avgtemp_c);
    cards[i].querySelector(".weather-type").textContent = day.day.condition.text;
    
    if (cards[i].querySelector("img")) {
      cards[i].querySelector("img").src = `https:${day.day.condition.icon}`;
      cards[i].querySelector("img").alt = day.day.condition.text;
    }
  });
}

function greeting(localTime) {
  if (!localTime) return "Hello";

  let [_, timePart] = localTime.split(" ");
  let [hoursStr] = timePart.split(":");
  let hours = parseInt(hoursStr, 10);

  if (hours < 12) {
    return "Good Morning";
  } else if (hours < 18) {
    return "Good Afternoon";
  } else if (hours < 20) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
}