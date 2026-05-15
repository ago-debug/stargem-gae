async function req(method: string, path: string, body?: any) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const options: any = { method, signal: controller.signal };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`http://localhost:5001${path}`, options);
    clearTimeout(timeoutId);
    return `${res.status} ${await res.text()}`;
  } catch (e: any) {
    if (e.name === 'AbortError') return 'TIMEOUT';
    return 'ERROR';
  }
}

async function run() {
  console.log('POST /api/dossiers ->', await req('POST', '/api/dossiers', { member_id: 1, dossier_type: 'iscrizione_corso' }));
  console.log('POST /api/external-payers ->', await req('POST', '/api/external-payers', { business_name: 'Test Sponsor', fiscal_code: '12345678901' }));
  process.exit(0);
}

run().catch(console.error);
