import ollama from 'ollama'

const extractPropertyKeywords = async (property) => {
	const prompt = `
	Extract key attributes from the following property data, such as property type, location, price, bedrooms, bathrooms, features, and other notable details. Output a concise, comma-separated list of keywords relevant to property searches. Here’s an example:
		Property Data: {"title": "2-bedroom condo with ocean view in downtown Phuket", "type": "condo", "price": "5 million THB", "bedrooms": 2, "bathrooms": 1, "location": "downtown Phuket", "features": ["ocean view", "balcony"]}
		Output: "2-bedroom condo, ocean view, downtown Phuket, 5 million THB, balcony"

	Property Data: ${JSON.stringify(property)}

	Please provide only the keywords as a single comma-separated line with no additional text or formatting.
	`

	try {
		const result = await ollama.generate({
			model: 'mistral',
			prompt,
		})
		const keywords = result.response
			.split('\n')
			.map((query) => query.trim())
			.filter((query) => query && query.length)
		return keywords
	} catch (error) {
		console.error('Error:', error)
		return null
	}
}

export default extractPropertyKeywords
