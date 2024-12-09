import OpenAI from 'openai'

const openai = new OpenAI()

const summarizeResults = async (prompt, results) => {
	try {
		if (!results || results.length === 0) {
			return
		}

		const systemPrompt = `
			Based on the prompt and the results, make a short summary for me. Use tables or diagrams if necessary. Rearrange, sort, or clean the data if needed. You may suggest alternative prompts for the user if needed.

			Prompt: ${prompt}
			
			${results.map((result) => {
				return JSON.stringify({
					title: result.title,
					type: result.type,
					price: result.price,
					bedrooms: result.bedrooms,
					bathrooms: result.bathrooms,
					location: result.location,
					description: result.description,
					keywords: result.keywords,
				})
			})}
		`

		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: systemPrompt,
				},
			],
		})

		const summary = response.choices[0]?.message?.content

		return summary
	} catch (error) {
		console.error('Error:', error)
		return null
	}
}

export default summarizeResults
