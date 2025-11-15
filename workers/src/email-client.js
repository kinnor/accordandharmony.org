/**
 * Simple Email Client
 * Unified email sending functionality using Resend API
 */

/**
 * Send an email via Resend
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} params.from - Sender (optional, defaults to noreply@accordandharmony.org)
 * @param {string} apiKey - Resend API key
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 */
export async function sendEmail({ to, subject, html, from }, apiKey) {
    if (!apiKey) {
        throw new Error('Resend API key is required');
    }

    if (!to || !subject || !html) {
        throw new Error('Missing required email parameters: to, subject, html');
    }

    // Use Resend test domain until accordandharmony.org is verified
    const sender = from || 'Accord and Harmony Foundation <onboarding@resend.dev>';

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: sender,
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: html
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Email send failed:', result);
            return {
                success: false,
                error: result.message || 'Failed to send email'
            };
        }

        return {
            success: true,
            messageId: result.id
        };

    } catch (error) {
        console.error('Email send error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Build a simple HTML email template
 * @param {Object} params - Template parameters
 * @param {string} params.title - Email title/heading
 * @param {string} params.content - Main content (can include HTML)
 * @param {string} params.buttonText - Call-to-action button text (optional)
 * @param {string} params.buttonUrl - Call-to-action button URL (optional)
 * @param {string} params.footer - Footer text (optional)
 * @returns {string} - HTML email content
 */
export function buildSimpleEmailTemplate({ title, content, buttonText, buttonUrl, footer }) {
    const hasButton = buttonText && buttonUrl;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #2E9DD8 0%, #1B76A8 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .content p {
            margin: 0 0 15px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #2E9DD8 0%, #1B76A8 100%);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background: linear-gradient(135deg, #1B76A8 0%, #2E9DD8 100%);
        }
        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            margin: 5px 0;
        }
        .footer a {
            color: #2E9DD8;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${content}
            ${hasButton ? `
            <center>
                <a href="${buttonUrl}" class="button">${buttonText}</a>
            </center>
            ` : ''}
        </div>
        <div class="footer">
            ${footer || `
            <p><strong>Accord and Harmony Foundation</strong></p>
            <p>Odrin 95 st, Sofia 1303, Bulgaria</p>
            <p><a href="https://accordandharmony.org">accordandharmony.org</a></p>
            <p><a href="mailto:contact@acchm.org">contact@acchm.org</a></p>
            `}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send a simple notification email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Plain text message (will be converted to HTML)
 * @param {string} params.buttonText - Optional button text
 * @param {string} params.buttonUrl - Optional button URL
 * @param {string} apiKey - Resend API key
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 */
export async function sendNotification({ to, subject, message, buttonText, buttonUrl }, apiKey) {
    const html = buildSimpleEmailTemplate({
        title: subject,
        content: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        buttonText,
        buttonUrl
    });

    return await sendEmail({ to, subject, html }, apiKey);
}

/**
 * Send a welcome email to new subscribers/donors
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.name - Recipient name
 * @param {string} params.language - Language code (en, de, fr, bg)
 * @param {string} apiKey - Resend API key
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 */
export async function sendWelcomeEmail({ to, name, language = 'en' }, apiKey) {
    const messages = {
        en: {
            subject: 'Welcome to Accord and Harmony Foundation!',
            title: 'Welcome!',
            content: `
                <p>Dear ${name || 'Friend'},</p>
                <p>Thank you for your interest in Accord and Harmony Foundation!</p>
                <p>We are dedicated to supporting children's education in Bulgaria through tutoring programs, school supplies, and educational opportunities.</p>
                <p>Your support makes a real difference in children's lives.</p>
                <p>Thank you for being part of our community!</p>
                <p>With gratitude,<br>The Accord and Harmony Foundation Team</p>
            `
        },
        de: {
            subject: 'Willkommen bei der Accord and Harmony Foundation!',
            title: 'Willkommen!',
            content: `
                <p>Liebe/r ${name || 'Freund/in'},</p>
                <p>Vielen Dank für Ihr Interesse an der Accord and Harmony Foundation!</p>
                <p>Wir setzen uns dafür ein, die Bildung von Kindern in Bulgarien durch Nachhilfeprogramme, Schulmaterial und Bildungsmöglichkeiten zu unterstützen.</p>
                <p>Ihre Unterstützung macht einen echten Unterschied im Leben von Kindern.</p>
                <p>Vielen Dank, dass Sie Teil unserer Gemeinschaft sind!</p>
                <p>Mit Dankbarkeit,<br>Das Team der Accord and Harmony Foundation</p>
            `
        },
        fr: {
            subject: 'Bienvenue à la Fondation Accord and Harmony!',
            title: 'Bienvenue!',
            content: `
                <p>Cher/Chère ${name || 'Ami(e)'},</p>
                <p>Merci de votre intérêt pour la Fondation Accord and Harmony!</p>
                <p>Nous nous consacrons à soutenir l'éducation des enfants en Bulgarie à travers des programmes de tutorat, des fournitures scolaires et des opportunités éducatives.</p>
                <p>Votre soutien fait une vraie différence dans la vie des enfants.</p>
                <p>Merci de faire partie de notre communauté!</p>
                <p>Avec gratitude,<br>L'équipe de la Fondation Accord and Harmony</p>
            `
        },
        bg: {
            subject: 'Добре дошли в Фондация Accord and Harmony!',
            title: 'Добре дошли!',
            content: `
                <p>Уважаеми/а ${name || 'Приятелю'},</p>
                <p>Благодарим ви за интереса към Фондация Accord and Harmony!</p>
                <p>Ние се посвещаваме на подкрепата на образованието на деца в България чрез програми за допълнително обучение, училищни пособия и образователни възможности.</p>
                <p>Вашата подкрепа прави истинска разлика в живота на децата.</p>
                <p>Благодарим ви, че сте част от нашата общност!</p>
                <p>С благодарност,<br>Екипът на Фондация Accord and Harmony</p>
            `
        }
    };

    const msg = messages[language] || messages.en;

    const html = buildSimpleEmailTemplate({
        title: msg.title,
        content: msg.content,
        buttonText: language === 'en' ? 'Visit Our Website' : 'Besuchen Sie unsere Website',
        buttonUrl: 'https://accordandharmony.org'
    });

    return await sendEmail({
        to,
        subject: msg.subject,
        html
    }, apiKey);
}

/**
 * Send contact form notification to admin
 * @param {Object} params - Contact form data
 * @param {string} params.name - Sender name
 * @param {string} params.email - Sender email
 * @param {string} params.message - Message content
 * @param {string} adminEmail - Admin email to receive notification
 * @param {string} apiKey - Resend API key
 * @returns {Promise<Object>} - { success: boolean, messageId?: string, error?: string }
 */
export async function sendContactNotification({ name, email, message }, adminEmail, apiKey) {
    const html = buildSimpleEmailTemplate({
        title: 'New Contact Form Submission',
        content: `
            <p><strong>New message from the contact form:</strong></p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p style="background: #f5f5f5; padding: 15px; border-left: 4px solid #2E9DD8;">
                ${message.replace(/\n/g, '<br>')}
            </p>
            <p style="font-size: 12px; color: #666;">Reply to: <a href="mailto:${email}">${email}</a></p>
        `,
        buttonText: 'Reply to Sender',
        buttonUrl: `mailto:${email}`
    });

    return await sendEmail({
        to: adminEmail,
        subject: `Contact Form: ${name}`,
        html,
        from: `Contact Form <noreply@accordandharmony.org>`
    }, apiKey);
}
