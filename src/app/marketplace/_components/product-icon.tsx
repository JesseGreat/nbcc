import { Armchair, Camera, Headphones, Laptop, Smartphone, Watch } from "lucide-react";
import type { Product } from "../_lib/products";

const ICONS = { laptop: Laptop, phone: Smartphone, headphones: Headphones, watch: Watch, camera: Camera, sofa: Armchair };

export function ProductIcon({ icon, className }: { icon: Product["icon"]; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
