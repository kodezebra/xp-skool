import Database from "@tauri-apps/plugin-sql";
import { hashPassword, verifyPassword } from "./crypto";

let dbInstance: Awaited<ReturnType<typeof Database.load>> | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:app.db");
  }
  return dbInstance;
}

export type UserRole = "admin" | "teacher" | "finance" | "frontdesk";
export type UserCapability = "receive_payments" | "view_financials";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  capabilities: string; // JSON string of UserCapability[]
  status: "active" | "inactive";
  password_hash: string;
  salt: string;
  first_login: boolean;
  created_at: string;
  updated_at: string;
  image_path?: string;
}

export interface NewUser {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  status?: "active" | "inactive";
  capabilities?: UserCapability[];
}

export interface Student {
  id: string;
  admission_no: string;
  name: string;
  gender: "M" | "F";
  date_of_birth?: string;
  current_class: string;
  class_id?: string;
  status: "active" | "inactive" | "alumni";
  image_path?: string;
  created_at: string;
  updated_at: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relation?: string;
  student_phone?: string;
  student_email?: string;
  address?: string;
}

export type ClassCategory = "primary" | "secondary" | "tertiary";

export interface Class {
  id: string;
  name: string;
  level: string;
  category: ClassCategory;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_name: string;
  subject_id: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_name: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  check_in?: string;
  check_out?: string;
  remarks?: string;
  recorded_by: string;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  class_name: string;
  term: number;
  year: number;
  opening_mark: number;
  mid_term_mark: number;
  end_term_mark: number;
  total_mark: number;
  grade?: string;
  remarks?: string;
  recorded_by: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  category: string;
  recorded_by: string;
  remarks?: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  created_at: string;
}

export interface AuthSession {
  userId: string;
  token: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const queries = {
  auth: {
    register: async (data: NewUser): Promise<User> => {
      const { hash, salt } = await hashPassword(data.password);
      const id = generateId();
      const now = new Date().toISOString();
      const role = data.role || "teacher";
      const status = data.status || "active";

      const database = await getDb();
      const capabilities = JSON.stringify(data.capabilities || []);
      await database.execute(
        "INSERT INTO users (id, name, email, role, status, password_hash, salt, first_login, created_at, updated_at, capabilities) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        [id, data.name, data.email, role, status, hash, salt, true, now, now, capabilities]
      );

      return {
        id,
        name: data.name,
        email: data.email,
        role,
        status,
        password_hash: hash,
        salt,
        first_login: true,
        created_at: now,
        updated_at: now,
        capabilities,
      };
    },

    login: async (
      email: string,
      password: string
    ): Promise<{ user: User; token: string } | { error: string; remainingAttempts?: number; lockoutUntil?: string }> => {
      const database = await getDb();

      // Check lockout
      const lockoutCheck = await database.select<{ count: number }[]>(
        "SELECT COUNT(*) as count FROM login_attempts WHERE email = $1 AND success = 0 AND created_at > datetime('now', '-5 minutes')",
        [email]
      );
      const failedCount = lockoutCheck[0]?.count ?? 0;
      if (failedCount >= 5) {
        const lockoutRecord = await database.select<{ created_at: string }[]>(
          "SELECT created_at FROM login_attempts WHERE email = $1 AND success = 0 ORDER BY created_at DESC LIMIT 1",
          [email]
        );
        const lockoutTime = lockoutRecord[0]?.created_at;
        const lockoutUntil = new Date(new Date(lockoutTime).getTime() + 5 * 60 * 1000).toISOString();
        await queries.auth.recordLoginAttempt(email, false);
        return { error: "Account locked. Try again in 5 minutes.", lockoutUntil };
      }

      // Find user
      const results = await database.select<User[]>(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      const user = results[0];
      if (!user) {
        await queries.auth.recordLoginAttempt(email, false);
        const remaining = 5 - failedCount - 1;
        return { error: "Invalid email or password", remainingAttempts: Math.max(0, remaining) };
      }

      // Verify password
      const valid = await verifyPassword(password, user.password_hash, user.salt);
      if (!valid) {
        await queries.auth.recordLoginAttempt(email, false);
        const remaining = 5 - failedCount - 1;
        return { error: "Invalid email or password", remainingAttempts: Math.max(0, remaining) };
      }

      // Success - record and return
      await queries.auth.recordLoginAttempt(email, true);
      const token = generateId();
      const now = new Date().toISOString();
      await database.execute(
        "INSERT OR REPLACE INTO sessions (user_id, token, created_at) VALUES ($1, $2, $3)",
        [user.id, token, now]
      );

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          password_hash: user.password_hash,
          salt: user.salt,
          first_login: user.first_login,
          created_at: user.created_at,
          updated_at: user.updated_at,
          capabilities: user.capabilities,
        },
        token,
      };
    },

    logout: async (token: string): Promise<void> => {
      const database = await getDb();
      await database.execute("DELETE FROM sessions WHERE token = $1", [token]);
    },

    validateSession: async (token: string): Promise<User | null> => {
      const database = await getDb();
      const results = await database.select<User[]>(
        `SELECT u.* FROM users u INNER JOIN sessions s ON u.id = s.user_id WHERE s.token = $1`,
        [token]
      );
      return results[0] || null;
    },

    updatePassword: async (userId: string, newPassword: string): Promise<void> => {
      const { hash, salt } = await hashPassword(newPassword);
      const now = new Date().toISOString();
      const database = await getDb();
      await database.execute(
        "UPDATE users SET password_hash = $1, salt = $2, first_login = 0, updated_at = $3 WHERE id = $4",
        [hash, salt, now, userId]
      );
    },

    recordLoginAttempt: async (email: string, success: boolean): Promise<void> => {
      const database = await getDb();
      const id = generateId();
      const now = new Date().toISOString();
      await database.execute(
        "INSERT INTO login_attempts (id, email, success, created_at) VALUES ($1, $2, $3, $4)",
        [id, email, success ? 1 : 0, now]
      );
    },
  },

  users: {
    findAll: async (): Promise<User[]> => {
      try {
        const database = await getDb();
        return database.select<User[]>("SELECT * FROM users ORDER BY created_at DESC");
      } catch (error) {
        console.error("findAll error:", error);
        throw error;
      }
    },

    findById: async (id: string): Promise<User | null> => {
      try {
        const database = await getDb();
        const results = await database.select<User[]>("SELECT * FROM users WHERE id = $1", [id]);
        return results[0] || null;
      } catch (error) {
        console.error("findById error:", error);
        throw error;
      }
    },

    create: async (user: NewUser): Promise<User> => {
      try {
        const { hash, salt } = await hashPassword(user.password);
        const database = await getDb();
        const id = generateId();
        const now = new Date().toISOString();
        const role = user.role || "teacher";
        const status = user.status || "active";
        const capabilities = JSON.stringify(user.capabilities || []);

        await database.execute(
          "INSERT INTO users (id, name, email, role, status, password_hash, salt, first_login, created_at, updated_at, capabilities) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
          [id, user.name, user.email, role, status, hash, salt, true, now, now, capabilities]
        );

        return {
          id,
          name: user.name,
          email: user.email,
          role,
          status,
          password_hash: hash,
          salt,
          first_login: true,
          created_at: now,
          updated_at: now,
          capabilities,
        };
      } catch (error) {
        console.error("create error:", error);
        throw error;
      }
    },

    update: async (id: string, data: Partial<Omit<NewUser, "password">>): Promise<void> => {
      try {
        const database = await getDb();
        const now = new Date().toISOString();
        const fields: string[] = ["updated_at = $1"];
        const values: (string | undefined)[] = [now];
        let paramIndex = 2;

        if (data.name !== undefined) {
          fields.push(`name = $${paramIndex++}`);
          values.push(data.name);
        }
        if (data.email !== undefined) {
          fields.push(`email = $${paramIndex++}`);
          values.push(data.email);
        }
        if (data.role !== undefined) {
          fields.push(`role = $${paramIndex++}`);
          values.push(data.role);
        }
        if (data.status !== undefined) {
          fields.push(`status = $${paramIndex++}`);
          values.push(data.status);
        }
        if (data.capabilities !== undefined) {
          fields.push(`capabilities = $${paramIndex++}`);
          values.push(JSON.stringify(data.capabilities));
        }

        values.push(id);
        await database.execute(
          `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
          values
        );
      } catch (error) {
        console.error("update error:", error);
        throw error;
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const database = await getDb();
        await database.execute("DELETE FROM users WHERE id = $1", [id]);
      } catch (error) {
        console.error("delete error:", error);
        throw error;
      }
    },

    updateImagePath: async (id: string, imagePath: string | null): Promise<void> => {
      try {
        const database = await getDb();
        const now = new Date().toISOString();
        await database.execute(
          "UPDATE users SET image_path = $1, updated_at = $2 WHERE id = $3",
          [imagePath, now, id]
        );
      } catch (error) {
        console.error("updateImagePath error:", error);
        throw error;
      }
    },

    resetPassword: async (userId: string): Promise<string> => {
      try {
        const tempPassword = crypto.randomUUID().slice(0, 8);
        const { hash, salt } = await hashPassword(tempPassword);
        const now = new Date().toISOString();
        const database = await getDb();
        await database.execute(
          "UPDATE users SET password_hash = $1, salt = $2, first_login = 1, updated_at = $3 WHERE id = $4",
          [hash, salt, now, userId]
        );
        return tempPassword;
      } catch (error) {
        console.error("resetPassword error:", error);
        throw error;
      }
    },

    changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<{ error?: string }> => {
      try {
        const database = await getDb();
        const results = await database.select<User[]>("SELECT * FROM users WHERE id = $1", [userId]);
        const user = results[0];
        if (!user) {
          return { error: "User not found" };
        }
        const valid = await verifyPassword(currentPassword, user.password_hash, user.salt);
        if (!valid) {
          return { error: "Current password is incorrect" };
        }
        const { hash, salt } = await hashPassword(newPassword);
        const now = new Date().toISOString();
        await database.execute(
          "UPDATE users SET password_hash = $1, salt = $2, first_login = 0, updated_at = $3 WHERE id = $4",
          [hash, salt, now, userId]
        );
        return {};
      } catch (error) {
        console.error("changePassword error:", error);
        throw error;
      }
    },
  },
  settings: {
    findAll: async (): Promise<Setting[]> => {
      try {
        const database = await getDb();
        return database.select<Setting[]>("SELECT * FROM settings ORDER BY key");
      } catch (error) {
        console.error("settings.findAll error:", error);
        throw error;
      }
    },

    findByKey: async (key: string): Promise<Setting | null> => {
      try {
        const database = await getDb();
        const results = await database.select<Setting[]>("SELECT * FROM settings WHERE key = $1", [key]);
        return results[0] || null;
      } catch (error) {
        console.error("settings.findByKey error:", error);
        throw error;
      }
    },

    upsert: async (key: string, value: string): Promise<void> => {
      try {
        const database = await getDb();
        const now = new Date().toISOString();
        await database.execute(
          `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
           ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = $3`,
          [key, value, now]
        );
      } catch (error) {
        console.error("settings.upsert error:", error);
        throw error;
      }
    },

    delete: async (key: string): Promise<void> => {
      try {
        const database = await getDb();
        await database.execute("DELETE FROM settings WHERE key = $1", [key]);
      } catch (error) {
        console.error("settings.delete error:", error);
        throw error;
      }
    },
  },
  students: {
    findAll: async (): Promise<Student[]> => {
      const database = await getDb();
      return database.select<Student[]>("SELECT * FROM students ORDER BY name ASC");
    },
    findById: async (id: string): Promise<Student | null> => {
      const database = await getDb();
      const results = await database.select<Student[]>("SELECT * FROM students WHERE id = $1", [id]);
      return results[0] || null;
    },
    create: async (student: Omit<Student, "id" | "created_at" | "updated_at">): Promise<Student> => {
      const database = await getDb();
      const id = generateId();
      const now = new Date().toISOString();
      await database.execute(
        "INSERT INTO students (id, admission_no, name, gender, date_of_birth, current_class, status, image_path, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [id, student.admission_no, student.name, student.gender, student.date_of_birth, student.current_class, student.status, student.image_path, now, now]
      );
      return { ...student, id, created_at: now, updated_at: now };
    },
    update: async (id: string, data: Partial<Student>): Promise<void> => {
      const database = await getDb();
      const now = new Date().toISOString();
      const fields = ["updated_at = $1"];
      const values: any[] = [now];
      let i = 2;
      Object.entries(data).forEach(([key, val]) => {
        if (["id", "created_at", "updated_at"].includes(key)) return;
        fields.push(`${key} = $${i++}`);
        values.push(val);
      });
      values.push(id);
      await database.execute(`UPDATE students SET ${fields.join(", ")} WHERE id = $${i}`, values);
    },
    delete: async (id: string): Promise<void> => {
      const database = await getDb();
      await database.execute("DELETE FROM students WHERE id = $1", [id]);
    },
    updateImagePath: async (id: string, path: string | null): Promise<void> => {
      const database = await getDb();
      await database.execute("UPDATE students SET image_path = $1, updated_at = $2 WHERE id = $3", [path, new Date().toISOString(), id]);
    }
  },
  classes: {
    findAll: async (): Promise<Class[]> => {
      const database = await getDb();
      return database.select<Class[]>("SELECT * FROM classes ORDER BY level ASC, name ASC");
    },
    findBySchoolType: async (schoolType: string): Promise<Class[]> => {
      const database = await getDb();
      const categoryMap: Record<string, ClassCategory> = {
        primary: "primary",
        secondary: "secondary",
        college: "tertiary",
        vocational: "tertiary",
      };
      const category = categoryMap[schoolType] || "tertiary";
      return database.select<Class[]>(
        "SELECT * FROM classes WHERE category = $1 ORDER BY level ASC, name ASC",
        [category]
      );
    },
    create: async (c: Omit<Class, "id">): Promise<Class> => {
      const database = await getDb();
      const id = generateId();
      await database.execute("INSERT INTO classes (id, name, level, category) VALUES ($1, $2, $3, $4)", [id, c.name, c.level, c.category]);
      return { ...c, id };
    },
    update: async (id: string, data: Partial<Class>): Promise<void> => {
      const database = await getDb();
      const fields: string[] = [];
      const values: any[] = [];
      let i = 1;
      Object.entries(data).forEach(([key, val]) => {
        if (key === "id") return;
        fields.push(`${key} = $${i++}`);
        values.push(val);
      });
      values.push(id);
      await database.execute(`UPDATE classes SET ${fields.join(", ")} WHERE id = $${i}`, values);
    },
    delete: async (id: string): Promise<void> => {
      const database = await getDb();
      await database.execute("DELETE FROM classes WHERE id = $1", [id]);
    }
  },
  subjects: {
    findAll: async (): Promise<Subject[]> => {
      const database = await getDb();
      return database.select<Subject[]>("SELECT * FROM subjects ORDER BY name ASC");
    },
    create: async (subject: Omit<Subject, "id">): Promise<Subject> => {
      const database = await getDb();
      const id = generateId();
      await database.execute("INSERT INTO subjects (id, name, code) VALUES ($1, $2, $3)", [id, subject.name, subject.code]);
      return { ...subject, id };
    },
    delete: async (id: string): Promise<void> => {
      const database = await getDb();
      await database.execute("DELETE FROM subjects WHERE id = $1", [id]);
    }
  },
  academic: {
    assignTeacher: async (assignment: Omit<TeacherAssignment, "id">): Promise<void> => {
      const database = await getDb();
      const id = generateId();
      await database.execute(
        "INSERT INTO teacher_assignments (id, teacher_id, class_name, subject_id) VALUES ($1, $2, $3, $4)",
        [id, assignment.teacher_id, assignment.class_name, assignment.subject_id]
      );
    },
    getAttendance: async (className: string, date: string): Promise<Attendance[]> => {
      const database = await getDb();
      return database.select<Attendance[]>("SELECT * FROM attendance WHERE class_name = $1 AND date = $2", [className, date]);
    },
    recordAttendance: async (attendance: Omit<Attendance, "id">): Promise<void> => {
      const database = await getDb();
      const id = generateId();
      await database.execute(
        "INSERT OR REPLACE INTO attendance (id, student_id, class_name, date, status, check_in, check_out, remarks, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [id, attendance.student_id, attendance.class_name, attendance.date, attendance.status, attendance.check_in, attendance.check_out, attendance.remarks, attendance.recorded_by]
      );
    },
    getMarks: async (studentId: string): Promise<Mark[]> => {
      const database = await getDb();
      return database.select<Mark[]>("SELECT * FROM marks WHERE student_id = $1", [studentId]);
    },
    recordMarks: async (mark: Omit<Mark, "id" | "total_mark">): Promise<void> => {
      const database = await getDb();
      const id = generateId();
      await database.execute(
        "INSERT OR REPLACE INTO marks (id, student_id, subject_id, class_name, term, year, opening_mark, mid_term_mark, end_term_mark, grade, remarks, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
        [id, mark.student_id, mark.subject_id, mark.class_name, mark.term, mark.year, mark.opening_mark, mark.mid_term_mark, mark.end_term_mark, mark.grade, mark.remarks, mark.recorded_by]
      );
    }
  },
  finance: {
    getPayments: async (studentId?: string): Promise<Payment[]> => {
      const database = await getDb();
      if (studentId) {
        return database.select<Payment[]>("SELECT * FROM payments WHERE student_id = $1 ORDER BY payment_date DESC", [studentId]);
      }
      return database.select<Payment[]>("SELECT * FROM payments ORDER BY payment_date DESC");
    },
    recordPayment: async (payment: Omit<Payment, "id">): Promise<void> => {
      const database = await getDb();
      const id = generateId();
      const now = new Date().toISOString();
      
      // Get current term/year from settings
      const settings = await queries.settings.findAll();
      const year = settings.find(s => s.key === "academic_year")?.value || new Date().getFullYear().toString();
      
      // Determine term based on current date and term dates in settings
      const term1Start = settings.find(s => s.key === "term1_start")?.value;
      const term2Start = settings.find(s => s.key === "term2_start")?.value;
      const term3Start = settings.find(s => s.key === "term3_start")?.value;
      
      let term = 1;
      const payDate = new Date(payment.payment_date);
      if (term3Start && payDate >= new Date(term3Start)) term = 3;
      else if (term2Start && payDate >= new Date(term2Start)) term = 2;

      // 1. Record the payment
      await database.execute(
        "INSERT INTO payments (id, student_id, amount, payment_date, payment_method, reference_no, category, recorded_by, remarks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [id, payment.student_id, payment.amount, payment.payment_date, payment.payment_method, payment.reference_no, payment.category, payment.recorded_by, payment.remarks]
      );

      // 2. Update student_fees (increment amount_paid)
      await database.execute(
        `INSERT INTO student_fees (id, student_id, category, amount_paid, term, year, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(student_id, category, term, year) 
         DO UPDATE SET amount_paid = amount_paid + $4, updated_at = $8`,
        [crypto.randomUUID(), payment.student_id, payment.category, payment.amount, term, parseInt(year), now, now]
      );
    }
  },
  dashboard: {
    getStats: async () => {
      const database = await getDb();
      const [students, users, classes, recentPayments, monthlyRevenue] = await Promise.all([
        database.select<{ count: number }[]>("SELECT COUNT(*) as count FROM students WHERE status = 'active'"),
        database.select<{ count: number }[]>("SELECT COUNT(*) as count FROM users WHERE status = 'active'"),
        database.select<{ count: number }[]>("SELECT COUNT(*) as count FROM classes"),
        database.select<(Payment & { student_name: string })[]>(`
          SELECT p.*, s.name as student_name 
          FROM payments p 
          LEFT JOIN students s ON p.student_id = s.id 
          ORDER BY p.payment_date DESC 
          LIMIT 5
        `),
        database.select<{ total: number }[]>(`
          SELECT COALESCE(SUM(amount), 0) as total 
          FROM payments 
          WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')
        `),
      ]);
      return {
        students: students[0]?.count ?? 0,
        users: users[0]?.count ?? 0,
        classes: classes[0]?.count ?? 0,
        recentPayments,
        monthlyRevenue: monthlyRevenue[0]?.total ?? 0,
      };
    },
  },
  fees: {
    getStudentBalance: async (studentId: string) => {
      const database = await getDb();
      const fees = await database.select<{ category: string; amount_due: number; amount_paid: number }[]>(
        "SELECT category, SUM(amount_due) as amount_due, SUM(amount_paid) as amount_paid FROM student_fees WHERE student_id = $1 GROUP BY category",
        [studentId]
      );
      const totalDue = fees.reduce((sum, f) => sum + f.amount_due, 0);
      const totalPaid = fees.reduce((sum, f) => sum + f.amount_paid, 0);
      return {
        breakdown: fees,
        totalDue,
        totalPaid,
        balance: totalDue - totalPaid,
      };
    },
    createOrUpdateFee: async (studentId: string, category: string, amountDue: number, term: number, year: number) => {
      const database = await getDb();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await database.execute(
        `INSERT INTO student_fees (id, student_id, category, amount_due, term, year, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(student_id, category, term, year) 
         DO UPDATE SET amount_due = $4, updated_at = $8`,
        [id, studentId, category, amountDue, term, year, now, now]
      );
    },
    recordPaymentOnAccount: async (studentId: string, category: string, amount: number, term: number, year: number) => {
      const database = await getDb();
      const now = new Date().toISOString();
      await database.execute(
        `INSERT INTO student_fees (id, student_id, category, amount_paid, term, year, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(student_id, category, term, year) 
         DO UPDATE SET amount_paid = amount_paid + $4, updated_at = $8`,
        [crypto.randomUUID(), studentId, category, amount, term, year, now, now]
      );
    },
    getOutstandingBalance: async () => {
      const database = await getDb();
      return database.select<{
        student_id: string;
        student_name: string;
        class: string;
        total_due: number;
        total_paid: number;
        balance: number;
      }[]>(`
        SELECT 
          sf.student_id,
          s.name as student_name,
          s.current_class as class,
          COALESCE(SUM(sf.amount_due), 0) as total_due,
          COALESCE(SUM(sf.amount_paid), 0) as total_paid,
          COALESCE(SUM(sf.amount_due), 0) - COALESCE(SUM(sf.amount_paid), 0) as balance
        FROM student_fees sf
        JOIN students s ON sf.student_id = s.id
        GROUP BY sf.student_id
        HAVING balance > 0
        ORDER BY balance DESC
      `);
    },
    bulkApplyFees: async (className: string, term: number, year: number, items: { category: string; amount: number }[]) => {
      const database = await getDb();
      const students = await database.select<{ id: string }[]>(
        "SELECT id FROM students WHERE current_class = $1 AND status = 'active'",
        [className]
      );
      const now = new Date().toISOString();

      for (const student of students) {
        for (const item of items) {
          await database.execute(
            `INSERT INTO student_fees (id, student_id, category, amount_due, term, year, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT(student_id, category, term, year) 
             DO UPDATE SET amount_due = $4, updated_at = $8`,
            [crypto.randomUUID(), student.id, item.category, item.amount, term, year, now, now]
          );
        }
      }
    },
  },
  timetable: {
    getByClass: async (className: string) => {
      const database = await getDb();
      return database.select<{
        id: string;
        class_name: string;
        day_of_week: number;
        period: number;
        subject_id: string;
        subject_name: string;
        teacher_id: string | null;
        start_time: string | null;
        end_time: string | null;
      }[]>(`
        SELECT t.*, sub.name as subject_name 
        FROM timetable t 
        LEFT JOIN subjects sub ON t.subject_id = sub.id 
        WHERE t.class_name = $1 
        ORDER BY t.day_of_week, t.period
      `, [className]);
    },
    createOrUpdate: async (entry: {
      class_name: string;
      day_of_week: number;
      period: number;
      subject_id: string;
      teacher_id?: string;
      start_time?: string;
      end_time?: string;
    }) => {
      const database = await getDb();
      const id = crypto.randomUUID();
      await database.execute(
        `INSERT INTO timetable (id, class_name, day_of_week, period, subject_id, teacher_id, start_time, end_time) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(class_name, day_of_week, period) 
         DO UPDATE SET subject_id = $5, teacher_id = $6, start_time = $7, end_time = $8`,
        [id, entry.class_name, entry.day_of_week, entry.period, entry.subject_id, entry.teacher_id || null, entry.start_time || null, entry.end_time || null]
      );
    },
    delete: async (className: string, dayOfWeek: number, period: number) => {
      const database = await getDb();
      await database.execute(
        "DELETE FROM timetable WHERE class_name = $1 AND day_of_week = $2 AND period = $3",
        [className, dayOfWeek, period]
      );
    },
  }
};
