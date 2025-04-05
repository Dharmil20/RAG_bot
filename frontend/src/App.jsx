// import axios from "axios";
// import { useRef, useState } from "react";
import ChatInput from "./components/ChatInput";
// import FileUploadButton from "./components/FileUploadButton";

function App() {
  // const fileInputRef = useRef(null);
  // const [progress, setProgress] = useState(0);
  // const [isUploading, setIsUploading] = useState(false);

  // const handleUpload = async (e) => {
  //   e.preventDefault();

  //   const file = fileInputRef.current.files[0];
  //   if (!file) {
  //     console.log("No File Selected!");
  //     return;
  //   }

  //   setIsUploading(true);
  //   setProgress(0); // Reset progress

  //   const formData = new FormData();
  //   formData.append("docUpload", file);

  //   try {
  //     const res = await axios.post(
  //       "http://localhost:3000/api/upload",
  //       formData,
  //       {
  //         headers: { "Content-Type": "multipart/form-data" },
  //         onUploadProgress: (progressEvent) => {
  //           if (progressEvent.total) {
  //             const percent = Math.round(
  //               (progressEvent.loaded * 100) / progressEvent.total
  //             );
  //             setProgress(percent);
  //           }
  //         },
  //       }
  //     );

  //     console.log("File uploaded successfully!", res.data);
  //   } catch (error) {
  //     console.log("Error uploading file", error);
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  return (
    <>
      {/* <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
        <input
          type="file"
          name="docUpload"
          ref={fileInputRef}
          disabled={isUploading}
        />
        <button
          type="button"
          onClick={handleUpload}
          style={{ marginTop: "10px" }}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div> */}
      <ChatInput></ChatInput>
      {/* <FileUploadButton></FileUploadButton> */}
    </>
  );
}

export default App;
