"use client";

import { useState } from "react";
import { Upload, Avatar, message } from "antd";
import { UserOutlined, CameraOutlined, LoadingOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import { postAccess } from "@/helper/api";
import styles from "./AvatarUpload.module.css";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError?: (error: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentAvatarUrl);

  // Compress image for avatar (smaller size, square aspect ratio)
  const compressImage = (
    file: File,
    maxSize: number = 400,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate square dimensions
          const size = Math.min(width, height, maxSize);
          width = size;
          height = size;

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Draw image centered and cropped to square
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            width,
            height
          );

          const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleUpload: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
    onProgress,
  }) => {
    try {
      setLoading(true);
      onProgress?.({ percent: 0 });

      // Validate file type
      const fileObj = file as File;
      if (!fileObj.type.startsWith("image/")) {
        throw new Error("File must be an image");
      }

      // Validate file size (max 5MB before compression)
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      if (fileObj.size > maxSizeBytes) {
        throw new Error("Image size must be less than 5MB");
      }

      onProgress?.({ percent: 30 });

      // Compress and convert to base64
      const base64Image = await compressImage(fileObj);
      setPreviewUrl(base64Image); // Show preview immediately

      onProgress?.({ percent: 60 });

      // Upload to Cloudinary
      const result = await postAccess("upload/image", {
        image: base64Image,
        folder: "airbnb-profiles",
      });

      onProgress?.({ percent: 100 });

      if (result?.url) {
        setPreviewUrl(result.url);
        onUploadSuccess(result.url);
        onSuccess?.(result);
        message.success("Ảnh đại diện đã được cập nhật");
      } else {
        throw new Error("Upload failed: No URL returned");
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể upload ảnh. Vui lòng thử lại.";
      message.error(errorMessage);
      onError?.(error);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "avatar",
    listType: "picture-circle",
    showUploadList: false,
    customRequest: handleUpload,
    accept: "image/*",
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Chỉ có thể upload file ảnh!");
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Ảnh phải nhỏ hơn 5MB!");
      }
      return isImage && isLt5M;
    },
  };

  return (
    <div className={styles.avatarUploadContainer}>
      <Upload {...uploadProps} className={styles.uploadWrapper}>
        <div className={styles.avatarWrapper}>
          <Avatar
            size={120}
            src={previewUrl}
            icon={<UserOutlined />}
            className={styles.avatar}
          />
          <div className={styles.overlay}>
            {loading ? (
              <LoadingOutlined className={styles.uploadIcon} />
            ) : (
              <CameraOutlined className={styles.uploadIcon} />
            )}
            <span className={styles.uploadText}>
              {loading ? "Đang tải..." : "Thay đổi ảnh"}
            </span>
          </div>
        </div>
      </Upload>
    </div>
  );
};

export default AvatarUpload;
