#!/bin/bash

# Upload Master PDF to R2 Bucket
# This script uploads the Jazz Trumpet Master Class PDF to the R2 bucket

set -e

echo "=========================================="
echo "Uploading Master PDF to R2 Bucket"
echo "=========================================="
echo ""

# Check if PDF exists
PDF_PATH="../downloads/books/JAZZ_TRUMPET_MASTER_CLASS.pdf"
if [ ! -f "$PDF_PATH" ]; then
    echo "❌ Error: PDF not found at $PDF_PATH"
    exit 1
fi

echo "✓ PDF found: $PDF_PATH"
PDF_SIZE=$(du -h "$PDF_PATH" | cut -f1)
echo "  Size: $PDF_SIZE"
echo ""

# Upload to R2 bucket (development)
echo "Uploading to R2 bucket (development)..."
npx wrangler r2 object put accordharmony-files-dev/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf \
    --file="$PDF_PATH" \
    --content-type="application/pdf"

echo ""
echo "✓ Upload complete!"
echo ""
echo "To upload to production bucket, run:"
echo "npx wrangler r2 object put accordharmony-files-prod/books/master/JAZZ_TRUMPET_MASTER_CLASS.pdf \\"
echo "    --file=\"$PDF_PATH\" \\"
echo "    --content-type=\"application/pdf\""
echo ""
echo "=========================================="
