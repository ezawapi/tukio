# Tukio — technical rules

- Event forms (create, edit, admin dialogs) autosave through `useEventDraft` into `event_drafts`; the expiry window is fixed by a DB trigger on first save and expired rows are hidden by RLS and purged hourly — so drafts can never outlive their TTL even if cleanup lags.
- Page effects that load form data must key on `user?.id` (never the `user` object) and load once per record — auth re-emits the session on focus/token refresh, which used to wipe open forms.
- Sub-categories live in `sub_categories` (FK to `categories`) and events reference them via `events.sub_category_ids uuid[]`; pick them with `SubCategoryPicker`, read them with `useSubCategories` — one cached list filtered client-side.
- Store venue links separately in `events.venue_url`; use the shared venue-link validator, field and button across event forms and details, with a database constraint as the final enforcement layer, so addresses and map data remain intact.
