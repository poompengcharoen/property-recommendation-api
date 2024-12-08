import OpenAI from 'openai'

const openai = new OpenAI()

// Function to generate a response message based on user input
const getResponseMessage = async (userInput) => {
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `You are a helpful assistant that reads, understands, and generates a response message based on user input. A response message should reply to the user acknowledging their preferences, telling them that you found the data below for them, and asking them to modify their prompt with more details if they want to optimize the search. Try to understand the user's message and generate a concise, clear, and actionable response message that can be used to recommend properties.`,
				},
				{ role: 'user', content: userInput },
			],
		})

		// Parse and return the extracted preferences.
		const result = response.choices[0]?.message?.content?.trim()
		if (!result) throw new Error('No response content received from OpenAI.')

		return result
	} catch (error) {
		console.error('Error getting response message:', error.message)
		return null
	}
}

export default getResponseMessage
