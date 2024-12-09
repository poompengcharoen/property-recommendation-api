import cleanPrompt from './cleanPrompt.js'
import compileSearchQuery from './compileSearchQuery.js'
import evaluateSearchResults from './evaluateSearchResults.js'
import extractUserPreferences from './extractUserPreferences.js'
import fetchProperties from './fetchProperties.js'
import getResponseMessage from './getResponseMessage.js'
import summarizeResults from './summarizeResults.js'
import uniqBy from 'lodash/uniqBy.js'

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

		let results = []
		let count = 0

		while (results.length < 5 && count < 2) {
			// Fetch properties
			const properties = await fetchProperties(query, sort, 10, results)
			console.log(
				'================================================================================'
			)
			console.log('PROPERTIES:')
			console.log(properties)

			// Evaluate properties (AI)
			const scores = await evaluateSearchResults(cleanedPrompt, properties)
			console.log(
				'================================================================================'
			)
			console.log('SCORES:')
			console.log(scores)

			// Compile results
			let evaluatedProperties = properties
				.map((result, i) => ({
					...result.toObject(),
					relevance: scores[i],
				}))
				.filter((result) => result.relevance >= 70)
				.sort((a, b) => b.relevance - a.relevance)

			results = uniqBy([...results, ...evaluatedProperties], 'link')
			count++
		}

		console.log('================================================================================')
		console.log('RESULTS:')
		console.log(results)

		// Summarize results
		const summary = await summarizeResults(prompt, results)
		console.log('================================================================================')
		console.log('SUMMARY:')
		console.log(summary)

		return {
			prompt,
			cleanedPrompt,
			preferences,
			query,
			sort,
			message,
			results,
			summary,
		}
	} catch (error) {
		console.error('Error:', error)
		throw error
	}
}

export default recommendProperties
