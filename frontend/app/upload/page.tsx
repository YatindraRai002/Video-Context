"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadVideo, uploadVideoFromUrl, getVideoStatus } from "@/lib/api";

export default function UploadPage() {
    const router = useRouter();
    const [mode, setMode] = useState<"file" | "url">("file");
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type.startsWith("video/")) {
            setFile(droppedFile);
            setError("");
        } else {
            setError("Please drop a video file");
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError("");
        }
    };

    const pollStatus = async (videoId: string) => {
        let processingComplete = false;
        while (!processingComplete) {
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const statusData = await getVideoStatus(videoId);
            setProgress(statusData.progress);

            const statusMessages: Record<string, string> = {
                pending: "Queued for processing...",
                downloading: "Downloading video...",
                processing: "Processing video...",
                extracting_audio: "Extracting audio...",
                transcribing: "Transcribing speech (ASR)...",
                extracting_frames: "Extracting frames...",
                embedding: "Generating embeddings...",
                ready: "Complete!",
                failed: "Processing failed",
            };

            setStatus(statusMessages[statusData.status] || statusData.status);

            if (statusData.status === "ready") {
                processingComplete = true;
                setTimeout(() => {
                    router.push("/videos");
                }, 1000);
            } else if (statusData.status === "failed") {
                throw new Error(statusData.error_message || "Processing failed");
            }
        }
    };

    const handleUpload = async () => {
        if (mode === "file" && !file) return;
        if (mode === "url" && !url.trim()) return;

        setUploading(true);
        setProgress(0);
        setError("");

        try {
            let videoId: string;

            if (mode === "file" && file) {
                setStatus("Uploading file...");
                const video = await uploadVideo(file, file.name, (p) => {
                    setProgress(p);
                });
                videoId = video.id;
                setStatus("Processing video...");
            } else {
                setStatus("Starting download...");
                const video = await uploadVideoFromUrl(url);
                videoId = video.id;
                setStatus("Downloading & processing...");
            }

            await pollStatus(videoId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
            <p className="text-gray-400 mb-6">
                Upload a video file or paste a URL from YouTube, Vimeo, etc.
            </p>

            {/* Mode Toggle */}
            <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
                <button
                    onClick={() => setMode("file")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === "file"
                            ? "bg-indigo-500 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                >
                    📁 Upload File
                </button>
                <button
                    onClick={() => setMode("url")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === "url"
                            ? "bg-indigo-500 text-white"
                            : "text-gray-400 hover:text-white"
                        }`}
                >
                    🔗 Paste URL
                </button>
            </div>

            {mode === "file" ? (
                /* File Drop Zone */
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("fileInput")?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragging
                            ? "border-indigo-500 bg-indigo-500/10"
                            : file
                                ? "border-green-500 bg-green-500/10"
                                : "border-gray-700 hover:border-gray-600"
                        }`}
                >
                    <input
                        id="fileInput"
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="text-5xl mb-4">{file ? "✅" : "📁"}</div>

                    {file ? (
                        <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-medium">Drag & drop video here</p>
                            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                            <p className="text-xs text-gray-500 mt-2">MP4, WebM, MOV supported</p>
                        </div>
                    )}
                </div>
            ) : (
                /* URL Input */
                <div className="space-y-4">
                    <div className="bg-gray-800 rounded-2xl p-6">
                        <label className="block text-sm font-medium mb-2">Video URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Supports: YouTube, Vimeo, Dailymotion, Twitter/X, TikTok, Facebook, Instagram, Twitch
                        </p>
                    </div>

                    {url && (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                            <span>✓</span>
                            <span>URL detected</span>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Progress */}
            {uploading && (
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{status}</span>
                        <span className="text-indigo-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={(mode === "file" && !file) || (mode === "url" && !url.trim()) || uploading}
                className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
                {uploading
                    ? "Processing..."
                    : mode === "file"
                        ? "Upload & Process"
                        : "Download & Process"}
            </button>
        </div>
    );
}
