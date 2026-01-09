// Alternative: Netlify Function triggered directly by form submission
// This is called automatically when a form is submitted (if configured in netlify.toml)

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event, context) => {
  try {
    // Netlify Forms passes data in event.body as JSON
    const formData = JSON.parse(event.body);
    
    // Extract form fields
    const email = formData.payload?.data?.email || formData.email;
    const navn = formData.payload?.data?.navn || formData.navn || 'Kunde';
    const tjeneste = formData.payload?.data?.tjeneste || formData.tjeneste || 'Ikke spesifisert';
    const formName = formData.payload?.form_name || formData['form-name'] || 'kontakt';
    
    // Only process if it's our contact form
    if (formName !== 'kontakt') {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Form not processed' })
      };
    }
    
    // Validate email
    if (!email) {
      console.error('No email found:', formData);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Send thank-you email
    const { data, error } = await resend.emails.send({
      from: 'NordMail <noreply@nordmails.net>', // Update with your verified domain
      to: email,
      subject: 'Takk for din henvendelse - NordMail',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #0a0e27;
              color: #4fc3f7;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background-color: #4fc3f7;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NordMail</h1>
          </div>
          <div class="content">
            <h2>Hei ${navn}!</h2>
            <p>Takk for at du tok kontakt med NordMail. Vi har mottatt din henvendelse og setter stor pris på at du er interessert i våre tjenester.</p>
            
            <p><strong>Din forespørsel:</strong><br>
            Tjeneste: ${tjeneste}</p>
            
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
            <p>Denne e-posten ble sendt til ${email}</p>
          </div>
        </body>
        </html>
      `,
      text: `
Hei ${navn}!

Takk for at du tok kontakt med NordMail. Vi har mottatt din henvendelse og setter stor pris på at du er interessert i våre tjenester.

Din forespørsel:
Tjeneste: ${tjeneste}

Vi vil gjennomgå din henvendelse og ta kontakt med deg innen 24 timer med et uforpliktende tilbud basert på dine behov.

I mellomtiden kan du utforske våre tjenester på https://nordmails.net/services.html eller se våre pakker på https://nordmails.net/pricing.html

Hvis du har spørsmål i mellomtiden, ikke nøl med å svare på denne e-posten.

Med vennlig hilsen,
Teamet på NordMail

---
NordMail - Email marketing for norske bedrifter
Denne e-posten ble sendt til ${email}
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to send email', details: error })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Email sent successfully',
        emailId: data?.id 
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
