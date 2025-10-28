import {Box, Button, Heading} from "@primer/react";
import {AlertIcon} from "@primer/octicons-react";

interface Props {
    toggleBannerFunction: () => void;
}

function WarningBanner({toggleBannerFunction}: Props) {
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
            <Heading as="h2" sx={{mb: 2}}>Welcome to TPS Viewer</Heading>
            <Box as="p" sx={{mb: 3, color: 'fg.muted'}}>
                Please Ensure that you know what you're doing, otherwise you may irreperably damage your reputation.

            </Box>
            <Box sx={{mb: 3, color: 'fg.muted'}}>This tool shows correlation and not causation. Use at your own risk.</Box>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
                <Button trailingVisual={AlertIcon } onClick={toggleBannerFunction} variant="danger">Proceed</Button>
            </Box>
        </Box>
    );
}
export default WarningBanner;