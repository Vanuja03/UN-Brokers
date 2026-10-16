import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { InsuranceType } from '../types';

type QuotePick = { type: InsuranceType; token: number };

type QuoteSelectionValue = {
  pick: QuotePick | null;
  choose: (type: InsuranceType) => void;
};

const QuoteSelectionContext = createContext<QuoteSelectionValue>({
  pick: null,
  choose: () => undefined,
});

export function QuoteSelectionProvider({ children }: { children: React.ReactNode }) {
  const [pick, setPick] = useState<QuotePick | null>(null);
  const choose = useCallback((type: InsuranceType) => {
    setPick({ type, token: Date.now() });
  }, []);
  const value = useMemo(() => ({ pick, choose }), [pick, choose]);
  return <QuoteSelectionContext.Provider value={value}>{children}</QuoteSelectionContext.Provider>;
}

export function useQuoteSelection() {
  return useContext(QuoteSelectionContext);
}
