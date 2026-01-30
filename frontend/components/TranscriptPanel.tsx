"use client";

import { useState, useEffect } from "react";
import { formatTimestamp } from "@/lib/api";

interface TranscriptSegment {
    text: string;
    start_time: number;
    end_time: number;
    speaker?: string;
}

interface TranscriptPanelProps {
    videoId: string;
    currentTime?: number;
    onSeek?: (time: number) => void;
}

export default function TranscriptPanel({ videoId, currentTime = 0, onSeek }: TranscriptPanelProps) {
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTranscript = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8000/api/v1/videos/${videoId}/transcript`
                );
                if (response.ok) {
                    const data = await response.json();
                    setSegments(data.segments || []);
                }
            } catch (error) {
                console.error("Failed to fetch transcript:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTranscript();
    }, [videoId]);

    if (loading) {
        return (
            <div className="bg-gray-900 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-800 rounded mb-3 w-full" />
                <div className="h-4 bg-gray-800 rounded mb-3 w-3/4" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
            </div>
        );
    }

    if (segments.length === 0) {
        return (
            <div className="bg-gray-900 rounded-xl p-4 text-center text-gray-500">
                No transcript available
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-xl p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-gray-900 py-2">
                📝 Transcript
            </h3>
            <div className="space-y-3">
                {segments.map((segment, index) => {
                    const isActive =
                        currentTime >= segment.start_time && currentTime < segment.end_time;

                    return (
                        <div
                            key={index}
                            onClick={() => onSeek?.(segment.start_time)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${isActive
                                    ? "bg-indigo-500/20 border-l-4 border-indigo-500"
                                    : "hover:bg-gray-800"
                                }`}
                        >
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                <span className="font-mono">
                                    {formatTimestamp(segment.start_time)}
                                </span>
                                {segment.speaker && (
                                    <span className="bg-gray-800 px-2 py-0.5 rounded">
                                        {segment.speaker}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {segment.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
