export { supabase } from './client';
export type { Database } from './client';
export { createSupabaseServerClient } from './server';
export {
  getSavedCitations,
  getSavedCitationsForDocument,
  saveCitation,
  saveCitations,
  deleteCitation,
  deleteCitationsForDocument,
  deleteAllCitations,
  citationExists,
  getCitationCount,
  exportAsBibTeX,
  exportAsText,
} from './citations';
export {
  getReadingProgress,
  getAllReadingProgress,
  saveReadingProgress,
  deleteReadingProgress,
  deleteAllReadingProgress,
  calculateReadingStats,
  getDeviceId,
  type ReadingProgress,
} from './reading-progress';
