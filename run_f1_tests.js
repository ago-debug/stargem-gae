const fetch = require('node-fetch');

async function runTests() {
  const results = {};
  const report = (id, success, notes) => {
    results[id] = { success, notes };
    console.log(`[${id}] ${success ? '✅' : '❌'} - ${notes}`);
  };

  try {
    // T01
    const t01Res = await fetch('http://localhost:5001/api/gempass/tessere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: null,
        membership_type: "adulto",
        season_competence: "2526",
        season_start_year: 2025,
        season_end_year: 2026,
        anagrafica: {
          cognome: "TEST",
          nome: "GEMPASS",
          codiceFiscale: "TSTGMP99A01F205Z",
          email: "test.gempass@studiogem.it",
          cellulare: "3331234567"
        }
      })
    });
    const t01Body = await t01Res.json();
    if (t01Res.status === 201 && t01Body.membershipNumber?.startsWith('2526-')) {
      report('T01', true, `HTTP 201, Created: ${t01Body.membershipNumber}`);
    } else {
      report('T01', false, `HTTP ${t01Res.status}, Body: ${JSON.stringify(t01Body)}`);
    }

    // T02
    const t02Res = await fetch('http://localhost:5001/api/gempass/tessere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: null,
        membership_type: "adulto",
        season_competence: "2526",
        season_start_year: 2025,
        season_end_year: 2026,
        anagrafica: {
          cognome: "TEST",
          nome: "GEMPASS",
          codiceFiscale: "TSTGMP99A01F205Z"
        }
      })
    });
    const t02Body = await t02Res.json();
    if (t02Res.status === 409 || t02Res.status === 400 || (t02Body.error && t02Body.error.includes('esistente'))) {
      report('T02', true, `HTTP ${t02Res.status}, Message: ${t02Body.message || t02Body.error}`);
    } else {
      report('T02', false, `HTTP ${t02Res.status}, Body: ${JSON.stringify(t02Body)}`);
    }

    const t01Id = t01Body.id;
    const t01MemberId = t01Body.memberId;

    // T03
    const t03Res = await fetch('http://localhost:5001/api/gempass/tessere');
    const t03Body = await t03Res.json();
    if (t03Res.status === 200 && Array.isArray(t03Body) && t03Body.find(t => t.id === t01Id)) {
      report('T03', true, `Trovata tessera in array di ${t03Body.length} elementi`);
    } else {
      report('T03', false, `HTTP ${t03Res.status}`);
    }

    // T04
    const t04Res = await fetch(`http://localhost:5001/api/gempass/tessere/${t01Id}`);
    const t04Body = await t04Res.json();
    if (t04Res.status === 200 && t04Body.id === t01Id) {
      report('T04', true, `HTTP 200, Tessera ok`);
    } else {
      report('T04', false, `HTTP ${t04Res.status}, Body: ${JSON.stringify(t04Body)}`);
    }

    // T05
    const t05Res = await fetch('http://localhost:5001/api/gempass/firme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: t01MemberId,
        form_type: "DOMANDA_TESSERAMENTO",
        season_id: 1
      })
    });
    const t05Body = await t05Res.json();
    if (t05Res.status === 201 && t05Body.action === 'created') {
      report('T05', true, `Created firma`);
    } else {
      report('T05', false, `HTTP ${t05Res.status}`);
    }

    // T06
    const t06Res = await fetch('http://localhost:5001/api/gempass/firme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: t01MemberId,
        form_type: "DOMANDA_TESSERAMENTO",
        season_id: 1
      })
    });
    const t06Body = await t06Res.json();
    if (t06Res.status === 200 && t06Body.action === 'updated') {
      report('T06', true, `Updated firma`);
    } else {
      report('T06', false, `HTTP ${t06Res.status}, Body: ${JSON.stringify(t06Body)}`);
    }

    // Create a PRIVACY_ADULTI signature for T07
    await fetch('http://localhost:5001/api/gempass/firme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: t01MemberId, form_type: "PRIVACY_ADULTI", season_id: 1 })
    });

    // T07
    const t07Res = await fetch(`http://localhost:5001/api/gempass/firme/${t01MemberId}`);
    const t07Body = await t07Res.json();
    if (t07Res.status === 200 && Array.isArray(t07Body) && t07Body.length >= 2) {
      report('T07', true, `Recuperate ${t07Body.length} firme`);
    } else {
      report('T07', false, `HTTP ${t07Res.status}`);
    }

    // T08
    const t08Res = await fetch(`http://localhost:5001/api/gempass/firme-all`);
    const t08Body = await t08Res.json();
    const hasJoin = t08Body.find(b => b.memberFirstName && b.memberLastName);
    if (t08Res.status === 200 && hasJoin) {
      report('T08', true, `HTTP 200, Join working (Name: ${hasJoin.memberFirstName})`);
    } else {
      report('T08', false, `HTTP ${t08Res.status}`);
    }

    // T09
    const t09Res = await fetch(`http://localhost:5001/api/gempass/membro/${t01MemberId}/tessera`);
    const t09Body = await t09Res.json();
    if (t09Res.status === 200 && t09Body.tessera && t09Body.tessera.membershipNumber) {
      report('T09', true, `Tessera attiva trovata ${t09Body.tessera.membershipNumber}`);
    } else {
      report('T09', false, `HTTP ${t09Res.status}`);
    }

    // T10
    const t10Res = await fetch(`http://localhost:5001/api/gempass/tessere/${t01Id}/rinnova`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ season_competence: "2627", season_start_year: 2026, season_end_year: 2027 })
    });
    const t10Body = await t10Res.json();
    if (t10Res.status === 201 && t10Body.membershipNumber.startsWith("2627-")) {
      report('T10', true, `Rinnovo OK: ${t10Body.membershipNumber}`);
    } else {
      report('T10', false, `HTTP ${t10Res.status}, Body: ${JSON.stringify(t10Body)}`);
    }

    const nextMembershipNumber = t10Body.membershipNumber;

    // T11
    const t11Res = await fetch(`http://localhost:5001/api/public/membership-status/${nextMembershipNumber}`);
    const t11Body = await t11Res.json();
    if (t11Res.status === 200 && t11Body.status && t11Body.member) {
      report('T11', true, `Trovato: ${t11Body.member} (${t11Body.status})`);
    } else {
      report('T11', false, `HTTP ${t11Res.status}, Body: ${JSON.stringify(t11Body)}`);
    }

  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

runTests();
