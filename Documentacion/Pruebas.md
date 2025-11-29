# Login GOCSPXJZ4k5SUO6WYkMt7Gu8aJI9uSbBZd

    curl -X POST http://localhost:3000/api/users/login -H "Content-Type: application/json" -d '{ "Correo": "admin@test.com", "Passwd": "test123"}'

    curl -X POST http://localhost:3000/api/users/login -H "Content-Type: application/json" -d '{ "Correo": "gerente@test.com", "Passwd": "test123"}'

    curl -X POST http://localhost:3000/api/users/login -H "Content-Type: application/json" -d '{ "Correo": "vendedor@test.com"", "Passwd": "test123"}'
    
    curl -X POST http://localhost:3000/api/users/login -H "Content-Type: application/json" -d '{ "Correo": "administracion@test.com", "Passwd": "test123"}'

# Registrer
    curl -X POST http://localhost:3000/api/users/register -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"Nombre": "Admin F", "Correo": "admin@test.com", "Passwd": "test123"}'

    curl -X POST http://localhost:3000/api/users/register -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"Nombre": "Juan Flores", "Correo": "gerente@test.com"","Passwd":"test123"}'
    curl -X POST http://localhost:3000/api/users/register -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"Nombre": "vendedor Flores","Correo": "vendedor@test.com"","Passwd": "test123"}'

    curl -X POST http://localhost:3000/api/users/register -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"Nombre": "adm Flores","Correo": "administracion@test.com","Passwd": "test123"}'

curl -v -X POST http://localhost:3000/api/users -H "Authorization: Bearer <TU_TOKEN_DE_ADMIN>" -H "Content-Type: application/json" -d '{"Nombre": "Nuevo Vendedor","Correo": "vendedor2@akima.com","Passwd": "password123","rol": "vendedor","Estado": 1,"phone": "5512345678","address": "Calle Ventas 101","sex": "M"}'

# Users

  ## Actulizar Usuarios
    curl -v -X PUT http://localhost:3000/api/users/ID -H "Authorization: Bearer <TU_TOKEN_JWT>" -H "Content-Type: application/json" -d '{"Nombre": "Juan Flores Actualizado","phone": "5512345678","address": "Calle Nueva 123, Centro","sex": "M"}'

  ## Ver usuarios
    curl -v -X GET http://localhost:3000/api/users -H "Authorization: Bearer <TU_TOKEN_JWT>"

  ## Eliminar usuarios
  curl -v -X DELETE http://localhost:3000/api/users/15 -H "Authorization: Bearer <TU_TOKEN_JWT>"

  ## Buscar usuarios
  curl -v -X GET "http://localhost:3000/api/users/search?q=Juan" -H "Authorization: Bearer <TU_TOKEN_JWT>"



# Roles
  ## Consultar informacion de un usurio y sus permisos 
    curl -X GET http://localhost:3000/api/users/profile -H "Authorization: Bearer <TU_TOKEN_JWT>"
    

  ## Crear nuevo grupo (solo admins)
    curl -v -X POST http://localhost:3000/api/users/admin/roles -H "Authorization: Bearer <TU_TOKEN_JWT>" -H "Content-Type: application/json" -d '{ "roleName": "logistica" }'  
  ## Eliminar roles  (solo admins)
    curl -v -X DELETE http://localhost:3000/api/users/admin/roles/logistica -H "Authorization: Bearer <TU_TOKEN_JWT>"

  ## Cambioar/modificar/eliminar permisos (solo admins)
  curl -v -X PUT http://localhost:3000/api/users/admin/permissions  -H "Content-Type: application/json"  -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"vendedor": ["view.products","view.clients","view.own.visits","add.order","view.own.order"]}'

  ## peticion para traer todos los permisos exixtentes (solo admins)
  curl -v -X GET http://localhost:3000/api/users/admin/permissions-list -H "Authorization: Bearer <TU_TOKEN_JWT>"

  ## Obtner todos los roles y cuantos usuarios dependen de cada uni(solo admin)
  curl -v -X GET http://localhost:3000/api/users/admin/roles/stats -H "Authorization: Bearer <TU_TOKEN_JWT>"

  ## ver los permisos que tiene un rol en espesifico
   curl -v -X GET http://localhost:3000/api/users/roles/[rol]/permissions -H "Authorization: Bearer <TU_TOKEN_JWT>"


# Categorias

 ## Insertar Una nueva categoria
    curl -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Celulares y Tablets","description": "Dispositivos móviles y accesorios"}'

 ## Insertar Una nueva categoria que depende de otra
    curl -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Celulares y Tablets","description": "Dispositivos móviles y accesorios", "parent_id": 1 }'

 ## Ver categorias 
    curl -X GET http://localhost:3000/api/categories -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Buscar categoria por ID
    curl -X GET http://localhost:3000/api/categories/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Buscar por nombre
    curl -X GET "http://localhost:3000/api/categories/search?q=cel" -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Modificar categorias
    curl -X PUT http://localhost:3000/api/categories/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Laptops y Computadoras"}'

 ## eliminar categoria
    curl -v -X DELETE http://localhost:3000/api/categories/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"


# Proveedores 

 ## Insertar 
  ```shell
   curl -X POST http://localhost:3000/api/suppliers -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Tecnología del Golfo S.A.","contact_person": "Carlos Hernández","email": "contacto@tecnogolfo.com","phone": "229-555-0101", "address": "Blvd. Manuel Ávila Camacho 789, Boca del Río, VER","website": "https://tecnogolfo.com","status": "activo","tax_id": "TGO010203XYZ","payment_terms": "Net 30"}'
  ```

 ## ver 
  ```shell
   curl -X GET http://localhost:3000/api/suppliers -H "Authorization: Bearer <TU_TOKEN_JWT>"
  ```

 ## Buscar 
 ```shell
   curl -X GET "http://localhost:3000/api/suppliers/search?q=Golfo" -H "Authorization: Bearer <TU_TOKEN_JWT>"
  ```

 ## editar 
 ```shell
   curl -X PUT http://localhost:3000/api/suppliers/ID -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"phone": "229-555-0202","status": "inactivo"}'
  ```

 ## eliminar 
 ```shell
   curl -X DELETE http://localhost:3000/api/suppliers/ID -H "Authorization: Bearer <TU_TOKEN_JWT>"
  ```


# Productos

 ## Insertar 
  ```shell
   curl -v -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Teclado Mecánico RGB TKL", "sku": "TEC-RGB-TKL-001", "barcode": "7501234567890", "description": "Teclado mecánico Tenkeyless con switches azules y retroiluminación RGB personalizable.","price": 1899.99, "cost_price": 1200.00, "product_type": "product", "status": "active", "category_id": 1, "supplier_id": 1, "weight": 0.85,"height": 4.5, "width": 36.0, "depth": 14.0, "custom_fields": { "tipo_switch": "Blue Gateron", "formato": "TKL (Tenkeyless)", "conexion": "USB-C" } }'
  ```

 ## Ver productos 
 ```shell
   curl -v -X GET http://localhost:3000/api/products -H "Authorization: Bearer <TU_TOKEN_JWT>"
  ```
 ## Buscar Productod 
  ```shell
   curl -v -X GET "http://localhost:3000/api/products/search?q=Teclado" -H "Authorization: Bearer <TU_TOKEN_JWT>"
  ```
 ## Modificar 
  ```shell
   curl -v -X PUT http://localhost:3000/api/products/ID -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{ "price": 1850.00,"stock_quantity": 45, "status": "discontinued" }'
  ```

 ## Eliminar 
  ```shell
   curl -v -X DELETE http://localhost:3000/api/products/ID -H "Authorization: Bearer <TU_TOKEN_JWT>"
  ```

# Inventario

## Casos 
A. Llegó mercancía (Sumar)
Llegaron 50 teclados nuevos del proveedor

curl -v -X PUT http://localhost:3000/api/products/8/inventory  -H "Authorization: Bearer <TU_TOKEN_JWT>" -H "Content-Type: application/json" -d '{"type": "add", "quantity": 50,"reason": "Recepción de pedido de proveedor #XP-900"}'

B. Se rompió algo (Restar)
Un empleado tiró una caja y se rompieron 2.
curl -v -X PUT http://localhost:3000/api/products/8/inventory -H "Authorization: Bearer <TU_TOKEN_JWT>" -H "Content-Type: application/json" -d '{"type": "subtract","quantity": 2,"reason": "Merma: Daño en almacén, caja caída"}' 

C. Auditoría (Fijar)
El sistema dice que hay 100, pero contaste físicamente y hay 98. Corriges el número real.
curl -v -X PUT http://localhost:3000/api/products/8/inventory -H "Authorization: Bearer <TU_TOKEN_JWT>" -H "Content-Type: application/json" -d '{"type": "set","quantity": 98,"reason": "Ajuste por inventario físico mensual"}'

# Ver inventario
curl -X GET http://localhost:3000/api/products/inventory-logs -H "Authorization: Bearer <TU_TOKEN_JWT>"

## ver los movimientos de inventario de un producto en espesifico 
curl -X GET http://localhost:3000/api/products/8/inventory-logs "Authorization: Bearer <TU_TOKEN_JWT>"

# Clientes 

 ## Crear Clientes
    ```shell
    curl -v -X POST http://localhost:3000/api/clients -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{ "first_name": "Juan","last_name": "Pérez", "email": "juan.perez@dominio.com", "phone": "222-123-4567", "company_name": "Comercializadora Pérez", "status": "lead"}'
    ```

 ## Buscar Clientes 
    ```shell
    curl -v -X GET "http://localhost:3000/api/clients/search?q=Juan" -H "Authorization: Bearer <TU_TOKEN_JWT>"
    ```

 ## Ver clientes 
    ```shell
    curl -v -X GET http://localhost:3000/api/clients -H "Authorization: Bearer <TU_TOKEN_JWT>"
    ```

 ## Editar clientes 
    ```shell
    curl -v -X PUT http://localhost:3000/api/clients/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{ "phone": "222-987-6543", "status": "active" }'
    ```

 ## Eliminar clientes 
   ```shell
   curl -v -X DELETE http://localhost:3000/api/clients/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"
   ```

# Visitas

  ## Asignar visitita (add.visits)
   ```shell
   curl -X POST http://localhost:3000/api/visits -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN_DE_VENDEDOR>" -d '{ "client_id": 1, "scheduled_for": "2025-10-30T10:00:00", "notes": "Llevar el nuevo catálogo de productos."}'
   ```
   
  ## Asignar visita (add.visits + assign.visits)
    ```shell
    curl -X POST http://localhost:3000/api/visits -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN_DE_GERENTE>" -d '{ "client_id": 2, "user_id": 10, "scheduled_for": "2025-10-31T14:30:00", "notes": "Visita asignada a Juan (ID 10) por Gerencia." }'
    ```

  ## Ver visitas
  ```shell
   curl -X GET http://localhost:3000/api/visits -H "Authorization: Bearer <TU_TOKEN_JWT>"
   ```

  ## Editar visitas (edit.visits)
   ```shell
   curl -X PUT http://localhost:3000/api/visits/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN_DE_VENDEDOR_DUEÑO>" -d '{"status": "completed","notes": "Visita completada. El cliente está interesado en el producto SKU-123. Enviar cotización."}'
   ```

  ## Editar Visita (edit.visits + assign.visits)
   ```shell
   curl -X PUT http://localhost:3000/api/visits/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN_DE_GERENTE>" -d '{"user_id": 11,"notes": "Reasignada a Ana (ID 11) porque Juan está ocupado."}'
   ```

  ## Eliminar visita
  ``` shell
   curl -X DELETE http://localhost:3000/api/visits/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"
   ```


# Oredenes 

  ## Crear un Pedido (add.order)
    ```shell
    curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{ "client_id": 1, "shipping_address": "Av. Siempre Viva 742, Springfield",  "notes": "Entregar solo por las tardes.",  "items": [    { "product_id": 8, "quantity": 2 },{ "product_id": 9, "quantity": 1 }]}'
    ```

  ## Ver Pedidos (view.own.orders / view.all.orders)
    ```shell
    curl -X GET http://localhost:3000/api/orders -H "Authorization: Bearer <TU_TOKEN_JWT>"
    ```

  ## Actualizar Estado del Pedido (edit.order.status)
    ```shell
    curl -X PUT http://localhost:3000/api/orders/1/status -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT_ALMACEN>" -d '{"status": "processing"}'
    ```

  ## Cancelar un Pedido (cancel.order)
    ```shell
    curl -X PUT http://localhost:3000/api/orders/1/cancel -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT_ADMIN>"
    ```

  # Ver items de la orden por ID (VIEW_OWN_ORDERS)

curl -v -X GET http://localhost:3000/api/orders/101/items -H "Authorization: Bearer <TU_TOKEN_JWT_ADMIN>"

  ## Agregar itemas a una orden (EDIT_ORDER_CONTENT)
  curl -v -X POST http://localhost:3000/api/orders/500/items -H "Authorization: Bearer <TU_TOKEN_JWT_ADMIN>" -H "Content-Type: application/json" -d '{"product_id": 10,"quantity": 2}'

  ## Eliminar un item de una orden (EDIT_ORDER_CONTENT)
    curl -v -X DELETE http://localhost:3000/api/orders/500/items/55 -H "Authorization: Bearer <TU_TOKEN_JWT_ADMIN>"

# Returns 
 ## Crear return 
  ## Escenario A: Devolución por Items (Falta de stock)
  ```shell
   curl -X POST http://localhost:3000/api/returns -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT_ALMACEN>" -d '{"order_id": 1,"reason": "Ajuste automático por falta de stock en despacho.","status": "completed","items": [{ "order_item_id": 15, "quantity": 1 }]}'
  ```
  ## Escenario B: Reembolso Manual (Ajuste de precio)
  ```shell
  curl -X POST http://localhost:3000/api/returns -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT_ADMIN>" -d '{"order_id": 2,"reason": "Ajuste de precio por promoción no aplicada.","status": "completed", "total_refunded": 200.50}'
  ```
  ## Ajustar estado del reembolso 
    
    curl -v -X PUT http://localhost:3000/api/returns/1/status -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"status": "completed"}'

  ## ver resturn 
  curl -v -X GET http://localhost:3000/api/returns -b cookies.txt -H "Authorization: Bearer <TU_TOKEN_JWT>"

  ## ver detalles de un return
    curl -v -X GET http://localhost:3000/api/returns/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"



# Imagenes 
## Subir imagen primaria
curl -X POST http://localhost:3000/api/products/10/images -H "Authorization: Bearer  <TU_TOKEN_JWT>" -F "image=@images.jpeg" -F "is_primary=true"

### Respuesta
{"success":true,"message":"Imagen subida exitosamente.","data":{"id":6,"image_path":"/uploads/products/1763533798900-344045963.jpeg","is_primary":true,"display_order":0}}%            

## Subir imagen con orden 
curl -X POST http://localhost:3000/api/products/10/images -H "Authorization: Bearer  <TU_TOKEN_JWT>" -F "image=@images.jpeg" -F "display_order=2"
### Respuesta
{"success":true,"message":"Imagen subida exitosamente.","data":{"id":7,"image_path":"/uploads/products/1763533805787-754000999.jpeg","is_primary":false,"display_order":2}}

## Ver por ID de produto
 curl -X GET http://localhost:3000/api/products/10/images -H "Authorization: Bearer  <TU_TOKEN_JWT>"
{"success":true,"data":[{"id":6,"image_path":"/uploads/products/1763533798900-344045963.jpeg","alt_text":null,"display_order":0,"is_primary":1},{"id":7,"image_path":"/uploads/products/1763533805787-754000999.jpeg","alt_text":null,"display_order":2,"is_primary":0}]}

## Eliminar 
curl -X DELETE http://localhost:3000/api/products/images/7 -H "Authorization: Bearer  <TU_TOKEN_JWT>"
### Respuesta
{"success":true,"message":"Imagen eliminada exitosamente."}


# Pagos

  ## Generar un pago 
    curl -X POST http://localhost:3000/api/payments -H "Authorization: Bearer  <TU_TOKEN_JWT>" -H "Content-Type: application/json" -d '{"order_id": 101,"amount": 500.00,"method": "cash","notes": "Pago parcial en mostrador"}'
  ## Obtener los abonos de un pago
    curl -X GET http://localhost:3000/api/payments/order/101 -H "Authorization: Bearer <TU_TOKEN_JWT>"  
  ## Obtener todos los abonos 
    curl -X GET http://localhost:3000/api/payments -H "Authorization: Bearer <TU_TOKEN_JWT>"

# Finanzas 
  ## Total de cuentas
  curl -v -X GET http://localhost:3000/api/finance/dashboard -H "Authorization: Bearer  <TU_TOKEN_JWT>"

  {"success":true,"data":{"gross_sales":2569711.5,"net_income":10500,"accounts_receivable":2559211.5,"total_refunds":28623.98}}
  ## Productos mas vendidos 
  curl -v -X GET http://localhost:3000/api/finance/reports/top-products -H "Authorization: Bearer  <TU_TOKEN_JWT>"
  {"success":true,"data":[{"product_name":"Fertilizante","total_sold":"201","total_revenue":"2474712.00"},{"product_name":"Teclado Mecánico RGB TKL","total_sold":"50","total_revenue":"94999.50"}]}
  ## Productos menos vendidos 
  curl -v -X GET http://localhost:3000/api/finance/reports/least-sold -H "Authorization: Bearer  <TU_TOKEN_JWT>"
  {"success":true,"data":[{"product_name":"Teclado Mecánico RGB TKL","total_sold":"50"},{"product_name":"Fertilizante","total_sold":"201"}]}

  ## Mejor cliente
    curl -X GET http://localhost:3000/api/clients/reports/best -H "Authorization: Bearer  <TU_TOKEN_JWT>"


# Datos empresa 
## actualizar datos
Parámetros (Body):
name (Obligatorio la primera vez)
legal_name
tax_id
email
phone
address
website
logo (Archivo de imagen, opcional)

Ejemplo con cURL (Actualizando datos y logo):

curl -X PUT http://localhost:3000/api/company -H "Authorization: Bearer <TU_TOKEN_JWT>" -F "name=Akima Tech S.A." -F "phone=5512345678" -F "logo=@mi_logo_nuevo.png"

## Ver datos 
  curl -v -X GET http://localhost:3000/api/company -H "Authorization: Bearer <TU_TOKEN_JWT>"


# Banner
  curl -v -X POST http://localhost:3000/api/content/banners -H "Authorization: Bearer <TU_TOKEN_JWT>" -F "image=@promo_verano.jpg" -F "title=Gran Venta de Verano" -F "link_url=/ofertas" -F "display_order=1"

 ## Publica
  curl -v -X GET http://localhost:3000/api/content/banners 



# Publicas

  ## Catalogo web 
   curl -v -X GET http://localhost:3000/api/products/catalog


   scp -o "HostKeyAlgorithms=+ssh-rsa,rsa-sha2-512,rsa-sha2-256" -i /home/s4nti/Documentos/aws/alkimia.pem -r dist/* ubuntu@ec2-52-14-208-243.us-east-2.compute.amazonaws.com:/var/www/crm

  ## Buscador
   curl -X GET "http://localhost:3000/api/products/catalog/search?q=teclado"