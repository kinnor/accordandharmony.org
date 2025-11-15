/**
 * Book Purchase Handler
 * Handles Jazz Trumpet Master Class purchases via PayPal
 * Generates watermarked PDF with buyer information
 * Sends bilingual email with secure download link and tax receipt
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { jsonResponse, validateEmail } from './utils.js';
import { sendEmail } from './email-client.js';

// Email templates for book delivery
const EMAIL_TEMPLATES = {
    en: {
        subject: "Thank you for supporting children's education! Your Jazz Trumpet Master Class",
        thankYou: "Dear",
        intro: "Thank you for your generous donation of {amount}!",
        impact: "Your purchase directly supports vulnerable children in Bulgaria by funding:",
        impact1: "• Tutoring programs and academic support",
        impact2: "• School supplies and educational materials",
        impact3: "• Educational opportunities for children in need",
        downloadTitle: "Download Your Educational Resource",
        downloadText: "Click the button below to download your Jazz Trumpet Master Class PDF:",
        downloadButton: "Download Jazz Trumpet Master Class",
        downloadNote: "This download link is valid for 30 days and allows up to 5 downloads.",
        receiptTitle: "Your Tax-Deductible Donation Receipt",
        receiptNumber: "Receipt Number:",
        receiptAmount: "Donation Amount:",
        receiptDate: "Date:",
        receiptEmail: "Email:",
        receiptNote: "Please keep this receipt for your tax records. This is a charitable donation to Accord and Harmony Foundation, a registered non-profit organization.",
        bookInfo: "About Your Educational Resource:",
        bookFeatures: "• 28 pages of comprehensive jazz trumpet instruction\n• 80+ professional licks from the masters\n• Complete music theory and transposition guide\n• 24-week structured practice curriculum\n• For personal, non-commercial use only",
        support: "Questions or need help?",
        contactUs: "Contact us at contact@acchm.org",
        closing: "Thank you for making a difference in children's lives!",
        signature: "With gratitude,\nThe Accord and Harmony Foundation Team"
    },
    de: {
        subject: "Vielen Dank für die Unterstützung der Bildung von Kindern! Ihre Jazz Trumpet Master Class",
        thankYou: "Liebe/r",
        intro: "Vielen Dank für Ihre großzügige Spende von {amount}!",
        impact: "Ihr Kauf unterstützt direkt gefährdete Kinder in Bulgarien durch die Finanzierung von:",
        impact1: "• Nachhilfeprogrammen und akademischer Unterstützung",
        impact2: "• Schulmaterial und Bildungsmaterialien",
        impact3: "• Bildungsmöglichkeiten für bedürftige Kinder",
        downloadTitle: "Laden Sie Ihre Bildungsressource herunter",
        downloadText: "Klicken Sie auf die Schaltfläche unten, um Ihr Jazz Trumpet Master Class PDF herunterzuladen:",
        downloadButton: "Jazz Trumpet Master Class herunterladen",
        downloadNote: "Dieser Download-Link ist 30 Tage gültig und erlaubt bis zu 5 Downloads.",
        receiptTitle: "Ihre steuerlich absetzbare Spendenquittung",
        receiptNumber: "Quittungsnummer:",
        receiptAmount: "Spendenbetrag:",
        receiptDate: "Datum:",
        receiptEmail: "E-Mail:",
        receiptNote: "Bitte bewahren Sie diese Quittung für Ihre Steuerunterlagen auf. Dies ist eine Spende an die Accord and Harmony Foundation, eine registrierte gemeinnützige Organisation.",
        bookInfo: "Über Ihre Bildungsressource:",
        bookFeatures: "• 28 Seiten umfassende Jazz-Trompeten-Anleitung\n• 80+ professionelle Licks von den Meistern\n• Vollständige Musiktheorie und Transpositionsleitfaden\n• 24-Wochen strukturierter Übungslehrplan\n• Nur für persönliche, nicht-kommerzielle Nutzung",
        support: "Fragen oder Hilfe benötigt?",
        contactUs: "Kontaktieren Sie uns unter contact@acchm.org",
        closing: "Vielen Dank, dass Sie einen Unterschied im Leben von Kindern machen!",
        signature: "Mit Dankbarkeit,\nDas Team der Accord and Harmony Foundation"
    },
    fr: {
        subject: "Merci de soutenir l'éducation des enfants ! Votre Jazz Trumpet Master Class",
        thankYou: "Cher/Chère",
        intro: "Merci pour votre don généreux de {amount} !",
        impact: "Votre achat soutient directement les enfants vulnérables en Bulgarie en finançant :",
        impact1: "• Des programmes de tutorat et de soutien scolaire",
        impact2: "• Des fournitures scolaires et du matériel éducatif",
        impact3: "• Des opportunités éducatives pour les enfants dans le besoin",
        downloadTitle: "Téléchargez votre ressource éducative",
        downloadText: "Cliquez sur le bouton ci-dessous pour télécharger votre PDF Jazz Trumpet Master Class :",
        downloadButton: "Télécharger Jazz Trumpet Master Class",
        downloadNote: "Ce lien de téléchargement est valide pendant 30 jours et permet jusqu'à 5 téléchargements.",
        receiptTitle: "Votre reçu de don déductible d'impôts",
        receiptNumber: "Numéro de reçu :",
        receiptAmount: "Montant du don :",
        receiptDate: "Date :",
        receiptEmail: "E-mail :",
        receiptNote: "Veuillez conserver ce reçu pour vos dossiers fiscaux. Il s'agit d'un don de charité à la Fondation Accord and Harmony, une organisation à but non lucratif enregistrée.",
        bookInfo: "À propos de votre ressource éducative :",
        bookFeatures: "• 28 pages d'instructions complètes pour la trompette jazz\n• 80+ licks professionnels des maîtres\n• Théorie musicale complète et guide de transposition\n• Programme de pratique structuré sur 24 semaines\n• Pour usage personnel et non commercial uniquement",
        support: "Des questions ou besoin d'aide ?",
        contactUs: "Contactez-nous à contact@acchm.org",
        closing: "Merci de faire une différence dans la vie des enfants !",
        signature: "Avec gratitude,\nL'équipe de la Fondation Accord and Harmony"
    },
    bg: {
        subject: "Благодарим ви, че подкрепяте образованието на децата! Вашият Jazz Trumpet Master Class",
        thankYou: "Уважаеми/а",
        intro: "Благодарим ви за щедрото ви дарение от {amount}!",
        impact: "Вашата покупка директно подкрепя уязвими деца в България чрез финансиране на:",
        impact1: "• Програми за допълнително обучение и академична подкрепа",
        impact2: "• Училищни пособия и образователни материали",
        impact3: "• Образователни възможности за деца в нужда",
        downloadTitle: "Изтеглете вашия образователен ресурс",
        downloadText: "Кликнете на бутона по-долу, за да изтеглите вашия PDF Jazz Trumpet Master Class:",
        downloadButton: "Изтеглете Jazz Trumpet Master Class",
        downloadNote: "Този линк за изтегляне е валиден 30 дни и позволява до 5 изтегляния.",
        receiptTitle: "Вашата данъчно приспадаема разписка за дарение",
        receiptNumber: "Номер на разписка:",
        receiptAmount: "Сума на дарението:",
        receiptDate: "Дата:",
        receiptEmail: "Имейл:",
        receiptNote: "Моля, запазете тази разписка за данъчните си документи. Това е благотворително дарение към Фондация Accord and Harmony, регистрирана нестопанска организация.",
        bookInfo: "За вашия образователен ресурс:",
        bookFeatures: "• 28 страници всеобхватни инструкции за джаз тромпет\n• 80+ професионални лика от майсторите\n• Пълна музикална теория и ръководство за транспониране\n• 24-седмична структурирана учебна програма\n• Само за лична, некомерсиална употреба",
        support: "Въпроси или нужда от помощ?",
        contactUs: "Свържете се с нас на contact@acchm.org",
        closing: "Благодарим ви, че правите разлика в живота на децата!",
        signature: "С благодарност,\nЕкипът на Фондация Accord and Harmony"
    }
};

/**
 * Generate secure download token
 */
function generateDownloadToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate receipt number
 */
function generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `AHF-${year}-${random}`;
}

/**
 * Format amount with currency
 */
function formatAmount(amount, currency) {
    const formatted = parseFloat(amount).toFixed(2);
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'CAD': 'CAD$'
    };
    const symbol = symbols[currency] || currency;
    return currency === 'CAD' ? `${symbol}${formatted}` : `${symbol}${formatted} ${currency}`;
}

/**
 * Build HTML email content
 */
function buildEmailHTML(template, data, includeEnglish = false) {
    const { name, email, amount, currency, downloadUrl, receiptNumber, purchaseDate, language } = data;

    const formattedAmount = formatAmount(amount, currency);
    const t = EMAIL_TEMPLATES[language] || EMAIL_TEMPLATES.en;

    let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2E9DD8 0%, #1B76A8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .download-button { display: inline-block; background: linear-gradient(135deg, #2E9DD8 0%, #1B76A8 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .download-button:hover { background: linear-gradient(135deg, #1B76A8 0%, #2E9DD8 100%); }
        .receipt-box { background: #f9f9f9; border-left: 4px solid #6B5B4E; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
        .receipt-row:last-child { border-bottom: none; }
        .impact-list { background: rgba(46, 157, 216, 0.1); padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 10px 10px; }
        .divider { border-top: 2px solid #2E9DD8; margin: 30px 0; }
        .english-section { margin-top: 40px; padding-top: 30px; border-top: 3px dashed #ccc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎺 Jazz Trumpet Master Class</h1>
            <p>${t.subject}</p>
        </div>

        <div class="content">
            <h2>${t.thankYou} ${name || 'Friend'},</h2>
            <p style="font-size: 18px; color: #2E9DD8;"><strong>${t.intro.replace('{amount}', formattedAmount)}</strong></p>

            <div class="impact-list">
                <p><strong>${t.impact}</strong></p>
                <p>${t.impact1}</p>
                <p>${t.impact2}</p>
                <p>${t.impact3}</p>
            </div>

            <div class="divider"></div>

            <h3>${t.downloadTitle}</h3>
            <p>${t.downloadText}</p>
            <center>
                <a href="${downloadUrl}" class="download-button">${t.downloadButton}</a>
            </center>
            <p style="font-size: 13px; color: #666;"><em>${t.downloadNote}</em></p>

            <div class="divider"></div>

            <div class="receipt-box">
                <h3 style="margin-top: 0;">${t.receiptTitle}</h3>
                <div class="receipt-row">
                    <strong>${t.receiptNumber}</strong>
                    <span>${receiptNumber}</span>
                </div>
                <div class="receipt-row">
                    <strong>${t.receiptAmount}</strong>
                    <span>${formattedAmount}</span>
                </div>
                <div class="receipt-row">
                    <strong>${t.receiptDate}</strong>
                    <span>${purchaseDate}</span>
                </div>
                <div class="receipt-row">
                    <strong>${t.receiptEmail}</strong>
                    <span>${email}</span>
                </div>
                <p style="font-size: 13px; color: #666; margin-top: 15px;"><em>${t.receiptNote}</em></p>
            </div>

            <div class="divider"></div>

            <h3>${t.bookInfo}</h3>
            <p style="white-space: pre-line; font-size: 14px;">${t.bookFeatures}</p>

            <div class="divider"></div>

            <p><strong>${t.support}</strong><br>${t.contactUs}</p>
            <p>${t.closing}</p>
            <p style="white-space: pre-line;">${t.signature}</p>
        </div>`;

    // Add English section if language is different
    if (includeEnglish && language !== 'en') {
        const enT = EMAIL_TEMPLATES.en;
        html += `
        <div class="content english-section">
            <h2 style="color: #2E9DD8;">English Version / Version anglaise / Englische Version</h2>
            <h2>${enT.thankYou} ${name || 'Friend'},</h2>
            <p style="font-size: 18px; color: #2E9DD8;"><strong>${enT.intro.replace('{amount}', formattedAmount)}</strong></p>

            <div class="impact-list">
                <p><strong>${enT.impact}</strong></p>
                <p>${enT.impact1}</p>
                <p>${enT.impact2}</p>
                <p>${enT.impact3}</p>
            </div>

            <h3>${enT.downloadTitle}</h3>
            <p>${enT.downloadText}</p>
            <center>
                <a href="${downloadUrl}" class="download-button">${enT.downloadButton}</a>
            </center>
            <p style="font-size: 13px; color: #666;"><em>${enT.downloadNote}</em></p>

            <div class="receipt-box">
                <h3 style="margin-top: 0;">${enT.receiptTitle}</h3>
                <div class="receipt-row">
                    <strong>${enT.receiptNumber}</strong>
                    <span>${receiptNumber}</span>
                </div>
                <div class="receipt-row">
                    <strong>${enT.receiptAmount}</strong>
                    <span>${formattedAmount}</span>
                </div>
                <div class="receipt-row">
                    <strong>${enT.receiptDate}</strong>
                    <span>${purchaseDate}</span>
                </div>
                <div class="receipt-row">
                    <strong>${enT.receiptEmail}</strong>
                    <span>${email}</span>
                </div>
                <p style="font-size: 13px; color: #666; margin-top: 15px;"><em>${enT.receiptNote}</em></p>
            </div>

            <p><strong>${enT.support}</strong><br>${enT.contactUs}</p>
            <p>${enT.closing}</p>
            <p style="white-space: pre-line;">${enT.signature}</p>
        </div>`;
    }

    html += `
        <div class="footer">
            <p>Accord and Harmony Foundation<br>
            Odrin 95 st, Sofia 1303, Bulgaria<br>
            <a href="https://accordandharmony.org">accordandharmony.org</a></p>
        </div>
    </div>
</body>
</html>`;

    return html;
}

/**
 * Generate watermarked PDF with buyer information
 * @param {ArrayBuffer} sourcePdfBytes - Original PDF bytes
 * @param {Object} watermarkData - Buyer information for watermark
 * @returns {Promise<Uint8Array>} - Watermarked PDF bytes
 */
async function generateWatermarkedPDF(sourcePdfBytes, watermarkData) {
    const { name, email, receiptNumber, purchaseDate } = watermarkData;

    // Load the source PDF
    const pdfDoc = await PDFDocument.load(sourcePdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();
    const watermarkColor = rgb(0.4, 0.4, 0.4); // Gray color
    const fontSize = 8;
    const footerFontSize = 6;

    // Add watermark to every page
    pages.forEach((page, index) => {
        const { width, height } = page.getSize();

        // Page number watermark (bottom center)
        const pageNumberText = `Page ${index + 1} of ${pages.length}`;
        const pageNumberWidth = helveticaFont.widthOfTextAtSize(pageNumberText, footerFontSize);
        page.drawText(pageNumberText, {
            x: (width - pageNumberWidth) / 2,
            y: 20,
            size: footerFontSize,
            font: helveticaFont,
            color: watermarkColor,
            opacity: 0.5
        });

        // Buyer information watermark (bottom left)
        const licenseText = `Licensed to: ${name || 'Unknown'}`;
        page.drawText(licenseText, {
            x: 30,
            y: 20,
            size: footerFontSize,
            font: helveticaBold,
            color: watermarkColor,
            opacity: 0.6
        });

        page.drawText(`${email}`, {
            x: 30,
            y: 12,
            size: footerFontSize - 1,
            font: helveticaFont,
            color: watermarkColor,
            opacity: 0.5
        });

        // Receipt information (bottom right)
        const receiptText = `Receipt: ${receiptNumber}`;
        const receiptWidth = helveticaFont.widthOfTextAtSize(receiptText, footerFontSize);
        page.drawText(receiptText, {
            x: width - receiptWidth - 30,
            y: 20,
            size: footerFontSize,
            font: helveticaFont,
            color: watermarkColor,
            opacity: 0.5
        });

        const dateText = new Date(purchaseDate).toLocaleDateString('en-US');
        const dateWidth = helveticaFont.widthOfTextAtSize(dateText, footerFontSize - 1);
        page.drawText(dateText, {
            x: width - dateWidth - 30,
            y: 12,
            size: footerFontSize - 1,
            font: helveticaFont,
            color: watermarkColor,
            opacity: 0.5
        });

        // Copyright notice (top center of first page only)
        if (index === 0) {
            const copyrightText = 'For Personal, Non-Commercial Use Only';
            const copyrightWidth = helveticaBold.widthOfTextAtSize(copyrightText, fontSize);
            page.drawText(copyrightText, {
                x: (width - copyrightWidth) / 2,
                y: height - 30,
                size: fontSize,
                font: helveticaBold,
                color: rgb(0.6, 0.3, 0.2), // Bronze color
                opacity: 0.7
            });
        }
    });

    // Save the watermarked PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

/**
 * Upload watermarked PDF to R2 bucket
 * @param {Uint8Array} pdfBytes - Watermarked PDF bytes
 * @param {string} fileName - Unique filename for the PDF
 * @param {R2Bucket} bucket - R2 bucket instance
 * @returns {Promise<void>}
 */
async function uploadToR2(pdfBytes, fileName, bucket) {
    await bucket.put(fileName, pdfBytes, {
        httpMetadata: {
            contentType: 'application/pdf',
            contentDisposition: `attachment; filename="Jazz_Trumpet_Master_Class_${fileName.split('_')[0]}.pdf"`
        },
        customMetadata: {
            uploadDate: new Date().toISOString()
        }
    });
}

/**
 * Handle book purchase
 */
export async function handleBookPurchase(request, env) {
    if (request.method !== 'POST') {
        return jsonResponse(false, 'Method not allowed', {}, 405);
    }

    try {
        const data = await request.json();
        const { paypalOrderId, email, name, language = 'en', amount, currency } = data;

        // Validate input
        if (!email || !validateEmail(email)) {
            return jsonResponse(false, 'Valid email is required', {}, 400);
        }

        if (!paypalOrderId) {
            return jsonResponse(false, 'PayPal order ID is required', {}, 400);
        }

        // Generate secure download token and receipt
        const downloadToken = generateDownloadToken();
        const receiptNumber = generateReceiptNumber();
        const purchaseDate = new Date().toISOString();
        const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

        // Load source PDF from R2
        if (!env.R2_BUCKET) {
            throw new Error('R2 bucket not configured');
        }

        const sourcePdf = await env.R2_BUCKET.get('books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf');
        if (!sourcePdf) {
            throw new Error('Source PDF not found in R2');
        }

        const sourcePdfBytes = await sourcePdf.arrayBuffer();

        // Generate watermarked PDF
        const watermarkData = {
            name: name || 'Valued Customer',
            email,
            receiptNumber,
            purchaseDate
        };

        const watermarkedPdfBytes = await generateWatermarkedPDF(sourcePdfBytes, watermarkData);

        // Upload watermarked PDF to R2
        const watermarkedFileName = `books/watermarked/${downloadToken}_${receiptNumber}.pdf`;
        await uploadToR2(watermarkedPdfBytes, watermarkedFileName, env.R2_BUCKET);

        // Store purchase in database (if D1 is available)
        if (env.DB) {
            await env.DB.prepare(`
                INSERT INTO book_purchases
                (email, name, language, amount, currency, paypal_order_id, download_token, receipt_number, purchase_date, expiry_date, download_count, r2_filename)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            `).bind(
                email,
                name || '',
                language,
                amount || '25.00',
                currency || 'USD',
                paypalOrderId,
                downloadToken,
                receiptNumber,
                purchaseDate,
                expiryDate,
                watermarkedFileName
            ).run();
        }

        // Build download URL (points to download endpoint with token)
        const downloadUrl = `https://accordandharmony.org/api/download-book/${downloadToken}`;

        // Prepare email data
        const emailData = {
            name: name || 'Friend',
            email,
            amount: amount || '25.00',
            currency: currency || 'USD',
            downloadUrl,
            receiptNumber,
            purchaseDate: new Date(purchaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            language
        };

        // Build HTML email
        const includeEnglish = language !== 'en';
        const htmlContent = buildEmailHTML(EMAIL_TEMPLATES[language] || EMAIL_TEMPLATES.en, emailData, includeEnglish);
        const subject = (EMAIL_TEMPLATES[language] || EMAIL_TEMPLATES.en).subject;

        // Send email via email client
        if (env.RESEND_API_KEY) {
            const emailResult = await sendEmail({
                to: email,
                subject: subject,
                html: htmlContent
            }, env.RESEND_API_KEY);

            if (!emailResult.success) {
                console.error('Failed to send email:', emailResult.error);
                return jsonResponse(false, 'Failed to send email', {}, 500);
            }

            console.log('Email sent successfully:', emailResult.messageId);
        }

        return jsonResponse(true, 'Book purchase successful! Check your email for the download link.', {
            receiptNumber,
            downloadToken, // Only for testing - remove in production
            expiryDate
        });

    } catch (error) {
        console.error('Book purchase error:', error);
        return jsonResponse(false, 'Failed to process book purchase', {}, 500);
    }
}
