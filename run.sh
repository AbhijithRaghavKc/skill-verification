#!/bin/bash

# ─── SkillChain — Run Everything ─────────────────────────────────────────
# This script sets up and runs the entire platform:
#   1. Installs Node.js dependencies
#   2. Creates Python venv + installs evaluation deps
#   3. Runs ML matching evaluation (graphs + metrics)
#   4. Runs AI assessment evaluation (graphs + metrics)
#   5. Sets up .env + pushes database schema
#   6. Seeds skills into the database
#   7. Starts the Next.js dev server
# ─────────────────────────────────────────────────────────────────────────

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detect python
if command -v python3 &>/dev/null; then
    PY=python3
elif command -v python &>/dev/null; then
    PY=python
else
    echo -e "${RED}ERROR: Python not found. Install Python 3.8+ first.${NC}"
    exit 1
fi

echo -e "${BLUE}Using Python: $($PY --version)${NC}"

# Project root
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SkillChain — Full Setup & Run${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ─── Step 1: Node.js Dependencies ────────────────────────────────────────
echo -e "${YELLOW}[1/7] Installing Node.js dependencies...${NC}"
if [ -d "node_modules" ]; then
    echo "  node_modules exists, skipping npm install."
else
    npm install
fi
echo -e "${GREEN}  ✓ Node.js dependencies ready${NC}"
echo ""

# ─── Step 2: Python Virtual Environment ──────────────────────────────────
echo -e "${YELLOW}[2/7] Setting up Python virtual environment...${NC}"

# Remove broken venv if it exists
if [ -d "venv" ] && ! venv/bin/python --version &>/dev/null 2>&1; then
    echo "  Removing broken venv..."
    rm -rf venv
fi

if [ ! -d "venv" ]; then
    $PY -m venv venv
    echo "  Created venv"
else
    echo "  venv already exists"
fi

# Activate venv
source venv/bin/activate

# Upgrade pip quietly first
pip install --quiet --upgrade pip

# Install Python deps
pip install --quiet -r evaluation/requirements.txt
echo -e "${GREEN}  ✓ Python venv ready ($(python --version))${NC}"
echo ""

# ─── Step 3: ML Matching Evaluation ─────────────────────────────────────
echo -e "${YELLOW}[3/7] Running ML Matching Evaluation...${NC}"
python evaluation/ml_matching_evaluation.py
echo -e "${GREEN}  ✓ ML evaluation complete${NC}"
echo ""

# ─── Step 4: AI Assessment Evaluation ───────────────────────────────────
echo -e "${YELLOW}[4/7] Running AI Assessment Evaluation...${NC}"
python evaluation/assessment_evaluation.py
echo -e "${GREEN}  ✓ Assessment evaluation complete${NC}"
echo ""

# Deactivate venv (Node doesn't need it)
deactivate

# ─── Step 5: Environment + Database Schema ──────────────────────────────
echo -e "${YELLOW}[5/7] Checking database...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}  No .env file found — creating from template${NC}"
    cp .env.example .env
    echo "  Created .env"
fi

if grep -q "your-secret-key-here" .env 2>/dev/null; then
    # Auto-generate NEXTAUTH_SECRET if still placeholder
    SECRET=$(openssl rand -base64 32 2>/dev/null || echo "auto-generated-secret-$(date +%s)")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|your-secret-key-here|${SECRET}|g" .env
    else
        sed -i "s|your-secret-key-here|${SECRET}|g" .env
    fi
    echo "  Auto-generated NEXTAUTH_SECRET"
fi

if grep -q "DATABASE_URL=postgresql" .env 2>/dev/null; then
    echo "  DATABASE_URL found. Pushing schema..."
    npx drizzle-kit push 2>/dev/null && echo -e "${GREEN}  ✓ Database schema pushed${NC}" || echo -e "${YELLOW}  ⚠ DB push failed (check DATABASE_URL in .env)${NC}"
else
    echo -e "${YELLOW}  ⚠ No valid DATABASE_URL in .env${NC}"
    echo "  Edit .env and add your Neon PostgreSQL connection string"
    echo "  Then run: npx drizzle-kit push"
fi
echo ""

# ─── Step 6: Seed Skills ────────────────────────────────────────────────
echo -e "${YELLOW}[6/7] Seeding skills...${NC}"
echo "  Skills will be auto-seeded when the server starts."
echo "  After the server is running, visit:"
echo -e "  ${BLUE}http://localhost:3000/api/skills/seed${NC}"
echo -e "${GREEN}  ✓ Seed endpoint ready${NC}"
echo ""

# ─── Step 7: Start Dev Server ────────────────────────────────────────────
echo -e "${YELLOW}[7/7] Starting Next.js dev server...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✓ Everything is ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}Web App:${NC}       http://localhost:3000"
echo -e "  ${BLUE}Seed Skills:${NC}   http://localhost:3000/api/skills/seed"
echo -e "  ${BLUE}Graphs:${NC}        evaluation/graphs/*.png"
echo -e "  ${BLUE}ML Results:${NC}    evaluation/graphs/ml_matching_results.json"
echo -e "  ${BLUE}AI Results:${NC}    evaluation/graphs/assessment_results.json"
echo ""
echo -e "  ${YELLOW}FIRST TIME? After server starts:${NC}"
echo -e "  1. Open ${BLUE}http://localhost:3000/api/skills/seed${NC} to create skills"
echo -e "  2. Sign up as 'institution' to create assessments"
echo -e "  3. Sign up as 'candidate' to take assessments"
echo -e "  4. Sign up as 'employer' to post jobs"
echo ""
echo -e "  Press ${RED}Ctrl+C${NC} to stop the server."
echo ""

npm run dev
