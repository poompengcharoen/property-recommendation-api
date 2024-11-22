import Property from '../models/property.js'

const fetchProperties = async (query, sort, evaluatedProperties, limit = 10) => {
	const excludeTitles = evaluatedProperties.map((property) => property.title)
	const excludeLinks = evaluatedProperties.map((property) => property.link)

	const properties = await Property.find({
		...query,
		title: { $nin: excludeTitles },
		link: { $nin: excludeLinks },
	})
		.sort(sort)
		.limit(limit)

	return properties
}

export default fetchProperties
