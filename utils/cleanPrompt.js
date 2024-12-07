import OpenAI from 'openai'

const openai = new OpenAI()

// Function to extract user preferences based on user input.
const cleanPrompt = async (userInput) => {
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: `You are a helpful assistant that reads, understands, and cleans a text message from a user and rewrites it into an actionable sentence. Try to understand the user's message and generate a concise, clear, and actionable sentence that can be used to perform the desired action. For example, you can try starting your sentence with "I'm looking for a".`,
				},
				{ role: 'user', content: userInput },
			],
		})

		// Parse and return the extracted preferences.
		const result = response.choices[0]?.message?.content?.trim()
		if (!result) throw new Error('No response content received from OpenAI.')

		return result
	} catch (error) {
		console.error('Error extracting user preferences:', error.message)
		return null
	}
}

export default cleanPrompt
