# Crypto Watchlist Alerts — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A private Telegram bot that lets users track crypto tickers with customizable price threshold alerts and percentage move notifications. Features include inline watchlist management, on-demand price checks, daily summaries, quiet hours, alert cooldowns, and an owner dashboard showing aggregated usage metrics and alert statistics.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- individual crypto investors
- Telegram bot operators

## Success criteria

- User can manage watchlist items via inline buttons
- Price alerts trigger with accurate thresholds/moves
- Owner dashboard displays aggregate alert statistics
- Quiet hours block alerts during specified window
- Cooldown prevents repeated alerts for same condition

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with watchlist management options
  - inputs: chat_id
  - outputs: welcome message with seed buttons
- **Bitcoin** (button, actor: user, callback: add:BTC) — Add Bitcoin to watchlist with default alert settings
  - inputs: ticker symbol
  - outputs: alert configuration menu
- **Ethereum** (button, actor: user, callback: add:ETH) — Add Ethereum to watchlist with default alert settings
  - inputs: ticker symbol
  - outputs: alert configuration menu
- **Toncoin** (button, actor: user, callback: add:TON) — Add Toncoin to watchlist with default alert settings
  - inputs: ticker symbol
  - outputs: alert configuration menu
- **Other** (button, actor: user, callback: add:custom) — Add custom ticker to watchlist
  - inputs: ticker symbol input
  - outputs: alert configuration menu
- **/add** (command, actor: user, command: /add) — Add a new ticker to watchlist via text input
  - inputs: ticker symbol
  - outputs: alert configuration menu
- **/remove** (command, actor: user, command: /remove) — Remove a ticker from watchlist
  - inputs: ticker symbol
  - outputs: confirmation message
- **/price** (command, actor: user, command: /price) — View current prices for watchlist or specific ticker
  - inputs: optional ticker symbol
  - outputs: price information message
- **/dashboard** (command, actor: owner, command: /dashboard) — View aggregated usage and alert statistics
  - inputs: none
  - outputs: owner metrics summary

## Flows

### onboarding
_Trigger:_ /start

1. Show welcome message
2. Display seed buttons for common tickers
3. Prompt for timezone and preferences

_Data touched:_ user profile

### add_alert
_Trigger:_ button: add:BTC/ETH/TON/custom

1. Select ticker
2. Choose alert type (threshold/percent-move)
3. Configure parameters
4. Confirm with Save/Cancel buttons

_Data touched:_ watchlist item

### price_check
_Trigger:_ /price or inline button

1. Request ticker information
2. Fetch and display current price
3. Show recent percent moves if applicable

_Data touched:_ price sample, watchlist item

### morning_summary
_Trigger:_ scheduled daily

1. Check user's configured summary time
2. Generate 24h summary of watchlist prices
3. Send summary if enabled

_Data touched:_ price sample, user profile

### quiet_hours
_Trigger:_ user configuration

1. Set quiet hours window
2. Queue alerts during suppression
3. Deliver queued alerts after window ends

_Data touched:_ user profile, watchlist item

### alert_cooldown
_Trigger:_ alert fired

1. Record alert timestamp
2. Apply cooldown period
3. Block duplicate alerts until cooldown expires

_Data touched:_ watchlist item, user profile

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **user_profile** _(retention: persistent)_ — User-specific settings and preferences
  - fields: chat_id, timezone, quiet_hours_start, quiet_hours_end, summary_time, cooldown_length, alert_preferences
- **watchlist_item** _(retention: persistent)_ — Crypto ticker being monitored with alert rules
  - fields: ticker, display_name, threshold_alerts, percent_move_alerts, enabled, last_alert_timestamp, last_notified_price
- **price_sample** _(retention: session)_ — Timestamped price data for alert calculations
  - fields: ticker, timestamp, price_value
- **owner_metrics** _(retention: persistent)_ — Aggregated system statistics
  - fields: user_count, alert_counts_by_ticker, alert_types_distribution

## Integrations

- **Telegram** (required) — Bot API messaging and inline buttons
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- /dashboard command to view aggregated metrics

## Notifications

- Price alert messages with comparison data
- Daily morning summaries
- Quiet hours alert summaries

## Permissions & privacy

- All user data is private to individual users
- Owner can only view aggregated metrics without identifying users
- Price samples retained only for alert calculations

## Edge cases

- Unknown ticker normalization and suggestions
- Price feed failures with silent retries
- Quiet hours alert queue overflow
- Cooldown expiration timing
- Multiple overlapping alert conditions

## Required tests

- Verify alert triggering with price thresholds
- Test percent-move alert calculations across time windows
- Validate quiet hours suppression and post-quiet delivery
- Confirm owner dashboard shows correct aggregate metrics
- Test unknown ticker handling with suggestions

## Assumptions

- Default price feed retry limit is 3 attempts
- Percent-move lookback defaults to 1 hour
- Queued alerts use first-missed delivery strategy
- User data stored in private database
