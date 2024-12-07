import { createClient } from 'redis'
import dotenv from 'dotenv'

dotenv.config({
	path: '.env.local',
})

const redisClient = createClient({
	url: process.env.REDIS_URL,
})

redisClient.on('error', (err) => console.error('Redis Client Error', err))

const connectRedis = async () => {
	try {
		await redisClient.connect()
		console.log('Connected to Redis')
	} catch (err) {
		console.error('Could not connect to Redis:', err)
	}
}

const generateCacheKey = (prefix, id) => `${prefix}:${id}`

const setCache = async (key, value, ttl = 3600) => {
	try {
		await redisClient.set(key, JSON.stringify(value), { EX: ttl })
		console.log(`Cache set for key: ${key}`)
	} catch (error) {
		console.error('Error setting cache:', error)
	}
}

const getCache = async (key) => {
	try {
		const cachedData = await redisClient.get(key)
		if (cachedData) {
			console.log(`Cache hit for key: ${key}`)
			return JSON.parse(cachedData)
		}
		console.log(`Cache miss for key: ${key}`)
		return null
	} catch (err) {
		console.error(`Error retrieving cache for key ${key}:`, err)
		return null
	}
}

const deleteCache = async (key) => {
	try {
		await redisClient.del(key)
		console.log(`Cache deleted for key: ${key}`)
	} catch (error) {
		console.error('Error deleting cache:', error)
	}
}

const clearCache = async () => {
	try {
		await redisClient.flushAll()
		console.log('All cache cleared')
	} catch (err) {
		console.error('Error clearing cache:', err)
	}
}

export { redisClient, connectRedis, generateCacheKey, setCache, getCache, deleteCache, clearCache }
