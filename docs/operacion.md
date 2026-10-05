# Operación de Sistema RED

Reglas de negocio y convenciones de carga acordadas al dejar PRD consistente con la
operación real del ISP (octubre 2026). El código dice *qué* se puede hacer; este documento
dice *cómo se hace en la práctica* y por qué.

---

## 1. Carga de clientes

| Dato | Convención |
|---|---|
| Apellido desconocido | `S/D` (el backend lo exige). Se completa cuando se conoce; buscar `S/D` para encontrarlos. |
| Alias / apodo | En **observaciones** del cliente (`Alias: Vicky`). |
| Nombre de comercio | En **observaciones** del cliente (`Sushi Go`, `Yugido, Taekwondo`). |
| Locales comerciales | Domicilio con complejo `Barracas`, calle y número reales; el número de local va en **referencias** (`Local 7`). |
| Teléfono | Obligatorio. |

**Corregir un domicilio mal cargado** → *Editar datos* del domicilio (`PATCH /clientes/{id}/domicilios/{dom_id}`).
**Mudanza** → *Cambiar domicilio* (crea uno nuevo y deja el anterior en el historial). No mezclar.

## 2. Fechas reales

- **Inicio de contrato = fecha de instalación.** El alta de contrato, completar instalación y
  dar de baja aceptan la fecha real (default: hoy; no se aceptan fechas futuras).
- Las fechas de negocio se guardan al mediodía local (`12:00 -03`) para que no se corran de día.
- La activación de un contrato crea su programación/instalación con la fecha de inicio del contrato.
- El precio del contrato es siempre el **vigente hoy**, aunque el alta sea retroactiva.

## 3. Baja de un cliente

1. **Dar de baja el contrato** (con fecha y motivo) → contrato `BAJA`.
2. **Desactivar el cliente** desde su ficha → `INACTIVO` (se bloquea si tiene contratos activos o suspendidos).
3. La instalación **queda COMPLETADA** (fue lo que pasó). **No** usar *Dar de baja instalación*:
   es el flujo técnico de reinstalación y devuelve el contrato a `PENDIENTE_INSTALACION`
   (el backend lo rechaza si el contrato no está activo/suspendido).
4. La **garantía** sigue su propio circuito (ver §5).

## 4. Facturación y cobranza

- La facturación arranca en **octubre 2026**: no se reconstruyó historia anterior (no hay deuda previa;
  todas las cuentas corrientes empezaron en $0).
- **Lote mensual**: *Pagos → Generación masiva* (`POST /pagos/generar-lote`), emisión día 1, vencimiento día 10.
  Omite los contratos que ya tienen factura del período.
- **Cobro de instalación**: se suma como **cargo adicional** a la factura del primer período
  (*Generar período* → *Agregar cargo adicional*, concepto `Instalación`). Generar esa factura
  **antes** del lote del mes, así el lote la omite.
- **Pagos en partes**: cada pago se registra como movimiento sobre la factura (estado `PARCIAL` → `PAGADO`),
  con su recibo. La cuenta corriente lleva el saldo.
- Medio de pago habitual: **TRANSFERENCIA** (efectivo existe en el catálogo, hoy no se usa).

## 5. Garantía (depósito del equipo)

La garantía es un **depósito reembolsable**, no un ingreso: **no se factura** ni entra en la cuenta corriente.

- Se registra al instalar, normalmente cobrada en el mismo acto (*Registrar cobro ahora*):
  fecha = inicio de la garantía, monto = total.
- Puede cobrarse en varias partes. **Nunca más que el saldo** (no hay saldo a favor). La deuda de
  garantía se ve en la ficha del cliente, en `/garantias/:id` y en el dashboard (*Pendiente de cobro*).
- **Cada cobro emite y guarda un recibo** (`DG-000001`…) con los datos *al momento de emitirlo*
  (cliente, equipo, monto, cobrado, saldo). Un pago en 2 partes deja 2 recibos; se reimprimen idénticos.
- **Cierre:**
  - `DEVUELTA`: el cliente devolvió el equipo y se le reintegró el depósito.
  - `RETENIDA`: el cliente no devolvió el equipo / no reclamó → el depósito queda para el ISP.
  - `ANULADA`: solo para errores de carga.
- **Regla de plazo**: tras una baja, el cliente tiene **1 mes** para reclamar el depósito; si no lo hace,
  la garantía pasa a `RETENIDA`. (Hoy es manual: se anota el plazo en el motivo de la garantía.)

## 6. Roles

| Rol | Puede |
|---|---|
| ADMIN | Todo |
| OPERADOR | Clientes, domicilios, contratos, instalaciones, productos, garantías |
| TECNICO | Instalaciones; ver garantías (no cobrar) |
| COBRANZAS | Pagos; leer clientes/contratos (selectores de pagos); **ver garantías y registrar sus cobros** |

## 7. Correcciones fuera de la API

Cuando un dato real no se puede corregir por la API: `./red prd backup` antes, `UPDATE` en una sola
transacción y un evento en `auditoria_eventos` con acción `CORRECCION_DATOS` y el detalle del cambio.
Las operaciones de carga normales van **siempre por la API** (validan reglas y quedan auditadas).

---

## Pendientes conocidos

- **Contraseña de `admin` en PRD** sigue siendo la de fábrica: cambiarla antes de exponer PRD.
- **Retención → ingreso**: una garantía `RETENIDA` todavía no genera el ingreso en facturación.
- **Plazo de reclamo de garantía**: se controla a mano; podría automatizarse (aviso o paso a `RETENIDA`).
- **Ficha del cliente para COBRANZAS**: hoy no la ve (la ruta exige gestionar clientes); se evaluó
  abrirla en solo lectura.
- **Auditoría de PRD** contiene 23 `LOGIN_FAILURE` del 28-09-2026 (usuarios `x@y.z`,
  `noexiste@test.local`, `curl` desde la red de Traefik): fueron pruebas del rate limit al montar
  Traefik, no intentos de acceso reales. Se dejan en la auditoría (no se borran registros de
  auditoría); a futuro las pruebas de login se hacen en DEV.
- El plan `(Comercio) Plan Avanzado` no tiene precio cargado (decisión: queda así).
