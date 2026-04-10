import Database from "@tauri-apps/plugin-sql";
import { hashPassword, verifyPassword } from "./crypto";

let dbInstance: Awaited<ReturnType<typeof Database.load>> | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:app.db");
  }
  return dbInstance;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
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
  role?: "admin" | "editor" | "viewer";
  status?: "active" | "inactive";
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
      const role = data.role || "viewer";
      const status = data.status || "active";

      const database = await getDb();
      await database.execute(
        "INSERT INTO users (id, name, email, role, status, password_hash, salt, first_login, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [id, data.name, data.email, role, status, hash, salt, true, now, now]
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
        const role = user.role || "viewer";
        const status = user.status || "active";

        await database.execute(
          "INSERT INTO users (id, name, email, role, status, password_hash, salt, first_login, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
          [id, user.name, user.email, role, status, hash, salt, true, now, now]
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
};
