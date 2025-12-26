from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import asyncio
import os
import logging
from contextlib import asynccontextmanager

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global agent
agent = None
agent_ready = False
agent_error = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager for startup/shutdown"""
    global agent, agent_ready, agent_error
    
    logger.info("=" * 60)
    logger.info("🚀 CyberSec Assistant API Starting...")
    logger.info("=" * 60)
    
    try:
        from agent import ReAct_Agent
        agent = ReAct_Agent()
        
        logger.info("⏳ Initializing agent (may take 3-7 minutes)...")
        logger.info("   - Starting MCP servers via npx...")
        logger.info("   - Connecting security tools...")
        
        await asyncio.wait_for(agent.setup(), timeout=600)
        
        agent_ready = True
        logger.info("=" * 60)
        logger.info("✅ Agent initialized successfully!")
        logger.info("=" * 60)
        
    except asyncio.TimeoutError:
        agent_error = "Agent setup timeout after 10 minutes"
        logger.error(f"❌ {agent_error}")
        agent_ready = False
        
    except Exception as e:
        agent_error = str(e)
        logger.error(f"❌ Agent setup failed: {e}", exc_info=True)
        agent_ready = False
    
    yield
    
    logger.info("🔄 Shutting down...")
    if agent:
        try:
            await agent.cleanup()
            logger.info("✅ Cleanup completed")
        except Exception as e:
            logger.error(f"❌ Cleanup error: {e}")

app = FastAPI(
    title="CyberSec Assistant API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_states = {}

# Pydantic models
class ChatRequest(BaseModel):
    query: str
    chat_id: str
    tools: List[str] = []

class ChatResponse(BaseModel):
    success: bool
    response: str
    tool_call: Optional[Dict[str, Any]] = None
    tool_validation: Optional[str] = None
    tool_output: Optional[str] = None
    error: Optional[str] = None
    agent_ready: bool = True

class ToolLaunchRequest(BaseModel):
    tools: List[str]
    chat_id: str

@app.get("/")
async def root():
    return {
        "service": "CyberSec Assistant API",
        "version": "1.0.0",
        "status": "ready" if agent_ready else "initializing",
        "agent_ready": agent_ready,
        "error": agent_error,
        "endpoints": {
            "health": "/health",
            "status": "/api/status",
            "chat": "/api/chat",
            "tools": "/api/tools",
            "launch_tools": "/api/launch-tools"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if agent_ready else "initializing",
        "agent_ready": agent_ready
    }

@app.get("/api/status")
async def get_status():
    return {
        "ready": agent_ready,
        "error": agent_error,
        "active_conversations": len(conversation_states)
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    global agent, agent_ready
    
    try:
        if not agent_ready or agent is None:
            logger.warning("Chat request rejected - Agent not ready")
            return ChatResponse(
                success=False,
                response="🔄 Agent is still initializing. Please wait 3-7 minutes and try again.",
                error=agent_error or "Agent not ready",
                agent_ready=False
            )
        
        logger.info(f"📨 Processing chat - Chat ID: {request.chat_id}")
        logger.info(f"   Query: {request.query[:100]}...")
        
        if request.chat_id not in conversation_states:
            conversation_states[request.chat_id] = {"messages": [], "logs": []}
        
        state = conversation_states[request.chat_id]
        
        logger.info("⏳ Processing query...")
        try:
            result = await asyncio.wait_for(
                agent.process_query(request.query, state),
                timeout=900
            )
            logger.info("✅ Query processed")
            
        except asyncio.TimeoutError:
            logger.error("❌ Query timeout after 15 minutes")
            return ChatResponse(
                success=False,
                response="⏰ Query processing timeout. The tool might be taking too long.",
                error="Timeout after 15 minutes",
                agent_ready=True
            )
        
        conversation_states[request.chat_id] = result.get("state", state)
        
        tool_call = None
        tool_validation = None
        tool_output = None
        
        if result.get("tool_called"):
            tool_call = {
                "name": result["tool_called"],
                "args": result.get("tool_args", {}),
                "id": result.get("state", {}).get("tool_call_id", "")
            }
            tool_validation = "Valid Arguments"
            
            logger.info(f"🔧 Tool called: {tool_call['name']}")
            
            if result.get("tool_result"):
                tool_result = result["tool_result"]
                if hasattr(tool_result, 'content') and len(tool_result.content) > 0:
                    tool_output = tool_result.content[0].text
                else:
                    tool_output = str(tool_result)
        
        return ChatResponse(
            success=True,
            response=result.get("response", "No response generated"),
            tool_call=tool_call,
            tool_validation=tool_validation,
            tool_output=tool_output,
            agent_ready=True
        )
        
    except Exception as e:
        logger.error(f"❌ Error in chat endpoint: {e}", exc_info=True)
        return ChatResponse(
            success=False,
            response=f"An error occurred: {str(e)}",
            error=str(e),
            agent_ready=agent_ready
        )

@app.post("/api/launch-tools")
async def launch_tools(request: ToolLaunchRequest):
    try:
        if not agent_ready:
            raise HTTPException(
                status_code=503,
                detail="Agent not ready yet. Please wait."
            )
        
        logger.info(f"🚀 Launching tools: {request.tools}")
        
        if request.chat_id not in conversation_states:
            conversation_states[request.chat_id] = {"messages": [], "logs": []}
        
        return {
            "success": True,
            "message": f"Launched {len(request.tools)} tools successfully",
            "tools": request.tools
        }
        
    except Exception as e:
        logger.error(f"Error launching tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tools")
async def get_available_tools():
    try:
        if not agent_ready or agent is None:
            return {
                "success": False,
                "tools": [],
                "message": "Agent still initializing",
                "error": agent_error
            }
        
        # Access from agent instance
        tools = []
        for tool_name, schema in agent.GLOBAL_SCHEMA.items():
            tools.append({
                "id": tool_name,
                "name": tool_name.replace("-", " ").title(),
                "description": schema.get("description", f"MCP tool: {tool_name}"),
                "schema": schema
            })
        
        logger.info(f"📋 Returning {len(tools)} available tools")
        
        return {
            "success": True,
            "tools": tools,
            "count": len(tools)
        }
        
    except Exception as e:
        logger.error(f"Error getting tools: {e}")
        return {
            "success": False,
            "tools": [],
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.environ.get("PORT", 8000))
    
    logger.info("=" * 60)
    logger.info(f"🌐 Starting server on port {port}")
    logger.info("=" * 60)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        timeout_keep_alive=900,
        timeout_graceful_shutdown=30
    )
