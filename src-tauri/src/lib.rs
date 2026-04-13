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
        Migration {
            version: 7,
            description: "school_management_schema",
            sql: r#"
                -- Add capabilities to users
                ALTER TABLE users ADD COLUMN capabilities TEXT DEFAULT '[]';

                -- Create Students Table
                CREATE TABLE IF NOT EXISTS students (
                    id TEXT PRIMARY KEY,
                    admission_no TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    gender TEXT CHECK(gender IN ('M', 'F')) NOT NULL,
                    date_of_birth TEXT,
                    current_class TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'active',
                    image_path TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                );

                -- Create Subjects Table
                CREATE TABLE IF NOT EXISTS subjects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    code TEXT UNIQUE
                );

                -- Create Teacher Assignments Table
                CREATE TABLE IF NOT EXISTS teacher_assignments (
                    id TEXT PRIMARY KEY,
                    teacher_id TEXT NOT NULL,
                    class_name TEXT NOT NULL,
                    subject_id TEXT NOT NULL,
                    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                    UNIQUE(teacher_id, class_name, subject_id)
                );

                -- Create Attendance Table
                CREATE TABLE IF NOT EXISTS attendance (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    class_name TEXT NOT NULL,
                    date TEXT NOT NULL DEFAULT (date('now')),
                    status TEXT CHECK(status IN ('present', 'absent', 'late', 'excused')) NOT NULL,
                    remarks TEXT,
                    recorded_by TEXT NOT NULL,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (recorded_by) REFERENCES users(id)
                );

                -- Create Marks Table
                CREATE TABLE IF NOT EXISTS marks (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    subject_id TEXT NOT NULL,
                    class_name TEXT NOT NULL,
                    term INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    opening_mark INTEGER DEFAULT 0,
                    mid_term_mark INTEGER DEFAULT 0,
                    end_term_mark INTEGER DEFAULT 0,
                    total_mark INTEGER AS (opening_mark + mid_term_mark + end_term_mark),
                    grade TEXT,
                    remarks TEXT,
                    recorded_by TEXT NOT NULL,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                    FOREIGN KEY (recorded_by) REFERENCES users(id),
                    UNIQUE(student_id, subject_id, class_name, term, year)
                );

                -- Create Payments Table
                CREATE TABLE IF NOT EXISTS payments (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    payment_date TEXT NOT NULL DEFAULT (date('now')),
                    payment_method TEXT NOT NULL,
                    reference_no TEXT,
                    category TEXT NOT NULL,
                    recorded_by TEXT NOT NULL,
                    remarks TEXT,
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (recorded_by) REFERENCES users(id)
                );

                -- Indexes for performance
                CREATE INDEX IF NOT EXISTS idx_students_class ON students(current_class);
                CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
                CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
                CREATE INDEX IF NOT EXISTS idx_marks_student_subject ON marks(student_id, subject_id);
                CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
                CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "create_classes_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS classes (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    level TEXT NOT NULL
                );
                
                -- Add class_id to students
                ALTER TABLE students ADD COLUMN class_id TEXT REFERENCES classes(id);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "add_guardian_and_contact_to_students",
            sql: r#"
                ALTER TABLE students ADD COLUMN guardian_name TEXT;
                ALTER TABLE students ADD COLUMN guardian_phone TEXT;
                ALTER TABLE students ADD COLUMN guardian_email TEXT;
                ALTER TABLE students ADD COLUMN guardian_relation TEXT;
                ALTER TABLE students ADD COLUMN student_phone TEXT;
                ALTER TABLE students ADD COLUMN student_email TEXT;
                ALTER TABLE students ADD COLUMN address TEXT;
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "create_fee_ledger_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS student_fees (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    category TEXT NOT NULL,
                    amount_due INTEGER NOT NULL DEFAULT 0,
                    amount_paid INTEGER NOT NULL DEFAULT 0,
                    term INTEGER DEFAULT 1,
                    year INTEGER NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    UNIQUE(student_id, category, term, year)
                );
                
                CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "create_timetable_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS timetable (
                    id TEXT PRIMARY KEY,
                    class_name TEXT NOT NULL,
                    day_of_week INTEGER NOT NULL,
                    period INTEGER NOT NULL,
                    subject_id TEXT NOT NULL,
                    teacher_id TEXT,
                    start_time TEXT,
                    end_time TEXT,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (class_name) REFERENCES classes(name) ON DELETE CASCADE,
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
                    UNIQUE(class_name, day_of_week, period)
                );
                
                CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable(class_name);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "add_category_to_classes",
            sql: r#"
                -- Add category column to classes table
                ALTER TABLE classes ADD COLUMN category TEXT DEFAULT 'tertiary';

                -- Auto-categorize existing classes based on name prefix
                UPDATE classes SET category = 'primary' WHERE name LIKE 'P%';
                UPDATE classes SET category = 'secondary' WHERE name LIKE 'S%';
                UPDATE classes SET category = 'tertiary' WHERE name LIKE 'Year%' OR name LIKE 'Y%';
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 13,
            description: "add_check_in_out_to_attendance",
            sql: r#"
                ALTER TABLE attendance ADD COLUMN check_in TEXT;
                ALTER TABLE attendance ADD COLUMN check_out TEXT;
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 14,
            description: "add_unique_to_attendance",
            sql: r#"
                CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 15,
            description: "create_student_subjects_table",
            sql: r#"
                CREATE TABLE IF NOT EXISTS student_subjects (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    subject_id TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                    UNIQUE(student_id, subject_id)
                );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 16,
            description: "flexible_academic_structure",
            sql: r#"
                -- 1. Allow any category name in classes (for Courses/Programs)
                CREATE TABLE classes_new (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    level INTEGER NOT NULL,
                    category TEXT NOT NULL
                );
                INSERT INTO classes_new SELECT * FROM classes;
                DROP TABLE classes;
                ALTER TABLE classes_new RENAME TO classes;

                -- 2. Add category to subjects
                ALTER TABLE subjects ADD COLUMN category TEXT DEFAULT 'General';

                -- 3. Create a truly flexible marks table
                CREATE TABLE IF NOT EXISTS assessment_marks (
                    id TEXT PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    subject_id TEXT NOT NULL,
                    class_name TEXT NOT NULL,
                    term INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    assessment_name TEXT NOT NULL, -- e.g., 'Quiz 1', 'Final Exam'
                    score REAL DEFAULT 0,
                    recorded_by TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                    FOREIGN KEY (recorded_by) REFERENCES users(id),
                    UNIQUE(student_id, subject_id, term, year, assessment_name)
                );
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
