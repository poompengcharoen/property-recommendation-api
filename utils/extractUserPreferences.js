import OpenAI from 'openai'
import getAvailableTypes from './getAvailableTypes.js'

const openai = new OpenAI()

// Generate the system prompt dynamically based on available property types.
const generateSystemPrompt = (availableTypes) => `
You are a helpful assistant that reads, understands, and extracts property preferences from a user message into a JSON object.

### Instructions:
1. Extract property preferences from the user’s message using the structure below.
2. Use **lowercase** for all string values.
3. Set values to \`null\` if not provided in the message.
4. Ensure numbers are parsed as integers where applicable.
5. The user may mention details of the property, such as the number of bedrooms and bathrooms by mentioning who lives in the property.
6. Ensure that for the types array, the values are one of the available types in the database.

### JSON Object Structure:
{
  "title": "string | null", // Specific name of the property or developer, if mentioned.
  "types": ["string"] | [], // Array of applicable property types (e.g., condo, house). Available types in the database include: ${availableTypes.join(
		', '
	)}.
  "budget": "number | null", // Maximum budget when buying the property or monthly rent budget.
  "currency": "string | null", // Currency of the budget.
  "bedrooms": "number | null", // Number of bedrooms (integer). For "studio" if mentioned, use 1.
  "bathrooms": "number | null", // Number of bathrooms (integer).
  "location": "string | null", // City and/or country where the property is located, not the user's descriptive location.
  "amenities": ["string"] | [], // List of keywords related to the desired features, nearby locations, or keywords.
  "avoids": ["string"] | [] // List of keywords related to the features, property types, or locations the user wants to avoid.
	"isRent": "boolean | null" // Whether the property is a rental property or not.
}


### Example:

**User message:**
"I'm looking for a modern villa in downtown Bangkok with a budget of 30,000,000 THB. It should have at least 2 bedrooms and 2 bathrooms. I'd love to have a swimming pool and gym, and I want to avoid areas with heavy traffic."

**Extracted JSON:**
{
  "title": null,
  "types": ["villa", "house"],
  "budget": 30000000,
  "currency": "THB",
  "bedrooms": 2,
  "bathrooms": 2,
  "location": "bangkok",
  "amenities": ["swimming pool", "gym", "downtown"],
  "avoids": ["busy"],
  "isRent": false
}
`

// Function to extract user preferences based on user input.
const extractUserPreferences = async (userInput) => {
	try {
		const availableTypes = await getAvailableTypes()
		const systemPrompt = generateSystemPrompt(availableTypes)

		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userInput },
			],
			response_format: { type: 'json_object' },
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
