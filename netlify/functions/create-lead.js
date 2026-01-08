// Netlify Function: create-lead
// Stores contact form submissions in Neon PostgreSQL database
// Replaces previous Netlify Forms submission handling

const { Client } = require('pg');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    let client;

    try {
        // Parse request body
        const data = JSON.parse(event.body);
        const { name, email, website, service, budget, message } = data;

        // Validate required fields
        if (!name || !email || !service || !budget) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Connect to Neon PostgreSQL using DATABASE_URL from environment
        client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        await client.connect();

        // Insert lead into database
        const query = `
            INSERT INTO leads (name, email, website, service, budget, message)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        const values = [name, email, website || null, service, budget, message || null];

        const result = await client.query(query, values);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                id: result.rows[0].id
            })
        };

    } catch (error) {
        console.error('Error creating lead:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    } finally {
        if (client) {
            await client.end();
        }
    }
};
