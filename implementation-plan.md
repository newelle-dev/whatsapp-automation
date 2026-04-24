### Implementation Plan: New Workflow Redesign

This plan outlines the steps to implement the redesigned workflow in the project, incorporating the user's feedback for decoupled client list upload, default preview, and streamlined sending.

### Phase 1: Backend Modifications

1.  **Create Endpoint for Client List Upload (`/api/upload-clients`)**
    *   **Objective:** Develop a dedicated API endpoint to receive and process the "Customer List" CSV.
    *   **Details:**
        *   Implement file upload handling (using `multer`, if already present, or similar).
        *   Parse the CSV file to extract client information.
        *   Store the processed client data in a persistent storage mechanism. For this plan, we will assume a simple JSON file storage (`data/clients.json`).
        *   Implement basic validation and deduplication logic for client entries.
        *   Provide appropriate API responses (success/failure, validation errors).
    *   **Files Affected:** `server.js`, potentially new file `services/clientDataStore.js`, new directory `data/clients.json`.

2.  **Modify Appointments Upload Endpoint (`/api/upload`)**
    *   **Objective:** Update the existing endpoint to exclusively handle "Appointments" CSVs and integrate with the stored client data.
    *   **Details:**
        *   Ensure the endpoint expects and processes only the "Appointments" CSV.
        *   Load the client data from the persistent storage (`data/clients.json`) before processing appointments.
        *   Use the loaded client data to link appointments to clients and generate personalized messages.
        *   Refine error handling for cases where client data is missing or incomplete.
    *   **Files Affected:** `server.js`, `services/csvProcessor.js`.

### Phase 2: Frontend Modifications

1.  **Create Dedicated Client List Upload UI**
    *   **Objective:** Develop a new user interface element for uploading and managing the "Customer List."
    *   **Details:**
        *   Design a dedicated section or modal (e.g., within a "Settings" page or a new "Clients" tab) for client list upload.
        *   Provide clear labels and instructions for uploading the "Customer List" CSV, emphasizing its infrequent update nature (e.g., "Upload Client List (Update weekly or as needed)").
        *   Implement client-side logic to handle file selection and upload to the new `/api/upload-clients` endpoint.
        *   Display feedback to the user on the success or failure of the client list upload.
    *   **Files Affected:** `frontend/src/App.jsx` (for routing/modal integration), new component file (e.g., `frontend/src/components/ClientUpload.jsx`), `frontend/src/index.css` (for styling).

2.  **Update Appointments Upload UI**
    *   **Objective:** Refine the main upload interface to clearly indicate it is for "Appointments" only.
    *   **Details:**
        *   Modify existing labels and instructions in the main upload area to refer specifically to "Appointments CSV."
        *   Potentially simplify the drag-and-drop zone if it no longer needs to handle two distinct file types simultaneously.
    *   **Files Affected:** `frontend/src/App.jsx` (or relevant upload component).

3.  **Remove Mode Selection UI**
    *   **Objective:** Eliminate the UI elements that allow the user to choose between "Preview Scripts" and "Auto-Send."
    *   **Details:**
        *   Remove any radio buttons, dropdowns, or navigation related to mode selection.
        *   The application should now automatically transition to the preview state after processing appointments.
    *   **Files Affected:** `frontend/src/App.jsx` (or relevant mode selection component).

4.  **Implement Default Preview Display**
    *   **Objective:** After processing "Appointments" data, automatically display the generated messages for review.
    *   **Details:**
        *   Ensure the "Preview Scripts" view is the default next step after a successful "Appointments" CSV upload and processing.
        *   This view should clearly present the messages generated for each client.
    *   **Files Affected:** `frontend/src/App.jsx` (or relevant preview component).

5.  **Add "Start Sending" Button**
    *   **Objective:** Provide a clear call-to-action button to initiate the automated sending process.
    *   **Details:**
        *   Add a prominent "Start Sending via WhatsApp" or "Broadcast Messages" button to the "Preview Scripts" view.
        *   This button will trigger the sequence of WhatsApp authentication and message broadcasting.
    *   **Files Affected:** `frontend/src/App.jsx` (or relevant preview component).

6.  **Integrate WhatsApp Authentication with "Start Sending"**
    *   **Objective:** Ensure WhatsApp authentication occurs as part of, or just before, the automatic sending process.
    *   **Details:**
        *   When the "Start Sending" button is clicked, check the WhatsApp client status.
        *   If not authenticated, display the QR code for the user to scan.
        *   Only proceed with message broadcasting once the WhatsApp client is ready (authenticated).
    *   **Files Affected:** `frontend/src/App.jsx`, `frontend/src/services/whatsappService.js` (if exists, or new file).

7.  **Enhance Broadcast UI**
    *   **Objective:** Improve user feedback and visibility during the message broadcasting phase.
    *   **Details:**
        *   Implement real-time progress indicators (e.g., "X of Y messages sent").
        *   Display a clear message or banner reminding the user to "Keep the app running until finished."
        *   Show detailed logs or status updates for each message sent.
    *   **Files Affected:** `frontend/src/App.jsx` (or relevant broadcast component).

### Phase 3: Data Persistence (for Client List)

1.  **Choose and Implement Client Data Storage**
    *   **Objective:** Establish a robust method for storing and retrieving client data on the backend.
    *   **Details:**
        *   Initial proposal: Use a JSON file (`data/clients.json`) to store the client list.
        *   Implement functions to read from and write to this JSON file.
        *   Ensure data is loaded into memory on backend startup for quick access during appointment processing.
    *   **Files Affected:** New directory `data/`, `data/clients.json`, `server.js`, `services/clientDataStore.js` (new file).

### High-Level Task Breakdown & Tool Usage

*   **Backend Changes:**
    *   Create new API endpoint and logic for client list (`server.js`, `clientDataStore.js`, `data/clients.json`).
    *   Modify existing API endpoint for appointments (`server.js`, `csvProcessor.js`).
    *   **Tools:** `write_file`, `replace`

*   **Frontend Changes:**
    *   Create UI for client list upload (`App.jsx`, `ClientUpload.jsx`, `index.css`).
    *   Update main upload UI (`App.jsx`).
    *   Remove mode selection UI (`App.jsx`).
    *   Implement default preview and "Start Sending" button (`App.jsx`, preview component).
    *   Integrate WhatsApp auth with sending (`App.jsx`, `whatsappService.js`).
    *   Enhance broadcast UI (`App.jsx`, broadcast component).
    *   **Tools:** `write_file`, `replace`

*   **Verification:**
    *   Manual testing of the entire workflow.
    *   **Tools:** `run_shell_command` (`npm run start-all`)

I will now save this implementation plan to `implementation-plan.md`.