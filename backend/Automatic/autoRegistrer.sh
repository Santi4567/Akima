#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

# Configuración
API_URL="http://localhost:3000/api/auth/register"

# Array de usuarios para registrar
declare -a USUARIOS=(
  "Admin F:admin@test.com:test123"
  "Juan Flores:gerente@test.com:test123"
  "vendedor Flores:vendedor@test.com:test123"
  "adm Flores:administracion@test.com:test123"
)

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  PRUEBAS DE REGISTRO AUTOMÁTICAS${NC}"
echo -e "${BLUE}=====================================${NC}\n"

# Contador de pruebas
EXITOSAS=0
FALLIDAS=0

# Iterar sobre cada usuario
for usuario in "${USUARIOS[@]}"; do
  # Separar los datos (nombre:correo:password)
  IFS=':' read -r NOMBRE CORREO PASSWD <<< "$usuario"
  
  # Hacer la petición curl y guardar la respuesta
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"Nombre\": \"$NOMBRE\", \"Correo\": \"$CORREO\", \"Passwd\": \"$PASSWD\"}")
  
  # Extraer el mensaje de la respuesta usando grep y sed
  MESSAGE=$(echo "$RESPONSE" | grep -o '"message":"[^"]*' | sed 's/"message":"//')
  
  # Verificar si la respuesta fue exitosa
  SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,]*' | sed 's/"success"://')
  
  # Mostrar el resultado en el formato solicitado
  if [ "$SUCCESS" = "true" ]; then
    echo -e "Cuenta: ${YELLOW}$CORREO${NC} Respuesta: ${GREEN}$MESSAGE${NC}"
    ((EXITOSAS++))
  else
    # Si hay error, el mensaje puede estar en "error" o "message"
    if [ -z "$MESSAGE" ]; then
      MESSAGE=$(echo "$RESPONSE" | grep -o '"error":"[^"]*' | sed 's/"error":"//')
    fi
    echo -e "Cuenta: ${YELLOW}$CORREO${NC} Respuesta: ${RED}$MESSAGE${NC}"
    ((FALLIDAS++))
  fi
  
  # Pequeña pausa entre peticiones
  sleep 1
done

# Resumen final
echo -e "\n${BLUE}=====================================${NC}"
echo -e "${BLUE}            RESUMEN${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Exitosas: $EXITOSAS${NC}"
echo -e "${RED}Fallidas: $FALLIDAS${NC}"
echo -e "${BLUE}=====================================${NC}"
