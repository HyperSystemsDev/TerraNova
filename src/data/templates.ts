export interface TemplateInfo {
  name: string;
  displayName: string;
  description: string;
  category: string;
  tags?: string[];
}

export const BUNDLED_TEMPLATES: TemplateInfo[] = [
  {
    name: "",
    displayName: "Blank Project",
    description: "Start from scratch with an empty project",
    category: "Starter",
    tags: ["empty", "blank"],
  },
  {
    name: "void",
    displayName: "Void",
    description:
      "A minimal flat world template. Perfect starting point for custom terrain.",
    category: "Starter",
    tags: ["Minimal"],
  },
  {
    name: "forest-hills",
    displayName: "Forest Hills",
    description:
      "Lush forested hills with rolling terrain, cliff ridges, valley floors, and cave networks.",
    category: "Nature",
    tags: ["Advanced", "13 Node Types"],
  },
  {
    name: "shattered-archipelago",
    displayName: "Shattered Archipelago",
    description:
      "Dramatic volcanic island chains rising from deep ocean, featuring coral reefs, sea caves, jungle canopy, and ruins.",
    category: "Nature",
    tags: ["Complex", "46 Nodes", "7 Biomes"],
  },
  {
    name: "tropical-pirate-islands",
    displayName: "Tropical Pirate Islands",
    description:
      "Lush tropical islands with sandy beaches, palm trees, and hidden pirate coves rising from turquoise waters.",
    category: "Nature",
    tags: ["Atmospheric"],
  },
  {
    name: "eldritch-spirelands",
    displayName: "Eldritch Spirelands",
    description:
      "A dark, otherworldly biome of towering crystalline spires and void-touched terrain.",
    category: "Fantasy",
    tags: ["Atmospheric", "Advanced"],
  },
];
