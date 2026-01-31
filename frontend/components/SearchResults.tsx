"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchResult } from "@/lib/types";
import { getSearchStatus } from "@/lib/api";
import VideoCard from "./VideoCard";

interface SearchResultsProps {
    results: SearchResult[];
    loading?: boolean;
}

export default function SearchResults({ results, loading }: SearchResultsProps) {
    const [searchStatus, setSearchStatus] = useState<Awaited<ReturnType<typeof getSearchStatus>> | null>(null);

    useEffect(() => {
        if (results.length === 0 && !loading) {
            getSearchStatus().then(setSearchStatus).catch(() => setSearchStatus(null));
        } else {
            setSearchStatus(null);
        }
    }, [results.length, loading]);

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
            <div className="text-center py-12 text-gray-400 max-w-lg mx-auto">
                <div className="text-4xl mb-4">🔍</div>
                <p className="mb-2">No results found.</p>
                {searchStatus && (
                    <div className="text-left bg-gray-800/50 border border-gray-700 rounded-xl p-4 mt-4 text-sm space-y-2">
                        <p className="text-gray-300 font-medium">Why this might happen:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                            <li>Qdrant: {searchStatus.qdrant_connected ? "Connected" : "Not connected — run docker-compose up -d"}</li>
                            <li>Transcripts indexed: {searchStatus.transcript_embeddings}</li>
                            <li>Frames indexed: {searchStatus.frame_embeddings}</li>
                        </ul>
                        {searchStatus.videos.length > 0 && (
                            <p className="pt-2 text-gray-400">
                                Your videos: {searchStatus.videos.map((v) => `${v.title} (${v.status})`).join(", ")}.
                                Search works only when at least one video has status <strong className="text-gray-300">ready</strong>.
                            </p>
                        )}
                        <Link href="/videos" className="inline-block mt-3 text-indigo-400 hover:text-indigo-300">
                            View videos &amp; processing status →
                        </Link>
                    </div>
                )}
                {!searchStatus && (
                    <p className="text-sm mt-2">Make sure the backend is running and at least one video has finished processing (status: Ready).</p>
                )}
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
