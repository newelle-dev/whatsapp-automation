### Implementation Plan: Outlet + Map Link Safety

This plan focuses on preventing message mistakes where place/map link is not updated.

### Scope

- Add controlled outlet selection (Bangsar, KLGCC, SS2).
- Add template placeholders for outlet name and map link.
- Block sending if outlet data or placeholders are invalid.
- Show clear preview and warnings before send.

### Assumptions

- Feature targets appointment campaign first.
- Existing templates continue to work, but users are encouraged to migrate to new placeholders.

### Delivery Phases

#### Phase 1: Foundation (Config + Backend Rendering)

- [x] Add outlet config source (`name`, `mapLink`) in `services/config/outlets.js`.
    - Estimate: 0.5h
    - Dependency: none
- [x] Extend message rendering to support `{{outletName}}` and `{{outletMapLink}}`.
    - Files: `services/templates/templateRenderer.js`, `services/messageBuilder.js`
    - Estimate: 1h
    - Dependency: outlet config exists
- [x] Keep backward compatibility for templates that do not include new placeholders.
    - Estimate: 0.25h
    - Dependency: rendering update

#### Phase 2: Validation Gate (Hard Stop on Send)

- [x] Add preflight validator utility (e.g. `services/templates/templateValidation.js`).
    - Checks:
        - Selected outlet exists in config
        - Outlet map link is valid and non-empty
        - Final rendered messages contain no unresolved `{{...}}` placeholders
    - Estimate: 1h
    - Dependency: Phase 1
- [x] Enforce validation in send entry route.
    - File: `routes/sendingRoutes.js`
    - Behavior: return HTTP 400 with actionable error if validation fails
    - Estimate: 0.75h
    - Dependency: validator utility

#### Phase 3: Frontend UX (Prevent User Error Early)

- [x] Add required outlet selector in upload/preview flow.
    - Files: `frontend/src/components/UploadSection.jsx` (or `PreviewSection.jsx`), `frontend/src/hooks/useWhatsAppAutomation.js`
    - Estimate: 1.5h
    - Dependency: outlet config endpoint/availability strategy decided
- [x] Pass selected outlet to backend when starting send.
    - File: `frontend/src/hooks/useWhatsAppAutomation.js`
    - Estimate: 0.5h
    - Dependency: route contract update
- [x] Disable Start Sending until outlet is selected and preflight passes.
    - File: `frontend/src/components/PreviewSection.jsx`
    - Estimate: 0.75h
    - Dependency: validation feedback contract
- [x] Update template editor placeholder help to include new placeholders.
    - File: `frontend/src/components/TemplateEditorModal.jsx`
    - Estimate: 0.25h
    - Dependency: Phase 1 placeholders finalized

> Note: Bangsar is fully wired. KLGCC and SS2 are selectable in the UI, but their backend map links still need real URLs before those outlets can pass preflight and be sent.

#### Phase 4: Optional Nice-to-Haves

- [ ] Add template lint warnings on save (warn if hardcoded outlet names detected).
    - File: `routes/templateRoutes.js`
    - Estimate: 1h
    - Dependency: Phase 2 validator patterns
- [ ] Add a "Selected outlet" summary card above preview list.
    - File: `frontend/src/components/PreviewSection.jsx`
    - Estimate: 0.5h
    - Dependency: outlet selector

### API Contract Changes

- `POST /api/start-sending`
    - New request field: `selectedOutletKey`
    - Validation errors example:
        - `Outlet is required before sending.`  
        - `Unknown outlet "...".`
        - `Message template has unresolved placeholders.`

### Testing Checklist

- [x] Unit: rendering replaces `{{outletName}}` and `{{outletMapLink}}` correctly.
- [ ] Unit: validator rejects unknown outlet and unresolved placeholders.
- [ ] Integration: send starts successfully with valid outlet and template.
- [ ] Integration: send blocked when outlet missing.
- [ ] Integration: send blocked when template contains unresolved placeholders.
- [ ] Manual QA: switch between Bangsar/KLGCC/SS2 and verify preview links change.

### Rollout and Risk Control

- Rollout step 1: deploy backend with backward-compatible rendering + validation disabled in warning mode.
- Rollout step 2: enable strict blocking after team template update.
- Rollout step 3: train users to use outlet placeholders, not hardcoded outlet text.

### Definition of Done

- Sending cannot start without valid outlet selection.
- Preview always displays the selected outlet and correct map link.
- Backend blocks unresolved placeholders as final safety net.
- Team can safely use one template without manual outlet/map edits.

### Suggested Execution Order (Fastest Path)

1. Phase 1 tasks (rendering + placeholders)
2. Phase 2 tasks (preflight block)
3. Phase 3 tasks (selector + disable send)
4. Testing checklist
5. Optional Phase 4 polish