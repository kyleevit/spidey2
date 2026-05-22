import fs from "fs";
import path from "path";
import { app } from "electron";

export type Personality = "friendly" | "skittish" | "aggressive" | "lazy" | "curious" | "mischievous";
export type GrowthStage = "baby" | "juvenile" | "adult" | "giant";
export type ChaosLevel = "low" | "normal" | "high" | "insane";

export type DbUser = {
  id: number;
  coins: number;
  isPremium: boolean;
  ownedItemIds: string[];
  ownedPetIds: string[];
  dailyRewardClaimedAt: string | null;
};

export type DbPet = {
  id: number;
  userId: number;
  petType: string;
  name: string;
  hunger: number;
  happiness: number;
  health: number;
  cleanliness: number;
  energy: number;
  trust: number;
  aggression: number;
  boredom: number;
  age: number;
  isAlive: boolean;
  isDead: boolean;
  isActive: boolean;
  personality: Personality;
  growthStage: GrowthStage;
  lastUpdatedAt: string;
};

export type DbSettings = {
  screenDamageEnabled: boolean;
  chaosLevel: ChaosLevel;
  petSize: number;
  alwaysOnTop: boolean;
  clickThroughMode: boolean;
  soundEnabled: boolean;
  startWithWindows: boolean;
};

type Store = {
  user: DbUser;
  pets: DbPet[];
  nextPetId: number;
  settings: DbSettings;
};

let _store: Store | null = null;
let _dbPath: string | null = null;

function getDbPath(): string {
  if (_dbPath) return _dbPath;
  _dbPath = path.join(app.getPath("userData"), "spidey.json");
  return _dbPath;
}

function defaultSettings(): DbSettings {
  return {
    screenDamageEnabled: true,
    chaosLevel: "normal",
    petSize: 1.0,
    alwaysOnTop: true,
    clickThroughMode: true,
    soundEnabled: false,
    startWithWindows: false,
  };
}

function defaultStore(): Store {
  const personalities: Personality[] = ["friendly", "skittish", "aggressive", "lazy", "curious", "mischievous"];
  const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
  return {
    user: {
      id: 1,
      coins: 100,
      isPremium: false,
      ownedItemIds: [],
      ownedPetIds: ["tarantula_basic"],
      dailyRewardClaimedAt: null,
    },
    pets: [
      {
        id: 1,
        userId: 1,
        petType: "tarantula",
        name: "Spidey",
        hunger: 80,
        happiness: 80,
        health: 100,
        cleanliness: 90,
        energy: 90,
        trust: 50,
        aggression: 20,
        boredom: 10,
        age: 0,
        isAlive: true,
        isDead: false,
        isActive: true,
        personality: randomPersonality,
        growthStage: "baby",
        lastUpdatedAt: new Date().toISOString(),
      },
    ],
    nextPetId: 2,
    settings: defaultSettings(),
  };
}

export function getStore(): Store {
  if (_store) return _store;
  const dbPath = getDbPath();
  if (fs.existsSync(dbPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(dbPath, "utf-8")) as Store;
      // Migrate missing fields
      if (!raw.settings) raw.settings = defaultSettings();
      if (raw.pets) {
        raw.pets = raw.pets.map(p => ({
          energy: 90,
          trust: 50,
          aggression: 20,
          boredom: 10,
          personality: "curious" as Personality,
          growthStage: "baby" as GrowthStage,
          ...p,
        }));
      }
      _store = raw;
    } catch {
      _store = defaultStore();
    }
  } else {
    _store = defaultStore();
  }
  return _store;
}

export function saveStore(): void {
  if (!_store) return;
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(_store, null, 2), "utf-8");
}

export function getUser(): DbUser { return getStore().user; }
export function updateUser(patch: Partial<DbUser>): DbUser {
  const s = getStore(); s.user = { ...s.user, ...patch }; saveStore(); return s.user;
}

export function getSettings(): DbSettings { return getStore().settings; }
export function updateSettings(patch: Partial<DbSettings>): DbSettings {
  const s = getStore(); s.settings = { ...s.settings, ...patch }; saveStore(); return s.settings;
}

export function getActivePet(): DbPet | undefined {
  return getStore().pets.find(p => p.isActive);
}
export function updateActivePet(patch: Partial<DbPet>): DbPet | null {
  const s = getStore();
  const idx = s.pets.findIndex(p => p.isActive);
  if (idx === -1) return null;
  s.pets[idx] = { ...s.pets[idx], ...patch };
  saveStore();
  return s.pets[idx];
}
export function addPet(pet: Omit<DbPet, "id">): DbPet {
  const s = getStore();
  const np: DbPet = { ...pet, id: s.nextPetId++ };
  s.pets.push(np); saveStore(); return np;
}
export function setActivePet(petId: number): DbPet | null {
  const s = getStore();
  s.pets = s.pets.map(p => ({ ...p, isActive: p.id === petId }));
  const active = s.pets.find(p => p.isActive) ?? null;
  saveStore(); return active;
}
export function getAllPets(): DbPet[] { return getStore().pets; }
