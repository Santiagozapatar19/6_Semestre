# Formalization 

This document presents the formal definition of each regular expression used in the Detection module of Chomsky. For each pattern, the regular expression is stated, the language it recognizes is described formally, and concrete examples of accepted and rejected strings are provided.

---

## Module 1: Detection (Regular Expressions)


## Theoretical Background

At the lexical level, source code and configuration files are treated as strings over a finite alphabet Σ (the set of printable ASCII characters). Regular expressions define regular languages over Σ, and Python's `re` module applies these expressions line by line to detect substrings that match known insecure patterns.

Each match produces a **label** (e.g., `HARDCODED_PASSWORD`) that abstracts away the raw text. This labeled sequence becomes the input alphabet for the Finite Automaton in Module 2 (Classification).

---

## Pattern 1 — `HARDCODED_PASSWORD`

**Regular Expression:**
```
(?i)(password|passwd|pwd|secret|token)\s*=\s*["'](?!\$\{).+?["']
```

**Language recognized:**  
The set of strings that contain a case-insensitive occurrence of any of the keywords `password`, `passwd`, `pwd`, `secret`, or `token`, followed by optional whitespace, the `=` operator, optional whitespace, and a non-empty quoted value (single or double quotes) that does **not** begin with `${`. The negative lookahead `(?!\$\{)` ensures that environment variable references such as `${APP_PASSWORD}` are not flagged as violations.

**Formal description:**  
Let K = {`password`, `passwd`, `pwd`, `secret`, `token`} (case-insensitive). The pattern recognizes lines of the form:

```
k \s* = \s* ["'] v ["']
```

where k ∈ K, `\s*` denotes zero or more whitespace characters, and v is any non-empty string that does not start with `${`.

**Accepted strings:**
| String | Reason |
|--------|--------|
| `password = "admin123"` | Keyword + quoted literal value |
| `PASSWORD = 'secret'` | Case-insensitive match |
| `passwd = "root"` | Alternative keyword |
| `token = "eyJhbGci..."` | Token keyword with literal value |

**Rejected strings:**
| String | Reason |
|--------|--------|
| `password = os.getenv("APP_PASSWORD")` | Value is not quoted directly |
| `password = "${APP_PASSWORD}"` | Negative lookahead blocks `${` prefix |
| `max_retries = 3` | Keyword not in K |
| `# password hint: use something strong` | No assignment operator |

---

## Pattern 2 — `API_KEY` (AWS Access Key)

**Regular Expression:**
```
\bAKIA[0-9A-Z]{16}\b
```

**Language recognized:**  
The set of strings containing a word-boundary-delimited token that starts with the literal prefix `AKIA` followed by exactly 16 characters from the set `[0-9A-Z]`. This pattern is specific to the AWS Access Key ID format, which always follows this structure.

**Formal description:**  
The pattern recognizes tokens of the form:

```
AKIA c₁c₂...c₁₆
```

where each cᵢ ∈ {`0`–`9`, `A`–`Z`}, and the token is surrounded by word boundaries `\b`.

**Accepted strings:**
| String | Reason |
|--------|--------|
| `AKIA1234567890ABCDEF` | Valid AWS key format — 4 prefix + 16 chars |
| `key = "AKIA0000000000000000"` | Embedded in an assignment |

**Rejected strings:**
| String | Reason |
|--------|--------|
| `AKIA123` | Only 3 characters after prefix — too short |
| `akia1234567890abcdef` | Lowercase — does not match `[0-9A-Z]` |
| `BKIA1234567890ABCDEF` | Wrong prefix |

---

## Pattern 3 — `HARDCODED_API_KEY` (Generic API Key)

**Regular Expression:**
```
(?i)\b(api[_-]?key|apikey|access_key|auth_token)\s*=\s*["'][^"']{10,}["']
```

**Language recognized:**  
The set of strings containing a case-insensitive occurrence of a generic API key keyword (`api_key`, `api-key`, `apikey`, `access_key`, or `auth_token`), followed by `=` with optional surrounding whitespace, and a quoted string value of **at least 10 characters**. The minimum length of 10 is intentional to reduce false positives from short test values.

**Formal description:**  
Let G = {`api_key`, `api-key`, `apikey`, `access_key`, `auth_token`} (case-insensitive). The pattern recognizes lines of the form:

```
g \s* = \s* ["'] v ["']
```

where g ∈ G and |v| ≥ 10, with v ∈ ([^"'])*

**Accepted strings:**
| String | Reason |
|--------|--------|
| `api_key = "supersecretkey123"` | Keyword match, value ≥ 10 chars |
| `ACCESS_KEY = 'abcdefghij'` | Case-insensitive, exactly 10 chars |
| `auth_token = "Bearer eyJhbGci..."` | Token keyword with long value |

**Rejected strings:**
| String | Reason |
|--------|--------|
| `api_key = "abc"` | Value is only 3 characters — below threshold |
| `api_key = os.getenv("KEY")` | Value is not a quoted literal |
| `my_api_key_hint = "see docs"` | Not a direct assignment keyword match |

---

## Pattern 4 — `IP_ADDRESS`

**Regular Expression:**
```
\b(?:\d{1,3}\.){3}\d{1,3}\b
```

**Language recognized:**  
The set of strings containing a token of the form `d.d.d.d` where each `d` is a sequence of 1 to 3 decimal digits, surrounded by word boundaries. This covers the syntactic structure of IPv4 addresses. Note that the pattern does not validate numeric range (i.e., values above 255 per octet are syntactically matched), which is an accepted trade-off for simplicity at the lexical level.

**Formal description:**  
The pattern recognizes tokens of the form:

```
d₁ . d₂ . d₃ . d₄
```

where each dᵢ ∈ `\d{1,3}` (1 to 3 decimal digits) and the token is surrounded by `\b` word boundaries.

**Accepted strings:**
| String | Reason |
|--------|--------|
| `192.168.1.1` | Standard private IPv4 address |
| `127.0.0.1` | Loopback address |
| `10.0.0.5` | Private network address |
| `"http://10.0.0.5:8080/api"` | IP embedded in a URL |

**Rejected strings:**
| String | Reason |
|--------|--------|
| `192.168.1` | Only three octets — incomplete |
| `"version 1.2.3"` | Only three dot-separated groups |
| `localhost` | Hostname, not an IP literal |

---

## Pattern 5 — `PRINT_CALL`

**Regular Expression:**
```
\bprint\s*\(.+\)
```

**Language recognized:**  
The set of strings containing a call to Python's built-in `print` function — the keyword `print` followed by optional whitespace and a non-empty parenthesized argument list. This pattern is relevant not in isolation but in combination with `HARDCODED_PASSWORD` or `API_KEY`, where printing a sensitive variable constitutes a stronger security violation (detected in Module 2 — Classification).

**Formal description:**  
The pattern recognizes substrings of the form:

```
print \s* ( v )
```

where v is any non-empty string (`.+` — one or more characters).

**Accepted strings:**
| String | Reason |
|--------|--------|
| `print(password)` | Direct print of a variable |
| `print(f"key={api_key}")` | f-string exposing a sensitive variable |
| `print("Starting server...")` | Any print call is flagged |

**Rejected strings:**
| String | Reason |
|--------|--------|
| `print()` | Empty argument — `.+` requires at least one character |
| `sprint(x)` | Word boundary `\b` prevents partial matches |
| `# print(password)` | Commented-out line — pattern still matches; acceptable trade-off |

---

## Pattern 6 — `SUSPICIOUS_URL`

**Regular Expression:**
```
\bhttp://[^\s]+
```

**Language recognized:**  
The set of strings containing a URL that uses the insecure `http://` scheme (as opposed to `https://`). The pattern matches the literal `http://` followed by one or more non-whitespace characters. URLs using `https://` are explicitly excluded since they use encrypted transport.

**Formal description:**  
The pattern recognizes substrings of the form:

```
http:// c₁c₂...cₙ
```

where each cᵢ ∈ Σ \ {whitespace} and n ≥ 1.

**Accepted strings:**
| String | Reason |
|--------|--------|
| `http://internal-api.company.com` | Insecure scheme |
| `http://10.0.0.5:8080/api` | HTTP to an internal IP |
| `url = "http://corp.internal/v1"` | Embedded in an assignment |

**Rejected strings:**
| String | Reason |
|--------|--------|
| `https://api.example.com` | Secure scheme — not matched |
| `ftp://files.server.com` | Different scheme — not matched |
| `http://` | No characters after `://` — `.+` requires at least one |

---

## Pattern 7 — `TODO_COMMENT`

**Regular Expression:**
```
#\s*TODO.*
```

**Language recognized:**  
The set of strings containing a Python comment that begins with `#`, followed by optional whitespace and the keyword `TODO`, followed by any characters (including an empty remainder). This pattern identifies deferred work items that may indicate unresolved security issues left in the codebase.

**Formal description:**  
The pattern recognizes substrings of the form:

```
# \s* TODO .*
```

where `\s*` is zero or more whitespace characters and `.*` is any sequence of zero or more characters.

**Accepted strings:**
| String | Reason |
|--------|--------|
| `# TODO: remove hardcoded password` | Standard TODO with colon |
| `# TODO fix this later` | TODO without colon |
| `#TODO` | No space before TODO — `\s*` allows zero spaces |

**Rejected strings:**
| String | Reason |
|--------|--------|
| `# todo: lowercase` | Pattern is case-sensitive — `TODO` must be uppercase |
| `# FIXME: also urgent` | Different keyword |
| `x = "# TODO inside string"` | Pattern still matches — acceptable trade-off at lexical level |

---

## Why Regular Expressions Are Sufficient for Detection

The Detection module operates at the **lexical level** — it treats each line of source code as an independent string over a finite alphabet. The patterns defined above recognize **flat, non-nested** textual structures: keyword-value assignments, token formats, and comment markers. None of these require counting, balancing, or reasoning about hierarchical structure.

This is precisely the class of problems that regular languages handle optimally. A finite automaton can recognize each of these patterns without a stack or memory beyond its current state. For this reason, regular expressions are both theoretically justified and practically sufficient for the Detection stage.

Structural validation — such as balanced braces in configuration blocks or nested sections — is beyond the expressive power of regular languages and is handled in Module 4 (Validation) using a Context-Free Grammar.

---

## Module 2: Classification (Deterministic Finite Automata)

The Classification module consumes the ordered label sequence produced by Module 1 and assigns one of three categories:

- `Security Violation`
- `Needs Review`
- `Safe`

Internally, the implementation uses three DFAs and a priority rule:

1. Evaluate Violation DFA.
2. If not accepted, evaluate Needs Review DFA.
3. If not accepted, return Safe.

This is equivalent to a deterministic decision function over the same finite alphabet.

### Common Alphabet

Let the DFA input alphabet be:

$$
\Sigma_L = \{\text{HARDCODED_PASSWORD},\ \text{API_KEY},\ \text{HARDCODED_API_KEY},\ \text{IP_ADDRESS},\ \text{PRINT_CALL},\ \text{SUSPICIOUS_URL},\ \text{TODO_COMMENT}\}
$$

Define subsets used in transitions:

$$
C = \{\text{HARDCODED_PASSWORD},\ \text{API_KEY},\ \text{HARDCODED_API_KEY}\}
$$

$$
E = \{\text{PRINT_CALL},\ \text{IP_ADDRESS},\ \text{SUSPICIOUS_URL}\}
$$

where $C$ are credential-related labels and $E$ are escalation labels.

---

### DFA 1: Violation Automaton

This automaton accepts sequences that represent a critical exposure.

Formal tuple:

$$
M_V = (Q_V, \Sigma_L, \delta_V, q_0, F_V)
$$

with:

- $Q_V = \{q_0, q_1, q_2\}$
- $q_0 =$ Start
- $q_1 =$ FoundCredential
- $q_2 =$ Violation
- $F_V = \{q_2\}$

Transition function:

- From $q_0$:
	- For every $x \in C$: $\delta_V(q_0, x) = q_1$
	- For every $x \in \Sigma_L \setminus C$: $\delta_V(q_0, x) = q_0$
- From $q_1$:
	- For every $x \in E$: $\delta_V(q_1, x) = q_2$
	- For every $x \in C$: $\delta_V(q_1, x) = q_1$
	- $\delta_V(q_1, \text{TODO_COMMENT}) = q_1$
- From $q_2$:
	- For every $x \in \Sigma_L$: $\delta_V(q_2, x) = q_2$

Language recognized:

$$
L_V = \{ w \in \Sigma_L^* \mid M_V \text{ accepts } w \}
$$

Intuition: a credential appears and later an escalation signal appears.

---

### DFA 2: Needs Review Automaton

This automaton accepts medium-risk sequences that should be reviewed but are not immediately critical under project rules.

Formal tuple:

$$
M_R = (Q_R, \Sigma_L, \delta_R, r_0, F_R)
$$

with:

- $Q_R = \{r_0, r_1, r_2, r_3, r_4\}$
- $r_0 =$ Start
- $r_1 =$ FoundCredential
- $r_2 =$ FoundSuspicious
- $r_3 =$ NeedsReview
- $r_4 =$ ViolationTrap
- $F_R = \{r_1, r_2, r_3\}$

Transition function:

- From $r_0$:
	- For every $x \in C$: $\delta_R(r_0, x) = r_1$
	- For $x \in \{\text{SUSPICIOUS_URL}, \text{IP_ADDRESS}, \text{TODO_COMMENT}\}$: $\delta_R(r_0, x) = r_2$
	- $\delta_R(r_0, \text{PRINT_CALL}) = r_0$
- From $r_1$:
	- For every $x \in E$: $\delta_R(r_1, x) = r_4$
	- For every $x \in C$: $\delta_R(r_1, x) = r_1$
	- $\delta_R(r_1, \text{TODO_COMMENT}) = r_3$
- From $r_2$:
	- For every $x \in C$: $\delta_R(r_2, x) = r_3$
	- For $x \in \{\text{SUSPICIOUS_URL}, \text{IP_ADDRESS}, \text{TODO_COMMENT}, \text{PRINT_CALL}\}$: $\delta_R(r_2, x) = r_2$
- From $r_3$:
	- For every $x \in \Sigma_L$: $\delta_R(r_3, x) = r_3$
- From $r_4$:
	- For every $x \in \Sigma_L$: $\delta_R(r_4, x) = r_4$

Language recognized:

$$
L_R = \{ w \in \Sigma_L^* \mid M_R \text{ accepts } w \}
$$

Intuition: suspicious signals are present, but without entering the critical escalation pattern captured by the Violation DFA.

---

## Module 3: Transformation (Finite-State Transducer)

The Transformation module consumes abstract line symbols and emits deterministic rewrite actions. Unlike Module 2 (accept/reject), this machine is a transducer: each transition produces output.

### Common Alphabets

Input alphabet:

$$
\Sigma_T = \{\text{HARDCODED_SECRET},\ \text{HARDCODED_API_KEY},\ \text{SENSITIVE_PRINT},\ \text{OTHER}\}
$$

Output alphabet:

$$
\Gamma_T = \{\text{REWRITE_SECRET},\ \text{REWRITE_API_KEY},\ \text{REMOVE_PRINT},\ \text{KEEP}\}
$$

### FST Definition

Let the transducer be:

$$
T = (Q_T, \Sigma_T, \Gamma_T, \delta_T, q_0, F_T)
$$

with:

- $Q_T = \{q_0\}$
- $q_0$ initial state
- $F_T = \{q_0\}$ final states

Transition/output function:

$$
\delta_T(q_0, \text{HARDCODED_SECRET}) = (q_0, \text{REWRITE_SECRET})
$$

$$
\delta_T(q_0, \text{HARDCODED_API_KEY}) = (q_0, \text{REWRITE_API_KEY})
$$

$$
\delta_T(q_0, \text{SENSITIVE_PRINT}) = (q_0, \text{REMOVE_PRINT})
$$

$$
\delta_T(q_0, \text{OTHER}) = (q_0, \text{KEEP})
$$

Because the machine has a single state with self-loops, it behaves as a line-by-line deterministic decision map over classified symbols.

### Rewrite Semantics

- `REWRITE_SECRET`: replace hardcoded secrets with `os.getenv("APP_<NAME>")`.
- `REWRITE_API_KEY`: replace hardcoded API keys with `os.getenv("<NAME>")`.
- `REMOVE_PRINT`: replace sensitive print lines with a safe comment.
- `KEEP`: leave line unchanged.

If at least one rewrite introduces environment lookups and `import os` is absent, the transformer prepends `import os`.

---

## Module 4: Validation (Context-Free Grammar)

The Validation module checks the structure of configuration files with nested sections and enforces a rule: **sensitive keys must use environment variable references** in the form `${IDENTIFIER}`.

### Grammar (EBNF)

Start symbol: `Config`

```
Config: entries*=Entry;
Entry: Section | Assignment;
Section: 'section' name=ID '{' entries*=Entry '}';
Assignment: key=ID '=' value=Value;
Value: EnvReference | StringValue | NumberValue | BooleanValue;
EnvReference: '${' name=ID '}';
StringValue: /"[^"\n]*"|'[^'\n]*'/;
NumberValue: /-?\d+(\.\d+)?/;
BooleanValue: /true|false/;
```

**Terminals and non-terminals:**
- Terminals: `section`, `{`, `}`, `=`, `${`, `}` and the textX `ID`, `STRING`-like tokens defined in `StringValue`, `NumberValue`, `BooleanValue`.
- Non-terminals: `Config`, `Entry`, `Section`, `Assignment`, `Value`, `EnvReference`.

### Policy rule (semantic constraint)

Let `SENSITIVE` be the set of keywords `{PASSWORD, SECRET, TOKEN, API_KEY, ACCESS_KEY, AUTH_TOKEN}`. An `Assignment` with key `k` is valid only if:

$$
k \text{ contains a token in } SENSITIVE \Rightarrow value \in EnvReference
$$

### Why the language is not regular

The grammar allows **recursive nesting of sections** and requires **matched braces**. The language of balanced and nested delimiters is not regular (it requires unbounded memory to count and match `{` and `}`), but it is context-free. Therefore a CFG is required for structural validation, while regex/FA are insufficient.

### Accepted examples

```
section app {
	MODE="prod"
	section database {
		DB_PASSWORD=${SECURE_DB_PASSWORD}
	}
}
```

```
API_KEY=${API_KEY}
```

### Rejected examples

```
DB_PASSWORD="admin123"
```

```
section app { MODE="prod"
```

---

### DFA 3: Safe Automaton

This automaton accepts only empty sequences or sequences containing only `PRINT_CALL`.

Formal tuple:

$$
M_S = (Q_S, \Sigma_L, \delta_S, s_0, F_S)
$$

with:

- $Q_S = \{s_0, s_1, s_2\}$
- $s_0 =$ Start
- $s_1 =$ OnlyPrint
- $s_2 =$ UnsafeTrap
- $F_S = \{s_0, s_1\}$

Transition function:

- From $s_0$:
	- $\delta_S(s_0, \text{PRINT_CALL}) = s_1$
	- For every $x \in \Sigma_L \setminus \{\text{PRINT_CALL}\}$: $\delta_S(s_0, x) = s_2$
- From $s_1$:
	- $\delta_S(s_1, \text{PRINT_CALL}) = s_1$
	- For every $x \in \Sigma_L \setminus \{\text{PRINT_CALL}\}$: $\delta_S(s_1, x) = s_2$
- From $s_2$:
	- For every $x \in \Sigma_L$: $\delta_S(s_2, x) = s_2$

Language recognized:

$$
L_S = \{\epsilon\} \cup \{\text{PRINT_CALL}^n \mid n \ge 1\}
$$

---

### Final Classification Function

Let $w \in \Sigma_L^*$ be the label sequence extracted from source code. The module decision is:

$$
\operatorname{class}(w) =
\begin{cases}
\mathrm{Security\ Violation}, & w \in L_V \\
\mathrm{Needs\ Review}, & w \in L_R \land w \notin L_V \\
\mathrm{Safe}, & \text{otherwise}
\end{cases}
$$

This priority order is important: even if a sequence could satisfy a review pattern, a violation match dominates.

### Examples

- $w = [\text{HARDCODED_PASSWORD}, \text{PRINT_CALL}] \Rightarrow \text{Security Violation}$
- $w = [\text{TODO_COMMENT}] \Rightarrow \text{Needs Review}$
- $w = [] \Rightarrow \text{Safe}$
- $w = [\text{PRINT_CALL}, \text{PRINT_CALL}] \Rightarrow \text{Safe}$
