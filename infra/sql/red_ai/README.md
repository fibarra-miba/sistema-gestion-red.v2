# Contexto para Claudio — Alcance del híbrido RAG + comercial

## 1. Contexto general del proyecto

Estamos trabajando sobre un proyecto existente que ya tiene un **core funcional** dentro de la carpeta:

```txt
infra/core
```

Ese `core` representa el sistema principal actual: backend, base de datos, lógica de negocio ya implementada, modelos existentes, endpoints actuales y flujos comerciales/productivos que ya funcionan.

Ahora se agregó una nueva carpeta:

```txt
infra/red_ai
```

Esta carpeta contiene los archivos nuevos relacionados con el módulo de IA/RAG/comercial.

La estructura conceptual actual queda así:

```txt
infra/
  core/
    ... sistema actual existente
  red_ai/
    ... nuevos archivos del módulo IA/RAG/comercial
  ...
```

El objetivo es que `red_ai` sea una **capa complementaria** al core, no un reemplazo ni una reimplementación del sistema existente.

---

## 2. Qué resuelve el módulo `red_ai`

El módulo `red_ai` busca resolver una capa híbrida entre:

1. **RAG / búsqueda contextual**
2. **Análisis comercial**
3. **Asistencia mediante IA sobre datos reales del sistema**
4. **Integración progresiva con el core existente**

La idea principal es que el usuario pueda hacer consultas comerciales o de negocio y que el sistema pueda responder usando contexto real proveniente del core y/o de documentos preparados.

Ejemplos conceptuales de preguntas que debería poder responder o asistir:

```txt
¿Qué clientes tuvieron más movimiento este mes?
¿Qué productos tienen baja rotación?
¿Qué oportunidades comerciales aparecen según los datos actuales?
Resumime la situación de este cliente.
¿Qué clientes conviene contactar esta semana?
¿Qué ventas recientes requieren seguimiento?
¿Qué información relevante hay sobre este cliente antes de contactarlo?
```

El foco no es solamente tener un chatbot, sino construir una capa útil para análisis, consulta, resumen, sugerencias y soporte comercial.

---

## 3. Qué NO debe hacer `red_ai`

El módulo nuevo no debe:

- Reescribir el core.
- Duplicar modelos de negocio ya existentes.
- Crear una segunda fuente de verdad.
- Modificar tablas o flujos críticos del core sin justificación técnica clara.
- Acceder directamente a la base del core si ya existe una capa de servicios/endpoints adecuada.
- Mezclar lógica comercial estructural con lógica de IA sin separación de responsabilidades.
- Asumir que los datos pertenecen a `red_ai` si en realidad pertenecen al core.

La **fuente de verdad** sigue siendo el `core`.

`red_ai` debe actuar como una capa consumidora, analítica, asistencial o de orquestación inteligente.

---

## 4. Alcance funcional esperado

El alcance esperado del módulo se puede dividir en cuatro grandes bloques.

### 4.1 Consulta conversacional

Permitir que el usuario haga preguntas en lenguaje natural sobre información comercial, operativa o documental.

Ejemplo:

```txt
Usuario: Resumime el estado comercial del cliente X.
Sistema: Busca datos relevantes del cliente en el core, recupera contexto adicional si existe y genera una respuesta útil.
```

### 4.2 Búsqueda contextual / RAG

Permitir recuperar información relevante antes de generar una respuesta.

Esto puede incluir:

- Documentos cargados.
- Fragmentos indexados.
- Información comercial preparada.
- Datos estructurados transformados en contexto textual.
- Resúmenes previos.
- Información histórica relevante.

La respuesta final de IA no debe depender solamente del modelo, sino de información recuperada previamente.

### 4.3 Análisis comercial

Permitir análisis orientados a negocio sobre datos existentes.

Ejemplos:

```txt
Clientes con caída de actividad.
Clientes con mayor movimiento.
Productos más vendidos.
Productos con baja rotación.
Oportunidades comerciales.
Sugerencias de seguimiento.
Resumen de situación por cliente.
Alertas comerciales.
```

### 4.4 Acciones contextuales desde la UI

Desde pantallas del sistema principal, podría existir una acción contextual como:

```txt
Analizar con IA
Generar resumen
Sugerir próximo paso
Ver contexto comercial
Consultar información relacionada
```

La idea es que la IA pueda recibir contexto desde una entidad concreta del core, por ejemplo:

```txt
Cliente
Venta
Producto
Cuenta
Movimiento
Documento
```

---

## 5. Alcance backend esperado

Claudio debe revisar primero qué ya existe en `infra/core` y después analizar cómo conectar `infra/red_ai` sin romper el sistema actual.

El trabajo esperado no es crear endpoints arbitrarios sin mirar el core, sino entender:

- Qué endpoints ya existen.
- Qué servicios ya existen.
- Qué modelos ya existen.
- Qué datos comerciales están disponibles.
- Qué datos faltan exponer.
- Qué puede reutilizarse.
- Qué debe adaptarse mediante una capa intermedia.

---

## 6. Endpoints del core que podrían alimentar a `red_ai`

Los nombres exactos deben verificarse en el proyecto actual. Conceptualmente, `red_ai` podría necesitar datos de endpoints o servicios equivalentes a:

```txt
GET /clients
GET /clients/:id
GET /sales
GET /sales/:id
GET /products
GET /products/:id
GET /commercial-summary
GET /commercial-metrics
GET /customers/:id/activity
GET /customers/:id/sales
GET /customers/:id/debt
GET /customers/:id/summary
```

Esto no significa que deban crearse exactamente con esos nombres. Claudio debe revisar el core y determinar:

- Si ya existen endpoints equivalentes.
- Si ya existen servicios internos que devuelvan esa información.
- Si conviene consumir endpoints HTTP.
- Si conviene consumir servicios internos directamente.
- Si hace falta un adapter específico entre `red_ai` y `core`.
- Si hay que agregar endpoints mínimos en el core para exponer datos que hoy no están disponibles.

---

## 7. Endpoints propios esperados en `red_ai`

El módulo `red_ai` sí puede tener endpoints propios, separados de los endpoints normales del core.

Ejemplos conceptuales:

```txt
POST /ai/chat
POST /ai/query
POST /ai/rag/search
POST /ai/commercial-analysis
POST /ai/suggestions
POST /ai/context/customer/:id
POST /ai/context/product/:id
```

### 7.1 `POST /ai/query`

Endpoint general para recibir una pregunta del usuario.

Responsabilidad esperada:

1. Recibir la consulta.
2. Determinar si necesita contexto.
3. Recuperar información relevante desde RAG, core o ambos.
4. Construir un prompt/contexto controlado.
5. Generar respuesta.
6. Devolver respuesta más referencias/contexto usado cuando aplique.

### 7.2 `POST /ai/rag/search`

Endpoint para búsqueda contextual sin necesariamente generar una respuesta final.

Responsabilidad esperada:

1. Recibir una consulta.
2. Buscar documentos, fragmentos o registros relevantes.
3. Devolver resultados ordenados por relevancia.

Puede servir para debugging, validación de recuperación o uso interno desde otros endpoints.

### 7.3 `POST /ai/commercial-analysis`

Endpoint orientado específicamente al análisis comercial.

Responsabilidad esperada:

1. Recibir una pregunta o instrucción comercial.
2. Obtener datos estructurados desde el core.
3. Complementar con contexto RAG si aplica.
4. Generar análisis de negocio.
5. Devolver una respuesta clara, accionable y trazable.

### 7.4 `POST /ai/suggestions`

Endpoint para sugerencias comerciales.

Responsabilidad esperada:

1. Analizar datos comerciales relevantes.
2. Detectar posibles oportunidades, alertas o próximos pasos.
3. Devolver sugerencias priorizadas.

Ejemplos:

```txt
Contactar cliente X porque bajó su actividad.
Revisar producto Y porque tiene baja rotación.
Ofrecer reposición a cliente Z por patrón histórico de compra.
```

### 7.5 Endpoints contextuales

Ejemplos:

```txt
POST /ai/context/customer/:id
POST /ai/context/product/:id
POST /ai/context/sale/:id
```

Responsabilidad esperada:

- Recibir el identificador de una entidad del core.
- Recuperar información relacionada.
- Generar resumen, análisis o sugerencias para esa entidad concreta.

---

## 8. Alcance UI esperado

La UI debería integrar esta capacidad de IA de forma progresiva, sin convertir necesariamente el módulo en una aplicación completamente separada.

Hay tres posibles niveles de integración.

---

### 8.1 Panel de asistente IA

Una vista donde el usuario pueda escribir preguntas en lenguaje natural.

Ejemplos de uso:

```txt
¿Qué clientes debería contactar esta semana?
Mostrame oportunidades comerciales.
Resumime las ventas recientes.
Qué productos están teniendo baja rotación?
```

Elementos UI esperados:

```txt
Input de consulta
Botón de enviar
Historial de conversación o respuestas
Estado de carga
Respuesta generada
Referencias/contexto utilizado, si aplica
Mensajes de error controlados
```

---

### 8.2 Vista de análisis comercial

Una pantalla más estructurada, no necesariamente conversacional.

Puede contener:

```txt
Cards de métricas
Resumen comercial
Clientes destacados
Clientes con alertas
Productos con baja rotación
Sugerencias de seguimiento
Acciones recomendadas
```

Esta vista debería consumir endpoints de `red_ai` y/o endpoints comerciales del core.

---

### 8.3 Acciones contextuales en pantallas existentes

Desde una pantalla del core, por ejemplo detalle de cliente, producto o venta, se puede agregar una acción como:

```txt
Analizar con IA
Generar resumen
Sugerir próximo paso
Ver contexto comercial
```

Ejemplo:

```txt
Usuario entra al detalle de un cliente.
Hace click en "Analizar con IA".
La UI llama a /ai/context/customer/:id.
El backend recupera datos del cliente desde el core.
red_ai genera resumen y sugerencias.
La UI muestra el resultado en un panel/modal/sección.
```

---

## 9. Integración esperada entre `red_ai` y `core`

La integración ideal debería respetar una separación por capas.

Flujo conceptual:

```txt
UI
 ↓
red_ai API / routes
 ↓
red_ai services
 ↓
adapter/client hacia core
 ↓
core services / endpoints / capa de datos controlada
 ↓
base de datos existente
```

`red_ai` no debería acoplarse innecesariamente a detalles internos del core.

Una estructura posible dentro de `red_ai` sería:

```txt
red_ai/
  api/
    ai_routes
    rag_routes
    commercial_routes
  services/
    llm_service
    rag_service
    commercial_analysis_service
    suggestion_service
  adapters/
    core_client
    document_repository
    vector_store
  prompts/
    commercial_prompts
    rag_prompts
  schemas/
    ai_requests
    ai_responses
```

Esta estructura es conceptual. Claudio debe adaptarla a la tecnología y convenciones reales del proyecto.

---

## 10. Responsabilidades sugeridas por capa

### 10.1 `api/`

Responsable de exponer endpoints HTTP o rutas equivalentes.

No debería contener lógica pesada.

### 10.2 `services/`

Responsable de orquestar casos de uso.

Ejemplos:

```txt
Procesar una consulta IA.
Ejecutar búsqueda RAG.
Generar análisis comercial.
Construir sugerencias.
Coordinar datos del core + contexto RAG + LLM.
```

### 10.3 `adapters/`

Responsable de conectar con fuentes externas o internas.

Ejemplos:

```txt
Core existente
Vector store
Repositorio documental
Proveedor LLM
Base de datos auxiliar, si existe
```

### 10.4 `prompts/`

Responsable de guardar prompts controlados, plantillas o instrucciones del sistema.

No conviene hardcodear prompts largos dentro de controladores o rutas.

### 10.5 `schemas/`

Responsable de definir contratos de entrada/salida.

Ejemplos:

```txt
AIQueryRequest
AIQueryResponse
RAGSearchRequest
RAGSearchResponse
CommercialAnalysisRequest
CommercialAnalysisResponse
SuggestionResponse
```

---

## 11. Datos y fuente de verdad

La fuente de verdad de datos comerciales sigue estando en el core.

`red_ai` puede tener almacenamiento auxiliar si hace falta, por ejemplo:

```txt
Embeddings
Fragmentos indexados
Historial de consultas
Logs de uso IA
Cache de contexto
Resúmenes generados
```

Pero ese almacenamiento auxiliar no debe reemplazar datos del core.

Ejemplo correcto:

```txt
El core guarda clientes, ventas, productos y movimientos.
red_ai guarda embeddings o resúmenes derivados para consulta inteligente.
```

Ejemplo incorrecto:

```txt
red_ai crea su propia tabla paralela de clientes como fuente principal.
```

---

## 12. Relación entre RAG y datos estructurados

El módulo debería contemplar dos tipos de contexto:

### 12.1 Contexto documental / no estructurado

Ejemplos:

```txt
Documentos comerciales
Políticas internas
Notas de clientes
Información textual
Historial preparado
Descripciones
Manuales
```

Este contexto puede entrar por RAG tradicional: chunking, embeddings, búsqueda semántica y recuperación.

### 12.2 Contexto estructurado desde el core

Ejemplos:

```txt
Clientes
Ventas
Productos
Movimientos
Métricas
Deudas
Actividad comercial
```

Este contexto no siempre debería pasar por RAG. Muchas veces conviene consultarlo directamente desde servicios/endpoints del core y pasarlo al modelo como contexto estructurado.

La solución esperada es híbrida:

```txt
Pregunta del usuario
 ↓
Clasificación de intención
 ↓
Búsqueda documental si aplica
+
Consulta estructurada al core si aplica
 ↓
Construcción de contexto
 ↓
Respuesta IA
```

---

## 13. Criterio de integración con base de datos

Claudio debe revisar la base actual antes de proponer cambios.

Puntos a verificar:

- Qué tablas ya existen.
- Qué modelos ya existen.
- Qué migraciones existen.
- Qué datos comerciales ya están normalizados.
- Qué entidades comerciales son fuente de verdad.
- Si `red_ai` necesita tablas propias auxiliares.
- Si las migraciones nuevas quedaron bien ubicadas después del cambio de estructura.
- Si el cambio de ubicación de archivos pudo romper rutas, imports, scripts o referencias.

Importante: anteriormente hubo una reorganización donde `infra/core` contiene el sistema existente y `infra/red_ai` contiene los archivos nuevos. Claudio debe revisar si algo se rompió por esta separación de carpetas.

Debe verificar especialmente:

```txt
Imports relativos
Rutas de migraciones
Scripts de inicialización
Variables de entorno
Docker / compose / build contexts
Referencias a paths antiguos
Configuración de base de datos
Configuración de servicios
Dependencias compartidas
```

---

## 14. Contratos de respuesta esperados

Las respuestas de IA deberían intentar ser trazables cuando aplique.

Ejemplo de respuesta conceptual:

```json
{
  "answer": "El cliente X muestra una caída de actividad durante el último mes...",
  "context_used": {
    "core_data": [
      "sales_summary",
      "customer_activity"
    ],
    "rag_documents": [
      "doc_123",
      "doc_456"
    ]
  },
  "suggestions": [
    "Contactar al cliente esta semana",
    "Revisar condiciones comerciales recientes"
  ]
}
```

No es obligatorio que el contrato sea exactamente este. Es una referencia de diseño.

---

## 15. Manejo de errores esperado

El módulo debe manejar errores de forma controlada.

Casos a contemplar:

```txt
El core no responde.
No hay datos suficientes.
No se encontraron documentos relevantes.
El proveedor LLM falla.
La consulta del usuario es ambigua.
El usuario pide información fuera del alcance.
Error de permisos.
Error de validación del request.
```

Ejemplo de respuesta controlada:

```json
{
  "answer": null,
  "error": "No hay información suficiente para generar un análisis comercial confiable.",
  "details": "No se encontraron ventas recientes para el cliente solicitado."
}
```

---

## 16. Seguridad y permisos

Claudio debe considerar que la IA no debería exponer información que el usuario no tenga permiso de ver.

El módulo debe respetar:

```txt
Autenticación existente
Autorización existente
Roles/permisos del core
Restricciones por usuario
Restricciones por entidad, si existen
```

Si el core ya resuelve permisos, `red_ai` debe consumir datos a través de esa capa para no saltearse controles.

---

## 17. Observabilidad y debugging

Conviene que el módulo tenga logs útiles para poder diagnosticar:

```txt
Consulta recibida
Tipo de intención detectada
Fuentes consultadas
Documentos recuperados
Endpoints del core utilizados
Tiempo de respuesta
Errores del LLM
Errores de integración
```

Pero no debe loguear información sensible innecesariamente ni prompts completos si contienen datos privados.

---

## 18. Criterio de implementación progresiva

El módulo puede implementarse por etapas técnicas, pero sin romper el core.

Orden lógico sugerido:

1. Revisar el estado actual del core.
2. Revisar qué se agregó en `red_ai`.
3. Validar que la reorganización `infra/core` + `infra/red_ai` no rompió imports, paths, Docker, migraciones o scripts.
4. Identificar endpoints/servicios existentes del core que pueden alimentar la IA.
5. Definir el adapter `red_ai -> core`.
6. Implementar endpoint mínimo de consulta IA.
7. Implementar búsqueda RAG mínima.
8. Implementar análisis comercial usando datos reales del core.
9. Integrar UI mínima para consulta/respuesta.
10. Agregar acciones contextuales desde pantallas existentes.

---

## 19. Resultado esperado del análisis de Claudio

Antes de implementar fuerte, Claudio debería entregar un análisis concreto con:

```txt
Qué existe actualmente en core.
Qué existe actualmente en red_ai.
Qué endpoints o servicios ya pueden reutilizarse.
Qué endpoints faltan.
Qué archivos pueden haberse roto por el cambio de ubicación.
Qué imports/rutas/scripts deben corregirse.
Cómo debería integrarse red_ai con core.
Qué cambios mínimos recomienda hacer primero.
Qué riesgos técnicos detecta.
Qué estructura final propone para red_ai.
```

No se busca una respuesta vaga. Se espera un diagnóstico concreto sobre el repositorio actual.

---

## 20. Principio rector

El principio rector de esta integración es:

```txt
core = sistema fuente de verdad
red_ai = capa de IA/RAG/análisis que consume, resume, interpreta y sugiere
UI = punto de entrada para que el usuario interactúe con esa inteligencia aplicada
```

`red_ai` debe potenciar el sistema existente, no reemplazarlo.
