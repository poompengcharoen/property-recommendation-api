import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema(
	{
		link: { type: String, unique: true },
		title: String,
		type: String,
		price: String,
		priceNumeric: Number,
		currencyCode: String,
		bedrooms: String,
		bathrooms: String,
		propertySize: String,
		location: String,
		description: String,
		image: String,
		keywords: [String],
	},
	{
		timestamps: true,
	}
)

const Property = mongoose.model('Property', propertySchema)

export default Property
