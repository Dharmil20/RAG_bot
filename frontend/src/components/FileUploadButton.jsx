import { useRef, useState } from "react";
import axios from "axios";
import { FiPlus } from "react-icons/fi";

function FileUploadButton() {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    <div className="p-1 max-w-md flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={triggerFileInput}
        disabled={isUploading}
        className={`px-1 py-1 bg-white text-black border border-gray-300 rounded-full flex w-fit ${
          isUploading ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {isUploading ? <span className="loading loading-spinner loading-xs"></span> : <FiPlus size={18} />}
      </button>
    </div>
  );
}

export default FileUploadButton;