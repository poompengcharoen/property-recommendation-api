import Property from '../models/property.js'

const fetchProperties = async (query, sort, limit = 10, excludingProperties = []) => {
	const excludeTitles = excludingProperties.map((property) => property.title)
	const excludeLinks = excludingProperties.map((property) => property.link)

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
