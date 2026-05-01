#!/bin/bash
mysql -u gaetano_admin -p'StarGem2026!Secure' stargem_v2 -e "DESCRIBE users;" > users_schema.txt
mysql -u gaetano_admin -p'StarGem2026!Secure' stargem_v2 -e "SELECT id, username FROM users;" >> users_schema.txt
cat users_schema.txt
