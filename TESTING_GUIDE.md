# RoleReady AI - Testing Guide

## Quick Testing with Example Data

The frontend setup page (`/practice/setup`) now includes **example data buttons** for quick testing without manually entering resume and job description.

### How to Use

1. **Start the application**:
   ```bash
   ./start.sh
   ```

2. **Navigate to the setup page**:
   - Open browser to `http://localhost:3000`
   - Click "Start Practice" or navigate to `/practice/setup`

3. **Load example data**:
   - Look for the "Context (Optional)" section at the bottom
   - Click the **📝 Load Example** button
   - This will auto-fill:
     - **Resume**: 3-year experienced Software Engineer profile
     - **Job Description**: Google Senior SDE role (distributed systems focus)
     - **Company**: Google
     - **Role**: Senior SDE
     - **Focus Area**: "distributed systems and scalability"

4. **Clear data**:
   - Click the **🗑 Clear All** button to reset all fields

### Example Data Details

**Resume Profile**:
- Name: John Doe
- Experience: 3 years (TechCorp + StartupXYZ)
- Skills: Python, JavaScript, TypeScript, Go, React, Node.js, FastAPI
- Highlights: Microservices, API optimization, real-time chat, CI/CD

**Job Description**:
- Company: Google
- Role: Senior Software Engineer - Backend
- Team: Cloud Infrastructure
- Requirements: 5+ years, distributed systems, Go/Python/Java, cloud platforms
- Focus: Scalability, system design, mentorship

**Gap Scenario**:
This example creates a realistic gap scenario:
- **Strong matches**: Microservices, API optimization, mentorship
- **Partial matches**: Experience level (3 years vs 5+ required)
- **Missing/weak**: Kubernetes, distributed systems depth, cloud platform expertise

### Testing Different Scenarios

#### Scenario 1: Quick Demo (Default)
```
Session Type: Behavioral Practice
Mode: Learning
Difficulty: Medium
+ Load Example Data
```
**Expected**: 15-minute behavioral interview focused on distributed systems

#### Scenario 2: Technical Deep Dive
```
Session Type: Technical Concept Practice
Mode: Professional
Difficulty: Hard
+ Load Example Data
Focus Area: "Kubernetes and container orchestration"
```
**Expected**: 20-minute technical interview probing Kubernetes knowledge gaps

#### Scenario 3: Full Interview Loop
```
Session Type: Full Interview
Mode: Professional
Difficulty: Medium
+ Load Example Data
```
**Expected**: 60-minute complete interview covering behavioral + technical + coding

#### Scenario 4: Custom Focus
```
Session Type: Custom Question
Mode: Learning
Difficulty: Easy
+ Load Example Data
Focus Area: "Tell me about a time you optimized system performance"
```
**Expected**: 15-minute focused interview on performance optimization

### Mock Mode Testing

When `MOCK_LLM=1` is set in `.env`:
- All LLM calls return pre-defined mock responses
- No API keys required (Groq, OpenAI, etc.)
- Instant responses (no network latency)
- Perfect for demos and development

### API Testing

You can also test the backend API directly:

```bash
# Start session with example data
curl -X POST http://localhost:8001/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_type": "BEHAVIORAL_PRACTICE",
    "duration_minutes": 15,
    "mode": "learning",
    "focus_area": "distributed systems",
    "company": "Google",
    "role_type": "Senior SDE",
    "resume": "John Doe\nSoftware Engineer | 3 years experience...",
    "job_description": "Senior Software Engineer - Backend\nGoogle...",
    "difficulty": "medium"
  }'
```

### Troubleshooting

**Example button not working?**
- Check browser console for JavaScript errors
- Verify frontend is running on port 3000
- Try refreshing the page

**Data not loading?**
- Check that the example data constants are defined in `web/app/practice/setup/page.tsx`
- Verify no TypeScript compilation errors: `cd web && npm run build`

**Session not starting?**
- Verify backend is running on port 8001
- Check `.env` file has `MOCK_LLM=1` for demo mode
- Check backend logs for errors

### Next Steps

After loading example data and starting a session:
1. **Gap Map** - View skill gaps between resume and JD
2. **Prep Brief** - Get personalized preparation tips
3. **Interview** - Practice with adaptive AI interviewer
4. **Report** - Review performance and get improvement plan
5. **Dashboard** - Track progress across sessions

---

## Additional Testing Resources

- **Demo Script**: See `DEMO_SCRIPT.md` for full walkthrough
- **Run Guide**: See `RUN_GUIDE.md` for detailed setup instructions
- **Quick Start**: See `QUICK_START.md` for 5-minute setup
- **Architecture**: See `.kiro/steering/architecture.md` for technical details
