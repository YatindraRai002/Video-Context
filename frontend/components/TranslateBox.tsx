"use client";

import { useState } from "react";
import { translateText } from "@/lib/api";

interface TranslateBoxProps {
    initialText?: string;
}

export default function TranslateBox({ initialText = "" }: TranslateBoxProps) {
    const [text, setText] = useState(initialText);
    const [translated, setTranslated] = useState("");
    const [loading, setLoading] = useState(false);
    const [sourceLang, setSourceLang] = useState("en");
    const [targetLang, setTargetLang] = useState("hi");

    const languages = [
        { code: "en", name: "English" },
        { code: "hi", name: "Hindi" },
        { code: "es", name: "Spanish" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "zh", name: "Chinese" },
        { code: "ja", name: "Japanese" },
        { code: "ko", name: "Korean" },
    ];

    const handleTranslate = async () => {
        if (!text.trim()) return;

        setLoading(true);
        try {
            const result = await translateText(text, sourceLang, targetLang);
            setTranslated(result.translated_text);
        } catch (error) {
            console.error("Translation failed:", error);
            setTranslated("Translation failed. Is the NeMo model loaded?");
        } finally {
            setLoading(false);
        }
    };

    const swapLanguages = () => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setText(translated);
        setTranslated(text);
    };

    return (
        <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-4 mb-4">
                <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={swapLanguages}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                    ⇄
                </button>

                <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to translate..."
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div>
                    <div className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-4 h-4 border-2 border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
                                Translating...
                            </div>
                        ) : (
                            translated || <span className="text-gray-500">Translation will appear here</span>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={handleTranslate}
                disabled={loading || !text.trim()}
                className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
                {loading ? "Translating..." : "Translate"}
            </button>
        </div>
    );
}
