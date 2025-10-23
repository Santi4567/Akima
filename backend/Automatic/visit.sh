#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:3000/api/visits"
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
    echo "  -I             Ejecutar operaciones de Insertar y Ver"
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

# Función para obtener rol
get_rol() {
    local correo=$1
    rol=$(jq -r --arg email "$correo" '.[] | select(.correo == $email) | .rol' "$TOKENS_FILE")
    echo "$rol"
}

# Función para mostrar separador
print_separator() {
    echo -e "\n${BLUE}========================================${NC}"
}

# Función para mostrar título de operación
print_operation() {
    echo -e "${YELLOW}>>> $1${NC}"
}

# Función para crear visita (vendedor - solo asignar)
crear_visita_vendedor() {
    local token=$1
    print_separator
    print_operation "CREAR VISITA (Como Vendedor - add.visits)"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{
            "client_id": 3,
            "scheduled_for": "2025-10-30T10:00:00",
            "notes": "Llevar el nuevo catálogo de productos."
        }')
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extraer ID de la visita creada
    visit_id=$(echo "$response" | jq -r '.id // .data.id // .visit.id' 2>/dev/null)
    echo "$visit_id"
}

# Función para crear visita (gerente - asignar a otro usuario)
crear_visita_gerente() {
    local token=$1
    print_separator
    print_operation "CREAR VISITA (Como Gerente - add.visits + assign.visits)"
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{
            "client_id": 2,
            "user_id": 10,
            "scheduled_for": "2025-10-31T14:30:00",
            "notes": "Visita asignada a Juan (ID 10) por Gerencia."
        }')
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extraer ID de la visita creada
    visit_id=$(echo "$response" | jq -r '.id // .data.id // .visit.id' 2>/dev/null)
    echo "$visit_id"
}

# Función para ver visitas
ver_visitas() {
    local token=$1
    print_separator
    print_operation "VER TODAS LAS VISITAS"
    
    response=$(curl -s -X GET "$API_URL" \
        -H "Authorization: Bearer $token")
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Función para editar visita (vendedor - cambiar estado/notas)
editar_visita_vendedor() {
    local token=$1
    local visit_id=$2
    print_separator
    print_operation "EDITAR VISITA (Como Vendedor - edit.visits) (ID: $visit_id)"
    
    response=$(curl -s -X PUT "$API_URL/$visit_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{
            "status": "completed",
            "notes": "Visita completada. El cliente está interesado en el producto SKU-123. Enviar cotización."
        }')
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Función para editar visita (gerente - reasignar)
editar_visita_gerente() {
    local token=$1
    local visit_id=$2
    print_separator
    print_operation "EDITAR VISITA (Como Gerente - edit.visits + assign.visits) (ID: $visit_id)"
    
    response=$(curl -s -X PUT "$API_URL/$visit_id" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{
            "user_id": 11,
            "notes": "Reasignada a Ana (ID 11) porque Juan está ocupado."
        }')
    
    echo -e "${GREEN}Respuesta:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Función para eliminar visita
eliminar_visita() {
    local token=$1
    local visit_id=$2
    print_separator
    print_operation "ELIMINAR VISITA (ID: $visit_id)"
    
    response=$(curl -s -X DELETE "$API_URL/$visit_id" \
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

# Obtener token y rol
echo -e "${BLUE}Obteniendo token para: $CORREO${NC}"
TOKEN=$(get_token "$CORREO")
ROL=$(get_rol "$CORREO")
echo -e "${GREEN}Token obtenido exitosamente${NC}"
echo -e "${BLUE}Rol del usuario: $ROL${NC}"

VISIT_ID=""

# Ejecutar operaciones según parámetros
if [ "$HACER_TODO" = true ] || [ "$HACER_INSERT" = true ]; then
    # Crear visita según el rol
    if [ "$ROL" == "gerente" ] || [ "$ROL" == "admin" ]; then
        VISIT_ID=$(crear_visita_gerente "$TOKEN")
    else
        VISIT_ID=$(crear_visita_vendedor "$TOKEN")
    fi
    ver_visitas "$TOKEN"
fi

if [ "$HACER_TODO" = true ] || [ "$HACER_EDIT" = true ]; then
    if [ -z "$VISIT_ID" ]; then
        echo -e "\n${YELLOW}Ingrese el ID de la visita a editar:${NC}"
        read -r VISIT_ID
    fi
    
    # Editar visita según el rol
    if [ "$ROL" == "gerente" ] || [ "$ROL" == "admin" ]; then
        editar_visita_gerente "$TOKEN" "$VISIT_ID"
    else
        editar_visita_vendedor "$TOKEN" "$VISIT_ID"
    fi
fi

if [ "$HACER_TODO" = true ] || [ "$HACER_DELETE" = true ]; then
    if [ -z "$VISIT_ID" ]; then
        echo -e "\n${YELLOW}Ingrese el ID de la visita a eliminar:${NC}"
        read -r VISIT_ID
    fi
    eliminar_visita "$TOKEN" "$VISIT_ID"
fi

print_separator
echo -e "${GREEN}Operaciones completadas${NC}"
print_separator