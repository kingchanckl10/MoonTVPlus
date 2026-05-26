'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { playMusicList } from '@/lib/music/actions';
import { MusicLoadingIndicator, type Song } from '../MusicClient';
import SongList from '../SongList';
import { mapSong, musicSources, normalizeSource } from '@/lib/music/shared';

export default function MusicSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = normalizeSource(searchParams.get('source'));
  const q = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(q);
  const [selectedSource, setSelectedSource] = useState(source);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  useEffect(() => {
    setSelectedSource(source);
    setKeyword(q);
    if (!q) {
      setSongs([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/music/v2/search?source=${source}&q=${encodeURIComponent(q)}&page=1&limit=20`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setSongs((data.data?.list || []).map(mapSong)))
      .catch((error) => {
        if (error?.name !== 'AbortError') setSongs([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [source, q]);

  const submit = () => {
    const next = keyword.trim();
    if (next) router.push(`/music/search?source=${source}&q=${encodeURIComponent(next)}`);
  };

  const changeSource = (nextSource: string) => {
    const normalizedSource = normalizeSource(nextSource);
    const next = keyword.trim() || q;
    setSelectedSource(normalizedSource);
    setShowSourceMenu(false);
    router.push(`/music/search?source=${normalizedSource}${next ? `&q=${encodeURIComponent(next)}` : ''}`);
  };

  const currentSourceLabel = musicSources.find((item) => item.key === selectedSource)?.label || '音源';

  return (
    <div className="animate-in fade-in duration-500 relative z-10">
      <div className="mb-8 flex items-center gap-3 relative z-50">
        <div className="relative flex-1 flex items-center bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] rounded-[8px] pl-3 border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] focus-within:border-green-500 focus-within:ring-0 transition-all shadow-sm">
          <svg className="w-4 h-4 opacity-40 text-black dark:text-white mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            value={keyword} 
            onChange={(e) => setKeyword(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && submit()} 
            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[14px] py-2 text-black dark:text-white placeholder-[rgba(0,0,0,0.4)] dark:placeholder-[rgba(255,255,255,0.4)]" 
            placeholder="搜索歌曲或艺术家..." 
          />
          
          <div className="w-px h-5 bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)] mx-1 shrink-0" />
          
          <div className="relative h-full flex items-center pr-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowSourceMenu((open) => !open)}
              className="flex h-[32px] items-center gap-1.5 px-2.5 rounded-[6px] hover:bg-[rgba(0,0,0,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] transition-all"
              aria-haspopup="listbox"
              aria-expanded={showSourceMenu}
            >
              <span className="text-[13px] font-medium text-black dark:text-white">{currentSourceLabel}</span>
              <svg className="w-3.5 h-3.5 opacity-50 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </button>
            
            {showSourceMenu && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setShowSourceMenu(false)}
                  aria-label="关闭菜单"
                />
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-32 p-1.5 overflow-hidden rounded-xl bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(35,35,35,0.85)] backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.15)] animate-in fade-in zoom-in-95 duration-100 origin-top-right" role="listbox">
                  {musicSources.map((item) => {
                    const active = selectedSource === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setShowSourceMenu(false);
                          changeSource(item.key);
                        }}
                        className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] text-black dark:text-white hover:bg-green-500 hover:text-white transition-none"
                        role="option"
                        aria-selected={active}
                      >
                        <span className="whitespace-nowrap">{item.label}</span>
                        {active && (
                          <svg className="h-3.5 w-3.5 text-black dark:text-white group-hover:text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-2xl font-black text-white tracking-tight truncate max-w-md">
            {q ? `搜索: ${q}` : '发现音乐'}
          </h2>
          {songs.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold bg-white/10 text-green-500 rounded-full border border-green-500/20 shrink-0">
              {songs.length} 首结果
            </span>
          )}
        </div>
        <button 
          onClick={() => playMusicList(songs, q ? `搜索: ${q}` : '搜索结果')} 
          disabled={songs.length === 0} 
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          播放全部
        </button>
      </div>
      {loading ? (
        <MusicLoadingIndicator className="py-16" />
      ) : q ? (
        <SongList songs={songs} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 py-20 text-center backdrop-blur-sm">
          <div className="w-20 h-20 mb-6 rounded-full bg-white/5 flex items-center justify-center shadow-inner">
            <svg className="h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="text-xl font-bold text-zinc-300 mb-2">开始你的音乐探索</div>
          <div className="text-sm text-zinc-500 max-w-sm">在上方输入你想听的歌曲、歌手或专辑，我们为你搜罗全网好音乐。</div>
        </div>
      )}
    </div>
  );
}
