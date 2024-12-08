import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redisClient } from '../config/redis.js'

// Set up Redis-based rate limiter
const rateLimiter = new RateLimiterRedis({
	storeClient: redisClient, // Use the existing Redis client from connectRedis
	points: 100, // Number of requests allowed
	duration: 60, // Per 60 seconds
	keyPrefix: 'property-recommendation-api-rate-limiter',
})

// Middleware for rate limiting
const rateLimit = async (req, res, next) => {
	try {
		await rateLimiter.consume(req.ip) // Use IP as a unique identifier
		next()
	} catch (err) {
		res.status(429).json({
			success: false,
			message: 'Too many requests. Please try again later.',
		})
	}
}

export default rateLimit