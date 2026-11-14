/** Fictional test products for the escrow sandbox. Prices in kobo. */
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "NGN";
  seller: string;
  icon: "laptop" | "phone" | "headphones" | "watch" | "camera" | "sofa";
};

export const PRODUCTS: Product[] = [
  { id: "laptop-pro-14", name: "Laptop Pro 14\"", description: "16GB RAM, 512GB SSD. Lightly used, with charger.", price: 85_000_000, currency: "NGN", seller: "Ada Gadgets (test)", icon: "laptop" },
  { id: "phone-x12", name: "Phone X12", description: "128GB, unlocked, box and receipt included.", price: 42_000_000, currency: "NGN", seller: "Lekki Phones (test)", icon: "phone" },
  { id: "wireless-headphones", name: "Wireless Headphones", description: "Noise cancelling, 30-hour battery.", price: 6_500_000, currency: "NGN", seller: "SoundHub (test)", icon: "headphones" },
  { id: "smart-watch", name: "Smart Watch S3", description: "Heart rate, GPS, two straps.", price: 12_000_000, currency: "NGN", seller: "Ada Gadgets (test)", icon: "watch" },
  { id: "mirrorless-camera", name: "Mirrorless Camera", description: "24MP body with 18-55mm kit lens.", price: 120_000_000, currency: "NGN", seller: "Lens & Light (test)", icon: "camera" },
  { id: "two-seater-sofa", name: "Two-seater Sofa", description: "Grey fabric, Lagos pickup only.", price: 25_000_000, currency: "NGN", seller: "HomeCraft (test)", icon: "sofa" },
  { id: "test-item-100", name: "₦100 Test Item", description: "Cheapest item, for quick escrow runs.", price: 10_000, currency: "NGN", seller: "Sandbox Seller", icon: "phone" },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
