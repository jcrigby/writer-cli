# Writer CLI Architecture Overview

This document provides a high-level overview of the Writer CLI's architecture.

## Core components

The Writer CLI is primarily composed of two main packages, along with a suite of tools that can be used by the system in the course of handling command-line input:

1.  **CLI package (`packages/cli`):**
    - **Purpose:** This contains the user-facing portion of the Writer CLI, such as handling the initial user input, presenting the final output, and managing the overall user experience.
    - **Key functions contained in the package:**
      - [Input processing](./cli/commands.md)
      - History management
      - Display rendering
      - [Theme and UI customization](./cli/themes.md)
      - [CLI configuration settings](./cli/configuration.md)

2.  **Core package (`packages/core`):**
    - **Purpose:** This acts as the backend for the Writer CLI. It receives requests sent from `packages/cli`, orchestrates interactions with AI models via OpenRouter, and manages the execution of available tools.
    - **Key functions contained in the package:**
      - API client for communicating with OpenRouter (unified gateway for Claude, GPT, Gemini, and other models)
      - Prompt construction and management
      - Tool registration and execution logic
      - State management for conversations or sessions
      - Server-side configuration

3.  **Tools (`packages/core/src/tools/`):**
    - **Purpose:** These are individual modules that extend the capabilities of the AI model, allowing it to interact with the local environment (e.g., file system, shell commands, web fetching).
    - **Interaction:** `packages/core` invokes these tools based on requests from the AI model.

## Interaction Flow

A typical interaction with the Writer CLI follows this flow:

1.  **User input:** The user types a prompt or command into the terminal, which is managed by `packages/cli`.
2.  **Request to core:** `packages/cli` sends the user's input to `packages/core`.
3.  **Request processed:** The core package:
    - Constructs an appropriate prompt for the AI model via OpenRouter, possibly including conversation history and available tool definitions.
    - Sends the prompt to OpenRouter, which routes it to the selected model (Claude, GPT, Gemini, etc.).
4.  **AI model response:** The AI model processes the prompt and returns a response via OpenRouter. This response might be a direct answer or a request to use one of the available tools.
5.  **Tool execution (if applicable):**
    - When the AI model requests a tool, the core package prepares to execute it.
    - If the requested tool can modify the file system or execute shell commands, the user is first given details of the tool and its arguments, and the user must approve the execution.
    - Read-only operations, such as reading files, might not require explicit user confirmation to proceed.
    - Once confirmed, or if confirmation is not required, the core package executes the relevant action within the relevant tool, and the result is sent back to the AI model via OpenRouter.
    - The AI model processes the tool result and generates a final response.
6.  **Response to CLI:** The core package sends the final response back to the CLI package.
7.  **Display to user:** The CLI package formats and displays the response to the user in the terminal.

## Key Design Principles

- **Modularity:** Separating the CLI (frontend) from the Core (backend) allows for independent development and potential future extensions (e.g., different frontends for the same backend).
- **Extensibility:** The tool system is designed to be extensible, allowing new capabilities to be added.
- **User experience:** The CLI focuses on providing a rich and interactive terminal experience.
