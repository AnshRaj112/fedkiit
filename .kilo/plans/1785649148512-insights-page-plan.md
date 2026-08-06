# INSIGHTS Page — Implementation Plan

## Goal

Merge the existing `/Social` and `/Blog` pages into a single `/Insights` page with two sections: **Our Socials** and **Blogs**.

## Current State

| Page | Route | Component | Data Source |
|---|---|---|---|
| Social | `/Social` | `app/(main)/Social/page.jsx` → `SocialFeed` (server) | Prisma `socialPost` table via `@/lib/db` |
| Blog | `/Blog` | `app/(main)/Blog/page.jsx` → `Blog` (client) | `/api/blog/getBlog` → Prisma `blog` table |

- Navbar has separate links: `Social` and `Blogs`
- `proxy.ts` maps `/social` → `/Social` and `/blog` → `/Blog`
- Both pages are inside `app/(main)/` route group, wrapped by `MainLayout` (Navbar + Footer + Chatbot)

## Changes Required

### 1. Create `app/(main)/Insights/page.jsx`

New route entry. Server component that renders two sections:
- **Our Socials** — uses `SocialFeed` (already exists at `@/components/SocialFeed`)
- **Blogs** — uses `Blog` client component (already exists at `@/src/views/Blog/Blog`)

```jsx
import SocialFeed from "@/components/SocialFeed";
import Blog from "@/src/views/Blog/Blog";

export default function InsightsPage() {
  return (
    <main className="w-full">
      <section id="socials">
        <h2>Our Socials</h2>
        <SocialFeed />
      </section>
      <section id="blogs">
        <h2>Blogs</h2>
        <Blog />
      </section>
    </main>
  );
}
```

### 2. Delete `app/(main)/Social/page.jsx`

Remove the old standalone Social page route. The INSIGHTS page replaces it.

### 3. Delete `app/(main)/Blog/page.jsx`

Remove the old standalone Blog page route. The INSIGHTS page replaces it.

### 4. Update `proxy.ts`

Replace `/social` and `/blog` mappings with `/insights`:

```diff
-  ["/social", "/Social"],
-  ["/blog", "/Blog"],
+  ["/insights", "/Insights"],
```

Also update the `CANONICAL` map entries for `/social` and `/blog` to point to `/Insights`.

### 5. Update `app/layout.tsx` metadata

Add `/Insights` to the `metadataBase` URL resolution and any sitemap/robots entries if needed.

### 6. Update `app/sitemap.ts`

Replace `/Social` and `/Blog` entries with `/Insights`.

### 7. Update `app/robots.ts`

Replace `/Social` and `/Blog` entries with `/Insights` if present.

### 8. Update Navbar links

In `src/layouts/Navbar/Navbar.tsx`:
- Replace the `Social` link (`href="/Social"`) with `href="/Insights"`
- Replace the `Blogs` link (`href="/Blog"`) with `href="/Insights"`
- OR collapse into a single `Insights` nav item

### 9. Update `src/context/Providers.jsx` and `RecoveryContext` if needed

No changes expected — the Blog client component already works inside the Providers tree.

## Files Modified

| File | Action |
|---|---|
| `app/(main)/Insights/page.jsx` | **Create** |
| `app/(main)/Social/page.jsx` | **Delete** |
| `app/(main)/Blog/page.jsx` | **Delete** |
| `proxy.ts` | **Modify** |
| `app/sitemap.ts` | **Modify** |
| `app/robots.ts` | **Modify** |
| `src/layouts/Navbar/Navbar.tsx` | **Modify** |

## Data Flow

- **Our Socials section**: `SocialFeed` (server component) queries Prisma directly → renders iframe grid from `social_posts` MongoDB collection
- **Blogs section**: `Blog` (client component) fetches from `/api/blog/getBlog` → renders `BlogCard` components with search/filter

Both sections are independent and do not interfere with each other.

## Risks

1. **SEO impact**: Two separate pages (`/Social`, `/Blog`) become one (`/Insights`). Update any external links or social shares.
2. **Navbar link count**: Merging two nav items into one reduces navigation options. Consider whether users need quick access to just socials or just blogs.
3. **Page length**: The INSIGHTS page will be longer (social embeds + blog cards). Consider lazy-loading the Blog section or using `scroll`-based section navigation.
4. **SocialEmbed component**: The old `src/views/Social/Social.jsx` uses hardcoded `SocialEmbed` components. This is NOT used by the new INSIGHTS page (which uses `SocialFeed` instead). The old `Social.jsx` can remain as dead code or be cleaned up later.

## Validation

1. Run `npm run build` and verify no compilation errors
2. Run `npm run dev` and verify `/Insights` renders both sections
3. Verify `/Social` and `/Blog` redirect to `/Insights` via proxy
4. Verify navbar links point to `/Insights`
5. Verify sitemap and robots.txt reference `/Insights`
6. Test that SocialFeed loads posts from Prisma and Blog loads posts from the API
