import {Box, Button, Heading, Text} from '@primer/react';
import { useState, useEffect, useRef } from 'react';

// Types
interface TimePoint {
    index: number;
    timestamp: string;
    tps: number;
    players: string[];
}

interface PlayerStat {
    name: string;
    tpsValues: number[];
    count: number;
}

interface PlayerScore {
    name: string;
    avgTPS: number;
    count: number;
}

// Define the props interface
interface Props {
    file: File | null; // Accept a File object or null
    resetFileFunction: () => void;
}

function TPSHeatmap({ file, resetFileFunction }: Props) {
    // Reference to the canvas element
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // State to store time series data
    const [timeSeriesData, setTimeSeriesData] = useState<TimePoint[]>([]);
    // State to store player scores
    const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
    // State to track if we're loading the file
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // State to track any errors
    const [error, setError] = useState<string | null>(null);
    // State to store hover info (which point is being hovered)
    const [hoverInfo, setHoverInfo] = useState<TimePoint | null>(null);
    // State to store mouse position for tooltip
    const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const renderTooltip = (info: TimePoint) => (
        <Box
            sx={{
                position: 'fixed',
                left: mousePos.x + 15,
                top: mousePos.y + 15,
                backgroundColor: 'canvas.default',
                border: '2px solid',
                borderColor: 'border.default',
                borderRadius: 2,
                p: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 200,
                maxWidth: 300,
                zIndex: 1000,
                pointerEvents: 'none'
            }}
        >
            <Text sx={{ fontWeight: 'bold', fontSize: 12, color: 'fg.muted', mb: 1 }}>
                {info.timestamp}
            </Text>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'border.default'
            }}>
                <Text sx={{ fontSize: 14, fontWeight: 'bold' }}>TPS:</Text>
                <Box sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bg: getTpsColor(info.tps),
                    fontWeight: 'bold',
                    fontSize: 16
                }}>
                    {info.tps.toFixed(2)}
                </Box>
            </Box>
            <Text sx={{ fontWeight: 'bold', fontSize: 12, mb: 1 }}>
                Players Online ({info.players.length}):
            </Text>
            <Box sx={{ maxHeight: 200, overflowY: 'auto', fontSize: 12 }}>
                {info.players.map((player: string, index: number) => (
                    <Text
                        key={index}
                        sx={{ display: 'block', py: 0.5, px: 1, borderRadius: 1, bg: index % 2 === 0 ? 'canvas.subtle' : 'transparent' }}
                    >
                        {player}
                    </Text>
                ))}
            </Box>
        </Box>
    );

    useEffect(() => {
        // If no file is provided, clear data and return
        if (!file) {
            setTimeSeriesData([]);
            setPlayerScores([]);
            return;
        }

        // Function to read and parse the file
        const parseFile = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Read the file as text
                const text = await file.text();

                // Parse the CSV data
                const lines = text.trim().split('\n');

                // Skip header row (first line)
                const dataLines = lines.slice(1);

                // Array to store time series points
                const tsData: TimePoint[] = [];
                const playerStats: Record<string, PlayerStat> = {};

                // Process each line of data
                dataLines.forEach((line, index) => {
                    const parts = line.split(',');
                    const timestamp = parts[0]; // Keep timestamp as string
                    const tps = parseFloat(parts[1]); // Convert TPS string to number
                    const players = parts[2] ? parts[2].split(';') : []; // Split players by semicolon

                    // Add to time series data
                    tsData.push({
                        index: index,
                        timestamp: timestamp,
                        tps: tps,
                        players: players
                    });

                    // For each player in this timestamp
                    players.forEach((player: string) => {
                        // If we haven't seen this player before, create their entry
                        if (!playerStats[player]) {
                            playerStats[player] = { name: player, tpsValues: [], count: 0 };
                        }
                        // Add this TPS value to their list
                        playerStats[player].tpsValues.push(tps);
                        playerStats[player].count++;
                    });
                });

                const scores: PlayerScore[] = (Object.values(playerStats) as PlayerStat[]).map((player: PlayerStat) => {
                    const avgTPS = player.tpsValues.reduce((sum: number, val: number) => sum + val, 0) / Math.max(player.count, 1);
                    return { name: player.name, avgTPS, count: player.count };
                });

                // Sort players by average TPS (lowest first = worst performers)
                scores.sort((a, b) => a.avgTPS - b.avgTPS);

                setTimeSeriesData(tsData);
                setPlayerScores(scores);
                setIsLoading(false);
            } catch (err: unknown) {
                // If there's an error reading or parsing the file
                const message = err instanceof Error ? err.message : 'Failed to parse file';
                setError(message);
                setIsLoading(false);
            }
        };

        // Call the parse function
        parseFile();
    }, [file]); // Re-run when file changes

    // Helper function to get color based on TPS value
    // Red = bad (0 TPS), Yellow = medium, Green = good (20 TPS)
    const getTpsColor = (tps: number): string => {
        // Normalize TPS from 0-20 range to 0-1 range
        const normalized = Math.max(0, Math.min(1, tps / 20));

        let r: number, g: number, b: number;
        if (normalized < 0.5) {
            // Red to Yellow (0.0 to 0.5)
            // At 0: full red (255, 0, 0)
            // At 0.5: yellow (255, 255, 0)
            r = 255;
            g = Math.round(normalized * 2 * 255); // Green increases
            b = 0;
        } else {
            // Yellow to Green (0.5 to 1.0)
            // At 0.5: yellow (255, 255, 0)
            // At 1.0: green (0, 255, 0)
            r = Math.round((1 - normalized) * 2 * 255); // Red decreases
            g = 255;
            b = 0;
        }

        return `rgb(${r}, ${g}, ${b})`;
    };

    // Handler for mouse movement over canvas
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
        if (!canvasRef.current || timeSeriesData.length === 0) return;
        const canvas = canvasRef.current as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect(); // Get canvas position on screen

        // Calculate mouse position relative to canvas
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Store mouse position for tooltip placement
        setMousePos({ x: e.clientX, y: e.clientY });

        // Graph dimensions (same as in drawing code)
        const marginLeft = 60;
        const marginRight = 150;
        const marginTop = 40;
        const marginBottom = 60;
        const graphWidth = canvas.width - marginLeft - marginRight;
        const graphHeight = canvas.height - marginTop - marginBottom;

        // Helper function to convert data index to X pixel position
        const indexToX = (index: number): number => {
            const normalized = index / Math.max(timeSeriesData.length - 1, 1);
            return marginLeft + (normalized * graphWidth);
        };

        // Helper function to convert TPS value to Y pixel position
        const tpsToY = (tps: number): number => {
            const normalized = (tps - 0) / 20; // 0..1
            return marginTop + (normalized * graphHeight);
        };

        // Check each data point to see if mouse is near it
        let foundPoint: TimePoint | null = null;
        const hoverRadius = 8; // How close mouse needs to be (in pixels)

        for (let i = 0; i < timeSeriesData.length; i++) {
            const point = timeSeriesData[i];
            const pointX = indexToX(i);
            const pointY = tpsToY(point.tps);

            // Calculate distance between mouse and point
            const distance = Math.sqrt(
                Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2)
            );

            // If mouse is close enough to this point
            if (distance <= hoverRadius) {
                foundPoint = point;
                break; // Stop checking once we find a point
            }
        }

        // Update hover info state
        setHoverInfo(foundPoint);
    };

    // Handler for when mouse leaves the canvas
    const handleMouseLeave = (): void => {
        setHoverInfo(null); // Clear hover info
    };

    useEffect(() => {
        // Draw the graph when data is ready
        if (timeSeriesData.length === 0 || !canvasRef.current) return;
        const canvas = canvasRef.current as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Define margins for axis labels
        const marginLeft = 60;
        const marginRight = 150;
        const marginTop = 40;
        const marginBottom = 60;

        // Calculate drawing area
        const graphWidth = width - marginLeft - marginRight;
        const graphHeight = height - marginTop - marginBottom;

        // Y-axis goes from 0 (top) to 20 (bottom)
        const minTPS = 0;
        const maxTPS = 20;

        // Helper function to convert TPS value to Y pixel position
        const tpsToY = (tps: number): number => {
            // Map TPS range [0, 20] to pixel range [marginTop, marginTop + graphHeight]
            const normalized = (tps - minTPS) / (maxTPS - minTPS); // 0 to 1
            return marginTop + (normalized * graphHeight);
        };

        // Helper function to convert data index to X pixel position
        const indexToX = (index: number): number => {
            const normalized = index / Math.max(timeSeriesData.length - 1, 1); // 0 to 1
            return marginLeft + (normalized * graphWidth);
        };

        // Draw colored background zones
        // Red zone (0-10 TPS) = bad performance
        const redZoneHeight = (10 / 20) * graphHeight;
        ctx.fillStyle = 'rgba(255, 100, 100, 0.1)'; // Light red
        ctx.fillRect(marginLeft, marginTop, graphWidth, redZoneHeight);

        // Yellow zone (10-15 TPS) = medium performance
        const yellowZoneStart = marginTop + redZoneHeight;
        const yellowZoneHeight = (5 / 20) * graphHeight;
        ctx.fillStyle = 'rgba(255, 255, 100, 0.1)'; // Light yellow
        ctx.fillRect(marginLeft, yellowZoneStart, graphWidth, yellowZoneHeight);

        // Green zone (15-20 TPS) = good performance
        const greenZoneStart = yellowZoneStart + yellowZoneHeight;
        const greenZoneHeight = (5 / 20) * graphHeight;
        ctx.fillStyle = 'rgba(100, 255, 100, 0.1)'; // Light green
        ctx.fillRect(marginLeft, greenZoneStart, graphWidth, greenZoneHeight);

        // Draw Y-axis
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(marginLeft, marginTop);
        ctx.lineTo(marginLeft, marginTop + graphHeight);
        ctx.stroke();

        // Draw X-axis
        ctx.beginPath();
        ctx.moveTo(marginLeft, marginTop + graphHeight);
        ctx.lineTo(marginLeft + graphWidth, marginTop + graphHeight);
        ctx.stroke();

        // Draw Y-axis labels and grid lines
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 20; i += 5) {
            const y = tpsToY(i);
            ctx.fillText(i.toString(), marginLeft - 10, y + 4);

            // Draw grid line
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(marginLeft, y);
            ctx.lineTo(marginLeft + graphWidth, y);
            ctx.stroke();
        }

        // Draw Y-axis label
        ctx.save();
        ctx.translate(20, marginTop + graphHeight / 2);
        ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('TPS (Ticks Per Second)', 0, 0);
        ctx.restore();

        // Draw X-axis labels
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333';
        const firstTime = timeSeriesData[0].timestamp.split(' ')[1] ?? timeSeriesData[0].timestamp; // Time part fallback
        const lastTime = timeSeriesData[timeSeriesData.length - 1].timestamp.split(' ')[1] ?? timeSeriesData[timeSeriesData.length - 1].timestamp;
        ctx.fillText(firstTime, marginLeft, marginTop + graphHeight + 20);
        ctx.fillText(lastTime, marginLeft + graphWidth, marginTop + graphHeight + 20);

        // Draw X-axis label
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Time', marginLeft + graphWidth / 2, marginTop + graphHeight + 45);

        // Draw TPS line graph with color gradient
        ctx.lineWidth = 3;
        timeSeriesData.forEach((point, index) => {
            if (index === 0) return; // Skip first point

            const x1 = indexToX(index - 1);
            const y1 = tpsToY(timeSeriesData[index - 1].tps);
            const x2 = indexToX(index);
            const y2 = tpsToY(point.tps);

            // Use color based on current TPS value
            ctx.strokeStyle = getTpsColor(point.tps);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });

        // Draw dots at each data point with color
        timeSeriesData.forEach((point, index) => {
            const x = indexToX(index);
            const y = tpsToY(point.tps);
            ctx.fillStyle = getTpsColor(point.tps);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI); // Draw circle with radius 4
            ctx.fill();

            // Add white border for visibility
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

    }, [timeSeriesData, playerScores]); // Re-draw when data changes

    return (
        <Box sx={{ mt:10,p: 4 }}>
            {/* Header with button on far left */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start', // Align items to the left
                mt: 50,
                mb: 2
            }}>
                <Heading sx={{ ml: 3, mb: 0 }}>TPS Performance Analysis</Heading>
                <Button variant="primary" sx={{ ml: 'auto' }} onClick={resetFileFunction}>Upload a new file</Button>
            </Box>

            <Text sx={{ mb: 3, color: 'fg.muted' }}>
                Color-coded TPS over time. Green = good performance (20 TPS), Yellow = medium, Red = poor performance (0 TPS).
            </Text>

            {/* Show loading state */}
            {isLoading && (
                <Box sx={{
                    textAlign: 'center',
                    p: 4,
                    border: '1px solid',
                    borderColor: 'border.default',
                    borderRadius: 2,
                    bg: 'canvas.subtle'
                }}>
                    <Text>Loading file...</Text>
                </Box>
            )}

            {/* Show error state */}
            {error && (
                <Box sx={{
                    p: 3,
                    border: '1px solid',
                    borderColor: 'danger.emphasis',
                    borderRadius: 2,
                    bg: 'danger.subtle',
                    mb: 3
                }}>
                    <Text sx={{ fontWeight: 'bold', color: 'danger.fg' }}>Error: {error}</Text>
                </Box>
            )}

            {/* Show empty state if no file */}
            {!file && !isLoading && (
                <Box sx={{
                    textAlign: 'center',
                    p: 4,
                    border: '1px solid',
                    borderColor: 'border.default',
                    borderRadius: 2,
                    bg: 'canvas.subtle'
                }}>
                    <Text sx={{ fontSize: 16, color: 'fg.muted' }}>
                        Please upload a TPS CSV file to view the analysis.
                    </Text>
                </Box>
            )}

            {/* Show graph and data only when we have data */}
            {!isLoading && !error && timeSeriesData.length > 0 && (
                <>
                    {/* Legend */}
                    <Box sx={{
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'border.default',
                        borderRadius: 2,
                        bg: 'canvas.subtle'
                    }}>
                        <Text sx={{ fontWeight: 'bold' }}>Performance Zones:</Text>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 30,
                                height: 20,
                                backgroundColor: 'rgb(255, 0, 0)',
                                border: '1px solid',
                                borderColor: 'border.default',
                                borderRadius: 1
                            }} />
                            <Text sx={{ fontSize: 14 }}>0-10 TPS (Bad)</Text>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 30,
                                height: 20,
                                backgroundColor: 'rgb(255, 255, 0)',
                                border: '1px solid',
                                borderColor: 'border.default',
                                borderRadius: 1
                            }} />
                            <Text sx={{ fontSize: 14 }}>10-15 TPS (Medium)</Text>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                                width: 30,
                                height: 20,
                                backgroundColor: 'rgb(0, 255, 0)',
                                border: '1px solid',
                                borderColor: 'border.default',
                                borderRadius: 1
                            }} />
                            <Text sx={{ fontSize: 14 }}>15-20 TPS (Good)</Text>
                        </Box>
                    </Box>

                    <Box sx={{
                        border: '1px solid',
                        borderColor: 'border.default',
                        borderRadius: 2,
                        p: 3,
                        bg: 'canvas.default',
                        overflow: 'auto',
                        position: 'relative' // Make this a positioning context for the tooltip
                    }}>
                        <canvas
                            ref={canvasRef}
                            width={1200}
                            height={500}
                            style={{ display: 'block', cursor: 'crosshair' }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        />

                        {/* Tooltip that appears on hover */}
                        {hoverInfo ? renderTooltip(hoverInfo) : null}
                    </Box>

                    {/* Player rankings */}
                    <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                        {/* Worst performers */}
                        <Box>
                            <Heading as="h2" sx={{ mb: 2, fontSize: 18 }}>
                                ⚠️ Players Associated with Low TPS
                            </Heading>
                            <Text sx={{ mb: 2, fontSize: 12, color: 'fg.muted' }}>
                                Players who were online during the lowest average TPS periods
                            </Text>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {playerScores.slice(0, 5).map((player: PlayerScore, index: number) => (
                                    <Box
                                        key={player.name}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 2,
                                            border: '2px solid',
                                            borderColor: index === 0 ? 'danger.emphasis' : 'border.default',
                                            borderRadius: 2,
                                            bg: index === 0 ? 'danger.subtle' : 'canvas.subtle'
                                        }}
                                    >
                                        <Box>
                                            <Text sx={{ fontWeight: 'bold', fontSize: 14 }}>
                                                #{index + 1} {player.name}
                                            </Text>
                                            <Text sx={{ fontSize: 12, color: 'fg.muted' }}>
                                                {player.count} samples
                                            </Text>
                                        </Box>
                                        <Box sx={{ px: 2, py: 1, borderRadius: 2, bg: getTpsColor(player.avgTPS), fontWeight: 'bold' }}>
                                            {player.avgTPS.toFixed(2)} TPS
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {/* Best performers */}
                        <Box>
                            <Heading as="h2" sx={{ mb: 2, fontSize: 18 }}>
                                ✅ Players Associated with High TPS
                            </Heading>
                            <Text sx={{ mb: 2, fontSize: 12, color: 'fg.muted' }}>
                                Players who were online during the highest average TPS periods
                            </Text>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {playerScores.slice().reverse().slice(0, 5).map((player: PlayerScore, index: number) => (
                                    <Box
                                        key={player.name}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 2,
                                            border: '2px solid',
                                            borderColor: index === 0 ? 'success.emphasis' : 'border.default',
                                            borderRadius: 2,
                                            bg: index === 0 ? 'success.subtle' : 'canvas.subtle'
                                        }}
                                    >
                                        <Box>
                                            <Text sx={{ fontWeight: 'bold', fontSize: 14 }}>
                                                #{index + 1} {player.name}
                                            </Text>
                                            <Text sx={{ fontSize: 12, color: 'fg.muted' }}>
                                                {player.count} samples
                                            </Text>
                                        </Box>
                                        <Box sx={{ px: 2, py: 1, borderRadius: 2, bg: getTpsColor(player.avgTPS), fontWeight: 'bold' }}>
                                            {player.avgTPS.toFixed(2)} TPS
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    );
}

export default TPSHeatmap;
