"use client";

import { WritingView } from "@/components/text/WritingView/WritingView";

interface TextPanelProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onPublish?: () => void;
  onStartNewScene?: () => void;
  onGoToPreviousScene?: () => void;
  onGoToNextScene?: () => void;
  onAssist?: (action: "continue" | "polish") => void;
  onSceneTitleChange?: (value: string) => void;
  onSceneTitleSave?: () => void;
  sceneTitle?: string;
  sceneTitlePlaceholder?: string;
  canGoToPreviousScene?: boolean;
  canGoToNextScene?: boolean;
  assistLoadingAction?: "continue" | "polish" | null;
  hasWorldStarted?: boolean;
  hasUnpublishedText?: boolean;
  replayMode?: boolean;
  currentReplaySceneName?: string;
  isSubmitting?: boolean;
  publishLoading?: boolean;
  startSceneLoading?: boolean;
}

export function TextPanel(props: TextPanelProps) {
  return <WritingView {...props} />;
}
