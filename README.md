# Budget Dashboard

A small Python desktop budget app for tracking personal income, expenses, and monthly category budgets.

## Run

```powershell
python app.py
```

This starts the local Python server and opens the dashboard in a desktop-style app window.

To run only the web server:

```powershell
python app.py --server
```

The app saves automatically to `budget-data.json`.

Settings can move the JSON data file to another folder, including a cloud-synced folder. The app creates timestamped backups in `Budget Dashboard Backups` beside the active data file before saving changes, and Settings also includes a manual backup button.
