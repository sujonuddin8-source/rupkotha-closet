import boyShirt from "@/assets/p-boy-shirt.jpg";
import boyPanjabi from "@/assets/p-boy-panjabi.jpg";
import boyDungaree from "@/assets/p-boy-dungaree.jpg";
import girlFrock from "@/assets/p-girl-frock.jpg";
import girlThreePiece from "@/assets/p-girl-three-piece.jpg";
import babySet from "@/assets/p-baby-set.jpg";
import newbornSet from "@/assets/p-newborn-set.jpg";

export const IMAGE_KEYS = [
  "boy-shirt",
  "boy-panjabi",
  "boy-dungaree",
  "girl-frock",
  "girl-three-piece",
  "baby-set",
  "newborn-set",
] as const;

export type ImageKey = (typeof IMAGE_KEYS)[number];

const MAP: Record<string, string> = {
  "boy-shirt": boyShirt,
  "boy-panjabi": boyPanjabi,
  "boy-dungaree": boyDungaree,
  "girl-frock": girlFrock,
  "girl-three-piece": girlThreePiece,
  "baby-set": babySet,
  "newborn-set": newbornSet,
};

/** Resolve a stored image key (or full URL) into a renderable image source. */
export function resolveImage(key: string): string {
  if (!key) return babySet;
  if (key.startsWith("http") || key.startsWith("/") || key.startsWith("data:")) return key;
  return MAP[key] ?? babySet;
}
