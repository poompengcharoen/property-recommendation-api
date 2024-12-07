import OpenAI from 'openai'
import getAvailableTypes from './getAvailableTypes.js'

const openai = new OpenAI()

const extractUserPreferences = async (userInput) => {
	const availableTypes = await getAvailableTypes()
	const prompt = `
    The user is asking for property recommendations. Based on their message, generate a JSON object with their preferences. Only generate the JSON object, no other text or formatting.
    
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
    - Title (string): The specific name of the property or developer they are looking for. 
    - Types (string[]): The types of properties they are looking for. Available types include: ${availableTypes.join(
			', '
		)}
    - Budget (number) (optional): The maximum amount they are willing to spend.
    - Currency (string): The currency of the budget.
    - Bedrooms (number): The number of bedrooms they want. If they mention "studio", use "studio". Otherwise, use the number mentioned. 
    - Bathrooms (number): The number of bathrooms they want.
    - Location (string): The location they are looking for.
    - Amenities (string[]): The amenities, nearby locations, keywords, or features they want.
    - Avoids (string[]): Features, property types, or locations they want to avoid.

    All fields are optional. If not provided, skip the field.

    User's message: "${userInput}"
  `

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `You are a helpful assistant that extracts user preferences from a user message into a JSON object. You should only generate the JSON object, no other text or formatting. Use only available types of ${availableTypes.join(
						', '
					)}. Do not provide any additional text or explanations. All fields are optional. If not provided, skip the field. Only generate the JSON object, no other text or formatting.`,
				},
				{ role: 'user', content: prompt },
			],
		})
		const result = response.choices[0].message.content
		const preferences = JSON.parse(result, null, 2)
		return preferences
	} catch (error) {
		console.error('Error:', error)
		return null
	}
}

export default extractUserPreferences
