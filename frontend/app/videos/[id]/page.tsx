"use client";

import { useState, useEffect, use } from "react";
import { getVideo } from "@/lib/api";
import { Video } from "@/lib/types";
import { formatTimestamp } from "@/lib/api";
import TranscriptPanel from "@/components/TranscriptPanel";
import FramePreview from "@/components/FramePreview";

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [video, setVideo] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"transcript" | "frames">("transcript");
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const data = await getVideo(resolvedParams.id);
                setVideo(data);
            } catch (error) {
                console.error("Failed to fetch video:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [resolvedParams.id]);

    const handleSeek = (time: number) => {
        setCurrentTime(time);
        // If there's a video element, seek to time
        const videoEl = document.querySelector("video");
        if (videoEl) {
            videoEl.currentTime = time;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!video) {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">😕</div>
                <h1 className="text-2xl font-bold mb-2">Video Not Found</h1>
                <a href="/videos" className="text-indigo-400 hover:underline">
                    Back to videos
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <a href="/videos" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
                        ← Back to videos
                    </a>
                    <h1 className="text-3xl font-bold">{video.title}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{formatTimestamp(video.duration_seconds || 0)}</span>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${video.status === "ready"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                                }`}
                        >
                            {video.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                {video.file_path ? (
                    <video
                        id="main-video"
                        src={`http://localhost:8000/static/videos/${video.id}${video.file_path.substring(video.file_path.lastIndexOf('.'))}`}
                        className="w-full h-full object-contain"
                        controls
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <p>Video file not available</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-800">
                <button
                    onClick={() => setActiveTab("transcript")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "transcript"
                        ? "text-indigo-400 border-b-2 border-indigo-400"
                        : "text-gray-400 hover:text-white"
                        }`}
                >
                    📝 Transcript
                </button>
                <button
                    onClick={() => setActiveTab("frames")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "frames"
                        ? "text-indigo-400 border-b-2 border-indigo-400"
                        : "text-gray-400 hover:text-white"
                        }`}
                >
                    🖼️ Key Frames
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "transcript" ? (
                    <TranscriptPanel
                        videoId={resolvedParams.id}
                        currentTime={currentTime}
                        onSeek={handleSeek}
                    />
                ) : (
                    <FramePreview
                        videoId={resolvedParams.id}
                        onSeek={handleSeek}
                    />
                )}
            </div>
        </div>
    );
}
