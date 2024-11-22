import ollama from 'ollama'

const generateRandomPrompts = async () => {
	const prompt = `
	Generate realistic user prompts for property searching as a single line of text, with each prompt separated by new line. Each prompt should reflect different preferences users may have, including property types, locations, price ranges, and specific needs like proximity to transit or avoiding traffic-heavy areas. Use these examples as a guide:
		"I'm looking for a 2-bedroom condo in downtown Phuket, ideally within a 5-million THB budget and with a nice view.",
		"Can you find me a house with at least 3 bedrooms, a garden, and close to schools? My budget is up to 10 million THB.",
		"I'm interested in a beachfront villa for vacation use, with 4 bedrooms and a private pool.",
		"Looking for a budget apartment under 2 million THB with good access to public transportation.",
		"Seeking a condo near BTS for easy commuting, 1-2 bedrooms, and under 4 million THB.",
		"I need a family-friendly house in a quieter area, ideally away from high-traffic zones, with a yard and 3 bedrooms.",
		"Searching for a rental apartment close to the business district with at least 2 bedrooms, within a 15-minute drive to avoid traffic congestion.",
		"I'm looking for a modern condo near restaurants and cafes, with a budget of around 7 million THB and close to public transit."
	Please generate 10 unique prompts, separated by new line, with no additional text, no explanations, no bullet points, or other formatting.
	`

	try {
		const result = await ollama.generate({
			model: 'mistral',
			prompt,
		})
		const prompts = result.response
			.split('\n')
			.map((query) => query.trim())
			.filter((query) => query && query.length)
		return prompts
	} catch (error) {
		console.error('Error:', error)
		return null
	}
}

export default generateRandomPrompts
