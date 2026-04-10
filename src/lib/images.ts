import { open } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile, mkdir, exists, remove, readDir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { queries } from "./db";

const IMAGES_DIR = "images";

async function ensureDir(dir: string): Promise<void> {
  const dirExists = await exists(dir, { baseDir: BaseDirectory.AppData });
  if (!dirExists) {
    await mkdir(dir, { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function cleanupOrphanedImages(): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  try {
    const users = await queries.users.findAll();
    const referencedPaths = new Set<string>();
    
    users.forEach((user) => {
      if (user.image_path) {
        referencedPaths.add(user.image_path);
      }
    });

    const categories = ["avatars", "logos", "documents"];
    
    for (const category of categories) {
      const categoryDir = `${IMAGES_DIR}/${category}`;
      const dirExists = await exists(categoryDir, { baseDir: BaseDirectory.AppData });
      
      if (!dirExists) continue;

      try {
        const files = await readDir(categoryDir, { baseDir: BaseDirectory.AppData });
        
        for (const file of files) {
          const filePath = `${categoryDir}/${file.name}`;
          
          if (!referencedPaths.has(filePath)) {
            try {
              await remove(filePath, { baseDir: BaseDirectory.AppData });
              deleted++;
            } catch (err) {
              errors.push(`Failed to delete ${filePath}: ${err}`);
            }
          }
        }
      } catch (err) {
        errors.push(`Failed to read ${categoryDir}: ${err}`);
      }
    }

    const now = new Date().toISOString();
    await queries.settings.upsert("last_image_cleanup", now);
  } catch (err) {
    errors.push(`Cleanup failed: ${err}`);
  }

  return { deleted, errors };
}

export async function getLastCleanupDate(): Promise<string | null> {
  const setting = await queries.settings.findByKey("last_image_cleanup");
  return setting?.value || null;
}

export async function getImagesDir(): Promise<string> {
  const appData = await appDataDir();
  return `${appData}${IMAGES_DIR}`;
}

export async function openImagePicker(): Promise<{ data: Uint8Array; name: string; ext: string } | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"],
      },
    ],
  });

  if (!selected) return null;

  const filePath = selected as string;
  const fileData = await readFile(filePath);

  const ext = filePath.split(".").pop()?.toLowerCase() || "png";
  const name = filePath.split(/[\\/]/).pop() || "image";

  return {
    data: fileData,
    name,
    ext,
  };
}

export async function saveImage(
  imageData: Uint8Array,
  category: "avatars" | "logos" | "documents"
): Promise<string> {
  const categoryDir = `${IMAGES_DIR}/${category}`;
  await ensureDir(categoryDir);

  const filename = `${crypto.randomUUID()}.${imageData.length > 0 ? "png" : "jpg"}`;
  const relativePath = `${categoryDir}/${filename}`;

  await writeFile(relativePath, imageData, { baseDir: BaseDirectory.AppData });

  return relativePath;
}

export async function deleteImage(imagePath: string): Promise<void> {
  try {
    const fileExists = await exists(imagePath, { baseDir: BaseDirectory.AppData });
    if (fileExists) {
      await remove(imagePath, { baseDir: BaseDirectory.AppData });
    }
  } catch (error) {
    console.error("Failed to delete image:", error);
  }
}

export async function getImageAsDataUrl(imagePath: string): Promise<string | null> {
  try {
    const fileExists = await exists(imagePath, { baseDir: BaseDirectory.AppData });
    if (!fileExists) return null;

    const data = await readFile(imagePath, { baseDir: BaseDirectory.AppData });
    const base64 = btoa(String.fromCharCode(...data));

    const ext = imagePath.split(".").pop()?.toLowerCase() || "png";
    const mimeType = ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "gif"
        ? "image/gif"
        : ext === "webp"
          ? "image/webp"
          : ext === "bmp"
            ? "image/bmp"
            : "image/png";

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Failed to read image:", error);
    return null;
  }
}

export function getPlaceholderAvatar(name: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="${color}"/>
      <text x="64" y="64" dy="0.35em" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="48" font-weight="600">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
