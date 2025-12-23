# backend/server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import asyncio
from agent import ReAct_Agent

app = FastAPI(title="CyberSec Assistant API")
agent=ReAct_Agent()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation_states = {}

class ChatRequest(BaseModel):
    query: str
    chat_id: str
    tools: list

class ChatResponse(BaseModel):
    success: bool
    response: str
    tool_call: Optional[Dict[str, Any]] = None
    tool_validation: Optional[str] = None
    tool_output: Optional[str] = None
    error: Optional[str] = None

class ToolLaunchRequest(BaseModel):
    tools: list
    chat_id: str

@app.on_event("startup")
async def startup_event():
    try:
        await agent.setup()
        print("✅ Agent setup successful!")
    except Exception as e:
        print(f"❌ Setup failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await agent.cleanup()
    

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "CyberSec Assistant API is active!",
        "endpoints": {
            "chat": "/api/chat",
            "launch_tools": "/api/launch-tools"
        }
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if request.chat_id not in conversation_states:
            conversation_states[request.chat_id] = {"messages": []}
        state = conversation_states[request.chat_id]
        result = await agent.process_query(request.query, state)
        conversation_states[request.chat_id] = result["state"]
        tool_call = None
        tool_validation = None
        tool_output = None
        if result.get("tool_called"):
            tool_call = {
                "name": result["tool_called"],
                "args": result["tool_args"],
                "id": result["state"].get("tool_call_id", "")
            }
            tool_validation = "Valid Arguments"
            if result.get("tool_result"):
                tool_result = result["tool_result"]
                if hasattr(tool_result, 'content') and len(tool_result.content) > 0:
                    tool_output = tool_result.content[0].text
                else:
                    tool_output = str(tool_result)
        return ChatResponse(
            success=True,
            response=result["response"],
            tool_call=tool_call,
            tool_validation=tool_validation,
            tool_output=tool_output
        )
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/launch-tools")
async def launch_tools(request: ToolLaunchRequest):
    try:
        if request.chat_id not in conversation_states:
            conversation_states[request.chat_id] = {"messages": []}
        return {
            "success": True,
            "message": f"Launched {len(request.tools)} tools successfully",
            "tools": request.tools
        }
    except Exception as e:
        print(f"Error launching tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tools")
async def get_available_tools():
    try:
        from agent import GLOBAL_SCHEMA
        tools = []
        for tool_name, schema in GLOBAL_SCHEMA.items():
            tools.append({
                "id": tool_name,
                "name": tool_name.replace("-", " ").title(),
                "description": f"MCP tool: {tool_name}",
                "schema": schema
            })
        return {
            "success": True,
            "tools": tools
        }
    except Exception as e:
        print(f"Error getting tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)