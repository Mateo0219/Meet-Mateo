"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect } from "react";
import type { MusicControls } from "../../MusicPlayer";
import { useOS } from "../OSProvider";

const MusicPlayer = dynamic(() => import("../../MusicPlayer"), {
  ssr: false,
  loading: () => <div className="app-loading">正在接通音频…</div>,
});

export default function MusicApp() {
  const { todaySong, trackRequest, setNowPlaying, musicControls, consumeTrackRequest } = useOS();
  const registerControls = useCallback((controls: MusicControls | null) => { musicControls.current = controls; }, [musicControls]);
  useEffect(() => () => setNowPlaying(null), [setNowPlaying]);
  return (
    <div className="music-app">
      <MusicPlayer initialTrackId={todaySong?.id} request={trackRequest} onPlaybackChange={setNowPlaying} onControlsReady={registerControls} onRequestHandled={consumeTrackRequest} />
    </div>
  );
}
