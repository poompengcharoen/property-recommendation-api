import { connectRedis, getCache, setCache } from './config/redis.js'

import OpenAI from 'openai'
import { Server } from 'socket.io'
import axios from 'axios'
import { connectDb } from './config/db.js'
import cors from 'cors'
import { createServer } from 'http'
import dotenv from 'dotenv'
import express from 'express'
import generateRandomPrompts from './utils/generateRandomPrompts.js'
import rateLimit from './middlewares/rateLimit.js'
import recommendProperties from './utils/recommendProperties.js'

const openai = new OpenAI()

dotenv.config({
	path: '.env.local',
})

const app = express()
const PORT = process.env.PORT || 3000

const API_URL =
	process.env.NODE_ENV === 'production'
		? 'https://api.poompengcharoen.dev'
		: 'http://localhost:3000'

app.set('trust proxy', true)
app.use(express.json())
app.use(cors())
app.use(rateLimit)

// Create an HTTP server
const httpServer = createServer(app)

// Initialize Socket.IO
const io = new Server(httpServer, {
	cors: {
		origin: (origin, callback) => {
			if (process.env.NODE_ENV === 'production') {
				// Allow specific origins
				if (origin && /^https:\/\/.*\.poompengcharoen\.dev$/.test(origin)) {
					return callback(null, true)
				}

				// Deny other origins
				return callback(new Error('Not allowed by CORS'))
			} else {
				// Development mode: Allow localhost on any port
				if (origin && /^http:\/\/localhost:\d+$/.test(origin)) {
					return callback(null, true)
				}

				// Deny other origins
				return callback(new Error('Not allowed by CORS'))
			}
		},
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
		io.on('connection', async (socket) => {
			console.log(`Socket connected: ${socket.id}`)

			let count = 0
			const ipAddress =
				socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() ||
				socket.handshake.address // Fallback to address if no header
			const cacheKey = `property-recommendation-api:${ipAddress}`
			const cachedData = await getCache(cacheKey)
			const { count: cachedCount, usedTickets = [] } = cachedData || {}
			count = cachedCount ? cachedCount : count
			socket.emit('count-tick', count)

			const messages = [
				{
					role: 'system',
					content:
						"You are a helpful assistant with expertise in property search. Read the user's message carefully. If the user prompt a direct command, do it. Otherwise, your goal is to finalize a search prompt based on the user's input. If the input contains any hint of preferences such as location, budget, property type, or features, immediately construct and respond with the finalized prompt wrapped by [SEARCHING] and [DONE] on the same line, with no extra text. If the input lacks sufficient detail and the user seems to need help, ask one specific and relevant question to guide them before finalizing. Always prioritize assisting the user efficiently and initiating the search pipeline promptly.",
				},
			]

			socket.on('chat', async (data) => {
				console.log(`[chat] ${ipAddress}: ${data}`)

				if (process.env.NODE_ENV === 'production' && count >= 30) {
					socket.emit('rate-limit')
					return
				}

				messages.push({ role: 'user', content: data })

				try {
					socket.emit('reply', {
						message: '',
					})

					const stream = await openai.chat.completions.create({
						model: 'gpt-4o',
						messages,
						stream: true,
					})

					// Handle search and recommendation
					let line = ''
					let isSearching = false
					let isDone = false

					for await (const chunk of stream) {
						const token = chunk.choices[0]?.delta?.content || ''
						line += token

						if (!isSearching) {
							socket.emit('stream', token)
						}

						// Signal search start
						if (isDone === false && isSearching === false && line.includes('[SEARCHING]')) {
							socket.emit('searching')
							isSearching = true
						}

						// Perform search
						if (isDone === false && isSearching === true && line.includes('[DONE]')) {
							isSearching = false
							const prompt = line.split('[DONE]')[0].trim().split('[SEARCHING]')[1].trim()
							const recommendations = await recommendProperties(prompt)
							socket.emit('recommend', recommendations)
							messages.push({
								role: 'user',
								content: `
									List properties from the results into a table.

									${JSON.stringify(recommendations.results)}
								`,
							})
							isDone = true
						}
					}

					socket.emit('end-stream')

					count++
					await setCache(cacheKey, { count, usedTickets }, 86400) // Cache for 24 hours
					socket.emit('count-tick', count)
				} catch (error) {
					console.error('Error:', error)
					socket.emit('reply', {
						message: 'Sorry, I could not process your request. Please try again later.',
					})
				}
			})

			socket.on('checkout-completed', async (sessionID) => {
				try {
					const res = await axios.post(`${API_URL}/transactions/track`, {
						sessionID,
					})

					if (res.status === 200) {
						const paymentSession = res.data.session

						if (paymentSession.payment_status === 'paid' && !usedTickets.includes(sessionID)) {
							count = 0
							const updatedUsedTickets = [...usedTickets, sessionID]
							await setCache(cacheKey, { count: 0, usedTickets: updatedUsedTickets }, 86400)
							socket.emit('count-tick', count)
						}
					}
				} catch (error) {
					console.error('Error:', error)
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

app.get('/ip', async (req, res) => {
	try {
		const ipAddress = req.ip
		res.status(200).json({ ipAddress })
	} catch (error) {
		console.error('Error:', error)
		res.status(500).json({ success: false, message: error.message })
	}
})

// Initialize the server and connect to the database
initializeServer()
