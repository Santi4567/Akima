# 👤 Gestión de Usuarios (users)

### Estos permisos controlan quién puede administrar las cuentas de los empleados que usan el CRM.

**add.users**: Permite crear un nuevo registro de usuario (vendedor, gerente, etc.).

**edit.users**: Permiso de "supervisor" para modificar la información de otros usuarios (como cambiar su rol o activarlos).

**delete.users**: Permiso para eliminar a un usuario del sistema.

**view.users**: Permite ver la lista completa de todos los usuarios del sistema.

**edit.own.profile**: Permiso básico para que cualquier usuario pueda editar solo su propia información (como su nombre o contraseña).

# 🗃️ Gestión de Catálogo (Productos y Proveedores)

### Estos permisos controlan el inventario y la información de quienes te surten.

**add.products**: Permite crear nuevos productos o servicios en el catálogo.

**edit.products**: Permite modificar la información de un producto existente.

**delete.products**: Permite eliminar un producto del catálogo.

**view.products**: Permite ver y buscar en la lista de productos.

**add.suppliers**: Permite registrar un nuevo proveedor.

**edit.suppliers**: Permite modificar la información de un proveedor.

**delete.suppliers**: Permite eliminar un proveedor.

**view.suppliers**: Permite ver la lista de proveedores.

# 🧔‍♂️ Gestión de Clientes (clients)
### Estos permisos son el núcleo del CRM: controlan tu cartera de clientes.

**add.clients**: Permite registrar un nuevo cliente o prospecto (lead).

**edit.clients**: Permite modificar la información de un cliente (teléfono, email, estado, notas).

**delete.clients**: Permiso sensible para eliminar un cliente.

**view.clients**: Permiso para ver y buscar en la lista de clientes.

# 🗓️ Gestión de Agenda (scheduled_visits)
### Estos permisos controlan el calendario y el seguimiento de visitas a clientes.

**add.visits**: Permite agendar una nueva visita en el calendario.

**edit.visits**: Permite modificar una visita (ej. marcarla como completed o añadir notas después de la reunión).

**delete.visits**: Permite cancelar o eliminar una cita de la agenda.

**assign.visits**: Permiso de "supervisor" (Gerente/Admin) para crear o asignar una visita a un usuario diferente al que la está creando.

**view.own.visits**: Permiso de "vendedor" para ver solo sus propias visitas agendadas.

**view.all.visits**: Permiso de "supervisor" para ver la agenda de todos los vendedores.

# 🛒 Gestión de Pedidos (orders)
### Estos permisos controlan el proceso de "levantar" un pedido y su ciclo de vida.

**add.order**: Permiso de "vendedor" para crear un nuevo pedido de venta.

**edit.order.content**: Permiso para modificar los ítems de un pedido (productos, cantidades), pero solo si el pedido está en estado pending.

**edit.order.status**: Permiso de "almacén" o "logística" para cambiar el estado del pedido (ej. de pending a processing o shipped).

**cancel.order**: Permiso de "supervisor" para anular un pedido, cambiándolo a cancelled.

**view.own.order**: Permiso de "vendedor" para ver solo los pedidos que él mismo creó.

**view.all.order**: Permiso de "supervisor/almacén" para ver todos los pedidos del sistema.

# ↩️ Gestión de Correcciones (returns)
### Estos permisos controlan las acciones de post-venta, como devoluciones o ajustes.

**issue.refund**: Permiso para crear un registro de devolución/reembolso. Se usa tanto para productos devueltos (faltantes de stock) como para ajustes financieros (errores de precio).

**edit.return.status**: Permite cambiar el estado de una devolución (ej. de pending a completed o cancelled/voided).