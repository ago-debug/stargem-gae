import http from 'http';

http.get('http://127.0.0.1:5001/api/courses?activityType=lezione_individuale', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(`API returned ${parsed.length || 0} items.`);
      if (parsed.length > 0) {
        parsed.forEach(c => console.log(`- ID: ${c.id}, Name: ${c.name}, SKU: ${c.sku}`));
      }
    } catch (e) {
      console.log("Error parsing:", data.substring(0, 100));
    }
  });
}).on('error', (e) => {
  console.error("HTTP Error:", e.message);
});
