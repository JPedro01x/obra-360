# Workspace Real-Time Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make successful, persisted changes visible to other authorized users of the same company without manual page refresh, across Obra360 workspace modules.

**Architecture:** Use an authenticated Server-Sent Events stream for small invalidation notices. A backend filter observes successful mutating `/api/v1/workspace/**` and `/api/v1/portal/**` requests after the controller and its transaction return, then publishes only company-scoped metadata; clients refetch through the existing permission-checked REST endpoints. The browser connects with its existing bearer token using `fetch` streaming, reconnects with backoff, and exposes a shared change signal to active module views. No business record or personal data is included in the event.

**Tech Stack:** Spring Boot 4 / Servlet MVC / Spring Security JWT; React 18 + TypeScript; existing REST API and tenant context.

**Spec:** Approved design in the conversation on 2026-11-27: authenticated SSE; notify same-company sessions after persisted writes; refetch via normal RBAC-protected APIs; preserve unsaved form edits; BIM signals a newer revision and retains its existing conflict control.

## Global Constraints

- Tenant identity comes from the authenticated user and `TenantContext`, never from a client-supplied tenant header.
- Events carry no row contents, credentials, document bodies, or personal data.
- Only successful writes in authenticated workspace/portal APIs emit events; reads, login, failed requests, and external integration calls do not.
- Existing REST authorization remains the source of truth for data reads and mutations.
- Do not overwrite unsaved editor state when a change arrives.
- No WebSocket collaboration or automatic field merging is in scope.

## Review Focus

- A user from another company cannot receive change notices for the tenant: exercise two authenticated tenants.
- A failed, denied, or validation-rejected write does not publish a notice: assert no SSE event.
- Session expiry closes the stream and clears authentication instead of reconnecting forever: verify 401 behavior.
- Reconnecting after a dropped stream refreshes current data: verify initial resync after reconnect.
- A notice received during an unsaved form edit does not erase the user's draft: verify queued refresh behavior.

## File Map

- Backend `WorkspaceChangeStream`, `WorkspaceRealtimeController`, and `WorkspaceMutationEventFilter`: stream, authenticated endpoint, and successful-write detection.
- Backend `SecurityConfig` and focused security integration tests: register the filter in the authenticated chain and protect tenant boundaries.
- Frontend `src/services/realtime.ts`: bearer-authenticated stream client, reconnection, and event subscription.
- Frontend `src/components/Workspace.tsx`: connect for the active session, refresh paginated workspace records, and expose pending change state.
- Frontend focused workspace views that load their own REST data (modeler, RH, finance/purchases, integrations, chat, measurements, invoices, portals): subscribe and refetch only after a safe save/idle point.
- `docs/operacao/atualizacoes-em-tempo-real.md`: local and production configuration, limits, and troubleshooting.

---

### Task 1: Backend tenant-scoped change stream

**Files:** Create `WorkspaceChangeStream.java`, `WorkspaceRealtimeController.java`; modify `SecurityConfig.java`; test in `WorkspaceSecurityIntegrationTest.java`.

**Interfaces:** `WorkspaceChangeStream.publish(long tenantId, String module)` and `WorkspaceChangeStream.subscribe(long tenantId)`; `GET /api/v1/workspace/eventos` returns `text/event-stream` and requires the existing bearer token.

- [x] Define a bounded subscriber registry keyed by tenant; each event contains event ID, module key, and server timestamp only.
- [x] Write integration assertions for authenticated subscription and tenant isolation; verify disconnect cleanup and bounded connections in unit tests.
- [x] Implement the stream endpoint with cleanup on completion, timeout, and error; set no-cache and proxy-buffering headers.
- [x] Register endpoint under the existing stateless JWT security policy.
- [x] Run focused backend verification and inspect subscriber cleanup behavior.

### Task 2: Emit notices after successful persisted writes

**Files:** Create `WorkspaceMutationEventFilter.java`; modify `SecurityConfig.java`; extend `WorkspaceSecurityIntegrationTest.java`.

**Interfaces:** Filter runs after JWT authentication; recognizes authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests under workspace/portal routes; publishes only when the final status is 2xx and the server-derived tenant is available.

- [x] Verify a successful create, validation failure, read request, and authenticated stream; tenant isolation is asserted in the focused integration test. Forbidden and public-auth edge cases were not separately exercised.
- [x] Capture the authenticated tenant before invoking handlers; publish only after a successful response.
- [x] Exclude authentication and installation endpoints and emit no event for reads or streaming routes.
- [x] Confirm the JWT filter's tenant context is available and no tenant header is trusted.

### Task 3: Browser stream client and shared change signal

**Files:** Create `src/services/realtime.ts`; modify `src/services/http.ts` only if a shared authenticated fetch helper is needed; add a focused frontend verification fixture if the repository's existing test conventions support it.

**Interfaces:** `connectWorkspaceChanges({ signal, onChange, onUnauthorized })`; event payload is `{ id, module, occurredAt }`.

- [x] Parse SSE frames from `fetch` streaming with `Authorization: Bearer ...`; never put the token in a URL.
- [x] Reconnect with bounded backoff, stop on abort/logout/401, and trigger a resync after reconnect.
- [x] Avoid duplicate listeners and clear timers/readers on unmount.

### Task 4: Refresh active views safely

**Files:** Modify `src/components/Workspace.tsx` and the self-loading workspace views listed in File Map; create `src/hooks/useWorkspaceChanges.ts` if shared hook is clearer.

**Interfaces:** Shared hook accepts module keys and a reload callback; it reports pending changes while the view has unsaved edits.

- [x] Refresh the paginated records view when a workspace event arrives.
- [x] Wire self-loading workspace screens to refetch authorized data; BIM retains its revision/conflict control.
- [x] Preserve local edits in the model editor, cloud draft, and measurement form.
- [x] Ensure logout and session expiry close the stream; reconnect after successful login only.
- [ ] Two-browser acceptance was not run; backend integration tests verify tenant isolation and the frontend parser/build are verified.

### Task 5: Operations and rollout notes

**Files:** Create `docs/operacao/atualizacoes-em-tempo-real.md`.

- [x] Document proxy settings, heartbeat, timeout behavior, and current single-instance boundary.
- [x] Document the shared-fan-out requirement before running multiple backend replicas.
- [x] Document reconnect behavior and applying queued updates while editing.

## Verification

- Focused backend integration verification: SSE auth, tenant isolation, successful-write event, and no event on failed write.
- Frontend typecheck/build and two-session browser acceptance for active views, reconnect, logout, and unsaved-edit preservation.
- Production deployment review: verify proxy buffering is disabled for the event route and the configured topology matches the documented fan-out boundary.
