export type RootStackParamList = {
  LockScreen: undefined;
  Desktop: undefined;
  Messaging: undefined;
  Chat: { caseId: string };
  Mail: undefined;
  Contacts: undefined;
  Diagnosis: { caseId: string };
  DiagnosticTool: undefined;
  Treatment: { caseId: string };
  PsykTok: undefined;
  Diary: undefined;
  Results: {
    correct: boolean;
    xpGained: number;
    coinsGained?: number;
    diagnosis: string;
    caseId: string;
  };
  Settings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: import('@react-navigation/native').NavigationProp<RootStackParamList, T>;
  route: import('@react-navigation/native').RouteProp<RootStackParamList, T>;
};