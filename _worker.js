/**
 * Cloudflare Pages _worker.js
 * Routes /api/* requests to the deployed Worker
 *
 * This file integrates the deployed Worker (accordandharmony-workers)
 * with the static Cloudflare Pages site.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route all /api/* requests to the Worker
    if (url.pathname.startsWith('/api/')) {
      // Check if API service binding exists
      if (!env.API) {
        return new Response(JSON.stringify({
          success: false,
          message: 'API service not configured. Please bind accordandharmony-workers to this Pages project.',
          hint: 'Go to Pages Settings → Functions → Service Bindings → Add binding (Variable: API, Service: accordandharmony-workers)'
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Forward request to Worker
      return env.API.fetch(request);
    }

    // For all other requests, serve static assets from Pages
    return env.ASSETS.fetch(request);
  }
};
