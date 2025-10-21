#!/bin/bash

# Colores para la salida
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

# Configuración
API_URL="http://localhost:3000/api/users/login"
OUTPUT_TXT="tokens.txt"
OUTPUT_JSON="tokens.json"

# Array de usuarios para probar
declare -a USUARIOS=(
  "admin@test.com:test123:Administrador"
  "gerente@test.com:test123:Gerente"
  "vendedor@test.com:test123:Vendedor"
  "administracion@test.com:test123:Administración"
)

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  PRUEBAS DE LOGIN AUTOMÁTICAS${NC}"
echo -e "${BLUE}================================${NC}\n"

# Limpiar archivos de salida si existen
> "$OUTPUT_TXT"
echo "[" > "$OUTPUT_JSON"

# Contador de pruebas
EXITOSAS=0
FALLIDAS=0
PRIMERA_ENTRADA=true

# Iterar sobre cada usuario
for usuario in "${USUARIOS[@]}"; do
  # Separar los datos (correo:password:nombre)
  IFS=':' read -r CORREO PASSWD NOMBRE <<< "$usuario"
  
  # Hacer la petición curl y guardar la respuesta
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"Correo\": \"$CORREO\", \"Passwd\": \"$PASSWD\"}")
  
  # Extraer datos de la respuesta
  SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,]*' | sed 's/"success"://')
  TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  ROL=$(echo "$RESPONSE" | grep -o '"rol":"[^"]*' | sed 's/"rol":"//')
  
  # Verificar el resultado
  if [ "$SUCCESS" = "true" ] && [ ! -z "$TOKEN" ]; then
    # Mostrar en el formato solicitado
    echo -e "Correo: ${YELLOW}$CORREO${NC} Token: ${GREEN}${TOKEN:0:50}...${NC} Rol: ${BLUE}$ROL${NC}"
    echo ""
    
    # Guardar en archivo TXT
    echo "$CORREO" >> "$OUTPUT_TXT"
    echo "$ROL" >> "$OUTPUT_TXT"
    echo "$TOKEN" >> "$OUTPUT_TXT"
    echo "" >> "$OUTPUT_TXT"
    
    # Guardar en archivo JSON
    if [ "$PRIMERA_ENTRADA" = true ]; then
      PRIMERA_ENTRADA=false
    else
      echo "," >> "$OUTPUT_JSON"
    fi
    
    cat >> "$OUTPUT_JSON" << EOF
  {
    "correo": "$CORREO",
    "rol": "$ROL",
    "token": "$TOKEN"
  }
EOF
    
    ((EXITOSAS++))
  else
    # Extraer mensaje de error
    MESSAGE=$(echo "$RESPONSE" | grep -o '"message":"[^"]*' | sed 's/"message":"//')
    echo -e "Correo: ${YELLOW}$CORREO${NC} ${RED}Error: $MESSAGE${NC}"
    echo ""
    ((FALLIDAS++))
  fi
  
  # Pequeña pausa entre peticiones
  sleep 1
done

# Cerrar el archivo JSON
echo "" >> "$OUTPUT_JSON"
echo "]" >> "$OUTPUT_JSON"

# Resumen final
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}         RESUMEN${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Exitosas: $EXITOSAS${NC}"
echo -e "${RED}Fallidas: $FALLIDAS${NC}"
if [ $EXITOSAS -gt 0 ]; then
  echo -e "${BLUE}Tokens guardados en: $OUTPUT_TXT y $OUTPUT_JSON${NC}"
fi
echo -e "${BLUE}================================${NC}"
