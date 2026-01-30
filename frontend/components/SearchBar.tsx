"use client";

import { useState, useRef } from "react";
import { voiceToText } from "@/lib/api";

interface SearchBarProps {
    onSearch: (query: string, searchType: string) => void;
    loading?: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [searchType, setSearchType] = useState("hybrid");
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim(), searchType);
        }
    };

    const startVoiceSearch = async () => {
        if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                stream.getTracks().forEach((track) => track.stop());

                try {
                    const text = await voiceToText(audioBlob);
                    setQuery(text);
                    onSearch(text, searchType);
                } catch (error) {
                    console.error("Voice recognition failed:", error);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access denied:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
            <div className="flex gap-3 relative z-10">
                <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='e.g., "when did they discuss the budget"'
                            className="w-full pl-5 pr-12 py-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xl"
                        />
                        <button
                            type="button"
                            onClick={startVoiceSearch}
                            className={`absolute right-3 p-2 rounded-lg transition-all duration-300 ${isRecording
                                ? "bg-red-500/20 text-red-400 animate-pulse scale-110"
                                : "text-gray-400 hover:text-white hover:bg-gray-800"
                                }`}
                            title="Voice Search"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" x2="12" y1="19" y2="22" />
                            </svg>
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="group relative px-8 py-4 bg-indigo-600 rounded-xl font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center gap-2">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:rotate-12 transition-transform">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                        )}
                        <span>Search</span>
                    </div>
                </button>
            </div>

            {/* Search Type Options */}
            <div className="flex justify-center gap-6">
                {[
                    { value: "hybrid", label: "All Content" },
                    { value: "transcript", label: "Transcripts" },
                    { value: "frames", label: "Frames" },
                ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors">
                        <input
                            type="radio"
                            name="searchType"
                            value={option.value}
                            checked={searchType === option.value}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="accent-indigo-500"
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </form>
    );
}
