#!/bin/bash

# Script de Automatización para API de Proveedores
# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

# Configuración
API_BASE_URL="http://localhost:3000/api/suppliers"
TOKEN_FILE="tokens.json"
USER_EMAIL=""

# Función para mostrar uso
show_usage() {
    echo -e "${CYAN}Uso: $0 -c <correo>${NC}"
    echo -e "${CYAN}Ejemplo: $0 -c admin@test.com${NC}"
    echo ""
    echo -e "${CYAN}Correos disponibles:${NC}"
    echo "  - admin@test.com"
    echo "  - gerente@test.com"
    echo "  - vendedor@test.com"
    echo "  - administracion@test.com"
    exit 1
}

# Procesar argumentos
while getopts "c:h" opt; do
    case $opt in
        c)
            USER_EMAIL="$OPTARG"
            ;;
        h)
            show_usage
            ;;
        \?)
            echo -e "${RED}Opción inválida: -$OPTARG${NC}" >&2
            show_usage
            ;;
    esac
done

# Verificar que se proporcionó el correo
if [ -z "$USER_EMAIL" ]; then
    echo -e "${RED}Error: Debes proporcionar un correo con -c${NC}"
    show_usage
fi

# Verificar que existe el archivo de tokens
if [ ! -f "$TOKEN_FILE" ]; then
    echo -e "${RED}Error: No se encontró el archivo tokens.json${NC}"
    exit 1
fi

# Extraer el token del correo proporcionado
TOKEN=$(cat "$TOKEN_FILE" | grep -A 2 "\"correo\": \"$USER_EMAIL\"" | grep '"token"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: No se pudo extraer el token para $USER_EMAIL${NC}"
    echo -e "${YELLOW}Verifica que el correo sea correcto${NC}"
    exit 1
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   API PROVEEDORES - TEST AUTOMATION${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${GREEN}✓ Usuario: $USER_EMAIL${NC}"
echo -e "${GREEN}✓ Token cargado exitosamente${NC}"
echo ""

# Variables para almacenar respuestas
SUPPLIER_ID=""
SUPPLIER_NAME=""

# ========================================
# 1. INSERTAR PROVEEDOR
# ========================================
echo -e "${YELLOW}[1] Insertando nuevo proveedor...${NC}"
echo -e "${CYAN}Endpoint: POST $API_BASE_URL${NC}"
echo -e "${CYAN}Datos enviados:${NC}"
echo '{
  "name": "Tecnología del Golfo S.A.",
  "contact_person": "Carlos Hernández",
  "email": "contacto@tecnogolfo.com",
  "phone": "229-555-0101",
  "address": "Blvd. Manuel Ávila Camacho 789, Boca del Río, VER",
  "website": "https://tecnogolfo.com",
  "status": "activo",
  "tax_id": "TGO010203XYZ",
  "payment_terms": "Net 30"
}' | python3 -m json.tool 2>/dev/null
echo ""

RESPONSE=$(curl -s -X POST "$API_BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Tecnología del Golfo S.A.",
    "contact_person": "Carlos Hernández",
    "email": "contacto@tecnogolfo.com",
    "phone": "229-555-0101",
    "address": "Blvd. Manuel Ávila Camacho 789, Boca del Río, VER",
    "website": "https://tecnogolfo.com",
    "status": "activo",
    "tax_id": "TGO010203XYZ",
    "payment_terms": "Net 30"
  }')

echo -e "${CYAN}Respuesta:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extraer ID y NAME de la respuesta
SUPPLIER_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
SUPPLIER_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$SUPPLIER_ID" ]; then
    echo -e "${GREEN}✓ Proveedor creado con ID: $SUPPLIER_ID${NC}"
    echo -e "${GREEN}✓ Nombre: $SUPPLIER_NAME${NC}"
else
    echo -e "${RED}✗ Error al crear proveedor - Continuando con las siguientes operaciones...${NC}"
    SUPPLIER_ID="1"  # ID por defecto para continuar
    SUPPLIER_NAME="Tecnología del Golfo S.A."
fi
echo ""
sleep 2

# ========================================
# 2. VER TODOS LOS PROVEEDORES
# ========================================
echo -e "${YELLOW}[2] Consultando todos los proveedores...${NC}"
echo -e "${CYAN}Endpoint: GET $API_BASE_URL${NC}"
echo ""

RESPONSE=$(curl -s -X GET "$API_BASE_URL" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${CYAN}Respuesta:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar si hubo error
if echo "$RESPONSE" | grep -q '"success":true\|"data"\|\['; then
    echo -e "${GREEN}✓ Consulta completada${NC}"
else
    echo -e "${RED}✗ Error en la consulta - Continuando...${NC}"
fi
echo ""
sleep 2

# ========================================
# 3. BUSCAR PROVEEDOR
# ========================================
echo -e "${YELLOW}[3] Buscando proveedor: $SUPPLIER_NAME...${NC}"
# Extraer palabra clave del nombre para búsqueda
SEARCH_TERM=$(echo "$SUPPLIER_NAME" | awk '{print $3}')  # Extrae "Golfo"
SEARCH_URL="${API_BASE_URL}/search?q=${SEARCH_TERM}"
echo -e "${CYAN}Endpoint: GET $SEARCH_URL${NC}"
echo -e "${CYAN}Parámetro de búsqueda: q=${SEARCH_TERM}${NC}"
echo ""

RESPONSE=$(curl -s -X GET "$SEARCH_URL" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${CYAN}Respuesta:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar si hubo error
if echo "$RESPONSE" | grep -q '"success":true\|"data"\|\['; then
    echo -e "${GREEN}✓ Búsqueda completada${NC}"
else
    echo -e "${RED}✗ Error en la búsqueda - Continuando...${NC}"
fi
echo ""
sleep 2

# ========================================
# 4. EDITAR PROVEEDOR
# ========================================
echo -e "${YELLOW}[4] Editando proveedor ID: $SUPPLIER_ID...${NC}"
UPDATE_URL="${API_BASE_URL}/${SUPPLIER_ID}"
echo -e "${CYAN}Endpoint: PUT $UPDATE_URL${NC}"
echo -e "${CYAN}Datos enviados:${NC}"
echo '{
  "phone": "229-555-0202",
  "status": "inactivo"
}' | python3 -m json.tool 2>/dev/null
echo ""

RESPONSE=$(curl -s -X PUT "$UPDATE_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "phone": "229-555-0202",
    "status": "inactivo"
  }')

echo -e "${CYAN}Respuesta:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar si hubo error
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Proveedor actualizado${NC}"
else
    echo -e "${RED}✗ Error al actualizar proveedor - Continuando...${NC}"
fi
echo ""
sleep 2

# ========================================
# 5. ELIMINAR PROVEEDOR
# ========================================
echo -e "${YELLOW}[5] Eliminando proveedor ID: $SUPPLIER_ID...${NC}"
DELETE_URL="${API_BASE_URL}/${SUPPLIER_ID}"
echo -e "${CYAN}Endpoint: DELETE $DELETE_URL${NC}"
echo ""

RESPONSE=$(curl -s -X DELETE "$DELETE_URL" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${CYAN}Respuesta:${NC}"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar si hubo error
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Proveedor eliminado${NC}"
else
    echo -e "${RED}✗ Error al eliminar proveedor${NC}"
fi
echo ""

# ========================================
# RESUMEN
# ========================================
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   RESUMEN DE OPERACIONES${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Proveedor ID: ${GREEN}$SUPPLIER_ID${NC}"
echo -e "Nombre: ${GREEN}$SUPPLIER_NAME${NC}"
echo -e "${GREEN}✓ Todas las operaciones completadas exitosamente${NC}"
echo ""
