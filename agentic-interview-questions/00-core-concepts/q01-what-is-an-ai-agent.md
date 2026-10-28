[⬅ Back](../../README.md)

# Q1. What is an AI Agent?

**Category:** Core Concepts  
**Difficulty:** Beginner  
**Tags:** agent, ai-agent, autonomous, definition

## Question

What is an AI agent, and how does it differ from a traditional AI model or chatbot?

## Answer

An **AI agent** is an autonomous system that perceives its environment, reasons about goals, takes actions through tools or APIs, and observes the results to iteratively improve its approach — all with minimal human intervention.

### Key characteristics that distinguish an agent from a standard LLM:

| Feature | Traditional LLM / Chatbot | AI Agent |
|---------|---------------------------|----------|
| **Autonomy** | Responds to a single prompt | Pursues a goal over multiple steps |
| **Tool Use** | None or limited | Can call APIs, run code, search the web |
| **Memory** | Stateless (context window only) | Can persist state across sessions |
| **Planning** | No built-in planning | Can decompose tasks into sub-tasks |
| **Feedback Loop** | Single response | Observe → Reflect → Adjust → Act |

### Simple Example

A customer support agent that:
1. Reads an incoming support ticket
2. Searches the knowledge base for relevant articles
3. Checks the user's account status via API
4. Drafts a response
5. Escalates to a human if confidence is low

## Key Takeaways

- An agent combines an LLM with tools, memory, and a feedback loop
- Agents are goal-driven rather than prompt-driven
- The defining feature is the ability to act on the environment, not just converse

## Related Questions

- [Q2. Agent vs Assistant vs Workflow](./q02-agent-vs-assistant-vs-workflow.md)
- [Q3. Key Components of an AI Agent](./q03-key-components-of-an-agent.md)

## References

- [Lilian Weng: LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/)
- [LangChain: Agents](https://python.langchain.com/docs/concepts/#agents)

---

[⬅ Return to Root README](../../../README.md)