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
    curl -v -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Celulares y Tablets","description": "Dispositivos móviles y accesorios"}'

 ## Insertar Una nueva categoria que depende de otra
    curl -v -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Celulares y Tablets","description": "Dispositivos móviles y accesorios", "parent_id": 1 }'

 ## Ver categorias 
    curl -v -X GET http://localhost:3000/api/categories -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Buscar categoria por ID
    curl -v -X GET http://localhost:3000/api/categories/1 -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## BUscar por nombre
    curl -v -X GET "http://localhost:3000/api/categories/search?q=cel" -H "Authorization: Bearer <TU_TOKEN_JWT>"

 ## Modificar categorias
    curl -v -X PUT http://localhost:3000/api/categories/1 -H "Content-Type: application/json" -H "Authorization: Bearer <TU_TOKEN_JWT>" -d '{"name": "Laptops y Computadoras"}'

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