/**
 * Download API Endpoint
 * Handles secure PDF download with token validation and rate limiting
 */

import { jsonResponse } from './utils.js';
import { DownloadDB, AuditLogDB } from './db.js';
import { generateWatermarkedPDF, getWatermarkedPDF } from './pdf-watermark.js';
import { getRequestInfo } from './auth.js';

/**
 * GET /api/download?token=xxx
 * Download purchased book with secure token
 */
export async function handleDownload(request, env) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return jsonResponse(false, 'Download token required', {}, 400);
    }

    // Find download record by token
    const downloadResult = await DownloadDB.findByToken(env.DB, token);

    if (!downloadResult.success || !downloadResult.result) {
      return jsonResponse(false, 'Invalid or expired download link', {}, 404);
    }

    const download = downloadResult.result;

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(download.token_expires_at);

    if (now > expiresAt) {
      return jsonResponse(false, 'Download link has expired. Please contact support.', {}, 403);
    }

    // Check download limit
    if (download.download_count >= download.max_downloads) {
      return jsonResponse(false, `Maximum download limit (${download.max_downloads}) reached. Please contact support if you need additional downloads.`, {}, 403);
    }

    // Get request info for logging
    const requestInfo = getRequestInfo(request);

    // Check if watermarked file exists
    let watermarkedFileKey = download.watermarked_file_key;

    if (!watermarkedFileKey) {
      // Generate watermarked PDF on first download
      const watermarkResult = await generateWatermarkedPDF(env, {
        originalFileKey: download.file_key,
        userName: download.full_name,
        userEmail: download.email,
        transactionId: download.transaction_id,
        productName: download.product_name
      });

      if (!watermarkResult.success) {
        console.error('Watermarking failed:', watermarkResult.error);
        return jsonResponse(false, 'Failed to prepare download. Please try again.', {}, 500);
      }

      watermarkedFileKey = watermarkResult.watermarkedFileKey;

      // Update download record with watermarked file key
      await DownloadDB.updateWatermarkedFile(env.DB, download.id, watermarkedFileKey);
    }

    // Get the watermarked PDF
    const pdfResult = await getWatermarkedPDF(env, watermarkedFileKey);

    if (!pdfResult.success) {
      console.error('Failed to retrieve PDF:', pdfResult.error);
      return jsonResponse(false, 'Failed to retrieve file. Please contact support.', {}, 500);
    }

    // Increment download count
    await DownloadDB.incrementDownload(env.DB, download.id, requestInfo.ipAddress);

    // Log the download
    await AuditLogDB.create(env.DB, {
      user_id: download.user_id,
      action_type: 'download',
      entity_type: 'download',
      entity_id: download.id,
      ip_address: requestInfo.ipAddress,
      user_agent: requestInfo.userAgent,
      changes: {
        product_id: download.product_id,
        download_count: download.download_count + 1
      }
    });

    // Return the PDF file
    const filename = `${download.product_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    return new Response(pdfResult.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfResult.size.toString(),
        'Cache-Control': 'no-store, must-revalidate',
        'X-Download-Token': token,
        'X-Downloads-Remaining': (download.max_downloads - download.download_count - 1).toString()
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    return jsonResponse(false, 'Download failed. Please try again or contact support.', {}, 500);
  }
}

/**
 * GET /api/download/info?token=xxx
 * Get download information without downloading
 */
export async function handleDownloadInfo(request, env) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return jsonResponse(false, 'Download token required', {}, 400);
    }

    // Find download record
    const downloadResult = await DownloadDB.findByToken(env.DB, token);

    if (!downloadResult.success || !downloadResult.result) {
      return jsonResponse(false, 'Invalid download link', {}, 404);
    }

    const download = downloadResult.result;

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(download.token_expires_at);
    const isExpired = now > expiresAt;

    return jsonResponse(true, 'Download info retrieved', {
      product_name: download.product_name,
      download_count: download.download_count,
      max_downloads: download.max_downloads,
      downloads_remaining: download.max_downloads - download.download_count,
      expires_at: download.token_expires_at,
      is_expired: isExpired,
      first_download_at: download.first_download_at,
      last_download_at: download.last_download_at
    });

  } catch (error) {
    console.error('Download info error:', error);
    return jsonResponse(false, 'Failed to get download info', {}, 500);
  }
}

/**
 * POST /api/download/resend
 * Resend download link email (requires authentication)
 */
export async function handleResendDownloadLink(request, env, authResult) {
  try {
    if (!authResult.authenticated) {
      return jsonResponse(false, authResult.error, {}, authResult.status);
    }

    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return jsonResponse(false, 'Transaction ID required', {}, 400);
    }

    // Get download record
    const query = `
      SELECT d.*, t.amount_cents, t.currency, p.name as product_name
      FROM downloads d
      JOIN transactions t ON d.transaction_id = t.id
      JOIN products p ON d.product_id = p.id
      WHERE d.transaction_id = ? AND d.user_id = ?
    `;

    const result = await env.DB.prepare(query).bind(transactionId, authResult.user.id).first();

    if (!result) {
      return jsonResponse(false, 'Download not found', {}, 404);
    }

    // Resend the email
    const { sendPurchaseConfirmationEmail } = await import('./email-service.js');

    await sendPurchaseConfirmationEmail(env, {
      to: authResult.user.email,
      userName: authResult.user.full_name,
      productName: result.product_name,
      amount: result.amount_cents / 100,
      currency: result.currency,
      downloadToken: result.download_token,
      transactionId: transactionId
    });

    return jsonResponse(true, 'Download link sent to your email');

  } catch (error) {
    console.error('Resend download link error:', error);
    return jsonResponse(false, 'Failed to resend link', {}, 500);
  }
}
