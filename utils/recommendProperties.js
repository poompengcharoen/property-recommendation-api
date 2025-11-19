import { getCache, setCache } from '../config/redis.js'

import compileSearchQuery from './compileSearchQuery.js'
import crypto from 'crypto'
import evaluateSearchResults from './evaluateSearchResults.js'
import extractUserPreferences from './extractUserPreferences.js'
import fetchProperties from './fetchProperties.js'
import uniqBy from 'lodash/uniqBy.js'

// Generate a normalized cache key from prompt
const generateCacheKey = (prompt, type) => {
	const normalizedPrompt = prompt.trim().toLowerCase().replace(/\s+/g, ' ')
	const hash = crypto.createHash('sha256').update(normalizedPrompt).digest('hex').substring(0, 16)
	return `property-recommendation-api:${type}:${hash}`
}

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

		// Check for cached results first (full result cache)
		const resultCacheKey = generateCacheKey(prompt, 'results')
		const cachedResults = await getCache(resultCacheKey)
		if (cachedResults) {
			console.log('Cache hit: Returning cached results')
			return cachedResults
		}

		// Check for cached preferences (search term cache)
		const preferencesCacheKey = generateCacheKey(prompt, 'preferences')
		let preferences = await getCache(preferencesCacheKey)

		if (!preferences) {
			// Extract user preferences (AI)
			preferences = await extractUserPreferences(prompt)
			// Cache preferences for 7 days
			if (preferences) {
				await setCache(preferencesCacheKey, preferences, 604800)
			}
		} else {
			console.log('Cache hit: Using cached preferences')
		}
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
			const scores = await evaluateSearchResults(prompt, properties)
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

		const result = {
			prompt,
			preferences,
			query,
			sort,
			results,
		}

		// Cache full results for 7 days
		await setCache(resultCacheKey, result, 604800)

		return result
	} catch (error) {
		console.error('Error:', error)
		throw error
	}
}

export default recommendProperties
