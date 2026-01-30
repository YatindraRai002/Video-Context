"use client";

import { Mic, Square, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    isProcessing: boolean;
}

export default function AudioRecorder({ onRecordingComplete, isProcessing }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                onRecordingComplete(blob);
                chunksRef.current = [];
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Timer
            let seconds = 0;
            setDuration(0);
            timerRef.current = setInterval(() => {
                seconds++;
                setDuration(seconds);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2">
            {isRecording ? (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-500 font-mono text-sm">Recording... {formatTime(duration)}</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={stopRecording}
                        className="h-6 text-white hover:text-red-400 hover:bg-transparent ml-2 font-semibold"
                    >
                        Stop & Send
                    </Button>
                </div>
            ) : (
                <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                    onClick={startRecording}
                    disabled={isProcessing}
                >
                    <Mic className="w-5 h-5" />
                </Button>
            )}
        </div>
    );
}
