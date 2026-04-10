use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_users_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    role TEXT NOT NULL DEFAULT 'viewer',
                    status TEXT NOT NULL DEFAULT 'active',
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_settings_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_auth_columns_to_users",
            sql: r#"
                ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
                ALTER TABLE users ADD COLUMN salt TEXT NOT NULL DEFAULT '';
                ALTER TABLE users ADD COLUMN first_login INTEGER NOT NULL DEFAULT 1;
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_login_attempts_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS login_attempts (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    success INTEGER NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now'))
                );
                CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created
                ON login_attempts(email, created_at);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_sessions_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS sessions (
                    user_id TEXT NOT NULL,
                    token TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_image_path_to_users",
            sql: r#"
                ALTER TABLE users ADD COLUMN image_path TEXT;
            "#,
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:app.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
