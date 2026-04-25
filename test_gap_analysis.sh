#!/bin/bash

# Test script for gap analysis endpoint
# Run this after starting the backend with: ./start.sh

set -e

echo "🧪 Testing Gap Analysis Endpoint"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test data
JD='Senior Software Engineer - Backend
Google | Mountain View, CA

REQUIREMENTS
- 5+ years of software engineering experience
- Strong proficiency in Go, Python, or Java
- Experience with distributed systems and microservices
- Deep understanding of system design and scalability
- Experience with cloud platforms (GCP, AWS, or Azure)
- Strong communication and leadership skills

PREFERRED
- Experience with Kubernetes and container orchestration
- Knowledge of database optimization (SQL and NoSQL)
- Contributions to open-source projects'

RESUME='John Doe
Software Engineer | 3 years experience

EXPERIENCE
Senior Software Engineer @ TechCorp (2022-Present)
- Led development of microservices architecture serving 1M+ users
- Reduced API latency by 40% through caching optimization
- Mentored 3 junior engineers on best practices

Software Engineer @ StartupXYZ (2020-2022)
- Built real-time chat feature using WebSockets and Redis
- Implemented CI/CD pipeline reducing deployment time by 60%

SKILLS
Languages: Python, JavaScript, TypeScript, Go
Frameworks: React, Node.js, FastAPI, Django
Tools: Docker, Kubernetes, AWS, PostgreSQL, Redis'

echo "📝 Test 1: Analyze Readiness (Mock Mode)"
echo "----------------------------------------"

RESPONSE=$(curl -s -X POST http://localhost:8000/api/readiness/analyze \
  -H "Content-Type: application/json" \
  -d "{
    \"job_description\": \"$JD\",
    \"resume\": \"$RESUME\",
    \"company\": \"Google\",
    \"role_type\": \"Senior SDE\"
  }")

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Request successful${NC}"
  
  # Extract session_id
  SESSION_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])" 2>/dev/null)
  
  if [ -n "$SESSION_ID" ]; then
    echo -e "${GREEN}✅ Session created: $SESSION_ID${NC}"
    
    # Extract readiness score
    SCORE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['readiness_score'])" 2>/dev/null)
    echo -e "${GREEN}✅ Readiness score: $SCORE%${NC}"
    
    # Count gaps
    STRONG=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['strong_matches']))" 2>/dev/null)
    PARTIAL=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['partial_matches']))" 2>/dev/null)
    MISSING=$(echo "$RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['missing_or_weak']))" 2>/dev/null)
    
    echo -e "${GREEN}✅ Strong matches: $STRONG${NC}"
    echo -e "${YELLOW}⚠️  Partial matches: $PARTIAL${NC}"
    echo -e "${RED}❌ Missing/weak: $MISSING${NC}"
    
    echo ""
    echo "📝 Test 2: Get Gaps for Session"
    echo "--------------------------------"
    
    GAPS_RESPONSE=$(curl -s http://localhost:8000/api/readiness/$SESSION_ID/gaps)
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Gaps retrieved successfully${NC}"
      echo "$GAPS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GAPS_RESPONSE"
    else
      echo -e "${RED}❌ Failed to retrieve gaps${NC}"
    fi
    
    echo ""
    echo "📝 Test 3: Verify Database"
    echo "--------------------------"
    echo "Session ID: $SESSION_ID"
    echo "Check database with:"
    echo "  sqlite3 data/interview_coach.db \"SELECT * FROM sessions WHERE id='$SESSION_ID';\""
    echo "  sqlite3 data/interview_coach.db \"SELECT label, category, status FROM gaps WHERE session_id='$SESSION_ID';\""
    
  else
    echo -e "${RED}❌ Failed to extract session_id${NC}"
    echo "Response: $RESPONSE"
  fi
else
  echo -e "${RED}❌ Request failed${NC}"
  echo "Make sure the backend is running: ./start.sh"
fi

echo ""
echo "🎉 Testing complete!"
echo ""
echo "Next steps:"
echo "1. Check the response JSON above"
echo "2. Verify the database entries"
echo "3. Test the frontend integration"
