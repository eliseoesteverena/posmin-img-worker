export default {
  async fetch(request, env) {
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    
    try {
      
      /* ================= TEST ================= */
      
      if (path === '/test') {
        
        return new Response(
          JSON.stringify({
            status: 'ok',
            bucket: env.IMAGES ? 'connected' : 'not connected'
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      
      /* ================= UPLOAD ================= */
      
      if (path === '/upload' && request.method === 'POST') {
        
        const formData = await request.formData();
        const file = formData.get('image');
        
        
        if (!file) {
          return new Response(
            JSON.stringify({
              error: 'No se proporcionó imagen'
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          return new Response(
            JSON.stringify({
              error: 'Tipo de archivo no permitido. Use: JPG, PNG, WEBP, GIF'
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        
        const maxSize = 5 * 1024 * 1024;
        
        if (file.size > maxSize) {
          return new Response(
            JSON.stringify({
              error: 'La imagen excede 5 MB'
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop();
        
        const filename = `products/${timestamp}-${randomStr}.${extension}`;
        
        
        await env.IMAGES.put(
          filename,
          file.stream(),
          {
            httpMetadata: {
              contentType: file.type
            }
          }
        );
        
        
        const publicUrl = `https://68fdee6097596292787cc211f6da5349.r2.cloudflarestorage.com/pos-images/${filename}`;
        
        
        return new Response(
          JSON.stringify({
            url: publicUrl,
            filename: filename
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      
      /* ================= DELETE ================= */
      
      if (path.startsWith('/delete/') && request.method === 'DELETE') {
        
        const filename = path.replace('/delete/', '');
        
        
        if (!filename.startsWith('products/')) {
          return new Response(
            JSON.stringify({
              error: 'Ruta inválida'
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          );
        }
        
        
        await env.IMAGES.delete(filename);
        
        
        return new Response(
          JSON.stringify({
            message: 'Imagen eliminada'
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      
      /* ================= DEFAULT ================= */
      
      return new Response(
        JSON.stringify({
          error: 'Ruta no encontrada'
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
      
    } catch (error) {
      
      return new Response(
        JSON.stringify({
          error: error.message
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
};