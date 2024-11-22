import dotenv from 'dotenv'
import mongoose from 'mongoose'

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' })

// Connect to MongoDB using credentials from environment variables
export const connectDb = async () => {
	try {
		const dbUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?tls=true&authSource=admin&replicaSet=${process.env.DB_REPLICA_SET}`
		await mongoose.connect(dbUri)
		console.log('Connected to MongoDB')
	} catch (err) {
		console.error('Error connecting to MongoDB:', err)
	}
}

// Disconnect from MongoDB
export const disconnectDb = async () => {
	try {
		await mongoose.disconnect()
		console.log('Disconnected from MongoDB')
	} catch (err) {
		console.error('Error disconnecting from MongoDB:', err)
	}
}
