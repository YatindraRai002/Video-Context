"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ProcessingStepsProps {
    steps: string[];
    isThinking: boolean;
}

export default function ProcessingSteps({ steps, isThinking }: ProcessingStepsProps) {
    if (!isThinking && steps.length === 0) return null;

    return (
        <div className="bg-[#1A1F2B] border border-white/10 rounded-lg p-4 my-2 max-w-lg">
            <div className="flex items-center gap-2 mb-3 text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Processing your request...</span>
            </div>

            <div className="space-y-2">
                {steps.map((step, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-sm text-gray-300"
                    >
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{step}</span>
                    </motion.div>
                ))}

                {isThinking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-sm text-gray-400"
                    >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating answer...</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
