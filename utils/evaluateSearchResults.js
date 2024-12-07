import OpenAI from 'openai'

const openai = new OpenAI()

const evaluateSearchResults = async (userInput, results) => {
	if (results.length === 0) return []

	const prompt = `
    Evaluate each property in the search results and assign a relevance score (0-100) based on how well it matches the user's preferences.

    User's preferences:
    "${userInput}"

    Property results:
    ${JSON.stringify(
			results.map(
				({
					title,
					type,
					price,
					priceNumeric,
					currency,
					bedrooms,
					bathrooms,
					location,
					description,
					keywords,
				}) => ({
					title,
					type,
					price: priceNumeric && currency ? `${priceNumeric} ${currency}` : price,
					bedrooms,
					bathrooms,
					location,
					description,
					keywords,
				})
			)
		)}

    Respond with a JSON array of relevance scores in the order of the results. Do not provide any additional text, formatting, or explanations.
		Expected length: ${results.length}

		Example JSON: [score1, score2, ..., scoreN]
  `

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{ role: 'system', content: 'You are a helpful assistant that evaluates search results.' },
				{ role: 'user', content: prompt },
			],
		})
		const result = response.choices[0].message.content
		const scores = JSON.parse(result, null, 2)
		return scores
	} catch (error) {
		console.error('Error:', error)
		return null
	}
}

export default evaluateSearchResults
