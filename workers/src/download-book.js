/**
 * Book Download Handler
 * Serves watermarked PDFs from R2 with token validation
 */

import { jsonResponse } from './utils.js';

/**
 * Handle book download request
 * @param {string} token - Download token from URL
 * @param {Object} env - Environment bindings (DB, R2)
 * @returns {Response} - PDF file or error response
 */
export async function handleBookDownload(token, env) {
    try {
        if (!token) {
            return jsonResponse(false, 'Download token is required', {}, 400);
        }

        // Look up purchase record in database
        if (!env.DB) {
            throw new Error('Database not configured');
        }

        const purchase = await env.DB.prepare(`
            SELECT * FROM book_purchases
            WHERE download_token = ?
            AND expiry_date > datetime('now')
            LIMIT 1
        `).bind(token).first();

        if (!purchase) {
            return jsonResponse(false, 'Invalid or expired download link', {}, 404);
        }

        // Check download limit (max 5 downloads)
        if (purchase.download_count >= 5) {
            return jsonResponse(false, 'Download limit exceeded. Please contact support.', {}, 403);
        }

        // Get watermarked PDF from R2
        if (!env.R2_BUCKET) {
            throw new Error('R2 bucket not configured');
        }

        const pdfObject = await env.R2_BUCKET.get(purchase.r2_filename);
        if (!pdfObject) {
            throw new Error('PDF file not found in storage');
        }

        // Increment download count
        await env.DB.prepare(`
            UPDATE book_purchases
            SET download_count = download_count + 1,
                last_download_date = datetime('now')
            WHERE download_token = ?
        `).bind(token).run();

        // Return PDF with appropriate headers
        return new Response(pdfObject.body, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Jazz_Trumpet_Master_Class_${purchase.receipt_number}.pdf"`,
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
                'X-Robots-Tag': 'noindex, nofollow',
                'X-Downloads-Remaining': String(5 - (purchase.download_count + 1))
            }
        });

    } catch (error) {
        console.error('Book download error:', error);
        return jsonResponse(false, 'Failed to process download request', {}, 500);
    }
}
