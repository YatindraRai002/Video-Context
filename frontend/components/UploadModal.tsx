"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadModalProps {
    onClose: () => void;
    onUploadSuccess?: () => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus("idle");
            setErrorMessage("");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setStatus("idle");
            setErrorMessage("");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setStatus("uploading");
        setProgress(0);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_BASE}/videos/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    setStatus("success");
                    setIsUploading(false);
                    if (onUploadSuccess) onUploadSuccess();
                    setTimeout(() => {
                        onClose();
                    }, 2000);
                } else {
                    setStatus("error");
                    setIsUploading(false);
                    setErrorMessage("Upload failed. Please try again.");
                }
            };

            xhr.onerror = () => {
                setStatus("error");
                setIsUploading(false);
                setErrorMessage("Could not connect to the server. Make sure the backend is running (see README).");
            };

            xhr.send(formData);
        } catch (error) {
            console.error("Upload error:", error);
            setStatus("error");
            setIsUploading(false);
            setErrorMessage("An unexpected error occurred.");
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-[#0F1117] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Upload Video</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Drop Zone */}
                    {!file && (
                        <div
                            className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Upload className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">MP4, WebM up to 500MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="video/*"
                                onChange={handleFileSelect}
                            />
                        </div>
                    )}

                    {/* File Selected / Progress */}
                    {file && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Upload className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                                    disabled={isUploading}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {status === "uploading" && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Uploading...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {status === "success" && (
                                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Upload successful! Processing...</span>
                                </div>
                            )}

                            {status === "error" && (
                                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={onClose} disabled={isUploading} className="text-gray-400 hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={!file || isUploading || status === "success"}
                            onClick={handleUpload}
                        >
                            {isUploading ? "Uploading..." : status === "success" ? "Done" : "Upload Video"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
