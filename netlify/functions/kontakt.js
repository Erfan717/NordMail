/**
 * Netlify Function: Kontakt form submission handler
 * 
 * This function is triggered via webhook when Netlify Forms receives a submission
 * Sends:
 * 1. Admin notification email with all form fields
 * 2. Auto-reply confirmation email to submitter
 * 3. Optionally saves to Neon database if DATABASE_URL is set
 */

const { Resend } = require('resend');
const { Pool } = require('@neondatabase/serverless');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Neon pool (only if DATABASE_URL is set)
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitize string input to prevent injection
 */
function sanitize(input) {
  if (!input) return '';
  return String(input).trim().slice(0, 10000); // Max length
}

/**
 * Parse form data from Netlify Forms webhook payload
 */
function parseFormData(eventBody) {
  try {
    const payload = JSON.parse(eventBody);
    
    // Netlify Forms webhook structure:
    // {
    //   "payload": {
    //     "data": {
    //       "navn": "...",
    //       "email": "...",
    //       ...
    //     },
    //     "form_name": "kontakt"
    //   }
    // }
    
    if (!payload || !payload.payload) {
      throw new Error('Invalid payload structure');
    }

    const formName = payload.payload.form_name;
    const data = payload.payload.data || {};
    
    // Check honeypot field
    if (data['bot-field'] && data['bot-field'].trim() !== '') {
      throw new Error('Honeypot field was filled - likely spam');
    }

    return {
      formName,
      navn: sanitize(data.navn || ''),
      email: sanitize(data.email || '').toLowerCase(),
      nettside: sanitize(data.nettside || ''),
      tjeneste: sanitize(data.tjeneste || ''),
      budsjett: sanitize(data.budsjett || ''),
      melding: sanitize(data.melding || ''),
      timestamp: payload.payload.created_at || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing form data:', error);
    throw new Error(`Failed to parse form data: ${error.message}`);
  }
}

/**
 * Save submission to Neon database (if enabled)
 */
async function saveToDatabase(formData) {
  if (!pool) {
    return { saved: false, reason: 'Database not configured' };
  }

  try {
    await pool.query(
      `INSERT INTO form_submissions 
       (navn, email, nettside, tjeneste, budsjett, melding, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        formData.navn,
        formData.email,
        formData.nettside || null,
        formData.tjeneste,
        formData.budsjett,
        formData.melding || null,
        formData.timestamp
      ]
    );
    return { saved: true };
  } catch (error) {
    console.error('Database save error:', error);
    // Don't fail the function if database save fails
    return { saved: false, reason: error.message };
  }
}

/**
 * Send admin notification email
 */
async function sendAdminEmail(formData) {
  const adminEmail = process.env.MAIL_TO_ADMIN || 'kontakt@nordmails.net';
  const mailFrom = process.env.MAIL_FROM || 'NordMail <kontakt@nordmails.net>';

  const emailContent = {
    from: mailFrom,
    to: adminEmail,
    subject: `Ny henvendelse fra ${formData.navn || 'Ukjent'} - NordMail`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0a0e27; color: #4fc3f7; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .field { margin: 15px 0; padding: 10px; background: white; border-left: 3px solid #4fc3f7; }
          .label { font-weight: bold; color: #0a0e27; }
          .value { margin-top: 5px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Ny henvendelse mottatt</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Navn:</div>
              <div class="value">${formData.navn || 'Ikke oppgitt'}</div>
            </div>
            <div class="field">
              <div class="label">E-post:</div>
              <div class="value">${formData.email}</div>
            </div>
            ${formData.nettside ? `
            <div class="field">
              <div class="label">Nettside:</div>
              <div class="value">${formData.nettside}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">Ønsket tjeneste:</div>
              <div class="value">${formData.tjeneste || 'Ikke oppgitt'}</div>
            </div>
            <div class="field">
              <div class="label">Budsjett:</div>
              <div class="value">${formData.budsjett || 'Ikke oppgitt'}</div>
            </div>
            ${formData.melding ? `
            <div class="field">
              <div class="label">Melding:</div>
              <div class="value">${formData.melding.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">Sendt:</div>
              <div class="value">${new Date(formData.timestamp).toLocaleString('no-NO')}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ny henvendelse mottatt

Navn: ${formData.navn || 'Ikke oppgitt'}
E-post: ${formData.email}
${formData.nettside ? `Nettside: ${formData.nettside}\n` : ''}
Ønsket tjeneste: ${formData.tjeneste || 'Ikke oppgitt'}
Budsjett: ${formData.budsjett || 'Ikke oppgitt'}
${formData.melding ? `\nMelding:\n${formData.melding}\n` : ''}

Sendt: ${new Date(formData.timestamp).toLocaleString('no-NO')}
    `.trim()
  };

  const result = await resend.emails.send(emailContent);
  return result;
}

/**
 * Send auto-reply confirmation email to submitter
 */
async function sendAutoReply(formData) {
  const mailFrom = process.env.MAIL_FROM || 'NordMail <kontakt@nordmails.net>';

  const tjenesteLabels = {
    'klaviyo-setup': 'Klaviyo Setup',
    'email-flows': 'Email Flows',
    'kampanjer': 'Kampanjer & Nyhetsbrev',
    'optimalisering': 'Optimalisering',
    'komplett': 'Komplett løsning',
    'annet': 'Annet'
  };

  const tjenesteText = tjenesteLabels[formData.tjeneste] || formData.tjeneste || 'Ikke spesifisert';

  const emailContent = {
    from: mailFrom,
    to: formData.email,
    replyTo: process.env.MAIL_TO_ADMIN || 'kontakt@nordmails.net',
    subject: 'Takk for din henvendelse - NordMail',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0a0e27; color: #4fc3f7; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .summary { background: white; padding: 15px; margin: 20px 0; border-left: 3px solid #4fc3f7; }
          .button { display: inline-block; background-color: #4fc3f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NordMail</h1>
          </div>
          <div class="content">
            <h2>Hei ${formData.navn || 'Kunde'}!</h2>
            <p>Takk for at du tok kontakt med NordMail. Vi har mottatt din henvendelse og setter stor pris på at du er interessert i våre tjenester.</p>
            
            <div class="summary">
              <strong>Din forespørsel:</strong><br>
              Tjeneste: ${tjenesteText}<br>
              ${formData.budsjett ? `Budsjett: ${formData.budsjett}<br>` : ''}
              ${formData.melding ? `<br>Melding:<br>${formData.melding.replace(/\n/g, '<br>')}` : ''}
            </div>
            
            <p>Vi vil gjennomgå din henvendelse og ta kontakt med deg innen 24 timer med et uforpliktende tilbud basert på dine behov.</p>
            
            <p>I mellomtiden kan du:</p>
            <ul>
              <li>Utforske våre <a href="https://nordmails.net/services.html">tjenester</a></li>
              <li>Se våre <a href="https://nordmails.net/pricing.html">pakker og priser</a></li>
              <li>Lære mer <a href="https://nordmails.net/about.html">om oss</a></li>
            </ul>
            
            <p>Hvis du har spørsmål i mellomtiden, ikke nøl med å svare på denne e-posten.</p>
            
            <p>Med vennlig hilsen,<br>
            <strong>Teamet på NordMail</strong></p>
            
            <a href="https://nordmails.net" class="button">Besøk vår nettside</a>
          </div>
          <div class="footer">
            <p>NordMail - Email marketing for norske bedrifter</p>
            <p>Denne e-posten ble sendt til ${formData.email}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hei ${formData.navn || 'Kunde'}!

Takk for at du tok kontakt med NordMail. Vi har mottatt din henvendelse og setter stor pris på at du er interessert i våre tjenester.

Din forespørsel:
Tjeneste: ${tjenesteText}
${formData.budsjett ? `Budsjett: ${formData.budsjett}\n` : ''}
${formData.melding ? `\nMelding:\n${formData.melding}\n` : ''}

Vi vil gjennomgå din henvendelse og ta kontakt med deg innen 24 timer med et uforpliktende tilbud basert på dine behov.

I mellomtiden kan du utforske våre tjenester på https://nordmails.net/services.html eller se våre pakker på https://nordmails.net/pricing.html

Hvis du har spørsmål i mellomtiden, ikke nøl med å svare på denne e-posten.

Med vennlig hilsen,
Teamet på NordMail

---
NordMail - Email marketing for norske bedrifter
Denne e-posten ble sendt til ${formData.email}
    `.trim()
  };

  const result = await resend.emails.send(emailContent);
  return result;
}

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const startTime = Date.now();
  let formData = null;

  try {
    // Parse form data
    formData = parseFormData(event.body);

    // Validate form name
    if (formData.formName !== 'kontakt') {
      console.warn(`Received submission for form "${formData.formName}", expected "kontakt"`);
      return {
        statusCode: 200, // Return 200 to avoid webhook retries
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: 'Form name mismatch, ignoring',
          received: formData.formName
        })
      };
    }

    // Validate email
    if (!isValidEmail(formData.email)) {
      console.error('Invalid email:', formData.email);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    // Validate required fields
    if (!formData.navn || !formData.tjeneste || !formData.budsjett) {
      console.error('Missing required fields:', formData);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Save to database (if enabled) - don't wait for it
    const dbPromise = saveToDatabase(formData).catch(err => {
      console.error('Database save failed (non-critical):', err);
      return { saved: false, reason: err.message };
    });

    // Send emails in parallel
    const [adminResult, autoReplyResult] = await Promise.allSettled([
      sendAdminEmail(formData),
      sendAutoReply(formData)
    ]);

    // Check results
    const adminSuccess = adminResult.status === 'fulfilled';
    const autoReplySuccess = autoReplyResult.status === 'fulfilled';

    if (!adminSuccess) {
      console.error('Admin email failed:', adminResult.reason);
    }
    if (!autoReplySuccess) {
      console.error('Auto-reply email failed:', autoReplyResult.reason);
    }

    // Wait for database save
    const dbResult = await dbPromise;

    const duration = Date.now() - startTime;

    // Return success if at least admin email was sent
    if (adminSuccess && autoReplySuccess) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Emails sent successfully',
          adminEmail: adminSuccess,
          autoReply: autoReplySuccess,
          database: dbResult,
          duration: `${duration}ms`
        })
      };
    } else if (adminSuccess) {
      // Admin email sent, but auto-reply failed - still success
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Admin email sent, auto-reply failed',
          adminEmail: true,
          autoReply: false,
          autoReplyError: autoReplyResult.reason?.message,
          database: dbResult,
          duration: `${duration}ms`
        })
      };
    } else {
      // Both failed - this is an error
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'Failed to send emails',
          adminEmailError: adminResult.reason?.message,
          autoReplyError: autoReplyResult.reason?.message,
          database: dbResult
        })
      };
    }

  } catch (error) {
    console.error('Function error:', error);
    
    // Log error details (but don't expose sensitive info)
    const errorMessage = error.message || 'Unknown error';
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred processing your request'
      })
    };
  }
};
