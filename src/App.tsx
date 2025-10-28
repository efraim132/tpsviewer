import './App.css'
import { useState } from "react";
import WarningBanner from "./components/warningBanner.tsx";
import FileUploadComponent from "./components/fileUploadComponent.tsx";
import TPSHeatmap from "./components/heatmap.tsx";

export default function App() {
    const [showWarning, setShowWarning] = useState(true)
    const [fileUploaded, setFileUploaded] = useState(false)
    const [fileContent, fileContentSet] = useState<File>(new File([], ""));

    function setFileContent(file: File) {
        console.log("Setting file content in App: " + file.name);
        fileContentSet(file);
        setFileUploaded(true);
    }

    function resetAll() {
        setFileUploaded(false);
        fileContentSet(new File([], ""));
    }

    // Show warning banner on initial load
    if (showWarning) {
        return (
            <WarningBanner toggleBannerFunction={ () => setShowWarning(!showWarning)}/>
        )
    }

    if (!fileUploaded){
        return (
            <FileUploadComponent toggleBannerFunction={
                () => setFileUploaded(!fileUploaded)} setFileContentFunction={setFileContent}
                />
        )
    }
    console.log("From App: " + fileContent.name);
    return (
        <TPSHeatmap file={fileContent} resetFileFunction={resetAll}/>
    )
}
