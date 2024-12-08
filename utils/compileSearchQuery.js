import CC from 'currency-converter-lt'

const compileSearchQuery = async (preferences) => {
	// Helper to create case-insensitive regex
	const createRegex = (value) => new RegExp(value, 'i')

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

	const { title, types, budget, currency, bedrooms, bathrooms, location, amenities, avoids } =
		preferences

	const budgetTHB = await convertCurrencyToTHB(budget, currency)

	const query = {
		$and: [
			{ $text: { $search: `${title} ${location} ${types.join(' ')} ${amenities.join(' ')}` } },
		],
		$or: [],
	}

	if (types) {
		types.forEach((type) => {
			if (type === 'condo' || type === 'apartment') {
				query.$and.push({ type: { $regex: createRegex('condo|apartment') } })
			} else if (type === 'villa' || type === 'house' || type === 'bungalow') {
				query.$and.push({ type: { $regex: createRegex('villa|house|bungalow') } })
			} else {
				query.$and.push({ type: { $regex: createRegex(type) } })
			}
		})
	}

	if (budget) {
		query.$and.push({ priceNumeric: { $lte: budgetTHB } })
	}

	if (bedrooms) {
		query.$and.push({ bedrooms: { $gte: bedrooms } })
	}

	if (bathrooms) {
		query.$and.push({ bathrooms: { $gte: bathrooms } })
	}

	if (location) {
		query.$and.push({
			location: createRegex(
				location
					.split(',')
					.map((location) => location.trim())
					.join('|')
			),
		})
	}

	if (avoids) {
		avoids.forEach((avoid) => {
			query.$and.push({ title: { $not: { $regex: createRegex(avoid) } } })
			query.$and.push({ description: { $not: { $regex: createRegex(avoid) } } })
			query.$and.push({ location: { $not: { $regex: createRegex(avoid) } } })
		})
	}

	// Cleanup if $or or $and arrays are empty
	if (!query.$or.length) delete query.$or
	if (!query.$and.length) delete query.$and

	// Sort properties
	const sort = { score: { $meta: 'textScore' } }

	return { query, sort }
}

export default compileSearchQuery
