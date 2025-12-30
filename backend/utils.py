# backend/utils.py
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from contextlib import AsyncExitStack
import json
from jsonschema import validate, ValidationError
from langchain_core.tools import StructuredTool
from pydantic import create_model
from typing import Union
import asyncio

def remove_descriptions(data, max_length=None):
    """Remove description fields from JSON schema."""
    if isinstance(data, dict):
        new_dict = {}
        for key, value in data.items():
            if key == "description":
                if max_length is None:
                    continue
                elif isinstance(value, str) and len(value) > max_length:
                    continue
            new_dict[key] = remove_descriptions(value, max_length)
        return new_dict
    elif isinstance(data, list):
        return [remove_descriptions(item, max_length) for item in data]
    return data


def validate_arguments(inputs_args, schema):
    """Validate tool arguments against schema."""
    try:
        validate(instance=inputs_args, schema=schema)
        return "Valid"
    except ValidationError as e:
        return f"Invalid: {e.message}"


MAP = {
    "string": str,
    "number": float,
    "integer": int,
    "boolean": bool,
    "array": list,
    "object": dict
}


def json_to_model(name, schema):
    """Convert JSON schema to Pydantic model."""
    fields = {}
    required = schema.get("required", [])
    properties = schema.get("properties", {})

    for prop, rules in properties.items():
        if "anyOf" in rules:
            possible = []
            for option in rules["anyOf"]:
                if option["type"] in MAP:
                    possible.append(MAP[option["type"]])
            fields[prop] = (Union[tuple(possible)], ... if prop in required else None)
        else:
            py_type = MAP.get(rules["type"], str)
            fields[prop] = (py_type, ... if prop in required else None)

    return create_model(name, **fields)


async def mcp_execute(session, tool_name: str, **kwargs):
    """Execute MCP tool."""
    result = await session.call_tool(tool_name, kwargs)
    return result


def build_tool_from_schema(tool_name, tool_description, tool_schema, session):
    """Build LangChain tool from MCP schema."""
    new_tool_name = tool_name.replace("-", "_") + "_Args"
    Arg_model = json_to_model(new_tool_name, tool_schema)

    async def wrapper(**kwargs):
        try:
            result = await mcp_execute(session=session, tool_name=tool_name, **kwargs)
            # Extract text content from MCP response
            if hasattr(result, 'content') and len(result.content) > 0:
                return result.content[0].text
            return str(result)
        except Exception as e:
            return f"TOOL ERROR: {type(e).__name__}: {str(e)}"

    tool = StructuredTool.from_function(
        coroutine=wrapper,
        name=tool_name,
        description=tool_description,
        args_schema=Arg_model
    )
    return tool


def load_config():
    """Load MCP server config."""
    config_path = "mcp.json"
    try:
        with open(config_path) as f:
            config = json.load(f)
            return config.get("mcpServers", {})
    except Exception as e:
        print(f"Unable to open Config: {e}")
        return None


async def configure_mcp():
    """Configure MCP servers and tools."""
    mcp_servers = load_config()
    if not mcp_servers:
        raise Exception("No MCP servers configured")
    
    server_session_dict = {}
    input_schemas = {}
    name_to_tool = {}
    tools = []

    stack = AsyncExitStack()
    await stack.__aenter__()

    try:
        for server_name, server_info in mcp_servers.items():
            server_param = StdioServerParameters(
                command=server_info["command"],
                args=server_info["args"],
                env=server_info.get("env")
            )

            read, write = await stack.enter_async_context(stdio_client(server_param))
            session = await stack.enter_async_context(
                ClientSession(read_stream=read, write_stream=write)
            )

            await session.initialize()
            print(f"✅ Session initialized for {server_name}")

            server_session_dict[server_name] = session

            server_tools = await session.list_tools()
            for tool in server_tools.tools:
                clean_schema = remove_descriptions(tool.inputSchema, max_length=200)
                input_schemas[tool.name] = clean_schema
                create_tool = build_tool_from_schema(
                    tool.name, tool.description, clean_schema, session
                )
                tools.append(create_tool)
                name_to_tool[tool.name] = create_tool

        print(f"✅ Successfully configured {len(tools)} tools")
        return tools, input_schemas, name_to_tool, stack

    except Exception as e:
        print(f"❌ Stack closed due to problem: {e}")
        await stack.aclose()
        raise
