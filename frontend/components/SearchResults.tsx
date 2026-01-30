"use client";

import { SearchResult } from "@/lib/types";
import { formatTimestamp } from "@/lib/api";
import VideoCard from "./VideoCard";

interface SearchResultsProps {
    results: SearchResult[];
    loading?: boolean;
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
    if (loading) {
        return (
            <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-xl p-4 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-48 h-28 bg-gray-700 rounded-lg" />
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-gray-700 rounded w-1/3" />
                                <div className="h-4 bg-gray-700 rounded w-2/3" />
                                <div className="h-4 bg-gray-700 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-4">🔍</div>
                <p>No results found. Try a different search query.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {results.map((result, index) => (
                <VideoCard key={`${result.video_id}-${result.timestamp}-${index}`} result={result} />
            ))}
        </div>
    );
}
