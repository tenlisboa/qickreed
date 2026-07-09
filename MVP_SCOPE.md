### Product Requirements Document (PRD)

**Product:** Neurocognitive Reading Training Pilot named QickRead
**Architecture:** Laravel Monolith + Inertia.js (React/Vue) + LLM integration via external API (Ollama with OpenAI standard)

---

### 1. Overview and Core Business Rule

The software aims to force the transition from phonetic reading (subvocalization) to visual reading (shape recognition). The central premise is physiological: subvocalization has a mechanical ceiling of 250 to 300 Words Per Minute (WPM). The system eliminates the "inner voice" by forcing reading speeds above 350 WPM using a digital tachistoscope, validating efficacy through a comprehension test requiring a score above 60%.

### 2. User Flow (UX) and Execution Rules

#### Phase 1: Onboarding and Leveling

* **Business Rule:** Every new user requires a baseline measurement before accessing the training engine.
* **UX Behavior:**
* Static text is displayed on the screen.
* An invisible timer starts upon page load.
* The user clicks "Finished Reading." The system records the time and calculates the initial WPM.
* **Self-assessment:** A single-choice modal asks about the reading method used ("Out loud," "With inner voice," "Visual only").
* **Output:** The system cross-references the WPM with the response, categorizes the user, and assigns them to Level 1.

#### Phase 2: Operations Dashboard

* **Business Rule:** Focus on quantitative progress and lowering the barrier to entry for text processing.
* **UX Behavior:**
* **Primary Metrics:** Line chart plotting PPM Evolution (Y1-axis) and Average Comprehension Rate (Y2-axis) against date (X-axis).
* **Training Input:** Text box for the user to paste the target material.
* **Processing Trigger:** Upon text submission, Laravel dispatches a job to the queue. The frontend displays a *loading* state. The LLM (via API) extracts the "Central Axis" and generates multiple-choice questions. Once complete, an event (WebSocket/Reverb) enables the "Start Training" button.

#### Phase 3: Training Engine (Digital Tachistoscope)

* **Business Rule:** Total immersion and prevention of physical regression.
* **UX Behavior:**
* Full-screen mode or focus area without menus, sidebars, or distracting elements.
* **Layout:** Dark background, bold sans-serif typography (high legibility), rendered in the absolute center of the screen.
* **String Alignment:** The center point of each word must anchor to the exact middle of the screen. The eye should not need to make lateral micro-adjustments for words of varying lengths.
* **Controls:** The `Space` key toggles Play/Pause. A minimalist progress bar at the top indicates "Word X / Y".
* **Regression Blocking:** `user-select: none` enabled on the container. The software intercepts `onMouseDown` and `onSelectStart` events. Any click or selection attempt is logged in memory as a motor regression failure. There is no visual feedback regarding this interception to avoid breaking concentration.

#### Phase 4: Cognitive Validation

* **Business Rule:** Speed ​​without comprehension is meaningless. The minimum acceptable retention rate is 60%.
* **UX Behavior:**
* Automatic transition after the final word displayed via the tachistoscope.
* Sequential presentation of 5 LLM-generated questions (What, Who, When, Where, Why) in multiple-choice format.
* **Success Condition (>= 60%):** The system validates the session. The PPM achieved becomes the new benchmark.
* **Failure Condition (< 60%):** The system invalidates the session's PPM. It displays technical feedback regarding cognitive overload and suggests/enforces a 10% reduction in PPM for the next attempt.

---

### 3. Out of Scope and Justifications

| Feature | Reason for MVP Exclusion |
| --- | --- |
| **Eye Tracking (Webcam/WebGazer)** | Excessive client-side processing cost. Requires hardware permissions, creating conversion friction during initial use. Effectiveness is marginal compared to mathematical inference (350+ PPM with retention confirms the end of subvocalization). |
| **Dynamic Mind Maps (React Flow)** | UI/UX complexity unnecessary for the pilot phase. Diverts focus from the core reading engine. |
| **Isolated Python Microservice** | The current Laravel ecosystem supports synchronous/asynchronous calls to LLM APIs. Maintaining a second server solely to route prompts increases infrastructure costs and deployment time. |
| **Audio-based Diagnosis** | Recording the user reading to detect audible subvocalization requires speech storage and processing infrastructure; this is easily replaced by self-reporting during initial onboarding. |

---

### 4. Technical Risks and Implementation Considerations

1. **Rendering Engine Precision (Frame Drops)**
* **Risk:** Relying on JavaScript's `setTimeout` or `setInterval` will cause visual desynchronization of words due to main thread blocking.
* **Mitigation:** The tachistoscope must be built strictly using `requestAnimationFrame`, syncing the display loop with the user's monitor refresh rate (typically 60Hz).


2. **LLM Integration Latency**
* **Risk:** Synchronous calls to generate comprehension questions will cause the Laravel backend to time out if the input text is long (over 2,000 words).
* **Mitigation:** Mandatory use of queues (Redis) and background job processing. The user must not be blocked by an HTTP request while waiting for the LLM provider to respond.


3. **Question Generation Inconsistency (Hallucination)**
* **Risk:** The LLM may generate questions with answers not explicitly found in the text, frustrating the user's cognitive validation process.
* **Mitigation:** Use strict extraction prompts (e.g., "Act as a context extractor. Formulate questions with answers contained EXCLUSIVELY in the provided text. Return in strict JSON format"). Set the model's temperature to 0 or 0.1.


4. **Cognitive Load and Eye Fatigue**
* **Risk:** Prolonged tachistoscope training causes strain on the eye's lens.
* **Mitigation:** The system must limit the word count per training session (e.g., maximum blocks of 500 words), enforcing mandatory interface breaks between long texts.
