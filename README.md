# Budget Dashboard

CashPilot AI is a private, offline-first personal finance dashboard that combines budgeting, transaction tracking, smart categorisation, financial forecasting, and local AI coaching in one clean desktop-style app.

It helps users understand where their income goes, detect risky spending patterns, forecast month-end savings, manage budgets, and add transactions using natural language — all while keeping financial data stored locally in a JSON file.

## Run

```powershell
python CashPilot AI.py
```

This starts the local Python server and opens the dashboard in a desktop-style app window.

To run only the web server:

```powershell
python CashPilot AI.py --server
```

The app saves automatically to `budget-data.json`.

Settings can move the JSON data file to another folder, including a cloud-synced folder. The app creates timestamped backups in `Budget Dashboard Backups` beside the active data file before saving changes, and Settings also includes a manual backup button.
