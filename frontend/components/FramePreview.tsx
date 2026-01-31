"use client";

import { useState, useEffect } from "react";
import { formatTimestamp, API_BASE, BACKEND_BASE } from "@/lib/api";

interface Frame {
    timestamp: number;
    file_path: string;
    caption?: string;
}

interface FramePreviewProps {
    videoId: string;
    onSeek?: (time: number) => void;
}

export default function FramePreview({ videoId, onSeek }: FramePreviewProps) {
    const [frames, setFrames] = useState<Frame[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);

    useEffect(() => {
        const fetchFrames = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/videos/${videoId}/frames`
                );
                if (response.ok) {
                    const data = await response.json();
                    setFrames(data.frames || []);
                }
            } catch (error) {
                console.error("Failed to fetch frames:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFrames();
    }, [videoId]);

    if (loading) {
        return (
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="aspect-video bg-gray-800 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    if (frames.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No frames extracted
            </div>
        );
    }

    const getFrameUrl = (path: string) => {
        const parts = path.replace(/\\/g, "/").split("/");
        const filename = parts.pop() || "";
        const videoIdFromPath = parts.pop();
        const relative = videoIdFromPath ? `${videoIdFromPath}/${filename}` : filename;
        return `${BACKEND_BASE}/static/frames/${relative}`;
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">🖼️ Key Frames</h3>

            {/* Frame Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
                {frames.slice(0, 24).map((frame, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            setSelectedFrame(frame);
                            onSeek?.(frame.timestamp);
                        }}
                        className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-indigo-500 ${selectedFrame === frame ? "ring-2 ring-indigo-500" : ""
                            }`}
                    >
                        <img
                            src={getFrameUrl(frame.file_path)}
                            alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                            <span className="text-xs font-mono">
                                {formatTimestamp(frame.timestamp)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected Frame Detail */}
            {selectedFrame && (
                <div className="bg-gray-900 rounded-xl p-4">
                    <div className="flex gap-4">
                        <img
                            src={getFrameUrl(selectedFrame.file_path)}
                            alt="Selected frame"
                            className="w-64 h-36 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-2">
                                Timestamp: <span className="text-white font-mono">{formatTimestamp(selectedFrame.timestamp)}</span>
                            </p>
                            {selectedFrame.caption && (
                                <p className="text-sm text-gray-300">{selectedFrame.caption}</p>
                            )}

                            {/* Visual Tags */}
                            {(selectedFrame as any).tags && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {JSON.parse((selectedFrame as any).tags).map((tag: string) => (
                                        <span key={tag} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => onSeek?.(selectedFrame.timestamp)}
                                className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm transition-colors"
                            >
                                Jump to timestamp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
