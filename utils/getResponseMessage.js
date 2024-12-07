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
					content: `You are a helpful assistant that reads, understands, and generates a response message based on user input. A response message is basically an introductory reply to the user acknowledging their preferences, confirming them that you are querying the data and asking for more information if needed. Try to understand the user's message and generate a concise, clear, and actionable response message that can be used to recommend properties.`,
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
