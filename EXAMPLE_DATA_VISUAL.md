# Example Data Feature — Visual Guide

## UI Location

```
┌─────────────────────────────────────────────────────────────┐
│  RoleReady AI — Practice Setup                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session Type: [Behavioral] [Technical] [Coding] ...        │
│                                                              │
│  Focus Area: [distributed systems and scalability____]      │
│                                                              │
│  Company: [Google____]  Role: [Senior SDE____]              │
│                                                              │
│  Mode: [Learning] [Professional ✓]                          │
│                                                              │
│  Difficulty: [Easy] [Medium ✓] [Hard]                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ CONTEXT (OPTIONAL)    [📝 Load Example] [🗑 Clear All] │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Resume:                                                 │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ John Doe                                           │ │ │
│  │ │ Software Engineer | 3 years experience            │ │ │
│  │ │                                                    │ │ │
│  │ │ EXPERIENCE                                         │ │ │
│  │ │ Senior Software Engineer @ TechCorp (2022-Present)│ │ │
│  │ │ - Led development of microservices...             │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  │                                                         │ │
│  │ Job Description:                                        │ │
│  │ ┌────────────────────────────────────────────────────┐ │ │
│  │ │ Senior Software Engineer - Backend                │ │ │
│  │ │ Google | Mountain View, CA                        │ │ │
│  │ │                                                    │ │ │
│  │ │ RESPONSIBILITIES                                   │ │ │
│  │ │ - Design scalable distributed systems...          │ │ │
│  │ └────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Start Behavioral Practice →]                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Button Actions

### 📝 Load Example Button
```
Click → Auto-fills all fields in 1 second
```

**Before:**
```
Resume: [empty]
Job Description: [empty]
Company: [empty]
Role: "SDE1"
Focus Area: "tell me about yourself"
```

**After:**
```
Resume: "John Doe\nSoftware Engineer | 3 years experience\n..."
Job Description: "Senior Software Engineer - Backend\nGoogle..."
Company: "Google"
Role: "Senior SDE"
Focus Area: "distributed systems and scalability"
```

### 🗑 Clear All Button
```
Click → Resets all fields to defaults
```

**Before:**
```
Resume: "John Doe\nSoftware Engineer..."
Job Description: "Senior Software Engineer..."
Company: "Google"
Role: "Senior SDE"
Focus Area: "distributed systems and scalability"
```

**After:**
```
Resume: [empty]
Job Description: [empty]
Company: [empty]
Role: "SDE1"
Focus Area: "tell me about yourself"
```

## User Flow

### Traditional Flow (Without Example Data)
```
1. Open /practice/setup
2. Type/paste resume (500+ words) ⏱ 60 seconds
3. Type/paste job description (300+ words) ⏱ 45 seconds
4. Fill company field ⏱ 5 seconds
5. Fill role field ⏱ 5 seconds
6. Fill focus area ⏱ 10 seconds
7. Click Start
───────────────────────────────────────────────
Total Time: ~2 minutes
```

### New Flow (With Example Data)
```
1. Open /practice/setup
2. Click "📝 Load Example" ⏱ 1 second
3. Click Start
───────────────────────────────────────────────
Total Time: ~5 seconds
```

**Time Saved:** 115 seconds (95% faster)

## Example Data Preview

### Resume (John Doe)
```
┌─────────────────────────────────────────┐
│ John Doe                                │
│ Software Engineer | 3 years experience │
│                                         │
│ EXPERIENCE                              │
│ • TechCorp (2022-Present)              │
│   - Microservices (1M+ users)          │
│   - API optimization (40% faster)      │
│   - Mentored 3 engineers               │
│                                         │
│ • StartupXYZ (2020-2022)               │
│   - Real-time chat (WebSockets)        │
│   - CI/CD pipeline (60% faster)        │
│                                         │
│ SKILLS                                  │
│ Python, JavaScript, TypeScript, Go     │
│ React, Node.js, FastAPI, Django        │
│ Docker, Kubernetes, AWS, PostgreSQL    │
└─────────────────────────────────────────┘
```

### Job Description (Google)
```
┌─────────────────────────────────────────┐
│ Senior Software Engineer - Backend      │
│ Google | Mountain View, CA              │
│                                         │
│ REQUIREMENTS                            │
│ • 5+ years experience ⚠️ GAP (has 3)   │
│ • Distributed systems ⚠️ GAP (limited) │
│ • Go/Python/Java ✓ MATCH (Python)      │
│ • Cloud platforms ⚠️ GAP (no GCP/AWS)  │
│ • Kubernetes ⚠️ GAP (not mentioned)    │
│                                         │
│ RESPONSIBILITIES                        │
│ • Design distributed systems            │
│ • Optimize APIs (10M+ req/day)         │
│ • Mentor engineers ✓ MATCH              │
│ • On-call rotation                      │
└─────────────────────────────────────────┘
```

## Gap Analysis Preview

```
┌──────────────────────────────────────────────────────┐
│ READINESS SCORE: 65/100 (AMBER)                     │
├──────────────────────────────────────────────────────┤
│ STRONG MATCHES (3)                                   │
│ ✓ Microservices architecture                         │
│ ✓ API optimization                                   │
│ ✓ Mentorship experience                              │
├──────────────────────────────────────────────────────┤
│ PARTIAL MATCHES (2)                                  │
│ ⚠ Experience level (3 years vs 5+ required)         │
│ ⚠ Programming languages (Python strong, Go partial) │
├──────────────────────────────────────────────────────┤
│ MISSING/WEAK (3)                                     │
│ ✗ Kubernetes and container orchestration            │
│ ✗ Distributed systems depth                         │
│ ✗ Cloud platform expertise (GCP/AWS/Azure)          │
└──────────────────────────────────────────────────────┘
```

## Interview Questions Preview

Based on the gaps, the AI will ask:

```
1. "Tell me about your experience with distributed systems."
   → Probes: distributed systems depth gap

2. "How have you used Kubernetes in production?"
   → Probes: Kubernetes gap

3. "Describe a time you optimized a system for 10M+ requests/day."
   → Probes: scale gap (1M vs 10M)

4. "What cloud platforms have you worked with?"
   → Probes: cloud platform gap
```

## Demo Script

**For judges/stakeholders:**

```
┌─────────────────────────────────────────────────────┐
│ DEMO SCRIPT (30 seconds)                            │
├─────────────────────────────────────────────────────┤
│ 1. "Let me show you how quick RoleReady AI is"     │
│ 2. Navigate to /practice/setup                      │
│ 3. "Instead of typing, I'll click Load Example"    │
│ 4. Click [📝 Load Example]                          │
│ 5. "Now we have a realistic scenario instantly"    │
│ 6. "3-year engineer applying to Google Senior SDE" │
│ 7. "Notice the gaps: needs 5+ years, has 3"        │
│ 8. Click [Start Behavioral Practice →]             │
│ 9. Continue with interview demo...                  │
└─────────────────────────────────────────────────────┘
```

## Technical Implementation

```typescript
// Example data constant
const EXAMPLE_DATA = {
  resume: "John Doe\nSoftware Engineer...",
  jobDescription: "Senior Software Engineer..."
};

// Load function
const loadExampleData = () => {
  setResume(EXAMPLE_DATA.resume);
  setJobDescription(EXAMPLE_DATA.jobDescription);
  setCompany("Google");
  setRoleType("Senior SDE");
  setFocusArea("distributed systems and scalability");
};

// Clear function
const clearAllFields = () => {
  setResume("");
  setJobDescription("");
  setCompany("");
  setRoleType("SDE1");
  setFocusArea(selectedType.defaultFocus);
};
```

## Benefits Summary

```
┌────────────────────────────────────────────────┐
│ BENEFITS                                       │
├────────────────────────────────────────────────┤
│ ✓ 95% faster setup (2 min → 5 sec)           │
│ ✓ No typing errors                            │
│ ✓ Consistent test data                        │
│ ✓ Professional demo appearance                │
│ ✓ Realistic gap scenario                      │
│ ✓ Easy to modify in one place                 │
│ ✓ Perfect for hackathon judging               │
└────────────────────────────────────────────────┘
```

---

**Status:** ✅ Complete and tested  
**Build:** ✅ No errors  
**Ready for:** Demo, testing, development, judging
