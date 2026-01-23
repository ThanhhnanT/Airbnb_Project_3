"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Upload, Button, message, Card, Image as AntImage, Typography } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { PlusOutlined, DeleteOutlined, StarOutlined, StarFilled } from "@ant-design/icons";

const { Text } = Typography;

interface ImageFile {
  file: File;
  preview: string; // base64 preview
}

interface ImageUploaderProps {
  onImagesChange: (images: ImageFile[]) => void;
  minImages?: number;
  maxImages?: number;
  initialImages?: string[]; // Add initial images prop
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  minImages = 5,
  maxImages = 20,
  initialImages = [],
}) => {
  // Initialize fileList from initialImages if provided
  const [fileList, setFileList] = useState<UploadFile[]>(() => {
    if (initialImages && initialImages.length > 0) {
      return initialImages.map((url, index) => ({
        uid: `initial-${index}-${Date.now()}`,
        name: `image-${index + 1}`,
        status: "done" as const,
        url: url,
      }));
    }
    return [];
  });
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const onImagesChangeRef = useRef(onImagesChange);
  
  // Update fileList when initialImages change (only on mount or when initialImages length changes significantly)
  const prevInitialImagesLengthRef = useRef(initialImages.length);
  
  useEffect(() => {
    // Restore fileList from initialImages ONLY when component first mounts (fileList is empty)
    // Don't restore during upload or when files already exist
    if (initialImages && initialImages.length > 0 && fileList.length === 0 && imageFiles.size === 0) {
      console.log("useEffect restore - component just mounted, restoring from initialImages:", initialImages.length);
      const newFileList = initialImages.map((url, index) => {
        return {
          uid: `initial-${index}-${Date.now()}`,
          name: `image-${index + 1}`,
          status: "done" as const,
          url: url,
        };
      });
      setFileList(newFileList);
      
      // Restore imageFiles map from initialImages (base64 previews)
      const restoredImageFiles: ImageFile[] = [];
      const newImageFilesMap = new Map<string, ImageFile>();
      
      newFileList.forEach((file, index) => {
        if (file.url && file.url.startsWith('data:')) {
          // Create placeholder imageFile from base64 preview
          const placeholder: ImageFile = {
            file: new File([], `image-${index + 1}`, { type: 'image/jpeg' }),
            preview: file.url,
          };
          newImageFilesMap.set(file.uid, placeholder);
          restoredImageFiles.push(placeholder);
        }
      });
      
      setImageFiles(newImageFilesMap);
      prevInitialImagesLengthRef.current = initialImages.length;
      
      // Notify parent about restored images
      if (restoredImageFiles.length > 0) {
        setTimeout(() => {
          console.log("useEffect restore - notifying with restoredImageFiles:", restoredImageFiles.length);
          onImagesChangeRef.current(restoredImageFiles);
        }, 0);
      }
    }
  }, [initialImages.length]); // Only depend on length to avoid infinite loop, and only restore on mount

  // Keep ref updated
  onImagesChangeRef.current = onImagesChange;

  // Store file objects with previews
  const [imageFiles, setImageFiles] = useState<Map<string, ImageFile>>(new Map());

  // Sync imageFiles with parent when it changes (but not during initial render)
  // Disabled to avoid conflicts with notifyImagesChange calls
  // useEffect(() => {
  //   const doneFiles = fileList.filter((f) => f.status === "done");
  //   if (doneFiles.length > 0 && imageFiles.size > 0) {
  //     const imageFilesArray: ImageFile[] = [];
  //     doneFiles.forEach((file) => {
  //       const imageFile = imageFiles.get(file.uid);
  //       if (imageFile) {
  //         imageFilesArray.push(imageFile);
  //       }
  //     });
  //     if (imageFilesArray.length > 0) {
  //       // Use setTimeout to avoid calling during render
  //       setTimeout(() => {
  //         onImagesChangeRef.current(imageFilesArray);
  //       }, 0);
  //     }
  //   }
  // }, [imageFiles, fileList]);

  // Calculate image count from fileList
  const doneFiles = fileList.filter((f) => f.status === "done");
  const imageCount = doneFiles.length;

  // Helper function to extract image files and notify parent
  const notifyImagesChange = (files: UploadFile[], imageFilesMap?: Map<string, ImageFile>) => {
    const doneFiles = files.filter((f) => f.status === "done");
    const imageFilesArray: ImageFile[] = [];
    const mapToUse = imageFilesMap || imageFiles;
    
    console.log("notifyImagesChange - doneFiles:", doneFiles.length, "mapSize:", mapToUse.size);
    
    doneFiles.forEach((file) => {
      const imageFile = mapToUse.get(file.uid);
      if (imageFile) {
        imageFilesArray.push(imageFile);
      } else {
        console.warn("ImageFile not found for uid:", file.uid);
      }
    });
    
    console.log("notifyImagesChange - imageFilesArray:", imageFilesArray.length);
    onImagesChangeRef.current(imageFilesArray);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    console.log("handleChange - newFileList length:", newFileList.length);
    // Merge with existing fileList to preserve files that were processed in customRequest
    setFileList((prev) => {
      // Keep all files that are already done (processed in customRequest)
      const doneFiles = prev.filter((f) => f.status === "done" && f.url);
      console.log("handleChange - doneFiles length:", doneFiles.length);
      
      // Add new files from newFileList that aren't already in doneFiles
      // These are files that are still uploading or just added
      const newFiles = newFileList.filter(
        (f) => !doneFiles.some((df) => df.uid === f.uid) && f.status !== "done"
      );
      console.log("handleChange - newFiles length:", newFiles.length);
      
      const merged = [...doneFiles, ...newFiles];
      console.log("handleChange - merged length:", merged.length);
      
      // Don't notify here - let customRequest handle it to avoid duplicate calls
      // The notification will be done in customRequest when each file is processed
      
      return merged;
    });
  };

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    
    // Remove from imageFiles map
    setImageFiles((prev) => {
      const newMap = new Map(prev);
      newMap.delete(file.uid);
      
      // Notify parent after state update
      setTimeout(() => {
        notifyImagesChange(newFileList, newMap);
      }, 0);
      
      return newMap;
    });
    
    setFileList(newFileList);
    
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
        
        // Compress image before converting to base64 to reduce payload size
        const compressImage = (file: File, maxWidth: number = 1600, maxHeight: number = 1600, quality: number = 0.7): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new window.Image(); // Use window.Image to avoid conflict with antd Image component
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                  if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                  }
                } else {
                  if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                  }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  reject(new Error('Could not get canvas context'));
                  return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
              };
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
        };

        // Compress and convert file to base64 for preview
        const base64Preview = await compressImage(file as File);
        
        // Store file with preview
        const fileObj = file as UploadFile;
        const imageFile: ImageFile = {
          file: file as File,
          preview: base64Preview,
        };
        
        // Update the file in fileList with preview URL
        setFileList((prev) => {
          console.log("customRequest - prev fileList length:", prev.length, "fileObj.uid:", fileObj.uid);
          
          // Check if file already exists
          const existingIndex = prev.findIndex(
            (f) => f.uid === fileObj.uid || 
                   (f.name === fileObj.name && f.status === "uploading")
          );
          
          let updated: UploadFile[];
          if (existingIndex >= 0) {
            // Update existing file
            updated = prev.map((f, index) => {
              if (index === existingIndex) {
                return {
                  ...f,
                  status: "done" as const,
                  url: base64Preview, // Use base64 for preview
                };
              }
              return f;
            });
          } else {
            // Add new file if it doesn't exist
            updated = [
              ...prev,
              {
                uid: fileObj.uid,
                name: fileObj.name || `image-${prev.length + 1}`,
                status: "done" as const,
                url: base64Preview,
              },
            ];
          }
          
          console.log("customRequest - updated fileList length:", updated.length, "done files:", updated.filter(f => f.status === "done").length);
          
          // Update imageFiles and prepare map for notification
          setImageFiles((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.set(fileObj.uid, imageFile);
            console.log("customRequest - imageFiles map size:", newMap.size);
            
            // Notify parent with ALL done files
            // Get all previously done files from prev + current file
            const prevDoneFiles = prev.filter((f) => f.status === "done" && f.url);
            const currentDoneFile = updated.find((f) => f.uid === fileObj.uid && f.status === "done");
            const allDoneFiles = currentDoneFile 
              ? [...prevDoneFiles.filter(f => f.uid !== fileObj.uid), currentDoneFile]
              : prevDoneFiles;
            
            console.log("customRequest - prevDoneFiles:", prevDoneFiles.length, "allDoneFiles:", allDoneFiles.length, "uids:", allDoneFiles.map(f => f.uid));
            
            // Notify parent after state update
            setTimeout(() => {
              notifyImagesChange(allDoneFiles, newMap);
            }, 0);
            
            return newMap;
          });
          
          return updated;
        });
        
        onProgress?.({ percent: 100 });
        onSuccess?.(base64Preview);
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
                    <AntImage
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
