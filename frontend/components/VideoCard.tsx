"use client";

import { useState } from "react";
import { SearchResult } from "@/lib/types";
import { formatTimestamp, API_BASE, BACKEND_BASE } from "@/lib/api";
import VideoModal from "./VideoModal";

interface VideoCardProps {
    result: SearchResult;
}

export default function VideoCard({ result }: VideoCardProps) {
    const [showModal, setShowModal] = useState(false);
    const score = Math.round(result.score * 100);

    const getMatchTypeIcon = () => {
        switch (result.match_type) {
            case "transcript":
                return "📝";
            case "frame":
                return "🖼️";
            case "both":
                return "✨";
            default:
                return "🎬";
        }
    };

    return (
        <>
            <div
                onClick={() => setShowModal(true)}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4 cursor-pointer hover:border-indigo-500 hover:bg-gray-800/80 transition-all group"
            >
                <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-48 h-28 bg-gray-900 rounded-lg flex-shrink-0 relative overflow-hidden">
                        {result.frame_path ? (
                            <img
                                src={`${BACKEND_BASE}/static/frames/${result.frame_path}`}
                                alt="Frame preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                                🎬
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-sm font-medium">
                            {formatTimestamp(result.timestamp)}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold group-hover:text-indigo-400 transition-colors truncate">
                            {result.video_title}
                        </h3>

                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {result.transcript_snippet || result.frame_caption || "No description available"}
                        </p>

                        <div className="flex items-center gap-3 mt-3">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${result.match_type === "transcript"
                                        ? "bg-indigo-500/20 text-indigo-400"
                                        : result.match_type === "frame"
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-purple-500/20 text-purple-400"
                                    }`}
                            >
                                {getMatchTypeIcon()} {result.match_type}
                            </span>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Score:</span>
                                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                        style={{ width: `${score}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400">{score}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <VideoModal
                    videoId={result.video_id}
                    timestamp={result.timestamp}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}
