# chomsky

## Integrantes
- Integrante 1: Santiago Zapata Rodriguez A00404790
- Integrante 2: Juan Jose Vidarte Ramos A00404744
- Integrante 3: Isaac Chaves Gomez 

## Usuario GitHub
- Usuario: 

## Descripcion
Proyecto base para 4 modulos de analisis formal:
- Modulo 1: Deteccion (Regex)
- Modulo 2: Clasificacion (DFA con pyformlang)
- Modulo 3: Transformacion (FST)
- Modulo 4: Validacion (CFG con textX)

## Estructura
- src/main.py (CLI entrypoint)
- src/cli.py (argumentos y presentacion)
- src/detection
- src/classification
- src/transformation
- src/validation
- tests
- data/samples
- docs

## Instalacion

### 1. Crear entorno virtual
```bash
python -m venv venv
```

### 2. Activar entorno virtual
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

## Ejecucion

### Flujo rapido en Windows (PowerShell)
```powershell
cd .\chomsky
py -m venv venv
.\venv\Scripts\Activate.ps1
py -m src.main
```

Ejemplo real desde el menu interactivo:
- Opcion `1` (Detection) permite analizar texto o archivo.
- Con archivo, puedes usar: `data/samples/detection/insecure.py`.
- Opcion `2` (Classification) permite clasificar texto o archivo usando el DFA.
- Opcion `4` (Validation) valida archivos de configuracion separados, por ejemplo `data/samples/pipeline_config.env`.
- Opcion `5` (Full Analysis) ejecuta los 4 modulos en secuencia sobre un archivo fuente.
- Opcion `0` sale del menu.

### Correr todos los tests
```bash
pytest tests/
```

### Correr tests de un modulo especifico
```bash
pytest tests/test_detection.py
pytest tests/test_classification.py
pytest tests/test_transformation.py
pytest tests/test_validation.py
```

### Ejecutar modulos individuales
Los modulos estan en `src/`:
```bash
python -m src.detection
python -m src.classification
python -m src.transformation
python -m src.validation
```

### Ejecutar CLI del proyecto
```bash
python -m src.main --help

python -m src.main

python -m src.main detection "password = \"admin123\""
python -m src.main detection --file data/samples/detection/insecure.py
python -m src.main --format json detection --file data/samples/detection/insecure.py

py -m src.main classification "password = \"admin123\""
py -m src.main classification --file data/samples/classification/needs_review.py
py -m src.main transformation --file data/samples/transformation/insecure.py

py -m src.main validation "DB_PASSWORD=${SECURE_DB_PASSWORD}"
py -m src.main validation --file data/samples/pipeline_config.env

py -m src.main analyze --file data/samples/pipeline_test.py
```
 
Notas:
- `python -m src.main` (sin argumentos) abre un menu interactivo para probar los modulos.
- `detection` ya esta conectado al motor real de regex y acepta texto directo o `--file`.
- `classification` ya esta conectado al modulo DFA real y acepta texto directo o `--file`.
- `analyze` ejecuta Detection, Classification, Transformation y Validation en secuencia sobre un archivo fuente.
- `validation` acepta texto directo o `--file`, pero la validacion formal esta pensada para archivos de configuracion como `.env`, `.cfg`, `.conf`, `.ini` o `.txt`.
- Si `analyze` recibe un archivo `.py`, omite Validation y muestra el paso como `skipped`.
- `--format` es una opcion global del CLI, por eso debe ir antes del subcomando.
- `transformation` ya esta conectado al motor real de FST y acepta texto directo o `--file`.

## Samples
- `data/samples/pipeline_test.py` - archivo fuente para probar el pipeline completo.
- `data/samples/pipeline_config.env` - archivo de configuracion para probar Validation por separado.

## Documentacion
- [design.md](docs/design.md) - Especificacion de funciones, inputs y outputs
- [formalization.md](docs/formalization.md) - 5-tuplas, BNF y justificaciones
- [test-cases.md](docs/test-cases.md) - Casos de prueba
- [literature-review.md](docs/literature-review.md) - Referencias teoricas
