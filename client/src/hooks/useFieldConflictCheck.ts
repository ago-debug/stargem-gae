import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

export type ConflictResult = {
  checking: boolean;
  available: boolean | null;
  warning?: string;
  conflict?: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    fiscalCode?: string | null;
  };
};

export function useCFCheck(value: string, excludeId?: number): ConflictResult {
  const [result, setResult] = useState<ConflictResult>({ checking: false, available: null });
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 3) {
      setResult({ checking: false, available: null });
      return;
    }

    let isMounted = true;
    setResult(prev => ({ ...prev, checking: true }));

    const fetchCheck = async () => {
      try {
        const url = `/api/members/check-cf?cf=${encodeURIComponent(debouncedValue)}${excludeId ? `&excludeId=${excludeId}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        if (isMounted) {
          setResult({ checking: false, available: data.available, conflict: data.conflict });
        }
      } catch (err) {
        if (isMounted) {
          setResult({ checking: false, available: null });
        }
      }
    };

    fetchCheck();

    return () => { isMounted = false; };
  }, [debouncedValue, excludeId]);

  return result;
}

export function useEmailCheck(value: string, isMinor: boolean, excludeId?: number): ConflictResult {
  const [result, setResult] = useState<ConflictResult>({ checking: false, available: null });
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 3 || !debouncedValue.includes('@')) {
      setResult({ checking: false, available: null });
      return;
    }

    let isMounted = true;
    setResult(prev => ({ ...prev, checking: true }));

    const fetchCheck = async () => {
      try {
        const url = `/api/members/check-email?email=${encodeURIComponent(debouncedValue)}&isMinor=${isMinor ? '1' : '0'}${excludeId ? `&excludeId=${excludeId}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        if (isMounted) {
          setResult({ checking: false, available: data.available, warning: data.warning, conflict: data.conflict });
        }
      } catch (err) {
        if (isMounted) {
          setResult({ checking: false, available: null });
        }
      }
    };

    fetchCheck();

    return () => { isMounted = false; };
  }, [debouncedValue, isMinor, excludeId]);

  return result;
}

export function usePhoneCheck(value: string, isMinor: boolean, excludeId?: number): ConflictResult {
  const [result, setResult] = useState<ConflictResult>({ checking: false, available: null });
  const debouncedValue = useDebounce(value, 500);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 5) {
      setResult({ checking: false, available: null });
      return;
    }

    let isMounted = true;
    setResult(prev => ({ ...prev, checking: true }));

    const fetchCheck = async () => {
      try {
        const url = `/api/members/check-phone?phone=${encodeURIComponent(debouncedValue)}&isMinor=${isMinor ? '1' : '0'}${excludeId ? `&excludeId=${excludeId}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        if (isMounted) {
          setResult({ checking: false, available: data.available, warning: data.warning, conflict: data.conflict });
        }
      } catch (err) {
        if (isMounted) {
          setResult({ checking: false, available: null });
        }
      }
    };

    fetchCheck();

    return () => { isMounted = false; };
  }, [debouncedValue, isMinor, excludeId]);

  return result;
}
