// Vercel serverless proxy — evita CORS al llamar Zendesk API desde el browser
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-zd-auth');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const zdAuth = req.headers['x-zd-auth'];
  if (!zdAuth) return res.status(400).json({ error: 'Missing x-zd-auth header' });

  const { path = '/api/v2/search.json', q = 'status:open type:ticket', per_page = '100', next_page } = req.query;

  let url;
  if (next_page) {
    // Paginar usando la URL completa devuelta por Zendesk
    url = next_page;
  } else {
    url = `https://db1globalsoftwaresupport.zendesk.com${path}?query=${encodeURIComponent(q)}&per_page=${per_page}`;
  }

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${zdAuth}` }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
