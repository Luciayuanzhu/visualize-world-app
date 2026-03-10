"use client";

import { WritingView } from "@/components/text/WritingView/WritingView";

interface TextPanelProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onPublish?: () => void;
  onStartNewScene?: () => void;
  hasWorldStarted?: boolean;
  hasUnpublishedText?: boolean;
  replayMode?: boolean;
  currentReplaySceneName?: string;
  isSubmitting?: boolean;
}

export function TextPanel(props: TextPanelProps) {
  return <WritingView {...props} />;
}
