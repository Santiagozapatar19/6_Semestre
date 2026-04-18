# Design

## Modulo 1: detection (Regex)
- Funciones:
- Inputs:
- Outputs:

## Modulo 2: classification (DFA)
- Funciones:
- Inputs:
- Outputs:

## Module 3: Transformation (FST)
- Functions:
	- `classify_line(line: str) -> str`: classifies each source line into abstract FST input symbols (`HARDCODED_SECRET`, `HARDCODED_API_KEY`, `SENSITIVE_PRINT`, `OTHER`).
	- `build_transformation_fst() -> FST`: builds the one-state deterministic finite-state transducer using `pyformlang`.
	- `run_fst_on_symbols(symbols: list[str]) -> list[str]`: maps the input symbol sequence to an output action sequence (`REWRITE_SECRET`, `REWRITE_API_KEY`, `REMOVE_PRINT`, `KEEP`).
	- `transform_source(source_code: str) -> TransformationResult`: applies FST actions line by line and reconstructs the transformed source code.
- Inputs:
	- `source_code` (string): multi-line source code to transform.
	- Input symbol sequence produced by `classify_line`.
	- FST transition definitions (`TRANSITION_DEFINITIONS` in `fst_model.py`).
- Outputs:
	- `TransformationResult` with:
		- `original_source` (string): original input source.
		- `transformed_source` (string): rewritten source after transformations.
		- `transformations` (list[`Transformation`]): line-level transformation records.
		- `added_import_os` (bool): indicates whether `import os` was inserted.
		- `changed` (bool): `True` when at least one transformation occurred or `import os` was added.
	- Each `Transformation` record includes:
		- `line_number` (int)
		- `input_symbol` (str)
		- `action` (str)
		- `original` (str)
		- `transformed` (str)

## Module 4: Validation (CFG)
- Functions:
	- `Validator.validate(text: str) -> dict`: parses the configuration using a CFG and enforces the rule that sensitive keys must use environment variable references.
- Inputs:
	- `text` (string): configuration content to validate.
	- CFG grammar (textX): definitions for sections, assignments, and values.
	- `SENSITIVE` (tuple of strings): keywords that mark a key as sensitive.
- Outputs:
	- Validation result dictionary with keys:
		- `valid` (bool): whether the configuration is accepted.
		- `errors` (list[str]): syntax or policy violations.
