import type { TimelineDoc, Clip } from "@/lib/timeline";

/** Curated pool of real 4K stock footage used for seeding + the in-app stock browser. */
export interface StockItem {
  stockId: string;
  name: string;
  src: string;
  poster: string;
  durationSec: number;
  tag: string;
  hue: number;
  creator: string;
}

export const STOCK_POOL: StockItem[] = [
  {
    stockId: "cliffs-azores",
    name: "Azores — Basalt Cliffs Reveal",
    src: "https://videos.pexels.com/video-files/10234380/10234380-uhd_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/10234380/beach-cliff-drone-ocean-10234380.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 40,
    tag: "Aerial",
    hue: 205,
    creator: "Cesar Casanova",
  },
  {
    stockId: "north-sea",
    name: "North Sea — Storm Line",
    src: "https://videos.pexels.com/video-files/36505810/15479717_3840_2160_60fps.mp4",
    poster:
      "https://images.pexels.com/videos/36505810/4k-4k-drone-footage-asturias-cantabria-36505810.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 13,
    tag: "Aerial",
    hue: 215,
    creator: "Mike Art",
  },
  {
    stockId: "isle-dusk",
    name: "Isle at Dusk — Orbit",
    src: "https://videos.pexels.com/video-files/31454265/13413252_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/31454265/4k-drone-video-4k-nature-video-4k-video-copyright-free-4k-video-nature-31454265.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 8,
    tag: "Aerial",
    hue: 275,
    creator: "Optical Chemist",
  },
  {
    stockId: "beach-hills",
    name: "Emerald Bay — Ridge Sweep",
    src: "https://videos.pexels.com/video-files/38369529/16294673_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/38369529/adventure-aerial-view-alpine-landscape-cinematic-38369529.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 13,
    tag: "Nature",
    hue: 165,
    creator: "Islam Abruev",
  },
  {
    stockId: "fog-coast",
    name: "Cape Mist — Slow Push",
    src: "https://videos.pexels.com/video-files/7046537/7046537-uhd_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/7046537/aerial-footage-beach-beautiful-landscape-cape-town-7046537.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 32,
    tag: "Nature",
    hue: 190,
    creator: "Taryn Elliott",
  },
  {
    stockId: "sunset-ridge",
    name: "Last Light — Ridge Silhouette",
    src: "https://videos.pexels.com/video-files/2079187/2079187-uhd_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/2079187/free-video-2079187.jpg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 15,
    tag: "Golden Hour",
    hue: 28,
    creator: "Tim Eiden",
  },
  {
    stockId: "mist-peaks",
    name: "Twilight Peaks — Fog Roll",
    src: "https://videos.pexels.com/video-files/39055636/16619093_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/39055636/antalya-drone-outdoorsy-39055636.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 8,
    tag: "Nature",
    hue: 230,
    creator: "Yunus Terk",
  },
  {
    stockId: "atlantic-coast",
    name: "Atlantic Wall — Cradle Shot",
    src: "https://videos.pexels.com/video-files/35665518/15114493_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/35665518/atlantic-cliffs-atlantic-ocean-cinematic-landscape-coastal-cliffs-35665518.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 14,
    tag: "Aerial",
    hue: 210,
    creator: "Clement Proust",
  },
  {
    stockId: "dubai-neon",
    name: "Sheikh Zayed Rd — Neon Rain",
    src: "https://videos.pexels.com/video-files/27152555/12085630_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/27152555/at-night-cinematic-city-color-of-night-27152555.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 6,
    tag: "Urban",
    hue: 305,
    creator: "Artem Shutkin",
  },
  {
    stockId: "storm-city",
    name: "Belgrade — Supercell",
    src: "https://videos.pexels.com/video-files/17686937/17686937-uhd_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/17686937/beograd-oluja-17686937.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 43,
    tag: "Urban",
    hue: 255,
    creator: "Boris Hamer",
  },
  {
    stockId: "traffic-lapse",
    name: "Rush Hour — 24p Timelapse",
    src: "https://videos.pexels.com/video-files/9818071/9818071-uhd_3840_2160_24fps.mp4",
    poster:
      "https://images.pexels.com/videos/9818071/pexels-photo-9818071.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 6,
    tag: "Timelapse",
    hue: 35,
    creator: "Juicebox",
  },
  {
    stockId: "dubai-traffic",
    name: "Marina Flow — Night Pass",
    src: "https://videos.pexels.com/video-files/27152554/12085685_3840_2160_25fps.mp4",
    poster:
      "https://images.pexels.com/videos/27152554/at-night-cinematic-city-color-of-night-27152554.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 13,
    tag: "Urban",
    hue: 320,
    creator: "Artem Shutkin",
  },
  {
    stockId: "city-timelapse",
    name: "Arterial — Light Rivers",
    src: "https://videos.pexels.com/video-files/9935080/9935080-uhd_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/9935080/pexels-photo-9935080.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 15,
    tag: "Timelapse",
    hue: 45,
    creator: "Evgenij Mikhailov",
  },
  {
    stockId: "manhattan-night",
    name: "Manhattan — Crosstown Night",
    src: "https://videos.pexels.com/video-files/11724587/11724587-uhd_3840_2160_30fps.mp4",
    poster:
      "https://images.pexels.com/videos/11724587/cars-manhattan-new-york-city-night-11724587.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
    durationSec: 25,
    tag: "Urban",
    hue: 290,
    creator: "Jan Pischke",
  },
];

export const STARTER_STOCK_IDS = ["cliffs-azores", "sunset-ridge", "dubai-neon", "city-timelapse"];

function clip(partial: Partial<Clip> & Pick<Clip, "id" | "name" | "track" | "start" | "duration" | "segments">): Clip {
  return {
    hue: 245,
    filter: { preset: "none", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
    effect: { type: "none", intensity: 0.6 },
    transition: { type: "none", duration: 0.8 },
    keyframes: [],
    ...partial,
  } as Clip;
}

/** Starter timeline given to brand-new accounts. */
export function starterTimeline(items: StockItem[]): TimelineDoc {
  const [a, b] = items;
  if (!a || !b) return { version: 1, clips: [] };
  return {
    version: 1,
    clips: [
      clip({
        id: "starter-c1",
        name: a.name,
        track: 0,
        start: 0,
        duration: 6,
        hue: a.hue,
        segments: [{ src: a.src, poster: a.poster, in: 2, duration: 6, label: a.name }],
        filter: { preset: "cinematic", brightness: 1, contrast: 1, saturate: 1, hue: 0 },
      }),
      clip({
        id: "starter-c2",
        name: b.name,
        track: 0,
        start: 6,
        duration: 5,
        hue: b.hue,
        segments: [{ src: b.src, poster: b.poster, in: 0, duration: 5, label: b.name }],
        transition: { type: "dissolve", duration: 1 },
      }),
    ],
  };
}
