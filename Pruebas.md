# Login
    curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{ "Correo": "admin@test.com", "Passwd": "test123"}'
    curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{ "Correo": "gerente@test.com", "Passwd": "test123"}'
    curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{ "Correo": "vendedor@test.com"", "Passwd": "test123"}'
    curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{ "Correo": "administracion@test.com", "Passwd": "test123"}'

# Registrer
    curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"Nombre": "Admin F", "Correo": "admin@test.com", "Passwd": "test123"}'

    curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"Nombre": "Juan Flores", "Correo": "gerente@test.com"","Passwd":"test123"}'
    curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"Nombre": "vendedor Flores","Correo": "vendedor@test.com"","Passwd": "test123"}'

    curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"Nombre": "adm Flores","Correo": "administracion@test.com","Passwd": "test123"}'

# Categorias

 ## Insertar Una nueva categoria
    curl -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Celulares y Tablets","description": "Dispositivos móviles y accesorios"}'

 ## Insertar Una nueva categoria que depende de otra
    curl -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Celulares y Tablets","description": "Dispositivos móviles y accesorios", "parent_id": 1 }'

 ## Ver categorias 
    curl -X GET http://localhost:3000/api/categories -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Buscar categoria por ID
    curl -X GET http://localhost:3000/api/categories/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## BUscar por nombre
    curl -X GET "http://localhost:3000/api/categories/search?q=cel" -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Modificar categorias
    curl -X PUT http://localhost:3000/api/categories/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Laptops y Computadoras"}'

 ## eliminar categoria
    curl -v -X DELETE http://localhost:3000/api/categories/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"


# Proveedores 

 ## Insertar 
   curl -X POST http://localhost:3000/api/suppliers -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Tecnología del Golfo S.A.","contact_person": "Carlos Hernández","email": "contacto@tecnogolfo.com","phone": "229-555-0101", "address": "Blvd. Manuel Ávila Camacho 789, Boca del Río, VER","website": "https://tecnogolfo.com","status": "activo","tax_id": "TGO010203XYZ","payment_terms": "Net 30"}'

 ## ver 
   curl -X GET http://localhost:3000/api/suppliers -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## BUscar 
   curl -X GET "http://localhost:3000/api/suppliers/search?q=Golfo" -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## editar 
   curl -X PUT http://localhost:3000/api/suppliers/ID -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"phone": "229-555-0202","status": "inactivo"}'

 ## eliminar 
   curl -X DELETE http://localhost:3000/api/suppliers/ID -H "Authorization: Bearer <TU_TOKEN_JWT>"



# Productos

 ## Insertar 
   curl -v -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Teclado Mecánico RGB TKL", "sku": "TEC-RGB-TKL-001", "barcode": "7501234567890", "description": "Teclado mecánico Tenkeyless con switches azules y retroiluminación RGB personalizable.","price": 1899.99, "cost_price": 1200.00, "stock_quantity": 50, "product_type": "product", "status": "active", "category_id": 1, "supplier_id": 1, "weight": 0.85,"height": 4.5, "width": 36.0, "depth": 14.0, "custom_fields": { "tipo_switch": "Blue Gateron", "formato": "TKL (Tenkeyless)", "conexion": "USB-C" } }'

 ## Ver productos 
   curl -v -X GET http://localhost:3000/api/products -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Buscar Productod 

   curl -v -X GET "http://localhost:3000/api/products/search?q=Teclado" -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Modificar 

   curl -v -X PUT http://localhost:3000/api/products/ID -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{ "price": 1850.00,"stock_quantity": 45, "status": "discontinued" }'

 ## Eliminar 
   curl -v -X DELETE http://localhost:3000/api/products/ID -H "Authorization: Bearer <TU_TOKEN_JWT>"



# Clientes 

 ## Crear Clientes
  curl -v -X POST http://localhost:3000/api/clients -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{ "first_name": "Juan","last_name": "Pérez", "email": "juan.perez@dominio.com", "phone": "222-123-4567", "company_name": "Comercializadora Pérez", "status": "lead"}'

 ## Buscar Clientes 
  
  curl -v -X GET "http://localhost:3000/api/clients/search?q=Juan" -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Ver clientes 

  curl -v -X GET http://localhost:3000/api/clients -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Editar clientes 
  
  curl -v -X PUT http://localhost:3000/api/clients/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{ "phone": "222-987-6543", "status": "active" }'

 ## Eliminar clientes 
   curl -v -X DELETE http://localhost:3000/api/clients/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"