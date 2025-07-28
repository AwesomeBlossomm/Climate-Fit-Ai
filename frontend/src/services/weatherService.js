import { GoogleGenerativeAI } from "@google/generative-ai";

const config = {
  weatherApiKey: import.meta.env.VITE_WEATHER_API_KEY,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
};

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const WEATHER_API_KEY = config.weatherApiKey;

export const geocodeAddress = async (address) => {
  try {
    const PHILIPPINES_BOUNDS = {
      lat: { min: 4.5, max: 21.5 },
      lon: { min: 116.0, max: 127.0 },
    };

    // Function to validate if coordinates are within Philippines
    const isInPhilippines = (lat, lon) => {
      return (
        lat >= PHILIPPINES_BOUNDS.lat.min &&
        lat <= PHILIPPINES_BOUNDS.lat.max &&
        lon >= PHILIPPINES_BOUNDS.lon.min &&
        lon <= PHILIPPINES_BOUNDS.lon.max
      );
    };

    // Method 1: Try with postal code if available (most accurate)
    if (address.postal_code) {
      try {
        const url = `https://api.openweathermap.org/geo/1.0/zip?zip=${address.postal_code},PH&appid=${WEATHER_API_KEY}`;
        console.log("Method 1: Trying postal code geocoding:", url);

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log("Postal code geocoding raw response:", data);

          // Validate coordinates are in Philippines
          if (!isInPhilippines(data.lat, data.lon)) {
            console.warn(
              `⚠️ Postal code returned coordinates outside Philippines: ${data.lat}, ${data.lon}`
            );
          } else {
            // Verify the geocoded location matches expected city
            if (data.name && address.city) {
              const geocodedCity = data.name.toLowerCase();
              const expectedCity = address.city.toLowerCase();
              console.log(
                `Verifying geocoded city: ${geocodedCity} vs expected: ${expectedCity}`
              );

              // Check if cities match (handle variations like "City of Biñan" vs "Biñan")
              const cityMatches =
                geocodedCity.includes(expectedCity.replace("city of ", "")) ||
                expectedCity.includes(geocodedCity.replace("city of ", "")) ||
                geocodedCity
                  .replace("city of ", "")
                  .includes(expectedCity.replace("city of ", ""));

              if (cityMatches) {
                console.log(
                  "✅ Postal code geocoding successful with city match"
                );
                return { lat: data.lat, lon: data.lon };
              } else {
                console.warn(
                  `⚠️ City mismatch: geocoded ${geocodedCity} != expected ${expectedCity}, trying alternative methods`
                );
              }
            } else {
              console.log(
                "✅ Postal code geocoding successful (no city to verify)"
              );
              return { lat: data.lat, lon: data.lon };
            }
          }
        } else {
          console.warn(
            "Postal code API returned non-OK status:",
            response.status
          );
        }
      } catch (error) {
        console.warn(
          "Method 1 failed - Postal code geocoding error:",
          error.message
        );
      }
    }

    // Method 2: Try with direct city search (for non-NCR and NCR)
    if (address.city) {
      try {
        console.log("Method 2: Trying direct city geocoding...");

        // Build search variations based on region
        let cityVariations = [];

        if (address.region === "NCR") {
          cityVariations = [
            `${address.city}, Metro Manila, Philippines`,
            `${address.city}, NCR, Philippines`,
            `${address.city.replace(
              "City of ",
              ""
            )}, Metro Manila, Philippines`,
            `${address.city.replace("City of ", "")}, NCR, Philippines`,
            `${address.city}, Philippines`,
          ];
        } else {
          // For provinces like Laguna
          cityVariations = [
            `${address.city}, ${address.province}, Philippines`,
            `${address.city.replace("City of ", "")}, ${
              address.province
            }, Philippines`,
            `${address.city}, ${address.region}, Philippines`,
            `${address.city}, Philippines`,
          ];

          // Add province variations if available
          if (address.province) {
            cityVariations.push(
              `${address.city.replace("City of ", "")}, ${address.province}, ${
                address.region
              }, Philippines`
            );
          }
        }

        for (const cityQuery of cityVariations) {
          try {
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
              cityQuery
            )}&limit=5&appid=${WEATHER_API_KEY}`;
            console.log(`Trying city variation: "${cityQuery}"`);

            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              console.log(`Geocoding results for "${cityQuery}":`, data);

              if (data.length > 0) {
                // Filter results to only include Philippines coordinates
                const philippinesResults = data.filter((location) =>
                  isInPhilippines(location.lat, location.lon)
                );

                if (philippinesResults.length > 0) {
                  // Find the best match for the city
                  const bestMatch =
                    philippinesResults.find((location) => {
                      const locationName = location.name.toLowerCase();
                      const searchCity = address.city
                        .toLowerCase()
                        .replace("city of ", "");
                      return (
                        locationName.includes(searchCity) ||
                        searchCity.includes(locationName)
                      );
                    }) || philippinesResults[0]; // Fallback to first Philippines result

                  console.log("✅ City geocoding successful:", bestMatch);
                  return { lat: bestMatch.lat, lon: bestMatch.lon };
                } else {
                  console.warn(
                    `No results within Philippines bounds for "${cityQuery}"`
                  );
                }
              }
            }
          } catch (error) {
            console.warn(`Failed geocoding for "${cityQuery}":`, error.message);
          }
        }
      } catch (error) {
        console.warn("Method 2 failed - City geocoding error:", error.message);
      }
    }

    // Method 3: Try with region only as last resort (but still validate Philippines)
    if (address.region) {
      try {
        console.log("Method 3: Trying region-only geocoding...");
        const locationQuery = `${address.region}, Philippines`;
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          locationQuery
        )}&limit=1&appid=${WEATHER_API_KEY}`;
        console.log("Trying region-only geocoding:", url);

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0 && isInPhilippines(data[0].lat, data[0].lon)) {
            console.log("✅ Region-only geocoding successful:", data[0]);
            return { lat: data[0].lat, lon: data[0].lon };
          }
        }
      } catch (error) {
        console.warn(
          "Method 3 failed - Region-only geocoding error:",
          error.message
        );
      }
    }
  } catch (error) {
    throw new Error(`Failed to get coordinates for address: ${error.message}`);
  }
};

export const getWeatherData = async (lat, lon) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(`Weather API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "Complete Weather API Response:",
      JSON.stringify(data, null, 2)
    );

    console.log("Weather API successful response summary:", {
      location: data.name,
      temp: data.main.temp,
      conditions: data.weather[0].description,
    });
    return data;
  } catch (error) {
    console.error("Weather fetch error details:", {
      error: error.message,
      coordinates: { lat, lon },
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

export const generateClothingSuggestions = async (weatherData) => {
  try {
    console.log("Generating clothing suggestions for weather:", {
      temp: weatherData.main.temp,
      conditions: weatherData.weather[0].main,
    });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analyze this weather data and suggest 5-7 specific clothing keywords 
      for an e-commerce product filter (comma-separated, no sentences):
      
      - Temperature: ${weatherData.main.temp}°C
      - Weather: ${weatherData.weather[0].description}
      - Humidity: ${weatherData.main.humidity}%
      - Wind: ${weatherData.wind.speed} km/h
      - Rain: ${weatherData.rain?.["1h"] || 0}mm

      Focus on practical terms shoppers would use (e.g., "moisture-wicking", "windproof").
      Return ONLY keywords separated by commas.
    `;
    console.log("AI Prompt:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(
      "Complete AI API Response:",
      JSON.stringify(
        {
          response: response,
          text: text,
        },
        null,
        2
      )
    );

    const keywords = text
      .trim()
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);

    console.log("Processed clothing suggestions:", keywords);
    return keywords;
  } catch (error) {
    console.error("AI Suggestion Error:", {
      error: error.message,
      weatherData: {
        temp: weatherData.main.temp,
        conditions: weatherData.weather[0].main,
      },
      timestamp: new Date().toISOString(),
    });

    // Fallback suggestions
    const temp = weatherData.main.temp;
    let fallbackSuggestions;

    if (temp > 30) {
      fallbackSuggestions = [
        "lightweight",
        "breathable",
        "cotton",
        "shorts",
        "tank-top",
      ];
    } else if (temp > 25) {
      fallbackSuggestions = [
        "light",
        "cotton",
        "t-shirt",
        "comfortable",
        "casual",
      ];
    } else if (temp > 20) {
      fallbackSuggestions = [
        "long-sleeve",
        "light-jacket",
        "comfortable",
        "layers",
      ];
    } else {
      fallbackSuggestions = [
        "warm",
        "jacket",
        "sweater",
        "layered",
        "insulated",
      ];
    }

    console.log("Using fallback suggestions:", fallbackSuggestions);
    return fallbackSuggestions;
  }
};

export const kelvinToCelsius = (kelvin) => {
  return Math.round(kelvin - 273.15);
};

export const getWeatherIcon = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};
