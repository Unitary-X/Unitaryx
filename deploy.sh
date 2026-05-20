#!/bin/bash

################################################################################
# UNITARYX - PORTAINER STACK DEPLOYMENT SCRIPT (GitOps)
################################################################################
# 
# Usage: ./deploy.sh [deploy|update|destroy] [environment] [stack-name]
# 
# Examples:
#   ./deploy.sh deploy production unitaryx
#   ./deploy.sh update staging unitaryx-staging
#   ./deploy.sh destroy production unitaryx
#
# Requirements:
#   - Portainer API accessible
#   - jq installed (JSON parser)
#   - curl installed
#   - .env.production file configured
#

set -e

################################################################################
# CONFIGURATION
################################################################################

ACTION="${1:-deploy}"
ENVIRONMENT="${2:-production}"
STACK_NAME="${3:-unitaryx}"

# Portainer Configuration (set via environment variables)
PORTAINER_URL="${PORTAINER_URL:-https://localhost:9443}"
PORTAINER_USER="${PORTAINER_USER:-admin}"
PORTAINER_PASS="${PORTAINER_PASS:-}"
PORTAINER_ENV_ID="${PORTAINER_ENV_ID:-1}"  # Usually 1 for default Docker environment

# Docker Registry Configuration
REGISTRY="${REGISTRY:-}"
IMAGE_NAME="${IMAGE_NAME:-unitaryx}"
IMAGE_VERSION="${IMAGE_VERSION:-latest}"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.${ENVIRONMENT}"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
COMPOSE_TEMP="${SCRIPT_DIR}/.docker-compose.${ENVIRONMENT}.yml"

################################################################################
# FUNCTIONS
################################################################################

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log_success() {
    echo "✓ $*"
}

log_error() {
    echo "✗ ERROR: $*" >&2
}

log_info() {
    echo "ℹ $*"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    for cmd in curl jq; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done
    
    # Check files exist
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found at $COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Create it with: cp .env.example $ENV_FILE"
        exit 1
    fi
    
    # Check Portainer connectivity
    if ! curl -sf "$PORTAINER_URL" > /dev/null 2>&1; then
        log_error "Cannot connect to Portainer at $PORTAINER_URL"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

get_auth_token() {
    log_info "Authenticating with Portainer..."
    
    if [ -z "$PORTAINER_PASS" ]; then
        log_error "PORTAINER_PASS not set"
        exit 1
    fi
    
    TOKEN=$(curl -s -X POST "$PORTAINER_URL/api/auth" \
        -H "Content-Type: application/json" \
        -d "{\"Username\":\"$PORTAINER_USER\",\"Password\":\"$PORTAINER_PASS\"}" \
        | jq -r '.jwt // empty')
    
    if [ -z "$TOKEN" ]; then
        log_error "Failed to authenticate with Portainer"
        exit 1
    fi
    
    log_success "Authentication successful"
    echo "$TOKEN"
}

load_env_vars() {
    log_info "Loading environment variables from $ENV_FILE..."
    
    # Source the env file
    set -a
    source "$ENV_FILE"
    set +a
    
    log_success "Environment variables loaded"
}

get_stack_id() {
    local token="$1"
    local name="$2"
    
    STACK_ID=$(curl -s -H "Authorization: Bearer $token" \
        "$PORTAINER_URL/api/stacks?filters={\"Name\":\"$name\"}&endpointId=$PORTAINER_ENV_ID" \
        | jq -r '.[0].Id // empty')
    
    echo "$STACK_ID"
}

build_env_json() {
    log_info "Building environment variables JSON..."
    
    local env_json="["
    local first=true
    
    # Read .env file and build JSON array
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! -z "$line" && ! "$line" =~ ^# ]]; then
            local key=$(echo "$line" | cut -d= -f1)
            local value=$(echo "$line" | cut -d= -f2-)
            
            # Escape quotes in values
            value=$(echo "$value" | sed 's/"/\\"/g')
            
            if [ "$first" = true ]; then
                env_json+="{\"name\":\"$key\",\"value\":\"$value\"}"
                first=false
            else
                env_json+=",{\"name\":\"$key\",\"value\":\"$value\"}"
            fi
        fi
    done < "$ENV_FILE"
    
    env_json+="]"
    
    log_success "Environment variables prepared"
    echo "$env_json"
}

create_stack() {
    local token="$1"
    local compose_content="$2"
    local env_json="$3"
    
    log_info "Creating new stack: $STACK_NAME..."
    
    local response=$(curl -s -X POST "$PORTAINER_URL/api/stacks?endpointId=$PORTAINER_ENV_ID" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"Name\":\"$STACK_NAME\",
            \"StackFileContent\":$compose_content,
            \"Env\":$env_json
        }")
    
    local stack_id=$(echo "$response" | jq -r '.Id // empty')
    
    if [ -z "$stack_id" ]; then
        log_error "Failed to create stack"
        echo "$response" | jq .
        exit 1
    fi
    
    log_success "Stack created with ID: $stack_id"
}

update_stack() {
    local token="$1"
    local stack_id="$2"
    local compose_content="$3"
    local env_json="$4"
    
    log_info "Updating stack $STACK_NAME (ID: $stack_id)..."
    
    local response=$(curl -s -X PUT "$PORTAINER_URL/api/stacks/$stack_id?endpointId=$PORTAINER_ENV_ID" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "{
            \"StackFileContent\":$compose_content,
            \"Env\":$env_json
        }")
    
    local error=$(echo "$response" | jq -r '.err // empty')
    
    if [ ! -z "$error" ]; then
        log_error "Failed to update stack: $error"
        exit 1
    fi
    
    log_success "Stack updated successfully"
}

delete_stack() {
    local token="$1"
    local stack_id="$2"
    
    log_info "Deleting stack $STACK_NAME (ID: $stack_id)..."
    
    read -p "Are you sure you want to delete the stack? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deletion cancelled"
        return
    fi
    
    curl -s -X DELETE "$PORTAINER_URL/api/stacks/$stack_id?endpointId=$PORTAINER_ENV_ID" \
        -H "Authorization: Bearer $token" \
        > /dev/null
    
    log_success "Stack deleted"
}

verify_deployment() {
    local token="$1"
    local stack_id="$2"
    
    log_info "Verifying deployment..."
    
    # Wait a few seconds for containers to start
    sleep 3
    
    # Get stack status
    local status=$(curl -s -H "Authorization: Bearer $token" \
        "$PORTAINER_URL/api/stacks/$stack_id?endpointId=$PORTAINER_ENV_ID" \
        | jq -r '.Status // empty')
    
    log_info "Stack Status: $status"
    
    # Get container statuses
    log_info "Container status:"
    curl -s -H "Authorization: Bearer $token" \
        "$PORTAINER_URL/api/stacks/$stack_id?endpointId=$PORTAINER_ENV_ID" \
        | jq -r '.ResourceControl // {}' 2>/dev/null || true
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    log "═══════════════════════════════════════════════════════════════════════════════"
    log "UnitaryX Stack Deployment Script"
    log "Action: $ACTION | Environment: $ENVIRONMENT | Stack: $STACK_NAME"
    log "═══════════════════════════════════════════════════════════════════════════════"
    
    # Validate action
    if [[ ! "$ACTION" =~ ^(deploy|update|destroy)$ ]]; then
        log_error "Invalid action: $ACTION (must be: deploy, update, destroy)"
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Load environment variables
    load_env_vars
    
    # Authenticate with Portainer
    TOKEN=$(get_auth_token)
    
    # Read docker-compose.yml
    log_info "Reading docker-compose.yml..."
    COMPOSE_CONTENT=$(cat "$COMPOSE_FILE" | jq -Rs .)
    
    # Build environment JSON
    ENV_JSON=$(build_env_json)
    
    # Get existing stack ID
    STACK_ID=$(get_stack_id "$TOKEN" "$STACK_NAME")
    
    # Execute action
    case "$ACTION" in
        deploy)
            if [ -z "$STACK_ID" ]; then
                create_stack "$TOKEN" "$COMPOSE_CONTENT" "$ENV_JSON"
                STACK_ID=$(get_stack_id "$TOKEN" "$STACK_NAME")
                verify_deployment "$TOKEN" "$STACK_ID"
            else
                log_error "Stack $STACK_NAME already exists (ID: $STACK_ID)"
                log_info "Use 'update' action to update existing stack"
                exit 1
            fi
            ;;
        update)
            if [ -z "$STACK_ID" ]; then
                log_error "Stack $STACK_NAME not found"
                log_info "Use 'deploy' action to create new stack"
                exit 1
            else
                update_stack "$TOKEN" "$STACK_ID" "$COMPOSE_CONTENT" "$ENV_JSON"
                verify_deployment "$TOKEN" "$STACK_ID"
            fi
            ;;
        destroy)
            if [ -z "$STACK_ID" ]; then
                log_error "Stack $STACK_NAME not found"
                exit 1
            else
                delete_stack "$TOKEN" "$STACK_ID"
            fi
            ;;
    esac
    
    log "═══════════════════════════════════════════════════════════════════════════════"
    log_success "Deployment completed successfully!"
    log "═══════════════════════════════════════════════════════════════════════════════"
}

# Run main function
main "$@"
