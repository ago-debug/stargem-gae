#!/bin/bash
echo "=== SCENARIO 2 ==="
res=$(curl -s -X POST -H "Content-Type: application/json" -d '{"member_id":1,"dossier_type":"iscrizione_corso"}' http://localhost:5001/api/dossiers)
echo $res
id=$(echo $res | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
echo "Dossier ID: $id"

if [ -n "$id" ]; then
  echo "=== SCENARIO 3 ==="
  curl -s -X PATCH -H "Content-Type: application/json" -d '{"step_name":"anagrafica","status":"completed"}' http://localhost:5001/api/dossiers/$id/step
  echo ""
  curl -s http://localhost:5001/api/dossiers/$id | grep -o '"step_name":"anagrafica","status":"completed"'
fi

echo "=== SCENARIO 4 ==="
echo "test" > tmp_test.pdf
res=$(curl -s -X POST -F "file=@tmp_test.pdf" -F "memberId=1" -F "category=medical" http://localhost:5001/api/uploads/medical-certificate)
echo $res
url=$(echo $res | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
echo "URL: $url"

echo "=== SCENARIO 5 ==="
curl -s -X POST -H "Content-Type: application/json" -d '{
  "payer_id":1, "payer_type":"member",
  "billing_subject_id":1, "billing_subject_type":"member",
  "document_type":"ricevuta_istituzionale",
  "participants":[
    {"member_id":1,"activity_type":"corso","amount":100},
    {"member_id":1,"activity_type":"tesseramento","amount":25}
  ],
  "total_amount":125, "payment_method":"contanti"
}' http://localhost:5001/api/payments/multi-participant
echo ""

if [ -n "$id" ]; then
  echo "=== SCENARIO 6 ==="
  echo "Tentativo incompleto:"
  curl -s -X POST http://localhost:5001/api/dossiers/$id/complete
  echo ""
  
  echo "Completamento step:"
  for step in certificato_medico pagamento tesseramento iscrizione_attivita documenti; do
    curl -s -X PATCH -H "Content-Type: application/json" -d "{\"step_name\":\"$step\",\"status\":\"completed\"}" http://localhost:5001/api/dossiers/$id/step > /dev/null
  done
  
  echo "Tentativo completo:"
  curl -s -X POST http://localhost:5001/api/dossiers/$id/complete
  echo ""
fi
