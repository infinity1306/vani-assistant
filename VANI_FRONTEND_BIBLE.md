# PROJECT TITAN: VANI OS FRONTEND BIBLE V1.0

> "Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs

---

## SECTION 1: PRODUCT PHILOSOPHY

### What VANI Is
VANI (Virtual Autonomous Network Intelligence) is the world's first true AI Operating System Overlay. It is a 100% local, privacy-first, zero-cost intelligence layer that sits directly between the user and their operating system. VANI is not an app; it is a continuously present, contextually aware cognitive companion that orchestrates a hive-mind of specialized local AI agents to execute tasks, manage memory, and automate workflows autonomously.

### Why It Exists
Modern computing is fragmented. Users act as manual routers between dozens of disconnected applications—copying from Chrome, pasting into Word, scheduling in Outlook, querying in ChatGPT. VANI exists to eliminate this friction. It exists to unify the desktop experience by providing a single, multimodal interface (voice + text + context) that understands the user's intent and executes actions across the entire OS without the user ever leaving their current context.

### What Problem It Solves
- **Context Collapse:** AI tools lack native OS context. VANI sees what you see.
- **Privacy Loss:** Cloud AI exposes sensitive data. VANI runs 100% locally on the device.
- **Execution Friction:** Chatbots give instructions; VANI executes them via agentic automation.
- **Fragmented Memory:** Humans forget where they put things. VANI acts as a persistent digital twin and memory graph.

### How It Differs
- **vs. ChatGPT/Claude:** They are isolated cloud web apps. VANI is a local OS-level ambient intelligence.
- **vs. Cursor:** Cursor is for coding. VANI is for life, work, and system-wide automation.
- **vs. Raycast:** Raycast is a manual launcher and script runner. VANI is an autonomous agentic orchestrator.
- **vs. Arc Browser:** Arc organizes the web. VANI organizes the entire operating system.
- **vs. Copilot:** Copilot is integrated but restrictive and cloud-dependent. VANI is open, local, and agentic.
- **vs. Open Interpreter:** Open Interpreter is a CLI tool. VANI is a fluid, ambient, consumer-grade graphical overlay.

### Core Directives
**Vision Statement:** To elevate human potential by providing a secure, autonomous, and intuitive intelligence layer that seamlessly integrates with daily life.
**Mission Statement:** To build the most reliable, private, and delightful AI Operating System, entirely locally.
**Design Principles:**
1. **Ambient but Available:** VANI should be invisible when not needed, but instantly accessible.
2. **Context over Configuration:** Never ask the user for information the system can derive itself.
3. **Fluidity:** Interactions must feel like magic—zero latency, smooth physics, perfect easing.
4. **Absolute Privacy:** 100% local processing. Design must visually reinforce this trust.

**Emotional Design Goals:**
Calm, capable, protective, and anticipatory. VANI should feel like a highly competent chief of staff who already knows what you need.

**User Trust Model:**
Trust is built through transparency. The UI must always show *what* VANI is looking at, *why* it is thinking, and *who* (which agent) is executing the task.

**User Delight Model:**
Delight comes from micro-interactions: the physics of the Orb, the haptic visual feedback of voice recognition, the perfect stagger of search results, and the magic of "it just knew what I meant."

---

## SECTION 2: COMPLETE USER RESEARCH

### Persona 1: Developer ("The Orchestrator")
- **Goals:** Write better code faster, automate boilerplate, debug complex local systems.
- **Frustrations:** Switching between terminal, browser, and IDE. Cloud AI hallucinating context.
- **Daily Workflow:** Heavy terminal usage, reading docs, writing code, reviewing PRs.
- **Usage Patterns:** Keyboard-centric (shortcuts), complex multi-step prompt chains, terminal commands.
- **Expected Features:** Deep IDE integration, local git context, fast code explanation, autonomous refactoring.

### Persona 2: Student ("The Synthesizer")
- **Goals:** Absorb information quickly, write essays, manage deadlines, organize research.
- **Frustrations:** Information overload, lost notes, strict budgets (needs $0 cost).
- **Daily Workflow:** PDF reading, note-taking, attending lectures, drafting documents.
- **Usage Patterns:** Voice-to-text dictation, summarization requests, semantic search across notes.
- **Expected Features:** Ambient lecture transcription, infinite memory graph for finding past concepts, citation generation.

### Persona 3: Researcher ("The Deep Diver")
- **Goals:** Find novel connections, analyze massive local datasets, review literature.
- **Frustrations:** Scattered PDFs, losing track of logical threads over months of work.
- **Daily Workflow:** Reading academic papers, running local Python data models.
- **Usage Patterns:** Heavy reliance on Memory Explorer, complex semantic queries.
- **Expected Features:** Digital Twin Dashboard for thought patterns, local vector search across thousands of papers.

### Persona 4: Founder ("The Generalist")
- **Goals:** Move fast, manage context switching, handle sales, product, and engineering simultaneously.
- **Frustrations:** Too many tools, missing action items from meetings, losing context between context switches.
- **Daily Workflow:** Meetings, emails, pitch deck design, financial modeling.
- **Usage Patterns:** Voice commands while walking, high reliance on Meeting Intelligence Center.
- **Expected Features:** Automatic meeting action items, workflow studio for automating CRM, instant context retrieval.

### Persona 5: Cybersecurity Professional ("The Guardian")
- **Goals:** Analyze local logs, secure systems, reverse engineer malware without leaking data to the cloud.
- **Frustrations:** Cloud AI is strictly forbidden by company policy for sensitive data.
- **Daily Workflow:** Wireshark, terminal, analyzing hex dumps, reading security bulletins.
- **Usage Patterns:** High usage of Security Operations Center, sandboxed agent execution.
- **Expected Features:** 100% local guarantee, transparent audit logs of what VANI's agents are doing, secret management.

### Persona 6: Power User ("The Optimizer")
- **Goals:** Automate everything. Zero mouse usage.
- **Frustrations:** Slow UIs, lack of customizability, repetitive tasks.
- **Daily Workflow:** Custom scripting, heavy Raycast/Alfred usage.
- **Usage Patterns:** Relies entirely on Workflow Studio and Universal Search.
- **Expected Features:** Visual node-based workflow builder, deep OS-level hooking, custom agent creation.

**Journey Map Overview (The "Aha!" Moment):**
1. **Trigger:** User highlights a confusing block of text in a PDF and hits `Ctrl + Space`.
2. **Action:** VANI Orb appears. User says "Summarize this and save it to my project notes."
3. **Processing:** Orb shifts to "Thinking" state. Context Engine reads the PDF. SystemAgent routes to MemoryAgent.
4. **Resolution:** Orb pulses green. A subtle notification confirms: "Saved to Project Alpha Memory."
5. **Emotion:** User feels a sense of magic. No switching apps, no copy-pasting. Pure flow.

---

## SECTION 3: INFORMATION ARCHITECTURE

### Global Navigation Hierarchy
VANI is an overlay, not a traditional app. The architecture is spatially distributed.

1. **The Ambient Layer (The Orb)**
   - Always present (or summoned via global shortcut).
   - Entry point for Universal Search, Voice Commands, and Context Actions.
2. **The Command Center (The Panel)**
   - Expands from the Orb.
   - Contains: Chat Interface, Action Suggestions, Active Context.
3. **Mission Control (The Dashboard)**
   - Full-screen or large window application for deep work.

**Mission Control Tree Structure:**
- **Home (Digital Twin Dashboard)**
  - Today's Overview
  - Active Contexts
  - Quick Actions
- **Agent Operating Center**
  - Grid View
  - Agent Health & Logs
  - Task Queue
- **Memory OS**
  - Timeline View
  - Semantic Search
  - Knowledge Graph
- **Workflow Studio**
  - Canvas Editor
  - Execution History
  - Template Marketplace
- **Project DNA**
  - Repositories
  - Architecture Graphs
- **Meeting Intelligence**
  - Past Meetings
  - Transcripts & Action Items
- **Security Operations Center (SOC)**
  - Audit Logs
  - Permissions Vault

**Reasoning:** The architecture follows progressive disclosure. 90% of user interaction happens via the Ambient Orb (Level 1). 9% requires the Command Center for reading results (Level 2). Only 1% requires opening Mission Control for deep configuration and visualization (Level 3).

---

## SECTION 4: DESIGN SYSTEM (VANI UI)

VANI UI uses a highly refined, glassmorphic, neo-brutalist aesthetic tailored for dark mode (the "Hacker Premium" look).

### Tokens (Exact Values)
**Color Tokens:**
- `color-bg-base`: `rgba(12, 12, 14, 0.85)` (Deep Obsidian Glass)
- `color-bg-elevated`: `rgba(24, 24, 28, 0.90)`
- `color-brand-primary`: `#6366F1` (Indigo Neon)
- `color-brand-secondary`: `#A855F7` (Purple Neon)
- `color-brand-accent`: `#14B8A6` (Teal Neon)
- `color-text-primary`: `#FFFFFF`
- `color-text-secondary`: `#A1A1AA` (Zinc 400)
- `color-border-subtle`: `rgba(255, 255, 255, 0.08)`
- `color-state-success`: `#10B981`
- `color-state-warning`: `#F59E0B`
- `color-state-error`: `#EF4444`

**Glass Tokens:**
- `glass-blur-base`: `backdrop-filter: blur(24px) saturate(150%)`
- `glass-blur-heavy`: `backdrop-filter: blur(48px) saturate(200%)`

**Typography Tokens (Font: 'Inter' & 'JetBrains Mono'):**
- `font-size-xs`: `12px` | `line-height: 16px`
- `font-size-sm`: `14px` | `line-height: 20px`
- `font-size-base`: `16px` | `line-height: 24px`
- `font-size-lg`: `20px` | `line-height: 28px`
- `font-size-xl`: `24px` | `line-height: 32px`

**Radius & Spacing Tokens:**
- `radius-sm`: `6px`
- `radius-md`: `12px`
- `radius-lg`: `24px`
- `radius-full`: `9999px`
- `space-1`: `4px`, `space-2`: `8px`, `space-3`: `12px`, `space-4`: `16px`, `space-6`: `24px`, `space-8`: `32px`

**Shadow & Elevation Tokens:**
- `shadow-sm`: `0 2px 8px rgba(0,0,0,0.4)`
- `shadow-glow-primary`: `0 0 24px rgba(99, 102, 241, 0.4)`
- `shadow-glow-agent`: `0 0 32px rgba(20, 184, 166, 0.5)`

---

## SECTION 5: VANI VISUAL IDENTITY

### The Identity
**Logo:** A minimalist, continuous geometric infinity loop that is never fully closed, representing continuous OODA loop processing.
**Wordmark:** Custom kerning, lowercase, wide tracking. `v a n i`
**Orb Identity:** The Orb is the soul of VANI. It is not a static icon; it is a WebGL shader sphere that shifts in viscosity and color based on the system's cognitive load.
- *Idle:* Slow, deep breathing purple/indigo gradient.
- *Listening:* Expands slightly, reacts via audio-reactive frequency spikes in real-time.
- *Thinking:* Fast, turbulent fluid simulation using Teal and Indigo.

**Sound Identity:**
Inspired by high-end sci-fi interfaces (Minority Report, OS1 from Her). 
- *Wake:* A soft, low-frequency sub-bass swell.
- *Success:* A clean, perfectly quantized marimba/glass ping.
- *Error:* A soft, muffled, dissonant tap. 

---

## SECTION 6: MISSION CONTROL

Mission Control is the expansive desktop view.

**Layout Architecture:**
- **Sidebar (Left, 240px fixed):** Frost-glass navigation menu. Icons follow Apple HIG for stroke weight (1.5px).
- **Main Canvas (Flexible):** Content area. Uses a 12-column CSS Grid.
- **Context Bar (Right, 320px fluid):** Shows the current active state of the OS, RAM usage of local models, and Agent Health.

**Component Breakdown:**
- **Bento Box Widgets:** The home screen utilizes a dynamic Bento grid. Widgets include "Memory Trends", "Active Workflows", and "Recent Contexts".
- **Agent Live Feed:** A terminal-like glass box showing real-time NATS event bus messages fading up.

**Performance Considerations:**
- Rendered via React 19. All heavy state updates (Agent Logs) must be virtualized using `@tanstack/react-virtual`.
- Strict use of `React.memo` and `useMemo` for the Bento Grid layout engine to prevent unnecessary re-renders during WebSocket pushes.

---

## SECTION 7: COMMAND CENTER

The Command Center is the immediate interface summoned via `Cmd+Space` or `Ctrl+Space`.

**Multimodal Interface:**
- **Input:** A single, massive text input field (`font-size-xl`).
- **Context Pill:** Above the input, a small pulsing pill shows what VANI is "looking at" (e.g., `Context: VS Code - main.py`).
- **Dynamic Suggestions:** Below the input, `kbd` shortcuts appear instantly based on typing. (e.g., typing `/` brings up a sub-menu of Agents to explicitly delegate to).

**Interactions:**
- Pressing `Tab` auto-completes the shadow text prediction.
- Pressing `Cmd + Enter` executes the command natively in the terminal instead of via LLM.
- Voice is continuous; if the user starts speaking while the Command Center is open, the text types itself via local Whisper STT.

---

## SECTION 8: AMBIENT ORB

The Orb is built using Three.js / React Three Fiber with custom GLSL shaders.

**Physics & Animation System:**
- Uses Spring physics (`framer-motion` / `react-spring`). No linear easings allowed.
- **Mass:** 1.2, **Tension:** 300, **Friction:** 20.
- **Audio Reactions:** Web Audio API analyzer node feeds frequency data to a uniform array in the GLSL shader, creating physical displacement on the sphere's surface (vertex shader).

**State Machine:**
- `SLEEP`: 30% opacity, monochrome.
- `IDLE`: 80% opacity, slow color shift.
- `LISTENING`: 100% opacity, vertices displace based on microphone volume.
- `PLANNING`: Orb splits into smaller interconnected orbs (representing multi-agent delegation).
- `EXECUTING`: Rapid rotation, solid Teal glow.

---

## SECTION 9: CONTEXT ENGINE UI

VANI tracks everything. The Context Engine UI visualizes this omniscience.

**Interface Elements:**
- **The Context Graph:** A 2D force-directed node graph (using `d3.js` or `react-force-graph`) showing the user at the center, connected to current App, active files, and semantic concepts.
- **Future Predictions List:** VANI uses the OODA loop to predict the next action. Displayed as a ghosted list: "Likely next action: Commit to Git -> 84% probability". User can click `Tab` to execute the prediction.

---

## SECTION 10: DIGITAL TWIN DASHBOARD

VANI learns the user. This dashboard visualizes the user's habits.

**Analytics System:**
- **Focus Trends:** A GitHub-style contribution heatmap showing periods of deep work versus context-switching thrash.
- **Behavior Graph:** "You spend 40% of your time copying data between Chrome and Excel. Want to automate this?" VANI proactively suggests workflows based on local telemetry.

---

## SECTION 11: AGENT OPERATING CENTER

Visualizing the multi-agent hive mind.

**Screens:**
- **The Grid:** Cards representing `SystemAgent`, `CodingAgent`, `BrowserAgent`, etc. Each card has a live pulse indicator (Green = Idle, Blue = Thinking, Red = Error).
- **Agent Communication Graph:** A real-time visualizer of NATS pub/sub traffic. Seeing nodes pinging each other is deeply satisfying to technical users.
- **Work Queue:** A Kanban board that the `OrchestratorAgent` manages autonomously. Users can drag tasks to change priority.

---

## SECTION 12: MEMORY OPERATING SYSTEM

VANI has an infinite memory.

**Interface:**
- **Timeline:** A vertical, infinitely scrollable timeline of everything VANI has seen or done, categorized by day.
- **Memory Explorer:** A semantic search interface. "What was that paper about quantum computing I read last month?" VANI queries Memgraph/ChromaDB and surfaces the exact context.
- **Graph View:** Visualizing the Neo4j/Memgraph knowledge base as a constellation of connected thoughts.

---

## SECTION 13: PROJECT DNA CENTER

For developers.

- **Architecture Graph:** VANI reads the codebase and dynamically generates a UML/Component graph using Mermaid.js underneath, rendered gorgeously in a custom interactive view.
- **Technical Debt Visualizer:** A 3D code-city map where tall buildings equal large files and red buildings equal high cyclomatic complexity (powered by local AST analysis).

---

## SECTION 14: WORKFLOW STUDIO

The visual programming interface.

- **Node System:** React Flow based canvas.
- **Design:** Nodes are glassmorphic cards. Connections are glowing bezier curves with animated marching ants representing data flow.
- **Capabilities:** Users can drag a "BrowserAgent Node", connect it to a "Context Node", and output to a "CodingAgent Node" to visually construct complex OS-level scripts.

---

## SECTION 15: UNIVERSAL SEARCH

The ultimate search layer.

- **Ranking Algorithm:** BM25 + Local Vector Embeddings (MiniLM-L6-v2 running via ONNX).
- **Interaction:** Instant, zero-latency keystroke response.
- **Results:** Combines files, memories, past agent executions, and web search into a unified, rich-media list. Pressing `Cmd+K` on any result opens a sub-menu of agentic actions (e.g., "Summarize", "Refactor", "Email").

---

## SECTION 16: MEETING INTELLIGENCE CENTER

- **Live Transcript UI:** A gorgeous, auto-scrolling terminal-like view. Speaker diarization separates voices visually with different accent colors.
- **Knowledge Extraction:** Post-meeting, VANI automatically generates an artifact containing Action Items, Decisions Made, and Context. Saved directly into the Memory OS.

---

## SECTION 17: SECURITY OPERATIONS CENTER

Because VANI is an autonomous agent with OS access, security is paramount.

- **The Vault:** UI for managing local environment variables, API keys, and system permissions.
- **Audit Logs:** A tamper-proof chronological table showing EXACTLY what commands VANI executed on the OS, when, and why.
- **Approval Center:** "VANI wants to run `rm -rf /temp`. Approve?" A stark, high-contrast modal demanding explicit user biometric/click approval for destructive actions.

---

## SECTION 18: MOTION DESIGN BIBLE

- **Philosophy:** "Motion provides context."
- **Springs:** Use `framer-motion`. Default spring config: `stiffness: 400, damping: 30`.
- **Command Center Entrance:** Scales up from 0.95 to 1.0, opacity from 0 to 1, over 150ms. Exit is 100ms.
- **List Stagger:** Search results animate in with a 30ms stagger delay per item.
- **Orb Morphing:** Shader interpolation speed must match the user's typing speed to feel deeply connected.

---

## SECTION 19: REACT ARCHITECTURE

**Production-Ready Structure:**
```
frontend/
├── src/
│   ├── assets/           # Shaders, audio files, icons
│   ├── components/
│   │   ├── core/         # Buttons, Inputs, GlassPanels (Design System)
│   │   ├── orb/          # WebGL Orb components
│   │   ├── search/       # Universal search UI
│   │   └── widgets/      # Bento box components
│   ├── core/
│   │   ├── api/          # tauri-invoke wrappers, REST fallback
│   │   ├── store/        # Zustand stores
│   │   └── hooks/        # Custom React hooks (useAgent, useContext)
│   ├── features/         # Feature-sliced architecture (Memory, SOC, Workflow)
│   ├── layout/           # App shells, Mission Control wrappers
│   ├── styles/           # CSS modules, Tailwind config
│   ├── types/            # Strict TypeScript interfaces matching Python Pydantic models
│   ├── App.tsx           # Entry point
│   └── main.tsx
```

**State Architecture:**
- **Zustand** for global UI state (Orb state, Panel open/close).
- **TanStack Query** for fetching logs, memory data, and heavy database queries.
- **Context API** strictly for dependency injection (Theme, Auth).

---

## SECTION 20: TECH STACK

**Frontend:**
- **Framework:** React 19 + TypeScript (Ultimate type safety, modern concurrent rendering).
- **Build Tool:** Vite (Instant HMR).
- **Desktop Wrapper:** Tauri v2 (Rust-based, incredibly lightweight, ~15MB RAM footprint compared to Electron's 200MB. Crucial for an "always-on" OS overlay).

**UI & Styling:**
- **Styling:** TailwindCSS v4 + CSS Modules for ultra-fast, consistent design system implementation.
- **Components:** Radix UI Primitives (Unstyled, heavily accessible) + Framer Motion (Animation).
- **3D / Orb:** Three.js + React Three Fiber + custom GLSL.

**State & Data:**
- **State Management:** Zustand (Zero-boilerplate, fast).
- **Data Fetching:** TanStack Query v5.
- **Graphs:** React Flow (Workflow Studio) + React Force Graph (Memory OS).

**Backend Communication:**
- **Real-time:** WebSockets mapped to the local NATS server (enables instant event-driven UI updates without polling).
- **Commands:** Tauri IPC commands (`invoke()`) for native OS interactions.

---

## SECTION 21: IMPLEMENTATION ROADMAP

### Month 1: Foundation & The Orb
- **Architecture Work:** Setup Tauri, Vite, Tailwind, Zustand. Configure NATS WebSocket bridge.
- **Frontend Work:** Build the Ambient Orb WebGL shader. Implement the global summon shortcut (`Cmd+Space`).
- **Outcome:** A floating, animated Orb that can be summoned system-wide and communicates with the Python core.

### Month 2: Command Center & Universal Input
- **Design Work:** Finalize Command Center UI layout and typography.
- **Frontend Work:** Implement the primary multimodal input field. Wire up the `SystemAgent` routing UI.
- **Outcome:** Users can type natural language commands and see the Orb react and route tasks.

### Month 3: Universal Search
- **Frontend Work:** Build the Raycast-style search interface. Integrate with the local ChromaDB/SQLite.
- **Outcome:** Users can instantly search local files and memory.

### Month 4: Context Engine UI
- **Architecture Work:** Hook up `os_tracker.py` data to the React UI via WebSockets.
- **Frontend Work:** Build the Context Pill and dynamic suggestions based on the active window.
- **Outcome:** VANI visibly knows what app the user is using.

### Month 5: Mission Control Dashboard
- **Frontend Work:** Build the full-screen layout, Bento box grid, and widget system.
- **Outcome:** A beautiful home screen summarizing the user's digital life.

### Month 6: Agent Operating Center
- **Frontend Work:** Build the Agent Grid and real-time NATS log visualizer.
- **Outcome:** Complete transparency into the hive-mind execution.

### Month 7: Memory Operating System
- **Frontend Work:** Implement the infinite timeline and Force Graph visualization.
- **Outcome:** Users can explore their knowledge graph visually.

### Month 8: Workflow Studio (V1)
- **Frontend Work:** Implement React Flow canvas. Build basic drag-and-drop agent nodes.
- **Outcome:** Users can build visual automations.

### Month 9: Security Operations Center
- **Frontend Work:** Build Audit Logs table, Permissions Vault, and Biometric approval modals.
- **Outcome:** Enterprise-grade security and trust transparency.

### Month 10: Meeting Intelligence Center
- **Frontend Work:** Build Live Transcript UI and action item extractors.
- **Outcome:** VANI acts as a chief of staff during local meetings.

### Month 11: Project DNA Center
- **Frontend Work:** Build codebase visualizers and Git analytics widgets.
- **Outcome:** Deep developer integration.

### Month 12: Polish, Physics, & Performance
- **Design Work:** Audit all animations, spring physics, and glass effects.
- **Testing Work:** Full accessibility (WCAG) audit, performance profiling (targeting 60fps stable, <50MB RAM).
- **Outcome:** VANI OS X 1.0 Release. The most advanced, fluid, and powerful local AI operating system ever created.

---
*END OF DOCUMENT*
