// Tipos principais do estado da aplicação
export interface RouletteNumber {
  value: number; // 0-36
  color: 'green' | 'red' | 'black';
  createdAt: Date;
}

export interface Statistics {
  colors: {
    red: number;
    black: number;
    green: number;
  };
  evenOdd: {
    even: number;
    odd: number;
  };
  highLow: {
    high: number; // 19-36
    low: number;  // 1-18
  };
  dozens: {
    first: number;  // 1-12
    second: number; // 13-24
    third: number;  // 25-36
  };
  columns: {
    first: number;  // 1,4,7,10,13,16,19,22,25,28,31,34
    second: number; // 2,5,8,11,14,17,20,23,26,29,32,35
    third: number;  // 3,6,9,12,15,18,21,24,27,30,33,36
  };
}

export interface Alert {
  hasRace: boolean;
  raceNumbers: number[];
  coveredNumbers: number[];
  riskNumbers: number[];
  message: string;
}

export interface RouletteEntry {
  number: number;
  color: 'green' | 'red' | 'black';
  createdAt: Date;
}

export interface RouletteState {
  history: RouletteEntry[];
  statistics: Statistics;
  alert: Alert | null;
}