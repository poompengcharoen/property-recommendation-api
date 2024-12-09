import OpenAI from 'openai'

const openai = new OpenAI()

// Function to generate a response message based on user input
const getResponseMessage = async (userInput) => {
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: userInput }],
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
