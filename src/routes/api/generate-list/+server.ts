import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { OPENAI_API_KEY, OPENCAGE_API_KEY, OPENWEATHER_API_KEY } from '$env/static/private';

// Initialize OpenAI client with SvelteKit's environment variable handling
let openai: OpenAI | undefined;

console.log('Environment check:');
console.log('- OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
console.log('- OPENAI_API_KEY length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);
console.log('- OPENCAGE_API_KEY exists:', !!OPENCAGE_API_KEY);
console.log('- OPENWEATHER_API_KEY exists:', !!OPENWEATHER_API_KEY);
console.log('- OPENWEATHER_API_KEY length:', OPENWEATHER_API_KEY ? OPENWEATHER_API_KEY.length : 0);

if (OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-placeholder' && OPENAI_API_KEY.length > 20) {
	try {
		openai = new OpenAI({
			apiKey: OPENAI_API_KEY
		});
		console.log('OpenAI client initialized successfully');
	} catch (error) {
		console.log('Failed to initialize OpenAI client:', error);
	}
} else {
	console.log('OpenAI client not initialized - no valid API key available');
	console.log('API key details:', {
		hasKey: !!OPENAI_API_KEY,
		isPlaceholder: OPENAI_API_KEY === 'sk-placeholder',
		length: OPENAI_API_KEY ? OPENAI_API_KEY.length : 0
	});
}

export const POST = async ({ request }: { request: Request }) => {
	try {
		const body = await request.json();
		const { destination, dates, startDate, numberOfDays, travelers, tripPurpose, customPurpose, additionalDetails } = body;

		if (!destination || typeof destination !== 'string') {
			return json(
				{ error: 'Destination is required and must be a string' },
				{ status: 400 }
			);
		}

		// Check if OpenAI is available
		if (!openai) {
			return json(
				{ error: 'AI service is not available. Please check your OpenAI API key configuration.' },
				{ status: 503 }
			);
		}

		const destinationParts = destination.split(',');
		const city = destinationParts[0]?.trim() || destination;
		const country = destinationParts[1]?.trim() || 'Unknown';

		// Get real location details from OpenCage Geocoding API
		const locationDetails = await getLocationDetails(destination);

		// Get real weather forecast from OpenWeatherMap API
		let weatherForecast;
		try {
			weatherForecast = await getWeatherForecast(locationDetails.latitude, locationDetails.longitude, startDate, numberOfDays);
		} catch (error) {
			console.warn('Weather API failed, using fallback:', error);
			weatherForecast = {
				high_temp_celsius: 'N/A',
				low_temp_celsius: 'N/A',
				conditions: 'Weather data unavailable'
			};
		}

		let travelerNames = ['You'];
		if (travelers && travelers.trim()) {
			// Split by common separators and clean up
			const rawNames = travelers.split(/[,&]| and | \+ /).map((name: string) => name.trim()).filter((name: string) => name);
			
			// Process each name to extract age/gender clues
			travelerNames = rawNames.map((name: string) => {
				// Remove age indicators like "(11)" from the display name
				return name.replace(/\(\d+\)/g, '').trim();
			});
		}

		// Use OpenAI to analyze travelers and create personalized prompts
		const mockTravelers = await Promise.all(travelerNames.map(async (displayName, index) => {
			// Get the original raw name for better inference
			const originalNames = travelers ? travelers.split(/[,&]| and | \+ /).map((name: string) => name.trim()).filter((name: string) => name) : ['You'];
			const originalName = originalNames[index] || displayName;
			
			// Step 1: Generate personalized prompt
			const travelerAnalysis = await createPersonalizedPromptWithAI(displayName, originalName, index, { destination, dates, startDate, numberOfDays, tripPurpose, customPurpose, additionalDetails });
			
			// Step 2: Generate actual packing list from the prompt
			const packingList = await generatePackingListWithAI(travelerAnalysis.personalized_prompt, displayName, { destination, numberOfDays, tripPurpose, customPurpose });
			
			return {
				...travelerAnalysis,
				packing_list: packingList
			};
		}));

		// Create trip summary based on inputs
		const dayText = numberOfDays === 1 ? '1-day' : `${numberOfDays}-day`;
		let tripSummary = `A ${dayText} trip to ${destination}`;
		if (travelers && travelers.trim()) {
			tripSummary += ` with ${travelers}`;
		}
		if (tripPurpose && tripPurpose.length > 0) {
			let purposeText = tripPurpose.join(', ');
			if (customPurpose && customPurpose.trim()) {
				purposeText += `, ${customPurpose.trim()}`;
			}
			if (purposeText) {
				tripSummary += ` for ${purposeText}`;
			}
		} else if (customPurpose && customPurpose.trim()) {
			tripSummary += ` for ${customPurpose.trim()}`;
		}
		tripSummary += '.';

		const mockResult = {
			trip_summary: tripSummary,
			location_details: locationDetails,
			weather_forecast: weatherForecast,
			travelers: mockTravelers,
			inferred_activities: ["Sightseeing", "Walking", "Dining"]
		};

		console.log('Generated AI result:', mockResult);
		return json(mockResult);

	} catch (error) {
		console.error('Error generating packing list:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{ error: 'Failed to generate packing list', details: errorMessage },
			{ status: 500 }
		);
	}
};

// Use OpenAI to create personalized prompts for each traveler
async function createPersonalizedPromptWithAI(displayName: string, originalName: string, index: number, allInputs: any) {
	const { destination, dates, numberOfDays, tripPurpose, customPurpose, additionalDetails, startDate } = allInputs;
	
	// Ensure OpenAI client is available
	if (!openai) {
		throw new Error('OpenAI client is not available');
	}
	
	try {
		// Create a comprehensive prompt for OpenAI to analyze the traveler and trip context
		const analysisPrompt = `Analyze this traveler and trip context to create a personalized packing list prompt.

TRIP CONTEXT:
- Destination: ${destination}
- Trip Duration: ${numberOfDays} days
- Start Date: ${startDate || 'Not specified'}
- Trip Purpose: ${Array.isArray(tripPurpose) && tripPurpose.length > 0 ? 
		(tripPurpose.join(', ') + (customPurpose && customPurpose.trim() ? `, ${customPurpose.trim()}` : '')) : 
		(customPurpose && customPurpose.trim() ? customPurpose.trim() : 'general travel')}
- Additional Details: ${additionalDetails || 'none provided'}

TRAVELER INFORMATION:
- Name: ${originalName}
- Display Name: ${displayName}

Please analyze the traveler's name, the destination, dates, and trip context to infer:
1. Age group (infant, toddler, child, teen, adult, senior)
2. Gender (if identifiable from context - be very careful with this inference)
3. Persona/traveler type (business professional, family traveler, adventure seeker, cultural explorer, etc.)
4. Specific needs based on:
   - Age and gender
   - Trip purpose and activities
   - Destination characteristics (climate, culture, activities)
   - Trip duration
   - Seasonal considerations (if dates provided)

IMPORTANT: When inferring gender, consider:
- Names like "dad", "father", "mom", "mother" are clear gender indicators
- Names like "Nirav" may be ambiguous - only infer if you're very confident
- If uncertain, use "unspecified" rather than guessing

Return your analysis as a JSON object with this exact structure:
{
  "inferred_age": "string",
  "inferred_gender": "string", 
  "inferred_persona": "string",
  "specific_needs": ["array", "of", "strings"],
  "personalized_prompt": "string"
}

The personalized_prompt should be a detailed prompt for creating a packing list, including all the context and specific considerations for this traveler and trip. Make it comprehensive and contextually aware.`;

		const analysisResponse = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: "You are a travel expert who analyzes travelers and creates personalized packing list prompts. Always respond with valid JSON. Be contextually aware of destinations, seasons, and traveler characteristics."
				},
				{
					role: "user",
					content: analysisPrompt
				}
			],
			response_format: { type: "json_object" },
			temperature: 0.7,
			max_tokens: 1000
		});

		const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');

		return {
			id: `traveler_${index + 1}`,
			provided_name: displayName,
			inferred_persona: `${analysis.inferred_age} ${analysis.inferred_persona}`,
			personalized_prompt: analysis.personalized_prompt,
			inferred_characteristics: {
				age: analysis.inferred_age,
				gender: analysis.inferred_gender,
				persona: analysis.inferred_persona,
				specific_needs: analysis.specific_needs
			}
		};

	} catch (error) {
		console.error('Error calling OpenAI:', error);
		throw new Error(`Failed to analyze traveler ${displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

// Use OpenAI to generate actual packing lists from personalized prompts
async function generatePackingListWithAI(personalizedPrompt: string, travelerName: string, tripContext: any) {
	const { destination, numberOfDays, tripPurpose, customPurpose } = tripContext;
	
	// Ensure OpenAI client is available
	if (!openai) {
		throw new Error('OpenAI client is not available');
	}
	
	try {
		const packingListPrompt = `Based on this personalized prompt, generate a comprehensive, organized packing list.

PERSONALIZED PROMPT:
${personalizedPrompt}

TRIP CONTEXT:
- Destination: ${destination}
- Duration: ${numberOfDays} days
- Purpose: ${Array.isArray(tripPurpose) && tripPurpose.length > 0 ? 
		(tripPurpose.join(', ') + (customPurpose && customPurpose.trim() ? `, ${customPurpose.trim()}` : '')) : 
		(customPurpose && customPurpose.trim() ? customPurpose.trim() : 'general travel')}

IMPORTANT: When generating the packing list, ensure all items are appropriate for the traveler's characteristics:
- If the traveler is identified as male, do NOT include women's clothing items (dresses, skirts, etc.)
- If the traveler is identified as female, do NOT include men's clothing items (men's suits, etc.)
- If gender is unclear, suggest gender-neutral clothing options
- Consider age-appropriate items (e.g., no high heels for toddlers)

Please create a detailed, organized packing list with the following structure:
1. Group items by category (clothing, toiletries, electronics, documents, etc.)
2. Include specific quantities where appropriate
3. Consider the trip duration and destination
4. Make it practical and actionable
5. Ensure all items are appropriate for the traveler's age and gender

Return your response as a JSON object with this exact structure:
{
  "packing_list": {
    "clothing": ["item1", "item2", "item3"],
    "toiletries": ["item1", "item2", "item3"],
    "electronics": ["item1", "item2", "item3"],
    "documents": ["item1", "item2", "item3"],
    "accessories": ["item1", "item2", "item3"],
    "special_items": ["item1", "item2", "item3"]
  },
  "packing_tips": "string with 2-3 practical packing tips for this specific traveler and trip"
}`;

		const packingListResponse = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: "You are a packing expert who creates organized, practical packing lists. Always respond with valid JSON. Group items logically and provide actionable advice."
				},
				{
					role: "user",
					content: packingListPrompt
				}
			],
			response_format: { type: "json_object" },
			temperature: 0.7,
			max_tokens: 1200
		});

		const packingList = JSON.parse(packingListResponse.choices[0].message.content || '{}');
		return packingList;

	} catch (error) {
		console.error('Error generating packing list:', error);
		throw new Error(`Failed to generate packing list for ${travelerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

// Function to get location details from OpenCage Geocoding API
async function getLocationDetails(destination: string) {
	if (!OPENCAGE_API_KEY) {
		console.warn('OPENCAGE_API_KEY not found. Cannot geocode destination.');
		return {
			city: destination,
			country: 'Unknown',
			state: 'Unknown',
			latitude: 0,
			longitude: 0,
			plug_type: "Type A (US)"
		};
	}

	try {
		const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(destination)}&key=${OPENCAGE_API_KEY}`);
		if (!response.ok) {
			throw new Error(`OpenCage API request failed with status: ${response.status}`);
		}
		const data = await response.json();

		if (data.results && data.results.length > 0) {
			const result = data.results[0];
			const components = result.components;
			const city = components.city || components.town || components.village || components.county || components.state || components.country;
			const country = components.country;
			const state = components.state || components.county || 'Unknown';
			const latitude = result.geometry.lat;
			const longitude = result.geometry.lng;

			return {
				city: city,
				country: country,
				state: state,
				latitude: latitude,
				longitude: longitude,
				plug_type: "Type A (US)"
			};
		} else {
			console.warn(`No results found for destination: ${destination}`);
			return {
				city: destination,
				country: 'Unknown',
				state: 'Unknown',
				latitude: 0,
				longitude: 0,
				plug_type: "Type A (US)"
			};
		}
	} catch (error) {
		console.error('Error geocoding destination:', error);
		return {
			city: destination,
			country: 'Unknown',
			state: 'Unknown',
			latitude: 0,
			longitude: 0,
			plug_type: "Type A (US)"
		};
	}
}

// Function to get weather forecast from OpenWeatherMap API
async function getWeatherForecast(latitude: number, longitude: number, startDate: string | null, numberOfDays: number) {
	console.log('getWeatherForecast called with:', { latitude, longitude, startDate, numberOfDays });
	console.log('OPENWEATHER_API_KEY exists:', !!OPENWEATHER_API_KEY);
	console.log('OPENWEATHER_API_KEY length:', OPENWEATHER_API_KEY ? OPENWEATHER_API_KEY.length : 0);
	
	if (!OPENWEATHER_API_KEY) {
		console.warn('OPENWEATHER_API_KEY not found. Cannot get weather forecast.');
		throw new Error('OpenWeatherMap API key not configured');
	}

	if (latitude === 0 || longitude === 0) {
		console.warn('Invalid coordinates for weather forecast');
		throw new Error('Invalid coordinates for weather forecast');
	}

	try {
		console.log(`Fetching weather for coordinates: ${latitude}, ${longitude}`);
		const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=40`;
		console.log('Weather API URL:', weatherUrl);
		console.log('API Key being used:', OPENWEATHER_API_KEY);
		
		const response = await fetch(weatherUrl);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`OpenWeatherMap API error: ${response.status} - ${errorText}`);
			throw new Error(`OpenWeatherMap API request failed with status: ${response.status}`);
		}
		
		const data = await response.json();
		console.log('Weather API response:', JSON.stringify(data, null, 2));

		if (data.list && data.list.length > 0) {
			const currentDate = startDate ? new Date(startDate) : new Date();
			console.log(`Current date: ${currentDate}, Number of days: ${numberOfDays}`);
			
			const forecasts = data.list.filter((forecast: any) => {
				const forecastDate = new Date(forecast.dt * 1000);
				return forecastDate >= currentDate;
			});

			console.log(`Found ${forecasts.length} relevant forecasts`);

			if (forecasts.length > 0) {
				const firstForecast = forecasts[0];
				const lastForecast = forecasts[forecasts.length - 1];

				const weatherData = {
					high_temp_celsius: Math.round(Math.max(...forecasts.map((f: any) => f.main.temp))),
					low_temp_celsius: Math.round(Math.min(...forecasts.map((f: any) => f.main.temp))),
					conditions: firstForecast.weather[0].description
				};
				
				console.log('Generated weather data:', weatherData);
				return weatherData;
			}
		}
		
		console.warn('No weather forecast data found for location.');
		throw new Error('No weather forecast data available');
		
	} catch (error) {
		console.error('Error getting weather forecast:', error);
		throw error; // Re-throw instead of returning fallback data
	}
}
