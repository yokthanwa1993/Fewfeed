#!/bin/bash

# =================================================================
# Facebook Post Publishing Script (v15 - No Message Field)
# =================================================================
# This script is designed to be called by the server and does not
# include the 'message' field in the payload.
# =================================================================

# --- ⚙️ Configuration ---
# IMPORTANT: The ACCESS_TOKEN and COOKIE are temporary. If this script fails,
# you will need to capture a new curl command and update these values.

# Use environment variables from server.js if available, otherwise use default values
ACCESS_TOKEN="${ACCESS_TOKEN:-EAAE0ZAUxkwC0BPFoWjMx1zhteOZAtnPuwJjkZCjieZA8PUNHNZAstqecTKKk1YsNYREx0fVD88H4HiJDjTp4J9Ck6iA6PCZAnb71Ku2Qc43274WHkQ2Qlny39fHl2GTsH0VvYdRGa7xuzanRjaTKIzphjsPmVSzjf6aXNEKD8SNWucNb8iNnEcUZCR45USx2qZAhBZAfZBl3otFbVu2pYHlyvU6ZARS}"
ACCESS_TOKEN2="${ACCESS_TOKEN2:-EAAChZCKmUTDcBPPXbtYYXGtY0ZBh8khmzbZCAEVOqRZCQZAdQgYFNJOaMqt0NLpm1myrxytZChZBSrPBeHrpbJhD8oSMUzwDb5ZB7NJ2X3R3tLZAI0jOwZBlFYU8b8U7cttG6oyWS5cZBlvGN8XChQcgnZBZAqhXhbFvZAgvTedPRrZARfinO2Ic2s9TL2tZABG2tPlNUxPxEhvkcLTx5ZCjILogIiPMQZBIUZD}"
COOKIE_DATA="${COOKIE_DATA:-dbln=%7B%22100056864839947%22%3A%22fQL0ngDj%22%7D; datr=FY5vaJkvRxhuJNlz9lRPAsOW; sb=FY5vaD1eu37Fg5HEh6yKmyQV; wd=2560x1210; locale=th_TH; c_user=100056864839947; xs=15%3APWCSP7Z44IGmvg%3A2%3A1752141442%3A-1%3A-1; fr=06GRkBXJsb8iRi1ye.AWe86VQQFfT_m4RO_Helcqvd-gsXl4OIqZby3wTRnoOA2BgfxcM.Bob44V..AAA.0.0.Bob5MS.AWfB267gsIDD_HBckJjKDHSNPdk;}"
AD_ACCOUNT_ID="${AD_ACCOUNT_ID:-act_1148837732288721}"
PAGE_ID="${PAGE_ID:-146000051932080}"
# Use uploaded image URL if available, otherwise use default URL
if [ -n "$IMAGE_URL" ]; then
    PICTURE_URL="$IMAGE_URL"
    echo "  Using uploaded image: $IMAGE_URL"
else
    PICTURE_URL="${PICTURE_URL:-https://scontent.fbkk13-2.fna.fbcdn.net/v/t39.30808-6/517347108_790897370768177_859489475930650811_n.jpg?stp=dst-jpg_s1080x2048_tt6&_nc_cat=1&ccb=1-7&_nc_sid=127cfc&_nc_ohc=I00_X5sTz8gQ7kNvwFBbn7R&_nc_oc=Admu7-SNTdN7HSnbY_4wn8covYDf8zAh4-wEXv1MMAz6oFb0Pp3BVam5SiVxgJVq2-o&_nc_zt=23&_nc_ht=scontent.fbkk13-2.fna&_nc_gid=r0jyoT9q5BQpVXfWTEZqTQ&oh=00_AfQGZS4jP5CF1tt-QTFnX2BIqPldSin08ovRjML3XWDqAg&oe=687CF94F}"
    echo "  Using default image URL"
fi
CAPTION="${CAPTION:-LAZADA.CO.TH}"
DESCRIPTION="${DESCRIPTION:-กดเพื่อดูเพิ่มเติม}"
LINK_URL="${LINK_URL:-https://s.lazada.co.th/s.yQ0ji?cc}"
LINK_NAME="${LINK_NAME:-พิกัด : เสื้อยืดแขนสั้นผู้หญิงสีขาว}"

# --- Step 1: Create the Ad Creative ---
echo " STEP 1: Creating Ad Creative..."
JSON_PAYLOAD=$(jq -n \
  --arg picture "$PICTURE_URL" \
  --arg description "$DESCRIPTION" \
  --arg link "$LINK_URL" \
  --arg name "$LINK_NAME" \
  --arg caption "$CAPTION" \
  --arg page_id "$PAGE_ID" \
  '{object_story_spec: {link_data: {picture: $picture, description: $description, link: $link, name: $name, multi_share_optimized: true, multi_share_end_card: false, caption: $caption, call_to_action: {type: "LEARN_MORE"}}, page_id: $page_id}}')

CREATE_URL="https://graph.facebook.com/v21.0/${AD_ACCOUNT_ID}/adcreatives?access_token=${ACCESS_TOKEN}&fields=effective_object_story_id"
CREATE_RESPONSE=$(curl -s -X POST "$CREATE_URL" \
  -H "cookie: $COOKIE_DATA" \
  -H 'content-type: application/json' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' \
  --data-raw "$JSON_PAYLOAD")

CREATIVE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

if [ -z "$CREATIVE_ID" ] || [ "$CREATIVE_ID" == "null" ]; then
  echo "  ERROR: Failed to create Ad Creative. The script will stop. Response was:"
  echo "  $CREATE_RESPONSE"
  exit 1
fi
echo "  SUCCESS: Creative created with ID: $CREATIVE_ID"
echo ""

# --- Step 2: Initial GET to trigger processing ---
echo " STEP 2: Triggering post processing..."
curl -s -G "https://graph.facebook.com/v21.0/${CREATIVE_ID}" \
  -H "Cookie: $COOKIE_DATA" \
  --data-urlencode "access_token=$ACCESS_TOKEN" \
  --data-urlencode "fields=effective_object_story_id" > /dev/null # We don't need the output of this one

echo "  Trigger sent. Now polling for final ID..."
echo ""

# --- Step 3: Fetch the Page Access Token ---
echo " STEP 3: Fetching Page Access Token for Page ID ${PAGE_ID}..."
PAGE_TOKEN_RESPONSE=$(curl -s -G "https://graph.facebook.com/v21.0/${PAGE_ID}" \
  -H "Cookie: $COOKIE_DATA" \
  --data-urlencode "access_token=$ACCESS_TOKEN" \
  --data-urlencode "fields=access_token")

PAGE_ACCESS_TOKEN=$(echo "$PAGE_TOKEN_RESPONSE" | jq -r '.access_token')

if [ -z "$PAGE_ACCESS_TOKEN" ] || [ "$PAGE_ACCESS_TOKEN" == "null" ]; then
    echo "  ERROR: Failed to fetch Page Access Token. Response was:"
    echo "  $PAGE_TOKEN_RESPONSE"
    exit 1
fi
echo "  SUCCESS: Got Page Access Token."
echo ""


# --- Step 4: Poll for the effective_object_story_id ---
echo " STEP 4: Waiting for Facebook to generate the final Post ID..."
MAX_ATTEMPTS=10
ATTEMPT=0
EFFECTIVE_ID=""
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    POLL_RESPONSE=$(curl -s -G "https://graph.facebook.com/v21.0/${CREATIVE_ID}" \
      -H "Cookie: $COOKIE_DATA" \
      --data-urlencode "access_token=$ACCESS_TOKEN" \
      --data-urlencode "fields=effective_object_story_id")
    
    EFFECTIVE_ID=$(echo "$POLL_RESPONSE" | jq -r '.effective_object_story_id')

    if [ -n "$EFFECTIVE_ID" ] && [ "$EFFECTIVE_ID" != "null" ]; then
        echo "  SUCCESS: Got final Post ID: $EFFECTIVE_ID"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS: Post ID not ready yet, waiting 3 seconds..."
    sleep 3
done

if [ -z "$EFFECTIVE_ID" ] || [ "$EFFECTIVE_ID" == "null" ]; then
  echo "  ERROR: Could not retrieve final Post ID after $MAX_ATTEMPTS attempts. Last response:"
  echo "  $POLL_RESPONSE"
  exit 1
fi
echo ""

# --- Step 5: Publish the Post ---
echo " STEP 5: Publishing the post..."
PUBLISH_URL="https://graph.facebook.com/v21.0/${EFFECTIVE_ID}"
# IMPORTANT: Use ACCESS_TOKEN2 for the final publish command
PUBLISH_RESPONSE=$(curl -s -X POST "${PUBLISH_URL}?access_token=${ACCESS_TOKEN2}" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE_DATA" \
  --data-raw '{"is_published":true}')

PUBLISH_SUCCESS=$(echo "$PUBLISH_RESPONSE" | jq -r '.success')
if [ "$PUBLISH_SUCCESS" == "true" ]; then
    echo "  SUCCESS: Post has been published successfully!"
    echo "  View post at: https://www.facebook.com/$EFFECTIVE_ID"
else
    echo "  ERROR: Failed to publish the post. Response was:"
    echo "  $PUBLISH_RESPONSE"
    exit 1
fi
echo ""
echo "✅ All steps completed." 