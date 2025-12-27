import os
import operator
from typing import Annotated, Sequence, TypedDict, Any, Dict, Union, Literal

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, SystemMessage, AIMessage, ToolMessage, HumanMessage
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv

from utils import validate_arguments, configure_mcp

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    tool_called: str
    tool_args: Dict
    tool_call_id: str
    tool_result: Any
    logs: Annotated[list[str], operator.add]

class ReAct_Agent:
    def __init__(self):
        self.stack = None
        self.GLOBAL_SCHEMA = {}
        self.GLOBAL_NAME_TO_TOOL = {}
        self.tools = []
        self.llm = None
        self.graph = None

    async def setup(self, active_tools: list = None):
        """Initialize MCP stack and LLM with filtered tools"""
        # Support multiple environment variable names
        api_key = (
            os.getenv("OPEN_AI_API_KEY") or 
            os.getenv("OPENAI_API_KEY") or
            os.getenv("OPENROUTER_API_KEY")
        )
        
        api_base = (
            os.getenv("OPEN_AI_API_BASE") or
            os.getenv("OPENAI_API_BASE") or
            "https://api.openai.com/v1"
        )

        if not api_key:
            print("⚠️ Warning: No API key found. Using default configuration.")
            print("   Set OPEN_AI_API_KEY or OPENAI_API_KEY environment variable.")

        # Initialize MCP servers
        print("🔌 Initializing MCP servers...")
        self.tools, self.GLOBAL_SCHEMA, self.GLOBAL_NAME_TO_TOOL, self.stack = await configure_mcp()
        print(f"✅ Loaded {len(self.tools)} tools")

        # Filter tools if specified
        if active_tools is not None:
            self.filtered_tools = [t for t in self.tools if t.name in active_tools]
            print(f"🔍 Filtered to {len(self.filtered_tools)} active tools")
        else:
            self.filtered_tools = self.tools

        # Initialize LLM
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            api_key=api_key if api_key else "dummy-key",
            base_url=api_base,
        ).bind_tools(self.filtered_tools)
        
        print("🤖 LLM initialized")

        # Build graph
        self.graph = self._build_graph()
        print("📊 Graph built successfully")

    def should_continue(self, state: AgentState) -> Literal["tools", "end"]:
        last_message = state["messages"][-1]
        if isinstance(last_message, AIMessage) and last_message.tool_calls:
            return "tools"
        return "end"

    async def model_call(self, state: AgentState) -> Dict:
        sys_prompt = SystemMessage(
            content=(
                "You are a precise cybersecurity agent. Always check whether a query needs tool calling. "
                "When a tool is executed, ALWAYS summarize ONLY what the tool actually output. "
                "Do NOT add conclusions that were not explicitly shown."
            )
        )
        
        inputs = [sys_prompt] + list(state["messages"])
        response = await self.llm.ainvoke(inputs)

        log_msg = "🤖 Agent is thinking..."
        updates = {"messages": [response]}
        
        if response.tool_calls:
            tc = response.tool_calls[0]
            updates.update({
                "tool_called": tc["name"],
                "tool_args": tc["args"],
                "tool_call_id": tc["id"],
                "logs": [f"{log_msg} Decided to use tool: {tc['name']}"]
            })
        else:
            updates.update({
                "tool_called": "", 
                "tool_args": {}, 
                "tool_call_id": "",
                "logs": [f"{log_msg} Providing final answer."]
            })
        return updates

    async def tool_node(self, state: AgentState) -> Dict:
        tool_name = state["tool_called"]
        tool_args = state["tool_args"]
        
        exec_log = f"🛠️ Executing {tool_name} with arguments: {tool_args}"
        
        tool = self.GLOBAL_NAME_TO_TOOL[tool_name]
        
        validation = validate_arguments(tool_args, self.GLOBAL_SCHEMA[tool_name])
        
        if validation == "Valid":
            result_text = await tool.ainvoke(tool_args)
        else:
            result_text = f"Validation Error: {validation}"

        tool_message = ToolMessage(
            content=str(result_text),
            tool_call_id=state["tool_call_id"],
            name=tool_name
        )
        
        return {
            "messages": [tool_message],
            "tool_result": result_text,
            "tool_called": "",
            "tool_args": {},
            "tool_call_id": "",
            "logs": [exec_log, f"✅ Tool Output: {str(result_text)[:150]}..."]
        }

    def _build_graph(self):
        workflow = StateGraph(AgentState)
        workflow.add_node("reasoner", self.model_call)
        workflow.add_node("tools", self.tool_node)
        
        workflow.add_edge(START, "reasoner")
        workflow.add_conditional_edges(
            "reasoner",
            self.should_continue,
            {"tools": "tools", "end": END}
        )
        workflow.add_edge("tools", "reasoner")
        return workflow.compile()

   async def process_query(self, user_query: str, conversation_state: dict = None):
        # ... baaki ka code same rahega ...

        final_state = await self.graph.ainvoke(input_state)
        
        # FIX: Last message ko safety ke saath extract karein
        last_msg = final_state["messages"][-1]
        
        # Agar last message object hai toh uska content lein, warna use string banayein
        response_text = getattr(last_msg, 'content', str(last_msg))

        return {
            "state": final_state,
            "response": response_text,
            "tool_called": final_state.get("tool_called", ""),
            "tool_args": final_state.get("tool_args", {}),
            "tool_result": str(final_state.get("tool_result", "")),
            "logs": final_state.get("logs", []),
        }

    async def cleanup(self):
        if self.stack:
            await self.stack.aclose()
