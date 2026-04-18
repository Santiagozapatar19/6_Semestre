# Test Cases

## Detection
- Caso 1:
- Caso 2:

## Classification
- Caso 1:
- Caso 2:

## Transformation
- Case 1: Rewrite hardcoded password to environment variable
	- Goal: ensure `HARDCODED_SECRET` lines are rewritten safely.
	- Input snippet: `password = "admin123"`
	- Expected result: transformed line `password = os.getenv("APP_PASSWORD")` and action `REWRITE_SECRET`.

- Case 2: Rewrite hardcoded API key to environment variable
	- Goal: ensure `HARDCODED_API_KEY` lines are rewritten to `os.getenv`.
	- Input snippet: `api_key = "ABCD1234XYZ9876"`
	- Expected result: transformed line `api_key = os.getenv("API_KEY")` and action `REWRITE_API_KEY`.

- Case 3: Remove sensitive print statement
	- Goal: prevent leakage of sensitive values through output.
	- Input snippet: `print(password)`
	- Expected result: transformed line `# Sensitive output removed` and action `REMOVE_PRINT`.

- Case 4: Preserve safe lines
	- Goal: avoid modifying lines that are not security-relevant.
	- Input snippet: `x = 5`
	- Expected result: unchanged line and action `KEEP`.

- Case 5: Add `import os` when needed
	- Goal: insert `import os` once when a rewrite introduces `os.getenv(...)` and import is missing.
	- Input snippet:
		- `password = "admin123"`
		- `print("ok")`
	- Expected result:
		- output starts with `import os`
		- `added_import_os = true`

- Case 6: Do not duplicate `import os`
	- Goal: keep imports clean when `import os` already exists.
	- Input snippet:
		- `import os`
		- `password = "admin123"`
	- Expected result:
		- rewritten password line
		- only one `import os` in output
		- `added_import_os = false`

- Case 7: End-to-end transformation metadata
	- Goal: verify `TransformationResult` consistency.
	- Input snippet: sample file with secret, api key, and sensitive print.
	- Expected result:
		- `changed = true`
		- `transformations` includes line number, input symbol, action, original, transformed
		- `transformed_source` reflects all expected edits

## Validation
- Case 1: Valid flat config with env reference
	- Goal: accept sensitive keys only when using `${IDENTIFIER}`.
	- Input snippet:
		- `MODE="prod"`
		- `DB_PASSWORD=${SECURE_DB_PASSWORD}`
	- Expected result: valid, no errors.

- Case 2: Sensitive key with literal is rejected
	- Goal: enforce secure handling of secrets.
	- Input snippet: `DB_PASSWORD="admin123"`
	- Expected result: invalid, at least one error.

- Case 3: Nested sections with secure password
	- Goal: accept recursive sections with balanced braces.
	- Input snippet:
		- `section app {`
		- `section database {`
		- `DB_PASSWORD=${SECURE_DB_PASSWORD}`
		- `}`
		- `}`
	- Expected result: valid, no errors.

- Case 4: Non-sensitive values accept literals
	- Goal: allow normal keys with string/number/boolean values.
	- Input snippet:
		- `MODE="prod"`
		- `PORT=8080`
		- `DEBUG=true`
	- Expected result: valid, no errors.

- Case 5: Invalid env reference format
	- Goal: reject `${ID}` values that do not match the `ID` token.
	- Input snippet: `DB_PASSWORD=${DB-PASSWORD}`
	- Expected result: invalid, syntax error.

- Case 6: Unbalanced braces
	- Goal: reject malformed structure.
	- Input snippet: `section app { MODE="prod"`
	- Expected result: invalid, syntax error.

- Case 7: Missing value
	- Goal: reject assignments without a value.
	- Input snippet: `MODE=`
	- Expected result: invalid, syntax error.
