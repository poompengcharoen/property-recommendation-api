import mongoose from 'mongoose'

const promptSchema = new mongoose.Schema(
	{
		text: { type: String, unique: true },
	},
	{
		timestamps: true,
	}
)

const Prompt = mongoose.model('Prompt', promptSchema)

export default Prompt
