#!/bin/bash

# Script de automatización de peticiones API
# Uso: ./script.sh -c correo [-I] [-E] [-D] [-V] [-S] [-t "texto"]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables globales
API_URL="http://localhost:3000/api/products"
TOKEN=""
CORREO=""
PRODUCT_ID=""
WAIT_TIME=2

# Flags para operaciones
DO_INSERT=false
DO_EDIT=false
DO_DELETE=false
DO_VIEW=false
DO_SEARCH=false
SEARCH_TEXT=""

# Función para mostrar uso
show_usage() {
    echo "Uso: $0 -c correo [opciones]"
    echo ""
    echo "Opciones:"
    echo "  -c CORREO          Correo del usuario (requerido)"
    echo "  -I                 Realizar petición de INSERTAR"
    echo "  -E                 Realizar petición de MODIFICAR"
    echo "  -D                 Realizar petición de ELIMINAR"
    echo "  -V                 Realizar petición de VER productos"
    echo "  -S                 Realizar petición de BUSCAR"
    echo "  -t TEXTO           Texto de búsqueda (requerido con -S)"
    echo ""
    echo "Si no se especifica ninguna operación, se ejecutarán todas en orden."
    exit 1
}

# Función para obtener el token desde tokens.json
get_token() {
    local email=$1
    
    if [ ! -f "tokens.json" ]; then
        echo -e "${RED}Error: No se encontró el archivo tokens.json${NC}"
        exit 1
    fi
    
    # Extraer el token del JSON usando jq si está disponible, sino usar grep/sed
    if command -v jq &> /dev/null; then
        TOKEN=$(jq -r ".[] | select(.correo==\"$email\") | .token" tokens.json)
    else
        # Método alternativo sin jq
        TOKEN=$(grep -A 2 "\"correo\": \"$email\"" tokens.json | grep "\"token\"" | sed 's/.*"token": "\(.*\)".*/\1/')
    fi
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Error: No se encontró el token para el correo: $email${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Token obtenido para: $email${NC}"
}

# Función para imprimir encabezado de operación
print_operation() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

# Función para insertar producto
insert_product() {
    print_operation "INSERTANDO PRODUCTO"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
            "name": "Teclado Mecánico RGB TKL",
            "sku": "TEC-RGB-TKL-001",
            "barcode": "7501234567890",
            "description": "Teclado mecánico Tenkeyless con switches azules y retroiluminación RGB personalizable.",
            "price": 1899.99,
            "cost_price": 1200.00,
            "stock_quantity": 50,
            "product_type": "product",
            "status": "active",
            "category_id": 4,
            "supplier_id": 1,
            "weight": 0.85,
            "height": 4.5,
            "width": 36.0,
            "depth": 14.0,
            "custom_fields": {
                "tipo_switch": "Blue Gateron",
                "formato": "TKL (Tenkeyless)",
                "conexion": "USB-C"
            }
        }')
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -e "Código HTTP: ${YELLOW}$http_code${NC}"
    echo -e "Respuesta:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    # Extraer el ID del producto
    if command -v jq &> /dev/null; then
        PRODUCT_ID=$(echo "$body" | jq -r '.data.id // empty')
    else
        PRODUCT_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    fi
    
    if [ -n "$PRODUCT_ID" ]; then
        echo -e "${GREEN}✓ Producto creado con ID: $PRODUCT_ID${NC}"
    else
        echo -e "${RED}✗ No se pudo extraer el ID del producto${NC}"
    fi
    
    sleep $WAIT_TIME
}

# Función para ver productos
view_products() {
    print_operation "CONSULTANDO PRODUCTOS"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL" \
        -H "Authorization: Bearer $TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -e "Código HTTP: ${YELLOW}$http_code${NC}"
    echo -e "Respuesta:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    sleep $WAIT_TIME
}

# Función para buscar productos
search_products() {
    print_operation "BUSCANDO PRODUCTOS: '$SEARCH_TEXT'"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/search?q=${SEARCH_TEXT}" \
        -H "Authorization: Bearer $TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -e "Código HTTP: ${YELLOW}$http_code${NC}"
    echo -e "Respuesta:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    sleep $WAIT_TIME
}

# Función para modificar producto
edit_product() {
    print_operation "MODIFICANDO PRODUCTO ID: $PRODUCT_ID"
    
    if [ -z "$PRODUCT_ID" ]; then
        echo -e "${RED}Error: No hay un ID de producto disponible para modificar${NC}"
        echo -e "${YELLOW}Consejo: Ejecuta primero la operación de insertar (-I) o proporciona un ID manualmente${NC}"
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/${PRODUCT_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d '{
            "price": 1850.00,
            "stock_quantity": 45,
            "status": "discontinued"
        }')
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -e "Código HTTP: ${YELLOW}$http_code${NC}"
    echo -e "Respuesta:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    sleep $WAIT_TIME
}

# Función para eliminar producto
delete_product() {
    print_operation "ELIMINANDO PRODUCTO ID: $PRODUCT_ID"
    
    if [ -z "$PRODUCT_ID" ]; then
        echo -e "${RED}Error: No hay un ID de producto disponible para eliminar${NC}"
        echo -e "${YELLOW}Consejo: Ejecuta primero la operación de insertar (-I) o proporciona un ID manualmente${NC}"
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" -X DELETE "${API_URL}/${PRODUCT_ID}" \
        -H "Authorization: Bearer $TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -e "Código HTTP: ${YELLOW}$http_code${NC}"
    echo -e "Respuesta:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    sleep $WAIT_TIME
}

# Procesar argumentos
if [ $# -eq 0 ]; then
    show_usage
fi

while getopts "c:IEDVSt:h" opt; do
    case $opt in
        c) CORREO="$OPTARG" ;;
        I) DO_INSERT=true ;;
        E) DO_EDIT=true ;;
        D) DO_DELETE=true ;;
        V) DO_VIEW=true ;;
        S) DO_SEARCH=true ;;
        t) SEARCH_TEXT="$OPTARG" ;;
        h) show_usage ;;
        \?) echo "Opción inválida: -$OPTARG" >&2; show_usage ;;
    esac
done

# Validar que se proporcionó el correo
if [ -z "$CORREO" ]; then
    echo -e "${RED}Error: Debes especificar un correo con -c${NC}"
    show_usage
fi

# Validar que si se usa -S, se proporcionó -t
if [ "$DO_SEARCH" = true ] && [ -z "$SEARCH_TEXT" ]; then
    echo -e "${RED}Error: Debes especificar un texto de búsqueda con -t cuando uses -S${NC}"
    show_usage
fi

# Si no se especificó ninguna operación, hacer todas
if [ "$DO_INSERT" = false ] && [ "$DO_EDIT" = false ] && [ "$DO_DELETE" = false ] && [ "$DO_VIEW" = false ] && [ "$DO_SEARCH" = false ]; then
    DO_INSERT=true
    DO_EDIT=true
    DO_DELETE=true
    DO_VIEW=true
    DO_SEARCH=true
    SEARCH_TEXT="Teclado"
fi

# Obtener el token
get_token "$CORREO"

echo -e "${GREEN}Iniciando operaciones...${NC}"

# Ejecutar operaciones en orden
if [ "$DO_INSERT" = true ]; then
    insert_product || echo -e "${RED}✗ Falló la inserción, pero continuando...${NC}"
fi

if [ "$DO_VIEW" = true ]; then
    view_products || echo -e "${RED}✗ Falló la consulta, pero continuando...${NC}"
fi

if [ "$DO_SEARCH" = true ]; then
    search_products || echo -e "${RED}✗ Falló la búsqueda, pero continuando...${NC}"
fi

if [ "$DO_EDIT" = true ]; then
    edit_product || echo -e "${RED}✗ Falló la modificación, pero continuando...${NC}"
fi

if [ "$DO_DELETE" = true ]; then
    delete_product || echo -e "${RED}✗ Falló la eliminación, pero continuando...${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Operaciones completadas${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"