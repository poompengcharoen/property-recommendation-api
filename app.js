import { connectRedis, getCache, setCache } from './config/redis.js'

import OpenAI from 'openai'
import { Server } from 'socket.io'
import { connectDb } from './config/db.js'
import cors from 'cors'
import { createServer } from 'http'
import dotenv from 'dotenv'
import express from 'express'
import generateRandomPrompts from './utils/generateRandomPrompts.js'
import rateLimit from './middlewares/rateLimit.js'
import recommendProperties from './utils/recommendProperties.js'
import summarizeResults from './utils/summarizeResults.js'

const openai = new OpenAI()

dotenv.config({
	path: '.env.local',
})

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', true)
app.use(express.json())
app.use(cors())
app.use(rateLimit)

// Create an HTTP server
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new Server(httpServer, {
	cors: {
		origin: '*', // Adjust to your frontend's domain in production
		methods: ['GET', 'POST'],
	},
})

// Ensure database connection is established during server startup
const initializeServer = async () => {
	try {
		await connectDb()
		await connectRedis()

		// Start the HTTP server (with Socket.IO attached)
		httpServer.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`)
		})

		// Socket.IO connection event
		io.on('connection', (socket) => {
			console.log(`Socket connected: ${socket.id}`)

			let count = 0
			const messages = [
				{
					role: 'system',
					content:
						"You are a helpful assistant with real estate knowledge. Your tasks are to assist the users in finding properties based on their preferences, make discussions on properties data, and refine their property search criteria for a chatbot. You can ask one specific question at a time to gather details like location, budget, property type, and features. Or, you can finalize the prompt quickly by confirming the user's requirements. When the user confirms or command to search, immediately respond with [FINAL] followed by the finalized prompt on the next line, with no extra text.",
				},
			]

			socket.on('chat', async (data) => {
				console.log(`Received data: ${data}`)

				if (process.env.NODE_ENV === 'production' && count > 100) {
					socket.emit('rate-limit')
					return
				}

				messages.push({ role: 'user', content: data })

				try {
					const response = await openai.chat.completions.create({
						model: 'gpt-4o',
						messages,
					})
					const replyMsg = response.choices[0]?.message?.content?.trim()

					if (replyMsg.includes('[FINAL]')) {
						socket.emit('searching')

						const prompt = replyMsg.split('[FINAL]')[1].trim()
						const recommendations = await recommendProperties(prompt)
						socket.emit('recommend', recommendations)
						messages.push({
							role: 'user',
							content: JSON.stringify(recommendations),
						})

						socket.emit('summarizing')
						const summary = await summarizeResults(prompt, recommendations.results)
						socket.emit('report-summary', { message: summary })
						messages.push({ role: 'user', content: summary })
					} else {
						socket.emit('reply', { message: replyMsg })
					}

					count++
				} catch (error) {
					console.error('Error:', error)
					socket.emit('reply', {
						message: 'Sorry, I could not process your request. Please try again later.',
					})
				}
			})

			// Handle disconnection
			socket.on('disconnect', () => {
				console.log(`Socket disconnected: ${socket.id}`)
			})
		})
	} catch (error) {
		console.error('Failed to connect to the database:', error)
		process.exit(1) // Exit the process if the database connection fails
	}
}

app.get('/random-prompts', async (req, res) => {
	try {
		const cacheKey = `property-recommendation-api:random-prompts`
		const cachedData = await getCache(cacheKey)
		if (cachedData) {
			res.status(200).json({ success: true, prompts: cachedData })
			return
		}

		const prompts = await generateRandomPrompts()

		await setCache(cacheKey, prompts, 3600) // Cache for 1 hour

		res.status(200).json({ success: true, prompts })
	} catch (error) {
		console.error('Error:', error)
		res.status(500).json({ success: false, message: error.message })
	}
})

app.post('/', async (req, res) => {
	const { prompt } = req.body
	const cacheKey = `property-recommendation-api:${req.ip}`
	let count = 0

	try {
		const cachedData = await getCache(cacheKey)
		const { count: cachedCount } = cachedData || {}
		count = cachedCount ? cachedCount : count
		const isExceedingUsageLimit = count >= 10

		if (process.env.NODE_ENV === 'production' && isExceedingUsageLimit) {
			res.status(429).json({
				success: false,
				message: `You have exceeded the usage limit. Please try again later.`,
			})
			return
		}

		// Recommend properties
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
