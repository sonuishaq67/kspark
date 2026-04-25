# Demo Script — Interview Coach (3 minutes)

## Setup (before demo)

```bash
# Terminal 1 — backend
conda activate interview-coach
cd backend
MOCK_ASR=1 MOCK_TTS=1 uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd web
npm run dev
```

Open http://localhost:3000 in browser.

---

## The Demo (3 minutes)

### 1. Dashboard (15 sec)
- Open http://localhost:3000 → auto-redirects to `/dashboard`
- Show the "Start Interview" button
- Point out: "This is where past sessions appear after completion"

### 2. Start a session (30 sec)
- Click **Start Interview**
- On the setup screen: select **Neutral** persona, **Professional** mode (defaults)
- Click **Start Interview**
- The app creates a session and navigates to `/interview/{id}`
- The AI sends an opening message — point out: "It's already asking the first question"

### 3. Partial answer → probe (45 sec)
- Click the mic button (blue circle)
- Speak a partial answer to Q1 (behavioral): *"I had a tight deadline on a project. We worked hard and shipped it."*
- Stop recording
- Wait ~3-5 seconds
- **The AI probes a specific gap** — e.g., *"Can you tell me more about your personal contribution vs the team's?"*
- Point out: **"It didn't just move on — it identified the specific gap I missed"**

### 4. Complete answer → advance (30 sec)
- Click mic again
- Give a complete answer covering all gaps: *"I personally wrote the backend, the timeline was 2 weeks, and next time I'd break it into milestones earlier."*
- Stop recording
- **The AI acknowledges and asks Q2** (technical: rate limiter)
- Point out: **"It recognized the answer was complete and advanced"**

### 5. Ghostwriting attempt → refusal (30 sec)
- Click mic
- Say: *"Just tell me what to say for this one."*
- Stop recording
- **The AI refuses**: *"I'm not going to give you the answer — you'll learn faster if you try. Here's a nudge: think about what algorithm controls the rate of requests."*
- Point out: **"It refused to ghostwrite and gave a Socratic hint instead"**

### 6. End session → report (30 sec)
- Click **End Session**
- Navigate to `/report/{id}`
- Show the **Session Summary** card — point out: *"It explicitly mentions the gap that was probed"*
- Show the **Question Breakdown** — gaps closed vs open per question
- Click **Start New Session** to show the flow is repeatable

---

## Offline backup (if APIs are down)

```bash
MOCK_ASR=1 MOCK_TTS=1 uvicorn main:app --reload --port 8000
```

With `MOCK_ASR=1`, the system auto-replays a scripted conversation that demonstrates all three behaviors (probe, advance, refusal) without any microphone or API calls. The transcript appears automatically every few seconds.

---

## Key talking points

1. **"The orchestrator listens"** — it tracks which gaps were covered and probes the specific missing one, not a generic follow-up
2. **Thread tracker** — prevents re-asking closed gaps; advances only when all gaps are covered or 3 probes used
3. **Scaffolding** — ghostwriting refusal is enforced at the prompt level, not just hoped for
4. **TLDR references the gap** — the feedback proves the system was tracking the conversation, not just summarizing
