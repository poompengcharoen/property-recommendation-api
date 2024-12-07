import CC from 'currency-converter-lt'

const compileSearchQuery = async (preferences) => {
	const { title, types, budget, currency, bedrooms, bathrooms, location, amenities, avoids } =
		preferences

	const query = { $and: [], $or: [] }

	// Helper to create case-insensitive regex
	const createRegex = (value) => new RegExp(value, 'i')

	// Helper to add OR conditions
	const addOrCondition = (field, value) => {
		query.$or.push({ [field]: { $regex: createRegex(value) } })
	}

	// Helper to add AND NOT conditions
	const addNotCondition = (field, value) => {
		query.$and.push({ [field]: { $not: { $regex: createRegex(value) } } })
	}

	// Helper to convert currency to THB
	const convertCurrencyToTHB = async (amount, currency) => {
		if (!currency || /THB/i.test(currency)) {
			return amount
		}

		try {
			const currencyConverter = new CC({ from: currency, to: 'THB' })
			return await currencyConverter.convert(amount)
		} catch (error) {
			console.error('Currency conversion failed:', error)
			return amount // Fallback to the original amount if conversion fails
		}
	}

	// Add amenities conditions
	if (amenities?.length) {
		// Match amenities with the keywords array
		query.$or.push({ keywords: { $in: amenities.map((amenity) => createRegex(amenity)) } })

		// Also match amenities in title and description
		amenities.forEach((amenity) => {
			addOrCondition('title', amenity)
			addOrCondition('description', amenity)
		})
	}

	// Add title search conditions
	if (title) {
		const words = title.split(' ')
		words.forEach((word) => {
			addOrCondition('title', word)
			addOrCondition('description', word)
		})
	}

	// Filter by property types
	if (types?.length) {
		query.$and.push(...types.map((type) => ({ type: { $regex: createRegex(`^${type}$`) } })))
	}

	// Filter by budget
	if (budget) {
		const budgetTHB = await convertCurrencyToTHB(budget, currency)
		query.$and.push({
			$or: [
				// Include properties less than the budget
				{ priceNumeric: { $lte: budgetTHB } },

				// // Include properties that no have have priceNumeric field
				{ priceNumeric: { $exists: false } },
			],
		})
	}

	// Filter by bedrooms
	if (bedrooms) {
		if (bedrooms === 'studio' || bedrooms === '1') {
			query.$and.push({
				$or: [
					{ bedrooms: { $regex: createRegex('^studio$') } },
					{ bedrooms: { $regex: createRegex('^1$') } },
				],
			})
		} else {
			query.$and.push({ bedrooms: { $regex: createRegex(`^${bedrooms}$`) } })
		}
	}

	// Filter by bathrooms
	if (bathrooms) {
		query.$and.push({ bathrooms: { $regex: createRegex(`^${bathrooms}$`) } })
	}

	// Filter by location
	if (location) {
		query.$and.push({ location: { $regex: createRegex(location) } })
	}

	// Exclude properties with "avoids" terms
	if (avoids?.length) {
		avoids.forEach((avoid) =>
			['title', 'description', 'location'].forEach((field) => addNotCondition(field, avoid))
		)
	}

	// Clean up empty $or and $and
	if (!query.$or.length) delete query.$or
	if (!query.$and.length) delete query.$and

	// Sort properties
	const sort = { priceNumeric: -1, keywords: -1 }

	return { query, sort }
}

export default compileSearchQuery
