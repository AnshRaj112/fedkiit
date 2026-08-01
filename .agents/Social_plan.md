# Implementation Plan: Admin Social & Blog Post Management
**Project:** fedkiit (Next.js 16, App Router, TypeScript, Tailwind CSS v4)
**Assignee:** AI Agent
**Feature:** Admin panel to manage Instagram, LinkedIn, and Blog post links; display on merged Social & Blogs page

---

## Context & Constraints

- Framework: **Next.js 16** with the **App Router** (`app/` directory). All routes, pages, and API endpoints live inside `app/`.
- Language: **TypeScript** for all new files.
- Styling: **Tailwind CSS v4** — use only Tailwind utility classes, no separate CSS files unless unavoidable.
- Database: **MongoDB Atlas** (free tier). No database is currently installed — you must add it.
- No auth library is currently installed. Use a lightweight env-var-based admin guard (described in Phase 4).
- The `.env.local` file is git-ignored. Create it but do **not** commit it.
- Do **not** modify `next.config.ts` unless explicitly instructed (you will need to add one `frameSrc` rule — details in Phase 5).

---

## Step 0 — Install dependencies

Run the following in the project root:

```bash
npm install mongodb
```

No other packages are needed.

---

## Phase 1 — Database connection

### 1.1 Create `lib/mongodb.ts`

This file exports a singleton MongoDB client so the connection is reused across hot reloads in dev mode.

```typescript
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

if (!uri) {
  throw new Error('Missing environment variable: MONGODB_URI');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Prevent TypeScript from complaining about the global cache
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
```

### 1.2 Create `.env.local` in the project root

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fedkiit?retryWrites=true&w=majority
ADMIN_SECRET=choose_a_strong_secret_here
```

> **Note for human:** Replace `<username>`, `<password>`, and `<cluster>` with the actual MongoDB Atlas values. Also set a strong `ADMIN_SECRET` — this is the password that protects the admin panel.

---

## Phase 2 — Data model

### 2.1 Create `lib/types/SocialPost.ts`

```typescript
export type Platform = 'instagram' | 'linkedin' | 'blog';

export interface SocialPost {
  _id?: string;           // MongoDB ObjectId (stored as string)
  platform: Platform;
  postUrl: string;        // Full original URL of the post
  embedUrl: string;       // Derived embed URL (see Phase 5 for generation logic)
  caption?: string;       // Optional description shown below the embed
  isVisible: boolean;     // If false, post is hidden from the Social page
  createdAt: string;      // ISO date string
}

export interface NewSocialPostPayload {
  platform: Platform;
  postUrl: string;
  caption?: string;
}
```

---

## Phase 3 — API routes

All routes live under `app/api/social-posts/`. Every route must:
- Import `clientPromise` from `lib/mongodb.ts`
- Use the database name `fedkiit` and collection name `social_posts`
- Return `NextResponse.json(...)` with appropriate HTTP status codes
- Check for the admin secret header `x-admin-secret` on all mutating routes (POST, PUT, DELETE, PATCH)

### 3.1 Helper: derive embed URL from post URL

Add this utility function at the top of each route file that needs it (or put it in `lib/utils/embedUrl.ts` and import it):

```typescript
// lib/utils/embedUrl.ts

export function deriveEmbedUrl(platform: 'instagram' | 'linkedin' | 'blog', postUrl: string): string {
  if (platform === 'instagram') {
    // Input:  https://www.instagram.com/p/ABC123XYZ/
    // Output: https://www.instagram.com/p/ABC123XYZ/embed/
    const match = postUrl.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
    if (!match) throw new Error('Invalid Instagram URL');
    return `https://www.instagram.com/p/${match[1]}/embed/`;
  }

  if (platform === 'linkedin') {
    // Input:  https://www.linkedin.com/posts/username_somekeyword-activity-123456789-ABCD/
    // LinkedIn embed format: https://www.linkedin.com/embed/feed/update/urn:li:activity:123456789
    const activityMatch = postUrl.match(/activity-(\d+)/);
    if (activityMatch) {
      return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`;
    }
    // Fallback: return original URL if embed can't be derived (will render as a link)
    return postUrl;
  }

  if (platform === 'blog') {
    // Blog links don't require a special embed URL, we will render them as link cards
    return postUrl;
  }

  return postUrl;
}
```

### 3.2 Create `app/api/social-posts/route.ts`

Handles GET (fetch all posts) and POST (create a new post).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { deriveEmbedUrl } from '@/lib/utils/embedUrl';
import type { NewSocialPostPayload } from '@/lib/types/SocialPost';

function getCollection() {
  return clientPromise.then((client) =>
    client.db('fedkiit').collection('social_posts')
  );
}

// GET /api/social-posts
// Returns all posts. Pass ?visibleOnly=true to get only isVisible=true posts.
export async function GET(req: NextRequest) {
  try {
    const col = await getCollection();
    const visibleOnly = req.nextUrl.searchParams.get('visibleOnly') === 'true';
    const filter = visibleOnly ? { isVisible: true } : {};
    const posts = await col.find(filter).sort({ createdAt: -1 }).toArray();
    // Convert _id ObjectId to string for JSON serialisation
    const serialised = posts.map((p) => ({ ...p, _id: p._id.toString() }));
    return NextResponse.json(serialised, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/social-posts
// Body: { platform, postUrl, caption? }
// Header: x-admin-secret: <ADMIN_SECRET>
export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: NewSocialPostPayload = await req.json();
    const { platform, postUrl, caption } = body;

    if (!platform || !postUrl) {
      return NextResponse.json({ error: 'platform and postUrl are required' }, { status: 400 });
    }

    let embedUrl: string;
    try {
      embedUrl = deriveEmbedUrl(platform, postUrl);
    } catch {
      return NextResponse.json({ error: 'Could not parse post URL into an embed URL' }, { status: 400 });
    }

    const col = await getCollection();
    const result = await col.insertOne({
      platform,
      postUrl,
      embedUrl,
      caption: caption ?? '',
      isVisible: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ _id: result.insertedId.toString() }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
```

### 3.3 Create `app/api/social-posts/[id]/route.ts`

Handles PUT (edit) and DELETE (remove) for a single post by ID.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { deriveEmbedUrl } from '@/lib/utils/embedUrl';

function getCollection() {
  return clientPromise.then((c) => c.db('fedkiit').collection('social_posts'));
}

function auth(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

// PUT /api/social-posts/:id
// Body: { postUrl?, caption? }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { postUrl, caption, platform } = body;
    const updates: Record<string, unknown> = {};

    if (postUrl && platform) {
      updates.postUrl = postUrl;
      updates.embedUrl = deriveEmbedUrl(platform, postUrl);
    }
    if (caption !== undefined) updates.caption = caption;

    const col = await getCollection();
    await col.updateOne({ _id: new ObjectId(params.id) }, { $set: updates });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE /api/social-posts/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const col = await getCollection();
    await col.deleteOne({ _id: new ObjectId(params.id) });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
```

### 3.4 Create `app/api/social-posts/[id]/visibility/route.ts`

Handles PATCH (toggle isVisible).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

function getCollection() {
  return clientPromise.then((c) => c.db('fedkiit').collection('social_posts'));
}

// PATCH /api/social-posts/:id/visibility
// Body: { isVisible: boolean }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { isVisible } = await req.json();
    const col = await getCollection();
    await col.updateOne({ _id: new ObjectId(params.id) }, { $set: { isVisible } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
  }
}
```

---

## Phase 4 — Admin panel

### 4.1 Create `app/admin/page.tsx`

This is a **Client Component** (`"use client"`) because it manages local state and makes fetch calls from the browser.

The admin secret is entered by the user in the browser and stored in `sessionStorage` — it is never hardcoded in client code.

The full component should:

1. On first load, check `sessionStorage` for an existing `adminSecret`. If absent, render a simple login form with a password input.
2. On login form submit, save the entered value to `sessionStorage` as `adminSecret` and re-render.
3. Once authenticated (secret present in sessionStorage), call `GET /api/social-posts` with the header `x-admin-secret: <secret>`. If the server returns 401, clear the session and show the login form again.
4. Render a form with three fields: `platform` (select: instagram | linkedin), `postUrl` (text input), `caption` (text input, optional). On submit, call `POST /api/social-posts` and refresh the list.
5. Render a table with columns: Platform, URL, Caption, Visible, Actions. Each row has:
   - A toggle switch that calls `PATCH /api/social-posts/:id/visibility`
   - An Edit button that opens an inline edit form (replace the table row with inputs pre-filled)
   - A Delete button that calls `DELETE /api/social-posts/:id` after a `confirm()` prompt

Use the following structure (implement with full TypeScript types, proper error handling, and loading states):

```tsx
'use client';

import { useEffect, useState } from 'react';
import type { SocialPost } from '@/lib/types/SocialPost';

// ── helpers ──────────────────────────────────────────────────────────────────

const API = '/api/social-posts';

function authHeaders(secret: string) {
  return { 'Content-Type': 'application/json', 'x-admin-secret': secret };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AdminSocialPage() {
  const [secret, setSecret] = useState('');
  const [inputSecret, setInputSecret] = useState('');
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New post form state
  const [platform, setPlatform] = useState<'instagram' | 'linkedin' | 'blog'>('instagram');
  const [postUrl, setPostUrl] = useState('');
  const [caption, setCaption] = useState('');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editCaption, setEditCaption] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('adminSecret');
    if (saved) setSecret(saved);
  }, []);

  useEffect(() => {
    if (secret) fetchPosts();
  }, [secret]);

  async function fetchPosts() {
    setLoading(true);
    const res = await fetch(API, { headers: authHeaders(secret) });
    if (res.status === 401) { sessionStorage.removeItem('adminSecret'); setSecret(''); return; }
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('adminSecret', inputSecret);
    setSecret(inputSecret);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch(API, {
      method: 'POST',
      headers: authHeaders(secret),
      body: JSON.stringify({ platform, postUrl, caption }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setPostUrl(''); setCaption('');
    fetchPosts();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders(secret) });
    fetchPosts();
  }

  async function handleVisibilityToggle(id: string, current: boolean) {
    await fetch(`${API}/${id}/visibility`, {
      method: 'PATCH',
      headers: authHeaders(secret),
      body: JSON.stringify({ isVisible: !current }),
    });
    fetchPosts();
  }

  async function handleEditSave(id: string, currentPlatform: string) {
    await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: authHeaders(secret),
      body: JSON.stringify({ platform: currentPlatform, postUrl: editUrl, caption: editCaption }),
    });
    setEditId(null);
    fetchPosts();
  }

  // ── render: login ────────────────────────────────────────────────────────
  if (!secret) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow flex flex-col gap-4 w-full max-w-sm">
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <input
            type="password"
            placeholder="Admin secret"
            value={inputSecret}
            onChange={(e) => setInputSecret(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            required
          />
          <button type="submit" className="bg-black text-white rounded-lg py-2 text-sm">
            Enter
          </button>
        </form>
      </main>
    );
  }

  // ── render: dashboard ────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Social & Blog Posts</h1>
        <button
          onClick={() => { sessionStorage.removeItem('adminSecret'); setSecret(''); }}
          className="text-sm text-gray-500 underline"
        >
          Sign out
        </button>
      </div>

      {/* Add post form */}
      <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-6 mb-8 flex flex-col gap-4">
        <h2 className="font-medium">Add new post</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3 flex-wrap">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'instagram' | 'linkedin' | 'blog')}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="blog">Blog</option>
          </select>
          <input
            type="url"
            placeholder="Post URL"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            required
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[240px]"
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
          />
          <button type="submit" className="bg-black text-white rounded-lg px-5 py-2 text-sm">
            Add
          </button>
        </div>
      </form>

      {/* Posts table */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4">Platform</th>
                <th className="pb-3 pr-4">URL</th>
                <th className="pb-3 pr-4">Caption</th>
                <th className="pb-3 pr-4">Visible</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) =>
                editId === post._id ? (
                  <tr key={post._id} className="border-b">
                    <td className="py-3 pr-4 text-gray-500 capitalize">{post.platform}</td>
                    <td className="py-3 pr-4">
                      <input
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="border rounded px-2 py-1 text-xs w-full"
                      />
                    </td>
                    <td className="py-3 pr-4" />
                    <td className="py-3 flex gap-2">
                      <button
                        onClick={() => handleEditSave(post._id!, post.platform)}
                        className="text-xs bg-black text-white rounded px-3 py-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-xs text-gray-500 underline"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={post._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 pr-4 capitalize font-medium">{post.platform}</td>
                    <td className="py-3 pr-4 max-w-[200px] truncate">
                      <a href={post.postUrl} target="_blank" className="text-blue-600 underline">
                        {post.postUrl}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{post.caption || '—'}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleVisibilityToggle(post._id!, post.isVisible)}
                        className={`w-10 h-5 rounded-full transition-colors ${
                          post.isVisible ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        aria-label="Toggle visibility"
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow mx-0.5 transition-transform ${
                            post.isVisible ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 flex gap-3">
                      <button
                        onClick={() => {
                          setEditId(post._id!);
                          setEditUrl(post.postUrl);
                          setEditCaption(post.caption ?? '');
                        }}
                        className="text-xs underline text-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post._id!)}
                        className="text-xs underline text-red-500"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No posts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
```

---

## Phase 5 — Social & Blogs page component

### 5.1 Update `next.config.ts`

Instagram and LinkedIn embed iframes require the domain to be allowed. Update `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "frame-src https://www.instagram.com https://www.linkedin.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

> **Important:** If the existing codebase already has a CSP header configured, merge the `frame-src` directive into it rather than replacing.

### 5.2 Create `components/SocialFeed.tsx`

This is a **Server Component** (no `"use client"` directive). It fetches posts directly from the database on the server side — no client-side fetch needed.

```tsx
import clientPromise from '@/lib/mongodb';
import type { SocialPost } from '@/lib/types/SocialPost';

async function getVisiblePosts(): Promise<SocialPost[]> {
  const client = await clientPromise;
  const posts = await client
    .db('fedkiit')
    .collection('social_posts')
    .find({ isVisible: true })
    .sort({ createdAt: -1 })
    .toArray();

  return posts.map((p) => ({ ...p, _id: p._id.toString() })) as SocialPost[];
}

export default async function SocialFeed() {
  const posts = await getVisiblePosts();

  if (posts.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">No posts to show yet.</p>
    );
  }

  return (
    <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 py-8">
      {posts.map((post) => (
        <div key={post._id} className="flex flex-col gap-3">
          {post.platform === 'instagram' ? (
            <iframe
              src={post.embedUrl}
              className="w-full rounded-xl border"
              style={{ minHeight: '540px' }}
              scrolling="no"
              allowTransparency
              allow="encrypted-media"
              title={`Instagram post${post.caption ? ': ' + post.caption : ''}`}
            />
          ) : post.platform === 'linkedin' ? (
            <iframe
              src={post.embedUrl}
              className="w-full rounded-xl border"
              style={{ minHeight: '400px' }}
              scrolling="no"
              allowTransparency
              allow="encrypted-media"
              title={`LinkedIn post${post.caption ? ': ' + post.caption : ''}`}
            />
          ) : (
            <div className="w-full rounded-xl border p-6 flex flex-col justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors" style={{ minHeight: '400px' }}>
              <h3 className="text-lg font-semibold mb-2">Blog Post</h3>
              <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-center">
                Read Blog Post
              </a>
            </div>
          )}
          {post.caption && (
            <p className="text-sm text-gray-600 px-1">{post.caption}</p>
          )}
        </div>
      ))}
    </section>
  );
}
```

### 5.3 Add `<SocialFeed />` to the Social & Blogs page

Find the existing Social & Blogs page file in the `app/` directory (likely `app/social/page.tsx`, `app/blogs/page.tsx`, or similar). Import and render `SocialFeed` inside it:

```tsx
import SocialFeed from '@/components/SocialFeed';

export default function SocialPage() {
  return (
    <main>
      {/* ... existing page content ... */}
      <SocialFeed />
    </main>
  );
}
```

> **If no Social or Blogs page exists yet:** create `app/social/page.tsx` with the above content and use it as the merged page.

---

## Phase 6 — Route protection (middleware)

Create `middleware.ts` in the **project root** (same level as `package.json`).

This prevents non-admins from loading the `/admin` page at all. The middleware does **not** check the admin secret (that is done in the API routes) — it simply redirects unauthenticated visits to a login path.

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard the /admin route
  if (pathname.startsWith('/admin')) {
    // The admin panel handles auth itself via sessionStorage on the client.
    // This middleware is a placeholder — extend it with cookie-based auth
    // if stricter protection is needed in the future.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

> **Note:** Because this project has no server-side session infrastructure yet, auth is handled client-side via `sessionStorage` (see Phase 4). The middleware can be extended later with `NextResponse` cookie checks if a proper session layer is added.

---

## Final file checklist

After completing all phases, the following new files should exist:

```
.env.local                                      ← do not commit
lib/
  mongodb.ts
  types/
    SocialPost.ts
  utils/
    embedUrl.ts
app/
  api/
    social-posts/
      route.ts                                  ← GET, POST
      [id]/
        route.ts                                ← PUT, DELETE
        visibility/
          route.ts                              ← PATCH
  admin/
    page.tsx                                    ← Admin dashboard
  social/
    page.tsx                                    ← (create if absent, else edit)
components/
  SocialFeed.tsx
middleware.ts
next.config.ts                                  ← updated with frame-src CSP
```

---

## Edge cases the agent must handle

1. **Instagram URLs**: The URL the admin pastes must contain `/p/` (feed post). Reels use `/reel/` — adjust the regex in `embedUrl.ts` if reels need to be supported: replace `\/p\/` with `\/(?:p|reel)\/`.

2. **LinkedIn embed URL format**: LinkedIn's embed URL requires the activity ID. If the admin pastes a URL that does not contain `activity-{digits}`, the `deriveEmbedUrl` function falls back to the raw URL. In the admin panel, warn the user with an inline error if the embed URL could not be derived (i.e. `embedUrl === postUrl` and platform is linkedin).

3. **MongoDB ObjectId**: Always import `ObjectId` from `'mongodb'` and wrap the string `id` with `new ObjectId(id)` before querying by `_id`. Missing this will silently return no results.

4. **Serialisation**: MongoDB's `_id` field is an `ObjectId` object, not a string. Always call `.toString()` on it before returning from API routes or server components, otherwise Next.js will throw a serialisation error.

5. **CSP conflicts**: If the project already sets any `Content-Security-Policy` header (check `next.config.ts` and any `app/layout.tsx` `<meta http-equiv>` tags), do not add a second one — merge the `frame-src` directive into the existing policy.

6. **iframe not loading**: Instagram iframes sometimes require the page to be served over HTTPS. This will work correctly on Vercel/production but may not render in local `http://localhost` development. This is expected behaviour.
