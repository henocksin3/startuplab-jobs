# Competitor Price Monitoring System - Design Specification

**Date:** 2026-03-18
**Project:** Startuplab Competitor Price Monitoring
**Status:** Approved

## 1. Overview

### 1.1 Purpose
Build an automated system to monitor and track pricing changes for 6 coworking space competitors in Oslo, with historical tracking, change detection, and automated notifications.

### 1.2 Business Context
Startuplab needs to continuously monitor competitor pricing to:
- Stay competitive in the Oslo coworking market
- Track pricing trends and market movements
- Detect when competitors close, pivot, or change offerings
- Maintain historical pricing data for strategic analysis

### 1.3 Competitors Being Monitored
1. **Epicenter** - https://weareepicenter.com/oslo/
2. **Mesh** - https://meshcommunity.com/
3. **657** - https://657.no/ (potentially closed)
4. **SoCentral** - https://www.socentral.no/english (potentially closed)
5. **Spaces** - https://www.spacesworks.com/nb/oslo-nb/kvadraturen/
6. **RunwayFBU** - https://runwayfbu.com/tech-hub

### 1.4 Product Offerings Tracked
- Digitalt (Digital membership)
- Drop-in
- Lounge
- Lean/Mini
- Flex
- Fixed
- Office

## 2. System Architecture

### 2.1 High-Level Architecture

```
GitHub Actions (Scheduler)
    ↓
Scraper Orchestrator (Python)
    ↓
├─→ Competitor Scrapers (Playwright/BeautifulSoup)
│   ├─→ Epicenter scraper
│   ├─→ Mesh scraper
│   ├─→ Spaces scraper
│   ├─→ RunwayFBU scraper
│   ├─→ 657 scraper
│   └─→ SoCentral scraper
│
├─→ Change Detector
│   ├─→ Price changes
│   ├─→ New/discontinued offerings
│   └─→ Business status changes
│
├─→ Data Store (JSON files in repo)
│   ├─→ current_prices.json
│   ├─→ previous_month_snapshot.json
│   └─→ scrape_failures.json
│
├─→ Google Sheets Writer (gspread)
│   ├─→ "Current Prices" sheet
│   ├─→ "Monthly Changes" sheet
│   ├─→ "Price Change Log" sheet
│   └─→ Pivot view sheets (per offering type)
│
└─→ Slack Notifier
    ├─→ Success summaries
    ├─→ Failure alerts
    └─→ Change highlights
```

### 2.2 Technology Stack
- **Language:** Python 3.11+
- **Web Scraping:** Playwright (JavaScript-rendered pages), BeautifulSoup (static pages)
- **Scheduling:** GitHub Actions (private repository)
- **Data Storage:** Google Sheets API via gspread library
- **Notifications:** Slack Webhooks
- **State Management:** JSON files in Git repository

### 2.3 Deployment Environment
- **Platform:** GitHub Actions (free tier, runs in cloud)
- **Repository:** Private GitHub repo (access controlled)
- **Secrets Management:** GitHub Secrets for credentials
- **Manual Trigger:** Available via GitHub Actions UI

## 3. Core Components

### 3.1 Scraper Module

**Location:** `scrapers/`

**Structure:**
```python
scrapers/
├── base_scraper.py       # Abstract base class
├── epicenter_scraper.py
├── mesh_scraper.py
├── spaces_scraper.py
├── runwayfbu_scraper.py
├── scraper_657.py
└── socentral_scraper.py
```

**Interface:**
```python
class BaseScraper:
    def scrape(self) -> dict:
        """
        Returns:
        {
            'competitor_name': str,
            'offerings': [
                {'name': str, 'price': float|None, 'currency': str}
            ],
            'timestamp': str (ISO 8601),
            'status': str ('active'|'closed'|'error'),
            'raw_html_snapshot': str
        }
        """
```

**Scraper Types:**
- **Playwright:** For JavaScript-rendered pages (Epicenter, Mesh, Spaces)
- **BeautifulSoup:** For static HTML pages (fallback)
- **Hybrid:** Try BeautifulSoup first, fall back to Playwright if needed

**Error Handling:**
- Network timeouts: 3 retries with exponential backoff
- Page structure changes: Store raw HTML snapshot for debugging
- Authentication walls: Log error, mark as "requires manual check"
- Rate limiting: Respect robots.txt, add 2-second delays between requests

### 3.2 Change Detector

**Location:** `change_detector.py`

**Functionality:**
- Compares current scrape results with previous month's snapshot
- Detects:
  - Price increases/decreases
  - New offerings introduced
  - Discontinued offerings
  - Business status changes (active → closed)
  - Major page content changes

**Output:**
```python
{
    'price_changes': [
        {
            'competitor': 'Mesh',
            'offering': 'Lounge',
            'old_price': 1190,
            'new_price': 1790,
            'change': 600,
            'percent_change': 50.4
        }
    ],
    'new_offerings': [...],
    'discontinued_offerings': [...],
    'status_changes': [...],
    'anomalies': [...]  # Changes >50%
}
```

### 3.3 Google Sheets Integration

**Location:** `sheets_writer.py`

**Authentication:**
- Service account with Google Sheets API access
- Credentials stored in GitHub Secrets
- Read-only access to existing "priser" and "tilbud" sheets
- Write access to new sheets only

**Sheets Structure:**

#### Sheet 1: "Current Prices"
```
| Competitor | Digitalt | Drop-in | Lounge | Lean/Mini | Flex | Fixed | Office | Last Updated | Status |
```
- Overwritten each month with latest data
- Quick glance view of current market
- Status column: Active, Closed, Error, Manual Check Required

#### Sheet 2: "Monthly Changes"
```
=== March 2026 Update (2026-03-18) ===

Price Changes:
- Mesh: Lounge increased from 1190 → 1790 NOK (+50%)

Business Status Changes:
- 657: Status changed from "Active" → "Closed"

New Offerings:
- None detected

Discontinued Offerings:
- 657: All offerings discontinued

Scraping Status:
✅ Epicenter: Success
✅ Mesh: Success
❌ 657: Failed (retry schedule activated)
```
- Appends new section each month
- Human-readable summary
- Acts as monthly briefing document

#### Sheet 3: "Price Change Log"
```
| Date       | Competitor | Offering | Old Price | New Price | Change | Status      |
| 2026-03-18 | Mesh       | Lounge   | 1190      | 1790      | +600   | Active      |
| 2026-03-18 | 657        | All      | Various   | -         | -      | Closed      |
```
- Records ONLY when prices change
- Minimal data, focused on events
- Complete audit trail

#### Sheets 4-10: Pivot Views (Per Offering Type)
**Example: "Flex Prices - Pivot"**
```
| Date       | Epicenter | Mesh | 657  | SoCentral | Spaces | RunwayFBU | Startuplab |
| 2026-03-01 | 3200      | 3490 | -    | 2500      | 3390   | 2700      | 2800       |
| 2026-02-01 | 3200      | 3490 | 3300 | 2500      | 3390   | 2700      | 2800       |
```
- One sheet per offering type (Digitalt, Drop-in, Lounge, Flex, Fixed, Office)
- Rows = months
- Columns = competitors
- Easy to create charts showing trends

### 3.4 Failure Handler

**Location:** `failure_tracker.py`

**Data Structure:**
```json
{
  "failures": {
    "657": {
      "consecutive_failures": 3,
      "first_failure_date": "2026-03-01",
      "last_retry_date": "2026-03-15",
      "retry_count": 2,
      "status": "investigating"
    }
  }
}
```

**Retry Logic:**
- **Trigger:** Scraper fails for a competitor
- **Schedule:** Retry every 3 days for 2 weeks (5 total retries)
- **Success:** Clear from failure tracker, update sheets, send Slack notification
- **Persistent failure:** After 2 weeks, send "needs investigation" alert
- **Manual override:** Can mark as "closed" or "manual entry required"

### 3.5 Slack Notifier

**Location:** `slack_notifier.py`

**Webhook Integration:**
- Webhook URL stored in GitHub Secrets
- Rich message formatting with emojis and sections

**Message Types:**

**1. Monthly Success Summary**
```
✅ Monthly Price Update Complete - March 2026

Scraped: 6/6 competitors
Price changes: 2 detected
New offerings: 0
Status changes: 1 (657 closed)

View details: [Link to Monthly Changes sheet]
```

**2. Failure Alert**
```
⚠️ Scraping Failure Detected

Competitor: 657
Retry attempt: 3/5
Next retry: 2026-03-21
Error: Connection timeout

Action: Monitoring, will alert if persists
```

**3. Investigation Required**
```
🚨 Manual Investigation Required

Competitor: 657
Failure duration: 14 days
Last success: 2026-02-15

Action: Please manually check https://657.no/
```

**4. Change Highlights**
```
📊 Significant Price Changes Detected

Mesh Lounge: 1190 → 1790 NOK (+50%)
⚠️ This is a >50% change - please verify accuracy

View details: [Link to sheet]
```

## 4. Data Flow

### 4.1 Monthly Scheduled Run (1st of each month, 6 AM UTC)

**Workflow:**
1. Load `previous_month_snapshot.json`
2. Execute all competitor scrapers in parallel
3. For each result:
   - If success: Store data, clear failure counter
   - If failure: Increment failure counter, trigger retry schedule
4. Run change detection (current vs previous)
5. Write to Google Sheets:
   - Update "Current Prices"
   - Append to "Monthly Changes"
   - Append changes to "Price Change Log"
   - Update pivot view sheets
6. Save `current_prices.json` as new snapshot
7. Send Slack notification with summary

### 4.2 Failure Retry Run (Every 3 days, 6 AM UTC)

**Workflow:**
1. Load `scrape_failures.json`
2. Filter competitors due for retry
3. Execute scrapers for failed competitors only
4. For each result:
   - If success: Clear from failure tracker, update sheets, notify
   - If still failing: Increment counter
   - If retry_count >= 5: Send "investigation required" alert
5. Update `scrape_failures.json`

### 4.3 Manual Trigger (On-demand)

**Use Cases:**
- Testing after code changes
- Immediate check when user suspects price change
- Recovery after fixing broken scraper

**Workflow:**
- Same as monthly run, but doesn't wait for schedule
- Triggered from GitHub Actions UI

## 5. Configuration

### 5.1 Configuration File

**Location:** `config.yaml`

```yaml
competitors:
  - name: Epicenter
    url: https://weareepicenter.com/oslo/
    scraper_type: playwright
    active: true

  - name: Mesh
    url: https://meshcommunity.com/
    scraper_type: playwright
    active: true

  - name: Spaces
    url: https://www.spacesworks.com/nb/oslo-nb/kvadraturen/
    scraper_type: playwright
    active: true

  - name: RunwayFBU
    url: https://runwayfbu.com/tech-hub
    scraper_type: playwright
    active: true

  - name: 657
    url: https://657.no/
    scraper_type: playwright
    active: true

  - name: SoCentral
    url: https://www.socentral.no/english
    scraper_type: playwright
    active: true

offerings:
  - Digitalt
  - Drop-in
  - Lounge
  - Lean/Mini
  - Flex
  - Fixed
  - Office

retry_settings:
  interval_days: 3
  max_retries: 5
  alert_threshold: 2  # Send alert after N consecutive failures

anomaly_detection:
  price_change_threshold: 50  # Flag changes >50%

google_sheets:
  spreadsheet_id: "1ye1Z6wBwPaJR2h8L2c_Qdx_P1C2g3ebi8hIz0w4qARY"
  read_only_sheets:
    - priser
    - tilbud
  write_sheets:
    - Current Prices
    - Monthly Changes
    - Price Change Log
    - Digitalt Prices - Pivot
    - Drop-in Prices - Pivot
    - Lounge Prices - Pivot
    - Flex Prices - Pivot
    - Fixed Prices - Pivot
    - Office Prices - Pivot

slack:
  notify_on_success: true
  notify_on_failure: true
  notify_on_investigation: true
```

### 5.2 GitHub Secrets

```
GOOGLE_SHEETS_CREDENTIALS  # Service account JSON
SLACK_WEBHOOK_URL          # Webhook for notifications
SPREADSHEET_ID             # Google Sheets ID
```

## 6. GitHub Actions Workflows

### 6.1 Monthly Scrape Workflow

**File:** `.github/workflows/monthly_scrape.yml`

```yaml
name: Monthly Price Monitoring

on:
  schedule:
    - cron: '0 6 1 * *'  # 1st of every month at 6 AM UTC
  workflow_dispatch:      # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          playwright install chromium

      - name: Run scraper orchestrator
        env:
          GOOGLE_SHEETS_CREDENTIALS: ${{ secrets.GOOGLE_SHEETS_CREDENTIALS }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
        run: python src/main.py --mode monthly

      - name: Commit updated snapshots
        run: |
          git config user.name "Price Monitor Bot"
          git config user.email "bot@startuplab.no"
          git add data/*.json logs/*.log
          git commit -m "Monthly price update $(date +'%Y-%m-%d')" || echo "No changes"
          git push
```

### 6.2 Retry Failures Workflow

**File:** `.github/workflows/retry_failures.yml`

```yaml
name: Retry Failed Scrapers

on:
  schedule:
    - cron: '0 6 */3 * *'  # Every 3 days at 6 AM UTC
  workflow_dispatch:

jobs:
  retry:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          playwright install chromium

      - name: Retry failed scrapers
        env:
          GOOGLE_SHEETS_CREDENTIALS: ${{ secrets.GOOGLE_SHEETS_CREDENTIALS }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SPREADSHEET_ID: ${{ secrets.SPREADSHEET_ID }}
        run: python src/main.py --mode retry

      - name: Commit updates
        run: |
          git config user.name "Price Monitor Bot"
          git config user.email "bot@startuplab.no"
          git add data/*.json logs/*.log
          git commit -m "Retry update $(date +'%Y-%m-%d')" || echo "No changes"
          git push
```

## 7. Error Handling & Resilience

### 7.1 Scraping Error Handling

**Network Errors:**
- Timeout: 30 seconds per page
- Retries: 3 attempts with exponential backoff (1s, 2s, 4s)
- User agent rotation to avoid blocking

**Page Structure Changes:**
- Store raw HTML snapshot in `logs/html_snapshots/`
- Include in error report for manual debugging
- Compare with previous successful snapshot

**Data Validation:**
- Price must be numeric or null
- Currency must be NOK
- Flag prices that differ >50% from previous month
- Validate all required fields present

### 7.2 Data Quality Checks

**Pre-write Validation:**
```python
def validate_price_data(data):
    - Check all prices are numeric or None
    - Verify timestamps are valid ISO 8601
    - Ensure competitor names match config
    - Flag anomalies (>50% changes)
    - Detect missing offerings that existed before
```

**Post-write Verification:**
- Read back from Google Sheets
- Verify row counts match expected
- Check formatting preserved

### 7.3 Graceful Degradation

**Partial Failure Handling:**
- If 1-2 competitors fail: Continue with others, log failures
- If 3+ competitors fail: Send alert but still update successful ones
- If all fail: Send critical alert, preserve previous data

**Manual Fallback:**
- README includes instructions for manual price entry
- Template CSV for manual data import
- Script to validate and import manual data

### 7.4 Logging

**Log Files:**
```
logs/
├── scraper_runs/
│   ├── 2026-03-01-monthly.log
│   ├── 2026-03-15-retry.log
├── html_snapshots/
│   ├── epicenter-2026-03-01.html
│   ├── mesh-2026-03-01.html
├── errors/
│   ├── 657-failure-2026-03-01.log
```

**Log Retention:**
- Keep for 6 months
- Automated cleanup in GitHub Actions
- Critical errors archived longer

**Log Format:**
```
2026-03-01 06:05:23 [INFO] Starting monthly scrape
2026-03-01 06:05:30 [SUCCESS] Epicenter: 7 offerings scraped
2026-03-01 06:05:45 [ERROR] 657: Connection timeout after 3 retries
2026-03-01 06:06:00 [WARNING] Mesh Lounge: +50% price change detected
```

## 8. Testing Strategy

### 8.1 Unit Tests

**Coverage:**
- Individual scraper parsing logic
- Change detection algorithms
- Data validation functions
- Slack message formatting

**Mocking:**
- Mock competitor websites with sample HTML
- Mock Google Sheets API responses
- Mock Slack webhook calls

**File:** `tests/test_scrapers.py`
```python
def test_epicenter_scraper_parses_prices():
    html = load_fixture('epicenter_sample.html')
    scraper = EpicenterScraper()
    result = scraper.parse(html)
    assert result['offerings'][0]['name'] == 'Flex'
    assert result['offerings'][0]['price'] == 3200
```

### 8.2 Integration Tests

**Test Flow:**
1. Run scrapers against test fixtures
2. Detect changes (using sample previous data)
3. Write to test Google Sheet (separate from production)
4. Verify sheet contents match expected
5. Check Slack notification sent (webhook to test channel)

**File:** `tests/test_integration.py`

### 8.3 Manual Testing Checklist

**Pre-deployment:**
- [ ] All competitor URLs accessible
- [ ] Google Sheets API credentials valid
- [ ] Slack webhook works
- [ ] Test scrape completes successfully
- [ ] Test sheet populated correctly
- [ ] Failure scenarios work (intentional bad URL)

**Post-deployment:**
- [ ] Monthly workflow runs on schedule
- [ ] Retry workflow triggers correctly
- [ ] Manual trigger works
- [ ] Slack notifications arrive

## 9. Deployment Process

### 9.1 Initial Setup

**Step 1: Create Private GitHub Repository**
```bash
gh repo create startuplab-price-monitoring --private
cd startuplab-price-monitoring
git init
```

**Step 2: Set Up Google Cloud Project**
1. Create new project in Google Cloud Console
2. Enable Google Sheets API
3. Create service account
4. Download service account JSON
5. Share Google Sheet with service account email (viewer for "priser"/"tilbud", editor for new sheets)

**Step 3: Configure Slack Webhook**
1. Create Slack app in workspace
2. Enable Incoming Webhooks
3. Create webhook for target channel
4. Copy webhook URL

**Step 4: Add GitHub Secrets**
```
GOOGLE_SHEETS_CREDENTIALS = <service account JSON>
SLACK_WEBHOOK_URL = <webhook URL>
SPREADSHEET_ID = 1ye1Z6wBwPaJR2h8L2c_Qdx_P1C2g3ebi8hIz0w4qARY
```

**Step 5: Initialize Data Files**
```bash
mkdir -p data logs
echo '{}' > data/current_prices.json
echo '{}' > data/previous_month_snapshot.json
echo '{"failures": {}}' > data/scrape_failures.json
git add data/
git commit -m "Initialize data files"
```

**Step 6: Test Run**
```bash
# Locally first
python src/main.py --mode manual

# Then via GitHub Actions
# Go to Actions tab → Monthly Price Monitoring → Run workflow
```

**Step 7: Enable Schedules**
- Verify workflows enabled in repository settings
- Confirm first scheduled run date

### 9.2 Project Structure

```
startuplab-price-monitoring/
├── .github/
│   └── workflows/
│       ├── monthly_scrape.yml
│       └── retry_failures.yml
├── src/
│   ├── main.py
│   ├── orchestrator.py
│   ├── change_detector.py
│   ├── sheets_writer.py
│   ├── slack_notifier.py
│   ├── failure_tracker.py
│   └── scrapers/
│       ├── base_scraper.py
│       ├── epicenter_scraper.py
│       ├── mesh_scraper.py
│       ├── spaces_scraper.py
│       ├── runwayfbu_scraper.py
│       ├── scraper_657.py
│       └── socentral_scraper.py
├── tests/
│   ├── test_scrapers.py
│   ├── test_integration.py
│   └── fixtures/
│       ├── epicenter_sample.html
│       └── ...
├── data/
│   ├── current_prices.json
│   ├── previous_month_snapshot.json
│   └── scrape_failures.json
├── logs/
│   ├── scraper_runs/
│   ├── html_snapshots/
│   └── errors/
├── config.yaml
├── requirements.txt
├── README.md
├── SETUP.md
└── TROUBLESHOOTING.md
```

## 10. Maintenance & Operations

### 10.1 Monthly Review Process

**On 1st of Month (after automated run):**
1. Check Slack notification
2. Review "Monthly Changes" sheet
3. Verify "Current Prices" accuracy
4. Investigate any anomalies flagged
5. Update manual entries if needed (657, SoCentral)

**Time Required:** 5-10 minutes

### 10.2 When Websites Change

**Symptom:** GitHub Actions fails, Slack alert received

**Resolution Process:**
1. Check error logs in GitHub Actions
2. Review HTML snapshot in `logs/html_snapshots/`
3. Update specific scraper code
4. Run manual test locally
5. Commit fix and trigger manual workflow
6. Verify success

**Time Required:** 15-30 minutes per scraper

### 10.3 Adding New Competitor

**Process:**
1. Add entry to `config.yaml`
2. Create new scraper class (copy template)
3. Write unit test
4. Run manual test
5. Commit and deploy

**Template:** `scrapers/template_scraper.py` provided

### 10.4 Removing Competitor

**Process:**
1. Set `active: false` in `config.yaml`
2. Scraper skips inactive competitors
3. Historical data preserved in sheets
4. Can re-enable by setting `active: true`

### 10.5 Monitoring Indicators

**Dashboard View (Slack + Sheets):**
- ✅ **All Green:** No action needed
- ⚠️ **Partial Failures:** Check retry status, monitor for pattern
- 🚨 **Multiple Failures:** Manual investigation required
- 📊 **Large Changes:** Verify accuracy, may indicate market shift

## 11. Security & Privacy

### 11.1 Access Control
- Private GitHub repository (only authorized users)
- Service account has minimal permissions (read priser/tilbud, write new sheets only)
- Slack webhook URL kept secret
- No credentials in code

### 11.2 Data Privacy
- Only public pricing information scraped
- No personal data collected
- Compliant with robots.txt
- Respectful scraping (delays, user agent)

### 11.3 Rate Limiting
- 2-second delay between competitor scrapes
- Max 1 request per page
- Respects robots.txt directives
- User agent identifies bot: "StartuplabPriceMonitor/1.0"

## 12. Future Enhancements (Out of Scope for V1)

### Potential Additions:
1. **Email Digest:** Weekly summary in addition to Slack
2. **Price Prediction:** ML model to predict future price trends
3. **Competitor Features:** Track non-price features (amenities, perks)
4. **Multi-city:** Expand to other Norwegian cities
5. **API Endpoint:** REST API for programmatic access to data
6. **Dashboard UI:** Web dashboard for visualization
7. **Alert Thresholds:** Custom alerts when competitors undercut Startuplab

## 13. Success Criteria

### System is Successful If:
1. ✅ Runs automatically every month without manual intervention
2. ✅ Captures pricing data for at least 4/6 competitors consistently
3. ✅ Detects and alerts on price changes within 3 days of occurrence
4. ✅ Historical data accurately preserved
5. ✅ Slack notifications received reliably
6. ✅ Requires <15 minutes/month of manual review
7. ✅ Handles competitor closures/pivots gracefully
8. ✅ Zero data loss or corruption

### Metrics to Track:
- Scraping success rate (target: >80%)
- Time to detect price changes (target: <3 days)
- False positive rate for anomalies (target: <5%)
- Manual intervention frequency (target: <1/month)

## 14. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Websites block scraper | High | Medium | Respectful scraping, user agent, delays, fallback to manual |
| Website redesigns break scrapers | Medium | High | HTML snapshots for debugging, alerts on failures, maintain flexibility |
| Google Sheets API changes | High | Low | Use stable API version, monitor deprecation notices |
| GitHub Actions downtime | Medium | Low | Manual trigger option, can run locally |
| Credentials leak | High | Low | GitHub Secrets, .gitignore for local credentials, regular audits |
| Competitor closes without notice | Low | Medium | Failure tracking detects, Slack alerts, manual verification |

## 15. Appendix

### A. Sample Data Structures

**current_prices.json:**
```json
{
  "timestamp": "2026-03-18T06:05:00Z",
  "prices": {
    "Epicenter": {
      "Digitalt": null,
      "Drop-in": null,
      "Lounge": null,
      "Lean/Mini": null,
      "Flex": 3200,
      "Fixed": 6250,
      "Office": 7500,
      "status": "active",
      "last_updated": "2026-03-18"
    },
    "Mesh": {
      "Digitalt": 0,
      "Drop-in": null,
      "Lounge": 1790,
      "Lean/Mini": null,
      "Flex": 3490,
      "Fixed": 5190,
      "Office": null,
      "status": "active",
      "last_updated": "2026-03-18"
    }
  }
}
```

**scrape_failures.json:**
```json
{
  "failures": {
    "657": {
      "consecutive_failures": 3,
      "first_failure_date": "2026-03-01",
      "last_retry_date": "2026-03-15",
      "retry_count": 2,
      "status": "investigating",
      "error_message": "Connection timeout after 3 retries",
      "last_successful_scrape": "2026-02-15"
    }
  }
}
```

### B. Dependencies

**requirements.txt:**
```
playwright==1.40.0
beautifulsoup4==4.12.2
gspread==5.12.0
oauth2client==4.1.3
requests==2.31.0
pyyaml==6.0.1
python-dateutil==2.8.2
pytest==7.4.3
```

### C. Environment Variables

```bash
# Google Sheets
GOOGLE_SHEETS_CREDENTIALS=<JSON string>
SPREADSHEET_ID=1ye1Z6wBwPaJR2h8L2c_Qdx_P1C2g3ebi8hIz0w4qARY

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Optional
LOG_LEVEL=INFO
DRY_RUN=false
```

---

**End of Design Specification**
