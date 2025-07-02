import React, { createContext, useContext, useState } from 'react';

export type SelectionState = {
  selectedItems: any[];
  selectedLocations: any[];
  userLocation: any;
  setSelection: (s: Partial<Omit<SelectionState, 'setSelection'>>) => void;
};

const SelectionContext = createContext<SelectionState | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<Omit<SelectionState, 'setSelection'>>({
    selectedItems: [],
    selectedLocations: [],
    userLocation: null,
  });

  const setSelection = (s: Partial<Omit<SelectionState, 'setSelection'>>) => setState(prev => ({ ...prev, ...s }));

  return (
    <SelectionContext.Provider value={{ ...state, setSelection }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within a SelectionProvider');
  return ctx;
}; 