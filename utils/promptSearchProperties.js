import evaluateSearchResults from './evaluateSearchResults.js'
import fetchProperties from './fetchProperties.js'

const promptSearchProperties = async (prompt, query, sort, limit = 5) => {
	let evaluatedProperties = []
	let count = 0

	while (evaluatedProperties.length < limit && count < 3) {
		const properties = await fetchProperties(query, sort, evaluatedProperties)

		const scores = await evaluateSearchResults(prompt, properties)

		properties.forEach((property, i) => {
			if (scores && scores[i] && scores[i] >= 70) {
				evaluatedProperties.push({
					...property.toObject(),
					relevance: scores[i],
				})
			}
		})

		count++
	}

	return evaluatedProperties.sort((a, b) => b.relevance - a.relevance)
}

export default promptSearchProperties
