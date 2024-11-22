import { connectDb } from './configs/db.js'
import express from 'express'
import recommendProperties from './utils/recommendProperties.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// Ensure database connection is established during server startup
const initializeServer = async () => {
	try {
		await connectDb()
		console.log('Database connected successfully')

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

	try {
		const { results } = await recommendProperties(prompt)
		res.status(200).json({ success: true, prompt, results })
	} catch (error) {
		console.error(error)
		res.status(500).json({ success: false, message: error.message })
	}
})

// Initialize the server and connect to the database
initializeServer()
