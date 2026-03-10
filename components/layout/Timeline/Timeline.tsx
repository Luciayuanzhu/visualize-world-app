import { NowMarker } from "@/components/layout/Timeline/NowMarker";
import { SceneThumbnail } from "@/components/layout/Timeline/SceneThumbnail";

interface TimelineProps {
  scenes: Array<{ id: string; index: number; name: string }>;
  activeSceneId?: string | null;
  onSelectScene?: (sceneId: string) => void;
}

export function Timeline({ scenes, activeSceneId, onSelectScene }: TimelineProps) {
  return (
    <footer className="flex h-[72px] items-center gap-3 border-t px-4" style={{ borderColor: "var(--border)", background: "rgba(15,12,8,0.96)" }}>
      {scenes.length === 0 ? (
        <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
          Timeline Empty
        </span>
      ) : (
        <>
          <div className="flex flex-1 gap-3 overflow-x-auto">
            {scenes.map((scene) => (
              <SceneThumbnail
                key={scene.id}
                index={scene.index}
                name={scene.name}
                active={scene.id === activeSceneId}
                onClick={() => onSelectScene?.(scene.id)}
              />
            ))}
          </div>
          <NowMarker />
        </>
      )}
    </footer>
  );
}
