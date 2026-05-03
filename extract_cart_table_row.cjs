const fs = require('fs');

const fileContent = fs.readFileSync('client/src/components/nuovo-pagamento-modal.tsx', 'utf8');

// Find the index of "// === SUBCOMPONENTE RIGA CARRELLO"
const subcomponentStart = fileContent.indexOf('// === SUBCOMPONENTE RIGA CARRELLO');

if (subcomponentStart === -1) {
    console.error('Could not find CartTableRow');
    process.exit(1);
}

const subcomponentCode = fileContent.substring(subcomponentStart);

const newFileContent = `import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceTag } from "@/components/price-tag";
import { getActiveActivities } from "@/config/activities";
import { MultiSelectEnrollmentDetails } from "@/components/multi-select-enrollment-details";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { apiRequest } from "@/lib/queryClient";
import type { PriceList, Course, Quote, PriceListItem } from "@shared/schema";

` + subcomponentCode.replace('function CartTableRow', 'export function CartTableRow');

fs.writeFileSync('client/src/components/payments/CartTableRow.tsx', newFileContent);

// Modify the original file to import CartTableRow and remove its body
const newOriginalContent = fileContent.substring(0, subcomponentStart);

let finalOriginal = newOriginalContent;
if (!finalOriginal.includes('import { CartTableRow }')) {
    finalOriginal = finalOriginal.replace('import { PriceTag } from "@/components/price-tag";', 'import { PriceTag } from "@/components/price-tag";\nimport { CartTableRow } from "@/components/payments/CartTableRow";');
}

fs.writeFileSync('client/src/components/nuovo-pagamento-modal.tsx', finalOriginal);
console.log("CartTableRow extracted successfully");
