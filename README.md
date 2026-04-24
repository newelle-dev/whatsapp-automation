# WhatsApp Automation Project

A powerful, local automation tool designed to send personalized appointment reminders via WhatsApp using data exported from **Fresha**.

## 🚀 How to Use the App

To use this application effectively, follow this step-by-step workflow:

### 1. Export Data from Fresha
*   Export your **Customer List** as a CSV file.
*   Export your **Appointments** for the relevant period as a CSV file.

### 2. Manage Customer List
*   **Initial Upload:** Upload your **Customer List** CSV via the dedicated "Customer List" section in the UI (e.g., in a settings modal). This data is typically static and only needs to be updated occasionally (e.g., weekly).
*   **Updates:** Re-uploading the Customer List will update existing client information.

### 3. Launch the System
*   Run `npm run start-all` in the root directory. This will start both the backend server and the frontend development server.
*   Access the UI (typically `http://localhost:5173`).

### 4. Upload & Process Appointments
*   Drag and drop your **Appointments** CSV file into the designated upload zone.
*   Click **Process Files**. The system will link appointments to your customer list and generate personalized scripts.

### 5. Preview & Send Messages
*   **Review Scripts:** After processing, the generated messages will be displayed for your review. This is the manual mode.
*   **Start Sending:** If you wish to send messages automatically, click the "Start Sending" button.

### 6. Authenticate & Broadcast (Automatic Sending)
*   **Scan QR Code**: Use your phone's WhatsApp (Settings > Linked Devices) to authenticate the app. This step is required only once or when your session expires.
*   **Review Queue**: Before sending, verify the "Ready to Send" list and check for any "Action Required" items.
*   **Start Broadcast**: Click the button to begin the automated broadcast. **Keep the app running** until finished.

---

## 🔄 User Flow Diagram

```mermaid
graph TD
    A[Fresha CSV Exports]
    subgraph Setup
        B[Manage Customer List (Weekly)]
        A -- "Customer List.csv" --> B
    end
    subgraph Daily Workflow
        C[Launch System (npm run start-all)]
        A -- "Appointments.csv" --> D[Upload & Process Appointments]
        C --> D
        D --> E[Preview Messages]
        E --> F{Ready to Send?}
        F -- Yes --> G[Authenticate WhatsApp]
        G --> H[Start Broadcast]
        H --> I[Live Progress & Logs]
        F -- No / Review --> E
    end
```

---

## 🧠 Smart Features & Safety

### 🧼 Data Cleaning
The system automatically merges multiple services for the same client into a single coherent message (e.g., "Root Touch Up + Cut" becomes "Hair appointment").

### 🛡️ Anti-Spam Protection
In **Auto-Send** mode, the system implements a **randomized delay (15–45 seconds)** between each message. This simulates human behavior and prevents WhatsApp from flagging or banning your account for automation.

### ⚠️ Manual Review Queue
Items requiring manual intervention (e.g., missing phone numbers, formatting errors) are isolated in a separate list so you never miss a client.

---

## 🛠️ Customization
*   **Message Template**: Edit `./message-template.txt` to change the wording of your reminders.
*   **Matching Logic**: Located in `./services/csvProcessor.js`.
*   **Formatting**: Phone number and date formatting can be found in `./utils/formatter.js`.
