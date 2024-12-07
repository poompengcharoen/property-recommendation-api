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

### JSON Object Structure:
{
  "title": "string | null", // Specific name of the property or developer, if mentioned.
  "types": ["string"] | [], // Array of applicable property types (e.g., condo, house). Available types: ${availableTypes.join(
		', '
	)}.
  "budget": "number | null", // Maximum spend amount.
  "currency": "string | null", // Currency of the budget.
  "bedrooms": "number | null", // Number of bedrooms (integer) or "studio" if mentioned.
  "bathrooms": "number | null", // Number of bathrooms (integer).
  "location": "string | null", // City and/or country where the property is located.
  "amenities": ["string"] | [], // List of desired features, nearby locations, or keywords.
  "avoids": ["string"] | [] // List of features, property types, or locations the user wants to avoid.
}


### Example:

**User message:**
"I'm looking for a modern condo in Bangkok with a budget of 5,000,000 THB. It should have at least 2 bedrooms and 2 bathrooms. I'd love a swimming pool and gym nearby, but I want to avoid areas with heavy traffic."

**Extracted JSON:**
{
  "title": null,
  "types": ["condo"],
  "budget": 5000000,
  "currency": "thb",
  "bedrooms": 2,
  "bathrooms": 2,
  "location": "bangkok",
  "amenities": ["swimming pool", "gym"],
  "avoids": ["heavy traffic"]
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
		})

		// Parse and return the extracted preferences.
		const result = response.choices[0]?.message?.content?.trim()
		if (!result) throw new Error('No response content received from OpenAI.')

		const preferences = JSON.parse(result)

		return {
			...preferences,
			types: preferences.types?.map((type) => type.replace(/apartment/gi, 'condo')),
		}
	} catch (error) {
		console.error('Error extracting user preferences:', error.message)
		return null
	}
}

export default extractUserPreferences
