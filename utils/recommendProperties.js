import cleanPrompt from './cleanPrompt.js'
import compileSearchQuery from './compileSearchQuery.js'
import evaluateSearchResults from './evaluateSearchResults.js'
import extractUserPreferences from './extractUserPreferences.js'
import fetchProperties from './fetchProperties.js'
import getResponseMessage from './getResponseMessage.js'

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

		// Extract user preferences (AI)
		const preferences = await extractUserPreferences(cleanedPrompt)
		console.log('================================================================================')
		console.log('PREFERENCES:')
		console.log(preferences)

		// Compile search query
		const { query, sort } = await compileSearchQuery(preferences)
		console.log('================================================================================')
		console.log('QUERY:')
		console.log(query)

		console.log('QUERY AND:')
		query['$and']?.forEach((condition) => {
			console.log(condition)
		})

		console.log('QUERY OR:')
		query['$or']?.forEach((condition) => {
			console.log(condition)
		})

		console.log('================================================================================')
		console.log('SORT:')
		console.log(sort)

		// Fetch properties
		const properties = await fetchProperties(query, sort)
		console.log('================================================================================')
		console.log('PROPERTIES:')
		console.log(properties)

		// Evaluate properties (AI)
		const scores = await evaluateSearchResults(cleanedPrompt, properties)
		console.log('================================================================================')
		console.log('SCORES:')
		console.log(scores)

		// Compile results
		let results = properties
			.map((property, i) => ({
				...property.toObject(),
				relevance: scores[i],
			}))
			.sort((a, b) => b.relevance - a.relevance)
		console.log('================================================================================')
		console.log('RESULTS:')
		console.log(results)

		// Add related properties
		const relatedProperties = await fetchProperties(query, sort, 5, results)
		results = results.concat(relatedProperties)

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
