import { connectRedis, getCache, setCache } from './config/redis.js'

import { connectDb } from './config/db.js'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from './middlewares/rateLimit.js'
import recommendProperties from './utils/recommendProperties.js'

dotenv.config({
	path: '.env.local',
})

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', true)
app.use(express.json())
app.use(cors())
app.use(rateLimit)

// Ensure database connection is established during server startup
const initializeServer = async () => {
	try {
		await connectDb()
		await connectRedis()

		// Start the server
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`)
		})
	} catch (error) {
		console.error('Failed to connect to the database:', error)
		process.exit(1) // Exit the process if the database connection fails
	}
}

app.post('/', async (req, res) => {
	const { prompt } = req.body
	const cacheKey = `property-recommendation-api:${req.ip}`
	let count = 0

	try {
		const cachedData = await getCache(cacheKey)
		const { count: cachedCount } = cachedData || {}
		count = cachedCount ? cachedCount : count
		const isExceedingUsageLimit = count >= 5

		if (process.env.NODE_ENV === 'production' && isExceedingUsageLimit) {
			res.status(429).json({
				success: false,
				message: `You have exceeded the usage limit. Please try again later.`,
			})
			return
		}

		const { results, preferences, cleanedPrompt } = await recommendProperties(prompt)

		await setCache(cacheKey, { count: count + 1 }, 86400) // Cache for 24 hours

		res.status(200).json({
			success: true,
			prompt,
			cleanedPrompt,
			preferences,
			results,
		})
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: error.message })
	}
})

// Initialize the server and connect to the database
initializeServer()
