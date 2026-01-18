# User Authentication & Sync Specification

## Job to Be Done

As a student using FastRead on multiple devices, I want to log in and have my reading progress, documents, and settings synced automatically, so I can start reading on my laptop and continue on my phone.

## Problem Context

Students use multiple devices:

- Laptop for heavy reading sessions
- Phone for commute/waiting time
- Tablet for comfortable reading

Without sync:

- Lose reading position
- Re-upload documents
- Reset preferences each device

## User Flow

### First Time User

1. User visits FastRead
2. Can use without account (guest mode)
3. Prompted to create account when:
   - Uploading second document
   - Closing browser with reading in progress
   - Explicitly clicking "Sign Up"
4. Signs up with email or Google
5. Guest data migrates to account

### Returning User

1. Opens FastRead on any device
2. Sees "Welcome back" if logged in
3. Library shows all their documents
4. Tapping document shows last position
5. Can resume reading instantly

### Sync Behavior

- Reading position syncs in real-time
- Documents sync on upload
- Settings sync on change
- Works offline, syncs when online

## Functional Requirements

### FR-AUTH-1: Authentication Methods

Support:

- Email/password
- Google OAuth
- Apple Sign In (for iOS users)
- Magic link (passwordless email)

Use Supabase Auth for implementation.

### FR-AUTH-2: Guest Mode

- Full functionality without account
- Data stored locally (IndexedDB)
- Prompt to create account at natural points
- Data migrates to account on signup

### FR-AUTH-3: Account Management

User can:

- Change password
- Update email
- Delete account (and all data)
- Export all data (GDPR compliance)
- View login history

### FR-AUTH-4: Session Management

- JWT-based sessions
- Refresh token rotation
- 30-day session duration
- Logout from all devices option
- Automatic logout on suspicious activity

### FR-SYNC-1: Document Sync

What syncs:

- Document metadata (title, upload date)
- Parsed text content
- Detected citations
- User's section preferences (include/exclude)

What does NOT sync:

- Original PDF file (too large, re-upload if needed)
- Temporary parsing state

Sync behavior:

- Upload creates server record
- Deleting on one device deletes everywhere
- Conflict: newest wins

### FR-SYNC-2: Reading Progress Sync

Sync data:

```typescript
interface ReadingProgress {
  documentId: string;
  currentWordIndex: number;
  currentSpeed: number;
  timestamp: Date;
  deviceId: string;
}
```

Sync strategy:

- Optimistic updates (update local first)
- Debounce syncs (every 5 seconds max)
- On conflict: use newest timestamp
- Show notification: "Synced from [device]"

### FR-SYNC-3: Settings Sync

All settings sync across devices:

- Reader settings (speed, font, theme)
- Citation mode preference
- Auto-speed settings
- Notification preferences

### FR-SYNC-4: Offline Support

When offline:

- Continue reading normally
- Queue changes for sync
- Show offline indicator
- Store up to 10 documents locally

When back online:

- Sync queued changes
- Pull updates from server
- Resolve conflicts (newest wins)
- Show "Synced" confirmation

### FR-SYNC-5: Real-time Sync

For active sessions:

- Use Supabase Realtime
- Subscribe to user's document changes
- Push position updates
- Show "Reading on [device]" indicator

## Non-Functional Requirements

### NFR-AUTH-1: Security

- Passwords hashed with bcrypt
- HTTPS only
- CSRF protection
- Rate limiting on auth endpoints
- No sensitive data in URLs

### NFR-AUTH-2: Privacy

- Minimal data collection
- No tracking without consent
- Data stored in user's region (EU/US)
- Clear privacy policy

### NFR-SYNC-1: Performance

- Sync latency < 500ms when online
- Offline-first architecture
- Background sync doesn't block UI
- Initial sync < 3 seconds for 50 documents

### NFR-SYNC-2: Reliability

- Queue survives app restart
- No data loss on crash
- Idempotent sync operations
- Automatic retry with backoff

### NFR-SYNC-3: Bandwidth

- Compress sync payloads
- Delta updates where possible
- Respect data saver mode
- Sync over wifi preference option

## Data Model

### Supabase Tables

```sql
-- Users (managed by Supabase Auth)

-- Documents
create table documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  original_filename text,
  parsed_content text,
  sections jsonb,
  citations jsonb,
  word_count integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reading Progress
create table reading_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  word_index integer not null,
  speed integer not null,
  device_id text,
  updated_at timestamptz default now(),
  unique(user_id, document_id)
);

-- User Settings
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Saved Citations
create table saved_citations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  citation_text text not null,
  context text,
  position integer,
  created_at timestamptz default now()
);
```

### Row Level Security

```sql
-- Users can only access their own data
alter table documents enable row level security;
create policy "Users can CRUD their own documents"
  on documents for all
  using (auth.uid() = user_id);

-- Similar for other tables
```

## UI States

### Logged Out

- Show "Sign In" button in header
- Guest mode works fully
- Periodic prompt to create account

### Logged In

- Show user avatar/email in header
- "Library" shows synced documents
- Settings show sync status

### Syncing

- Subtle sync indicator (spinning icon)
- Don't block user actions
- Show toast on sync complete/error

### Offline

- Banner: "You're offline. Changes will sync when connected."
- All features work
- Upload queued for later

### Conflict

- Toast: "This document was updated on another device. Using latest version."
- Option to view/restore older version

## Edge Cases

1. **Large documents**: Stream sync in chunks
2. **Many documents**: Paginate library, lazy load content
3. **Simultaneous edits**: Last write wins with notification
4. **Account deletion**: Queue deletion, complete within 30 days
5. **Session expired**: Redirect to login, preserve current action
6. **Network timeout**: Retry with exponential backoff
7. **Quota exceeded**: Notify user, suggest deleting old documents

## Acceptance Criteria

- [ ] User can sign up with email/password
- [ ] User can sign up with Google
- [ ] Guest mode works without account
- [ ] Guest data migrates on signup
- [ ] Documents sync across devices
- [ ] Reading position syncs in real-time
- [ ] Settings sync on change
- [ ] Offline mode works for reading
- [ ] Changes sync when back online
- [ ] User can delete account and all data
- [ ] Sync indicator shows status
- [ ] Conflicts resolved without data loss
