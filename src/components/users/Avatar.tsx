import { useState, useEffect } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openImagePicker, saveImage, deleteImage, getImageAsDataUrl, getPlaceholderAvatar } from "@/lib/images";
import { queries } from "@/lib/db";
import { useToast } from "@/lib/hooks/useToast";

interface AvatarProps {
  userId: string;
  userName: string;
  imagePath?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  onUpdate?: () => void;
}

const sizeClasses = {
  sm: "size-8",
  md: "size-12",
  lg: "size-20",
  xl: "size-32",
};

const iconSizes = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
  xl: "size-6",
};

export function Avatar({ userId, userName, imagePath, size = "md", editable = false, onUpdate }: AvatarProps) {
  const toast = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadImage() {
      if (imagePath) {
        const url = await getImageAsDataUrl(imagePath);
        setImageUrl(url);
      } else {
        setImageUrl(null);
      }
    }
    loadImage();
  }, [imagePath]);

  const handleUpload = async () => {
    try {
      const selected = await openImagePicker();
      if (!selected) return;

      setIsUploading(true);

      if (imagePath) {
        await deleteImage(imagePath);
      }

      const savedPath = await saveImage(selected.data, "avatars");
      await queries.users.updateImagePath(userId, savedPath);

      const url = await getImageAsDataUrl(savedPath);
      setImageUrl(url);

      toast.success("Profile photo updated");
      onUpdate?.();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      if (imagePath) {
        await deleteImage(imagePath);
      }
      await queries.users.updateImagePath(userId, null);
      setImageUrl(null);
      toast.success("Profile photo removed");
      onUpdate?.();
    } catch (error) {
      console.error("Remove failed:", error);
      toast.error("Failed to remove image");
    }
  };

  const displayUrl = imageUrl || getPlaceholderAvatar(userName);

  return (
    <div className="relative inline-block">
      <img
        src={displayUrl}
        alt={userName}
        className={`${sizeClasses[size]} rounded-full object-cover bg-muted`}
      />
      {editable && (
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          <Button
            variant="secondary"
            size="icon-sm"
            className="h-6 w-6 rounded-full shadow-md"
            onClick={handleUpload}
            disabled={isUploading}
          >
            <Camera className={iconSizes[size]} />
          </Button>
          {imagePath && (
            <Button
              variant="secondary"
              size="icon-sm"
              className="h-6 w-6 rounded-full shadow-md text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className={iconSizes[size]} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
