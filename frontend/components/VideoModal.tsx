"use client";

import { useEffect, useState } from "react";
import { getVideo } from "@/lib/api";
import { Video } from "@/lib/types";
import { formatTimestamp } from "@/lib/api";

interface VideoModalProps {
    videoId: string;
    timestamp: number;
    onClose: () => void;
}

export default function VideoModal({ videoId, timestamp, onClose }: VideoModalProps) {
    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const data = await getVideo(videoId);
                setVideo(data);
            } catch (error) {
                console.error("Failed to fetch video:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [videoId]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-semibold truncate">
                        {loading ? "Loading..." : video?.title || "Video"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="aspect-video bg-gray-800 rounded-xl animate-pulse" />
                    ) : video ? (
                        <div className="space-y-4">
                            {/* Real Video Player */}
                            <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                                <video
                                    src={`http://localhost:8000/static/videos/${video.file_path ? video.file_path.split(/[/\\]/).pop() : ''}`}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                    onLoadedMetadata={(e) => {
                                        e.currentTarget.currentTime = timestamp;
                                    }}
                                />
                            </div>

                            {/* Video Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="text-gray-500 mb-1">Duration</div>
                                    <div className="font-medium">
                                        {video.duration_seconds
                                            ? formatTimestamp(video.duration_seconds)
                                            : "Unknown"}
                                    </div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="text-gray-500 mb-1">Status</div>
                                    <div className="font-medium capitalize">{video.status}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Video not found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
