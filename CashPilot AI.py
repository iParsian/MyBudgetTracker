from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlencode, unquote, urlparse
from urllib.request import Request, urlopen
import calendar
import concurrent.futures
import datetime as dt
import difflib
import json
import re
import statistics
from collections import Counter, defaultdict
import shutil
import subprocess
import sys
import threading
import time
import webbrowser
import uuid


ROOT = Path(__file__).resolve().parent
CONFIG_FILE = ROOT / "app-config.json"
DEFAULT_DATA_FILE = ROOT / "budget-data.json"
HOST = "127.0.0.1"
PORT = 0
ALLOWED_CURRENCIES = {"TRY", "USD", "EUR", "IRR"}
ALLOWED_CALENDARS = {"english", "persian"}
ALLOWED_LANGUAGES = {"english", "persian"}
ALLOWED_THEMES = {"linen", "sage", "mist", "pale-blue", "pale-pink", "pale-green"}
ALLOWED_DASHBOARD_WIDGETS = {"pie", "ai_report", "budget", "recent", "insights", "goals", "ai"}
MERGED_AI_WIDGET_ALIASES = {"report", "reports", "insights", "goals", "ai", "ai_coach", "ai_coaching", "coach", "coaching"}
NAVASAN_LATEST_URL = "http://api.navasan.tech/latest/"
BRSAPI_GOLD_CURRENCY_URL = "https://Api.BrsApi.ir/Market/Gold_Currency.php"
TGJU_PROFILE_URL = "https://www.tgju.org/profile/{slug}"
MARKET_SYMBOLS = {
    "usd": "usd_sell",
    "eur": "eur",
    "try": "try",
    "gold_18k_gram": "18ayar",
    "coin_emami": "sekkeh",
    "coin_bahar": "bahar",
    "coin_half": "nim",
    "coin_quarter": "rob",
    "coin_gram": "gerami",
    "btc": "btc",
    "eth": "eth",
    "usdt": "usdt",
}
TGJU_SYMBOLS = {
    "usd": "price_dollar_rl",
    "eur": "price_eur",
    "try": "price_try",
    "gold_18k_gram": "geram18",
    "coin_emami": "sekee",
    "coin_bahar": "sekeb",
    "coin_half": "nim",
    "coin_quarter": "rob",
    "coin_gram": "gerami",
    "btc": "crypto-bitcoin",
    "eth": "crypto-ethereum",
    "usdt": "crypto-tether",
}
TGJU_DEFAULT_ASSETS = {"usd", "eur", "try", "usdt"}
COUNTRY_COST_PROFILES = {
    "IR": {
        "name": "Iran",
        "annual_inflation_rate": 0.35,
        "essential_multiplier": 1.08,
        "flexible_multiplier": 1.03,
        "categories": {
            "Food": 1.12,
            "Transport": 1.10,
            "Housing": 1.14,
            "Rent": 1.16,
            "Utilities": 1.10,
            "Health": 1.10,
            "Education": 1.08,
        },
    },
    "TR": {"name": "Turkey", "annual_inflation_rate": 0.30, "essential_multiplier": 1.07, "flexible_multiplier": 1.03, "categories": {}},
    "US": {"name": "United States", "annual_inflation_rate": 0.03, "essential_multiplier": 1.03, "flexible_multiplier": 1.01, "categories": {}},
    "EU": {"name": "Euro area", "annual_inflation_rate": 0.025, "essential_multiplier": 1.025, "flexible_multiplier": 1.01, "categories": {}},
}
ESSENTIAL_BUDGET_CATEGORIES = {"food", "housing", "rent", "utilities", "health", "transport", "education"}
BRSAPI_SYMBOLS = {
    "usd": "USD",
    "eur": "EUR",
    "try": "TRY",
    "gold_18k_gram": "IR_GOLD_18K",
    "coin_emami": "IR_COIN_EMAMI",
    "coin_bahar": "IR_COIN_BAHAR",
    "coin_half": "IR_COIN_HALF",
    "coin_quarter": "IR_COIN_QUARTER",
    "coin_gram": "IR_COIN_1G",
    "btc": "BTC",
    "eth": "ETH",
    "usdt": "USDT",
}


SEED_DATA = {
    "currency": "IRR",
    "calendar": "english",
    "language": "english",
    "theme": "linen",
    "dashboard_widgets": ["pie", "ai_report", "budget", "recent"],
    "living_country": "IR",
    "inflation_rate": 0,
    "market_provider": {"name": "tgju", "api_key": "", "price_unit": "rial"},
    "investments": [],
    "recurring_transactions": [],
    "category_rules": [
        {"id": "r-001", "contains": "Salary", "category": "Salary"},
        {"id": "r-002", "contains": "Snap", "category": "Transport"},
    ],
    "goals": [
        {"id": "g-001", "type": "savings_rate", "name": "Save 20%", "target": 20, "category": ""},
    ],
    "categories": [
        {"name": "Education", "budget": 0, "type": "expense"},
        {"name": "Entertainment", "budget": 0, "type": "expense"},
        {"name": "Food", "budget": 0, "type": "expense"},
        {"name": "Health", "budget": 0, "type": "expense"},
        {"name": "Housing", "budget": 0, "type": "expense"},
        {"name": "Miscellaneous", "budget": 0, "type": "expense"},
        {"name": "Girlfriend Expenses", "budget": 0, "type": "expense"},
        {"name": "Rent", "budget": 0, "type": "expense"},
        {"name": "Salary", "budget": 0, "type": "income"},
        {"name": "Savings", "budget": 0, "type": "income"},
        {"name": "Sport", "budget": 0, "type": "expense"},
        {"name": "Transport", "budget": 0, "type": "expense"},
        {"name": "Travel", "budget": 0, "type": "expense"},
        {"name": "Utilities", "budget": 0, "type": "expense"},
    ],
    "transactions": [
        {"id": "t-001", "date": "2026-05-30", "description": "Salary", "category": "Salary", "amount": 1324000000},
        {"id": "t-002", "date": "2026-05-30", "description": "Fast Food", "category": "Girlfriend Expenses", "amount": -6959000},
        {"id": "t-003", "date": "2026-05-30", "description": "Tennis", "category": "Sport", "amount": -90000000},
        {"id": "t-004", "date": "2026-05-30", "description": "Tehran Data Debt", "category": "Education", "amount": -164100000},
        {"id": "t-005", "date": "2026-05-30", "description": "Vape", "category": "Miscellaneous", "amount": -18000000},
        {"id": "t-006", "date": "2026-05-30", "description": "Snap Pay", "category": "Girlfriend Expenses", "amount": -15000000},
    ],
}


def load_data():
    data_file = current_data_file()
    if not data_file.exists():
        save_data(SEED_DATA)
        return json.loads(json.dumps(SEED_DATA))

    with data_file.open("r", encoding="utf-8") as file:
        data = json.load(file)

    categories = data.get("categories", [])
    transactions = data.get("transactions", [])
    normalize_categories(categories, transactions)
    data = normalize_data(data, categories, transactions)
    if apply_recurring_due(data):
        save_data(data)

    return data


def save_data(data):
    data_file = current_data_file()
    data_file.parent.mkdir(parents=True, exist_ok=True)
    create_backup(data_file)
    writable_data = {key: value for key, value in data.items() if key != "storage"}
    with data_file.open("w", encoding="utf-8") as file:
        json.dump(writable_data, file, indent=2)


def load_config():
    if not CONFIG_FILE.exists():
        return {"data_file": str(DEFAULT_DATA_FILE)}
    with CONFIG_FILE.open("r", encoding="utf-8") as file:
        config = json.load(file)
    return {"data_file": config.get("data_file", str(DEFAULT_DATA_FILE))}


def save_config(config):
    with CONFIG_FILE.open("w", encoding="utf-8") as file:
        json.dump(config, file, indent=2)


def current_data_file():
    return Path(load_config()["data_file"]).expanduser().resolve()


def backup_dir(data_file=None):
    data_file = data_file or current_data_file()
    return data_file.parent / "Budget Dashboard Backups"


def create_backup(data_file=None):
    data_file = data_file or current_data_file()
    if not data_file.exists():
        return None
    target_dir = backup_dir(data_file)
    target_dir.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    backup_file = target_dir / f"{data_file.stem}-{stamp}.json"
    shutil.copy2(data_file, backup_file)
    prune_backups(target_dir)
    return backup_file


def prune_backups(target_dir, keep=10):
    backups = sorted(target_dir.glob("*.json"), key=lambda path: path.stat().st_mtime, reverse=True)
    for old_backup in backups[keep:]:
        old_backup.unlink(missing_ok=True)


def storage_status():
    data_file = current_data_file()
    target_dir = backup_dir(data_file)
    if target_dir.exists():
        prune_backups(target_dir)
    backups = sorted(target_dir.glob("*.json"), key=lambda path: path.stat().st_mtime, reverse=True) if target_dir.exists() else []
    return {
        "data_file": str(data_file),
        "backup_dir": str(target_dir),
        "backup_count": len(backups),
        "latest_backup": str(backups[0]) if backups else "",
        "backups": backup_payload(backups),
    }


def backup_payload(backups):
    payload = []
    for backup in backups:
        stat = backup.stat()
        payload.append({
            "path": str(backup),
            "name": backup.name,
            "created": dt.datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
            "size": stat.st_size,
        })
    return payload


def set_data_file(path_text):
    new_file = Path(path_text).expanduser().resolve()
    if new_file.suffix.lower() != ".json":
        new_file = new_file / "budget-data.json" if new_file.suffix == "" else new_file.with_suffix(".json")
    old_file = current_data_file()
    data = load_data()
    create_backup(old_file)
    new_file.parent.mkdir(parents=True, exist_ok=True)
    if new_file.exists():
        create_backup(new_file)
    with new_file.open("w", encoding="utf-8") as file:
        json.dump({key: value for key, value in data.items() if key != "storage"}, file, indent=2)
    save_config({"data_file": str(new_file)})
    return storage_status()


def browse_data_file():
    try:
        import tkinter as tk
        from tkinter import filedialog
    except ImportError:
        return None

    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    selected = filedialog.asksaveasfilename(
        title="Choose Budget Dashboard data file",
        defaultextension=".json",
        filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
        initialfile="budget-data.json",
    )
    root.destroy()
    return selected or None


def restore_backup(path_text):
    backup_file = Path(path_text).expanduser().resolve()
    data_file = current_data_file()
    if not backup_file.exists() or backup_file.suffix.lower() != ".json":
        raise ValueError("Backup file does not exist")
    if backup_dir(data_file) not in backup_file.parents:
        raise ValueError("Backup must be from the configured backup folder")
    create_backup(data_file)
    shutil.copy2(backup_file, data_file)
    return load_data()


class BudgetHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/data":
            self.send_json(load_data())
            return
        if path == "/api/storage":
            self.send_json(storage_status())
            return
        if path == "/api/backups":
            self.send_json(storage_status())
            return
        if path in {"/api/ai/insights", "/api/ai/report", "/api/report"}:
            # /api/ai/insights is kept for backwards compatibility. The preferred
            # endpoint is now /api/ai/report because reports and coaching are merged.
            self.send_json(generate_ai_report(load_data()))
            return
        if path == "/api/ai/recommendations":
            self.send_json({"recommendations": recommend_next_actions(load_data())})
            return
        if path == "/api/ai/rule-suggestions":
            self.send_json({"suggestions": suggest_category_rules(load_data())})
            return
        if path in {"/api/ai/pie", "/api/charts/pie", "/api/pie"}:
            self.send_json(build_income_expense_pie(load_data()))
            return
        if path == "/api/ai/quality-check":
            self.send_json(build_data_quality_report(load_data()))
            return
        if path == "/api/market-rates":
            data = load_data()
            rates = fetch_market_rates(data)
            self.send_json({"rates": rates, "portfolio": investment_portfolio(data, rates)})
            return
        if path == "/":
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/transactions":
            data = load_data()
            transaction = self.read_json()
            transaction["id"] = f"t-{uuid.uuid4().hex[:10]}"
            data["transactions"].append(clean_transaction(apply_smart_category(data, transaction)))
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/transactions/import":
            data = load_data()
            payload = self.read_json()
            imported = payload.get("transactions", [])
            for transaction in imported:
                transaction["id"] = f"t-{uuid.uuid4().hex[:10]}"
                data["transactions"].append(clean_transaction(apply_smart_category(data, transaction)))
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/ai/parse-transaction":
            data = load_data()
            payload = self.read_json()
            text = str(payload.get("text", "")).strip()
            if not text:
                self.send_error(400, "Text is required")
                return
            parsed = parse_transaction_text(data, text)
            if payload.get("save"):
                parsed["id"] = f"t-{uuid.uuid4().hex[:10]}"
                saved = clean_transaction(parsed)
                data["transactions"].append(saved)
                save_data(data)
                self.send_json({**saved, "transaction": saved, "data": data})
            else:
                self.send_json({**parsed, "transaction": parsed})
            return

        if path == "/api/ai/predict-category":
            data = load_data()
            payload = self.read_json()
            description = str(payload.get("description") or payload.get("text") or "").strip()
            amount = payload.get("amount", 0)
            if not description:
                self.send_error(400, "Description is required")
                return
            prediction = clean_transaction(apply_smart_category(data, {"description": description, "amount": amount, "category": payload.get("category", "")}))
            self.send_json({**prediction, "prediction": prediction.get("ai", {}), "transaction": prediction})
            return

        if path == "/api/ai/import-preview":
            data = load_data()
            payload = self.read_json()
            imported = payload.get("transactions", [])
            preview = ai_import_preview(data, imported)
            self.send_json({"preview": preview, "count": len(preview)})
            return

        if path == "/api/ai/apply-rule-suggestion":
            data = load_data()
            payload = self.read_json()
            rule = {
                "contains": str(payload.get("contains", "")).strip(),
                "category": str(payload.get("category", "")).strip(),
            }
            if not rule["contains"] or not rule["category"]:
                self.send_error(400, "Both contains and category are required")
                return
            rule["id"] = str(payload.get("id") or f"rule-{uuid.uuid4().hex[:10]}")
            upsert_rule(data, rule)
            save_data(data)
            self.send_json({"rule": rule, "data": data})
            return

        if path == "/api/ai/apply-budget-targets":
            data = load_data()
            recommendations = ai_budget_targets(data)
            applied = apply_ai_budget_targets(data, recommendations)
            save_data(data)
            self.send_json({"applied": applied, "recommendations": recommendations, "data": data})
            return

        if path == "/api/ai/transaction-advice":
            data = load_data()
            payload = self.read_json()
            transaction = apply_smart_category(data, payload)
            self.send_json({"advice": explain_transaction(data, transaction), "transaction": clean_transaction(transaction)})
            return

        if path == "/api/categories":
            data = load_data()
            category = self.read_json()
            upsert_category(data, category)
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/recurring":
            data = load_data()
            upsert_recurring(data, self.read_json())
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/recurring/apply":
            data = load_data()
            apply_recurring_due(data, force=True)
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/rules":
            data = load_data()
            upsert_rule(data, self.read_json())
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/goals":
            data = load_data()
            upsert_goal(data, self.read_json())
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/investments":
            data = load_data()
            upsert_investment(data, self.read_json())
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/investments/update-prices":
            data = load_data()
            result = update_investment_prices(data)
            save_data(data)
            self.send_json({"data": data, **result})
            return

        if path == "/api/dashboard-widgets":
            data = load_data()
            payload = self.read_json()
            data["dashboard_widgets"] = normalize_dashboard_widgets(payload.get("dashboard_widgets", []))
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/settings":
            data = load_data()
            settings = self.read_json()
            currency = str(settings.get("currency", data["currency"])).upper()[:3]
            calendar = str(settings.get("calendar", data["calendar"])).lower()
            language = str(settings.get("language", data["language"])).lower()
            theme = str(settings.get("theme", data["theme"])).lower()
            if currency in ALLOWED_CURRENCIES:
                data["currency"] = currency
            if calendar in ALLOWED_CALENDARS:
                data["calendar"] = calendar
            if language in ALLOWED_LANGUAGES:
                data["language"] = language
            if theme in ALLOWED_THEMES:
                data["theme"] = theme
            provider = data.get("market_provider", {"name": "navasan", "api_key": "", "price_unit": "toman"})
            if "market_provider" in settings:
                provider_name = str(settings.get("market_provider", "tgju")).strip().lower()
                provider["name"] = provider_name if provider_name in {"tgju", "navasan", "brsapi"} else "tgju"
            if "market_api_key" in settings:
                provider["api_key"] = str(settings.get("market_api_key", "")).strip()
            data["market_provider"] = provider
            country = str(settings.get("living_country", data.get("living_country", "IR"))).strip().upper()[:2]
            data["living_country"] = country if country in COUNTRY_COST_PROFILES else "IR"
            if "inflation_rate" in settings:
                data["inflation_rate"] = max(0, min(300, safe_float(settings.get("inflation_rate"))))
            save_data(data)
            self.send_json(data)
            return

        if path == "/api/storage":
            payload = self.read_json()
            data_file = str(payload.get("data_file", "")).strip()
            if not data_file:
                self.send_error(400, "Data file path is required")
                return
            self.send_json(set_data_file(data_file))
            return

        if path == "/api/storage/browse":
            selected = browse_data_file()
            if not selected:
                self.send_json(storage_status())
                return
            self.send_json(set_data_file(selected))
            return

        if path == "/api/backup":
            backup_file = create_backup()
            payload = storage_status()
            payload["created_backup"] = str(backup_file) if backup_file else ""
            self.send_json(payload)
            return

        if path == "/api/backups/restore":
            payload = self.read_json()
            try:
                self.send_json(restore_backup(str(payload.get("path", ""))))
            except ValueError as error:
                self.send_error(400, str(error))
            return

        self.send_error(404)

    def do_PUT(self):
        path = urlparse(self.path).path
        if path.startswith("/api/transactions/"):
            transaction_id = path.rsplit("/", 1)[-1]
            data = load_data()
            incoming = clean_transaction(apply_smart_category(data, {**self.read_json(), "id": transaction_id}))
            for index, transaction in enumerate(data["transactions"]):
                if transaction.get("id") == transaction_id:
                    data["transactions"][index] = incoming
                    save_data(data)
                    self.send_json(data)
                    return
            self.send_error(404, "Transaction not found")
            return

        self.send_error(404)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith("/api/transactions/"):
            transaction_id = path.rsplit("/", 1)[-1]
            data = load_data()
            data["transactions"] = [
                transaction for transaction in data["transactions"]
                if transaction.get("id") != transaction_id
            ]
            save_data(data)
            self.send_json(data)
            return

        if path.startswith("/api/categories/"):
            category_name = unquote(path.rsplit("/", 1)[-1])
            data = load_data()
            data["categories"] = [
                category for category in data["categories"]
                if category.get("name", "").lower() != category_name.lower()
            ]
            save_data(data)
            self.send_json(data)
            return

        if path.startswith("/api/recurring/"):
            recurring_id = path.rsplit("/", 1)[-1]
            data = load_data()
            data["recurring_transactions"] = [
                item for item in data.get("recurring_transactions", [])
                if item.get("id") != recurring_id
            ]
            save_data(data)
            self.send_json(data)
            return

        if path.startswith("/api/rules/"):
            rule_id = path.rsplit("/", 1)[-1]
            data = load_data()
            data["category_rules"] = [
                rule for rule in data.get("category_rules", [])
                if rule.get("id") != rule_id
            ]
            save_data(data)
            self.send_json(data)
            return

        if path.startswith("/api/goals/"):
            goal_id = path.rsplit("/", 1)[-1]
            data = load_data()
            data["goals"] = [
                goal for goal in data.get("goals", [])
                if goal.get("id") != goal_id
            ]
            save_data(data)
            self.send_json(data)
            return

        if path.startswith("/api/investments/"):
            investment_id = path.rsplit("/", 1)[-1]
            data = load_data()
            data["investments"] = [
                item for item in data.get("investments", [])
                if item.get("id") != investment_id
            ]
            save_data(data)
            self.send_json(data)
            return

        self.send_error(404)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(raw)

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def normalise_time_text(value):
    """Return HH:MM when possible; otherwise use the current local time."""
    if value is None or str(value).strip() == "":
        return dt.datetime.now().strftime("%H:%M")
    raw = str(value).strip()
    match = re.search(r"\b(\d{1,2})[:.](\d{2})(?::\d{2})?\b", raw)
    if match:
        hour, minute = int(match.group(1)), int(match.group(2))
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}"
    match = re.search(r"\b(\d{1,2})\s*(am|pm)\b", raw, re.I)
    if match:
        hour = int(match.group(1))
        suffix = match.group(2).lower()
        if suffix == "pm" and hour < 12:
            hour += 12
        if suffix == "am" and hour == 12:
            hour = 0
        if 0 <= hour <= 23:
            return f"{hour:02d}:00"
    return dt.datetime.now().strftime("%H:%M")


def normalise_date_text(value):
    raw = str(value or "").strip()
    if not raw:
        return dt.date.today().isoformat()
    try:
        return dt.date.fromisoformat(raw[:10]).isoformat()
    except ValueError:
        return dt.date.today().isoformat()


def combine_timestamp(date_text, time_text):
    date_value = normalise_date_text(date_text)
    time_value = normalise_time_text(time_text)
    return f"{date_value}T{time_value}:00"


def clean_transaction(transaction):
    date_value = normalise_date_text(transaction.get("date", dt.date.today().isoformat()))
    time_value = normalise_time_text(transaction.get("time") or transaction.get("timestamp") or transaction.get("created_at"))
    now_stamp = dt.datetime.now().isoformat(timespec="seconds")
    cleaned = {
        "id": str(transaction.get("id", f"t-{uuid.uuid4().hex[:10]}")),
        "date": date_value,
        "time": time_value,
        "timestamp": str(transaction.get("timestamp") or combine_timestamp(date_value, time_value)),
        "description": str(transaction.get("description", "")).strip(),
        "category": str(transaction.get("category", "")).strip(),
        "amount": float(transaction.get("amount", 0) or 0),
        "created_at": str(transaction.get("created_at") or now_stamp),
        "updated_at": now_stamp,
    }
    # Preserve selected metadata used by recurring entries and the local AI layer.
    for optional_key in ("source_recurring_id", "period", "ai", "tags", "notes", "merchant"):
        if optional_key in transaction:
            cleaned[optional_key] = transaction[optional_key]
    return cleaned

def normalize_dashboard_widgets(widgets):
    """Merge the old Report/Insights/Goals/AI widgets into one AI report widget.

    Older front-end code may still send "insights", "goals" or "ai". The backend
    now stores one canonical widget, "ai_report", while keeping the older names
    accepted so existing UI code does not break immediately.
    """
    if not isinstance(widgets, list):
        widgets = ["pie", "ai_report", "budget", "recent"]
    normalised = []
    for widget in widgets:
        value = str(widget).strip().lower().replace("-", "_")
        if value in MERGED_AI_WIDGET_ALIASES:
            value = "ai_report"
        if value not in ALLOWED_DASHBOARD_WIDGETS and value != "ai_report":
            continue
        if value in {"insights", "goals", "ai"}:
            value = "ai_report"
        if value not in normalised:
            normalised.append(value)
    return normalised


def normalize_data(data, categories, transactions):
    dashboard_widgets = normalize_dashboard_widgets(data.get("dashboard_widgets", ["pie", "ai_report", "budget", "recent"]))
    return {
        "currency": data.get("currency", "IRR"),
        "calendar": data.get("calendar", "english"),
        "language": data.get("language", "english"),
        "theme": data.get("theme", "linen"),
        "dashboard_widgets": dashboard_widgets,
        "living_country": str(data.get("living_country", "IR")).upper()[:2] if str(data.get("living_country", "IR")).upper()[:2] in COUNTRY_COST_PROFILES else "IR",
        "inflation_rate": max(0, min(300, safe_float(data.get("inflation_rate")))),
        "categories": categories,
        "transactions": transactions,
        "recurring_transactions": data.get("recurring_transactions", []),
        "category_rules": data.get("category_rules", []),
        "goals": data.get("goals", []),
        "investments": data.get("investments", []),
        "market_provider": data.get("market_provider", {"name": "tgju", "api_key": "", "price_unit": "rial"}),
    }



# -----------------------------------------------------------------------------
# Local AI / Smart Finance Layer
# -----------------------------------------------------------------------------
# The functions below are deliberately offline and dependency-free. They combine
# deterministic finance logic, simple statistics, fuzzy matching, and learning
# from previously corrected transactions. This keeps private budget data local.

STOPWORDS = {
    "the", "a", "an", "and", "or", "for", "to", "from", "with", "of", "in",
    "on", "at", "by", "i", "paid", "pay", "payment", "bought", "buy", "spent",
    "received", "got", "salary", "today", "yesterday", "tomorrow", "rial", "rials",
    "irr", " toman", "tomans", "million", "billion", "m", "bn",
}

INCOME_WORDS = {"salary", "income", "received", "bonus", "wage", "deposit", "transfer in", "profit"}
EXPENSE_WORDS = {"paid", "spent", "bought", "buy", "payment", "cost", "bill", "fee", "debt"}

CATEGORY_HINTS = {
    "Food": ["food", "restaurant", "cafe", "coffee", "lunch", "dinner", "fast food", "pizza", "burger"],
    "Transport": ["snap", "snapp", "taxi", "uber", "metro", "bus", "fuel", "petrol", "parking"],
    "Sport": ["sport", "gym", "tennis", "football", "fitness", "pool"],
    "Education": ["course", "book", "school", "university", "class", "data", "tuition"],
    "Health": ["doctor", "medicine", "pharmacy", "dentist", "clinic", "health"],
    "Housing": ["home", "house", "maintenance", "building"],
    "Rent": ["rent", "lease"],
    "Utilities": ["electricity", "water", "gas", "internet", "phone", "mobile", "utility"],
    "Travel": ["hotel", "flight", "ticket", "travel", "trip", "visa"],
    "Entertainment": ["movie", "cinema", "game", "netflix", "spotify", "concert"],
    "Salary": ["salary", "wage", "payroll"],
    "Savings": ["saving", "savings", "investment", "deposit"],
}


def tokenise(text):
    return [token for token in re.findall(r"[\w\u0600-\u06FF]+", str(text).lower()) if token not in STOPWORDS]


def safe_float(value, default=0.0):
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return default


def parse_date_text(text):
    lowered = str(text).lower()
    today = dt.date.today()
    if "yesterday" in lowered:
        return (today - dt.timedelta(days=1)).isoformat()
    if "tomorrow" in lowered:
        return (today + dt.timedelta(days=1)).isoformat()
    iso_match = re.search(r"\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", lowered)
    if iso_match:
        year, month, day = map(int, iso_match.groups())
        try:
            return dt.date(year, month, day).isoformat()
        except ValueError:
            pass
    return today.isoformat()


def parse_time_text(text):
    lowered = str(text).lower()
    match = re.search(r"(?:at|around|@)\s*(\d{1,2})[:.](\d{2})", lowered)
    if match:
        return normalise_time_text(f"{match.group(1)}:{match.group(2)}")
    match = re.search(r"(?:at|around|@)\s*(\d{1,2})\s*(am|pm)", lowered)
    if match:
        return normalise_time_text(f"{match.group(1)} {match.group(2)}")
    if "morning" in lowered:
        return "09:00"
    if "noon" in lowered or "lunch" in lowered:
        return "12:30"
    if "afternoon" in lowered:
        return "15:00"
    if "evening" in lowered or "dinner" in lowered:
        return "20:00"
    if "night" in lowered:
        return "22:00"
    return dt.datetime.now().strftime("%H:%M")


def extract_amount(text):
    cleaned = str(text).replace(",", "")
    match = re.search(r"(-?\d+(?:\.\d+)?)\s*(billion|bn|million|m)?", cleaned, re.I)
    if not match:
        return 0.0
    amount = float(match.group(1))
    scale = (match.group(2) or "").lower()
    if scale in {"billion", "bn"}:
        amount *= 1_000_000_000
    elif scale in {"million", "m"}:
        amount *= 1_000_000
    return amount


def category_type(data, category_name):
    category = next(
        (item for item in data.get("categories", []) if item.get("name", "").lower() == str(category_name).lower()),
        None,
    )
    return category.get("type", "expense") if category else "expense"


def known_category_names(data):
    return [category.get("name", "") for category in data.get("categories", []) if category.get("name")]


def rule_category_match(data, description):
    lowered = str(description).lower()
    for rule in data.get("category_rules", []):
        needle = str(rule.get("contains", "")).strip().lower()
        if needle and needle in lowered:
            return str(rule.get("category", "")).strip(), 0.98, f"Matched manual rule containing '{rule.get('contains')}'."
    return "", 0.0, ""


def history_category_match(data, description):
    tokens = set(tokenise(description))
    if not tokens:
        return "", 0.0, ""

    scored = []
    for old in data.get("transactions", []):
        old_category = str(old.get("category", "")).strip()
        old_description = str(old.get("description", "")).strip()
        if not old_category or not old_description:
            continue
        old_tokens = set(tokenise(old_description))
        if not old_tokens:
            continue
        overlap = len(tokens & old_tokens) / max(len(tokens | old_tokens), 1)
        ratio = difflib.SequenceMatcher(None, str(description).lower(), old_description.lower()).ratio()
        score = (0.65 * overlap) + (0.35 * ratio)
        if score >= 0.35:
            scored.append((score, old_category, old_description))

    if not scored:
        return "", 0.0, ""
    category_scores = defaultdict(float)
    examples = {}
    for score, category, example in scored:
        category_scores[category] += score
        examples.setdefault(category, example)
    category, score = max(category_scores.items(), key=lambda item: item[1])
    confidence = min(0.93, 0.42 + score / 3)
    return category, confidence, f"Similar to previous transaction: '{examples.get(category, '')}'."


def keyword_category_match(data, description):
    lowered = str(description).lower()
    available = {name.lower(): name for name in known_category_names(data)}
    best_category = ""
    best_score = 0.0
    best_hint = ""
    for category, hints in CATEGORY_HINTS.items():
        if category.lower() not in available:
            continue
        for hint in hints:
            ratio = difflib.SequenceMatcher(None, hint, lowered).ratio()
            score = 0.78 if hint in lowered else ratio * 0.55
            if score > best_score:
                best_score = score
                best_category = available[category.lower()]
                best_hint = hint
    if best_category and best_score >= 0.45:
        return best_category, min(0.86, best_score), f"Matched finance keyword '{best_hint}'."
    return "", 0.0, ""


def infer_transaction_sign(data, category, description, amount):
    lowered = str(description).lower()
    abs_amount = abs(safe_float(amount))
    if category_type(data, category) == "income" or any(word in lowered for word in INCOME_WORDS):
        return abs_amount
    if any(word in lowered for word in EXPENSE_WORDS):
        return -abs_amount
    return signed_amount_for_category(data, category, abs_amount)


def apply_smart_category(data, transaction):
    description = str(transaction.get("description", "")).strip()
    existing_category = str(transaction.get("category", "")).strip()
    candidates = []

    rule_category, rule_confidence, rule_reason = rule_category_match(data, description)
    if rule_category:
        candidates.append((rule_confidence, rule_category, "manual_rule", rule_reason))

    history_category, history_confidence, history_reason = history_category_match(data, description)
    if history_category:
        candidates.append((history_confidence, history_category, "history_similarity", history_reason))

    keyword_category, keyword_confidence, keyword_reason = keyword_category_match(data, description)
    if keyword_category:
        candidates.append((keyword_confidence, keyword_category, "keyword_hint", keyword_reason))

    if existing_category:
        # Manual user input/correction should win over automatic guesses.
        candidates.append((0.995, existing_category, "user_input", "Category provided by user."))

    if candidates:
        confidence, category, method, reason = max(candidates, key=lambda item: item[0])
    else:
        category, confidence, method, reason = existing_category or "Miscellaneous", 0.20, "fallback", "No strong match found."

    transaction["category"] = category
    transaction["amount"] = infer_transaction_sign(data, category, description, transaction.get("amount", 0))
    transaction["ai"] = {
        "suggested_category": category,
        "confidence": round(float(confidence), 3),
        "method": method,
        "reason": reason,
    }
    return transaction


# Backwards-compatible name used by older code paths.
def apply_category_rules(data, transaction):
    return apply_smart_category(data, transaction)


def parse_transaction_text(data, text):
    amount = extract_amount(text)
    category, confidence, method, reason = "", 0.0, "", ""
    probe = {"description": text, "amount": amount, "category": ""}
    suggested = apply_smart_category(data, probe)
    category = suggested.get("category", "Miscellaneous")
    confidence = suggested.get("ai", {}).get("confidence", 0.2)
    method = suggested.get("ai", {}).get("method", "fallback")
    reason = suggested.get("ai", {}).get("reason", "Parsed from free text.")
    # Clean the description by removing the first amount phrase and common finance verbs.
    description = re.sub(r"-?\d+(?:[,\d]*)(?:\.\d+)?\s*(billion|bn|million|m)?", "", text, count=1, flags=re.I)
    description = re.sub(r"\b(i|paid|spent|bought|received|got|for|today|yesterday|tomorrow)\b", "", description, flags=re.I)
    description = " ".join(description.split()).strip() or text.strip()
    return clean_transaction({
        "date": parse_date_text(text),
        "time": parse_time_text(text),
        "description": description.title() if description.islower() else description,
        "category": category,
        "amount": infer_transaction_sign(data, category, text, amount),
        "ai": {
            "suggested_category": category,
            "confidence": round(float(confidence), 3),
            "method": method,
            "reason": reason,
            "source_text": text,
        },
    })


def transaction_month(transaction):
    try:
        value = dt.date.fromisoformat(str(transaction.get("date", ""))[:10])
        return f"{value.year}-{value.month:02d}"
    except ValueError:
        return "unknown"


def current_month_key(transactions):
    valid = [transaction_month(item) for item in transactions if transaction_month(item) != "unknown"]
    if valid:
        return max(valid)
    today = dt.date.today()
    return f"{today.year}-{today.month:02d}"


def aggregate_by_month(transactions):
    months = defaultdict(lambda: {"income": 0.0, "expenses": 0.0, "net": 0.0, "categories": defaultdict(float)})
    for transaction in transactions:
        month = transaction_month(transaction)
        amount = safe_float(transaction.get("amount"))
        months[month]["net"] += amount
        if amount >= 0:
            months[month]["income"] += amount
        else:
            expense = abs(amount)
            months[month]["expenses"] += expense
            months[month]["categories"][transaction.get("category", "Miscellaneous")] += expense
    return months


def calculate_savings_rate(income, expenses):
    if income <= 0:
        return 0.0
    return max(-100.0, min(100.0, ((income - expenses) / income) * 100))


def generate_summary(data, current):
    income = current.get("income", 0.0)
    expenses = current.get("expenses", 0.0)
    net = income - expenses
    savings_rate = calculate_savings_rate(income, expenses)
    return {
        "income": round(income, 2),
        "expenses": round(expenses, 2),
        "net": round(net, 2),
        "savings_rate": round(savings_rate, 2),
        "text": f"This month you have income of {income:,.0f}, expenses of {expenses:,.0f}, and a savings rate of {savings_rate:.1f}%.",
    }


def detect_anomalies(data, months, active_month):
    warnings = []
    current_categories = months.get(active_month, {}).get("categories", {})
    historic_months = {key: value for key, value in months.items() if key not in {active_month, "unknown"}}
    for category, current_value in current_categories.items():
        history = [month_data["categories"].get(category, 0.0) for month_data in historic_months.values()]
        history = [value for value in history if value > 0]
        if len(history) < 2:
            continue
        average = statistics.mean(history)
        stdev = statistics.pstdev(history) if len(history) > 1 else 0.0
        threshold = max(average * 1.5, average + (2 * stdev))
        if current_value > threshold and current_value - average > 0:
            warnings.append({
                "type": "anomaly",
                "severity": "warning",
                "category": category,
                "title": f"Unusual {category} spending",
                "message": f"{category} spending is {current_value / average:.1f}× higher than your usual monthly average.",
                "current": round(current_value, 2),
                "average": round(average, 2),
            })
    return warnings


def budget_advice(data, current):
    advice = []
    spent = current.get("categories", {})
    today = dt.date.today()
    month_days = calendar.monthrange(today.year, today.month)[1]
    month_progress = today.day / month_days
    for category in data.get("categories", []):
        if category.get("type") != "expense":
            continue
        budget = safe_float(category.get("budget"))
        if budget <= 0:
            continue
        name = category.get("name", "")
        used = spent.get(name, 0.0)
        if used > budget:
            advice.append({
                "type": "budget_overrun",
                "severity": "danger",
                "category": name,
                "title": f"{name} budget exceeded",
                "message": f"You have spent {used:,.0f}, which is above the {budget:,.0f} budget.",
                "spent": round(used, 2),
                "budget": round(budget, 2),
            })
        elif month_progress > 0 and used / budget > month_progress + 0.20:
            advice.append({
                "type": "budget_pace",
                "severity": "warning",
                "category": name,
                "title": f"{name} is spending faster than planned",
                "message": f"You have used {(used / budget) * 100:.1f}% of this budget while the month is {month_progress * 100:.1f}% complete.",
                "spent": round(used, 2),
                "budget": round(budget, 2),
            })
    return advice


def goal_coaching(data, current):
    messages = []
    income = current.get("income", 0.0)
    expenses = current.get("expenses", 0.0)
    categories = current.get("categories", {})
    for goal in data.get("goals", []):
        goal_type = goal.get("type", "savings_rate")
        target = safe_float(goal.get("target"))
        if target <= 0:
            continue
        if goal_type == "savings_rate":
            actual = calculate_savings_rate(income, expenses)
            max_expenses = income * (1 - target / 100) if income > 0 else 0
            gap = expenses - max_expenses
            messages.append({
                "type": "goal",
                "goal_id": goal.get("id", ""),
                "title": goal.get("name", "Savings goal"),
                "target": target,
                "actual": round(actual, 2),
                "status": "on_track" if actual >= target else "behind",
                "message": (
                    f"You are on track: savings rate is {actual:.1f}% against a {target:.1f}% target."
                    if actual >= target else
                    f"To reach {target:.1f}% savings, reduce expenses by about {max(gap, 0):,.0f} this month."
                ),
            })
        elif goal_type == "category_spend":
            category = goal.get("category", "")
            spent = categories.get(category, 0.0)
            messages.append({
                "type": "goal",
                "goal_id": goal.get("id", ""),
                "title": goal.get("name", f"{category} goal"),
                "target": target,
                "actual": round(spent, 2),
                "status": "on_track" if spent <= target else "behind",
                "message": f"{category} spending is {spent:,.0f} against a target of {target:,.0f}.",
            })
    return messages


def forecast_month(data, months, active_month):
    current = months.get(active_month, {"income": 0.0, "expenses": 0.0, "categories": {}})
    try:
        year, month = map(int, active_month.split("-"))
        if year == dt.date.today().year and month == dt.date.today().month:
            elapsed = max(dt.date.today().day, 1)
            total_days = calendar.monthrange(year, month)[1]
            factor = total_days / elapsed
        else:
            factor = 1.0
    except Exception:
        factor = 1.0

    projected_income = current.get("income", 0.0) * factor
    projected_expenses = current.get("expenses", 0.0) * factor
    projected_savings_rate = calculate_savings_rate(projected_income, projected_expenses)
    return {
        "month": active_month,
        "projected_income": round(projected_income, 2),
        "projected_expenses": round(projected_expenses, 2),
        "projected_net": round(projected_income - projected_expenses, 2),
        "projected_savings_rate": round(projected_savings_rate, 2),
        "method": "linear_month_to_date_projection",
    }


def suggest_category_rules(data, minimum_count=2):
    existing = {str(rule.get("contains", "")).lower() for rule in data.get("category_rules", [])}
    counts = defaultdict(Counter)
    examples = defaultdict(dict)
    for transaction in data.get("transactions", []):
        category = str(transaction.get("category", "")).strip()
        if not category:
            continue
        for token in tokenise(transaction.get("description", "")):
            if len(token) < 4 or token in existing:
                continue
            counts[token][category] += 1
            examples[token].setdefault(category, transaction.get("description", ""))

    suggestions = []
    for token, category_counts in counts.items():
        category, count = category_counts.most_common(1)[0]
        total = sum(category_counts.values())
        confidence = count / total if total else 0
        if count >= minimum_count and confidence >= 0.75:
            suggestions.append({
                "contains": token,
                "category": category,
                "confidence": round(confidence, 3),
                "count": count,
                "example": examples[token].get(category, ""),
                "reason": f"{count} previous transactions containing '{token}' were categorised as {category}.",
            })
    return sorted(suggestions, key=lambda item: (item["confidence"], item["count"]), reverse=True)[:10]


def top_spending_categories(current, limit=5):
    return [
        {"category": category, "amount": round(amount, 2)}
        for category, amount in sorted(current.get("categories", {}).items(), key=lambda item: item[1], reverse=True)[:limit]
    ]



def build_data_quality_report(data):
    transactions = data.get("transactions", [])
    seen = defaultdict(list)
    missing = []
    low_confidence = []
    for transaction in transactions:
        cleaned = clean_transaction(transaction)
        key = (
            cleaned.get("date", "")[:10],
            cleaned.get("description", "").strip().lower(),
            round(safe_float(cleaned.get("amount")), 2),
        )
        seen[key].append(cleaned.get("id", ""))
        if not cleaned.get("category") or not cleaned.get("description"):
            missing.append(cleaned)
        if safe_float(cleaned.get("ai", {}).get("confidence"), 1) < 0.45:
            low_confidence.append(cleaned)
    duplicates = [
        {"date": key[0], "description": key[1], "amount": key[2], "ids": ids, "count": len(ids)}
        for key, ids in seen.items() if len(ids) > 1
    ]
    return {
        "duplicates": duplicates[:20],
        "missing_fields": missing[:20],
        "low_confidence": low_confidence[:20],
        "summary": {
            "transaction_count": len(transactions),
            "duplicate_groups": len(duplicates),
            "missing_count": len(missing),
            "low_confidence_count": len(low_confidence),
        },
    }


def build_income_expense_pie(data, month=None):
    """Pie model where total income is the base and expense categories are deductions.

    The old UI logic often treated income as just another category slice. This model
    separates the two concepts: the pie starts from total income, then displays each
    expense category as a deduction plus a remaining/unspent slice.
    """
    transactions = data.get("transactions", [])
    active_month = month or current_month_key(transactions)
    months = aggregate_by_month(transactions)
    current = months.get(active_month, {"income": 0.0, "expenses": 0.0, "categories": {}})
    income = safe_float(current.get("income"))
    expenses = safe_float(current.get("expenses"))
    remaining = max(income - expenses, 0.0)
    overspent = max(expenses - income, 0.0)
    slices = []
    for category, amount in sorted(current.get("categories", {}).items(), key=lambda item: item[1], reverse=True):
        if amount <= 0:
            continue
        slices.append({
            "label": category,
            "category": category,
            "amount": round(amount, 2),
            "kind": "expense_deduction",
            "percentage_of_income": round((amount / income) * 100, 2) if income > 0 else 0.0,
        })
    if remaining > 0:
        slices.append({
            "label": "Remaining income",
            "category": "Remaining income",
            "amount": round(remaining, 2),
            "kind": "remaining",
            "percentage_of_income": round((remaining / income) * 100, 2) if income > 0 else 0.0,
        })
    if overspent > 0:
        slices.append({
            "label": "Overspent beyond income",
            "category": "Overspent beyond income",
            "amount": round(overspent, 2),
            "kind": "overspent",
            "percentage_of_income": round((overspent / income) * 100, 2) if income > 0 else 0.0,
        })
    return {
        "month": active_month,
        "base_label": "Total income",
        "base_amount": round(income, 2),
        "total_expenses": round(expenses, 2),
        "remaining_income": round(remaining, 2),
        "overspent": round(overspent, 2),
        "slices": slices,
        "note": "Income is treated as the base amount; only expenses and remaining income are shown as pie slices.",
    }


def recurring_payment_candidates(data, minimum_count=2):
    grouped = defaultdict(list)
    for transaction in data.get("transactions", []):
        amount = abs(safe_float(transaction.get("amount")))
        if amount <= 0:
            continue
        key = (str(transaction.get("description", "")).strip().lower(), str(transaction.get("category", "")).strip(), round(amount, -3))
        grouped[key].append(transaction)
    candidates = []
    for (description, category, amount), items in grouped.items():
        months = sorted({transaction_month(item) for item in items if transaction_month(item) != "unknown"})
        if len(months) >= minimum_count:
            candidates.append({
                "description": description.title(),
                "category": category,
                "amount": round(amount, 2),
                "count": len(items),
                "months": months[-6:],
                "confidence": round(min(0.95, 0.45 + len(months) * 0.12), 3),
                "reason": f"Similar payment appears in {len(months)} month(s). Consider making it recurring.",
            })
    return sorted(candidates, key=lambda item: (item["confidence"], item["count"]), reverse=True)[:10]


def budget_recommendations(data, months, active_month):
    recommendations = []
    historic_months = {key: value for key, value in months.items() if key not in {"unknown", active_month}}
    for category in data.get("categories", []):
        if category.get("type") != "expense":
            continue
        name = category.get("name", "")
        history = [month_data["categories"].get(name, 0.0) for month_data in historic_months.values()]
        history = [value for value in history if value > 0]
        current_budget = safe_float(category.get("budget"))
        if len(history) >= 2:
            average = statistics.mean(history)
            suggested = average * 1.10
            if current_budget <= 0 or abs(current_budget - suggested) / max(suggested, 1) > 0.35:
                recommendations.append({
                    "type": "budget_recommendation",
                    "category": name,
                    "title": f"Review {name} budget",
                    "message": f"Historical average is {average:,.0f}. A safer monthly budget is around {suggested:,.0f}.",
                    "current_budget": round(current_budget, 2),
                    "suggested_budget": round(suggested, 2),
                    "confidence": round(min(0.90, 0.45 + len(history) * 0.08), 3),
                })
    return sorted(recommendations, key=lambda item: item.get("confidence", 0), reverse=True)[:8]


def budget_cost_profile(data):
    country = str(data.get("living_country", "IR")).upper()[:2]
    profile = COUNTRY_COST_PROFILES.get(country, COUNTRY_COST_PROFILES["IR"])
    override = safe_float(data.get("inflation_rate"))
    annual_inflation = (override / 100) if override > 0 else safe_float(profile.get("annual_inflation_rate"))
    annual_inflation = max(0, min(3, annual_inflation))
    return {
        **profile,
        "code": country,
        "annual_inflation_rate": annual_inflation,
    }


def category_cost_factor(category_name, profile):
    category_key = str(category_name or "").strip().lower()
    monthly_inflation = safe_float(profile.get("annual_inflation_rate")) / 12
    is_essential = category_key in ESSENTIAL_BUDGET_CATEGORIES
    base = safe_float(profile.get("essential_multiplier" if is_essential else "flexible_multiplier")) or 1
    named = safe_float((profile.get("categories") or {}).get(category_name))
    return max(1, (named or base) + monthly_inflation)


def ai_budget_targets(data):
    transactions = data.get("transactions", [])
    months = aggregate_by_month(transactions)
    active_month = current_month_key(transactions)
    historic_months = {key: value for key, value in months.items() if key not in {"unknown", active_month}}
    current = months.get(active_month, {"categories": {}})
    cost_profile = budget_cost_profile(data)
    recommendations = []
    for category in data.get("categories", []):
        if category.get("type") != "expense" or safe_float(category.get("budget")) > 0:
            continue
        name = category.get("name", "")
        history = [month_data["categories"].get(name, 0.0) for month_data in historic_months.values()]
        history = [value for value in history if value > 0]
        current_spend = safe_float(current.get("categories", {}).get(name, 0.0))
        samples = history + ([current_spend] if current_spend > 0 else [])
        if not samples:
            continue
        baseline = statistics.median(samples) if len(samples) >= 3 else statistics.mean(samples)
        cost_factor = category_cost_factor(name, cost_profile)
        adjusted_baseline = baseline * cost_factor
        optimum = max(0, adjusted_baseline * 0.90)
        target = max(optimum, adjusted_baseline * 1.10)
        recommendations.append({
            "type": "ai_budget_target",
            "category": name,
            "title": f"AI budget for {name}",
            "message": f"Target budget {target:,.0f}; optimum spend {optimum:,.0f}. Adjusted for {cost_profile.get('name')} cost pressure.",
            "target_budget": round(target, 2),
            "optimum_budget": round(optimum, 2),
            "baseline_spend": round(baseline, 2),
            "cost_adjusted_baseline": round(adjusted_baseline, 2),
            "cost_factor": round(cost_factor, 4),
            "living_country": cost_profile.get("code"),
            "inflation_rate": round(safe_float(cost_profile.get("annual_inflation_rate")) * 100, 2),
            "sample_months": len(samples),
            "confidence": round(min(0.88, 0.40 + len(samples) * 0.12), 3),
        })
    return sorted(recommendations, key=lambda item: item.get("confidence", 0), reverse=True)


def apply_ai_budget_targets(data, recommendations):
    applied = []
    by_category = {item.get("category"): item for item in recommendations}
    for category in data.get("categories", []):
        if category.get("type") != "expense" or safe_float(category.get("budget")) > 0:
            continue
        recommendation = by_category.get(category.get("name"))
        if not recommendation:
            continue
        category["budget"] = recommendation["target_budget"]
        category["ai_budget"] = {
            "target_budget": recommendation["target_budget"],
            "optimum_budget": recommendation["optimum_budget"],
            "baseline_spend": recommendation["baseline_spend"],
            "confidence": recommendation["confidence"],
            "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        }
        applied.append({"category": category.get("name"), **category["ai_budget"]})
    return applied


def merchant_insights(data):
    merchants = defaultdict(lambda: {"count": 0, "spent": 0.0, "categories": Counter()})
    for transaction in data.get("transactions", []):
        amount = safe_float(transaction.get("amount"))
        if amount >= 0:
            continue
        tokens = tokenise(transaction.get("description", ""))
        merchant = tokens[0].title() if tokens else str(transaction.get("description", "Miscellaneous")).strip().title()
        merchants[merchant]["count"] += 1
        merchants[merchant]["spent"] += abs(amount)
        merchants[merchant]["categories"][transaction.get("category", "Miscellaneous")] += 1
    output = []
    for merchant, info in merchants.items():
        if info["count"] < 2:
            continue
        category = info["categories"].most_common(1)[0][0]
        output.append({
            "merchant": merchant,
            "count": info["count"],
            "spent": round(info["spent"], 2),
            "dominant_category": category,
            "message": f"{merchant} appears {info['count']} times with total spending of {info['spent']:,.0f}.",
        })
    return sorted(output, key=lambda item: item["spent"], reverse=True)[:10]


def spending_velocity(data, current, active_month):
    try:
        year, month = map(int, active_month.split("-"))
        today = dt.date.today()
        if year == today.year and month == today.month:
            elapsed = max(today.day, 1)
            days = calendar.monthrange(year, month)[1]
        else:
            days = calendar.monthrange(year, month)[1]
            elapsed = days
    except Exception:
        elapsed, days = 1, 30
    daily_expense = safe_float(current.get("expenses")) / max(elapsed, 1)
    daily_income = safe_float(current.get("income")) / max(elapsed, 1)
    return {
        "elapsed_days": elapsed,
        "month_days": days,
        "daily_expense_rate": round(daily_expense, 2),
        "daily_income_rate": round(daily_income, 2),
        "remaining_days": max(days - elapsed, 0),
        "projected_extra_expenses": round(daily_expense * max(days - elapsed, 0), 2),
    }


def financial_health_score(summary, warnings, advice, goals, data_quality):
    score = 100.0
    savings_rate = safe_float(summary.get("savings_rate"))
    if savings_rate < 0:
        score -= 35
    elif savings_rate < 10:
        score -= 20
    elif savings_rate < 20:
        score -= 10
    score -= min(25, len(warnings) * 7)
    score -= min(25, len([item for item in advice if item.get("severity") == "danger"]) * 12)
    score -= min(15, len([goal for goal in goals if goal.get("status") == "behind"]) * 8)
    score -= min(10, data_quality.get("summary", {}).get("duplicate_groups", 0) * 2)
    score = max(0, min(100, round(score)))
    if score >= 85:
        label = "Excellent"
    elif score >= 70:
        label = "Good"
    elif score >= 50:
        label = "Watch"
    else:
        label = "High risk"
    return {"score": score, "label": label}


def cashflow_calendar(data, month=None):
    active_month = month or current_month_key(data.get("transactions", []))
    events = []
    for recurring in data.get("recurring_transactions", []):
        if not recurring.get("active", True):
            continue
        try:
            year, month_no = map(int, active_month.split("-"))
            day = min(int(recurring.get("day", 1) or 1), calendar.monthrange(year, month_no)[1])
            date_value = dt.date(year, month_no, day).isoformat()
        except Exception:
            date_value = dt.date.today().isoformat()
        events.append({
            "date": date_value,
            "description": recurring.get("description", ""),
            "category": recurring.get("category", ""),
            "amount": round(safe_float(recurring.get("amount")), 2),
            "type": "recurring",
        })
    return sorted(events, key=lambda item: item.get("date", ""))[:20]

def generate_ai_report(data):
    transactions = data.get("transactions", [])
    months = aggregate_by_month(transactions)
    today = dt.date.today()
    active_month = f"{today.year}-{today.month:02d}"
    current = months.get(active_month, {"income": 0.0, "expenses": 0.0, "net": 0.0, "categories": defaultdict(float)})
    summary = generate_summary(data, current)
    warnings = detect_anomalies(data, months, active_month)
    advice = budget_advice(data, current)
    goals = goal_coaching(data, current)
    forecast = forecast_month(data, months, active_month)
    rule_suggestions = suggest_category_rules(data)
    data_quality = build_data_quality_report(data)
    pie_model = build_income_expense_pie(data, active_month)
    recurring_candidates = recurring_payment_candidates(data)
    budget_recs = budget_recommendations(data, months, active_month)
    budget_targets = ai_budget_targets(data)
    merchants = merchant_insights(data)
    velocity = spending_velocity(data, current, active_month)

    opportunities = []
    if current.get("categories"):
        highest = max(current["categories"].items(), key=lambda item: item[1])
        opportunities.append({
            "type": "largest_category",
            "title": f"Largest spending category: {highest[0]}",
            "message": f"{highest[0]} is your largest expense this month at {highest[1]:,.0f}.",
            "category": highest[0],
            "amount": round(highest[1], 2),
        })
    if forecast["projected_savings_rate"] < 20:
        opportunities.append({
            "type": "savings_opportunity",
            "title": "Savings rate needs attention",
            "message": f"Projected savings rate is {forecast['projected_savings_rate']:.1f}%. Review flexible categories first.",
        })

    top_categories = top_spending_categories(current)
    action_queue = recommend_next_actions_from_parts(summary, warnings, advice + budget_recs, goals, forecast, rule_suggestions, top_categories)
    health_score = financial_health_score(summary, warnings, advice, goals, data_quality)
    executive_summary = build_executive_summary(summary, warnings, advice, goals, forecast, top_categories)

    return {
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "month": active_month,
        "title": "AI Financial Report",
        "executive_summary": executive_summary,
        "summary": summary,
        "health_score": health_score,
        "pie_model": pie_model,
        "data_quality": data_quality,
        "spending_velocity": velocity,
        "merchant_insights": merchants,
        "budget_recommendations": budget_recs,
        "budget_targets": budget_targets,
        "recurring_candidates": recurring_candidates,
        "cashflow_calendar": cashflow_calendar(data, active_month),
        "sections": {
            "overview": {"title": "Overview", "items": [summary, health_score, velocity]},
            "coach": {"title": "Coaching", "items": goals + opportunities + advice + budget_recs + budget_targets},
            "risks": {"title": "Risks & warnings", "items": warnings + advice + data_quality.get("duplicates", [])[:3]},
            "forecast": {"title": "Forecast", "items": [forecast]},
            "automation": {"title": "Automation suggestions", "items": rule_suggestions + recurring_candidates},
        },
        "warnings": warnings,
        "opportunities": opportunities,
        "budget_advice": advice,
        "goals": goals,
        "forecast": forecast,
        "top_categories": top_categories,
        "rule_suggestions": rule_suggestions,
        "action_queue": action_queue,
        "priority_brief": build_priority_brief(summary, health_score, forecast, velocity, action_queue, top_categories),
        "ui_hint": {
            "preferred_widget": "ai_report",
            "merged_widgets": ["report", "insights", "goals", "ai", "ai_coaching"],
            "primary_endpoint": "/api/ai/report",
        },
        "ai_engine": {
            "name": "Local Budget Intelligence",
            "privacy": "offline",
            "methods": [
                "manual rules",
                "history similarity",
                "keyword hints",
                "monthly statistics",
                "linear forecasting",
                "rule suggestion mining",
                "free-text transaction parsing",
                "duplicate detection",
                "spending velocity",
                "budget recommendation engine",
                "recurring payment discovery",
                "income-base expense pie modelling",
            ],
        },
    }


# Backwards-compatible function name for older code/tests.
def generate_ai_insights(data):
    return generate_ai_report(data)



def build_executive_summary(summary, warnings, advice, goals, forecast, top_categories):
    lines = [summary.get("text", "")]
    if forecast:
        lines.append(
            f"Projected end-of-month savings rate is {forecast.get('projected_savings_rate', 0):.1f}% "
            f"with projected net cash flow of {forecast.get('projected_net', 0):,.0f}."
        )
    if top_categories:
        top = top_categories[0]
        lines.append(f"Your largest spending category is {top['category']} at {top['amount']:,.0f}.")
    if warnings:
        lines.append(f"There are {len(warnings)} unusual spending warning(s) to review.")
    if advice:
        lines.append(f"There are {len(advice)} budget coaching item(s) needing attention.")
    behind_goals = [goal for goal in goals if goal.get("status") == "behind"]
    if behind_goals:
        lines.append(f"{len(behind_goals)} goal(s) are currently behind target.")
    return " ".join(line for line in lines if line)


def build_priority_brief(summary, health_score, forecast, velocity, actions, top_categories):
    focus = actions[0].get("title") if actions else "Keep tracking transactions this month"
    runway = safe_float(forecast.get("projected_net")) if forecast else safe_float(summary.get("net"))
    top_category = top_categories[0].get("category") if top_categories else ""
    return {
        "headline": f"{health_score.get('label', 'Good')} month: focus on {focus}",
        "cash_position": "positive" if runway >= 0 else "negative",
        "projected_net": round(runway, 2),
        "daily_expense_rate": velocity.get("daily_expense_rate", 0),
        "remaining_days": velocity.get("remaining_days", 0),
        "focus_category": top_category,
        "top_action": focus,
    }


def priority_score(item):
    severity = item.get("severity", "")
    if severity == "danger":
        return 100
    if severity == "warning":
        return 80
    if item.get("status") == "behind":
        return 70
    if item.get("type") == "savings_opportunity":
        return 60
    if item.get("type") == "rule_suggestion":
        return 40
    return 30


def recommend_next_actions_from_parts(summary, warnings, advice, goals, forecast, rule_suggestions, top_categories):
    actions = []
    for item in warnings + advice:
        actions.append({
            "priority": priority_score(item),
            "type": item.get("type", "review"),
            "title": item.get("title", "Review item"),
            "message": item.get("message", ""),
            "impact": action_impact(item),
            "next_step": action_next_step(item, top_categories),
            "category": item.get("category", ""),
            "source": "ai_report",
        })
    for goal in goals:
        if goal.get("status") == "behind":
            actions.append({
                "priority": priority_score(goal),
                "type": "goal_coaching",
                "title": goal.get("title", "Goal needs attention"),
                "message": goal.get("message", ""),
                "impact": action_impact(goal),
                "next_step": action_next_step(goal, top_categories),
                "source": "goals",
            })
    if forecast.get("projected_savings_rate", 0) < summary.get("savings_rate", 0):
        actions.append({
            "priority": 55,
            "type": "forecast_review",
            "title": "Forecast is weaker than current position",
            "message": "Your month-end projection is weaker than your current savings rate. Review recent variable expenses.",
            "impact": round(abs(safe_float(forecast.get("projected_net"))), 2),
            "next_step": top_category_step(top_categories),
            "source": "forecast",
        })
    if top_categories:
        top = top_categories[0]
        actions.append({
            "priority": 50,
            "type": "top_category_review",
            "title": f"Trim the largest flexible category: {top.get('category')}",
            "message": f"{top.get('category')} is the largest current-month expense at {top.get('amount', 0):,.0f}. A 10% reduction would free about {safe_float(top.get('amount')) * 0.10:,.0f}.",
            "impact": round(safe_float(top.get("amount")) * 0.10, 2),
            "next_step": f"Set a soft cap for {top.get('category')} and review the last few transactions in that category.",
            "source": "top_categories",
        })
    for suggestion in rule_suggestions[:3]:
        actions.append({
            "priority": 35,
            "type": "automation",
            "title": f"Create rule for '{suggestion.get('contains')}'",
            "message": suggestion.get("reason", ""),
            "impact": "",
            "next_step": f"Apply this rule so future '{suggestion.get('contains')}' transactions are categorized as {suggestion.get('category')}.",
            "source": "rule_suggestions",
            "payload": {"contains": suggestion.get("contains"), "category": suggestion.get("category")},
            "endpoint": "/api/ai/apply-rule-suggestion",
        })
    return sorted(actions, key=lambda item: item.get("priority", 0), reverse=True)[:10]


def action_impact(item):
    if "spent" in item and "budget" in item:
        return round(max(safe_float(item.get("spent")) - safe_float(item.get("budget")), 0), 2)
    if "current" in item and "average" in item:
        return round(max(safe_float(item.get("current")) - safe_float(item.get("average")), 0), 2)
    if "target_budget" in item and "optimum_budget" in item:
        return round(max(safe_float(item.get("target_budget")) - safe_float(item.get("optimum_budget")), 0), 2)
    return ""


def action_next_step(item, top_categories):
    item_type = item.get("type", "")
    category = item.get("category", "")
    if item_type == "budget_overrun":
        return f"Pause optional {category} spending and move only unavoidable items through this category until next month."
    if item_type == "budget_pace":
        return f"Keep {category} below the daily pace for the rest of the month; check recurring or one-off charges first."
    if item_type == "anomaly":
        return f"Open recent {category} transactions and confirm whether the spike was planned, duplicated, or miscategorized."
    if item.get("status") == "behind":
        return top_category_step(top_categories)
    if item_type == "ai_budget_target":
        return f"Use the target as the monthly ceiling and the optimum value as the stretch goal for {category}."
    return top_category_step(top_categories)


def top_category_step(top_categories):
    if not top_categories:
        return "Review flexible expenses and choose one category to cap for the rest of the month."
    top = top_categories[0]
    return f"Start with {top.get('category')}; it has the largest current-month effect."


def recommend_next_actions(data):
    report = generate_ai_report(data)
    return report.get("action_queue", [])


def explain_transaction(data, transaction):
    amount = safe_float(transaction.get("amount"))
    category = transaction.get("category", "Miscellaneous")
    ai = transaction.get("ai", {})
    direction = "income" if amount >= 0 else "expense"
    explanation = {
        "title": f"{category} {direction}",
        "category": category,
        "amount": round(amount, 2),
        "confidence": ai.get("confidence", 0),
        "method": ai.get("method", "unknown"),
        "reason": ai.get("reason", ""),
        "message": f"This looks like a {direction} in {category}. AI confidence is {float(ai.get('confidence', 0)) * 100:.0f}%.",
    }
    if amount < 0:
        months = aggregate_by_month(data.get("transactions", []))
        active_month = current_month_key(data.get("transactions", []))
        current_spend = months.get(active_month, {}).get("categories", {}).get(category, 0.0)
        explanation["monthly_category_total"] = round(current_spend + abs(amount), 2)
        budget = next((safe_float(cat.get("budget")) for cat in data.get("categories", []) if cat.get("name") == category), 0.0)
        if budget > 0:
            explanation["budget"] = round(budget, 2)
            explanation["budget_after_transaction_pct"] = round(((current_spend + abs(amount)) / budget) * 100, 2)
    return explanation


def ai_import_preview(data, imported):
    existing_keys = {
        (
            str(transaction.get("date", ""))[:10],
            str(transaction.get("description", "")).strip().lower(),
            round(safe_float(transaction.get("amount")), 2),
        )
        for transaction in data.get("transactions", [])
    }
    preview = []
    for raw in imported:
        predicted = apply_smart_category(data, dict(raw))
        cleaned = clean_transaction(predicted)
        key = (
            cleaned.get("date", "")[:10],
            cleaned.get("description", "").strip().lower(),
            round(safe_float(cleaned.get("amount")), 2),
        )
        cleaned["ai_import"] = {
            "duplicate_possible": key in existing_keys,
            "confidence": cleaned.get("ai", {}).get("confidence", 0),
            "recommended_action": "review_duplicate" if key in existing_keys else "import",
        }
        preview.append(cleaned)
    return preview


def upsert_recurring(data, incoming):
    item_id = str(incoming.get("id") or f"rt-{uuid.uuid4().hex[:10]}")
    item = {
        "id": item_id,
        "description": str(incoming.get("description", "")).strip(),
        "category": str(incoming.get("category", "")).strip(),
        "amount": abs(float(incoming.get("amount", 0) or 0)),
        "frequency": str(incoming.get("frequency", "monthly")).lower(),
        "start_date": str(incoming.get("start_date", dt.date.today().isoformat())),
        "day": max(1, min(31, int(float(incoming.get("day", 1) or 1)))),
        "active": bool(incoming.get("active", True)),
    }
    if item["frequency"] not in {"monthly"}:
        item["frequency"] = "monthly"
    item["amount"] = signed_amount_for_category(data, item["category"], item["amount"])
    replace_by_id(data["recurring_transactions"], item)


def upsert_rule(data, incoming):
    rule = {
        "id": str(incoming.get("id") or f"rule-{uuid.uuid4().hex[:10]}"),
        "contains": str(incoming.get("contains", "")).strip(),
        "category": str(incoming.get("category", "")).strip(),
    }
    if rule["contains"] and rule["category"]:
        replace_by_id(data["category_rules"], rule)


def upsert_goal(data, incoming):
    goal = {
        "id": str(incoming.get("id") or f"goal-{uuid.uuid4().hex[:10]}"),
        "name": str(incoming.get("name", "")).strip(),
        "type": str(incoming.get("type", "savings_rate")).lower(),
        "category": str(incoming.get("category", "")).strip(),
        "target": abs(float(incoming.get("target", 0) or 0)),
    }
    if goal["type"] not in {"savings_rate", "category_spend"}:
        goal["type"] = "savings_rate"
    if goal["name"] and goal["target"]:
        replace_by_id(data["goals"], goal)


def upsert_investment(data, incoming):
    investment = {
        "id": str(incoming.get("id") or f"inv-{uuid.uuid4().hex[:10]}"),
        "name": str(incoming.get("name", "")).strip(),
        "asset_type": str(incoming.get("asset_type", "gold_18k_gram")).strip(),
        "symbol": str(incoming.get("symbol", "")).strip().lower(),
        "quantity": abs(float(incoming.get("quantity", 0) or 0)),
        "purchase_price": abs(float(incoming.get("purchase_price", 0) or 0)),
        "manual_price": abs(float(incoming.get("manual_price", 0) or 0)),
        "notes": str(incoming.get("notes", "")).strip(),
    }
    if not investment["symbol"]:
        investment["symbol"] = MARKET_SYMBOLS.get(investment["asset_type"], investment["asset_type"])
    if incoming.get("use_market_price") and investment["manual_price"] <= 0:
        rates = fetch_market_rates(data)
        live_price = market_price_for_investment(investment, rates)
        if live_price > 0:
            investment["manual_price"] = round(live_price, 2)
            investment["price_updated_at"] = rates.get("fetched_at", dt.datetime.now().isoformat(timespec="seconds"))
    if investment["name"] and investment["quantity"] > 0:
        data.setdefault("investments", [])
        replace_by_id(data["investments"], investment)


def update_investment_prices(data):
    rates = fetch_market_rates(data)
    updated = []
    skipped = []
    if rates.get("status") != "ok":
        return {"updated": updated, "skipped": skipped, "rates": rates}
    fetched_at = rates.get("fetched_at") or dt.datetime.now().isoformat(timespec="seconds")
    for item in data.get("investments", []):
        live_price = market_price_for_investment(item, rates)
        if live_price > 0:
            item["manual_price"] = round(live_price, 2)
            item["price_updated_at"] = fetched_at
            updated.append({"id": item.get("id"), "name": item.get("name"), "price": item["manual_price"]})
        else:
            skipped.append({"id": item.get("id"), "name": item.get("name")})
    return {"updated": updated, "skipped": skipped, "rates": rates}


def market_price_for_investment(item, rates):
    symbol = market_symbol_for_asset(item.get("asset_type", ""), rates.get("provider", "navasan"), item.get("symbol", ""))
    return safe_float(rates.get("items", {}).get(symbol, {}).get("price_irr"))


def fetch_market_rates(data):
    provider = data.get("market_provider", {})
    provider_name = str(provider.get("name", "navasan")).lower()
    if provider_name == "tgju":
        return fetch_tgju_rates(provider, data)
    if provider_name == "brsapi":
        return fetch_brsapi_rates(provider)
    return fetch_navasan_rates(provider)


def fetch_tgju_rates(provider, data=None):
    items = {}
    errors = []
    wanted_assets = set(TGJU_DEFAULT_ASSETS)
    for item in (data or {}).get("investments", []):
        wanted_assets.add(str(item.get("asset_type", "")).strip())
    symbols = [
        (asset_type, slug, MARKET_SYMBOLS.get(asset_type, slug))
        for asset_type, slug in TGJU_SYMBOLS.items()
        if asset_type in wanted_assets
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, len(symbols))) as executor:
        futures = {
            executor.submit(fetch_tgju_profile_price, slug): (asset_type, slug, symbol)
            for asset_type, slug, symbol in symbols
        }
        done, pending = concurrent.futures.wait(futures, timeout=7)
    for future in done:
        asset_type, slug, symbol = futures[future]
        try:
            item = future.result()
        except Exception as error:
            errors.append(f"{slug}: {error}")
            continue
        if item.get("price_irr", 0) > 0:
            items[symbol] = item
    for future in pending:
        asset_type, slug, symbol = futures[future]
        future.cancel()
        errors.append(f"{slug}: timeout")
    for asset_type, slug, symbol in symbols:
        if symbol in items:
            continue
        symbol = MARKET_SYMBOLS.get(asset_type, slug)
        errors.append(f"{slug}: no price")
    status = "ok" if items else "error"
    result = {
        "provider": "tgju",
        "status": status,
        "items": items,
        "fetched_at": dt.datetime.now().isoformat(timespec="seconds") if items else "",
        "source": "website",
    }
    if errors:
        result["message"] = "; ".join(errors[:3])
    return result


def fetch_tgju_profile_price(slug):
    url = TGJU_PROFILE_URL.format(slug=slug)
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 BudgetTracker/1.0"})
    with urlopen(request, timeout=3) as response:
        html = response.read().decode("utf-8", errors="ignore")
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    price = first_tgju_price(text)
    if price <= 0:
        raise ValueError("price not found")
    return {
        "price_irr": price,
        "source_value": price,
        "unit": "rial",
        "source_url": url,
    }


def first_tgju_price(text):
    patterns = [
        r"نرخ فعلی\s*[:：]?\s*([0-9,]+)",
        r"قیمت\s+[^\s]{0,30}\s+روز گذشته برابر با\s+([0-9,]+)\s+ریال",
        r"پایانی\s+درصد تغییر\s+میزان تغییر\s+\S+\s+[0-9,]+\s+[0-9,]+\s+[0-9,]+\s+([0-9,]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            value = safe_float(match.group(1).replace(",", ""))
            if value > 0:
                return value
    return 0


def fetch_navasan_rates(provider):
    api_key = str(provider.get("api_key", "")).strip()
    if not api_key:
        return {"provider": "navasan", "status": "missing_api_key", "items": {}, "fetched_at": ""}
    try:
        url = f"{NAVASAN_LATEST_URL}?{urlencode({'api_key': api_key})}"
        with urlopen(url, timeout=8) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        return {"provider": "navasan", "status": "error", "message": str(error), "items": {}, "fetched_at": ""}
    items = {}
    for key, payload in raw.items():
        value = safe_float(payload.get("value") if isinstance(payload, dict) else payload)
        if value <= 0:
            continue
        # Navasan market prices are normally in toman; app default money is IRR.
        items[key] = {
            "price_irr": value * 10,
            "source_value": value,
            "date": payload.get("date", "") if isinstance(payload, dict) else "",
            "timestamp": payload.get("timestamp", "") if isinstance(payload, dict) else "",
        }
    return {
        "provider": "navasan",
        "status": "ok",
        "items": items,
        "fetched_at": dt.datetime.now().isoformat(timespec="seconds"),
    }


def fetch_brsapi_rates(provider):
    api_key = str(provider.get("api_key", "")).strip()
    if not api_key:
        return {"provider": "brsapi", "status": "missing_api_key", "items": {}, "fetched_at": ""}
    try:
        url = f"{BRSAPI_GOLD_CURRENCY_URL}?{urlencode({'key': api_key})}"
        with urlopen(url, timeout=8) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        return {"provider": "brsapi", "status": "error", "message": str(error), "items": {}, "fetched_at": ""}
    rows = []
    if isinstance(raw, dict):
        for section in ("gold", "currency", "cryptocurrency"):
            rows.extend(raw.get(section, []) or [])
    items = {}
    usd_price_irr = 0
    for row in rows:
        if not isinstance(row, dict):
            continue
        symbol = str(row.get("symbol", "")).strip()
        price = safe_float(row.get("price"))
        unit = str(row.get("unit", "")).strip()
        if not symbol or price <= 0:
            continue
        if unit == "تومان":
            price_irr = price * 10
        elif unit == "ریال":
            price_irr = price
        else:
            price_irr = price
        items[symbol] = {
            "price_irr": price_irr,
            "source_value": price,
            "unit": unit,
            "date": row.get("date", ""),
            "timestamp": row.get("time_unix", ""),
            "name": row.get("name", ""),
        }
        if symbol == "USD":
            usd_price_irr = price_irr
    if usd_price_irr > 0:
        for row in rows:
            symbol = str(row.get("symbol", "")).strip()
            unit = str(row.get("unit", "")).strip()
            if unit != "دلار" or symbol not in items:
                continue
            items[symbol]["price_irr"] = safe_float(row.get("price")) * usd_price_irr
    return {
        "provider": "brsapi",
        "status": "ok",
        "items": items,
        "fetched_at": dt.datetime.now().isoformat(timespec="seconds"),
    }


def investment_portfolio(data, rates=None):
    rates = rates or {"items": {}}
    target_currency = data.get("currency", "IRR")
    holdings = []
    total_cost_irr = 0.0
    total_value_irr = 0.0
    target_rate = currency_rate_irr(rates, target_currency)
    for item in data.get("investments", []):
        symbol = market_symbol_for_asset(item.get("asset_type", ""), rates.get("provider", "navasan"), item.get("symbol", ""))
        live_price = safe_float(rates.get("items", {}).get(symbol, {}).get("price_irr"))
        manual_price = safe_float(item.get("manual_price"))
        purchase_price = safe_float(item.get("purchase_price"))
        quantity = safe_float(item.get("quantity"))
        current_price = live_price or manual_price or purchase_price
        cost = purchase_price * quantity
        value = current_price * quantity
        total_cost_irr += cost
        total_value_irr += value
        holdings.append({
            **item,
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "current_value": round(convert_irr(value, target_currency, target_rate), 2),
            "cost_value": round(convert_irr(cost, target_currency, target_rate), 2),
            "gain_loss": round(convert_irr(value - cost, target_currency, target_rate), 2),
            "price_source": "live" if live_price else "manual",
        })
    return {
        "currency": target_currency,
        "total_cost": round(convert_irr(total_cost_irr, target_currency, target_rate), 2),
        "total_value": round(convert_irr(total_value_irr, target_currency, target_rate), 2),
        "gain_loss": round(convert_irr(total_value_irr - total_cost_irr, target_currency, target_rate), 2),
        "holdings": holdings,
    }


def currency_rate_irr(rates, currency):
    if currency == "USD":
        return safe_float(rate_item(rates, "usd").get("price_irr"))
    if currency == "EUR":
        return safe_float(rate_item(rates, "eur").get("price_irr"))
    if currency == "TRY":
        return safe_float(rate_item(rates, "try").get("price_irr"))
    return 0


def market_symbol_for_asset(asset_type, provider_name="navasan", fallback=""):
    symbols = BRSAPI_SYMBOLS if provider_name == "brsapi" else MARKET_SYMBOLS
    return symbols.get(asset_type, fallback or asset_type)


def rate_item(rates, asset_type):
    symbol = market_symbol_for_asset(asset_type, rates.get("provider", "navasan"))
    return rates.get("items", {}).get(symbol, {})


def convert_irr(value, currency, target_rate=0):
    if currency == "IRR":
        return value
    if target_rate > 0:
        return value / target_rate
    return value


def replace_by_id(items, incoming):
    for index, item in enumerate(items):
        if item.get("id") == incoming.get("id"):
            items[index] = incoming
            return
    items.append(incoming)


def signed_amount_for_category(data, category_name, amount):
    category = next(
        (item for item in data.get("categories", []) if item.get("name", "").lower() == category_name.lower()),
        None,
    )
    amount = abs(float(amount or 0))
    return amount if category and category.get("type") == "income" else -amount


def apply_recurring_due(data, force=False):
    created = False
    today = dt.date.today()
    existing_keys = {
        (transaction.get("source_recurring_id"), transaction.get("period"))
        for transaction in data.get("transactions", [])
    }
    for recurring in data.get("recurring_transactions", []):
        if not recurring.get("active", True):
            continue
        try:
            start = dt.date.fromisoformat(recurring.get("start_date", today.isoformat()))
        except ValueError:
            start = today
        cursor = dt.date(start.year, start.month, 1)
        while cursor <= today:
            day = min(int(recurring.get("day", start.day) or start.day), calendar.monthrange(cursor.year, cursor.month)[1])
            transaction_date = dt.date(cursor.year, cursor.month, day)
            period = f"{cursor.year}-{cursor.month:02d}"
            key = (recurring.get("id"), period)
            if transaction_date <= today and key not in existing_keys:
                data["transactions"].append(clean_transaction({
                    "id": f"t-{uuid.uuid4().hex[:10]}",
                    "date": transaction_date.isoformat(),
                    "description": recurring.get("description", ""),
                    "category": recurring.get("category", ""),
                    "amount": recurring.get("amount", 0),
                    "time": recurring.get("time", "09:00"),
                    "source_recurring_id": recurring.get("id"),
                    "period": period,
                }))
                data["transactions"][-1]["source_recurring_id"] = recurring.get("id")
                data["transactions"][-1]["period"] = period
                existing_keys.add(key)
                created = True
            cursor = add_month(cursor)
        if force and not created:
            continue
    return created


def add_month(value):
    year = value.year + (value.month // 12)
    month = 1 if value.month == 12 else value.month + 1
    return dt.date(year, month, 1)


def upsert_category(data, incoming):
    name = str(incoming.get("name", "")).strip()
    if not name:
        return

    budget = float(incoming.get("budget", 0) or 0)
    category_type = str(incoming.get("type", "expense")).lower()
    if category_type not in {"income", "expense"}:
        category_type = "expense"
    if category_type == "income":
        budget = 0
    for category in data["categories"]:
        if category.get("name", "").lower() == name.lower():
            category["name"] = name
            category["budget"] = budget
            category["type"] = category_type
            return

    data["categories"].append({"name": name, "budget": budget, "type": category_type})


def normalize_categories(categories, transactions):
    positive_categories = {
        transaction.get("category")
        for transaction in transactions
        if float(transaction.get("amount", 0) or 0) > 0
    }
    negative_categories = {
        transaction.get("category")
        for transaction in transactions
        if float(transaction.get("amount", 0) or 0) < 0
    }
    for category in categories:
        if category.get("type") not in {"income", "expense"}:
            name = category.get("name")
            category["type"] = "income" if name in positive_categories and name not in negative_categories else "expense"


def edge_paths():
    return [
        Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
        Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    ]


def launch_desktop_window(url):
    try:
        import webview

        try:
            webview.create_window(
                "Budget Dashboard",
                url,
                width=1280,
                height=840,
                min_size=(1120, 720),
            )
        except TypeError:
            webview.create_window("Budget Dashboard", url, width=1280, height=840)
        webview.start()
        return
    except ImportError:
        pass

    command = ["msedge", f"--app={url}", "--window-size=1280,840"]
    for path in edge_paths():
        if path.exists():
            command[0] = str(path)
            break

    try:
        subprocess.Popen(command)
        while True:
            time.sleep(1)
    except OSError:
        webbrowser.open(url)
        while True:
            time.sleep(1)


def run_desktop_app():
    server = ThreadingHTTPServer((HOST, PORT), BudgetHandler)
    url = f"http://{HOST}:{server.server_port}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    print(f"Budget desktop app running at {url}")

    try:
        launch_desktop_window(url)
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown()


if __name__ == "__main__":
    if "--server" in sys.argv:
        server = ThreadingHTTPServer((HOST, 8000), BudgetHandler)
        print(f"Budget app running at http://{HOST}:8000")
        server.serve_forever()
    else:
        run_desktop_app()
