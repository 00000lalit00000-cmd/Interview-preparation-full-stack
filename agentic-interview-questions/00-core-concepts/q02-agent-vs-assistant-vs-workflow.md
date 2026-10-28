[⬅ Back](../../README.md)

# Q2. Agent vs Assistant vs Workflow

**Category:** Core Concepts  
**Difficulty:** Beginner  
**Tags:** agent, assistant, workflow, comparison

## Question

What is the difference between an AI agent, an AI assistant, and an automated workflow?

## Answer

While these terms are often used interchangeably, they represent different levels of autonomy and structure:

### AI Workflow
A **workflow** is a deterministic, predefined sequence of steps. The path is fixed at design time.

```
Input → Step A → Step B → Step C → Output
```

**Example:** A CI/CD pipeline that runs lint, tests, and deployment in a fixed order.

### AI Assistant
An **assistant** responds to user requests using an LLM, typically within a single conversation turn. It may use tools but generally follows the user's immediate instructions without pursuing long-term goals autonomously.

**Example:** A chatbot that answers questions about company policy.

### AI Agent
An **agent** autonomously pursues a goal by planning, acting, observing, and iterating. It decides *which* steps to take and *when* to stop.

**Example:** An agent that researches a topic by browsing multiple websites, summarizing findings, and writing a report — without being told exactly which sites to visit.

### Comparison Table

| Dimension | Workflow | Assistant | Agent |
|-----------|----------|-----------|-------|
| Determinism | Fully deterministic | Semi-deterministic | Non-deterministic |
| Planning | Predefined | Minimal | Dynamic |
| Tool Use | Fixed tools | Optional tools | Decides which tools to use |
| Autonomy | None | Low (user-directed) | High (goal-directed) |
| Error Handling | Hard-coded | LLM-dependent | Self-correcting / reflective |

## Key Takeaways

- Workflows = fixed steps, no LLM reasoning about control flow
- Assistants = LLM responds to user, limited autonomy
- Agents = LLM decides plan, tools, and when the goal is met

## Related Questions

- [Q1. What is an AI Agent?](./q01-what-is-an-ai-agent.md)
- [Q4. The Agentic Loop Explained](./q04-agentic-loop-explained.md)

## References

- [Andrew Ng: Agentic Workflows](https://www.deeplearning.ai/the-batch/agentic-workflows/)

---

[⬅ Return to Root README](../../../README.md)