# Property Recommendation API

This project is a Node.js application designed to provide property recommendations by processing user input, querying a MongoDB database, and evaluating results based on relevance. It leverages AI to extract user preferences, compile search queries, and rank properties based on their alignment with user criteria.

## Features

- **User Preference Extraction**: Analyzes user input using AI to generate structured preferences.
- **Dynamic Query Generation**: Builds MongoDB queries based on extracted preferences.
- **Relevance Scoring**: Evaluates properties using AI and assigns relevance scores (0-100).
- **Automated Currency Conversion**: Handles budget inputs in different currencies and converts them to THB.
- **MongoDB Integration**: Seamlessly interacts with MongoDB to fetch and store property data.
- **Express API**: Provides a simple REST API endpoint for property recommendations.

## Project Structure

- **`app.js`**: Main entry point that sets up the Express server and API routes.
- **`config/db.js`**: Manages MongoDB connection and disconnection.
- **`utils/`**: Contains utility scripts for core functionality
- **`models/`**: Placeholder for potential MongoDB schemas (e.g., `Property` model).

## Requirements

- **Node.js** (v16 or higher recommended)
- **MongoDB** instance (local or cloud-based)
- Environment variables for MongoDB credentials (see setup instructions below)

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/poompengcharoen/property-recommendation-api.git
   cd property-recommendation-api
   ```

2. **Install dependencies**:

   ```bash
   yarn
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory with the following variables:

   ```plaintext
   DB_HOST=<your_db_host>
   DB_USER=<your_db_user>
   DB_PASSWORD=<your_db_password>
   DB_NAME=<your_db_name>
   DB_REPLICA_SET=<your_replica_set>
   PORT=<your_preferred_port>
   ```

4. **Run the application**:
   - For production:
     ```bash
     yarn start
     ```
   - For development (with live reload):
     ```bash
     yarn dev
     ```

## Usage

The API provides an endpoint for property recommendations:

### **POST** `/`

#### Request Body:

```json
{
	"prompt": "Looking for a 3-bedroom house near the beach in Phuket with a budget of 40,000 THB."
}
```

#### Response:

```json
{
	"success": true,
	"prompt": "Looking for a 3-bedroom house near the beach in Phuket with a budget of 40,000 THB.",
	"results": [
		{
			"title": "Beachfront Villa",
			"type": "house",
			"price": "35,000 THB",
			"bedrooms": 3,
			"bathrooms": 2,
			"location": "Phuket",
			"description": "Beautiful house near the beach with modern amenities.",
			"keywords": ["beach", "villa", "modern"],
			"relevance": 95
		}
	]
}
```

## MongoDB Query Logic

The MongoDB query is dynamically built based on user preferences, including:

- **Title**: Matches property title and description.
- **Type**: Filters for specific property types (e.g., house, condo).
- **Budget**: Converts user budget to THB and matches within range.
- **Bedrooms/Bathrooms**: Matches exact numbers or ranges.
- **Location**: Filters by location.
- **Keywords**: Prioritizes properties with relevant keywords.
- **Avoids**: Excludes properties with undesirable features.

## AI Integration

- **Preference Extraction**: Uses the `ollama` API with the `llama3.2` model to parse user input into structured preferences.
- **Relevance Scoring**: Evaluates fetched properties against user preferences and assigns scores.

## Dependencies

- **dotenv**: For managing environment variables.
- **mongoose**: For MongoDB integration.
- **express**: For building the REST API.
- **ollama**: For AI-based preference extraction and relevance scoring.

## Error Handling

- **Database Connection**: Logs and exits on failure to connect to MongoDB.
- **Invalid Input**: Returns an appropriate error message for missing or invalid input.
- **AI API Errors**: Handles failures gracefully and logs detailed errors.

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-branch
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add new feature'
   ```
4. Push to your branch:
   ```bash
   git push origin feature-branch
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please open an issue or contact [poom.pengcharoen@gmail.com].
