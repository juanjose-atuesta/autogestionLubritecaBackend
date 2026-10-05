# Actualización: capa de identidad de usuarios

Documentación de los cambios aplicados al backend en el commit **`5014357`** ("actualizacion:
mejoramos la forma en como el servidor manda informacion para optimizar el como se pide al
servidor").

Ese commit hizo **dos cosas independientes** que conviene no mezclar:

1. **Una capa de identidad y resolución de duplicados** sobre `users.id` (la cédula).
2. **Un cambio en el `id` que viaja en los eventos SSE**, que dejó de ser el `_id` de Mongo
   para pasar a ser la clave de negocio de cada entidad.

Todo el trabajo está commiteado. El árbol de trabajo está limpio.

---

## 1. El problema que motivó el cambio

`users.id` es la **cédula**, y la cédula se usa como identificador del usuario en toda la API.
Pero tiene dos problemas:

**La cédula puede no existir.** El cliente puede negarse a darla. En ese caso el backend guarda
un `"."` en lugar de la cédula:

```js
const CEDULA_SIN_DATO = ".";
```

Como varios usuarios pueden tener `"."`, **`users.id` no puede ser una clave única**. El
schema tiene la restricción `unique` comentada a propósito:

```js
// src/models/user.js
// La cedula es el identificador principal, pero puede guardarse como "."
// cuando el cliente no quiere darlo: la unicidad se valida en el controller.
id: {
  type: String,
  required: true          // <- sin unique: true
},
```

**El formato en la base es sucio.** La misma cédula o el mismo teléfono se guardaban a veces
como `"CC 1.234.567"`, a veces como `"1234567"`, con acentos, con `+57`, con guiones. Una
comparación por igualdad fallaba y dejaba pasar duplicados.

**La solución:** quitar la restricción de base de datos y mover toda la validación a una capa
de aplicación que normaliza antes de comparar.

---

## 2. `src/services/usuarios.js` — la capa de identidad

Archivo **nuevo** en este commit. Es el único lugar donde se decide si dos registros son "el
mismo usuario". Ningún controller compara cédulas o teléfonos por su cuenta.

### 2.1 Normalizaciones

| Función | Qué hace | Ejemplo |
|---|---|---|
| `normalizarTexto(v)` | quita acentos, pasa a minúsculas, colapsa espacios | `"  Juan  PÉREZ "` → `"juan perez"` |
| `normalizarTelefono(v)` | se queda solo con los dígitos | `"+57 (300) 123-45-67"` → `"573001234567"` |
| `digitosComparables(v)` | últimos 10 dígitos, para ignorar el prefijo | `"+57 3001234567"` ≡ `"3001234567"` |
| `normalizarCedula(v)` | quita acentos, espacios y guiones | `"CC 1.234-567"` → `"cc1234567"` |
| `esCedulaRegistrada(v)` | ¿es una cédula de verdad? | `"."` → `false`, `""` → `false` |

Las dos últimas son el corazón de la solución: comparan **valores normalizados**, no strings.

### 2.2 Comparadores

| Función | Devuelve `true` cuando… |
|---|---|
| `cedulasCoinciden(a, b)` | ambas son cédulas registradas y coinciden normalizadas |
| `nombresCoinciden(a, b)` | coinciden normalizados y no están vacíos |
| `telefonosCoinciden(a, b)` | los últimos 10 dígitos coinciden y no están vacíos |

`cedulasCoinciden` **siempre devuelve `false`** si alguna de las dos es `"."` o vacía. Sin
ese guardia, todos los usuarios sin cédula se confundirían entre sí.

### 2.3 Búsqueda en dos fases

`usuariosQueCoinciden()` implementa una estrategia deliberada de **query laxo + confirmación
exacta en memoria**:

```js
// 1) Se buscan candidatos con regex tolerante para no perder registros por formato
const candidatos = await User.find({ $or: condiciones }).lean();
// 2) Se confirman con la comparación normalizada, que sí es exacta
return candidatos.filter(usuario => coincideCon(usuario, { id, name, telephone }));
```

La fase 1 usa regex porque Mongo no normaliza acentos ni ignora separadores. La fase 2 usa
los comparadores exactos. Si se hiciera solo con regex, `"+"` en un teléfono se interpretaría
como cuantificador; por eso `construirRegexTelefono()` escapa cada carácter y solo deja pasar
separadores entre dígitos:

```js
// "+573001234567" -> /5[^0-9]*7[^0-9]*3[^0-9]*0[^0-9]*0[^0-9]*1[^0-9]*2[^0-9]*3[^0-9]*4[^0-9]*5[^0-9]*6[^0-9]*7/i
new RegExp(digitos.split("").map(escaparRegex).join("[^0-9]*"), "i")
```

Si el teléfono tiene menos de 6 dígitos, se cae a una regex literal del valor original.

### 2.3.1 BUG CONOCIDO: la fase 1 se escapea registros

**Estado: abierto, sin corregir.** La fase 2 (exacta) es correcta, pero la fase 1 construye la
regex con el valor **crudo** de la petición, así que solo encuentra candidatos cuyos
separadores estén en las mismas posiciones que en la base. Cualquier diferencia de formato
hace que el registro **no aparezca como candidato**, y como la fase 2 solo confirma los
candidatos que la fase 1 trajo, el duplicado pasa desapercibido.

Medido sobre pares que **sí son la misma cédula** tras normalizar:

| Cédula en la base | Cédula en la petición | ¿La encuentra? |
|---|---|---|
| `"1234567"` | `"1234567"` | sí |
| `"1.234-567"` | `"1.234-567"` | sí |
| `"12345 67"` | `"1234567"` | **no** |
| `"CC 1.234.567"` | `"cc-1.234.567"` | **no** |
| `"1.234-567"` | `"1234567"` | **no** |

**6 de 15 casos equivalentes se escapan.**

Dos consecuencias, según por dónde se entre:

**En el alta (`addUser`)** el duplicado no se detecta y **se crea un usuario repetido** sin
error. Es el fallo silencioso.

**En el resto de rutas** el usuario se vuelve inalcanzable. `usuariosConMismaCedula()` tiene el
mismo defecto, y como `localizarUsuarioUnico()` depende de ella, cualquier cédula guardada con
separadores devuelve **404** en las 11 rutas protegidas:

```
DELETE /api/users/deleteUser/1234567   con id="1.234-567" en la base
  -> 404  "No se encontró ningún usuario con la cédula \"1234567\""
```

Ni editar, ni borrar, ni sumar puntos, ni recomendar. El registro existe, pero ninguna ruta lo
alcanza.

**Causa raíz.** La regex se arma con el valor sin normalizar:

```js
// actual — src/services/usuarios.js
new RegExp(escaparRegex(String(id).trim()), "i")
```

`"cc-1.234.567"` escapa los guiones y los puntos **como literales**, así que solo casa con una
base idéntica. Para el teléfono ya se usa el truco correcto (dígitos unidos por `[^0-9]*`); a la
cédula no se le aplicó.

**Arreglo propuesto.** Normalizar antes de construir la regex y tolerar separadores entre
caracteres, igual que ya se hace con el teléfono:

```js
function construirRegexCedula(cedula) {
  const n = normalizarCedula(cedula);   // sin acentos, minúsculas, sin espacios ni guiones
  if (!n) return null;
  return new RegExp(n.split("").map(escaparRegex).join("[^a-z0-9]*"), "i");
}
```

Medido: pasa de **9/15 a 15/15** pares equivalentes detectados, sinometer falsos positivos
sobre cédulas que no equivalen.

Sobre-matcher en la fase 1 **no es un problema**: el separador `[^a-z0-9]*` también tolera
puntos, que `normalizarCedula()` no elimina, así que la regex puede traer candidatos de más.
La fase 2 los descarta con `cedulasCoinciden()`. Lo que sí importa es no dejar pasar candidatos
de menos, y eso es exactamente lo que arregla.

**Por qué no está aplicado:** al corregirlo, usuarios que hoy son invisibles o ignorados
empiezan a aparecer, y en una base con datos reales eso puede destapar un lote de 409 y de
"usuario no encontrado" que hasta ahora pasaba desapercibido. Conviene aplicarlo con la base
de datos a la vista y revisar la colección `users` primero.

**Cómo diagnosticarlo en la base actual:**

```js
mongosh
use lubriteca;
db.users.find({ id: { $regex: "[^0-9.]" } });          // cédulas con algo raro
db.users.find({ telephone: { $regex: "[^0-9]" } });     // teléfonos con separadores
db.users.aggregate([{ $group: { _id: "$telephone", n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
```

### 2.4 API pública del servicio

| Función | Para qué |
|---|---|
| `buscarDuplicadosAlta({ id, name, telephone })` | alta de usuario |
| `localizarUsuarioUnico(id, telephone)` | **edición, borrado, compras, recomendaciones y puntos** |
| `usuariosQueCoinciden({...})` | query laxo + confirmación |
| `usuariosConMismaCedula(id)` | todos los usuarios que comparten cédula (incluye los `"."`) |
| `resumenUsuario(u)` | versión reducida para las respuestas de error |
| `CEDULA_SIN_DATO`, y los normalizadores / comparadores | por si otro módulo los necesita |

`resumenUsuario()` existe para que los errores 409 no devuelvan `recommendedUsers`, `highBuy`
y `frecuentBuy` completos: solo `_id`, `name`, `id`, `telephone`, `registrationDay`,
`totalPoints`.

---

## 3. `identificarUsuario` — el middleware

Nuevo en `src/controllers/user.js:13`. Se puso **en el router, no dentro de cada controller**,
para que ningún endpoint por cédula pueda olvidarse de la protección.

```js
async function identificarUsuario(req, res, next) {
  const telephone = req.body?.telephone ?? req.query?.telephone ?? '';
  const { usuario, error } = await localizarUsuarioUnico(req.params.id, telephone);
  if (error) {
    return res.status(error.codigo).send({ status: "error", ...error });
  }
  req.usuario = usuario;      // el controller ya no tiene que buscar nada
  return next();
}
```

Acepta el teléfono en el body **o** en el query string, porque las rutas `GET` no llevan body.

Efecto colateral importante: los controllers ya no hacen `User.findOne()` por cédula. Reciben
`req.usuario` listo, y por eso `deleteUser` no necesita verificar nada:

```js
const deleteUser = async (req, res) => {
  // identificarUsuario ya garantiza un único usuario con esa cédula
  const userDeleted = await User.findByIdAndDelete(req.usuario._id);
```

### Rutas protegidas y rutas abiertas

De las 15 rutas de `src/routers/user.js`, **11 están protegidas**:

| Ruta | Método | Protegida |
|---|---|---|
| `/usersList` | GET | no (lista global) |
| `/usersNotContacted` | GET | no (lista global) |
| `/addUser` | POST | no (valida duplicados internamente) |
| `/rankingUsuarios` | GET | no (agregación global) |
| `/recommendedUsers/:id` | GET | **sí** |
| `/getRecommendedMe/:id` | GET | **sí** |
| `/availableToRecommend/:id` | GET | **sí** |
| `/deleteUser/:id` | DELETE | **sí** |
| `/addRecommendedMe/:id` | PATCH | **sí** |
| `/addRecommendedUser/:id` | PATCH | **sí** |
| `/editUser/:id` | PATCH | **sí** |
| `/setRecommended/:id` | PATCH | **sí** |
| `/addHighBuy/:id` | PATCH | **sí** |
| `/addFrecuentBuy/:id` | PATCH | **sí** |
| `/editPoints/:id` | PATCH | **sí** |

**Regla para agregar rutas:** cualquier ruta que reciba `:id` de usuario debe llevar
`UserController.identificarUsuario` como middleware. Si no lo lleva, queda sin protección.

---

## 4. Los códigos de error

Toda respuesta de error lleva `status: "error"` más un `motivo` cuando aplica.

| Código | `motivo` | Cuándo | Qué hace el frontend |
|---|---|---|---|
| **400** | — | no se envió cédula, o faltan nombre/cédula/teléfono en el alta | `alert` |
| **404** | — | no existe ningún usuario con esa cédula | `alert` |
| **409** | `usuarios-duplicados` | hay **más de un** usuario con esa cédula | abre el modal de duplicados |
| **409** | `telefono-no-coincide` | el teléfono no coincide con el de la cédula | `alert` |
| **409** | — (alta) | el alta chocaría con un usuario existente | abre el modal de duplicados |

### Forma de las respuestas 409

```jsonc
// localizarUsuarioUnico — más de un usuario con la misma cédula
{
  "status": "error",
  "codigo": 409,
  "motivo": "usuarios-duplicados",
  "message": "Hay 2 usuarios registrados con la cédula \"1234567\". Por seguridad no se puede modificar ni eliminar automáticamente: elimínalos de forma manual y notifica al desarrollador.",
  "cedula": "1234567",
  "duplicados": [ { "_id": "...", "name": "...", "id": "...", "telephone": "..." } ]
}

// buscarDuplicadosAlta — el alta no se admite
{
  "status": "error",
  "motivo": "usuarios-duplicados",
  "message": "No se admite el usuario: ya existe un usuario registrado con el mismo cédula, nombre.",
  "camposDuplicados": ["cédula", "nombre"],
  "cedulaRegistrada": true,
  "cedula": "1234567",
  "duplicados": [ /* + coincideEn: ["cédula","nombre"] */ ]
}
```

`camposDuplicados` y `coincideEn` dicen **en qué campos** chocó, para que el mensaje sea
accionable en vez de un "duplicado" genérico. `cedulaRegistrada` le permite al frontend
distinguir "no tienes cédula" de "tu cédula ya existe".

---

## 5. Alta de usuario (`addUser`)

`src/controllers/user.js:42`. Valida tres campos obligatorios y luego busca duplicados:

```js
const duplicados = await buscarDuplicadosAlta({ id, name, telephone });
if (duplicados.length) {
  return res.status(409).send({ status: "error", motivo: "usuarios-duplicados", ... });
}
```

Las reglas de coincidencia dependen de si la cédula es real:

| Cédula | Campos comparados |
|---|---|
| real | cédula **o** nombre **o** teléfono |
| `"."` | nombre **o** teléfono |

Es decir: **si no hay cédula, la comparación se apoya en nombre y teléfono**. Dos personas
distintas con el mismo nombre y teléfono distinto no chocan.

También se mejoró el manejo de errores del `.catch()`, que antes respondía 500 a todo:

- `ValidationError` de mongoose → **400** con el detalle por campo
- `code: 11000` (índice único) → **409** con `duplicateKey`
- cualquier otro → 500

El caso 11000 es una red de seguridad: si una base vieja todavía tiene el índice `id_1`, el
alta devuelve un 409 legible en vez de un error 500.

---

## 6. Edición (`editUser`)

`src/controllers/user.js:299`. Lo delicado es el **cambio de cédula**: si la cédula nueva
choca con otro usuario, no se aplica.

```js
const cedulaNueva = String(req.body.id ?? idNew ?? '').trim();
if (cedulaNueva && cedulaNueva !== String(usuario.id || '').trim()) {
  const duplicados = await buscarDuplicadosAlta({ id: cedulaNueva, ... });
  const otros = duplicados.filter(otro => String(otro._id) !== String(usuario._id));
  if (otros.length) return res.status(409).send({ ... });
  camposActualizar.id = cedulaNueva;
}
```

El filtro `otros` es importante: al buscar duplicados, el propio usuario que se está editando
aparece como coincidencia (mismo nombre, mismo teléfono). Sin ese filtro, **editar sin cambiar
nada siempre daría 409**.

`idNew` se acepta como alias de `id` por compatibilidad con el frontend anterior.

---

## 7. El índice `id_1` — pendiente en bases existentes

Quitar `unique: true` del schema **no borra el índice que ya existe en la base de datos**. En
Mongo los índices son persistentes y sobreviven a los cambios de código.

Si la colección `users` de la base remota todavía tiene el índice único sobre `id`, cualquier
alta o edición que repita la cédula fallará con `code: 11000` (que ahora responde 409, pero
igual rechaza la operación).

Hay que quitarlo **una vez, desde el servidor de base de datos**:

```js
mongosh
use lubriteca;
db.users.getIndexes();      // confirmar que id_1 aparece con unique: true
db.users.dropIndex("id_1");
db.users.getIndexes();      // confirmar que ya no está
```

**Recomendación: respaldar antes.**

```js
mongodump --db lubriteca --collection users --out /ruta/del/respaldo
```

**Estado: pendiente.** Esta máquina no tiene acceso al servidor de base de datos, así que el
índice no se ha podido quitar ni verificar. Si al probar ves `11000` o un 409 con
`duplicateKey`, el índice sigue ahí.

El schema actual **no declara ningún índice** (`src/models/` no tiene ningún `.index()`), así
que una base creada desde cero nunca tendrá el problema. Solo afecta a bases preexistentes.

---

## 8. El otro cambio: `id` de negocio en los eventos SSE

Este es el otro lado del commit, y no tiene nada que ver con la identidad. **El `id` que viaja
en los eventos SSE dejó de ser el `_id` de Mongo para ser la clave de negocio** de cada
entidad:

| Evento | Antes | Ahora |
|---|---|---|
| `cliente-creado` / `cliente-editado` / `cliente-eliminado` | `cliente._id` | `cliente.id` |
| `historial-guardado` / `historial-contactado` / `historial-editado` | `customer._id` | `customer.id` |
| `reserva-agregada` / `reserva-eliminada` / `reserva-editada` / `reservacion-concluida` | `reservation._id` | `reservation.reservationId` |

**Por qué importa.** El frontend indexa sus `Map` en memoria con esa clave. Mandar el
ObjectId obligaba al cliente a mantener una tabla de traducción entre `_id` y cédula en cada
entidad. Con la clave de negocio, el `Map` se indexa directo con lo que ya recibe del REST.

Esto es exactamente lo que habilitó el `claveUsuario()` del frontend (`js/store/storage.js`),
que usa la cédula como clave y cae al `_id` solo cuando la cédula es `"."`. **Los dos cambios
son el mismo diseño visto desde los dos lados.**

---

## 9. Compatibilidad con el frontend

Contrato que el backend espera y el frontend cumple:

| Punto | Contrato |
|---|---|
| URL de usuario | `users/<ruta>/<cédula>` + `?telephone=<tel>` |
| Cédula sin dato | `"."` viaja tal cual, sin sanitizar |
| Error de duplicados | `status: "error"` + `motivo: "usuarios-duplicados"` + `duplicados[]` |
| Flag de cédula | `cedulaRegistrada: false` cuando la cédula es `"."` |
| Éxito | siempre `status: "success"` |
| SSE | `{ id: <clave de negocio>, <entidad>: <documento> }` |

**Los dos lados deben moverse juntos.** Si el backend manda `_id` en un evento y el frontend
lo indexa como cédula, los registros aparecen duplicados o desaparecen de las tablas. Si el
frontend manda una cédula sin normalizar y el backend sí normaliza, el 409 no dispara y se
crean duplicados reales.

---

## 10. Verificación

### Harness de identidad

Se construyó un harness que ejercita el servicio y los controllers contra un **modelo falso
en memoria**, sin tocar la base real:

```bash
node /tmp/opencode/harness_identidad.js
```

Resultado actual: **31 de 31 comprobaciones OK**. Cubre:

| Grupo | Qué prueba |
|---|---|
| Normalización | acentos, mayúsculas, espacios, `+57`, guiones, `"."` no cuenta como cédula |
| Duplicados en alta | cédula repetida, nombre repetido, teléfono repetido, `"."` compartido, y los casos negativos |
| `addUser` | 409 con detalle, 409 con `"."`, 200 válido, 400 sin datos |
| `localizarUsuarioUnico` | usuario único, teléfono que no coincide (409), cédula inexistente (404), `"."` con 2 usuarios (409), sin cédula (400) |
| `identificarUsuario` | deja `req.usuario` y sigue; con duplicados responde 409 y **no** sigue; acepta teléfono por query |
| `deleteUser` | borra el único; con cédula duplicada responde 409 y **no borra nada** |
| `editUser` | a cédula ocupada da 409; a cédula libre actualiza; acepta `idNew` |
| Detección sucia | encuentra el duplicado aunque en la base haya espacios, acentos y teléfono con separadores |

> **Pendiente de mover:** el harness vive en `/tmp/opencode/harness_identidad.js`, que se
> borra al reiniciar la máquina. Debería pasar a `test/identidad.test.js` para correrlo con
> `npm test` junto a `excelService.test.js`.

### Revisión manual pendiente

- [ ] Quitar el índice `id_1` en la base remota (§7)
- [ ] Probar un alta con la base ya limpia: 200
- [ ] Crear dos usuarios a mano con la misma cédula y confirmar que editar/eliminar da 409
- [ ] Confirmar que el frontend abre el modal de duplicados con la lista que llega en `duplicados`

---

## 11. Pendientes y deuda técnica

| # | Qué | Impacto |
|---|---|---|
| 1 | **La fase 1 de la búsqueda se escapa registros** (§2.3.1) | **Duplicados silenciosos en el alta y usuarios inalcanzables (404) en las 11 rutas protegidas** |
| 2 | **Quitar el índice `id_1`** en la base remota | Bloquea altas que repitan cédula en bases viejas |
| 3 | Mover el harness a `test/identidad.test.js` | Se pierde en cada reinicio de la máquina |
| 4 | `getAvailableUsersToRecommend` no reutiliza el servicio | Repite lógica de duplicados que ya existe en `usuarios.js` |
| 5 | `updatePoints`, `addPoint`, `subtractPoint` existen en el controller pero **no están en ninguna ruta** y sus exports están comentados | Código muerto desde antes de este commit |
| 6 | `addRecommendedUser` y `setRecommended` devuelven `res.status(500).send({})` sin mensaje | El frontend recibe un error sin texto que mostrar |

El punto 5 importa para el frontend: si esas rutas fallan, `avisarErrorUsuario()` recibe un
error sin `message` y cae en el `alert` genérico.

---

## Archivos tocados por este commit

| Archivo | Cambio |
|---|---|
| `src/services/usuarios.js` | **nuevo**, 210 líneas — la capa de identidad |
| `src/controllers/user.js` | +252/−129 — `identificarUsuario`, validaciones en alta y edición |
| `src/routers/user.js` | +24 — middleware en 11 rutas |
| `src/models/user.js` | se quitó `unique: true` de `id` |
| `src/controllers/customer.js` | `id` de negocio en 5 eventos SSE |
| `src/controllers/historialDB.js` | `id` de negocio en 3 eventos SSE |
| `src/controllers/reservation.js` | `id` de negocio en 4 eventos SSE |