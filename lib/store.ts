// lib/store.ts

export type PatientSession = {
  sessionId: string;
  id?: string;
  name: string;
  timestamp: string;
  details: Record<string, unknown>;
  status: 'typing' | 'submitted' | 'abandoned';
};

// Global in-memory store
// Using globalThis ensures the cache survives Hot Module Reloading (HMR) in Next.js development
declare global {
  var patientsCache: Map<string, PatientSession> | undefined;
}

const patients = globalThis.patientsCache || new Map<string, PatientSession>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.patientsCache = patients;
}

export const getPatients = () => {
  return Array.from(patients.values());
};

export const updatePatient = (sessionId: string, data: Partial<PatientSession>) => {
  const existing = patients.get(sessionId) || {
    sessionId,
    name: '',
    timestamp: new Date().toISOString(),
    details: {},
    status: 'typing'
  };

  const updated = { ...existing, ...data } as PatientSession;
  patients.set(sessionId, updated);
  return updated;
};

export const clearAbandoned = () => {
  // Optional helper to clean up old abandoned sessions if needed
  const now = Date.now();
  for (const [key, patient] of patients.entries()) {
    if (patient.status === 'abandoned') {
      const timeDiff = now - new Date(patient.timestamp).getTime();
      if (timeDiff > 1000 * 60 * 60 * 24) { // older than 24 hours
        patients.delete(key);
      }
    }
  }
};
