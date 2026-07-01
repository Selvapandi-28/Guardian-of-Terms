# ToS Red-Flag Finder - Chrome Extension 

A Chrome browser extension built on Manifest V3 that allows users to instantly scan any webpage's Terms of Service or Privacy Policy for sneaky clauses, location tracking, and legal waivers with a single click.

##  Key Features
- **One-Click Page Scanner**: Automatically extracts the text body of the active browser tab using standard scripting and audits it instantly.
- **Manual Paste Fallback**: Interactive textarea where users can paste legal text manually for private scanning.
- **Four Risk Categories**: Classifies clauses into:
  - **Data Sharing & Sale**: Commercial data transfers to partners, advertisers, and brokers.
  - **Surveillance & Tracking**: Invasive sensors, device IDs, cookies, biometrics, and background location tracking.
  - **Account Rights & Waivers**: Arbitration clauses, class-action waivers, and platform content ownership licensing.
  - **Retention & Deletion**: Clauses restricting account deletion or enabling indefinite data logging.
- **Vibrant Safety Grading**: Highlights an overall safety rating (Grade A to F) using custom colors.
- **Glassmorphic Interactive Accordion**: Expanding folders showing highlighted clauses and individual keyword tags.
- **Report Downloader**: Compiles the scan audit into a text file report.

---

##  Tech Stack & Structure
- **Extension API**: Google Chrome Extension APIs (Manifest V3)
- **Permissions**:
  - `activeTab`: Grants access to the active webpage when requested.
  - `scripting`: Runs script to extract text content safely from the current page.
- **Frontend Architecture**: Pure HTML5, CSS3 (Glassmorphic cards, transition animations), and Vanilla Javascript (lightweight, zero external libraries, fast, and offline-capable).
- **Assets Compilation**: Generated programmatically using Python's Pillow library.

---

##  Loading the Extension into Google Chrome

To run this extension locally on your browser:

1. **Open Google Chrome** and navigate to `chrome://extensions/`.
2. Enable **Developer mode** by toggling the switch in the top-right corner of the page.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the project directory:
   ```
   C:\Users\IT\.gemini\antigravity\scratch\tos-redflag-finder-extension
   ```
5. The **ToS Red-Flag Finder** will now appear in your extensions list! Pin it to your toolbar for easy access.

---

##  How to Test
1. **Auto-Scan on Webpages**: Navigate to any Terms of Service document (e.g., [https://zoom.us/terms](https://zoom.us/terms)). Click the extension icon and select **Scan Active Tab**.
2. **Manual Paste**: Open the extension popup, switch to the **Paste Text** tab, copy-paste any agreement, and click **Analyze Text**.
3. **Save Report**: Click **Save Audit Report** to download the clean text report of the scan results.

---

##  Recruiter Talking Points
> "I designed this Chrome extension using Manifest V3 to give users an immediate visual audit of webpage terms. By leveraging the Chrome Scripting API, the extension extracts text on the fly, cleans it, and executes a custom JavaScript pattern-matching engine that categorizes risk levels. Since it relies entirely on native HTML/CSS/JS without heavy frameworks, it remains highly responsive, offline-ready, and lightweight—respecting the user's browser performance while protecting their digital privacy."
