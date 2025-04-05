import { useRef, useState } from "react";
import axios from "axios";

function FileUploadButton() {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  // const [fileName, setFileName] = useState("")

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // setFileName(file.name);
      // You can auto-upload here if you want
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("docUpload", file);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("File uploaded successfully!", res.data);
    } catch (error) {
      console.log("Error uploading file", error);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isUploading}
        style={{
          padding: "10px 20px",
          backgroundColor: "#f0f0f0",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: isUploading ? "not-allowed" : "pointer",
          display: "flex",
          width: "fit-content",
        }}
      >
        {isUploading ? "Uploading..." : "Choose File & Upload"}
      </button>
    </div>
  );
}

export default FileUploadButton;
