import sqlite3
import os
import bcrypt

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'meetmanager.db')

USERS = [
    ("admin", "Admin123!", "Администратор Системы"),
    ("ivanov", "User123!", "Иванов Иван Иванович"),
    ("petrova", "User123!", "Петрова Анна Сергеевна"),
    ("sidorov", "User123!", "Сидоров Пётр Александрович"),
]


def seed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout = 5000")
    cursor.execute("PRAGMA foreign_keys = ON")

    for username, password, full_name in USERS:
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt(rounds=12),
        ).decode("utf-8")
        cursor.execute(
            "INSERT OR IGNORE INTO users (username, password_hash, full_name, is_admin) VALUES (?, ?, ?, ?)",
            (username, password_hash, full_name, 1 if username == "admin" else 0),
        )

    cursor.execute("UPDATE users SET is_admin = 1 WHERE username = 'admin'")

    conn.commit()
    count = cursor.execute("SELECT count(*) FROM users").fetchone()[0]
    conn.close()
    print(f"Seed complete. Users in database: {count}")


if __name__ == "__main__":
    seed()
