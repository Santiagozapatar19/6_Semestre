# Notas del proyecto (Servicios, Controllers, DTOs y Modelos)

## 1. Arquitectura general

El proyecto sigue una separacion por capas:

- **Controller**: recibe la request HTTP, valida flujo basico, llama al servicio y devuelve response HTTP.
- **Service**: contiene la logica de negocio y acceso a datos (MongoDB con Mongoose).
- **Model**: define el esquema y el tipo de documento almacenado en la base de datos.
- **DTO (Data Transfer Object)**: define la forma de los datos de entrada para crear o actualizar.

Esta separacion ayuda a mantener codigo limpio, reusable y facil de probar.

---

## 2. Por que los metodos son de tipo Promise

En este proyecto se usa MongoDB con Mongoose. Casi todas las operaciones de base de datos son **asincronas**:

- buscar (`find`, `findOne`, `findById`)
- crear (`create`)
- actualizar (`findOneAndUpdate`, `findByIdAndUpdate`)
- eliminar logico (actualizar `deletedAt`)

Como esas operaciones tardan tiempo (I/O), TypeScript/JavaScript las maneja con `Promise`.

Ejemplo conceptual:

- `Promise<BoardDocument>`: devuelve un board cuando termina.
- `Promise<BoardDocument | null>`: puede devolver un board o `null` si no existe.
- `Promise<boolean>`: devuelve `true/false` segun si la operacion afecto un registro.

`async/await` se usa para escribir logica asincrona de forma mas legible.

---

## 3. Logica de metodos en Services (CRUD)

### 3.1 Crear (`create`)

Patron comun:

1. Verificar reglas de negocio.
2. Crear el documento.
3. (Opcional) sincronizar relaciones.

#### BoardService.create

```typescript
public async create(boardInput: BoardInput): Promise<BoardDocument> {
    const boardExists: BoardDocument | null = await this.findByName(boardInput.name);
    if (boardExists !== null) {
        throw new Error("Board already exists");
    }
    return BoardModel.create(boardInput);
}
```

**Explicacion**:
- `await this.findByName(...)`: busca si existe un board con ese nombre.
- Si `boardExists !== null`: significa que encontro uno, asi que lanza error.
- Si no existe: `BoardModel.create(boardInput)` crea el nuevo board.
- `Promise<BoardDocument>`: cuando todo esta ok, devuelve el documento creado.

#### ThreadService.create

```typescript
public async create(threadInput: ThreadInput): Promise<ThreadDocument> {
    const boardExists = await BoardModel.findById(threadInput.boardId).exec();
    if (!boardExists) {
        throw new ReferenceError(`Board with id ${threadInput.boardId} not found`);
    }
    return ThreadModel.create({
        ...threadInput,
        replies: threadInput.replies ?? [],
    });
}
```

**Explicacion**:
- `BoardModel.findById(threadInput.boardId)`: verifica que el board exista.
- Si es falsy (no existe): lanza `ReferenceError`.
- `replies: threadInput.replies ?? []`: si `replies` viene undefined, asigna array vacio.
- `...threadInput`: spread operator expande los datos del DTO.

#### ReplyService.create

```typescript
public async create(replyInput: ReplyInput): Promise<ReplyDocument> {
    const threadExists = await ThreadModel.findOne({ _id: replyInput.threadId, deletedAt: null }).exec();
    if (!threadExists) {
        throw new ReferenceError(`Thread with id ${replyInput.threadId} not found`);
    }

    const newReply = await ReplyModel.create(replyInput);
    await ThreadModel.findByIdAndUpdate(replyInput.threadId, {
        $push: { replies: newReply._id },
    }).exec();

    return newReply;
}
```

**Explicacion**:
- Verifica thread con `deletedAt: null` (solo activos).
- Crea la respuesta.
- `$push`: operador MongoDB que agrega el id de la respuesta al arreglo `replies` del thread.
- Devuelve la respuesta creada.
- Esta sincronizacion de relaciones es clave para mantener consistencia.

### 3.2 Leer (`getAll`, `getById`, `getByBoardId`)

Patron comun:

- Consultar datos.
- Filtrar por `deletedAt: null` cuando se desea excluir eliminados.
- Usar `populate` cuando se quieren traer relaciones completas.

#### BoardService - getAll y getById

```typescript
public getAll(): Promise<BoardDocument[]> {
    return BoardModel.find({ deletedAt: null }).exec();
}

public getById(id: string): Promise<BoardDocument | null> {
    return BoardModel.findOne({ _id: id, deletedAt: null }).exec();
}
```

**Explicacion**:
- `find({ deletedAt: null })`: trae todos los boards no eliminados.
- `findOne({ _id: id, deletedAt: null })`: trae uno especifico si existe y no esta eliminado.
- `.exec()`: confirma la ejecucion de la query.
- `Promise<BoardDocument[]>`: devuelve arreglo de boards.
- `Promise<BoardDocument | null>`: puede devolver un document o `null` si no existe.

#### ThreadService - getById con populate

```typescript
public async getById(id: string): Promise<ThreadDocument | null> {
    return ThreadModel.findById(id).populate("boardId").populate("replies").exec();
}
```

**Explicacion**:
- `populate("boardId")`: resuelve el id del board a un objeto completo del board.
- `populate("replies")`: resuelve cada id de respuesta a su documento completo.
- Sin populate: `replies` seria solo un arreglo de ids (`["objid1", "objid2", ...]`).
- Con populate: `replies` trae los documentos completos de todas las respuestas.
- Ventaja: no necesitas hacer consultas manuales adicionales.

#### ThreadService - getByBoardId (custom)

```typescript
public async getByBoardId(boardId: string): Promise<ThreadDocument[]> {
    return ThreadModel.find({ boardId, deletedAt: null })
        .populate("boardId")
        .populate("replies")
        .exec();
}
```

**Explicacion**:
- Filtra threads por board especifico.
- Solo trae no eliminados (`deletedAt: null`).
- Populate resuelve las relaciones.

### 3.3 Actualizar (`update`)

Patron comun:

- Buscar por id (y en varios casos solo no eliminados).
- Aplicar cambios parciales.
- Devolver documento o `null` si no existe.

#### BoardService.update

```typescript
public async update(id: string, boardInput: BoardInputUpdate): Promise<BoardDocument | null> {
    try {
        const board: BoardDocument | null = await BoardModel.findOneAndUpdate(
            { _id: id, deletedAt: null },
            boardInput,
            { returnDocument: "after" }
        );
        return board;
    } catch (error) {
        throw error;
    }
}
```

**Explicacion**:
- `findOneAndUpdate`: busca por filtro, actualiza campos, devuelve resultado.
- Filtro `{ _id: id, deletedAt: null }`: solo actualiza si existe y no esta eliminado.
- `boardInput`: contiene solo los campos que se quieren cambiar (DTO con opcionales).
- `{ returnDocument: "after" }`: devuelve el documento DESPUES de actualizar.
- Si no encuentra el documento: devuelve `null`.
- `Promise<BoardDocument | null>` refleja que puede no existir.

#### ThreadService.update

```typescript
public async update(id: string, threadInput: ThreadInputUpdate): Promise<ThreadDocument | null> {
    try {
        const thread: ThreadDocument | null = await ThreadModel.findOneAndUpdate(
            { _id: id},
            threadInput,
            { returnOriginal: true }
        );
        return thread;
    } catch (error) {
        throw new Error(`Error updating thread with id ${id}: ${error}`);
    }
}
```

**Explicacion**:
- Similar a board, pero note que aqui no filtra por `deletedAt`.
- `{ returnOriginal: true }`: devuelve documento ANTES de actualizar (diferente a board).
- `catch`: captura y relanza errorcon contexto mas claro.
- Inconsistencia a considerar: boards valida `deletedAt: null`, pero threads no.

### 3.4 Eliminar (`delete`) - borrado logico

En lugar de borrar fisicamente, se guarda fecha en `deletedAt`.

#### BoardService.delete

```typescript
public async delete(id: string): Promise<boolean> {
    try {
        const result = await BoardModel.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { deletedAt: new Date() }
        );
        return result !== null;
    } catch (error) {
        throw error;
    }
}
```

**Explicacion**:
- No borra fisicamente; actualiza `deletedAt` con la fecha actual.
- Filtra por `deletedAt: null` para solo marcar activos como eliminados.
- `result !== null`: si encuentra documento, `result` contiene el dato antes del cambio.
- Devuelve `true` si el registro fue marcado como eliminado, `false` si no existia.
- `Promise<boolean>` es conveniente para saber si la operacion afecto algo.

#### ReplyService.delete (con sincronizacion)

```typescript
public async delete(id: string): Promise<boolean> {
    try {
        const result = await ReplyModel.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { deletedAt: new Date() }
        ).exec();

        if (result) {
            await ThreadModel.findByIdAndUpdate(result.threadId, {
                $pull: { replies: result._id },
            }).exec();
        }

        return result !== null;
    } catch (error) {
        throw new Error(`Error deleting reply with id ${id}: ${error}`);
    }
}
```

**Explicacion**:
- Marca la respuesta como eliminada.
- Si la marca exitosamente (`if (result)`): quita el id de la respuesta del arreglo `replies` del thread.
- `$pull`: operador MongoDB que remueve un elemento del arreglo.
- Esto mantiene consistencia entre relaciones.

Ventajas del soft delete:

- Mantener historial.
- Evitar perdida irreversible de datos.
- Poder filtrar activos con `deletedAt: null`.
- Opcionalmente recuperar datos "eliminados".

---

## 4. Logica de los DTO

Los DTO definen la forma esperada del body de entrada.

### 4.1 DTO de creacion (`Input`)

#### BoardInput

```typescript
export interface BoardInput {
    name: string;
    description: string;
}
```

**Explicacion**:
- `name` y `description` son **obligatorios** (sin `?`).
- Se usan para operacion CREATE.
- El servicio espera estos campos minimos para crear un nuevo board.

#### ThreadInput

```typescript
export interface ThreadInput {
    title: string;
    content: string;
    boardId: string; // id of the board the thread belongs to
    replies?: string[];
}
```

**Explicacion**:
- `title`, `content`, `boardId` son **obligatorios**.
- `replies?` es **opcional** (con `?`): puede venir o no.
- `boardId` es string en el DTO, pero se almacena como ObjectId en Mongoose.
- Luego en el servicio, si `replies` no viene se asigna `[]` con el operador `??`.

#### ReplyInput

```typescript
export interface ReplyInput {
    message: string;
    threadId: string;
}
```

**Explicacion**:
- `message` y `threadId` son **obligatorios**.
- `threadId` es string en el DTO (id de la respuesta padre).

### 4.2 DTO de actualizacion (`InputUpdate`)

#### BoardInputUpdate

```typescript
export interface BoardInputUpdate {
    name?: string;
    description?: string;
}
```

**Explicacion**:
- **Todos los campos son opcionales** (con `?`).
- Permite actualizaciones parciales (PATCH).
- Ejemplos de payloads validos:
  - `{ name: "Nuevo nombre" }` -> actualiza solo nombre.
  - `{ description: "Nueva descripcion" }` -> actualiza solo descripcion.
  - `{ name: "...", description: "..." }` -> actualiza ambos.

#### ThreadInputUpdate

```typescript
export interface ThreadInputUpdate {
    title?: string;
    content?: string;
    replies?: string[];
}
```

**Explicacion**:
- Todos opcionales.
- Permite cambiar contenido sin afectar `boardId`.

#### ReplyInputUpdate

```typescript
export interface ReplyInputUpdate {
    message?: string;
}
```

**Explicacion**:
- Solo `message` puede cambiar.
- Cuando se actualiza una respuesta, el `threadId` no debe cambiar.

---

## 5. Por que algunos atributos llevan `?`

El simbolo `?` en TypeScript indica que una propiedad es opcional.

Casos tipicos en este proyecto:

1. **DTO de update**: se usa para PATCH/PUT parcial.
2. **Campos que no siempre vienen en el request**:
   - Ejemplo `replies?` en `ThreadInput`: en create puede omitirse y luego inicializarse como `[]`.

Beneficio:

- Flexibilidad de entrada sin perder tipado.

---

## 6. Logica de los Document (interfaces `...Document`)

Las interfaces `BoardDocument`, `ThreadDocument`, `ReplyDocument` combinan:

- datos del DTO base,
- datos de `mongoose.Document`,
- campos de sistema (`createdAt`, `updatedAt`, `deletedAt`),
- tipos de relaciones (ObjectId o documento poblado).

### 6.1 Estructura de interfaces Document

#### BoardDocument

```typescript
export interface BoardDocument extends BoardInput, mongoose.Document {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
```

**Explicacion**:
- `extends BoardInput`: hereda campos obligatorios `name`, `description`.
- `extends mongoose.Document`: agrega `_id`, timestamps, metodos de Mongoose.
- `createdAt`, `updatedAt`: fechas automaticas (establecidas por `timestamps: true` en esquema).
- `deletedAt`: inicialmente `null`, se rellena en borrado logico.

#### ThreadDocument

```typescript
export interface ThreadDocument extends Omit<ThreadInput, "replies">, mongoose.Document {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    board: BoardDocument; // reference to the board the thread belongs to
    replies: ReplyDocument[];
}
```

**Explicacion**:
- `Omit<ThreadInput, "replies">`: hereda todo de ThreadInput EXCEPTO `replies`.
- ¿Por que? En ThreadInput `replies` es `string[]` (ids), pero aqui es `ReplyDocument[]` (documentos completos cuando se usa `populate`).
- `board` es de tipo `BoardDocument` (el board completo, no solo id).
- `replies: ReplyDocument[]` lista de respuestas completas.
- `deletedAt: Date | null` explicitamente puede ser nulo.

#### ReplyDocument

```typescript
export interface ReplyDocument extends Omit<ReplyInput, "threadId">, mongoose.Document {
    threadId: mongoose.Types.ObjectId | ThreadDocument;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
```

**Explicacion**:
- `Omit<ReplyInput, "threadId">`: hereda `message`, excluye `threadId`.
- `threadId: mongoose.Types.ObjectId | ThreadDocument`: puede ser id o documento completo.
  - Cuando NO se usa `populate`: es `ObjectId` (id string serializado).
  - Cuando SI se usa `populate`: es `ThreadDocument` (objeto completo).

### 6.2 Esquemas en Mongoose

#### Board Schema

```typescript
const boardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "boards" });

export const BoardModel = mongoose.model<BoardDocument>("Board", boardSchema);
```

**Explicacion**:
- `required: true`: campos obligatorios en BD.
- `default: null`: `deletedAt` comienza como nulo.
- `timestamps: true`: Mongoose crea automaticamente `createdAt` y `updatedAt`.
- `collection: "boards"`: nombre de coleccion en MongoDB.

#### Thread Schema

```typescript
const threadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    replies: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reply" }],
        default: [],
    },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "threads" });
```

**Explicacion**:
- `boardId`: referencia a documento Board (poblable con `populate`).
- `replies`: arreglo de referencias a Reply (poblable con `populate`).
- `default: []`: comienza vacio.
- Cuando se crea una respuesta, el id se agrega con `$push`.

#### Reply Schema

```typescript
const replySchema = new mongoose.Schema({
    message: { type: String, required: true },
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: "Thread", required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "replies" });
```

**Explicacion**:
- `threadId`: referencia al thread padre.
- Cuando se elimina una respuesta, se quita del arreglo `replies` del thread con `$pull`.

---

## 7. Logica de los Controllers

El controller traduce logica de aplicacion a logica HTTP.

Flujo tipico por metodo:

1. Obtener datos de request (`req.params`, `req.body`).
2. Llamar al service.
3. Manejar resultado:
   - exito con status adecuado,
   - `404` si no existe,
   - `400` para errores de referencia/regla,
   - `500` para error inesperado.

### 7.1 `create`

#### BoardController.create

```typescript
public async create(req: Request, res: Response){
    try {
        const newBoard: BoardDocument = await boardService.create(req.body as BoardInput);
        res.status(201).json(newBoard);
    } catch (error) {
        if (error instanceof ReferenceError) {
            res.status(400).json({ message: "Board not found"});
            return;
        }
        res.status(500).json(error);
    }
}
```

**Explicacion**:
- `req.body as BoardInput`: castea el body a tipo `BoardInput`.
- Llama `boardService.create(...)`.
- Si crea exitosamente: `status(201)` (Created) con el objeto creado.
- Si hay `ReferenceError`: `status(400)` (Bad Request).
- Si hay otro error: `status(500)` (Server Error).
- El `try/catch` captura errores del servicio hacia respuestas HTTP.

#### ThreadController.create

```typescript
public async create(req: Request, res: Response) {
    try {
        const newThread: ThreadDocument = await threadService.create(req.body as ThreadInput);
        res.status(201).json(newThread);
    } catch (error) {
        if (error instanceof ReferenceError) {
            res.status(400).json({ message: "Board not found"});
            return;
        }
        res.status(500).json(error);
    }
}
```

**Explicacion**:
- Patron identico al de board.
- Si el servicio lanza `ReferenceError` (board inexistente en este caso), responde `400`.

### 7.2 `getAll`

#### BoardController.getAll

```typescript
public async getAll(req: Request, res: Response) {
    try {
        const boards: BoardDocument[] = await boardService.getAll();
        res.json(boards);
    } catch (error) {
        res.status(500).json(error);    
    }
}
```

**Explicacion**:
- Llama `boardService.getAll()`.
- `res.json(boards)`: envia el arreglo con `status(200)` implícito.
- Si hay error: `status(500)`.

### 7.3 `getOne`

#### BoardController.getOne

```typescript
public async getOne(req: Request, res: Response) {
    try {
        const id: string = req.params.id as string || "";
        const board: BoardDocument | null = await boardService.getById(id);
        if (board === null) {
            res.status(404).json({ message: `Board with id ${id} not found` });
            return;
        }
        res.json(board);
    } catch (error) {
        res.status(500).json(error);
    }
}
```

**Explicacion**:
- `req.params.id`: obtiene el id de la ruta (ej. `/boards/:id`).
- `|| ""`: si no viene, asigna string vacio.
- Llama servicio con el id.
- Si service devuelve `null`: responde `status(404)` (Not Found).
- Si existe: responde `status(200)` con el objeto.

### 7.4 `update`

#### BoardController.update

```typescript
public async update(req: Request, res: Response) {
    try {
        const id: string = req.params.id as string || "";
        const board: BoardDocument | null = await boardService.update(id, req.body as BoardInput);
        if (board === null) {
            res.status(404).json({ message: `Board with id ${id} not found` });
            return;
        }
        res.json(board);
    } catch (error) {
        res.status(500).json(error);
    }
}
```

**Explicacion**:
- Obtiene id de ruta, body del request.
- Llama `boardService.update(id, body)`.
- Si service devuelve `null`: id no existe, responde `404`.
- Si existe y actualiza: responde `200` con board actualizado.
- El DTO `BoardInputUpdate` permite que el body sea parcial.

### 7.5 `delete`

#### BoardController.delete

```typescript
public async delete(req: Request, res: Response) {
    try {
        const id: string = req.params.id as string || "";
        const deleted: boolean = await boardService.delete(id);
        if (!deleted) {
            res.status(404).json({ message: `Board with id ${id} not found` });
            return;
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json(error);
    }
}
```

**Explicacion**:
- Obtiene id de ruta.
- Llama `boardService.delete(id)`.
- Si service devuelve `false`: id no existe, responde `404`.
- Si devuelve `true`: borrado exitosamente, responde `status(204)` (No Content).
- `status(204)` significa "operacion exitosa, no hay contenido para devolver".

#### ReplyController.delete (con retorno JSON)

```typescript
public async delete(req: Request, res: Response) {
    try {
        const id: string = req.params.id as string || "";
        const deleted: boolean = await replyService.delete(id);
        if (!deleted) {
            res.status(404).json({ message: `Reply with id ${id} not found` });
            return;
        }
        res.json({ message: `Thread with id ${id} deleted` });
    } catch (error) {
        res.status(500).json(error);
    }
}
```

**Explicacion**:
- Similar a board, pero aqui devuelve JSON confirmacion en lugar de `204`.
- `res.json({ message: "..." })` envia `status(200)` con objeto confirmacion.
- Ambas formas son validas; depende del diseño de API.

---

## 8. Resumen practico

- Los `Service` manejan negocio + DB asincrona -> por eso devuelven `Promise`.
- Los `Controller` manejan HTTP y codigos de estado.
- Los `DTO` separan creacion y actualizacion para tipado claro.
- El simbolo `?` permite campos opcionales, clave para updates parciales.
- `deletedAt` implementa soft delete para no perder datos fisicamente.
- `populate` permite devolver relaciones completas sin consultas manuales extras.

---

## 9. Ejemplo completo: crear un thread

Flujo de como funciona todo junto:

### Request HTTP

```
POST /threads
Content-Type: application/json

{
    "title": "Mi primer thread",
    "content": "Contenido del thread",
    "boardId": "65a1b2c3d4e5f6g7h8i9j0k1"
}
```

### Ejecucion

1. **ThreadController.create** recibe request.
   - Castea `req.body as ThreadInput` → `{ title, content, boardId }`.
   - Llama `threadService.create(...)`.

2. **ThreadService.create** ejecuta:
   ```typescript
   const boardExists = await BoardModel.findById(threadInput.boardId).exec();
   ```
   - Busca en BD si existe el board.
   - Si no: lanza `ReferenceError`.
   - Si si: sigue adelante.
   
   ```typescript
   return ThreadModel.create({
       ...threadInput,
       replies: threadInput.replies ?? [],
   });
   ```
   - Crea documento en coleccion `threads` con `title`, `content`, `boardId`, `replies: []`.
   - BD asigna `_id`, `createdAt`, `updatedAt`.
   - Devuelve el documento creado (`Promise<ThreadDocument>`).

3. **Controller maneja resultado**:
   ```typescript
   const newThread: ThreadDocument = await threadService.create(...);
   res.status(201).json(newThread);
   ```
   - Espera la Promise.
   - Envia respuesta HTTP 201 con el thread creado.

### Response HTTP

```json
{
    "_id": "65a2c3d4e5f6g7h8i9j0k1l",
    "title": "Mi primer thread",
    "content": "Contenido del thread",
    "boardId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "replies": [],
    "createdAt": "2025-03-17T10:30:00Z",
    "updatedAt": "2025-03-17T10:30:00Z",
    "deletedAt": null
}
```

---

## 10. Ejemplo completo: crear una respuesta

Flujo mas complejo con sincronizacion de relaciones.

### Request HTTP

```
POST /replies
Content-Type: application/json

{
    "message": "Excelente thread!",
    "threadId": "65a2c3d4e5f6g7h8i9j0k1l"
}
```

### Ejecucion

1. **ReplyController.create** recibe y valida request.

2. **ReplyService.create**:
   ```typescript
   const threadExists = await ThreadModel.findOne({ _id: replyInput.threadId, deletedAt: null }).exec();
   if (!threadExists) {
       throw new ReferenceError(`Thread with id ... not found`);
   }
   ```
   - Verifica que el thread exista y no este eliminado.
   
   ```typescript
   const newReply = await ReplyModel.create(replyInput);
   ```
   - Crea la respuesta en BD.
   
   ```typescript
   await ThreadModel.findByIdAndUpdate(replyInput.threadId, {
       $push: { replies: newReply._id },
   }).exec();
   ```
   - Agrega el id de la nueva respuesta al arreglo `replies` del thread.
   - **Sincroniza** la relacion bidireccional.
   
   ```typescript
   return newReply;
   ```
   - Devuelve la respuesta creada.

3. **Controller envia respuesta HTTP 201**.

### Estado en BD despues

- Coleccion `replies`: nuevo documento con `message`, `threadId`, `_id`, etc.
- Coleccion `threads`: documento del thread actualizado.
  - `replies` ahora contiene `["... old ids ...", "65a3d4e5f6g7h8i9j0k1l2m"]`.

Si luego hacemos `GET /threads/:id` con `populate`:

```json
{
    "_id": "65a2c3d4e5f6g7h8i9j0k1l",
    "title": "Mi primer thread",
    "content": "Contenido del thread",
    "boardId": { /* board completo */ },
    "replies": [
        {
            "_id": "65a3d4e5f6g7h8i9j0k1l2m",
            "message": "Excelente thread!",
            "threadId": "65a2c3d4e5f6g7h8i9j0k1l",
            "createdAt": "2025-03-17T10:35:00Z",
            ...
        }
    ]
}
```

- El `populate` convierte cada id en `replies` a su documento completo.
