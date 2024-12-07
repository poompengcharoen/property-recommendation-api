import cleanPrompt from './cleanPrompt.js'
import compileSearchQuery from './compileSearchQuery.js'
import extractUserPreferences from './extractUserPreferences.js'
import getResponseMessage from './getResponseMessage.js'
import promptSearchProperties from './promptSearchProperties.js'

const recommendProperties = async (prompt) => {
	try {
		if (!prompt || prompt.length === 0) {
			return {
				prompt,
				results: [],
			}
		}

		console.log('================================================================================')
		console.log('PROMPT:')
		console.log(prompt)

		// Clear user prompt
		const cleanedPrompt = await cleanPrompt(prompt)
		console.log('================================================================================')
		console.log('CLEANED PROMPT:')
		console.log(cleanedPrompt)

		// Response message
		const message = await getResponseMessage(cleanedPrompt)
		console.log('================================================================================')
		console.log('MESSAGE:')
		console.log(message)

		// Extract user preferences
		const preferences = await extractUserPreferences(cleanedPrompt)
		console.log('================================================================================')
		console.log('PREFERENCES:')
		console.log(preferences)

		// Compile search query
		const { query, sort } = await compileSearchQuery(preferences)
		console.log('================================================================================')
		console.log('QUERY:')
		console.log(query)

		console.log('================================================================================')
		console.log('SORT:')
		console.log(sort)

		// Search for properties
		const results = await promptSearchProperties(cleanedPrompt, query, sort)
		console.log('================================================================================')
		console.log('RESULTS:')
		console.log(results)

		return {
			prompt,
			cleanedPrompt,
			preferences,
			query,
			sort,
			message,
			results,
		}
	} catch (error) {
		console.error('Error:', error)
		throw error
	}
}

export default recommendProperties
