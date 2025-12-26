from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import asyncio
import os
import logging
import gc

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy loading - Don't initialize agent at startup
agent = None
agent_ready = False

app = FastAPI(title="CyberSec Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_states = {}

class ChatRequest(BaseModel):
    query: str
    chat_id: str
    tools: List[str] = []

class ChatResponse(BaseModel):
    success: bool
    response: str
    tool_call: Optional[Dict[str, Any]] = None
    agent_ready: bool = True

async def get_agent():
    """Lazy load agent only when needed"""
    global agent, agent_ready
    
    if agent is None:
        logger.info("🔧 Initializing agent on demand...")
        try:
            from agent import ReAct_Agent
            agent = ReAct_Agent()
            await asyncio.wait_for(agent.setup(), timeout=300)
            agent_ready = True
            gc.collect()
            logger.info("✅ Agent ready")
        except Exception as e:
            logger.error(f"❌ Agent init failed: {e}")
            agent_ready = False
            raise
    
    return agent

@app.get("/")
async def root():
    return {
        "service": "CyberSec Assistant API",
        "status": "ready",
        "agent_ready": agent_ready,
        "message": "Agent loads on first request (lazy loading)"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "agent_ready": agent_ready}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize agent only when first chat comes
        current_agent = await get_agent()
        
        if request.chat_id not in conversation_states:
            conversation_states[request.chat_id] = {"messages": [], "logs": []}
        
        state = conversation_states[request.chat_id]
        result = await asyncio.wait_for(
            current_agent.process_query(request.query, state),
            timeout=120
        )
        
        conversation_states[request.chat_id] = result.get("state", state)
        
        return ChatResponse(
            success=True,
            response=result.get("response", "No response"),
            agent_ready=True
        )
        
    except asyncio.TimeoutError:
        return ChatResponse(
            success=False,
            response="Request timeout. Please try again.",
            agent_ready=agent_ready
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return ChatResponse(
            success=False,
            response=f"Error: {str(e)}",
            agent_ready=agent_ready
        )

@app.get("/api/tools")
async def get_tools():
    tools = [
        {"id": "do-nmap", "name": "Nmap", "description": "Network scanner"},
        {"id": "do-sqlmap", "name": "SQLMap", "description": "SQL injection"},
        {"id": "do-ffuf", "name": "FFUF", "description": "Web fuzzer"},
        {"id": "do-masscan", "name": "Masscan", "description": "Port scanner"},
        {"id": "do-sslscan", "name": "SSLScan", "description": "SSL/TLS scanner"}
    ]
    return {"success": True, "tools": tools, "count": len(tools)}

@app.post("/api/launch-tools")
async def launch_tools(request: dict):
    return {
        "success": True,
        "message": f"Configured {len(request.get('tools', []))} tools",
        "tools": request.get('tools', [])
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, timeout_keep_alive=300)
