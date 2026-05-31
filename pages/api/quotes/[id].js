import db from '../../../lib/db'
import storage from '../../../lib/storage'

export default function handler(req, res) {
  const { id } = req.query
  if (req.method === 'GET') {
    try {
      // Attempt to fetch from the database first
      console.log(`API: Attempting to get quote ${id} from database.`);
      const row = db.prepare('SELECT id, user_id, client, notes, data, created_at, startDate, dueDate FROM quotes WHERE id = ?').get(id);
      
      if (row) {
        console.log(`API: Found quote ${id} in database.`);
        let payload = {};
        try {
          payload = JSON.parse(row.data || '{}');
        } catch (parseError) {
          console.error(`API: Error parsing data for quote ${id} from database:`, parseError);
          // Decide how to handle: maybe return partial data or an error
          // For now, we'll proceed with an empty payload if parsing fails
        }
        return res.json({ id: row.id, client: row.client, notes: row.notes, created_at: row.created_at, startDate: row.startDate, dueDate: row.dueDate, payload });
      } else {
        console.log(`API: Quote ${id} not found in database. Attempting localStorage fallback.`);
      }
    } catch (dbError) {
      console.error(`API: Error accessing database for quote ${id}:`, dbError);
      // If there's a DB error, we still try localStorage fallback
      console.log(`API: Proceeding to localStorage fallback for quote ${id} due to DB error.`);
    }

    // Fallback to localStorage if not found in DB or DB error occurred
    try {
      console.log(`API: Attempting to get quote ${id} from localStorage.`);
      const row = storage.getQuote(id); // Assume storage.getQuote returns an object or null/undefined

      if (row) {
        console.log(`API: Found quote ${id} in localStorage.`);
        let payload = {};
        try {
          // Ensure row.data is treated as a string before parsing
          payload = JSON.parse(String(row.data || '{}')); 
        } catch (parseError) {
          console.error(`API: Error parsing data for quote ${id} from localStorage:`, parseError);
          // Proceed with empty payload if parsing fails
        }
        // Construct response similar to DB version
        return res.json({ 
          id: row.id, 
          client: row.client, 
          notes: row.notes, 
          // Use a placeholder for created_at if not available in storage, or omit
          created_at: row.created_at || new Date().toISOString(), 
          startDate: row.startDate, 
          dueDate: row.dueDate, 
          payload 
        });
      } else {
        console.log(`API: Quote ${id} not found in localStorage.`);
        return res.status(404).json({ error: 'Quote not found (database and localStorage)' });
      }
    } catch (storageError) {
      console.error(`API: Error accessing localStorage for quote ${id}:`, storageError);
      return res.status(500).json({ error: 'Error accessing fallback storage' });
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    // ... (existing PUT/PATCH logic with added logging and error handling)
    try {
      console.log(`API: Attempting to update quote ${id} in database.`);
      const row = db.prepare('SELECT id, user_id, client, notes, data, created_at, startDate, dueDate FROM quotes WHERE id = ?').get(id);
      if (!row) {
        console.log(`API: Quote ${id} not found in DB for update. Attempting localStorage update.`);
        // If not in DB, try to update in localStorage
      } else {
        const existing = JSON.parse(row.data || '{}');
        const payload = req.body || {};
        const merged = { ...existing, ...payload };
        const client = payload.client ?? row.client;
        const notes = payload.notes ?? row.notes;
        const startDate = payload.startDate ?? row.startDate;
        const dueDate = payload.dueDate ?? row.dueDate;
        const data = JSON.stringify(merged);
        db.prepare('UPDATE quotes SET client = ?, notes = ?, data = ?, startDate = ?, dueDate = ? WHERE id = ?').run(client, notes, data, startDate, dueDate, id);
        console.log(`API: Successfully updated quote ${id} in database.`);
        return res.json({ id, updated: true });
      }
    } catch (dbError) {
      console.error(`API: Error updating quote ${id} in database:`, dbError);
      console.log(`API: Attempting to update quote ${id} in localStorage due to DB error.`);
    }

    // Fallback to localStorage for PUT/PATCH
    try {
      const row = storage.getQuote(id); // Assume storage.getQuote returns the current data
      if (!row) {
        console.log(`API: Quote ${id} not found in localStorage for update.`);
        return res.status(404).json({ error: 'Quote not found for update' });
      }
      
      const existing = JSON.parse(String(row.data || '{}')); // Ensure row.data is string
      const payload = req.body || {};
      const merged = { ...existing, ...payload };
      const client = payload.client ?? row.client;
      const notes = payload.notes ?? row.notes;
      const startDate = payload.startDate ?? row.startDate;
      const dueDate = payload.dueDate ?? row.dueDate;
      const data = JSON.stringify(merged);
      
      storage.updateQuote(id, client, notes, data, startDate, dueDate); // Assume updateQuote exists in storage
      console.log(`API: Successfully updated quote ${id} in localStorage.`);
      return res.json({ id, updated: true });
    } catch (storageError) {
      console.error(`API: Error updating quote ${id} in localStorage:`, storageError);
      return res.status(500).json({ error: 'Error updating fallback storage' });
    }
  }

  if (req.method === 'DELETE') {
    // ... (existing DELETE logic with added logging)
    try {
      console.log(`API: Attempting to delete quote ${id} from database.`);
      db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
      console.log(`API: Successfully deleted quote ${id} from database.`);
      return res.json({ id, deleted: true });
    } catch (dbError) {
      console.error(`API: Error deleting quote ${id} from database:`, dbError);
      console.log(`API: Attempting to delete quote ${id} from localStorage.`);
    }

    // Fallback to localStorage for DELETE
    try {
      const rowExists = storage.getQuote(id); // Check if it exists before deleting
      if (!rowExists) {
        console.log(`API: Quote ${id} not found in localStorage for deletion.`);
        return res.status(404).json({ error: 'Quote not found for deletion' });
      }
      storage.deleteQuote(id);
      console.log(`API: Successfully deleted quote ${id} from localStorage.`);
      return res.json({ id, deleted: true });
    } catch (storageError) {
      console.error(`API: Error deleting quote ${id} from localStorage:`, storageError);
      return res.status(500).json({ error: 'Error deleting from fallback storage' });
    }
  }

  res.status(405).end()
}
