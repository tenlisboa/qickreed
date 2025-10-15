---
## Business Rules - Initial Assessment and Basic RSVP (Phase 1)

The success of Phase 1 lies in the accuracy of the initial measurement and the implementation of the RSVP mechanism in a way that forces a change in the reading pattern.
---

### I. Initial Assessment

The assessment should be a rigorous process to establish the user's baseline (WPM and Comprehension) and calculate the first Training Target.

#### A. Reading Process Rules and Timing:

1. Standard Content: The diagnostic text (Text.type = 'Diagnostic') should be of standardized complexity and length (e.g., 500 to 700 words) and be free of visual distractors. 2. **Strict Timing:** The time count begins when the "Start Reading" button is clicked and ends when the "Finish Reading" button is clicked.
2. **WPM (Words Per Minute) Calculation:**
   $$WPM = \frac{Text Word Count}{\text{Total Reading Time (in minutes)}}$$

- _Note:_ The backend must use the pre-calculated `Text.num_words` field and the time in milliseconds (`Diagnostic_Session.reading_time_ms`) to ensure accuracy and avoid calculations on the frontend.

4. **Regression Not Allowed (Implicitly):** The interface must not allow text to scroll up (regression) during reading; only scroll down (progress).

#### B. Comprehension Test Rules:

1. **Immediate Execution:** The comprehension test must be started immediately after the user clicks "Finish Reading".
2. **Quiz Structure:** The `Text.quiz_json` should contain multiple-choice questions (4 or 5 options), focusing on **main facts, central ideas, and direct inferences** from the text, to measure retention.
3. **Comprehension Calculation:**
   $$Comprehension\ Score = \frac{Number\ of\ Correct\ Answers}{Total\ Number\ of\ Questions}$$

- The result should be persisted as a percentage (`Diagnostic_Session.comprehension_score`).

#### C. Baseline Targeting Rules:

1. Persistence: After calculation, the WPM and Comprehension values ​​are saved in `Diagnostic_Session` and define the user's historical reference.
2. Calculation of the Next Training Target:
   The Initial Target WPM for RSVP training (RF005) should be set at a fixed percentage increase (e.g., +20%) above the Initial_WPM (e.g., if the baseline is 100 WPM, the initial target is 120 WPM).
   Rationale: Force neurocognitive stress, but at an achievable level to avoid frustration.

---

### II. Basic RSVP Module (Acceleration and Focus)

The RSVP (Rapid Serial Visual Presentation) module is the core of retraining, focusing on eliminating subvocalization and increasing visual recognition (graphemes).

#### A. Presentation Rules and Mechanics:

1. Central Fixed Point: Words should be displayed sequentially in the same focal point (RSVP window) to eliminate eye movement (saccades) and, consequently, regression. 2. Word Duration (Speed): The frontend must calculate the display time of each word in milliseconds based on the user-defined Target WPM:
   Time per Word (ms) = \frac{60,000}{Target WPM}$$
2. Speed ​​Control: The user must be able to adjust the Target WPM (via slider or input) before starting the training, respecting a minimum limit (e.g., 80 WPM) and a maximum limit (e.g., 800 WPM for MVP).
3. Controlled Pauses: The system must automatically pause the presentation when the user shifts focus from the application (switching tabs/apps) or manually pauses, and resume from the same point.

#### B. Data and Persistence Rules:

1. **Session Record:** The **Training Session** (`Training_Session`) must persist:

- The `target_wpm` configured by the user.
- The `text_id` used.
- The actual `duration_time_s` of the training (active time between the first and last word, excluding pauses).

2. **Absence of Comprehension Test:** In this basic phase, RSVP training does not require a subsequent comprehension test, as the focus is purely on accelerating reading and **re-educating mechanics**. Comprehension will be tested in the Diagnostic/Validation modules.
3. **Simple Feedback:** At the end of the session, the system should only provide feedback on the achieved WPM (the `target_wpm` that was maintained) and encouragement for the next training session.
