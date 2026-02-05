"use client";

import { Button } from "@/components/ui/button";
import { BACKEND_BASE } from "@/lib/api";
import { SearchResult } from "@/lib/types";
import { Download, Share2, X } from "lucide-react";
import { useState } from "react";

interface VideoModalProps {
  result: SearchResult;
  onClose: () => void;
}

export default function VideoModal({ result, onClose }: VideoModalProps) {
  const [currentTime, setCurrentTime] = useState(result.timestamp);

  const videoUrl = `${BACKEND_BASE}/static/videos/${result.video_id}.mp4`;
  const frameUrl = result.frame_path
    ? `${BACKEND_BASE}${result.frame_path}`
    : null;

  const handleShare = () => {
    const url = `${window.location.origin}/videos/${result.video_id}?t=${result.timestamp}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleDownloadClip = () => {
    // This would need backend support for clip extraction
    alert("Clip download feature coming soon!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white truncate">
            {result.video_title}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleShare}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleDownloadClip}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={`${videoUrl}#t=${result.timestamp}`}
                controls
                autoPlay
                className="w-full h-full"
                onTimeUpdate={(e) =>
                  setCurrentTime(e.currentTarget.currentTime)
                }
              />
            </div>

            {/* Transcript */}
            {result.transcript_snippet && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-300">
                    Transcript
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatTime(result.timestamp)}
                    {result.end_time && ` - ${formatTime(result.end_time)}`}
                  </span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {result.transcript_snippet}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Frame & Details */}
          <div className="space-y-4">
            {/* Matched Frame */}
            {frameUrl && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Matched Frame
                </h3>
                <img
                  src={frameUrl}
                  alt="Video frame"
                  className="w-full rounded-lg border border-gray-700"
                />
                {result.frame_caption && (
                  <p className="text-xs text-gray-400 mt-2">
                    {result.frame_caption}
                  </p>
                )}
              </div>
            )}

            {/* Match Details */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 space-y-3">
              <h3 className="text-sm font-medium text-gray-300">
                Match Details
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">
                    {result.match_type}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Relevance:</span>
                  <span className="text-white">
                    {(result.score * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-white">
                    {formatTime(result.timestamp)}
                  </span>
                </div>
              </div>

              {/* Relevance Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                  style={{ width: `${result.score * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
