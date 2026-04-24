# P1 Platform Services

**Owner:** Person 1

This directory contains all platform and infrastructure services.

## Services

### gateway/
Node.js + Fastify edge service
- JWT authentication
- Request routing
- WebSocket upgrade for audio streams
- Rate limiting

### research/
Python + FastAPI
- Tavily API integration
- Company profile generation
- 30-second budget enforcement
- Custom profile persistence

### persona/
Python + FastAPI
- Persona config loader
- Company profile loader
- Mode config loader
- Schema validation at startup

### reasoning/
Python + FastAPI
- LLM wrapper (Anthropic Claude + OpenAI GPT-4)
- Prompt template management
- Token usage logging
- Fallback logic

## Dependencies

- Node.js 20+
- Python 3.11+
- Fastify
- FastAPI
- Anthropic SDK
- OpenAI SDK
- Tavily SDK

## Getting Started

```bash
# Gateway
cd gateway
npm install
npm run dev

# Python services
cd research  # or persona, reasoning
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
