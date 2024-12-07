import OpenAI from 'openai'
import getAvailableTypes from './getAvailableTypes.js'

const openai = new OpenAI()

// Generate the system prompt dynamically based on available property types.
const generateSystemPrompt = (availableTypes) => `
You are a helpful assistant that extracts user preferences from a user message into a JSON object. 
Use the following structure and rules:

Example JSON:
{
  "title": "Sansiri",
  "types": ["condo", "house"],
  "budget": 40000,
  "currency": "THB",
  "bedrooms": "3",
  "bathrooms": "2",
  "location": "Phuket",
  "amenities": ["beach", "tennis", "court", "park", "restaurant", "shopping", "center", "pet", "friendly"],
  "avoids": ["busy", "area", "school"]
}

Dictionary:
- Title (string): The specific name of the property or developer.
- Types (string[]): Available types include: ${availableTypes.join(', ')}.
- Budget (number) (optional): Maximum spend amount.
- Currency (string): Currency of the budget.
- Bedrooms (number): Number of bedrooms or "studio" if mentioned.
- Bathrooms (number): Number of bathrooms.
- Location (string): Desired location.
- Amenities (string[]): Desired features, nearby locations, or keywords.
- Avoids (string[]): Features, property types, or locations to avoid.

All fields are optional. Skip any not mentioned.
Only generate the JSON object, no additional text or formatting.
`

// Function to extract user preferences based on user input.
const extractUserPreferences = async (userInput) => {
	try {
		const availableTypes = await getAvailableTypes()
		const systemPrompt = generateSystemPrompt(availableTypes)

		const userPrompt = `
    The user is asking for property recommendations. Based on their message, generate a JSON object with their preferences.

    User's message: "${userInput}"
    `

		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
		})

		// Parse and return the extracted preferences.
		const result = response.choices[0]?.message?.content?.trim()
		if (!result) throw new Error('No response content received from OpenAI.')

		const preferences = JSON.parse(result)
		return preferences
	} catch (error) {
		console.error('Error extracting user preferences:', error.message)
		return null
	}
}

export default extractUserPreferences
