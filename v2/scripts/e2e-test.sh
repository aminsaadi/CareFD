#!/bin/bash
# CareFD v2 – Full E2E Test Script
# Run from v2/ directory with PostgreSQL available
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
BASE="http://localhost:3000"

pass() { ((PASS++)); echo -e "  ${GREEN}✅ $1${NC}"; }
fail() { ((FAIL++)); echo -e "  ${RED}❌ $1${NC}"; }
test_status() {
  local desc="$1" url="$2" method="${3:-GET}" body="$4" auth="$5" expect="${6:-200}"
  local args=(-s -o /tmp/carefd-resp.json -w "%{http_code}" -X "$method")
  [ -n "$body" ] && args+=(-H "Content-Type: application/json" -d "$body")
  [ -n "$auth" ] && args+=(-H "Authorization: Bearer $auth")
  local status=$(curl "${args[@]}" "$url")
  if [ "$status" = "$expect" ]; then pass "$desc (HTTP $status)"; else fail "$desc (expected $expect, got $status)"; cat /tmp/carefd-resp.json 2>/dev/null | head -3; fi
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  CareFD v2 – Full E2E Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"

# ==================== SETUP ====================
echo -e "\n${YELLOW}[SETUP] Checking prerequisites...${NC}"

# Check PostgreSQL
if pg_isready -q 2>/dev/null; then
  pass "PostgreSQL is running"
else
  fail "PostgreSQL not running"
  echo "Start with: pg_ctlcluster 16 main start"
  exit 1
fi

# Check if tables exist
TABLE_COUNT=$(PGPASSWORD=carefd123 psql -h localhost -U carefd -d carefd -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>/dev/null | tr -d ' ')
if [ "$TABLE_COUNT" -gt 30 ] 2>/dev/null; then
  pass "Database has $TABLE_COUNT tables"
else
  echo "  Running prisma db push..."
  npx prisma db push --skip-generate 2>/dev/null
  pass "Database schema created"
fi

# Start dev server if not running
if curl -s -o /dev/null "$BASE/api/settings/public" 2>/dev/null; then
  pass "Dev server already running"
else
  echo "  Starting dev server..."
  SECRET_KEY=test-e2e-secret npm run dev &>/tmp/carefd-e2e.log &
  DEV_PID=$!
  for i in $(seq 1 20); do
    if curl -s -o /dev/null "$BASE/api/settings/public" 2>/dev/null; then break; fi
    sleep 1
  done
  if curl -s -o /dev/null "$BASE/api/settings/public" 2>/dev/null; then
    pass "Dev server started (PID $DEV_PID)"
  else
    fail "Dev server failed to start"
    cat /tmp/carefd-e2e.log | tail -20
    exit 1
  fi
fi

# ==================== AUTH ====================
echo -e "\n${YELLOW}[AUTH] Testing authentication...${NC}"

# Clean up test users
PGPASSWORD=carefd123 psql -h localhost -U carefd -d carefd -c "DELETE FROM users WHERE email IN ('e2e-patient@test.com','e2e-provider@test.com','e2e-admin@test.com');" 2>/dev/null

# Register patient
RESP=$(curl -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" \
  -d '{"email":"e2e-patient@test.com","password":"Test1234","name":"E2E Patient"}')
PATIENT_TOKEN=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -n "$PATIENT_TOKEN" ] && [ "$PATIENT_TOKEN" != "" ]; then
  pass "Register patient"
else
  fail "Register patient"; echo "  $RESP"
fi

# Register provider
RESP=$(curl -s -X POST "$BASE/api/auth/register" -H "Content-Type: application/json" \
  -d '{"email":"e2e-provider@test.com","password":"Test1234","name":"E2E Provider","role":"provider"}')
PROVIDER_TOKEN=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
if [ -n "$PROVIDER_TOKEN" ]; then pass "Register provider"; else fail "Register provider"; fi

# Login
test_status "Login patient" "$BASE/api/auth/login" POST '{"email":"e2e-patient@test.com","password":"Test1234"}'

# Login wrong password
test_status "Reject wrong password" "$BASE/api/auth/login" POST '{"email":"e2e-patient@test.com","password":"wrong"}' "" "401"

# Get me
test_status "Get current user" "$BASE/api/auth/me" GET "" "$PATIENT_TOKEN"

# Duplicate registration
test_status "Block duplicate email" "$BASE/api/auth/register" POST '{"email":"e2e-patient@test.com","password":"Test1234","name":"Dup"}' "" "409"

# Password validation
test_status "Reject weak password" "$BASE/api/auth/register" POST '{"email":"weak@test.com","password":"123","name":"Weak"}' "" "400"

# ==================== PROVIDER ====================
echo -e "\n${YELLOW}[PROVIDER] Testing provider flows...${NC}"

# Create provider profile
RESP=$(curl -s -X POST "$BASE/api/providers" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{"provider_type":"individual","business_name":"E2E Clinic","description":"Test provider","location":{"city":"תל אביב","address":"רחוב הרצל 1","latitude":32.0853,"longitude":34.7818}}')
PROVIDER_ID=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('provider_id',''))" 2>/dev/null)
if [ -n "$PROVIDER_ID" ]; then pass "Create provider profile"; else fail "Create provider profile"; echo "  $RESP"; fi

# Verify provider in DB
PGPASSWORD=carefd123 psql -h localhost -U carefd -d carefd -c "UPDATE providers SET is_verified=true, verification_status='verified' WHERE id='$PROVIDER_ID';" 2>/dev/null
pass "Verify provider (DB)"

# Get provider
test_status "Get provider by ID" "$BASE/api/providers/$PROVIDER_ID"

# Search providers (should find verified one)
RESP=$(curl -s "$BASE/api/providers")
TOTAL=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null)
if [ "$TOTAL" -gt 0 ] 2>/dev/null; then pass "Search providers (found $TOTAL)"; else fail "Search providers (total=$TOTAL)"; fi

# Search by city
test_status "Search by city" "$BASE/api/providers?city=%D7%AA%D7%9C%20%D7%90%D7%91%D7%99%D7%91"

# Update provider
test_status "Update provider" "$BASE/api/providers/$PROVIDER_ID" PUT '{"phone":"050-1234567","languages":["hebrew","english"]}' "$PROVIDER_TOKEN"

# Get me (provider)
test_status "Get my provider profile" "$BASE/api/providers/me" GET "" "$PROVIDER_TOKEN"

# ==================== SERVICES ====================
echo -e "\n${YELLOW}[SERVICES] Testing services...${NC}"

# Create service
RESP=$(curl -s -X POST "$BASE/api/services" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{"name":"E2E Service","description":"Test service","price":250,"service_category":"visit","delivery_types":["home"],"duration_minutes":60}')
SERVICE_ID=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('service_id',''))" 2>/dev/null)
if [ -n "$SERVICE_ID" ]; then pass "Create service"; else fail "Create service"; echo "  $RESP"; fi

# Get service
test_status "Get service by ID" "$BASE/api/services/$SERVICE_ID"

# Search services
test_status "Search services" "$BASE/api/services"

# My services
test_status "Get my services" "$BASE/api/services/my" GET "" "$PROVIDER_TOKEN"

# ==================== BOOKINGS ====================
echo -e "\n${YELLOW}[BOOKINGS] Testing booking flow...${NC}"

# Create booking
RESP=$(curl -s -X POST "$BASE/api/bookings" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -d "{\"service_id\":\"$SERVICE_ID\",\"booking_date\":\"2026-05-01\",\"booking_time\":\"10:00\",\"client_name\":\"E2E Client\",\"client_phone\":\"050-9999999\"}")
BOOKING_ID=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('booking_id',''))" 2>/dev/null)
BOOKING_PRICE=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('final_price',0))" 2>/dev/null)
if [ -n "$BOOKING_ID" ]; then pass "Create booking (₪$BOOKING_PRICE)"; else fail "Create booking"; echo "  $RESP"; fi

# Confirm (provider)
test_status "Provider confirms booking" "$BASE/api/bookings/$BOOKING_ID/status" PUT '{"action":"confirm"}' "$PROVIDER_TOKEN"

# Provider complete
test_status "Provider marks complete" "$BASE/api/bookings/$BOOKING_ID/status" PUT '{"action":"provider_complete"}' "$PROVIDER_TOKEN"

# Client confirm
test_status "Client confirms completion" "$BASE/api/bookings/$BOOKING_ID/status" PUT '{"action":"client_confirm"}' "$PATIENT_TOKEN"

# My bookings
test_status "Get my bookings" "$BASE/api/bookings/my" GET "" "$PATIENT_TOKEN"

# Provider bookings
test_status "Get provider bookings" "$BASE/api/bookings/provider" GET "" "$PROVIDER_TOKEN"

# ==================== REQUESTS & OFFERS ====================
echo -e "\n${YELLOW}[REQUESTS] Testing request/offer flow...${NC}"

# Create request
RESP=$(curl -s -X POST "$BASE/api/requests" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -d '{"title":"E2E Request","description":"Need nursing at home","professions":["prof_nursing"],"budget":300,"urgency":"medium"}')
REQUEST_ID=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('request_id',''))" 2>/dev/null)
if [ -n "$REQUEST_ID" ]; then pass "Create request"; else fail "Create request"; echo "  $RESP"; fi

# Create offer
RESP=$(curl -s -X POST "$BASE/api/offers" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "{\"request_id\":\"$REQUEST_ID\",\"price\":280,\"pricing_type\":\"per_visit\",\"message\":\"Happy to help!\"}")
OFFER_ID=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('offer_id',''))" 2>/dev/null)
if [ -n "$OFFER_ID" ]; then pass "Create offer"; else fail "Create offer"; echo "  $RESP"; fi

# Accept offer (creates chat room)
test_status "Accept offer" "$BASE/api/offers/$OFFER_ID" POST '{"action":"accept"}' "$PATIENT_TOKEN"

# Get request detail
test_status "Get request detail" "$BASE/api/requests/$REQUEST_ID"

# My requests
test_status "Get my requests" "$BASE/api/requests/my" GET "" "$PATIENT_TOKEN"

# My offers
test_status "Get my offers" "$BASE/api/offers/my" GET "" "$PROVIDER_TOKEN"

# ==================== CHAT ====================
echo -e "\n${YELLOW}[CHAT] Testing chat system...${NC}"

# Get chat rooms (should have one from offer acceptance)
RESP=$(curl -s "$BASE/api/chat/rooms" -H "Authorization: Bearer $PATIENT_TOKEN")
ROOM_ID=$(echo $RESP | python3 -c "import sys,json; rooms=json.load(sys.stdin).get('rooms',[]); print(rooms[0]['room_id'] if rooms else '')" 2>/dev/null)
if [ -n "$ROOM_ID" ]; then pass "Chat room exists from offer"; else fail "Chat room from offer"; fi

# Send message
test_status "Send chat message" "$BASE/api/chat/messages" POST "{\"room_id\":\"$ROOM_ID\",\"content\":\"Hello from E2E test\"}" "$PATIENT_TOKEN" "201"

# Get messages
test_status "Get chat messages" "$BASE/api/chat/messages/$ROOM_ID" GET "" "$PATIENT_TOKEN"

# Archive room
test_status "Archive chat room" "$BASE/api/chat/rooms/$ROOM_ID" PUT '{"action":"archive"}' "$PATIENT_TOKEN"

# ==================== NOTIFICATIONS ====================
echo -e "\n${YELLOW}[NOTIFICATIONS] Testing notifications...${NC}"

test_status "Get notifications" "$BASE/api/notifications" GET "" "$PROVIDER_TOKEN"

# Check unread count
RESP=$(curl -s "$BASE/api/notifications" -H "Authorization: Bearer $PROVIDER_TOKEN")
UNREAD=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin).get('unread_count',0))" 2>/dev/null)
if [ "$UNREAD" -gt 0 ] 2>/dev/null; then pass "Has unread notifications ($UNREAD)"; else fail "Unread count ($UNREAD)"; fi

# Mark all read
test_status "Mark all read" "$BASE/api/notifications" PUT "" "$PROVIDER_TOKEN"

# ==================== REVIEWS ====================
echo -e "\n${YELLOW}[REVIEWS] Testing reviews...${NC}"

test_status "Create review" "$BASE/api/reviews" POST "{\"provider_id\":\"$PROVIDER_ID\",\"booking_id\":\"$BOOKING_ID\",\"rating\":4.5,\"comment\":\"Great E2E service!\"}" "$PATIENT_TOKEN" "201"

test_status "Get provider reviews" "$BASE/api/reviews?provider_id=$PROVIDER_ID"

test_status "Get my reviews" "$BASE/api/reviews/my" GET "" "$PATIENT_TOKEN"

# ==================== FAVORITES ====================
echo -e "\n${YELLOW}[FAVORITES] Testing favorites...${NC}"

test_status "Add favorite" "$BASE/api/favorites/$PROVIDER_ID" POST "" "$PATIENT_TOKEN"
test_status "Check favorite" "$BASE/api/favorites/$PROVIDER_ID" GET "" "$PATIENT_TOKEN"
test_status "Get favorites list" "$BASE/api/favorites" GET "" "$PATIENT_TOKEN"
test_status "Remove favorite" "$BASE/api/favorites/$PROVIDER_ID" DELETE "" "$PATIENT_TOKEN"

# ==================== PROFESSIONS & DATA ====================
echo -e "\n${YELLOW}[DATA] Testing data endpoints...${NC}"

RESP=$(curl -s "$BASE/api/professions")
PROF_COUNT=$(echo $RESP | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('professions',[])))" 2>/dev/null)
if [ "$PROF_COUNT" -gt 5 ] 2>/dev/null; then pass "Professions loaded ($PROF_COUNT)"; else fail "Professions ($PROF_COUNT)"; fi

test_status "Localities" "$BASE/api/localities"
test_status "Regions" "$BASE/api/regions"
test_status "Filter options" "$BASE/api/providers/filters/options"
test_status "Subscription plans" "$BASE/api/subscription-plans"
test_status "Public settings" "$BASE/api/settings/public"

# ==================== OTHER APIs ====================
echo -e "\n${YELLOW}[OTHER] Testing remaining endpoints...${NC}"

test_status "Contact form" "$BASE/api/contact" POST '{"name":"E2E","email":"e2e@test.com","message":"Testing"}' "" "201"

test_status "Team list" "$BASE/api/team" GET "" "$PROVIDER_TOKEN"
test_status "Add team member" "$BASE/api/team" POST '{"name":"Nurse Sarah","role":"nurse"}' "$PROVIDER_TOKEN" "201"

test_status "Clinics list" "$BASE/api/clinics" GET "" "$PROVIDER_TOKEN"
test_status "Add clinic" "$BASE/api/clinics" POST '{"name":"E2E Clinic Branch","city":"Haifa"}' "$PROVIDER_TOKEN" "201"

test_status "Verification status" "$BASE/api/verification" GET "" "$PATIENT_TOKEN"

test_status "Logout" "$BASE/api/auth/logout" POST "" "$PATIENT_TOKEN"

# ==================== FRONTEND PAGES ====================
echo -e "\n${YELLOW}[FRONTEND] Testing page accessibility...${NC}"

for page in "" "login" "register" "reset-password" "providers" "services" "about" "contact" "terms" "privacy" "dashboard" "bookings" "notifications"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$page")
  if [ "$STATUS" = "200" ]; then pass "GET /$page"; else fail "GET /$page ($STATUS)"; fi
done

# ==================== SECURITY ====================
echo -e "\n${YELLOW}[SECURITY] Testing security controls...${NC}"

# Unauthorized access
test_status "Block unauthorized /me" "$BASE/api/auth/me" GET "" "" "401"
test_status "Block unauthorized bookings" "$BASE/api/bookings/my" GET "" "" "401"

# CORS headers
CORS=$(curl -sI "$BASE/api/providers" | grep -i "x-frame-options" | tr -d '\r')
if echo "$CORS" | grep -qi "DENY"; then pass "X-Frame-Options: DENY"; else fail "X-Frame-Options missing"; fi

NOSNIFF=$(curl -sI "$BASE/api/providers" | grep -i "x-content-type" | tr -d '\r')
if echo "$NOSNIFF" | grep -qi "nosniff"; then pass "X-Content-Type-Options: nosniff"; else fail "nosniff missing"; fi

# ==================== RESULTS ====================
echo -e "\n${YELLOW}========================================${NC}"
TOTAL=$((PASS + FAIL))
echo -e "  Total:  $TOTAL tests"
echo -e "  ${GREEN}Passed: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}Failed: $FAIL${NC}"
else
  echo -e "  ${GREEN}Failed: 0${NC}"
fi
echo -e "${YELLOW}========================================${NC}"

if [ $FAIL -eq 0 ]; then
  echo -e "\n${GREEN}🎉 ALL TESTS PASSED!${NC}"
else
  echo -e "\n${RED}⚠ $FAIL tests failed${NC}"
fi

exit $FAIL
