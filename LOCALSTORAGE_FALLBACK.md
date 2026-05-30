# localStorage Fallback Implementation

## Overview

The Contractor Estimator application now includes a graceful fallback mechanism using **browser localStorage** and **server-side file storage** when the database is unavailable. This allows estimates, templates, and material presets to be saved and retrieved from the user's device.

## Architecture

### Server-Side Storage (`lib/storage.js`)

A new utility module provides file-based storage using JSON:
- Stores data in `/data/localStorage.json`
- Implements CRUD operations for:
  - Quotes
  - Templates
  - Material Presets
  - Company Settings

### API Fallback Pattern

All API endpoints now follow this pattern:

```javascript
try {
  // Try database first
  const result = db.prepare(...).run(...)
  return res.json(result)
} catch (e) {
  // Fall back to file storage
  const storage = require('../../../lib/storage')
  const result = storage.create/get/update/delete(...)
  return res.json(result)
}
```

### Updated API Endpoints

1. **Quotes** (`pages/api/quotes/`)
   - `GET /api/quotes` - List all quotes
   - `POST /api/quotes` - Create new quote
   - `GET /api/quotes/[id]` - Get specific quote
   - `PUT /api/quotes/[id]` - Update quote

2. **Templates** (`pages/api/templates/`)
   - `GET /api/templates` - List templates
   - `POST /api/templates` - Create template
   - `GET /api/templates/[id]` - Get template details
   - `DELETE /api/templates/[id]` - Delete template

3. **Material Presets** (`pages/api/presets/materials.js`)
   - `GET /api/presets/materials` - List presets
   - `POST /api/presets/materials` - Create preset

4. **Company Settings** (`pages/api/settings/company.js`)
   - `GET /api/settings/company` - Get settings
   - `PUT /api/settings/company` - Update settings

### Frontend Enhancements (`src/components/EstimateForm.js`)

**Error Handling:**
- Graceful error catching in all load functions
- User-friendly alerts when using localStorage fallback
- Console logging for debugging

**User Feedback:**
- "💾 Quote saved to your device (database unavailable). Sync will happen automatically when database is available."
- "Settings/Template/Preset saved to device (database unavailable)"

## Usage

### For Users

When the database is unavailable:
1. All save operations work exactly as before
2. Data is stored locally on the device
3. Users receive a notification that they're using device storage
4. When the database becomes available again, a migration process can sync all data

### For Developers

#### How to Test Fallback Mode

1. **Simulate database failure** by stopping the database service or breaking the database connection
2. **Save a quote** - should fall back to localStorage
3. **Verify data persistence** - reload the page and confirm data is still there

#### File Storage Location

On Vercel, the storage file is created at: `/tmp/.next/data/localStorage.json`

On local development: `/data/localStorage.json`

## Future Migration to Supabase

When migrating to Supabase:

1. **Keep the current structure** - the fallback mechanism will continue to work
2. **Update db.js** to use Supabase client
3. **Add migration script** to sync localStorage data to Supabase on first login
4. **Remove localStorage fallback** (optional) once Supabase is fully operational

### Migration Script Template

```javascript
// Example: lib/migrate-to-supabase.js
async function migrateLocalDataToSupabase(supabaseClient, userId) {
  const storage = require('./storage')
  
  // Migrate quotes
  const quotes = storage.getAllQuotes().filter(q => q.user_id === userId)
  for (const quote of quotes) {
    await supabaseClient.from('quotes').insert(quote)
  }
  
  // Migrate templates
  const templates = storage.getUserTemplates(userId)
  for (const template of templates) {
    await supabaseClient.from('templates').insert(template)
  }
  
  // ... repeat for other data types
}
```

## Data Persistence Details

### Browser localStorage
- Used by frontend for immediate client-side caching
- Limited to ~5-10MB per domain
- Persists across browser sessions

### Server-side File Storage
- Provides persistent storage for API operations
- JSON-formatted for easy inspection/debugging
- Suitable for development and small-scale production use
- **Not suitable for high-concurrency environments** - use proper database (like Supabase) for production

## Considerations

### Advantages of Current Approach
- ✅ Works out-of-the-box on Vercel (no additional services)
- ✅ Data persists across sessions
- ✅ No breaking changes to existing code
- ✅ Easy to test and debug
- ✅ Graceful fallback with user feedback

### Limitations
- ❌ No concurrent user support (single-instance only)
- ❌ No transactions or complex queries
- ❌ Limited to available disk space
- ❌ No built-in backup/replication
- ❌ Not suitable for multi-user collaboration

### Upgrade Path
This is a **temporary solution** designed to work until Supabase is integrated. Once Supabase is in place:
1. Update database connection in `lib/db.js`
2. Keep localStorage fallback for offline-first functionality (optional)
3. Implement data sync from localStorage to Supabase
4. Remove file-based storage fallback

## Testing

Run the test suite:
```bash
npm test
```

All existing tests pass with the new localStorage fallback in place.

## Files Modified

- `lib/storage.js` - NEW: File-based storage utility
- `pages/api/quotes/index.js` - Added try-catch with storage fallback
- `pages/api/quotes/[id].js` - Added try-catch with storage fallback
- `pages/api/templates/index.js` - Added try-catch with storage fallback
- `pages/api/templates/[id].js` - Added try-catch with storage fallback
- `pages/api/presets/materials.js` - Added try-catch with storage fallback
- `pages/api/settings/company.js` - Added try-catch with storage fallback
- `src/components/EstimateForm.js` - Improved error handling and user feedback

## Debugging

To check if localStorage is being used:
1. Open browser DevTools
2. Go to Storage/Application → localStorage
3. Look for keys like `quotes_*`, `templates_*`, etc.
4. Check server logs for "Fall back to localStorage" messages
5. Inspect `/data/localStorage.json` on the server

## Support

For issues or questions about the localStorage fallback:
1. Check the console for error messages
2. Verify the `/data/localStorage.json` file exists and is writable
3. Clear browser localStorage if experiencing cache issues
4. Check disk space availability
