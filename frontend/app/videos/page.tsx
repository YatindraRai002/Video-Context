"use client";

import { useState, useEffect } from "react";
import { getVideos } from "@/lib/api";
import { Video } from "@/lib/types";
import { formatTimestamp } from "@/lib/api";

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const data = await getVideos();
                setVideos(data.videos);
            } catch (error) {
                console.error("Failed to fetch videos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ready":
                return "bg-green-500/20 text-green-400";
            case "processing":
            case "transcribing":
            case "extracting_audio":
            case "extracting_frames":
            case "embedding":
                return "bg-yellow-500/20 text-yellow-400";
            case "failed":
                return "bg-red-500/20 text-red-400";
            default:
                return "bg-gray-500/20 text-gray-400";
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Your Videos</h1>
                <a
                    href="/upload"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    + Upload
                </a>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
                            <div className="h-40 bg-gray-700 rounded-lg mb-4" />
                            <div className="h-5 bg-gray-700 rounded w-2/3 mb-2" />
                            <div className="h-4 bg-gray-700 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📹</div>
                    <p className="text-xl text-gray-400 mb-4">No videos yet</p>
                    <a
                        href="/upload"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        Upload your first video
                    </a>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => (
                        <div
                            key={video.id}
                            className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors"
                        >
                            <div className="h-40 bg-gray-900 flex items-center justify-center text-4xl">
                                🎬
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold truncate">{video.title}</h3>
                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-sm text-gray-400">
                                        {video.duration_seconds
                                            ? formatTimestamp(video.duration_seconds)
                                            : "—"}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            video.status
                                        )}`}
                                    >
                                        {video.status}
                                    </span>
                                </div>
                                {video.status !== "ready" && video.processing_progress > 0 && (
                                    <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all"
                                            style={{ width: `${video.processing_progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
