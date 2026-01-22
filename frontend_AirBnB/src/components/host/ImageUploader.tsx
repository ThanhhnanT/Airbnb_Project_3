"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Button, message, Card, Image, Typography } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { PlusOutlined, DeleteOutlined, StarOutlined, StarFilled } from "@ant-design/icons";

const { Text } = Typography;

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  minImages?: number;
  maxImages?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  minImages = 5,
  maxImages = 20,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const onImagesChangeRef = useRef(onImagesChange);

  // Keep ref updated
  onImagesChangeRef.current = onImagesChange;

  // Calculate image count from fileList
  const doneFiles = fileList.filter((f) => f.status === "done" && f.url);
  const imageCount = doneFiles.length;
  const imageUrls = doneFiles.map((f) => f.url || "");

  // Update parent whenever imageUrls change
  useEffect(() => {
    onImagesChangeRef.current(imageUrls);
  }, [imageUrls.join(",")]);

  // Helper function to extract image URLs and notify parent
  const notifyImagesChange = (files: UploadFile[]) => {
    const doneFiles = files.filter((f) => f.status === "done" && f.url);
    const imageUrls = doneFiles.map((f) => f.url || "");
    onImagesChangeRef.current(imageUrls);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    // Merge with existing fileList to preserve files that were processed in customRequest
    setFileList((prev) => {
      // Keep files that are already done (processed in customRequest)
      const doneFiles = prev.filter((f) => f.status === "done" && f.url);
      // Add new files from newFileList that aren't already in doneFiles
      const newFiles = newFileList.filter(
        (f) => !doneFiles.some((df) => df.uid === f.uid)
      );
      const merged = [...doneFiles, ...newFiles];
      notifyImagesChange(merged);
      return merged;
    });
  };

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList);
    notifyImagesChange(newFileList);
    
    // Adjust cover index if needed
    if (coverIndex >= newFileList.length && newFileList.length > 0) {
      setCoverIndex(0);
    }
  };

  const handleSetCover = (index: number) => {
    setCoverIndex(index);
  };

  const uploadProps: UploadProps = {
    listType: "picture-card",
    fileList,
    onChange: handleChange,
    onRemove: handleRemove,
    multiple: true,
    accept: "image/*",
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type?.startsWith("image/");
      if (!isImage) {
        message.error("Chỉ có thể upload file ảnh!");
        return Upload.LIST_IGNORE;
      }
      const isLt10M = file.size! / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Ảnh phải nhỏ hơn 10MB!");
        return Upload.LIST_IGNORE;
      }
      // Return true to allow file to be added to fileList
      return true;
    },
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      try {
        onProgress?.({ percent: 0 });
        
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          
          // Update the file in fileList
          setFileList((prev) => {
            const fileObj = file as UploadFile;
            const updated = prev.map((f) => {
              // Match by uid or by name if uid doesn't match
              if (f.uid === fileObj.uid || 
                  (f.name === fileObj.name && f.status === "uploading")) {
                return {
                  ...f,
                  status: "done" as const,
                  url: url,
                };
              }
              return f;
            });
            
            // Notify parent
            setTimeout(() => notifyImagesChange(updated), 0);
            return updated;
          });
          
          onProgress?.({ percent: 100 });
          onSuccess?.(url);
        };
        
        reader.onerror = () => {
          onError?.(new Error("Failed to read file"));
        };
        
        reader.readAsDataURL(file as Blob);
      } catch (error) {
        onError?.(error as Error);
      }
    },
  };

  const isValid = imageCount >= minImages;

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Upload ảnh</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "14px", fontWeight: 500 }}>
            Tối thiểu {minImages} ảnh
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: isValid ? "#52c41a" : "#ff4d4f",
            }}
          >
            (hiện tại: {imageCount}/{minImages})
          </span>
        </div>
        {imageCount < minImages && (
          <div style={{ marginTop: 8 }}>
            <Text type="warning" style={{ fontSize: "14px" }}>
              Vui lòng upload ít nhất {minImages} ảnh để tiếp tục.
            </Text>
          </div>
        )}
      </div>

      <div style={{ marginBottom: fileList.length > 0 ? 24 : 0 }}>
        <Upload {...uploadProps} maxCount={maxImages} multiple={true}>
          {fileList.length < maxImages && (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
      </div>

      {imageCount > 0 && (
        <div style={{ marginTop: 32 }}>
          <h4 style={{ marginBottom: 16, textAlign: "center" }}>Preview ảnh ({imageCount} ảnh)</h4>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              marginTop: 16,
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            {fileList
              .filter((file) => file.status === "done" && file.url)
              .map((file, index) => {
                // Find the actual index in the filtered list for cover selection
                const doneFiles = fileList.filter((f) => f.status === "done" && f.url);
                const actualIndex = doneFiles.findIndex((f) => f.uid === file.uid);
                
                return (
                  <div
                    key={file.uid}
                    style={{
                      position: "relative",
                      width: "calc(50% - 8px)",
                      flex: "0 0 calc(50% - 8px)",
                      border: coverIndex === actualIndex ? "3px solid #1890ff" : "1px solid #d9d9d9",
                      borderRadius: 8,
                      overflow: "hidden",
                      aspectRatio: "16 / 9",
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Image
                      src={file.url}
                      alt={file.name || "Preview"}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover",
                        display: "block",
                      }}
                      preview={{
                        mask: (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ color: "white", fontSize: "14px", marginBottom: 4 }}>
                              {coverIndex === actualIndex && "⭐ Ảnh bìa"}
                            </div>
                            <div style={{ color: "white", fontSize: "12px" }}>Xem ảnh</div>
                          </div>
                        ),
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        display: "flex",
                        gap: 8,
                        zIndex: 10,
                      }}
                    >
                      <Button
                        type="primary"
                        size="small"
                        icon={coverIndex === actualIndex ? <StarFilled /> : <StarOutlined />}
                        onClick={() => handleSetCover(actualIndex)}
                        style={{
                          background: coverIndex === actualIndex ? "#1890ff" : "rgba(0,0,0,0.6)",
                          border: "none",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                        title="Đặt làm ảnh bìa"
                      />
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemove(file)}
                        style={{
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                        title="Xóa ảnh"
                      />
                    </div>
                    {coverIndex === actualIndex && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(to top, rgba(24, 144, 255, 0.9), transparent)",
                          color: "white",
                          textAlign: "center",
                          padding: "8px",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        ⭐ Ảnh bìa
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ImageUploader;
