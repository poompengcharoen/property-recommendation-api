import Property from '../models/property.js'

const getAvailableTypes = async () => {
	try {
		// Fetch distinct types from the database
		const types = (await Property.distinct('type'))
			.filter((type) => type && type.length)
			.map((type) => type.toLowerCase())
		return types
	} catch (error) {
		console.error('Error fetching types:', error)
		throw error
	}
}

export default getAvailableTypes
