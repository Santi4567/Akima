#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:3000/api/clients"
TOKENS_FILE="tokens.json"
CORREO=""
HACER_INSERT=false
HACER_EDIT=false
HACER_DELETE=false
HACER_TODO=false

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 -C <correo> [-I] [-E] [-D]"
    echo ""
    echo "Opciones:"
    echo "  -C <correo>    Correo del usuario (requerido)"
    echo "  -I             Ejecutar operaciones de Insertar, Ver y Buscar"
    echo "  -E             Ejecutar operación de Editar"
    echo "  -D             Ejecutar operación de Eliminar"
    echo "  -h             Mostrar esta ayuda"
    echo ""
    echo "Si no se especifica -I, -E o -D, se ejecutarán todas las operaciones"
    exit 1
}

# Función para obtener token
get_token() {
    local correo=$1
    token=$(jq -r --arg email "$correo" '.[] | select(.correo == $email) | .token' "$TOKENS_FILE")
    
    if [ -z "$token" ] || [ "$token" == "null" ]; then
        echo -e "${RED}Error: No se encontró token para el correo: $correo${NC}"
        exit 1
    fi
    echo "$token"
}

# Función para mostrar separador
print_separator() {
    echo -e "\n${BLUE}========================================${NC}"
}

# Función para mostrar título de operación
print_operation() {
    echo -e "${YELLOW}>>> $1${NC}"
}

# Función para crear cliente
crear_cliente() {
    local token=$1
    print_separator
    print_operation "CREAR CLIENTE"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{
            "first_name": "Juan",
            "last_name": "Pérez",
            "email": "juan.perez@dominio.com",
            "phone": "222-123-4567",
            "company_name": "Comercializadora Pérez",
            "status": "lead"
        }')
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extraer ID del cliente creado
    client_id=$(echo "$response" | jq -r '.id // .data.id // .client.id' 2>/dev/null)
    echo "$client_id"
}

# Función para ver clientes
ver_clientes() {
    local token=$1
    print_separator
    print_operation "VER TODOS LOS CLIENTES"
    
    response=$(curl -s -X GET "$API_URL" \
        -H "Authorization: Bearer $token")
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Función para buscar clientes
buscar_clientes() {
    local token=$1
    print_separator
    print_operation "BUSCAR CLIENTES (q=Juan)"
    
    response=$(curl -s -X GET "$API_URL/search?q=Juan" \
        -H "Authorization: Bearer $token")
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Función para editar cliente
editar_cliente() {
    local token=$1
    local client_id=$2
    print_separator
    print_operation "EDITAR CLIENTE (ID: $client_id)"
    
    response=$(curl -s -X PUT "$API_URL/$client_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{
            "phone": "222-987-6543",
            "status": "active"
        }')
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Función para eliminar cliente
eliminar_cliente() {
    local token=$1
    local client_id=$2
    print_separator
    print_operation "ELIMINAR CLIENTE (ID: $client_id)"
    
    response=$(curl -s -X DELETE "$API_URL/$client_id" \
        -H "Authorization: Bearer $token")
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Parsear argumentos
while getopts "C:IEDh" opt; do
    case $opt in
        C) CORREO="$OPTARG" ;;
        I) HACER_INSERT=true ;;
        E) HACER_EDIT=true ;;
        D) HACER_DELETE=true ;;
        h) show_help ;;
        *) show_help ;;
    esac
done

# Validar que se proporcionó el correo
if [ -z "$CORREO" ]; then
    echo -e "${RED}Error: Debe especificar el correo con -C${NC}"
    show_help
fi

# Si no se especificó ninguna operación, hacer todas
if [ "$HACER_INSERT" = false ] && [ "$HACER_EDIT" = false ] && [ "$HACER_DELETE" = false ]; then
    HACER_TODO=true
fi

# Verificar que existe el archivo de tokens
if [ ! -f "$TOKENS_FILE" ]; then
    echo -e "${RED}Error: No se encontró el archivo $TOKENS_FILE${NC}"
    exit 1
fi

# Verificar que jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq no está instalado. Instálalo con: sudo apt-get install jq${NC}"
    exit 1
fi

# Obtener token
echo -e "${BLUE}Obteniendo token para: $CORREO${NC}"
TOKEN=$(get_token "$CORREO")
echo -e "${GREEN}Token obtenido exitosamente${NC}"

CLIENT_ID=""

# Ejecutar operaciones según parámetros
if [ "$HACER_TODO" = true ] || [ "$HACER_INSERT" = true ]; then
    CLIENT_ID=$(crear_cliente "$TOKEN")
    ver_clientes "$TOKEN"
    buscar_clientes "$TOKEN"
fi

if [ "$HACER_TODO" = true ] || [ "$HACER_EDIT" = true ]; then
    if [ -z "$CLIENT_ID" ]; then
        echo -e "\n${YELLOW}Ingrese el ID del cliente a editar:${NC}"
        read -r CLIENT_ID
    fi
    editar_cliente "$TOKEN" "$CLIENT_ID"
fi

if [ "$HACER_TODO" = true ] || [ "$HACER_DELETE" = true ]; then
    if [ -z "$CLIENT_ID" ]; then
        echo -e "\n${YELLOW}Ingrese el ID del cliente a eliminar:${NC}"
        read -r CLIENT_ID
    fi
    eliminar_cliente "$TOKEN" "$CLIENT_ID"
fi

print_separator
echo -e "${GREEN}Operaciones completadas${NC}"
print_separator