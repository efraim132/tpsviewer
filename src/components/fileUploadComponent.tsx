import {Box, Button, Heading} from "@primer/react";
import {FileCodeIcon, UploadIcon} from "@primer/octicons-react";
import {useState} from "react";

interface Props {
    toggleBannerFunction: () => void,
    setFileContentFunction: (file: File) => void,
}

function FileUpload({toggleBannerFunction, setFileContentFunction}: Props) {
    // State to track if user is dragging over the drop zone
    const [isDragging, setIsDragging] = useState(false);

    // Prevent default behavior (prevents file from opening in browser)
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);  // Show visual feedback
    };

    // When user drags away from the drop zone
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);  // Remove visual feedback
    };

    // When user drops the file
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();  // Prevent file from opening
        setIsDragging(false);
        console.log("File dropped");
        // Get the files that were dropped
        const files = e.dataTransfer.files;

        if (files.length > 0) {
            const file = files[0];  // Get first file
            console.log('File dropped:', file.name);
            // TODO: Add your file upload logic here
            // For example: uploadFile(file);
            setFileContentFunction(file);
        }
    };


    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: 'border.default',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                mb: 4,
                bg: 'canvas.default',
            }}
        >
            <Heading as="h2" sx={{mb: 2}}>Upload your file here</Heading>
            <Box as="p" sx={{mb: 3, color: 'fg.muted'}}>
                Please upload a valid TPS file to proceed.
            </Box>
            <Box
                sx={{
                    backgroundColor: 'var(--bgColor-inset)',
                    borderRadius: 'var(--borderRadius-medium)',
                    padding: 'var(--stack-padding-spacious)',
                }}
            >

            </Box>

            <Box
                onDragOver={handleDragOver}    // Fires when dragging over
                onDragLeave={handleDragLeave}  // Fires when dragging away
                onDrop={handleDrop}            // Fires when file is dropped
                sx={{
                    border: '1px solid',
                    borderColor: isDragging ? 'accent.emphasis' : 'border.default',  // Change color when dragging
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    mb: 4,
                    bg: isDragging ? 'accent.subtle' : 'canvas.subtle',  // Change background when dragging
                    minHeight: '200px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',  // Shows it's interactive
                    transition: 'all 0.2s'  // Smooth color transition
                }}
            >
                <FileCodeIcon size={24}/>
                [ File Upload Component Placeholder ]
            </Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button trailingVisual={UploadIcon} onClick={toggleBannerFunction} variant="primary">Upload</Button>
            </Box>

        </Box>
    );
}

export default FileUpload;