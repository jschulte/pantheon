# Design Language Reference (DLR)

> **Project:** [Project Name]
> **Created:** [Date]
> **Last Updated:** [Date]
> **Status:** DRAFT | ACTIVE | NEEDS_UPDATE
>
> This document is the source of truth for UI/UX patterns in this application.
> It is maintained by the Harmonia UX audit workflow and reviewed by the team.
> Patterns marked as **CANONICAL** are the standard. Deviations require justification.

---

## 1. Interaction Patterns

### 1.1 Form Submission

**CANONICAL Pattern:**
- **Trigger:** [Button click | Auto-save | Both]
- **Button label:** [Convention: "Save" for updates, "Create" for new, specific verb for actions]
- **Button position:** [Bottom-right of form | Sticky footer | Inline after last field]
- **Keyboard shortcut:** [Ctrl+Enter | None]
- **Unsaved changes:** [Browser prompt on navigate | Custom modal | None]
- **After success:** [Stay on page with confirmation | Redirect to list | Redirect to detail]

**Where it's implemented:**
- [Page/component] — [matches | deviates: how]

### 1.2 Form Validation

**CANONICAL Pattern:**
- **Timing:** [On blur | On submit | Real-time as-you-type | Hybrid]
- **Error display:** [Inline below field | Summary at top | Toast notification | Combination]
- **Error styling:** [Red border + error text below | Red background | Icon + text]
- **Required indication:** [Asterisk on label | "(required)" text | Bold label | All fields required unless marked optional]
- **Success indication:** [Green checkmark | None | Border color change]

**Where it's implemented:**
- [Page/component] — [matches | deviates: how]

### 1.3 Destructive Actions

**CANONICAL Pattern:**
- **Confirmation required:** [Always | Only for bulk | Only for permanent | Never]
- **Confirmation UI:** [Modal dialog | Inline "Are you sure?" | Type-to-confirm | Undo instead]
- **Confirm button:** [Label: "Delete" | "Remove" | "Yes, delete" — Color: red/destructive variant]
- **Cancel button:** [Label: "Cancel" | "No, keep it" — Position: left of confirm | right of confirm]

**Where it's implemented:**
- [Page/component] — [matches | deviates: how]

### 1.4 Search

**CANONICAL Pattern:**
- **Behavior:** [Instant/debounced | Press Enter | Click search button]
- **Debounce:** [Xms]
- **Placeholder:** ["Search..." | "Search [context]..." | "Type to search..."]
- **Clear button:** [X button inside field | Separate clear link | Backspace only]
- **No results:** [Message text and CTA pattern]
- **Scope indication:** [Shown | Hidden | Dropdown to change]

**Where it's implemented:**
- [Page/component] — [matches | deviates: how]

### 1.5 Selection & Multi-select

**CANONICAL Pattern:**
- **Single select:** [Radio buttons | Dropdown | Segmented control | Card click]
- **Multi-select:** [Checkboxes | Shift+click | Ctrl+click | Chip input]
- **Bulk actions:** [Appear in toolbar when items selected | Always visible but disabled | Floating action bar]
- **Select all:** [Checkbox in header | "Select all X items" link | Both]

**Where it's implemented:**
- [Page/component] — [matches | deviates: how]

### 1.6 Sorting & Filtering

**CANONICAL Pattern:**
- **Sort trigger:** [Click column header | Dropdown selector | Toggle buttons]
- **Sort indicator:** [Arrow icon in header | Text label | Highlighted column]
- **Filter UI:** [Sidebar panel | Dropdown menus | Filter chips | Search bar]
- **Active filter indication:** [Badge count | Chip list | Highlighted controls]
- **Clear filters:** [Button | "Clear all" link | X on each chip]

**Where it's implemented:**
- [Page/component] — [matches | deviates: how]

### 1.7 Pagination / Infinite Scroll

**CANONICAL Pattern:**
- **Type:** [Pagination | Infinite scroll | Load more button | Cursor-based]
- **Items per page:** [Default count, configurable?]
- **Controls:** [Page numbers | Prev/Next | Both]
- **Position:** [Bottom of list | Top and bottom | Sticky footer]

**Where it's implemented:**
- [Page/component] — [matches | deviates: how]

---

## 2. Visual Language

### 2.1 Button Hierarchy

| Level | Style | Usage | Example |
|-------|-------|-------|---------|
| Primary | [Filled, brand color] | Main action per section | "Save", "Create" |
| Secondary | [Outlined or ghost] | Alternative actions | "Cancel", "Export" |
| Tertiary | [Text-only / link-style] | Low-priority actions | "Learn more", "Skip" |
| Destructive | [Red filled or red outlined] | Delete, remove, revoke | "Delete", "Remove" |
| Disabled | [Muted colors, no pointer] | Unavailable actions | Any button in disabled state |

### 2.2 Typography Scale

| Element | Size | Weight | Color | Usage |
|---------|------|--------|-------|-------|
| Page title | [Xpx/rem] | [bold] | [color] | One per page, top of content |
| Section heading | [Xpx/rem] | [semibold] | [color] | Major content sections |
| Subsection | [Xpx/rem] | [medium] | [color] | Within sections |
| Body text | [Xpx/rem] | [regular] | [color] | Default content |
| Caption/help text | [Xpx/rem] | [regular] | [muted color] | Supplementary info |
| Label | [Xpx/rem] | [medium] | [color] | Form field labels |

### 2.3 Color Semantics

| Semantic | Color | Usage | Never Use For |
|----------|-------|-------|---------------|
| Error/Danger | [#hex] | Errors, destructive actions, validation failures | Decorative, branding |
| Success | [#hex] | Confirmations, completed states, valid inputs | Branding, links |
| Warning | [#hex] | Caution states, approaching limits, deprecation | Errors, decoration |
| Info | [#hex] | Informational messages, tips, neutral status | Errors, warnings |
| Primary/Brand | [#hex] | CTAs, links, active states, brand elements | Errors, warnings |
| Muted/Disabled | [#hex] | Disabled states, placeholder text, borders | Active elements |

### 2.4 Icon System

**Library:** [Material Icons | Lucide | Heroicons | FontAwesome | Custom | Mixed]
**Size convention:** [16px inline, 20px buttons, 24px standalone, 48px empty states]
**Color convention:** [Inherit text color | Fixed colors for semantic icons]

| Concept | Icon | Used Consistently? |
|---------|------|--------------------|
| Edit | [pencil / edit-2 / etc.] | [Yes | No: page X uses different] |
| Delete | [trash / x-circle / etc.] | [Yes | No] |
| Add/Create | [plus / plus-circle / etc.] | [Yes | No] |
| Settings | [gear / sliders / etc.] | [Yes | No] |
| Search | [search / magnifying-glass] | [Yes | No] |
| Close | [x / x-circle] | [Yes | No] |
| Menu | [hamburger / dots-vertical] | [Yes | No] |
| Back | [arrow-left / chevron-left] | [Yes | No] |

### 2.5 Spacing & Rhythm

**Base unit:** [4px | 8px]
**Scale:** [4, 8, 12, 16, 24, 32, 48, 64]

| Context | Value | Notes |
|---------|-------|-------|
| Page margin (desktop) | [Xpx] | |
| Page margin (mobile) | [Xpx] | |
| Section gap | [Xpx] | Between major sections |
| Card padding | [Xpx] | Internal card spacing |
| Form field gap | [Xpx] | Between form fields |
| Label-to-input gap | [Xpx] | Between label and its field |
| Button internal padding | [Xpx Y] | Horizontal / vertical |
| Inline element gap | [Xpx] | Between buttons in a row |

---

## 3. Layout Patterns

### 3.1 Page Structure

**CANONICAL Layout:**
```
┌─────────────────────────────────────┐
│ [Header / Navigation Bar]           │
├──────────┬──────────────────────────┤
│          │ [Breadcrumbs]            │
│ [Side    │ [Page Title]             │
│  Nav]    │ [Page Actions: + Create] │
│          │                          │
│          │ [Content Area]           │
│          │                          │
│          │ [Pagination]             │
├──────────┴──────────────────────────┤
│ [Footer] (if applicable)            │
└─────────────────────────────────────┘
```

- **Sidebar:** [Always visible | Collapsible | Hidden on mobile | None]
- **Breadcrumbs:** [Always on subpages | Never | Only 3+ levels deep]
- **Page actions:** [Top-right of content | Below title | Floating action button]

### 3.2 Data Table Layout

**CANONICAL Pattern:**
```
┌──────────────────────────────────────────┐
│ [Table Title]        [Search] [Filter] ▼ │
├──┬──────────┬───────────┬────────┬───────┤
│☐ │ Name ↕   │ Status ↕  │ Date ↕ │ ••• │
├──┼──────────┼───────────┼────────┼───────┤
│☐ │ Item 1   │ Active    │ Jan 1  │ ••• │
│☐ │ Item 2   │ Inactive  │ Jan 2  │ ••• │
├──┴──────────┴───────────┴────────┴───────┤
│ Showing 1-10 of 50     [< 1 2 3 4 5 >]  │
└──────────────────────────────────────────┘
```

- **Row actions:** [Three-dot menu | Inline buttons | Hover reveal]
- **Row click:** [Navigate to detail | Select row | No action]
- **Empty table:** [Message + CTA to create first item]

### 3.3 Form Layout

**CANONICAL Pattern:**
- **Field arrangement:** [Single column | Two columns on wide screens | Grouped sections]
- **Label position:** [Above field | Left of field | Floating inside field]
- **Action buttons:** [Bottom-right: Primary + Secondary | Full-width on mobile]
- **Section dividers:** [Heading | Horizontal rule | Card per section | Accordion]

### 3.4 Card Layout

**CANONICAL Pattern:**
- **Shadow:** [shadow-sm | shadow-md | none with border]
- **Border radius:** [Xpx]
- **Hover state:** [Slight lift | Border color | Background change | None]
- **Click behavior:** [Navigate to detail | Expand | None (actions inside)]

### 3.5 Modal / Dialog Layout

**CANONICAL Pattern:**
- **Overlay:** [Dark backdrop | Blur backdrop | None]
- **Close methods:** [X button | Click outside | Escape key | All three]
- **Width:** [Small: 400px | Medium: 600px | Large: 800px | Full on mobile]
- **Actions position:** [Bottom-right | Bottom full-width | Top-right]
- **Scrolling:** [Body scrolls, actions fixed | Entire modal scrolls]

---

## 4. Feedback & State Patterns

### 4.1 Loading States

| Context | Pattern | Example |
|---------|---------|---------|
| Full page | [Spinner centered | Skeleton | Progress bar] | Initial page load |
| Data table | [Skeleton rows | Spinner overlay | Shimmer] | Table data loading |
| Button action | [Button spinner + disabled | Text change "Saving..."] | Form submit |
| Inline content | [Skeleton placeholder | Spinner | Dots animation] | Component loading |
| Image | [Blur-up | Skeleton | Spinner] | Image loading |

### 4.2 Empty States

**CANONICAL Pattern:**
```
┌────────────────────────┐
│                        │
│    [Illustration]      │
│                        │
│  [Title: "No X yet"]   │
│  [Description: how to  │
│   get started]         │
│                        │
│  [CTA: "Create X"]     │
│                        │
└────────────────────────┘
```

- **Illustration:** [From set X | Icon only | None]
- **Title pattern:** "No [items] yet" | "Nothing here" | "[Items] will appear here"
- **CTA:** [Always present | Only when user can create | Never]

### 4.3 Error States

| Error Type | Display Pattern |
|------------|-----------------|
| Field validation | [Inline below field in red] |
| Form submission | [Toast at top-right | Banner at top of form | Modal] |
| Network/API error | [Full page error | Toast | Banner | Inline retry] |
| 404 Not Found | [Custom page with navigation back] |
| 500 Server Error | [Custom page with retry option] |
| Permission denied | [Redirect to login | Error message in place | Modal] |

### 4.4 Success Confirmation

| Action Type | Confirmation Pattern |
|-------------|---------------------|
| Form save | [Toast "Saved" | Redirect to detail with banner | Inline checkmark] |
| Item create | [Redirect to new item | Toast + stay on list | Modal "Created!"] |
| Item delete | [Toast "Deleted" + item removed | Item fade out | Redirect] |
| Settings update | [Inline "Saved" text | Toast | Auto-save indicator] |
| Bulk action | [Toast with count "3 items deleted" | Banner | Updated count] |

### 4.5 Toast / Notification System

**CANONICAL Pattern:**
- **Position:** [Top-right | Top-center | Bottom-right | Bottom-center]
- **Duration:** [X seconds for success | Persistent for errors | Dismissible]
- **Stacking:** [Stack vertically | Replace previous | Queue]
- **Types:** [Success (green) | Error (red) | Warning (yellow) | Info (blue)]
- **Dismiss:** [X button | Click | Auto after duration | Swipe]

---

## 5. Navigation Patterns

### 5.1 Primary Navigation

- **Type:** [Top bar | Side bar | Both]
- **Items:** [List main nav items]
- **Active state:** [Bold text | Background highlight | Left border | Underline]
- **Mobile behavior:** [Hamburger menu | Bottom tabs | Drawer]
- **Collapse behavior:** [Icons only | Full collapse | Overlay]

### 5.2 Breadcrumbs

- **Present on:** [All subpages | Only 3+ depth | Never]
- **Separator:** [/ | > | chevron icon]
- **Current page:** [Not linked, bold | Not linked, normal | Not shown]
- **Truncation:** [Ellipsis for long paths | Collapse middle items]

### 5.3 Tab Navigation

- **Style:** [Underline | Pill/chip | Box tabs | Vertical tabs]
- **Active indicator:** [Bold + underline | Filled background | Border bottom]
- **Overflow:** [Scroll horizontal | More dropdown | Wrap to next line]

---

## 6. Content & Voice Conventions

### 6.1 Microcopy Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Create button | ["Create [noun]" | "Add [noun]" | "New [noun]" | "+ [noun]"] | "Create Project" |
| Save button | ["Save" | "Save changes" | "Update"] | "Save" |
| Cancel button | ["Cancel" | "Discard" | "Never mind"] | "Cancel" |
| Delete button | ["Delete" | "Remove" | "Delete [noun]"] | "Delete" |
| Confirm action | ["Yes, [verb]" | "[Verb]" | "Confirm"] | "Yes, delete" |
| Back link | ["Back" | "Back to [page]" | "← [Page]"] | "Back to Projects" |

### 6.2 Data Formatting

| Data Type | Format | Example |
|-----------|--------|---------|
| Date (display) | [MMM D, YYYY | MM/DD/YYYY | relative] | "Jan 15, 2025" |
| Date (input) | [Date picker | MM/DD/YYYY text | ISO] | Date picker |
| Time | [12h | 24h | relative] | "3:45 PM" |
| Currency | [$X,XXX.XX | X,XXX.XX USD] | "$1,234.56" |
| Numbers | [Commas | Spaces | None] | "1,234" |
| Phone | [(XXX) XXX-XXXX | XXX-XXX-XXXX] | "(555) 123-4567" |
| Boolean (display) | [Yes/No | True/False | ✓/✗ | Toggle | Badge] | "Yes" |
| Null/empty | [— | N/A | (empty) | "None" | blank] | "—" |
| Truncation | [Ellipsis after N chars | Tooltip on hover | "Show more"] | "Long text th..." |

### 6.3 Error Message Structure

**CANONICAL Pattern:**
```
[What happened] — [Why it happened] — [What to do]
```

**Tone:** [Friendly and helpful | Neutral and technical | Apologetic]

**Examples:**
- Field validation: "[Field] is required" | "Please enter your [field]" | "This field can't be empty"
- API error: "Couldn't save your changes. Please try again." | "Error saving. Try again later."
- Permission: "You don't have access to this page." | "Access denied. Contact your admin."

---

## 7. Intentional Deviations

> Document any pages or components that intentionally deviate from the patterns above,
> with the reason for the deviation.

| Page/Component | Pattern | Deviation | Reason |
|---------------|---------|-----------|--------|
| [Example] | [Pattern name] | [What's different] | [Why it's intentional] |

---

## 8. Pattern Adoption Tracker

> Track which pages have been audited and conform to the DLR.

| Page/Route | Last Audited | Status | Notes |
|------------|-------------|--------|-------|
| [/dashboard] | [Date] | [Conforms | Deviates | Not audited] | [Brief notes] |

---

*This document is maintained by the Harmonia UX audit workflow. Run a BOOTSTRAP audit to populate it from the current application state, or update it manually as design decisions evolve.*
