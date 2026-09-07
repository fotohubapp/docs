---
title: Agent Nodes Catalog (198 Nodes)
description: Kompletny katalog i dokumentacja referencyjna wszystkich 198 węzłów wykonawczych w 23 kategoriach silnika FotoHub Agent Engine.
---

# Katalog Węzłów Agenta (198 Nodes Reference)

Kompletny przewodnik po **wszystkich 198 produkcyjnych węzłach (nodes)** dostępnych w FotoHub Agent Engine (`/dashboard/agents/*`). Każdy węzeł posiada zweryfikowany schemat wejść/wyjść, obsługę błędów, system fallbacku oraz pełną integrację z orkiestratorem DAG i systemem telemetrycznym.

::: tip ARCHITEKTURA WYKONAWCZA (EXECUTION ENGINES)
Węzły w FotoHub wykonywane są przez 5 wyspecjalizowanych środowisk uruchomieniowych:
- **Built-in Logic Engine** (`builtin`): Błyskawiczne operacje pamięciowe w Pythonie (warunki, filtry JMESPath, agregacje).
- **Supabase Edge Functions** (`edge_fn`): Zdecentralizowane funkcje brzegowe do integracji OAuth, AI i API.
- **Dedicated GPU Microservices** (`http`): Klastry renderujące `image-engine`, `video-engine`, `music-server`.
- **Autonomous LLM Agents** (`llm_agent`): Samodzielne pętle decyzyjne z obsługą wywołań narzędzi (Tool Calling) i modeli Claude/GPT/Bedrock.
- **Model Context Protocol** (`mcp`): Standard Anthropic MCP pozwalający na podłączanie zewnętrznych serwerów narzędziowych.
:::

## Przegląd Kategorii (23 Kategorie)

| Kategoria | Emoji | Liczba węzłów | Główny cel i zastosowanie |
|---|:---:|:---:|---|
| [Triggers (Wyzwalacze Przepływów)](#trigger) | ⚡ | **5** | Węzły startowe inicjujące wykonanie grafu workflow. Przepływ może być wyzwalany ręcznie, w... |
| [Autonomous Agents & Swarm (Autonomiczni Agenci & Rój)](#agent) | 🤖 | **8** | Samodzielne węzły decyzyjne i orkiestracyjne zdolne do wieloturowego rozumowania, wywoływa... |
| [Advanced Flow Control & Routers (Sterowanie & Routery)](#control) | 🧭 | **7** | Mechanizmy zarządzania ruchem i niezawodnością klasy Enterprise: testy A/B canary, kaskado... |
| [FotoHub Shorts & Viral Reels (Rolki i Wirale)](#fotohub-shorts) | ✂️ | **3** | Zoptymalizowane pod algorytmy TikToka, Instagram Reels i YouTube Shorts narzędzia do autom... |
| [FotoHub UGC Studio & Try-On (User Generated Content)](#fotohub-ugc) | 🎭 | **3** | Generowanie autentycznych wideo recenzji z fotorealistycznymi aktorami UGC, synchronizacją... |
| [FotoHub Creative Studio (E-Commerce Studio)](#fotohub-creative) | ✨ | **1** | Usuwanie surowego tła z fotografii produktowych i generowanie fotorealistycznych scen rekl... |
| [Creative Studio & Styling (Aranżacja Produktowa)](#creative) | 💡 | **1** | Zaawansowane generowanie aranżacji packshotowych i studyjnych dla branży fashion, kosmetyk... |
| [FotoHub AI Image Processing (Grafika & Obraz)](#fotohub-image) | 🎨 | **19** | Kompletny zestaw 19 operacji na obrazie: generowanie w modelach SOTA (Flux, Midjourney v6,... |
| [FotoHub AI Video Generation (Wideo & Animacja)](#fotohub-video) | 🎬 | **12** | Potężny silnik wideo: generowanie sekwencji wideo z tekstu i obrazów, stabilizacja żyrosko... |
| [FotoHub Audio, Voice & Music (Dźwięk, Muzyka, SFX)](#fotohub-audio) | 🎵 | **14** | Synteza mowy w 100+ językach z naturalną ekspresją, generowanie pełnych utworów muzycznych... |
| [Real-Time Voice & Streaming Audio (Głos w Czasie Rzeczywistym)](#voice) | 🎙️ | **3** | Dwukierunkowa, konwersacyjna komunikacja głosowa na żywo z ultraniskim opóźnieniem (<300ms... |
| [FotoHub Brand Governance (Zarządzanie Marką)](#fotohub-brand) | 🏷️ | **6** | Nadzór nad spójnością marki: automatyczna ekstrakcja wytycznych z PDF, generowanie palet k... |
| [AI Models, LLMs & Vision (Modele LLM & Analiza Wizualna)](#ai) | 🧠 | **6** | Zintegrowane modele językowe i multimodalne (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) do... |
| [Knowledge Base & Vector Memory (Baza Wiedzy & Pamięć RAG)](#knowledge) | 📚 | **3** | Wyszukiwanie semantyczne (Retrieval-Augmented Generation), długoterminowa pamięć wektorowa... |
| [Social Media Publishing & Scheduling (Publikacja Społecznościowa)](#social) | 📱 | **14** | Bezpośrednia publikacja i harmonogramowanie treści na Instagram (Post, Reel, Story), TikTo... |
| [External Integrations & E-Commerce (Konektory Zewnętrzne)](#integration) | 🔌 | **61** | 61 konektorów do platform handlowych (Allegro, Shopify, WooCommerce, eBay, Etsy, PrestaSho... |
| [Cloud Storage & File Delivery (Magazyn Danych & Chmura)](#storage) | ☁️ | **10** | Bezpieczny transfer i archiwizacja assetów: Galeria FotoHub, pliki projektowe, AWS S3, Clo... |
| [Flow Logic & Data Transformation (Logika & Przekształcanie Danych)](#logic) | 🔀 | **15** | Deterministyczna logika przepływu: warunki If, Switch, opóźnienia, agregacje matematyczne ... |
| [Workflow Input & Output (Granice Wejścia/Wyjścia)](#io) | 📥 | **2** | Definiowanie punktów wejściowych parametrów użytkownika oraz bezpieczny zapis i podsumowan... |
| [Code Sandbox (Piaskownica Kodu Python / JS)](#code) | ⌨️ | **2** | Bezpieczne, izolowane wykonywanie skryptów Python (Pillow, Requests, NumPy) oraz JavaScrip... |
| [HTTP & REST API Client (Klient HTTP)](#http) | 🌐 | **1** | Uniwersalny klient HTTP do łączenia z dowolnym zewnętrznym API REST/GraphQL z obsługą Bear... |
| [System & Rollback Safeguards (Wersjonowanie Systemu)](#system) | 🛡️ | **1** | Tworzenie migawek (snapshotów) stanu konfiguracji agenta i całego ekosystemu z automatyczn... |
| [Developer Inspection Tooling (Narzędzia Developerskie)](#developer) | 🛠️ | **1** | Narzędzia inspekcyjne, mocki środowiskowe i piaskownice do debugowania i testowania zachow... |
| **SUMA** | 🚀 | **198** | **Pełna gama węzłów produkcyjnych** |

---

## ⚡ Triggers (Wyzwalacze Przepływów) <a id="trigger"></a>

> **Liczba węzłów:** 5 | **Identyfikator kategorii:** `trigger`

Węzły startowe inicjujące wykonanie grafu workflow. Przepływ może być wyzwalany ręcznie, wg harmonogramu CRON, poprzez publiczny webhook HTTP, formularz wejściowy lub kryptograficznie zabezpieczony webhook HMAC-SHA256.

**Typowe zastosowanie produkcyjne:** Uruchamianie generowania treści e-commerce natychmiast po pojawieniu się nowego zamówienia w sklepie, cykliczne publikowanie o 9:00 rano lub odbiór płatności ze Stripe/PayPal.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `trigger.manual` | **Ręczny Start**<br>_Manual Trigger_ | In: `main`<br>Out: `main` | `trigger` | Free (0 cr) |
| `trigger.schedule` | **Harmonogram (CRON)**<br>_Schedule Trigger_ | In: `main`<br>Out: `main` | `trigger` | Free (0 cr) |
| `trigger.webhook` | **Wyzwalacz Webhook**<br>_Webhook Trigger_ | In: `main`<br>Out: `main` | `trigger` | Free (0 cr) |
| `trigger.form` | **Formularz Wejściowy**<br>_Form Trigger_ | In: `main`<br>Out: `main` | `trigger` | Free (0 cr) |
| `trigger.webhook_secure` | **Bezpieczny Webhook (HMAC-SHA256)**<br>_Secure Webhook Trigger_ | In: `none`<br>Out: `valid, invalid` | `builtin` | Free (0 cr) |

### Szczegółowa Specyfikacja Węzłów (Triggers (Wyzwalacze Przepływów))

#### `trigger.manual` — Ręczny Start (Manual Trigger)

Uruchom ten workflow ręcznie z panelu lub przez API.

- **Executor:** `trigger`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `label` | `string` | Nie | `Manual run` | Shown to the user when they trigger this workflow. |

```json
{
  "id": "trigger_manual_1",
  "type": "trigger.manual",
  "position": [
    250,
    150
  ],
  "params": {
    "label": "Manual run"
  }
}
```

---

#### `trigger.schedule` — Harmonogram (CRON) (Schedule Trigger)

Uruchamiaj ten workflow cyklicznie wg zadanego harmonogramu lub interwału.

- **Executor:** `trigger`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `cron` | `string` | Tak | `0 9 * * *` | Standard 5-field cron. e.g. '0 9 * * MON-FRI'. |
| `timezone` | `options` | Nie | `Europe/Warsaw` | <br>_Dostępne opcje:_ `Europe/Warsaw`, `Europe/London`, `UTC`, `America/New_York`, `America/Los_Angeles` (+1 innych) |

```json
{
  "id": "trigger_schedule_1",
  "type": "trigger.schedule",
  "position": [
    250,
    150
  ],
  "params": {
    "cron": "0 9 * * *",
    "timezone": "Europe/Warsaw"
  }
}
```

---

#### `trigger.webhook` — Wyzwalacz Webhook (Webhook Trigger)

Uruchamiaj workflow po odebraniu żądania HTTP POST na publiczny adres URL.

- **Executor:** `trigger`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `path_label` | `string` | Nie | _brak_ | Human-friendly suffix appended after the random slug. |
| `method` | `options` | Nie | `POST` | <br>_Dostępne opcje:_ `POST`, `GET`, `PUT`, `DELETE` |
| `require_hmac` | `boolean` | Nie | `False` | If on, generated secret must match x-fh-signature header. |

```json
{
  "id": "trigger_webhook_1",
  "type": "trigger.webhook",
  "position": [
    250,
    150
  ],
  "params": {
    "method": "POST",
    "require_hmac": false
  }
}
```

---

#### `trigger.form` — Formularz Wejściowy (Form Trigger)

Generuje publiczny formularz; wysłanie danych uruchamia workflow.

- **Executor:** `trigger`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Tak | `Submit` |  |
| `description_md` | `string` | Nie | _brak_ |  |

```json
{
  "id": "trigger_form_1",
  "type": "trigger.form",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "Submit"
  }
}
```

---

#### `trigger.webhook_secure` — Bezpieczny Webhook (HMAC-SHA256) (Secure Webhook Trigger)

Wyzwalacz webhooków z kryptograficzną weryfikacją podpisu HMAC-SHA256 i filtrem adresów IP.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** Brak (Węzeł początkowy)
- **Porty Wyjściowe:** `valid` (any), `invalid` (any)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `secret_key` | `string` | Nie | `whsec_live_demo12345` | Sekretny klucz używany do obliczenia HMAC. |
| `signature_header` | `string` | Nie | `X-Hub-Signature-256` | Nagłówek podpisu |
| `allowed_ips` | `string` | Nie | `*` | Lista oddzielona przecinkami lub '*' dla wszystkich. |

```json
{
  "id": "trigger_webhook_secure_1",
  "type": "trigger.webhook_secure",
  "position": [
    250,
    150
  ],
  "params": {
    "secret_key": "whsec_live_demo12345",
    "signature_header": "X-Hub-Signature-256",
    "allowed_ips": "*"
  }
}
```

---

## 🤖 Autonomous Agents & Swarm (Autonomiczni Agenci & Rój) <a id="agent"></a>

> **Liczba węzłów:** 8 | **Identyfikator kategorii:** `agent`

Samodzielne węzły decyzyjne i orkiestracyjne zdolne do wieloturowego rozumowania, wywoływania narzędzi zewnętrznych, autonomicznej samonaprawy (self-healing), dystrybucji zadań do roju wyspecjalizowanych subagentów oraz syntezy konsensusu.

**Typowe zastosowanie produkcyjne:** Kreatywny dyrektor AI, który rozbija brief marketingowy na zadania graficzne, wideo i copywriterskie, a następnie weryfikuje ich jakość w pętli critique loop przed ostateczną akceptacją.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `agent.call_subagent` | **Wywołaj Pod-agenta**<br>_Call Subagent_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `agent.swarm_fanout` | **Rój Agentów (Swarm Fanout)**<br>_Agent Swarm Fan-Out_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `agent.critique_loop` | **Pętla Samoulepszania (Evaluator)**<br>_Critique & Refinement Loop_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `agent.mcp_call` | **Narzędzie MCP (Model Context Protocol)**<br>_Call MCP Tool_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `mcp.hub_call` | **Wywołanie Narzędzia MCP Hub**<br>_Wywołanie Narzędzia MCP Hub_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `agent.consensus_aggregate` | **Konsensus i Jury Agentów**<br>_Consensus Aggregate_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `agent.voice_dialogue` | **Agent Głosowy Live (Full-Duplex)**<br>_Real-Time Voice Agent_ | In: `in`<br>Out: `main, transcription` | `builtin` | Free (0 cr) |
| `agent.self_healing` | **Autonomiczny Self-Healing & Auto-Repair**<br>_Autonomous Self-Healing_ | In: `in`<br>Out: `repaired, fallback, fatal` | `builtin` | Free (0 cr) |

### Szczegółowa Specyfikacja Węzłów (Autonomous Agents & Swarm (Autonomiczni Agenci & Rój))

#### `agent.call_subagent` — Wywołaj Pod-agenta (Call Subagent)

Uruchamia dedykowanego pod-agenta lub zagnieżdżony workflow z mapowaniem parametrów.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `workflow_id` | `string` | Tak | _brak_ | ID workflow lub nazwa agenta do wywołania |
| `input_data` | `json` | Nie | _brak_ | Obiekt wejściowy przekazywany do pod-agenta |
| `wait_for_completion` | `boolean` | Nie | `True` |  |
| `timeout_seconds` | `number` | Nie | `300` |  |

```json
{
  "id": "agent_call_subagent_1",
  "type": "agent.call_subagent",
  "position": [
    250,
    150
  ],
  "params": {
    "workflow_id": "<warto\u015b\u0107>",
    "wait_for_completion": true,
    "timeout_seconds": 300
  }
}
```

---

#### `agent.swarm_fanout` — Rój Agentów (Swarm Fanout) (Agent Swarm Fan-Out)

Rozsyła listę zadań do klastra równoległych agentów i agreguje wyniki.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `tasks_path` | `string` | Nie | `$.items` | JSONPath wskazujący listę elementów do przetworzenia |
| `subagent_workflow_id` | `string` | Tak | _brak_ |  |
| `concurrency` | `number` | Nie | `5` |  |
| `aggregation` | `options` | Nie | `array` | <br>_Dostępne opcje:_ `array`, `merge_dict`, `first_success` |

```json
{
  "id": "agent_swarm_fanout_1",
  "type": "agent.swarm_fanout",
  "position": [
    250,
    150
  ],
  "params": {
    "tasks_path": "$.items",
    "subagent_workflow_id": "<warto\u015b\u0107>",
    "concurrency": 5,
    "aggregation": "array"
  }
}
```

---

#### `agent.critique_loop` — Pętla Samoulepszania (Evaluator) (Critique & Refinement Loop)

Generuje wynik, ocenia go wg zdefiniowanych kryteriów i automatycznie poprawia do osiągnięcia zadanego progu.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `task_prompt` | `string` | Tak | _brak_ |  |
| `evaluation_rubric` | `string` | Nie | `Zgodność z promptem, estetyka, styl, poprawność logiczna` |  |
| `target_score` | `number` | Nie | `8` |  |
| `max_refinement_steps` | `number` | Nie | `3` |  |
| `evaluator_model` | `options` | Nie | `claude-3-7-sonnet` | <br>_Dostępne opcje:_ `claude-3-7-sonnet`, `gpt-5-turbo`, `gemini-2.5-pro`, `fast-evaluator` |

```json
{
  "id": "agent_critique_loop_1",
  "type": "agent.critique_loop",
  "position": [
    250,
    150
  ],
  "params": {
    "task_prompt": "<warto\u015b\u0107>",
    "evaluation_rubric": "Zgodno\u015b\u0107 z promptem, estetyka, styl, poprawno\u015b\u0107 logiczna",
    "target_score": 8,
    "max_refinement_steps": 3
  }
}
```

---

#### `agent.mcp_call` — Narzędzie MCP (Model Context Protocol) (Call MCP Tool)

Wywołuje dowolne narzędzie ze wskazanego serwera protokołu MCP.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `server_url` | `string` | Tak | _brak_ |  |
| `tool_name` | `string` | Tak | _brak_ |  |
| `arguments` | `json` | Nie | _brak_ |  |
| `auth_token` | `string` | Nie | _brak_ |  |

```json
{
  "id": "agent_mcp_call_1",
  "type": "agent.mcp_call",
  "position": [
    250,
    150
  ],
  "params": {
    "server_url": "<warto\u015b\u0107>",
    "tool_name": "<warto\u015b\u0107>"
  }
}
```

---

#### `mcp.hub_call` — Wywołanie Narzędzia MCP Hub (Wywołanie Narzędzia MCP Hub)

Dynamiczne wywołanie narzędzia z zarejestrowanego serwera MCP w wieloserwerowym hubie narzędzi.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `server_id` | `string` | Tak | _brak_ |  |
| `tool_name` | `string` | Tak | _brak_ |  |
| `arguments` | `json` | Nie | `{}` |  |
| `fail_silently` | `boolean` | Nie | `False` |  |

```json
{
  "id": "mcp_hub_call_1",
  "type": "mcp.hub_call",
  "position": [
    250,
    150
  ],
  "params": {
    "server_id": "<warto\u015b\u0107>",
    "tool_name": "<warto\u015b\u0107>",
    "arguments": {},
    "fail_silently": false
  }
}
```

---

#### `agent.consensus_aggregate` — Konsensus i Jury Agentów (Consensus Aggregate)

Agreguje odpowiedzi roju agentów, weryfikuje quorum i wyłania zwycięski wariant na podstawie głosowania lub wag ufności.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `aggregation_strategy` | `options` | Nie | `majority_vote` | Algorytm wyłaniania konsensusu spośród odpowiedzi agentów roju<br>_Dostępne opcje:_ `majority_vote`, `weighted_confidence`, `llm_jury_synthesis`, `unanimous_or_fallback` |
| `min_quorum` | `number` | Nie | `2` | Minimalna liczba agentów popierających wariant lub minimalna liczba głosów |
| `fallback_strategy` | `options` | Nie | `highest_confidence` | Strategia postępowania w przypadku braku quorum lub remisu<br>_Dostępne opcje:_ `highest_confidence`, `first_valid`, `fail` |
| `confidence_field` | `string` | Nie | `confidence` | Nazwa pola określająca pewność/wagę odpowiedzi agenta (0.0-1.0) |

```json
{
  "id": "agent_consensus_aggregate_1",
  "type": "agent.consensus_aggregate",
  "position": [
    250,
    150
  ],
  "params": {
    "aggregation_strategy": "majority_vote",
    "min_quorum": 2,
    "fallback_strategy": "highest_confidence",
    "confidence_field": "confidence"
  }
}
```

---

#### `agent.voice_dialogue` — Agent Głosowy Live (Full-Duplex) (Real-Time Voice Agent)

Dwukierunkowy agent głosowy czasu rzeczywistego z detekcją ciszy VAD i naturalną syntezą mowy.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `in` (any)
- **Porty Wyjściowe:** `main` (any), `transcription` (string)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `voice_engine` | `options` | Nie | `elevenlabs_conversational` | Silnik głosu<br>_Dostępne opcje:_ `elevenlabs_conversational`, `openai_realtime_audio`, `gemini_multimodal_live` |
| `language` | `options` | Nie | `pl-PL` | Język dialogu<br>_Dostępne opcje:_ `pl-PL`, `en-US`, `de-DE` |
| `vad_threshold` | `number` | Nie | `0.5` | Próg detekcji głosu i przerywania mowy (barge-in). |

```json
{
  "id": "agent_voice_dialogue_1",
  "type": "agent.voice_dialogue",
  "position": [
    250,
    150
  ],
  "params": {
    "voice_engine": "elevenlabs_conversational",
    "language": "pl-PL",
    "vad_threshold": 0.5
  }
}
```

---

#### `agent.self_healing` — Autonomiczny Self-Healing & Auto-Repair (Autonomous Self-Healing)

Przechwytuje błędy i wyjątki wykonania, analizuje traceback i dynamicznie koryguje parametry/payload.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `in` (any)
- **Porty Wyjściowe:** `repaired` (any), `fallback` (any), `fatal` (any)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `strategy` | `options` | Nie | `schema_and_params` | Strategia naprawy<br>_Dostępne opcje:_ `schema_and_params`, `model_fallback`, `prompt_compression` |
| `max_repair_attempts` | `number` | Nie | `3` | Maks. liczba prób naprawy |
| `auto_commit_patch` | `boolean` | Nie | `True` | Automatycznie zatwierdź poprawkę |

```json
{
  "id": "agent_self_healing_1",
  "type": "agent.self_healing",
  "position": [
    250,
    150
  ],
  "params": {
    "strategy": "schema_and_params",
    "max_repair_attempts": 3,
    "auto_commit_patch": true
  }
}
```

---

## 🧭 Advanced Flow Control & Routers (Sterowanie & Routery) <a id="control"></a>

> **Liczba węzłów:** 7 | **Identyfikator kategorii:** `control`

Mechanizmy zarządzania ruchem i niezawodnością klasy Enterprise: testy A/B canary, kaskadowe macierze fallbacku (fallback matrix), bezpieczne pętle warunkowe z ochroną przed deadlockami oraz bramki równoległe (parallel gates).

**Typowe zastosowanie produkcyjne:** Przekierowywanie 10% ruchu do eksperymentalnego modelu wideo, a w przypadku błędu GPU automatyczne kaskadowe przełączenie na model alternatywny bez przerywania sesji klienta.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `control.human_approval` | **Zatwierdzenie Człowieka (Human Gate)**<br>_Zatwierdzenie Człowieka (Human Gate)_ | In: `main`<br>Out: `approved, rejected` | `builtin` | Free (0 cr) |
| `control.fallback_matrix` | **Auto-Healing & Awaryjny Provider**<br>_Fallback Matrix_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `control.dynamic_switch` | **Dynamiczny Switch Router**<br>_Dynamic Switch_ | In: `main`<br>Out: `case_1, case_2, case_3, default` | `builtin` | Free (0 cr) |
| `control.parallel_gate` | **Bramka Zbieżności Równoległej**<br>_Parallel Gate_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `control.loop_while` | **Pętla Iteracyjna While**<br>_Loop While_ | In: `main`<br>Out: `loop, done` | `builtin` | Free (0 cr) |
| `control.smart_router` | **Semantyczny Smart Router**<br>_Smart AI Router_ | In: `main`<br>Out: `photo_generation, photo_editing, text_and_copy, data_analysis, fallback` | `builtin` | Free (0 cr) |
| `control.traffic_split` | **A/B Traffic Splitter**<br>_Traffic Splitter (A/B)_ | In: `main`<br>Out: `variant_a, variant_b, variant_c` | `builtin` | Free (0 cr) |

### Szczegółowa Specyfikacja Węzłów (Advanced Flow Control & Routers (Sterowanie & Routery))

#### `control.human_approval` — Zatwierdzenie Człowieka (Human Gate) (Zatwierdzenie Człowieka (Human Gate))

Wstrzymuje wykonanie workflow do momentu akceptacji lub odrzucenia przez użytkownika ze ścisłą polityką SLA i eskalacją.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `approved` (main), `rejected` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Tak | _brak_ |  |
| `message` | `string` | Nie | _brak_ |  |
| `sla_minutes` | `number` | Nie | `60` |  |
| `timeout_policy` | `options` | Nie | `auto_reject` | <br>_Dostępne opcje:_ `auto_approve`, `auto_reject`, `escalate_webhook` |
| `escalation_webhook_url` | `string` | Nie | _brak_ |  |
| `notification_channel` | `options` | Nie | `slack` | <br>_Dostępne opcje:_ `slack`, `discord`, `email`, `custom_webhook` |
| `timeout_hours` | `number` | Nie | `24` |  |
| `auto_approve_on_timeout` | `boolean` | Nie | `False` |  |

```json
{
  "id": "control_human_approval_1",
  "type": "control.human_approval",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<warto\u015b\u0107>",
    "sla_minutes": 60,
    "timeout_policy": "auto_reject"
  }
}
```

---

#### `control.fallback_matrix` — Auto-Healing & Awaryjny Provider (Fallback Matrix)

Zapewnia odporność na awarie — automatycznie przełącza na zapasowy model w razie błędu lub limitu API.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `primary_provider` | `string` | Tak | _brak_ |  |
| `fallback_provider` | `string` | Tak | _brak_ |  |
| `trigger_on` | `options` | Nie | `any_error` | <br>_Dostępne opcje:_ `any_error`, `rate_limit_only`, `timeout_only`, `server_error` |
| `max_retries` | `number` | Nie | `2` |  |

```json
{
  "id": "control_fallback_matrix_1",
  "type": "control.fallback_matrix",
  "position": [
    250,
    150
  ],
  "params": {
    "primary_provider": "<warto\u015b\u0107>",
    "fallback_provider": "<warto\u015b\u0107>",
    "trigger_on": "any_error",
    "max_retries": 2
  }
}
```

---

#### `control.dynamic_switch` — Dynamiczny Switch Router (Dynamic Switch)

Wielościeżkowy router ewaluujący warunki i kierujący przepływ do case_1, case_2, case_3 lub default.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `case_1` (main), `case_2` (main), `case_3` (main), `default` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `variable_path` | `string` | Nie | `status` | Pole z danych wejściowych np. intent, type, status |
| `case_1_value` | `string` | Nie | _brak_ |  |
| `case_2_value` | `string` | Nie | _brak_ |  |
| `case_3_value` | `string` | Nie | _brak_ |  |

```json
{
  "id": "control_dynamic_switch_1",
  "type": "control.dynamic_switch",
  "position": [
    250,
    150
  ],
  "params": {
    "variable_path": "status"
  }
}
```

---

#### `control.parallel_gate` — Bramka Zbieżności Równoległej (Parallel Gate)

Synchronizuje równoległe gałęzie (wait_all, wait_first, quorum) i scala ich wyniki.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `sync_mode` | `options` | Nie | `wait_all` | <br>_Dostępne opcje:_ `wait_all`, `wait_first`, `quorum` |
| `timeout_seconds` | `number` | Nie | `60` |  |
| `allow_partial_failures` | `boolean` | Nie | `True` |  |

```json
{
  "id": "control_parallel_gate_1",
  "type": "control.parallel_gate",
  "position": [
    250,
    150
  ],
  "params": {
    "sync_mode": "wait_all",
    "timeout_seconds": 60,
    "allow_partial_failures": true
  }
}
```

---

#### `control.loop_while` — Pętla Iteracyjna While (Loop While)

Wykonuje cykliczne powtórzenia z licznikiem i buforem akumulacyjnym.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `loop` (main), `done` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `condition_expr` | `string` | Nie | _brak_ |  |
| `max_iterations` | `number` | Nie | `50` |  |
| `break_on_error` | `boolean` | Nie | `True` |  |
| `accumulator_path` | `string` | Nie | `results` |  |

```json
{
  "id": "control_loop_while_1",
  "type": "control.loop_while",
  "position": [
    250,
    150
  ],
  "params": {
    "max_iterations": 50,
    "break_on_error": true,
    "accumulator_path": "results"
  }
}
```

---

#### `control.smart_router` — Semantyczny Smart Router (Smart AI Router)

Klasyfikuje intencję wejścia AI i kieruje do dedykowanych podprzepływów.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `photo_generation` (main), `photo_editing` (main), `text_and_copy` (main), `data_analysis` (main), `fallback` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `user_input_path` | `string` | Nie | `prompt` |  |
| `router_model` | `options` | Nie | `gemini-2.0-flash` | <br>_Dostępne opcje:_ `gpt-4o-mini`, `claude-3-5-haiku`, `gemini-2.0-flash` |
| `custom_context` | `string` | Nie | _brak_ |  |

```json
{
  "id": "control_smart_router_1",
  "type": "control.smart_router",
  "position": [
    250,
    150
  ],
  "params": {
    "user_input_path": "prompt",
    "router_model": "gemini-2.0-flash"
  }
}
```

---

#### `control.traffic_split` — A/B Traffic Splitter (Traffic Splitter (A/B))

Rozdziela ruch przepływu pomiędzy warianty (A/B/n) probabilistycznie lub ze spójnym hashowaniem użytkownika.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `variant_a` (main), `variant_b` (main), `variant_c` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `experiment_name` | `string` | Nie | `exp_v1` | Identyfikator eksperymentu A/B |
| `split_mode` | `options` | Nie | `sticky_hash` | Sticky hash gwarantuje, że ten sam użytkownik zawsze trafi do tego samego wariantu.<br>_Dostępne opcje:_ `sticky_hash`, `random` |
| `weight_a` | `number` | Nie | `50` |  |
| `weight_b` | `number` | Nie | `50` |  |
| `enable_variant_c` | `boolean` | Nie | `False` |  |
| `weight_c` | `number` | Nie | `0` |  |

```json
{
  "id": "control_traffic_split_1",
  "type": "control.traffic_split",
  "position": [
    250,
    150
  ],
  "params": {
    "experiment_name": "exp_v1",
    "split_mode": "sticky_hash",
    "weight_a": 50,
    "weight_b": 50
  }
}
```

---

## ✂️ FotoHub Shorts & Viral Reels (Rolki i Wirale) <a id="fotohub-shorts"></a>

> **Liczba węzłów:** 3 | **Identyfikator kategorii:** `fotohub.shorts`

Zoptymalizowane pod algorytmy TikToka, Instagram Reels i YouTube Shorts narzędzia do automatycznego wykrywania najciekawszych fragmentów długich nagrań, dodawania dynamicznych napisów karaoke oraz brandingu.

**Typowe zastosowanie produkcyjne:** Automatyczna konwersja 60-minutowego podcastu lub wywiadu na 5 wiralowych pionowych rolek 9:16 z napisami word-by-word i animowanym logo sponsora w 90 sekund.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `fotohub.shorts.clip_auto` | **AI Shorts Clipper & Virality**<br>_Shorts: AI Auto-Clipper_ | In: `main`<br>Out: `main, error` | `builtin` | 5 cr (~$0.0000) |
| `fotohub.shorts.subtitles_karaoke` | **Animowane Napisy Karaoke**<br>_Shorts: Karaoke Subtitles_ | In: `main`<br>Out: `main, error` | `builtin` | 2 cr (~$0.0000) |
| `fotohub.shorts.add_bumper` | **Brand Bumper & Canvas Fit**<br>_Shorts: Brand Bumper_ | In: `main`<br>Out: `main, error` | `builtin` | 1 cr (~$0.0000) |

### Szczegółowa Specyfikacja Węzłów (FotoHub Shorts & Viral Reels (Rolki i Wirale))

#### `fotohub.shorts.clip_auto` — AI Shorts Clipper & Virality (Shorts: AI Auto-Clipper)

Automatyczne cięcie długich nagrań na wiralowe Shorts/Reels z oceną retencji.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 5 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ | Link do pliku wideo lub nagrania źródłowego |
| `max_clips` | `number` | Nie | `3` |  |
| `aspect_ratio` | `options` | Nie | `9:16` | <br>_Dostępne opcje:_ `9:16`, `1:1`, `4:5`, `16:9` |
| `caption_style` | `options` | Nie | `hormozi` | <br>_Dostępne opcje:_ `hormozi`, `beasty`, `karaoke`, `neon`, `clean` (+1 innych) |
| `min_duration_s` | `number` | Nie | `15` |  |
| `max_duration_s` | `number` | Nie | `60` |  |

```json
{
  "id": "fotohub_shorts_clip_auto_1",
  "type": "fotohub.shorts.clip_auto",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "max_clips": 3,
    "aspect_ratio": "9:16",
    "caption_style": "hormozi"
  }
}
```

---

#### `fotohub.shorts.subtitles_karaoke` — Animowane Napisy Karaoke (Shorts: Karaoke Subtitles)

Generowanie dynamicznych, animowanych napisów word-by-word z emotikonami.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 2 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `style` | `options` | Nie | `hormozi` | <br>_Dostępne opcje:_ `hormozi`, `beasty`, `karaoke`, `neon`, `clean` (+1 innych) |
| `highlight_color` | `string` | Nie | `#facc15` |  |
| `words_per_line` | `number` | Nie | `3` |  |
| `add_emojis` | `boolean` | Nie | `True` |  |

```json
{
  "id": "fotohub_shorts_subtitles_karaoke_1",
  "type": "fotohub.shorts.subtitles_karaoke",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "style": "hormozi",
    "highlight_color": "#facc15",
    "words_per_line": 3
  }
}
```

---

#### `fotohub.shorts.add_bumper` — Brand Bumper & Canvas Fit (Shorts: Brand Bumper)

Wklejanie intra/outra marki, logo i dopasowanie formatu 9:16.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 1 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `bumper_type` | `options` | Nie | `outro` | <br>_Dostępne opcje:_ `intro`, `outro`, `both` |
| `brand_logo_url` | `string` | Nie | _brak_ | Opcjonalny plik PNG z przezroczystością |
| `cta_text` | `string` | Nie | `Sprawdź link w bio!` |  |
| `duration_s` | `number` | Nie | `3` |  |

```json
{
  "id": "fotohub_shorts_add_bumper_1",
  "type": "fotohub.shorts.add_bumper",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "bumper_type": "outro",
    "cta_text": "Sprawd\u017a link w bio!"
  }
}
```

---

## 🎭 FotoHub UGC Studio & Try-On (User Generated Content) <a id="fotohub-ugc"></a>

> **Liczba węzłów:** 3 | **Identyfikator kategorii:** `fotohub.ugc`

Generowanie autentycznych wideo recenzji z fotorealistycznymi aktorami UGC, synchronizacją ruchu warg (lip-sync), generatorami scenariuszy perswazyjnych oraz wirtualną przymierzalnią odzieży (VTO) na modelach ze zdjęć.

**Typowe zastosowanie produkcyjne:** Produkcja 50 wariantów wideo z rekomendacjami kosmetyków przez wirtualnych influencerów na TikToka bez konieczności angażowania studia nagraniowego.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `fotohub.ugc.script_generator` | **Generator Skryptu UGC**<br>_UGC: Script Generator_ | In: `main`<br>Out: `main, error` | `builtin` | 1 cr (~$0.0000) |
| `fotohub.ugc.actor_render` | **Render Aktora UGC**<br>_UGC: Render Actor_ | In: `main`<br>Out: `main, error` | `builtin` | 10 cr (~$0.0000) |
| `fotohub.ugc.product_tryon` | **Wirtualna Przymierzalnia (Try-On)**<br>_UGC: Virtual Try-On_ | In: `main`<br>Out: `main, error` | `builtin` | 4 cr (~$0.0000) |

### Szczegółowa Specyfikacja Węzłów (FotoHub UGC Studio & Try-On (User Generated Content))

#### `fotohub.ugc.script_generator` — Generator Skryptu UGC (UGC: Script Generator)

Tworzy scenariusz Hook-Problem-Solution-CTA na podstawie produktu.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 1 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `product_name` | `string` | Tak | _brak_ |  |
| `product_url` | `string` | Nie | _brak_ |  |
| `hook_style` | `options` | Nie | `curiosity` | <br>_Dostępne opcje:_ `curiosity`, `shock`, `question`, `before_after` |
| `target_audience` | `string` | Nie | `Kobiety i mężczyźni 18-35 zainteresowani nowościami` |  |
| `duration_target_s` | `number` | Nie | `30` |  |

```json
{
  "id": "fotohub_ugc_script_generator_1",
  "type": "fotohub.ugc.script_generator",
  "position": [
    250,
    150
  ],
  "params": {
    "product_name": "<warto\u015b\u0107>",
    "hook_style": "curiosity",
    "target_audience": "Kobiety i m\u0119\u017cczy\u017ani 18-35 zainteresowani nowo\u015bciami"
  }
}
```

---

#### `fotohub.ugc.actor_render` — Render Aktora UGC (UGC: Render Actor)

Fotorealistyczny influencer UGC z synchronizacją mimiki i ust.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 10 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `actor_id` | `options` | Nie | `emma` | <br>_Dostępne opcje:_ `emma`, `lucas`, `sophie`, `marcus`, `elena` |
| `script_text` | `string` | Tak | _brak_ |  |
| `product_image_url` | `string` | Nie | _brak_ |  |
| `camera_angle` | `options` | Nie | `selfie` | <br>_Dostępne opcje:_ `selfie`, `close_up`, `medium` |

```json
{
  "id": "fotohub_ugc_actor_render_1",
  "type": "fotohub.ugc.actor_render",
  "position": [
    250,
    150
  ],
  "params": {
    "actor_id": "emma",
    "script_text": "<warto\u015b\u0107>",
    "camera_angle": "selfie"
  }
}
```

---

#### `fotohub.ugc.product_tryon` — Wirtualna Przymierzalnia (Try-On) (UGC: Virtual Try-On)

Fotorealistyczne przeniesienie odzieży na postać / modela AI.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 4 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `person_image_url` | `string` | Tak | _brak_ |  |
| `clothing_image_url` | `string` | Tak | _brak_ |  |
| `category` | `options` | Nie | `tops` | <br>_Dostępne opcje:_ `tops`, `bottoms`, `one_piece`, `accessories` |
| `denoise_steps` | `number` | Nie | `30` |  |

```json
{
  "id": "fotohub_ugc_product_tryon_1",
  "type": "fotohub.ugc.product_tryon",
  "position": [
    250,
    150
  ],
  "params": {
    "person_image_url": "<warto\u015b\u0107>",
    "clothing_image_url": "<warto\u015b\u0107>",
    "category": "tops",
    "denoise_steps": 30
  }
}
```

---

## ✨ FotoHub Creative Studio (E-Commerce Studio) <a id="fotohub-creative"></a>

> **Liczba węzłów:** 1 | **Identyfikator kategorii:** `fotohub.creative`

Usuwanie surowego tła z fotografii produktowych i generowanie fotorealistycznych scen reklamowych 3D z profesjonalnym, fizycznie poprawnym oświetleniem studyjnym i cieniami.

**Typowe zastosowanie produkcyjne:** Przekształcanie zdjęcia butelki perfum zrobionego telefonem w luksusowy billboard na marmurowym postumencie o wschodzie słońca.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `fotohub.creative.product_mockup` | **E-Commerce Studio Mockup**<br>_Studio Product Mockup_ | In: `main`<br>Out: `main, error` | `builtin` | 3 cr (~$0.0000) |

### Szczegółowa Specyfikacja Węzłów (FotoHub Creative Studio (E-Commerce Studio))

#### `fotohub.creative.product_mockup` — E-Commerce Studio Mockup (Studio Product Mockup)

Generowanie sceny studyjnej produktu z fotorealistycznymi cieniami.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 3 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `product_image_url` | `string` | Tak | _brak_ |  |
| `scene_theme` | `options` | Nie | `minimalist_studio` | <br>_Dostępne opcje:_ `minimalist_studio`, `luxury_marble`, `outdoor_nature`, `cyber_neon`, `cozy_wood` |
| `custom_prompt` | `string` | Nie | _brak_ |  |
| `shadow_intensity` | `number` | Nie | `0.75` |  |

```json
{
  "id": "fotohub_creative_product_mockup_1",
  "type": "fotohub.creative.product_mockup",
  "position": [
    250,
    150
  ],
  "params": {
    "product_image_url": "<warto\u015b\u0107>",
    "scene_theme": "minimalist_studio",
    "shadow_intensity": 0.75
  }
}
```

---

## 💡 Creative Studio & Styling (Aranżacja Produktowa) <a id="creative"></a>

> **Liczba węzłów:** 1 | **Identyfikator kategorii:** `creative`

Zaawansowane generowanie aranżacji packshotowych i studyjnych dla branży fashion, kosmetyków i elektroniki użytkowej.

**Typowe zastosowanie produkcyjne:** Automatyczne przygotowanie katalogu e-commerce z ujednoliconą scenerią i kątem padania cieni dla 500 produktów.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `ai.vision_analyzer` | **Głęboki Analizator Wizyjny AI**<br>_AI Vision Analyzer_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |

### Szczegółowa Specyfikacja Węzłów (Creative Studio & Styling (Aranżacja Produktowa))

#### `ai.vision_analyzer` — Głęboki Analizator Wizyjny AI (AI Vision Analyzer)

Analizuje estetykę, paletę barw, OCR i obiekty na obrazie.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `extract_color_palette` | `boolean` | Nie | `True` |  |
| `score_aesthetic` | `boolean` | Nie | `True` |  |
| `extract_ocr_text` | `boolean` | Nie | `True` |  |

```json
{
  "id": "ai_vision_analyzer_1",
  "type": "ai.vision_analyzer",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "extract_color_palette": true,
    "score_aesthetic": true,
    "extract_ocr_text": true
  }
}
```

---

## 🎨 FotoHub AI Image Processing (Grafika & Obraz) <a id="fotohub-image"></a>

> **Liczba węzłów:** 19 | **Identyfikator kategorii:** `fotohub.image`

Kompletny zestaw 19 operacji na obrazie: generowanie w modelach SOTA (Flux, Midjourney v6, SD3), inteligentny smart-crop z detekcją twarzy, usuwanie tła alpha-matting, skalowanie 8K, inpainting, face-swap i korekcja barwna.

**Typowe zastosowanie produkcyjne:** Automatyczna taśma produkcyjna dla agencji foto: generowanie tła, dopasowanie oświetlenia, retusz skóry modela i eksport w rozdzielczości do druku wielkoformatowego.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `fotohub.gallery.save` | **Dodaj do galerii FOTOhub**<br>_FotoHub Gallery: Save_ | In: `main`<br>Out: `main` | `builtin` | free |
| `fotohub.image.generate` | **Generuj Obraz AI**<br>_Generate Image_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.upscale` | **Powiększ Obraz (Upscale)**<br>_Upscale Image_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.remove_bg` | **Usuń Tło**<br>_Remove Background_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.face_swap` | **Zamiana Twarzy (Face Swap)**<br>_Face Swap_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |
| `fotohub.image.colorize` | **Koloryzacja (B&W)**<br>_Colorize (B&W)_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.style_transfer` | **Transfer Stylu**<br>_Style Transfer_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.inpaint` | **Wypełnij Maskę (Inpaint)**<br>_Inpaint_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.outpaint` | **Rozszerz Kadr (Outpaint)**<br>_Outpaint_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.face_restore` | **Naprawa Twarzy**<br>_Restore Face_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.denoise` | **Usuń Szum (Denoise)**<br>_Denoise_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.auto_enhance` | **Automatyczne Ulepszenie**<br>_Auto-Enhance_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.color_grade` | **Grading Kolorów**<br>_Color Grade_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.filter` | **Filter**<br>_Filter_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.image.resize` | **Resize**<br>_Resize_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.image.smart_crop` | **Smart Crop**<br>_Smart Crop_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.watermark` | **Watermark**<br>_Watermark_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.image.generate_bg` | **Generate Background**<br>_Generate Background_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.image.deepfake` | **Deepfake Video**<br>_Deepfake Video_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |

### Szczegółowa Specyfikacja Węzłów (FotoHub AI Image Processing (Grafika & Obraz))

#### `fotohub.gallery.save` — Dodaj do galerii FOTOhub (FotoHub Gallery: Save)

Zapisuje wygenerowany lub przekształcony obraz bezpośrednio do Twojej galerii zdjęć FOTOhub.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Nie | _brak_ |  |
| `visibility` | `options` | Nie | `private` | <br>_Dostępne opcje:_ `private`, `public`, `unlisted` |
| `image_url` | `string` | Nie | _brak_ |  |

```json
{
  "id": "fotohub_gallery_save_1",
  "type": "fotohub.gallery.save",
  "position": [
    250,
    150
  ],
  "params": {
    "visibility": "private"
  }
}
```

---

#### `fotohub.image.generate` — Generuj Obraz AI (Generate Image)

Twórz nowe obrazy z tekstu lub zdjęcia referencyjnego przy użyciu dowolnego modelu FOTOhub (Seedream, GPT Image, FLUX, Nano Banana).

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/generate`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Tak | `dola-seedream-5-0-pro-260628` | <br>_Dostępne opcje:_ `dola-seedream-5-0-pro-260628`, `seedream-5-0-260128`, `seedream-4-5-251128`, `seedream-4-0-250828`, `gpt-image-2` (+34 innych) |
| `prompt` | `string` | Tak | _brak_ |  |
| `reference_image_url` | `string` | Nie | _brak_ |  |
| `aspect_ratio` | `options` | Nie | `1:1` | <br>_Dostępne opcje:_ `1:1`, `16:9`, `9:16`, `4:3`, `3:4` (+3 innych) |
| `count` | `number` | Nie | `1` |  |
| `` | `collapsible` | Nie | _brak_ | Advanced |

```json
{
  "id": "fotohub_image_generate_1",
  "type": "fotohub.image.generate",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "dola-seedream-5-0-pro-260628",
    "prompt": "<warto\u015b\u0107>",
    "aspect_ratio": "1:1"
  }
}
```

---

#### `fotohub.image.upscale` — Powiększ Obraz (Upscale) (Upscale Image)

Zwiększ rozdzielczość 2× lub 4× z modelem Real-ESRGAN zachowując ostrość.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/upscale`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `scale` | `options` | Nie | `2` | <br>_Dostępne opcje:_ `2`, `4` |

```json
{
  "id": "fotohub_image_upscale_1",
  "type": "fotohub.image.upscale",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "scale": "2"
  }
}
```

---

#### `fotohub.image.remove_bg` — Usuń Tło (Remove Background)

Precyzyjnie wytnij obiekt ze zdjęcia usuwając tło (ISNet / rembg).

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/remove-bg`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `model` | `options` | Nie | `isnet-general-use` | <br>_Dostępne opcje:_ `isnet-general-use`, `u2net`, `silueta` |

```json
{
  "id": "fotohub_image_remove_bg_1",
  "type": "fotohub.image.remove_bg",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "model": "isnet-general-use"
  }
}
```

---

#### `fotohub.image.face_swap` — Zamiana Twarzy (Face Swap) (Face Swap)

Wstaw twarz ze zdjęcia źródłowego na zdjęcie docelowe.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `source_url` | `string` | Tak | _brak_ |  |
| `target_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_face_swap_1",
  "type": "fotohub.image.face_swap",
  "position": [
    250,
    150
  ],
  "params": {
    "source_url": "<warto\u015b\u0107>",
    "target_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.image.colorize` — Koloryzacja (B&W) (Colorize (B&W))

Dodaj realistyczne kolory do czarno-białych fotografii.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/colorize`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_colorize_1",
  "type": "fotohub.image.colorize",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.image.style_transfer` — Transfer Stylu (Style Transfer)

Nadaj zdjęciu artystyczny styl innego obrazu.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/generate`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `style_prompt` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_style_transfer_1",
  "type": "fotohub.image.style_transfer",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "style_prompt": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.image.inpaint` — Wypełnij Maskę (Inpaint) (Inpaint)

Zastąp zaznaczony maską fragment nową zawartością wygenerowaną przez AI.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/inpaint`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `mask_url` | `string` | Tak | _brak_ |  |
| `prompt` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_inpaint_1",
  "type": "fotohub.image.inpaint",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "mask_url": "<warto\u015b\u0107>",
    "prompt": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.image.outpaint` — Rozszerz Kadr (Outpaint) (Outpaint)

Rozszerz kadr obrazu poza jego pierwotne granice.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/outpaint`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `direction` | `options` | Nie | `all` | <br>_Dostępne opcje:_ `left`, `right`, `up`, `down`, `all` |
| `pixels` | `number` | Nie | `256` |  |

```json
{
  "id": "fotohub_image_outpaint_1",
  "type": "fotohub.image.outpaint",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "direction": "all",
    "pixels": 256
  }
}
```

---

#### `fotohub.image.face_restore` — Naprawa Twarzy (Restore Face)

Zrekonstruuj detale i wyostrz twarze (GFPGAN) ze starych lub rozmytych zdjęć.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/face-restore`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_face_restore_1",
  "type": "fotohub.image.face_restore",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.image.denoise` — Usuń Szum (Denoise) (Denoise)

Usuń ziarno i szum matrycy zachowując kluczowe detale.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/denoise`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `strength` | `number` | Nie | `50` |  |

```json
{
  "id": "fotohub_image_denoise_1",
  "type": "fotohub.image.denoise",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "strength": 50
  }
}
```

---

#### `fotohub.image.auto_enhance` — Automatyczne Ulepszenie (Auto-Enhance)

Jedno-klikowe ulepszenie ekspozycji, ostrości i dynamiki barw.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/auto-enhance`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_auto_enhance_1",
  "type": "fotohub.image.auto_enhance",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.image.color_grade` — Grading Kolorów (Color Grade)

Zastosuj kinowy profil barwny lub tablicę LUT.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/color-grade`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `preset` | `options` | Nie | `cinematic` | <br>_Dostępne opcje:_ `natural`, `cinematic`, `warm`, `cool`, `vintage` (+4 innych) |
| `intensity` | `number` | Nie | `60` |  |

```json
{
  "id": "fotohub_image_color_grade_1",
  "type": "fotohub.image.color_grade",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "preset": "cinematic",
    "intensity": 60
  }
}
```

---

#### `fotohub.image.filter` — Filter (Filter)

Apply one of 9 classic filters.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/filter`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `filter` | `options` | Nie | `sharpen` | <br>_Dostępne opcje:_ `grayscale`, `sepia`, `invert`, `blur`, `sharpen` (+4 innych) |
| `strength` | `number` | Nie | `50` |  |

```json
{
  "id": "fotohub_image_filter_1",
  "type": "fotohub.image.filter",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "filter": "sharpen",
    "strength": 50
  }
}
```

---

#### `fotohub.image.resize` — Resize (Resize)

Change an image's dimensions (with optional aspect lock).

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/resize`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `width` | `number` | Tak | _brak_ |  |
| `height` | `number` | Nie | _brak_ |  |
| `mode` | `options` | Nie | `fit` | <br>_Dostępne opcje:_ `fit`, `fill`, `stretch`, `crop` |

```json
{
  "id": "fotohub_image_resize_1",
  "type": "fotohub.image.resize",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "width": "<warto\u015b\u0107>",
    "mode": "fit"
  }
}
```

---

#### `fotohub.image.smart_crop` — Smart Crop (Smart Crop)

Crop to a target aspect keeping the most important content.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/smart-crop`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `aspect` | `options` | Nie | `1:1` | <br>_Dostępne opcje:_ `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |

```json
{
  "id": "fotohub_image_smart_crop_1",
  "type": "fotohub.image.smart_crop",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "aspect": "1:1"
  }
}
```

---

#### `fotohub.image.watermark` — Watermark (Watermark)

Add text or image watermark.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/watermark`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `text` | `string` | Nie | `© FOTOhub` |  |
| `position` | `options` | Nie | `bottom-right` | <br>_Dostępne opcje:_ `top-left`, `top-right`, `bottom-left`, `bottom-right`, `center` |
| `opacity` | `number` | Nie | `70` |  |

```json
{
  "id": "fotohub_image_watermark_1",
  "type": "fotohub.image.watermark",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "text": "\u00a9 FOTOhub",
    "position": "bottom-right",
    "opacity": 70
  }
}
```

---

#### `fotohub.image.generate_bg` — Generate Background (Generate Background)

Composite a subject onto a freshly generated AI background.

- **Executor:** `http`
- **Microservice:** `image-engine` (ścieżka: `/api/generate-bg`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `bg_prompt` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_generate_bg_1",
  "type": "fotohub.image.generate_bg",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "bg_prompt": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.image.deepfake` — Deepfake Video (Deepfake Video)

Advanced multi-frame face swap for video (opt-in watermarking + audit log).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `STARTER`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `source_face_url` | `string` | Tak | _brak_ |  |
| `target_video_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_image_deepfake_1",
  "type": "fotohub.image.deepfake",
  "position": [
    250,
    150
  ],
  "params": {
    "source_face_url": "<warto\u015b\u0107>",
    "target_video_url": "<warto\u015b\u0107>"
  }
}
```

---

## 🎬 FotoHub AI Video Generation (Wideo & Animacja) <a id="fotohub-video"></a>

> **Liczba węzłów:** 12 | **Identyfikator kategorii:** `fotohub.video`

Potężny silnik wideo: generowanie sekwencji wideo z tekstu i obrazów, stabilizacja żyroskopowa, łączenie klipów, wydłużanie czasu trwania, renderowanie osi czasu NLE i kompresja do formatów social media.

**Typowe zastosowanie produkcyjne:** Automatyczne tworzenie dynamicznych teaserów wideo do kampanii reklamowych zsynchronizowanych z tempem muzyki.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `fotohub.video.generate` | **Generuj Wideo AI**<br>_Generate Video_ | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.animate_image` | **Animuj Obraz**<br>_Animate Image_ | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.transcribe` | **Transkrypcja Wideo**<br>_Transcribe Video_ | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.video.render_timeline` | **Renderuj Oś Czasu**<br>_Render Timeline_ | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.transcode` | **Transkodowanie**<br>_Transcode_ | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.trim` | **Przytnij Wideo**<br>_Trim_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.video.merge` | **Połącz Klipy Wideo**<br>_Merge Videos_ | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.extract_audio` | **Wyodrębnij Audio**<br>_Extract Audio_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.video.extract_frames` | **Wyciągnij Klatki**<br>_Extract Frames_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.video.stabilize` | **Stabilizacja Wideo**<br>_Stabilize_ | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.compress` | **Kompresja Wideo**<br>_Compress_ | In: `main`<br>Out: `main, error` | `http` | per_second |
| `fotohub.video.summarize` | **Podsumuj Wideo**<br>_Summarize Video_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_minute |

### Szczegółowa Specyfikacja Węzłów (FotoHub AI Video Generation (Wideo & Animacja))

#### `fotohub.video.generate` — Generuj Wideo AI (Generate Video)

Generuj wideo z tekstu lub klatki startowej (Sora, Veo, Kling, Seedance, Wan, Hailuo).

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/generate`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_second

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Tak | `sora-2-azure` | <br>_Dostępne opcje:_ `sora-2-pro`, `sora-2-azure`, `veo-3.1-generate-001`, `veo-3.1-fast-generate-001`, `kling-v3` (+20 innych) |
| `prompt` | `string` | Tak | _brak_ |  |
| `first_frame_url` | `string` | Nie | _brak_ |  |
| `last_frame_url` | `string` | Nie | _brak_ |  |
| `duration_s` | `number` | Nie | `5` |  |
| `aspect_ratio` | `options` | Nie | `16:9` | <br>_Dostępne opcje:_ `16:9`, `9:16`, `1:1` |
| `resolution` | `options` | Nie | `720p` | <br>_Dostępne opcje:_ `720p`, `1080p`, `4k` |
| `generate_audio` | `options` | Nie | `true` | <br>_Dostępne opcje:_ `true`, `false` |

```json
{
  "id": "fotohub_video_generate_1",
  "type": "fotohub.video.generate",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "sora-2-azure",
    "prompt": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.video.animate_image` — Animuj Obraz (Animate Image)

Przekształć statyczny obraz w dynamiczny klip wideo.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/generate`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_second

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `motion_prompt` | `string` | Nie | `subtle natural motion` |  |
| `duration_s` | `number` | Nie | `4` |  |

```json
{
  "id": "fotohub_video_animate_image_1",
  "type": "fotohub.video.animate_image",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "motion_prompt": "subtle natural motion",
    "duration_s": 4
  }
}
```

---

#### `fotohub.video.transcribe` — Transkrypcja Wideo (Transcribe Video)

Ekstrakcja napisów i tekstu z mowy (Whisper / chatterbox).

- **Executor:** `http`
- **Microservice:** `chatterbox` (ścieżka: `/transcribe`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `language` | `options` | Nie | `auto` | <br>_Dostępne opcje:_ `auto`, `en`, `pl`, `de`, `es` (+3 innych) |

```json
{
  "id": "fotohub_video_transcribe_1",
  "type": "fotohub.video.transcribe",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "language": "auto"
  }
}
```

---

#### `fotohub.video.render_timeline` — Renderuj Oś Czasu (Render Timeline)

Wyrenderuj pełny wielościeżkowy projekt wideo (klipy, dźwięk, napisy, efekty).

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/render`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_second

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `project_json` | `string` | Tak | _brak_ | Full video-engine timeline spec. |
| `format` | `options` | Nie | `mp4` | <br>_Dostępne opcje:_ `mp4`, `webm`, `mov` |
| `quality` | `options` | Nie | `1080p` | <br>_Dostępne opcje:_ `1080p`, `720p`, `480p`, `4k` |

```json
{
  "id": "fotohub_video_render_timeline_1",
  "type": "fotohub.video.render_timeline",
  "position": [
    250,
    150
  ],
  "params": {
    "project_json": "<warto\u015b\u0107>",
    "format": "mp4",
    "quality": "1080p"
  }
}
```

---

#### `fotohub.video.transcode` — Transkodowanie (Transcode)

Konwertuj wideo na inny format, kodek lub rozdzielczość.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/transcode`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_second

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `format` | `options` | Nie | `mp4` | <br>_Dostępne opcje:_ `mp4`, `webm`, `mov`, `gif` |
| `quality` | `options` | Nie | `720p` | <br>_Dostępne opcje:_ `1080p`, `720p`, `480p` |

```json
{
  "id": "fotohub_video_transcode_1",
  "type": "fotohub.video.transcode",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "format": "mp4",
    "quality": "720p"
  }
}
```

---

#### `fotohub.video.trim` — Przytnij Wideo (Trim)

Przytnij wideo do zadanego przedziału czasowego.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/trim`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `start_s` | `number` | Nie | `0` |  |
| `end_s` | `number` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_video_trim_1",
  "type": "fotohub.video.trim",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "start_s": 0,
    "end_s": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.video.merge` — Połącz Klipy Wideo (Merge Videos)

Połącz wiele klipów w jedno płynne wideo.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/merge`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_second

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `urls_json` | `string` | Tak | _brak_ |  |
| `transition` | `options` | Nie | `none` | <br>_Dostępne opcje:_ `none`, `fade`, `dissolve` |

```json
{
  "id": "fotohub_video_merge_1",
  "type": "fotohub.video.merge",
  "position": [
    250,
    150
  ],
  "params": {
    "urls_json": "<warto\u015b\u0107>",
    "transition": "none"
  }
}
```

---

#### `fotohub.video.extract_audio` — Wyodrębnij Audio (Extract Audio)

Zgraj ścieżkę dźwiękową z wideo jako plik MP3.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/extract-audio`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_video_extract_audio_1",
  "type": "fotohub.video.extract_audio",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.video.extract_frames` — Wyciągnij Klatki (Extract Frames)

Pobierz klatki z wideo w równych odstępach czasowych.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/extract-frames`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `count` | `number` | Nie | `10` |  |

```json
{
  "id": "fotohub_video_extract_frames_1",
  "type": "fotohub.video.extract_frames",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "count": 10
  }
}
```

---

#### `fotohub.video.stabilize` — Stabilizacja Wideo (Stabilize)

Zredukuje drgania kamery i ustabilizuje ruch.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/stabilize`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_second

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `strength` | `number` | Nie | `50` |  |

```json
{
  "id": "fotohub_video_stabilize_1",
  "type": "fotohub.video.stabilize",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "strength": 50
  }
}
```

---

#### `fotohub.video.compress` — Kompresja Wideo (Compress)

Zmniejsz rozmiar pliku z zachowaniem optymalnej jakości.

- **Executor:** `http`
- **Microservice:** `video-engine` (ścieżka: `/compress`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_second

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `target_size_mb` | `number` | Nie | `25` |  |

```json
{
  "id": "fotohub_video_compress_1",
  "type": "fotohub.video.compress",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "target_size_mb": 25
  }
}
```

---

#### `fotohub.video.summarize` — Podsumuj Wideo (Summarize Video)

Wygeneruj tekstowe podsumowanie zawartości wideo.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `max_words` | `number` | Nie | `120` |  |

```json
{
  "id": "fotohub_video_summarize_1",
  "type": "fotohub.video.summarize",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "max_words": 120
  }
}
```

---

## 🎵 FotoHub Audio, Voice & Music (Dźwięk, Muzyka, SFX) <a id="fotohub-audio"></a>

> **Liczba węzłów:** 14 | **Identyfikator kategorii:** `fotohub.audio`

Synteza mowy w 100+ językach z naturalną ekspresją, generowanie pełnych utworów muzycznych, efektów dźwiękowych SFX, profesjonalny mastering LUFS, separacja stemów i klonowanie barwy głosu.

**Typowe zastosowanie produkcyjne:** Generowanie lektora w języku polskim, skomponowanie dedykowanego podkładu muzycznego w stylu lofi i zmasterowanie całości do standardów Spotify i YouTube.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `fotohub.audio.generate_voice` | **Generuj Głos (TTS)**<br>_Generate Voice_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_characters |
| `fotohub.audio.generate_music` | **Generuj Muzykę AI**<br>_Generate Music_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.audio.generate_sfx` | **Generuj Efekty (SFX)**<br>_Generate Sound Effects (SFX)_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |
| `fotohub.audio.mastering` | **Mastering Audio**<br>_Audio Mastering_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.audio.dubbing` | **AI Dubbing**<br>_AI Dubbing_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_minute |
| `fotohub.audio.transcribe` | **Transkrypcja Audio**<br>_Transcribe Audio_ | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.audio.speech_to_speech` | **Speech to Speech AI**<br>_Audio: Speech-to-Speech_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_minute |
| `fotohub.audio.voice_clone` | **Klonowanie Głosu**<br>_Voice Clone_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_characters |
| `fotohub.audio.mix` | **Miksowanie Ścieżek**<br>_Mix Tracks_ | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.audio.apply_effect` | **Zastosuj Efekt Audio**<br>_Apply Effect_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.audio.normalize` | **Normalizacja Głośności**<br>_Normalize Loudness_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.audio.separate_stems` | **Separacja Ścieżek (Stems)**<br>_Separate Stems_ | In: `main`<br>Out: `main, error` | `http` | per_minute |
| `fotohub.audio.trim` | **Przytnij Audio**<br>_Trim Audio_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.audio.merge` | **Połącz Pliki Audio**<br>_Merge Audio_ | In: `main`<br>Out: `main, error` | `http` | free |

### Szczegółowa Specyfikacja Węzłów (FotoHub Audio, Voice & Music (Dźwięk, Muzyka, SFX))

#### `fotohub.audio.generate_voice` — Generuj Głos (TTS) (Generate Voice)

Synteza mowy lektora za pomocą ElevenLabs, Google TTS lub OpenAI TTS HD.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_characters

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Tak | `elevenlabs` | <br>_Dostępne opcje:_ `elevenlabs`, `google-tts`, `openai-tts`, `bark` |
| `text` | `string` | Tak | _brak_ |  |
| `voice_id` | `options` | Nie | `ola-pl` | <br>_Dostępne opcje:_ `rachel`, `adam`, `ola-pl`, `jakub-pl`, `bella` (+4 innych) |
| `language` | `options` | Nie | `pl` | <br>_Dostępne opcje:_ `pl`, `en`, `de`, `es`, `fr` (+1 innych) |
| `speed` | `number` | Nie | `1.0` |  |
| `stability` | `number` | Nie | `0.5` |  |

```json
{
  "id": "fotohub_audio_generate_voice_1",
  "type": "fotohub.audio.generate_voice",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "elevenlabs",
    "text": "<warto\u015b\u0107>",
    "voice_id": "ola-pl",
    "language": "pl"
  }
}
```

---

#### `fotohub.audio.generate_music` — Generuj Muzykę AI (Generate Music)

Twórz autorskie utwory muzyczne za pomocą Suno AI, Udio lub Stable Audio.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/generate`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Tak | `suno-ai` | <br>_Dostępne opcje:_ `suno-ai`, `udio`, `stable-audio-2`, `musicgen` |
| `prompt` | `string` | Tak | _brak_ |  |
| `genre` | `options` | Nie | `electronic` | <br>_Dostępne opcje:_ `electronic`, `hip-hop`, `pop`, `rock`, `classical` (+6 innych) |
| `mood` | `options` | Nie | `energetic` | <br>_Dostępne opcje:_ `energetic`, `calm`, `epic`, `happy`, `dark` (+4 innych) |
| `duration_s` | `number` | Nie | `30` |  |
| `instrumental` | `options` | Nie | `true` | <br>_Dostępne opcje:_ `true`, `false` |

```json
{
  "id": "fotohub_audio_generate_music_1",
  "type": "fotohub.audio.generate_music",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "suno-ai",
    "prompt": "<warto\u015b\u0107>",
    "genre": "electronic",
    "mood": "energetic"
  }
}
```

---

#### `fotohub.audio.generate_sfx` — Generuj Efekty (SFX) (Generate Sound Effects (SFX))

Twórz niestandardowe efekty dźwiękowe z promptu tekstowego.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `prompt` | `string` | Tak | _brak_ |  |
| `category` | `options` | Nie | `cinematic` | <br>_Dostępne opcje:_ `nature`, `urban`, `mechanical`, `digital`, `cinematic` (+1 innych) |
| `duration_s` | `number` | Nie | `3` |  |

```json
{
  "id": "fotohub_audio_generate_sfx_1",
  "type": "fotohub.audio.generate_sfx",
  "position": [
    250,
    150
  ],
  "params": {
    "prompt": "<warto\u015b\u0107>",
    "category": "cinematic",
    "duration_s": 3
  }
}
```

---

#### `fotohub.audio.mastering` — Mastering Audio (Audio Mastering)

Profesjonalny mastering dźwięku AI z korekcją i limiterem.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/master`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |
| `preset` | `options` | Nie | `punchy` | <br>_Dostępne opcje:_ `punchy`, `warm`, `club`, `podcast`, `cinematic` |
| `target_lufs` | `number` | Nie | `-14` |  |

```json
{
  "id": "fotohub_audio_mastering_1",
  "type": "fotohub.audio.mastering",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>",
    "preset": "punchy",
    "target_lufs": -14
  }
}
```

---

#### `fotohub.audio.dubbing` — AI Dubbing (AI Dubbing)

Przetłumacz i zdubbinguj mowę na inny język z zachowaniem głosu.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |
| `target_language` | `options` | Nie | `en` | <br>_Dostępne opcje:_ `en`, `pl`, `de`, `es`, `fr` (+2 innych) |
| `num_speakers` | `number` | Nie | `1` |  |

```json
{
  "id": "fotohub_audio_dubbing_1",
  "type": "fotohub.audio.dubbing",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>",
    "target_language": "en",
    "num_speakers": 1
  }
}
```

---

#### `fotohub.audio.transcribe` — Transkrypcja Audio (Transcribe Audio)

Konwersja mowy na tekst z dokładnymi znacznikami czasu.

- **Executor:** `http`
- **Microservice:** `chatterbox` (ścieżka: `/transcribe`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |
| `language` | `options` | Nie | `auto` | <br>_Dostępne opcje:_ `auto`, `en`, `pl`, `de`, `es` |

```json
{
  "id": "fotohub_audio_transcribe_1",
  "type": "fotohub.audio.transcribe",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>",
    "language": "auto"
  }
}
```

---

#### `fotohub.audio.speech_to_speech` — Speech to Speech AI (Audio: Speech-to-Speech)

Przekształć głos lektora w inny model głosu zachowując emocje i intonację.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |
| `target_voice` | `options` | Nie | `ola-pl` | <br>_Dostępne opcje:_ `rachel`, `adam`, `ola-pl`, `jakub-pl`, `bella` (+4 innych) |
| `preserve_emotion` | `options` | Nie | `true` | <br>_Dostępne opcje:_ `true`, `false` |
| `remove_background` | `options` | Nie | `true` | <br>_Dostępne opcje:_ `true`, `false` |

```json
{
  "id": "fotohub_audio_speech_to_speech_1",
  "type": "fotohub.audio.speech_to_speech",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>",
    "target_voice": "ola-pl",
    "preserve_emotion": "true",
    "remove_background": "true"
  }
}
```

---

#### `fotohub.audio.voice_clone` — Klonowanie Głosu (Voice Clone)

Sklonuj głos lektora z próbki referencyjnej i generuj nowe wypowiedzi.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `STARTER`
- **Koszt operacji:** per_characters

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `reference_url` | `string` | Tak | _brak_ | 5-30s of clean speech. |
| `text` | `string` | Tak | _brak_ |  |
| `language` | `options` | Nie | `en` | <br>_Dostępne opcje:_ `en`, `pl`, `de`, `es`, `fr` |

```json
{
  "id": "fotohub_audio_voice_clone_1",
  "type": "fotohub.audio.voice_clone",
  "position": [
    250,
    150
  ],
  "params": {
    "reference_url": "<warto\u015b\u0107>",
    "text": "<warto\u015b\u0107>",
    "language": "en"
  }
}
```

---

#### `fotohub.audio.mix` — Miksowanie Ścieżek (Mix Tracks)

Połącz wiele ścieżek audio z niezależną głośnością i panoramą.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/render`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `tracks_json` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_audio_mix_1",
  "type": "fotohub.audio.mix",
  "position": [
    250,
    150
  ],
  "params": {
    "tracks_json": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.audio.apply_effect` — Zastosuj Efekt Audio (Apply Effect)

Nałóż pogłos, echo, korekcję EQ lub kompresję na dźwięk.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/effect`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |
| `effect` | `options` | Nie | `reverb` | <br>_Dostępne opcje:_ `reverb`, `echo`, `compression`, `eq_bright`, `eq_warm` (+3 innych) |
| `intensity` | `number` | Nie | `50` |  |

```json
{
  "id": "fotohub_audio_apply_effect_1",
  "type": "fotohub.audio.apply_effect",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>",
    "effect": "reverb",
    "intensity": 50
  }
}
```

---

#### `fotohub.audio.normalize` — Normalizacja Głośności (Normalize Loudness)

Normalizacja głośności wg standardu EBU R128.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/normalize`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |
| `target_lufs` | `number` | Nie | `-16` | −16 LUFS for podcasts, −14 for streaming |

```json
{
  "id": "fotohub_audio_normalize_1",
  "type": "fotohub.audio.normalize",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>",
    "target_lufs": -16
  }
}
```

---

#### `fotohub.audio.separate_stems` — Separacja Ścieżek (Stems) (Separate Stems)

Rozdziel utwór na wokal, perkusję, bas i instrumenty.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/stems`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_audio_separate_stems_1",
  "type": "fotohub.audio.separate_stems",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.audio.trim` — Przytnij Audio (Trim Audio)

Wytnij fragment nagrania audio.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/trim`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `audio_url` | `string` | Tak | _brak_ |  |
| `start_s` | `number` | Nie | `0` |  |
| `end_s` | `number` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_audio_trim_1",
  "type": "fotohub.audio.trim",
  "position": [
    250,
    150
  ],
  "params": {
    "audio_url": "<warto\u015b\u0107>",
    "start_s": 0,
    "end_s": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.audio.merge` — Połącz Pliki Audio (Merge Audio)

Połącz wiele nagrań audio w jeden plik.

- **Executor:** `http`
- **Microservice:** `music-server` (ścieżka: `/merge`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `urls_json` | `string` | Tak | _brak_ |  |
| `crossfade_ms` | `number` | Nie | `0` |  |

```json
{
  "id": "fotohub_audio_merge_1",
  "type": "fotohub.audio.merge",
  "position": [
    250,
    150
  ],
  "params": {
    "urls_json": "<warto\u015b\u0107>",
    "crossfade_ms": 0
  }
}
```

---

## 🎙️ Real-Time Voice & Streaming Audio (Głos w Czasie Rzeczywistym) <a id="voice"></a>

> **Liczba węzłów:** 3 | **Identyfikator kategorii:** `voice`

Dwukierunkowa, konwersacyjna komunikacja głosowa na żywo z ultraniskim opóźnieniem (<300ms), detekcją przerywania (VAD) i strumieniową syntezą WebSocket.

**Typowe zastosowanie produkcyjne:** Głosowy asystent infolinii fotograficznej przyjmujący zamówienia i doradzający w doborze sesji zdjęciowej przez telefon.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `voice.conversation` | **Rozmowa głosowa**<br>_Voice: Start Conversation_ | In: `main`<br>Out: `main, error` | `builtin` | per_minute |
| `voice.end_call` | **Zakończ rozmowę**<br>_Zakończ rozmowę_ | In: `main`<br>Out: `main` | `builtin` | free |
| `voice.detect_language` | **Wykryj język**<br>_Wykryj język_ | In: `main`<br>Out: `main, error` | `builtin` | free |

### Szczegółowa Specyfikacja Węzłów (Real-Time Voice & Streaming Audio (Głos w Czasie Rzeczywistym))

#### `voice.conversation` — Rozmowa głosowa (Voice: Start Conversation)

Start pętli rozmowy głosowej (IDA Voice/ElevenLabs).

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `first_message` | `string` | Nie | _brak_ |  |
| `voice_id` | `string` | Nie | _brak_ |  |
| `language` | `options` | Nie | `auto` | <br>_Dostępne opcje:_ `auto`, `pl`, `en`, `de`, `es` (+1 innych) |

```json
{
  "id": "voice_conversation_1",
  "type": "voice.conversation",
  "position": [
    250,
    150
  ],
  "params": {
    "language": "auto"
  }
}
```

---

#### `voice.end_call` — Zakończ rozmowę (Zakończ rozmowę)

Zamyka bieżącą rozmowę głosową.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

```json
{
  "id": "voice_end_call_1",
  "type": "voice.end_call",
  "position": [
    250,
    150
  ],
  "params": {}
}
```

---

#### `voice.detect_language` — Wykryj język (Wykryj język)

Automatycznie wykrywa język mówcy w tle rozmowy.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

```json
{
  "id": "voice_detect_language_1",
  "type": "voice.detect_language",
  "position": [
    250,
    150
  ],
  "params": {}
}
```

---

## 🏷️ FotoHub Brand Governance (Zarządzanie Marką) <a id="fotohub-brand"></a>

> **Liczba węzłów:** 6 | **Identyfikator kategorii:** `fotohub.brand`

Nadzór nad spójnością marki: automatyczna ekstrakcja wytycznych z PDF, generowanie palet kolorystycznych, znakowanie logo oraz bramki jakościowe weryfikujące zgodność z księgą znaku.

**Typowe zastosowanie produkcyjne:** Blokowanie publikacji grafik, w których kolory akcentowe odbiegają o więcej niż DeltaE=2 od oficjalnej palety marki klienta.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `fotohub.brand.get_face` | **Brand: Get Face**<br>_Brand: Get Face_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.generate_face` | **Brand: Generate Face**<br>_Brand: Generate Face_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `fotohub.brand.get_logo` | **Brand: Get Logo**<br>_Brand: Get Logo_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.get_product_shot` | **Brand: Get Product Shot**<br>_Brand: Get Product Shot_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.extract_palette` | **Brand: Extract Palette**<br>_Brand: Extract Palette_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.brand.apply_to_image` | **Brand: Apply to Image**<br>_Brand: Apply to Image_ | In: `main`<br>Out: `main, error` | `http` | per_operation |

### Szczegółowa Specyfikacja Węzłów (FotoHub Brand Governance (Zarządzanie Marką))

#### `fotohub.brand.get_face` — Brand: Get Face (Brand: Get Face)

Fetch a brand face/character by ID.

- **Executor:** `http`
- **Microservice:** `brand-engine` (ścieżka: `/v1/faces/{face_id}`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `face_id` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_brand_get_face_1",
  "type": "fotohub.brand.get_face",
  "position": [
    250,
    150
  ],
  "params": {
    "face_id": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.brand.generate_face` — Brand: Generate Face (Brand: Generate Face)

Generate a new brand face using the image-engine.

- **Executor:** `http`
- **Microservice:** `brand-engine` (ścieżka: `/v1/faces/generate`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `brand_id` | `string` | Tak | _brak_ |  |
| `prompt` | `string` | Tak | _brak_ |  |
| `model` | `options` | Nie | `nano-banana-pro` | <br>_Dostępne opcje:_ `nano-banana-pro`, `imagen-4-ultra`, `gpt-image-1.5`, `flux-1-pro` |
| `perspective` | `options` | Nie | `front` | <br>_Dostępne opcje:_ `front`, `three-quarter-left`, `three-quarter-right`, `profile`, `back` |

```json
{
  "id": "fotohub_brand_generate_face_1",
  "type": "fotohub.brand.generate_face",
  "position": [
    250,
    150
  ],
  "params": {
    "brand_id": "<warto\u015b\u0107>",
    "prompt": "<warto\u015b\u0107>",
    "model": "nano-banana-pro",
    "perspective": "front"
  }
}
```

---

#### `fotohub.brand.get_logo` — Brand: Get Logo (Brand: Get Logo)

Fetch a logo asset URL.

- **Executor:** `http`
- **Microservice:** `brand-engine` (ścieżka: `/v1/logos/{logo_id}`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `logo_id` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_brand_get_logo_1",
  "type": "fotohub.brand.get_logo",
  "position": [
    250,
    150
  ],
  "params": {
    "logo_id": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.brand.get_product_shot` — Brand: Get Product Shot (Brand: Get Product Shot)

Fetch a stored product photo.

- **Executor:** `http`
- **Microservice:** `brand-engine` (ścieżka: `/v1/products/{product_id}`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_brand_get_product_shot_1",
  "type": "fotohub.brand.get_product_shot",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.brand.extract_palette` — Brand: Extract Palette (Brand: Extract Palette)

Extract dominant + complementary colors from an image.

- **Executor:** `http`
- **Microservice:** `brand-engine` (ścieżka: `/v1/palette/extract`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_brand_extract_palette_1",
  "type": "fotohub.brand.extract_palette",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.brand.apply_to_image` — Brand: Apply to Image (Brand: Apply to Image)

Composite logo/watermark/colors onto an image.

- **Executor:** `http`
- **Microservice:** `brand-engine` (ścieżka: `/v1/brand/apply-to-image`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `image_url` | `string` | Tak | _brak_ |  |
| `brand_id` | `string` | Tak | _brak_ |  |
| `apply` | `options` | Nie | `logo` | <br>_Dostępne opcje:_ `logo`, `watermark`, `both` |

```json
{
  "id": "fotohub_brand_apply_to_image_1",
  "type": "fotohub.brand.apply_to_image",
  "position": [
    250,
    150
  ],
  "params": {
    "image_url": "<warto\u015b\u0107>",
    "brand_id": "<warto\u015b\u0107>",
    "apply": "logo"
  }
}
```

---

## 🧠 AI Models, LLMs & Vision (Modele LLM & Analiza Wizualna) <a id="ai"></a>

> **Liczba węzłów:** 6 | **Identyfikator kategorii:** `ai`

Zintegrowane modele językowe i multimodalne (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro) do promptowania, ekstrakcji ustrukturyzowanych schematów JSON, klasyfikacji i inspekcji wizualnej jakości.

**Typowe zastosowanie produkcyjne:** Inspekcja jakości wygenerowanych grafik przez model wizyjny w celu odrzucenia artefaktów rąk czy zniekształconych napisów przed publikacją.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `ai.chat` | **AI Chat**<br>_AI Chat_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `ai.agent` | **AI Agent**<br>_AI Agent_ | In: `main, tools, memory`<br>Out: `main, error` | `llm_agent` | dynamic |
| `ai.extract` | **Extract Structured Data**<br>_Extract Structured Data_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `ai.classify` | **Classify**<br>_Classify_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `analysis.evaluate` | **Analiza: oceń run**<br>_Analyze: Evaluate Run_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `analysis.extract_data` | **Analiza: wydobądź dane**<br>_Analyze: Extract Data_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |

### Szczegółowa Specyfikacja Węzłów (AI Models, LLMs & Vision (Modele LLM & Analiza Wizualna))

#### `ai.chat` — AI Chat (AI Chat)

Single LLM call with a prompt. Great for text generation, classification, rewrites.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_tokens

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Tak | `claude-sonnet-4-6` | <br>_Dostępne opcje:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 innych) |
| `system_prompt` | `string` | Nie | _brak_ | Sets the model's role. |
| `user_prompt` | `string` | Tak | _brak_ |  |
| `` | `collapsible` | Nie | _brak_ | Advanced |

```json
{
  "id": "ai_chat_1",
  "type": "ai.chat",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-sonnet-4-6",
    "user_prompt": "<warto\u015b\u0107>"
  }
}
```

---

#### `ai.agent` — AI Agent (AI Agent)

An LLM agent that can call tools (child nodes) to accomplish a goal. Wire any FOTOhub action as a tool by connecting to the 'tools' input.

- **Executor:** `llm_agent`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** dynamic

- **Porty Wejściowe:** `main` (main), `tools` (ai_tool), `memory` (ai_memory)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Tak | `claude-sonnet-4-6` | <br>_Dostępne opcje:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 innych) |
| `instructions` | `string` | Tak | _brak_ | Appended to the system prompt. |
| `user_goal` | `string` | Tak | _brak_ |  |
| `` | `collapsible` | Nie | _brak_ | Advanced |

```json
{
  "id": "ai_agent_1",
  "type": "ai.agent",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-sonnet-4-6",
    "instructions": "<warto\u015b\u0107>",
    "user_goal": "<warto\u015b\u0107>"
  }
}
```

---

#### `ai.extract` — Extract Structured Data (Extract Structured Data)

Use an LLM to extract structured JSON matching a schema from free text.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_tokens

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Nie | `claude-haiku-4-5` | <br>_Dostępne opcje:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 innych) |
| `text` | `string` | Tak | _brak_ |  |
| `schema` | `json` | Tak | `{'type': 'object', 'properties': {'name': {'type': 'string'}}, 'required': ['name']}` |  |

```json
{
  "id": "ai_extract_1",
  "type": "ai.extract",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-haiku-4-5",
    "text": "<warto\u015b\u0107>",
    "schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        }
      },
      "required": [
        "name"
      ]
    }
  }
}
```

---

#### `ai.classify` — Classify (Classify)

Classify input into one of N labels.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_tokens

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Nie | `claude-haiku-4-5` | <br>_Dostępne opcje:_ `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `gpt-5.1`, `gpt-5-mini` (+2 innych) |
| `input` | `string` | Tak | _brak_ |  |
| `labels` | `json` | Nie | `['positive', 'neutral', 'negative']` | Array of string labels. |

```json
{
  "id": "ai_classify_1",
  "type": "ai.classify",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-haiku-4-5",
    "input": "<warto\u015b\u0107>",
    "labels": [
      "positive",
      "neutral",
      "negative"
    ]
  }
}
```

---

#### `analysis.evaluate` — Analiza: oceń run (Analyze: Evaluate Run)

LLM ocenia przebieg runa względem skonfigurowanych kryteriów oceny.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_tokens

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Nie | `gemini-2.5-flash` | <br>_Dostępne opcje:_ `gemini-2.5-flash`, `claude-haiku-4-5`, `gpt-5-mini` |
| `transcript_path` | `string` | Nie | `$.output` |  |

```json
{
  "id": "analysis_evaluate_1",
  "type": "analysis.evaluate",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "gemini-2.5-flash",
    "transcript_path": "$.output"
  }
}
```

---

#### `analysis.extract_data` — Analiza: wydobądź dane (Analyze: Extract Data)

Wydobywa ustrukturyzowane pola ze tekstu zgodnie z konfiguracją Analytics.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_tokens

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `model` | `options` | Nie | `claude-haiku-4-5` | <br>_Dostępne opcje:_ `gemini-2.5-flash`, `claude-haiku-4-5` |
| `text` | `string` | Tak | _brak_ |  |

```json
{
  "id": "analysis_extract_data_1",
  "type": "analysis.extract_data",
  "position": [
    250,
    150
  ],
  "params": {
    "model": "claude-haiku-4-5",
    "text": "<warto\u015b\u0107>"
  }
}
```

---

## 📚 Knowledge Base & Vector Memory (Baza Wiedzy & Pamięć RAG) <a id="knowledge"></a>

> **Liczba węzłów:** 3 | **Identyfikator kategorii:** `knowledge`

Wyszukiwanie semantyczne (Retrieval-Augmented Generation), długoterminowa pamięć wektorowa agenta oraz zarządzanie partycjonowanymi kolekcjami wiedzy z automatycznym czasem życia TTL.

**Typowe zastosowanie produkcyjne:** Umożliwienie agentowi odpowiadania na pytania klientów na podstawie 500-stronicowej bazy wiedzy o sprzęcie fotograficznym i cennikach.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `knowledge.retrieve` | **Knowledge Retrieve (RAG)**<br>_Knowledge Retrieve (RAG)_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_operation |
| `memory.store` | **Zapamiętaj w Pamięci Agenta**<br>_Memory: Store Record_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |
| `memory.query` | **Wyszukaj w Pamięci Agenta**<br>_Memory: Semantic Query_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |

### Szczegółowa Specyfikacja Węzłów (Knowledge Base & Vector Memory (Baza Wiedzy & Pamięć RAG))

#### `knowledge.retrieve` — Knowledge Retrieve (RAG) (Knowledge Retrieve (RAG))

Pobiera najbardziej podobne fragmenty z Bazy Wiedzy agenta dla podanego query.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `query` | `string` | Tak | _brak_ |  |
| `k` | `number` | Nie | `5` |  |
| `source` | `options` | Nie | `workflow` | Zakres wyszukiwania.<br>_Dostępne opcje:_ `all`, `workflow`, `global` |

```json
{
  "id": "knowledge_retrieve_1",
  "type": "knowledge.retrieve",
  "position": [
    250,
    150
  ],
  "params": {
    "query": "<warto\u015b\u0107>",
    "k": 5,
    "source": "workflow"
  }
}
```

---

#### `memory.store` — Zapamiętaj w Pamięci Agenta (Memory: Store Record)

Zapisuje fakt, regułę lub preferencję stylu w długoterminowej pamięci wektorowej agenta.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `content` | `string` | Tak | _brak_ |  |
| `namespace` | `string` | Nie | `default` | Izolacja logiczna / przestrzeń nazw pamięci |
| `collection_name` | `string` | Nie | `default` | Kolekcja wektorowa |
| `tenant_id` | `string` | Nie | _brak_ | Identyfikator tenanta (domyślnie user_id) |
| `category` | `options` | Nie | `brand_voice` | <br>_Dostępne opcje:_ `brand_voice`, `user_preference`, `project_rule`, `fact` |
| `tags` | `string` | Nie | _brak_ |  |
| `metadata` | `json` | Nie | _brak_ | Dowolne metadane powiązane z wpisem |
| `ttl_seconds` | `number` | Nie | `0` |  |
| `ttl_days` | `number` | Nie | `0` |  |
| `embedding` | `json` | Nie | _brak_ |  |

```json
{
  "id": "memory_store_1",
  "type": "memory.store",
  "position": [
    250,
    150
  ],
  "params": {
    "content": "<warto\u015b\u0107>",
    "namespace": "default",
    "collection_name": "default"
  }
}
```

---

#### `memory.query` — Wyszukaj w Pamięci Agenta (Memory: Semantic Query)

Wyszukuje semantycznie powiązane wspomnienia, reguły i preferencje dla zadanego kontekstu.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `query` | `string` | Tak | _brak_ |  |
| `namespace` | `string` | Nie | `default` | Szukaj w zadanym namespace |
| `collection_name` | `string` | Nie | `default` | Nazwa kolekcji |
| `tenant_id` | `string` | Nie | _brak_ | Identyfikator tenanta (domyślnie user_id) |
| `category_filter` | `options` | Nie | `all` | <br>_Dostępne opcje:_ `all`, `brand_voice`, `user_preference`, `project_rule`, `fact` |
| `filter_metadata` | `json` | Nie | _brak_ | Zaawansowane filtry $eq, $in, $gte, $lte |
| `min_score` | `number` | Nie | `0.7` |  |
| `top_k` | `number` | Nie | `3` |  |
| `query_vector` | `json` | Nie | _brak_ |  |

```json
{
  "id": "memory_query_1",
  "type": "memory.query",
  "position": [
    250,
    150
  ],
  "params": {
    "query": "<warto\u015b\u0107>",
    "namespace": "default",
    "collection_name": "default"
  }
}
```

---

## 📱 Social Media Publishing & Scheduling (Publikacja Społecznościowa) <a id="social"></a>

> **Liczba węzłów:** 14 | **Identyfikator kategorii:** `social`

Bezpośrednia publikacja i harmonogramowanie treści na Instagram (Post, Reel, Story), TikTok, YouTube Shorts, Facebook, LinkedIn, Twitter/X i Pinterest wraz z analityką wzmianek.

**Typowe zastosowanie produkcyjne:** Jednoczesna publikacja gotowej kampanii wideo na 6 platformach społecznościowych z dopasowanymi hashtagami i opisami pod każdą platformę.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `social.publish_instagram_post` | **Instagram — Post**<br>_Instagram — Post_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_instagram_reel` | **Instagram — Reel**<br>_Instagram — Reel_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_instagram_story` | **Instagram — Story**<br>_Instagram — Story_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_facebook_post` | **Facebook — Post**<br>_Facebook — Post_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_tiktok_video` | **Tiktok — Video**<br>_Tiktok — Video_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_youtube_short` | **Youtube — Short**<br>_Youtube — Short_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_linkedin_post` | **Linkedin — Post**<br>_Linkedin — Post_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_twitter_post` | **Twitter — Post**<br>_Twitter — Post_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.publish_pinterest_pin` | **Pinterest — Pin**<br>_Pinterest — Pin_ | In: `main`<br>Out: `main, error` | `http` | per_operation |
| `social.schedule_post` | **Schedule Social Post**<br>_Schedule Social Post_ | In: `main`<br>Out: `main, error` | `http` | free |
| `social.generate_caption` | **Generate Caption**<br>_Generate Caption_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `social.generate_hashtags` | **Generate Hashtags**<br>_Generate Hashtags_ | In: `main`<br>Out: `main, error` | `edge_fn` | per_tokens |
| `social.listen_mentions` | **Listen: Mentions**<br>_Listen: Mentions_ | In: `main`<br>Out: `main, error` | `http` | free |
| `fotohub.social.cross_publish` | **Publikacja Multi-Social**<br>_Multi-Social Publishing_ | In: `main`<br>Out: `main, error` | `builtin` | 1 cr (~$0.0000) |

### Szczegółowa Specyfikacja Węzłów (Social Media Publishing & Scheduling (Publikacja Społecznościowa))

#### `social.publish_instagram_post` — Instagram — Post (Instagram — Post)

Publish a post to Instagram.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/instagram/publish/post`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "social_publish_instagram_post_1",
  "type": "social.publish_instagram_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.publish_instagram_reel` — Instagram — Reel (Instagram — Reel)

Publish a reel to Instagram.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/instagram/publish/reel`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |
| `thumbnail_url` | `string` | Nie | _brak_ |  |
| `share_to_feed` | `boolean` | Nie | `True` |  |

```json
{
  "id": "social_publish_instagram_reel_1",
  "type": "social.publish_instagram_reel",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>",
    "share_to_feed": true
  }
}
```

---

#### `social.publish_instagram_story` — Instagram — Story (Instagram — Story)

Publish a story to Instagram.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/instagram/publish/story`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "social_publish_instagram_story_1",
  "type": "social.publish_instagram_story",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.publish_facebook_post` — Facebook — Post (Facebook — Post)

Publish a post to Facebook.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/facebook/publish/post`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |
| `link_url` | `string` | Nie | _brak_ |  |

```json
{
  "id": "social_publish_facebook_post_1",
  "type": "social.publish_facebook_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.publish_tiktok_video` — Tiktok — Video (Tiktok — Video)

Publish a video to Tiktok.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/tiktok/publish/video`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |
| `privacy` | `options` | Nie | `public` | <br>_Dostępne opcje:_ `public`, `friends`, `private` |

```json
{
  "id": "social_publish_tiktok_video_1",
  "type": "social.publish_tiktok_video",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>",
    "privacy": "public"
  }
}
```

---

#### `social.publish_youtube_short` — Youtube — Short (Youtube — Short)

Publish a short to Youtube.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/youtube/publish/short`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "social_publish_youtube_short_1",
  "type": "social.publish_youtube_short",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.publish_linkedin_post` — Linkedin — Post (Linkedin — Post)

Publish a post to Linkedin.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/linkedin/publish/post`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "social_publish_linkedin_post_1",
  "type": "social.publish_linkedin_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.publish_twitter_post` — Twitter — Post (Twitter — Post)

Publish a post to Twitter.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/twitter/publish/post`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |
| `reply_to_url` | `string` | Nie | _brak_ |  |

```json
{
  "id": "social_publish_twitter_post_1",
  "type": "social.publish_twitter_post",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.publish_pinterest_pin` — Pinterest — Pin (Pinterest — Pin)

Publish a pin to Pinterest.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/pinterest/publish/pin`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_operation

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |
| `board_id` | `string` | Tak | _brak_ |  |
| `link_url` | `string` | Nie | _brak_ |  |

```json
{
  "id": "social_publish_pinterest_pin_1",
  "type": "social.publish_pinterest_pin",
  "position": [
    250,
    150
  ],
  "params": {
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>",
    "board_id": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.schedule_post` — Schedule Social Post (Schedule Social Post)

Queue a post for publication at a future time.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/schedule`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `platform` | `options` | Tak | _brak_ | <br>_Dostępne opcje:_ `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin` (+2 innych) |
| `caption` | `string` | Tak | _brak_ |  |
| `media_url` | `string` | Tak | _brak_ |  |
| `publish_at` | `string` | Tak | _brak_ |  |

```json
{
  "id": "social_schedule_post_1",
  "type": "social.schedule_post",
  "position": [
    250,
    150
  ],
  "params": {
    "platform": "<warto\u015b\u0107>",
    "caption": "<warto\u015b\u0107>",
    "media_url": "<warto\u015b\u0107>",
    "publish_at": "<warto\u015b\u0107>"
  }
}
```

---

#### `social.generate_caption` — Generate Caption (Generate Caption)

LLM-generated caption + hashtags tuned to a platform.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_tokens

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `topic` | `string` | Tak | _brak_ |  |
| `platform` | `options` | Nie | `instagram` | <br>_Dostępne opcje:_ `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin` (+2 innych) |
| `tone` | `options` | Nie | `casual` | <br>_Dostępne opcje:_ `casual`, `professional`, `funny`, `inspiring` |
| `hashtag_count` | `number` | Nie | `10` |  |

```json
{
  "id": "social_generate_caption_1",
  "type": "social.generate_caption",
  "position": [
    250,
    150
  ],
  "params": {
    "topic": "<warto\u015b\u0107>",
    "platform": "instagram",
    "tone": "casual",
    "hashtag_count": 10
  }
}
```

---

#### `social.generate_hashtags` — Generate Hashtags (Generate Hashtags)

Produce N trending hashtags for a topic.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_tokens

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `topic` | `string` | Tak | _brak_ |  |
| `count` | `number` | Nie | `10` |  |

```json
{
  "id": "social_generate_hashtags_1",
  "type": "social.generate_hashtags",
  "position": [
    250,
    150
  ],
  "params": {
    "topic": "<warto\u015b\u0107>",
    "count": 10
  }
}
```

---

#### `social.listen_mentions` — Listen: Mentions (Listen: Mentions)

Poll a platform for brand mentions since last run.

- **Executor:** `http`
- **Microservice:** `social-engine` (ścieżka: `/v1/listen/mentions`)
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `platform` | `options` | Tak | _brak_ | <br>_Dostępne opcje:_ `instagram`, `facebook`, `tiktok`, `youtube`, `linkedin` (+2 innych) |
| `keyword` | `string` | Tak | _brak_ |  |
| `max_results` | `number` | Nie | `25` |  |

```json
{
  "id": "social_listen_mentions_1",
  "type": "social.listen_mentions",
  "position": [
    250,
    150
  ],
  "params": {
    "platform": "<warto\u015b\u0107>",
    "keyword": "<warto\u015b\u0107>",
    "max_results": 25
  }
}
```

---

#### `fotohub.social.cross_publish` — Publikacja Multi-Social (Multi-Social Publishing)

Jednoczesna publikacja materiałów na TikTok, Reels, YouTube Shorts i Facebook.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** 1 cr (~$0.0000)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `video_url` | `string` | Tak | _brak_ |  |
| `title` | `string` | Tak | _brak_ |  |
| `description` | `string` | Nie | _brak_ |  |
| `platforms` | `options` | Nie | `all` | <br>_Dostępne opcje:_ `all`, `tiktok_reels`, `youtube_shorts` |
| `schedule_time` | `string` | Nie | _brak_ |  |

```json
{
  "id": "fotohub_social_cross_publish_1",
  "type": "fotohub.social.cross_publish",
  "position": [
    250,
    150
  ],
  "params": {
    "video_url": "<warto\u015b\u0107>",
    "title": "<warto\u015b\u0107>",
    "platforms": "all"
  }
}
```

---

## 🔌 External Integrations & E-Commerce (Konektory Zewnętrzne) <a id="integration"></a>

> **Liczba węzłów:** 61 | **Identyfikator kategorii:** `integration`

61 konektorów do platform handlowych (Allegro, Shopify, WooCommerce, eBay, Etsy, PrestaShop), komunikatorów (Slack, Discord, Telegram), baz danych (Airtable, Notion, Google Sheets) i płatności (Stripe).

**Typowe zastosowanie produkcyjne:** Automatyczne wystawianie aukcji na Allegro i eBay z wygenerowanymi zdjęciami produktowymi i zsynchronizowanym stanem magazynowym.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `mcp.call_tool` | **MCP Tool Call**<br>_MCP: Call Tool_ | In: `main`<br>Out: `main, error` | `mcp` | free |
| `slack.send_message` | **Slack: Send Message**<br>_Slack: Send Message_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `slack.upload_file` | **Slack: Upload File**<br>_Slack: Upload File_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `gmail.send` | **Gmail: Send Email**<br>_Gmail: Send Email_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `gmail.list` | **Gmail: List Messages**<br>_Gmail: List Messages_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `calendar.create_event` | **Calendar: Create Event**<br>_Calendar: Create Event_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `drive.upload` | **Drive: Upload File**<br>_Drive: Upload File_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `sheets.append_row` | **Sheets: Append Row**<br>_Sheets: Append Row_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `sheets.read_range` | **Sheets: Read Range**<br>_Sheets: Read Range_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `notion.create_page` | **Notion: Create Page**<br>_Notion: Create Page_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `notion.query_db` | **Notion: Query Database**<br>_Notion: Query Database_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `airtable.create_record` | **Airtable: Create Record**<br>_Airtable: Create Record_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `airtable.list_records` | **Airtable: List Records**<br>_Airtable: List Records_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `discord.send_message` | **Discord: Send Message**<br>_Discord: Send Message_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `telegram.send_message` | **Telegram: Send Message**<br>_Telegram: Send Message_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `twilio.send_sms` | **Twilio: Send SMS**<br>_Twilio: Send SMS_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.create_product` | **Shopify: Create Product**<br>_Shopify: Create Product_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.update_product` | **Shopify: Update Product**<br>_Shopify: Update Product_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.list_products` | **Shopify: List Products**<br>_Shopify: List Products_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.update_inventory` | **Shopify: Update Inventory**<br>_Shopify: Update Inventory_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.list_orders` | **Shopify: List Orders**<br>_Shopify: List Orders_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `shopify.fulfill_order` | **Shopify: Fulfill Order**<br>_Shopify: Fulfill Order_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `woocommerce.create_product` | **WooCommerce: Create Product**<br>_WooCommerce: Create Product_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `woocommerce.update_product` | **WooCommerce: Update Product**<br>_WooCommerce: Update Product_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `woocommerce.list_orders` | **WooCommerce: List Orders**<br>_WooCommerce: List Orders_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.create_listing` | **Allegro: Wystaw ofertę**<br>_Allegro: Create Listing_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.update_listing` | **Allegro: Aktualizuj ofertę**<br>_Allegro: Aktualizuj ofertę_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.end_listing` | **Allegro: Zakończ ofertę**<br>_Allegro: End Listing_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `allegro.list_orders` | **Allegro: Pobierz zamówienia**<br>_Allegro: List Orders_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `amazon.create_listing` | **Amazon: Create Listing**<br>_Amazon: Create Listing_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `amazon.update_inventory` | **Amazon: Update Inventory**<br>_Amazon: Update Inventory_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `amazon.list_orders` | **Amazon: List Orders**<br>_Amazon: List Orders_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `etsy.create_listing` | **Etsy: Create Listing**<br>_Etsy: Create Listing_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `etsy.update_listing` | **Etsy: Update Listing**<br>_Etsy: Update Listing_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `etsy.list_orders` | **Etsy: Fetch Receipts**<br>_Etsy: Fetch Receipts_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.add_product` | **BaseLinker: Dodaj produkt**<br>_BaseLinker: Dodaj produkt_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.update_stock` | **BaseLinker: Aktualizuj stan**<br>_BaseLinker: Aktualizuj stan_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.publish_to_marketplace` | **BaseLinker: Wystaw na marketplace**<br>_BaseLinker: Wystaw na marketplace_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `baselinker.list_orders` | **BaseLinker: Pobierz zamówienia**<br>_BaseLinker: Pobierz zamówienia_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.upload_feed` | **Ceneo: Prześlij feed XML**<br>_Ceneo: Prześlij feed XML_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.list_orders` | **Ceneo: Pobierz zamówienia (Kupuję)**<br>_Ceneo: Pobierz zamówienia (Kupuję)_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.update_order_status` | **Ceneo: Aktualizuj status zamówienia**<br>_Ceneo: Aktualizuj status zamówienia_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ceneo.price_compare` | **Ceneo: Porównaj cenę**<br>_Ceneo: Porównaj cenę_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.create_listing` | **eBay: Create Listing**<br>_eBay: Create Listing_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.update_listing` | **eBay: Update Listing**<br>_eBay: Update Listing_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.list_orders` | **eBay: List Orders**<br>_eBay: List Orders_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `ebay.ship_order` | **eBay: Mark Shipped**<br>_eBay: Mark Shipped_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `empik.create_offer` | **Empik: Wystaw ofertę**<br>_Empik: Wystaw ofertę_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `empik.list_orders` | **Empik: Pobierz zamówienia**<br>_Empik: Pobierz zamówienia_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `olx.create_ad` | **OLX: Wystaw ogłoszenie**<br>_OLX: Wystaw ogłoszenie_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `olx.list_messages` | **OLX: Pobierz wiadomości**<br>_OLX: Pobierz wiadomości_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `erli.create_listing` | **Erli: Wystaw ofertę**<br>_Erli: Wystaw ofertę_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `erli.list_orders` | **Erli: Pobierz zamówienia**<br>_Erli: Pobierz zamówienia_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `zalando.create_article` | **Zalando: Create Article**<br>_Zalando: Create Article_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `zalando.update_stock` | **Zalando: Update Stock**<br>_Zalando: Update Stock_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `zalando.list_orders` | **Zalando: List Orders**<br>_Zalando: List Orders_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `kaufland.create_offer` | **Kaufland: Create Offer**<br>_Kaufland: Create Offer_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `kaufland.list_orders` | **Kaufland: List Orders**<br>_Kaufland: List Orders_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `stripe.create_checkout` | **Stripe: Create Checkout**<br>_Stripe: Create Checkout_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `stripe.list_customers` | **Stripe: List Customers**<br>_Stripe: List Customers_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `mailchimp.add_subscriber` | **Mailchimp: Add Subscriber**<br>_Mailchimp: Add Subscriber_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |

### Szczegółowa Specyfikacja Węzłów (External Integrations & E-Commerce (Konektory Zewnętrzne))

#### `mcp.call_tool` — MCP Tool Call (MCP: Call Tool)

Wywołanie narzędzia z podłączonego serwera MCP.

- **Executor:** `mcp`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `server_name` | `string` | Tak | _brak_ |  |
| `tool_name` | `string` | Tak | _brak_ |  |
| `arguments` | `json` | Nie | `{}` |  |

```json
{
  "id": "mcp_call_tool_1",
  "type": "mcp.call_tool",
  "position": [
    250,
    150
  ],
  "params": {
    "server_name": "<warto\u015b\u0107>",
    "tool_name": "<warto\u015b\u0107>",
    "arguments": {}
  }
}
```

---

#### `slack.send_message` — Slack: Send Message (Slack: Send Message)

Post a message to a channel or DM.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `channel` | `string` | Tak | _brak_ |  |
| `text` | `string` | Tak | _brak_ |  |
| `blocks` | `json` | Nie | _brak_ | Slack Block Kit JSON (optional) |

```json
{
  "id": "slack_send_message_1",
  "type": "slack.send_message",
  "position": [
    250,
    150
  ],
  "params": {
    "channel": "<warto\u015b\u0107>",
    "text": "<warto\u015b\u0107>"
  }
}
```

---

#### `slack.upload_file` — Slack: Upload File (Slack: Upload File)

Share a file to a Slack channel.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `channel` | `string` | Tak | _brak_ |  |
| `file_url` | `string` | Tak | _brak_ |  |
| `title` | `string` | Nie | _brak_ |  |

```json
{
  "id": "slack_upload_file_1",
  "type": "slack.upload_file",
  "position": [
    250,
    150
  ],
  "params": {
    "channel": "<warto\u015b\u0107>",
    "file_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `gmail.send` — Gmail: Send Email (Gmail: Send Email)

Send an email via the connected Gmail account.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `to` | `string` | Tak | _brak_ |  |
| `cc` | `string` | Nie | _brak_ |  |
| `subject` | `string` | Tak | _brak_ |  |
| `body` | `string` | Tak | _brak_ |  |
| `body_type` | `options` | Nie | `text` | <br>_Dostępne opcje:_ `text`, `html` |

```json
{
  "id": "gmail_send_1",
  "type": "gmail.send",
  "position": [
    250,
    150
  ],
  "params": {
    "to": "<warto\u015b\u0107>",
    "subject": "<warto\u015b\u0107>",
    "body": "<warto\u015b\u0107>"
  }
}
```

---

#### `gmail.list` — Gmail: List Messages (Gmail: List Messages)

Query messages using Gmail search syntax.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `query` | `string` | Nie | `is:unread` |  |
| `max_results` | `number` | Nie | `20` |  |

```json
{
  "id": "gmail_list_1",
  "type": "gmail.list",
  "position": [
    250,
    150
  ],
  "params": {
    "query": "is:unread",
    "max_results": 20
  }
}
```

---

#### `calendar.create_event` — Calendar: Create Event (Calendar: Create Event)

Create a Google Calendar event.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `calendar_id` | `string` | Nie | `primary` |  |
| `title` | `string` | Tak | _brak_ |  |
| `description` | `string` | Nie | _brak_ |  |
| `start` | `string` | Tak | _brak_ |  |
| `end` | `string` | Tak | _brak_ |  |
| `attendees` | `string` | Nie | _brak_ | Comma-separated emails |

```json
{
  "id": "calendar_create_event_1",
  "type": "calendar.create_event",
  "position": [
    250,
    150
  ],
  "params": {
    "calendar_id": "primary",
    "title": "<warto\u015b\u0107>",
    "start": "<warto\u015b\u0107>"
  }
}
```

---

#### `drive.upload` — Drive: Upload File (Drive: Upload File)

Upload a file to Google Drive.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | Tak | _brak_ |  |
| `folder_id` | `string` | Nie | _brak_ | Target folder ID (optional) |
| `filename` | `string` | Nie | _brak_ |  |

```json
{
  "id": "drive_upload_1",
  "type": "drive.upload",
  "position": [
    250,
    150
  ],
  "params": {
    "file_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `sheets.append_row` — Sheets: Append Row (Sheets: Append Row)

Append a row to a Google Sheet.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `spreadsheet_id` | `string` | Tak | _brak_ |  |
| `sheet_name` | `string` | Nie | `Sheet1` |  |
| `values` | `json` | Tak | _brak_ | Array of cell values, e.g. ["A", 123, true] |

```json
{
  "id": "sheets_append_row_1",
  "type": "sheets.append_row",
  "position": [
    250,
    150
  ],
  "params": {
    "spreadsheet_id": "<warto\u015b\u0107>",
    "sheet_name": "Sheet1",
    "values": "<warto\u015b\u0107>"
  }
}
```

---

#### `sheets.read_range` — Sheets: Read Range (Sheets: Read Range)

Read a range of cells from a Google Sheet.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `spreadsheet_id` | `string` | Tak | _brak_ |  |
| `range` | `string` | Tak | _brak_ |  |

```json
{
  "id": "sheets_read_range_1",
  "type": "sheets.read_range",
  "position": [
    250,
    150
  ],
  "params": {
    "spreadsheet_id": "<warto\u015b\u0107>",
    "range": "<warto\u015b\u0107>"
  }
}
```

---

#### `notion.create_page` — Notion: Create Page (Notion: Create Page)

Create a page in a Notion database.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `database_id` | `string` | Tak | _brak_ |  |
| `properties` | `json` | Tak | _brak_ |  |
| `content_md` | `string` | Nie | _brak_ |  |

```json
{
  "id": "notion_create_page_1",
  "type": "notion.create_page",
  "position": [
    250,
    150
  ],
  "params": {
    "database_id": "<warto\u015b\u0107>",
    "properties": "<warto\u015b\u0107>"
  }
}
```

---

#### `notion.query_db` — Notion: Query Database (Notion: Query Database)

Fetch pages from a Notion database with filters.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `database_id` | `string` | Tak | _brak_ |  |
| `filter` | `json` | Nie | _brak_ | Notion filter object |
| `page_size` | `number` | Nie | `25` |  |

```json
{
  "id": "notion_query_db_1",
  "type": "notion.query_db",
  "position": [
    250,
    150
  ],
  "params": {
    "database_id": "<warto\u015b\u0107>",
    "page_size": 25
  }
}
```

---

#### `airtable.create_record` — Airtable: Create Record (Airtable: Create Record)

Create one record in an Airtable base/table.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `base_id` | `string` | Tak | _brak_ |  |
| `table` | `string` | Tak | _brak_ |  |
| `fields` | `json` | Tak | _brak_ |  |

```json
{
  "id": "airtable_create_record_1",
  "type": "airtable.create_record",
  "position": [
    250,
    150
  ],
  "params": {
    "base_id": "<warto\u015b\u0107>",
    "table": "<warto\u015b\u0107>",
    "fields": "<warto\u015b\u0107>"
  }
}
```

---

#### `airtable.list_records` — Airtable: List Records (Airtable: List Records)

Fetch records from a table (with optional filterByFormula).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `base_id` | `string` | Tak | _brak_ |  |
| `table` | `string` | Tak | _brak_ |  |
| `filter_by_formula` | `string` | Nie | _brak_ | Airtable formula, e.g. {Status}='active' |
| `max_records` | `number` | Nie | `50` |  |

```json
{
  "id": "airtable_list_records_1",
  "type": "airtable.list_records",
  "position": [
    250,
    150
  ],
  "params": {
    "base_id": "<warto\u015b\u0107>",
    "table": "<warto\u015b\u0107>",
    "max_records": 50
  }
}
```

---

#### `discord.send_message` — Discord: Send Message (Discord: Send Message)

Post to a Discord channel via webhook or bot token.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `channel_id` | `string` | Tak | _brak_ |  |
| `content` | `string` | Tak | _brak_ |  |
| `embeds` | `json` | Nie | _brak_ |  |

```json
{
  "id": "discord_send_message_1",
  "type": "discord.send_message",
  "position": [
    250,
    150
  ],
  "params": {
    "channel_id": "<warto\u015b\u0107>",
    "content": "<warto\u015b\u0107>"
  }
}
```

---

#### `telegram.send_message` — Telegram: Send Message (Telegram: Send Message)

Send a message via Telegram Bot API.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `chat_id` | `string` | Tak | _brak_ |  |
| `text` | `string` | Tak | _brak_ |  |
| `parse_mode` | `options` | Nie | `none` | <br>_Dostępne opcje:_ `none`, `Markdown`, `HTML` |

```json
{
  "id": "telegram_send_message_1",
  "type": "telegram.send_message",
  "position": [
    250,
    150
  ],
  "params": {
    "chat_id": "<warto\u015b\u0107>",
    "text": "<warto\u015b\u0107>",
    "parse_mode": "none"
  }
}
```

---

#### `twilio.send_sms` — Twilio: Send SMS (Twilio: Send SMS)

Send an SMS via Twilio.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `to` | `string` | Tak | _brak_ |  |
| `body` | `string` | Tak | _brak_ |  |

```json
{
  "id": "twilio_send_sms_1",
  "type": "twilio.send_sms",
  "position": [
    250,
    150
  ],
  "params": {
    "to": "<warto\u015b\u0107>",
    "body": "<warto\u015b\u0107>"
  }
}
```

---

#### `shopify.create_product` — Shopify: Create Product (Shopify: Create Product)

Add a new product to the Shopify store.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Tak | _brak_ |  |
| `description` | `string` | Nie | _brak_ |  |
| `price` | `number` | Tak | _brak_ |  |
| `images` | `json` | Nie | _brak_ | Array of image URLs |
| `variants` | `json` | Nie | _brak_ |  |

```json
{
  "id": "shopify_create_product_1",
  "type": "shopify.create_product",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>"
  }
}
```

---

#### `shopify.update_product` — Shopify: Update Product (Shopify: Update Product)

Update product fields.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Tak | _brak_ |  |
| `fields` | `json` | Tak | _brak_ |  |

```json
{
  "id": "shopify_update_product_1",
  "type": "shopify.update_product",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<warto\u015b\u0107>",
    "fields": "<warto\u015b\u0107>"
  }
}
```

---

#### `shopify.list_products` — Shopify: List Products (Shopify: List Products)

Paginate products in the Shopify store.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `limit` | `number` | Nie | `50` |  |
| `status` | `string` | Nie | _brak_ | active | draft | archived |

```json
{
  "id": "shopify_list_products_1",
  "type": "shopify.list_products",
  "position": [
    250,
    150
  ],
  "params": {
    "limit": 50
  }
}
```

---

#### `shopify.update_inventory` — Shopify: Update Inventory (Shopify: Update Inventory)

Adjust stock level for a variant.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `inventory_item_id` | `string` | Tak | _brak_ |  |
| `location_id` | `string` | Tak | _brak_ |  |
| `available` | `number` | Tak | _brak_ | Absolute available count (not delta). |

```json
{
  "id": "shopify_update_inventory_1",
  "type": "shopify.update_inventory",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_item_id": "<warto\u015b\u0107>",
    "location_id": "<warto\u015b\u0107>",
    "available": "<warto\u015b\u0107>"
  }
}
```

---

#### `shopify.list_orders` — Shopify: List Orders (Shopify: List Orders)

Fetch recent orders, optionally filtered.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `status` | `options` | Nie | `any` | <br>_Dostępne opcje:_ `any`, `open`, `closed`, `cancelled` |
| `financial_status` | `options` | Nie | `any` | <br>_Dostępne opcje:_ `any`, `paid`, `pending`, `refunded`, `partially_refunded` |
| `limit` | `number` | Nie | `50` |  |
| `since_id` | `string` | Nie | _brak_ | Only orders after this id |

```json
{
  "id": "shopify_list_orders_1",
  "type": "shopify.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "status": "any",
    "financial_status": "any",
    "limit": 50
  }
}
```

---

#### `shopify.fulfill_order` — Shopify: Fulfill Order (Shopify: Fulfill Order)

Mark an order as fulfilled with tracking info.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `order_id` | `string` | Tak | _brak_ |  |
| `tracking_number` | `string` | Nie | _brak_ |  |
| `tracking_company` | `string` | Nie | _brak_ |  |
| `notify_customer` | `boolean` | Nie | `True` |  |

```json
{
  "id": "shopify_fulfill_order_1",
  "type": "shopify.fulfill_order",
  "position": [
    250,
    150
  ],
  "params": {
    "order_id": "<warto\u015b\u0107>",
    "notify_customer": true
  }
}
```

---

#### `woocommerce.create_product` — WooCommerce: Create Product (WooCommerce: Create Product)

Create a product in WooCommerce via REST API.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `name` | `string` | Tak | _brak_ |  |
| `sku` | `string` | Nie | _brak_ |  |
| `regular_price` | `number` | Tak | _brak_ |  |
| `description` | `string` | Nie | _brak_ |  |
| `categories` | `json` | Nie | _brak_ | Array of category IDs |
| `images` | `json` | Nie | _brak_ | Array of image URLs |
| `status` | `options` | Nie | `publish` | <br>_Dostępne opcje:_ `publish`, `draft`, `private` |

```json
{
  "id": "woocommerce_create_product_1",
  "type": "woocommerce.create_product",
  "position": [
    250,
    150
  ],
  "params": {
    "name": "<warto\u015b\u0107>",
    "regular_price": "<warto\u015b\u0107>"
  }
}
```

---

#### `woocommerce.update_product` — WooCommerce: Update Product (WooCommerce: Update Product)

Update WooCommerce product fields.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Tak | _brak_ |  |
| `fields` | `json` | Tak | _brak_ |  |

```json
{
  "id": "woocommerce_update_product_1",
  "type": "woocommerce.update_product",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<warto\u015b\u0107>",
    "fields": "<warto\u015b\u0107>"
  }
}
```

---

#### `woocommerce.list_orders` — WooCommerce: List Orders (WooCommerce: List Orders)

Paginate recent WooCommerce orders.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `status` | `options` | Nie | `any` | <br>_Dostępne opcje:_ `any`, `pending`, `processing`, `completed`, `refunded` |
| `per_page` | `number` | Nie | `20` |  |

```json
{
  "id": "woocommerce_list_orders_1",
  "type": "woocommerce.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "status": "any",
    "per_page": 20
  }
}
```

---

#### `allegro.create_listing` — Allegro: Wystaw ofertę (Allegro: Create Listing)

Wystaw nową ofertę (produkt) na Allegro.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `name` | `string` | Tak | _brak_ | Tytuł oferty (max 75 zn.) |
| `category_id` | `string` | Tak | _brak_ | ID kategorii Allegro (np. 257936) |
| `price` | `number` | Tak | _brak_ | Cena w PLN |
| `quantity` | `number` | Tak | `1` |  |
| `description_html` | `string` | Tak | _brak_ |  |
| `images` | `json` | Nie | _brak_ | Do 16 URL-i zdjęć |
| `parameters` | `json` | Nie | _brak_ | Parametry Allegro: [{id, values: [...]}, …] |
| `condition` | `options` | Nie | `NEW` | <br>_Dostępne opcje:_ `NEW`, `USED`, `NEW_OTHER`, `REFURBISHED` |
| `delivery_shipping_rates_id` | `string` | Nie | _brak_ | ID cennika dostaw |
| `publication_status` | `options` | Nie | `ACTIVE` | <br>_Dostępne opcje:_ `ACTIVE`, `INACTIVE` |

```json
{
  "id": "allegro_create_listing_1",
  "type": "allegro.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "name": "<warto\u015b\u0107>",
    "category_id": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>",
    "quantity": 1
  }
}
```

---

#### `allegro.update_listing` — Allegro: Aktualizuj ofertę (Allegro: Aktualizuj ofertę)

Zmień cenę, stan lub parametry oferty.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `offer_id` | `string` | Tak | _brak_ |  |
| `fields` | `json` | Tak | _brak_ | Obiekt z polami do aktualizacji |

```json
{
  "id": "allegro_update_listing_1",
  "type": "allegro.update_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "offer_id": "<warto\u015b\u0107>",
    "fields": "<warto\u015b\u0107>"
  }
}
```

---

#### `allegro.end_listing` — Allegro: Zakończ ofertę (Allegro: End Listing)

Zakończ aktywną ofertę Allegro.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `offer_id` | `string` | Tak | _brak_ |  |

```json
{
  "id": "allegro_end_listing_1",
  "type": "allegro.end_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "offer_id": "<warto\u015b\u0107>"
  }
}
```

---

#### `allegro.list_orders` — Allegro: Pobierz zamówienia (Allegro: List Orders)

Lista zamówień z ostatnich N dni.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` | Zamówienia z ostatnich N dni |
| `status` | `options` | Nie | `READY_FOR_PROCESSING` | <br>_Dostępne opcje:_ `BOUGHT`, `READY_FOR_PROCESSING`, `PROCESSING`, `READY_FOR_SHIPMENT`, `SENT` (+2 innych) |

```json
{
  "id": "allegro_list_orders_1",
  "type": "allegro.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "READY_FOR_PROCESSING"
  }
}
```

---

#### `amazon.create_listing` — Amazon: Create Listing (Amazon: Create Listing)

Submit a listing via Amazon SP-API.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `marketplace_id` | `string` | Tak | _brak_ | np. A1PA6795UKMFR9 (DE), APJ6JRA9NG5V4 (IT) |
| `sku` | `string` | Tak | _brak_ |  |
| `product_type` | `string` | Tak | _brak_ | Amazon product-type (np. SHOES, BOOK, TOY) |
| `attributes` | `json` | Tak | _brak_ | Attribute dict per SP-API schema |

```json
{
  "id": "amazon_create_listing_1",
  "type": "amazon.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "marketplace_id": "<warto\u015b\u0107>",
    "sku": "<warto\u015b\u0107>",
    "product_type": "<warto\u015b\u0107>",
    "attributes": "<warto\u015b\u0107>"
  }
}
```

---

#### `amazon.update_inventory` — Amazon: Update Inventory (Amazon: Update Inventory)

Set SKU stock quantity in Amazon SP-API.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `sku` | `string` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | _brak_ |  |

```json
{
  "id": "amazon_update_inventory_1",
  "type": "amazon.update_inventory",
  "position": [
    250,
    150
  ],
  "params": {
    "sku": "<warto\u015b\u0107>",
    "quantity": "<warto\u015b\u0107>"
  }
}
```

---

#### `amazon.list_orders` — Amazon: List Orders (Amazon: List Orders)

Fetch recent Amazon orders for given marketplaces.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `marketplace_ids` | `string` | Tak | _brak_ |  |
| `days` | `number` | Nie | `7` |  |

```json
{
  "id": "amazon_list_orders_1",
  "type": "amazon.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "marketplace_ids": "<warto\u015b\u0107>",
    "days": 7
  }
}
```

---

#### `etsy.create_listing` — Etsy: Create Listing (Etsy: Create Listing)

Draft a new listing in your Etsy shop.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Tak | _brak_ |  |
| `description` | `string` | Tak | _brak_ |  |
| `price` | `number` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | `1` |  |
| `who_made` | `string` | Nie | `i_did` | i_did, collective, someone_else |
| `when_made` | `string` | Nie | `made_to_order` | np. made_to_order, 2020_2024 |
| `tags` | `json` | Nie | _brak_ | Do 13 tagów (tablica stringów) |
| `materials` | `json` | Nie | _brak_ |  |
| `image_ids` | `json` | Nie | _brak_ | Uploaded image ids |

```json
{
  "id": "etsy_create_listing_1",
  "type": "etsy.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<warto\u015b\u0107>",
    "description": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>",
    "quantity": 1
  }
}
```

---

#### `etsy.update_listing` — Etsy: Update Listing (Etsy: Update Listing)

Patch an existing Etsy listing.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `listing_id` | `string` | Tak | _brak_ |  |
| `fields` | `json` | Tak | _brak_ |  |

```json
{
  "id": "etsy_update_listing_1",
  "type": "etsy.update_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "listing_id": "<warto\u015b\u0107>",
    "fields": "<warto\u015b\u0107>"
  }
}
```

---

#### `etsy.list_orders` — Etsy: Fetch Receipts (Etsy: Fetch Receipts)

Pobierz zamówienia (receipts) z Etsy shopu.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `was_paid` | `options` | Nie | `true` | <br>_Dostępne opcje:_ `any`, `true`, `false` |
| `was_shipped` | `options` | Nie | `false` | <br>_Dostępne opcje:_ `any`, `false` |
| `limit` | `number` | Nie | `25` |  |

```json
{
  "id": "etsy_list_orders_1",
  "type": "etsy.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "was_paid": "true",
    "was_shipped": "false",
    "limit": 25
  }
}
```

---

#### `baselinker.add_product` — BaseLinker: Dodaj produkt (BaseLinker: Dodaj produkt)

Dodaj produkt do katalogu BaseLinker (wieloplatformowy).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `inventory_id` | `string` | Tak | _brak_ | ID magazynu BaseLinker |
| `sku` | `string` | Tak | _brak_ |  |
| `name` | `string` | Tak | _brak_ |  |
| `price_brutto` | `number` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | `0` |  |
| `description_html` | `string` | Nie | _brak_ |  |
| `images` | `json` | Nie | _brak_ |  |
| `features` | `json` | Nie | _brak_ |  |

```json
{
  "id": "baselinker_add_product_1",
  "type": "baselinker.add_product",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_id": "<warto\u015b\u0107>",
    "sku": "<warto\u015b\u0107>",
    "name": "<warto\u015b\u0107>",
    "price_brutto": "<warto\u015b\u0107>"
  }
}
```

---

#### `baselinker.update_stock` — BaseLinker: Aktualizuj stan (BaseLinker: Aktualizuj stan)

Aktualizuj ilość sztuk SKU w magazynie BaseLinker.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `inventory_id` | `string` | Tak | _brak_ |  |
| `sku` | `string` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | _brak_ |  |

```json
{
  "id": "baselinker_update_stock_1",
  "type": "baselinker.update_stock",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_id": "<warto\u015b\u0107>",
    "sku": "<warto\u015b\u0107>",
    "quantity": "<warto\u015b\u0107>"
  }
}
```

---

#### `baselinker.publish_to_marketplace` — BaseLinker: Wystaw na marketplace (BaseLinker: Wystaw na marketplace)

Jednym kliknięciem wystaw produkt na Allegro/Amazon/eBay przez BaseLinker.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `inventory_id` | `string` | Tak | _brak_ |  |
| `sku` | `string` | Tak | _brak_ |  |
| `marketplace` | `options` | Tak | _brak_ | <br>_Dostępne opcje:_ `allegro`, `amazon`, `ebay`, `empik`, `erli` (+1 innych) |
| `marketplace_params` | `json` | Nie | _brak_ | Platform-specific override (category_id, shipping, …) |

```json
{
  "id": "baselinker_publish_to_marketplace_1",
  "type": "baselinker.publish_to_marketplace",
  "position": [
    250,
    150
  ],
  "params": {
    "inventory_id": "<warto\u015b\u0107>",
    "sku": "<warto\u015b\u0107>",
    "marketplace": "<warto\u015b\u0107>"
  }
}
```

---

#### `baselinker.list_orders` — BaseLinker: Pobierz zamówienia (BaseLinker: Pobierz zamówienia)

Pobierz zamówienia z BaseLinker (wszystkie kanały).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` |  |
| `status_id` | `string` | Nie | _brak_ | Opcjonalny filtr statusu |

```json
{
  "id": "baselinker_list_orders_1",
  "type": "baselinker.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7
  }
}
```

---

#### `ceneo.upload_feed` — Ceneo: Prześlij feed XML (Ceneo: Prześlij feed XML)

Wyślij plik XML z ofertami do Ceneo (price comparison).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `feed_url` | `string` | Tak | _brak_ | URL publicznego pliku XML (Ceneo pobiera cyklicznie) |
| `format` | `options` | Nie | `ceneo` | <br>_Dostępne opcje:_ `ceneo`, `google_shopping`, `custom` |

```json
{
  "id": "ceneo_upload_feed_1",
  "type": "ceneo.upload_feed",
  "position": [
    250,
    150
  ],
  "params": {
    "feed_url": "<warto\u015b\u0107>",
    "format": "ceneo"
  }
}
```

---

#### `ceneo.list_orders` — Ceneo: Pobierz zamówienia (Kupuję) (Ceneo: Pobierz zamówienia (Kupuję))

Pobierz zamówienia z Ceneo Kupuję (marketplace).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` |  |
| `status` | `options` | Nie | `pending` | <br>_Dostępne opcje:_ `any`, `pending`, `confirmed`, `shipped`, `cancelled` |

```json
{
  "id": "ceneo_list_orders_1",
  "type": "ceneo.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "pending"
  }
}
```

---

#### `ceneo.update_order_status` — Ceneo: Aktualizuj status zamówienia (Ceneo: Aktualizuj status zamówienia)

Zmień status (shipped/cancelled) w Ceneo Kupuję.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `order_id` | `string` | Tak | _brak_ |  |
| `status` | `options` | Tak | _brak_ | <br>_Dostępne opcje:_ `confirmed`, `shipped`, `delivered`, `cancelled` |
| `tracking_number` | `string` | Nie | _brak_ | Numer przewozowy (dla shipped) |
| `courier` | `string` | Nie | _brak_ | Np. DPD, InPost, DHL, Poczta Polska |

```json
{
  "id": "ceneo_update_order_status_1",
  "type": "ceneo.update_order_status",
  "position": [
    250,
    150
  ],
  "params": {
    "order_id": "<warto\u015b\u0107>",
    "status": "<warto\u015b\u0107>"
  }
}
```

---

#### `ceneo.price_compare` — Ceneo: Porównaj cenę (Ceneo: Porównaj cenę)

Pobierz ceny konkurencji dla danego EAN / nazwy produktu.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | Nie | _brak_ | Kod EAN/GTIN produktu |
| `product_name` | `string` | Nie | _brak_ | Alternatywnie: nazwa |
| `top_n` | `number` | Nie | `10` | Ile ofert zwrócić |

```json
{
  "id": "ceneo_price_compare_1",
  "type": "ceneo.price_compare",
  "position": [
    250,
    150
  ],
  "params": {
    "top_n": 10
  }
}
```

---

#### `ebay.create_listing` — eBay: Create Listing (eBay: Create Listing)

Create a fixed-price listing on eBay (Trading API).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `marketplace_id` | `string` | Tak | _brak_ | np. EBAY_US, EBAY_DE, EBAY_PL |
| `sku` | `string` | Tak | _brak_ |  |
| `title` | `string` | Tak | _brak_ |  |
| `description_html` | `string` | Tak | _brak_ |  |
| `price` | `number` | Tak | _brak_ |  |
| `currency` | `string` | Nie | `EUR` |  |
| `quantity` | `number` | Tak | `1` |  |
| `category_id` | `string` | Tak | _brak_ | eBay category ID (np. 9355) |
| `condition` | `options` | Nie | `NEW` | <br>_Dostępne opcje:_ `NEW`, `NEW_OTHER`, `USED_EXCELLENT`, `USED_GOOD`, `USED_ACCEPTABLE` (+1 innych) |
| `images` | `json` | Nie | _brak_ | Array of image URLs |
| `fulfillment_policy_id` | `string` | Tak | _brak_ |  |
| `payment_policy_id` | `string` | Tak | _brak_ |  |
| `return_policy_id` | `string` | Tak | _brak_ |  |

```json
{
  "id": "ebay_create_listing_1",
  "type": "ebay.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "marketplace_id": "<warto\u015b\u0107>",
    "sku": "<warto\u015b\u0107>",
    "title": "<warto\u015b\u0107>",
    "description_html": "<warto\u015b\u0107>"
  }
}
```

---

#### `ebay.update_listing` — eBay: Update Listing (eBay: Update Listing)

Update eBay listing price / quantity / fields.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `listing_id` | `string` | Tak | _brak_ |  |
| `fields` | `json` | Tak | _brak_ |  |

```json
{
  "id": "ebay_update_listing_1",
  "type": "ebay.update_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "listing_id": "<warto\u015b\u0107>",
    "fields": "<warto\u015b\u0107>"
  }
}
```

---

#### `ebay.list_orders` — eBay: List Orders (eBay: List Orders)

Fetch recent eBay orders (Fulfillment API).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` |  |
| `order_status` | `options` | Nie | `ACTIVE` | <br>_Dostępne opcje:_ `ACTIVE`, `CANCELLED`, `COMPLETED`, `IN_PROGRESS` |

```json
{
  "id": "ebay_list_orders_1",
  "type": "ebay.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "order_status": "ACTIVE"
  }
}
```

---

#### `ebay.ship_order` — eBay: Mark Shipped (eBay: Mark Shipped)

Create shipment fulfillment with tracking info.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `order_id` | `string` | Tak | _brak_ |  |
| `tracking_number` | `string` | Tak | _brak_ |  |
| `carrier` | `string` | Tak | _brak_ | np. DHL, FEDEX, UPS, USPS, DPD, GLS |
| `line_items` | `json` | Nie | _brak_ | Items to fulfill: [{lineItemId, quantity}, …] |

```json
{
  "id": "ebay_ship_order_1",
  "type": "ebay.ship_order",
  "position": [
    250,
    150
  ],
  "params": {
    "order_id": "<warto\u015b\u0107>",
    "tracking_number": "<warto\u015b\u0107>",
    "carrier": "<warto\u015b\u0107>"
  }
}
```

---

#### `empik.create_offer` — Empik: Wystaw ofertę (Empik: Wystaw ofertę)

Utwórz nową ofertę w Empik Marketplace (wymaga BaseLinker/Mirakl).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `product_id` | `string` | Tak | _brak_ | Empik product ID (lub EAN) |
| `price` | `number` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | `1` |  |
| `condition` | `options` | Nie | `NEW` | <br>_Dostępne opcje:_ `NEW`, `USED_GOOD`, `USED_NEW` |
| `shipping_type` | `string` | Nie | _brak_ | np. standard, express |

```json
{
  "id": "empik_create_offer_1",
  "type": "empik.create_offer",
  "position": [
    250,
    150
  ],
  "params": {
    "product_id": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>",
    "quantity": 1,
    "condition": "NEW"
  }
}
```

---

#### `empik.list_orders` — Empik: Pobierz zamówienia (Empik: Pobierz zamówienia)

Pobierz zamówienia z Empik Marketplace.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` |  |
| `status` | `options` | Nie | `WAITING_ACCEPTANCE` | <br>_Dostępne opcje:_ `PENDING`, `WAITING_ACCEPTANCE`, `SHIPPING`, `SHIPPED`, `RECEIVED` (+2 innych) |

```json
{
  "id": "empik_list_orders_1",
  "type": "empik.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "WAITING_ACCEPTANCE"
  }
}
```

---

#### `olx.create_ad` — OLX: Wystaw ogłoszenie (OLX: Wystaw ogłoszenie)

Utwórz ogłoszenie na OLX.pl.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Tak | _brak_ | Tytuł (max 70 zn.) |
| `description` | `string` | Tak | _brak_ |  |
| `price` | `number` | Tak | _brak_ |  |
| `category_id` | `string` | Tak | _brak_ | ID kategorii OLX |
| `city` | `string` | Tak | _brak_ |  |
| `images` | `json` | Nie | _brak_ | Do 8 URL-i zdjęć |
| `advertiser_type` | `options` | Nie | `business` | <br>_Dostępne opcje:_ `private`, `business` |

```json
{
  "id": "olx_create_ad_1",
  "type": "olx.create_ad",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<warto\u015b\u0107>",
    "description": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>",
    "category_id": "<warto\u015b\u0107>"
  }
}
```

---

#### `olx.list_messages` — OLX: Pobierz wiadomości (OLX: Pobierz wiadomości)

Pobierz wiadomości od kupujących (dla obsługi).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `unread_only` | `boolean` | Nie | `True` |  |
| `limit` | `number` | Nie | `50` |  |

```json
{
  "id": "olx_list_messages_1",
  "type": "olx.list_messages",
  "position": [
    250,
    150
  ],
  "params": {
    "unread_only": true,
    "limit": 50
  }
}
```

---

#### `erli.create_listing` — Erli: Wystaw ofertę (Erli: Wystaw ofertę)

Wystaw ofertę w Erli (PL marketplace bez prowizji).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Tak | _brak_ |  |
| `category_id` | `string` | Tak | _brak_ |  |
| `price` | `number` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | `1` |  |
| `description_html` | `string` | Tak | _brak_ |  |
| `images` | `json` | Nie | _brak_ |  |
| `ean` | `string` | Nie | _brak_ | Kod EAN (zalecane) |

```json
{
  "id": "erli_create_listing_1",
  "type": "erli.create_listing",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "<warto\u015b\u0107>",
    "category_id": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>",
    "quantity": 1
  }
}
```

---

#### `erli.list_orders` — Erli: Pobierz zamówienia (Erli: Pobierz zamówienia)

Pobierz zamówienia z Erli.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` |  |
| `status` | `options` | Nie | `new` | <br>_Dostępne opcje:_ `new`, `processing`, `shipped`, `completed`, `cancelled` |

```json
{
  "id": "erli_list_orders_1",
  "type": "erli.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "new"
  }
}
```

---

#### `zalando.create_article` — Zalando: Create Article (Zalando: Create Article)

Submit a fashion article to Zalando Partner Connect (ZDT).

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | Tak | _brak_ | GTIN/EAN (required) |
| `article_config_id` | `string` | Tak | _brak_ |  |
| `name` | `string` | Tak | _brak_ |  |
| `price` | `number` | Tak | _brak_ |  |
| `currency` | `string` | Nie | `EUR` |  |
| `images` | `json` | Nie | _brak_ | Min. 4 images, up to 8 |
| `attributes` | `json` | Nie | _brak_ | Zalando attribute schema per category |

```json
{
  "id": "zalando_create_article_1",
  "type": "zalando.create_article",
  "position": [
    250,
    150
  ],
  "params": {
    "ean": "<warto\u015b\u0107>",
    "article_config_id": "<warto\u015b\u0107>",
    "name": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>"
  }
}
```

---

#### `zalando.update_stock` — Zalando: Update Stock (Zalando: Update Stock)

Update stock level in Zalando Partner Connect.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | _brak_ |  |

```json
{
  "id": "zalando_update_stock_1",
  "type": "zalando.update_stock",
  "position": [
    250,
    150
  ],
  "params": {
    "ean": "<warto\u015b\u0107>",
    "quantity": "<warto\u015b\u0107>"
  }
}
```

---

#### `zalando.list_orders` — Zalando: List Orders (Zalando: List Orders)

Fetch recent Zalando orders.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` |  |
| `order_status` | `options` | Nie | `ACCEPTED` | <br>_Dostępne opcje:_ `CREATED`, `ACCEPTED`, `SHIPPED`, `DELIVERED`, `CANCELLED` |

```json
{
  "id": "zalando_list_orders_1",
  "type": "zalando.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "order_status": "ACCEPTED"
  }
}
```

---

#### `kaufland.create_offer` — Kaufland: Create Offer (Kaufland: Create Offer)

Create an offer in Kaufland Global Marketplace.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `ean` | `string` | Tak | _brak_ |  |
| `price` | `number` | Tak | _brak_ |  |
| `quantity` | `number` | Tak | `1` |  |
| `delivery_time_min` | `string` | Nie | `1` |  |
| `delivery_time_max` | `string` | Nie | `3` |  |
| `condition` | `options` | Nie | `NEW` | <br>_Dostępne opcje:_ `NEW`, `USED_LIKE_NEW`, `USED_VERY_GOOD`, `USED_GOOD`, `USED_ACCEPTABLE` |

```json
{
  "id": "kaufland_create_offer_1",
  "type": "kaufland.create_offer",
  "position": [
    250,
    150
  ],
  "params": {
    "ean": "<warto\u015b\u0107>",
    "price": "<warto\u015b\u0107>",
    "quantity": 1,
    "delivery_time_min": "1"
  }
}
```

---

#### `kaufland.list_orders` — Kaufland: List Orders (Kaufland: List Orders)

Fetch recent Kaufland orders.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `days` | `number` | Nie | `7` |  |
| `status` | `options` | Nie | `open` | <br>_Dostępne opcje:_ `open`, `shipped`, `delivered`, `canceled` |

```json
{
  "id": "kaufland_list_orders_1",
  "type": "kaufland.list_orders",
  "position": [
    250,
    150
  ],
  "params": {
    "days": 7,
    "status": "open"
  }
}
```

---

#### `stripe.create_checkout` — Stripe: Create Checkout (Stripe: Create Checkout)

Create a Checkout Session and return the URL.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `line_items` | `json` | Tak | _brak_ | Stripe line_items array |
| `success_url` | `string` | Tak | _brak_ |  |
| `cancel_url` | `string` | Tak | _brak_ |  |
| `mode` | `options` | Nie | `payment` | <br>_Dostępne opcje:_ `payment`, `subscription` |

```json
{
  "id": "stripe_create_checkout_1",
  "type": "stripe.create_checkout",
  "position": [
    250,
    150
  ],
  "params": {
    "line_items": "<warto\u015b\u0107>",
    "success_url": "<warto\u015b\u0107>",
    "cancel_url": "<warto\u015b\u0107>",
    "mode": "payment"
  }
}
```

---

#### `stripe.list_customers` — Stripe: List Customers (Stripe: List Customers)

Paginate through Stripe customers.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `email` | `string` | Nie | _brak_ | Filter by email |
| `limit` | `number` | Nie | `20` |  |

```json
{
  "id": "stripe_list_customers_1",
  "type": "stripe.list_customers",
  "position": [
    250,
    150
  ],
  "params": {
    "limit": 20
  }
}
```

---

#### `mailchimp.add_subscriber` — Mailchimp: Add Subscriber (Mailchimp: Add Subscriber)

Add or update a subscriber in a list.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `list_id` | `string` | Tak | _brak_ |  |
| `email` | `string` | Tak | _brak_ |  |
| `merge_fields` | `json` | Nie | _brak_ |  |
| `double_optin` | `boolean` | Nie | `True` |  |

```json
{
  "id": "mailchimp_add_subscriber_1",
  "type": "mailchimp.add_subscriber",
  "position": [
    250,
    150
  ],
  "params": {
    "list_id": "<warto\u015b\u0107>",
    "email": "<warto\u015b\u0107>",
    "double_optin": true
  }
}
```

---

## ☁️ Cloud Storage & File Delivery (Magazyn Danych & Chmura) <a id="storage"></a>

> **Liczba węzłów:** 10 | **Identyfikator kategorii:** `storage`

Bezpieczny transfer i archiwizacja assetów: Galeria FotoHub, pliki projektowe, AWS S3, Cloudflare R2, Google Cloud Storage, Dropbox i Microsoft OneDrive.

**Typowe zastosowanie produkcyjne:** Natychmiastowe kopiowanie zrenderowanych wideo w jakości bezstratnej do prywatnego bucketa S3 klienta i zapis miniatur w galerii FotoHub.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `storage.dropbox_upload` | **Dropbox: Upload**<br>_Dropbox: Upload_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.dropbox_list` | **Dropbox: List Folder**<br>_Dropbox: List Folder_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.onedrive_upload` | **OneDrive: Upload**<br>_OneDrive: Upload_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.s3_put` | **AWS S3: Put Object**<br>_AWS S3: Put Object_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.s3_get_url` | **AWS S3: Get Signed URL**<br>_AWS S3: Get Signed URL_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `storage.r2_put` | **Cloudflare R2: Put Object**<br>_Cloudflare R2: Put Object_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |
| `fotohub.files.save` | **FOTOhub: Zapisz do /fh/files**<br>_FotoHub Files: Save File_ | In: `main`<br>Out: `main, error` | `builtin` | free |
| `fotohub.bucket.upload` | **FOTOhub: Zapisz do Bucket S3**<br>_FOTOhub: Zapisz do Bucket S3_ | In: `main`<br>Out: `main, error` | `builtin` | free |
| `fotohub.files.get` | **FOTOhub: Pobierz plik z /fh/files**<br>_FotoHub Files: Get File_ | In: `main`<br>Out: `main, error` | `builtin` | free |
| `fotohub.bucket.download` | **FOTOhub: Pobierz z Bucket S3**<br>_FOTOhub: Pobierz z Bucket S3_ | In: `main`<br>Out: `main, error` | `builtin` | free |

### Szczegółowa Specyfikacja Węzłów (Cloud Storage & File Delivery (Magazyn Danych & Chmura))

#### `storage.dropbox_upload` — Dropbox: Upload (Dropbox: Upload)

Upload a file URL to Dropbox.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | Tak | _brak_ |  |
| `target_path` | `string` | Tak | _brak_ |  |

```json
{
  "id": "storage_dropbox_upload_1",
  "type": "storage.dropbox_upload",
  "position": [
    250,
    150
  ],
  "params": {
    "file_url": "<warto\u015b\u0107>",
    "target_path": "<warto\u015b\u0107>"
  }
}
```

---

#### `storage.dropbox_list` — Dropbox: List Folder (Dropbox: List Folder)

List files in a Dropbox folder.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `folder_path` | `string` | Nie | `/` |  |

```json
{
  "id": "storage_dropbox_list_1",
  "type": "storage.dropbox_list",
  "position": [
    250,
    150
  ],
  "params": {
    "folder_path": "/"
  }
}
```

---

#### `storage.onedrive_upload` — OneDrive: Upload (OneDrive: Upload)

Upload a file URL to OneDrive.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | Tak | _brak_ |  |
| `target_path` | `string` | Tak | _brak_ |  |

```json
{
  "id": "storage_onedrive_upload_1",
  "type": "storage.onedrive_upload",
  "position": [
    250,
    150
  ],
  "params": {
    "file_url": "<warto\u015b\u0107>",
    "target_path": "<warto\u015b\u0107>"
  }
}
```

---

#### `storage.s3_put` — AWS S3: Put Object (AWS S3: Put Object)

Upload a file URL to an S3 bucket.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `bucket` | `string` | Tak | _brak_ |  |
| `key` | `string` | Tak | _brak_ |  |
| `file_url` | `string` | Tak | _brak_ |  |
| `content_type` | `string` | Nie | _brak_ |  |

```json
{
  "id": "storage_s3_put_1",
  "type": "storage.s3_put",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "<warto\u015b\u0107>",
    "key": "<warto\u015b\u0107>",
    "file_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `storage.s3_get_url` — AWS S3: Get Signed URL (AWS S3: Get Signed URL)

Create a pre-signed GET URL for an S3 object.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `bucket` | `string` | Tak | _brak_ |  |
| `key` | `string` | Tak | _brak_ |  |

```json
{
  "id": "storage_s3_get_url_1",
  "type": "storage.s3_get_url",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "<warto\u015b\u0107>",
    "key": "<warto\u015b\u0107>"
  }
}
```

---

#### `storage.r2_put` — Cloudflare R2: Put Object (Cloudflare R2: Put Object)

Upload a file URL to R2.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `bucket` | `string` | Tak | _brak_ |  |
| `key` | `string` | Tak | _brak_ |  |
| `file_url` | `string` | Tak | _brak_ |  |

```json
{
  "id": "storage_r2_put_1",
  "type": "storage.r2_put",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "<warto\u015b\u0107>",
    "key": "<warto\u015b\u0107>",
    "file_url": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.files.save` — FOTOhub: Zapisz do /fh/files (FotoHub Files: Save File)

Zapisz plik bezpośrednio do Twojego Menedżera Plików FOTOhub (/fh/files).

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `file_url` | `string` | Nie | _brak_ |  |
| `name` | `string` | Nie | `plik-agenta.png` |  |
| `folder_id` | `string` | Nie | _brak_ |  |

```json
{
  "id": "fotohub_files_save_1",
  "type": "fotohub.files.save",
  "position": [
    250,
    150
  ],
  "params": {
    "name": "plik-agenta.png"
  }
}
```

---

#### `fotohub.bucket.upload` — FOTOhub: Zapisz do Bucket S3 (FOTOhub: Zapisz do Bucket S3)

Zapisz obiekt w Twoim prywatnym buckecie S3 w chmurze FOTOhub.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `bucket_name` | `string` | Tak | _brak_ |  |
| `key` | `string` | Tak | _brak_ |  |
| `file_url` | `string` | Nie | _brak_ |  |

```json
{
  "id": "fotohub_bucket_upload_1",
  "type": "fotohub.bucket.upload",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket_name": "<warto\u015b\u0107>",
    "key": "<warto\u015b\u0107>"
  }
}
```

---

#### `fotohub.files.get` — FOTOhub: Pobierz plik z /fh/files (FotoHub Files: Get File)

Pobiera metadane i publiczny/podpisany URL pliku z Twojego Menedżera Plików FOTOhub.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `file_id` | `string` | Nie | _brak_ |  |
| `file_path` | `string` | Nie | _brak_ |  |

```json
{
  "id": "fotohub_files_get_1",
  "type": "fotohub.files.get",
  "position": [
    250,
    150
  ],
  "params": {}
}
```

---

#### `fotohub.bucket.download` — FOTOhub: Pobierz z Bucket S3 (FOTOhub: Pobierz z Bucket S3)

Generuje bezpieczny URL dostępowy do obiektu w Twoim prywatnym buckecie S3.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `bucket_name` | `string` | Tak | _brak_ |  |
| `key` | `string` | Tak | _brak_ |  |

```json
{
  "id": "fotohub_bucket_download_1",
  "type": "fotohub.bucket.download",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket_name": "<warto\u015b\u0107>",
    "key": "<warto\u015b\u0107>"
  }
}
```

---

## 🔀 Flow Logic & Data Transformation (Logika & Przekształcanie Danych) <a id="logic"></a>

> **Liczba węzłów:** 15 | **Identyfikator kategorii:** `logic`

Deterministyczna logika przepływu: warunki If, Switch, opóźnienia, agregacje matematyczne (SUM, AVG, MIN, MAX), sortowanie, deduplikacja oraz potężne transformacje schematów JMESPath.

**Typowe zastosowanie produkcyjne:** Filtrowanie listy 100 wygenerowanych zdjęć, wybór 5 o najwyższym wskaźniku estetyki i posortowanie ich malejąco przed zapisem.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `logic.if` | **If**<br>_If_ | In: `main`<br>Out: `true, false` | `builtin` | Free (0 cr) |
| `logic.switch` | **Switch**<br>_Switch_ | In: `main`<br>Out: `default, case_1, case_2, case_3, case_4` | `builtin` | Free (0 cr) |
| `logic.merge` | **Merge**<br>_Merge_ | In: `in_1, in_2, in_3`<br>Out: `main` | `builtin` | Free (0 cr) |
| `logic.delay` | **Delay**<br>_Delay_ | In: `main`<br>Out: `main` | `builtin` | free |
| `data.set` | **Set Fields**<br>_Set Fields_ | In: `main`<br>Out: `main` | `builtin` | free |
| `data.filter` | **Filter**<br>_Filter_ | In: `main`<br>Out: `main` | `builtin` | free |
| `data.map` | **Map**<br>_Map_ | In: `main`<br>Out: `main` | `builtin` | free |
| `logic.approve` | **Approval Required**<br>_Approval Required_ | In: `main`<br>Out: `approved, rejected` | `builtin` | free |
| `logic.loop` | **Loop over Items**<br>_Loop over Items_ | In: `main`<br>Out: `item, done` | `builtin` | free |
| `logic.parallel` | **Parallel Branches**<br>_Parallel Branches_ | In: `main`<br>Out: `out_1, out_2, out_3, out_4` | `builtin` | free |
| `data.aggregate` | **Aggregate**<br>_Aggregate_ | In: `main`<br>Out: `main` | `builtin` | free |
| `data.sort` | **Sort**<br>_Sort_ | In: `main`<br>Out: `main` | `builtin` | free |
| `data.unique` | **Unique**<br>_Unique_ | In: `main`<br>Out: `main` | `builtin` | free |
| `data.transform` | **JMESPath Transform**<br>_JMESPath Transform_ | In: `main`<br>Out: `main` | `builtin` | free |
| `logic.switch_expr` | **Switch (Expression)**<br>_Switch (Expression)_ | In: `main`<br>Out: `case_a, case_b, case_c, default` | `builtin` | free |

### Szczegółowa Specyfikacja Węzłów (Flow Logic & Data Transformation (Logika & Przekształcanie Danych))

#### `logic.if` — If (If)

Branch the flow on a condition.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `true` (main), `false` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `condition` | `string` | Tak | _brak_ | Expression that must evaluate to truthy |

```json
{
  "id": "logic_if_1",
  "type": "logic.if",
  "position": [
    250,
    150
  ],
  "params": {
    "condition": "<warto\u015b\u0107>"
  }
}
```

---

#### `logic.switch` — Switch (Switch)

Route to one of many branches by value.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `default` (main), `case_1` (main), `case_2` (main), `case_3` (main), `case_4` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `value` | `string` | Tak | _brak_ |  |
| `cases` | `json` | Nie | `[{'match': 'active', 'port': 'case_1'}, {'match': 'pending', 'port': 'case_2'}]` | Array of {match, port}. |
| `default_port` | `string` | Nie | `default` |  |

```json
{
  "id": "logic_switch_1",
  "type": "logic.switch",
  "position": [
    250,
    150
  ],
  "params": {
    "value": "<warto\u015b\u0107>",
    "cases": [
      {
        "match": "active",
        "port": "case_1"
      },
      {
        "match": "pending",
        "port": "case_2"
      }
    ],
    "default_port": "default"
  }
}
```

---

#### `logic.merge` — Merge (Merge)

Combine multiple branches into one flow.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `in_1` (main), `in_2` (main), `in_3` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `strategy` | `options` | Nie | `merge_objects` | <br>_Dostępne opcje:_ `merge_objects`, `concat_arrays`, `wait_all` |

```json
{
  "id": "logic_merge_1",
  "type": "logic.merge",
  "position": [
    250,
    150
  ],
  "params": {
    "strategy": "merge_objects"
  }
}
```

---

#### `logic.delay` — Delay (Delay)

Pause the run for N seconds.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `seconds` | `number` | Nie | `5` |  |

```json
{
  "id": "logic_delay_1",
  "type": "logic.delay",
  "position": [
    250,
    150
  ],
  "params": {
    "seconds": 5
  }
}
```

---

#### `data.set` — Set Fields (Set Fields)

Add or override fields on the data flowing through.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `fields` | `json` | Nie | `{}` |  |
| `keep_input` | `boolean` | Nie | `True` |  |

```json
{
  "id": "data_set_1",
  "type": "data.set",
  "position": [
    250,
    150
  ],
  "params": {
    "fields": {},
    "keep_input": true
  }
}
```

---

#### `data.filter` — Filter (Filter)

Keep only items matching a condition (JMESPath).

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | Nie | `$.items` |  |
| `predicate_path` | `string` | Nie | _brak_ |  |

```json
{
  "id": "data_filter_1",
  "type": "data.filter",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items"
  }
}
```

---

#### `data.map` — Map (Map)

Transform each item using a template.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | Nie | `$.items` |  |
| `template` | `json` | Nie | `{'id': '$.id', 'name': '$.name'}` |  |

```json
{
  "id": "data_map_1",
  "type": "data.map",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "template": {
      "id": "$.id",
      "name": "$.name"
    }
  }
}
```

---

#### `logic.approve` — Approval Required (Approval Required)

Pause the run until a user explicitly approves or rejects.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `approved` (main), `rejected` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `title` | `string` | Tak | `Please review` |  |
| `message` | `string` | Nie | _brak_ |  |
| `timeout_hours` | `number` | Nie | `24` |  |

```json
{
  "id": "logic_approve_1",
  "type": "logic.approve",
  "position": [
    250,
    150
  ],
  "params": {
    "title": "Please review",
    "timeout_hours": 24
  }
}
```

---

#### `logic.loop` — Loop over Items (Loop over Items)

Execute downstream nodes once per item.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `item` (main), `done` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | Nie | `$.items` |  |
| `max_iterations` | `number` | Nie | `1000` |  |
| `mode` | `options` | Nie | `sequential` | <br>_Dostępne opcje:_ `sequential`, `parallel` |

```json
{
  "id": "logic_loop_1",
  "type": "logic.loop",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "max_iterations": 1000,
    "mode": "sequential"
  }
}
```

---

#### `logic.parallel` — Parallel Branches (Parallel Branches)

Run multiple branches concurrently and wait for all.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `out_1` (main), `out_2` (main), `out_3` (main), `out_4` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `wait_for` | `number` | Nie | `0` | 0 = all |

```json
{
  "id": "logic_parallel_1",
  "type": "logic.parallel",
  "position": [
    250,
    150
  ],
  "params": {
    "wait_for": 0
  }
}
```

---

#### `data.aggregate` — Aggregate (Aggregate)

Sum / avg / min / max / count over an array path.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | Nie | `$.items` |  |
| `field_path` | `string` | Nie | _brak_ |  |
| `op` | `options` | Nie | `count` | <br>_Dostępne opcje:_ `sum`, `avg`, `min`, `max`, `count` |

```json
{
  "id": "data_aggregate_1",
  "type": "data.aggregate",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "op": "count"
  }
}
```

---

#### `data.sort` — Sort (Sort)

Sort items by a field.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | Nie | `$.items` |  |
| `field_path` | `string` | Tak | _brak_ |  |
| `order` | `options` | Nie | `asc` | <br>_Dostępne opcje:_ `asc`, `desc` |

```json
{
  "id": "data_sort_1",
  "type": "data.sort",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items",
    "field_path": "<warto\u015b\u0107>",
    "order": "asc"
  }
}
```

---

#### `data.unique` — Unique (Unique)

Deduplicate items by a field.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `items_path` | `string` | Nie | `$.items` |  |
| `field_path` | `string` | Nie | _brak_ | If empty, full-item equality. |

```json
{
  "id": "data_unique_1",
  "type": "data.unique",
  "position": [
    250,
    150
  ],
  "params": {
    "items_path": "$.items"
  }
}
```

---

#### `data.transform` — JMESPath Transform (JMESPath Transform)

Apply any JMESPath expression to produce a new structure.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `expression` | `string` | Tak | _brak_ |  |

```json
{
  "id": "data_transform_1",
  "type": "data.transform",
  "position": [
    250,
    150
  ],
  "params": {
    "expression": "<warto\u015b\u0107>"
  }
}
```

---

#### `logic.switch_expr` — Switch (Expression) (Switch (Expression))

Route by a free-form expression evaluated once.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `case_a` (main), `case_b` (main), `case_c` (main), `default` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `value` | `string` | Tak | _brak_ |  |
| `map` | `json` | Nie | `{'active': 'case_a', 'pending': 'case_b', 'done': 'case_c'}` |  |

```json
{
  "id": "logic_switch_expr_1",
  "type": "logic.switch_expr",
  "position": [
    250,
    150
  ],
  "params": {
    "value": "<warto\u015b\u0107>",
    "map": {
      "active": "case_a",
      "pending": "case_b",
      "done": "case_c"
    }
  }
}
```

---

## 📥 Workflow Input & Output (Granice Wejścia/Wyjścia) <a id="io"></a>

> **Liczba węzłów:** 2 | **Identyfikator kategorii:** `io`

Definiowanie punktów wejściowych parametrów użytkownika oraz bezpieczny zapis i podsumowanie finalnych rezultatów wykonania workflow.

**Typowe zastosowanie produkcyjne:** Przekazywanie parametrów z formularza na stronie do silnika i zwracanie klientowi gotowych linków CDN w odpowiedzi API.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `io.input_json` | **JSON Input**<br>_JSON Input_ | In: `main`<br>Out: `main` | `builtin` | free |
| `io.output_save` | **Save Output**<br>_Save Output_ | In: `main`<br>Out: `main` | `builtin` | free |

### Szczegółowa Specyfikacja Węzłów (Workflow Input & Output (Granice Wejścia/Wyjścia))

#### `io.input_json` — JSON Input (JSON Input)

Start the flow with a literal JSON object.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `data` | `json` | Nie | `{}` |  |

```json
{
  "id": "io_input_json_1",
  "type": "io.input_json",
  "position": [
    250,
    150
  ],
  "params": {
    "data": {}
  }
}
```

---

#### `io.output_save` — Save Output (Save Output)

Store a JSON or binary result to Supabase Storage and record the URL.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `bucket` | `options` | Nie | `agent-outputs` | <br>_Dostępne opcje:_ `photos`, `videos`, `audio`, `documents`, `agent-outputs` |
| `path` | `string` | Nie | _brak_ |  |
| `public` | `boolean` | Nie | `False` |  |

```json
{
  "id": "io_output_save_1",
  "type": "io.output_save",
  "position": [
    250,
    150
  ],
  "params": {
    "bucket": "agent-outputs",
    "public": false
  }
}
```

---

## ⌨️ Code Sandbox (Piaskownica Kodu Python / JS) <a id="code"></a>

> **Liczba węzłów:** 2 | **Identyfikator kategorii:** `code`

Bezpieczne, izolowane wykonywanie skryptów Python (Pillow, Requests, NumPy) oraz JavaScript w piaskownicy ze ścisłymi limitami pamięci i czasu procesora.

**Typowe zastosowanie produkcyjne:** Niestandardowe przeliczanie marży, parsowanie niestandardowych formatów CSV/XML lub generowanie wykresów z danych.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `code.js` | **Code (JavaScript)**<br>_Code (JavaScript)_ | In: `main`<br>Out: `main, error` | `code_js` | free |
| `code.python` | **Code (Python)**<br>_Code (Python)_ | In: `main`<br>Out: `main, error` | `code_python` | per_minute |

### Szczegółowa Specyfikacja Węzłów (Code Sandbox (Piaskownica Kodu Python / JS))

#### `code.js` — Code (JavaScript) (Code (JavaScript))

Run a JavaScript snippet in a Deno sandbox (no network/fs).

- **Executor:** `code_js`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `code` | `string` | Tak | _brak_ |  |
| `timeout_s` | `number` | Nie | `10` |  |

```json
{
  "id": "code_js_1",
  "type": "code.js",
  "position": [
    250,
    150
  ],
  "params": {
    "code": "<warto\u015b\u0107>",
    "timeout_s": 10
  }
}
```

---

#### `code.python` — Code (Python) (Code (Python))

Run a Python snippet in a sandboxed microVM (NumPy / Pandas / Pillow available).

- **Executor:** `code_python`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** per_minute

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `code` | `string` | Tak | _brak_ |  |
| `timeout_s` | `number` | Nie | `30` |  |
| `memory_mb` | `number` | Nie | `512` |  |

```json
{
  "id": "code_python_1",
  "type": "code.python",
  "position": [
    250,
    150
  ],
  "params": {
    "code": "<warto\u015b\u0107>",
    "timeout_s": 30,
    "memory_mb": 512
  }
}
```

---

## 🌐 HTTP & REST API Client (Klient HTTP) <a id="http"></a>

> **Liczba węzłów:** 1 | **Identyfikator kategorii:** `http`

Uniwersalny klient HTTP do łączenia z dowolnym zewnętrznym API REST/GraphQL z obsługą Bearer Token, Basic Auth, kluczy API, nagłówków i automatycznych retry.

**Typowe zastosowanie produkcyjne:** Pobieranie aktualnych kursów walut z NBP lub wysyłanie webhooka do wewnętrznego systemu ERP przedsiębiorstwa.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `http.request` | **HTTP Request**<br>_HTTP Request_ | In: `main`<br>Out: `main, error` | `edge_fn` | free |

### Szczegółowa Specyfikacja Węzłów (HTTP & REST API Client (Klient HTTP))

#### `http.request` — HTTP Request (HTTP Request)

Call any URL. Supports auth, pagination, retries. User-provided URLs go through an SSRF-safe egress.

- **Executor:** `edge_fn`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** free

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main), `error` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `method` | `options` | Nie | `GET` | <br>_Dostępne opcje:_ `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `url` | `string` | Tak | _brak_ |  |
| `headers` | `json` | Nie | `{}` |  |
| `query` | `json` | Nie | `{}` |  |
| `body` | `json` | Nie | `{}` |  |
| `body_format` | `options` | Nie | `json` | <br>_Dostępne opcje:_ `json`, `form`, `text`, `none` |
| `auth_type` | `options` | Nie | `none` | <br>_Dostępne opcje:_ `none`, `bearer`, `basic`, `api_key`, `oauth2` |

```json
{
  "id": "http_request_1",
  "type": "http.request",
  "position": [
    250,
    150
  ],
  "params": {
    "method": "GET",
    "url": "<warto\u015b\u0107>",
    "headers": {},
    "query": {}
  }
}
```

---

## 🛡️ System & Rollback Safeguards (Wersjonowanie Systemu) <a id="system"></a>

> **Liczba węzłów:** 1 | **Identyfikator kategorii:** `system`

Tworzenie migawek (snapshotów) stanu konfiguracji agenta i całego ekosystemu z automatycznym przywracaniem (rollback) w razie wykrycia anomalii.

**Typowe zastosowanie produkcyjne:** Zabezpieczenie przed błędną konfiguracją produkcyjnego bota sprzedażowego przed wdrożeniem zmian przez zespół.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `system.version_snapshot` | **Punkt Kontrolny (Snapshot)**<br>_System: Version Snapshot_ | In: `in`<br>Out: `main, rollback` | `builtin` | Free (0 cr) |

### Szczegółowa Specyfikacja Węzłów (System & Rollback Safeguards (Wersjonowanie Systemu))

#### `system.version_snapshot` — Punkt Kontrolny (Snapshot) (System: Version Snapshot)

Zapisuje migawkę stanu workflow z możliwością automatycznego rollbacku przy błędzie.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `in` (any)
- **Porty Wyjściowe:** `main` (any), `rollback` (any)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `snapshot_tag` | `string` | Nie | `v1.0-checkpoint` | Unikalna nazwa punktu kontrolnego. |
| `auto_rollback_on_failure` | `boolean` | Nie | `True` | Czy automatycznie wycofać zmiany w przypadku awarii kolejnego węzła. |

```json
{
  "id": "system_version_snapshot_1",
  "type": "system.version_snapshot",
  "position": [
    250,
    150
  ],
  "params": {
    "snapshot_tag": "v1.0-checkpoint",
    "auto_rollback_on_failure": true
  }
}
```

---

## 🛠️ Developer Inspection Tooling (Narzędzia Developerskie) <a id="developer"></a>

> **Liczba węzłów:** 1 | **Identyfikator kategorii:** `developer`

Narzędzia inspekcyjne, mocki środowiskowe i piaskownice do debugowania i testowania zachowań agentów.

**Typowe zastosowanie produkcyjne:** Testowanie integracji z zewnętrznymi API bez ponoszenia kosztów rzeczywistych wywołań produkcyjnych.

### Tabela Węzłów w Kategorii

| Typ Węzła (`type`) | Nazwa (PL / EN) | Porty We / Wy | Silnik | Koszt |
|---|---|---|:---:|---|
| `ai.code_sandbox_exec` | **Bezpieczny Sandbox Kodu**<br>_Piaskownica Kodu (Python / JS Sandbox)_ | In: `main`<br>Out: `main` | `builtin` | Free (0 cr) |

### Szczegółowa Specyfikacja Węzłów (Developer Inspection Tooling (Narzędzia Developerskie))

#### `ai.code_sandbox_exec` — Bezpieczny Sandbox Kodu (Piaskownica Kodu (Python / JS Sandbox))

Izolowane środowisko wykonawcze Python/JS do zaawansowanych transformacji.

- **Executor:** `builtin`
- **Wymagany Plan:** `FREE`
- **Koszt operacji:** Free (0 cr)

- **Porty Wejściowe:** `main` (main)
- **Porty Wyjściowe:** `main` (main)

**Parametry konfiguracyjne (`params`):**

| Parametr | Typ | Wymagany | Domyślnie | Opis / Opcje |
|---|:---:|:---:|:---:|---|
| `language` | `options` | Nie | `python` | <br>_Dostępne opcje:_ `python`, `javascript` |
| `code` | `string` | Nie | `# Wejście dostępne pod zmienną: input_data
# Wynik przypisz do: output_data
output_data = {'status': 'processed', 'data': input_data}` |  |
| `timeout_ms` | `number` | Nie | `3000` |  |

```json
{
  "id": "ai_code_sandbox_exec_1",
  "type": "ai.code_sandbox_exec",
  "position": [
    250,
    150
  ],
  "params": {
    "language": "python",
    "code": "# Wej\u015bcie dost\u0119pne pod zmienn\u0105: input_data\n# Wynik przypisz do: output_data\noutput_data = {'status': 'processed', 'data': input_data}",
    "timeout_ms": 3000
  }
}
```

---

## Pełne Przykłady Produkcyjnych Pipeline'ów (Recipes)

Poniższe przykłady przedstawiają kompletne schematy DAG łączące wyspecjalizowane węzły w autonomiczne, gotowe do wdrożenia procesy biznesowe.

### Receptura 1: Fabryka Treści E-Commerce (Packshot ➔ Studio Mockup ➔ Allegro & Instagram)

```
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ trigger.webhook │────▶│ fotohub.image.remove_bg│────▶│ fotohub.creative.mockup │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
                                                                   │
                        ┌──────────────────────────────────────────┴───────────────┐
                        ▼                                                          ▼
             ┌───────────────────────┐                                  ┌───────────────────────────┐
             │ allegro.create_listing│                                  │social.publish_instagram_re│
             └───────────────────────┘                                  └───────────────────────────┘
```

Scenariusz pobiera surowe zdjęcie produktu ze sklepu internetowego przez Webhook, usuwa tło przy pomocy algorytmu Alpha-Matting, umieszcza obiekt w trójwymiarowej scenerii z realistycznym oświetleniem studyjnym, a następnie równolegle tworzy aukcję na Allegro i publikuje rolkę promocyjną na profilu Instagram.

### Receptura 2: Wiralowy Silnik Shorts z Napisami Karaoke i Auto-Clipperem

```
┌──────────────────┐     ┌────────────────────────┐     ┌──────────────────────────────┐
│ trigger.schedule │────▶│ fotohub.shorts.clip_auto│────▶│ fotohub.shorts.subtitles_kara│
└──────────────────┘     └────────────────────────┘     └──────────────────────────────┘
                                                                        │
                                 ┌──────────────────────────────────────┘
                                 ▼
                      ┌────────────────────────────┐     ┌──────────────────────────────┐
                      │ fotohub.shorts.add_bumper  │────▶│ fotohub.social.cross_publish │
                      └────────────────────────────┘     └──────────────────────────────┘
```

Cykliczny robot pobiera najnowszy webinar lub podcast, automatycznie wyszukuje najpopularniejsze momenty (AI Clipper), nanosi animowane napisy karaoke (styl Hormozi / MrBeast), dołącza animowane logo marki i symultanicznie publikuje klip na TikTok, YouTube Shorts i Instagram Reels.

### Receptura 3: Autonomiczny Rój Konsensusu z Samonaprawą (Swarm Fan-Out & Self-Healing)

```
┌──────────────────┐     ┌─────────────────────┐     ┌───────────────────────────────┐
│  core_io.input   │────▶│  agent.swarm_fanout │────▶│   agent.consensus_aggregate   │
└──────────────────┘     └─────────────────────┘     └───────────────────────────────┘
                                                                     │
                                     ┌───────────────────────────────┘
                                     ▼
                         ┌───────────────────────┐     ┌───────────────────────────────┐
                         │  agent.critique_loop  │────▶│      agent.self_healing       │
                         └───────────────────────┘     └───────────────────────────────┘
```

Trzy niezależne instancje agentów generują propozycje strategii marketingowej. Węzeł `agent.consensus_aggregate` dokonuje syntezy ich ocen w oparciu o quorum, pętla `critique_loop` testuje zgodność z wytycznymi, a węzeł `self_healing` dynamicznie koryguje ewentualne błędy wykonawcze bez angażowania człowieka.
